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

function getPriceDecimals(price: number): number {
  if (price >= 100) return 2;
  if (price >= 1) return 4;
  if (price >= 0.001) return 6;
  return 8;
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
    const isAdxStrong = ind.adx >= adxThreshold && ind.plusDi > ind.minusDi && (ind.plusDi - ind.minusDi) >= 2.5;
    const isRsiHealthy = ind.rsi14 >= 50 && ind.rsi14 <= 68;
    const isVolumeConfirmed = ind.relativeVolume >= 1.05;
    const isRegimeFavorable = regime === 'STRONG_BULL' || regime === 'WEAK_BULL';
    // Extension Guard: Do NOT chase trades if price is already > 4.5% stretched above EMA50 (prevent late-cycle top buying)
    const distanceEma50Percent = ind.ema50 > 0 ? ((candle.close - ind.ema50) / ind.ema50) * 100 : 0;
    const isNotOverExtended = distanceEma50Percent <= 4.5;

    const triggered = isEmaBull && isAdxStrong && isRsiHealthy && isVolumeConfirmed && isRegimeFavorable && isNotOverExtended;

    const stopDistance = Math.max(candle.close * 0.015, ind.atr * atrMultiplier);
    const stopLoss = candle.close - stopDistance;
    const takeProfit1 = candle.close + stopDistance * 1.5;
    const takeProfit2 = candle.close + stopDistance * 2.5;
    const prec = getPriceDecimals(candle.close);

    return {
      triggered,
      action: 'BUY',
      stopLoss: Number(stopLoss.toFixed(prec)),
      takeProfit1: Number(takeProfit1.toFixed(prec)),
      takeProfit2: Number(takeProfit2.toFixed(prec)),
      rationale: triggered 
        ? `EMA alignment (9>21>50) confirmed by ADX (${ind.adx.toFixed(1)}), non-extended distance (${distanceEma50Percent.toFixed(1)}%) and RVol (${ind.relativeVolume.toFixed(2)})`
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
    // Anti-Blow-Off Guard: Confirm active trend expansion without buying in extreme RSI exhaustion (> 76)
    const isHealthyMomentum = ind.rsi14 <= 76 && ind.adx >= 18;

    const triggered = isBreakout && isVolumeSurge && isMacdBullish && isAboveEma200 && isHealthyMomentum;

    const stopDistance = Math.max(candle.close * 0.018, ind.atr * atrMultiplier);
    const stopLoss = candle.close - stopDistance;
    const takeProfit1 = candle.close + stopDistance * 1.6;
    const takeProfit2 = candle.close + stopDistance * 2.8;
    const prec = getPriceDecimals(candle.close);

    return {
      triggered,
      action: 'BUY',
      stopLoss: Number(stopLoss.toFixed(prec)),
      takeProfit1: Number(takeProfit1.toFixed(prec)),
      takeProfit2: Number(takeProfit2.toFixed(prec)),
      rationale: triggered
        ? `Donchian channel breakout above ${ind.donchian.upper.toFixed(prec > 4 ? prec : 2)} with explosive RVol (${ind.relativeVolume.toFixed(2)}) and healthy RSI (${ind.rsi14.toFixed(1)})`
        : 'No breakout detected'
    };
  }

  /**
   * Strategy C: Pullback Strategy
   * Conditions:
   * 1. Macro trend bullish: Price above EMA200 and EMA50 > EMA200
   * 2. Price retraced towards EMA21 / EMA50 (distance within 2.2% of EMA21)
   * 3. RSI pulled back to 40 - 56 then turned upward
   * 4. Stochastic RSI %K crosses above %D from oversold (< 45)
   * 5. Volume sanity: Relative volume <= 1.35 (confirms healthy low-volume pullback, NOT panic dumping)
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
    // Volume sanity: A healthy pullback occurs on declining or normal volume, not high-volume panic sell-offs
    const isHealthyVolume = ind.relativeVolume <= 1.35;

    const triggered = isMacroBull && isRetracedToEma && isRsiPullbackZone && isStochRsiCross && isHealthyVolume;

    const stopDistance = Math.max(candle.close * 0.014, ind.atr * atrMultiplier);
    const stopLoss = candle.close - stopDistance;
    const takeProfit1 = candle.close + stopDistance * 1.5;
    const takeProfit2 = candle.close + stopDistance * 2.4;
    const prec = getPriceDecimals(candle.close);

    return {
      triggered,
      action: 'BUY',
      stopLoss: Number(stopLoss.toFixed(prec)),
      takeProfit1: Number(takeProfit1.toFixed(prec)),
      takeProfit2: Number(takeProfit2.toFixed(prec)),
      rationale: triggered
        ? `Clean pullback to EMA21 (${ind.ema21.toFixed(prec > 4 ? prec : 2)}) on calm volume (RVol ${ind.relativeVolume.toFixed(2)}x) with StochRSI reversal`
        : 'Pullback criteria not satisfied'
    };
  }

  /**
   * Strategy D: Mean Reversion (Sideways / Range Regime ONLY)
   * Enhanced Quantitative Criteria:
   * 1. Regime strictly SIDEWAYS_RANGE or LOW_VOLATILITY
   * 2. ADX < 20 (Confirm complete lack of directional trend)
   * 3. Price touches or pierces lower Bollinger Band
   * 4. RSI < 35 (Oversold extreme)
   * 5. Volume Exhaustion Check: Relative Volume <= 1.10 (CRITICAL: blocks aggressive sell-off dumps/breakdowns)
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
    // Volume exhaustion: Do NOT buy if relative volume is surging (> 1.10) on a lower band touch, as that signals a breakdown!
    const isVolumeExhausted = ind.relativeVolume <= 1.10;

    const triggered = isSideways && isLowAdx && isAtLowerBand && isOversoldRsi && isVolumeExhausted;

    const stopDistance = Math.max(candle.close * 0.010, ind.atr * 1.2);
    const stopLoss = candle.close - stopDistance;
    // Mean reversion targets middle band (SMA20) and upper band
    const takeProfit1 = ind.bollingerBands.middle;
    const takeProfit2 = ind.bollingerBands.upper;
    const prec = getPriceDecimals(candle.close);

    return {
      triggered,
      action: 'BUY',
      stopLoss: Number(stopLoss.toFixed(prec)),
      takeProfit1: Number(takeProfit1.toFixed(prec)),
      takeProfit2: Number(takeProfit2.toFixed(prec)),
      rationale: triggered
        ? `Range mean reversion: lower Bollinger touch met oversold RSI (${ind.rsi14.toFixed(1)}), low ADX (${ind.adx.toFixed(1)}) en uitgeput verkoopvolume (RVol ${ind.relativeVolume.toFixed(2)}x)`
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
    const isSqueezeRelease = ind.bollingerBands.width < 7.5;
    const isPricePiercingUpper = candle.close >= ind.bollingerBands.upper * 0.998;
    const isVolumeExpansion = ind.relativeVolume >= 1.25;
    const isPositiveDirection = ind.plusDi > ind.minusDi;

    const triggered = isSqueezeRelease && isPricePiercingUpper && isVolumeExpansion && isPositiveDirection;

    const stopDistance = Math.max(candle.close * 0.016, ind.atr * atrMultiplier);
    const stopLoss = candle.close - stopDistance;
    const takeProfit1 = candle.close + stopDistance * 1.5;
    const takeProfit2 = candle.close + stopDistance * 2.6;
    const prec = getPriceDecimals(candle.close);

    return {
      triggered,
      action: 'BUY',
      stopLoss: Number(stopLoss.toFixed(prec)),
      takeProfit1: Number(takeProfit1.toFixed(prec)),
      takeProfit2: Number(takeProfit2.toFixed(prec)),
      rationale: triggered
        ? `Bollinger squeeze expansion: price piercing upper band with RVol surge (${ind.relativeVolume.toFixed(2)})`
        : 'No volatility breakout detected'
    };
  }
}
