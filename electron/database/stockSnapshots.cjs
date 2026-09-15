'use strict';
// ============================================================
// electron/database/stockSnapshots.cjs
// LIFE'S ART ERP — Gestion des snapshots de stock
// ⭐ Enregistre un snapshot quotidien du stock
// ⭐ Fournit l'historique pour les variations & sparklines
// ⭐ Backfill intelligent (ne crée pas de snapshots vides)
// ⭐ FIX: pas de variation 100% fantôme
// ⭐ FIX: valeur stock cohérente avec products:get-stats (prix_vente)
// ============================================================

const { getDb } = require('./connection.cjs');

const log   = (...args) => console.log('[stock-snapshots]', ...args);
const error = (...args) => console.error('[stock-snapshots]', ...args);
const warn  = (...args) => console.warn('[stock-snapshots]', ...args);

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────
function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function tableExists(db, tableName) {
  try {
    const stmt = db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`);
    return !!stmt.get(tableName);
  } catch (_) { return false; }
}

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sliceDate(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

// ────────────────────────────────────────────────────────────
// CALCUL DU SNAPSHOT ACTUEL
// ⭐ FIX: mampiasa prix_vente (mifanaraka amin'ny products:get-stats)
// ────────────────────────────────────────────────────────────
function computeCurrentSnapshot(db) {
  const fallback = {
    stockValue: 0, stockTotal: 0, totalProduits: 0,
    ruptureStock: 0, alertesStock: 0, stockNormal: 0,
  };

  if (!db || !tableExists(db, 'produits')) return fallback;

  try {
    const row = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status != 'archive' THEN COALESCE(quantite_stock,0) * COALESCE(prix_vente,0) ELSE 0 END), 0) AS stockValue,
        COALESCE(SUM(CASE WHEN status != 'archive' THEN COALESCE(quantite_stock,0) ELSE 0 END), 0) AS stockTotal,
        COUNT(CASE WHEN status != 'archive' THEN 1 END) AS totalProduits,
        COUNT(CASE WHEN status = 'actif' AND COALESCE(quantite_stock,0) <= 0 THEN 1 END) AS ruptureStock,
        COUNT(CASE WHEN status = 'actif' AND COALESCE(quantite_stock,0) > 0 AND COALESCE(quantite_stock,0) <= COALESCE(quantite_minimale,0) THEN 1 END) AS alertesStock,
        COUNT(CASE WHEN status = 'actif' AND COALESCE(quantite_stock,0) > COALESCE(quantite_minimale,0) THEN 1 END) AS stockNormal
      FROM produits
    `).get();

    return {
      stockValue: toNumber(row?.stockValue),
      stockTotal: toNumber(row?.stockTotal),
      totalProduits: toNumber(row?.totalProduits),
      ruptureStock: toNumber(row?.ruptureStock),
      alertesStock: toNumber(row?.alertesStock),
      stockNormal: toNumber(row?.stockNormal),
    };
  } catch (err) {
    error('computeCurrentSnapshot:', err?.message || err);
    return fallback;
  }
}

// ────────────────────────────────────────────────────────────
// ROTATION — calculée sur les 30 derniers jours par défaut
// ⭐ FIX: mampiasa prix_vente pour rester cohérent avec stockValue
// ────────────────────────────────────────────────────────────
function computeRotationRate(db, days = 30) {
  if (!db) return 0;
  if (!tableExists(db, 'details_commandes') || !tableExists(db, 'commandes') || !tableExists(db, 'produits')) {
    return 0;
  }

  try {
    const cogsRow = db.prepare(`
      SELECT COALESCE(SUM(d.quantite * COALESCE(p.prix_vente, 0)), 0) AS cogs
      FROM details_commandes d
      INNER JOIN commandes c ON c.id = d.commande_id
      INNER JOIN produits p ON p.id = d.produit_id
      WHERE c.statut_paiement != 'Non payé'
        AND date(c.date_commande) >= date('now', '-' || ? || ' days')
    `).get(days);

    const stockRow = db.prepare(`
      SELECT COALESCE(SUM(COALESCE(quantite_stock,0) * COALESCE(prix_vente,0)), 0) AS stockValue
      FROM produits WHERE status != 'archive'
    `).get();

    const cogs = toNumber(cogsRow?.cogs);
    const stockValue = toNumber(stockRow?.stockValue);
    if (stockValue <= 0) return 0;
    return Number((cogs / stockValue).toFixed(2));
  } catch (err) {
    warn('computeRotationRate:', err?.message || err);
    return 0;
  }
}

// ────────────────────────────────────────────────────────────
// SNAPSHOT DU JOUR (UPSERT)
// ────────────────────────────────────────────────────────────
function saveTodaySnapshot() {
  try {
    const db = getDb();
    if (!db || !db.open) {
      error('DB indisponible');
      return false;
    }
    if (!tableExists(db, 'stock_snapshots')) {
      error('Table stock_snapshots inexistante');
      return false;
    }

    const today = formatLocalDate(new Date());
    const metrics = computeCurrentSnapshot(db);
    const rotation = computeRotationRate(db, 30);

    const stmt = db.prepare(`
      INSERT INTO stock_snapshots (
        date_snapshot, stock_value, stock_total, total_produits,
        rupture_stock, alertes_stock, stock_normal, rotation_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date_snapshot) DO UPDATE SET
        stock_value = excluded.stock_value,
        stock_total = excluded.stock_total,
        total_produits = excluded.total_produits,
        rupture_stock = excluded.rupture_stock,
        alertes_stock = excluded.alertes_stock,
        stock_normal = excluded.stock_normal,
        rotation_rate = excluded.rotation_rate,
        created_at = CURRENT_TIMESTAMP
    `);
    stmt.run(
      today,
      metrics.stockValue,
      metrics.stockTotal,
      metrics.totalProduits,
      metrics.ruptureStock,
      metrics.alertesStock,
      metrics.stockNormal,
      rotation
    );

    log(`✅ Snapshot ${today} enregistré`, {
      stockValue: metrics.stockValue,
      ruptureStock: metrics.ruptureStock,
      alertesStock: metrics.alertesStock,
      rotation,
    });
    return true;
  } catch (err) {
    error('saveTodaySnapshot:', err?.message || err);
    return false;
  }
}

// ────────────────────────────────────────────────────────────
// LECTURE — snapshot le plus proche d'une date (<= date)
// ────────────────────────────────────────────────────────────
function getSnapshotAtDate(db, dateStr) {
  if (!db || !tableExists(db, 'stock_snapshots')) return null;
  const date = sliceDate(dateStr);
  if (!date) return null;

  try {
    const row = db.prepare(`
      SELECT *
      FROM stock_snapshots
      WHERE date_snapshot <= ?
        AND (stock_value > 0 OR rupture_stock > 0 OR alertes_stock > 0)
      ORDER BY date_snapshot DESC
      LIMIT 1
    `).get(date);

    if (row) return row;

    return db.prepare(`
      SELECT * FROM stock_snapshots
      WHERE stock_value > 0 OR rupture_stock > 0 OR alertes_stock > 0
      ORDER BY date_snapshot ASC LIMIT 1
    `).get() || null;
  } catch (err) {
    error('getSnapshotAtDate:', err?.message || err);
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// LECTURE — snapshots dans une plage
// ────────────────────────────────────────────────────────────
function getSnapshotsInRange(db, startDate, endDate) {
  if (!db || !tableExists(db, 'stock_snapshots')) return [];
  const start = sliceDate(startDate);
  const end = sliceDate(endDate);
  if (!start || !end) return [];

  try {
    return db.prepare(`
      SELECT *
      FROM stock_snapshots
      WHERE date_snapshot >= ? AND date_snapshot <= ?
      ORDER BY date_snapshot ASC
    `).all(start, end);
  } catch (err) {
    error('getSnapshotsInRange:', err?.message || err);
    return [];
  }
}

// ────────────────────────────────────────────────────────────
// LECTURE — série régulière de N points (sparklines)
// ────────────────────────────────────────────────────────────
function getSnapshotSeries(db, { startDate, endDate, points = 12 }) {
  if (!db || !tableExists(db, 'stock_snapshots')) return [];
  const startStr = sliceDate(startDate);
  const endStr = sliceDate(endDate);
  if (!startStr || !endStr) return [];

  try {
    const start = new Date(`${startStr}T00:00:00`);
    const end = new Date(`${endStr}T23:59:59`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

    const durationMs = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.round(durationMs / 86400000) + 1);
    const bucketDays = Math.max(1, Math.ceil(totalDays / points));
    const buckets = [];

    for (let i = 0; i < points; i++) {
      const bucketStart = new Date(start.getTime() + i * bucketDays * 86400000);
      if (bucketStart > end) break;
      const bucketEnd = new Date(Math.min(
        bucketStart.getTime() + (bucketDays - 1) * 86400000 + 86399999,
        end.getTime()
      ));
      buckets.push({
        start: formatLocalDate(bucketStart),
        end: formatLocalDate(bucketEnd),
      });
    }

    return buckets.map((b) => {
      const row = db.prepare(`
        SELECT *
        FROM stock_snapshots
        WHERE date_snapshot >= ? AND date_snapshot <= ?
          AND (stock_value > 0 OR rupture_stock > 0 OR alertes_stock > 0)
        ORDER BY date_snapshot DESC
        LIMIT 1
      `).get(b.start, b.end);
      return row || null;
    });
  } catch (err) {
    error('getSnapshotSeries:', err?.message || err);
    return [];
  }
}

// ────────────────────────────────────────────────────────────
// BACKFILL INTELLIGENT
// ────────────────────────────────────────────────────────────
function backfillSnapshots(fromDate, toDate) {
  try {
    const db = getDb();
    if (!db || !db.open) return 0;
    if (!tableExists(db, 'stock_snapshots')) return 0;

    const fromStr = sliceDate(fromDate);
    const toStr = sliceDate(toDate);
    if (!fromStr || !toStr) return 0;

    const current = computeCurrentSnapshot(db);

    if (current.stockValue === 0 && current.ruptureStock === 0 && current.alertesStock === 0) {
      warn('⚠️ Backfill annulé : stock actuel totalement vide');
      return 0;
    }

    const mouvementsParJour = new Map();

    if (tableExists(db, 'entrees_stock')) {
      const rows = db.prepare(`
        SELECT substr(date_entree, 1, 10) AS jour,
               COALESCE(SUM(quantite * COALESCE(prix_unitaire, 0)), 0) AS total
        FROM entrees_stock
        WHERE substr(date_entree, 1, 10) >= ? AND substr(date_entree, 1, 10) <= ?
        GROUP BY substr(date_entree, 1, 10)
      `).all(fromStr, toStr);
      for (const r of rows) {
        if (!mouvementsParJour.has(r.jour)) mouvementsParJour.set(r.jour, { entrees: 0, sorties: 0 });
        mouvementsParJour.get(r.jour).entrees = toNumber(r.total);
      }
    }

    if (tableExists(db, 'sorties_stock')) {
      const rows = db.prepare(`
        SELECT substr(date_sortie, 1, 10) AS jour,
               COALESCE(SUM(quantite * COALESCE(prix_unitaire, 0)), 0) AS total
        FROM sorties_stock
        WHERE substr(date_sortie, 1, 10) >= ? AND substr(date_sortie, 1, 10) <= ?
        GROUP BY substr(date_sortie, 1, 10)
      `).all(fromStr, toStr);
      for (const r of rows) {
        if (!mouvementsParJour.has(r.jour)) mouvementsParJour.set(r.jour, { entrees: 0, sorties: 0 });
        mouvementsParJour.get(r.jour).sorties = toNumber(r.total);
      }
    }

    const aDesMouvements = Array.from(mouvementsParJour.values()).some(
      (m) => m.entrees > 0 || m.sorties > 0
    );

    if (!aDesMouvements) {
      warn('⚠️ Backfill annulé : aucun mouvement (entrées/sorties) dans la période');
      const today = formatLocalDate(new Date());
      const existing = db.prepare(`SELECT 1 FROM stock_snapshots WHERE date_snapshot = ?`).get(today);
      if (!existing) {
        const rotation = computeRotationRate(db, 30);
        db.prepare(`
          INSERT INTO stock_snapshots
            (date_snapshot, stock_value, stock_total, total_produits,
             rupture_stock, alertes_stock, stock_normal, rotation_rate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          today,
          current.stockValue,
          current.stockTotal,
          current.totalProduits,
          current.ruptureStock,
          current.alertesStock,
          current.stockNormal,
          rotation
        );
        log(`✅ Snapshot unique du ${today} créé (valeur actuelle)`);
        return 1;
      }
      return 0;
    }

    const dates = [];
    const cursor = new Date(`${toStr}T00:00:00`);
    const limit = new Date(`${fromStr}T00:00:00`);
    while (cursor >= limit) {
      dates.push(formatLocalDate(cursor));
      cursor.setDate(cursor.getDate() - 1);
    }

    let currentValue = current.stockValue;
    let inserted = 0;
    const rotation = computeRotationRate(db, 30);

    for (const date of dates) {
      const exists = db.prepare(`SELECT 1 FROM stock_snapshots WHERE date_snapshot = ?`).get(date);
      if (!exists && currentValue > 0) {
        db.prepare(`
          INSERT INTO stock_snapshots
            (date_snapshot, stock_value, stock_total, total_produits,
             rupture_stock, alertes_stock, stock_normal, rotation_rate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          date,
          currentValue,
          current.stockTotal,
          current.totalProduits,
          current.ruptureStock,
          current.alertesStock,
          current.stockNormal,
          rotation
        );
        inserted++;
      }

      const mv = mouvementsParJour.get(date) || { entrees: 0, sorties: 0 };
      currentValue = currentValue - mv.entrees + mv.sorties;
      if (currentValue < 0) currentValue = 0;
    }

    log(`✅ Backfill terminé: ${inserted} snapshot(s) créé(s)`);
    return inserted;
  } catch (err) {
    error('backfillSnapshots:', err?.message || err);
    return 0;
  }
}

// ────────────────────────────────────────────────────────────
// PRUNE — supprimer les snapshots trop vieux
// ────────────────────────────────────────────────────────────
function pruneOldSnapshots(daysToKeep = 730) {
  try {
    const db = getDb();
    if (!db || !tableExists(db, 'stock_snapshots')) return 0;
    const res = db.prepare(`
      DELETE FROM stock_snapshots
      WHERE date_snapshot < date('now', '-' || ? || ' days')
    `).run(daysToKeep);
    if (res.changes > 0) {
      log(`🧹 ${res.changes} ancien(s) snapshot(s) supprimé(s)`);
    }
    return res.changes || 0;
  } catch (err) {
    error('pruneOldSnapshots:', err?.message || err);
    return 0;
  }
}

// ────────────────────────────────────────────────────────────
// NETTOYAGE — supprimer les snapshots vides existants
// ────────────────────────────────────────────────────────────
function cleanEmptySnapshots() {
  try {
    const db = getDb();
    if (!db || !tableExists(db, 'stock_snapshots')) return 0;
    const res = db.prepare(`
      DELETE FROM stock_snapshots
      WHERE stock_value <= 0 AND rupture_stock <= 0 AND alertes_stock <= 0
        AND date_snapshot < date('now')
    `).run();
    if (res.changes > 0) {
      log(`🧹 ${res.changes} snapshot(s) vide(s) supprimé(s)`);
    }
    return res.changes || 0;
  } catch (err) {
    error('cleanEmptySnapshots:', err?.message || err);
    return 0;
  }
}

module.exports = {
  saveTodaySnapshot,
  getSnapshotAtDate,
  getSnapshotsInRange,
  getSnapshotSeries,
  computeCurrentSnapshot,
  computeRotationRate,
  backfillSnapshots,
  pruneOldSnapshots,
  cleanEmptySnapshots,
};