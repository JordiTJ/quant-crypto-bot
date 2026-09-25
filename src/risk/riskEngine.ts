/**
 * Volatility-Adjusted Risk Management Engine
 * Enforces hard risk limits, circuit breakers, and correlation gates.
 * NEVER MARTINGALE. NEVER UNLIMITED AVERAGING DOWN.
 */

import { Position, RiskConfig, RiskStatus, MarketRegime } from '../types';
import { globalStorageManager } from '../storage/storageManager';

export class RiskEngine {
  private config: RiskConfig;
  private dailyRealizedPnlUsd = 0;
  private peakEquityUsd = 10000;
  private currentEquityUsd = 10000;
  private consecutiveLosses = 0;
  private cooldownUntilTimestamp = 0;

  constructor() {
    const savedConfig = globalStorageManager.getState().riskConfig || {};
    this.config = {
      riskPerTradePercent: 0.5,
      maxDailyLossPercent: 2.0,
      maxWeeklyLossPercent: 5.0,
      maxDrawdownPausePercent: 5.0,
      maxDrawdownEmergencyPercent: 10.0,
      maxOpenPositions: 5,
      maxExposurePerCoinPercent: 20.0,
      maxTotalPortfolioExposurePercent: 60.0,
      maxCorrelatedPositions: 3,
      consecutiveLossCooldownCount: 3,
      cooldownHours: 4,
      emergencyKillSwitchActive: false,
      bypassDailyLossLimit: false,
      bypassDrawdownLimit: false,
      bypassBtcCorrelationGuard: false,
      bypassCorrelatedPositionsLimit: false,
      bypassMaxExposureCap: false,
      ...savedConfig
    };
  }

  getConfig(): RiskConfig {
    return { ...this.config };
  }

  getRiskStatus() {
    const cooldownActive = Date.now() < this.cooldownUntilTimestamp;
    const remainingMinutes = cooldownActive ? Math.max(1, Math.ceil((this.cooldownUntilTimestamp - Date.now()) / 60000)) : 0;
    
    // Drawdown calculation with division-by-zero safeguard
    const safePeak = Math.max(1, this.peakEquityUsd);
    const safeCurrent = Math.max(0, this.currentEquityUsd);
    const currentDrawdownPercent = safeCurrent >= safePeak ? 0 : Number((((safePeak - safeCurrent) / safePeak) * 100).toFixed(2));
    
    const dailyLossPercent = safePeak > 0 ? Number(((Math.abs(Math.min(0, this.dailyRealizedPnlUsd)) / safePeak) * 100).toFixed(2)) : 0;

    const isDrawdownHalted = !this.config.bypassDrawdownLimit && currentDrawdownPercent >= this.config.maxDrawdownEmergencyPercent;
    const isDrawdownPaused = !this.config.bypassDrawdownLimit && currentDrawdownPercent >= this.config.maxDrawdownPausePercent;
    const isDailyLossHalted = !this.config.bypassDailyLossLimit && dailyLossPercent >= this.config.maxDailyLossPercent;

    // Build active blocks list
    const activeBlocks: RiskStatus['activeBlocks'] = [];

    if (this.config.emergencyKillSwitchActive) {
      activeBlocks.push({
        type: 'KILL_SWITCH',
        title: 'Master Emergency Kill Switch Actief',
        description: 'Alle orderplaatsingen zijn direct handmatig geblokkeerd.',
        canReset: true
      });
    }

    if (cooldownActive) {
      activeBlocks.push({
        type: 'COOLDOWN',
        title: 'Consecutive Loss Cooldown Actief',
        description: `Pauze ingesteld wegens ${this.consecutiveLosses} opeenvolgende verliezen (${remainingMinutes} min resterend).`,
        canReset: true
      });
    }

    if (isDrawdownHalted) {
      activeBlocks.push({
        type: 'DRAWDOWN_EMERGENCY',
        title: 'Max Drawdown Noodstop Bereikt',
        description: `Drawdown (${currentDrawdownPercent}%) overschrijdt noodlimiet (${this.config.maxDrawdownEmergencyPercent}%). Piek: $${this.peakEquityUsd.toLocaleString()}, Huidig: $${this.currentEquityUsd.toLocaleString()}.`,
        canReset: true,
        canBypass: true,
        bypassKey: 'bypassDrawdownLimit'
      });
    } else if (isDrawdownPaused) {
      activeBlocks.push({
        type: 'DRAWDOWN_PAUSE',
        title: 'Max Drawdown Pauzedrempel Overschreden',
        description: `Drawdown (${currentDrawdownPercent}%) overschrijdt waarschuwingsdrempel (${this.config.maxDrawdownPausePercent}%).`,
        canReset: true,
        canBypass: true,
        bypassKey: 'bypassDrawdownLimit'
      });
    }

    if (isDailyLossHalted) {
      activeBlocks.push({
        type: 'DAILY_LOSS',
        title: 'Max Daily Loss Limiet Bereikt',
        description: `Dagverlies (-$${Math.abs(this.dailyRealizedPnlUsd).toFixed(2)}, ${dailyLossPercent}%) bereikte de daglimiet van ${this.config.maxDailyLossPercent}%.`,
        canReset: true,
        canBypass: true,
        bypassKey: 'bypassDailyLossLimit'
      });
    }

    return {
      consecutiveLosses: this.consecutiveLosses,
      consecutiveLossCooldownCount: this.config.consecutiveLossCooldownCount,
      cooldownHours: this.config.cooldownHours,
      cooldownActive,
      cooldownUntilTimestamp: this.cooldownUntilTimestamp,
      remainingMinutes,
      peakEquityUsd: Number(this.peakEquityUsd.toFixed(2)),
      currentEquityUsd: Number(this.currentEquityUsd.toFixed(2)),
      currentDrawdownPercent,
      dailyRealizedPnlUsd: Number(this.dailyRealizedPnlUsd.toFixed(2)),
      dailyLossPercent,
      isDrawdownHalted,
      isDrawdownPaused,
      isDailyLossHalted,
      activeBlocks
    };
  }

  resetCooldown(): void {
    this.consecutiveLosses = 0;
    this.cooldownUntilTimestamp = 0;
    console.log('[RiskEngine] Consecutive loss cooldown manually reset by user.');
  }

  resetDrawdown(newEquity?: number): void {
    if (typeof newEquity === 'number' && newEquity > 0) {
      this.currentEquityUsd = newEquity;
      this.peakEquityUsd = newEquity;
    } else {
      // Calibrate peak to current equity
      this.peakEquityUsd = Math.max(100, this.currentEquityUsd);
    }
    console.log(`[RiskEngine] Drawdown counters reset. Peak calibrated to $${this.peakEquityUsd}.`);
  }

  resetDailyCounters(): void {
    this.dailyRealizedPnlUsd = 0;
    console.log('[RiskEngine] Daily loss counters reset.');
  }

  resetAllCircuitBreakers(currentEquity?: number): void {
    this.consecutiveLosses = 0;
    this.cooldownUntilTimestamp = 0;
    this.dailyRealizedPnlUsd = 0;
    this.config.emergencyKillSwitchActive = false;
    this.resetDrawdown(currentEquity);
    globalStorageManager.updateState({ riskConfig: this.config }, true);
    console.log('[RiskEngine] Alle risicoblokkades en circuit breakers gereset door gebruiker.');
  }

  updateConfig(updates: Partial<RiskConfig>): void {
    this.config = { ...this.config, ...updates };
    globalStorageManager.updateState({ riskConfig: this.config }, true);
  }

  setEquity(equity: number): void {
    if (equity <= 0) return;
    this.currentEquityUsd = equity;
    if (equity > this.peakEquityUsd || this.peakEquityUsd <= 0) {
      this.peakEquityUsd = equity;
    }
  }

  syncEquityWithExchange(equity: number): void {
    if (equity <= 0) return;
    this.currentEquityUsd = equity;
    // If peak was uninitialized or below, set it
    if (this.peakEquityUsd <= 0 || equity > this.peakEquityUsd) {
      this.peakEquityUsd = equity;
    }
  }

  recordTradeResult(netPnl: number): void {
    this.dailyRealizedPnlUsd += netPnl;
    this.currentEquityUsd = Number((this.currentEquityUsd + netPnl).toFixed(2));
    if (this.currentEquityUsd > this.peakEquityUsd) {
      this.peakEquityUsd = this.currentEquityUsd;
    }
    if (netPnl < 0) {
      this.consecutiveLosses++;
      if (this.consecutiveLosses >= this.config.consecutiveLossCooldownCount) {
        this.cooldownUntilTimestamp = Date.now() + this.config.cooldownHours * 3600 * 1000;
        console.warn(`[RiskEngine] Cooldown active until ${new Date(this.cooldownUntilTimestamp).toISOString()} due to ${this.consecutiveLosses} consecutive losses.`);
      }
    } else {
      this.consecutiveLosses = 0;
    }
  }

  /**
   * Check if any circuit breaker prohibits new entries
   */
  canOpenNewPosition(existingPositions: Position[], btcRegime: MarketRegime, candidateSymbol: string): { allowed: boolean; reason?: string } {
    if (this.config.emergencyKillSwitchActive) {
      return { allowed: false, reason: 'EMERGENCY_KILL_SWITCH_ACTIVE: All trading blocked.' };
    }

    if (Date.now() < this.cooldownUntilTimestamp) {
      const remainingMin = Math.round((this.cooldownUntilTimestamp - Date.now()) / 60000);
      return { allowed: false, reason: `CONSECUTIVE_LOSS_COOLDOWN: Cooldown active for ${remainingMin} more minutes.` };
    }

    // 1. Max Daily Loss check
    if (!this.config.bypassDailyLossLimit) {
      const safePeak = Math.max(1, this.peakEquityUsd);
      const dailyLossPercent = (Math.abs(Math.min(0, this.dailyRealizedPnlUsd)) / safePeak) * 100;
      if (dailyLossPercent >= this.config.maxDailyLossPercent) {
        return { allowed: false, reason: `DAILY_LOSS_LIMIT_REACHED: Daily loss (-${dailyLossPercent.toFixed(2)}%) reached limit of ${this.config.maxDailyLossPercent}%.` };
      }
    }

    // 2. Max Drawdown Circuit Breakers (only if currentEquity is tracked and peak is valid)
    if (!this.config.bypassDrawdownLimit) {
      const safePeak = Math.max(1, this.peakEquityUsd);
      const safeCurrent = Math.max(0, this.currentEquityUsd);
      const currentDrawdownPercent = safeCurrent >= safePeak ? 0 : ((safePeak - safeCurrent) / safePeak) * 100;

      if (currentDrawdownPercent >= this.config.maxDrawdownEmergencyPercent) {
        return { allowed: false, reason: `MAX_DRAWDOWN_EMERGENCY: Drawdown (${currentDrawdownPercent.toFixed(2)}%) reached emergency halt limit of ${this.config.maxDrawdownEmergencyPercent}%.` };
      }
      if (currentDrawdownPercent >= this.config.maxDrawdownPausePercent) {
        return { allowed: false, reason: `MAX_DRAWDOWN_PAUSE: Drawdown (${currentDrawdownPercent.toFixed(2)}%) exceeded pause threshold of ${this.config.maxDrawdownPausePercent}%.` };
      }
    }

    // 3. Max Open Positions
    if (existingPositions.length >= this.config.maxOpenPositions) {
      return { allowed: false, reason: `MAX_POSITIONS_REACHED: Currently at capacity (${existingPositions.length}/${this.config.maxOpenPositions}).` };
    }

    // 4. Duplicate Symbol check
    if (existingPositions.some(p => p.symbol === candidateSymbol)) {
      return { allowed: false, reason: `DUPLICATE_POSITION: Position already open for ${candidateSymbol}.` };
    }

    // 5. Total Exposure check
    if (!this.config.bypassMaxExposureCap) {
      const safeCurrent = Math.max(100, this.currentEquityUsd);
      const totalExposureUsd = existingPositions.reduce((acc, p) => acc + p.valueUsd, 0);
      const totalExposurePct = (totalExposureUsd / safeCurrent) * 100;
      if (totalExposurePct >= this.config.maxTotalPortfolioExposurePercent) {
        return { allowed: false, reason: `PORTFOLIO_EXPOSURE_CAP: Total portfolio exposure is ${totalExposurePct.toFixed(1)}% (max ${this.config.maxTotalPortfolioExposurePercent}%).` };
      }
    }

    // 6. BTC Market Regime & Correlation Filter
    // If BTC is in a STRONG_BEAR market, block new altcoin longs to avoid false correlation entries
    if (!this.config.bypassBtcCorrelationGuard && candidateSymbol !== 'BTCUSDT' && btcRegime === 'STRONG_BEAR') {
      return { allowed: false, reason: 'CORRELATION_GUARD: BTC macro regime is STRONG_BEAR. High-risk altcoin longs are suspended.' };
    }

    // 7. Correlation cluster limit (e.g. limit altcoins in same cluster)
    if (!this.config.bypassCorrelatedPositionsLimit) {
      const nonBtcPositions = existingPositions.filter(p => p.symbol !== 'BTCUSDT');
      if (candidateSymbol !== 'BTCUSDT' && nonBtcPositions.length >= this.config.maxCorrelatedPositions) {
        return { allowed: false, reason: `CORRELATION_LIMIT: Maximum of ${this.config.maxCorrelatedPositions} simultaneous correlated altcoin positions reached.` };
      }
    }

    return { allowed: true };
  }

  /**
   * Volatility-adjusted position sizing:
   * Risk Amount = Equity * Risk%
   * Position Size = Risk Amount / Stop Distance
   */
  calculatePositionSize(
    equityUsd: number,
    entryPrice: number,
    stopLossPrice: number,
    symbol: string
  ): { amount: number; valueUsd: number; riskAmountUsd: number; effectiveRiskPercent: number } {
    const riskAmountUsd = equityUsd * (this.config.riskPerTradePercent / 100);
    const stopDistance = Math.abs(entryPrice - stopLossPrice);

    if (stopDistance <= 0 || entryPrice <= 0) {
      return { amount: 0, valueUsd: 0, riskAmountUsd: 0, effectiveRiskPercent: 0 };
    }

    // Raw position amount = Risk $ / Stop Distance
    let targetAmount = riskAmountUsd / stopDistance;
    let targetValueUsd = targetAmount * entryPrice;

    // Apply Max Exposure per coin cap (e.g. 20% of equity)
    const maxCoinValueUsd = equityUsd * (this.config.maxExposurePerCoinPercent / 100);
    if (targetValueUsd > maxCoinValueUsd) {
      targetValueUsd = maxCoinValueUsd;
      targetAmount = targetValueUsd / entryPrice;
    }

    // Token quantity precision: micro coins like SHIB/PEPE have millions/billions of units, so precision should be 0 (integers).
    // Mid-priced coins (XRP, DOGE, ADA, SUI) typically use 1 or 2 decimals.
    // Low-supply high-price coins (BTC, ETH, TAO) use 4 decimals.
    const isMicroCoin = symbol.includes('SHIB') || symbol.includes('PEPE');
    const isMidCoin = symbol.includes('XRP') || symbol.includes('DOGE') || symbol.includes('ADA') || symbol.includes('SUI');
    const precision = isMicroCoin ? 0 : isMidCoin ? 1 : 4;
    const finalAmount = Number(targetAmount.toFixed(precision));
    const finalValueUsd = Number((finalAmount * entryPrice).toFixed(2));
    const finalRiskAmount = Number((finalAmount * stopDistance).toFixed(2));
    const effectiveRiskPercent = Number(((finalRiskAmount / equityUsd) * 100).toFixed(2));

    return {
      amount: finalAmount,
      valueUsd: finalValueUsd,
      riskAmountUsd: finalRiskAmount,
      effectiveRiskPercent
    };
  }
}

export const globalRiskEngine = new RiskEngine();
