// src/components/achats/AchatsStats.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ DESIGN aligned with KpiCard (dashboard)
// ⭐ LAYOUT: Icon ankavia | Label + Valeur inline
// ⭐ Hover accent top bar + typography madio
// ⭐ FONT SIZE: label 12px uppercase, valeur 20px, icon 20px
// ⭐ HEIGHT: min-h-[95px] compact

import React from 'react';
import { Package, Wallet, Users, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface AchatsStatsProps {
  total: number;
  totalMontant: number;
  totalFournisseurs: number;
  nonPayes: number;
  refreshing?: boolean;
}

const safeNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

// ⭐ Palette harmonisée (KpiCard-style)
const STAT_ACCENTS = {
  total: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accent: '#6366F1',
  },
  montant: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: '#10B981',
  },
  fournisseurs: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accent: '#F59E0B',
  },
  nonPayes: {
    iconBg: 'bg-red-50 dark:bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    accent: '#EF4444',
  },
};

const AchatsStats: React.FC<AchatsStatsProps> = ({
  total, totalMontant, totalFournisseurs, nonPayes, refreshing = false,
}) => {
  const { isDark } = useTheme();

  const stats = [
    {
      key: 'total',
      label: 'Total achats',
      value: safeNumber(total).toLocaleString('fr-FR'),
      icon: Package,
    },
    {
      key: 'montant',
      label: 'Montant total',
      value: `${safeNumber(totalMontant).toLocaleString('fr-FR')} Ar`,
      icon: Wallet,
    },
    {
      key: 'fournisseurs',
      label: 'Fournisseurs',
      value: safeNumber(totalFournisseurs).toLocaleString('fr-FR'),
      icon: Users,
    },
    {
      key: 'nonPayes',
      label: 'Non payés',
      value: safeNumber(nonPayes).toLocaleString('fr-FR'),
      icon: AlertCircle,
    },
  ];

  return (
    <div className="relative mb-4">
      {/* ⭐ Refreshing badge (top-right) */}
      {refreshing && (
        <div className={`absolute right-0 top-0 z-10 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 shadow-sm animate-pulse ${
          isDark
            ? 'border-white/[0.12] bg-[#0F172A] text-brand-400'
            : 'border-slate-200 bg-white text-brand-600'
        }`}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          <span className="text-[12px] font-semibold uppercase tracking-wider">Mise à jour...</span>
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const accent = STAT_ACCENTS[stat.key as keyof typeof STAT_ACCENTS];

          return (
            <div
              key={stat.key}
              className="group relative flex min-h-[95px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors duration-200 hover:border-brand-500/30 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-brand-500/30"
            >
              {/* ⭐ Top accent color amin'ny hover */}
              <div
                className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{ backgroundColor: accent.accent }}
              />

              {/* Header: icon ankavia | label + valeur */}
              <div className="flex min-w-0 items-start gap-3.5">
                {/* Icon : h-10 w-10 (mifanaraka amin'ny KpiCard) */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconColor} transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </div>

                {/* Label + Valeur */}
                <div className="min-w-0 flex-1">
                  {/* Label : 12px uppercase (mifanaraka amin'ny KpiCard) */}
                  <p className="truncate text-[12px] font-semibold uppercase leading-[1.4] tracking-[0.07em] text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>

                  {/* Valeur : 20px bold (mifanaraka amin'ny KpiCard) */}
                  <p
                    className="mt-1 truncate text-[20px] font-bold leading-[1.3] tracking-tight text-slate-900 dark:text-slate-100"
                    title={String(stat.value)}
                  >
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchatsStats;