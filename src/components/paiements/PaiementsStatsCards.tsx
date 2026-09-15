// ============================================================
// src/components/paiements/PaiementsStatsCards.tsx
// ⭐ VERSION FINALE — 5 KPI (Paiements, Montant total, Avances, Employés, Total DB)
// ⭐ FIX #2 : "Net payé" → "Montant total" (plus clair)
// ⭐ FIX #10 : "Total DB" aseho fotsiny rehefa tsy mitovy amin'ny "Paiements"
// ⭐ DESIGN aligned with dashboard KpiCard
// ⭐ LAYOUT: Icon ankavia | Label uppercase + Valeur 20px
// ⭐ Hover accent top bar + rounded-xl + min-h-[95px]
// ============================================================

import React from 'react';
import { FileClock, CircleDollarSign, Users, CreditCard, Banknote } from 'lucide-react';
import { formatAriary } from '../../utils/paiementUtils';

interface PaiementsStatsCardsProps {
  paiementsCount: number;
  visibleTotal: number;
  visibleEmployees: number;
  statsTotalPaiements: number;
  visibleAdvances?: number;
}

// ⭐ Palette harmonisée (KpiCard-style)
const STAT_ACCENTS = {
  paiements: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accent: '#6366F1',
  },
  montant: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: '#10B981',
  },
  avances: {
    iconBg: 'bg-rose-50 dark:bg-rose-500/10',
    iconColor: 'text-rose-600 dark:text-rose-400',
    accent: '#F43F5E',
  },
  employes: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accent: '#F59E0B',
  },
  totalDb: {
    iconBg: 'bg-sky-50 dark:bg-sky-500/10',
    iconColor: 'text-sky-600 dark:text-sky-400',
    accent: '#0EA5E9',
  },
};

// ⭐ StatCard aligned with dashboard KpiCard
const StatCard = ({
  icon,
  label,
  value,
  accentKey,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accentKey: keyof typeof STAT_ACCENTS;
}) => {
  const accent = STAT_ACCENTS[accentKey];

  return (
    <div className="group relative flex min-h-[95px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors duration-200 hover:border-brand-500/30 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-brand-500/30">
      {/* ⭐ Top accent color amin'ny hover */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ backgroundColor: accent.accent }}
      />

      {/* Header: icon ankavia | label + valeur */}
      <div className="flex min-w-0 items-start gap-3.5">
        {/* Icon : h-10 w-10 */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconColor} transition-transform duration-200 group-hover:scale-105`}
        >
          {icon}
        </div>

        {/* Label + Valeur */}
        <div className="min-w-0 flex-1">
          {/* Label : 12px uppercase */}
          <p className="truncate text-[12px] font-semibold uppercase leading-[1.4] tracking-[0.07em] text-slate-500 dark:text-slate-400">
            {label}
          </p>

          {/* Valeur : 20px bold */}
          <p
            className="mt-1 truncate text-[20px] font-bold leading-[1.3] tracking-tight text-slate-900 dark:text-slate-100"
            title={String(value)}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export function PaiementsStatsCards({
  paiementsCount,
  visibleTotal,
  visibleEmployees,
  statsTotalPaiements,
  visibleAdvances = 0,
}: PaiementsStatsCardsProps) {
  // ⭐ FIX #10 : Aseho "Total DB" fotsiny rehefa samy hafa
  const showTotalDb = Number(statsTotalPaiements) !== Number(paiementsCount);

  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${showTotalDb ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
      <StatCard
        label="Paiements"
        value={Number(paiementsCount || 0).toLocaleString('fr-FR')}
        icon={<FileClock size={20} strokeWidth={2.2} />}
        accentKey="paiements"
      />

      {/* ⭐ FIX #2 : Label "Montant total" (au lieu de "Net payé") */}
      <StatCard
        label="Montant total"
        value={formatAriary(visibleTotal)}
        icon={<CircleDollarSign size={20} strokeWidth={2.2} />}
        accentKey="montant"
      />

      <StatCard
        label="Avances"
        value={formatAriary(visibleAdvances)}
        icon={<Banknote size={20} strokeWidth={2.2} />}
        accentKey="avances"
      />

      <StatCard
        label="Employés"
        value={Number(visibleEmployees || 0).toLocaleString('fr-FR')}
        icon={<Users size={20} strokeWidth={2.2} />}
        accentKey="employes"
      />

      {/* ⭐ FIX #10 : Asého fotsiny raha tsy mitovy amin'ny "Paiements" */}
      {showTotalDb && (
        <StatCard
          label="Total enregistrés"
          value={Number(statsTotalPaiements || 0).toLocaleString('fr-FR')}
          icon={<CreditCard size={20} strokeWidth={2.2} />}
          accentKey="totalDb"
        />
      )}
    </div>
  );
}