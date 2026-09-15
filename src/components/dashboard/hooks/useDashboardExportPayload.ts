// src/components/dashboard/hooks/useDashboardExportPayload.ts
import { useMemo } from 'react';

interface Params {
  dateRangeLabel: string;
  customStartDate: string;
  customEndDate: string;
  chiffreAffaires: number;
  beneficeNet: number;
  depenses: number;
  salairesPayes: number;
  panierMoyen: number;
  detteClient: number;
  clientsActifs: number;
  alertesStock: number;
  ruptureStock: number;
  stockValue: number;
  rotationRate: number;
  stockTotal: number;
  totalProduits: number;
  commandesNonPayees: number;
  commandesTotal: number;
  topProducts: any[];
  alerts: any[];
  ruptureStockDetails: any[];
  detteClientsDetails: any[];
  commandesEnAttenteDetails: any[];
}

export const useDashboardExportPayload = (params: Params) => {
  return useMemo(() => ({
    periodLabel: params.dateRangeLabel,
    startDate: params.customStartDate || null,
    endDate: params.customEndDate || null,
    stats: {
      chiffreAffaires: params.chiffreAffaires,
      beneficeNet: params.beneficeNet,
      depenses: params.depenses,
      salairesPayes: params.salairesPayes,
      panierMoyen: params.panierMoyen,
      detteClient: params.detteClient,
      clientsActifs: params.clientsActifs,
      alertesStock: params.alertesStock,
      ruptureStock: params.ruptureStock,
      stockValue: params.stockValue,
      rotationRate: params.rotationRate,
      stockTotal: params.stockTotal,
      totalProduits: params.totalProduits,
      commandesNonPayees: params.commandesNonPayees,
      commandesTotal: params.commandesTotal,
    },
    topProduits: params.topProducts,
    alerts: params.alerts,
    ruptureStockDetails: params.ruptureStockDetails,
    detteClientsDetails: params.detteClientsDetails,
    commandesEnAttenteDetails: params.commandesEnAttenteDetails,
  }), [
    params.dateRangeLabel, params.customStartDate, params.customEndDate,
    params.chiffreAffaires, params.beneficeNet, params.depenses, params.salairesPayes,
    params.panierMoyen, params.detteClient, params.clientsActifs, params.alertesStock,
    params.ruptureStock, params.stockValue, params.rotationRate, params.stockTotal,
    params.totalProduits, params.commandesNonPayees, params.commandesTotal,
    params.topProducts, params.alerts, params.ruptureStockDetails,
    params.detteClientsDetails, params.commandesEnAttenteDetails,
  ]);
};