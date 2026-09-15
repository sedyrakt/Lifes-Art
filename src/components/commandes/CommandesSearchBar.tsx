// src/components/commandes/CommandesSearchBar.tsx
// ⭐ FIX: Nesorina ny CalendarDays icon indigo (left)
// ⭐ FIX: Ny X button sy ny native picker tsy mifanindry intsony
//    → Rehefa EMPTY : aseho ny native picker
//    → Rehefa FILLED : soloina X button ny native picker

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const SORT_OPTIONS = [
  { value: 'Date (Récent)', label: 'Date (Récent)' },
  { value: 'Date (Ancien)', label: 'Date (Ancien)' },
  { value: 'Total (Croissant)', label: 'Total ↑' },
  { value: 'Total (Décroissant)', label: 'Total ↓' },
  { value: 'Client (A-Z)', label: 'Client (A-Z)' },
  { value: 'Client (Z-A)', label: 'Client (Z-A)' },
] as const;

const PAIEMENT_STATUS_OPTIONS = [
  { value: 'Tous', label: 'Tous les paiements' },
  { value: 'Payé', label: 'Payé' },
  { value: 'Partiel', label: 'Partiel' },
  { value: 'Non payé', label: 'Non payé' },
] as const;

interface CommandesSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatut: string;
  onFilterStatutChange: (value: string) => void;
  sortOption: string;
  onSortChange: (option: string) => void;
  isLoading?: boolean;
  filterDate: string;
  onFilterDateChange: (value: string) => void;
}

const CommandesSearchBar: React.FC<CommandesSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  filterStatut,
  onFilterStatutChange,
  sortOption,
  onSortChange,
  isLoading = false,
  filterDate,
  onFilterDateChange,
}) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const [openStatut, setOpenStatut] = useState(false);
  const [openSort, setOpenSort] = useState(false);
  const statutRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const surface = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const border = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const hoverBorder = isDark ? 'hover:border-white/[0.18]' : 'hover:border-slate-300';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const placeholder = isDark ? 'placeholder:text-slate-500' : 'placeholder:text-slate-400';
  const selectSurface = isDark ? 'bg-[#0F172A]' : 'bg-white';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statutRef.current && !statutRef.current.contains(event.target as Node)) setOpenStatut(false);
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setOpenSort(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpenStatut(false); setOpenSort(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (isSearchShortcut) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        if (searchTerm) onSearchChange('');
        else searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [searchTerm, onSearchChange]);

  if (isLoading) return (
    <div className="flex w-full flex-col gap-2.5 xl:flex-row xl:items-center animate-pulse">
      <div className="h-10 w-full rounded-lg bg-slate-200 xl:flex-1 dark:bg-white/[0.08]" />
      <div className="h-10 w-full rounded-lg bg-slate-200 xl:w-[140px] dark:bg-white/[0.08]" />
      <div className="h-10 w-full rounded-lg bg-slate-200 xl:w-[145px] dark:bg-white/[0.08]" />
    </div>
  );

  const currentStatutLabel = PAIEMENT_STATUS_OPTIONS.find(o => o.value === filterStatut)?.label || 'Tous les paiements';
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Date (Récent)';

  return (
    <div className="w-full" role="search" aria-label="Barre de recherche et filtres des commandes">
      <div className={`flex w-full flex-col gap-2.5 xl:flex-row xl:items-center ${isDark ? 'bg-[#0F172A] p-2 rounded-xl' : 'bg-transparent'}`}>

        {/* ⭐ Search */}
        <div className="relative min-w-[200px] flex-1">
          <div className="pointer-events-none absolute left-0 top-1/2 flex -translate-y-1/2 items-center justify-center pl-3">
            <Search size={18} strokeWidth={2} className={`transition-colors duration-200 ${isFocused ? 'text-brand-500 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
          </div>
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Rechercher une commande..."
            autoComplete="off"
            aria-label="Rechercher une commande"
            className={`h-10 w-full rounded-lg border ${border} ${surface} pl-10 ${searchTerm ? 'pr-20' : 'pr-16'} text-[14px] font-medium ${text} ${placeholder} outline-none shadow-sm transition-all duration-200 ${hoverBorder} ${isFocused ? 'border-brand-500 shadow-[0_0_0_3px_rgba(79,70,229,0.08)]' : ''}`}
          />
          {!searchTerm && (
            <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
              <kbd className={`rounded-md border px-2 py-0.5 text-[13.5px] font-medium shadow-sm ${isDark ? 'border-white/[0.12] bg-white/[0.06] text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                {typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd className={`rounded-md border px-2 py-0.5 text-[13.5px] font-medium shadow-sm ${isDark ? 'border-white/[0.12] bg-white/[0.06] text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>K</kbd>
            </div>
          )}
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              title="Effacer la recherche"
              aria-label="Effacer la recherche"
              className={`absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${isDark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-brand-600'}`}
            >
              <X size={15} strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:shrink-0">

          {/* ⭐⭐⭐ Input Date (calendrier) — NESORINA ny icon indigo ⭐⭐⭐ */}
          <div className="relative shrink-0">
            <input
              type="date"
              value={filterDate}
              onChange={(event) => onFilterDateChange(event.target.value)}
              aria-label="Filtrer par date"
              className={`date-input-clean h-10 w-[150px] cursor-pointer appearance-none rounded-lg border ${border} ${surface} px-3 text-[14px] font-medium ${isDark ? 'text-slate-300 [color-scheme:dark]' : 'text-slate-700'} outline-none shadow-sm transition-all duration-200 ${hoverBorder} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${filterDate ? 'pr-9' : ''}`}
            />
            {filterDate && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFilterDateChange(''); }}
                title="Effacer la date"
                aria-label="Effacer la date"
                className={`absolute right-1.5 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-colors ${isDark ? 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.12] hover:text-slate-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
              >
                <X size={13} strokeWidth={2.4} />
              </button>
            )}
          </div>

          {/* ⭐ Custom Dropdown — Statut */}
          <div className="relative shrink-0" ref={statutRef}>
            <button
              type="button"
              onClick={() => setOpenStatut(!openStatut)}
              aria-label="Filtrer par statut de paiement"
              aria-expanded={openStatut}
              className={`h-10 w-[150px] flex items-center justify-between rounded-lg border ${border} ${selectSurface} pl-3 pr-2.5 text-[14px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} outline-none shadow-sm transition-all duration-200 ${hoverBorder} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`}
            >
              <span className="truncate">{currentStatutLabel}</span>
              <ChevronDown size={15} strokeWidth={2} className={`shrink-0 transition-transform duration-200 ${openStatut ? 'rotate-180' : ''} ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            </button>
            {openStatut && (
              <ul className={`absolute top-full left-0 mt-1 w-[170px] rounded-lg border shadow-lg z-50 overflow-hidden ${isDark ? 'bg-[#0F172A] border-white/[0.12]' : 'bg-white border-slate-200'}`}>
                {PAIEMENT_STATUS_OPTIONS.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      onClick={() => { onFilterStatutChange(option.value); setOpenStatut(false); }}
                      className={`w-full text-left px-3.5 py-2 text-[14px] transition-colors ${
                        isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-50'
                      } ${
                        filterStatut === option.value
                          ? (isDark ? 'bg-brand-500/20 text-brand-400 font-semibold' : 'bg-brand-50 text-brand-600 font-semibold')
                          : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ⭐ Custom Dropdown — Tri */}
          <div className="relative shrink-0" ref={sortRef}>
            <button
              type="button"
              onClick={() => setOpenSort(!openSort)}
              aria-label="Trier les commandes"
              aria-expanded={openSort}
              className={`h-10 w-[155px] flex items-center justify-between rounded-lg border ${border} ${selectSurface} pl-9 pr-2.5 text-[14px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} outline-none shadow-sm transition-all duration-200 ${hoverBorder} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 relative`}
            >
              <ArrowUpDown size={15} strokeWidth={2} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className="truncate">{currentSortLabel}</span>
              <ChevronDown size={15} strokeWidth={2} className={`shrink-0 transition-transform duration-200 ${openSort ? 'rotate-180' : ''} ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            </button>
            {openSort && (
              <ul className={`absolute top-full left-0 mt-1 w-[180px] rounded-lg border shadow-lg z-50 overflow-hidden ${isDark ? 'bg-[#0F172A] border-white/[0.12]' : 'bg-white border-slate-200'}`}>
                {SORT_OPTIONS.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      onClick={() => { onSortChange(option.value); setOpenSort(false); }}
                      className={`w-full text-left px-3.5 py-2 text-[14px] transition-colors ${
                        isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-50'
                      } ${
                        sortOption === option.value
                          ? (isDark ? 'bg-brand-500/20 text-brand-400 font-semibold' : 'bg-brand-50 text-brand-600 font-semibold')
                          : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ⭐⭐⭐ CSS: Manafina ny native calendar picker rehefa misy date ⭐⭐⭐ */}
      <style>{`
        .date-input-clean::-webkit-calendar-picker-indicator {
          opacity: 0.5;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .date-input-clean::-webkit-calendar-picker-indicator:hover {
          opacity: 0.9;
        }
        /* Rehefa misy date (pr-9) → afeno ny native picker */
        .date-input-clean.pr-9::-webkit-calendar-picker-indicator {
          opacity: 0;
          pointer-events: none;
        }
        .date-input-clean::-webkit-inner-spin-button,
        .date-input-clean::-webkit-clear-button {
          display: none;
        }
        /* Firefox */
        .date-input-clean {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default CommandesSearchBar;