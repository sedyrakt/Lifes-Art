// src/hooks/achats/useAchatsReferences.ts
import { useCallback, useRef, useState } from 'react';

/**
 * ⭐ Fournisseurs + Produits — refs + states
 */
export const useAchatsReferences = () => {
  const fournisseursLoaded = useRef(false);
  const produitsLoaded = useRef(false);

  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);

  const loadReferences = useCallback(async (force = false) => {
    if (!fournisseursLoaded.current || force) {
      try {
        if (window.api?.fournisseurs?.getAll) {
          const result = await window.api.fournisseurs.getAll({ limit: 1000 });
          if (result?.success) {
            setFournisseurs(result.data || []);
            fournisseursLoaded.current = true;
          }
        }
      } catch (err) { console.error('❌ Erreur chargement fournisseurs:', err); }
    }
    if (!produitsLoaded.current || force) {
      try {
        const produitsApi = window.api?.produits || window.api?.products;
        if (produitsApi?.getAll) {
          const result = await produitsApi.getAll({ limit: 500, status: 'actif' });
          if (result?.success) {
            setProduits(result.data || []);
            produitsLoaded.current = true;
          }
        }
      } catch (err) { console.error('❌ Erreur chargement produits:', err); }
    }
  }, []);

  return {
    fournisseurs,
    produits,
    loadReferences,
    fournisseursLoaded,
    produitsLoaded,
  };
};