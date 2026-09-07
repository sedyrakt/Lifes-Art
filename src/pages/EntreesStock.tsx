
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Package } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import EntreesHeader from '../components/entrees/EntreesHeader';
import EntreesStats from '../components/entrees/EntreesStats';
import EntreesSearchBar from '../components/entrees/EntreesSearchBar';
import EntreesTable from '../components/entrees/EntreesTable';
import EntreesPagination from '../components/entrees/EntreesPagination';
import EntreesModalForm from '../components/entrees/EntreesModalForm';
import ConfirmModal from '../components/common/ConfirmModal';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';
import { Entree, ITEMS_PER_PAGE } from '../types/EntreesTypes';

const EntreesStock: React.FC = () => {
  const { isDark } = useTheme();

  const [produits, setProduits] = useState<any[]>([]);
  const [entrees, setEntrees] = useState<Entree[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<number[] | null>(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [produitsRes, entreesRes] = await Promise.all([
        window.api.products.getAll({ limit: 500, status: 'actif' }),
        window.api.stock.getEntrees({ limit: 500 })
      ]);
      if (produitsRes?.success) {
        const produitsData = produitsRes.data || [];
        setProduits(produitsData);
      }
      if (entreesRes?.success) setEntrees(entreesRes.data || []);
      if (!produitsRes?.success) throw new Error(produitsRes?.error || 'Erreur produits');
      if (!entreesRes?.success) throw new Error(entreesRes?.error || 'Erreur entrees');
    } catch (error: any) {
      setErrorMessage(error.message || 'Erreur chargement');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredEntrees = useMemo(() => {
    const term = searchInput.toLowerCase().trim();
    if (!term) return entrees;
    return entrees.filter(entree => 
      entree.reference?.toLowerCase().includes(term) || 
      entree.produit_nom?.toLowerCase().includes(term) ||
      entree.observation?.toLowerCase().includes(term)
    );
  }, [entrees, searchInput]);

  const totalPages = Math.max(1, Math.ceil(filteredEntrees.length / ITEMS_PER_PAGE));
  const pagedEntrees = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntrees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEntrees, currentPage]);

  const stats = useMemo(() => ({
    totalEntries: filteredEntrees.length,
    totalQty: filteredEntrees.reduce((acc, item) => acc + Number(item.quantite || 0), 0),
    totalValue: filteredEntrees.reduce((acc, item) => acc + (Number(item.quantite || 0) * Number(item.prix_unitaire || 0)), 0),
    uniqueProducts: new Set(filteredEntrees.map(item => item.produit_id)).size
  }), [filteredEntrees]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(pagedEntrees.map(item => item.id)) : new Set());
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) setBulkDeleteTarget(Array.from(selectedIds));
  };

  const handleConfirmBulkDelete = async () => {
    if (!bulkDeleteTarget) return;
    try {
      await window.api.stock.bulkDeleteEntrees(bulkDeleteTarget);
      setSelectedIds(new Set());
      setShowSuccessModal(true);
      await loadData(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Erreur suppression');
      setShowErrorModal(true);
    } finally {
      setBulkDeleteTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await window.api.stock.bulkDeleteEntrees([deleteTarget]);
      setShowSuccessModal(true);
      await loadData(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Erreur suppression');
      setShowErrorModal(true);
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      await window.api.stock.createEntree(data);
      setShowSuccessModal(true);
      setShowFormModal(false);
      await loadData(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Erreur enregistrement');
      setShowErrorModal(true);
    }
  };

  const renderSkeleton = () => {
    const base = isDark ? 'bg-white/[0.06]' : 'bg-slate-200';
    const border = isDark ? 'border-white/[0.08]' : 'border-slate-200';
    return (
      <div className="min-h-[500px] w-full p-5" style={{ background: isDark ? '#0F172A' : '#FFFFFF' }}>
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


  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.10)' : '#E2E8F0';
  const shadow = isDark ? '0 4px 24px -4px rgba(0,0,0,0.35)' : '0 4px 20px -4px rgba(79,70,229,0.08)';

  return (
    <div className="min-h-full w-full transition-colors duration-300 bg-white dark:bg-[#0F172A]">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 px-2 py-5 sm:px-3 lg:px-5">
        <EntreesHeader 
          onAddEntree={() => setShowFormModal(true)} 
          refreshing={refreshing} 
          onRefresh={() => loadData(true)} 
          totalItems={stats.totalEntries}
        />

        <EntreesStats 
          totalEntries={stats.totalEntries} 
          totalQty={stats.totalQty} 
          totalValue={stats.totalValue} 
          uniqueProducts={stats.uniqueProducts}
        />

        <EntreesSearchBar 
          searchInput={searchInput} 
          onSearchChange={(value) => { setSearchInput(value); setCurrentPage(1); }}
        />

        {loading ? (
          renderSkeleton()
        ) : (
          <section className="relative overflow-hidden rounded-2xl border transition-all duration-300" style={{ background: cardBg, borderColor, boxShadow: shadow }}>
            {refreshing && <div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent"><div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" /></div>}
            
            {pagedEntrees.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-14 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><Package size={26} /></div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Aucune entrée trouvée</h3>
                <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">Cliquez sur "Nouvelle entrée" pour ajouter du stock.</p>
              </div>
            ) : (
              <>
                <EntreesTable 
                  entrees={pagedEntrees} 
                  selectedIds={selectedIds} 
                  onSelectAll={handleSelectAll} 
                  onSelectOne={handleSelectOne} 
                  onDelete={(id) => { setDeleteTarget(id); setShowDeleteModal(true); }} 
                  onBulkDelete={handleBulkDelete} 
                  onClearSelection={() => setSelectedIds(new Set())} 
                />
                <EntreesPagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  totalItems={filteredEntrees.length} 
                  onPageChange={setCurrentPage} 
                />
              </>
            )}
          </section>
        )}
      </div>

      <EntreesModalForm 
        isOpen={showFormModal} 
        onClose={() => setShowFormModal(false)} 
        onSubmit={handleFormSubmit} 
        produits={produits} 
      />

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Succès" message="Opération réussie." buttonText="OK" autoCloseDelay={3000} />
      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} title="Erreur" message={errorMessage} buttonText="OK" autoCloseDelay={4000} />
      
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete} title="Supprimer l'entrée" message="Êtes-vous sûr de vouloir supprimer cette entrée de stock ?" confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />
      <ConfirmModal isOpen={bulkDeleteTarget !== null} onClose={() => setBulkDeleteTarget(null)} onConfirm={handleConfirmBulkDelete} title="Suppression en lot" message={`Supprimer ${bulkDeleteTarget?.length || 0} entrée(s) ?`} confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />
    </div>
  );
};

export default EntreesStock;