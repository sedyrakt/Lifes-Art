// src/hooks/dashboard/helpers.ts

export const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const toNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return value.map(toNumber);
};

export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * ⭐ Extracteur de données (avy amin'ny Promise.allSettled)
 */
export const getData = (result: any, fallback: any = []) => {
  if (result?.status === 'fulfilled' && result?.value?.success) {
    return result.value.data ?? fallback;
  }
  return fallback;
};