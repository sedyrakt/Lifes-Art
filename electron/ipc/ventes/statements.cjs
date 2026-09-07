// electron/ipc/ventes/statements.cjs
'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('./utils.cjs');

let statements = null;

function prepareStatements() {
  try {
    const db = getDb();
    if (!db || !db.open) {
      error('❌ [ventes.statements] DB indisponible');
      return false;
    }

    statements = {
      stmtGetDevisById: db.prepare('SELECT * FROM devis WHERE id = ?'),
      stmtGetDevisDetails: db.prepare('SELECT * FROM details_devis WHERE devis_id = ?'),
      stmtCreateDevis: db.prepare(`INSERT INTO devis (client_id, client_nom, reference, total_ht, total_ttc, statut_paiement, montant_paye, montant_restant, validite_jours, observation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
      // ⭐ NAMPIANA NY tva_rate
      stmtInsertDevisDetail: db.prepare(`INSERT INTO details_devis (devis_id, produit_id, quantite, prix_unitaire, total, tva_rate) VALUES (?, ?, ?, ?, ?, ?)`),

      stmtGetFactureById: db.prepare('SELECT * FROM factures WHERE id = ?'),
      stmtGetFactureDetails: db.prepare('SELECT * FROM details_factures WHERE facture_id = ?'),
      stmtCreateFacture: db.prepare(`INSERT INTO factures (client_id, client_nom, reference, total_ht, total_ttc, statut_paiement, montant_paye, montant_restant, observation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`),
      // ⭐ NAMPIANA NY tva_rate
      stmtInsertFactureDetail: db.prepare(`INSERT INTO details_factures (facture_id, produit_id, quantite, prix_unitaire, total, tva_rate) VALUES (?, ?, ?, ?, ?, ?)`),

      stmtUpdateDevis: db.prepare(`UPDATE devis SET client_id = ?, client_nom = ?, reference = ?, total_ht = ?, total_ttc = ?, statut_paiement = ?, montant_paye = ?, montant_restant = ?, validite_jours = ?, observation = ? WHERE id = ?`),
      stmtDeleteDevisDetails: db.prepare('DELETE FROM details_devis WHERE devis_id = ?'),
      stmtDeleteDevis: db.prepare('DELETE FROM devis WHERE id = ?'),

      stmtUpdateFacture: db.prepare(`UPDATE factures SET client_id = ?, client_nom = ?, reference = ?, total_ht = ?, total_ttc = ?, statut_paiement = ?, montant_paye = ?, montant_restant = ?, observation = ? WHERE id = ?`),
      stmtDeleteFactureDetails: db.prepare('DELETE FROM details_factures WHERE facture_id = ?'),
      stmtDeleteFacture: db.prepare('DELETE FROM factures WHERE id = ?')
    };

    log('✅ [ventes.statements] Statements préparés (Avec TVA dynamique)');
    return true;
  } catch (err) {
    error('❌ [ventes.statements] Erreur:', err.message);
    return false;
  }
}

function getStatements() {
  if (!statements) throw new Error('Statements VENTES non préparés.');
  return statements;
}

module.exports = { prepareStatements, getStatements };