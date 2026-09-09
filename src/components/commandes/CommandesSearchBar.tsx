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
}

const CommandesSearchBar: React.FC<CommandesSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  filterStatut,
  onFilterStatutChange,
  sortOption,
  onSortChange,
  isLoading = false,
}) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // ⭐ FIX: Surface = #0F172A FOANA amin'ny dark mode
  const surface = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const border = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const hoverBorder = isDark ? 'hover:border-white/[0.18]' : 'hover:border-slate-300';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const placeholder = isDark ? 'placeholder:text-slate-500' : 'placeholder:text-slate-400';

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

  return (
    <div className="w-full" role="search" aria-label="Barre de recherche et filtres des commandes">
      {/* ⭐ FIX: Wrapper miaraka amin'ny #0F172A */}
      <div className={`flex w-full flex-col gap-2.5 xl:flex-row xl:items-center ${isDark ? 'bg-[#0F172A] p-2 rounded-xl' : 'bg-transparent'}`}>
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
            className={`h-10 w-full rounded-lg border ${border} ${surface} pl-10 ${searchTerm ? 'pr-20' : 'pr-16'} text-[14.5px] font-medium ${text} ${placeholder} outline-none shadow-sm transition-all duration-200 ${hoverBorder} ${isFocused ? 'border-brand-500 shadow-[0_0_0_3px_rgba(79,70,229,0.08)]' : ''}`}
          />
          {!searchTerm && (
            <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
              <kbd className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium shadow-sm ${isDark ? 'border-white/[0.12] bg-white/[0.06] text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                {typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium shadow-sm ${isDark ? 'border-white/[0.12] bg-white/[0.06] text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>K</kbd>
            </div>
          )}
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              title="Effacer la recherche"
              aria-label="Effacer la recherche"
              className={`absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${isDark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-brand-600'}`}
            >
              <X size={15} strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:shrink-0">
          <div className="relative shrink-0">
            <select
              value={filterStatut}
              onChange={(event) => onFilterStatutChange(event.target.value)}
              aria-label="Filtrer par statut de paiement"
              className={`h-10 w-[150px] cursor-pointer appearance-none rounded-lg border ${border} ${surface} pl-3 pr-8 text-[14px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} outline-none shadow-sm transition-all duration-200 ${hoverBorder} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`}
            >
              {PAIEMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>{option.label}</option>
              ))}
            </select>
            <ChevronDown size={14} strokeWidth={2} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>

          <div className="relative shrink-0">
            <ArrowUpDown size={15} strokeWidth={2} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <select
              value={sortOption}
              onChange={(event) => onSortChange(event.target.value)}
              aria-label="Trier les commandes"
              className={`h-10 w-[135px] cursor-pointer appearance-none rounded-lg border ${border} ${surface} pl-9 pr-8 text-[14px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} outline-none shadow-sm transition-all duration-200 ${hoverBorder} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>{option.label}</option>
              ))}
            </select>
            <ChevronDown size={14} strokeWidth={2} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandesSearchBar;