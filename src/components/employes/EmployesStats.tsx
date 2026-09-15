// src/components/employes/EmployesStats.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ DESIGN aligned with KpiCard (dashboard)
// ⭐ LAYOUT: Icon ankavia | Label + Valeur inline
// ⭐ Hover accent top bar + typography madio
// ⭐ FONT SIZE: label 12px uppercase, valeur 20px, icon 20px

import React from 'react';
import { Users, Wallet, UserCheck, TrendingUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface EmployesStatsProps {
  totalItems: number;
  totalSalaire: number;
  actifs: number;
  tauxActif: number;
  evolutionTotal?: number;
  evolutionSalaire?: number;
  evolutionActifs?: number;
  evolutionTaux?: number;
}

const safeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// ⭐ Palette harmonisée (KpiCard-style)
const STAT_ACCENTS = {
  total: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accent: '#6366F1',
  },
  salaire: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: '#10B981',
  },
  actifs: {
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    accent: '#3B82F6',
  },
  taux: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accent: '#F59E0B',
  },
};

const EmployesStats: React.FC<EmployesStatsProps> = ({
  totalItems,
  totalSalaire,
  actifs,
  tauxActif,
  evolutionTotal = 0,
  evolutionSalaire = 0,
  evolutionActifs = 0,
  evolutionTaux = 0
}) => {
  const { isDark } = useTheme();
  const safeTotalItems = safeNumber(totalItems);
  const safeTotalSalaire = safeNumber(totalSalaire);
  const safeActifs = safeNumber(actifs);
  const safeTauxActif = safeNumber(tauxActif);

  const formattedSalaire = `${safeTotalSalaire.toLocaleString('fr-FR')} Ar`;

  const stats = [
    {
      key: 'total',
      label: 'Total employés',
      value: safeTotalItems.toLocaleString('fr-FR'),
      icon: Users,
    },
    {
      key: 'salaire',
      label: 'Masse salariale',
      value: formattedSalaire,
      icon: Wallet,
    },
    {
      key: 'actifs',
      label: 'Employés actifs',
      value: safeActifs.toLocaleString('fr-FR'),
      icon: UserCheck,
    },
    {
      key: 'taux',
      label: "Taux d'activité",
      value: `${safeTauxActif.toFixed(2)}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const accent = STAT_ACCENTS[stat.key as keyof typeof STAT_ACCENTS];

        return (
          <div
            key={stat.key}
            className="group relative flex min-h-[100px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-colors duration-200 hover:border-brand-500/30 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-brand-500/30"
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
                <p className="truncate text-[12px] font-semibold uppercase leading-[1.5] tracking-[0.07em] text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>

                {/* Valeur : 20px bold (mifanaraka amin'ny KpiCard) */}
                <p
                  className="mt-1 truncate text-[20px] font-bold leading-[1.5] tracking-tight text-slate-900 dark:text-slate-100"
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
  );
};

export default EmployesStats;