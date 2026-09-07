import { useState, useCallback, useEffect, useRef } from 'react';

export interface Employe {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  departement: string;
  date_embauche: string;
  salaire: number;
  status: string;
  created_at: string;
}

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

  const [paiementCounts, setPaiementCounts] = useState<Record<number, number>>({});
  const [historiquePaiements, setHistoriquePaiements] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSalaire: 0, actifs: 0, tauxActif: 0 });
  const [derniersPaiements, setDerniersPaiements] = useState<Record<number, any>>({});
  const ITEMS_PER_PAGE = 10;

  const initialLoadDone = useRef(false);

  // ⭐ Debounce ny searchTerm (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPaiementCounts = useCallback(async (employesList: any[]) => {
    if (!employesList.length) return;
    const ids = employesList.map(e => e.id);
    try {
      const result = await (window as any).api?.employes?.getPaiementCountsBatch?.(ids);
      if (result?.success) {
        const map: Record<number, number> = {};
        result.data.forEach((row: any) => { map[row.employe_id] = row.count; });
        setPaiementCounts(map);
      }
    } catch (error) {
      console.error('Erreur fetchPaiementCounts:', error);
    }
  }, []);

  const fetchDerniersPaiements = useCallback(async (employesList: any[]) => {
    if (!employesList.length) return;
    if (!window.api?.payments?.getByEmploye) return;

    const derniers: Record<number, any> = {};

    await Promise.all(employesList.map(async (emp) => {
      try {
        const result = await window.api.payments.getByEmploye(emp.id);
        if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
          const sorted = [...result.data].sort((a, b) => {
            const dateA = new Date(a.date_paiement || 0).getTime() || 0;
            const dateB = new Date(b.date_paiement || 0).getTime() || 0;
            if (dateA !== dateB) return dateB - dateA;
            return Number(b.id) - Number(a.id);
          });
          derniers[emp.id] = sorted[0];
        }
      } catch (err) {
        console.error(`Erreur getByEmploye pour employé ${emp.id}:`, err);
      }
    }));

    setDerniersPaiements(prev => ({ ...prev, ...derniers }));
  }, []);

  const loadData = useCallback(async (page = currentPage) => {
    try {
      if (!initialLoadDone.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const result = await (window as any).api?.employes?.getAll?.({
        page,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch,
        status: filterStatus,
        sort: sortOption,
      });
      if (result?.success) {
        const data = result.data?.items || result.data || [];
        setEmployes(data);
        setTotalItems(result.data?.total || data.length);
        setTotalPages(result.data?.totalPages || Math.ceil((result.data?.total || data.length) / ITEMS_PER_PAGE));
        await fetchDerniersPaiements(data);
        const actifs = data.filter((e: Employe) => e.status === 'actif').length;
        const totalSalaire = data.reduce((sum: number, e: Employe) => sum + (e.salaire || 0), 0);
        setStats({ totalSalaire, actifs, tauxActif: data.length ? Math.round((actifs / data.length) * 100) : 0 });
      }
    } catch (error) {
      console.error('Erreur loadData', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      initialLoadDone.current = true;
    }
  }, [currentPage, debouncedSearch, filterStatus, sortOption, fetchDerniersPaiements]);

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
    throw new Error(result?.message || 'Erreur création paiement');
  }, [refreshPaiementCounts, fetchDerniersPaiements, employes]);

  const deletePaiement = useCallback(async (id: number) => {
    const result = await window.api?.payments?.delete?.(id);
    if (result?.success) {
      await refreshPaiementCounts();
      await fetchDerniersPaiements(employes);
      return true;
    }
    throw new Error(result?.message || 'Erreur suppression paiement');
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
    throw new Error(result?.message || 'Erreur création');
  }, [loadData]);

  const updateEmploye = useCallback(async (id: number, data: any) => {
    const result = await (window as any).api?.employes?.update?.(id, data);
    if (result?.success) {
      await loadData();
      return result.data;
    }
    throw new Error(result?.message || 'Erreur mise à jour');
  }, [loadData]);

  const deleteEmploye = useCallback(async (id: number) => {
    const result = await (window as any).api?.employes?.delete?.(id);
    if (result?.success) {
      await loadData();
    } else {
      throw new Error(result?.message || 'Erreur suppression');
    }
  }, [loadData]);

  const bulkUpdateStatus = useCallback(async (ids: number[], status: string) => {
    const result = await (window as any).api?.employes?.bulkUpdateStatus?.(ids, status);
    if (!result?.success) throw new Error(result?.message || 'Erreur mise à jour en lot');
    await loadData();
  }, [loadData]);

  const bulkDelete = useCallback(async (ids: number[]) => {
    const result = await (window as any).api?.employes?.bulkDelete?.(ids);
    if (!result?.success) throw new Error(result?.message || 'Erreur suppression en lot');
    await loadData();
  }, [loadData]);

  const loadPresence = useCallback(async (employeId: number, mois: number, annee: number) => {
    const result = await window.api?.employes?.getPresence?.(employeId, mois, annee);
    return result?.success ? result.data : null;
  }, []);

  const savePresence = useCallback(async (data: any) => {
    const result = await window.api?.employes?.updatePresence?.(data);
    if (!result?.success) throw new Error(result?.message || 'Erreur enregistrement présence');
  }, []);

  const updateSalary = useCallback(async (employeId: number, newSalary: number, raison: string) => {
    try {
      const result = await window.api?.employes?.updateSalary?.(employeId, newSalary, raison);
      if (!result?.success) throw new Error(result?.message || 'Erreur mise à jour salaire');
      await loadData();
      await refreshPaiementCounts();
      return result;
    } catch (error) {
      console.error('Erreur updateSalary:', error);
      throw error;
    }
  }, [loadData, refreshPaiementCounts]);

  const getStatusColor = (status: string) => {
    if (status === 'actif') return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 'en_conge') return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  const getStatusIcon = (status: string) => null;

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
  };
};