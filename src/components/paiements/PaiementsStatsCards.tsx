import React from 'react';
import { FileClock, CircleDollarSign, Users, CreditCard } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { formatAriary } from '../../utils/paiementUtils';

interface PaiementsStatsCardsProps {
  paiementsCount: number;
  visibleTotal: number;
  visibleEmployees: number;
  statsTotalPaiements: number;
}

export function PaiementsStatsCards({ paiementsCount, visibleTotal, visibleEmployees, statsTotalPaiements }: PaiementsStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard label="Paiements" value={paiementsCount} icon={<FileClock size={16} />} colorClass="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" />
      <KpiCard label="Montant affiché" value={formatAriary(visibleTotal)} icon={<CircleDollarSign size={16} />} colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
      <KpiCard label="Employés" value={visibleEmployees} icon={<Users size={16} />} colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
      <KpiCard label="Total DB" value={statsTotalPaiements} icon={<CreditCard size={16} />} colorClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400" />
    </div>
  );
}