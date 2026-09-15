// src/components/dashboard/hooks/useDashboardDerived.ts
import { useMemo } from 'react';
import { safeNumber } from '../utils/variation';
import type { ChartItem } from '../types';

export const useDashboardDerived = (topProduitsSource: ChartItem[], searchTerm: string) => {
  const topProducts = useMemo(() => {
    const all = topProduitsSource.slice(0, 20).map((product: ChartItem) => ({
      name: product.nom ?? product.name ?? 'Produit',
      quantity: safeNumber(product.total_vendu ?? product.quantite ?? product.quantity),
      sales: safeNumber(product.total_ventes ?? product.total_ca ?? product.ventes ?? product.sales),
      evolution: safeNumber(product.evolution),
    }));
    if (!searchTerm.trim()) return all.slice(0, 5);
    const term = searchTerm.trim().toLowerCase();
    return all.filter((p) => p.name.toLowerCase().includes(term)).slice(0, 5);
  }, [topProduitsSource, searchTerm]);

  return { topProducts };
};