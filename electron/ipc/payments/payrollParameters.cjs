// electron/ipc/payments/payrollParameters.cjs
'use strict';

const { DEFAULT_PAYROLL_PARAMETERS } = require('./constants.cjs');
const {
  tableExists, safeJsonParse,
  normalizeBoolean, normalizeDecimal, normalizeMoney,
} = require('./helpers.cjs');

function detectPayrollParametersSchema(db) {
  if (!tableExists(db, 'parametres_paie')) return null;
  try {
    const columns = db.prepare(`PRAGMA table_info(parametres_paie)`).all().map((r) => r.name);
    if (columns.includes('cle')) return 'kv';
    if (columns.includes('heures_normales_mois')) return 'row';
  } catch (_) {}
  return 'unknown';
}

function ensurePayrollParametersTable(db) {
  const schema = detectPayrollParametersSchema(db);
  if (schema === 'row' || schema === 'kv') return schema;

  db.exec(`
    CREATE TABLE IF NOT EXISTS parametres_paie (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      mode_paie TEXT DEFAULT 'complet',
      heures_normales_mois REAL DEFAULT 173.33,
      jours_ouvrables_mois REAL DEFAULT 26,
      taux_heure_sup REAL DEFAULT 1.25,
      cnaps_actif INTEGER DEFAULT 0,
      cnaps_taux REAL DEFAULT 1.0,
      cnaps_base TEXT DEFAULT 'brut',
      cnaps_plafond REAL DEFAULT 1600000,
      ostie_actif INTEGER DEFAULT 0,
      ostie_taux REAL DEFAULT 1.0,
      ostie_base TEXT DEFAULT 'brut',
      ostie_plafond REAL DEFAULT 1600000,
      irsa_actif INTEGER DEFAULT 0,
      irsa_bareme TEXT DEFAULT '[{"min":0,"max":350000,"taux":0},{"min":350000,"max":400000,"taux":5},{"min":400000,"max":500000,"taux":10},{"min":500000,"max":600000,"taux":15},{"min":600000,"max":700000,"taux":20},{"min":700000,"max":null,"taux":25}]',
      irsa_base TEXT DEFAULT 'net_imposable',
      irsa_exoneration REAL DEFAULT 0,
      absences_actif INTEGER DEFAULT 1,
      absences_mode TEXT DEFAULT 'jour',
      avance_actif INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER
    );
  `);

  try {
    const count = db.prepare(`SELECT COUNT(*) AS c FROM parametres_paie`).get();
    if (!count || Number(count.c) === 0) {
      db.exec(`INSERT INTO parametres_paie (id) VALUES (1)`);
    }
  } catch (_) {}

  return 'row';
}

function mapIrsaBaremeToTranches(baremeRaw) {
  const parsed = safeJsonParse(baremeRaw, null);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return DEFAULT_PAYROLL_PARAMETERS.irsa_tranches;
  }
  if ('jusqua' in parsed[0]) return parsed;
  return parsed.map((t) => ({
    jusqua: t.max === null || t.max === undefined ? null : Number(t.max),
    taux: Number(t.taux || 0),
  }));
}

function tranchesToIrsaBareme(tranches) {
  const arr = Array.isArray(tranches) ? tranches : DEFAULT_PAYROLL_PARAMETERS.irsa_tranches;
  let previous = 0;
  return arr.map((t) => {
    const max = t.jusqua === null || t.jusqua === undefined ? null : Number(t.jusqua);
    const entry = { min: previous, max, taux: Number(t.taux || 0) };
    if (max !== null) previous = max;
    return entry;
  });
}

function normalizeMode(value, fallback = 'complet') {
  const v = String(value || '').toLowerCase().trim();
  if (v === 'simplifie' || v === 'simplifié' || v === 'simple') return 'simplifie';
  if (v === 'complet' || v === 'complete') return 'complet';
  return fallback;
}

function readPayrollParameters(db) {
  const schema = ensurePayrollParametersTable(db);

  if (schema === 'row') {
    let row = null;
    try { row = db.prepare(`SELECT * FROM parametres_paie WHERE id = 1`).get(); } catch (_) {}
    if (!row) {
      try { db.exec(`INSERT INTO parametres_paie (id) VALUES (1)`); } catch (_) {}
      row = db.prepare(`SELECT * FROM parametres_paie WHERE id = 1`).get() || {};
    }
    return {
      mode_paie: normalizeMode(row.mode_paie, DEFAULT_PAYROLL_PARAMETERS.mode_paie),
      cnaps_actif: normalizeBoolean(row.cnaps_actif, DEFAULT_PAYROLL_PARAMETERS.cnaps_actif),
      ostie_actif: normalizeBoolean(row.ostie_actif, DEFAULT_PAYROLL_PARAMETERS.ostie_actif),
      irsa_actif: normalizeBoolean(row.irsa_actif, DEFAULT_PAYROLL_PARAMETERS.irsa_actif),
      cnaps_taux: normalizeDecimal(row.cnaps_taux) || DEFAULT_PAYROLL_PARAMETERS.cnaps_taux,
      ostie_taux: normalizeDecimal(row.ostie_taux) || DEFAULT_PAYROLL_PARAMETERS.ostie_taux,
      cnaps_plafond: normalizeDecimal(row.cnaps_plafond) || DEFAULT_PAYROLL_PARAMETERS.cnaps_plafond,
      ostie_plafond: normalizeDecimal(row.ostie_plafond) || DEFAULT_PAYROLL_PARAMETERS.ostie_plafond,
      heures_mensuelles: normalizeDecimal(row.heures_normales_mois) || DEFAULT_PAYROLL_PARAMETERS.heures_mensuelles,
      majoration_heures_sup: normalizeDecimal(row.taux_heure_sup) || DEFAULT_PAYROLL_PARAMETERS.majoration_heures_sup,
      jours_mois: normalizeDecimal(row.jours_ouvrables_mois) || DEFAULT_PAYROLL_PARAMETERS.jours_mois,
      absence_active: normalizeBoolean(row.absences_actif, DEFAULT_PAYROLL_PARAMETERS.absence_active),
      irsa_exoneration: normalizeMoney(row.irsa_exoneration || 0),
      irsa_tranches: mapIrsaBaremeToTranches(row.irsa_bareme),
    };
  }

  if (schema === 'kv') {
    const rows = db.prepare(`SELECT cle, valeur FROM parametres_paie`).all();
    const result = { ...DEFAULT_PAYROLL_PARAMETERS };
    for (const row of rows) {
      if (!Object.prototype.hasOwnProperty.call(result, row.cle)) continue;
      result[row.cle] = safeJsonParse(row.valeur, result[row.cle]);
    }
    result.mode_paie = normalizeMode(result.mode_paie, DEFAULT_PAYROLL_PARAMETERS.mode_paie);
    result.cnaps_actif = normalizeBoolean(result.cnaps_actif, DEFAULT_PAYROLL_PARAMETERS.cnaps_actif);
    result.ostie_actif = normalizeBoolean(result.ostie_actif, DEFAULT_PAYROLL_PARAMETERS.ostie_actif);
    result.irsa_actif = normalizeBoolean(result.irsa_actif, DEFAULT_PAYROLL_PARAMETERS.irsa_actif);
    result.absence_active = normalizeBoolean(result.absence_active, DEFAULT_PAYROLL_PARAMETERS.absence_active);
    result.cnaps_taux = normalizeDecimal(result.cnaps_taux) || DEFAULT_PAYROLL_PARAMETERS.cnaps_taux;
    result.ostie_taux = normalizeDecimal(result.ostie_taux) || DEFAULT_PAYROLL_PARAMETERS.ostie_taux;
    result.cnaps_plafond = normalizeDecimal(result.cnaps_plafond) || DEFAULT_PAYROLL_PARAMETERS.cnaps_plafond;
    result.ostie_plafond = normalizeDecimal(result.ostie_plafond) || DEFAULT_PAYROLL_PARAMETERS.ostie_plafond;
    result.heures_mensuelles = normalizeDecimal(result.heures_mensuelles) || DEFAULT_PAYROLL_PARAMETERS.heures_mensuelles;
    result.majoration_heures_sup = normalizeDecimal(result.majoration_heures_sup) || DEFAULT_PAYROLL_PARAMETERS.majoration_heures_sup;
    result.jours_mois = normalizeDecimal(result.jours_mois) || DEFAULT_PAYROLL_PARAMETERS.jours_mois;
    result.irsa_exoneration = normalizeMoney(result.irsa_exoneration);
    if (!Array.isArray(result.irsa_tranches)) result.irsa_tranches = DEFAULT_PAYROLL_PARAMETERS.irsa_tranches;
    return result;
  }

  return { ...DEFAULT_PAYROLL_PARAMETERS };
}

function savePayrollParameters(db, data) {
  const schema = ensurePayrollParametersTable(db);
  const current = readPayrollParameters(db);
  const next = { ...current, ...data };

  if (schema === 'row') {
    const exists = db.prepare(`SELECT id FROM parametres_paie WHERE id = 1`).get();
    if (!exists) db.exec(`INSERT INTO parametres_paie (id) VALUES (1)`);

    db.prepare(`
      UPDATE parametres_paie SET
        mode_paie = ?,
        cnaps_actif = ?, ostie_actif = ?, irsa_actif = ?,
        cnaps_taux = ?, ostie_taux = ?,
        cnaps_plafond = ?, ostie_plafond = ?,
        heures_normales_mois = ?, taux_heure_sup = ?, jours_ouvrables_mois = ?,
        absences_actif = ?, irsa_exoneration = ?, irsa_bareme = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      normalizeMode(next.mode_paie, DEFAULT_PAYROLL_PARAMETERS.mode_paie),
      next.cnaps_actif ? 1 : 0,
      next.ostie_actif ? 1 : 0,
      next.irsa_actif ? 1 : 0,
      normalizeDecimal(next.cnaps_taux) || DEFAULT_PAYROLL_PARAMETERS.cnaps_taux,
      normalizeDecimal(next.ostie_taux) || DEFAULT_PAYROLL_PARAMETERS.ostie_taux,
      normalizeDecimal(next.cnaps_plafond) || DEFAULT_PAYROLL_PARAMETERS.cnaps_plafond,
      normalizeDecimal(next.ostie_plafond) || DEFAULT_PAYROLL_PARAMETERS.ostie_plafond,
      normalizeDecimal(next.heures_mensuelles) || DEFAULT_PAYROLL_PARAMETERS.heures_mensuelles,
      normalizeDecimal(next.majoration_heures_sup) || DEFAULT_PAYROLL_PARAMETERS.majoration_heures_sup,
      normalizeDecimal(next.jours_mois) || DEFAULT_PAYROLL_PARAMETERS.jours_mois,
      next.absence_active ? 1 : 0,
      normalizeMoney(next.irsa_exoneration || 0),
      JSON.stringify(tranchesToIrsaBareme(next.irsa_tranches))
    );

    return readPayrollParameters(db);
  }

  if (schema === 'kv') {
    const upsert = db.prepare(`
      INSERT INTO parametres_paie (cle, valeur, type, description, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(cle) DO UPDATE SET
        valeur = excluded.valeur, type = excluded.type,
        description = excluded.description, updated_at = CURRENT_TIMESTAMP
    `);
    const allowedKeys = Object.keys(DEFAULT_PAYROLL_PARAMETERS);
    const transaction = db.transaction(() => {
      for (const key of allowedKeys) {
        if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
        const value = next[key];
        const type = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'json';
        upsert.run(key, JSON.stringify(value), type, null);
      }
    });
    transaction();
    return readPayrollParameters(db);
  }

  return next;
}

module.exports = {
  detectPayrollParametersSchema,
  ensurePayrollParametersTable,
  mapIrsaBaremeToTranches,
  tranchesToIrsaBareme,
  normalizeMode,
  readPayrollParameters,
  savePayrollParameters,
};