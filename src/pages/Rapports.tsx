// src/pages/Rapports.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: Analysés avancées — 3 onglets uniquement
// ⭐ Retiré: Ventes, Top produits, Catégories, Commandes (dupliqués Dashboard)

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useCompany } from '../contexts/CompanyContext';
import { useRapportsData, ExportPeriod } from '../hooks/useRapportsData';
import { RapportsHeader, RapportsCharts, RapportsCommandes, RapportsSummary, RapportsFooter } from '../components/rapports';

// ⭐ 3 onglets uniquement (tsisy duplication amin'ny Dashboard)
type ChartTab = 'clients' | 'depenses' | 'stock';

const RapportsSkeleton = ({ isDark }: { isDark: boolean }) => {
  const base = isDark ? 'bg-white/[0.07]' : 'bg-slate-200';
  const border = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  return (
    <div className="min-h-[500px] w-full p-5">
      <div className="space-y-4">
        <div className={`flex items-center gap-4 border-b pb-4 ${border}`}>
          <div className={`h-4 w-24 rounded-sm ${base} animate-pulse`} />
          <div className={`h-4 w-32 rounded-sm ${base} animate-pulse`} />
          <div className={`h-4 w-20 rounded-sm ${base} animate-pulse`} />
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`h-9 w-32 rounded-lg ${base} animate-pulse`} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className={`rounded-xl border-[0.5px] p-4 ${border}`}>
            <div className={`h-4 w-40 rounded-sm ${base} animate-pulse`} />
            <div className={`mt-4 h-[240px] rounded-lg ${base} animate-pulse`} />
          </div>
          <div className={`rounded-xl border-[0.5px] p-4 ${border}`}>
            <div className={`h-4 w-32 rounded-sm ${base} animate-pulse`} />
            <div className={`mt-4 h-[240px] rounded-lg ${base} animate-pulse`} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`rounded-xl border-[0.5px] p-4 ${border}`}>
              <div className={`h-3 w-24 rounded-sm ${base} animate-pulse`} />
              <div className={`mt-3 h-6 w-20 rounded-sm ${base} animate-pulse`} />
            </div>
          ))}
        </div>
        <div className={`rounded-xl border-[0.5px] p-4 ${border}`}>
          <div className={`h-4 w-32 rounded-sm ${base} animate-pulse`} />
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`mt-3 flex items-center gap-3 ${border}`}>
              <div className={`h-4 w-8 rounded-sm ${base} animate-pulse`} />
              <div className={`h-4 w-1/3 rounded-sm ${base} animate-pulse`} />
              <div className={`h-4 w-16 rounded-sm ${base} animate-pulse`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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

  return (
    <div className="min-h-screen font-sans transition-colors duration-300" style={{ background: bgColor }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-5 px-2 py-5 sm:px-3 lg:px-5">

        {loading && stats.total === 0 ? (
          <RapportsSkeleton isDark={isDark} />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Rapports;