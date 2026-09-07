
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowDownCircle, ArrowUpCircle, MinusCircle } from 'lucide-react';
import { Mouvement, MouvementsStats } from '../types/mouvements';

const ITEMS_PER_PAGE = 8;
const EMPTY_STATS: MouvementsStats = { total: 0, entrees: 0, sorties: 0, ajustements: 0, quantiteEntree: 0, quantiteSortie: 0 };

export default function useMouvementsData() {
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const cursorHistory = useRef<(number | null)[]>([null]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastId, setLastId] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [statsData, setStatsData] = useState<MouvementsStats>(EMPTY_STATS);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const VALID_TYPES = ['ENTREE', 'SORTIE', 'AJUSTEMENT'];

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { 
    isMounted.current = true; 
    return () => { isMounted.current = false; fetchLock.current = false; }; 
  }, []);

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
        endDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} 00:00:00`;
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
        sortOrder 
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
        quantiteSortie: Number(result.stats?.quantiteSortie || 0) 
      });
    } catch (err: any) {
      console.error('[useMouvementsData] ERREUR', err?.message);
      if (isMounted.current) { setMouvements([]); setStatsData(EMPTY_STATS); setHasMore(false); }
    } finally { 
      if (isMounted.current) { setLoading(false); setRefreshing(false); } 
      fetchLock.current = false; 
    }
  }, [debouncedSearch, filterType, filterDate, sortOption, lastId, currentPage]);

  useEffect(() => { void loadPage('refresh'); }, [debouncedSearch, filterType, filterDate, sortOption]);

  const handleNextPage = useCallback(() => { if (hasMore && !loading && !fetchLock.current) void loadPage('next'); }, [hasMore, loading, loadPage]);
  const handlePrevPage = useCallback(() => { if (currentPage > 1 && !loading && !fetchLock.current) void loadPage('prev'); }, [currentPage, loading, loadPage]);

  const publicLoadMouvements = useCallback(async (forceRefresh = false) => { 
    await loadPage('refresh'); 
  }, [loadPage]);

  const handleSelectAll = useCallback((checked: boolean) => { 
    setSelectedIds(checked ? new Set(mouvements.map(m => m.id)) : new Set()); 
  }, [mouvements]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => { 
    setSelectedIds(prev => { const next = new Set(prev); checked ? next.add(id) : next.delete(id); return next; }); 
  }, []);

  const bulkDelete = useCallback(async (ids: number[]) => {
    if (!window.api?.stock?.bulkDeleteMouvements) throw new Error('API bulkDeleteMouvements indisponible');
    const result = await window.api.stock.bulkDeleteMouvements(ids);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression mouvements');
    await loadPage('refresh');
    return result;
  }, [loadPage]);

  const getTypeColor = useCallback((type: string) => {
    const colors: Record<string, string> = {
      ENTREE: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      SORTIE: 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      AJUSTEMENT: 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    };
    return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  }, []);

  const getTypeLabel = useCallback((type: string) => {
    const labels: Record<string, string> = { ENTREE: 'Entrée', SORTIE: 'Sortie', AJUSTEMENT: 'Ajustement' };
    return labels[type] || type;
  }, []);

  const getTypeIcon = useCallback((type: string) => {
    const icons: Record<string, React.ElementType> = { ENTREE: ArrowDownCircle, SORTIE: ArrowUpCircle, AJUSTEMENT: MinusCircle };
    const Icon = icons[type] || MinusCircle;
    return React.createElement(Icon, { className: 'w-3.5 h-3.5' });
  }, []);

  return {
    mouvements, loading, refreshing, setRefreshing, totalItems: statsData.total, currentPage, searchTerm, setSearchTerm, filterType, setFilterType,
    filterDate, setFilterDate, sortOption, setSortOption, statsData, loadMouvements: publicLoadMouvements,
    ITEMS_PER_PAGE, selectedIds, setSelectedIds, handleSelectAll, handleSelectOne, bulkDelete, hasMore,
    handleNextPage, handlePrevPage, getTypeColor, getTypeLabel, getTypeIcon,
  };
}