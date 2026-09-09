import React, { useState } from 'react';
import { Search, X, ArrowUpDown, SlidersHorizontal, Briefcase, ChevronDown, List, CalendarDays } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const STATUS_OPTIONS = ['Tous', 'Actif', 'En congé', 'Inactif'] as const;

interface EmployesSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  sortOption: string;
  onSortChange: (option: string) => void;
  isLoading?: boolean;
  filterDepartement: string;
  onFilterDepartementChange: (value: string) => void;
  viewMode: 'liste' | 'calendrier';
  onViewModeChange: (mode: 'liste' | 'calendrier') => void;
}

const SelectControl: React.FC<{ value: string; onChange: (value: string) => void; options: readonly string[]; icon: React.ReactNode; minWidth?: string; ariaLabel: string }> = ({ value, onChange, options, icon, minWidth = '130px', ariaLabel }) => (
  <div className="relative shrink-0" style={{ minWidth }}>
    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
      <span className="text-brand-500 dark:text-brand-400">{icon}</span>
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="w-full h-10 appearance-none cursor-pointer rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] pl-9 pr-8 text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none transition-all duration-200 hover:border-slate-300 dark:hover:border-white/[0.18] focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-400/10"
    >
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
    <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
  </div>
);

const EmployesSearchBar: React.FC<EmployesSearchBarProps> = ({
  searchTerm, onSearchChange, filterStatus, onFilterStatusChange, sortOption, onSortChange,
  isLoading = false, filterDepartement, onFilterDepartementChange,
  viewMode, onViewModeChange
}) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  if (isLoading) return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="flex-1 min-w-[220px] h-10 rounded-xl bg-slate-100 dark:bg-white/[0.08] animate-pulse" />
        <div className="w-[140px] h-10 shrink-0 rounded-xl bg-slate-100 dark:bg-white/[0.08] animate-pulse" />
        <div className="w-[140px] h-10 shrink-0 rounded-xl bg-slate-100 dark:bg-white/[0.08] animate-pulse" />
        <div className="w-[120px] h-10 shrink-0 rounded-xl bg-slate-100 dark:bg-white/[0.08] animate-pulse" />
      </div>
    </div>
  );

  const hasActiveFilters = Boolean(searchTerm || filterStatus !== 'Tous' || filterDepartement || sortOption !== 'Nom (A-Z)');

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center gap-2.5 w-full flex-nowrap overflow-x-auto overflow-y-hidden pb-1 scrollbar-none">
        <div className="relative flex-1 min-w-[220px] shrink">
          <Search size={17} strokeWidth={1.9} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused ? 'text-brand-500' : 'text-brand-500 dark:text-brand-400'}`} />
          <input
            type="text"
            value={searchTerm}
            placeholder="Rechercher un employé, référence..."
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] pl-9 pr-9 text-[14px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-200 hover:border-slate-300 dark:hover:border-white/[0.18] focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-400/10"
          />
          {searchTerm && <button type="button" onClick={() => onSearchChange('')} aria-label="Effacer la recherche" className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-brand-600 dark:hover:text-slate-200 transition-colors cursor-pointer"><X size={13} /></button>}
        </div>

        <div className="flex shrink-0 items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-white/[0.12] dark:bg-[#0F172A]">
          <button
            type="button"
            onClick={() => onViewModeChange('liste')}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold transition-all ${
              viewMode === 'liste'
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'
            }`}
          >
            <List size={14} /> Liste
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('calendrier')}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold transition-all ${
              viewMode === 'calendrier'
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'
            }`}
          >
            <CalendarDays size={14} /> Calendrier
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(v => !v)}
          className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-[14px] font-semibold transition-all ${
            hasActiveFilters
              ? 'border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400'
              : 'border-slate-200 bg-white text-slate-600 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300'
          }`}
        >
          <SlidersHorizontal size={14} />
          Filtres
          <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/[0.12] dark:bg-[#0F172A] sm:grid-cols-2 lg:grid-cols-3">
          <SelectControl value={filterStatus} onChange={onFilterStatusChange} options={STATUS_OPTIONS} icon={<SlidersHorizontal size={15} strokeWidth={1.8} />} minWidth="100%" ariaLabel="Filtrer par statut" />
          <div className="relative">
            <Briefcase size={15} strokeWidth={1.8} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 dark:text-brand-400" />
            <input
              type="text"
              value={filterDepartement}
              placeholder="Département"
              onChange={(e) => onFilterDepartementChange(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] pl-9 pr-3 text-[14px] font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-200 hover:border-slate-300 dark:hover:border-white/[0.18] focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-400/10"
            />
          </div>
          <SelectControl value={sortOption} onChange={onSortChange} options={['Nom (A-Z)', 'Nom (Z-A)', 'Salaire (Croissant)', 'Salaire (Décroissant)', 'Date (Récent)', 'Date (Ancien)']} icon={<ArrowUpDown size={15} strokeWidth={1.8} />} minWidth="100%" ariaLabel="Trier les employés" />
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onFilterStatusChange('Tous');
                onFilterDepartementChange('');
                onSortChange('Nom (A-Z)');
                setShowFilters(false);
              }}
              disabled={!hasActiveFilters}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/[0.06]"
            >
              <X size={13} /> Réinitialiser
            </button>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default EmployesSearchBar;