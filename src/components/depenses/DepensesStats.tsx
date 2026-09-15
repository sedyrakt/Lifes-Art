// src/components/depenses/DepensesStats.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ DESIGN aligned with KpiCard (dashboard)
// ⭐ LAYOUT: Icon ankavia | Label + Valeur + Variation inline
// ⭐ Hover accent top bar + typography madio
// ⭐ FONT SIZE: label 12px uppercase, valeur 20px, variation 13px
// ⭐ negative = true (Dépenses: positif → mena, négatif → maitso)
// ⭐ FIX: min-h ahena (120px → 95px)

import React from 'react';
import { TrendingDown, TrendingUp, FileText, DollarSign, Building, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface DepensesStatsProps {
  total: number;
  nb: number;
  moyenne: number;
  nbFournisseurs: number;
  totalItems?: number;
  evolutionTotal?: number;
  evolutionNb?: number;
  evolutionMoyenne?: number;
  evolutionFournisseurs?: number;
  refreshing?: boolean;
}

const safeNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

// ⭐ Palette harmonisée (KpiCard-style)
const STAT_ACCENTS = {
  total: {
    iconBg: 'bg-red-50 dark:bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    accent: '#EF4444',
  },
  nb: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accent: '#6366F1',
  },
  moyenne: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: '#10B981',
  },
  fournisseurs: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accent: '#F59E0B',
  },
};

const DepensesStats: React.FC<DepensesStatsProps> = ({
  total, nb, moyenne, nbFournisseurs, totalItems,
  evolutionTotal = 0, evolutionNb = 0, evolutionMoyenne = 0, evolutionFournisseurs = 0,
  refreshing = false
}) => {
  const { isDark } = useTheme();
  const displayNb = totalItems !== undefined ? totalItems : safeNumber(nb);
  const formattedTotal = `${safeNumber(total).toLocaleString('fr-FR')} Ar`;
  const formattedMoyenne = `${safeNumber(moyenne).toLocaleString('fr-FR')} Ar`;

  const stats = [
    {
      key: 'total',
      label: 'Total Dépenses',
      value: formattedTotal,
      evolution: safeNumber(evolutionTotal),
      icon: TrendingDown,
    },
    {
      key: 'nb',
      label: 'Nombre',
      value: displayNb.toLocaleString('fr-FR'),
      evolution: safeNumber(evolutionNb),
      icon: FileText,
    },
    {
      key: 'moyenne',
      label: 'Moyenne',
      value: formattedMoyenne,
      evolution: safeNumber(evolutionMoyenne),
      icon: DollarSign,
    },
    {
      key: 'fournisseurs',
      label: 'Fournisseurs',
      value: safeNumber(nbFournisseurs).toLocaleString('fr-FR'),
      evolution: safeNumber(evolutionFournisseurs),
      icon: Building,
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
          const hasEvolution = stat.evolution !== 0;
          const isPositive = stat.evolution > 0;

          // ⭐ negative = true : dépenses (positif → mena, négatif → maitso)
          const isGood = !isPositive;
          const variationColor = isGood
            ? 'text-emerald-500 dark:text-emerald-400'
            : 'text-red-500 dark:text-red-400';

          return (
            <div
              key={stat.key}
              /* ⭐ FIX: min-h-[120px] → min-h-[95px] */
              className="group relative flex min-h-[95px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors duration-200 hover:border-brand-500/30 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-brand-500/30"
            >
              {/* ⭐ Top accent color amin'ny hover */}
              <div
                className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{ backgroundColor: accent.accent }}
              />

              {/* Header: icon ankavia | label + valeur + variation */}
              <div className="flex min-w-0 items-start gap-3.5">
                {/* Icon : h-10 w-10 (mifanaraka amin'ny KpiCard) */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconColor} transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </div>

                {/* Label + Valeur + Variation */}
                <div className="min-w-0 flex-1">
                  {/* Label : 12px uppercase (mifanaraka amin'ny KpiCard) */}
                  <p className="truncate text-[12px] font-semibold uppercase leading-[1.4] tracking-[0.07em] text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>

                  {/* Valeur : 20px bold (mifanaraka amin'ny KpiCard) */}
                  <p
                    className="mt-0.5 truncate text-[20px] font-bold leading-[1.3] tracking-tight text-slate-900 dark:text-slate-100"
                    title={String(stat.value)}
                  >
                    {stat.value}
                  </p>

                  {/* Variation inline (mifanaraka amin'ny KpiCard) */}
                  {hasEvolution && (
                    <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-[13px] leading-[1.4]">
                      <span className={`inline-flex items-center gap-0.5 font-semibold ${variationColor}`}>
                        {isPositive ? (
                          <TrendingUp size={13} strokeWidth={2.4} />
                        ) : (
                          <TrendingDown size={13} strokeWidth={2.4} />
                        )}
                        {isPositive ? '+' : ''}
                        {stat.evolution.toFixed(1)}%
                      </span>
                      <span className="truncate font-normal text-slate-400 dark:text-slate-500">
                        vs période précédente
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DepensesStats;