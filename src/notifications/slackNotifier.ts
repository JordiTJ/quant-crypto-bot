/**
 * Slack Notification Service
 * Sends real-time trade signals, entry/exit executions, risk circuit breaker alerts,
 * and emergency warnings to a configured Slack channel via Incoming Webhook.
 */

import { Position, TradeRecord, SlackConfig } from '../types';
import { globalStorageManager } from '../storage/storageManager';

export class SlackNotifier {
  private static instance: SlackNotifier;
  private config: SlackConfig;

  private constructor() {
    this.config = globalStorageManager.getState().slackConfig || {
      webhookUrl: '',
      enabled: false,
      notifyOnEntries: true,
      notifyOnExits: true,
      notifyOnRiskBreach: true,
      notifyOnBotToggle: true
    };
  }

  public static getInstance(): SlackNotifier {
    if (!SlackNotifier.instance) {
      SlackNotifier.instance = new SlackNotifier();
    }
    return SlackNotifier.instance;
  }

  public getConfig(): SlackConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<SlackConfig>): SlackConfig {
    this.config = {
      ...this.config,
      ...updates
    };
    globalStorageManager.updateState({ slackConfig: this.config }, true);
    return this.config;
  }

  private async postToSlack(payload: any): Promise<{ success: boolean; error?: string }> {
    const url = this.config.webhookUrl?.trim();
    if (!url || !url.startsWith('https://hooks.slack.com/')) {
      return { success: false, error: 'Ongeldige Slack Webhook URL (moet beginnen met https://hooks.slack.com/)' };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: `Slack response ${res.status}: ${text}` };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verbinding met Slack mislukt' };
    }
  }

  public async testWebhook(testUrl?: string): Promise<{ success: boolean; error?: string }> {
    const targetUrl = (testUrl || this.config.webhookUrl)?.trim();
    if (!targetUrl || !targetUrl.startsWith('https://hooks.slack.com/')) {
      return { success: false, error: 'Vul eerst een geldige Slack Webhook URL in.' };
    }

    const payload = {
      text: '🤖 *[QuantCrypto Bot]* Verbindingstest geslaagd! Je Slack-kanaal is nu succesvol gekoppeld.',
      attachments: [
        {
          color: '#06b6d4', // Cyan
          title: '✅ QuantCrypto Slack Alerts Ingeschakeld',
          text: 'Vanaf nu ontvang je hier direct meldingen bij trade entries, Stop Loss / Take Profit triggers en risico circuit breakers.',
          fields: [
            { title: 'Status', value: 'Live Verbonden', short: true },
            { title: 'Tijdstip', value: new Date().toLocaleString('nl-NL'), short: true }
          ],
          footer: 'QuantCrypto Algorithmic Trading Bot'
        }
      ]
    };

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        return { success: true };
      }
      const text = await res.text();
      return { success: false, error: `Slack HTTP ${res.status}: ${text}` };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verbindingsfout met Slack' };
    }
  }

  public async notifyTradeEntry(position: Position): Promise<void> {
    if (!this.config.enabled || !this.config.notifyOnEntries) return;

    const payload = {
      text: `🟢 *[TRADE ENTRY] Geopende positie op ${position.symbol}*`,
      attachments: [
        {
          color: '#10b981', // Emerald green
          title: `BUY ${position.symbol} (${position.side})`,
          fields: [
            { title: 'Entry Koers', value: `$${position.entryPrice.toLocaleString()}`, short: true },
            { title: 'Positiegrootte', value: `$${position.valueUsd.toFixed(2)} (${position.amount} stuks)`, short: true },
            { title: 'Stop Loss', value: `$${position.stopLoss.toLocaleString()}`, short: true },
            { title: 'Take Profit 1', value: `$${position.takeProfit1.toLocaleString()}`, short: true },
            { title: 'Take Profit 2', value: `$${position.takeProfit2.toLocaleString()}`, short: true },
            { title: 'Strategie', value: position.strategy, short: true }
          ],
          footer: `QuantCrypto Auto-Trading • ${new Date().toLocaleTimeString('nl-NL')}`
        }
      ]
    };

    await this.postToSlack(payload);
  }

  public async notifyTradeExit(trade: TradeRecord): Promise<void> {
    if (!this.config.enabled || !this.config.notifyOnExits) return;

    const isWin = trade.netPnl >= 0;
    const color = isWin ? '#10b981' : '#f43f5e'; // Green vs Red
    const emoji = isWin ? '🎯' : '🛑';
    const sign = isWin ? '+' : '';

    const payload = {
      text: `${emoji} *[TRADE EXIT] ${trade.symbol} gesloten via ${trade.exitReason}*`,
      attachments: [
        {
          color,
          title: `${trade.symbol} • ${isWin ? 'Winst' : 'Verlies'}: ${sign}$${trade.netPnl.toFixed(2)} (${sign}${trade.netPnlPercent.toFixed(2)}%)`,
          fields: [
            { title: 'Exit Prijs', value: `$${trade.exitPrice.toLocaleString()}`, short: true },
            { title: 'Reden van Sluiting', value: trade.exitReason, short: true },
            { title: 'Netto P&L ($)', value: `${sign}$${trade.netPnl.toFixed(2)}`, short: true },
            { title: 'R-Multiple', value: `${trade.returnR.toFixed(2)}R`, short: true }
          ],
          footer: `QuantCrypto Risk Engine • ${new Date().toLocaleTimeString('nl-NL')}`
        }
      ]
    };

    await this.postToSlack(payload);
  }

  public async notifyRiskBreach(reason: string, details: string): Promise<void> {
    if (!this.config.enabled || !this.config.notifyOnRiskBreach) return;

    const payload = {
      text: `⚠️ *[RISICO ALERT] Circuit breaker getriggerd!*`,
      attachments: [
        {
          color: '#f59e0b', // Amber/orange
          title: `Risicolimiet Bereikt: ${reason}`,
          text: details,
          fields: [
            { title: 'Actie', value: 'Nieuwe entries tijdelijk gepauzeerd ter bescherming van kapitaal', short: false }
          ],
          footer: `QuantCrypto Risk Circuit • ${new Date().toLocaleTimeString('nl-NL')}`
        }
      ]
    };

    await this.postToSlack(payload);
  }

  public async notifyKillSwitch(active: boolean): Promise<void> {
    if (!this.config.enabled) return;

    const payload = {
      text: active 
        ? `🚨 *[EMERGENCY KILL SWITCH ACTIEF]* Alle posities zijn gesloten en alle orders geannuleerd!`
        : `🛡️ *[EMERGENCY KILL SWITCH GERESET]* Systeem is weer in normale handelsmodus gebracht.`,
      attachments: [
        {
          color: active ? '#ef4444' : '#06b6d4',
          title: active ? 'Noodstop Ingeschakeld' : 'Noodstop Uitgeschakeld',
          fields: [
            { title: 'Tijdstip', value: new Date().toLocaleString('nl-NL'), short: true },
            { title: 'Status', value: active ? 'BLOKKADE ACTIEF' : 'NORMAAL', short: true }
          ]
        }
      ]
    };

    await this.postToSlack(payload);
  }

  public async notifyBotToggle(active: boolean): Promise<void> {
    if (!this.config.enabled || !this.config.notifyOnBotToggle) return;

    const payload = {
      text: active 
        ? `🤖 *[AUTO-TRADING BOT]* Ingeschakeld! De bot scant nu 24/7 de markt en plaatst autonoom orders.`
        : `⏸️ *[AUTO-TRADING BOT]* Uitgeschakeld. Automatische order-executie is gepauzeerd.`,
      attachments: [
        {
          color: active ? '#06b6d4' : '#64748b',
          fields: [
            { title: 'Modus', value: active ? '24/7 ACHTERGROND DAEMON ACTIEF' : 'HANDMATIG', short: true },
            { title: 'Tijdstip', value: new Date().toLocaleString('nl-NL'), short: true }
          ]
        }
      ]
    };

    await this.postToSlack(payload);
  }
}

export const globalSlackNotifier = SlackNotifier.getInstance();
