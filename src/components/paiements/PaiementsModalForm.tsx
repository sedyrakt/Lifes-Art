import React, { FormEvent, useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, Save, X, ChevronDown, Clock, TrendingUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export type PaiementStatut = 'Brouillon' | 'Payé' | 'Partiel' | 'Non payé';
export type ModePaiement = 'Espèces' | 'Virement' | 'Chèque' | 'Mobile Money' | 'Carte' | 'Autre';
export interface PaiementEmploye {
  id?: number; employe_id: number; mois: number; annee: number; montant: number;
  mode_paiement?: string; statut?: string; reference?: string | null; observation?: string | null;
  salaire_brut?: number; cnaps?: number; ostie?: number; irsa?: number; avance?: number;
  absences_deduction?: number;
  date_paiement?: string | null; created_at?: string | null;
  employe_nom?: string | null; employe_prenom?: string | null; employe_poste?: string | null; salaire_base?: number | null;
}
export interface EmployePaiement { id: number; nom?: string; prenom?: string; poste?: string; salaire?: number; salaire_base?: number; }
interface PaiementsModalFormProps {
  isOpen: boolean; onClose: () => void; employes?: EmployePaiement[];
  paiement?: PaiementEmploye | null; employeId?: number | null;
  onSuccess?: (paiement: PaiementEmploye) => void | Promise<void>;
  presenceData?: { jours_absences?: number; jours_conges?: number; heures_sup?: number; retards?: number; } | null;
  allPaiements?: PaiementEmploye[]; // ⭐ NOVAINA: Mba hanaovana fisafoana eo an-toerana
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MODES_PAIEMENT: ModePaiement[] = ['Espèces','Virement','Chèque','Mobile Money','Carte','Autre'];

const STATUT_STYLES: Record<string, { light: { bg: string; text: string; border: string }; dark: { bg: string; text: string; border: string } }> = {
  'Brouillon': { light: { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' }, dark: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)' } },
  'Payé': { light: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' }, dark: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' } },
  'Partiel': { light: { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' }, dark: { bg: 'rgba(234, 179, 8, 0.15)', text: '#FACC15', border: 'rgba(234, 179, 8, 0.3)' } },
  'Non payé': { light: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' }, dark: { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' } }
};

function getLocalDateISO(date = new Date()): string { const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
function normalizeDateISO(value?: string | null): string { if (!value) return getLocalDateISO(); const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/); if (match) return `${match[1]}-${match[2]}-${match[3]}`; return getLocalDateISO(); }
function toNumber(value: unknown, fallback = 0): number { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function formatAriary(value: unknown): string { return `${Math.round(toNumber(value)).toLocaleString('fr-FR')} Ar`; }
function getEmployeeName(employee?: EmployePaiement): string { if (!employee) return ''; return `${employee.prenom ?? ''} ${employee.nom ?? ''}`.trim(); }

export default function PaiementsModalForm({ isOpen, onClose, employes = [], paiement = null, employeId = null, onSuccess, presenceData = null, allPaiements = [] }: PaiementsModalFormProps) {
  const { isDark } = useTheme(); 
  const isEdit = Boolean(paiement?.id);
  const today = useMemo(() => getLocalDateISO(), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [selectedEmployeId, setSelectedEmployeId] = useState<number | ''>('');
  const [mois, setMois] = useState<number>(new Date().getMonth()+1);
  const [annee, setAnnee] = useState<number>(currentYear);
  const [datePaiement, setDatePaiement] = useState<string>(today);
  const [salaireBrut, setSalaireBrut] = useState<number>(0);
  const [cnaps, setCnaps] = useState<number>(0);
  const [ostie, setOstie] = useState<number>(0);
  const [irsa, setIrsa] = useState<number>(0);
  const [avance, setAvance] = useState<number>(0);
  const [montant, setMontant] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<string>('Espèces');
  const [statut, setStatut] = useState<PaiementStatut>('Payé');
  const [reference, setReference] = useState<string>('');
  const [observation, setObservation] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [workflowStatus, setWorkflowStatus] = useState<'Brouillon' | 'Validé'>('Brouillon');
  
  // ⭐ NOVAINA: Tsy misy absencesDeduction state intsony, kajy lokal amin'ny useMemo
  const [absencesCount, setAbsencesCount] = useState(0);
  const [retards, setRetards] = useState(0);
  const [heuresSup, setHeuresSup] = useState(0);

  const [isEmployeDropdownOpen, setIsEmployeDropdownOpen] = useState(false);
  const [isMoisDropdownOpen, setIsMoisDropdownOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  const selectedEmploye = useMemo(() => { if (!selectedEmployeId) return undefined; return employes.find(employee => Number(employee.id) === Number(selectedEmployeId)); }, [employes, selectedEmployeId]);

  const hsMontant = useMemo(() => { if (heuresSup <= 0) return 0; return Math.round((toNumber(salaireBrut) / 173.33) * 1.25 * heuresSup); }, [salaireBrut, heuresSup]);

  // ⭐ KAJY LOKALY (Tsy miandry API intsony)
  const absencesDeduction = useMemo(() => {
    if (absencesCount > 0 && salaireBrut > 0) return Math.round((salaireBrut / 26) * absencesCount);
    return 0;
  }, [absencesCount, salaireBrut]);

  const bruteAvecHS = useMemo(() => toNumber(salaireBrut) + hsMontant, [salaireBrut, hsMontant]);
  const retenues = useMemo(() => toNumber(cnaps)+toNumber(ostie)+toNumber(irsa)+absencesDeduction, [cnaps, ostie, irsa, absencesDeduction]);
  const netAvantAvance = useMemo(() => Math.max(0, bruteAvecHS - retenues), [bruteAvecHS, retenues]);
  const netApresAvance = useMemo(() => Math.max(0, netAvantAvance - toNumber(avance)), [netAvantAvance, avance]);

  // ⭐ FAHAINGANANA: fetch Absences tsy misy dependency an'ny salaire
  const fetchAbsences = useCallback(async (empId: number, m: number, a: number) => {
    try {
      if (window.api?.payments?.getAbsencesCount) {
        const res = await window.api.payments.getAbsencesCount(empId, m, a);
        if (res?.success) {
          setAbsencesCount(Number(res.data.count || 0));
          setRetards(Number(res.data.retards || 0));
          setHeuresSup(Number(res.data.heures_sup || 0));
        }
      }
    } catch (e) {
      console.error('Erreur fetchAbsences:', e);
      setAbsencesCount(0); setRetards(0); setHeuresSup(0);
    }
  }, []); // ⭐ TENA ZAVA-DEHIBE: TSY MISY FETCH MIREPETRA!

  useEffect(() => {
    if (selectedEmployeId && mois && annee) fetchAbsences(Number(selectedEmployeId), mois, annee);
  }, [selectedEmployeId, mois, annee, fetchAbsences]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    
    if (paiement) {
      setSelectedEmployeId(Number(paiement.employe_id));
      setMois(Math.min(12, Math.max(1, Number(paiement.mois) || new Date().getMonth()+1)));
      setAnnee(Number(paiement.annee) || currentYear);
      setDatePaiement(normalizeDateISO(paiement.date_paiement));
      setSalaireBrut(toNumber(paiement.salaire_brut));
      setCnaps(toNumber(paiement.cnaps));
      setOstie(toNumber(paiement.ostie));
      setIrsa(toNumber(paiement.irsa));
      setAvance(toNumber(paiement.avance));
      setMontant(toNumber(paiement.montant));
      setModePaiement(paiement.mode_paiement || 'Espèces');
      setStatut((paiement.statut as PaiementStatut) || 'Payé');
      setReference(paiement.reference || '');
      setObservation(paiement.observation || '');
      if (paiement.employe_id && paiement.mois && paiement.annee) fetchAbsences(paiement.employe_id, paiement.mois, paiement.annee);
      return;
    }

    setSelectedEmployeId(employeId ? Number(employeId) : '');
    const now = new Date();
    setMois(now.getMonth()+1);
    setAnnee(now.getFullYear());
    setDatePaiement(getLocalDateISO());
    setSalaireBrut(0); setCnaps(0); setOstie(0); setIrsa(0); setAvance(0); setMontant(0);
    setModePaiement('Espèces'); setStatut('Payé'); setReference(''); setObservation('');
    setWorkflowStatus('Brouillon');
    setAbsencesCount(0); setRetards(0); setHeuresSup(0);

    if (employeId) {
      const emp = employes.find(e => Number(e.id) === Number(employeId));
      if (emp) handleSelectEmploye(emp);
    }
  }, [isOpen, paiement, employeId, currentYear]);

  const handleSelectEmploye = (employee: EmployePaiement) => {
    setSelectedEmployeId(employee.id);
    setIsEmployeDropdownOpen(false);
    
    const salary = toNumber(employee.salaire_base ?? employee.salaire);
    if (salary > 0) {
      setSalaireBrut(salary);
      const cnapsValue = salary * 0.01, ostieValue = salary * 0.05;
      let irsaValue = 0;
      if (salary <= 400_000) irsaValue = 0;
      else if (salary <= 500_000) irsaValue = (salary - 400_000) * 0.05;
      else if (salary <= 600_000) irsaValue = 100_000*0.05 + (salary - 500_000)*0.10;
      else if (salary <= 700_000) irsaValue = 100_000*0.05 + 100_000*0.10 + (salary - 600_000)*0.15;
      else irsaValue = 100_000*0.05 + 100_000*0.10 + 100_000*0.15 + (salary - 700_000)*0.20;
      setCnaps(Math.round(cnapsValue));
      setOstie(Math.round(ostieValue));
      setIrsa(Math.round(irsaValue));
      setMontant(Math.max(0, Math.round(salary - cnapsValue - ostieValue - irsaValue)));
    } else {
      setSalaireBrut(0); setCnaps(0); setOstie(0); setIrsa(0); setMontant(0);
      setErrorMessage("⚠️ Tsy misy salaire voafaritra ho an'ity employé ity.");
    }
  };

  useEffect(() => {
    if (isEdit || (salaireBrut <= 0 && retenues <= 0)) return;
    setMontant(Math.max(0, Math.round(bruteAvecHS - retenues - toNumber(avance))));
  }, [bruteAvecHS, retenues, avance, isEdit]);

  useEffect(() => {
    if (workflowStatus === 'Brouillon') { setStatut('Brouillon'); return; }
    const net = netApresAvance;
    if (net <= 0) setStatut(montant > 0 ? 'Payé' : 'Non payé');
    else if (montant <= 0) setStatut('Non payé');
    else if (montant >= net) setStatut('Payé');
    else setStatut('Partiel');
  }, [workflowStatus, montant, netApresAvance]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    if (!selectedEmployeId) { setErrorMessage('Veuillez sélectionner un employé.'); return; }
    if (!Number.isInteger(mois) || mois < 1 || mois > 12) { setErrorMessage('Le mois de paie est invalide.'); return; }
    if (!Number.isInteger(annee) || annee < 2000 || annee > 2100) { setErrorMessage("L'année de paie est invalide."); return; }
    if (!datePaiement) { setErrorMessage('La date réelle de paiement est obligatoire.'); return; }
    if (montant < 0) { setErrorMessage('Le montant ne peut pas être négatif.'); return; }

    // ⭐ FISAFOANA LOKALY (FAINGANA) fa tsy miantso API
    const existingPayment = allPaiements.find(p => p.employe_id === Number(selectedEmployeId) && p.mois === Number(mois) && p.annee === Number(annee));
    if (!isEdit && existingPayment) {
      setErrorMessage(`Un paiement existe déjà pour ${getEmployeeName(selectedEmploye) || 'cet employé'} pour ${MONTHS[mois-1]} ${annee}.`);
      return;
    }

    const payload = {
      id: paiement?.id, employe_id: Number(selectedEmployeId),
      mois: Number(mois), annee: Number(annee),
      date_paiement: normalizeDateISO(datePaiement),
      salaire_brut: Math.round(toNumber(salaireBrut)),
      cnaps: Math.round(toNumber(cnaps)), ostie: Math.round(toNumber(ostie)),
      irsa: Math.round(toNumber(irsa)), avance: Math.round(toNumber(avance)),
      absences_deduction: Math.round(absencesDeduction),
      montant: Math.round(toNumber(montant)),
      mode_paiement: modePaiement || 'Espèces',
      statut: statut || 'Payé',
      reference: reference.trim() || null,
      observation: observation.trim() || null,
      absences_count: absencesCount,
      retards: retards,
      heures_sup: heuresSup
    };
    try {
      setSaving(true);
      if (!window.api?.payments) throw new Error('API paiements indisponible.');
      let result: any;
      if (isEdit) {
        const paymentId = payload.id;
        if (!paymentId) throw new Error('ID de paiement invalide');
        result = await window.api.payments.update(paymentId, payload);
      } else {
        result = await window.api.payments.create(payload);
      }
      const responseData = result?.data ?? result;
      if (result?.success === false) throw new Error(result?.error || result?.message || 'Impossible d’enregistrer le paiement.');
      const returnedPayment = responseData && typeof responseData === 'object' ? responseData : { ...payload, id: paiement?.id ?? responseData };
      if (onSuccess) await onSuccess(returnedPayment as PaiementEmploye);
      onClose();
    } catch (error: any) {
      console.error('[PaiementsModalForm] save error:', error);
      setErrorMessage(error?.message || 'Une erreur est survenue lors de l’enregistrement.');
    } finally { setSaving(false); }
  };

  const handleClose = () => { if (saving) return; onClose(); };
  if (!isOpen) return null;

  const statusStyle = STATUT_STYLES[statut] || STATUT_STYLES['Non payé'];
  const statusColors = isDark ? statusStyle.dark : statusStyle.light;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onMouseDown={event => { if (event.target === event.currentTarget) handleClose(); }}>
      <div className="w-full max-w-[70%] max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/[0.08]">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">{isEdit ? 'Modifier le paiement' : 'Nouveau paiement'}</h2>
            <p className="text-[14px] text-slate-500 dark:text-slate-400">Gestion de paie</p>
          </div>
          <button type="button" onClick={handleClose} disabled={saving} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition disabled:opacity-50"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {errorMessage && <div className="col-span-1 md:col-span-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">{errorMessage}</div>}

            <div className="space-y-3">
              <div>
                <label className="field-label">Employé</label>
                <div className="relative">
                  <button type="button" onClick={() => setIsEmployeDropdownOpen(!isEmployeDropdownOpen)} className="field-input flex items-center justify-between text-left" disabled={isEdit}>
                    <span className="truncate">{getEmployeeName(selectedEmploye) || 'Sélectionner'}</span>
                    <ChevronDown size={16} className="shrink-0 text-slate-400" />
                  </button>
                  {isEmployeDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-lg">
                      <button type="button" onClick={() => { setSelectedEmployeId(''); setIsEmployeDropdownOpen(false); }} className="w-full px-3 py-2 text-left text-[14px] hover:bg-slate-100 dark:hover:bg-white/[0.06]">Sélectionner</button>
                      {employes.map(employee => (
                        <button key={employee.id} type="button" onClick={() => handleSelectEmploye(employee)} className={`w-full px-3 py-2 text-left text-[14px] hover:bg-slate-100 dark:hover:bg-white/[0.06] ${selectedEmployeId === employee.id ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : ''}`}>
                          {getEmployeeName(employee)}{employee.poste ? ` — ${employee.poste}` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedEmploye && (
                <div className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-4 py-3">
                  <p className="text-[15px] font-semibold text-slate-900 dark:text-white">{getEmployeeName(selectedEmploye)}</p>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">{selectedEmploye.poste || '—'}</p>
                  <p className="text-[15px] font-bold text-brand-600 dark:text-brand-400 mt-1">{formatAriary(selectedEmploye.salaire_base ?? selectedEmploye.salaire)}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Mois</label>
                  <div className="relative">
                    <button type="button" onClick={() => setIsMoisDropdownOpen(!isMoisDropdownOpen)} className="field-input flex items-center justify-between text-left">
                      <span>{MONTHS[mois-1]}</span><ChevronDown size={16} className="shrink-0 text-slate-400" />
                    </button>
                    {isMoisDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-lg">
                        {MONTHS.map((month, index) => (
                          <button key={month} type="button" onClick={() => { setMois(index+1); setIsMoisDropdownOpen(false); }} className={`w-full px-3 py-2 text-left text-[14px] hover:bg-slate-100 dark:hover:bg-white/[0.06] ${mois === index+1 ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : ''}`}>{month}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="field-label">Année</label>
                  <input type="number" min={2000} max={2100} value={annee} onChange={event => setAnnee(Number(event.target.value))} className="field-input" />
                </div>
              </div>

              <div>
                <label className="field-label">Date paiement</label>
                <input type="date" value={datePaiement} onChange={event => setDatePaiement(event.target.value)} className="field-input" />
              </div>
            </div>

            <div className="space-y-3">
              <MoneyField label="Salaire Brut (Base)" value={salaireBrut} onChange={setSalaireBrut} />
              
              {hsMontant > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                  <span className="flex items-center gap-1"><TrendingUp size={14} /> Heures Supp. ({heuresSup}h)</span>
                  <span className="font-bold">+ {formatAriary(hsMontant)}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <MoneyField label="CNaPS" value={cnaps} onChange={setCnaps} />
                <MoneyField label="OSTIE" value={ostie} onChange={setOstie} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MoneyField label="IRSA" value={irsa} onChange={setIrsa} />
                <MoneyField label="Avance" value={avance} onChange={setAvance} />
              </div>
              
              {(absencesDeduction > 0 || retards > 0) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                  <p className="font-bold">Détections RH:</p>
                  {absencesCount > 0 && <p>⚠️ {absencesCount} jour(s) d'absence(s) — Déduction : {formatAriary(absencesDeduction)}</p>}
                  {retards > 0 && <p className="flex items-center gap-1"><Clock size={12} /> {retards} retard(s) enregistré(s)</p>}
                </div>
              )}

              <MoneyField label="Montant payé" value={montant} onChange={setMontant} emphasized />
              <div className="grid grid-cols-2 gap-3 mt-1">
                <SummaryCard label="Retenues" value={retenues} />
                <SummaryCard label="Net après avance" value={netApresAvance} emphasized />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="field-label">Mode de paiement</label>
                <div className="relative">
                  <button type="button" onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)} className="field-input flex items-center justify-between text-left">
                    <span>{modePaiement}</span><ChevronDown size={16} className="shrink-0 text-slate-400" />
                  </button>
                  {isModeDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-lg">
                      {MODES_PAIEMENT.map(mode => (
                        <button key={mode} type="button" onClick={() => { setModePaiement(mode); setIsModeDropdownOpen(false); }} className={`w-full px-3 py-2 text-left text-[14px] hover:bg-slate-100 dark:hover:bg-white/[0.06] ${modePaiement === mode ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : ''}`}>{mode}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="field-label">État</label>
                <div className="relative">
                  <select value={workflowStatus} onChange={(e) => setWorkflowStatus(e.target.value as 'Brouillon' | 'Validé')} className="field-input appearance-none cursor-pointer">
                    <option value="Brouillon">Brouillon</option>
                    <option value="Validé">Validé</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="field-label">Statut (Automatique)</label>
                <div className="relative">
                  <select value={statut} disabled style={{ backgroundColor: statusColors.bg, color: statusColors.text, borderColor: statusColors.border }} className="field-input appearance-none cursor-not-allowed font-bold">
                    <option value="Brouillon">Brouillon</option>
                    <option value="Payé">Payé</option>
                    <option value="Partiel">Partiel</option>
                    <option value="Non payé">Non payé</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="field-label">Référence</label>
                <input type="text" value={reference} onChange={event => setReference(event.target.value)} placeholder="N° transaction..." className="field-input" />
              </div>
              <div>
                <label className="field-label">Observation</label>
                <input type="text" value={observation} onChange={event => setObservation(event.target.value)} placeholder="Note..." className="field-input" />
              </div>
              <div className="mt-2 text-[14px] text-slate-500 dark:text-slate-400">
                Période comptable : <strong className="text-slate-900 dark:text-white">{MONTHS[mois-1]} {annee}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#0F172A] px-5 py-3">
            <button type="button" onClick={handleClose} disabled={saving} className="h-10 rounded-lg px-4 text-[15px] font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/[0.06] transition">Annuler</button>
            <button type="submit" disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 text-[15px] font-semibold text-white shadow-sm hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 transition">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Enregistrement...</> : <><Save size={15} /> {isEdit ? 'Enregistrer' : 'Créer le paiement'}</>}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .field-label { display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: rgb(100 116 139); }
        .dark .field-label { color: rgb(148 163 184); }
        .field-input { width: 100%; height: 38px; border-radius: 8px; border: 1px solid #E2E8F0; background: white; padding: 0 12px; font-size: 15px; color: #0F172A; outline: none; transition: all 0.15s ease; }
        .field-input:focus { border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.10); }
        .dark .field-input { border-color: rgba(255,255,255,0.12); background: #0F172A; color: #F8FAFC; }
        .dark .field-input:focus { border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.10); }
        .field-input:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function MoneyField({ label, value, onChange, emphasized = false }: { label?: string; value: number; onChange: (value: number) => void; emphasized?: boolean }) {
  return (
    <div>
      {label && <label className="field-label">{label}</label>}
      <div className="relative">
        <input type="number" min={0} step={1} value={value} onChange={event => onChange(Math.max(0, Number(event.target.value) || 0))} className={`field-input pr-10 ${emphasized ? 'border-brand-300 dark:border-brand-500/50' : ''}`} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">Ar</span>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, emphasized = false }: { label: string; value: number; emphasized?: boolean }) {
  return <div className={`rounded-xl border px-4 py-3 ${emphasized ? 'border-brand-200 bg-brand-50 dark:border-brand-500/20 dark:bg-brand-500/10' : 'border-slate-200 bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.03]'}`}>
    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
    <p className={`mt-1 text-[16px] font-bold ${emphasized ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>{formatAriary(value)}</p>
  </div>;
}