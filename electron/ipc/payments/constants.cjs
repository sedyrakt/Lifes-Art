// electron/ipc/payments/constants.cjs
'use strict';

const PAYMENT_STATUSES = ['Brouillon', 'Payé', 'Non payé'];
const PAYMENT_MODES = ['Espèces', 'Virement', 'Chèque', 'Mobile Money', 'Carte', 'Autre'];
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ⭐ Modes de paie disponibles
const PAYROLL_MODES = ['complet', 'simplifie'];

// ⭐ Paramètres par défaut — LÉGISLATION MALAGASY
const DEFAULT_PAYROLL_PARAMETERS = {
  // ⭐ Mode
  mode_paie: 'complet',  // 'complet' | 'simplifie'

  cnaps_actif: false,
  ostie_actif: false,
  irsa_actif: false,

  // ⭐ Taux SALARIAUX (part employé)
  cnaps_taux: 1,        // 1%
  ostie_taux: 1,        // 1% (part salariale)

  // ⭐ Plafonds (8 × SMIG)
  cnaps_plafond: 1600000,
  ostie_plafond: 1600000,

  cnaps_base: 'brut',
  ostie_base: 'brut',
  irsa_base: 'net_imposable',

  heures_mensuelles: 173.33,
  majoration_heures_sup: 1.25,
  jours_mois: 26,
  absence_active: true,

  irsa_exoneration: 0,
  irsa_tranches: [
    { jusqua: 350000, taux: 0 },
    { jusqua: 400000, taux: 5 },
    { jusqua: 500000, taux: 10 },
    { jusqua: 600000, taux: 15 },
    { jusqua: 700000, taux: 20 },
    { jusqua: null,   taux: 25 },
  ],
};

module.exports = {
  PAYMENT_STATUSES,
  PAYMENT_MODES,
  MONTH_NAMES,
  PAYROLL_MODES,
  DEFAULT_PAYROLL_PARAMETERS,
};