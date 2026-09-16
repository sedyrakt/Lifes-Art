// src/pages/Categories.tsx
// ⭐ FIX: Hooks filaharana — useState rehetra alohan'ny useEffect/useCallback/useMemo
// ⭐ NOUVEAU: Skeleton loader full-page (tsoloana ny skeleton table kely)

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useCategoriesData, ExportPeriod } from '../hooks/useCategoriesData';
import CategoriesHeader from '../components/categories/CategoriesHeader';
import CategoriesStats from '../components/categories/CategoriesStats';
import CategoriesTable from '../components/categories/CategoriesTable';
import CategoriesPagination from '../components/categories/CategoriesPagination';
import CategoriesModalForm from '../components/categories/CategoriesModalForm';
import CategoriesViewModal from '../components/categories/CategoriesViewModal';
import CategoriesSearchBar from '../components/categories/CategoriesSearchBar';
import ConfirmModal from '../components/common/ConfirmModal';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';

// ============================================================
// ⭐ SKELETON LOADER FULL-PAGE
// ============================================================

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md ${className}`} />
);

const CategoriesPageSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
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

        {/* ⭐ STATS CARDS SKELETON (3 cards) */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`rounded-xl border-[0.5px] p-4 ${surfaceBg} ${borderColor}`}>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
                  <SkeletonBlock className={`h-6 w-28 ${cardBg}`} />
                </div>
                <SkeletonBlock className={`h-10 w-10 rounded-lg ${cardBg}`} />
              </div>
              <div className="mt-3">
                <SkeletonBlock className={`h-2 w-full rounded-full ${cardBg}`} />
              </div>
            </div>
          ))}
        </div>

        {/* ⭐ SEARCHBAR SKELETON */}
        <div className={`flex flex-wrap items-center gap-2 rounded-xl border-[0.5px] p-3 ${surfaceBg} ${borderColor}`}>
          <SkeletonBlock className={`h-10 flex-1 min-w-[200px] rounded-lg ${cardBg}`} />
          <SkeletonBlock className={`h-10 w-[150px] rounded-lg ${cardBg}`} />
        </div>

        {/* ⭐ TABLE SKELETON */}
        <section className={`relative overflow-hidden rounded-2xl border-[0.5px] ${surfaceBg} ${borderColor}`}>
          {/* Table header */}
          <div className={`flex items-center gap-3 border-b px-3 py-2.5 ${rowBorderColor}`}>
            <SkeletonBlock className={`h-4 w-4 rounded ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-24 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-32 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
            <div className="ml-auto">
              <SkeletonBlock className={`h-3 w-16 ${cardBg}`} />
            </div>
          </div>

          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`flex items-center gap-3 border-b px-3 py-3 ${rowBorderColor}`}>
              <SkeletonBlock className={`h-4 w-4 rounded ${cardBg}`} />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className={`h-3.5 w-40 ${cardBg}`} />
                <SkeletonBlock className={`h-2.5 w-20 ${cardBg}`} />
              </div>
              <SkeletonBlock className={`h-3.5 w-48 ${cardBg}`} />
              <SkeletonBlock className={`h-5 w-20 rounded ${cardBg}`} />
              <SkeletonBlock className={`h-3.5 w-20 ${cardBg}`} />
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

const Categories: React.FC = () => {
  // ═══════════════════════════════════════════════════════════
  // 1️⃣ HOOKS EXTERNES (useTheme + useCategoriesData)
  // ═══════════════════════════════════════════════════════════
  const { isDark } = useTheme();
  const {
    categories, loading, refreshing, totalItems, totalPages, currentPage,
    setCurrentPage, searchTerm, setSearchTerm, sortOption, setSortOption,
    loadData, createCategorie, updateCategorie, deleteCategorie, bulkDelete,
    getStats,
    getCategoryColor, ITEMS_PER_PAGE,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  } = useCategoriesData();

  // ═══════════════════════════════════════════════════════════
  // 2️⃣ useState REHETRA (filaharana tsy miova)
  // ═══════════════════════════════════════════════════════════
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteTargetIds, setBulkDeleteTargetIds] = useState<number[]>([]);
  const [reelStats, setReelStats] = useState({
    total: 0,
    avecDescription: 0,
    sansDescription: 0,
    totalProduits: 0,
    categoriesVides: 0,
    totalStock: 0,
    valeurStock: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategorie, setSelectedCategorie] = useState<any>(null);
  const [editingCategorie, setEditingCategorie] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // ═══════════════════════════════════════════════════════════
  // 3️⃣ useCallback (filaharana tsy miova)
  // ═══════════════════════════════════════════════════════════
  const showSuccess = useCallback((title: string, message: string) => {
    setSuccessTitle(title);
    setSuccessMessage(message);
    setShowSuccessModal(true);
  }, []);

  const showError = useCallback((title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorModal(true);
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
      showSuccess('Export réussi', `Les catégories ont été exportées en ${format.toUpperCase()} (${period}${period === 'custom' ? ' - ' + customDate : ''}).`);
    } catch (error: any) {
      showError('Erreur export', error?.message || 'Impossible d\'exporter les données.');
    }
  }, [exportToExcel, exportToPDF, exportToCSV, showSuccess, showError]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (!checked) { setSelectedIds(new Set()); return; }
    setSelectedIds(prev => {
      const next = new Set(prev);
      categories.forEach(category => {
        const id = Number(category.id);
        if (Number.isFinite(id) && id > 0) next.add(id);
      });
      return next;
    });
  }, [categories]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback((ids: number[]) => {
    const validIds = ids.map(Number).filter(id => Number.isFinite(id) && id > 0);
    if (!validIds.length) {
      showError('Sélection vide', 'Veuillez sélectionner au moins une catégorie.');
      return;
    }
    setBulkDeleteTargetIds(validIds);
    setShowBulkDeleteModal(true);
  }, [showError]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!bulkDeleteTargetIds.length) return;
    const count = bulkDeleteTargetIds.length;
    try {
      const result = await bulkDelete(bulkDeleteTargetIds);
      const deletedCount = Number(result?.data?.deletedCount || 0);
      const errorCount = Number(result?.data?.errorCount || 0);
      setSelectedIds(new Set());
      if (errorCount > 0 && deletedCount === 0) {
        const firstError = result?.data?.errors?.[0]?.error || 'Impossible de supprimer les catégories.';
        showError('Suppression impossible', firstError);
      } else if (errorCount > 0) {
        showSuccess('Suppression terminée', `${deletedCount} catégorie(s) supprimée(s), ${errorCount} impossible(s) à supprimer.`);
      } else {
        showSuccess('Suppression en lot', `${deletedCount || count} catégorie(s) supprimée(s).`);
      }
      await refreshAll();
    } catch (error: any) {
      showError('Erreur', error?.message || 'Impossible de supprimer les catégories.');
    } finally {
      setShowBulkDeleteModal(false);
      setBulkDeleteTargetIds([]);
    }
  }, [bulkDelete, bulkDeleteTargetIds, showError, showSuccess]);

  const fetchStats = useCallback(async () => {
    if (!window.api?.categories?.getStats) return;
    setStatsLoading(true);
    try {
      const result = await window.api.categories.getStats();
      if (result?.success && result.data) {
        const data = result.data;
        setReelStats({
          total: Number(data.total) || 0,
          avecDescription: Number(data.avecDescription || data.avec_description) || 0,
          sansDescription: Number(data.sansDescription || data.sans_description) || 0,
          totalProduits: Number(data.totalProduits || data.total_produits) || 0,
          categoriesVides: Number(data.categoriesVides || data.categories_vides) || 0,
          totalStock: Number(data.totalStock || data.total_stock) || 0,
          valeurStock: Number(data.valeurStock || data.valeur_stock) || 0,
        });
      }
    } catch (error) {
      console.error('❌ Erreur catégories stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([loadData(), fetchStats()]);
  }, [loadData, fetchStats]);

  const handleOpenAddModal = useCallback(() => {
    setEditingCategorie(null);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingCategorie(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const nom = String(fd.get('nom') || '').trim();
    const description = String(fd.get('description') || '').trim();
    if (!nom) {
      showError('Champ requis', 'Le nom de la catégorie est obligatoire.');
      return;
    }
    try {
      if (editingCategorie) {
        await updateCategorie(editingCategorie.id, { nom, description });
        showSuccess('Catégorie modifiée', `"${nom}" a été mise à jour avec succès.`);
      } else {
        await createCategorie({ nom, description });
        showSuccess('Catégorie ajoutée', `"${nom}" a été ajoutée avec succès.`);
      }
      setShowModal(false);
      setEditingCategorie(null);
      setSelectedIds(new Set());
      await refreshAll();
    } catch (error: any) {
      showError('Erreur', error?.message || 'Une erreur est survenue lors de l\'opération.');
    }
  }, [editingCategorie, createCategorie, updateCategorie, refreshAll, showError, showSuccess]);

  const handleDeleteClick = useCallback((categorie: any) => {
    setDeleteTarget(categorie);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategorie(deleteTarget.id);
      setSelectedIds(prev => {
        const n = new Set(prev);
        n.delete(Number(deleteTarget.id));
        return n;
      });
      showSuccess('Catégorie supprimée', `"${deleteTarget.nom}" a été supprimée avec succès.`);
      await refreshAll();
    } catch (error: any) {
      showError('Suppression impossible', error?.message || 'Impossible de supprimer cette catégorie.');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteCategorie, refreshAll, showError, showSuccess]);

  const handleViewCategorie = useCallback((categorie: any) => {
    setSelectedCategorie(categorie);
    setShowViewModal(true);
  }, []);

  const handleEditCategorie = useCallback((categorie: any) => {
    setEditingCategorie(categorie);
    setShowModal(true);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 4️⃣ useEffect (aorian'ny useCallback)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ═══════════════════════════════════════════════════════════
  // 5️⃣ useMemo (aorian'ny useEffect)
  // ═══════════════════════════════════════════════════════════
  const categoriesWithCounts = useMemo(
    () => categories.map(category => ({ ...category, produits_count: Number((category as any).produits_count || 0) })),
    [categories]
  );

  const tauxCompletion = useMemo(() => {
    if (reelStats.total <= 0) return 0;
    return Math.round((reelStats.avecDescription / reelStats.total) * 100);
  }, [reelStats]);

  const globalStats = useMemo(() => ({
    total: reelStats.total,
    avecDescription: reelStats.avecDescription,
    sansDescription: reelStats.sansDescription,
    totalProduits: reelStats.totalProduits,
    categoriesVides: reelStats.categoriesVides,
    totalStock: reelStats.totalStock,
    valeurStock: reelStats.valeurStock,
  }), [reelStats]);

  const hasActiveFilter = useMemo(() => Boolean(
    searchTerm.trim() ||
    (sortOption && sortOption !== 'Nom (A-Z)')
  ), [searchTerm, sortOption]);

  const hasSearch = searchTerm.trim().length > 0;

  // ═══════════════════════════════════════════════════════════
  // 6️⃣ ⭐ SKELETON FULL-PAGE — alohan'ny render ny page
  // ═══════════════════════════════════════════════════════════
  if (loading && categories.length === 0) {
    return <CategoriesPageSkeleton isDark={isDark} />;
  }

  // ═══════════════════════════════════════════════════════════
  // 7️⃣ RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <main className="min-h-full w-full transition-colors duration-300" style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">
        <CategoriesHeader
          onAddCategorie={handleOpenAddModal}
          onOpenStats={() => {}}
          onExport={handleExport}
          refreshing={refreshing}
          onRefresh={refreshAll}
          totalItems={totalItems}
        />

        <CategoriesStats
          total={reelStats.total || totalItems}
          avecDescription={reelStats.avecDescription}
          tauxCompletion={tauxCompletion}
          categories={categoriesWithCounts}
          totalProduits={reelStats.totalProduits}
          evolutionTotal={0}
          evolutionAvecDescription={0}
          evolutionTauxCompletion={0}
        />

        <CategoriesSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortOption={sortOption}
          onSortChange={setSortOption}
          viewMode="table"
          onViewModeChange={() => {}}
        />

        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_-4px_rgba(79,70,229,0.08)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)]">
          {(refreshing || statsLoading) && (
            <div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent">
              <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" />
            </div>
          )}

          {!loading && categories.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                <Search size={24} />
              </div>
              <h3 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {hasSearch ? 'Aucune catégorie trouvée' : 'Aucune catégorie'}
              </h3>
              <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                {hasSearch ? `Aucun résultat pour "${searchTerm}".` : 'Commencez par créer votre première catégorie.'}
              </p>
              {hasSearch ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-4 text-[13px] font-semibold text-slate-600 transition-all hover:bg-brand-50 dark:border-white/[0.12] dark:text-slate-300 dark:hover:bg-white/[0.06]"
                >
                  <X size={14} /> Effacer la recherche
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl bg-brand-500 px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md"
                >
                  <Plus size={14} /> Nouvelle catégorie
                </button>
              )}
            </div>
          ) : (
            <CategoriesTable
              categories={categoriesWithCounts}
              onView={handleViewCategorie}
              onEdit={handleEditCategorie}
              onDelete={handleDeleteClick}
              onAdd={handleOpenAddModal}
              getCategoryColor={getCategoryColor}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onBulkDelete={handleBulkDelete}
              globalStats={globalStats}
              hasActiveFilter={hasActiveFilter}
            />
          )}
        </section>

        {!loading && totalItems > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_2px_10px_-2px_rgba(79,70,229,0.06)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.25)]">
            <CategoriesPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={page => {
                setSelectedIds(new Set());
                setCurrentPage(page);
              }}
            />
          </div>
        )}
      </div>

      <CategoriesModalForm
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingCategorie={editingCategorie}
        isDark={isDark}
      />

      {showViewModal && selectedCategorie && (
        <CategoriesViewModal
          categorie={selectedCategorie}
          onClose={() => {
            setShowViewModal(false);
            setSelectedCategorie(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            handleEditCategorie(selectedCategorie);
          }}
          getCategoryColor={getCategoryColor}
          isDark={isDark}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Suppression"
        message={`Supprimer "${deleteTarget?.nom || ''}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmColor="red"
        isDark={isDark}
      />

      <ConfirmModal
        isOpen={showBulkDeleteModal}
        onClose={() => {
          setShowBulkDeleteModal(false);
          setBulkDeleteTargetIds([]);
        }}
        onConfirm={handleConfirmBulkDelete}
        title="Suppression en lot"
        message={`Voulez-vous supprimer ${bulkDeleteTargetIds.length} catégorie(s) ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmColor="red"
        isDark={isDark}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successTitle}
        message={successMessage}
        buttonText="OK"
        autoCloseDelay={3000}
        zIndex={100000}
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorTitle}
        message={errorMessage}
        buttonText="OK"
        autoCloseDelay={4000}
        zIndex={100000}
      />
    </main>
  );
};

export default Categories;