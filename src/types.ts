/**
 * QuantCrypto Algorithmic Trading Bot - Shared Types & Interfaces
 */

export type Timeframe = '5m' | '15m' | '1h' | '4h' | '1D';

export type TradingMode = 'BACKTEST' | 'PAPER' | 'LIVE';

export type MarketRegime = 
  | 'STRONG_BULL'
  | 'WEAK_BULL'
  | 'STRONG_BEAR'
  | 'WEAK_BEAR'
  | 'SIDEWAYS_RANGE'
  | 'HIGH_VOLATILITY'
  | 'LOW_VOLATILITY';

export type SignalAction = 'BUY' | 'SELL' | 'HOLD';

export type SignalConfidence = 'NO_TRADE' | 'WEAK' | 'MODERATE' | 'STRONG';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketTicker {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  coinName?: string;
  category?: 'LAYER_1' | 'DEFI' | 'MEME' | 'AI_DATA' | 'INFRA' | 'MAJOR';
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24hUsd: number;
  marketCapUsd: number;
  bidPrice: number;
  askPrice: number;
  spreadPercent: number;
  volatility24h: number;
  liquidityScore: number; // 0-100
  isEligible: boolean;
  exclusionReason?: string;
  regime: MarketRegime;
}

export type MarketAsset = MarketTicker;

export interface IndicatorSet {
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  sma50: number;
  sma200: number;
  supertrend: { value: number; direction: 'BULL' | 'BEAR' };
  adx: number;
  plusDi: number;
  minusDi: number;
  rsi14: number;
  rsi7: number;
  rsi21: number;
  macd: { macd: number; signal: number; histogram: number };
  stochRsi: { k: number; d: number };
  atr: number;
  atrPercent: number;
  bollingerBands: { upper: number; middle: number; lower: number; width: number };
  historicalVolatility: number;
  volumeSma20: number;
  relativeVolume: number; // RVol
  obv: number;
  vwap: number;
  donchian: { upper: number; lower: number; middle: number };
  swingHigh: number;
  swingLow: number;
  maDistancePercent: number; // % distance from EMA21
}

export interface SignalScoreBreakdown {
  trendScore: number;      // 0-30
  momentumScore: number;   // 0-25
  volumeScore: number;     // 0-20
  volatilityScore: number; // 0-15
  regimeScore: number;     // 0-10
  totalScore: number;      // 0-100
}

export interface MultiTimeframeAnalysis {
  macro4h: { trend: 'BULL' | 'BEAR' | 'NEUTRAL'; emaAligned: boolean; regime: MarketRegime };
  setup1h: { momentum: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'; rsi: number; pullbackOk: boolean };
  trigger15m: { breakout: boolean; supertrendBull: boolean; volumeSurge: boolean };
  aligned: boolean;
}

export type SignalTriggerStatus = 'ACTIVE_TRIGGER' | 'FORMING_SETUP' | 'WATCHLIST' | 'OVERBOUGHT' | 'COOLDOWN';

export interface TradingSignal {
  id: string;
  symbol: string;
  timestamp: number;
  action: SignalAction;
  confidence: SignalConfidence;
  strategy: string;
  triggerActive: boolean;
  triggerStatus: SignalTriggerStatus;
  tags: string[];
  currentPrice: number;
  suggestedEntry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: number;
  riskPercent: number;
  suggestedPositionSizeUsd: number;
  scoreBreakdown: SignalScoreBreakdown;
  mtf: MultiTimeframeAnalysis;
  regime: MarketRegime;
  rationale: string;
  historicalCalibration: {
    historicalSampleCount: number;
    sampleWinRate: number;
    avgRMultiple: number;
    profitFactor: number;
  };
}

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  amount: number;
  valueUsd: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit1Hit?: boolean;
  trailingStopActive: boolean;
  trailingStopPrice?: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  strategy: string;
  entryTimestamp: number;
  clientOrderId: string;
}

export interface TradeRecord {
  id: string;
  clientOrderId: string;
  exchangeOrderId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  strategy: string;
  entryTimestamp: number;
  exitTimestamp: number;
  entryPrice: number;
  exitPrice: number;
  amount: number;
  grossPnl: number;
  feesPaid: number;
  slippageCost: number;
  netPnl: number;
  netPnlPercent: number;
  returnR: number; // Return in terms of Initial Risk (R)
  exitReason: 'STOP_LOSS' | 'TAKE_PROFIT_1' | 'TAKE_PROFIT_2' | 'TRAILING_STOP' | 'TIME_EXIT' | 'REGIME_CHANGE' | 'EMERGENCY_HALT' | 'MANUAL';
  marketRegime: MarketRegime;
  signalScore: number;
  indicatorsAtEntry: {
    adx: number;
    rsi: number;
    atrPercent: number;
    rvol: number;
  };
}

export type StrategyType = 'TREND_FOLLOWING' | 'MOMENTUM_BREAKOUT' | 'PULLBACK' | 'MEAN_REVERSION' | 'VOLATILITY_BREAKOUT' | 'ADAPTIVE_SCORE';

export interface BacktestConfig {
  symbol: string;
  timeframe: Timeframe;
  strategy: StrategyType;
  initialCapital: number;
  riskPerTradePercent: number;
  makerFeePercent: number;
  takerFeePercent: number;
  slippagePercent: number;
  useMultiTimeframe: boolean;
  partialExits: boolean;
  useTrailingStop: boolean;
  trailingStopAtrMultiplier: number;
  atrStopMultiplier: number;
  takeProfit1Multiple: number;
  takeProfit2Multiple: number;
  candleCount?: number;
  // Specific strategy parameters
  emaFastPeriod: number;
  emaSlowPeriod: number;
  adxThreshold: number;
  rsiThreshold: number;
}

export interface RegimePerformance {
  regime: MarketRegime;
  tradeCount: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  avgReturnR: number;
  maxDrawdown: number;
}

export interface BacktestMetrics {
  initialCapital: number;
  finalCapital: number;
  totalNetProfit: number;
  totalNetReturnPercent: number;
  annualizedReturnPercent: number;
  cagr: number;
  buyAndHoldBtcReturnPercent: number;
  buyAndHoldAssetReturnPercent: number;
  maxDrawdownPercent: number;
  avgDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  profitFactor: number;
  winRatePercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWinAmount: number;
  avgLossAmount: number;
  avgTradePercent: number;
  riskRewardRatio: number;
  expectancyR: number;
  largestWinAmount: number;
  largestLossAmount: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  totalFeesPaid: number;
  totalSlippageCost: number;
  exposurePercent: number;
  regimeBreakdown: RegimePerformance[];
  robustnessCompositeScore: number; // 0-100
  overfittingRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  overfittingReasons: string[];
}

export interface BacktestResult {
  config: BacktestConfig;
  metrics: BacktestMetrics;
  equityCurve: { timestamp: number; equity: number; drawdown: number; benchmarkBtc: number }[];
  trades: TradeRecord[];
  walkForward: {
    trainReturn: number;
    validationReturn: number;
    outOfSampleReturn: number;
    consistencyRatio: number; // OOS return / In-Sample return
    windows: { windowId: number; trainPnl: number; testPnl: number; sharpe: number }[];
  };
  monteCarlo: {
    medianReturn: number;
    worstCase5thPercentileReturn: number;
    bestCase95thPercentileReturn: number;
    maxDrawdown95thPercentile: number;
    ruinProbabilityPercent: number;
  };
}

export interface StrategyResearchItem {
  id: string;
  name: string;
  category: string;
  coreIndicators: string[];
  entryConcept: string;
  exitConcept: string;
  idealRegimes: MarketRegime[];
  unreliableRegimes: MarketRegime[];
  sampleWinRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  annualizedReturn: number;
  compositeRobustness: number;
  verdict: 'HIGHLY_ROBUST' | 'REGIME_DEPENDENT' | 'OVERFIT_RISK' | 'UNPROFITABLE_AFTER_FEES';
  notes: string;
}

export interface IndicatorResearchItem {
  indicator: string;
  category: 'TREND' | 'MOMENTUM' | 'VOLATILITY' | 'VOLUME' | 'PRICE_ACTION';
  purpose: string;
  expectedEdge: string;
  knownWeakness: string;
  marketsUseful: string;
  marketsUnreliable: string;
  correlationWithOthers: string;
  marginalOosImpact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE_REDUNDANT';
  featureImportanceScore: number; // 0-100
}

export interface RiskConfig {
  riskPerTradePercent: number;
  maxDailyLossPercent: number;
  maxWeeklyLossPercent: number;
  maxDrawdownPausePercent: number;
  maxDrawdownEmergencyPercent: number;
  maxOpenPositions: number;
  maxExposurePerCoinPercent: number;
  maxTotalPortfolioExposurePercent: number;
  maxCorrelatedPositions: number;
  consecutiveLossCooldownCount: number;
  cooldownHours: number;
  emergencyKillSwitchActive: boolean;
  // Circuit breaker bypass toggles (allows user to temporarily relax/override specific blocks)
  bypassDailyLossLimit?: boolean;
  bypassDrawdownLimit?: boolean;
  bypassBtcCorrelationGuard?: boolean;
  bypassCorrelatedPositionsLimit?: boolean;
  bypassMaxExposureCap?: boolean;
}

export interface RiskStatus {
  consecutiveLosses: number;
  consecutiveLossCooldownCount: number;
  cooldownHours: number;
  cooldownActive: boolean;
  cooldownUntilTimestamp: number;
  remainingMinutes: number;
  peakEquityUsd: number;
  currentEquityUsd: number;
  currentDrawdownPercent: number;
  dailyRealizedPnlUsd: number;
  dailyLossPercent: number;
  isDrawdownHalted: boolean;
  isDrawdownPaused: boolean;
  isDailyLossHalted: boolean;
  activeBlocks: {
    type: 'KILL_SWITCH' | 'COOLDOWN' | 'DAILY_LOSS' | 'DRAWDOWN_EMERGENCY' | 'DRAWDOWN_PAUSE' | 'MAX_POSITIONS' | 'EXPOSURE_CAP' | 'BTC_CORRELATION' | 'CORRELATION_LIMIT';
    title: string;
    description: string;
    canReset?: boolean;
    canBypass?: boolean;
    bypassKey?: keyof RiskConfig;
  }[];
}

export interface ExchangeConfig {
  provider: 'phemex' | 'binance' | 'bybit' | 'okx';
  mode: TradingMode;
  liveTradingEnabled: boolean;
  apiKeyConfigured: boolean;
  apiSecretConfigured: boolean;
  hasPassphrase: boolean;
  isConnected: boolean;
  pingLatencyMs: number;
  accountEquityUsd: number;
  availableBalanceUsd: number;
  permissions: {
    canRead: boolean;
    canTrade: boolean;
    withdrawalsDisabled: boolean; // Must be TRUE for security
  };
  rateLimitStatus: {
    usedWeight: number;
    maxLimit: number;
    backoffActive: boolean;
  };
  lastSyncTimestamp: number;
}

export interface SystemLog {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'TRADE';
  module: 'ENGINE' | 'STRATEGY' | 'RISK' | 'EXCHANGE' | 'BACKTEST' | 'PORTFOLIO';
  message: string;
  details?: any;
}

export interface SlackConfig {
  webhookUrl: string;
  enabled: boolean;
  notifyOnEntries: boolean;
  notifyOnExits: boolean;
  notifyOnRiskBreach: boolean;
  notifyOnBotToggle: boolean;
}

export interface DiscordConfig {
  webhookUrl: string;
  enabled: boolean;
  notifyOnEntries: boolean;
  notifyOnExits: boolean;
  notifyOnRiskBreach: boolean;
  notifyOnBotToggle: boolean;
}

export interface SecurityState {
  pinConfigured: boolean;
  isUnlocked: boolean;
}

export interface StorageStatus {
  persisted: boolean;
  filePath: string;
  lastSavedAt: number;
  openPositionsCount: number;
  totalTradesSaved: number;
}

