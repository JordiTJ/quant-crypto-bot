import React, { useState } from 'react';
import { 
  Radio, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { TradingSignal } from '../types';

interface SignalsViewProps {
  signals: TradingSignal[];
  onOpenPaperTrade?: (signal: TradingSignal) => void;
  onExecuteTrade?: (signal: TradingSignal) => Promise<{ success: boolean; message: string }>;
}

export const SignalsView: React.FC<SignalsViewProps> = ({ signals, onOpenPaperTrade, onExecuteTrade }) => {
  const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(signals[0] || null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionFeedback, setExecutionFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleExecute = async (sig: TradingSignal) => {
    if (!onExecuteTrade) return;
    setIsExecuting(true);
    setExecutionFeedback(null);
    try {
      const res = await onExecuteTrade(sig);
      setExecutionFeedback(res);
    } catch (err: any) {
      setExecutionFeedback({ success: false, message: err.message || 'Execution failed' });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Radio className="w-5 h-5 text-cyan-400" />
          Adaptive Multi-Factor Signal Engine
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Every candidate setup is evaluated across orthogonal factors using a 0-100 score matrix (Trend 0-30, Momentum 0-25, Volume 0-20, Volatility 0-15, Regime 0-10).
          Trades are only considered when the composite score is &ge; 70 with multi-timeframe confirmation (4H + 1H + 15M).
        </p>
      </div>

      {/* Grid: Signals List (Left) + Detailed Score Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (5 cols): Signal Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider px-1">
            Live Monitored Universe ({signals.length})
          </div>

          <div className="space-y-2.5">
            {signals.map(sig => {
              const isSelected = selectedSignal?.id === sig.id;
              const isStrong = sig.confidence === 'STRONG';
              const isMod = sig.confidence === 'MODERATE';
              const isWeak = sig.confidence === 'WEAK';

              return (
                <div
                  key={sig.id}
                  onClick={() => setSelectedSignal(sig)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-100 text-sm">{sig.symbol}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isStrong
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : isMod
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : isWeak
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {sig.confidence} ({sig.scoreBreakdown.totalScore}/100)
                      </span>
                    </div>

                    <span className="font-mono font-bold text-slate-200 text-xs">
                      ${sig.currentPrice.toLocaleString(undefined, { minimumFractionDigits: sig.currentPrice > 10 ? 2 : 4 })}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-300 flex items-center justify-between">
                    <span className="font-medium text-slate-200">{sig.strategy}</span>
                    <span className="font-mono text-cyan-400 text-[11px]">R:R {sig.riskRewardRatio}:1</span>
                  </div>

                  {/* Trigger Timing Status Badge */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {sig.triggerStatus === 'ACTIVE_TRIGGER' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        TRIGGER ACTIEF
                      </span>
                    )}
                    {sig.triggerStatus === 'FORMING_SETUP' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        ⏳ SETUP VORMT
                      </span>
                    )}
                    {sig.triggerStatus === 'OVERBOUGHT' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        ⚠️ OVERBOUGHT
                      </span>
                    )}
                    {sig.triggerStatus === 'WATCHLIST' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        👁️ WATCHLIST
                      </span>
                    )}

                    {sig.tags?.slice(1, 3).map((tag, tIdx) => (
                      <span key={tIdx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* MTF Alignment Indicators */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>4H: <strong className={sig.mtf.macro4h.trend === 'BULL' ? 'text-emerald-400' : 'text-slate-400'}>{sig.mtf.macro4h.trend}</strong></span>
                      <span>&bull;</span>
                      <span>1H: <strong className={sig.mtf.setup1h.momentum === 'POSITIVE' ? 'text-emerald-400' : 'text-slate-400'}>{sig.mtf.setup1h.momentum}</strong></span>
                      <span>&bull;</span>
                      <span>15M: <strong className={sig.mtf.trigger15m.supertrendBull ? 'text-emerald-400' : 'text-slate-400'}>TRIGGER</strong></span>
                    </div>

                    <span className={`px-1.5 py-0.2 rounded font-semibold ${
                      sig.mtf.aligned ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {sig.mtf.aligned ? 'MTF BEVESTIGD' : 'DEELS'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col (7 cols): Selected Signal Inspector */}
        <div className="lg:col-span-7">
          {selectedSignal ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5 shadow-sm sticky top-20">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-xl font-bold text-slate-100">{selectedSignal.symbol}</h3>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                      {selectedSignal.strategy}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Markt Regime: <strong className="text-emerald-400">{selectedSignal.regime}</strong>
                  </p>

                  {/* Complete Tag Cloud */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {selectedSignal.tags?.map((tag, tIdx) => {
                      const isTrigger = tag.includes('TRIGGER ACTIEF');
                      const isOverbought = tag.includes('OVERBOUGHT');
                      const isForming = tag.includes('SETUP IN ONTWIKKELING');
                      return (
                        <span
                          key={tIdx}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            isTrigger
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isOverbought
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : isForming
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Score</div>
                  <div className="font-mono text-2xl font-bold text-cyan-400">
                    {selectedSignal.scoreBreakdown.totalScore}<span className="text-sm text-slate-500">/100</span>
                  </div>
                </div>
              </div>

              {/* Rationale Callout */}
              <div className="bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-300">
                <span className="font-semibold text-cyan-400">Signal Rationale: </span>
                {selectedSignal.rationale}
              </div>

              {/* Score Factor Breakdown Progress Bars */}
              <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
                <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Factor Score Attribution
                </div>

                {/* Trend Score */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">1. Trend Strength (EMA + ADX)</span>
                    <span className="text-slate-200">{selectedSignal.scoreBreakdown.trendScore} / 30</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(selectedSignal.scoreBreakdown.trendScore / 30) * 100}%` }} />
                  </div>
                </div>

                {/* Momentum Score */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">2. Momentum Quality (RSI + MACD)</span>
                    <span className="text-slate-200">{selectedSignal.scoreBreakdown.momentumScore} / 25</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(selectedSignal.scoreBreakdown.momentumScore / 25) * 100}%` }} />
                  </div>
                </div>

                {/* Volume Score */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">3. Institutional Volume Surge (RVol)</span>
                    <span className="text-slate-200">{selectedSignal.scoreBreakdown.volumeScore} / 20</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(selectedSignal.scoreBreakdown.volumeScore / 20) * 100}%` }} />
                  </div>
                </div>

                {/* Volatility Score */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">4. Volatility Expansion (ATR + BBW)</span>
                    <span className="text-slate-200">{selectedSignal.scoreBreakdown.volatilityScore} / 15</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(selectedSignal.scoreBreakdown.volatilityScore / 15) * 100}%` }} />
                  </div>
                </div>

                {/* Regime Score */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">5. Macro Regime Favorable</span>
                    <span className="text-slate-200">{selectedSignal.scoreBreakdown.regimeScore} / 10</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(selectedSignal.scoreBreakdown.regimeScore / 10) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Execution Plan: Entry, SL, TP1, TP2, Sizing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800 text-center font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Suggested Entry</div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">
                    ${selectedSignal.suggestedEntry}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-rose-400 uppercase">Stop Loss (Hard)</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">
                    ${selectedSignal.stopLoss}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-400 uppercase">Target 1 (1.5R)</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    ${selectedSignal.takeProfit1}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-cyan-400 uppercase">Target 2 (2.5R)</div>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">
                    ${selectedSignal.takeProfit2}
                  </div>
                </div>
              </div>

              {/* Volatility Sizing Box */}
              <div className="p-3 rounded bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-400">Volatility-Adjusted Position Size: </span>
                  <strong className="text-cyan-300">${selectedSignal.suggestedPositionSizeUsd.toLocaleString()}</strong>
                  <span className="text-[10px] text-slate-400 ml-1.5">(Risk: 0.5% / $50)</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">Risk:Reward {selectedSignal.riskRewardRatio}:1</span>
              </div>

              {/* Calibrated Historical Performance Metrics */}
              {selectedSignal.historicalCalibration && (
                <div className="border border-slate-800 rounded p-3 space-y-2 bg-slate-950/40 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Calibrated Historical Statistics (Similar Setups in Sample)</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center font-mono pt-1">
                    <div className="bg-slate-900 p-2 rounded">
                      <div className="text-[10px] text-slate-400">Sample Size</div>
                      <div className="font-bold text-slate-200 mt-0.5">{selectedSignal.historicalCalibration.historicalSampleCount}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                      <div className="text-[10px] text-slate-400">Hist. Win Rate</div>
                      <div className="font-bold text-emerald-400 mt-0.5">{(selectedSignal.historicalCalibration.sampleWinRate * 100).toFixed(0)}%</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                      <div className="text-[10px] text-slate-400">Avg Return R</div>
                      <div className="font-bold text-cyan-300 mt-0.5">+{selectedSignal.historicalCalibration.avgRMultiple}R</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                      <div className="text-[10px] text-slate-400">Profit Factor</div>
                      <div className="font-bold text-emerald-400 mt-0.5">{selectedSignal.historicalCalibration.profitFactor}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action: Execute Signal into Position */}
              <div className="pt-2 space-y-2.5">
                {/* Trigger Status & Timing Banner */}
                {selectedSignal.triggerStatus === 'ACTIVE_TRIGGER' && (
                  <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-bounce" />
                    <span>
                      <strong>Instapmoment Actief:</strong> Kwantitatieve factor convergentie ({selectedSignal.scoreBreakdown.totalScore}/100) en MTF 15M trigger zijn bevestigd. Dit is het optimale moment voor trade-activatie.
                    </span>
                  </div>
                )}

                {selectedSignal.triggerStatus === 'FORMING_SETUP' && (
                  <div className="p-3 rounded bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>
                      <strong>Setup in Ontwikkeling:</strong> Factor score is gunstig ({selectedSignal.scoreBreakdown.totalScore}/100). Trade wacht op de definitieve 15M trigger-kaars of volume-uitbraak voor veilige activatie.
                    </span>
                  </div>
                )}

                {selectedSignal.triggerStatus === 'OVERBOUGHT' && (
                  <div className="p-3 rounded bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      <strong>Waarschuwing - Overbought:</strong> RSI momentum is oververhit. Direct instappen verhoogt risico op toprand-koop. Wacht op retest of pullback naar EMA21.
                    </span>
                  </div>
                )}

                {selectedSignal.triggerStatus === 'WATCHLIST' && (
                  <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>
                      <strong>Watchlist Status:</strong> Neutraal regime of onvoldoende directional momentum. Geen statistische edge voor trade-activatie.
                    </span>
                  </div>
                )}

                {executionFeedback && (
                  <div className={`p-3 rounded text-xs flex items-center gap-2 ${
                    executionFeedback.success 
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200' 
                      : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
                  }`}>
                    {executionFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                    <span>{executionFeedback.message}</span>
                  </div>
                )}

                <button
                  onClick={() => handleExecute(selectedSignal)}
                  disabled={isExecuting}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                    selectedSignal.triggerActive
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  } disabled:opacity-50`}
                >
                  <Zap className={`w-4 h-4 ${selectedSignal.triggerActive ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>
                    {isExecuting 
                      ? 'Order Wordt Geplaatst...' 
                      : selectedSignal.triggerActive
                      ? `⚡ Voer Nu Uit: BUY ${selectedSignal.symbol} @ $${selectedSignal.currentPrice} (Trigger Bevestigd)`
                      : `Handmatig Forceren: ${selectedSignal.action} ${selectedSignal.symbol} @ $${selectedSignal.currentPrice}`}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800 text-slate-500 text-xs">
              Select a signal from the left to view comprehensive score breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
