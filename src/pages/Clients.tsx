// src/pages/Clients.tsx
// ⭐ FIX: manampy `total_commandes` + `globalStats` + `hasActiveFilter`
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useClientsData, ExportPeriod } from '../hooks/useClientsData';
import ClientsHeader from '../components/clients/ClientsHeader';
import ClientsStats from '../components/clients/ClientsStats';
import ClientsTable from '../components/clients/ClientsTable';
import ClientsPagination from '../components/clients/ClientsPagination';
import ClientsModalForm from '../components/clients/ClientsModalForm';
import ClientsViewModal from '../components/clients/ClientsViewModal';
import ClientsSearchBar from '../components/clients/ClientsSearchBar';
import ConfirmModal from '../components/common/ConfirmModal';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';

const ClientsSkeleton = ({ isDark }: { isDark: boolean }) => {
  const base = isDark ? 'bg-white/[0.06]' : 'bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-200';
  return (
    <div className="min-h-[500px] w-full p-5">
      <div className="space-y-4">
        <div className={`flex items-center gap-4 border-b pb-4 ${border}`}>
          {[...Array(7)].map((_, i) => (
            <div key={i} className={`h-4 w-${i === 0 ? 8 : i === 1 ? 10 : i === 2 ? 24 : i === 3 ? 32 : i === 4 ? 20 : i === 5 ? 28 : 20} rounded ${base} animate-pulse`} />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`flex items-center gap-4 py-3 ${border}`}>
            <div className={`h-4 w-8 rounded ${base} animate-pulse`} />
            <div className={`h-10 w-10 rounded-lg ${base} animate-pulse`} />
            <div className={`h-4 w-32 rounded ${base} animate-pulse`} />
            <div className={`h-4 w-20 rounded ${base} animate-pulse`} />
            <div className={`h-4 w-24 rounded ${base} animate-pulse`} />
            <div className={`h-4 w-20 rounded ${base} animate-pulse`} />
            <div className={`h-4 w-28 rounded ${base} animate-pulse`} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Clients: React.FC = () => {
  const { isDark } = useTheme();
  const {
    clients, loading, refreshing, totalItems, totalPages, currentPage, setCurrentPage,
    filters, setFilters, sortOption, setSortOption, refresh, loadData, getStats,
    getTypeColor, getTypeIcon, ITEMS_PER_PAGE,
    createClient, updateClient, deleteClient, bulkDelete, bulkUpdateType,
    getClientById,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  } = useClientsData();

  // ⭐ VAOVAO: `total_commandes`
  const [reelStats, setReelStats] = useState({
    total: 0,
    particuliers: 0,
    entreprises: 0,
    avec_telephone: 0,
    total_achats: 0,
    total_commandes: 0,   // ⭐ NOUVEAU
  });

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkTargetIds, setBulkTargetIds] = useState<number[]>([]);
  const [bulkActionType, setBulkActionType] = useState<'delete' | 'update_type'>('delete');
  const [bulkTargetType, setBulkTargetType] = useState('');
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const showSuccess = useCallback((t: string, m: string) => {
    setSuccessTitle(t); setSuccessMessage(m); setShowSuccessModal(true);
  }, []);
  const showError = useCallback((t: string, m: string) => {
    setErrorTitle(t); setErrorMessage(m); setShowErrorModal(true);
  }, []);

  // ⭐ Fetch reel stats
  const fetchReelStats = useCallback(async () => {
    try {
      const data = await getStats();
      if (data) {
        setReelStats({
          total: Number(data.total) || 0,
          particuliers: Number(data.particuliers) || 0,
          entreprises: Number(data.entreprises) || 0,
          avec_telephone: Number(data.avec_telephone) || 0,
          total_achats: Number(data.total_achats) || clients.reduce((sum, c) => sum + (Number(c.total_achats) || 0), 0),
          total_commandes: Number(data.total_commandes) || 0,   // ⭐ NOUVEAU
        });
      } else {
        setReelStats({
          total: clients.length,
          particuliers: clients.filter(c => c.type === 'Particulier').length,
          entreprises: clients.filter(c => c.type === 'Entreprise').length,
          avec_telephone: clients.filter(c => c.email || c.telephone).length,
          total_achats: clients.reduce((sum, c) => sum + (Number(c.total_achats) || 0), 0),
          total_commandes: 0,
        });
      }
    } catch (err) {
      console.error('❌ Stats:', err);
      setReelStats({
        total: clients.length,
        particuliers: clients.filter(c => c.type === 'Particulier').length,
        entreprises: clients.filter(c => c.type === 'Entreprise').length,
        avec_telephone: clients.filter(c => c.email || c.telephone).length,
        total_achats: clients.reduce((sum, c) => sum + (Number(c.total_achats) || 0), 0),
        total_commandes: 0,
      });
    }
  }, [getStats, clients]);

  useEffect(() => { if (!loading) fetchReelStats(); }, [loading, clients, fetchReelStats]);

  // ⭐ hasActiveFilter
  const hasActiveFilter = useMemo(() => Boolean(
    filters.searchTerm ||
    filters.filterType !== 'Tous' ||
    filters.filterVille ||
    filters.filterPays ||
    filters.filterDateFrom ||
    filters.filterDateTo
  ), [filters]);

  // ⭐ globalStats ho an'ny footer
  const globalStats = useMemo(() => ({
    total: reelStats.total,
    particuliers: reelStats.particuliers,
    entreprises: reelStats.entreprises,
    avecContact: reelStats.avec_telephone,
    totalAchats: reelStats.total_achats,
    totalCommandes: reelStats.total_commandes,   // ⭐ NOUVEAU
  }), [reelStats]);

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
      showSuccess('Export réussi', `Les clients ont été exportés en ${format.toUpperCase()} (${period}${period === 'custom' ? ' - ' + customDate : ''}).`);
    } catch (error: any) {
      showError('Erreur export', error?.message || 'Impossible d\'exporter les données.');
    }
  }, [exportToExcel, exportToPDF, exportToCSV, showSuccess, showError]);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set(clients.map((c: any) => c.id)) : new Set());
  }, [clients]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => { const n = new Set(prev); if (checked) n.add(id); else n.delete(id); return n; });
  }, []);

  const handleViewClient = useCallback(async (client: any) => {
    if (client.nb_commandes !== undefined) {
      setSelectedClient(client); setShowViewModal(true);
    } else {
      const enriched = await getClientById(client.id);
      if (enriched) setSelectedClient(enriched);
      else setSelectedClient(client);
      setShowViewModal(true);
    }
  }, [getClientById]);

  const handleEditClient = useCallback((client: any) => {
    setEditingClient(client); setShowModal(true);
  }, []);

  const handleDeleteClick = useCallback((client: any) => {
    setDeleteTarget(client); setShowDeleteModal(true);
  }, []);

  const handleOpenAddModal = useCallback(() => {
    setEditingClient(null); setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false); setEditingClient(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data: any = {
      nom: String(fd.get('nom') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      telephone: String(fd.get('telephone') || '').trim(),
      adresse: String(fd.get('adresse') || '').trim(),
      ville: String(fd.get('ville') || '').trim(),
      code_postal: String(fd.get('code_postal') || '').trim(),
      pays: String(fd.get('pays') || '').trim() || 'Madagascar',
      type: String(fd.get('type') || '').trim() || 'Particulier',
    };
    if (!data.nom) { showError('Champ requis', 'Le nom est obligatoire.'); return; }
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data);
        showSuccess('Client modifié', `"${data.nom}" mis à jour.`);
      } else {
        await createClient(data);
        showSuccess('Client créé', `"${data.nom}" enregistré.`);
      }
      setShowModal(false); setEditingClient(null); await fetchReelStats();
    } catch (err: any) { showError('Erreur', err.message); }
  }, [editingClient, updateClient, createClient, showSuccess, showError, fetchReelStats]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteClient(deleteTarget.id);
      showSuccess('Client supprimé', `"${deleteTarget.nom}" supprimé.`);
      setShowDeleteModal(false); setDeleteTarget(null); setSelectedIds(new Set()); await fetchReelStats();
    } catch (err: any) { showError('Erreur', err.message); }
  }, [deleteTarget, deleteClient, showSuccess, showError, fetchReelStats]);

  const handleBulkUpdateType = useCallback((ids: number[], newType: string) => {
    if (ids.length) {
      setBulkTargetIds(ids); setBulkTargetType(newType);
      setBulkActionType('update_type'); setShowBulkConfirmModal(true);
    }
  }, []);

  const handleBulkDelete = useCallback((ids: number[]) => {
    if (ids.length) {
      setBulkTargetIds(ids); setBulkActionType('delete'); setShowBulkConfirmModal(true);
    }
  }, []);

  const handleConfirmBulkAction = useCallback(async () => {
    if (!bulkTargetIds.length) return;
    try {
      if (bulkActionType === 'delete') {
        await bulkDelete(bulkTargetIds);
        setSelectedIds(new Set());
        showSuccess('Suppression en lot', `${bulkTargetIds.length} client(s) supprimé(s).`);
      } else if (bulkActionType === 'update_type') {
        await bulkUpdateType(bulkTargetIds, bulkTargetType);
        setSelectedIds(new Set());
        showSuccess('Mise à jour en lot', `${bulkTargetIds.length} client(s) changé(s) en "${bulkTargetType}".`);
      }
      await fetchReelStats();
    } catch (err: any) { showError("Erreur", err.message); }
    finally {
      setShowBulkConfirmModal(false); setBulkTargetIds([]);
      setBulkTargetType(''); setBulkActionType('delete');
    }
  }, [bulkTargetIds, bulkActionType, bulkTargetType, bulkDelete, bulkUpdateType, showSuccess, showError, fetchReelStats]);

  const handleRefresh = useCallback(async () => {
    try { await refresh(); await fetchReelStats(); }
    catch (err) { console.error('❌ Refresh:', err); }
  }, [refresh, fetchReelStats]);

  const handleSearchChange = useCallback((v: string) => {
    setFilters(prev => ({ ...prev, searchTerm: v }));
  }, [setFilters]);

  const handleFilterTypeChange = useCallback((v: string) => {
    setFilters(prev => ({ ...prev, filterType: v }));
  }, [setFilters]);

  const handleSortChange = useCallback((v: string) => {
    setSortOption(v as any);
  }, [setSortOption]);

  const handleDateFromChange = useCallback((v: string) => {
    setFilters(prev => ({ ...prev, filterDateFrom: v }));
  }, [setFilters]);

  const handleResetFilters = useCallback(() => {
    setFilters({
      searchTerm: '', filterType: 'Tous', filterVille: '',
      filterPays: '', filterDateFrom: '', filterDateTo: '',
    });
    setCurrentPage(1);
  }, [setFilters, setCurrentPage]);

  const totalAchats = reelStats.total_achats > 0
    ? reelStats.total_achats
    : clients.reduce((sum: number, c: any) => sum + Number(c.total_achats || 0), 0);

  return (
    <main className="min-h-full w-full transition-colors duration-300" style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">
        <ClientsHeader
          onAddClient={handleOpenAddModal}
          onExport={handleExport}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          isLoading={loading}
          totalItems={reelStats.total || totalItems}
        />
        <ClientsStats
          totalClients={reelStats.total}
          particuliers={reelStats.particuliers}
          entreprises={reelStats.entreprises}
          totalAchats={totalAchats}
          refreshing={refreshing}
        />

        <ClientsSearchBar
          searchTerm={filters.searchTerm ?? ''}
          onSearchChange={handleSearchChange}
          filterType={filters.filterType ?? 'Tous'}
          onFilterTypeChange={handleFilterTypeChange}
          sortOption={sortOption}
          onSortChange={handleSortChange}
        />

        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_-4px_rgba(79,70,229,0.08)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)]">
          {refreshing && (
            <div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent">
              <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" />
            </div>
          )}

          {loading && clients.length === 0 ? (
            <ClientsSkeleton isDark={isDark} />
          ) : (
            <ClientsTable
              clients={clients}
              onView={handleViewClient}
              onEdit={handleEditClient}
              onDelete={handleDeleteClick}
              onAdd={handleOpenAddModal}
              getTypeColor={getTypeColor}
              getTypeIcon={getTypeIcon}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onBulkDelete={handleBulkDelete}
              onBulkUpdateType={handleBulkUpdateType}
              globalStats={globalStats}       // ⭐ VAOVAO
              hasActiveFilter={hasActiveFilter}  // ⭐ VAOVAO
            />
          )}
        </section>

        {!loading && totalItems > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_2px_10px_-2px_rgba(79,70,229,0.06)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.25)]">
            <ClientsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {!loading && totalItems > 0 && (
          <div className="flex justify-center pb-1">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} – {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} sur {totalItems} clients
            </span>
          </div>
        )}
      </div>

      <ClientsModalForm
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingClient={editingClient}
        isDark={isDark}
      />

      {showViewModal && selectedClient && (
        <ClientsViewModal
          client={selectedClient}
          onClose={() => setShowViewModal(false)}
          onEdit={() => { setShowViewModal(false); handleEditClient(selectedClient); }}
          getTypeColor={getTypeColor}
          getTypeIcon={getTypeIcon}
          isDark={isDark}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        title="Suppression"
        message={`Supprimer "${deleteTarget?.nom || ''}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmColor="red"
        isDark={isDark}
      />

      <ConfirmModal
        isOpen={showBulkConfirmModal}
        onClose={() => {
          setShowBulkConfirmModal(false); setBulkTargetIds([]);
          setBulkTargetType(''); setBulkActionType('delete');
        }}
        onConfirm={handleConfirmBulkAction}
        title="Opération en lot"
        message={bulkActionType === 'delete'
          ? `Supprimer ${bulkTargetIds.length} client(s) ?`
          : `Changer ${bulkTargetIds.length} client(s) en "${bulkTargetType}" ?`}
        confirmText="Confirmer"
        cancelText="Annuler"
        confirmColor={bulkActionType === 'delete' ? 'red' : 'green'}
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

export default Clients;