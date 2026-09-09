// useAchatsData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../utils/saveFileWithDialog';

export interface Achat {
  id: number;
  reference: string | null;
  fournisseur_id: number;
  fournisseur_nom?: string;
  date_achat: string;
  total_ht: number;
  total_ttc: number;
  designation?: string;
  nombre_produits?: number;
  observation?: string;
  created_at: string;
  updated_at?: string;
}

export interface AchatDetail {
  id: number;
  achat_id: number;
  produit_id: number;
  produit_nom?: string;
  produit_code?: string;
  produit_image?: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  tva_rate?: number; // ⭐ NOVAINA: Ampiana io mba hamoaka ny taux TVA
}

interface AchatFilters {
  searchTerm: string;
  filterFournisseur: string;
  sortOption: string;
}

const ITEMS_PER_PAGE = 8;

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';

const formatNumberNoSlash = (value: number) => {
  return value.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
};

export const useAchatsData = () => {
  // ===== 1. HOOKS =====
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
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // ===== 2. EFFECTS =====
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      fetchLock.current = false;
    };
  }, []);

  useEffect(() => {
    loadReferences(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.searchTerm.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [filters.searchTerm]);

  // ===== 3. CALLBACKS =====
  const loadReferences = useCallback(async (force = false) => {
    if (!fournisseursLoaded.current || force) {
      try {
        if (window.api?.fournisseurs?.getAll) {
          const result = await window.api.fournisseurs.getAll({ limit: 1000 });
          if (result?.success && isMounted.current) {
            setFournisseurs(result.data || []);
            fournisseursLoaded.current = true;
          }
        }
      } catch (err) { console.error('❌ Erreur chargement fournisseurs:', err); }
    }
    if (!produitsLoaded.current || force) {
      try {
        const produitsApi = window.api?.produits || window.api?.products;
        if (produitsApi?.getAll) {
          const result = await produitsApi.getAll({ limit: 500, status: 'actif' });
          if (result?.success && isMounted.current) {
            setProduits(result.data || []);
            produitsLoaded.current = true;
          }
        }
      } catch (err) { console.error('❌ Erreur chargement produits:', err); }
    }
  }, []);

  const loadAchats = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      if (isRefresh) setRefreshing(true);
      else if (!firstLoadDone.current) setLoading(true);

      if (!fournisseursLoaded.current || !produitsLoaded.current) await loadReferences(false);

      if (!window.api?.achats?.getAll) {
        console.warn('⚠️ API achats.getAll non disponible');
        if (isMounted.current) {
          setAchats([]);
          setTotalItems(0);
          setTotalPages(1);
        }
        return;
      }

      let sortField = 'date_achat';
      let sortDirection: 'ASC' | 'DESC' = 'DESC';
      if (filters.sortOption === 'Date (Ancien)') {
        sortField = 'date_achat'; sortDirection = 'ASC';
      } else if (filters.sortOption === 'Total (Croissant)') {
        sortField = 'total_ttc'; sortDirection = 'ASC';
      } else if (filters.sortOption === 'Total (Décroissant)') {
        sortField = 'total_ttc'; sortDirection = 'DESC';
      }

      const options = {
        page: isRefresh ? 1 : currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        fournisseur: filters.filterFournisseur || undefined,
        sort: { field: sortField, direction: sortDirection }
      };

      const result = await window.api.achats.getAll(options);
      if (!result?.success) throw new Error(result?.error || 'Erreur chargement achats');

      if (isMounted.current) {
        const data = result.data || [];
        const pagination = result.pagination || {};
        setAchats(data);
        setTotalItems(pagination.total || 0);
        setTotalPages(pagination.totalPages || Math.ceil((pagination.total || 0) / ITEMS_PER_PAGE) || 1);
      }
      firstLoadDone.current = true;
    } catch (err: any) {
      console.error('❌ loadAchats:', err?.message);
      if (isMounted.current) {
        setAchats([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
      fetchLock.current = false;
    }
  }, [currentPage, debouncedSearch, filters.filterFournisseur, filters.sortOption, loadReferences]);

  loadDataRef.current = loadAchats;

  useEffect(() => {
    if (isMounted.current) {
      setCurrentPage(1);
      loadDataRef.current(true);
    }
  }, [debouncedSearch, filters.filterFournisseur, filters.sortOption]);

  useEffect(() => {
    if (isMounted.current && firstLoadDone.current) loadDataRef.current(false);
  }, [currentPage]);

  // ===== 4. CRUD =====
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadReferences(true);
    await loadDataRef.current(true);
    if (isMounted.current) setRefreshing(false);
  }, [loadReferences]);

  const createAchat = useCallback(async (data: any): Promise<any> => {
    if (!window.api?.achats?.create) throw new Error('API achats.create non disponible');
    const result = await window.api.achats.create(data);
    if (!result?.success) throw new Error(result?.error || 'Erreur création achat');
    await loadDataRef.current(true);
    return result;
  }, []);

  const updateAchat = useCallback(async (id: number, data: any): Promise<any> => {
    if (!window.api?.achats?.update) throw new Error('API achats.update non disponible');
    const result = await window.api.achats.update(id, data);
    if (!result?.success) throw new Error(result?.error || 'Erreur mise à jour achat');
    await loadDataRef.current(true);
    return result;
  }, []);

  const deleteAchat = useCallback(async (id: number): Promise<any> => {
    if (!window.api?.achats?.delete) throw new Error('API achats.delete non disponible');
    const result = await window.api.achats.delete(id);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression achat');
    await loadDataRef.current(true);
    return result;
  }, []);

  const bulkDelete = useCallback(async (ids: number[]): Promise<any> => {
    if (!window.api?.achats?.bulkDelete) throw new Error('API achats.bulkDelete non disponible');
    const result = await window.api.achats.bulkDelete(ids);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression en lot');
    await loadDataRef.current(true);
    return result;
  }, []);

  const getDetails = useCallback(async (achatId: number): Promise<{ achat: Achat; details: AchatDetail[] }> => {
    if (!window.api?.achats?.getDetails) throw new Error('API achats.getDetails non disponible');
    const result = await window.api.achats.getDetails(achatId);
    if (!result?.success) throw new Error(result?.error || 'Erreur chargement détails');
    return { achat: result.data?.achat, details: result.data?.details || [] };
  }, []);

  const setFiltersState = useCallback((newFilters: Partial<AchatFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const setSearchTerm = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  }, []);

  // ===== 5. EXPORT FUNCTIONS =====

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

  const fetchAllForExport = useCallback(async (_period: ExportPeriod, _customDate: string) => {
    if (!window.api?.achats?.getAll) return [];
    const options = {
      page: 1,
      limit: 100000,
      search: debouncedSearch || undefined,
      fournisseur: filters.filterFournisseur || undefined,
      sort: { field: 'date_achat', direction: 'DESC' }
    };
    const result = await window.api.achats.getAll(options);
    if (result?.success) return result.data || [];
    return [];
  }, [debouncedSearch, filters.filterFournisseur]);

  const exportToExcel = useCallback(async (_period: ExportPeriod = 'mois', _customDate: string = '') => {
    const data = await fetchAllForExport(_period, _customDate);
    if (!data.length) return;
    const rows = data.map((achat: any) => ({
      'Référence': achat.reference || '',
      'Fournisseur': achat.fournisseur_nom || '',
      'Date': achat.date_achat ? new Date(achat.date_achat).toLocaleDateString('fr-FR') : '',
      'Total HT': achat.total_ht || 0,
      'Total TTC': achat.total_ttc || 0,
      'Statut': achat.statut_paiement || 'Non payé',
      'Observation': achat.observation || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Achats');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const totalSum = data.reduce((sum: number, a: any) => sum + (Number(a.total_ttc) || 0), 0);
    XLSX.utils.sheet_add_json(ws, [{ 'Référence': 'TOTAL', 'Fournisseur': '', 'Date': '', 'Total HT': '', 'Total TTC': formatNumberNoSlash(totalSum), 'Statut': '', 'Observation': '' }], { origin: -1, skipHeader: true });
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const result = await saveFileWithDialog(wbout, `achats_${_period}_${_customDate || new Date().toISOString().slice(0,10)}.xlsx`, [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToPDF = useCallback(async (_period: ExportPeriod = 'mois', _customDate: string = '') => {
    const data = await fetchAllForExport(_period, _customDate);
    if (!data.length) return;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('TahiryPro - Achats', 14, 10);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text(`Rapport des achats - ${_period}${_period === 'custom' ? ' (' + (_customDate || new Date().toISOString().split('T')[0]) + ')' : ''}`, 14, 28);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

    const columns = ['Référence', 'Fournisseur', 'Date', 'Total HT', 'Total TTC', 'Statut', 'Observation'];
    const rows = data.length
      ? data.map((achat: any) => [
          achat.reference || '', achat.fournisseur_nom || '',
          achat.date_achat ? new Date(achat.date_achat).toLocaleDateString('fr-FR') : '',
          achat.total_ht || 0, achat.total_ttc || 0,
          achat.statut_paiement || 'Non payé', achat.observation || '',
        ])
      : [['Aucun achat', '', '', 0, 0, '', '']];

    const totalSum = data.reduce((sum: number, a: any) => sum + (Number(a.total_ttc) || 0), 0);
    autoTable(doc, {
      head: [columns], body: rows, startY: 42,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid', showHead: 'firstPage',
      didDrawPage: (data) => { const pageNumber = doc.getNumberOfPages(); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(`Page ${pageNumber}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10); },
      showFoot: 'lastPage',
      foot: [['', '', '', '', `TOTAL: ${formatNumberNoSlash(totalSum)} Ar`, '', '']],
      footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
    });
    const result = await saveFileWithDialog(doc.output('arraybuffer'), `achats_${_period}_${_customDate || new Date().toISOString().slice(0,10)}.pdf`, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToCSV = useCallback(async (_period: ExportPeriod = 'mois', _customDate: string = '') => {
    const data = await fetchAllForExport(_period, _customDate);
    if (!data.length) return;
    const headers = ['Référence', 'Fournisseur', 'Date', 'Total HT', 'Total TTC', 'Statut', 'Observation'];
    const escapeCSV = (value: any) => { if (value === undefined || value === null) return '""'; return `"${String(value).replace(/"/g, '""')}"`; };
    const rows = data.length
      ? data.map((achat: any) => [achat.reference || '', achat.fournisseur_nom || '', achat.date_achat ? new Date(achat.date_achat).toLocaleDateString('fr-FR') : '', achat.total_ht || 0, achat.total_ttc || 0, achat.statut_paiement || 'Non payé', achat.observation || ''])
      : [['Aucun achat', '', '', 0, 0, '', '']];
    const totalSum = data.reduce((sum: number, a: any) => sum + (Number(a.total_ttc) || 0), 0);
    const totalRow = ['', '', '', '', `TOTAL: ${formatNumberNoSlash(totalSum)} Ar`, '', ''];
    const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')])].join('\n');
    const result = await saveFileWithDialog(csv, `achats_${_period}_${_customDate || new Date().toISOString().slice(0,10)}.csv`, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  return {
    achats, fournisseurs, produits, loading, refreshing, setRefreshing,
    totalItems, totalPages, currentPage, setCurrentPage, ITEMS_PER_PAGE,
    filters, setFilters: setFiltersState, searchTerm: filters.searchTerm, setSearchTerm,
    loadAchats, getDetails, createAchat, updateAchat, deleteAchat, bulkDelete, refresh,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  };
};

export default useAchatsData;