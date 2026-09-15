// src/components/dashboard/DashboardHeader.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur CommandesTable
// ⭐ CLEAN: Nesorina ny border left indigo sy ny border rehetra
// ⭐ FONT SIZE: nampitomboina (h1 20px, buttons/inputs 14px, badge 12.5px)

import React from 'react';
import {
  CalendarDays, ChevronDown, RefreshCw, Search,
  FileSpreadsheet, FileText, FileDown, Download, XCircle,
} from 'lucide-react';
import { DateInput } from './DateInput';
import { DateRangeType } from '../../hooks/useDashboardData';

interface PeriodOption {
  value: DateRangeType;
  label: string;
}

interface DashboardHeaderProps {
  isDark: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  dateRangeLabel: string;
  dateRange: DateRangeType;
  periodOptions: PeriodOption[];
  setDateRange: (v: DateRangeType) => void;
  customStartDate: string;
  setCustomStartDate: (v: string) => void;
  customEndDate: string;
  setCustomEndDate: (v: string) => void;
  showPeriodMenu: boolean;
  setShowPeriodMenu: React.Dispatch<React.SetStateAction<boolean>>;
  showExportMenu: boolean;
  setShowExportMenu: React.Dispatch<React.SetStateAction<boolean>>;
  exporting: boolean;
  handleExport: (format: 'excel' | 'pdf' | 'csv') => void;
  handleRefresh: () => void;
  refreshing: boolean;
  totalProduits: number;
  periodMenuRef: React.RefObject<HTMLDivElement | null>;
  exportMenuRef: React.RefObject<HTMLDivElement | null>;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isDark, searchTerm, setSearchTerm, dateRangeLabel, dateRange, periodOptions,
  setDateRange, customStartDate, setCustomStartDate, customEndDate, setCustomEndDate,
  showPeriodMenu, setShowPeriodMenu, showExportMenu, setShowExportMenu, exporting,
  handleExport, handleRefresh, refreshing, totalProduits, periodMenuRef, exportMenuRef,
}) => {
  return (
    <div
      className={`group relative z-50 mb-4 flex flex-col gap-3 rounded-xl shadow-sm transition-colors duration-200 md:flex-row md:items-center md:justify-between px-3 py-2.5 ${isDark ? 'bg-[#0F172A]' : 'bg-white'}`}
    >
      {/* ⭐ Titre + date (natsotra) */}
      <div className="relative z-10 flex min-w-0 items-center gap-3">
        {/* ⭐ h1 : 18px → 20px */}
        <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 dark:text-slate-100">
          Tableau de bord
        </h1>
        {/* ⭐ Badge : 11.5px → 12.5px */}
        <span className="inline-flex items-center rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[12.5px] font-medium leading-tight text-brand-600 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-400">
          {dateRangeLabel}
        </span>
      </div>

      {/* ⭐ Actions */}
      <div className="relative z-20 flex w-full shrink-0 items-center gap-2 md:w-auto">
        {/* Search */}
        <div className="relative hidden md:block">
          {/* ⭐ Input : 13px → 14px */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher..."
            className="h-9 w-[180px] rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-[14px] text-slate-700 outline-none transition-colors placeholder:text-slate-400 hover:border-brand-500/30 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          {/* ⭐ Search icon : 14 → 15 */}
          <Search size={15} strokeWidth={2.2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
              title="Effacer"
              aria-label="Effacer la recherche"
            >
              {/* ⭐ X icon : 13 → 14 */}
              <XCircle size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>

        {/* Export */}
        <div ref={exportMenuRef} className="relative z-[99999]">
          {/* ⭐ Export button : 13px → 14px */}
          <button
            type="button"
            onClick={() => setShowExportMenu((v) => !v)}
            disabled={exporting}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:border-brand-500/30 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-brand-500/10`}
          >
            {/* ⭐ Icons : 14 → 15 */}
            {exporting ? <RefreshCw size={15} strokeWidth={2.2} className="animate-spin" /> : <Download size={15} strokeWidth={2.2} />}
            <span className="hidden sm:inline">Exporter</span>
          </button>

          {showExportMenu && (
            <div className={`absolute right-0 top-full z-[99999] mt-2 w-[200px] overflow-hidden rounded-xl border-[0.5px] py-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.35)] ${isDark ? 'border-white/[0.10] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}>
              {/* ⭐ Menu items : 13px → 14px */}
              <button type="button" onClick={() => handleExport('excel')} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] font-medium text-slate-700 transition-colors hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-500/10">
                {/* ⭐ Icon container : h-6 w-6 → h-7 w-7 */}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"><FileSpreadsheet size={14} strokeWidth={2.2} /></span>
                <span>Excel</span>
              </button>
              <button type="button" onClick={() => handleExport('pdf')} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] font-medium text-slate-700 transition-colors hover:bg-red-50 dark:text-slate-200 dark:hover:bg-red-500/10">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"><FileText size={14} strokeWidth={2.2} /></span>
                <span>PDF</span>
              </button>
              <button type="button" onClick={() => handleExport('csv')} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] font-medium text-slate-700 transition-colors hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-brand-500/10">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"><FileDown size={14} strokeWidth={2.2} /></span>
                <span>CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={handleRefresh}
          title="Actualiser"
          aria-label="Actualiser"
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-slate-600 transition-colors hover:border-brand-500/30 hover:bg-brand-50 hover:text-brand-600 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-400 dark:hover:bg-brand-500/10`}
        >
          {/* ⭐ Refresh icon : 14 → 15 */}
          <RefreshCw size={15} strokeWidth={2.2} className={refreshing ? 'animate-spin' : ''} />
        </button>

        {/* Period */}
        <div ref={periodMenuRef} className="relative z-[99999] flex-1 md:flex-none">
          {/* ⭐ Period button : 13px → 14px */}
          <button
            type="button"
            onClick={() => setShowPeriodMenu((v) => !v)}
            className={`inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border px-3 text-[14px] font-medium text-slate-700 transition-colors hover:border-brand-500/30 hover:bg-brand-50 hover:text-brand-600 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-brand-500/10 md:w-auto`}
          >
            {/* ⭐ Calendar icon : 14 → 15 */}
            <CalendarDays size={15} strokeWidth={2.2} />
            <span className="capitalize">{dateRangeLabel}</span>
            {/* ⭐ Chevron : 13 → 14 */}
            <ChevronDown size={14} strokeWidth={2.2} className={`text-slate-500 transition-transform ${showPeriodMenu ? 'rotate-180' : ''}`} />
          </button>

          {showPeriodMenu && (
            <div className={`absolute right-0 top-full z-[99999] mt-2 w-[290px] overflow-hidden rounded-xl border-[0.5px] p-2 shadow-[0_18px_55px_rgba(15,23,42,0.35)] ${isDark ? 'border-white/[0.10] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}>
              <div className="grid grid-cols-2 gap-1">
                {periodOptions.map((option) => {
                  const isActive = dateRange === option.value;
                  const isCustom = option.value === 'custom';
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => { setDateRange(option.value); if (!isCustom) setShowPeriodMenu(false); }}
                      /* ⭐ Menu items : 13px → 14px */
                      className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-[14px] transition-colors ${isActive ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'} ${isCustom ? 'col-span-2' : ''}`}
                    >
                      <span className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full border ${isActive ? 'border-brand-500 bg-brand-500' : 'border-slate-300 dark:border-slate-600'}`}>
                        {isActive && <span className="h-1 w-1 rounded-full bg-white" />}
                      </span>
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              {dateRange === 'custom' && (
                <div className={`mt-2 rounded-md border p-2.5 ${isDark ? 'border-brand-500/25 bg-brand-500/[0.06]' : 'border-brand-200 bg-brand-50'}`}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      {/* ⭐ Label : 11px → 12px */}
                      <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-500">Du</label>
                      <DateInput value={customStartDate} max={customEndDate || undefined} onChange={setCustomStartDate} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-500">Au</label>
                      <DateInput value={customEndDate} min={customStartDate || undefined} onChange={setCustomEndDate} />
                    </div>
                  </div>
                  {customStartDate && customEndDate && (
                    <button
                      type="button"
                      onClick={() => setShowPeriodMenu(false)}
                      /* ⭐ Appliquer button : 12.5px → 13.5px */
                      className="mt-2 w-full rounded-md bg-brand-500 px-2.5 py-1.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-600"
                    >
                      Appliquer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};