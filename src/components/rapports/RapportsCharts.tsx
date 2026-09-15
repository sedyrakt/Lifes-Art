// src/components/rapports/RapportsCharts.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: 3 onglets uniquement — stock, clients, depenses
// ⭐ DESIGN: aligned with KpiCard (icon ankavia, hover accent top bar)
// ⭐ FONT SIZE: ChartCard titre 15px, subtitle 13px
// ⭐ KPI: label 12px, valeur 20px, min-h-[95px]
// ⭐ Retiré: ventes, top, categories, commandes (dupliqués Dashboard)

import React, { useMemo } from 'react';
import {
  BarChart3, Users, ShoppingBag, Award, Wallet,
  Tag, TrendingUp, ArrowUp, ArrowDown, Boxes,
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

type Granularity = 'jour' | 'semaine' | 'mois' | 'annee';
type ChartTab = 'clients' | 'depenses' | 'stock';

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

const formatMoney = (value: number): string =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))} Ar`;
const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const formatNumber = (value: unknown): string => new Intl.NumberFormat('fr-FR').format(toNumber(value));
const sum = (array: any[], key: string): number => array.reduce((total, item) => total + toNumber(item?.[key]), 0);
const first = (array: any[], key: string, fallback = 'Aucun'): string => array?.[0]?.[key] || fallback;
const firstNum = (array: any[], key: string): number => toNumber(array?.[0]?.[key]);
const hasData = (array: any[], key: string): boolean => array.some((item) => toNumber(item?.[key]) > 0);

// ⭐ Palette harmonisée par KPI
const KPI_ACCENTS: Record<string, { bg: string; color: string; accent: string }> = {
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', color: 'text-indigo-600 dark:text-indigo-400', accent: '#6366F1' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400', accent: '#10B981' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', color: 'text-amber-600 dark:text-amber-400', accent: '#F59E0B' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', color: 'text-purple-600 dark:text-purple-400', accent: '#A855F7' },
  cyan: { bg: 'bg-sky-50 dark:bg-sky-500/10', color: 'text-sky-600 dark:text-sky-400', accent: '#0EA5E9' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-500/10', color: 'text-rose-600 dark:text-rose-400', accent: '#F43F5E' },
};

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
    card: isDark ? '#0F172A' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B',
    primary: '#4F46E5',
    cyan: '#06B6D4',
  }), [isDark]);

  const chartColors = useMemo(() => ({
    grid: isDark ? 'rgba(79,70,229,0.055)' : 'rgba(79,70,229,0.15)',
    text: isDark ? '#94A3B8' : '#64748B',
    tooltipBackground: isDark ? '#0F172A' : '#FFFFFF',
    tooltipText: isDark ? '#F8FAFC' : '#0F172A',
    tooltipBorder: isDark ? 'rgba(79,70,229,0.12)' : '#E2E8F0',
  }), [isDark]);

  // ⭐ KPI pour 3 onglets (miaraka amin'ny icon + accent)
  const kpis = useMemo(() => {
    switch (activeTab) {
      case 'clients':
        return {
          items: [
            { label: 'Clients', value: topClients.length, format: 'number' as const, icon: Users, accent: 'indigo' },
            { label: 'Total achats', value: sum(topClients, 'total_achats'), format: 'money' as const, icon: ShoppingBag, accent: 'emerald' },
            { label: 'Top client', value: first(topClients, 'client_nom'), format: 'text' as const, icon: Award, accent: 'amber' },
            { label: 'Achats top client', value: firstNum(topClients, 'total_achats'), format: 'money' as const, icon: TrendingUp, accent: 'purple' },
          ],
        };
      case 'depenses':
        return {
          items: [
            { label: 'Total dépenses', value: sum(depensesParCategorie, 'total'), format: 'money' as const, icon: Wallet, accent: 'rose' },
            { label: 'Catégories', value: depensesParCategorie.length, format: 'number' as const, icon: Tag, accent: 'indigo' },
            { label: 'Top catégorie', value: first(depensesParCategorie, 'categorie'), format: 'text' as const, icon: Award, accent: 'amber' },
            { label: 'Montant top', value: firstNum(depensesParCategorie, 'total'), format: 'money' as const, icon: TrendingUp, accent: 'purple' },
          ],
        };
      case 'stock': {
        const ent = sum(entreesStock, 'total_quantite');
        const sor = sum(sortiesStock, 'total_quantite');
        return {
          items: [
            { label: 'Entrées', value: ent, format: 'number' as const, icon: ArrowUp, accent: 'emerald' },
            { label: 'Sorties', value: sor, format: 'number' as const, icon: ArrowDown, accent: 'rose' },
            { label: 'Solde', value: ent - sor, format: 'number' as const, icon: BarChart3, accent: 'indigo' },
            { label: 'En stock', value: stockStatus.en_stock, format: 'number' as const, icon: Boxes, accent: 'amber' },
          ],
        };
      }
      default: return { items: [] };
    }
  }, [activeTab, topClients, depensesParCategorie, entreesStock, sortiesStock, stockStatus]);

  const formatValue = (value: number | string, type: 'money' | 'number' | 'text'): string => {
    if (type === 'money') return formatMoney(toNumber(value));
    if (type === 'number') return formatNumber(value);
    return String(value);
  };

  const stockLabels = useMemo(
    () => [...new Set([...entreesStock.map((i) => i?.date), ...sortiesStock.map((i) => i?.date)])].filter(Boolean).sort(),
    [entreesStock, sortiesStock]
  );

  const stockData = useMemo(() => ({
    labels: stockLabels.length ? stockLabels : ['Aucune donnée'],
    datasets: [
      {
        label: 'Entrées',
        data: stockLabels.length ? stockLabels.map((date) => toNumber(entreesStock.find((i) => i?.date === date)?.total_quantite)) : [0],
        backgroundColor: theme.primary,
        borderColor: theme.primary,
        borderWidth: 0,
        borderRadius: 5,
        maxBarThickness: 38,
      },
      {
        label: 'Sorties',
        data: stockLabels.length ? stockLabels.map((date) => toNumber(sortiesStock.find((i) => i?.date === date)?.total_quantite)) : [0],
        backgroundColor: theme.cyan,
        borderColor: theme.cyan,
        borderWidth: 0,
        borderRadius: 5,
        maxBarThickness: 38,
      },
    ],
  }), [stockLabels, entreesStock, sortiesStock, theme]);

  const topClientsData = useMemo(() => ({
    labels: topClients.length ? topClients.map((client) => client?.client_nom || 'N/A') : ['Aucun client'],
    datasets: [{
      label: 'Total achats (Ar)',
      data: topClients.length ? topClients.map((client) => toNumber(client?.total_achats)) : [0],
      backgroundColor: theme.primary,
      borderColor: theme.primary,
      borderWidth: 0,
      borderRadius: 6,
      maxBarThickness: 42,
    }],
  }), [topClients, theme]);

  const depensesData = useMemo(() => ({
    labels: depensesParCategorie.length ? depensesParCategorie.map((item) => item?.categorie || 'Autre') : ['Aucune dépense'],
    datasets: [{
      label: 'Montant (Ar)',
      data: depensesParCategorie.length ? depensesParCategorie.map((item) => toNumber(item?.total)) : [0],
      backgroundColor: theme.primary,
      borderColor: theme.primary,
      borderWidth: 0,
      borderRadius: 6,
      maxBarThickness: 42,
    }],
  }), [depensesParCategorie, theme]);

  const formatMoneyAxis = (value: number): string => {
    if (value === 0) return '0 Ar';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')} MAr`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')} KAr`;
    return `${value} Ar`;
  };

  const formatNumberAxis = (value: number): string => `${value}`;

  const getChartOptions = (tab: ChartTab): ChartOptions<'bar'> => {
    const isMoneyTab = ['clients', 'depenses'].includes(tab);
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
          callbacks: {
            title: (items: any[]) => items?.[0]?.label || '',
            label: (ctx: any) => ` ${formatter(Number(ctx.parsed.y))}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          border: { display: false },
          ticks: { color: chartColors.text, font: { size: 12.5 }, maxTicksLimit: 7 },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: chartColors.grid, drawBorder: false },
          ticks: { color: chartColors.text, font: { size: 12.5 }, padding: 8, callback: (value: any) => formatter(Number(value)) },
        },
      },
      interaction: { intersect: false, mode: 'index' },
    };
  };

  const getBarOptions = (tab: ChartTab): ChartOptions<'bar'> => {
    const base = getChartOptions(tab);
    return { ...base, barPercentage: 0.65, categoryPercentage: 0.75 };
  };

  // ⭐ ChartCard mitovy amin'ny KpiCard + AnalyseCommerciale (titre 15px, subtitle 13px)
  const ChartCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <section className={`overflow-hidden rounded-xl border-[0.5px] shadow-sm ${isDark ? 'border-white/[0.12] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}>
      <div className={`flex items-center justify-between gap-4 border-b px-4 py-3 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
        <div className="min-w-0">
          {/* ⭐ Titre : 13.5px → 15px */}
          <h2 className="truncate text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
          {/* ⭐ Subtitle : 11.5px → 13px */}
          {subtitle && <p className="mt-0.5 truncate text-[13px] font-medium leading-[1.3] text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-slate-400">
        <BarChart3 size={18} className="text-brand-500 dark:text-brand-400" />
      </div>
      <p className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );

  const hasStockData = useMemo(
    () => stockLabels.some((date) =>
      toNumber(entreesStock.find((item) => item?.date === date)?.total_quantite) > 0 ||
      toNumber(sortiesStock.find((item) => item?.date === date)?.total_quantite) > 0
    ),
    [stockLabels, entreesStock, sortiesStock]
  );

  const renderChart = () => {
    switch (activeTab) {
      case 'clients':
        return (
          <ChartCard title="Top clients" subtitle="Clients par volume d'achats">
            <div className="h-[260px] sm:h-[280px]">
              {hasData(topClients, 'total_achats')
                ? (<Bar data={topClientsData} options={getBarOptions('clients')} />)
                : (<EmptyState message="Aucun achat client disponible" />)}
            </div>
          </ChartCard>
        );
      case 'depenses':
        return (
          <ChartCard title="Dépenses par catégorie" subtitle="Répartition des dépenses">
            <div className="h-[260px] sm:h-[280px]">
              {hasData(depensesParCategorie, 'total')
                ? (<Bar data={depensesData} options={getBarOptions('depenses')} />)
                : (<EmptyState message="Aucune dépense enregistrée" />)}
            </div>
          </ChartCard>
        );
      case 'stock':
        return (
          <ChartCard title="Mouvements de stock" subtitle="Entrées et sorties par période">
            <div className="h-[260px] sm:h-[280px]">
              {hasStockData
                ? (<Bar data={stockData} options={getBarOptions('stock')} />)
                : (<EmptyState message="Aucun mouvement de stock" />)}
            </div>
          </ChartCard>
        );
      default: return null;
    }
  };

  return (
    <div className="w-full space-y-3.5">
      {/* ⭐ KPI cards aligned with KpiCard */}
      {kpis.items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.items.map((item, index) => {
            const Icon = item.icon;
            const accent = KPI_ACCENTS[item.accent] ?? KPI_ACCENTS.indigo;
            const isNegativeValue = item.format !== 'text' && toNumber(item.value) < 0;

            return (
              <div
                key={`${item.label}-${index}`}
                /* ⭐ FIX: min-h-[100px] → min-h-[95px], py-3.5 → py-3 */
                className="group relative flex min-h-[95px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors duration-200 hover:border-brand-500/30 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-brand-500/30"
              >
                {/* Top accent color amin'ny hover */}
                <div
                  className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ backgroundColor: accent.accent }}
                />

                <div className="flex min-w-0 items-start gap-3.5">
                  {/* Icon : h-10 w-10, size 20 */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.bg} ${accent.color} transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon size={20} strokeWidth={2.2} />
                  </div>

                  {/* Label + Valeur */}
                  <div className="min-w-0 flex-1">
                    {/* ⭐ Label : 11px → 12px */}
                    <p className="truncate text-[12px] font-semibold uppercase leading-[1.4] tracking-[0.07em] text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    {/* ⭐ Valeur : 16px → 20px */}
                    <p
                      className={`mt-1 truncate text-[20px] font-bold leading-[1.3] tracking-tight ${
                        isNegativeValue
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                      title={String(item.value)}
                    >
                      {formatValue(item.value, item.format)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {renderChart()}
    </div>
  );
};

export default RapportsCharts;