// src/hooks/useRapportsData.ts
// ⭐ FIX: getBenefice mandray { year, startDate, endDate } → mifanaraka amin'ny période
// ⭐ FIX: getCommandesRecentes mandray période
// ⭐ FIX: getCommandesStatut mandray période
// ⭐ FIX: getEntreesStock / getSortiesStock mandray période

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  RapportsStats,
  TopProduit,
  VenteParMois,
  CategorieRepartition,
  CommandeRecente,
  Periode,
  ExportPeriod,
} from './rapports/types';
import {
  toNumber,
  sanitizeMoney,
  toLocalDateString,
  getPeriodLabel,
  computeExportPeriodRange,
  isDateInRange,
  getReportsApi,
} from './rapports/helpers';
import {
  useRapportsExport,
} from './rapports/useRapportsExport';

export type { RapportsStats, TopProduit, VenteParMois, CategorieRepartition, CommandeRecente, Periode, ExportPeriod };

export const useRapportsData = (selectedDate?: Date, granularity?: string) => {
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<(isRefresh?: boolean) => Promise<void>>(async () => {});
  const prevPeriodRef = useRef<{ period: ExportPeriod; date: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Periode>('mois');
  const [summary, setSummary] = useState<any>({});
  const [ventesParMois, setVentesParMois] = useState<VenteParMois[]>([]);
  const [topProduits, setTopProduits] = useState<TopProduit[]>([]);
  const [categorieRepartition, setCategorieRepartition] = useState<CategorieRepartition[]>([]);
  const [commandesRecentes, setCommandesRecentes] = useState<CommandeRecente[]>([]);
  const [beneficeData, setBeneficeData] = useState<any>({});
  const [stockValue, setStockValue] = useState<any>({});
  const [stockStatus, setStockStatus] = useState({ en_stock: 0, stock_bas: 0, rupture: 0 });
  const [entreesStock, setEntreesStock] = useState<any[]>([]);
  const [sortiesStock, setSortiesStock] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [depensesParCategorie, setDepensesParCategorie] = useState<any[]>([]);
  const [commandesStatut, setCommandesStatut] = useState<any[]>([]);

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(() => toLocalDateString());

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      fetchLock.current = false;
    };
  }, []);

  const stats = useMemo((): RapportsStats => {
    const chiffreAffaires = toNumber(summary?.chiffre_affaires ?? summary?.chiffreAffaires);
    const benefice = toNumber(beneficeData?.benefice_net ?? beneficeData?.beneficeNet ?? beneficeData?.benefice);
    const nbCommandes = toNumber(summary?.total_commandes ?? summary?.totalCommandes);
    const nbClients = toNumber(summary?.clients_uniques ?? summary?.clientsUniques ?? summary?.total_clients ?? summary?.totalClients);
    const totalEntrees = entreesStock.reduce((total, item) => total + toNumber(item?.total_quantite), 0);
    const totalSorties = sortiesStock.reduce((total, item) => total + toNumber(item?.total_quantite), 0);

    return {
      totalProduits: toNumber(stockValue?.total_produits ?? stockValue?.totalProduits),
      totalVentes: nbCommandes,
      totalEntrees,
      totalSorties,
      chiffreAffaires,
      benefice,
      nbCommandes,
      nbClients,
      tauxBenefice: chiffreAffaires > 0 ? (benefice / chiffreAffaires) * 100 : 0,
    };
  }, [summary, beneficeData, stockValue, entreesStock, sortiesStock]);

  // ⭐⭐⭐ LOADDATA — mampiasa exportPeriod ho an'ny date range ⭐⭐⭐
  const loadData = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const api = getReportsApi();
      if (!api) {
        console.error('❌ window.api.reports est indisponible');
        return;
      }

      const now = selectedDate || new Date();
      const year = now.getFullYear();

      // ⭐ Période mifanaraka amin'ny CA sy Bénéfice
      const { startDate, endDate } = computeExportPeriodRange(exportPeriod, exportCustomDate);
      const dateOptions = { startDate, endDate };

      const results = await Promise.allSettled([
        api.getSummary ? api.getSummary(dateOptions) : Promise.resolve({ success: false }),
        api.getVentesParMois ? api.getVentesParMois(year) : Promise.resolve({ success: false }),
        api.getTopProduits ? api.getTopProduits({ limit: 10, ...dateOptions }) : Promise.resolve({ success: false }),
        api.getRepartitionCategorie ? api.getRepartitionCategorie() : Promise.resolve({ success: false }),
        // ⭐ FIX: getCommandesRecentes mandray période
        api.getCommandesRecentes ? api.getCommandesRecentes({ limit: 5, ...dateOptions }) : Promise.resolve({ success: false }),
        // ⭐ FIX: getBenefice mandray période (mifanaraka amin'ny CA)
        api.getBenefice ? api.getBenefice({ year, startDate, endDate }) : Promise.resolve({ success: false }),
        api.getStockValue ? api.getStockValue() : Promise.resolve({ success: false }),
        api.getStockStatus ? api.getStockStatus() : Promise.resolve({ success: false }),
        // ⭐ FIX: getEntreesStock / getSortiesStock mandray période
        api.getEntreesStock ? api.getEntreesStock(dateOptions) : Promise.resolve({ success: false }),
        api.getSortiesStock ? api.getSortiesStock(dateOptions) : Promise.resolve({ success: false }),
        api.getTopClients ? api.getTopClients({ limit: 5, ...dateOptions }) : Promise.resolve({ success: false }),
        api.getDepensesParCategorie ? api.getDepensesParCategorie(dateOptions) : Promise.resolve({ success: false }),
        // ⭐ FIX: getCommandesStatut mandray période
        api.getCommandesStatut ? api.getCommandesStatut(dateOptions) : Promise.resolve({ success: false }),
      ]);

      const extract = (result: any) => {
        if (result?.status === 'fulfilled' && result?.value?.success) {
          return result.value.data;
        }
        return null;
      };

      const summaryResult = extract(results[0]);
      const ventesResult = extract(results[1]);
      const topProduitsResult = extract(results[2]);
      const categoriesResult = extract(results[3]);
      const recentOrdersResult = extract(results[4]);
      const beneficeResult = extract(results[5]);
      const stockValueResult = extract(results[6]);
      const stockStatusResult = extract(results[7]);
      const entreesResult = extract(results[8]);
      const sortiesResult = extract(results[9]);
      const topClientsResult = extract(results[10]);
      const depensesResult = extract(results[11]);
      const commandesStatutResult = extract(results[12]);

      const recentCommandsRaw = Array.isArray(recentOrdersResult) ? recentOrdersResult : [];
      const recentCommands = recentCommandsRaw
        .filter((cmd: any) => isDateInRange(cmd?.date_commande, startDate, endDate))
        .map((command: any) => {
          const numero = command?.commande_numero;
          return {
            ...command,
            commande_numero: typeof numero === 'string' && numero.trim()
              ? numero
              : `CMD-${String(command?.id || 0).padStart(6, '0')}`,
          };
        });

      if (!isMounted.current) return;

      if (summaryResult) setSummary(summaryResult);
      if (Array.isArray(ventesResult)) setVentesParMois(ventesResult);
      if (Array.isArray(topProduitsResult)) setTopProduits(topProduitsResult);
      if (Array.isArray(categoriesResult)) setCategorieRepartition(categoriesResult);

      setCommandesRecentes(recentCommands);

      if (beneficeResult) setBeneficeData(beneficeResult);
      if (stockValueResult) setStockValue(stockValueResult);

      if (stockStatusResult) {
        setStockStatus({
          en_stock: toNumber(stockStatusResult.en_stock),
          stock_bas: toNumber(stockStatusResult.stock_bas),
          rupture: toNumber(stockStatusResult.rupture),
        });
      }

      if (Array.isArray(entreesResult)) setEntreesStock(entreesResult);
      if (Array.isArray(sortiesResult)) setSortiesStock(sortiesResult);
      if (Array.isArray(topClientsResult)) setTopClients(topClientsResult);
      if (Array.isArray(depensesResult)) setDepensesParCategorie(depensesResult);
      if (Array.isArray(commandesStatutResult)) setCommandesStatut(commandesStatutResult);

      firstLoadDone.current = true;
    } catch (error) {
      console.error('❌ Erreur chargement rapports:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
        fetchLock.current = false;
      }
    }
  }, [selectedDate, granularity, exportPeriod, exportCustomDate]);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    const current = { period: exportPeriod, date: exportCustomDate };
    if (prevPeriodRef.current === null) {
      prevPeriodRef.current = current;
      return;
    }
    if (
      prevPeriodRef.current.period !== exportPeriod ||
      prevPeriodRef.current.date !== exportCustomDate
    ) {
      prevPeriodRef.current = current;
      if (firstLoadDone.current) loadDataRef.current(true);
      else loadDataRef.current(false);
    }
  }, [exportPeriod, exportCustomDate]);

  useEffect(() => {
    const api = getReportsApi();
    if (!api?.onChanged) return;

    const unsubscribe = api.onChanged(() => {
      if (isMounted.current && !fetchLock.current) {
        loadDataRef.current(true);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!firstLoadDone.current) {
      loadData(false);
    }
  }, [loadData]);

  // ⭐ Export hooks
  const {
    exportToExcel,
    exportToPDF,
    exportToCSV,
    handleExportStats,
    handleExportTopProduits,
    handleExportCommandes,
    handleExportPDF,
    handleExportCSV,
  } = useRapportsExport({
    stats,
    topProduits,
    commandesRecentes,
    exportToExcelBase: null,
    exportToPDFBase: null,
    exportToCSVBase: null,
  });

  return {
    loading,
    refreshing,
    setRefreshing,
    period,
    setPeriod,
    stats,
    topProduits,
    ventesParMois,
    categorieRepartition,
    commandesRecentes,
    summary,
    beneficeData,
    stockValue,
    stockStatus,
    entreesStock,
    sortiesStock,
    topClients,
    depensesParCategorie,
    commandesStatut,
    loadData,
    refresh: () => loadData(true),
    handleExportStats,
    handleExportTopProduits,
    handleExportCommandes,
    handleExportPDF,
    handleExportCSV,
    exportPeriod,
    setExportPeriod,
    exportCustomDate,
    setExportCustomDate,
    exportToExcel,
    exportToPDF,
    exportToCSV,
  };
};