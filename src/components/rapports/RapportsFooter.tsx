import React from 'react';
import { Package, DollarSign, ShoppingCart, Activity } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface RapportsFooterProps {
  totalProduits: number;
  chiffreAffaires: number;
  totalVentes: number;
  formatMoney: (value: number) => string;
}

const RapportsFooter: React.FC<RapportsFooterProps> = ({ totalProduits, chiffreAffaires, totalVentes, formatMoney }) => {
  const { isDark } = useTheme();
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cardBg = isDark ? 'bg-[#0F172A]' : 'bg-white'; // ⭐ FIX: dark bg #0F172A

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <footer className={`mt-6 border-t ${borderColor} py-3.5 ${cardBg} transition-colors`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          <span>Mise à jour : {formattedDate} à {formattedTime}</span>
          <span className="hidden h-3.5 w-px bg-slate-200 dark:bg-white/[0.12] md:block" />
          <span className="hidden md:inline text-slate-400 dark:text-slate-500">Données en temps réel</span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          <div className={`group inline-flex items-center gap-1.5 rounded-lg border ${borderColor} ${cardBg} px-2.5 py-1.5 shadow-[0_1px_2px_rgba(79,70,229,0.03)] transition-all duration-200 hover:border-brand-500/20 hover:bg-brand-50/50 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5`}>
            <Package size={14} strokeWidth={2} className="text-brand-500 dark:text-brand-400" />
            <span className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{totalProduits.toLocaleString('fr-FR')}</span>
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">produits</span>
          </div>

          <div className={`group inline-flex items-center gap-1.5 rounded-lg border ${borderColor} ${cardBg} px-2.5 py-1.5 shadow-[0_1px_2px_rgba(79,70,229,0.03)] transition-all duration-200 hover:border-brand-500/20 hover:bg-brand-50/50 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5`}>
            <DollarSign size={14} strokeWidth={2} className="text-brand-500 dark:text-brand-400" />
            <span className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{formatMoney(chiffreAffaires)}</span>
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">CA</span>
          </div>

          <div className={`group inline-flex items-center gap-1.5 rounded-lg border ${borderColor} ${cardBg} px-2.5 py-1.5 shadow-[0_1px_2px_rgba(79,70,229,0.03)] transition-all duration-200 hover:border-brand-500/20 hover:bg-brand-50/50 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5`}>
            <ShoppingCart size={14} strokeWidth={2} className="text-brand-500 dark:text-brand-400" />
            <span className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{totalVentes.toLocaleString('fr-FR')}</span>
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">ventes</span>
          </div>

          <div className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border ${borderColor} bg-brand-50/70 dark:bg-brand-500/10 px-2.5 py-1.5`}>
            <Activity size={13} strokeWidth={2} className="text-brand-500 dark:text-brand-400" />
            <span className="text-[13px] font-semibold text-brand-600 dark:text-brand-300">Temps réel</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default RapportsFooter;