// src/components/dashboard/utils/variation.ts

export const safeNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const safeVariation = (value: unknown, currentValue?: number): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (number === 100 && currentValue !== undefined && currentValue === 0) return null;
  if (number === 100) return null;
  return Number(number.toFixed(1));
};