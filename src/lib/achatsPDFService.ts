// AchatsPDFService.ts (na AchatsPDFService.tsx raha misy JSX)
export interface AchatProduct { id?: number; nom?: string; designation?: string; produit_nom?: string; quantite?: number; qty?: number; prix_unitaire?: number; prix_achat?: number; total?: number; tva_rate?: number; }
export interface Achat { id: number; reference?: string; numero?: string; fournisseur_nom?: string; date_achat?: string; total_ht?: number; total_ttc?: number; montant_paye?: number; statut_paiement?: string; details?: AchatProduct[]; products?: AchatProduct[]; }
export interface AchatsPDFOptions { achat: Achat; fournisseurName: string; companyName?: string; companyAddress?: string; companyPhone?: string; companyEmail?: string; companySiret?: string; companyTaxId?: string; companyRcs?: string; companyVatNumber?: string; montantPaye?: number; }

const COLORS = { primary: [79, 70, 229], text: [0, 0, 0], textMuted: [100, 116, 139], textLight: [148, 163, 184], border: [226, 232, 240], white: [255, 255, 255], tableText: [0, 0, 0], tableBg: [255, 255, 255] };
const formatMoney = (amount: number): string => { if (!amount && amount !== 0) return '0 Ar'; return new Intl.NumberFormat('fr-FR', { useGrouping: true, maximumFractionDigits: 0 }).format(amount).replace(/\u202F/g, ' ') + ' Ar'; };
const formatDate = (date: Date | string): string => { const d = typeof date === 'string' ? new Date(date) : date; if (isNaN(d.getTime())) return 'Date invalide'; return d.toLocaleDateString('fr-FR'); };
const cleanText = (text: string): string => { if (!text) return ''; return text.normalize('NFC').trim(); };

// ⭐ FIX: Mampiseho ny taux TVA marina (20%, 0%, 10%)
const formatTva = (rate: number | undefined): string => {
  if (rate === undefined || rate === null) return '20%'; // Default
  if (rate > 1) return `${rate}%`;
  return `${Math.round(rate * 100)}%`;
};

export const generateAchatPDF = async (options: AchatsPDFOptions): Promise<any> => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const { default: QRCode } = await import('qrcode');
  await new Promise(resolve => setTimeout(resolve, 50));

  const { achat, fournisseurName, companyName, companyAddress, companyPhone, companySiret, companyTaxId, montantPaye } = options;
  const C = COLORS; const [pr, pg, pb] = C.primary; const [br, bg, bb] = C.border;
  const displayCompanyName = cleanText(companyName || "GSOFT");
  const displayFournisseur = cleanText(fournisseurName || 'Fournisseur');
  const orderId = achat.reference || achat.numero || `ACH-${String(achat.id).padStart(6, '0')}`;
  const products = Array.isArray(achat.details) && achat.details.length > 0 ? achat.details : (achat.products || []);


  let totalHT = 0; 
  let totalTVA = 0;
  products.forEach((p: any) => {
    const qty = Number(p.quantite || p.qty || 0);
    const price = Number(p.prix_unitaire || p.prix_achat || 0);
    const tvaRate = Number(p.tva_rate); 
    const safeRate = Number.isFinite(tvaRate) ? tvaRate : 0.2;
    
    totalHT += qty * price;
    totalTVA += qty * price * safeRate;
  });

  const totalTTC = totalHT + totalTVA;
  const cashAmount = Math.min(totalTTC, Number(montantPaye || achat.montant_paye || 0));
  const montantRestantPDF = Math.max(0, totalTTC - cashAmount);

  const doc = new jsPDF('p', 'mm', 'a4'); const pageWidth = doc.internal.pageSize.getWidth(); const margin = 12;
  let qrImageBase64 = '';
  try {
    const qrData = [`ACHAT`, `N°: ${orderId}`, `Fournisseur: ${displayFournisseur}`, `Montant: ${formatMoney(totalTTC)}`, `Date: ${formatDate(achat.date_achat || new Date())}`].filter(line => line !== '').join('\n');
    qrImageBase64 = await QRCode.toDataURL(qrData, { width: 120, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#4F46E5', light: '#FFFFFF' } });
  } catch (_) {}

  doc.setFillColor(pr, pg, pb); doc.rect(0, 0, pageWidth, 1.5, 'F');
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(pr, pg, pb); doc.text(displayCompanyName, pageWidth / 2, 8, { align: 'center' });
  doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  let coordY = 12; if (companyAddress) { doc.text(companyAddress, pageWidth / 2, coordY, { align: 'center' }); coordY += 3.2; } if (companyPhone) { doc.text(`Tél: ${companyPhone}`, pageWidth / 2, coordY, { align: 'center' }); coordY += 3.2; } if (companySiret || companyTaxId) { doc.text(`NIF/STAT: ${companySiret || companyTaxId || ''}`, pageWidth / 2, coordY, { align: 'center' }); coordY += 3.2; }
  const separatorY = Math.max(coordY + 4, 32); doc.setDrawColor(br, bg, bb); doc.line(margin, separatorY, pageWidth - margin, separatorY);
  const infoY = separatorY + 4; 

  // ⭐ FIX: Fanatsarana ny Header (lehibe kely, mazava)
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text(`FACTURE FOURNISSEUR N° : ${orderId}`, margin, infoY); 
  doc.text(`Fournisseur :`, margin, infoY + 5); 
  doc.text(`Date :`, margin, infoY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(displayFournisseur, margin + 30, infoY + 5); 
  doc.text(formatDate(achat.date_achat || new Date()), margin + 30, infoY + 10);

  const tableStartY = infoY + 16; 

  // ⭐ FIX: Fanatsarana ny tableau (Font 8, Padding 3, Stripe)
  let tableData: any[][] = products.map((item: any) => {
    const prodName = cleanText(item.produit_nom || item.nom || item.designation || 'Produit');
    const prodQty = Number(item.quantite || item.qty || 0); 
    const prodPrice = Number(item.prix_unitaire || item.prix_achat || 0);
    const prodTva = formatTva(item.tva_rate);
    return [prodQty.toString(), prodName, formatMoney(prodPrice), prodTva, formatMoney(prodQty * prodPrice)];
  });
  if (tableData.length === 0) tableData = [['-', 'Aucun produit', '-', '-', '-']];

  autoTable(doc, { 
    startY: tableStartY, 
    head: [['QTÉ', 'ARTICLE', 'PRIX', 'TVA', 'TOTAL']], 
    body: tableData, 
    theme: 'striped', // ⭐ Mampiseho loko mifandimby mba mora vakiana
    headStyles: { fillColor: [pr, pg, pb], textColor: [255, 255, 255], fontSize: 8, cellPadding: 3 }, 
    bodyStyles: { textColor: C.tableText, fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] }, // ⭐ Loko mazava isaky ny andalana
    columnStyles: { 
      0: { cellWidth: 15, halign: 'center' }, // ⭐ Ny Qté eo afovoany
      1: { cellWidth: 'auto', halign: 'left' }, 
      2: { cellWidth: 35, halign: 'right' }, 
      3: { cellWidth: 20, halign: 'center' }, 
      4: { cellWidth: 35, halign: 'right' } 
    }, 
    margin: { left: margin, right: margin }, 
    tableWidth: pageWidth - (margin * 2) 
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || tableStartY + 30; const totalsY = finalTableY + 8; const lineX = margin;
  
  // ⭐ FIX: Fanatsarana ny Récap (Font 8)
  doc.setFontSize(8); doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text(`Sous-total HT:`, lineX, totalsY); doc.text(formatMoney(totalHT), lineX + 60, totalsY, { align: 'right' });
  doc.text(`TVA:`, lineX, totalsY + 6); doc.text(formatMoney(totalTVA), lineX + 60, totalsY + 6, { align: 'right' });
  doc.setFont('helvetica', 'bold'); doc.setTextColor(pr, pg, pb); doc.text(`TOTAL TTC:`, lineX, totalsY + 12); doc.text(formatMoney(totalTTC), lineX + 60, totalsY + 12, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text(`Payé:`, lineX, totalsY + 18); doc.text(formatMoney(cashAmount), lineX + 60, totalsY + 18, { align: 'right' });
  doc.text(`Reste à payer:`, lineX, totalsY + 24); doc.text(formatMoney(montantRestantPDF), lineX + 60, totalsY + 24, { align: 'right' });

  const qrSize = 30; const qrX = pageWidth - margin - qrSize; const qrY = finalTableY + 5;
  if (qrImageBase64) { try { doc.addImage(qrImageBase64, 'PNG', qrX, qrY, qrSize, qrSize); doc.text('Scan', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' }); } catch (_) {} }
  doc.setFontSize(5.5); doc.setTextColor(C.textLight[0], C.textLight[1], C.textLight[2]); doc.text(`© ${new Date().getFullYear()} ${displayCompanyName}`, pageWidth / 2, totalsY + 30, { align: 'center' });
  return doc;
};

export const downloadAchatPDF = async (options: AchatsPDFOptions) => { 
  try { 
    const doc = await generateAchatPDF(options); 
    const defaultFileName = `achat_${options.achat.reference || options.achat.id}.pdf`; 
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
    console.error('❌ Erreur PDF Achat:', error); 
    return { success: false, error: error.message }; 
  } 
};

export default { generateAchatPDF, downloadAchatPDF };