// src/pages/Achats.tsx
// ⭐ FIX: Manampy `globalStats` sy `hasActiveFilter` amin'ny AchatsTable
//    → Footer badges colorés + total global
// ⭐ FIX: Fallback localStats raha 0 ny stats avy amin'ny backend

import React, { useState, useCallback, useMemo } from 'react';
import { Search, RefreshCw, X, Wallet, Users, Package, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useCompany } from '../contexts/CompanyContext';
import { useAchatsData, ExportPeriod } from '../hooks/useAchatsData';
import AchatsHeader from '../components/achats/AchatsHeader';
import { AchatsTable, AchatsPagination, AchatsModalForm, AchatsViewModal } from '../components/achats';
import CompanySettingsModal from '../components/company/CompanySettingsModal';
import ConfirmModal from '../components/common/ConfirmModal';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';
import { downloadAchatPDF } from '../lib/achatsPDFService';

interface SelectedProduct { id: number; quantite: number; }

// ⭐ Palette harmonisée
const STAT_ACCENTS = {
  total: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accent: '#6366F1',
  },
  montant: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: '#10B981',
  },
  fournisseurs: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accent: '#F59E0B',
  },
  nonPayes: {
    iconBg: 'bg-red-50 dark:bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    accent: '#EF4444',
  },
};

const AchatsSkeleton = ({ isDark }: { isDark: boolean }) => {
  const base = isDark ? 'bg-white/[0.06]' : 'bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-200';
  return (
    <div className="min-h-[500px] w-full p-5">
      <div className="space-y-4">
        <div className={`flex items-center gap-4 border-b pb-4 ${border}`}>
          {[...Array(7)].map((_, i) => <div key={i} className={`h-4 w-${i === 0 ? 8 : i === 1 ? 24 : i === 2 ? 10 : i === 3 ? 32 : i === 4 ? 20 : i === 5 ? 28 : 20} rounded ${base} animate-pulse`} />)}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`flex items-center gap-4 py-3 ${border}`}>
            {[...Array(7)].map((_, j) => <div key={j} className={`h-4 w-${j === 0 ? 8 : j === 1 ? 24 : j === 2 ? 10 : j === 3 ? 32 : j === 4 ? 20 : j === 5 ? 28 : 20} rounded ${base} animate-pulse`} />)}
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  accentKey,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accentKey: keyof typeof STAT_ACCENTS;
}) => {
  const accent = STAT_ACCENTS[accentKey];

  return (
    <div className="group relative flex min-h-[95px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors duration-200 hover:border-brand-500/30 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-brand-500/30">
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ backgroundColor: accent.accent }}
      />
      <div className="flex min-w-0 items-start gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconColor} transition-transform duration-200 group-hover:scale-105`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold uppercase leading-[1.4] tracking-[0.07em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p
            className="mt-1 truncate text-[20px] font-bold leading-[1.3] tracking-tight text-slate-900 dark:text-slate-100"
            title={String(value)}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

const Achats: React.FC = () => {
  const { isDark } = useTheme();
  const { company } = useCompany();
  const {
    achats, fournisseurs, produits, loading, refreshing, totalItems, totalPages, currentPage, setCurrentPage,
    loadAchats, createAchat, updateAchat, deleteAchat, bulkDelete, setSearchTerm, ITEMS_PER_PAGE,
    stats,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  } = useAchatsData();

  // ===== STATES =====
  const [selectedAchat, setSelectedAchat] = useState<any>(null);
  const [editingAchat, setEditingAchat] = useState<any>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteTargetIds, setBulkDeleteTargetIds] = useState<number[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [selectedFournisseurId, setSelectedFournisseurId] = useState<number | null>(null);
  const [selectedProduits, setSelectedProduits] = useState<SelectedProduct[]>([]);
  const [montantPaye, setMontantPaye] = useState(0);

  const [tvaOverride, setTvaOverride] = useState<number | null>(null);

  const [fraisLivraison, setFraisLivraison] = useState(0);
  const [modePaiement, setModePaiement] = useState('Espèces');
  const [modaliteValue, setModaliteValue] = useState(0);
  const [modaliteUnit, setModaliteUnit] = useState('jours');

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [achatForInvoice, setAchatForInvoice] = useState<any>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // ===== CALLBACKS =====
  const showSuccess = useCallback((title: string, message: string) => {
    setSuccessTitle(title); setSuccessMessage(message); setShowSuccessModal(true);
  }, []);
  const showError = useCallback((title: string, message: string) => {
    setErrorTitle(title); setErrorMessage(message); setShowErrorModal(true);
  }, []);

  const handleExport = useCallback(async (format: 'excel' | 'pdf' | 'csv', period: ExportPeriod, customDate: string) => {
    try {
      let result;
      if (format === 'excel') result = await exportToExcel(period, customDate);
      else if (format === 'pdf') result = await exportToPDF(period, customDate);
      else result = await exportToCSV(period, customDate);

      if (result?.canceled) return;
      if (result?.success === false) { showError('Erreur export', result.error || 'Impossible d\'exporter les données.'); return; }
      showSuccess('Export réussi', `Les achats ont été exportés en ${format.toUpperCase()} (${period}${period === 'custom' ? ' - ' + customDate : ''}).`);
    } catch (error: any) {
      showError('Erreur export', error?.message || 'Impossible d\'exporter les données.');
    }
  }, [exportToExcel, exportToPDF, exportToCSV, showSuccess, showError]);

  const handleUpdatePaiement = useCallback(async (id: number, data: { statut_paiement: string; montant_paye: number; montant_restant: number }) => {
    try {
      const result = await window.api.achats.updatePaiement(id, data);
      if (result?.success) { showSuccess('Paiement mis à jour', 'Le statut de paiement a été mis à jour avec succès.'); await loadAchats(true); }
      else { showError('Erreur', result?.error || 'Impossible de mettre à jour le paiement.'); }
    } catch (error: any) { showError('Erreur', error?.message || 'Impossible de mettre à jour le paiement.'); }
  }, [loadAchats, showSuccess, showError]);

  const handleConvertToInvoice = useCallback(async (achat: any) => {
    showSuccess('Conversion réussie', `L'achat ${achat.reference || 'N/A'} a été converti en facture avec succès.`);
  }, [showSuccess]);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set(achats.map(a => a.id)) : new Set());
  }, [achats]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => { const n = new Set(prev); checked ? n.add(id) : n.delete(id); return n; });
  }, []);

  const handleBulkDelete = useCallback((ids: number[]) => { setBulkDeleteTargetIds(ids); setShowBulkDeleteModal(true); }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!bulkDeleteTargetIds.length) return;
    try {
      await bulkDelete(bulkDeleteTargetIds);
      setSelectedIds(new Set());
      showSuccess('Suppression en lot', `${bulkDeleteTargetIds.length} achat(s) supprimé(s).`);
    } catch (error: any) { showError('Erreur', error?.message || 'Impossible de supprimer.'); }
    finally { setShowBulkDeleteModal(false); setBulkDeleteTargetIds([]); }
  }, [bulkDeleteTargetIds, bulkDelete, showSuccess, showError]);

  const handleViewAchat = useCallback((achat: any) => { setSelectedAchat(achat); setShowViewModal(true); }, []);
  const handleEditAchat = useCallback((achat: any) => { setEditingAchat(achat); setShowFormModal(true); }, []);
  const handleDeleteClick = useCallback((achat: any) => { setDeleteTarget(achat); setShowDeleteModal(true); }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteAchat(deleteTarget.id);
      showSuccess('Achat supprimé', 'L\'achat a été supprimé avec succès.');
    } catch (error: any) { showError('Erreur', error?.message || 'Impossible de supprimer.'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  }, [deleteTarget, deleteAchat, showSuccess, showError]);

  const openDetailsModal = useCallback(async (achat: any) => {
    try {
      setLoadingDetails(true);
      setShowViewModal(true);
      const result = await window.api.achats.getDetails(achat.id);
      if (!result?.success) throw new Error(result?.error || 'Impossible de charger les détails');
      setSelectedAchat({ ...achat, ...result.data.achat, details: result.data.details || [] });
    } catch (err) { setSelectedAchat({ ...achat, details: [] }); }
    finally { setLoadingDetails(false); }
  }, []);

  const handleOpenAddModal = useCallback(() => {
    setEditingAchat(null); setSelectedFournisseurId(null); setSelectedProduits([]); setMontantPaye(0); setTvaOverride(null);
    setFraisLivraison(0); setModePaiement('Espèces'); setModaliteValue(0); setModaliteUnit('jours');
    setShowFormModal(true);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setShowFormModal(false); setEditingAchat(null); setSelectedFournisseurId(null); setSelectedProduits([]); setMontantPaye(0); setTvaOverride(null);
    setFraisLivraison(0); setModePaiement('Espèces'); setModaliteValue(0); setModaliteUnit('jours');
  }, []);

  const handleAddProduit = useCallback((id: number, quantite: number) => {
    setSelectedProduits(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) return prev.map(item => item.id === id ? { ...item, quantite: item.quantite + quantite } : item);
      return [...prev, { id, quantite }];
    });
  }, []);

  const handleUpdateQuantite = useCallback((id: number, quantite: number) => {
    setSelectedProduits(prev => prev.map(item => item.id === id ? { ...item, quantite } : item));
  }, []);

  const handleRemoveProduit = useCallback((id: number) => {
    setSelectedProduits(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleClearPanier = useCallback(() => { setSelectedProduits([]); }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFournisseurId || selectedProduits.length === 0) return;

    const totalHTProduits = selectedProduits.reduce((sum, item) => {
      const product = produits.find((p) => p.id === item.id);
      return sum + (product ? product.prix_achat * item.quantite : 0);
    }, 0);

    const totalHT = totalHTProduits + Number(fraisLivraison || 0);

    const totalTVA = selectedProduits.reduce((sum, item) => {
      const product = produits.find((p) => p.id === item.id);
      const productRate = Number(product?.tva_rate) || 0;
      const rate = tvaOverride !== null ? tvaOverride : productRate;
      return sum + ((product?.prix_achat || 0) * item.quantite * rate);
    }, 0);

    const totalTTC = totalHT + totalTVA;
    const safeMontantPaye = Math.max(0, Math.min(Number(montantPaye || 0), totalTTC));
    const montantRestant = Math.max(0, totalTTC - safeMontantPaye);
    const statutPaiement = safeMontantPaye <= 0 ? 'Non payé' : safeMontantPaye >= totalTTC ? 'Payé' : 'Partiel';
    const designation = selectedProduits.map(item => {
      const product = produits.find((p) => p.id === item.id);
      return product ? product.nom : '';
    }).filter(Boolean).join(', ');

    const modalitePaiement = modaliteValue > 0 ? `${modaliteValue} ${modaliteUnit}` : 'Immediat';

    const data = {
      fournisseur_id: selectedFournisseurId,
      date_achat: new Date().toISOString().split('T')[0],
      reference: '',
      total_ht: totalHT,
      total_ttc: totalTTC,
      designation,
      nombre_produits: selectedProduits.length,
      statut_paiement: statutPaiement,
      montant_paye: safeMontantPaye,
      montant_restant: montantRestant,
      tva_rate: tvaOverride ?? undefined,
      mode_paiement: modePaiement,
      modalite_paiement: modalitePaiement,
      frais_livraison: fraisLivraison,
      details: selectedProduits.map(item => {
        const product = produits.find((p) => p.id === item.id);
        const rate = tvaOverride !== null ? tvaOverride : (product?.tva_rate || 0);
        return {
          produit_id: item.id,
          quantite: item.quantite,
          prix_unitaire: product?.prix_achat || 0,
          total: (product?.prix_achat || 0) * item.quantite,
          tva_rate: rate
        };
      })
    };
    try {
      if (editingAchat) { await updateAchat(editingAchat.id, data); showSuccess('Achat modifié', 'L\'achat a été modifié avec succès.'); }
      else { await createAchat(data); showSuccess('Achat créé', 'L\'achat a été enregistré avec succès.'); }
      setShowFormModal(false); setEditingAchat(null); setSelectedFournisseurId(null); setSelectedProduits([]); setMontantPaye(0); setTvaOverride(null);
      setFraisLivraison(0); setModePaiement('Espèces'); setModaliteValue(0); setModaliteUnit('jours');
    } catch (error: any) { showError('Erreur', error?.message || 'Une erreur est survenue.'); }
  }, [editingAchat, selectedFournisseurId, selectedProduits, produits, createAchat, updateAchat, showSuccess, showError, montantPaye, tvaOverride, fraisLivraison, modePaiement, modaliteValue, modaliteUnit]);

  const handleDownloadPDF = useCallback(async (achat: any) => {
    try {
      let achatDetails = achat.details;
      if (!achatDetails || achatDetails.length === 0) {
        const result = await window.api.achats.getDetails(achat.id);
        if (result?.success) achatDetails = result.data.details || [];
      }
      achatDetails = achatDetails.map((detail: any) => {
        if (detail.tva_rate === null || detail.tva_rate === undefined) {
          const product = produits.find((p: any) => p.id === detail.produit_id);
          return { ...detail, tva_rate: product?.tva_rate ?? 0 };
        }
        return detail;
      });
      setAchatForInvoice({ ...achat, details: achatDetails });
      setShowCompanyModal(true);
    } catch (err) { showError('Erreur', 'Impossible de générer le PDF.'); }
  }, [produits, showError]);

  const handleCompanyModalGenerate = useCallback(async (dataFromModal?: any) => {
    if (!achatForInvoice) return;
    setGeneratingPDF(true);
    try {
      const companyData = dataFromModal || company;
      const result = await downloadAchatPDF({
        achat: achatForInvoice,
        fournisseurName: achatForInvoice.fournisseur_nom || 'Fournisseur',
        companyName: companyData?.name || "Lifes-Art",
        companyAddress: companyData?.address || '',
        companyPhone: companyData?.phone || '',
        companyEmail: companyData?.email || '',
        companySiret: companyData?.siret || '',
        companyTaxId: companyData?.taxId || '',
        companyRcs: companyData?.rcs || '',
        companyVatNumber: companyData?.vatNumber || '',
        montantPaye: achatForInvoice.montant_paye || 0,
      });
      if (result?.canceled) { /* ok */ }
      else if (result?.success) { showSuccess('PDF généré', 'Facture fournisseur enregistrée.'); }
      else { showError('Erreur', result?.error || 'Erreur génération PDF.'); }
      return result;
    } catch (error: any) { showError('Erreur', error?.message || 'Erreur génération facture'); return { success: false, error: error?.message }; }
    finally { setGeneratingPDF(false); setShowCompanyModal(false); setAchatForInvoice(null); }
  }, [achatForInvoice, company, showError, showSuccess]);

  // ⭐⭐⭐ VAOVAO: globalStats ho an'ny footer ⭐⭐⭐
  // ⭐ FIX: Fallback amin'ny calcul local raha 0 ny stats avy amin'ny backend
  const globalStats = useMemo(() => {
    const totalAchats = Number(stats?.total || 0) || achats.length;
    const totalMontant = Number(stats?.totalMontant || 0);
    const totalPaye = Number((stats as any)?.totalPaye || 0);
    const totalReste = Number((stats as any)?.totalReste || Math.max(0, totalMontant - totalPaye));
    const totalProduits = Number((stats as any)?.totalProduits || 0);
    
    // ⭐ Fallback local raha 0 ny an'ny backend
    const backendPayees = Number((stats as any)?.payes || (stats as any)?.payees || 0);
    const backendPartiel = Number((stats as any)?.partiel || (stats as any)?.partiels || 0);
    const backendNonPayees = Number((stats as any)?.nonPayes || (stats as any)?.nonPayees || 0);

    const localPayees = achats.filter(a => {
      const paye = Number(a.montant_paye) || 0;
      const ttc = Number(a.total_ttc) || 0;
      return paye >= ttc && ttc > 0;
    }).length;
    const localPartiel = achats.filter(a => {
      const paye = Number(a.montant_paye) || 0;
      const ttc = Number(a.total_ttc) || 0;
      return paye > 0 && paye < ttc;
    }).length;
    const localNonPayees = achats.filter(a => (Number(a.montant_paye) || 0) <= 0).length;

    const payees = backendPayees > 0 ? backendPayees : (achats.length > 0 ? localPayees : 0);
    const partiel = backendPartiel > 0 ? backendPartiel : (achats.length > 0 ? localPartiel : 0);
    const nonPayees = backendNonPayees > 0 ? backendNonPayees : (achats.length > 0 ? localNonPayees : 0);

    return {
      total: totalAchats,
      totalMontant,
      totalPaye,
      totalReste,
      totalProduits,
      payees,
      partiel,
      nonPayees,
    };
  }, [stats, achats]);

  // ⭐⭐⭐ VAOVAO: hasActiveFilter ⭐⭐⭐
  const hasActiveFilter = useMemo(
    () => Boolean(searchInput.trim()),
    [searchInput]
  );

  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0';
  const shadow = isDark ? '0 4px 24px -4px rgba(0,0,0,0.35)' : '0 4px 20px -4px rgba(79,70,229,0.08)';

  return (
    <main className="min-h-full w-full transition-colors duration-300" style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">

        <AchatsHeader onAddAchat={handleOpenAddModal} onExport={handleExport} refreshing={refreshing} onRefresh={() => loadAchats(true)} totalItems={totalItems} />

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Package size={20} strokeWidth={2.2} />}
            label="Total achats"
            value={stats.total}
            accentKey="total"
          />
          <StatCard
            icon={<Wallet size={20} strokeWidth={2.2} />}
            label="Montant total"
            value={`${stats.totalMontant.toLocaleString('fr-FR')} Ar`}
            accentKey="montant"
          />
          <StatCard
            icon={<Users size={20} strokeWidth={2.2} />}
            label="Fournisseurs"
            value={stats.totalFournisseurs}
            accentKey="fournisseurs"
          />
          <StatCard
            icon={<AlertCircle size={20} strokeWidth={2.2} />}
            label="Non payés"
            value={stats.nonPayes}
            accentKey="nonPayes"
          />
        </div>

        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
            <input
              type="text"
              placeholder="Rechercher un achat..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="h-10 w-full rounded-xl border bg-white pl-9 pr-9 text-[13px] outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/[0.18]"
              style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadAchats(true)}
              disabled={refreshing}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-brand-500/20 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-400"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-2xl border transition-all duration-300" style={{ background: cardBg, borderColor, boxShadow: shadow }}>
          {refreshing && (
            <div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent">
              <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" />
            </div>
          )}
          {loading && achats.length === 0 ? (
            <AchatsSkeleton isDark={isDark} />
          ) : (
            <AchatsTable
              achats={achats}
              onView={openDetailsModal}
              onEdit={handleEditAchat}
              onDelete={handleDeleteClick}
              onAdd={handleOpenAddModal}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onBulkDelete={handleBulkDelete}
              onUpdatePaiement={handleUpdatePaiement}
              onDownloadPDF={handleDownloadPDF}
              onConvertToInvoice={handleConvertToInvoice}
              // ⭐⭐⭐ VAOVAO: Global stats + filter flag
              globalStats={globalStats}
              hasActiveFilter={hasActiveFilter}
            />
          )}
        </section>

        {!loading && totalItems > 0 && (
          <div
            className="flex items-center justify-between rounded-2xl border px-3 py-2.5 transition-all duration-300"
            style={{ background: cardBg, borderColor, boxShadow: isDark ? '0 2px 12px -2px rgba(0,0,0,0.25)' : '0 2px 10px -2px rgba(79,70,229,0.06)' }}
          >
            <AchatsPagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      <AchatsModalForm
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        onSubmit={handleSubmit}
        editingAchat={editingAchat}
        fournisseurs={fournisseurs}
        produits={produits}
        isDark={isDark}
        selectedFournisseurId={selectedFournisseurId}
        onFournisseurChange={setSelectedFournisseurId}
        selectedProduits={selectedProduits}
        onAddProduit={handleAddProduit}
        onUpdateQuantite={handleUpdateQuantite}
        onRemoveProduit={handleRemoveProduit}
        onClearPanier={handleClearPanier}
        montantPaye={montantPaye}
        onMontantPayeChange={setMontantPaye}
        tvaOverride={tvaOverride}
        onTvaRateChange={setTvaOverride}
        fraisLivraison={fraisLivraison}
        onFraisLivraisonChange={setFraisLivraison}
        modePaiement={modePaiement}
        onModePaiementChange={setModePaiement}
        modaliteValue={modaliteValue}
        onModaliteValueChange={setModaliteValue}
        modaliteUnit={modaliteUnit}
        onModaliteUnitChange={setModaliteUnit}
      />

      {showViewModal && selectedAchat && (
        <AchatsViewModal
          achat={selectedAchat}
          loadingDetails={loadingDetails}
          onClose={() => setShowViewModal(false)}
          onEdit={() => { setShowViewModal(false); handleEditAchat(selectedAchat); }}
          onGeneratePDF={() => handleDownloadPDF(selectedAchat)}
          isDark={isDark}
        />
      )}

      <CompanySettingsModal
        isOpen={showCompanyModal}
        onClose={() => { setShowCompanyModal(false); setAchatForInvoice(null); }}
        onSave={() => { setShowCompanyModal(false); setAchatForInvoice(null); }}
        onGenerate={handleCompanyModalGenerate}
        mode="generate"
        isDark={isDark}
        initialData={company}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        title="Suppression"
        message={`Supprimer "${deleteTarget?.reference || ''}" ?`}
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
        message={`Supprimer ${bulkDeleteTargetIds.length} achat(s) ?`}
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

export default Achats;