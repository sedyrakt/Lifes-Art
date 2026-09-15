// src/components/dashboard/utils/formatters.ts
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ NOUVEAU: formatCompactAriaryAxis (avec espace avant l'unité)

import { safeNumber } from './variation';

export const ARIARY_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
export const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export const formatAriary = (value: number | null | undefined, showSign = false): string => {
  const number = safeNumber(value);
  const formatted = ARIARY_FORMATTER.format(Math.abs(number));
  if (showSign) {
    if (number > 0) return `+${formatted} Ar`;
    if (number < 0) return `-${formatted} Ar`;
  }
  return `${formatted} Ar`;
};

export const formatNumber = (value: number | null | undefined): string =>
  NUMBER_FORMATTER.format(safeNumber(value));

export const formatCompactAriary = (value: number | null | undefined, showSign = false): string => {
  const amount = safeNumber(value);
  const abs = Math.abs(amount);
  let result = '';
  if (abs >= 1_000_000_000) result = `${(abs / 1_000_000_000).toFixed(2)} Mds Ar`;
  else if (abs >= 1_000_000) result = `${(abs / 1_000_000).toFixed(2)} M Ar`;
  else if (abs >= 1_000) result = `${(abs / 1_000).toFixed(1)} K Ar`;
  else result = `${ARIARY_FORMATTER.format(abs)} Ar`;
  if (showSign) {
    if (amount > 0) return `+${result}`;
    if (amount < 0) return `-${result}`;
  }
  return result;
};

// ⭐ NOUVEAU: format pour l'AXE Y (compact + espace avant unité)
export const formatCompactAriaryAxis = (value: number | null | undefined): string => {
  const amount = safeNumber(value);
  const abs = Math.abs(amount);
  if (abs === 0) return '0 Ar';
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)} G Ar`;
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)} M Ar`;
  if (abs >= 1_000) return `${(abs / 1_000).toFixed(0)} K Ar`;
  return `${abs} Ar`;
};

export const formatDateInput = (value?: string): string => {
  if (!value) return '';
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const formatDateShort = (value?: string | null): string => {
  if (!value) return '—';
  const s = String(value).trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  try {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
  } catch (_) {}
  return s;
};

export const formatRelativeTime = (value?: string | null): string => {
  if (!value) return 'À l\'instant';
  const s = String(value).trim();
  if (s.toLowerCase().startsWith('il y a')) return s;
  if (s === 'À jour' || s === 'Actuel' || s === '—') return s;

  let d: Date;
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (match) {
    const [, y, m, day, hh = '00', mm = '00'] = match;
    d = new Date(Number(y), Number(m) - 1, Number(day), Number(hh), Number(mm));
  } else {
    d = new Date(s);
  }
  if (Number.isNaN(d.getTime())) return s;

  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'À l\'instant';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  return formatDateShort(s);
};