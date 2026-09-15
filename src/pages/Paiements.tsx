// ============================================================
// src/pages/Paiements.tsx
// ============================================================
// LIFE'S ART ERP - PAIEMENTS EMPLOYÉS
// ⭐ NOUVEAU: handlePayFromCalendar (bouton "Payer" avy amin'ny calendrier)
// ⭐ FIX: Alefa ny mois/annee avy amin'ny calendar (initialMois, initialAnnee)
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { PaiementsModalForm, PaiementEmploye, EmployePaiement, PayrollMode } from '../components/paiements/PaiementsModalForm';
import PaiementsHeader from '../components/paiements/PaiementsHeader';
import { PaiementsStatsCards } from '../components/paiements/PaiementsStatsCards';
import { PaiementsSearchFilter } from '../components/paiements/PaiementsSearchFilter';
import { PaiementsErrorBanner } from '../components/paiements/PaiementsErrorBanner';
import { PaiementsContent } from '../components/paiements/PaiementsContent';
import { PaiementsModals } from '../components/paiements/PaiementsModals';
import ParametresPaieModal from '../components/paiements/ParametresPaieModal';
import { MONTHS, toNumber, normalizeDateISO, getMonthName, extractData, isApiFailure } from '../utils/paiementUtils';
import { generateBulletinPDF } from '../lib/BulletinPDFService';

// ============================================================
// TYPES
// ============================================================

type ViewMode = 'liste' | 'calendrier' | 'echeances' | 'bulletin';
type StatutFilter = 'Tous' | 'Brouillon' | 'Payé' | 'Non payé';

interface PaiementStats { totalPaiements: number; totalMontant: number; totalEmployes: number; }

interface WindowPaymentsApi {
  getAll?: (params?: Record<string, unknown>) => Promise<any>;
  getById?: (id: number) => Promise<any>;
  create?: (data: Record<string, unknown>) => Promise<any>;
  update?: (id: number, data: Record<string, unknown>) => Promise<any>;
  delete?: (id: number) => Promise<any>;
  getStats?: () => Promise<any>;
  bulkCreate?: (data: Record<string, unknown>) => Promise<any>;
  getAbsencesCount?: (params?: Record<string, unknown>) => Promise<any>;
  getPayrollParameters?: () => Promise<any>;
  savePayrollParameters?: (data: Record<string, unknown>) => Promise<any>;
}

interface WindowApi {
  payments?: WindowPaymentsApi;
  employes?: { getAll?: (params?: Record<string, unknown>) => Promise<any>; };
  settings?: { set?: (key: string, value: unknown) => Promise<any>; };
  dialog?: { showOpenDialog?: (options: Record<string, unknown>) => Promise<any>; };
}

declare global { interface Window { api: WindowApi; } }

// ============================================================
// HELPERS
// ============================================================

const ITEMS_PER_PAGE = 10;

const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizePaymentStatus = (statut: unknown, montant: unknown): 'Brouillon' | 'Payé' | 'Non payé' => {
  const value = String(statut ?? '').trim().toLowerCase();
  const amount = toNumber(montant);
  if (value === 'brouillon' || value === 'draft') return 'Brouillon';
  if (value === 'payé' || value === 'paye' || value === 'paid' || value === 'partiel' || value === 'partial') return amount > 0 ? 'Payé' : 'Non payé';
  if (value === 'non payé' || value === 'non paye' || value === 'impayé' || value === 'impaye' || value === 'unpaid') return 'Non payé';
  return amount > 0 ? 'Payé' : 'Non payé';
};

const getEmployeeDisplayName = (paiement: PaiementEmploye): string => {
  const prenom = paiement.employe_prenom ?? '';
  const nom = paiement.employe_nom ?? '';
  return `${prenom} ${nom}`.trim().replace(/\s+/g, ' ');
};

const calculatePaymentNet = (paiement: PaiementEmploye) => {
  const brut = toNumber(paiement.salaire_brut);
  const cnaps = toNumber(paiement.cnaps);
  const ostie = toNumber(paiement.ostie);
  const irsa = toNumber(paiement.irsa);
  const avance = toNumber(paiement.avance);
  const absenceDeduction = toNumber((paiement as any).absences_deduction);
  const heuresSup = toNumber((paiement as any).heures_sup);
  const heuresSupMontant = toNumber((paiement as any).heures_sup_montant);
  let hsMontant = heuresSupMontant;
  if (hsMontant <= 0 && heuresSup > 0) hsMontant = 0;
  const brutAvecHS = brut + hsMontant;
  const totalRetenues = cnaps + ostie + irsa + avance + absenceDeduction;
  const net = Math.max(0, brutAvecHS - totalRetenues);
  return { brut, hsMontant, absenceDeduction, cnaps, ostie, irsa, avance, totalRetenues, net };
};

const normalizePayrollMode = (value: unknown): PayrollMode => {
  const v = String(value || '').toLowerCase().trim();
  if (v === 'simplifie' || v === 'simplifié' || v === 'simple') return 'simplifie';
  return 'complet';
};

// ============================================================
// COMPONENT
// ============================================================

export default function Paiements() {
  const { isDark } = useTheme();
  const { company, updateCompany } = useCompany();
  const { user } = useAuth();

  // DATA
  const [paiements, setPaiements] = useState<PaiementEmploye[]>([]);
  const [allPaiements, setAllPaiements] = useState<PaiementEmploye[]>([]);
  const [employes, setEmployes] = useState<EmployePaiement[]>([]);
  const [stats, setStats] = useState<PaiementStats>({ totalPaiements: 0, totalMontant: 0, totalEmployes: 0 });

  // ⭐ MODE PAIE
  const [payrollMode, setPayrollMode] = useState<PayrollMode>('complet');

  // VIEW / FILTERS
  const [viewMode, setViewMode] = useState<ViewMode>('liste');
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('Tous');
  const [employeeFilter, setEmployeeFilter] = useState<number | ''>('');
  const [monthFilter, setMonthFilter] = useState<number | ''>('');
  const [yearFilter, setYearFilter] = useState<number | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // LOADING
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // PAYMENT MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaiement, setEditingPaiement] = useState<PaiementEmploye | null>(null);
  const [modalEmployeId, setModalEmployeId] = useState<number | null>(null);
  // ⭐ NOUVEAU: Date par défaut rehefa avy amin'ny calendrier
  const [modalDefaultDate, setModalDefaultDate] = useState<string | null>(null);
  // ⭐ NOUVEAU: Mois/Année par défaut rehefa avy amin'ny calendrier
  const [modalMois, setModalMois] = useState<number | null>(null);
  const [modalAnnee, setModalAnnee] = useState<number | null>(null);

  // ⭐ NOUVEAU: Modal Paramètres Paie
  const [isParametresPaieOpen, setIsParametresPaieOpen] = useState(false);

  // DELETE
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // BULLETIN
  const [bulletinTargetPaiement, setBulletinTargetPaiement] = useState<PaiementEmploye | null>(null);
  const [selectedEmployeForBulletin, setSelectedEmployeForBulletin] = useState<any>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // FACTURE
  const [commandeForInvoice, setCommandeForInvoice] = useState<any>(null);

  // BULK
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<number>>(new Set());
  const [bulkMonth, setBulkMonth] = useState<number>(new Date().getMonth() + 1);
  const [bulkYear, setBulkYear] = useState<number>(new Date().getFullYear());
  const [bulkFolderDate, setBulkFolderDate] = useState<string>(getLocalDateString());
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);

  // MODALS
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; confirmText: string; onConfirm: () => void; }>({ isOpen: false, title: '', message: '', confirmText: 'Supprimer', onConfirm: () => {} });
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });
  const [warningModal, setWarningModal] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);

  // LEGACY / SUPPORT
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage2, setErrorMessage2] = useState('');

  // SELECTION
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // PRESENCE
  const [presenceData, setPresenceData] = useState<{ jours_absences?: number; jours_conges?: number; heures_sup?: number; retards?: number; } | null>(null);

  // ==========================================================
  // LOAD PAYROLL MODE
  // ==========================================================
  const loadPayrollMode = useCallback(async () => {
    try {
      const api = window.api?.payments;
      if (!api?.getPayrollParameters) return;
      const response = await api.getPayrollParameters();
      if (isApiFailure(response)) return;
      const data = extractData<any>(response, {});
      const mode = normalizePayrollMode(data?.mode_paie);
      setPayrollMode(mode);
    } catch (error) {
      console.warn('[Paiements] load payroll mode:', error);
    }
  }, []);

  // ==========================================================
  // LOAD EMPLOYES
  // ==========================================================
  const loadEmployes = useCallback(async () => {
    try {
      const api = window.api?.employes;
      if (!api?.getAll) return;
      const response = await api.getAll({ limit: 10000 });
      if (isApiFailure(response)) return;
      const data = extractData<any>(response, []);
      const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.employes) ? data.employes : [];
      const normalized = list.map((e: any) => ({
        id: Number(e.id),
        nom: e.nom ?? '',
        prenom: e.prenom ?? '',
        poste: e.poste ?? '',
        salaire: toNumber(e.salaire),
        salaire_base: toNumber(e.salaire_base ?? e.salaire),
        cnaps: toNumber(e.cnaps),
        ostie: toNumber(e.ostie),
        irsa: toNumber(e.irsa),
      }));
      setEmployes(normalized);
    } catch (error) {
      console.error('[Paiements] load employes:', error);
    }
  }, []);

  // ==========================================================
  // LOAD PAIEMENTS
  // ==========================================================
  const loadPaiements = useCallback(async (options: { silent?: boolean } = {}) => {
    try {
      if (!options.silent) setLoading(true); else setRefreshing(true);
      setErrorMessage('');
      const api = window.api?.payments;
      if (!api?.getAll) throw new Error('API paiements indisponible.');
      const response = await api.getAll({ limit: 10000, offset: 0 });
      if (isApiFailure(response)) throw new Error(response?.error || response?.message || 'Impossible de charger les paiements.');
      const raw = extractData<any>(response, []);
      const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.paiements) ? raw.paiements : [];
      const normalized = rows.map((row: any) => {
        const montant = toNumber(row.montant);
        return {
          ...row,
          id: row.id != null ? Number(row.id) : undefined,
          employe_id: Number(row.employe_id),
          mois: Number(row.mois),
          annee: Number(row.annee),
          montant,
          salaire_brut: toNumber(row.salaire_brut),
          cnaps: toNumber(row.cnaps),
          ostie: toNumber(row.ostie),
          irsa: toNumber(row.irsa),
          avance: toNumber(row.avance),
          absences_deduction: toNumber(row.absences_deduction),
          heures_sup: toNumber(row.heures_sup),
          heures_sup_montant: toNumber(row.heures_sup_montant),
          prime_anciennete: toNumber(row.prime_anciennete),
          prime_logement: toNumber(row.prime_logement),
          prime_cherte_vie: toNumber(row.prime_cherte_vie),
          indemnite_transport: toNumber(row.indemnite_transport),
          autres_primes: toNumber(row.autres_primes),
          autres_retenues: toNumber(row.autres_retenues),
          net_imposable: toNumber(row.net_imposable),
          cnaps_actif: row.cnaps_actif !== undefined ? Boolean(row.cnaps_actif) : undefined,
          ostie_actif: row.ostie_actif !== undefined ? Boolean(row.ostie_actif) : undefined,
          irsa_actif: row.irsa_actif !== undefined ? Boolean(row.irsa_actif) : undefined,
          statut: normalizePaymentStatus(row.statut, montant),
          date_paiement: normalizeDateISO(row.date_paiement),
        };
      }) as PaiementEmploye[];
      setAllPaiements(normalized);
      setPaiements(normalized);
    } catch (error: any) {
      console.error('[Paiements] load:', error);
      setErrorMessage(error?.message || 'Impossible de charger les paiements.');
      setAllPaiements([]);
      setPaiements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ==========================================================
  // LOAD STATS
  // ==========================================================
  const loadStats = useCallback(async () => {
    try {
      const api = window.api?.payments;
      if (!api?.getStats) {
        const rows = allPaiements;
        setStats({
          totalPaiements: rows.length,
          totalMontant: rows.reduce((sum, row) => sum + toNumber(row.montant), 0),
          totalEmployes: new Set(rows.map(row => row.employe_id)).size,
        });
        return;
      }
      const response = await api.getStats();
      if (isApiFailure(response)) return;
      const data = extractData<any>(response, {});
      setStats({
        totalPaiements: toNumber(data?.total ?? data?.totalPaiements ?? data?.total_paiements ?? data?.count),
        totalMontant: toNumber(data?.montant ?? data?.totalMontant ?? data?.total_montant ?? data?.sum),
        totalEmployes: toNumber(data?.totalEmployes ?? data?.total_employes),
      });
    } catch (error) {
      console.error('[Paiements] stats:', error);
    }
  }, [allPaiements]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================
  useEffect(() => {
    void Promise.all([loadEmployes(), loadPaiements(), loadPayrollMode()]);
  }, [loadEmployes, loadPaiements, loadPayrollMode]);
  useEffect(() => { void loadStats(); }, [allPaiements, loadStats]);

  // ==========================================================
  // FILTER
  // ==========================================================
  const filteredPaiements = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return allPaiements.filter((p) => {
      if (search) {
        const name = getEmployeeDisplayName(p).toLowerCase();
        const ref = String(p.reference ?? '').toLowerCase();
        const obs = String(p.observation ?? '').toLowerCase();
        const mode = String(p.mode_paiement ?? '').toLowerCase();
        if (!name.includes(search) && !ref.includes(search) && !obs.includes(search) && !mode.includes(search)) return false;
      }
      const normalizedStatus = normalizePaymentStatus(p.statut, p.montant);
      if (statutFilter !== 'Tous' && normalizedStatus !== statutFilter) return false;
      if (employeeFilter !== '' && Number(p.employe_id) !== Number(employeeFilter)) return false;
      if (monthFilter !== '' && Number(p.mois) !== Number(monthFilter)) return false;
      if (yearFilter !== '' && Number(p.annee) !== Number(yearFilter)) return false;
      return true;
    });
  }, [allPaiements, searchTerm, statutFilter, employeeFilter, monthFilter, yearFilter]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statutFilter, employeeFilter, monthFilter, yearFilter]);

  // ==========================================================
  // PAGINATION
  // ==========================================================
  const totalPages = Math.ceil(filteredPaiements.length / ITEMS_PER_PAGE);
  const paginatedPaiements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPaiements.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPaiements, currentPage]);
  useEffect(() => { setPaiements(paginatedPaiements); }, [paginatedPaiements]);

  // ==========================================================
  // YEARS
  // ==========================================================
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    years.add(currentYear); years.add(currentYear - 1); years.add(currentYear + 1);
    allPaiements.forEach((p) => { if (p.annee) years.add(Number(p.annee)); });
    return Array.from(years).sort((a, b) => b - a);
  }, [allPaiements]);

  // ==========================================================
  // VISIBLE TOTALS
  // ==========================================================
  const visibleTotal = useMemo(
    () => filteredPaiements.reduce((sum, p) => sum + toNumber(p.montant), 0),
    [filteredPaiements]
  );
  const visibleAdvances = useMemo(
    () => filteredPaiements.reduce((sum, p) => sum + toNumber(p.avance), 0),
    [filteredPaiements]
  );
  const visibleEmployees = useMemo(
    () => new Set(filteredPaiements.map(p => p.employe_id)).size,
    [filteredPaiements]
  );

  // ==========================================================
  // CREATE / EDIT
  // ==========================================================
  const handleCreate = () => {
    setEditingPaiement(null);
    setModalEmployeId(employeeFilter !== '' ? Number(employeeFilter) : null);
    setModalDefaultDate(null);  // ⭐ Reset
    setModalMois(null);          // ⭐ Reset
    setModalAnnee(null);         // ⭐ Reset
    setIsModalOpen(true);
  };

  const handleEdit = (p: PaiementEmploye) => {
    setEditingPaiement(p);
    setModalEmployeId(Number(p.employe_id));
    setModalDefaultDate(null);  // ⭐ Reset
    setModalMois(null);          // ⭐ Reset
    setModalAnnee(null);         // ⭐ Reset
    setIsModalOpen(true);
  };

  // ⭐ NOUVEAU: Fonction rehefa tsindriana "Payer" avy amin'ny calendrier
  //    Mandray ny (employeId, mois, annee, date)
  const handlePayFromCalendar = useCallback((employeId: number, mois?: number, annee?: number, date?: string) => {
    setEditingPaiement(null);
    setModalEmployeId(employeId);
    setModalDefaultDate(date || null);  // ⭐ Date avy amin'ny calendrier
    setModalMois(mois ?? null);          // ⭐ Mois avy amin'ny calendrier
    setModalAnnee(annee ?? null);        // ⭐ Année avy amin'ny calendrier
    setIsModalOpen(true);
  }, []);

  // ==========================================================
  // EXPORT CSV
  // ==========================================================
  const handleExportCSV = () => {
    const headers = ['Employé','Période','Brut','Heures supplémentaires','Montant HS','Absences','CNaPS','OSTIE','IRSA','Avance','Net','Mode','Statut','Date'];
    const rows = filteredPaiements.map((p) => [
      getEmployeeDisplayName(p),
      `${MONTHS[Number(p.mois) - 1]} ${p.annee}`,
      p.salaire_brut || 0,
      (p as any).heures_sup || 0,
      (p as any).heures_sup_montant || 0,
      (p as any).absences_deduction || 0,
      p.cnaps || 0,
      p.ostie || 0,
      p.irsa || 0,
      p.avance || 0,
      p.montant || 0,
      p.mode_paiement || '',
      normalizePaymentStatus(p.statut, p.montant),
      p.date_paiement || '',
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paiements_${getLocalDateString()}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==========================================================
  // VALIDATE PAYMENT
  // ==========================================================
  const handleValidate = async (p: PaiementEmploye) => {
    try {
      const api = window.api?.payments;
      if (!api?.update) throw new Error('API indisponible');
      const calculated = calculatePaymentNet(p);
      const montant = toNumber(p.montant);
      const newStatut = montant > 0 ? 'Payé' : 'Non payé';
      const payload = {
        ...p,
        statut: newStatut,
        montant,
        salaire_brut: calculated.brut,
        cnaps: calculated.cnaps,
        ostie: calculated.ostie,
        irsa: calculated.irsa,
        avance: calculated.avance,
        absences_deduction: calculated.absenceDeduction,
        heures_sup: toNumber((p as any).heures_sup),
        heures_sup_montant: calculated.hsMontant,
        date_paiement: p.date_paiement || getLocalDateString(),
      };
      const res = await api.update(Number(p.id), payload);
      if (isApiFailure(res)) throw new Error(res?.error || res?.message || 'Erreur validation');
      await loadPaiements({ silent: true });
      setSuccessModal({ isOpen: true, title: 'Succès', message: `Paiement validé ! Statut final : ${newStatut}.` });
    } catch (e: any) {
      console.error('[Paiements] validation:', e);
      setErrorModal({ isOpen: true, title: 'Erreur', message: e?.message || 'Erreur lors de la validation.' });
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================
  const handleDelete = (id: number) => {
    const p = allPaiements.find(item => Number(item.id) === Number(id));
    if (!p) return;
    const name = getEmployeeDisplayName(p) || 'cet employé';
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer le paiement',
      message: `Voulez-vous vraiment supprimer le paiement de ${name} pour ${getMonthName(p.mois)} ${p.annee} ?`,
      confirmText: 'Supprimer',
      onConfirm: async () => {
        try {
          setDeletingId(id);
          const api = window.api?.payments;
          if (!api?.delete) throw new Error('API suppression indisponible.');
          const response = await api.delete(id);
          if (isApiFailure(response)) throw new Error(response?.error || response?.message || 'Impossible de supprimer le paiement.');
          await loadPaiements({ silent: true });
          setSuccessModal({ isOpen: true, title: 'Succès', message: 'Le paiement a été supprimé avec succès.' });
        } catch (error: any) {
          console.error('[Paiements] delete:', error);
          setErrorModal({ isOpen: true, title: 'Erreur', message: error?.message || 'Erreur lors de la suppression.' });
        } finally {
          setDeletingId(null);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // ==========================================================
  // MODAL SUCCESS
  // ==========================================================
  const handleModalSuccess = async (_p: PaiementEmploye) => {
    await loadPaiements({ silent: true });
    await loadEmployes();
  };

  // ==========================================================
  // RESET FILTERS
  // ==========================================================
  const resetFilters = () => {
    setSearchTerm(''); setStatutFilter('Tous'); setEmployeeFilter('');
    setMonthFilter(''); setYearFilter('');
  };

  const hasActiveFilters = Boolean(searchTerm || statutFilter !== 'Tous' || employeeFilter !== '' || monthFilter !== '' || yearFilter !== '');

  // ==========================================================
  // SELECT ALL / ONE
  // ==========================================================
  const handleSelectAll = (checked: boolean) => {
    if (!checked) { setSelectedIds(new Set()); return; }
    const ids = filteredPaiements.map(p => p.id).filter((id): id is number => id != null);
    setSelectedIds(new Set(ids));
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  // ==========================================================
  // BULK DELETE
  // ==========================================================
  const handleBulkDelete = (ids: number[]) => {
    if (!ids.length) return;
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer les paiements sélectionnés',
      message: `Voulez-vous vraiment supprimer ${ids.length} paiement(s) ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      onConfirm: async () => {
        try {
          const api = window.api?.payments;
          if (!api?.delete) throw new Error('API suppression indisponible.');
          for (const id of ids) await api.delete(id);
          await loadPaiements({ silent: true });
          setSelectedIds(new Set());
          setSuccessModal({ isOpen: true, title: 'Succès', message: `${ids.length} paiement(s) supprimé(s).` });
        } catch (error: any) {
          setErrorModal({ isOpen: true, title: 'Erreur', message: error?.message || 'Erreur lors de la suppression.' });
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // ==========================================================
  // BULLETIN
  // ==========================================================
  const handleOpenBulletin = (p: PaiementEmploye) => {
    setBulletinTargetPaiement(p);
    setSelectedEmployeForBulletin(employes.find(e => Number(e.id) === Number(p.employe_id)) || null);
    setShowCompanyModal(true);
  };

  // ==========================================================
  // COMPANY MODAL GENERATE
  // ==========================================================
  const handleCompanyModalGenerate = async (dataFromModal?: any) => {
    if (bulletinTargetPaiement) {
      setGeneratingPDF(true);
      try {
        const companyData = dataFromModal || company;
        await updateCompany(companyData);
        const result = await generateBulletinPDF({
          paiement: bulletinTargetPaiement,
          employe: selectedEmployeForBulletin,
          companyInfo: { nom: companyData?.name, nif: companyData?.taxId, stat: companyData?.stat, adresse: companyData?.address },
        });
        if (result?.canceled) showSuccess('Génération annulée', 'PDF annulé.');
        else if (result?.success) showSuccess('Bulletin généré', 'Bulletin de Paie enregistré.');
        else showError('Erreur', result?.error || 'Erreur génération PDF.');
        return result;
      } catch (error: any) {
        showError('Erreur', error?.message || 'Erreur génération PDF.');
        return { success: false };
      } finally {
        setGeneratingPDF(false);
        setShowCompanyModal(false);
        setBulletinTargetPaiement(null);
      }
    }

    if (!commandeForInvoice) return;
    setGeneratingPDF(true);
    try {
      const companyData = dataFromModal || company;
      const { downloadPDF } = await import('../lib/pdfService');
      const displayVendeur = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.name || 'admin');
      const result = await downloadPDF({
        order: commandeForInvoice,
        clientName: commandeForInvoice.client_nom || 'Client',
        clientEmail: commandeForInvoice.client_email || '',
        clientPhone: commandeForInvoice.client_telephone || '',
        clientAddress: commandeForInvoice.client_address || '',
        companyName: companyData?.name || "Life's Art",
        companyAddress: companyData?.address || '',
        companyPhone: companyData?.phone || '',
        companyEmail: companyData?.email || '',
        companySiret: companyData?.siret || '',
        companyTaxId: companyData?.taxId || '',
        companyRcs: companyData?.rcs || '',
        companyVatNumber: companyData?.vatNumber || '',
        paymentMethod: commandeForInvoice.paymentMethod || 'Espèces',
        paymentTerms: commandeForInvoice.paymentTerms || 'Sous 30 jours',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        montantPaye: commandeForInvoice.montant_paye || 0,
        vendeur: displayVendeur,
      });
      if (result?.canceled) showSuccess('Génération annulée', 'PDF annulé.');
      else if (result?.success) showSuccess('Facture générée', 'Facture enregistrée.');
      else showError('Erreur', result?.error || 'Erreur génération.');
      return result;
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur génération.');
      return { success: false, error: error?.message };
    } finally {
      setGeneratingPDF(false);
      setShowCompanyModal(false);
      setCommandeForInvoice(null);
    }
  };

  // ==========================================================
  // SAVE COMPANY
  // ==========================================================
  const handleCompanyModalSave = async (data: any) => {
    try {
      await updateCompany(data);
      if (window.api?.settings?.set) {
        const settingsToSave = {
          societe_nom: data.name, societe_adresse: data.address,
          societe_phone: data.phone, societe_email: data.email,
          societe_taxId: data.taxId, societe_stat: data.stat,
          societe_rcs: data.rcs, societe_vatNumber: data.vatNumber,
        };
        await Promise.all(Object.entries(settingsToSave).map(([key, value]) => window.api.settings!.set!(key, value)));
      }
      setSuccessModal({ isOpen: true, title: 'Succès', message: "Informations de l'entreprise enregistrées." });
    } catch (error: any) {
      setErrorModal({ isOpen: true, title: 'Erreur', message: error?.message || 'Erreur sauvegarde.' });
    } finally {
      setShowCompanyModal(false);
    }
  };

  // ==========================================================
  // GET PAYMENT EMPLOYEE / PERIOD
  // ==========================================================
  const getPaymentForEmployee = useCallback((employeId: number, mois: number, annee: number) => {
    const matches = allPaiements.filter(p =>
      Number(p.employe_id) === Number(employeId) &&
      Number(p.mois) === Number(mois) &&
      Number(p.annee) === Number(annee)
    );
    if (!matches.length) return undefined;
    return (
      matches.find(p => normalizePaymentStatus(p.statut, p.montant) === 'Payé') ||
      matches.find(p => p.statut === 'Brouillon') ||
      matches[0]
    );
  }, [allPaiements]);

  // ==========================================================
  // CHOOSE FOLDER
  // ==========================================================
  const handleChooseFolder = async () => {
    try {
      if (!window.api?.dialog?.showOpenDialog) throw new Error('Dialog API indisponible.');
      const result = await window.api.dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
      if (result?.canceled || !result?.filePaths?.length) return null;
      return result.filePaths[0];
    } catch (error) {
      console.error('Erreur choix dossier:', error);
      return null;
    }
  };

  // ==========================================================
  // BULK BULLETIN
  // ==========================================================
  const handleBulkGenerate = useCallback(async () => {
    if (bulkSelectedIds.size === 0) {
      setErrorModal({ isOpen: true, title: 'Aucune sélection', message: 'Sélectionnez au moins un employé.' });
      return;
    }
    const dossierRacine = await handleChooseFolder();
    if (!dossierRacine) return;
    const dateFolder = `Bulletin_${bulkFolderDate}`;
    const dossierFinal = `${dossierRacine}/${dateFolder}`;
    setIsGeneratingBulk(true);
    try {
      const selectedEmployes = employes.filter(e => bulkSelectedIds.has(Number(e.id)));
      let generatedCount = 0; let errorCount = 0;
      for (const emp of selectedEmployes) {
        const paiement = getPaymentForEmployee(Number(emp.id), bulkMonth, bulkYear);
        if (!paiement) { console.warn(`Aucun paiement pour ${emp.prenom} ${emp.nom}`); continue; }
        try {
          const result = await generateBulletinPDF({
            paiement, employe: emp,
            companyInfo: { nom: company?.name, nif: company?.taxId, stat: company?.stat, adresse: company?.address },
          }, dossierFinal);
          if (result?.success && result?.filePath) generatedCount++;
          else if (result?.canceled) break;
          else errorCount++;
        } catch (err) {
          console.error(`Erreur génération bulletin pour ${emp.prenom} ${emp.nom}`, err);
          errorCount++;
        }
      }
      if (generatedCount > 0) setSuccessModal({ isOpen: true, title: 'Génération terminée', message: `${generatedCount} bulletin(s) généré(s) dans ${dossierFinal}` });
      else if (errorCount > 0) setErrorModal({ isOpen: true, title: 'Erreurs', message: `${errorCount} bulletin(s) avec erreur.` });
      else setErrorModal({ isOpen: true, title: 'Aucun bulletin', message: 'Aucun paiement trouvé pour la période sélectionnée.' });
    } catch (error: any) {
      console.error('Erreur génération bulk:', error);
      setErrorModal({ isOpen: true, title: 'Erreur', message: error?.message || 'Erreur lors de la génération.' });
    } finally {
      setIsGeneratingBulk(false);
      setBulkSelectedIds(new Set());
    }
  }, [bulkSelectedIds, employes, bulkMonth, bulkYear, bulkFolderDate, getPaymentForEmployee, company]);

  // ==========================================================
  // BULK PAY
  // ==========================================================
  const handleBulkPay = useCallback(async () => {
    if (bulkSelectedIds.size === 0) {
      setErrorModal({ isOpen: true, title: 'Aucune sélection', message: 'Sélectionnez au moins un employé.' });
      return;
    }
    const api = window.api?.payments;
    if (!api?.bulkCreate) {
      setErrorModal({ isOpen: true, title: 'Erreur', message: 'API de paiement groupé indisponible.' });
      return;
    }
    setIsGeneratingBulk(true);
    try {
      const ids = Array.from(bulkSelectedIds);
      const result = await api.bulkCreate({
        employe_ids: ids,
        mois: bulkMonth,
        annee: bulkYear,
        date_paiement: bulkFolderDate,
        mode_paiement: 'Espèces',
        statut: 'Payé',
      });
      if (result?.success) {
        const created = Number(result?.created || 0);
        const skipped = Number(result?.skipped || 0);
        if (created > 0 && skipped === 0) {
          setSuccessModal({ isOpen: true, title: 'Succès', message: `${created} employé(s) payé(s) pour ${MONTHS[bulkMonth - 1]} ${bulkYear}.` });
        } else if (created > 0 && skipped > 0) {
          setSuccessModal({ isOpen: true, title: 'Paiement partiel', message: `${created} employé(s) payé(s). ${skipped} employé(s) déjà payé(s) pour cette période.` });
        } else if (created === 0 && skipped > 0) {
          setWarningModal({ isOpen: true, title: 'Paiement déjà effectué', message: `Le paiement de la paie pour ${MONTHS[bulkMonth - 1]} ${bulkYear} a déjà été effectué pour ${skipped} employé(s). Aucun nouveau paiement créé.` });
        } else {
          setErrorModal({ isOpen: true, title: 'Aucun paiement', message: "Aucun paiement n'a pu être créé." });
        }
        await loadPaiements({ silent: true });
        await loadEmployes();
      } else {
        setErrorModal({ isOpen: true, title: 'Erreur', message: result?.error || 'Erreur lors du paiement groupé.' });
      }
    } catch (error: any) {
      console.error('Erreur paiement groupé:', error);
      setErrorModal({ isOpen: true, title: 'Erreur', message: error?.message || 'Erreur lors du paiement groupé.' });
    } finally {
      setIsGeneratingBulk(false);
      setBulkSelectedIds(new Set());
    }
  }, [bulkSelectedIds, bulkMonth, bulkYear, bulkFolderDate, loadPaiements, loadEmployes]);

  // ==========================================================
  // FILTERED EMPLOYES
  // ==========================================================
  const filteredEmployes = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return employes.filter(e => {
      const name = `${e.prenom ?? ''} ${e.nom ?? ''}`.trim().toLowerCase();
      return !search || name.includes(search);
    });
  }, [employes, searchTerm]);

  // ==========================================================
  // SUCCESS / ERROR
  // ==========================================================
  const showSuccess = useCallback((title: string, message: string) => {
    setSuccessTitle(title); setSuccessMessage(message);
    setSuccessModal({ isOpen: true, title, message });
  }, []);

  const showError = useCallback((title: string, message: string) => {
    setErrorTitle(title); setErrorMessage2(message);
    setErrorModal({ isOpen: true, title, message });
  }, []);

  // ==========================================================
  // BUTTON LABEL
  // ==========================================================
  const buttonLabel = bulletinTargetPaiement ? 'Générer le bulletin' : 'Générer la facture';

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <main className="min-h-full w-full transition-colors duration-300" style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-3 px-2 py-4 sm:px-3 lg:px-5">

        {/* ⭐ PaiementsHeader */}
        <PaiementsHeader
          onRefresh={() => loadPaiements({ silent: true })}
          refreshing={refreshing}
          onAddPaiement={handleCreate}
          totalItems={filteredPaiements.length}
          onOpenParametresPaie={() => setIsParametresPaieOpen(true)}
          payrollMode={payrollMode}
        />

        <PaiementsStatsCards
          paiementsCount={filteredPaiements.length}
          visibleTotal={visibleTotal}
          visibleAdvances={visibleAdvances}
          visibleEmployees={visibleEmployees}
          statsTotalPaiements={stats.totalPaiements}
        />

        <PaiementsSearchFilter
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          viewMode={viewMode} setViewMode={setViewMode}
          showFilters={showFilters} setShowFilters={setShowFilters}
          employeeFilter={employeeFilter} setEmployeeFilter={setEmployeeFilter}
          monthFilter={monthFilter} setMonthFilter={setMonthFilter}
          yearFilter={yearFilter} setYearFilter={setYearFilter}
          statutFilter={statutFilter} setStatutFilter={setStatutFilter}
          employes={employes} yearOptions={yearOptions}
          hasActiveFilters={hasActiveFilters} resetFilters={resetFilters}
        />

        <PaiementsErrorBanner errorMessage={errorMessage} onClose={() => setErrorMessage('')} />

        <section className="relative overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white shadow-sm transition-colors dark:border-white/[0.12] dark:bg-[#0F172A]">
          {refreshing && (
            <div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-xl bg-transparent">
              <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" />
            </div>
          )}

          <PaiementsContent
            loading={loading} refreshing={refreshing}
            viewMode={viewMode}
            filteredPaiements={filteredPaiements}
            allPaiements={allPaiements}
            employes={employes} paiements={paiements}
            currentPage={currentPage} totalPages={totalPages}
            totalItems={filteredPaiements.length}
            onPageChange={setCurrentPage}
            onEdit={handleEdit} onDelete={handleDelete} deletingId={deletingId}
            onValidate={handleValidate} onAdd={handleCreate}
            onOpenBulletin={handleOpenBulletin}
            onRefresh={() => loadPaiements({ silent: true })}
            bulkSelectedIds={bulkSelectedIds} setBulkSelectedIds={setBulkSelectedIds}
            bulkMonth={bulkMonth} setBulkMonth={setBulkMonth}
            bulkYear={bulkYear} setBulkYear={setBulkYear}
            bulkFolderDate={bulkFolderDate} setBulkFolderDate={setBulkFolderDate}
            filteredEmployes={filteredEmployes}
            getPaymentForEmployee={getPaymentForEmployee}
            handleBulkPay={handleBulkPay} handleBulkGenerate={handleBulkGenerate}
            isGeneratingBulk={isGeneratingBulk}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll} onSelectOne={handleSelectOne}
            onBulkDelete={handleBulkDelete}
            onPayEmployee={handlePayFromCalendar}  // ⭐ NOUVEAU
          />
        </section>
      </div>

      {/* ⭐ Modal Paramètres Paie */}
      <ParametresPaieModal
        isOpen={isParametresPaieOpen}
        onClose={() => setIsParametresPaieOpen(false)}
        onSaved={(newMode) => {
          setPayrollMode(newMode);
          setSuccessModal({
            isOpen: true,
            title: 'Succès',
            message: `Mode de paie : ${newMode === 'simplifie' ? 'Simplifié' : 'Complet'}.`,
          });
        }}
      />

      <PaiementsModals
        isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}
        editingPaiement={editingPaiement} setEditingPaiement={setEditingPaiement}
        modalEmployeId={modalEmployeId} setModalEmployeId={setModalEmployeId}
        employes={employes} allPaiements={allPaiements}
        onModalSuccess={handleModalSuccess}
        showCompanyModal={showCompanyModal} setShowCompanyModal={setShowCompanyModal}
        onCompanySave={handleCompanyModalSave}
        onCompanyGenerate={handleCompanyModalGenerate}
        isDark={isDark} company={company} buttonLabel={buttonLabel}
        bulletinTargetPaiement={bulletinTargetPaiement}
        setBulletinTargetPaiement={setBulletinTargetPaiement}
        confirmModal={confirmModal} setConfirmModal={setConfirmModal}
        successModal={successModal} setSuccessModal={setSuccessModal}
        errorModal={errorModal} setErrorModal={setErrorModal}
        warningModal={warningModal} setWarningModal={setWarningModal}
        presenceData={presenceData} setPresenceData={setPresenceData}
        payrollMode={payrollMode}
        defaultDate={modalDefaultDate}   
        initialMois={modalMois ?? undefined}   
        initialAnnee={modalAnnee ?? undefined} 
      />
    </main>
  );
}