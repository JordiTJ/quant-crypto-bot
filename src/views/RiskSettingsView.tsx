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
  RotateCcw,
  TrendingDown,
  ToggleLeft,
  ToggleRight,
  Flame,
  Unlock
} from 'lucide-react';
import { RiskConfig, RiskStatus } from '../types';

interface RiskSettingsViewProps {
  riskConfig: RiskConfig;
  riskStatus?: RiskStatus | null;
  onUpdateRiskConfig: (updates: Partial<RiskConfig>) => void;
  onResetCooldown?: () => void;
  onResetDrawdown?: () => void;
  onResetDailyLoss?: () => void;
  onResetAllCircuitBreakers?: () => void;
  killSwitchActive: boolean;
  onToggleKillSwitch: () => void;
}

export const RiskSettingsView: React.FC<RiskSettingsViewProps> = ({
  riskConfig,
  riskStatus,
  onUpdateRiskConfig,
  onResetCooldown,
  onResetDrawdown,
  onResetDailyLoss,
  onResetAllCircuitBreakers,
  killSwitchActive,
  onToggleKillSwitch
}) => {
  const [form, setForm] = useState<RiskConfig>(riskConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    setForm(riskConfig);
  }, [riskConfig]);

  const showFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleSave = () => {
    onUpdateRiskConfig(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleToggleBypass = (key: keyof RiskConfig) => {
    const updated = { ...form, [key]: !form[key] };
    setForm(updated);
    onUpdateRiskConfig({ [key]: updated[key] });
    showFeedback(`${String(key)} ${updated[key] ? 'INGESCHAKELD (Bypassed)' : 'UITGESCHAKELD (Actief)'}`);
  };

  const handleResetCooldownClick = async () => {
    if (!onResetCooldown) return;
    setLoadingAction('cooldown');
    try {
      await onResetCooldown();
      showFeedback('Verliesreeks & Cooldown succesvol gereset!');
    } finally {
      setTimeout(() => setLoadingAction(null), 600);
    }
  };

  const handleResetDrawdownClick = async () => {
    if (!onResetDrawdown) return;
    setLoadingAction('drawdown');
    try {
      await onResetDrawdown();
      showFeedback('Drawdown teller gereset! Piekkapitaal is gelijkgesteld aan actuele balans.');
    } finally {
      setTimeout(() => setLoadingAction(null), 600);
    }
  };

  const handleResetDailyLossClick = async () => {
    if (!onResetDailyLoss) return;
    setLoadingAction('dailyloss');
    try {
      await onResetDailyLoss();
      showFeedback('Dagverlies teller gereset naar $0.00!');
    } finally {
      setTimeout(() => setLoadingAction(null), 600);
    }
  };

  const handleResetAllClick = async () => {
    if (!onResetAllCircuitBreakers) return;
    setLoadingAction('all');
    try {
      await onResetAllCircuitBreakers();
      showFeedback('Alle circuit breakers en blokkades succesvol opgeheven!');
    } finally {
      setTimeout(() => setLoadingAction(null), 600);
    }
  };

  const isCooldownActive = Boolean(riskStatus?.cooldownActive);
  const isDrawdownHalted = Boolean(riskStatus?.isDrawdownHalted);
  const isDailyLossHalted = Boolean(riskStatus?.isDailyLossHalted);
  const activeBlocksCount = riskStatus?.activeBlocks?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 px-4 py-2.5 rounded-lg text-xs font-mono flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Volatility-Adjusted Risk Engine & Circuit Breakers
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Beschermt kapitaal tegen ongunstige marktomstandigheden. Hieronder kun je alle actieve blokkades inzien, handmatig resetten of tijdelijk overrulen.
            </p>
          </div>

          {onResetAllCircuitBreakers && (
            <button
              onClick={handleResetAllClick}
              disabled={loadingAction === 'all'}
              className="px-3.5 py-2 rounded bg-rose-600/90 hover:bg-rose-600 text-white font-mono text-xs font-bold transition flex items-center gap-2 shadow-sm border border-rose-500/40"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loadingAction === 'all' ? 'animate-spin' : ''}`} />
              RESET ALLE RISICOBLOKKADES
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE BLOCKS RADAR (Shows whenever any circuit breaker is blocking trades) */}
      {activeBlocksCount > 0 && (
        <div className="bg-rose-950/70 border-2 border-rose-500/80 rounded-lg p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-rose-800/80 pb-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm font-mono">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
              <span>ACTIEVE HANDELSBLOKKADES ({activeBlocksCount})</span>
            </div>
            <span className="text-[11px] text-rose-400 font-mono">Order execution momenteel geweigerd</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {riskStatus?.activeBlocks.map((block, idx) => (
              <div key={idx} className="bg-slate-950/80 border border-rose-900 rounded p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300 font-mono flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    {block.title}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/30">
                    BLOCKED
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{block.description}</p>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                  {block.type === 'COOLDOWN' && (
                    <button
                      onClick={handleResetCooldownClick}
                      disabled={loadingAction === 'cooldown'}
                      className="px-2.5 py-1 rounded bg-amber-600/80 hover:bg-amber-600 text-white font-mono text-[11px] font-bold flex items-center gap-1"
                    >
                      <RotateCcw className={`w-3 h-3 ${loadingAction === 'cooldown' ? 'animate-spin' : ''}`} />
                      Reset Cooldown
                    </button>
                  )}
                  {(block.type === 'DRAWDOWN_EMERGENCY' || block.type === 'DRAWDOWN_PAUSE') && (
                    <>
                      <button
                        onClick={handleResetDrawdownClick}
                        disabled={loadingAction === 'drawdown'}
                        className="px-2.5 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-mono text-[11px] font-bold flex items-center gap-1"
                      >
                        <RotateCcw className={`w-3 h-3 ${loadingAction === 'drawdown' ? 'animate-spin' : ''}`} />
                        Reset Drawdown Piek
                      </button>
                      <button
                        onClick={() => handleToggleBypass('bypassDrawdownLimit')}
                        className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold flex items-center gap-1 border ${
                          form.bypassDrawdownLimit
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <Unlock className="w-3 h-3" />
                        {form.bypassDrawdownLimit ? 'Bypass Actief' : 'Bypass Drawdown Limiet'}
                      </button>
                    </>
                  )}
                  {block.type === 'DAILY_LOSS' && (
                    <>
                      <button
                        onClick={handleResetDailyLossClick}
                        disabled={loadingAction === 'dailyloss'}
                        className="px-2.5 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-mono text-[11px] font-bold flex items-center gap-1"
                      >
                        <RotateCcw className={`w-3 h-3 ${loadingAction === 'dailyloss' ? 'animate-spin' : ''}`} />
                        Reset Dagverlies
                      </button>
                      <button
                        onClick={() => handleToggleBypass('bypassDailyLossLimit')}
                        className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold flex items-center gap-1 border ${
                          form.bypassDailyLossLimit
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <Unlock className="w-3 h-3" />
                        {form.bypassDailyLossLimit ? 'Bypass Actief' : 'Bypass Dagverlies'}
                      </button>
                    </>
                  )}
                  {block.type === 'KILL_SWITCH' && (
                    <button
                      onClick={onToggleKillSwitch}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] font-bold border border-slate-700"
                    >
                      Deactiveer Kill Switch
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Real-time Circuit Breakers Status Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Drawdown Guard */}
        <div className={`p-4 rounded-lg border transition ${
          isDrawdownHalted ? 'bg-rose-950/60 border-rose-500' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className={`w-5 h-5 ${isDrawdownHalted ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
              <h3 className="font-mono font-bold text-xs text-slate-100">Drawdown Circuit</h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isDrawdownHalted 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isDrawdownHalted ? 'HALTED' : 'OK'}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Huidige Drawdown:</span>
              <span className={`font-bold ${isDrawdownHalted ? 'text-rose-400' : 'text-slate-200'}`}>
                {riskStatus?.currentDrawdownPercent ?? 0}%
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Noodstopdrempel:</span>
              <span className="text-slate-200">{form.maxDrawdownEmergencyPercent}%</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-800">
              <span>Piek / Huidig vermogen:</span>
              <span>${riskStatus?.peakEquityUsd?.toLocaleString() ?? '10,000'} / ${riskStatus?.currentEquityUsd?.toLocaleString() ?? '10,000'}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={handleResetDrawdownClick}
              disabled={loadingAction === 'drawdown'}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition flex items-center gap-1 border border-slate-700"
            >
              <RotateCcw className={`w-3 h-3 ${loadingAction === 'drawdown' ? 'animate-spin' : ''}`} />
              Reset Drawdown
            </button>
            <button
              onClick={() => handleToggleBypass('bypassDrawdownLimit')}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition border ${
                form.bypassDrawdownLimit 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {form.bypassDrawdownLimit ? 'Bypassed' : 'Bypass'}
            </button>
          </div>
        </div>

        {/* Card 2: Consecutive Loss Cooldown */}
        <div className={`p-4 rounded-lg border transition ${
          isCooldownActive ? 'bg-amber-950/60 border-amber-500' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${isCooldownActive ? 'text-amber-400 animate-spin' : 'text-cyan-400'}`} style={isCooldownActive ? { animationDuration: '6s' } : undefined} />
              <h3 className="font-mono font-bold text-xs text-slate-100">Loss Cooldown</h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isCooldownActive 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isCooldownActive ? `${riskStatus?.remainingMinutes}m PAUZE` : 'OK'}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Verliesreeks:</span>
              <span className={`font-bold ${isCooldownActive ? 'text-amber-400' : 'text-slate-200'}`}>
                {riskStatus?.consecutiveLosses ?? 0} / {form.consecutiveLossCooldownCount} trades
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pauzeduur:</span>
              <span className="text-slate-200">{form.cooldownHours} uur</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-800">
              <span>Status:</span>
              <span>{isCooldownActive ? 'Pauze actief' : 'Normaal handelen'}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={handleResetCooldownClick}
              disabled={loadingAction === 'cooldown'}
              className="w-full px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition flex items-center justify-center gap-1 border border-slate-700"
            >
              <RotateCcw className={`w-3 h-3 ${loadingAction === 'cooldown' ? 'animate-spin' : ''}`} />
              {isCooldownActive ? 'Reset Cooldown Nu' : 'Reset Verliesreeks'}
            </button>
          </div>
        </div>

        {/* Card 3: Daily Loss Limit */}
        <div className={`p-4 rounded-lg border transition ${
          isDailyLossHalted ? 'bg-rose-950/60 border-rose-500' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${isDailyLossHalted ? 'text-rose-400' : 'text-cyan-400'}`} />
              <h3 className="font-mono font-bold text-xs text-slate-100">Daily Loss Limit</h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isDailyLossHalted 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isDailyLossHalted ? 'HALTED' : 'OK'}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Dagverlies:</span>
              <span className={`font-bold ${isDailyLossHalted ? 'text-rose-400' : 'text-slate-200'}`}>
                ${Math.abs(riskStatus?.dailyRealizedPnlUsd ?? 0).toFixed(2)} ({riskStatus?.dailyLossPercent ?? 0}%)
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Daglimiet:</span>
              <span className="text-slate-200">{form.maxDailyLossPercent}%</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-800">
              <span>Reset cyclus:</span>
              <span>Automatisch om 00:00 UTC</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={handleResetDailyLossClick}
              disabled={loadingAction === 'dailyloss'}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition flex items-center gap-1 border border-slate-700"
            >
              <RotateCcw className={`w-3 h-3 ${loadingAction === 'dailyloss' ? 'animate-spin' : ''}`} />
              Reset Dagverlies
            </button>
            <button
              onClick={() => handleToggleBypass('bypassDailyLossLimit')}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition border ${
                form.bypassDailyLossLimit 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {form.bypassDailyLossLimit ? 'Bypassed' : 'Bypass'}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Bypass Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-xs text-slate-200 font-mono">Handmatige Circuit Breaker Bypasses (Overrulen)</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Gebruik met beleid</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Met onderstaande schakelaars kun je individuele blokkades tijdelijk negeren als je wilt blijven handelen tijdens marktcorrecties.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono pt-1">
          <button
            onClick={() => handleToggleBypass('bypassDrawdownLimit')}
            className={`p-2.5 rounded border text-left flex items-center justify-between transition ${
              form.bypassDrawdownLimit 
                ? 'bg-amber-950/40 border-amber-500 text-amber-200' 
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="font-bold">Drawdown Limiet</div>
              <div className="text-[10px] text-slate-400">{form.bypassDrawdownLimit ? 'Genegeerd' : 'Gehandhaafd'}</div>
            </div>
            {form.bypassDrawdownLimit ? <ToggleRight className="w-5 h-5 text-amber-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
          </button>

          <button
            onClick={() => handleToggleBypass('bypassDailyLossLimit')}
            className={`p-2.5 rounded border text-left flex items-center justify-between transition ${
              form.bypassDailyLossLimit 
                ? 'bg-amber-950/40 border-amber-500 text-amber-200' 
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="font-bold">Dagverlies Limiet</div>
              <div className="text-[10px] text-slate-400">{form.bypassDailyLossLimit ? 'Genegeerd' : 'Gehandhaafd'}</div>
            </div>
            {form.bypassDailyLossLimit ? <ToggleRight className="w-5 h-5 text-amber-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
          </button>

          <button
            onClick={() => handleToggleBypass('bypassBtcCorrelationGuard')}
            className={`p-2.5 rounded border text-left flex items-center justify-between transition ${
              form.bypassBtcCorrelationGuard 
                ? 'bg-amber-950/40 border-amber-500 text-amber-200' 
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="font-bold">BTC Bear Guard</div>
              <div className="text-[10px] text-slate-400">{form.bypassBtcCorrelationGuard ? 'Altcoins toegestaan' : 'Gehandhaafd'}</div>
            </div>
            {form.bypassBtcCorrelationGuard ? <ToggleRight className="w-5 h-5 text-amber-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
          </button>

          <button
            onClick={() => handleToggleBypass('bypassMaxExposureCap')}
            className={`p-2.5 rounded border text-left flex items-center justify-between transition ${
              form.bypassMaxExposureCap 
                ? 'bg-amber-950/40 border-amber-500 text-amber-200' 
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="font-bold">Portfolio Exposure Cap</div>
              <div className="text-[10px] text-slate-400">{form.bypassMaxExposureCap ? 'Geen max limiet' : 'Gehandhaafd'}</div>
            </div>
            {form.bypassMaxExposureCap ? <ToggleRight className="w-5 h-5 text-amber-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
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
              max="20.0"
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
              max="15"
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
              Aantal uur dat de bot pauzeert na het bereiken van de verliesreeks.
            </p>
            <input
              type="number"
              step="0.5"
              min="0.1"
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
              max="30.0"
              value={form.maxDrawdownPausePercent}
              onChange={(e) => setForm({ ...form, maxDrawdownPausePercent: parseFloat(e.target.value) || 5.0 })}
              className="w-full mt-2 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Max Drawdown Emergency % */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
            <label className="text-rose-500 font-bold block">Max Drawdown Emergency Halt (%)</label>
            <p className="text-[11px] text-slate-500 font-sans">
              Noodstopdrempel: stopt orderplaatsing wanneer drawdown vanaf piekkapitaal deze drempel raakt.
            </p>
            <input
              type="number"
              step="1.0"
              min="2.0"
              max="50.0"
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
              max="20"
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
              max="100"
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
              max="10"
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
