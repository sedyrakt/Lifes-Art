'use strict';

const { getDb } = require('../../database/connection.cjs');
const { BrowserWindow } = require('electron');
const { log, error } = require('./logger.cjs');
const { logAudit } = require('./audit.cjs');
const { VALID_STATUSES, STATUS_LABELS, normalizeStatus, validateEmploye } = require('./validation.cjs');
const { buildEmployesQuery, buildEmployesCountQuery } = require('./queries.cjs');
const { prepareStatements, getStatements } = require('./statements.cjs');

function emitEmployesChanged(data) {
  const windows = BrowserWindow.getAllWindows();
  if (!windows.length) return;
  windows.forEach(win => {
    if (!win.isDestroyed()) {
      try { win.webContents.send('employes:changed', data); } catch (err) { error('❌ emitEmployesChanged:', err.message); }
    }
  });
}

function registerEmployesHandlers(ipcMain) {
  log('👷 [employes.handlers] ENREGISTREMENT');
  if (!ipcMain) { error('❌ ipcMain null'); return false; }

  const channels = [
    'employes:get-all', 'employes:get-by-id', 'employes:create', 'employes:update',
    'employes:delete', 'employes:get-by-departement', 'employes:get-by-status',
    'employes:get-stats', 'employes:search', 'employes:bulk-delete',
    'employes:update-status', 'employes:bulk-update-status',
    'employes:get-paiement-counts-batch', 'employes:get-total-salaires-payes',
    'employes:get-presence', 'employes:update-presence',
    'employes:get-salary-history', 'employes:update-salary',
    'employes:get-presence-journaliere', 'employes:update-presence-journaliere', 'employes:delete-presence-journaliere',
    'employes:get-presence-journaliere-mois', 'employes:bulk-update-presence-journaliere',
    'employes:get-presence-historique',
    // ⭐ VAOVAO: PLANNING
    'employes:get-planning', 'employes:update-planning', 'employes:delete-planning'
  ];
  for (const ch of channels) { try { ipcMain.removeHandler(ch); } catch (_) {} }

  const prepared = prepareStatements();
  if (!prepared) { error('❌ [employes.handlers] prepareStatements() a échoué'); return false; }
  const statements = getStatements();

  // ✅ GET ALL EMPLOYES
  ipcMain.handle('employes:get-all', async (event, options = {}) => {
    try {
      const db = getDb();
      if (!db) return { success: false, error: 'DB non disponible' };
      const { query, params } = buildEmployesQuery(options);
      const data = db.prepare(query).all(params);
      let total = 0;
      const { query: countQuery, params: countParams } = buildEmployesCountQuery(options);
      const countResult = db.prepare(countQuery).get(countParams);
      total = Number(countResult?.total || 0);
      return { success: true, data, total };
    } catch (err) { error('❌ [employes:get-all]', err.message); return { success: false, error: err.message }; }
  });

  // ✅ GET BY ID
  ipcMain.handle('employes:get-by-id', async (event, id) => {
    try {
      const data = statements.stmtGetById.get(Number(id));
      if (!data) return { success: false, error: 'Employé non trouvé' };
      data.status_label = STATUS_LABELS[data.status] || data.status;
      return { success: true, data };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ CREATE
  ipcMain.handle('employes:create', async (event, data, userId = null) => {
    try {
      const validation = validateEmploye(data);
      if (!validation.valid) return { success: false, error: validation.errors.join(', ') };
      const { nom, prenom, email, telephone, poste, departement, date_embauche, salaire, status } = validation.data;
      const existing = statements.stmtCheckEmail.get(email);
      if (existing) return { success: false, error: 'Cet email est déjà utilisé' };
      const result = statements.stmtCreate.run(nom, prenom, email, telephone, poste, departement, date_embauche, salaire, status);
      const id = Number(result.lastInsertRowid);
      const auditUser = userId || event.sender?.user?.id || null;
      if (auditUser) logAudit('create', id, `${prenom} ${nom}`, auditUser, `Poste: ${poste}`);
      emitEmployesChanged({ type: 'create', id });
      const newEmploye = statements.stmtGetById.get(id);
      return { success: true, data: newEmploye };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ UPDATE
  ipcMain.handle('employes:update', async (event, id, data, userId = null) => {
    try {
      const validation = validateEmploye(data);
      if (!validation.valid) return { success: false, error: validation.errors.join(', ') };
      const { nom, prenom, email, telephone, poste, departement, date_embauche, salaire, status } = validation.data;
      const existing = statements.stmtCheckEmailExcept.get(email, id);
      if (existing) return { success: false, error: 'Cet email est déjà utilisé' };
      statements.stmtUpdate.run(nom, prenom, email, telephone, poste, departement, date_embauche, salaire, status, id);
      const auditUser = userId || event.sender?.user?.id || null;
      if (auditUser) logAudit('update', id, `${prenom} ${nom}`, auditUser, 'Mise à jour');
      emitEmployesChanged({ type: 'update', id });
      const updated = statements.stmtGetById.get(id);
      return { success: true, data: updated };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ DELETE (soft)
  ipcMain.handle('employes:delete', async (event, id, userId = null) => {
    try {
      const existing = statements.stmtGetById.get(Number(id));
      if (!existing) return { success: false, error: 'Employé non trouvé' };
      const count = statements.stmtPaymentCount.get(id);
      statements.stmtSoftDelete.run('licencie', id);
      const auditUser = userId || event.sender?.user?.id || null;
      if (auditUser) logAudit('delete', id, `${existing.prenom} ${existing.nom}`, auditUser, count?.total > 0 ? `${count.total} paiements associés` : 'Soft delete');
      emitEmployesChanged({ type: 'delete', id });
      return { success: true, data: { id, status: 'licencie', message: count?.total > 0 ? `${count.total} paiements associés` : 'Marqué licencié' } };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ BULK DELETE
  ipcMain.handle('employes:bulk-delete', async (event, ids, userId = null) => {
    try {
      const db = getDb();
      const safeIds = ids.slice(0, 50);
      const transaction = db.transaction(() => {
        const stmt = db.prepare('UPDATE employes SET status = ? WHERE id = ?');
        for (const id of safeIds) {
          const existing = statements.stmtGetById.get(id);
          if (existing) {
            stmt.run('licencie', id);
            const auditUser = userId || event.sender?.user?.id || null;
            if (auditUser) logAudit('bulk_delete', id, `${existing.prenom} ${existing.nom}`, auditUser, 'Suppression groupée');
          }
        }
      });
      transaction();
      emitEmployesChanged({ type: 'bulk_delete', ids: safeIds });
      return { success: true, deleted: safeIds.length };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ GET BY DEPARTEMENT
  ipcMain.handle('employes:get-by-departement', async (event, departement) => {
    try {
      const data = statements.stmtGetByDepartement.all(departement, 'actif');
      return { success: true, data };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ GET BY STATUS
  ipcMain.handle('employes:get-by-status', async (event, status) => {
    try {
      const normalized = normalizeStatus(status);
      if (!VALID_STATUSES.includes(normalized)) return { success: false, error: 'Status invalide' };
      const data = statements.stmtGetByStatus.all(normalized);
      return { success: true, data };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ GET STATS
  ipcMain.handle('employes:get-stats', async () => {
    try {
      if (!statements.stmtStats) return { success: false, error: 'Statements non initialisés' };
      const stats = statements.stmtStats.get();
      return { success: true, data: { total: Number(stats?.total || 0), actifs: Number(stats?.actifs || 0), en_conge: Number(stats?.en_conge || 0), inactifs: Number(stats?.inactifs || 0), licencies: Number(stats?.licencies || 0), total_salaires: Number(stats?.total_salaires || 0), salaire_moyen: Number(stats?.salaire_moyen || 0), departements: Number(stats?.departements || 0) } };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ SEARCH
  ipcMain.handle('employes:search', async (event, searchTerm) => {
    try {
      const s = `%${String(searchTerm).trim()}%`;
      const data = statements.stmtSearch.all(s, s, s);
      return { success: true, data };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ UPDATE STATUS
  ipcMain.handle('employes:update-status', async (event, id, status, userId = null) => {
    try {
      const normalized = normalizeStatus(status);
      if (!VALID_STATUSES.includes(normalized)) return { success: false, error: 'Status invalide' };
      const existing = statements.stmtGetById.get(id);
      if (!existing) return { success: false, error: 'Employé non trouvé' };
      statements.stmtUpdateStatus.run(normalized, id);
      const auditUser = userId || event.sender?.user?.id || null;
      if (auditUser) logAudit('status_change', id, `${existing.prenom} ${existing.nom}`, auditUser, `Nouveau statut: ${normalized}`);
      emitEmployesChanged({ type: 'update_status', id, status: normalized });
      return { success: true, data: { id, status: normalized } };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ BULK UPDATE STATUS
  ipcMain.handle('employes:bulk-update-status', async (event, ids, newStatus, userId = null) => {
    try {
      const db = getDb();
      const safeIds = ids.slice(0, 50);
      const normalized = normalizeStatus(newStatus);
      if (!VALID_STATUSES.includes(normalized)) return { success: false, error: 'Status invalide' };
      const placeholders = safeIds.map(() => '?').join(',');
      const stmt = db.prepare(`UPDATE employes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`);
      const result = stmt.run(normalized, ...safeIds);
      const auditUser = userId || event.sender?.user?.id || null;
      safeIds.forEach(id => {
        const emp = statements.stmtGetById.get(id);
        if (emp && auditUser) logAudit('bulk_update_status', id, `${emp.prenom} ${emp.nom}`, auditUser, `Nouveau statut: ${normalized}`);
      });
      emitEmployesChanged({ type: 'bulk_update_status', ids: safeIds, status: normalized });
      return { success: true, changes: result.changes };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ GET PAIEMENT COUNTS BATCH
  ipcMain.handle('employes:get-paiement-counts-batch', async (event, ids) => {
    try {
      const safeIds = ids.slice(0, 50);
      if (!safeIds.length) return { success: true, data: [] };
      const placeholders = safeIds.map(() => '?').join(',');
      const stmt = getDb().prepare(`SELECT employe_id, COUNT(*) AS count FROM paiements_employes WHERE employe_id IN (${placeholders}) GROUP BY employe_id`);
      const rows = stmt.all(...safeIds);
      return { success: true, data: rows };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ GET TOTAL SALAIRES PAYES
  ipcMain.handle('employes:get-total-salaires-payes', async (event, annee) => {
    try {
      const db = getDb();
      if (!db) return { success: false, error: 'DB non disponible' };
      let query = `SELECT COALESCE(SUM(montant), 0) as total FROM paiements_employes`;
      const params = [];
      if (annee) {
        query += ` WHERE strftime('%Y', date_paiement) = ?`;
        params.push(String(annee));
      }
      const stmt = db.prepare(query);
      const result = stmt.get(...params);
      return { success: true, data: result?.total || 0 };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ✅ GET PRESENCE (agrégée mensuelle)
  ipcMain.handle('employes:get-presence', async (_event, employeId, mois, annee) => {
    try {
      const db = getDb();
      const stmt = db.prepare('SELECT * FROM presence_employes WHERE employe_id = ? AND mois = ? AND annee = ?');
      const presence = stmt.get(employeId, mois, annee);
      return { success: true, data: presence || { jours_absences: 0, jours_conges: 0, jours_maladie: 0, justificatif_maladie: '', observation: '' } };
    } catch (err) { error('❌ [employes:get-presence]', err.message); return { success: false, error: err.message }; }
  });

  // ✅ UPDATE PRESENCE (agrégée mensuelle)
  ipcMain.handle('employes:update-presence', async (_event, data) => {
    try {
      const db = getDb();
      const { employe_id, mois, annee, jours_absences, jours_conges, jours_maladie, justificatif_maladie, observation } = data;
      const stmt = db.prepare(`
        INSERT INTO presence_employes (employe_id, mois, annee, jours_absences, jours_conges, jours_maladie, justificatif_maladie, observation, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(employe_id, mois, annee) DO UPDATE SET
          jours_absences = excluded.jours_absences,
          jours_conges = excluded.jours_conges,
          jours_maladie = excluded.jours_maladie,
          justificatif_maladie = excluded.justificatif_maladie,
          observation = excluded.observation,
          updated_at = CURRENT_TIMESTAMP
      `);
      stmt.run(employe_id, mois, annee, jours_absences || 0, jours_conges || 0, jours_maladie || 0, justificatif_maladie || '', observation || '');
      return { success: true };
    } catch (err) { error('❌ [employes:update-presence]', err.message); return { success: false, error: err.message }; }
  });

  // ✅ GET SALARY HISTORY
  ipcMain.handle('employes:get-salary-history', async (_event, employeId) => {
    try {
      const db = getDb();
      const stmt = db.prepare('SELECT * FROM historique_salaires WHERE employe_id = ? ORDER BY date_changement DESC');
      const history = stmt.all(employeId);
      return { success: true, data: history };
    } catch (err) { error('❌ [employes:get-salary-history]', err.message); return { success: false, error: err.message }; }
  });

  // ✅ UPDATE SALARY
  ipcMain.handle('employes:update-salary', async (_event, employeId, newSalary, raison) => {
    try {
      const db = getDb();
      const current = db.prepare('SELECT salaire FROM employes WHERE id = ?').get(employeId);
      if (!current) return { success: false, error: 'Employé non trouvé' };
      const oldSalary = Number(current.salaire || 0);
      const newSal = Number(newSalary || 0);
      db.prepare('UPDATE employes SET salaire = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newSal, employeId);
      db.prepare('INSERT INTO historique_salaires (employe_id, ancien_salaire, nouveau_salaire, raison) VALUES (?, ?, ?, ?)')
        .run(employeId, oldSalary, newSal, raison || 'Fisondrotana karama');
      return { success: true };
    } catch (err) {
      error('❌ [employes:update-salary]', err.message);
      return { success: false, error: err.message };
    }
  });

  // ============================================================
  // ⭐ PRESENCE JOURNALIERE HANDLERS (RH & PAIE)
  // ============================================================

  ipcMain.handle('employes:get-presence-journaliere', async (_event, employeId, mois, annee) => {
    try {
      const moisStr = `${annee}-${String(mois).padStart(2, '0')}`;
      const data = statements.stmtGetPresenceJournaliereByEmployeMois.all(employeId, moisStr);
      return { success: true, data };
    } catch (err) {
      error('❌ [employes:get-presence-journaliere]', err.message);
      return { success: false, error: err.message };
    }
  });

  // ✅ UPDATE PRESENCE JOURNALIERE (avec calculs persistants)
  ipcMain.handle('employes:update-presence-journaliere', async (_event, data) => {
    try {
      const { employe_id, date, statut, heure_arrivee, heure_depart, heure_debut_planifiee, heure_fin_planifiee, retard, heures_travaillees, heures_sup, observation } = data;
      statements.stmtUpsertPresenceJournaliere.run(
        employe_id, date, statut, heure_arrivee || '', heure_depart || '',
        heure_debut_planifiee || '08:00', heure_fin_planifiee || '17:00',
        retard || 0, heures_travaillees || 0, heures_sup || 0, observation || ''
      );
      emitEmployesChanged({ type: 'presence_journaliere', employe_id, date, statut });
      return { success: true };
    } catch (err) {
      error('❌ [employes:update-presence-journaliere]', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('employes:delete-presence-journaliere', async (_event, id) => {
    try {
      statements.stmtDeletePresenceJournaliere.run(id);
      return { success: true };
    } catch (err) {
      error('❌ [employes:delete-presence-journaliere]', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('employes:get-presence-journaliere-mois', async (_event, mois, annee) => {
    try {
      const moisStr = `${annee}-${String(mois).padStart(2, '0')}`;
      const data = statements.stmtGetPresenceJournaliereByMois.all(moisStr);
      return { success: true, data };
    } catch (err) {
      error('❌ [employes:get-presence-journaliere-mois]', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('employes:bulk-update-presence-journaliere', async (_event, payload) => {
    try {
      const { employe_ids, date, statut } = payload;
      if (!Array.isArray(employe_ids) || !date || !statut) return { success: false, error: 'Payload invalide' };
      const db = getDb();
      const transaction = db.transaction(() => {
        for (const id of employe_ids) {
          statements.stmtBulkUpsertPresenceJournaliere.run(id, date, statut);
        }
      });
      transaction();
      emitEmployesChanged({ type: 'bulk_presence_journaliere', date, statut, count: employe_ids.length });
      return { success: true, count: employe_ids.length };
    } catch (err) {
      error('❌ [employes:bulk-update-presence-journaliere]', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('employes:get-presence-historique', async (_event, options = {}) => {
    try {
      const db = getDb();
      let query = `
        SELECT pj.date, pj.statut, pj.heure_arrivee, pj.heure_depart, pj.heure_debut_planifiee, pj.heure_fin_planifiee,
               pj.retard, pj.heures_travaillees, pj.heures_sup, pj.observation,
               e.id as employe_id, e.nom, e.prenom, e.poste
        FROM presence_journaliere pj
        JOIN employes e ON pj.employe_id = e.id
        WHERE 1=1
      `;
      const params = [];
      if (options.employe_id) { query += ' AND pj.employe_id = ?'; params.push(Number(options.employe_id)); }
      if (options.type === 'jour' && options.date) { query += ' AND pj.date = ?'; params.push(options.date); }
      else if (options.type === 'mois' && options.mois && options.annee) {
        const startDate = `${options.annee}-${String(options.mois).padStart(2, '0')}-01`;
        const endDate = `${options.annee}-${String(options.mois).padStart(2, '0')}-31`;
        query += ' AND pj.date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      } else if (options.type === 'annee' && options.annee) {
        query += ' AND pj.date LIKE ?';
        params.push(`${options.annee}-%`);
      }
      if (options.statut && options.statut !== 'Tous') { query += ' AND pj.statut = ?'; params.push(options.statut); }
      query += ' ORDER BY pj.date DESC, e.nom ASC';
      const data = db.prepare(query).all(...params);
      return { success: true, data };
    } catch (err) {
      error('❌ [employes:get-presence-historique]', err.message);
      return { success: false, error: err.message };
    }
  });

  // ============================================================
  // ⭐ NOVAINA: PLANNING (Workflow Hebdomadaire)
  // ============================================================
  ipcMain.handle('employes:get-planning', async (_event, employeId) => {
    try {
      const data = statements.stmtGetPlanningByEmploye.all(employeId);
      return { success: true, data };
    } catch (err) {
      error('❌ [employes:get-planning]', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('employes:update-planning', async (_event, employeId, planningData) => {
    try {
      if (!Array.isArray(planningData)) return { success: false, error: 'Données planning invalides' };
      const db = getDb();
      const transaction = db.transaction(() => {
        for (const item of planningData) {
          statements.stmtUpsertPlanning.run(
            employeId,
            Number(item.jour_semaine),
            item.heure_debut || '08:00',
            item.heure_fin || '17:00',
            Number(item.pause || 1)
          );
        }
      });
      transaction();
      emitEmployesChanged({ type: 'planning_updated', employe_id: employeId });
      return { success: true };
    } catch (err) {
      error('❌ [employes:update-planning]', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('employes:delete-planning', async (_event, id) => {
    try {
      statements.stmtDeletePlanning.run(id);
      return { success: true };
    } catch (err) {
      error('❌ [employes:delete-planning]', err.message);
      return { success: false, error: err.message };
    }
  });

  log('✅ [employes.handlers] Enregistrés');
  return true;
}

module.exports = { registerEmployesHandlers, emitEmployesChanged };