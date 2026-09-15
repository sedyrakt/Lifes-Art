// src/hooks/mouvements/useMouvementsExport.ts
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../../utils/saveFileWithDialog';
import { formatNumberNoSlash } from './formatters';
import { getExportPeriodRange, type ExportPeriod } from './exportHelpers';
import { VALID_TYPES } from './constants';
import { useMouvementsHelpers } from './useMouvementsHelpers';

interface ExportParams {
  debouncedSearch: string;
  filterType: string;
}

export const useMouvementsExport = ({ debouncedSearch, filterType }: ExportParams) => {
  const { getTypeLabel, getPrixUnitaire, getTotal } = useMouvementsHelpers();

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
      sortOrder: 'DESC',
    };
    const result = await window.api.stock.getMouvements(request);
    if (result?.success && Array.isArray(result.data)) return result.data;
    return [];
  }, [debouncedSearch, filterType]);

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
    const fileName = `mouvements_stock_${period}_${customDate || new Date().toISOString().slice(0, 10)}.xlsx`;

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
    const fileName = `mouvements_stock_${period}_${customDate || new Date().toISOString().slice(0, 10)}.pdf`;

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
    const fileName = `mouvements_stock_${period}_${customDate || new Date().toISOString().slice(0, 10)}.csv`;

    await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
  }, [fetchAllForExport, getTypeLabel, getPrixUnitaire, getTotal]);

  return {
    exportToExcel,
    exportToPDF,
    exportToCSV,
    fetchAllForExport,
  };
};