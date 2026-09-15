// src/hooks/commandes/useCommandesStats.ts
import { useCallback, useState } from 'react';
import type { GlobalStats, DetteStats } from './types';

/**
 * ⭐ Stats globales + dette + overdue
 */
export const useCommandesStats = () => {
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    total: 0,
    totalCA: 0,
    totalHT: 0,
    totalPaye: 0,
    totalDette: 0,
    nbCommandesNonPayees: 0,
    nbCommandesPayees: 0,
    nbCommandesPartielles: 0,
    nbCommandesEnRetard: 0,
    totalItems: 0,
  });

  const [detteStats, setDetteStats] = useState<DetteStats>({
    total_dette: 0,
    nb_commandes_non_payees: 0,
  });

  const [overdueCommandes, setOverdueCommandes] = useState<any[]>([]);
  const [overdueTotal, setOverdueTotal] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  const loadGlobalStats = useCallback(async () => {
    try {
      if (!window.api?.orders?.getStats) return;
      const result = await window.api.orders.getStats();
      if (result?.success) {
        const data = result.data || {};
        setGlobalStats({
          total: Number(data.total || 0),
          totalCA: Number(data.totalCA || data.total_ca || 0),
          totalHT: Number(data.totalHT || data.total_ht || 0),
          totalPaye: Number(data.totalPaye || data.total_paye || 0),
          totalDette: Number(data.totalDette || data.total_dette || 0),
          nbCommandesNonPayees: Number(data.nbCommandesNonPayees || data.nb_commandes_non_payees || 0),
          nbCommandesPayees: Number(data.nbCommandesPayees || data.nb_commandes_payees || 0),
          nbCommandesPartielles: Number(data.nbCommandesPartielles || data.nb_commandes_partielles || 0),
          nbCommandesEnRetard: Number(data.nbCommandesEnRetard || data.nb_commandes_en_retard || 0),
          totalItems: Number(data.totalItems || data.total_items || 0),
        });
      }
    } catch (error) {
      console.error('❌ loadGlobalStats:', error);
    }
  }, []);

  const loadOverdue = useCallback(async () => {
    try {
      if (!window.api?.orders?.getOverdue) return;
      const result = await window.api.orders.getOverdue();
      if (result?.success) {
        setOverdueCommandes(Array.isArray(result.data) ? result.data : []);
        setOverdueCount(Number(result.count || (result.data || []).length));
        setOverdueTotal(Number(result.total_dette || 0));
      }
    } catch (err) {
      console.error('❌ loadOverdue:', err);
    }
  }, []);

  const getDetteStats = useCallback(async () => {
    try {
      if (!window.api?.orders?.getDetteStats) return { success: false };
      const result = await window.api.orders.getDetteStats();
      if (result?.success) {
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

  return {
    globalStats,
    detteStats,
    overdueCommandes,
    overdueTotal,
    overdueCount,
    loadGlobalStats,
    loadOverdue,
    getDetteStats,
  };
};