import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Download, FileSpreadsheet, FileText, File as FileCsv, ChevronDown, X, Check, Calendar, BarChart3, Package, ShoppingCart } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { ExportPeriod } from '../../hooks/useRapportsData';

interface RapportsHeaderProps {
  selectedDate: Date;
  granularity: 'jour' | 'semaine' | 'mois' | 'annee';
  onDateChange: (date: Date) => void;
  onGranularityChange: (granularity: 'jour' | 'semaine' | 'mois' | 'annee') => void;
  onToday: () => void;
  onRefresh: () => void;
  onExportStats: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  onExportTopProduits: () => void;
  onExportCommandes: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  exportPeriod: ExportPeriod;
  onExportPeriodChange: (period: ExportPeriod) => void;
  exportCustomDate: string;
  onExportCustomDateChange: (date: string) => void;
}

const PERIOD_OPTIONS: { value: ExportPeriod; label: string }[] = [
  { value: 'aujourdhui', label: "Aujourd'hui" },
  { value: 'hier', label: 'Hier' },
  { value: 'semaine', label: 'Cette semaine' },
  { value: 'mois', label: 'Ce mois' },
  { value: 'annee', label: 'Cette année' },
  { value: 'custom', label: 'Date spécifique' },
];

const RapportsHeader: React.FC<RapportsHeaderProps> = ({
  selectedDate,
  granularity,
  onDateChange,
  onGranularityChange,
  onToday,
  onRefresh,
  onExportStats,
  onExportPDF,
  onExportCSV,
  onExportTopProduits,
  onExportCommandes,
  isLoading = false,
  isRefreshing = false,
  exportPeriod,
  onExportPeriodChange,
  exportCustomDate,
  onExportCustomDateChange,
}) => {
  const { isDark } = useTheme();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cardBg = isDark ? 'bg-[#0F172A]' : 'bg-white';

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

  // FontSize 14px ho an'ny export items
  const exportItemClass = `group flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30`;

  const getIconStyle = (type: 'excel' | 'pdf' | 'csv' | 'top' | 'commandes') => {
    switch (type) {
      case 'excel': return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' };
      case 'pdf': return { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' };
      case 'csv': return { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' };
      case 'top': return { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' };
      case 'commandes': return { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' };
      default: return { bg: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' };
    }
  };

  return (
    <div className="relative z-[100] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Titre et sous-titre */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-white">Rapports & Analyses</h1>
          {isRefreshing && (
            <span className="inline-flex items-center rounded-full bg-brand-500 px-2 py-0.5 text-[12px] font-bold text-white dark:bg-brand-500/10 dark:text-brand-400">
              Actualisation...
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Tableau de bord financier et suivi des performances</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading || isRefreshing}
          title="Actualiser"
          aria-label="Actualiser les rapports"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-400 dark:hover:bg-white/[0.06]"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        </button>

        {/* ⭐ Dropdown Export (2 colonnes: Période eo ankavia, Format eo ankavanana) */}
        <div className="relative z-[200]" ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setShowExportMenu(prev => !prev)}
            aria-expanded={showExportMenu}
            aria-haspopup="menu"
            className="flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-4 text-[14px] font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.98]"
          >
            <Download size={16} />
            <span>Exporter</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>

          {showExportMenu && (
            <div role="menu" className={`absolute right-0 top-full mt-2 w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-100 dark:border-white/[0.12] dark:bg-[#0F172A] dark:shadow-2xl`}>
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Download size={14} className="text-brand-500" />
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Exporter les données</span>
                </div>
                <button type="button" onClick={() => setShowExportMenu(false)} className="rounded-md p-1 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700/30 dark:hover:text-slate-200">
                  <X size={14} />
                </button>
              </div>

              {/* ⭐ FLEXBOX: Raha misaraka roa ny zava-drehetra */}
              <div className="flex w-full">
                {/* LEFT BOX: Période */}
                <div className="w-1/2 border-r border-slate-200 p-3 dark:border-white/[0.08]">
                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Période</p>
                  <div className="grid grid-cols-1 gap-1">
                    {PERIOD_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onExportPeriodChange(opt.value)}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[14px] font-medium transition-colors ${
                          exportPeriod === opt.value
                            ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/30'
                        }`}
                      >
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          exportPeriod === opt.value ? 'border-brand-500 bg-brand-500' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {exportPeriod === opt.value && <span className="h-2 w-2 rounded-full bg-white" />}
                        </span>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Date picker raha custom */}
                  {exportPeriod === 'custom' && (
                    <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 dark:border-white/[0.1]">
                      <Calendar size={14} className="text-brand-500" />
                      <input
                        type="date"
                        value={exportCustomDate}
                        onChange={(e) => onExportCustomDateChange(e.target.value)}
                        className="w-full bg-transparent text-[14px] font-medium text-slate-700 outline-none dark:text-slate-200"
                      />
                    </div>
                  )}
                </div>

                {/* RIGHT BOX: Format d'export */}
                <div className="w-1/2 p-2.5">
                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Format</p>
                  <button type="button" role="menuitem" onClick={() => { onExportStats(); setShowExportMenu(false); }} className={exportItemClass}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('excel').bg} ${getIconStyle('excel').text}`}>
                      <FileSpreadsheet size={15} />
                    </span>
                    <span className="text-[14px] text-slate-700 dark:text-slate-200">Excel (Stats)</span>
                  </button>

                  <button type="button" role="menuitem" onClick={() => { onExportPDF(); setShowExportMenu(false); }} className={exportItemClass}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('pdf').bg} ${getIconStyle('pdf').text}`}>
                      <FileText size={15} />
                    </span>
                    <span className="text-[14px] text-slate-700 dark:text-slate-200">PDF</span>
                  </button>

                  <button type="button" role="menuitem" onClick={() => { onExportCSV(); setShowExportMenu(false); }} className={exportItemClass}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('csv').bg} ${getIconStyle('csv').text}`}>
                      <FileCsv size={15} />
                    </span>
                    <span className="text-[14px] text-slate-700 dark:text-slate-200">CSV</span>
                  </button>

                  <button type="button" role="menuitem" onClick={() => { onExportTopProduits(); setShowExportMenu(false); }} className={exportItemClass}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('top').bg} ${getIconStyle('top').text}`}>
                      <Package size={15} />
                    </span>
                    <span className="text-[14px] text-slate-700 dark:text-slate-200">Top Produits</span>
                  </button>

                  <button type="button" role="menuitem" onClick={() => { onExportCommandes(); setShowExportMenu(false); }} className={exportItemClass}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('commandes').bg} ${getIconStyle('commandes').text}`}>
                      <ShoppingCart size={15} />
                    </span>
                    <span className="text-[14px] text-slate-700 dark:text-slate-200">Commandes</span>
                  </button>
                </div>
              </div>

              <div className="mt-1 border-t border-slate-200 px-3 py-2 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowExportMenu(false)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700/30 dark:hover:text-slate-300"
                >
                  <Check size={13} />Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RapportsHeader;