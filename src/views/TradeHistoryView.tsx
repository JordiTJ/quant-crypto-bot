import React, { useState } from 'react';
import { 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { TradeRecord } from '../types';

interface TradeHistoryViewProps {
  trades: TradeRecord[];
}

export const TradeHistoryView: React.FC<TradeHistoryViewProps> = ({ trades }) => {
  const [filterStrategy, setFilterStrategy] = useState<string>('ALL');

  const filteredTrades = trades.filter(t => {
    if (filterStrategy === 'ALL') return true;
    return t.strategy.toLowerCase().includes(filterStrategy.toLowerCase());
  });

  const totalTrades = trades.length;
  const wins = trades.filter(t => t.netPnl > 0).length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const totalNetPnl = trades.reduce((acc, t) => acc + t.netPnl, 0);
  const totalFees = trades.reduce((acc, t) => acc + t.feesPaid, 0);
  const totalSlippage = trades.reduce((acc, t) => acc + t.slippageCost, 0);
  const grossWins = trades.filter(t => t.netPnl > 0).reduce((acc, t) => acc + t.netPnl, 0);
  const grossLosses = Math.abs(trades.filter(t => t.netPnl <= 0).reduce((acc, t) => acc + t.netPnl, 0));
  const profitFactor = grossLosses === 0 ? (grossWins > 0 ? 9.9 : 1.0) : (grossWins / grossLosses);

  return (
    <div className="space-y-6">
      {/* Header and Summary KPIs */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Trade Audit Trail & Execution History
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Every trade execution is immutably logged with entry/exit prices, fees, slippage, market regime, signal score, and indicators at entry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStrategy}
              onChange={(e) => setFilterStrategy(e.target.value)}
              className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="ALL">All Strategies</option>
              <option value="Trend">Trend Following</option>
              <option value="Momentum">Momentum Breakout</option>
              <option value="Pullback">Pullback Support</option>
              <option value="Adaptive">Adaptive Multi-Factor</option>
            </select>
          </div>
        </div>

        {/* 5-Tile Performance KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-800 text-center font-mono">
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase">Total Trades</div>
            <div className="text-base font-bold text-slate-100 mt-0.5">{totalTrades}</div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase">Win Rate</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{winRate.toFixed(1)}%</div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase">Profit Factor</div>
            <div className="text-base font-bold text-cyan-300 mt-0.5">{profitFactor.toFixed(2)}</div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase">Total Net P&L</div>
            <div className={`text-base font-bold mt-0.5 ${totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalNetPnl >= 0 ? '+' : ''}${totalNetPnl.toFixed(2)}
            </div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase">Fees & Slippage</div>
            <div className="text-base font-bold text-slate-300 mt-0.5">${(totalFees + totalSlippage).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-4">Date / ID</th>
                <th className="py-3 px-4">Asset / Side</th>
                <th className="py-3 px-4">Strategy</th>
                <th className="py-3 px-4">Entry &rarr; Exit Price</th>
                <th className="py-3 px-4">Size & Return R</th>
                <th className="py-3 px-4">Fees & Slippage</th>
                <th className="py-3 px-4">Net P&L ($ & %)</th>
                <th className="py-3 px-4">Exit Reason</th>
                <th className="py-3 px-4">Indicators at Entry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTrades.map(tr => (
                <tr key={tr.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono text-slate-400">
                    <div>{new Date(tr.exitTimestamp).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-500">{tr.id}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-bold text-slate-100">{tr.symbol}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        tr.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {tr.side}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{tr.marketRegime}</div>
                  </td>

                  <td className="py-3 px-4 text-slate-300">
                    {tr.strategy}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-200">
                    <div>
                      ${tr.entryPrice.toLocaleString(undefined, {
                        minimumFractionDigits: tr.entryPrice > 10 ? 2 : tr.entryPrice > 0.01 ? 4 : 8,
                        maximumFractionDigits: tr.entryPrice > 10 ? 2 : tr.entryPrice > 0.01 ? 4 : 8
                      })} &rarr; ${tr.exitPrice.toLocaleString(undefined, {
                        minimumFractionDigits: tr.exitPrice > 10 ? 2 : tr.exitPrice > 0.01 ? 4 : 8,
                        maximumFractionDigits: tr.exitPrice > 10 ? 2 : tr.exitPrice > 0.01 ? 4 : 8
                      })}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Duration: {Math.max(1, Math.round((tr.exitTimestamp - tr.entryTimestamp) / 3600000))} hrs
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono">
                    <div>{tr.amount.toLocaleString(undefined, { maximumFractionDigits: tr.amount > 100 ? 2 : 6 })} {tr.symbol.replace('USDT', '')}</div>
                    <div className={`text-[10px] font-bold ${tr.returnR >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tr.returnR >= 0 ? '+' : ''}{tr.returnR}R
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    <div>Fee: ${tr.feesPaid.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">Slip: ${tr.slippageCost.toFixed(2)}</div>
                  </td>

                  <td className="py-3 px-4 font-mono">
                    <div className={`font-bold text-sm ${tr.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tr.netPnl >= 0 ? '+' : ''}${tr.netPnl.toFixed(2)}
                    </div>
                    <div className={`text-[10px] ${tr.netPnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tr.netPnlPercent >= 0 ? '+' : ''}{tr.netPnlPercent}%
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      tr.exitReason.includes('PROFIT')
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : tr.exitReason === 'STOP_LOSS'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {tr.exitReason}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                    <div>ADX: <span className="text-slate-200">{tr.indicatorsAtEntry?.adx || '-'}</span> | RSI: <span className="text-slate-200">{tr.indicatorsAtEntry?.rsi || '-'}</span></div>
                    <div>ATR%: <span className="text-slate-200">{tr.indicatorsAtEntry?.atrPercent || '-'}%</span> | RVol: <span className="text-slate-200">{tr.indicatorsAtEntry?.rvol || '-'}</span></div>
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
