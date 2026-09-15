// src/hooks/dashboard/groupBy.ts
import type { DateRangeType } from './types';

/**
 * ⭐ Pure function — mamaritra ny groupBy arakaraka ny dateRange
 */
export const getGroupBy = (dateRange: DateRangeType): 'heure' | 'jour' | 'mois' => {
  switch (dateRange) {
    case 'aujourdhui':
    case 'hier': return 'heure';
    case 'semaine':
    case 'mois':
    case 'mois_dernier':
    case 'custom': return 'jour';
    case 'annee':
    case 'annee_derniere': return 'mois';
    default: return 'jour';
  }
};