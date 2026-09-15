// src/components/paiements/PaiementsSearchbar.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur CommandesTable
// ⭐ fontSize : header 12px, cells 13.5px, footer 12.5px

import React from 'react';
import { Search, X, List, Grid, ArrowUpDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface PaiementsSearchbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterMois: number;
  onFilterMoisChange: (value: number) => void;
  filterAnnee: number;
  onFilterAnneeChange: (value: number) => void;
  sortOption: string;
  onSortChange: (value: string) => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  moisLabels: string[];
  annees: number[];
}

const PaiementsSearchbar: React.FC<PaiementsSearchbarProps> = ({
  searchTerm, onSearchChange, filterMois, onFilterMoisChange, filterAnnee, onFilterAnneeChange,
  sortOption, onSortChange, viewMode, onViewModeChange, moisLabels, annees,
}) => {
  const { isDark } = useTheme();
  
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const bgColor = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
  const placeholderColor = isDark ? 'dark:placeholder:text-slate-500' : 'placeholder:text-slate-400';

  const inputClass = `h-10 rounded-lg border text-[13.5px] outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${bgColor} ${borderColor} ${textColor}`;

  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:flex-1 lg:max-w-[520px]">
        <Search size={16} strokeWidth={2.2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500 dark:text-brand-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un paiement ou un employé..."
          className={`w-full h-10 pl-10 pr-10 ${inputClass} ${placeholderColor}`}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md text-slate-400 transition-colors hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
            aria-label="Effacer la recherche"
          >
            <X size={14} strokeWidth={2.2} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={filterMois}
          onChange={(e) => onFilterMoisChange(Number(e.target.value))}
          className={`${inputClass} min-w-[110px] px-3 cursor-pointer`}
        >
          <option value={0}>Tous les mois</option>
          {moisLabels.map((mois, index) => (
            <option key={mois} value={index + 1}>{mois}</option>
          ))}
        </select>

        <select
          value={filterAnnee}
          onChange={(e) => onFilterAnneeChange(Number(e.target.value))}
          className={`${inputClass} min-w-[100px] px-3 cursor-pointer`}
        >
          <option value={0}>Toutes les années</option>
          {annees.map((annee) => (
            <option key={annee} value={annee}>{annee}</option>
          ))}
        </select>

        <div className="relative">
          <ArrowUpDown size={15} strokeWidth={2.2} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            className={`${inputClass} min-w-[140px] pl-9 pr-3 cursor-pointer`}
          >
            <option value="date-desc">Date (Récent)</option>
            <option value="date-asc">Date (Ancien)</option>
            <option value="montant-desc">Montant ↓</option>
            <option value="montant-asc">Montant ↑</option>
          </select>
        </div>

        <div className={`flex items-center h-10 p-1 rounded-lg border ${bgColor} ${borderColor}`}>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
            }`}
            title="Vue tableau"
            aria-label="Vue tableau"
          >
            <List size={17} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
            }`}
            title="Vue grille"
            aria-label="Vue grille"
          >
            <Grid size={17} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaiementsSearchbar;