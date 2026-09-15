// src/components/employes/EmployesCalendrier.tsx
// ⭐ NEW: Bouton Modifier + Supprimer amin'ny card tsirairay
// ⭐ FIX: Message français amin'ny delete modal

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock3, X,
  CheckCircle2, XCircle, Loader2, Search, CheckSquare,
  Square, History, Maximize2, Minimize2, Timer, TrendingUp,
  Palmtree, Circle, HelpCircle, UserCheck, AlertTriangle, Save, Trash2, Pencil,
} from 'lucide-react';
import EmployesHistoriqueModal from './EmployesHistoriqueModal';
import EmployesPresenceModal from './EmployesPresenceModal';
import ConfirmModal from '../common/ConfirmModal';
import TimePicker from '../common/TimePicker';
import { useTheme } from '../../contexts/ThemeContext';

interface EmployesCalendrierProps {
  employes: any[];
  mois: number;
  annee: number;
  onMoisChange?: (mois: number) => void;
  onAnneeChange?: (annee: number) => void;
  onJourClick?: (employeId: number, date: string) => void;
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const ITEMS_PER_PAGE_DRAWER = 4;

const DEFAULT_HEURE_DEBUT = '08:00';
const DEFAULT_HEURE_FIN = '17:00';
const RETARD_TOLERANCE_MIN = 5;
const RETARD_SUSPECT_MIN = 240;

const FILTRE_OPTIONS = [
  { value: 'Tous', label: 'Tous' },
  { value: 'present', label: 'Présent' },
  { value: 'retard', label: 'Retard' },
  { value: 'hs', label: 'Heures Supp.' },
  { value: 'absent', label: 'Absent' },
  { value: 'conge', label: 'Congé' },
  { value: 'non_pointe', label: 'Non pointé' },
] as const;

const ICON_LEGEND = [
  { Icon: CheckCircle2, label: 'Présent', color: 'text-emerald-600 dark:text-emerald-400' },
  { Icon: Clock3, label: 'Retard', color: 'text-amber-600 dark:text-amber-400' },
  { Icon: XCircle, label: 'Absent', color: 'text-red-600 dark:text-red-400' },
  { Icon: Palmtree, label: 'Congé', color: 'text-amber-600 dark:text-amber-400' },
  { Icon: Timer, label: 'Heures Supp.', color: 'text-sky-600 dark:text-sky-400' },
  { Icon: Circle, label: 'Non pointé', color: 'text-slate-400 dark:text-slate-500' },
];

const STAT_ACCENTS = {
  presents: { iconBg: 'bg-emerald-50 dark:bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400', accent: '#10B981' },
  presence: { iconBg: 'bg-indigo-50 dark:bg-indigo-500/10', iconColor: 'text-indigo-600 dark:text-indigo-400', accent: '#6366F1' },
  retard: { iconBg: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400', accent: '#F59E0B' },
  absence: { iconBg: 'bg-red-50 dark:bg-red-500/10', iconColor: 'text-red-600 dark:text-red-400', accent: '#EF4444' },
  heuresSup: { iconBg: 'bg-sky-50 dark:bg-sky-500/10', iconColor: 'text-sky-600 dark:text-sky-400', accent: '#0EA5E9' },
};

function getLocalDateISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getEmployeeName(employe: any): string {
  return `${employe.prenom ?? ''} ${employe.nom ?? ''}`.trim() || 'Employé';
}

function getEffectiveStatus(statut: string, retard: number, heuresSup: number): string {
  const s = String(statut || '').toLowerCase();
  if (s !== 'present') return s;
  if (retard > 0) return 'retard';
  if (heuresSup > 0) return 'hs';
  return 'present';
}

function getStatusInfo(status: string) {
  const s = status.toLowerCase();
  if (s === 'present') return { label: 'Présent', color: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400', icon: <CheckCircle2 size={13} strokeWidth={2.2} /> };
  if (s === 'retard') return { label: 'Retard', color: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400', icon: <Clock3 size={13} strokeWidth={2.2} /> };
  if (s === 'hs' || s === 'heures_supp') return { label: 'Heures Supp.', color: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-400', icon: <Timer size={13} strokeWidth={2.2} /> };
  if (s === 'absent') return { label: 'Absent', color: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400', icon: <XCircle size={13} strokeWidth={2.2} /> };
  if (s === 'conge') return { label: 'Congé', color: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400', icon: <Palmtree size={13} strokeWidth={2.2} /> };
  if (s === 'non_pointe' || s === 'non pointé' || s === 'non pointe') return { label: 'Non pointé', color: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400', icon: <Circle size={13} strokeWidth={2.2} /> };
  if (s === 'en_attente' || s === 'en attente') return { label: 'En attente', color: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400', icon: <Clock3 size={13} strokeWidth={2.2} /> };
  return { label: s || 'En attente', color: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400', icon: <Clock3 size={13} strokeWidth={2.2} /> };
}

function isPresentTypeStatus(status: string): boolean {
  return status === 'present' || status === 'retard' || status === 'hs';
}

function timeToMinutes(value: string): number | null {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(':').map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const m = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function getSmartArrivalTime(plannedStart: string, pointageDate: string): string {
  const now = new Date();
  const today = getLocalDateISO(now);
  if (pointageDate === today) return minutesToTime(now.getHours() * 60 + now.getMinutes());
  return plannedStart;
}

function calculateBulkMetrics(status: string, arrival: string, departure: string, plannedStart: string, plannedEnd: string): { retard: number; heuresTravaillees: number; heuresSup: number } {
  const isPresent = status === 'present';
  if (!isPresent) return { retard: 0, heuresTravaillees: 0, heuresSup: 0 };

  const arr = timeToMinutes(arrival);
  const dep = timeToMinutes(departure);
  const pStart = timeToMinutes(plannedStart);
  const pEnd = timeToMinutes(plannedEnd);

  if (arr === null || dep === null || pStart === null || pEnd === null) return { retard: 0, heuresTravaillees: 0, heuresSup: 0 };
  if (dep < arr) return { retard: Math.max(0, arr - pStart), heuresTravaillees: 0, heuresSup: 0 };

  const retard = Math.max(0, arr - pStart);
  const workedMin = Math.max(0, dep - arr);
  const overtimeMin = Math.max(0, dep - pEnd);

  return { retard, heuresTravaillees: Number((workedMin / 60).toFixed(2)), heuresSup: Number((overtimeMin / 60).toFixed(2)) };
}

function formatMinutes(minutes: number | null | undefined): string {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m <= 0) return '0 min';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest > 0 ? `${h}h${String(rest).padStart(2, '0')}` : `${h}h`;
}

function formatHours(hours: number | null | undefined): string {
  const h = Math.max(0, Number(hours) || 0);
  if (h <= 0) return '0h00';
  const totalMinutes = Math.round(h * 60);
  const hoursInt = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hoursInt}h${String(mins).padStart(2, '0')}`;
}

function detectEffectiveStatus(status: string, metrics: { retard: number; heuresSup: number }): 'present' | 'retard' | 'hs' | 'absent' | 'conge' {
  if (status === 'absent') return 'absent';
  if (status === 'conge') return 'conge';
  if (metrics.retard > RETARD_TOLERANCE_MIN) return 'retard';
  if (metrics.heuresSup > 0) return 'hs';
  return 'present';
}

// ════════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════════

interface CalendarStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accentKey: keyof typeof STAT_ACCENTS;
}

const CalendarStatCard: React.FC<CalendarStatCardProps> = ({ icon, label, value, accentKey }) => {
  const accent = STAT_ACCENTS[accentKey];
  return (
    <div className="group relative flex min-h-[95px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors duration-200 hover:border-brand-500/30 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-brand-500/30">
      <div className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ backgroundColor: accent.accent }} />
      <div className="flex min-w-0 items-start gap-3.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconColor} transition-transform duration-200 group-hover:scale-105`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold uppercase leading-[1.4] tracking-[0.07em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 truncate text-[20px] font-bold leading-[1.3] tracking-tight text-slate-900 dark:text-slate-100" title={String(value)}>{value}</p>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════

export default function EmployesCalendrier({
  employes, mois, annee, onMoisChange, onAnneeChange, onJourClick,
}: EmployesCalendrierProps) {
  const { isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(mois - 1);
  const [currentYear, setCurrentYear] = useState(annee);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [presences, setPresences] = useState<Record<string, Record<number, any>>>({});
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchDrawer, setSearchDrawer] = useState('');
  const [currentPageDrawer, setCurrentPageDrawer] = useState(1);
  const [statusFilterDrawer, setStatusFilterDrawer] = useState<string>('Tous');
  const [showHistorique, setShowHistorique] = useState(false);
  const [selectedEmployeForHistory, setSelectedEmployeForHistory] = useState<any | null>(null);

  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [selectedEmployeForPresence, setSelectedEmployeForPresence] = useState<any | null>(null);
  const [presenceDate, setPresenceDate] = useState<string | null>(null);

  const [allEmployes, setAllEmployes] = useState<any[]>([]);

  // ⭐ Delete modal state
  const [deletePresenceModal, setDeletePresenceModal] = useState<{
    isOpen: boolean;
    employe: any | null;
    date: string;
    loading: boolean;
  }>({
    isOpen: false,
    employe: null,
    date: '',
    loading: false,
  });

  const [bulkModal, setBulkModal] = useState<{
    isOpen: boolean;
    status: 'present' | 'absent' | 'conge';
    heureArrivee: string;
    heureDepart: string;
    plannedStart: string;
    plannedEnd: string;
    observation: string;
    justification: string;
    forceAbsent: boolean;
  }>({
    isOpen: false,
    status: 'present',
    heureArrivee: DEFAULT_HEURE_DEBUT,
    heureDepart: DEFAULT_HEURE_FIN,
    plannedStart: DEFAULT_HEURE_DEBUT,
    plannedEnd: DEFAULT_HEURE_FIN,
    observation: '',
    justification: '',
    forceAbsent: false,
  });

  const [modalState, setModalState] = useState<{
    type: 'confirm' | 'success' | 'error';
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  }>({
    type: 'confirm', isOpen: false, title: '', message: '', confirmText: 'Confirmer', cancelText: 'Annuler', onConfirm: () => {},
  });
  const todayKey = getLocalDateISO();
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);

  const monthInfo = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    return { firstDay, lastDay, daysInMonth, startOffset };
  }, [currentYear, currentMonth]);

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < monthInfo.startOffset; i++) cells.push(null);
    for (let day = 1; day <= monthInfo.daysInMonth; day++) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthInfo]);

  useEffect(() => {
    const loadAllEmployes = async () => {
      try {
        const api = (window as any).api?.employes;
        if (!api?.getAll) return;
        const response = await api.getAll({ limit: 10000 });
        if (response?.success) {
          const data = response.data;
          const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.employes) ? data.employes : [];
          setAllEmployes(list);
        }
      } catch (e) { console.warn('[EmployesCalendrier] load all employes:', e); }
    };
    void loadAllEmployes();
  }, []);

  const employeeSource = allEmployes.length > 0 ? allEmployes : employes;

  const fetchPresence = useCallback(async () => {
    if (!window.api?.employes?.getPresenceJournaliereMois) return;
    setLoading(true);
    const newPresences: Record<string, Record<number, any>> = {};
    try {
      const response = await window.api.employes.getPresenceJournaliereMois(currentMonth + 1, currentYear);
      if (response?.success && Array.isArray(response.data)) {
        response.data.forEach((rec: any) => {
          const date = rec.date;
          const empId = rec.employe_id;
          const statut = rec.statut;
          const retard = Number(rec.retard ?? rec.minutes_retard ?? 0);
          const heuresSup = Number(rec.heures_sup ?? rec.heures_supp ?? 0);
          const heuresTravaillees = Number(rec.heures_travaillees ?? 0);
          const heureArrivee = rec.heure_arrivee || rec.heure_entree || '';
          const heureDepart = rec.heure_depart || rec.heure_sortie || '';
          const observation = rec.observation || '';

          if (date && empId && statut) {
            if (!newPresences[date]) newPresences[date] = {};
            newPresences[date][empId] = { statut, retard, heuresSup, heuresTravaillees, heureArrivee, heureDepart, observation };
          }
        });
      }
    } catch (error) { console.error('Erreur bulk load presence:', error); }
    setPresences(newPresences);
    setLoading(false);
  }, [currentMonth, currentYear]);

  useEffect(() => { void fetchPresence(); }, [fetchPresence]);

  const currentMonthStats = useMemo(() => {
    let presentDays = 0, retardDays = 0, hsDays = 0, totalPresenceDays = 0;
    let absentDays = 0, congeDays = 0, nonPointeDays = 0;
    let hsMinutes = 0;
    const presentsSet = new Set<number>();

    Object.keys(presences).forEach((date) => {
      if (!date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-`)) return;
      const records = presences[date];
      Object.keys(records).forEach((empId) => {
        const record = records[Number(empId)];
        const retard = Number(record.retard || 0);
        const heuresSup = Number(record.heuresSup || 0);
        const effective = getEffectiveStatus(record.statut, retard, heuresSup);

        if (effective === 'present') { presentDays++; totalPresenceDays++; presentsSet.add(Number(empId)); }
        else if (effective === 'retard') { retardDays++; totalPresenceDays++; presentsSet.add(Number(empId)); }
        else if (effective === 'hs') { hsDays++; totalPresenceDays++; presentsSet.add(Number(empId)); }
        else if (effective === 'absent') absentDays++;
        else if (effective === 'conge') congeDays++;
        else if (effective === 'non_pointe') nonPointeDays++;
        if (heuresSup > 0) hsMinutes += heuresSup;
      });
    });

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
    const isFutureMonth = new Date(currentYear, currentMonth, 1) > today;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysElapsed = isFutureMonth ? 0 : (isCurrentMonth ? today.getDate() : daysInMonth);
    const totalEmployes = employeeSource.length;

    const expectedPointages = totalEmployes * daysElapsed;
    const presenceRate = expectedPointages > 0 ? Math.round((totalPresenceDays / expectedPointages) * 1000) / 10 : 0;
    const uniquePresents = presentsSet.size;

    return { presentDays, retardDays, hsDays, totalPresenceDays, absentDays, congeDays, nonPointeDays, hsMinutes, presenceRate, uniquePresents, totalEmployes, daysElapsed, daysInMonth };
  }, [presences, currentYear, currentMonth, employeeSource.length]);

  const selectedDatePresences = useMemo(() => {
    if (!selectedDate) return [];
    const records = presences[selectedDate] || {};
    const search = searchDrawer.trim().toLowerCase();
    return employeeSource
      .filter((emp) => `${emp.prenom ?? ''} ${emp.nom ?? ''}`.toLowerCase().includes(search))
      .map((emp) => {
        const rawRecord = records[emp.id] || null;
        let statut: string;
        let retard = 0, heuresSup = 0, heureArrivee = '', heureDepart = '';

        if (rawRecord) {
          statut = rawRecord.statut;
          retard = rawRecord.retard || 0;
          heuresSup = rawRecord.heuresSup || 0;
          heureArrivee = rawRecord.heureArrivee || '';
          heureDepart = rawRecord.heureDepart || '';
        } else {
          if (selectedDate < todayKey) statut = 'non_pointe';
          else statut = 'en_attente';
        }

        const effectiveStatus = getEffectiveStatus(statut, retard, heuresSup);
        return { employe: emp, status: effectiveStatus, originalStatus: statut, retard, heuresSup, heureArrivee, heureDepart, hasRecord: !!rawRecord };
      });
  }, [selectedDate, presences, employeeSource, searchDrawer, todayKey]);

  const filteredDrawerPresences = useMemo(() => {
    const search = searchDrawer.trim().toLowerCase();
    return selectedDatePresences.filter(({ employe, status }) => {
      const matchSearch = !search || `${employe.prenom ?? ''} ${employe.nom ?? ''}`.toLowerCase().includes(search);
      const matchStatus = statusFilterDrawer === 'Tous' || status === statusFilterDrawer;
      return matchSearch && matchStatus;
    });
  }, [selectedDatePresences, searchDrawer, statusFilterDrawer]);

  const currentItemsPerPage = isDrawerExpanded ? 12 : ITEMS_PER_PAGE_DRAWER;
  const totalDrawerPages = Math.max(1, Math.ceil(filteredDrawerPresences.length / currentItemsPerPage));
  const paginatedDrawerPresences = useMemo(() => {
    const start = (currentPageDrawer - 1) * currentItemsPerPage;
    return filteredDrawerPresences.slice(start, start + currentItemsPerPage);
  }, [filteredDrawerPresences, currentPageDrawer, currentItemsPerPage]);

  const openModal = (type: 'confirm' | 'success' | 'error', title: string, message: string, onConfirm: () => void, confirmText = 'OK') => {
    setModalState({ type, isOpen: true, title, message, confirmText, cancelText: type === 'confirm' ? 'Annuler' : '', onConfirm: () => { onConfirm(); setModalState((prev) => ({ ...prev, isOpen: false })); } });
  };

  const closeModal = () => setModalState((prev) => ({ ...prev, isOpen: false }));

  // ⭐⭐⭐ Delete presence handler ⭐⭐⭐
  const openDeletePresenceModal = (employe: any, date: string) => {
    setDeletePresenceModal({ isOpen: true, employe, date, loading: false });
  };

  const confirmDeletePresence = async () => {
    const { employe, date } = deletePresenceModal;
    if (!employe || !date) return;

    setDeletePresenceModal((prev) => ({ ...prev, loading: true }));
    try {
      const api = (window as any).api?.employes;
      let result;
      if (api?.deletePresenceJournaliere) {
        result = await api.deletePresenceJournaliere(Number(employe.id), date);
      } else if (api?.deletePresence) {
        result = await api.deletePresence(Number(employe.id), date);
      } else {
        throw new Error('API deletePresenceJournaliere non disponible. Vérifiez le backend.');
      }

      if (result?.success === false) throw new Error(result?.error || 'Erreur suppression');

      setDeletePresenceModal({ isOpen: false, employe: null, date: '', loading: false });
      await fetchPresence();
      openModal('success', 'Supprimé', `Le pointage de ${getEmployeeName(employe)} a été supprimé.`, () => {}, 'OK');
    } catch (error: any) {
      console.error('Erreur delete presence:', error);
      setDeletePresenceModal((prev) => ({ ...prev, loading: false }));
      openModal('error', 'Erreur', error?.message || 'Impossible de supprimer.', () => {}, 'OK');
    }
  };

  const cancelDeletePresence = () => {
    setDeletePresenceModal({ isOpen: false, employe: null, date: '', loading: false });
  };

  // ⭐⭐⭐ Auto-absent raha ny heure d'arrivée dia >= Fin prévue
  const openBulkModal = (status: 'present' | 'absent' | 'conge') => {
    if (!selectedDate) return;
    if (selectedIds.size === 0) return;

    const smartArrival = getSmartArrivalTime(DEFAULT_HEURE_DEBUT, selectedDate);
    const arrivalMin = timeToMinutes(smartArrival);
    const plannedEndMin = timeToMinutes(DEFAULT_HEURE_FIN);
    const wouldBeZeroWorked = status === 'present' && arrivalMin !== null && plannedEndMin !== null && arrivalMin >= plannedEndMin;

    setBulkModal({
      isOpen: true,
      status,
      heureArrivee: smartArrival,
      heureDepart: DEFAULT_HEURE_FIN,
      plannedStart: DEFAULT_HEURE_DEBUT,
      plannedEnd: DEFAULT_HEURE_FIN,
      observation: '',
      justification: '',
      forceAbsent: wouldBeZeroWorked,
    });
  };

  const confirmBulkModal = async () => {
    if (!selectedDate) return;
    const targetIds = Array.from(selectedIds);
    const count = targetIds.length;
    const { status, heureArrivee, heureDepart, plannedStart, plannedEnd, observation, justification, forceAbsent } = bulkModal;

    const isPresent = status === 'present';
    const metrics = isPresent ? calculateBulkMetrics(status, heureArrivee, heureDepart, plannedStart, plannedEnd) : { retard: 0, heuresTravaillees: 0, heuresSup: 0 };

    const isEffectivelyAbsent = forceAbsent || (isPresent && metrics.heuresTravaillees <= 0);
    const finalStatus = isEffectivelyAbsent ? 'absent' : (isPresent ? 'present' : status);

    const effectiveStatus = isEffectivelyAbsent ? 'absent' : (isPresent ? detectEffectiveStatus(status, metrics) : status);

    const fullObservation = [observation.trim(), justification.trim() ? `Justification: ${justification.trim()}` : ''].filter(Boolean).join(' | ') || null;

    const payload = {
      employe_ids: targetIds,
      date: selectedDate,
      statut: finalStatus,
      heure_arrivee: isPresent && !isEffectivelyAbsent ? `${heureArrivee}:00` : null,
      heure_depart: isPresent && !isEffectivelyAbsent ? `${heureDepart}:00` : null,
      heure_debut_planifiee: isPresent && !isEffectivelyAbsent ? plannedStart : null,
      heure_fin_planifiee: isPresent && !isEffectivelyAbsent ? plannedEnd : null,
      retard: isEffectivelyAbsent ? 0 : metrics.retard,
      heures_travaillees: isEffectivelyAbsent ? 0 : metrics.heuresTravaillees,
      heures_sup: isEffectivelyAbsent ? 0 : metrics.heuresSup,
      observation: fullObservation,
    };

    setBulkLoading(true);
    try {
      const result = await window.api.employes.bulkUpdatePresenceJournaliere(payload);
      if (result?.success === false) throw new Error(result?.error || 'Erreur backend');

      setSelectedIds(new Set());
      setBulkModal((prev) => ({ ...prev, isOpen: false }));
      await fetchPresence();

      const effectiveLabel =
        effectiveStatus === 'present' ? 'Présent' :
        effectiveStatus === 'retard' ? `Retard (${formatMinutes(metrics.retard)})` :
        effectiveStatus === 'hs' ? `Présent + HS (${formatHours(metrics.heuresSup)})` :
        effectiveStatus === 'absent' ? 'Absent' : 'Congé';

      openModal('success', 'Succès', `${count} employé(s) marqué(s) comme ${effectiveLabel}.`, () => {}, 'OK');
    } catch (error: any) {
      openModal('error', 'Erreur', error?.message || 'Une erreur est survenue.', () => {}, 'OK');
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelectEmploye = (id: number) => {
    setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const selectAllVisible = () => setSelectedIds(new Set(filteredDrawerPresences.map(p => p.employe.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const goPreviousMonth = () => { const newMonth = currentMonth === 0 ? 11 : currentMonth - 1; const newYear = currentMonth === 0 ? currentYear - 1 : currentYear; setCurrentMonth(newMonth); setCurrentYear(newYear); setSelectedDate(null); setSelectedIds(new Set()); setSearchDrawer(''); setCurrentPageDrawer(1); setStatusFilterDrawer('Tous'); onMoisChange?.(newMonth + 1); onAnneeChange?.(newYear); };
  const goNextMonth = () => { const newMonth = currentMonth === 11 ? 0 : currentMonth + 1; const newYear = currentMonth === 11 ? currentYear + 1 : currentYear; setCurrentMonth(newMonth); setCurrentYear(newYear); setSelectedDate(null); setSelectedIds(new Set()); setSearchDrawer(''); setCurrentPageDrawer(1); setStatusFilterDrawer('Tous'); onMoisChange?.(newMonth + 1); onAnneeChange?.(newYear); };
  const goToday = () => { const today = new Date(); setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); setSelectedDate(getLocalDateISO(today)); setSelectedIds(new Set()); setSearchDrawer(''); setCurrentPageDrawer(1); setStatusFilterDrawer('Tous'); };

  const handleOpenPresenceModal = (employe: any, date: string) => {
    setSelectedEmployeForPresence(employe);
    setPresenceDate(date);
    setShowPresenceModal(true);
  };

  const handleSaveDailyPresence = async (data: any) => {
    try {
      if (window.api?.employes?.updatePresenceJournaliere) await window.api.employes.updatePresenceJournaliere(data);
      await fetchPresence();
      openModal('success', 'Succès', 'Présence enregistrée avec succès.', () => {}, 'OK');
    } catch (error: any) {
      openModal('error', 'Erreur', error?.message || 'Impossible d\'enregistrer.', () => {}, 'OK');
      throw error;
    }
  };

  const handleLoadDailyPresence = async (employeId: number, date: string) => {
    try {
      if (window.api?.employes?.getPresenceJournaliere) {
        const res = await window.api.employes.getPresenceJournaliere(employeId, date);
        if (res?.success && res.data) {
          return {
            statut: res.data.statut || 'present',
            heure_arrivee: res.data.heure_arrivee || '',
            heure_depart: res.data.heure_depart || '',
            heure_debut_planifiee: res.data.heure_debut_planifiee || DEFAULT_HEURE_DEBUT,
            heure_fin_planifiee: res.data.heure_fin_planifiee || DEFAULT_HEURE_FIN,
            retard: res.data.retard || 0,
            heures_travaillees: res.data.heures_travaillees || 0,
            heures_sup: res.data.heures_sup || 0,
            observation: res.data.observation || '',
          };
        }
      }
      const records = presences[date] || {};
      const rec = records[employeId];
      if (rec) return { statut: rec.statut, heure_arrivee: rec.heureArrivee, heure_depart: rec.heureDepart, retard: rec.retard, heures_sup: rec.heuresSup, observation: rec.observation };
      return null;
    } catch (error) { console.error('Erreur load presence:', error); return null; }
  };

  const bulkMetrics = useMemo(() => {
    if (!bulkModal.isOpen) return { retard: 0, heuresTravaillees: 0, heuresSup: 0 };
    return calculateBulkMetrics(bulkModal.status, bulkModal.heureArrivee, bulkModal.heureDepart, bulkModal.plannedStart, bulkModal.plannedEnd);
  }, [bulkModal]);

  const hasSelection = selectedIds.size > 0;
  const allVisibleSelected = filteredDrawerPresences.length > 0 && filteredDrawerPresences.every(p => selectedIds.has(p.employe.id));

  return (
    <div className="flex min-h-full flex-col bg-white dark:bg-[#0F172A]">
      <div className="shrink-0 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><CalendarDays size={20} strokeWidth={2.2} /></div>
            <div>
              <h2 className="text-[15.5px] font-semibold leading-tight text-slate-900 dark:text-slate-100">Calendrier RH</h2>
              <p className="mt-0.5 text-[13.5px] leading-[1.3] text-slate-500 dark:text-slate-400">Suivi des pointages, retards et heures supp.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={goPreviousMonth} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-slate-700"><ChevronLeft size={16} strokeWidth={2.2} /></button>
            <div className="min-w-[160px] text-center"><p className="text-[15.5px] font-semibold text-slate-900 dark:text-slate-100">{MONTHS[currentMonth]} {currentYear}</p></div>
            <button type="button" onClick={goNextMonth} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-slate-700"><ChevronRight size={16} strokeWidth={2.2} /></button>
            <button type="button" onClick={goToday} className="ml-1 h-9 rounded-lg border border-brand-200 bg-brand-50 px-4 text-[14.5px] font-semibold text-brand-600 transition-colors hover:bg-brand-100 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-400">Aujourd'hui</button>
            <button type="button" onClick={() => setShowHistorique(true)} className="ml-1 h-9 rounded-lg border border-slate-200 bg-white px-4 text-[14.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-700 flex items-center gap-1.5"><History size={15} strokeWidth={2.2} /> Historique</button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-4 pb-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <CalendarStatCard icon={<UserCheck size={20} strokeWidth={2.2} />} label="Présents" value={`${currentMonthStats.uniquePresents} / ${currentMonthStats.totalEmployes}`} accentKey="presents" />
          <CalendarStatCard icon={<TrendingUp size={20} strokeWidth={2.2} />} label="Taux de Présence" value={`${currentMonthStats.presenceRate}%`} accentKey="presence" />
          <CalendarStatCard icon={<Clock3 size={20} strokeWidth={2.2} />} label="Retards" value={currentMonthStats.retardDays} accentKey="retard" />
          <CalendarStatCard icon={<XCircle size={20} strokeWidth={2.2} />} label="Absences" value={currentMonthStats.absentDays} accentKey="absence" />
          <CalendarStatCard icon={<Timer size={20} strokeWidth={2.2} />} label="Heures Supp." value={`${currentMonthStats.hsMinutes}h`} accentKey="heuresSup" />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.02]">
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">Légende :</span>
          {ICON_LEGEND.map(({ Icon, label, color }) => (
            <div key={label} className="flex items-center gap-1.5"><Icon size={15} strokeWidth={2.2} className={color} /><span className={`text-[13px] font-medium leading-[1.3] ${color}`}>{label}</span></div>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="w-full">
          <div className="min-w-[720px] overflow-hidden rounded-xl border-[0.5px] border-slate-200 dark:border-white/[0.12]">
            <div className="grid grid-cols-7 border-b border-slate-300 bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.02]">
              {WEEK_DAYS.map((day) => (<div key={day} className="px-2 py-2.5 text-center text-[13px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{day}</div>))}
            </div>
            <div className="grid grid-cols-7">
              {calendarCells.map((day, index) => {
                if (day === null) return <div key={`empty-${index}`} className="min-h-[105px] border-b border-r border-slate-300 bg-slate-50/50 dark:border-white/[0.08] dark:bg-white/[0.02]" />;
                const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayRecords = presences[dateKey] || {};
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;
                return <CalendarDay key={dateKey} day={day} dateKey={dateKey} dayRecords={dayRecords} isToday={isToday} isSelected={isSelected} onClick={() => setSelectedDate(isSelected ? null : dateKey)} />;
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedDate && (<div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => { setSelectedDate(null); setSelectedIds(new Set()); setSearchDrawer(''); setCurrentPageDrawer(1); setStatusFilterDrawer('Tous'); }} />)}

      {selectedDate && (
        <div className={`fixed inset-y-0 right-0 z-[9999] flex flex-col border-l ${isDark ? 'border-white/[0.12] bg-[#0F172A]' : 'border-slate-200 bg-white'} shadow-[0_18px_55px_rgba(15,23,42,0.35)]`} style={{ width: isDrawerExpanded ? '100%' : '35%', transition: 'width 0.3s ease' }}>
          <div className={`shrink-0 border-b border-slate-200 dark:border-white/[0.08] ${isDrawerExpanded ? 'px-6 py-4' : 'px-4 py-3'}`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className={`truncate font-semibold text-slate-900 dark:text-slate-100 ${isDrawerExpanded ? 'text-[16.5px]' : 'text-[14.5px]'}`}>Présences du {selectedDate.split('-').reverse().join('/')}</p>
                <p className={`mt-0.5 truncate text-slate-500 dark:text-slate-400 ${isDrawerExpanded ? 'text-[14.5px]' : 'text-[13.5px] leading-[1.3]'}`}>
                  {hasSelection ? `✓ ${selectedIds.size} employé(s) sélectionné(s)` : `${filteredDrawerPresences.length} employé(s) affiché(s)`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setIsDrawerExpanded(prev => !prev)} className={`flex items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06] ${isDrawerExpanded ? 'h-10 w-10' : 'h-8 w-8'}`}>{isDrawerExpanded ? <Minimize2 size={19} strokeWidth={2.2} /> : <Maximize2 size={16} strokeWidth={2.2} />}</button>
                <button onClick={() => { setSelectedDate(null); setSelectedIds(new Set()); setSearchDrawer(''); setCurrentPageDrawer(1); setStatusFilterDrawer('Tous'); }} className={`flex items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${isDrawerExpanded ? 'h-10 w-10' : 'h-8 w-8'}`}><X size={isDrawerExpanded ? 19 : 16} strokeWidth={2.2} /></button>
              </div>
            </div>

            {hasSelection && (
              <div className="mt-4 rounded-xl border-2 border-brand-200 bg-brand-50 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
                <p className="mb-2.5 text-[12.5px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  ↓ Appliquer le statut aux {selectedIds.size} employé(s) sélectionné(s) :
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => openBulkModal('present')} disabled={bulkLoading} className={`inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-emerald-300 bg-white font-semibold text-emerald-700 transition-all hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-500/40 dark:bg-[#0F172A] dark:text-emerald-400 dark:hover:border-emerald-500 dark:hover:bg-emerald-500/10 ${isDrawerExpanded ? 'px-4 py-2.5 text-[15.5px]' : 'px-3 py-2 text-[14px]'}`}>
                    <CheckCircle2 size={isDrawerExpanded ? 17 : 15} strokeWidth={2.2} /> Présent
                  </button>
                  <button onClick={() => openBulkModal('absent')} disabled={bulkLoading} className={`inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-red-300 bg-white font-semibold text-red-700 transition-all hover:border-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-500/40 dark:bg-[#0F172A] dark:text-red-400 dark:hover:border-red-500 dark:hover:bg-red-500/10 ${isDrawerExpanded ? 'px-4 py-2.5 text-[15.5px]' : 'px-3 py-2 text-[14px]'}`}>
                    <XCircle size={isDrawerExpanded ? 17 : 15} strokeWidth={2.2} /> Absent
                  </button>
                  <button onClick={() => openBulkModal('conge')} disabled={bulkLoading} className={`inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-purple-300 bg-white font-semibold text-purple-700 transition-all hover:border-purple-500 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-purple-500/40 dark:bg-[#0F172A] dark:text-purple-400 dark:hover:border-purple-500 dark:hover:bg-purple-500/10 ${isDrawerExpanded ? 'px-4 py-2.5 text-[15.5px]' : 'px-3 py-2 text-[14px]'}`}>
                    <Palmtree size={isDrawerExpanded ? 17 : 15} strokeWidth={2.2} /> Congé
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <button onClick={clearSelection} className="text-[12px] font-medium text-slate-500 underline-offset-2 hover:text-brand-600 hover:underline dark:text-slate-400 dark:hover:text-brand-400">Tout désélectionner</button>
                  {bulkLoading && <div className="flex items-center gap-1.5 text-[12px] text-brand-600 dark:text-brand-400"><Loader2 size={13} strokeWidth={2.2} className="animate-spin" /> Enregistrement...</div>}
                </div>
              </div>
            )}

            {!hasSelection && filteredDrawerPresences.length > 0 && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <CheckSquare size={15} strokeWidth={2.2} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <div className="text-[12.5px] leading-[1.4] text-slate-500 dark:text-slate-400">
                  <p className="font-semibold mb-0.5">Deux options :</p>
                  <p>• <strong>Cliquez sur une carte</strong> → pointage individuel (heures personnalisées)</p>
                  <p>• <strong>Cochez plusieurs cartes</strong> → action groupée (même statut/heure)</p>
                </div>
              </div>
            )}
          </div>

          <div className={`flex-1 overflow-y-auto ${isDrawerExpanded ? 'px-6 py-4' : 'px-4 py-3'}`}>
            <div className={isDrawerExpanded ? 'max-w-[1600px] mx-auto' : ''}>
              <div className={`relative ${isDrawerExpanded ? 'mb-5' : 'mb-3'}`}>
                <Search size={isDrawerExpanded ? 19 : 15} strokeWidth={2.2} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isDrawerExpanded ? 'left-3.5' : 'left-2.5'}`} />
                <input type="text" placeholder="Rechercher un employé..." value={searchDrawer} onChange={(e) => { setSearchDrawer(e.target.value); setCurrentPageDrawer(1); }} className={`w-full rounded-lg border border-slate-200 bg-white dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-100 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none ${isDrawerExpanded ? 'h-11 pl-11 pr-4 text-[15.5px]' : 'h-10 pl-9 pr-3 text-[14.5px]'}`} />
              </div>

              <div className={`flex flex-wrap ${isDrawerExpanded ? 'gap-2 mb-6' : 'gap-1 mb-3'}`}>
                {FILTRE_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => { setStatusFilterDrawer(opt.value); setCurrentPageDrawer(1); }} className={`rounded-md font-semibold transition-colors ${isDrawerExpanded ? 'px-4 py-2 text-[15.5px]' : 'px-3 py-1.5 text-[14.5px]'} ${statusFilterDrawer === opt.value ? (opt.value === 'present' ? 'bg-emerald-500 text-white' : opt.value === 'retard' ? 'bg-amber-500 text-white' : opt.value === 'absent' ? 'bg-red-500 text-white' : opt.value === 'hs' ? 'bg-sky-500 text-white' : opt.value === 'conge' ? 'bg-amber-500 text-white' : 'bg-brand-500 text-white') : 'bg-slate-100 text-slate-600 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.06]'}`}>{opt.label}</button>
                ))}
              </div>

              {filteredDrawerPresences.length > 0 && (
                <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-white/[0.08] dark:bg-[#0F172A]">
                  <button onClick={() => allVisibleSelected ? clearSelection() : selectAllVisible()} className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
                    {allVisibleSelected ? <CheckSquare size={16} strokeWidth={2.2} /> : <Square size={16} strokeWidth={2.2} />}
                    {allVisibleSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                  {hasSelection && <span className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400">{selectedIds.size} sélectionné(s)</span>}
                </div>
              )}

              {paginatedDrawerPresences.length === 0 ? (
                <div className={`rounded-lg border border-dashed border-slate-300 bg-white text-center dark:border-white/[0.12] dark:bg-[#0F172A] ${isDrawerExpanded ? 'px-8 py-10' : 'px-5 py-4'}`}>
                  <Clock3 size={isDrawerExpanded ? 32 : 19} strokeWidth={2.2} className="mx-auto text-slate-300 dark:text-slate-600" />
                  <p className={`mt-3 font-medium text-slate-500 dark:text-slate-400 ${isDrawerExpanded ? 'text-[15.5px]' : 'text-[14.5px]'}`}>Aucune donnée de présence.</p>
                </div>
              ) : (
                <div className={isDrawerExpanded ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5' : 'space-y-2'}>
                  {paginatedDrawerPresences.map(({ employe, status, retard, heuresSup, heureArrivee, heureDepart, hasRecord }) => {
                    const showHours = isPresentTypeStatus(status);
                    const isChecked = selectedIds.has(employe.id);
                    return (
                      <div key={employe.id} className={`rounded-xl border-[0.5px] transition-colors cursor-pointer ${isDrawerExpanded ? 'p-5' : 'p-3'} ${isChecked ? 'border-brand-400 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/10' : 'border-slate-200 bg-white hover:border-brand-300 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-brand-500/30'}`} onClick={(e) => { e.stopPropagation(); toggleSelectEmploye(employe.id); }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-start gap-2.5">
                            <button type="button" onClick={(e) => { e.stopPropagation(); toggleSelectEmploye(employe.id); }} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${isChecked ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 bg-white hover:border-brand-400 dark:border-white/[0.20] dark:bg-[#0F172A]'}`}>
                              {isChecked && <CheckSquare size={13} strokeWidth={3} />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate font-semibold text-slate-900 dark:text-slate-100 ${isDrawerExpanded ? 'text-[15.5px]' : 'text-[15px]'}`}>{getEmployeeName(employe)}</p>
                              {employe.poste && (<p className={`mt-1 truncate text-slate-500 dark:text-slate-400 ${isDrawerExpanded ? 'text-[14px]' : 'text-[13.5px] leading-[1.3]'}`}>{employe.poste}</p>)}
                            </div>
                          </div>
                          <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border font-semibold ${getStatusInfo(status || '').color} ${isDrawerExpanded ? 'px-3 py-1 text-[14px]' : 'px-2 py-1 text-[13.5px]'}`}>
                            {getStatusInfo(status || '').icon}{getStatusInfo(status || '').label}
                          </span>
                        </div>
                        <div className={`flex items-end justify-between gap-2 ${isDrawerExpanded ? 'mt-4' : 'mt-3'}`}>
                          <div className={`min-w-0 flex-1 text-slate-500 dark:text-slate-400 ${isDrawerExpanded ? 'text-[14px]' : 'text-[13.5px] leading-[1.3]'}`}>
                            {showHours ? (
                              <>
                                <div className={isDrawerExpanded ? 'font-mono text-[14.5px] font-medium' : ''}>{heureArrivee || '--:--'} → {heureDepart || '--:--'}</div>
                                {retard > 0 && (<div className={`text-amber-600 font-semibold ${isDrawerExpanded ? 'mt-1 text-[14px]' : ''}`}>Retard: {retard} min</div>)}
                                {heuresSup > 0 && (<div className={`text-sky-600 font-semibold ${isDrawerExpanded ? 'mt-1 text-[14px]' : ''}`}>HS: {heuresSup}h</div>)}
                              </>
                            ) : (
                              <div className="text-[12.5px] italic text-slate-400 dark:text-slate-500">{status === 'absent' ? 'Aucun pointage' : status === 'conge' ? 'En congé' : status === 'non_pointe' ? 'Non pointé' : status === 'en_attente' ? 'En attente' : '—'}</div>
                            )}
                          </div>

                          {/* ⭐⭐⭐ Boutons Modifier + Supprimer ⭐⭐⭐ */}
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleOpenPresenceModal(employe, selectedDate!); }}
                              title={hasRecord ? 'Modifier le pointage' : 'Ajouter un pointage'}
                              className={`flex items-center justify-center rounded-md text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-500/10 ${isDrawerExpanded ? 'h-7 w-7' : 'h-6 w-6'}`}
                            >
                              <Pencil size={isDrawerExpanded ? 15 : 13} strokeWidth={2.2} />
                            </button>
                            {hasRecord && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openDeletePresenceModal(employe, selectedDate!); }}
                                title="Supprimer le pointage"
                                className={`flex items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 ${isDrawerExpanded ? 'h-7 w-7' : 'h-6 w-6'}`}
                              >
                                <Trash2 size={isDrawerExpanded ? 15 : 13} strokeWidth={2.2} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {totalDrawerPages > 1 && (
            <div className={`shrink-0 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between ${isDrawerExpanded ? 'px-6 py-4' : 'px-4 py-3'}`}>
              <button type="button" disabled={currentPageDrawer === 1} onClick={() => setCurrentPageDrawer((p) => Math.max(1, p - 1))} className={`flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06] ${isDrawerExpanded ? 'h-10 w-10' : 'h-9 w-9'}`}><ChevronLeft size={isDrawerExpanded ? 19 : 16} strokeWidth={2.2} /></button>
              <span className={`font-semibold text-slate-500 dark:text-slate-400 ${isDrawerExpanded ? 'text-[14.5px]' : 'text-[14px]'}`}>Page {currentPageDrawer} / {totalDrawerPages}</span>
              <button type="button" disabled={currentPageDrawer === totalDrawerPages} onClick={() => setCurrentPageDrawer((p) => Math.min(totalDrawerPages, p + 1))} className={`flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06] ${isDrawerExpanded ? 'h-10 w-10' : 'h-9 w-9'}`}><ChevronRight size={isDrawerExpanded ? 19 : 16} strokeWidth={2.2} /></button>
            </div>
          )}
        </div>
      )}

      {bulkModal.isOpen && selectedDate && createPortal(
        <BulkPresenceModal
          isOpen={bulkModal.isOpen}
          isDark={isDark}
          status={bulkModal.status}
          date={selectedDate}
          count={selectedIds.size}
          heureArrivee={bulkModal.heureArrivee}
          heureDepart={bulkModal.heureDepart}
          plannedStart={bulkModal.plannedStart}
          plannedEnd={bulkModal.plannedEnd}
          observation={bulkModal.observation}
          justification={bulkModal.justification}
          metrics={bulkMetrics}
          loading={bulkLoading}
          forceAbsent={bulkModal.forceAbsent}
          onForceAbsentChange={(v) => setBulkModal((prev) => ({ ...prev, forceAbsent: v }))}
          onHeureArriveeChange={(v) => setBulkModal((prev) => ({ ...prev, heureArrivee: v }))}
          onHeureDepartChange={(v) => setBulkModal((prev) => ({ ...prev, heureDepart: v }))}
          onPlannedStartChange={(v) => setBulkModal((prev) => ({ ...prev, plannedStart: v }))}
          onPlannedEndChange={(v) => setBulkModal((prev) => ({ ...prev, plannedEnd: v }))}
          onObservationChange={(v) => setBulkModal((prev) => ({ ...prev, observation: v }))}
          onJustificationChange={(v) => setBulkModal((prev) => ({ ...prev, justification: v }))}
          onClose={() => setBulkModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={confirmBulkModal}
        />,
        document.body
      )}

      {/* ⭐⭐⭐ DELETE PRESENCE MODAL — MESSAGE FRANÇAIS ⭐⭐⭐ */}
      {deletePresenceModal.isOpen && deletePresenceModal.employe && createPortal(
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget && !deletePresenceModal.loading) cancelDeletePresence(); }}>
          <div className="relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.35)] dark:border-white/[0.12] dark:bg-[#0F172A]">
            <div className="absolute left-0 right-0 top-0 h-[2px] bg-red-500" />

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  <Trash2 size={18} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-[16px] font-semibold text-slate-900 dark:text-slate-100">Supprimer le pointage</h2>
                  <p className="mt-0.5 truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">
                    {getEmployeeName(deletePresenceModal.employe)} — {deletePresenceModal.date.split('-').reverse().join('/')}
                  </p>
                </div>
              </div>
              <button type="button" onClick={cancelDeletePresence} disabled={deletePresenceModal.loading} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-500 disabled:opacity-50 dark:hover:bg-white/[0.06]">
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            <div className="px-5 py-5">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-500/25 dark:bg-red-500/10">
                <p className="text-[13.5px] font-semibold text-red-700 dark:text-red-400">
                  ⚠️ Cette action est irréversible
                </p>
                <p className="mt-1 text-[12.5px] leading-[1.4] text-red-700/80 dark:text-red-300/80">
                  Le pointage du <strong>{deletePresenceModal.date.split('-').reverse().join('/')}</strong> pour <strong>{getEmployeeName(deletePresenceModal.employe)}</strong> sera définitivement supprimé. Cette action ne peut pas être annulée.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/[0.08] dark:bg-[#0F172A]">
              <button type="button" onClick={cancelDeletePresence} disabled={deletePresenceModal.loading} className="h-10 rounded-lg border border-slate-200 px-4 text-[14.5px] font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]">
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeletePresence}
                disabled={deletePresenceModal.loading}
                className="flex h-10 items-center gap-2 rounded-lg bg-red-500 px-5 text-[14.5px] font-semibold text-white shadow-sm transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletePresenceModal.loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Trash2 size={16} strokeWidth={2.2} />
                )}
                {deletePresenceModal.loading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <EmployesHistoriqueModal isOpen={showHistorique} onClose={() => { setShowHistorique(false); setSelectedEmployeForHistory(null); }} employeId={selectedEmployeForHistory?.id} mois={currentMonth + 1} annee={currentYear} dateReference={selectedDate} />

      <EmployesPresenceModal
        isOpen={showPresenceModal}
        onClose={() => { setShowPresenceModal(false); setSelectedEmployeForPresence(null); setPresenceDate(null); }}
        employe={selectedEmployeForPresence}
        mode="daily"
        date={presenceDate || undefined}
        onSaveDaily={handleSaveDailyPresence}
        loadPresenceJournaliere={handleLoadDailyPresence}
      />

      <ConfirmModal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} confirmText={modalState.confirmText} cancelText={modalState.cancelText} confirmColor={modalState.type === 'error' ? 'red' : 'green'} isDark={isDark} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// BULK PRESENCE MODAL
// ════════════════════════════════════════════════════════════

interface BulkPresenceModalProps {
  isOpen: boolean; isDark: boolean; status: 'present' | 'absent' | 'conge';
  date: string; count: number;
  heureArrivee: string; heureDepart: string; plannedStart: string; plannedEnd: string;
  observation: string; justification: string;
  metrics: { retard: number; heuresTravaillees: number; heuresSup: number };
  loading: boolean; forceAbsent: boolean;
  onForceAbsentChange: (v: boolean) => void;
  onHeureArriveeChange: (v: string) => void; onHeureDepartChange: (v: string) => void;
  onPlannedStartChange: (v: string) => void; onPlannedEndChange: (v: string) => void;
  onObservationChange: (v: string) => void; onJustificationChange: (v: string) => void;
  onClose: () => void; onConfirm: () => void;
}

const BulkPresenceModal: React.FC<BulkPresenceModalProps> = ({
  isOpen, isDark, status, date, count,
  heureArrivee, heureDepart, plannedStart, plannedEnd, observation, justification,
  metrics, loading, forceAbsent,
  onForceAbsentChange,
  onHeureArriveeChange, onHeureDepartChange, onPlannedStartChange, onPlannedEndChange, onObservationChange, onJustificationChange,
  onClose, onConfirm,
}) => {
  if (!isOpen) return null;

  const isPresent = status === 'present';
  const detectedStatus = forceAbsent ? 'absent' : (isPresent ? detectEffectiveStatus(status, metrics) : status);
  const hasZeroWorked = isPresent && metrics.heuresTravaillees <= 0;

  const arrivalMin = timeToMinutes(heureArrivee);
  const plannedEndMin = timeToMinutes(plannedEnd);
  const isArrivalAfterEnd = isPresent && arrivalMin !== null && plannedEndMin !== null && arrivalMin >= plannedEndMin;

  const statusLabel =
    detectedStatus === 'present' ? 'Présent' :
    detectedStatus === 'retard'  ? `Retard (${formatMinutes(metrics.retard)})` :
    detectedStatus === 'hs'      ? `Présent + HS (${formatHours(metrics.heuresSup)})` :
    detectedStatus === 'absent'  ? 'Absent' : 'Congé';

  const statusIcon =
    detectedStatus === 'present' ? <CheckCircle2 size={18} strokeWidth={2.2} /> :
    detectedStatus === 'retard'  ? <Clock3 size={18} strokeWidth={2.2} /> :
    detectedStatus === 'hs'      ? <Timer size={18} strokeWidth={2.2} /> :
    detectedStatus === 'absent'  ? <XCircle size={18} strokeWidth={2.2} /> :
    <Palmtree size={18} strokeWidth={2.2} />;

  const statusColor =
    detectedStatus === 'present' ? 'text-emerald-600 dark:text-emerald-400' :
    detectedStatus === 'retard'  ? 'text-amber-600 dark:text-amber-400' :
    detectedStatus === 'hs'      ? 'text-sky-600 dark:text-sky-400' :
    detectedStatus === 'absent'  ? 'text-red-600 dark:text-red-400' :
    'text-purple-600 dark:text-purple-400';

  const isRetardSuspect = !forceAbsent && detectedStatus === 'retard' && metrics.retard >= RETARD_SUSPECT_MIN;
  const dateFR = date.split('-').reverse().join('/');
  const isAbsent = detectedStatus === 'absent';

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative flex max-h-[92vh] w-full max-w-[600px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.35)] dark:border-white/[0.12] dark:bg-[#0F172A]">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-white/[0.08]">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${statusColor} bg-slate-100 dark:bg-white/[0.05]`}>{statusIcon}</div>
            <div className="min-w-0">
              <h2 className="truncate text-[17px] font-semibold text-slate-900 dark:text-slate-100">{statusLabel} — {count} employé(s)</h2>
              <p className="mt-0.5 truncate text-[13.5px] leading-[1.3] text-slate-500 dark:text-slate-400">Date : {dateFR}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-white/[0.06]"><X size={18} strokeWidth={2.2} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {isPresent ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <div><label className="mb-1.5 block text-[13px] font-semibold text-slate-500 dark:text-slate-400">Début prévu</label><TimePicker value={plannedStart} onChange={onPlannedStartChange} isDark={isDark} showSeconds={false} placeholder="08:00" /></div>
                <div><label className="mb-1.5 block text-[13px] font-semibold text-slate-500 dark:text-slate-400">Fin prévue</label><TimePicker value={plannedEnd} onChange={onPlannedEndChange} isDark={isDark} showSeconds={false} placeholder="17:00" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1.5 block text-[14px] font-semibold text-slate-500 dark:text-slate-400">Heure d'arrivée</label><TimePicker value={heureArrivee} onChange={onHeureArriveeChange} isDark={isDark} showSeconds={false} placeholder="--:--" /></div>
                <div><label className="mb-1.5 block text-[14px] font-semibold text-slate-500 dark:text-slate-400">Heure de départ</label><TimePicker value={heureDepart} onChange={onHeureDepartChange} isDark={isDark} showSeconds={false} placeholder="--:--" /></div>
              </div>

              {hasZeroWorked && (
                <div className="rounded-lg border-2 border-red-400 bg-red-50 p-4 dark:border-red-500/60 dark:bg-red-500/10">
                  <p className="text-[13.5px] font-bold text-red-800 dark:text-red-300">⚠️ Aucune heure travaillée (0h00)</p>
                  <p className="mt-1 text-[12.5px] leading-[1.4] text-red-700/90 dark:text-red-300/80">
                    L'heure d'arrivée dépasse la fin prévue. L'employé sera marqué <strong>Absent</strong> par défaut. Changez ci-dessous si vous voulez le marquer en retard.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => onForceAbsentChange(false)} className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-[13.5px] font-semibold transition-all ${!forceAbsent ? 'border-amber-500 bg-amber-500 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300'}`}>
                      <Clock3 size={16} strokeWidth={2.2} /> Retard
                    </button>
                    <button type="button" onClick={() => onForceAbsentChange(true)} className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-[13.5px] font-semibold transition-all ${forceAbsent ? 'border-red-500 bg-red-500 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300'}`}>
                      <XCircle size={16} strokeWidth={2.2} /> Absent
                    </button>
                  </div>
                </div>
              )}

              {isRetardSuspect && !hasZeroWorked && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-3.5 dark:border-red-500/40 dark:bg-red-500/10">
                  <p className="text-[13.5px] font-bold text-red-700 dark:text-red-400">Retard inhabituel détecté</p>
                  <p className="mt-1 text-[12.5px] leading-[1.4] text-red-700/80 dark:text-red-300/80">Le retard ({formatMinutes(metrics.retard)}) dépasse 4 heures.</p>
                </div>
              )}

              {!forceAbsent && (
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 dark:border-white/[0.08] dark:bg-white/[0.08]">
                  <div className="bg-white px-3 py-3 dark:bg-[#0F172A]">
                    <div className={`flex items-center gap-1.5 text-[12.5px] font-semibold ${metrics.retard > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}><AlertTriangle size={13} strokeWidth={2.2} /><span>Retard</span></div>
                    <p className="mt-1 text-[15px] font-bold text-slate-900 dark:text-slate-100">{formatMinutes(metrics.retard)}</p>
                  </div>
                  <div className="bg-white px-3 py-3 dark:bg-[#0F172A]">
                    <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-600 dark:text-brand-400"><Clock3 size={13} strokeWidth={2.2} /><span>Travaillé</span></div>
                    <p className="mt-1 text-[15px] font-bold text-slate-900 dark:text-slate-100">{formatHours(metrics.heuresTravaillees)}</p>
                  </div>
                  <div className="bg-white px-3 py-3 dark:bg-[#0F172A]">
                    <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-violet-600 dark:text-violet-400"><Timer size={13} strokeWidth={2.2} /><span>Heures sup.</span></div>
                    <p className="mt-1 text-[15px] font-bold text-slate-900 dark:text-slate-100">{formatHours(metrics.heuresSup)}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
              <p className="text-[14px] text-slate-600 dark:text-slate-300">Aucun horaire requis pour le statut <strong>{statusLabel}</strong>.</p>
              <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">{count} employé(s) seront marqués comme {status === 'absent' ? 'absent' : 'congé'}.</p>
            </div>
          )}

          {isAbsent && (
            <div className="mt-4">
              <label className="mb-1.5 block text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={justification}
                onChange={(e) => onJustificationChange(e.target.value)}
                placeholder="Raison de l'absence (maladie, urgence familiale, ...)"
                className="w-full resize-none rounded-lg border border-red-200 bg-red-50/30 px-3.5 py-2.5 text-[14.5px] text-slate-900 outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/30 dark:bg-red-500/5 dark:text-slate-100"
              />
              <p className="mt-1 text-[11.5px] italic text-slate-500 dark:text-slate-500">
                Obligatoire pour justifier l'absence dans le dossier RH.
              </p>
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1.5 block text-[14px] font-semibold text-slate-500 dark:text-slate-400">Observation (optionnel)</label>
            <textarea rows={2} value={observation} onChange={(e) => onObservationChange(e.target.value)} placeholder="Remarque, justification..." className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[14.5px] text-slate-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-100" />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/[0.08] dark:bg-[#0F172A]">
          <button type="button" onClick={onClose} disabled={loading} className="h-10 rounded-lg border border-slate-200 px-4 text-[14.5px] font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]">Annuler</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || (isAbsent && !justification.trim())}
            className="flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-[14.5px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save size={16} strokeWidth={2.2} />}
            {loading ? 'Enregistrement...' : `Appliquer à ${count}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// CALENDAR DAY
// ════════════════════════════════════════════════════════════

function CalendarDay({ day, dateKey, dayRecords, isToday, isSelected, onClick }: {
  day: number; dateKey: string;
  dayRecords: Record<number, { statut: string; retard?: number; heuresSup?: number; heureArrivee?: string; heureDepart?: string }>;
  isToday: boolean; isSelected: boolean; onClick: () => void;
}) {
  const records = Object.values(dayRecords || {});
  const totalCount = records.length;

  const counts = useMemo(() => {
    const acc: Record<string, number> = { present: 0, retard: 0, hs: 0, absent: 0, conge: 0, non_pointe: 0 };
    for (const rec of records) {
      const effective = getEffectiveStatus(rec.statut, Number(rec.retard || 0), Number(rec.heuresSup || 0));
      if (acc[effective] !== undefined) acc[effective]++;
    }
    return acc;
  }, [records]);

  const badges = [
    { key: 'present', count: counts.present, Icon: CheckCircle2, label: 'Présent', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25' },
    { key: 'retard', count: counts.retard, Icon: Clock3, label: 'Retard', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25' },
    { key: 'hs', count: counts.hs, Icon: Timer, label: 'Heures Supp.', cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25' },
    { key: 'absent', count: counts.absent, Icon: XCircle, label: 'Absent', cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25' },
    { key: 'conge', count: counts.conge, Icon: Palmtree, label: 'Congé', cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/25' },
  ].filter(b => b.count > 0);

  return (
    <button type="button" onClick={onClick} className={`relative min-h-[105px] border-b border-r border-slate-300 bg-white p-2 text-left transition-colors hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#0F172A] dark:hover:bg-white/[0.02] ${isSelected ? 'bg-brand-50 ring-2 ring-inset ring-brand-400 dark:bg-brand-500/10' : ''}`}>
      <div className="flex items-center justify-between">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[14px] font-semibold ${isToday ? 'bg-brand-500 text-white' : 'text-slate-700 dark:text-slate-200'}`}>{day}</span>
        {totalCount > 0 && (<span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11.5px] font-bold tabular-nums text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">{totalCount}</span>)}
      </div>
      {totalCount > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {badges.map(({ key, count, Icon, label, cls }) => (
            <span key={key} title={`${count} ${label}`} aria-label={`${count} ${label}`} className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums ${cls}`}>
              <Icon size={10} strokeWidth={2.5} /><span>{count}</span>
            </span>
          ))}
        </div>
      ) : (<div className="mt-5 text-center text-[13.5px] text-slate-300 dark:text-slate-600">—</div>)}
      {isToday && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-500" />}
      <span className="sr-only">{dateKey}</span>
    </button>
  );
}