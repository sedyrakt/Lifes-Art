// src/components/dashboard/hooks/useDashboardKPIs.ts
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ KPI VENTES: 4 KPIs | KPI STOCK: 4 KPIs
// ⭐ FIX #1: Bénéfice net = CA - Dépenses - ACHATS - Salaires
// ⭐ FIX: Bénéfice net → negative: false (mba tsy hifamadika ny loko)
// ⭐ ESORINA: KPI "Salaires payés" sy KPI "Stock normal"

import React, { useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Users, ShoppingCart,
  Warehouse, XCircle, AlertOctagon, RotateCcw,
} from 'lucide-react';
import { safeNumber, safeVariation } from '../utils/variation';
import { buildPattern } from '../Sparkline';
import type { DashboardStats, ChartItem } from '../types';

export const useDashboardKPIs = (stats: DashboardStats, chartsData: any) => {
  // ═══════════ Valeurs brutes ═══════════
  const chiffreAffaires = safeNumber(stats?.chiffreAffaires);
  const depenses = safeNumber(stats?.depenses);
  const achats = safeNumber(stats?.achats);              // ⭐ NOUVEAU
  const salairesPayes = safeNumber(stats?.salairesPayes);

  // ⭐ FIX #1: Bénéfice net = CA - Dépenses - ACHATS - Salaires
  const beneficeNet = chiffreAffaires - depenses - achats - salairesPayes;

  const commandesTotal = safeNumber(stats?.commandesTotal);
  const panierMoyen = commandesTotal > 0 ? chiffreAffaires / commandesTotal : 0;
  const detteClient = safeNumber(stats?.totalDette);
  const commandesNonPayees = safeNumber(stats?.nbCommandesNonPayes);
  const clientsActifs = safeNumber(stats?.clientsActifs);
  const alertesStock = safeNumber(stats?.alertesStock);
  const ruptureStock = safeNumber(stats?.ruptureStock);
  const stockValue = safeNumber(stats?.stockValue ?? stats?.stockTotal);
  const stockTotal = safeNumber(stats?.stockTotal);
  const totalProduits = safeNumber(stats?.totalProduits);
  const rotationRate = safeNumber(stats?.rotationRate);

  // ═══════════ Variations ═══════════
  const variationCA = safeVariation(stats?.variationChiffreAffaires, chiffreAffaires);
  const variationBenefice = safeVariation(stats?.variationBenefice, beneficeNet);
  const variationCommandes = safeVariation(stats?.variationCommandesTotal ?? stats?.variationCommandes, commandesTotal);
  const variationClients = safeVariation(stats?.variationClients, clientsActifs);
  const variationStockValue = safeVariation(stats?.variationStockValue, stockValue);
  const variationRupture = safeVariation(stats?.variationRupture, ruptureStock);
  const variationAlertes = safeVariation(stats?.variationAlertes, alertesStock);
  const variationRotation = safeVariation(stats?.variationRotation, rotationRate);

  // ═══════════ Sparklines ═══════════
  const sparkCA = chartsData?.sparklineCA?.length > 0 ? chartsData.sparklineCA : buildPattern(1);
  const sparkBenefice = chartsData?.sparklineBenefice?.length > 0 ? chartsData.sparklineBenefice : buildPattern(2);
  const sparkCommandes = chartsData?.sparklineCommandes?.length > 0 ? chartsData.sparklineCommandes : buildPattern(3);
  const sparkClients = chartsData?.sparklineClients?.length > 0 ? chartsData.sparklineClients : buildPattern(4);
  const sparkStockValue = chartsData?.sparklineStockValue?.length > 0 ? chartsData.sparklineStockValue : buildPattern(5);
  const sparkRupture = chartsData?.sparklineRupture?.length > 0 ? chartsData.sparklineRupture : buildPattern(6);
  const sparkAlertes = chartsData?.sparklineAlertes?.length > 0 ? chartsData.sparklineAlertes : buildPattern(7);
  const sparkRotation = chartsData?.sparklineRotation?.length > 0 ? chartsData.sparklineRotation : buildPattern(8);

  // ═══════════ KPI VENTES (4 KPIs) ═══════════
  const kpisVentes = useMemo(() => [
    {
      label: "Chiffre d'affaires", value: chiffreAffaires,
      money: true, negative: false, showSign: false, variation: variationCA,
      icon: React.createElement(DollarSign, { size: 18 }),
      iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      sparklineColor: '#6366F1', sparkline: sparkCA,
    },
    {
      // ⭐ FIX: negative: false — mba ho maitso rehefa mihatsara ny bénéfice (na négatif)
      label: 'Bénéfice net', value: beneficeNet,
      money: true, negative: false, showSign: true, variation: variationBenefice,
      icon: beneficeNet >= 0
        ? React.createElement(TrendingUp, { size: 18 })
        : React.createElement(TrendingDown, { size: 18 }),
      iconBg: beneficeNet >= 0 ? 'bg-emerald-500/10 dark:bg-emerald-500/15' : 'bg-rose-500/10 dark:bg-rose-500/15',
      iconColor: beneficeNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      sparklineColor: beneficeNet >= 0 ? '#10B981' : '#F43F5E',
      sparkline: sparkBenefice,
    },
    {
      label: 'Commandes', value: commandesTotal,
      money: false, negative: false, showSign: false, variation: variationCommandes,
      icon: React.createElement(ShoppingCart, { size: 18 }),
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
      iconColor: 'text-amber-600 dark:text-amber-400',
      sparklineColor: '#F59E0B', sparkline: sparkCommandes,
    },
    {
      label: 'Clients actifs', value: clientsActifs,
      money: false, negative: false, showSign: false, variation: variationClients,
      icon: React.createElement(Users, { size: 18 }),
      iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
      iconColor: 'text-violet-600 dark:text-violet-400',
      sparklineColor: '#8B5CF6', sparkline: sparkClients,
    },
  ], [chiffreAffaires, beneficeNet, commandesTotal, clientsActifs,
      variationCA, variationBenefice, variationCommandes, variationClients,
      sparkCA, sparkBenefice, sparkCommandes, sparkClients]);

  // ═══════════ KPI STOCK (4 KPIs) ═══════════
  const kpisStock = useMemo(() => [
    {
      label: 'Valeur stock', value: stockValue,
      money: true, negative: false, showSign: false, variation: variationStockValue,
      icon: React.createElement(Warehouse, { size: 18 }),
      iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      sparklineColor: '#6366F1', sparkline: sparkStockValue,
    },
    {
      label: 'Ruptures', value: ruptureStock,
      money: false, negative: true, showSign: false, variation: variationRupture,
      icon: React.createElement(XCircle, { size: 18 }),
      iconBg: 'bg-rose-500/10 dark:bg-rose-500/15',
      iconColor: 'text-rose-600 dark:text-rose-400',
      sparklineColor: '#EF4444', sparkline: sparkRupture,
    },
    {
      label: 'Alertes', value: alertesStock,
      money: false, negative: true, showSign: false, variation: variationAlertes,
      icon: React.createElement(AlertOctagon, { size: 18 }),
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
      iconColor: 'text-amber-600 dark:text-amber-400',
      sparklineColor: '#F59E0B', sparkline: sparkAlertes,
    },
    {
      label: 'Rotation', value: rotationRate,
      money: false, negative: false, showSign: false, variation: variationRotation,
      icon: React.createElement(RotateCcw, { size: 18 }),
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      sparklineColor: '#10B981', sparkline: sparkRotation,
      unit: '×',
    },
  ], [stockValue, ruptureStock, alertesStock, rotationRate,
      variationStockValue, variationRupture, variationAlertes, variationRotation,
      sparkStockValue, sparkRupture, sparkAlertes, sparkRotation]);

  return {
    // Valeurs
    chiffreAffaires, depenses, achats, salairesPayes, beneficeNet,   // ⭐ Nampiana 'achats'
    commandesTotal, panierMoyen, detteClient, commandesNonPayees,
    clientsActifs, alertesStock, ruptureStock, stockValue, stockTotal,
    totalProduits, rotationRate,
    // KPIs
    kpisVentes, kpisStock,
  };
};