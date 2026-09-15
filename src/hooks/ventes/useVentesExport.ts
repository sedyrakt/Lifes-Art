// src/hooks/ventes/useVentesExport.ts
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../../utils/saveFileWithDialog';
import { formatNumberNoSlash, toLocalDateString, getPeriodLabel } from './formatters';
import { getExportPeriodRange } from './exportHelpers';
import type { ExportPeriod } from './types';

interface ExportParams {
  searchTerm: string;
}

export const useVentesExport = ({ searchTerm }: ExportParams) => {
  const fetchAllForExport = useCallback(async (period: ExportPeriod, customDate: string) => {
    const range = getExportPeriodRange(period, customDate);
    const options = {
      page: 1,
      limit: 100000,
      search: searchTerm,
      startDate: range.startDate,
      endDate: range.endDate,
      sort: { field: 'date_commande', direction: 'DESC' },
    };
    const [devisResult, facturesResult] = await Promise.all([
      window.api.ventes.getDevis(options),
      window.api.ventes.getFactures(options),
    ]);
    const devis = devisResult?.success ? devisResult.data || [] : [];
    const factures = facturesResult?.success ? facturesResult.data || [] : [];
    return { devis, factures };
  }, [searchTerm]);

  // ⭐ Export Excel
  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const { devis, factures } = await fetchAllForExport(period, customDate);
    if (!devis.length && !factures.length) {
      const rows = [{ 'Type': 'Aucune vente', 'Référence': '', 'Client': '', 'Date': '', 'Total HT': 0, 'Total TTC': 0, 'Statut': '' }];
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ventes');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileName = `ventes_${period}_${customDate || toLocalDateString()}.xlsx`;
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
      })),
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventes');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const totalCA = devis.reduce((s: number, d: any) => s + Number(d.total_ttc || 0), 0)
      + factures.reduce((s: number, f: any) => s + Number(f.total_ttc || 0), 0);

    XLSX.utils.sheet_add_json(ws, [{
      'Type': 'TOTAL', 'Référence': '', 'Client': '', 'Date': '',
      'Total HT': '', 'Total TTC': formatNumberNoSlash(totalCA), 'Statut': '',
    }], { origin: -1, skipHeader: true });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `ventes_${period}_${customDate || toLocalDateString()}.xlsx`;
    const result = await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le fichier Excel.');
    }
    return result;
  }, [fetchAllForExport]);

  // ⭐⭐⭐ PDF — Border mainty mitovy amin'ny Dashboard ⭐⭐⭐
  const exportToPDF = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const { devis, factures } = await fetchAllForExport(period, customDate);

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth  = doc.internal.pageSize.getWidth();
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

    const columns = ['Type', 'Référence', 'Client', 'Date', 'Total HT', 'Total TTC', 'Statut'];

    const rows = [
      ...devis.map((item: any) => [
        'Devis',
        item.reference || '',
        item.client_nom || '',
        item.date_devis ? new Date(item.date_devis).toLocaleDateString('fr-FR') : '',
        formatNumberNoSlash(Number(item.total_ht || 0)),
        formatNumberNoSlash(Number(item.total_ttc || 0)),
        item.statut_paiement || 'Non payé',
      ]),
      ...factures.map((item: any) => [
        'Facture',
        item.reference || '',
        item.client_nom || '',
        item.date_facture ? new Date(item.date_facture).toLocaleDateString('fr-FR') : '',
        formatNumberNoSlash(Number(item.total_ht || 0)),
        formatNumberNoSlash(Number(item.total_ttc || 0)),
        item.statut_paiement || 'Non payé',
      ]),
    ];
    if (!rows.length) rows.push(['Aucune vente', '', '', '', '0', '0', '']);

    const totalCA = devis.reduce((s: number, d: any) => s + Number(d.total_ttc || 0), 0)
      + factures.reduce((s: number, f: any) => s + Number(f.total_ttc || 0), 0);

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(0, 16, pageWidth, 16);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LifesArt — Ventes', margin, 10);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${nowStr}`, pageWidth - margin, 10, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport des ventes', margin, 26);

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
        0: { cellWidth: 26 },
        1: { cellWidth: 34 },
        2: { cellWidth: 55 },
        3: { cellWidth: 28 },
        4: { cellWidth: 32, halign: 'right' },
        5: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 30 },
      },
      foot: [[
        { content: '', colSpan: 4 },
        {
          content: `TOTAL : ${formatNumberNoSlash(totalCA)} Ar`,
          colSpan: 2,
          styles: { halign: 'right' as const, fontStyle: 'bold' as const, fontSize: 9 },
        },
        { content: '' },
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
    const fileName = `ventes_${period}_${customDate || toLocalDateString()}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le PDF.');
    }
    return result;
  }, [fetchAllForExport]);

  // ⭐ Export CSV
  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const { devis, factures } = await fetchAllForExport(period, customDate);
    const headers = ['Type', 'Référence', 'Client', 'Date', 'Total HT', 'Total TTC', 'Statut'];
    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    };
    const rows = [
      ...devis.map((item: any) => [
        'Devis', item.reference || '', item.client_nom || '',
        item.date_devis ? new Date(item.date_devis).toLocaleDateString('fr-FR') : '',
        item.total_ht || 0, item.total_ttc || 0, item.statut_paiement || 'Non payé',
      ]),
      ...factures.map((item: any) => [
        'Facture', item.reference || '', item.client_nom || '',
        item.date_facture ? new Date(item.date_facture).toLocaleDateString('fr-FR') : '',
        item.total_ht || 0, item.total_ttc || 0, item.statut_paiement || 'Non payé',
      ]),
    ];
    if (!rows.length) rows.push(['Aucune vente', '', '', '', 0, 0, '']);

    const totalCA = devis.reduce((s: number, d: any) => s + Number(d.total_ttc || 0), 0)
      + factures.reduce((s: number, f: any) => s + Number(f.total_ttc || 0), 0);
    const totalRow = ['', '', '', '', `TOTAL : ${formatNumberNoSlash(totalCA)} Ar`, '', ''];

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')]),
    ].join('\n');

    const fileName = `ventes_${period}_${customDate || toLocalDateString()}.csv`;
    const result = await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le CSV.');
    }
    return result;
  }, [fetchAllForExport]);

  return {
    exportToExcel,
    exportToPDF,
    exportToCSV,
    fetchAllForExport,
  };
};