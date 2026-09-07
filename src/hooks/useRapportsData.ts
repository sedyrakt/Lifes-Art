import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface RapportsStats {
  totalProduits: number;
  totalVentes: number;
  totalEntrees: number;
  totalSorties: number;
  chiffreAffaires: number;
  benefice: number;
  nbCommandes: number;
  nbClients: number;
  tauxBenefice: number;
}

export interface TopProduit {
  id: number;
  nom: string;
  code: string;
  total_vendu: number;
  total_ventes: number;
  nb_commandes: number;
  prix_vente: number;
  categorie_nom: string;
  pourcentage?: number;
}

export interface VenteParMois {
  mois: string | number;
  moisLabel?: string;
  jour?: string;
  nb_commandes: number;
  total_ventes: number;
  panier_moyen?: number;
}

export interface CategorieRepartition {
  id: number;
  nom: string;
  total_produits: number;
  total_stock: number;
  valeur_vente: number;
  valeur_achat: number;
  pourcentage?: number;
}

export interface CommandeRecente {
  id: number;
  commande_numero: string;
  client_nom: string;
  date_commande: string;
  total_ttc: number;
  statut: string;
  nb_produits: number;
}

export type Periode = 'jour' | 'semaine' | 'mois' | 'trimestre' | 'annee';

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const sanitizeMoney = (value: string): string => {
  return value.replace(/[\u202F\u00A0]/g, ' ').replace(/,/g, '.');
};

const getReportsApi = () => {
  if (typeof window === 'undefined') return null;
  return (window as any)?.api?.reports || null;
};

export const useRapportsData = (selectedDate?: Date, granularity?: string) => {
  const isMounted = useRef(true);
  const fetchLock = useRef(false);
  const firstLoadDone = useRef(false);
  const loadDataRef = useRef<(isRefresh?: boolean) => Promise<void>>(async () => {});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Periode>('mois');
  const [summary, setSummary] = useState<any>({});
  const [ventesParMois, setVentesParMois] = useState<VenteParMois[]>([]);
  const [topProduits, setTopProduits] = useState<TopProduit[]>([]);
  const [categorieRepartition, setCategorieRepartition] = useState<CategorieRepartition[]>([]);
  const [commandesRecentes, setCommandesRecentes] = useState<CommandeRecente[]>([]);
  const [beneficeData, setBeneficeData] = useState<any>({});
  const [stockValue, setStockValue] = useState<any>({});
  const [stockStatus, setStockStatus] = useState({ en_stock: 0, stock_bas: 0, rupture: 0 });
  const [entreesStock, setEntreesStock] = useState<any[]>([]);
  const [sortiesStock, setSortiesStock] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [depensesParCategorie, setDepensesParCategorie] = useState<any[]>([]);
  const [commandesStatut, setCommandesStatut] = useState<any[]>([]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      fetchLock.current = false;
    };
  }, []);

  const stats = useMemo((): RapportsStats => {
    const chiffreAffaires = toNumber(summary?.chiffre_affaires ?? summary?.chiffreAffaires);
    const benefice = toNumber(beneficeData?.benefice_net ?? beneficeData?.beneficeNet ?? beneficeData?.benefice);
    const nbCommandes = toNumber(summary?.total_commandes ?? summary?.totalCommandes);
    const nbClients = toNumber(summary?.clients_uniques ?? summary?.clientsUniques ?? summary?.total_clients ?? summary?.totalClients);
    const totalEntrees = entreesStock.reduce((total, item) => total + toNumber(item?.total_quantite), 0);
    const totalSorties = sortiesStock.reduce((total, item) => total + toNumber(item?.total_quantite), 0);

    return {
      totalProduits: toNumber(stockValue?.total_produits ?? stockValue?.totalProduits),
      totalVentes: nbCommandes,
      totalEntrees,
      totalSorties,
      chiffreAffaires,
      benefice,
      nbCommandes,
      nbClients,
      tauxBenefice: chiffreAffaires > 0 ? (benefice / chiffreAffaires) * 100 : 0,
    };
  }, [summary, beneficeData, stockValue, entreesStock, sortiesStock]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const api = getReportsApi();
      if (!api) {
        console.error('❌ window.api.reports est indisponible');
        return;
      }

      const now = selectedDate || new Date();
      const year = now.getFullYear();
      const endDate = now.toISOString().split('T')[0];
      const startDate = `${year}-01-01`;

      const results = await Promise.allSettled([
        api.getSummary ? api.getSummary() : Promise.resolve({ success: false }),
        api.getVentesParMois ? api.getVentesParMois(year) : Promise.resolve({ success: false }),
        api.getTopProduits ? api.getTopProduits({ limit: 10 }) : Promise.resolve({ success: false }),
        api.getRepartitionCategorie ? api.getRepartitionCategorie() : Promise.resolve({ success: false }),
        api.getCommandesRecentes ? api.getCommandesRecentes(5) : Promise.resolve({ success: false }),
        api.getBenefice ? api.getBenefice(year) : Promise.resolve({ success: false }),
        api.getStockValue ? api.getStockValue() : Promise.resolve({ success: false }),
        api.getStockStatus ? api.getStockStatus() : Promise.resolve({ success: false }),
        api.getEntreesStock ? api.getEntreesStock({ startDate, endDate }) : Promise.resolve({ success: false }),
        api.getSortiesStock ? api.getSortiesStock({ startDate, endDate }) : Promise.resolve({ success: false }),
        api.getTopClients ? api.getTopClients({ limit: 5, startDate, endDate }) : Promise.resolve({ success: false }),
        api.getDepensesParCategorie ? api.getDepensesParCategorie({ startDate, endDate }) : Promise.resolve({ success: false }),
        api.getCommandesStatut ? api.getCommandesStatut() : Promise.resolve({ success: false }),
      ]);

      const extract = (result: any) => {
        if (result?.status === 'fulfilled' && result?.value?.success) {
          return result.value.data;
        }
        return null;
      };

      const summaryResult = extract(results[0]);
      const ventesResult = extract(results[1]);
      const topProduitsResult = extract(results[2]);
      const categoriesResult = extract(results[3]);
      const recentOrdersResult = extract(results[4]);
      const beneficeResult = extract(results[5]);
      const stockValueResult = extract(results[6]);
      const stockStatusResult = extract(results[7]);
      const entreesResult = extract(results[8]);
      const sortiesResult = extract(results[9]);
      const topClientsResult = extract(results[10]);
      const depensesResult = extract(results[11]);
      const commandesStatutResult = extract(results[12]);

      const recentCommands = Array.isArray(recentOrdersResult)
        ? recentOrdersResult.map((command: any) => {
            const numero = command?.commande_numero;
            return {
              ...command,
              commande_numero: typeof numero === 'string' && numero.trim() ? numero : `CMD-${String(command?.id || 0).padStart(6, '0')}`,
            };
          })
        : [];

      if (!isMounted.current) return;

      if (summaryResult) setSummary(summaryResult);
      if (Array.isArray(ventesResult)) setVentesParMois(ventesResult);
      if (Array.isArray(topProduitsResult)) setTopProduits(topProduitsResult);
      if (Array.isArray(categoriesResult)) setCategorieRepartition(categoriesResult);

      setCommandesRecentes(recentCommands);

      if (beneficeResult) setBeneficeData(beneficeResult);
      if (stockValueResult) setStockValue(stockValueResult);

      if (stockStatusResult) {
        setStockStatus({
          en_stock: toNumber(stockStatusResult.en_stock),
          stock_bas: toNumber(stockStatusResult.stock_bas),
          rupture: toNumber(stockStatusResult.rupture),
        });
      }

      if (Array.isArray(entreesResult)) setEntreesStock(entreesResult);
      if (Array.isArray(sortiesResult)) setSortiesStock(sortiesResult);
      if (Array.isArray(topClientsResult)) setTopClients(topClientsResult);
      if (Array.isArray(depensesResult)) setDepensesParCategorie(depensesResult);
      if (Array.isArray(commandesStatutResult)) setCommandesStatut(commandesStatutResult);

      firstLoadDone.current = true;
    } catch (error) {
      console.error('❌ Erreur chargement rapports:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
        fetchLock.current = false;
      }
    }
  }, [selectedDate, granularity]);

  useEffect(() => {
    const api = getReportsApi();
    if (!api?.onChanged) return;

    const unsubscribe = api.onChanged(() => {
      if (isMounted.current && !fetchLock.current) {
        loadDataRef.current(true);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    if (!firstLoadDone.current) {
      loadData(false);
    }
  }, [loadData]);

  const exportToExcel = useCallback((data: any[], filename: string, sheetName = 'Rapport') => {
    if (!data.length) return;
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error('❌ Erreur export Excel:', error);
    }
  }, []);

  const exportToPDF = useCallback((data: any[], filename: string, title: string, columns: string[], companyName?: string) => {
    if (!data.length) return;
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 297, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(`${companyName || "TahiryPro"} - Rapport Officiel`, 14, 10);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(18);
      doc.text(title, 14, 28);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

      const rows = data.map(item => columns.map(column => {
        const value = item?.[column];
        return value !== undefined && value !== null ? value : '';
      }));

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 42,
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        theme: 'grid',
      });

      doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
    }
  }, []);

  const exportToCSV = useCallback((data: any[], filename: string) => {
    if (!data.length) return;
    try {
      const headers = Object.keys(data[0]);
      const escapeCSV = (value: any) => {
        if (value === undefined || value === null) return '""';
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      };

      const csv = [
        headers.map(escapeCSV).join(','),
        ...data.map(item => headers.map(header => escapeCSV(item?.[header])).join(',')),
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Erreur export CSV:', error);
    }
  }, []);

  const handleExportStats = useCallback((formatMoneyFn: (value: number) => string) => {
    const data = [
      { Indicateur: "Chiffre d'affaires", Valeur: sanitizeMoney(formatMoneyFn(stats.chiffreAffaires)) },
      { Indicateur: 'Bénéfice Net', Valeur: sanitizeMoney(formatMoneyFn(stats.benefice)) },
      { Indicateur: 'Total entrées', Valeur: stats.totalEntrees },
      { Indicateur: 'Total sorties', Valeur: stats.totalSorties },
      { Indicateur: 'Commandes', Valeur: stats.nbCommandes },
      { Indicateur: 'Clients Actifs', Valeur: stats.nbClients },
      { Indicateur: 'Taux de marge', Valeur: stats.tauxBenefice.toFixed(2) + '%' },
    ];
    exportToExcel(data, 'Rapport_Statistiques_LifeArt');
  }, [stats, exportToExcel]);

  const handleExportTopProduits = useCallback((formatMoneyFn: (value: number) => string) => {
    if (!topProduits.length) return;
    const data = topProduits.map((product, index) => ({
      Rang: `#${index + 1}`,
      Produit: product.nom || 'N/A',
      Code: product.code || 'N/A',
      'Quantité vendue': product.total_vendu || 0,
      'Total ventes': sanitizeMoney(formatMoneyFn(product.total_ventes || 0)),
      Pourcentage: product.pourcentage ? `${product.pourcentage}%` : '0%',
    }));
    exportToExcel(data, 'Top_Produits_LifeArt');
  }, [topProduits, exportToExcel]);

  const handleExportCommandes = useCallback(() => {
    if (!commandesRecentes.length) return;
    const data = commandesRecentes.map(command => ({
      'N° Commande': command.commande_numero || `CMD-${String(command.id || 0).padStart(6, '0')}`,
      Client: command.client_nom || 'N/A',
      Date: command.date_commande ? new Date(command.date_commande).toLocaleDateString('fr-FR') : 'N/A',
      'Total TTC': command.total_ttc || 0,
      Statut: command.statut || 'N/A',
      'Nb Produits': command.nb_produits || 0,
    }));
    exportToExcel(data, 'Commandes_Recentes_LifeArt');
  }, [commandesRecentes, exportToExcel]);

  const handleExportPDF = useCallback((formatMoneyFn: (value: number) => string, companyName = "TahiryPro") => {
    const data = [
      { Indicateur: "Chiffre d'affaires", Valeur: sanitizeMoney(formatMoneyFn(stats.chiffreAffaires)) },
      { Indicateur: 'Bénéfice Net', Valeur: sanitizeMoney(formatMoneyFn(stats.benefice)) },
      { Indicateur: 'Total entrées', Valeur: stats.totalEntrees },
      { Indicateur: 'Total sorties', Valeur: stats.totalSorties },
      { Indicateur: 'Commandes', Valeur: stats.nbCommandes },
      { Indicateur: 'Clients Actifs', Valeur: stats.nbClients },
      { Indicateur: 'Taux de marge', Valeur: stats.tauxBenefice.toFixed(2) + '%' },
    ];
    exportToPDF(data, 'Rapport_Statistiques', `Rapport d'analyse financière - ${companyName}`, ['Indicateur', 'Valeur'], companyName);
  }, [stats, exportToPDF]);

  const handleExportCSV = useCallback((formatMoneyFn: (value: number) => string) => {
    const data = [
      { Indicateur: "Chiffre d'affaires", Valeur: sanitizeMoney(formatMoneyFn(stats.chiffreAffaires)) },
      { Indicateur: 'Bénéfice Net', Valeur: sanitizeMoney(formatMoneyFn(stats.benefice)) },
      { Indicateur: 'Total entrées', Valeur: stats.totalEntrees },
      { Indicateur: 'Total sorties', Valeur: stats.totalSorties },
      { Indicateur: 'Commandes', Valeur: stats.nbCommandes },
      { Indicateur: 'Clients Actifs', Valeur: stats.nbClients },
      { Indicateur: 'Taux de marge', Valeur: stats.tauxBenefice.toFixed(2) + '%' },
    ];
    exportToCSV(data, 'Rapport_Statistiques_LifeArt');
  }, [stats, exportToCSV]);

  return {
    loading,
    refreshing,
    setRefreshing,
    period,
    setPeriod,
    stats,
    topProduits,
    ventesParMois,
    categorieRepartition,
    commandesRecentes,
    summary,
    beneficeData,
    stockValue,
    stockStatus,
    entreesStock,
    sortiesStock,
    topClients,
    depensesParCategorie,
    commandesStatut,
    loadData,
    refresh: () => loadData(true),
    handleExportStats,
    handleExportTopProduits,
    handleExportCommandes,
    handleExportPDF,
    handleExportCSV,
  };
};