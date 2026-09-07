

import React from 'react';
import { Loader2, ArrowUpRight, ArrowDownRight, FileText, DollarSign, Package, Wallet } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface CommandesStatsProps {
  total: number;
  totalCA: number;
  totalItems?: number;
  evolutionTotal?: number;
  evolutionCA?: number;
  evolutionItems?: number;

  totalDette?: number;
  nbCommandesNonPayees?: number;
  evolutionDette?: number;

  refreshing?: boolean;
}

const safeNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const CommandesStats: React.FC<CommandesStatsProps> = ({
  total,
  totalCA,
  totalItems = 0,
  evolutionTotal = 0,
  evolutionCA = 0,
  evolutionItems = 0,

  totalDette = 0,
  nbCommandesNonPayees = 0,
  evolutionDette = 0,

  refreshing = false,
}) => {
  const { isDark } = useTheme();

  const formattedCA = `${safeNumber(totalCA).toLocaleString('fr-FR')} Ar`;
  const formattedDette = `${safeNumber(totalDette).toLocaleString('fr-FR')} Ar`;
  const totalNonPayees = safeNumber(nbCommandesNonPayees).toLocaleString('fr-FR');
  const hasNonPayees = nbCommandesNonPayees > 0;

  const stats = [
    {
      label: 'Total commandes',
      value: safeNumber(total).toLocaleString('fr-FR'),
      evolution: safeNumber(evolutionTotal),
      badge: null,
      danger: false,
      icon: <FileText size={16} />,
      colorClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
    },
    {
      label: 'CA total',
      value: formattedCA,
      evolution: safeNumber(evolutionCA),
      badge: null,
      danger: false,
      icon: <DollarSign size={16} />,
      colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    },
    {
      label: 'Articles vendus',
      value: safeNumber(totalItems).toLocaleString('fr-FR'),
      evolution: safeNumber(evolutionItems),
      badge: null,
      danger: false,
      icon: <Package size={16} />,
      colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
    },
    {
      label: 'Dette Clients',
      value: formattedDette,
      evolution: safeNumber(evolutionDette),
      badge: hasNonPayees ? `${totalNonPayees} non payée(s)` : null,
      danger: hasNonPayees,
      icon: <Wallet size={16} />,
      colorClass: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
    },
  ];

  return (
    <div className="relative mb-5 w-full">
      {refreshing && (
        <div className="absolute right-0 top-0 z-20 flex items-center gap-1.5 rounded-lg border border-brand-500/20 bg-white px-2.5 py-1.5 text-brand-600 shadow-sm dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-brand-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Mise à jour...</span>
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const hasEvolution = stat.evolution !== 0;
          const isPositive = stat.evolution > 0;

          return (
            <div
              key={stat.label}
              className="group relative min-h-[80px] rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(79,70,229,0.03)] transition-all duration-200 hover:border-brand-500/30 hover:bg-slate-50 hover:shadow-[0_2px_6px_rgba(79,70,229,0.05)] ring-1 ring-transparent hover:ring-brand-500/20 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-white/[0.18] dark:hover:bg-slate-800 dark:hover:shadow-none flex items-center gap-3"
            >
              <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-brand-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.colorClass}`}>
                {stat.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </span>

                  {hasEvolution && (
                    <span
                      className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                        isPositive
                          ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                          : 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight size={11} strokeWidth={2.5} />
                      ) : (
                        <ArrowDownRight size={11} strokeWidth={2.5} />
                      )}
                      {Math.abs(stat.evolution).toFixed(1)}%
                    </span>
                  )}
                </div>

                <div className="mt-0.5 truncate text-[14px] font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </div>

                {stat.badge && (
                  <div
                    className={`mt-1 inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                      stat.danger
                        ? 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400'
                        : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                    }`}
                  >
                    {stat.badge}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommandesStats;