// src/hooks/dashboard/dateRange.ts
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: "Ce mois" = CALENDAR MONTH (1er → fin du mois)
//         mifanaraka amin'ny "Analyses avancées" sy "Commandes"
// ⭐ FIX: "Mois dernier" = CALENDAR MONTH PRÉCÉDENT
// ⭐ Tsy misy hook — pure function

import type { DateRangeType, DashboardDateRange } from './types';
import { formatLocalDate } from './helpers';

/**
 * ⭐ Pure function — tsy misy hook
 * Maka ny date range mifototra amin'ny dateRange + custom dates
 */
export const getDateRange = (
  dateRange: DateRangeType,
  customStartDate: string,
  customEndDate: string
): DashboardDateRange => {
  const now = new Date();
  const today = formatLocalDate(now);

  // ═══════════════════════════════════════════════════════════
  // AUJOURD'HUI
  // ═══════════════════════════════════════════════════════════
  if (dateRange === 'aujourdhui') {
    return { startDate: `${today} 00:00:00`, endDate: `${today} 23:59:59` };
  }

  // ═══════════════════════════════════════════════════════════
  // HIER
  // ═══════════════════════════════════════════════════════════
  if (dateRange === 'hier') {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const date = formatLocalDate(yesterday);
    return { startDate: `${date} 00:00:00`, endDate: `${date} 23:59:59` };
  }

  // ═══════════════════════════════════════════════════════════
  // CETTE SEMAINE (Lundi → Dimanche)
  // ═══════════════════════════════════════════════════════════
  if (dateRange === 'semaine') {
    const monday = new Date(now);
    const day = monday.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Lundi = 1, Dimanche = 0
    monday.setDate(monday.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return {
      startDate: `${formatLocalDate(monday)} 00:00:00`,
      endDate: `${formatLocalDate(sunday)} 23:59:59`,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // ⭐ CE MOIS = CALENDAR MONTH (1er → fin du mois)
  // ⭐ FIX: Nifanaraka amin'ny "Analyses avancées" sy "Commandes"
  //         ary koa amin'ny SQL data (Août + Septembre)
  // ═══════════════════════════════════════════════════════════
  if (dateRange === 'mois') {
    // ⭐ 1er du mois actuel → dernier jour du mois actuel
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    firstDay.setHours(0, 0, 0, 0);
    lastDay.setHours(23, 59, 59, 999);
    return {
      startDate: `${formatLocalDate(firstDay)} 00:00:00`,
      endDate: `${formatLocalDate(lastDay)} 23:59:59`,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // ⭐ MOIS DERNIER = CALENDAR MONTH PRÉCÉDENT
  // ⭐ FIX: 1er → fin du mois précédent
  // ═══════════════════════════════════════════════════════════
  if (dateRange === 'mois_dernier') {
    const firstDayPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPrev = new Date(now.getFullYear(), now.getMonth(), 0);
    firstDayPrev.setHours(0, 0, 0, 0);
    lastDayPrev.setHours(23, 59, 59, 999);
    return {
      startDate: `${formatLocalDate(firstDayPrev)} 00:00:00`,
      endDate: `${formatLocalDate(lastDayPrev)} 23:59:59`,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CETTE ANNÉE (1er Janvier → 31 Décembre)
  // ═══════════════════════════════════════════════════════════
  if (dateRange === 'annee') {
    const year = now.getFullYear();
    return { startDate: `${year}-01-01 00:00:00`, endDate: `${year}-12-31 23:59:59` };
  }

  // ═══════════════════════════════════════════════════════════
  // ANNÉE DERNIÈRE
  // ═══════════════════════════════════════════════════════════
  if (dateRange === 'annee_derniere') {
    const year = now.getFullYear() - 1;
    return { startDate: `${year}-01-01 00:00:00`, endDate: `${year}-12-31 23:59:59` };
  }

  // ═══════════════════════════════════════════════════════════
  // PÉRIODE PERSONNALISÉE
  // ═══════════════════════════════════════════════════════════
  if (dateRange === 'custom') {
    if (!customStartDate || !customEndDate) return {};
    return {
      startDate: `${customStartDate} 00:00:00`,
      endDate: `${customEndDate} 23:59:59`,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // DEFAULT
  // ═══════════════════════════════════════════════════════════
  return {};
};