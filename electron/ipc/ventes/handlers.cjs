// electron/ipc/ventes/handlers.cjs
'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error, emitVentesChanged } = require('./utils.cjs');
const { prepareStatements, getStatements } = require('./statements.cjs');

function normalizeId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeProductDetail(detail = {}) {
  const produit_id = normalizeId(detail.produit_id ?? detail.id);
  const quantite = Number(detail.quantite);
  const prix_unitaire = Number(detail.prix_unitaire) || 0;
  const tva_rate = Number(detail.tva_rate) || 0.2;
  
  if (!produit_id || !Number.isFinite(quantite) || quantite <= 0) return null;
  const total = Number.isFinite(Number(detail.total)) ? Number(detail.total) : quantite * prix_unitaire;
  return { produit_id, quantite, prix_unitaire, total, tva_rate };
}

function normalizeDetails(details) {
  if (!Array.isArray(details)) return [];
  return details.map(normalizeProductDetail).filter(Boolean);
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

function attachClientDetails(db, document) {
  if (!document || typeof document !== 'object') return document;
  if (document.client_telephone || document.client_email) return document;
  let client = null;
  if (document.client_id) {
    client = db.prepare('SELECT * FROM clients WHERE id = ?').get(document.client_id);
  }
  if (!client && document.client_nom) {
    client = db.prepare('SELECT * FROM clients WHERE TRIM(LOWER(nom)) = TRIM(LOWER(?))').get(document.client_nom);
  }
  if (client) {
    return { ...document, client_telephone: client.telephone || '', client_email: client.email || '' };
  }
  return document;
}

function registerVentesHandlers(ipcMain) {
  if (!ipcMain) { error('❌ ipcMain null'); return false; }

  const channels = [
    'ventes:get-devis', 'ventes:get-devis-by-id', 'ventes:create-devis',
    'ventes:update-devis', 'ventes:delete-devis', 'ventes:get-devis-details',
    'ventes:get-factures', 'ventes:get-facture-by-id', 'ventes:create-facture',
    'ventes:update-facture', 'ventes:delete-facture', 'ventes:get-facture-details',
    'ventes:convert-devis-to-facture', 'ventes:update-paiement'
  ];

  for (const channel of channels) {
    try { ipcMain.removeHandler(channel); } catch (_) {}
  }

  if (!prepareStatements()) {
    error('❌ Impossible de préparer les statements VENTES');
    return false;
  }

  // ⭐ FIX: CONVERT DEVIS TO FACTURE (Nampiana ny tva_rate)
  ipcMain.handle('ventes:convert-devis-to-facture', async (_event, devisId) => {
    try {
      const db = getDb();
      const id = normalizeId(devisId);
      if (!id) return { success: false, error: 'ID devis invalide' };

      const devis = db.prepare('SELECT * FROM devis WHERE id = ?').get(id);
      if (!devis) return { success: false, error: 'Devis non trouvé' };

      const details = db.prepare('SELECT * FROM details_devis WHERE devis_id = ?').all(id);
      if (details.length === 0) return { success: false, error: 'Aucun produit dans ce devis' };

      let finalReference = generateReference(db, 'factures', 'FAC');
      const payment = calculatePayment(Number(devis.total_ttc) || 0, Number(devis.montant_paye) || 0);

      const stmts = getStatements();
      const transaction = db.transaction(() => {
        const result = stmts.stmtCreateFacture.run(
          devis.client_id, devis.client_nom, finalReference,
          Number(devis.total_ht) || 0, Number(devis.total_ttc) || 0,
          payment.statut_paiement, payment.montant_paye, payment.montant_restant,
          devis.observation || ''
        );
        const factureId = Number(result.lastInsertRowid);

        for (const detail of details) {
          const tvaRate = Number(detail.tva_rate) || 0.2;
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
      log(`✅ Devis #${id} converti en Facture #${result.id} - Ref: ${finalReference}`);
      return { success: true, data: result };
    } catch (err) {
      error('❌ convert-devis-to-facture:', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET DEVIS DETAILS
  ipcMain.handle('ventes:get-devis-details', async (_event, devisId) => {
    try {
      const db = getDb();
      const id = normalizeId(devisId);
      if (!id) return { success: false, error: 'ID devis invalide' };
      const devis = db.prepare('SELECT * FROM devis WHERE id = ?').get(id);
      if (!devis) return { success: false, error: 'Devis non trouvé' };
      const enrichedDevis = attachClientDetails(db, devis);
      // ⭐ FIX: Esorina ny p.image
      const details = db.prepare(`
        SELECT dd.*, p.nom as produit_nom, p.code as produit_code
        FROM details_devis dd
        LEFT JOIN produits p ON p.id = dd.produit_id
        WHERE dd.devis_id = ?
      `).all(id);
      return { success: true, data: { devis: enrichedDevis, details } };
    } catch (err) {
      error('❌ get-devis-details:', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET FACTURE DETAILS
  ipcMain.handle('ventes:get-facture-details', async (_event, factureId) => {
    try {
      const db = getDb();
      const id = normalizeId(factureId);
      if (!id) return { success: false, error: 'ID facture invalide' };
      const facture = db.prepare('SELECT * FROM factures WHERE id = ?').get(id);
      if (!facture) return { success: false, error: 'Facture non trouvée' };
      const enrichedFacture = attachClientDetails(db, facture);
      // ⭐ FIX: Esorina ny p.image
      const details = db.prepare(`
        SELECT fd.*, p.nom as produit_nom, p.code as produit_code
        FROM details_factures fd
        LEFT JOIN produits p ON p.id = fd.produit_id
        WHERE fd.facture_id = ?
      `).all(id);
      return { success: true, data: { facture: enrichedFacture, details } };
    } catch (err) {
      error('❌ get-facture-details:', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET DEVIS / FACTURES PAGINATION
  ipcMain.handle('ventes:get-devis', async (_event, options = {}) => {
    try {
      const db = getDb();
      const { search = '', statut = '', page = 1, limit = 20 } = options || {};
      let where = 'WHERE 1=1';
      const params = [];
      if (search && String(search).trim()) {
        where += ' AND (reference LIKE ? OR client_nom LIKE ?)';
        const value = `%${String(search).trim()}%`;
        params.push(value, value);
      }
      if (statut) { where += ' AND statut_paiement = ?'; params.push(statut); }
      const offset = (Number(page) - 1) * Number(limit);
      const totalResult = db.prepare(`SELECT COUNT(*) as total FROM devis ${where}`).get(...params);
      const total = Number(totalResult?.total || 0);
      const rows = db.prepare(`SELECT * FROM devis ${where} ORDER BY date_devis DESC, id DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), offset);
      return { success: true, data: rows, pagination: { total, limit: Number(limit), page: Number(page), totalPages: Math.ceil(total / Number(limit)) } };
    } catch (err) {
      error('❌ get-devis:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ventes:get-factures', async (_event, options = {}) => {
    try {
      const db = getDb();
      const { search = '', statut = '', page = 1, limit = 20 } = options || {};
      let where = 'WHERE 1=1';
      const params = [];
      if (search && String(search).trim()) {
        where += ' AND (reference LIKE ? OR client_nom LIKE ?)';
        const value = `%${String(search).trim()}%`;
        params.push(value, value);
      }
      if (statut) { where += ' AND statut_paiement = ?'; params.push(statut); }
      const offset = (Number(page) - 1) * Number(limit);
      const totalResult = db.prepare(`SELECT COUNT(*) as total FROM factures ${where}`).get(...params);
      const total = Number(totalResult?.total || 0);
      const rows = db.prepare(`SELECT * FROM factures ${where} ORDER BY date_facture DESC, id DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), offset);
      return { success: true, data: rows, pagination: { total, limit: Number(limit), page: Number(page), totalPages: Math.ceil(total / Number(limit)) } };
    } catch (err) {
      error('❌ get-factures:', err.message);
      return { success: false, error: err.message };
    }
  });

  // CREATE DEVIS
  ipcMain.handle('ventes:create-devis', async (_event, data = {}) => {
    try {
      const db = getDb();
      const { client_id = null, client_nom = '', reference = '', total_ht = 0, total_ttc = 0, validite_jours = 30, observation = '', montant_paye = 0, details = [] } = data || {};
      if (!String(client_nom).trim()) return { success: false, error: 'Nom du client requis' };
      const normalizedDetails = normalizeDetails(details);
      if (normalizedDetails.length === 0) return { success: false, error: 'Au moins un produit est requis' };
      let finalReference = String(reference || '').trim();
      if (!finalReference) finalReference = generateReference(db, 'devis', 'DEV');
      const payment = calculatePayment(Number(total_ttc) || 0, montant_paye);
      const stmts = getStatements();
      const transaction = db.transaction(() => {
        const result = stmts.stmtCreateDevis.run(
          normalizeId(client_id), String(client_nom).trim(), finalReference,
          Number(total_ht) || 0, Number(total_ttc) || 0,
          payment.statut_paiement, payment.montant_paye, payment.montant_restant,
          Number(validite_jours) || 30, String(observation || '').trim()
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
      log(`✅ Devis créé #${result.id} - Ref: ${finalReference}`);
      return { success: true, data: result };
    } catch (err) {
      error('❌ create-devis:', err.message);
      return { success: false, error: err.message };
    }
  });

  // CREATE FACTURE
  ipcMain.handle('ventes:create-facture', async (_event, data = {}) => {
    try {
      const db = getDb();
      const { client_id = null, client_nom = '', reference = '', total_ht = 0, total_ttc = 0, observation = '', montant_paye = 0, details = [] } = data || {};
      if (!String(client_nom).trim()) return { success: false, error: 'Nom du client requis' };
      const normalizedDetails = normalizeDetails(details);
      if (normalizedDetails.length === 0) return { success: false, error: 'Au moins un produit est requis' };
      let finalReference = String(reference || '').trim();
      if (!finalReference) finalReference = generateReference(db, 'factures', 'FAC');
      const payment = calculatePayment(Number(total_ttc) || 0, montant_paye);
      const stmts = getStatements();
      const transaction = db.transaction(() => {
        const result = stmts.stmtCreateFacture.run(
          normalizeId(client_id), String(client_nom).trim(), finalReference,
          Number(total_ht) || 0, Number(total_ttc) || 0,
          payment.statut_paiement, payment.montant_paye, payment.montant_restant,
          String(observation || '').trim()
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
      log(`✅ Facture créée #${result.id} - Ref: ${finalReference}`);
      return { success: true, data: result };
    } catch (err) {
      error('❌ create-facture:', err.message);
      return { success: false, error: err.message };
    }
  });

  // DELETE DEVIS
  ipcMain.handle('ventes:delete-devis', async (_event, id) => {
    try {
      const db = getDb();
      const devisId = normalizeId(id);
      if (!devisId) return { success: false, error: 'ID devis invalide' };
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM details_devis WHERE devis_id = ?').run(devisId);
        db.prepare('DELETE FROM devis WHERE id = ?').run(devisId);
      });
      transaction();
      emitVentesChanged({ type: 'devis_deleted', id: devisId });
      return { success: true };
    } catch (err) {
      error('❌ delete-devis:', err.message);
      return { success: false, error: err.message };
    }
  });

  // DELETE FACTURE (Avereno ny stock)
  ipcMain.handle('ventes:delete-facture', async (_event, id) => {
    try {
      const db = getDb();
      const factureId = normalizeId(id);
      if (!factureId) return { success: false, error: 'ID facture invalide' };
      const stmts = getStatements();
      const details = stmts.stmtGetFactureDetails.all(factureId);
      const transaction = db.transaction(() => {
        for (const detail of details) {
          const normalized = normalizeProductDetail(detail);
          if (!normalized) continue;
          db.prepare('UPDATE produits SET quantite_stock = quantite_stock + ? WHERE id = ?').run(normalized.quantite, normalized.produit_id);
        }
        db.prepare('DELETE FROM details_factures WHERE facture_id = ?').run(factureId);
        db.prepare('DELETE FROM factures WHERE id = ?').run(factureId);
      });
      transaction();
      emitVentesChanged({ type: 'facture_deleted', id: factureId });
      return { success: true };
    } catch (err) {
      error('❌ delete-facture:', err.message);
      return { success: false, error: err.message };
    }
  });

  // UPDATE PAIEMENT
  ipcMain.handle('ventes:update-paiement', async (_event, id, data = {}) => {
    try {
      const db = getDb();
      const itemId = normalizeId(id);
      if (!itemId) return { success: false, error: 'ID invalide' };
      const { type = 'devis', statut_paiement } = data || {};
      if (!type || !['devis', 'factures'].includes(type)) {
        return { success: false, error: 'Type invalide (devis ou factures)' };
      }
      const table = type === 'devis' ? 'devis' : 'factures';
      const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(itemId);
      if (!existing) return { success: false, error: 'Document non trouvé' };
      const totalTTC = Number(existing.total_ttc || 0);
      let nouveauStatut = statut_paiement || 'Non payé';
      let safeMontantPaye = 0;
      let montantRestant = 0;
      if (nouveauStatut === 'Payé') {
        safeMontantPaye = totalTTC;
        montantRestant = 0;
      } else if (nouveauStatut === 'Non payé') {
        safeMontantPaye = 0;
        montantRestant = totalTTC;
      } else {
        const inputMontantPaye = Number(data.montant_paye) || 0;
        safeMontantPaye = Math.min(totalTTC, Math.max(0, inputMontantPaye));
        montantRestant = Math.max(0, totalTTC - safeMontantPaye);
      }
      db.prepare(`
        UPDATE ${table}
        SET statut_paiement = ?,
            montant_paye = ?,
            montant_restant = ?
        WHERE id = ?
      `).run(nouveauStatut, safeMontantPaye, montantRestant, itemId);
      emitVentesChanged({ type: 'payment_updated', id: itemId, table });
      return { success: true, data: { id: itemId, statut_paiement: nouveauStatut, montant_paye: safeMontantPaye, montant_restant: montantRestant } };
    } catch (err) {
      error('❌ update-paiement:', err.message);
      return { success: false, error: err.message };
    }
  });

  log('✅ Ventes handlers enregistrés (TVA Dynamique active)');
  return true;
}

module.exports = { registerVentesHandlers };