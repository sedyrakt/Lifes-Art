// src/hooks/fournisseurs/types.ts

export interface FournisseurFilters {
  searchTerm: string;
  email: string;
  telephone: string;
  dateFrom: string;
  dateTo: string;
}

export interface FournisseurStats {
  total: number;
  avec_contact: number;
  avec_email: number;
}

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';