// src/hooks/useCategoriesData.ts
// ⭐ VAOVAO: `getStats()` fonction mba hampiasain'ny Categories.tsx
//    → Mamerina { total, avecDescription, sansDescription, totalProduits, categoriesVides, totalStock, valeurStock }

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

// ⭐ VAOVAO: Type ho an'ny stats global
export interface CategoryStats {
  total: number;
  avecDescription: number;
  sansDescription: number;
  totalProduits: number;
  categoriesVides: number;
  totalStock: number;
  valeurStock: number;
}

// ⭐ Format nombre tsotra (space mahazatra)
const formatNumberNoSlash = (value: number) => {
  return (Number(value) || 0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
};

// ⭐ Local date helper (YYYY-MM-DD) — tsy UTC
const toLocalDateString = (d: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// ⭐ Label période amin'ny teny français (ho an'ny PDF)
const getPeriodLabel = (period: ExportPeriod, customDate: string): string => {
  switch (period) {
    case 'aujourdhui': return "Aujourd'hui";
    case 'hier': return 'Hier';
    case 'semaine': return 'Cette semaine';
    case 'mois': return 'Ce mois';
    case 'annee': return 'Cette année';
    case 'custom': {
      if (!customDate) return 'Personnalisé';
      const [y, m, d] = customDate.split('-');
      return `Personnalisé : ${d}/${m}/${y}`;
    }
    default: return String(period);
  }
};

export const useCategoriesData = () => {
  // ===== HOOKS =====
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

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(() => toLocalDateString());

  // ===== EFFECTS =====
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

  // CRUD operations
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

  // ⭐⭐⭐ VAOVAO: getStats — fonction ho an'ny Categories.tsx ⭐⭐⭐
  const getStats = useCallback(async (): Promise<CategoryStats> => {
    if (!window.api?.categories?.getStats) {
      throw new Error('API categories.getStats indisponible');
    }
    const result = await window.api.categories.getStats();
    if (!result?.success || !result.data) {
      throw new Error(result?.error || 'Erreur stats.');
    }
    const data = result.data;
    return {
      total: Number(data.total) || 0,
      avecDescription: Number(data.avecDescription ?? data.avec_description) || 0,
      sansDescription: Number(data.sansDescription ?? data.sans_description) || 0,
      totalProduits: Number(data.totalProduits ?? data.total_produits) || 0,
      categoriesVides: Number(data.categoriesVides ?? data.categories_vides) || 0,
      totalStock: Number(data.totalStock ?? data.total_stock) || 0,
      valeurStock: Number(data.valeurStock ?? data.valeur_stock) || 0,
    };
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
  // ⭐ EXPORT FUNCTIONS
  // ============================================================

  const getExportPeriodRange = useCallback((period: ExportPeriod, customDate: string) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toLocalDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let startDate: string | undefined, endDate: string | undefined;

    if (period === 'aujourdhui') {
      const today = toLocalDate(now);
      startDate = today + ' 00:00:00';
      endDate = today + ' 23:59:59';
    } else if (period === 'hier') {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      const y = toLocalDate(yest);
      startDate = y + ' 00:00:00';
      endDate = y + ' 23:59:59';
    } else if (period === 'semaine') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      startDate = toLocalDate(monday) + ' 00:00:00';
      endDate = toLocalDate(sunday) + ' 23:59:59';
    } else if (period === 'mois') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate = toLocalDate(firstDay) + ' 00:00:00';
      endDate = toLocalDate(lastDay) + ' 23:59:59';
    } else if (period === 'annee') {
      startDate = `${now.getFullYear()}-01-01 00:00:00`;
      endDate = `${now.getFullYear()}-12-31 23:59:59`;
    } else if (period === 'custom') {
      const dateStr = customDate || toLocalDate(now);
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

    const totalProduits = data.reduce((sum: number, c: any) => sum + (Number(c.produits_count) || 0), 0);
    XLSX.utils.sheet_add_json(ws, [{
      'Nom': 'TOTAL', 'Description': '', 'Nb Produits': formatNumberNoSlash(totalProduits), 'Créé le': ''
    }], { origin: -1, skipHeader: true });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `categories_${period}_${customDate || toLocalDateString()}.xlsx`;
    const result = await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le fichier Excel.');
    }
    return result;
  }, [fetchAllForExport]);

  // ⭐ PDF
  const exportToPDF = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    const nowStr = new Date().toLocaleString('fr-FR');
    const periodLabel = getPeriodLabel(period, customDate);

    const TABLE_STYLE = {
      styles: {
        fontSize: 9,
        cellPadding: 2.2,
        textColor: [0, 0, 0] as [number, number, number],
        fillColor: [255, 255, 255] as [number, number, number],
        lineColor: [0, 0, 0] as [number, number, number],
        lineWidth: 0.25,
      },
      headStyles: {
        fillColor: [255, 255, 255] as [number, number, number],
        textColor: [0, 0, 0] as [number, number, number],
        fontStyle: 'bold' as const,
        lineColor: [0, 0, 0] as [number, number, number],
        lineWidth: 0.5,
      },
      alternateRowStyles: { fillColor: [255, 255, 255] as [number, number, number] },
    };

    const columns = ['Nom', 'Description', 'Nb Produits', 'Créé le'];

    const rows = data.length
      ? data.map((cat: any) => [
          cat.nom || '',
          cat.description || '',
          formatNumberNoSlash(Number(cat.produits_count || 0)),
          cat.created_at ? new Date(cat.created_at).toLocaleDateString('fr-FR') : '',
        ])
      : [['Aucune catégorie', '', '0', '']];

    const totalProduits = data.reduce((sum: number, c: any) => sum + (Number(c.produits_count) || 0), 0);

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(0, 16, pageWidth, 16);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LifesArt — Catégories', margin, 10);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${nowStr}`, pageWidth - margin, 10, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport des catégories', margin, 26);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Période : ${periodLabel}`, margin, 32);

    autoTable(doc, {
      ...TABLE_STYLE,
      startY: 38,
      head: [columns],
      body: rows,
      theme: 'grid',
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 110 },
        2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 49, halign: 'center' },
      },
      foot: [[
        { content: '', colSpan: 2 },
        {
          content: `TOTAL PRODUITS : ${formatNumberNoSlash(totalProduits)}`,
          colSpan: 2,
          styles: { halign: 'right' as const, fontStyle: 'bold' as const, fontSize: 9 },
        },
      ]],
      footStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'right',
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        cellPadding: { top: 2.2, right: 2.5, bottom: 2.2, left: 2.5 },
      },
      showHead: 'firstPage',
      showFoot: 'lastPage',
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(
        `LifesArt ERP — Page ${i} / ${pageCount}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }

    const pdfArrayBuffer = doc.output('arraybuffer');
    const fileName = `categories_${period}_${customDate || toLocalDateString()}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le PDF.');
    }
    return result;
  }, [fetchAllForExport]);

  // ⭐ CSV
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

    const totalProduits = data.reduce((sum: number, c: any) => sum + (Number(c.produits_count) || 0), 0);
    const totalRow = ['', '', `TOTAL PRODUITS : ${formatNumberNoSlash(totalProduits)}`, ''];

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')])
    ].join('\n');

    const fileName = `categories_${period}_${customDate || toLocalDateString()}.csv`;
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
    getStats,             // ⭐ VAOVAO
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