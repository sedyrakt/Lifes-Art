// src/pages/commandes/useCommandesPageModals.ts
import { useCallback, useState } from 'react';

/**
 * ⭐ States + handlers rehetra ho an'ny modals sy notifications
 */
export const useCommandesPageModals = () => {
  // ═══ Modals ═══
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [commandeForInvoice, setCommandeForInvoice] = useState<any>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [montantPayeModal, setMontantPayeModal] = useState(0);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteTargetIds, setBulkDeleteTargetIds] = useState<number[]>([]);
  const [showOverdueModal, setShowOverdueModal] = useState(false);

  // ═══ Helpers ═══
  const showSuccess = useCallback((t: string, m: string) => {
    setSuccessTitle(t);
    setSuccessMessage(m);
    setShowSuccessModal(true);
  }, []);

  const showError = useCallback((t: string, m: string) => {
    setErrorTitle(t);
    setErrorMessage(m);
    setShowErrorModal(true);
  }, []);

  // ═══ Selection ═══
  const handleSelectAll = useCallback((checked: boolean, commandes: any[]) => {
    setSelectedIds(checked ? new Set(commandes.map((c: any) => Number(c.id))) : new Set());
  }, []);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      checked ? n.add(id) : n.delete(id);
      return n;
    });
  }, []);

  // ═══ Modals handlers ═══
  const openDeleteModal = useCallback((commande: any) => {
    setDeleteTarget(commande);
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }, []);

  const openBulkDeleteModal = useCallback((ids: number[]) => {
    setBulkDeleteTargetIds(ids);
    setShowBulkDeleteModal(true);
  }, []);

  const closeBulkDeleteModal = useCallback(() => {
    setShowBulkDeleteModal(false);
    setBulkDeleteTargetIds([]);
  }, []);

  const openViewModal = useCallback((commande: any) => {
    setSelectedCommande(commande);
    setShowViewModal(true);
  }, []);

  const closeViewModal = useCallback(() => {
    setShowViewModal(false);
    setSelectedCommande(null);
  }, []);

  const openCompanyModal = useCallback((commandeForInvoice: any) => {
    setCommandeForInvoice(commandeForInvoice);
    setShowCompanyModal(true);
  }, []);

  const closeCompanyModal = useCallback(() => {
    setShowCompanyModal(false);
    setCommandeForInvoice(null);
  }, []);

  const openOverdueModal = useCallback(() => {
    setShowOverdueModal(true);
  }, []);

  const closeOverdueModal = useCallback(() => {
    setShowOverdueModal(false);
  }, []);

  const closeSuccessModal = useCallback(() => setShowSuccessModal(false), []);
  const closeErrorModal = useCallback(() => setShowErrorModal(false), []);

  return {
    // States
    showModal, setShowModal,
    showViewModal, setShowViewModal,
    selectedCommande, setSelectedCommande,
    deleteTarget, setDeleteTarget,
    showDeleteModal, setShowDeleteModal,
    showSuccessModal, setShowSuccessModal,
    successTitle, successMessage,
    showErrorModal, setShowErrorModal,
    errorTitle, errorMessage,
    selectedIds, setSelectedIds,
    showCompanyModal, setShowCompanyModal,
    commandeForInvoice, setCommandeForInvoice,
    generatingPDF, setGeneratingPDF,
    montantPayeModal, setMontantPayeModal,
    showBulkDeleteModal, setShowBulkDeleteModal,
    bulkDeleteTargetIds, setBulkDeleteTargetIds,
    showOverdueModal, setShowOverdueModal,
    // Helpers
    showSuccess, showError,
    // Selection
    handleSelectAll, handleSelectOne,
    // Modal open/close
    openDeleteModal, closeDeleteModal,
    openBulkDeleteModal, closeBulkDeleteModal,
    openViewModal, closeViewModal,
    openCompanyModal, closeCompanyModal,
    openOverdueModal, closeOverdueModal,
    closeSuccessModal, closeErrorModal,
  };
};