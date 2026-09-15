// src/hooks/commandes/types.ts

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';

export interface GlobalStats {
  total: number;
  totalCA: number;
  totalHT: number;
  totalPaye: number;
  totalDette: number;
  nbCommandesNonPayees: number;
  nbCommandesPayees: number;
  nbCommandesPartielles: number;
  nbCommandesEnRetard: number;
  totalItems: number;
}

export interface DetteStats {
  total_dette: number;
  nb_commandes_non_payees: number;
}

export type SelectedProduit = { id: number; quantite: number; tva_rate?: number };