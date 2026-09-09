// src/hooks/useVentesData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../utils/saveFileWithDialog';

export interface Vente {
  id: number;
  reference: string | null;
  client_id: number | null;
  client_nom: string;
  date_devis?: string;
  date_facture?: string;
  total_ht: number;
  total_ttc: number;
  statut: string;
  statut_paiement?: string;
  montant_paye?: number;
  montant_restant?: number;
  observation?: string;
  created_at: string;
}

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';
const ITEMS_PER_PAGE = 10;

const formatNumberNoSlash = (value: number) => {
  return value.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
};

const parseTvaRate = (value: any): number => {
  return (value !== undefined && value !== null && value !== '')
    ? Number(value)
    : 0;
};

export const useVentesData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [devisList, setDevisList] = useState<Vente[]>([]);
  const [factures, setFactures] = useState<Vente[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalDevis, setTotalDevis] = useState(0);
  const [totalFactures, setTotalFactures] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [viewItem, setViewItem] = useState<any>(null);
  const [viewDetails, setViewDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detteStats, setDetteStats] = useState({ total_dette: 0, nb_commandes_non_payees: 0 });
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadReferences = useCallback(async () => {
    try {
      const [clientsResult, produitsResult] = await Promise.all([
        window.api.clients.getAll({ limit: 1000 }),
        window.api.products.getAll({ limit: 1000 }),
      ]);
      if (clientsResult?.success && isMounted.current) setClients(clientsResult.data || []);
      if (produitsResult?.success && isMounted.current) setProduits(produitsResult.data || []);
    } catch (err) {
      console.error('Erreur chargement références:', err);
    }
  }, []);

  const loadDevis = useCallback(async () => {
    try {
      const result = await window.api.ventes.getDevis({ search: searchTerm, page: currentPage, limit: ITEMS_PER_PAGE });
      if (result?.success && isMounted.current) {
        setDevisList(result.data || []);
        setTotalDevis(Number(result.pagination?.total) || result.data?.length || 0);
        const total = Number(result.pagination?.total) || result.data?.length || 0;
        const pages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
        setTotalPages(pages);
        if (currentPage > pages) setCurrentPage(1);
      }
    } catch (err) { console.error('Erreur chargement devis:', err); }
  }, [searchTerm, currentPage]);

  const loadFactures = useCallback(async () => {
    try {
      const result = await window.api.ventes.getFactures({ search: searchTerm, page: currentPage, limit: ITEMS_PER_PAGE });
      if (result?.success && isMounted.current) {
        setFactures(result.data || []);
        setTotalFactures(Number(result.pagination?.total) || result.data?.length || 0);
        const total = Number(result.pagination?.total) || result.data?.length || 0;
        const pages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
        setTotalPages(pages);
        if (currentPage > pages) setCurrentPage(1);
      }
    } catch (err) { console.error('Erreur chargement factures:', err); }
  }, [searchTerm, currentPage]);

  const getDetteStats = useCallback(async () => {
    try {
      const result = await window.api.orders.getDetteStats();
      if (result?.success && isMounted.current) {
        setDetteStats({ total_dette: Number(result.data?.total_dette || 0), nb_commandes_non_payees: Number(result.data?.nb_commandes_non_payees || 0) });
      }
      return result;
    } catch (err) { console.error('❌ Erreur getDetteStats:', err); return { success: false, error: err?.message || 'Erreur dette stats' }; }
  }, []);

  const getDevisDetails = useCallback(async (item: any) => {
    setLoadingDetails(true);
    try {
      const result = await window.api.ventes.getDevisDetails(item.id);
      if (result?.success) {
        setViewItem(result.data.devis || item);
        const details = Array.isArray(result.data?.details) ? result.data.details : [];
        
        const enrichedDetails = details.map((detail: any) => {
          let rate = parseTvaRate(detail.tva_rate);
          if (rate === 0 && detail.produit_id) {
            const product = produits.find((p: any) => p.id === detail.produit_id);
            if (product && product.tva_rate !== undefined && product.tva_rate !== null) {
               rate = Number(product.tva_rate);
            }
          }
          return { ...detail, tva_rate: rate };
        });
        setViewDetails(enrichedDetails);
      } else { setViewItem(item); setViewDetails([]); }
    } catch (err) { setViewItem(item); setViewDetails([]); }
    finally { setLoadingDetails(false); }
  }, [produits]);

  const getFactureDetails = useCallback(async (item: any) => {
    setLoadingDetails(true);
    try {
      const result = await window.api.ventes.getFactureDetails(item.id);
      if (result?.success) {
        setViewItem(result.data.facture || item);
        const details = Array.isArray(result.data?.details) ? result.data.details : [];
        
        const enrichedDetails = details.map((detail: any) => {
          let rate = parseTvaRate(detail.tva_rate);
          if (rate === 0 && detail.produit_id) {
            const product = produits.find((p: any) => p.id === detail.produit_id);
            if (product && product.tva_rate !== undefined && product.tva_rate !== null) {
               rate = Number(product.tva_rate);
            }
          }
          return { ...detail, tva_rate: rate };
        });
        setViewDetails(enrichedDetails);
      } else { setViewItem(item); setViewDetails([]); }
    } catch (err) { setViewItem(item); setViewDetails([]); }
    finally { setLoadingDetails(false); }
  }, [produits]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadReferences(), loadDevis(), loadFactures(), getDetteStats()]);
      if (isMounted.current) setLoading(false);
    };
    loadAll();
  }, [loadReferences, loadDevis, loadFactures, getDetteStats]);

  useEffect(() => {
    if (!searchTerm) return;
    const timer = setTimeout(() => { setCurrentPage(1); loadDevis(); loadFactures(); }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, loadDevis, loadFactures]);

  useEffect(() => {
    if (!window.api?.ventes?.onChanged) return;
    const unsubscribe = window.api.ventes.onChanged(() => {
      if (isMounted.current) { loadDevis(); loadFactures(); getDetteStats(); }
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [loadDevis, loadFactures, getDetteStats]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadReferences(), loadDevis(), loadFactures(), getDetteStats()]);
    if (isMounted.current) setRefreshing(false);
  }, [loadReferences, loadDevis, loadFactures, getDetteStats]);

  const createDevis = useCallback(async (data: any) => { const result = await window.api.ventes.createDevis(data); if (result?.success) { await loadDevis(); await getDetteStats(); return result; } return result; }, [loadDevis, getDetteStats]);
  const createFacture = useCallback(async (data: any) => { const result = await window.api.ventes.createFacture(data); if (result?.success) { await loadFactures(); await getDetteStats(); return result; } return result; }, [loadFactures, getDetteStats]);
  const convertDevisToFacture = useCallback(async (devisId: number) => { const result = await window.api.ventes.convertDevisToFacture(devisId); if (result?.success) { await Promise.all([loadDevis(), loadFactures(), getDetteStats()]); return result; } return result; }, [loadDevis, loadFactures, getDetteStats]);
  const deleteDevis = useCallback(async (id: number) => { const result = await window.api.ventes.deleteDevis(id); if (result?.success) { await loadDevis(); await getDetteStats(); return result; } return result; }, [loadDevis, getDetteStats]);
  const deleteFacture = useCallback(async (id: number) => { try { const details = await window.api.ventes.getFactureDetails(id); if (details?.success && Array.isArray(details.data?.details)) { for (const detail of details.data.details) await window.api.products.updateStock(detail.produit_id, detail.quantite); } } catch (err) { console.error('Erreur restauration stock:', err); } const result = await window.api.ventes.deleteFacture(id); if (result?.success) { await loadFactures(); await getDetteStats(); return result; } return result; }, [loadFactures, getDetteStats]);

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
    const range = getExportPeriodRange(period, customDate);
    const options = {
      page: 1,
      limit: 100000,
      search: searchTerm,
      startDate: range.startDate,
      endDate: range.endDate,
      sort: { field: 'date_commande', direction: 'DESC' }
    };
    const [devisResult, facturesResult] = await Promise.all([
      window.api.ventes.getDevis(options),
      window.api.ventes.getFactures(options)
    ]);
    const devis = devisResult?.success ? devisResult.data || [] : [];
    const factures = facturesResult?.success ? facturesResult.data || [] : [];
    return { devis, factures };
  }, [searchTerm, getExportPeriodRange]);

  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const { devis, factures } = await fetchAllForExport(period, customDate);
    if (!devis.length && !factures.length) {
      const rows = [{ 'Type': 'Aucune vente', 'Référence': '', 'Client': '', 'Date': '', 'Total HT': 0, 'Total TTC': 0, 'Statut': '' }];
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ventes');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileName = `ventes_${period}_${customDate || new Date().toISOString().slice(0,10)}.xlsx`;
      return await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
    }

    const rows = [
      ...devis.map((item: any) => ({
        'Type': 'Devis', 'Référence': item.reference || '', 'Client': item.client_nom || '',
        'Date': item.date_devis ? new Date(item.date_devis).toLocaleDateString('fr-FR') : '',
        'Total HT': item.total_ht || 0, 'Total TTC': item.total_ttc || 0, 'Statut': item.statut_paiement || 'Non payé',
      })),
      ...factures.map((item: any) => ({
        'Type': 'Facture', 'Référence': item.reference || '', 'Client': item.client_nom || '',
        'Date': item.date_facture ? new Date(item.date_facture).toLocaleDateString('fr-FR') : '',
        'Total HT': item.total_ht || 0, 'Total TTC': item.total_ttc || 0, 'Statut': item.statut_paiement || 'Non payé',
      }))
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventes');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const totalCA = devis.reduce((s: number, d: any) => s + Number(d.total_ttc || 0), 0) + factures.reduce((s: number, f: any) => s + Number(f.total_ttc || 0), 0);
    XLSX.utils.sheet_add_json(ws, [{ 'Type': 'TOTAL', 'Référence': '', 'Client': '', 'Date': '', 'Total HT': '', 'Total TTC': formatNumberNoSlash(totalCA), 'Statut': '' }], { origin: -1, skipHeader: true });
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `ventes_${period}_${customDate || new Date().toISOString().slice(0,10)}.xlsx`;
    const result = await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le fichier Excel.');
    }
    return result;
  }, [fetchAllForExport]);

  const exportToPDF = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const { devis, factures } = await fetchAllForExport(period, customDate);
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('LifesArt - Ventes', 14, 10);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text(`Rapport des ventes - ${period}${period === 'custom' ? ' (' + (customDate || new Date().toISOString().split('T')[0]) + ')' : ''}`, 14, 28);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

    const columns = ['Type', 'Référence', 'Client', 'Date', 'Total HT', 'Total TTC', 'Statut'];
    const rows = [
      ...devis.map((item: any) => ['Devis', item.reference || '', item.client_nom || '', item.date_devis ? new Date(item.date_devis).toLocaleDateString('fr-FR') : '', item.total_ht || 0, item.total_ttc || 0, item.statut_paiement || 'Non payé']),
      ...factures.map((item: any) => ['Facture', item.reference || '', item.client_nom || '', item.date_facture ? new Date(item.date_facture).toLocaleDateString('fr-FR') : '', item.total_ht || 0, item.total_ttc || 0, item.statut_paiement || 'Non payé'])
    ];
    if (!rows.length) rows.push(['Aucune vente', '', '', '', 0, 0, '']);

    const totalCA = devis.reduce((s: number, d: any) => s + Number(d.total_ttc || 0), 0) + factures.reduce((s: number, f: any) => s + Number(f.total_ttc || 0), 0);
    autoTable(doc, {
      head: [columns], body: rows, startY: 42,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid', showHead: 'firstPage',
      didDrawPage: (data) => { const pageNumber = doc.getNumberOfPages(); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(`Page ${pageNumber}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10); },
      showFoot: 'lastPage',
      foot: [['', '', '', '', `TOTAL: ${formatNumberNoSlash(totalCA)} Ar`, '', '']],
      footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
    });
    const pdfArrayBuffer = doc.output('arraybuffer');
    const fileName = `ventes_${period}_${customDate || new Date().toISOString().slice(0,10)}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Impossible d\'enregistrer le PDF.'); }
    return result;
  }, [fetchAllForExport]);

  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const { devis, factures } = await fetchAllForExport(period, customDate);
    const headers = ['Type', 'Référence', 'Client', 'Date', 'Total HT', 'Total TTC', 'Statut'];
    const escapeCSV = (value: any) => { if (value === undefined || value === null) return '""'; return `"${String(value).replace(/"/g, '""')}"`; };
    const rows = [
      ...devis.map((item: any) => ['Devis', item.reference || '', item.client_nom || '', item.date_devis ? new Date(item.date_devis).toLocaleDateString('fr-FR') : '', item.total_ht || 0, item.total_ttc || 0, item.statut_paiement || 'Non payé']),
      ...factures.map((item: any) => ['Facture', item.reference || '', item.client_nom || '', item.date_facture ? new Date(item.date_facture).toLocaleDateString('fr-FR') : '', item.total_ht || 0, item.total_ttc || 0, item.statut_paiement || 'Non payé'])
    ];
    if (!rows.length) rows.push(['Aucune vente', '', '', '', 0, 0, '']);
    const totalCA = devis.reduce((s: number, d: any) => s + Number(d.total_ttc || 0), 0) + factures.reduce((s: number, f: any) => s + Number(f.total_ttc || 0), 0);
    const totalRow = ['', '', '', '', `TOTAL: ${formatNumberNoSlash(totalCA)} Ar`, '', ''];
    const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')])].join('\n');
    const fileName = `ventes_${period}_${customDate || new Date().toISOString().slice(0,10)}.csv`;
    const result = await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Impossible d\'enregistrer le CSV.'); }
    return result;
  }, [fetchAllForExport]);

  return {
    devisList, factures, clients, produits, loading, refreshing,
    searchTerm, setSearchTerm, totalDevis, totalFactures, ITEMS_PER_PAGE,
    currentPage, setCurrentPage, totalPages,
    loadReferences, loadDevis, loadFactures, refresh,
    createDevis, createFacture, convertDevisToFacture, deleteDevis, deleteFacture,
    getDetteStats, detteStats,
    viewItem, setViewItem, viewDetails, setViewDetails, loadingDetails, setLoadingDetails,
    getDevisDetails, getFactureDetails,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  };
};

export default useVentesData;