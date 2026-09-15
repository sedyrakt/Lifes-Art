import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CompanyInfo {
  id?: number;
  // ═══ Entreprise ═══
  name: string;
  address: string;
  phone: string;
  email: string;
  stat?: string;         
  website?: string;
  nif?: string;          
  rcs?: string;
  vatNumber?: string;
  paymentMethod?: string;
  paymentTerms?: string;

  // ═══ Client (isan-facture) ═══
  clientName?: string;
  clientNif?: string;
  clientStat?: string;
  clientRcs?: string;
  clientCif?: string;
  clientAddress?: string;
  clientContact?: string;
}

interface CompanyContextType {
  company: CompanyInfo | null;
  loading: boolean;
  updateCompany: (data: Partial<CompanyInfo>) => Promise<void>;
  getCompany: () => CompanyInfo | null;
  clearCompany: () => void;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);
const STORAGE_KEY = 'tantana_company_info';

// ⭐ Normalisation: migre siret→stat, taxId→nif (raha misy données taloha)
const normalizeCompany = (raw: any): CompanyInfo | null => {
  if (!raw || typeof raw !== 'object') return null;

  return {
    id: raw.id,

    // ═══ Entreprise ═══
    name: raw.name || '',
    address: raw.address || '',
    phone: raw.phone || '',
    email: raw.email || '',

    // ⭐ Backward compat: siret → stat
    stat: raw.stat || raw.siret || '',

    website: raw.website || '',

    // ⭐ Backward compat: taxId → nif
    nif: raw.nif || raw.taxId || '',

    rcs: raw.rcs || '',
    vatNumber: raw.vatNumber || '',
    paymentMethod: raw.paymentMethod || 'Espèces',
    paymentTerms: raw.paymentTerms || 'Sous 30 jours',

    // ═══ Client ═══
    clientName: raw.clientName || '',
    clientNif: raw.clientNif || '',
    clientStat: raw.clientStat || '',
    clientRcs: raw.clientRcs || '',
    clientCif: raw.clientCif || '',
    clientAddress: raw.clientAddress || '',
    clientContact: raw.clientContact || '',
  };
};

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        console.log('💾 [CompanyContext] Chargement depuis localStorage...');
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // ⭐ Migre automatique ho an'ny champ vaovao
          const normalized = normalizeCompany(parsed);
          console.log('✅ [CompanyContext] Company chargé:', normalized);
          setCompany(normalized);

          // Raha nisy migration (raw.siret na raw.taxId), dia averina soratana
          if (parsed && (parsed.siret || parsed.taxId) && normalized) {
            console.log('🔄 [CompanyContext] Migration siret→stat, taxId→nif');
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          }
        } else {
          console.log('⚠️ [CompanyContext] Aucune company trouvée');
          setCompany(null);
        }
      } catch (error) {
        console.error('❌ [CompanyContext] Erreur chargement:', error);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, []);

  const updateCompany = async (data: Partial<CompanyInfo>) => {
    try {
      console.log('💾 [CompanyContext] Mise à jour:', data);
      const current = company || {
        name: '',
        address: '',
        phone: '',
        email: '',
        stat: '',           // ⭐ taloha: siret
        website: '',
        nif: '',            // ⭐ taloha: taxId
        rcs: '',
        vatNumber: '',
        paymentMethod: 'Espèces',
        paymentTerms: 'Sous 30 jours',
        clientName: '',
        clientNif: '',
        clientStat: '',
        clientRcs: '',
        clientCif: '',
        clientAddress: '',
        clientContact: '',
      };
      const updated: CompanyInfo = { ...current, ...data };
      console.log('💾 [CompanyContext] Sauvegarde:', updated);
      setCompany(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log('✅ [CompanyContext] Mise à jour réussie');
    } catch (error) {
      console.error('❌ [CompanyContext] Erreur mise à jour:', error);
      throw error;
    }
  };

  const refreshCompany = async () => {
    try {
      console.log('🔄 [CompanyContext] Rafraîchissement...');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = normalizeCompany(parsed);
        console.log('✅ [CompanyContext] Company rafraîchi:', normalized);
        setCompany(normalized);
      }
    } catch (error) {
      console.error('❌ [CompanyContext] Erreur rafraîchissement:', error);
    }
  };

  const getCompany = () => company;

  const clearCompany = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setCompany(null);
      console.log('🗑️ [CompanyContext] Company effacé');
    } catch (error) {
      console.error('❌ [CompanyContext] Erreur effacement:', error);
    }
  };

  return (
    <CompanyContext.Provider value={{ company, loading, updateCompany, getCompany, clearCompany, refreshCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('❌ useCompany doit être utilisé à l\'intérieur de CompanyProvider.\nVérifiez que votre composant est bien entouré par <CompanyProvider>.');
  }
  return context;
};

export default CompanyContext;