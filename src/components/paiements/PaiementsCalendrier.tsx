// src/components/paiements/PaiementsCalendrier.tsx
// ⭐ FIX: Ny drawer dia mampiasa (mois, annee) fa tsy date_paiement
// ⭐ FIX: "Payer maintenant" tsy mipoitra raha efa misy paiement amin'ny volana
// ⭐ FIX: Header "Employés non payés en MOIS ANNEE"
// ⭐ FIX: Border an'ny cellule → border-slate-300 (gray-300) amin'ny light mode
// ⭐ FIX: onPayEmployee mandefa (employeId, mois, annee, date) ho an'ny modal
// ⭐ FONT SIZE: h2 15px, subtitle 13px, buttons 14px, labels 13px, values 15px

import React, { useMemo, useState } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Clock3,
  CreditCard, Users, X, Search, Maximize2, Minimize2, TrendingDown,
  TrendingUp, Banknote, Plus, CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export interface PaiementCalendrier {
  id?: number; employe_id: number; mois: number; annee: number; montant: number;
  mode_paiement?: string | null; statut?: string | null; reference?: string | null; observation?: string | null;
  salaire_brut?: number | null; cnaps?: number | null; ostie?: number | null; irsa?: number | null; avance?: number | null;
  absences_deduction?: number | null;
  date_paiement?: string | null; created_at?: string | null;
  employe_nom?: string | null; employe_prenom?: string | null; employe_poste?: string | null; salaire_base?: number | null;
}
interface EmployePaiement { id: number; nom?: string; prenom?: string; poste?: string; salaire?: number; salaire_base?: number; }
interface PaiementsCalendrierProps {
  paiements?: PaiementCalendrier[];
  allPaiements?: PaiementCalendrier[];
  employes?: EmployePaiement[];
  // ⭐ FIX: alefa ny mois/annee (avy amin'ny periode voafidy) amin'ny onPayEmployee
  onPayEmployee?: (employeId: number, mois?: number, annee?: number, date?: string) => void;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const WEEK_DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const MENSUEL_ITEMS_PER_PAGE = 12;

function toNumber(value: unknown, fallback = 0): number { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function getLocalDateISO(date = new Date()): string {
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function normalizeDateISO(value?: string | null): string {
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  return `${match[1]}-${match[2]}-${match[3]}`;
}
function formatAriary(value: unknown): string { return `${Math.round(toNumber(value)).toLocaleString('fr-FR')} Ar`; }
function formatDate(value?: string | null): string {
  const n = normalizeDateISO(value); if (!n) return '—';
  const [year, month, day] = n.split('-'); return `${day}/${month}/${year}`;
}
function getEmployeeName(paiement: PaiementCalendrier): string { return `${paiement.employe_prenom ?? ''} ${paiement.employe_nom ?? ''}`.trim() || 'Employé'; }
function getPaymentDateKey(paiement: PaiementCalendrier): string { return normalizeDateISO(paiement.date_paiement); }
function getPeriodLabel(paiement: PaiementCalendrier): string {
  const m = Number(paiement.mois), y = Number(paiement.annee);
  if (m < 1 || m > 12 || !y) return 'Période inconnue';
  return `${MONTHS[m-1]} ${y}`;
}

function computeSalaireNet(payment: PaiementCalendrier | null): number {
  if (!payment) return 0;
  const brut = toNumber(payment.salaire_brut);
  const cnaps = toNumber(payment.cnaps);
  const ostie = toNumber(payment.ostie);
  const irsa = toNumber(payment.irsa);
  const absences = toNumber(payment.absences_deduction);
  return Math.max(0, brut - cnaps - ostie - irsa - absences);
}

function computeGlobalStatus(payments: PaiementCalendrier[]): string {
  if (!payments || payments.length === 0) return 'Non payé';
  const totalPaye = payments.reduce((sum, p) => sum + toNumber(p.montant), 0);
  if (totalPaye <= 0) return 'Non payé';
  return 'Payé';
}

type DrawerFilter = 'Payé' | 'Non payé' | 'Tous';

export default function PaiementsCalendrier({
  paiements = [],
  allPaiements = [],
  employes = [],
  onPayEmployee,
}: PaiementsCalendrierProps) {
  const { isDark } = useTheme();
  const sourcePaiements = allPaiements.length > 0 ? allPaiements : paiements;
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendrier' | 'mensuel'>('calendrier');
  const [searchEmployee, setSearchEmployee] = useState('');

  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [searchDrawer, setSearchDrawer] = useState('');
  const [currentPageDrawer, setCurrentPageDrawer] = useState(1);

  // ⭐ FIX: Default filter = 'Non payé' (ilay tena ilaina rehefa manindry andro)
  const [statusFilterDrawer, setStatusFilterDrawer] = useState<DrawerFilter>('Non payé');
  const [showOnlyWithPayment, setShowOnlyWithPayment] = useState(true);
  const [mensuelPage, setMensuelPage] = useState(1);

  const todayKey = useMemo(() => getLocalDateISO(), []);

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

  // ⭐ Payment map par date (ho an'ny calendrier cells — visualisation)
  const paymentMap = useMemo(() => {
    const map = new Map<string, PaiementCalendrier[]>();
    sourcePaiements.forEach(paiement => {
      const dateKey = getPaymentDateKey(paiement);
      if (!dateKey) return;
      const existing = map.get(dateKey);
      if (existing) existing.push(paiement);
      else map.set(dateKey, [paiement]);
    });
    return map;
  }, [sourcePaiements]);

  const currentMonthPayments = useMemo(() => {
    return sourcePaiements.filter(paiement => {
      const date = getPaymentDateKey(paiement);
      if (!date) return false;
      return date.startsWith(`${currentYear}-${String(currentMonth+1).padStart(2,'0')}-`);
    });
  }, [sourcePaiements, currentYear, currentMonth]);

  // ⭐ FIX: Paiements ho an'ny (mois, annee) — avy amin'ny `mois`/`annee` fields
  const periodPayments = useMemo(() => {
    return sourcePaiements.filter(p => Number(p.mois) === currentMonth + 1 && Number(p.annee) === currentYear);
  }, [sourcePaiements, currentMonth, currentYear]);

  // ⭐ FIX: Map par employe_id ho an'ny period (mois/annee) — io no ampiasain'ny drawer
  const periodPaymentMap = useMemo(() => {
    const map = new Map<number, PaiementCalendrier[]>();
    periodPayments.forEach(p => {
      const id = Number(p.employe_id);
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(p);
    });
    return map;
  }, [periodPayments]);

  const currentMonthTotal = useMemo(() => currentMonthPayments.reduce((sum, p) => sum + toNumber(p.montant), 0), [currentMonthPayments]);
  const currentMonthAvance = useMemo(() => currentMonthPayments.reduce((sum, p) => sum + toNumber(p.avance), 0), [currentMonthPayments]);
  const currentMonthSalaireNet = useMemo(() => currentMonthPayments.reduce((sum, p) => sum + computeSalaireNet(p), 0), [currentMonthPayments]);
  const currentMonthEmployees = useMemo(() => new Set(currentMonthPayments.map(p => p.employe_id)).size, [currentMonthPayments]);
  const daysWithPayment = useMemo(() => new Set(currentMonthPayments.map(p => getPaymentDateKey(p)).filter(Boolean)).size, [currentMonthPayments]);

  // ⭐ FIX: Ny drawer dia mampiasa `periodPaymentMap` (mois/annee) fa tsy `paymentMap` (andro)
  const employeeListForSelectedDate = useMemo(() => {
    if (!selectedDate || !employes || employes.length === 0) return [];
    const search = searchDrawer.trim().toLowerCase();
    return employes
      .map(emp => {
        const payments = periodPaymentMap.get(Number(emp.id)) || [];
        const globalStatus = computeGlobalStatus(payments);
        return { employe: emp, payments, status: globalStatus };
      })
      .filter(({ employe, payments }) => {
        const matchSearch = !search || `${employe.prenom ?? ''} ${employe.nom ?? ''}`.toLowerCase().includes(search);
        let matchStatus = false;
        if (statusFilterDrawer === 'Tous') matchStatus = true;
        else if (statusFilterDrawer === 'Payé') matchStatus = payments.length > 0;
        else if (statusFilterDrawer === 'Non payé') matchStatus = payments.length === 0;
        return matchSearch && matchStatus;
      });
  }, [selectedDate, employes, periodPaymentMap, searchDrawer, statusFilterDrawer]);

  const currentItemsPerPage = isDrawerExpanded ? 8 : 4;
  const totalDrawerPages = Math.max(1, Math.ceil(employeeListForSelectedDate.length / currentItemsPerPage));
  const paginatedDrawerEmployees = useMemo(() => {
    const start = (currentPageDrawer - 1) * currentItemsPerPage;
    return employeeListForSelectedDate.slice(start, start + currentItemsPerPage);
  }, [employeeListForSelectedDate, currentPageDrawer, currentItemsPerPage]);

  // ⭐ FIX: Rehefa manindry andro dia mifantoka amin'ny "Non payé" amin'ny volana
  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setStatusFilterDrawer('Non payé');
    setSearchDrawer('');
    setCurrentPageDrawer(1);
  };

  const goPreviousMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y-1); } else { setCurrentMonth(m => m-1); } setSelectedDate(null); setSearchEmployee(''); setSearchDrawer(''); setStatusFilterDrawer('Non payé'); setCurrentPageDrawer(1); setMensuelPage(1); };
  const goNextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y+1); } else { setCurrentMonth(m => m+1); } setSelectedDate(null); setSearchEmployee(''); setSearchDrawer(''); setStatusFilterDrawer('Non payé'); setCurrentPageDrawer(1); setMensuelPage(1); };
  const goToday = () => { const today = new Date(); setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); setSelectedDate(getLocalDateISO(today)); setSearchEmployee(''); setSearchDrawer(''); setStatusFilterDrawer('Non payé'); setCurrentPageDrawer(1); setMensuelPage(1); };

  const monthlyStats = useMemo(() => {
    let payes = 0, nonPayes = 0;
    employes.forEach(emp => {
      const payments = periodPaymentMap.get(Number(emp.id)) || [];
      const status = computeGlobalStatus(payments);
      if (status === 'Payé') payes++;
      else nonPayes++;
    });
    return { payes, nonPayes };
  }, [employes, periodPaymentMap]);

  const monthlyStatusList = useMemo(() => {
    if (!employes || employes.length === 0) return [];
    const search = searchEmployee.trim().toLowerCase();
    return employes
      .filter(emp => `${emp.prenom ?? ''} ${emp.nom ?? ''}`.toLowerCase().includes(search))
      .map(emp => {
        const payments = periodPaymentMap.get(Number(emp.id)) || [];
        return {
          employe: emp,
          payments,
          statut: computeGlobalStatus(payments),
        };
      })
      .filter(({ payments }) => !showOnlyWithPayment || payments.length > 0)
      .sort((a, b) => {
        const order: Record<string, number> = { 'Payé': 0, 'Non payé': 1 };
        return (order[a.statut] ?? 2) - (order[b.statut] ?? 2);
      });
  }, [employes, periodPaymentMap, searchEmployee, showOnlyWithPayment]);

  const totalMensuelPages = Math.max(1, Math.ceil(monthlyStatusList.length / MENSUEL_ITEMS_PER_PAGE));
  const paginatedMonthlyList = useMemo(() => {
    const start = (mensuelPage - 1) * MENSUEL_ITEMS_PER_PAGE;
    return monthlyStatusList.slice(start, start + MENSUEL_ITEMS_PER_PAGE);
  }, [monthlyStatusList, mensuelPage]);

  React.useEffect(() => { setMensuelPage(1); }, [searchEmployee, currentMonth, currentYear, showOnlyWithPayment]);

  return (
    <div className={`flex min-h-full flex-col ${isDark ? 'bg-[#0F172A]' : 'bg-white'}`}>
      {/* Header */}
      <div className={`shrink-0 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <CalendarDays size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">Calendrier des paiements</h2>
              <p className="mt-0.5 text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">
                Cliquez sur un jour pour voir les employés non payés du mois
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex rounded-lg border border-slate-200 bg-white p-1 dark:border-white/[0.12] dark:bg-[#0F172A]">
              <button onClick={() => setViewMode('calendrier')} className={`px-3 py-1.5 rounded-md text-[14px] font-semibold transition-colors ${viewMode === 'calendrier' ? 'bg-brand-500 text-white' : 'text-slate-500 dark:text-slate-400'}`}>Calendrier</button>
              <button onClick={() => setViewMode('mensuel')} className={`px-3 py-1.5 rounded-md text-[14px] font-semibold transition-colors ${viewMode === 'mensuel' ? 'bg-brand-500 text-white' : 'text-slate-500 dark:text-slate-400'}`}>Mensuel</button>
            </div>
            <button type="button" onClick={goPreviousMonth} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]">
              <ChevronLeft size={16} strokeWidth={2.2} />
            </button>
            <div className="min-w-[160px] text-center">
              <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{MONTHS[currentMonth]} {currentYear}</p>
            </div>
            <button type="button" onClick={goNextMonth} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]">
              <ChevronRight size={16} strokeWidth={2.2} />
            </button>
            <button type="button" onClick={goToday} className="ml-1 h-9 rounded-lg border border-brand-200 bg-brand-50 px-4 text-[14px] font-semibold text-brand-600 transition-colors hover:bg-brand-100 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-400">Aujourd'hui</button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-px border-t border-slate-200 bg-slate-200 dark:border-white/[0.08] dark:bg-white/[0.08]">
          <CalendarKpi icon={<CircleDollarSign size={15} strokeWidth={2.2} />} label="Total payé" value={formatAriary(currentMonthTotal)} />
          <CalendarKpi icon={<Banknote size={15} strokeWidth={2.2} />} label="Salaire net" value={formatAriary(currentMonthSalaireNet)} />
          <CalendarKpi icon={<TrendingDown size={15} strokeWidth={2.2} />} label="Avance totale" value={formatAriary(currentMonthAvance)} highlight={currentMonthAvance > 0} />
          <CalendarKpi icon={<Users size={15} strokeWidth={2.2} />} label="Employés payés" value={currentMonthEmployees} />
          <CalendarKpi icon={<CalendarDays size={15} strokeWidth={2.2} />} label="Jours payés" value={daysWithPayment} />
        </div>
      </div>

      {viewMode === 'calendrier' ? (
        <>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <div className={`min-w-[720px] overflow-hidden rounded-xl border-[0.5px] ${isDark ? 'border-white/[0.12]' : 'border-slate-200'}`}>
              <div className="grid grid-cols-7 border-b border-slate-300 bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.02]">
                {WEEK_DAYS.map(day => <div key={day} className="px-2 py-2.5 text-center text-[13px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{day}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {calendarCells.map((day, index) => {
                  if (day === null) return <div key={`empty-${index}`} className="min-h-[105px] border-b border-r border-slate-300 bg-slate-50/50 dark:border-white/[0.05] dark:bg-white/[0.02]" />;
                  const dateKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const dayPayments = paymentMap.get(dateKey) ?? [];
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === selectedDate;
                  const dayTotal = dayPayments.reduce((sum, p) => sum + toNumber(p.montant), 0);
                  const dayAvance = dayPayments.reduce((sum, p) => sum + toNumber(p.avance), 0);
                  return <CalendarDay key={dateKey} day={day} dateKey={dateKey} payments={dayPayments} total={dayTotal} avance={dayAvance} isToday={isToday} isSelected={isSelected} onClick={() => handleSelectDate(dateKey)} />;
                })}
              </div>
            </div>
          </div>

          {/* DRAWER */}
          {selectedDate && (
            <>
              <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDate(null)} />
              <div
                className={`fixed inset-y-0 right-0 z-[9999] flex flex-col border-l ${isDark ? 'border-white/[0.08] bg-[#0F172A]' : 'border-slate-200 bg-white'} shadow-[0_18px_55px_rgba(15,23,42,0.35)]`}
                style={{ width: isDrawerExpanded ? '100%' : '35%', transition: 'width 0.3s ease' }}
              >
                <div className={`shrink-0 border-b px-4 py-3.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                        Employés non payés en {MONTHS[currentMonth]} {currentYear}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">
                        {employeeListForSelectedDate.length} employé{employeeListForSelectedDate.length > 1 ? 's' : ''}
                        {statusFilterDrawer === 'Payé' && ' payé(s)'}
                        {statusFilterDrawer === 'Non payé' && ' non payé(s)'}
                        {' '}— sélectionné le {formatDate(selectedDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setIsDrawerExpanded(prev => !prev)} title={isDrawerExpanded ? 'Réduire le panneau' : 'Agrandir le panneau'} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                        {isDrawerExpanded ? <Minimize2 size={16} strokeWidth={2.2} /> : <Maximize2 size={16} strokeWidth={2.2} />}
                      </button>
                      <button onClick={() => setSelectedDate(null)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                        <X size={16} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3.5">
                  <div className="relative mb-3">
                    <Search size={16} strokeWidth={2.2} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Rechercher un employé..." value={searchDrawer} onChange={e => { setSearchDrawer(e.target.value); setCurrentPageDrawer(1); }} className={`w-full h-10 pl-9 pr-3 rounded-lg border text-[14px] outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${isDark ? 'border-white/[0.12] bg-[#0F172A] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`} />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(['Non payé', 'Payé', 'Tous'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => { setStatusFilterDrawer(status); setCurrentPageDrawer(1); }}
                        className={`px-3 py-1.5 rounded-md text-[14px] font-semibold transition-colors ${
                          statusFilterDrawer === status
                            ? status === 'Payé' ? 'bg-emerald-500 text-white'
                              : status === 'Non payé' ? 'bg-red-500 text-white'
                              : 'bg-brand-500 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  {paginatedDrawerEmployees.length === 0 ? (
                    <div className={`rounded-lg border border-dashed px-5 py-4 text-center ${isDark ? 'border-white/[0.12] bg-white/[0.02]' : 'border-slate-300 bg-white'}`}>
                      <CheckCircle2 size={20} strokeWidth={2.2} className="mx-auto text-emerald-500" />
                      <p className="mt-2 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
                        {statusFilterDrawer === 'Payé' ? 'Aucun employé payé pour cette période.' :
                         statusFilterDrawer === 'Non payé' ? `✓ Tous les employés ont été payés en ${MONTHS[currentMonth]} ${currentYear}.` :
                         'Aucun employé trouvé.'}
                      </p>
                    </div>
                  ) : (
                    <div className={isDrawerExpanded ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3' : 'space-y-2'}>
                      {paginatedDrawerEmployees.map(({ employe, payments }) => (
                        <EmployeeDayCard
                          key={employe.id}
                          employe={employe}
                          payments={payments}
                          currentMonth={currentMonth}
                          currentYear={currentYear}
                          /* ⭐ FIX: alefa ny currentMonth + 1 sy currentYear */
                          onPay={onPayEmployee ? () => onPayEmployee(employe.id, currentMonth + 1, currentYear, selectedDate || undefined) : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {totalDrawerPages > 1 && (
                  <div className={`shrink-0 border-t px-4 py-3.5 flex items-center justify-between ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                    <button type="button" disabled={currentPageDrawer === 1} onClick={() => setCurrentPageDrawer(p => Math.max(1, p - 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]">
                      <ChevronLeft size={16} strokeWidth={2.2} />
                    </button>
                    <span className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">Page {currentPageDrawer} / {totalDrawerPages}</span>
                    <button type="button" disabled={currentPageDrawer === totalDrawerPages} onClick={() => setCurrentPageDrawer(p => Math.min(totalDrawerPages, p + 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]">
                      <ChevronRight size={16} strokeWidth={2.2} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        /* VUE MENSUEL */
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`p-3.5 rounded-lg border-[0.5px] ${isDark ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className="text-[13px] font-semibold leading-[1.3] text-emerald-600 dark:text-emerald-400">Payés</p>
              <p className="mt-1 text-[15px] font-semibold text-emerald-700 dark:text-emerald-400">{monthlyStats.payes}</p>
            </div>
            <div className={`p-3.5 rounded-lg border-[0.5px] ${isDark ? 'border-red-500/25 bg-red-500/10' : 'border-red-200 bg-red-50'}`}>
              <p className="text-[13px] font-semibold leading-[1.3] text-red-600 dark:text-red-400">Non payés</p>
              <p className="mt-1 text-[15px] font-semibold text-red-700 dark:text-red-400">{monthlyStats.nonPayes}</p>
            </div>
          </div>

          <div className="relative mb-3">
            <Search size={17} strokeWidth={2.2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Rechercher un employé..." value={searchEmployee} onChange={e => { setSearchEmployee(e.target.value); setMensuelPage(1); }} className={`w-full h-11 pl-11 pr-4 rounded-lg border text-[15px] outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${isDark ? 'border-white/[0.12] bg-[#0F172A] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`} />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showOnlyWithPayment}
                onChange={(e) => setShowOnlyWithPayment(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-brand-500"
              />
              Afficher seulement les employés avec paiement
            </label>
            <span className="text-[13px] text-slate-400 dark:text-slate-500">
              ({monthlyStatusList.length} employé{monthlyStatusList.length > 1 ? 's' : ''})
            </span>
          </div>

          {monthlyStatusList.length === 0 ? (
            <div className="text-center py-8 text-[13.5px] text-slate-500 dark:text-slate-400">
              {employes && employes.length > 0
                ? (showOnlyWithPayment ? 'Aucun employé avec paiement pour cette période.' : 'Aucun employé trouvé.')
                : 'Aucune donnée employé fournie.'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedMonthlyList.map(({ employe, payments, statut }) => (
                  <MonthlyEmployeeCard
                    key={employe.id}
                    employe={employe}
                    payments={payments}
                    statut={statut}
                    isDark={isDark}
                    /* ⭐ FIX: alefa ny currentMonth + 1 sy currentYear */
                    onPay={onPayEmployee ? () => onPayEmployee(employe.id, currentMonth + 1, currentYear) : undefined}
                  />
                ))}
              </div>

              {totalMensuelPages > 1 && (
                <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">
                    {monthlyStatusList.length} employé(s) — Page {mensuelPage} / {totalMensuelPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={mensuelPage === 1} onClick={() => setMensuelPage(p => Math.max(1, p - 1))} className="flex h-9 items-center gap-1 rounded-lg border px-3 text-[14px] font-semibold transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-white/[0.12] dark:hover:bg-white/[0.06]" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                      <ChevronLeft size={15} strokeWidth={2.2} />
                      <span className="hidden sm:inline">Précédent</span>
                    </button>
                    <div className="hidden items-center gap-1 sm:flex">
                      {(() => {
                        const pages: (number | string)[] = [];
                        const maxVisible = 5;
                        const half = Math.floor(maxVisible / 2);
                        let start = Math.max(1, mensuelPage - half);
                        let end = Math.min(totalMensuelPages, start + maxVisible - 1);
                        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
                        if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
                        for (let i = start; i <= end; i++) pages.push(i);
                        if (end < totalMensuelPages) { if (end < totalMensuelPages - 1) pages.push('...'); pages.push(totalMensuelPages); }
                        return pages.map((p, i) => {
                          if (p === '...') return <span key={`dots-${i}`} className="px-1 text-[13.5px] text-slate-400">…</span>;
                          const isActive = p === mensuelPage;
                          return (
                            <button key={`page-${p}`} type="button" onClick={() => setMensuelPage(p as number)} className={`flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-semibold transition-colors ${isActive ? 'bg-brand-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/[0.06]'}`} style={!isActive ? { color: isDark ? '#F8FAFC' : '#0F172A' } : undefined}>
                              {p}
                            </button>
                          );
                        });
                      })()}
                    </div>
                    <button type="button" disabled={mensuelPage === totalMensuelPages} onClick={() => setMensuelPage(p => Math.min(totalMensuelPages, p + 1))} className="flex h-9 items-center gap-1 rounded-lg border px-3 text-[14px] font-semibold transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-white/[0.12] dark:hover:bg-white/[0.06]" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                      <span className="hidden sm:inline">Suivant</span>
                      <ChevronRight size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SOUS-COMPOSANTS
// ============================================================

function CalendarKpi({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: React.ReactNode; highlight?: boolean }) {
  const { isDark } = useTheme();
  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 ${isDark ? 'bg-[#0F172A]' : 'bg-white'}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${highlight ? (isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-600') : (isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500')}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`truncate text-[15px] font-semibold mt-0.5 ${highlight ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>{value}</p>
      </div>
    </div>
  );
}

function CalendarDay({ day, dateKey, payments, total, avance, isToday, isSelected, onClick }: {
  day: number; dateKey: string; payments: PaiementCalendrier[]; total: number; avance: number; isToday: boolean; isSelected: boolean; onClick: () => void;
}) {
  const { isDark } = useTheme();
  const hasPayments = payments.length > 0;
  const paidCount = payments.filter(p => p.statut === 'Payé').length;
  const unpaidCount = payments.filter(p => p.statut === 'Non payé').length;
  const hasAvance = avance > 0;
  return (
    <button type="button" onClick={onClick} className={`relative min-h-[105px] border-b border-r p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] ${isDark ? 'border-white/[0.05] bg-[#0F172A]' : 'border-slate-300 bg-white'} ${isSelected ? 'bg-brand-50 ring-2 ring-inset ring-brand-400 dark:bg-brand-500/10' : ''}`}>
      <div className="flex items-center justify-between">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[14px] font-semibold ${isToday ? 'bg-brand-500 text-white' : 'text-slate-700 dark:text-slate-200'}`}>{day}</span>
        {hasPayments && <span className="text-[13px] font-semibold text-slate-400">{payments.length}</span>}
      </div>
      {hasPayments && (
        <div className="mt-2">
          <div className="rounded-lg bg-brand-50 px-2 py-1.5 dark:bg-brand-500/10">
            <p className="text-[13px] leading-[1.3] text-brand-500 dark:text-brand-400">Total payé</p>
            <p className="mt-0.5 truncate text-[15px] font-semibold text-brand-700 dark:text-brand-300">{formatAriary(total)}</p>
          </div>
          {hasAvance && (
            <div className="mt-1 rounded-md bg-amber-50 px-2 py-1 dark:bg-amber-500/10">
              <p className="flex items-center gap-1 text-[13px] font-semibold text-amber-600 dark:text-amber-400">
                <TrendingDown size={12} strokeWidth={2.2} />
                Avance: {formatAriary(avance)}
              </p>
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {paidCount > 0 && <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[12.5px] font-semibold text-emerald-600 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">{paidCount} payé{paidCount > 1 ? 's' : ''}</span>}
            {unpaidCount > 0 && <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[12.5px] font-semibold text-red-600 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400">{unpaidCount} impayé{unpaidCount > 1 ? 's' : ''}</span>}
          </div>
          <div className="mt-2 truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">{payments.slice(0,2).map(p => getEmployeeName(p)).join(', ')}{payments.length > 2 && ` +${payments.length-2}`}</div>
        </div>
      )}
      {!hasPayments && <div className="mt-5 text-center text-[13px] text-slate-300 dark:text-slate-600">—</div>}
      {isToday && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-500" />}
      <span className="sr-only">{dateKey}</span>
    </button>
  );
}

// ⭐ FIX: EmployeeDayCard mandray ny `currentMonth`/`currentYear` mba hampiseho ny période
function EmployeeDayCard({
  employe, payments, currentMonth, currentYear, onPay,
}: {
  employe: EmployePaiement;
  payments: PaiementCalendrier[];
  currentMonth: number;
  currentYear: number;
  onPay?: () => void;
}) {
  const { isDark } = useTheme();
  const latestPayment = payments.length > 0 ? payments[0] : null;
  const globalStatus = computeGlobalStatus(payments);
  const totalPaye = payments.reduce((sum, p) => sum + toNumber(p.montant), 0);
  const salaireBrut = toNumber(latestPayment?.salaire_brut);
  const salaireNet = computeSalaireNet(latestPayment);
  const totalAvance = payments.reduce((sum, p) => sum + toNumber(p.avance), 0);
  const monthLabel = `${MONTHS[currentMonth]} ${currentYear}`;

  return (
    <div className={`rounded-xl border-[0.5px] p-3.5 ${isDark ? 'border-white/[0.12] bg-white/[0.02]' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">{employe.prenom} {employe.nom}</p>
          {employe.poste && <p className="mt-0.5 truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">{employe.poste}</p>}
        </div>
        <StatusBadge status={globalStatus} />
      </div>

      {payments.length > 0 ? (
        <>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">Date réelle</p>
              <p className="mt-0.5 text-[14px] font-semibold text-slate-700 dark:text-slate-200">{formatDate(latestPayment?.date_paiement)}</p>
            </div>
            <div className="text-right">
              <p className="text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">Période</p>
              <p className="mt-0.5 text-[14px] font-semibold text-slate-700 dark:text-slate-200">{getPeriodLabel(latestPayment!)}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-1.5 border-t pt-2.5 dark:border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">Salaire brut</span>
              <span className="text-[14px] font-medium text-slate-700 dark:text-slate-200">{formatAriary(salaireBrut)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">Salaire net</span>
              <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">{formatAriary(salaireNet)}</span>
            </div>
            {totalAvance > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[13px] leading-[1.3] text-amber-600 dark:text-amber-400">
                  <TrendingDown size={13} strokeWidth={2.2} /> Avance déduite
                </span>
                <span className="text-[14px] font-semibold text-amber-600 dark:text-amber-400">- {formatAriary(totalAvance)}</span>
              </div>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t pt-2.5 dark:border-white/[0.08]">
            <span className="text-[13.5px] font-bold text-emerald-600 dark:text-emerald-400">NET PAYÉ</span>
            <span className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400">{formatAriary(totalPaye)}</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[13px] text-slate-400 dark:text-slate-500">Mode</span>
            <div className="flex items-center gap-1 text-[14px] text-slate-500 dark:text-slate-400"><CreditCard size={14} strokeWidth={2.2} />{latestPayment?.mode_paiement || '—'}</div>
          </div>
          {latestPayment?.reference && (
            <div className="mt-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-[13px] leading-[1.3] text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
              Réf. : <span className="font-semibold text-slate-700 dark:text-slate-200">{latestPayment.reference}</span>
            </div>
          )}
        </>
      ) : (
        <>
          {/* ⭐ FIX: Message mazava fa non payé amin'ny VOLANA */}
          <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[13px] leading-[1.3] text-red-600 dark:bg-red-500/[0.08] dark:text-red-400">
            Aucun paiement enregistré pour <strong>{monthLabel}</strong>.
          </div>
          {onPay && (
            <button
              type="button"
              onClick={onPay}
              className="mt-2 inline-flex w-full h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-[14px] font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <Plus size={15} strokeWidth={2.5} />
              Payer pour {MONTHS[currentMonth]}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function MonthlyEmployeeCard({
  employe, payments, statut, isDark, onPay,
}: {
  employe: EmployePaiement;
  payments: PaiementCalendrier[];
  statut: string;
  isDark: boolean;
  onPay?: () => void;
}) {
  const totalPaye = payments.reduce((sum, p) => sum + toNumber(p.montant), 0);
  const totalAvance = payments.reduce((sum, p) => sum + toNumber(p.avance), 0);
  const latestPayment = payments.length > 0 ? payments[0] : null;
  const hasPayment = payments.length > 0;
  const salaireNet = computeSalaireNet(latestPayment);

  const name = `${employe.prenom ?? ''} ${employe.nom ?? ''}`.trim() || 'Employé';
  const initials = name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-4 transition-colors"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold"
          style={{
            backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.10)',
            color: '#6366F1',
          }}
        >
          {initials || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
            {name}
          </p>
          <p className="mt-0.5 truncate text-[13px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
            {employe.poste || 'Poste non renseigné'}
          </p>
        </div>
        <StatusBadge status={statut} />
      </div>

      <div className="space-y-2 border-t pt-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
        {hasPayment ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Salaire net</span>
              <span className="text-[14px] font-semibold" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                {formatAriary(salaireNet)}
              </span>
            </div>
            {totalAvance > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[13px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                  <TrendingDown size={13} strokeWidth={2.2} />
                  Avance
                </span>
                <span className="text-[13.5px] font-semibold text-amber-600 dark:text-amber-400">
                  - {formatAriary(totalAvance)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-2.5" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
              <span className="text-[13.5px] font-bold text-emerald-600 dark:text-emerald-400">NET PAYÉ</span>
              <span className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400">
                {formatAriary(totalPaye)}
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="py-1 text-center text-[13.5px] italic" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
              Aucun paiement
            </p>
            {onPay && (
              <button
                type="button"
                onClick={onPay}
                className="mt-1 inline-flex w-full h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-[14px] font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                <Plus size={15} strokeWidth={2.5} />
                Payer
              </button>
            )}
          </>
        )}
      </div>

      {hasPayment && latestPayment && (
        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
          <div className="flex items-center gap-1.5">
            <Clock3 size={13} style={{ color: isDark ? '#94A3B8' : '#64748B' }} />
            <span className="text-[13px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              {formatDate(latestPayment.date_paiement)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CreditCard size={13} style={{ color: isDark ? '#94A3B8' : '#64748B' }} />
            <span className="text-[13px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              {latestPayment.mode_paiement || '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const v = status || 'Non payé';
  let classes = 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-slate-300';
  if (v === 'Payé') classes = 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400';
  else if (v === 'Non payé') classes = 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400';
  return <span className={`inline-flex shrink-0 items-center rounded-md border px-2 py-1 text-[12.5px] font-semibold ${classes}`}>{v}</span>;
}