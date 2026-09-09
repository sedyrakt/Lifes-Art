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

  // ⭐ FontSize 14px ho an'ny export items sy period buttons
  const exportItemClass = `group flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30`;

  const getIconStyle = (type: 'excel' | 'pdf' | 'csv') => {
    switch (type) {
      case 'excel': return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' };
      case 'pdf': return { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' };
      case 'csv': return { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' };
      default: return { bg: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' };
    }
  };

  return (
    <header className="mb-4 w-full relative z-[100]">
      <div className="group relative flex flex-col gap-3 rounded-xl border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 md:flex-row md:items-center md:justify-between dark:bg-slate-900" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}>
        <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500" />

        <div className="relative z-10 flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 dark:text-slate-100">Mouvements de stock</h1>
            {totalItems !== undefined && (
              <span className="inline-flex min-w-[26px] items-center justify-center rounded-md bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white">{totalItems}</span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] font-medium leading-tight text-slate-500 dark:text-slate-400">Suivez les entrées, sorties et ajustements.</p>
        </div>

        <div className="relative z-10 flex w-full shrink-0 items-center gap-2 md:w-auto">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border px-3 text-[13px] font-medium text-slate-500 transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', background: isDark ? 'bg-slate-900' : '#FFFFFF' }}
              aria-label="Actualiser les mouvements"
              title="Actualiser"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          )}

          <div className="relative z-[200]" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu(prev => !prev)}
              aria-expanded={showExportMenu}
              aria-haspopup="menu"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md active:scale-[0.98] dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              <Download size={16} strokeWidth={2} />
              <span>Exporter</span>
              <ChevronDown size={15} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div role="menu" className={`absolute right-0 top-full mt-2 w-[300px] overflow-hidden rounded-xl border ${borderColor} ${cardBg} py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-100 dark:shadow-2xl`}>
                <div className={`flex items-center justify-between border-b ${borderColor} px-3 py-2.5`}>
                  <div className="flex items-center gap-2">
                    <Download size={14} className="text-brand-500 dark:text-brand-400" />
                    {/* ⭐ 12px */}
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Exporter les données</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(false)}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700/30 dark:hover:text-slate-200"
                    aria-label="Fermer"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Sélection de la période */}
                <div className="border-b border-slate-200 px-3 py-2 dark:border-white/[0.08]">
                  {/* ⭐ 12px */}
                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Période</p>
                  <div className="grid grid-cols-1 gap-1">
                    {PERIOD_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedPeriod(opt.value)}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[14px] font-medium transition-colors ${
                          selectedPeriod === opt.value
                            ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/30'
                        }`}
                      >
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          selectedPeriod === opt.value ? 'border-brand-500 bg-brand-500' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {selectedPeriod === opt.value && <span className="h-2 w-2 rounded-full bg-white" />}
                        </span>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Date picker raha custom */}
                  {selectedPeriod === 'custom' && (
                    <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 dark:border-white/[0.1]">
                      <Calendar size={14} className="text-brand-500" />
                      <input
                        type="date"
                        value={selectedCustomDate}
                        onChange={(e) => setSelectedCustomDate(e.target.value)}
                        className="w-full bg-transparent text-[14px] font-medium text-slate-700 outline-none dark:text-slate-200"
                      />
                    </div>
                  )}
                </div>

                {/* Format d'export */}
                <button type="button" role="menuitem" onClick={() => { onExport('excel', selectedPeriod, selectedCustomDate); setShowExportMenu(false); }} className={exportItemClass}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('excel').bg} ${getIconStyle('excel').text}`}>
                    <FileSpreadsheet size={15} />
                  </span>
                  <span className="text-[14px] text-slate-700 dark:text-slate-200">Excel <span className="ml-1 text-slate-400 dark:text-slate-500">· {PERIOD_OPTIONS.find(o => o.value === selectedPeriod)?.label || 'période'}</span></span>
                </button>

                <button type="button" role="menuitem" onClick={() => { onExport('pdf', selectedPeriod, selectedCustomDate); setShowExportMenu(false); }} className={exportItemClass}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('pdf').bg} ${getIconStyle('pdf').text}`}>
                    <FileText size={15} />
                  </span>
                  <span className="text-[14px] text-slate-700 dark:text-slate-200">PDF <span className="ml-1 text-slate-400 dark:text-slate-500">· {PERIOD_OPTIONS.find(o => o.value === selectedPeriod)?.label || 'période'}</span></span>
                </button>

                <button type="button" role="menuitem" onClick={() => { onExport('csv', selectedPeriod, selectedCustomDate); setShowExportMenu(false); }} className={exportItemClass}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('csv').bg} ${getIconStyle('csv').text}`}>
                    <FileCsv size={15} />
                  </span>
                  <span className="text-[14px] text-slate-700 dark:text-slate-200">CSV <span className="ml-1 text-slate-400 dark:text-slate-500">· {PERIOD_OPTIONS.find(o => o.value === selectedPeriod)?.label || 'période'}</span></span>
                </button>

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
    </header>
  );
};

export default MouvementsHeader;