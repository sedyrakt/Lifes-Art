import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Wallet, Package, Users, AlertCircle } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { useTheme } from '../../contexts/ThemeContext';
import { format, parseISO, isValid, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

type Granularity = 'jour' | 'semaine' | 'mois' | 'annee';
type ChartTab = 'ventes' | 'stock' | 'top' | 'categories' | 'clients' | 'depenses' | 'commandes';

interface RapportsChartsProps {
  ventesParMois?: any[];
  topProduits?: any[];
  categorieRepartition?: any[];
  selectedDate: Date;
  granularity: Granularity;
  isDark?: boolean;
  activeTab: ChartTab;
  entreesStock?: any[];
  sortiesStock?: any[];
  topClients?: any[];
  depensesParCategorie?: any[];
  commandesStatut?: any[];
  stockStatus?: { en_stock: number; stock_bas: number; rupture: number };
}

const formatMoney = (value: number): string => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))} Ar`;
const toNumber = (value: unknown): number => { const n = Number(value); return Number.isFinite(n) ? n : 0; };
const formatNumber = (value: unknown): string => new Intl.NumberFormat('fr-FR').format(toNumber(value));
const sum = (array: any[], key: string): number => array.reduce((total, item) => total + toNumber(item?.[key]), 0);
const first = (array: any[], key: string, fallback = 'Aucun'): string => array?.[0]?.[key] || fallback;
const firstNum = (array: any[], key: string): number => toNumber(array?.[0]?.[key]);
const hasData = (array: any[], key: string): boolean => array.some((item) => toNumber(item?.[key]) > 0);

const RapportsCharts: React.FC<RapportsChartsProps> = ({
  ventesParMois = [], topProduits = [], categorieRepartition = [],
  selectedDate, granularity, isDark: propIsDark, activeTab,
  entreesStock = [], sortiesStock = [], topClients = [],
  depensesParCategorie = [], commandesStatut = [],
  stockStatus = { en_stock: 0, stock_bas: 0, rupture: 0 },
}) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;

  const theme = useMemo(() => ({
    card: isDark ? '#0F172A' : '#FFFFFF', // ⭐ FIX: dark card #0F172A
    text: isDark ? '#F8FAFC' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B',
    subtle: isDark ? '#94A3B8' : '#94A3B8',
    primary: '#4F46E5', // ⭐ BRAND INDIGO
    green: '#10B981',
    purple: '#8B5CF6',
    cyan: '#06B6D4',
  }), [isDark]);

  const chartColors = useMemo(() => ({
    grid: isDark ? 'rgba(79,70,229,0.055)' : 'rgba(79,70,229,0.15)',
    // ⭐ FIX: Novaina ho #64748B (gris foncé) rehefa light mode mba ho hita mazava
    text: isDark ? '#94A3B8' : '#64748B', 
    tooltipBackground: isDark ? '#0F172A' : '#FFFFFF',
    tooltipText: isDark ? '#F8FAFC' : '#0F172A',
    tooltipBorder: isDark ? 'rgba(79,70,229,0.12)' : '#E2E8F0',
  }), [isDark]);

  const normalizedCategories = useMemo(() =>
    categorieRepartition.map((category) => ({
      id: category?.id,
      nom: category?.nom || 'Sans catégorie',
      total_produits: toNumber(category?.total_produits),
      total_stock: toNumber(category?.total_stock),
      valeur_vente: toNumber(category?.valeur_vente),
      valeur_achat: toNumber(category?.valeur_achat),
    })).filter((category) => category.total_produits > 0 || category.valeur_vente > 0),
    [categorieRepartition]);

  const categorySalesTotal = useMemo(() => {
    const salesTotal = normalizedCategories.reduce((total, category) => total + category.valeur_vente, 0);
    return salesTotal > 0 ? salesTotal : normalizedCategories.reduce((total, category) => total + category.total_produits, 0);
  }, [normalizedCategories]);

  const categoryChartValues = useMemo(() => {
    const hasSalesValue = normalizedCategories.some((category) => category.valeur_vente > 0);
    return hasSalesValue ? normalizedCategories.map((category) => category.valeur_vente) : normalizedCategories.map((category) => category.total_produits);
  }, [normalizedCategories]);

  const kpis = useMemo(() => {
    const C = (label: string, value: any, formatType: 'money' | 'number' | 'text') => ({ label, value, format: formatType });
    switch (activeTab) {
      case 'ventes': {
        const ca = sum(ventesParMois, 'total_ventes');
        const cmd = sum(ventesParMois, 'nb_commandes');
        return { items: [C("Chiffre d'affaires", ca, 'money'), C('Commandes', cmd, 'number'), C('Panier moyen', cmd > 0 ? ca / cmd : 0, 'money'), C('Vente max', Math.max(...ventesParMois.map((i) => toNumber(i?.total_ventes)), 0), 'money')] };
      }
      case 'stock': {
        const ent = sum(entreesStock, 'total_quantite');
        const sor = sum(sortiesStock, 'total_quantite');
        return { items: [C('Entrées', ent, 'number'), C('Sorties', sor, 'number'), C('Solde', ent - sor, 'number'), C('En stock', stockStatus.en_stock, 'number')] };
      }
      case 'top':
        return { items: [C('Top produit', first(topProduits, 'nom'), 'text'), C('Quantité vendue', firstNum(topProduits, 'total_vendu'), 'number'), C('Total vendu', sum(topProduits, 'total_vendu'), 'number'), C('Total ventes', sum(topProduits, 'total_ventes'), 'money')] };
      case 'categories': {
        const totalProd = sum(normalizedCategories, 'total_produits');
        const totalStock = sum(normalizedCategories, 'total_stock');
        const topCategory = first(normalizedCategories, 'nom');
        const topVal = categoryChartValues[0] || 0;
        const topPct = categorySalesTotal > 0 ? (topVal / categorySalesTotal) * 100 : 0;
        return { items: [C('Catégories', normalizedCategories.length, 'number'), C('Produits', totalProd, 'number'), C('Stock total', totalStock, 'number'), C('Top catégorie', topPct > 0 ? `${topCategory} (${topPct.toFixed(1)}%)` : topCategory, 'text')] };
      }
      case 'clients':
        return { items: [C('Clients', topClients.length, 'number'), C('Total achats', sum(topClients, 'total_achats'), 'money'), C('Top client', first(topClients, 'client_nom'), 'text'), C('Achats top client', firstNum(topClients, 'total_achats'), 'money')] };
      case 'depenses':
        return { items: [C('Total dépenses', sum(depensesParCategorie, 'total'), 'money'), C('Catégories', depensesParCategorie.length, 'number'), C('Top catégorie', first(depensesParCategorie, 'categorie'), 'text'), C('Montant top', firstNum(depensesParCategorie, 'total'), 'money')] };
      case 'commandes':
        return { items: [C('Total commandes', sum(commandesStatut, 'nb'), 'number'), C('Statuts', commandesStatut.length, 'number'), C('Top statut', first(commandesStatut, 'statut'), 'text'), C('Nb top statut', firstNum(commandesStatut, 'nb'), 'number')] };
      default: return { items: [] };
    }
  }, [activeTab, ventesParMois, entreesStock, sortiesStock, topProduits, normalizedCategories, categoryChartValues, categorySalesTotal, topClients, depensesParCategorie, commandesStatut, stockStatus]);

  const formatValue = (value: number | string, type: 'money' | 'number' | 'text'): string => {
    if (type === 'money') return formatMoney(toNumber(value));
    if (type === 'number') return formatNumber(value);
    return String(value);
  };

  const salesChart = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    let labels: string[] = [];
    let values: number[] = [];

    if (granularity === 'jour' || granularity === 'semaine') {
      const fmt = granularity === 'semaine' ? 'EEEE' : 'EEEE dd';
      labels = ventesParMois.map((item) => { try { const parsed = parseISO(item?.jour); return isValid(parsed) ? format(parsed, fmt, { locale: fr }) : 'N/A'; } catch { return 'N/A'; } });
      values = ventesParMois.map((item) => toNumber(item?.total_ventes));
    } else if (ventesParMois.length) {
      labels = ventesParMois.map((item) => months[toNumber(item?.mois) - 1] || 'N/A');
      values = ventesParMois.map((item) => toNumber(item?.total_ventes));
    } else {
      labels = granularity === 'mois' ? [format(selectedDate, 'MMMM', { locale: fr })] : months;
      values = [];
    }

    if (values.length === 1) {
      const previousMonth = subMonths(selectedDate, 1);
      labels = [format(previousMonth, 'MMMM', { locale: fr }), ...labels];
      values = [0, ...values];
    }

    return { labels: labels.length ? labels : ['Aucune donnée'], values };
  }, [ventesParMois, granularity, selectedDate]);

  const ventesChartData = useMemo(() => ({
    labels: salesChart.labels,
    datasets: [{
      label: 'Ventes (Ar)',
      data: salesChart.values,
      borderColor: theme.primary,
      borderWidth: 2.5,
      tension: 0.42,
      pointBackgroundColor: theme.primary,
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 3.5,
      pointHoverRadius: 6,
      fill: true,
      backgroundColor: (ctx: any) => {
        const { chartArea } = ctx.chart;
        if (!chartArea) return '#4F46E5';
        const gradient = ctx.chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, isDark ? '#4F46E534' : '#4F46E53c');
        gradient.addColorStop(0.45, '#4F46E53a');
        gradient.addColorStop(1, '#4F46E533');
        return gradient;
      },
    }],
  }), [salesChart, theme, isDark]);

  const topProduitsData = useMemo(() => ({
    labels: topProduits.length ? topProduits.map((p) => p?.nom || 'N/A') : ['Aucun produit'],
    datasets: [{
      label: 'Ventes (Ar)',
      data: topProduits.length ? topProduits.map((p) => toNumber(p?.total_ventes)) : [0],
      backgroundColor: theme.primary,
      borderColor: theme.primary,
      borderWidth: 0,
      borderRadius: 6,
      maxBarThickness: 42,
    }],
  }), [topProduits, theme]);

  const stockLabels = useMemo(() => [...new Set([...entreesStock.map((i) => i?.date), ...sortiesStock.map((i) => i?.date)])].filter(Boolean).sort(), [entreesStock, sortiesStock]);

  const stockData = useMemo(() => ({
    labels: stockLabels.length ? stockLabels : ['Aucune donnée'],
    datasets: [
      { label: 'Entrées', data: stockLabels.length ? stockLabels.map((date) => toNumber(entreesStock.find((i) => i?.date === date)?.total_quantite)) : [0], backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: 0, borderRadius: 5, maxBarThickness: 38 },
      { label: 'Sorties', data: stockLabels.length ? stockLabels.map((date) => toNumber(sortiesStock.find((i) => i?.date === date)?.total_quantite)) : [0], backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: 0, borderRadius: 5, maxBarThickness: 38 },
    ],
  }), [stockLabels, entreesStock, sortiesStock, theme]);

  const topClientsData = useMemo(() => ({
    labels: topClients.length ? topClients.map((client) => client?.client_nom || 'N/A') : ['Aucun client'],
    datasets: [{ label: 'Total achats (Ar)', data: topClients.length ? topClients.map((client) => toNumber(client?.total_achats)) : [0], backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: 0, borderRadius: 6, maxBarThickness: 42 }],
  }), [topClients, theme]);

  const depensesData = useMemo(() => ({
    labels: depensesParCategorie.length ? depensesParCategorie.map((item) => item?.categorie || 'Autre') : ['Aucune dépense'],
    datasets: [{ label: 'Montant (Ar)', data: depensesParCategorie.length ? depensesParCategorie.map((item) => toNumber(item?.total)) : [0], backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: 0, borderRadius: 6, maxBarThickness: 42 }],
  }), [depensesParCategorie, theme]);

  const commandesData = useMemo(() => ({
    labels: commandesStatut.length ? commandesStatut.map((item) => item?.statut || 'Inconnu') : ['Aucune commande'],
    datasets: [{ label: 'Nombre de commandes', data: commandesStatut.length ? commandesStatut.map((item) => toNumber(item?.nb)) : [0], backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: 0, borderRadius: 6, maxBarThickness: 48 }],
  }), [commandesStatut, theme]);

  const formatMoneyAxis = (value: number): string => {
    if (value === 0) return '0 Ar';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')} MAr`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')} KAr`;
    return `${value} Ar`;
  };

  const formatNumberAxis = (value: number): string => `${value}`;

  const getChartOptions = (tab: ChartTab): ChartOptions<'line' | 'bar'> => {
    const isMoneyTab = ['ventes', 'top', 'categories', 'clients', 'depenses'].includes(tab);
    const formatter = isMoneyTab ? formatMoneyAxis : formatNumberAxis;
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: chartColors.tooltipBackground,
          titleColor: chartColors.tooltipText,
          bodyColor: chartColors.tooltipText,
          borderColor: chartColors.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: { title: (items: any[]) => items?.[0]?.label || '', label: (ctx: any) => ` ${formatter(Number(ctx.parsed.y))}` },
        },
      },
      scales: {
        x: { grid: { display: false, drawBorder: false }, border: { display: false }, ticks: { color: chartColors.text, font: { size: 14 }, maxTicksLimit: 7 } }, // ⭐ FIX: size 14
        y: { beginAtZero: true, border: { display: false }, grid: { color: chartColors.grid, drawBorder: false }, ticks: { color: chartColors.text, font: { size: 14 }, padding: 8, callback: (value: any) => formatter(Number(value)) } }, // ⭐ FIX: size 14
      },
      interaction: { intersect: false, mode: 'index' },
    };
  };

  const getBarOptions = (tab: ChartTab): ChartOptions<'bar'> => {
    const base = getChartOptions(tab);
    return { ...base, plugins: { ...base.plugins, legend: { display: false } }, barPercentage: 0.65, categoryPercentage: 0.75 };
  };

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    animation: { duration: 700 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chartColors.tooltipBackground,
        titleColor: chartColors.tooltipText,
        bodyColor: chartColors.tooltipText,
        borderColor: chartColors.tooltipBorder,
        borderWidth: 1,
        padding: 12,
        callbacks: { label: (ctx: any) => { const value = Number(ctx.parsed) || 0; const total = categoryChartValues.reduce((a, b) => a + b, 0); const pct = total > 0 ? (value / total) * 100 : 0; return ` ${formatMoney(value)} — ${pct.toFixed(1)}%`; } },
      },
    },
  }), [chartColors, categoryChartValues]);

  const ChartCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <section className={`overflow-hidden rounded-xl border bg-white dark:bg-[#0F172A] ${isDark ? 'border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.18)]' : 'border-slate-200 shadow-[0_1px_2px_rgba(79,70,229,0.04)]'}`}>
      <div className={`flex items-center justify-between gap-4 border-b px-5 py-3.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
        <div className="min-w-0">
          <h2 className="truncate text-[16.5px] font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate text-[13.5px] font-medium text-slate-500 dark:text-[#94A3B8]">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
        <BarChart3 size={18} className="text-brand-500 dark:text-brand-400" />
      </div>
      <p className="text-[13.5px] font-medium text-slate-500 dark:text-[#94A3B8]">{message}</p>
    </div>
  );

  const hasStockData = useMemo(() => stockLabels.some((date) => toNumber(entreesStock.find((item) => item?.date === date)?.total_quantite) > 0 || toNumber(sortiesStock.find((item) => item?.date === date)?.total_quantite) > 0), [stockLabels, entreesStock, sortiesStock]);

  const renderChart = () => {
    switch (activeTab) {
      case 'ventes':
        return (
          <ChartCard title="Évolution des ventes" subtitle={`Chiffre d'affaires — ${granularity}`}>
            <div className="h-[280px] sm:h-[300px]">
              {salesChart.values.some((value) => value > 0) ? (<Line data={ventesChartData} options={getChartOptions('ventes')} />) : (<EmptyState message="Aucune donnée de vente pour cette période" />)}
            </div>
          </ChartCard>
        );
      case 'stock':
        return (
          <ChartCard title="Mouvements de stock" subtitle="Entrées et sorties par période">
            <div className="h-[280px] sm:h-[300px]">
              {hasStockData ? (<Bar data={stockData} options={getBarOptions('stock')} />) : (<EmptyState message="Aucun mouvement de stock" />)}
            </div>
          </ChartCard>
        );
      case 'top':
        return (
          <ChartCard title="Top 5 produits" subtitle="Produits les plus vendus">
            <div className="h-[280px] sm:h-[300px]">
              {hasData(topProduits, 'total_ventes') ? (<Bar data={topProduitsData} options={getBarOptions('top')} />) : (<EmptyState message="Aucune donnée de vente" />)}
            </div>
          </ChartCard>
        );
      case 'categories': {
        const hasCatData = normalizedCategories.length > 0 && categoryChartValues.some((value) => value > 0);
        return (
          <ChartCard title="Répartition des ventes" subtitle="Chiffre d'affaires par catégorie">
            {!hasCatData ? (<EmptyState message="Aucune vente par catégorie" />) : (
              <div className="grid grid-cols-1 items-center gap-5 px-2 pb-2 pt-1 sm:grid-cols-[190px_1fr]">
                <div className="relative mx-auto h-[220px] w-[220px]">
                  <Doughnut data={{ labels: normalizedCategories.map((category) => category.nom), datasets: [{ data: categoryChartValues, backgroundColor: theme.primary, borderColor: theme.card, borderWidth: 3, hoverOffset: 6, spacing: 2 }] }} options={doughnutOptions} />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="max-w-[150px] truncate text-center text-[16.5px] font-bold tracking-tight" style={{ color: theme.text }}>{formatMoney(categorySalesTotal)}</span>
                    <span className="mt-1 text-[13.5px] font-medium" style={{ color: theme.subtle }}>Total ventes</span>
                  </div>
                </div>
                <div className="min-w-0 space-y-2.5">
                  {normalizedCategories.slice(0, 8).map((category, index) => {
                    const value = categoryChartValues[index] || 0;
                    const percentage = categorySalesTotal > 0 ? (value / categorySalesTotal) * 100 : 0;
                    return (
                      <div key={category.id || `${category.nom}-${index}`} className="group flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: theme.primary }} />
                          <span className="truncate text-[13.5px] font-medium" style={{ color: theme.muted }}>{category.nom}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[13.5px] font-semibold" style={{ color: theme.text }}>{formatMoney(value)}</span>
                          <span className="w-[38px] text-right text-[13.5px] font-medium" style={{ color: theme.subtle }}>{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ChartCard>
        );
      }
      case 'clients':
        return (
          <ChartCard title="Top clients" subtitle="Clients par volume d'achats">
            <div className="h-[280px] sm:h-[300px]">
              {hasData(topClients, 'total_achats') ? (<Bar data={topClientsData} options={getBarOptions('clients')} />) : (<EmptyState message="Aucun achat client disponible" />)}
            </div>
          </ChartCard>
        );
      case 'depenses':
        return (
          <ChartCard title="Dépenses par catégorie" subtitle="Répartition des dépenses">
            <div className="h-[280px] sm:h-[300px]">
              {hasData(depensesParCategorie, 'total') ? (<Bar data={depensesData} options={getBarOptions('depenses')} />) : (<EmptyState message="Aucune dépense enregistrée" />)}
            </div>
          </ChartCard>
        );
      case 'commandes':
        return (
          <ChartCard title="Commandes par statut" subtitle="Répartition des commandes">
            <div className="h-[280px] sm:h-[300px]">
              {hasData(commandesStatut, 'nb') ? (<Bar data={commandesData} options={getBarOptions('commandes')} />) : (<EmptyState message="Aucune commande disponible" />)}
            </div>
          </ChartCard>
        );
      default: return null;
    }
  };

  return (
    <div className="w-full space-y-4">
      {kpis.items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {kpis.items.map((item, index) => (
            <div 
              key={`${item.label}-${index}`} 
              className={`group relative min-w-0 h-[110px] overflow-hidden rounded-xl border px-4 py-3 transition-all duration-300 hover:-translate-y-[1px] ${
                isDark 
                  ? 'border-white/[0.12] bg-[#0F172A] hover:border-brand-500/20 hover:bg-[#1E293B] hover:shadow-[0_4px_12px_rgba(79,70,229,0.06)]' 
                  : 'border-slate-200 bg-white hover:border-brand-500/10 hover:bg-brand-50/50 hover:shadow-[0_4px_12px_rgba(79,70,229,0.06)]'
              }`}
            >
              <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-brand-500/[0.035] blur-2xl" />
              <div className="relative min-w-0">
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-1 truncate text-[16.5px] font-bold tracking-tight text-slate-900 dark:text-white">
                  {formatValue(item.value, item.format)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      {renderChart()}
    </div>
  );
};

export default RapportsCharts;