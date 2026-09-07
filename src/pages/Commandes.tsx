
import React, { useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCommandesData } from '../hooks/useCommandesData';
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

const normalizePaiementStatus = (statut: unknown): 'Payé' | 'Partiel' | 'Non payé' => {
  const n = String(statut || '').trim().toLowerCase();
  switch (n) {
    case 'payé': case 'paye': case 'paid': case 'payee': case 'payé complet': case 'paye complet': case 'paiement complet': return 'Payé';
    case 'partiel': case 'partial': case 'partielle': case 'partiellement payé': case 'partiellement paye': case 'paiement partiel': return 'Partiel';
    case 'non payé': case 'non paye': case 'unpaid': case 'non_payé': case 'non_paye': case 'impayé': case 'impaye': case 'en attente': return 'Non payé';
    default: return 'Non payé';
  }
};


const CommandesSkeleton = ({ isDark }: { isDark: boolean }) => {
  const base = isDark ? 'bg-white/[0.06]' : 'bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-200';
  return (
    <div className="min-h-[500px] w-full p-5">
      <div className="space-y-4">
        <div className={`flex items-center gap-4 border-b pb-4 ${border}`}>
          {[...Array(7)].map((_, i) => <div key={i} className={`h-4 w-${i === 0 ? 8 : i === 1 ? 24 : i === 2 ? 10 : i === 3 ? 32 : i === 4 ? 20 : i === 5 ? 28 : 20} rounded ${base} animate-pulse`} />)}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`flex items-center gap-4 py-3 ${border}`}>
            {[...Array(7)].map((_, j) => <div key={j} className={`h-4 w-${j === 0 ? 8 : j === 1 ? 24 : j === 2 ? 10 : j === 3 ? 32 : j === 4 ? 20 : j === 5 ? 28 : 20} rounded ${base} animate-pulse`} />)}
          </div>
        ))}
      </div>
    </div>
  );
};

const Commandes: React.FC = () => {
  const { isDark } = useTheme();
  const { company } = useCompany();
  const { user } = useAuth();

  const {
    commandes, clients, produits, loading, refreshing, totalItems, totalPages,
    currentPage, setCurrentPage, searchTerm, setSearchTerm, filterStatut, setFilterStatut,
    sortOption, setSortOption,
    stats, createCommande, deleteCommande,
    generateFacture, selectedClientId, setSelectedClientId, selectedProduits,
    handleAddProduit, handleUpdateQuantite, handleRemoveProduit, clearPanier,
    refreshReferences, details, loadDetails, updatePaiement, getDetteStats, detteStats
  } = useCommandesData();

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [commandeForInvoice, setCommandeForInvoice] = useState<any>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [montantPayeModal, setMontantPayeModal] = useState(0);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteTargetIds, setBulkDeleteTargetIds] = useState<number[]>([]);

  const showSuccess = useCallback((t: string, m: string) => {
    setSuccessTitle(t); setSuccessMessage(m); setShowSuccessModal(true);
  }, []);
  const showError = useCallback((t: string, m: string) => {
    setErrorTitle(t); setErrorMessage(m); setShowErrorModal(true);
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set(commandes.map((c: any) => Number(c.id))) : new Set());
  }, [commandes]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => { const n = new Set(prev); checked ? n.add(id) : n.delete(id); return n; });
  }, []);

  const handleBulkDelete = useCallback((ids: number[]) => {
    if (!ids.length) { showError('Sélection vide', 'Veuillez sélectionner au moins une commande.'); return; }
    setBulkDeleteTargetIds(ids); setShowBulkDeleteModal(true);
  }, [showError]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!bulkDeleteTargetIds.length) return;
    const count = bulkDeleteTargetIds.length;
    try {
      for (const id of bulkDeleteTargetIds) await deleteCommande(id);
      showSuccess('Suppression en lot', `${count} commande(s) supprimée(s).`);
      setSelectedIds(new Set()); setBulkDeleteTargetIds([]); setShowBulkDeleteModal(false);
      await getDetteStats();
    } catch (error: any) {
      showError('Erreur', error?.message || 'Impossible de supprimer les commandes.');
    } finally {
      setShowBulkDeleteModal(false); setBulkDeleteTargetIds([]);
    }
  }, [bulkDeleteTargetIds, deleteCommande, showSuccess, showError, getDetteStats]);

  const handleMarkAsPaid = useCallback(async (id: number, data: { montant_paye: number; statut_paiement: string }) => {
    try {
      await updatePaiement(id, data);
      showSuccess('Paiement validé', 'Commande marquée comme payée.');
      await getDetteStats();
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur paiement');
    }
  }, [updatePaiement, getDetteStats, showSuccess, showError]);

  const handleDeleteClick = useCallback((commande: any) => {
    setDeleteTarget(commande); setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteCommande(deleteTarget.id);
      showSuccess('Commande supprimée', `"${deleteTarget.numero || `CMD-${deleteTarget.id}`}" supprimée.`);
      await getDetteStats();
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur suppression');
    } finally {
      setShowDeleteModal(false); setDeleteTarget(null);
    }
  }, [deleteTarget, deleteCommande, showSuccess, showError, getDetteStats]);

  const handleViewCommande = useCallback(async (commande: any) => {
    setSelectedCommande(commande); await loadDetails(commande.id); setShowViewModal(true);
  }, [loadDetails]);

  const handleOpenAddModal = useCallback(async () => {
    try { await refreshReferences(); setMontantPayeModal(0); setShowModal(true); }
    catch (error: any) { showError('Erreur', error?.message || 'Impossible de charger.'); }
  }, [refreshReferences, showError]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false); clearPanier(); setSelectedClientId(null); setMontantPayeModal(0);
  }, [clearPanier, setSelectedClientId]);

  const handleSubmitCommande = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClientId) { showError('Client requis', 'Sélectionnez un client.'); return; }
    if (!selectedProduits.length) { showError('Panier vide', 'Ajoutez au moins un produit.'); return; }
    try {
      const montantPaye = Math.max(0, Number(montantPayeModal || 0));
      await createCommande(selectedClientId, selectedProduits, { montant_paye: montantPaye });
      showSuccess('Commande créée', 'Commande enregistrée.');
      setShowModal(false); clearPanier(); setSelectedClientId(null); setMontantPayeModal(0);
      await getDetteStats();
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur création.');
    }
  }, [selectedClientId, selectedProduits, montantPayeModal, createCommande, clearPanier, setSelectedClientId, showSuccess, showError, getDetteStats]);

  const handleGenerateInvoiceClick = useCallback(async (commande: any) => {
    try {
      const products = await loadDetails(commande.id);
      setCommandeForInvoice({ ...commande, statut_paiement: normalizePaiementStatus(commande?.statut_paiement), products: products || [] });
      setShowCompanyModal(true);
    } catch (error: any) {
      showError('Erreur', `Impossible de charger les produits : ${error?.message || 'Erreur inconnue'}`);
    }
  }, [loadDetails, showError]);

  const handleCompanyModalGenerate = useCallback(async (dataFromModal?: any) => {
    if (!commandeForInvoice) return;
    setGeneratingPDF(true);
    try {
      const companyData = dataFromModal || company;
      const { downloadPDF } = await import('../lib/pdfService');
      const displayVendeur = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.name || 'admin');
      const result = await downloadPDF({
        order: commandeForInvoice, clientName: commandeForInvoice.client_nom || 'Client',
        clientEmail: commandeForInvoice.client_email || '', clientPhone: commandeForInvoice.client_telephone || '',
        clientAddress: commandeForInvoice.client_address || '', companyName: companyData?.name || "TahiryPro",
        companyAddress: companyData?.address || '', companyPhone: companyData?.phone || '',
        companyEmail: companyData?.email || '', companySiret: companyData?.siret || '',
        companyTaxId: companyData?.taxId || '', companyRcs: companyData?.rcs || '', companyVatNumber: companyData?.vatNumber || '',
        paymentMethod: commandeForInvoice.paymentMethod || 'Espèces', paymentTerms: commandeForInvoice.paymentTerms || 'Sous 30 jours',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        montantPaye: commandeForInvoice.montant_paye || 0,
        vendeur: displayVendeur
      });
      if (result?.canceled) showSuccess('Génération annulée', 'PDF annulé.');
      else if (result?.success) showSuccess('Facture générée', 'Facture enregistrée.');
      else showError('Erreur', result?.error || 'Erreur génération.');
      return result;
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur génération.');
      return { success: false, error: error?.message };
    } finally {
      setGeneratingPDF(false); setShowCompanyModal(false); setCommandeForInvoice(null);
    }
  }, [commandeForInvoice, company, showSuccess, showError, user]);

  return (
    <main
      className="min-h-full w-full transition-colors duration-300"
      style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}
    >
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">
        <CommandesHeader onAddCommande={handleOpenAddModal} onOpenStats={() => {}} totalItems={stats?.total || totalItems} refreshing={refreshing} />
        <CommandesStats {...stats} totalItems={totalItems} refreshing={refreshing} totalDette={detteStats?.total_dette || 0} nbCommandesNonPayees={detteStats?.nb_commandes_non_payees || 0} />
        <CommandesSearchBar
          searchTerm={searchTerm} onSearchChange={setSearchTerm} filterStatut={filterStatut} onFilterStatutChange={setFilterStatut}
          sortOption={sortOption} onSortChange={setSortOption} isLoading={loading}
        />
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_-4px_rgba(79,70,229,0.08)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)]">
          {refreshing && (
            <div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent">
              <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" />
            </div>
          )}

          {loading && commandes.length === 0 ? (
            <CommandesSkeleton isDark={isDark} />
          ) : (
            <CommandesTable
              commandes={commandes} onView={handleViewCommande} onDelete={handleDeleteClick}
              onGenerateFacture={handleGenerateInvoiceClick} selectedIds={selectedIds}
              onSelectAll={handleSelectAll} onSelectOne={handleSelectOne} loading={loading}
              totalItems={totalItems}
              generating={generatingPDF}
              onAdd={handleOpenAddModal} onUpdatePaiement={handleMarkAsPaid} onBulkDelete={handleBulkDelete}
            />
          )}
        </section>
        {!loading && totalItems > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_2px_10px_-2px_rgba(79,70,229,0.06)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.25)]">
            <CommandesPagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      <CommandesModalForm
        isOpen={showModal} onClose={handleCloseModal} onSubmit={handleSubmitCommande}
        clients={clients} produits={produits} selectedClientId={selectedClientId}
        onClientChange={setSelectedClientId} selectedProduits={selectedProduits}
        onAddProduit={handleAddProduit} onUpdateQuantite={handleUpdateQuantite}
        onRemoveProduit={handleRemoveProduit} onClearPanier={clearPanier}
        isDark={isDark} montantPaye={montantPayeModal} onMontantPayeChange={setMontantPayeModal}
      />

      {showViewModal && selectedCommande && (
        <CommandesDetailsModal
          commande={{ ...selectedCommande, statut_paiement: normalizePaiementStatus(selectedCommande?.statut_paiement) }}
          details={details} onClose={() => setShowViewModal(false)}
          onGenerateFacture={() => handleGenerateInvoiceClick(selectedCommande)}
        />
      )}

      <CompanySettingsModal isOpen={showCompanyModal}
        onClose={() => { setShowCompanyModal(false); setCommandeForInvoice(null); }}
        onSave={() => { setShowCompanyModal(false); setCommandeForInvoice(null); }}
        onGenerate={handleCompanyModalGenerate} mode="generate" isDark={isDark}
        commandeForInvoice={commandeForInvoice} initialData={company}
        onPDFGenerated={(success, filePath) => { if (success) console.log(`Facture enregistrée: ${filePath}`); }} />

      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete} title="Suppression" message={`Supprimer "${deleteTarget?.numero || ''}" ?`}
        confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />

      <ConfirmModal isOpen={showBulkDeleteModal} onClose={() => { setShowBulkDeleteModal(false); setBulkDeleteTargetIds([]); }}
        onConfirm={handleConfirmBulkDelete} title="Suppression en lot"
        message={`Voulez-vous supprimer ${bulkDeleteTargetIds.length} commande(s) ?`}
        confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}
        title={successTitle} message={successMessage} buttonText="OK" autoCloseDelay={3000} />

      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)}
        title={errorTitle} message={errorMessage} buttonText="OK" autoCloseDelay={4000} />
    </main>
  );
};

export default Commandes;