// src/components/mouvements/MouvementsStats.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: NAMPIANA ICON SY COULEUR SAMIDAHAFA (ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine, AlertCircle)
// ⭐ FIX: BG DARK = #0F172A
// ⭐ FIX: LABEL EO AMBONIN'NY VALUE (15px)

import React from 'react';
import { Loader2, ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface MouvementsStatsProps { 
  total: number; 
  entrees: number; 
  sorties: number; 
  ajustements: number; 
  quantiteEntree: number; 
  quantiteSortie: number; 
  refreshing?: boolean; 
  onRefresh?: () => void; 
  filtreActif?: string; 
  onSelectFiltre?: (filtre: string) => void; 
}

const MouvementsStats: React.FC<MouvementsStatsProps> = ({ 
  total, entrees, sorties, ajustements, quantiteEntree, quantiteSortie, 
  refreshing: propRefreshing = false, onSelectFiltre, filtreActif = '' 
}) => {
  const { isDark } = useTheme();
  
  const cardBorder = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cardHoverBorder = isDark ? 'hover:border-white/[0.18]' : 'hover:border-slate-300';
  const cardBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const selectedBorder = isDark ? 'border-brand-500' : 'border-brand-500';
  const selectedBackground = isDark ? 'bg-brand-500/10' : 'bg-brand-50';

  const stats = [
    { 
      key: '', 
      label: 'Total Mouvements', 
      value: total, 
      quantiteValue: null,
      icon: <ArrowLeftRight size={16} />,
      colorClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
    },
    { 
      key: 'ENTREE', 
      label: 'Entrées', 
      value: entrees, 
      quantiteValue: quantiteEntree,
      icon: <ArrowDownToLine size={16} />,
      colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    },
    { 
      key: 'SORTIE', 
      label: 'Sorties', 
      value: sorties, 
      quantiteValue: quantiteSortie,
      icon: <ArrowUpFromLine size={16} />,
      colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
    },
    { 
      key: 'AJUSTEMENT', 
      label: 'Ajustements', 
      value: ajustements, 
      quantiteValue: null,
      icon: <AlertCircle size={16} />,
      colorClass: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
    },
  ];

  return (
    <div className="relative mb-5">
      {propRefreshing && (
        <div className={`absolute right-0 top-0 z-10 flex items-center gap-1.5 rounded-full border px-3 py-1.5 shadow-lg animate-pulse ${isDark ? 'border-white/[0.12] bg-[#0F172A] text-brand-400' : 'border-slate-200 bg-white text-brand-600'}`}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">Mise à jour...</span>
        </div>
      )}
      
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const isSelected = filtreActif === stat.key; 
          const isFilterCard = stat.key !== '';
          return (
            <div 
              key={stat.key} 
              onClick={() => onSelectFiltre?.(stat.key)} 
              className={`group relative min-h-[80px] cursor-pointer overflow-hidden rounded-lg border px-4 py-3.5 shadow-sm transition-all duration-200 ring-1 ring-transparent flex items-center gap-3 ${
                isSelected && isFilterCard 
                  ? `${selectedBorder} ${selectedBackground} shadow-sm` 
                  : `${cardBorder} ${cardBackground} ${cardHoverBorder} hover:shadow-md`
              } hover:ring-brand-500/20`}
            >
              <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full transition-all duration-200 ${
                isSelected && isFilterCard ? 'bg-brand-500 opacity-100' : 'bg-brand-500 opacity-0 group-hover:opacity-100'
              }`} />
              
            
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.colorClass}`}>
                {stat.icon}
              </div>
           
              <div className="flex min-w-0 flex-1 flex-col">
              
                <span className="min-w-0 truncate text-[15px] font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </span>
                <div className="mt-0.5 truncate text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {stat.value}
                </div>
                {stat.quantiteValue !== null && (
                  <div className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {Number(stat.quantiteValue || 0).toLocaleString('fr-FR')} unité{stat.quantiteValue > 1 ? 's' : ''}
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

export default MouvementsStats;