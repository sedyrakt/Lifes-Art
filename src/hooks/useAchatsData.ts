import { useState, useEffect, useCallback, useRef } from 'react';

export interface Achat { id: number; reference: string | null; fournisseur_id: number; fournisseur_nom?: string; date_achat: string; total_ht: number; total_ttc: number; designation?: string; nombre_produits?: number; observation?: string; created_at: string; updated_at?: string; }
export interface AchatDetail { id: number; achat_id: number; produit_id: number; produit_nom?: string; produit_code?: string; produit_image?: string; quantite: number; prix_unitaire: number; total: number; }

interface AchatFilters { searchTerm: string; filterFournisseur: string; sortOption: string; }
const ITEMS_PER_PAGE = 8;

export const useAchatsData = () => {
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<(isRefresh?: boolean) => Promise<void>>(async () => {});
  const fournisseursLoaded = useRef(false);
  const produitsLoaded = useRef(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achats, setAchats] = useState<Achat[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<AchatFilters>({ searchTerm: '', filterFournisseur: '', sortOption: 'Date (Récent)' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; fetchLock.current = false; }; }, []);
  useEffect(() => { loadReferences(false); }, []);
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(filters.searchTerm.trim()), 300); return () => window.clearTimeout(timer); }, [filters.searchTerm]);

  const loadReferences = useCallback(async (force = false) => {
    if (!fournisseursLoaded.current || force) {
      try { if (window.api?.fournisseurs?.getAll) { const result = await window.api.fournisseurs.getAll({ limit: 1000 }); if (result?.success && isMounted.current) { setFournisseurs(result.data || []); fournisseursLoaded.current = true; } } } catch (err) { console.error('❌ Erreur chargement fournisseurs:', err); }
    }
    if (!produitsLoaded.current || force) {
      try { const produitsApi = window.api?.produits || window.api?.products; if (produitsApi?.getAll) { const result = await produitsApi.getAll({ limit: 500, status: 'actif' }); if (result?.success && isMounted.current) { setProduits(result.data || []); produitsLoaded.current = true; } } } catch (err) { console.error('❌ Erreur chargement produits:', err); }
    }
  }, []);

  const loadAchats = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return; fetchLock.current = true;
    try {
      if (isRefresh) setRefreshing(true); else if (!firstLoadDone.current) setLoading(true);
      if (!fournisseursLoaded.current || !produitsLoaded.current) await loadReferences(false);
      if (!window.api?.achats?.getAll) { console.warn('⚠️ API achats.getAll non disponible'); if (isMounted.current) { setAchats([]); setTotalItems(0); setTotalPages(1); } return; }
      let sortField = 'date_achat'; let sortDirection: 'ASC' | 'DESC' = 'DESC';
      if (filters.sortOption === 'Date (Ancien)') { sortField = 'date_achat'; sortDirection = 'ASC'; } else if (filters.sortOption === 'Total (Croissant)') { sortField = 'total_ttc'; sortDirection = 'ASC'; } else if (filters.sortOption === 'Total (Décroissant)') { sortField = 'total_ttc'; sortDirection = 'DESC'; }
      const options = { page: isRefresh ? 1 : currentPage, limit: ITEMS_PER_PAGE, search: debouncedSearch || undefined, fournisseur: filters.filterFournisseur || undefined, sort: { field: sortField, direction: sortDirection } };
      const result = await window.api.achats.getAll(options); if (!result?.success) throw new Error(result?.error || 'Erreur chargement achats');
      if (isMounted.current) { const data = result.data || []; const pagination = result.pagination || {}; setAchats(data); setTotalItems(pagination.total || 0); setTotalPages(pagination.totalPages || Math.ceil((pagination.total || 0) / ITEMS_PER_PAGE) || 1); }
      firstLoadDone.current = true;
    } catch (err: any) { console.error('❌ loadAchats:', err?.message); if (isMounted.current) { setAchats([]); setTotalItems(0); setTotalPages(1); } }
    finally { if (isMounted.current) { setLoading(false); setRefreshing(false); } fetchLock.current = false; }
  }, [currentPage, debouncedSearch, filters.filterFournisseur, filters.sortOption, loadReferences]);

  // ⭐ FIX MAJIKA: Mivantana fa tsy anaty useEffect!
  loadDataRef.current = loadAchats;

  useEffect(() => { if (isMounted.current) { setCurrentPage(1); loadDataRef.current(true); } }, [debouncedSearch, filters.filterFournisseur, filters.sortOption]);
  useEffect(() => { if (isMounted.current && firstLoadDone.current) loadDataRef.current(false); }, [currentPage]);

  const refresh = useCallback(async () => { setRefreshing(true); await loadReferences(true); await loadDataRef.current(true); if (isMounted.current) setRefreshing(false); }, [loadReferences]);
  const createAchat = useCallback(async (data: any): Promise<any> => { if (!window.api?.achats?.create) throw new Error('API achats.create non disponible'); const result = await window.api.achats.create(data); if (!result?.success) throw new Error(result?.error || 'Erreur création achat'); await loadDataRef.current(true); return result; }, []);
  const updateAchat = useCallback(async (id: number, data: any): Promise<any> => { if (!window.api?.achats?.update) throw new Error('API achats.update non disponible'); const result = await window.api.achats.update(id, data); if (!result?.success) throw new Error(result?.error || 'Erreur mise à jour achat'); await loadDataRef.current(true); return result; }, []);
  const deleteAchat = useCallback(async (id: number): Promise<any> => { if (!window.api?.achats?.delete) throw new Error('API achats.delete non disponible'); const result = await window.api.achats.delete(id); if (!result?.success) throw new Error(result?.error || 'Erreur suppression achat'); await loadDataRef.current(true); return result; }, []);
  const bulkDelete = useCallback(async (ids: number[]): Promise<any> => { if (!window.api?.achats?.bulkDelete) throw new Error('API achats.bulkDelete non disponible'); const result = await window.api.achats.bulkDelete(ids); if (!result?.success) throw new Error(result?.error || 'Erreur suppression en lot'); await loadDataRef.current(true); return result; }, []);
  const getDetails = useCallback(async (achatId: number): Promise<{ achat: Achat; details: AchatDetail[] }> => { if (!window.api?.achats?.getDetails) throw new Error('API achats.getDetails non disponible'); const result = await window.api.achats.getDetails(achatId); if (!result?.success) throw new Error(result?.error || 'Erreur chargement détails'); return { achat: result.data?.achat, details: result.data?.details || [] }; }, []);
  const setFiltersState = useCallback((newFilters: Partial<AchatFilters>) => { setFilters(prev => ({ ...prev, ...newFilters })); }, []);
  const setSearchTerm = useCallback((value: string) => { setFilters(prev => ({ ...prev, searchTerm: value })); }, []);

  return { achats, fournisseurs, produits, loading, refreshing, setRefreshing, totalItems, totalPages, currentPage, setCurrentPage, ITEMS_PER_PAGE, filters, setFilters: setFiltersState, searchTerm: filters.searchTerm, setSearchTerm, loadAchats, getDetails, createAchat, updateAchat, deleteAchat, bulkDelete, refresh };
};

export default useAchatsData;