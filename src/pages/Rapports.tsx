// src/pages/Rapports.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: Analysés avancées — 3 onglets uniquement
// ⭐ Retiré: Ventes, Top produits, Catégories, Commandes (dupliqués Dashboard)
// ⭐ NOUVEAU: Skeleton loader full-page (tsoloana ny RapportsSkeleton)

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useCompany } from '../contexts/CompanyContext';
import { useRapportsData, ExportPeriod } from '../hooks/useRapportsData';
import { RapportsHeader, RapportsCharts, RapportsCommandes, RapportsSummary, RapportsFooter } from '../components/rapports';

// ⭐ 3 onglets uniquement (tsisy duplication amin'ny Dashboard)
type ChartTab = 'clients' | 'depenses' | 'stock';

// ============================================================
// ⭐ SKELETON LOADER FULL-PAGE
// ============================================================

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md ${className}`} />
);

const RapportsPageSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const cardBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-100';
  const surfaceBg = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const rowBorderColor = isDark ? 'border-white/[0.06]' : 'border-slate-100';
  const pageBg = isDark ? '#0F172A' : '#FFFFFF';

  return (
    <div
      className="min-h-screen font-sans transition-colors duration-300"
      style={{ background: pageBg }}
    >
      <div className="mx-auto w-full max-w-[1600px] space-y-5 px-2 py-5 sm:px-3 lg:px-5">

        {/* ⭐ HEADER SKELETON */}
        <section className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border-[0.5px] p-4 ${surfaceBg} ${borderColor}`}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <SkeletonBlock className={`h-9 w-9 rounded-lg ${cardBg}`} />
              <div className="space-y-1.5">
                <SkeletonBlock className={`h-4 w-40 ${cardBg}`} />
                <SkeletonBlock className={`h-3 w-56 ${cardBg}`} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonBlock className={`h-9 w-[150px] rounded-lg ${cardBg}`} />
            <SkeletonBlock className={`h-9 w-[120px] rounded-lg ${cardBg}`} />
            <SkeletonBlock className={`h-9 w-9 rounded-lg ${cardBg}`} />
            <SkeletonBlock className={`h-9 w-[140px] rounded-lg ${cardBg}`} />
          </div>
        </section>

        {/* ⭐ TABS SKELETON (3 onglets) */}
        <section className={`rounded-xl border-[0.5px] p-1 ${surfaceBg} ${borderColor}`}>
          <div className="flex w-full items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className={`h-9 w-[140px] rounded-lg ${cardBg}`} />
            ))}
          </div>
        </section>

        {/* ⭐ CHARTS SKELETON (2 columns) */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Chart 1 */}
          <div className={`rounded-xl border-[0.5px] p-4 ${surfaceBg} ${borderColor}`}>
            <div className="mb-4 flex items-center justify-between">
              <SkeletonBlock className={`h-4 w-40 ${cardBg}`} />
              <SkeletonBlock className={`h-7 w-24 rounded-lg ${cardBg}`} />
            </div>
            <div className="relative h-[280px] w-full">
              <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonBlock
                    key={i}
                    className={`w-full ${cardBg}`}
                    style={{ height: `${30 + (i % 5) * 15}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2 (doughnut) */}
          <div className={`rounded-xl border-[0.5px] p-4 ${surfaceBg} ${borderColor}`}>
            <div className="mb-4 flex items-center justify-between">
              <SkeletonBlock className={`h-4 w-32 ${cardBg}`} />
              <SkeletonBlock className={`h-7 w-24 rounded-lg ${cardBg}`} />
            </div>
            <div className="flex items-center justify-center py-4">
              <SkeletonBlock className={`h-[200px] w-[200px] rounded-full ${cardBg}`} />
            </div>
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SkeletonBlock className={`h-2.5 w-2.5 rounded-full ${cardBg}`} />
                    <SkeletonBlock className={`h-3 w-28 ${cardBg}`} />
                  </div>
                  <SkeletonBlock className={`h-3 w-16 ${cardBg}`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⭐ SUMMARY + COMMANDES SKELETON (2 columns) */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Summary */}
          <div className={`rounded-xl border-[0.5px] p-5 ${surfaceBg} ${borderColor}`}>
            <div className="mb-4 flex items-center justify-between">
              <SkeletonBlock className={`h-4 w-36 ${cardBg}`} />
              <SkeletonBlock className={`h-7 w-20 rounded-lg ${cardBg}`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`rounded-lg border p-3 ${borderColor}`}>
                  <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
                  <SkeletonBlock className={`mt-2 h-6 w-24 ${cardBg}`} />
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <SkeletonBlock className={`h-3 w-32 ${cardBg}`} />
                  <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Commandes récentes */}
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
                    <SkeletonBlock className={`h-3.5 w-32 ${cardBg}`} />
                    <SkeletonBlock className={`h-2.5 w-20 ${cardBg}`} />
                  </div>
                  <SkeletonBlock className={`h-5 w-16 rounded ${cardBg}`} />
                  <SkeletonBlock className={`h-3.5 w-20 ${cardBg}`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⭐ FOOTER SKELETON */}
        <section className={`rounded-xl border-[0.5px] p-4 ${surfaceBg} ${borderColor}`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBlock className={`h-10 w-10 rounded-lg ${cardBg}`} />
                <div className="flex-1 space-y-1.5">
                  <SkeletonBlock className={`h-3 w-24 ${cardBg}`} />
                  <SkeletonBlock className={`h-4 w-32 ${cardBg}`} />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT
// ============================================================

const Rapports: React.FC = () => {
  const { isDark } = useTheme();
  const { company } = useCompany();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [granularity, setGranularity] = useState<'jour' | 'semaine' | 'mois' | 'annee'>('mois');
  // ⭐ Onglet par défaut: 'clients'
  const [activeTab, setActiveTab] = useState<ChartTab>('clients');

  const {
    loading, refreshing, stats, commandesRecentes, ventesParMois, topProduits, categorieRepartition,
    stockValue, entreesStock, sortiesStock, topClients, depensesParCategorie, commandesStatut, stockStatus,
    refresh, handleExportStats, handleExportTopProduits, handleExportCommandes, handleExportPDF, handleExportCSV,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
  } = useRapportsData();

  useEffect(() => {
    if (!loading && !refreshing) {
      const hasData = Object.keys(stats).length > 0 || ventesParMois.length > 0 || topProduits.length > 0 || commandesRecentes.length > 0;
      if (!hasData) refresh();
    }
  }, [loading, refreshing, stats, ventesParMois, topProduits, commandesRecentes, refresh]);

  // ⭐ 3 onglets uniquement
  const tabItems = [
    { id: 'clients' as const, label: 'Top clients' },
    { id: 'depenses' as const, label: 'Dépenses' },
    { id: 'stock' as const, label: 'Mouvements stock' },
  ];

  const bgColor = isDark ? '#0F172A' : '#FFFFFF';

  const handleExportStatsClick = useCallback(async () => {
    try {
      await handleExportStats((value: number) => `${value.toLocaleString('fr-FR')} Ar`, exportPeriod, exportCustomDate);
    } catch (error: any) {
      console.error('Erreur export stats:', error);
    }
  }, [handleExportStats, exportPeriod, exportCustomDate]);

  const handleExportPDFClick = useCallback(async () => {
    try {
      await handleExportPDF((value: number) => `${value.toLocaleString('fr-FR')} Ar`, company?.name || "Lifes-Art", exportPeriod, exportCustomDate);
    } catch (error: any) {
      console.error('Erreur export PDF:', error);
    }
  }, [handleExportPDF, company, exportPeriod, exportCustomDate]);

  const handleExportCSVClick = useCallback(async () => {
    try {
      await handleExportCSV((value: number) => `${value.toLocaleString('fr-FR')} Ar`, exportPeriod, exportCustomDate);
    } catch (error: any) {
      console.error('Erreur export CSV:', error);
    }
  }, [handleExportCSV, exportPeriod, exportCustomDate]);

  const handleExportTopProduitsClick = useCallback(async () => {
    try {
      await handleExportTopProduits((value: number) => `${value.toLocaleString('fr-FR')} Ar`, exportPeriod, exportCustomDate);
    } catch (error: any) {
      console.error('Erreur export top produits:', error);
    }
  }, [handleExportTopProduits, exportPeriod, exportCustomDate]);

  const handleExportCommandesClick = useCallback(async () => {
    try {
      await handleExportCommandes(exportPeriod, exportCustomDate);
    } catch (error: any) {
      console.error('Erreur export commandes:', error);
    }
  }, [handleExportCommandes, exportPeriod, exportCustomDate]);

  // ============================================================
  // ⭐ SKELETON FULL-PAGE — alohan'ny render ny page
  // ============================================================
  if (loading && stats.total === 0) {
    return <RapportsPageSkeleton isDark={isDark} />;
  }

  return (
    <div className="min-h-screen font-sans transition-colors duration-300" style={{ background: bgColor }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-5 px-2 py-5 sm:px-3 lg:px-5">

        <section>
          <RapportsHeader
            selectedDate={selectedDate}
            granularity={granularity}
            onDateChange={setSelectedDate}
            onGranularityChange={setGranularity}
            onToday={() => setSelectedDate(new Date())}
            onRefresh={() => { if (!loading && !refreshing) refresh(); }}
            onExportStats={handleExportStatsClick}
            onExportPDF={handleExportPDFClick}
            onExportCSV={handleExportCSVClick}
            onExportTopProduits={handleExportTopProduitsClick}
            onExportCommandes={handleExportCommandesClick}
            isLoading={loading}
            isRefreshing={refreshing}
            exportPeriod={exportPeriod}
            onExportPeriodChange={setExportPeriod}
            exportCustomDate={exportCustomDate}
            onExportCustomDateChange={setExportCustomDate}
          />
        </section>

        {/* ⭐ Tabs — 3 onglets uniquement */}
        <section className="rounded-xl border-[0.5px] border-slate-200 bg-white p-1 shadow-sm dark:border-white/[0.12] dark:bg-[#0F172A]">
          <div className="flex w-full items-center gap-1 overflow-x-auto scrollbar-hide">
            {tabItems.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-[13.5px] font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-slate-500 hover:bg-brand-50 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-brand-500 dark:bg-brand-400" />}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <RapportsCharts
            ventesParMois={ventesParMois}
            topProduits={topProduits}
            categorieRepartition={categorieRepartition}
            selectedDate={selectedDate}
            granularity={granularity}
            isDark={isDark}
            activeTab={activeTab}
            entreesStock={entreesStock}
            sortiesStock={sortiesStock}
            topClients={topClients}
            depensesParCategorie={depensesParCategorie}
            commandesStatut={commandesStatut}
            stockStatus={stockStatus}
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <RapportsSummary stats={stats} formatMoney={(value: number) => `${value.toLocaleString('fr-FR')} Ar`} />
          <RapportsCommandes commandes={commandesRecentes} />
        </section>

        <section>
          <RapportsFooter
            totalProduits={stockValue?.total_produits || 0}
            chiffreAffaires={stats.chiffreAffaires}
            totalVentes={stats.nbCommandes}
            formatMoney={(value: number) => `${value.toLocaleString('fr-FR')} Ar`}
            isDark={isDark}
          />
        </section>
      </div>
    </div>
  );
};

export default Rapports;