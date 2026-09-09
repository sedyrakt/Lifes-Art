// useProduitsData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../utils/saveFileWithDialog';

const ITEMS_PER_PAGE = 10;

const SORT_MAP = {
  'Nom (A-Z)': { field: 'nom', direction: 'ASC' },
  'Nom (Z-A)': { field: 'nom', direction: 'DESC' },
  'Prix (Croissant)': { field: 'prix_vente', direction: 'ASC' },
  'Prix (Décroissant)': { field: 'prix_vente', direction: 'DESC' },
  'Stock (Croissant)': { field: 'quantite_stock', direction: 'ASC' },
  'Stock (Décroissant)': { field: 'quantite_stock', direction: 'DESC' },
  'Nouveaux d\'abord': { field: 'id', direction: 'DESC' },
} as const;

type SortOption = keyof typeof SORT_MAP;

interface ProduitFilters {
  searchTerm: string;
  filterCategorie: string;
  filterStatus: string;
  prixMin: string;
  prixMax: string;
  dateFrom: string;
  dateTo: string;
}

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';

const formatNumberNoSlash = (value: number) => {
  return value.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
};

export const useProduitsData = () => {
  // ===== HOOKS (rehetra ato ambony) =====
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const referencesLoaded = useRef(false);
  const loadDataRef = useRef<() => Promise<void>>(async () => {});

  const [produits, setProduits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState<ProduitFilters>({
    searchTerm: '',
    filterCategorie: '',
    filterStatus: '',
    prixMin: '',
    prixMax: '',
    dateFrom: '',
    dateTo: '',
  });

  const [sortOption, setSortOption] = useState<SortOption>('Nouveaux d\'abord');
  const [categories, setCategories] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // ===== EFFECTS =====
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; fetchLock.current = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMounted.current) {
        const searchTerm = filters?.searchTerm || '';
        setDebouncedSearch(searchTerm.trim());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [filters?.searchTerm]);

  // ===== CALLBACKS =====
  const normalizeCategory = useCallback((item: any): { id: number; nom: string } | null => {
    if (!item) return null;
    const id = Number(item.id);
    if (!Number.isInteger(id) || id <= 0) return null;
    const nom = String(item.nom || item.name || item.libelle || item.label || '').trim();
    return { id, nom };
  }, []);

  const normalizeFournisseur = useCallback((item: any): { id: number; nom: string } | null => {
    if (!item) return null;
    const id = Number(item.id);
    if (!Number.isInteger(id) || id <= 0) return null;
    const nom = String(item.nom || item.name || item.raison_sociale || item.libelle || item.label || '').trim();
    return { id, nom };
  }, []);

  const extractArray = useCallback((response: any, specificKey?: string): any[] => {
    if (!response) return [];
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.data?.rows)) return response.data.rows;
    if (specificKey && Array.isArray(response.data?.[specificKey])) return response.data[specificKey];
    if (specificKey && Array.isArray(response[specificKey])) return response[specificKey] as any[];
    return [];
  }, []);

  const loadReferences = useCallback(async (force = false) => {
    if (referencesLoaded.current && !force) return;
    try {
      if (window.api?.categories?.getAll) {
        try {
          const result = await window.api.categories.getAll({ page: 1, limit: 10000 });
          if (result?.success) {
            const rawData = extractArray(result, 'categories');
            const normalized = rawData.map(normalizeCategory).filter((item): item is { id: number; nom: string } => item !== null);
            const unique = normalized.filter((item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx);
            unique.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
            if (isMounted.current) setCategories(unique);
          } else {
            if (isMounted.current) setCategories([]);
          }
        } catch (err) {
          console.error('❌ [Produits] Erreur catégories:', err);
          if (isMounted.current) setCategories([]);
        }
      } else {
        if (isMounted.current) setCategories([]);
      }

      if (window.api?.fournisseurs?.getAll) {
        try {
          const result = await window.api.fournisseurs.getAll({ page: 1, limit: 10000 });
          if (result?.success) {
            const rawData = extractArray(result, 'fournisseurs');
            const normalized = rawData.map(normalizeFournisseur).filter((item): item is { id: number; nom: string } => item !== null);
            const unique = normalized.filter((item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx);
            unique.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
            if (isMounted.current) setFournisseurs(unique);
          } else {
            if (isMounted.current) setFournisseurs([]);
          }
        } catch (err) {
          console.error('❌ [Produits] Erreur fournisseurs:', err);
          if (isMounted.current) setFournisseurs([]);
        }
      } else {
        if (isMounted.current) setFournisseurs([]);
      }

      referencesLoaded.current = true;
    } catch (error) {
      console.error('❌ [Produits] ERREUR loadReferences:', error);
    }
  }, [extractArray, normalizeCategory, normalizeFournisseur]);

  useEffect(() => {
    let cancelled = false;
    const loadInitial = async () => { if (!cancelled) await loadReferences(false); };
    loadInitial();
    return () => { cancelled = true; };
  }, [loadReferences]);

  const loadProduits = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      if (isRefresh) {
        if (isMounted.current) setRefreshing(true);
      } else if (!firstLoadDone.current) {
        if (isMounted.current) setLoading(true);
      }

      if (!referencesLoaded.current) await loadReferences(false);
      if (!window.api?.products?.getAll) throw new Error('API products.getAll tsy hita');

      const sort = SORT_MAP[sortOption] || SORT_MAP['Nom (A-Z)'];
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        sortBy: sort.field,
        sortOrder: sort.direction,
        status: filters?.filterStatus || undefined,
        categorieId: filters?.filterCategorie || undefined,
        prixMin: filters?.prixMin || undefined,
        prixMax: filters?.prixMax || undefined,
        dateFrom: filters?.dateFrom || undefined,
        dateTo: filters?.dateTo || undefined,
      };

      const result = await window.api.products.getAll(params);
      if (!isMounted.current) return;
      if (!result?.success) throw new Error(result?.error || 'Erreur chargement produits');

      const rawData = Array.isArray(result.data) ? result.data : (Array.isArray(result.data?.data) ? result.data.data : []);
      const data = rawData.filter((item: any, idx: number, self: any[]) => self.findIndex((t: any) => t.id === item.id) === idx);
      setProduits(data);

      const total = Number(result.pagination?.total || 0);
      setTotalItems(total);
      const backendTotalPages = Number(result.pagination?.totalPages);
      setTotalPages(backendTotalPages > 0 ? backendTotalPages : Math.ceil(total / ITEMS_PER_PAGE));

      firstLoadDone.current = true;
    } catch (error) {
      console.error('❌ [Produits] loadProduits:', error);
      if (isMounted.current) { setProduits([]); setTotalItems(0); setTotalPages(0); }
    } finally {
      if (isMounted.current) { setLoading(false); setRefreshing(false); }
      fetchLock.current = false;
    }
  }, [currentPage, debouncedSearch, sortOption, filters?.filterStatus, filters?.filterCategorie, filters?.prixMin, filters?.prixMax, filters?.dateFrom, filters?.dateTo, loadReferences]);

  useEffect(() => { loadDataRef.current = loadProduits; }, [loadProduits]);

  useEffect(() => {
    if (!isMounted.current) return;
    setCurrentPage(1);
    loadDataRef.current(true);
  }, [debouncedSearch, sortOption, filters?.filterStatus, filters?.filterCategorie, filters?.prixMin, filters?.prixMax, filters?.dateFrom, filters?.dateTo]);

  useEffect(() => {
    if (isMounted.current && firstLoadDone.current) loadDataRef.current(false);
  }, [currentPage]);

  const getStats = useCallback(async () => {
    if (!window.api?.products?.getStats) throw new Error('API products.getStats tsy hita');
    const result = await window.api.products.getStats();
    if (!result?.success) throw new Error(result?.error || 'Erreur stats');
    return result.data || {};
  }, []);

  const loadData = useCallback(async () => {
    await loadDataRef.current(true);
  }, []);

  const refresh = useCallback(async () => {
    await loadReferences(true);
    await loadDataRef.current(true);
  }, [loadReferences]);

  const generateCode = useCallback(() => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(4);
      crypto.getRandomValues(array);
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Array.from(array).map(n => n.toString(36).toUpperCase()).join('').slice(0, 8);
      return `PRD-${timestamp}-${random}`;
    }
    const t = Date.now().toString(36).toUpperCase();
    const r = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `PRD-${t}-${r}`;
  }, []);

  const createProduit = useCallback(async (data: any) => {
    if (!window.api?.products?.create) throw new Error('API products.create indisponible');
    const result = await window.api.products.create(data);
    if (!result?.success) throw new Error(result?.error || 'Erreur création produit');
    await loadDataRef.current(true);
    return result.data;
  }, []);

  const updateProduit = useCallback(async (id: number, data: any) => {
    if (!window.api?.products?.update) throw new Error('API products.update indisponible');
    const result = await window.api.products.update(id, data);
    if (!result?.success) throw new Error(result?.error || 'Erreur mise à jour produit');
    await loadDataRef.current(true);
    return result.data;
  }, []);

  const deleteProduit = useCallback(async (id: number) => {
    if (!window.api?.products?.delete) throw new Error('API products.delete indisponible');
    const result = await window.api.products.delete(id);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression produit');
    await loadDataRef.current(true);
    return result;
  }, []);

  const bulkDelete = useCallback(async (ids: number[]) => {
    if (!window.api?.products?.bulkDelete) throw new Error('API products.bulkDelete indisponible');
    const validIds = ids.filter(id => Number.isInteger(id) && id > 0);
    if (!validIds.length) throw new Error('Aucun produit valide');
    const result = await window.api.products.bulkDelete(validIds);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression lot');
    await loadDataRef.current(true);
    return result;
  }, []);

  const bulkUpdateStatus = useCallback(async (ids: number[], newStatus: string) => {
    if (!window.api?.products?.bulkUpdateStatus) throw new Error('API products.bulkUpdateStatus indisponible');
    const validIds = ids.filter(id => Number.isInteger(id) && id > 0);
    if (!validIds.length) throw new Error('Aucun produit valide');
    const status = String(newStatus).trim().toLowerCase();
    if (status !== 'actif' && status !== 'inactif') throw new Error('Statut invalide');
    const result = await window.api.products.bulkUpdateStatus(validIds, status);
    if (!result?.success) throw new Error(result?.error || 'Erreur mise à jour lot');
    await loadDataRef.current(true);
    return result;
  }, []);

  const getProduitById = useCallback(async (id: number) => {
    if (!window.api?.products?.getById) throw new Error('API products.getById indisponible');
    if (!Number.isInteger(id) || id <= 0) throw new Error('ID invalide');
    const result = await window.api.products.getById(id);
    if (!result?.success) throw new Error(result?.error || 'Produit non trouvé');
    return result.data;
  }, []);

  // ============================================================
  // ⭐ EXPORT FUNCTIONS
  // ============================================================
  const getExportPeriodRange = useCallback((period: ExportPeriod, customDate: string) => {
    const now = new Date();
    let startDate: string | undefined, endDate: string | undefined;
    if (period === 'aujourdhui') {
      startDate = now.toISOString().split('T')[0] + ' 00:00:00';
      endDate = now.toISOString().split('T')[0] + ' 23:59:59';
    } else if (period === 'hier') {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      startDate = yest.toISOString().split('T')[0] + ' 00:00:00';
      endDate = yest.toISOString().split('T')[0] + ' 23:59:59';
    } else if (period === 'semaine') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      startDate = monday.toISOString().split('T')[0] + ' 00:00:00';
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      endDate = sunday.toISOString().split('T')[0] + ' 23:59:59';
    } else if (period === 'mois') {
      startDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01 00:00:00`;
      const lastDay = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
      endDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')} 23:59:59`;
    } else if (period === 'annee') {
      startDate = `${now.getFullYear()}-01-01 00:00:00`;
      endDate = `${now.getFullYear()}-12-31 23:59:59`;
    } else if (period === 'custom') {
      const dateStr = customDate || now.toISOString().split('T')[0];
      startDate = dateStr + ' 00:00:00';
      endDate = dateStr + ' 23:59:59';
    }
    return { startDate, endDate };
  }, []);

  const fetchAllForExport = useCallback(async (period: ExportPeriod, customDate: string) => {
    if (!window.api?.products?.getAll) return [];
    const range = getExportPeriodRange(period, customDate);
    const sort = SORT_MAP[sortOption] || SORT_MAP['Nom (A-Z)'];
    const params = {
      page: 1,
      limit: 100000,
      search: debouncedSearch || undefined,
      sortBy: sort.field,
      sortOrder: sort.direction,
      status: filters?.filterStatus || undefined,
      categorieId: filters?.filterCategorie || undefined,
      prixMin: filters?.prixMin || undefined,
      prixMax: filters?.prixMax || undefined,
      dateFrom: range.startDate,
      dateTo: range.endDate,
    };
    const result = await window.api.products.getAll(params);
    if (result?.success) return result.data || [];
    return [];
  }, [debouncedSearch, sortOption, filters?.filterStatus, filters?.filterCategorie, filters?.prixMin, filters?.prixMax, getExportPeriodRange]);

  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const rows = data.length
      ? data.map((p: any) => ({
          'Code': p.code || '',
          'Nom': p.nom || '',
          'Description': p.description || '',
          'Catégorie': p.categorie_nom || '',
          'Fournisseur': p.fournisseur_nom || '',
          'Prix achat': p.prix_achat || 0,
          'Prix vente': p.prix_vente || 0,
          'Stock': p.quantite_stock || 0,
          'Unité': p.unite || '',
          'TVA': p.tva_rate || 0,
          'Statut': p.status || '',
        }))
      : [{ 'Code': 'Aucun produit', 'Nom': '', 'Description': '', 'Catégorie': '', 'Fournisseur': '', 'Prix achat': 0, 'Prix vente': 0, 'Stock': 0, 'Unité': '', 'TVA': 0, 'Statut': '' }];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produits');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `produits_${period}_${customDate || new Date().toISOString().slice(0,10)}.xlsx`;
    const result = await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToPDF = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('LifesArt - Produits', 14, 10);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text(`Rapport des produits - ${period}${period === 'custom' ? ' (' + (customDate || new Date().toISOString().split('T')[0]) + ')' : ''}`, 14, 28);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

    const columns = ['Code', 'Nom', 'Catégorie', 'Prix achat', 'Prix vente', 'Stock', 'Unité', 'TVA', 'Statut'];
    const rows = data.length
      ? data.map((p: any) => [
          p.code || '', p.nom || '', p.categorie_nom || '',
          p.prix_achat || 0, p.prix_vente || 0, p.quantite_stock || 0,
          p.unite || '', p.tva_rate || 0, p.status || '',
        ])
      : [['Aucun produit', '', '', 0, 0, 0, '', 0, '']];

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 42,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid',
      showHead: 'firstPage',
      didDrawPage: (data) => {
        const pageNumber = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Page ${pageNumber}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
      },
    });
    const pdfArrayBuffer = doc.output('arraybuffer');
    const fileName = `produits_${period}_${customDate || new Date().toISOString().slice(0,10)}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const headers = ['Code', 'Nom', 'Catégorie', 'Prix achat', 'Prix vente', 'Stock', 'Unité', 'TVA', 'Statut'];
    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    };
    const rows = data.length
      ? data.map((p: any) => [
          p.code || '', p.nom || '', p.categorie_nom || '',
          p.prix_achat || 0, p.prix_vente || 0, p.quantite_stock || 0,
          p.unite || '', p.tva_rate || 0, p.status || '',
        ])
      : [['Aucun produit', '', '', 0, 0, 0, '', 0, '']];

    const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
    const fileName = `produits_${period}_${customDate || new Date().toISOString().slice(0,10)}.csv`;
    const result = await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  // ===== RETURN =====
  return {
    produits, loading, refreshing, setRefreshing, currentPage, setCurrentPage,
    totalItems, totalPages, ITEMS_PER_PAGE, filters, setFilters, sortOption, setSortOption,
    categories, fournisseurs, loadReferences, refresh, loadData, getStats, generateCode,
    createProduit, updateProduit, deleteProduit, bulkDelete, bulkUpdateStatus, getProduitById,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  };
};