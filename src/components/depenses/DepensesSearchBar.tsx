// src/components/depenses/DepensesSearchBar.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur les autres SearchBars
// ⭐ FONT SIZE: +0.5px partout (input 14.5px, kbd 14px, selects 14.5px)
// ⭐ BORDER RADIUS: rounded-lg partout (mifanaraka amin'ny SearchBars rehetra)

import React, { useEffect, useRef, useState } from 'react';
import { Search, X, ArrowUpDown, Tag, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const SORT_OPTIONS = [
  { value: 'Date (Récent)', label: 'Date (Récent)' },
  { value: 'Date (Ancien)', label: 'Date (Ancien)' },
  { value: 'Montant (Croissant)', label: 'Montant ↑' },
  { value: 'Montant (Décroissant)', label: 'Montant ↓' },
  { value: 'Catégorie (A-Z)', label: 'Catégorie (A-Z)' },
  { value: 'Catégorie (Z-A)', label: 'Catégorie (Z-A)' },
] as const;

interface DepensesSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterCategorie: string;
  onFilterCategorieChange: (value: string) => void;
  sortOption: string;
  onSortChange: (option: string) => void;
  categories: string[];
}

const DepensesSearchBar: React.FC<DepensesSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  filterCategorie,
  onFilterCategorieChange,
  sortOption,
  onSortChange,
  categories,
}) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const surface = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const border = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const hoverBorder = isDark ? 'hover:border-white/[0.18]' : 'hover:border-slate-300';
  const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
  const selectTextColor = isDark ? 'text-slate-200' : 'text-slate-700';
  const mutedColor = isDark ? 'text-slate-500' : 'text-slate-400';
  const placeholderColor = isDark ? 'placeholder:text-slate-500' : 'placeholder:text-slate-400';

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (isSearchShortcut) { event.preventDefault(); searchRef.current?.focus(); searchRef.current?.select(); }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        if (searchTerm) onSearchChange(''); else searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [searchTerm, onSearchChange]);

  return (
    <div className="w-full" role="search" aria-label="Barre de recherche et filtres des dépenses">
      <div className="flex w-full flex-col gap-2.5 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {/* ⭐ Search icon : 18 (aligned) */}
            <Search size={18} strokeWidth={2} className={`transition-colors duration-200 ${isFocused ? 'text-brand-500 dark:text-brand-400' : mutedColor}`} />
          </div>
          {/* ⭐ Input : text-[14px] → text-[14.5px] (+0.5) */}
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Rechercher une dépense..."
            autoComplete="off"
            aria-label="Rechercher une dépense"
            className={`h-10 w-full rounded-lg border ${border} ${surface} pl-10 ${searchTerm ? 'pr-11' : 'pr-20'} text-[14.5px] font-medium ${textColor} ${placeholderColor} outline-none shadow-sm transition-all duration-200 ${hoverBorder} ${isFocused ? 'border-brand-500 shadow-[0_0_0_3px_rgba(79,70,229,0.08)]' : ''}`}
          />
          {!searchTerm && (
            /* ⭐ Kbd badges : text-[13.5px] → text-[14px] (+0.5) */
            <div className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
              <kbd className={`rounded-md border px-2 py-0.5 text-[14px] font-medium shadow-sm ${isDark ? 'border-white/[0.12] bg-white/[0.06] text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                {typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd className={`rounded-md border px-2 py-0.5 text-[14px] font-medium shadow-sm ${isDark ? 'border-white/[0.12] bg-white/[0.06] text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>K</kbd>
            </div>
          )}
          {searchTerm && (
            <button
              type="button"
              title="Effacer la recherche"
              aria-label="Effacer la recherche"
              onClick={() => onSearchChange('')}
              className={`absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${isDark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-brand-600'}`}
            >
              {/* ⭐ X icon : 15 (aligned) */}
              <X size={15} strokeWidth={2} />
            </button>
          )}
        </div>
        <div className="flex w-full shrink-0 items-center gap-2 overflow-x-auto pb-0.5 xl:w-auto xl:overflow-visible">
          <div className="relative shrink-0">
            {/* ⭐ Tag icon : 15 (aligned) */}
            <Tag size={15} strokeWidth={2} className={`pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 ${mutedColor}`} />
            <select
              value={filterCategorie}
              onChange={(event) => onFilterCategorieChange(event.target.value)}
              aria-label="Filtrer par catégorie"
              /* ⭐ Categorie select : text-[14px] → text-[14.5px] (+0.5) */
              className={`h-10 w-[155px] cursor-pointer appearance-none rounded-lg border ${border} ${surface} pl-9 pr-8 text-[14.5px] font-medium ${selectTextColor} outline-none shadow-sm transition-all duration-200 ${hoverBorder} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`}
            >
              <option value="" className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>Catégorie</option>
              {categories.map((category) => (
                <option key={category} value={category} className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>{category}</option>
              ))}
            </select>
            {/* ⭐ ChevronDown : 15 (aligned) */}
            <ChevronDown size={15} strokeWidth={2} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${mutedColor}`} />
          </div>
          <div className="relative shrink-0">
            {/* ⭐ ArrowUpDown icon : 15 (aligned) */}
            <ArrowUpDown size={15} strokeWidth={2} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${mutedColor}`} />
            <select
              value={sortOption}
              onChange={(event) => onSortChange(event.target.value)}
              aria-label="Trier les dépenses"
              /* ⭐ Sort select : text-[14px] → text-[14.5px] (+0.5) */
              className={`h-10 w-[175px] cursor-pointer appearance-none rounded-lg border ${border} ${surface} pl-9 pr-8 text-[14.5px] font-medium ${selectTextColor} outline-none shadow-sm transition-all duration-200 ${hoverBorder} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>{option.label}</option>
              ))}
            </select>
            {/* ⭐ ChevronDown : 15 (aligned) */}
            <ChevronDown size={15} strokeWidth={2} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${mutedColor}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepensesSearchBar;