// src/components/dashboard/types.ts

export interface DashboardStats {
  chiffreAffaires?: number;
  depenses?: number;
  salairesPayes?: number;
  commandesTotal?: number;
  totalDette?: number;
  nbCommandesNonPayes?: number;
  clientsActifs?: number;
  alertesStock?: number;
  ruptureStock?: number;
  stockValue?: number;
  stockTotal?: number;
  totalProduits?: number;
  rotationRate?: number;
  variationChiffreAffaires?: number;
  variationBenefice?: number;
  variationCommandesTotal?: number;
  variationCommandes?: number;
  variationClients?: number;
  variationStockValue?: number;
  variationRupture?: number;
  variationAlertes?: number;
  variationRotation?: number;
  [key: string]: any;
}

export interface ChartItem { [key: string]: any; }

export interface AlertItem {
  type: string;
  title: string;
  message: string;
  time: string;
}