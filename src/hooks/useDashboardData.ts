

import { useState, useEffect, useCallback, useRef } from 'react';

export interface DashboardChartsData {
  ventesParMois: any[];
  topProduits: any[];
  categorieRepartition: any[];
  stockStatus: { en_stock: number; stock_bas: number; rupture: number };
  entreesStock: any[];
  sortiesStock: any[];
  topClients: any[];
  depensesParCategorie: any[];
  commandesStatut: any[];
}

export const useDashboardData = () => {
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<(isRefresh?: boolean) => Promise<void>>(async () => {});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ⭐ FIX: Nampiana ny firstClientDate, totalDette, nbCommandesNonPayees
  const [stats, setStats] = useState<any>({
    totalProduits: 0,
    stockTotal: 0,
    alertesStock: 0,
    ruptureStock: 0,
    commandesTotal: 0,
    commandesEnAttente: 0,
    totalClients: 0,
    clientsActifs: 0,
    chiffreAffaires: 0,
    depenses: 0,
    salaires: 0,
    salairesPayes: 0,
    beneficeNet: 0,
    stockValue: 0,
    totalPaiements: 0,
    totalDette: 0, // ⭐ VAOVAO
    nbCommandesNonPayees: 0, // ⭐ VAOVAO
    firstClientDate: null, // ⭐ VAOVAO
  });

  const [chartsData, setChartsData] = useState<DashboardChartsData>({
    ventesParMois: [],
    topProduits: [],
    categorieRepartition: [],
    stockStatus: { en_stock: 0, stock_bas: 0, rupture: 0 },
    entreesStock: [],
    sortiesStock: [],
    topClients: [],
    depensesParCategorie: [],
    commandesStatut: [],
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      fetchLock.current = false;
    };
  }, []);

  const getData = (r: any, fallback: any = []) => {
    return r.status === 'fulfilled' && r.value?.success ? r.value.data : fallback;
  };

  const toNumber = (value: any): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // ⭐ FIX: Mangataka ny daty création client (Fomba 2)
      const [statsRes, productsStatsRes, firstDateRes] = await Promise.allSettled([
        window.api.dashboard.getStats(),
        window.api.products.getStats(),
        window.api.dashboard.getChartData({ type: 'premiere-date' }),
      ]);

      if (isMounted.current) {
        const d = statsRes.status === 'fulfilled' && statsRes.value?.success ? statsRes.value.data || {} : {};
        const productsStats = productsStatsRes.status === 'fulfilled' && productsStatsRes.value?.success ? productsStatsRes.value.data || {} : {};
        
        // ⭐ FIX: Daty création client
        const firstClientDate = firstDateRes.status === 'fulfilled' && firstDateRes.value?.success 
          ? firstDateRes.value.data 
          : null;

        let salairesPayes = 0;
        try {
          const result = await window.api.payments.getStats();
          if (result?.success) {
            salairesPayes = toNumber(result.data?.total_montant);
          }
        } catch (err) {
          console.error('❌ Erreur payments.getStats:', err);
        }

        // ⭐ FIX: Mampiditra ny totalDette sy nbCommandesNonPayees
        let totalDette = 0;
        let nbCommandesNonPayees = 0;

        try {
          const detteResult = await window.api.orders.getDetteStats();
          if (detteResult?.success) {
            totalDette = toNumber(detteResult.data?.total_dette);
            nbCommandesNonPayees = toNumber(detteResult.data?.nb_commandes_non_payees);
          }
        } catch (err) {
          console.error('❌ Erreur getDetteStats:', err);
        }

        const chiffreAffaires = toNumber(d.chiffreAffaires);
        const depenses = toNumber(d.depenses);
        const beneficeNet = Math.max(0, chiffreAffaires - depenses - salairesPayes);
        const stockValue = toNumber(productsStats.valeur_totale);
        const clientsActifs = toNumber(d.totalClients);

        setStats({
          ...d,
          chiffreAffaires,
          depenses,
          salairesPayes,
          beneficeNet,
          stockValue,
          clientsActifs,
          totalDette, // ⭐ FIX
          nbCommandesNonPayees, // ⭐ FIX
          firstClientDate, // ⭐ VAOVAO
        });
      }

      const year = new Date().getFullYear();

      const [topRes, catRes, ventesRes, stockRes, entreesRes, sortiesRes, clientsRes, depensesRes, commandesRes] = await Promise.allSettled([
        window.api.dashboard.getChartData({ type: 'top-produits', limit: 20 }),
        window.api.dashboard.getChartData({ type: 'repartition-categories' }),
        window.api.dashboard.getChartData({ type: 'ventes-par-mois', year }),
        window.api.dashboard.getChartData({ type: 'stock-status' }),
        window.api.dashboard.getChartData({ type: 'entrees-stock' }),
        window.api.dashboard.getChartData({ type: 'sorties-stock' }),
        window.api.dashboard.getChartData({ type: 'top-clients' }),
        window.api.dashboard.getChartData({ type: 'depenses-categorie' }),
        window.api.dashboard.getChartData({ type: 'commandes-statut' }),
      ]);

      if (isMounted.current) {
        const topData = getData(topRes, []);
        const catData = getData(catRes, []);
        const ventesData = getData(ventesRes, []);
        const stockData = getData(stockRes, { en_stock: 0, stock_bas: 0, rupture: 0 });
        const entreesData = getData(entreesRes, []);
        const sortiesData = getData(sortiesRes, []);
        const clientsData = getData(clientsRes, []);
        const depensesData = getData(depensesRes, []);
        const commandesData = getData(commandesRes, []);

        setChartsData({
          ventesParMois: ventesData,
          topProduits: topData,
          categorieRepartition: catData,
          stockStatus: stockData,
          entreesStock: entreesData,
          sortiesStock: sortiesData,
          topClients: clientsData,
          depensesParCategorie: depensesData,
          commandesStatut: commandesData,
        });

        firstLoadDone.current = true;
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement dashboard:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
        fetchLock.current = false;
      }
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      if (isMounted.current && !fetchLock.current) {
        loadDataRef.current(true);
      }
    };

    const unsubscribers: (() => void)[] = [];

    if (window.api?.financial?.onChanged) {
      unsubscribers.push(window.api.financial.onChanged(handler));
    }
    if (window.api?.orders?.onChanged) {
      unsubscribers.push(window.api.orders.onChanged(handler));
    }
    if (window.api?.stock?.onMouvementAdded) {
      unsubscribers.push(window.api.stock.onMouvementAdded(handler));
    }
    if (window.api?.reports?.onChanged) {
      unsubscribers.push(window.api.reports.onChanged(handler));
    }

    return () => {
      unsubscribers.forEach((fn) => {
        if (typeof fn === 'function') fn();
      });
    };
  }, []);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    if (!firstLoadDone.current) {
      loadData(false);
    }
  }, [loadData]);

  return {
    loading,
    refreshing,
    stats,
    chartsData,
    loadData,
  };
};