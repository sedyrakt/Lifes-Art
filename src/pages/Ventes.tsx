// src/pages/Ventes.tsx
// ⭐ FIX: VentesStats mampiasa ventesStats (avy amin'ny devis + factures)
// ⭐ VAOVAO: globalStats ho an'ny VentesTable (footer global + badges colorés)
// ⭐ VAOVAO: Mode paiement + Modalité + Frais livraison (FACTURE ihany)
// ⭐ FIX: key={activeTab} amin'ny VentesModalForm mba force re-mount rehefa miova tab
// ⭐ FIX CRITIQUE: Kajy totalTVA marina avy amin'ny produit.tva_rate (fa tsy coefficient 1.2 fixe)

import React, { useCallback, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Search } from 'lucide-react';
import VentesHeader from '../components/ventes/VentesHeader';
import VentesStats from '../components/ventes/VentesStats';
import { VentesTable, VentesModalForm, VentesViewModal, VentesPagination } from '../components/ventes';
import CompanySettingsModal from '../components/company/CompanySettingsModal';
import { useCompany } from '../contexts/CompanyContext';
import ConfirmModal from '../components/common/ConfirmModal';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';
import { useVentesData, ExportPeriod } from '../hooks/useVentesData';
import { downloadVentePDF } from '../lib/ventesPDFService';

interface SelectedProduct { id: number; quantite: number; prix_unitaire: number; total: number; }

const VentesSkeleton = ({ isDark }: { isDark: boolean }) => {
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

const Ventes: React.FC = () => {
  const { isDark } = useTheme();
  const { company } = useCompany();

  const {
    devisList, factures, clients, produits, loading, refreshing,
    searchTerm, setSearchTerm, totalDevis, totalFactures,
    currentPage, setCurrentPage, totalPages,
    viewItem, setViewItem, viewDetails, setViewDetails,
    loadingDetails, setLoadingDetails, refresh,
    createDevis, createFacture, convertDevisToFacture, deleteDevis, deleteFacture,
    detteStats,
    ventesStats,
    getDevisDetails, getFactureDetails,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
  } = useVentesData();

  const [activeTab, setActiveTab] = useState<'devis' | 'factures'>('devis');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteTargetIds, setBulkDeleteTargetIds] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedProduits, setSelectedProduits] = useState<SelectedProduct[]>([]);
  const [montantPaye, setMontantPaye] = useState(0);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [venteForInvoice, setVenteForInvoice] = useState<any>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const [formData, setFormData] = useState({
    reference: '',
    observation: '',
    validite_jours: 30,
    mode_paiement: 'Espèces',
    modalite_value: 0,
    modalite_unit: 'jours',
    modalite_paiement: 'Immediat',
    frais_livraison: 0,
  });

  const showError = useCallback((message: string) => { setErrorMessage(message); setShowErrorModal(true); }, []);

  const calculateTotalsFromDetails = useCallback((details: any[]) => {
    let totalHT = 0;
    let totalTVA = 0;

    for (const d of details) {
      const produit = produits.find((p: any) => Number(p.id) === Number(d.produit_id));
      const rate = (produit?.tva_rate !== undefined && produit?.tva_rate !== null && produit?.tva_rate !== '')
        ? Number(produit.tva_rate)
        : 0;
      const lineHT = Number(d.quantite) * Number(d.prix_unitaire);
      totalHT += lineHT;
      totalTVA += lineHT * rate;
    }

    return {
      totalHT: Number(totalHT.toFixed(2)),
      totalTVA: Number(totalTVA.toFixed(2)),
      totalTTC: Number((totalHT + totalTVA).toFixed(2)),
    };
  }, [produits]);

  const handleExport = useCallback(async (format: 'excel' | 'pdf' | 'csv', period: ExportPeriod, customDate: string) => {
    try {
      let result;
      if (format === 'excel') result = await exportToExcel(period, customDate);
      else if (format === 'pdf') result = await exportToPDF(period, customDate);
      else result = await exportToCSV(period, customDate);

      if (result?.canceled) return;
      if (result?.success === false) { showError(result.error || 'Impossible d\'exporter les données.'); return; }

      setShowSuccessModal(true);
    } catch (error: any) { showError(error?.message || 'Impossible d\'exporter les données.'); }
  }, [exportToExcel, exportToPDF, exportToCSV, showError]);

  const handleAddProduit = useCallback((id: number, quantite: number, prix_unitaire: number) => {
    setSelectedProduits(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        const newQuantite = existing.quantite + quantite;
        return prev.map(item => item.id === id ? { ...item, quantite: newQuantite, total: newQuantite * item.prix_unitaire } : item);
      }
      return [...prev, { id, quantite, prix_unitaire, total: quantite * prix_unitaire }];
    });
  }, []);

  const handleUpdateQuantite = useCallback((id: number, quantite: number) => {
    setSelectedProduits(prev => prev.map(item => item.id === id ? { ...item, quantite, total: quantite * item.prix_unitaire } : item));
  }, []);

  const handleRemoveProduit = useCallback((id: number) => {
    setSelectedProduits(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleClearPanier = useCallback(() => { setSelectedProduits([]); }, []);

  const resetForm = useCallback(() => {
    setSelectedClientId(null);
    setSelectedProduits([]);
    setFormData({
      reference: '',
      observation: '',
      validite_jours: 30,
      mode_paiement: 'Espèces',
      modalite_value: 0,
      modalite_unit: 'jours',
      modalite_paiement: 'Immediat',
      frais_livraison: 0,
    });
    setMontantPaye(0);
  }, []);

  const buildDetails = useCallback(() => {
    return selectedProduits
      .filter(item => Number(item.id) > 0 && Number(item.quantite) > 0)
      .map(item => ({
        produit_id: Number(item.id),
        quantite: Number(item.quantite),
        prix_unitaire: Number(item.prix_unitaire) || 0,
        total: Number(item.quantite) * Number(item.prix_unitaire || 0)
      }));
  }, [selectedProduits]);

  const handleCreateDevis = async () => {
    try {
      const details = buildDetails();
      if (details.length === 0) { showError('Veuillez ajouter au moins un produit'); return; }
      if (!selectedClientId) { showError('Veuillez sélectionner un client'); return; }
      const client = clients.find(c => Number(c.id) === Number(selectedClientId));
      if (!client) { showError('Client introuvable'); return; }

      const totals = calculateTotalsFromDetails(details);

      const safeMontantPaye = Math.max(0, Math.min(Number(montantPaye || 0), totals.totalTTC));
      const statutPaiement = safeMontantPaye <= 0 ? 'Non payé' : safeMontantPaye >= totals.totalTTC ? 'Payé' : 'Partiel';
      const validiteJours = Number(formData.validite_jours) || 30;

      const data = {
        client_id: Number(selectedClientId),
        client_nom: client.nom || '',
        reference: formData.reference.trim(),
        total_ht: totals.totalHT,
        total_ttc: totals.totalTTC,
        montant_paye: safeMontantPaye,
        statut_paiement: statutPaiement,
        observation: formData.observation.trim(),
        validite_jours: validiteJours,
        details,
      };
      const result = await createDevis(data);
      if (result?.success) { setShowFormModal(false); resetForm(); setShowSuccessModal(true); await refresh(); }
      else { showError(result?.error || 'Erreur création devis'); }
    } catch (err: any) { console.error('[VENTES] Erreur création devis:', err); showError(err?.message || 'Erreur création devis'); }
  };

  const handleCreateFacture = async () => {
    try {
      const details = buildDetails();
      if (details.length === 0) { showError('Veuillez ajouter au moins un produit'); return; }
      if (!selectedClientId) { showError('Veuillez sélectionner un client'); return; }
      const client = clients.find(c => Number(c.id) === Number(selectedClientId));
      if (!client) { showError('Client introuvable'); return; }

      const totals = calculateTotalsFromDetails(details);
      const fraisLivraison = Number(formData.frais_livraison) || 0;
      const totalHTFinal = totals.totalHT + fraisLivraison;
      const totalTTCFinal = totalHTFinal + totals.totalTVA;

      const safeMontantPaye = Math.max(0, Math.min(Number(montantPaye || 0), totalTTCFinal));
      const statutPaiement = safeMontantPaye <= 0 ? 'Non payé' : safeMontantPaye >= totalTTCFinal ? 'Payé' : 'Partiel';

      const data = {
        client_id: Number(selectedClientId),
        client_nom: client.nom || '',
        reference: formData.reference.trim(),
        total_ht: totalHTFinal,
        total_ttc: totalTTCFinal,
        montant_paye: safeMontantPaye,
        statut_paiement: statutPaiement,
        observation: formData.observation.trim(),
        mode_paiement: formData.mode_paiement || 'Espèces',
        modalite_paiement: formData.modalite_paiement || 'Immediat',
        frais_livraison: fraisLivraison,
        details,
      };
      const result = await createFacture(data);
      if (result?.success) { setShowFormModal(false); resetForm(); setShowSuccessModal(true); await refresh(); }
      else { showError(result?.error || 'Erreur création facture'); }
    } catch (err: any) { console.error('[VENTES] Erreur création facture:', err); showError(err?.message || 'Erreur création facture'); }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (activeTab === 'devis') { void handleCreateDevis(); } else { void handleCreateFacture(); } };

  const handleConvertDevisToFacture = async (devis: any) => {
    try {
      if (!devis?.id) { showError('Devis invalide'); return; }
      const result = await convertDevisToFacture(Number(devis.id));
      if (result?.success) { setShowViewModal(false); setShowSuccessModal(true); await refresh(); }
      else { showError(result?.error || 'Erreur conversion devis'); }
    } catch (err: any) { console.error('[VENTES] Erreur conversion:', err); showError(err?.message || 'Erreur conversion devis'); }
  };

  const handleView = useCallback(async (item: any) => {
    try {
      if (!item?.id) return;
      if (activeTab === 'devis') { await getDevisDetails(item); } else { await getFactureDetails(item); }
      setShowViewModal(true);
    } catch (err) { console.error('[VENTES] Erreur chargement details:', err); setViewDetails([]); }
  }, [activeTab, getDevisDetails, getFactureDetails]);

  const handleUpdatePaiement = useCallback(async (id: number, data: { montant_paye: number; statut_paiement: string }) => {
    try {
      const item = (activeTab === 'devis' ? devisList : factures).find(i => i.id === id);
      const totalTTC = Number(item?.total_ttc || 0);
      const safeMontantPaye = Math.max(0, Math.min(Number(data.montant_paye || 0), totalTTC));
      const result = await window.api.ventes.updatePaiement(id, { ...data, type: activeTab, montant_paye: safeMontantPaye });
      if (result?.success) { setShowSuccessModal(true); await refresh(); }
      else { showError(result?.error || 'Erreur mise à jour paiement'); }
    } catch (err: any) { console.error('[VENTES] Erreur update paiement:', err); showError(err?.message || 'Erreur mise à jour paiement'); }
  }, [refresh, showError, activeTab, devisList, factures]);

  const handleDownloadFacture = useCallback(async (details: any[]) => {
    try {
      if (!viewItem || !viewItem.id) return;

      let safeDetails = Array.isArray(details) ? details : [];
      if (safeDetails.length === 0) {
        const result = await window.api.ventes.getFactureDetails(Number(viewItem.id));
        if (result?.success) safeDetails = result.data.details || [];
      }

      const normalizedDetails = safeDetails.map((d: any) => ({
        ...d,
        tva_rate: (d.tva_rate !== undefined && d.tva_rate !== null && d.tva_rate !== '') ? Number(d.tva_rate) : 0
      }));

      const pdfOptions = {
        clientName: viewItem.client_nom || viewItem.client_name || 'Client',
        clientPhone: viewItem.client_telephone || viewItem.client_phone || '',
        clientAddress: viewItem.client_address || '',
        clientEmail: viewItem.client_email || '',
        vente: { ...viewItem, details: normalizedDetails, products: normalizedDetails },
        type: 'factures' as const,
        montantPaye: Number(viewItem.montant_paye) || 0,
        paymentMethod: viewItem.mode_paiement || 'Espèces',
        paymentTerms: viewItem.modalite_paiement || 'Immediat',
        fraisLivraison: Number(viewItem.frais_livraison) || 0,
      };

      setShowViewModal(false);
      setVenteForInvoice(pdfOptions);
      setShowCompanyModal(true);
    } catch (error: any) {
      console.error('[VENTES] Erreur préparation PDF Facture:', error);
      showError(error?.message || 'Erreur préparation facture');
    }
  }, [viewItem, showError]);

  const handleDownloadDevisPDF = useCallback(async (devis: any) => {
    try {
      if (!devis?.id) return;
      const result = await window.api.ventes.getDevisDetails(Number(devis.id));
      if (!result?.success) { console.error('[VENTES] Impossible charger devis:', result?.error); return; }
      const { devis: dv, details: d } = result.data;

      const pdfOptions = {
        clientName: dv.client_nom || dv.client_name || 'Client',
        clientPhone: dv.client_telephone || dv.client_phone || '',
        clientAddress: dv.client_address || '',
        clientEmail: dv.client_email || '',
        vente: {
          id: dv.id,
          reference: dv.reference,
          client_nom: dv.client_nom,
          client_telephone: dv.client_telephone || '',
          client_email: dv.client_email || '',
          client_address: dv.client_address || '',
          total_ht: dv.total_ht,
          total_ttc: dv.total_ttc,
          date_devis: dv.date_devis,
          statut: dv.statut_paiement || 'Payé',
          validite_jours: dv.validite_jours,
          products: Array.isArray(d) ? d : [],
        },
        type: 'devis' as const,
        montantPaye: Number(dv.montant_paye) || 0,
        validiteJours: Number(dv.validite_jours) || 30,
      };

      setShowViewModal(false);
      setVenteForInvoice(pdfOptions);
      setShowCompanyModal(true);
    } catch (err) { console.error('[VENTES] Erreur Devis PDF:', err); }
  }, []);

  const handleCompanyModalGenerate = useCallback(async (dataFromModal?: any) => {
    if (!venteForInvoice) return;
    setGeneratingPDF(true);
    try {
      const companyData = dataFromModal || company;

      const finalNif = companyData?.nif || companyData?.taxId || companyData?.nifNumber || '';
      const finalStat = companyData?.stat || companyData?.siret || companyData?.statNumber || '';

      const result = await downloadVentePDF({
        vente: venteForInvoice.vente,
        type: venteForInvoice.type,
        clientName: companyData?.clientName || venteForInvoice.clientName || 'Client',
        clientEmail: companyData?.clientEmail || venteForInvoice.clientEmail || '',
        clientPhone: companyData?.clientContact || companyData?.clientPhone || venteForInvoice.clientPhone || '',
        clientAddress: companyData?.clientAddress || venteForInvoice.clientAddress || '',
        clientNif: companyData?.clientNif || '',
        clientStat: companyData?.clientStat || '',
        clientRcs: companyData?.clientRcs || '',
        clientCif: companyData?.clientCif || '',
        clientContact: companyData?.clientContact || '',
        companyName: companyData?.name || companyData?.companyName || "Life's Art",
        companyAddress: companyData?.address || '',
        companyPhone: companyData?.phone || '',
        companyEmail: companyData?.email || '',
        companyNif: finalNif,
        companyStat: finalStat,
        companySiret: finalStat,
        companyTaxId: finalNif,
        companyRcs: companyData?.rcs || '',
        companyVatNumber: companyData?.vatNumber || '',
        companyWebsite: companyData?.website || '',
        paymentMethod: companyData?.paymentMethod || venteForInvoice.paymentMethod || 'Espèces',
        paymentTerms: companyData?.paymentTerms || venteForInvoice.paymentTerms || 'Sous 30 jours',
        montantPaye: Number(venteForInvoice.montantPaye) || 0,
        validiteJours: Number(venteForInvoice?.validiteJours || venteForInvoice?.vente?.validite_jours) || 30,
      }, isDark);

      if (result?.canceled) { }
      else if (result?.success) { setShowSuccessModal(true); }
      else { showError(result?.error || 'Erreur génération PDF'); }
      return result;
    } catch (error: any) {
      showError(error?.message || 'Erreur génération facture');
      return { success: false, error: error?.message };
    } finally {
      setGeneratingPDF(false);
      setShowCompanyModal(false);
      setVenteForInvoice(null);
    }
  }, [venteForInvoice, company, showError, isDark]);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set((activeTab === 'devis' ? devisList : factures).map(i => i.id)) : new Set());
  }, [activeTab, devisList, factures]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => { const n = new Set(prev); if (checked) n.add(id); else n.delete(id); return n; });
  }, []);

  const handleBulkDelete = useCallback((ids: number[]) => { setBulkDeleteTargetIds(ids); setShowBulkDeleteModal(true); }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    try {
      if (!bulkDeleteTargetIds.length) return;
      if (activeTab === 'devis') { for (const id of bulkDeleteTargetIds) { await deleteDevis(id); } }
      else { for (const id of bulkDeleteTargetIds) { await deleteFacture(id); } }
      setSelectedIds(new Set()); setBulkDeleteTargetIds([]); setShowBulkDeleteModal(false); setShowSuccessModal(true); await refresh();
    } catch (err: any) { console.error('[VENTES] Bulk delete error:', err); showError(err?.message || 'Erreur suppression en lot'); }
  }, [activeTab, bulkDeleteTargetIds, deleteDevis, deleteFacture, refresh, showError]);

  // ⭐⭐⭐ VAOVAO: globalStats ho an'ny VentesTable ⭐⭐⭐
  const globalStats = React.useMemo(() => {
    if (activeTab === 'devis') {
      return {
        total: ventesStats.totalDevis || totalDevis,
        totalMontant: ventesStats.caDevis,
        totalPaye: ventesStats.payeDevis,
        totalReste: ventesStats.detteDevis,
        payees: ventesStats.nbPayesDevis,
        partiel: ventesStats.nbPartielsDevis,
        nonPayees: ventesStats.nbNonPayesDevis,
      };
    }
    return {
      total: ventesStats.totalFactures || totalFactures,
      totalMontant: ventesStats.caFactures,
      totalPaye: ventesStats.payeFactures,
      totalReste: ventesStats.detteFactures,
      payees: ventesStats.nbPayesFactures,
      partiel: ventesStats.nbPartielsFactures,
      nonPayees: ventesStats.nbNonPayesFactures,
    };
  }, [activeTab, ventesStats, totalDevis, totalFactures]);

  // ⭐⭐⭐ VAOVAO: hasActiveFilter ⭐⭐⭐
  const hasActiveFilter = React.useMemo(
    () => Boolean(searchTerm.trim()),
    [searchTerm]
  );

  return (
    <main className="min-h-full w-full transition-colors duration-300" style={{ background: isDark ? '#0F172A' : '#EEF2FF' }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-2 py-4 sm:px-3 lg:px-5">

        <VentesHeader
          onAddVente={() => { resetForm(); setShowFormModal(true); }}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          totalItems={activeTab === 'devis' ? totalDevis : totalFactures}
          activeTab={activeTab}
          onExport={handleExport}
        />

        <VentesStats
          totalDevis={ventesStats.totalDevis}
          totalFactures={ventesStats.totalFactures}
          totalCA={ventesStats.caTotal}
          totalItems={ventesStats.articlesVendus}
          totalDette={ventesStats.detteTotal}
          nbFacturesNonPayees={ventesStats.nbNonPayesTotal}
          refreshing={refreshing}
        />

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[13px] text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-100 dark:placeholder:text-slate-500" />
          </div>
        </div>

        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-white/[0.12] dark:bg-[#0F172A]">
          <button type="button" onClick={() => setActiveTab('devis')} className={`flex-1 h-9 rounded-lg px-4 text-[13px] font-semibold transition-all ${activeTab === 'devis' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'}`}>Devis ({totalDevis})</button>
          <button type="button" onClick={() => setActiveTab('factures')} className={`flex-1 h-9 rounded-lg px-4 text-[13px] font-semibold transition-all ${activeTab === 'factures' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'}`}>Factures ({totalFactures})</button>
        </div>

        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_-4px_rgba(79,70,229,0.08)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)]">
          {refreshing && (<div className="absolute left-0 right-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl bg-transparent"><div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" /></div>)}
          {loading && (activeTab === 'devis' ? devisList : factures).length === 0 ? (
            <VentesSkeleton isDark={isDark} />
          ) : (
            <VentesTable
              data={activeTab === 'devis' ? devisList : factures}
              type={activeTab}
              loading={loading}
              onView={handleView}
              onDelete={item => { setDeleteTarget(item); setShowDeleteModal(true); }}
              onAdd={() => { resetForm(); setShowFormModal(true); }}
              onConvertDevisToFacture={handleConvertDevisToFacture}
              onDownloadFacture={handleDownloadFacture}
              onDownloadDevisPDF={handleDownloadDevisPDF}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onBulkDelete={handleBulkDelete}
              onUpdatePaiement={handleUpdatePaiement}
              // ⭐⭐⭐ VAOVAO: globalStats + hasActiveFilter
              globalStats={globalStats}
              hasActiveFilter={hasActiveFilter}
            />
          )}
        </section>

        {!loading && totalPages > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_2px_10px_-2px_rgba(79,70,229,0.06)] transition-all duration-300 dark:border-white/[0.1] dark:bg-[#0F172A] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.25)]">
            <VentesPagination currentPage={currentPage} totalPages={totalPages} totalItems={activeTab === 'devis' ? totalDevis : totalFactures} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      <VentesModalForm
        key={`ventes-modal-${activeTab}`}
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); resetForm(); }}
        onSubmit={handleSubmit}
        type={activeTab}
        clients={clients}
        produits={produits}
        selectedClientId={selectedClientId}
        onClientChange={setSelectedClientId}
        selectedProduits={selectedProduits}
        onAddProduit={handleAddProduit}
        onUpdateQuantite={handleUpdateQuantite}
        onRemoveProduit={handleRemoveProduit}
        onClearPanier={handleClearPanier}
        formData={formData}
        setFormData={setFormData}
        montantPaye={montantPaye}
        onMontantPayeChange={setMontantPaye}
        isDark={isDark}
      />
      {showViewModal && (
        <VentesViewModal
          item={viewItem}
          type={activeTab}
          details={viewDetails}
          loading={loadingDetails}
          onClose={() => setShowViewModal(false)}
          onConvertDevisToFacture={() => handleConvertDevisToFacture(viewItem)}
          onDownloadFacture={handleDownloadFacture}
          onDownloadDevisPDF={() => handleDownloadDevisPDF(viewItem)}
          isDark={isDark}
        />
      )}
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={async () => { try { if (!deleteTarget?.id) return; const result = activeTab === 'devis' ? await deleteDevis(Number(deleteTarget.id)) : await deleteFacture(Number(deleteTarget.id)); if (result?.success !== false) { setShowDeleteModal(false); setDeleteTarget(null); setShowSuccessModal(true); await refresh(); } else { showError(result?.error || 'Erreur suppression'); } } catch (err: any) { console.error('[VENTES] Delete error:', err); showError(err?.message || 'Erreur suppression'); } }} title="Suppression" message={`Supprimer "${deleteTarget?.reference || ''}" ?`} confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />
      <ConfirmModal isOpen={showBulkDeleteModal} onClose={() => { setShowBulkDeleteModal(false); setBulkDeleteTargetIds([]); }} onConfirm={handleConfirmBulkDelete} title="Suppression en lot" message={`Supprimer ${bulkDeleteTargetIds.length} élément(s) ?`} confirmText="Supprimer" cancelText="Annuler" confirmColor="red" isDark={isDark} />
      <CompanySettingsModal isOpen={showCompanyModal} onClose={() => { setShowCompanyModal(false); setVenteForInvoice(null); }} onSave={() => { setShowCompanyModal(false); setVenteForInvoice(null); }} onGenerate={handleCompanyModalGenerate} mode="generate" isDark={isDark} commandeForInvoice={venteForInvoice} initialData={company} onPDFGenerated={(success, filePath) => { if (success) console.log(`Facture enregistrée: ${filePath}`); }} />
      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Succès" message="Opération réussie !" buttonText="OK" autoCloseDelay={3000} />
      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} title="Erreur" message={errorMessage} buttonText="OK" autoCloseDelay={4000} />
    </main>
  );
};

export default Ventes;