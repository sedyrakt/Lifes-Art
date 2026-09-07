import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, Download, RefreshCw, ChevronDown, FileSpreadsheet, FileText, File as FileCsv, Trophy, ShoppingCart, Calendar, X, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { format, parseISO, isValid } from 'date-fns';

interface RapportsHeaderProps {
  selectedDate: Date;
  granularity: 'jour' | 'semaine' | 'mois' | 'annee';
  onDateChange: (date: Date) => void;
  onGranularityChange: (g: 'jour' | 'semaine' | 'mois' | 'annee') => void;
  onToday: () => void;
  onRefresh: () => void;
  onExportStats: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  onExportTopProduits: () => void;
  onExportCommandes: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
}

const RapportsHeader: React.FC<RapportsHeaderProps> = ({
  selectedDate, granularity, onDateChange, onGranularityChange, onToday,
  onRefresh, onExportStats, onExportPDF, onExportCSV, onExportTopProduits, onExportCommandes,
  isLoading = false, isRefreshing = false,
}) => {
  const { isDark } = useTheme();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cardBg = isDark ? 'bg-[#0F172A]' : 'bg-white';

  const safeFormatDate = (date: Date): string => {
    if (!date || !isValid(date)) return format(new Date(), 'yyyy-MM-dd');
    return format(date, 'yyyy-MM-dd');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    const parsed = parseISO(value);
    if (isValid(parsed)) onDateChange(parsed);
  };

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

  const periods = [
    { id: 'jour' as const, label: 'Jour' },
    { id: 'semaine' as const, label: 'Semaine' },
    { id: 'mois' as const, label: 'Mois' },
    { id: 'annee' as const, label: 'Année' }
  ];

  const exportItemClass = `group flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30`;

  // ⭐ FONCTION COULEUR POUR CHAQUE ICON
  const getIconStyle = (type: 'excel' | 'pdf' | 'csv' | 'top' | 'commandes') => {
    switch (type) {
      case 'excel':
        return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' };
      case 'pdf':
        return { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' };
      case 'csv':
        return { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' };
      case 'top':
        return { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' };
      case 'commandes':
        return { bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400' };
      default:
        return { bg: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' };
    }
  };

  return (
    <div className={`relative mb-5 w-full rounded-xl border ${borderColor} ${cardBg} shadow-[0_1px_2px_rgba(79,70,229,0.04)] transition-all duration-200 dark:shadow-[0_12px_40px_rgba(0,0,0,0.18)]`}>
      <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500" />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className={`flex h-9 items-center rounded-lg border ${borderColor} bg-slate-50 dark:bg-white/[0.08] p-1`} role="tablist" aria-label="Période du rapport">
            {periods.map(period => {
              const active = granularity === period.id;
              return (
                <button
                  key={period.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onGranularityChange(period.id)}
                  className={`h-7 rounded-md px-3 text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? 'bg-white text-brand-600 shadow-sm ring-1 ring-brand-500 dark:bg-[#1E293B] dark:text-brand-400 dark:ring-brand-500'
                      : 'text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {period.label}
                </button>
              );
            })}
          </div>

          <label className={`group flex h-9 items-center gap-2 rounded-lg border ${borderColor} ${cardBg} px-3 transition-all hover:border-brand-500 dark:hover:border-brand-500/30`}>
            <Calendar size={16} strokeWidth={2} className="shrink-0 text-brand-500 dark:text-brand-400" />
            <input
              type="date"
              value={safeFormatDate(selectedDate)}
              onChange={handleDateChange}
              aria-label="Date du rapport"
              className="min-w-[120px] bg-transparent text-[13px] font-medium text-slate-700 outline-none dark:text-slate-200 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </label>

          <button
            type="button"
            onClick={onToday}
            className={`flex h-9 items-center gap-2 rounded-lg border ${borderColor} ${cardBg} px-3 text-[13px] font-medium text-slate-600 transition-all hover:border-brand-500/30 hover:bg-brand-50 hover:text-brand-600 dark:text-slate-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-400`}
          >
            <BarChart3 size={15} strokeWidth={2} />Aujourd'hui
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div ref={exportMenuRef} className="relative z-[200]">
            <button
              type="button"
              onClick={() => setShowExportMenu(prev => !prev)}
              aria-expanded={showExportMenu}
              aria-haspopup="menu"
              className="flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md active:scale-[0.98] dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              <Download size={16} strokeWidth={2} />
              <span>Exporter</span>
              <ChevronDown size={15} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div
                role="menu"
                className={`absolute right-0 top-full mt-2 w-[250px] overflow-hidden rounded-xl border ${borderColor} ${cardBg} py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-100 dark:shadow-2xl`}
              >
                <div className={`flex items-center justify-between border-b ${borderColor} px-3 py-2.5`}>
                  <div className="flex items-center gap-2">
                    <Download size={14} className="text-brand-500 dark:text-brand-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Exporter les données</span>
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

                {/* ⭐ EXCEL - MAINTSO */}
                <button type="button" role="menuitem" onClick={() => { onExportStats(); setShowExportMenu(false); }} className={exportItemClass}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('excel').bg} ${getIconStyle('excel').text}`}>
                    <FileSpreadsheet size={15} />
                  </span>
                  <span className="text-[13px] text-slate-700 dark:text-slate-200">
                    Excel <span className="ml-1 text-slate-400 dark:text-slate-500">· Statistiques</span>
                  </span>
                </button>

                {/* ⭐ PDF - MENA */}
                <button type="button" role="menuitem" onClick={() => { onExportPDF(); setShowExportMenu(false); }} className={exportItemClass}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('pdf').bg} ${getIconStyle('pdf').text}`}>
                    <FileText size={15} />
                  </span>
                  <span className="text-[13px] text-slate-700 dark:text-slate-200">
                    PDF <span className="ml-1 text-slate-400 dark:text-slate-500">· Statistiques</span>
                  </span>
                </button>

                {/* ⭐ CSV - MANGA */}
                <button type="button" role="menuitem" onClick={() => { onExportCSV(); setShowExportMenu(false); }} className={exportItemClass}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('csv').bg} ${getIconStyle('csv').text}`}>
                    <FileCsv size={15} />
                  </span>
                  <span className="text-[13px] text-slate-700 dark:text-slate-200">
                    CSV <span className="ml-1 text-slate-400 dark:text-slate-500">· Statistiques</span>
                  </span>
                </button>

                <div className="my-1 h-px bg-slate-200 dark:bg-white/[0.08]" />

                {/* ⭐ TOP PRODUITS - VOLAMENA */}
                <button type="button" role="menuitem" onClick={() => { onExportTopProduits(); setShowExportMenu(false); }} className={exportItemClass}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('top').bg} ${getIconStyle('top').text}`}>
                    <Trophy size={15} />
                  </span>
                  <span className="text-[13px] text-slate-700 dark:text-slate-200">Top produits</span>
                </button>

                {/* ⭐ COMMANDES - MAVOKELY */}
                <button type="button" role="menuitem" onClick={() => { onExportCommandes(); setShowExportMenu(false); }} className={exportItemClass}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getIconStyle('commandes').bg} ${getIconStyle('commandes').text}`}>
                    <ShoppingCart size={15} />
                  </span>
                  <span className="text-[13px] text-slate-700 dark:text-slate-200">Commandes récentes</span>
                </button>

                <div className="mt-1 border-t border-slate-200 px-3 py-2 dark:border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(false)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-medium text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700/30 dark:hover:text-slate-300"
                  >
                    <Check size={13} />Fermer
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            title="Rafraîchir"
            aria-label="Rafraîchir les rapports"
            disabled={isLoading || isRefreshing}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border ${borderColor} ${cardBg} text-slate-500 transition-all hover:border-brand-500/30 hover:bg-brand-50 hover:text-brand-600 active:scale-95 disabled:opacity-50 dark:text-slate-400 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-400`}
          >
            <RefreshCw size={17} strokeWidth={2} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RapportsHeader;