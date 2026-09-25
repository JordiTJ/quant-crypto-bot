/**
 * Volatility-Adjusted Risk Management Engine
 * Enforces hard risk limits, circuit breakers, and correlation gates.
 * NEVER MARTINGALE. NEVER UNLIMITED AVERAGING DOWN.
 */

import { Position, RiskConfig, MarketRegime } from '../types';
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
      ...savedConfig
    };
  }

  getConfig(): RiskConfig {
    return { ...this.config };
  }

  getRiskStatus() {
    const cooldownActive = Date.now() < this.cooldownUntilTimestamp;
    const remainingMinutes = cooldownActive ? Math.max(1, Math.ceil((this.cooldownUntilTimestamp - Date.now()) / 60000)) : 0;
    return {
      consecutiveLosses: this.consecutiveLosses,
      consecutiveLossCooldownCount: this.config.consecutiveLossCooldownCount,
      cooldownHours: this.config.cooldownHours,
      cooldownActive,
      cooldownUntilTimestamp: this.cooldownUntilTimestamp,
      remainingMinutes
    };
  }

  resetCooldown(): void {
    this.consecutiveLosses = 0;
    this.cooldownUntilTimestamp = 0;
    console.log('[RiskEngine] Consecutive loss cooldown manually reset by user.');
  }

  updateConfig(updates: Partial<RiskConfig>): void {
    this.config = { ...this.config, ...updates };
    globalStorageManager.updateState({ riskConfig: this.config }, true);
  }

  setEquity(equity: number): void {
    this.currentEquityUsd = equity;
    if (equity > this.peakEquityUsd) {
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

  resetDailyCounters(): void {
    this.dailyRealizedPnlUsd = 0;
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
    const dailyLossPercent = (Math.abs(Math.min(0, this.dailyRealizedPnlUsd)) / this.peakEquityUsd) * 100;
    if (dailyLossPercent >= this.config.maxDailyLossPercent) {
      return { allowed: false, reason: `DAILY_LOSS_LIMIT_REACHED: Daily loss (-${dailyLossPercent.toFixed(2)}%) reached limit of ${this.config.maxDailyLossPercent}%.` };
    }

    // 2. Max Drawdown Circuit Breakers
    const currentDrawdownPercent = ((this.peakEquityUsd - this.currentEquityUsd) / this.peakEquityUsd) * 100;
    if (currentDrawdownPercent >= this.config.maxDrawdownEmergencyPercent) {
      return { allowed: false, reason: `MAX_DRAWDOWN_EMERGENCY: Drawdown (${currentDrawdownPercent.toFixed(2)}%) reached emergency halt limit of ${this.config.maxDrawdownEmergencyPercent}%.` };
    }
    if (currentDrawdownPercent >= this.config.maxDrawdownPausePercent) {
      return { allowed: false, reason: `MAX_DRAWDOWN_PAUSE: Drawdown (${currentDrawdownPercent.toFixed(2)}%) exceeded pause threshold of ${this.config.maxDrawdownPausePercent}%.` };
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
    const totalExposureUsd = existingPositions.reduce((acc, p) => acc + p.valueUsd, 0);
    const totalExposurePct = (totalExposureUsd / this.currentEquityUsd) * 100;
    if (totalExposurePct >= this.config.maxTotalPortfolioExposurePercent) {
      return { allowed: false, reason: `PORTFOLIO_EXPOSURE_CAP: Total portfolio exposure is ${totalExposurePct.toFixed(1)}% (max ${this.config.maxTotalPortfolioExposurePercent}%).` };
    }

    // 6. BTC Market Regime & Correlation Filter
    // If BTC is in a STRONG_BEAR market, block new altcoin longs to avoid false correlation entries
    if (candidateSymbol !== 'BTCUSDT' && btcRegime === 'STRONG_BEAR') {
      return { allowed: false, reason: 'CORRELATION_GUARD: BTC macro regime is STRONG_BEAR. High-risk altcoin longs are suspended.' };
    }

    // 7. Correlation cluster limit (e.g. limit altcoins in same cluster)
    const nonBtcPositions = existingPositions.filter(p => p.symbol !== 'BTCUSDT');
    if (candidateSymbol !== 'BTCUSDT' && nonBtcPositions.length >= this.config.maxCorrelatedPositions) {
      return { allowed: false, reason: `CORRELATION_LIMIT: Maximum of ${this.config.maxCorrelatedPositions} simultaneous correlated altcoin positions reached.` };
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
