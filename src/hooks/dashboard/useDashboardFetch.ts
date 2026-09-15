// src/hooks/dashboard/useDashboardFetch.ts
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TSY MISY MOCK FALLBACK — tena data avy amin'ny API ihany
// ⭐ FIX: Bénéfice net = CA − Dépenses − ACHATS − Salaires
//         mba hifanaraka amin'ny "Analyses avancées" sy "Commandes"

import { useCallback } from 'react';
import type { DateRangeType, DashboardStats, DashboardChartsData } from './types';
import { INITIAL_STATS, INITIAL_CHARTS, DEBUG } from './constants';
import { toNumber, toNumberArray, getData } from './helpers';
import { getDateRange } from './dateRange';
import { getGroupBy } from './groupBy';

interface FetchParams {
  dateRange: DateRangeType;
  customStartDate: string;
  customEndDate: string;
  setStats: (stats: DashboardStats) => void;
  setChartsData: (data: DashboardChartsData) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  isMountedRef: React.MutableRefObject<boolean>;
  requestIdRef: React.MutableRefObject<number>;
  firstLoadDoneRef: React.MutableRefObject<boolean>;
}

/**
 * ⭐ loadData — ny fetches rehetra (stats + charts + sparklines)
 * ⭐ TSY MISY MOCK FALLBACK — tena data ihany
 */
export const useDashboardFetch = ({
  dateRange,
  customStartDate,
  customEndDate,
  setStats,
  setChartsData,
  setLoading,
  setRefreshing,
  isMountedRef,
  requestIdRef,
  firstLoadDoneRef,
}: FetchParams) => {
  const loadData = useCallback(async (isRefresh = false) => {
    const currentRequest = ++requestIdRef.current;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { startDate, endDate } = getDateRange(dateRange, customStartDate, customEndDate);
      const groupBy = getGroupBy(dateRange);
      const year = new Date().getFullYear();

      if (DEBUG) console.log('[useDashboardData] 🚀 loadData', { dateRange, startDate, endDate, groupBy });

      // ─── Étape 1 : Stats + Products + First Date ───
      const [statsRes, productsStatsRes, firstDateRes] = await Promise.allSettled([
        window.api.dashboard.getStats({ startDate, endDate }),
        window.api.products.getStats(),
        window.api.dashboard.getChartData({ type: 'premiere-date' }),
      ]);

      if (!isMountedRef.current || currentRequest !== requestIdRef.current) return;

      const dashboardData = statsRes.status === 'fulfilled' && statsRes.value?.success
        ? statsRes.value.data || {}
        : {};
      const productsStats = productsStatsRes.status === 'fulfilled' && productsStatsRes.value?.success
        ? productsStatsRes.value.data || {}
        : {};
      const firstClientDate = firstDateRes.status === 'fulfilled' && firstDateRes.value?.success
        ? firstDateRes.value.data
        : null;

      // ⭐ Cohérence Bénéfice net — MISY ACHATS
      const chiffreAffaires = toNumber(dashboardData.chiffreAffaires);
      const depenses = toNumber(dashboardData.depenses);
      const achats = toNumber(dashboardData.achats);              // ⭐ NOUVEAU
      const salairesPayes = toNumber(dashboardData.salairesPayes ?? dashboardData.salaires);

      // ⭐ FIX: Bénéfice = CA − Dépenses − ACHATS − Salaires
      const beneficeNet = chiffreAffaires - depenses - achats - salairesPayes;

      const stockValue = toNumber(dashboardData.stockValue ?? productsStats.valeur_totale);
      const clientsActifs = toNumber(dashboardData.clientsActifs ?? dashboardData.totalClients);

      setStats({
        ...INITIAL_STATS,
        ...dashboardData,
        chiffreAffaires,
        depenses,
        achats,                                                   // ⭐ NOUVEAU
        salaires: toNumber(dashboardData.salaires),
        salairesPayes,
        beneficeNet,
        stockValue,
        stockTotal: toNumber(dashboardData.stockTotal),
        totalProduits: toNumber(dashboardData.totalProduits),
        ruptureStock: toNumber(dashboardData.ruptureStock),
        alertesStock: toNumber(dashboardData.alertesStock),
        stockNormal: toNumber(dashboardData.stockNormal),
        rotationRate: toNumber(dashboardData.rotationRate),
        commandesTotal: toNumber(dashboardData.commandesTotal),
        commandesEnAttente: toNumber(dashboardData.commandesEnAttente),
        totalClients: toNumber(dashboardData.totalClients),
        clientsActifs,
        totalDette: toNumber(dashboardData.totalDette),
        nbCommandesNonPayees: toNumber(dashboardData.nbCommandesNonPayees),
        totalPaiements: toNumber(dashboardData.totalPaiements ?? salairesPayes),
        firstClientDate,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      });

      // ─── Étape 2 : Chart data + Sparklines ───
      const [
        topRes, catRes, ventesRes, stockRes,
        entreesRes, sortiesRes, clientsRes,
        depensesRes, commandesRes,
        ruptureDetailsRes, detteDetailsRes, commandesAttenteRes,
        sparklineRes,
      ] = await Promise.allSettled([
        window.api.dashboard.getChartData({ type: 'top-produits', limit: 20, startDate, endDate, groupBy }),
        window.api.dashboard.getChartData({ type: 'repartition-categories', startDate, endDate, groupBy }),
        window.api.dashboard.getChartData({ type: 'ventes-par-mois', year, startDate, endDate, groupBy }),
        window.api.dashboard.getChartData({ type: 'stock-status' }),
        window.api.dashboard.getChartData({ type: 'entrees-stock', startDate, endDate, groupBy }),
        window.api.dashboard.getChartData({ type: 'sorties-stock', startDate, endDate, groupBy }),
        window.api.dashboard.getChartData({ type: 'top-clients', startDate, endDate }),
        window.api.dashboard.getChartData({ type: 'depenses-categorie', startDate, endDate }),
        window.api.dashboard.getChartData({ type: 'commandes-statut', startDate, endDate }),
        window.api.dashboard.getChartData({ type: 'rupture-stock-details' }),
        window.api.dashboard.getChartData({ type: 'dette-clients-details', startDate, endDate }),
        window.api.dashboard.getChartData({ type: 'commandes-en-attente-details', startDate, endDate }),
        window.api.dashboard.getChartData({ type: 'sparkline-stats', startDate, endDate, limit: 12 }),
      ]);

      if (!isMountedRef.current || currentRequest !== requestIdRef.current) return;

      const sparklineData = getData(sparklineRes, {}) as any;

      // ⭐ TENA DATA avy amin'ny API — tsy misy mock fallback
      const ventesParMois = getData(ventesRes, []);
      const categorieRepartition = getData(catRes, []);
      const topProduits = getData(topRes, []);

      if (DEBUG) {
        console.log('📊 [useDashboardFetch] ventesParMois:', {
          dateRange,
          groupBy,
          startDate,
          endDate,
          count: Array.isArray(ventesParMois) ? ventesParMois.length : 0,
          sample: Array.isArray(ventesParMois) ? ventesParMois.slice(0, 3) : [],
          lastSample: Array.isArray(ventesParMois) ? ventesParMois.slice(-3) : [],
        });
        console.log('📊 [useDashboardFetch] categorieRepartition:', {
          count: Array.isArray(categorieRepartition) ? categorieRepartition.length : 0,
        });
        console.log('📊 [useDashboardFetch] topProduits:', {
          count: Array.isArray(topProduits) ? topProduits.length : 0,
        });
      }

      setChartsData({
        ventesParMois: Array.isArray(ventesParMois) ? ventesParMois : [],
        topProduits: Array.isArray(topProduits) ? topProduits : [],
        categorieRepartition: Array.isArray(categorieRepartition) ? categorieRepartition : [],
        stockStatus: getData(stockRes, { en_stock: 0, stock_bas: 0, rupture: 0 }),
        entreesStock: getData(entreesRes, []),
        sortiesStock: getData(sortiesRes, []),
        topClients: getData(clientsRes, []),
        depensesParCategorie: getData(depensesRes, []),
        commandesStatut: getData(commandesRes, []),
        ruptureStockDetails: getData(ruptureDetailsRes, []),
        detteClientsDetails: getData(detteDetailsRes, []),
        commandesEnAttenteDetails: getData(commandesAttenteRes, []),
        sparklineCA: toNumberArray(sparklineData?.ca),
        sparklineBenefice: toNumberArray(sparklineData?.benefice),
        sparklineCommandes: toNumberArray(sparklineData?.commandes),
        sparklineClients: toNumberArray(sparklineData?.clients),
        sparklineStockValue: toNumberArray(sparklineData?.stockValue),
        sparklineRupture: toNumberArray(sparklineData?.rupture),
        sparklineAlertes: toNumberArray(sparklineData?.alertes),
        sparklineRotation: toNumberArray(sparklineData?.rotation),
      });

      firstLoadDoneRef.current = true;
    } catch (err) {
      if (currentRequest === requestIdRef.current) {
        console.error('❌ [Dashboard] Erreur chargement:', err);
      }
    } finally {
      if (isMountedRef.current && currentRequest === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [dateRange, customStartDate, customEndDate, setStats, setChartsData, setLoading, setRefreshing, isMountedRef, requestIdRef, firstLoadDoneRef]);

  return { loadData };
};