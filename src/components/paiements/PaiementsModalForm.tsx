// ============================================================
// src/components/paiements/PaiementsModalForm.tsx
// LIFE'S ART ERP — GESTION DES PAIEMENTS EMPLOYÉS (MADAGASCAR)
// ⭐ MODE COMPLET / SIMPLIFIÉ
// ⭐ Design aligné sur ParametresPaieModal.tsx
// ⭐ FIX: Charge les paramètres depuis la DB (taux CNaPS/OSTIE/IRSA)
// ⭐ FIX: 1 paiement par mois/mpiasa — WarningModal automatique
// ⭐ FIX: defaultDate prop ampiasaina amin'ny useRef (HMR fix)
// ⭐ FONT SIZE: h2 18px, h3 15px, labels 14px, inputs 15px, buttons 15px
// ⭐ NEW: Section "4. Totaux" full width (col-span-full) UNIQUEMENT en mode simplifié
// ⭐ NEW: Bouton Fermer → icon X
// ⭐ NEW: Toggle "Mode Complet / Simplifié" ao anaty modal (afaka ovaina)
// ⭐ NEW: initialMois/initialAnnee props — handray ny période avy amin'ny calendar
// ============================================================

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2, Save, X, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import WarningModal from '../common/WarningModal';

// ============================================================
// TYPES
// ============================================================

export type PaiementStatut = 'Brouillon' | 'Payé' | 'Non payé';
export type ModePaiement = 'Espèces' | 'Virement' | 'Chèque' | 'Mobile Money' | 'Carte' | 'Autre';
export type PayrollMode = 'complet' | 'simplifie';

export interface PaiementEmploye {
  id?: number;
  employe_id: number;
  mois: number;
  annee: number;
  montant: number;
  salaire_base?: number;
  salaire_brut?: number;
  heures_sup?: number;
  heures_sup_montant?: number;
  prime_anciennete?: number;
  prime_logement?: number;
  prime_cherte_vie?: number;
  indemnite_transport?: number;
  autres_primes?: number;
  cnaps?: number;
  ostie?: number;
  irsa?: number;
  avance?: number;
  absences_deduction?: number;
  autres_retenues?: number;
  net_imposable?: number;
  cumul_gains?: number;
  cumul_retenues?: number;
  cumul_net?: number;
  mode_paiement?: string;
  statut?: string;
  reference?: string | null;
  observation?: string | null;
  date_paiement?: string | null;
  cnaps_actif?: boolean;
  ostie_actif?: boolean;
  irsa_actif?: boolean;
  employe_nom?: string | null;
  employe_prenom?: string | null;
  employe_poste?: string | null;
}

export interface EmployePaiement {
  id: number;
  nom?: string;
  prenom?: string;
  poste?: string;
  salaire?: number;
  salaire_base?: number;
  cnaps?: number;
  ostie?: number;
  irsa?: number;
}

interface PayrollParams {
  cnaps_taux: number;
  cnaps_plafond: number;
  cnaps_base: string;
  ostie_taux: number;
  ostie_plafond: number;
  ostie_base: string;
  irsa_bareme: Array<{ min: number; max: number | null; taux: number }>;
  irsa_base: string;
  irsa_exoneration: number;
  heures_normales_mois: number;
  jours_ouvrables_mois: number;
  taux_heure_sup: number;
}

const DEFAULT_PAYROLL_PARAMS: PayrollParams = {
  cnaps_taux: 1,
  cnaps_plafond: 1_600_000,
  cnaps_base: 'brut',
  ostie_taux: 1,
  ostie_plafond: 1_600_000,
  ostie_base: 'brut',
  irsa_bareme: [
    { min: 0,      max: 350_000, taux: 0 },
    { min: 350_000, max: 400_000, taux: 5 },
    { min: 400_000, max: 500_000, taux: 10 },
    { min: 500_000, max: 600_000, taux: 15 },
    { min: 600_000, max: 700_000, taux: 20 },
    { min: 700_000, max: null,   taux: 25 },
  ],
  irsa_base: 'net_imposable',
  irsa_exoneration: 0,
  heures_normales_mois: 173.33,
  jours_ouvrables_mois: 26,
  taux_heure_sup: 1.25,
};

interface PaiementsModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  employes?: EmployePaiement[];
  paiement?: PaiementEmploye | null;
  editingPaiement?: PaiementEmploye | null;
  employeId?: number | null;
  // ⭐ VAOVAO: mois/annee initial (avy amin'ny calendar)
  initialMois?: number;
  initialAnnee?: number;
  onSuccess?: (paiement: PaiementEmploye) => void | Promise<void>;
  payrollMode?: PayrollMode;
  defaultDate?: string | null;
  onExistingPayment?: (existingId: number) => void;
}

// ============================================================
// CONSTANTES
// ============================================================

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MODES_PAIEMENT: ModePaiement[] = ['Espèces','Virement','Chèque','Mobile Money','Carte','Autre'];

const STATUS_STYLES: Record<PaiementStatut, { light: { bg: string; text: string; border: string }; dark: { bg: string; text: string; border: string } }> = {
  Brouillon: {
    light: { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' },
    dark: { bg: 'rgba(148,163,184,.15)', text: '#94A3B8', border: 'rgba(148,163,184,.3)' },
  },
  Payé: {
    light: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
    dark: { bg: 'rgba(34,197,94,.15)', text: '#4ADE80', border: 'rgba(34,197,94,.3)' },
  },
  'Non payé': {
    light: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
    dark: { bg: 'rgba(239,68,68,.15)', text: '#F87171', border: 'rgba(239,68,68,.3)' },
  },
};

// ============================================================
// UTILITAIRES
// ============================================================

function getLocalDateISO(date = new Date()): string {
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function normalizeDateISO(value?: string | null): string {
  if (!value) return getLocalDateISO();
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return getLocalDateISO();
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatAriary(value: unknown): string {
  return `${Math.round(toNumber(value)).toLocaleString('fr-FR')} Ar`;
}

function getEmployeeName(employee?: EmployePaiement): string {
  if (!employee) return '';
  return `${employee.prenom ?? ''} ${employee.nom ?? ''}`.trim();
}

function computePaymentStatus(workflow: 'Brouillon' | 'Validé', montant: number): PaiementStatut {
  if (workflow === 'Brouillon') return 'Brouillon';
  return montant > 0 ? 'Payé' : 'Non payé';
}

function parseBackendError(raw: string): { code?: string; message?: string; details?: any } | null {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text.startsWith('{')) return null;
  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj === 'object') return obj;
    return null;
  } catch { return null; }
}

function calculateIRSA(baseImposable: number, params: PayrollParams): number {
  if (baseImposable <= 0) return 0;
  const base = Math.max(0, baseImposable - toNumber(params.irsa_exoneration));
  const tranches = Array.isArray(params.irsa_bareme) ? params.irsa_bareme : [];

  let irsa = 0;
  for (const t of tranches) {
    const max = t.max == null ? Infinity : Number(t.max);
    const min = Number(t.min || 0);
    const taux = Number(t.taux || 0) / 100;
    if (base > min) {
      const taxable = Math.min(base, max) - min;
      if (taxable > 0) irsa += taxable * taux;
    }
  }
  return Math.round(irsa);
}

function calculateCNaPS(salaireBrut: number, params: PayrollParams): number {
  const taux = toNumber(params.cnaps_taux) / 100;
  const plafond = toNumber(params.cnaps_plafond) || 1_600_000;
  const base = Math.min(Math.max(0, salaireBrut), plafond);
  return Math.round(base * taux);
}

function calculateOSTIE(salaireBrut: number, params: PayrollParams): number {
  const taux = toNumber(params.ostie_taux) / 100;
  const plafond = toNumber(params.ostie_plafond) || 1_600_000;
  const base = Math.min(Math.max(0, salaireBrut), plafond);
  return Math.round(base * taux);
}

// ============================================================
// COMPOSANT
// ============================================================

export default function PaiementsModalForm({
  isOpen, onClose, employes = [], paiement = null, editingPaiement = null,
  employeId = null,
  initialMois,       // ⭐ VAOVAO
  initialAnnee,      // ⭐ VAOVAO
  onSuccess, payrollMode = 'complet',
  defaultDate = null,
  onExistingPayment,
}: PaiementsModalFormProps) {
  const { isDark } = useTheme();
  const effectivePaiement = paiement ?? editingPaiement ?? null;
  const isEdit = Boolean(effectivePaiement?.id);
  const today = useMemo(() => getLocalDateISO(), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // ⭐ VAOVAO: localPayrollMode — afaka ovaina ao anaty modal
  const [localPayrollMode, setLocalPayrollMode] = useState<PayrollMode>(payrollMode);
  const isSimplifie = localPayrollMode === 'simplifie';

  // ⭐ Sync rehefa misokatra ny modal
  useEffect(() => {
    if (isOpen) setLocalPayrollMode(payrollMode);
  }, [isOpen, payrollMode]);

  const [payrollParams, setPayrollParams] = useState<PayrollParams>(DEFAULT_PAYROLL_PARAMS);

  const [existingPayment, setExistingPayment] = useState<{
    id?: number; count: number; total: number; statut?: string; montant?: number;
  } | null>(null);
  const [isDuplicateWarningOpen, setIsDuplicateWarningOpen] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const [selectedEmployeId, setSelectedEmployeId] = useState<number | ''>('');
  const [mois, setMois] = useState<number>(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState<number>(currentYear);
  const [datePaiement, setDatePaiement] = useState<string>(today);

  const [salaireBase, setSalaireBase] = useState<number>(0);
  const [heuresSup, setHeuresSup] = useState<number>(0);
  const [heuresSupMontant, setHeuresSupMontant] = useState<number>(0);
  const [primeAnciennete, setPrimeAnciennete] = useState<number>(0);
  const [primeLogement, setPrimeLogement] = useState<number>(0);
  const [primeCherteVie, setPrimeCherteVie] = useState<number>(0);
  const [indemniteTransport, setIndemniteTransport] = useState<number>(0);
  const [autresPrimes, setAutresPrimes] = useState<number>(0);

  const [cnaps, setCnaps] = useState<number>(0);
  const [ostie, setOstie] = useState<number>(0);
  const [irsa, setIrsa] = useState<number>(0);
  const [avance, setAvance] = useState<number>(0);
  const [absencesDeduction, setAbsencesDeduction] = useState<number>(0);
  const [autresRetenues, setAutresRetenues] = useState<number>(0);

  const [cnapsActif, setCnapsActif] = useState<boolean>(false);
  const [ostieActif, setOstieActif] = useState<boolean>(false);
  const [irsaActif, setIrsaActif] = useState<boolean>(false);

  const [montant, setMontant] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<string>('Espèces');
  const [statut, setStatut] = useState<PaiementStatut>('Brouillon');
  const [reference, setReference] = useState('');
  const [observation, setObservation] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState<'Brouillon' | 'Validé'>('Brouillon');
  const [userEditedMontant, setUserEditedMontant] = useState(false);

  const [isEmployeDropdownOpen, setIsEmployeDropdownOpen] = useState(false);
  const [isMoisDropdownOpen, setIsMoisDropdownOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  const [warning, setWarning] = useState<{ open: boolean; title: string; message: string; details: string; }>({ open: false, title: '', message: '', details: '' });

  const selectedEmploye = useMemo(() => {
    if (!selectedEmployeId) return undefined;
    return employes.find((e) => Number(e.id) === Number(selectedEmployeId));
  }, [employes, selectedEmployeId]);

  const bg = isDark ? '#0F172A' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0';
  const inputBg = isDark ? '#0A1222' : '#FFFFFF';
  const text = isDark ? '#F8FAFC' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';

  const inputStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    borderColor: border,
    color: text,
  };

  const defaultDateRef = useRef<string | null>(defaultDate);

  useEffect(() => {
    defaultDateRef.current = defaultDate;
  }, [defaultDate]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const res = await (window as any).api?.parametresPaie?.get?.();
        if (res?.success && res.data) {
          setPayrollParams({
            cnaps_taux: toNumber(res.data.cnaps_taux, DEFAULT_PAYROLL_PARAMS.cnaps_taux),
            cnaps_plafond: toNumber(res.data.cnaps_plafond, DEFAULT_PAYROLL_PARAMS.cnaps_plafond),
            cnaps_base: String(res.data.cnaps_base || 'brut'),
            ostie_taux: toNumber(res.data.ostie_taux, DEFAULT_PAYROLL_PARAMS.ostie_taux),
            ostie_plafond: toNumber(res.data.ostie_plafond, DEFAULT_PAYROLL_PARAMS.ostie_plafond),
            ostie_base: String(res.data.ostie_base || 'brut'),
            irsa_bareme: Array.isArray(res.data.irsa_bareme) && res.data.irsa_bareme.length > 0
              ? res.data.irsa_bareme
              : DEFAULT_PAYROLL_PARAMS.irsa_bareme,
            irsa_base: String(res.data.irsa_base || 'net_imposable'),
            irsa_exoneration: toNumber(res.data.irsa_exoneration, 0),
            heures_normales_mois: toNumber(res.data.heures_normales_mois, DEFAULT_PAYROLL_PARAMS.heures_normales_mois),
            jours_ouvrables_mois: toNumber(res.data.jours_ouvrables_mois, DEFAULT_PAYROLL_PARAMS.jours_ouvrables_mois),
            taux_heure_sup: toNumber(res.data.taux_heure_sup, DEFAULT_PAYROLL_PARAMS.taux_heure_sup),
          });
        }
      } catch (e) {
        console.warn('[PaiementsModalForm] load payroll params:', e);
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) { setExistingPayment(null); setIsDuplicateWarningOpen(false); return; }
    if (!selectedEmployeId) { setExistingPayment(null); setIsDuplicateWarningOpen(false); return; }

    let cancelled = false;
    setIsCheckingDuplicate(true);

    const timer = setTimeout(async () => {
      try {
        const api = (window as any).api?.payments;
        if (!api?.getSalaireMensuel) {
          if (!cancelled) { setExistingPayment(null); setIsCheckingDuplicate(false); }
          return;
        }

        const response = await api.getSalaireMensuel(
          Number(selectedEmployeId),
          Number(mois),
          Number(annee)
        );
        if (cancelled) return;

        const count = Number(
          response?.data?.nombre_paiements ||
          response?.nombre_paiements ||
          0
        );
        const total = Number(
          response?.data?.total_paye ||
          response?.data?.montant ||
          response?.total_paye ||
          0
        );

        if (count > 0) {
          const existingId =
            response?.data?.existing_id ||
            response?.data?.id ||
            response?.existing_id ||
            response?.id;

          if (isEdit && effectivePaiement?.id && Number(existingId) === Number(effectivePaiement.id)) {
            if (!cancelled) { setExistingPayment(null); setIsDuplicateWarningOpen(false); }
            return;
          }

          if (!cancelled) {
            setExistingPayment({
              id: existingId ? Number(existingId) : undefined,
              count,
              total,
              statut: response?.data?.statut || response?.statut,
              montant: total,
            });
            setIsDuplicateWarningOpen(true);
          }
        } else {
          if (!cancelled) { setExistingPayment(null); setIsDuplicateWarningOpen(false); }
        }
      } catch (err) {
        console.warn('[PaiementsModalForm] check duplicate:', err);
        if (!cancelled) setExistingPayment(null);
      } finally {
        if (!cancelled) setIsCheckingDuplicate(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, selectedEmployeId, mois, annee, isEdit, effectivePaiement]);

  const calcul = useMemo(() => {
    const base = Math.max(0, toNumber(salaireBase));
    const hs = isSimplifie ? 0 : Math.max(0, toNumber(heuresSupMontant));
    const pa = isSimplifie ? 0 : Math.max(0, toNumber(primeAnciennete));
    const pl = isSimplifie ? 0 : Math.max(0, toNumber(primeLogement));
    const pcv = isSimplifie ? 0 : Math.max(0, toNumber(primeCherteVie));
    const it = isSimplifie ? 0 : Math.max(0, toNumber(indemniteTransport));
    const ap = isSimplifie ? 0 : Math.max(0, toNumber(autresPrimes));
    const brutTotal = base + hs + pa + pl + pcv + it + ap;

    const retenueCnaps = (!isSimplifie && cnapsActif) ? Math.min(Math.max(0, toNumber(cnaps)), brutTotal) : 0;
    const retenueOstie = (!isSimplifie && ostieActif) ? Math.min(Math.max(0, toNumber(ostie)), brutTotal) : 0;
    const retenueIrsa  = (!isSimplifie && irsaActif)  ? Math.min(Math.max(0, toNumber(irsa)), brutTotal)  : 0;
    const retenueAvance = Math.max(0, toNumber(avance));
    const retenueAbsences = Math.max(0, toNumber(absencesDeduction));
    const retenueAutres = isSimplifie ? 0 : Math.max(0, toNumber(autresRetenues));

    const totalRetenues = retenueCnaps + retenueOstie + retenueIrsa + retenueAvance + retenueAbsences + retenueAutres;
    const net = Math.max(0, brutTotal - totalRetenues);
    const netImposable = Math.max(0, brutTotal - retenueCnaps - retenueOstie);

    return {
      salaireBase: base, hsMontant: hs,
      primeAnciennete: pa, primeLogement: pl, primeCherteVie: pcv,
      indemniteTransport: it, autresPrimes: ap,
      brutTotal,
      retenueCnaps, retenueOstie, retenueIrsa, retenueAvance, retenueAbsences, retenueAutres,
      totalRetenues, net, netImposable,
    };
  }, [
    isSimplifie,
    salaireBase, heuresSupMontant, primeAnciennete, primeLogement, primeCherteVie,
    indemniteTransport, autresPrimes,
    cnaps, ostie, irsa, avance, absencesDeduction, autresRetenues,
    cnapsActif, ostieActif, irsaActif,
  ]);

  const reste = useMemo(() => Math.max(0, calcul.net - toNumber(montant)), [calcul.net, montant]);

  const activeDeductions = useMemo(() => {
    if (isSimplifie) return [];
    const arr: string[] = [];
    if (cnapsActif) arr.push('CNaPS');
    if (ostieActif) arr.push('OSTIE');
    if (irsaActif) arr.push('IRSA');
    return arr;
  }, [cnapsActif, ostieActif, irsaActif, isSimplifie]);

  const hasDuplicate = Boolean(existingPayment && !isEdit);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    setIsEmployeDropdownOpen(false);
    setIsMoisDropdownOpen(false);
    setIsModeDropdownOpen(false);
    setUserEditedMontant(false);
    setWarning({ open: false, title: '', message: '', details: '' });
    setExistingPayment(null);
    setIsDuplicateWarningOpen(false);

    if (effectivePaiement) {
      setSelectedEmployeId(Number(effectivePaiement.employe_id));
      setMois(Math.min(12, Math.max(1, Number(effectivePaiement.mois) || new Date().getMonth()+1)));
      setAnnee(Number(effectivePaiement.annee) || currentYear);
      setDatePaiement(normalizeDateISO(effectivePaiement.date_paiement));

      setSalaireBase(toNumber(effectivePaiement.salaire_base ?? effectivePaiement.salaire_brut));
      setHeuresSup(toNumber(effectivePaiement.heures_sup));
      setHeuresSupMontant(toNumber(effectivePaiement.heures_sup_montant));
      setPrimeAnciennete(toNumber(effectivePaiement.prime_anciennete));
      setPrimeLogement(toNumber(effectivePaiement.prime_logement));
      setPrimeCherteVie(toNumber(effectivePaiement.prime_cherte_vie));
      setIndemniteTransport(toNumber(effectivePaiement.indemnite_transport));
      setAutresPrimes(toNumber(effectivePaiement.autres_primes));

      setCnaps(toNumber(effectivePaiement.cnaps));
      setOstie(toNumber(effectivePaiement.ostie));
      setIrsa(toNumber(effectivePaiement.irsa));
      setAvance(toNumber(effectivePaiement.avance));
      setAbsencesDeduction(toNumber(effectivePaiement.absences_deduction));
      setAutresRetenues(toNumber(effectivePaiement.autres_retenues));

      setMontant(toNumber(effectivePaiement.montant));
      setCnapsActif(effectivePaiement.cnaps_actif !== undefined ? Boolean(effectivePaiement.cnaps_actif) : toNumber(effectivePaiement.cnaps) > 0);
      setOstieActif(effectivePaiement.ostie_actif !== undefined ? Boolean(effectivePaiement.ostie_actif) : toNumber(effectivePaiement.ostie) > 0);
      setIrsaActif(effectivePaiement.irsa_actif !== undefined ? Boolean(effectivePaiement.irsa_actif) : toNumber(effectivePaiement.irsa) > 0);
      setModePaiement(effectivePaiement.mode_paiement || 'Espèces');

      const existingStatus = String(effectivePaiement.statut || '');
      if (existingStatus === 'Brouillon') { setWorkflowStatus('Brouillon'); setStatut('Brouillon'); }
      else { setWorkflowStatus('Validé'); setStatut('Payé'); }

      setReference(effectivePaiement.reference || '');
      setObservation(effectivePaiement.observation || '');
      setUserEditedMontant(true);
      return;
    }

    const now = new Date();
    setSelectedEmployeId(employeId ? Number(employeId) : '');

    // ⭐ FIX: Ampiasao ny initialMois/initialAnnee raha misy, raha tsy misy dia ny ankehitriny
    setMois(
      initialMois && initialMois >= 1 && initialMois <= 12
        ? initialMois
        : (now.getMonth() + 1)
    );
    setAnnee(
      initialAnnee && initialAnnee >= 2000 && initialAnnee <= 2100
        ? initialAnnee
        : now.getFullYear()
    );

    const fallbackDate = defaultDateRef.current;
    if (fallbackDate) {
      setDatePaiement(normalizeDateISO(fallbackDate));
    } else {
      setDatePaiement(getLocalDateISO());
    }

    setSalaireBase(0);
    setHeuresSup(0); setHeuresSupMontant(0);
    setPrimeAnciennete(0); setPrimeLogement(0); setPrimeCherteVie(0);
    setIndemniteTransport(0); setAutresPrimes(0);

    setCnaps(0); setOstie(0); setIrsa(0);
    setAvance(0); setAbsencesDeduction(0); setAutresRetenues(0);
    setMontant(0);

    setCnapsActif(false); setOstieActif(false); setIrsaActif(false);
    setModePaiement('Espèces');
    setWorkflowStatus('Brouillon'); setStatut('Brouillon');
    setReference(''); setObservation('');
    setUserEditedMontant(false);
  }, [isOpen, effectivePaiement, employeId, initialMois, initialAnnee, currentYear]);

  useEffect(() => {
    if (!selectedEmploye || isEdit) return;
    const salary = toNumber(selectedEmploye.salaire_base ?? selectedEmploye.salaire);
    if (salary <= 0) return;
    setSalaireBase(Math.round(salary));
    setUserEditedMontant(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmploye, isEdit]);

  useEffect(() => {
    if (isSimplifie) return;
    if (!cnapsActif && !ostieActif && !irsaActif) return;
    const brut = calcul.brutTotal;
    if (brut <= 0) return;

    if (cnapsActif) setCnaps(calculateCNaPS(brut, payrollParams));
    if (ostieActif) setOstie(calculateOSTIE(brut, payrollParams));

    if (irsaActif) {
      const netImp = brut - calculateCNaPS(brut, payrollParams) - calculateOSTIE(brut, payrollParams);
      setIrsa(calculateIRSA(netImp, payrollParams));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calcul.brutTotal, cnapsActif, ostieActif, irsaActif, isSimplifie, payrollParams]);

  const handleToggleCnaps = useCallback((active: boolean) => {
    setCnapsActif(active);
    if (active && calcul.brutTotal > 0) setCnaps(calculateCNaPS(calcul.brutTotal, payrollParams));
    setUserEditedMontant(false);
  }, [calcul.brutTotal, payrollParams]);

  const handleToggleOstie = useCallback((active: boolean) => {
    setOstieActif(active);
    if (active && calcul.brutTotal > 0) setOstie(calculateOSTIE(calcul.brutTotal, payrollParams));
    setUserEditedMontant(false);
  }, [calcul.brutTotal, payrollParams]);

  const handleToggleIrsa = useCallback((active: boolean) => {
    setIrsaActif(active);
    if (active && calcul.brutTotal > 0) {
      const netImp = calcul.brutTotal - calculateCNaPS(calcul.brutTotal, payrollParams) - calculateOSTIE(calcul.brutTotal, payrollParams);
      setIrsa(calculateIRSA(netImp, payrollParams));
    }
    setUserEditedMontant(false);
  }, [calcul.brutTotal, payrollParams]);

  useEffect(() => {
    if (isEdit || userEditedMontant) return;
    setMontant(Math.max(0, Math.round(calcul.net)));
  }, [isEdit, userEditedMontant, calcul.net]);

  useEffect(() => {
    setStatut(computePaymentStatus(workflowStatus, montant));
  }, [workflowStatus, montant]);

  // ⭐ VAOVAO: Rehefa miova ny mode
  const handleChangeMode = useCallback((newMode: PayrollMode) => {
    if (newMode === localPayrollMode) return;
    setLocalPayrollMode(newMode);

    if (newMode === 'simplifie') {
      // Reset deductions sy primes
      setHeuresSup(0); setHeuresSupMontant(0);
      setPrimeAnciennete(0); setPrimeLogement(0); setPrimeCherteVie(0);
      setIndemniteTransport(0); setAutresPrimes(0);
      setCnaps(0); setOstie(0); setIrsa(0);
      setCnapsActif(false); setOstieActif(false); setIrsaActif(false);
      setAutresRetenues(0);
    }
    setUserEditedMontant(false);
  }, [localPayrollMode]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (!selectedEmployeId) { setErrorMessage('Veuillez sélectionner un employé.'); return; }
    if (!Number.isInteger(mois) || mois < 1 || mois > 12) { setErrorMessage('Le mois de paie est invalide.'); return; }
    if (!Number.isInteger(annee) || annee < 2000 || annee > 2100) { setErrorMessage("L'année de paie est invalide."); return; }
    if (!datePaiement) { setErrorMessage('La date réelle de paiement est obligatoire.'); return; }
    if (montant < 0) { setErrorMessage('Le montant ne peut pas être négatif.'); return; }
    if (workflowStatus === 'Validé' && montant <= 0) { setErrorMessage('Un paiement validé doit avoir un montant supérieur à 0.'); return; }

    if (hasDuplicate) {
      setIsDuplicateWarningOpen(true);
      return;
    }

    const finalStatus = computePaymentStatus(workflowStatus, montant);

    const payload: PaiementEmploye = {
      id: effectivePaiement?.id,
      employe_id: Number(selectedEmployeId),
      mois: Number(mois),
      annee: Number(annee),
      date_paiement: normalizeDateISO(datePaiement),
      salaire_base: Math.round(calcul.salaireBase),
      salaire_brut: Math.round(calcul.brutTotal),
      heures_sup: isSimplifie ? 0 : Math.round(toNumber(heuresSup)),
      heures_sup_montant: Math.round(calcul.hsMontant),
      prime_anciennete: Math.round(calcul.primeAnciennete),
      prime_logement: Math.round(calcul.primeLogement),
      prime_cherte_vie: Math.round(calcul.primeCherteVie),
      indemnite_transport: Math.round(calcul.indemniteTransport),
      autres_primes: Math.round(calcul.autresPrimes),
      cnaps: Math.round(calcul.retenueCnaps),
      ostie: Math.round(calcul.retenueOstie),
      irsa: Math.round(calcul.retenueIrsa),
      avance: Math.round(calcul.retenueAvance),
      absences_deduction: Math.round(calcul.retenueAbsences),
      autres_retenues: Math.round(calcul.retenueAutres),
      net_imposable: Math.round(calcul.netImposable),
      montant: Math.max(0, Math.round(toNumber(montant))),
      mode_paiement: modePaiement || 'Espèces',
      statut: finalStatus,
      reference: reference.trim() || null,
      observation: observation.trim() || null,
      cnaps_actif: cnapsActif,
      ostie_actif: ostieActif,
      irsa_actif: irsaActif,
    };

    try {
      setSaving(true);
      const api = window.api?.payments;
      if (!api) throw new Error('API paiements indisponible.');
      let result: any;
      if (isEdit) {
        if (!effectivePaiement?.id) throw new Error('ID de paiement invalide.');
        result = await api.update(effectivePaiement.id, payload);
      } else {
        if (!api.create) throw new Error('API création paiement indisponible.');
        result = await api.create(payload);
      }
      if (result?.success === false) throw new Error(result?.error || result?.message || 'Impossible d\'enregistrer le paiement.');
      const returned = result?.data && typeof result.data === 'object' ? result.data : { ...payload, id: effectivePaiement?.id ?? result?.id };
      if (onSuccess) await onSuccess(returned as PaiementEmploye);
      onClose();
    } catch (error: any) {
      console.error('[PaiementsModalForm] save:', error);
      const rawMessage = error?.message || '';
      const parsed = parseBackendError(rawMessage);

      if (parsed?.code === 'PAYMENT_ALREADY_EXISTS') {
        const d = parsed.details || {};
        setIsDuplicateWarningOpen(true);
        setExistingPayment({
          id: d.existing_id ? Number(d.existing_id) : undefined,
          count: 1,
          total: Number(d.existing_montant || 0),
          statut: d.existing_statut,
        });
        return;
      }

      setErrorMessage(error?.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally { setSaving(false); }
  };

  const handleClose = () => { if (saving) return; onClose(); };
  const statusStyle = STATUS_STYLES[statut];
  const statusColors = isDark ? statusStyle.dark : statusStyle.light;

  if (!isOpen) return null;

  const duplicateDetails =
    `Employé : ${getEmployeeName(selectedEmploye) || '—'}\n` +
    `Période : ${MONTHS[mois-1]} ${annee}\n` +
    `Nombre de paiements : ${existingPayment?.count || 1}\n` +
    `Montant total payé : ${formatAriary(existingPayment?.total || 0)}\n` +
    (existingPayment?.statut ? `Statut : ${existingPayment.statut}\n` : '') +
    `\nUn seul paiement est autorisé par mois par employé.`;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[80%] flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{ backgroundColor: bg, borderColor: border }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ══════════ HEADER ══════════ */}
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-4" style={{ borderColor: border }}>
          <div>
            <h2 className="text-[18px] font-bold" style={{ color: text }}>
              {isEdit ? 'Modifier le paiement' : 'Nouveau paiement'}
            </h2>
            <p className="text-[13.5px] mt-0.5" style={{ color: muted }}>
              Gestion de paie {isSimplifie ? '(mode simplifié)' : '(Madagascar)'} — période {MONTHS[mois-1]} {annee}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            aria-label="Fermer"
            title="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* ══════════ TOGGLE MODE COMPLET / SIMPLIFIÉ ══════════ */}
        <div className="shrink-0 border-b px-5 py-3" style={{ borderColor: border }}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold" style={{ color: muted }}>
              Mode de calcul
            </span>
            <div
              role="tablist"
              className={`inline-flex items-center rounded-lg border p-1 ${isDark ? 'border-white/[0.12] bg-[#0A1222]' : 'border-slate-200 bg-slate-50'}`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={localPayrollMode === 'complet'}
                onClick={() => handleChangeMode('complet')}
                disabled={isEdit || saving}
                title={isEdit ? 'Non modifiable en édition' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  localPayrollMode === 'complet'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : (isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-600 hover:bg-white')
                }`}
              >
                {localPayrollMode === 'complet' && <Check size={14} strokeWidth={2.5} />}
                Mode Complet
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={localPayrollMode === 'simplifie'}
                onClick={() => handleChangeMode('simplifie')}
                disabled={isEdit || saving}
                title={isEdit ? 'Non modifiable en édition' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  localPayrollMode === 'simplifie'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : (isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-600 hover:bg-white')
                }`}
              >
                {localPayrollMode === 'simplifie' && <Check size={14} strokeWidth={2.5} />}
                Mode Simplifié
              </button>
            </div>
          </div>
          <p className="mt-2 text-[12px] leading-[1.4]" style={{ color: muted }}>
            {localPayrollMode === 'complet'
              ? 'CNaPS, OSTIE, IRSA, primes sy heures sup. misy — kajy ara-dalàna.'
              : 'Net = Salaire brut − Avance − Absences. Aucun CNaPS/OSTIE/IRSA.'}
          </p>
        </div>

        {/* ══════════ FORM ══════════ */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-5">

            {errorMessage && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[15px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            {hasDuplicate && (
              <div className="mb-4 rounded-lg border-2 border-red-300 bg-red-50 px-3.5 py-2.5 dark:border-red-500/40 dark:bg-red-500/[0.10]">
                <p className="text-[14px] font-bold text-red-800 dark:text-red-300">
                  ⚠️ Paiement déjà existant
                </p>
                <p className="mt-0.5 text-[13px] leading-[1.4] text-red-700 dark:text-red-400">
                  Un paiement existe déjà pour <strong>{getEmployeeName(selectedEmploye) || 'cet employé'}</strong> en <strong>{MONTHS[mois-1]} {annee}</strong>.
                  Un seul paiement est autorisé par mois.
                </p>
                {existingPayment?.id && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onExistingPayment && existingPayment.id) {
                        onExistingPayment(existingPayment.id);
                      }
                      handleClose();
                    }}
                    className="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-[13.5px] font-semibold text-white hover:bg-red-700"
                  >
                    Consulter le paiement existant
                  </button>
                )}
              </div>
            )}

            <div className={`grid grid-cols-1 gap-4 ${isSimplifie ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-4'}`}>

              {/* ══ COLONNE 1 : Employé & Période ══ */}
              <section className="rounded-xl border p-4" style={{ borderColor: border }}>
                <h3 className="mb-3 text-[15px] font-bold" style={{ color: text }}>
                  1. Employé & Période
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[14px] font-semibold" style={{ color: muted }}>Employé</label>
                    <div className="relative">
                      <button
                        type="button"
                        disabled={isEdit}
                        onClick={() => setIsEmployeDropdownOpen((v) => !v)}
                        className="flex h-11 w-full items-center justify-between rounded-lg border px-3.5 text-left text-[15px] outline-none focus:border-indigo-500 disabled:opacity-70"
                        style={inputStyle}
                      >
                        <span className="truncate">{getEmployeeName(selectedEmploye) || 'Sélectionner un employé'}</span>
                        <ChevronDown size={17} strokeWidth={2.2} className="shrink-0 text-slate-400" />
                      </button>
                      {isEmployeDropdownOpen && (
                        <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border shadow-xl" style={{ backgroundColor: bg, borderColor: border }}>
                          <button type="button" onClick={() => { setSelectedEmployeId(''); setIsEmployeDropdownOpen(false); }} className="w-full px-3.5 py-2.5 text-left text-[15px] hover:bg-slate-100 dark:hover:bg-white/[0.06]" style={{ color: text }}>Sélectionner</button>
                          {employes.map((employee) => (
                            <button key={employee.id} type="button" onClick={() => { setSelectedEmployeId(employee.id); setIsEmployeDropdownOpen(false); setUserEditedMontant(false); }} className={`w-full px-3.5 py-2.5 text-left text-[15px] transition hover:bg-slate-100 dark:hover:bg-white/[0.06] ${Number(selectedEmployeId) === Number(employee.id) ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : ''}`} style={{ color: Number(selectedEmployeId) === Number(employee.id) ? undefined : text }}>
                              {getEmployeeName(employee) || `Employé #${employee.id}`}{employee.poste ? ` — ${employee.poste}` : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedEmploye && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 dark:border-indigo-500/25 dark:bg-indigo-500/10">
                      <p className="text-[15px] font-semibold" style={{ color: text }}>{getEmployeeName(selectedEmploye)}</p>
                      <p className="mt-0.5 text-[13px] leading-[1.3]" style={{ color: muted }}>{selectedEmploye.poste || 'Poste non renseigné'}</p>
                      <p className="mt-1 text-[15px] font-semibold text-indigo-600 dark:text-indigo-400">{formatAriary(selectedEmploye.salaire_base ?? selectedEmploye.salaire)}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[14px] font-semibold" style={{ color: muted }}>Mois</label>
                      <div className="relative">
                        <button type="button" onClick={() => setIsMoisDropdownOpen((v) => !v)} className="flex h-11 w-full items-center justify-between rounded-lg border px-3.5 text-left text-[15px] outline-none focus:border-indigo-500" style={inputStyle}>
                          <span>{MONTHS[mois-1]}</span>
                          <ChevronDown size={17} strokeWidth={2.2} className="text-slate-400" />
                        </button>
                        {isMoisDropdownOpen && (
                          <div className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-lg border shadow-xl" style={{ backgroundColor: bg, borderColor: border }}>
                            {MONTHS.map((month, index) => (
                              <button key={month} type="button" onClick={() => { setMois(index+1); setIsMoisDropdownOpen(false); }} className={`w-full px-3.5 py-2.5 text-left text-[15px] hover:bg-slate-100 dark:hover:bg-white/[0.06] ${mois === index+1 ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : ''}`} style={{ color: mois === index+1 ? undefined : text }}>{month}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[14px] font-semibold" style={{ color: muted }}>Année</label>
                      <input type="number" min={2000} max={2100} value={annee} onChange={(e) => setAnnee(Number(e.target.value))} className="h-11 w-full rounded-lg border px-3.5 text-[15px] outline-none focus:border-indigo-500" style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[14px] font-semibold" style={{ color: muted }}>Date réelle de paiement</label>
                    <input type="date" value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} className="h-11 w-full rounded-lg border px-3.5 text-[15px] outline-none focus:border-indigo-500" style={inputStyle} />
                  </div>

                  <div>
                    <label className="mb-1 block text-[14px] font-semibold" style={{ color: muted }}>Mode de paiement</label>
                    <div className="relative">
                      <button type="button" onClick={() => setIsModeDropdownOpen((v) => !v)} className="flex h-11 w-full items-center justify-between rounded-lg border px-3.5 text-left text-[15px] outline-none focus:border-indigo-500" style={inputStyle}>
                        <span>{modePaiement}</span>
                        <ChevronDown size={17} strokeWidth={2.2} className="text-slate-400" />
                      </button>
                      {isModeDropdownOpen && (
                        <div className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-lg border shadow-xl" style={{ backgroundColor: bg, borderColor: border }}>
                          {MODES_PAIEMENT.map((mode) => (
                            <button key={mode} type="button" onClick={() => { setModePaiement(mode); setIsModeDropdownOpen(false); }} className={`w-full px-3.5 py-2.5 text-left text-[15px] hover:bg-slate-100 dark:hover:bg-white/[0.06] ${modePaiement === mode ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : ''}`} style={{ color: modePaiement === mode ? undefined : text }}>{mode}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[14px] font-semibold" style={{ color: muted }}>Référence</label>
                    <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° transaction..." className="h-11 w-full rounded-lg border px-3.5 text-[15px] outline-none focus:border-indigo-500" style={inputStyle} />
                  </div>
                </div>
              </section>

              {/* ══ COLONNE 2 : GAINS ══ */}
              <section className="rounded-xl border p-4" style={{ borderColor: border }}>
                <h3 className="mb-3 text-[15px] font-bold" style={{ color: text }}>
                  2. Gains
                </h3>
                <div className="space-y-3">
                  <NumField label="Salaire de base" value={salaireBase} onChange={(v) => { setSalaireBase(v); setUserEditedMontant(false); }} inputStyle={inputStyle} muted={muted} />

                  {!isSimplifie && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <NumField label="Heures sup." value={heuresSup} onChange={(v) => setHeuresSup(v)} inputStyle={inputStyle} muted={muted} />
                        <NumField label="Montant HS" value={heuresSupMontant} onChange={(v) => { setHeuresSupMontant(v); setUserEditedMontant(false); }} inputStyle={inputStyle} muted={muted} />
                      </div>
                      <NumField label="Prime d'ancienneté" value={primeAnciennete} onChange={(v) => { setPrimeAnciennete(v); setUserEditedMontant(false); }} inputStyle={inputStyle} muted={muted} />
                      <NumField label="Prime de logement" value={primeLogement} onChange={(v) => { setPrimeLogement(v); setUserEditedMontant(false); }} inputStyle={inputStyle} muted={muted} />
                      <NumField label="Prime de cherté de vie" value={primeCherteVie} onChange={(v) => { setPrimeCherteVie(v); setUserEditedMontant(false); }} inputStyle={inputStyle} muted={muted} />
                      <NumField label="Indemnité transport" value={indemniteTransport} onChange={(v) => { setIndemniteTransport(v); setUserEditedMontant(false); }} inputStyle={inputStyle} muted={muted} />
                      <NumField label="Autres primes" value={autresPrimes} onChange={(v) => { setAutresPrimes(v); setUserEditedMontant(false); }} inputStyle={inputStyle} muted={muted} />
                    </>
                  )}

                  {isSimplifie && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                      <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">Mode simplifié</p>
                      <p className="mt-1 text-[13px] leading-[1.4] text-emerald-600 dark:text-emerald-400">Aucune prime ni heures sup. Seul le salaire de base est pris en compte.</p>
                    </div>
                  )}

                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 dark:border-indigo-500/25 dark:bg-indigo-500/10">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-indigo-700 dark:text-indigo-300">SALAIRE BRUT TOTAL</p>
                      <p className="text-[15px] font-bold text-indigo-700 dark:text-indigo-300">{formatAriary(calcul.brutTotal)}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ══ COLONNE 3 : RETENUES ══ */}
              <section className="rounded-xl border p-4" style={{ borderColor: border }}>
                <h3 className="mb-3 text-[15px] font-bold" style={{ color: text }}>
                  3. Retenues
                </h3>
                <div className="space-y-3">
                  {!isSimplifie ? (
                    <>
                      <MoneyFieldWithToggle
                        label="CNaPS"
                        value={cnaps}
                        onChange={setCnaps}
                        active={cnapsActif}
                        onToggle={handleToggleCnaps}
                        taux={`${payrollParams.cnaps_taux}% · plafond`}
                        inputStyle={inputStyle}
                        muted={muted}
                      />
                      <MoneyFieldWithToggle
                        label="OSTIE"
                        value={ostie}
                        onChange={setOstie}
                        active={ostieActif}
                        onToggle={handleToggleOstie}
                        taux={`${payrollParams.ostie_taux}% · plafond`}
                        inputStyle={inputStyle}
                        muted={muted}
                      />
                      <MoneyFieldWithToggle
                        label="IRSA"
                        value={irsa}
                        onChange={setIrsa}
                        active={irsaActif}
                        onToggle={handleToggleIrsa}
                        taux="barème"
                        inputStyle={inputStyle}
                        muted={muted}
                      />
                      <NumField label="Absences (déduction)" value={absencesDeduction} onChange={(v) => { setAbsencesDeduction(v); setUserEditedMontant(false); }} inputStyle={inputStyle} muted={muted} />
                      <NumField label="Avance" value={avance} onChange={(v) => { setAvance(v); setUserEditedMontant(false); }} inputStyle={inputStyle} muted={muted} />
                      <NumField label="Autres retenues" value={autresRetenues} onChange={(v) => { setAutresRetenues(v); setUserEditedMontant(false); }} inputStyle={inputStyle} muted={muted} />
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                        <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">Aucun CNaPS/OSTIE/IRSA</p>
                        <p className="mt-1 text-[13px] leading-[1.4] text-emerald-600 dark:text-emerald-400">Utilisez le "Mode Complet" pour les activer.</p>
                      </div>
                      <NumField label="Absences (déduction)" value={absencesDeduction} onChange={(v) => { setAbsencesDeduction(v); setUserEditedMontant(false); }} inputStyle={inputStyle} muted={muted} />
                      <NumField label="Avance" value={avance} onChange={(v) => { setAvance(v); setUserEditedMontant(false); }} inputStyle={inputStyle} muted={muted} />
                    </>
                  )}

                  <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 dark:border-red-500/25 dark:bg-red-500/10">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-red-700 dark:text-red-300">TOTAL RETENUES</p>
                      <p className="text-[15px] font-bold text-red-700 dark:text-red-300">- {formatAriary(calcul.totalRetenues)}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ══ COLONNE 4 : TOTAUX ══ */}
              <section
                className={`rounded-xl border p-4 ${isSimplifie ? 'col-span-full' : ''}`}
                style={{ borderColor: border }}
              >
                <h3 className="mb-3 text-[15px] font-bold" style={{ color: text }}>
                  4. Totaux
                </h3>
                <div className={
                  isSimplifie
                    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'space-y-3'
                }>
                  {!isSimplifie && (
                    <div className="rounded-lg border px-3.5 py-2.5" style={{ borderColor: border }}>
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium" style={{ color: muted }}>Net imposable</p>
                        <p className="text-[15px] font-semibold" style={{ color: text }}>{formatAriary(calcul.netImposable)}</p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">NET À PAYER</p>
                      <p className="text-[15px] font-bold text-emerald-700 dark:text-emerald-300">{formatAriary(calcul.net)}</p>
                    </div>
                  </div>

                  <NumField
                    label="Montant effectivement payé"
                    value={montant}
                    onChange={(v: number) => { setMontant(v); setUserEditedMontant(true); }}
                    inputStyle={{ ...inputStyle, borderColor: '#6366F1' }}
                    muted={muted}
                  />

                  {reste > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 dark:border-amber-500/25 dark:bg-amber-500/10">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-amber-700 dark:text-amber-300">Reste à payer</p>
                        <p className="text-[15px] font-bold text-amber-700 dark:text-amber-300">{formatAriary(reste)}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-[14px] font-semibold" style={{ color: muted }}>État du document</label>
                    <div className="relative">
                      <select
                        value={workflowStatus}
                        onChange={(e) => setWorkflowStatus(e.target.value as 'Brouillon' | 'Validé')}
                        className="h-11 w-full appearance-none rounded-lg border px-3.5 text-[15px] outline-none focus:border-indigo-500"
                        style={inputStyle}
                      >
                        <option value="Brouillon">Brouillon</option>
                        <option value="Validé">Validé</option>
                      </select>
                      <ChevronDown size={17} strokeWidth={2.2} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[14px] font-semibold" style={{ color: muted }}>Statut</label>
                    <div className="flex h-11 items-center rounded-lg border px-3.5 text-[15px] font-semibold" style={{ backgroundColor: statusColors.bg, color: statusColors.text, borderColor: statusColors.border }}>{statut}</div>
                  </div>

                  <div className={isSimplifie ? 'sm:col-span-2 lg:col-span-3 xl:col-span-4' : ''}>
                    <label className="mb-1 block text-[14px] font-semibold" style={{ color: muted }}>Observation</label>
                    <textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Note..." rows={3} className="w-full resize-none rounded-lg border px-3.5 py-3 text-[15px] outline-none focus:border-indigo-500" style={{ ...inputStyle, lineHeight: '1.45' }} />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* ══════════ FOOTER ══════════ */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t px-5 py-5" style={{ borderColor: border }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="rounded-lg px-5 py-3 text-[15px] font-semibold disabled:opacity-50"
              style={{ color: muted }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || hasDuplicate || isCheckingDuplicate}
              title={hasDuplicate ? 'Un paiement existe déjà pour cette période' : undefined}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Enregistrement...
                </>
              ) : isCheckingDuplicate ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Save size={17} />
                  {isEdit ? 'Enregistrer' : 'Créer le paiement'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modal, document.body)}

      <WarningModal
        isOpen={isDuplicateWarningOpen}
        onClose={() => setIsDuplicateWarningOpen(false)}
        title="Paiement déjà existant"
        message={`Un paiement existe déjà pour ${getEmployeeName(selectedEmploye) || 'cet employé'} en ${MONTHS[mois-1]} ${annee}.`}
        details={duplicateDetails}
        buttonText="Compris"
        autoCloseDelay={0}
        isDark={isDark}
      />

      <WarningModal
        isOpen={warning.open}
        onClose={() => setWarning({ open: false, title: '', message: '', details: '' })}
        title={warning.title}
        message={warning.message}
        details={warning.details}
        buttonText="Compris"
        autoCloseDelay={7000}
        isDark={isDark}
      />
    </>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function NumField({ label, value, onChange, step = 1, inputStyle, muted, placeholder, emphasized = false }: any) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-[14px] font-semibold" style={{ color: muted }}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          placeholder={placeholder}
          className={`h-11 w-full rounded-lg border px-3.5 pr-10 text-[15px] outline-none focus:border-indigo-500 ${emphasized ? 'border-indigo-400' : ''}`}
          style={inputStyle}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold" style={{ color: muted }}>Ar</span>
      </div>
    </div>
  );
}

function MoneyFieldWithToggle({
  label, value, onChange, active, onToggle, taux, inputStyle, muted,
}: any) {
  return (
    <div>
      <label className="mb-1 flex items-center justify-between gap-1">
        <span className="flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: muted }}>
          {label}
          {taux && <span className="text-[12.5px] font-medium" style={{ color: muted }}>({taux})</span>}
        </span>
        <span className={`flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[12.5px] font-semibold transition ${active ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
          <input type="checkbox" checked={active} onChange={(e) => onToggle(e.target.checked)} className="h-3.5 w-3.5 cursor-pointer accent-indigo-600" />
          Actif
        </span>
      </label>
      <div className="relative">
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          disabled={!active}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className={`h-11 w-full rounded-lg border px-3.5 pr-10 text-[15px] outline-none focus:border-indigo-500 transition-opacity ${!active ? 'opacity-50' : ''}`}
          style={inputStyle}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold" style={{ color: muted }}>Ar</span>
      </div>
    </div>
  );
}