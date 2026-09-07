import React, { useMemo } from 'react';
import { DollarSign, Package, ShoppingCart, TrendingUp, Users, ArrowUp, ArrowDown, BarChart3, TrendingDown } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { useTheme } from '../../contexts/ThemeContext';

interface RapportsStatsProps {
  stats: { chiffreAffaires: number; totalProduits: number; nbCommandes: number; benefice: number; nbClients: number; totalEntrees: number; totalSorties: number; totalVentes: number; tauxBenefice: number; trends?: any; trendsUp?: any; };
  formatMoney?: (value: number) => string;
  refreshing?: boolean;
  onRefresh?: () => void;
  commandes?: any[];
  selectedDate?: Date;
  granularity?: 'jour' | 'semaine' | 'mois' | 'annee';
}

const CARD_COLORS = {
  chiffreAffaires: { bg: 'bg-[#e18e00] dark:bg-[#e18e00]', text: 'text-[#e18e00] dark:text-[#e18e00]', iconClass: 'bg-[#e18e00] text-[#e18e00] dark:bg-[#e18e00] dark:text-[#e18e00]' },
  totalProduits: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  nbCommandes: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  benefice: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  nbClients: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', iconClass: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' },
  totalEntrees: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  totalSorties: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', iconClass: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
  totalVentes: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
};

const RapportsStats: React.FC<RapportsStatsProps> = ({ stats, refreshing = false, commandes = [], selectedDate, granularity = 'mois' }) => {
  const { isDark } = useTheme();

  const filteredStats = useMemo(() => {
    if (!commandes || commandes.length === 0 || !selectedDate) return stats;
    let start: Date, end: Date;
    switch (granularity) {
      case 'jour': { start = new Date(selectedDate); start.setHours(0,0,0,0); end = new Date(selectedDate); end.setHours(23,59,59,999); break; }
      case 'semaine': { start = startOfWeek(selectedDate, { weekStartsOn: 1 }); end = endOfWeek(selectedDate, { weekStartsOn: 1 }); break; }
      case 'mois': { start = startOfMonth(selectedDate); end = endOfMonth(selectedDate); break; }
      case 'annee': { start = startOfYear(selectedDate); end = endOfYear(selectedDate); break; }
      default: { start = new Date(selectedDate); end = new Date(selectedDate); }
    }
    const filtered = commandes.filter(cmd => {
      const dateStr = cmd.date_commande || cmd.created_at;
      if (!dateStr) return false;
      const cmdDate = new Date(dateStr);
      if (isNaN(cmdDate.getTime())) return false;
      return isWithinInterval(cmdDate, { start, end });
    });
    const totalCA = filtered.reduce((sum, cmd) => sum + Number(cmd.total_ttc || 0), 0);
    const nbCommandes = filtered.length;
    const clientsSet = new Set<string>();
    filtered.forEach(cmd => { const nom = cmd.client_nom || cmd.client?.nom || ''; if (nom) clientsSet.add(nom); });
    const nbClientsUniques = clientsSet.size;
    return { ...stats, chiffreAffaires: totalCA, nbCommandes, nbClients: nbClientsUniques, tauxBenefice: totalCA > 0 ? (stats.benefice / totalCA) * 100 : 0, totalVentes: nbCommandes };
  }, [commandes, selectedDate, granularity, stats]);

  const formatSimple = (value: number) => value.toLocaleString('fr-FR') + ' Ar';

  const statsCards = [
    { key: 'chiffreAffaires', label: "Chiffre d'affaires", value: formatSimple(filteredStats.chiffreAffaires), icon: TrendingUp, colorKey: 'chiffreAffaires' },
    { key: 'totalProduits', label: 'Total produits', value: filteredStats.totalProduits.toLocaleString('fr-FR'), icon: Package, colorKey: 'totalProduits' },
    { key: 'nbCommandes', label: 'Commandes', value: filteredStats.nbCommandes.toLocaleString('fr-FR'), icon: ShoppingCart, colorKey: 'nbCommandes' },
    { key: 'benefice', label: 'Bénéfice', value: formatSimple(filteredStats.benefice), icon: TrendingUp, colorKey: 'benefice' },
    { key: 'nbClients', label: 'Clients uniques', value: filteredStats.nbClients.toLocaleString('fr-FR'), icon: Users, colorKey: 'nbClients' },
    { key: 'totalEntrees', label: 'Entrées', value: filteredStats.totalEntrees.toLocaleString('fr-FR'), icon: ArrowUp, colorKey: 'totalEntrees' },
    { key: 'totalSorties', label: 'Sorties', value: filteredStats.totalSorties.toLocaleString('fr-FR'), icon: ArrowDown, colorKey: 'totalSorties' },
    { key: 'totalVentes', label: 'Total ventes', value: filteredStats.totalVentes.toLocaleString('fr-FR'), icon: BarChart3, colorKey: 'totalVentes' },
  ];

  return (
    <div className="relative w-full">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map(stat => {
          const Icon = stat.icon;
          const colorConfig = CARD_COLORS[stat.colorKey as keyof typeof CARD_COLORS];
          const trend = filteredStats.trends?.[stat.key as keyof typeof filteredStats.trends] || '0';
          const trendUp = filteredStats.trendsUp?.[stat.key as keyof typeof filteredStats.trendsUp] ?? true;
          const showTrend = trend !== '0' && trend !== '0%' && trend !== '';
          const isPositive = trendUp;

          return (
            <div key={stat.key} className="group relative min-h-[80px] rounded-lg border border-[#e18e00]/10 dark:border-white/[0.12] bg-white dark:bg-[#2A2A2A] px-4 py-3.5 shadow-[0_1px_2px_rgba(242,118,129,0.03)] transition-all duration-200 hover:border-[#e18e00]/10 dark:hover:border-white/[0.18] hover:bg-[#e18e00]/10 dark:hover:bg-[#333333] hover:shadow-[0_2px_6px_rgba(242,118,129,0.05)] ring-1 ring-transparent hover:ring-[#e18e00]/20 dark:hover:ring-[#e18e00]/20">
              <div className={`absolute left-0 top-3 bottom-3  rounded-r-full bg-[#e18e00]/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:bg-[#e18e00]`} />
              
              <div className="flex items-start gap-3">
                <div className={`flex  shrink-0 items-center justify-center rounded-lg ${colorConfig.iconClass}`}>
                  <Icon size={30} />
                </div>
                <div className="">
                  <div className="text-[18px] font-semibold tracking-tight text-slate-900 dark:text-[#FDE2E4]">{stat.value}</div>
                  <div className="mt-0.5 truncate text-[14px] font-medium text-slate-500 dark:text-[#B0B0B0]">{stat.label}</div>
                  {showTrend && (
                    <div className="mt-1 flex items-center gap-1.5">
                      {isPositive ? (<TrendingUp size={30}  className="text-emerald-500 dark:text-emerald-400" />) : (<TrendingDown size={30} className="text-red-500 dark:text-red-400" />)}
                      <span className={`text-[12px] font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{isPositive ? '+' : ''}{trend}%</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">vs période précédente</span>
                    </div>
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