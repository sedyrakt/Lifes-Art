
import React, { useMemo, useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { CalendarDays, ChevronDown, TrendingUp, TrendingDown, RefreshCw, Package, Users, AlertTriangle, Wallet, XCircle, ShoppingCart, Receipt } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler, Legend);

const formatAriary = (value: number | null | undefined, showSign: boolean = false) => {
  const num = Number(value || 0);
  const formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.abs(num));
  if (showSign) { if (num > 0) return `+${formatted} Ar`; if (num < 0) return `-${formatted} Ar`; return `${formatted} Ar`; }
  return `${formatted} Ar`;
};
const formatNumber = (value: number | null | undefined) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0));
const formatCompactAriary = (value: number, showSign: boolean = false) => {
  const amount = Number(value || 0), abs = Math.abs(amount);
  let r = '';
  if (abs >= 1_000_000_000) r = `${(abs/1e9).toFixed(2)}Mds Ar`;
  else if (abs >= 1_000_000) r = `${(abs/1e6).toFixed(2)}M Ar`;
  else if (abs >= 1_000) r = `${(abs/1e3).toFixed(0)}K Ar`;
  else r = `${abs} Ar`;
  if (showSign) { if (amount > 0) return `+${r}`; if (amount < 0) return `-${r}`; }
  return r;
};
const safeNumber = (value: unknown): number => { const n = Number(value); return Number.isFinite(n) ? n : 0; };

// Sparkline (INDIGO)
const Sparkline = ({ data, color = '#4F46E5' }: { data: number[]; color?: string }) => {
  const width = 150, height = 38;
  const values = data.length > 0 ? data.map(safeNumber) : [20,25,19,28,22,31,27,39,34,47];
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const points = values.map((v,i) => {
    const x = values.length === 1 ? width/2 : (i/(values.length-1))*width;
    const y = height - 6 - ((v-min)/range)*(height - 12);
    return `${x},${y}`;
  }).join(' ');
  const gid = `spark-${color.replace(/[^a-zA-Z0-9]/g,'')}`;
  return <svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-full overflow-visible" preserveAspectRatio="none">
    <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
    <polyline fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points={points} opacity="0.9" />
    <polyline fill="none" stroke={`url(#${gid})`} strokeWidth="6" opacity="0.06" points={points} />
  </svg>;
};


const KpiCard = ({ title, value, variation, sparkline, sparklineColor, negative = false, money = false, showSign = false }: {
  title: string; value: number | string; variation: number; sparkline: number[]; sparklineColor?: string;
  negative?: boolean; money?: boolean; showSign?: boolean;
}) => {
  const isPositive = variation >= 0 && !negative;
  const color = sparklineColor || (isPositive ? '#4F46E5' : '#4F46E5');
  const displayValue = money ? formatAriary(Number(value), showSign) : typeof value === 'string' ? value : formatNumber(Number(value));

  const percentColor = isPositive 
    ? 'text-success-500 dark:text-success-400' 
    : 'text-danger-500 dark:text-danger-400';
  
  return <div className="group relative min-w-0 h-[100px] overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-slate-900 px-3 py-2.5 shadow-[0_1px_2px_rgba(79,70,229,0.04)] transition-all duration-300 hover:-translate-y-[1px] hover:border-brand-500/20 dark:hover:border-brand-500/20 hover:bg-brand-500/5 dark:hover:bg-slate-800 hover:shadow-[0_4px_12px_rgba(79,70,229,0.06)]">
    <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-brand-500/[0.035] blur-2xl" />
    <div className="relative min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{title}</p>
      </div>
    
      <p className={`mt-1 truncate text-[19px] font-bold tracking-tight ${Number(value) < 0 ? 'text-brand-500 dark:text-brand-500' : 'text-slate-900 dark:text-white'}`}>{displayValue}</p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className={`text-[12.5px] font-semibold ${percentColor}`}>
          {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
        </span>
        <span className="text-[12px] text-slate-400 dark:text-slate-500">vs mois dernier</span>
      </div>
    </div>
    <div className="relative mt-1.5 w-full"><Sparkline data={sparkline} color={color} /></div>
  </div>;
};

const SectionCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-slate-900 shadow-[0_1px_2px_rgba(79,70,229,0.04)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.18)] ${className}`}>{children}</div>
);


const DashboardSkeleton = ({ isDark }: { isDark: boolean }) => {
  const base = isDark ? 'bg-white/[0.06]' : 'bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-200';
  return <div className="min-h-screen w-full p-4 space-y-4">
    <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-xl border p-4 ${border}`}>
      <div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-lg ${base} animate-pulse`} /><div className="space-y-2"><div className={`h-4 w-40 rounded ${base} animate-pulse`} /><div className={`h-3 w-24 rounded ${base} animate-pulse`} /></div></div>
      <div className={`h-9 w-28 rounded-lg ${base} animate-pulse`} />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">{[...Array(5)].map((_,i) => <div key={i} className={`h-[100px] rounded-xl border p-3 ${border}`}><div className={`h-3 w-24 rounded ${base} animate-pulse`} /><div className={`mt-3 h-6 w-20 rounded ${base} animate-pulse`} /><div className={`mt-2 h-3 w-16 rounded ${base} animate-pulse`} /><div className={`mt-2 h-8 w-full rounded ${base} animate-pulse`} /></div>)}</div>
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">{[...Array(5)].map((_,i) => <div key={i} className={`h-[100px] rounded-xl border p-3 ${border}`}><div className={`h-3 w-24 rounded ${base} animate-pulse`} /><div className={`mt-3 h-6 w-20 rounded ${base} animate-pulse`} /><div className={`mt-2 h-3 w-16 rounded ${base} animate-pulse`} /><div className={`mt-2 h-8 w-full rounded ${base} animate-pulse`} /></div>)}</div>
    <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-3"><div className={`rounded-xl border p-4 ${border}`}><div className={`h-4 w-48 rounded ${base} animate-pulse`} /><div className={`mt-4 h-[240px] rounded-lg ${base} animate-pulse`} /></div><div className={`rounded-xl border p-4 ${border}`}><div className={`h-4 w-32 rounded ${base} animate-pulse`} /><div className={`mt-4 h-[240px] rounded-lg ${base} animate-pulse`} /></div></div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3"><div className={`rounded-xl border p-4 ${border}`}><div className={`h-4 w-32 rounded ${base} animate-pulse`} />{[...Array(5)].map((_,i) => <div key={i} className={`mt-3 flex items-center gap-3 ${border}`}><div className={`h-7 w-7 rounded ${base} animate-pulse`} /><div className={`h-4 w-1/3 rounded ${base} animate-pulse`} /><div className={`h-4 w-16 rounded ${base} animate-pulse`} /></div>)}</div><div className={`rounded-xl border p-4 ${border}`}><div className={`h-4 w-32 rounded ${base} animate-pulse`} />{[...Array(5)].map((_,i) => <div key={i} className={`mt-3 flex items-center gap-3 ${border}`}><div className={`h-7 w-7 rounded ${base} animate-pulse`} /><div className={`h-4 w-1/3 rounded ${base} animate-pulse`} /><div className={`h-4 w-16 rounded ${base} animate-pulse`} /></div>)}</div></div>
  </div>;
};

export default function DashboardStock() {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState<'Jour'|'Semaine'|'Mensuel'|'Annuel'>('Mensuel');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const { loading, refreshing, stats, chartsData, loadData } = useDashboardData();
  const [showLoading, setShowLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShowLoading(false), 2000); return () => clearTimeout(t); }, []);

  const ca = safeNumber(stats?.chiffreAffaires);
  const depenses = safeNumber(stats?.depenses);
  const salaires = safeNumber(stats?.salairesPayes);
  const benefice = ca - depenses - salaires;
  const commandes = safeNumber(stats?.commandesTotal);
  const produitsStock = safeNumber(stats?.stockTotal);
  const panierMoyen = commandes > 0 ? ca / commandes : 0;
  const dette = safeNumber(stats?.totalDette);
  const cmdNonPayees = safeNumber(stats?.nbCommandesNonPayees);
  void produitsStock; void refreshing; void loadData;


  const kpis1 = useMemo(() => [
    { label: 'Chiffre d’affaires', value: ca, money: true, neg: false, sign: false },
    { label: 'Bénéfice net', value: benefice, money: true, neg: benefice < 0, sign: true },
    { label: 'Dépenses', value: depenses, money: true, neg: true, sign: false },
    { label: 'Salaires payés', value: salaires, money: true, neg: true, sign: false },
    { label: 'Panier moyen', value: panierMoyen, money: true, neg: false, sign: false },
  ], [ca, benefice, depenses, salaires, panierMoyen]);

  const kpis2 = useMemo(() => [
    { label: 'Dette client', value: dette, money: true, sign: false, trend: 2.5 },
    { label: 'Clients actifs', value: stats?.clientsActifs || 0, money: false, sign: false, trend: 5.2 },
    { label: 'Stock faible', value: stats?.alertesStock || 0, money: false, sign: false, trend: -1.2 },
    { label: 'Valeur stock', value: stats?.stockValue || 0, money: true, sign: false, trend: 3.8 },
    { label: 'Cmd. non payées', value: cmdNonPayees, money: false, sign: false, trend: -0.8 },
  ], [stats, dette, cmdNonPayees]);

  const lastTwo = useMemo(() => {
    const sorted = [...(chartsData.ventesParMois || [])].sort((a,b) => Number(a.mois)-Number(b.mois));
    return sorted.length >= 2 ? { cur: sorted[sorted.length-1], prev: sorted[sorted.length-2] } : null;
  }, [chartsData.ventesParMois]);

  const getVar = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Number(((cur-prev)/prev)*100).toFixed(1);
  const caVar = lastTwo ? getVar(safeNumber(lastTwo.cur.total_ventes), safeNumber(lastTwo.prev.total_ventes)) : 0;

  const today = new Date();
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const dateRange = `${startMonth.toLocaleDateString('fr-FR', {day:'2-digit',month:'short',year:'numeric'})} - ${today.toLocaleDateString('fr-FR', {day:'2-digit',month:'short',year:'numeric'})}`;

  const revenueTrend = useMemo(() => {
    const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    const src = chartsData.ventesParMois || [];
    return Array.isArray(src) && src.length > 0 ? src.map((item:any) => ({ label: months[Number(item.mois)-1] || `Mois ${item.mois}`, value: safeNumber(item.total_ventes) })) : [{label:'01 Mai',value:0},{label:'15 Mai',value:0},{label:'31 Mai',value:0}];
  }, [chartsData.ventesParMois]);

  const lineData = useMemo(() => ({
    labels: revenueTrend.map(i => i.label),
    datasets: [{
      label: 'Chiffre d’affaires',
      data: revenueTrend.map(i => i.value),
      borderColor: '#4F46E5',
      borderWidth: 2.5,
      pointRadius: 3.5,
      pointHoverRadius: 6,
      pointBackgroundColor: '#4F46E5',
      pointBorderColor: '#EEF2FF',
      pointBorderWidth: 2,
      tension: 0.42,
      fill: true,
      backgroundColor: (ctx: any) => {
        const { chartArea } = ctx.chart;
        if (!chartArea) return '#4F46E5';
        const grad = ctx.chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        grad.addColorStop(0, '#4F46E5');
        grad.addColorStop(0.45, isDark ? '#4F46E560' : '#4F46E560');
        grad.addColorStop(1, isDark ? 'rgba(79,70,229,0)' : 'rgba(79,70,229,0.02)');
        return grad;
      }
    }]
  }), [revenueTrend, isDark]);

  const tooltipColors = useMemo(() => ({
    bg: isDark ? '#1E293B' : '#FFFFFF',
    title: isDark ? '#F8FAFC' : '#0F172A',
    body: isDark ? '#F8FAFC' : '#4F46E5',
    border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  }), [isDark]);

  
  const lineOptions: any = {
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipColors.bg,
        titleColor: tooltipColors.title,
        bodyColor: tooltipColors.body,
        borderColor: tooltipColors.border,
        borderWidth: 1, padding: 12, displayColors: false,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        callbacks: { title: (items: any[]) => items?.[0]?.label || '', label: (ctx: any) => ` ${formatAriary(ctx.parsed.y)}` }
      }
    },
    scales: {
      x: { grid: { display: false, drawBorder: false }, border: { display: false }, ticks: { color: isDark ? '#71809A' : '#94A3B8', font: { size: 12 }, maxTicksLimit: 7 } },
      y: { beginAtZero: true, border: { display: false }, grid: { color: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0', drawBorder: false }, ticks: { color: isDark ? '#71809A' : '#94A3B8', font: { size: 12 }, padding: 8, callback: (v: any) => formatCompactAriary(Number(v)) } }
    }
  };

  const salesDist = useMemo(() => {
    const src = chartsData.topProduits || [];
    if (!Array.isArray(src) || src.length === 0) return { data: [{ label: 'Aucune vente', value: 0 }], total: 0 };
    let fmt = src.map((item:any) => ({ label: item.nom || item.produit_nom || item.name || 'Produit', value: safeNumber(item.total_ventes ?? item.total_ca ?? item.ventes ?? item.sales) })).filter(i => i.value > 0).sort((a,b) => b.value - a.value);
    if (fmt.length === 0) return { data: [{ label: 'Aucune vente', value: 0 }], total: 0 };
    const total = fmt.reduce((s,i) => s + i.value, 0);
    const MAX = 5;
    if (fmt.length > MAX) { const top = fmt.slice(0,MAX); const others = fmt.slice(MAX).reduce((s,i) => s + i.value, 0); if (others > 0) top.push({ label: 'Autres', value: others }); fmt = top; }
    return { data: fmt, total };
  }, [chartsData.topProduits]);

  const doughnutData = useMemo(() => ({
    labels: salesDist.data.map(i => i.label),
    datasets: [{
      data: salesDist.data.map(i => i.value),
      backgroundColor: ['#4F46E5','#4338CA','#4F46E5','#3730A3','#4F46E5', isDark ? '#4B5563' : '#9CA3AF'],
      borderWidth: 0, hoverOffset: 5, spacing: 2, borderRadius: 3
    }]
  }), [salesDist.data, isDark]);

 
  const doughnutOptions: any = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    animation: { duration: 700, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipColors.bg,
        titleColor: tooltipColors.title,
        bodyColor: tooltipColors.body,
        borderColor: tooltipColors.border,
        borderWidth: 1, padding: 10,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        callbacks: { label: (ctx: any) => { const total = salesDist.total; const val = safeNumber(ctx.parsed); const pct = total > 0 ? ((val/total)*100).toFixed(1) : '0.0'; return ` ${ctx.label}: ${formatAriary(val)} (${pct}%)`; } }
      }
    }
  };

  const centerPlugin = useMemo(() => ({
    id: 'doughnutCenter',
    afterDraw(chart: any) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const x = (chartArea.left + chartArea.right)/2, y = (chartArea.top + chartArea.bottom)/2;
      ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle = isDark ? '#FFFFFF' : '#4F46E5';
      ctx.font = '700 17.5px Inter, system-ui, sans-serif';
      ctx.fillText(formatCompactAriary(ca), x, y-7);
      ctx.fillStyle = '#64748B';
      ctx.font = '500 12px Inter, system-ui, sans-serif';
      ctx.fillText('Total', x, y+15);
      ctx.restore();
    }
  }), [ca, isDark]);

  const topProducts = useMemo(() => {
    const src = chartsData.topProduits || [];
    return Array.isArray(src) && src.length > 0 ? src.slice(0,5) : [{ nom: 'Aucun produit vendu', total_vendu: 0, total_ventes: 0, evolution: 0 }];
  }, [chartsData.topProduits]);

  const productIconClasses = ['bg-brand-500 text-white', 'bg-brand-500 text-white', 'bg-brand-500 text-white', 'bg-brand-400 text-white', 'bg-brand-500 text-white'];

  const alerts = useMemo(() => {
    const list: { type: string; title: string; message: string; time: string }[] = [];
    if (stats.alertesStock > 0) list.push({ type: 'stock', title: 'Alerte stock bas', message: `${stats.alertesStock} produit(s) ont un stock bas.`, time: 'Maintenant' });
    if (stats.ruptureStock > 0) list.push({ type: 'stock', title: 'Rupture de stock', message: `${stats.ruptureStock} produit(s) sont en rupture.`, time: 'Maintenant' });
    if (cmdNonPayees > 0) list.push({ type: 'paiement', title: 'Commandes non payées', message: `${cmdNonPayees} commande(s) sont non payées.`, time: 'Maintenant' });
    return list.length > 0 ? list : [{ type: 'client', title: 'Système opérationnel', message: 'Aucune alerte pour le moment.', time: 'À jour' }];
  }, [stats, cmdNonPayees]);

  const getAlertClass = (type?: string) => {
    switch(type) {
      case 'stock': return 'bg-brand-500/10 text-brand-500 dark:text-brand-500';
      case 'commande': return 'bg-brand-500/10 text-brand-600 dark:text-brand-400';
      case 'paiement': return 'bg-brand-500/10 text-brand-500 dark:text-brand-500';
      case 'client': return 'bg-success-500/10 text-success-600 dark:text-brand-500';
      default: return 'bg-brand-500/10 text-brand-500 dark:text-brand-500';
    }
  };

  const caSparkline = (chartsData.ventesParMois || []).map((v:any) => safeNumber(v.total_ventes)).slice(0,12);

  if (loading || showLoading) return <DashboardSkeleton isDark={isDark} />;

  return <div className="min-h-full w-full bg-brand-50 text-slate-900 transition-colors duration-200 dark:bg-slate-900 dark:text-white">
    <div className="mx-auto w-full max-w-[1500px] px-2 py-5 sm:px-2 lg:px-2 xl:px-4">

      <div className="group relative mb-5 flex flex-col gap-3 overflow-hidden rounded-xl border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 md:flex-row md:items-center md:justify-between dark:bg-[#0F172A]" style={{ borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0' }}>
        <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500" />
        <div className="relative z-10 flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <div><h1 className="text-[19.5px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 dark:text-slate-100">Tableau de bord</h1><p className="mt-0.5 text-[13.5px] font-medium leading-tight text-slate-500 dark:text-slate-400">Vue d'ensemble de votre activité</p></div>
          </div>
        </div>
     
        <div className="relative z-10 flex w-full shrink-0 items-center gap-2 md:w-auto">
          <button type="button" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-[13.5px] font-medium text-slate-700 transition-all duration-150 hover:border-brand-500/20 hover:bg-brand-500 hover:text-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-500" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', background: isDark ? '#0F172A' : '#FFFFFF' }}>
            <CalendarDays size={16} /><span className="hidden sm:inline">{dateRange}</span><ChevronDown size={14} className="ml-1 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis1.map((k,i) => <KpiCard key={i} title={k.label} value={k.value} variation={0} money={k.money} negative={k.neg} showSign={k.sign} sparklineColor="#4F46E5" sparkline={[0]} />)}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis2.map((k,i) => <KpiCard key={i} title={k.label} value={k.value} variation={k.trend || 0} money={k.money || false} showSign={k.sign || false} sparklineColor="#4F46E5" sparkline={[0]} />)}
      </div>


      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1.55fr_1fr]">
        <SectionCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15.5px] font-semibold text-slate-900 dark:text-slate-100">Évolution du chiffre d'affaires</h2>
            <div className="relative">
              <button type="button" onClick={() => setShowPeriodMenu(v => !v)} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[13.5px] font-medium text-slate-700 transition hover:bg-brand-500 dark:border-brand-500/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                {period}<ChevronDown size={13} className="text-slate-500" />
              </button>
              {showPeriodMenu && <div className="absolute right-0 top-10 z-50 w-28 overflow-hidden rounded-lg border border-brand-500/10 bg-white p-1 shadow-xl dark:bg-slate-900 dark:shadow-2xl">
                {['Jour','Semaine','Mensuel','Annuel'].map(item => <button key={item} type="button" onClick={() => { setPeriod(item as any); setShowPeriodMenu(false); }} className={`flex w-full rounded-md px-2.5 py-2 text-left text-[13.5px] ${period === item ? 'bg-brand-500 text-brand-500 dark:bg-brand-500/10 dark:text-brand-500' : 'text-slate-600 hover:bg-brand-500 dark:text-slate-400 dark:hover:bg-slate-800'}`}>{item}</button>)}
              </div>}
            </div>
          </div>
          <div className="h-[280px] w-full"><Line data={lineData} options={lineOptions} /></div>
        </SectionCard>

        <SectionCard className="p-4">
          <div className="mb-3"><h2 className="text-[15.5px] font-semibold text-slate-900 dark:text-slate-100">Répartition des ventes</h2></div>
          <div className="flex min-h-[280px] items-center gap-5">
            <div className="relative h-[220px] w-[220px] shrink-0"><Doughnut key={JSON.stringify(doughnutData)} data={doughnutData} options={doughnutOptions} plugins={[centerPlugin]} redraw /></div>
            <div className="min-w-0 flex-1 space-y-3">
              {salesDist.data.map((item, idx) => {
                const colors = ['bg-brand-500','bg-brand-500','bg-brand-500','bg-brand-400','bg-brand-500','bg-slate-500'];
                const total = salesDist.total;
                const pct = total > 0 ? (item.value/total)*100 : 0;
                return <div key={`${item.label}-${idx}`} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5"><span className={`h-2.5 w-2.5 shrink-0 rounded-[2px] ${colors[idx % colors.length]}`} /><span className="truncate text-[14.5px] text-slate-700 dark:text-slate-300" title={item.label}>{item.label}</span></div>
                  <span className="shrink-0 text-[14.5px] font-medium text-slate-500 dark:text-slate-300">{pct.toFixed(1)}%</span>
                </div>;
              })}
            </div>
          </div>
        </SectionCard>
      </div>

  
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr]">
        <SectionCard>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] px-4 py-3.5">
            <h2 className="text-[15.5px] font-semibold text-slate-900 dark:text-slate-100">Top 5 produits</h2>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[650px]">
              <div className="grid grid-cols-[minmax(180px,1.4fr)_80px_125px_75px] gap-2 border-b border-slate-200 dark:border-white/[0.08] px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                <span>Produit</span><span className="text-right">Quantité</span><span className="text-right">Ventes</span><span className="text-right">Évolution</span>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-white/[0.08]">
                {topProducts.map((product:any, idx) => {
                  const name = product.nom ?? product.name ?? 'Produit';
                  const qty = safeNumber(product.total_vendu ?? product.quantite ?? product.quantity);
                  const sales = safeNumber(product.total_ventes ?? product.total_ca ?? product.ventes ?? product.sales);
                  const evo = safeNumber(product.evolution);
                  return <div key={`${name}-${idx}`} className="grid grid-cols-[minmax(180px,1.4fr)_80px_125px_75px] gap-2 border-b border-slate-200 dark:border-white/[0.08] px-4 py-2.5 last:border-b-0 hover:bg-brand-500/10 dark:hover:bg-brand-500/5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11.5px] font-bold ${productIconClasses[idx % productIconClasses.length]}`}>{idx+1}</div>
                      <span className="truncate text-[14.5px] font-medium text-slate-800 dark:text-slate-300">{name}</span>
                    </div>
                    <span className="self-center text-right text-[14.5px] text-slate-500 dark:text-slate-400">{formatNumber(qty)}</span>
                    <span className="self-center text-right text-[14.5px] text-slate-500 dark:text-slate-400">{formatAriary(sales)}</span>
                    <span className={`self-center text-right text-[14.5px] font-semibold ${evo >= 0 ? 'text-success-600 dark:text-brand-500' : 'text-danger-500 dark:text-danger-500'}`}>{evo >= 0 ? '+' : ''}{evo.toFixed(1)}%</span>
                  </div>;
                })}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] px-4 py-3.5">
            <h2 className="text-[15.5px] font-semibold text-slate-900 dark:text-slate-100">Alertes & Notifications</h2>
            <button type="button" className="flex items-center gap-1 text-[10.5px] font-medium text-brand-500 transition hover:text-brand-500 dark:text-brand-500 dark:hover:text-brand-500">Voir tout</button>
          </div>
          <div>
            {alerts.map((alert, idx) => <div key={`${alert.title}-${idx}`} className="flex items-center gap-3 border-b border-slate-200 dark:border-white/[0.08] px-4 py-3 last:border-b-0 hover:bg-brand-500/10 dark:hover:bg-brand-500/5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[11.5px] font-bold ${getAlertClass(alert.type)}`}>!</div>
              <div className="min-w-0 flex-1"><p className="text-[14.5px] font-semibold text-slate-800 dark:text-slate-200">{alert.title}</p><p className="mt-0.5 text-[13.5px] text-slate-500">{alert.message}</p></div>
              <span className="shrink-0 text-[13.5px] text-slate-500 dark:text-slate-600">{alert.time}</span>
            </div>)}
          </div>
        </SectionCard>
      </div>
      <div className="h-5" />
    </div>
  </div>;
}