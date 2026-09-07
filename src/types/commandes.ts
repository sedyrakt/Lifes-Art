// ============================================================
// src/types/commandes.ts
// ⭐ COMMANDES — TYPES CLEAN / COMPACT
// ⭐ STATUT UNIQUE : Payé | Partiel | Non payé
// ⭐ ANCIEN STATUT COMMANDE SUPPRIMÉ
// ============================================================

export type StatutPaiement = 'Payé' | 'Partiel' | 'Non payé';

export interface DetailCommande {
  id: number;
  commande_id?: number;
  produit_id: number;
  produit_nom: string;
  produit_code?: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  total_ligne?: number;
  name?: string;
  quantity?: number;
  price?: number;
  image?: string | null;
}

export interface Commande {
  id: number;
  client_id?: number | null;
  client_nom: string;
  client_telephone?: string;
  client_email?: string;
  client_address?: string;

  numero?: string;
  date_commande: string;
  created_at: string;
  updated_at?: string;

  total_ht: number;
  total_ttc: number;
  total: number;
  remise?: number;

  observation?: string;
  produits_noms?: string;

  products?: any[];
  produits_details?: DetailCommande[];

  statut_paiement: StatutPaiement;
  montant_paye: number;
  montant_restant: number;
  date_limite_paiement?: string;
}

export interface Client {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

export interface Produit {
  id: number;
  nom: string;
  code: string;
  prix_vente: number;
  quantite_stock: number;
  unite?: string;
  quantite_minimale: number;
  statut_stock?: string;
  image?: string;
}

export interface CommandesStats {
  total: number;
  totalCA: number;
  totalHT: number;
  moyennePanier: number;
  clientsUniques: number;
  totalDette?: number;
  nbCommandesNonPayees?: number;
}