// src/hooks/useEmployesData.ts
// ⭐ REFACTOR: Nizara ho modules ny useEmployesData
// ⭐ FIX: totalItems, totalPages alaina avy amin'ny `result.total` (fa tsy `result.data.total`)
// ⭐ FIX: stats alaina avy amin'ny backend (employes:get-stats)
// ⭐ FIX: totalSalaire, actifs, total avy amin'ny stats

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  type Employe,
  type ExportPeriod,
  toLocalDateString,
  getErrorMessage,
  useEmployesFetchers,
  useEmployesExport,
} from './employes';

export type { Employe, ExportPeriod };

export const useEmployesData = () => {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOption, setSortOption] = useState('nom-asc');

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportDate, setExportDate] = useState<string>(() => toLocalDateString());

  const [historiquePaiements, setHistoriquePaiements] = useState<any[]>([]);
  // ⭐ FIX: Nampiana `total`, `enConge`, `inactifs` ao amin'ny stats
  const [stats, setStats] = useState({
    total: 0,
    totalSalaire: 0,
    actifs: 0,
    enConge: 0,
    inactifs: 0,
    tauxActif: 0,
  });
  const ITEMS_PER_PAGE = 10;

  const initialLoadDone = useRef(false);

  // Debounce searchTerm
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ⭐ Custom hooks
  const { paiementCounts, derniersPaiements, fetchPaiementCounts, fetchDerniersPaiements } = useEmployesFetchers();
  const { exportToExcel, exportToPDF, exportToCSV } = useEmployesExport({
    debouncedSearch,
    filterStatus,
    sortOption,
  });

  // ⭐ FIX: Function manokana haka stats avy amin'ny backend
  const fetchStatsFromBackend = useCallback(async () => {
    try {
      const api = (window as any).api?.employes;
      if (!api?.getStats) return;

      const statsResult = await api.getStats();
      if (statsResult?.success && statsResult.data) {
        const s = statsResult.data;
        const total = Number(s.total) || 0;
        const actifs = Number(s.actifs) || 0;
        const enConge = Number(s.en_conge) || 0;
        const inactifs = Number(s.inactifs) || 0;
        const totalSalaire = Number(s.total_salaires) || 0;
        const tauxActif = total > 0 ? Math.round((actifs / total) * 100) : 0;

        setStats({
          total,
          totalSalaire,
          actifs,
          enConge,
          inactifs,
          tauxActif,
        });
      }
    } catch (error) {
      console.error('Erreur fetchStatsFromBackend:', error);
    }
  }, []);

  const loadData = useCallback(async (page = currentPage) => {
    try {
      if (!initialLoadDone.current) setLoading(true);
      else setRefreshing(true);

      const result = await (window as any).api?.employes?.getAll?.({
        page,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch,
        status: filterStatus,
        sort: sortOption,
      });

      if (result?.success) {
        // ⭐ FIX: Ny backend dia mamerina { success, data: [...], total: 200 }
        //         → ny `data` dia array, ny `total` dia isa misaraka
        const data = Array.isArray(result.data) ? result.data : (result.data?.items || []);
        setEmployes(data);

        // ⭐ FIX: Alaina avy amin'ny `result.total` fa tsy `result.data.total`
        const total = Number(result.total) || data.length;
        setTotalItems(total);
        setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));

        await fetchDerniersPaiements(data);

        // ⭐ FIX: Makà stats avy amin'ny backend (fa tsy computation amin'ny pejy)
        await fetchStatsFromBackend();
      }
    } catch (error) {
      console.error('Erreur loadData', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      initialLoadDone.current = true;
    }
  }, [currentPage, debouncedSearch, filterStatus, sortOption, fetchDerniersPaiements, fetchStatsFromBackend]);

  useEffect(() => {
    loadData(currentPage);
  }, [currentPage, debouncedSearch, filterStatus, sortOption, loadData]);

  useEffect(() => {
    if (employes.length) fetchPaiementCounts(employes);
  }, [employes, fetchPaiementCounts]);

  const loadPaiementsEmploye = useCallback(async (id: number) => {
    if (!window.api?.payments?.getHistorique) return [];
    try {
      const result = await window.api.payments.getHistorique(id);
      const data = result?.success ? result.data || [] : [];
      setHistoriquePaiements(data);
      return data;
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
      return [];
    }
  }, []);

  const refreshPaiementCounts = useCallback(async () => {
    if (employes.length) await fetchPaiementCounts(employes);
  }, [employes, fetchPaiementCounts]);

  const createPaiement = useCallback(async (data: any) => {
    const result = await window.api?.payments?.create?.(data);
    if (result?.success) {
      await refreshPaiementCounts();
      await fetchDerniersPaiements(employes);
      return result.data;
    }
    throw new Error(getErrorMessage(result, 'Erreur création paiement'));
  }, [refreshPaiementCounts, fetchDerniersPaiements, employes]);

  const deletePaiement = useCallback(async (id: number) => {
    const result = await window.api?.payments?.delete?.(id);
    if (result?.success) {
      await refreshPaiementCounts();
      await fetchDerniersPaiements(employes);
      return true;
    }
    throw new Error(getErrorMessage(result, 'Erreur suppression paiement'));
  }, [refreshPaiementCounts, fetchDerniersPaiements, employes]);

  const getEmployeById = useCallback(async (id: number) => {
    const result = await (window as any).api?.employes?.getById?.(id);
    return result?.success ? result.data : null;
  }, []);

  const createEmploye = useCallback(async (data: any) => {
    const result = await (window as any).api?.employes?.create?.(data);
    if (result?.success) {
      await loadData(1);
      return result.data;
    }
    throw new Error(getErrorMessage(result, 'Erreur création employé'));
  }, [loadData]);

  const updateEmploye = useCallback(async (id: number, data: any) => {
    const result = await (window as any).api?.employes?.update?.(id, data);
    if (result?.success) {
      await loadData();
      return result.data;
    }
    throw new Error(getErrorMessage(result, 'Erreur mise à jour employé'));
  }, [loadData]);

  const deleteEmploye = useCallback(async (id: number) => {
    const result = await (window as any).api?.employes?.delete?.(id);
    if (result?.success) {
      await loadData();
    } else {
      throw new Error(getErrorMessage(result, 'Erreur suppression employé'));
    }
  }, [loadData]);

  const bulkUpdateStatus = useCallback(async (ids: number[], status: string) => {
    const result = await (window as any).api?.employes?.bulkUpdateStatus?.(ids, status);
    if (!result?.success) throw new Error(getErrorMessage(result, 'Erreur mise à jour en lot'));
    await loadData();
  }, [loadData]);

  const bulkDelete = useCallback(async (ids: number[]) => {
    const result = await (window as any).api?.employes?.bulkDelete?.(ids);
    if (!result?.success) throw new Error(getErrorMessage(result, 'Erreur suppression en lot'));
    await loadData();
  }, [loadData]);

  const loadPresence = useCallback(async (employeId: number, mois: number, annee: number) => {
    const result = await window.api?.employes?.getPresence?.(employeId, mois, annee);
    return result?.success ? result.data : null;
  }, []);

  const savePresence = useCallback(async (data: any) => {
    const result = await window.api?.employes?.updatePresence?.(data);
    if (!result?.success) throw new Error(getErrorMessage(result, 'Erreur enregistrement présence'));
  }, []);

  const updateSalary = useCallback(async (employeId: number, newSalary: number, raison: string) => {
    try {
      const result = await window.api?.employes?.updateSalary?.(employeId, newSalary, raison);
      if (!result?.success) throw new Error(getErrorMessage(result, 'Erreur mise à jour salaire'));
      await loadData();
      await refreshPaiementCounts();
      return result;
    } catch (error) {
      console.error('Erreur updateSalary:', error);
      throw error;
    }
  }, [loadData, refreshPaiementCounts]);

  const getStatusColor = (status: string) => {
    if (status === 'actif')
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 'en_conge')
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  const getStatusIcon = (_status: string) => null;

  return {
    employes,
    loading,
    refreshing,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortOption,
    setSortOption,
    exportPeriod,
    setExportPeriod,
    exportDate,
    setExportDate,
    paiementCounts,
    historiquePaiements,
    derniersPaiements,
    loadPaiementsEmploye,
    createPaiement,
    deletePaiement,
    loadData,
    stats,
    getEmployeById,
    createEmploye,
    updateEmploye,
    deleteEmploye,
    getStatusColor,
    getStatusIcon,
    ITEMS_PER_PAGE,
    refreshPaiementCounts,
    bulkUpdateStatus,
    bulkDelete,
    loadPresence,
    savePresence,
    updateSalary,
    fetchDerniersPaiements,
    exportToExcel,
    exportToPDF,
    exportToCSV,
  };
};