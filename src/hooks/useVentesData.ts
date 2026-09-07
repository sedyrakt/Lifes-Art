// src/hooks/useVentesData.ts
import { useState, useEffect, useCallback, useRef } from 'react';

export interface Vente {
  id: number;
  reference: string | null;
  client_id: number | null;
  client_nom: string;
  date_devis?: string;
  date_facture?: string;
  total_ht: number;
  total_ttc: number;
  statut: string;
  statut_paiement?: string;
  montant_paye?: number;
  montant_restant?: number;
  observation?: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

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

  const [detteStats, setDetteStats] = useState({
    total_dette: 0,
    nb_commandes_non_payees: 0,
  });

  const isMounted = useRef(true);

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

  const getDetteStats = useCallback(async () => {
    try {
      const result = await window.api.orders.getDetteStats();
      if (result?.success && isMounted.current) {
        setDetteStats({ total_dette: Number(result.data?.total_dette || 0), nb_commandes_non_payees: Number(result.data?.nb_commandes_non_payees || 0) });
      }
      return result;
    } catch (err) { console.error('❌ Erreur getDetteStats:', err); return { success: false, error: err?.message || 'Erreur dette stats' }; }
  }, []);

  const getDevisDetails = useCallback(async (item: any) => {
    setLoadingDetails(true);
    try {
      const result = await window.api.ventes.getDevisDetails(item.id);
      if (result?.success) {
        setViewItem(result.data.devis || item);
        setViewDetails(Array.isArray(result.data?.details) ? result.data.details : []);
      } else { setViewItem(item); setViewDetails([]); }
    } catch (err) { setViewItem(item); setViewDetails([]); }
    finally { setLoadingDetails(false); }
  }, []);

  const getFactureDetails = useCallback(async (item: any) => {
    setLoadingDetails(true);
    try {
      const result = await window.api.ventes.getFactureDetails(item.id);
      if (result?.success) {
        setViewItem(result.data.facture || item);
        setViewDetails(Array.isArray(result.data?.details) ? result.data.details : []);
      } else { setViewItem(item); setViewDetails([]); }
    } catch (err) { setViewItem(item); setViewDetails([]); }
    finally { setLoadingDetails(false); }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadReferences(), loadDevis(), loadFactures(), getDetteStats()]);
      if (isMounted.current) setLoading(false);
    };
    loadAll();
  }, [loadReferences, loadDevis, loadFactures, getDetteStats]);

  useEffect(() => {
    if (!searchTerm) return;
    const timer = setTimeout(() => { setCurrentPage(1); loadDevis(); loadFactures(); }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, loadDevis, loadFactures]);

  useEffect(() => {
    if (!window.api?.ventes?.onChanged) return;
    const unsubscribe = window.api.ventes.onChanged(() => {
      if (isMounted.current) { loadDevis(); loadFactures(); getDetteStats(); }
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [loadDevis, loadFactures, getDetteStats]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadReferences(), loadDevis(), loadFactures(), getDetteStats()]);
    if (isMounted.current) setRefreshing(false);
  }, [loadReferences, loadDevis, loadFactures, getDetteStats]);

  // ⭐ FIX: Tena mampiasa ny tva_rate amin'ny create
  const createDevis = useCallback(async (data: any) => {
    const result = await window.api.ventes.createDevis(data);
    if (result?.success) { await loadDevis(); await getDetteStats(); return result; }
    return result;
  }, [loadDevis, getDetteStats]);

  const createFacture = useCallback(async (data: any) => {
    const result = await window.api.ventes.createFacture(data);
    if (result?.success) { await loadFactures(); await getDetteStats(); return result; }
    return result;
  }, [loadFactures, getDetteStats]);

  const convertDevisToFacture = useCallback(async (devisId: number) => {
    const result = await window.api.ventes.convertDevisToFacture(devisId);
    if (result?.success) { await Promise.all([loadDevis(), loadFactures(), getDetteStats()]); return result; }
    return result;
  }, [loadDevis, loadFactures, getDetteStats]);

  const deleteDevis = useCallback(async (id: number) => {
    const result = await window.api.ventes.deleteDevis(id);
    if (result?.success) { await loadDevis(); await getDetteStats(); return result; }
    return result;
  }, [loadDevis, getDetteStats]);

  const deleteFacture = useCallback(async (id: number) => {
    try {
      const details = await window.api.ventes.getFactureDetails(id);
      if (details?.success && Array.isArray(details.data?.details)) {
        for (const detail of details.data.details) await window.api.products.updateStock(detail.produit_id, detail.quantite);
      }
    } catch (err) { console.error('Erreur restauration stock:', err); }
    const result = await window.api.ventes.deleteFacture(id);
    if (result?.success) { await loadFactures(); await getDetteStats(); return result; }
    return result;
  }, [loadFactures, getDetteStats]);

  return {
    devisList, factures, clients, produits, loading, refreshing,
    searchTerm, setSearchTerm, totalDevis, totalFactures, ITEMS_PER_PAGE,
    currentPage, setCurrentPage, totalPages,
    loadReferences, loadDevis, loadFactures, refresh,
    createDevis, createFacture, convertDevisToFacture, deleteDevis, deleteFacture,
    getDetteStats, detteStats,
    viewItem, setViewItem, viewDetails, setViewDetails, loadingDetails, setLoadingDetails,
    getDevisDetails, getFactureDetails
  };
};

export default useVentesData;