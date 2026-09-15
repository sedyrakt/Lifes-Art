// src/components/dashboard/hooks/useDashboardCharts.ts
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: "Frais supplémentaires" ho an'ny différence CA - doughnut
// ⭐ FIX: Nofafana ny centerPlugin (HTML overlay no ampiasaina)
// ⭐ PERF: Nampihena ny animation, stable references

import { useMemo } from 'react';
import { safeNumber } from '../utils/variation';
import { formatAriary } from '../utils/formatters';
import type { ChartItem } from '../types';

interface Params {
  isDark: boolean;
  chiffreAffaires: number;
  ventesParMois: ChartItem[];
  categorieRepartition: ChartItem[];
}

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const formatXAxisLabel = (rawLabel: string): string => {
  if (!rawLabel) return '';
  const isoMatch = String(rawLabel).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, , m, d] = isoMatch;
    const day = String(Number(d)).padStart(2, '0');
    const month = MONTHS_SHORT[Number(m) - 1] || '';
    return `${day} ${month}`;
  }
  return rawLabel;
};

const formatYAxisLabel = (value: number): string => {
  const num = Math.abs(Number(value));
  if (num === 0) return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}G`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return `${num}`;
};

// ⭐ PERF: static colors ivelan'ny hook mba tsy mamerina mamorona array
const DOUGHNUT_COLORS = [
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#64748B', // Slate
];

export const useDashboardCharts = ({ isDark, chiffreAffaires, ventesParMois, categorieRepartition }: Params) => {
  // ═══════════ Revenue trend ═══════════
  const revenueTrend = useMemo(() => {
    return ventesParMois.map((item: ChartItem, index: number) => {
      const monthIndex = Number(item.mois) - 1;
      const rawLabel = item.label || item.date || (monthIndex >= 0 && monthIndex < 12 ? MONTHS_SHORT[monthIndex] : `P${index + 1}`);
      return {
        label: rawLabel,
        displayLabel: formatXAxisLabel(rawLabel),
        value: safeNumber(item.total_ventes ?? item.total),
      };
    });
  }, [ventesParMois]);

  const isSinglePoint = revenueTrend.length <= 1;

  // ═══════════ Line data ═══════════
  const lineData = useMemo(() => {
    const chartLabels = isSinglePoint && revenueTrend.length === 1
      ? ['', revenueTrend[0].displayLabel]
      : revenueTrend.map((item) => item.displayLabel);

    const chartValues = isSinglePoint && revenueTrend.length === 1
      ? [revenueTrend[0].value, revenueTrend[0].value]
      : revenueTrend.map((item) => item.value);

    return {
      labels: chartLabels,
      datasets: [{
        label: "Chiffre d'affaires",
        data: chartValues,
        borderColor: '#818CF8',
        borderWidth: 2.5,
        pointRadius: isSinglePoint ? [0, 6] : 4,
        pointHoverRadius: isSinglePoint ? [0, 8] : 7,
        pointBackgroundColor: '#818CF8',
        pointBorderColor: isDark ? '#0F172A' : '#FFFFFF',
        pointBorderWidth: 2,
        pointHitRadius: 20,
        showLine: true,
        tension: isSinglePoint ? 0 : 0.4,
        fill: true,
        backgroundColor: (context: any) => {
          const chart = context?.chart;
          const chartArea = chart?.chartArea;
          if (!chartArea) return 'rgba(129,140,248,0.10)';
          const gradient = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(129,140,248,0.40)');
          gradient.addColorStop(0.5, 'rgba(129,140,248,0.15)');
          gradient.addColorStop(1, 'rgba(129,140,248,0)');
          return gradient;
        },
      }],
    };
  }, [revenueTrend, isDark, isSinglePoint]);

  // ═══════════ Tooltip colors ═══════════
  const tooltipColors = useMemo(() => ({
    bg: isDark ? '#1E293B' : '#FFFFFF',
    title: isDark ? '#F8FAFC' : '#0F172A',
    body: isDark ? '#F8FAFC' : '#4F46E5',
    border: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)',
  }), [isDark]);

  // ═══════════ Line options ═══════════
  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    // ⭐ PERF: Nampihena ny animation duration
    animation: { duration: 400, easing: 'easeOutQuart' as const },
    // ⭐ PERF: manakana ny hover raha tsy mila
    hover: { mode: 'nearest' as const, intersect: true },
    interaction: {
      intersect: true,
      mode: 'nearest' as const,
    },
    layout: {
      padding: { top: 4, bottom: 4, left: 8, right: 8 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        z: 9999,
        titleMarginBottom: 10,
        padding: 12,
        boxPadding: 6,
        backgroundColor: tooltipColors.bg,
        titleColor: tooltipColors.title,
        bodyColor: tooltipColors.body,
        borderColor: tooltipColors.border,
        borderWidth: 1,
        displayColors: false,
        titleFont: { size: 12.5, weight: '600' as const },
        bodyFont: { size: 13.5, weight: '600' as const },
        callbacks: {
          title: (items: any[]) => items?.[0]?.label || '',
          label: (context: any) => ` ${formatAriary(context?.parsed?.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: isDark ? '#71809A' : '#94A3B8',
          font: { size: 11 },
          maxTicksLimit: 8,
          padding: 8,
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: {
          color: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0',
          drawBorder: false,
        },
        ticks: {
          color: isDark ? '#71809A' : '#94A3B8',
          font: { size: 11 },
          padding: 12,
          maxTicksLimit: 6,
          callback: (value: any) => formatYAxisLabel(Number(value)),
        },
      },
    },
  }), [isDark, tooltipColors]);

  // ═══════════ Sales distribution ═══════════
  const salesDist = useMemo(() => {
    const ca = safeNumber(chiffreAffaires);

    if (categorieRepartition.length === 0) {
      if (ca > 0) {
        return {
          data: [{ label: 'Frais supplémentaires', value: ca }],
          total: ca,
        };
      }
      return { data: [], total: 0 };
    }

    const formatted = categorieRepartition
      .map((item: ChartItem) => ({
        label: item.nom || item.categorie || 'Catégorie',
        value: safeNumber(item.total_ventes ?? item.total),
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    if (formatted.length === 0) {
      if (ca > 0) {
        return {
          data: [{ label: 'Frais supplémentaires', value: ca }],
          total: ca,
        };
      }
      return { data: [], total: 0 };
    }

    const categoriesTotal = formatted.reduce((sum, item) => sum + item.value, 0);

    const maxCategories = 6;
    let result = [...formatted];
    if (formatted.length > maxCategories) {
      const top = formatted.slice(0, maxCategories - 1);
      const others = formatted.slice(maxCategories - 1).reduce((sum, item) => sum + item.value, 0);
      if (others > 0) top.push({ label: 'Autres', value: others });
      result = top;
    }

    const finalTotal = ca > 0 ? ca : categoriesTotal;
    const difference = finalTotal - categoriesTotal;

    if (difference > 1) {
      result.push({ label: 'Frais supplémentaires', value: difference });
    }

    return { data: result, total: finalTotal };
  }, [categorieRepartition, chiffreAffaires]);

  // ═══════════ Doughnut data ═══════════
  const doughnutData = useMemo(() => ({
    labels: salesDist.data.map((item) => item.label),
    datasets: [{
      data: salesDist.data.map((item) => item.value),
      backgroundColor: DOUGHNUT_COLORS.slice(0, Math.max(salesDist.data.length, 1)),
      borderColor: 'transparent',
      borderWidth: 0,
      spacing: 0,
      hoverOffset: 10,
    }],
  }), [salesDist.data]);

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    // ⭐ PERF: Nampihena ny animation duration
    animation: { duration: 400, easing: 'easeOutQuart' as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        z: 9999,
        titleMarginBottom: 10,
        padding: 12,
        boxPadding: 6,
        backgroundColor: tooltipColors.bg,
        titleColor: tooltipColors.title,
        bodyColor: tooltipColors.body,
        borderColor: tooltipColors.border,
        borderWidth: 1,
        displayColors: false,
        titleFont: { size: 12.5, weight: '600' as const },
        bodyFont: { size: 13, weight: '600' as const },
        callbacks: {
          label: (context: any) => {
            const total = salesDist.total;
            const value = safeNumber(context?.parsed);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return ` ${formatAriary(value)} — ${percentage}%`;
          },
        },
      },
    },
  }), [salesDist.total, tooltipColors]);

  return {
    revenueTrend,
    lineData, lineOptions,
    salesDist, doughnutData, doughnutOptions,
    doughnutColors: DOUGHNUT_COLORS,
  };
};