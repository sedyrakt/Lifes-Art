// electron/database/tables/indexes.cjs
'use strict';

const { log, createIndex } = require('./helpers.cjs');

function createAllIndexes(db) {
  log('🔧 Création des indexes...');

  // Produits
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_produits_code ON produits(code)`, 'idx_produits_code');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_produits_status ON produits(status)`, 'idx_produits_status');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie_id)`, 'idx_produits_categorie');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_produits_fournisseur ON produits(fournisseur_id)`, 'idx_produits_fournisseur');

  // Utilisateurs
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email)`, 'idx_utilisateurs_email');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_utilisateurs_status ON utilisateurs(status)`, 'idx_utilisateurs_status');

  // Sessions
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`, 'idx_sessions_token');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId)`, 'idx_sessions_userId');

  // Commandes
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_commandes_client ON commandes(client_id)`, 'idx_commandes_client');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_commandes_date ON commandes(date_commande)`, 'idx_commandes_date');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_commandes_statut_paiement ON commandes(statut_paiement)`, 'idx_commandes_statut_paiement');

  // Achats
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_achats_fournisseur ON achats(fournisseur_id)`, 'idx_achats_fournisseur');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_achats_date ON achats(date_achat)`, 'idx_achats_date');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_achats_statut_paiement ON achats(statut_paiement)`, 'idx_achats_statut_paiement');

  // Devis
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_devis_client ON devis(client_id)`, 'idx_devis_client');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_devis_date ON devis(date_devis)`, 'idx_devis_date');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_devis_statut_paiement ON devis(statut_paiement)`, 'idx_devis_statut_paiement');

  // Factures
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id)`, 'idx_factures_client');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_factures_date ON factures(date_facture)`, 'idx_factures_date');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_factures_statut_paiement ON factures(statut_paiement)`, 'idx_factures_statut_paiement');

  // Paiements employés
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_paiements_employes_employe ON paiements_employes(employe_id)`, 'idx_paiements_employes_employe');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_paiements_employes_mois_annee ON paiements_employes(mois, annee)`, 'idx_paiements_employes_mois_annee');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_paiements_employes_date ON paiements_employes(date_paiement DESC)`, 'idx_paiements_employes_date');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_paiements_employes_employe_date ON paiements_employes(employe_id, date_paiement DESC, id DESC)`, 'idx_paiements_employes_employe_date');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_paiements_employes_period_date ON paiements_employes(annee, mois, date_paiement DESC, id DESC)`, 'idx_paiements_employes_period_date');
  // ⭐ FIX: UNIQUE INDEX — 1 paiement par employé / mois / année
  //    (remplace l'ancien idx_paiements_employes_periode non-unique)
  createIndex(db, `CREATE UNIQUE INDEX IF NOT EXISTS idx_paiement_unique_mois ON paiements_employes(employe_id, mois, annee)`, 'idx_paiement_unique_mois');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_paiements_employes_statut ON paiements_employes(statut)`, 'idx_paiements_employes_statut');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_paiements_employes_annee_mois ON paiements_employes(annee DESC, mois DESC)`, 'idx_paiements_employes_annee_mois');

  // Employés
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_employes_status ON employes(status)`, 'idx_employes_status');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_employes_matricule ON employes(matricule)`, 'idx_employes_matricule');

  // Présences
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_presence_employes_employe ON presence_employes(employe_id)`, 'idx_presence_employes_employe');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_presence_employes_mois_annee ON presence_employes(mois, annee)`, 'idx_presence_employes_mois_annee');

  // Historique salaires
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_historique_salaires_employe ON historique_salaires(employe_id)`, 'idx_historique_salaires_employe');

  // Présence journalière
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_presence_journaliere_employe_date ON presence_journaliere(employe_id, date DESC)`, 'idx_presence_journaliere_employe_date');
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_presence_journaliere_date ON presence_journaliere(date DESC)`, 'idx_presence_journaliere_date');

  // Planning
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_planning_employe_jour ON planning(employe_id, jour_semaine)`, 'idx_planning_employe_jour');

  // Stock snapshots
  createIndex(db, `CREATE INDEX IF NOT EXISTS idx_stock_snapshots_date ON stock_snapshots(date_snapshot DESC)`, 'idx_stock_snapshots_date');

  return true;
}

module.exports = { createAllIndexes };