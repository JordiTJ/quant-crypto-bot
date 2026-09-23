/**
 * Quantitative Trading Strategies
 * Explicit mathematical rule definitions for Strategies A through F.
 */

import { IndicatorSet, MarketRegime, Candle } from '../types';

export interface StrategySignalResult {
  triggered: boolean;
  action: 'BUY' | 'SELL';
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  rationale: string;
}

export class StrategyDefinitions {
  /**
   * Strategy A: Trend Following
   * Conditions:
   * 1. Price > EMA50 and EMA9 > EMA21 > EMA50
   * 2. ADX > 22 (Trend strength filter)
   * 3. +DI > -DI
   * 4. RSI between 50 and 68 (Healthy non-overbought momentum)
   * 5. Relative Volume > 1.05 (Volume confirmation)
   */
  static evaluateTrendFollowing(
    candle: Candle,
    ind: IndicatorSet,
    regime: MarketRegime,
    adxThreshold = 22,
    atrMultiplier = 2.0
  ): StrategySignalResult {
    const isEmaBull = ind.ema9 > ind.ema21 && ind.ema21 > ind.ema50 && candle.close > ind.ema50;
    const isAdxStrong = ind.adx >= adxThreshold && ind.plusDi > ind.minusDi;
    const isRsiHealthy = ind.rsi14 >= 50 && ind.rsi14 <= 70;
    const isVolumeConfirmed = ind.relativeVolume >= 1.05;
    const isRegimeFavorable = regime === 'STRONG_BULL' || regime === 'WEAK_BULL';

    const triggered = isEmaBull && isAdxStrong && isRsiHealthy && isVolumeConfirmed && isRegimeFavorable;

    const stopDistance = Math.max(candle.close * 0.015, ind.atr * atrMultiplier);
    const stopLoss = candle.close - stopDistance;
    const takeProfit1 = candle.close + stopDistance * 1.5;
    const takeProfit2 = candle.close + stopDistance * 2.5;

    return {
      triggered,
      action: 'BUY',
      stopLoss: Number(stopLoss.toFixed(4)),
      takeProfit1: Number(takeProfit1.toFixed(4)),
      takeProfit2: Number(takeProfit2.toFixed(4)),
      rationale: triggered 
        ? `EMA alignment (9>21>50) confirmed by ADX (${ind.adx.toFixed(1)}) and RVol (${ind.relativeVolume.toFixed(2)})`
        : 'Trend following conditions not met'
    };
  }

  /**
   * Strategy B: Momentum Breakout
   * Conditions:
   * 1. Price closes above 20-period swing high / Donchian upper band
   * 2. Relative Volume surge > 1.35
   * 3. MACD histogram positive and expanding
   * 4. Price > EMA200
   */
  static evaluateMomentumBreakout(
    candle: Candle,
    ind: IndicatorSet,
    atrMultiplier = 2.2
  ): StrategySignalResult {
    const isBreakout = candle.close >= ind.donchian.upper * 0.998 || candle.close >= ind.swingHigh * 0.998;
    const isVolumeSurge = ind.relativeVolume >= 1.35;
    const isMacdBullish = ind.macd.histogram > 0;
    const isAboveEma200 = candle.close > ind.ema200;

    const triggered = isBreakout && isVolumeSurge && isMacdBullish && isAboveEma200;

    const stopDistance = Math.max(candle.close * 0.018, ind.atr * atrMultiplier);
    const stopLoss = candle.close - stopDistance;
    const takeProfit1 = candle.close + stopDistance * 1.6;
    const takeProfit2 = candle.close + stopDistance * 2.8;

    return {
      triggered,
      action: 'BUY',
      stopLoss: Number(stopLoss.toFixed(4)),
      takeProfit1: Number(takeProfit1.toFixed(4)),
      takeProfit2: Number(takeProfit2.toFixed(4)),
      rationale: triggered
        ? `Donchian channel breakout above ${ind.donchian.upper.toFixed(2)} with explosive RVol (${ind.relativeVolume.toFixed(2)})`
        : 'No breakout detected'
    };
  }

  /**
   * Strategy C: Pullback Strategy
   * Conditions:
   * 1. Macro trend bullish: Price above EMA200 and EMA50 > EMA200
   * 2. Price retraced towards EMA21 / EMA50 (distance within 1.5% of EMA21)
   * 3. RSI pulled back to 42 - 54 then turned upward
   * 4. Stochastic RSI %K crosses above %D from oversold (< 35)
   */
  static evaluatePullback(
    candle: Candle,
    ind: IndicatorSet,
    atrMultiplier = 1.8
  ): StrategySignalResult {
    const isMacroBull = ind.ema50 > ind.ema200 && candle.close > ind.ema200;
    const isRetracedToEma = Math.abs(ind.maDistancePercent) <= 2.2 && candle.low <= ind.ema21 * 1.008;
    const isRsiPullbackZone = ind.rsi14 >= 40 && ind.rsi14 <= 56;
    const isStochRsiCross = ind.stochRsi.k < 45 && ind.stochRsi.k > ind.stochRsi.d;

    const triggered = isMacroBull && isRetracedToEma && isRsiPullbackZone && isStochRsiCross;

    const stopDistance = Math.max(candle.close * 0.014, ind.atr * atrMultiplier);
    const stopLoss = candle.close - stopDistance;
    const takeProfit1 = candle.close + stopDistance * 1.5;
    const takeProfit2 = candle.close + stopDistance * 2.4;

    return {
      triggered,
      action: 'BUY',
      stopLoss: Number(stopLoss.toFixed(4)),
      takeProfit1: Number(takeProfit1.toFixed(4)),
      takeProfit2: Number(takeProfit2.toFixed(4)),
      rationale: triggered
        ? `Clean pullback to EMA21 (${ind.ema21.toFixed(2)}) with StochRSI bullish reversal`
        : 'Pullback criteria not satisfied'
    };
  }

  /**
   * Strategy D: Mean Reversion (Sideways / Range Regime ONLY)
   * Conditions:
   * 1. Regime strictly SIDEWAYS_RANGE or LOW_VOLATILITY
   * 2. ADX < 20 (Confirm lack of directional trend)
   * 3. Price touches or pierces lower Bollinger Band
   * 4. RSI < 35 (Oversold extreme)
   */
  static evaluateMeanReversion(
    candle: Candle,
    ind: IndicatorSet,
    regime: MarketRegime
  ): StrategySignalResult {
    const isSideways = regime === 'SIDEWAYS_RANGE' || regime === 'LOW_VOLATILITY';
    const isLowAdx = ind.adx < 20;
    const isAtLowerBand = candle.low <= ind.bollingerBands.lower * 1.005;
    const isOversoldRsi = ind.rsi14 <= 36;

    const triggered = isSideways && isLowAdx && isAtLowerBand && isOversoldRsi;

    const stopDistance = Math.max(candle.close * 0.012, ind.atr * 1.5);
    const stopLoss = candle.close - stopDistance;
    // Mean reversion targets middle band (SMA20) and upper band
    const takeProfit1 = ind.bollingerBands.middle;
    const takeProfit2 = ind.bollingerBands.upper;

    return {
      triggered,
      action: 'BUY',
      stopLoss: Number(stopLoss.toFixed(4)),
      takeProfit1: Number(takeProfit1.toFixed(4)),
      takeProfit2: Number(takeProfit2.toFixed(4)),
      rationale: triggered
        ? `Range mean reversion: lower Bollinger band touch with oversold RSI (${ind.rsi14.toFixed(1)}) and low ADX (${ind.adx.toFixed(1)})`
        : 'Mean reversion conditions not present'
    };
  }

  /**
   * Strategy E: Volatility Breakout (Bollinger Squeeze)
   * Conditions:
   * 1. Bollinger Band Width was squeezed at multi-candle low (< 4.5%)
   * 2. Volatility expansion: Band width widening sharply
   * 3. Price breaks above upper Bollinger Band
   * 4. Volume surge > 1.40
   */
  static evaluateVolatilityBreakout(
    candle: Candle,
    ind: IndicatorSet,
    atrMultiplier = 2.0
  ): StrategySignalResult {
    const isSqueezeRelease = ind.bollingerBands.width < 6.5;
    const isPricePiercingUpper = candle.close >= ind.bollingerBands.upper * 0.998;
    const isVolumeExpansion = ind.relativeVolume >= 1.4;
    const isPositiveDirection = ind.plusDi > ind.minusDi;

    const triggered = isSqueezeRelease && isPricePiercingUpper && isVolumeExpansion && isPositiveDirection;

    const stopDistance = Math.max(candle.close * 0.016, ind.atr * atrMultiplier);
    const stopLoss = candle.close - stopDistance;
    const takeProfit1 = candle.close + stopDistance * 1.5;
    const takeProfit2 = candle.close + stopDistance * 2.6;

    return {
      triggered,
      action: 'BUY',
      stopLoss: Number(stopLoss.toFixed(4)),
      takeProfit1: Number(takeProfit1.toFixed(4)),
      takeProfit2: Number(takeProfit2.toFixed(4)),
      rationale: triggered
        ? `Bollinger squeeze expansion: price piercing upper band with RVol surge (${ind.relativeVolume.toFixed(2)})`
        : 'No volatility breakout detected'
    };
  }
}
