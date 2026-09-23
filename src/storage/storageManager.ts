/**
 * Persistent Storage Manager
 * Ensures all open positions, trade history, risk metrics, and settings
 * survive server reboots, Docker restarts, and system updates.
 */

import fs from 'fs';
import path from 'path';
import { Position, TradeRecord, RiskConfig, SlackConfig, DiscordConfig, SystemLog, StorageStatus } from '../types';

export interface PersistentBotData {
  version: number;
  lastSavedAt: number;
  autoTradingActive: boolean;
  positions: Position[];
  tradeHistory: TradeRecord[];
  riskConfig: Partial<RiskConfig>;
  slackConfig: SlackConfig;
  discordConfig: DiscordConfig;
  security: {
    pinHash?: string;
    pinSalt?: string;
  };
  systemLogs: SystemLog[];
}

const DEFAULT_SLACK_CONFIG: SlackConfig = {
  webhookUrl: '',
  enabled: false,
  notifyOnEntries: true,
  notifyOnExits: true,
  notifyOnRiskBreach: true,
  notifyOnBotToggle: true
};

const DEFAULT_DISCORD_CONFIG: DiscordConfig = {
  webhookUrl: '',
  enabled: false,
  notifyOnEntries: true,
  notifyOnExits: true,
  notifyOnRiskBreach: true,
  notifyOnBotToggle: true
};

export class StorageManager {
  private static instance: StorageManager;
  private dataDir: string;
  private filePath: string;
  private memoryCache: PersistentBotData;
  private saveDebounceTimer: NodeJS.Timeout | null = null;
  private isSaving = false;

  private constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.filePath = path.join(this.dataDir, 'bot_state.json');

    // Ensure data directory exists
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (err) {
      console.error('[StorageManager] Failed to create data directory:', err);
    }

    this.memoryCache = this.loadInitialState();
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private loadInitialState(): PersistentBotData {
    const fallback: PersistentBotData = {
      version: 1,
      lastSavedAt: Date.now(),
      autoTradingActive: false,
      positions: [],
      tradeHistory: [],
      riskConfig: {},
      slackConfig: DEFAULT_SLACK_CONFIG,
      discordConfig: DEFAULT_DISCORD_CONFIG,
      security: {},
      systemLogs: []
    };

    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw);
          console.log(`[StorageManager] State restored from ${this.filePath}. Loaded ${parsed.positions?.length || 0} open positions and ${parsed.tradeHistory?.length || 0} past trades.`);
          return {
            ...fallback,
            ...parsed,
            slackConfig: { ...DEFAULT_SLACK_CONFIG, ...(parsed.slackConfig || {}) },
            discordConfig: { ...DEFAULT_DISCORD_CONFIG, ...(parsed.discordConfig || {}) },
            security: { ...(parsed.security || {}) }
          };
        }
      }
    } catch (err) {
      console.warn('[StorageManager] Could not read existing bot_state.json, initializing fresh store:', err);
    }

    return fallback;
  }

  public getState(): PersistentBotData {
    return this.memoryCache;
  }

  public updateState(partial: Partial<PersistentBotData>, immediate = false): void {
    this.memoryCache = {
      ...this.memoryCache,
      ...partial,
      lastSavedAt: Date.now()
    };

    if (immediate) {
      this.writeToDiskSync();
    } else {
      this.scheduleSave();
    }
  }

  private scheduleSave(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.writeToDiskAsync();
    }, 1000); // 1s debounce
  }

  public writeToDiskSync(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const tempPath = `${this.filePath}.tmp`;
      const dataStr = JSON.stringify(this.memoryCache, null, 2);
      fs.writeFileSync(tempPath, dataStr, 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('[StorageManager] writeToDiskSync failed:', err);
    }
  }

  public async writeToDiskAsync(): Promise<void> {
    if (this.isSaving) return;
    this.isSaving = true;

    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const tempPath = `${this.filePath}.tmp`;
      const dataStr = JSON.stringify(this.memoryCache, null, 2);
      await fs.promises.writeFile(tempPath, dataStr, 'utf-8');
      await fs.promises.rename(tempPath, this.filePath);
    } catch (err) {
      console.error('[StorageManager] writeToDiskAsync failed:', err);
    } finally {
      this.isSaving = false;
    }
  }

  public getStorageStatus(): StorageStatus {
    return {
      persisted: fs.existsSync(this.filePath),
      filePath: 'data/bot_state.json',
      lastSavedAt: this.memoryCache.lastSavedAt,
      openPositionsCount: this.memoryCache.positions?.length || 0,
      totalTradesSaved: this.memoryCache.tradeHistory?.length || 0
    };
  }
}

export const globalStorageManager = StorageManager.getInstance();
