'use strict';
const VALID_STATUSES = ['actif', 'inactif', 'en_conge', 'licencie'];
const STATUS_LABELS = { actif: 'Actif', inactif: 'Inactif', en_conge: 'En congé', licencie: 'Licencié' };

function normalizeStatus(status) {
  if (!status) return 'actif';
  const map = {
    Actif: 'actif', actif: 'actif',
    Inactif: 'inactif', inactif: 'inactif',
    'En congé': 'en_conge', en_conge: 'en_conge', 'en conge': 'en_conge', 'en congé': 'en_conge',
    Licencié: 'licencie', licencie: 'licencie',
  };
  return map[status] || 'actif';
}

function validateEmploye(data) {
  const errors = [];
  const nom = data.nom?.trim() || '';
  const prenom = data.prenom?.trim() || '';
  const email = data.email?.trim().toLowerCase() || '';
  const telephone = data.telephone?.trim() || null;
  const poste = data.poste?.trim() || '';
  const departement = data.departement?.trim() || null;
  const date_embauche = data.date_embauche || null;
  const salaire = Number(data.salaire) || 0;
  // ⭐⭐⭐ VAOVAO: Mampiasa normalizeStatus fa tsy toLowerCase() ⭐⭐⭐
  const status = normalizeStatus(data.status);
  
  // ⭐ CNaPS, OSTIE, IRSA (optionnels, 0 par défaut)
  const cnaps = Math.max(0, Number(data.cnaps) || 0);
  const ostie = Math.max(0, Number(data.ostie) || 0);
  const irsa = Math.max(0, Number(data.irsa) || 0);

  if (!nom) errors.push('Le nom est obligatoire');
  else if (nom.length < 2) errors.push('Le nom doit contenir au moins 2 caractères');
  else if (nom.length > 100) errors.push('Le nom ne peut pas dépasser 100 caractères');

  if (!prenom) errors.push('Le prénom est obligatoire');
  else if (prenom.length < 2) errors.push('Le prénom doit contenir au moins 2 caractères');
  else if (prenom.length > 100) errors.push('Le prénom ne peut pas dépasser 100 caractères');

  if (!email) errors.push("L'email est obligatoire");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Format d'email invalide");

  if (telephone) {
    if (telephone.length < 10 || telephone.length > 20) errors.push('Le numéro de téléphone doit contenir entre 10 et 20 caractères');
    if (!/^[0-9+\s\-()]+$/.test(telephone)) errors.push('Format de téléphone invalide');
  }

  if (!poste) errors.push('Le poste est obligatoire');
  if (salaire < 0) errors.push('Le salaire doit être un nombre positif');
  if (date_embauche) {
    const d = new Date(date_embauche);
    if (isNaN(d.getTime())) errors.push("Format de date d'embauche invalide");
    if (d > new Date()) errors.push("La date d'embauche ne peut pas être dans le futur");
  }

  return {
    valid: errors.length === 0,
    errors,
    data: { nom, prenom, email, telephone, poste, departement, date_embauche, salaire, cnaps, ostie, irsa, status },
  };
}

module.exports = { VALID_STATUSES, STATUS_LABELS, normalizeStatus, validateEmploye };