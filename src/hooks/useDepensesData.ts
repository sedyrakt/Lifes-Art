// useDepensesData.ts
// ⭐ FIX: topCategories dia SEPARATE STATE (fa tsy ao anaty stats)
import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../utils/saveFileWithDialog';
import { Depense, DepensesStats, DepensesFilters, TopCategorie } from '../types/depenses';

const ITEMS_PER_PAGE = 8;

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';

const formatNumberNoSlash = (value: number) => {
  return value.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
};

export const useDepensesData = () => {
  // ===== STATES =====
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
    topCategories: [],     // ⭐ Ampiana (optional)
  });

  // ⭐⭐⭐ SEPARATE STATE ho an'ny topCategories ⭐⭐⭐
  const [topCategories, setTopCategories] = useState<TopCategorie[]>([]);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // ===== REFS =====
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<(isRefresh?: boolean) => Promise<void>>(async () => {});

  // ===== LOAD =====
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

      // ⭐ Stats + topCategories
      try {
        const statsResult = await window.api.expenses.getStats();
        if (statsResult?.success && isMounted.current) {
          const data = statsResult.data || {};
          setStats({
            total: Number(data.total || 0),
            nb: Number(data.nb || 0),
            moyenne: Number(data.moyenne || 0),
            parCategorie: data.parCategorie || {},
            parMois: data.parMois || {},
            parMode: data.parMode || {},
            plusGrande: Number(data.plusGrande || 0),
            plusPetite: Number(data.plusPetite || 0),
            nbFournisseurs: Number(data.nbFournisseurs || 0),
            topCategories: data.topCategories || [],   // ⭐ Ampiana ao amin'ny stats koa (optional)
          });

          // ⭐ Set ho an'ny SEPARATE state
          const cats = Array.isArray(data.topCategories) ? data.topCategories : [];
          setTopCategories(
            cats.map((c: any) => ({
              categorie: String(c.categorie || ''),
              count: Number(c.count || 0),
              total: Number(c.total || 0),
            }))
          );
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

  loadDataRef.current = loadDepenses;

  const setFiltersState = useCallback((newFilters: Partial<DepensesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // ===== CRUD =====
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

  // ===== EXPORTS =====
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
    if (!window.api?.expenses?.getAll) return [];
    const range = getExportPeriodRange(period, customDate);
    const options = {
      page: 1,
      limit: 100000,
      search: debouncedSearch || undefined,
      categorie: filters.filterCategorie || undefined,
      mode: filters.filterMode || undefined,
      startDate: range.startDate,
      endDate: range.endDate,
      sort: { field: 'date_depense', direction: 'DESC' },
    };
    const result = await window.api.expenses.getAll(options);
    if (result?.success) return result.data || [];
    return [];
  }, [debouncedSearch, filters.filterCategorie, filters.filterMode, getExportPeriodRange]);

  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const rows = data.length
      ? data.map((d: any) => ({
          'Catégorie': d.categorie || '',
          'Description': d.description || '',
          'Montant': d.montant || 0,
          'Date': d.date_depense ? new Date(d.date_depense).toLocaleDateString('fr-FR') : '',
          'Mode': d.mode_paiement || '',
          'Référence': d.reference || '',
          'Fournisseur': d.fournisseur_nom || '',
          'Observation': d.observation || '',
        }))
      : [{ 'Catégorie': 'Aucune dépense', 'Description': '', 'Montant': 0, 'Date': '', 'Mode': '', 'Référence': '', 'Fournisseur': '', 'Observation': '' }];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dépenses');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const totalSum = data.reduce((sum: number, d: any) => sum + (Number(d.montant) || 0), 0);
    XLSX.utils.sheet_add_json(ws, [{ 'Catégorie': 'TOTAL', 'Description': '', 'Montant': formatNumberNoSlash(totalSum), 'Date': '', 'Mode': '', 'Référence': '', 'Fournisseur': '', 'Observation': '' }], { origin: -1, skipHeader: true });
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `depenses_${period}_${customDate || new Date().toISOString().slice(0, 10)}.xlsx`;
    const result = await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le fichier Excel.');
    }
    return result;
  }, [fetchAllForExport]);

  const exportToPDF = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('LifesArt - Dépenses', 14, 10);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text(`Rapport des dépenses - ${period}${period === 'custom' ? ' (' + (customDate || new Date().toISOString().split('T')[0]) + ')' : ''}`, 14, 28);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

    const columns = ['Catégorie', 'Description', 'Montant', 'Date', 'Mode', 'Référence', 'Fournisseur', 'Observation'];
    const rows = data.length
      ? data.map((d: any) => [
          d.categorie || '', d.description || '', d.montant || 0,
          d.date_depense ? new Date(d.date_depense).toLocaleDateString('fr-FR') : '',
          d.mode_paiement || '', d.reference || '', d.fournisseur_nom || '', d.observation || '',
        ])
      : [['Aucune dépense', '', 0, '', '', '', '', '']];

    const totalSum = data.reduce((sum: number, d: any) => sum + (Number(d.montant) || 0), 0);
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
      showFoot: 'lastPage',
      foot: [['', '', `TOTAL: ${formatNumberNoSlash(totalSum)} Ar`, '', '', '', '', '']],
      footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
    });
    const pdfArrayBuffer = doc.output('arraybuffer');
    const fileName = `depenses_${period}_${customDate || new Date().toISOString().slice(0, 10)}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le PDF.');
    }
    return result;
  }, [fetchAllForExport]);

  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const headers = ['Catégorie', 'Description', 'Montant', 'Date', 'Mode', 'Référence', 'Fournisseur', 'Observation'];
    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    };
    const rows = data.length
      ? data.map((d: any) => [
          d.categorie || '', d.description || '', d.montant || 0,
          d.date_depense ? new Date(d.date_depense).toLocaleDateString('fr-FR') : '',
          d.mode_paiement || '', d.reference || '', d.fournisseur_nom || '', d.observation || '',
        ])
      : [['Aucune dépense', '', 0, '', '', '', '', '']];

    const totalSum = data.reduce((sum: number, d: any) => sum + (Number(d.montant) || 0), 0);
    const totalRow = ['', '', `TOTAL: ${formatNumberNoSlash(totalSum)} Ar`, '', '', '', '', ''];
    const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')])].join('\n');
    const fileName = `depenses_${period}_${customDate || new Date().toISOString().slice(0, 10)}.csv`;
    const result = await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le CSV.');
    }
    return result;
  }, [fetchAllForExport]);

  // ===== EFFECTS =====
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      fetchLock.current = false;
    };
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

  useEffect(() => {
    if (!window.api?.financial?.onChanged) return;
    const unsubscribe = window.api.financial.onChanged(() => {
      if (isMounted.current && !fetchLock.current) loadDataRef.current(true);
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      setCurrentPage(1);
      loadDataRef.current(true);
    }
  }, [debouncedSearch, filters.filterCategorie, filters.filterDate, filters.filterMode, filters.sortOption]);

  useEffect(() => {
    if (isMounted.current && firstLoadDone.current) loadDataRef.current(false);
  }, [currentPage]);

  // ===== RETURN =====
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
    topCategories,          // ⭐ SEPARATE STATE — ampiasain'ny Depenses.tsx
    loadDepenses,
    createDepense,
    updateDepense,
    deleteDepense,
    bulkDelete,
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