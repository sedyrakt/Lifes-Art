import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { PaiementsModalForm, PaiementEmploye, EmployePaiement } from '../components/paiements/PaiementsModalForm';
import { generateBulletinPDF } from '../lib/BulletinPDFService';
import PaiementsHeader from '../components/paiements/PaiementsHeader';
import { PaiementsStatsCards } from '../components/paiements/PaiementsStatsCards';
import { PaiementsSearchFilter } from '../components/paiements/PaiementsSearchFilter';
import { PaiementsErrorBanner } from '../components/paiements/PaiementsErrorBanner';
import { PaiementsContent } from '../components/paiements/PaiementsContent';
import { PaiementsModals } from '../components/paiements/PaiementsModals';
import { MONTHS, toNumber, normalizeDateISO, formatAriary, getMonthName, extractData, isApiFailure, getEmployeeName } from '../utils/paiementUtils';

type ViewMode = 'liste' | 'calendrier' | 'echeances' | 'bulletin';
type StatutFilter = 'Tous' | 'Brouillon' | 'Payé' | 'Partiel' | 'Non payé';

interface PaiementStats { totalPaiements: number; totalMontant: number; totalEmployes: number; }
interface WindowPaymentsApi {
  getAll?: (params?: Record<string, unknown>) => Promise<any>;
  getById?: (id: number) => Promise<any>;
  create?: (data: Record<string, unknown>) => Promise<any>;
  update?: (id: number, data: Record<string, unknown>) => Promise<any>;
  delete?: (id: number) => Promise<any>;
  getStats?: () => Promise<any>;
  bulkCreate?: (data: Record<string, unknown>) => Promise<any>;
}
interface WindowApi { payments?: WindowPaymentsApi; employes?: { getAll?: (params?: Record<string, unknown>) => Promise<any>; }; settings?: any; dialog?: any; }
declare global { interface Window { api: WindowApi; } }

export default function Paiements() {
  const { isDark } = useTheme();
  const { company, updateCompany } = useCompany();
  const { user } = useAuth();

  const [paiements, setPaiements] = useState<PaiementEmploye[]>([]);
  const [allPaiements, setAllPaiements] = useState<PaiementEmploye[]>([]);
  const [employes, setEmployes] = useState<EmployePaiement[]>([]);
  const [stats, setStats] = useState<PaiementStats>({ totalPaiements: 0, totalMontant: 0, totalEmployes: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('liste');
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('Tous');
  const [employeeFilter, setEmployeeFilter] = useState<number | ''>('');
  const [monthFilter, setMonthFilter] = useState<number | ''>('');
  const [yearFilter, setYearFilter] = useState<number | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaiement, setEditingPaiement] = useState<PaiementEmploye | null>(null);
  const [modalEmployeId, setModalEmployeId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [bulletinTargetPaiement, setBulletinTargetPaiement] = useState<PaiementEmploye | null>(null);
  const [selectedEmployeForBulletin, setSelectedEmployeForBulletin] = useState<any>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [commandeForInvoice, setCommandeForInvoice] = useState<any>(null);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<number>>(new Set());
  const [bulkMonth, setBulkMonth] = useState<number>(new Date().getMonth() + 1);
  const [bulkYear, setBulkYear] = useState<number>(new Date().getFullYear());
  const [bulkFolderDate, setBulkFolderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; confirmText: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', confirmText: 'Supprimer', onConfirm: () => {} });
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });
  const [warningModal, setWarningModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage2, setErrorMessage2] = useState('');
  const ITEMS_PER_PAGE = 10;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const loadEmployes = useCallback(async () => {
    try {
      const api = window.api?.employes;
      if (!api?.getAll) return;
      const response = await api.getAll({ limit: 10000 });
      if (isApiFailure(response)) return;
      const data = extractData<any>(response, []);
      const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.employes) ? data.employes : [];
      setEmployes(list.map((e: any) => ({ id: Number(e.id), nom: e.nom ?? '', prenom: e.prenom ?? '', poste: e.poste ?? '', salaire: toNumber(e.salaire), salaire_base: toNumber(e.salaire_base ?? e.salaire) })));
    } catch (error) { console.error('[Paiements] load employes:', error); }
  }, []);

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
      const normalized = rows.map((row: any) => ({ ...row, id: row.id != null ? Number(row.id) : undefined, employe_id: Number(row.employe_id), mois: Number(row.mois), annee: Number(row.annee), montant: toNumber(row.montant), salaire_brut: toNumber(row.salaire_brut), cnaps: toNumber(row.cnaps), ostie: toNumber(row.ostie), irsa: toNumber(row.irsa), avance: toNumber(row.avance), date_paiement: normalizeDateISO(row.date_paiement) })) as PaiementEmploye[];
      setAllPaiements(normalized); setPaiements(normalized);
    } catch (error: any) {
      console.error('[Paiements] load:', error);
      setErrorMessage(error?.message || 'Impossible de charger les paiements.');
      setAllPaiements([]); setPaiements([]);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const api = window.api?.payments;
      if (!api?.getStats) {
        const rows = allPaiements;
        setStats({ totalPaiements: rows.length, totalMontant: rows.reduce((s, r) => s + toNumber(r.montant), 0), totalEmployes: new Set(rows.map((r) => r.employe_id)).size });
        return;
      }
      const response = await api.getStats();
      if (isApiFailure(response)) return;
      const data = extractData<any>(response, {});
      setStats({ totalPaiements: toNumber(data?.totalPaiements ?? data?.total_paiements ?? data?.count), totalMontant: toNumber(data?.totalMontant ?? data?.total_montant ?? data?.sum), totalEmployes: toNumber(data?.totalEmployes ?? data?.total_employes) });
    } catch (error) { console.error('[Paiements] stats:', error); }
  }, [allPaiements]);

  useEffect(() => { void Promise.all([loadEmployes(), loadPaiements()]); }, [loadEmployes, loadPaiements]);
  useEffect(() => { void loadStats(); }, [allPaiements, loadStats]);

  const filteredPaiements = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return allPaiements.filter((p) => {
      if (search) { const name = `${p.employe_prenom ?? ''} ${p.employe_nom ?? ''}`.trim().toLowerCase(); const ref = (p.reference ?? '').toString().toLowerCase(); const obs = (p.observation ?? '').toString().toLowerCase(); const mode = (p.mode_paiement ?? '').toString().toLowerCase(); if (!(name.includes(search) || ref.includes(search) || obs.includes(search) || mode.includes(search))) return false; }
      if (statutFilter !== 'Tous' && p.statut !== statutFilter) return false;
      if (employeeFilter !== '' && Number(p.employe_id) !== Number(employeeFilter)) return false;
      if (monthFilter !== '' && Number(p.mois) !== Number(monthFilter)) return false;
      if (yearFilter !== '' && Number(p.annee) !== Number(yearFilter)) return false;
      return true;
    });
  }, [allPaiements, searchTerm, statutFilter, employeeFilter, monthFilter, yearFilter]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statutFilter, employeeFilter, monthFilter, yearFilter]);
  const totalPages = Math.ceil(filteredPaiements.length / ITEMS_PER_PAGE);
  const paginatedPaiements = useMemo(() => { const start = (currentPage - 1) * ITEMS_PER_PAGE; return filteredPaiements.slice(start, start + ITEMS_PER_PAGE); }, [filteredPaiements, currentPage]);
  useEffect(() => { setPaiements(paginatedPaiements); }, [paginatedPaiements]);

  const yearOptions = useMemo(() => { const years = new Set<number>(); const cur = new Date().getFullYear(); years.add(cur); years.add(cur - 1); years.add(cur + 1); allPaiements.forEach((p) => { if (p.annee) years.add(Number(p.annee)); }); return Array.from(years).sort((a, b) => b - a); }, [allPaiements]);
  const visibleTotal = useMemo(() => filteredPaiements.reduce((s, p) => s + toNumber(p.montant), 0), [filteredPaiements]);
  const visibleEmployees = useMemo(() => new Set(filteredPaiements.map((p) => p.employe_id)).size, [filteredPaiements]);

  const handleCreate = () => { setEditingPaiement(null); setModalEmployeId(employeeFilter !== '' ? Number(employeeFilter) : null); setIsModalOpen(true); };
  const handleEdit = (p: PaiementEmploye) => { setEditingPaiement(p); setModalEmployeId(Number(p.employe_id)); setIsModalOpen(true); };

  const handleExportCSV = () => {
    const headers = ['Employé', 'Période', 'Brut', 'CNaPS', 'OSTIE', 'IRSA', 'Net', 'Mode', 'Statut', 'Date'];
    const rows = filteredPaiements.map((p) => [ `${p.employe_prenom ?? ''} ${p.employe_nom ?? ''}`.trim(), `${MONTHS[Number(p.mois) - 1]} ${p.annee}`, p.salaire_brut || 0, p.cnaps || 0, p.ostie || 0, p.irsa || 0, p.montant || 0, p.mode_paiement || '', p.statut || '', p.date_paiement || '' ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.setAttribute('href', url); link.setAttribute('download', `paiements_${new Date().toISOString().split('T')[0]}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleValidate = async (p: PaiementEmploye) => {
    try {
      const api = window.api?.payments; if (!api?.update) throw new Error('API indisponible');
      const brut = Number(p.salaire_brut) || 0; const cnaps = Number(p.cnaps) || 0; const ostie = Number(p.ostie) || 0; const irsa = Number(p.irsa) || 0; const avance = Number(p.avance) || 0; const montant = Number(p.montant) || 0;
      const net = Math.max(0, brut - cnaps - ostie - irsa - avance);
      let newStatut: string = 'Payé';
      if (net <= 0) newStatut = montant > 0 ? 'Payé' : 'Non payé';
      else if (montant <= 0) newStatut = 'Non payé';
      else if (montant >= net) newStatut = 'Payé';
      else newStatut = 'Partiel';
      const res = await api.update(p.id!, { ...p, statut: newStatut });
      if (isApiFailure(res)) throw new Error(res?.error || res?.message || 'Erreur validation');
      await loadPaiements({ silent: true });
      setSuccessModal({ isOpen: true, title: 'Succès', message: `Paiement validé ! Statut final : ${newStatut}` });
    } catch (e: any) { setErrorModal({ isOpen: true, title: 'Erreur', message: e.message }); }
  };

  const handleDelete = (id: number) => {
    const p = allPaiements.find(item => item.id === id);
    if (!p) return;
    const name = `${p.employe_prenom ?? ''} ${p.employe_nom ?? ''}`.trim() || 'cet employé';
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
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleModalSuccess = async (_p: PaiementEmploye) => { await loadPaiements({ silent: true }); };
  const resetFilters = () => { setSearchTerm(''); setStatutFilter('Tous'); setEmployeeFilter(''); setMonthFilter(''); setYearFilter(''); };
  const hasActiveFilters = Boolean(searchTerm || statutFilter !== 'Tous' || employeeFilter !== '' || monthFilter !== '' || yearFilter !== '');

  const handleSelectAll = (checked: boolean) => { setSelectedIds(checked ? new Set(filteredPaiements.map(p => p.id)) : new Set()); };
  const handleSelectOne = (id: number, checked: boolean) => { setSelectedIds(prev => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next; }); };

  const handleBulkDelete = (ids: number[]) => {
    if (!ids.length) return;
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer les paiements sélectionnés',
      message: `Voulez-vous vraiment supprimer ${ids.length} paiement(s) ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      onConfirm: async () => {
        try {
          for (const id of ids) {
            await window.api.payments.delete(id);
          }
          await loadPaiements({ silent: true });
          setSelectedIds(new Set());
          setSuccessModal({ isOpen: true, title: 'Succès', message: `${ids.length} paiement(s) supprimé(s).` });
        } catch (error: any) {
          setErrorModal({ isOpen: true, title: 'Erreur', message: error.message || 'Erreur lors de la suppression.' });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleOpenBulletin = (p: PaiementEmploye) => { setBulletinTargetPaiement(p); setSelectedEmployeForBulletin(employes.find((e) => e.id === p.employe_id) || null); setShowCompanyModal(true); };

  const handleCompanyModalGenerate = async (dataFromModal?: any) => {
    if (bulletinTargetPaiement) {
      setGeneratingPDF(true);
      try {
        const companyData = dataFromModal || company; await updateCompany(companyData);
        const { generateBulletinPDF } = await import('../lib/BulletinPDFService');
        const result = await generateBulletinPDF({ paiement: bulletinTargetPaiement, employe: selectedEmployeForBulletin, companyInfo: { nom: companyData?.name, nif: companyData?.taxId, stat: companyData?.stat, adresse: companyData?.address } });
        if (result?.canceled) showSuccess('Génération annulée', 'PDF annulé.'); else if (result?.success) showSuccess('Bulletin généré', 'Bulletin de Paie enregistré.'); else showError('Erreur', result?.error || 'Erreur génération PDF.');
        return result;
      } catch (error: any) { showError('Erreur', error.message); return { success: false }; }
      finally { setGeneratingPDF(false); setShowCompanyModal(false); setBulletinTargetPaiement(null); }
    }
    if (!commandeForInvoice) return;
    setGeneratingPDF(true);
    try {
      const companyData = dataFromModal || company; const { downloadPDF } = await import('../lib/pdfService');
      const displayVendeur = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.name || 'admin');
      const result = await downloadPDF({ order: commandeForInvoice, clientName: commandeForInvoice.client_nom || 'Client', clientEmail: commandeForInvoice.client_email || '', clientPhone: commandeForInvoice.client_telephone || '', clientAddress: commandeForInvoice.client_address || '', companyName: companyData?.name || "Life's Art", companyAddress: companyData?.address || '', companyPhone: companyData?.phone || '', companyEmail: companyData?.email || '', companySiret: companyData?.siret || '', companyTaxId: companyData?.taxId || '', companyRcs: companyData?.rcs || '', companyVatNumber: companyData?.vatNumber || '', paymentMethod: commandeForInvoice.paymentMethod || 'Espèces', paymentTerms: commandeForInvoice.paymentTerms || 'Sous 30 jours', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), montantPaye: commandeForInvoice.montant_paye || 0, vendeur: displayVendeur });
      if (result?.canceled) showSuccess('Génération annulée', 'PDF annulé.'); else if (result?.success) showSuccess('Facture générée', 'Facture enregistrée.'); else showError('Erreur', result?.error || 'Erreur génération.');
      return result;
    } catch (error: any) { showError('Erreur', error?.message || 'Erreur génération.'); return { success: false, error: error?.message }; }
    finally { setGeneratingPDF(false); setShowCompanyModal(false); setCommandeForInvoice(null); }
  };

  const handleCompanyModalSave = async (data: any) => {
    try {
      await updateCompany(data);
      if (window.api?.settings?.set) {
        const settingsToSave = { 'societe_nom': data.name, 'societe_adresse': data.address, 'societe_phone': data.phone, 'societe_email': data.email, 'societe_taxId': data.taxId, 'societe_stat': data.stat, 'societe_rcs': data.rcs, 'societe_vatNumber': data.vatNumber };
        await Promise.all(Object.entries(settingsToSave).map(([key, value]) => window.api.settings.set(key, value)));
      }
      setSuccessModal({ isOpen: true, title: 'Succès', message: 'Informations de l\'entreprise enregistrées.' });
    } catch (error: any) { setErrorModal({ isOpen: true, title: 'Erreur', message: error.message || 'Erreur sauvegarde.' }); }
    finally { setShowCompanyModal(false); }
  };

  const getPaymentForEmployee = useCallback((employeId: number, mois: number, annee: number) => { return allPaiements.find((p) => p.employe_id === employeId && p.mois === mois && p.annee === annee); }, [allPaiements]);

  const handleChooseFolder = async () => {
    try { const result = await window.api.dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] }); if (result.canceled || !result.filePaths?.length) return null; return result.filePaths[0]; }
    catch (error) { console.error('Erreur choix dossier:', error); return null; }
  };

  const handleBulkGenerate = useCallback(async () => {
    if (bulkSelectedIds.size === 0) { setErrorModal({ isOpen: true, title: 'Aucune sélection', message: 'Sélectionnez au moins un employé.' }); return; }
    const dossierRacine = await handleChooseFolder(); if (!dossierRacine) return;
    const dateFolder = `Bulletin_${bulkFolderDate}`; const dossierFinal = `${dossierRacine}/${dateFolder}`;
    setIsGeneratingBulk(true);
    try {
      const selectedEmployes = employes.filter((e) => bulkSelectedIds.has(e.id)); let generatedCount = 0; let errorCount = 0;
      for (const emp of selectedEmployes) {
        const paiement = getPaymentForEmployee(emp.id, bulkMonth, bulkYear); if (!paiement) { console.warn(`Aucun paiement pour ${emp.prenom} ${emp.nom}`); continue; }
        try { const result = await generateBulletinPDF({ paiement, employe: emp, companyInfo: { nom: company?.name, nif: company?.taxId, stat: company?.stat, adresse: company?.address } }, dossierFinal); if (result.success && result.filePath) generatedCount++; else if (result.canceled) break; else errorCount++; }
        catch (err) { console.error(`Erreur génération bulletin pour ${emp.prenom} ${emp.nom}`, err); errorCount++; }
      }
      if (generatedCount > 0) setSuccessModal({ isOpen: true, title: 'Génération terminée', message: `${generatedCount} bulletin(s) généré(s) dans ${dossierFinal}` });
      else if (errorCount > 0) setErrorModal({ isOpen: true, title: 'Erreurs', message: `${errorCount} bulletin(s) avec erreur.` });
      else setErrorModal({ isOpen: true, title: 'Aucun bulletin', message: 'Aucun paiement trouvé pour la période sélectionnée.' });
    } catch (error: any) { console.error('Erreur génération bulk:', error); setErrorModal({ isOpen: true, title: 'Erreur', message: error.message || 'Erreur lors de la génération.' }); }
    finally { setIsGeneratingBulk(false); setBulkSelectedIds(new Set()); }
  }, [bulkSelectedIds, employes, bulkMonth, bulkYear, bulkFolderDate, getPaymentForEmployee, company]);

  const handleBulkPay = useCallback(async () => {
    if (bulkSelectedIds.size === 0) { setErrorModal({ isOpen: true, title: 'Aucune sélection', message: 'Sélectionnez au moins un employé.' }); return; }
    setIsGeneratingBulk(true);
    try {
      const ids = Array.from(bulkSelectedIds);
      const result = await window.api.payments.bulkCreate({ ids, mois: bulkMonth, annee: bulkYear, date_paiement: bulkFolderDate, mode_paiement: 'Espèces', statut: 'Payé' });
      
      if (result?.success) {
        const created = result.data?.created || 0;
        const skipped = result.data?.skipped || 0;

        if (created > 0 && skipped === 0) {
          setSuccessModal({ isOpen: true, title: 'Succès', message: `${created} employé(s) payé(s) pour ${MONTHS[bulkMonth - 1]} ${bulkYear}.` });
        } else if (created > 0 && skipped > 0) {
          setSuccessModal({ isOpen: true, title: 'Paiement partiel', message: `${created} employé(s) payé(s). ${skipped} employé(s) déjà payé(s) pour cette période.` });
        } else if (created === 0 && skipped > 0) {
          setWarningModal({ isOpen: true, title: 'Paiement déjà effectué', message: `Le paiement de la paie pour ${MONTHS[bulkMonth - 1]} ${bulkYear} a déjà été effectué pour ${skipped} employé(s). Aucun nouveau paiement créé.` });
        } else {
           setErrorModal({ isOpen: true, title: 'Aucun paiement', message: 'Aucun paiement n\'a pu être créé.' });
        }

        await loadPaiements({ silent: true });
        await loadEmployes();
      } else {
        setErrorModal({ isOpen: true, title: 'Erreur', message: result?.error || 'Erreur lors du paiement groupé.' });
      }
    } catch (error: any) {
      console.error('Erreur paiement groupé:', error);
      setErrorModal({ isOpen: true, title: 'Erreur', message: error.message || 'Erreur lors du paiement groupé.' });
    } finally {
      setIsGeneratingBulk(false);
      setBulkSelectedIds(new Set());
    }
  }, [bulkSelectedIds, bulkMonth, bulkYear, bulkFolderDate, loadPaiements, loadEmployes]);

  const filteredEmployes = useMemo(() => { const search = searchTerm.trim().toLowerCase(); return employes.filter((e) => { const name = `${e.prenom ?? ''} ${e.nom ?? ''}`.trim().toLowerCase(); return !search || name.includes(search); }); }, [employes, searchTerm]);

  const showSuccess = useCallback((t: string, m: string) => { setSuccessTitle(t); setSuccessMessage(m); setSuccessModal({ isOpen: true, title: t, message: m }); }, []);
  const showError = useCallback((t: string, m: string) => { setErrorTitle(t); setErrorMessage2(m); setErrorModal({ isOpen: true, title: t, message: m }); }, []);
  const buttonLabel = bulletinTargetPaiement ? 'Générer le bulletin' : 'Générer la facture';

  return (
    <main className="min-h-full w-full transition-colors duration-300" style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">
        <PaiementsHeader
          onRefresh={() => loadPaiements({ silent: true })}
          refreshing={refreshing}
          onAddPaiement={handleCreate}
          totalItems={filteredPaiements.length}
        />

        <PaiementsStatsCards paiementsCount={filteredPaiements.length} visibleTotal={visibleTotal} visibleEmployees={visibleEmployees} statsTotalPaiements={stats.totalPaiements} />

        <PaiementsSearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} viewMode={viewMode} setViewMode={setViewMode} showFilters={showFilters} setShowFilters={setShowFilters} employeeFilter={employeeFilter} setEmployeeFilter={setEmployeeFilter} monthFilter={monthFilter} setMonthFilter={setMonthFilter} yearFilter={yearFilter} setYearFilter={setYearFilter} statutFilter={statutFilter} setStatutFilter={setStatutFilter} employes={employes} yearOptions={yearOptions} hasActiveFilters={hasActiveFilters} resetFilters={resetFilters} />

        <PaiementsErrorBanner errorMessage={errorMessage} onClose={() => setErrorMessage('')} />

        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_-4px_rgba(79,70,229,0.08)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)]">
          {refreshing && (
            <div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent">
              <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" />
            </div>
          )}
          <PaiementsContent
            loading={loading}
            refreshing={refreshing}
            viewMode={viewMode}
            filteredPaiements={filteredPaiements}
            allPaiements={allPaiements}
            employes={employes}
            paiements={paiements}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPaiements.length}
            onPageChange={setCurrentPage}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
            onValidate={handleValidate}
            onAdd={handleCreate}
            onOpenBulletin={handleOpenBulletin}
            onRefresh={() => loadPaiements({ silent: true })}
            bulkSelectedIds={bulkSelectedIds}
            setBulkSelectedIds={setBulkSelectedIds}
            bulkMonth={bulkMonth}
            setBulkMonth={setBulkMonth}
            bulkYear={bulkYear}
            setBulkYear={setBulkYear}
            bulkFolderDate={bulkFolderDate}
            setBulkFolderDate={setBulkFolderDate}
            filteredEmployes={filteredEmployes}
            getPaymentForEmployee={getPaymentForEmployee}
            handleBulkPay={handleBulkPay}
            handleBulkGenerate={handleBulkGenerate}
            isGeneratingBulk={isGeneratingBulk}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onBulkDelete={handleBulkDelete}
          />
        </section>
      </div>

      <PaiementsModals
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        editingPaiement={editingPaiement}
        setEditingPaiement={setEditingPaiement}
        modalEmployeId={modalEmployeId}
        setModalEmployeId={setModalEmployeId}
        employes={employes}
        onModalSuccess={handleModalSuccess}
        showCompanyModal={showCompanyModal}
        setShowCompanyModal={setShowCompanyModal}
        onCompanySave={handleCompanyModalSave}
        onCompanyGenerate={handleCompanyModalGenerate}
        isDark={isDark}
        company={company}
        buttonLabel={buttonLabel}
        bulletinTargetPaiement={bulletinTargetPaiement}
        setBulletinTargetPaiement={setBulletinTargetPaiement}
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
        successModal={successModal}
        setSuccessModal={setSuccessModal}
        errorModal={errorModal}
        setErrorModal={setErrorModal}
        warningModal={warningModal}
        setWarningModal={setWarningModal}
      />
    </main>
  );
}