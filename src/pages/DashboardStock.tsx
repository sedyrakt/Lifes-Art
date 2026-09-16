// src/pages/DashboardStock.tsx
// ⭐ REFACTOR: Nizara ho components + hooks ny Dashboard
// ⭐ TSY MISY niova ny logique — fizarana fotsiny
// ⭐ PADDING left/right augmenté sur le contenu principal
// ⭐ NOUVEAU: Skeleton loader full-page (tsoloana ny DashboardSkeleton)

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler, Legend } from 'chart.js';
import { XCircle, CheckCircle2 } from 'lucide-react';
import { useDashboardData, DateRangeType } from '../hooks/useDashboardData';
import { useDashboardExport } from '../hooks/useDashboardExport';
import { useTheme } from '../contexts/ThemeContext';
import {
  DashboardHeader, PerformanceCommerciale,
  AnalyseCommerciale, EtatOperationnelStock, SuiviOperationnel,
  formatDateInput,
  useDashboardKPIs, useDashboardAlerts, useDashboardCharts,
  useDashboardExportPayload, useDashboardDerived, useDashboardToast,
  type DashboardStats, type ChartItem,
} from '../components/dashboard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler, Legend);

// ============================================================
// ⭐ SKELETON LOADER FULL-PAGE
// ============================================================

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md ${className}`} />
);

const DashboardPageSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const cardBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-100';
  const surfaceBg = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const rowBorderColor = isDark ? 'border-white/[0.06]' : 'border-slate-100';
  const pageBg = isDark
    ? 'linear-gradient(to bottom right, #0B1120, #0F172A, #0B1120)'
    : 'linear-gradient(to bottom right, #EEF2FF, #FFFFFF, rgba(224,231,255,0.3))';

  return (
    <div
      className="min-h-full w-full text-slate-900 transition-colors duration-200 dark:text-slate-100"
      style={{ background: pageBg }}
    >
      <div className="mx-auto w-full max-w-[1500px] px-6 py-4 sm:px-8 lg:px-10 xl:px-6">

        {/* ⭐ HEADER SKELETON */}
        <div className={`mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[0.5px] p-4 ${surfaceBg} ${borderColor}`}>
          <div className="flex items-center gap-3">
            <SkeletonBlock className={`h-10 w-10 rounded-lg ${cardBg}`} />
            <div className="space-y-2">
              <SkeletonBlock className={`h-5 w-48 ${cardBg}`} />
              <SkeletonBlock className={`h-3 w-64 ${cardBg}`} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonBlock className={`h-9 flex-1 min-w-[180px] max-w-[260px] rounded-lg ${cardBg}`} />
            <SkeletonBlock className={`h-9 w-32 rounded-lg ${cardBg}`} />
            <SkeletonBlock className={`h-9 w-24 rounded-lg ${cardBg}`} />
            <SkeletonBlock className={`h-9 w-9 rounded-lg ${cardBg}`} />
          </div>
        </div>

        {/* ⭐ KPI CARDS SKELETON (5 cards — PerformanceCommerciale) */}
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`rounded-xl border-[0.5px] p-4 ${surfaceBg} ${borderColor}`}>
              <div className="flex items-center justify-between">
                <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
                <SkeletonBlock className={`h-9 w-9 rounded-lg ${cardBg}`} />
              </div>
              <div className="mt-3 space-y-2">
                <SkeletonBlock className={`h-7 w-32 ${cardBg}`} />
                <SkeletonBlock className={`h-3 w-24 ${cardBg}`} />
              </div>
            </div>
          ))}
        </div>

        {/* ⭐ CHARTS SKELETON (2 charts — AnalyseCommerciale) */}
        <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Line chart (2/3) */}
          <div className={`lg:col-span-2 rounded-xl border-[0.5px] p-5 ${surfaceBg} ${borderColor}`}>
            <div className="mb-4 flex items-center justify-between">
              <SkeletonBlock className={`h-4 w-48 ${cardBg}`} />
              <SkeletonBlock className={`h-8 w-32 rounded-lg ${cardBg}`} />
            </div>
            <div className="relative h-[260px] w-full">
              {/* Fake chart lines */}
              <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonBlock
                    key={i}
                    className={`w-full ${cardBg}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Doughnut chart (1/3) */}
          <div className={`rounded-xl border-[0.5px] p-5 ${surfaceBg} ${borderColor}`}>
            <SkeletonBlock className={`mb-4 h-4 w-32 ${cardBg}`} />
            <div className="flex items-center justify-center">
              <SkeletonBlock className={`h-[180px] w-[180px] rounded-full ${cardBg}`} />
            </div>
            <div className="mt-5 space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SkeletonBlock className={`h-2.5 w-2.5 rounded-full ${cardBg}`} />
                    <SkeletonBlock className={`h-3 w-24 ${cardBg}`} />
                  </div>
                  <SkeletonBlock className={`h-3 w-12 ${cardBg}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ⭐ STOCK KPIs SKELETON (4 cards — EtatOperationnelStock) */}
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`rounded-xl border-[0.5px] p-4 ${surfaceBg} ${borderColor}`}>
              <div className="flex items-center justify-between">
                <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
                <SkeletonBlock className={`h-9 w-9 rounded-lg ${cardBg}`} />
              </div>
              <div className="mt-3 space-y-2">
                <SkeletonBlock className={`h-7 w-28 ${cardBg}`} />
                <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
              </div>
            </div>
          ))}
        </div>

        {/* ⭐ TOP PRODUCTS + ALERTS SKELETON (SuiviOperationnel) */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* Top products */}
          <div className={`rounded-xl border-[0.5px] p-5 ${surfaceBg} ${borderColor}`}>
            <div className="mb-4 flex items-center justify-between">
              <SkeletonBlock className={`h-4 w-40 ${cardBg}`} />
              <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`flex items-center gap-3 border-b pb-3 ${rowBorderColor} last:border-b-0 last:pb-0`}>
                  <SkeletonBlock className={`h-8 w-8 rounded-lg ${cardBg}`} />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonBlock className={`h-3.5 w-40 ${cardBg}`} />
                    <SkeletonBlock className={`h-2.5 w-24 ${cardBg}`} />
                  </div>
                  <SkeletonBlock className={`h-4 w-16 ${cardBg}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className={`rounded-xl border-[0.5px] p-5 ${surfaceBg} ${borderColor}`}>
            <div className="mb-4 flex items-center justify-between">
              <SkeletonBlock className={`h-4 w-32 ${cardBg}`} />
              <SkeletonBlock className={`h-5 w-12 rounded-md ${cardBg}`} />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${borderColor}`}>
                  <SkeletonBlock className={`h-8 w-8 shrink-0 rounded-lg ${cardBg}`} />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonBlock className={`h-3.5 w-full ${cardBg}`} />
                    <SkeletonBlock className={`h-2.5 w-2/3 ${cardBg}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-5" />
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT
// ============================================================

export default function DashboardStock() {
  const { isDark } = useTheme();
  const {
    loading, refreshing, stats, chartsData, loadData,
    dateRange, setDateRange, customStartDate, setCustomStartDate, customEndDate, setCustomEndDate,
  } = useDashboardData();
  const { exportCSV, exportExcel, exportPDF } = useDashboardExport();

  // ═══════════ UI state ═══════════
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast, setToast } = useDashboardToast();

  const periodMenuRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  // ═══════════ Outside click ═══════════
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(event.target as Node)) setShowPeriodMenu(false);
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // ═══════════ Labels ═══════════
  const dateRangeLabel = useMemo(() => {
    switch (dateRange) {
      case 'aujourdhui': return "Aujourd'hui";
      case 'hier': return 'Hier';
      case 'semaine': return 'Cette semaine';
      case 'mois': return 'Ce mois';
      case 'mois_dernier': return 'Mois dernier';
      case 'annee': return 'Cette année';
      case 'annee_derniere': return 'Année dernière';
      case 'custom':
        if (customStartDate && customEndDate) return `${formatDateInput(customStartDate)} - ${formatDateInput(customEndDate)}`;
        return 'Période personnalisée';
      default: return 'Période';
    }
  }, [dateRange, customStartDate, customEndDate]);

  const variationLabel = useMemo(() => {
    switch (dateRange) {
      case 'aujourdhui': return "vs hier";
      case 'hier': return "vs avant-hier";
      case 'semaine': return "vs semaine dernière";
      case 'mois': return "vs mois dernier";
      case 'mois_dernier': return "vs 2 mois";
      case 'annee': return "vs année dernière";
      case 'annee_derniere': return "vs 2 ans";
      default: return "vs période précédente";
    }
  }, [dateRange]);

  const periodOptions = useMemo(() => [
    { value: 'aujourdhui', label: "Aujourd'hui" },
    { value: 'hier', label: 'Hier' },
    { value: 'semaine', label: 'Cette semaine' },
    { value: 'mois', label: 'Ce mois' },
    { value: 'mois_dernier', label: 'Mois dernier' },
    { value: 'annee', label: 'Cette année' },
    { value: 'annee_derniere', label: 'Année dernière' },
    { value: 'custom', label: 'Période personnalisée' },
  ] as { value: DateRangeType; label: string }[], []);

  // ═══════════ Data extraction ═══════════
  const safeStats = (stats || {}) as DashboardStats;
  const ventesParMois = Array.isArray(chartsData?.ventesParMois) ? chartsData.ventesParMois : [];
  const categorieRepartition = Array.isArray(chartsData?.categorieRepartition) ? chartsData.categorieRepartition : [];
  const topProduitsSource = Array.isArray(chartsData?.topProduits) ? chartsData.topProduits : [];
  const ruptureStockDetails = Array.isArray(chartsData?.ruptureStockDetails) ? chartsData.ruptureStockDetails : [];
  const detteClientsDetails = Array.isArray(chartsData?.detteClientsDetails) ? chartsData.detteClientsDetails : [];
  const commandesEnAttenteDetails = Array.isArray(chartsData?.commandesEnAttenteDetails) ? chartsData.commandesEnAttenteDetails : [];

  // ═══════════ Hooks custom ═══════════
  const {
    chiffreAffaires, depenses, salairesPayes, beneficeNet,
    commandesTotal, panierMoyen, detteClient, commandesNonPayees,
    clientsActifs, alertesStock, ruptureStock, stockValue, stockTotal,
    totalProduits, rotationRate,
    kpisVentes, kpisStock,
  } = useDashboardKPIs(safeStats, chartsData);

  const alerts = useDashboardAlerts({
    ruptureStock, commandesNonPayees, detteClient, clientsActifs, alertesStock,
    ruptureStockDetails, detteClientsDetails, commandesEnAttenteDetails,
  });

  const { topProducts } = useDashboardDerived(topProduitsSource, searchTerm);

  const {
    revenueTrend, lineData, lineOptions,
    salesDist, doughnutData, doughnutOptions,
    centerPlugin, doughnutColors,
  } = useDashboardCharts({ isDark, chiffreAffaires, ventesParMois, categorieRepartition });

  const exportPayload = useDashboardExportPayload({
    dateRangeLabel, customStartDate, customEndDate,
    chiffreAffaires, beneficeNet, depenses, salairesPayes, panierMoyen,
    detteClient, clientsActifs, alertesStock, ruptureStock, stockValue,
    rotationRate, stockTotal, totalProduits, commandesNonPayees, commandesTotal,
    topProducts, alerts, ruptureStockDetails, detteClientsDetails, commandesEnAttenteDetails,
  });

  // ═══════════ Handlers ═══════════
  const handleRefresh = () => { loadData(true); };

  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    setShowExportMenu(false);
    if (exporting) return;
    setExporting(true);
    try {
      let result;
      if (format === 'excel') result = await exportExcel(exportPayload);
      else if (format === 'pdf') result = await exportPDF(exportPayload);
      else result = await exportCSV(exportPayload);

      if (result?.canceled) return;
      if (result?.success === false) {
        setToast({ type: 'error', message: result.error || 'Erreur lors de l\'export.' });
        return;
      }
      setToast({ type: 'success', message: `Export ${format.toUpperCase()} réussi — ${dateRangeLabel}` });
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Erreur inattendue.' });
    } finally {
      setExporting(false);
    }
  };

  const topProductColors = [
    { bg: '#6366F1' }, { bg: '#F59E0B' }, { bg: '#10B981' }, { bg: '#EF4444' }, { bg: '#8B5CF6' },
  ];

  // ============================================================
  // ⭐ SKELETON FULL-PAGE — alohan'ny render ny page
  // ============================================================
  if (loading) return <DashboardPageSkeleton isDark={isDark} />;

  return (
    <div className="min-h-full w-full bg-gradient-to-br from-brand-50 via-white to-indigo-50/30 text-slate-900 transition-colors duration-200 dark:from-[#0B1120] dark:via-[#0F172A] dark:to-[#0B1120] dark:text-slate-100">
      {/* ⭐ Padding left/right augmenté sur le contenu principal */}
      <div className="mx-auto w-full max-w-[1500px] px-6 py-4 sm:px-8 lg:px-10 xl:px-6">

        <DashboardHeader
          isDark={isDark} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          dateRangeLabel={dateRangeLabel} dateRange={dateRange} periodOptions={periodOptions}
          setDateRange={setDateRange} customStartDate={customStartDate} setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate} setCustomEndDate={setCustomEndDate}
          showPeriodMenu={showPeriodMenu} setShowPeriodMenu={setShowPeriodMenu}
          showExportMenu={showExportMenu} setShowExportMenu={setShowExportMenu}
          exporting={exporting} handleExport={handleExport} handleRefresh={handleRefresh}
          refreshing={refreshing} totalProduits={totalProduits}
          periodMenuRef={periodMenuRef} exportMenuRef={exportMenuRef}
        />

        <PerformanceCommerciale kpisVentes={kpisVentes} variationLabel={variationLabel} />

        <AnalyseCommerciale
          dateRangeLabel={dateRangeLabel} chiffreAffaires={chiffreAffaires}
          revenueTrend={revenueTrend} lineData={lineData} lineOptions={lineOptions}
          salesDist={salesDist} doughnutData={doughnutData} doughnutOptions={doughnutOptions}
          centerPlugin={centerPlugin} doughnutColors={doughnutColors}
        />

        <EtatOperationnelStock kpisStock={kpisStock} variationLabel={variationLabel} />

        <SuiviOperationnel
          topProducts={topProducts} alerts={alerts}
          searchTerm={searchTerm} topProductColors={topProductColors}
        />

        <div className="h-5" />
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[99999] flex items-center gap-3 rounded-xl border-[0.5px] px-4 py-3 shadow-[0_18px_55px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-colors duration-200 ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10'
              : 'border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10'
          }`}
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              toast.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/15 text-red-600 dark:text-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} strokeWidth={2.2} /> : <XCircle size={16} strokeWidth={2.2} />}
          </div>
          <p
            className={`text-[12.5px] font-semibold leading-[1.3] ${
              toast.type === 'success'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            {toast.message}
          </p>
        </div>
      )}
    </div>
  );
}