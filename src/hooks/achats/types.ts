// src/hooks/achats/types.ts

export interface Achat {
  id: number;
  reference: string | null;
  fournisseur_id: number;
  fournisseur_nom?: string;
  date_achat: string;
  total_ht: number;
  total_ttc: number;
  designation?: string;
  nombre_produits?: number;
  observation?: string;
  mode_paiement?: string;
  modalite_paiement?: string;
  frais_livraison?: number;
  statut_paiement?: string;
  created_at: string;
  updated_at?: string;
}

export interface AchatDetail {
  id: number;
  achat_id: number;
  produit_id: number;
  produit_nom?: string;
  produit_code?: string;
  produit_image?: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  tva_rate?: number;
}

export interface AchatFilters {
  searchTerm: string;
  filterFournisseur: string;
  sortOption: string;
}

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';