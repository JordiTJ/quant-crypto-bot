import React from 'react';
import { 
  Activity, 
  BarChart3, 
  ShieldAlert, 
  Layers, 
  TrendingUp, 
  Radio, 
  Sliders, 
  FileText, 
  BookOpen, 
  Zap, 
  RefreshCw,
  Power,
  ShieldCheck
} from 'lucide-react';
import { ExchangeConfig, TradingMode } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  exchangeStatus: ExchangeConfig | null;
  equityData: { totalUsd: number; todayPnlUsd: number; todayPnlPercent: number; openPositionsCount: number } | null;
  killSwitchActive: boolean;
  autoTradingActive?: boolean;
  onToggleKillSwitch: () => void;
  onToggleAutoTrading?: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  exchangeStatus,
  equityData,
  killSwitchActive,
  autoTradingActive = false,
  onToggleKillSwitch,
  onToggleAutoTrading,
  onRefresh,
  isRefreshing
}) => {
  const mode = exchangeStatus?.mode || 'PAPER';
  const isLive = mode === 'LIVE';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'markets', label: 'Markets', icon: BarChart3 },
    { id: 'signals', label: 'Live Signals', icon: Radio },
    { id: 'positions', label: 'Open Positions', icon: Layers },
    { id: 'trades', label: 'Trade History', icon: FileText },
    { id: 'backtest', label: 'Backtest Lab', icon: TrendingUp },
    { id: 'strategies', label: 'Strategy Discovery', icon: Zap },
    { id: 'indicators', label: 'Indicator Research', icon: BookOpen },
    { id: 'risk', label: 'Risk Controls', icon: ShieldAlert },
    { id: 'exchange', label: 'Exchange API', icon: Sliders },
    { id: 'settings', label: 'Notificaties & Beveiliging', icon: ShieldCheck },
    { id: 'logs', label: 'System Logs', icon: FileText }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-md">
      {/* Top Bar Status Row */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              QUANTCRYPTO
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              v2.4 Pro
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Mode Pill */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Mode:</span>
            {isLive ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                LIVE TRADING ACTIVE
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {mode === 'BACKTEST' ? 'BACKTEST MODE' : 'PAPER TRADING'}
              </span>
            )}
          </div>

          {/* Exchange & Latency */}
          <div className="hidden md:flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">Exchange:</span>
            <span className="font-semibold uppercase text-cyan-300">{exchangeStatus?.provider || 'Phemex'}</span>
            <span className="text-slate-400 font-mono text-[10px]">({exchangeStatus?.pingLatencyMs || 42}ms)</span>
          </div>
        </div>

        {/* Equity KPIs & Kill Switch */}
        <div className="flex items-center gap-3">
          {equityData && (
            <div className="flex items-center gap-3 text-right">
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Total Equity</span>
                <span className="font-mono font-semibold text-slate-100 text-sm">
                  ${equityData.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="hidden sm:block">
                <span className="text-[10px] text-slate-400 block leading-tight">Today P&L</span>
                <span className={`font-mono font-semibold text-sm ${equityData.todayPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {equityData.todayPnlUsd >= 0 ? '+' : ''}${equityData.todayPnlUsd.toFixed(2)} ({equityData.todayPnlPercent >= 0 ? '+' : ''}{equityData.todayPnlPercent}%)
                </span>
              </div>
            </div>
          )}

          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Auto-Trading Bot Toggle */}
          {onToggleAutoTrading && (
            <button
              onClick={onToggleAutoTrading}
              title={autoTradingActive ? '24/7 Achtergrond Daemon is ACTIEF: De bot draait zelfstandig op de server. Zelfs als je je browser of computer sluit, scant het algoritme de markt en bewaakt het je Stop Loss & Take Profit.' : 'Auto-Trading Bot is INACTIEF: alleen handmatige trade executie.'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition border ${
                autoTradingActive
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm ring-1 ring-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoTradingActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
              <span>Auto-Bot: {autoTradingActive ? '24/7 ACTIEF' : 'INACTIEF'}</span>
            </button>
          )}

          {/* Emergency Kill Switch */}
          <button
            onClick={onToggleKillSwitch}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all shadow-sm ${
              killSwitchActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{killSwitchActive ? 'HALTED' : 'KILL SWITCH'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 py-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
