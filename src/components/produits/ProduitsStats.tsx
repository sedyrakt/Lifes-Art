

import React from 'react';
import { Box, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProduitsStatsProps { 
  totalItems: number; 
  totalStock: number; 
  alertes: number; 
  totalValeur?: number | string; 
}

const safeNumber = (value: unknown): number => { 
  const n = Number(value); 
  return Number.isFinite(n) ? n : 0; 
};

const ProduitsStats: React.FC<ProduitsStatsProps> = ({ 
  totalItems, 
  totalStock, 
  alertes, 
  totalValeur = 0 
}) => {
  const { isDark } = useTheme();

  const formattedValeur = typeof totalValeur === 'number' 
    ? `${safeNumber(totalValeur).toLocaleString('fr-FR')} Ar` 
    : totalValeur || '0 Ar';
  
  const stats = [
    { 
      label: 'Valeur du stock', 
      value: formattedValeur,
      icon: <TrendingUp size={16} />,
      colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
    },
    { 
      label: 'Produits', 
      value: safeNumber(totalItems).toLocaleString('fr-FR'),
      icon: <Box size={16} />,
      colorClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
    },
    { 
      label: 'Stock total', 
      value: safeNumber(totalStock).toLocaleString('fr-FR'),
      icon: <Package size={16} />,
      colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    },
    { 
      label: 'Alertes stock', 
      value: safeNumber(alertes).toLocaleString('fr-FR'),
      icon: <AlertTriangle size={16} />,
      colorClass: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
    },
  ];

  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div 
          key={stat.label} 
          className={`group relative min-h-[80px] rounded-lg border px-4 py-3.5 shadow-[0_1px_2px_rgba(79,70,229,0.03)] transition-all duration-200 ring-1 ring-transparent flex items-center gap-3 ${
            isDark 
              ? 'border-white/[0.12] bg-[#0F172A] hover:border-white/[0.18] hover:bg-slate-800 hover:shadow-none hover:ring-brand-500/20' 
              : 'border-slate-200 bg-white hover:border-brand-500/40 hover:bg-brand-50/50 hover:shadow-[0_2px_6px_rgba(79,70,229,0.05)] hover:ring-brand-500/20'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.colorClass}`}>
            {stat.icon}
          </div>
          
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {stat.value}
            </span>
            <div className="mt-0.5 truncate text-[14px] font-medium text-slate-600 dark:text-slate-400">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProduitsStats;