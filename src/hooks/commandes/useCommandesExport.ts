// src/hooks/commandes/useCommandesExport.ts
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../../utils/saveFileWithDialog';
import { formatNumberNoSlash, toLocalDateString, getPeriodLabel } from './formatters';
import { getExportPeriodRange } from './exportHelpers';
import { normalizeFilterStatut } from './normalizers';
import type { ExportPeriod } from './types';

interface ExportParams {
  debouncedSearch: string;
  filterStatut: string;
  filterMontantMin: string;
  filterMontantMax: string;
  filterModePaiement: string;
}

export const useCommandesExport = ({
  debouncedSearch,
  filterStatut,
  filterMontantMin,
  filterMontantMax,
  filterModePaiement,
}: ExportParams) => {
  const fetchAllForExport = useCallback(async (period: ExportPeriod, customDate: string) => {
    if (!window.api?.orders?.getAll) return [];
    const range = getExportPeriodRange(period, customDate);
    const result = await window.api.orders.getAll({
      page: 1,
      limit: 100000,
      search: debouncedSearch,
      statut: normalizeFilterStatut(filterStatut),
      sort: { field: 'date_commande', direction: 'DESC' },
      startDate: range.startDate,
      endDate: range.endDate,
      montantMin: filterMontantMin || undefined,
      montantMax: filterMontantMax || undefined,
      modePaiement: filterModePaiement || undefined,
    });
    if (result?.success) return result.data || [];
    return [];
  }, [debouncedSearch, filterStatut, filterMontantMin, filterMontantMax, filterModePaiement]);

  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const rows = data.length ? data.map((cmd: any) => ({
      'N° Commande': cmd.numero || `CMD-${String(cmd.id).padStart(6, '0')}`,
      'Client': cmd.client_nom || '',
      'Date': cmd.date_commande ? new Date(cmd.date_commande).toLocaleDateString('fr-FR') : '',
      'Mode paiement': cmd.mode_paiement || 'Espèces',
      'Modalité': cmd.modalite_paiement || 'Immediat',
      'Frais livraison': cmd.frais_livraison || 0,
      'Total HT': cmd.total_ht || 0,
      'Total TTC': cmd.total_ttc || 0,
      'Statut': cmd.statut_paiement || 'Non payé',
      'Montant payé': cmd.montant_paye || 0,
      'Montant restant': cmd.montant_restant || 0,
    })) : [{
      'N° Commande': 'Aucune commande', 'Client': '', 'Date': '', 'Mode paiement': '',
      'Modalité': '', 'Frais livraison': 0, 'Total HT': 0, 'Total TTC': 0, 'Statut': '',
      'Montant payé': 0, 'Montant restant': 0,
    }];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commandes');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const totalCA = data.reduce((sum: number, cmd: any) => sum + (Number(cmd.total_ttc) || 0), 0);
    XLSX.utils.sheet_add_json(ws, [{
      'N° Commande': 'TOTAL', 'Client': '', 'Date': '', 'Mode paiement': '',
      'Modalité': '', 'Frais livraison': '', 'Total HT': '',
      'Total TTC': formatNumberNoSlash(totalCA), 'Statut': '',
      'Montant payé': '', 'Montant restant': '',
    }], { origin: -1, skipHeader: true });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const result = await saveFileWithDialog(
      wbout,
      `commandes_${period}_${customDate || toLocalDateString()}.xlsx`,
      [{ name: 'Excel', extensions: ['xlsx'] }]
    );
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToPDF = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);

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
      'N° Commande', 'Client', 'Date', 'Mode paiement', 'Modalité',
      'Frais livraison', 'Total HT', 'Total TTC', 'Statut', 'Montant payé', 'Montant restant',
    ];

    const rows = data.length
      ? data.map((cmd: any) => [
          cmd.numero || `CMD-${String(cmd.id).padStart(6, '0')}`,
          cmd.client_nom || '',
          cmd.date_commande ? new Date(cmd.date_commande).toLocaleDateString('fr-FR') : '',
          cmd.mode_paiement || 'Espèces',
          cmd.modalite_paiement || 'Immediat',
          formatNumberNoSlash(Number(cmd.frais_livraison || 0)),
          formatNumberNoSlash(Number(cmd.total_ht || 0)),
          formatNumberNoSlash(Number(cmd.total_ttc || 0)),
          cmd.statut_paiement || 'Non payé',
          formatNumberNoSlash(Number(cmd.montant_paye || 0)),
          formatNumberNoSlash(Number(cmd.montant_restant || 0)),
        ])
      : [['Aucune commande', '', '', '', '', '', '', '', '', '', '']];

    const totalCA      = data.reduce((sum: number, cmd: any) => sum + (Number(cmd.total_ttc) || 0), 0);
    const totalPaye    = data.reduce((sum: number, cmd: any) => sum + (Number(cmd.montant_paye) || 0), 0);
    const totalRestant = data.reduce((sum: number, cmd: any) => sum + (Number(cmd.montant_restant) || 0), 0);

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(0, 16, pageWidth, 16);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LifesArt — Commandes', margin, 10);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${nowStr}`, pageWidth - margin, 10, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport des commandes', margin, 26);

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
        0:  { cellWidth: 25 },
        1:  { cellWidth: 27 },
        2:  { cellWidth: 21 },
        3:  { cellWidth: 25 },
        4:  { cellWidth: 23 },
        5:  { cellWidth: 19, halign: 'right' },
        6:  { cellWidth: 25, halign: 'right' },
        7:  { cellWidth: 27, halign: 'right', fontStyle: 'bold' },
        8:  { cellWidth: 23 },
        9:  { cellWidth: 27, halign: 'right' },
        10: { cellWidth: 27, halign: 'right' },
      },
      foot: [[
        { content: '', colSpan: 6 },
        {
          content: `TOTAL : ${formatNumberNoSlash(totalCA)} Ar`,
          colSpan: 3,
          styles: { halign: 'right' as const, fontStyle: 'bold' as const },
        },
        { content: formatNumberNoSlash(totalPaye) },
        { content: formatNumberNoSlash(totalRestant) },
      ]],
      footStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9.5,
        halign: 'right',
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
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
    const result = await saveFileWithDialog(
      pdfArrayBuffer,
      `commandes_${period}_${customDate || toLocalDateString()}.pdf`,
      [{ name: 'PDF', extensions: ['pdf'] }]
    );
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const headers = ['N° Commande', 'Client', 'Date', 'Mode paiement', 'Modalité',
      'Frais livraison', 'Total HT', 'Total TTC', 'Statut', 'Montant payé', 'Montant restant'];

    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    };

    const rows = data.length ? data.map((cmd: any) => [
      cmd.numero || `CMD-${String(cmd.id).padStart(6, '0')}`,
      cmd.client_nom || '',
      cmd.date_commande ? new Date(cmd.date_commande).toLocaleDateString('fr-FR') : '',
      cmd.mode_paiement || 'Espèces',
      cmd.modalite_paiement || 'Immediat',
      cmd.frais_livraison || 0,
      cmd.total_ht || 0,
      cmd.total_ttc || 0,
      cmd.statut_paiement || 'Non payé',
      cmd.montant_paye || 0,
      cmd.montant_restant || 0,
    ]) : [['Aucune commande', '', '', '', '', 0, 0, 0, '', 0, 0]];

    const totalCA = data.reduce((sum: number, cmd: any) => sum + (Number(cmd.total_ttc) || 0), 0);
    const totalRow = ['', '', '', '', '', '', '', `TOTAL: ${formatNumberNoSlash(totalCA)} Ar`, '', '', ''];

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')]),
    ].join('\n');

    const result = await saveFileWithDialog(
      csv,
      `commandes_${period}_${customDate || toLocalDateString()}.csv`,
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