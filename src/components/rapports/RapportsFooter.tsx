// src/components/rapports/RapportsFooter.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur les tables et footers rehetra
// ⭐ FONT SIZE: main text 13px, badges 12.5px, icons +1

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
  const cardBg = isDark ? 'bg-[#0F172A]' : 'bg-white';

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <footer className={`mt-4 border-t ${borderColor} py-2.5 ${cardBg} transition-colors`}>
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        {/* ⭐ Main text : 12.5px → 13px */}
        <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          <span>Mise à jour : {formattedDate} à {formattedTime}</span>
          <span className="hidden h-3.5 w-px bg-slate-300 dark:bg-white/[0.12] md:block" />
          <span className="hidden md:inline text-slate-400 dark:text-slate-500">Données en temps réel</span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {/* ⭐ Badge Produits */}
          <div className={`group inline-flex items-center gap-1.5 rounded-md border ${borderColor} ${cardBg} px-2 py-1 transition-colors`}>
            {/* ⭐ Icon : 13 → 14 */}
            <Package size={14} strokeWidth={2.2} className="text-brand-500 dark:text-brand-400" />
            {/* ⭐ Value : 12.5px → 13px */}
            <span className="text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100">{totalProduits.toLocaleString('fr-FR')}</span>
            {/* ⭐ Label : 11.5px → 12.5px */}
            <span className="text-[12.5px] font-medium leading-tight text-slate-500 dark:text-slate-400">produits</span>
          </div>

          {/* ⭐ Badge CA */}
          <div className={`group inline-flex items-center gap-1.5 rounded-md border ${borderColor} ${cardBg} px-2 py-1 transition-colors`}>
            <DollarSign size={14} strokeWidth={2.2} className="text-brand-500 dark:text-brand-400" />
            <span className="text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100">{formatMoney(chiffreAffaires)}</span>
            <span className="text-[12.5px] font-medium leading-tight text-slate-500 dark:text-slate-400">CA</span>
          </div>

          {/* ⭐ Badge Ventes */}
          <div className={`group inline-flex items-center gap-1.5 rounded-md border ${borderColor} ${cardBg} px-2 py-1 transition-colors`}>
            <ShoppingCart size={14} strokeWidth={2.2} className="text-brand-500 dark:text-brand-400" />
            <span className="text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100">{totalVentes.toLocaleString('fr-FR')}</span>
            <span className="text-[12.5px] font-medium leading-tight text-slate-500 dark:text-slate-400">ventes</span>
          </div>

          {/* ⭐ Badge Temps réel */}
          <div className={`hidden sm:inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-2 py-1 dark:border-brand-500/25 dark:bg-brand-500/10`}>
            {/* ⭐ Icon : 12 → 13 */}
            <Activity size={13} strokeWidth={2.2} className="text-brand-500 dark:text-brand-400" />
            {/* ⭐ Text : 11.5px → 12.5px */}
            <span className="text-[12.5px] font-semibold leading-tight text-brand-600 dark:text-brand-300">Temps réel</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default RapportsFooter;