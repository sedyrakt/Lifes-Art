// useFournisseursData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../utils/saveFileWithDialog';

const ITEMS_PER_PAGE = 8;

const SORT_MAP = {
  'Nom (A-Z)': { field: 'nom', direction: 'ASC' },
  'Nom (Z-A)': { field: 'nom', direction: 'DESC' },
  'Plus récent': { field: 'created_at', direction: 'DESC' },
  'Plus ancien': { field: 'created_at', direction: 'ASC' },
} as const;

export interface FournisseurFilters {
  searchTerm: string;
  email: string;
  telephone: string;
  dateFrom: string;
  dateTo: string;
}

export interface FournisseurStats {
  total: number;
  avec_contact: number;
  avec_email: number;
}

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';

const formatNumberNoSlash = (value: number) => {
  return value.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
};

export const useFournisseursData = () => {
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // ⭐ Manangona ny sortOption mivantana
  const [sortOption, setSortOption] = useState<keyof typeof SORT_MAP>('Nom (A-Z)');
  
  const [filters, setFilters] = useState<FournisseurFilters>({ searchTerm: '', email: '', telephone: '', dateFrom: '', dateTo: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; fetchLock.current = false; }; }, []);
  
  // ⭐ FIX: Guarded `filters.searchTerm` mba tsy hiteraka Error
  useEffect(() => { 
    const t = setTimeout(() => setDebouncedSearch((filters.searchTerm || '').trim()), 300); 
    return () => clearTimeout(t); 
  }, [filters.searchTerm]);

  const loadFournisseurs = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      if (isRefresh) setRefreshing(true);
      else if (!firstLoadDone.current) setLoading(true);

      if (!window.api?.fournisseurs?.getAll) throw new Error('API fournisseurs.getAll tsy hita');

      const sort = SORT_MAP[sortOption];
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        sortBy: sort.field,
        sortOrder: sort.direction,
        ...filters,
      };
      const result = await window.api.fournisseurs.getAll(params);

      if (!isMounted.current) return;
      if (!result?.success) throw new Error(result?.error || 'Erreur chargement');

      const data = (result.data || []).filter((item, idx, self) => self.findIndex(t => t.id === item.id) === idx);
      setFournisseurs(data);
      const total = Number(result.pagination?.total || 0);
      setTotalItems(total);
      setTotalPages(Number(result.pagination?.totalPages) > 0 ? Number(result.pagination?.totalPages) : Math.ceil(total / ITEMS_PER_PAGE));
      firstLoadDone.current = true;
    } catch (err) { console.error('❌ loadFournisseurs:', err); if (isMounted.current) setFournisseurs([]); }
    finally { if (isMounted.current) { setLoading(false); setRefreshing(false); } fetchLock.current = false; }
  }, [currentPage, debouncedSearch, sortOption, filters]);

  useEffect(() => { loadDataRef.current = loadFournisseurs; }, [loadFournisseurs]);
  
  useEffect(() => { 
    if (isMounted.current) { 
      setCurrentPage(1); 
      loadDataRef.current(true); 
    } 
  }, [debouncedSearch, sortOption, filters.email, filters.telephone, filters.dateFrom, filters.dateTo]);
  
  useEffect(() => { if (isMounted.current && firstLoadDone.current) loadDataRef.current(false); }, [currentPage]);

  const loadData = useCallback(async () => { setCurrentPage(1); }, []);
  const refresh = useCallback(async () => { await loadDataRef.current(true); }, []);

  const createFournisseur = useCallback(async (data: any) => {
    if (!window.api?.fournisseurs?.create) throw new Error('API fournisseurs.create indisponible');
    const r = await window.api.fournisseurs.create(data);
    if (!r?.success) throw new Error(r?.error || 'Erreur création');
    await loadDataRef.current(true);
    return r.data;
  }, []);

  const updateFournisseur = useCallback(async (id: number, data: any) => {
    if (!window.api?.fournisseurs?.update) throw new Error('API fournisseurs.update indisponible');
    const r = await window.api.fournisseurs.update(id, data);
    if (!r?.success) throw new Error(r?.error || 'Erreur mise à jour');
    await loadDataRef.current(true);
    return r.data;
  }, []);

  const deleteFournisseur = useCallback(async (id: number) => {
    if (!window.api?.fournisseurs?.delete) throw new Error('API fournisseurs.delete indisponible');
    const r = await window.api.fournisseurs.delete(id);
    if (!r?.success) throw new Error(r?.error || 'Erreur suppression');
    await loadDataRef.current(true);
    return r;
  }, []);

  const bulkDelete = useCallback(async (ids: number[]) => {
    if (!window.api?.fournisseurs?.bulkDelete) throw new Error('API fournisseurs.bulkDelete indisponible');
    const v = ids.filter(id => Number.isInteger(id) && id > 0);
    if (!v.length) throw new Error('Aucun ID valide');
    const r = await window.api.fournisseurs.bulkDelete(v);
    if (!r?.success) throw new Error(r?.error || 'Erreur suppression lot');
    await loadDataRef.current(true);
    return r;
  }, []);

  const getStats = useCallback(async (): Promise<FournisseurStats> => {
    if (!window.api?.fournisseurs?.getStats) throw new Error('API fournisseurs.getStats indisponible');
    try {
      const r = await window.api.fournisseurs.getStats();
      if (!r?.success) throw new Error(r?.error || 'Erreur stats');
      return { total: Number(r.data?.total || 0), avec_contact: Number(r.data?.avec_contact || 0), avec_email: Number(r.data?.avec_email || 0) };
    } catch (err) { console.error('❌ getStats:', err); throw err; }
  }, []);

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
    if (!window.api?.fournisseurs?.getAll) return [];
    const range = getExportPeriodRange(period, customDate);
    const sort = SORT_MAP[sortOption];
    const params = {
      page: 1,
      limit: 100000,
      search: debouncedSearch || undefined,
      sortBy: sort.field,
      sortOrder: sort.direction,
      ...filters,
      dateFrom: range.startDate || undefined,
      dateTo: range.endDate || undefined,
    };
    const result = await window.api.fournisseurs.getAll(params);
    if (result?.success) return result.data || [];
    return [];
  }, [debouncedSearch, sortOption, filters, getExportPeriodRange]);

  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const rows = data.length
      ? data.map((f: any) => ({ 'Nom': f.nom || '', 'Contact': f.contact || '', 'Téléphone': f.telephone || '', 'Email': f.email || '', 'Adresse': f.adresse || '' }))
      : [{ 'Nom': 'Aucun fournisseur', 'Contact': '', 'Téléphone': '', 'Email': '', 'Adresse': '' }];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fournisseurs');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `fournisseurs_${period}_${customDate || new Date().toISOString().slice(0,10)}.xlsx`;
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
    doc.text('LifesArt - Fournisseurs', 14, 10);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text(`Rapport des fournisseurs - ${period}${period === 'custom' ? ' (' + (customDate || new Date().toISOString().split('T')[0]) + ')' : ''}`, 14, 28);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);
    const columns = ['Nom', 'Contact', 'Téléphone', 'Email', 'Adresse'];
    const rows = data.length ? data.map((f: any) => [f.nom || '', f.contact || '', f.telephone || '', f.email || '', f.adresse || '']) : [['Aucun fournisseur', '', '', '', '']];
    autoTable(doc, { head: [columns], body: rows, startY: 42, styles: { fontSize: 9, cellPadding: 4 }, headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }, alternateRowStyles: { fillColor: [248, 250, 252] }, theme: 'grid', showHead: 'firstPage' });
    const pdfArrayBuffer = doc.output('arraybuffer');
    const fileName = `fournisseurs_${period}_${customDate || new Date().toISOString().slice(0,10)}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const headers = ['Nom', 'Contact', 'Téléphone', 'Email', 'Adresse'];
    const escapeCSV = (value: any) => { if (value === undefined || value === null) return '""'; return `"${String(value).replace(/"/g, '""')}"`; };
    const rows = data.length ? data.map((f: any) => [f.nom || '', f.contact || '', f.telephone || '', f.email || '', f.adresse || '']) : [['Aucun fournisseur', '', '', '', '']];
    const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
    const fileName = `fournisseurs_${period}_${customDate || new Date().toISOString().slice(0,10)}.csv`;
    const result = await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  return {
    fournisseurs, loading, refreshing, setRefreshing,
    currentPage, setCurrentPage, totalItems, totalPages, ITEMS_PER_PAGE,
    filters, setFilters, sortOption, setSortOption, // ⭐ Nampiana ny sortOption sy setSortOption
    refresh, loadData,
    createFournisseur, updateFournisseur, deleteFournisseur, bulkDelete, getStats,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  };
};