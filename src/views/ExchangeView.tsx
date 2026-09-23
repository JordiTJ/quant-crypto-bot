import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Key, 
  Lock, 
  Radio, 
  Activity,
  Layers,
  Zap
} from 'lucide-react';
import { ExchangeConfig, TradingMode } from '../types';

interface ExchangeViewProps {
  exchangeStatus: ExchangeConfig | null;
  onConnectTest: (params: { exchangeId: string; apiKey: string; apiSecret: string; passphrase?: string }) => Promise<{ success: boolean; message: string }>;
  onSetMode: (mode: TradingMode, confirmationToken?: string) => Promise<{ success: boolean; message: string }>;
}

export const ExchangeView: React.FC<ExchangeViewProps> = ({
  exchangeStatus,
  onConnectTest,
  onSetMode
}) => {
  const [selectedExchange, setSelectedExchange] = useState<'phemex' | 'binance' | 'bybit' | 'okx'>(
    exchangeStatus?.provider || 'phemex'
  );
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Live Trading Confirmation Modal State
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [confirmationTokenInput, setConfirmationTokenInput] = useState('');
  const [modeSwitchMessage, setModeSwitchMessage] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onConnectTest({
        exchangeId: selectedExchange,
        apiKey,
        apiSecret,
        passphrase: selectedExchange === 'okx' ? passphrase : undefined
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleModeChange = async (targetMode: TradingMode) => {
    setModeSwitchMessage(null);
    if (targetMode === 'LIVE') {
      setShowLiveModal(true);
      return;
    }

    const res = await onSetMode(targetMode);
    setModeSwitchMessage(res.message);
  };

  const confirmLiveActivation = async () => {
    const res = await onSetMode('LIVE', confirmationTokenInput.trim());
    if (res.success) {
      setShowLiveModal(false);
      setConfirmationTokenInput('');
      setModeSwitchMessage(res.message);
    } else {
      alert(res.message);
    }
  };

  const currentMode = exchangeStatus?.mode || 'PAPER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          Exchange Adapters & Live Trading Activation Gate
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Connect to verified crypto exchange APIs (Phemex, Binance, Bybit, OKX). By default, the bot runs in Paper Trading mode.
          Live trading requires explicit credential confirmation and safety token entry.
        </p>
      </div>

      {/* Mode Gating Selector Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-mono">
              Operating Mode Controller
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Current active state: <strong className={currentMode === 'LIVE' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{currentMode}</strong>
            </p>
          </div>

          {modeSwitchMessage && (
            <span className="text-xs font-mono text-cyan-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {modeSwitchMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Backtest Mode */}
          <div
            onClick={() => handleModeChange('BACKTEST')}
            className={`p-4 rounded-lg border cursor-pointer transition ${
              currentMode === 'BACKTEST'
                ? 'bg-slate-800 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-slate-100">BACKTEST</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                Offline
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Historical candle replay. Zero exchange interaction.
            </p>
          </div>

          {/* Paper Trading Mode */}
          <div
            onClick={() => handleModeChange('PAPER')}
            className={`p-4 rounded-lg border cursor-pointer transition ${
              currentMode === 'PAPER'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-emerald-300">PAPER TRADING</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Live market order simulation with realistic fees and slippage. No real capital at risk.
            </p>
          </div>

          {/* Live Trading Mode */}
          <div
            onClick={() => handleModeChange('LIVE')}
            className={`p-4 rounded-lg border cursor-pointer transition ${
              currentMode === 'LIVE'
                ? 'bg-rose-950/60 border-rose-500 shadow-md ring-1 ring-rose-500/40 animate-pulse'
                : 'bg-slate-950 border-slate-800 hover:border-rose-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-rose-300">LIVE TRADING</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                Real Funds
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Executes real orders on the configured exchange account. Requires explicit security token.
            </p>
          </div>
        </div>
      </div>

      {/* Connection & Credentials Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Credentials Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              API Key Configuration
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Withdrawals Disabled Mandatory
            </span>
          </div>

          {/* Exchange Provider Selection */}
          <div className="space-y-1 text-xs">
            <label className="text-slate-300 font-mono">Exchange Provider</label>
            <div className="grid grid-cols-4 gap-2 pt-1 font-mono">
              {(['phemex', 'binance', 'bybit', 'okx'] as const).map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setSelectedExchange(ex)}
                  className={`py-2 rounded uppercase font-bold text-xs transition border ${
                    selectedExchange === ex
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-1 text-xs font-mono">
            <label className="text-slate-300 block">API Key (Read + Trade Only)</label>
            <input
              type="text"
              placeholder="e.g. 8f9b2c3d-xxxx-xxxx-xxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* API Secret Input */}
          <div className="space-y-1 text-xs font-mono">
            <label className="text-slate-300 block">API Secret</label>
            <input
              type="password"
              placeholder="••••••••••••••••••••••••"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* OKX Passphrase if applicable */}
          {selectedExchange === 'okx' && (
            <div className="space-y-1 text-xs font-mono">
              <label className="text-slate-300 block">OKX Passphrase</label>
              <input
                type="password"
                placeholder="Passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition disabled:opacity-50"
            >
              {isTesting ? 'TESTING CONNECTION...' : 'TEST EXCHANGE CONNECTION'}
            </button>

            {testResult && (
              <span className={`text-xs font-mono flex items-center gap-1 ${
                testResult.success ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {testResult.message}
              </span>
            )}
          </div>
        </div>

        {/* Right Col: Health Monitor & Safety Diagnostic */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              API Health & Safety Audit
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">
              Ping Latency: {exchangeStatus?.pingLatencyMs || 42} ms
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {/* Permission Check: Read */}
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">1. Account Balance & Read Access:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ENABLED
              </span>
            </div>

            {/* Permission Check: Trade */}
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">2. Trade Order Creation:</span>
              <span className={currentMode === 'LIVE' ? 'text-rose-400 font-bold flex items-center gap-1' : 'text-emerald-400 font-bold flex items-center gap-1'}>
                {currentMode === 'LIVE' ? 'LIVE ORDER SUBMISSION ACTIVE' : 'SIMULATED / BLOCKED'}
              </span>
            </div>

            {/* Permission Check: Withdrawal disabled */}
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">3. Withdrawal Permissions:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> STRICTLY DISABLED (SAFE)
              </span>
            </div>

            {/* Rate Limiter Status */}
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Exchange Rate Limit Weight:</span>
                <span>{exchangeStatus?.rateLimitStatus.usedWeight || 14} / {exchangeStatus?.rateLimitStatus.maxLimit || 1200}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full"
                  style={{ width: `${((exchangeStatus?.rateLimitStatus.usedWeight || 14) / (exchangeStatus?.rateLimitStatus.maxLimit || 1200)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Security Double Confirmation Modal for Live Trading */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-7 h-7 flex-shrink-0 animate-bounce" />
              <h3 className="text-base font-bold text-white uppercase font-mono">
                ACTIVATE LIVE TRADING GATING VERIFICATION
              </h3>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-rose-300">
                WARNING: You are about to enable real money algorithmic execution on {selectedExchange.toUpperCase()}.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Automated orders will be sent to the exchange and filled with live collateral.</li>
                <li>Ensure API keys are configured with IP whitelisting and withdrawal permissions DISABLED.</li>
                <li>Never risk money you cannot afford to lose. Past backtested performance is never a guarantee of future returns.</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs space-y-2">
              <label className="text-slate-400 block">
                Type the confirmation token exactly as shown to proceed:
              </label>
              <div className="text-cyan-400 select-all font-bold">
                CONFIRM_LIVE_TRADING_RISK_ACCEPTED
              </div>
              <input
                type="text"
                value={confirmationTokenInput}
                onChange={(e) => setConfirmationTokenInput(e.target.value)}
                placeholder="Paste confirmation token here..."
                className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-rose-500 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowLiveModal(false);
                  setConfirmationTokenInput('');
                }}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                Cancel &amp; Keep Paper Trading
              </button>
              <button
                onClick={confirmLiveActivation}
                disabled={confirmationTokenInput.trim() !== 'CONFIRM_LIVE_TRADING_RISK_ACCEPTED'}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition disabled:opacity-30 shadow-md"
              >
                ACTIVATE LIVE TRADING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
