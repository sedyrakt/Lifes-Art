import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock3,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  CheckSquare,
  Square,
  History,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import EmployesHistoriqueModal from './EmployesHistoriqueModal';
import ConfirmModal from '../common/ConfirmModal';
import { useTheme } from '../../contexts/ThemeContext';

interface EmployesCalendrierProps {
  employes: any[];
  mois: number;
  annee: number;
  onMoisChange?: (mois: number) => void;
  onAnneeChange?: (annee: number) => void;
  onJourClick?: (employeId: number, date: string) => void;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const ITEMS_PER_PAGE_DRAWER = 4;

function getLocalDateISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getEmployeeName(employe: any): string {
  return `${employe.prenom ?? ''} ${employe.nom ?? ''}`.trim() || 'Employé';
}

function getStatusInfo(status: string) {
  const s = status.toLowerCase();
  if (s === 'present') return { label: 'Présent', color: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400', icon: <CheckCircle2 size={12} /> };
  if (s === 'absent') return { label: 'Absent', color: 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400', icon: <XCircle size={12} /> };
  if (s === 'conge') return { label: 'Congé', color: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400', icon: <AlertCircle size={12} /> };
  if (s === 'non_pointe' || s === 'non pointé' || s === 'non pointe') return { label: 'Non pointé', color: 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400', icon: <XCircle size={12} /> };
  if (s === 'en_attente' || s === 'en attente') return { label: 'En attente', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', icon: <Clock3 size={12} /> };
  return { label: s || 'En attente', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', icon: <Clock3 size={12} /> };
}

export default function EmployesCalendrier({
  employes, mois, annee, onMoisChange, onAnneeChange, onJourClick,
}: EmployesCalendrierProps) {
  const { isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(mois - 1);
  const [currentYear, setCurrentYear] = useState(annee);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [presences, setPresences] = useState<Record<string, Record<number, string>>>({});
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchDrawer, setSearchDrawer] = useState('');
  const [currentPageDrawer, setCurrentPageDrawer] = useState(1);
  // ⭐ VAOVAO: FANITSO "En attente" sy "Non pointé"
  const [statusFilterDrawer, setStatusFilterDrawer] = useState<'Tous' | 'Présent' | 'Absent' | 'Congé' | 'En attente' | 'Non pointé'>('Tous');
  const [showHistorique, setShowHistorique] = useState(false);
  const [selectedEmployeForHistory, setSelectedEmployeForHistory] = useState<any | null>(null);
  const [modalState, setModalState] = useState<{
    type: 'confirm' | 'success' | 'error';
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  }>({
    type: 'confirm',
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    onConfirm: () => {},
  });
  const todayKey = getLocalDateISO();

  // ⭐ VAOVAO: State ho an'ny drawer fullscreen
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

  const fetchPresence = useCallback(async () => {
    if (!window.api?.employes?.getPresenceJournaliereMois) return;
    setLoading(true);
    const newPresences: Record<string, Record<number, string>> = {};
    try {
      const response = await window.api.employes.getPresenceJournaliereMois(currentMonth + 1, currentYear);
      if (response?.success && Array.isArray(response.data)) {
        response.data.forEach((rec: any) => {
          const date = rec.date;
          const empId = rec.employe_id;
          const status = rec.statut;
          if (date && empId && status) {
            if (!newPresences[date]) newPresences[date] = {};
            newPresences[date][empId] = status;
          }
        });
      }
    } catch (error) {
      console.error('Erreur bulk load presence:', error);
    }
    setPresences(newPresences);
    setLoading(false);
  }, [currentMonth, currentYear]);

  useEffect(() => { void fetchPresence(); }, [fetchPresence]);

  const currentMonthStats = useMemo(() => {
    let presentDays = 0, absentDays = 0, congeDays = 0, nonPointeDays = 0;
    const employeesWithPresence = new Set<number>();
    Object.keys(presences).forEach((date) => {
      if (!date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-`)) return;
      const records = presences[date];
      Object.keys(records).forEach((empId) => {
        const status = records[Number(empId)];
        if (status === 'present') presentDays++;
        else if (status === 'absent') absentDays++;
        else if (status === 'conge') congeDays++;
        else if (status === 'non_pointe') nonPointeDays++;
        employeesWithPresence.add(Number(empId));
      });
    });
    return { presentDays, absentDays, congeDays, nonPointeDays, employeesWithPresence };
  }, [presences, currentYear, currentMonth]);

  const selectedDatePresences = useMemo(() => {
    if (!selectedDate) return [];
    const records = presences[selectedDate] || {};
    const search = searchDrawer.trim().toLowerCase();
    return employes
      .filter((emp) => `${emp.prenom ?? ''} ${emp.nom ?? ''}`.toLowerCase().includes(search))
      .map((emp) => {
        const rawStatus = records[emp.id] || null;
        let status: string;
        if (rawStatus) {
          status = rawStatus;
        } else {
          if (selectedDate < todayKey) {
            status = 'non_pointe';
          } else {
            status = 'en_attente';
          }
        }
        return { employe: emp, status };
      });
  }, [selectedDate, presences, employes, searchDrawer, todayKey]);

  const filteredDrawerPresences = useMemo(() => {
    const search = searchDrawer.trim().toLowerCase();
    return selectedDatePresences.filter(({ employe, status }) => {
      const matchSearch = !search || `${employe.prenom ?? ''} ${employe.nom ?? ''}`.toLowerCase().includes(search);
      const matchStatus = statusFilterDrawer === 'Tous' || status === statusFilterDrawer;
      return matchSearch && matchStatus;
    });
  }, [selectedDatePresences, searchDrawer, statusFilterDrawer]);

  // ⭐ VAOVAO: Dynamic items per page (4 na 8 rehefa expanded)
  const currentItemsPerPage = isDrawerExpanded ? 8 : ITEMS_PER_PAGE_DRAWER;

  const totalDrawerPages = Math.max(1, Math.ceil(filteredDrawerPresences.length / currentItemsPerPage));
  const paginatedDrawerPresences = useMemo(() => {
    const start = (currentPageDrawer - 1) * currentItemsPerPage;
    return filteredDrawerPresences.slice(start, start + currentItemsPerPage);
  }, [filteredDrawerPresences, currentPageDrawer, currentItemsPerPage]);

  const openModal = (type: 'confirm' | 'success' | 'error', title: string, message: string, onConfirm: () => void, confirmText = 'OK') => {
    setModalState({
      type, isOpen: true, title, message, confirmText,
      cancelText: type === 'confirm' ? 'Annuler' : '',
      onConfirm: () => { onConfirm(); setModalState((prev) => ({ ...prev, isOpen: false })); },
    });
  };

  const closeModal = () => setModalState((prev) => ({ ...prev, isOpen: false }));

  const handleBulkAction = async (status: string) => {
    if (!selectedDate || employes.length === 0) return;
    if (isSelectMode && selectedIds.size === 0) return;
    const targetIds = isSelectMode ? Array.from(selectedIds) : employes.map((e) => e.id);
    const count = targetIds.length;
    const statusLabel = status === 'present' ? 'Présent' : status === 'absent' ? 'Absent' : status === 'conge' ? 'Congé' : status === 'non_pointe' ? 'Non pointé' : 'En attente';
    openModal('confirm', 'Confirmer l\'action', `Voulez-vous vraiment marquer ${count} employé(s) comme ${statusLabel} pour le ${selectedDate} ?`, async () => {
      setBulkLoading(true);
      try {
        await window.api.employes.bulkUpdatePresenceJournaliere({ employe_ids: targetIds, date: selectedDate, statut: status });
        setSelectedIds(new Set());
        setIsSelectMode(false);
        await fetchPresence();
        openModal('success', 'Succès', `${count} employé(s) marqué(s) comme ${statusLabel}.`, () => {}, 'OK');
      } catch (error) {
        console.error('Erreur bulk update presence:', error);
        openModal('error', 'Erreur', 'Une erreur est survenue lors de l\'opération. Veuillez réessayer.', () => {}, 'OK');
      } finally {
        setBulkLoading(false);
      }
    }, 'Confirmer');
  };

  const toggleSelectMode = () => { setIsSelectMode(!isSelectMode); setSelectedIds(new Set()); };
  const toggleSelectEmploye = (id: number) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const goPreviousMonth = () => {
    const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    setCurrentMonth(newMonth); setCurrentYear(newYear); setSelectedDate(null);
    setIsSelectMode(false); setSelectedIds(new Set()); setSearchDrawer(''); setCurrentPageDrawer(1); setStatusFilterDrawer('Tous');
    onMoisChange?.(newMonth + 1); onAnneeChange?.(newYear);
  };

  const goNextMonth = () => {
    const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    setCurrentMonth(newMonth); setCurrentYear(newYear); setSelectedDate(null);
    setIsSelectMode(false); setSelectedIds(new Set()); setSearchDrawer(''); setCurrentPageDrawer(1); setStatusFilterDrawer('Tous');
    onMoisChange?.(newMonth + 1); onAnneeChange?.(newYear);
  };

  const goToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth());
    setSelectedDate(getLocalDateISO(today)); setIsSelectMode(false); setSelectedIds(new Set()); setSearchDrawer(''); setCurrentPageDrawer(1); setStatusFilterDrawer('Tous');
  };

  return (
    <div className="flex min-h-full flex-col bg-white dark:bg-[#0F172A]">
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><CalendarDays size={18} /></div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Calendrier des présences</h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">Suivi mensuel des employés</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={goPreviousMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"><ChevronLeft size={15} /></button>
            <div className="min-w-[150px] text-center"><p className="text-[16px] font-bold text-slate-900 dark:text-white">{MONTHS[currentMonth]} {currentYear}</p></div>
            <button type="button" onClick={goNextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"><ChevronRight size={15} /></button>
            <button type="button" onClick={goToday} className="ml-1 h-8 rounded-lg border border-brand-200 bg-brand-50 px-3 text-[14px] font-semibold text-brand-600 hover:bg-brand-100 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400">Aujourd'hui</button>
            <button type="button" onClick={() => setShowHistorique(true)} className="ml-1 h-8 rounded-lg border border-slate-200 bg-white px-3 text-[14px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-700 flex items-center gap-1.5"><History size={14} /> Historique</button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-px border-t border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-700">
          <CalendarKpi icon={<CheckCircle2 size={14} />} label="Total Présences" value={currentMonthStats.presentDays} />
          <CalendarKpi icon={<XCircle size={14} />} label="Total Absences" value={currentMonthStats.absentDays} />
          <CalendarKpi icon={<AlertCircle size={14} />} label="Total Congés" value={currentMonthStats.congeDays} />
          <CalendarKpi icon={<Users size={14} />} label="Employés suivis" value={currentMonthStats.employeesWithPresence.size} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="w-full">
          <div className="min-w-[720px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="px-2 py-2 text-center text-[12px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarCells.map((day, index) => {
                if (day === null) return <div key={`empty-${index}`} className="min-h-[105px] border-b border-r border-slate-100 bg-slate-50/50 dark:border-slate-700/50 dark:bg-slate-800/30" />;
                const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayRecords = presences[dateKey] || {};
                const presentCount = Object.values(dayRecords).filter((s) => s === 'present').length;
                const absentCount = Object.values(dayRecords).filter((s) => s === 'absent').length;
                const congeCount = Object.values(dayRecords).filter((s) => s === 'conge').length;
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;
                return (
                  <CalendarDay key={dateKey} day={day} dateKey={dateKey} presentCount={presentCount} absentCount={absentCount} congeCount={congeCount} isToday={isToday} isSelected={isSelected} onClick={() => setSelectedDate(isSelected ? null : dateKey)} />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {selectedDate && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => { setSelectedDate(null); setIsSelectMode(false); setSelectedIds(new Set()); setSearchDrawer(''); setCurrentPageDrawer(1); setStatusFilterDrawer('Tous'); }} />
      )}
      {/* ⭐ VAOVAO: Drawer miova width 30% na 100% */}
      {selectedDate && (
        <div
          className={`fixed inset-y-0 right-0 z-[9999] flex flex-col border-l ${isDark ? 'border-slate-700 bg-[#0F172A]' : 'border-slate-200 bg-white'} shadow-2xl`}
          style={{ width: isDrawerExpanded ? '100%' : '35%', transition: 'width 0.3s ease' }}
        >
          <div className="shrink-0 border-b border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[16px] font-bold text-slate-900 dark:text-white">Présences du {selectedDate.split('-').reverse().join('/')}</p>
                <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{isSelectMode ? `${selectedIds.size} employé(s) sélectionné(s)` : `${filteredDrawerPresences.length} employé(s) affiché(s)`}</p>
              </div>
              <div className="flex items-center gap-1">
                {/* ⭐ VAOVAO: Bouton expand/shrink */}
                <button
                  type="button"
                  onClick={() => setIsDrawerExpanded(prev => !prev)}
                  title={isDrawerExpanded ? 'Réduire le panneau' : 'Agrandir le panneau'}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                >
                  {isDrawerExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button onClick={() => { setSelectedDate(null); setIsSelectMode(false); setSelectedIds(new Set()); setSearchDrawer(''); setCurrentPageDrawer(1); setStatusFilterDrawer('Tous'); }} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"><X size={14} /></button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button onClick={toggleSelectMode} className={`px-3 py-1.5 rounded-lg text-[13px] font-bold border transition ${isSelectMode ? 'bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20' : 'bg-white text-slate-600 border-slate-200 dark:bg-[#0F172A] dark:text-slate-300 dark:border-slate-700'}`}>{isSelectMode ? <CheckSquare size={14} className="inline mr-1" /> : <Square size={14} className="inline mr-1" />} Selection</button>
              <button onClick={() => handleBulkAction('present')} disabled={bulkLoading || (isSelectMode && selectedIds.size === 0)} className="px-3 py-1.5 rounded-lg bg-success-50 text-success-700 text-[13px] font-bold hover:bg-success-100 disabled:opacity-50 dark:bg-[#0F172A] dark:text-success-400 dark:border dark:border-white/[0.12] dark:hover:bg-slate-800"><CheckCircle2 size={14} className="inline mr-1" /> {isSelectMode ? 'Selection Présent' : 'Tout Présent'}</button>
              <button onClick={() => handleBulkAction('absent')} disabled={bulkLoading || (isSelectMode && selectedIds.size === 0)} className="px-3 py-1.5 rounded-lg bg-danger-50 text-danger-700 text-[13px] font-bold hover:bg-danger-100 disabled:opacity-50 dark:bg-[#0F172A] dark:text-danger-400 dark:border dark:border-white/[0.12] dark:hover:bg-slate-800"><XCircle size={14} className="inline mr-1" /> {isSelectMode ? 'Selection Absent' : 'Tout Absent'}</button>
              <button onClick={() => handleBulkAction('conge')} disabled={bulkLoading || (isSelectMode && selectedIds.size === 0)} className="px-3 py-1.5 rounded-lg bg-warning-50 text-warning-700 text-[13px] font-bold hover:bg-warning-100 disabled:opacity-50 dark:bg-[#0F172A] dark:text-warning-400 dark:border dark:border-white/[0.12] dark:hover:bg-slate-800"><AlertCircle size={14} className="inline mr-1" /> {isSelectMode ? 'Selection Congé' : 'Tout Congé'}</button>
              <button onClick={() => handleBulkAction('non_pointe')} disabled={bulkLoading || (isSelectMode && selectedIds.size === 0)} className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-[13px] font-bold hover:bg-slate-300 disabled:opacity-50 dark:bg-[#0F172A] dark:text-slate-300 dark:border dark:border-white/[0.12] dark:hover:bg-slate-800"><XCircle size={14} className="inline mr-1" /> {isSelectMode ? 'Selection Non pointé' : 'Tout Non pointé'}</button>
              {bulkLoading && <Loader2 size={14} className="animate-spin text-brand-500" />}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher un employé..." value={searchDrawer} onChange={(e) => { setSearchDrawer(e.target.value); setCurrentPageDrawer(1); }} className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-[14px] dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-100" />
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {(['Tous', 'Présent', 'Absent', 'Congé', 'En attente', 'Non pointé'] as const).map((status) => (
                <button key={status} onClick={() => { setStatusFilterDrawer(status); setCurrentPageDrawer(1); }} className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${statusFilterDrawer === status ? status === 'Présent' ? 'bg-success-500 text-white' : status === 'Absent' ? 'bg-danger-500 text-white' : status === 'Congé' ? 'bg-warning-500 text-white' : status === 'En attente' ? 'bg-amber-500 text-white' : status === 'Non pointé' ? 'bg-slate-600 text-white' : 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-[#0F172A] dark:text-slate-400 dark:border dark:border-white/[0.12] dark:hover:bg-slate-800'}`}>{status}</button>
              ))}
            </div>
            {paginatedDrawerPresences.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-center dark:border-slate-700 dark:bg-[#0F172A]">
                <Clock3 size={17} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-[14px] font-medium text-slate-500 dark:text-slate-400">Aucune donnée de présence.</p>
              </div>
            ) : (
              // ⭐ Rehefa expanded dia grid 4 colonnes
              <div className={isDrawerExpanded ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3' : 'space-y-2'}>
                {paginatedDrawerPresences.map(({ employe, status }) => (
                  <div key={employe.id} className={`rounded-xl border p-3 transition ${isSelectMode && selectedIds.has(employe.id) ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-500/10' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0F172A]'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{getEmployeeName(employe)}</p>
                        {employe.poste && <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">{employe.poste}</p>}
                      </div>
                      {isSelectMode ? (
                        <button onClick={() => toggleSelectEmploye(employe.id)} className="shrink-0 text-brand-500">{selectedIds.has(employe.id) ? <CheckSquare size={18} /> : <Square size={18} />}</button>
                      ) : (
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12px] font-bold ${getStatusInfo(status || '').color}`}>{getStatusInfo(status || '').icon}{getStatusInfo(status || '').label}</span>
                      )}
                    </div>
                    {!isSelectMode && (
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-[12px] text-slate-500 dark:text-slate-400">Date : {selectedDate.split('-').reverse().join('/')}</div>
                        {onJourClick && (
                          <button type="button" onClick={() => onJourClick(employe.id, selectedDate)} className="text-[13px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">Gérer le mois</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {totalDrawerPages > 1 && (
            <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between">
              <button type="button" disabled={currentPageDrawer === 1} onClick={() => setCurrentPageDrawer((p) => Math.max(1, p - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]"><ChevronLeft size={15} /></button>
              <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">Page {currentPageDrawer} / {totalDrawerPages}</span>
              <button type="button" disabled={currentPageDrawer === totalDrawerPages} onClick={() => setCurrentPageDrawer((p) => Math.min(totalDrawerPages, p + 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]"><ChevronRight size={15} /></button>
            </div>
          )}
        </div>
      )}
      <EmployesHistoriqueModal isOpen={showHistorique} onClose={() => { setShowHistorique(false); setSelectedEmployeForHistory(null); }} employeId={selectedEmployeForHistory?.id} mois={currentMonth + 1} annee={currentYear} dateReference={selectedDate} />
      <ConfirmModal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} confirmText={modalState.confirmText} cancelText={modalState.cancelText} confirmColor={modalState.type === 'error' ? 'red' : 'green'} isDark={isDark} />
    </div>
  );
}

function CalendarKpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 bg-white px-3 py-2 dark:bg-[#0F172A]">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-[12px] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-[16px] font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function CalendarDay({ day, dateKey, presentCount, absentCount, congeCount, isToday, isSelected, onClick }: { day: number; dateKey: string; presentCount: number; absentCount: number; congeCount: number; isToday: boolean; isSelected: boolean; onClick: () => void; }) {
  const hasAny = presentCount > 0 || absentCount > 0 || congeCount > 0;
  return (
    <button type="button" onClick={onClick} className={`relative min-h-[105px] border-b border-r border-slate-100 bg-white p-2 text-left transition hover:bg-slate-50 dark:border-slate-700/50 dark:bg-[#0F172A] dark:hover:bg-slate-800/50 ${isSelected ? 'bg-brand-50/60 ring-2 ring-inset ring-brand-400 dark:bg-brand-500/10' : ''}`}>
      <div className="flex items-center justify-between">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold ${isToday ? 'bg-brand-500 text-white' : 'text-slate-700 dark:text-slate-200'}`}>{day}</span>
        {hasAny && <span className="text-[12px] font-semibold text-slate-400">{presentCount + absentCount + congeCount}</span>}
      </div>
      {hasAny && (
        <div className="mt-2 space-y-1">
          {presentCount > 0 && <div className="flex items-center gap-1 text-[12px] text-success-600 dark:text-success-400"><CheckCircle2 size={11} /> {presentCount} présent{presentCount > 1 ? 's' : ''}</div>}
          {absentCount > 0 && <div className="flex items-center gap-1 text-[12px] text-danger-600 dark:text-danger-400"><XCircle size={11} /> {absentCount} absent{absentCount > 1 ? 's' : ''}</div>}
          {congeCount > 0 && <div className="flex items-center gap-1 text-[12px] text-warning-600 dark:text-warning-400"><AlertCircle size={11} /> {congeCount} congé{congeCount > 1 ? 's' : ''}</div>}
        </div>
      )}
      {!hasAny && <div className="mt-5 text-center text-[12px] text-slate-300 dark:text-slate-600">—</div>}
      {isToday && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-500" />}
      <span className="sr-only">{dateKey}</span>
    </button>
  );
}