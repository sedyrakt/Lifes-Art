import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowUpDown, Filter, Calendar, RotateCcw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const SORT_OPTIONS = [
  { value: 'Date (Récent)', label: 'Date récent' },
  { value: 'Date (Ancien)', label: 'Date ancien' },
  { value: 'Quantité (Croissant)', label: 'Quantité ↑' },
  { value: 'Quantité (Décroissant)', label: 'Quantité ↓' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les mouvements' },
  { value: 'ENTREE', label: 'Entrées' },
  { value: 'SORTIE', label: 'Sorties' },
  { value: 'AJUSTEMENT', label: 'Ajustements' },
];

interface MouvementsSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  sortOption: string;
  onSortChange: (value: string) => void;
  isLoading?: boolean;
  filterDateFrom: string;
  filterDateTo: string;
  onFilterDateFromChange: (value: string) => void;
  onFilterDateToChange: (value: string) => void;
}

const MouvementsSearchBar: React.FC<MouvementsSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  sortOption,
  onSortChange,
  isLoading = false,
  filterDateFrom,
  filterDateTo,
  onFilterDateFromChange,
  onFilterDateToChange,
}) => {
  const { isDark } = useTheme();
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ⭐ FIX: NOVAINA HO #0F172A NY BACKGROUND AMIN'NY DARK MODE
  const controlBorder = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const controlHoverBorder = isDark ? 'hover:border-white/[0.18]' : 'hover:border-slate-300';
  const controlBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const controlText = isDark ? 'text-slate-200' : 'text-slate-700';
  const controlShadow = isDark ? 'shadow-[0_1px_2px_rgba(0,0,0,0.12)]' : 'shadow-[0_1px_2px_rgba(79,70,229,0.05)]';

  useEffect(() => { setLocalSearch(searchTerm); }, [searchTerm]);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => { onSearchChange(value); }, 300);
  }, [onSearchChange]);

  useEffect(() => { return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); }; }, []);

  const hasActiveFilters = localSearch.trim() !== '' || filterType !== '' || filterDateFrom !== '' || filterDateTo !== '';

  const handleReset = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setLocalSearch('');
    onSearchChange('');
    onFilterTypeChange('');
    onSortChange('Date (Récent)');
    onFilterDateFromChange('');
    onFilterDateToChange('');
  };

  if (isLoading) return (
    <div className="mb-4 w-full animate-pulse">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
        <div className={`h-10 min-w-[260px] flex-1 rounded-lg border ${isDark ? 'border-white/[0.05] bg-white/[0.06]' : 'border-slate-200 bg-slate-50'}`} />
        <div className="flex items-center gap-2.5">
          <div className={`h-10 w-[165px] rounded-lg border ${isDark ? 'border-white/[0.05] bg-white/[0.06]' : 'border-slate-200 bg-slate-50'}`} />
          <div className={`h-10 w-[120px] rounded-lg border ${isDark ? 'border-white/[0.05] bg-white/[0.06]' : 'border-slate-200 bg-slate-50'}`} />
          <div className={`h-10 w-[120px] rounded-lg border ${isDark ? 'border-white/[0.05] bg-white/[0.06]' : 'border-slate-200 bg-slate-50'}`} />
          <div className={`h-10 w-[150px] rounded-lg border ${isDark ? 'border-white/[0.05] bg-white/[0.06]' : 'border-slate-200 bg-slate-50'}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-4 w-full">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search size={18} strokeWidth={2} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150 ${isFocused ? 'text-brand-500 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
          <input
            type="text"
            placeholder="Rechercher un mouvement..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`h-10 w-full rounded-lg border ${controlBorder} ${controlBackground} pl-11 pr-10 text-[14.5px] font-medium ${controlText} outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 ${controlShadow} transition-all duration-150 ${controlHoverBorder} ${isFocused ? 'border-brand-500 ring-2 ring-brand-500/10' : ''}`}
          />
          {localSearch && (
            <button type="button" onClick={() => handleSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200" aria-label="Effacer la recherche">
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 overflow-x-auto pb-0.5">
          <div className="relative shrink-0">
            <Filter size={14} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
            <select
              value={filterType}
              onChange={(e) => onFilterTypeChange(e.target.value)}
              className={`h-10 w-[170px] cursor-pointer appearance-none rounded-lg border ${controlBorder} ${controlBackground} pl-9 pr-8 text-[13px] font-medium ${controlText} outline-none ${controlShadow} transition-all ${controlHoverBorder} hover:bg-slate-50 dark:hover:bg-white/[0.06] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`}
            >
              {TYPE_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
          </div>

          {/* ⭐ Remplacement du DatePicker par input type="date" */}
          <div className="relative shrink-0">
            <Calendar size={13} strokeWidth={2} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => onFilterDateFromChange(e.target.value)}
              placeholder="Début"
              className={`h-10 w-[130px] cursor-pointer appearance-none rounded-lg border ${controlBorder} ${controlBackground} pl-8 pr-2 text-[13px] font-medium ${controlText} outline-none ${controlShadow} transition-all ${controlHoverBorder} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`}
            />
            {filterDateFrom && (
              <button type="button" onClick={() => onFilterDateFromChange('')} className="absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:bg-white/[0.06] dark:text-slate-400 dark:hover:bg-white/[0.10] dark:hover:text-slate-200" title="Effacer la date début">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <Calendar size={13} strokeWidth={2} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => onFilterDateToChange(e.target.value)}
              placeholder="Fin"
              className={`h-10 w-[130px] cursor-pointer appearance-none rounded-lg border ${controlBorder} ${controlBackground} pl-8 pr-2 text-[13px] font-medium ${controlText} outline-none ${controlShadow} transition-all ${controlHoverBorder} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`}
            />
            {filterDateTo && (
              <button type="button" onClick={() => onFilterDateToChange('')} className="absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:bg-white/[0.06] dark:text-slate-400 dark:hover:bg-white/[0.10] dark:hover:text-slate-200" title="Effacer la date fin">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <ArrowUpDown size={14} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value)}
              className={`h-10 w-[155px] cursor-pointer appearance-none rounded-lg border ${controlBorder} ${controlBackground} pl-9 pr-8 text-[13px] font-medium ${controlText} outline-none ${controlShadow} transition-all ${controlHoverBorder} hover:bg-slate-50 dark:hover:bg-white/[0.06] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`}
            >
              {SORT_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[14px] font-medium text-slate-400 dark:text-slate-500">Filtres actifs</span>
            {localSearch.trim() && (<FilterChip icon={<Search size={11} />} label={`"${localSearch.trim()}"`} onRemove={() => handleSearchChange('')} />)}
            {filterType && (<FilterChip icon={<Filter size={11} />} label={TYPE_OPTIONS.find((type) => type.value === filterType)?.label || filterType} onRemove={() => onFilterTypeChange('')} />)}
            {filterDateFrom && (<FilterChip icon={<Calendar size={11} />} label={`Du ${filterDateFrom}`} onRemove={() => onFilterDateFromChange('')} />)}
            {filterDateTo && (<FilterChip icon={<Calendar size={11} />} label={`Au ${filterDateTo}`} onRemove={() => onFilterDateToChange('')} />)}
          </div>
          <button type="button" onClick={handleReset} className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-[14px] font-semibold text-slate-500 transition-all hover:border-slate-200 hover:bg-slate-50 hover:text-brand-600 dark:text-slate-400 dark:hover:border-white/[0.12] dark:hover:bg-white/[0.06] dark:hover:text-slate-200">
            <RotateCcw size={12} />Réinitialiser
          </button>
        </div>
      )}
    </div>
  );
};

const FilterChip: React.FC<{ label: string; icon?: React.ReactNode; onRemove: () => void; }> = ({ label, icon, onRemove }) => {
  return (
    <span className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[14px] font-medium text-slate-600 transition-colors dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-slate-300">
      {icon && <span className="shrink-0 opacity-70">{icon}</span>}
      <span className="truncate">{label}</span>
      <button type="button" onClick={onRemove} className="shrink-0 rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/[0.12] dark:hover:text-slate-200" aria-label={`Supprimer le filtre ${label}`}>
        <X size={11} />
      </button>
    </span>
  );
};

export default MouvementsSearchBar;