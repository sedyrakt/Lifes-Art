import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Grid, List, ArrowUpDown} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const SORT_OPTIONS = [{ value: 'Nom (A-Z)', label: 'Nom (A-Z)' }, { value: 'Nom (Z-A)', label: 'Nom (Z-A)' }, { value: 'Date (Récent)', label: 'Plus récent' }, { value: 'Date (Ancien)', label: 'Plus ancien' }] as const;

interface CategoriesSearchBarProps { searchTerm: string; onSearchChange: (value: string) => void; sortOption: string; onSortChange: (option: string) => void; viewMode: 'table' | 'grid'; onViewModeChange: (mode: 'table' | 'grid') => void; }

const CategoriesSearchBar: React.FC<CategoriesSearchBarProps> = ({ searchTerm, onSearchChange, sortOption, onSortChange, viewMode, onViewModeChange }) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

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

  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const hoverBorderColor = isDark ? 'hover:border-white/[0.18]' : 'hover:border-slate-300';
  const backgroundColor = isDark ? 'bg-slate-900' : 'bg-white';
  const textColor = isDark ? 'text-slate-200' : 'text-slate-700';

  return (<div className="w-full" role="search" aria-label="Barre de recherche et filtres des catégories">
    <div className="flex w-full items-center gap-2.5">
      <div className="relative min-w-[100px] flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Search size={18} strokeWidth={2} className={`transition-colors duration-150 ${isFocused ? 'text-brand-500 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} /></div>
        <input ref={searchRef} type="text" placeholder="Rechercher une catégorie..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} className={`h-10 w-full rounded-lg border ${borderColor} ${backgroundColor} pl-10 pr-10 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 ${hoverBorderColor} ${isFocused ? 'border-brand-500 shadow-[0_0_0_3px_rgba(79,70,229,0.10)]' : ''}`} aria-label="Rechercher une catégorie" />
        {!searchTerm && (<div className={`pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border ${borderColor} ${isDark ? 'bg-slate-800/70' : 'bg-slate-50'} px-1.5 py-0.5 text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} shadow-sm sm:flex`}><span>{typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘' : 'Ctrl'}</span><span>K</span></div>)}
        {searchTerm && (<button type="button" onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20" aria-label="Effacer la recherche"><X size={14} /></button>)}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative shrink-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5"><ArrowUpDown size={14} strokeWidth={2} className="text-brand-500 dark:text-brand-500" /></div>
          <select value={sortOption} onChange={(e) => onSortChange(e.target.value)} className={`h-10 min-w-[110px] cursor-pointer appearance-none rounded-lg border ${borderColor} ${backgroundColor} pl-8 pr-7 text-[14px] ${textColor} outline-none shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 ${hoverBorderColor} ${!isDark ? 'hover:bg-slate-50' : 'dark:hover:bg-slate-800/60'} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`} aria-label="Trier les catégories">{SORT_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}</select>
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center"><svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="text-slate-400 dark:text-slate-500"><path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        </div>
        <div className={`flex shrink-0 items-center rounded-lg border ${borderColor} ${backgroundColor} p-0.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${hoverBorderColor}`} role="group" aria-label="Changer la vue">
          <button type="button" onClick={() => onViewModeChange('table')} className={`flex h-7 cursor-pointer items-center gap-1 rounded-md px-2.5 text-[14px] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${viewMode === 'table' ? 'bg-brand-50 text-brand-600 shadow-sm dark:bg-brand-500/10 dark:text-brand-400' : 'text-slate-500 hover:bg-brand-50 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'}`} title="Vue tableau" aria-label="Vue tableau" aria-pressed={viewMode === 'table'}><List size={14} strokeWidth={2} /><span>Table</span></button>
          <button type="button" onClick={() => onViewModeChange('grid')} className={`flex h-7 cursor-pointer items-center gap-1 rounded-md px-2.5 text-[14px] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${viewMode === 'grid' ? 'bg-brand-50 text-brand-600 shadow-sm dark:bg-brand-500/10 dark:text-brand-400' : 'text-slate-500 hover:bg-brand-50 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'}`} title="Vue grille" aria-label="Vue grille" aria-pressed={viewMode === 'grid'}><Grid size={14} strokeWidth={2} /><span>Grille</span></button>
        </div>
      </div>
    </div>
  </div>);
};
export default CategoriesSearchBar;