// electron/ipc/orders/handlers.cjs — LIFE'S ART ORDERS IPC (FIXED)
// ⭐ FIX: NAMPIANA NY TVA DYNAMIQUE (tva_rate) amin'ny create & update
'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('../../database/utils.cjs');
const { BrowserWindow } = require('electron');
const { validateOrder, normalizePaiement, computePaiementStatus } = require('./validation.cjs');
const { buildOrdersQuery, buildOrdersCountQuery } = require('./queries.cjs');
const { prepareStatements, getStatements } = require('./statements.cjs');

const VALID_PAIEMENT_STATUSES = ['Payé', 'Partiel', 'Non payé'];

function emitProductsChangedDirect(data = {}) {
  try {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        try { win.webContents.send('products:changed', data); } catch (_) {}
      }
    });
  } catch (_) {}
}

function emitOrdersChanged(data = {}) {
  try {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        try { win.webContents.send('orders:changed', data); } catch (_) {}
      }
    });
  } catch (_) {}
}

function emitFinancialChanged(data = {}) {
  try {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        try { win.webContents.send('financial:changed', data); } catch (_) {}
      }
    });
  } catch (_) {}
}

function normalizeId(value) {
  const id = Number(value);
  return (Number.isInteger(id) && id > 0) ? id : null;
}

function normalizePayment(totalTTC, montantPaye) {
  const total = Math.max(0, Number(totalTTC) || 0);
  const paye = Math.max(0, Math.min(total, Number(montantPaye) || 0));
  const restant = Math.max(0, total - paye);
  return {
    totalTTC: Number(total.toFixed(2)),
    montantPaye: Number(paye.toFixed(2)),
    montantRestant: Number(restant.toFixed(2)),
    statutPaiement: computePaiementStatus(total, paye)
  };
}

function updateProduitStatutStock(produitId) {
  try {
    const db = getDb();
    if (!db || !db.open) return;
    const produit = db.prepare(`SELECT id, quantite_stock, quantite_minimale FROM produits WHERE id = ?`).get(produitId);
    if (!produit) return;
    const stock = Number(produit.quantite_stock || 0);
    const seuil = Number(produit.quantite_minimale ?? 5);
    let statut = 'disponible';
    if (stock <= 0) statut = 'rupture';
    else if (stock <= seuil) statut = 'alerte';
    try {
      db.prepare(`UPDATE produits SET statut_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(statut, produitId);
    } catch (_) {}
  } catch (err) {
    error('❌ [orders] updateProduitStatutStock:', err.message);
  }
}

function restoreStockForCommande(commandeId, transactionMode = false) {
  const db = getDb();
  if (!db || !db.open) throw new Error('Base de données indisponible');
  const stmts = getStatements();
  if (!stmts?.stmtGetDetailsForRestore || !stmts?.stmtRestoreStock || !stmts?.stmtCheckStock || !stmts?.stmtInsertMouvementRestore) {
    throw new Error('Statements stock de commande indisponibles');
  }
  const details = stmts.stmtGetDetailsForRestore.all(commandeId);
  if (!details || details.length === 0) return [];
  const affectedIds = [];
  for (const detail of details) {
    const produitId = Number(detail.produit_id);
    const quantity = Number(detail.quantite);
    if (!produitId || !quantity) continue;
    const produitAvant = stmts.stmtCheckStock.get(produitId);
    if (!produitAvant) throw new Error(`Produit ${produitId} introuvable lors de la restauration du stock`);
    const ancienStock = Number(produitAvant.quantite_stock || 0);
    const nouveauStock = ancienStock + quantity;
    stmts.stmtRestoreStock.run(quantity, produitId);
    stmts.stmtInsertMouvementRestore.run(produitId, quantity, ancienStock, nouveauStock, `REST-${commandeId}`, `Restauration commande #${commandeId}`, produitId);
    affectedIds.push(produitId);
  }
  if (!transactionMode) affectedIds.forEach(updateProduitStatutStock);
  return affectedIds;
}

function registerOrdersHandlers(ipcMain) {
  log('📦 [orders.handlers] ENREGISTREMENT HANDLERS COMMANDES');
  if (!ipcMain) { error('❌ ipcMain est null/undefined!'); return false; }

  const prepared = prepareStatements();
  if (!prepared) error('❌ [orders.handlers] Impossible de préparer les statements');
  const statements = getStatements();
  if (!statements) error('❌ [orders.handlers] Statements indisponibles');

  const channels = [
    'orders:get-all', 'orders:get-by-id', 'orders:create', 'orders:update',
    'orders:delete', 'orders:get-details', 'orders:get-by-client',
    'orders:get-by-status', 'orders:get-by-date-range', 'orders:get-stats',
    'orders:get-products', 'orders:update-paiement', 'orders:update-status',
    'orders:get-with-details', 'orders:get-total', 'orders:get-by-number',
    'orders:get-journalieres', 'orders:get-dette-stats'
  ];
  channels.forEach(channel => { try { ipcMain.removeHandler(channel); } catch (_) {} });

  // GET ALL
  ipcMain.handle('orders:get-all', (event, options = {}) => {
    try {
      const db = getDb();
      if (!db || !db.open) return { success: false, error: 'Service de base de données non disponible' };
      const result = buildOrdersQuery(options || {});
      const data = db.prepare(result.query).all(result.params);
      const count = buildOrdersCountQuery(options || {});
      const countResult = db.prepare(count.query).get(count.params);
      const total = Number(countResult?.total || 0);
      return { success: true, data, pagination: { total, page: result.page, limit: result.limit, offset: result.offset, totalPages: result.limit > 0 ? Math.ceil(total / result.limit) : 0 } };
    } catch (err) {
      error('❌ [orders:get-all]', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET BY ID
  ipcMain.handle('orders:get-by-id', (event, id) => {
    try {
      if (!statements?.stmtGetById) return { success: false, error: 'Statements commandes indisponibles' };
      const normalizedId = normalizeId(id);
      if (!normalizedId) return { success: false, error: 'ID invalide' };
      const order = statements.stmtGetById.get(normalizedId);
      if (!order) return { success: false, error: 'Commande non trouvée' };
      order.numero = `CMD-${String(order.id).padStart(6, '0')}`;
      order.statut_paiement = normalizePaiement(order.statut_paiement) || computePaiementStatus(order.total_ttc, order.montant_paye);
      return { success: true, data: order };
    } catch (err) {
      error('❌ [orders:get-by-id]', err.message);
      return { success: false, error: err.message };
    }
  });

  // CREATE
  ipcMain.handle('orders:create', (event, data = {}) => {
    try {
      log('📦 [orders:create] Données reçues:', JSON.stringify(data));
      const db = getDb();
      if (!db || !db.open) return { success: false, error: 'Service de base de données non disponible' };
      if (!statements?.stmtCreate || !statements?.stmtInsertDetail || !statements?.stmtCheckStock || !statements?.stmtUpdateStock || !statements?.stmtInsertMouvement) {
        return { success: false, error: 'Statements commandes incomplets' };
      }
      
      const validation = validateOrder(data);
      if (!validation.valid) return { success: false, error: validation.errors.join(', ') };
      const validated = validation.data;

      if (validated.client_id) {
        const clientCheck = db.prepare('SELECT id FROM clients WHERE id = ?').get(validated.client_id);
        if (!clientCheck) {
          validated.client_id = null;
          validated.client_nom = 'Client';
        }
      }

      for (const product of validated.products) {
        const productCheck = db.prepare('SELECT id FROM produits WHERE id = ?').get(product.id);
        if (!productCheck) {
          return { success: false, error: `Produit ID ${product.id} introuvable. Veuillez vérifier le produit.` };
        }
      }

      const payment = normalizePayment(validated.total_ttc, validated.montant_paye);
      
      const requestedStatus = normalizePaiement(data.statut_paiement);
      if (requestedStatus) {
        payment.statutPaiement = requestedStatus;
      }

      if (!VALID_PAIEMENT_STATUSES.includes(payment.statutPaiement)) return { success: false, error: 'Statut paiement invalide' };
      
      let commandeId = null;
      const affectedProductIds = [];
      
      const transaction = db.transaction(() => {
        const result = statements.stmtCreate.run(
          validated.client_id || null, 
          validated.client_nom,
          validated.total_ht, 
          payment.totalTTC, 
          payment.totalTTC,
          payment.statutPaiement, 
          payment.montantPaye, 
          payment.montantRestant
        );
        
        commandeId = Number(result.lastInsertRowid);
        if (!commandeId) throw new Error('Impossible de créer la commande');
        
        for (const product of validated.products) {
          const produit = statements.stmtCheckStock.get(product.id);
          if (!produit) throw new Error(`Produit ${product.name || product.id} introuvable`);
          
          const qty = Number(product.quantity);
          const price = Number(product.price);
          // ⭐ FIX: NAMPIANA NY TVA RATE
          const tvaRate = Number(product.tva_rate) || 0.20; 
          
          if (!Number.isInteger(qty) || qty <= 0) throw new Error(`Quantité invalide pour ${product.name || product.id}`);
          if (!Number.isFinite(price) || price < 0) throw new Error(`Prix invalide pour ${product.name || product.id}`);
          
          const ancienStock = Number(produit.quantite_stock || 0);
          if (ancienStock < qty) throw new Error(`Stock insuffisant pour ${product.name || produit.nom}. Disponible: ${ancienStock}`);
          
          const nouveauStock = ancienStock - qty;
          const totalLigne = Number((qty * price).toFixed(2));
          
          // ⭐ FIX: NAMPIANA NY tva_rate (6 paramètres ao amin'ny stmtInsertDetail)
          statements.stmtInsertDetail.run(commandeId, product.id, qty, price, totalLigne, tvaRate);
          
          const stockResult = statements.stmtUpdateStock.run(qty, product.id, qty);
          if (stockResult.changes !== 1) throw new Error(`Impossible de mettre à jour le stock du produit ${product.name || product.id}`);
          
          statements.stmtInsertMouvement.run(
            product.id,
            qty,
            ancienStock,
            nouveauStock,
            `CMD-${commandeId}`,
            `Sortie liée à la commande #${commandeId}`
          );
          
          affectedProductIds.push(product.id);
        }
      });
      
      transaction();
      affectedProductIds.forEach(updateProduitStatutStock);
      
      emitProductsChangedDirect({ type: 'refresh' });
      emitOrdersChanged({ type: 'create', id: commandeId, statut_paiement: payment.statutPaiement, montant_paye: payment.montantPaye, montant_restant: payment.montantRestant });
      emitFinancialChanged({ type: 'order_created', id: commandeId });
      
      log(`✅ [orders:create] Commande ${commandeId} créée — ${payment.statutPaiement} — payé: ${payment.montantPaye} — restant: ${payment.montantRestant}`);
      return { success: true, data: { id: commandeId, numero: `CMD-${String(commandeId).padStart(6, '0')}`, statut_paiement: payment.statutPaiement, montant_paye: payment.montantPaye, montant_restant: payment.montantRestant } };
    } catch (err) {
      error('❌ [orders:create]', err.message);
      return { success: false, error: err.message };
    }
  });

  // UPDATE
  ipcMain.handle('orders:update', (event, id, data = {}) => {
    try {
      const db = getDb();
      if (!db || !db.open) return { success: false, error: 'Service de base de données non disponible' };
      const normalizedId = normalizeId(id);
      if (!normalizedId) return { success: false, error: 'ID invalide' };
      const existing = statements.stmtGetById.get(normalizedId);
      if (!existing) return { success: false, error: 'Commande non trouvée' };
      
      const validation = validateOrder(data);
      if (!validation.valid) return { success: false, error: validation.errors.join(', ') };
      const validated = validation.data;

      if (validated.client_id) {
        const clientCheck = db.prepare('SELECT id FROM clients WHERE id = ?').get(validated.client_id);
        if (!clientCheck) {
          validated.client_id = null;
          validated.client_nom = 'Client';
        }
      }

      for (const product of validated.products) {
        const productCheck = db.prepare('SELECT id FROM produits WHERE id = ?').get(product.id);
        if (!productCheck) {
          return { success: false, error: `Produit ID ${product.id} introuvable. Veuillez vérifier le produit.` };
        }
      }

      const payment = normalizePayment(validated.total_ttc, validated.montant_paye);
      
      const requestedStatus = normalizePaiement(data.statut_paiement);
      if (requestedStatus) {
        payment.statutPaiement = requestedStatus;
      }

      const affectedProductIds = [];
      
      const transaction = db.transaction(() => {
        const oldDetails = statements.stmtGetDetailsForRestore.all(normalizedId);
        for (const detail of oldDetails) {
          const produitId = Number(detail.produit_id);
          const qty = Number(detail.quantite);
          if (!produitId || !qty) continue;
          const produitAvant = statements.stmtCheckStock.get(produitId);
          if (!produitAvant) throw new Error(`Produit ${produitId} introuvable lors de la restauration`);
          const ancienStock = Number(produitAvant.quantite_stock || 0);
          const nouveauStock = ancienStock + qty;
          statements.stmtRestoreStock.run(qty, produitId);
          statements.stmtInsertMouvementRestore.run(
            produitId,
            qty,
            ancienStock,
            nouveauStock,
            `REST-${normalizedId}`,
            `Restauration avant modification commande #${normalizedId}`
          );
          affectedProductIds.push(produitId);
        }
        
        db.prepare(`DELETE FROM details_commandes WHERE commande_id = ?`).run(normalizedId);
        statements.stmtUpdate.run(validated.client_id || null, validated.client_nom, validated.total_ht, payment.totalTTC, payment.totalTTC, payment.statutPaiement, payment.montantPaye, payment.montantRestant, normalizedId);
        
        for (const product of validated.products) {
          const qty = Number(product.quantity);
          const price = Number(product.price);
          // ⭐ FIX: NAMPIANA NY TVA RATE
          const tvaRate = Number(product.tva_rate) || 0.20; 
          
          const produit = statements.stmtCheckStock.get(product.id);
          if (!produit) throw new Error(`Produit ${product.name || product.id} introuvable`);
          const ancienStock = Number(produit.quantite_stock || 0);
          if (ancienStock < qty) throw new Error(`Stock insuffisant pour ${product.name || produit.nom}. Disponible: ${ancienStock}`);
          const nouveauStock = ancienStock - qty;
          const totalLigne = Number((qty * price).toFixed(2));
          
          // ⭐ FIX: NAMPIANA NY tva_rate (6 paramètres ao amin'ny stmtInsertDetail)
          statements.stmtInsertDetail.run(normalizedId, product.id, qty, price, totalLigne, tvaRate);
          
          const stockResult = statements.stmtUpdateStock.run(qty, product.id, qty);
          if (stockResult.changes !== 1) throw new Error(`Impossible de mettre à jour le stock du produit ${product.id}`);
          
          statements.stmtInsertMouvement.run(
            product.id,
            qty,
            ancienStock,
            nouveauStock,
            `CMD-${normalizedId}`,
            `Sortie liée à la modification commande #${normalizedId}`
          );
          affectedProductIds.push(product.id);
        }
      });
      
      transaction();
      [...new Set(affectedProductIds)].forEach(updateProduitStatutStock);
      
      emitProductsChangedDirect({ type: 'refresh' });
      emitOrdersChanged({ type: 'update', id: normalizedId, statut_paiement: payment.statutPaiement, montant_paye: payment.montantPaye, montant_restant: payment.montantRestant });
      emitFinancialChanged({ type: 'order_updated', id: normalizedId });
      
      return { success: true, data: { id: normalizedId, statut_paiement: payment.statutPaiement, montant_paye: payment.montantPaye, montant_restant: payment.montantRestant } };
    } catch (err) {
      error('❌ [orders:update]', err.message);
      return { success: false, error: err.message };
    }
  });

  // UPDATE PAIEMENT
  ipcMain.handle('orders:update-paiement', (event, id, data = {}) => {
    try {
      const db = getDb();
      if (!db || !db.open) return { success: false, error: 'Service de base de données non disponible' };
      const normalizedId = normalizeId(id);
      if (!normalizedId) return { success: false, error: 'ID invalide' };
      const order = statements.stmtGetById.get(normalizedId);
      if (!order) return { success: false, error: 'Commande introuvable' };
      const totalTTC = Math.max(0, Number(order.total_ttc || 0));
      const payment = normalizePayment(totalTTC, data?.montant_paye ?? 0);
      const result = statements.stmtUpdatePaiement.run(payment.statutPaiement, payment.montantPaye, payment.montantRestant, normalizedId);
      if (result.changes !== 1) return { success: false, error: 'Aucune modification du paiement' };
      emitOrdersChanged({ type: 'update_paiement', id: normalizedId, statut_paiement: payment.statutPaiement, montant_paye: payment.montantPaye, montant_restant: payment.montantRestant });
      emitFinancialChanged({ type: 'payment_updated', id: normalizedId });
      log(`✅ [orders:update-paiement] CMD-${String(normalizedId).padStart(6, '0')} → ${payment.statutPaiement}`);
      return { success: true, data: { id: normalizedId, statut_paiement: payment.statutPaiement, montant_paye: payment.montantPaye, montant_restant: payment.montantRestant } };
    } catch (err) {
      error('❌ [orders:update-paiement]', err.message);
      return { success: false, error: err.message };
    }
  });

  // DELETE
  ipcMain.handle('orders:delete', (event, id) => {
    try {
      const db = getDb();
      if (!db || !db.open) return { success: false, error: 'Service de base de données non disponible' };
      const normalizedId = normalizeId(id);
      if (!normalizedId) return { success: false, error: 'ID invalide' };
      const existing = statements.stmtGetById.get(normalizedId);
      if (!existing) return { success: false, error: 'Commande non trouvée' };
      const affectedProductIds = [];
      const transaction = db.transaction(() => {
        const details = statements.stmtGetDetailsForRestore.all(normalizedId);
        for (const detail of details) {
          const produitId = Number(detail.produit_id);
          const qty = Number(detail.quantite);
          if (!produitId || !qty) continue;
          const produitAvant = statements.stmtCheckStock.get(produitId);
          if (!produitAvant) throw new Error(`Produit ${produitId} introuvable`);
          const ancienStock = Number(produitAvant.quantite_stock || 0);
          const nouveauStock = ancienStock + qty;
          statements.stmtRestoreStock.run(qty, produitId);
          statements.stmtInsertMouvementRestore.run(
            produitId,
            qty,
            ancienStock,
            nouveauStock,
            `REST-${normalizedId}`,
            `Restauration avant suppression commande #${normalizedId}`
          );
          affectedProductIds.push(produitId);
        }
        db.prepare(`DELETE FROM details_commandes WHERE commande_id = ?`).run(normalizedId);
        statements.stmtDelete.run(normalizedId);
      });
      transaction();
      [...new Set(affectedProductIds)].forEach(updateProduitStatutStock);
      emitProductsChangedDirect({ type: 'refresh' });
      emitOrdersChanged({ type: 'delete', id: normalizedId });
      emitFinancialChanged({ type: 'order_deleted', id: normalizedId });
      return { success: true, data: { id: normalizedId } };
    } catch (err) {
      error('❌ [orders:delete]', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET DETAILS
  ipcMain.handle('orders:get-details', (event, commandeId) => {
    try {
      const id = normalizeId(commandeId);
      if (!id) return { success: false, error: 'ID de commande invalide' };
      if (!statements.stmtGetDetails) return { success: false, error: 'Statements détails indisponibles' };
      return { success: true, data: statements.stmtGetDetails.all(id) || [] };
    } catch (err) {
      error('❌ [orders:get-details]', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET PRODUCTS
  ipcMain.handle('orders:get-products', (event, commandeId) => {
    try {
      const id = normalizeId(commandeId);
      if (!id) return { success: false, error: 'ID de commande invalide' };
      const commande = statements.stmtGetById.get(id);
      if (!commande) return { success: false, error: 'Commande non trouvée' };
      const products = statements.stmtGetProducts.all(id) || [];
      const formatted = products.map(product => ({
        id: product.produit_id, name: product.produit_nom || 'Produit', code: product.produit_code || '',
        quantity: Number(product.quantite || 0), price: Number(product.prix_unitaire || 0), total: Number(product.total_ligne || 0),
        tva_rate: Number(product.tva_rate || 0.2) // ⭐ FIX: Nampiana ny tva_rate
      }));
      return { success: true, data: formatted };
    } catch (err) {
      error('❌ [orders:get-products]', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET BY CLIENT
  ipcMain.handle('orders:get-by-client', (event, clientNom) => {
    try {
      if (!statements.stmtGetByClient) return { success: false, error: 'Statements client indisponibles' };
      if (!clientNom || !String(clientNom).trim()) return { success: false, error: 'Nom client requis' };
      return { success: true, data: statements.stmtGetByClient.all(`%${String(clientNom).trim()}%`) };
    } catch (err) {
      error('❌ [orders:get-by-client]', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET BY PAYMENT STATUS
  ipcMain.handle('orders:get-by-status', (event, statut) => {
    try {
      if (!statements.stmtGetByStatus) return { success: false, error: 'Statements statut indisponibles' };
      const normalized = normalizePaiement(statut);
      if (!normalized) return { success: false, error: 'Statut paiement invalide' };
      return { success: true, data: statements.stmtGetByStatus.all(normalized) };
    } catch (err) {
      error('❌ [orders:get-by-status]', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET BY DATE RANGE
  ipcMain.handle('orders:get-by-date-range', (event, startDate, endDate) => {
    try {
      if (!startDate || !endDate) return { success: false, error: 'Dates requises' };
      return { success: true, data: statements.stmtGetByDateRange.all(`${startDate} 00:00:00`, `${endDate} 23:59:59`) };
    } catch (err) {
      error('❌ [orders:get-by-date-range]', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET STATS
  ipcMain.handle('orders:get-stats', () => {
    try {
      const data = statements.stmtGetStats.get();
      return { success: true, data: data || { total: 0, total_ca: 0, total_ht: 0, moyenne_panier: 0, clients_uniques: 0, total_dette: 0, nb_commandes_non_payees: 0 } };
    } catch (err) {
      error('❌ [orders:get-stats]', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET DETTE STATS
  ipcMain.handle('orders:get-dette-stats', () => {
    try {
      const data = statements.stmtGetDetteStats.get();
      return { success: true, data: data || { total_dette: 0, nb_commandes_non_payees: 0 } };
    } catch (err) {
      error('❌ [orders:get-dette-stats]', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET TOTAL
  ipcMain.handle('orders:get-total', (event, commandeId) => {
    try {
      const id = normalizeId(commandeId);
      if (!id) return { success: false, error: 'ID de commande invalide' };
      const result = statements.stmtGetTotal.get(id);
      if (!result) return { success: false, error: 'Commande introuvable' };
      return { success: true, data: { total_ht: Number(result.total_ht || 0), total_ttc: Number(result.total_ttc || 0) } };
    } catch (err) {
      error('❌ [orders:get-total]', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET BY NUMBER
  ipcMain.handle('orders:get-by-number', (event, numero) => {
    try {
      const value = String(numero || '').trim();
      const match = value.match(/CMD-(\d+)/i);
      if (!match) return { success: false, error: 'Numéro de commande invalide' };
      const id = normalizeId(parseInt(match[1], 10));
      if (!id) return { success: false, error: 'Numéro de commande invalide' };
      const order = statements.stmtGetById.get(id);
      if (order) {
        order.numero = `CMD-${String(order.id).padStart(6, '0')}`;
        order.statut_paiement = normalizePaiement(order.statut_paiement) || computePaiementStatus(order.total_ttc, order.montant_paye);
      }
      return { success: true, data: order || null };
    } catch (err) {
      error('❌ [orders:get-by-number]', err.message);
      return { success: false, error: err.message };
    }
  });

  // GET WITH DETAILS
  ipcMain.handle('orders:get-with-details', (event, commandeId) => {
    try {
      const id = normalizeId(commandeId);
      if (!id) return { success: false, error: 'ID de commande invalide' };
      const commande = statements.stmtGetById.get(id);
      if (!commande) return { success: false, error: 'Commande non trouvée' };
      const details = statements.stmtGetDetails.all(id) || [];
      commande.numero = `CMD-${String(commande.id).padStart(6, '0')}`;
      commande.statut_paiement = normalizePaiement(commande.statut_paiement) || computePaiementStatus(commande.total_ttc, commande.montant_paye);
      const products = details.map(detail => ({
        id: detail.produit_id, name: detail.produit_nom || 'Produit', code: detail.produit_code || '',
        quantity: Number(detail.quantite || 0), price: Number(detail.prix_unitaire || 0), total: Number(detail.total || 0),
        tva_rate: Number(detail.tva_rate || 0.2) // ⭐ FIX: Nampiana ny tva_rate
      }));
      return { success: true, data: { ...commande, products, details } };
    } catch (err) {
      error('❌ [orders:get-with-details]', err.message);
      return { success: false, error: err.message };
    }
  });

  // JOURNALIERES
  ipcMain.handle('orders:get-journalieres', (event, options = {}) => {
    try {
      const startDate = options?.startDate;
      const endDate = options?.endDate;
      if (startDate && endDate) {
        return { success: true, data: statements.stmtGetJournalieres.all(`${startDate} 00:00:00`, `${endDate} 23:59:59`) };
      }
      const data = statements.stmtGetJournalieres.all('1970-01-01 00:00:00', '2999-12-31 23:59:59');
      return { success: true, data: Array.isArray(data) ? data.slice(0, 30) : [] };
    } catch (err) {
      error('❌ [orders:get-journalieres]', err.message);
      return { success: false, error: err.message };
    }
  });

  // OLD UPDATE STATUS — SUPPRIMÉ
  ipcMain.handle('orders:update-status', (event, id, statut) => {
    return { success: false, error: 'Les anciens statuts de commande sont supprimés. Utilisez le statut de paiement : Payé, Partiel ou Non payé.' };
  });

  log('✅ Orders handlers enregistrés avec succès');
  log('💳 Statuts paiement actifs: Payé | Partiel | Non payé');
  log('🧾 TVA Dynamique: 0% / 10% / 20% prête');

  return true;
}

module.exports = { registerOrdersHandlers };