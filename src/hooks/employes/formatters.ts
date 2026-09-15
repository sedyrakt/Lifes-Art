// src/hooks/employes/formatters.ts

// ⭐ Local date helper (YYYY-MM-DD) — tsy UTC
export const toLocalDateString = (d: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// ⭐ Format nombre tsotra (space mahazatra)
export const formatNumberNoSlash = (value: number) =>
  (Number(value) || 0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');

// ⭐ Status label amin'ny teny français
export const getStatusLabel = (status: string): string => {
  if (status === 'actif') return 'Actif';
  if (status === 'en_conge') return 'En congé';
  return 'Inactif';
};

// ⭐ Helper: maka ny message d'erreur marina avy amin'ny result
export const getErrorMessage = (result: any, fallback: string): string => {
  if (!result) return fallback;
  return result.error || result.message || fallback;
};