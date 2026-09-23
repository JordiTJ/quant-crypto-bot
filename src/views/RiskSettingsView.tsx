import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Power, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Clock,
  Layers
} from 'lucide-react';
import { RiskConfig } from '../types';

interface RiskSettingsViewProps {
  riskConfig: RiskConfig;
  onUpdateRiskConfig: (updates: Partial<RiskConfig>) => void;
  killSwitchActive: boolean;
  onToggleKillSwitch: () => void;
}

export const RiskSettingsView: React.FC<RiskSettingsViewProps> = ({
  riskConfig,
  onUpdateRiskConfig,
  killSwitchActive,
  onToggleKillSwitch
}) => {
  const [form, setForm] = useState<RiskConfig>(riskConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onUpdateRiskConfig(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          Volatility-Adjusted Risk Engine & Circuit Breakers
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Strict quantitative risk protocols: No Martingale, no unhedged averaging down.
          Position sizes scale inversely with asset volatility (ATR) so that every trade risks exactly the configured percentage of equity.
        </p>
      </div>

      {/* Emergency Kill Switch Section */}
      <div className={`p-4 rounded-lg border transition ${
        killSwitchActive ? 'bg-rose-950/80 border-rose-500 shadow-lg' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Power className={`w-8 h-8 ${killSwitchActive ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Master Emergency Kill Switch</h3>
              <p className="text-xs text-slate-400">
                Immediately blocks all order creation and de-arms the execution loop across all active exchange adapters.
              </p>
            </div>
          </div>

          <button
            onClick={onToggleKillSwitch}
            className={`px-4 py-2 rounded font-mono text-xs font-bold transition shadow-md ${
              killSwitchActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-200 border border-slate-700'
            }`}
          >
            {killSwitchActive ? 'DEACTIVATE KILL SWITCH' : 'ACTIVATE KILL SWITCH NOW'}
          </button>
        </div>
      </div>

      {/* Risk Limits Form Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 font-mono">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Hard Mathematical Risk Guardrails
          </h3>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-emerald-400 text-xs flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Risk limits saved!
              </span>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition"
            >
              SAVE RISK SETTINGS
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs font-mono">
          {/* Risk Per Trade % */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-slate-300 font-bold block">Risk Per Trade (%)</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Percentage of total account equity risked if stop loss is hit. Recommended: 0.25% - 1.0%.
            </p>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="2.0"
              value={form.riskPerTradePercent}
              onChange={(e) => setForm({ ...form, riskPerTradePercent: parseFloat(e.target.value) || 0.5 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm"
            />
          </div>

          {/* Max Daily Loss % */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-rose-400 font-bold block">Max Daily Loss (%)</label>
            <p className="text-[11px] text-slate-500 font-sans">
              If daily realized losses reach this limit, all new trading is halted until 00:00 UTC.
            </p>
            <input
              type="number"
              step="0.5"
              min="1.0"
              max="10.0"
              value={form.maxDailyLossPercent}
              onChange={(e) => setForm({ ...form, maxDailyLossPercent: parseFloat(e.target.value) || 2.0 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm"
            />
          </div>

          {/* Max Drawdown Pause % */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-amber-400 font-bold block">Max Drawdown Pause (%)</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Drawdown from peak equity that automatically pauses strategy execution for manual inspection.
            </p>
            <input
              type="number"
              step="0.5"
              min="2.0"
              max="15.0"
              value={form.maxDrawdownPausePercent}
              onChange={(e) => setForm({ ...form, maxDrawdownPausePercent: parseFloat(e.target.value) || 5.0 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm"
            />
          </div>

          {/* Max Drawdown Emergency % */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-rose-500 font-bold block">Max Drawdown Emergency Halt (%)</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Catastrophic drawdown threshold that engages the master kill switch and closes all positions.
            </p>
            <input
              type="number"
              step="1.0"
              min="5.0"
              max="25.0"
              value={form.maxDrawdownEmergencyPercent}
              onChange={(e) => setForm({ ...form, maxDrawdownEmergencyPercent: parseFloat(e.target.value) || 10.0 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm"
            />
          </div>

          {/* Max Open Positions */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-slate-300 font-bold block">Max Open Positions</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Maximum concurrent open trades across the entire portfolio.
            </p>
            <input
              type="number"
              min="1"
              max="10"
              value={form.maxOpenPositions}
              onChange={(e) => setForm({ ...form, maxOpenPositions: parseInt(e.target.value) || 5 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm"
            />
          </div>

          {/* Max Exposure Per Coin % */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-slate-300 font-bold block">Max Exposure Per Coin (%)</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Position value cap for a single coin relative to total portfolio equity.
            </p>
            <input
              type="number"
              step="5"
              min="5"
              max="50"
              value={form.maxExposurePerCoinPercent}
              onChange={(e) => setForm({ ...form, maxExposurePerCoinPercent: parseFloat(e.target.value) || 20.0 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm"
            />
          </div>
        </div>
      </div>

      {/* Volatility Sizing Mathematical Proof Callout */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          Mathematical Formula for Volatility-Adjusted Sizing
        </h3>

        <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-cyan-300">
          <div>Risk Amount ($) = Account Equity &times; Risk Per Trade %</div>
          <div className="mt-1">Stop Loss Distance ($) = | Entry Price &minus; Stop Loss Price | = 2.0 &times; ATR(14)</div>
          <div className="mt-1 font-bold text-emerald-400">Position Quantity = Risk Amount / Stop Loss Distance</div>
        </div>

        <p className="text-xs text-slate-400">
          <strong>Key Invariant:</strong> When volatility expands (e.g. ATR doubles during a market breakout), the stop distance widens automatically. Consequently, position size is mathematically halved. As a result, <em>dollar risk remains strictly constant</em> regardless of market frenzy.
        </p>
      </div>
    </div>
  );
};
