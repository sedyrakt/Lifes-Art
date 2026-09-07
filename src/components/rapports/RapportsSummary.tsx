
import React from 'react';
import { ClipboardList, TrendingUp, ArrowUp, ArrowDown, Target, Users, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface RapportsSummaryProps { stats: { chiffreAffaires: number; totalEntrees: number; totalSorties: number; benefice: number; nbClients: number; }; formatMoney: (value: number) => string; }

const RapportsSummary: React.FC<RapportsSummaryProps> = ({ stats, formatMoney }) => {
  const { isDark } = useTheme();
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cardBg = isDark ? 'bg-[#0F172A]' : 'bg-white'; 
  const shadow = isDark ? 'shadow-[0_12px_40px_rgba(0,0,0,0.18)]' : 'shadow-[0_1px_2px_rgba(79,70,229,0.04)]';

  const ratio = stats.chiffreAffaires > 0 ? (stats.benefice / stats.chiffreAffaires) * 100 : 0;
  const ratioFormatted = ratio.toFixed(2);
  const beneficePositif = stats.benefice >= 0;

  const rows = [
    { 
      key: 'ca', 
      title: "Chiffre d'affaires", 
      subtitle: 'Montant total des ventes', 
      value: formatMoney(stats.chiffreAffaires), 
      icon: TrendingUp, 
      iconBg: 'bg-brand-500/[0.10] text-brand-500',
      valueColor: 'text-slate-900 dark:text-slate-100'
    },
    { 
      key: 'entrees', 
      title: 'Total entrées', 
      subtitle: 'Mouvements entrants', 
      value: stats.totalEntrees.toLocaleString('fr-FR'), 
      icon: ArrowUp, 
      iconBg: 'bg-success-500/[0.10] text-success-400',
      valueColor: 'text-success-600 dark:text-success-400'
    },
    { 
      key: 'sorties', 
      title: 'Total sorties', 
      subtitle: 'Mouvements sortants', 
      value: stats.totalSorties.toLocaleString('fr-FR'), 
      icon: ArrowDown, 
      iconBg: 'bg-danger-500/[0.10] text-danger-500',
      valueColor: 'text-danger-600 dark:text-danger-400'
    },
    { 
      key: 'ratio', 
      title: 'Ratio bénéfice / ventes', 
      subtitle: 'Performance globale', 
      value: `${ratioFormatted}%`,
      icon: Target, 
      iconBg: beneficePositif ? 'bg-success-500/[0.10] text-success-400' : 'bg-danger-500/[0.10] text-danger-500',
      valueColor: beneficePositif ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
    },
    { 
      key: 'clients', 
      title: 'Nombre de clients', 
      subtitle: 'Base de données clients', 
      value: stats.nbClients.toLocaleString('fr-FR'), 
      icon: Users, 
      iconBg: 'bg-slate-500/[0.10] text-slate-400',
      valueColor: 'text-slate-900 dark:text-slate-100'
    },
  ];

  return (
    <div className={`relative h-full overflow-hidden rounded-xl border ${borderColor} ${cardBg} ${shadow}`}>
      <div className="relative">
        <div className={`flex items-center justify-between border-b ${borderColor} px-4 py-3.5`}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500"><ClipboardList size={18} strokeWidth={2} /></div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Résumé financier</h2>
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">Synthèse des indicateurs</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-[13px] font-medium text-brand-500 dark:text-brand-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            À jour
          </div>
        </div>

        <div className="px-4 py-3 space-y-3">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.key} className={`flex items-center justify-between gap-3 border-b ${borderColor} pb-3 last:border-b-0 last:pb-0`}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${row.iconBg}`}>
                    <Icon size={16} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900 dark:text-slate-200">{row.title}</p>
                    <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-slate-400">{row.subtitle}</p>
                  </div>
                </div>
                
                <span className={`shrink-0 text-[14px] font-semibold ${row.valueColor}`}>{row.value}</span>
              </div>
            );
          })}
        </div>

        <div className={`mx-4 mb-4 p-4 rounded-xl border ${beneficePositif ? 'border-success-500/20 bg-success-500/5' : 'border-danger-500/20 bg-danger-500/5'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${beneficePositif ? 'bg-success-500/10 text-success-400' : 'bg-danger-500/10 text-danger-500'}`}>
                <DollarSign size={15} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">Bénéfice net</div>
                <div className="text-[13px] text-slate-500 dark:text-slate-400">Résultat après déduction des sorties</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`text-[15px] font-bold tracking-tight ${beneficePositif ? 'text-success-400' : 'text-danger-500'}`}>{formatMoney(stats.benefice)}</span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full ${beneficePositif ? 'bg-success-500/10 text-success-400' : 'bg-danger-500/10 text-danger-500'}`}>
                {beneficePositif ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RapportsSummary;