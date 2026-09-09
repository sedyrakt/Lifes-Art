// useClientsData.ts
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
  total_achats?: number; // ⭐ Ampiana
  nb_commandes?: number; // ⭐ Ampiana
}

export interface ClientFilters {
  searchTerm: string; 
  filterType: string; 
  filterVille: string;
  filterPays: string; 
  filterDateFrom: string; 
  filterDateTo: string;
}

interface ClientStats { total: number; particuliers: number; entreprises: number; avec_telephone: number; total_achats: number; }

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';

const formatNumberNoSlash = (value: number) => {
  return value.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
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
  const [filters, setFilters] = useState<ClientFilters>({ searchTerm: '', filterType: 'Tous', filterVille: '', filterPays: '', filterDateFrom: '', filterDateTo: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; fetchLock.current = false; }; }, []);
  
  useEffect(() => {
    const value = filters?.searchTerm ?? '';
    const t = setTimeout(() => setDebouncedSearch(value.trim()), 300);
    return () => clearTimeout(t);
  }, [filters?.searchTerm]);

  // ⭐ FONCTION MANAMPY NY STATS: Maka ny commandes ary mameno ny nb_commandes sy total_achats
  const enrichClientWithStats = useCallback(async (client: ClientData): Promise<ClientData> => {
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
      if (isRefresh) setRefreshing(true); else if (!firstLoadDone.current) setLoading(true);
      if (!window.api?.clients?.getAll) throw new Error('API clients.getAll tsy hita');
      const sort = SORT_MAP[sortOption];
      const params = {
        page: currentPage, limit: ITEMS_PER_PAGE, search: debouncedSearch || undefined,
        sortBy: sort.field, sortOrder: sort.direction,
        type: filters.filterType !== 'Tous' ? filters.filterType : undefined,
        ville: filters.filterVille || undefined, pays: filters.filterPays || undefined,
        dateFrom: filters.filterDateFrom || undefined, dateTo: filters.filterDateTo || undefined,
      };
      const result = await window.api.clients.getAll(params);
      if (!isMounted.current) return;
      if (!result?.success) throw new Error(result?.error || 'Erreur chargement');
      
      const rawClients = (result.data || []).filter((item, idx, self) => self.findIndex(t => t.id === item.id) === idx);
      
      // ⭐ ENRICHIT: Ataovy izay misy ny isan'ny commande sy total achats!
      const enrichedClients = await Promise.all(rawClients.map(enrichClientWithStats));
      
      setClients(enrichedClients);
      const total = Number(result.pagination?.total || 0);
      setTotalItems(total);
      setTotalPages(Number(result.pagination?.totalPages) > 0 ? Number(result.pagination?.totalPages) : Math.ceil(total / ITEMS_PER_PAGE));
      firstLoadDone.current = true;
    } catch (err) { console.error('❌ loadClients:', err); if (isMounted.current) setClients([]); }
    finally { if (isMounted.current) { setLoading(false); setRefreshing(false); } fetchLock.current = false; }
  }, [currentPage, debouncedSearch, sortOption, filters, enrichClientWithStats]);

  useEffect(() => { loadDataRef.current = loadClients; }, [loadClients]);
  useEffect(() => { if (isMounted.current) { setCurrentPage(1); loadDataRef.current(true); } }, [debouncedSearch, sortOption, filters.filterType, filters.filterVille, filters.filterPays, filters.filterDateFrom, filters.filterDateTo]);
  useEffect(() => { if (isMounted.current && firstLoadDone.current) loadDataRef.current(false); }, [currentPage]);

  const loadData = useCallback(async () => { setCurrentPage(1); }, []);
  const refresh = useCallback(async () => { await loadDataRef.current(true); }, []);

  // ⭐ GET BY ID: Maka ny client sy ny stats azy
  const getClientById = useCallback(async (id: number): Promise<ClientData | null> => {
    if (!window.api?.clients?.getById) return null;
    try {
      const res = await window.api.clients.getById(id);
      if (res?.success && res.data) {
        // Enrichit ilay client tokana!
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
    await loadDataRef.current(true); return r.data;
  }, []);

  const updateClient = useCallback(async (id: number, data: Partial<ClientData>) => {
    if (!window.api?.clients?.update) throw new Error('API clients.update tsy hita.');
    const r = await window.api.clients.update(id, data);
    if (!r?.success) throw new Error(r?.error || 'Erreur mise à jour.');
    await loadDataRef.current(true); return r.data;
  }, []);

  const deleteClient = useCallback(async (id: number) => {
    if (!window.api?.clients?.delete) throw new Error('API clients.delete tsy hita.');
    const r = await window.api.clients.delete(id);
    if (!r?.success) throw new Error(r?.error || 'Erreur suppression.');
    await loadDataRef.current(true); return r;
  }, []);

  const bulkDelete = useCallback(async (ids: number[]) => {
    if (!window.api?.clients?.bulkDelete) throw new Error('API clients.bulkDelete tsy hita.');
    const v = ids.filter(id => Number.isInteger(id) && id > 0).slice(0, 50);
    if (!v.length) throw new Error('Aucun ID valide.');
    const r = await window.api.clients.bulkDelete(v);
    if (!r?.success) throw new Error(r?.error || 'Erreur suppression lot.');
    await loadDataRef.current(true); return r;
  }, []);

  const bulkUpdateType = useCallback(async (ids: number[], newType: string) => {
    if (!window.api?.clients?.bulkUpdateType) throw new Error('API clients.bulkUpdateType tsy hita.');
    if (!['Particulier', 'Entreprise'].includes(newType)) throw new Error('Type invalide.');
    const v = ids.filter(id => Number.isInteger(id) && id > 0).slice(0, 50);
    if (!v.length) throw new Error('Aucun ID valide.');
    const r = await window.api.clients.bulkUpdateType(v, newType);
    if (!r?.success) throw new Error(r?.error || 'Erreur mise à jour lot.');
    await loadDataRef.current(true); return r;
  }, []);

  const getStats = useCallback(async (): Promise<ClientStats> => {
    if (!window.api?.clients?.getStats) throw new Error('API clients.getStats tsy hita.');
    const r = await window.api.clients.getStats();
    if (!r?.success) throw new Error(r?.error || 'Erreur stats.');
    // ⭐ Mampiasa ny total_achats raha misy, fa raha tsy misy dia calcul avy amin'ny clients
    return { 
      total: Number(r.data?.total || 0), 
      particuliers: Number(r.data?.particuliers || 0), 
      entreprises: Number(r.data?.entreprises || 0), 
      avec_telephone: Number(r.data?.avec_telephone || 0),
      total_achats: Number(r.data?.total_achats || 0) // ⭐ Ampiana
    };
  }, []);

  const getTypeColor = useCallback((type?: string | null) => type === 'Entreprise' ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300', []);
  const getTypeIcon = useCallback((type?: string | null) => type === 'Entreprise' ? createElement(Building, { size: 14, className: 'shrink-0' }) : createElement(User, { size: 14, className: 'shrink-0' }), []);

  // ============================================================
  // ⭐ EXPORT FUNCTIONS (Excel, PDF, CSV) misy période + date picker
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
      // ⭐ Enrichit ny export
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
    XLSX.utils.sheet_add_json(ws, [{ 'Nom': 'TOTAL', 'Type': '', 'Email': '', 'Téléphone': '', 'Ville': '', 'Pays': '', 'Adresse': '', 'Total achats': formatNumberNoSlash(totalAchats) }], { origin: -1, skipHeader: true });
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `clients_${period}_${customDate || new Date().toISOString().slice(0,10)}.xlsx`;
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
    doc.text('LifesArt - Clients', 14, 10);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text(`Rapport des clients - ${period}${period === 'custom' ? ' (' + (customDate || new Date().toISOString().split('T')[0]) + ')' : ''}`, 14, 28);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

    const columns = ['Nom', 'Type', 'Email', 'Téléphone', 'Ville', 'Pays', 'Adresse', 'Total achats'];
    const rows = data.length
      ? data.map((c: any) => [
          c.nom || '',
          c.type || 'Particulier',
          c.email || '',
          c.telephone || '',
          c.ville || '',
          c.pays || '',
          c.adresse || '',
          c.total_achats || 0,
        ])
      : [['Aucun client', '', '', '', '', '', '', 0]];

    const totalAchats = data.reduce((sum: number, c: any) => sum + (Number(c.total_achats) || 0), 0);
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
      foot: [['', '', '', '', '', '', '', `TOTAL: ${formatNumberNoSlash(totalAchats)} Ar`]],
      footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
    });
    const pdfArrayBuffer = doc.output('arraybuffer');
    const fileName = `clients_${period}_${customDate || new Date().toISOString().slice(0,10)}.pdf`;
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
          c.nom || '',
          c.type || 'Particulier',
          c.email || '',
          c.telephone || '',
          c.ville || '',
          c.pays || '',
          c.adresse || '',
          c.total_achats || 0,
        ])
      : [['Aucun client', '', '', '', '', '', '', 0]];

    const totalAchats = data.reduce((sum: number, c: any) => sum + (Number(c.total_achats) || 0), 0);
    const totalRow = ['', '', '', '', '', '', '', `TOTAL: ${formatNumberNoSlash(totalAchats)} Ar`];
    const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')])].join('\n');
    const fileName = `clients_${period}_${customDate || new Date().toISOString().slice(0,10)}.csv`;
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
    getClientById, // ⭐ Nampiana
    getStats, getTypeColor, getTypeIcon,
    createClient, updateClient, deleteClient, bulkDelete, bulkUpdateType,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  };
};