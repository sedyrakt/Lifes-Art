// src/hooks/useCategoriesData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../utils/saveFileWithDialog';
import { Categorie } from '../types/categories';

const ITEMS_PER_PAGE = 8;

const SORT_MAP = {
  'Nom (A-Z)': { field: 'nom', direction: 'ASC' },
  'Nom (Z-A)': { field: 'nom', direction: 'DESC' },
  'Plus récent': { field: 'created_at', direction: 'DESC' },
  'Plus ancien': { field: 'created_at', direction: 'ASC' },
} as const;

// ⭐ Type export period
export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';

export const useCategoriesData = () => {
  // ===== HOOKS – rehetra ato ambony, tsy misy condition =====
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

  // ⭐ Vaovao: Export period sy customDate
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // ===== EFFECTS – rehetra ato ambony =====
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

  // ===== CALLBACKS =====
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

  // ===== EFFECTS (mampiasa loadDataRef) =====
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

  // CRUD operations (tsy misy hooks, fa callbacks)
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

  // ============================================================
  // ⭐ EXPORT FUNCTIONS – misy période + save dialog
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
    if (!window.api?.categories?.getAll) return [];
    const range = getExportPeriodRange(period, customDate);
    const sort = SORT_MAP[sortOption] || SORT_MAP['Nom (A-Z)'];
    const params = {
      page: 1,
      limit: 100000,
      search: debouncedSearch || undefined,
      sortBy: sort.field,
      sortOrder: sort.direction,
      dateFrom: range.startDate || undefined,
      dateTo: range.endDate || undefined,
    };
    const result = await window.api.categories.getAll(params);
    if (result?.success) return result.data || [];
    return [];
  }, [debouncedSearch, sortOption, getExportPeriodRange]);

  // ⭐ Export Excel
  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const rows = data.length
      ? data.map((cat: any) => ({
          'Nom': cat.nom || '',
          'Description': cat.description || '',
          'Nb Produits': cat.produits_count || 0,
          'Créé le': cat.created_at ? new Date(cat.created_at).toLocaleDateString('fr-FR') : '',
        }))
      : [{ 'Nom': 'Aucune catégorie', 'Description': '', 'Nb Produits': 0, 'Créé le': '' }];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Catégories');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `categories_${period}_${customDate || new Date().toISOString().slice(0,10)}.xlsx`;
    const result = await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le fichier Excel.');
    }
    return result;
  }, [fetchAllForExport]);

  // ⭐ Export PDF
  const exportToPDF = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('LifesArt - Catégories', 14, 10);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text(`Rapport des catégories - ${period}${period === 'custom' ? ' (' + (customDate || new Date().toISOString().split('T')[0]) + ')' : ''}`, 14, 28);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

    const columns = ['Nom', 'Description', 'Nb Produits', 'Créé le'];
    const rows = data.length
      ? data.map((cat: any) => [
          cat.nom || '',
          cat.description || '',
          cat.produits_count || 0,
          cat.created_at ? new Date(cat.created_at).toLocaleDateString('fr-FR') : '',
        ])
      : [['Aucune catégorie', '', 0, '']];

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
    const fileName = `categories_${period}_${customDate || new Date().toISOString().slice(0,10)}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le PDF.');
    }
    return result;
  }, [fetchAllForExport]);

  // ⭐ Export CSV
  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const headers = ['Nom', 'Description', 'Nb Produits', 'Créé le'];
    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    };
    const rows = data.length
      ? data.map((cat: any) => [
          cat.nom || '',
          cat.description || '',
          cat.produits_count || 0,
          cat.created_at ? new Date(cat.created_at).toLocaleDateString('fr-FR') : '',
        ])
      : [['Aucune catégorie', '', 0, '']];

    const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
    const fileName = `categories_${period}_${customDate || new Date().toISOString().slice(0,10)}.csv`;
    const result = await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le CSV.');
    }
    return result;
  }, [fetchAllForExport]);

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
    exportPeriod,
    setExportPeriod,
    exportCustomDate,
    setExportCustomDate,
    exportToExcel,
    exportToPDF,
    exportToCSV,
  };
};