import React from 'react';
import { Users, User, Building, Wallet } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ClientsStatsProps { 
  totalClients: number; 
  particuliers: number; 
  entreprises: number; 
  totalAchats: number; 
  refreshing?: boolean; 
}

const safeNumber = (value: unknown): number => { 
  const n = Number(value); 
  return Number.isFinite(n) ? n : 0; 
};

const ClientsStats: React.FC<ClientsStatsProps> = ({ 
  totalClients, 
  particuliers, 
  entreprises, 
  totalAchats, 
  refreshing = false 
}) => {
  const { isDark } = useTheme();
  
  const stats = [
    { 
      label: 'Total Clients', 
      value: safeNumber(totalClients).toLocaleString('fr-FR'), 
      icon: <Users size={16} />,
      colorClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
    },
    { 
      label: 'Particuliers', 
      value: safeNumber(particuliers).toLocaleString('fr-FR'), 
      icon: <User size={16} />,
      colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    },
    { 
      label: 'Entreprises', 
      value: safeNumber(entreprises).toLocaleString('fr-FR'), 
      icon: <Building size={16} />,
      colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
    },
    { 
      label: 'Total achats', 
      value: `${safeNumber(totalAchats).toLocaleString('fr-FR')} Ar`, 
      icon: <Wallet size={16} />,
      colorClass: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400'
    },
  ];

  return (
    <div className="relative mb-5">
      {refreshing && (
        <div className={`absolute right-0 top-0 z-10 flex items-center gap-1.5 rounded-full border px-3 py-1.5 shadow-lg animate-pulse ${isDark ? 'border-white/[0.12] bg-[#0F172A] text-brand-400' : 'border-slate-200 bg-white text-brand-600'}`}>
          <span className="text-xs font-bold uppercase tracking-wider">Mise à jour...</span>
        </div>
      )}
      
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          return (
            <div 
              key={stat.label} 
              className={`group relative min-h-[80px] rounded-lg border px-4 py-3.5 transition-all duration-200 ring-1 ring-transparent shadow-[0_1px_2px_rgba(79,70,229,0.03)] flex items-center gap-3 ${
                isDark 
                  ? 'border-white/[0.12] bg-[#0F172A] hover:border-white/[0.18] hover:bg-slate-800 hover:ring-brand-500/20' 
                  : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/50 hover:ring-brand-500/20'
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.colorClass}`}>
                {stat.icon}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
          
                <span className="min-w-0 truncate text-[15px] font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </span>
                <span className="mt-0.5 truncate text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {stat.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientsStats;