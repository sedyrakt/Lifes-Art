// src/hooks/useMouvementsData.ts
// ⭐ REFACTOR: Nizara ho modules ny useMouvementsData
// ⭐ TSY MISY niova ny logique — fizarana fotsiny

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Mouvement, MouvementsStats } from '../types/mouvements';
import {
  ITEMS_PER_PAGE,
  EMPTY_STATS,
  VALID_TYPES,
  getExportPeriodRange,
  useMouvementsHelpers,
  useMouvementsExport,
  type ExportPeriod,
} from './mouvements';

export type { ExportPeriod };

export default function useMouvementsData() {
  // ===== useState =====
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [period, setPeriod] = useState<'jour' | 'semaine' | 'mois' | 'annee'>('mois');
  const [sortOption, setSortOption] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastId, setLastId] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [statsData, setStatsData] = useState<MouvementsStats>(EMPTY_STATS);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // ===== useRef =====
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const cursorHistory = useRef<(number | null)[]>([null]);

  // ===== Custom hooks =====
  const { getTypeColor, getTypeLabel, getTypeIcon, getPrixUnitaire, getTotal } = useMouvementsHelpers();
  const { exportToExcel, exportToPDF, exportToCSV } = useMouvementsExport({
    debouncedSearch,
    filterType,
  });

  // ===== useEffect =====
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      fetchLock.current = false;
    };
  }, []);

  // ===== loadPage =====
  const loadPage = useCallback(async (direction: 'next' | 'prev' | 'refresh') => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      if (direction === 'refresh') {
        setCurrentPage(1);
        setLastId(null);
        setMouvements([]);
        setHasMore(true);
        cursorHistory.current = [null];
      }
      let targetLastId: number | null = null;
      if (direction === 'next') targetLastId = lastId;
      if (direction === 'prev') targetLastId = cursorHistory.current[currentPage - 2] ?? null;

      if (!window.api) throw new Error('window.api tsy disponible');
      if (!window.api.stock) throw new Error('window.api.stock tsy disponible');
      if (typeof window.api.stock.getMouvements !== 'function') throw new Error('window.api.stock.getMouvements tsy disponible');

      let sortBy: 'date_mouvement' | 'quantite' | 'id' = 'date_mouvement';
      let sortOrder: 'ASC' | 'DESC' = 'DESC';
      switch (sortOption) {
        case 'date-asc': sortBy = 'date_mouvement'; sortOrder = 'ASC'; break;
        case 'quantite-desc': sortBy = 'quantite'; sortOrder = 'DESC'; break;
        case 'quantite-asc': sortBy = 'quantite'; sortOrder = 'ASC'; break;
        default: sortBy = 'date_mouvement'; sortOrder = 'DESC'; break;
      }

      let startDate: string | undefined, endDate: string | undefined;
      if (filterDate) {
        startDate = `${filterDate} 00:00:00`;
        const d = new Date(`${filterDate}T00:00:00`);
        d.setDate(d.getDate() + 1);
        endDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 00:00:00`;
      } else {
        const range = getExportPeriodRange(
          period === 'jour' ? 'aujourdhui' : period === 'semaine' ? 'semaine' : period === 'annee' ? 'annee' : 'mois',
          exportCustomDate
        );
        startDate = range.startDate;
        endDate = range.endDate;
      }

      const safeType = VALID_TYPES.includes(filterType) ? filterType : null;

      const request = {
        lastId: targetLastId,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch,
        type: safeType,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      };

      const result = await window.api.stock.getMouvements(request);

      if (!result) throw new Error('getMouvements() n\'a retourné aucun résultat.');
      if (!result.success) throw new Error(result.error || 'Erreur inconnue du backend');

      const data: Mouvement[] = Array.isArray(result.data) ? result.data : [];
      const newLastId = data.length > 0 ? Number(data[data.length - 1].id) : null;

      setMouvements(data);

      if (direction === 'next') {
        if (lastId !== null && currentPage >= 1) cursorHistory.current[currentPage] = lastId;
        setCurrentPage(prev => prev + 1);
      } else if (direction === 'prev') {
        setCurrentPage(prev => Math.max(1, prev - 1));
      }

      setLastId(newLastId);
      setHasMore(data.length === ITEMS_PER_PAGE);
      setStatsData({
        total: Number(result.stats?.total || 0),
        entrees: Number(result.stats?.entrees || 0),
        sorties: Number(result.stats?.sorties || 0),
        ajustements: Number(result.stats?.ajustements || 0),
        quantiteEntree: Number(result.stats?.quantiteEntree || 0),
        quantiteSortie: Number(result.stats?.quantiteSortie || 0),
      });
    } catch (err: any) {
      console.error('[useMouvementsData] ERREUR', err?.message);
      if (isMounted.current) {
        setMouvements([]);
        setStatsData(EMPTY_STATS);
        setHasMore(false);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
      fetchLock.current = false;
    }
  }, [debouncedSearch, filterType, filterDate, sortOption, lastId, currentPage, period, exportCustomDate]);

  const loadDataRef = useRef<() => Promise<void>>(async () => {});
  loadDataRef.current = () => loadPage('refresh');

  const handleNextPage = useCallback(() => {
    if (hasMore && !loading && !fetchLock.current) void loadPage('next');
  }, [hasMore, loading, loadPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1 && !loading && !fetchLock.current) void loadPage('prev');
  }, [currentPage, loading, loadPage]);

  const publicLoadMouvements = useCallback(async (forceRefresh = false) => {
    await loadPage('refresh');
  }, [loadPage]);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set(mouvements.map(m => m.id)) : new Set());
  }, [mouvements]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const bulkDelete = useCallback(async (ids: number[]) => {
    if (!window.api?.stock?.bulkDeleteMouvements) throw new Error('API bulkDeleteMouvements indisponible');
    const result = await window.api.stock.bulkDeleteMouvements(ids);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression mouvements');
    await loadPage('refresh');
    return result;
  }, [loadPage]);

  // ===== useEffect synchronization =====
  useEffect(() => {
    void loadPage('refresh');
  }, [debouncedSearch, filterType, filterDate, sortOption, period, exportCustomDate]);

  useEffect(() => {
    if (isMounted.current && currentPage > 1) void loadPage('next');
  }, [currentPage]);

  return {
    mouvements,
    loading,
    refreshing,
    setRefreshing,
    totalItems: statsData.total,
    currentPage,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterDate,
    setFilterDate,
    period,
    setPeriod,
    sortOption,
    setSortOption,
    statsData,
    loadMouvements: publicLoadMouvements,
    ITEMS_PER_PAGE,
    selectedIds,
    setSelectedIds,
    handleSelectAll,
    handleSelectOne,
    bulkDelete,
    hasMore,
    handleNextPage,
    handlePrevPage,
    getTypeColor,
    getTypeLabel,
    getTypeIcon,
    exportPeriod,
    setExportPeriod,
    exportCustomDate,
    setExportCustomDate,
    exportToExcel,
    exportToPDF,
    exportToCSV,
  };
}