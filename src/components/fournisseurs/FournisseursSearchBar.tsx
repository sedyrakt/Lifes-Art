import React, { useEffect, useRef, useState } from 'react';
import { Search, X, List, ArrowUpDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const SORT_OPTIONS = [
  { value: 'Nom (A-Z)', label: 'Nom (A-Z)' },
  { value: 'Nom (Z-A)', label: 'Nom (Z-A)' },
  { value: 'Date (Récent)', label: 'Plus récent' },
  { value: 'Date (Ancien)', label: 'Plus ancien' }
] as const;

interface FournisseursSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortOption: string;
  onSortChange: (option: string) => void;
}

const FournisseursSearchBar: React.FC<FournisseursSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  sortOption,
  onSortChange,
}) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const backgroundColor = isDark ? 'bg-slate-900' : 'bg-white';
  const inputTextColor = isDark ? 'text-slate-100' : 'text-slate-900';
  const mutedColor = isDark ? 'text-slate-500' : 'text-slate-400';

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (isShortcut) { event.preventDefault(); searchRef.current?.focus(); searchRef.current?.select(); }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        if (searchTerm) onSearchChange(''); else searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [searchTerm, onSearchChange]);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-[280px] flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search size={18} strokeWidth={2} className={`transition-colors duration-200 ${isFocused ? 'text-brand-500 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
          </div>
          <input
            ref={searchRef}
            type="text"
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`h-10 w-full rounded-lg border ${borderColor} ${backgroundColor} pl-11 pr-10 text-[14px] ${inputTextColor} placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none shadow-[0_1px_2px_rgba(79,70,229,0.04)] transition-all duration-200 ${isFocused ? 'border-brand-500 shadow-[0_0_0_3px_rgba(79,70,229,0.08)]' : 'hover:border-slate-300 dark:hover:border-white/[0.18]'}`}
          />
          {!searchTerm && (
            <div className={`pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border px-1.5 py-0.5 sm:flex ${isDark ? 'border-white/[0.12] bg-white/[0.06]' : 'border-slate-200 bg-slate-50'} text-[12px] font-medium ${mutedColor} shadow-sm`}>
              <span>{typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘' : 'Ctrl'}</span>
              <span>K</span>
            </div>
          )}
          {searchTerm && (
            <button
              type="button"
              aria-label="Effacer la recherche"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[150px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
              <ArrowUpDown size={15} strokeWidth={2} className="text-brand-500 dark:text-brand-400" />
            </div>
            <select
              value={sortOption}
              onChange={(event) => onSortChange(event.target.value)}
              className={`h-10 w-full cursor-pointer appearance-none rounded-lg border ${borderColor} ${backgroundColor} pl-9 pr-8 text-[14px] ${isDark ? 'text-slate-200' : 'text-slate-700'} outline-none shadow-[0_1px_2px_rgba(79,70,229,0.04)] transition-all duration-200 hover:border-slate-300 dark:hover:border-white/[0.18] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="text-slate-400 dark:text-slate-500">
                <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className={`flex shrink-0 items-center rounded-lg border ${borderColor} ${backgroundColor} p-1 shadow-[0_1px_2px_rgba(79,70,229,0.04)]`}>
            <button
              type="button"
              aria-label="Vue tableau"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[14px] transition-all duration-150 bg-brand-50 text-brand-600 shadow-sm dark:bg-brand-500/10 dark:text-brand-400"
            >
              <List size={15} strokeWidth={2} />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FournisseursSearchBar;