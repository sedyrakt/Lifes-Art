// ============================================================
// src/hooks/useDashboardExport.ts
// LIFE'S ART ERP — Export Dashboard
// ⭐ Excel + PDF + CSV
// ⭐ Fond blanc + texte noir + border noire
// ⭐ FIX: Tables alignées — width 182mm mitovy daholo
// ⭐ FIX: space tsotra amin'ny chiffres (fa tsy slash)
// ============================================================

import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../utils/saveFileWithDialog';

export interface DashboardExportPayload {
  periodLabel: string;
  startDate?: string | null;
  endDate?: string | null;
  stats: {
    chiffreAffaires: number;
    beneficeNet: number;
    depenses: number;
    salairesPayes: number;
    panierMoyen: number;
    detteClient: number;
    clientsActifs: number;
    alertesStock: number;
    ruptureStock: number;
    stockValue: number;
    commandesNonPayees: number;
    commandesTotal: number;
  };
  topProduits: Array<{ name: string; quantity: number; sales: number; evolution: number }>;
  alerts?: Array<{ type: string; title: string; message: string; time: string; }>;
  ruptureStockDetails?: any[];
  detteClientsDetails?: any[];
  commandesEnAttenteDetails?: any[];
}

export interface ExportResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  error?: string;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

// ⭐ Format nombre tsotra — space mahazatra (fa tsy \u202F)
const formatRawNumber = (v: number): string => {
  const n = Math.round(Number(v) || 0);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatAriary = (v: number): string => `${formatRawNumber(v)} Ar`;
const formatNumber = (v: number): string => formatRawNumber(v);

const formatDateFr = (value?: string | null): string => {
  if (!value) return '—';
  const s = String(value).trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  try {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
  } catch (_) {}
  return s;
};

const safeFilename = (s: string): string =>
  s.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'dashboard';

const buildFilename = (periodLabel: string, ext: string): string => {
  const d = new Date();
  const datePart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `dashboard_${safeFilename(periodLabel)}_${datePart}.${ext}`;
};

// ⭐ Margin mitovy ho an'ny table rehetra (left=14, right=14 → available 182mm)
const TABLE_MARGIN = { left: 14, right: 14 };

// ⭐ Style uniforme : fond blanc + texte noir + border noire
const TABLE_STYLE = {
  styles: {
    fontSize: 9,
    cellPadding: 2.2,
    textColor: [0, 0, 0],
    fillColor: [255, 255, 255],
    lineColor: [0, 0, 0],
    lineWidth: 0.25,
  },
  headStyles: {
    fillColor: [255, 255, 255],
    textColor: [0, 0, 0],
    fontStyle: 'bold' as const,
    lineColor: [0, 0, 0],
    lineWidth: 0.5,
  },
  alternateRowStyles: { fillColor: [255, 255, 255] },
};

const PAGE_BREAK_HEADER = 22;
const PAGE_BREAK_ROW = 6;
const PAGE_BREAK_MARGIN = 12;

// ────────────────────────────────────────────────────────────
// HOOK
// ────────────────────────────────────────────────────────────

export function useDashboardExport() {

  // ═══════════════════════════════════════════════════════════
  // EXCEL
  // ═══════════════════════════════════════════════════════════
  const exportExcel = useCallback(async (payload: DashboardExportPayload): Promise<ExportResult> => {
    try {
      const wb = XLSX.utils.book_new();

      // ─── Feuille 1 : Indicateurs ───
      const indicatorsRows: any[] = [
        ['Tableau de bord — Export'],
        ['Période', payload.periodLabel],
        ['Généré le', new Date().toLocaleString('fr-FR')],
        [],
        ['INDICATEUR', 'VALEUR'],
        ["Chiffre d'affaires", payload.stats.chiffreAffaires],
        ['Bénéfice net', payload.stats.beneficeNet],
        ['Dépenses', payload.stats.depenses],
        ['Salaires payés', payload.stats.salairesPayes],
        ['Panier moyen', payload.stats.panierMoyen],
        ['Dette client', payload.stats.detteClient],
        ['Valeur stock', payload.stats.stockValue],
        [],
        ['AUTRES KPI', 'VALEUR'],
        ['Commandes total', payload.stats.commandesTotal],
        ['Clients actifs', payload.stats.clientsActifs],
        ['Stock faible (alertes)', payload.stats.alertesStock],
        ['Rupture de stock', payload.stats.ruptureStock],
        ['Commandes non payées', payload.stats.commandesNonPayees],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(indicatorsRows);
      ws1['!cols'] = [{ wch: 28 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Indicateurs');

      // ─── Feuille 2 : Top produits ───
      if (payload.topProduits.length > 0) {
        const produitsRows: any[] = [
          ['Produit', 'Quantité', 'Ventes (Ar)'],
          ...payload.topProduits.map((p) => [p.name, p.quantity, p.sales]),
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(produitsRows);
        ws2['!cols'] = [{ wch: 32 }, { wch: 12 }, { wch: 18 }];
        ws2['!freeze'] = { xSplit: 0, ySplit: 1 };
        XLSX.utils.book_append_sheet(wb, ws2, 'Top Produits');
      }

      // ─── Feuille 3 : Rupture de stock ───
      if (payload.ruptureStockDetails && payload.ruptureStockDetails.length > 0) {
        const rows: any[] = [
          ['Code', 'Produit', 'Stock', 'Min.', 'Date'],
          ...payload.ruptureStockDetails.map((p: any) => [
            p.code || '',
            p.nom || '',
            Number(p.quantite_stock ?? 0),
            Number(p.quantite_minimale ?? 0),
            formatDateFr(p.date_ref),
          ]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{ wch: 18 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 14 }];
        ws['!freeze'] = { xSplit: 0, ySplit: 1 };
        XLSX.utils.book_append_sheet(wb, ws, 'Rupture Stock');
      }

      // ─── Feuille 4 : Dette clients ───
      {
        const details = payload.detteClientsDetails || [];
        const rows: any[] = [
          ['Client', 'N° Commande', 'Total TTC', 'Payé', 'Reste dû', 'Modalité', 'Échéance', 'Date'],
        ];
        if (details.length > 0) {
          for (const c of details) {
            rows.push([
              c.client_nom || '',
              c.numero || '',
              Number(c.total_ttc ?? 0),
              Number(c.montant_paye ?? 0),
              Number(c.dette ?? 0),
              c.modalite_paiement || '—',
              formatDateFr(c.date_limite_paiement),
              formatDateFr(c.date_ref),
            ]);
          }
        } else {
          rows.push(['Aucune dette client pour cette période', '', '', '', '', '', '', '']);
        }
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [
          { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
          { wch: 14 }, { wch: 12 }, { wch: 12 },
        ];
        ws['!freeze'] = { xSplit: 0, ySplit: 1 };
        XLSX.utils.book_append_sheet(wb, ws, 'Dette Clients');
      }

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const filename = buildFilename(payload.periodLabel, 'xlsx');

      const result = await saveFileWithDialog(wbout, filename, [
        { name: 'Excel', extensions: ['xlsx'] },
      ]);

      if (!result.success) {
        if (result.canceled) return { success: false, canceled: true };
        return { success: false, error: result.error || 'Erreur enregistrement Excel.' };
      }
      return { success: true, canceled: false, filePath: result.filePath };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur génération Excel.' };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // PDF
  // ═══════════════════════════════════════════════════════════
  const exportPDF = useCallback(async (payload: DashboardExportPayload): Promise<ExportResult> => {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // ─── Bandeau en-tête ───
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, 16, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(0, 16, pageW, 16);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Life's Art — Tableau de bord", 14, 10);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, pageW - 14, 10, { align: 'right' });

      // ─── Titre ───
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('Rapport du tableau de bord', 14, 26);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Période : ${payload.periodLabel}`, 14, 32);

      // ─── Section 1 : Indicateurs ───
      autoTable(doc, {
        ...TABLE_STYLE,
        startY: 38,
        head: [['Indicateur', 'Valeur']],
        body: [
          ["Chiffre d'affaires", formatAriary(payload.stats.chiffreAffaires)],
          ['Bénéfice net', formatAriary(payload.stats.beneficeNet)],
          ['Dépenses', formatAriary(payload.stats.depenses)],
          ['Salaires payés', formatAriary(payload.stats.salairesPayes)],
          ['Panier moyen', formatAriary(payload.stats.panierMoyen)],
          ['Dette client', formatAriary(payload.stats.detteClient)],
          ['Valeur stock', formatAriary(payload.stats.stockValue)],
          ['Commandes total', formatNumber(payload.stats.commandesTotal)],
          ['Clients actifs', formatNumber(payload.stats.clientsActifs)],
          ['Stock faible (alertes)', formatNumber(payload.stats.alertesStock)],
          ['Rupture de stock', formatNumber(payload.stats.ruptureStock)],
          ['Commandes non payées', formatNumber(payload.stats.commandesNonPayees)],
        ],
        columnStyles: {
          0: { cellWidth: 91, textColor: [0, 0, 0] },
          1: { cellWidth: 91, halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] },
        },
        theme: 'grid',
        margin: TABLE_MARGIN,
      });

      let lastY = (doc as any).lastAutoTable?.finalY ?? 55;

      // ─── Section 2 : Top produits ───
      if (payload.topProduits.length > 0) {
        if (lastY + PAGE_BREAK_HEADER + payload.topProduits.length * PAGE_BREAK_ROW > pageH - PAGE_BREAK_MARGIN) {
          doc.addPage();
          lastY = 12;
        }
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Top 5 des produits', 14, lastY + 10);

        autoTable(doc, {
          ...TABLE_STYLE,
          startY: lastY + 14,
          head: [['#', 'Produit', 'Quantité', 'Ventes']],
          body: payload.topProduits.map((p, i) => [
            String(i + 1),
            p.name,
            formatNumber(p.quantity),
            formatAriary(p.sales),
          ]),
          // Total = 182mm mitovy amin'ny table hafa
          columnStyles: {
            0: { cellWidth: 12, halign: 'center', textColor: [0, 0, 0] },
            1: { cellWidth: 100, textColor: [0, 0, 0] },
            2: { cellWidth: 30, halign: 'right', textColor: [0, 0, 0] },
            3: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] },
          },
          theme: 'grid',
          margin: TABLE_MARGIN,
        });

        lastY = (doc as any).lastAutoTable?.finalY ?? lastY;
      }

      // ─── Section 3 : Rupture de stock ───
      if (payload.ruptureStockDetails && payload.ruptureStockDetails.length > 0) {
        if (lastY + PAGE_BREAK_HEADER + payload.ruptureStockDetails.length * PAGE_BREAK_ROW > pageH - PAGE_BREAK_MARGIN) {
          doc.addPage();
          lastY = 12;
        }

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Produits en rupture de stock', 14, lastY + 10);

        autoTable(doc, {
          ...TABLE_STYLE,
          startY: lastY + 14,
          head: [['Code', 'Produit', 'Stock', 'Min.', 'Date']],
          body: payload.ruptureStockDetails.map((p: any) => [
            p.code || '—',
            p.nom || '—',
            String(p.quantite_stock ?? 0),
            String(p.quantite_minimale ?? 0),
            formatDateFr(p.date_ref),
          ]),
          // Total = 182mm
          columnStyles: {
            0: { cellWidth: 40, textColor: [0, 0, 0], fontSize: 7.5 },
            1: { cellWidth: 70, textColor: [0, 0, 0] },
            2: { cellWidth: 18, halign: 'right', textColor: [0, 0, 0] },
            3: { cellWidth: 18, halign: 'right', textColor: [0, 0, 0] },
            4: { cellWidth: 36, halign: 'right', textColor: [0, 0, 0] },
          },
          theme: 'grid',
          margin: TABLE_MARGIN,
        });

        lastY = (doc as any).lastAutoTable?.finalY ?? lastY;
      }

      // ─── Section 4 : Dette clients ───
      {
        const details = payload.detteClientsDetails || [];
        const rowCount = details.length > 0 ? details.length : 1;

        if (lastY + PAGE_BREAK_HEADER + rowCount * PAGE_BREAK_ROW > pageH - PAGE_BREAK_MARGIN) {
          doc.addPage();
          lastY = 12;
        }

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Dette clients (commandes non payées)', 14, lastY + 10);

        const body = details.length > 0
          ? details.map((c: any) => [
              c.client_nom || '—',
              c.numero || '—',
              formatAriary(c.total_ttc || 0),
              formatAriary(c.montant_paye || 0),
              formatAriary(c.dette || 0),
              c.modalite_paiement || '—',
              formatDateFr(c.date_limite_paiement),
              formatDateFr(c.date_ref),
            ])
          : [['Aucune dette client pour cette période', '', '', '', '', '', '', '']];

        autoTable(doc, {
          ...TABLE_STYLE,
          startY: lastY + 14,
          head: [['Client', 'N°', 'Total', 'Payé', 'Reste', 'Modalité', 'Échéance', 'Date']],
          body,
          styles: {
            ...TABLE_STYLE.styles,
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            ...TABLE_STYLE.headStyles,
            fontSize: 8.5,
          },
          // Total = 182mm mitovy amin'ny table hafa
          columnStyles: {
            0: { cellWidth: 28, textColor: [0, 0, 0] },
            1: { cellWidth: 24, textColor: [0, 0, 0] },
            2: { cellWidth: 22, halign: 'right', textColor: [0, 0, 0] },
            3: { cellWidth: 22, halign: 'right', textColor: [0, 0, 0] },
            4: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] },
            5: { cellWidth: 22, halign: 'center', textColor: [0, 0, 0] },
            6: { cellWidth: 22, halign: 'center', textColor: [0, 0, 0] },
            7: { cellWidth: 18, halign: 'center', textColor: [0, 0, 0] },
          },
          theme: 'grid',
          margin: TABLE_MARGIN,
          didParseCell: (data) => {
            if (details.length === 0 && data.section === 'body' && data.column.index === 0) {
              data.cell.styles.fontStyle = 'italic';
              data.cell.styles.halign = 'center';
              data.cell.styles.textColor = [80, 80, 80];
            }
          },
        });

        lastY = (doc as any).lastAutoTable?.finalY ?? lastY;
      }

      // ─── Footer ───
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(
          `Life's Art ERP — Page ${i} / ${pageCount}`,
          pageW / 2,
          pageH - 6,
          { align: 'center' }
        );
      }

      const pdfArrayBuffer = doc.output('arraybuffer');
      const filename = buildFilename(payload.periodLabel, 'pdf');

      const result = await saveFileWithDialog(pdfArrayBuffer, filename, [
        { name: 'PDF', extensions: ['pdf'] },
      ]);

      if (!result.success) {
        if (result.canceled) return { success: false, canceled: true };
        return { success: false, error: result.error || 'Erreur enregistrement PDF.' };
      }
      return { success: true, canceled: false, filePath: result.filePath };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur génération PDF.' };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // CSV — UTF-8 BOM
  // ═══════════════════════════════════════════════════════════
  const exportCSV = useCallback(async (payload: DashboardExportPayload): Promise<ExportResult> => {
    try {
      const sep = ';';
      const escape = (value: unknown): string => {
        const s = String(value ?? '');
        if (s.includes(sep) || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };
      const lines: string[] = [];

      lines.push(`Tableau de bord — Export`);
      lines.push(`Période${sep}${escape(payload.periodLabel)}`);
      lines.push(`Généré le${sep}${escape(new Date().toLocaleString('fr-FR'))}`);
      lines.push('');

      // ─── Indicateurs ───
      lines.push('INDICATEURS');
      lines.push(`Indicateur${sep}Valeur`);
      lines.push(`Chiffre d'affaires${sep}${payload.stats.chiffreAffaires}`);
      lines.push(`Bénéfice net${sep}${payload.stats.beneficeNet}`);
      lines.push(`Dépenses${sep}${payload.stats.depenses}`);
      lines.push(`Salaires payés${sep}${payload.stats.salairesPayes}`);
      lines.push(`Panier moyen${sep}${payload.stats.panierMoyen}`);
      lines.push(`Dette client${sep}${payload.stats.detteClient}`);
      lines.push(`Valeur stock${sep}${payload.stats.stockValue}`);
      lines.push(`Commandes total${sep}${payload.stats.commandesTotal}`);
      lines.push(`Clients actifs${sep}${payload.stats.clientsActifs}`);
      lines.push(`Stock faible${sep}${payload.stats.alertesStock}`);
      lines.push(`Rupture de stock${sep}${payload.stats.ruptureStock}`);
      lines.push(`Commandes non payées${sep}${payload.stats.commandesNonPayees}`);
      lines.push('');

      // ─── Top produits ───
      if (payload.topProduits.length > 0) {
        lines.push('TOP PRODUITS');
        lines.push(`Produit${sep}Quantité${sep}Ventes`);
        for (const p of payload.topProduits) {
          lines.push(`${escape(p.name)}${sep}${p.quantity}${sep}${p.sales}`);
        }
        lines.push('');
      }

      // ─── Rupture de stock ───
      if (payload.ruptureStockDetails && payload.ruptureStockDetails.length > 0) {
        lines.push('RUPTURE DE STOCK');
        lines.push(`Code${sep}Produit${sep}Stock${sep}Min.${sep}Date`);
        for (const p of payload.ruptureStockDetails) {
          lines.push(`${escape(p.code)}${sep}${escape(p.nom)}${sep}${p.quantite_stock ?? 0}${sep}${p.quantite_minimale ?? 0}${sep}${escape(formatDateFr(p.date_ref))}`);
        }
        lines.push('');
      }

      // ─── Dette clients ───
      {
        const details = payload.detteClientsDetails || [];
        lines.push('DETTE CLIENTS');
        lines.push(`Client${sep}N° Commande${sep}Total TTC${sep}Payé${sep}Reste dû${sep}Modalité${sep}Échéance${sep}Date`);
        if (details.length > 0) {
          for (const c of details) {
            lines.push([
              escape(c.client_nom),
              escape(c.numero),
              c.total_ttc ?? 0,
              c.montant_paye ?? 0,
              c.dette ?? 0,
              escape(c.modalite_paiement || '—'),
              escape(formatDateFr(c.date_limite_paiement)),
              escape(formatDateFr(c.date_ref)),
            ].join(sep));
          }
        } else {
          lines.push(`Aucune dette client pour cette période${sep}${sep}${sep}${sep}${sep}${sep}`);
        }
      }

      const content = '\uFEFF' + lines.join('\n');
      const filename = buildFilename(payload.periodLabel, 'csv');

      const result = await saveFileWithDialog(content, filename, [
        { name: 'CSV', extensions: ['csv'] },
      ]);

      if (!result.success) {
        if (result.canceled) return { success: false, canceled: true };
        return { success: false, error: result.error || 'Erreur enregistrement CSV.' };
      }
      return { success: true, canceled: false, filePath: result.filePath };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur génération CSV.' };
    }
  }, []);

  return { exportExcel, exportPDF, exportCSV };
}

export default useDashboardExport;