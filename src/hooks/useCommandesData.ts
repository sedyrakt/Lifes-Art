// src/hooks/useCommandesData.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../utils/saveFileWithDialog';

const ITEMS_PER_PAGE = 8;

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';

const formatNumberNoSlash = (value: number) => {
  return value.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
};

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

  const [commandes, setCommandes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
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

  const [details, setDetails] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedProduits, setSelectedProduits] = useState<{ id: number; quantite: number; tva_rate?: number }[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [detteStats, setDetteStats] = useState({ total_dette: 0, nb_commandes_non_payees: 0 });

  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportCustomDate, setExportCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; fetchLock.current = false; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const loadClientsAndProduits = useCallback(async () => {
    try {
      if (!clientsLoaded.current) {
        const result = await window.api.clients.getAll({ limit: 1000 });
        if (result?.success && isMounted.current) setClients(result.data || []);
        clientsLoaded.current = true;
      }
      if (!produitsLoaded.current) {
        const result = await window.api.products.getAll({ status: 'actif', limit: 500 });
        if (result?.success && isMounted.current) setProduits(result.data || []);
        produitsLoaded.current = true;
      }
    } catch (error) {
      console.error('❌ loadClientsAndProduits:', error);
    }
  }, []);

  const getDetteStats = useCallback(async () => {
    try {
      if (!window.api?.orders?.getDetteStats) return { success: false };
      const result = await window.api.orders.getDetteStats();
      if (result?.success && isMounted.current) {
        setDetteStats({
          total_dette: Number(result.data?.total_dette || 0),
          nb_commandes_non_payees: Number(result.data?.nb_commandes_non_payees || 0),
        });
      }
      return result;
    } catch (error) {
      console.error('❌ getDetteStats:', error);
      return { success: false };
    }
  }, []);

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

      const uniqueData = data.filter((item: any, index: number, self: any[]) => self.findIndex((x) => x.id === item.id) === index);
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
  }, [currentPage, debouncedSearch, filterStatut, sortOption, filterDateFrom, filterDateTo, filterMontantMin, filterMontantMax, filterModePaiement, loadClientsAndProduits, getDetteStats]);

  useEffect(() => { loadDataRef.current = loadCommandes; }, [loadCommandes]);

  useEffect(() => {
    if (!isMounted.current) return;
    setCurrentPage(1);
    if (firstLoadDone.current) loadDataRef.current(true);
    else loadDataRef.current(false);
  }, [debouncedSearch, filterStatut, sortOption, filterDateFrom, filterDateTo, filterMontantMin, filterMontantMax, filterModePaiement]);

  useEffect(() => {
    if (isMounted.current && firstLoadDone.current) loadDataRef.current(false);
  }, [currentPage]);

  useEffect(() => {
    if (!window.api?.orders?.onChanged) return;
    const unsubscribe = window.api.orders.onChanged(() => {
      if (isMounted.current && !fetchLock.current) loadDataRef.current(true);
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  // ⭐ FIX: IZAY NO MANITSY NY TVA DISO (0.2 default taloha). Maka ny TVA marina amin'ny produit!
  const loadDetails = useCallback(async (commandeId: number) => {
    try {
      if (!window.api?.orders?.getDetails) throw new Error('API orders.getDetails indisponible');
      const result = await window.api.orders.getDetails(commandeId);
      if (!result?.success) { if (isMounted.current) setDetails([]); return []; }
      
      // ⭐ Mampiasa ny produits mba hanitsiana ny taux TVA marina
      const data = (result.data || []).map((item: any) => {
        let rate = (item.tva_rate !== undefined && item.tva_rate !== null && item.tva_rate !== '')
          ? Number(item.tva_rate)
          : 0; // Raha tsy misy dia 0 fa tsy 0.2

        // Raha misy produit mifanaraka amin'ny ID, dia ampiasao ny taux TVA marina avy amin'ny produit
        const product = produits.find((p: any) => p.id === item.produit_id);
        if (product && product.tva_rate !== undefined && product.tva_rate !== null && product.tva_rate !== '') {
           rate = Number(product.tva_rate);
        }

        return { ...item, total_ligne: Number(item.total_ligne ?? item.total ?? 0), produit_nom: item.produit_nom || 'Produit', produit_code: item.produit_code || '', quantity: Number(item.quantite || 0), price: Number(item.prix_unitaire || 0), tva_rate: rate };
      });
      
      if (isMounted.current) setDetails(data);
      return data;
    } catch (error: any) {
      console.error('❌ loadDetails:', error?.message || error);
      if (isMounted.current) setDetails([]);
      return [];
    }
  }, [produits]); // ⭐ Nampiana 'produits' ao amin'ny dependencies

  const stats = useMemo(() => {
    const total = commandes.length;
    const totalCA = commandes.reduce((sum: number, cmd: any) => sum + Number(cmd.total_ttc || 0), 0);
    const totalHT = commandes.reduce((sum: number, cmd: any) => sum + Number(cmd.total_ht || 0), 0);
    const clientsUniques = new Set(commandes.map((cmd: any) => cmd.client_id).filter(Boolean)).size;
    return { total, totalCA, totalHT, moyennePanier: total > 0 ? totalCA / total : 0, clientsUniques };
  }, [commandes]);

  // ⭐ FIX: Raha 0 dia 0, raha null/undefined/'' dia 0
  const handleAddProduit = useCallback((id: number, quantite: number, tva_rate?: number) => {
    const produit = produits.find((item: any) => item.id === id);
    if (!produit) return;
    const quantity = Number(quantite);
    if (!Number.isInteger(quantity) || quantity <= 0) return;
    if (quantity > Number(produit.quantite_stock || 0)) return;
    
    // ⭐ FIX: Raha tsy misy tva_rate dia 0, fa tsy 0.2
    const rate = (tva_rate !== undefined && tva_rate !== null && tva_rate !== '')
      ? Number(tva_rate)
      : (produit.tva_rate !== undefined && produit.tva_rate !== null && produit.tva_rate !== '')
        ? Number(produit.tva_rate)
        : 0;

    setSelectedProduits((prev) => prev.some((item) => item.id === id) ? prev : [...prev, { id, quantite: quantity, tva_rate: rate }]);
  }, [produits]);

  const handleUpdateQuantite = useCallback((id: number, quantite: number) => {
    const quantity = Number(quantite);
    if (quantity <= 0) { setSelectedProduits((prev) => prev.filter((item) => item.id !== id)); return; }
    const produit = produits.find((item: any) => item.id === id);
    if (produit && quantity > Number(produit.quantite_stock || 0)) return;
    setSelectedProduits((prev) => prev.map((item) => item.id === id ? { ...item, quantite: quantity } : item));
  }, [produits]);

  const handleRemoveProduit = useCallback((id: number) => {
    setSelectedProduits((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearPanier = useCallback(() => setSelectedProduits([]), []);

  const createCommande = useCallback(async (clientId: number, products: { id: number; quantite: number }[], options?: any) => {
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
      
      // ⭐ FIX: Raha tsy misy TVA dia 0
      const rate = (produit.tva_rate !== undefined && produit.tva_rate !== null && produit.tva_rate !== '')
        ? Number(produit.tva_rate)
        : 0;
      totalTVA += lineTotal * rate;
      return { id: produit.id, name: produit.nom, price: Number(produit.prix_vente || 0), quantity, tva_rate: rate };
    });
    const totalTTC = totalHT + totalTVA;
    const montantPaye = Math.max(0, Math.min(totalTTC, Number(options?.montant_paye || 0)));
    const statutPaiement = options?.statut_paiement || (montantPaye <= 0 ? 'Non payé' : montantPaye >= totalTTC ? 'Payé' : 'Partiel');
    const montantRestant = Math.max(0, totalTTC - montantPaye);
    const payload = { client_nom: client.nom, client_id: client.id, products: productDetails, total_ht: totalHT, total_ttc: totalTTC, statut_paiement: statutPaiement, montant_paye: montantPaye, montant_restant: montantRestant };
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

  const updatePaiement = useCallback(async (id: number, data: { montant_paye: number; statut_paiement: any }) => {
    if (!window.api?.orders?.updatePaiement) throw new Error('API orders.updatePaiement indisponible');
    const result = await window.api.orders.updatePaiement(id, data);
    if (!result?.success) throw new Error(result?.error || 'Erreur mise à jour paiement');
    await loadDataRef.current(true);
    await getDetteStats();
    return result;
  }, [getDetteStats]);

  // ============================================================
  // ⭐ EXPORT FUNCTIONS
  // ============================================================
  const getExportPeriodRange = useCallback((period: ExportPeriod, customDate: string) => {
    const now = new Date();
    let startDate: string | undefined, endDate: string | undefined;
    if (period === 'aujourdhui') { startDate = now.toISOString().split('T')[0] + ' 00:00:00'; endDate = now.toISOString().split('T')[0] + ' 23:59:59'; }
    else if (period === 'hier') { const yest = new Date(now); yest.setDate(now.getDate() - 1); startDate = yest.toISOString().split('T')[0] + ' 00:00:00'; endDate = yest.toISOString().split('T')[0] + ' 23:59:59'; }
    else if (period === 'semaine') { const day = now.getDay(); const diff = now.getDate() - day + (day === 0 ? -6 : 1); const monday = new Date(now); monday.setDate(diff); startDate = monday.toISOString().split('T')[0] + ' 00:00:00'; const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); endDate = sunday.toISOString().split('T')[0] + ' 23:59:59'; }
    else if (period === 'mois') { startDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01 00:00:00`; const lastDay = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate(); endDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')} 23:59:59`; }
    else if (period === 'annee') { startDate = `${now.getFullYear()}-01-01 00:00:00`; endDate = `${now.getFullYear()}-12-31 23:59:59`; }
    else if (period === 'custom') { const dateStr = customDate || now.toISOString().split('T')[0]; startDate = dateStr + ' 00:00:00'; endDate = dateStr + ' 23:59:59'; }
    return { startDate, endDate };
  }, []);

  const fetchAllForExport = useCallback(async (period: ExportPeriod, customDate: string) => {
    if (!window.api?.orders?.getAll) return [];
    const range = getExportPeriodRange(period, customDate);
    const result = await window.api.orders.getAll({ page: 1, limit: 100000, search: debouncedSearch, statut: normalizeFilterStatut(filterStatut), sort: { field: 'date_commande', direction: 'DESC' }, startDate: range.startDate, endDate: range.endDate, montantMin: filterMontantMin || undefined, montantMax: filterMontantMax || undefined, modePaiement: filterModePaiement || undefined });
    if (result?.success) return result.data || [];
    return [];
  }, [debouncedSearch, filterStatut, filterMontantMin, filterMontantMax, filterModePaiement, getExportPeriodRange]);

  const exportToExcel = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const rows = data.length ? data.map((cmd: any) => ({ 'N° Commande': cmd.numero || `CMD-${String(cmd.id).padStart(6, '0')}`, 'Client': cmd.client_nom || '', 'Date': cmd.date_commande ? new Date(cmd.date_commande).toLocaleDateString('fr-FR') : '', 'Total HT': cmd.total_ht || 0, 'Total TTC': cmd.total_ttc || 0, 'Statut': cmd.statut_paiement || 'Non payé', 'Montant payé': cmd.montant_paye || 0, 'Montant restant': cmd.montant_restant || 0 })) : [{ 'N° Commande': 'Aucune commande', 'Client': '', 'Date': '', 'Total HT': 0, 'Total TTC': 0, 'Statut': '', 'Montant payé': 0, 'Montant restant': 0 }];
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Commandes'); ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const totalCA = data.reduce((sum: number, cmd: any) => sum + (Number(cmd.total_ttc) || 0), 0);
    XLSX.utils.sheet_add_json(ws, [{ 'N° Commande': 'TOTAL', 'Client': '', 'Date': '', 'Total HT': '', 'Total TTC': formatNumberNoSlash(totalCA), 'Statut': '', 'Montant payé': '', 'Montant restant': '' }], { origin: -1, skipHeader: true });
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const result = await saveFileWithDialog(wbout, `commandes_${period}_${customDate || new Date().toISOString().slice(0,10)}.xlsx`, [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToPDF = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 297, 15, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.text('LifesArt - Commandes', 14, 10);
    doc.setTextColor(15, 23, 42); doc.setFontSize(18); doc.text(`Rapport des commandes - ${period}${period === 'custom' ? ' (' + (customDate || new Date().toISOString().split('T')[0]) + ')' : ''}`, 14, 28); doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);
    const columns = ['N° Commande', 'Client', 'Date', 'Total HT', 'Total TTC', 'Statut', 'Montant payé', 'Montant restant'];
    const rows = data.length ? data.map((cmd: any) => [cmd.numero || `CMD-${String(cmd.id).padStart(6, '0')}`, cmd.client_nom || '', cmd.date_commande ? new Date(cmd.date_commande).toLocaleDateString('fr-FR') : '', cmd.total_ht || 0, cmd.total_ttc || 0, cmd.statut_paiement || 'Non payé', cmd.montant_paye || 0, cmd.montant_restant || 0]) : [['Aucune commande', '', '', 0, 0, '', 0, 0]];
    const totalCA = data.reduce((sum: number, cmd: any) => sum + (Number(cmd.total_ttc) || 0), 0);
    autoTable(doc, { head: [columns], body: rows, startY: 42, styles: { fontSize: 9, cellPadding: 4 }, headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }, alternateRowStyles: { fillColor: [248, 250, 252] }, theme: 'grid', showHead: 'firstPage', didDrawPage: (data) => { const pageNumber = doc.getNumberOfPages(); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(`Page ${pageNumber}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10); }, showFoot: 'lastPage', foot: [['', '', '', '', `TOTAL: ${formatNumberNoSlash(totalCA)} Ar`, '', '', '']], footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' } });
    const pdfArrayBuffer = doc.output('arraybuffer');
    const result = await saveFileWithDialog(pdfArrayBuffer, `commandes_${period}_${customDate || new Date().toISOString().slice(0,10)}.pdf`, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

  const exportToCSV = useCallback(async (period: ExportPeriod = 'mois', customDate: string = '') => {
    const data = await fetchAllForExport(period, customDate);
    const headers = ['N° Commande', 'Client', 'Date', 'Total HT', 'Total TTC', 'Statut', 'Montant payé', 'Montant restant'];
    const escapeCSV = (value: any) => { if (value === undefined || value === null) return '""'; return `"${String(value).replace(/"/g, '""')}"`; };
    const rows = data.length ? data.map((cmd: any) => [cmd.numero || `CMD-${String(cmd.id).padStart(6, '0')}`, cmd.client_nom || '', cmd.date_commande ? new Date(cmd.date_commande).toLocaleDateString('fr-FR') : '', cmd.total_ht || 0, cmd.total_ttc || 0, cmd.statut_paiement || 'Non payé', cmd.montant_paye || 0, cmd.montant_restant || 0]) : [['Aucune commande', '', '', 0, 0, '', 0, 0]];
    const totalCA = data.reduce((sum: number, cmd: any) => sum + (Number(cmd.total_ttc) || 0), 0);
    const totalRow = ['', '', '', '', `TOTAL: ${formatNumberNoSlash(totalCA)} Ar`, '', '', ''];
    const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')])].join('\n');
    const result = await saveFileWithDialog(csv, `commandes_${period}_${customDate || new Date().toISOString().slice(0,10)}.csv`, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!result.success) { if (result.canceled) return result; throw new Error(result.error || 'Erreur'); }
    return result;
  }, [fetchAllForExport]);

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
    createCommande, deleteCommande,
    updatePaiement, getDetteStats, detteStats,
    refreshReferences: loadClientsAndProduits,
    exportPeriod, setExportPeriod, exportCustomDate, setExportCustomDate,
    exportToExcel, exportToPDF, exportToCSV,
    ITEMS_PER_PAGE,
  };
};

export default useCommandesData;