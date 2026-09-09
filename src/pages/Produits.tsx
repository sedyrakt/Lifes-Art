// src/pages/Produits.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, Plus } from 'lucide-react';
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

const ProduitsSkeleton = ({ isDark }: { isDark: boolean }) => {
  const base = isDark ? 'bg-white/[0.06]' : 'bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-200';
  return (
    <div className="min-h-[500px] w-full p-5" style={{ background: isDark ? '#0F172A' : '#FFFFFF' }}>
      <div className="space-y-4">
        <div className={`flex items-center gap-4 border-b pb-4 ${border}`}>
          {[...Array(7)].map((_, i) => <div key={i} className={`h-4 w-${i === 0 ? 8 : i === 1 ? 24 : i === 2 ? 32 : i === 3 ? 20 : i === 4 ? 24 : i === 5 ? 20 : 28} rounded ${base} animate-pulse`} />)}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`flex items-center gap-4 py-3 ${border}`}>
            {[...Array(7)].map((_, j) => <div key={j} className={`h-4 w-${j === 0 ? 8 : j === 1 ? 24 : j === 2 ? 32 : j === 3 ? 20 : j === 4 ? 24 : j === 5 ? 20 : 28} rounded ${base} animate-pulse`} />)}
          </div>
        ))}
      </div>
    </div>
  );
};

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

  // ===== STATE HO AN'NY COMMANDE MODAL (local, tsy mampiasa useCommandesData) =====
  const [commandeClients, setCommandeClients] = useState<any[]>([]);
  const [commandeProduits, setCommandeProduits] = useState<any[]>([]);
  const [commandeSelectedClientId, setCommandeSelectedClientId] = useState<number | null>(null);
  const [commandeSelectedProduits, setCommandeSelectedProduits] = useState<{ id: number; quantite: number; prix_unitaire?: number }[]>([]);
  const [showCommandeModal, setShowCommandeModal] = useState(false);
  const [montantPayeCommande, setMontantPayeCommande] = useState(0);
  const [commandeLoading, setCommandeLoading] = useState(false);

  // ===== STATE PRODUIT =====
  const [reelStats, setReelStats] = useState({ totalItems: 0, totalStock: 0, alertes: 0, totalValeur: 0 });
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState<any>(null);
  const [editingProduit, setEditingProduit] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [bulkStatusData, setBulkStatusData] = useState<{ ids: number[]; newStatus: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // ===== CALLBACKS =====
  const showSuccess = useCallback((t: string, m: string) => {
    setSuccessTitle(t); setSuccessMessage(m); setShowSuccessModal(true);
  }, []);
  const showError = useCallback((t: string, m: string) => {
    setErrorTitle(t); setErrorMessage(m); setShowErrorModal(true);
  }, []);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ===== FETCH STATS =====
  const fetchReelStats = useCallback(async () => {
    try {
      const data = await getStats();
      if (!data) return;
      setReelStats({
        totalItems: Number(data.total) || 0,
        totalStock: Number(data.totalStock) || 0,
        alertes: Number(data.alerte) || 0,
        totalValeur: Number(data.valeur_totale) || 0
      });
    } catch (err) { console.error('❌ [Produits] Erreur stats:', err); }
  }, [getStats]);

  useEffect(() => { if (!loading) fetchReelStats(); }, [loading, fetchReelStats]);

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

  // ===== HANDLE SELECT ALL / ONE =====
  const handleSelectAll = useCallback((checked: boolean) => {
    if (!checked) { clearSelection(); return; }
    const ids = produits.map((p: any) => Number(p.id)).filter((id: number) => Number.isInteger(id) && id > 0);
    setSelectedIds(new Set(ids));
  }, [produits, clearSelection]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => { const n = new Set(prev); if (checked) n.add(id); else n.delete(id); return n; });
  }, []);

  // ===== HANDLE BULK =====
  const handleBulkUpdateStatus = useCallback((ids: number[], newStatus: string) => {
    const v = ids.map(Number).filter(id => Number.isInteger(id) && id > 0);
    if (!v.length) { showError('Sélection invalide', 'Aucun produit valide.'); return; }
    setBulkStatusData({ ids: v, newStatus });
    setShowBulkStatusModal(true);
  }, [showError]);

  const handleConfirmBulkStatusUpdate = useCallback(async () => {
    if (!bulkStatusData) return;
    try {
      await bulkUpdateStatus(bulkStatusData.ids, bulkStatusData.newStatus);
      clearSelection();
      showSuccess('Mise à jour terminée', `${bulkStatusData.ids.length} produit(s) en statut "${bulkStatusData.newStatus === 'actif' ? 'Actif' : 'Inactif'}".`);
      await loadData(); await fetchReelStats();
    } catch (err: any) {
      showError('Erreur', err?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setShowBulkStatusModal(false); setBulkStatusData(null);
    }
  }, [bulkStatusData, bulkUpdateStatus, clearSelection, showError, showSuccess, loadData, fetchReelStats]);

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setDeleteTarget({ type: 'bulk', ids });
    setShowDeleteModal(true);
  }, [selectedIds]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!deleteTarget || deleteTarget.type !== 'bulk') return;
    try {
      await bulkDelete(deleteTarget.ids);
      clearSelection();
      showSuccess('Suppression terminée', `${deleteTarget.ids.length} produit(s) supprimé(s).`);
      await loadData(); await fetchReelStats();
    } catch (err: any) {
      showError('Erreur', err?.message || 'Erreur lors de la suppression.');
    } finally {
      setShowDeleteModal(false); setDeleteTarget(null);
    }
  }, [deleteTarget, bulkDelete, clearSelection, showError, showSuccess, loadData, fetchReelStats]);

  // ===== HANDLE COMMANDE MODAL =====
  const loadCommandeReferences = useCallback(async () => {
    setCommandeLoading(true);
    try {
      const [clientsRes, produitsRes] = await Promise.all([
        window.api.clients.getAll({ limit: 1000 }),
        window.api.products.getAll({ status: 'actif', limit: 500 }),
      ]);
      if (clientsRes?.success) setCommandeClients(clientsRes.data || []);
      if (produitsRes?.success) setCommandeProduits(produitsRes.data || []);
    } catch (err) {
      console.error('❌ [Produits] Erreur chargement commande refs:', err);
      showError('Erreur', 'Impossible de charger les clients et produits.');
    } finally {
      setCommandeLoading(false);
    }
  }, [showError]);

  const handleNewCommande = useCallback(async (produit: any) => {
    if (!produit?.id) return;
    try {
      await loadCommandeReferences();
      // Ajouter le produit initial
      setCommandeSelectedProduits([{ id: Number(produit.id), quantite: 1, prix_unitaire: Number(produit.prix_vente) || 0 }]);
      setMontantPayeCommande(0);
      setCommandeSelectedClientId(null);
      setShowCommandeModal(true);
    } catch (err: any) {
      showError('Erreur de chargement', err?.message || 'Impossible de charger les clients et produits.');
    }
  }, [loadCommandeReferences, showError]);

  // Handlers pour le modal commande
  const handleAddProduitCommande = useCallback((id: number, quantite: number, prix_unitaire?: number) => {
    setCommandeSelectedProduits(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, quantite: item.quantite + quantite } : item);
      }
      return [...prev, { id, quantite, prix_unitaire: prix_unitaire || 0 }];
    });
  }, []);

  const handleUpdateQuantiteCommande = useCallback((id: number, quantite: number) => {
    setCommandeSelectedProduits(prev => prev.map(item => item.id === id ? { ...item, quantite } : item));
  }, []);

  const handleRemoveProduitCommande = useCallback((id: number) => {
    setCommandeSelectedProduits(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleClearPanierCommande = useCallback(() => {
    setCommandeSelectedProduits([]);
    setCommandeSelectedClientId(null);
    setMontantPayeCommande(0);
  }, []);

  const handleSubmitCommande = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commandeSelectedClientId) { showError('Client requis', 'Sélectionnez un client.'); return; }
    if (!commandeSelectedProduits.length) { showError('Panier vide', 'Ajoutez au moins un produit.'); return; }

    const client = commandeClients.find(c => Number(c.id) === Number(commandeSelectedClientId));
    if (!client) { showError('Client introuvable', 'Client non trouvé.'); return; }

    let totalHT = 0;
    let totalTVA = 0;
    const productDetails = commandeSelectedProduits.map(item => {
      const produit = commandeProduits.find(p => Number(p.id) === Number(item.id));
      if (!produit) throw new Error(`Produit ${item.id} non trouvé`);
      const quantity = Number(item.quantite);
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Quantité invalide pour ${produit.nom}`);
      if (quantity > Number(produit.quantite_stock || 0)) throw new Error(`Stock insuffisant pour ${produit.nom}`);
      const lineTotal = quantity * Number(produit.prix_vente || 0);
      totalHT += lineTotal;
      const rate = (produit.tva_rate !== undefined && produit.tva_rate !== null && produit.tva_rate !== '') ? Number(produit.tva_rate) : 0.2;
      totalTVA += lineTotal * rate;
      return { id: produit.id, name: produit.nom, price: Number(produit.prix_vente || 0), quantity, tva_rate: rate };
    });

    const totalTTC = totalHT + totalTVA;
    const montantPaye = Math.max(0, Math.min(totalTTC, Number(montantPayeCommande || 0)));
    const statutPaiement = montantPaye <= 0 ? 'Non payé' : montantPaye >= totalTTC ? 'Payé' : 'Partiel';
    const montantRestant = Math.max(0, totalTTC - montantPaye);

    const payload = {
      client_nom: client.nom,
      client_id: Number(commandeSelectedClientId),
      products: productDetails,
      total_ht: totalHT,
      total_ttc: totalTTC,
      statut_paiement: statutPaiement,
      montant_paye: montantPaye,
      montant_restant: montantRestant,
    };

    try {
      const result = await window.api.orders.create(payload);
      if (!result?.success) throw new Error(result?.error || 'Erreur création commande');
      showSuccess('Commande créée', 'Commande enregistrée.');
      setShowCommandeModal(false);
      handleClearPanierCommande();
    } catch (err: any) {
      showError('Erreur', err?.message || 'Impossible de créer la commande.');
    }
  }, [commandeSelectedClientId, commandeSelectedProduits, commandeClients, commandeProduits, montantPayeCommande, showError, showSuccess, handleClearPanierCommande]);

  // ===== HANDLE PRODUIT CRUD =====
  const handleViewProduit = useCallback(async (id: number) => {
    if (!Number.isInteger(id) || id <= 0) return;
    try {
      const produit = await getProduitById(id);
      if (!produit) throw new Error('Produit introuvable.');
      setSelectedProduit(produit); setShowViewModal(true);
    } catch (err: any) { showError('Erreur chargement', err?.message || 'Impossible de charger le produit.'); }
  }, [getProduitById, showError]);

  const handleEditProduit = useCallback(async (produit: any) => {
    if (!produit?.id) return;
    try {
      await loadReferences(true);
      setEditingProduit(produit);
      setShowModal(true);
    } catch (err: any) { showError('Erreur', err?.message || 'Impossible de charger les catégories et fournisseurs.'); }
  }, [loadReferences, showError]);

  const handleNewProduit = useCallback(async () => {
    try {
      await loadReferences(true);
      setEditingProduit(null);
      setShowModal(true);
    } catch (err: any) { showError('Erreur', err?.message || 'Impossible de charger les catégories et fournisseurs.'); }
  }, [loadReferences, showError]);

  const handleDeleteClick = useCallback((produit: any) => {
    if (!produit?.id) return;
    setDeleteTarget({ type: 'single', produit });
    setShowDeleteModal(true);
  }, []);

  const handleConfirmSingleDelete = useCallback(async () => {
    if (!deleteTarget || deleteTarget.type !== 'single') return;
    const produit = deleteTarget.produit;
    if (!produit?.id) { setShowDeleteModal(false); setDeleteTarget(null); return; }
    try {
      await deleteProduit(Number(produit.id));
      showSuccess('Produit supprimé', `"${produit.nom}" supprimé.`);
      await loadData(); await fetchReelStats();
    } catch (err: any) { showError('Erreur', err?.message || 'Erreur suppression produit.'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  }, [deleteTarget, deleteProduit, showError, showSuccess, loadData, fetchReelStats]);

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
      tva_rate: tvaRate
    };
    try {
      if (editingProduit) { await updateProduit(Number(editingProduit.id), data); showSuccess('Produit modifié', `"${data.nom}" mis à jour.`); }
      else { await createProduit(data); showSuccess('Produit créé', `"${data.nom}" ajouté.`); }
      setShowModal(false); setEditingProduit(null);
      await loadData(); await fetchReelStats();
    } catch (err: any) { showError('Erreur sauvegarde', err?.message || 'Impossible de sauvegarder le produit.'); }
  }, [editingProduit, createProduit, updateProduit, showError, showSuccess, loadData, fetchReelStats]);

  const getStockLevel = useCallback((stock: number, minimum: number) => {
    const s = Number(stock) || 0, m = Number(minimum) || 0;
    const ratio = m > 0 ? s / m : 999;
    if (ratio <= 1) return { level: 'critique', color: 'text-danger-500', bg: 'bg-danger-500' };
    if (ratio <= 2) return { level: 'faible', color: 'text-warning-500', bg: 'bg-warning-500' };
    if (ratio <= 5) return { level: 'moyen', color: 'text-brand-500', bg: 'bg-brand-500' };
    return { level: 'élevé', color: 'text-success-500', bg: 'bg-success-500' };
  }, []);

  const getStatusColor = useCallback((status: string) =>
    status === 'actif' ? 'bg-success-50 dark:bg-success-900/30 text-success-800 dark:text-success-300 border border-success-200 dark:border-success-800' : 'bg-danger-50 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300 border border-danger-200 dark:border-danger-800', []);

  const getStatusIcon = useCallback((status: string) =>
    status === 'actif' ? <CheckCircle className="h-4 w-4 text-success-600 dark:text-success-400" /> : <XCircle className="h-4 w-4 text-danger-600 dark:text-danger-400" />, []);

  const safeTotalItems = Number.isFinite(Number(totalItems)) ? Number(totalItems) : 0;
  const safeTotalPages = Number.isFinite(Number(totalPages)) ? Math.max(1, Number(totalPages)) : 1;

  const handlePageChange = useCallback((page: number) => {
    const nextPage = Math.max(1, Math.min(Number(page) || 1, safeTotalPages));
    if (nextPage === currentPage) return;
    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, setCurrentPage, safeTotalPages]);

  const hasActiveFilters = Boolean(filters.searchTerm || filters.filterCategorie || filters.filterStatus || filters.prixMin || filters.prixMax || filters.dateFrom || filters.dateTo);

  const handleSearchChange = useCallback((v: string) => {
    setFilters(prev => ({ ...prev, searchTerm: v }));
    setCurrentPage(1);
  }, [setFilters, setCurrentPage]);

  const handleResetFilters = useCallback(() => {
    setFilters({ searchTerm: '', filterCategorie: '', filterStatus: '', prixMin: '', prixMax: '', dateFrom: '', dateTo: '' });
    setCurrentPage(1);
    clearSelection();
  }, [setFilters, setCurrentPage, clearSelection]);

  const deleteModalTitle = deleteTarget?.type === 'bulk' ? 'Suppression en lot' : 'Suppression du produit';
  const deleteModalMessage = deleteTarget?.type === 'bulk' ? `Supprimer ${deleteTarget.ids.length} produit(s) ?` : `Supprimer "${deleteTarget?.produit?.nom || ''}" ?`;

  const handleCloseProductModal = useCallback(() => {
    setShowModal(false); setEditingProduit(null);
  }, []);

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
        <ProduitsStats totalItems={reelStats.totalItems} totalStock={reelStats.totalStock} alertes={reelStats.alertes} totalValeur={reelStats.totalValeur} refreshing={refreshing} />
        
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

        <section className="relative overflow-hidden rounded-2xl border transition-all duration-300" style={{ background: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', boxShadow: isDark ? '0 4px 24px -4px rgba(0,0,0,0.35)' : '0 4px 20px -4px rgba(79,70,229,0.08)' }}>
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
              totalStats={{ total: reelStats.totalItems, rupture: 0, alerte: reelStats.alertes, valeur_totale: reelStats.totalValeur }}
              totalItems={safeTotalItems}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onBulkDelete={handleBulkDelete}
              onBulkUpdateStatus={handleBulkUpdateStatus}
            />
          )}
        </section>

        {!loading && safeTotalItems > 0 && (
          <div className="flex items-center justify-between rounded-2xl border px-3 py-2.5 transition-all duration-300" style={{ background: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', boxShadow: isDark ? '0 2px 12px -2px rgba(0,0,0,0.25)' : '0 2px 10px -2px rgba(79,70,229,0.06)' }}>
            <ProduitsPagination currentPage={currentPage} totalPages={safeTotalPages} totalItems={safeTotalItems} onPageChange={handlePageChange} />
          </div>
        )}

        <ProduitsModalForm isOpen={showModal} onClose={handleCloseProductModal} onSubmit={handleSubmitProduit} editingProduit={editingProduit} categories={categories} fournisseurs={fournisseurs} generateCode={generateCode} isDark={isDark} />
        {showViewModal && selectedProduit && (
          <ProduitsViewModal produit={selectedProduit} onClose={() => setShowViewModal(false)} onEdit={() => { setShowViewModal(false); handleEditProduit(selectedProduit); }} onNewCommande={() => { setShowViewModal(false); handleNewCommande(selectedProduit); }} getStatusColor={getStatusColor} getStatusIcon={getStatusIcon} isDark={isDark} />
        )}
        <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={() => deleteTarget?.type === 'bulk' ? handleConfirmBulkDelete() : handleConfirmSingleDelete()} title={deleteModalTitle} message={deleteModalMessage} confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />
        <ConfirmModal isOpen={showBulkStatusModal} onClose={() => { setShowBulkStatusModal(false); setBulkStatusData(null); }} onConfirm={handleConfirmBulkStatusUpdate} title="Mise à jour en lot" message={`Changer ${bulkStatusData?.ids?.length || 0} produit(s) en "${bulkStatusData?.newStatus === 'actif' ? 'Actif' : 'Inactif'}" ?`} confirmText="Confirmer" cancelText="Annuler" confirmColor="green" isDark={isDark} />
        <CommandesModalForm isOpen={showCommandeModal} onClose={() => { setShowCommandeModal(false); handleClearPanierCommande(); }} onSubmit={handleSubmitCommande} clients={commandeClients} produits={commandeProduits} selectedClientId={commandeSelectedClientId} onClientChange={setCommandeSelectedClientId} selectedProduits={commandeSelectedProduits} onAddProduit={handleAddProduitCommande} onUpdateQuantite={handleUpdateQuantiteCommande} onRemoveProduit={handleRemoveProduitCommande} onClearPanier={handleClearPanierCommande} isDark={isDark} montantPaye={montantPayeCommande} onMontantPayeChange={setMontantPayeCommande} />
        <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title={successTitle} message={successMessage} buttonText="OK" autoCloseDelay={3000} />
        <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} title={errorTitle} message={errorMessage} buttonText="OK" autoCloseDelay={4000} />
      </div>
    </div>
  );
};

export default Produits;