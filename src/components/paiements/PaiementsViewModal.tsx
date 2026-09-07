import React, { useMemo } from 'react';
import { X, Pencil } from 'lucide-react';
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
  cnaps?: number | string;
  ostie?: number | string;
  irsa?: number | string;
  avance?: number | string;
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

const getStatusConfig = (status?: string | null, montant?: number, total?: number, isEmployePayment?: boolean) => {
  const normalized = normalizeStatus(status);

  if (normalized === 'paye' || normalized === 'payee' || normalized === 'paid') {
    return { label: 'Payé', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' };
  }
  if (normalized === 'partiel' || normalized === 'partiellement_paye') {
    return { label: 'Partiel', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400' };
  }
  if (normalized === 'en_retard' || normalized === 'retard') {
    return { label: 'En retard', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400' };
  }
  if (normalized === 'annule' || normalized === 'annulee' || normalized === 'cancelled') {
    return { label: 'Annulé', className: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-slate-400' };
  }
  if (normalized === 'non_paye' || normalized === 'non_payé' || normalized === 'non paye' || normalized === 'unpaid') {
    return { label: 'Non payé', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400' };
  }

  if (normalized === '' || normalized === 'en_attente' || normalized === 'en attente' || normalized === 'pending') {
    if (!montant || montant <= 0) {
      return { label: 'Non payé', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400' };
    }
    if (!isEmployePayment && total > 0 && montant < total) {
      return { label: 'Partiel', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400' };
    }
    return { label: 'Payé', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' };
  }

  return { label: status || 'Payé', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' };
};

const getPaymentModeLabel = (mode?: string | null): string => {
  const normalized = normalizeMode(mode);
  if (normalized.includes('mvola') || normalized.includes('mobile') || normalized.includes('yas') || normalized.includes('telma')) {
    return mode || 'Mobile Money';
  }
  if (normalized.includes('espece') || normalized.includes('cash') || normalized.includes('liquide')) {
    return mode || 'Espèces';
  }
  if (normalized.includes('carte') || normalized.includes('card')) {
    return mode || 'Carte bancaire';
  }
  if (normalized.includes('virement') || normalized.includes('bank') || normalized.includes('banque')) {
    return mode || 'Virement bancaire';
  }
  if (normalized.includes('cheque') || normalized.includes('chèque')) {
    return mode || 'Chèque';
  }
  return mode || '—';
};

const InfoItem: React.FC<{ label: string; value: React.ReactNode; accent?: boolean }> = ({ label, value, accent = false }) => {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-white/[0.08] dark:bg-[#0F172A]">
      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        <span>{label}</span>
      </div>
      <div className={`truncate text-[14px] font-semibold ${accent ? 'text-[#0D80D2] dark:text-[#0D80D2]' : 'text-[#264653] dark:text-[#FDE2E4]'}`}>{value}</div>
    </div>
  );
};

const PaiementsViewModal: React.FC<PaiementsViewModalProps> = ({
  isOpen, onClose, paiement, employe, historiquePaiements, moisLabels, moisLabelsCourt,
  getMoisPourAnnee, onViewHistorique, onAddPaiement, onAnnulerPaiement, onModifier, isDark,
  onPrint, onDownloadPdf,
}) => {
  const data = useMemo(() => {
    if (!paiement) return null;
    const isEmployePayment = Boolean(paiement.employe_id !== undefined && paiement.employe_id !== null && paiement.employe_id !== '');
    const date = firstValue(paiement.date_paiement, paiement.datePaiement, paiement.created_at, paiement.createdAt);
    const montant = toNumber(paiement.montant_paye ?? paiement.montant ?? 0);
    const total = isEmployePayment ? toNumber(paiement.salaire_brut) : toNumber(paiement.montant_total ?? paiement.montant_commande ?? 0);
    const resteRaw = paiement.reste_a_payer ?? paiement.reste;
    const reste = resteRaw !== null && resteRaw !== undefined && resteRaw !== '' ? toNumber(resteRaw) : Math.max(total - montant, 0);
    const status = firstValue(paiement.statut_paiement, paiement.statut, paiement.status);
    const mode = firstValue(paiement.mode_paiement, paiement.modePaiement, paiement.methode_paiement);
    const reference = firstValue(paiement.reference_paiement, paiement.reference, paiement.numero);
    const client = firstValue(paiement.client_nom, paiement.clientNom, paiement.nom_client, paiement.client);
    const commande = firstValue(paiement.commande_reference, paiement.commandeReference, paiement.commande_numero);
    const utilisateur = firstValue(paiement.utilisateur_nom, paiement.utilisateurNom, paiement.caissier_nom);
    const employeNom = firstValue(paiement.employe_nom, '');
    const employePrenom = firstValue(paiement.employe_prenom, '');
    const employeFullName = employePrenom ? `${employePrenom} ${employeNom}`.trim() : employeNom;
    const employePoste = firstValue(paiement.employe_poste, '');
    const mois = toNumber(paiement.mois);
    const annee = toNumber(paiement.annee);
    const periodeLabel = mois && annee ? `${String(mois).padStart(2, '0')}/${annee}` : '—';
    const salaireBrut = toNumber(paiement.salaire_brut);
    const cnaps = toNumber(paiement.cnaps);
    const ostie = toNumber(paiement.ostie);
    const irsa = toNumber(paiement.irsa);
    const avance = toNumber(paiement.avance);
    const netAPayer = toNumber(paiement.montant) || (salaireBrut - cnaps - ostie - irsa - avance);

    return {
      isEmployePayment, date, montant, total, reste, status, mode, reference, client, commande, utilisateur,
      notes: firstValue(paiement.notes, paiement.commentaire, paiement.observation),
      formattedDate: formatDate(date),
      employeFullName, employePoste, periodeLabel, salaireBrut, cnaps, ostie, irsa, avance, netAPayer,
    };
  }, [paiement]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  if (!isOpen || !paiement || !data) return null;

  const statusConfig = getStatusConfig(data.status, data.montant, data.total, data.isEmployePayment);
  const paymentModeLabel = getPaymentModeLabel(data.mode);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 backdrop-blur-[3px] sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="paiement-view-title" className="animate-fadeIn relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.1] dark:bg-[#0F172A]">
        
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 dark:border-white/[0.08] dark:bg-[#0F172A] sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <h2 id="paiement-view-title" className="truncate text-[15px] font-bold text-[#264653] dark:text-[#FDE2E4]">
                  {data.isEmployePayment ? 'Détail du paiement employé' : 'Détail du paiement'}
                </h2>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                  {data.reference ? `Réf. ${data.reference}` : data.isEmployePayment ? data.employeFullName : 'Transaction de paiement'}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 p-4 sm:p-5">
          <div className="space-y-3">
            
            <div className="rounded-xl border border-[#0D80D2]/15 bg-[#0D80D2]/[0.04] p-4 dark:border-[#0D80D2]/20 dark:bg-[#0D80D2]/[0.06]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {data.isEmployePayment ? 'Net à payer' : 'Montant payé'}
                  </div>
                  <div className="text-[24px] font-bold leading-none tracking-tight text-[#0D80D2]">
                    {formatAriary(data.montant)}
                  </div>
                  {data.total > 0 && (
                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {data.isEmployePayment ? 'Salaire brut' : 'Total commande'} : <span className="font-semibold text-[#264653] dark:text-[#FDE2E4]">{formatAriary(data.total)}</span>
                    </div>
                  )}
                </div>
                <div className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-bold ${statusConfig.className}`}>
                  {statusConfig.label}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

            {data.isEmployePayment && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <InfoItem label="Salaire brut" value={formatAriary(data.salaireBrut)} />
                <InfoItem label="CNaPS (1%)" value={formatAriary(data.cnaps)} />
                <InfoItem label="OSTIE (5%)" value={formatAriary(data.ostie)} />
                <InfoItem label="IRSA" value={formatAriary(data.irsa)} />
                <InfoItem label="Avance" value={formatAriary(data.avance)} />
                <InfoItem label="Net à payer" value={formatAriary(data.netAPayer)} accent />
              </div>
            )}

            {!data.isEmployePayment && (data.total > 0 || data.reste > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <InfoItem label="Total" value={formatAriary(data.total)} />
                <InfoItem label="Payé" value={formatAriary(data.montant)} accent />
                <InfoItem label="Reste" value={formatAriary(data.reste)} />
              </div>
            )}

            {data.notes && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] leading-relaxed text-slate-600 dark:border-white/[0.08] dark:bg-[#0F172A] dark:text-slate-300">
                {data.notes}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-white/[0.08] dark:bg-[#0F172A] sm:px-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={onClose} className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-white/[0.06]">
              Fermer
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              {onModifier && (
                <button type="button" onClick={onModifier} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0D80D2] px-4 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[#0B6AB0] active:scale-[0.99]">
                  <Pencil className="h-3.5 w-3.5" /> Modifier
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