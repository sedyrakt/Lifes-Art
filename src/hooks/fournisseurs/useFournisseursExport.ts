// src/hooks/fournisseurs/useFournisseursExport.ts
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../../utils/saveFileWithDialog';
import { formatNumberNoSlash, toLocalDateString, getPeriodLabel } from './formatters';
import { getExportPeriodRange } from './exportHelpers';
import { SORT_MAP } from './constants';
import type { ExportPeriod, FournisseurFilters } from './types';

interface ExportParams {
  debouncedSearch: string;
  sortOption: keyof typeof SORT_MAP;
  filters: FournisseurFilters;
}

export const useFournisseursExport = ({ debouncedSearch, sortOption, filters }: ExportParams) => {
  const fetchAllForExport = useCallback(async (period: ExportPeriod, customDate: string) => {
    if (!window.api?.fournisseurs?.getAll) return [];
    const range = getExportPeriodRange(period, customDate);
    const sort = SORT_MAP[sortOption] || SORT_MAP['Nom (A-Z)'];
    const params = {
      page: 1,
      limit: 100000,
      search: debouncedSearch || undefined,
      sortBy: sort.field,
      sortOrder: sort.direction,
      email: filters.email || undefined,
      telephone: filters.telephone || undefined,
      dateFrom: range.startDate || undefined,
      dateTo: range.endDate || undefined,
    };
    const result = await window.api.fournisseurs.getAll(params);
    if (result?.success) return result.data || [];
    return [];
  }, [debouncedSearch, sortOption, filters]);

  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const rows = data.length
      ? data.map((f: any) => ({
          'Nom': f.nom || '',
          'Contact': f.contact || '',
          'Téléphone': f.telephone || '',
          'Email': f.email || '',
          'Adresse': f.adresse || '',
        }))
      : [{ 'Nom': 'Aucun fournisseur', 'Contact': '', 'Téléphone': '', 'Email': '', 'Adresse': '' }];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fournisseurs');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `fournisseurs_${period}_${customDate || toLocalDateString()}.xlsx`;
    const result = await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
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

    const columns = ['Nom', 'Contact', 'Téléphone', 'Email', 'Adresse'];

    const rows = data.length
      ? data.map((f: any) => [
          f.nom || '',
          f.contact || '',
          f.telephone || '',
          f.email || '',
          f.adresse || '',
        ])
      : [['Aucun fournisseur', '', '', '', '']];

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(0, 16, pageWidth, 16);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LifesArt — Fournisseurs', margin, 10);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${nowStr}`, pageWidth - margin, 10, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport des fournisseurs', margin, 26);

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
        0: { cellWidth: 60 },
        1: { cellWidth: 50 },
        2: { cellWidth: 38 },
        3: { cellWidth: 60, fontSize: 8.5 },
        4: { cellWidth: 61, fontSize: 8.5 },
      },
      foot: [[
        { content: '', colSpan: 1 },
        {
          content: `TOTAL : ${data.length} fournisseur${data.length > 1 ? 's' : ''}`,
          colSpan: 4,
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
    const fileName = `fournisseurs_${period}_${customDate || toLocalDateString()}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const headers = ['Nom', 'Contact', 'Téléphone', 'Email', 'Adresse'];
    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    };
    const rows = data.length
      ? data.map((f: any) => [
          f.nom || '',
          f.contact || '',
          f.telephone || '',
          f.email || '',
          f.adresse || '',
        ])
      : [['Aucun fournisseur', '', '', '', '']];

    const totalRow = ['', '', '', '', `TOTAL : ${data.length} fournisseur${data.length > 1 ? 's' : ''}`];
    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')])
    ].join('\n');

    const fileName = `fournisseurs_${period}_${customDate || toLocalDateString()}.csv`;
    const result = await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
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