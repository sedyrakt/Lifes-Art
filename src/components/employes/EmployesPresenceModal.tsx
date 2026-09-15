// src/components/employes/EmployesPresenceModal.tsx
// ⭐ REDESIGN: Mitovy amin'ny BulkPresenceModal ny design
// ⭐ Label "Pointage individuel" + Justification rehefa Absent

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Save, CalendarDays, Clock3, AlertTriangle, CheckCircle2, Timer, FileText,
  User, Briefcase, Calendar, Hourglass,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import TimePicker from '../common/TimePicker';

interface Props {
  isOpen: boolean; onClose: () => void; employe: any;
  mois?: number; annee?: number; moisLabels?: string[];
  onSave?: (data: any) => Promise<any>;
  loadPresence?: (employeId: number, mois: number, annee: number) => Promise<any>;
  mode?: 'monthly' | 'daily'; date?: string;
  onSaveDaily?: (data: any) => Promise<any>;
  loadPresenceJournaliere?: (employeId: number, date: string) => Promise<any>;
}

type PresenceStatus = 'present' | 'absent' | 'conge';

interface DailyForm {
  statut: PresenceStatus;
  heure_arrivee: string;
  heure_depart: string;
  observation: string;
  justification: string;
}

interface CalculPresence { retard: number; heures_travaillees: number; heures_sup: number; }

const DEFAULT_START = '08:00';
const DEFAULT_END = '17:00';

function getLocalDateISO(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeToMinutes(value: string): number | null {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(':').map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function formatHours(value: number | null | undefined): string {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return '0h00';
  const totalMinutes = Math.round(numeric * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

function formatMinutes(value: number | null | undefined): string {
  const minutes = Math.max(0, Math.round(Number(value || 0)));
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h${String(rest).padStart(2, '0')}` : `${hours}h`;
}

function calculatePresence(statut: PresenceStatus, heureArrivee: string, heureDepart: string, heureDebutPrevue = DEFAULT_START, heureFinPrevue = DEFAULT_END): CalculPresence {
  if (statut !== 'present') return { retard: 0, heures_travaillees: 0, heures_sup: 0 };
  const arrival = timeToMinutes(heureArrivee);
  const departure = timeToMinutes(heureDepart);
  const plannedStart = timeToMinutes(heureDebutPrevue);
  const plannedEnd = timeToMinutes(heureFinPrevue);
  if (arrival === null || departure === null || plannedStart === null || plannedEnd === null) return { retard: 0, heures_travaillees: 0, heures_sup: 0 };
  if (departure < arrival) return { retard: Math.max(0, arrival - plannedStart), heures_travaillees: 0, heures_sup: 0 };
  const retard = Math.max(0, arrival - plannedStart);
  const workedMinutes = Math.max(0, departure - arrival);
  const overtimeMinutes = Math.max(0, departure - plannedEnd);
  return { retard, heures_travaillees: Number((workedMinutes / 60).toFixed(4)), heures_sup: Number((overtimeMinutes / 60).toFixed(4)) };
}

const STATUS_CONFIG: Record<PresenceStatus, { label: string; active: string; inactive: string }> = {
  present: {
    label: 'Présent',
    active: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400',
    inactive: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-white/[0.05]',
  },
  absent: {
    label: 'Absent',
    active: 'border-red-500 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400',
    inactive: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-white/[0.05]',
  },
  conge: {
    label: 'Congé',
    active: 'border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400',
    inactive: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-white/[0.05]',
  },
};

const EmployesPresenceModal: React.FC<Props> = ({
  isOpen, onClose, employe, mois, annee, moisLabels,
  onSave, loadPresence, mode = 'monthly', date, onSaveDaily, loadPresenceJournaliere,
}) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [monthlyForm, setMonthlyForm] = useState({ jours_absences: 0, jours_conges: 0, jours_maladie: 0, justificatif_maladie: '', observation: '' });
  const [dailyForm, setDailyForm] = useState<DailyForm>({ statut: 'present', heure_arrivee: '', heure_depart: '', observation: '', justification: '' });
  const [plannedStart, setPlannedStart] = useState(DEFAULT_START);
  const [plannedEnd, setPlannedEnd] = useState(DEFAULT_END);

  const resetDailyForm = useCallback(() => {
    setDailyForm({ statut: 'present', heure_arrivee: '', heure_depart: '', observation: '', justification: '' });
    setPlannedStart(DEFAULT_START);
    setPlannedEnd(DEFAULT_END);
    setErrorMessage('');
  }, []);

  useEffect(() => {
    if (!isOpen || !employe) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        if (mode === 'monthly') {
          if (!mois || !annee || !loadPresence) return;
          const data = await loadPresence(Number(employe.id), Number(mois), Number(annee));
          if (cancelled) return;
          setMonthlyForm({
            jours_absences: Number(data?.jours_absences || 0),
            jours_conges: Number(data?.jours_conges || 0),
            jours_maladie: Number(data?.jours_maladie || 0),
            justificatif_maladie: String(data?.justificatif_maladie || ''),
            observation: String(data?.observation || ''),
          });
          return;
        }
        if (mode === 'daily') {
          resetDailyForm();
          if (!date || !loadPresenceJournaliere) return;
          const data = await loadPresenceJournaliere(Number(employe.id), date);
          if (cancelled) return;
          if (data) {
            const statut = data?.statut === 'absent' ? 'absent' : data?.statut === 'conge' ? 'conge' : 'present';
            const isPresentType = statut === 'present';
            setDailyForm({
              statut,
              heure_arrivee: isPresentType ? (data?.heure_arrivee || '') : '',
              heure_depart: isPresentType ? (data?.heure_depart || '') : '',
              observation: data?.observation || '',
              justification: '',
            });
            setPlannedStart(data?.heure_debut_planifiee || data?.heure_debut || DEFAULT_START);
            setPlannedEnd(data?.heure_fin_planifiee || data?.heure_fin || DEFAULT_END);
          }
        }
      } catch (error: any) {
        if (!cancelled) setErrorMessage(error?.message || 'Impossible de charger les données.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [isOpen, employe, mode, mois, annee, date, loadPresence, loadPresenceJournaliere, resetDailyForm]);

  const calculated = useMemo(() => calculatePresence(dailyForm.statut, dailyForm.heure_arrivee, dailyForm.heure_depart, plannedStart, plannedEnd), [dailyForm.statut, dailyForm.heure_arrivee, dailyForm.heure_depart, plannedStart, plannedEnd]);

  const handleStatusChange = (statut: PresenceStatus) => {
    setErrorMessage('');
    if (statut !== 'present') {
      setDailyForm((prev) => ({ ...prev, statut, heure_arrivee: '', heure_depart: '' }));
      return;
    }
    setDailyForm((prev) => ({ ...prev, statut, justification: '' }));
  };

  const validateDaily = (): string | null => {
    if (!date) return 'La date de pointage est obligatoire.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'La date du pointage est invalide.';
    if (dailyForm.statut === 'absent' && !dailyForm.justification.trim()) {
      return "La justification est obligatoire pour un absent.";
    }
    if (dailyForm.statut !== 'present') return null;
    if (!dailyForm.heure_arrivee) return "L'heure d'arrivée est obligatoire pour un présent.";
    if (dailyForm.heure_depart) {
      const a = timeToMinutes(dailyForm.heure_arrivee);
      const d = timeToMinutes(dailyForm.heure_depart);
      if (a !== null && d !== null && d < a) return "L'heure de départ ne peut pas être avant l'heure d'arrivée.";
    }
    return null;
  };

  const handleSave = async () => {
    if (!employe) return;
    setErrorMessage('');
    setSaving(true);
    try {
      if (mode === 'monthly') {
        if (!onSave) throw new Error('Fonction de sauvegarde mensuelle indisponible.');
        if (!mois || !annee) throw new Error('Le mois ou l\'année est invalide.');
        const result = await onSave({
          employe_id: Number(employe.id), mois: Number(mois), annee: Number(annee),
          jours_absences: Math.max(0, Number(monthlyForm.jours_absences) || 0),
          jours_conges: Math.max(0, Number(monthlyForm.jours_conges) || 0),
          jours_maladie: Math.max(0, Number(monthlyForm.jours_maladie) || 0),
          justificatif_maladie: monthlyForm.justificatif_maladie.trim() || null,
          observation: monthlyForm.observation.trim() || null,
        });
        if (result?.success === false) throw new Error(result?.error || 'Erreur lors de la sauvegarde.');
        onClose();
        return;
      }

      if (!date) throw new Error('Date de pointage obligatoire.');
      if (!onSaveDaily) throw new Error('Fonction de sauvegarde journalière indisponible.');
      const validationError = validateDaily();
      if (validationError) { setErrorMessage(validationError); return; }

      const isPresent = dailyForm.statut === 'present';
      const fullObservation = [
        dailyForm.observation.trim(),
        dailyForm.statut === 'absent' && dailyForm.justification.trim() ? `Justification: ${dailyForm.justification.trim()}` : '',
      ].filter(Boolean).join(' | ') || null;

      const payload = {
        employe_id: Number(employe.id),
        date,
        statut: dailyForm.statut,
        heure_arrivee: isPresent ? (dailyForm.heure_arrivee || null) : null,
        heure_depart: isPresent ? (dailyForm.heure_depart || null) : null,
        heure_debut_planifiee: isPresent ? plannedStart : null,
        heure_fin_planifiee: isPresent ? plannedEnd : null,
        retard: isPresent ? Math.max(0, Number(calculated.retard) || 0) : 0,
        heures_travaillees: isPresent ? Number(calculated.heures_travaillees || 0) : 0,
        heures_sup: isPresent ? Number(calculated.heures_sup || 0) : 0,
        observation: fullObservation,
      };

      const result = await onSaveDaily(payload);
      if (result?.success === false) throw new Error(result?.error || 'Erreur lors de la sauvegarde du pointage.');
      onClose();
    } catch (error: any) {
      console.error('❌ [EmployesPresenceModal] save:', error);
      setErrorMessage(error?.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !employe) return null;

  const employeeName = `${employe?.prenom || ''} ${employe?.nom || ''}`.trim() || 'Employé';
  const modalDate = date || getLocalDateISO();
  const isPresentType = dailyForm.statut === 'present';
  const isAbsent = dailyForm.statut === 'absent';

  // ⭐ Header icon color based on statut
  const headerIconColor =
    dailyForm.statut === 'present' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
    dailyForm.statut === 'absent' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
    'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';

  const modal = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="relative flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.35)] dark:border-white/[0.12] dark:bg-[#0F172A]">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-white/[0.08]">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${headerIconColor}`}>
              {mode === 'daily' ? <Clock3 size={20} strokeWidth={2.2} /> : <CalendarDays size={20} strokeWidth={2.2} />}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[17px] font-semibold text-slate-900 dark:text-slate-100">
                {mode === 'daily' ? 'Pointage individuel' : 'Gestion mensuelle'}
              </h2>
              <p className="mt-0.5 truncate text-[13.5px] leading-[1.3] text-slate-500 dark:text-slate-400">
                {employeeName}{mode === 'daily' && ` — ${modalDate.split('-').reverse().join('/')}`}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-white/[0.06]">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* BODY */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              <p className="mt-3 text-[14px] text-slate-500 dark:text-slate-400">Chargement...</p>
            </div>
          ) : mode === 'monthly' ? (
            /* MONTHLY — mitovy amin'ny taloha */
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Jours d'absence" value={monthlyForm.jours_absences} type="number" min={0} onChange={(value) => setMonthlyForm((prev) => ({ ...prev, jours_absences: Math.max(0, Number(value) || 0) }))} />
                <Field label="Jours de congé" value={monthlyForm.jours_conges} type="number" min={0} onChange={(value) => setMonthlyForm((prev) => ({ ...prev, jours_conges: Math.max(0, Number(value) || 0) }))} />
                <Field label="Jours de maladie" value={monthlyForm.jours_maladie} type="number" min={0} onChange={(value) => setMonthlyForm((prev) => ({ ...prev, jours_maladie: Math.max(0, Number(value) || 0) }))} />
                <Field label="Certificat médical" value={monthlyForm.justificatif_maladie} onChange={(value) => setMonthlyForm((prev) => ({ ...prev, justificatif_maladie: value }))} placeholder="N° certificat..." />
              </div>
              <div>
                <label className="mb-1.5 block text-[14px] font-semibold text-slate-500 dark:text-slate-400">Observation</label>
                <textarea rows={3} value={monthlyForm.observation} onChange={(event) => setMonthlyForm((prev) => ({ ...prev, observation: event.target.value }))} className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-100" />
              </div>
            </div>
          ) : (
            /* DAILY — ⭐ DESIGN MITOVY AMIN'NY BULK MODAL */
            <div className="space-y-4">
              {/* ═══ SECTION 1: Statut ═══ */}
              <div>
                <label className="mb-2 block text-[14px] font-semibold text-slate-900 dark:text-slate-100">Statut de présence</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(STATUS_CONFIG) as PresenceStatus[]).map((status) => {
                    const config = STATUS_CONFIG[status];
                    const active = dailyForm.statut === status;
                    return (
                      <button key={status} type="button" onClick={() => handleStatusChange(status)} className={`flex min-h-[46px] items-center justify-center gap-2 rounded-lg border px-3 text-[15px] font-semibold transition-colors ${active ? config.active : config.inactive}`}>
                        {status === 'present' && <CheckCircle2 size={17} strokeWidth={2.2} />}
                        {status === 'absent' && <AlertTriangle size={17} strokeWidth={2.2} />}
                        {status === 'conge' && <CalendarDays size={17} strokeWidth={2.2} />}
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ═══ SECTION 2: Info employé (mifanaraka amin'ny bulk) ═══ */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <User size={14} strokeWidth={2.2} className="mt-1 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-[12px] leading-[1.3] text-slate-500 dark:text-slate-400">Employé</p>
                      <p className="mt-0.5 truncate text-[14px] font-semibold text-slate-900 dark:text-slate-100">{employeeName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Briefcase size={14} strokeWidth={2.2} className="mt-1 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-[12px] leading-[1.3] text-slate-500 dark:text-slate-400">Poste</p>
                      <p className="mt-0.5 truncate text-[14px] font-semibold text-slate-900 dark:text-slate-100">{employe?.poste || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ SECTION 3: Planning + Heures (raha Present) ═══ */}
              {isPresentType && (
                <>
                  {/* Planning prévu */}
                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-slate-500 dark:text-slate-400">Début prévu</label>
                      <TimePicker value={plannedStart} onChange={setPlannedStart} isDark={isDark} showSeconds={false} placeholder="08:00" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-slate-500 dark:text-slate-400">Fin prévue</label>
                      <TimePicker value={plannedEnd} onChange={setPlannedEnd} isDark={isDark} showSeconds={false} placeholder="17:00" />
                    </div>
                  </div>

                  {/* Arrivée / Départ */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[14px] font-semibold text-slate-500 dark:text-slate-400">Heure d'arrivée</label>
                      <TimePicker value={dailyForm.heure_arrivee} onChange={(v) => setDailyForm((prev) => ({ ...prev, heure_arrivee: v }))} isDark={isDark} showSeconds={false} placeholder="--:--" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[14px] font-semibold text-slate-500 dark:text-slate-400">Heure de départ</label>
                      <TimePicker value={dailyForm.heure_depart} onChange={(v) => setDailyForm((prev) => ({ ...prev, heure_depart: v }))} isDark={isDark} showSeconds={false} placeholder="--:--" />
                    </div>
                  </div>

                  {/* ═══ METRICS — mitovy amin'ny bulk modal ═══ */}
                  <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 dark:border-white/[0.08] dark:bg-white/[0.08]">
                    <div className="bg-white px-3 py-3 dark:bg-[#0F172A]">
                      <div className={`flex items-center gap-1.5 text-[12.5px] font-semibold ${calculated.retard > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        <AlertTriangle size={13} strokeWidth={2.2} />
                        <span>Retard</span>
                      </div>
                      <p className="mt-1 text-[15px] font-bold text-slate-900 dark:text-slate-100">{formatMinutes(calculated.retard)}</p>
                    </div>
                    <div className="bg-white px-3 py-3 dark:bg-[#0F172A]">
                      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-600 dark:text-brand-400">
                        <Clock3 size={13} strokeWidth={2.2} />
                        <span>Travaillé</span>
                      </div>
                      <p className="mt-1 text-[15px] font-bold text-slate-900 dark:text-slate-100">{formatHours(calculated.heures_travaillees)}</p>
                    </div>
                    <div className="bg-white px-3 py-3 dark:bg-[#0F172A]">
                      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-violet-600 dark:text-violet-400">
                        <Timer size={13} strokeWidth={2.2} />
                        <span>Heures sup.</span>
                      </div>
                      <p className="mt-1 text-[15px] font-bold text-slate-900 dark:text-slate-100">{formatHours(calculated.heures_sup)}</p>
                    </div>
                  </div>

                  {/* Alerte retard */}
                  {calculated.retard > 5 && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 dark:border-amber-500/40 dark:bg-amber-500/10">
                      <p className="text-[13.5px] font-bold text-amber-700 dark:text-amber-400">Retard détecté</p>
                      <p className="mt-1 text-[12.5px] leading-[1.4] text-amber-700/80 dark:text-amber-300/80">
                        L'employé est arrivé <strong>{formatMinutes(calculated.retard)}</strong> après l'heure prévue ({plannedStart}).
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ═══ Absent/Congé message ═══ */}
              {!isPresentType && (
                <div className={`rounded-lg border-2 p-4 ${dailyForm.statut === 'absent' ? 'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10' : 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${dailyForm.statut === 'absent' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                      {dailyForm.statut === 'absent' ? <AlertTriangle size={18} strokeWidth={2.2} /> : <CalendarDays size={18} strokeWidth={2.2} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[14px] font-bold ${dailyForm.statut === 'absent' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {dailyForm.statut === 'absent' ? 'Employé absent' : 'Employé en congé'}
                      </p>
                      <p className={`mt-1 text-[12.5px] leading-[1.4] ${dailyForm.statut === 'absent' ? 'text-red-700/80 dark:text-red-300/80' : 'text-amber-700/80 dark:text-amber-300/80'}`}>
                        Aucune heure d'arrivée, de départ ou de retard ne sera enregistrée pour ce statut.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ Justification rehefa Absent ═══ */}
              {isAbsent && (
                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                    Justification <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText size={15} strokeWidth={2.2} className="absolute left-3 top-3.5 text-red-400" />
                    <textarea
                      rows={2}
                      value={dailyForm.justification}
                      onChange={(event) => setDailyForm((prev) => ({ ...prev, justification: event.target.value }))}
                      placeholder="Raison de l'absence (maladie, urgence familiale, ...)"
                      className="w-full resize-none rounded-lg border border-red-200 bg-red-50/30 pl-9 pr-3.5 py-3 text-[14.5px] text-slate-900 outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/30 dark:bg-red-500/5 dark:text-slate-100"
                    />
                  </div>
                  <p className="mt-1 text-[11.5px] italic text-slate-500 dark:text-slate-500">
                    Obligatoire pour justifier l'absence dans le dossier RH.
                  </p>
                </div>
              )}

              {/* ═══ Observation ═══ */}
              <div>
                <label className="mb-1.5 block text-[14px] font-semibold text-slate-500 dark:text-slate-400">Observation (optionnel)</label>
                <textarea
                  rows={2}
                  value={dailyForm.observation}
                  onChange={(event) => setDailyForm((prev) => ({ ...prev, observation: event.target.value }))}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[14.5px] text-slate-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-100"
                  placeholder="Remarque RH..."
                />
              </div>

              {/* ═══ Error ═══ */}
              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[14px] font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          {mode === 'monthly' && errorMessage && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[14px] font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              {errorMessage}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/[0.08] dark:bg-[#0F172A]">
          <button type="button" onClick={onClose} disabled={saving} className="h-10 rounded-lg border border-slate-200 px-4 text-[14.5px] font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || (isAbsent && !dailyForm.justification.trim())}
            className="flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-[14.5px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />) : (<Save size={16} strokeWidth={2.2} />)}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

interface FieldProps { label: string; value: any; onChange: (value: string) => void; type?: string; min?: number; placeholder?: string; }

function Field({ label, value, onChange, type = 'text', min, placeholder }: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-[14px] font-semibold text-slate-500 dark:text-slate-400">{label}</label>
      <input type={type} min={min} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[15px] text-slate-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-100" />
    </div>
  );
}

export default EmployesPresenceModal;