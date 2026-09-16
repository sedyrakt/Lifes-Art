// src/pages/Commandes.tsx
// ⭐ REFACTOR: Nizara ho modules ny Commandes page
// ⭐ FIX: Ny "DETTE CLIENTS" dia manisa ny commandes rehetra manana trosa (Partiel + Non payé)
// ⭐ NOUVEAU: Skeleton loader full-page (tsoloana ny skeleton table kely)

import React, { useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCommandesData, ExportPeriod } from '../hooks/useCommandesData';
import { useCompany } from '../contexts/CompanyContext';
import CommandesHeader from '../components/commandes/CommandesHeader';
import { CommandesStats } from '../components/commandes';
import CommandesTable from '../components/commandes/CommandesTable';
import CommandesPagination from '../components/commandes/CommandesPagination';
import CommandesModalForm from '../components/commandes/CommandesModalForm';
import { CommandesDetailsModal } from '../components/commandes';
import ConfirmModal from '../components/common/ConfirmModal';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';
import CommandesSearchBar from '../components/commandes/CommandesSearchBar';
import CompanySettingsModal from '../components/company/CompanySettingsModal';
import EcheancesDepasseesModal from '../components/commandes/EcheancesDepasseesModal';

// ⭐ Modules
import {
  normalizePaiementStatus,
  countTotalItems,
  OverdueBanner,
  useCommandesPageModals,
} from './commandes/index';

// ============================================================
// ⭐ SKELETON LOADER FULL-PAGE
// ============================================================

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md ${className}`} />
);

const CommandesPageSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const cardBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-100';
  const surfaceBg = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const rowBorderColor = isDark ? 'border-white/[0.06]' : 'border-slate-100';
  const pageBg = isDark ? '#0F172A' : '#EEF2FF';

  return (
    <main className="min-h-full w-full transition-colors duration-300" style={{ background: pageBg }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">

        {/* ⭐ HEADER SKELETON */}
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border-[0.5px] p-4 ${surfaceBg} ${borderColor}`}>
          <div className="flex items-center gap-3">
            <SkeletonBlock className={`h-10 w-10 rounded-lg ${cardBg}`} />
            <div className="space-y-2">
              <SkeletonBlock className={`h-4 w-40 ${cardBg}`} />
              <SkeletonBlock className={`h-3 w-56 ${cardBg}`} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className={`h-9 w-9 rounded-lg ${cardBg}`} />
            <SkeletonBlock className={`h-9 w-32 rounded-lg ${cardBg}`} />
            <SkeletonBlock className={`h-9 w-40 rounded-lg ${cardBg}`} />
          </div>
        </div>

        {/* ⭐ STATS CARDS SKELETON (5 cards) */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`rounded-xl border-[0.5px] p-4 ${surfaceBg} ${borderColor}`}>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
                  <SkeletonBlock className={`h-6 w-24 ${cardBg}`} />
                </div>
                <SkeletonBlock className={`h-10 w-10 rounded-lg ${cardBg}`} />
              </div>
            </div>
          ))}
        </div>

        {/* ⭐ SEARCHBAR SKELETON */}
        <div className={`flex flex-wrap items-center gap-2 rounded-xl border-[0.5px] p-3 ${surfaceBg} ${borderColor}`}>
          <SkeletonBlock className={`h-10 flex-1 min-w-[200px] rounded-lg ${cardBg}`} />
          <SkeletonBlock className={`h-10 w-[140px] rounded-lg ${cardBg}`} />
          <SkeletonBlock className={`h-10 w-[150px] rounded-lg ${cardBg}`} />
          <SkeletonBlock className={`h-10 w-[130px] rounded-lg ${cardBg}`} />
        </div>

        {/* ⭐ TABLE SKELETON */}
        <section className={`relative overflow-hidden rounded-2xl border-[0.5px] ${surfaceBg} ${borderColor}`}>
          {/* Table header */}
          <div className={`flex items-center gap-3 border-b px-3 py-2.5 ${rowBorderColor}`}>
            <SkeletonBlock className={`h-4 w-4 rounded ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-24 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-24 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-16 ${cardBg}`} />
            <div className="ml-auto">
              <SkeletonBlock className={`h-3 w-16 ${cardBg}`} />
            </div>
          </div>

          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`flex items-center gap-3 border-b px-3 py-3 ${rowBorderColor}`}>
              <SkeletonBlock className={`h-4 w-4 rounded ${cardBg}`} />
              <SkeletonBlock className={`h-5 w-20 rounded ${cardBg}`} />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className={`h-3.5 w-32 ${cardBg}`} />
                <SkeletonBlock className={`h-2.5 w-20 ${cardBg}`} />
              </div>
              <SkeletonBlock className={`h-3.5 w-20 ${cardBg}`} />
              <SkeletonBlock className={`h-3.5 w-24 ${cardBg}`} />
              <SkeletonBlock className={`h-3.5 w-24 ${cardBg}`} />
              <SkeletonBlock className={`h-5 w-16 rounded ${cardBg}`} />
              <SkeletonBlock className={`h-3.5 w-20 ${cardBg}`} />
              <SkeletonBlock className={`h-3.5 w-20 ${cardBg}`} />
              <SkeletonBlock className={`h-5 w-16 rounded ${cardBg}`} />
              <div className="ml-auto">
                <SkeletonBlock className={`h-7 w-7 rounded ${cardBg}`} />
              </div>
            </div>
          ))}

          {/* Table footer */}
          <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2.5 ${rowBorderColor}`}>
            <div className="flex items-center gap-3">
              <SkeletonBlock className={`h-3.5 w-24 ${cardBg}`} />
              <SkeletonBlock className={`h-3.5 w-20 ${cardBg}`} />
              <SkeletonBlock className={`h-3.5 w-20 ${cardBg}`} />
              <SkeletonBlock className={`h-3.5 w-20 ${cardBg}`} />
            </div>
            <SkeletonBlock className={`h-3.5 w-28 ${cardBg}`} />
          </div>
        </section>

        {/* ⭐ PAGINATION SKELETON */}
        <div className={`flex items-center justify-between rounded-2xl border-[0.5px] px-3 py-2.5 ${surfaceBg} ${borderColor}`}>
          <SkeletonBlock className={`h-3.5 w-32 ${cardBg}`} />
          <div className="flex items-center gap-1.5">
            <SkeletonBlock className={`h-7 w-7 rounded ${cardBg}`} />
            <SkeletonBlock className={`h-7 w-7 rounded ${cardBg}`} />
            <SkeletonBlock className={`h-7 w-7 rounded ${cardBg}`} />
            <SkeletonBlock className={`h-7 w-7 rounded ${cardBg}`} />
          </div>
        </div>

      </div>
    </main>
  );
};

// ============================================================
// COMPOSANT
// ============================================================

const Commandes: React.FC = () => {
  const { isDark } = useTheme();
  const { company } = useCompany();
  const { user } = useAuth();

  const {
    commandes, clients, produits, loading, refreshing, totalItems, totalPages,
    currentPage, setCurrentPage, searchTerm, setSearchTerm, filterStatut, setFilterStatut,
    sortOption, setSortOption,
    stats,
    globalStats,
    createCommande, deleteCommande,
    selectedClientId, setSelectedClientId, selectedProduits,
    handleAddProduit, handleUpdateQuantite, handleRemoveProduit, clearPanier,
    refreshReferences, details, loadDetails, updatePaiement, getDetteStats, detteStats,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
    overdueCommandes,
    overdueCount,
    overdueTotal,
    loadGlobalStats,
    filterDate, setFilterDate,
  } = useCommandesData();

  // ⭐ Modals (state + handlers)
  const {
    showModal, setShowModal,
    showViewModal,
    selectedCommande,
    deleteTarget,
    showDeleteModal,
    showSuccessModal,
    successTitle, successMessage,
    showErrorModal,
    errorTitle, errorMessage,
    selectedIds, setSelectedIds,
    showCompanyModal,
    commandeForInvoice,
    generatingPDF, setGeneratingPDF,
    montantPayeModal, setMontantPayeModal,
    showBulkDeleteModal,
    bulkDeleteTargetIds,
    showOverdueModal,
    showSuccess, showError,
    handleSelectAll, handleSelectOne,
    openDeleteModal, closeDeleteModal,
    openBulkDeleteModal, closeBulkDeleteModal,
    openViewModal, closeViewModal,
    openCompanyModal, closeCompanyModal,
    openOverdueModal, closeOverdueModal,
    closeSuccessModal, closeErrorModal,
  } = useCommandesPageModals();

  const handleExport = useCallback(async (
    format: 'excel' | 'pdf' | 'csv',
    period: ExportPeriod,
    customDate: string
  ) => {
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
      showSuccess('Export réussi', `Les commandes ont été exportées en ${format.toUpperCase()} (${period}${period === 'custom' ? ' - ' + customDate : ''}).`);
    } catch (error: any) {
      showError('Erreur export', error?.message || 'Impossible d\'exporter les données.');
    }
  }, [exportToExcel, exportToPDF, exportToCSV, showSuccess, showError]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!bulkDeleteTargetIds.length) return;
    const count = bulkDeleteTargetIds.length;
    try {
      for (const id of bulkDeleteTargetIds) await deleteCommande(id);
      showSuccess('Suppression en lot', `${count} commande(s) supprimée(s).`);
      setSelectedIds(new Set());
      closeBulkDeleteModal();
      await getDetteStats();
    } catch (error: any) {
      showError('Erreur', error?.message || 'Impossible de supprimer les commandes.');
    } finally {
      closeBulkDeleteModal();
    }
  }, [bulkDeleteTargetIds, deleteCommande, showSuccess, showError, getDetteStats, setSelectedIds, closeBulkDeleteModal]);

  const handleMarkAsPaid = useCallback(async (
    id: number,
    data: { montant_paye: number; statut_paiement: string }
  ) => {
    try {
      await updatePaiement(id, data);
      showSuccess('Paiement validé', 'Commande marquée comme payée.');
      await getDetteStats();
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur paiement');
    }
  }, [updatePaiement, getDetteStats, showSuccess, showError]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteCommande(deleteTarget.id);
      showSuccess('Commande supprimée', `"${deleteTarget.numero || `CMD-${deleteTarget.id}`}" supprimée.`);
      await getDetteStats();
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur suppression');
    } finally {
      closeDeleteModal();
    }
  }, [deleteTarget, deleteCommande, showSuccess, showError, getDetteStats, closeDeleteModal]);

  const handleViewCommande = useCallback(async (commande: any) => {
    openViewModal(commande);
    await loadDetails(commande.id);
  }, [openViewModal, loadDetails]);

  const handleOpenAddModal = useCallback(async () => {
    try {
      await refreshReferences();
      setMontantPayeModal(0);
      setShowModal(true);
    } catch (error: any) {
      showError('Erreur', error?.message || 'Impossible de charger.');
    }
  }, [refreshReferences, showError, setMontantPayeModal, setShowModal]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    clearPanier();
    setSelectedClientId(null);
    setMontantPayeModal(0);
  }, [clearPanier, setSelectedClientId, setShowModal, setMontantPayeModal]);

  const handleSubmitCommande = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClientId) { showError('Client requis', 'Sélectionnez un client.'); return; }
    if (!selectedProduits.length) { showError('Panier vide', 'Ajoutez au moins un produit.'); return; }
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const montantPaye = Math.max(0, Number(montantPayeModal || 0));
      const modePaiement = (formData.get('mode_paiement') as string) || 'Espèces';
      const modalitePaiement = (formData.get('modalite_paiement') as string) || 'Immediat';
      const fraisLivraison = Number(formData.get('frais_livraison') || 0);
      await createCommande(selectedClientId, selectedProduits, {
        montant_paye: montantPaye,
        mode_paiement: modePaiement,
        modalite_paiement: modalitePaiement,
        frais_livraison: fraisLivraison,
      });
      showSuccess('Commande créée', 'Commande enregistrée.');
      setShowModal(false);
      clearPanier();
      setSelectedClientId(null);
      setMontantPayeModal(0);
      await getDetteStats();
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur création.');
    }
  }, [selectedClientId, selectedProduits, montantPayeModal, createCommande, clearPanier,
      setSelectedClientId, showSuccess, showError, getDetteStats, setShowModal, setMontantPayeModal]);

  const handleGenerateInvoiceClick = useCallback(async (commande: any) => {
    try {
      const products = await loadDetails(commande.id);
      const fraisLivraison = Number(commande.frais_livraison || 0);
      openCompanyModal({
        ...commande,
        statut_paiement: normalizePaiementStatus(commande?.statut_paiement),
        products: products || [],
        livraison: fraisLivraison > 0 ? 'Oui' : 'Non',
        frais_livraison: fraisLivraison,
      });
    } catch (error: any) {
      showError('Erreur', `Impossible de charger les produits : ${error?.message || 'Erreur inconnue'}`);
    }
  }, [loadDetails, showError, openCompanyModal]);

  const handleCompanyModalGenerate = useCallback(async (dataFromModal?: any) => {
    if (!commandeForInvoice) return;
    setGeneratingPDF(true);
    try {
      const companyData: any = dataFromModal || company || {};
      const { downloadPDF } = await import('../lib/pdfService');
      const displayVendeur = user?.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : (user?.name || 'admin');

      const fraisLivraison = Number(commandeForInvoice.frais_livraison || 0);
      const livraisonDisplay = commandeForInvoice.livraison || (fraisLivraison > 0 ? 'Oui' : 'Non');

      const result = await downloadPDF({
        order: commandeForInvoice,
        clientName: commandeForInvoice.client_nom || 'Client',
        clientEmail: commandeForInvoice.client_email || '',
        clientPhone: commandeForInvoice.client_telephone || '',
        clientAddress: commandeForInvoice.client_address || '',
        clientNif: companyData?.clientNif || '',
        clientStat: companyData?.clientStat || '',
        clientRcs: companyData?.clientRcs || '',
        clientCif: companyData?.clientCif || '',
        clientContact: companyData?.clientContact || commandeForInvoice.client_telephone || '',
        companyName: companyData?.name || "LIFE'S ART",
        companyAddress: companyData?.address || '',
        companyPhone: companyData?.phone || '',
        companyEmail: companyData?.email || '',
        companyWebsite: companyData?.website || '',
        companyStat: companyData?.stat || companyData?.siret || '',
        companyNif: companyData?.nif || companyData?.taxId || '',
        companyRcs: companyData?.rcs || '',
        companyVatNumber: companyData?.vatNumber || '',
        paymentMethod: commandeForInvoice.mode_paiement || 'Espèces',
        paymentTerms: commandeForInvoice.modalite_paiement || 'Immediat',
        dueDate: commandeForInvoice.date_limite_paiement,
        montantPaye: commandeForInvoice.montant_paye || 0,
        vendeur: displayVendeur,
        isPro: true,
        livraison: livraisonDisplay,
      }, isDark);

      if (result?.canceled) showSuccess('Génération annulée', 'PDF annulé.');
      else if (result?.success) showSuccess('Facture générée', 'Facture enregistrée.');
      else showError('Erreur', result?.error || 'Erreur génération.');
      return result;
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur génération.');
      return { success: false, error: error?.message };
    } finally {
      setGeneratingPDF(false);
      closeCompanyModal();
    }
  }, [commandeForInvoice, company, showSuccess, showError, user, isDark, setGeneratingPDF, closeCompanyModal]);

  const filteredCommandes = commandes;

  const filteredStats = useMemo(() => {
    const hasFilter = Boolean(
      filterDate || searchTerm || (filterStatut && filterStatut !== 'Tous')
    );

    if (hasFilter) {
      const filteredTotal = commandes.length;
      const filteredCA = commandes.reduce((sum, c) => sum + Number(c.total_ttc || 0), 0);
      const filteredDette = commandes.reduce(
        (sum, c) => sum + Math.max(0, Number(c.total_ttc || 0) - Number(c.montant_paye || 0)), 0);
      
      // ⭐ FIX: Manisa ny commandes REHETRA manana trosa (Partiel + Non payé)
      const filteredNonPayees = commandes.filter(c => Number(c.montant_restant || 0) > 0).length;
      const filteredTotalItems = countTotalItems(commandes);
      
      return {
        total: filteredTotal,
        totalCA: filteredCA,
        totalItems: filteredTotalItems,
        totalDette: filteredDette,
        nbCommandesNonPayees: filteredNonPayees,
      };
    }

    return {
      total: globalStats.total || totalItems,
      totalCA: globalStats.totalCA,
      totalItems: globalStats.totalItems,
      totalDette: globalStats.totalDette,
      // ⭐ FIX: Mampiasa detteStats (izay manisa Partiel + Non payé) raha misy
      nbCommandesNonPayees: detteStats?.nb_commandes_non_payees || globalStats.nbCommandesNonPayees,
    };
  }, [commandes, filterDate, searchTerm, filterStatut, globalStats, totalItems, detteStats]);

  const hasActiveFilter = useMemo(() => Boolean(
    filterDate || searchTerm || (filterStatut && filterStatut !== 'Tous')
  ), [filterDate, searchTerm, filterStatut]);

  // ============================================================
  // ⭐ SKELETON FULL-PAGE — alohan'ny render ny page
  // ============================================================
  if (loading && commandes.length === 0) {
    return <CommandesPageSkeleton isDark={isDark} />;
  }

  return (
    <main className="min-h-full w-full transition-colors duration-300"
      style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">
        <CommandesHeader
          onAddCommande={handleOpenAddModal}
          onOpenStats={() => {}}
          onExport={handleExport}
          totalItems={filteredStats.total}
          refreshing={refreshing}
        />

        <CommandesStats
          total={filteredStats.total}
          totalCA={filteredStats.totalCA}
          totalItems={filteredStats.totalItems}
          refreshing={refreshing}
          totalDette={filteredStats.totalDette}
          nbCommandesNonPayees={filteredStats.nbCommandesNonPayees}
        />

        <CommandesSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatut={filterStatut}
          onFilterStatutChange={setFilterStatut}
          sortOption={sortOption}
          onSortChange={setSortOption}
          isLoading={loading}
          filterDate={filterDate}
          onFilterDateChange={setFilterDate}
        />

        <OverdueBanner
          isDark={isDark}
          overdueCount={overdueCount}
          overdueTotal={overdueTotal}
          onClick={openOverdueModal}
        />

        <section className="relative overflow-hidden rounded-2xl border transition-all duration-300"
          style={{
            background: isDark ? '#0F172A' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
            boxShadow: isDark
              ? '0 4px 24px -4px rgba(0,0,0,0.35)'
              : '0 4px 20px -4px rgba(79,70,229,0.08)',
          }}>
          {refreshing && (
            <div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent">
              <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" />
            </div>
          )}
          <CommandesTable
            commandes={filteredCommandes}
            onView={handleViewCommande}
            onDelete={openDeleteModal}
            onGenerateFacture={handleGenerateInvoiceClick}
            selectedIds={selectedIds}
            onSelectAll={(checked) => handleSelectAll(checked, commandes)}
            onSelectOne={handleSelectOne}
            loading={loading}
            totalItems={filteredStats.total}
            generating={generatingPDF}
            onAdd={handleOpenAddModal}
            onUpdatePaiement={handleMarkAsPaid}
            onBulkDelete={openBulkDeleteModal}
            globalStats={globalStats}
            hasActiveFilter={hasActiveFilter}
          />
        </section>

        {!loading && filteredStats.total > 0 && (
          <div className="flex items-center justify-between rounded-2xl border px-3 py-2.5 transition-all duration-300"
            style={{
              background: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
              boxShadow: isDark
                ? '0 2px 12px -2px rgba(0,0,0,0.25)'
                : '0 2px 10px -2px rgba(79,70,229,0.06)',
            }}>
            <CommandesPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredStats.total}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <CommandesModalForm
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitCommande}
        clients={clients}
        produits={produits}
        selectedClientId={selectedClientId}
        onClientChange={setSelectedClientId}
        selectedProduits={selectedProduits}
        onAddProduit={handleAddProduit}
        onUpdateQuantite={handleUpdateQuantite}
        onRemoveProduit={handleRemoveProduit}
        onClearPanier={clearPanier}
        isDark={isDark}
        montantPaye={montantPayeModal}
        onMontantPayeChange={setMontantPayeModal}
      />

      {showViewModal && selectedCommande && (
        <CommandesDetailsModal
          commande={{
            ...selectedCommande,
            statut_paiement: normalizePaiementStatus(selectedCommande?.statut_paiement),
          }}
          details={details}
          onClose={closeViewModal}
          onGenerateFacture={() => handleGenerateInvoiceClick(selectedCommande)}
        />
      )}

      <CompanySettingsModal
        isOpen={showCompanyModal}
        onClose={closeCompanyModal}
        onSave={closeCompanyModal}
        onGenerate={handleCompanyModalGenerate}
        mode="generate"
        isDark={isDark}
        commandeForInvoice={commandeForInvoice}
        initialData={company}
        onPDFGenerated={(success, filePath) => {
          if (success) console.log(`Facture enregistrée: ${filePath}`);
        }}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Suppression"
        message={`Supprimer "${deleteTarget?.numero || ''}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmColor="red"
        isDark={isDark}
      />

      <ConfirmModal
        isOpen={showBulkDeleteModal}
        onClose={closeBulkDeleteModal}
        onConfirm={handleConfirmBulkDelete}
        title="Suppression en lot"
        message={`Voulez-vous supprimer ${bulkDeleteTargetIds.length} commande(s) ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmColor="red"
        isDark={isDark}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={closeSuccessModal}
        title={successTitle}
        message={successMessage}
        buttonText="OK"
        autoCloseDelay={3000}
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={closeErrorModal}
        title={errorTitle}
        message={errorMessage}
        buttonText="OK"
        autoCloseDelay={4000}
      />

      <EcheancesDepasseesModal
        isOpen={showOverdueModal}
        onClose={closeOverdueModal}
        commandes={overdueCommandes}
        totalDette={overdueTotal}
        onView={async (cmd) => {
          closeOverdueModal();
          await handleViewCommande(cmd);
        }}
        onMarkAsPaid={async (id, data) => {
          await handleMarkAsPaid(id, data);
        }}
      />
    </main>
  );
};

export default Commandes;