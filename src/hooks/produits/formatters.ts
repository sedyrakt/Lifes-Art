// src/hooks/produits/formatters.ts
import type { ExportPeriod } from './types';

export const formatNumberNoSlash = (value: number) => {
  return (Number(value) || 0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
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