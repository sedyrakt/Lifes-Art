// src/pages/DashboardStock.tsx
// ⭐ REFACTOR: Nizara ho components + hooks ny Dashboard
// ⭐ TSY MISY niova ny logique — fizarana fotsiny
// ⭐ PADDING left/right augmenté sur le contenu principal

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler, Legend } from 'chart.js';
import { XCircle, CheckCircle2 } from 'lucide-react';
import { useDashboardData, DateRangeType } from '../hooks/useDashboardData';
import { useDashboardExport } from '../hooks/useDashboardExport';
import { useTheme } from '../contexts/ThemeContext';
import {
  DashboardSkeleton, DashboardHeader, PerformanceCommerciale,
  AnalyseCommerciale, EtatOperationnelStock, SuiviOperationnel,
  formatDateInput,
  useDashboardKPIs, useDashboardAlerts, useDashboardCharts,
  useDashboardExportPayload, useDashboardDerived, useDashboardToast,
  type DashboardStats, type ChartItem,
} from '../components/dashboard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler, Legend);

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

  if (loading) return <DashboardSkeleton />;

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

        {/* <EtatOperationnelStock kpisStock={kpisStock} variationLabel={variationLabel} /> */}

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