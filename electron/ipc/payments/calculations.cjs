// electron/ipc/payments/calculations.cjs
'use strict';

const {
  tableExists, columnExists,
  normalizeMoney, normalizeDecimal, normalizeBoolean,
  firstDayOfMonth, nextMonthStart,
} = require('./helpers.cjs');

const DEFAULT_PLAFOND_COTISATION = 1_600_000;

function calculateIRSA(taxable, parameters) {
  if (!parameters.irsa_actif) return 0;
  const base = Math.max(0, normalizeMoney(taxable) - normalizeMoney(parameters.irsa_exoneration));
  const tranches = Array.isArray(parameters.irsa_tranches) ? parameters.irsa_tranches : [];
  if (!tranches.length) return 0;

  let previous = 0;
  let result = 0;

  for (const tranche of tranches) {
    const limit = tranche.jusqua == null ? Infinity : Number(tranche.jusqua);
    const rate = Number(tranche.taux || 0) / 100;
    const amount = Math.max(0, Math.min(base, limit) - previous);
    if (amount > 0) result += amount * rate;
    if (Number.isFinite(limit) && base <= limit) break;
    previous = limit;
  }

  return normalizeMoney(result);
}

function getAbsencesData(db, employeId, mois, annee) {
  if (!tableExists(db, 'presence_journaliere')) {
    return { count: 0, jours_absences: 0, retards: 0, heures_sup: 0 };
  }

  const start = firstDayOfMonth(mois, annee);
  const end = nextMonthStart(mois, annee);
  const hasRetard = columnExists(db, 'presence_journaliere', 'retard');
  const hasHeuresSup = columnExists(db, 'presence_journaliere', 'heures_sup');

  const retardSql = hasRetard ? `COALESCE(SUM(CASE WHEN COALESCE(retard, 0) > 0 THEN 1 ELSE 0 END), 0)` : '0';
  const hsSql = hasHeuresSup ? `COALESCE(SUM(COALESCE(heures_sup, 0)), 0)` : '0';

  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END), 0) AS jours_absences,
      ${retardSql} AS retards,
      ${hsSql} AS heures_sup
    FROM presence_journaliere
    WHERE employe_id = ? AND date >= ? AND date < ?
  `).get(employeId, start, end);

  return {
    count: Number(row?.jours_absences || 0),
    jours_absences: Number(row?.jours_absences || 0),
    retards: Number(row?.retards || 0),
    heures_sup: Number(row?.heures_sup || 0),
  };
}

function calculatePayroll(input, parameters) {
  // ⭐ MODE SIMPLIFIÉ: tsy misy CNaPS, OSTIE, IRSA, primes
  const modeSimplifie = String(parameters.mode_paie || 'complet').toLowerCase() === 'simplifie';

  const salaireBrut = normalizeMoney(input.salaire_brut ?? input.salaire_base);
  const heuresSup = modeSimplifie ? 0 : normalizeDecimal(input.heures_sup);
  const absencesCount = normalizeDecimal(input.absences_count);
  const avance = normalizeMoney(input.avance);

  // ⭐ Raha simplifié → primes atao 0
  const primeAnciennete = modeSimplifie ? 0 : normalizeMoney(input.prime_anciennete);
  const primeLogement = modeSimplifie ? 0 : normalizeMoney(input.prime_logement);
  const primeCherteVie = modeSimplifie ? 0 : normalizeMoney(input.prime_cherte_vie);
  const indemniteTransport = modeSimplifie ? 0 : normalizeMoney(input.indemnite_transport);
  const autresPrimes = modeSimplifie ? 0 : normalizeMoney(input.autres_primes);
  const autresRetenues = modeSimplifie ? 0 : normalizeMoney(input.autres_retenues);

  const heuresMensuelles =
    normalizeDecimal(input.heures_mensuelles) ||
    normalizeDecimal(parameters.heures_mensuelles) ||
    173.33;

  const majorationHS =
    normalizeDecimal(input.majoration_heures_sup) ||
    normalizeDecimal(parameters.majoration_heures_sup) ||
    1.25;

  const joursMois =
    normalizeDecimal(input.jours_mois) ||
    normalizeDecimal(parameters.jours_mois) ||
    26;

  // ⭐ Raha simplifié → toggles atao false
  const cnapsActif = modeSimplifie ? false : normalizeBoolean(input.cnaps_actif, parameters.cnaps_actif);
  const ostieActif = modeSimplifie ? false : normalizeBoolean(input.ostie_actif, parameters.ostie_actif);
  const irsaActif  = modeSimplifie ? false : normalizeBoolean(input.irsa_actif, parameters.irsa_actif);

  const cnapsTaux = normalizeDecimal(input.cnaps_taux) || normalizeDecimal(parameters.cnaps_taux) || 1;
  const ostieTaux = normalizeDecimal(input.ostie_taux) || normalizeDecimal(parameters.ostie_taux) || 1;

  const cnapsPlafond = normalizeDecimal(parameters.cnaps_plafond) || DEFAULT_PLAFOND_COTISATION;
  const ostiePlafond = normalizeDecimal(parameters.ostie_plafond) || DEFAULT_PLAFOND_COTISATION;

  const absenceActive = normalizeBoolean(input.absence_active, parameters.absence_active);

  // Heures sup
  const heuresSupMontant = (heuresSup > 0 && salaireBrut > 0)
    ? normalizeMoney((salaireBrut / heuresMensuelles) * majorationHS * heuresSup)
    : 0;

  // Brut total (avec primes)
  const brutAvecHS =
    salaireBrut + heuresSupMontant +
    primeAnciennete + primeLogement + primeCherteVie +
    indemniteTransport + autresPrimes;

  // CNaPS plafonné
  const baseCnaps = Math.min(salaireBrut + heuresSupMontant, cnapsPlafond);
  const cnaps = cnapsActif ? normalizeMoney(baseCnaps * (cnapsTaux / 100)) : 0;

  // OSTIE plafonné
  const baseOstie = Math.min(salaireBrut + heuresSupMontant, ostiePlafond);
  const ostie = ostieActif ? normalizeMoney(baseOstie * (ostieTaux / 100)) : 0;

  // Absences
  const absencesDeduction = (absenceActive && absencesCount > 0)
    ? normalizeMoney((salaireBrut / joursMois) * absencesCount)
    : 0;

  // Net imposable
  const netImposable = Math.max(0, brutAvecHS - cnaps - ostie);

  // IRSA
  const irsa = irsaActif ? calculateIRSA(netImposable, { ...parameters, irsa_actif: true }) : 0;

  const totalRetenues = cnaps + ostie + irsa + absencesDeduction + avance + autresRetenues;
  const net = Math.max(0, brutAvecHS - totalRetenues);

  return {
    mode_paie: modeSimplifie ? 'simplifie' : 'complet',
    salaire_base: salaireBrut,
    salaire_brut: brutAvecHS,
    heures_sup: heuresSup,
    heures_sup_montant: heuresSupMontant,
    brut_avec_hs: brutAvecHS,
    prime_anciennete: primeAnciennete,
    prime_logement: primeLogement,
    prime_cherte_vie: primeCherteVie,
    indemnite_transport: indemniteTransport,
    autres_primes: autresPrimes,
    cnaps, ostie, irsa, avance,
    absences_count: absencesCount,
    absences_deduction: absencesDeduction,
    autres_retenues: autresRetenues,
    net_imposable: netImposable,
    total_retenues: totalRetenues,
    net,
    cnaps_actif: cnapsActif,
    ostie_actif: ostieActif,
    irsa_actif: irsaActif,
    cnaps_taux: cnapsTaux,
    ostie_taux: ostieTaux,
    cnaps_plafond: cnapsPlafond,
    ostie_plafond: ostiePlafond,
    heures_mensuelles: heuresMensuelles,
    majoration_heures_sup: majorationHS,
    jours_mois: joursMois,
    absence_active: absenceActive,
  };
}

module.exports = { calculateIRSA, getAbsencesData, calculatePayroll };