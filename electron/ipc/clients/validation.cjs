// ============================================================
// electron/ipc/clients/validation.cjs - VALIDATION (10/10)
// ⭐ FANITSARA: Trim sy toLowerCase ho an'ny email
// ============================================================

const { log } = require('./utils.cjs');

function validateClient(data) {
  const errors = [];
  
  const nom = data.nom?.trim() || '';
  if (!nom) {
    errors.push('Le nom du client est obligatoire');
  } else if (nom.length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  } else if (nom.length > 100) {
    errors.push('Le nom ne peut pas dépasser 100 caractères');
  }

  const email = data.email?.trim()?.toLowerCase() || '';
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('L\'email n\'est pas valide');
    }
    if (email.length > 255) {
      errors.push('L\'email ne peut pas dépasser 255 caractères');
    }
  }

  const telephone = data.telephone?.trim() || '';
  if (telephone && telephone.length > 20) {
    errors.push('Le téléphone ne peut pas dépasser 20 caractères');
  }

  const adresse = data.adresse?.trim() || '';
  if (adresse && adresse.length > 255) {
    errors.push('L\'adresse ne peut pas dépasser 255 caractères');
  }

  const ville = data.ville?.trim() || '';
  if (ville && ville.length > 100) {
    errors.push('La ville ne peut pas dépasser 100 caractères');
  }

  const codePostal = data.code_postal?.trim() || '';
  if (codePostal && codePostal.length > 20) {
    errors.push('Le code postal ne peut pas dépasser 20 caractères');
  }

  const pays = data.pays?.trim() || 'Madagascar';
  if (pays && pays.length > 100) {
    errors.push('Le pays ne peut pas dépasser 100 caractères');
  }

  const type = data.type || 'Particulier';
  if (!['Particulier', 'Entreprise'].includes(type)) {
    errors.push('Le type doit être "Particulier" ou "Entreprise"');
  }

  // ⭐ NESORINA NY image

  return {
    valid: errors.length === 0,
    errors,
    data: {
      nom,
      email: email || null,
      telephone: telephone || null,
      adresse: adresse || null,
      ville: ville || null,
      code_postal: codePostal || null,
      pays,
      type,
    },
  };
}

module.exports = { validateClient };