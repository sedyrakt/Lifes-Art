// src/hooks/useFournisseursData.ts
// ⭐ REFACTOR: Nizara ho modules ny useFournisseursData
// ⭐ FIX: `getStats()` → mamerina `avec_telephone` sy `avec_adresse` koa

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FournisseurFilters, FournisseurStats, ExportPeriod } from './fournisseurs/types';
import { ITEMS_PER_PAGE, SORT_MAP } from './fournisseurs/constants';
import { toLocalDateString } from './fournisseurs/formatters';
import { useFournisseursExport } from './fournisseurs/useFournisseursExport';

export type { FournisseurFilters, FournisseurStats, ExportPeriod };

export const useFournisseursData = () => {
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [sortOption, setSortOption] = useState<keyof typeof SORT_MAP>('Nom (A-Z)');

  const [filters, setFilters] = useState<FournisseurFilters>({
    searchTerm: '', email: '', telephone: '', dateFrom: '', dateTo: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(() => toLocalDateString());

  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<() => Promise<void>>(async () => {});

  // ⭐ Custom hook export
  const { exportToExcel, exportToPDF, exportToCSV } = useFournisseursExport({
    debouncedSearch,
    sortOption,
    filters,
  });

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; fetchLock.current = false; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch((filters.searchTerm || '').trim()), 300);
    return () => clearTimeout(t);
  }, [filters.searchTerm]);

  const loadFournisseurs = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      if (isRefresh) setRefreshing(true);
      else if (!firstLoadDone.current) setLoading(true);

      if (!window.api?.fournisseurs?.getAll) throw new Error('API fournisseurs.getAll tsy hita');

      const sort = SORT_MAP[sortOption] || SORT_MAP['Nom (A-Z)'];
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        sortBy: sort.field,
        sortOrder: sort.direction,
        email: filters.email || undefined,
        telephone: filters.telephone || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      };
      const result = await window.api.fournisseurs.getAll(params);

      if (!isMounted.current) return;
      if (!result?.success) throw new Error(result?.error || 'Erreur chargement');

      const data = (result.data || []).filter((item, idx, self) => self.findIndex(t => t.id === item.id) === idx);
      setFournisseurs(data);
      const total = Number(result.pagination?.total || 0);
      setTotalItems(total);
      setTotalPages(Number(result.pagination?.totalPages) > 0
        ? Number(result.pagination?.totalPages)
        : Math.ceil(total / ITEMS_PER_PAGE));
      firstLoadDone.current = true;
    } catch (err) {
      console.error('❌ loadFournisseurs:', err);
      if (isMounted.current) setFournisseurs([]);
    } finally {
      if (isMounted.current) { setLoading(false); setRefreshing(false); }
      fetchLock.current = false;
    }
  }, [currentPage, debouncedSearch, sortOption, filters]);

  useEffect(() => { loadDataRef.current = loadFournisseurs; }, [loadFournisseurs]);

  useEffect(() => {
    if (isMounted.current) {
      setCurrentPage(1);
      loadDataRef.current(true);
    }
  }, [debouncedSearch, sortOption, filters.email, filters.telephone, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    if (isMounted.current && firstLoadDone.current) loadDataRef.current(false);
  }, [currentPage]);

  const loadData = useCallback(async () => { setCurrentPage(1); }, []);
  const refresh = useCallback(async () => { await loadDataRef.current(true); }, []);

  const createFournisseur = useCallback(async (data: any) => {
    if (!window.api?.fournisseurs?.create) throw new Error('API fournisseurs.create indisponible');
    const r = await window.api.fournisseurs.create(data);
    if (!r?.success) throw new Error(r?.error || 'Erreur création');
    await loadDataRef.current(true);
    return r.data;
  }, []);

  const updateFournisseur = useCallback(async (id: number, data: any) => {
    if (!window.api?.fournisseurs?.update) throw new Error('API fournisseurs.update indisponible');
    const r = await window.api.fournisseurs.update(id, data);
    if (!r?.success) throw new Error(r?.error || 'Erreur mise à jour');
    await loadDataRef.current(true);
    return r.data;
  }, []);

  const deleteFournisseur = useCallback(async (id: number) => {
    if (!window.api?.fournisseurs?.delete) throw new Error('API fournisseurs.delete indisponible');
    const r = await window.api.fournisseurs.delete(id);
    if (!r?.success) throw new Error(r?.error || 'Erreur suppression');
    await loadDataRef.current(true);
    return r;
  }, []);

  const bulkDelete = useCallback(async (ids: number[]) => {
    if (!window.api?.fournisseurs?.bulkDelete) throw new Error('API fournisseurs.bulkDelete indisponible');
    const v = ids.filter(id => Number.isInteger(id) && id > 0);
    if (!v.length) throw new Error('Aucun ID valide');
    const r = await window.api.fournisseurs.bulkDelete(v);
    if (!r?.success) throw new Error(r?.error || 'Erreur suppression lot');
    await loadDataRef.current(true);
    return r;
  }, []);

  // ⭐⭐⭐ FIX: getStats mamerina `avec_telephone` sy `avec_adresse` ⭐⭐⭐
  const getStats = useCallback(async (): Promise<FournisseurStats> => {
    if (!window.api?.fournisseurs?.getStats) throw new Error('API fournisseurs.getStats indisponible');
    try {
      const r = await window.api.fournisseurs.getStats();
      if (!r?.success) throw new Error(r?.error || 'Erreur stats');
      const data = r.data || {};
      return {
        total: Number(data.total) || 0,
        avec_contact: Number(data.avec_contact ?? data.avecContact) || 0,
        avec_telephone: Number(data.avec_telephone ?? data.avecTelephone) || 0,
        avec_email: Number(data.avec_email ?? data.avecEmail) || 0,
        avec_adresse: Number(data.avec_adresse ?? data.avecAdresse) || 0,
      };
    } catch (err) {
      console.error('❌ getStats:', err);
      throw err;
    }
  }, []);

  return {
    fournisseurs, loading, refreshing, setRefreshing,
    currentPage, setCurrentPage, totalItems, totalPages, ITEMS_PER_PAGE,
    filters, setFilters, sortOption, setSortOption,
    refresh, loadData,
    createFournisseur, updateFournisseur, deleteFournisseur, bulkDelete, getStats,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  };
};