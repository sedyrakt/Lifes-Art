// src/components/dashboard/Sparkline.tsx
import React, { useId, useMemo } from 'react';
import { safeNumber } from './utils/variation';

export function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  const smoothing = 0.22;
  let path = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) * smoothing;
    const cp1y = p1.y + (p2.y - p0.y) * smoothing;
    const cp2x = p2.x - (p3.x - p1.x) * smoothing;
    const cp2y = p2.y - (p3.y - p1.y) * smoothing;

    path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  return path;
}

export function buildPattern(seed: number): number[] {
  const points = 16;
  const values: number[] = [];
  const startLevel = 0.20 + (seed % 4) * 0.05;
  const endLevel = 0.75 + (seed % 3) * 0.08;
  const oscillations = 3 + (seed % 4);
  const oscillationAmp = 0.10 + (seed % 3) * 0.02;
  const finalBoost = 0.06 + (seed % 3) * 0.02;
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const trend = startLevel + (endLevel - startLevel) * t;
    const phase = seed * 0.7;
    const osc1 = Math.sin(t * Math.PI * oscillations + phase) * oscillationAmp;
    const osc2 = Math.cos(t * Math.PI * oscillations * 1.7 + phase * 1.3) * (oscillationAmp * 0.5);
    const finalSpike = t > 0.7 ? Math.pow((t - 0.7) / 0.3, 1.6) * finalBoost : 0;
    const noiseValue = Math.sin((i + seed) * 12.9898) * 0.025;
    const value = trend + osc1 + osc2 + finalSpike + noiseValue;
    values.push(Math.max(0.05, Math.min(1, value)));
  }
  return values;
}

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color = '#6366F1', height = 26 }) => {
  const rawId = useId();
  const gradientId = useMemo(() => `spark-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [rawId]);

  const values = useMemo(() => {
    const safe = Array.isArray(data) && data.length > 0 ? data.map(safeNumber) : [0];
    const allSame = safe.every((v) => v === safe[0]);
    if (safe.length < 2 || allSame) return buildPattern(3);
    if (safe.length >= 12) return safe;
    const extended = [...safe];
    while (extended.length < 12) {
      const last = extended[extended.length - 1] ?? 0;
      const prev = extended[extended.length - 2] ?? last;
      extended.push((last + prev) / 2);
    }
    return extended;
  }, [data]);

  const width = 220;
  const paddingY = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * width,
    y: height - paddingY - ((value - min) / range) * (height - paddingY * 2),
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="60%" stopColor={color} stopOpacity="0.10" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};