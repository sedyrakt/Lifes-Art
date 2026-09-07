// ============================================================
// electron/ipc/fournisseurs/validation.cjs - VALIDATION (10/10)
// ⭐ FIX: Nampidirina ny `!data` mialoha ny fanamarinana
// ⭐ FIX: NESORINA NY image
// ============================================================

function validateFournisseur(data) {
  const errors = [];

  // ⭐ ZAVA-DEHIBE: Hamarinina tsara aloha raha misy ilay data
  if (!data) {
    errors.push('Données du fournisseur manquantes');
    return {
      valid: false,
      errors,
      data: {
        nom: '',
        contact: null,
        telephone: null,
        email: null,
        adresse: null,
        // image: null,  // ⭐ NESORINA
      },
    };
  }

  if (!data.nom?.trim()) errors.push('Le nom du fournisseur est obligatoire');
  else if (data.nom.trim().length < 2) errors.push('Le nom doit contenir au moins 2 caractères');
  else if (data.nom.trim().length > 100) errors.push('Le nom ne peut pas dépasser 100 caractères');

  if (data.contact && data.contact.trim() && data.contact.trim().length > 100) {
    errors.push('Le nom du contact ne peut pas dépasser 100 caractères');
  }

  if (data.telephone && data.telephone.trim()) {
    const phone = data.telephone.trim();
    if (phone.length < 10 || phone.length > 20) errors.push('Le numéro de téléphone doit contenir entre 10 et 20 caractères');
    if (!/^[0-9+\s\-()]+$/.test(phone)) errors.push('Format de téléphone invalide (chiffres, +, -, espaces, parenthèses uniquement)');
  }

  if (data.email && data.email.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.push("Format d'email invalide");
    if (data.email.trim().length > 255) errors.push("L'email ne peut pas dépasser 255 caractères");
  }

  if (data.adresse && data.adresse.trim() && data.adresse.trim().length > 500) {
    errors.push("L'adresse ne peut pas dépasser 500 caractères");
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      nom: data.nom?.trim() || '',
      contact: data.contact?.trim() || null,
      telephone: data.telephone?.trim() || null,
      email: data.email?.trim().toLowerCase() || null,
      adresse: data.adresse?.trim() || null,
    },
  };
}

module.exports = { validateFournisseur };