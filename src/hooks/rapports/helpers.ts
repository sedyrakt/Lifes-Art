// src/hooks/rapports/helpers.ts
import type { ExportPeriod } from './types';

export const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const sanitizeMoney = (value: string): string => {
  return value.replace(/[\u202F\u00A0]/g, ' ').replace(/,/g, '.');
};

export const toLocalDateString = (d: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const getPeriodLabel = (period: ExportPeriod, customDate: string): string => {
  switch (period) {
    case 'aujourdhui': return "Aujourd'hui";
    case 'hier': return 'Hier';
    case 'semaine': return 'Cette semaine';
    case 'mois': return 'Ce mois';
    case 'annee': return 'Cette année';
    case 'custom': {
      if (!customDate) return 'Personnalisé';
      const [y, m, d] = customDate.split('-');
      return `Personnalisé : ${d}/${m}/${y}`;
    }
    default: return String(period);
  }
};

export const getReportsApi = () => {
  if (typeof window === 'undefined') return null;
  return (window as any)?.api?.reports || null;
};

export const computeExportPeriodRange = (period: ExportPeriod, customDate: string) => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const toLocalDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  let startDate: string | undefined, endDate: string | undefined;

  if (period === 'aujourdhui') {
    const today = toLocalDate(now);
    startDate = today + ' 00:00:00';
    endDate = today + ' 23:59:59';
  } else if (period === 'hier') {
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const y = toLocalDate(yest);
    startDate = y + ' 00:00:00';
    endDate = y + ' 23:59:59';
  } else if (period === 'semaine') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    startDate = toLocalDate(monday) + ' 00:00:00';
    endDate = toLocalDate(sunday) + ' 23:59:59';
  } else if (period === 'mois') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    startDate = toLocalDate(firstDay) + ' 00:00:00';
    endDate = toLocalDate(lastDay) + ' 23:59:59';
  } else if (period === 'annee') {
    startDate = `${now.getFullYear()}-01-01 00:00:00`;
    endDate = `${now.getFullYear()}-12-31 23:59:59`;
  } else if (period === 'custom') {
    const dateStr = customDate || toLocalDate(now);
    startDate = dateStr + ' 00:00:00';
    endDate = dateStr + ' 23:59:59';
  }
  return { startDate, endDate };
};

export const isDateInRange = (dateValue: string | undefined | null, startDate?: string, endDate?: string): boolean => {
  if (!dateValue) return true;
  if (!startDate || !endDate) return true;
  const d = new Date(dateValue).getTime();
  if (isNaN(d)) return true;
  const s = new Date(startDate).getTime();
  const e = new Date(endDate).getTime();
  return d >= s && d <= e;
};