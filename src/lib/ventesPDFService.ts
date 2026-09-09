// src/lib/ventesPDFService.ts
export interface VenteProduct {
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
  details?: VenteProduct[]; // ⭐ NOVAINA: Misy ny tva_rate voa-enrichie
  observation?: string;
  remise?: number;
}

export interface VentesPDFOptions {
  vente: Vente;
  type: 'devis' | 'factures';
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companySiret?: string;
  companyImage?: string;
  companyTaxId?: string;
  companyRcs?: string;
  companyVatNumber?: string;
  paymentMethod?: string;
  paymentTerms?: string;
  dueDate?: string;
  montantPaye?: number;
  vendeur?: string;
  details?: VenteProduct[]; // ⭐ NOVAINA: Ampitaiko avy amin'ny modal
}

const COLORS = {
  primary: [79, 70, 229],
  primaryDark: [67, 56, 202],
  primaryLight: [129, 140, 248],
  secondary: [38, 70, 83],
  text: [0, 0, 0],
  textMuted: [100, 116, 139],
  textLight: [148, 163, 184],
  border: [226, 232, 240],
  background: [248, 250, 252],
  backgroundSoft: [240, 247, 253],
  white: [255, 255, 255],
  success: [16, 185, 129],
  warning: [245, 158, 11],
  danger: [239, 68, 68],
  tableText: [0, 0, 0],
  tableBg: [255, 255, 255],
};

const formatMoney = (amount: number): string => {
  if (!amount && amount !== 0) return '0 Ar';
  return new Intl.NumberFormat('fr-FR', { useGrouping: true, maximumFractionDigits: 0 }).format(amount).replace(/\u202F/g, ' ') + ' Ar';
};

const formatDate = (date: Date | string, format: 'short' | 'long' = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Date invalide';
  return format === 'short' ? d.toLocaleDateString('fr-FR') : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const cleanText = (text: string): string => { if (!text) return ''; return text.normalize('NFC').trim(); };
const cleanForQR = (text: string): string => { if (!text) return ''; return text.normalize('NFC').trim(); };

// ⭐ parseTvaRate: Raha 0 dia 0, raha null/undefined/'' dia 0
const parseTvaRate = (value: unknown): number => {
  return (value !== undefined && value !== null && value !== '') ? Number(value) : 0;
};

export const generateVentePDF = async (options: VentesPDFOptions, isDark: boolean = false): Promise<any> => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const { default: QRCode } = await import('qrcode');

  await new Promise(resolve => setTimeout(resolve, 50));

  const {
    vente, type, clientName, clientEmail, clientPhone, clientAddress,
    companyName, companyAddress, companyPhone, companyEmail,
    companySiret, companyTaxId, companyRcs, companyVatNumber,
    paymentMethod, paymentTerms, dueDate, montantPaye, vendeur, details: passedDetails
  } = options;

  const C = COLORS;
  const [pr, pg, pb] = C.primary;
  const [sr, sg, sb] = C.secondary;
  const [br, bg, bb] = C.border;
  const [wr, wg, wb] = C.white;

  const displayCompanyName = cleanText(companyName || "GSOFT");
  const displayCompanyAddress = cleanText(companyAddress || '');
  const displayCompanyPhone = cleanText(companyPhone || '');
  const displayCompanyEmail = cleanText(companyEmail || '');
  const displayCompanySiret = cleanText(companySiret || '');
  const displayCompanyTaxId = cleanText(companyTaxId || '');
  const displayClientName = cleanText(clientName || 'Client');
  const displayClientEmail = cleanText(clientEmail || '');
  const displayClientPhone = cleanText(clientPhone || '');
  const displayClientAddress = cleanText(clientAddress || '');
  const displayVendeur = cleanText(vendeur || 'admin');

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  const orderId = type === 'devis'
    ? (vente.reference || vente.numero || `DEV-${String(vente.id).padStart(4, '0')}`)
    : (vente.reference || vente.numero || `FAC-${String(vente.id).padStart(4, '0')}`);

  const titleText = type === 'devis' ? 'DEVIS' : 'FACTURE';

  // ⭐ FIX TENY IZAO: Mampiasa ny details voa-enrichie raha misy, fa tsy ny products tsotra
  const products = Array.isArray(vente.details) && vente.details.length > 0
    ? vente.details
    : (Array.isArray(passedDetails) && passedDetails.length > 0
      ? passedDetails
      : (vente.products || []));

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
  const totalTTC = totalHTAfterRemise + totalTVA;
  const vatRate = totalHTAfterRemise > 0 ? Math.round((totalTVA / totalHTAfterRemise) * 100 * 100) / 100 : 0;

  const orderDate = vente.date_devis || vente.date_facture || vente.created_at || new Date().toISOString();
  const dueDateObj = dueDate ? new Date(dueDate) : new Date(orderDate);
  if (!dueDate) dueDateObj.setDate(dueDateObj.getDate() + 30);
  const displayDueDate = formatDate(dueDateObj, 'long');

  const cashAmount = Math.min(totalTTC, Number(montantPaye || 0));

  let qrImageBase64 = '';
  try {
    const qrData = [
      `${titleText}`, `N°: ${cleanForQR(orderId)}`, `Client: ${cleanForQR(displayClientName)}`,
      `Montant: ${formatMoney(totalTTC)}`, `Date: ${formatDate(orderDate, 'short')}`,
      `Vendeur: ${cleanForQR(displayVendeur)}`
    ].filter(line => line !== '').join('\n');
    qrImageBase64 = await QRCode.toDataURL(qrData, {
      width: 120, margin: 2, errorCorrectionLevel: 'H',
      color: { dark: '#4F46E5', light: '#FFFFFF' }
    });
  } catch (_) {}

  doc.setFillColor(pr, pg, pb);
  doc.rect(0, 0, pageWidth, 1.5, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(pr, pg, pb);
  doc.text(displayCompanyName, pageWidth / 2, 8, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  let coordY = 12;
  if (displayCompanyAddress) { doc.text(displayCompanyAddress, pageWidth / 2, coordY, { align: 'center' }); coordY += 3.2; }
  if (displayCompanyPhone) { doc.text(`Tél: ${displayCompanyPhone}`, pageWidth / 2, coordY, { align: 'center' }); coordY += 3.2; }
  if (displayCompanySiret || displayCompanyTaxId) { doc.text(`NIF/STAT: ${displayCompanySiret || displayCompanyTaxId || ''}`, pageWidth / 2, coordY, { align: 'center' }); coordY += 3.2; }

  const separatorY = Math.max(coordY + 4, 32);
  doc.setDrawColor(br, bg, bb);
  doc.line(margin, separatorY, pageWidth - margin, separatorY);

  const infoY = separatorY + 4;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(sr, sg, sb);
  doc.text(`${titleText} N°:`, margin, infoY);
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

  if (products.length === 0) {
    tableData = [['-', 'Aucun produit', '-', '-', '-']];
  } else {
    tableData = products.map((item: any) => {
      const prodName = cleanText(item.produit_nom || item.name || item.nom || item.designation || item.libelle || item.product_name || 'Produit');
      const prodQty = Number(item.quantity || item.quantite || item.qty || 0);
      const prodPrice = Number(item.prix_unitaire || item.price || item.prix || item.prix_vente || 0);
      const tvaRate = parseTvaRate(item.tva_rate);
      return [prodQty.toString(), prodName, formatMoney(prodPrice), `${Math.round(tvaRate * 100)}%`, formatMoney(prodQty * prodPrice)];
    });
  }

  autoTable(doc, {
    startY: tableStartY,
    head: [['QTÉ', 'ARTICLE', 'PRIX', 'TVA', 'TOTAL']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [pr, pg, pb], textColor: [wr, wg, wb], fontStyle: 'bold', halign: 'left', fontSize: 7, cellPadding: 2, lineWidth: 0.1, lineColor: [pr, pg, pb] },
    bodyStyles: { textColor: C.tableText, fontSize: 6.5, cellPadding: 2, lineWidth: 0.15, lineColor: [br, bg, bb], fillColor: C.tableBg },
    columnStyles: { 0: { cellWidth: 15, halign: 'left' }, 1: { cellWidth: 'auto', halign: 'left' }, 2: { cellWidth: 35, halign: 'right' }, 3: { cellWidth: 20, halign: 'center' }, 4: { cellWidth: 35, halign: 'right' } },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - (margin * 2),
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || tableStartY + 30;
  const totalsY = finalTableY + 5;
  const lineX = margin;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text(`Sous-total HT:`, lineX, totalsY);
  doc.text(formatMoney(totalHTAfterRemise), lineX + 60, totalsY, { align: 'right' });
  doc.text(`TVA (${vatRate}%):`, lineX, totalsY + 5);
  doc.text(formatMoney(totalTVA), lineX + 60, totalsY + 5, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(pr, pg, pb);
  doc.text(`TOTAL TTC:`, lineX, totalsY + 10);
  doc.text(formatMoney(totalTTC), lineX + 60, totalsY + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text(`Cash:`, lineX, totalsY + 15);
  doc.text(formatMoney(cashAmount), lineX + 60, totalsY + 15, { align: 'right' });
  const montantRestantPDF = Math.max(0, totalTTC - cashAmount);
  doc.text(`Reste à payer:`, lineX, totalsY + 20);
  doc.text(formatMoney(montantRestantPDF), lineX + 60, totalsY + 20, { align: 'right' });

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

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C.textLight[0], C.textLight[1], C.textLight[2]);
  doc.text(`© ${new Date().getFullYear()} ${displayCompanyName}`, pageWidth / 2, totalsY + 25, { align: 'center' });

  return doc;
};

export const downloadVentePDF = async (options: VentesPDFOptions, isDark: boolean = false) => {
  try {
    const doc = await generateVentePDF(options, isDark);
    const orderId = options.type === 'devis'
      ? (options.vente.reference || options.vente.numero || `DEV-${String(options.vente.id).padStart(4, '0')}`)
      : (options.vente.reference || options.vente.numero || `FAC-${String(options.vente.id).padStart(4, '0')}`);
    const defaultFileName = `${options.type === 'devis' ? 'devis' : 'facture'}_${orderId}.pdf`;
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
      a.href = url; a.download = defaultFileName;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
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