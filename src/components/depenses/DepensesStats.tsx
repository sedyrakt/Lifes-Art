import React from 'react';
import { TrendingDown, FileText, DollarSign, Building, Loader2 } from 'lucide-react';
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
      label: 'Total Dépenses', 
      value: formattedTotal, 
      evolution: safeNumber(evolutionTotal),
      icon: <TrendingDown size={16} />,
      colorClass: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
    },
    { 
      label: 'Nombre', 
      value: displayNb.toLocaleString('fr-FR'), 
      evolution: safeNumber(evolutionNb),
      icon: <FileText size={16} />,
      colorClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
    },
    { 
      label: 'Moyenne', 
      value: formattedMoyenne, 
      evolution: safeNumber(evolutionMoyenne),
      icon: <DollarSign size={16} />,
      colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    },
    { 
      label: 'Fournisseurs', 
      value: safeNumber(nbFournisseurs).toLocaleString('fr-FR'), 
      evolution: safeNumber(evolutionFournisseurs),
      icon: <Building size={16} />,
      colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
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
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Mise à jour...</span>
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const hasEvolution = stat.evolution !== 0;
          const isPositive = stat.evolution > 0;
          const evolutionDisplay = hasEvolution 
            ? `${isPositive ? '+' : ''}${stat.evolution.toFixed(1)}%` 
            : '';

          return (
            <div 
              key={stat.label} 
              className={`group relative min-h-[80px] rounded-lg border px-4 py-3.5 shadow-sm ring-1 ring-transparent transition-all duration-200 flex items-center gap-3 ${
                isDark 
                  ? 'border-white/[0.12] bg-[#0F172A] hover:border-white/[0.18] hover:bg-slate-800 hover:ring-brand-500/20' 
                  : 'border-slate-200 bg-white hover:border-brand-500/40 hover:bg-slate-50 hover:ring-brand-500/20'
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.colorClass}`}>
                {stat.icon}
              </div>

              {/* ⭐ LABEL EO AMBONIN'NY VALUE */}
              <div className="flex min-w-0 flex-1 flex-col">
                {/* ⭐ FIX: Nampitombo ho text-[15px] ny label */}
                <span className="min-w-0 truncate text-[15px] font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </span>
                <div className="mt-0.5 flex min-w-0 items-center justify-between gap-2">
                  <span className="truncate text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </span>
                  {hasEvolution && (
                    <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      isPositive 
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' 
                        : 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400'
                    }`}>
                      {evolutionDisplay}
                    </span>
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