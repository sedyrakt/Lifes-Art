// src/hooks/employes/useEmployesExport.ts
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../../utils/saveFileWithDialog';
import { formatNumberNoSlash, getStatusLabel, toLocalDateString } from './formatters';
import { getExportRange, getPeriodLabel } from './exportHelpers';
import type { ExportPeriod } from './types';

interface ExportParams {
  debouncedSearch: string;
  filterStatus: string;
  sortOption: string;
}

export const useEmployesExport = ({ debouncedSearch, filterStatus, sortOption }: ExportParams) => {
  // ⭐ Fetch employés filtrés par date (ho an'ny export)
  const getEmployesForExport = useCallback(async (period: ExportPeriod, customDate: string) => {
    if (!window.api?.employes?.getAll) return [];

    const result = await window.api.employes.getAll({
      page: 1,
      limit: 100000,
      search: debouncedSearch,
      status: filterStatus,
      sort: sortOption,
    });

    if (!result?.success) return [];

    const allEmployes = result.data?.items || result.data || [];

    const { startDate, endDate } = getExportRange(period, customDate);

    if (!startDate || !endDate) return allEmployes;

    const filtered = allEmployes.filter((emp: any) => {
      const empDateStr = emp.date_embauche || emp.created_at || '';
      if (!empDateStr) return false;
      const empDate = new Date(empDateStr);
      if (isNaN(empDate.getTime())) return false;

      const start = new Date(startDate);
      const end = new Date(endDate);
      return empDate >= start && empDate <= end;
    });

    return filtered;
  }, [debouncedSearch, filterStatus, sortOption]);

  // ⭐ Export Excel
  const exportToExcel = useCallback(async (period: ExportPeriod, customDate: string) => {
    const data = await getEmployesForExport(period, customDate);
    const rows = data.length
      ? data.map((emp: any) => ({
          'Nom': emp.nom || '',
          'Prénom': emp.prenom || '',
          'Email': emp.email || '',
          'Téléphone': emp.telephone || '',
          'Poste': emp.poste || '',
          'Département': emp.departement || '',
          'Date embauche': emp.date_embauche || '',
          'Salaire': emp.salaire || 0,
          'Statut': getStatusLabel(emp.status),
        }))
      : [
          { 'Nom': 'Aucun employé', 'Prénom': '', 'Email': '', 'Téléphone': '', 'Poste': '', 'Département': '', 'Date embauche': '', 'Salaire': 0, 'Statut': '' }
        ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employés');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const totalSalaire = data.reduce((sum: number, emp: any) => sum + (Number(emp.salaire) || 0), 0);
    XLSX.utils.sheet_add_json(ws, [{
      'Nom': 'MASSE SALARIALE', 'Prénom': '', 'Email': '', 'Téléphone': '', 'Poste': '',
      'Département': '', 'Date embauche': '', 'Salaire': formatNumberNoSlash(totalSalaire), 'Statut': ''
    }], { origin: -1, skipHeader: true });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `employes_${period}_${customDate || toLocalDateString()}.xlsx`;
    const result = await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le fichier Excel.');
    }
    return result;
  }, [getEmployesForExport]);

  // ⭐⭐⭐ PDF — Border mainty mitovy amin'ny Dashboard + MASSE SALARIALE ligne iray ⭐⭐⭐
  const exportToPDF = useCallback(async (period: ExportPeriod, customDate: string) => {
    const data = await getEmployesForExport(period, customDate);

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
      'Nom', 'Prénom', 'Email', 'Téléphone', 'Poste',
      'Département', 'Date embauche', 'Salaire', 'Statut'
    ];

    const rows = data.length
      ? data.map((emp: any) => [
          emp.nom || '',
          emp.prenom || '',
          emp.email || '',
          emp.telephone || '',
          emp.poste || '',
          emp.departement || '',
          emp.date_embauche || '',
          formatNumberNoSlash(Number(emp.salaire || 0)),
          getStatusLabel(emp.status),
        ])
      : [['Aucun employé', '', '', '', '', '', '', '0', '']];

    const totalSalaire = data.reduce((sum: number, emp: any) => sum + (Number(emp.salaire) || 0), 0);

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(0, 16, pageWidth, 16);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LifesArt — Employés', margin, 10);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${nowStr}`, pageWidth - margin, 10, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport des employés', margin, 26);

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
        0:  { cellWidth: 30 },
        1:  { cellWidth: 30 },
        2:  { cellWidth: 48, fontSize: 7.5 },
        3:  { cellWidth: 28 },
        4:  { cellWidth: 32 },
        5:  { cellWidth: 28 },
        6:  { cellWidth: 26 },
        7:  { cellWidth: 27, halign: 'right', fontStyle: 'bold' },
        8:  { cellWidth: 20 },
      },
      foot: [[
        { content: '', colSpan: 4 },
        {
          content: `MASSE SALARIALE : ${formatNumberNoSlash(totalSalaire)} Ar`,
          colSpan: 4,
          styles: {
            halign: 'right' as const,
            fontStyle: 'bold' as const,
            fontSize: 9,
          },
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
    const fileName = `employes_${period}_${customDate || toLocalDateString()}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le PDF.');
    }
    return result;
  }, [getEmployesForExport]);

  // ⭐ Export CSV
  const exportToCSV = useCallback(async (period: ExportPeriod, customDate: string) => {
    const data = await getEmployesForExport(period, customDate);
    const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Poste', 'Département', 'Date embauche', 'Salaire', 'Statut'];
    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    };

    const rows = data.length
      ? data.map((emp: any) => [
          emp.nom || '', emp.prenom || '', emp.email || '', emp.telephone || '',
          emp.poste || '', emp.departement || '', emp.date_embauche || '',
          emp.salaire || 0,
          getStatusLabel(emp.status)
        ])
      : [['Aucun employé', '', '', '', '', '', '', 0, '']];

    const totalSalaire = data.reduce((sum: number, emp: any) => sum + (Number(emp.salaire) || 0), 0);
    const totalRow = ['', '', '', '', '', '', '', `MASSE SALARIALE: ${formatNumberNoSlash(totalSalaire)} Ar`, ''];
    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')])
    ].join('\n');

    const fileName = `employes_${period}_${customDate || toLocalDateString()}.csv`;
    const result = await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le CSV.');
    }
    return result;
  }, [getEmployesForExport]);

  return {
    exportToExcel,
    exportToPDF,
    exportToCSV,
    getEmployesForExport,
  };
};