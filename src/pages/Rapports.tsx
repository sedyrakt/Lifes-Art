

import React, { useState, useEffect } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useCompany } from '../contexts/CompanyContext';
import { useRapportsData } from '../hooks/useRapportsData';
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
    refresh, handleExportStats, handleExportTopProduits, handleExportCommandes, handleExportPDF, handleExportCSV
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

  return (
    <div className="min-h-screen font-sans transition-colors duration-300" style={{ background: bgColor }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-5 px-2 py-5 sm:px-3 lg:px-5">
        
        {loading && stats.total === 0 ? (
          <RapportsSkeleton isDark={isDark} />
        ) : (
          <>
            <header className="mb-4 w-full">
              <div
                className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 md:flex-row md:items-center md:justify-between dark:bg-[#0F172A]"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}
              >
                <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500" />

                <div className="relative z-10 flex min-w-0 flex-col">
                  <div className="flex items-center gap-2">
                    <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 dark:text-slate-100">Rapports & Analyses</h1>
                    {refreshing && <span className="hidden rounded-md bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white sm:inline-flex dark:bg-brand-500/10 dark:text-brand-400">Actualisation...</span>}
                  </div>
                  <p className="mt-0.5 text-[13px] font-medium leading-tight text-slate-500 dark:text-slate-400">
                    Tableau de bord financier et suivi des performances globales
                  </p>
                </div>

                <div className="relative z-10 flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => { if (!loading && !refreshing) refresh(); }} disabled={loading || refreshing} className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg border bg-white px-3 text-[13px] font-medium text-slate-700 shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:self-auto dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10 dark:hover:text-brand-400" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}>
                    <Loader2 className={`h-4 w-4 text-brand-500 dark:text-brand-400 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>{refreshing ? 'Actualisation...' : 'Rafraîchir'}</span>
                  </button>
                </div>
              </div>
            </header>

            <section>
              <RapportsHeader
                selectedDate={selectedDate}
                granularity={granularity}
                onDateChange={setSelectedDate}
                onGranularityChange={setGranularity}
                onToday={() => setSelectedDate(new Date())}
                onRefresh={() => { if (!loading && !refreshing) refresh(); }}
                onExportStats={() => handleExportStats((value: number) => `${value.toLocaleString('fr-FR')} Ar`)}
                onExportPDF={() => handleExportPDF((value: number) => `${value.toLocaleString('fr-FR')} Ar`, company?.name || "Life's Art")}
                onExportCSV={() => handleExportCSV((value: number) => `${value.toLocaleString('fr-FR')} Ar`)}
                onExportTopProduits={() => handleExportTopProduits((value: number) => `${value.toLocaleString('fr-FR')} Ar`)}
                onExportCommandes={handleExportCommandes}
                isLoading={loading}
                isRefreshing={refreshing}
              />
            </section>

            {/* Tabs */}
            <section className="rounded-xl border bg-white p-1 shadow-[0_1px_2px_rgba(79,70,229,0.04)] dark:border-white/[0.12] dark:bg-[#0F172A]" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}>
              <div className="flex w-full items-center gap-1 overflow-x-auto scrollbar-hide">
                {tabItems.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (<button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`group relative flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-[13px] font-medium whitespace-nowrap transition-all duration-200 ${isActive ? 'bg-brand-500 text-white dark:bg-brand-500/10 dark:text-brand-400' : 'text-slate-500 hover:bg-brand-500 hover:text-white dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'}`}>
                    <span>{tab.label}</span>
                    {isActive && <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-brand-500 dark:bg-brand-400" />}
                  </button>);
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