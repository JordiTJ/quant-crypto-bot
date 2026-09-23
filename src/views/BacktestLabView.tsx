import React, { useState } from 'react';
import { 
  TrendingUp, 
  Play, 
  RotateCcw, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  Award, 
  Shuffle, 
  Calendar,
  CheckCircle2,
  Sliders,
  BarChart2
} from 'lucide-react';
import { BacktestEngine } from '../backtest/backtestEngine';
import { BacktestConfig, BacktestResult, StrategyType, Timeframe } from '../types';
import { EquityChart } from '../components/EquityChart';

export const BacktestLabView: React.FC = () => {
  const [config, setConfig] = useState<BacktestConfig>({
    symbol: 'BTCUSDT',
    timeframe: '1h',
    strategy: 'TREND_FOLLOWING',
    initialCapital: 10000,
    riskPerTradePercent: 0.5,
    makerFeePercent: 0.02,
    takerFeePercent: 0.06,
    slippagePercent: 0.05,
    useMultiTimeframe: true,
    partialExits: true,
    useTrailingStop: true,
    trailingStopAtrMultiplier: 2.0,
    atrStopMultiplier: 2.0,
    takeProfit1Multiple: 1.5,
    takeProfit2Multiple: 2.5,
    emaFastPeriod: 9,
    emaSlowPeriod: 21,
    adxThreshold: 22,
    rsiThreshold: 50
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult>(() => BacktestEngine.runBacktest(config));

  const handleRunBacktest = () => {
    setIsLoading(true);
    setTimeout(() => {
      try {
        const res = BacktestEngine.runBacktest(config);
        setResult(res);
      } catch (err: any) {
        alert(`Backtest error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }, 150);
  };

  const metrics = result.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Event-Driven Backtest & Walk-Forward Validation Laboratory
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Historical candle-by-candle simulation strictly adhering to zero look-ahead bias, realistic maker/taker fees, slippage modeling, Walk-Forward splits, and Monte Carlo bootstrap verification.
        </p>
      </div>

      {/* Configuration Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Parameter Controls & Assumptions
          </span>
          <button
            onClick={handleRunBacktest}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition shadow-md disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'SIMULATING...' : 'EXECUTE BACKTEST'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          {/* Symbol */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Asset</label>
            <select
              value={config.symbol}
              onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
              className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200"
            >
              <optgroup label="👑 Majors & L1s">
                <option value="BTCUSDT">BTC/USDT (Bitcoin)</option>
                <option value="ETHUSDT">ETH/USDT (Ethereum)</option>
                <option value="SOLUSDT">SOL/USDT (Solana)</option>
                <option value="BNBUSDT">BNB/USDT (BNB)</option>
                <option value="XRPUSDT">XRP/USDT (XRP)</option>
                <option value="SUIUSDT">SUI/USDT (Sui)</option>
                <option value="AVAXUSDT">AVAX/USDT (Avalanche)</option>
                <option value="ADAUSDT">ADA/USDT (Cardano)</option>
                <option value="NEARUSDT">NEAR/USDT (NEAR)</option>
                <option value="APTUSDT">APT/USDT (Aptos)</option>
              </optgroup>
              <optgroup label="🤖 AI & Data">
                <option value="TAOUSDT">TAO/USDT (Bittensor)</option>
                <option value="RENDERUSDT">RENDER/USDT (Render)</option>
                <option value="FETUSDT">FET/USDT (ASI FET)</option>
              </optgroup>
              <optgroup label="🏦 DeFi & Infra">
                <option value="LINKUSDT">LINK/USDT (Chainlink)</option>
                <option value="AAVEUSDT">AAVE/USDT (Aave)</option>
                <option value="UNIUSDT">UNI/USDT (Uniswap)</option>
              </optgroup>
              <optgroup label="🔥 Memes">
                <option value="DOGEUSDT">DOGE/USDT (Dogecoin)</option>
                <option value="PEPEUSDT">PEPE/USDT (Pepe)</option>
                <option value="SHIBUSDT">SHIB/USDT (Shiba Inu)</option>
              </optgroup>
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Timeframe</label>
            <select
              value={config.timeframe}
              onChange={(e) => setConfig({ ...config, timeframe: e.target.value as Timeframe })}
              className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200"
            >
              <option value="15m">15m (Intraday)</option>
              <option value="1h">1h (Swing Core)</option>
              <option value="4h">4h (Position)</option>
              <option value="1d">1D (Macro)</option>
            </select>
          </div>

          {/* Strategy */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Strategy</label>
            <select
              value={config.strategy}
              onChange={(e) => setConfig({ ...config, strategy: e.target.value as StrategyType })}
              className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200"
            >
              <option value="TREND_FOLLOWING">Strategy A: Trend Following</option>
              <option value="MOMENTUM_BREAKOUT">Strategy B: Momentum Breakout</option>
              <option value="PULLBACK">Strategy C: Macro Pullback Support</option>
              <option value="MEAN_REVERSION">Strategy D: Mean Reversion</option>
              <option value="VOLATILITY_BREAKOUT">Strategy E: Volatility Squeeze</option>
              <option value="ADAPTIVE_SCORE">Strategy F: Multi-Factor Adaptive</option>
            </select>
          </div>

          {/* Risk Per Trade % */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Risk / Trade (%)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="2.0"
              value={config.riskPerTradePercent}
              onChange={(e) => setConfig({ ...config, riskPerTradePercent: parseFloat(e.target.value) || 0.5 })}
              className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200"
            />
          </div>

          {/* Fees Taker % */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Taker Fee (%)</label>
            <input
              type="number"
              step="0.01"
              value={config.takerFeePercent}
              onChange={(e) => setConfig({ ...config, takerFeePercent: parseFloat(e.target.value) || 0.06 })}
              className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200"
            />
          </div>

          {/* Slippage % */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Slippage (%)</label>
            <input
              type="number"
              step="0.01"
              value={config.slippagePercent}
              onChange={(e) => setConfig({ ...config, slippagePercent: parseFloat(e.target.value) || 0.05 })}
              className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200"
            />
          </div>
        </div>

        {/* Feature Checkbox Toggles */}
        <div className="flex flex-wrap items-center gap-5 pt-2 border-t border-slate-800/80 text-xs">
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.partialExits}
              onChange={(e) => setConfig({ ...config, partialExits: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500"
            />
            <span>Partial Profit Exits (50% @ 1.5R, 25% @ 2.5R)</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.useTrailingStop}
              onChange={(e) => setConfig({ ...config, useTrailingStop: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500"
            />
            <span>ATR Trailing Stop (2.0x ATR)</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.useMultiTimeframe}
              onChange={(e) => setConfig({ ...config, useMultiTimeframe: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500"
            />
            <span>Macro Trend Gate (Price &gt; EMA 200)</span>
          </label>
        </div>
      </div>

      {/* KPI Tiles Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase">Net Return</div>
          <div className={`text-lg font-bold mt-1 ${metrics.totalNetReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {metrics.totalNetReturnPercent >= 0 ? '+' : ''}{metrics.totalNetReturnPercent}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">CAGR: {metrics.cagr}%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase">Sharpe Ratio</div>
          <div className="text-lg font-bold text-cyan-300 mt-1">{metrics.sharpeRatio}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sortino: {metrics.sortinoRatio}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase">Max Drawdown</div>
          <div className="text-lg font-bold text-rose-400 mt-1">-{metrics.maxDrawdownPercent}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Avg DD: -{metrics.avgDrawdownPercent.toFixed(1)}%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase">Profit Factor</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">{metrics.profitFactor}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Win Rate: {metrics.winRatePercent}%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase">Expectancy (R)</div>
          <div className="text-lg font-bold text-cyan-300 mt-1">+{metrics.expectancyR}R</div>
          <div className="text-[10px] text-slate-500 mt-0.5">R:R Ratio: {metrics.riskRewardRatio}:1</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase">Trades & Fees</div>
          <div className="text-lg font-bold text-slate-200 mt-1">{metrics.totalTrades}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Fees: ${metrics.totalFeesPaid}</div>
        </div>
      </div>

      {/* Comparison against Buy & Hold */}
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Benchmark Comparison:</span>
          <span>Strategy: <strong className="text-cyan-300">+{metrics.totalNetReturnPercent}%</strong></span>
          <span>vs</span>
          <span>Buy & Hold {config.symbol.replace('USDT', '')}: <strong className={metrics.buyAndHoldAssetReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{metrics.buyAndHoldAssetReturnPercent}%</strong></span>
          <span>vs</span>
          <span>Buy & Hold BTC: <strong className={metrics.buyAndHoldBtcReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{metrics.buyAndHoldBtcReturnPercent}%</strong></span>
        </div>

        {/* Robustness Composite Badge */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-sans">Robustness Composite:</span>
          <span className="px-2 py-0.5 rounded font-bold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            {metrics.robustnessCompositeScore}/100
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            metrics.overfittingRisk === 'LOW'
              ? 'bg-emerald-500/20 text-emerald-300'
              : metrics.overfittingRisk === 'MEDIUM'
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-rose-500/20 text-rose-300'
          }`}>
            Overfitting Risk: {metrics.overfittingRisk}
          </span>
        </div>
      </div>

      {/* Interactive Equity Curve & Drawdown Chart */}
      <EquityChart data={result.equityCurve} height={320} />

      {/* Walk-Forward & Monte Carlo 2-Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Walk-Forward Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Walk-Forward Optimization Splits
            </h3>
            <span className="text-[11px] font-mono text-cyan-300">
              Consistency Ratio: {result.walkForward.consistencyRatio}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Split into 60% In-Sample (Train), 20% In-Sample (Validation), and 20% strictly unseen Out-Of-Sample (Test).
          </p>

          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-1">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">60% Train P&L</div>
              <div className="font-bold text-slate-200 mt-1">${result.walkForward.trainReturn}</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">20% Validation</div>
              <div className="font-bold text-slate-200 mt-1">${result.walkForward.validationReturn}</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">20% Out-of-Sample</div>
              <div className="font-bold text-emerald-400 mt-1">${result.walkForward.outOfSampleReturn}</div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 text-xs font-mono">
            {result.walkForward.windows.map(w => (
              <div key={w.windowId} className="p-2 rounded bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Rolling Window #{w.windowId}:</span>
                <span className="text-slate-200">Train: ${w.trainPnl} | Test: ${w.testPnl}</span>
                <span className="text-cyan-300">Sharpe: {w.sharpe}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monte Carlo Permutation Simulation */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-emerald-400" />
              Monte Carlo Permutation (500 Runs)
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">
              Ruin Prob: {result.monteCarlo.ruinProbabilityPercent}%
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Reshuffles historical trades across 500 permutations with replacement to test path dependency, tail risks, and maximum drawdown probability.
          </p>

          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-1">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] text-rose-400 uppercase">5th %ile (Worst Case)</div>
              <div className="font-bold text-rose-400 mt-1">{result.monteCarlo.worstCase5thPercentileReturn}%</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] text-cyan-300 uppercase">50th %ile (Median)</div>
              <div className="font-bold text-cyan-300 mt-1">{result.monteCarlo.medianReturn}%</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] text-emerald-400 uppercase">95th %ile (Best Case)</div>
              <div className="font-bold text-emerald-400 mt-1">{result.monteCarlo.bestCase95thPercentileReturn}%</div>
            </div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between">
            <span className="text-slate-400">95th Percentile Maximum Drawdown:</span>
            <strong className="text-rose-400">-{result.monteCarlo.maxDrawdown95thPercentile}%</strong>
          </div>
        </div>
      </div>

      {/* Regime-by-Regime Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs font-bold text-slate-200">
          Regime-by-Regime Performance Attribution
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Market Regime</th>
                <th className="py-2.5 px-4">Trades</th>
                <th className="py-2.5 px-4">Win Rate</th>
                <th className="py-2.5 px-4">Profit Factor</th>
                <th className="py-2.5 px-4">Net P&L ($)</th>
                <th className="py-2.5 px-4">Avg Return (R)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {metrics.regimeBreakdown.map(r => (
                <tr key={r.regime} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-200">{r.regime}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-400">{r.tradeCount}</td>
                  <td className="py-2.5 px-4 font-mono text-emerald-400">{r.winRate}%</td>
                  <td className="py-2.5 px-4 font-mono text-cyan-300">{r.profitFactor}</td>
                  <td className={`py-2.5 px-4 font-mono font-bold ${r.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {r.netPnl >= 0 ? '+' : ''}${r.netPnl}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-300">+{r.avgReturnR}R</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
