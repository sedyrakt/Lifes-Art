// electron/ipc/achats/handlers.cjs
'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error, emitAchatsChanged } = require('./utils.cjs');
const { buildAchatsQuery, buildAchatsCountQuery } = require('./queries.cjs');
const { prepareStatements, getStatements } = require('./statements.cjs');
const { validateAchat } = require('./validation.cjs');

function normalizeId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeIds(ids, max = 50) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map(normalizeId).filter(Boolean))].slice(0, max);
}

function dbReady() {
  const db = getDb();
  return db && db.open ? db : null;
}

function fail(message, extra = {}) {
  return { success: false, error: message, ...extra };
}

function getStock(db, produitId) {
  const row = db.prepare(`SELECT quantite_stock FROM produits WHERE id = ?`).get(produitId);
  return Number(row?.quantite_stock || 0);
}

function updateStock(db, produitId, delta) {
  const result = db.prepare(`
    UPDATE produits SET quantite_stock = COALESCE(quantite_stock, 0) + ? WHERE id = ?
  `).run(delta, produitId);
  if (!result.changes) throw new Error(`Produit ${produitId} introuvable`);
}

function insertMouvement(db, { produitId, quantite, ancienStock, nouveauStock, reference, observation, prixUnitaire, type = 'ENTREE' }) {
  try {
    db.prepare(`
      INSERT INTO mouvements_stock (produit_id, type_mouvement, quantite, ancien_stock, nouveau_stock, reference, observation, prix_unitaire)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(produitId, type, quantite, ancienStock, nouveauStock, reference, observation, prixUnitaire);
  } catch (err) {
    console.warn(`⚠️ [achats] Mouvement ${type} non enregistré:`, err.message);
  }
}

function insertEntreeStock(db, { produitId, quantite, prixUnitaire, reference, fournisseurId, observation }) {
  try {
    db.prepare(`
      INSERT INTO entrees_stock (produit_id, quantite, prix_unitaire, reference, fournisseur_id, observation)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(produitId, quantite, prixUnitaire, reference, fournisseurId, observation);
  } catch (err) {
    console.warn('⚠️ [achats] Entrée stock non enregistrée:', err.message);
  }
}

function registerAchatsHandlers(ipcMain) {
  console.log('🛒 [achats.handlers] ENREGISTREMENT');
  if (!ipcMain) { console.error('❌ [achats.handlers] ipcMain null'); return false; }

  const channels = ['achats:get-all', 'achats:get-by-id', 'achats:get-details', 'achats:create', 'achats:update', 'achats:delete', 'achats:bulk-delete', 'achats:update-paiement'];
  for (const channel of channels) { try { ipcMain.removeHandler(channel); } catch (_) {} }

  try {
    const prepared = prepareStatements();
    if (!prepared) { console.error('❌ [achats.handlers] Impossible de préparer les statements'); return false; }
  } catch (err) {
    console.error('❌ [achats.handlers] Erreur préparation:', err.message);
    return false;
  }

  // GET ALL
  try {
    ipcMain.handle('achats:get-all', async (_event, options = {}) => {
      try {
        const db = dbReady();
        if (!db) return fail('Database connection is not open');
        const query = buildAchatsQuery(options);
        const count = buildAchatsCountQuery(options);
        const data = db.prepare(query.query).all(...query.params);
        const totalRow = db.prepare(count.query).get(...count.params);
        const total = Number(totalRow?.total || 0);
        const limit = Number(query.limit || 8);
        const page = Number(query.page || 1);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return { success: true, data, pagination: { page, limit, total, totalPages, hasMore: page < totalPages, hasPrevious: page > 1 } };
      } catch (err) {
        error('❌ [achats:get-all]', err.message);
        return fail(err.message);
      }
    });
    console.log('✅ [achats:get-all] enregistré');
  } catch (err) {
    console.error('❌ Impossible enregistrer achats:get-all:', err.message);
  }

  // GET BY ID
  try {
    ipcMain.handle('achats:get-by-id', async (_event, id) => {
      try {
        const achatId = normalizeId(id);
        if (!achatId) return fail('ID achat invalide');
        const db = dbReady();
        if (!db) return fail('Database connection is not open');
        const stmts = getStatements();
        const achat = stmts.stmtGetById.get(achatId);
        if (!achat) return fail('Achat non trouvé');
        return { success: true, data: achat };
      } catch (err) {
        console.error('❌ [achats:get-by-id]', err.message);
        return fail(err.message);
      }
    });
    console.log('✅ [achats:get-by-id] enregistré');
  } catch (err) {
    console.error('❌ Impossible enregistrer achats:get-by-id:', err.message);
  }

  // GET DETAILS
  try {
    ipcMain.handle('achats:get-details', async (_event, achatId) => {
      try {
        const id = normalizeId(achatId);
        if (!id) return fail('ID achat invalide');
        const db = dbReady();
        if (!db) return fail('Database connection is not open');
        const stmts = getStatements();
        const achat = stmts.stmtGetById.get(id);
        if (!achat) return fail('Achat non trouvé');
        const details = stmts.stmtGetDetails.all(id);
        return { success: true, data: { achat, details } };
      } catch (err) {
        console.error('❌ [achats:get-details]', err.message);
        return fail(err.message);
      }
    });
    console.log('✅ [achats:get-details] enregistré');
  } catch (err) {
    console.error('❌ Impossible enregistrer achats:get-details:', err.message);
  }

  // CREATE
  try {
    ipcMain.handle('achats:create', async (_event, data) => {
      try {
        if (!data || typeof data !== 'object') return fail('Données achat manquantes');
        const validation = validateAchat(data);
        if (!validation.valid) return fail(validation.errors.join(', '));
        const db = dbReady();
        if (!db) return fail('Database connection is not open');
        const stmts = getStatements();
        let finalReference = validation.data.reference;
        if (!finalReference) {
          const countResult = db.prepare(`SELECT COUNT(*) AS total FROM achats`).get();
          const nextNumber = Number(countResult?.total || 0) + 1;
          finalReference = `ACH-${String(nextNumber).padStart(4, '0')}`;
        }
        const params = [validation.data.fournisseur_id, finalReference, validation.data.date_achat, validation.data.total_ht, validation.data.total_ttc, validation.data.designation, validation.data.nombre_produits, validation.data.statut_paiement, validation.data.montant_paye, validation.data.montant_restant, validation.data.observation];
        const transaction = db.transaction(() => {
          const result = stmts.stmtCreate.run(...params);
          const achatId = Number(result.lastInsertRowid);
          if (!Number.isInteger(achatId) || achatId <= 0) throw new Error('ID achat invalide');
          for (const detail of validation.data.details) {
            const produit = stmts.stmtCheckProduit.get(detail.produit_id);
            if (!produit) throw new Error(`Produit ${detail.produit_id} introuvable`);
            const ancienStock = Number(produit.quantite_stock || 0);
            const nouveauStock = ancienStock + detail.quantite;
            updateStock(db, detail.produit_id, detail.quantite);
            insertEntreeStock(db, { produitId: detail.produit_id, quantite: detail.quantite, prixUnitaire: detail.prix_unitaire, reference: finalReference, fournisseurId: validation.data.fournisseur_id, observation: `Achat ${finalReference} validé` });
            insertMouvement(db, { produitId: detail.produit_id, quantite: detail.quantite, ancienStock, nouveauStock, reference: finalReference, observation: `Entrée de stock - Achat ${finalReference}`, prixUnitaire: detail.prix_unitaire, type: 'ENTREE' });
            
            // ⭐ FIX: NAMPIANA NY TVA RATE (6ème paramètre)
            stmts.stmtInsertDetail.run(achatId, detail.produit_id, detail.quantite, detail.prix_unitaire, detail.total, detail.tva_rate);
          }
          return achatId;
        });
        const newId = transaction();
        emitAchatsChanged({ type: 'create', id: newId });
        return { success: true, data: { id: newId, reference: finalReference } };
      } catch (err) {
        console.error('❌ [achats:create]', err.message);
        return fail(err.message);
      }
    });
    console.log('✅ [achats:create] enregistré');
  } catch (err) {
    console.error('❌ Impossible enregistrer achats:create:', err.message);
  }

  // UPDATE
  try {
    ipcMain.handle('achats:update', async (_event, id, data) => {
      try {
        const achatId = normalizeId(id);
        if (!achatId) return fail('ID achat invalide');
        if (!data || typeof data !== 'object') return fail('Données achat manquantes');
        const validation = validateAchat(data);
        if (!validation.valid) return fail(validation.errors.join(', '));
        const db = dbReady();
        if (!db) return fail('Database connection is not open');
        const stmts = getStatements();
        const existing = stmts.stmtGetById.get(achatId);
        if (!existing) return fail('Achat non trouvé');
        let finalReference = validation.data.reference;
        if (!finalReference) finalReference = existing.reference;
        const params = [validation.data.fournisseur_id, finalReference, validation.data.date_achat, validation.data.total_ht, validation.data.total_ttc, validation.data.designation, validation.data.nombre_produits, validation.data.statut_paiement, validation.data.montant_paye, validation.data.montant_restant, validation.data.observation, achatId];
        const transaction = db.transaction(() => {
          const oldDetails = stmts.stmtGetDetails.all(achatId);
          for (const oldDetail of oldDetails) {
            const produit = stmts.stmtCheckProduit.get(oldDetail.produit_id);
            if (!produit) throw new Error(`Produit ${oldDetail.produit_id} introuvable`);
            const ancienStock = Number(produit.quantite_stock || 0);
            const nouveauStock = ancienStock - Number(oldDetail.quantite);
            if (nouveauStock < 0) throw new Error(`Stock insuffisant pour annuler l'ancien achat du produit ${oldDetail.produit_id}`);
            updateStock(db, oldDetail.produit_id, -Number(oldDetail.quantite));
            insertMouvement(db, { produitId: oldDetail.produit_id, quantite: Number(oldDetail.quantite), ancienStock, nouveauStock, reference: finalReference, observation: `Annulation ancien stock - Modification achat ${finalReference}`, prixUnitaire: Number(oldDetail.prix_unitaire || 0), type: 'SORTIE' });
          }
          stmts.stmtDeleteDetails.run(achatId);
          stmts.stmtUpdate.run(...params);
          for (const detail of validation.data.details) {
            const produit = stmts.stmtCheckProduit.get(detail.produit_id);
            if (!produit) throw new Error(`Produit ${detail.produit_id} introuvable`);
            const ancienStock = Number(produit.quantite_stock || 0);
            const nouveauStock = ancienStock + detail.quantite;
            updateStock(db, detail.produit_id, detail.quantite);
            insertEntreeStock(db, { produitId: detail.produit_id, quantite: detail.quantite, prixUnitaire: detail.prix_unitaire, reference: finalReference, fournisseurId: validation.data.fournisseur_id, observation: `Achat ${finalReference} modifié` });
            insertMouvement(db, { produitId: detail.produit_id, quantite: detail.quantite, ancienStock, nouveauStock, reference: finalReference, observation: `Entrée de stock - Achat ${finalReference} modifié`, prixUnitaire: detail.prix_unitaire, type: 'ENTREE' });
            
            // ⭐ FIX: NAMPIANA NY TVA RATE (6ème paramètre)
            stmts.stmtInsertDetail.run(achatId, detail.produit_id, detail.quantite, detail.prix_unitaire, detail.total, detail.tva_rate);
          }
        });
        transaction();
        emitAchatsChanged({ type: 'update', id: achatId });
        return { success: true, data: { id: achatId } };
      } catch (err) {
        console.error('❌ [achats:update]', err.message);
        return fail(err.message);
      }
    });
    console.log('✅ [achats:update] enregistré');
  } catch (err) {
    console.error('❌ Impossible enregistrer achats:update:', err.message);
  }

  // DELETE
  try {
    ipcMain.handle('achats:delete', async (_event, id) => {
      try {
        const achatId = normalizeId(id);
        if (!achatId) return fail('ID achat invalide');
        const db = dbReady();
        if (!db) return fail('Database connection is not open');
        const stmts = getStatements();
        const existing = stmts.stmtGetById.get(achatId);
        if (!existing) return fail('Achat non trouvé');
        const transaction = db.transaction(() => {
          const details = stmts.stmtGetDetails.all(achatId);
          for (const detail of details) {
            const produit = stmts.stmtCheckProduit.get(detail.produit_id);
            if (!produit) throw new Error(`Produit ${detail.produit_id} introuvable`);
            const ancienStock = Number(produit.quantite_stock || 0);
            const nouveauStock = ancienStock - Number(detail.quantite);
            if (nouveauStock < 0) throw new Error(`Stock insuffisant pour supprimer l'achat ${existing.reference}`);
            updateStock(db, detail.produit_id, -Number(detail.quantite));
            insertMouvement(db, { produitId: detail.produit_id, quantite: Number(detail.quantite), ancienStock, nouveauStock, reference: existing.reference, observation: `Suppression achat ${existing.reference}`, prixUnitaire: Number(detail.prix_unitaire || 0), type: 'SORTIE' });
          }
          stmts.stmtDeleteDetails.run(achatId);
          stmts.stmtDelete.run(achatId);
        });
        transaction();
        emitAchatsChanged({ type: 'delete', id: achatId });
        return { success: true, data: { id: achatId } };
      } catch (err) {
        console.error('❌ [achats:delete]', err.message);
        return fail(err.message);
      }
    });
    console.log('✅ [achats:delete] enregistré');
  } catch (err) {
    console.error('❌ Impossible enregistrer achats:delete:', err.message);
  }

  // BULK DELETE
  try {
    ipcMain.handle('achats:bulk-delete', async (_event, ids) => {
      try {
        const safeIds = normalizeIds(ids);
        if (!safeIds.length) return fail('Aucun ID achat valide');
        const db = dbReady();
        if (!db) return fail('Database connection is not open');
        const stmts = getStatements();
        const transaction = db.transaction(() => {
          let deletedCount = 0;
          const deletedIds = [];
          for (const id of safeIds) {
            const existing = stmts.stmtGetById.get(id);
            if (!existing) continue;
            const details = stmts.stmtGetDetails.all(id);
            for (const detail of details) {
              const produit = stmts.stmtCheckProduit.get(detail.produit_id);
              if (!produit) throw new Error(`Produit ${detail.produit_id} introuvable`);
              const ancienStock = Number(produit.quantite_stock || 0);
              const nouveauStock = ancienStock - Number(detail.quantite);
              if (nouveauStock < 0) throw new Error(`Stock insuffisant pour supprimer l'achat ${existing.reference}`);
              updateStock(db, detail.produit_id, -Number(detail.quantite));
              insertMouvement(db, { produitId: detail.produit_id, quantite: Number(detail.quantite), ancienStock, nouveauStock, reference: existing.reference, observation: `Suppression achat ${existing.reference}`, prixUnitaire: Number(detail.prix_unitaire || 0), type: 'SORTIE' });
            }
            stmts.stmtDeleteDetails.run(id);
            stmts.stmtDelete.run(id);
            deletedCount++;
            deletedIds.push(id);
          }
          return { deletedCount, deletedIds };
        });
        const result = transaction();
        emitAchatsChanged({ type: 'bulk_delete', ids: result.deletedIds });
        return { success: true, deleted: result.deletedCount, ids: result.deletedIds };
      } catch (err) {
        console.error('❌ [achats:bulk-delete]', err.message);
        return fail(err.message);
      }
    });
    console.log('✅ [achats:bulk-delete] enregistré');
  } catch (err) {
    console.error('❌ Impossible enregistrer achats:bulk-delete:', err.message);
  }

  // ⭐ NEW: UPDATE PAIEMENT (Marquer comme payée)
  try {
    ipcMain.handle('achats:update-paiement', async (_event, id, data = {}) => {
      try {
        const achatId = normalizeId(id);
        if (!achatId) return fail('ID achat invalide');
        const db = dbReady();
        if (!db) return fail('Database connection is not open');
        const stmts = getStatements();
        const existing = stmts.stmtGetById.get(achatId);
        if (!existing) return fail('Achat non trouvé');

        const totalTTC = Number(existing.total_ttc || 0);
        const statutPaiement = data?.statut_paiement || 'Payé';
        let montantPaye = Number(existing.montant_paye || 0);
        let montantRestant = Number(existing.montant_restant || 0);

        if (statutPaiement === 'Payé') {
          montantPaye = totalTTC;
          montantRestant = 0;
        } else if (statutPaiement === 'Non payé') {
          montantPaye = 0;
          montantRestant = totalTTC;
        } else { // Partiel
          const newMontant = Number(data?.montant_paye || 0);
          montantPaye = Math.min(totalTTC, Math.max(0, newMontant));
          montantRestant = Math.max(0, totalTTC - montantPaye);
        }

        db.prepare(`
          UPDATE achats
          SET statut_paiement = ?, montant_paye = ?, montant_restant = ?
          WHERE id = ?
        `).run(statutPaiement, montantPaye, montantRestant, achatId);

        emitAchatsChanged({ type: 'update_paiement', id: achatId });
        return { success: true, data: { id: achatId, statut_paiement: statutPaiement, montant_paye: montantPaye, montant_restant: montantRestant } };
      } catch (err) {
        console.error('❌ [achats:update-paiement]', err.message);
        return fail(err.message);
      }
    });
    console.log('✅ [achats:update-paiement] enregistré');
  } catch (err) {
    console.error('❌ Impossible enregistrer achats:update-paiement:', err.message);
  }

  console.log('✅ [achats.handlers] Tous les handlers enregistrés');
  return true;
}

module.exports = { registerAchatsHandlers };