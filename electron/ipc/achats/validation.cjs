// electron/ipc/achats/validation.cjs — ACHATS VALIDATION (FIXED)
// ⭐ FIX: Local date (tsy UTC) — mifanaraka amin'ny frontend
// ⭐ FIX: TVA default = 0 (raha tsy misy) fa tsy 0.2 fixe
'use strict';

// ⭐ FIX: Local date (tsy UTC) — mifanaraka amin'ny toLocalDateString() frontend
function normalizeDate(date) {
  if (!date) return getLocalDateISO();
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return getLocalDateISO();
  const pad = (n) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

// ⭐ Helper: local YYYY-MM-DD
function getLocalDateISO(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function validateAchat(data = {}) {
  const errors = [];

  const reference = typeof data.reference === 'string' ? data.reference.trim() : '';
  const fournisseurId = data.fournisseur_id !== undefined && data.fournisseur_id !== null && data.fournisseur_id !== ''
    ? Number(data.fournisseur_id)
    : null;

  if (fournisseurId === null || !Number.isInteger(fournisseurId) || fournisseurId <= 0) {
    errors.push('Fournisseur invalide ou manquant');
  }

  const dateAchat = normalizeDate(data.date_achat);

  const totalHT = Number(data.total_ht ?? 0);
  if (!Number.isFinite(totalHT) || totalHT < 0) errors.push('Le total HT doit être un nombre positif');

  const totalTTC = Number(data.total_ttc ?? 0);
  if (!Number.isFinite(totalTTC) || totalTTC < 0) errors.push('Le total TTC doit être un nombre positif');

  const observation = typeof data.observation === 'string' ? data.observation.trim() : '';
  const designation = typeof data.designation === 'string' ? data.designation.trim() : '';

  const nombreProduits = data.nombre_produits !== undefined && data.nombre_produits !== null
    ? Number(data.nombre_produits)
    : (Array.isArray(data.details) ? data.details.length : 0);
  if (!Number.isInteger(nombreProduits) || nombreProduits < 0) errors.push('Nombre de produits invalide');

  let montantPaye = Number(data.montant_paye ?? 0);
  if (!Number.isFinite(montantPaye)) montantPaye = 0;
  montantPaye = Math.max(0, Math.min(totalTTC, montantPaye));
  const montantRestant = Math.max(0, totalTTC - montantPaye);

  let statutPaiement;
  if (montantPaye <= 0) statutPaiement = 'Non payé';
  else if (montantPaye >= totalTTC) statutPaiement = 'Payé';
  else statutPaiement = 'Partiel';

  const fraisLivraison = Math.max(0, Number(data.frais_livraison ?? 0));
  const modePaiement = typeof data.mode_paiement === 'string' && data.mode_paiement.trim()
    ? data.mode_paiement.trim()
    : 'Espèces';
  const modalitePaiement = typeof data.modalite_paiement === 'string' && data.modalite_paiement.trim()
    ? data.modalite_paiement.trim()
    : 'Immediat';

  const details = Array.isArray(data.details) ? data.details.map(item => {
    // ⭐ FIX: TVA default = 0 (fa tsy 0.2 fixe)
    const tvaRate = (item?.tva_rate !== undefined && item?.tva_rate !== null && item?.tva_rate !== '')
      ? Number(item.tva_rate)
      : 0;
    return {
      produit_id: Number(item?.produit_id),
      quantite: Number(item?.quantite),
      prix_unitaire: Number(item?.prix_unitaire),
      total: Number(item?.total),
      tva_rate: tvaRate,
    };
  }) : [];

  for (const detail of details) {
    if (!Number.isInteger(detail.produit_id) || detail.produit_id <= 0) errors.push('Produit invalide dans les détails');
    if (!Number.isFinite(detail.quantite) || detail.quantite <= 0) errors.push(`Quantité invalide pour le produit ${detail.produit_id}`);
    if (!Number.isFinite(detail.prix_unitaire) || detail.prix_unitaire < 0) errors.push(`Prix invalide pour le produit ${detail.produit_id}`);
    if (!Number.isFinite(detail.total) || detail.total < 0) errors.push(`Total invalide pour le produit ${detail.produit_id}`);
  }

  if (details.length === 0) errors.push('Aucun produit sélectionné');

  return {
    valid: errors.length === 0,
    errors,
    data: {
      reference,
      fournisseur_id: fournisseurId,
      date_achat: dateAchat,
      total_ht: totalHT,
      total_ttc: totalTTC,
      statut_paiement: statutPaiement,
      montant_paye: montantPaye,
      montant_restant: montantRestant,
      observation,
      designation,
      nombre_produits: nombreProduits,
      details,
      frais_livraison: fraisLivraison,
      mode_paiement: modePaiement,
      modalite_paiement: modalitePaiement,
    },
  };
}

module.exports = { validateAchat, normalizeDate, getLocalDateISO };