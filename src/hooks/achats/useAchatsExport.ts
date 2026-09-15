// src/hooks/achats/useAchatsExport.ts
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../../utils/saveFileWithDialog';
import { formatNumberNoSlash, toLocalDateString, getPeriodLabel } from './formatters';
import { getExportPeriodRange } from './exportHelpers';
import type { ExportPeriod } from './types';

interface ExportParams {
  debouncedSearch: string;
  filterFournisseur: string;
}

export const useAchatsExport = ({ debouncedSearch, filterFournisseur }: ExportParams) => {
  const fetchAllForExport = useCallback(async (period: ExportPeriod, customDate: string) => {
    if (!window.api?.achats?.getAll) return [];
    const range = getExportPeriodRange(period, customDate);
    const options = {
      page: 1,
      limit: 100000,
      search: debouncedSearch || undefined,
      fournisseur: filterFournisseur || undefined,
      startDate: range.startDate,
      endDate: range.endDate,
      sort: { field: 'date_achat', direction: 'DESC' },
    };
    const result = await window.api.achats.getAll(options);
    if (result?.success) return result.data || [];
    return [];
  }, [debouncedSearch, filterFournisseur]);

  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    if (!data.length) return { success: true, canceled: false };

    const rows = data.map((achat: any) => ({
      'Référence': achat.reference || '',
      'Fournisseur': achat.fournisseur_nom || '',
      'Date': achat.date_achat ? new Date(achat.date_achat).toLocaleDateString('fr-FR') : '',
      'Mode de paiement': achat.mode_paiement || 'Espèces',
      'Modalité': achat.modalite_paiement || 'Immediat',
      'Frais de livraison': achat.frais_livraison || 0,
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
    XLSX.utils.sheet_add_json(ws, [{
      'Référence': 'TOTAL', 'Fournisseur': '', 'Date': '',
      'Mode de paiement': '', 'Modalité': '', 'Frais de livraison': '',
      'Total HT': '', 'Total TTC': formatNumberNoSlash(totalSum),
      'Statut': '', 'Observation': ''
    }], { origin: -1, skipHeader: true });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const result = await saveFileWithDialog(
      wbout,
      `achats_${period}_${customDate || toLocalDateString()}.xlsx`,
      [{ name: 'Excel', extensions: ['xlsx'] }]
    );
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToPDF = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    if (!data.length) return { success: true, canceled: false };

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

    const columns = [
      'Référence', 'Fournisseur', 'Date', 'Mode de paiement', 'Modalité',
      'Frais de livraison', 'Total HT', 'Total TTC', 'Statut', 'Observation'
    ];

    const rows = data.map((achat: any) => [
      achat.reference || '',
      achat.fournisseur_nom || '',
      achat.date_achat ? new Date(achat.date_achat).toLocaleDateString('fr-FR') : '',
      achat.mode_paiement || 'Espèces',
      achat.modalite_paiement || 'Immediat',
      formatNumberNoSlash(Number(achat.frais_livraison || 0)),
      formatNumberNoSlash(Number(achat.total_ht || 0)),
      formatNumberNoSlash(Number(achat.total_ttc || 0)),
      achat.statut_paiement || 'Non payé',
      achat.observation || '',
    ]);

    const totalSum = data.reduce((sum: number, a: any) => sum + (Number(a.total_ttc) || 0), 0);

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(0, 16, pageWidth, 16);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LifesArt — Achats', margin, 10);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${nowStr}`, pageWidth - margin, 10, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport des achats', margin, 26);

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
        1: { cellWidth: 38 },
        2: { cellWidth: 20 },
        3: { cellWidth: 26 },
        4: { cellWidth: 22 },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 26, halign: 'right' },
        7: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 22 },
        9: { cellWidth: 39, fontSize: 8.5 },
      },
      foot: [[
        { content: '', colSpan: 6 },
        {
          content: `TOTAL : ${formatNumberNoSlash(totalSum)} Ar`,
          colSpan: 3,
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

    const result = await saveFileWithDialog(
      doc.output('arraybuffer'),
      `achats_${period}_${customDate || toLocalDateString()}.pdf`,
      [{ name: 'PDF', extensions: ['pdf'] }]
    );
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    if (!data.length) return { success: true, canceled: false };

    const headers = [
      'Référence', 'Fournisseur', 'Date', 'Mode de paiement', 'Modalité',
      'Frais de livraison', 'Total HT', 'Total TTC', 'Statut', 'Observation'
    ];
    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    };
    const rows = data.map((achat: any) => [
      achat.reference || '',
      achat.fournisseur_nom || '',
      achat.date_achat ? new Date(achat.date_achat).toLocaleDateString('fr-FR') : '',
      achat.mode_paiement || 'Espèces',
      achat.modalite_paiement || 'Immediat',
      achat.frais_livraison || 0,
      achat.total_ht || 0,
      achat.total_ttc || 0,
      achat.statut_paiement || 'Non payé',
      achat.observation || '',
    ]);

    const totalSum = data.reduce((sum: number, a: any) => sum + (Number(a.total_ttc) || 0), 0);
    const totalRow = ['', '', '', '', '', '', '', `TOTAL : ${formatNumberNoSlash(totalSum)} Ar`, '', ''];

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')])
    ].join('\n');

    const result = await saveFileWithDialog(
      csv,
      `achats_${period}_${customDate || toLocalDateString()}.csv`,
      [{ name: 'CSV', extensions: ['csv'] }]
    );
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  return {
    exportToExcel,
    exportToPDF,
    exportToCSV,
    fetchAllForExport,
  };
};