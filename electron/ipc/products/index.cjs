// electron/ipc/products/index.cjs - IPC HANDLERS PRODUITS (FIXED)
'use strict';

const { getDb } = require('../../database/connection.cjs');
const { logAudit } = require('./audit.cjs');
const { log, error } = require('./logger.cjs');
const { buildProductsQuery, buildProductsCountQuery } = require('./queries.cjs');
const { prepareStatements } = require('./statements.cjs');

const DEBUG = false;

function normalizeId(value) { const id = Number.parseInt(value, 10); return (Number.isInteger(id) && id > 0) ? id : null; }
function numberOr(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function getUserId(event, fallback = null) { try { const userId = event?.sender?.user?.id; if (userId !== undefined && userId !== null) return Number(userId); } catch (_) {} return fallback; }

function withDbCheck(fn) { return (event, ...args) => { const db = getDb(); if (!db || !db.open) { console.error('[❌ products] Database connection is not open'); return { success: false, error: 'Database connection is not open' }; } return fn(db, event, ...args); }; }

function emitProductsChanged(productData) { try { const { BrowserWindow } = require('electron'); const windows = BrowserWindow.getAllWindows(); if (!windows.length) return; for (const win of windows) { if (!win || win.isDestroyed()) continue; try { win.webContents.send('products:changed', productData); } catch (err) {} } } catch (err) {} }

// ⭐ FIX: Mamorona code unique raha efa misy
function generateUniqueCode(db, requestedCode = null) {
  let code = requestedCode;
  if (!code) {
    // Raha tsy misy code nomena, mamorona code automatique
    const base = 'PRD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    code = base;
  }
  // Mamerina ny code raha efa misy (na actif na inactif)
  const existing = db.prepare('SELECT id FROM produits WHERE code = ?').get(code);
  if (existing) {
    // Mamorona code vaovao raha efa misy
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 10).toUpperCase();
    code = `PRD-${timestamp}-${random}`;
  }
  return code;
}

function registerProductsHandlers(ipcMain) {
  if (DEBUG) log('🔥 REGISTER PRODUCTS HANDLERS');
  if (!ipcMain) throw new Error('ipcMain est null/undefined');

  if (!prepareStatements()) { error('❌ Impossible de préparer les statements produits'); return false; }

  const channels = ['products:get-all','products:get-by-id','products:get-by-code','products:create','products:update','products:delete','products:get-alertes','products:get-top','products:get-by-categorie','products:search','products:update-stock','products:get-stats','products:bulk-update-status','products:bulk-delete'];
  for (const ch of channels) { try { ipcMain.removeHandler(ch); } catch (_) {} }

  ipcMain.handle('products:get-all', withDbCheck((db, event, options = {}) => {
    const dataQuery = buildProductsQuery(options); const countQuery = buildProductsCountQuery(options);
    const data = db.prepare(dataQuery.query).all(...dataQuery.params); const totalRow = db.prepare(countQuery.query).get(...countQuery.params);
    const total = totalRow?.total || 0; const totalPages = Math.ceil(total / dataQuery.limit);
    return { success: true, data, pagination: { total, totalPages, page: dataQuery.page, limit: dataQuery.limit, offset: dataQuery.offset, hasNextPage: dataQuery.page < totalPages, hasPreviousPage: dataQuery.page > 1 } };
  }));

  ipcMain.handle('products:get-by-id', withDbCheck((db, event, id) => {
    const productId = normalizeId(id); if (!productId) return { success: false, error: 'ID invalide' };
    const produit = db.prepare(`SELECT p.id, p.code, p.nom, p.description, p.categorie_id, p.fournisseur_id, p.prix_achat, p.prix_vente, p.quantite_stock, p.quantite_minimale, p.unite, p.tva_rate, 
      CASE WHEN p.quantite_stock <= 0 THEN 'inactif' ELSE p.status END AS status,
      p.statut_stock, p.created_at, p.updated_at, c.nom AS categorie_nom, f.nom AS fournisseur_nom,
      (SELECT COUNT(DISTINCT dc.commande_id) FROM details_commandes dc WHERE dc.produit_id = p.id) AS nb_commandes 
      FROM produits p LEFT JOIN categories c ON c.id = p.categorie_id LEFT JOIN fournisseurs f ON f.id = p.fournisseur_id WHERE p.id = ?`).get(productId);
    if (!produit) return { success: false, error: 'Produit non trouvé' }; return { success: true, data: produit };
  }));

  ipcMain.handle('products:get-by-code', withDbCheck((db, event, code) => {
    const safeCode = String(code || '').trim();
    if (!safeCode) return { success: false, error: 'Code invalide' };
    const produit = db.prepare(`SELECT p.id, p.code, p.nom, p.description, p.categorie_id, p.fournisseur_id, p.prix_achat, p.prix_vente, p.quantite_stock, p.quantite_minimale, p.unite, p.tva_rate,
      CASE WHEN p.quantite_stock <= 0 THEN 'inactif' ELSE p.status END AS status,
      p.statut_stock, p.created_at, p.updated_at, c.nom AS categorie_nom
      FROM produits p LEFT JOIN categories c ON c.id = p.categorie_id WHERE p.code = ? LIMIT 1`).get(safeCode);
    if (!produit) return { success: false, error: 'Produit non trouvé' };
    return { success: true, data: produit };
  }));

  // ⭐ CREATE: Mampiasa generateUniqueCode
  ipcMain.handle('products:create', withDbCheck((db, event, data = {}) => {
    let code = String(data.code || '').trim();
    const nom = String(data.nom || '').trim();
    if (!nom) return { success: false, error: 'Nom requis' };
    if (!code) code = generateUniqueCode(db, null);
    else code = generateUniqueCode(db, code); // Raha efa misy dia hamorona vaovao

    const prixVente = numberOr(data.prix_vente, 0); if (prixVente <= 0) return { success: false, error: 'Prix de vente > 0 requis' };
    
    const stock = Math.max(0, Number.parseInt(data.quantite_stock, 10) || 0);
    const finalStatus = stock <= 0 ? 'inactif' : (data.status === 'inactif' ? 'inactif' : 'actif');

    const result = db.prepare(`INSERT INTO produits (code, nom, description, categorie_id, fournisseur_id, prix_achat, prix_vente, quantite_stock, quantite_minimale, unite, status, tva_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`).get(
      code, nom, String(data.description || '').trim(), data.categorie_id ? normalizeId(data.categorie_id) : null, data.fournisseur_id ? normalizeId(data.fournisseur_id) : null, numberOr(data.prix_achat, 0), prixVente, stock, Math.max(0, Number.parseInt(data.quantite_minimale, 10) || 5), String(data.unite || 'pièce').trim(), finalStatus, numberOr(data.tva_rate, 0.2)
    );
    const productId = result.id; logAudit('create', productId, code, getUserId(event), `Création: ${nom}`);
    emitProductsChanged({ type: 'created', id: productId, nom, code }); return { success: true, data: result };
  }));

  // ⭐ UPDATE: Mampiasa generateUniqueCode ho an'ny code vaovao
  ipcMain.handle('products:update', withDbCheck((db, event, id, data = {}) => {
    const productId = normalizeId(id); if (!productId) return { success: false, error: 'ID invalide' };
    const existing = db.prepare(`SELECT * FROM produits WHERE id = ?`).get(productId); if (!existing) return { success: false, error: 'Produit non trouvé' };
    let code = String(data.code || '').trim();
    const nom = String(data.nom || '').trim();
    if (!nom) return { success: false, error: 'Nom requis' };
    if (!code) code = existing.code;
    else code = generateUniqueCode(db, code, productId); // Raha code novaina fa efa misy, dia havaozina

    const prixVente = numberOr(data.prix_vente, 0); if (prixVente <= 0) return { success: false, error: 'Prix de vente > 0 requis' };
    
    const stock = Math.max(0, Number.parseInt(data.quantite_stock, 10) || 0);
    const finalStatus = stock <= 0 ? 'inactif' : (data.status === 'inactif' ? 'inactif' : 'actif');

    const result = db.prepare(`UPDATE produits SET code=?, nom=?, description=?, categorie_id=?, fournisseur_id=?, prix_achat=?, prix_vente=?, quantite_stock=?, quantite_minimale=?, unite=?, status=?, tva_rate=?, updated_at=CURRENT_TIMESTAMP WHERE id=? RETURNING *`).get(
      code, nom, String(data.description || '').trim(), data.categorie_id ? normalizeId(data.categorie_id) : null, data.fournisseur_id ? normalizeId(data.fournisseur_id) : null, numberOr(data.prix_achat, 0), prixVente, stock, Math.max(0, Number.parseInt(data.quantite_minimale, 10) || 5), String(data.unite || 'pièce').trim(), finalStatus, numberOr(data.tva_rate, 0.2), productId
    );
    logAudit('update', productId, code, getUserId(event), `Mise à jour: ${nom}`);
    emitProductsChanged({ type: 'updated', id: productId, nom, code }); return { success: true, data: result };
  }));

  // DELETE
  ipcMain.handle('products:delete', withDbCheck((db, event, id) => {
    const productId = normalizeId(id); if (!productId) return { success: false, error: 'ID invalide' };
    const existing = db.prepare(`SELECT * FROM produits WHERE id = ?`).get(productId); if (!existing) return { success: false, error: 'Produit non trouvé' };
    db.prepare(`UPDATE produits SET status = 'inactif', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(productId);
    logAudit('soft_delete', productId, existing.code, getUserId(event), `Marqué inactif: ${existing.nom}`);
    emitProductsChanged({ type: 'deleted', id: productId, nom: existing.nom, code: existing.code }); return { success: true, data: { action: 'soft_delete', id: productId } };
  }));

  // GET STATS
  ipcMain.handle('products:get-stats', withDbCheck((db, event) => {
    const row = db.prepare(`SELECT COUNT(*) AS total, COALESCE(SUM(quantite_stock), 0) AS totalStock, COALESCE(SUM(CASE WHEN quantite_stock <= 0 THEN 1 ELSE 0 END), 0) AS rupture, COALESCE(SUM(CASE WHEN quantite_stock > 0 AND quantite_stock <= quantite_minimale THEN 1 ELSE 0 END), 0) AS alerte, COALESCE(SUM(prix_vente * quantite_stock), 0) AS valeur_totale FROM produits WHERE status != 'archive'`).get();
    return { success: true, data: { total: Number(row?.total || 0), totalStock: Number(row?.totalStock || 0), rupture: Number(row?.rupture || 0), alerte: Number(row?.alerte || 0), valeur_totale: Number(row?.valeur_totale || 0) } };
  }));

  // GET ALERTES
  ipcMain.handle('products:get-alertes', withDbCheck((db, event, limit = 100) => { const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500); return { success: true, data: db.prepare(`SELECT id, code, nom, prix_vente, quantite_stock, quantite_minimale, status FROM produits WHERE status = 'actif' AND quantite_stock <= quantite_minimale ORDER BY quantite_stock ASC, id ASC LIMIT ?`).all(safeLimit) }; }));

  // GET TOP
  ipcMain.handle('products:get-top', withDbCheck((db, event, limit = 10) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const sql = `SELECT p.id, p.nom, p.code, p.prix_vente, COALESCE(SUM(dc.quantite), 0) AS total_vendu, COALESCE(COUNT(DISTINCT dc.commande_id), 0) AS nb_commandes, COALESCE(SUM(dc.total), 0) AS total_ca FROM produits p LEFT JOIN details_commandes dc ON dc.produit_id = p.id LEFT JOIN commandes c ON c.id = dc.commande_id AND c.statut != 'Annulée' WHERE p.status = 'actif' GROUP BY p.id ORDER BY total_vendu DESC, total_ca DESC LIMIT ?`;
    return { success: true, data: db.prepare(sql).all(safeLimit) };
  }));

  // SEARCH
  ipcMain.handle('products:search', withDbCheck((db, event, term, limit = 50) => { const cleanTerm = String(term || '').trim(); if (!cleanTerm) return { success: true, data: [], pagination: { count: 0 } }; const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100); const terms = cleanTerm.split(/\s+/).filter(Boolean).map(t => `"${t.replace(/"/g, '""')}"*`).join(' AND '); return { success: true, data: db.prepare(`SELECT p.*, c.nom AS categorie_nom FROM produits_fts f INNER JOIN produits p ON p.id = f.rowid LEFT JOIN categories c ON c.id = p.categorie_id WHERE produits_fts MATCH ? AND p.status != 'archive' ORDER BY p.nom COLLATE NOCASE ASC, p.id ASC LIMIT ?`).all(terms, safeLimit), pagination: { count: safeLimit } }; }));

  // GET BY CATEGORIE
  ipcMain.handle('products:get-by-categorie', withDbCheck((db, event, categorieId, limit = 50) => {
    const safeCategorieId = normalizeId(categorieId);
    if (!safeCategorieId) return { success: false, error: 'ID catégorie invalide' };
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const data = db.prepare(`SELECT p.*, c.nom AS categorie_nom FROM produits p LEFT JOIN categories c ON c.id = p.categorie_id WHERE p.categorie_id = ? AND p.status = 'actif' ORDER BY p.nom COLLATE NOCASE ASC, p.id ASC LIMIT ?`).all(safeCategorieId, safeLimit);
    return { success: true, data };
  }));

  // UPDATE STOCK
  ipcMain.handle('products:update-stock', withDbCheck((db, event, id, quantite, type, userId = null) => { 
    const productId = normalizeId(id); if (!productId) return { success: false, error: 'ID invalide' }; 
    const qty = Number(quantite); if (!Number.isFinite(qty) || qty <= 0) return { success: false, error: 'Quantité positive requise' }; 
    if (type !== 'entree' && type !== 'sortie') return { success: false, error: 'Type invalide' }; 
    const produit = db.prepare(`SELECT quantite_stock FROM produits WHERE id = ?`).get(productId); if (!produit) return { success: false, error: 'Produit non trouvé' }; 
    const ancienStock = Number(produit.quantite_stock) || 0; let nouveauStock = ancienStock; 
    if (type === 'entree') { nouveauStock += qty; } else { if (qty > ancienStock) return { success: false, error: `Stock insuffisant! Disponible: ${ancienStock}` }; nouveauStock -= qty; } 
    
    db.prepare(`UPDATE produits SET quantite_stock = ?, status = CASE WHEN ? <= 0 THEN 'inactif' ELSE status END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(nouveauStock, nouveauStock, productId); 
    return { success: true, data: { ancienStock, nouveauStock } }; 
  }));

  // BULK UPDATE STATUS
  ipcMain.handle('products:bulk-update-status', withDbCheck((db, event, ids, newStatus) => { 
    if (!Array.isArray(ids) || ids.length === 0) return { success: false, error: 'Aucun produit sélectionné' }; 
    if (newStatus !== 'actif' && newStatus !== 'inactif') return { success: false, error: 'Statut invalide' }; 
    const validIds = [...new Set(ids.map(normalizeId).filter(Boolean))].slice(0, 500); 
    if (!validIds.length) return { success: false, error: 'Liste d\'IDs invalide' }; 
    const placeholders = validIds.map(() => '?').join(','); 
    const stmt = db.prepare(`UPDATE produits SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`); 
    const result = db.transaction(() => stmt.run(newStatus, ...validIds))(); 
    return { success: true, changes: result.changes }; 
  }));
  
  // BULK DELETE
  ipcMain.handle('products:bulk-delete', withDbCheck((db, event, ids) => { 
    if (!Array.isArray(ids) || ids.length === 0) return { success: false, error: 'Aucun produit sélectionné' }; 
    const validIds = [...new Set(ids.map(normalizeId).filter(Boolean))].slice(0, 500); 
    if (!validIds.length) return { success: false, error: 'Liste d\'IDs invalide' }; 
    const placeholders = validIds.map(() => '?').join(','); 
    const stmt = db.prepare(`UPDATE produits SET status = 'inactif', updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`); 
    const result = db.transaction(() => stmt.run(...validIds))(); 
    return { success: true, changes: result.changes }; 
  }));

  if (DEBUG) log('✅ Products handlers enregistrés avec succès');
  return true;
}

module.exports = { registerProductsHandlers, emitProductsChanged };