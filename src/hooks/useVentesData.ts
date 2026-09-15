// src/hooks/useVentesData.ts
// ⭐ REFACTOR: Nizara ho modules ny useVentesData
// ⭐ FIX: enrichissement unite depuis produits
// ⭐ FIX: ventesStats avy amin'ny devis + factures (fa tsy commandes)
// ⭐ VAOVAO: payes/partiels/totalPaye isaky ny type

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Vente, ExportPeriod } from './ventes/types';
import { ITEMS_PER_PAGE } from './ventes/constants';
import { toLocalDateString, parseTvaRate } from './ventes/formatters';
import { useVentesExport } from './ventes/useVentesExport';

export type { Vente, ExportPeriod };

export const useVentesData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [devisList, setDevisList] = useState<Vente[]>([]);
  const [factures, setFactures] = useState<Vente[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalDevis, setTotalDevis] = useState(0);
  const [totalFactures, setTotalFactures] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [viewItem, setViewItem] = useState<any>(null);
  const [viewDetails, setViewDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detteStats, setDetteStats] = useState({ total_dette: 0, nb_commandes_non_payees: 0 });

  // ⭐ NOUVEAU: Stats Ventes (devis + factures)
  const [ventesStats, setVentesStats] = useState({
    totalDevis: 0,
    totalFactures: 0,
    caDevis: 0,
    caFactures: 0,
    caTotal: 0,
    payeDevis: 0,
    payeFactures: 0,
    payeTotal: 0,
    detteDevis: 0,
    detteFactures: 0,
    detteTotal: 0,
    nbPayesDevis: 0,
    nbPayesFactures: 0,
    nbPayesTotal: 0,
    nbPartielsDevis: 0,
    nbPartielsFactures: 0,
    nbPartielsTotal: 0,
    nbNonPayesDevis: 0,
    nbNonPayesFactures: 0,
    nbNonPayesTotal: 0,
    articlesVendus: 0,
    articlesDevis: 0,
    articlesFactures: 0,
  });

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(() => toLocalDateString());

  const isMounted = useRef(true);

  const { exportToExcel, exportToPDF, exportToCSV } = useVentesExport({ searchTerm });

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadReferences = useCallback(async () => {
    try {
      const [clientsResult, produitsResult] = await Promise.all([
        window.api.clients.getAll({ limit: 1000 }),
        window.api.products.getAll({ limit: 1000 }),
      ]);
      if (clientsResult?.success && isMounted.current) setClients(clientsResult.data || []);
      if (produitsResult?.success && isMounted.current) setProduits(produitsResult.data || []);
    } catch (err) {
      console.error('Erreur chargement références:', err);
    }
  }, []);

  const loadDevis = useCallback(async () => {
    try {
      const result = await window.api.ventes.getDevis({ search: searchTerm, page: currentPage, limit: ITEMS_PER_PAGE });
      if (result?.success && isMounted.current) {
        setDevisList(result.data || []);
        setTotalDevis(Number(result.pagination?.total) || result.data?.length || 0);
        const total = Number(result.pagination?.total) || result.data?.length || 0;
        const pages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
        setTotalPages(pages);
        if (currentPage > pages) setCurrentPage(1);
      }
    } catch (err) { console.error('Erreur chargement devis:', err); }
  }, [searchTerm, currentPage]);

  const loadFactures = useCallback(async () => {
    try {
      const result = await window.api.ventes.getFactures({ search: searchTerm, page: currentPage, limit: ITEMS_PER_PAGE });
      if (result?.success && isMounted.current) {
        setFactures(result.data || []);
        setTotalFactures(Number(result.pagination?.total) || result.data?.length || 0);
        const total = Number(result.pagination?.total) || result.data?.length || 0;
        const pages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
        setTotalPages(pages);
        if (currentPage > pages) setCurrentPage(1);
      }
    } catch (err) { console.error('Erreur chargement factures:', err); }
  }, [searchTerm, currentPage]);

  // ⭐ NOUVEAU: Maka stats avy amin'ny DEVIS + FACTURES
  const getVentesStats = useCallback(async (options?: { startDate?: string; endDate?: string }) => {
    try {
      const result = await (window.api as any).ventes.getStats?.(options);
      if (result?.success && isMounted.current) {
        setVentesStats({
          totalDevis: Number(result.data?.totalDevis || 0),
          totalFactures: Number(result.data?.totalFactures || 0),
          caDevis: Number(result.data?.caDevis || 0),
          caFactures: Number(result.data?.caFactures || 0),
          caTotal: Number(result.data?.caTotal || 0),
          payeDevis: Number(result.data?.payeDevis || 0),
          payeFactures: Number(result.data?.payeFactures || 0),
          payeTotal: Number(result.data?.payeTotal || 0),
          detteDevis: Number(result.data?.detteDevis || 0),
          detteFactures: Number(result.data?.detteFactures || 0),
          detteTotal: Number(result.data?.detteTotal || 0),
          nbPayesDevis: Number(result.data?.nbPayesDevis || 0),
          nbPayesFactures: Number(result.data?.nbPayesFactures || 0),
          nbPayesTotal: Number(result.data?.nbPayesTotal || 0),
          nbPartielsDevis: Number(result.data?.nbPartielsDevis || 0),
          nbPartielsFactures: Number(result.data?.nbPartielsFactures || 0),
          nbPartielsTotal: Number(result.data?.nbPartielsTotal || 0),
          nbNonPayesDevis: Number(result.data?.nbNonPayesDevis || 0),
          nbNonPayesFactures: Number(result.data?.nbNonPayesFactures || 0),
          nbNonPayesTotal: Number(result.data?.nbNonPayesTotal || 0),
          articlesVendus: Number(result.data?.articlesVendus || 0),
          articlesDevis: Number(result.data?.articlesDevis || 0),
          articlesFactures: Number(result.data?.articlesFactures || 0),
        });
      }
      return result;
    } catch (err) {
      console.error('❌ Erreur getVentesStats:', err);
      return { success: false, error: (err as any)?.message || 'Erreur ventes stats' };
    }
  }, []);

  const getDetteStats = useCallback(async () => {
    try {
      const result = await window.api.orders.getDetteStats();
      if (result?.success && isMounted.current) {
        setDetteStats({
          total_dette: Number(result.data?.total_dette || 0),
          nb_commandes_non_payees: Number(result.data?.nb_commandes_non_payees || 0),
        });
      }
      return result;
    } catch (err) {
      console.error('❌ Erreur getDetteStats:', err);
      return { success: false, error: (err as any)?.message || 'Erreur dette stats' };
    }
  }, []);

  const enrichDetails = useCallback((details: any[]) => {
    return details.map((detail: any) => {
      let rate = parseTvaRate(detail.tva_rate);
      const product = produits.find((p: any) => p.id === detail.produit_id);

      if (rate === 0 && product && product.tva_rate !== undefined && product.tva_rate !== null) {
        rate = Number(product.tva_rate);
      }

      const unite = detail.produit_unite || detail.unite || (product?.unite) || 'pièce';

      return { ...detail, tva_rate: rate, unite };
    });
  }, [produits]);

  const getDevisDetails = useCallback(async (item: any) => {
    setLoadingDetails(true);
    try {
      const result = await window.api.ventes.getDevisDetails(item.id);
      if (result?.success) {
        setViewItem(result.data.devis || item);
        const details = Array.isArray(result.data?.details) ? result.data.details : [];
        setViewDetails(enrichDetails(details));
      } else {
        setViewItem(item);
        setViewDetails([]);
      }
    } catch (err) {
      setViewItem(item);
      setViewDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  }, [enrichDetails]);

  const getFactureDetails = useCallback(async (item: any) => {
    setLoadingDetails(true);
    try {
      const result = await window.api.ventes.getFactureDetails(item.id);
      if (result?.success) {
        setViewItem(result.data.facture || item);
        const details = Array.isArray(result.data?.details) ? result.data.details : [];
        setViewDetails(enrichDetails(details));
      } else {
        setViewItem(item);
        setViewDetails([]);
      }
    } catch (err) {
      setViewItem(item);
      setViewDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  }, [enrichDetails]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        loadReferences(),
        loadDevis(),
        loadFactures(),
        getVentesStats(),
      ]);
      if (isMounted.current) setLoading(false);
    };
    loadAll();
  }, [loadReferences, loadDevis, loadFactures, getVentesStats]);

  useEffect(() => {
    if (!searchTerm) return;
    const timer = setTimeout(() => { setCurrentPage(1); loadDevis(); loadFactures(); }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, loadDevis, loadFactures]);

  useEffect(() => {
    if (!window.api?.ventes?.onChanged) return;
    const unsubscribe = window.api.ventes.onChanged(() => {
      if (isMounted.current) {
        loadDevis();
        loadFactures();
        getVentesStats();
      }
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [loadDevis, loadFactures, getVentesStats]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadReferences(),
      loadDevis(),
      loadFactures(),
      getVentesStats(),
    ]);
    if (isMounted.current) setRefreshing(false);
  }, [loadReferences, loadDevis, loadFactures, getVentesStats]);

  const createDevis = useCallback(async (data: any) => {
    const result = await window.api.ventes.createDevis(data);
    if (result?.success) { await loadDevis(); await getVentesStats(); return result; }
    return result;
  }, [loadDevis, getVentesStats]);

  const createFacture = useCallback(async (data: any) => {
    const result = await window.api.ventes.createFacture(data);
    if (result?.success) { await loadFactures(); await getVentesStats(); return result; }
    return result;
  }, [loadFactures, getVentesStats]);

  const convertDevisToFacture = useCallback(async (devisId: number) => {
    const result = await window.api.ventes.convertDevisToFacture(devisId);
    if (result?.success) { await Promise.all([loadDevis(), loadFactures(), getVentesStats()]); return result; }
    return result;
  }, [loadDevis, loadFactures, getVentesStats]);

  const deleteDevis = useCallback(async (id: number) => {
    const result = await window.api.ventes.deleteDevis(id);
    if (result?.success) { await loadDevis(); await getVentesStats(); return result; }
    return result;
  }, [loadDevis, getVentesStats]);

  const deleteFacture = useCallback(async (id: number) => {
    try {
      const details = await window.api.ventes.getFactureDetails(id);
      if (details?.success && Array.isArray(details.data?.details)) {
        for (const detail of details.data.details) {
          await window.api.products.updateStock(detail.produit_id, detail.quantite);
        }
      }
    } catch (err) {
      console.error('Erreur restauration stock:', err);
    }
    const result = await window.api.ventes.deleteFacture(id);
    if (result?.success) { await loadFactures(); await getVentesStats(); return result; }
    return result;
  }, [loadFactures, getVentesStats]);

  return {
    devisList, factures, clients, produits, loading, refreshing,
    searchTerm, setSearchTerm, totalDevis, totalFactures, ITEMS_PER_PAGE,
    currentPage, setCurrentPage, totalPages,
    loadReferences, loadDevis, loadFactures, refresh,
    createDevis, createFacture, convertDevisToFacture, deleteDevis, deleteFacture,
    getDetteStats, detteStats,
    getVentesStats, ventesStats,
    viewItem, setViewItem, viewDetails, setViewDetails, loadingDetails, setLoadingDetails,
    getDevisDetails, getFactureDetails,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  };
};

export default useVentesData;