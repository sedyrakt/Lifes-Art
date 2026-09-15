// src/lib/achatsPDFService.ts
// ⭐ Design aligné sur ventesPDFService.ts (FACTURE / DEVIS)
// ⭐ Header encadré + table fournisseur + table produits sans bordure
// ⭐ Totaux compacts + QR code + signatures

export interface AchatProduct {
  id?: number;
  nom?: string;
  designation?: string;
  produit_nom?: string;
  produit_code?: string;
  produit_unite?: string;
  reference?: string;
  ref?: string;
  code?: string;
  unite?: string;
  unit?: string;
  quantite?: number;
  quantity?: number;
  qty?: number;
  prix_unitaire?: number;
  prix_achat?: number;
  price?: number;
  prix?: number;
  total?: number;
  tva_rate?: number;
}

export interface Achat {
  id: number;
  reference?: string;
  numero?: string;
  fournisseur_id?: number;
  fournisseur_nom?: string;
  fournisseur_contact?: string;
  fournisseur_telephone?: string;
  fournisseur_email?: string;
  fournisseur_adresse?: string;
  fournisseur_nif?: string;
  fournisseur_stat?: string;
  fournisseur_rcs?: string;
  fournisseur_cif?: string;
  date_achat?: string;
  created_at?: string;
  total_ht?: number;
  total_ttc?: number;
  montant_paye?: number;
  montant_restant?: number;
  statut_paiement?: string;
  observation?: string;
  details?: AchatProduct[];
  products?: AchatProduct[];
}

export interface AchatsPDFOptions {
  achat: Achat;
  fournisseurName: string;
  fournisseurContact?: string;
  fournisseurPhone?: string;
  fournisseurEmail?: string;
  fournisseurAddress?: string;
  fournisseurNif?: string;
  fournisseurStat?: string;
  fournisseurRcs?: string;
  fournisseurCif?: string;

  companyName?: string;
  companyLogo?: string;
  companyImage?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyStat?: string;
  companySiret?: string;
  companyNif?: string;
  companyTaxId?: string;
  companyRcs?: string;
  companyVatNumber?: string;

  paymentMethod?: string;
  paymentTerms?: string;
  dueDate?: string;
  montantPaye?: number;
  vendeur?: string;
  reference?: string;
  libelle?: string;
  isPro?: boolean;

  details?: AchatProduct[];
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function parseTvaRate(value: any): number {
  return (value !== undefined && value !== null && value !== '') ? Number(value) : 0;
}

const formatMoney = (amount: number): string => {
  if (!amount && amount !== 0) return '0 Ar';
  return new Intl.NumberFormat('fr-FR', { useGrouping: true, maximumFractionDigits: 0 })
    .format(amount)
    .replace(/\u202F/g, ' ') + ' Ar';
};

const formatMoneyQR = (amount: number): string => {
  if (!amount && amount !== 0) return '0 Ar';
  return new Intl.NumberFormat('fr-FR', { useGrouping: false, maximumFractionDigits: 0 })
    .format(amount) + ' Ar';
};

const formatDate = (date: Date | string, format: 'short' | 'long' = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Date invalide';
  return format === 'short'
    ? d.toLocaleDateString('fr-FR')
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const cleanText = (text?: string): string => {
  if (!text) return '';
  return String(text).normalize('NFC').trim();
};

// ════════════════════════════════════════════════════════════
// QR CODE CONTENT
// ════════════════════════════════════════════════════════════

const buildQRContent = (params: {
  docType: string;
  orderId: string;
  fournisseurName: string;
  fournisseurPhone?: string;
  companyName: string;
  companyPhone?: string;
  companyEmail?: string;
  orderDate: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  montantPaye: number;
  montantRestant: number;
  paymentMethod?: string;
  paymentTerms?: string;
  products: any[];
}): string => {
  const {
    docType, orderId, fournisseurName, fournisseurPhone, companyName, companyPhone, companyEmail,
    orderDate, totalHT, totalTVA, totalTTC, montantPaye, montantRestant,
    paymentMethod, paymentTerms, products,
  } = params;

  const lines: string[] = [];

  lines.push(`${docType}:${orderId}`);
  lines.push(`DATE:${orderDate}`);
  lines.push(`FOURNISSEUR:${fournisseurName}`);
  if (fournisseurPhone) lines.push(`TEL:${fournisseurPhone}`);

  lines.push('');
  lines.push('PRODUITS:');
  if (products.length > 0) {
    products.forEach((p: any) => {
      const name = (p.produit_nom || p.designation || p.nom || p.name || 'Produit').slice(0, 25);
      const qty = Number(p.quantite || p.quantity || p.qty || 0);
      const price = Number(p.prix_unitaire || p.prix_achat || p.price || p.prix || 0);
      const rate = parseTvaRate(p.tva_rate);
      const lineTTC = qty * price * (1 + rate);
      lines.push(`${name} ${qty}x${formatMoneyQR(price)}=${formatMoneyQR(lineTTC)}`);
    });
  } else {
    lines.push('(aucun)');
  }

  lines.push('');
  lines.push(`HT:${formatMoneyQR(totalHT)}`);
  lines.push(`TVA:${formatMoneyQR(totalTVA)}`);
  lines.push(`TTC:${formatMoneyQR(totalTTC)}`);
  lines.push(`PAYE:${formatMoneyQR(montantPaye)}`);
  lines.push(`RESTE:${formatMoneyQR(montantRestant)}`);

  if (paymentMethod) lines.push(`MODE:${paymentMethod}`);
  if (paymentTerms) lines.push(`MODALITE:${paymentTerms}`);

  lines.push('');
  lines.push(companyName);
  if (companyPhone) lines.push(`TEL:${companyPhone}`);
  if (companyEmail) lines.push(`MAIL:${companyEmail}`);

  return lines.join('\n');
};

// ════════════════════════════════════════════════════════════
// GENERATE PDF
// ════════════════════════════════════════════════════════════

export const generateAchatPDF = async (options: AchatsPDFOptions, isDark: boolean = false): Promise<any> => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const { default: QRCode } = await import('qrcode');
  await new Promise((resolve) => setTimeout(resolve, 50));

  const {
    achat, fournisseurName,
    fournisseurContact, fournisseurPhone, fournisseurEmail, fournisseurAddress,
    fournisseurNif, fournisseurStat, fournisseurRcs, fournisseurCif,
    companyName, companyAddress, companyPhone, companyEmail, companyWebsite,
    companyStat, companySiret, companyNif, companyTaxId,
    paymentMethod, paymentTerms, dueDate, montantPaye, vendeur,
    reference, libelle, isPro, details: passedDetails,
  } = options;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  const docType = 'FACTURE FOURNISSEUR';

  const displayCompanyName = cleanText(companyName || "GSOFT");
  const displayFournisseur = cleanText(fournisseurName || achat.fournisseur_nom || 'Fournisseur');
  const displayVendeur = cleanText(vendeur || 'admin');

  // NIF/STAT entreprise
  const stat = cleanText(companyStat || companySiret || '');
  const nif = cleanText(companyNif || companyTaxId || '');

  console.log(`[PDF] ${docType} — NIF entreprise:`, nif, '| STAT entreprise:', stat);
  console.log(`[PDF] ${docType} — NIF fournisseur:`, fournisseurNif, '| STAT fournisseur:', fournisseurStat);

  const orderId = achat.reference || achat.numero || `ACH-${String(achat.id).padStart(6, '0')}`;

  const products: AchatProduct[] = Array.isArray(achat.details) && achat.details.length > 0
    ? achat.details
    : (Array.isArray(passedDetails) && passedDetails.length > 0
      ? passedDetails
      : (achat.products || []));

  // ════════════════════════════════════════════════════════════
  // CALCULS
  // ════════════════════════════════════════════════════════════
  let totalHT = 0;
  let totalTVA = 0;

  if (products.length > 0) {
    products.forEach((p: any) => {
      const qty = Number(p.quantite || p.quantity || p.qty || 0);
      const price = Number(p.prix_unitaire || p.prix_achat || p.price || p.prix || 0);
      const lineTotal = qty * price;
      const tvaRate = parseTvaRate(p.tva_rate);
      totalHT += lineTotal;
      totalTVA += lineTotal * tvaRate;
    });
  } else {
    totalHT = achat.total_ht || 0;
    totalTVA = 0;
  }

  const totalTTC = totalHT + totalTVA;
  const cashAmount = Math.min(totalTTC, Number(montantPaye || achat.montant_paye || 0));
  const montantRestant = Math.max(0, totalTTC - cashAmount);

  const orderDate = achat.date_achat || achat.created_at || new Date().toISOString();

  const paymentTermsDisplay = (paymentTerms || 'Sous 30 jours').replace(/Sous (\d+) jours/i, '$1 jours net');
  const libelleDisplay = libelle || paymentMethod || 'Espèces';

  const dueDateObj = dueDate ? new Date(dueDate) : new Date(orderDate);
  if (!dueDate) dueDateObj.setDate(dueDateObj.getDate() + 30);
  const dueDateFR = formatDate(dueDateObj, 'long');

  // ════════════════════════════════════════════════════════════
  // QR CODE
  // ════════════════════════════════════════════════════════════
  let qrImageBase64 = '';
  try {
    const qrContent = buildQRContent({
      docType,
      orderId,
      fournisseurName: displayFournisseur,
      fournisseurPhone: fournisseurPhone || fournisseurContact || '',
      companyName: displayCompanyName,
      companyPhone: companyPhone || '',
      companyEmail: companyEmail || '',
      orderDate: formatDate(orderDate, 'long'),
      totalHT,
      totalTVA,
      totalTTC,
      montantPaye: cashAmount,
      montantRestant,
      paymentMethod,
      paymentTerms,
      products,
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
  // HEADER BOX — compact (36mm)
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
  doc.text(nif || '—', rightX + 14, ry);
  ry += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('STAT :', rightX, ry);
  doc.setFont('helvetica', 'normal');
  doc.text(stat || '—', rightX + 14, ry);

  // ════════════════════════════════════════════════════════════
  // TITLE — FACTURE FOURNISSEUR centré + badge Pro
  // ════════════════════════════════════════════════════════════
  let ty = boxTop + boxHeight + 7;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(docType, pageWidth / 2, ty, { align: 'center' });
  const titleWidth = doc.getTextWidth(docType);
  doc.line(pageWidth / 2 - titleWidth / 2, ty + 1, pageWidth / 2 + titleWidth / 2, ty + 1);

  if (isPro !== false) {
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    const proText = 'Pro';
    doc.text(proText, pageWidth - margin - 5, ty, { align: 'right' });
    const proWidth = doc.getTextWidth(proText);
    doc.line(pageWidth - margin - 5 - proWidth, ty + 1, pageWidth - margin - 5, ty + 1);
  }

  // ════════════════════════════════════════════════════════════
  // INFO GRID
  // ════════════════════════════════════════════════════════════
  let iy = ty + 9;
  const labelX1 = margin + 2;
  const valueX1 = margin + 62;
  const labelX2 = pageWidth / 2 + 8;
  const valueX2 = pageWidth / 2 + 55;

  doc.setFontSize(8.5);
  const orderDateFR = formatDate(orderDate, 'long');
  const refValue = reference || orderId;

  doc.setFont('helvetica', 'bold'); doc.text('Référence', labelX1, iy);
  doc.setFont('helvetica', 'normal'); doc.text(refValue, valueX1, iy);
  doc.setFont('helvetica', 'bold'); doc.text('Livraison', labelX2, iy);
  doc.setFont('helvetica', 'normal'); doc.text('Réception', valueX2, iy);
  iy += 5;

  doc.setFont('helvetica', 'bold'); doc.text('Date', labelX1, iy);
  doc.setFont('helvetica', 'normal'); doc.text(orderDateFR, valueX1, iy);
  doc.setFont('helvetica', 'bold'); doc.text('Modalité de paiement', labelX2, iy);
  doc.setFont('helvetica', 'normal'); doc.text(paymentTermsDisplay, valueX2, iy);
  iy += 5;

  doc.setFont('helvetica', 'bold'); doc.text('Date d\'achat', labelX1, iy);
  doc.setFont('helvetica', 'normal'); doc.text(orderDateFR, valueX1, iy);
  doc.setFont('helvetica', 'bold'); doc.text('Paiement dû le', labelX2, iy);
  doc.setFont('helvetica', 'normal'); doc.text(dueDateFR, valueX2, iy);
  iy += 5;

  doc.setFont('helvetica', 'bold'); doc.text('Contact fournisseur', labelX1, iy);
  doc.setFont('helvetica', 'normal'); doc.text(fournisseurContact || fournisseurPhone || displayVendeur, valueX1, iy);
  doc.setFont('helvetica', 'bold'); doc.text('Libellé', labelX2, iy);
  doc.setFont('helvetica', 'normal'); doc.text(libelleDisplay, valueX2, iy);
  iy += 6;

  // ════════════════════════════════════════════════════════════
  // FOURNISSEUR TABLE — encadrée
  // ════════════════════════════════════════════════════════════
  autoTable(doc, {
    startY: iy,
    head: [['Fournisseur :', 'NIF', 'STAT', 'RCS', 'CIF', 'Adresse', 'Contact']],
    body: [[
      displayFournisseur,
      fournisseurNif || '',
      fournisseurStat || '',
      fournisseurRcs || '',
      fournisseurCif || '',
      fournisseurAddress || '',
      fournisseurContact || fournisseurPhone || '',
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255], textColor: [0, 0, 0],
      fontStyle: 'bold', fontSize: 7.5, cellPadding: 1.8,
      lineWidth: 0.4, lineColor: [0, 0, 0],
    },
    bodyStyles: {
      textColor: [0, 0, 0], fontSize: 7.5, cellPadding: 2.5,
      lineWidth: 0.4, lineColor: [0, 0, 0], valign: 'middle', minCellHeight: 7,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 30 },
      3: { cellWidth: 22 },
      4: { cellWidth: 24 },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
  });

  let afterFournisseur = (doc as any).lastAutoTable?.finalY || iy + 15;
  afterFournisseur += 5;

  // ════════════════════════════════════════════════════════════
  // PRODUCTS TABLE — SANS BORDURE
  // ════════════════════════════════════════════════════════════
  let tableData: any[][] = [];
  if (products.length > 0) {
    tableData = products.map((item: any) => {
      const ref = cleanText(
        item.reference || item.ref || item.code || item.produit_code || ''
      ) || '-';

      const desc = cleanText(
        item.designation || item.libelle || item.produit_nom ||
        item.name || item.nom || 'Produit'
      );

      const qty = Number(item.quantite || item.quantity || item.qty || 0);
      const unite = cleanText(item.produit_unite || item.unite || item.unit || 'pièce');
      const prixHT = Number(item.prix_unitaire || item.prix_achat || item.price || item.prix || 0);

      const tvaRate = parseTvaRate(item.tva_rate);
      const tvaDisplay = tvaRate > 0 ? `${(tvaRate * 100).toFixed(0)}%` : 'N/A';

      const totalHTLigne = qty * prixHT;
      const totalTTCLigne = totalHTLigne * (1 + tvaRate);

      return [
        ref,
        desc,
        qty.toString(),
        unite,
        formatMoney(prixHT),
        tvaDisplay,
        formatMoney(totalTTCLigne),
      ];
    });
  } else {
    tableData = [['-', 'Aucun produit', '-', '-', '-', '-', '-']];
  }

  autoTable(doc, {
    startY: afterFournisseur,
    head: [['RÉFÉRENCE', 'DESCRIPTION', 'QTÉ', 'UNITÉ', 'PRIX U. HT', 'TVA %', 'TOTAL TTC']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5,
      lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 },
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      fontSize: 8.5,
      cellPadding: 2.5,
      lineWidth: { bottom: 0.2, top: 0, left: 0, right: 0 },
      lineColor: [200, 200, 200],
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'left' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  let afterProducts = (doc as any).lastAutoTable?.finalY || afterFournisseur + 40;
  afterProducts += 8;

  // ════════════════════════════════════════════════════════════
  // TOTALS — compact
  // ════════════════════════════════════════════════════════════
  const totalsRightX = pageWidth - margin - 10;
  const totalsLeftX = totalsRightX - 80;
  const lineHeight = 4.5;

  afterProducts += 14;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  doc.text('Total HT', totalsLeftX, afterProducts);
  doc.text(formatMoney(totalHT), totalsRightX, afterProducts, { align: 'right' });

  afterProducts += lineHeight;
  doc.text('TVA N/A', totalsLeftX, afterProducts);
  doc.text(totalTVA > 0 ? formatMoney(totalTVA) : '0 Ar', totalsRightX, afterProducts, { align: 'right' });

  afterProducts += 2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(totalsLeftX, afterProducts, totalsRightX, afterProducts);
  afterProducts += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Total TTC', totalsLeftX, afterProducts);
  doc.text(formatMoney(totalTTC), totalsRightX, afterProducts, { align: 'right' });

  afterProducts += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Payé', totalsLeftX, afterProducts);
  doc.text(formatMoney(cashAmount), totalsRightX, afterProducts, { align: 'right' });

  afterProducts += lineHeight;
  doc.setFont('helvetica', 'bold');
  doc.text('Reste à payer', totalsLeftX, afterProducts);
  doc.text(formatMoney(montantRestant), totalsRightX, afterProducts, { align: 'right' });

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
  // N.B
  // ════════════════════════════════════════════════════════════
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('* N.B : Tva non assujetti', margin, afterProducts);
  afterProducts += 6;

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
  doc.text('Signature + cachet entreprise', sep1X + 3, afterProducts);
  const sig1W = doc.getTextWidth('Signature + cachet entreprise');
  doc.line(sep1X + 3, afterProducts + 1, sep1X + 3 + sig1W, afterProducts + 1);

  doc.text('Signature + cachet fournisseur', sep2X + 3, afterProducts);
  const sig2W = doc.getTextWidth('Signature + cachet fournisseur');
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

  return doc;
};

// ════════════════════════════════════════════════════════════
// EXPORTS ANNEXES
// ════════════════════════════════════════════════════════════

export const downloadAchatPDF = async (options: AchatsPDFOptions, isDark: boolean = false) => {
  try {
    const doc = await generateAchatPDF(options, isDark);
    const orderId = options.achat.reference || options.achat.numero || `ACH-${String(options.achat.id).padStart(6, '0')}`;
    const defaultFileName = `achat_${orderId}.pdf`;
    const pdfData = doc.output('arraybuffer');

    if (window?.api?.utils?.saveFile) {
      const result = await window.api.utils.saveFile(pdfData, defaultFileName);
      if (result && result.canceled) return { success: false, canceled: true };
      if (!result || !result.success) return { success: false, error: result?.error || 'Erreur sauvegarde' };
      return { success: true, filePath: result.filePath };
    } else {
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { success: true, filePath: defaultFileName };
    }
  } catch (error: any) {
    console.error('❌ Erreur génération PDF Achat:', error);
    return { success: false, error: error.message };
  }
};

export const printAchatPDF = async (options: AchatsPDFOptions, isDark: boolean = false) => {
  try {
    const doc = await generateAchatPDF(options, isDark);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erreur impression PDF Achat:', error);
    return { success: false, error: error.message };
  }
};

export const getAchatPDFBlob = async (options: AchatsPDFOptions, isDark: boolean = false): Promise<Blob> => {
  const doc = await generateAchatPDF(options, isDark);
  return doc.output('blob');
};

export const getAchatPDFBase64 = async (options: AchatsPDFOptions, isDark: boolean = false): Promise<string> => {
  const doc = await generateAchatPDF(options, isDark);
  return doc.output('datauristring');
};

export default { generateAchatPDF, downloadAchatPDF, printAchatPDF, getAchatPDFBlob, getAchatPDFBase64 };