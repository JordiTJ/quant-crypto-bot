import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  AlertTriangle,
  Award
} from 'lucide-react';
import { ResearchEngine } from '../research/researchEngine';
import { IndicatorResearchItem } from '../types';

export const IndicatorResearchView: React.FC = () => {
  const [catalog] = useState<IndicatorResearchItem[]>(() => ResearchEngine.getIndicatorResearchCatalog());
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = catalog.filter(item => {
    const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchSearch = item.indicator.toLowerCase().includes(searchTerm.toLowerCase()) || item.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Systematic Indicator Research Catalog
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Rigorous quantitative audit of individual technical indicators. Prevents "indicator soup" by documenting expected edge, known structural weaknesses, regime boundaries, and out-of-sample marginal contribution.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search indicator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="ALL">All Categories</option>
              <option value="TREND">Trend Indicators</option>
              <option value="MOMENTUM">Momentum Oscillators</option>
              <option value="VOLATILITY">Volatility Indicators</option>
              <option value="VOLUME">Volume Factors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-4">Indicator</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Purpose & Formula</th>
                <th className="py-3 px-4">Expected Edge</th>
                <th className="py-3 px-4">Known Weakness</th>
                <th className="py-3 px-4">Useful vs Unreliable Regimes</th>
                <th className="py-3 px-4">Correlation with Others</th>
                <th className="py-3 px-4">OOS Impact</th>
                <th className="py-3 px-4">Importance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map(item => (
                <tr key={item.indicator} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100 whitespace-nowrap">
                    {item.indicator}
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 border border-slate-700">
                      {item.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 min-w-[200px]">
                    {item.purpose}
                  </td>

                  <td className="py-3.5 px-4 text-emerald-300 min-w-[200px]">
                    {item.expectedEdge}
                  </td>

                  <td className="py-3.5 px-4 text-rose-300 min-w-[200px]">
                    {item.knownWeakness}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] min-w-[180px]">
                    <div className="text-emerald-400">Good: {item.marketsUseful}</div>
                    <div className="text-rose-400 mt-1">Bad: {item.marketsUnreliable}</div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-[11px] min-w-[180px]">
                    {item.correlationWithOthers}
                  </td>

                  <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.marginalOosImpact === 'POSITIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : item.marginalOosImpact === 'NEUTRAL'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {item.marginalOosImpact}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{item.featureImportanceScore}</span>
                      <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-cyan-400 h-full" style={{ width: `${item.featureImportanceScore}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
