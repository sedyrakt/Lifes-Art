// src/hooks/dashboard/types.ts
// ⭐ FIX: Nampiana 'achats' ao amin'ny DashboardStats
//         mba hifanaraka amin'ny formule: CA − Dépenses − Achats − Salaires

export interface DashboardChartsData {
  ventesParMois: any[];
  topProduits: any[];
  categorieRepartition: any[];
  stockStatus: { en_stock: number; stock_bas: number; rupture: number };
  entreesStock: any[];
  sortiesStock: any[];
  topClients: any[];
  depensesParCategorie: any[];
  commandesStatut: any[];
  ruptureStockDetails: any[];
  detteClientsDetails: any[];
  commandesEnAttenteDetails: any[];
  // ⭐ Sparklines VENTES
  sparklineCA: number[];
  sparklineBenefice: number[];
  sparklineCommandes: number[];
  sparklineClients: number[];
  // ⭐ Sparklines STOCK
  sparklineStockValue: number[];
  sparklineRupture: number[];
  sparklineAlertes: number[];
  sparklineRotation: number[];
}

export type DateRangeType =
  | 'aujourdhui'
  | 'hier'
  | 'semaine'
  | 'mois'
  | 'mois_dernier'
  | 'annee'
  | 'annee_derniere'
  | 'custom';

export interface DashboardDateRange {
  startDate?: string;
  endDate?: string;
}

export interface DashboardStats {
  // ═══ VENTES ═══
  chiffreAffaires: number;
  depenses: number;
  achats: number;                // ⭐ NOUVEAU
  salaires: number;
  salairesPayes: number;
  beneficeNet: number;
  commandesTotal: number;
  commandesEnAttente: number;
  clientsActifs: number;
  totalClients: number;

  // ═══ STOCK ═══
  stockValue: number;
  stockTotal: number;
  totalProduits: number;
  ruptureStock: number;
  alertesStock: number;
  stockNormal: number;
  rotationRate: number;

  // ═══ DETTE ═══
  totalDette: number;
  nbCommandesNonPayees: number;
  totalPaiements: number;

  // ═══ VARIATIONS VENTES ═══
  variationChiffreAffaires?: number;
  variationBenefice?: number;
  variationCommandesTotal?: number;
  variationCommandes?: number;
  variationClients?: number;
  variationDepenses?: number;
  variationAchats?: number;      // ⭐ NOUVEAU

  // ═══ VARIATIONS STOCK ═══
  variationStockValue?: number;
  variationRupture?: number;
  variationAlertes?: number;
  variationRotation?: number;

  // ═══ META ═══
  firstClientDate: string | null;
  startDate: string | null;
  endDate: string | null;
}