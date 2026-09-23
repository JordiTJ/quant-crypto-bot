import React, { useState } from 'react';

interface EquityPoint {
  timestamp: number;
  equity: number;
  drawdown: number;
  benchmarkBtc: number;
}

interface EquityChartProps {
  data: EquityPoint[];
  height?: number;
}

export const EquityChart: React.FC<EquityChartProps> = ({ data, height = 300 }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center bg-slate-900/60 rounded border border-slate-800 text-slate-500 text-xs">
        No equity curve data available.
      </div>
    );
  }

  const width = 800;
  const paddingLeft = 10;
  const paddingRight = 70;
  const chartWidth = width - paddingLeft - paddingRight;

  const mainHeight = height * 0.70;
  const ddHeight = height * 0.22;
  const ddTop = mainHeight + 15;

  let minVal = Infinity;
  let maxVal = -Infinity;
  let maxDd = 0;

  data.forEach(d => {
    if (d.equity < minVal) minVal = d.equity;
    if (d.benchmarkBtc < minVal) minVal = d.benchmarkBtc;
    if (d.equity > maxVal) maxVal = d.equity;
    if (d.benchmarkBtc > maxVal) maxVal = d.benchmarkBtc;
    if (d.drawdown > maxDd) maxDd = d.drawdown;
  });

  const valPadding = (maxVal - minVal) * 0.08;
  const chartMin = Math.max(0, minVal - valPadding);
  const chartMax = maxVal + valPadding;
  const valRange = chartMax - chartMin || 1;
  const ddRange = Math.max(5, maxDd * 1.15);

  const getY = (val: number) => {
    return mainHeight - ((val - chartMin) / valRange) * mainHeight;
  };

  const getDdY = (dd: number) => {
    return ddTop + (dd / ddRange) * ddHeight;
  };

  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
  };

  const activePoint = hoverIdx !== null ? data[hoverIdx] : data[data.length - 1];

  // Path generators
  const equityPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.equity)}`).join(' ');
  const btcPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.benchmarkBtc)}`).join(' ');
  const ddAreaPath = `${data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getDdY(d.drawdown)}`).join(' ')} L ${getX(data.length - 1)} ${ddTop} L ${getX(0)} ${ddTop} Z`;

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 font-sans shadow-inner select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-100">Performance Attribution</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {activePoint ? new Date(activePoint.timestamp).toLocaleDateString() : ''}
          </span>
        </div>

        {activePoint && (
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Strategy: ${activePoint.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              BTC Benchmark: ${activePoint.benchmarkBtc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Drawdown: -{activePoint.drawdown.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto cursor-crosshair"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * width;
          if (x >= paddingLeft && x <= width - paddingRight) {
            const idx = Math.round(((x - paddingLeft) / chartWidth) * (data.length - 1));
            if (idx >= 0 && idx < data.length) {
              setHoverIdx(idx);
            }
          }
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((pct, idx) => {
          const y = mainHeight * pct;
          const val = chartMax - pct * valRange;
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
              <text x={width - paddingRight + 6} y={y + 3} fill="#64748b" fontSize="9" fontFamily="monospace">
                ${val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* BTC Benchmark Curve */}
        <path d={btcPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.75" />

        {/* Strategy Equity Curve */}
        <path d={equityPath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

        {/* Underwater Drawdown Chart */}
        <line x1={paddingLeft} y1={ddTop} x2={width - paddingRight} y2={ddTop} stroke="#334155" />
        <path d={ddAreaPath} fill="#f43f5e" opacity="0.25" />
        <path
          d={data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getDdY(d.drawdown)}`).join(' ')}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="1.2"
        />
        <text x={width - paddingRight + 6} y={ddTop + 10} fill="#f43f5e" fontSize="9" fontFamily="monospace">
          0% DD
        </text>
        <text x={width - paddingRight + 6} y={ddTop + ddHeight} fill="#f43f5e" fontSize="9" fontFamily="monospace">
          -{maxDd.toFixed(0)}%
        </text>

        {/* Hover Crosshair & Dots */}
        {hoverIdx !== null && (
          <g>
            <line x1={getX(hoverIdx)} y1={0} x2={getX(hoverIdx)} y2={height} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={getX(hoverIdx)} cy={getY(data[hoverIdx].equity)} r="4" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx={getX(hoverIdx)} cy={getY(data[hoverIdx].benchmarkBtc)} r="3" fill="#f59e0b" />
          </g>
        )}
      </svg>
    </div>
  );
};
