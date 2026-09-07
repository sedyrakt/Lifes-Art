// src/hooks/useCategoriesData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Categorie } from '../types/categories';

const ITEMS_PER_PAGE = 8;

const SORT_MAP = {
  'Nom (A-Z)': { field: 'nom', direction: 'ASC' },
  'Nom (Z-A)': { field: 'nom', direction: 'DESC' },
  'Plus récent': { field: 'created_at', direction: 'DESC' },
  'Plus ancien': { field: 'created_at', direction: 'ASC' },
} as const;

export const useCategoriesData = () => {
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<() => Promise<void>>(async () => {});

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<keyof typeof SORT_MAP>('Nom (A-Z)');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      fetchLock.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadCategories = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;

    try {
      if (isRefresh) setRefreshing(true);
      else if (!firstLoadDone.current) setLoading(true);

      if (!window.api?.categories?.getAll) {
        throw new Error('API categories.getAll non disponible');
      }

      const sort = SORT_MAP[sortOption] || SORT_MAP['Nom (A-Z)'];

      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        sortBy: sort.field,
        sortOrder: sort.direction,
      };

      const result = await window.api.categories.getAll(params);

      if (!isMounted.current) return;
      if (!result?.success) throw new Error(result?.error || 'Erreur de chargement');

      const data = result.data || [];
      const uniqueData = data.filter((item, index, self) => self.findIndex(t => t.id === item.id) === index);

      setCategories(uniqueData);

      const totalItemsCount = Number(result.pagination?.total || 0);
      setTotalItems(totalItemsCount);
      const totalPagesFromBackend = Number(result.pagination?.totalPages);
      setTotalPages(totalPagesFromBackend > 0 ? totalPagesFromBackend : Math.ceil(totalItemsCount / ITEMS_PER_PAGE));

      firstLoadDone.current = true;
    } catch (err) {
      console.error('❌ loadCategories:', err);
      if (isMounted.current) setCategories([]);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
      fetchLock.current = false;
    }
  }, [currentPage, debouncedSearch, sortOption]);

  useEffect(() => {
    loadDataRef.current = loadCategories;
  }, [loadCategories]);

  useEffect(() => {
    if (isMounted.current) {
      setCurrentPage(1);
      loadDataRef.current(true);
    }
  }, [debouncedSearch, sortOption]);

  useEffect(() => {
    if (isMounted.current && firstLoadDone.current) {
      loadDataRef.current(false);
    }
  }, [currentPage]);

  // CRUD operations ... (tsy niova)
  const createCategorie = useCallback(async (data: Omit<Categorie, 'id' | 'created_at'>) => {
    if (!window.api?.categories?.create) throw new Error('API categories.create indisponible');
    const result = await window.api.categories.create(data);
    if (!result?.success) throw new Error(result?.error || 'Erreur création');
    await loadDataRef.current(true);
    return result.data;
  }, []);

  const updateCategorie = useCallback(async (id: number, data: Partial<Categorie>) => {
    if (!window.api?.categories?.update) throw new Error('API categories.update indisponible');
    const result = await window.api.categories.update(id, data);
    if (!result?.success) throw new Error(result?.error || 'Erreur mise à jour');
    await loadDataRef.current(true);
    return result.data;
  }, []);

  const deleteCategorie = useCallback(async (id: number) => {
    if (!window.api?.categories?.delete) throw new Error('API categories.delete indisponible');
    const result = await window.api.categories.delete(id);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression');
    await loadDataRef.current(true);
    return result;
  }, []);

  const bulkDelete = useCallback(async (ids: number[]) => {
    if (!window.api?.categories?.bulkDelete) throw new Error('API categories.bulkDelete indisponible');
    const result = await window.api.categories.bulkDelete(ids);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression en lot');
    await loadDataRef.current(true);
    return result;
  }, []);

  const getCategoryColor = useCallback((id: number) => {
    const colors = [
      'from-[#6366F1] to-[#818CF8]',
      'from-[#10B981] to-[#34D399]',
      'from-[#7C3AED] to-[#A78BFA]',
      'from-[#D4A84F] to-[#F5D78C]',
      'from-[#EF4444] to-[#F87171]',
      'from-[#EC4899] to-[#F472B6]',
      'from-[#06B6D4] to-[#67E8F9]',
      'from-[#F59E0B] to-[#FBBF24]',
    ];
    return colors[Math.abs(Number(id) || 0) % colors.length];
  }, []);

  const getCategoryBg = useCallback((id: number) => {
    const bgs = [
      'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
      'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
      'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
      'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
      'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800',
      'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800',
      'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    ];
    return bgs[Math.abs(Number(id) || 0) % bgs.length];
  }, []);

  return {
    categories,
    loading,
    refreshing,
    setRefreshing,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    sortOption,
    setSortOption,
    loadData: () => loadDataRef.current(false),
    createCategorie,
    updateCategorie,
    deleteCategorie,
    bulkDelete,
    getCategoryColor,
    getCategoryBg,
    ITEMS_PER_PAGE,
  };
};