import React, { useState } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  ArrowUpDown, 
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  Sparkles
} from 'lucide-react';
import { MarketAsset } from '../types';

interface MarketsViewProps {
  markets: MarketAsset[];
  onSelectMarket?: (symbol: string) => void;
}

export const MarketsView: React.FC<MarketsViewProps> = ({ markets, onSelectMarket }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(false);
  const [sortField, setSortField] = useState<keyof MarketAsset>('volume24hUsd');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = markets
    .filter(m => {
      const matchSearch = m.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || m.baseAsset.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterEligibleOnly) return matchSearch && m.isEligible;
      return matchSearch;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return 0;
    });

  const handleSort = (field: keyof MarketAsset) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Feed Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-200">LIVE COIN FEED ACTIEF:</span>
          <span>Alle 10 top coins zijn live gekoppeld aan de beurs koersen (Binance & Phemex REST feed).</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-emerald-400/90">
          <span className="bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-500/30">10s Auto-Sync</span>
          <span>Zero Look-Ahead Enforced</span>
        </div>
      </div>

      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Live Market Universe & Universe Screening
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Realtime rangschikking van alle cryptomarkten op basis van actuele beurskoersen, 24u-volume, orderboek spread en marktreacties.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Zoek coin (bijv. BTC, SOL)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <button
            onClick={() => setFilterEligibleOnly(!filterEligibleOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
              filterEligibleOnly
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Alleen Gekwalificeerd</span>
          </button>
        </div>
      </div>

      {/* Screened Universe Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-4"># Rank</th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('symbol')}>
                  <div className="flex items-center gap-1">Asset <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-1">Live Koers <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('change24h')}>
                  <div className="flex items-center gap-1">24u Verandering <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('volume24hUsd')}>
                  <div className="flex items-center gap-1">24u Volume <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('spreadPercent')}>
                  <div className="flex items-center gap-1">Spread % <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('liquidityScore')}>
                  <div className="flex items-center gap-1">Liquiditeitsscore <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('volatility24h')}>
                  <div className="flex items-center gap-1">Volatitiliteit (ATR %) <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4">Markt Regime</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((m, index) => {
                const isPositive = m.change24h >= 0;
                return (
                  <tr 
                    key={m.symbol} 
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => onSelectMarket && onSelectMarket(m.symbol)}
                  >
                    <td className="py-3 px-4 font-mono text-slate-500">#{index + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-100 flex items-center gap-2">
                      <span>{m.symbol}</span>
                      <span className="text-[10px] font-normal text-slate-400 bg-slate-800 px-1 rounded">
                        {m.quoteAsset}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      ${m.price.toLocaleString(undefined, { minimumFractionDigits: m.price > 10 ? 2 : 4 })}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isPositive 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isPositive ? '+' : ''}{m.change24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      ${(m.volume24hUsd / 1000000).toFixed(1)}M
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={m.spreadPercent <= 0.05 ? 'text-emerald-400' : m.spreadPercent <= 0.1 ? 'text-amber-400' : 'text-rose-400'}>
                        {m.spreadPercent}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${m.liquidityScore >= 80 ? 'bg-cyan-400' : m.liquidityScore >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}
                            style={{ width: `${m.liquidityScore}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-300">{m.liquidityScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {m.volatility24h}%
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        m.regime.includes('BULL')
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : m.regime.includes('BEAR')
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {m.regime}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {m.isEligible ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Gekwalificeerd
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 text-xs font-medium" title={m.exclusionReason}>
                          <XCircle className="w-3.5 h-3.5" />
                          {m.exclusionReason || 'Disqualified'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
