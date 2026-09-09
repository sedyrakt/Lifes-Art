import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Package, Truck, Wrench, Zap, Users, Megaphone, Home, Tag, Plus, Search, ArrowUpDown, CreditCard, X, SlidersHorizontal } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useDepensesData, ExportPeriod } from '../hooks/useDepensesData';
import DepensesHeader from '../components/depenses/DepensesHeader';
import DepensesStats from '../components/depenses/DepensesStats';
import { DepensesTable, DepensesPagination, DepensesModalForm, DepensesViewModal } from '../components/depenses';
import ConfirmModal from '../components/common/ConfirmModal';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';

const CATEGORIES = ['Achat stock', 'Transport', 'Maintenance', 'Utilités', 'Salaire', 'Marketing', 'Loyer', 'Autre'];
const MODES_PAIEMENT = ['Espèces', 'Chèque', 'Carte bancaire', 'Virement', 'Mobile Money', 'Autre'];
const categoryIcons: Record<string, any> = {
  'Achat stock': Package, Transport: Truck, Maintenance: Wrench, Utilités: Zap,
  Salaire: Users, Marketing: Megaphone, Loyer: Home, Autre: Tag
};
const categoryColors = (cat: string) => {
  const colors: Record<string, { light: string; dark: string; text: string; }> = {
    'Achat stock': { light: 'bg-brand-50 border-brand-200', dark: 'dark:bg-brand-500/10 dark:border-brand-500/20', text: 'text-brand-600 dark:text-brand-400' },
    Transport: { light: 'bg-amber-50 border-amber-200', dark: 'dark:bg-amber-500/10 dark:border-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
    Maintenance: { light: 'bg-slate-50 border-slate-200', dark: 'dark:bg-white/[0.06] dark:border-white/[0.12]', text: 'text-slate-700 dark:text-slate-300' },
    Utilités: { light: 'bg-violet-50 border-violet-200', dark: 'dark:bg-violet-500/10 dark:border-violet-500/20', text: 'text-violet-700 dark:text-violet-300' },
    Salaire: { light: 'bg-emerald-50 border-emerald-200', dark: 'dark:bg-emerald-500/10 dark:border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
    Marketing: { light: 'bg-brand-50 border-brand-200', dark: 'dark:bg-brand-500/10 dark:border-brand-500/20', text: 'text-brand-600 dark:text-brand-400' },
    Loyer: { light: 'bg-indigo-50 border-indigo-200', dark: 'dark:bg-indigo-500/10 dark:border-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-300' },
    Autre: { light: 'bg-slate-50 border-slate-200', dark: 'dark:bg-white/[0.06] dark:border-white/[0.12]', text: 'text-slate-700 dark:text-slate-300' },
  };
  return colors[cat] || { light: 'bg-slate-50 border-slate-200', dark: 'dark:bg-white/[0.06] dark:border-white/[0.12]', text: 'text-slate-700 dark:text-slate-300' };
};

const DepensesSkeleton = ({ isDark }: { isDark: boolean }) => {
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
            {[...Array(7)].map((_, j) => <div key={j} className={`h-4 w-${j === 0 ? 8 : j === 1 ? 24 : j === 2 ? 32 : j === 3 ? 20 : j === 4 ? 28 : j === 5 ? 20 : 28} rounded ${base} animate-pulse`} />)}
          </div>
        ))}
      </div>
    </div>
  );
};

const Depenses: React.FC = () => {
  const { isDark } = useTheme();

  const {
    depenses, fournisseurs, loading, refreshing, setRefreshing, totalItems, currentPage, setCurrentPage,
    filters, setFilters, loadDepenses, stats, createDepense, updateDepense, deleteDepense, bulkDelete, ITEMS_PER_PAGE,
    // ⭐ Vaovao avy amin'ny hook
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  } = useDepensesData();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteTargetIds, setBulkDeleteTargetIds] = useState<number[]>([]);
  const [reelStats, setReelStats] = useState({ total: 0, nb: 0, moyenne: 0, nbFournisseurs: 0 });
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepense, setSelectedDepense] = useState<any>(null);
  const [editingDepense, setEditingDepense] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const retryAttempted = useRef(false);

  const safeDepenses = depenses || [];

  const showSuccess = useCallback((title: string, message: string) => {
    setSuccessTitle(title); setSuccessMessage(message); setShowSuccessModal(true);
  }, []);
  const showError = useCallback((title: string, message: string) => {
    setErrorTitle(title); setErrorMessage(message); setShowErrorModal(true);
  }, []);

  // ⭐ Handle Export – mijery ny result
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

      showSuccess('Export réussi', `Les dépenses ont été exportées en ${format.toUpperCase()} (${period}${period === 'custom' ? ' - ' + customDate : ''}).`);
    } catch (error: any) {
      showError('Erreur export', error?.message || 'Impossible d\'exporter les données.');
    }
  }, [exportToExcel, exportToPDF, exportToCSV, showSuccess, showError]);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set(safeDepenses.map(d => d.id)) : new Set());
  }, [safeDepenses]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => { const n = new Set(prev); checked ? n.add(id) : n.delete(id); return n; });
  }, []);

  const handleBulkDelete = useCallback((ids: number[]) => {
    setBulkDeleteTargetIds(ids); setShowBulkDeleteModal(true);
  }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!bulkDeleteTargetIds.length) return;
    try {
      await bulkDelete(bulkDeleteTargetIds);
      setSelectedIds(new Set());
      showSuccess('Suppression en lot', `${bulkDeleteTargetIds.length} dépense(s) supprimée(s).`);
    } catch (error: any) {
      showError('Erreur de suppression', error?.message || 'Impossible de supprimer.');
    } finally {
      setShowBulkDeleteModal(false);
      setBulkDeleteTargetIds([]);
    }
  }, [bulkDeleteTargetIds, bulkDelete, showSuccess, showError]);

  const fetchReelStats = useCallback(async () => {
    try {
      if (window.api?.expenses?.getStats) {
        const result = await window.api.expenses.getStats();
        if (result?.success) {
          setReelStats({
            total: result.data?.total || 0,
            nb: result.data?.nb || 0,
            moyenne: result.data?.moyenne || 0,
            nbFournisseurs: result.data?.nbFournisseurs || 0
          });
          return;
        }
      }
      setReelStats({ total: 0, nb: 0, moyenne: 0, nbFournisseurs: 0 });
    } catch (error) { console.error('❌ Erreur fetchReelStats Depenses:', error); }
  }, []);

  useEffect(() => { if (!loading) fetchReelStats(); }, [loading, depenses, fetchReelStats]);

  useEffect(() => {
    if (!loading && safeDepenses.length === 0 && totalItems === 0 && !retryAttempted.current) {
      retryAttempted.current = true; loadDepenses();
    }
    if (safeDepenses.length > 0 || totalItems > 0) retryAttempted.current = false;
  }, [loading, safeDepenses.length, totalItems, loadDepenses]);

  const handleOpenAddModal = useCallback(() => { setEditingDepense(null); setShowModal(true); }, []);
  const handleCloseModal = useCallback(() => { setShowModal(false); setEditingDepense(null); }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      categorie: (fd.get('categorie') as string) || '',
      description: (fd.get('description') as string) || '',
      montant: parseFloat(fd.get('montant') as string) || 0,
      date_depense: (fd.get('date_depense') as string) || new Date().toISOString().split('T')[0],
      mode_paiement: (fd.get('mode_paiement') as string) || 'Espèces',
      reference: (fd.get('reference') as string) || `DEP-${Date.now().toString().slice(-4)}`,
      fournisseur_id: parseInt(fd.get('fournisseur_id') as string) || null,
      observation: (fd.get('observation') as string) || '',
    };
    if (!data.categorie) { showError('Catégorie manquante', 'Veuillez sélectionner une catégorie.'); return; }
    if (data.montant <= 0) { showError('Montant invalide', 'Le montant doit être supérieur à 0.'); return; }
    if (!data.date_depense) { showError('Date manquante', 'Veuillez sélectionner une date.'); return; }
    try {
      if (editingDepense) {
        await updateDepense(editingDepense.id, data);
        showSuccess('Dépense modifiée', 'La dépense a été modifiée avec succès.');
      } else {
        await createDepense(data);
        showSuccess('Dépense ajoutée', 'La dépense a été enregistrée avec succès.');
      }
      setShowModal(false); setEditingDepense(null);
    } catch (error: any) {
      showError("Erreur lors de l'opération", error?.message || 'Une erreur inattendue est survenue.');
    }
  }, [editingDepense, createDepense, updateDepense, showSuccess, showError]);

  const handleDeleteClick = useCallback((id: number) => { setDeleteTarget(id); setShowDeleteModal(true); }, []);
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteDepense(deleteTarget);
      showSuccess('Dépense supprimée', 'La dépense a été supprimée avec succès.');
    } catch (error: any) {
      showError('Erreur de suppression', error?.message || 'Impossible de supprimer cette dépense.');
    } finally {
      setShowDeleteModal(false); setDeleteTarget(null);
    }
  }, [deleteTarget, deleteDepense, showSuccess, showError]);

  const handleViewDepense = useCallback((depense: any) => {
    setSelectedDepense(depense); setShowViewModal(true);
  }, []);

  const handleEditDepense = useCallback((depense: any) => {
    setEditingDepense(depense); setShowModal(true);
  }, []);

  const handleRefresh = useCallback(() => {
    if (!refreshing) loadDepenses(true);
  }, [loadDepenses, refreshing]);

  const handleResetFilters = useCallback(() => {
    setFilters({ searchTerm: '', filterCategorie: '', filterMode: '', filterDate: '', sortOption: 'Date (Récent)' });
    setCurrentPage(1);
  }, [setFilters, setCurrentPage]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <main className="min-h-full w-full transition-colors duration-300" style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">
        <DepensesHeader
          onAddDepense={handleOpenAddModal}
          onOpenStats={() => {}}
          onExport={handleExport}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          totalItems={reelStats.nb || totalItems}
        />
        <DepensesStats
          total={reelStats.total}
          nb={reelStats.nb}
          moyenne={reelStats.moyenne}
          nbFournisseurs={reelStats.nbFournisseurs}
          totalItems={totalItems}
          refreshing={refreshing}
          evolutionTotal={0}
          evolutionNb={0}
          evolutionMoyenne={0}
          evolutionFournisseurs={0}
        />
        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={17} className="text-brand-500" />
            </div>
            <input
              type="text"
              placeholder="Rechercher une dépense..."
              value={filters.searchTerm}
              onChange={e => setFilters({ searchTerm: e.target.value })}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-[13px] text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/[0.18] dark:focus:bg-[#0F172A]"
            />
            {filters.searchTerm && (
              <button type="button" onClick={() => setFilters({ searchTerm: '' })} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 xl:shrink-0">
            <div className="relative shrink-0">
              <SlidersHorizontal size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-500" />
              <select value={filters.filterCategorie} onChange={e => setFilters({ filterCategorie: e.target.value })} className="h-10 min-w-[125px] cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-7 text-[13px] text-slate-700 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-200">
                <option value="">Catégorie</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="relative shrink-0">
              <CreditCard size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-500" />
              <select value={filters.filterMode} onChange={e => setFilters({ filterMode: e.target.value })} className="h-10 min-w-[155px] cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-700 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-200">
                <option value="">Mode de paiement</option>
                {MODES_PAIEMENT.map(mode => <option key={mode} value={mode}>{mode}</option>)}
              </select>
            </div>
            <div className="relative shrink-0">
              <ArrowUpDown size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-500" />
              <select value={filters.sortOption} onChange={e => setFilters({ sortOption: e.target.value })} className="h-10 min-w-[135px] cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-700 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-200">
                <option value="Date (Récent)">Date (Récent)</option>
                <option value="Date (Ancien)">Date (Ancien)</option>
                <option value="Montant (Croissant)">Montant ↑</option>
                <option value="Montant (Décroissant)">Montant ↓</option>
              </select>
            </div>
          </div>
        </div>
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_-4px_rgba(79,70,229,0.08)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)]">
          {refreshing && (
            <div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent">
              <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" />
            </div>
          )}
          {loading && safeDepenses.length === 0 ? (
            <DepensesSkeleton isDark={isDark} />
          ) : (
            <DepensesTable
              depenses={safeDepenses}
              onView={handleViewDepense}
              onEdit={handleEditDepense}
              onDelete={handleDeleteClick}
              onAdd={handleOpenAddModal}
              categoryIcons={categoryIcons}
              categoryColors={categoryColors}
              isDark={isDark}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onBulkDelete={handleBulkDelete}
            />
          )}
        </section>
        {!loading && totalPages > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_2px_10px_-2px_rgba(79,70,229,0.06)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.25)]">
            <DepensesPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
        <DepensesModalForm
          isOpen={showModal}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          editingDepense={editingDepense}
          fournisseurs={fournisseurs}
          categories={CATEGORIES}
          modesPaiement={MODES_PAIEMENT}
          isDark={isDark}
        />
        {showViewModal && selectedDepense && (
          <DepensesViewModal
            depense={selectedDepense}
            onClose={() => setShowViewModal(false)}
            onEdit={() => { setShowViewModal(false); setEditingDepense(selectedDepense); setShowModal(true); }}
            categoryIcons={categoryIcons}
            categoryColors={categoryColors}
            isDark={isDark}
          />
        )}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
          onConfirm={handleConfirmDelete}
          title="Suppression de la dépense"
          message="Êtes-vous sûr de vouloir supprimer cette dépense ?"
          confirmText="Supprimer"
          cancelText="Annuler"
          confirmColor="red"
          isDark={isDark}
        />
        <ConfirmModal
          isOpen={showBulkDeleteModal}
          onClose={() => { setShowBulkDeleteModal(false); setBulkDeleteTargetIds([]); }}
          onConfirm={handleConfirmBulkDelete}
          title="Suppression en lot"
          message={`Voulez-vous vraiment supprimer définitivement ${bulkDeleteTargetIds.length} dépense(s) ? Cette action est irréversible.`}
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
        />
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title={errorTitle}
          message={errorMessage}
          buttonText="OK"
          autoCloseDelay={4000}
        />
      </div>
    </main>
  );
};

export default Depenses;