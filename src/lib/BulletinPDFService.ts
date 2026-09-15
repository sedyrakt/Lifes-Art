// ============================================================
// src/lib/BulletinPDFService.ts
// ⭐ SERVICE BULLETIN DE PAIE (VERSION MADAGASCAR)
// ⭐ Design aligné sur ventesPDFService.ts (FACTURE / DEVIS)
// ⭐ Header encadré + grille infos + table gains/retenues
// ⭐ Totaux compacts + QR code + signatures
// ⭐ Support directory (bulk generation) + dialog (single)
// ⭐ MADA: CNaPS, OSTIE, IRSA, Cumuls, Net Imposable
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
    telephone?: string;
    email?: string;
    website?: string;
    rcs?: string;
    cnaps_code?: string;
    ostie_code?: string;
    convention_collective?: string;
  };
  isDark?: boolean;
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

const formatMoney = (amount: number): string => {
  if (amount === undefined || amount === null) return '0 Ar';
  return new Intl.NumberFormat('fr-FR', { useGrouping: true, maximumFractionDigits: 0 })
    .format(amount)
    .replace(/[\u202F\u00A0]/g, ' ') + ' Ar';
};

const formatMoneyQR = (amount: number): string => {
  if (amount === undefined || amount === null) return '0 Ar';
  return new Intl.NumberFormat('fr-FR', { useGrouping: false, maximumFractionDigits: 0 })
    .format(amount) + ' Ar';
};

const formatNumber = (value: any, decimals: number = 0): string => {
  if (value === undefined || value === null || value === '') return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(value));
};

const formatDate = (date: Date | string | undefined, format: 'short' | 'long' = 'short'): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return format === 'short'
    ? d.toLocaleDateString('fr-FR')
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const cleanText = (text?: string): string => {
  if (!text) return '';
  return String(text).normalize('NFC').trim();
};

const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ════════════════════════════════════════════════════════════
// QR CODE CONTENT
// ════════════════════════════════════════════════════════════

const buildQRContent = (params: {
  employeNom: string;
  matricule: string;
  periode: string;
  datePaiement: string;
  companyName: string;
  companyPhone?: string;
  companyEmail?: string;
  salaireBrut: number;
  totalRetenues: number;
  netAPayer: number;
  netImposable: number;
}): string => {
  const lines: string[] = [];

  lines.push('BULLETIN DE PAIE');
  lines.push(`EMPLOYÉ:${params.employeNom}`);
  if (params.matricule && params.matricule !== '—') lines.push(`MATRICULE:${params.matricule}`);
  lines.push(`PERIODE:${params.periode}`);
  lines.push(`DATE:${params.datePaiement}`);
  lines.push('');
  lines.push(`BRUT:${formatMoneyQR(params.salaireBrut)}`);
  lines.push(`RETENUES:${formatMoneyQR(params.totalRetenues)}`);
  lines.push(`NET IMPOSABLE:${formatMoneyQR(params.netImposable)}`);
  lines.push(`NET A PAYER:${formatMoneyQR(params.netAPayer)}`);
  lines.push('');
  lines.push(params.companyName);
  if (params.companyPhone) lines.push(`TEL:${params.companyPhone}`);
  if (params.companyEmail) lines.push(`MAIL:${params.companyEmail}`);

  return lines.join('\n');
};

// ════════════════════════════════════════════════════════════
// GENERATE BULLETIN PDF
// ════════════════════════════════════════════════════════════

export const generateBulletinPDF = async (
  options: BulletinPDFOptions,
  directory?: string
): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }> => {
  const { paiement, employe, companyInfo, isDark = false } = options;

  const { default: QRCode } = await import('qrcode');
  await new Promise((resolve) => setTimeout(resolve, 50));

  // ════════════════════════════════════════════════════════════
  // DATA EXTRACTION & SANITIZATION
  // ════════════════════════════════════════════════════════════
  const company = companyInfo || {};
  const displayCompanyName = cleanText(company.nom || 'Entreprise');
  const companyNif = cleanText(company.nif || '');
  const companyStat = cleanText(company.stat || '');
  const companyAddress = cleanText(company.adresse || '');
  const companyPhone = cleanText(company.telephone || '');
  const companyEmail = cleanText(company.email || '');
  const companyWebsite = cleanText(company.website || '');
  const companyRcs = cleanText(company.rcs || '');
  const companyCnaps = cleanText(company.cnaps_code || '');
  const companyOstie = cleanText(company.ostie_code || '');
  const conventionCollective = cleanText(company.convention_collective || '');

  // Employé
  const nomEmploye = `${employe?.prenom || paiement.employe_prenom || ''} ${employe?.nom || paiement.employe_nom || ''}`.trim() || 'Employé';
  const matricule = cleanText(employe?.matricule || paiement.employe_matricule || '—');
  const poste = cleanText(employe?.poste || paiement.employe_poste || '—');
  const dateEmbauche = employe?.date_embauche || paiement.employe_date_embauche;
  const situationFamiliale = cleanText(employe?.situation_familiale || paiement.employe_situation_familiale || '—');
  const cnapsNumero = cleanText(employe?.cnaps_numero || paiement.employe_cnaps_numero || '—');
  const ostieNumero = cleanText(employe?.ostie_numero || paiement.employe_ostie_numero || '—');

  // Période
  const moisIndex = Math.max(0, Math.min(11, Number(paiement.mois) - 1));
  const moisLabel = MOIS_FR[moisIndex] || '';
  const periode = `${moisLabel} ${paiement.annee}`;
  const orderDate = paiement.date_paiement || paiement.created_at || new Date().toISOString();

  // Montants (Gains)
  const salaireBase = Number(paiement.salaire_base) || 0;
  const heuresSup = Number(paiement.heures_sup) || 0;
  const heuresSupMontant = Number(paiement.heures_sup_montant) || 0;
  const primeAnciennete = Number(paiement.prime_anciennete) || 0;
  const primeLogement = Number(paiement.prime_logement) || 0;
  const primeCherteVie = Number(paiement.prime_cherte_vie) || 0;
  const indemniteTransport = Number(paiement.indemnite_transport) || 0;
  const autresPrimes = Number(paiement.autres_primes) || 0;
  
  // Calcul du Salaire Brut
  const salaireBrut = Number(paiement.salaire_brut) || (salaireBase + heuresSupMontant + primeAnciennete + primeLogement + primeCherteVie + indemniteTransport + autresPrimes);

  // Montants (Retenues)
  const cnaps = Number(paiement.cnaps) || 0;
  const ostie = Number(paiement.ostie) || 0;
  const irsa = Number(paiement.irsa) || 0;
  const avance = Number(paiement.avance) || 0;
  const absencesDeduction = Number(paiement.absences_deduction) || 0;
  const autresRetenues = Number(paiement.autres_retenues) || 0;
  const totalRetenues = cnaps + ostie + irsa + avance + absencesDeduction + autresRetenues;

  // Totaux & Cumuls
  const netAPayer = Number(paiement.montant) || (salaireBrut - totalRetenues);
  const netImposable = Number(paiement.net_imposable) || (salaireBrut - cnaps - ostie);
  const cumulGains = Number(paiement.cumul_gains) || 0;
  const cumulRetenues = Number(paiement.cumul_retenues) || 0;
  const cumulNet = Number(paiement.cumul_net) || 0;

  // ════════════════════════════════════════════════════════════
  // DOCUMENT SETUP
  // ════════════════════════════════════════════════════════════
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // ════════════════════════════════════════════════════════════
  // QR CODE GENERATION
  // ════════════════════════════════════════════════════════════
  let qrImageBase64 = '';
  try {
    const qrContent = buildQRContent({
      employeNom: nomEmploye,
      matricule,
      periode,
      datePaiement: formatDate(orderDate, 'long'),
      companyName: displayCompanyName,
      companyPhone: companyPhone || '',
      companyEmail: companyEmail || '',
      salaireBrut,
      totalRetenues,
      netAPayer,
      netImposable,
    });

    qrImageBase64 = await QRCode.toDataURL(qrContent, {
      width: 800,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' },
    });
  } catch (err) {
    console.error('❌ Erreur QR Code:', err);
  }

  // ════════════════════════════════════════════════════════════
  // HEADER BOX — Company Info (36mm)
  // ════════════════════════════════════════════════════════════
  const boxTop = 10;
  const boxHeight = 36;
  const boxLeft = margin;
  const boxRight = pageWidth - margin;
  const boxWidth = boxRight - boxLeft;
  const leftBoxWidth = 55;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(boxLeft, boxTop, boxWidth, boxHeight);
  doc.line(boxLeft + leftBoxWidth, boxTop, boxLeft + leftBoxWidth, boxTop + boxHeight);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(displayCompanyName, boxLeft + leftBoxWidth / 2, boxTop + boxHeight / 2 + 1, { align: 'center' });

  const rightX = boxLeft + leftBoxWidth + 5;
  const rightMaxWidth = boxWidth - leftBoxWidth - 10;
  let ry = boxTop + 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  if (companyAddress) {
    const lines = doc.splitTextToSize(companyAddress, rightMaxWidth);
    lines.slice(0, 3).forEach((line: string) => {
      doc.text(line, rightX, ry);
      ry += 3.8;
    });
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(rightX, ry + 0.3, rightX + rightMaxWidth, ry + 0.3);
  ry += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('NIF :', rightX, ry);
  doc.setFont('helvetica', 'normal');
  doc.text(companyNif || '—', rightX + 14, ry);
  ry += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('STAT :', rightX, ry);
  doc.setFont('helvetica', 'normal');
  doc.text(companyStat || '—', rightX + 14, ry);
  ry += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('CNaPS :', rightX, ry);
  doc.setFont('helvetica', 'normal');
  doc.text(companyCnaps || '—', rightX + 18, ry);
  
  doc.setFont('helvetica', 'bold');
  doc.text('OSTIE :', rightX + 40, ry);
  doc.setFont('helvetica', 'normal');
  doc.text(companyOstie || '—', rightX + 60, ry);

  // ════════════════════════════════════════════════════════════
  // TITLE — BULLETIN DE PAIE
  // ════════════════════════════════════════════════════════════
  let ty = boxTop + boxHeight + 7;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const titleText = 'BULLETIN DE PAIE';
  doc.text(titleText, pageWidth / 2, ty, { align: 'center' });
  const titleWidth = doc.getTextWidth(titleText);
  doc.line(pageWidth / 2 - titleWidth / 2, ty + 1, pageWidth / 2 + titleWidth / 2, ty + 1);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Pro', pageWidth - margin - 5, ty, { align: 'right' });

  // ════════════════════════════════════════════════════════════
  // INFO GRID — Employé, Poste, Période, etc.
  // ════════════════════════════════════════════════════════════
  let iy = ty + 9;
  const labelX1 = margin + 2;
  const valueX1 = margin + 30;
  const labelX2 = pageWidth / 2 + 8;
  const valueX2 = pageWidth / 2 + 45;

  doc.setFontSize(8.5);
  const orderDateFR = formatDate(orderDate, 'long');

  // Row 1
  doc.setFont('helvetica', 'bold'); doc.text('Employé', labelX1, iy);
  doc.setFont('helvetica', 'normal'); doc.text(nomEmploye, valueX1, iy);
  doc.setFont('helvetica', 'bold'); doc.text('Période', labelX2, iy);
  doc.setFont('helvetica', 'normal'); doc.text(periode, valueX2, iy);
  iy += 5;

  // Row 2
  doc.setFont('helvetica', 'bold'); doc.text('Matricule', labelX1, iy);
  doc.setFont('helvetica', 'normal'); doc.text(matricule, valueX1, iy);
  doc.setFont('helvetica', 'bold'); doc.text('Date de paiement', labelX2, iy);
  doc.setFont('helvetica', 'normal'); doc.text(orderDateFR, valueX2, iy);
  iy += 5;

  // Row 3
  doc.setFont('helvetica', 'bold'); doc.text('Poste', labelX1, iy);
  doc.setFont('helvetica', 'normal'); doc.text(poste, valueX1, iy);
  doc.setFont('helvetica', 'bold'); doc.text('Mode de paiement', labelX2, iy);
  doc.setFont('helvetica', 'normal'); doc.text(String(paiement.mode_paiement || 'Espèces'), valueX2, iy);
  iy += 5;

  // Row 4
  doc.setFont('helvetica', 'bold'); doc.text('Date embauche', labelX1, iy);
  doc.setFont('helvetica', 'normal'); doc.text(formatDate(dateEmbauche), valueX1, iy);
  doc.setFont('helvetica', 'bold'); doc.text('Situation fam.', labelX2, iy);
  doc.setFont('helvetica', 'normal'); doc.text(situationFamiliale, valueX2, iy);
  iy += 5;

  // Row 5
  doc.setFont('helvetica', 'bold'); doc.text('N° CNaPS', labelX1, iy);
  doc.setFont('helvetica', 'normal'); doc.text(cnapsNumero, valueX1, iy);
  doc.setFont('helvetica', 'bold'); doc.text('N° OSTIE', labelX2, iy);
  doc.setFont('helvetica', 'normal'); doc.text(ostieNumero, valueX2, iy);
  iy += 6;

  // ════════════════════════════════════════════════════════════
  // GAINS & RETENUES TABLES
  // ════════════════════════════════════════════════════════════
  const gainsRows: (string | number)[][] = [];
  if (salaireBase > 0) gainsRows.push(['Salaire de base', formatMoney(salaireBase)]);
  if (heuresSup > 0) gainsRows.push([`Heures supplémentaires (${heuresSup} h)`, formatMoney(heuresSupMontant)]);
  if (primeAnciennete > 0) gainsRows.push(['Prime d\'ancienneté', formatMoney(primeAnciennete)]);
  if (primeLogement > 0) gainsRows.push(['Prime de logement', formatMoney(primeLogement)]);
  if (primeCherteVie > 0) gainsRows.push(['Prime de cherté de vie', formatMoney(primeCherteVie)]);
  if (indemniteTransport > 0) gainsRows.push(['Indemnité de transport', formatMoney(indemniteTransport)]);
  if (autresPrimes > 0) gainsRows.push(['Autres primes', formatMoney(autresPrimes)]);

  const retenuesRows: (string | number)[][] = [];
  if (cnaps > 0) retenuesRows.push(['CNaPS (1%)', `- ${formatMoney(cnaps)}`]);
  if (ostie > 0) retenuesRows.push(['OSTIE (1%)', `- ${formatMoney(ostie)}`]);
  if (irsa > 0) retenuesRows.push(['IRSA', `- ${formatMoney(irsa)}`]);
  if (absencesDeduction > 0) retenuesRows.push(['Absences', `- ${formatMoney(absencesDeduction)}`]);
  if (avance > 0) retenuesRows.push(['Avance', `- ${formatMoney(avance)}`]);
  if (autresRetenues > 0) retenuesRows.push(['Autres retenues', `- ${formatMoney(autresRetenues)}`]);

  // ══════ GAINS ══════
  autoTable(doc, {
    startY: iy,
    head: [['GAINS', 'MONTANT']],
    body: gainsRows,
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255], textColor: [0, 0, 0],
      fontStyle: 'bold', fontSize: 8, cellPadding: 2.5,
      lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 },
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      textColor: [0, 0, 0], fontSize: 8.5, cellPadding: 2.5,
      lineWidth: { bottom: 0.2, top: 0, left: 0, right: 0 },
      lineColor: [200, 200, 200],
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 50, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  let afterGains = (doc as any).lastAutoTable?.finalY || iy + 15;
  afterGains += 6;

  // ══════ RETENUES ══════
  if (retenuesRows.length > 0) {
    autoTable(doc, {
      startY: afterGains,
      head: [['RETENUES', 'MONTANT']],
      body: retenuesRows,
      theme: 'plain',
      headStyles: {
        fillColor: [255, 255, 255], textColor: [0, 0, 0],
        fontStyle: 'bold', fontSize: 8, cellPadding: 2.5,
        lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 },
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        textColor: [0, 0, 0], fontSize: 8.5, cellPadding: 2.5,
        lineWidth: { bottom: 0.2, top: 0, left: 0, right: 0 },
        lineColor: [200, 200, 200],
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 50, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    afterGains = (doc as any).lastAutoTable?.finalY || afterGains + 15;
  }

  let afterProducts = afterGains + 8;

  // ════════════════════════════════════════════════════════════
  // TOTALS & CUMULS
  // ════════════════════════════════════════════════════════════
  const totalsRightX = pageWidth - margin - 10;
  const totalsLeftX = totalsRightX - 80;
  const lineHeight = 4.5;

  afterProducts += 14;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  // Totaux
  doc.text('Total gains', totalsLeftX, afterProducts);
  doc.text(formatMoney(salaireBrut), totalsRightX, afterProducts, { align: 'right' });

  afterProducts += lineHeight;
  doc.text('Total retenues', totalsLeftX, afterProducts);
  doc.text(totalRetenues > 0 ? `- ${formatMoney(totalRetenues)}` : formatMoney(0), totalsRightX, afterProducts, { align: 'right' });

  afterProducts += lineHeight;
  doc.text('Net imposable', totalsLeftX, afterProducts);
  doc.text(formatMoney(netImposable), totalsRightX, afterProducts, { align: 'right' });

  afterProducts += 2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(totalsLeftX, afterProducts, totalsRightX, afterProducts);
  afterProducts += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Net à payer', totalsLeftX, afterProducts);
  doc.text(formatMoney(netAPayer), totalsRightX, afterProducts, { align: 'right' });

  // Cumuls (raha misy)
  if (cumulGains > 0 || cumulRetenues > 0) {
    afterProducts += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CUMULS ANNUELS', totalsLeftX, afterProducts);
    afterProducts += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text('Cumul gains', totalsLeftX, afterProducts);
    doc.text(formatMoney(cumulGains), totalsRightX, afterProducts, { align: 'right' });
    afterProducts += lineHeight;
    doc.text('Cumul retenues', totalsLeftX, afterProducts);
    doc.text(formatMoney(cumulRetenues), totalsRightX, afterProducts, { align: 'right' });
    if (cumulNet > 0) {
      afterProducts += lineHeight;
      doc.text('Cumul net', totalsLeftX, afterProducts);
      doc.text(formatMoney(cumulNet), totalsRightX, afterProducts, { align: 'right' });
    }
  }

  afterProducts += 10;

  // ════════════════════════════════════════════════════════════
  // QR CODE — 30mm, bas droite
  // ════════════════════════════════════════════════════════════
  const qrSize = 30;
  const qrX = pageWidth - margin - qrSize;
  const qrY = afterProducts;

  if (qrImageBase64) {
    try {
      doc.addImage(qrImageBase64, 'PNG', qrX, qrY, qrSize, qrSize);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('scan', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
    } catch (err) {
      console.error('❌ Erreur addImage QR:', err);
    }
  }

  afterProducts = qrY + qrSize + 6;

  // ════════════════════════════════════════════════════════════
  // N.B & CONVENTION COLLECTIVE
  // ════════════════════════════════════════════════════════════
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('* N.B : Bulletin de paie à conserver sans limitation de durée.', margin, afterProducts);
  afterProducts += 5;

  if (conventionCollective) {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Convention collective : ${conventionCollective}`, margin, afterProducts);
    afterProducts += 5;
  }

  // ════════════════════════════════════════════════════════════
  // CONTACT + SIGNATURES
  // ════════════════════════════════════════════════════════════
  if (afterProducts + 50 > pageHeight - margin) {
    doc.addPage();
    afterProducts = margin + 10;
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(margin, afterProducts, pageWidth - margin, afterProducts);
  afterProducts += 5;

  const sep1X = pageWidth * 0.42;
  const sep2X = pageWidth * 0.71;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  doc.text('Contact', margin + 2, afterProducts);
  const contactW = doc.getTextWidth('Contact');
  doc.line(margin + 2, afterProducts + 1, margin + 2 + contactW, afterProducts + 1);

  doc.setFontSize(8.5);
  doc.text('Signature Employeur', sep1X + 3, afterProducts);
  const sig1W = doc.getTextWidth('Signature Employeur');
  doc.line(sep1X + 3, afterProducts + 1, sep1X + 3 + sig1W, afterProducts + 1);

  doc.text('Signature Employé', sep2X + 3, afterProducts);
  const sig2W = doc.getTextWidth('Signature Employé');
  doc.line(sep2X + 3, afterProducts + 1, sep2X + 3 + sig2W, afterProducts + 1);

  afterProducts += 7;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.setLineCap('butt');
  doc.line(sep1X, afterProducts - 12, sep1X, afterProducts + 23);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const contactValueX = margin + 28;

  if (companyPhone) {
    doc.text('Téléphone :', margin + 2, afterProducts);
    doc.text(companyPhone, contactValueX, afterProducts);
    afterProducts += 5.5;
  }
  if (companyEmail) {
    doc.text('Email :', margin + 2, afterProducts);
    doc.text(companyEmail, contactValueX, afterProducts);
    afterProducts += 5.5;
  }
  if (companyWebsite) {
    doc.text('Site internet :', margin + 2, afterProducts);
    doc.text(companyWebsite, contactValueX, afterProducts);
    afterProducts += 5.5;
  }

  doc.setFontSize(6.5);
  doc.setTextColor(150, 150, 150);
  doc.text(`© ${new Date().getFullYear()} ${displayCompanyName}`, pageWidth / 2, pageHeight - 4, { align: 'center' });

  // ════════════════════════════════════════════════════════════
  // SAUVEGARDE / TÉLÉCHARGEMENT
  // ════════════════════════════════════════════════════════════

  const nomFichier = `Bulletin_Paie_${nomEmploye.replace(/\s+/g, '_')}_${periode.replace(/\s+/g, '_')}.pdf`;

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

// ════════════════════════════════════════════════════════════
// PRINT BULLETIN PDF
// ════════════════════════════════════════════════════════════

export const printBulletinPDF = async (options: BulletinPDFOptions): Promise<{ success: boolean; error?: string }> => {
  try {
    const { paiement, employe, companyInfo, isDark = false } = options;
    const tempResult = await generateBulletinPDF({ paiement, employe, companyInfo, isDark }, '__temp__');
    if (!tempResult?.success) {
      const fallback = await generateBulletinPDF({ paiement, employe, companyInfo, isDark });
      return { success: fallback?.success || false, error: fallback?.error };
    }
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erreur impression Bulletin:', error);
    return { success: false, error: error.message };
  }
};

export default { generateBulletinPDF, printBulletinPDF };