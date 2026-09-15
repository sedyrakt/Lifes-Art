// src/pages/produits/useProduitsCommandeModal.ts
import { useCallback, useState } from 'react';

interface UseProduitsCommandeModalParams {
  showError: (t: string, m: string) => void;
  showSuccess: (t: string, m: string) => void;
}

export const useProduitsCommandeModal = ({ showError, showSuccess }: UseProduitsCommandeModalParams) => {
  const [commandeClients, setCommandeClients] = useState<any[]>([]);
  const [commandeProduits, setCommandeProduits] = useState<any[]>([]);
  const [commandeSelectedClientId, setCommandeSelectedClientId] = useState<number | null>(null);
  const [commandeSelectedProduits, setCommandeSelectedProduits] = useState<
    { id: number; quantite: number; prix_unitaire?: number }[]
  >([]);
  const [showCommandeModal, setShowCommandeModal] = useState(false);
  const [montantPayeCommande, setMontantPayeCommande] = useState(0);
  const [commandeLoading, setCommandeLoading] = useState(false);

  const loadCommandeReferences = useCallback(async () => {
    setCommandeLoading(true);
    try {
      const [clientsRes, produitsRes] = await Promise.all([
        window.api.clients.getAll({ limit: 1000 }),
        window.api.products.getAll({ status: 'actif', limit: 500 }),
      ]);
      if (clientsRes?.success) setCommandeClients(clientsRes.data || []);
      if (produitsRes?.success) setCommandeProduits(produitsRes.data || []);
    } catch (err) {
      console.error('❌ [Produits] Erreur chargement commande refs:', err);
      showError('Erreur', 'Impossible de charger les clients et produits.');
    } finally {
      setCommandeLoading(false);
    }
  }, [showError]);

  const handleNewCommande = useCallback(async (produit: any) => {
    if (!produit?.id) return;
    try {
      await loadCommandeReferences();
      setCommandeSelectedProduits([
        { id: Number(produit.id), quantite: 1, prix_unitaire: Number(produit.prix_vente) || 0 },
      ]);
      setMontantPayeCommande(0);
      setCommandeSelectedClientId(null);
      setShowCommandeModal(true);
    } catch (err: any) {
      showError('Erreur de chargement', err?.message || 'Impossible de charger les clients et produits.');
    }
  }, [loadCommandeReferences, showError]);

  const handleAddProduitCommande = useCallback((id: number, quantite: number, prix_unitaire?: number) => {
    setCommandeSelectedProduits(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, quantite: item.quantite + quantite } : item);
      }
      return [...prev, { id, quantite, prix_unitaire: prix_unitaire || 0 }];
    });
  }, []);

  const handleUpdateQuantiteCommande = useCallback((id: number, quantite: number) => {
    setCommandeSelectedProduits(prev => prev.map(item => item.id === id ? { ...item, quantite } : item));
  }, []);

  const handleRemoveProduitCommande = useCallback((id: number) => {
    setCommandeSelectedProduits(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleClearPanierCommande = useCallback(() => {
    setCommandeSelectedProduits([]);
    setCommandeSelectedClientId(null);
    setMontantPayeCommande(0);
  }, []);

  const handleSubmitCommande = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commandeSelectedClientId) { showError('Client requis', 'Sélectionnez un client.'); return; }
    if (!commandeSelectedProduits.length) { showError('Panier vide', 'Ajoutez au moins un produit.'); return; }

    const client = commandeClients.find(c => Number(c.id) === Number(commandeSelectedClientId));
    if (!client) { showError('Client introuvable', 'Client non trouvé.'); return; }

    let totalHT = 0;
    let totalTVA = 0;
    const productDetails = commandeSelectedProduits.map(item => {
      const produit = commandeProduits.find(p => Number(p.id) === Number(item.id));
      if (!produit) throw new Error(`Produit ${item.id} non trouvé`);
      const quantity = Number(item.quantite);
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Quantité invalide pour ${produit.nom}`);
      if (quantity > Number(produit.quantite_stock || 0)) throw new Error(`Stock insuffisant pour ${produit.nom}`);
      const lineTotal = quantity * Number(produit.prix_vente || 0);
      totalHT += lineTotal;
      const rate = (produit.tva_rate !== undefined && produit.tva_rate !== null && produit.tva_rate !== '') ? Number(produit.tva_rate) : 0.2;
      totalTVA += lineTotal * rate;
      return { id: produit.id, name: produit.nom, price: Number(produit.prix_vente || 0), quantity, tva_rate: rate };
    });

    const totalTTC = totalHT + totalTVA;
    const montantPaye = Math.max(0, Math.min(totalTTC, Number(montantPayeCommande || 0)));
    const statutPaiement = montantPaye <= 0 ? 'Non payé' : montantPaye >= totalTTC ? 'Payé' : 'Partiel';
    const montantRestant = Math.max(0, totalTTC - montantPaye);

    const payload = {
      client_nom: client.nom,
      client_id: Number(commandeSelectedClientId),
      products: productDetails,
      total_ht: totalHT,
      total_ttc: totalTTC,
      statut_paiement: statutPaiement,
      montant_paye: montantPaye,
      montant_restant: montantRestant,
    };

    try {
      const result = await window.api.orders.create(payload);
      if (!result?.success) throw new Error(result?.error || 'Erreur création commande');
      showSuccess('Commande créée', 'Commande enregistrée.');
      setShowCommandeModal(false);
      handleClearPanierCommande();
    } catch (err: any) {
      showError('Erreur', err?.message || 'Impossible de créer la commande.');
    }
  }, [
    commandeSelectedClientId, commandeSelectedProduits, commandeClients, commandeProduits,
    montantPayeCommande, showError, showSuccess, handleClearPanierCommande,
  ]);

  return {
    commandeClients,
    commandeProduits,
    commandeSelectedClientId, setCommandeSelectedClientId,
    commandeSelectedProduits, setCommandeSelectedProduits,
    showCommandeModal, setShowCommandeModal,
    montantPayeCommande, setMontantPayeCommande,
    commandeLoading,
    loadCommandeReferences,
    handleNewCommande,
    handleAddProduitCommande,
    handleUpdateQuantiteCommande,
    handleRemoveProduitCommande,
    handleClearPanierCommande,
    handleSubmitCommande,
  };
};