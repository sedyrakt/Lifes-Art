// electron/ipc/achats/validation.cjs — ACHATS VALIDATION (FIXED TVA)
'use strict';

function normalizeDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  return parsed.toISOString().split('T')[0];
}

function validateAchat(data = {}) {
  const errors = [];

  const reference = typeof data.reference === 'string' ? data.reference.trim() : '';

  const fournisseurId = data.fournisseur_id !== undefined && data.fournisseur_id !== null && data.fournisseur_id !== ''
    ? Number(data.fournisseur_id) : null;

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

  // ⭐ NEW: TVA OVERRIDE
  const tvaOverride = (data.tva_rate !== undefined && data.tva_rate !== null && data.tva_rate !== '') 
    ? Number(data.tva_rate) 
    : null;

  const details = Array.isArray(data.details)
    ? data.details.map(item => {
        const tvaRate = (tvaOverride !== null) ? tvaOverride : (Number(item?.tva_rate) || 0.2);
        return {
          produit_id: Number(item?.produit_id),
          quantite: Number(item?.quantite),
          prix_unitaire: Number(item?.prix_unitaire),
          total: Number(item?.total),
          tva_rate: tvaRate // ⭐ MANDEFA NY RATE
        };
      })
    : [];

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
      reference, fournisseur_id: fournisseurId, date_achat: dateAchat,
      total_ht: totalHT, total_ttc: totalTTC, statut_paiement: statutPaiement,
      montant_paye: montantPaye, montant_restant: montantRestant,
      observation, designation, nombre_produits: nombreProduits, details,
      tva_rate: tvaOverride // ⭐ NEW
    }
  };
}

module.exports = { validateAchat };