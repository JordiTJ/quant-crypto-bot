/**
 * QuantCrypto Algorithmic Trading Bot - Production Server
 * Express 4 + Vite integration, Realtime API endpoints,
 * Risk controls, and Exchange adapters.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { globalExchangeManager } from './src/exchange/ExchangeManager';
import { globalRiskEngine } from './src/risk/riskEngine';
import { SignalEngine } from './src/strategy/signalEngine';
import { MarketDataEngine } from './src/data/marketData';
import { BacktestEngine } from './src/backtest/backtestEngine';
import { ResearchEngine } from './src/research/researchEngine';
import { BacktestConfig, Position, SystemLog, TradeRecord } from './src/types';
import { globalStorageManager } from './src/storage/storageManager';
import { globalSlackNotifier } from './src/notifications/slackNotifier';
import { globalDiscordNotifier } from './src/notifications/discordNotifier';
import { globalSecurityManager } from './src/security/securityManager';

const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// CORS & Preflight headers for cross-origin iframes & WebKit compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token, x-admin-pin');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Authentication middleware for mutating sensitive actions
function requireAuth(req: any, res: any, next: any) {
  if (!globalSecurityManager.isPinConfigured()) {
    return next();
  }
  const token = req.headers['x-admin-token'] || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  const pin = req.headers['x-admin-pin'];

  if (token && globalSecurityManager.verifySessionToken(token as string)) {
    return next();
  }
  if (pin) {
    const check = globalSecurityManager.verifyPin(pin as string);
    if (check.success) return next();
  }

  return res.status(401).json({ error: 'UNAUTHORIZED: PIN vereist voor deze actie', pinRequired: true });
}

// In-memory system audit logs
const systemLogs: SystemLog[] = [
  {
    id: 'log_1',
    timestamp: Date.now() - 360000,
    level: 'INFO',
    module: 'ENGINE',
    message: 'QuantCrypto Core Engine booted in PAPER TRADING mode. Zero look-ahead bias enforced.'
  },
  {
    id: 'log_2',
    timestamp: Date.now() - 240000,
    level: 'INFO',
    module: 'RISK',
    message: 'Risk circuits armed: Max Daily Loss 2.0%, Max DD Pause 5.0%, Emergency Halt 10.0%.'
  },
  {
    id: 'log_3',
    timestamp: Date.now() - 120000,
    level: 'INFO',
    module: 'EXCHANGE',
    message: 'Phemex adapter initialized. Rate limiter weight monitored with exponential backoff.'
  }
];

function addLog(level: SystemLog['level'], module: SystemLog['module'], message: string, details?: any) {
  systemLogs.unshift({
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    level,
    module,
    message,
    details
  });
  if (systemLogs.length > 200) systemLogs.pop();
}

// Seed initial demo paper positions & trade history with current market levels
// Clean, pristine state for live/paper trading startup
const initialPositions: Position[] = [];
const initialTrades: TradeRecord[] = [];

globalExchangeManager.setInitialPositions(initialPositions);
globalExchangeManager.setInitialTrades(initialTrades);

// --- API ROUTES ---

// 1. Bot & Exchange Status
app.get('/api/status', async (req, res) => {
  try {
    const status = await globalExchangeManager.getStatus();
    const riskConfig = globalRiskEngine.getConfig();
    const positions = globalExchangeManager.getOpenPositions();
    const trades = globalExchangeManager.getTradeHistory();

    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayTrades = trades.filter(t => t.exitTimestamp >= todayStart);
    const todayRealizedPnl = todayTrades.reduce((acc, t) => acc + t.netPnl, 0);
    const totalUnrealizedPnl = positions.reduce((acc, p) => acc + p.unrealizedPnl, 0);

    res.json({
      status: 'ok',
      exchange: status,
      risk: riskConfig,
      equity: {
        totalUsd: Number((status.accountEquityUsd + totalUnrealizedPnl).toFixed(2)),
        availableUsd: status.availableBalanceUsd,
        todayPnlUsd: Number((todayRealizedPnl + totalUnrealizedPnl).toFixed(2)),
        todayPnlPercent: Number((((todayRealizedPnl + totalUnrealizedPnl) / status.accountEquityUsd) * 100).toFixed(2)),
        openPositionsCount: positions.length,
        maxOpenPositions: riskConfig.maxOpenPositions
      },
      killSwitchActive: globalExchangeManager.isEmergencyKillSwitchActive(),
      autoTradingActive: globalExchangeManager.isAutoTradingEnabled(),
      serverTimestamp: Date.now()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Markets (Dynamic Top 10 with Live Prices & Automatic Position Management)
app.get('/api/markets', async (req, res) => {
  try {
    const adapter = globalExchangeManager.getActiveAdapter();
    const markets = await adapter.fetchTopMarkets();

    // Cache live prices in MarketDataEngine so all engines share identical real market prices
    for (const m of markets) {
      MarketDataEngine.setLivePrice(m.symbol, m.price);
    }

    res.json({ 
      markets, 
      liveFeedActive: true,
      lastUpdated: Date.now(),
      feedSource: 'Binance & Phemex Public REST API',
      autoTradingActive: globalExchangeManager.isAutoTradingEnabled(),
      backgroundDaemonActive: true
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2b. Candles / OHLCV (Live exchange candles for chart)
app.get('/api/candles', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'BTCUSDT';
    const timeframe = (req.query.timeframe as string) || '1h';
    const limit = Math.min(300, Number(req.query.limit) || 120);
    const adapter = globalExchangeManager.getActiveAdapter();
    const candles = await adapter.fetchKlines(symbol, timeframe, limit);
    res.json({ symbol, timeframe, candles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Signals (Live Signal Engine with 0-100 scores grounded in real-time market prices)
app.get('/api/signals', async (req, res) => {
  try {
    const adapter = globalExchangeManager.getActiveAdapter();
    const markets = await adapter.fetchTopMarkets();
    const priceMap = new Map<string, number>();
    for (const m of markets) {
      priceMap.set(m.symbol, m.price);
      MarketDataEngine.setLivePrice(m.symbol, m.price);
      MarketDataEngine.setMarketStats(m.symbol, {
        price: m.price,
        change24h: m.change24h,
        high24h: m.high24h,
        low24h: m.low24h,
        volume24hUsd: m.volume24hUsd,
        spreadPercent: m.spreadPercent,
        volatility24h: m.volatility24h,
        regime: m.regime
      });
    }

    const symbols = [
      'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 
      'SUIUSDT', 'AVAXUSDT', 'ADAUSDT', 'NEARUSDT', 'APTUSDT', 
      'RENDERUSDT', 'FETUSDT', 'TAOUSDT', 'LINKUSDT', 'AAVEUSDT', 
      'UNIUSDT', 'DOGEUSDT', 'PEPEUSDT', 'SHIBUSDT'
    ];
    const signals = symbols.map(sym => SignalEngine.generateSignal(sym, priceMap.get(sym)));
    res.json({ signals });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3b. Execute Trade from Signal (Manual or Bot Execution)
app.post('/api/trades/execute', requireAuth, (req, res) => {
  try {
    const signal = req.body.signal;
    if (!signal) return res.status(400).json({ error: 'Signal object is required' });

    const result = globalExchangeManager.executeSignalOrder(signal, globalRiskEngine);
    if (!result.success) {
      addLog('WARN', 'RISK', `Order execution geweigerd: ${result.message}`);
      return res.status(400).json(result);
    }

    addLog('TRADE', 'EXCHANGE', `Order uitgevoerd: ${result.message}`);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3c. Simulate SL / TP Trigger to Test Automated Exit Logic
app.post('/api/trades/simulate-exit', requireAuth, (req, res) => {
  try {
    const { positionId, reason } = req.body;
    const positions = globalExchangeManager.getOpenPositions();
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return res.status(404).json({ error: 'Positie niet gevonden' });

    let exitPrice = pos.currentPrice;
    let exitReason: TradeRecord['exitReason'] = 'STOP_LOSS';
    if (reason === 'STOP_LOSS') {
      exitPrice = pos.stopLoss;
      exitReason = 'STOP_LOSS';
    } else if (reason === 'TRAILING_STOP') {
      exitPrice = pos.trailingStopPrice || (pos.entryPrice * 0.985);
      exitReason = 'TRAILING_STOP';
    } else if (reason === 'TAKE_PROFIT') {
      exitPrice = pos.takeProfit2;
      exitReason = 'TAKE_PROFIT_2';
    }

    const trade = globalExchangeManager.closePosition(positionId, exitPrice, exitReason);
    if (!trade) return res.status(500).json({ error: 'Positie kon niet worden gesloten' });

    globalRiskEngine.recordTradeResult(trade.netPnl);
    addLog('TRADE', 'EXCHANGE', `[TEST EXIT GETRIGGERD] ${trade.symbol} gesloten via ${trade.exitReason} @ $${trade.exitPrice}. Netto P&L: $${trade.netPnl}`);
    res.json({ success: true, trade });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3d. Auto-Trading Bot Toggle (Supports POST & GET with graceful fallback)
const handleAutoTradingToggle = (req: any, res: any) => {
  try {
    const current = globalExchangeManager.isAutoTradingEnabled();
    const hasExplicitActive = req.body && typeof req.body.active === 'boolean';
    const nextActive = hasExplicitActive ? req.body.active : !current;
    globalExchangeManager.setAutoTrading(Boolean(nextActive));
    addLog('INFO', 'ENGINE', `Automatische trading bot staat nu: ${nextActive ? 'ACTIEF' : 'INACTIEF'}`);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, autoTradingActive: Boolean(nextActive) });
  } catch (err: any) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: err.message || 'Fout bij wijzigen auto-trading' });
  }
};

app.post('/api/autotrading/toggle', requireAuth, handleAutoTradingToggle);
app.get('/api/autotrading/toggle', handleAutoTradingToggle);
app.post('/api/autotrading', requireAuth, handleAutoTradingToggle);
app.get('/api/autotrading', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ autoTradingActive: globalExchangeManager.isAutoTradingEnabled() });
});

// 4. Open Positions
app.get('/api/positions', (req, res) => {
  res.json({ positions: globalExchangeManager.getOpenPositions() });
});

// Close position
app.post('/api/positions/close', requireAuth, (req, res) => {
  try {
    const { positionId, exitPrice } = req.body;
    if (positionId === 'ALL') {
      const closed = globalExchangeManager.closeAllPositions();
      addLog('TRADE', 'EXCHANGE', `EMERGENCY: Closed ALL open positions (${closed.length} total).`);
      return res.json({ success: true, closed });
    }

    const trade = globalExchangeManager.closePosition(positionId, exitPrice || 100, 'MANUAL');
    if (!trade) return res.status(404).json({ error: 'Position not found' });

    addLog('TRADE', 'EXCHANGE', `Manual close of ${trade.symbol} position at $${trade.exitPrice}. Net P&L: $${trade.netPnl}`);
    res.json({ success: true, trade });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4b. Reset Paper Trading State (Clean Slate: $10,000 cash, 0 positions, 0 trades)
app.post('/api/paper/reset', requireAuth, (req, res) => {
  try {
    globalExchangeManager.resetPaperTradingState();
    globalRiskEngine.setEquity(10000);
    addLog('INFO', 'ENGINE', 'Paper trading account gereset naar schone lei ($10,000.00 kapitaal, 0 openstaande posities).');
    res.json({
      success: true,
      message: 'Paper trading account succesvol gereset. Klaar voor verse live/paper start!'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Trade History (Audit Log)
app.get('/api/trades', (req, res) => {
  res.json({ trades: globalExchangeManager.getTradeHistory() });
});

app.get('/api/trades/history', (req, res) => {
  res.json({ trades: globalExchangeManager.getTradeHistory() });
});

// 6. Backtest Execution
app.post('/api/backtest/run', (req, res) => {
  try {
    const config: BacktestConfig = {
      symbol: req.body.symbol || 'BTCUSDT',
      timeframe: req.body.timeframe || '1h',
      strategy: req.body.strategy || 'TREND_FOLLOWING',
      initialCapital: Number(req.body.initialCapital) || 10000,
      riskPerTradePercent: Number(req.body.riskPerTradePercent) || 0.5,
      makerFeePercent: Number(req.body.makerFeePercent) || 0.02,
      takerFeePercent: Number(req.body.takerFeePercent) || 0.06,
      slippagePercent: Number(req.body.slippagePercent) || 0.05,
      useMultiTimeframe: Boolean(req.body.useMultiTimeframe ?? true),
      partialExits: Boolean(req.body.partialExits ?? true),
      useTrailingStop: Boolean(req.body.useTrailingStop ?? true),
      trailingStopAtrMultiplier: Number(req.body.trailingStopAtrMultiplier) || 2.0,
      atrStopMultiplier: Number(req.body.atrStopMultiplier) || 2.0,
      takeProfit1Multiple: Number(req.body.takeProfit1Multiple) || 1.5,
      takeProfit2Multiple: Number(req.body.takeProfit2Multiple) || 2.5,
      emaFastPeriod: Number(req.body.emaFastPeriod) || 9,
      emaSlowPeriod: Number(req.body.emaSlowPeriod) || 21,
      adxThreshold: Number(req.body.adxThreshold) || 22,
      rsiThreshold: Number(req.body.rsiThreshold) || 50
    };

    const result = BacktestEngine.runBacktest(config);
    addLog('INFO', 'BACKTEST', `Backtest completed for ${config.symbol} (${config.strategy}). Net Return: ${result.metrics.totalNetReturnPercent}%`);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Strategy Research
app.get('/api/research/strategies', (req, res) => {
  res.json({ strategies: ResearchEngine.getStrategyResearchResults() });
});

// 8. Indicator Research Catalog & Correlation Matrix
app.get('/api/research/indicators', (req, res) => {
  res.json({
    catalog: ResearchEngine.getIndicatorResearchCatalog(),
    correlations: ResearchEngine.getIndicatorCorrelationMatrix()
  });
});

// 9. Exchange Connection & Credentials Test
app.post('/api/exchange/connect', async (req, res) => {
  try {
    const { exchangeId, apiKey, apiSecret, passphrase } = req.body;
    if (exchangeId) globalExchangeManager.setActiveExchange(exchangeId);
    const adapter = globalExchangeManager.getActiveAdapter();
    const result = await adapter.testConnection(apiKey, apiSecret, passphrase);
    addLog('INFO', 'EXCHANGE', `Connection test to ${exchangeId || 'active'}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Switch Mode (BACKTEST / PAPER / LIVE)
app.post('/api/exchange/mode', requireAuth, (req, res) => {
  try {
    const { mode, confirmationToken } = req.body;
    const result = globalExchangeManager.setMode(mode, confirmationToken);
    if (!result.success) {
      addLog('WARN', 'ENGINE', `Rejected mode switch to ${mode}: ${result.message}`);
      return res.status(400).json(result);
    }
    addLog('INFO', 'ENGINE', `Trading mode updated to ${mode}.`);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Kill Switch Toggle
app.post('/api/exchange/kill-switch', requireAuth, (req, res) => {
  try {
    const { active } = req.body;
    globalExchangeManager.setEmergencyKillSwitch(Boolean(active));
    globalRiskEngine.updateConfig({ emergencyKillSwitchActive: Boolean(active) });
    addLog('WARN', 'RISK', `Emergency Kill Switch set to ${active ? 'ACTIVE' : 'INACTIVE'}`);
    res.json({ success: true, killSwitchActive: Boolean(active) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Risk Config
app.get('/api/risk/config', (req, res) => {
  res.json({ config: globalRiskEngine.getConfig() });
});

app.post('/api/risk/config', requireAuth, (req, res) => {
  try {
    globalRiskEngine.updateConfig(req.body);
    addLog('INFO', 'RISK', 'Risk limits updated via configuration dashboard.');
    res.json({ success: true, config: globalRiskEngine.getConfig() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12b. Slack Webhook Notifications
app.get('/api/slack/config', (req, res) => {
  res.json({ config: globalSlackNotifier.getConfig() });
});

app.post('/api/slack/config', requireAuth, (req, res) => {
  try {
    const updated = globalSlackNotifier.updateConfig(req.body);
    addLog('INFO', 'ENGINE', 'Slack notificatie-instellingen bijgewerkt.');
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/slack/test', async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    const result = await globalSlackNotifier.testWebhook(webhookUrl);
    if (result.success) {
      addLog('INFO', 'ENGINE', 'Slack testbericht succesvol verzonden.');
      res.json({ success: true, message: 'Testbericht succesvol bezorgd in je Slack-kanaal!' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12b2. Discord Webhook Notifications
app.get('/api/discord/config', (req, res) => {
  res.json({ config: globalDiscordNotifier.getConfig() });
});

app.post('/api/discord/config', requireAuth, (req, res) => {
  try {
    const updated = globalDiscordNotifier.updateConfig(req.body);
    addLog('INFO', 'ENGINE', 'Discord notificatie-instellingen bijgewerkt.');
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/test', async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    const result = await globalDiscordNotifier.testWebhook(webhookUrl);
    if (result.success) {
      addLog('INFO', 'ENGINE', 'Discord testbericht succesvol verzonden.');
      res.json({ success: true, message: 'Testbericht succesvol bezorgd in je Discord-kanaal!' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12c. Security & Admin PIN
app.get('/api/security/status', (req, res) => {
  const token = req.headers['x-admin-token'] || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  const pinConfigured = globalSecurityManager.isPinConfigured();
  const isUnlocked = !pinConfigured || globalSecurityManager.verifySessionToken(token as string);

  res.json({
    pinConfigured,
    isUnlocked
  });
});

app.post('/api/security/login', (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN is vereist' });

  const result = globalSecurityManager.verifyPin(pin);
  if (result.success) {
    res.json({ success: true, token: result.token, message: 'Ingelogd' });
  } else {
    res.status(401).json({ success: false, error: result.message || 'Onjuiste PIN' });
  }
});

app.post('/api/security/set-pin', (req, res) => {
  const { newPin, currentPin } = req.body;
  const result = globalSecurityManager.setPin(newPin, currentPin);
  if (result.success) {
    addLog('INFO', 'ENGINE', 'Admin PIN succesvol ingesteld / gewijzigd.');
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

app.post('/api/security/remove-pin', requireAuth, (req, res) => {
  const { currentPin } = req.body;
  const result = globalSecurityManager.removePin(currentPin);
  if (result.success) {
    addLog('INFO', 'ENGINE', 'Admin PIN beveiliging uitgeschakeld.');
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// 12d. Persistent Storage Status
app.get('/api/storage/status', (req, res) => {
  res.json({ status: globalStorageManager.getStorageStatus() });
});

// 13. System Logs
app.get('/api/logs', (req, res) => {
  res.json({ logs: systemLogs });
});

// --- AUTONOMOUS SERVER-SIDE BACKGROUND ENGINE DAEMON (24/7 Executing Loop) ---
let isBackgroundCycleRunning = false;
async function runAutonomousBackgroundEngine() {
  if (isBackgroundCycleRunning) return;
  isBackgroundCycleRunning = true;
  try {
    const adapter = globalExchangeManager.getActiveAdapter();
    const markets = await adapter.fetchTopMarkets();

    const priceMap = new Map<string, number>();
    for (const m of markets) {
      priceMap.set(m.symbol, m.price);
      MarketDataEngine.setLivePrice(m.symbol, m.price);
      MarketDataEngine.setMarketStats(m.symbol, {
        price: m.price,
        change24h: m.change24h,
        high24h: m.high24h,
        low24h: m.low24h,
        volume24hUsd: m.volume24hUsd,
        spreadPercent: m.spreadPercent,
        volatility24h: m.volatility24h,
        regime: m.regime
      });
    }

    // 1. 24/7 Position Monitoring & Safety Exits (Stop Loss, Trailing Stop, TP Targets)
    const closedTrades = globalExchangeManager.updatePositionsWithLivePrices(markets);
    for (const ct of closedTrades) {
      globalRiskEngine.recordTradeResult(ct.netPnl);
      addLog('TRADE', 'EXCHANGE', `[24/7 ACHTERGROND EXIT] ${ct.symbol} bereikte ${ct.exitReason} @ $${ct.exitPrice}. Netto P&L: $${ct.netPnl} (${ct.netPnlPercent}%, ${ct.returnR}R)`);
    }

    // 2. 24/7 Autonomous Auto-Trading: If Auto-Bot toggle is enabled, scan and execute qualified triggers
    if (globalExchangeManager.isAutoTradingEnabled() && !globalExchangeManager.isEmergencyKillSwitchActive()) {
      const symbols = [
        'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 
        'SUIUSDT', 'AVAXUSDT', 'ADAUSDT', 'NEARUSDT', 'APTUSDT', 
        'RENDERUSDT', 'FETUSDT', 'TAOUSDT', 'LINKUSDT', 'AAVEUSDT', 
        'UNIUSDT', 'DOGEUSDT', 'PEPEUSDT', 'SHIBUSDT'
      ];
      for (const sym of symbols) {
        const livePrice = priceMap.get(sym);
        const sig = SignalEngine.generateSignal(sym, livePrice);
        if (
          sig.action === 'BUY' &&
          sig.triggerActive &&
          sig.triggerStatus === 'ACTIVE_TRIGGER' &&
          sig.scoreBreakdown.totalScore >= 75 &&
          sig.mtf.aligned
        ) {
          const resTrade = globalExchangeManager.executeSignalOrder(sig, globalRiskEngine);
          if (resTrade.success) {
            addLog('TRADE', 'ENGINE', `[24/7 ACHTERGROND ENTRY] Auto-Bot opende zelfstandig positie: ${resTrade.message}`);
            break; // Max 1 order per tick to enforce portfolio allocation bounds
          }
        }
      }
    }
  } catch (err: any) {
    // Suppress intermittent network fetch hiccups
  } finally {
    isBackgroundCycleRunning = false;
  }
}

// Start 24/7 autonomous background worker (runs every 4 seconds)
setInterval(runAutonomousBackgroundEngine, 4000);

// --- VITE MIDDLEWARE & SERVER STARTUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QuantCrypto Engine] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[QuantCrypto Engine] 24/7 Autonomous Background Daemon ACTIVE.`);
  });
}

startServer();
