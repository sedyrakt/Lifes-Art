// src/hooks/commandes/normalizers.ts

export const normalizeFilterStatut = (statut: string): string | undefined => {
  if (!statut || statut === 'Tous') return undefined;
  const n = statut.toLowerCase();
  if (n === 'payé' || n === 'paye' || n === 'paid' || n === 'payee') return 'Payé';
  if (n === 'partiel' || n === 'partial' || n === 'partielle' || n === 'partiellement payé') return 'Partiel';
  return 'Non payé';
};

export const normalizePaiementStatus = (statut: string): 'Payé' | 'Partiel' | 'Non payé' => {
  const n = String(statut || '').trim().toLowerCase();
  switch (n) {
    case 'payé': case 'paye': case 'paid': case 'payee':
    case 'payé complet': case 'paye complet': return 'Payé';
    case 'partiel': case 'partial': case 'partielle':
    case 'partiellement payé': case 'partiellement paye': return 'Partiel';
    default: return 'Non payé';
  }
};