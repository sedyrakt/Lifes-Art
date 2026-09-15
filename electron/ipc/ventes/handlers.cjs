// electron/ipc/ventes/ventes.cjs
'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error, emitVentesChanged } = require('./utils.cjs');
const { prepareStatements, getStatements } = require('./statements.cjs');

function normalizeId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseTvaRate(value) {
  return (value !== undefined && value !== null && value !== '') ? Number(value) : 0;
}

function resolveTvaRate(db, produitId, detailTvaRate) {
  if (detailTvaRate !== undefined && detailTvaRate !== null && detailTvaRate !== '') return Number(detailTvaRate);
  if (produitId) {
    const row = db.prepare('SELECT tva_rate FROM produits WHERE id = ?').get(produitId);
    if (row && row.tva_rate !== undefined && row.tva_rate !== null) return Number(row.tva_rate);
  }
  return 0;
}

function resolveUnite(db, produitId) {
  if (produitId) {
    const row = db.prepare('SELECT unite FROM produits WHERE id = ?').get(produitId);
    if (row && row.unite) return String(row.unite);
  }
  return 'pièce';
}

function normalizeProductDetail(db, detail = {}) {
  const produit_id = normalizeId(detail.produit_id ?? detail.id);
  const quantite = Number(detail.quantite);
  const prix_unitaire = Number(detail.prix_unitaire) || 0;
  const tva_rate = resolveTvaRate(db, produit_id, detail.tva_rate);
  const unite = resolveUnite(db, produit_id);
  if (!produit_id || !Number.isFinite(quantite) || quantite <= 0) return null;
  const total = Number.isFinite(Number(detail.total)) ? Number(detail.total) : quantite * prix_unitaire;
  return { produit_id, quantite, prix_unitaire, total, tva_rate, unite };
}

function normalizeDetails(db, details) {
  if (!Array.isArray(details)) return [];
  return details.map(d => normalizeProductDetail(db, d)).filter(Boolean);
}

function generateReference(db, table, prefix) {
  const countResult = db.prepare(`SELECT COUNT(*) as total FROM ${table}`).get();
  const nextNumber = (countResult?.total || 0) + 1;
  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

function calculatePayment(totalTTC, montantPaye) {
  const safeMontantPaye = Math.max(0, Math.min(totalTTC, Number(montantPaye) || 0));
  const montantRestant = Math.max(0, totalTTC - safeMontantPaye);
  const statutPaiement = safeMontantPaye <= 0 ? 'Non payé' : safeMontantPaye >= totalTTC ? 'Payé' : 'Partiel';
  return { statut_paiement: statutPaiement, montant_paye: safeMontantPaye, montant_restant: montantRestant };
}

function recalculateTotals(db, details, fraisLivraison = 0) {
  let ht = 0;
  let tva = 0;

  for (const d of details) {
    const produit = db.prepare('SELECT tva_rate FROM produits WHERE id = ?').get(d.produit_id);
    const rate = (produit?.tva_rate !== undefined && produit?.tva_rate !== null && produit?.tva_rate !== '')
      ? Number(produit.tva_rate)
      : (Number(d.tva_rate) || 0);

    const lineHT = Number(d.quantite) * Number(d.prix_unitaire);
    ht += lineHT;
    tva += lineHT * rate;
  }

  const totalHT = ht + Number(fraisLivraison || 0);
  const totalTVA = tva;
  const totalTTC = totalHT + totalTVA;

  return {
    total_ht: Number(totalHT.toFixed(2)),
    total_tva: Number(totalTVA.toFixed(2)),
    total_ttc: Number(totalTTC.toFixed(2)),
  };
}

function calculatePaymentDeadline(modalitePaiement) {
  const today = new Date();
  const raw = String(modalitePaiement || '').trim().toLowerCase();

  if (!raw || raw === 'immediat' || raw === 'immédiat' || raw === 'immediate') {
    const pad = (n) => String(n).padStart(2, '0');
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())} ${pad(today.getHours())}:${pad(today.getMinutes())}:${pad(today.getSeconds())}`;
  }

  let ms = 0;
  let isTimeBased = false;
  const match = raw.match(/(\d+)\s*(minutes?|min|heures?|hrs?|jours?|j|mois|annees?|ans)?/);
  if (match) {
    const number = parseInt(match[1], 10) || 0;
    const unit = match[2] || 'j';
    if (unit.startsWith('min')) { ms = number * 60 * 1000; isTimeBased = true; }
    else if (unit.startsWith('h')) { ms = number * 60 * 60 * 1000; isTimeBased = true; }
    else if (unit.startsWith('mois')) { ms = number * 30 * 24 * 60 * 60 * 1000; }
    else if (unit.startsWith('annee') || unit.startsWith('ans')) { ms = number * 365 * 24 * 60 * 60 * 1000; }
    else { ms = number * 24 * 60 * 60 * 1000; }
  }
  const d = new Date(today.getTime() + ms);
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (isTimeBased) return `${dateStr} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return dateStr;
}

function attachClientDetails(db, document) {
  if (!document || typeof document !== 'object') return document;
  if (document.client_telephone || document.client_email) return document;
  let client = null;
  if (document.client_id) client = db.prepare('SELECT * FROM clients WHERE id = ?').get(document.client_id);
  if (!client && document.client_nom) client = db.prepare('SELECT * FROM clients WHERE TRIM(LOWER(nom)) = TRIM(LOWER(?))').get(document.client_nom);
  if (client) return { ...document, client_telephone: client.telephone || '', client_email: client.email || '' };
  return document;
}

function registerVentesHandlers(ipcMain) {
  if (!ipcMain) { error('❌ ipcMain null'); return false; }

  const channels = [
    'ventes:get-devis', 'ventes:get-devis-by-id', 'ventes:create-devis',
    'ventes:update-devis', 'ventes:delete-devis', 'ventes:get-devis-details',
    'ventes:get-factures', 'ventes:get-facture-by-id', 'ventes:create-facture',
    'ventes:update-facture', 'ventes:delete-facture', 'ventes:get-facture-details',
    'ventes:convert-devis-to-facture', 'ventes:update-paiement',
    'ventes:get-stats',
  ];
  for (const channel of channels) { try { ipcMain.removeHandler(channel); } catch (_) {} }

  if (!prepareStatements()) { error('❌ Impossible de préparer les statements VENTES'); return false; }

  // ═══════════════════════════════════════════════════════════
  // ⭐ STATS — VAOVAO: nampiana payes/partiels/total_paye isaky ny type
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('ventes:get-stats', async (_event, options = {}) => {
    try {
      const db = getDb();
      const { startDate, endDate } = options || {};
      const buildFilter = (col) => {
        let sql = ''; const params = [];
        if (startDate) { sql += ` AND substr(COALESCE(${col}, ''), 1, 10) >= substr(?, 1, 10)`; params.push(startDate); }
        if (endDate) { sql += ` AND substr(COALESCE(${col}, ''), 1, 10) <= substr(?, 1, 10)`; params.push(endDate); }
        return { sql, params };
      };

      const devisFilter = buildFilter('date_devis');
      const devisRow = db.prepare(`
        SELECT COUNT(*) AS total,
          COALESCE(SUM(COALESCE(total_ttc, 0)), 0) AS ca,
          COALESCE(SUM(COALESCE(montant_paye, 0)), 0) AS total_paye,
          COALESCE(SUM(CASE WHEN COALESCE(montant_restant, 0) > 0 THEN COALESCE(montant_restant, total_ttc, 0) ELSE 0 END), 0) AS dette,
          COUNT(CASE WHEN statut_paiement = 'Payé' THEN 1 END) AS nb_payes,
          COUNT(CASE WHEN statut_paiement = 'Partiel' THEN 1 END) AS nb_partiels,
          COUNT(CASE WHEN statut_paiement = 'Non payé' THEN 1 END) AS nb_non_payes
        FROM devis WHERE 1 = 1 ${devisFilter.sql}
      `).get(...devisFilter.params);

      const factureFilter = buildFilter('date_facture');
      const factureRow = db.prepare(`
        SELECT COUNT(*) AS total,
          COALESCE(SUM(COALESCE(total_ttc, 0)), 0) AS ca,
          COALESCE(SUM(COALESCE(montant_paye, 0)), 0) AS total_paye,
          COALESCE(SUM(CASE WHEN COALESCE(montant_restant, 0) > 0 THEN COALESCE(montant_restant, total_ttc, 0) ELSE 0 END), 0) AS dette,
          COUNT(CASE WHEN statut_paiement = 'Payé' THEN 1 END) AS nb_payes,
          COUNT(CASE WHEN statut_paiement = 'Partiel' THEN 1 END) AS nb_partiels,
          COUNT(CASE WHEN statut_paiement = 'Non payé' THEN 1 END) AS nb_non_payes
        FROM factures WHERE 1 = 1 ${factureFilter.sql}
      `).get(...factureFilter.params);

      let articlesDevis = 0;
      try {
        const f = buildFilter('d.date_devis');
        const row = db.prepare(`
          SELECT COALESCE(SUM(COALESCE(dd.quantite, 0)), 0) AS total
          FROM details_devis dd INNER JOIN devis d ON d.id = dd.devis_id
          WHERE 1 = 1 ${f.sql}
        `).get(...f.params);
        articlesDevis = Number(row?.total || 0);
      } catch (_) {}

      let articlesFactures = 0;
      try {
        const f = buildFilter('f.date_facture');
        const row = db.prepare(`
          SELECT COALESCE(SUM(COALESCE(df.quantite, 0)), 0) AS total
          FROM details_factures df INNER JOIN factures f ON f.id = df.facture_id
          WHERE 1 = 1 ${f.sql}
        `).get(...f.params);
        articlesFactures = Number(row?.total || 0);
      } catch (_) {}

      return {
        success: true,
        data: {
          totalDevis: Number(devisRow?.total || 0),
          totalFactures: Number(factureRow?.total || 0),
          caDevis: Number(devisRow?.ca || 0),
          caFactures: Number(factureRow?.ca || 0),
          caTotal: Number(devisRow?.ca || 0) + Number(factureRow?.ca || 0),
          payeDevis: Number(devisRow?.total_paye || 0),
          payeFactures: Number(factureRow?.total_paye || 0),
          payeTotal: Number(devisRow?.total_paye || 0) + Number(factureRow?.total_paye || 0),
          detteDevis: Number(devisRow?.dette || 0),
          detteFactures: Number(factureRow?.dette || 0),
          detteTotal: Number(devisRow?.dette || 0) + Number(factureRow?.dette || 0),
          nbPayesDevis: Number(devisRow?.nb_payes || 0),
          nbPayesFactures: Number(factureRow?.nb_payes || 0),
          nbPayesTotal: Number(devisRow?.nb_payes || 0) + Number(factureRow?.nb_payes || 0),
          nbPartielsDevis: Number(devisRow?.nb_partiels || 0),
          nbPartielsFactures: Number(factureRow?.nb_partiels || 0),
          nbPartielsTotal: Number(devisRow?.nb_partiels || 0) + Number(factureRow?.nb_partiels || 0),
          nbNonPayesDevis: Number(devisRow?.nb_non_payes || 0),
          nbNonPayesFactures: Number(factureRow?.nb_non_payes || 0),
          nbNonPayesTotal: Number(devisRow?.nb_non_payes || 0) + Number(factureRow?.nb_non_payes || 0),
          articlesVendus: articlesDevis + articlesFactures,
          articlesDevis, articlesFactures,
        },
      };
    } catch (err) { error('❌ ventes:get-stats:', err.message); return { success: false, error: err.message }; }
  });

  // ═══════════════════════════════════════════════════════════
  // ⭐ CONVERT DEVIS → FACTURE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('ventes:convert-devis-to-facture', async (_event, devisId) => {
    try {
      const db = getDb();
      const id = normalizeId(devisId);
      if (!id) return { success: false, error: 'ID devis invalide' };
      const devis = db.prepare('SELECT * FROM devis WHERE id = ?').get(id);
      if (!devis) return { success: false, error: 'Devis non trouvé' };
      const details = db.prepare('SELECT * FROM details_devis WHERE devis_id = ?').all(id);
      if (details.length === 0) return { success: false, error: 'Aucun produit dans ce devis' };

      const fraisLivraison = Number(devis.frais_livraison) || 0;
      const totals = recalculateTotals(db, details, fraisLivraison);

      console.log('[ventes] Conversion DEV-', id, '→ FAC');
      console.log('  Devis original: HT =', devis.total_ht, '| TTC =', devis.total_ttc);
      console.log('  Recalculé    : HT =', totals.total_ht, '| TVA =', totals.total_tva, '| TTC =', totals.total_ttc);

      const payment = calculatePayment(totals.total_ttc, Number(devis.montant_paye) || 0);
      const stmts = getStatements();
      let finalReference = generateReference(db, 'factures', 'FAC');

      const transaction = db.transaction(() => {
        const result = stmts.stmtCreateFacture.run(
          devis.client_id, devis.client_nom, finalReference,
          totals.total_ht, totals.total_ttc,
          payment.statut_paiement, payment.montant_paye, payment.montant_restant,
          devis.observation || '',
          devis.mode_paiement || 'Espèces',
          devis.modalite_paiement || 'Immediat',
          fraisLivraison,
          devis.date_limite_paiement || calculatePaymentDeadline(devis.modalite_paiement || 'Immediat')
        );
        const factureId = Number(result.lastInsertRowid);
        for (const detail of details) {
          const tvaRate = resolveTvaRate(db, detail.produit_id, detail.tva_rate);
          stmts.stmtInsertFactureDetail.run(factureId, detail.produit_id, detail.quantite, detail.prix_unitaire, detail.total, tvaRate);
          db.prepare('UPDATE produits SET quantite_stock = quantite_stock - ? WHERE id = ?').run(detail.quantite, detail.produit_id);
        }
        stmts.stmtDeleteDevisDetails.run(id);
        stmts.stmtDeleteDevis.run(id);
        return { id: factureId, reference: finalReference };
      });

      const result = transaction();
      emitVentesChanged({ type: 'devis_converted', id: result.id });
      emitVentesChanged({ type: 'facture_created', id: result.id });
      return { success: true, data: result };
    } catch (err) { error('❌ convert-devis-to-facture:', err.message); return { success: false, error: err.message }; }
  });

  // ═══════════════════════════════════════════════════════════
  // ⭐ GET DETAILS
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('ventes:get-devis-details', async (_event, devisId) => {
    try {
      const db = getDb();
      const id = normalizeId(devisId);
      if (!id) return { success: false, error: 'ID devis invalide' };
      const devis = db.prepare('SELECT * FROM devis WHERE id = ?').get(id);
      if (!devis) return { success: false, error: 'Devis non trouvé' };
      const enrichedDevis = attachClientDetails(db, devis);
      const details = db.prepare(`
        SELECT dd.*, p.nom as produit_nom, p.code as produit_code,
               p.tva_rate as produit_tva_rate, p.unite as produit_unite
        FROM details_devis dd LEFT JOIN produits p ON p.id = dd.produit_id
        WHERE dd.devis_id = ?
      `).all(id);
      return { success: true, data: { devis: enrichedDevis, details } };
    } catch (err) { error('❌ get-devis-details:', err.message); return { success: false, error: err.message }; }
  });

  ipcMain.handle('ventes:get-facture-details', async (_event, factureId) => {
    try {
      const db = getDb();
      const id = normalizeId(factureId);
      if (!id) return { success: false, error: 'ID facture invalide' };
      const facture = db.prepare('SELECT * FROM factures WHERE id = ?').get(id);
      if (!facture) return { success: false, error: 'Facture non trouvée' };
      const enrichedFacture = attachClientDetails(db, facture);
      const details = db.prepare(`
        SELECT fd.*, p.nom as produit_nom, p.code as produit_code,
               p.tva_rate as produit_tva_rate, p.unite as produit_unite
        FROM details_factures fd LEFT JOIN produits p ON p.id = fd.produit_id
        WHERE fd.facture_id = ?
      `).all(id);
      return { success: true, data: { facture: enrichedFacture, details } };
    } catch (err) { error('❌ get-facture-details:', err.message); return { success: false, error: err.message }; }
  });

  // ═══════════════════════════════════════════════════════════
  // ⭐ GET LISTS
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('ventes:get-devis', async (_event, options = {}) => {
    try {
      const db = getDb();
      const { search = '', statut = '', page = 1, limit = 20 } = options || {};
      let where = 'WHERE 1=1'; const params = [];
      if (search && String(search).trim()) { where += ' AND (reference LIKE ? OR client_nom LIKE ?)'; const v = `%${String(search).trim()}%`; params.push(v, v); }
      if (statut) { where += ' AND statut_paiement = ?'; params.push(statut); }
      const offset = (Number(page) - 1) * Number(limit);
      const totalResult = db.prepare(`SELECT COUNT(*) as total FROM devis ${where}`).get(...params);
      const total = Number(totalResult?.total || 0);
      const rows = db.prepare(`SELECT * FROM devis ${where} ORDER BY date_devis DESC, id DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), offset);
      return { success: true, data: rows, pagination: { total, limit: Number(limit), page: Number(page), totalPages: Math.ceil(total / Number(limit)) } };
    } catch (err) { error('❌ get-devis:', err.message); return { success: false, error: err.message }; }
  });

  ipcMain.handle('ventes:get-factures', async (_event, options = {}) => {
    try {
      const db = getDb();
      const { search = '', statut = '', page = 1, limit = 20 } = options || {};
      let where = 'WHERE 1=1'; const params = [];
      if (search && String(search).trim()) { where += ' AND (reference LIKE ? OR client_nom LIKE ?)'; const v = `%${String(search).trim()}%`; params.push(v, v); }
      if (statut) { where += ' AND statut_paiement = ?'; params.push(statut); }
      const offset = (Number(page) - 1) * Number(limit);
      const totalResult = db.prepare(`SELECT COUNT(*) as total FROM factures ${where}`).get(...params);
      const total = Number(totalResult?.total || 0);
      const rows = db.prepare(`SELECT * FROM factures ${where} ORDER BY date_facture DESC, id DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), offset);
      return { success: true, data: rows, pagination: { total, limit: Number(limit), page: Number(page), totalPages: Math.ceil(total / Number(limit)) } };
    } catch (err) { error('❌ get-factures:', err.message); return { success: false, error: err.message }; }
  });

  // ═══════════════════════════════════════════════════════════
  // ⭐ CREATE DEVIS
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('ventes:create-devis', async (_event, data = {}) => {
    try {
      const db = getDb();
      const {
        client_id = null, client_nom = '', reference = '',
        total_ht = 0, total_ttc = 0, validite_jours = 30, observation = '',
        montant_paye = 0, details = [],
        mode_paiement = 'Espèces', modalite_paiement = 'Immediat', frais_livraison = 0,
      } = data || {};

      if (!String(client_nom).trim()) return { success: false, error: 'Nom du client requis' };
      const normalizedDetails = normalizeDetails(db, details);
      if (normalizedDetails.length === 0) return { success: false, error: 'Au moins un produit est requis' };

      let finalReference = String(reference || '').trim();
      if (!finalReference) finalReference = generateReference(db, 'devis', 'DEV');

      const payment = calculatePayment(Number(total_ttc) || 0, montant_paye);
      const dateLimite = calculatePaymentDeadline(modalite_paiement);
      const stmts = getStatements();

      const transaction = db.transaction(() => {
        const result = stmts.stmtCreateDevis.run(
          normalizeId(client_id), String(client_nom).trim(), finalReference,
          Number(total_ht) || 0, Number(total_ttc) || 0,
          payment.statut_paiement, payment.montant_paye, payment.montant_restant,
          Number(validite_jours) || 30, String(observation || '').trim(),
          String(mode_paiement || 'Espèces'), String(modalite_paiement || 'Immediat'),
          Number(frais_livraison) || 0, dateLimite
        );
        const devisId = Number(result.lastInsertRowid);
        let inserted = 0;
        for (const detail of normalizedDetails) {
          stmts.stmtInsertDevisDetail.run(devisId, detail.produit_id, detail.quantite, detail.prix_unitaire, detail.total, detail.tva_rate);
          inserted++;
        }
        if (inserted === 0) throw new Error('Aucun détail produit enregistré');
        return { id: devisId, reference: finalReference, detailsCount: inserted };
      });

      const result = transaction();
      emitVentesChanged({ type: 'devis_created', id: result.id });
      return { success: true, data: result };
    } catch (err) { error('❌ create-devis:', err.message); return { success: false, error: err.message }; }
  });

  // ═══════════════════════════════════════════════════════════
  // ⭐ CREATE FACTURE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('ventes:create-facture', async (_event, data = {}) => {
    try {
      const db = getDb();
      const {
        client_id = null, client_nom = '', reference = '',
        total_ht = 0, total_ttc = 0, observation = '',
        montant_paye = 0, details = [],
        mode_paiement = 'Espèces', modalite_paiement = 'Immediat', frais_livraison = 0,
      } = data || {};

      if (!String(client_nom).trim()) return { success: false, error: 'Nom du client requis' };
      const normalizedDetails = normalizeDetails(db, details);
      if (normalizedDetails.length === 0) return { success: false, error: 'Au moins un produit est requis' };

      let finalReference = String(reference || '').trim();
      if (!finalReference) finalReference = generateReference(db, 'factures', 'FAC');

      const payment = calculatePayment(Number(total_ttc) || 0, montant_paye);
      const dateLimite = calculatePaymentDeadline(modalite_paiement);
      const stmts = getStatements();

      const transaction = db.transaction(() => {
        const result = stmts.stmtCreateFacture.run(
          normalizeId(client_id), String(client_nom).trim(), finalReference,
          Number(total_ht) || 0, Number(total_ttc) || 0,
          payment.statut_paiement, payment.montant_paye, payment.montant_restant,
          String(observation || '').trim(),
          String(mode_paiement || 'Espèces'), String(modalite_paiement || 'Immediat'),
          Number(frais_livraison) || 0, dateLimite
        );
        const factureId = Number(result.lastInsertRowid);
        let inserted = 0;
        for (const detail of normalizedDetails) {
          stmts.stmtInsertFactureDetail.run(factureId, detail.produit_id, detail.quantite, detail.prix_unitaire, detail.total, detail.tva_rate);
          inserted++;
        }
        for (const detail of normalizedDetails) {
          db.prepare('UPDATE produits SET quantite_stock = quantite_stock - ? WHERE id = ?').run(detail.quantite, detail.produit_id);
        }
        return { id: factureId, reference: finalReference, detailsCount: inserted };
      });

      const result = transaction();
      emitVentesChanged({ type: 'facture_created', id: result.id });
      return { success: true, data: result };
    } catch (err) { error('❌ create-facture:', err.message); return { success: false, error: err.message }; }
  });

  // ═══════════════════════════════════════════════════════════
  // ⭐ DELETE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('ventes:delete-devis', async (_event, id) => {
    try {
      const db = getDb(); const devisId = normalizeId(id);
      if (!devisId) return { success: false, error: 'ID devis invalide' };
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM details_devis WHERE devis_id = ?').run(devisId);
        db.prepare('DELETE FROM devis WHERE id = ?').run(devisId);
      });
      transaction();
      emitVentesChanged({ type: 'devis_deleted', id: devisId });
      return { success: true };
    } catch (err) { error('❌ delete-devis:', err.message); return { success: false, error: err.message }; }
  });

  ipcMain.handle('ventes:delete-facture', async (_event, id) => {
    try {
      const db = getDb(); const factureId = normalizeId(id);
      if (!factureId) return { success: false, error: 'ID facture invalide' };
      const stmts = getStatements(); const details = stmts.stmtGetFactureDetails.all(factureId);
      const transaction = db.transaction(() => {
        for (const detail of details) {
          const normalized = normalizeProductDetail(db, detail);
          if (!normalized) continue;
          db.prepare('UPDATE produits SET quantite_stock = quantite_stock + ? WHERE id = ?').run(normalized.quantite, normalized.produit_id);
        }
        db.prepare('DELETE FROM details_factures WHERE facture_id = ?').run(factureId);
        db.prepare('DELETE FROM factures WHERE id = ?').run(factureId);
      });
      transaction(); emitVentesChanged({ type: 'facture_deleted', id: factureId });
      return { success: true };
    } catch (err) { error('❌ delete-facture:', err.message); return { success: false, error: err.message }; }
  });

  // ═══════════════════════════════════════════════════════════
  // ⭐ UPDATE PAIEMENT
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('ventes:update-paiement', async (_event, id, data = {}) => {
    try {
      const db = getDb(); const itemId = normalizeId(id);
      if (!itemId) return { success: false, error: 'ID invalide' };
      const { type = 'devis', statut_paiement } = data || {};
      if (!type || !['devis', 'factures'].includes(type)) return { success: false, error: 'Type invalide' };
      const table = type === 'devis' ? 'devis' : 'factures';
      const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(itemId);
      if (!existing) return { success: false, error: 'Document non trouvé' };
      const totalTTC = Number(existing.total_ttc || 0);
      let nouveauStatut = statut_paiement || 'Non payé';
      let safeMontantPaye = 0, montantRestant = 0;
      if (nouveauStatut === 'Payé') { safeMontantPaye = totalTTC; montantRestant = 0; }
      else if (nouveauStatut === 'Non payé') { safeMontantPaye = 0; montantRestant = totalTTC; }
      else {
        const inputMontantPaye = Number(data.montant_paye) || 0;
        safeMontantPaye = Math.min(totalTTC, Math.max(0, inputMontantPaye));
        montantRestant = Math.max(0, totalTTC - safeMontantPaye);
      }
      db.prepare(`UPDATE ${table} SET statut_paiement = ?, montant_paye = ?, montant_restant = ? WHERE id = ?`).run(nouveauStatut, safeMontantPaye, montantRestant, itemId);
      emitVentesChanged({ type: 'payment_updated', id: itemId, table });
      return { success: true, data: { id: itemId, statut_paiement: nouveauStatut, montant_paye: safeMontantPaye, montant_restant: montantRestant } };
    } catch (err) { error('❌ update-paiement:', err.message); return { success: false, error: err.message }; }
  });

  return true;
}

module.exports = { registerVentesHandlers };