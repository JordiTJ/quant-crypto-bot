import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Power, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Clock,
  Layers,
  RotateCcw
} from 'lucide-react';
import { RiskConfig, RiskStatus } from '../types';

interface RiskSettingsViewProps {
  riskConfig: RiskConfig;
  riskStatus?: RiskStatus | null;
  onUpdateRiskConfig: (updates: Partial<RiskConfig>) => void;
  onResetCooldown?: () => void;
  killSwitchActive: boolean;
  onToggleKillSwitch: () => void;
}

export const RiskSettingsView: React.FC<RiskSettingsViewProps> = ({
  riskConfig,
  riskStatus,
  onUpdateRiskConfig,
  onResetCooldown,
  killSwitchActive,
  onToggleKillSwitch
}) => {
  const [form, setForm] = useState<RiskConfig>(riskConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resettingCooldown, setResettingCooldown] = useState(false);

  useEffect(() => {
    setForm(riskConfig);
  }, [riskConfig]);

  const handleSave = () => {
    onUpdateRiskConfig(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetCooldownClick = async () => {
    if (!onResetCooldown) return;
    setResettingCooldown(true);
    try {
      await onResetCooldown();
    } finally {
      setTimeout(() => setResettingCooldown(false), 800);
    }
  };

  const isCooldownActive = Boolean(riskStatus?.cooldownActive);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          Volatility-Adjusted Risk Engine & Circuit Breakers
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Strikte kwantitatieve risicobescherming: No Martingale, no unhedged averaging down.
          Positiegroottes schalen omgekeerd evenredig met de marktvolatiliteit (ATR), zodat elke trade exact het geconfigureerde percentage van je actuele vermogen riskeert.
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
                Blokkeert onmiddellijk alle orderplaatsingen en schakelt de executie-lus over alle actieve adapters uit.
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

      {/* Consecutive Loss Protection & Cooldown Status Card */}
      <div className={`p-4 rounded-lg border transition ${
        isCooldownActive 
          ? 'bg-amber-950/70 border-amber-500/80 shadow-lg' 
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className={`w-7 h-7 mt-0.5 ${isCooldownActive ? 'text-amber-400 animate-spin' : 'text-slate-400'}`} style={isCooldownActive ? { animationDuration: '6s' } : undefined} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Consecutive Loss Cooldown Circuit</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isCooldownActive 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isCooldownActive ? `ACTIEF (${riskStatus?.remainingMinutes} min resterend)` : 'INACTIEF (Normaal handelen)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Pauzeert automatisch het openen van nieuwe posities na een reeks opeenvolgende verliesgevende trades om kapitaalverlies in ongunstige markten te voorkomen.
              </p>
              <div className="flex items-center gap-4 mt-2 font-mono text-xs text-slate-300">
                <div>
                  Huidige verliesreeks:{' '}
                  <span className={`font-bold ${riskStatus && riskStatus.consecutiveLosses > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {riskStatus?.consecutiveLosses ?? 0}
                  </span>{' '}
                  / <span className="text-slate-400">{form.consecutiveLossCooldownCount ?? 3} trades</span>
                </div>
                <div>
                  Pauzeduur:{' '}
                  <span className="font-bold text-slate-200">{form.cooldownHours ?? 4} uur</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleResetCooldownClick}
              disabled={resettingCooldown}
              className={`px-4 py-2 rounded font-mono text-xs font-bold transition shadow flex items-center gap-1.5 ${
                isCooldownActive
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resettingCooldown ? 'animate-spin' : ''}`} />
              {resettingCooldown ? 'RESETTEN...' : isCooldownActive ? 'RESET COOLDOWN NU' : 'RESET VERLIESREEKS'}
            </button>
          </div>
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
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition shadow"
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
              Percentage van actuele vermogen geriskeerd per trade bij Stop Loss. Aanbevolen: 0.25% - 1.0%.
            </p>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="2.0"
              value={form.riskPerTradePercent}
              onChange={(e) => setForm({ ...form, riskPerTradePercent: parseFloat(e.target.value) || 0.5 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Max Daily Loss % */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-rose-400 font-bold block">Max Daily Loss (%)</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Bij het bereiken van dit dagverlies stopt de bot met handelen tot de volgende dag (00:00 UTC).
            </p>
            <input
              type="number"
              step="0.5"
              min="1.0"
              max="10.0"
              value={form.maxDailyLossPercent}
              onChange={(e) => setForm({ ...form, maxDailyLossPercent: parseFloat(e.target.value) || 2.0 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Consecutive Losses before Cooldown */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-amber-400 font-bold block">Opeenvolgende Verliezen voor Cooldown</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Aantal verliesgevende trades op rij waarna de bot automatisch een pauze inlast. (Standaard: 3 trades).
            </p>
            <input
              type="number"
              min="1"
              max="10"
              step="1"
              value={form.consecutiveLossCooldownCount ?? 3}
              onChange={(e) => setForm({ ...form, consecutiveLossCooldownCount: parseInt(e.target.value) || 3 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Cooldown Duration (Hours) */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-amber-400 font-bold block">Cooldown Duur (Uren)</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Aantal uur dat de bot pauzeert na het bereiken van de verliesreeks. (Bijv. 1 uur, 2 uur of 4 uur).
            </p>
            <input
              type="number"
              step="0.5"
              min="0.25"
              max="24.0"
              value={form.cooldownHours ?? 4}
              onChange={(e) => setForm({ ...form, cooldownHours: parseFloat(e.target.value) || 4 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Max Drawdown Pause % */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-amber-400 font-bold block">Max Drawdown Pause (%)</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Drawdown vanaf piekkapitaal waarna de bot pauzeert voor handmatige controle.
            </p>
            <input
              type="number"
              step="0.5"
              min="2.0"
              max="15.0"
              value={form.maxDrawdownPausePercent}
              onChange={(e) => setForm({ ...form, maxDrawdownPausePercent: parseFloat(e.target.value) || 5.0 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Max Drawdown Emergency % */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-rose-500 font-bold block">Max Drawdown Emergency Halt (%)</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Noodstopdrempel: sluit alle posities en activeert de master noodstop.
            </p>
            <input
              type="number"
              step="1.0"
              min="5.0"
              max="25.0"
              value={form.maxDrawdownEmergencyPercent}
              onChange={(e) => setForm({ ...form, maxDrawdownEmergencyPercent: parseFloat(e.target.value) || 10.0 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Max Open Positions */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-slate-300 font-bold block">Max Open Positions</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Maximaal aantal tegelijkertijd actieve trades over het gehele portfolio.
            </p>
            <input
              type="number"
              min="1"
              max="10"
              value={form.maxOpenPositions}
              onChange={(e) => setForm({ ...form, maxOpenPositions: parseInt(e.target.value) || 5 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Max Exposure Per Coin % */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-slate-300 font-bold block">Max Exposure Per Coin (%)</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Maximale positiewaarde voor een enkele coin ten opzichte van totale equity.
            </p>
            <input
              type="number"
              step="5"
              min="5"
              max="50"
              value={form.maxExposurePerCoinPercent}
              onChange={(e) => setForm({ ...form, maxExposurePerCoinPercent: parseFloat(e.target.value) || 20.0 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Max Correlated Positions */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-slate-300 font-bold block">Max Correlated Altcoin Positions</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Limiet op aantal simultane altcoin posities om over-correlatie te vermijden.
            </p>
            <input
              type="number"
              min="1"
              max="6"
              value={form.maxCorrelatedPositions ?? 3}
              onChange={(e) => setForm({ ...form, maxCorrelatedPositions: parseInt(e.target.value) || 3 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Volatility Sizing Mathematical Proof Callout */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          Mathematische Formule voor Volatiliteit-Aangepaste Sizing
        </h3>

        <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-cyan-300">
          <div>Risk Amount ($) = Account Equity &times; Risk Per Trade %</div>
          <div className="mt-1">Stop Loss Distance ($) = | Entry Price &minus; Stop Loss Price | = 2.0 &times; ATR(14)</div>
          <div className="mt-1 font-bold text-emerald-400">Position Quantity = Risk Amount / Stop Loss Distance</div>
        </div>

        <p className="text-xs text-slate-400">
          <strong>Kwantitatieve Invariant:</strong> Zodra de volatiliteit toeneemt (bijv. ATR verdubbelt), wordt de stop-afstand automatisch ruimer berekend. Als gevolg halveert de positiegrootte wiskundig automatisch. Hierdoor blijft het <em>absolute dollar-risico strikt constant</em>, ongeacht hoe hevig de markt beweegt.
        </p>
      </div>
    </div>
  );
};
