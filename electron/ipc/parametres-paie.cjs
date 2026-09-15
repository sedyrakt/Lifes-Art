// electron/ipc/parametres-paie.cjs
// ⭐ VERSION MADAGASCAR + MODE COMPLET/SIMPLIFIÉ
// ⭐ OSTIE 1% (part salariale)
// ⭐ Plafonds CNaPS/OSTIE
// ⭐ Barème IRSA progressif 6 tranches
// ⭐ irsa_exoneration

'use strict';
const { getDb } = require('../database/connection.cjs');

const log = (...a) => console.log('[⚙️ ParamètresPaie]', ...a);
const error = (...a) => console.error('[❌ ParamètresPaie]', ...a);

// ════════════════════════════════════════════════════════════
// DEFAULT PARAMS (MADAGASCAR)
// ════════════════════════════════════════════════════════════

const DEFAULT_PARAMS = {
  // ⭐ Mode : 'complet' | 'simplifie'
  mode_paie: 'complet',

  // Temps & heures
  heures_normales_mois: 173.33,
  jours_ouvrables_mois: 26,
  taux_heure_sup: 1.25,

  // ⭐ CNaPS : 1% salarial, plafond 1 600 000 Ar (8× SMIG)
  cnaps_actif: 1,
  cnaps_taux: 1.0,
  cnaps_base: 'brut',
  cnaps_plafond: 1600000,

  // ⭐ OSTIE : 1% salarial (part employé), plafond 1 600 000 Ar
  ostie_actif: 1,
  ostie_taux: 1.0,
  ostie_base: 'brut',
  ostie_plafond: 1600000,

  // ⭐ IRSA : barème progressif 6 tranches, base = net imposable
  irsa_actif: 1,
  irsa_bareme: [
    { min: 0,      max: 350000, taux: 0 },
    { min: 350000, max: 400000, taux: 5 },
    { min: 400000, max: 500000, taux: 10 },
    { min: 500000, max: 600000, taux: 15 },
    { min: 600000, max: 700000, taux: 20 },
    { min: 700000, max: null,   taux: 25 },
  ],
  irsa_base: 'net_imposable',
  irsa_exoneration: 0,

  // Absences & Avance
  absences_actif: 1,
  absences_mode: 'jour',
  avance_actif: 1,
};

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function getDbSafe() {
  const db = getDb();
  if (!db || !db.open) throw new Error('Base de données indisponible.');
  return db;
}

function parseBareme(value) {
  try {
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return DEFAULT_PARAMS.irsa_bareme;
    }
    if (Array.isArray(value) && value.length > 0) return value;
    return DEFAULT_PARAMS.irsa_bareme;
  } catch (_) {
    return DEFAULT_PARAMS.irsa_bareme;
  }
}

function normalizeMode(value) {
  const v = String(value || '').toLowerCase().trim();
  if (v === 'simplifie' || v === 'simplifié' || v === 'simple') return 'simplifie';
  return 'complet';
}

function normalizeParams(row) {
  if (!row) return { ...DEFAULT_PARAMS };
  return {
    mode_paie: normalizeMode(row.mode_paie),

    heures_normales_mois: Number(row.heures_normales_mois ?? DEFAULT_PARAMS.heures_normales_mois),
    jours_ouvrables_mois: Number(row.jours_ouvrables_mois ?? DEFAULT_PARAMS.jours_ouvrables_mois),
    taux_heure_sup: Number(row.taux_heure_sup ?? DEFAULT_PARAMS.taux_heure_sup),

    cnaps_actif: Number(row.cnaps_actif ?? 1) ? 1 : 0,
    cnaps_taux: Number(row.cnaps_taux ?? 1.0),
    cnaps_base: row.cnaps_base || 'brut',
    cnaps_plafond: Number(row.cnaps_plafond ?? 1600000),

    ostie_actif: Number(row.ostie_actif ?? 1) ? 1 : 0,
    ostie_taux: Number(row.ostie_taux ?? 1.0),
    ostie_base: row.ostie_base || 'brut',
    ostie_plafond: Number(row.ostie_plafond ?? 1600000),

    irsa_actif: Number(row.irsa_actif ?? 1) ? 1 : 0,
    irsa_bareme: parseBareme(row.irsa_bareme),
    irsa_base: row.irsa_base || 'net_imposable',
    irsa_exoneration: Number(row.irsa_exoneration ?? 0),

    absences_actif: Number(row.absences_actif ?? 1) ? 1 : 0,
    absences_mode: row.absences_mode || 'jour',
    avance_actif: Number(row.avance_actif ?? 1) ? 1 : 0,
  };
}

// ════════════════════════════════════════════════════════════
// GET PARAMS
// ════════════════════════════════════════════════════════════

function getParams() {
  try {
    const db = getDbSafe();
    let row = db.prepare('SELECT * FROM parametres_paie WHERE id = 1 LIMIT 1').get();
    if (!row) {
      db.prepare('INSERT INTO parametres_paie (id) VALUES (1)').run();
      row = db.prepare('SELECT * FROM parametres_paie WHERE id = 1 LIMIT 1').get();
    }
    return normalizeParams(row);
  } catch (err) {
    error('getParams:', err.message);
    return { ...DEFAULT_PARAMS };
  }
}

// ════════════════════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════════════════════

function validateParams(next) {
  if (next.heures_normales_mois <= 0) throw new Error('heures_normales_mois doit être > 0');
  if (next.jours_ouvrables_mois <= 0) throw new Error('jours_ouvrables_mois doit être > 0');
  if (next.taux_heure_sup < 1) throw new Error('taux_heure_sup doit être >= 1');

  if (next.cnaps_taux < 0 || next.cnaps_taux > 100) {
    throw new Error('cnaps_taux doit être entre 0 et 100');
  }
  if (next.ostie_taux < 0 || next.ostie_taux > 100) {
    throw new Error('ostie_taux doit être entre 0 et 100');
  }
  if (next.cnaps_plafond < 0) throw new Error('cnaps_plafond doit être >= 0');
  if (next.ostie_plafond < 0) throw new Error('ostie_plafond doit être >= 0');
  if (next.irsa_exoneration < 0) throw new Error('irsa_exoneration doit être >= 0');

  if (!Array.isArray(next.irsa_bareme)) {
    throw new Error('irsa_bareme doit être un tableau');
  }

  // ⭐ Normaliser le mode
  next.mode_paie = normalizeMode(next.mode_paie);
}

// ════════════════════════════════════════════════════════════
// HANDLERS
// ════════════════════════════════════════════════════════════

function registerParametresPaieHandlers(ipcMain) {
  log('⚙️ Enregistrement des handlers Paramètres Paie...');

  const channels = [
    'parametres-paie:get',
    'parametres-paie:update',
    'parametres-paie:reset',
    'parametres-paie:set-mode',  // ⭐ NOUVEAU: fanovana mode haingana
  ];
  for (const ch of channels) {
    try { ipcMain.removeHandler(ch); } catch (_) {}
  }

  // ─── GET ───
  ipcMain.handle('parametres-paie:get', () => {
    try {
      return { success: true, data: getParams() };
    } catch (err) {
      error('get:', err.message);
      return { success: false, error: err.message, data: { ...DEFAULT_PARAMS } };
    }
  });

  // ─── UPDATE ───
  ipcMain.handle('parametres-paie:update', (event, data = {}) => {
    try {
      const db = getDbSafe();
      const current = getParams();
      const next = { ...current, ...data };

      validateParams(next);

      // Trier le barème par min croissant
      next.irsa_bareme = [...next.irsa_bareme].sort(
        (a, b) => Number(a.min || 0) - Number(b.min || 0)
      );

      const userId = event?.sender?.user?.id ?? null;

      db.prepare(`
        UPDATE parametres_paie SET
          mode_paie = ?,
          heures_normales_mois = ?,
          jours_ouvrables_mois = ?,
          taux_heure_sup = ?,
          cnaps_actif = ?, cnaps_taux = ?, cnaps_base = ?, cnaps_plafond = ?,
          ostie_actif = ?, ostie_taux = ?, ostie_base = ?, ostie_plafond = ?,
          irsa_actif = ?, irsa_bareme = ?, irsa_base = ?, irsa_exoneration = ?,
          absences_actif = ?, absences_mode = ?,
          avance_actif = ?,
          updated_at = CURRENT_TIMESTAMP, updated_by = ?
        WHERE id = 1
      `).run(
        next.mode_paie,
        Number(next.heures_normales_mois),
        Number(next.jours_ouvrables_mois),
        Number(next.taux_heure_sup),
        next.cnaps_actif ? 1 : 0, Number(next.cnaps_taux), String(next.cnaps_base || 'brut'), Number(next.cnaps_plafond || 0),
        next.ostie_actif ? 1 : 0, Number(next.ostie_taux), String(next.ostie_base || 'brut'), Number(next.ostie_plafond || 0),
        next.irsa_actif ? 1 : 0, JSON.stringify(next.irsa_bareme), String(next.irsa_base || 'net_imposable'), Number(next.irsa_exoneration || 0),
        next.absences_actif ? 1 : 0, String(next.absences_mode || 'jour'),
        next.avance_actif ? 1 : 0,
        userId
      );

      log(`✅ Paramètres mis à jour (mode: ${next.mode_paie})`);
      return { success: true, data: getParams() };
    } catch (err) {
      error('update:', err.message);
      return { success: false, error: err.message };
    }
  });

  // ─── RESET ───
  ipcMain.handle('parametres-paie:reset', () => {
    try {
      const db = getDbSafe();

      // S'assurer que la ligne existe
      const exists = db.prepare('SELECT id FROM parametres_paie WHERE id = 1').get();
      if (!exists) db.prepare('INSERT INTO parametres_paie (id) VALUES (1)').run();

      db.prepare(`
        UPDATE parametres_paie SET
          mode_paie = ?,
          heures_normales_mois = ?, jours_ouvrables_mois = ?, taux_heure_sup = ?,
          cnaps_actif = ?, cnaps_taux = ?, cnaps_base = ?, cnaps_plafond = ?,
          ostie_actif = ?, ostie_taux = ?, ostie_base = ?, ostie_plafond = ?,
          irsa_actif = ?, irsa_bareme = ?, irsa_base = ?, irsa_exoneration = ?,
          absences_actif = ?, absences_mode = ?, avance_actif = ?,
          updated_at = CURRENT_TIMESTAMP, updated_by = NULL
        WHERE id = 1
      `).run(
        DEFAULT_PARAMS.mode_paie,
        DEFAULT_PARAMS.heures_normales_mois,
        DEFAULT_PARAMS.jours_ouvrables_mois,
        DEFAULT_PARAMS.taux_heure_sup,
        DEFAULT_PARAMS.cnaps_actif, DEFAULT_PARAMS.cnaps_taux, DEFAULT_PARAMS.cnaps_base, DEFAULT_PARAMS.cnaps_plafond,
        DEFAULT_PARAMS.ostie_actif, DEFAULT_PARAMS.ostie_taux, DEFAULT_PARAMS.ostie_base, DEFAULT_PARAMS.ostie_plafond,
        DEFAULT_PARAMS.irsa_actif, JSON.stringify(DEFAULT_PARAMS.irsa_bareme), DEFAULT_PARAMS.irsa_base, DEFAULT_PARAMS.irsa_exoneration,
        DEFAULT_PARAMS.absences_actif, DEFAULT_PARAMS.absences_mode,
        DEFAULT_PARAMS.avance_actif
      );

      log('✅ Paramètres réinitialisés');
      return { success: true, data: getParams() };
    } catch (err) {
      error('reset:', err.message);
      return { success: false, error: err.message };
    }
  });

  // ⭐ NOUVEAU: SET MODE (fanovana haingana 'complet' | 'simplifie')
  ipcMain.handle('parametres-paie:set-mode', (event, mode) => {
    try {
      const db = getDbSafe();
      const normalizedMode = normalizeMode(mode);

      const exists = db.prepare('SELECT id FROM parametres_paie WHERE id = 1').get();
      if (!exists) db.prepare('INSERT INTO parametres_paie (id) VALUES (1)').run();

      const userId = event?.sender?.user?.id ?? null;
      db.prepare(`
        UPDATE parametres_paie
        SET mode_paie = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
        WHERE id = 1
      `).run(normalizedMode, userId);

      log(`✅ Mode de paie : ${normalizedMode}`);
      return { success: true, data: getParams() };
    } catch (err) {
      error('set-mode:', err.message);
      return { success: false, error: err.message };
    }
  });

  log('✅ Handlers Paramètres Paie enregistrés');
  return true;
}

module.exports = {
  registerParametresPaieHandlers,
  getParams,
  normalizeParams,
  DEFAULT_PARAMS,
};