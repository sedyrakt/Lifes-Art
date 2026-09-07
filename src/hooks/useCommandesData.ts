// src/hooks/useCommandesData.ts
// ⭐ COMMANDES — COMPACT / PAGE BASED
// ⭐ FIX: TVA DYNAMIQUE (0%, 10%, 20%...)
// ⭐ FIX: FILTRE STATUT NORMALISÉ + CLIENT-SIDE FALLBACK
// ============================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Commande, Client, Produit, DetailCommande, StatutPaiement } from '../types/commandes';
import { downloadPDF } from '../lib/pdfService';
import { CompanyData } from '../components/company';

const ITEMS_PER_PAGE = 8;

interface Produit {
  id: number; nom: string; code: string; prix_vente: number; quantite_stock: number; unite?: string;
  tva_rate?: number;
}

interface DetailCommande {
  id: number; produit_id: number; produit_nom: string; produit_code: string;
  quantite: number; prix_unitaire: number; total_ligne: number;
  tva_rate?: number;
}

const normalizeFilterStatut = (statut: string): string | undefined => {
  if (!statut || statut === 'Tous') return undefined;
  const normalized = statut.toLowerCase();
  if (normalized === 'payé' || normalized === 'paye' || normalized === 'paid' || normalized === 'payee') return 'Payé';
  if (normalized === 'partiel' || normalized === 'partial' || normalized === 'partielle' || normalized === 'partiellement payé') return 'Partiel';
  return 'Non payé';
};

const normalizePaiementStatus = (statut: string): 'Payé' | 'Partiel' | 'Non payé' => {
  const normalized = String(statut || '').trim().toLowerCase();
  switch (normalized) {
    case 'payé': case 'paye': case 'paid': case 'payee': case 'payé complet': case 'paye complet': return 'Payé';
    case 'partiel': case 'partial': case 'partielle': case 'partiellement payé': case 'partiellement paye': return 'Partiel';
    default: return 'Non payé';
  }
};

export const useCommandesData = () => {
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<(isRefresh?: boolean) => Promise<void>>(async () => {});
  const clientsLoaded = useRef(false);
  const produitsLoaded = useRef(false);

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('Tous');
  const [sortOption, setSortOption] = useState('Date (Récent)');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMontantMin, setFilterMontantMin] = useState('');
  const [filterMontantMax, setFilterMontantMax] = useState('');
  const [filterModePaiement, setFilterModePaiement] = useState('');

  const [details, setDetails] = useState<DetailCommande[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedProduits, setSelectedProduits] = useState<{ id: number; quantite: number; tva_rate?: number }[]>([]);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [detteStats, setDetteStats] = useState({
    total_dette: 0,
    nb_commandes_non_payees: 0,
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      fetchLock.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(searchTerm.trim()),
      300
    );
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const loadClientsAndProduits = useCallback(async () => {
    try {
      if (!clientsLoaded.current) {
        const result = await window.api.clients.getAll({ limit: 1000 });
        if (result?.success && isMounted.current) {
          setClients(result.data || []);
          clientsLoaded.current = true;
        }
      }

      if (!produitsLoaded.current) {
        const result = await window.api.products.getAll({
          status: 'actif',
          limit: 500,
        });

        if (result?.success && isMounted.current) {
          setProduits(result.data || []);
          produitsLoaded.current = true;
        }
      }
    } catch (error) {
      console.error('❌ loadClientsAndProduits:', error);
    }
  }, []);

  const getDetteStats = useCallback(async () => {
    try {
      if (!window.api?.orders?.getDetteStats) return { success: false, error: 'API indisponible' };
      const result = await window.api.orders.getDetteStats();
      if (result?.success && isMounted.current) {
        setDetteStats({
          total_dette: Number(result.data?.total_dette || 0),
          nb_commandes_non_payees: Number(result.data?.nb_commandes_non_payees || 0),
        });
      }
      return result;
    } catch (error: any) {
      console.error('❌ getDetteStats:', error);
      return { success: false, error: error?.message || 'Erreur dette stats' };
    }
  }, []);

  const loadCommandes = useCallback(
    async (isRefresh = false) => {
      if (fetchLock.current) return;
      fetchLock.current = true;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (!firstLoadDone.current) {
          setLoading(true);
          await loadClientsAndProduits();
        }

        if (!window.api?.orders?.getAll) {
          throw new Error('API orders.getAll non disponible');
        }

        let sortField = 'date_commande';
        let sortDirection: 'ASC' | 'DESC' = 'DESC';

        switch (sortOption) {
          case 'Date (Ancien)': sortField = 'date_commande'; sortDirection = 'ASC'; break;
          case 'Total (Croissant)': sortField = 'total_ttc'; sortDirection = 'ASC'; break;
          case 'Total (Décroissant)': sortField = 'total_ttc'; sortDirection = 'DESC'; break;
          case 'Client (A-Z)': sortField = 'client_nom'; sortDirection = 'ASC'; break;
          case 'Client (Z-A)': sortField = 'client_nom'; sortDirection = 'DESC'; break;
          default: sortField = 'date_commande'; sortDirection = 'DESC';
        }

        const normalizedStatut = normalizeFilterStatut(filterStatut);

        const result = await window.api.orders.getAll({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearch,
          statut: normalizedStatut,
          sort: { field: sortField, direction: sortDirection },
          startDate: filterDateFrom || undefined,
          endDate: filterDateTo || undefined,
          montantMin: filterMontantMin || undefined,
          montantMax: filterMontantMax || undefined,
          modePaiement: filterModePaiement || undefined,
        });

        if (!isMounted.current) return;
        if (!result?.success) throw new Error(result?.error || 'Erreur chargement commandes');

        let data: Commande[] = (result.data || []).map((commande: Commande) => ({
          ...commande,
          numero: `CMD-${String(commande.id).padStart(6, '0')}`,
          montant_paye: Number(commande.montant_paye || 0),
          montant_restant: Number(commande.montant_restant || 0),
          statut_paiement: commande.statut_paiement || 'Non payé',
        }));

        if (normalizedStatut) {
          data = data.filter((cmd) => normalizePaiementStatus(cmd.statut_paiement) === normalizedStatut);
        }

        const uniqueData = data.filter(
          (item, index, self) => self.findIndex((x) => x.id === item.id) === index
        );

        setCommandes(uniqueData);
        setTotalItems(Number(result.pagination?.total || uniqueData.length));
        setTotalPages(Number(result.pagination?.totalPages || 1));

        await getDetteStats();
        firstLoadDone.current = true;
      } catch (error) {
        console.error('❌ loadCommandes:', error);
        if (isMounted.current) { setCommandes([]); setTotalItems(0); setTotalPages(0); }
      } finally {
        if (isMounted.current) { setLoading(false); setRefreshing(false); }
        fetchLock.current = false;
      }
    },
    [
      currentPage, debouncedSearch, filterStatut, sortOption,
      filterDateFrom, filterDateTo, filterMontantMin, filterMontantMax,
      filterModePaiement, loadClientsAndProduits, getDetteStats,
    ]
  );

  useEffect(() => {
    loadDataRef.current = loadCommandes;
  }, [loadCommandes]);

  useEffect(() => {
    if (!isMounted.current) return;
    setCurrentPage(1);
    if (firstLoadDone.current) {
      loadDataRef.current(true);
    } else {
      loadDataRef.current(false);
    }
  }, [debouncedSearch, filterStatut, sortOption, filterDateFrom, filterDateTo, filterMontantMin, filterMontantMax, filterModePaiement]);

  useEffect(() => {
    if (!isMounted.current || !firstLoadDone.current) return;
    loadDataRef.current(false);
  }, [currentPage]);

  useEffect(() => {
    if (!window.api?.orders?.onChanged) return;
    const unsubscribe = window.api.orders.onChanged(() => {
      if (isMounted.current && !fetchLock.current) loadDataRef.current(true);
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  const loadDetails = useCallback(async (commandeId: number) => {
    try {
      if (!window.api?.orders?.getDetails) throw new Error('API orders.getDetails indisponible');
      const result = await window.api.orders.getDetails(commandeId);
      if (!result?.success) { if (isMounted.current) setDetails([]); return []; }
      const data = (result.data || []).map((item: any) => ({
        ...item,
        total_ligne: Number(item.total_ligne ?? item.total ?? 0),
        produit_nom: item.produit_nom || 'Produit',
        produit_code: item.produit_code || '',
        quantity: Number(item.quantite || 0),
        price: Number(item.prix_unitaire || 0),
        tva_rate: Number(item.tva_rate) || 0.2,
      }));
      if (isMounted.current) setDetails(data);
      return data;
    } catch (error: any) {
      console.error('❌ loadDetails:', error?.message || error);
      if (isMounted.current) setDetails([]);
      return [];
    }
  }, []);

  const stats = useMemo(() => {
    const total = commandes.length;
    const totalCA = commandes.reduce((sum, commande) => sum + Number(commande.total_ttc || 0), 0);
    const totalHT = commandes.reduce((sum, commande) => sum + Number(commande.total_ht || 0), 0);
    const clientsUniques = new Set(commandes.map((commande) => commande.client_id).filter(Boolean)).size;
    return { total, totalCA, totalHT, moyennePanier: total > 0 ? totalCA / total : 0, clientsUniques };
  }, [commandes]);

  // ⭐ FIX: Ny panier dia mitahiry ny tva_rate marina
  const handleAddProduit = useCallback((id: number, quantite: number, tva_rate?: number) => {
    const produit = produits.find((item) => item.id === id);
    if (!produit) return;
    const quantity = Number(quantite);
    if (!Number.isInteger(quantity) || quantity <= 0) return;
    if (quantity > Number(produit.quantite_stock || 0)) return;
    
    const rate = (tva_rate !== undefined && tva_rate !== null && tva_rate !== '') 
      ? Number(tva_rate) 
      : (produit.tva_rate !== undefined && produit.tva_rate !== null && produit.tva_rate !== '') 
        ? Number(produit.tva_rate) 
        : 0.2;

    setSelectedProduits((previous) => previous.some((item) => item.id === id) 
      ? previous 
      : [...previous, { id, quantite: quantity, tva_rate: rate }]);
  }, [produits]);

  const handleUpdateQuantite = useCallback((id: number, quantite: number) => {
    const quantity = Number(quantite);
    if (quantity <= 0) { setSelectedProduits((previous) => previous.filter((item) => item.id !== id)); return; }
    const produit = produits.find((item) => item.id === id);
    if (produit && quantity > Number(produit.quantite_stock || 0)) return;
    setSelectedProduits((previous) => previous.map((item) => item.id === id ? { ...item, quantite: quantity } : item));
  }, [produits]);

  const handleRemoveProduit = useCallback((id: number) => {
    setSelectedProduits((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const clearPanier = useCallback(() => setSelectedProduits([]), []);

  const createCommande = useCallback(async (clientId: number, products: { id: number; quantite: number }[], options?: { statut_paiement?: StatutPaiement; montant_paye?: number; montant_restant?: number; }) => {
    if (!window.api?.orders?.create) throw new Error('API orders.create indisponible');
    const client = clients.find((item) => item.id === clientId);
    if (!client) throw new Error('Client non trouvé');
    if (!products.length) throw new Error('Aucun produit sélectionné');

    let totalHT = 0;
    let totalTVA = 0;
    
    const productDetails = products.map((item) => {
      const produit = produits.find((product) => product.id === item.id);
      if (!produit) throw new Error(`Produit ${item.id} non trouvé`);
      const quantity = Number(item.quantite);
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Quantité invalide pour ${produit.nom}`);
      if (quantity > Number(produit.quantite_stock || 0)) throw new Error(`Stock insuffisant pour ${produit.nom}`);
      
      const lineTotal = quantity * Number(produit.prix_vente || 0);
      totalHT += lineTotal;
      
      // ⭐ FIX: Tsy mampiasa || 0.2 intsony fa isFinite
      const rate = (produit.tva_rate !== undefined && produit.tva_rate !== null && produit.tva_rate !== '')
        ? Number(produit.tva_rate)
        : 0.2;
      totalTVA += lineTotal * rate;
      
      return { 
        id: produit.id, 
        name: produit.nom, 
        price: Number(produit.prix_vente || 0), 
        quantity, 
        tva_rate: rate 
      };
    });

    const totalTTC = totalHT + totalTVA;
    const montantPaye = Math.max(0, Math.min(totalTTC, Number(options?.montant_paye || 0)));
    const statutPaiement: StatutPaiement = options?.statut_paiement || (montantPaye <= 0 ? 'Non payé' : montantPaye >= totalTTC ? 'Payé' : 'Partiel');
    const montantRestant = Math.max(0, totalTTC - montantPaye);

    const payload = {
      client_nom: client.nom, client_id: client.id, products: productDetails,
      total_ht: totalHT, total_ttc: totalTTC,
      statut_paiement: statutPaiement, montant_paye: montantPaye, montant_restant: montantRestant,
    };

    const result = await window.api.orders.create(payload);
    if (!result?.success) throw new Error(result?.error || 'Erreur création commande');
    await loadDataRef.current(true);
    await getDetteStats();
    return result.data;
  }, [clients, produits, getDetteStats]);

  const deleteCommande = useCallback(async (id: number) => {
    if (!window.api?.orders?.delete) throw new Error('API orders.delete indisponible');
    const result = await window.api.orders.delete(id);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression');
    await loadDataRef.current(true);
    await getDetteStats();
    return result;
  }, [getDetteStats]);

  const updatePaiement = useCallback(async (id: number, data: { montant_paye: number; statut_paiement: StatutPaiement }) => {
    if (!window.api?.orders?.updatePaiement) throw new Error('API orders.updatePaiement indisponible');
    const result = await window.api.orders.updatePaiement(id, data);
    if (!result?.success) throw new Error(result?.error || 'Erreur mise à jour paiement');
    await loadDataRef.current(true);
    await getDetteStats();
    return result;
  }, [getDetteStats]);

  const generateFacture = useCallback(async (commande: Commande, companyInfo: CompanyData) => {
    try {
      let products = commande.products || [];
      if (!products.length) products = await loadDetails(commande.id);
      const { downloadPDF } = await import('../lib/pdfService');
      return await downloadPDF({
        order: { ...commande, products },
        clientName: commande.client_nom || 'Client',
        clientEmail: commande.client_email || '',
        clientPhone: commande.client_telephone || '',
        clientAddress: commande.client_address || '',
        companyName: companyInfo.name,
        companyLogo: companyInfo.logo,
        companyAddress: companyInfo.address,
        companyPhone: companyInfo.phone,
        companyEmail: companyInfo.email,
        companySiret: companyInfo.siret,
        companyImage: companyInfo.image,
        companyTaxId: companyInfo.taxId,
        companyRcs: companyInfo.rcs,
        companyVatNumber: companyInfo.vatNumber,
        paymentMethod: companyInfo.paymentMethod,
        paymentTerms: companyInfo.paymentTerms,
      });
    } catch (error: any) {
      return { success: false, error: error?.message || 'Erreur génération facture' };
    }
  }, [loadDetails]);

  const refreshReferences = useCallback(async () => {
    clientsLoaded.current = false;
    produitsLoaded.current = false;
    await loadClientsAndProduits();
  }, [loadClientsAndProduits]);

  return {
    commandes, clients, produits, loading, refreshing, setRefreshing,
    totalItems, totalPages, currentPage, setCurrentPage,
    searchTerm, setSearchTerm, filterStatut, setFilterStatut, sortOption, setSortOption,
    filterDateFrom, setFilterDateFrom, filterDateTo, setFilterDateTo,
    filterMontantMin, setFilterMontantMin, filterMontantMax, setFilterMontantMax,
    filterModePaiement, setFilterModePaiement,
    stats, details,
    selectedClientId, setSelectedClientId, selectedProduits,
    loadData: () => loadDataRef.current(false),
    loadCommandes: () => loadDataRef.current(false),
    refresh: () => loadDataRef.current(true),
    loadDetails,
    handleAddProduit, handleUpdateQuantite, handleRemoveProduit, clearPanier,
    createCommande, deleteCommande, generateFacture,
    updatePaiement, getDetteStats, detteStats,
    refreshReferences, ITEMS_PER_PAGE,
  };
};

export default useCommandesData;