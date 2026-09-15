// src/hooks/employes/useEmployesFetchers.ts
import { useCallback, useState } from 'react';

export const useEmployesFetchers = () => {
  const [paiementCounts, setPaiementCounts] = useState<Record<number, number>>({});
  const [derniersPaiements, setDerniersPaiements] = useState<Record<number, any>>({});

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

    // ⭐ 1) Essaie le batch (rapide)
    if (window.api?.payments?.getLastBatch) {
      try {
        const ids = employesList.map(e => e.id).filter(Boolean);
        if (ids.length === 0) return;

        const result = await window.api.payments.getLastBatch(ids);
        if (result?.success) {
          setDerniersPaiements(prev => ({ ...prev, ...(result.data || {}) }));
          return;
        }
      } catch (err) {
        console.warn('getLastBatch indisponible, fallback vers getByEmploye:', err);
      }
    }

    // ⭐ 2) Fallback : loop getByEmploye (mais maintenant le handler existe)
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
        console.warn(`getByEmploye indisponible pour employé ${emp.id}:`, err);
      }
    }));
    setDerniersPaiements(prev => ({ ...prev, ...derniers }));
  }, []);

  return {
    paiementCounts,
    derniersPaiements,
    fetchPaiementCounts,
    fetchDerniersPaiements,
  };
};