// src/pages/commandes/helpers.ts

export const normalizePaiementStatus = (statut: unknown): 'Payé' | 'Partiel' | 'Non payé' => {
  const n = String(statut || '').trim().toLowerCase();
  switch (n) {
    case 'payé': case 'paye': case 'paid': case 'payee':
    case 'payé complet': case 'paye complet': case 'paiement complet': return 'Payé';
    case 'partiel': case 'partial': case 'partielle':
    case 'partiellement payé': case 'partiellement paye': case 'paiement partiel': return 'Partiel';
    default: return 'Non payé';
  }
};

export const formatMoney = (v: number | string | undefined): string =>
  `${Number(v || 0).toLocaleString('fr-FR')} Ar`;

export const countTotalItems = (commandes: any[]) => {
  return commandes.reduce((count, commande) => {
    const produits = commande.produits_noms || commande.produits;
    if (!produits) return count;
    if (Array.isArray(produits)) return count + produits.length;
    if (typeof produits === 'string' && produits.trim().startsWith('[')) {
      try { return count + JSON.parse(produits).length; } catch (e) {}
    }
    return count + produits.split(',').filter(Boolean).length;
  }, 0);
};