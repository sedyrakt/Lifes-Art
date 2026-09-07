
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
      label: 'Total employés', 
      value: safeTotalItems.toLocaleString('fr-FR'), 
      icon: <Users size={18} />,
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
      accentClass: 'bg-indigo-500'
    },
    { 
      label: 'Masse salariale', 
      value: formattedSalaire, 
      icon: <Wallet size={18} />,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
      accentClass: 'bg-emerald-500'
    },
    { 
      label: 'Employés actifs', 
      value: safeActifs.toLocaleString('fr-FR'), 
      icon: <UserCheck size={18} />,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
      accentClass: 'bg-blue-500'
    },
    { 
      label: "Taux d'activité", 
      value: `${safeTauxActif.toFixed(2)}%`, 
      icon: <TrendingUp size={18} />,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
      accentClass: 'bg-amber-500'
    },
  ];

  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        return (
          <div 
            key={stat.label} 
            className={`group relative min-h-[80px] rounded-lg border px-4 py-3.5 transition-all duration-200 ring-1 ring-transparent ${
              isDark 
                ? 'border-white/[0.12] bg-[#0F172A] hover:border-white/[0.18] hover:bg-slate-800 hover:ring-brand-500/20' 
                : 'border-slate-200 bg-white hover:border-brand-500/40 hover:bg-brand-50/20 hover:ring-brand-500/20'
            }`}
          >
            <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${stat.accentClass} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />

            <div className="flex min-w-0 items-start gap-3">

              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.iconBg}`}>
                {stat.icon}
              </div>

              <div className="flex min-w-0 flex-col">
                <div className="min-w-0 truncate text-[18px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
                  {stat.value}
                </div>
                <div className="mt-0.5 truncate text-[14px] font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmployesStats;