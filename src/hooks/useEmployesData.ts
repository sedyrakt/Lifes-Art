// useEmployesData.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileWithDialog } from '../utils/saveFileWithDialog'; // ⭐ Import ho an'ny save dialog

export interface Employe {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  departement: string;
  date_embauche: string;
  salaire: number;
  status: string;
  created_at: string;
}

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';

export const useEmployesData = () => {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOption, setSortOption] = useState('nom-asc');

  // ⭐ Vaovao: Période sy Date picker ho an'ny export
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mois');
  const [exportDate, setExportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [paiementCounts, setPaiementCounts] = useState<Record<number, number>>({});
  const [historiquePaiements, setHistoriquePaiements] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSalaire: 0, actifs: 0, tauxActif: 0 });
  const [derniersPaiements, setDerniersPaiements] = useState<Record<number, any>>({});
  const ITEMS_PER_PAGE = 10;

  const initialLoadDone = useRef(false);

  // Debounce searchTerm
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ⭐ Fikajiana ny date range ho an'ny export
  const getExportRange = useCallback((period: ExportPeriod, customDate: string) => {
    const now = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (period === 'aujourdhui') {
      startDate = now.toISOString().split('T')[0] + ' 00:00:00';
      endDate = now.toISOString().split('T')[0] + ' 23:59:59';
    } else if (period === 'hier') {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      startDate = yest.toISOString().split('T')[0] + ' 00:00:00';
      endDate = yest.toISOString().split('T')[0] + ' 23:59:59';
    } else if (period === 'semaine') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      startDate = monday.toISOString().split('T')[0] + ' 00:00:00';
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      endDate = sunday.toISOString().split('T')[0] + ' 23:59:59';
    } else if (period === 'mois') {
      startDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01 00:00:00`;
      const lastDay = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
      endDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')} 23:59:59`;
    } else if (period === 'annee') {
      startDate = `${now.getFullYear()}-01-01 00:00:00`;
      endDate = `${now.getFullYear()}-12-31 23:59:59`;
    } else if (period === 'custom') {
      // Date picker single date
      startDate = customDate + ' 00:00:00';
      endDate = customDate + ' 23:59:59';
    }

    return { startDate, endDate };
  }, []);

  // ⭐ Fetch employés filtrés par date (ho an'ny export)
  const getEmployesForExport = useCallback(async (period: ExportPeriod, customDate: string) => {
    if (!window.api?.employes?.getAll) return [];

    const result = await window.api.employes.getAll({
      page: 1,
      limit: 100000,
      search: debouncedSearch,
      status: filterStatus,
      sort: sortOption,
    });

    if (!result?.success) return [];

    const allEmployes = result.data?.items || result.data || [];

    // Filter by date_embauche (ou created_at) based on period
    const { startDate, endDate } = getExportRange(period, customDate);
    
    if (!startDate || !endDate) return allEmployes; // Raha tsy misy filtre, alaina ny rehetra

    const filtered = allEmployes.filter((emp: any) => {
      const empDateStr = emp.date_embauche || emp.created_at || '';
      if (!empDateStr) return false;
      const empDate = new Date(empDateStr);
      if (isNaN(empDate.getTime())) return false;

      const start = new Date(startDate);
      const end = new Date(endDate);
      return empDate >= start && empDate <= end;
    });

    return filtered;
  }, [debouncedSearch, filterStatus, sortOption, getExportRange]);

  // ⭐ Export Excel (misy "Enregistrer sous", robust)
  const exportToExcel = useCallback(async (period: ExportPeriod, customDate: string) => {
    const data = await getEmployesForExport(period, customDate);
    // Raha tsy misy data, mamorona entête fotsiny
    const rows = data.length
      ? data.map((emp: any) => ({
          'Nom': emp.nom || '',
          'Prénom': emp.prenom || '',
          'Email': emp.email || '',
          'Téléphone': emp.telephone || '',
          'Poste': emp.poste || '',
          'Département': emp.departement || '',
          'Date embauche': emp.date_embauche || '',
          'Salaire': emp.salaire || 0,
          'Statut': emp.status === 'actif' ? 'Actif' : emp.status === 'en_conge' ? 'En congé' : 'Inactif',
        }))
      : [
          { 'Nom': 'Aucun employé', 'Prénom': '', 'Email': '', 'Téléphone': '', 'Poste': '', 'Département': '', 'Date embauche': '', 'Salaire': 0, 'Statut': '' }
        ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employés');
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const totalSalaire = data.reduce((sum: number, emp: any) => sum + (Number(emp.salaire) || 0), 0);
    XLSX.utils.sheet_add_json(ws, [{ 'Nom': 'TOTAL', 'Prénom': '', 'Email': '', 'Téléphone': '', 'Poste': '', 'Département': '', 'Date embauche': '', 'Salaire': totalSalaire, 'Statut': '' }], { origin: -1, skipHeader: true });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `employes_${period}_${customDate || new Date().toISOString().slice(0,10)}.xlsx`;
    const result = await saveFileWithDialog(wbout, fileName, [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le fichier Excel.');
    }
    return result;
  }, [getEmployesForExport]);

  // ⭐ Export PDF (misy "Enregistrer sous", robust)
  const exportToPDF = useCallback(async (period: ExportPeriod, customDate: string) => {
    const data = await getEmployesForExport(period, customDate);
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('LifesArt - Employés', 14, 10);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text(`Rapport des employés - ${period}${period === 'custom' ? ' (' + (customDate || new Date().toISOString().split('T')[0]) + ')' : ''}`, 14, 28);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

    const columns = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Poste', 'Département', 'Date embauche', 'Salaire', 'Statut'];
    const rows = data.length
      ? data.map((emp: any) => [
          emp.nom || '', emp.prenom || '', emp.email || '', emp.telephone || '',
          emp.poste || '', emp.departement || '', emp.date_embauche || '',
          emp.salaire || 0,
          emp.status === 'actif' ? 'Actif' : emp.status === 'en_conge' ? 'En congé' : 'Inactif'
        ])
      : [['Aucun employé', '', '', '', '', '', '', 0, '']];

    const totalSalaire = data.reduce((sum: number, emp: any) => sum + (Number(emp.salaire) || 0), 0);
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 42,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid',
      foot: [['', '', '', '', '', '', '', `TOTAL: ${totalSalaire.toLocaleString('fr-FR')} Ar`, '']],
      footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
      showFoot: 'lastPage',
    });

    const pdfArrayBuffer = doc.output('arraybuffer');
    const fileName = `employes_${period}_${customDate || new Date().toISOString().slice(0,10)}.pdf`;
    const result = await saveFileWithDialog(pdfArrayBuffer, fileName, [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le PDF.');
    }
    return result;
  }, [getEmployesForExport]);

  // ⭐ Export CSV (misy "Enregistrer sous", robust)
  const exportToCSV = useCallback(async (period: ExportPeriod, customDate: string) => {
    const data = await getEmployesForExport(period, customDate);
    const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Poste', 'Département', 'Date embauche', 'Salaire', 'Statut'];
    const escapeCSV = (value: any) => {
      if (value === undefined || value === null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    };

    const rows = data.length
      ? data.map((emp: any) => [
          emp.nom || '', emp.prenom || '', emp.email || '', emp.telephone || '',
          emp.poste || '', emp.departement || '', emp.date_embauche || '',
          emp.salaire || 0,
          emp.status === 'actif' ? 'Actif' : emp.status === 'en_conge' ? 'En congé' : 'Inactif'
        ])
      : [['Aucun employé', '', '', '', '', '', '', 0, '']];

    const totalSalaire = data.reduce((sum: number, emp: any) => sum + (Number(emp.salaire) || 0), 0);
    const totalRow = ['', '', '', '', '', '', '', `TOTAL: ${totalSalaire.toLocaleString('fr-FR')} Ar`, ''];
    const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(',')).concat([totalRow.map(escapeCSV).join(',')])].join('\n');
    
    const fileName = `employes_${period}_${customDate || new Date().toISOString().slice(0,10)}.csv`;
    const result = await saveFileWithDialog(csv, fileName, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!result.success) {
      if (result.canceled) return result;
      throw new Error(result.error || 'Impossible d\'enregistrer le CSV.');
    }
    return result;
  }, [getEmployesForExport]);

  // ... (Toutes les autres fonctions du hook restent inchangées)
  const fetchPaiementCounts = useCallback(async (employesList: any[]) => {
    if (!employesList.length) return;
    const ids = employesList.map(e => e.id);
    try {
      const result = await (window as any).api?.employes?.getPaiementCountsBatch?.(ids);
      if (result?.success) {
        const map: Record<number, number> = {};
        result.data.forEach((row: any) => { map[row.employe_id] = row.count; });
        setPaiementCounts(map);
      }
    } catch (error) {
      console.error('Erreur fetchPaiementCounts:', error);
    }
  }, []);

  const fetchDerniersPaiements = useCallback(async (employesList: any[]) => {
    if (!employesList.length) return;
    if (!window.api?.payments?.getByEmploye) return;
    const derniers: Record<number, any> = {};
    await Promise.all(employesList.map(async (emp) => {
      try {
        const result = await window.api.payments.getByEmploye(emp.id);
        if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
          const sorted = [...result.data].sort((a, b) => {
            const dateA = new Date(a.date_paiement || 0).getTime() || 0;
            const dateB = new Date(b.date_paiement || 0).getTime() || 0;
            if (dateA !== dateB) return dateB - dateA;
            return Number(b.id) - Number(a.id);
          });
          derniers[emp.id] = sorted[0];
        }
      } catch (err) {
        console.error(`Erreur getByEmploye pour employé ${emp.id}:`, err);
      }
    }));
    setDerniersPaiements(prev => ({ ...prev, ...derniers }));
  }, []);

  const loadData = useCallback(async (page = currentPage) => {
    try {
      if (!initialLoadDone.current) setLoading(true);
      else setRefreshing(true);
      const result = await (window as any).api?.employes?.getAll?.({
        page,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch,
        status: filterStatus,
        sort: sortOption,
      });
      if (result?.success) {
        const data = result.data?.items || result.data || [];
        setEmployes(data);
        setTotalItems(result.data?.total || data.length);
        setTotalPages(result.data?.totalPages || Math.ceil((result.data?.total || data.length) / ITEMS_PER_PAGE));
        await fetchDerniersPaiements(data);
        const actifs = data.filter((e: Employe) => e.status === 'actif').length;
        const totalSalaire = data.reduce((sum: number, e: Employe) => sum + (e.salaire || 0), 0);
        setStats({ totalSalaire, actifs, tauxActif: data.length ? Math.round((actifs / data.length) * 100) : 0 });
      }
    } catch (error) {
      console.error('Erreur loadData', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      initialLoadDone.current = true;
    }
  }, [currentPage, debouncedSearch, filterStatus, sortOption, fetchDerniersPaiements]);

  useEffect(() => { loadData(currentPage); }, [currentPage, debouncedSearch, filterStatus, sortOption, loadData]);
  useEffect(() => { if (employes.length) fetchPaiementCounts(employes); }, [employes, fetchPaiementCounts]);

  const loadPaiementsEmploye = useCallback(async (id: number) => {
    if (!window.api?.payments?.getHistorique) return [];
    try {
      const result = await window.api.payments.getHistorique(id);
      const data = result?.success ? result.data || [] : [];
      setHistoriquePaiements(data);
      return data;
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
      return [];
    }
  }, []);

  const refreshPaiementCounts = useCallback(async () => {
    if (employes.length) await fetchPaiementCounts(employes);
  }, [employes, fetchPaiementCounts]);

  const createPaiement = useCallback(async (data: any) => {
    const result = await window.api?.payments?.create?.(data);
    if (result?.success) {
      await refreshPaiementCounts();
      await fetchDerniersPaiements(employes);
      return result.data;
    }
    throw new Error(result?.message || 'Erreur création paiement');
  }, [refreshPaiementCounts, fetchDerniersPaiements, employes]);

  const deletePaiement = useCallback(async (id: number) => {
    const result = await window.api?.payments?.delete?.(id);
    if (result?.success) {
      await refreshPaiementCounts();
      await fetchDerniersPaiements(employes);
      return true;
    }
    throw new Error(result?.message || 'Erreur suppression paiement');
  }, [refreshPaiementCounts, fetchDerniersPaiements, employes]);

  const getEmployeById = useCallback(async (id: number) => {
    const result = await (window as any).api?.employes?.getById?.(id);
    return result?.success ? result.data : null;
  }, []);

  const createEmploye = useCallback(async (data: any) => {
    const result = await (window as any).api?.employes?.create?.(data);
    if (result?.success) { await loadData(1); return result.data; }
    throw new Error(result?.message || 'Erreur création');
  }, [loadData]);

  const updateEmploye = useCallback(async (id: number, data: any) => {
    const result = await (window as any).api?.employes?.update?.(id, data);
    if (result?.success) { await loadData(); return result.data; }
    throw new Error(result?.message || 'Erreur mise à jour');
  }, [loadData]);

  const deleteEmploye = useCallback(async (id: number) => {
    const result = await (window as any).api?.employes?.delete?.(id);
    if (result?.success) { await loadData(); } else { throw new Error(result?.message || 'Erreur suppression'); }
  }, [loadData]);

  const bulkUpdateStatus = useCallback(async (ids: number[], status: string) => {
    const result = await (window as any).api?.employes?.bulkUpdateStatus?.(ids, status);
    if (!result?.success) throw new Error(result?.message || 'Erreur mise à jour en lot');
    await loadData();
  }, [loadData]);

  const bulkDelete = useCallback(async (ids: number[]) => {
    const result = await (window as any).api?.employes?.bulkDelete?.(ids);
    if (!result?.success) throw new Error(result?.message || 'Erreur suppression en lot');
    await loadData();
  }, [loadData]);

  const loadPresence = useCallback(async (employeId: number, mois: number, annee: number) => {
    const result = await window.api?.employes?.getPresence?.(employeId, mois, annee);
    return result?.success ? result.data : null;
  }, []);

  const savePresence = useCallback(async (data: any) => {
    const result = await window.api?.employes?.updatePresence?.(data);
    if (!result?.success) throw new Error(result?.message || 'Erreur enregistrement présence');
  }, []);

  const updateSalary = useCallback(async (employeId: number, newSalary: number, raison: string) => {
    try {
      const result = await window.api?.employes?.updateSalary?.(employeId, newSalary, raison);
      if (!result?.success) throw new Error(result?.message || 'Erreur mise à jour salaire');
      await loadData(); await refreshPaiementCounts();
      return result;
    } catch (error) {
      console.error('Erreur updateSalary:', error);
      throw error;
    }
  }, [loadData, refreshPaiementCounts]);

  const getStatusColor = (status: string) => {
    if (status === 'actif') return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 'en_conge') return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  const getStatusIcon = (status: string) => null;

  return {
    employes,
    loading,
    refreshing,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortOption,
    setSortOption,
    // ⭐ Vaovao
    exportPeriod,
    setExportPeriod,
    exportDate,
    setExportDate,
    // ...
    paiementCounts,
    historiquePaiements,
    derniersPaiements,
    loadPaiementsEmploye,
    createPaiement,
    deletePaiement,
    loadData,
    stats,
    getEmployeById,
    createEmploye,
    updateEmploye,
    deleteEmploye,
    getStatusColor,
    getStatusIcon,
    ITEMS_PER_PAGE,
    refreshPaiementCounts,
    bulkUpdateStatus,
    bulkDelete,
    loadPresence,
    savePresence,
    updateSalary,
    fetchDerniersPaiements,
    exportToExcel,
    exportToPDF,
    exportToCSV,
  };
};