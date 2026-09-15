// MouvementsHeader.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur DashboardHeader, ProduitsHeader, CategoriesHeader, EntreesHeader, EmployesHeader, PaiementsHeader
// ⭐ FONT SIZE: h1 20px, subtitle 13px, buttons 14px, menu items 14px

import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, FileSpreadsheet, FileText, File as FileCsv, ChevronDown, X, Check, Calendar } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { ExportPeriod } from '../../hooks/useMouvementsData';

interface MouvementsHeaderProps {
  onPrint: () => void;
  onExport: (format: 'excel' | 'pdf' | 'csv', period: ExportPeriod, customDate: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  totalItems?: number;
}

const PERIOD_OPTIONS: { value: ExportPeriod; label: string }[] = [
  { value: 'aujourdhui', label: "Aujourd'hui" },
  { value: 'hier', label: 'Hier' },
  { value: 'semaine', label: 'Cette semaine' },
  { value: 'mois', label: 'Ce mois' },
  { value: 'annee', label: 'Cette année' },
  { value: 'custom', label: 'Date spécifique' },
];

const MouvementsHeader: React.FC<MouvementsHeaderProps> = ({ onPrint, onExport, refreshing = false, onRefresh, totalItems }) => {
  const { isDark } = useTheme();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>('mois');
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';

  useEffect(() => {
    if (!showExportMenu) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) setShowExportMenu(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showExportMenu]);

  // ⭐ Export item : 13.5px → 14px
  const exportItemClass = `group flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-[14px] font-medium text-slate-700 transition-colors hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-brand-500/10`;

  const getIconStyle = (type: 'excel' | 'pdf' | 'csv') => {
    switch (type) {
      case 'excel': return { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' };
      case 'pdf': return { bg: 'bg-red-100 dark:bg-red-500/15', text: 'text-red-600 dark:text-red-400' };
      case 'csv': return { bg: 'bg-sky-100 dark:bg-sky-500/15', text: 'text-sky-600 dark:text-sky-400' };
      default: return { bg: 'bg-slate-100 dark:bg-white/[0.05]', text: 'text-slate-600 dark:text-slate-400' };
    }
  };

  const currentPeriodLabel = PERIOD_OPTIONS.find(o => o.value === selectedPeriod)?.label || 'période';

  return (
    <header className="mb-4 w-full relative z-[100]">
      <div className={`group relative flex flex-col gap-3 rounded-xl border-[0.5px] shadow-sm transition-colors duration-200 md:flex-row md:items-center md:justify-between px-3 py-2.5 ${isDark ? 'bg-[#0F172A]' : 'bg-white'} ${borderColor}`}>
        <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500" />

        <div className="relative z-10 flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            {/* ⭐ h1 : 18px → 20px */}
            <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 dark:text-slate-100">Mouvements de stock</h1>
            {totalItems !== undefined && (
              // ⭐ Badge : 11.5px → 12.5px, min-w 24 → 26
              <span className="inline-flex min-w-[26px] items-center justify-center rounded-md border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-[12.5px] font-semibold leading-tight text-brand-600 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-400">{totalItems}</span>
            )}
          </div>
          {/* ⭐ Subtitle : 12.5px → 13px */}
          <p className="mt-0.5 text-[13px] font-medium leading-tight text-slate-500 dark:text-slate-400">Suivez les entrées, sorties et ajustements.</p>
        </div>

        <div className="relative z-10 flex w-full shrink-0 items-center gap-2 md:w-auto">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 ${borderColor} ${isDark ? 'bg-[#0F172A]' : 'bg-white'}`}
              aria-label="Actualiser les mouvements"
              title="Actualiser"
            >
              {/* ⭐ Icon : 15 → 16 */}
              <RefreshCw size={16} strokeWidth={2.2} className={refreshing ? 'animate-spin' : ''} />
            </button>
          )}

          <div className="relative z-[200]" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu(prev => !prev)}
              aria-expanded={showExportMenu}
              aria-haspopup="menu"
              /* ⭐ Button : 13px → 14px */
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:scale-[0.98]"
            >
              {/* ⭐ Icon : 15 → 16 */}
              <Download size={16} strokeWidth={2.2} />
              <span>Exporter</span>
              {/* ⭐ Chevron : 13 → 14 */}
              <ChevronDown size={14} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div role="menu" className={`absolute right-0 top-full mt-2 w-[320px] overflow-hidden rounded-xl border-[0.5px] py-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.35)] animate-in fade-in zoom-in-95 duration-100 ${isDark ? 'border-white/[0.10] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}>
                <div className={`flex items-center justify-between border-b px-3 py-2.5 ${borderColor}`}>
                  <div className="flex items-center gap-2">
                    {/* ⭐ Icon : 13 → 14 */}
                    <Download size={14} strokeWidth={2.2} className="text-brand-500 dark:text-brand-400" />
                    {/* ⭐ Header label : 11.5px → 12px */}
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Exporter les données</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(false)}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700/30 dark:hover:text-slate-200"
                    aria-label="Fermer"
                  >
                    {/* ⭐ Icon : 13 → 14 */}
                    <X size={14} strokeWidth={2.2} />
                  </button>
                </div>

                {/* Sélection de la période */}
                <div className={`border-b px-2.5 py-2 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                  {/* ⭐ Section label : 11.5px → 12px */}
                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Période</p>
                  <div className="grid grid-cols-1 gap-1">
                    {PERIOD_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedPeriod(opt.value)}
                        /* ⭐ Menu items : 13.5px → 14px */
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[14px] font-medium transition-colors ${
                          selectedPeriod === opt.value
                            ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/30'
                        }`}
                      >
                        <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                          selectedPeriod === opt.value ? 'border-brand-500 bg-brand-500' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {selectedPeriod === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Date picker raha custom */}
                  {selectedPeriod === 'custom' && (
                    <div className={`mt-2 flex items-center gap-2 rounded-md border px-2 py-1.5 ${isDark ? 'border-white/[0.10]' : 'border-slate-200'}`}>
                      {/* ⭐ Icon : 13 → 14 */}
                      <Calendar size={14} strokeWidth={2.2} className="text-brand-500" />
                      <input
                        type="date"
                        value={selectedCustomDate}
                        onChange={(e) => setSelectedCustomDate(e.target.value)}
                        /* ⭐ Input : 13.5px → 14px */
                        className="w-full bg-transparent text-[14px] font-medium text-slate-700 outline-none dark:text-slate-200"
                      />
                    </div>
                  )}
                </div>

                {/* Format d'export */}
                <button type="button" role="menuitem" onClick={() => { onExport('excel', selectedPeriod, selectedCustomDate); setShowExportMenu(false); }} className={exportItemClass}>
                  {/* ⭐ Icon container : h-6 w-6 → h-7 w-7 */}
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('excel').bg} ${getIconStyle('excel').text}`}>
                    {/* ⭐ Icon : 14 → 15 */}
                    <FileSpreadsheet size={15} strokeWidth={2.2} />
                  </span>
                  {/* ⭐ Période label : 11.5px → 12px */}
                  <span>Excel <span className="ml-1 text-[12px] text-slate-400 dark:text-slate-500">· {currentPeriodLabel}</span></span>
                </button>

                <button type="button" role="menuitem" onClick={() => { onExport('pdf', selectedPeriod, selectedCustomDate); setShowExportMenu(false); }} className={exportItemClass}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('pdf').bg} ${getIconStyle('pdf').text}`}>
                    <FileText size={15} strokeWidth={2.2} />
                  </span>
                  <span>PDF <span className="ml-1 text-[12px] text-slate-400 dark:text-slate-500">· {currentPeriodLabel}</span></span>
                </button>

                <button type="button" role="menuitem" onClick={() => { onExport('csv', selectedPeriod, selectedCustomDate); setShowExportMenu(false); }} className={exportItemClass}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('csv').bg} ${getIconStyle('csv').text}`}>
                    <FileCsv size={15} strokeWidth={2.2} />
                  </span>
                  <span>CSV <span className="ml-1 text-[12px] text-slate-400 dark:text-slate-500">· {currentPeriodLabel}</span></span>
                </button>

                <div className={`mt-1 border-t px-3 py-2 ${borderColor}`}>
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(false)}
                    /* ⭐ Close button : 11.5px → 12px */
                    className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-medium text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700/30 dark:hover:text-slate-300"
                  >
                    {/* ⭐ Icon : 12 → 13 */}
                    <Check size={13} strokeWidth={2.2} />Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MouvementsHeader;