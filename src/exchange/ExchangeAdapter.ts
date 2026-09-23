/**
 * Abstract Exchange Adapter Layer
 * Standardizes multi-exchange integration (Phemex, Binance, Bybit, OKX)
 */

import { Candle, MarketTicker, TradingMode } from '../types';

export interface OrderRequest {
  clientOrderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
  price?: number;
  amount: number;
  stopPrice?: number;
  reduceOnly?: boolean;
}

export interface OrderResponse {
  exchangeOrderId: string;
  clientOrderId: string;
  symbol: string;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';
  price: number;
  avgFillPrice: number;
  origQty: number;
  executedQty: number;
  cumulativeQuoteQty: number;
  feePaid: number;
  feeAsset: string;
  timestamp: number;
}

export interface AccountBalance {
  totalEquityUsd: number;
  availableBalanceUsd: number;
  usedMarginUsd: number;
  balances: { asset: string; free: number; locked: number }[];
}

export interface ExchangePermissions {
  canRead: boolean;
  canTrade: boolean;
  withdrawalsDisabled: boolean; // MANDATORY TRUE: Bot must NEVER have withdrawal rights
}

export class ExchangeError extends Error {
  constructor(message: string, public code?: string, public httpStatus?: number) {
    super(message);
    this.name = 'ExchangeError';
  }
}

export class RateLimitError extends ExchangeError {
  constructor(message: string, public retryAfterMs = 5000) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends ExchangeError {
  constructor(message: string) {
    super(message, 'AUTH_FAILED', 401);
    this.name = 'AuthenticationError';
  }
}

export class OrderRejectedError extends ExchangeError {
  constructor(message: string, public reason: string) {
    super(message, 'ORDER_REJECTED', 400);
    this.name = 'OrderRejectedError';
  }
}

export abstract class ExchangeAdapter {
  protected mode: TradingMode = 'PAPER';
  protected isLiveEnabled = false;
  protected emergencyKillSwitch = false;
  protected requestWeight = 0;
  protected lastWeightReset = Date.now();

  constructor(public readonly exchangeId: 'phemex' | 'binance' | 'bybit' | 'okx') {}

  abstract testConnection(apiKey?: string, apiSecret?: string, passphrase?: string): Promise<{
    success: boolean;
    latencyMs: number;
    permissions: ExchangePermissions;
    balance: AccountBalance;
    message?: string;
  }>;

  abstract fetchTopMarkets(): Promise<MarketTicker[]>;

  abstract fetchKlines(symbol: string, interval: string, limit?: number): Promise<Candle[]>;

  abstract createOrder(order: OrderRequest): Promise<OrderResponse>;

  abstract cancelOrder(symbol: string, orderId: string, clientOrderId?: string): Promise<{ success: boolean }>;

  abstract getOrderStatus(symbol: string, orderId: string, clientOrderId?: string): Promise<OrderResponse>;

  abstract getAccountBalance(): Promise<AccountBalance>;

  setMode(mode: TradingMode, isLiveConfirmed = false): void {
    if (mode === 'LIVE' && !isLiveConfirmed) {
      throw new Error('Security Violation: Live trading cannot be enabled without explicit confirmation.');
    }
    this.mode = mode;
    this.isLiveEnabled = mode === 'LIVE';
  }

  getMode(): TradingMode {
    return this.mode;
  }

  setEmergencyKillSwitch(active: boolean): void {
    this.emergencyKillSwitch = active;
  }

  isEmergencyHalted(): boolean {
    return this.emergencyKillSwitch;
  }

  /**
   * Exponential backoff helper for resilient API interactions
   */
  protected async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    baseDelayMs = 1000
  ): Promise<T> {
    if (this.emergencyKillSwitch) {
      throw new Error('EMERGENCY_HALT_ACTIVE: Exchange operations are locked.');
    }

    let attempt = 0;
    while (attempt < retries) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;
        if (err instanceof RateLimitError || err?.httpStatus === 429) {
          const delay = (err?.retryAfterMs || baseDelayMs) * Math.pow(2, attempt);
          console.warn(`[${this.exchangeId}] Rate limit hit. Backoff retry ${attempt}/${retries} in ${delay}ms`);
          await new Promise(res => setTimeout(res, delay));
        } else if (attempt >= retries) {
          throw err;
        } else {
          const delay = baseDelayMs * Math.pow(1.5, attempt);
          await new Promise(res => setTimeout(res, delay));
        }
      }
    }
    throw new ExchangeError(`Operation failed after ${retries} retries`);
  }
}
