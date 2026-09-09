'use strict';

const VALID_PAIEMENT_STATUSES = ['Payé', 'Partiel', 'Non payé'];

function normalizePaiement(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'payé': case 'paye': case 'paid': case 'payee':
    case 'payé complet': case 'paye complet': case 'paiement complet': return 'Payé';
    case 'partiel': case 'partial': case 'partielle':
    case 'partiellement payé': case 'partiellement paye': case 'paiement partiel': return 'Partiel';
    case 'non payé': case 'non paye': case 'unpaid':
    case 'non_payé': case 'non_paye': case 'impayé':
    case 'impaye': case 'en attente': return 'Non payé';
    default: return null;
  }
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function computePaiementStatus(totalTTC, montantPaye) {
  const total = Math.max(0, toNumber(totalTTC));
  const paye = Math.max(0, Math.min(total, toNumber(montantPaye)));
  if (paye <= 0) return 'Non payé';
  if (paye >= total) return 'Payé';
  return 'Partiel';
}

function normalizePaymentValues(totalTTC, montantPaye) {
  const total = Math.max(0, toNumber(totalTTC));
  const paye = Math.max(0, Math.min(total, toNumber(montantPaye)));
  const restant = Math.max(0, total - paye);
  return {
    totalTTC: Number(total.toFixed(2)),
    montantPaye: Number(paye.toFixed(2)),
    montantRestant: Number(restant.toFixed(2)),
    statutPaiement: computePaiementStatus(total, paye)
  };
}

// ⭐ FIX: Raha 0 dia 0, raha null/undefined/'' dia 0
function parseTvaRate(value) {
  return (value !== undefined && value !== null && value !== '')
    ? Number(value)
    : 0;
}

function validateOrderProduct(product, index) {
  const errors = [];
  if (!product || typeof product !== 'object' || Array.isArray(product)) {
    errors.push(`Produit #${index + 1} invalide`);
    return errors;
  }
  const id = Number(product.id);
  const quantity = Number(product.quantity);
  const price = Number(product.price);
  const tvaRate = parseTvaRate(product.tva_rate);
  
  if (!Number.isInteger(id) || id <= 0) errors.push(`Produit #${index + 1}: ID invalide`);
  if (!Number.isInteger(quantity) || quantity <= 0) errors.push(`Produit #${index + 1}: quantité invalide`);
  if (!Number.isFinite(price) || price < 0) errors.push(`Produit #${index + 1}: prix invalide`);
  if (!Number.isFinite(tvaRate)) errors.push(`Produit #${index + 1}: taux TVA invalide`);
  return errors;
}

function validateOrder(data = {}) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Données commande invalides'] };
  }
  
  const clientId = data.client_id ? Number(data.client_id) : null;
  const clientNom = typeof data.client_nom === 'string' ? data.client_nom.trim() : '';

  if (clientId !== null) {
    if (!Number.isInteger(clientId) || clientId <= 0) errors.push('Client invalide');
  }
  if (!clientNom) errors.push('Nom client requis');

  if (!Array.isArray(data.products) || data.products.length === 0) {
    errors.push('Au moins un produit est requis');
  } else {
    data.products.forEach((product, index) => {
      errors.push(...validateOrderProduct(product, index));
    });
  }

  const totalHT = toNumber(data.total_ht);
  const totalTTC = toNumber(data.total_ttc);
  if (totalHT < 0) errors.push('Total HT invalide');
  if (totalTTC < 0) errors.push('Total TTC invalide');

  const montantPaye = Math.max(0, Math.min(totalTTC, toNumber(data.montant_paye)));
  if (montantPaye < 0) errors.push('Montant payé invalide');
  if (montantPaye > totalTTC) errors.push('Le montant payé ne peut pas dépasser le total TTC');

  const payment = normalizePaymentValues(totalTTC, montantPaye);
  const requestedStatus = normalizePaiement(data.statut_paiement);
  if (requestedStatus) payment.statutPaiement = requestedStatus;

  if (errors.length > 0) return { valid: false, errors };
  
  return {
    valid: true,
    data: {
      client_id: clientId,
      client_nom: clientNom,
      products: data.products.map(product => ({
        id: Number(product.id),
        name: typeof product.name === 'string' ? product.name.trim() : '',
        price: Number(product.price),
        quantity: Number(product.quantity),
        tva_rate: parseTvaRate(product.tva_rate)
      })),
      total_ht: Number(totalHT.toFixed(2)),
      total_ttc: payment.totalTTC,
      statut_paiement: payment.statutPaiement,
      montant_paye: payment.montantPaye,
      montant_restant: payment.montantRestant
    }
  };
}

module.exports = { VALID_PAIEMENT_STATUSES, normalizePaiement, computePaiementStatus, normalizePaymentValues, validateOrder };