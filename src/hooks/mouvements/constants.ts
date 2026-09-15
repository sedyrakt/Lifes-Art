// src/hooks/mouvements/constants.ts
import type { MouvementsStats } from '../../types/mouvements';

export const ITEMS_PER_PAGE = 8;

export const EMPTY_STATS: MouvementsStats = {
  total: 0,
  entrees: 0,
  sorties: 0,
  ajustements: 0,
  quantiteEntree: 0,
  quantiteSortie: 0,
};

export const VALID_TYPES = ['ENTREE', 'SORTIE', 'AJUSTEMENT'];