import React from 'react';
import { ArrowDownToLine, Boxes, Wallet, Package } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface EntreesStatsProps {
  totalEntries: number;
  totalQty: number;
  totalValue: number;
  uniqueProducts: number;
}

const EntreesStats: React.FC<EntreesStatsProps> = ({ totalEntries, totalQty, totalValue, uniqueProducts }) => {
  const { isDark } = useTheme();

  const stats = [
    { 
      label: 'Total entrées', 
      value: totalEntries.toLocaleString('fr-FR'),
      icon: <ArrowDownToLine size={16} />,
      colorClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
    },
    { 
      label: 'Quantité entrée', 
      value: totalQty.toLocaleString('fr-FR'),
      icon: <Boxes size={16} />,
      colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    },
    { 
      label: 'Valeur totale', 
      value: `${totalValue.toLocaleString('fr-FR')} Ar`,
      icon: <Wallet size={16} />,
      colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
    },
    { 
      label: 'Produits concernés', 
      value: uniqueProducts.toLocaleString('fr-FR'),
      icon: <Package size={16} />,
      colorClass: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400'
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
      {stats.map((stat) => (
        <div 
          key={stat.label} 
          className={`group relative min-h-[80px] overflow-hidden rounded-xl border px-4 py-3.5 shadow-sm transition-all hover:-translate-y-[1px] flex items-center gap-3 ${
            isDark 
              ? 'border-white/[0.12] bg-[#0F172A] hover:border-white/[0.18] hover:bg-slate-800' 
              : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/50'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.colorClass}`}>
            {stat.icon}
          </div>
          <div className="flex min-w-0 flex-col">
            {/* ⭐ FIX: Nampitombo ho text-[15px] ny label */}
            <p className="truncate text-[15px] font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="mt-0.5 truncate text-[18px] font-semibold text-slate-900 dark:text-slate-100">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EntreesStats;