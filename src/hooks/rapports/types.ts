// src/hooks/rapports/types.ts

export interface RapportsStats {
  totalProduits: number;
  totalVentes: number;
  totalEntrees: number;
  totalSorties: number;
  chiffreAffaires: number;
  benefice: number;
  nbCommandes: number;
  nbClients: number;
  tauxBenefice: number;
}

export interface TopProduit {
  id: number;
  nom: string;
  code: string;
  total_vendu: number;
  total_ventes: number;
  nb_commandes: number;
  prix_vente: number;
  categorie_nom: string;
  pourcentage?: number;
}

export interface VenteParMois {
  mois: string | number;
  moisLabel?: string;
  jour?: string;
  nb_commandes: number;
  total_ventes: number;
  panier_moyen?: number;
}

export interface CategorieRepartition {
  id: number;
  nom: string;
  total_produits: number;
  total_stock: number;
  valeur_vente: number;
  valeur_achat: number;
  pourcentage?: number;
}

export interface CommandeRecente {
  id: number;
  commande_numero: string;
  client_nom: string;
  date_commande: string;
  total_ttc: number;
  statut: string;
  nb_produits: number;
}

export type Periode = 'jour' | 'semaine' | 'mois' | 'trimestre' | 'annee';
export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';