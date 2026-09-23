import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Clock
} from 'lucide-react';
import { SystemLog } from '../types';

interface LogsViewProps {
  logs: SystemLog[];
  onRefresh: () => void;
}

export const LogsView: React.FC<LogsViewProps> = ({ logs, onRefresh }) => {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(l => {
    const matchLevel = levelFilter === 'ALL' || l.level === levelFilter;
    const matchSearch = l.message.toLowerCase().includes(searchTerm.toLowerCase()) || l.module.toLowerCase().includes(searchTerm.toLowerCase());
    return matchLevel && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              System Event & Execution Audit Stream
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic logging of state transitions, risk circuit assessments, order lifecycle events, and exchange API responses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="ALL">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="TRADE">TRADE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Terminal-Style Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs shadow-inner overflow-hidden">
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No matching log records found.
            </div>
          ) : (
            filteredLogs.map(l => {
              const isTrade = l.level === 'TRADE';
              const isError = l.level === 'ERROR';
              const isWarn = l.level === 'WARN';

              return (
                <div
                  key={l.id}
                  className="flex items-start gap-3 py-1.5 px-2 rounded hover:bg-slate-900/60 transition border-b border-slate-900/40"
                >
                  <span className="text-slate-500 whitespace-nowrap text-[11px]">
                    {new Date(l.timestamp).toLocaleTimeString()}
                  </span>

                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isError
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : isWarn
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : isTrade
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-cyan-300'
                  }`}>
                    {l.level}
                  </span>

                  <span className="text-slate-400 font-semibold uppercase text-[11px]">
                    [{l.module}]
                  </span>

                  <span className="text-slate-200 flex-1">
                    {l.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
