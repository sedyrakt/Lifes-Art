// Employes.tsx 
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Users, Wallet, UserCheck, Activity, Timer, TrendingUp, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useEmployesData, ExportPeriod } from '../hooks/useEmployesData';
import EmployesHeader from '../components/employes/EmployesHeader';
import EmployesTable from '../components/employes/EmployesTable';
import EmployesPagination from '../components/employes/EmployesPagination';
import EmployesModalForm from '../components/employes/EmployesModalForm';
import EmployesViewModal from '../components/employes/EmployesViewModal';
import EmployesPresenceModal from '../components/employes/EmployesPresenceModal';
import EmployesSalaryModal from '../components/employes/EmployesSalaryModal';
import EmployesCalendrier from '../components/employes/EmployesCalendrier';
import EmployesStats from '../components/employes/EmployesStats';
import ConfirmModal from '../components/common/ConfirmModal';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';
import EmployesSearchBar from '../components/employes/EmployesSearchBar';
// ⭐ VAOVAO: Modal paiement
import PaiementsModalForm from '../components/paiements/PaiementsModalForm';

const moisLabels = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const moisLabelsCourt = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

type ViewMode = 'liste' | 'calendrier';

const Employes: React.FC = () => {
  const { isDark } = useTheme();
  const {
    employes, loading, refreshing, totalItems, totalPages, currentPage, setCurrentPage,
    searchTerm, setSearchTerm, filterStatus, setFilterStatus, sortOption, setSortOption,
    exportPeriod, setExportPeriod, exportDate, setExportDate,
    paiementCounts, historiquePaiements,
    loadPaiementsEmploye, deletePaiement,
    loadData, stats, getEmployeById, createEmploye, updateEmploye, deleteEmploye,
    getStatusColor, getStatusIcon, ITEMS_PER_PAGE, refreshPaiementCounts, bulkUpdateStatus, bulkDelete,
    loadPresence, savePresence, updateSalary,
    exportToExcel, exportToPDF, exportToCSV,
  } = useEmployesData();

  const [viewMode, setViewMode] = useState<ViewMode>('liste');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmploye, setSelectedEmploye] = useState<any>(null);
  const [editingEmploye, setEditingEmploye] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'delete' | 'status'>('delete');
  const [bulkTargetIds, setBulkTargetIds] = useState<number[]>([]);
  const [bulkTargetStatus, setBulkTargetStatus] = useState('');
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);

  // ⭐ VAOVAO: State ho an'ny paiement modal
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paiementEmployeId, setPaiementEmployeId] = useState<number | null>(null);

  const [derniersPaiements, setDerniersPaiements] = useState<Record<number, any>>({});
  const isMounted = useRef(false);

  const showSuccess = useCallback((title: string, message: string) => {
    setSuccessTitle(title); setSuccessMessage(message); setShowSuccessModal(true);
  }, []);
  const showError = useCallback((title: string, message: string) => {
    setErrorTitle(title); setErrorMessage(message); setShowErrorModal(true);
  }, []);

  const totalSalaire = useMemo(() => {
    return Number(stats?.totalSalaire) || 0;
  }, [stats]);

  const fetchDerniersPaiements = useCallback(async (employesList: any[]) => {
    if (!employesList.length) return;
    const derniers: Record<number, any> = {};
    await Promise.all(employesList.map(async (emp) => {
      try {
        const result = await window.api.payments.getByEmploye(emp.id);
        if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
          const sortedData = [...result.data].sort((a, b) => {
            const dateA = new Date(a.date_paiement).getTime();
            const dateB = new Date(b.date_paiement).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return Number(b.id) - Number(a.id);
          });
          derniers[emp.id] = sortedData[0];
        }
      } catch (_) {}
    }));
    if (isMounted.current) setDerniersPaiements(derniers);
  }, []);

  useEffect(() => {
    if (employes.length > 0) fetchDerniersPaiements(employes);
  }, [employes, fetchDerniersPaiements]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (!checked) { setSelectedIds(new Set()); return; }
    const ids = employes.map((e: any) => Number(e.id)).filter((id: number) => Number.isInteger(id) && id > 0);
    setSelectedIds(new Set(ids));
  }, [employes]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => { const n = new Set(prev); if (checked) n.add(id); else n.delete(id); return n; });
  }, []);

  const handleBulkUpdateStatus = useCallback((ids: number[], newStatus: string) => {
    const v = ids.map(Number).filter(id => Number.isInteger(id) && id > 0);
    if (!v.length) { showError('Sélection invalide', 'Aucun employé valide.'); return; }
    setBulkTargetIds(v); setBulkTargetStatus(newStatus); setBulkActionType('status'); setShowBulkConfirmModal(true);
  }, [showError]);

  const handleBulkDelete = useCallback((ids: number[]) => {
    if (!ids.length) return;
    setBulkTargetIds(ids); setBulkActionType('delete'); setShowBulkConfirmModal(true);
  }, []);

  const handleConfirmBulkAction = useCallback(async () => {
    if (!bulkTargetIds.length) return;
    try {
      if (bulkActionType === 'delete') {
        await bulkDelete(bulkTargetIds);
        setSelectedIds(new Set());
        showSuccess('Suppression en lot', `${bulkTargetIds.length} employé(s) supprimé(s).`);
      } else if (bulkActionType === 'status') {
        await bulkUpdateStatus(bulkTargetIds, bulkTargetStatus);
        setSelectedIds(new Set());
        const label = bulkTargetStatus === 'actif' ? 'Actif' : bulkTargetStatus === 'inactif' ? 'Inactif' : 'En congé';
        showSuccess('Mise à jour en lot', `${bulkTargetIds.length} employé(s) sont maintenant "${label}".`);
      }
      await loadData();
      await fetchDerniersPaiements(employes);
    } catch (error: any) {
      showError('Erreur', error?.message || 'Impossible d\'effectuer cette opération.');
    } finally {
      setShowBulkConfirmModal(false); setBulkTargetIds([]); setBulkTargetStatus('');
    }
  }, [bulkTargetIds, bulkActionType, bulkTargetStatus, bulkDelete, bulkUpdateStatus, showError, showSuccess, loadData, fetchDerniersPaiements, employes]);

  const handleOpenAddModal = useCallback(() => { setEditingEmploye(null); setShowModal(true); }, []);
  const handleCloseModal = useCallback(() => { setShowModal(false); setEditingEmploye(null); }, []);

  const handleViewEmploye = useCallback(async (id: number) => {
    try {
      const employe = await getEmployeById(id);
      if (!employe) { showError('Employé introuvable', 'Cet employé n\'existe plus.'); return; }
      setSelectedEmploye(employe);
      await loadPaiementsEmploye(id);
      setShowViewModal(true);
    } catch (error: any) { showError('Erreur', error?.message || 'Impossible de charger les informations.'); }
  }, [getEmployeById, showError, loadPaiementsEmploye]);

  const handleHistorique = useCallback(async (employe: any) => {
    setSelectedEmploye(employe);
    await loadPaiementsEmploye(employe.id);
    setShowViewModal(true);
  }, [loadPaiementsEmploye]);

  const handleEditEmploye = useCallback(async (employe: any) => {
    setEditingEmploye(employe);
    setShowModal(true);
  }, []);

  // ⭐ VAOVAO: Handler manokatra ny paiement modal
  const handleNouveauPaiement = useCallback((employe: any) => {
    setPaiementEmployeId(Number(employe.id));
    setShowPaiementModal(true);
  }, []);

  // ⭐ VAOVAO: Rehefa vita ny paiement
  const handlePaiementSuccess = useCallback(async (_paiement: any) => {
    showSuccess('Paiement créé', 'Le paiement a été enregistré avec succès.');
    await loadData();
    await fetchDerniersPaiements(employes);
  }, [loadData, fetchDerniersPaiements, employes, showSuccess]);

  const handleClosePaiementModal = useCallback(() => {
    setShowPaiementModal(false);
    setPaiementEmployeId(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; const fd = new FormData(form);
    const statusValue = (fd.get('status') as string) || 'Actif';
    const dbStatus = statusValue === 'Actif' ? 'actif' : statusValue === 'Inactif' ? 'inactif' : statusValue === 'En congé' ? 'en_conge' : 'actif';
    const salaire = parseFloat((fd.get('salaire') as string) || '0') || 0;

    const cnaps = parseFloat((fd.get('cnaps') as string) || '0') || 0;
    const ostie = parseFloat((fd.get('ostie') as string) || '0') || 0;
    const irsa = parseFloat((fd.get('irsa') as string) || '0') || 0;

    const data: any = {
      nom: fd.get('nom'),
      prenom: fd.get('prenom'),
      email: fd.get('email'),
      telephone: fd.get('telephone'),
      poste: fd.get('poste'),
      departement: fd.get('departement'),
      date_embauche: fd.get('date_embauche'),
      salaire,
      cnaps,
      ostie,
      irsa,
      status: dbStatus
    };

    if (!data.nom || !data.prenom) { showError('Champs requis', 'Le nom et le prénom sont obligatoires.'); return; }
    if (!data.email) { showError('Champ requis', 'L\'adresse email est obligatoire.'); return; }
    if (!data.date_embauche) { showError('Champ requis', 'La date d\'embauche est obligatoire.'); return; }
    if (data.salaire <= 0) { showError('Valeur invalide', 'Le salaire doit être supérieur à 0.'); return; }
    try {
      if (editingEmploye) {
        await updateEmploye(editingEmploye.id, data);
        showSuccess('Employé modifié', `Les informations de ${data.prenom} ${data.nom} ont été mises à jour.`);
      } else {
        await createEmploye(data);
        showSuccess('Employé créé', `L\'employé ${data.prenom} ${data.nom} a été enregistré.`);
      }
      setShowModal(false); setEditingEmploye(null);
      await loadData(); await fetchDerniersPaiements(employes);
    } catch (error: any) { showError('Erreur', error?.message || 'Impossible d\'enregistrer l\'employé.'); }
  }, [editingEmploye, createEmploye, updateEmploye, showSuccess, showError, loadData, fetchDerniersPaiements, employes]);

  const handleDeleteClick = useCallback((id: number) => {
    const employe = employes.find(item => item.id === id);
    setDeleteTarget({ id, nom: employe ? `${employe.prenom} ${employe.nom}` : '' });
    setShowDeleteModal(true);
  }, [employes]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmploye(deleteTarget.id);
      setSelectedIds(prev => { const next = new Set(prev); next.delete(deleteTarget.id); return next; });
      showSuccess('Employé supprimé', `L\'employé "${deleteTarget.nom}" a été supprimé.`);
      await loadData(); await fetchDerniersPaiements(employes);
    } catch (error: any) { showError('Erreur', error?.message || 'Impossible de supprimer cet employé.'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  }, [deleteTarget, deleteEmploye, showSuccess, showError, loadData, fetchDerniersPaiements, employes]);

  const handleAnnulerPaiement = useCallback(async (paiementId: number) => {
    try {
      await deletePaiement(paiementId);
      showSuccess('Paiement annulé', 'Le paiement a été annulé.');
      if (selectedEmploye) {
        await loadPaiementsEmploye(selectedEmploye.id);
        await refreshPaiementCounts();
        await fetchDerniersPaiements(employes);
      }
    } catch (error: any) { showError('Erreur annulation', error?.message || 'Impossible d\'annuler le paiement.'); }
  }, [selectedEmploye, deletePaiement, loadPaiementsEmploye, refreshPaiementCounts, showSuccess, showError, fetchDerniersPaiements, employes]);

  const handleOpenSalary = useCallback((employe: any) => {
    setSelectedEmploye(employe);
    setShowSalaryModal(true);
  }, []);

  const handleSaveSalary = useCallback(async (employeId: number, newSalary: number, raison: string) => {
    try {
      await updateSalary(employeId, newSalary, raison);
      showSuccess('Salaire mis à jour', `Le salaire de l'employé a été augmenté avec succès.`);
      await loadData();
      await fetchDerniersPaiements(employes);
    } catch (error: any) {
      showError('Erreur', error?.message || 'Impossible de mettre à jour le salaire.');
    }
  }, [updateSalary, loadData, fetchDerniersPaiements, employes, showSuccess, showError]);

  const handleOpenPresence = useCallback((employe: any) => { setSelectedEmploye(employe); setShowPresenceModal(true); }, []);

  const getMoisPourAnnee = useCallback((_dateEmbauche: string, annee: number, labels: string[] = moisLabelsCourt) => {
    const moisList: { mois: number; annee: number; label: string }[] = [];
    for (let mois = 1; mois <= 12; mois++) { moisList.push({ mois, annee, label: `${labels[mois - 1]} ${annee}` }); }
    return moisList;
  }, []);

  const handleExport = useCallback(async (format: 'excel' | 'pdf' | 'csv', period: ExportPeriod, customDate: string) => {
    try {
      let result;
      if (format === 'excel') result = await exportToExcel(period, customDate);
      else if (format === 'pdf') result = await exportToPDF(period, customDate);
      else result = await exportToCSV(period, customDate);

      if (result?.canceled) return;
      if (result?.success === false) {
        showError('Erreur export', result.error || 'Impossible d\'exporter les données.');
        return;
      }

      showSuccess('Export réussi', `Les employés ont été exportés en ${format.toUpperCase()} (${period}).`);
    } catch (error: any) {
      showError('Erreur export', error?.message || 'Impossible d\'exporter les données.');
    }
  }, [exportToExcel, exportToPDF, exportToCSV, showSuccess, showError]);

  const renderSkeleton = () => {
    const base = isDark ? 'bg-white/[0.06]' : 'bg-slate-200';
    const border = isDark ? 'border-white/[0.08]' : 'border-slate-200';
    return (
      <div className="min-h-[500px] w-full p-5">
        <div className="space-y-4">
          <div className={`flex items-center gap-4 border-b pb-4 ${border}`}>
            {[...Array(7)].map((_, i) => <div key={i} className={`h-4 w-${i === 0 ? 8 : i === 1 ? 24 : i === 2 ? 32 : i === 3 ? 20 : i === 4 ? 28 : i === 5 ? 20 : 28} rounded ${base} animate-pulse`} />)}
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex items-center gap-4 py-3 ${border}`}>
              <div className={`h-4 w-8 rounded ${base} animate-pulse`} />
              <div className={`h-10 w-10 rounded-lg ${base} animate-pulse`} />
              <div className={`h-4 w-32 rounded ${base} animate-pulse`} />
              <div className={`h-4 w-20 rounded ${base} animate-pulse`} />
              <div className="flex-1 space-y-2">
                <div className={`h-4 w-1/3 rounded ${base} animate-pulse`} />
                <div className={`h-3 w-1/2 rounded ${base} animate-pulse`} />
              </div>
              <div className={`h-4 w-24 rounded ${base} animate-pulse`} />
              <div className={`h-4 w-20 rounded ${base} animate-pulse`} />
              <div className={`h-4 w-28 rounded ${base} animate-pulse`} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-full w-full transition-colors duration-300" style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">
        <EmployesHeader onAddEmploye={handleOpenAddModal} onExport={handleExport} refreshing={refreshing} onRefresh={loadData} totalItems={totalItems} />

        <EmployesStats
          totalItems={totalItems}
          totalSalaire={totalSalaire}
          actifs={stats.actifs ?? 0}
          tauxActif={stats.tauxActif ?? 0}
        />

        <EmployesSearchBar
          searchTerm={searchTerm} onSearchChange={setSearchTerm}
          filterStatus={filterStatus} onFilterStatusChange={setFilterStatus}
          sortOption={sortOption} onSortChange={setSortOption}
          filterDepartement="" onFilterDepartementChange={() => {}}
          isLoading={loading} viewMode={viewMode} onViewModeChange={setViewMode}
        />

        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_-4px_rgba(79,70,229,0.08)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)]">
          {refreshing && (<div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent"><div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" /></div>)}

          {loading && employes.length === 0 ? (
            renderSkeleton()
          ) : viewMode === 'calendrier' ? (
            <EmployesCalendrier
              employes={employes} mois={selectedMonth} annee={selectedYear}
              onMoisChange={setSelectedMonth} onAnneeChange={setSelectedYear}
              onJourClick={(employeId, date) => {
                const emp = employes.find(e => e.id === employeId);
                if (emp) handleOpenPresence(emp);
              }}
            />
          ) : (
            <>
              <EmployesTable
                employes={employes} paiementCounts={paiementCounts} derniersPaiements={derniersPaiements}
                onView={handleViewEmploye} onEdit={handleEditEmploye} onDelete={handleDeleteClick}
                onHistorique={handleHistorique} onAdd={handleOpenAddModal}
                getStatusColor={getStatusColor} getStatusIcon={getStatusIcon}
                selectedIds={selectedIds} onSelectAll={handleSelectAll} onSelectOne={handleSelectOne}
                onBulkUpdateStatus={handleBulkUpdateStatus} onBulkDelete={handleBulkDelete}
                onGererPresence={handleOpenPresence} onFisondrotana={handleOpenSalary}
                onNouveauPaiement={handleNouveauPaiement}  // ⭐ VAOVAO
              />

              {!loading && !refreshing && employes.length === 0 && searchTerm !== '' && (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center border-t border-slate-200 dark:border-white/[0.1]">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-brand-50 dark:bg-brand-500/10 mb-4"><Users size={24} className="text-brand-500 dark:text-brand-400" /></div>
                  <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">Aucun employé trouvé</h3>
                  <p className="mt-1 text-[13px] max-w-sm text-slate-500 dark:text-slate-400">Aucun employé ne correspond aux critères de recherche.</p>
                </div>
              )}
            </>
          )}
        </section>

        {viewMode === 'liste' && !loading && totalPages > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_2px_10px_-2px_rgba(79,70,229,0.06)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.25)]">
            <EmployesPagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      <EmployesModalForm isOpen={showModal} onClose={handleCloseModal} onSubmit={handleSubmit} editingEmploye={editingEmploye} isDark={isDark} />

      {showViewModal && selectedEmploye && (
        <EmployesViewModal
          employe={selectedEmploye}
          onClose={() => setShowViewModal(false)}
          onEdit={() => { setShowViewModal(false); handleEditEmploye(selectedEmploye); }}
          onGererPresence={() => { setShowViewModal(false); handleOpenPresence(selectedEmploye); }}
          onFisondrotana={() => { setShowViewModal(false); handleOpenSalary(selectedEmploye); }}
          onDelete={() => { setShowViewModal(false); handleDeleteClick(selectedEmploye.id); }}
          historiquePaiements={historiquePaiements}
          onAnnulerPaiement={handleAnnulerPaiement}
          getMoisPourAnnee={getMoisPourAnnee}
          moisLabels={moisLabels}
          moisLabelsCourt={moisLabelsCourt}
          getStatusColor={getStatusColor} getStatusIcon={getStatusIcon} isDark={isDark}
        />
      )}

      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleConfirmDelete} title="Supprimer l’employé" message={`Êtes-vous sûr de vouloir supprimer définitivement "${deleteTarget?.nom || ''}" ?`} confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />
      <ConfirmModal isOpen={showBulkConfirmModal} onClose={() => { setShowBulkConfirmModal(false); setBulkTargetIds([]); setBulkTargetStatus(''); }} onConfirm={handleConfirmBulkAction} title="Confirmation de l’opération" message={bulkActionType === 'delete' ? `Voulez-vous vraiment supprimer définitivement ${bulkTargetIds.length} employé(s) ?` : `Voulez-vous vraiment changer le statut de ${bulkTargetIds.length} employé(s) ?`} confirmText="Confirmer" cancelText="Annuler" confirmColor={bulkActionType === 'delete' ? 'red' : 'green'} isDark={isDark} />
      {showPresenceModal && selectedEmploye && (<EmployesPresenceModal isOpen={showPresenceModal} onClose={() => setShowPresenceModal(false)} employe={selectedEmploye} mois={new Date().getMonth() + 1} annee={new Date().getFullYear()} moisLabels={moisLabels} onSave={savePresence} loadPresence={loadPresence} />)}

      {showSalaryModal && selectedEmploye && (
        <EmployesSalaryModal isOpen={showSalaryModal} onClose={() => setShowSalaryModal(false)} employe={selectedEmploye} onSave={handleSaveSalary} />
      )}

      {/* ⭐ VAOVAO: Modal paiement */}
      {showPaiementModal && paiementEmployeId !== null && (
        <PaiementsModalForm
          isOpen={showPaiementModal}
          onClose={handleClosePaiementModal}
          employeId={paiementEmployeId}
          employes={employes as any}
          onSuccess={handlePaiementSuccess}
          payrollMode="simplifie"
        />
      )}

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title={successTitle} message={successMessage} buttonText="OK" autoCloseDelay={3000} />
      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} title={errorTitle} message={errorMessage} buttonText="OK" autoCloseDelay={4000} />
    </main>
  );
};

export default Employes;