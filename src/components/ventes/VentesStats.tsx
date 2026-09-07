
import React from 'react';
import { FileText, DollarSign, Package, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface VentesStatsProps {
  totalDevis: number;
  totalFactures: number;
  totalCA: number;
  totalItems?: number;
  totalDette?: number;
  nbFacturesNonPayees?: number;
  evolutionDevis?: number;
  evolutionFactures?: number;
  evolutionCA?: number;
  evolutionDette?: number;
  refreshing?: boolean;
}

const safeNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const VentesStats: React.FC<VentesStatsProps> = ({
  totalDevis = 0,
  totalFactures = 0,
  totalCA = 0,
  totalItems = 0,
  totalDette = 0,
  nbFacturesNonPayees = 0,
  evolutionDevis = 0,
  evolutionFactures = 0,
  evolutionCA = 0,
  evolutionDette = 0,
  refreshing = false,
}) => {
  const { isDark } = useTheme();

  const formattedCA = `${safeNumber(totalCA).toLocaleString('fr-FR')} Ar`;
  const formattedDette = `${safeNumber(totalDette).toLocaleString('fr-FR')} Ar`;
  const totalNonPayees = safeNumber(nbFacturesNonPayees).toLocaleString('fr-FR');

  // ⭐ NAMPIANA ICON SY COULEUR SAMIDAHAFA
  const stats = [
    {
      label: 'Total devis',
      value: safeNumber(totalDevis).toLocaleString('fr-FR'),
      evolution: safeNumber(evolutionDevis),
      icon: <FileText size={16} />,
      colorClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
    },
    {
      label: 'CA total',
      value: formattedCA,
      evolution: safeNumber(evolutionCA),
      icon: <DollarSign size={16} />,
      colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    },
    {
      label: 'Articles vendus',
      value: safeNumber(totalItems).toLocaleString('fr-FR'),
      evolution: safeNumber(totalItems),
      icon: <Package size={16} />,
      colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
    },
    {
      label: 'Dette Clients',
      value: formattedDette,
      evolution: safeNumber(evolutionDette),
      badge: nbFacturesNonPayees > 0 ? `${totalNonPayees} non payée(s)` : null,
      icon: <AlertCircle size={16} />,
      colorClass: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
    },
  ];

  return (
    <div className="relative mb-5 w-full">
      {refreshing && (
        <div className={`absolute right-0 top-0 z-20 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 shadow-sm animate-pulse ${
          isDark 
            ? 'border-white/[0.12] bg-[#0F172A] text-brand-400' 
            : 'border-slate-200 bg-white text-brand-600'
        }`}>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Mise à jour...</span>
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const hasEvolution = stat.evolution !== 0;
          const isPositive = stat.evolution > 0;
          const evolutionDisplay = hasEvolution 
            ? `${isPositive ? '+' : ''}${stat.evolution.toFixed(1)}%` 
            : '';

          return (
            <div
              key={stat.label}
              className={`group relative min-h-[80px] rounded-lg border px-4 py-3.5 shadow-[0_1px_2px_rgba(79,70,229,0.03)] transition-all duration-200 ring-1 ring-transparent flex items-center gap-3 ${
                isDark 
                  ? 'border-white/[0.12] bg-[#0F172A] hover:border-white/[0.18] hover:bg-slate-800 hover:shadow-none hover:ring-brand-500/20' 
                  : 'border-slate-200 bg-white hover:border-brand-500 hover:bg-brand-500/5 hover:shadow-[0_2px_6px_rgba(79,70,229,0.05)] hover:ring-brand-500/20'
              }`}
            >
              <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-brand-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

              {/* ⭐ ICON + COULEUR SAMIDAHAFA */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.colorClass}`}>
                {stat.icon}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </span>
                  {hasEvolution && (
                    <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      isPositive 
                        ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400' 
                        : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                    }`}>
                      {evolutionDisplay}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[14px] font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </div>
                {stat.badge && (
                  // ⭐ FIX: NAMPIANA W-FIT SY SELF-START MBA TSY HIVELATRA 100%
                  <div className="mt-1 inline-flex w-fit shrink-0 items-center gap-1 self-start rounded-md bg-danger-500 px-1.5 py-0.5 text-[11px] font-semibold text-white dark:bg-danger-500/10 dark:text-danger-400">
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

export default VentesStats;