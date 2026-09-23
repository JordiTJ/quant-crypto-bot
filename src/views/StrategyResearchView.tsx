import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck,
  Grid
} from 'lucide-react';
import { ResearchEngine } from '../research/researchEngine';
import { StrategyResearchItem } from '../types';

export const StrategyResearchView: React.FC = () => {
  const [strategies] = useState<StrategyResearchItem[]>(() => ResearchEngine.getStrategyResearchResults());
  const [correlations] = useState(() => ResearchEngine.getIndicatorCorrelationMatrix());
  const [selectedStrat, setSelectedStrat] = useState<StrategyResearchItem>(strategies[0]);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          Strategy Discovery & Feature Importance
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Systematic discovery matrix evaluating Strategies A through F against realistic crypto market regimes.
          Strategies are scored on statistical robustness, out-of-sample consistency, and survivability after transaction costs.
        </p>
      </div>

      {/* Strategies Discovery Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-200">
          <span>Comparative Strategy Evaluation Matrix</span>
          <span className="text-[11px] font-mono text-slate-400">Tested across 24-month multi-regime sample</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-4">Strategy</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Win Rate</th>
                <th className="py-3 px-4">Profit Factor</th>
                <th className="py-3 px-4">Sharpe</th>
                <th className="py-3 px-4">Max DD</th>
                <th className="py-3 px-4">Annualized</th>
                <th className="py-3 px-4">Robustness Score</th>
                <th className="py-3 px-4">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {strategies.map(s => {
                const isSelected = selectedStrat.id === s.id;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStrat(s)}
                    className={`cursor-pointer transition ${isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-800/30'}`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.verdict === 'HIGHLY_ROBUST' ? 'bg-emerald-400' : s.verdict === 'REGIME_DEPENDENT' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{s.category}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{s.sampleWinRate}%</td>
                    <td className="py-3 px-4 font-mono text-cyan-300 font-bold">{s.profitFactor}</td>
                    <td className="py-3 px-4 font-mono text-slate-200">{s.sharpeRatio}</td>
                    <td className="py-3 px-4 font-mono text-rose-400">-{s.maxDrawdown}%</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-bold">+{s.annualizedReturn}%</td>
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{s.compositeRobustness}</span>
                        <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-cyan-400 h-full" style={{ width: `${s.compositeRobustness}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        s.verdict === 'HIGHLY_ROBUST'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : s.verdict === 'REGIME_DEPENDENT'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {s.verdict}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Strategy Deep-Dive Card */}
      {selectedStrat && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">{selectedStrat.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedStrat.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Robustness:</span>
              <span className="font-mono text-sm font-bold text-cyan-300">{selectedStrat.compositeRobustness}/100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3 bg-slate-950 p-3.5 rounded border border-slate-800">
              <div>
                <span className="font-mono text-slate-400 uppercase text-[10px] block mb-1">Entry Concept</span>
                <p className="text-slate-200">{selectedStrat.entryConcept}</p>
              </div>
              <div>
                <span className="font-mono text-slate-400 uppercase text-[10px] block mb-1">Exit Concept</span>
                <p className="text-slate-200">{selectedStrat.exitConcept}</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950 p-3.5 rounded border border-slate-800">
              <div>
                <span className="font-mono text-slate-400 uppercase text-[10px] block mb-1">Core Indicators Used</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedStrat.coreIndicators.map(ind => (
                    <span key={ind} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px] border border-slate-700">
                      {ind}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-mono text-slate-400 uppercase text-[10px] block mb-1">Ideal vs Unreliable Regimes</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-emerald-400 font-mono text-[11px]">Ideal: {selectedStrat.idealRegimes.join(', ')}</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-rose-400 font-mono text-[11px]">Avoid: {selectedStrat.unreliableRegimes.join(', ')}</span>
                </div>
              </div>

              <div>
                <span className="font-mono text-slate-400 uppercase text-[10px] block mb-1">Quantitative Notes</span>
                <p className="text-slate-300 italic">{selectedStrat.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Indicator Soup Correlation Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Grid className="w-4 h-4 text-cyan-400" />
              Indicator Cross-Correlation Heatmap (Anti-"Indicator Soup" Guard)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              High correlation (&gt;0.70) indicates redundancy (e.g. combining EMA with MACD adds almost zero orthogonal information while doubling false positives).
              Optimal quantitative systems combine orthogonal features: Trend (EMA/ADX) + Volume (RVol) + Volatility (ATR).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="py-2.5 px-3 text-left text-slate-400">Indicator</th>
                {correlations.labels.map(l => (
                  <th key={l} className="py-2.5 px-3 text-slate-300 font-semibold">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {correlations.matrix.map((row, rowIdx) => (
                <tr key={correlations.labels[rowIdx]} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 text-left font-semibold text-slate-200">
                    {correlations.labels[rowIdx]}
                  </td>
                  {row.map((val, colIdx) => {
                    const isSelf = rowIdx === colIdx;
                    const isHigh = val >= 0.70 && !isSelf;
                    const isLow = val <= 0.30;

                    let bg = 'bg-slate-950 text-slate-400';
                    if (isSelf) bg = 'bg-slate-800 text-slate-500 font-bold';
                    else if (isHigh) bg = 'bg-rose-950/80 text-rose-300 font-bold border border-rose-500/40';
                    else if (isLow) bg = 'bg-emerald-950/60 text-emerald-300 font-semibold';
                    else bg = 'bg-slate-900 text-slate-300';

                    return (
                      <td key={colIdx} className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-1 rounded text-[11px] ${bg}`}>
                          {val.toFixed(2)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
