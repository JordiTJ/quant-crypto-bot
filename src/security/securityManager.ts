/**
 * Security & Access Control Manager
 * Protects bot operations (Kill switch, Auto-trading toggle, Position close, Risk settings)
 * with a Master Admin PIN / Password.
 */

import crypto from 'crypto';
import { globalStorageManager } from '../storage/storageManager';

export class SecurityManager {
  private static instance: SecurityManager;
  private validSessionTokens: Set<string> = new Set();

  private constructor() {
    // Generate a default session token on boot if no PIN is set
    const state = globalStorageManager.getState();
    if (!state.security?.pinHash) {
      // Check if ADMIN_PIN env var was provided
      if (process.env.ADMIN_PIN) {
        this.setPin(process.env.ADMIN_PIN);
      }
    }
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  public isPinConfigured(): boolean {
    const state = globalStorageManager.getState();
    return Boolean(state.security?.pinHash && state.security?.pinSalt);
  }

  private hashPin(pin: string, salt: string): string {
    return crypto.createHash('sha256').update(pin + salt).digest('hex');
  }

  public verifyPin(pin: string): { success: boolean; token?: string; message?: string } {
    if (!this.isPinConfigured()) {
      // If no PIN is configured, allow access and create session token
      const token = crypto.randomBytes(24).toString('hex');
      this.validSessionTokens.add(token);
      return { success: true, token, message: 'Geen PIN ingesteld; open toegang' };
    }

    const state = globalStorageManager.getState();
    const { pinHash, pinSalt } = state.security || {};

    if (!pinHash || !pinSalt) {
      return { success: false, message: 'Beveiligingsconfiguratie ongeldig' };
    }

    const computed = this.hashPin(pin, pinSalt);
    if (computed === pinHash) {
      const token = crypto.randomBytes(24).toString('hex');
      this.validSessionTokens.add(token);
      return { success: true, token, message: 'Authenticatie geslaagd' };
    }

    return { success: false, message: 'Onjuiste PIN / Wachtwoord' };
  }

  public verifySessionToken(token: string): boolean {
    if (!this.isPinConfigured()) return true;
    if (!token) return false;
    return this.validSessionTokens.has(token);
  }

  public setPin(newPin: string, currentPin?: string): { success: boolean; message: string; token?: string } {
    if (!newPin || newPin.trim().length < 4) {
      return { success: false, message: 'PIN moet minimaal 4 tekens lang zijn.' };
    }

    if (this.isPinConfigured()) {
      // Must verify current PIN first
      if (!currentPin) {
        return { success: false, message: 'Huidige PIN is vereist om deze te wijzigen.' };
      }
      const check = this.verifyPin(currentPin);
      if (!check.success) {
        return { success: false, message: 'Huidige PIN is onjuist.' };
      }
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashPin(newPin.trim(), salt);

    const state = globalStorageManager.getState();
    globalStorageManager.updateState({
      security: {
        ...state.security,
        pinHash: hash,
        pinSalt: salt
      }
    }, true);

    const token = crypto.randomBytes(24).toString('hex');
    this.validSessionTokens.add(token);

    return { success: true, message: 'Admin PIN succesvol ingesteld.', token };
  }

  public removePin(currentPin: string): { success: boolean; message: string } {
    if (!this.isPinConfigured()) {
      return { success: true, message: 'Er was al geen PIN ingesteld.' };
    }

    const check = this.verifyPin(currentPin);
    if (!check.success) {
      return { success: false, message: 'Huidige PIN is onjuist.' };
    }

    globalStorageManager.updateState({
      security: {}
    }, true);

    this.validSessionTokens.clear();
    return { success: true, message: 'PIN beveiliging uitgeschakeld.' };
  }
}

export const globalSecurityManager = SecurityManager.getInstance();
