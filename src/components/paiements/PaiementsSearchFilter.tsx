// src/components/paiements/PaiementsSearchFilter.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur CommandesTable
// ⭐ fontSize : header 12px, cells 13.5px, footer 12.5px

import React from 'react';
import { Search, CalendarDays, CircleDollarSign, FileText, FileClock, ChevronDown, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { ViewButton } from './ViewButton';
import { FilterSelect } from './FilterSelect';
import { MONTHS, getEmployeeName } from '../../utils/paiementUtils';
import type { EmployePaiement } from './PaiementsModalForm';

type ViewMode = 'liste' | 'calendrier' | 'echeances' | 'bulletin';
type StatutFilter = 'Tous' | 'Brouillon' | 'Payé' | 'Non payé';

interface PaiementsSearchFilterProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  employeeFilter: number | '';
  setEmployeeFilter: (value: number | '') => void;
  monthFilter: number | '';
  setMonthFilter: (value: number | '') => void;
  yearFilter: number | '';
  setYearFilter: (value: number | '') => void;
  statutFilter: StatutFilter;
  setStatutFilter: (value: StatutFilter) => void;
  employes: EmployePaiement[];
  yearOptions: number[];
  hasActiveFilters: boolean;
  resetFilters: () => void;
}

export function PaiementsSearchFilter({
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  showFilters,
  setShowFilters,
  employeeFilter,
  setEmployeeFilter,
  monthFilter,
  setMonthFilter,
  yearFilter,
  setYearFilter,
  statutFilter,
  setStatutFilter,
  employes,
  yearOptions,
  hasActiveFilters,
  resetFilters,
}: PaiementsSearchFilterProps) {
  const { isDark } = useTheme();

  return (
    <>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search size={15} strokeWidth={2.2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un employé, référence..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[13.5px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-white/[0.12] dark:bg-[#0F172A]">
          <ViewButton active={viewMode === 'liste'} icon={<FileClock size={14} strokeWidth={2.2} />} label="Liste" onClick={() => setViewMode('liste')} />
          <ViewButton active={viewMode === 'calendrier'} icon={<CalendarDays size={14} strokeWidth={2.2} />} label="Calendrier" onClick={() => setViewMode('calendrier')} />
          <ViewButton active={viewMode === 'echeances'} icon={<CircleDollarSign size={14} strokeWidth={2.2} />} label="Échéances" onClick={() => setViewMode('echeances')} />
          <ViewButton active={viewMode === 'bulletin'} icon={<FileText size={14} strokeWidth={2.2} />} label="Bulletins" onClick={() => setViewMode('bulletin')} />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-semibold transition-colors ${
            hasActiveFilters
              ? 'border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-400'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-white/[0.06]'
          }`}
        >
          <ChevronDown size={14} strokeWidth={2.2} className={showFilters ? 'rotate-180 transition-transform' : 'transition-transform'} />Filtres
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border-[0.5px] border-slate-200 bg-white p-3 dark:border-white/[0.12] dark:bg-[#0F172A]">
          <FilterSelect label="Employé" value={employeeFilter} onChange={(v) => setEmployeeFilter(v ? Number(v) : '')}>
            <option value="">Tous les employés</option>
            {employes.map((e) => (
              <option key={e.id} value={e.id}>{getEmployeeName(e)}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Période — mois" value={monthFilter} onChange={(v) => setMonthFilter(v ? Number(v) : '')}>
            <option value="">Tous les mois</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </FilterSelect>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">Période — année</label>
            <div className="relative">
              <input
                type="number"
                min="2000"
                max="2100"
                value={yearFilter === '' ? '' : yearFilter}
                onChange={(e) => setYearFilter(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Toutes les années"
                className={`h-10 w-full rounded-lg border px-3 pr-8 text-[13.5px] outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:[color-scheme:dark] ${
                  isDark
                    ? 'bg-[#0F172A] border-white/[0.12] text-slate-100 placeholder:text-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>
          </div>

          <FilterSelect label="Statut" value={statutFilter} onChange={(v) => setStatutFilter(v as StatutFilter)}>
            <option value="Tous">Tous les statuts</option>
            <option value="Brouillon">Brouillon</option>
            <option value="Payé">Payé</option>
            <option value="Non payé">Non payé</option>
          </FilterSelect>
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/[0.06]"
            >
              <X size={13} strokeWidth={2.2} />Réinitialiser
            </button>
          </div>
        </div>
      )}
    </>
  );
}