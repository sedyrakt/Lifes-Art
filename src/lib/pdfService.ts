// src/lib/pdfService.ts — INDIGO PREMIUM PDF (FACTURE + QR CODE)
// ⭐ FIX: TVA isaky ny produit (tva_rate)
// ⭐ FIX: QR CODE Eo amin'ny zoro havanana ambany
// ⭐ FIX: "Cash" (Montant payé) eo ambany havia
// ⭐ FIX: Sous-total HT + TVA + Total TTC mazava
// ⭐ FIX: PRIMARY COLOR = INDIGO #4F46E5
// ⭐ FIX: DARK MODE BG = #0F172A
// ⭐ FIX (VAOVAO): AMPIO NY "Reste à payer"
// ⭐ FIX (VAOVAO): CAP NY CASH AMIN'NY TTC

export interface OrderProduct {
  id?: number;
  name?: string;
  nom?: string;
  designation?: string;
  libelle?: string;
  produit_nom?: string;
  product_name?: string;
  quantity?: number;
  quantite?: number;
  qty?: number;
  price?: number;
  prix?: number;
  prix_vente?: number;
  prix_unitaire?: number;
  total?: number;
  tva_rate?: number; // ⭐ NEW
}

export interface Order {
  id: number;
  numero?: string;
  client_nom?: string;
  client_name?: string;
  client_telephone?: string;
  client_email?: string;
  client_address?: string;
  total_ht?: number;
  total?: number;
  total_ttc?: number;
  date_commande?: string;
  created_at?: string;
  createdAt?: string;
  date?: string;
  status: string;
  statut?: string;
  products: OrderProduct[];
  observation?: string;
  remise?: number;
}

export interface PDFOptions {
  order: Order;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  companyName?: string;
  companyLogo?: string; // tsy ampiasaina
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companySiret?: string;
  companyImage?: string; // tsy ampiasaina
  companyTaxId?: string;
  companyRcs?: string;
  companyVatNumber?: string;
  paymentMethod?: string;
  paymentTerms?: string;
  dueDate?: string;
  montantPaye?: number; // Cash
  vendeur?: string;
}

// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A)
const COLORS = {
  primary: [79, 70, 229],        // ⭐ INDIGO 600
  primaryDark: [67, 56, 202],    // ⭐ INDIGO 700
  primaryLight: [129, 140, 248], // ⭐ INDIGO 400
  secondary: [38, 70, 83],
  text: [38, 70, 83],
  textMuted: [100, 116, 139],
  textLight: [148, 163, 184],
  border: [226, 232, 240],
  background: [248, 250, 252],
  backgroundSoft: [240, 247, 253],
  white: [255, 255, 255],
  success: [16, 185, 129],
  warning: [245, 158, 11],
  danger: [239, 68, 68],
  tableText: [38, 70, 83],
  tableBg: [255, 255, 255],
};

const DARK_COLORS = {
  primary: [79, 70, 229],        // ⭐ INDIGO 600
  primaryDark: [67, 56, 202],    // ⭐ INDIGO 700
  primaryLight: [129, 140, 248], // ⭐ INDIGO 400
  secondary: [248, 250, 252],
  text: [248, 250, 252],
  textMuted: [148, 163, 184],
  textLight: [148, 163, 184],
  border: [30, 41, 59],          // ⭐ SLATE 800
  background: [15, 23, 42],      // ⭐ SLATE 900 #0F172A
  backgroundSoft: [30, 41, 59],  // ⭐ SLATE 800
  white: [248, 250, 252],
  success: [52, 211, 153],
  warning: [251, 191, 36],
  danger: [251, 113, 133],
  tableText: [248, 250, 252],
  tableBg: [15, 23, 42],         // ⭐ SLATE 900 #0F172A
};

const formatMoney = (amount: number): string => {
  if (!amount && amount !== 0) return '0 Ar';
  return new Intl.NumberFormat('fr-FR', { useGrouping: true, maximumFractionDigits: 0 })
    .format(amount).replace(/\u202F/g, ' ') + ' Ar';
};

const formatDate = (date: Date | string, format: 'short' | 'long' = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Date invalide';
  return format === 'short' ? d.toLocaleDateString('fr-FR') : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const cleanText = (text: string): string => { if (!text) return ''; return text.normalize('NFC').trim(); };
const cleanForQR = (text: string): string => { if (!text) return ''; return text.normalize('NFC').trim(); };

export const generateOrderPDF = async (options: PDFOptions, isDark: boolean = false): Promise<any> => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const { default: QRCode } = await import('qrcode');

  await new Promise(resolve => setTimeout(resolve, 50));

  const {
    order, clientName, clientEmail, clientPhone, clientAddress,
    companyName, companyAddress, companyPhone, companyEmail,
    companySiret, companyTaxId, companyRcs, companyVatNumber,
    paymentMethod, paymentTerms, dueDate, montantPaye, vendeur
  } = options;

  const C = isDark ? DARK_COLORS : COLORS;

  const displayCompanyName = cleanText(companyName || "GSOFT");
  const displayCompanyAddress = cleanText(companyAddress || '');
  const displayCompanyPhone = cleanText(companyPhone || '');
  const displayCompanyEmail = cleanText(companyEmail || '');
  const displayCompanySiret = cleanText(companySiret || '');
  const displayCompanyTaxId = cleanText(companyTaxId || '');
  const displayCompanyRcs = cleanText(companyRcs || '');
  const displayCompanyVatNumber = cleanText(companyVatNumber || '');
  const displayPaymentMethod = cleanText(paymentMethod || 'Cash');
  const displayPaymentTerms = cleanText(paymentTerms || 'Comptant');
  const displayClientName = cleanText(clientName || 'Client');
  const displayClientEmail = cleanText(clientEmail || '');
  const displayClientPhone = cleanText(clientPhone || '');
  const displayClientAddress = cleanText(clientAddress || '');
  const displayVendeur = cleanText(vendeur || 'admin');

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  const [pr, pg, pb] = C.primary;
  const [sr, sg, sb] = C.secondary;
  const [br, bg, bb] = C.border;
  const [wr, wg, wb] = C.white;
  const [bgr, bgg, bgb] = C.background;

  const orderId = order.numero || (order.id ? `CMD-${String(order.id).padStart(6, '0')}` : 'CMD-000000');
  const products = Array.isArray(order.products) ? order.products : [];

  // ⭐⭐ FIX: KAJY NY TOTAL HT + TVA ISAKY PRODUIT ⭐⭐
  let totalHT = 0;
  let totalTVA = 0;
  
  if (products.length > 0) {
    products.forEach((p: any) => {
      const qty = Number(p.quantity || p.quantite || p.qty || 0);
      const price = Number(p.price || p.prix || p.prix_vente || p.prix_unitaire || 0);
      const lineTotal = qty * price;
      const tvaRate = Number(p.tva_rate) || 0; // Raha tsy misy dia 0
      totalHT += lineTotal;
      totalTVA += lineTotal * tvaRate;
    });
  } else {
    totalHT = order.total_ht || order.total || 0;
    totalTVA = 0;
  }

  const remiseAmount = Number(order.remise || 0);
  const totalHTAfterRemise = totalHT - remiseAmount;
  
  // Kajy ny Total TTC
  const totalTTC = totalHTAfterRemise + totalTVA;
  
  // Kajy ny taux TVA effective (raha samy hafa ny taux)
  const vatRate = totalHTAfterRemise > 0
    ? Math.round((totalTVA / totalHTAfterRemise) * 100 * 100) / 100
    : 0;

  const orderDate = order.date_commande || order.created_at || order.date || new Date().toISOString();
  const dueDateObj = dueDate ? new Date(dueDate) : new Date(orderDate);
  if (!dueDate) dueDateObj.setDate(dueDateObj.getDate() + 30);
  const displayDueDate = formatDate(dueDateObj, 'long');
  const statusLabel = order.status === 'Payé' || order.statut === 'Payé' ? 'Payé' : 'Non payé';

  // ⭐ FIX (VAOVAO): CAP NY CASH AMIN'NY TTC
  const cashAmount = Math.min(totalTTC, Number(montantPaye || 0));

  let qrImageBase64 = '';
  try {
    const qrData = [
      `TICKET`, `N°: ${cleanForQR(orderId)}`, `Client: ${cleanForQR(displayClientName)}`,
      `Montant: ${formatMoney(totalTTC)}`, `Date: ${formatDate(orderDate, 'short')}`,
      `Vendeur: ${cleanForQR(displayVendeur)}`
    ].filter(line => line !== '').join('\n');
    qrImageBase64 = await QRCode.toDataURL(qrData, {
      width: 120, margin: 2, errorCorrectionLevel: 'H',
      color: { dark: '#4F46E5', light: isDark ? '#0F172A' : '#FFFFFF' }
    });
  } catch (_) {}

  doc.setFillColor(pr, pg, pb);
  doc.rect(0, 0, pageWidth, 1.5, 'F');

  // ⭐ COMPANY NAME CENTRÉ
  const textStartY = 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(pr, pg, pb);
  doc.text(displayCompanyName, pageWidth / 2, textStartY, { align: 'center' });

  // ⭐ ADRESSE & TÉLÉPHONE CENTRÉ
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  let coordY = textStartY + 4;
  if (displayCompanyAddress) { doc.text(displayCompanyAddress, pageWidth / 2, coordY, { align: 'center' }); coordY += 3.2; }
  if (displayCompanyPhone) { doc.text(`Tél: ${displayCompanyPhone}`, pageWidth / 2, coordY, { align: 'center' }); coordY += 3.2; }
  if (displayCompanySiret || displayCompanyTaxId) {
    doc.text(`NIF/STAT: ${displayCompanySiret || displayCompanyTaxId || ''}`, pageWidth / 2, coordY, { align: 'center' });
    coordY += 3.2;
  }

  const separatorY = Math.max(coordY + 4, 32);
  doc.setDrawColor(br, bg, bb);
  doc.line(margin, separatorY, pageWidth - margin, separatorY);

  // ⭐ INFOS TICKET (N° Ticket, Vendeur, Client, Date)
  const infoY = separatorY + 4;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(sr, sg, sb);
  doc.text(`Ticket N°:`, margin, infoY);
  doc.text(`Vendeur:`, margin, infoY + 4);
  doc.text(`Client:`, margin, infoY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text(orderId, margin + 22, infoY);
  doc.text(displayVendeur, margin + 22, infoY + 4);
  doc.text(displayClientName, margin + 22, infoY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.text(formatDate(orderDate, 'short'), pageWidth - margin, infoY, { align: 'right' });

  const tableStartY = infoY + 14;
  let tableData: any[][] = [];

  if (!products || products.length === 0) {
    tableData = [['-', 'Aucun produit', '-', '-']];
  } else {
    tableData = products.map((item: any, index: number) => {
      const prodName = cleanText(
        item.produit_nom || item.name || item.nom || item.designation || item.libelle || item.product_name || 'Produit'
      );
      const prodQty = Number(item.quantity || item.quantite || item.qty || 0);
      const prodPrice = Number(item.prix_unitaire || item.price || item.prix || item.prix_vente || 0);
      const total = prodQty * prodPrice;
      return [prodQty.toString(), prodName, formatMoney(prodPrice), formatMoney(total)];
    });
  }

  autoTable(doc, {
    startY: tableStartY,
    head: [['QTÉ', 'ARTICLE', 'PRIX', 'TOTAL']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [pr, pg, pb],
      textColor: [wr, wg, wb],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 7,
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [pr, pg, pb]
    },
    bodyStyles: {
      textColor: C.tableText,
      fontSize: 6.5,
      cellPadding: 2,
      lineWidth: 0.15,
      lineColor: [br, bg, bb],
      fillColor: C.tableBg
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'left' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - (margin * 2),
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || tableStartY + 30;

  // ⭐ SOUS-TOTAL & TOTAL (Eo ambany havia)
  const totalsY = finalTableY + 5;
  const lineX = margin;
  const lineWidth = pageWidth - margin - 35; // Toerana ho an'ny QR Code

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);

  // Sous-total HT
  doc.text(`Sous-total HT:`, lineX, totalsY);
  doc.text(formatMoney(totalHTAfterRemise), lineX + 60, totalsY, { align: 'right' });

  // TVA (taux effective)
  doc.text(`TVA (${vatRate}%):`, lineX, totalsY + 5);
  doc.text(formatMoney(totalTVA), lineX + 60, totalsY + 5, { align: 'right' });

  // Total TTC (Bold & Blue)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(pr, pg, pb);
  doc.text(`TOTAL TTC:`, lineX, totalsY + 10);
  doc.text(formatMoney(totalTTC), lineX + 60, totalsY + 10, { align: 'right' });

  // Cash
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text(`Cash:`, lineX, totalsY + 15);
  doc.text(formatMoney(cashAmount), lineX + 60, totalsY + 15, { align: 'right' });

  // ⭐ FIX (VAOVAO): Ampio ny Reste à payer
  const montantRestantPDF = Math.max(0, totalTTC - cashAmount);
  doc.text(`Reste à payer:`, lineX, totalsY + 20);
  doc.text(formatMoney(montantRestantPDF), lineX + 60, totalsY + 20, { align: 'right' });

  // ⭐ QR CODE (Eo amin'ny zoro havanana ambany)
  const qrSize = 30;
  const qrX = pageWidth - margin - qrSize;
  const qrY = finalTableY + 5;

  if (qrImageBase64) {
    try {
      doc.addImage(qrImageBase64, 'PNG', qrX, qrY, qrSize, qrSize);
      doc.setFontSize(5);
      doc.setTextColor(C.textLight[0], C.textLight[1], C.textLight[2]);
      doc.text('Scan', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
    } catch (_) {}
  }

  // ⭐ FOOTER (Copyright)
  const infoYEnd = totalsY + 25;
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C.textLight[0], C.textLight[1], C.textLight[2]);
  doc.text(`© ${new Date().getFullYear()} ${displayCompanyName}`, pageWidth / 2, infoYEnd, { align: 'center' });

  return doc;
};

export const downloadPDF = async (options: PDFOptions, isDark: boolean = false) => {
  try {
    const doc = await generateOrderPDF(options, isDark);
    const orderId = options.order.numero || (options.order.id ? `CMD-${String(options.order.id).padStart(6, '0')}` : 'temp');
    const defaultFileName = `ticket_${orderId}.pdf`;
    const pdfData = doc.output('arraybuffer');

    if (window?.api?.utils?.saveFile) {
      const result = await window.api.utils.saveFile(pdfData, defaultFileName);
      if (result && result.canceled) return { success: false, canceled: true };
      if (!result || !result.success) return { success: false, error: result?.error || 'Erreur lors de la sauvegarde du fichier' };
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

export const printPDF = async (options: PDFOptions, isDark: boolean = false) => {
  try {
    const doc = await generateOrderPDF(options, isDark);
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

export const getPDFBlob = async (options: PDFOptions, isDark: boolean = false): Promise<Blob> => {
  const doc = await generateOrderPDF(options, isDark);
  return doc.output('blob');
};

export const getPDFBase64 = async (options: PDFOptions, isDark: boolean = false): Promise<string> => {
  const doc = await generateOrderPDF(options, isDark);
  return doc.output('datauristring');
};

export default { generateOrderPDF, downloadPDF, printPDF, getPDFBlob, getPDFBase64 };