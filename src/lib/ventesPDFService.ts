// src/lib/ventesPDFService.ts
// ⭐ Design aligné sur pdfService.ts (FACTURE commande)
// ⭐ FIX: unité via produit_unite (JOIN produits)
// ⭐ FIX: NIF/STAT entreprise + NIF/STAT/RCS/CIF client
// ⭐ NEW: Distinction DEVIS vs FACTURE
//    - DEVIS   : "Valable jusqu'au", PAS de modalité paiement / livraison / libellé / frais livraison, 1 signature
//    - FACTURE : "Paiement dû le", toutes colonnes (Livraison, Modalité, Libellé), frais livraison, 2 signatures
// ⭐ NEW: validiteJours paramétrable (défaut 30)
// ⭐ FIX: Table client compacte (cellPadding réduit) + Adresse élargie
// ⭐ FIX: DEVIS ne calcule PAS les frais de livraison dans le total

export interface VenteProduct {
  id?: number;
  name?: string;
  nom?: string;
  designation?: string;
  libelle?: string;
  produit_nom?: string;
  produit_code?: string;
  produit_unite?: string;
  product_name?: string;
  reference?: string;
  ref?: string;
  code?: string;
  unite?: string;
  unit?: string;
  quantity?: number;
  quantite?: number;
  qty?: number;
  price?: number;
  prix?: number;
  prix_vente?: number;
  prix_unitaire?: number;
  total?: number;
  tva_rate?: number;
}

export interface Vente {
  id: number;
  numero?: string;
  reference?: string;
  client_nom?: string;
  client_name?: string;
  client_telephone?: string;
  client_email?: string;
  client_address?: string;
  client_nif?: string;
  client_stat?: string;
  client_rcs?: string;
  client_cif?: string;
  client_contact?: string;
  total_ht?: number;
  total?: number;
  total_ttc?: number;
  date_devis?: string;
  date_facture?: string;
  created_at?: string;
  createdAt?: string;
  date?: string;
  status: string;
  statut?: string;
  products: VenteProduct[];
  details?: VenteProduct[];
  observation?: string;
  remise?: number;
  frais_livraison?: number;
  livraison?: string;
  mode_paiement?: string;
  modalite_paiement?: string;
}

export interface VentesPDFOptions {
  vente: Vente;
  type: 'devis' | 'factures';

  // ═══ CLIENT ═══
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientNif?: string;
  clientStat?: string;
  clientRcs?: string;
  clientCif?: string;
  clientContact?: string;

  // ═══ ENTREPRISE ═══
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

  // ═══ PAIEMENT ═══
  paymentMethod?: string;
  paymentTerms?: string;
  dueDate?: string;
  montantPaye?: number;
  vendeur?: string;
  reference?: string;
  livraison?: string;
  libelle?: string;
  isPro?: boolean;

  // ⭐ Validité devis (en jours)
  validiteJours?: number;

  details?: VenteProduct[];
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
  clientName: string;
  clientPhone?: string;
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
  isDevis: boolean;
}): string => {
  const {
    docType, orderId, clientName, clientPhone, companyName, companyPhone, companyEmail,
    orderDate, totalHT, totalTVA, totalTTC, montantPaye, montantRestant,
    paymentMethod, paymentTerms, products, isDevis,
  } = params;

  const lines: string[] = [];

  lines.push(`${docType}:${orderId}`);
  lines.push(`DATE:${orderDate}`);
  lines.push(`CLIENT:${clientName}`);
  if (clientPhone) lines.push(`TEL:${clientPhone}`);

  lines.push('');
  lines.push('PRODUITS:');
  if (products.length > 0) {
    products.forEach((p: any) => {
      const name = (p.designation || p.libelle || p.produit_nom || p.name || p.nom || 'Produit').slice(0, 25);
      const qty = Number(p.quantity || p.quantite || p.qty || 0);
      const price = Number(p.prix_unitaire || p.price || p.prix || 0);
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
  if (!isDevis) {
    lines.push(`PAYE:${formatMoneyQR(montantPaye)}`);
    lines.push(`RESTE:${formatMoneyQR(montantRestant)}`);
  }

  if (paymentMethod && !isDevis) lines.push(`MODE:${paymentMethod}`);
  if (paymentTerms && !isDevis) lines.push(`MODALITE:${paymentTerms}`);

  lines.push('');
  lines.push(companyName);
  if (companyPhone) lines.push(`TEL:${companyPhone}`);
  if (companyEmail) lines.push(`MAIL:${companyEmail}`);

  return lines.join('\n');
};

// ════════════════════════════════════════════════════════════
// GENERATE PDF
// ════════════════════════════════════════════════════════════

export const generateVentePDF = async (options: VentesPDFOptions, isDark: boolean = false): Promise<any> => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const { default: QRCode } = await import('qrcode');
  await new Promise((resolve) => setTimeout(resolve, 50));

  const {
    vente, type,
    clientName, clientEmail, clientPhone, clientAddress,
    clientNif, clientStat, clientRcs, clientCif, clientContact,
    companyName, companyAddress, companyPhone, companyEmail, companyWebsite,
    companyStat, companySiret, companyNif, companyTaxId,
    paymentMethod, paymentTerms, dueDate, montantPaye, vendeur,
    reference, livraison, libelle, isPro, details: passedDetails,
    validiteJours,
  } = options;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // ⭐ Différenciation DEVIS vs FACTURE
  const isDevis = type === 'devis';
  const docType = isDevis ? 'DEVIS' : 'FACTURE';

  // ⭐ Validité paramétrable
  const validiteDays = Number(validiteJours) > 0 ? Number(validiteJours) : 30;

  const displayCompanyName = cleanText(companyName || "GSOFT");
  const displayClientName = cleanText(clientName || 'Client');
  const displayVendeur = cleanText(vendeur || 'admin');

  // NIF/STAT entreprise
  const stat = cleanText(companyStat || companySiret || '');
  const nif = cleanText(companyNif || companyTaxId || '');

  // ⭐ Mode / Modalité / Frais livraison (avy amin'ny vente na options)
  const modePaiementFromVente = cleanText((vente as any)?.mode_paiement || '');
  const modaliteFromVente = cleanText((vente as any)?.modalite_paiement || '');
  const fraisLivraisonFromVente = Number((vente as any)?.frais_livraison || 0);

  console.log(`[PDF] ${docType} — NIF entreprise:`, nif, '| STAT entreprise:', stat);
  console.log(`[PDF] ${docType} — Validité:`, validiteDays, 'jours');
  console.log(`[PDF] ${docType} — Mode paiement:`, modePaiementFromVente || paymentMethod, '| Modalité:', modaliteFromVente || paymentTerms);
  console.log(`[PDF] ${docType} — Frais livraison:`, fraisLivraisonFromVente);
  console.log(`[PDF] ${docType} — NIF client:`, clientNif, '| STAT client:', clientStat, '| RCS client:', clientRcs, '| CIF client:', clientCif);

  const orderId = vente.reference || vente.numero || (isDevis
    ? `DEV-${String(vente.id).padStart(6, '0')}`
    : `FAC-${String(vente.id).padStart(6, '0')}`);

  const products: VenteProduct[] = Array.isArray(vente.details) && vente.details.length > 0
    ? vente.details
    : (Array.isArray(passedDetails) && passedDetails.length > 0
      ? passedDetails
      : (vente.products || []));

  // ⭐⭐⭐ FIX: DEVIS tsy manisa frais livraison
  const fraisLivraisonOrder = isDevis ? 0 : (fraisLivraisonFromVente || Number((vente as any)?.frais_livraison || 0));

  // ⭐⭐⭐ FIX: Mode / Modalité (DEVIS tsy mampiseho)
  const modePaiementDisplay = isDevis ? '' : (modePaiementFromVente || paymentMethod || 'Espèces');
  const modaliteDisplay = isDevis ? '' : (modaliteFromVente || paymentTerms || 'Immediat');

  // ════════════════════════════════════════════════════════════
  // CALCULS
  // ════════════════════════════════════════════════════════════
  let totalHT = 0;
  let totalTVA = 0;

  if (products.length > 0) {
    products.forEach((p: any) => {
      const qty = Number(p.quantity || p.quantite || p.qty || 0);
      const price = Number(p.price || p.prix || p.prix_vente || p.prix_unitaire || 0);
      const lineTotal = qty * price;
      const tvaRate = parseTvaRate(p.tva_rate);
      totalHT += lineTotal;
      totalTVA += lineTotal * tvaRate;
    });
  } else {
    totalHT = vente.total_ht || vente.total || 0;
    totalTVA = 0;
  }

  const remiseAmount = Number(vente.remise || 0);
  const totalHTAfterRemise = totalHT - remiseAmount;
  const totalTTC = totalHTAfterRemise + totalTVA + fraisLivraisonOrder;

  const orderDate = vente.date_devis || vente.date_facture || vente.created_at || new Date().toISOString();
  const cashAmount = Math.min(totalTTC, Number(montantPaye || 0));
  const montantRestant = Math.max(0, totalTTC - cashAmount);

  const livraisonDisplay = isDevis ? 'Non' : ((livraison === 'Oui' || livraison === 'Non')
    ? livraison
    : (fraisLivraisonOrder > 0 ? 'Oui' : 'Non'));

  // ⭐ Validité paramétrable
  const validUntilObj = new Date(orderDate);
  validUntilObj.setDate(validUntilObj.getDate() + validiteDays);
  const validUntilFR = formatDate(validUntilObj, 'long');

  // ════════════════════════════════════════════════════════════
  // QR CODE
  // ════════════════════════════════════════════════════════════
  let qrImageBase64 = '';
  try {
    const qrContent = buildQRContent({
      docType,
      orderId,
      clientName: displayClientName,
      clientPhone: clientPhone || clientContact || '',
      companyName: displayCompanyName,
      companyPhone: companyPhone || '',
      companyEmail: companyEmail || '',
      orderDate: formatDate(orderDate, 'long'),
      totalHT: totalHTAfterRemise,
      totalTVA,
      totalTTC,
      montantPaye: cashAmount,
      montantRestant,
      paymentMethod: modePaiementDisplay,
      paymentTerms: modaliteDisplay,
      products,
      isDevis,
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
  // TITLE — FACTURE / DEVIS centré + badge Pro
  // ════════════════════════════════════════════════════════════
  let ty = boxTop + boxHeight + 7;
  doc.setFontSize(13);
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
  // INFO GRID — adapté selon DEVIS / FACTURE
  // ════════════════════════════════════════════════════════════
  let iy = ty + 9;
  const labelX1 = margin + 2;
  const valueX1 = margin + 62;
  const labelX2 = pageWidth / 2 + 8;
  const valueX2 = pageWidth / 2 + 55;

  doc.setFontSize(8.5);
  const orderDateFR = formatDate(orderDate, 'long');
  const refValue = reference || orderId;
  const paymentTermsDisplay = modaliteDisplay.replace(/Sous (\d+) jours/i, '$1 jours net');
  const libelleDisplay = modePaiementDisplay || 'Espèces';

  const dueDateObj = dueDate ? new Date(dueDate) : new Date(orderDate);
  if (!dueDate) dueDateObj.setDate(dueDateObj.getDate() + 30);
  const dueDateFR = formatDate(dueDateObj, 'long');

  if (isDevis) {
    // ═══════════════════════════════════════════════════════════
    // DEVIS : 3 lignes (SANS Livraison, SANS Modalité, SANS Libellé)
    // ═══════════════════════════════════════════════════════════

    // Ligne 1
    doc.setFont('helvetica', 'bold'); doc.text('Référence', labelX1, iy);
    doc.setFont('helvetica', 'normal'); doc.text(refValue, valueX1, iy);
    doc.setFont('helvetica', 'bold'); doc.text('Validité', labelX2, iy);
    doc.setFont('helvetica', 'normal'); doc.text(`${validiteDays} jours`, valueX2, iy);
    iy += 5;

    // Ligne 2
    doc.setFont('helvetica', 'bold'); doc.text('Date', labelX1, iy);
    doc.setFont('helvetica', 'normal'); doc.text(orderDateFR, valueX1, iy);
    doc.setFont('helvetica', 'bold'); doc.text('Valable jusqu\'au', labelX2, iy);
    doc.setFont('helvetica', 'normal'); doc.text(validUntilFR, valueX2, iy);
    iy += 5;

    // Ligne 3
    doc.setFont('helvetica', 'bold'); doc.text('Date de la vente/prestation', labelX1, iy);
    doc.setFont('helvetica', 'normal'); doc.text(orderDateFR, valueX1, iy);
    doc.setFont('helvetica', 'bold'); doc.text('Contact client', labelX2, iy);
    doc.setFont('helvetica', 'normal'); doc.text(clientContact || clientPhone || displayVendeur, valueX2, iy);
    iy += 6;

  } else {
    // ═══════════════════════════════════════════════════════════
    // FACTURE : 4 lignes complètes (Livraison, Modalité, Paiement, Libellé)
    // ═══════════════════════════════════════════════════════════

    // Ligne 1
    doc.setFont('helvetica', 'bold'); doc.text('Référence', labelX1, iy);
    doc.setFont('helvetica', 'normal'); doc.text(refValue, valueX1, iy);
    doc.setFont('helvetica', 'bold'); doc.text('Livraison', labelX2, iy);
    doc.setFont('helvetica', 'normal'); doc.text(livraisonDisplay, valueX2, iy);
    iy += 5;

    // Ligne 2
    doc.setFont('helvetica', 'bold'); doc.text('Date', labelX1, iy);
    doc.setFont('helvetica', 'normal'); doc.text(orderDateFR, valueX1, iy);
    doc.setFont('helvetica', 'bold'); doc.text('Modalité de paiement', labelX2, iy);
    doc.setFont('helvetica', 'normal'); doc.text(paymentTermsDisplay, valueX2, iy);
    iy += 5;

    // Ligne 3
    doc.setFont('helvetica', 'bold'); doc.text('Date de la vente/prestation', labelX1, iy);
    doc.setFont('helvetica', 'normal'); doc.text(orderDateFR, valueX1, iy);
    doc.setFont('helvetica', 'bold'); doc.text('Paiement dû le', labelX2, iy);
    doc.setFont('helvetica', 'normal'); doc.text(dueDateFR, valueX2, iy);
    iy += 5;

    // Ligne 4
    doc.setFont('helvetica', 'bold'); doc.text('Contact client', labelX1, iy);
    doc.setFont('helvetica', 'normal'); doc.text(clientContact || clientPhone || displayVendeur, valueX1, iy);
    doc.setFont('helvetica', 'bold'); doc.text('Libellé', labelX2, iy);
    doc.setFont('helvetica', 'normal'); doc.text(libelleDisplay, valueX2, iy);
    iy += 6;
  }

  // ════════════════════════════════════════════════════════════
  // CLIENT TABLE
  // ════════════════════════════════════════════════════════════
  if (isDevis) {
    const clientCols: { label: string; value: string; width: number | 'auto' }[] = [
      { label: 'Client :', value: displayClientName, width: 35 },
    ];
    if (clientNif) clientCols.push({ label: 'NIF', value: clientNif, width: 26 });
    if (clientStat) clientCols.push({ label: 'STAT', value: clientStat, width: 26 });
    if (clientRcs) clientCols.push({ label: 'RCS', value: clientRcs, width: 22 });
    if (clientCif) clientCols.push({ label: 'CIF', value: clientCif, width: 22 });
    if (clientAddress) clientCols.push({ label: 'Adresse', value: clientAddress, width: 'auto' });
    if (clientContact || clientPhone) clientCols.push({ label: 'Contact', value: clientContact || clientPhone || '', width: 28 });

    autoTable(doc, {
      startY: iy,
      head: [clientCols.map(c => c.label)],
      body: [clientCols.map(c => c.value)],
      theme: 'grid',
      headStyles: {
        fillColor: [255, 255, 255], textColor: [0, 0, 0],
        fontStyle: 'bold', fontSize: 7.5, cellPadding: 1.2,
        lineWidth: 0.4, lineColor: [0, 0, 0],
      },
      bodyStyles: {
        textColor: [0, 0, 0], fontSize: 7.5, cellPadding: 1.4,
        lineWidth: 0.4, lineColor: [0, 0, 0], valign: 'middle', minCellHeight: 5,
      },
      columnStyles: Object.fromEntries(clientCols.map((c, i) => [i, { cellWidth: c.width }])),
      margin: { left: margin, right: margin },
    });
  } else {
    autoTable(doc, {
      startY: iy,
      head: [['Client :', 'NIF', 'STAT', 'RCS', 'CIF', 'Adresse', 'Contact']],
      body: [[
        displayClientName,
        clientNif || '',
        clientStat || '',
        clientRcs || '',
        clientCif || '',
        clientAddress || '',
        clientContact || clientPhone || '',
      ]],
      theme: 'grid',
      headStyles: {
        fillColor: [255, 255, 255], textColor: [0, 0, 0],
        fontStyle: 'bold', fontSize: 7.5, cellPadding: 1.2,
        lineWidth: 0.4, lineColor: [0, 0, 0],
      },
      bodyStyles: {
        textColor: [0, 0, 0], fontSize: 7.5, cellPadding: 1.4,
        lineWidth: 0.4, lineColor: [0, 0, 0], valign: 'middle', minCellHeight: 5,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 22 },
        2: { cellWidth: 26 },
        3: { cellWidth: 18 },
        4: { cellWidth: 20 },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 28 },
      },
      margin: { left: margin, right: margin },
    });
  }

  let afterClient = (doc as any).lastAutoTable?.finalY || iy + 15;
  afterClient += 5;

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
        item.name || item.nom || item.product_name || 'Produit'
      );

      const qty = Number(item.quantity || item.quantite || item.qty || 0);
      const unite = cleanText(item.produit_unite || item.unite || item.unit || 'pièce');
      const prixHT = Number(item.prix_unitaire || item.price || item.prix || item.prix_vente || 0);

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
    startY: afterClient,
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

  let afterProducts = (doc as any).lastAutoTable?.finalY || afterClient + 40;
  afterProducts += 8;

  // ════════════════════════════════════════════════════════════
  // TOTALS
  // ════════════════════════════════════════════════════════════
  const totalsRightX = pageWidth - margin - 10;
  const totalsLeftX = totalsRightX - 80;
  const lineHeight = 4.5;

  afterProducts += 14;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  doc.text('Total HT', totalsLeftX, afterProducts);
  doc.text(formatMoney(totalHTAfterRemise), totalsRightX, afterProducts, { align: 'right' });

  afterProducts += lineHeight;
  doc.text('TVA N/A', totalsLeftX, afterProducts);
  doc.text(totalTVA > 0 ? formatMoney(totalTVA) : '0 Ar', totalsRightX, afterProducts, { align: 'right' });

  // ⭐⭐⭐ FIX: Frais livraison ao amin'ny FACTURE IHANY
  if (!isDevis && fraisLivraisonOrder > 0) {
    afterProducts += lineHeight;
    doc.text('Frais de livraison', totalsLeftX, afterProducts);
    doc.text(formatMoney(fraisLivraisonOrder), totalsRightX, afterProducts, { align: 'right' });
  }

  afterProducts += 2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(totalsLeftX, afterProducts, totalsRightX, afterProducts);
  afterProducts += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Total TTC', totalsLeftX, afterProducts);
  doc.text(formatMoney(totalTTC), totalsRightX, afterProducts, { align: 'right' });

  afterProducts += 10;

  // ════════════════════════════════════════════════════════════
  // QR CODE
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
  // N.B — message différent selon DEVIS / FACTURE
  // ════════════════════════════════════════════════════════════
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  if (isDevis) {
    doc.text(`* Ce devis est valable ${validiteDays} jours à compter de sa date d'émission.`, margin, afterProducts);
  } else {
    doc.text('* N.B : Tva non assujetti', margin, afterProducts);
  }
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

  if (isDevis) {
    // DEVIS : une seule signature
    doc.setFontSize(8.5);
    doc.text('Bon pour accord - Signature client', sep1X + 3, afterProducts);
    const sigW = doc.getTextWidth('Bon pour accord - Signature client');
    doc.line(sep1X + 3, afterProducts + 1, sep1X + 3 + sigW, afterProducts + 1);

    afterProducts += 7;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.setLineCap('butt');
    doc.line(sep1X, afterProducts - 12, sep1X, afterProducts + 23);
  } else {
    // FACTURE : deux signatures
    doc.setFontSize(8.5);
    doc.text('Signature + cachet entreprise', sep1X + 3, afterProducts);
    const sig1W = doc.getTextWidth('Signature + cachet entreprise');
    doc.line(sep1X + 3, afterProducts + 1, sep1X + 3 + sig1W, afterProducts + 1);

    doc.text('Signature + cachet client', sep2X + 3, afterProducts);
    const sig2W = doc.getTextWidth('Signature + cachet client');
    doc.line(sep2X + 3, afterProducts + 1, sep2X + 3 + sig2W, afterProducts + 1);

    afterProducts += 7;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.setLineCap('butt');
    doc.line(sep1X, afterProducts - 12, sep1X, afterProducts + 23);
  }

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

export const downloadVentePDF = async (options: VentesPDFOptions, isDark: boolean = false) => {
  try {
    const doc = await generateVentePDF(options, isDark);
    const orderId = options.vente.reference || options.vente.numero || (options.type === 'devis'
      ? `DEV-${String(options.vente.id).padStart(6, '0')}`
      : `FAC-${String(options.vente.id).padStart(6, '0')}`);
    const defaultFileName = `${options.type === 'devis' ? 'devis' : 'facture'}_${orderId}.pdf`;
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
    console.error('❌ Erreur génération PDF:', error);
    return { success: false, error: error.message };
  }
};

export const printVentePDF = async (options: VentesPDFOptions, isDark: boolean = false) => {
  try {
    const doc = await generateVentePDF(options, isDark);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erreur impression PDF:', error);
    return { success: false, error: error.message };
  }
};

export const getVentePDFBlob = async (options: VentesPDFOptions, isDark: boolean = false): Promise<Blob> => {
  const doc = await generateVentePDF(options, isDark);
  return doc.output('blob');
};

export const getVentePDFBase64 = async (options: VentesPDFOptions, isDark: boolean = false): Promise<string> => {
  const doc = await generateVentePDF(options, isDark);
  return doc.output('datauristring');
};

export default { generateVentePDF, downloadVentePDF, printVentePDF, getVentePDFBlob, getVentePDFBase64 };