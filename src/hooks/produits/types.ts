// src/hooks/produits/types.ts

export type SortOption =
  | 'Nom (A-Z)'
  | 'Nom (Z-A)'
  | 'Prix (Croissant)'
  | 'Prix (Décroissant)'
  | 'Stock (Croissant)'
  | 'Stock (Décroissant)'
  | 'Nouveaux d\'abord';

export interface ProduitFilters {
  searchTerm: string;
  filterCategorie: string;
  filterStatus: string;
  prixMin: string;
  prixMax: string;
  dateFrom: string;
  dateTo: string;
}

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';