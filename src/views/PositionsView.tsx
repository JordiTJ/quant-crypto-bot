import React, { useState } from 'react';
import { 
  Layers, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Position } from '../types';

interface PositionsViewProps {
  positions: Position[];
  onClosePosition: (id: string) => void;
  onCloseAllPositions: () => void;
  onSimulateExit?: (positionId: string, reason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_STOP') => void;
}

export const PositionsView: React.FC<PositionsViewProps> = ({
  positions,
  onClosePosition,
  onCloseAllPositions,
  onSimulateExit
}) => {
  const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);

  const totalValueUsd = positions.reduce((acc, p) => acc + p.valueUsd, 0);
  const totalUnrealizedPnl = positions.reduce((acc, p) => acc + p.unrealizedPnl, 0);

  return (
    <div className="space-y-6">
      {/* Auto-Close Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg px-4 py-3 text-xs text-cyan-200">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div>
            <span className="font-bold text-white">Automatische Sluiting & Risicobeheer Actief:</span>
            <p className="text-[11px] text-cyan-300 mt-0.5">
              Open posities worden 24/7 gemonitord tegen de realtime beurskoersen. Zodra de koers de <strong>Stop Loss</strong>, <strong>Trailing Stop</strong> of <strong>Take Profit</strong> raakt, wordt de positie direct automatisch gesloten met exacte audit-logging van netto P&amp;L, beursfees en slippage.
            </p>
          </div>
        </div>
      </div>

      {/* Header and Summary Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Active Positions Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of active trade positions, dynamic trailing stops, and unrealized risk.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">Total Exposure</div>
            <div className="font-mono text-sm font-bold text-slate-200">${totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">Unrealized P&L</div>
            <div className={`font-mono text-sm font-bold ${totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
            </div>
          </div>

          {positions.length > 0 && (
            <button
              onClick={() => setShowCloseAllConfirm(true)}
              className="px-3 py-1.5 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs transition border border-rose-500/50 shadow-sm"
            >
              Close All Positions
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Close All */}
      {showCloseAllConfirm && (
        <div className="p-4 rounded-lg bg-rose-950/80 border border-rose-500 text-rose-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>Are you sure you want to close ALL {positions.length} open positions immediately at current market price?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onCloseAllPositions();
                setShowCloseAllConfirm(false);
              }}
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              Yes, Liquidate All
            </button>
            <button
              onClick={() => setShowCloseAllConfirm(false)}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Positions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        {positions.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No active positions open. Capital is protected in risk-free collateral.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-3 px-4">Asset / Side</th>
                  <th className="py-3 px-4">Strategy</th>
                  <th className="py-3 px-4">Entry &rarr; Mark Price</th>
                  <th className="py-3 px-4">Size & Value</th>
                  <th className="py-3 px-4">Stop Loss & Buffer</th>
                  <th className="py-3 px-4">Targets (TP1 / TP2)</th>
                  <th className="py-3 px-4">Trailing Stop</th>
                  <th className="py-3 px-4">Unrealized P&L</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {positions.map(p => {
                  const currentPrice = p.currentPrice || p.entryPrice;
                  const stopDistancePct = Math.abs(((currentPrice - p.stopLoss) / currentPrice) * 100);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-slate-100">{p.symbol}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            p.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {p.side}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.clientOrderId}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {p.strategy}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-300">${p.entryPrice.toLocaleString()} &rarr; <strong className="text-slate-100">${currentPrice.toLocaleString()}</strong></div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Entered: {new Date(p.entryTimestamp).toLocaleTimeString()}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div>{p.amount} {p.symbol.replace('USDT', '')}</div>
                        <div className="text-[10px] text-slate-500">${p.valueUsd.toFixed(2)}</div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="text-rose-400 font-semibold">${p.stopLoss}</div>
                        <div className="text-[10px] text-slate-500">Buffer: -{stopDistancePct.toFixed(2)}%</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-emerald-400">TP1: ${p.takeProfit1}</div>
                        <div className="text-cyan-400">TP2: ${p.takeProfit2}</div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {p.trailingStopActive ? (
                          <span className="inline-flex items-center gap-1 text-cyan-300 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            ${p.trailingStopPrice}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">Inactive</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className={`font-bold text-sm ${p.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {p.unrealizedPnl >= 0 ? '+' : ''}${p.unrealizedPnl.toFixed(2)}
                        </div>
                        <div className={`text-[10px] ${p.unrealizedPnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {p.unrealizedPnlPercent >= 0 ? '+' : ''}{p.unrealizedPnlPercent}%
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSimulateExit && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onSimulateExit(p.id, 'STOP_LOSS')}
                                title="Test Stop Loss: simuleert dat de beurskoers de harde Stop Loss raakt"
                                className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px] font-mono transition"
                              >
                                Test SL
                              </button>
                              <button
                                onClick={() => onSimulateExit(p.id, 'TAKE_PROFIT')}
                                title="Test Take Profit: simuleert dat de beurskoers het koersdoel TP2 bereikt"
                                className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] font-mono transition"
                              >
                                Test TP
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => onClosePosition(p.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-300 font-mono text-xs transition"
                          >
                            Sluit Nu
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
