import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { MarketsView } from './views/MarketsView';
import { SignalsView } from './views/SignalsView';
import { PositionsView } from './views/PositionsView';
import { TradeHistoryView } from './views/TradeHistoryView';
import { BacktestLabView } from './views/BacktestLabView';
import { StrategyResearchView } from './views/StrategyResearchView';
import { IndicatorResearchView } from './views/IndicatorResearchView';
import { RiskSettingsView } from './views/RiskSettingsView';
import { ExchangeView } from './views/ExchangeView';
import { LogsView } from './views/LogsView';
import { SettingsView } from './components/SettingsView';
import { 
  ExchangeConfig, 
  MarketAsset, 
  Position, 
  RiskConfig, 
  SystemLog, 
  TradeRecord, 
  TradingMode, 
  TradingSignal 
} from './types';

// Safe fetch helper to prevent WebKit / Safari DOMException on json parsing
async function safeJsonFetch<T = any>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [exchangeStatus, setExchangeStatus] = useState<ExchangeConfig | null>(null);
  const [equityData, setEquityData] = useState<{
    totalUsd: number;
    availableUsd: number;
    todayPnlUsd: number;
    todayPnlPercent: number;
    openPositionsCount: number;
    maxOpenPositions: number;
  } | null>(null);
  const [killSwitchActive, setKillSwitchActive] = useState<boolean>(false);
  const [autoTradingActive, setAutoTradingActive] = useState<boolean>(false);
  const [markets, setMarkets] = useState<MarketAsset[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [riskConfig, setRiskConfig] = useState<RiskConfig | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('quant_admin_token');
    } catch {
      return null;
    }
  });

  const handleUpdateSessionToken = (token: string | null) => {
    setSessionToken(token);
    try {
      if (token) {
        localStorage.setItem('quant_admin_token', token);
      } else {
        localStorage.removeItem('quant_admin_token');
      }
    } catch {}
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionToken) {
      headers['x-admin-token'] = sessionToken;
    }
    return headers;
  };

  // Fetch all core system state from server APIs
  const fetchSystemState = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Status & Equity
      const statusData = await safeJsonFetch<any>('/api/status');
      if (statusData) {
        setExchangeStatus(statusData.exchange);
        setEquityData(statusData.equity);
        setKillSwitchActive(statusData.killSwitchActive);
        if (statusData.autoTradingActive !== undefined) {
          setAutoTradingActive(statusData.autoTradingActive);
        }
        setRiskConfig(statusData.risk);
      }

      // 2. Markets
      const marketsData = await safeJsonFetch<any>('/api/markets');
      if (marketsData?.markets) {
        setMarkets(marketsData.markets);
      }

      // 3. Signals
      const signalsData = await safeJsonFetch<any>('/api/signals');
      if (signalsData?.signals) {
        setSignals(signalsData.signals);
      }

      // 4. Positions
      const positionsData = await safeJsonFetch<any>('/api/positions');
      if (positionsData?.positions) {
        setPositions(positionsData.positions);
      }

      // 5. Trades
      const tradesData = await safeJsonFetch<any>('/api/trades');
      if (tradesData?.trades) {
        setTrades(tradesData.trades);
      }

      // 6. Logs
      const logsData = await safeJsonFetch<any>('/api/logs');
      if (logsData?.logs) {
        setLogs(logsData.logs);
      }
    } catch (err) {
      console.error('Failed to sync system state:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemState();
    const interval = setInterval(fetchSystemState, 10000); // 10s polling for live state
    return () => clearInterval(interval);
  }, [fetchSystemState]);

  // Actions
  const handleToggleKillSwitch = async () => {
    const newState = !killSwitchActive;
    setKillSwitchActive(newState);
    try {
      const res = await fetch('/api/exchange/kill-switch', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: newState })
      });
      if (res.status === 401) {
        alert('PIN vereist om de Emergency Kill Switch te wijzigen. Ga naar het tabblad Slack & Beveiliging.');
        setActiveTab('settings');
        fetchSystemState();
        return;
      }
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          try {
            const data = JSON.parse(text);
            if (typeof data.killSwitchActive === 'boolean') {
              setKillSwitchActive(data.killSwitchActive);
            }
          } catch {}
        }
        fetchSystemState();
      }
    } catch (err) {
      console.warn('Kill switch toggle warning:', err);
      fetchSystemState();
    }
  };

  const handleClosePosition = async (id: string) => {
    try {
      const res = await fetch('/api/positions/close', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ positionId: id })
      });
      if (res.status === 401) {
        alert('PIN vereist om posities te sluiten. Ga naar het tabblad Slack & Beveiliging.');
        setActiveTab('settings');
        return;
      }
      if (res.ok) {
        fetchSystemState();
      }
    } catch (err) {
      console.error('Error closing position:', err);
    }
  };

  const handleCloseAllPositions = async () => {
    try {
      const res = await fetch('/api/positions/close', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ positionId: 'ALL' })
      });
      if (res.status === 401) {
        alert('PIN vereist om alle posities te sluiten. Ga naar het tabblad Slack & Beveiliging.');
        setActiveTab('settings');
        return;
      }
      if (res.ok) {
        fetchSystemState();
      }
    } catch (err) {
      console.error('Error closing all positions:', err);
    }
  };

  const handleConnectTest = async (params: { exchangeId: string; apiKey: string; apiSecret: string; passphrase?: string }) => {
    const res = await fetch('/api/exchange/connect', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    fetchSystemState();
    return data;
  };

  const handleSetMode = async (mode: TradingMode, confirmationToken?: string) => {
    const res = await fetch('/api/exchange/mode', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mode, confirmationToken })
    });
    if (res.status === 401) {
      alert('PIN vereist om handelsmodus te wijzigen.');
      setActiveTab('settings');
      return { success: false, message: 'PIN vereist' };
    }
    const data = await res.json();
    fetchSystemState();
    return data;
  };

  const handleUpdateRiskConfig = async (updates: Partial<RiskConfig>) => {
    try {
      const res = await fetch('/api/risk/config', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      if (res.status === 401) {
        alert('PIN vereist om risico-instellingen te wijzigen. Ga naar het tabblad Slack & Beveiliging.');
        setActiveTab('settings');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setRiskConfig(data.config);
        fetchSystemState();
      }
    } catch (err) {
      console.error('Error updating risk config:', err);
    }
  };

  const handleToggleAutoTrading = async () => {
    const nextState = !autoTradingActive;
    setAutoTradingActive(nextState); // Optimistic UI update immediately

    try {
      const res = await fetch('/api/autotrading/toggle', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: nextState })
      });
      if (res.status === 401) {
        alert('PIN vereist om de Auto-Trading Bot te starten of stoppen. Ga naar het tabblad Slack & Beveiliging.');
        setActiveTab('settings');
        fetchSystemState();
        return;
      }
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          try {
            const data = JSON.parse(text);
            if (typeof data.autoTradingActive === 'boolean') {
              setAutoTradingActive(data.autoTradingActive);
            }
          } catch {
            // Ignored
          }
        }
        fetchSystemState();
      }
    } catch (err) {
      console.warn('Auto-trading toggle warning:', err);
      fetchSystemState();
    }
  };

  const handleExecuteTrade = async (signal: TradingSignal) => {
    const res = await fetch('/api/trades/execute', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ signal })
    });
    if (res.status === 401) {
      alert('PIN vereist om trades te plaatsen. Ga naar het tabblad Slack & Beveiliging.');
      setActiveTab('settings');
      return { success: false, message: 'PIN vereist' };
    }
    const data = await res.json();
    fetchSystemState();
    return data;
  };

  const handleSimulateExit = async (positionId: string, reason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_STOP') => {
    try {
      const res = await fetch('/api/trades/simulate-exit', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ positionId, reason })
      });
      if (res.status === 401) {
        alert('PIN vereist om trades te simuleren.');
        setActiveTab('settings');
        return;
      }
      if (res.ok) {
        fetchSystemState();
      }
    } catch (err) {
      console.error('Error simulating exit:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        exchangeStatus={exchangeStatus}
        equityData={equityData}
        killSwitchActive={killSwitchActive}
        autoTradingActive={autoTradingActive}
        onToggleKillSwitch={handleToggleKillSwitch}
        onToggleAutoTrading={handleToggleAutoTrading}
        onRefresh={fetchSystemState}
        isRefreshing={isRefreshing}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            exchangeStatus={exchangeStatus}
            equityData={equityData}
            positions={positions}
            signals={signals}
            recentTrades={trades}
            killSwitchActive={killSwitchActive}
            markets={markets}
            onClosePosition={handleClosePosition}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'markets' && (
          <MarketsView
            markets={markets}
            onSelectMarket={(sym) => {
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'signals' && (
          <SignalsView
            signals={signals}
            onExecuteTrade={handleExecuteTrade}
            onOpenPaperTrade={(sig) => {
              setActiveTab('positions');
            }}
          />
        )}

        {activeTab === 'positions' && (
          <PositionsView
            positions={positions}
            onClosePosition={handleClosePosition}
            onCloseAllPositions={handleCloseAllPositions}
            onSimulateExit={handleSimulateExit}
          />
        )}

        {activeTab === 'trades' && (
          <TradeHistoryView
            trades={trades}
          />
        )}

        {activeTab === 'backtest' && (
          <BacktestLabView />
        )}

        {activeTab === 'strategies' && (
          <StrategyResearchView />
        )}

        {activeTab === 'indicators' && (
          <IndicatorResearchView />
        )}

        {activeTab === 'risk' && riskConfig && (
          <RiskSettingsView
            riskConfig={riskConfig}
            onUpdateRiskConfig={handleUpdateRiskConfig}
            killSwitchActive={killSwitchActive}
            onToggleKillSwitch={handleToggleKillSwitch}
          />
        )}

        {activeTab === 'exchange' && (
          <ExchangeView
            exchangeStatus={exchangeStatus}
            onConnectTest={handleConnectTest}
            onSetMode={handleSetMode}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            sessionToken={sessionToken}
            onUpdateSessionToken={handleUpdateSessionToken}
            onRefreshGlobal={fetchSystemState}
          />
        )}

        {activeTab === 'logs' && (
          <LogsView
            logs={logs}
            onRefresh={fetchSystemState}
          />
        )}
      </main>

      {/* System Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>QuantCrypto Algorithmic Trading Architecture &bull; Zero Look-Ahead Bias Enforced</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Exchange Adapter: {exchangeStatus?.provider?.toUpperCase() || 'PHEMEX'} ({exchangeStatus?.mode || 'PAPER'})</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
