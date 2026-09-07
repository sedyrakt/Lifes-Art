export const ITEMS_PER_PAGE = 10;


export type TabId = 'employes' | 'commandes' | 'factures';
export type DeleteType = 'commande' | 'facture' | 'employe' | 'bulk_pay' | 'paiement';
export type SortField = string;
export type SortDirection = 'ASC' | 'DESC';

export const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

export const safeNumber = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const normalizeText = (value: any): string => {
  return safeString(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};


export const parseDateSafe = (dateStr?: string | null): Date => {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return new Date(y, m - 1, d);
};

// ⭐ FIX: NY formatDate IZAO DIA MAMPiasa parseDateSafe (Tsy misy olana "31 aout" intsony)
export const formatDate = (date?: string | null): string => {
  if (!date) return '—';
  const d = parseDateSafe(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR');
};

export const getStatusClass = (status?: string | null): string => {
  const s = safeString(status).toLowerCase();
  if (s === 'paye' || s === 'payee' || s === 'paid') return 'text-emerald-500';
  if (s === 'partiel') return 'text-amber-500';
  if (s === 'non paye' || s === 'non_paye' || s === 'unpaid') return 'text-red-500';
  return 'text-slate-400';
};

export const moisLabels = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const annees = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

// ⭐ Fanampiana ho an'ny Bulk Payment
export const calculatePayrollForBulk = (brut: number, avance: number) => {
  const cnaps = Math.round(brut * 0.01);
  const ostie = Math.round(brut * 0.05);
  let irsa = 0;
  const taxable = brut - cnaps - ostie;
  if (taxable > 350000 && taxable <= 700000) irsa = Math.round((taxable - 350000) * 0.05);
  else if (taxable > 700000 && taxable <= 1400000) irsa = Math.round((taxable - 700000) * 0.10 + 17500);
  else if (taxable > 1400000 && taxable <= 3000000) irsa = Math.round((taxable - 1400000) * 0.15 + 87500);
  else if (taxable > 3000000) irsa = Math.round((taxable - 3000000) * 0.20 + 327500);
  const montant = Math.max(0, brut - cnaps - ostie - irsa - avance);
  return { cnaps, ostie, irsa, montant };
};