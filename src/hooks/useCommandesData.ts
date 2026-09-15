// src/hooks/useCommandesData.ts
// ⭐ REFACTOR: Nizara ho modules ny useCommandesData
// ⭐ TSY MISY niova ny logique — fizarana fotsiny

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ExportPeriod, SelectedProduit } from './commandes';
import {
  toLocalDateString,
  normalizeFilterStatut,
  normalizePaiementStatus,
  useCommandesStats,
  useCommandesReferences,
  useCommandesExport,
} from './commandes';

export type { ExportPeriod };

const ITEMS_PER_PAGE = 8;
const OVERDUE_REFRESH_MS = 30_000;

export const useCommandesData = () => {
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<(isRefresh?: boolean) => Promise<void>>(async () => {});

  const [commandes, setCommandes] = useState<any[]>([]);
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

  const [filterDate, setFilterDate] = useState('');

  const [details, setDetails] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedProduits, setSelectedProduits] = useState<SelectedProduit[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(() => toLocalDateString());

  // ⭐ Custom hooks
  const {
    globalStats,
    detteStats,
    overdueCommandes,
    overdueTotal,
    overdueCount,
    loadGlobalStats,
    loadOverdue,
    getDetteStats,
  } = useCommandesStats();

  const {
    clients,
    produits,
    loadClientsAndProduits,
  } = useCommandesReferences();

  const { exportToExcel, exportToPDF, exportToCSV } = useCommandesExport({
    debouncedSearch,
    filterStatut,
    filterMontantMin,
    filterMontantMax,
    filterModePaiement,
  });

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; fetchLock.current = false; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const loadCommandes = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      if (isRefresh) setRefreshing(true);
      else if (!firstLoadDone.current) setLoading(true);

      if (!window.api?.orders?.getAll) throw new Error('API orders.getAll non disponible');

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

      const effectiveStartDate = filterDate || filterDateFrom || undefined;
      const effectiveEndDate = filterDate || filterDateTo || undefined;

      const result = await window.api.orders.getAll({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch,
        statut: normalizedStatut,
        sort: { field: sortField, direction: sortDirection },
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        montantMin: filterMontantMin || undefined,
        montantMax: filterMontantMax || undefined,
        modePaiement: filterModePaiement || undefined,
      });

      if (!isMounted.current) return;
      if (!result?.success) throw new Error(result?.error || 'Erreur chargement commandes');

      let data = (result.data || []).map((commande: any) => ({
        ...commande,
        numero: `CMD-${String(commande.id).padStart(6, '0')}`,
        montant_paye: Number(commande.montant_paye || 0),
        montant_restant: Number(commande.montant_restant || 0),
        statut_paiement: commande.statut_paiement || 'Non payé',
      }));

      if (normalizedStatut) {
        data = data.filter((cmd: any) => normalizePaiementStatus(cmd.statut_paiement) === normalizedStatut);
      }

      const uniqueData = data.filter((item: any, index: number, self: any[]) =>
        self.findIndex((x) => x.id === item.id) === index);

      setCommandes(uniqueData);
      setTotalItems(Number(result.pagination?.total || uniqueData.length));
      setTotalPages(Number(result.pagination?.totalPages || 1));

      await getDetteStats();
      await loadOverdue();
      await loadGlobalStats();
      firstLoadDone.current = true;
    } catch (error) {
      console.error('❌ loadCommandes:', error);
      if (isMounted.current) { setCommandes([]); setTotalItems(0); setTotalPages(0); }
    } finally {
      if (isMounted.current) { setLoading(false); setRefreshing(false); }
      fetchLock.current = false;
    }
  }, [currentPage, debouncedSearch, filterStatut, sortOption, filterDateFrom, filterDateTo,
      filterMontantMin, filterMontantMax, filterModePaiement, filterDate,
      getDetteStats, loadOverdue, loadGlobalStats]);

  useEffect(() => { loadDataRef.current = loadCommandes; }, [loadCommandes]);

  useEffect(() => {
    if (!isMounted.current) return;
    setCurrentPage(1);
    if (firstLoadDone.current) loadDataRef.current(true);
    else loadDataRef.current(false);
  }, [debouncedSearch, filterStatut, sortOption, filterDateFrom, filterDateTo,
      filterMontantMin, filterMontantMax, filterModePaiement, filterDate]);

  useEffect(() => {
    if (isMounted.current && firstLoadDone.current) loadDataRef.current(false);
  }, [currentPage]);

  useEffect(() => {
    const t = window.setInterval(() => { loadOverdue(); }, OVERDUE_REFRESH_MS);
    return () => window.clearInterval(t);
  }, [loadOverdue]);

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

      const data = (result.data || []).map((item: any) => {
        let rate = (item.tva_rate !== undefined && item.tva_rate !== null && item.tva_rate !== '')
          ? Number(item.tva_rate) : 0;
        const product = produits.find((p: any) => p.id === item.produit_id);
        if (product && product.tva_rate !== undefined && product.tva_rate !== null && product.tva_rate !== '') {
          rate = Number(product.tva_rate);
        }
        return {
          ...item,
          total_ligne: Number(item.total_ligne ?? item.total ?? 0),
          produit_nom: item.produit_nom || 'Produit',
          produit_code: item.produit_code || '',
          quantity: Number(item.quantite || 0),
          price: Number(item.prix_unitaire || 0),
          tva_rate: rate,
        };
      });

      if (isMounted.current) setDetails(data);
      return data;
    } catch (error: any) {
      console.error('❌ loadDetails:', error?.message || error);
      if (isMounted.current) setDetails([]);
      return [];
    }
  }, [produits]);

  const handleAddProduit = useCallback((id: number, quantite: number, tva_rate?: number) => {
    const produit = produits.find((item: any) => item.id === id);
    if (!produit) return;
    const quantity = Number(quantite);
    if (!Number.isInteger(quantity) || quantity <= 0) return;
    if (quantity > Number(produit.quantite_stock || 0)) return;
    const rate = (tva_rate !== undefined && tva_rate !== null && tva_rate !== '')
      ? Number(tva_rate)
      : (produit.tva_rate !== undefined && produit.tva_rate !== null && produit.tva_rate !== '')
        ? Number(produit.tva_rate) : 0;
    setSelectedProduits((prev) =>
      prev.some((item) => item.id === id) ? prev : [...prev, { id, quantite: quantity, tva_rate: rate }]);
  }, [produits]);

  const handleUpdateQuantite = useCallback((id: number, quantite: number) => {
    const quantity = Number(quantite);
    if (quantity <= 0) {
      setSelectedProduits((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    const produit = produits.find((item: any) => item.id === id);
    if (produit && quantity > Number(produit.quantite_stock || 0)) return;
    setSelectedProduits((prev) =>
      prev.map((item) => item.id === id ? { ...item, quantite: quantity } : item));
  }, [produits]);

  const handleRemoveProduit = useCallback((id: number) => {
    setSelectedProduits((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearPanier = useCallback(() => setSelectedProduits([]), []);

  const createCommande = useCallback(async (
    clientId: number,
    products: { id: number; quantite: number }[],
    options?: any
  ) => {
    if (!window.api?.orders?.create) throw new Error('API orders.create indisponible');
    const client = clients.find((item: any) => item.id === clientId);
    if (!client) throw new Error('Client non trouvé');
    if (!products.length) throw new Error('Aucun produit sélectionné');

    let totalHT = 0;
    let totalTVA = 0;
    const productDetails = products.map((item) => {
      const produit = produits.find((product: any) => product.id === item.id);
      if (!produit) throw new Error(`Produit ${item.id} non trouvé`);
      const quantity = Number(item.quantite);
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Quantité invalide pour ${produit.nom}`);
      if (quantity > Number(produit.quantite_stock || 0)) throw new Error(`Stock insuffisant pour ${produit.nom}`);
      const lineTotal = quantity * Number(produit.prix_vente || 0);
      totalHT += lineTotal;
      const rate = (produit.tva_rate !== undefined && produit.tva_rate !== null && produit.tva_rate !== '')
        ? Number(produit.tva_rate) : 0;
      totalTVA += lineTotal * rate;
      return { id: produit.id, name: produit.nom, price: Number(produit.prix_vente || 0), quantity, tva_rate: rate };
    });

    const fraisLivraison = Math.max(0, Number(options?.frais_livraison || 0));
    const totalHTFinal = totalHT + fraisLivraison;
    const totalTTC = totalHTFinal + totalTVA;
    const montantPaye = Math.max(0, Math.min(totalTTC, Number(options?.montant_paye || 0)));
    const statutPaiement = options?.statut_paiement ||
      (montantPaye <= 0 ? 'Non payé' : montantPaye >= totalTTC ? 'Payé' : 'Partiel');
    const montantRestant = Math.max(0, totalTTC - montantPaye);

    const payload = {
      client_nom: client.nom, client_id: client.id, products: productDetails,
      total_ht: totalHTFinal, total_ttc: totalTTC, statut_paiement: statutPaiement,
      montant_paye: montantPaye, montant_restant: montantRestant,
      mode_paiement: options?.mode_paiement || 'Espèces',
      modalite_paiement: options?.modalite_paiement || 'Immediat',
      frais_livraison: fraisLivraison,
    };

    const result = await window.api.orders.create(payload);
    if (!result?.success) throw new Error(result?.error || 'Erreur création commande');
    await loadDataRef.current(true);
    await getDetteStats();
    await loadOverdue();
    await loadGlobalStats();
    return result.data;
  }, [clients, produits, getDetteStats, loadOverdue, loadGlobalStats]);

  const deleteCommande = useCallback(async (id: number) => {
    if (!window.api?.orders?.delete) throw new Error('API orders.delete indisponible');
    const result = await window.api.orders.delete(id);
    if (!result?.success) throw new Error(result?.error || 'Erreur suppression');
    await loadDataRef.current(true);
    await getDetteStats();
    await loadOverdue();
    await loadGlobalStats();
    return result;
  }, [getDetteStats, loadOverdue, loadGlobalStats]);

  const updatePaiement = useCallback(async (id: number, data: { montant_paye: number; statut_paiement: any }) => {
    if (!window.api?.orders?.updatePaiement) throw new Error('API orders.updatePaiement indisponible');
    const result = await window.api.orders.updatePaiement(id, data);
    if (!result?.success) throw new Error(result?.error || 'Erreur mise à jour paiement');
    await loadDataRef.current(true);
    await getDetteStats();
    await loadOverdue();
    await loadGlobalStats();
    return result;
  }, [getDetteStats, loadOverdue, loadGlobalStats]);

  const stats = useMemo(() => {
    const total = commandes.length;
    const totalCA = commandes.reduce((sum: number, cmd: any) => sum + Number(cmd.total_ttc || 0), 0);
    const totalHT = commandes.reduce((sum: number, cmd: any) => sum + Number(cmd.total_ht || 0), 0);
    const clientsUniques = new Set(commandes.map((cmd: any) => cmd.client_id).filter(Boolean)).size;
    return { total, totalCA, totalHT, moyennePanier: total > 0 ? totalCA / total : 0, clientsUniques };
  }, [commandes]);

  return {
    commandes, clients, produits, loading, refreshing, setRefreshing,
    totalItems, totalPages, currentPage, setCurrentPage,
    searchTerm, setSearchTerm, filterStatut, setFilterStatut, sortOption, setSortOption,
    filterDateFrom, setFilterDateFrom, filterDateTo, setFilterDateTo,
    filterMontantMin, setFilterMontantMin, filterMontantMax, setFilterMontantMax,
    filterModePaiement, setFilterModePaiement,
    filterDate, setFilterDate,
    stats,
    globalStats,
    details,
    selectedClientId, setSelectedClientId, selectedProduits,
    loadData: () => loadDataRef.current(false),
    loadCommandes: () => loadDataRef.current(false),
    refresh: () => loadDataRef.current(true),
    loadDetails,
    handleAddProduit, handleUpdateQuantite, handleRemoveProduit, clearPanier,
    createCommande, deleteCommande,
    updatePaiement, getDetteStats, detteStats,
    refreshReferences: loadClientsAndProduits,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
    overdueCommandes,
    overdueCount,
    overdueTotal,
    loadOverdue,
    loadGlobalStats,
    ITEMS_PER_PAGE,
  };
};

export default useCommandesData;