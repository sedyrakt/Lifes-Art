'use strict';
const { getDb } = require('./connection.cjs');
const log = (...args) => console.log('[tables]', ...args);
const error = (...args) => console.error('[tables]', ...args);
const warn = (...args) => console.warn('[tables]', ...args);

function tableExists(db, tableName) {
  try {
    const stmt = db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`);
    return !!stmt.get(tableName);
  } catch (err) { warn(`[tables] Vérifier ${tableName}:`, err.message); return false; }
}

function columnExists(db, table, column) {
  try {
    if (!tableExists(db, table)) return false;
    const stmt = db.prepare(`PRAGMA table_info("${table}")`);
    return stmt.all().some(c => c.name === column);
  } catch (err) { warn(`[tables] Vérifier ${table}.${column}:`, err.message); return false; }
}

function addColumnIfMissing(db, table, column, definition) {
  if (!tableExists(db, table) || columnExists(db, table, column)) return false;
  try {
    db.exec(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
    log(`✅ [migration] ${table}.${column} ajoutée`);
    return true;
  } catch (err) { error(`❌ [migration] ${table}.${column}:`, err.message); return false; }
}

function createIndex(db, sql, name) {
  try { db.exec(sql); return true; }
  catch (err) { warn(`⚠️ [index] ${name}:`, err.message); return false; }
}

function ensureTables() {
  const db = getDb();
  if (!db || !db.open) { error('[tables] DB indisponible'); return false; }
  try {
    log('🔄 Création/vérification du schéma database...');
    db.exec(`CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL UNIQUE, description TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
    db.exec(`CREATE TABLE IF NOT EXISTS fournisseurs (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, contact TEXT, telephone TEXT, email TEXT, adresse TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
    db.exec(`CREATE TABLE IF NOT EXISTS produits (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, nom TEXT NOT NULL, description TEXT, categorie_id INTEGER, fournisseur_id INTEGER, prix_achat REAL DEFAULT 0, prix_vente REAL DEFAULT 0, quantite_stock INTEGER DEFAULT 0, quantite_minimale INTEGER DEFAULT 5, unite TEXT DEFAULT 'pièce', tva_rate REAL DEFAULT 0.2, status TEXT DEFAULT 'actif', statut_stock TEXT DEFAULT 'disponible', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL, FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL);`);
    db.exec(`CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, email TEXT UNIQUE, telephone TEXT, adresse TEXT, ville TEXT, code_postal TEXT, pays TEXT, type TEXT DEFAULT 'Particulier', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
    db.exec(`CREATE TABLE IF NOT EXISTS commandes (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, client_nom TEXT NOT NULL, total_ht REAL DEFAULT 0, total_ttc REAL DEFAULT 0, total REAL DEFAULT 0, statut_paiement TEXT DEFAULT 'Non payé', montant_paye REAL DEFAULT 0, montant_restant REAL DEFAULT 0, date_limite_paiement TEXT, stock_restaure INTEGER NOT NULL DEFAULT 0, date_commande TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL);`);
    db.exec(`CREATE TABLE IF NOT EXISTS details_commandes (id INTEGER PRIMARY KEY AUTOINCREMENT, commande_id INTEGER NOT NULL, produit_id INTEGER NOT NULL, quantite INTEGER NOT NULL, prix_unitaire REAL NOT NULL, total REAL NOT NULL, tva_rate REAL DEFAULT 0.2, FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE, FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE);`);
    db.exec(`CREATE TABLE IF NOT EXISTS utilisateurs (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, firstName TEXT, lastName TEXT, role TEXT DEFAULT 'user', companyName TEXT, phone TEXT, status TEXT DEFAULT 'actif', twoFactorEnabled INTEGER DEFAULT 0, twoFactorSecret TEXT, lastLogin TEXT, loginAttempts INTEGER DEFAULT 0, lockedUntil TEXT, image TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
    db.exec(`CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL UNIQUE, userId INTEGER NOT NULL, expiresAt TEXT NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (userId) REFERENCES utilisateurs(id) ON DELETE CASCADE);`);
    db.exec(`CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT, entity TEXT, entity_id INTEGER, entity_name TEXT, user_id INTEGER, details TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
    db.exec(`CREATE TABLE IF NOT EXISTS security_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, action TEXT, ip TEXT, userAgent TEXT, status INTEGER, details TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
    db.exec(`CREATE TABLE IF NOT EXISTS entrees_stock (id INTEGER PRIMARY KEY AUTOINCREMENT, produit_id INTEGER NOT NULL, quantite INTEGER NOT NULL, prix_unitaire REAL DEFAULT 0, reference TEXT, fournisseur_id INTEGER, observation TEXT, date_entree TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE, FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL);`);
    db.exec(`CREATE TABLE IF NOT EXISTS sorties_stock (id INTEGER PRIMARY KEY AUTOINCREMENT, produit_id INTEGER NOT NULL, quantite INTEGER NOT NULL, prix_unitaire REAL DEFAULT 0, reference TEXT, destination TEXT, observation TEXT, date_sortie TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE);`);
    db.exec(`CREATE TABLE IF NOT EXISTS mouvements_stock (id INTEGER PRIMARY KEY AUTOINCREMENT, produit_id INTEGER NOT NULL, type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('ENTREE', 'SORTIE')), quantite INTEGER NOT NULL, ancien_stock INTEGER NOT NULL, nouveau_stock INTEGER NOT NULL, reference TEXT, observation TEXT, prix_unitaire REAL DEFAULT 0, created_by INTEGER, date_mouvement TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE, FOREIGN KEY (created_by) REFERENCES utilisateurs(id) ON DELETE SET NULL);`);
    db.exec(`CREATE TABLE IF NOT EXISTS employes (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, prenom TEXT NOT NULL, email TEXT UNIQUE NOT NULL, telephone TEXT, poste TEXT NOT NULL, departement TEXT, date_embauche TEXT, salaire REAL DEFAULT 0, status TEXT DEFAULT 'actif', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
    db.exec(`CREATE TABLE IF NOT EXISTS paiements_employes (id INTEGER PRIMARY KEY AUTOINCREMENT, employe_id INTEGER NOT NULL, mois INTEGER NOT NULL, annee INTEGER NOT NULL, montant REAL NOT NULL DEFAULT 0, mode_paiement TEXT DEFAULT 'Espèces', statut TEXT DEFAULT 'Payé', reference TEXT, observation TEXT, salaire_brut REAL DEFAULT 0, cnaps REAL DEFAULT 0, ostie REAL DEFAULT 0, irsa REAL DEFAULT 0, avance REAL DEFAULT 0, date_paiement TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE);`);
    db.exec(`CREATE TABLE IF NOT EXISTS depenses (id INTEGER PRIMARY KEY AUTOINCREMENT, fournisseur_id INTEGER, description TEXT NOT NULL, montant REAL NOT NULL DEFAULT 0, categorie TEXT, date_depense TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL);`);
    db.exec(`CREATE TABLE IF NOT EXISTS achats (id INTEGER PRIMARY KEY AUTOINCREMENT, fournisseur_id INTEGER NOT NULL, reference TEXT, date_achat TEXT DEFAULT CURRENT_TIMESTAMP, total_ht REAL DEFAULT 0, total_ttc REAL DEFAULT 0, designation TEXT, nombre_produits INTEGER DEFAULT 0, statut_paiement TEXT DEFAULT 'Non payé', montant_paye REAL DEFAULT 0, montant_restant REAL DEFAULT 0, observation TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL);`);
    db.exec(`CREATE TABLE IF NOT EXISTS details_achats (id INTEGER PRIMARY KEY AUTOINCREMENT, achat_id INTEGER NOT NULL, produit_id INTEGER, quantite INTEGER NOT NULL, prix_unitaire REAL NOT NULL, total REAL NOT NULL, tva_rate REAL DEFAULT 0.2, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (achat_id) REFERENCES achats(id) ON DELETE CASCADE, FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE);`);
    db.exec(`CREATE TABLE IF NOT EXISTS devis (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, client_nom TEXT NOT NULL, reference TEXT, total_ht REAL DEFAULT 0, total_ttc REAL DEFAULT 0, validite_jours INTEGER DEFAULT 30, statut_paiement TEXT DEFAULT 'Non payé', montant_paye REAL DEFAULT 0, montant_restant REAL DEFAULT 0, observation TEXT, date_devis TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL);`);
    db.exec(`CREATE TABLE IF NOT EXISTS details_devis (id INTEGER PRIMARY KEY AUTOINCREMENT, devis_id INTEGER NOT NULL, produit_id INTEGER, quantite INTEGER NOT NULL, prix_unitaire REAL NOT NULL, total REAL NOT NULL, tva_rate REAL DEFAULT 0.2, FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE CASCADE, FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE);`);
    db.exec(`CREATE TABLE IF NOT EXISTS factures (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, client_nom TEXT NOT NULL, reference TEXT, total_ht REAL DEFAULT 0, total_ttc REAL DEFAULT 0, statut_paiement TEXT DEFAULT 'Non payé', montant_paye REAL DEFAULT 0, montant_restant REAL DEFAULT 0, observation TEXT, date_facture TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL);`);
    db.exec(`CREATE TABLE IF NOT EXISTS details_factures (id INTEGER PRIMARY KEY AUTOINCREMENT, facture_id INTEGER NOT NULL, produit_id INTEGER, quantite INTEGER NOT NULL, prix_unitaire REAL NOT NULL, total REAL NOT NULL, tva_rate REAL DEFAULT 0.2, FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE, FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE);`);
    db.exec(`CREATE TABLE IF NOT EXISTS presence_employes (id INTEGER PRIMARY KEY AUTOINCREMENT, employe_id INTEGER NOT NULL, mois INTEGER NOT NULL, annee INTEGER NOT NULL, jours_absences INTEGER DEFAULT 0, jours_conges INTEGER DEFAULT 0, jours_maladie INTEGER DEFAULT 0, justificatif_maladie TEXT, observation TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(employe_id, mois, annee), FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE);`);
    db.exec(`CREATE TABLE IF NOT EXISTS historique_salaires (id INTEGER PRIMARY KEY AUTOINCREMENT, employe_id INTEGER NOT NULL, ancien_salaire REAL DEFAULT 0, nouveau_salaire REAL DEFAULT 0, date_changement TEXT DEFAULT CURRENT_TIMESTAMP, raison TEXT, FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE);`);
    db.exec(`CREATE TABLE IF NOT EXISTS presence_journaliere (id INTEGER PRIMARY KEY AUTOINCREMENT, employe_id INTEGER NOT NULL, date TEXT NOT NULL, statut TEXT NOT NULL DEFAULT 'present', heure_arrivee TEXT, heure_depart TEXT, observation TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(employe_id, date), FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE);`);

    log('🔧 Vérification des migrations...');
    addColumnIfMissing(db, 'fournisseurs', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
    if (tableExists(db, 'utilisateurs')) {
      addColumnIfMissing(db, 'utilisateurs', 'companyName', 'TEXT');
      addColumnIfMissing(db, 'utilisateurs', 'phone', 'TEXT');
      addColumnIfMissing(db, 'utilisateurs', 'status', "TEXT DEFAULT 'actif'");
      addColumnIfMissing(db, 'utilisateurs', 'twoFactorEnabled', 'INTEGER DEFAULT 0');
      addColumnIfMissing(db, 'utilisateurs', 'twoFactorSecret', 'TEXT');
      addColumnIfMissing(db, 'utilisateurs', 'lastLogin', 'TEXT');
      addColumnIfMissing(db, 'utilisateurs', 'loginAttempts', 'INTEGER DEFAULT 0');
      addColumnIfMissing(db, 'utilisateurs', 'lockedUntil', 'TEXT');
      addColumnIfMissing(db, 'utilisateurs', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
      addColumnIfMissing(db, 'utilisateurs', 'image', 'TEXT');
    }
    if (tableExists(db, 'produits')) {
      addColumnIfMissing(db, 'produits', 'unite', "TEXT DEFAULT 'pièce'");
      addColumnIfMissing(db, 'produits', 'tva_rate', 'REAL DEFAULT 0.2');
      addColumnIfMissing(db, 'produits', 'status', "TEXT DEFAULT 'actif'");
      addColumnIfMissing(db, 'produits', 'statut_stock', "TEXT DEFAULT 'disponible'");
      addColumnIfMissing(db, 'produits', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
    }
    if (tableExists(db, 'clients')) {
      addColumnIfMissing(db, 'clients', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
      addColumnIfMissing(db, 'clients', 'ville', 'TEXT');
      addColumnIfMissing(db, 'clients', 'code_postal', 'TEXT');
      addColumnIfMissing(db, 'clients', 'pays', 'TEXT');
      addColumnIfMissing(db, 'clients', 'type', "TEXT DEFAULT 'Particulier'");
    }
    if (tableExists(db, 'commandes')) {
      addColumnIfMissing(db, 'commandes', 'client_id', 'INTEGER');
      addColumnIfMissing(db, 'commandes', 'client_nom', 'TEXT');
      addColumnIfMissing(db, 'commandes', 'total_ht', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'commandes', 'total_ttc', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'commandes', 'total', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'commandes', 'statut_paiement', "TEXT DEFAULT 'Non payé'");
      addColumnIfMissing(db, 'commandes', 'montant_paye', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'commandes', 'montant_restant', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'commandes', 'date_limite_paiement', 'TEXT');
      addColumnIfMissing(db, 'commandes', 'stock_restaure', 'INTEGER NOT NULL DEFAULT 0');
      addColumnIfMissing(db, 'commandes', 'date_commande', 'TEXT DEFAULT CURRENT_TIMESTAMP');
      addColumnIfMissing(db, 'commandes', 'created_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
      addColumnIfMissing(db, 'commandes', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
    }
    addColumnIfMissing(db, 'details_commandes', 'tva_rate', 'REAL DEFAULT 0.2');
    if (tableExists(db, 'achats')) {
      addColumnIfMissing(db, 'achats', 'statut_paiement', "TEXT DEFAULT 'Non payé'");
      addColumnIfMissing(db, 'achats', 'montant_paye', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'achats', 'montant_restant', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'achats', 'designation', 'TEXT');
      addColumnIfMissing(db, 'achats', 'nombre_produits', 'INTEGER DEFAULT 0');
      addColumnIfMissing(db, 'achats', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
    }
    addColumnIfMissing(db, 'details_achats', 'tva_rate', 'REAL DEFAULT 0.2');
    if (tableExists(db, 'devis')) {
      addColumnIfMissing(db, 'devis', 'statut_paiement', "TEXT DEFAULT 'Non payé'");
      addColumnIfMissing(db, 'devis', 'montant_paye', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'devis', 'montant_restant', 'REAL DEFAULT 0');
    }
    addColumnIfMissing(db, 'details_devis', 'tva_rate', 'REAL DEFAULT 0.2');
    if (tableExists(db, 'factures')) {
      addColumnIfMissing(db, 'factures', 'statut_paiement', "TEXT DEFAULT 'Non payé'");
      addColumnIfMissing(db, 'factures', 'montant_paye', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'factures', 'montant_restant', 'REAL DEFAULT 0');
    }
    addColumnIfMissing(db, 'details_factures', 'tva_rate', 'REAL DEFAULT 0.2');
    if (tableExists(db, 'employes')) {
      addColumnIfMissing(db, 'employes', 'status', "TEXT DEFAULT 'actif'");
      addColumnIfMissing(db, 'employes', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
    }
    if (tableExists(db, 'paiements_employes')) {
      addColumnIfMissing(db, 'paiements_employes', 'mois', 'INTEGER');
      addColumnIfMissing(db, 'paiements_employes', 'annee', 'INTEGER');
      addColumnIfMissing(db, 'paiements_employes', 'montant', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'paiements_employes', 'date_paiement', 'TEXT');
      addColumnIfMissing(db, 'paiements_employes', 'mode_paiement', "TEXT DEFAULT 'Espèces'");
      addColumnIfMissing(db, 'paiements_employes', 'statut', "TEXT DEFAULT 'Payé'");
      addColumnIfMissing(db, 'paiements_employes', 'reference', 'TEXT');
      addColumnIfMissing(db, 'paiements_employes', 'observation', 'TEXT');
      addColumnIfMissing(db, 'paiements_employes', 'salaire_brut', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'paiements_employes', 'cnaps', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'paiements_employes', 'ostie', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'paiements_employes', 'irsa', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'paiements_employes', 'avance', 'REAL DEFAULT 0');
      addColumnIfMissing(db, 'paiements_employes', 'created_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
      try {
        db.exec(`UPDATE paiements_employes SET date_paiement = CASE WHEN date_paiement IS NOT NULL AND TRIM(date_paiement) <> '' THEN substr(date_paiement, 1, 10) WHEN created_at IS NOT NULL AND TRIM(created_at) <> '' THEN substr(created_at, 1, 10) WHEN annee IS NOT NULL AND mois IS NOT NULL THEN printf('%04d-%02d-01', annee, mois) ELSE date('now') END WHERE date_paiement IS NULL OR TRIM(date_paiement) = ''`);
        log('✅ [migration] date_paiement anciennes données synchronisée');
      } catch (err) { warn('⚠️ [migration] backfill date_paiement:', err.message); }
    }
    if (tableExists(db, 'mouvements_stock')) addColumnIfMissing(db, 'mouvements_stock', 'prix_unitaire', 'REAL DEFAULT 0');
    if (tableExists(db, 'presence_employes')) addColumnIfMissing(db, 'presence_employes', 'justificatif_maladie', 'TEXT');
    try { db.exec(`UPDATE produits SET status = 'inactif' WHERE quantite_stock <= 0`); } catch (err) { warn('⚠️ Update produits status:', err.message); }

    log('🔧 Création des indexes...');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_produits_code ON produits(code)`, 'idx_produits_code');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_produits_status ON produits(status)`, 'idx_produits_status');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie_id)`, 'idx_produits_categorie');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_produits_fournisseur ON produits(fournisseur_id)`, 'idx_produits_fournisseur');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email)`, 'idx_utilisateurs_email');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_utilisateurs_status ON utilisateurs(status)`, 'idx_utilisateurs_status');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`, 'idx_sessions_token');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId)`, 'idx_sessions_userId');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_commandes_client ON commandes(client_id)`, 'idx_commandes_client');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_commandes_date ON commandes(date_commande)`, 'idx_commandes_date');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_commandes_statut_paiement ON commandes(statut_paiement)`, 'idx_commandes_statut_paiement');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_achats_fournisseur ON achats(fournisseur_id)`, 'idx_achats_fournisseur');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_achats_date ON achats(date_achat)`, 'idx_achats_date');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_achats_statut_paiement ON achats(statut_paiement)`, 'idx_achats_statut_paiement');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_devis_client ON devis(client_id)`, 'idx_devis_client');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_devis_date ON devis(date_devis)`, 'idx_devis_date');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_devis_statut_paiement ON devis(statut_paiement)`, 'idx_devis_statut_paiement');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id)`, 'idx_factures_client');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_factures_date ON factures(date_facture)`, 'idx_factures_date');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_factures_statut_paiement ON factures(statut_paiement)`, 'idx_factures_statut_paiement');
    
    // PAYMENTS INDEXES
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_paiements_employes_employe ON paiements_employes(employe_id)`, 'idx_paiements_employes_employe');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_paiements_employes_mois_annee ON paiements_employes(mois, annee)`, 'idx_paiements_employes_mois_annee');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_paiements_employes_date ON paiements_employes(date_paiement DESC)`, 'idx_paiements_employes_date');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_paiements_employes_employe_date ON paiements_employes(employe_id, date_paiement DESC, id DESC)`, 'idx_paiements_employes_employe_date');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_paiements_employes_period_date ON paiements_employes(annee, mois, date_paiement DESC, id DESC)`, 'idx_paiements_employes_period_date');
    
    // ⭐ UNIQUE CONSTRAINT (Tsy azo averina in-2 ny mandoa karama isambolana ho an'ny employé iray)
    createIndex(db, `CREATE UNIQUE INDEX IF NOT EXISTS idx_paiements_unique_periode ON paiements_employes(employe_id, mois, annee)`, 'idx_paiements_unique_periode');

    // RH INDEXES
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_presence_employes_employe ON presence_employes(employe_id)`, 'idx_presence_employes_employe');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_presence_employes_mois_annee ON presence_employes(mois, annee)`, 'idx_presence_employes_mois_annee');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_historique_salaires_employe ON historique_salaires(employe_id)`, 'idx_historique_salaires_employe');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_presence_journaliere_employe_date ON presence_journaliere(employe_id, date DESC)`, 'idx_presence_journaliere_employe_date');
    createIndex(db, `CREATE INDEX IF NOT EXISTS idx_presence_journaliere_date ON presence_journaliere(date DESC)`, 'idx_presence_journaliere_date');

    try {
      db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS produits_fts USING fts5(nom, code, description, content='produits', content_rowid='id');`);
      db.exec(`CREATE TRIGGER IF NOT EXISTS produits_ai AFTER INSERT ON produits BEGIN INSERT INTO produits_fts(rowid, nom, code, description) VALUES (new.id, new.nom, new.code, new.description); END;`);
      db.exec(`CREATE TRIGGER IF NOT EXISTS produits_ad AFTER DELETE ON produits BEGIN INSERT INTO produits_fts(produits_fts, rowid, nom, code, description) VALUES ('delete', old.id, old.nom, old.code, old.description); END;`);
      db.exec(`CREATE TRIGGER IF NOT EXISTS produits_au AFTER UPDATE ON produits BEGIN INSERT INTO produits_fts(produits_fts, rowid, nom, code, description) VALUES ('delete', old.id, old.nom, old.code, old.description); INSERT INTO produits_fts(rowid, nom, code, description) VALUES (new.id, new.nom, new.code, new.description); END;`);
      log('✅ FTS5 produits configuré');
    } catch (ftsErr) { warn('⚠️ FTS5 produits non disponible/configuré:', ftsErr.message); }

    try {
      db.exec(`DROP TRIGGER IF EXISTS update_statut_stock_after_stock_change;`);
      db.exec(`CREATE TRIGGER IF NOT EXISTS update_statut_stock_after_stock_change AFTER UPDATE OF quantite_stock ON produits BEGIN UPDATE produits SET statut_stock = CASE WHEN NEW.quantite_stock <= 0 THEN 'rupture' WHEN NEW.quantite_stock <= NEW.quantite_minimale THEN 'alerte' ELSE 'disponible' END, status = CASE WHEN NEW.quantite_stock <= 0 THEN 'inactif' ELSE NEW.status END WHERE id = NEW.id; END;`);
      log('✅ Trigger statut_stock + status automatique configuré');
    } catch (triggerErr) { warn('⚠️ Trigger statut_stock non configuré:', triggerErr.message); }

    log('================================================');
    log('✅ DATABASE SCHEMA INITIALISÉ');
    log('✅ Tables vérifiées');
    log('✅ Migrations vérifiées');
    log('✅ Payroll vérifié');
    log('✅ Index calendrier vérifiés');
    log('✅ FTS5 vérifié');
    log('✅ Triggers vérifiés');
    log('✅ Modules ERP: Achats, Ventes, Commandes, RH Payroll');
    log('✅ Nouvelle table: presence_journaliere');
    log('================================================');
    return true;
  } catch (err) {
    error('[tables] ❌ Erreur lors de la création du schéma:', err.message);
    if (err.stack) error(err.stack);
    return false;
  }
}

module.exports = { ensureTables, tableExists, columnExists, addColumnIfMissing };