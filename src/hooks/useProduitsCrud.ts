
import { useState, useCallback } from 'react';
import { Produit } from '../types/produit';

export const useProduitsCrud = (
  invokeApi: (channel: string, ...args: any[]) => Promise<any>,
  loadImageUrl: (produit: { id: number; image: string }) => Promise<void>,
  resetImageState: () => void
) => {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Produit | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleViewProduit = useCallback(async (id: number) => {
    try {
      const result = await invokeApi('products:get-by-id', id);
      if (!result?.success) throw new Error(result?.error || 'Produit non trouvé');
      const produit = result.data;
      if (produit) {
        if (produit.image) await loadImageUrl(produit);
        setSelectedProduit(produit);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('❌ Erreur chargement produit:', error);
      throw error;
    }
  }, [invokeApi, loadImageUrl]);

  const handleEditProduit = useCallback(async (produit: Produit) => {
    setEditingProduit(produit);
    resetImageState();
    if (produit.image) {
      try {
        const result = await invokeApi('images:get-url', produit.image);
        const url = result?.success ? result.data : (typeof result === 'string' ? result : null);
        if (url) setImagePreview(url);
      } catch (error) {
        console.error('❌ Erreur chargement image existante:', error);
      }
    }
    setShowModal(true);
  }, [resetImageState, invokeApi]);

  const handleDeleteClick = useCallback((produit: Produit) => {
    setDeleteTarget(produit);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.image) {
        try { await invokeApi('images:delete', deleteTarget.image); } catch (_) {}
      }
      const result = await invokeApi('products:delete', deleteTarget.id);
      if (!result?.success) throw new Error(result?.error || 'Erreur suppression');

      return result;
    } catch (error: any) {
      console.error('❌ Erreur suppression:', error);
      throw new Error(error.message || 'Erreur inconnue');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, invokeApi]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const data = {
        code: formData.get('code') as string,
        nom: formData.get('nom') as string,
        description: formData.get('description') as string,
        categorie_id: parseInt(formData.get('categorie_id') as string) || null,
        fournisseur_id: parseInt(formData.get('fournisseur_id') as string) || null,
        prix_achat: parseFloat(formData.get('prix_achat') as string) || 0,
        prix_vente: parseFloat(formData.get('prix_vente') as string) || 0,
        quantite_stock: parseInt(formData.get('quantite_stock') as string) || 0,
        quantite_minimale: parseInt(formData.get('quantite_minimale') as string) || 5,
        unite: formData.get('unite') as string || 'pièce',
        status: formData.get('status') as string || 'actif',
        image: imagePath || null,
      };

      let result;
      if (editingProduit) {
        result = await invokeApi('products:update', editingProduit.id, data);
        if (!result?.success) throw new Error(result?.error || 'Erreur mise à jour');
      } else {
        result = await invokeApi('products:create', data);
        if (!result?.success) throw new Error(result?.error || 'Erreur création');
      }

      setShowModal(false);
      resetImageState();

      return result;
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde produit:', error);
      throw new Error(error.message || 'Erreur lors de la sauvegarde');
    }
  }, [editingProduit, imagePath, resetImageState, invokeApi]);

  return {
    showModal,
    showViewModal,
    showStatsModal,
    showDeleteModal,
    selectedProduit,
    editingProduit,
    deleteTarget,
    imagePath,
    imagePreview,
    setShowModal,
    setShowViewModal,
    setShowStatsModal,
    setShowDeleteModal,
    setSelectedProduit,
    setEditingProduit,
    setDeleteTarget,
    setImagePath,
    setImagePreview,
    handleViewProduit,
    handleEditProduit,
    handleDeleteClick,
    handleConfirmDelete,
    handleSubmit,
  };
};