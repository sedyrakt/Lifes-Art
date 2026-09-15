// src/hooks/ventes/exportHelpers.ts
import type { ExportPeriod } from './types';

export const getExportPeriodRange = (period: ExportPeriod, customDate: string) => {
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