
import { useState, useEffect, useCallback, useRef } from 'react';
import { Depense, DepensesStats, DepensesFilters } from '../types/depenses';

const ITEMS_PER_PAGE = 8; 
export const useDepensesData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<DepensesFilters>({
    searchTerm: '',
    filterCategorie: '',
    filterDate: '',
    filterMode: '',
    sortOption: 'Date (Récent)',
  });
  const [stats, setStats] = useState<DepensesStats>({
    total: 0,
    nb: 0,
    moyenne: 0,
    parCategorie: {},
    parMois: {},
    parMode: {},
    plusGrande: 0,
    plusPetite: 0,
    nbFournisseurs: 0,
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<(isRefresh?: boolean) => Promise<void>>(async () => {});

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; fetchLock.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadFournisseurs = async () => {
      try {
        if (window.api?.fournisseurs?.search) {
          const result = await window.api.fournisseurs.search('');
          if (!cancelled && result?.success) setFournisseurs((result.data || []).slice(0, 50));
        } else if (window.api?.fournisseurs?.getAll) {
          const result = await window.api.fournisseurs.getAll({ limit: 50 });
          if (!cancelled && result?.success) setFournisseurs(result.data || []);
        }
      } catch (_) {}
    };
    loadFournisseurs();
    return () => { cancelled = true; };
  }, []);

  const loadDepenses = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      if (isRefresh) setRefreshing(true);
      else if (!firstLoadDone.current) setLoading(true);
      if (!window.api?.expenses?.getAll) throw new Error('API expenses.getAll non disponible');

      let sortField = 'date_depense';
      let sortDirection: 'ASC' | 'DESC' = 'DESC';
      if (filters.sortOption === 'Date (Ancien)') { sortField = 'date_depense'; sortDirection = 'ASC'; }
      else if (filters.sortOption === 'Montant (Croissant)') { sortField = 'montant'; sortDirection = 'ASC'; }
      else if (filters.sortOption === 'Montant (Décroissant)') { sortField = 'montant'; sortDirection = 'DESC'; }

      const result = await window.api.expenses.getAll({
        page: isRefresh ? 1 : currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch,
        categorie: filters.filterCategorie || undefined,
        mode: filters.filterMode || undefined,
        startDate: filters.filterDate || undefined,
        endDate: filters.filterDate || undefined,
        sort: { field: sortField, direction: sortDirection },
      });

      if (result?.success && isMounted.current) {
        setDepenses(result.data || []);
        setTotalItems(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || Math.ceil((result.pagination?.total || 0) / ITEMS_PER_PAGE) || 1);
      } else if (isMounted.current) {
        setDepenses([]);
        setTotalItems(0);
        setTotalPages(1);
      }

      try {
        const statsResult = await window.api.expenses.getStats();
        if (statsResult?.success && isMounted.current) {
          setStats({
            total: Number(statsResult.data?.total || 0),
            nb: Number(statsResult.data?.nb || 0),
            moyenne: Number(statsResult.data?.moyenne || 0),
            parCategorie: statsResult.data?.parCategorie || {},
            parMois: statsResult.data?.parMois || {},
            parMode: statsResult.data?.parMode || {},
            plusGrande: Number(statsResult.data?.plusGrande || 0),
            plusPetite: Number(statsResult.data?.plusPetite || 0),
            nbFournisseurs: Number(statsResult.data?.nbFournisseurs || 0),
          });
        }
      } catch (err) {
        console.error('❌ Erreur chargement stats:', err);
      }

      firstLoadDone.current = true;
    } catch (err: any) {
      if (isMounted.current) {
        setDepenses([]);
        setTotalItems(0);
        setTotalPages(1);
      }
      console.error('❌ loadDepenses error:', err);
    } finally {
      if (isMounted.current) { setLoading(false); setRefreshing(false); }
      fetchLock.current = false;
    }
  }, [currentPage, debouncedSearch, filters.filterCategorie, filters.filterDate, filters.filterMode, filters.sortOption]);

  useEffect(() => { loadDataRef.current = loadDepenses; }, [loadDepenses]);

  useEffect(() => {
    if (isMounted.current) {
      setCurrentPage(1);
      loadDataRef.current(true);
    }
  }, [debouncedSearch, filters.filterCategorie, filters.filterDate, filters.filterMode, filters.sortOption]);

  useEffect(() => {
    if (isMounted.current && firstLoadDone.current) loadDataRef.current(false);
  }, [currentPage]);

  useEffect(() => {
    if (!window.api?.financial?.onChanged) return;
    const unsubscribe = window.api.financial.onChanged(() => {
      if (isMounted.current && !fetchLock.current) loadDataRef.current(true);
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  const setFiltersState = useCallback((newFilters: Partial<DepensesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const createDepense = useCallback(async (data: any) => {
    const result = await window.api.expenses.create(data);
    if (!result?.success) throw new Error(result?.error || 'Erreur création');
    await loadDataRef.current(true);
    return result;
  }, []);

  const updateDepense = useCallback(async (id: number, data: any) => {
    const result = await window.api.expenses.update(id, data);
    if (!result?.success) throw new Error(result?.error || 'Erreur mise à jour');
    await loadDataRef.current(true);
    return result;
  }, []);

  const deleteDepense = useCallback(async (id: number) => {
    const result = await window.api.expenses.delete(id);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression');
    await loadDataRef.current(true);
    return result;
  }, []);

  const bulkDelete = useCallback(async (ids: number[]) => {
    const result = await window.api.expenses.bulkDelete(ids);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression en lot');
    await loadDataRef.current(true);
    return result;
  }, []);

  return {
    depenses,
    fournisseurs,
    loading,
    refreshing,
    setRefreshing,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    filters,
    setFilters: setFiltersState,
    stats,
    loadDepenses,        
    createDepense,
    updateDepense,
    deleteDepense,
    bulkDelete,
    ITEMS_PER_PAGE,
  };
};

