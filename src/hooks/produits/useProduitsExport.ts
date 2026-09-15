// src/hooks/produits/useProduitsExport.ts
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../../utils/saveFileWithDialog';
import { formatNumberNoSlash, toLocalDateString, getPeriodLabel } from './formatters';
import { getExportPeriodRange } from './exportHelpers';
import { SORT_MAP } from './constants';
import type { ExportPeriod, ProduitFilters, SortOption } from './types';

interface ExportParams {
  debouncedSearch: string;
  sortOption: SortOption;
  filters: ProduitFilters;
}

export const useProduitsExport = ({ debouncedSearch, sortOption, filters }: ExportParams) => {
  const fetchAllForExport = useCallback(async (period: ExportPeriod, customDate: string) => {
    if (!window.api?.products?.getAll) return [];
    const range = getExportPeriodRange(period, customDate);
    const sort = SORT_MAP[sortOption] || SORT_MAP['Nom (A-Z)'];
    const params = {
      page: 1,
      limit: 100000,
      search: debouncedSearch || undefined,
      sortBy: sort.field,
      sortOrder: sort.direction,
      status: filters?.filterStatus || undefined,
      categorieId: filters?.filterCategorie || undefined,
      prixMin: filters?.prixMin || undefined,
      prixMax: filters?.prixMax || undefined,
      dateFrom: range.startDate,
      dateTo: range.endDate,
    };
    const result = await window.api.products.getAll(params);
    if (result?.success) return result.data || [];
    return [];
  }, [debouncedSearch, sortOption, filters]);

  // ⭐ Export Excel
  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const rows = data.length
      ? data.map((p: any) => ({
          'Code': p.code || '',
          'Nom': p.nom || '',
          'Description': p.description || '',
          'Catégorie': p.categorie_nom || '',
          'Fournisseur': p.fournisseur_nom || '',
          'Prix achat': p.prix_achat || 0,
          'Prix vente': p.prix_vente || 0,
          'Stock': p.quantite_stock || 0,
          'Unité': p.unite || '',
          'TVA': p.tva_rate || 0,
          'Statut': p.status || '',
        }))
      : [{ 'Code': 'Aucun produit', 'Nom': '', 'Description': '', 'Catégorie': '', 'Fournisseur': '', 'Prix achat': 0, 'Prix vente': 0, 'Stock': 0, 'Unité': '', 'TVA': 0, 'Statut': '' }];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produits');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const totalValeur = data.reduce((sum: number, p: any) =>
      sum + (Number(p.quantite_stock || 0) * Number(p.prix_vente || 0)), 0);
    XLSX.utils.sheet_add_json(ws, [{
      'Code': 'TOTAL', 'Nom': '', 'Description': '', 'Catégorie': '', 'Fournisseur': '',
      'Prix achat': '', 'Prix vente': formatNumberNoSlash(totalValeur), 'Stock': '',
      'Unité': '', 'TVA': '', 'Statut': '',
    }], { origin: -1, skipHeader: true });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `produits_${period}_${customDate || toLocalDateString()}.xlsx`;
    const result = await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  // ⭐⭐⭐ PDF — Border mainty mitovy amin'ny Dashboard ⭐⭐⭐
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

    const columns = ['Code', 'Nom', 'Catégorie', 'Prix achat', 'Prix vente', 'Stock', 'Unité', 'TVA', 'Statut'];

    const rows = data.length
      ? data.map((p: any) => [
          p.code || '',
          p.nom || '',
          p.categorie_nom || '',
          formatNumberNoSlash(Number(p.prix_achat || 0)),
          formatNumberNoSlash(Number(p.prix_vente || 0)),
          formatNumberNoSlash(Number(p.quantite_stock || 0)),
          p.unite || '',
          p.tva_rate != null ? `${Number(p.tva_rate)}%` : '0%',
          p.status || '',
        ])
      : [['Aucun produit', '', '', '0', '0', '0', '', '0%', '']];

    const totalValeur = data.reduce((sum: number, p: any) =>
      sum + (Number(p.quantite_stock || 0) * Number(p.prix_vente || 0)), 0);

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(0, 16, pageWidth, 16);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LifesArt — Produits', margin, 10);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${nowStr}`, pageWidth - margin, 10, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport des produits', margin, 26);

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
        0:  { cellWidth: 28 },
        1:  { cellWidth: 45 },
        2:  { cellWidth: 32 },
        3:  { cellWidth: 28, halign: 'right' },
        4:  { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        5:  { cellWidth: 22, halign: 'right' },
        6:  { cellWidth: 22 },
        7:  { cellWidth: 24, halign: 'right' },
        8:  { cellWidth: 40 },
      },
      foot: [[
        { content: '', colSpan: 4 },
        {
          content: `VALEUR STOCK : ${formatNumberNoSlash(totalValeur)} Ar`,
          colSpan: 2,
          styles: { halign: 'right' as const, fontStyle: 'bold' as const, fontSize: 9 },
        },
        { content: '', colSpan: 3 },
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
    const fileName = `produits_${period}_${customDate || toLocalDateString()}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  // ⭐ Export CSV
  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const headers = ['Code', 'Nom', 'Catégorie', 'Prix achat', 'Prix vente', 'Stock', 'Unité', 'TVA', 'Statut'];
    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    };
    const rows = data.length
      ? data.map((p: any) => [
          p.code || '', p.nom || '', p.categorie_nom || '',
          p.prix_achat || 0, p.prix_vente || 0, p.quantite_stock || 0,
          p.unite || '', p.tva_rate || 0, p.status || '',
        ])
      : [['Aucun produit', '', '', 0, 0, 0, '', 0, '']];

    const totalValeur = data.reduce((sum: number, p: any) =>
      sum + (Number(p.quantite_stock || 0) * Number(p.prix_vente || 0)), 0);
    const totalRow = ['', '', '', '', `VALEUR STOCK: ${formatNumberNoSlash(totalValeur)} Ar`, '', '', '', ''];

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')]),
    ].join('\n');

    const fileName = `produits_${period}_${customDate || toLocalDateString()}.csv`;
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