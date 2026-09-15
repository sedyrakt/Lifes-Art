// src/hooks/ventes/types.ts

export interface Vente {
  id: number;
  reference: string | null;
  client_id: number | null;
  client_nom: string;
  date_devis?: string;
  date_facture?: string;
  total_ht: number;
  total_ttc: number;
  statut: string;
  statut_paiement?: string;
  montant_paye?: number;
  montant_restant?: number;
  observation?: string;
  created_at: string;
}

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';