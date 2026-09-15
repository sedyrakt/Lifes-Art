// src/components/produits/ProduitsSearchBar.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur DashboardHeader / Stats components
// ⭐ FONT SIZE: inputs/buttons 14px, dropdown items 14px, search 14px

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const SORT_OPTIONS = [
  { value: 'Nom (A-Z)', label: 'Nom (A-Z)' },
  { value: 'Nom (Z-A)', label: 'Nom (Z-A)' },
  { value: 'Prix (Croissant)', label: 'Prix ↑' },
  { value: 'Prix (Décroissant)', label: 'Prix ↓' },
  { value: 'Stock (Croissant)', label: 'Stock ↑' },
  { value: 'Stock (Décroissant)', label: 'Stock ↓' },
] as const;

interface ProduitsSearchBarProps {
  searchTerm: string; onSearchChange: (value: string) => void;
  sortOption: string; onSortChange: (option: string) => void;
  filterCategorie: string; onFilterCategorieChange: (value: string) => void;
  filterStatus: string; onFilterStatusChange: (value: string) => void;
  categories: Array<{ id: number; nom: string; }>;
  onResetFilters: () => void; hasActiveFilters: boolean;
}

const CustomSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  isDark: boolean;
}> = ({ value, onChange, options, placeholder = 'Sélectionner', icon, className = '', isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div ref={dropdownRef} className="relative">
      {/* ⭐ Button : text-[14px] (aligned) */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-700 outline-none shadow-[0_1px_2px_rgba(79,70,229,0.03)] transition-all hover:border-brand-500/40 hover:bg-brand-50/50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-slate-900 dark:text-slate-200 dark:hover:border-white/[0.18] dark:hover:bg-slate-800 ${className}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {icon && <span className="text-brand-500 dark:text-brand-500">{icon}</span>}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </div>
        {/* ⭐ Chevron : 14 → 15 */}
        <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-[999] mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-white/[0.12] dark:bg-slate-900">
          <div className="border-b border-slate-200 p-2 dark:border-white/[0.08]">
            {/* ⭐ Search input : text-[13px] → text-[14px] */}
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-[14px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-white/[0.10] dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="custom-dropdown-scroll max-h-[200px] overflow-y-auto">
            {/* ⭐ Reset button : text-[14px] (aligned) */}
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}
              className="flex w-full items-center px-3 py-2 text-left text-[14px] hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{ color: value === '' ? '#4F46E5' : '#64748B' }}
            >
              {placeholder}
            </button>
            {/* ⭐ Dropdown items : text-[14px] (aligned) */}
            {filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
                className={`flex w-full items-center px-3 py-2 text-left text-[14px] hover:bg-slate-50 dark:hover:bg-slate-800 ${value === opt.value ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'text-slate-700 dark:text-slate-200'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .custom-dropdown-scroll::-webkit-scrollbar { width: 6px; }
        .custom-dropdown-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-dropdown-scroll::-webkit-scrollbar-thumb { background: rgba(79,70,229,0.3); border-radius: 999px; }
        .custom-dropdown-scroll::-webkit-scrollbar-thumb:hover { background: rgba(79,70,229,0.5); }
        .custom-dropdown-scroll { scrollbar-width: thin; }
      `}</style>
    </div>
  );
};

const ProduitsSearchBar: React.FC<ProduitsSearchBarProps> = ({
  searchTerm, onSearchChange, sortOption, onSortChange,
  filterCategorie, onFilterCategorieChange, filterStatus, onFilterStatusChange,
  categories, onResetFilters, hasActiveFilters
}) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (isShortcut) { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        if (searchTerm) onSearchChange(''); else searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [searchTerm, onSearchChange]);

  const fieldBorder = 'border border-slate-200 dark:border-white/[0.12]';
  const fieldBackground = 'bg-white dark:bg-slate-900';
  const fieldText = 'text-slate-700 dark:text-slate-200';
  const fieldFocus = 'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10';

  return (
    <div className="mb-4 flex w-full flex-col gap-2">
      <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-[280px] flex-1">
          {/* ⭐ Search icon : 18 → 19 */}
          <Search size={19} strokeWidth={2} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-brand-500 dark:text-brand-500' : 'text-slate-400 dark:text-slate-500'}`} />
          {/* ⭐ Input : text-[14px] (aligned) */}
          <input
            ref={searchRef}
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`h-10 w-full rounded-lg ${fieldBorder} ${fieldBackground} pl-11 pr-10 text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none shadow-[0_1px_2px_rgba(79,70,229,0.03)] transition-all duration-150 hover:border-brand-500/40 dark:hover:border-white/[0.18] ${fieldFocus}`}
          />
          {!searchTerm && (
            /* ⭐ Ctrl K badge : text-[13px] → text-[13.5px] */
            <div className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[13.5px] font-medium text-slate-500 shadow-sm sm:flex dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-slate-400">
              <span>Ctrl</span><span>K</span>
            </div>
          )}
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-brand-500 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
              aria-label="Effacer la recherche"
            >
              {/* ⭐ X icon : 16 → 17 */}
              <X size={17} />
            </button>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <CustomSelect
            value={filterCategorie}
            onChange={onFilterCategorieChange}
            options={(categories || []).map((c) => ({ value: String(c.id), label: c.nom }))}
            placeholder="Catégorie"
            isDark={isDark}
            className="min-w-[140px]"
          />

          <CustomSelect
            value={filterStatus}
            onChange={onFilterStatusChange}
            options={[{ value: 'actif', label: 'Actif' }, { value: 'inactif', label: 'Inactif' }, { value: 'archive', label: 'Archive' }]}
            placeholder="Statut"
            isDark={isDark}
            className="min-w-[120px]"
          />

          <div className="relative min-w-[150px]">
            {/* ⭐ ArrowUpDown icon : 15 → 16 */}
            <ArrowUpDown size={16} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 dark:text-brand-500" />
            {/* ⭐ Sort select : text-[14px] (aligned) */}
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value)}
              className={`h-10 w-full cursor-pointer appearance-none rounded-lg ${fieldBorder} ${fieldBackground} pl-9 pr-3 text-[14px] ${fieldText} outline-none shadow-[0_1px_2px_rgba(79,70,229,0.03)] transition-all hover:border-brand-500/40 hover:bg-brand-50/50 dark:hover:border-white/[0.18] dark:hover:bg-slate-800 ${fieldFocus}`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProduitsSearchBar;