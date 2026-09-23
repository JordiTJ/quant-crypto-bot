/**
 * Discord Notification Service
 * Sends real-time trade signals, entry/exit executions, risk circuit breaker alerts,
 * and emergency warnings to a Discord channel via Webhook embeds.
 */

import { Position, TradeRecord, DiscordConfig } from '../types';
import { globalStorageManager } from '../storage/storageManager';

export class DiscordNotifier {
  private static instance: DiscordNotifier;
  private config: DiscordConfig;

  private constructor() {
    this.config = globalStorageManager.getState().discordConfig || {
      webhookUrl: '',
      enabled: false,
      notifyOnEntries: true,
      notifyOnExits: true,
      notifyOnRiskBreach: true,
      notifyOnBotToggle: true
    };
  }

  public static getInstance(): DiscordNotifier {
    if (!DiscordNotifier.instance) {
      DiscordNotifier.instance = new DiscordNotifier();
    }
    return DiscordNotifier.instance;
  }

  public getConfig(): DiscordConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<DiscordConfig>): DiscordConfig {
    this.config = {
      ...this.config,
      ...updates
    };
    globalStorageManager.updateState({ discordConfig: this.config }, true);
    return this.config;
  }

  private isDiscordUrl(url?: string): boolean {
    if (!url) return false;
    const trimmed = url.trim();
    return trimmed.startsWith('https://discord.com/api/webhooks/') || 
           trimmed.startsWith('https://discordapp.com/api/webhooks/');
  }

  private async postToDiscord(payload: any): Promise<{ success: boolean; error?: string }> {
    const url = this.config.webhookUrl?.trim();
    if (!url || !this.isDiscordUrl(url)) {
      return { 
        success: false, 
        error: 'Ongeldige Discord Webhook URL (moet beginnen met https://discord.com/api/webhooks/)' 
      };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'QuantCrypto Bot',
          avatar_url: 'https://cdn-icons-png.flaticon.com/512/2592/2592231.png',
          ...payload
        })
      });

      // Discord responds with 204 No Content or 200 on success
      if (res.ok) {
        return { success: true };
      }

      const text = await res.text();
      return { success: false, error: `Discord HTTP ${res.status}: ${text}` };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verbinding met Discord mislukt' };
    }
  }

  public async testWebhook(testUrl?: string): Promise<{ success: boolean; error?: string }> {
    const targetUrl = (testUrl || this.config.webhookUrl)?.trim();
    if (!targetUrl || !this.isDiscordUrl(targetUrl)) {
      return { success: false, error: 'Vul een geldige Discord Webhook URL in (https://discord.com/api/webhooks/...)' };
    }

    const payload = {
      embeds: [
        {
          title: '✅ QuantCrypto Discord Webhook Gekoppeld',
          description: 'Verbindingstest geslaagd! Vanaf nu ontvang je in dit Discord-kanaal real-time alerts bij trade entries, take profits, stop losses en risico circuit breakers.',
          color: 0x06b6d4, // Cyan
          fields: [
            { name: 'Status', value: '🟢 Live Verbonden', inline: true },
            { name: 'Tijdstip', value: new Date().toLocaleString('nl-NL'), inline: true },
            { name: 'Host', value: 'QuantCrypto Engine v2.4', inline: true }
          ],
          footer: {
            text: 'QuantCrypto Algorithmic Trading Architecture'
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'QuantCrypto Bot',
          avatar_url: 'https://cdn-icons-png.flaticon.com/512/2592/2592231.png',
          ...payload
        })
      });

      if (res.ok) {
        return { success: true };
      }
      const text = await res.text();
      return { success: false, error: `Discord HTTP ${res.status}: ${text}` };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verbindingsfout met Discord' };
    }
  }

  public async notifyTradeEntry(position: Position): Promise<void> {
    if (!this.config.enabled || !this.config.notifyOnEntries) return;

    const payload = {
      embeds: [
        {
          title: `🟢 [BUY ENTRY] ${position.symbol} (${position.side})`,
          description: `Nieuwe positie geopend door de automatische strategie **${position.strategy}**.`,
          color: 0x10b981, // Emerald Green
          fields: [
            { name: 'Entry Koers', value: `$${position.entryPrice.toLocaleString()}`, inline: true },
            { name: 'Positiegrootte', value: `$${position.valueUsd.toFixed(2)} (${position.amount})`, inline: true },
            { name: 'Stop Loss', value: `$${position.stopLoss.toLocaleString()}`, inline: true },
            { name: 'Take Profit 1', value: `$${position.takeProfit1.toLocaleString()}`, inline: true },
            { name: 'Take Profit 2', value: `$${position.takeProfit2.toLocaleString()}`, inline: true },
            { name: 'Order ID', value: `\`${position.clientOrderId}\``, inline: true }
          ],
          footer: {
            text: 'QuantCrypto Auto-Trading Bot'
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    await this.postToDiscord(payload);
  }

  public async notifyTradeExit(trade: TradeRecord): Promise<void> {
    if (!this.config.enabled || !this.config.notifyOnExits) return;

    const isWin = trade.netPnl >= 0;
    const color = isWin ? 0x10b981 : 0xf43f5e; // Green vs Red
    const emoji = isWin ? '🎯' : '🛑';
    const sign = isWin ? '+' : '';

    const payload = {
      embeds: [
        {
          title: `${emoji} [TRADE EXIT] ${trade.symbol} • ${trade.exitReason}`,
          description: `Positie gesloten met ${isWin ? 'winst' : 'verlies'}: **${sign}$${trade.netPnl.toFixed(2)} (${sign}${trade.netPnlPercent.toFixed(2)}%)**`,
          color,
          fields: [
            { name: 'Entry Koers', value: `$${trade.entryPrice.toLocaleString()}`, inline: true },
            { name: 'Exit Koers', value: `$${trade.exitPrice.toLocaleString()}`, inline: true },
            { name: 'Netto P&L', value: `**${sign}$${trade.netPnl.toFixed(2)}**`, inline: true },
            { name: 'R-Multiple', value: `${trade.returnR.toFixed(2)}R`, inline: true },
            { name: 'Reden', value: trade.exitReason, inline: true },
            { name: 'Transactiekosten', value: `$${trade.feesPaid.toFixed(2)}`, inline: true }
          ],
          footer: {
            text: 'QuantCrypto Risk & Execution Engine'
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    await this.postToDiscord(payload);
  }

  public async notifyRiskBreach(reason: string, details: string): Promise<void> {
    if (!this.config.enabled || !this.config.notifyOnRiskBreach) return;

    const payload = {
      embeds: [
        {
          title: `⚠️ [RISICO ALERT] Circuit Breaker Geactiveerd`,
          description: `**${reason}**\n${details}`,
          color: 0xf59e0b, // Amber
          fields: [
            { name: 'Status', value: 'Nieuwe entries automatisch geblokkeerd', inline: true },
            { name: 'Kapitaalbescherming', value: 'Actief (No Martingale)', inline: true }
          ],
          footer: {
            text: 'QuantCrypto Volatility Risk Engine'
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    await this.postToDiscord(payload);
  }

  public async notifyKillSwitch(active: boolean): Promise<void> {
    if (!this.config.enabled) return;

    const payload = {
      embeds: [
        {
          title: active 
            ? '🚨 [EMERGENCY KILL SWITCH ACTIEF]' 
            : '🛡️ [EMERGENCY KILL SWITCH GERESET]',
          description: active 
            ? 'Alle posities zijn met spoed gesloten en actieve orders geannuleerd.'
            : 'Het systeem is weer in normale handelsmodus teruggezet.',
          color: active ? 0xef4444 : 0x06b6d4,
          fields: [
            { name: 'Status', value: active ? 'BLOKKADE ACTIEF' : 'NORMAAL', inline: true },
            { name: 'Tijdstip', value: new Date().toLocaleTimeString('nl-NL'), inline: true }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    await this.postToDiscord(payload);
  }

  public async notifyBotToggle(active: boolean): Promise<void> {
    if (!this.config.enabled || !this.config.notifyOnBotToggle) return;

    const payload = {
      embeds: [
        {
          title: active 
            ? '🤖 [AUTO-TRADING BOT INGESCHAKELD]' 
            : '⏸️ [AUTO-TRADING BOT UITGESCHAKELD]',
          description: active
            ? 'De bot scant nu 24/7 autonoom de markten op zoek naar A+ setups.'
            : 'Automatische order-executie is gepauzeerd.',
          color: active ? 0x06b6d4 : 0x64748b,
          fields: [
            { name: 'Modus', value: active ? '24/7 DAEMON ACTIEF' : 'HANDMATIG', inline: true },
            { name: 'Tijdstip', value: new Date().toLocaleTimeString('nl-NL'), inline: true }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    await this.postToDiscord(payload);
  }
}

export const globalDiscordNotifier = DiscordNotifier.getInstance();
