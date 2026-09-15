// electron/database/tables/fts.cjs
'use strict';

const { log, warn } = require('./helpers.cjs');

function createAllFTS(db) {
  // FTS5 PRODUITS
  try {
    db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS produits_fts USING fts5(nom, code, description, content='produits', content_rowid='id');`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS produits_ai AFTER INSERT ON produits BEGIN
      INSERT INTO produits_fts(rowid, nom, code, description) VALUES (new.id, new.nom, new.code, new.description);
    END;`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS produits_ad AFTER DELETE ON produits BEGIN
      INSERT INTO produits_fts(produits_fts, rowid, nom, code, description) VALUES ('delete', old.id, old.nom, old.code, old.description);
    END;`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS produits_au AFTER UPDATE ON produits BEGIN
      INSERT INTO produits_fts(produits_fts, rowid, nom, code, description) VALUES ('delete', old.id, old.nom, old.code, old.description);
      INSERT INTO produits_fts(rowid, nom, code, description) VALUES (new.id, new.nom, new.code, new.description);
    END;`);
    log('✅ FTS5 produits configuré');
  } catch (ftsErr) {
    warn('⚠️ FTS5 produits non disponible/configuré:', ftsErr.message);
  }

  // TRIGGER statut_stock
  try {
    db.exec(`DROP TRIGGER IF EXISTS update_statut_stock_after_stock_change;`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS update_statut_stock_after_stock_change
      AFTER UPDATE OF quantite_stock ON produits
      BEGIN
        UPDATE produits
        SET statut_stock = CASE
          WHEN NEW.quantite_stock <= 0 THEN 'rupture'
          WHEN NEW.quantite_stock <= NEW.quantite_minimale THEN 'alerte'
          ELSE 'disponible'
        END,
        status = NEW.status
        WHERE id = NEW.id;
      END;`);
    log('✅ Trigger statut_stock + status configuré');
  } catch (triggerErr) {
    warn('⚠️ Trigger statut_stock non configuré:', triggerErr.message);
  }

  return true;
}

module.exports = { createAllFTS };