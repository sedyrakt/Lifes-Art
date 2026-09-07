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
  
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-gray-200';
  const bgColor = isDark ? 'bg-[#2A2A2A]' : 'bg-white';

  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:flex-1 lg:max-w-[520px]">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500 dark:text-brand-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un paiement ou un employé..."
          className={`w-full h-10 pl-10 pr-10 rounded-lg text-[14px] outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${bgColor} ${borderColor} text-slate-900 dark:text-[#FDE2E4]`}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 transition-colors"
            aria-label="Effacer la recherche"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={filterMois}
          onChange={(e) => onFilterMoisChange(Number(e.target.value))}
          className={`h-10 min-w-[110px] px-3 rounded-lg text-[14px] outline-none cursor-pointer transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${bgColor} ${borderColor} text-slate-700 dark:text-slate-200`}
        >
          <option value={0}>Tous les mois</option>
          {moisLabels.map((mois, index) => (
            <option key={mois} value={index + 1}>{mois}</option>
          ))}
        </select>

        <select
          value={filterAnnee}
          onChange={(e) => onFilterAnneeChange(Number(e.target.value))}
          className={`h-10 min-w-[100px] px-3 rounded-lg text-[14px] outline-none cursor-pointer transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${bgColor} ${borderColor} text-slate-700 dark:text-slate-200`}
        >
          <option value={0}>Toutes les années</option>
          {annees.map((annee) => (
            <option key={annee} value={annee}>{annee}</option>
          ))}
        </select>

        <div className="relative">
          <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            className={`h-10 min-w-[140px] pl-9 pr-3 rounded-lg text-[14px] outline-none cursor-pointer transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${bgColor} ${borderColor} text-slate-700 dark:text-slate-200`}
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
                : 'text-slate-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
            }`}
            title="Vue tableau"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-slate-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
            }`}
            title="Vue grille"
          >
            <Grid size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaiementsSearchbar;