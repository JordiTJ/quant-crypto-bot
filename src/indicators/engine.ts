/**
 * Quantitative Technical Indicators Engine
 * Mathematical implementation without look-ahead bias
 */

import { Candle, IndicatorSet, MarketRegime } from '../types';

export class IndicatorEngine {
  /**
   * Simple Moving Average
   */
  static calculateSMA(values: number[], period: number): number[] {
    const result: number[] = new Array(values.length).fill(0);
    if (values.length < period) return result;

    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += values[i];
    }
    result[period - 1] = sum / period;

    for (let i = period; i < values.length; i++) {
      sum += values[i] - values[i - period];
      result[i] = sum / period;
    }
    return result;
  }

  /**
   * Exponential Moving Average
   */
  static calculateEMA(values: number[], period: number): number[] {
    const result: number[] = new Array(values.length).fill(0);
    if (values.length < period) return result;

    const multiplier = 2 / (period + 1);

    // Initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += values[i];
    }
    result[period - 1] = sum / period;

    // EMA calculation
    for (let i = period; i < values.length; i++) {
      result[i] = (values[i] - result[i - 1]) * multiplier + result[i - 1];
    }
    return result;
  }

  /**
   * Relative Strength Index (Wilder's RSI)
   */
  static calculateRSI(closes: number[], period = 14): number[] {
    const result: number[] = new Array(closes.length).fill(50);
    if (closes.length <= period) return result;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = closes[i] - closes[i - 1];
      if (change >= 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    result[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));

    for (let i = period + 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      const currentGain = change >= 0 ? change : 0;
      const currentLoss = change < 0 ? -change : 0;

      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

      if (avgLoss === 0) {
        result[i] = 100;
      } else {
        const rs = avgGain / avgLoss;
        result[i] = 100 - (100 / (1 + rs));
      }
    }
    return result;
  }

  /**
   * Moving Average Convergence Divergence (MACD)
   */
  static calculateMACD(
    closes: number[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9
  ): { macd: number[]; signal: number[]; histogram: number[] } {
    const fastEma = this.calculateEMA(closes, fastPeriod);
    const slowEma = this.calculateEMA(closes, slowPeriod);

    const macdLine: number[] = new Array(closes.length).fill(0);
    for (let i = slowPeriod - 1; i < closes.length; i++) {
      macdLine[i] = fastEma[i] - slowEma[i];
    }

    const signalLine = this.calculateEMA(macdLine.slice(slowPeriod - 1), signalPeriod);
    const fullSignal: number[] = new Array(closes.length).fill(0);
    const histogram: number[] = new Array(closes.length).fill(0);

    for (let i = 0; i < signalLine.length; i++) {
      const targetIdx = i + (slowPeriod - 1);
      fullSignal[targetIdx] = signalLine[i];
      histogram[targetIdx] = macdLine[targetIdx] - signalLine[i];
    }

    return { macd: macdLine, signal: fullSignal, histogram };
  }

  /**
   * Average True Range (ATR) & True Range
   */
  static calculateATR(candles: Candle[], period = 14): { atr: number[]; tr: number[] } {
    const n = candles.length;
    const tr: number[] = new Array(n).fill(0);
    const atr: number[] = new Array(n).fill(0);

    if (n === 0) return { atr, tr };

    tr[0] = candles[0].high - candles[0].low;
    for (let i = 1; i < n; i++) {
      const h = candles[i].high;
      const l = candles[i].low;
      const prevC = candles[i - 1].close;
      tr[i] = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
    }

    if (n < period) return { atr, tr };

    let sum = 0;
    for (let i = 0; i < period; i++) sum += tr[i];
    atr[period - 1] = sum / period;

    for (let i = period; i < n; i++) {
      atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
    }

    return { atr, tr };
  }

  /**
   * Average Directional Index (ADX) with +DI & -DI
   */
  static calculateADX(candles: Candle[], period = 14): { adx: number[]; plusDi: number[]; minusDi: number[] } {
    const n = candles.length;
    const adx: number[] = new Array(n).fill(0);
    const plusDi: number[] = new Array(n).fill(0);
    const minusDi: number[] = new Array(n).fill(0);

    if (n <= period * 2) return { adx, plusDi, minusDi };

    const plusDm: number[] = new Array(n).fill(0);
    const minusDm: number[] = new Array(n).fill(0);
    const tr: number[] = new Array(n).fill(0);

    tr[0] = candles[0].high - candles[0].low;
    for (let i = 1; i < n; i++) {
      const upMove = candles[i].high - candles[i - 1].high;
      const downMove = candles[i - 1].low - candles[i].low;

      plusDm[i] = upMove > downMove && upMove > 0 ? upMove : 0;
      minusDm[i] = downMove > upMove && downMove > 0 ? downMove : 0;

      const h = candles[i].high;
      const l = candles[i].low;
      const prevC = candles[i - 1].close;
      tr[i] = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
    }

    // Smoothed TR, +DM, -DM
    let smoothTr = 0;
    let smoothPlusDm = 0;
    let smoothMinusDm = 0;

    for (let i = 1; i <= period; i++) {
      smoothTr += tr[i];
      smoothPlusDm += plusDm[i];
      smoothMinusDm += minusDm[i];
    }

    const dx: number[] = new Array(n).fill(0);

    for (let i = period; i < n; i++) {
      if (i > period) {
        smoothTr = smoothTr - smoothTr / period + tr[i];
        smoothPlusDm = smoothPlusDm - smoothPlusDm / period + plusDm[i];
        smoothMinusDm = smoothMinusDm - smoothMinusDm / period + minusDm[i];
      }

      const pDi = smoothTr === 0 ? 0 : (smoothPlusDm / smoothTr) * 100;
      const mDi = smoothTr === 0 ? 0 : (smoothMinusDm / smoothTr) * 100;

      plusDi[i] = pDi;
      minusDi[i] = mDi;

      const diSum = pDi + mDi;
      dx[i] = diSum === 0 ? 0 : (Math.abs(pDi - mDi) / diSum) * 100;
    }

    // Calculate ADX as smoothed DX
    let dxSum = 0;
    const startAdx = period * 2 - 1;
    for (let i = period; i <= startAdx && i < n; i++) {
      dxSum += dx[i];
    }
    if (startAdx < n) {
      adx[startAdx] = dxSum / period;
      for (let i = startAdx + 1; i < n; i++) {
        adx[i] = (adx[i - 1] * (period - 1) + dx[i]) / period;
      }
    }

    return { adx, plusDi, minusDi };
  }

  /**
   * SuperTrend Indicator
   */
  static calculateSuperTrend(
    candles: Candle[],
    period = 10,
    multiplier = 3.0
  ): { value: number[]; direction: ('BULL' | 'BEAR')[] } {
    const n = candles.length;
    const value: number[] = new Array(n).fill(0);
    const direction: ('BULL' | 'BEAR')[] = new Array(n).fill('BULL');
    if (n < period) return { value, direction };

    const { atr } = this.calculateATR(candles, period);

    const upperBand: number[] = new Array(n).fill(0);
    const lowerBand: number[] = new Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      const hl2 = (candles[i].high + candles[i].low) / 2;
      upperBand[i] = hl2 + multiplier * atr[i];
      lowerBand[i] = hl2 - multiplier * atr[i];
    }

    for (let i = period; i < n; i++) {
      const prevLower = lowerBand[i - 1];
      const prevUpper = upperBand[i - 1];
      const prevClose = candles[i - 1].close;

      if (lowerBand[i] < prevLower && prevClose >= prevLower) {
        lowerBand[i] = prevLower;
      }
      if (upperBand[i] > prevUpper && prevClose <= prevUpper) {
        upperBand[i] = prevUpper;
      }

      if (i === period) {
        direction[i] = candles[i].close > upperBand[i] ? 'BULL' : 'BEAR';
      } else {
        const prevDir = direction[i - 1];
        if (prevDir === 'BULL') {
          direction[i] = candles[i].close < lowerBand[i] ? 'BEAR' : 'BULL';
        } else {
          direction[i] = candles[i].close > upperBand[i] ? 'BULL' : 'BEAR';
        }
      }

      value[i] = direction[i] === 'BULL' ? lowerBand[i] : upperBand[i];
    }

    return { value, direction };
  }

  /**
   * Bollinger Bands and Bollinger Band Width
   */
  static calculateBollingerBands(
    closes: number[],
    period = 20,
    stdDevMultiplier = 2.0
  ): { upper: number[]; middle: number[]; lower: number[]; width: number[] } {
    const middle = this.calculateSMA(closes, period);
    const upper: number[] = new Array(closes.length).fill(0);
    const lower: number[] = new Array(closes.length).fill(0);
    const width: number[] = new Array(closes.length).fill(0);

    for (let i = period - 1; i < closes.length; i++) {
      let varianceSum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        varianceSum += Math.pow(closes[j] - middle[i], 2);
      }
      const stdDev = Math.sqrt(varianceSum / period);
      upper[i] = middle[i] + stdDevMultiplier * stdDev;
      lower[i] = middle[i] - stdDevMultiplier * stdDev;
      width[i] = middle[i] === 0 ? 0 : ((upper[i] - lower[i]) / middle[i]) * 100;
    }

    return { upper, middle, lower, width };
  }

  /**
   * Stochastic RSI
   */
  static calculateStochRSI(
    rsiValues: number[],
    period = 14,
    smoothK = 3,
    smoothD = 3
  ): { k: number[]; d: number[] } {
    const n = rsiValues.length;
    const rawStoch: number[] = new Array(n).fill(50);

    for (let i = period - 1; i < n; i++) {
      let minRsi = Infinity;
      let maxRsi = -Infinity;
      for (let j = i - period + 1; j <= i; j++) {
        if (rsiValues[j] < minRsi) minRsi = rsiValues[j];
        if (rsiValues[j] > maxRsi) maxRsi = rsiValues[j];
      }
      const range = maxRsi - minRsi;
      rawStoch[i] = range === 0 ? 50 : ((rsiValues[i] - minRsi) / range) * 100;
    }

    const k = this.calculateSMA(rawStoch, smoothK);
    const d = this.calculateSMA(k, smoothD);
    return { k, d };
  }

  /**
   * On-Balance Volume (OBV)
   */
  static calculateOBV(candles: Candle[]): number[] {
    const n = candles.length;
    const obv: number[] = new Array(n).fill(0);
    if (n === 0) return obv;

    obv[0] = candles[0].volume;
    for (let i = 1; i < n; i++) {
      if (candles[i].close > candles[i - 1].close) {
        obv[i] = obv[i - 1] + candles[i].volume;
      } else if (candles[i].close < candles[i - 1].close) {
        obv[i] = obv[i - 1] - candles[i].volume;
      } else {
        obv[i] = obv[i - 1];
      }
    }
    return obv;
  }

  /**
   * Volume-Weighted Average Price (VWAP)
   */
  static calculateVWAP(candles: Candle[]): number[] {
    const n = candles.length;
    const vwap: number[] = new Array(n).fill(0);
    let cumulativeTpVolume = 0;
    let cumulativeVolume = 0;

    for (let i = 0; i < n; i++) {
      const tp = (candles[i].high + candles[i].low + candles[i].close) / 3;
      cumulativeTpVolume += tp * candles[i].volume;
      cumulativeVolume += candles[i].volume;
      vwap[i] = cumulativeVolume === 0 ? candles[i].close : cumulativeTpVolume / cumulativeVolume;
    }
    return vwap;
  }

  /**
   * Donchian Channels
   */
  static calculateDonchian(candles: Candle[], period = 20): { upper: number[]; lower: number[]; middle: number[] } {
    const n = candles.length;
    const upper: number[] = new Array(n).fill(0);
    const lower: number[] = new Array(n).fill(0);
    const middle: number[] = new Array(n).fill(0);

    for (let i = period - 1; i < n; i++) {
      let maxH = -Infinity;
      let minL = Infinity;
      for (let j = i - period + 1; j <= i; j++) {
        if (candles[j].high > maxH) maxH = candles[j].high;
        if (candles[j].low < minL) minL = candles[j].low;
      }
      upper[i] = maxH;
      lower[i] = minL;
      middle[i] = (maxH + minL) / 2;
    }
    return { upper, lower, middle };
  }

  /**
   * Historical Volatility (annualized %)
   */
  static calculateHistoricalVolatility(closes: number[], period = 20): number[] {
    const n = closes.length;
    const vol: number[] = new Array(n).fill(0);
    if (n < period + 1) return vol;

    const logReturns: number[] = new Array(n).fill(0);
    for (let i = 1; i < n; i++) {
      logReturns[i] = Math.log(closes[i] / closes[i - 1]);
    }

    for (let i = period; i < n; i++) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += logReturns[j];
      }
      const mean = sum / period;
      let variance = 0;
      for (let j = i - period + 1; j <= i; j++) {
        variance += Math.pow(logReturns[j] - mean, 2);
      }
      const dailyStd = Math.sqrt(variance / (period - 1));
      // Crypto trading is 365 days/year
      vol[i] = dailyStd * Math.sqrt(365) * 100;
    }
    return vol;
  }

  /**
   * Classify Market Regime based on multiple orthogonal features
   */
  static classifyRegime(indicators: {
    ema9: number;
    ema21: number;
    ema50: number;
    ema200: number;
    adx: number;
    plusDi: number;
    minusDi: number;
    rsi: number;
    atrPercent: number;
    bbWidth: number;
    price: number;
  }): MarketRegime {
    const { ema9, ema21, ema50, ema200, adx, plusDi, minusDi, rsi, atrPercent, bbWidth, price } = indicators;

    // Volatility extremes take priority
    if (atrPercent > 4.5 || bbWidth > 12) {
      return 'HIGH_VOLATILITY';
    }
    if (atrPercent < 1.2 && bbWidth < 3.0) {
      return 'LOW_VOLATILITY';
    }

    // Strong Bull: Price above all EMAs, EMA alignment 9>21>50>200, strong ADX, +DI > -DI, healthy RSI
    if (price > ema50 && ema9 > ema21 && ema21 > ema50 && adx > 24 && plusDi > minusDi && rsi >= 52) {
      return 'STRONG_BULL';
    }

    // Strong Bear: Price below all EMAs, EMA alignment 9<21<50<200, strong ADX, -DI > +DI, low RSI
    if (price < ema50 && ema9 < ema21 && ema21 < ema50 && adx > 24 && minusDi > plusDi && rsi <= 48) {
      return 'STRONG_BEAR';
    }

    // Weak Bull
    if (price > ema50 && ema21 > ema50) {
      return 'WEAK_BULL';
    }

    // Weak Bear
    if (price < ema50 && ema21 < ema50) {
      return 'WEAK_BEAR';
    }

    // Sideways / Range when trend is absent
    return 'SIDEWAYS_RANGE';
  }

  /**
   * Calculate complete indicator suite for the latest candle
   */
  static getLatestIndicators(candles: Candle[]): IndicatorSet {
    const n = candles.length;
    if (n < 50) {
      throw new Error(`Insufficient candle history (${n} candles). Minimum 50 required.`);
    }

    const closes = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);

    const ema9 = this.calculateEMA(closes, 9);
    const ema21 = this.calculateEMA(closes, 21);
    const ema50 = this.calculateEMA(closes, 50);
    const ema200 = this.calculateEMA(closes, Math.min(200, n - 1));
    const sma50 = this.calculateSMA(closes, 50);
    const sma200 = this.calculateSMA(closes, Math.min(200, n - 1));

    const supertrend = this.calculateSuperTrend(candles, 10, 3.0);
    const { adx, plusDi, minusDi } = this.calculateADX(candles, 14);

    const rsi14 = this.calculateRSI(closes, 14);
    const rsi7 = this.calculateRSI(closes, 7);
    const rsi21 = this.calculateRSI(closes, 21);

    const macdData = this.calculateMACD(closes, 12, 26, 9);
    const stochRsiData = this.calculateStochRSI(rsi14, 14, 3, 3);

    const { atr } = this.calculateATR(candles, 14);
    const bb = this.calculateBollingerBands(closes, 20, 2.0);
    const histVol = this.calculateHistoricalVolatility(closes, 20);

    const volumeSma20 = this.calculateSMA(volumes, 20);
    const obv = this.calculateOBV(candles);
    const vwap = this.calculateVWAP(candles);
    const donchian = this.calculateDonchian(candles, 20);

    const lastIdx = n - 1;
    const currentClose = closes[lastIdx];
    const currentAtr = atr[lastIdx];
    const currentVolSma = volumeSma20[lastIdx] || 1;

    // Swing highs/lows over past 20 candles
    let swingHigh = -Infinity;
    let swingLow = Infinity;
    const lookback = Math.min(20, n);
    for (let i = n - lookback; i < n; i++) {
      if (candles[i].high > swingHigh) swingHigh = candles[i].high;
      if (candles[i].low < swingLow) swingLow = candles[i].low;
    }

    const currentEma21 = ema21[lastIdx];
    const maDistancePercent = currentEma21 === 0 ? 0 : ((currentClose - currentEma21) / currentEma21) * 100;

    return {
      ema9: ema9[lastIdx],
      ema21: currentEma21,
      ema50: ema50[lastIdx],
      ema200: ema200[lastIdx] || ema50[lastIdx],
      sma50: sma50[lastIdx],
      sma200: sma200[lastIdx] || sma50[lastIdx],
      supertrend: {
        value: supertrend.value[lastIdx],
        direction: supertrend.direction[lastIdx]
      },
      adx: adx[lastIdx],
      plusDi: plusDi[lastIdx],
      minusDi: minusDi[lastIdx],
      rsi14: rsi14[lastIdx],
      rsi7: rsi7[lastIdx],
      rsi21: rsi21[lastIdx],
      macd: {
        macd: macdData.macd[lastIdx],
        signal: macdData.signal[lastIdx],
        histogram: macdData.histogram[lastIdx]
      },
      stochRsi: {
        k: stochRsiData.k[lastIdx],
        d: stochRsiData.d[lastIdx]
      },
      atr: currentAtr,
      atrPercent: currentClose === 0 ? 0 : (currentAtr / currentClose) * 100,
      bollingerBands: {
        upper: bb.upper[lastIdx],
        middle: bb.middle[lastIdx],
        lower: bb.lower[lastIdx],
        width: bb.width[lastIdx]
      },
      historicalVolatility: histVol[lastIdx] || 45,
      volumeSma20: currentVolSma,
      relativeVolume: currentVolSma === 0 ? 1 : volumes[lastIdx] / currentVolSma,
      obv: obv[lastIdx],
      vwap: vwap[lastIdx],
      donchian: {
        upper: donchian.upper[lastIdx],
        lower: donchian.lower[lastIdx],
        middle: donchian.middle[lastIdx]
      },
      swingHigh,
      swingLow,
      maDistancePercent
    };
  }
}
