import React, { useCallback, useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import useMouvementsData from '../hooks/useMouvementsData';
import { Search, ArrowUpDown, Filter, Calendar, X } from 'lucide-react';

import MouvementsHeader from '../components/mouvements/MouvementsHeader';
import MouvementsStats from '../components/mouvements/MouvementsStats';
import MouvementsTable from '../components/mouvements/MouvementsTable';
import MouvementsPagination from '../components/mouvements/MouvementsPagination';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';
import ConfirmModal from '../components/common/ConfirmModal';

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'ENTREE', label: 'Entrées' },
  { value: 'SORTIE', label: 'Sorties' },
  { value: 'AJUSTEMENT', label: 'Ajustements' },
] as const;

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Date récente' },
  { value: 'date-asc', label: 'Date ancienne' },
  { value: 'quantite-desc', label: 'Quantité ↓' },
  { value: 'quantite-asc', label: 'Quantité ↑' },
] as const;

const MouvementsStock: React.FC = () => {
  const { isDark } = useTheme();
  const {
    mouvements, loading, refreshing, setRefreshing, totalItems, currentPage,
    searchTerm, setSearchTerm, filterType, setFilterType, filterDate, setFilterDate,
    sortOption, setSortOption, statsData, loadMouvements, getTypeColor, getTypeLabel,
    getTypeIcon, ITEMS_PER_PAGE, selectedIds, setSelectedIds, handleSelectAll,
    handleSelectOne, bulkDelete, hasMore,
    handleNextPage, handlePrevPage,
  } = useMouvementsData();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number[]>([]);

  const showSuccess = useCallback((title: string, message: string) => {
    setSuccessTitle(title); setSuccessMessage(message); setShowSuccessModal(true);
  }, []);
  const showError = useCallback((title: string, message: string) => {
    setErrorTitle(title); setErrorMessage(message); setShowErrorModal(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try { await loadMouvements(true); } catch (error: any) {
      showError('Erreur', error?.message || 'Impossible de charger les mouvements.');
    } finally { setRefreshing(false); }
  }, [refreshing, setRefreshing, loadMouvements, showError]);

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setDeleteTarget(ids);
    setShowDeleteModal(true);
  }, [selectedIds]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (deleteTarget.length === 0) return;
    try {
      await bulkDelete(deleteTarget);
      setSelectedIds(new Set());
      showSuccess('Suppression en lot', `${deleteTarget.length} mouvement(s) supprimé(s).`);
    } catch (error: any) {
      showError('Erreur de suppression', error?.message || 'Impossible de supprimer les mouvements.');
    } finally {
      setShowDeleteModal(false); setDeleteTarget([]);
    }
  }, [deleteTarget, bulkDelete, setSelectedIds, showSuccess, showError]);

  const handleEditMouvement = useCallback((mouvement: any) => {
    console.log('Modifier mouvement:', mouvement);
    showSuccess('Modification', `Modification du mouvement ${mouvement.reference || 'sans référence'}.`);
  }, [showSuccess]);

  const handleExportMouvement = useCallback((mouvement: any) => {
    console.log('Exporter mouvement:', mouvement);
    showSuccess('Export', `Export du mouvement ${mouvement.reference || 'sans référence'} réussi.`);
  }, [showSuccess]);

  const resetFilters = useCallback(() => {
    setSearchTerm(''); setFilterType(''); setFilterDate(''); setSortOption('date-desc');
  }, [setSearchTerm, setFilterType, setFilterDate, setSortOption]);

  const uniqueMouvements = useMemo(() => {
    const seen = new Set();
    return mouvements.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [mouvements]);

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
              <div className={`h-4 w-24 rounded ${base} animate-pulse`} />
              <div className={`h-10 w-10 rounded-lg ${base} animate-pulse`} />
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
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0';
  const shadow = isDark ? '0 4px 24px -4px rgba(0,0,0,0.35)' : '0 4px 20px -4px rgba(79,70,229,0.08)';

  return (
    <main
      className="min-h-full w-full transition-colors duration-300"
      style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}
    >
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">
        <MouvementsHeader onPrint={() => {}} onExport={() => {}} refreshing={refreshing} onRefresh={handleRefresh} totalItems={totalItems} />
        <MouvementsStats total={statsData.total} entrees={statsData.entrees} sorties={statsData.sorties} ajustements={statsData.ajustements} quantiteEntree={statsData.quantiteEntree} quantiteSortie={statsData.quantiteSortie} refreshing={refreshing} onRefresh={handleRefresh} filtreActif={filterType} onSelectFiltre={setFilterType} />

        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500" />
            <input
              type="text"
              placeholder="Rechercher un mouvement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border bg-white pl-10 pr-10 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 transition-all duration-150 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/[0.18]"
              style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
            <div className="relative">
              <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 min-w-[145px] appearance-none rounded-xl border bg-white pl-9 pr-8 text-[13px] font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-slate-800 dark:text-slate-200 dark:hover:border-white/[0.18]"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* ⭐ Remplacement du DatePicker par input type="date" */}
            <div className="relative flex items-center">
              <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                placeholder="Date"
                className="h-10 w-[145px] rounded-xl border bg-white pl-9 pr-8 text-[13px] text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-slate-800 dark:text-slate-200 dark:hover:border-white/[0.18]"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
                  title="Effacer la date"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="relative">
              <ArrowUpDown size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="h-10 min-w-[140px] appearance-none rounded-xl border bg-white pl-9 pr-8 text-[13px] font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-slate-800 dark:text-slate-200 dark:hover:border-white/[0.18]"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-2xl border transition-all duration-300" style={{ background: cardBg, borderColor, boxShadow: shadow }}>
          {refreshing && (
            <div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent">
              <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" />
            </div>
          )}

          {loading && mouvements.length === 0 ? (
            renderSkeleton()
          ) : (
            <MouvementsTable
              mouvements={uniqueMouvements}
              getTypeColor={getTypeColor}
              getTypeLabel={getTypeLabel}
              getTypeIcon={getTypeIcon}
              isDark={isDark}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onBulkDelete={handleBulkDelete}
              onView={(m) => { /* Voir détails */ }}
              onEdit={handleEditMouvement}
              onExport={handleExportMouvement}
            />
          )}
        </section>

        {!loading && totalItems > 0 && (
          <div className="flex items-center justify-between rounded-2xl border px-3 py-2.5 transition-all duration-300" style={{ background: cardBg, borderColor, boxShadow: isDark ? '0 2px 12px -2px rgba(0,0,0,0.25)' : '0 2px 10px -2px rgba(79,70,229,0.06)' }}>
            <MouvementsPagination currentPage={currentPage} totalItems={totalItems} hasMore={hasMore} onNext={handleNextPage} onPrevious={handlePrevPage} />
          </div>
        )}
      </div>

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title={successTitle} message={successMessage} buttonText="OK" autoCloseDelay={3000} />
      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} title={errorTitle} message={errorMessage} buttonText="OK" autoCloseDelay={4000} />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget([]); }} onConfirm={handleConfirmBulkDelete} title="Suppression en lot" message={`Voulez-vous supprimer ${deleteTarget.length} mouvement(s) ?`} confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />
    </main>
  );
};

export default MouvementsStock;