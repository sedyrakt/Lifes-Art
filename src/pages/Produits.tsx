// src/pages/Produits.tsx
// ⭐ FIX: ErrorModal + SuccessModal manana zIndex AMBONY noho ny ProduitsModalForm
//        → Tsy ho voasaron'ny product modal intsony ny erreur

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useProduitsData, ExportPeriod } from '../hooks/useProduitsData';

import ProduitsHeader from '../components/produits/ProduitsHeader';
import ProduitsStats from '../components/produits/ProduitsStats';
import ProduitsTable from '../components/produits/ProduitsTable';
import ProduitsPagination from '../components/produits/ProduitsPagination';
import ProduitsModalForm from '../components/produits/ProduitsModalForm';
import ProduitsViewModal from '../components/produits/ProduitsViewModal';
import CommandesModalForm from '../components/commandes/CommandesModalForm';
import ConfirmModal from '../components/common/ConfirmModal';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';
import ProduitsSearchBar from '../components/produits/ProduitsSearchBar';

// ⭐ Modules
import {
  getStockLevel,
  getStatusColor,
  getStatusIcon,
  ProduitsSkeleton,
  useProduitsPageModals,
  useProduitsCommandeModal,
} from './produits';

// ⭐ zIndex AMBONY ho an'ny notifications (ambony noho ny modal rehetra)
const NOTIFICATION_Z_INDEX = 9999999;

const Produits: React.FC = () => {
  const { isDark } = useTheme();
  const {
    produits, categories, fournisseurs, loadReferences,
    loading, refreshing, totalItems, totalPages,
    currentPage, setCurrentPage, filters, setFilters,
    sortOption, setSortOption, generateCode,
    createProduit, updateProduit, deleteProduit, getProduitById,
    bulkUpdateStatus, bulkDelete, getStats, loadData,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  } = useProduitsData();

  // ===== STATE STATS =====
  const [reelStats, setReelStats] = useState({
    totalItems: 0,
    totalStock: 0,
    alertes: 0,
    totalValeur: 0,
    actifs: 0,
    rupture: 0,
  });

  // ===== NOTIFICATIONS (local) =====
  const [successTitleLocal, setSuccessTitleLocal] = useState('');
  const [successMessageLocal, setSuccessMessageLocal] = useState('');
  const [errorTitleLocal, setErrorTitleLocal] = useState('');
  const [errorMessageLocal, setErrorMessageLocal] = useState('');
  const [showSuccessModalLocal, setShowSuccessModalLocal] = useState(false);
  const [showErrorModalLocal, setShowErrorModalLocal] = useState(false);

  const showSuccess = useCallback((t: string, m: string) => {
    setSuccessTitleLocal(t);
    setSuccessMessageLocal(m);
    setShowSuccessModalLocal(true);
  }, []);

  const showError = useCallback((t: string, m: string) => {
    setErrorTitleLocal(t);
    setErrorMessageLocal(m);
    setShowErrorModalLocal(true);
  }, []);

  // ===== FETCH STATS =====
  const fetchReelStats = useCallback(async () => {
    try {
      const data = await getStats();
      if (!data) return;
      setReelStats({
        totalItems: Number(data.total) || 0,
        totalStock: Number(data.totalStock) || 0,
        alertes: Number(data.alerte) || 0,
        totalValeur: Number(data.valeur_totale) || 0,
        actifs: Number(data.actifs) || 0,
        rupture: Number(data.rupture) || 0,
      });
    } catch (err) {
      console.error('❌ [Produits] Erreur stats:', err);
    }
  }, [getStats]);

  useEffect(() => {
    if (!loading) fetchReelStats();
  }, [loading, fetchReelStats]);

  // ===== Hooks custom (modals + notifications) =====
  const {
    showModal, setShowModal,
    showViewModal, setShowViewModal,
    showDeleteModal,
    showBulkStatusModal,
    selectedProduit, setSelectedProduit,
    editingProduit, setEditingProduit,
    deleteTarget,
    bulkStatusData,
    selectedIds, setSelectedIds,
    handleSelectAll, handleSelectOne,
    handleBulkUpdateStatus, handleConfirmBulkStatusUpdate,
    handleBulkDelete, handleConfirmBulkDelete,
    handleDeleteClick, handleConfirmSingleDelete,
    handleCloseProductModal,
    closeDeleteModal,
    closeBulkStatusModal,
  } = useProduitsPageModals({
    showError,
    showSuccess,
    loadData,
    fetchReelStats,
    deleteProduit,
    bulkDelete,
    bulkUpdateStatus,
  });

  // ===== Hooks commande modal =====
  const {
    commandeClients,
    commandeProduits,
    commandeSelectedClientId, setCommandeSelectedClientId,
    commandeSelectedProduits,
    showCommandeModal, setShowCommandeModal,
    montantPayeCommande, setMontantPayeCommande,
    handleNewCommande,
    handleAddProduitCommande,
    handleUpdateQuantiteCommande,
    handleRemoveProduitCommande,
    handleClearPanierCommande,
    handleSubmitCommande,
  } = useProduitsCommandeModal({ showError, showSuccess });

  // ===== HANDLE EXPORT =====
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
      showSuccess('Export réussi', `Les produits ont été exportés en ${format.toUpperCase()} (${period}${period === 'custom' ? ' - ' + customDate : ''}).`);
    } catch (error: any) {
      showError('Erreur export', error?.message || 'Impossible d\'exporter les données.');
    }
  }, [exportToExcel, exportToPDF, exportToCSV, showSuccess, showError]);

  // ===== HANDLE SELECT =====
  const handleSelectAllLocal = useCallback((checked: boolean) => {
    handleSelectAll(checked, produits);
  }, [handleSelectAll, produits]);

  // ===== HANDLE PRODUIT CRUD =====
  const handleViewProduit = useCallback(async (id: number) => {
    if (!Number.isInteger(id) || id <= 0) return;
    try {
      const produit = await getProduitById(id);
      if (!produit) throw new Error('Produit introuvable.');
      setSelectedProduit(produit);
      setShowViewModal(true);
    } catch (err: any) {
      showError('Erreur chargement', err?.message || 'Impossible de charger le produit.');
    }
  }, [getProduitById, showError, setSelectedProduit, setShowViewModal]);

  const handleEditProduit = useCallback(async (produit: any) => {
    if (!produit?.id) return;
    try {
      await loadReferences(true);
      setEditingProduit(produit);
      setShowModal(true);
    } catch (err: any) {
      showError('Erreur', err?.message || 'Impossible de charger les catégories et fournisseurs.');
    }
  }, [loadReferences, showError, setEditingProduit, setShowModal]);

  const handleNewProduit = useCallback(async () => {
    try {
      await loadReferences(true);
      setEditingProduit(null);
      setShowModal(true);
    } catch (err: any) {
      showError('Erreur', err?.message || 'Impossible de charger les catégories et fournisseurs.');
    }
  }, [loadReferences, showError, setEditingProduit, setShowModal]);

  const handleSubmitProduit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const code = String(fd.get('code') || '').trim();
    const nom = String(fd.get('nom') || '').trim();
    const description = String(fd.get('description') || '').trim();
    const categorieRaw = String(fd.get('categorie_id') || '');
    const fournisseurRaw = String(fd.get('fournisseur_id') || '');
    const prixAchat = Number(fd.get('prix_achat') || 0);
    const prixVente = Number(fd.get('prix_vente') || 0);
    const quantiteStock = Number(fd.get('quantite_stock') || 0);
    const quantiteMinimale = Number(fd.get('quantite_minimale') || 5);
    const unite = String(fd.get('unite') || 'pièce').trim();
    const status = String(fd.get('status') || 'actif').trim();
    const tvaRateRaw = fd.get('tva_rate');
    const tvaRate = (tvaRateRaw !== null && tvaRateRaw !== undefined && tvaRateRaw !== '') ? Number(tvaRateRaw) : 0.2;
    const categorieId = categorieRaw ? Number(categorieRaw) : null;
    const fournisseurId = fournisseurRaw ? Number(fournisseurRaw) : null;

    // ⭐ Ny validation dia mampiseho ErrorModal AMBONY noho ny ProduitsModalForm
    if (!nom) { showError('Champ requis', 'Le nom est obligatoire.'); return; }
    if (!code) { showError('Champ requis', 'Le code est obligatoire.'); return; }
    if (!Number.isFinite(prixVente) || prixVente <= 0) { showError('Valeur invalide', 'Prix de vente > 0.'); return; }

    const data = {
      code, nom, description,
      categorie_id: Number.isInteger(categorieId) ? categorieId : null,
      fournisseur_id: Number.isInteger(fournisseurId) ? fournisseurId : null,
      prix_achat: Number.isFinite(prixAchat) ? prixAchat : 0,
      prix_vente: prixVente,
      quantite_stock: Math.max(0, quantiteStock),
      quantite_minimale: Math.max(0, quantiteMinimale),
      unite: unite || 'pièce',
      status: status || 'actif',
      tva_rate: tvaRate,
    };
    try {
      if (editingProduit) {
        await updateProduit(Number(editingProduit.id), data);
        showSuccess('Produit modifié', `"${data.nom}" mis à jour.`);
      } else {
        await createProduit(data);
        showSuccess('Produit créé', `"${data.nom}" ajouté.`);
      }
      setShowModal(false);
      setEditingProduit(null);
      await loadData();
      await fetchReelStats();
    } catch (err: any) {
      // ⭐ Rehefa misy erreur, dia aseho ny ErrorModal AMBONY
      showError('Erreur sauvegarde', err?.message || 'Impossible de sauvegarder le produit.');
    }
  }, [editingProduit, createProduit, updateProduit, showError, showSuccess, loadData, fetchReelStats, setShowModal, setEditingProduit]);

  // ===== PAGINATION =====
  const safeTotalItems = Number.isFinite(Number(totalItems)) ? Number(totalItems) : 0;
  const safeTotalPages = Number.isFinite(Number(totalPages)) ? Math.max(1, Number(totalPages)) : 1;

  const handlePageChange = useCallback((page: number) => {
    const nextPage = Math.max(1, Math.min(Number(page) || 1, safeTotalPages));
    if (nextPage === currentPage) return;
    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, setCurrentPage, safeTotalPages]);

  // ===== FILTERS =====
  const hasActiveFilters = Boolean(
    filters.searchTerm || filters.filterCategorie || filters.filterStatus ||
    filters.prixMin || filters.prixMax || filters.dateFrom || filters.dateTo
  );

  const handleSearchChange = useCallback((v: string) => {
    setFilters(prev => ({ ...prev, searchTerm: v }));
    setCurrentPage(1);
  }, [setFilters, setCurrentPage]);

  const handleResetFilters = useCallback(() => {
    setFilters({ searchTerm: '', filterCategorie: '', filterStatus: '', prixMin: '', prixMax: '', dateFrom: '', dateTo: '' });
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [setFilters, setCurrentPage, setSelectedIds]);

  const globalStats = useMemo(() => ({
    total: reelStats.totalItems,
    actifs: reelStats.actifs,
    rupture: reelStats.rupture,
    alerte: reelStats.alertes,
    valeurTotale: reelStats.totalValeur,
    totalStock: reelStats.totalStock,
  }), [reelStats]);

  const hasActiveFilter = useMemo(() => Boolean(
    filters.searchTerm ||
    filters.filterCategorie ||
    (filters.filterStatus && filters.filterStatus !== 'Tous') ||
    filters.prixMin ||
    filters.prixMax ||
    filters.dateFrom ||
    filters.dateTo
  ), [filters]);

  // ===== MODAL TITLES =====
  const deleteModalTitle = deleteTarget?.type === 'bulk' ? 'Suppression en lot' : 'Suppression du produit';
  const deleteModalMessage = deleteTarget?.type === 'bulk'
    ? `Supprimer ${deleteTarget.ids.length} produit(s) ?`
    : `Supprimer "${deleteTarget?.produit?.nom || ''}" ?`;

  return (
    <div className="min-h-screen w-full transition-colors duration-300" style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">
        <ProduitsHeader
          onAddProduit={handleNewProduit}
          onOpenStats={() => {}}
          onExport={handleExport}
          refreshing={refreshing}
          onRefresh={loadData}
          totalItems={totalItems}
        />
        <ProduitsStats
          totalItems={reelStats.totalItems}
          totalStock={reelStats.totalStock}
          alertes={reelStats.alertes}
          totalValeur={reelStats.totalValeur}
          refreshing={refreshing}
        />

        <ProduitsSearchBar
          searchTerm={filters.searchTerm}
          onSearchChange={handleSearchChange}
          sortOption={sortOption}
          onSortChange={(v) => { setSortOption(v); setCurrentPage(1); }}
          filterCategorie={filters.filterCategorie}
          onFilterCategorieChange={(v) => { setFilters(prev => ({ ...prev, filterCategorie: v })); setCurrentPage(1); }}
          filterStatus={filters.filterStatus}
          onFilterStatusChange={(v) => { setFilters(prev => ({ ...prev, filterStatus: v })); setCurrentPage(1); }}
          categories={categories}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <section
          className="relative overflow-hidden rounded-2xl border transition-all duration-300"
          style={{
            background: isDark ? '#0F172A' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
            boxShadow: isDark
              ? '0 4px 24px -4px rgba(0,0,0,0.35)'
              : '0 4px 20px -4px rgba(79,70,229,0.08)',
          }}
        >
          {refreshing && (
            <div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent">
              <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" />
            </div>
          )}
          {loading && produits.length === 0 ? (
            <ProduitsSkeleton isDark={isDark} />
          ) : (
            <ProduitsTable
              produits={produits}
              onView={handleViewProduit}
              onEdit={handleEditProduit}
              onDelete={handleDeleteClick}
              onAdd={handleNewProduit}
              onNewCommande={handleNewCommande}
              getStockLevel={getStockLevel}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              totalStats={{
                total: reelStats.totalItems,
                rupture: reelStats.rupture,
                alerte: reelStats.alertes,
                valeur_totale: reelStats.totalValeur,
              }}
              totalItems={safeTotalItems}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAllLocal}
              onSelectOne={handleSelectOne}
              onBulkDelete={handleBulkDelete}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              globalStats={globalStats}
              hasActiveFilter={hasActiveFilter}
            />
          )}
        </section>

        {!loading && safeTotalItems > 0 && (
          <div
            className="flex items-center justify-between rounded-2xl border px-3 py-2.5 transition-all duration-300"
            style={{
              background: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
              boxShadow: isDark
                ? '0 2px 12px -2px rgba(0,0,0,0.25)'
                : '0 2px 10px -2px rgba(79,70,229,0.06)',
            }}
          >
            <ProduitsPagination
              currentPage={currentPage}
              totalPages={safeTotalPages}
              totalItems={safeTotalItems}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        <ProduitsModalForm
          isOpen={showModal}
          onClose={handleCloseProductModal}
          onSubmit={handleSubmitProduit}
          editingProduit={editingProduit}
          categories={categories}
          fournisseurs={fournisseurs}
          generateCode={generateCode}
          isDark={isDark}
        />

        {showViewModal && selectedProduit && (
          <ProduitsViewModal
            produit={selectedProduit}
            onClose={() => setShowViewModal(false)}
            onEdit={() => { setShowViewModal(false); handleEditProduit(selectedProduit); }}
            onNewCommande={() => { setShowViewModal(false); handleNewCommande(selectedProduit); }}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            isDark={isDark}
          />
        )}

        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={closeDeleteModal}
          onConfirm={() => deleteTarget?.type === 'bulk' ? handleConfirmBulkDelete() : handleConfirmSingleDelete()}
          title={deleteModalTitle}
          message={deleteModalMessage}
          confirmText="Supprimer"
          cancelText="Annuler"
          confirmColor="red"
          isDark={isDark}
        />

        <ConfirmModal
          isOpen={showBulkStatusModal}
          onClose={closeBulkStatusModal}
          onConfirm={handleConfirmBulkStatusUpdate}
          title="Mise à jour en lot"
          message={`Changer ${bulkStatusData?.ids?.length || 0} produit(s) en "${bulkStatusData?.newStatus === 'actif' ? 'Actif' : 'Inactif'}" ?`}
          confirmText="Confirmer"
          cancelText="Annuler"
          confirmColor="green"
          isDark={isDark}
        />

        <CommandesModalForm
          isOpen={showCommandeModal}
          onClose={() => { setShowCommandeModal(false); handleClearPanierCommande(); }}
          onSubmit={handleSubmitCommande}
          clients={commandeClients}
          produits={commandeProduits}
          selectedClientId={commandeSelectedClientId}
          onClientChange={setCommandeSelectedClientId}
          selectedProduits={commandeSelectedProduits}
          onAddProduit={handleAddProduitCommande}
          onUpdateQuantite={handleUpdateQuantiteCommande}
          onRemoveProduit={handleRemoveProduitCommande}
          onClearPanier={handleClearPanierCommande}
          isDark={isDark}
          montantPaye={montantPayeCommande}
          onMontantPayeChange={setMontantPayeCommande}
        />

        {/* ⭐⭐⭐ SUCCESS MODAL — zIndex AMBONY ⭐⭐⭐ */}
        <SuccessModal
          isOpen={showSuccessModalLocal}
          onClose={() => setShowSuccessModalLocal(false)}
          title={successTitleLocal}
          message={successMessageLocal}
          buttonText="OK"
          autoCloseDelay={3000}
          zIndex={NOTIFICATION_Z_INDEX}
        />

        {/* ⭐⭐⭐ ERROR MODAL — zIndex AMBONY (ambony noho ny ProduitsModalForm) ⭐⭐⭐ */}
        <ErrorModal
          isOpen={showErrorModalLocal}
          onClose={() => setShowErrorModalLocal(false)}
          title={errorTitleLocal}
          message={errorMessageLocal}
          buttonText="OK"
          autoCloseDelay={4000}
          zIndex={NOTIFICATION_Z_INDEX}
        />
      </div>
    </div>
  );
};

export default Produits;