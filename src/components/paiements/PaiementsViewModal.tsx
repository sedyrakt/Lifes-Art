// src/components/paiements/PaiementsViewModal.tsx
// ⭐ FONT SIZE: h2 18px, subtitle 14px, labels 12px, values 15px, buttons 15px

import React, { useEffect, useMemo } from 'react';
import { X, Pencil, Wallet, CalendarDays, UserRound, FileText } from 'lucide-react';
import { parseDateSafe } from './PaiementsUtils';

interface Paiement {
  id?: number | string;
  employe_id?: number | string;
  employe_nom?: string;
  employe_prenom?: string;
  employe_poste?: string;
  client_nom?: string;
  clientNom?: string;
  client?: string;
  nom_client?: string;
  commande_reference?: string;
  commandeReference?: string;
  commande_numero?: string;
  reference?: string;
  reference_paiement?: string;
  numero?: string;
  montant?: number | string;
  montant_paye?: number | string;
  montant_total?: number | string;
  montant_commande?: number | string;
  reste?: number | string;
  reste_a_payer?: number | string;
  mode_paiement?: string;
  modePaiement?: string;
  methode_paiement?: string;
  statut?: string;
  statut_paiement?: string;
  status?: string;
  date_paiement?: string;
  datePaiement?: string;
  created_at?: string;
  createdAt?: string;
  heure?: string;
  mois?: number | string;
  annee?: number | string;
  salaire_brut?: number | string;
  salaire_base?: number | string;
  cnaps?: number | string;
  ostie?: number | string;
  irsa?: number | string;
  cnaps_actif?: boolean | number | string;
  ostie_actif?: boolean | number | string;
  irsa_actif?: boolean | number | string;
  avance?: number | string;
  absences_deduction?: number | string;
  heures_sup?: number | string;
  heures_sup_montant?: number | string;
  absences_count?: number | string;
  jours_absences?: number | string;
  retards?: number | string;
  utilisateur_nom?: string;
  utilisateurNom?: string;
  caissier_nom?: string;
  notes?: string;
  commentaire?: string;
  observation?: string;
}

interface PaiementsViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  paiement: Paiement | null;
  employe?: any;
  historiquePaiements?: any[];
  moisLabels?: string[];
  moisLabelsCourt?: string[];
  getMoisPourAnnee?: (date: string, annee: number, labels?: string[]) => any[];
  onViewHistorique?: () => void;
  onAddPaiement?: () => void;
  onAnnulerPaiement?: (id: number | string) => void;
  onModifier?: () => void;
  isDark?: boolean;
  onPrint?: (paiement: Paiement) => void;
  onDownloadPdf?: (paiement: Paiement) => void;
}

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const number = typeof value === 'number' ? value : Number(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(number) ? number : 0;
};

const formatAriary = (value: unknown): string => {
  const amount = toNumber(value);
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} Ar`;
};

const firstValue = (...values: Array<string | number | null | undefined>): string => {
  const value = values.find((item) => item !== null && item !== undefined && String(item).trim() !== '');
  return value === undefined ? '' : String(value);
};

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = parseDateSafe(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
};

const normalizeStatus = (value?: string | null): string => {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const normalizeMode = (value?: string | null): string => {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const toBoolean = (value: unknown): boolean => {
  if (value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE' || value === 'yes' || value === 'oui') return true;
  return false;
};

const getStatusConfig = (status?: string | null, montant?: number, total?: number, isEmployePayment?: boolean) => {
  const normalized = normalizeStatus(status);

  if (normalized === 'paye' || normalized === 'payee' || normalized === 'paid') {
    return { label: 'Payé', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' };
  }
  if (normalized === 'en_retard' || normalized === 'retard') {
    return { label: 'En retard', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400' };
  }
  if (normalized === 'annule' || normalized === 'annulee' || normalized === 'cancelled') {
    return { label: 'Annulé', className: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-slate-400' };
  }
  if (normalized === 'non_paye' || normalized === 'non paye' || normalized === 'unpaid') {
    return { label: 'Non payé', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400' };
  }
  if (normalized === 'partiel' || normalized === 'partiellement_paye') {
    if (toNumber(montant) > 0) {
      return { label: 'Payé', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' };
    }
    return { label: 'Non payé', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400' };
  }
  if (normalized === '' || normalized === 'en_attente' || normalized === 'en attente' || normalized === 'pending') {
    if (toNumber(montant) <= 0) {
      return { label: 'Non payé', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400' };
    }
    return { label: 'Payé', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' };
  }

  return {
    label: status && String(status).trim() ? status : toNumber(montant) > 0 ? 'Payé' : 'Non payé',
    className: toNumber(montant) > 0
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
      : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400',
  };
};

const getPaymentModeLabel = (mode?: string | null): string => {
  const normalized = normalizeMode(mode);
  if (normalized.includes('mvola') || normalized.includes('mobile') || normalized.includes('yas') || normalized.includes('telma') || normalized.includes('orange money') || normalized.includes('airtel money')) return mode || 'Mobile Money';
  if (normalized.includes('espece') || normalized.includes('cash') || normalized.includes('liquide')) return mode || 'Espèces';
  if (normalized.includes('carte') || normalized.includes('card')) return mode || 'Carte';
  if (normalized.includes('virement') || normalized.includes('bank') || normalized.includes('banque')) return mode || 'Virement';
  if (normalized.includes('cheque') || normalized.includes('chèque')) return mode || 'Chèque';
  if (normalized.includes('autre')) return mode || 'Autre';
  return mode || '—';
};

// ⭐ InfoItem : label 10px → 12px, value 13px → 15px, padding px-3 py-2 → px-3.5 py-2.5
const InfoItem: React.FC<{ label: string; value: React.ReactNode; accent?: boolean; }> = ({ label, value, accent = false }) => (
  <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 dark:border-white/[0.08] dark:bg-[#0F172A]">
    <div className="mb-0.5 text-[12px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</div>
    <div className={`truncate text-[15px] font-semibold ${accent ? 'text-[#4F46E5] dark:text-[#818CF8]' : 'text-slate-700 dark:text-slate-200'}`}>{value}</div>
  </div>
);

const DeductionItem: React.FC<{ label: string; amount: number; active?: boolean; }> = ({ label, amount, active = false }) => {
  if (!active && amount <= 0) return null;
  return <InfoItem label={label} value={formatAriary(amount)} />;
};

const PaiementsViewModal: React.FC<PaiementsViewModalProps> = ({
  isOpen, onClose, paiement, employe, historiquePaiements, moisLabels, moisLabelsCourt, getMoisPourAnnee,
  onViewHistorique, onAddPaiement, onAnnulerPaiement, onModifier, isDark, onPrint, onDownloadPdf,
}) => {
  const data = useMemo(() => {
    if (!paiement) return null;
    const isEmployePayment = paiement.employe_id !== undefined && paiement.employe_id !== null && paiement.employe_id !== '';
    const date = firstValue(paiement.date_paiement, paiement.datePaiement, paiement.created_at, paiement.createdAt);
    const montant = toNumber(paiement.montant_paye ?? paiement.montant ?? 0);
    const salaireBrut = toNumber(paiement.salaire_brut);
    const total = isEmployePayment ? salaireBrut : toNumber(paiement.montant_total ?? paiement.montant_commande ?? 0);
    const resteRaw = paiement.reste_a_payer ?? paiement.reste;
    const reste = resteRaw !== null && resteRaw !== undefined && resteRaw !== '' ? toNumber(resteRaw) : Math.max(total - montant, 0);
    const status = firstValue(paiement.statut_paiement, paiement.statut, paiement.status);
    const mode = firstValue(paiement.mode_paiement, paiement.modePaiement, paiement.methode_paiement);
    const reference = firstValue(paiement.reference_paiement, paiement.reference, paiement.numero);
    const client = firstValue(paiement.client_nom, paiement.clientNom, paiement.nom_client, paiement.client);
    const commande = firstValue(paiement.commande_reference, paiement.commandeReference, paiement.commande_numero);
    const utilisateur = firstValue(paiement.utilisateur_nom, paiement.utilisateurNom, paiement.caissier_nom);
    const employeNom = firstValue(paiement.employe_nom, employe?.nom);
    const employePrenom = firstValue(paiement.employe_prenom, employe?.prenom);
    const employeFullName = `${employePrenom} ${employeNom}`.trim();
    const employePoste = firstValue(paiement.employe_poste, employe?.poste);
    const mois = toNumber(paiement.mois);
    const annee = toNumber(paiement.annee);
    const periodeLabel = mois && annee ? `${String(mois).padStart(2, '0')}/${annee}` : '—';
    const cnaps = toNumber(paiement.cnaps);
    const ostie = toNumber(paiement.ostie);
    const irsa = toNumber(paiement.irsa);
    const avance = toNumber(paiement.avance);
    const absencesDeduction = toNumber(paiement.absences_deduction);
    const heuresSup = toNumber(paiement.heures_sup);
    const heuresSupMontant = toNumber(paiement.heures_sup_montant);
    const absencesCount = toNumber(paiement.absences_count ?? paiement.jours_absences);
    const retards = toNumber(paiement.retards);
    const cnapsActif = toBoolean(paiement.cnaps_actif) || cnaps > 0;
    const ostieActif = toBoolean(paiement.ostie_actif) || ostie > 0;
    const irsaActif = toBoolean(paiement.irsa_actif) || irsa > 0;
    const totalRetenues = cnaps + ostie + irsa + avance + absencesDeduction;
    const brutAvecHS = salaireBrut + heuresSupMontant;
    const netCalcule = Math.max(0, brutAvecHS - totalRetenues);
    const netAPayer = paiement.montant !== undefined && paiement.montant !== null && paiement.montant !== '' ? toNumber(paiement.montant) : netCalcule;

    return {
      isEmployePayment, date, formattedDate: formatDate(date), montant, total, reste, status, mode, reference, client, commande, utilisateur,
      notes: firstValue(paiement.notes, paiement.commentaire, paiement.observation),
      employeFullName: employeFullName || '—', employePoste: employePoste || '—', periodeLabel,
      salaireBrut, cnaps, ostie, irsa, cnapsActif, ostieActif, irsaActif, avance, absencesDeduction,
      heuresSup, heuresSupMontant, absencesCount, retards, totalRetenues, brutAvecHS, netCalcule, netAPayer,
    };
  }, [paiement, employe]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  if (!isOpen || !paiement || !data) return null;

  const statusConfig = getStatusConfig(data.status, data.montant, data.total, data.isEmployePayment);
  const paymentModeLabel = getPaymentModeLabel(data.mode);

  const deductionCount =
    Number(data.cnapsActif) + Number(data.ostieActif) + Number(data.irsaActif) +
    Number(data.avance > 0) + Number(data.absencesDeduction > 0);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 backdrop-blur-[3px] sm:p-5"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paiement-view-title"
        className="relative flex w-full max-w-2xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.10] dark:bg-[#0F172A]"
      >
        {/* HEADER — ⭐ px-4 py-3 → px-5 py-3.5, h-9 w-9 → h-10 w-10 */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-3.5 dark:border-white/[0.08] dark:bg-[#0F172A]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {/* ⭐ Icon container : h-9 w-9 → h-10 w-10, icon h-4 w-4 → h-5 w-5 */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] dark:bg-[#4F46E5]/15 dark:text-[#818CF8]">
                {data.isEmployePayment ? <UserRound className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                {/* ⭐ h2 : 15px → 18px */}
                <h2 id="paiement-view-title" className="truncate text-[18px] font-bold text-slate-800 dark:text-white">
                  {data.isEmployePayment ? 'Détail du paiement employé' : 'Détail du paiement'}
                </h2>
                {/* ⭐ Subtitle : 11px → 14px */}
                <p className="mt-0.5 truncate text-[14px] text-slate-400">
                  {data.reference ? `Réf. ${data.reference}` : data.isEmployePayment ? data.employeFullName : 'Transaction de paiement'}
                </p>
              </div>
            </div>
            {/* ⭐ Close button : h-8 w-8 → h-10 w-10, icon h-4 w-4 → h-5 w-5 */}
            <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* CONTENT — ⭐ p-4 sm:p-5 */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="space-y-3">
            {/* MAIN AMOUNT — ⭐ padding p-4 → p-5, label 10px → 12px, value 25px → 28px, subtext 11px → 13px, badge 11px → 13px */}
            <div className="rounded-xl border border-[#4F46E5]/15 bg-[#4F46E5]/[0.04] p-5 dark:border-[#4F46E5]/20 dark:bg-[#4F46E5]/[0.06]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                    {data.isEmployePayment ? 'Net à payer' : 'Montant payé'}
                  </div>
                  <div className="text-[28px] font-bold leading-none tracking-tight text-[#4F46E5] dark:text-[#818CF8]">
                    {formatAriary(data.montant)}
                  </div>
                  {data.isEmployePayment && data.salaireBrut > 0 && (
                    <div className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
                      Brut{data.heuresSupMontant > 0 ? ' + heures supplémentaires' : ''} :{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{formatAriary(data.brutAvecHS)}</span>
                    </div>
                  )}
                  {!data.isEmployePayment && data.total > 0 && (
                    <div className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
                      Total commande : <span className="font-semibold text-slate-700 dark:text-slate-200">{formatAriary(data.total)}</span>
                    </div>
                  )}
                </div>
                {/* ⭐ Status badge : 11px → 13px, px-3 py-1 → px-3.5 py-1.5 */}
                <div className={`inline-flex w-fit items-center rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${statusConfig.className}`}>
                  {statusConfig.label}
                </div>
              </div>
            </div>

            {/* BASIC INFORMATION */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {data.isEmployePayment ? (
                <>
                  <InfoItem label="Employé" value={data.employeFullName || '—'} />
                  <InfoItem label="Poste" value={data.employePoste || '—'} />
                  <InfoItem label="Période" value={data.periodeLabel} />
                </>
              ) : (
                <>
                  <InfoItem label="Client" value={data.client || 'Client non renseigné'} />
                  <InfoItem label="Commande" value={data.commande || 'Sans commande'} />
                  <InfoItem label="Enregistré par" value={data.utilisateur || '—'} />
                </>
              )}
              <InfoItem label="Mode" value={paymentModeLabel} accent />
              <InfoItem label="Date paiement" value={data.formattedDate} />
              <InfoItem label="Référence" value={data.reference || 'Non renseignée'} />
            </div>

            {/* EMPLOYEE PAYROLL */}
            {data.isEmployePayment && (
              <div className="space-y-3">
                {/* SALARY — ⭐ padding p-3 → p-4, icon container h-7 w-7 → h-9 w-9, icon h-3.5 → h-[18px], title 12px → 15px, subtitle 10px → 12.5px */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#0F172A]">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5]/10 text-[#4F46E5] dark:bg-[#4F46E5]/15 dark:text-[#818CF8]">
                      <Wallet className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Rémunération</div>
                      <div className="text-[12.5px] text-slate-400">Détail du calcul salarial</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <InfoItem label="Salaire brut" value={formatAriary(data.salaireBrut)} />
                    {data.heuresSup > 0 && <InfoItem label="Heures supplémentaires" value={`${data.heuresSup} h`} />}
                    {data.heuresSupMontant > 0 && <InfoItem label="Montant heures sup." value={formatAriary(data.heuresSupMontant)} />}
                  </div>
                </div>

                {/* DEDUCTIONS — ⭐ padding + fontSize nampitomboina */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#0F172A]">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                        <FileText className="h-[18px] w-[18px]" />
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Retenues et déductions</div>
                        <div className="text-[12.5px] text-slate-400">Seules les retenues appliquées sont affichées</div>
                      </div>
                    </div>
                    {/* ⭐ Badge : 10px → 12px, px-2 py-0.5 → px-2.5 py-1 */}
                    {deductionCount > 0 && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-semibold text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400">
                        {deductionCount} retenue{deductionCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {deductionCount === 0 ? (
                    /* ⭐ Empty : 11px → 14px, px-3 py-3 → px-4 py-4 */
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center text-[14px] text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">
                      Aucune retenue sociale ou fiscale appliquée.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <DeductionItem label="CNaPS" amount={data.cnaps} active={data.cnapsActif} />
                      <DeductionItem label="OSTIE" amount={data.ostie} active={data.ostieActif} />
                      <DeductionItem label="IRSA" amount={data.irsa} active={data.irsaActif} />
                      {data.avance > 0 && <InfoItem label="Avance" value={formatAriary(data.avance)} />}
                      {data.absencesDeduction > 0 && <InfoItem label="Déduction absences" value={formatAriary(data.absencesDeduction)} />}
                    </div>
                  )}
                </div>

                {/* PRESENCE SUMMARY — ⭐ padding + fontSize nampitomboina */}
                {(data.absencesCount > 0 || data.retards > 0 || data.heuresSup > 0) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.06]">
                    <div className="mb-3 flex items-center gap-2">
                      <CalendarDays className="h-[18px] w-[18px] text-amber-600 dark:text-amber-400" />
                      <div className="text-[15px] font-bold text-amber-800 dark:text-amber-300">Présence et temps de travail</div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {data.absencesCount > 0 && (
                        <div className="rounded-lg border border-amber-200/80 bg-white/70 px-3.5 py-2.5 dark:border-amber-500/20 dark:bg-black/10">
                          {/* ⭐ Label : 10px → 12px, value 14px → 15px */}
                          <div className="text-[12px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Absences</div>
                          <div className="mt-0.5 text-[15px] font-bold text-amber-800 dark:text-amber-200">{data.absencesCount} jour{data.absencesCount > 1 ? 's' : ''}</div>
                        </div>
                      )}
                      {data.retards > 0 && (
                        <div className="rounded-lg border border-amber-200/80 bg-white/70 px-3.5 py-2.5 dark:border-amber-500/20 dark:bg-black/10">
                          <div className="text-[12px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Retards</div>
                          <div className="mt-0.5 text-[15px] font-bold text-amber-800 dark:text-amber-200">{data.retards}</div>
                        </div>
                      )}
                      {data.heuresSup > 0 && (
                        <div className="rounded-lg border border-amber-200/80 bg-white/70 px-3.5 py-2.5 dark:border-amber-500/20 dark:bg-black/10">
                          <div className="text-[12px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Heures sup.</div>
                          <div className="mt-0.5 text-[15px] font-bold text-amber-800 dark:text-amber-200">{data.heuresSup} h</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* NET RECAP — ⭐ padding p-3 → p-4, note 10px → 12.5px */}
                <div className="rounded-xl border border-[#4F46E5]/20 bg-[#4F46E5]/[0.04] p-4 dark:border-[#4F46E5]/25 dark:bg-[#4F46E5]/[0.06]">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <InfoItem label="Brut" value={formatAriary(data.brutAvecHS)} />
                    <InfoItem label="Total retenues" value={formatAriary(data.totalRetenues)} />
                    <InfoItem label="Net à payer" value={formatAriary(data.netAPayer)} accent />
                  </div>
                  {data.montant !== data.netCalcule && (
                    <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/[0.08] dark:text-indigo-300">
                      Le montant enregistré correspond à la valeur validée du paiement. Le calcul théorique affiché ci-dessus peut différer si une correction manuelle ou un paramètre historique a été appliqué.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CLIENT PAYMENT DETAILS */}
            {!data.isEmployePayment && (data.total > 0 || data.reste > 0) && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <InfoItem label="Total" value={formatAriary(data.total)} />
                <InfoItem label="Payé" value={formatAriary(data.montant)} accent />
                <InfoItem label="Reste" value={formatAriary(data.reste)} />
              </div>
            )}

            {/* NOTES — ⭐ padding px-3 py-2 → px-3.5 py-2.5, label 10px → 12px, text 12px → 14px */}
            {data.notes && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[14px] leading-relaxed text-slate-600 dark:border-white/[0.08] dark:bg-[#0F172A] dark:text-slate-300">
                <div className="mb-1 text-[12px] font-bold uppercase tracking-wide text-slate-400">Observation</div>
                <div>{data.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER — ⭐ px-4 py-3 → px-5 py-4, buttons 12px h-9 → 15px h-10 */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 dark:border-white/[0.08] dark:bg-[#0F172A]">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* ⭐ Fermer : 12px, h-9, px-4 → 15px, h-10, px-4.5 */}
            <button type="button" onClick={onClose} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4.5 text-[15px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-white/[0.06]">
              Fermer
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              {/* ⭐ PDF : 12px, h-9, px-4 → 15px, h-10, px-4.5 */}
              {onDownloadPdf && (
                <button type="button" onClick={() => onDownloadPdf(paiement)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4.5 text-[15px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-200 dark:hover:bg-white/[0.06]">
                  PDF
                </button>
              )}
              {/* ⭐ Imprimer : 12px, h-9, px-4 → 15px, h-10, px-4.5 */}
              {onPrint && (
                <button type="button" onClick={() => onPrint(paiement)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4.5 text-[15px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-200 dark:hover:bg-white/[0.06]">
                  Imprimer
                </button>
              )}
              {/* ⭐ Modifier : 12px, h-9, px-4, icon 3.5 → 15px, h-10, px-5, icon 17 */}
              {onModifier && (
                <button type="button" onClick={onModifier} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#4F46E5] px-5 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-[#4338CA] active:scale-[0.99]">
                  <Pencil className="h-[17px] w-[17px]" />
                  Modifier
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaiementsViewModal;