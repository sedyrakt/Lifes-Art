// src/hooks/useAchatsData.ts
// ⭐ REFACTOR: Nizara ho modules ny useAchatsData
// ⭐ NOUVEAU: stats globales avy amin'ny backend
// ⭐ FIX: Nampiana `totalPaye`, `totalReste`, `totalProduits` mba hifanaraka amin'ny AchatsTable

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type Achat,
  type AchatDetail,
  type AchatFilters,
  type ExportPeriod,
  toLocalDateString,
  useAchatsReferences,
  useAchatsExport,
} from './achats';

export type { Achat, AchatDetail, AchatFilters, ExportPeriod };

const ITEMS_PER_PAGE = 8;

// ⭐⭐⭐ Type ho an'ny stats — MISY CHAMPS REHETRA ⭐⭐⭐
export interface AchatsStats {
  total: number;
  totalMontant: number;
  totalPaye: number;         // ⭐ VAOVAO
  totalReste: number;        // ⭐ VAOVAO
  totalProduits: number;     // ⭐ VAOVAO
  totalFournisseurs: number;
  payes: number;
  partiels: number;
  nonPayes: number;
}

const INITIAL_STATS: AchatsStats = {
  total: 0,
  totalMontant: 0,
  totalPaye: 0,
  totalReste: 0,
  totalProduits: 0,
  totalFournisseurs: 0,
  payes: 0,
  partiels: 0,
  nonPayes: 0,
};

export const useAchatsData = () => {
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<(isRefresh?: boolean) => Promise<void>>(async () => {});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achats, setAchats] = useState<Achat[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<AchatFilters>({
    searchTerm: '',
    filterFournisseur: '',
    sortOption: 'Date (Récent)',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [stats, setStats] = useState<AchatsStats>(INITIAL_STATS);

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(() => toLocalDateString());

  const { fournisseurs, produits, loadReferences, fournisseursLoaded, produitsLoaded } = useAchatsReferences();
  const { exportToExcel, exportToPDF, exportToCSV } = useAchatsExport({
    debouncedSearch,
    filterFournisseur: filters.filterFournisseur,
  });

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; fetchLock.current = false; };
  }, []);

  useEffect(() => {
    loadReferences(false);
  }, [loadReferences]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.searchTerm.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [filters.searchTerm]);

  // ⭐⭐⭐ loadStats — misy champs rehetra + fallback ⭐⭐⭐
  const loadStats = useCallback(async () => {
    try {
      if (!window.api?.achats?.getStats) {
        console.warn('⚠️ API achats.getStats non disponible');
        return;
      }
      const options = {
        search: debouncedSearch || undefined,
        fournisseur: filters.filterFournisseur || undefined,
      };
      const result = await window.api.achats.getStats(options);
      if (result?.success && isMounted.current) {
        const data = result.data || {};

        // ⭐ Alaina avy amin'ny backend raha misy, raha tsy misy dia calcul fallback
        const total = Number(data.total) || 0;
        const totalMontant = Number(data.totalMontant ?? data.total_montant) || 0;
        const totalPaye = Number(data.totalPaye ?? data.total_paye) || 0;
        const totalReste = Number(data.totalReste ?? data.total_reste) || 0;
        const totalProduits = Number(data.totalProduits ?? data.total_produits) || 0;
        const totalFournisseurs = Number(data.totalFournisseurs ?? data.total_fournisseurs) || 0;
        const payes = Number(data.payes ?? data.nbPayes ?? data.nb_payes) || 0;
        const partiels = Number(data.partiels ?? data.nbPartiels ?? data.nb_partiels) || 0;
        const nonPayes = Number(data.nonPayes ?? data.nbNonPayes ?? data.nb_non_payes) || 0;

        setStats({
          total,
          totalMontant,
          totalPaye,
          totalReste: totalReste || Math.max(0, totalMontant - totalPaye),
          totalProduits,
          totalFournisseurs,
          payes,
          partiels,
          nonPayes,
        });
      }
    } catch (err) {
      console.error('❌ loadStats:', err);
    }
  }, [debouncedSearch, filters.filterFournisseur]);

  const loadAchats = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      if (isRefresh) setRefreshing(true);
      else if (!firstLoadDone.current) setLoading(true);

      if (!fournisseursLoaded.current || !produitsLoaded.current) await loadReferences(false);

      if (!window.api?.achats?.getAll) {
        console.warn('⚠️ API achats.getAll non disponible');
        if (isMounted.current) { setAchats([]); setTotalItems(0); setTotalPages(1); }
        return;
      }

      let sortField = 'date_achat';
      let sortDirection: 'ASC' | 'DESC' = 'DESC';
      if (filters.sortOption === 'Date (Ancien)') { sortField = 'date_achat'; sortDirection = 'ASC'; }
      else if (filters.sortOption === 'Total (Croissant)') { sortField = 'total_ttc'; sortDirection = 'ASC'; }
      else if (filters.sortOption === 'Total (Décroissant)') { sortField = 'total_ttc'; sortDirection = 'DESC'; }

      const options = {
        page: isRefresh ? 1 : currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        fournisseur: filters.filterFournisseur || undefined,
        sort: { field: sortField, direction: sortDirection },
      };

      const result = await window.api.achats.getAll(options);
      if (!result?.success) throw new Error(result?.error || 'Erreur chargement achats');

      if (isMounted.current) {
        const data = result.data || [];
        const pagination = result.pagination || {};
        setAchats(data);
        setTotalItems(pagination.total || 0);
        setTotalPages(pagination.totalPages || Math.ceil((pagination.total || 0) / ITEMS_PER_PAGE) || 1);
      }

      await loadStats();

      firstLoadDone.current = true;
    } catch (err: any) {
      console.error('❌ loadAchats:', err?.message);
      if (isMounted.current) { setAchats([]); setTotalItems(0); setTotalPages(1); }
    } finally {
      if (isMounted.current) { setLoading(false); setRefreshing(false); }
      fetchLock.current = false;
    }
  }, [currentPage, debouncedSearch, filters.filterFournisseur, filters.sortOption, loadReferences, fournisseursLoaded, produitsLoaded, loadStats]);

  loadDataRef.current = loadAchats;

  useEffect(() => {
    if (isMounted.current) {
      setCurrentPage(1);
      loadDataRef.current(true);
    }
  }, [debouncedSearch, filters.filterFournisseur, filters.sortOption]);

  useEffect(() => {
    if (isMounted.current && firstLoadDone.current) loadDataRef.current(false);
  }, [currentPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadReferences(true);
    await loadDataRef.current(true);
    if (isMounted.current) setRefreshing(false);
  }, [loadReferences]);

  const createAchat = useCallback(async (data: any): Promise<any> => {
    if (!window.api?.achats?.create) throw new Error('API achats.create non disponible');
    const result = await window.api.achats.create(data);
    if (!result?.success) throw new Error(result?.error || 'Erreur création achat');
    await loadDataRef.current(true);
    return result;
  }, []);

  const updateAchat = useCallback(async (id: number, data: any): Promise<any> => {
    if (!window.api?.achats?.update) throw new Error('API achats.update non disponible');
    const result = await window.api.achats.update(id, data);
    if (!result?.success) throw new Error(result?.error || 'Erreur mise à jour achat');
    await loadDataRef.current(true);
    return result;
  }, []);

  const deleteAchat = useCallback(async (id: number): Promise<any> => {
    if (!window.api?.achats?.delete) throw new Error('API achats.delete non disponible');
    const result = await window.api.achats.delete(id);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression achat');
    await loadDataRef.current(true);
    return result;
  }, []);

  const bulkDelete = useCallback(async (ids: number[]): Promise<any> => {
    if (!window.api?.achats?.bulkDelete) throw new Error('API achats.bulkDelete non disponible');
    const result = await window.api.achats.bulkDelete(ids);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression en lot');
    await loadDataRef.current(true);
    return result;
  }, []);

  const getDetails = useCallback(async (achatId: number): Promise<{ achat: Achat; details: AchatDetail[] }> => {
    if (!window.api?.achats?.getDetails) throw new Error('API achats.getDetails non disponible');
    const result = await window.api.achats.getDetails(achatId);
    if (!result?.success) throw new Error(result?.error || 'Erreur chargement détails');
    return { achat: result.data?.achat, details: result.data?.details || [] };
  }, []);

  const setFiltersState = useCallback((newFilters: Partial<AchatFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const setSearchTerm = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  }, []);

  return {
    achats, fournisseurs, produits, loading, refreshing, setRefreshing,
    totalItems, totalPages, currentPage, setCurrentPage, ITEMS_PER_PAGE,
    filters, setFilters: setFiltersState, searchTerm: filters.searchTerm, setSearchTerm,
    loadAchats, getDetails, createAchat, updateAchat, deleteAchat, bulkDelete, refresh,
    stats,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  };
};

export default useAchatsData;