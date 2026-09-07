const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('./utils.cjs');
const { buildClientsQuery, buildClientsCountQuery } = require('./queries.cjs');

const stmts = {};

function prepareStatements() {
  try {
    const db = getDb();
    if (!db) { error('❌ [clients:statements] Database non disponible'); return false; }

    stmts.getById = db.prepare(`
      SELECT
        c.id, c.nom, c.email, c.telephone, c.adresse, c.ville, c.code_postal, c.pays, c.type, c.created_at, c.updated_at,
        COALESCE(SUM(co.total_ttc), 0) AS total_achats,
        COUNT(DISTINCT co.id) AS nombre_commandes
      FROM clients c
      LEFT JOIN commandes co ON co.client_id = c.id
      WHERE c.id = ?
      GROUP BY c.id
      LIMIT 1
    `);

    stmts.getByEmail = db.prepare(`SELECT id, nom, email FROM clients WHERE email = ? AND email IS NOT NULL LIMIT 1`);
    stmts.getByType = db.prepare(`SELECT id, nom, email, telephone FROM clients WHERE type = ? ORDER BY id DESC LIMIT 100`);

    stmts.create = db.prepare(`INSERT INTO clients (nom, email, telephone, adresse, ville, code_postal, pays, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    stmts.update = db.prepare(`UPDATE clients SET nom = ?, email = ?, telephone = ?, adresse = ?, ville = ?, code_postal = ?, pays = ?, type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmts.delete = db.prepare(`DELETE FROM clients WHERE id = ?`);
    stmts.checkEmail = db.prepare(`SELECT id FROM clients WHERE email = ? AND email IS NOT NULL LIMIT 1`);
    stmts.checkEmailExcept = db.prepare(`SELECT id FROM clients WHERE email = ? AND email IS NOT NULL AND id != ? LIMIT 1`);

    stmts.search = db.prepare(`
      SELECT
        c.id, c.nom, c.email, c.telephone, c.adresse, c.ville, c.code_postal, c.pays, c.type, c.created_at,
        COALESCE(SUM(co.total_ttc), 0) AS total_achats,
        COUNT(DISTINCT co.id) AS nombre_commandes
      FROM clients c
      LEFT JOIN commandes co ON co.client_id = c.id
      WHERE c.nom LIKE ? OR c.email LIKE ? OR c.telephone LIKE ? OR c.ville LIKE ?
      GROUP BY c.id
      ORDER BY c.nom ASC, c.id ASC
      LIMIT 50
    `);

    // ⭐ FIX: Case-insensitive type + total_achats
    stmts.stats = db.prepare(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN LOWER(type) = 'particulier' THEN 1 ELSE 0 END) AS particuliers,
        SUM(CASE WHEN LOWER(type) = 'entreprise' THEN 1 ELSE 0 END) AS entreprises,
        COUNT(DISTINCT ville) AS villes,
        SUM(CASE WHEN telephone IS NOT NULL AND telephone != '' THEN 1 ELSE 0 END) AS avec_telephone,
        COALESCE(SUM(co.total_ttc), 0) AS total_achats
      FROM clients c
      LEFT JOIN commandes co ON co.client_id = c.id
    `);

    if (!stmts.create || !stmts.getById || !stmts.checkEmail) { error('❌ [clients:statements] Statements essentiels manquants'); return false; }
    log('✅ [clients:statements] Statements OK'); return true;
  } catch (err) { error('❌ [clients:statements] Erreur:', err.message); return false; }
}

function getStatements() { return stmts; }

module.exports = { prepareStatements, getStatements, buildClientsQuery, buildClientsCountQuery };