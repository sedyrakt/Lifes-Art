// src/pages/MouvementsStock.tsx
// ⭐ NOUVEAU: Skeleton loader full-page (tsoloana ny skeleton table kely)

import React, { useCallback, useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import useMouvementsData, { ExportPeriod } from '../hooks/useMouvementsData';
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

// ============================================================
// ⭐ SKELETON LOADER FULL-PAGE
// ============================================================

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md ${className}`} />
);

const MouvementsPageSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
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

        {/* ⭐ STATS CARDS SKELETON (4 cards) */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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

        {/* ⭐ SEARCH + FILTERS SKELETON */}
        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <div className={`h-10 w-full rounded-xl border-[0.5px] ${surfaceBg} ${borderColor}`}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <SkeletonBlock className={`h-4 w-4 rounded ${cardBg}`} />
                <SkeletonBlock className={`h-3 w-40 ${cardBg}`} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
            <SkeletonBlock className={`h-10 w-[140px] rounded-xl ${cardBg}`} />
            <SkeletonBlock className={`h-10 w-[145px] rounded-xl ${cardBg}`} />
            <SkeletonBlock className={`h-10 w-[145px] rounded-xl ${cardBg}`} />
            <SkeletonBlock className={`h-10 w-[140px] rounded-xl ${cardBg}`} />
          </div>
        </div>

        {/* ⭐ TABLE SKELETON */}
        <section className={`relative overflow-hidden rounded-2xl border-[0.5px] ${surfaceBg} ${borderColor}`}>
          {/* Table header */}
          <div className={`flex items-center gap-3 border-b px-3 py-2.5 ${rowBorderColor}`}>
            <SkeletonBlock className={`h-4 w-4 rounded ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-32 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-24 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-24 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-24 ${cardBg}`} />
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
                <SkeletonBlock className={`h-2.5 w-24 ${cardBg}`} />
              </div>
              <SkeletonBlock className={`h-5 w-16 rounded ${cardBg}`} />
              <SkeletonBlock className={`h-5 w-16 rounded ${cardBg}`} />
              <SkeletonBlock className={`h-3.5 w-24 ${cardBg}`} />
              <SkeletonBlock className={`h-3.5 w-24 ${cardBg}`} />
              <SkeletonBlock className={`h-3.5 w-24 ${cardBg}`} />
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
              <SkeletonBlock className={`h-3.5 w-24 ${cardBg}`} />
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
          </div>
        </div>

      </div>
    </main>
  );
};

// ============================================================
// COMPOSANT
// ============================================================

const MouvementsStock: React.FC = () => {
  const { isDark } = useTheme();
  
  const {
    mouvements, loading, refreshing, setRefreshing, totalItems, currentPage,
    searchTerm, setSearchTerm, filterType, setFilterType, filterDate, setFilterDate,
    period, setPeriod, sortOption, setSortOption, statsData, loadMouvements,
    getTypeColor, getTypeLabel, getTypeIcon, ITEMS_PER_PAGE, selectedIds, setSelectedIds,
    handleSelectAll, handleSelectOne, bulkDelete, hasMore,
    handleNextPage, handlePrevPage,
    exportPeriod, setExportPeriod,
    exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
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

  // ⭐ Fonction locale pour récupérer le prix unitaire (car le hook ne le renvoie pas toujours)
  const getPrixUnitaire = useCallback((m: any): number => {
    if (m.prix_unitaire !== undefined && m.prix_unitaire !== null && m.prix_unitaire !== 0) return Number(m.prix_unitaire);
    if (m.produit) {
      if (m.produit.prix_vente) return Number(m.produit.prix_vente);
      if (m.produit.prix_unitaire) return Number(m.produit.prix_unitaire);
      if (m.produit.prix_achat) return Number(m.produit.prix_achat);
      if (m.produit.prix) return Number(m.produit.prix);
    }
    if (m.prix_vente) return Number(m.prix_vente);
    if (m.prix_achat) return Number(m.prix_achat);
    if (m.prix) return Number(m.prix);
    return 0;
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await loadMouvements(true);
    } catch (error: any) {
      showError('Erreur', error?.message || 'Impossible de charger les mouvements.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, setRefreshing, loadMouvements, showError]);

  // ⭐ FIX: Manao action Supprimer na avy amin'ny dropdown na checkbox
  const handleBulkDelete = useCallback((ids?: number[]) => {
    const targetIds = Array.isArray(ids) && ids.length > 0 ? ids : Array.from(selectedIds);
    if (targetIds.length === 0) return;
    setDeleteTarget(targetIds);
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
      setShowDeleteModal(false);
      setDeleteTarget([]);
    }
  }, [deleteTarget, bulkDelete, setSelectedIds, showSuccess, showError]);

  // ⭐ FIX: Manao action Exporter isaky ny mouvement avy amin'ny dropdown
  const handleExportOne = useCallback(async (mouvement: any) => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF('landscape', 'mm', 'a4');
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 297, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('Lifes-Art - Détail du mouvement', 14, 10);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(18);
      doc.text(`Mouvement: ${mouvement.reference || 'N/A'}`, 14, 28);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

      const columns = ['Produit', 'Type', 'Quantité', 'Prix unit.', 'Stock préc.', 'Stock actuel', 'Date', 'Observation'];
      const rows = [[
        mouvement.produit_nom || 'N/A',
        getTypeLabel(mouvement.type_mouvement),
        mouvement.quantite,
        getPrixUnitaire(mouvement),
        mouvement.ancien_stock ?? 'N/A',
        mouvement.nouveau_stock ?? 'N/A',
        mouvement.date_mouvement ? new Date(mouvement.date_mouvement).toLocaleDateString('fr-FR') : '',
        mouvement.observation || '',
      ]];

      autoTable(doc, {
        head: [columns], body: rows, startY: 42,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        theme: 'grid',
      });

      const pdfData = doc.output('arraybuffer');
      const fileName = `mouvement_${mouvement.reference || mouvement.id}.pdf`;

      if (window?.api?.utils?.saveFile) {
        const result = await window.api.utils.saveFile(pdfData, fileName);
        if (result?.canceled) return;
        if (!result?.success) {
          showError('Erreur', result?.error || 'Erreur lors de la sauvegarde');
          return;
        }
      } else {
        const blob = new Blob([pdfData], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      showSuccess('Export réussi', 'Le mouvement a été exporté en PDF.');
    } catch (error: any) {
      showError('Erreur', error?.message || 'Impossible d\'exporter le mouvement.');
    }
  }, [getTypeLabel, getPrixUnitaire, showSuccess, showError]);

  const handleExport = useCallback(async (format: 'excel' | 'pdf' | 'csv', period: ExportPeriod, customDate: string) => {
    try {
      if (format === 'excel') await exportToExcel(period, customDate);
      else if (format === 'pdf') await exportToPDF(period, customDate);
      else await exportToCSV(period, customDate);
      showSuccess('Export réussi', `Les mouvements ont été exportés en ${format.toUpperCase()} (${period}${period === 'custom' ? ' - ' + customDate : ''}).`);
    } catch (error: any) {
      showError('Erreur export', error?.message || 'Impossible d\'exporter les données.');
    }
  }, [exportToExcel, exportToPDF, exportToCSV, showSuccess, showError]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setFilterType('');
    setFilterDate('');
    setSortOption('date-desc');
    setPeriod('mois');
    setExportPeriod('mois');
    setExportCustomDate(new Date().toISOString().split('T')[0]);
  }, [setSearchTerm, setFilterType, setFilterDate, setSortOption, setPeriod, setExportPeriod, setExportCustomDate]);

  const uniqueMouvements = useMemo(() => {
    const seen = new Set();
    return mouvements.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [mouvements]);

  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0';
  const shadow = isDark ? '0 4px 24px -4px rgba(0,0,0,0.35)' : '0 4px 20px -4px rgba(79,70,229,0.08)';

  // ============================================================
  // ⭐ SKELETON FULL-PAGE — alohan'ny render ny page
  // ============================================================
  if (loading && mouvements.length === 0) {
    return <MouvementsPageSkeleton isDark={isDark} />;
  }

  return (
    <main className="min-h-full w-full transition-colors duration-300" style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">
        <MouvementsHeader onPrint={() => {}} onExport={handleExport} refreshing={refreshing} onRefresh={handleRefresh} totalItems={totalItems} />
        <MouvementsStats total={statsData.total} entrees={statsData.entrees} sorties={statsData.sorties} ajustements={statsData.ajustements} quantiteEntree={statsData.quantiteEntree} quantiteSortie={statsData.quantiteSortie} refreshing={refreshing} onRefresh={handleRefresh} filtreActif={filterType} onSelectFiltre={setFilterType} />

        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500" />
            <input
              type="text"
              placeholder="Rechercher un mouvement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border bg-white pl-10 pr-10 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 transition-all duration-150 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/[0.18]"
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
              <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as typeof period)}
                className="h-10 min-w-[140px] appearance-none rounded-xl border bg-white pl-9 pr-8 text-[13px] font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-200 dark:hover:border-white/[0.18]"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}
              >
                {[
                  { value: 'jour', label: "Aujourd'hui" },
                  { value: 'semaine', label: 'Cette semaine' },
                  { value: 'mois', label: 'Ce mois' },
                  { value: 'annee', label: 'Cette année' },
                ].map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 min-w-[145px] appearance-none rounded-xl border bg-white pl-9 pr-8 text-[13px] font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-200 dark:hover:border-white/[0.18]"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="relative flex items-center">
              <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                placeholder="Date"
                className="h-10 w-[145px] rounded-xl border bg-white pl-9 pr-8 text-[13px] text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-200 dark:hover:border-white/[0.18]"
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
                className="h-10 min-w-[140px] appearance-none rounded-xl border bg-white pl-9 pr-8 text-[13px] font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-200 dark:hover:border-white/[0.18]"
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
            onEdit={(m) => { /* Modifier */ }}
            onExport={handleExportOne}       
          />
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