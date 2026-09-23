import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Lock, 
  Unlock, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Key, 
  ShieldCheck, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Sliders, 
  Check,
  MessageSquare,
  Server,
  Terminal,
  Copy,
  ChevronDown,
  ChevronUp,
  Laptop,
  Globe,
  Cpu
} from 'lucide-react';
import { SlackConfig, DiscordConfig, SecurityState, StorageStatus } from '../types';

interface SettingsViewProps {
  onRefreshGlobal?: () => void;
  sessionToken: string | null;
  onUpdateSessionToken: (token: string | null) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onRefreshGlobal,
  sessionToken,
  onUpdateSessionToken
}) => {
  const [notificationChannelTab, setNotificationChannelTab] = useState<'discord' | 'slack'>('discord');
  const [hostingPlatformTab, setHostingPlatformTab] = useState<'oracle' | 'laptop' | 'gcp' | 'render'>('oracle');

  // Discord State
  const [discordConfig, setDiscordConfig] = useState<DiscordConfig>({
    webhookUrl: '',
    enabled: false,
    notifyOnEntries: true,
    notifyOnExits: true,
    notifyOnRiskBreach: true,
    notifyOnBotToggle: true
  });
  const [showDiscordWebhookUrl, setShowDiscordWebhookUrl] = useState(false);
  const [isSavingDiscord, setIsSavingDiscord] = useState(false);
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [discordTestResult, setDiscordTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Slack State
  const [slackConfig, setSlackConfig] = useState<SlackConfig>({
    webhookUrl: '',
    enabled: false,
    notifyOnEntries: true,
    notifyOnExits: true,
    notifyOnRiskBreach: true,
    notifyOnBotToggle: true
  });
  const [showSlackWebhookUrl, setShowSlackWebhookUrl] = useState(false);
  const [isSavingSlack, setIsSavingSlack] = useState(false);
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [slackTestResult, setSlackTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Security State
  const [securityState, setSecurityState] = useState<SecurityState>({
    pinConfigured: false,
    isUnlocked: true
  });
  const [pinInput, setPinInput] = useState('');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinActionMessage, setPinActionMessage] = useState<{ success: boolean; message: string } | null>(null);

  // Storage State
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Oracle Deployment Guide State
  const [showOracleGuide, setShowOracleGuide] = useState(true);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  // Fetch all initial data
  const fetchData = async () => {
    setIsLoadingStatus(true);
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) headers['x-admin-token'] = sessionToken;

      const [discordRes, slackRes, secRes, storeRes] = await Promise.all([
        fetch('/api/discord/config', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/slack/config', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/security/status', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/storage/status', { headers }).then(r => r.json()).catch(() => null)
      ]);

      if (discordRes?.config) setDiscordConfig(discordRes.config);
      if (slackRes?.config) setSlackConfig(slackRes.config);
      if (secRes) setSecurityState(secRes);
      if (storeRes?.status) setStorageStatus(storeRes.status);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sessionToken]);

  // Handle Save Discord Config
  const handleSaveDiscord = async () => {
    setIsSavingDiscord(true);
    setDiscordTestResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['x-admin-token'] = sessionToken;

      const res = await fetch('/api/discord/config', {
        method: 'POST',
        headers,
        body: JSON.stringify(discordConfig)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDiscordTestResult({ success: true, message: 'Discord-instellingen succesvol opgeslagen!' });
        if (data.config) setDiscordConfig(data.config);
      } else {
        setDiscordTestResult({ success: false, message: data.error || 'Opslaan van Discord mislukt' });
      }
    } catch (err: any) {
      setDiscordTestResult({ success: false, message: err.message || 'Verbindingsfout' });
    } finally {
      setIsSavingDiscord(false);
    }
  };

  // Handle Test Discord Message
  const handleTestDiscord = async () => {
    if (!discordConfig.webhookUrl) {
      setDiscordTestResult({ success: false, message: 'Vul eerst een geldige Discord Webhook URL in.' });
      return;
    }
    setIsTestingDiscord(true);
    setDiscordTestResult(null);
    try {
      const res = await fetch('/api/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: discordConfig.webhookUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDiscordTestResult({ success: true, message: '✅ ' + (data.message || 'Bericht succesvol ontvangen in Discord!') });
      } else {
        setDiscordTestResult({ success: false, message: '❌ ' + (data.error || 'Discord webhook weigerde het bericht') });
      }
    } catch (err: any) {
      setDiscordTestResult({ success: false, message: '❌ ' + (err.message || 'Kan Discord webhook niet bereiken') });
    } finally {
      setIsTestingDiscord(false);
    }
  };

  // Handle Save Slack Config
  const handleSaveSlack = async () => {
    setIsSavingSlack(true);
    setSlackTestResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['x-admin-token'] = sessionToken;

      const res = await fetch('/api/slack/config', {
        method: 'POST',
        headers,
        body: JSON.stringify(slackConfig)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSlackTestResult({ success: true, message: 'Slack-instellingen succesvol opgeslagen!' });
        if (data.config) setSlackConfig(data.config);
      } else {
        setSlackTestResult({ success: false, message: data.error || 'Opslaan van Slack mislukt' });
      }
    } catch (err: any) {
      setSlackTestResult({ success: false, message: err.message || 'Verbindingsfout' });
    } finally {
      setIsSavingSlack(false);
    }
  };

  // Handle Test Slack Message
  const handleTestSlack = async () => {
    if (!slackConfig.webhookUrl) {
      setSlackTestResult({ success: false, message: 'Vul eerst een geldige Slack Webhook URL in.' });
      return;
    }
    setIsTestingSlack(true);
    setSlackTestResult(null);
    try {
      const res = await fetch('/api/slack/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: slackConfig.webhookUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSlackTestResult({ success: true, message: '✅ ' + (data.message || 'Bericht succesvol ontvangen in Slack!') });
      } else {
        setSlackTestResult({ success: false, message: '❌ ' + (data.error || 'Slack webhook weigerde het bericht') });
      }
    } catch (err: any) {
      setSlackTestResult({ success: false, message: '❌ ' + (err.message || 'Kan Slack webhook niet bereiken') });
    } finally {
      setIsTestingSlack(false);
    }
  };

  // Handle Unlock with PIN
  const handleUnlockPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput) return;
    setPinActionMessage(null);
    try {
      const res = await fetch('/api/security/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        onUpdateSessionToken(data.token);
        setSecurityState(prev => ({ ...prev, isUnlocked: true }));
        setPinInput('');
        setPinActionMessage({ success: true, message: 'Beheerderspaneel ontgrendeld.' });
      } else {
        setPinActionMessage({ success: false, message: data.error || 'Onjuiste PIN' });
      }
    } catch (err: any) {
      setPinActionMessage({ success: false, message: err.message || 'Authenticatiefout' });
    }
  };

  // Handle Lock Session
  const handleLockSession = () => {
    onUpdateSessionToken(null);
    setSecurityState(prev => ({ ...prev, isUnlocked: false }));
    setPinActionMessage({ success: true, message: 'Sessie direct vergrendeld.' });
  };

  // Handle Set or Change PIN
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinActionMessage(null);
    if (!newPinInput || newPinInput.length < 4) {
      setPinActionMessage({ success: false, message: 'Nieuwe PIN moet minimaal 4 cijfers/tekens zijn.' });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinActionMessage({ success: false, message: 'De twee ingevoerde PIN-codes komen niet overeen.' });
      return;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['x-admin-token'] = sessionToken;

      const res = await fetch('/api/security/set-pin', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          newPin: newPinInput,
          currentPin: currentPinInput
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) onUpdateSessionToken(data.token);
        setSecurityState({ pinConfigured: true, isUnlocked: true });
        setNewPinInput('');
        setConfirmPinInput('');
        setCurrentPinInput('');
        setPinActionMessage({ success: true, message: 'Master PIN succesvol ingesteld!' });
      } else {
        setPinActionMessage({ success: false, message: data.message || data.error || 'PIN wijzigen mislukt' });
      }
    } catch (err: any) {
      setPinActionMessage({ success: false, message: err.message || 'Fout bij opslaan PIN' });
    }
  };

  // Handle Remove PIN
  const handleRemovePin = async () => {
    if (!window.confirm('Weet je zeker dat je de PIN-beveiliging wilt verwijderen? Het dashboard is dan weer zonder code toegankelijk.')) {
      return;
    }
    const enteredCurrent = prompt('Voer je huidige PIN in om de beveiliging te verwijderen:');
    if (!enteredCurrent) return;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['x-admin-token'] = sessionToken;

      const res = await fetch('/api/security/remove-pin', {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPin: enteredCurrent })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUpdateSessionToken(null);
        setSecurityState({ pinConfigured: false, isUnlocked: true });
        setPinActionMessage({ success: true, message: 'PIN-beveiliging uitgeschakeld. Toegang is nu open.' });
      } else {
        setPinActionMessage({ success: false, message: data.message || data.error || 'Onjuiste PIN' });
      }
    } catch (err: any) {
      setPinActionMessage({ success: false, message: err.message || 'Fout bij verwijderen PIN' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Productie-instellingen: Discord, Slack, Beveiliging & Opslag
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configureer realtime alerts naar Discord en Slack, beveilig het dashboard met een Master PIN en controleer permanente dataopslag.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoadingStatus}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
          Vernieuwen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =========================================
            NOTIFICATION CHANNELS CARD (DISCORD & SLACK)
        ========================================= */}
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Channel Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNotificationChannelTab('discord')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    notificationChannelTab === 'discord'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>Discord Webhook</span>
                  {discordConfig.enabled && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setNotificationChannelTab('slack')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    notificationChannelTab === 'slack'
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>Slack Webhook</span>
                  {slackConfig.enabled && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>
              </div>

              {/* Master Toggle for current active channel */}
              {notificationChannelTab === 'discord' ? (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={discordConfig.enabled}
                    onChange={(e) => setDiscordConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                  <span className="ml-2 text-xs font-medium text-slate-300">
                    {discordConfig.enabled ? 'Actief' : 'Uit'}
                  </span>
                </label>
              ) : (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slackConfig.enabled}
                    onChange={(e) => setSlackConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-2 text-xs font-medium text-slate-300">
                    {slackConfig.enabled ? 'Actief' : 'Uit'}
                  </span>
                </label>
              )}
            </div>

            {/* DISCORD TAB CONTENT */}
            {notificationChannelTab === 'discord' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      Discord Webhook URL
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Discord &rarr; Kanaalinstellingen &rarr; Integraties &rarr; Webhooks
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showDiscordWebhookUrl ? 'text' : 'password'}
                      placeholder="https://discord.com/api/webhooks/123456789/.../..."
                      value={discordConfig.webhookUrl}
                      onChange={(e) => setDiscordConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDiscordWebhookUrl(!showDiscordWebhookUrl)}
                      className="absolute right-2 text-slate-400 hover:text-slate-200 p-1"
                    >
                      {showDiscordWebhookUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Ondersteunt rijke embeds met gekleurde statuskaarten (groen voor winst/entry, rood voor stop-loss/sluiting).
                  </p>
                </div>

                {/* Discord Notification Checkboxes */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-300 block uppercase tracking-wider">
                    Discord Meldingscriteria
                  </span>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-800/60 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={discordConfig.notifyOnEntries}
                      onChange={(e) => setDiscordConfig(prev => ({ ...prev, notifyOnEntries: e.target.checked }))}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                    />
                    <span>🟢 <strong>Trade Entries:</strong> Embed card bij geopende orders (inclusief Stop Loss & TP1/TP2)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-800/60 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={discordConfig.notifyOnExits}
                      onChange={(e) => setDiscordConfig(prev => ({ ...prev, notifyOnExits: e.target.checked }))}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                    />
                    <span>🎯 <strong>Trade Exits:</strong> Winst/verlies alert met netto P&L, percentage en R-multiple</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-800/60 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={discordConfig.notifyOnRiskBreach}
                      onChange={(e) => setDiscordConfig(prev => ({ ...prev, notifyOnRiskBreach: e.target.checked }))}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                    />
                    <span>⚠️ <strong>Risico Circuit Breakers:</strong> Alert als max dagverlies of cooldownperiode triggert</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-800/60 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={discordConfig.notifyOnBotToggle}
                      onChange={(e) => setDiscordConfig(prev => ({ ...prev, notifyOnBotToggle: e.target.checked }))}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                    />
                    <span>🤖 <strong>Bot Status:</strong> Melding wanneer Auto-Trading bot wordt in- of uitgeschakeld</span>
                  </label>
                </div>

                {/* Discord Test result feedback */}
                {discordTestResult && (
                  <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                    discordTestResult.success 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    {discordTestResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    <span>{discordTestResult.message}</span>
                  </div>
                )}
              </div>
            )}

            {/* SLACK TAB CONTENT */}
            {notificationChannelTab === 'slack' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-emerald-400" />
                      Slack Incoming Webhook URL
                    </span>
                    <a
                      href="https://api.slack.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1"
                    >
                      Maak webhook aan in Slack <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showSlackWebhookUrl ? 'text' : 'password'}
                      placeholder="https://hooks.slack.com/services/T.../B.../..."
                      value={slackConfig.webhookUrl}
                      onChange={(e) => setSlackConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSlackWebhookUrl(!showSlackWebhookUrl)}
                      className="absolute right-2 text-slate-400 hover:text-slate-200 p-1"
                    >
                      {showSlackWebhookUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Ondersteunt Slack blocks met interactieve opmaak en doellijnen.
                  </p>
                </div>

                {/* Slack Notification Checkboxes */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-300 block uppercase tracking-wider">
                    Slack Meldingscriteria
                  </span>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-800/60 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={slackConfig.notifyOnEntries}
                      onChange={(e) => setSlackConfig(prev => ({ ...prev, notifyOnEntries: e.target.checked }))}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                    />
                    <span>🟢 <strong>Trade Entries:</strong> Alert zodra bot positie koopt</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-800/60 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={slackConfig.notifyOnExits}
                      onChange={(e) => setSlackConfig(prev => ({ ...prev, notifyOnExits: e.target.checked }))}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                    />
                    <span>🎯 <strong>Trade Exits:</strong> Winst- of verliesbericht bij TP of SL</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-800/60 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={slackConfig.notifyOnRiskBreach}
                      onChange={(e) => setSlackConfig(prev => ({ ...prev, notifyOnRiskBreach: e.target.checked }))}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                    />
                    <span>⚠️ <strong>Risico Circuit Breakers:</strong> Max dagverlies of cooldown alert</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-800/60 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={slackConfig.notifyOnBotToggle}
                      onChange={(e) => setSlackConfig(prev => ({ ...prev, notifyOnBotToggle: e.target.checked }))}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                    />
                    <span>🤖 <strong>Bot Status:</strong> Melding wanneer Auto-Trading bot status wijzigt</span>
                  </label>
                </div>

                {/* Slack Test result feedback */}
                {slackTestResult && (
                  <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                    slackTestResult.success 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    {slackTestResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    <span>{slackTestResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons for active channel */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
            {notificationChannelTab === 'discord' ? (
              <>
                <button
                  onClick={handleSaveDiscord}
                  disabled={isSavingDiscord}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSavingDiscord ? 'Opslaan...' : 'Discord Instellingen Opslaan'}
                </button>

                <button
                  onClick={handleTestDiscord}
                  disabled={isTestingDiscord || !discordConfig.webhookUrl}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-400" />
                  {isTestingDiscord ? 'Verzenden...' : 'Test Discord Webhook'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveSlack}
                  disabled={isSavingSlack}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-sm transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSavingSlack ? 'Opslaan...' : 'Slack Instellingen Opslaan'}
                </button>

                <button
                  onClick={handleTestSlack}
                  disabled={isTestingSlack || !slackConfig.webhookUrl}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  {isTestingSlack ? 'Verzenden...' : 'Test Slack Webhook'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* =========================================
            SECURITY & ADMIN PIN CARD
        ========================================= */}
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg border ${
                  securityState.pinConfigured 
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {securityState.pinConfigured ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">Dashboard Toegangsbeveiliging</h3>
                  <p className="text-[11px] text-slate-400">Bescherm orders en noodknoppen met een Master PIN</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border ${
                securityState.pinConfigured
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {securityState.pinConfigured ? 'PIN Ingesteld' : 'Open Toegang (Geen PIN)'}
              </span>
            </div>

            {/* Quick Unlock or Lock View */}
            {securityState.pinConfigured ? (
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Sessiestatus:</span>
                    {securityState.isUnlocked ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ontgrendeld (Volledige Toegang)
                      </span>
                    ) : (
                      <span className="text-rose-400 font-medium flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Vergrendeld (Alleen-Lezen)
                      </span>
                    )}
                  </div>

                  {securityState.isUnlocked ? (
                    <button
                      onClick={handleLockSession}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
                    >
                      Vergrendel Direct
                    </button>
                  ) : null}
                </div>

                {!securityState.isUnlocked && (
                  <form onSubmit={handleUnlockPin} className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Voer Master PIN in..."
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition"
                    >
                      Ontgrendel
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  Er is nog geen PIN ingesteld. Iedereen die de URL van je bot bezoekt, kan orders plaatsen en instellingen wijzigen. Stel hieronder een PIN in om het dashboard te beveiligen.
                </span>
              </div>
            )}

            {/* Set or Change PIN Form */}
            <form onSubmit={handleSavePin} className="space-y-3 pt-2">
              <span className="text-[11px] font-semibold text-slate-300 block uppercase tracking-wider">
                {securityState.pinConfigured ? 'Master PIN Wijzigen' : 'Nieuwe Master PIN Instellen'}
              </span>

              {securityState.pinConfigured && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Huidige PIN:</label>
                  <input
                    type="password"
                    placeholder="••••"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nieuwe PIN (min. 4 cijfers):</label>
                  <input
                    type="password"
                    placeholder="••••"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Bevestig PIN:</label>
                  <input
                    type="password"
                    placeholder="••••"
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {pinActionMessage && (
                <div className={`p-2.5 rounded text-xs flex items-center gap-2 border ${
                  pinActionMessage.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {pinActionMessage.success ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span>{pinActionMessage.message}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                >
                  <Key className="w-3.5 h-3.5" />
                  {securityState.pinConfigured ? 'PIN Wijzigen' : 'PIN Instellen & Beveiligen'}
                </button>

                {securityState.pinConfigured && (
                  <button
                    type="button"
                    onClick={handleRemovePin}
                    className="px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs border border-rose-900/50 transition"
                  >
                    Verwijder PIN
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PIN wordt versleuteld met SHA-256 en salt opgeslagen.</span>
          </div>
        </div>
      </div>

      {/* =========================================
          PERSISTENT DATA STORAGE STATUS CARD
      ========================================= */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Data-Persistentie & Herstelgarantie</h3>
              <p className="text-[11px] text-slate-400">Automatische opslag van alle open posities, trades en instellingen</p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Permanent Opgeslagen
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Bestandslocatie</span>
            <span className="font-mono text-xs text-cyan-300 font-semibold block mt-1">
              {storageStatus?.filePath || 'data/bot_state.json'}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Atomair weggeschreven (geen corruptie)</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Bewaarde Open Posities</span>
            <span className="font-mono text-base text-slate-100 font-bold block mt-1">
              {storageStatus?.openPositionsCount ?? 0} posities
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Hersteld bij server reboot</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Bewaarde Trades</span>
            <span className="font-mono text-base text-slate-100 font-bold block mt-1">
              {storageStatus?.totalTradesSaved ?? 0} afgeronde trades
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Inclusief P&L en R-multiples</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Laatste Synchronisatie</span>
            <span className="font-mono text-xs text-slate-200 font-semibold block mt-1">
              {storageStatus?.lastSavedAt ? new Date(storageStatus.lastSavedAt).toLocaleTimeString('nl-NL') : 'Continu'}
            </span>
            <span className="text-[10px] text-emerald-400 mt-1 block">Direct gesynchroniseerd met schijf</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-300 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Herstelgarantie:</strong> Als je de bot laat draaien op Oracle Cloud, Ubuntu VPS of Docker en de machine herstart voor een beveiligingsupdate of stroomonderbreking, leest de achtergrond-daemon direct alle posities, stop losses, Discord- en Slack-instellingen weer in vanaf de schijf.
          </span>
        </div>
      </div>

      {/* =========================================
          24/7 GRATIS HOSTING GIDS (ORACLE, LAPTOP, GCP, RENDER)
      ========================================= */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
        <div 
          onClick={() => setShowOracleGuide(!showOracleGuide)}
          className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-sm">
                  24/7 Gratis Hosting Mogelijkheden voor Paper Trading
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  4 Gratis Manieren
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Laat de bot 24/7 autonoom doordraaien via Oracle Cloud, een oude laptop/Raspberry Pi thuis, Google Cloud of Render
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">
              {showOracleGuide ? 'Inklappen' : 'Bekijk Opties & Gids'}
            </span>
            {showOracleGuide ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {showOracleGuide && (
          <div className="p-5 pt-0 border-t border-slate-800/80 space-y-5">
            {/* Hosting Option Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setHostingPlatformTab('oracle')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  hostingPlatformTab === 'oracle'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Server className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Oracle Cloud (Always Free)</span>
              </button>

              <button
                type="button"
                onClick={() => setHostingPlatformTab('laptop')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  hostingPlatformTab === 'laptop'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Oude Laptop / Raspberry Pi (Aanrader)</span>
              </button>

              <button
                type="button"
                onClick={() => setHostingPlatformTab('gcp')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  hostingPlatformTab === 'gcp'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. Google Cloud (e2-micro Always Free)</span>
              </button>

              <button
                type="button"
                onClick={() => setHostingPlatformTab('render')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  hostingPlatformTab === 'render'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>4. Render / Koyeb (PaaS Cloud)</span>
              </button>
            </div>

            {/* TAB 1: ORACLE CLOUD */}
            {hostingPlatformTab === 'oracle' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                      <CheckCircle2 className="w-4 h-4" /> 100% Levenslang Gratis
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Oracle Always Free biedt gratis Ampere A1 ARM of AMD Micro servers zonder tijdslimiet.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
                      <Terminal className="w-4 h-4" /> 24/7 Achtergrond Daemon
                    </div>
                    <p className="text-[11px] text-slate-400">
                      De bot controleert continu trailing stops en TP-targets zonder dat je browser open hoeft te staan.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
                      <Bell className="w-4 h-4" /> Discord / Slack Alerts
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Direct realtime notificaties op je telefoon bij elke entry, exit of risico-ingreep.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">1</span>
                        Oracle VM Aanmaken & Poort 3000 Openen
                      </span>
                      <a href="https://cloud.oracle.com" target="_blank" rel="noreferrer" className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                        Oracle Console <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-400">
                      Kies <strong>Ubuntu 24.04</strong> en shape <strong>VM.Standard.A1.Flex</strong> (Always Free). Voeg in VCN Security Lists Ingress Rule toe voor TCP poort <code className="text-cyan-300">3000</code>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">2</span>
                        Installatie & 24/7 Starten met PM2
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`sudo apt update && sudo apt install -y curl git build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
npm install && npm run build
pm2 start npm --name "quant-crypto-bot" -- start
pm2 save && pm2 startup`, 'oracle-all')}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
                      >
                        {copiedSnippet === 'oracle-all' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedSnippet === 'oracle-all' ? 'Gekopieerd!' : 'Kopieer Commando\'s'}
                      </button>
                    </div>
                    <pre className="p-2.5 rounded bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-900">
sudo apt update && sudo apt install -y curl git build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs && sudo npm install -g pm2
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
npm install && npm run build
pm2 start npm --name "quant-crypto-bot" -- start
pm2 save && pm2 startup
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OUDE LAPTOP / RASPBERRY PI THUIS */}
            {hostingPlatformTab === 'laptop' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Waarom dit vaak de allerbeste optie is:</strong>
                    <ul className="list-disc ml-4 mt-1 space-y-1 text-slate-300">
                      <li><strong>Ingebouwde noodstroom (UPS):</strong> Een laptop heeft een accu. Als de stroom 10 minuten uitvalt, trade de bot ongestoord door.</li>
                      <li><strong>Geen cloud account of creditcard nodig:</strong> 100% lokaal in je eigen beheer.</li>
                      <li><strong>Minimaal stroomverbruik:</strong> Een dichtgeklapte laptop verbruikt slechts ~5-8 Watt (ongeveer €1 per maand). Een Raspberry Pi verbruikt ~2-3 Watt.</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <span className="text-xs font-semibold text-slate-200 block">
                      Stap 1: Laptop instellen zodat hij NIET in slaap valt bij dichtklappen
                    </span>
                    <p className="text-xs text-slate-400">
                      <strong>Windows:</strong> Configuratiescherm &rarr; Energiebeheer &rarr; <em>"Het gedrag van het sluiten van het deksel bepalen"</em> &rarr; kies <strong>"Geen actie ondernemen"</strong>.<br />
                      <strong>Mac:</strong> Gebruik het gratis tooltje <em>Amphetamine</em> (uit de App Store) of in Terminal: <code className="text-cyan-300">sudo pmset -a disablesleep 1</code>.<br />
                      <strong>Linux / Raspberry Pi:</strong> Staat standaard al ingesteld om 24/7 aan te blijven.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-300">
                        Stap 2: Node.js 20 installeren en de bot starten
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`npm install
npm run build
npm install -g pm2
pm2 start npm --name "quant-crypto-bot" -- start
pm2 save`, 'laptop-run')}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
                      >
                        {copiedSnippet === 'laptop-run' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedSnippet === 'laptop-run' ? 'Gekopieerd!' : 'Kopieer'}
                      </button>
                    </div>
                    <pre className="p-2.5 rounded bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-900">
npm install
npm run build
npm install -g pm2
pm2 start npm --name "quant-crypto-bot" -- start
pm2 save
                    </pre>
                    <p className="text-[11px] text-slate-400">
                      Open op elk apparaat in huis (bijv. tablet of smartphone) in je browser: <code className="text-cyan-300">http://&lt;IP-VAN-LAPTOP&gt;:3000</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GOOGLE CLOUD (E2-MICRO) */}
            {hostingPlatformTab === 'gcp' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-200">
                  <strong>Google Cloud Always Free voordeel:</strong> Google biedt 1 gratis <strong>e2-micro instance</strong> (2 vCPU burst, 1 GB RAM, 30 GB SSD) per maand die 100% gratis blijft zolang je deze aanmaakt in een van de gratis Amerikaanse zones (bijv. <code className="text-cyan-300">us-central1</code>, <code className="text-cyan-300">us-east1</code> of <code className="text-cyan-300">us-west1</code>).
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                    <span className="text-xs font-semibold text-cyan-300">1. VM Aanmaken op Google Cloud Console</span>
                    <p className="text-xs text-slate-400">
                      Ga naar <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">console.cloud.google.com</a> &rarr; Compute Engine &rarr; VM Instances &rarr; Create. Kies regio <strong>us-central1</strong>, machine type <strong>e2-micro</strong> en OS <strong>Ubuntu 22.04 LTS</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                    <span className="text-xs font-semibold text-cyan-300">2. Firewall poort 3000 toestaan</span>
                    <p className="text-xs text-slate-400">
                      Ga naar VPC network &rarr; Firewall &rarr; Create Firewall Rule &rarr; Targets: "All instances", Source IP ranges: <code className="text-cyan-300">0.0.0.0/0</code>, TCP poort <code className="text-cyan-300">3000</code>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                    <span className="text-xs font-semibold text-cyan-300">3. Starten via SSH in Google Console</span>
                    <p className="text-xs text-slate-400">
                      Klik simpelweg op de browser-SSH knop in Google Cloud en voer dezelfde commando's uit als bij Oracle (`npm install && npm run build && pm2 start npm -- start`).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: RENDER / PAAS */}
            {hostingPlatformTab === 'render' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-800/40 text-xs text-indigo-200">
                  <strong>Geen Linux/SSH kennis nodig:</strong> Platforms zoals <strong>Render.com</strong> bouwen en starten de applicatie automatisch zodra je code naar GitHub pusht.
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <span className="text-xs font-semibold text-indigo-300">1. Web Service aanmaken op Render.com</span>
                    <p className="text-xs text-slate-400">
                      Maak een gratis account op <a href="https://render.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">render.com</a>, kies <strong>New &rarr; Web Service</strong> en selecteer je GitHub repo met de trading bot.
                    </p>
                    <div className="bg-slate-950 p-2.5 rounded font-mono text-[11px] text-slate-300 space-y-1">
                      <div><strong>Build Command:</strong> <span className="text-cyan-300">npm install && npm run build</span></div>
                      <div><strong>Start Command:</strong> <span className="text-emerald-400">npm start</span></div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <span className="text-xs font-semibold text-amber-300">
                      2. Slaapstand voorkomen (Render Free Spin-Down Trick)
                    </span>
                    <p className="text-xs text-slate-400">
                      De gratis tier van Render gaat na 15 minuten zonder bezoekers in slaapmodus. Om de paper trading bot <strong>24/7 wakker te houden</strong>:
                    </p>
                    <p className="text-xs text-slate-300">
                      Meld je gratis aan bij <a href="https://cron-job.org" target="_blank" rel="noreferrer" className="text-cyan-400 underline">cron-job.org</a> of <a href="https://uptimerobot.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">uptimerobot.com</a> en laat deze elke 5 minuten een HTTP GET ping sturen naar: <code className="text-indigo-300">https://jouw-bot.onrender.com/api/state</code>. Zo blijft de bot 100% actief!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom summary callout */}
            <div className="p-3.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="text-white">Tip voor Paper Trading:</strong> Alle data (`bot_state.json`), openstaande posities en Discord/Slack instellingen worden bewaard.
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Vergeet niet een <strong>Master PIN</strong> in te stellen zodra je dashboard openbaar op internet bereikbaar is!
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 flex-shrink-0">
                <span>Uitgebreid document:</span>
                <code className="text-emerald-400">DEPLOY_ALTERNATIVES.md</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
