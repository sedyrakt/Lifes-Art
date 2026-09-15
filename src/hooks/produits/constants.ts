// src/hooks/produits/constants.ts

export const ITEMS_PER_PAGE = 10;

export const SORT_MAP = {
  'Nom (A-Z)': { field: 'nom', direction: 'ASC' },
  'Nom (Z-A)': { field: 'nom', direction: 'DESC' },
  'Prix (Croissant)': { field: 'prix_vente', direction: 'ASC' },
  'Prix (Décroissant)': { field: 'prix_vente', direction: 'DESC' },
  'Stock (Croissant)': { field: 'quantite_stock', direction: 'ASC' },
  'Stock (Décroissant)': { field: 'quantite_stock', direction: 'DESC' },
  'Nouveaux d\'abord': { field: 'id', direction: 'DESC' },
} as const;