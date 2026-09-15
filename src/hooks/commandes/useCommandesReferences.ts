// src/hooks/commandes/useCommandesReferences.ts
import { useCallback, useRef, useState } from 'react';

/**
 * ⭐ Clients + Produits (chargés une seule fois)
 */
export const useCommandesReferences = () => {
  const clientsLoaded = useRef(false);
  const produitsLoaded = useRef(false);

  const [clients, setClients] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);

  const loadClientsAndProduits = useCallback(async () => {
    try {
      if (!clientsLoaded.current) {
        const result = await window.api.clients.getAll({ limit: 1000 });
        if (result?.success) setClients(result.data || []);
        clientsLoaded.current = true;
      }
      if (!produitsLoaded.current) {
        const result = await window.api.products.getAll({ status: 'actif', limit: 500 });
        if (result?.success) setProduits(result.data || []);
        produitsLoaded.current = true;
      }
    } catch (error) {
      console.error('❌ loadClientsAndProduits:', error);
    }
  }, []);

  return {
    clients,
    produits,
    loadClientsAndProduits,
    clientsLoaded,
    produitsLoaded,
  };
};