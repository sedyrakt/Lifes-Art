// electron/database/tables/schemas.cjs
'use strict';

const { log, error } = require('./helpers.cjs');

function createAllSchemas(db) {
  log('🔄 Création/vérification du schéma database...');

  // ─── INVENTAIRE ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS fournisseurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      contact TEXT,
      telephone TEXT,
      email TEXT,
      adresse TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS produits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      nom TEXT NOT NULL,
      description TEXT,
      categorie_id INTEGER,
      fournisseur_id INTEGER,
      prix_achat REAL DEFAULT 0,
      prix_vente REAL DEFAULT 0,
      quantite_stock INTEGER DEFAULT 0,
      quantite_minimale INTEGER DEFAULT 5,
      unite TEXT DEFAULT 'pièce',
      tva_rate REAL DEFAULT 0.2,
      status TEXT DEFAULT 'actif',
      statut_stock TEXT DEFAULT 'disponible',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL
    );
  `);

  // ─── CLIENTS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      email TEXT UNIQUE,
      telephone TEXT,
      adresse TEXT,
      ville TEXT,
      code_postal TEXT,
      pays TEXT,
      type TEXT DEFAULT 'Particulier',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ─── COMMANDES ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS commandes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      client_nom TEXT NOT NULL,
      total_ht REAL DEFAULT 0,
      total_ttc REAL DEFAULT 0,
      total REAL DEFAULT 0,
      statut_paiement TEXT DEFAULT 'Non payé',
      montant_paye REAL DEFAULT 0,
      montant_restant REAL DEFAULT 0,
      date_limite_paiement TEXT,
      mode_paiement TEXT DEFAULT 'Espèces',
      modalite_paiement TEXT DEFAULT 'Immediat',
      frais_livraison REAL DEFAULT 0,
      stock_restaure INTEGER NOT NULL DEFAULT 0,
      date_commande TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS details_commandes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      commande_id INTEGER NOT NULL,
      produit_id INTEGER NOT NULL,
      quantite INTEGER NOT NULL,
      prix_unitaire REAL NOT NULL,
      total REAL NOT NULL,
      tva_rate REAL DEFAULT 0.2,
      FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
      FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
    );
  `);

  // ─── UTILISATEURS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS utilisateurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      firstName TEXT,
      lastName TEXT,
      role TEXT DEFAULT 'user',
      companyName TEXT,
      phone TEXT,
      status TEXT DEFAULT 'actif',
      twoFactorEnabled INTEGER DEFAULT 0,
      twoFactorSecret TEXT,
      lastLogin TEXT,
      loginAttempts INTEGER DEFAULT 0,
      lockedUntil TEXT,
      image TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      userId INTEGER NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES utilisateurs(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT,
      entity TEXT,
      entity_id INTEGER,
      entity_name TEXT,
      user_id INTEGER,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS security_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      action TEXT,
      ip TEXT,
      userAgent TEXT,
      status INTEGER,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ─── STOCK ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS entrees_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produit_id INTEGER NOT NULL,
      quantite INTEGER NOT NULL,
      prix_unitaire REAL DEFAULT 0,
      reference TEXT,
      fournisseur_id INTEGER,
      observation TEXT,
      date_entree TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
      FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sorties_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produit_id INTEGER NOT NULL,
      quantite INTEGER NOT NULL,
      prix_unitaire REAL DEFAULT 0,
      reference TEXT,
      destination TEXT,
      observation TEXT,
      date_sortie TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS mouvements_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produit_id INTEGER NOT NULL,
      type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('ENTREE', 'SORTIE')),
      quantite INTEGER NOT NULL,
      ancien_stock INTEGER NOT NULL,
      nouveau_stock INTEGER NOT NULL,
      reference TEXT,
      observation TEXT,
      prix_unitaire REAL DEFAULT 0,
      created_by INTEGER,
      date_mouvement TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES utilisateurs(id) ON DELETE SET NULL
    );
  `);

  // ─── RH : EMPLOYES ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS employes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telephone TEXT,
      poste TEXT NOT NULL,
      departement TEXT,
      date_embauche TEXT,
      salaire REAL DEFAULT 0,
      salaire_base REAL DEFAULT 0,
      cnaps REAL DEFAULT 0,
      ostie REAL DEFAULT 0,
      irsa REAL DEFAULT 0,
      situation_familiale TEXT,
      nombre_enfants INTEGER DEFAULT 0,
      matricule TEXT,
      cin TEXT,
      cnaps_numero TEXT,
      ostie_numero TEXT,
      banque TEXT,
      numero_compte TEXT,
      status TEXT DEFAULT 'actif',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ─── RH : PAIEMENTS EMPLOYES (VERSION COMPLÈTE MADAGASCAR) ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS paiements_employes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employe_id INTEGER NOT NULL,
      mois INTEGER NOT NULL,
      annee INTEGER NOT NULL,

      -- Paiement
      montant REAL NOT NULL DEFAULT 0,
      mode_paiement TEXT DEFAULT 'Espèces',
      statut TEXT DEFAULT 'Payé',
      reference TEXT,
      observation TEXT,
      date_paiement TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      -- Gains
      salaire_base REAL DEFAULT 0,
      salaire_brut REAL DEFAULT 0,
      heures_sup REAL DEFAULT 0,
      heures_sup_montant REAL DEFAULT 0,
      hs_montant REAL DEFAULT 0,
      prime_anciennete REAL DEFAULT 0,
      prime_logement REAL DEFAULT 0,
      prime_cherte_vie REAL DEFAULT 0,
      indemnite_transport REAL DEFAULT 0,
      autres_primes REAL DEFAULT 0,

      -- Retenues
      cnaps REAL DEFAULT 0,
      ostie REAL DEFAULT 0,
      irsa REAL DEFAULT 0,
      avance REAL DEFAULT 0,
      absences_deduction REAL DEFAULT 0,
      absences_count REAL DEFAULT 0,
      retards REAL DEFAULT 0,
      autres_retenues REAL DEFAULT 0,

      -- Totaux
      net_imposable REAL DEFAULT 0,
      cumul_gains REAL DEFAULT 0,
      cumul_retenues REAL DEFAULT 0,
      cumul_net REAL DEFAULT 0,

      -- Paramètres / Toggles
      cnaps_actif INTEGER DEFAULT 0,
      ostie_actif INTEGER DEFAULT 0,
      irsa_actif INTEGER DEFAULT 0,
      cnaps_taux REAL DEFAULT 1.0,
      ostie_taux REAL DEFAULT 1.0,
      payroll_parameters_snapshot TEXT,
      parametres_snapshot TEXT,

      FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
    );
  `);

  // ─── DÉPENSES / ACHATS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS depenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fournisseur_id INTEGER,
      description TEXT NOT NULL,
      montant REAL NOT NULL DEFAULT 0,
      categorie TEXT,
      date_depense TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS achats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fournisseur_id INTEGER NOT NULL,
      reference TEXT,
      date_achat TEXT DEFAULT CURRENT_TIMESTAMP,
      total_ht REAL DEFAULT 0,
      total_ttc REAL DEFAULT 0,
      designation TEXT,
      nombre_produits INTEGER DEFAULT 0,
      statut_paiement TEXT DEFAULT 'Non payé',
      montant_paye REAL DEFAULT 0,
      montant_restant REAL DEFAULT 0,
      observation TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS details_achats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      achat_id INTEGER NOT NULL,
      produit_id INTEGER,
      quantite INTEGER NOT NULL,
      prix_unitaire REAL NOT NULL,
      total REAL NOT NULL,
      tva_rate REAL DEFAULT 0.2,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (achat_id) REFERENCES achats(id) ON DELETE CASCADE,
      FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
    );
  `);

  // ─── DEVIS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS devis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      client_nom TEXT NOT NULL,
      reference TEXT,
      total_ht REAL DEFAULT 0,
      total_ttc REAL DEFAULT 0,
      validite_jours INTEGER DEFAULT 30,
      statut_paiement TEXT DEFAULT 'Non payé',
      montant_paye REAL DEFAULT 0,
      montant_restant REAL DEFAULT 0,
      observation TEXT,
      date_devis TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS details_devis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      devis_id INTEGER NOT NULL,
      produit_id INTEGER,
      quantite INTEGER NOT NULL,
      prix_unitaire REAL NOT NULL,
      total REAL NOT NULL,
      tva_rate REAL DEFAULT 0.2,
      FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE CASCADE,
      FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
    );
  `);

  // ─── FACTURES ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS factures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      client_nom TEXT NOT NULL,
      reference TEXT,
      total_ht REAL DEFAULT 0,
      total_ttc REAL DEFAULT 0,
      statut_paiement TEXT DEFAULT 'Non payé',
      montant_paye REAL DEFAULT 0,
      montant_restant REAL DEFAULT 0,
      observation TEXT,
      date_facture TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS details_factures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      facture_id INTEGER NOT NULL,
      produit_id INTEGER,
      quantite INTEGER NOT NULL,
      prix_unitaire REAL NOT NULL,
      total REAL NOT NULL,
      tva_rate REAL DEFAULT 0.2,
      FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE,
      FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
    );
  `);

  // ─── PRÉSENCES ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS presence_employes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employe_id INTEGER NOT NULL,
      mois INTEGER NOT NULL,
      annee INTEGER NOT NULL,
      jours_absences INTEGER DEFAULT 0,
      jours_conges INTEGER DEFAULT 0,
      jours_maladie INTEGER DEFAULT 0,
      justificatif_maladie TEXT,
      observation TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employe_id, mois, annee),
      FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS historique_salaires (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employe_id INTEGER NOT NULL,
      ancien_salaire REAL DEFAULT 0,
      nouveau_salaire REAL DEFAULT 0,
      date_changement TEXT DEFAULT CURRENT_TIMESTAMP,
      raison TEXT,
      FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS planning (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employe_id INTEGER NOT NULL,
      jour_semaine INTEGER NOT NULL,
      heure_debut TEXT DEFAULT '08:00',
      heure_fin TEXT DEFAULT '17:00',
      pause REAL DEFAULT 1,
      FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE,
      UNIQUE(employe_id, jour_semaine)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS presence_journaliere (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employe_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      statut TEXT NOT NULL DEFAULT 'present',
      heure_arrivee TEXT,
      heure_depart TEXT,
      heure_debut_planifiee TEXT DEFAULT '08:00',
      heure_fin_planifiee TEXT DEFAULT '17:00',
      retard INTEGER DEFAULT 0,
      heures_travaillees REAL DEFAULT 0,
      heures_sup REAL DEFAULT 0,
      observation TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employe_id, date),
      FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
    );
  `);

  // ─── PARAMÈTRES PAIE (VERSION MADAGASCAR + MODE) ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS parametres_paie (
      id INTEGER PRIMARY KEY CHECK (id = 1),

      -- ⭐ NOUVEAU: Mode de paie ('complet' | 'simplifie')
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

  // ─── STOCK SNAPSHOTS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_snapshot TEXT NOT NULL,
      stock_value REAL DEFAULT 0,
      stock_total INTEGER DEFAULT 0,
      total_produits INTEGER DEFAULT 0,
      rupture_stock INTEGER DEFAULT 0,
      alertes_stock INTEGER DEFAULT 0,
      stock_normal INTEGER DEFAULT 0,
      rotation_rate REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date_snapshot)
    );
  `);

  return true;
}

module.exports = { createAllSchemas };