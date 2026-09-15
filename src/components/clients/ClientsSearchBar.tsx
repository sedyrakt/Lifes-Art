// src/components/clients/ClientsSearchBar.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur CategoriesSearchBar, FournisseursSearchBar, ProduitsSearchBar
// ⭐ FONT SIZE: inputs/buttons/dropdown 14px, icons +2

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

interface MenuPosition { top?: number; bottom?: number; left?: number; right?: number; }

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

  // ⭐ Dropdown states
  const [openType, setOpenType] = useState(false);
  const [openSort, setOpenSort] = useState(false);
  const [typeMenuPos, setTypeMenuPos] = useState<MenuPosition>({});
  const [sortMenuPos, setSortMenuPos] = useState<MenuPosition>({});
  const typeRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const typeBtnRef = useRef<HTMLButtonElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);

  const surface = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const border = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const hoverBorder = isDark ? 'hover:border-white/[0.18]' : 'hover:border-slate-300';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const placeholder = isDark ? 'placeholder:text-slate-500' : 'placeholder:text-slate-400';
  const iconColor = isDark ? 'text-slate-500' : 'text-slate-400';
  const selectSurface = isDark ? 'bg-[#0F172A]' : 'bg-white';

  // ⭐ Position ho an'ny dropdown
  const computeMenuPosition = (btnRef: React.RefObject<HTMLButtonElement>): MenuPosition => {
    if (!btnRef.current) return {};
    const rect = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const MENU_WIDTH = 180;
    const MENU_HEIGHT = 200;
    const position: MenuPosition = {};

    // Ambany na ambony
    if (vh - rect.bottom < MENU_HEIGHT + 10 && rect.top > MENU_HEIGHT + 10) {
      position.bottom = vh - rect.top + 4;
    } else {
      position.top = rect.bottom + 4;
    }

    // Ha-kavanana na ha-avidy
    if (vw - rect.left < MENU_WIDTH + 10) {
      position.right = vw - rect.right;
    } else {
      position.left = rect.left;
    }
    return position;
  };

  const openTypeMenu = () => {
    setTypeMenuPos(computeMenuPosition(typeBtnRef));
    setOpenSort(false);
    setOpenType(true);
  };

  const openSortMenu = () => {
    setSortMenuPos(computeMenuPosition(sortBtnRef));
    setOpenType(false);
    setOpenSort(true);
  };

  // ⭐ Close dropdowns rehefa click ivelany na Escape
  useEffect(() => {
    if (!openType && !openSort) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (typeRef.current && !typeRef.current.contains(target) && typeBtnRef.current && !typeBtnRef.current.contains(target)) {
        setOpenType(false);
      }
      if (sortRef.current && !sortRef.current.contains(target) && sortBtnRef.current && !sortBtnRef.current.contains(target)) {
        setOpenSort(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpenType(false); setOpenSort(false); }
    };
    const handleResize = () => { setOpenType(false); setOpenSort(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [openType, openSort]);

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

  const currentTypeLabel = TYPE_FILTERS.find(t => t.value === filterType)?.label || 'Tous les clients';
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Nom (A-Z)';

  return (
    <div className="w-full" role="search" aria-label="Barre de recherche et filtres des clients">
      <div className="flex w-full flex-col gap-2.5 xl:flex-row xl:items-center">

        <div className="relative min-w-0 flex-1">
          {/* ⭐ Search icon : 16 → 18, left-3 → left-3.5 */}
          <Search size={18} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${isFocused ? 'text-brand-500' : iconColor}`} />
          {/* ⭐ Input : pl-10 → pl-11 (icon +2) */}
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
            className={`h-10 w-full rounded-lg border ${surface} ${border} ${hoverBorder} ${searchTerm ? 'pr-11' : 'pr-3'} pl-11 text-[14px] font-medium ${text} ${placeholder} outline-none shadow-sm transition-all duration-200 ${isFocused ? 'border-brand-500 shadow-[0_0_0_3px_rgba(79,70,229,0.08)]' : ''}`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              title="Effacer la recherche"
              aria-label="Effacer la recherche"
              /* ⭐ X icon : 14 → 15, right-2.5 → right-3 */
              className={`absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${isDark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-brand-600'}`}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 overflow-x-auto pb-0.5 xl:w-auto">
          {/* ⭐ Custom Dropdown — Type de client */}
          <div className="relative shrink-0" ref={typeRef}>
            <button
              ref={typeBtnRef}
              type="button"
              onClick={() => openType ? setOpenType(false) : openTypeMenu()}
              aria-label="Filtrer par type de client"
              aria-expanded={openType}
              /* ⭐ Type button : w-[135px] → w-[155px], text-[13px] → text-[14px], pr-2 → pr-2.5 */
              className={`h-10 w-[155px] flex items-center justify-between rounded-lg border ${openType ? 'border-brand-500 ring-2 ring-brand-500/10' : `${border} ${hoverBorder}`} ${selectSurface} pl-3 pr-2.5 text-[14px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} outline-none shadow-sm transition-all duration-200`}
            >
              <span className="truncate">{currentTypeLabel}</span>
              {/* ⭐ ChevronDown : 14 → 15 */}
              <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 ${openType ? 'rotate-180' : ''} ${iconColor}`} />
            </button>
          </div>

          {/* ⭐ Custom Dropdown — Tri */}
          <div className="relative shrink-0" ref={sortRef}>
            <button
              ref={sortBtnRef}
              type="button"
              onClick={() => openSort ? setOpenSort(false) : openSortMenu()}
              aria-label="Trier les clients"
              aria-expanded={openSort}
              /* ⭐ Sort button : w-[145px] → w-[165px], text-[13px] → text-[14px], pr-2 → pr-2.5 */
              className={`h-10 w-[165px] flex items-center justify-between rounded-lg border ${openSort ? 'border-brand-500 ring-2 ring-brand-500/10' : `${border} ${hoverBorder}`} ${selectSurface} pl-3 pr-2.5 text-[14px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} outline-none shadow-sm transition-all duration-200`}
            >
              <span className="truncate">{currentSortLabel}</span>
              {/* ⭐ ChevronDown : 14 → 15 */}
              <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 ${openSort ? 'rotate-180' : ''} ${iconColor}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ⭐ Portal — Dropdown Type */}
      {openType && createPortal(
        <ul
          /* ⭐ Dropdown width : 160 → 180 */
          className={`fixed z-[99999] w-[180px] rounded-lg border shadow-[0_18px_55px_rgba(15,23,42,0.35)] overflow-hidden ${isDark ? 'bg-[#0F172A] border-white/[0.12]' : 'bg-white border-slate-200'}`}
          style={{
            top: typeMenuPos.top !== undefined ? `${typeMenuPos.top}px` : undefined,
            bottom: typeMenuPos.bottom !== undefined ? `${typeMenuPos.bottom}px` : undefined,
            left: typeMenuPos.left !== undefined ? `${typeMenuPos.left}px` : undefined,
            right: typeMenuPos.right !== undefined ? `${typeMenuPos.right}px` : undefined,
          }}
        >
          {TYPE_FILTERS.map((type) => (
            <li key={type.value}>
              <button
                type="button"
                onClick={() => { onFilterTypeChange(type.value); setOpenType(false); }}
                /* ⭐ Dropdown items : text-[13px] → text-[14px], px-3 py-2 → px-3.5 py-2 */
                className={`w-full text-left px-3.5 py-2 text-[14px] transition-colors ${
                  isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-50'
                } ${
                  filterType === type.value
                    ? (isDark ? 'bg-brand-500/20 text-brand-400 font-semibold' : 'bg-brand-50 text-brand-600 font-semibold')
                    : ''
                }`}
              >
                {type.label}
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}

      {/* ⭐ Portal — Dropdown Tri */}
      {openSort && createPortal(
        <ul
          /* ⭐ Dropdown width : 160 → 180 */
          className={`fixed z-[99999] w-[180px] rounded-lg border shadow-[0_18px_55px_rgba(15,23,42,0.35)] overflow-hidden ${isDark ? 'bg-[#0F172A] border-white/[0.12]' : 'bg-white border-slate-200'}`}
          style={{
            top: sortMenuPos.top !== undefined ? `${sortMenuPos.top}px` : undefined,
            bottom: sortMenuPos.bottom !== undefined ? `${sortMenuPos.bottom}px` : undefined,
            left: sortMenuPos.left !== undefined ? `${sortMenuPos.left}px` : undefined,
            right: sortMenuPos.right !== undefined ? `${sortMenuPos.right}px` : undefined,
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => { onSortChange(option.value); setOpenSort(false); }}
                /* ⭐ Dropdown items : text-[13px] → text-[14px], px-3 py-2 → px-3.5 py-2 */
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
        </ul>,
        document.body
      )}
    </div>
  );
};

export default ClientsSearchBar;