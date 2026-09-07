// src/utils/paiementUtils.ts
export const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export function toNumber(v: unknown, fb = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

export function normalizeDateISO(v?: string | null): string {
  if (!v) return '';
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function formatAriary(v: unknown): string {
  return `${Math.round(toNumber(v)).toLocaleString('fr-FR')} Ar`;
}

export function formatDate(v?: string | null): string {
  const n = normalizeDateISO(v);
  if (!n) return '—';
  const [y, m, d] = n.split('-');
  return `${d}/${m}/${y}`;
}

export function getMonthName(m: number): string {
  return MONTHS[m - 1] || '—';
}

export function extractData<T>(r: any, fb: T): T {
  if (r && typeof r === 'object' && 'data' in r) return r.data ?? fb;
  return r ?? fb;
}

export function isApiFailure(r: any): boolean {
  return r?.success === false;
}

// ✅ Fonction ajoutée pour résoudre l'erreur
export function getEmployeeName(e: { prenom?: string; nom?: string }): string {
  return `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() || 'Employé';
}