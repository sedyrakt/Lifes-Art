// useMouvementsData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowDownCircle, ArrowUpCircle, MinusCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Mouvement, MouvementsStats } from '../types/mouvements';
import { saveFileWithDialog } from '../utils/saveFileWithDialog';

const ITEMS_PER_PAGE = 8;
const EMPTY_STATS: MouvementsStats = { total: 0, entrees: 0, sorties: 0, ajustements: 0, quantiteEntree: 0, quantiteSortie: 0 };

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';

// ⭐ Définition des types valides (utilisée dans tout le hook)
const VALID_TYPES = ['ENTREE', 'SORTIE', 'AJUSTEMENT'];

const formatNumberNoSlash = (value: number) => {
  return value.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
};

export default function useMouvementsData() {
  // ===== 1. TOUS LES useState =====
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [period, setPeriod] = useState<'jour' | 'semaine' | 'mois' | 'annee'>('mois');
  const [sortOption, setSortOption] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastId, setLastId] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [statsData, setStatsData] = useState<MouvementsStats>(EMPTY_STATS);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // ===== 2. TOUS LES useRef =====
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const cursorHistory = useRef<(number | null)[]>([null]);

  // ===== 3. TOUS LES useEffect =====
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      fetchLock.current = false;
    };
  }, []);

  // ===== 4. TOUS LES useCallback =====
  const getExportPeriodRange = useCallback((exportPeriod: ExportPeriod, customDate: string) => {
    const now = new Date();
    let startDate: string | undefined, endDate: string | undefined;
    if (exportPeriod === 'aujourdhui') {
      startDate = now.toISOString().split('T')[0] + ' 00:00:00';
      endDate = now.toISOString().split('T')[0] + ' 23:59:59';
    } else if (exportPeriod === 'hier') {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      startDate = yest.toISOString().split('T')[0] + ' 00:00:00';
      endDate = yest.toISOString().split('T')[0] + ' 23:59:59';
    } else if (exportPeriod === 'semaine') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      startDate = monday.toISOString().split('T')[0] + ' 00:00:00';
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      endDate = sunday.toISOString().split('T')[0] + ' 23:59:59';
    } else if (exportPeriod === 'mois') {
      startDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01 00:00:00`;
      endDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()).padStart(2,'0')} 23:59:59`;
    } else if (exportPeriod === 'annee') {
      startDate = `${now.getFullYear()}-01-01 00:00:00`;
      endDate = `${now.getFullYear()}-12-31 23:59:59`;
    } else if (exportPeriod === 'custom') {
      const dateStr = customDate || now.toISOString().split('T')[0];
      startDate = dateStr + ' 00:00:00';
      endDate = dateStr + ' 23:59:59';
    }
    return { startDate, endDate };
  }, []);

  const loadPage = useCallback(async (direction: 'next' | 'prev' | 'refresh') => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      if (direction === 'refresh') {
        setCurrentPage(1);
        setLastId(null);
        setMouvements([]);
        setHasMore(true);
        cursorHistory.current = [null];
      }
      let targetLastId: number | null = null;
      if (direction === 'next') targetLastId = lastId;
      if (direction === 'prev') targetLastId = cursorHistory.current[currentPage - 2] ?? null;

      if (!window.api) throw new Error('window.api tsy disponible');
      if (!window.api.stock) throw new Error('window.api.stock tsy disponible');
      if (typeof window.api.stock.getMouvements !== 'function') throw new Error('window.api.stock.getMouvements tsy disponible');

      let sortBy: 'date_mouvement' | 'quantite' | 'id' = 'date_mouvement';
      let sortOrder: 'ASC' | 'DESC' = 'DESC';
      switch (sortOption) {
        case 'date-asc': sortBy = 'date_mouvement'; sortOrder = 'ASC'; break;
        case 'quantite-desc': sortBy = 'quantite'; sortOrder = 'DESC'; break;
        case 'quantite-asc': sortBy = 'quantite'; sortOrder = 'ASC'; break;
        default: sortBy = 'date_mouvement'; sortOrder = 'DESC'; break;
      }

      let startDate: string | undefined, endDate: string | undefined;
      if (filterDate) {
        startDate = `${filterDate} 00:00:00`;
        const d = new Date(`${filterDate}T00:00:00`);
        d.setDate(d.getDate() + 1);
        endDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} 00:00:00`;
      } else {
        const range = getExportPeriodRange(period === 'jour' ? 'aujourdhui' : period === 'semaine' ? 'semaine' : period === 'annee' ? 'annee' : 'mois', exportCustomDate);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      const safeType = VALID_TYPES.includes(filterType) ? filterType : null;

      const request = {
        lastId: targetLastId,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch,
        type: safeType,
        startDate,
        endDate,
        sortBy,
        sortOrder
      };

      const result = await window.api.stock.getMouvements(request);

      if (!result) throw new Error('getMouvements() n\'a retourné aucun résultat.');
      if (!result.success) throw new Error(result.error || 'Erreur inconnue du backend');

      const data: Mouvement[] = Array.isArray(result.data) ? result.data : [];
      const newLastId = data.length > 0 ? Number(data[data.length - 1].id) : null;

      setMouvements(data);

      if (direction === 'next') {
        if (lastId !== null && currentPage >= 1) cursorHistory.current[currentPage] = lastId;
        setCurrentPage(prev => prev + 1);
      } else if (direction === 'prev') {
        setCurrentPage(prev => Math.max(1, prev - 1));
      }

      setLastId(newLastId);
      setHasMore(data.length === ITEMS_PER_PAGE);
      setStatsData({
        total: Number(result.stats?.total || 0),
        entrees: Number(result.stats?.entrees || 0),
        sorties: Number(result.stats?.sorties || 0),
        ajustements: Number(result.stats?.ajustements || 0),
        quantiteEntree: Number(result.stats?.quantiteEntree || 0),
        quantiteSortie: Number(result.stats?.quantiteSortie || 0)
      });
    } catch (err: any) {
      console.error('[useMouvementsData] ERREUR', err?.message);
      if (isMounted.current) {
        setMouvements([]);
        setStatsData(EMPTY_STATS);
        setHasMore(false);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
      fetchLock.current = false;
    }
  }, [debouncedSearch, filterType, filterDate, sortOption, lastId, currentPage, period, getExportPeriodRange, exportCustomDate]);

  // Assignation directe (pas un hook)
  const loadDataRef = useRef<() => Promise<void>>(async () => {});
  loadDataRef.current = () => loadPage('refresh');

  const handleNextPage = useCallback(() => {
    if (hasMore && !loading && !fetchLock.current) void loadPage('next');
  }, [hasMore, loading, loadPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1 && !loading && !fetchLock.current) void loadPage('prev');
  }, [currentPage, loading, loadPage]);

  const publicLoadMouvements = useCallback(async (forceRefresh = false) => {
    await loadPage('refresh');
  }, [loadPage]);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set(mouvements.map(m => m.id)) : new Set());
  }, [mouvements]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const bulkDelete = useCallback(async (ids: number[]) => {
    if (!window.api?.stock?.bulkDeleteMouvements) throw new Error('API bulkDeleteMouvements indisponible');
    const result = await window.api.stock.bulkDeleteMouvements(ids);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression mouvements');
    await loadPage('refresh');
    return result;
  }, [loadPage]);

  const getTypeColor = useCallback((type: string) => {
    const colors: Record<string, string> = {
      ENTREE: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      SORTIE: 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      AJUSTEMENT: 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    };
    return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  }, []);

  const getTypeLabel = useCallback((type: string) => {
    const labels: Record<string, string> = { ENTREE: 'Entrée', SORTIE: 'Sortie', AJUSTEMENT: 'Ajustement' };
    return labels[type] || type;
  }, []);

  const getTypeIcon = useCallback((type: string) => {
    const icons: Record<string, React.ElementType> = { ENTREE: ArrowDownCircle, SORTIE: ArrowUpCircle, AJUSTEMENT: MinusCircle };
    const Icon = icons[type] || MinusCircle;
    return React.createElement(Icon, { className: 'w-3.5 h-3.5' });
  }, []);

  const getPrixUnitaire = useCallback((m: any): number => {
    if (m.prix_unitaire !== undefined && m.prix_unitaire !== null && m.prix_unitaire !== 0) return Number(m.prix_unitaire);
    if (m.produit) {
      if (m.produit.prix_vente) return Number(m.produit.prix_vente);
      if (m.produit.prix_unitaire) return Number(m.produit.prix_unitaire);
      if (m.produit.prix_achat) return Number(m.produit.prix_achat);
      if (m.produit.prix) return Number(m.produit.prix);
    }
    if (m.prix_vente) return Number(m.prix_vente);
    if (m.prix_achat) return Number(m.prix_achat);
    if (m.prix) return Number(m.prix);
    return 0;
  }, []);

  const getTotal = useCallback((m: any): number => {
    const qty = Number(m.quantite) || 0;
    const prix = getPrixUnitaire(m);
    return Math.round(qty * prix * 100) / 100;
  }, [getPrixUnitaire]);

  const fetchAllForExport = useCallback(async (exportPeriod: ExportPeriod, customDate: string) => {
    if (!window.api?.stock?.getMouvements) return [];
    const range = getExportPeriodRange(exportPeriod, customDate);
    const request = {
      lastId: null,
      limit: 100000,
      search: debouncedSearch,
      type: VALID_TYPES.includes(filterType) ? filterType : null,
      startDate: range.startDate,
      endDate: range.endDate,
      sortBy: 'date_mouvement',
      sortOrder: 'DESC'
    };
    const result = await window.api.stock.getMouvements(request);
    if (result?.success && Array.isArray(result.data)) return result.data;
    return [];
  }, [debouncedSearch, filterType, getExportPeriodRange]);

  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    if (!data.length) return;
    
    const rows = data.map(m => ({
      Reference: m.reference || 'N/A',
      Type: getTypeLabel(m.type_mouvement),
      Produit: m.produit_nom || m.nom || 'N/A',
      Quantité: m.quantite,
      'Stock précédent': m.ancien_stock ?? 'N/A',
      'Stock actuel': m.nouveau_stock ?? 'N/A',
      'Prix unitaire': getPrixUnitaire(m),
      'Total': getTotal(m),
      Observation: m.observation || '',
      Date: m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR') : '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mouvements');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const totalSum = rows.reduce((sum, r) => sum + (Number(r['Total']) || 0), 0);
    XLSX.utils.sheet_add_json(ws, [{ Reference: 'TOTAL', Quantité: '', 'Prix unitaire': '', 'Total': formatNumberNoSlash(totalSum) }], { origin: -1, skipHeader: true });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `mouvements_stock_${period}_${customDate || new Date().toISOString().slice(0,10)}.xlsx`;
    
    await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
  }, [fetchAllForExport, getTypeLabel, getPrixUnitaire, getTotal]);

  const exportToPDF = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    if (!data.length) return;
    
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('LifesArt - Mouvements de stock', 14, 10);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text(`Rapport des mouvements - ${period}${period === 'custom' ? ' (' + (customDate || new Date().toISOString().split('T')[0]) + ')' : ''}`, 14, 28);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

    const columns = ['Reference', 'Type', 'Produit', 'Quantité', 'Stock préc.', 'Stock actuel', 'Prix unit.', 'Total', 'Observation', 'Date'];
    const rows = data.map(m => [
      m.reference || 'N/A',
      getTypeLabel(m.type_mouvement),
      m.produit_nom || m.nom || 'N/A',
      m.quantite,
      m.ancien_stock ?? 'N/A',
      m.nouveau_stock ?? 'N/A',
      getPrixUnitaire(m),
      getTotal(m),
      m.observation || '',
      m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR') : '',
    ]);

    const totalSum = data.reduce((sum, m) => sum + getTotal(m), 0);

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
      foot: [['', '', '', '', '', '', '', `TOTAL: ${formatNumberNoSlash(totalSum)} Ar`, '', '']],
      footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
    });

    const pdfArrayBuffer = doc.output('arraybuffer');
    const fileName = `mouvements_stock_${period}_${customDate || new Date().toISOString().slice(0,10)}.pdf`;
    
    await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
  }, [fetchAllForExport, getTypeLabel, getPrixUnitaire, getTotal]);

  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    if (!data.length) return;
    
    const headers = ['Reference', 'Type', 'Produit', 'Quantité', 'Stock préc.', 'Stock actuel', 'Prix unit.', 'Total', 'Observation', 'Date'];
    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };
    const rows = data.map(m => [
      m.reference || '',
      getTypeLabel(m.type_mouvement),
      m.produit_nom || m.nom || '',
      m.quantite,
      m.ancien_stock ?? '',
      m.nouveau_stock ?? '',
      getPrixUnitaire(m),
      getTotal(m),
      m.observation || '',
      m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR') : '',
    ]);

    const totalSum = data.reduce((sum, m) => sum + getTotal(m), 0);
    const totalRow = ['', '', '', '', '', '', '', `TOTAL: ${formatNumberNoSlash(totalSum)} Ar`, '', ''];

    const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')])].join('\n');
    const fileName = `mouvements_stock_${period}_${customDate || new Date().toISOString().slice(0,10)}.csv`;
    
    await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
  }, [fetchAllForExport, getTypeLabel, getPrixUnitaire, getTotal]);

  // ===== 5. USEFFECT POUR SYNCHRONISATION (après les callbacks) =====
  useEffect(() => {
    void loadPage('refresh');
  }, [debouncedSearch, filterType, filterDate, sortOption, period, exportCustomDate]);

  useEffect(() => {
    if (isMounted.current && currentPage > 1) void loadPage('next');
  }, [currentPage]);

  // ===== 6. RETURN =====
  return {
    mouvements,
    loading,
    refreshing,
    setRefreshing,
    totalItems: statsData.total,
    currentPage,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterDate,
    setFilterDate,
    period,
    setPeriod,
    sortOption,
    setSortOption,
    statsData,
    loadMouvements: publicLoadMouvements,
    ITEMS_PER_PAGE,
    selectedIds,
    setSelectedIds,
    handleSelectAll,
    handleSelectOne,
    bulkDelete,
    hasMore,
    handleNextPage,
    handlePrevPage,
    getTypeColor,
    getTypeLabel,
    getTypeIcon,
    exportPeriod,
    setExportPeriod,
    exportCustomDate,
    setExportCustomDate,
    exportToExcel,
    exportToPDF,
    exportToCSV,
  };
}