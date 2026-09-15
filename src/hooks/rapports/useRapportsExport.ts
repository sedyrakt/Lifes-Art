// src/hooks/rapports/useRapportsExport.ts
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../../utils/saveFileWithDialog';
import { sanitizeMoney, toLocalDateString, getPeriodLabel } from './helpers';
import type { ExportPeriod } from './types';

interface UseRapportsExportParams {
  stats: any;
  topProduits: any[];
  commandesRecentes: any[];
  exportToExcelBase?: any;
  exportToPDFBase?: any;
  exportToCSVBase?: any;
}

export const useRapportsExport = ({
  stats,
  topProduits,
  commandesRecentes,
}: UseRapportsExportParams) => {
  // ⭐ Base exports (génériques)
  const exportToExcel = useCallback(async (
    data: any[],
    filename: string,
    sheetName = 'Rapport',
    period: ExportPeriod = 'mois',
    customDate: string = ''
  ) => {
    if (!data.length) return { success: true, canceled: false };
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileName = `${filename}_${period}_${customDate || toLocalDateString()}.xlsx`;
      const result = await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
      if (!result.success) {
        if (result.canceled) return result;
        throw new Error(result.error || 'Impossible d\'enregistrer le fichier Excel.');
      }
      return result;
    } catch (error) {
      console.error('❌ Erreur export Excel:', error);
      throw error;
    }
  }, []);

  const exportToPDF = useCallback(async (
    data: any[],
    filename: string,
    title: string,
    columns: string[],
    companyName?: string,
    period: ExportPeriod = 'mois',
    customDate: string = ''
  ) => {
    if (!data.length) return { success: true, canceled: false };
    try {
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

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 16, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(0, 16, pageWidth, 16);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${companyName || "LifesArt"} — Rapports`, margin, 10);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Généré le ${nowStr}`, pageWidth - margin, 10, { align: 'right' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, 26);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Période : ${periodLabel}`, margin, 32);

      const rows = data.map(item =>
        columns.map(column => {
          const value = item?.[column];
          return value !== undefined && value !== null ? String(value) : '';
        })
      );

      autoTable(doc, {
        ...TABLE_STYLE,
        startY: 38,
        head: [columns],
        body: rows,
        theme: 'grid',
        margin: { left: margin, right: margin },
        showHead: 'firstPage',
        showFoot: 'lastPage',
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(
          `${companyName || 'LifesArt'} ERP — Page ${i} / ${pageCount}`,
          pageWidth / 2,
          pageHeight - 6,
          { align: 'center' }
        );
      }

      const pdfArrayBuffer = doc.output('arraybuffer');
      const fileName = `${filename}_${period}_${customDate || toLocalDateString()}.pdf`;
      const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
      if (!result.success) {
        if (result.canceled) return result;
        throw new Error(result.error || 'Impossible d\'enregistrer le PDF.');
      }
      return result;
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      throw error;
    }
  }, []);

  const exportToCSV = useCallback(async (
    data: any[],
    filename: string,
    period: ExportPeriod = 'mois',
    customDate: string = ''
  ) => {
    if (!data.length) return { success: true, canceled: false };
    try {
      const headers = Object.keys(data[0]);
      const escapeCSV = (value: any) => {
        if (value === undefined || value === null) return '""';
        return `"${String(value).replace(/"/g, '""')}"`;
      };

      const csv = [
        headers.map(escapeCSV).join(','),
        ...data.map(item => headers.map(header => escapeCSV(item?.[header])).join(',')),
      ].join('\n');

      const fileName = `${filename}_${period}_${customDate || toLocalDateString()}.csv`;
      const result = await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
      if (!result.success) {
        if (result.canceled) return result;
        throw new Error(result.error || 'Impossible d\'enregistrer le CSV.');
      }
      return result;
    } catch (error) {
      console.error('❌ Erreur export CSV:', error);
      throw error;
    }
  }, []);

  // ⭐ Spécifiques
  const handleExportStats = useCallback(async (
    formatMoneyFn: (value: number) => string,
    period: ExportPeriod = 'mois',
    customDate: string = ''
  ) => {
    const data = [
      { Indicateur: "Chiffre d'affaires", Valeur: sanitizeMoney(formatMoneyFn(stats.chiffreAffaires)) },
      { Indicateur: 'Bénéfice Net', Valeur: sanitizeMoney(formatMoneyFn(stats.benefice)) },
      { Indicateur: 'Total entrées', Valeur: stats.totalEntrees },
      { Indicateur: 'Total sorties', Valeur: stats.totalSorties },
      { Indicateur: 'Commandes', Valeur: stats.nbCommandes },
      { Indicateur: 'Clients Actifs', Valeur: stats.nbClients },
      { Indicateur: 'Taux de marge', Valeur: stats.tauxBenefice.toFixed(2) + '%' },
    ];
    return await exportToExcel(data, 'Rapport_Statistiques', 'Stats', period, customDate);
  }, [stats, exportToExcel]);

  const handleExportTopProduits = useCallback(async (
    formatMoneyFn: (value: number) => string,
    period: ExportPeriod = 'mois',
    customDate: string = ''
  ) => {
    if (!topProduits.length) return { success: true, canceled: false };
    const data = topProduits.map((product, index) => ({
      Rang: `#${index + 1}`,
      Produit: product.nom || 'N/A',
      Code: product.code || 'N/A',
      'Quantité vendue': product.total_vendu || 0,
      'Total ventes': sanitizeMoney(formatMoneyFn(product.total_ventes || 0)),
      Pourcentage: product.pourcentage ? `${product.pourcentage}%` : '0%',
    }));
    return await exportToExcel(data, 'Top_Produits', 'Top', period, customDate);
  }, [topProduits, exportToExcel]);

  const handleExportCommandes = useCallback(async (
    period: ExportPeriod = 'mois',
    customDate: string = ''
  ) => {
    if (!commandesRecentes.length) return { success: true, canceled: false };
    const data = commandesRecentes.map(command => ({
      'N° Commande': command.commande_numero || `CMD-${String(command.id || 0).padStart(6, '0')}`,
      Client: command.client_nom || 'N/A',
      Date: command.date_commande ? new Date(command.date_commande).toLocaleDateString('fr-FR') : 'N/A',
      'Total TTC': command.total_ttc || 0,
      Statut: command.statut || 'N/A',
      'Nb Produits': command.nb_produits || 0,
    }));
    return await exportToExcel(data, 'Commandes_Recentes', 'Commandes', period, customDate);
  }, [commandesRecentes, exportToExcel]);

  const handleExportPDF = useCallback(async (
    formatMoneyFn: (value: number) => string,
    companyName = "LifesArt",
    period: ExportPeriod = 'mois',
    customDate: string = ''
  ) => {
    const data = [
      { Indicateur: "Chiffre d'affaires", Valeur: sanitizeMoney(formatMoneyFn(stats.chiffreAffaires)) },
      { Indicateur: 'Bénéfice Net', Valeur: sanitizeMoney(formatMoneyFn(stats.benefice)) },
      { Indicateur: 'Total entrées', Valeur: stats.totalEntrees },
      { Indicateur: 'Total sorties', Valeur: stats.totalSorties },
      { Indicateur: 'Commandes', Valeur: stats.nbCommandes },
      { Indicateur: 'Clients Actifs', Valeur: stats.nbClients },
      { Indicateur: 'Taux de marge', Valeur: stats.tauxBenefice.toFixed(2) + '%' },
    ];
    return await exportToPDF(
      data,
      'Rapport_Statistiques',
      `Rapport d'analyse financière - ${companyName}`,
      ['Indicateur', 'Valeur'],
      companyName,
      period,
      customDate
    );
  }, [stats, exportToPDF]);

  const handleExportCSV = useCallback(async (
    formatMoneyFn: (value: number) => string,
    period: ExportPeriod = 'mois',
    customDate: string = ''
  ) => {
    const data = [
      { Indicateur: "Chiffre d'affaires", Valeur: sanitizeMoney(formatMoneyFn(stats.chiffreAffaires)) },
      { Indicateur: 'Bénéfice Net', Valeur: sanitizeMoney(formatMoneyFn(stats.benefice)) },
      { Indicateur: 'Total entrées', Valeur: stats.totalEntrees },
      { Indicateur: 'Total sorties', Valeur: stats.totalSorties },
      { Indicateur: 'Commandes', Valeur: stats.nbCommandes },
      { Indicateur: 'Clients Actifs', Valeur: stats.nbClients },
      { Indicateur: 'Taux de marge', Valeur: stats.tauxBenefice.toFixed(2) + '%' },
    ];
    return await exportToCSV(data, 'Rapport_Statistiques', period, customDate);
  }, [stats, exportToCSV]);

  return {
    exportToExcel,
    exportToPDF,
    exportToCSV,
    handleExportStats,
    handleExportTopProduits,
    handleExportCommandes,
    handleExportPDF,
    handleExportCSV,
  };
};