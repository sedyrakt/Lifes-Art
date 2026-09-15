// src/pages/Commandes.tsx
// ⭐ REFACTOR: Nizara ho modules ny Commandes page
// ⭐ FIX: Ny "DETTE CLIENTS" dia manisa ny commandes rehetra manana trosa (Partiel + Non payé)

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
  CommandesSkeleton,
  OverdueBanner,
  useCommandesPageModals,
} from './commandes';

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
          {loading && commandes.length === 0 ? (
            <CommandesSkeleton isDark={isDark} />
          ) : (
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
          )}
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