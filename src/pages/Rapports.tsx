// src/pages/Rapports.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useCompany } from '../contexts/CompanyContext';
import { useRapportsData, ExportPeriod } from '../hooks/useRapportsData';
import { RapportsHeader, RapportsCharts, RapportsCommandes, RapportsSummary, RapportsFooter } from '../components/rapports';

type ChartTab = 'ventes' | 'stock' | 'top' | 'categories' | 'clients' | 'depenses' | 'commandes';

const RapportsSkeleton = ({ isDark }: { isDark: boolean }) => {
  const base = isDark ? 'bg-white/[0.06]' : 'bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-200';
  return (
    <div className="min-h-[500px] w-full p-5">
      <div className="space-y-4">
        <div className={`flex items-center gap-4 border-b pb-4 ${border}`}>
          <div className={`h-4 w-24 rounded ${base} animate-pulse`} />
          <div className={`h-4 w-32 rounded ${base} animate-pulse`} />
          <div className={`h-4 w-20 rounded ${base} animate-pulse`} />
        </div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-9 w-24 rounded-lg ${base} animate-pulse`} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className={`rounded-xl border p-4 ${border}`}>
            <div className={`h-4 w-40 rounded ${base} animate-pulse`} />
            <div className={`mt-4 h-[240px] rounded-lg ${base} animate-pulse`} />
          </div>
          <div className={`rounded-xl border p-4 ${border}`}>
            <div className={`h-4 w-32 rounded ${base} animate-pulse`} />
            <div className={`mt-4 h-[240px] rounded-lg ${base} animate-pulse`} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`rounded-xl border p-4 ${border}`}>
              <div className={`h-3 w-24 rounded ${base} animate-pulse`} />
              <div className={`mt-3 h-6 w-20 rounded ${base} animate-pulse`} />
            </div>
          ))}
        </div>
        <div className={`rounded-xl border p-4 ${border}`}>
          <div className={`h-4 w-32 rounded ${base} animate-pulse`} />
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`mt-3 flex items-center gap-3 ${border}`}>
              <div className={`h-4 w-8 rounded ${base} animate-pulse`} />
              <div className={`h-4 w-1/3 rounded ${base} animate-pulse`} />
              <div className={`h-4 w-16 rounded ${base} animate-pulse`} />
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
  const [activeTab, setActiveTab] = useState<ChartTab>('ventes');

  const {
    loading, refreshing, stats, commandesRecentes, ventesParMois, topProduits, categorieRepartition,
    stockValue, entreesStock, sortiesStock, topClients, depensesParCategorie, commandesStatut, stockStatus,
    refresh, handleExportStats, handleExportTopProduits, handleExportCommandes, handleExportPDF, handleExportCSV,
    // ⭐ Vaovao
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
  } = useRapportsData();

  useEffect(() => {
    if (!loading && !refreshing) {
      const hasData = Object.keys(stats).length > 0 || ventesParMois.length > 0 || topProduits.length > 0 || commandesRecentes.length > 0;
      if (!hasData) refresh();
    }
  }, [loading, refreshing, stats, ventesParMois, topProduits, commandesRecentes, refresh]);

  const tabItems = [
    { id: 'ventes' as const, label: 'Ventes' },
    { id: 'stock' as const, label: 'Mouvements stock' },
    { id: 'top' as const, label: 'Top produits' },
    { id: 'categories' as const, label: 'Catégories' },
    { id: 'clients' as const, label: 'Top clients' },
    { id: 'depenses' as const, label: 'Dépenses' },
    { id: 'commandes' as const, label: 'Commandes' },
  ];

  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0';

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

            {/* Tabs */}
            <section className="rounded-xl border bg-white p-1 shadow-[0_1px_2px_rgba(79,70,229,0.04)] dark:border-white/[0.12] dark:bg-[#0F172A]" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}>
              <div className="flex w-full items-center gap-1 overflow-x-auto scrollbar-hide">
                {tabItems.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button 
                      key={tab.id} 
                      type="button" 
                      onClick={() => setActiveTab(tab.id)} 
                      // ⭐ FIX: bg-indigo-50 + text-[14px]
                      className={`group relative flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-[14px] font-medium whitespace-nowrap transition-all duration-200 ${
                        isActive 
                          ? 'bg-indigo-50 text-indigo-900 dark:bg-brand-500/10 dark:text-brand-400' 
                          : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {isActive && <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-indigo-500 dark:bg-brand-400" />}
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
              <RapportsFooter totalProduits={stockValue?.total_produits || 0} chiffreAffaires={stats.chiffreAffaires} totalVentes={stats.nbCommandes} formatMoney={(value: number) => `${value.toLocaleString('fr-FR')} Ar`} isDark={isDark} />
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Rapports;