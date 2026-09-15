// src/hooks/useClientsData.ts
// ⭐ FIX: ClientStats manampy `total_commandes`
import { useCallback, useEffect, useRef, useState, createElement } from 'react';
import { Building, User } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../utils/saveFileWithDialog';

const ITEMS_PER_PAGE = 8;
const SORT_MAP = {
  'Nom (A-Z)': { field: 'nom', direction: 'ASC' },
  'Nom (Z-A)': { field: 'nom', direction: 'DESC' },
  'Date (Récent)': { field: 'created_at', direction: 'DESC' },
  'Date (Ancien)': { field: 'created_at', direction: 'ASC' },
} as const;

export interface ClientData {
  id: number;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  pays?: string | null;
  type?: string | null;
  image?: string | null;
  created_at?: string;
  updated_at?: string;
  total_achats?: number;
  nb_commandes?: number;
}

export interface ClientFilters {
  searchTerm: string;
  filterType: string;
  filterVille: string;
  filterPays: string;
  filterDateFrom: string;
  filterDateTo: string;
}

// ⭐ VAOVAO: total_commandes
export interface ClientStats {
  total: number;
  particuliers: number;
  entreprises: number;
  avec_telephone: number;
  total_achats: number;
  total_commandes: number;   // ⭐ NOUVEAU
}

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';

const formatNumberNoSlash = (value: number) => {
  return (Number(value) || 0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
};

const toLocalDateString = (d: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

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

export const useClientsData = () => {
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<() => Promise<void>>(async () => {});

  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortOption, setSortOption] = useState<keyof typeof SORT_MAP>('Nom (A-Z)');
  const [filters, setFilters] = useState<ClientFilters>({
    searchTerm: '',
    filterType: 'Tous',
    filterVille: '',
    filterPays: '',
    filterDateFrom: '',
    filterDateTo: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(() => toLocalDateString());

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; fetchLock.current = false; };
  }, []);

  useEffect(() => {
    const value = filters?.searchTerm ?? '';
    const t = setTimeout(() => setDebouncedSearch(value.trim()), 300);
    return () => clearTimeout(t);
  }, [filters?.searchTerm]);

  // ⭐ EnrichClient — fallback raha tsy misy `total_achats` avy amin'ny backend
  const enrichClientWithStats = useCallback(async (client: ClientData): Promise<ClientData> => {
    if (client.total_achats !== undefined && client.total_achats !== null) {
      return client;
    }
    let total_achats = 0;
    let nb_commandes = 0;
    try {
      if (window.api?.orders?.getByClient) {
        const res = await window.api.orders.getByClient(client.nom);
        if (res?.success && Array.isArray(res.data)) {
          const orders = res.data;
          nb_commandes = orders.length;
          total_achats = orders.reduce((sum: number, o: any) => sum + (Number(o.total_ttc) || 0), 0);
        }
      }
    } catch (error) {
      console.error('Erreur enrichissement stats client:', error);
    }
    return { ...client, total_achats, nb_commandes };
  }, []);

  const loadClients = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      if (isRefresh) setRefreshing(true);
      else if (!firstLoadDone.current) setLoading(true);
      if (!window.api?.clients?.getAll) throw new Error('API clients.getAll tsy hita');
      const sort = SORT_MAP[sortOption];
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        sortBy: sort.field,
        sortOrder: sort.direction,
        type: filters.filterType !== 'Tous' ? filters.filterType : undefined,
        ville: filters.filterVille || undefined,
        pays: filters.filterPays || undefined,
        dateFrom: filters.filterDateFrom || undefined,
        dateTo: filters.filterDateTo || undefined,
      };
      const result = await window.api.clients.getAll(params);
      if (!isMounted.current) return;
      if (!result?.success) throw new Error(result?.error || 'Erreur chargement');

      const rawClients = (result.data || []).filter(
        (item: any, idx: number, self: any[]) => self.findIndex(t => t.id === item.id) === idx
      );
      const enrichedClients = await Promise.all(rawClients.map(enrichClientWithStats));

      setClients(enrichedClients);
      const total = Number(result.pagination?.total || 0);
      setTotalItems(total);
      setTotalPages(Number(result.pagination?.totalPages) > 0
        ? Number(result.pagination?.totalPages)
        : Math.ceil(total / ITEMS_PER_PAGE));
      firstLoadDone.current = true;
    } catch (err) {
      console.error('❌ loadClients:', err);
      if (isMounted.current) setClients([]);
    } finally {
      if (isMounted.current) { setLoading(false); setRefreshing(false); }
      fetchLock.current = false;
    }
  }, [currentPage, debouncedSearch, sortOption, filters, enrichClientWithStats]);

  useEffect(() => { loadDataRef.current = loadClients; }, [loadClients]);
  useEffect(() => {
    if (isMounted.current) {
      setCurrentPage(1);
      loadDataRef.current(true);
    }
  }, [debouncedSearch, sortOption, filters.filterType, filters.filterVille, filters.filterPays, filters.filterDateFrom, filters.filterDateTo]);
  useEffect(() => {
    if (isMounted.current && firstLoadDone.current) loadDataRef.current(false);
  }, [currentPage]);

  const loadData = useCallback(async () => { setCurrentPage(1); }, []);
  const refresh = useCallback(async () => { await loadDataRef.current(true); }, []);

  const getClientById = useCallback(async (id: number): Promise<ClientData | null> => {
    if (!window.api?.clients?.getById) return null;
    try {
      const res = await window.api.clients.getById(id);
      if (res?.success && res.data) {
        return await enrichClientWithStats(res.data as ClientData);
      }
      return null;
    } catch (err) {
      console.error('Erreur getClientById:', err);
      return null;
    }
  }, [enrichClientWithStats]);

  const createClient = useCallback(async (data: Partial<ClientData>) => {
    if (!window.api?.clients?.create) throw new Error('API clients.create tsy hita.');
    const r = await window.api.clients.create(data);
    if (!r?.success) throw new Error(r?.error || 'Erreur création.');
    await loadDataRef.current(true);
    return r.data;
  }, []);

  const updateClient = useCallback(async (id: number, data: Partial<ClientData>) => {
    if (!window.api?.clients?.update) throw new Error('API clients.update tsy hita.');
    const r = await window.api.clients.update(id, data);
    if (!r?.success) throw new Error(r?.error || 'Erreur mise à jour.');
    await loadDataRef.current(true);
    return r.data;
  }, []);

  const deleteClient = useCallback(async (id: number) => {
    if (!window.api?.clients?.delete) throw new Error('API clients.delete tsy hita.');
    const r = await window.api.clients.delete(id);
    if (!r?.success) throw new Error(r?.error || 'Erreur suppression.');
    await loadDataRef.current(true);
    return r;
  }, []);

  const bulkDelete = useCallback(async (ids: number[]) => {
    if (!window.api?.clients?.bulkDelete) throw new Error('API clients.bulkDelete tsy hita.');
    const v = ids.filter(id => Number.isInteger(id) && id > 0).slice(0, 50);
    if (!v.length) throw new Error('Aucun ID valide.');
    const r = await window.api.clients.bulkDelete(v);
    if (!r?.success) throw new Error(r?.error || 'Erreur suppression lot.');
    await loadDataRef.current(true);
    return r;
  }, []);

  const bulkUpdateType = useCallback(async (ids: number[], newType: string) => {
    if (!window.api?.clients?.bulkUpdateType) throw new Error('API clients.bulkUpdateType tsy hita.');
    if (!['Particulier', 'Entreprise'].includes(newType)) throw new Error('Type invalide.');
    const v = ids.filter(id => Number.isInteger(id) && id > 0).slice(0, 50);
    if (!v.length) throw new Error('Aucun ID valide.');
    const r = await window.api.clients.bulkUpdateType(v, newType);
    if (!r?.success) throw new Error(r?.error || 'Erreur mise à jour lot.');
    await loadDataRef.current(true);
    return r;
  }, []);

  // ⭐⭐⭐ GET STATS — misy `total_commandes` ⭐⭐⭐
  const getStats = useCallback(async (): Promise<ClientStats> => {
    if (!window.api?.clients?.getStats) throw new Error('API clients.getStats tsy hita.');
    const r = await window.api.clients.getStats();
    if (!r?.success) throw new Error(r?.error || 'Erreur stats.');
    return {
      total: Number(r.data?.total || 0),
      particuliers: Number(r.data?.particuliers || 0),
      entreprises: Number(r.data?.entreprises || 0),
      avec_telephone: Number(r.data?.avec_telephone || 0),
      total_achats: Number(r.data?.total_achats || 0),
      total_commandes: Number(r.data?.total_commandes || 0),   // ⭐ NOUVEAU
    };
  }, []);

  const getTypeColor = useCallback((type?: string | null) =>
    type === 'Entreprise'
      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300', []);

  const getTypeIcon = useCallback((type?: string | null) =>
    type === 'Entreprise'
      ? createElement(Building, { size: 14, className: 'shrink-0' })
      : createElement(User, { size: 14, className: 'shrink-0' }), []);

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
    if (!window.api?.clients?.getAll) return [];
    const range = getExportPeriodRange(period, customDate);
    const sort = SORT_MAP[sortOption];
    const params = {
      page: 1,
      limit: 100000,
      search: debouncedSearch || undefined,
      sortBy: sort.field,
      sortOrder: sort.direction,
      type: filters.filterType !== 'Tous' ? filters.filterType : undefined,
      ville: filters.filterVille || undefined,
      pays: filters.filterPays || undefined,
      dateFrom: range.startDate,
      dateTo: range.endDate,
    };
    const result = await window.api.clients.getAll(params);
    if (result?.success) {
      const raw = result.data || [];
      return await Promise.all(raw.map(enrichClientWithStats));
    }
    return [];
  }, [debouncedSearch, sortOption, filters.filterType, filters.filterVille, filters.filterPays, getExportPeriodRange, enrichClientWithStats]);

  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const rows = data.length
      ? data.map((c: any) => ({
          'Nom': c.nom || '',
          'Type': c.type || 'Particulier',
          'Email': c.email || '',
          'Téléphone': c.telephone || '',
          'Ville': c.ville || '',
          'Pays': c.pays || '',
          'Adresse': c.adresse || '',
          'Total achats': c.total_achats || 0,
        }))
      : [{ 'Nom': 'Aucun client', 'Type': '', 'Email': '', 'Téléphone': '', 'Ville': '', 'Pays': '', 'Adresse': '', 'Total achats': 0 }];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const totalAchats = data.reduce((sum: number, c: any) => sum + (Number(c.total_achats) || 0), 0);
    XLSX.utils.sheet_add_json(ws, [{
      'Nom': 'TOTAL', 'Type': '', 'Email': '', 'Téléphone': '', 'Ville': '',
      'Pays': '', 'Adresse': '', 'Total achats': formatNumberNoSlash(totalAchats),
    }], { origin: -1, skipHeader: true });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `clients_${period}_${customDate || toLocalDateString()}.xlsx`;
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
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    const nowStr = new Date().toLocaleString('fr-FR');
    const periodLabel = getPeriodLabel(period, customDate);

    const TABLE_STYLE = {
      styles: {
        fontSize: 9, cellPadding: 2.2,
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

    const columns = ['Nom', 'Type', 'Email', 'Téléphone', 'Ville', 'Pays', 'Adresse', 'Total achats'];
    const rows = data.length
      ? data.map((c: any) => [
          c.nom || '', c.type || 'Particulier', c.email || '', c.telephone || '',
          c.ville || '', c.pays || '', c.adresse || '',
          formatNumberNoSlash(Number(c.total_achats || 0)),
        ])
      : [['Aucun client', '', '', '', '', '', '', '0']];

    const totalAchats = data.reduce((sum: number, c: any) => sum + (Number(c.total_achats) || 0), 0);

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(0, 16, pageWidth, 16);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LifesArt — Clients', margin, 10);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${nowStr}`, pageWidth - margin, 10, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport des clients', margin, 26);

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
        0: { cellWidth: 34 },
        1: { cellWidth: 24 },
        2: { cellWidth: 48, fontSize: 8.5 },
        3: { cellWidth: 26 },
        4: { cellWidth: 24 },
        5: { cellWidth: 24 },
        6: { cellWidth: 55, fontSize: 8.5 },
        7: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
      },
      foot: [[
        { content: '', colSpan: 6 },
        {
          content: `TOTAL : ${formatNumberNoSlash(totalAchats)} Ar`,
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
    const fileName = `clients_${period}_${customDate || toLocalDateString()}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le PDF.');
    }
    return result;
  }, [fetchAllForExport]);

  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const headers = ['Nom', 'Type', 'Email', 'Téléphone', 'Ville', 'Pays', 'Adresse', 'Total achats'];
    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    };
    const rows = data.length
      ? data.map((c: any) => [
          c.nom || '', c.type || 'Particulier', c.email || '', c.telephone || '',
          c.ville || '', c.pays || '', c.adresse || '', c.total_achats || 0,
        ])
      : [['Aucun client', '', '', '', '', '', '', 0]];

    const totalAchats = data.reduce((sum: number, c: any) => sum + (Number(c.total_achats) || 0), 0);
    const totalRow = ['', '', '', '', '', '', '', `TOTAL: ${formatNumberNoSlash(totalAchats)} Ar`];
    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')]),
    ].join('\n');

    const fileName = `clients_${period}_${customDate || toLocalDateString()}.csv`;
    const result = await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le CSV.');
    }
    return result;
  }, [fetchAllForExport]);

  return {
    clients, loading, refreshing, setRefreshing, currentPage, setCurrentPage, totalItems, totalPages, ITEMS_PER_PAGE,
    filters, setFilters, sortOption, setSortOption, refresh, loadData,
    getClientById,
    getStats, getTypeColor, getTypeIcon,
    createClient, updateClient, deleteClient, bulkDelete, bulkUpdateType,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  };
};