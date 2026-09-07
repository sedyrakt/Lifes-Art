export interface Entree {
  id: number;
  reference: string;
  produit_id: number;
  produit_nom?: string;
  quantite: number;
  prix_unitaire: number;
  observation?: string;
  date_entree: string;
  image?: string | null;
}

export interface ProduitOption {
  id: number;
  nom: string;
}

export const ITEMS_PER_PAGE = 8;