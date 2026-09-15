// src/hooks/mouvements/useMouvementsHelpers.ts
import React, { useCallback } from 'react';
import { ArrowDownCircle, ArrowUpCircle, MinusCircle } from 'lucide-react';

export const useMouvementsHelpers = () => {
  const getTypeColor = useCallback((type: string) => {
    const colors: Record<string, string> = {
      ENTREE: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      SORTIE: 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      AJUSTEMENT: 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    };
    return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  }, []);

  const getTypeLabel = useCallback((type: string) => {
    const labels: Record<string, string> = { ENTREE: 'Entrée', SORTIE: 'Sortie', AJUSTEMENT: 'Ajustement' };
    return labels[type] || type;
  }, []);

  const getTypeIcon = useCallback((type: string) => {
    const icons: Record<string, React.ElementType> = { ENTREE: ArrowDownCircle, SORTIE: ArrowUpCircle, AJUSTEMENT: MinusCircle };
    const Icon = icons[type] || MinusCircle;
    return React.createElement(Icon, { className: 'w-3.5 h-3.5' });
  }, []);

  const getPrixUnitaire = useCallback((m: any): number => {
    if (m.prix_unitaire !== undefined && m.prix_unitaire !== null && m.prix_unitaire !== 0) return Number(m.prix_unitaire);
    if (m.produit) {
      if (m.produit.prix_vente) return Number(m.produit.prix_vente);
      if (m.produit.prix_unitaire) return Number(m.produit.prix_unitaire);
      if (m.produit.prix_achat) return Number(m.produit.prix_achat);
      if (m.produit.prix) return Number(m.produit.prix);
    }
    if (m.prix_vente) return Number(m.prix_vente);
    if (m.prix_achat) return Number(m.prix_achat);
    if (m.prix) return Number(m.prix);
    return 0;
  }, []);

  const getTotal = useCallback((m: any): number => {
    const qty = Number(m.quantite) || 0;
    const prix = getPrixUnitaire(m);
    return Math.round(qty * prix * 100) / 100;
  }, [getPrixUnitaire]);

  return {
    getTypeColor,
    getTypeLabel,
    getTypeIcon,
    getPrixUnitaire,
    getTotal,
  };
};