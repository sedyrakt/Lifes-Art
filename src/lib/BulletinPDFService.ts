// ============================================================
// src/lib/BulletinPDFService.ts
// ⭐ SERVICE FAHANA NY BULLETIN DE PAIE
// ⭐ INDIGO #4F46E5 + SLATE #0F172A
// ⭐ FIX: ESPACE NORMAL (TSY /) AMIN'NY VOLA
// ⭐ FIX: NIF + STAT ASEHO MIVANTAKA
// ⭐ FIX: DIRECTORY PARAMÈTRE (BULK GENERATION)
// ============================================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface BulletinPDFOptions {
  paiement: any;
  employe?: any;
  companyInfo?: {
    nom?: string;
    nif?: string;
    stat?: string;
    adresse?: string;
  };
  isDark?: boolean;
}

// ⭐ FIX: Manolo ny espace insécable (\u202F, \u00A0) amin'ny espace normal
const formatMoney = (amount: number): string => {
  if (!amount && amount !== 0) return '0 Ar';
  return new Intl.NumberFormat('fr-FR', { useGrouping: true, maximumFractionDigits: 0 })
    .format(amount)
    .replace(/[\u202F\u00A0]/g, ' ') // ⭐ Esory ny slash / rehefa jerena
    + ' Ar';
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
};

// ⭐ Couleurs (Indigo)
const COLORS = {
  primary: [79, 70, 229] as [number, number, number],
  primaryDark: [67, 56, 202] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  background: [248, 250, 252] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
};

const DARK_COLORS = {
  primary: [129, 140, 248] as [number, number, number],
  primaryDark: [99, 102, 241] as [number, number, number],
  text: [248, 250, 252] as [number, number, number],
  textMuted: [148, 163, 184] as [number, number, number],
  border: [30, 41, 59] as [number, number, number],
  background: [15, 23, 42] as [number, number, number],
  danger: [248, 113, 113] as [number, number, number],
  success: [52, 211, 153] as [number, number, number],
};

export const generateBulletinPDF = async (
  options: BulletinPDFOptions,
  directory?: string // ⭐ VAOVAO: Raha misy directory, tsy misy dialog
): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }> => {
  const { paiement, employe, companyInfo, isDark = false } = options;
  
  const company = companyInfo || { nom: 'Entreprise', nif: '', stat: '', adresse: '' };
  const C = isDark ? DARK_COLORS : COLORS;

  const nomEmploye = `${employe?.prenom || paiement.employe_prenom || ''} ${employe?.nom || paiement.employe_nom || ''}`.trim() || 'Employé';
  const poste = employe?.poste || paiement.employe_poste || '—';
  const moisNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const periode = `${moisNames[Number(paiement.mois)-1]} ${paiement.annee}`;
  const datePaiement = formatDate(paiement.date_paiement);

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ============================================================
  // HEADER: Anaran'ny orinasa + NIF + STAT + Adiresy
  // ============================================================

  doc.setFillColor(...C.primary);
  doc.rect(0, 0, pageWidth, 1.5, 'F'); // Ligne indigo ambony

  let y = 10;

  // Anaran'ny orinasa
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.primary);
  doc.text(company.nom || 'Entreprise', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // NIF + STAT
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.textMuted);
  if (company.nif) {
    doc.text(`NIF : ${company.nif}`, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  }
  if (company.stat) {
    doc.text(`STAT : ${company.stat}`, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  }
  if (company.adresse) {
    doc.text(company.adresse, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  }

  // Titre Bulletin
  y += 3;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.text);
  doc.text('BULLETIN DE PAIE', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // ============================================================
  // INFOS EMPLOYÉ / PÉRIODE
  // ============================================================

  doc.setDrawColor(...C.border);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Employé (gauche)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.textMuted);
  doc.text('EMPLOYÉ', margin, y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.text);
  doc.text(nomEmploye, margin, y + 5);
  doc.setFontSize(7);
  doc.setTextColor(...C.textMuted);
  doc.text(poste, margin, y + 9);

  // Période (droite)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.textMuted);
  doc.text('PÉRIODE', pageWidth - margin, y, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.text);
  doc.text(periode, pageWidth - margin, y + 5, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(...C.textMuted);
  doc.text(`Payé le ${datePaiement}`, pageWidth - margin, y + 9, { align: 'right' });

  y += 13;
  doc.setDrawColor(...C.border);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // ============================================================
  // TABLEAU DES MONTANTS (BRUT / RETENUES / NET)
  // ============================================================

  const body = [
    ['Salaire Brut', formatMoney(Number(paiement.salaire_brut) || 0)],
    ['CNaPS (1%)', `- ${formatMoney(Number(paiement.cnaps) || 0)}`],
    ['OSTIE (5%)', `- ${formatMoney(Number(paiement.ostie) || 0)}`],
    ['IRSA', `- ${formatMoney(Number(paiement.irsa) || 0)}`],
    ['Avance', `- ${formatMoney(Number(paiement.avance) || 0)}`],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Libellé', 'Montant']],
    body: body,
    theme: 'grid',
    headStyles: {
      fillColor: C.background,
      textColor: C.textMuted,
      fontStyle: 'bold',
      fontSize: 7,
      lineColor: C.border,
      lineWidth: 0.1,
    },
    bodyStyles: {
      textColor: C.text,
      fontSize: 8,
      lineColor: C.border,
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: C.background,
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 30;

  // ============================================================
  // NET À PAYER (tena manan-danja)
  // ============================================================

  const netAPayer = Number(paiement.montant) || 0;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.primary);
  doc.text('NET À PAYER', margin, finalY + 10);
  doc.text(formatMoney(netAPayer), pageWidth - margin, finalY + 10, { align: 'right' });

  // ============================================================
  // SIGNATURES
  // ============================================================

  const signatureY = finalY + 25;
  doc.setDrawColor(...C.border);
  doc.line(margin, signatureY, pageWidth - margin, signatureY);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.textMuted);
  doc.text('Signature Employeur', margin, signatureY + 5);
  doc.text('Signature Employé', pageWidth - margin, signatureY + 5, { align: 'right' });

  // ============================================================
  // FOOTER
  // ============================================================

  doc.setFontSize(6);
  doc.setTextColor(...C.textMuted);
  doc.text(
    `© ${new Date().getFullYear()} ${company.nom || 'Entreprise'}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // ============================================================
  // SAUVEGARDE / TÉLÉCHARGEMENT
  // ============================================================

  const nomFichier = `Bulletin_Paie_${nomEmploye.replace(/\s+/g, '_')}_${periode.replace(/\s+/g, '_')}.pdf`;

  // ⭐ VAOVAO: Raha misy directory => tsy misy dialog, soraty mivantana ao
  if (directory) {
    try {
      const result = await window.api.utils.saveFileToDirectory(
        doc.output('arraybuffer'),
        directory,
        nomFichier
      );
      if (result && result.success) return { success: true, filePath: result.filePath };
      return { success: false, error: result?.error || 'Erreur sauvegarde' };
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde Bulletin PDF:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }

  // Raha tsy misy directory => saveFile (dialog) no ampiasaina
  if (window?.api?.utils?.saveFile) {
    try {
      const result = await window.api.utils.saveFile(doc.output('arraybuffer'), nomFichier);
      if (result && result.canceled) return { success: false, canceled: true };
      if (!result || !result.success) return { success: false, error: result?.error || 'Erreur sauvegarde' };
      return { success: true, filePath: result.filePath };
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde Bulletin PDF:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  } else {
    doc.save(nomFichier);
    return { success: true, filePath: nomFichier };
  }
};

export const printBulletinPDF = async (options: BulletinPDFOptions): Promise<{ success: boolean; error?: string }> => {
  try {
    const doc = await generateBulletinPDF(options);
    if (!doc.success) return { success: false, error: doc.error };
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erreur impression Bulletin:', error);
    return { success: false, error: error.message };
  }
};

export default { generateBulletinPDF, printBulletinPDF };