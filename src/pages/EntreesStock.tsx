// src/pages/EntreesStock.tsx
// ⭐ NOUVEAU: Skeleton loader full-page (tsoloana ny skeleton table kely)

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
import { ExportPeriod } from '../types/exportPeriod';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../utils/saveFileWithDialog';

const formatNumberNoSlash = (value: number) => value.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');

// ============================================================
// ⭐ SKELETON LOADER FULL-PAGE
// ============================================================

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md ${className}`} />
);

const EntreesPageSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const cardBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-100';
  const surfaceBg = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const rowBorderColor = isDark ? 'border-white/[0.06]' : 'border-slate-100';
  const pageBg = isDark ? '#0F172A' : '#FFFFFF';

  return (
    <div className="min-h-full w-full transition-colors duration-300" style={{ background: pageBg }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-5 px-2 py-5 sm:px-3 lg:px-5">

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

        {/* ⭐ SEARCH BAR SKELETON */}
        <div className={`flex items-center gap-2 rounded-xl border-[0.5px] p-3 ${surfaceBg} ${borderColor}`}>
          <SkeletonBlock className={`h-10 flex-1 rounded-lg ${cardBg}`} />
        </div>

        {/* ⭐ TABLE SKELETON */}
        <section className={`relative overflow-hidden rounded-2xl border-[0.5px] ${surfaceBg} ${borderColor}`}>
          {/* Table header */}
          <div className={`flex items-center gap-3 border-b px-3 py-2.5 ${rowBorderColor}`}>
            <SkeletonBlock className={`h-4 w-4 rounded ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-32 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-16 ${cardBg}`} />
            <SkeletonBlock className={`h-3 w-24 ${cardBg}`} />
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
                <SkeletonBlock className={`h-3.5 w-40 ${cardBg}`} />
                <SkeletonBlock className={`h-2.5 w-24 ${cardBg}`} />
              </div>
              <SkeletonBlock className={`h-5 w-16 rounded ${cardBg}`} />
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
              <SkeletonBlock className={`h-3.5 w-24 ${cardBg}`} />
            </div>
            <SkeletonBlock className={`h-3.5 w-28 ${cardBg}`} />
          </div>
        </section>

      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT
// ============================================================

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

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [produitsRes, entreesRes] = await Promise.all([
        window.api.products.getAll({ limit: 500, status: 'actif' }),
        window.api.stock.getEntrees({ limit: 500 }),
      ]);
      if (produitsRes?.success) setProduits(produitsRes.data || []);
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
    uniqueProducts: new Set(filteredEntrees.map(item => item.produit_id)).size,
  }), [filteredEntrees]);

  const handleSelectAll = (checked: boolean) => setSelectedIds(checked ? new Set(pagedEntrees.map(item => item.id)) : new Set());
  const handleSelectOne = (id: number, checked: boolean) => setSelectedIds(prev => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next; });

  const handleBulkDelete = () => { if (selectedIds.size > 0) setBulkDeleteTarget(Array.from(selectedIds)); };
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
    } finally { setBulkDeleteTarget(null); }
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
    } finally { setShowDeleteModal(false); setDeleteTarget(null); }
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

  // ===== EXPORT FUNCTIONS =====
  const getExportPeriodRange = useCallback((period: ExportPeriod, customDate: string) => {
    const now = new Date();
    let startDate: string | undefined, endDate: string | undefined;
    if (period === 'aujourdhui') {
      startDate = now.toISOString().split('T')[0] + ' 00:00:00';
      endDate = now.toISOString().split('T')[0] + ' 23:59:59';
    } else if (period === 'hier') {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      startDate = yest.toISOString().split('T')[0] + ' 00:00:00';
      endDate = yest.toISOString().split('T')[0] + ' 23:59:59';
    } else if (period === 'semaine') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      startDate = monday.toISOString().split('T')[0] + ' 00:00:00';
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      endDate = sunday.toISOString().split('T')[0] + ' 23:59:59';
    } else if (period === 'mois') {
      startDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01 00:00:00`;
      const lastDay = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
      endDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')} 23:59:59`;
    } else if (period === 'annee') {
      startDate = `${now.getFullYear()}-01-01 00:00:00`;
      endDate = `${now.getFullYear()}-12-31 23:59:59`;
    } else if (period === 'custom') {
      const dateStr = customDate || now.toISOString().split('T')[0];
      startDate = dateStr + ' 00:00:00';
      endDate = dateStr + ' 23:59:59';
    }
    return { startDate, endDate };
  }, []);

  const fetchAllForExport = useCallback(async (period: ExportPeriod, customDate: string) => {
    if (!window.api?.stock?.getEntrees) return [];
    const range = getExportPeriodRange(period, customDate);
    const result = await window.api.stock.getEntrees({ limit: 100000, startDate: range.startDate, endDate: range.endDate });
    if (result?.success) return result.data || [];
    return [];
  }, [getExportPeriodRange]);

  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const rows = data.length
      ? data.map((item: any) => ({
          'Référence': item.reference || '',
          'Produit': item.produit_nom || '',
          'Code produit': item.produit_code || '',
          'Quantité': item.quantite || 0,
          'Prix unitaire': item.prix_unitaire || 0,
          'Total': (Number(item.quantite) || 0) * (Number(item.prix_unitaire) || 0),
          'Date': item.date_entree ? new Date(item.date_entree).toLocaleDateString('fr-FR') : '',
          'Observation': item.observation || '',
        }))
      : [{ 'Référence': 'Aucune entrée', 'Produit': '', 'Code produit': '', 'Quantité': 0, 'Prix unitaire': 0, 'Total': 0, 'Date': '', 'Observation': '' }];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entrées');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const totalQty = data.reduce((sum: number, item: any) => sum + Number(item.quantite || 0), 0);
    const totalValue = data.reduce((sum: number, item: any) => sum + (Number(item.quantite || 0) * Number(item.prix_unitaire || 0)), 0);
    XLSX.utils.sheet_add_json(ws, [{ 'Référence': 'TOTAL', 'Produit': '', 'Code produit': '', 'Quantité': totalQty, 'Prix unitaire': '', 'Total': totalValue, 'Date': '', 'Observation': '' }], { origin: -1, skipHeader: true });
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `entrees_${period}_${customDate || new Date().toISOString().slice(0,10)}.xlsx`;
    const result = await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToPDF = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Lifes-Art - Entrées de stock', 14, 10);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text(`Rapport des entrées - ${period}${period === 'custom' ? ' (' + (customDate || new Date().toISOString().split('T')[0]) + ')' : ''}`, 14, 28);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

    const columns = ['Référence', 'Produit', 'Code produit', 'Quantité', 'Prix unitaire', 'Total', 'Date', 'Observation'];
    const rows = data.length
      ? data.map((item: any) => [
          item.reference || '', item.produit_nom || '', item.produit_code || '',
          item.quantite || 0, item.prix_unitaire || 0,
          (Number(item.quantite) || 0) * (Number(item.prix_unitaire) || 0),
          item.date_entree ? new Date(item.date_entree).toLocaleDateString('fr-FR') : '',
          item.observation || '',
        ])
      : [['Aucune entrée', '', '', 0, 0, 0, '', '']];

    const totalQty = data.reduce((sum: number, item: any) => sum + Number(item.quantite || 0), 0);
    const totalValue = data.reduce((sum: number, item: any) => sum + (Number(item.quantite || 0) * Number(item.prix_unitaire || 0)), 0);
    autoTable(doc, {
      head: [columns], body: rows, startY: 42,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid', showHead: 'firstPage',
      didDrawPage: (data) => {
        const pageNumber = doc.getNumberOfPages();
        doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        doc.text(`Page ${pageNumber}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
      },
      showFoot: 'lastPage',
      foot: [['', '', '', totalQty, '', totalValue, '', '']],
      footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
    });
    const pdfArrayBuffer = doc.output('arraybuffer');
    const fileName = `entrees_${period}_${customDate || new Date().toISOString().slice(0,10)}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const headers = ['Référence', 'Produit', 'Code produit', 'Quantité', 'Prix unitaire', 'Total', 'Date', 'Observation'];
    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    };
    const rows = data.length
      ? data.map((item: any) => [
          item.reference || '', item.produit_nom || '', item.produit_code || '',
          item.quantite || 0, item.prix_unitaire || 0,
          (Number(item.quantite) || 0) * (Number(item.prix_unitaire) || 0),
          item.date_entree ? new Date(item.date_entree).toLocaleDateString('fr-FR') : '',
          item.observation || '',
        ])
      : [['Aucune entrée', '', '', 0, 0, 0, '', '']];

    const totalQty = data.reduce((sum: number, item: any) => sum + Number(item.quantite || 0), 0);
    const totalValue = data.reduce((sum: number, item: any) => sum + (Number(item.quantite || 0) * Number(item.prix_unitaire || 0)), 0);
    const totalRow = ['', '', '', totalQty, '', totalValue, '', ''];
    const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')])].join('\n');
    const fileName = `entrees_${period}_${customDate || new Date().toISOString().slice(0,10)}.csv`;
    const result = await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const handleExport = useCallback(async (format: 'excel' | 'pdf' | 'csv', period: ExportPeriod, customDate: string) => {
    try {
      let result;
      if (format === 'excel') result = await exportToExcel(period, customDate);
      else if (format === 'pdf') result = await exportToPDF(period, customDate);
      else result = await exportToCSV(period, customDate);

      if (result?.canceled) return;
      if (result?.success === false) { setErrorMessage(result.error || 'Erreur'); setShowErrorModal(true); return; }
      setShowSuccessModal(true);
    } catch (error: any) { setErrorMessage(error?.message || 'Erreur'); setShowErrorModal(true); }
  }, [exportToExcel, exportToPDF, exportToCSV]);

  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.10)' : '#E2E8F0';
  const shadow = isDark ? '0 4px 24px -4px rgba(0,0,0,0.35)' : '0 4px 20px -4px rgba(79,70,229,0.08)';

  // ============================================================
  // ⭐ SKELETON FULL-PAGE — alohan'ny render ny page
  // ============================================================
  if (loading && entrees.length === 0) {
    return <EntreesPageSkeleton isDark={isDark} />;
  }

  return (
    <div className="min-h-full w-full transition-colors duration-300 bg-white dark:bg-[#0F172A]">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 px-2 py-5 sm:px-3 lg:px-5">
        <EntreesHeader
          onAddEntree={() => setShowFormModal(true)}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          totalItems={stats.totalEntries}
          onExport={handleExport}
        />

        <EntreesStats totalEntries={stats.totalEntries} totalQty={stats.totalQty} totalValue={stats.totalValue} uniqueProducts={stats.uniqueProducts} />

        <EntreesSearchBar searchInput={searchInput} onSearchChange={(value) => { setSearchInput(value); setCurrentPage(1); }} />

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
              <EntreesTable entrees={pagedEntrees} selectedIds={selectedIds} onSelectAll={handleSelectAll} onSelectOne={handleSelectOne} onDelete={(id) => { setDeleteTarget(id); setShowDeleteModal(true); }} onBulkDelete={handleBulkDelete} onClearSelection={() => setSelectedIds(new Set())} />
              <EntreesPagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredEntrees.length} onPageChange={setCurrentPage} />
            </>
          )}
        </section>
      </div>

      <EntreesModalForm isOpen={showFormModal} onClose={() => setShowFormModal(false)} onSubmit={handleFormSubmit} produits={produits} />

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Succès" message="Opération réussie." buttonText="OK" autoCloseDelay={3000} />
      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} title="Erreur" message={errorMessage} buttonText="OK" autoCloseDelay={4000} />

      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete} title="Supprimer l'entrée" message="Êtes-vous sûr de vouloir supprimer cette entrée de stock ?" confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />
      <ConfirmModal isOpen={bulkDeleteTarget !== null} onClose={() => setBulkDeleteTarget(null)} onConfirm={handleConfirmBulkDelete} title="Suppression en lot" message={`Supprimer ${bulkDeleteTarget?.length || 0} entrée(s) ?`} confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />
    </div>
  );
};

export default EntreesStock;