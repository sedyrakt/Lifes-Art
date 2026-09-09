import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useFournisseursData, ExportPeriod } from '../hooks/useFournisseursData';
import FournisseursHeader from '../components/fournisseurs/FournisseursHeader';
import FournisseursStats from '../components/fournisseurs/FournisseursStats';
import FournisseursSearchBar from '../components/fournisseurs/FournisseursSearchBar';
import { FournisseursTable, FournisseursPagination, FournisseursModalForm, FournisseursViewModal } from '../components/fournisseurs';
import ConfirmModal from '../components/common/ConfirmModal';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const INITIAL_STATS = { total: 0, avecContact: 0, avecEmail: 0 };

const FournisseursSkeleton = ({ isDark }: { isDark: boolean }) => {
  const base = isDark ? 'bg-white/[0.06]' : 'bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-200';
  return (
    <div className="min-h-[500px] w-full p-5" style={{ background: isDark ? '#0F172A' : '#FFFFFF' }}>
      <div className="space-y-4">
        <div className={`flex items-center gap-4 border-b pb-4 ${border}`}>
          {[...Array(7)].map((_, i) => <div key={i} className={`h-4 w-${i === 0 ? 8 : i === 1 ? 10 : i === 2 ? 24 : i === 3 ? 32 : i === 4 ? 20 : i === 5 ? 28 : 20} rounded ${base} animate-pulse`} />)}
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

const Fournisseurs: React.FC = () => {
  const { isDark } = useTheme();
  // ⭐ NOVAINA: Nakarina ny sortOption sy setSortOption
  const {
    fournisseurs, loading, refreshing, totalItems, totalPages, currentPage, setCurrentPage,
    filters, setFilters, sortOption, setSortOption,
    createFournisseur, updateFournisseur, deleteFournisseur,
    bulkDelete, getStats, loadData,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  } = useFournisseursData();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reelStats, setReelStats] = useState(INITIAL_STATS);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<any>(null);
  const [editingFournisseur, setEditingFournisseur] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [bulkDeleteTargetIds, setBulkDeleteTargetIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const resetImageState = useCallback(() => {
    setImagePreview((prev) => { if (prev?.startsWith('blob:')) try { URL.revokeObjectURL(prev); } catch {} return null; });
    setImagePath(null); setImageError(null); setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setImageError('Format non supporté.'); if (fileInputRef.current) fileInputRef.current.value = ''; return; }
    if (file.size > MAX_IMAGE_SIZE) { setImageError(`Fichier trop volumineux (max ${MAX_IMAGE_SIZE / (1024 * 1024)} MB).`); if (fileInputRef.current) fileInputRef.current.value = ''; return; }
    setUploadingImage(true); setImageError(null); setUploadProgress(10);
    const localUrl = URL.createObjectURL(file); setImagePreview(localUrl);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => { if (typeof reader.result !== 'string') reject(new Error('Format invalide')); else resolve(reader.result); };
        reader.onerror = () => reject(new Error('Erreur lecture'));
        reader.readAsDataURL(file);
      });
      setUploadProgress(45);
      if (!window.api?.images?.upload) throw new Error('API images.upload indisponible');
      const result = await window.api.images.upload(base64, 'fournisseurs');
      if (!result?.success) throw new Error(result?.error || 'Erreur upload');
      setUploadProgress(100);
      setImagePath(typeof result.data === 'string' ? result.data : null);
    } catch (error: any) {
      console.error('❌ Upload:', error); setImageError(error.message); setImagePreview(null); setImagePath(null);
    } finally {
      setUploadingImage(false); setUploadProgress(0); if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const handleRemoveImage = useCallback(async () => {
    try { if (imagePath && window.api?.images?.delete) await window.api.images.delete(imagePath); } catch {} finally { resetImageState(); }
  }, [imagePath, resetImageState]);

  const fetchReelStats = useCallback(async () => {
    try { const data = await getStats(); setReelStats({ total: Number(data?.total || 0), avecContact: Number(data?.avec_contact || 0), avecEmail: Number(data?.avec_email || 0) }); }
    catch (err) { console.error('❌ Stats:', err); setReelStats(INITIAL_STATS); }
  }, [getStats]);

  const showSuccess = useCallback((t: string, m: string) => { setSuccessTitle(t); setSuccessMessage(m); setShowSuccessModal(true); }, []);
  const showError = useCallback((t: string, m: string) => { setErrorTitle(t); setErrorMessage(m); setShowErrorModal(true); }, []);

  const handleExport = useCallback(async (format: 'excel' | 'pdf' | 'csv', period: ExportPeriod, customDate: string) => {
    try {
      let result;
      if (format === 'excel') result = await exportToExcel(period, customDate);
      else if (format === 'pdf') result = await exportToPDF(period, customDate);
      else result = await exportToCSV(period, customDate);
      if (result?.canceled) return;
      if (result?.success === false) { showError('Erreur export', result.error || 'Impossible d\'exporter les données.'); return; }
      showSuccess('Export réussi', `Les fournisseurs ont été exportés en ${format.toUpperCase()} (${period}${period === 'custom' ? ' - ' + customDate : ''}).`);
    } catch (error: any) { showError('Erreur export', error?.message || 'Impossible d\'exporter les données.'); }
  }, [exportToExcel, exportToPDF, exportToCSV, showSuccess, showError]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (!checked) { setSelectedIds(new Set()); return; }
    setSelectedIds(new Set(fournisseurs.map((f: any) => Number(f.id)).filter(id => Number.isInteger(id) && id > 0)));
  }, [fournisseurs]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => { const n = new Set(prev); if (checked) n.add(id); else n.delete(id); return n; });
  }, []);

  const handleBulkDelete = useCallback((ids: number[]) => {
    const v = ids.filter(id => Number.isInteger(id) && id > 0);
    if (!v.length) { showError('Sélection invalide', 'Aucun ID valide.'); return; }
    setBulkDeleteTargetIds(v); setShowBulkDeleteModal(true);
  }, [showError]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!bulkDeleteTargetIds.length) return;
    try {
      await bulkDelete(bulkDeleteTargetIds);
      setSelectedIds(new Set());
      showSuccess('Suppression en lot', `${bulkDeleteTargetIds.length} fournisseur(s) supprimé(s).`);
      await loadData(); await fetchReelStats();
    } catch (err: any) { showError('Erreur', err.message); }
    finally { setShowBulkDeleteModal(false); setBulkDeleteTargetIds([]); }
  }, [bulkDeleteTargetIds, bulkDelete, loadData, fetchReelStats, showSuccess, showError]);

  const handleAddClick = useCallback(() => { resetImageState(); setEditingFournisseur(null); setShowModal(true); }, [resetImageState]);

  const handleEditFournisseur = useCallback(async (fournisseur: any) => {
    if (!fournisseur?.id) return;
    resetImageState(); setEditingFournisseur(fournisseur);
    if (fournisseur.image) {
      try {
        if (window.api?.images?.getUrl) {
          const r = await window.api.images.getUrl(fournisseur.image);
          const url = r?.success ? r.data : typeof r === 'string' ? r : null;
          if (url) { setImagePreview(url); setImagePath(fournisseur.image); }
        }
      } catch {}
    }
    setShowModal(true);
  }, [resetImageState]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nom = String(fd.get('nom') || '').trim();
    if (!nom) { showError('Champ requis', 'Le nom est obligatoire.'); return; }
    const data: any = { nom, contact: String(fd.get('contact') || '').trim(), telephone: String(fd.get('telephone') || '').trim(), email: String(fd.get('email') || '').trim(), adresse: String(fd.get('adresse') || '').trim() };
    if (imagePath) data.image = imagePath;
    else if (editingFournisseur?.image && imagePreview) data.image = editingFournisseur.image;
    else data.image = null;
    try {
      if (editingFournisseur) {
        const old = editingFournisseur.image;
        if (old && old !== data.image && window.api?.images?.delete) try { await window.api.images.delete(old); } catch {}
        await updateFournisseur(Number(editingFournisseur.id), data);
        showSuccess('Fournisseur modifié', `"${nom}" mis à jour.`);
      } else {
        await createFournisseur(data);
        showSuccess('Fournisseur ajouté', `"${nom}" enregistré.`);
      }
      setShowModal(false); setEditingFournisseur(null); resetImageState();
      await loadData(); await fetchReelStats();
    } catch (err: any) { showError('Erreur', err.message); }
  }, [editingFournisseur, imagePath, imagePreview, createFournisseur, updateFournisseur, resetImageState, loadData, fetchReelStats, showSuccess, showError]);

  const handleViewFournisseur = useCallback((fournisseur: any) => { if (fournisseur?.id) { setSelectedFournisseur(fournisseur); setShowViewModal(true); } }, []);
  const handleDeleteClick = useCallback((fournisseur: any) => { if (fournisseur?.id) { setDeleteTarget(fournisseur); setShowDeleteModal(true); } }, []);
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;
    try {
      if (deleteTarget.image && window.api?.images?.delete) try { await window.api.images.delete(deleteTarget.image); } catch {}
      await deleteFournisseur(Number(deleteTarget.id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(Number(deleteTarget.id)); return n; });
      showSuccess('Fournisseur supprimé', `"${deleteTarget.nom}" supprimé.`);
      await loadData(); await fetchReelStats();
    } catch (err: any) { showError('Erreur', err.message); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  }, [deleteTarget, deleteFournisseur, loadData, fetchReelStats, showSuccess, showError]);

  const safeTotalPages = Math.max(1, Number(totalPages || 1));
  const handlePageChange = useCallback((page: number) => {
    const p = Math.max(1, Math.min(Number(page) || 1, safeTotalPages));
    if (p === currentPage) return;
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, setCurrentPage, safeTotalPages]);

  useEffect(() => { if (!loading) fetchReelStats(); }, [loading, fournisseurs, fetchReelStats]);
  const tauxContact = reelStats.total > 0 ? Math.round((reelStats.avecContact / reelStats.total) * 100) : 0;

  // ⭐ FIX: Ny onSearchChange sy onSortChange dia mampiasa ny Setter tompon'andraikitra!
  return (
    <main className="min-h-full w-full transition-colors duration-300" style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">
        <FournisseursHeader onAddFournisseur={handleAddClick} onExport={handleExport} refreshing={refreshing} onRefresh={loadData} isLoading={loading} totalItems={reelStats.total || totalItems} />
        <FournisseursStats total={reelStats.total} avecContact={reelStats.avecContact} avecEmail={reelStats.avecEmail} tauxContact={tauxContact} />
        
        <FournisseursSearchBar
          searchTerm={filters.searchTerm}
          onSearchChange={(value) => { 
            // ⭐ FIX: Mampiasa prev state mba tsy hamafa ny filtres hafa!
            setFilters(prev => ({ ...prev, searchTerm: value })); 
            setCurrentPage(1); 
            setSelectedIds(new Set()); 
          }}
          sortOption={sortOption} // ⭐ FIX: Nampiasa ny sortOption mivantana
          onSortChange={(value) => { 
            // ⭐ FIX: Ny sortOption dia state misaraka fa tsy ao amin'ny filters!
            setSortOption(value); 
            setCurrentPage(1); 
          }}
        />

        <section className="relative overflow-hidden rounded-2xl border bg-white transition-all duration-300 dark:bg-[#0F172A]" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', boxShadow: isDark ? '0 4px 24px -4px rgba(0,0,0,0.35)' : '0 4px 20px -4px rgba(79,70,229,0.08)' }}>
          {refreshing && (<div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent"><div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" /></div>)}
          {loading && fournisseurs.length === 0 ? (
            <FournisseursSkeleton isDark={isDark} />
          ) : (
            <FournisseursTable fournisseurs={fournisseurs} onView={handleViewFournisseur} onEdit={handleEditFournisseur} onDelete={handleDeleteClick} onAdd={handleAddClick} isDark={isDark} selectedIds={selectedIds} onSelectAll={handleSelectAll} onSelectOne={handleSelectOne} onBulkDelete={handleBulkDelete} />
          )}
        </section>

        {!loading && Number(totalItems || 0) > 0 && safeTotalPages > 1 && (
          <div className="flex items-center justify-between rounded-2xl border bg-white px-3 py-2.5 transition-all duration-300 dark:bg-[#0F172A]" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', boxShadow: isDark ? '0 2px 12px -2px rgba(0,0,0,0.25)' : '0 2px 10px -2px rgba(79,70,229,0.06)' }}>
            <FournisseursPagination currentPage={Math.max(1, Math.min(Number(currentPage || 1), safeTotalPages))} totalPages={safeTotalPages} totalItems={Number(totalItems || 0)} onPageChange={handlePageChange} />
          </div>
        )}
      </div>

      <FournisseursModalForm isOpen={showModal} onClose={() => { setShowModal(false); resetImageState(); setEditingFournisseur(null); }} onSubmit={handleSubmit} editingFournisseur={editingFournisseur} isDark={isDark} imagePreview={imagePreview} uploadingImage={uploadingImage} uploadProgress={uploadProgress} imageError={imageError} onImageChange={handleImageChange} onRemoveImage={handleRemoveImage} />
      {showViewModal && selectedFournisseur && (<FournisseursViewModal fournisseur={selectedFournisseur} onClose={() => setShowViewModal(false)} onEdit={() => { setShowViewModal(false); handleEditFournisseur(selectedFournisseur); }} isDark={isDark} />)}
      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleConfirmDelete} title="Suppression" message={`Supprimer "${deleteTarget?.nom || ''}" ?`} confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />
      <ConfirmModal isOpen={showBulkDeleteModal} onClose={() => { setShowBulkDeleteModal(false); setBulkDeleteTargetIds([]); }} onConfirm={handleConfirmBulkDelete} title="Suppression en lot" message={`Voulez-vous supprimer ${bulkDeleteTargetIds.length} fournisseur(s) ?`} confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />
      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title={successTitle} message={successMessage} buttonText="OK" autoCloseDelay={3000} />
      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} title={errorTitle} message={errorMessage} buttonText="OK" autoCloseDelay={4000} />
    </main>
  );
};

export default Fournisseurs;