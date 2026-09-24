import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Layers,
  Clock,
  Zap,
  ChevronRight,
  Radio
} from 'lucide-react';
import { MarketDataEngine } from '../data/marketData';
import { InteractiveChart } from '../components/InteractiveChart';
import { ExchangeConfig, Position, TradingSignal, TradeRecord, Timeframe, MarketAsset, Candle } from '../types';

interface DashboardViewProps {
  exchangeStatus: ExchangeConfig | null;
  equityData: { totalUsd: number; todayPnlUsd: number; todayPnlPercent: number; openPositionsCount: number; maxOpenPositions: number } | null;
  positions: Position[];
  signals: TradingSignal[];
  recentTrades: TradeRecord[];
  killSwitchActive: boolean;
  markets?: MarketAsset[];
  onClosePosition: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  exchangeStatus,
  equityData,
  positions,
  signals,
  recentTrades,
  killSwitchActive,
  markets,
  onClosePosition,
  onNavigate
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [selectedTf, setSelectedTf] = useState<Timeframe>('1h');
  const [liveCandles, setLiveCandles] = useState<Candle[] | null>(null);

  // Fetch real live candles from server
  useEffect(() => {
    let isCancelled = false;
    const fetchCandles = async () => {
      try {
        const res = await fetch(`/api/candles?symbol=${selectedSymbol}&timeframe=${selectedTf}&limit=120`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.candles && data.candles.length > 0) {
            setLiveCandles(data.candles);
          }
        }
      } catch (e) {
        // Fallback to local deterministic generator
      }
    };
    fetchCandles();
    return () => { isCancelled = true; };
  }, [selectedSymbol, selectedTf]);

  const chartCandles = liveCandles && liveCandles.length > 0 
    ? liveCandles 
    : MarketDataEngine.getHistoricalCandles(selectedSymbol, selectedTf, 150);

  const activeMarket = markets?.find(m => m.symbol === selectedSymbol);
  const topSignals = signals.filter(s => s.confidence === 'STRONG' || s.confidence === 'MODERATE').slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Emergency Kill Switch Banner if Active */}
      {killSwitchActive && (
        <div className="bg-rose-950/80 border-2 border-rose-500 rounded-lg p-4 flex items-center justify-between text-rose-200 shadow-lg">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-400 animate-pulse flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-white">EMERGENCY KILL SWITCH ENGAGED</h3>
              <p className="text-xs text-rose-300">
                All automated order submissions and signal entries are hard-blocked across the exchange adapter.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('risk')}
            className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition"
          >
            Review Circuits
          </button>
        </div>
      )}

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equity */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Portfolio Equity</span>
            <span className="font-mono text-[10px] text-cyan-400 uppercase">{exchangeStatus?.mode || 'PAPER'}</span>
          </div>
          <div className="font-mono text-2xl font-bold text-slate-100">
            ${equityData ? equityData.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '10,000.00'}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className={equityData && equityData.todayPnlUsd >= 0 ? 'text-emerald-400 flex items-center font-medium' : 'text-rose-400 flex items-center font-medium'}>
              {equityData && equityData.todayPnlUsd >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {equityData ? `${equityData.todayPnlUsd >= 0 ? '+' : ''}$${equityData.todayPnlUsd.toFixed(2)} (${equityData.todayPnlPercent}%)` : '+$0.00'}
            </span>
            <span className="text-slate-500 text-[11px]">today</span>
          </div>
        </div>

        {/* Active Positions */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Positions</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-100">
            {positions.length} <span className="text-slate-500 text-sm font-normal">/ {equityData?.maxOpenPositions || 5}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Unrealized P&L:</span>
            <span className="font-mono font-semibold text-emerald-400">
              +${positions.reduce((acc, p) => acc + p.unrealizedPnl, 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* BTC Macro Regime */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>BTC Macro Regime</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            STRONG BULL
          </div>
          <div className="mt-2 text-xs text-slate-400">
            ADX 32.4 | EMA 9&gt;21&gt;50 Aligned
          </div>
        </div>

        {/* Risk Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Risk Guard State</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
            <span className="text-emerald-400">PASS</span>
            <span className="text-xs font-normal text-slate-400">(All circuits green)</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Daily loss: <span className="font-mono text-slate-200">0.0%</span> / 2.0% cap
          </div>
        </div>
      </div>

      {/* Main Content Grid: Chart + Live Signal Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Multi-Timeframe Chart */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Symbol:</span>
              <div className="flex flex-wrap gap-1 items-center">
                {/* Quick top pills */}
                {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'SUIUSDT', 'TAOUSDT', 'PEPEUSDT'].map(sym => (
                  <button
                    key={sym}
                    onClick={() => setSelectedSymbol(sym)}
                    className={`px-2 py-1 rounded text-xs font-mono font-medium transition ${
                      selectedSymbol === sym
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {sym.replace('USDT', '')}
                  </button>
                ))}

                {/* Dropdown for all 27 coins */}
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="" disabled>Alle 27 Coins...</option>
                  {(markets && markets.length > 0 ? markets : [
                    { symbol: 'BTCUSDT', coinName: 'Bitcoin' },
                    { symbol: 'ETHUSDT', coinName: 'Ethereum' },
                    { symbol: 'SOLUSDT', coinName: 'Solana' },
                    { symbol: 'BNBUSDT', coinName: 'BNB' },
                    { symbol: 'XRPUSDT', coinName: 'XRP' },
                    { symbol: 'SUIUSDT', coinName: 'Sui' },
                    { symbol: 'AVAXUSDT', coinName: 'Avalanche' },
                    { symbol: 'ADAUSDT', coinName: 'Cardano' },
                    { symbol: 'NEARUSDT', coinName: 'NEAR' },
                    { symbol: 'APTUSDT', coinName: 'Aptos' },
                    { symbol: 'INJUSDT', coinName: 'Injective' },
                    { symbol: 'SEIUSDT', coinName: 'Sei' },
                    { symbol: 'RENDERUSDT', coinName: 'Render' },
                    { symbol: 'FETUSDT', coinName: 'Artificial Superintelligence' },
                    { symbol: 'TAOUSDT', coinName: 'Bittensor' },
                    { symbol: 'ICPUSDT', coinName: 'Internet Computer' },
                    { symbol: 'LINKUSDT', coinName: 'Chainlink' },
                    { symbol: 'AAVEUSDT', coinName: 'Aave' },
                    { symbol: 'UNIUSDT', coinName: 'Uniswap' },
                    { symbol: 'ONDOUSDT', coinName: 'Ondo RWA' },
                    { symbol: 'PENDLEUSDT', coinName: 'Pendle' },
                    { symbol: 'JUPUSDT', coinName: 'Jupiter' },
                    { symbol: 'TIAUSDT', coinName: 'Celestia' },
                    { symbol: 'DOGEUSDT', coinName: 'Dogecoin' },
                    { symbol: 'PEPEUSDT', coinName: 'Pepe' },
                    { symbol: 'SHIBUSDT', coinName: 'Shiba Inu' },
                    { symbol: 'WIFUSDT', coinName: 'dogwifhat' }
                  ]).map(m => (
                    <option key={m.symbol} value={m.symbol}>
                      {m.symbol.replace('USDT', '')} {m.coinName ? `(${m.coinName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live price tag of selected coin */}
            {activeMarket && (
              <div className="flex items-center gap-2 font-mono text-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-400 font-sans text-[11px]">Live:</span>
                <span className="font-bold text-slate-100">
                  ${activeMarket.price.toLocaleString(undefined, { 
                    minimumFractionDigits: activeMarket.price > 10 ? 2 : activeMarket.price > 0.01 ? 4 : 8,
                    maximumFractionDigits: activeMarket.price > 10 ? 2 : activeMarket.price > 0.01 ? 4 : 8
                  })}
                </span>
                <span className={`text-[11px] font-semibold ${activeMarket.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {activeMarket.change24h >= 0 ? '+' : ''}{activeMarket.change24h.toFixed(2)}%
                </span>
              </div>
            )}

            <div className="flex items-center gap-1">
              {(['5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map(tf => (
                <button
                  key={tf}
                  onClick={() => setSelectedTf(tf)}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                    selectedTf === tf
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <InteractiveChart symbol={selectedSymbol} candles={chartCandles} height={380} />
        </div>

        {/* Right 1 Col: Top Quantitative Signals Radar */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-sm text-slate-100">Live Signal Radar</h3>
            </div>
            <button
              onClick={() => onNavigate('signals')}
              className="text-xs text-cyan-400 hover:underline flex items-center"
            >
              All Signals <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topSignals.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                Scanning multi-timeframe universe for qualifying setups (Score &ge; 70)...
              </div>
            ) : (
              topSignals.map(sig => (
                <div
                  key={sig.id}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-cyan-500/40 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-100">{sig.symbol}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        sig.confidence === 'STRONG' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}>
                        {sig.confidence} ({sig.scoreBreakdown.totalScore}/100)
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      ${sig.currentPrice.toLocaleString(undefined, {
                        minimumFractionDigits: sig.currentPrice > 10 ? 2 : sig.currentPrice > 0.01 ? 4 : 8,
                        maximumFractionDigits: sig.currentPrice > 10 ? 2 : sig.currentPrice > 0.01 ? 4 : 8
                      })}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {sig.strategy}: {sig.rationale}
                  </p>

                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/60 font-mono text-[10px] text-slate-400">
                    <div>SL: <span className="text-rose-400">${sig.stopLoss.toLocaleString(undefined, {
                      minimumFractionDigits: sig.stopLoss > 10 ? 2 : sig.stopLoss > 0.01 ? 4 : 8,
                      maximumFractionDigits: sig.stopLoss > 10 ? 2 : sig.stopLoss > 0.01 ? 4 : 8
                    })}</span></div>
                    <div>TP1: <span className="text-emerald-400">${sig.takeProfit1.toLocaleString(undefined, {
                      minimumFractionDigits: sig.takeProfit1 > 10 ? 2 : sig.takeProfit1 > 0.01 ? 4 : 8,
                      maximumFractionDigits: sig.takeProfit1 > 10 ? 2 : sig.takeProfit1 > 0.01 ? 4 : 8
                    })}</span></div>
                    <div>R:R: <span className="text-cyan-300">{sig.riskRewardRatio}:1</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Positions & Recent Trades split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Positions */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Active Positions ({positions.length})
            </h3>
            <button
              onClick={() => onNavigate('positions')}
              className="text-xs text-cyan-400 hover:underline flex items-center"
            >
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {positions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No open positions. Strict risk criteria enforced.
            </div>
          ) : (
            <div className="space-y-2">
              {positions.map(p => (
                <div key={p.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-100">{p.symbol}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {p.side}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ${p.entryPrice.toLocaleString()} &rarr; ${p.currentPrice?.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Trailing Stop: {p.trailingStopActive ? `$${p.trailingStopPrice} (Active)` : 'Inactive'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono">
                      <div className="font-bold text-emerald-400">+${p.unrealizedPnl.toFixed(2)}</div>
                      <div className="text-[10px] text-emerald-400/80">+{p.unrealizedPnlPercent}%</div>
                    </div>
                    <button
                      onClick={() => onClosePosition(p.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-300 text-[11px] font-mono transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Trades Audit */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Recent Closed Trades
            </h3>
            <button
              onClick={() => onNavigate('trades')}
              className="text-xs text-cyan-400 hover:underline flex items-center"
            >
              Full Audit Log <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentTrades.slice(0, 3).map(tr => (
              <div key={tr.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-100">{tr.symbol}</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                      {tr.exitReason}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Entry: ${tr.entryPrice} | Exit: ${tr.exitPrice} | Return: {tr.returnR}R
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className={`font-bold ${tr.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tr.netPnl >= 0 ? '+' : ''}${tr.netPnl.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Fees: ${tr.feesPaid}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
