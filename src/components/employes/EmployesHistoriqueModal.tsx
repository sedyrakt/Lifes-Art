// src/components/employes/EmployesHistoriqueModal.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX ALIGN: getEffectiveStatus (priority retard > hs > present)
// ⭐ FIX CHAMPS: Fallback ho an'ny anaran'ny champ API
// ⭐ KEEP: "Par Mois" (CARDS 1er → farany andro) + "Par Année" (TABLE)
// ⭐ VAOVAO: Export Excel / PDF / CSV amin'ny saveFileWithDialog
// ⭐ NEW: StatCards misy loko (aligné amin'ny AchatsStats)
// ⭐ FIX STATS: Maka avy amin'ny cardsData rehefa mois + employé voafidy (feno andro)

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, CalendarDays, Loader2, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Search,
  Clock3, Timer, TrendingUp, Users, Ban, Palmtree,
  FileSpreadsheet, FileText, FileDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '../../contexts/ThemeContext';
import saveFileWithDialog from '../../utils/saveFileWithDialog';

const COLORS = {
  light: { card: '#FFFFFF', border: '#E2E8F0', softBg: '#F8FAFC', text: '#0F172A', muted: '#64748B', primary: '#4F46E5', green: '#059669', red: '#DC2626', amber: '#D97706', sky: '#0284C7' },
  dark: { card: '#0F172A', border: 'rgba(255,255,255,0.12)', softBg: '#0F172A', text: '#F8FAFC', muted: '#94A3B8', primary: '#4F46E5', green: '#34D399', red: '#F87171', amber: '#FBBF24', sky: '#38BDF8' }
};

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const PAGE_SIZE = 10;

type ViewType = 'mois' | 'annee';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employes?: any[];
  employeId?: number;
  mois?: number;
  annee?: number;
  dateReference?: string | null;
}

// ⭐ Palette harmonisée amin'ny stat cards
const STAT_ACCENTS = {
  total: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accent: '#6366F1',
  },
  presents: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: '#10B981',
  },
  absents: {
    iconBg: 'bg-red-50 dark:bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    accent: '#EF4444',
  },
  conges: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accent: '#F59E0B',
  },
  travail: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accent: '#6366F1',
  },
  retards: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accent: '#F59E0B',
  },
  heuresSup: {
    iconBg: 'bg-sky-50 dark:bg-sky-500/10',
    iconColor: 'text-sky-600 dark:text-sky-400',
    accent: '#0EA5E9',
  },
  taux: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: '#10B981',
  },
  moyenne: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accent: '#6366F1',
  },
};

// ═══════════════════════════════════════════════════════════════
// Normalisation ny anaran'ny champ API
// ═══════════════════════════════════════════════════════════════
function getRetard(d: any): number {
  return Number(d?.minutes_retard ?? d?.retard ?? d?.minutesRetard ?? 0) || 0;
}
function getHeuresSup(d: any): number {
  return Number(d?.heures_sup ?? d?.heures_supp ?? d?.heuresSupp ?? 0) || 0;
}
function getHeuresTravaillees(d: any): number {
  return Number(d?.heures_travaillees ?? d?.heuresTravaillees ?? 0) || 0;
}
function getHeureArrivee(d: any): string {
  return d?.heure_arrivee || d?.heure_entree || '';
}
function getHeureDepart(d: any): string {
  return d?.heure_depart || d?.heure_sortie || '';
}

function formatMinutes(minutes: number | string | null | undefined): string {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m <= 0) return '0 min';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest > 0 ? `${h}h${String(rest).padStart(2, '0')}` : `${h}h`;
}

function formatHours(hours: number | string | null | undefined): string {
  const h = Math.max(0, Number(hours) || 0);
  if (h <= 0) return '0h00';
  const totalMinutes = Math.round(h * 60);
  const hoursInt = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hoursInt}h${String(mins).padStart(2, '0')}`;
}

function getEffectiveStatus(
  statut: string,
  minutesRetard: number | string | null | undefined,
  heuresSup: number | string | null | undefined,
): string {
  const s = String(statut || '').toLowerCase();
  if (s !== 'present') return s;
  if (Number(minutesRetard) > 0) return 'retard';
  if (Number(heuresSup) > 0) return 'hs';
  return 'present';
}

function getEmployeeFullName(emp: any): string {
  return `${emp?.prenom || ''} ${emp?.nom || ''}`.trim() || 'Employé';
}

function formatDateFR(dateStr: string): string {
  if (!dateStr) return '—';
  return dateStr.split('-').reverse().join('/');
}

function getStatutLabelForExport(statut: string, retard: number, hs: number): string {
  const effective = getEffectiveStatus(statut, retard, hs);
  if (effective === 'present')    return 'Présent';
  if (effective === 'retard')     return 'Retard';
  if (effective === 'hs')         return 'Heures Supp.';
  if (effective === 'absent')     return 'Absent';
  if (effective === 'conge')      return 'Congé';
  if (effective === 'en_attente') return 'En attente';
  if (effective === 'non_pointe') return 'Non pointé';
  return effective || 'Non pointé';
}

// ═══════════════════════════════════════════════════════════════
// STAT CARD — aligné amin'ny AchatsStats
// ═══════════════════════════════════════════════════════════════

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accentKey: keyof typeof STAT_ACCENTS;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, accentKey }) => {
  const accent = STAT_ACCENTS[accentKey];
  return (
    <div className="group relative flex min-h-[95px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors duration-200 hover:border-brand-500/30 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-brand-500/30">
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ backgroundColor: accent.accent }}
      />
      <div className="flex min-w-0 items-start gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconColor} transition-transform duration-200 group-hover:scale-105`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold uppercase leading-[1.4] tracking-[0.07em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p
            className="mt-1 truncate text-[20px] font-bold leading-[1.3] tracking-tight text-slate-900 dark:text-slate-100"
            title={String(value)}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const EmployesHistoriqueModal: React.FC<Props> = ({ isOpen, onClose, employes = [], employeId, mois, annee, dateReference }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;

  const [viewType, setViewType] = useState<ViewType>('mois');
  const [moisState, setMoisState] = useState(mois || new Date().getMonth() + 1);
  const [anneeState, setAnneeState] = useState(annee || new Date().getFullYear());
  const [statut, setStatut] = useState('Tous');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(employeId || null);
  const [allEmployes, setAllEmployes] = useState<any[]>(employes);

  useEffect(() => {
    if (isOpen) {
      setMoisState(mois || new Date().getMonth() + 1);
      setAnneeState(annee || new Date().getFullYear());
    }
  }, [isOpen, mois, annee]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedEmployeeId && allEmployes.length > 0) {
      const emp = allEmployes.find(e => e.id === selectedEmployeeId);
      if (emp) setEmployeeSearch(getEmployeeFullName(emp));
    }
  }, [isOpen, selectedEmployeeId, allEmployes]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await window.api.employes.getPresenceHistorique({
        type: viewType,
        mois: moisState,
        annee: anneeState,
        statut,
        employe_id: selectedEmployeeId || undefined,
      });
      if (response?.success) setData(response.data || []);
      else setData([]);
    } catch (error) {
      console.error('Erreur historique:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [viewType, moisState, anneeState, statut, selectedEmployeeId]);

  const fetchAllEmployes = useCallback(async () => {
    if (allEmployes.length > 0) return;
    try {
      const response = await window.api.employes.getAll({ limit: 10000 });
      if (response?.success) setAllEmployes(response.data || []);
    } catch (error) {
      console.error('Erreur chargement employés:', error);
    }
  }, [allEmployes.length]);

  useEffect(() => {
    if (isOpen) {
      void fetchData();
      void fetchAllEmployes();
    }
  }, [isOpen, fetchData, fetchAllEmployes]);

  useEffect(() => { setCurrentPage(1); }, [viewType, moisState, anneeState, statut, selectedEmployeeId]);

  // ⭐⭐⭐ CARDS: feno ny andro rehetra ⭐⭐⭐
  const cardsData = useMemo(() => {
    if (viewType !== 'mois') return [];
    if (!selectedEmployeeId) return data;

    const daysInMonth = new Date(anneeState, moisState, 0).getDate();
    const result: any[] = [];
    const selectedEmp = allEmployes.find(e => e.id === selectedEmployeeId);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${anneeState}-${String(moisState).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const existing = data.find(d => d.date === dateStr);

      if (existing) {
        result.push(existing);
      } else {
        const today = new Date();
        const isFuture = new Date(dateStr) > today;
        result.push({
          date: dateStr,
          prenom: selectedEmp?.prenom || '',
          nom: selectedEmp?.nom || '',
          statut: isFuture ? 'en_attente' : 'non_pointe',
          retard: 0,
          minutes_retard: 0,
          heures_sup: 0,
          heures_travaillees: 0,
        });
      }
    }
    return result;
  }, [data, viewType, selectedEmployeeId, moisState, anneeState, allEmployes]);

  // ⭐⭐⭐ FIX STATS: Maka avy amin'ny cardsData rehefa mois + employé voafidy ⭐⭐⭐
  const stats = useMemo(() => {
    // Raha viewType='mois' sy misy employé voafidy dia mampiasa cardsData (feno andro)
    // fa raha tsy izany dia mampiasa data (données réelles)
    const source = (viewType === 'mois' && selectedEmployeeId) ? cardsData : data;

    let presents = 0, absents = 0, conges = 0, retards = 0, hsCount = 0, nonPointes = 0;
    let totalHeuresTravaillees = 0, totalMinutesRetard = 0, totalHeuresSup = 0;

    source.forEach((d) => {
      const retard = getRetard(d);
      const heuresSup = getHeuresSup(d);
      const heuresTravaillees = getHeuresTravaillees(d);
      const effective = getEffectiveStatus(d.statut, retard, heuresSup);

      if (effective === 'present')        presents++;
      else if (effective === 'retard')    retards++;
      else if (effective === 'hs')        hsCount++;
      else if (effective === 'absent')    absents++;
      else if (effective === 'conge')     conges++;
      else                                 nonPointes++;

      totalHeuresTravaillees += heuresTravaillees;
      totalMinutesRetard     += retard;
      totalHeuresSup         += heuresSup;
    });

    const total = source.length;
    const tauxPresence = total > 0 ? Math.round((presents / total) * 1000) / 10 : 0;
    const tauxAbsence  = total > 0 ? Math.round((absents  / total) * 1000) / 10 : 0;
    const moyenneJour  = presents > 0 ? totalHeuresTravaillees / presents : 0;

    return {
      total, presents, absents, conges, retards, hsCount, nonPointes,
      totalHeuresTravaillees, totalMinutesRetard, totalHeuresSup,
      tauxPresence, tauxAbsence, moyenneJour,
    };
  }, [data, cardsData, viewType, selectedEmployeeId]);

  const paginatedData = useMemo(() => {
    if (viewType === 'mois') return cardsData;
    const start = (currentPage - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  }, [cardsData, data, currentPage, viewType]);

  const totalPages = useMemo(() => {
    if (viewType === 'mois') return 1;
    return Math.ceil(data.length / PAGE_SIZE);
  }, [data.length, viewType]);

  const filteredEmployees = useMemo(() => {
    const search = employeeSearch.toLowerCase().trim();
    const list = allEmployes.length > 0 ? allEmployes : employes;
    if (!search) return list.slice(0, 50);
    return list.filter(emp =>
      `${emp.prenom || ''} ${emp.nom || ''}`.toLowerCase().includes(search)
    );
  }, [allEmployes, employes, employeeSearch]);

  // ═══════════════════════════════════════════════════════════════
  // EXPORT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  const buildExportRows = useCallback(() => {
    const source = viewType === 'mois' ? cardsData : data;
    return source.map((item) => {
      const retard = getRetard(item);
      const heuresSup = getHeuresSup(item);
      const heuresTravaillees = getHeuresTravaillees(item);
      const effective = getEffectiveStatus(item.statut, retard, heuresSup);

      return {
        date: item.date,
        dateFR: formatDateFR(item.date),
        employe: `${item.prenom || ''} ${item.nom || ''}`.trim(),
        poste: item.poste || '',
        statut: getStatutLabelForExport(item.statut, retard, heuresSup),
        heureArrivee: getHeureArrivee(item) || '--:--',
        heureDepart: getHeureDepart(item) || '--:--',
        heuresTravaillees: heuresTravaillees > 0 ? formatHours(heuresTravaillees) : '—',
        retard: retard > 0 ? formatMinutes(retard) : '—',
        heuresSup: heuresSup > 0 ? formatHours(heuresSup) : '—',
        isNonPointe: !item.statut || effective === 'non_pointe' || effective === 'en_attente',
      };
    });
  }, [viewType, cardsData, data]);

  const getExportFileName = useCallback((ext: string) => {
    const empLabel = selectedEmployeeId
      ? `_${getEmployeeFullName(allEmployes.find(e => e.id === selectedEmployeeId)).replace(/\s+/g, '_')}`
      : '';
    if (viewType === 'mois') {
      return `Presences_${MONTHS[moisState - 1]}_${anneeState}${empLabel}.${ext}`;
    }
    return `Presences_${anneeState}${empLabel}.${ext}`;
  }, [viewType, moisState, anneeState, selectedEmployeeId, allEmployes]);

  const handleExportExcel = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const rows = buildExportRows();
      if (rows.length === 0) { alert('Aucune donnée à exporter.'); return; }

      const wsData = [
        ['Date', 'Employé', 'Poste', 'Statut', 'Arrivée', 'Départ', 'Travaillé', 'Retard', 'Heures Sup.'],
        ...rows.map(r => [
          r.dateFR, r.employe, r.poste, r.statut,
          r.heureArrivee, r.heureDepart, r.heuresTravaillees, r.retard, r.heuresSup,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 14 },
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet([
        ['Résumé'],
        ['Période', viewType === 'mois' ? `${MONTHS[moisState - 1]} ${anneeState}` : `Année ${anneeState}`],
        ['Employé', selectedEmployeeId ? getEmployeeFullName(allEmployes.find(e => e.id === selectedEmployeeId)) : 'Tous'],
        [],
        ['Total enregistrements', stats.total],
        ['Présents', stats.presents],
        ['Retards', stats.retards],
        ['Absents', stats.absents],
        ['Congés', stats.conges],
        ['Non pointés', stats.nonPointes],
        [],
        ['Heures travaillées', formatHours(stats.totalHeuresTravaillees)],
        ['Total retards', formatMinutes(stats.totalMinutesRetard)],
        ['Total heures sup.', formatHours(stats.totalHeuresSup)],
        ['Taux de présence', `${stats.tauxPresence}%`],
        ['Moyenne / jour', formatHours(stats.moyenneJour)],
      ]);
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 25 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Présences');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const buffer = new Uint8Array(wbout);

      const result = await saveFileWithDialog(
        buffer,
        getExportFileName('xlsx'),
        [{ name: 'Excel', extensions: ['xlsx'] }]
      );
      if (result.canceled) return;
      if (!result.success) alert(result.error || 'Erreur export Excel');
    } catch (error: any) {
      console.error('Export Excel error:', error);
      alert(error?.message || 'Erreur export Excel');
    } finally {
      setExporting(false);
    }
  }, [exporting, buildExportRows, stats, viewType, moisState, anneeState, selectedEmployeeId, allEmployes, getExportFileName]);

  const handleExportPDF = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const rows = buildExportRows();
      if (rows.length === 0) { alert('Aucune donnée à exporter.'); return; }

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth  = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const MARGIN_X = 6;
      const MARGIN_TOP = 6;
      const MARGIN_BOTTOM = 6;
      const CONTENT_WIDTH = pageWidth - MARGIN_X * 2;

      const TEXT_DARK: [number, number, number]   = [15, 23, 42];
      const TEXT_MUTED: [number, number, number]  = [100, 116, 139];
      const BORDER_GRAY: [number, number, number] = [148, 163, 184];
      const BORDER_DARK: [number, number, number] = [71, 85, 105];
      const WHITE: [number, number, number]       = [255, 255, 255];
      const INDIGO: [number, number, number]      = [79, 70, 229];

      let cursorY = MARGIN_TOP + 6;

      doc.setTextColor(...INDIGO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('Gestion des présences', MARGIN_X, cursorY);
      cursorY += 6;

      const infoLineHeight = 4;
      const infoPaddingY = 2;
      const infoPaddingX = 3;

      let infoLines = 1;
      if (selectedEmployeeId) infoLines++;
      infoLines += 2;
      const infoBoxHeight = infoLines * infoLineHeight + infoPaddingY * 2;

      doc.setDrawColor(...BORDER_DARK);
      doc.setLineWidth(0.25);
      doc.rect(MARGIN_X, cursorY, CONTENT_WIDTH, infoBoxHeight, 'S');

      let infoY = cursorY + infoPaddingY + 3;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_MUTED);
      const periodeLabel = viewType === 'mois'
        ? `Période : ${MONTHS[moisState - 1]} ${anneeState}`
        : `Période : Année ${anneeState}`;
      doc.text(periodeLabel, MARGIN_X + infoPaddingX, infoY);
      infoY += infoLineHeight;

      if (selectedEmployeeId) {
        const empLabel = getEmployeeFullName(allEmployes.find(e => e.id === selectedEmployeeId));
        doc.text(`Employé : ${empLabel}`, MARGIN_X + infoPaddingX, infoY);
        infoY += infoLineHeight;
      }

      doc.setFontSize(7.5);
      doc.setTextColor(...TEXT_DARK);
      doc.text(
        `Total: ${stats.total}  |  Présents: ${stats.presents} (${stats.tauxPresence}%)  |  Retards: ${stats.retards}  |  Absents: ${stats.absents}  |  Congés: ${stats.conges}`,
        MARGIN_X + infoPaddingX, infoY
      );
      infoY += infoLineHeight;
      doc.text(
        `Heures trav.: ${formatHours(stats.totalHeuresTravaillees)}  |  Retards cumulés: ${formatMinutes(stats.totalMinutesRetard)}  |  Heures sup.: ${formatHours(stats.totalHeuresSup)}`,
        MARGIN_X + infoPaddingX, infoY
      );

      cursorY += infoBoxHeight + 2.5;

      const rowCount = rows.length;
      const FOOTER_RESERVE = 5;
      const availableHeight = pageHeight - cursorY - MARGIN_BOTTOM - FOOTER_RESERVE;

      const estimateTableHeight = (fontSize: number, paddingY: number): number => {
        const headerH = fontSize * 0.6 + paddingY * 2 + 0.5;
        const rowH = fontSize * 0.55 + paddingY * 2;
        return headerH + rowH * rowCount;
      };

      let tableFontSize = 8;
      let cellPaddingY = 1.5;

      while (
        estimateTableHeight(tableFontSize, cellPaddingY) > availableHeight &&
        tableFontSize > 2.5
      ) {
        tableFontSize -= 0.15;
        cellPaddingY = Math.max(0.05, cellPaddingY - 0.06);
      }

      autoTable(doc, {
        startY: cursorY,
        head: [['Date', 'Employé', 'Poste', 'Statut', 'Arrivée', 'Départ', 'Travaillé', 'Retard', 'HS']],
        body: rows.map(r => [
          r.dateFR, r.employe, r.poste || '—', r.statut,
          r.heureArrivee, r.heureDepart, r.heuresTravaillees, r.retard, r.heuresSup,
        ]),
        theme: 'grid',
        styles: {
          fontSize: tableFontSize,
          cellPadding: { top: cellPaddingY, right: 1.5, bottom: cellPaddingY, left: 1.5 },
          textColor: TEXT_DARK,
          font: 'helvetica',
          valign: 'middle',
          lineColor: BORDER_GRAY,
          lineWidth: 0.1,
          overflow: 'linebreak',
          minCellHeight: 0,
        },
        headStyles: {
          fillColor: WHITE,
          textColor: TEXT_DARK,
          fontStyle: 'bold',
          fontSize: tableFontSize,
          halign: 'left',
          lineColor: BORDER_DARK,
          lineWidth: 0.2,
          cellPadding: { top: cellPaddingY + 0.3, right: 1.5, bottom: cellPaddingY + 0.3, left: 1.5 },
          minCellHeight: 0,
        },
        bodyStyles: { fillColor: WHITE },
        alternateRowStyles: { fillColor: WHITE },
        columnStyles: {
          0: { cellWidth: 'wrap', halign: 'left'  },
          1: { cellWidth: 'wrap', halign: 'left'  },
          2: { cellWidth: 'wrap', halign: 'left'  },
          3: { cellWidth: 'wrap', halign: 'left'  },
          4: { cellWidth: 'wrap', halign: 'center'},
          5: { cellWidth: 'wrap', halign: 'center'},
          6: { cellWidth: 'wrap', halign: 'center'},
          7: { cellWidth: 'wrap', halign: 'center'},
          8: { cellWidth: 'wrap', halign: 'center'},
        },
        tableWidth: CONTENT_WIDTH,
        margin: { left: MARGIN_X, right: MARGIN_X, top: cursorY, bottom: MARGIN_BOTTOM },
        pageBreak: 'avoid',
        showHead: 'everyPage',
      });

      const finalPage = doc.getNumberOfPages();
      doc.setPage(finalPage);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_MUTED);
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} à ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      doc.text(`Généré le ${dateStr}`, MARGIN_X, pageHeight - 3);

      doc.setTextColor(...INDIGO);
      doc.setFont('helvetica', 'bold');
      doc.text(`Page ${finalPage} / ${finalPage}`, pageWidth - MARGIN_X, pageHeight - 3, { align: 'right' });

      const buffer = doc.output('arraybuffer');

      const result = await saveFileWithDialog(
        buffer,
        getExportFileName('pdf'),
        [{ name: 'PDF', extensions: ['pdf'] }]
      );
      if (result.canceled) return;
      if (!result.success) alert(result.error || 'Erreur export PDF');
    } catch (error: any) {
      console.error('Export PDF error:', error);
      alert(error?.message || 'Erreur export PDF');
    } finally {
      setExporting(false);
    }
  }, [exporting, buildExportRows, stats, viewType, moisState, anneeState, selectedEmployeeId, allEmployes, getExportFileName]);

  const handleExportCSV = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const rows = buildExportRows();
      if (rows.length === 0) { alert('Aucune donnée à exporter.'); return; }

      const escapeCSV = (val: string | number | undefined) => {
        const s = String(val ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };

      const lines: string[] = [];
      lines.push(['Date', 'Employé', 'Poste', 'Statut', 'Arrivée', 'Départ', 'Travaillé', 'Retard', 'Heures Sup.'].map(escapeCSV).join(','));

      rows.forEach(r => {
        lines.push([
          r.dateFR, r.employe, r.poste, r.statut,
          r.heureArrivee, r.heureDepart, r.heuresTravaillees, r.retard, r.heuresSup,
        ].map(escapeCSV).join(','));
      });

      lines.push('');
      lines.push(escapeCSV('=== RÉSUMÉ ==='));
      lines.push(`${escapeCSV('Total')},${stats.total}`);
      lines.push(`${escapeCSV('Présents')},${stats.presents}`);
      lines.push(`${escapeCSV('Retards')},${stats.retards}`);
      lines.push(`${escapeCSV('Absents')},${stats.absents}`);
      lines.push(`${escapeCSV('Congés')},${stats.conges}`);
      lines.push(`${escapeCSV('Non pointés')},${stats.nonPointes}`);
      lines.push(`${escapeCSV('Heures travaillées')},${escapeCSV(formatHours(stats.totalHeuresTravaillees))}`);
      lines.push(`${escapeCSV('Total retards')},${escapeCSV(formatMinutes(stats.totalMinutesRetard))}`);
      lines.push(`${escapeCSV('Total heures sup.')},${escapeCSV(formatHours(stats.totalHeuresSup))}`);
      lines.push(`${escapeCSV('Taux de présence')},${escapeCSV(`${stats.tauxPresence}%`)}`);

      const csvContent = '\uFEFF' + lines.join('\r\n');
      const buffer = new TextEncoder().encode(csvContent);

      const result = await saveFileWithDialog(
        buffer,
        getExportFileName('csv'),
        [{ name: 'CSV', extensions: ['csv'] }]
      );
      if (result.canceled) return;
      if (!result.success) alert(result.error || 'Erreur export CSV');
    } catch (error: any) {
      console.error('Export CSV error:', error);
      alert(error?.message || 'Erreur export CSV');
    } finally {
      setExporting(false);
    }
  }, [exporting, buildExportRows, stats, getExportFileName]);

  if (!isOpen) return null;

  const handlePageChange = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const inputClass = `h-9 px-3 rounded-lg border text-[13.5px] outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`;

  const getStatutBadge = (
    s: string,
    minutesRetard: number | string | null | undefined = 0,
    heuresSup: number | string | null | undefined = 0,
  ) => {
    const effective = getEffectiveStatus(s, minutesRetard, heuresSup);
    if (effective === 'present')
      return { label: 'Présent', color: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400', Icon: CheckCircle2 };
    if (effective === 'retard')
      return { label: 'Retard', color: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400', Icon: Clock3 };
    if (effective === 'hs')
      return { label: 'Heures Supp.', color: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-400', Icon: Timer };
    if (effective === 'absent')
      return { label: 'Absent', color: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400', Icon: XCircle };
    if (effective === 'conge')
      return { label: 'Congé', color: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400', Icon: Palmtree };
    if (effective === 'en_attente')
      return { label: 'En attente', color: 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-slate-400', Icon: Clock3 };
    return { label: 'Non pointé', color: 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-slate-400', Icon: Ban };
  };

  const selectedEmployeeName = selectedEmployeeId
    ? getEmployeeFullName(allEmployes.find(e => e.id === selectedEmployeeId))
    : null;

  const modal = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-labelledby="historique-presence-title">
      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl border-[0.5px] shadow-[0_18px_55px_rgba(15,23,42,0.35)]" style={{ background: theme.card, borderColor: theme.border }} onMouseDown={(e) => e.stopPropagation()}>

        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

        {/* HEADER */}
        <div className="shrink-0 border-b h-14 px-4 flex items-center justify-between" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'rgba(79,70,229,0.06)' }}>
              <CalendarDays size={15} strokeWidth={2.2} style={{ color: theme.primary }} />
            </div>
            <h2 id="historique-presence-title" className="text-[13.5px] font-semibold" style={{ color: theme.text }}>Gestion des présences</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-white/[0.06]">
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: theme.card }}>

          {/* ═══════════ FILTERS + KPI ═══════════ */}
          <div className="shrink-0 border-b px-4 py-4 space-y-4" style={{ borderColor: theme.border, background: theme.card }}>

            {/* Row 1: Type + Date + Export */}
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border p-1" style={{ borderColor: theme.border, background: theme.card }}>
                  {(['mois', 'annee'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setViewType(t)}
                      className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${viewType === t ? 'bg-brand-500 text-white shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-white/[0.06]'}`}
                      style={{ color: viewType === t ? '#FFFFFF' : theme.muted }}
                    >
                      {t === 'mois' ? 'Par Mois' : 'Par Année'}
                    </button>
                  ))}
                </div>

                {viewType === 'mois' && (
                  <>
                    <select value={moisState} onChange={e => setMoisState(Number(e.target.value))} className={inputClass} style={{ background: theme.card, borderColor: theme.border, color: theme.text }}>
                      {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <input type="number" value={anneeState} onChange={e => setAnneeState(Number(e.target.value))} className={`${inputClass} w-24`} style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
                  </>
                )}
                {viewType === 'annee' && (
                  <input type="number" value={anneeState} onChange={e => setAnneeState(Number(e.target.value))} className={`${inputClass} w-32`} style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
                )}
                <select value={statut} onChange={e => setStatut(e.target.value)} className={inputClass} style={{ background: theme.card, borderColor: theme.border, color: theme.text }}>
                  <option value="Tous">Tous les statuts</option>
                  <option value="present">Présent</option>
                  <option value="retard">Retard</option>
                  <option value="absent">Absent</option>
                  <option value="conge">Congé</option>
                </select>
              </div>

              {/* EXPORT BUTTONS */}
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-semibold uppercase tracking-wider mr-1" style={{ color: theme.muted }}>
                  Exporter
                </span>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={exporting || data.length === 0}
                  title="Exporter en Excel"
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border text-[12.5px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: theme.border, color: '#059669', background: 'transparent' }}
                >
                  {exporting ? <Loader2 size={14} strokeWidth={2.2} className="animate-spin" /> : <FileSpreadsheet size={14} strokeWidth={2.2} />}
                  Excel
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={exporting || data.length === 0}
                  title="Exporter en PDF"
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border text-[12.5px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: theme.border, color: '#DC2626', background: 'transparent' }}
                >
                  {exporting ? <Loader2 size={14} strokeWidth={2.2} className="animate-spin" /> : <FileText size={14} strokeWidth={2.2} />}
                  PDF
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={exporting || data.length === 0}
                  title="Exporter en CSV"
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border text-[12.5px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: theme.border, color: '#0284C7', background: 'transparent' }}
                >
                  {exporting ? <Loader2 size={14} strokeWidth={2.2} className="animate-spin" /> : <FileDown size={14} strokeWidth={2.2} />}
                  CSV
                </button>
              </div>
            </div>

            {/* Row 2: Employee search */}
            <div className="relative">
              <Search size={14} strokeWidth={2.2} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.muted }} />
              <input
                type="text"
                placeholder={viewType === 'mois' ? "Rechercher un employé (obligatoire pour voir le mois complet)..." : "Rechercher un employé..."}
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setIsEmployeeDropdownOpen(true);
                  if (e.target.value === '') setSelectedEmployeeId(null);
                }}
                onFocus={() => setIsEmployeeDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsEmployeeDropdownOpen(false), 150)}
                className={`${inputClass} w-full h-10 pl-9 pr-3`}
                style={{ background: theme.card, borderColor: theme.border, color: theme.text }}
              />
              {isEmployeeDropdownOpen && filteredEmployees.length > 0 && (
                <div className="absolute left-0 right-0 z-30 mt-1.5 max-h-60 overflow-y-auto rounded-lg border-[0.5px] shadow-2xl" style={{ borderColor: theme.border, background: theme.card }} onMouseDown={(e) => e.preventDefault()}>
                  {filteredEmployees.map(emp => {
                    const isSelected = emp.id === selectedEmployeeId;
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeId(emp.id);
                          setIsEmployeeDropdownOpen(false);
                          setEmployeeSearch(getEmployeeFullName(emp));
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.06] ${isSelected ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}
                        style={{ color: theme.text }}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 text-[12px] font-semibold" style={{ color: theme.muted }}>
                          {(emp.prenom?.[0] || '') + (emp.nom?.[0] || '')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-semibold truncate">{emp.prenom} {emp.nom}</p>
                          <p className="mt-0.5 text-[11.5px] leading-[1.3] truncate" style={{ color: theme.muted }}>{emp.poste || 'Employé'}</p>
                        </div>
                        {isSelected && <CheckCircle2 size={16} strokeWidth={2.2} style={{ color: theme.primary }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Info: employé voafidy */}
            {selectedEmployeeName && viewType === 'mois' && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-[0.5px]" style={{ background: 'rgba(79,70,229,0.06)', borderColor: 'rgba(79,70,229,0.25)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <Users size={14} strokeWidth={2.2} style={{ color: theme.primary }} />
                  <span className="text-[12.5px] truncate" style={{ color: theme.text }}>
                    Mois complet : <strong>{selectedEmployeeName}</strong> — {MONTHS[moisState - 1]} {anneeState} (1 → {new Date(anneeState, moisState, 0).getDate()})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedEmployeeId(null); setEmployeeSearch(''); }}
                  className="shrink-0 text-[12px] font-semibold px-2 py-1 rounded hover:bg-white/10"
                  style={{ color: theme.primary }}
                >
                  Effacer
                </button>
              </div>
            )}

            {/* STAT CARDS — Row 1 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard icon={<Users size={20} strokeWidth={2.2} />} label="Total" value={stats.total} accentKey="total" />
              <StatCard icon={<CheckCircle2 size={20} strokeWidth={2.2} />} label="Présents" value={`${stats.presents} (${stats.tauxPresence}%)`} accentKey="presents" />
              <StatCard icon={<XCircle size={20} strokeWidth={2.2} />} label="Absents" value={`${stats.absents} (${stats.tauxAbsence}%)`} accentKey="absents" />
              <StatCard icon={<Palmtree size={20} strokeWidth={2.2} />} label="Congés" value={stats.conges} accentKey="conges" />
              <StatCard icon={<Timer size={20} strokeWidth={2.2} />} label="Heures trav." value={formatHours(stats.totalHeuresTravaillees)} accentKey="travail" />
              <StatCard icon={<Clock3 size={20} strokeWidth={2.2} />} label="Retards" value={formatMinutes(stats.totalMinutesRetard)} accentKey="retards" />
            </div>

            {/* STAT CARDS — Row 2 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={<TrendingUp size={20} strokeWidth={2.2} />} label="Taux de Présence" value={`${stats.tauxPresence}%`} accentKey="taux" />
              <StatCard icon={<Clock3 size={20} strokeWidth={2.2} />} label="Moyenne / jour" value={formatHours(stats.moyenneJour)} accentKey="moyenne" />
              <StatCard icon={<Timer size={20} strokeWidth={2.2} />} label="Heures Supp." value={formatHours(stats.totalHeuresSup)} accentKey="heuresSup" />
              <StatCard icon={<Clock3 size={20} strokeWidth={2.2} />} label="Retards (count)" value={stats.retards} accentKey="retards" />
            </div>
          </div>

          {/* ═══════════ CONTENT ═══════════ */}
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} strokeWidth={2.2} className="animate-spin text-brand-500" />
              </div>
            ) : viewType === 'mois' ? (
              cardsData.length === 0 ? (
                <div className="text-center py-10 text-[13.5px]" style={{ color: theme.muted }}>
                  Aucune donnée pour ce mois.
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {paginatedData.map((item, idx) => {
                    const heuresTravaillees = getHeuresTravaillees(item);
                    const minutesRetard = getRetard(item);
                    const heuresSup = getHeuresSup(item);
                    const heureArrivee = getHeureArrivee(item);
                    const heureDepart = getHeureDepart(item);
                    const isNonPointe = !item.statut || item.statut === 'non_pointe' || item.statut === 'en_attente';
                    const dayNumber = item.date.split('-')[2];
                    const badge = getStatutBadge(item.statut, minutesRetard, heuresSup);
                    const BadgeIcon = badge.Icon;

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border-[0.5px] p-3.5 transition-colors ${isNonPointe ? 'opacity-60' : ''}`}
                        style={{ background: theme.card, borderColor: theme.border }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[22px] font-bold leading-none tabular-nums" style={{ color: theme.text }}>
                              {dayNumber}
                            </span>
                            <span className="text-[11.5px] font-medium uppercase tracking-wide" style={{ color: theme.muted }}>
                              {MONTHS[moisState - 1].slice(0, 3)}
                            </span>
                          </div>
                          <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11.5px] font-semibold leading-tight ${badge.color}`}>
                            <BadgeIcon size={11} strokeWidth={2.2} />
                            {badge.label}
                          </span>
                        </div>

                        {item.prenom && (
                          <div className="mb-3 pb-3 border-b" style={{ borderColor: theme.border }}>
                            <p className="text-[12.5px] font-semibold truncate" style={{ color: theme.text }}>
                              {item.prenom} {item.nom}
                            </p>
                          </div>
                        )}

                        {!isNonPointe && (
                          <div className="flex items-center gap-1.5 mb-2.5 text-[12.5px]" style={{ color: theme.muted }}>
                            <Clock3 size={13} strokeWidth={2.2} />
                            <span className="font-mono tabular-nums">
                              {heureArrivee || '--:--'} → {heureDepart || '--:--'}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border-[0.5px]" style={{ borderColor: theme.border }}>
                          <div className="px-2 py-2" style={{ background: theme.softBg }}>
                            <div className="text-[10.5px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: theme.muted }}>Trav.</div>
                            <div className="text-[13px] font-bold tabular-nums" style={{ color: heuresTravaillees > 0 ? theme.primary : theme.muted }}>
                              {heuresTravaillees > 0 ? formatHours(heuresTravaillees) : '—'}
                            </div>
                          </div>
                          <div className="px-2 py-2" style={{ background: theme.softBg }}>
                            <div className="text-[10.5px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: theme.muted }}>Retard</div>
                            <div className="text-[13px] font-bold tabular-nums" style={{ color: minutesRetard > 0 ? theme.amber : theme.muted }}>
                              {minutesRetard > 0 ? formatMinutes(minutesRetard) : '—'}
                            </div>
                          </div>
                          <div className="px-2 py-2" style={{ background: theme.softBg }}>
                            <div className="text-[10.5px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: theme.muted }}>HS</div>
                            <div className="text-[13px] font-bold tabular-nums" style={{ color: heuresSup > 0 ? theme.primary : theme.muted }}>
                              {heuresSup > 0 ? formatHours(heuresSup) : '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              data.length === 0 ? (
                <div className="text-center py-10 text-[13.5px]" style={{ color: theme.muted }}>
                  Aucune donnée pour cette année.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-20 shadow-sm">
                    <tr style={{ background: theme.softBg }}>
                      <th className="px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] border-b" style={{ color: theme.muted, borderColor: theme.border }}>Date</th>
                      <th className="px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] border-b" style={{ color: theme.muted, borderColor: theme.border }}>Employé</th>
                      <th className="px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] border-b" style={{ color: theme.muted, borderColor: theme.border }}>Statut</th>
                      <th className="px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] border-b" style={{ color: theme.muted, borderColor: theme.border }}>Arrivée → Départ</th>
                      <th className="px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] border-b" style={{ color: theme.muted, borderColor: theme.border }}>Travaillé</th>
                      <th className="px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] border-b" style={{ color: theme.muted, borderColor: theme.border }}>Retard</th>
                      <th className="px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] border-b" style={{ color: theme.muted, borderColor: theme.border }}>HS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item, idx) => {
                      const heuresTravaillees = getHeuresTravaillees(item);
                      const minutesRetard = getRetard(item);
                      const heuresSup = getHeuresSup(item);
                      const heureArrivee = getHeureArrivee(item);
                      const heureDepart = getHeureDepart(item);
                      const badge = getStatutBadge(item.statut, minutesRetard, heuresSup);
                      const BadgeIcon = badge.Icon;
                      return (
                        <tr key={idx} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]" style={{ background: theme.card }}>
                          <td className="px-3 py-2.5 text-[13.5px] border-b" style={{ color: theme.muted, borderColor: theme.border }}>{formatDateFR(item.date)}</td>
                          <td className="px-3 py-2.5 text-[13.5px] font-semibold border-b" style={{ color: theme.text, borderColor: theme.border }}>{item.prenom} {item.nom}</td>
                          <td className="px-3 py-2.5 border-b" style={{ borderColor: theme.border }}>
                            <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11.5px] font-semibold leading-tight ${badge.color}`}>
                              <BadgeIcon size={11} strokeWidth={2.2} />
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[13.5px] border-b font-mono tabular-nums" style={{ color: theme.muted, borderColor: theme.border }}>
                            {(heureArrivee || '--:--')} → {(heureDepart || '--:--')}
                          </td>
                          <td className="px-3 py-2.5 text-[13.5px] border-b font-semibold" style={{ color: heuresTravaillees > 0 ? theme.primary : theme.muted, borderColor: theme.border }}>
                            {heuresTravaillees > 0 ? formatHours(heuresTravaillees) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-[13.5px] border-b" style={{ color: minutesRetard > 0 ? theme.amber : theme.muted, borderColor: theme.border }}>
                            {minutesRetard > 0 ? formatMinutes(minutesRetard) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-[13.5px] border-b" style={{ color: heuresSup > 0 ? theme.primary : theme.muted, borderColor: theme.border }}>
                            {heuresSup > 0 ? formatHours(heuresSup) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}
          </div>

          {/* PAGINATION */}
          {viewType === 'annee' && totalPages > 1 && !loading && (
            <div className="shrink-0 border-t px-4 py-3 flex items-center justify-between" style={{ borderColor: theme.border, background: theme.softBg }}>
              <button type="button" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/[0.06]" style={{ borderColor: theme.border, color: theme.muted }}>
                <ChevronLeft size={15} strokeWidth={2.2} />
              </button>
              <span className="text-[12.5px] font-semibold" style={{ color: theme.muted }}>
                Page {currentPage} / {totalPages}
              </span>
              <button type="button" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/[0.06]" style={{ borderColor: theme.border, color: theme.muted }}>
                <ChevronRight size={15} strokeWidth={2.2} />
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t h-14 px-4 flex justify-end gap-2 items-center" style={{ borderColor: theme.border, background: theme.softBg }}>
          <button onClick={onClose} className="h-9 px-3.5 rounded-lg border text-[13px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.06]" style={{ borderColor: theme.border, color: theme.muted }}>Fermer</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default EmployesHistoriqueModal;