import React, { useState, useMemo } from 'react';
import { Candle, IndicatorSet } from '../types';
import { IndicatorEngine } from '../indicators/engine';

interface InteractiveChartProps {
  symbol: string;
  candles: Candle[];
  height?: number;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  symbol,
  candles,
  height = 360
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Compute indicators across all candles for continuous line plotting
  const { ema21, ema50, bbUpper, bbLower, supertrend, volumes } = useMemo(() => {
    if (candles.length < 20) {
      return { 
        ema21: [], 
        ema50: [], 
        bbUpper: [], 
        bbLower: [], 
        supertrend: { value: [] as number[], direction: [] as ('BULL' | 'BEAR')[] }, 
        volumes: [] 
      };
    }
    const closes = candles.map(c => c.close);
    const e21 = IndicatorEngine.calculateEMA(closes, 21);
    const e50 = IndicatorEngine.calculateEMA(closes, 50);
    const bb = IndicatorEngine.calculateBollingerBands(closes, 20, 2.0);
    const st = IndicatorEngine.calculateSuperTrend(candles, 10, 3.0);
    const vols = candles.map(c => c.volume);
    return {
      ema21: e21,
      ema50: e50,
      bbUpper: bb.upper,
      bbLower: bb.lower,
      supertrend: st,
      volumes: vols
    };
  }, [candles]);

  if (!candles || candles.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-900/60 rounded border border-slate-800 text-slate-500 text-xs">
        No candle data available.
      </div>
    );
  }

  // Slicing last 80 candles for clean density
  const displaySlice = candles.slice(-70);
  const offset = candles.length - displaySlice.length;

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let maxVolume = 0;

  displaySlice.forEach(c => {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
    if (c.volume > maxVolume) maxVolume = c.volume;
  });

  const pricePadding = (maxPrice - minPrice) * 0.08;
  const chartMin = Math.max(0, minPrice - pricePadding);
  const chartMax = maxPrice + pricePadding;
  const priceRange = chartMax - chartMin || 1;

  const width = 800;
  const paddingLeft = 10;
  const paddingRight = 65;
  const chartWidth = width - paddingLeft - paddingRight;

  const mainHeight = height * 0.75;
  const volumeHeight = height * 0.20;
  const volumeTop = mainHeight + 10;

  const getY = (val: number) => {
    return mainHeight - ((val - chartMin) / priceRange) * mainHeight;
  };

  const getVolY = (vol: number) => {
    const ratio = maxVolume === 0 ? 0 : vol / maxVolume;
    return height - ratio * volumeHeight;
  };

  const candleSpacing = chartWidth / displaySlice.length;
  const candleBodyWidth = Math.max(2, candleSpacing * 0.65);

  const activeCandle = hoverIndex !== null ? displaySlice[hoverIndex] : displaySlice[displaySlice.length - 1];
  const activeIdx = hoverIndex !== null ? hoverIndex + offset : candles.length - 1;

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 font-sans shadow-inner select-none">
      {/* Chart Legend / Active Candle Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-100">{symbol}</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {activeCandle ? new Date(activeCandle.timestamp).toLocaleString() : ''}
          </span>
        </div>

        {activeCandle && (
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
            <div>O: <span className="text-slate-200">{activeCandle.open}</span></div>
            <div>H: <span className="text-slate-200">{activeCandle.high}</span></div>
            <div>L: <span className="text-slate-200">{activeCandle.low}</span></div>
            <div>C: <span className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>{activeCandle.close}</span></div>
            <div className="hidden sm:block">Vol: <span className="text-cyan-300">{activeCandle.volume.toFixed(1)}</span></div>
          </div>
        )}

        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> EMA21: {ema21[activeIdx]?.toFixed(2) || '-'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> EMA50: {ema50[activeIdx]?.toFixed(2) || '-'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> SuperTrend
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * width;
            if (x >= paddingLeft && x <= width - paddingRight) {
              const idx = Math.floor((x - paddingLeft) / candleSpacing);
              if (idx >= 0 && idx < displaySlice.length) {
                setHoverIndex(idx);
              }
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = mainHeight * pct;
            const price = chartMax - pct * priceRange;
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={width - paddingRight + 6} y={y + 3} fill="#64748b" fontSize="9" fontFamily="monospace">
                  {price.toFixed(price > 100 ? 1 : 3)}
                </text>
              </g>
            );
          })}

          {/* Volume Baseline Grid */}
          <line x1={paddingLeft} y1={volumeTop} x2={width - paddingRight} y2={volumeTop} stroke="#1e293b" />

          {/* Bollinger Band Shaded Area & Lines */}
          {bbUpper.length > 0 && bbLower.length > 0 && (
            <>
              <path
                d={displaySlice.map((_, i) => {
                  const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
                  const idx = i + offset;
                  const y = getY(bbUpper[idx] || displaySlice[i].high);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />
              <path
                d={displaySlice.map((_, i) => {
                  const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
                  const idx = i + offset;
                  const y = getY(bbLower[idx] || displaySlice[i].low);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />
            </>
          )}

          {/* Volume Bars */}
          {displaySlice.map((c, i) => {
            const x = paddingLeft + i * candleSpacing + (candleSpacing - candleBodyWidth) / 2;
            const y = getVolY(c.volume);
            const isBull = c.close >= c.open;
            return (
              <rect
                key={`vol_${i}`}
                x={x}
                y={y}
                width={candleBodyWidth}
                height={Math.max(1, height - y)}
                fill={isBull ? '#10b981' : '#f43f5e'}
                opacity="0.35"
              />
            );
          })}

          {/* Candlesticks (Wick & Body) */}
          {displaySlice.map((c, i) => {
            const xCenter = paddingLeft + i * candleSpacing + candleSpacing / 2;
            const xBox = xCenter - candleBodyWidth / 2;
            const yHigh = getY(c.high);
            const yLow = getY(c.low);
            const yOpen = getY(c.open);
            const yClose = getY(c.close);

            const isBull = c.close >= c.open;
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
            const color = isBull ? '#10b981' : '#f43f5e';

            return (
              <g key={`candle_${i}`}>
                {/* Wick */}
                <line x1={xCenter} y1={yHigh} x2={xCenter} y2={yLow} stroke={color} strokeWidth="1" />
                {/* Body */}
                <rect
                  x={xBox}
                  y={bodyTop}
                  width={candleBodyWidth}
                  height={bodyHeight}
                  fill={isBull ? '#064e3b' : '#881337'}
                  stroke={color}
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* EMA 21 Line */}
          {ema21.length > 0 && (
            <path
              d={displaySlice.map((_, i) => {
                const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
                const idx = i + offset;
                const y = getY(ema21[idx] || displaySlice[i].close);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.5"
            />
          )}

          {/* EMA 50 Line */}
          {ema50.length > 0 && (
            <path
              d={displaySlice.map((_, i) => {
                const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
                const idx = i + offset;
                const y = getY(ema50[idx] || displaySlice[i].close);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
          )}

          {/* SuperTrend Line */}
          {supertrend.value && supertrend.value.length > 0 && (
            displaySlice.map((c, i) => {
              if (i === 0) return null;
              const x1 = paddingLeft + (i - 1) * candleSpacing + candleSpacing / 2;
              const x2 = paddingLeft + i * candleSpacing + candleSpacing / 2;
              const idx1 = (i - 1) + offset;
              const idx2 = i + offset;
              const y1 = getY(supertrend.value[idx1] || c.close);
              const y2 = getY(supertrend.value[idx2] || c.close);
              const isBull = supertrend.direction[idx2] === 'BULL';
              return (
                <line
                  key={`st_${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isBull ? '#10b981' : '#f43f5e'}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              );
            })
          )}

          {/* Crosshair on Hover */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={paddingLeft + hoverIndex * candleSpacing + candleSpacing / 2}
                y1={0}
                x2={paddingLeft + hoverIndex * candleSpacing + candleSpacing / 2}
                y2={height}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingLeft}
                y1={getY(displaySlice[hoverIndex].close)}
                x2={width - paddingRight}
                y2={getY(displaySlice[hoverIndex].close)}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
