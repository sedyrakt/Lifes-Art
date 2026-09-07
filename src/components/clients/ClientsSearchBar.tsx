import React, { useEffect, useRef, useState } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const TYPE_FILTERS = [
  { value: 'Tous', label: 'Tous les clients' },
  { value: 'Particulier', label: 'Particuliers' },
  { value: 'Entreprise', label: 'Entreprises' }
] as const;

const SORT_OPTIONS = [
  { value: 'Nom (A-Z)', label: 'Nom (A-Z)' },
  { value: 'Nom (Z-A)', label: 'Nom (Z-A)' },
  { value: 'Date (Récent)', label: 'Plus récent' },
  { value: 'Date (Ancien)', label: 'Plus ancien' }
] as const;

interface ClientsSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (type: string) => void;
  sortOption: string;
  onSortChange: (option: string) => void;
}

const ClientsSearchBar: React.FC<ClientsSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  sortOption,
  onSortChange,
}) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const surface = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const border = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const hoverBorder = isDark ? 'hover:border-white/[0.18]' : 'hover:border-slate-300';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const placeholder = isDark ? 'placeholder:text-slate-500' : 'placeholder:text-slate-400';
  const iconColor = isDark ? 'text-slate-500' : 'text-slate-400';

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

  const controlBase = `h-10 rounded-lg border ${surface} ${border} ${hoverBorder} outline-none shadow-sm transition-all duration-200`;

  return (
    <div className="w-full" role="search" aria-label="Barre de recherche et filtres des clients">
      <div className="flex w-full flex-col gap-2.5 xl:flex-row xl:items-center">
      
        <div className="relative min-w-0 flex-1">
      
          <Search size={16} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isFocused ? 'text-brand-500' : iconColor}`} />
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Rechercher un client..."
            autoComplete="off"
            aria-label="Rechercher un client"
            className={`h-10 w-full rounded-lg border ${surface} ${border} ${hoverBorder} ${searchTerm ? 'pr-10' : 'pr-3'} pl-10 text-[14px] font-medium ${text} ${placeholder} outline-none shadow-sm transition-all duration-200 ${isFocused ? 'border-brand-500 shadow-[0_0_0_3px_rgba(79,70,229,0.08)]' : ''}`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              title="Effacer la recherche"
              aria-label="Effacer la recherche"
              className={`absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${isDark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-brand-600'}`}
            >
              
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 overflow-x-auto pb-0.5 xl:w-auto">
          {/* FILTER TYPE */}
          <div className="relative shrink-0">
            <select
              value={filterType}
              onChange={(event) => onFilterTypeChange(event.target.value)}
              aria-label="Filtrer par type de client"
              className={`${controlBase} w-[135px] appearance-none cursor-pointer pl-3 pr-8 text-[13px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`}
            >
              {TYPE_FILTERS.map((type) => (
                <option key={type.value} value={type.value} className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>
                  {type.label}
                </option>
              ))}
            </select>
          
            <ChevronDown size={14} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${iconColor}`} />
          </div>

         
          <div className="relative shrink-0">
            <select
              value={sortOption}
              onChange={(event) => onSortChange(event.target.value)}
              aria-label="Trier les clients"
              className={`${controlBase} w-[145px] appearance-none cursor-pointer pl-3 pr-8 text-[13px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>
                  {option.label}
                </option>
              ))}
            </select>
           
            <ChevronDown size={14} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${iconColor}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsSearchBar;