// src/hooks/produits/referencesHelpers.ts

export const normalizeCategory = (item: any): { id: number; nom: string } | null => {
  if (!item) return null;
  const id = Number(item.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  const nom = String(item.nom || item.name || item.libelle || item.label || '').trim();
  return { id, nom };
};

export const normalizeFournisseur = (item: any): { id: number; nom: string } | null => {
  if (!item) return null;
  const id = Number(item.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  const nom = String(item.nom || item.name || item.raison_sociale || item.libelle || item.label || '').trim();
  return { id, nom };
};

export const extractArray = (response: any, specificKey?: string): any[] => {
  if (!response) return [];
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.data?.rows)) return response.data.rows;
  if (specificKey && Array.isArray(response.data?.[specificKey])) return response.data[specificKey];
  if (specificKey && Array.isArray(response[specificKey])) return response[specificKey] as any[];
  return [];
};