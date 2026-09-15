// src/components/rapports/RapportsStats.tsx
// ⭐ DESIGN aligned with KpiCard (dashboard)
// ⭐ LAYOUT: Icon ankavia | Label + Valeur + Variation inline
// ⭐ Hover accent top bar + smooth transitions
// ⭐ FIX: icon size 30 → 18, palette harmonisée, dark mode slate

import React, { useMemo } from 'react';
import {
  DollarSign, Package, ShoppingCart, TrendingUp, Users,
  ArrowUp, ArrowDown, BarChart3, TrendingDown,
} from 'lucide-react';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, isWithinInterval,
} from 'date-fns';
import { useTheme } from '../../contexts/ThemeContext';

interface RapportsStatsProps {
  stats: {
    chiffreAffaires: number;
    totalProduits: number;
    nbCommandes: number;
    benefice: number;
    nbClients: number;
    totalEntrees: number;
    totalSorties: number;
    totalVentes: number;
    tauxBenefice: number;
    trends?: any;
    trendsUp?: any;
  };
  formatMoney?: (value: number) => string;
  refreshing?: boolean;
  onRefresh?: () => void;
  commandes?: any[];
  selectedDate?: Date;
  granularity?: 'jour' | 'semaine' | 'mois' | 'annee';
}

// ⭐ Palette harmonisée (indigo / emerald / amber / red / purple / blue)
const CARD_COLORS: Record<string, { iconBg: string; iconColor: string; accent: string }> = {
  chiffreAffaires: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accent: '#6366F1',
  },
  totalProduits: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: '#10B981',
  },
  nbCommandes: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accent: '#F59E0B',
  },
  benefice: {
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    accent: '#3B82F6',
  },
  nbClients: {
    iconBg: 'bg-purple-50 dark:bg-purple-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
    accent: '#A855F7',
  },
  totalEntrees: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: '#10B981',
  },
  totalSorties: {
    iconBg: 'bg-red-50 dark:bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    accent: '#EF4444',
  },
  totalVentes: {
    iconBg: 'bg-sky-50 dark:bg-sky-500/10',
    iconColor: 'text-sky-600 dark:text-sky-400',
    accent: '#0EA5E9',
  },
};

const RapportsStats: React.FC<RapportsStatsProps> = ({
  stats,
  refreshing = false,
  commandes = [],
  selectedDate,
  granularity = 'mois',
}) => {
  const { isDark } = useTheme();

  // ⭐ Filtrage par période (inchangé)
  const filteredStats = useMemo(() => {
    if (!commandes || commandes.length === 0 || !selectedDate) return stats;
    let start: Date, end: Date;
    switch (granularity) {
      case 'jour': {
        start = new Date(selectedDate); start.setHours(0, 0, 0, 0);
        end = new Date(selectedDate); end.setHours(23, 59, 59, 999);
        break;
      }
      case 'semaine': {
        start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        break;
      }
      case 'mois': {
        start = startOfMonth(selectedDate);
        end = endOfMonth(selectedDate);
        break;
      }
      case 'annee': {
        start = startOfYear(selectedDate);
        end = endOfYear(selectedDate);
        break;
      }
      default: {
        start = new Date(selectedDate);
        end = new Date(selectedDate);
      }
    }
    const filtered = commandes.filter((cmd) => {
      const dateStr = cmd.date_commande || cmd.created_at;
      if (!dateStr) return false;
      const cmdDate = new Date(dateStr);
      if (isNaN(cmdDate.getTime())) return false;
      return isWithinInterval(cmdDate, { start, end });
    });
    const totalCA = filtered.reduce((sum, cmd) => sum + Number(cmd.total_ttc || 0), 0);
    const nbCommandes = filtered.length;
    const clientsSet = new Set<string>();
    filtered.forEach((cmd) => {
      const nom = cmd.client_nom || cmd.client?.nom || '';
      if (nom) clientsSet.add(nom);
    });
    const nbClientsUniques = clientsSet.size;
    return {
      ...stats,
      chiffreAffaires: totalCA,
      nbCommandes,
      nbClients: nbClientsUniques,
      tauxBenefice: totalCA > 0 ? (stats.benefice / totalCA) * 100 : 0,
      totalVentes: nbCommandes,
    };
  }, [commandes, selectedDate, granularity, stats]);

  const formatSimple = (value: number) => value.toLocaleString('fr-FR') + ' Ar';

  const statsCards = [
    { key: 'chiffreAffaires', label: "Chiffre d'affaires", value: formatSimple(filteredStats.chiffreAffaires), icon: TrendingUp, colorKey: 'chiffreAffaires', isMoney: true },
    { key: 'totalProduits', label: 'Total produits', value: filteredStats.totalProduits.toLocaleString('fr-FR'), icon: Package, colorKey: 'totalProduits' },
    { key: 'nbCommandes', label: 'Commandes', value: filteredStats.nbCommandes.toLocaleString('fr-FR'), icon: ShoppingCart, colorKey: 'nbCommandes' },
    { key: 'benefice', label: 'Bénéfice', value: formatSimple(filteredStats.benefice), icon: TrendingUp, colorKey: 'benefice', isMoney: true, isNegative: filteredStats.benefice < 0 },
    { key: 'nbClients', label: 'Clients uniques', value: filteredStats.nbClients.toLocaleString('fr-FR'), icon: Users, colorKey: 'nbClients' },
    { key: 'totalEntrees', label: 'Entrées', value: filteredStats.totalEntrees.toLocaleString('fr-FR'), icon: ArrowUp, colorKey: 'totalEntrees' },
    { key: 'totalSorties', label: 'Sorties', value: filteredStats.totalSorties.toLocaleString('fr-FR'), icon: ArrowDown, colorKey: 'totalSorties' },
    { key: 'totalVentes', label: 'Total ventes', value: filteredStats.totalVentes.toLocaleString('fr-FR'), icon: BarChart3, colorKey: 'totalVentes' },
  ];

  return (
    <div className="relative w-full">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const colorConfig = CARD_COLORS[stat.colorKey] ?? CARD_COLORS.chiffreAffaires;
          const trend = filteredStats.trends?.[stat.key as keyof typeof filteredStats.trends] || '0';
          const trendUp = filteredStats.trendsUp?.[stat.key as keyof typeof filteredStats.trendsUp] ?? true;
          const showTrend = trend !== '0' && trend !== '0%' && trend !== '';
          const isPositive = trendUp;
          const valueIsNegative = (stat as any).isNegative === true;

          return (
            <div
              key={stat.key}
              className="group relative flex min-h-[110px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-colors duration-200 hover:border-brand-500/30 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-brand-500/30"
            >
              {/* Top accent color amin'ny hover */}
              <div
                className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{ backgroundColor: colorConfig.accent }}
              />

              {/* Header: icon ankavia | label + valeur + variation */}
              <div className="flex min-w-0 items-start gap-3.5">
                {/* Icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorConfig.iconBg} ${colorConfig.iconColor} transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </div>

                {/* Label + Valeur + Variation */}
                <div className="min-w-0 flex-1">
                  {/* Label */}
                  <p className="truncate text-[11px] font-semibold uppercase leading-[1.5] tracking-[0.07em] text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>

                  {/* Valeur */}
                  <p
                    className={`mt-1 whitespace-nowrap text-[16px] font-bold leading-[1.5] tracking-tight ${
                      valueIsNegative
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                    title={String(stat.value)}
                  >
                    {stat.value}
                  </p>

                  {/* Variation inline */}
                  {showTrend && (
                    <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[11.5px] leading-[1.5]">
                      <span
                        className={`inline-flex items-center gap-0.5 font-semibold ${
                          isPositive
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : 'text-red-500 dark:text-red-400'
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp size={11} strokeWidth={2.4} />
                        ) : (
                          <TrendingDown size={11} strokeWidth={2.4} />
                        )}
                        {isPositive ? '+' : ''}
                        {typeof trend === 'number' ? trend.toFixed(1) : trend}%
                      </span>
                      <span className="truncate font-normal text-slate-400 dark:text-slate-500">
                        vs période précédente
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RapportsStats;