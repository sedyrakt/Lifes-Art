import React, { useState, useRef, useEffect } from 'react';
import { Plus, RefreshCw, Download, FileSpreadsheet, FileText, File as FileCsv, ChevronDown, X, Check, Calendar } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { ExportPeriod } from '../../hooks/useCommandesData';

interface CommandesHeaderProps {
  onAddCommande: () => void;
  onOpenStats?: () => void;
  onExport: (format: 'excel' | 'pdf' | 'csv', period: ExportPeriod, customDate: string) => void;
  totalItems?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  isDark?: boolean;
}

const PERIOD_OPTIONS: { value: ExportPeriod; label: string }[] = [
  { value: 'aujourdhui', label: "Aujourd'hui" },
  { value: 'hier', label: 'Hier' },
  { value: 'semaine', label: 'Cette semaine' },
  { value: 'mois', label: 'Ce mois' },
  { value: 'annee', label: 'Cette année' },
  { value: 'custom', label: 'Date spécifique' },
];

const CommandesHeader: React.FC<CommandesHeaderProps> = ({
  onAddCommande,
  onOpenStats,
  onExport,
  totalItems = 0,
  refreshing = false,
  onRefresh,
  isDark: propIsDark,
}) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>('mois');
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

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
    <div className="relative z-[100] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Titre et sous-titre */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-white">Commandes</h1>
          {totalItems > 0 && (
            <span className="inline-flex items-center rounded-full bg-brand-500 px-2 py-0.5 text-[12px] font-bold text-white">
              {totalItems}
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Suivez et gérez vos commandes en temps réel.</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            title="Actualiser"
            aria-label="Actualiser les commandes"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        )}

        {/* ⭐ Dropdown Export (2 colonnes) */}
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
                  {/* ⭐ 12px */}
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

                {/* RIGHT BOX: Format d'export */}
                <div className="w-1/2 p-2.5">
                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Format</p>
                  <button type="button" role="menuitem" onClick={() => { onExport('excel', selectedPeriod, selectedCustomDate); setShowExportMenu(false); }} className={exportItemClass}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('excel').bg} ${getIconStyle('excel').text}`}>
                      <FileSpreadsheet size={15} />
                    </span>
                    <span className="text-[14px] text-slate-700 dark:text-slate-200">Excel</span>
                  </button>

                  <button type="button" role="menuitem" onClick={() => { onExport('pdf', selectedPeriod, selectedCustomDate); setShowExportMenu(false); }} className={exportItemClass}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('pdf').bg} ${getIconStyle('pdf').text}`}>
                      <FileText size={15} />
                    </span>
                    <span className="text-[14px] text-slate-700 dark:text-slate-200">PDF</span>
                  </button>

                  <button type="button" role="menuitem" onClick={() => { onExport('csv', selectedPeriod, selectedCustomDate); setShowExportMenu(false); }} className={exportItemClass}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('csv').bg} ${getIconStyle('csv').text}`}>
                      <FileCsv size={15} />
                    </span>
                    <span className="text-[14px] text-slate-700 dark:text-slate-200">CSV</span>
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

        <button
          type="button"
          onClick={onAddCommande}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-[14px] font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.98]"
        >
          <Plus size={16} />
          Nouvelle commande
        </button>
      </div>
    </div>
  );
};

export default CommandesHeader;