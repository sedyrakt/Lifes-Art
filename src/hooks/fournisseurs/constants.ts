// src/hooks/fournisseurs/constants.ts

export const ITEMS_PER_PAGE = 8;

// ⭐ FIX: SORT_MAP mifanaraka amin'ny SORT_OPTIONS ao amin'ny FournisseursSearchBar
export const SORT_MAP = {
  'Nom (A-Z)':     { field: 'nom',        direction: 'ASC'  },
  'Nom (Z-A)':     { field: 'nom',        direction: 'DESC' },
  'Date (Récent)': { field: 'created_at', direction: 'DESC' },
  'Date (Ancien)': { field: 'created_at', direction: 'ASC'  },
} as const;