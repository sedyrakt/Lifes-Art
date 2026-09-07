import React, { useMemo, useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, CreditCard, Users, X, List, CheckCircle2, XCircle, AlertCircle, Search, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export interface PaiementCalendrier {
  id?: number; employe_id: number; mois: number; annee: number; montant: number;
  mode_paiement?: string | null; statut?: string | null; reference?: string | null; observation?: string | null;
  salaire_brut?: number | null; cnaps?: number | null; ostie?: number | null; irsa?: number | null; avance?: number | null;
  date_paiement?: string | null; created_at?: string | null;
  employe_nom?: string | null; employe_prenom?: string | null; employe_poste?: string | null; salaire_base?: number | null;
}
interface EmployePaiement { id: number; nom?: string; prenom?: string; poste?: string; salaire?: number; salaire_base?: number; }
interface PaiementsCalendrierProps {
  paiements?: PaiementCalendrier[];
  allPaiements?: PaiementCalendrier[];
  employes?: EmployePaiement[];
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const WEEK_DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

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

export default function PaiementsCalendrier({ paiements = [], allPaiements = [], employes = [] }: PaiementsCalendrierProps) {
  const { isDark } = useTheme();
  const sourcePaiements = allPaiements.length > 0 ? allPaiements : paiements;
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendrier' | 'mensuel'>('calendrier');
  const [searchEmployee, setSearchEmployee] = useState('');
  
  // ⭐ VAOVAO: State ho an'ny drawer width
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);

  const [searchDrawer, setSearchDrawer] = useState('');
  const [currentPageDrawer, setCurrentPageDrawer] = useState(1);
  const [statusFilterDrawer, setStatusFilterDrawer] = useState<'Tous' | 'Payé' | 'Partiel' | 'Non payé'>('Tous');

  const todayKey = useMemo(() => getLocalDateISO(), []);

  const bgDark = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const borderDark = isDark ? 'border-white/[0.08]' : 'border-slate-200';

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

  const currentMonthTotal = useMemo(() => currentMonthPayments.reduce((sum, p) => sum + toNumber(p.montant), 0), [currentMonthPayments]);
  const currentMonthEmployees = useMemo(() => new Set(currentMonthPayments.map(p => p.employe_id)).size, [currentMonthPayments]);
  const daysWithPayment = useMemo(() => new Set(currentMonthPayments.map(p => getPaymentDateKey(p)).filter(Boolean)).size, [currentMonthPayments]);

  const selectedPayments = useMemo(() => selectedDate ? (paymentMap.get(selectedDate) ?? []) : [], [selectedDate, paymentMap]);

  // ⭐⭐ VAOVAO: LISTE DES EMPLOYÉS POUR LA DATE SÉLECTIONNÉE (AVEC FILTRE + RECHERCHE)
  const employeeListForSelectedDate = useMemo(() => {
    if (!selectedDate || !employes || employes.length === 0) return [];
    const datePayments = paymentMap.get(selectedDate) || [];
    const search = searchDrawer.trim().toLowerCase();
    return employes
      .map(emp => {
        const payment = datePayments.find(p => Number(p.employe_id) === Number(emp.id)) || null;
        const status = payment?.statut || 'Non payé';
        return { employe: emp, payment, status };
      })
      .filter(({ employe, status }) => {
        const matchSearch = !search || `${employe.prenom ?? ''} ${employe.nom ?? ''}`.toLowerCase().includes(search);
        const matchStatus = statusFilterDrawer === 'Tous' || status === statusFilterDrawer;
        return matchSearch && matchStatus;
      });
  }, [selectedDate, employes, paymentMap, searchDrawer, statusFilterDrawer]);

  // ⭐ VAOVAO: Dynamic items per page
  const currentItemsPerPage = isDrawerExpanded ? 8 : 4;

  const totalDrawerPages = Math.max(1, Math.ceil(employeeListForSelectedDate.length / currentItemsPerPage));
  const paginatedDrawerEmployees = useMemo(() => {
    const start = (currentPageDrawer - 1) * currentItemsPerPage;
    return employeeListForSelectedDate.slice(start, start + currentItemsPerPage);
  }, [employeeListForSelectedDate, currentPageDrawer, currentItemsPerPage]);

  const goPreviousMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y-1); } else { setCurrentMonth(m => m-1); } setSelectedDate(null); setSearchEmployee(''); setSearchDrawer(''); setStatusFilterDrawer('Tous'); setCurrentPageDrawer(1); };
  const goNextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y+1); } else { setCurrentMonth(m => m+1); } setSelectedDate(null); setSearchEmployee(''); setSearchDrawer(''); setStatusFilterDrawer('Tous'); setCurrentPageDrawer(1); };
  const goToday = () => { const today = new Date(); setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); setSelectedDate(getLocalDateISO(today)); setSearchEmployee(''); setSearchDrawer(''); setStatusFilterDrawer('Tous'); setCurrentPageDrawer(1); };

  const periodPayments = useMemo(() => {
    return sourcePaiements.filter(p => Number(p.mois) === currentMonth + 1 && Number(p.annee) === currentYear);
  }, [sourcePaiements, currentMonth, currentYear]);

  const monthlyStats = useMemo(() => {
    let payes = 0, partiels = 0, nonPayes = 0;
    periodPayments.forEach(p => {
      if (p.statut === 'Payé') payes++;
      else if (p.statut === 'Partiel') partiels++;
      else nonPayes++;
    });
    return { payes, partiels, nonPayes };
  }, [periodPayments]);

  const periodPaymentMap = useMemo(() => {
    const map = new Map<number, PaiementCalendrier>();
    periodPayments.forEach(p => {
      const id = Number(p.employe_id);
      if (!map.has(id) || (p.id && (!map.get(id)?.id || p.id > (map.get(id)?.id ?? 0)))) {
        map.set(id, p);
      }
    });
    return map;
  }, [periodPayments]);

  const monthlyStatusList = useMemo(() => {
    if (!employes || employes.length === 0) return [];
    const search = searchEmployee.trim().toLowerCase();
    return employes
      .filter(emp => `${emp.prenom ?? ''} ${emp.nom ?? ''}`.toLowerCase().includes(search))
      .map(emp => {
        const payment = periodPaymentMap.get(Number(emp.id));
        return {
          employe: emp,
          payment: payment || null,
          statut: payment?.statut || 'Non payé'
        };
      })
      .sort((a, b) => {
        const order = { 'Payé': 0, 'Partiel': 1, 'Non payé': 2 };
        return (order[a.statut] ?? 3) - (order[b.statut] ?? 3);
      });
  }, [employes, periodPaymentMap, searchEmployee]);

  return (
    <div className={`flex min-h-full flex-col ${bgDark}`}>
      {/* Header */}
      <div className={`shrink-0 border-b ${borderDark}`}>
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><CalendarDays size={18} /></div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Calendrier des paiements</h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">Date réelle de paiement</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex rounded-lg border border-slate-200 dark:border-white/[0.12] p-1 bg-white dark:bg-[#0F172A]">
              <button onClick={() => setViewMode('calendrier')} className={`px-3 py-1.5 rounded-md text-[13px] font-semibold transition ${viewMode === 'calendrier' ? 'bg-brand-500 text-white' : 'text-slate-500 dark:text-slate-400'}`}>Calendrier</button>
              <button onClick={() => setViewMode('mensuel')} className={`px-3 py-1.5 rounded-md text-[13px] font-semibold transition ${viewMode === 'mensuel' ? 'bg-brand-500 text-white' : 'text-slate-500 dark:text-slate-400'}`}>Mensuel</button>
            </div>
            <button type="button" onClick={goPreviousMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]"><ChevronLeft size={15} /></button>
            <div className="min-w-[150px] text-center"><p className="text-[16px] font-bold text-slate-900 dark:text-white">{MONTHS[currentMonth]} {currentYear}</p></div>
            <button type="button" onClick={goNextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]"><ChevronRight size={15} /></button>
            <button type="button" onClick={goToday} className="ml-1 h-8 rounded-lg border border-brand-200 bg-brand-50 px-3 text-[13px] font-semibold text-brand-600 hover:bg-brand-100 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400">Aujourd'hui</button>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-px border-t border-slate-200 bg-slate-200 dark:border-white/[0.08] dark:bg-white/[0.08]">
          <CalendarKpi icon={<CircleDollarSign size={14} />} label="Montant" value={formatAriary(currentMonthTotal)} />
          <CalendarKpi icon={<Users size={14} />} label="Employés" value={currentMonthEmployees} />
          <CalendarKpi icon={<CalendarDays size={14} />} label="Jours payés" value={daysWithPayment} />
        </div>
      </div>

      {viewMode === 'calendrier' ? (
        <>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <div className={`min-w-[720px] overflow-hidden rounded-xl border ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800/50">
                {WEEK_DAYS.map(day => <div key={day} className="px-2 py-2 text-center text-[12px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{day}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {calendarCells.map((day, index) => {
                  if (day === null) return <div key={`empty-${index}`} className="min-h-[105px] border-b border-r border-slate-100 bg-slate-50/50 dark:border-white/[0.05] dark:bg-white/[0.02]" />;
                  const dateKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const dayPayments = paymentMap.get(dateKey) ?? [];
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === selectedDate;
                  const dayTotal = dayPayments.reduce((sum, p) => sum + toNumber(p.montant), 0);
                  return <CalendarDay key={dateKey} day={day} dateKey={dateKey} payments={dayPayments} total={dayTotal} isToday={isToday} isSelected={isSelected} onClick={() => setSelectedDate(dateKey)} />;
                })}
              </div>
            </div>
          </div>
          {/* DRAWER (Dynamic width) */}
          {selectedDate && (
            <>
              <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDate(null)} />
              <div
                className={`fixed inset-y-0 right-0 z-[9999] flex flex-col border-l ${isDark ? 'border-white/[0.08] bg-[#0F172A]' : 'border-slate-200 bg-white'} shadow-2xl`}
                style={{ width: isDrawerExpanded ? '100%' : '30%', transition: 'width 0.3s ease' }}
              >
                <div className={`shrink-0 border-b p-4 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[16px] font-bold text-slate-900 dark:text-white">Employés du {formatDate(selectedDate)}</p>
                      <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{employeeListForSelectedDate.length} employé{employeeListForSelectedDate.length > 1 ? 's' : ''}</p>
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
                      <button onClick={() => setSelectedDate(null)} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><X size={14} /></button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un employé..."
                      value={searchDrawer}
                      onChange={e => { setSearchDrawer(e.target.value); setCurrentPageDrawer(1); }}
                      className={`w-full h-9 pl-8 pr-3 rounded-lg border ${isDark ? 'border-white/[0.12] bg-[#0F172A] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(['Tous', 'Payé', 'Partiel', 'Non payé'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => { setStatusFilterDrawer(status); setCurrentPageDrawer(1); }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                          statusFilterDrawer === status
                            ? status === 'Payé' ? 'bg-success-500 text-white' : status === 'Partiel' ? 'bg-warning-500 text-white' : status === 'Non payé' ? 'bg-danger-500 text-white' : 'bg-brand-500 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  {paginatedDrawerEmployees.length === 0 ? (
                    <div className={`rounded-lg border border-dashed p-4 text-center ${isDark ? 'border-white/[0.12] bg-white/[0.02]' : 'border-slate-300 bg-white'}`}>
                      <Clock3 size={17} className="mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="mt-2 text-[14px] font-medium text-slate-500 dark:text-slate-400">Aucun employé trouvé.</p>
                    </div>
                  ) : (
                    // ⭐ Rehefa expanded dia grid 4 colonnes
                    <div className={isDrawerExpanded ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3' : 'space-y-2'}>
                      {paginatedDrawerEmployees.map(({ employe, payment }) => (
                        <EmployeeDayCard key={employe.id} employe={employe} payment={payment} />
                      ))}
                    </div>
                  )}
                </div>
                {totalDrawerPages > 1 && (
                  <div className={`shrink-0 border-t p-3 flex items-center justify-between ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                    <button type="button" disabled={currentPageDrawer === 1} onClick={() => setCurrentPageDrawer(p => Math.max(1, p - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]"><ChevronLeft size={15} /></button>
                    <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">Page {currentPageDrawer} / {totalDrawerPages}</span>
                    <button type="button" disabled={currentPageDrawer === totalDrawerPages} onClick={() => setCurrentPageDrawer(p => Math.min(totalDrawerPages, p + 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-white/[0.06]"><ChevronRight size={15} /></button>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className={`p-3 rounded-xl border ${isDark ? 'border-success-500/20 bg-success-500/10' : 'border-success-200 bg-success-50'}`}>
              <p className="text-[12px] font-semibold text-success-600 dark:text-success-400">Payés</p>
              <p className="text-[20px] font-bold text-success-700 dark:text-success-400">{monthlyStats.payes}</p>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'border-warning-500/20 bg-warning-500/10' : 'border-warning-200 bg-warning-50'}`}>
              <p className="text-[12px] font-semibold text-warning-600 dark:text-warning-400">Partiels</p>
              <p className="text-[20px] font-bold text-warning-700 dark:text-warning-400">{monthlyStats.partiels}</p>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'border-danger-500/20 bg-danger-500/10' : 'border-danger-200 bg-danger-50'}`}>
              <p className="text-[12px] font-semibold text-danger-600 dark:text-danger-400">Non payés</p>
              <p className="text-[20px] font-bold text-danger-700 dark:text-danger-400">{monthlyStats.nonPayes}</p>
            </div>
          </div>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Rechercher un employé..." value={searchEmployee} onChange={e => setSearchEmployee(e.target.value)} className={`w-full h-10 pl-10 pr-4 rounded-lg border ${isDark ? 'border-white/[0.12] bg-[#0F172A] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`} />
          </div>
          <div className="space-y-2">
            {monthlyStatusList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">{employes && employes.length > 0 ? 'Aucun employé trouvé' : 'Aucune donnée employé fournie'}</div>
            ) : (
              monthlyStatusList.map(({ employe, payment, statut }) => (
                <div key={employe.id} className={`rounded-xl border p-3 flex items-center gap-3 ${isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-slate-200 bg-white'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">{employe.prenom} {employe.nom}</p>
                    {employe.poste && <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-slate-400">{employe.poste}</p>}
                    {payment?.montant ? <p className="text-[13px] text-slate-500 dark:text-slate-400">Montant payé : <span className="font-semibold text-brand-600 dark:text-brand-400">{formatAriary(payment.montant)}</span></p> : <p className="text-[13px] text-slate-500 dark:text-slate-400">Aucun paiement</p>}
                  </div>
                  <StatusBadge status={statut} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarKpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  const { isDark } = useTheme();
  return <div className={`flex items-center gap-2.5 px-3 py-2 ${isDark ? 'bg-[#0F172A]' : 'bg-white'}`}>
    <div className={`flex h-7 w-7 items-center justify-center rounded-md ${isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-[12px] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>;
}

function CalendarDay({ day, dateKey, payments, total, isToday, isSelected, onClick }: {
  day: number; dateKey: string; payments: PaiementCalendrier[]; total: number; isToday: boolean; isSelected: boolean; onClick: () => void;
}) {
  const { isDark } = useTheme();
  const hasPayments = payments.length > 0;
  const paidCount = payments.filter(p => p.statut === 'Payé').length;
  const partialCount = payments.filter(p => p.statut === 'Partiel').length;
  const unpaidCount = payments.filter(p => p.statut === 'Non payé').length;
  return (
    <button type="button" onClick={onClick} className={`relative min-h-[105px] border-b border-r p-2 text-left transition hover:bg-slate-50 dark:hover:bg-white/[0.03] ${isDark ? 'border-white/[0.05] bg-[#0F172A]' : 'border-slate-100 bg-white'} ${isSelected ? 'bg-brand-50/60 ring-2 ring-inset ring-brand-400 dark:bg-brand-500/10' : ''}`}>
      <div className="flex items-center justify-between">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold ${isToday ? 'bg-brand-500 text-white' : 'text-slate-700 dark:text-slate-200'}`}>{day}</span>
        {hasPayments && <span className="text-[12px] font-semibold text-slate-400">{payments.length}</span>}
      </div>
      {hasPayments && (
        <div className="mt-2">
          <div className="rounded-lg bg-brand-50 px-2 py-1.5 dark:bg-brand-500/10">
            <p className="text-[12px] text-brand-500 dark:text-brand-400">Total</p>
            <p className="mt-0.5 truncate text-[14px] font-bold text-brand-700 dark:text-brand-300">{formatAriary(total)}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {paidCount > 0 && <span className="rounded bg-success-50 px-1.5 py-0.5 text-[11px] font-bold text-success-600 dark:bg-success-500/10 dark:text-success-400">{paidCount} payé{paidCount > 1 ? 's' : ''}</span>}
            {partialCount > 0 && <span className="rounded bg-warning-50 px-1.5 py-0.5 text-[11px] font-bold text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">{partialCount} partiel{partialCount > 1 ? 's' : ''}</span>}
            {unpaidCount > 0 && <span className="rounded bg-danger-50 px-1.5 py-0.5 text-[11px] font-bold text-danger-600 dark:bg-danger-500/10 dark:text-danger-400">{unpaidCount} impayé{unpaidCount > 1 ? 's' : ''}</span>}
          </div>
          <div className="mt-2 truncate text-[12px] text-slate-500 dark:text-slate-400">{payments.slice(0,2).map(p => getEmployeeName(p)).join(', ')}{payments.length > 2 && ` +${payments.length-2}`}</div>
        </div>
      )}
      {!hasPayments && <div className="mt-5 text-center text-[12px] text-slate-300 dark:text-slate-600">—</div>}
      {isToday && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-500" />}
      <span className="sr-only">{dateKey}</span>
    </button>
  );
}

function EmployeeDayCard({ employe, payment }: { employe: EmployePaiement; payment: PaiementCalendrier | null }) {
  const { isDark } = useTheme();
  const status = payment?.statut || 'Non payé';
  return (
    <div className={`rounded-xl border p-3 ${isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{employe.prenom} {employe.nom}</p>
          {employe.poste && <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">{employe.poste}</p>}
        </div>
        <StatusBadge status={status} />
      </div>
      {payment ? (
        <>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div><p className="text-[12px] text-slate-500 dark:text-slate-400">Montant payé</p><p className="mt-0.5 text-[17px] font-bold text-brand-600 dark:text-brand-400">{formatAriary(payment.montant)}</p></div>
            <div className="text-right"><p className="text-[12px] text-slate-500 dark:text-slate-400">Date réelle</p><p className="mt-0.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200">{formatDate(payment.date_paiement)}</p></div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-2 dark:border-white/[0.08]">
            <div><p className="text-[12px] text-slate-500 dark:text-slate-400">Période de paie</p><p className="mt-0.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200">{getPeriodLabel(payment)}</p></div>
            <div className="flex items-center gap-1 text-[13px] text-slate-500 dark:text-slate-400"><CreditCard size={12} />{payment.mode_paiement || '—'}</div>
          </div>
          {payment.reference && <div className="mt-2 rounded-md bg-slate-50 px-2 py-1.5 text-[12px] text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">Réf. : <span className="font-semibold text-slate-700 dark:text-slate-200">{payment.reference}</span></div>}
        </>
      ) : (
        <div className="mt-3 rounded-md bg-slate-50 px-2 py-1.5 text-[12px] text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">Aucun paiement enregistré pour cette date.</div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const v = status || 'Non payé';
  let classes = 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300';
  if (v === 'Payé') classes = 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400';
  else if (v === 'Partiel') classes = 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400';
  else if (v === 'Non payé') classes = 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400';
  return <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-1 text-[12px] font-bold ${classes}`}>{v}</span>;
}