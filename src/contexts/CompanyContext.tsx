
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CompanyInfo {
  id?: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  siret?: string;
  website?: string;
  taxId?: string;
  rcs?: string;
  vatNumber?: string;
  paymentMethod?: string;
  paymentTerms?: string;
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
          console.log('✅ [CompanyContext] Company chargé:', parsed);
          setCompany(parsed);
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
        name: '', address: '', phone: '', email: '',
        siret: '', website: '', taxId: '', rcs: '', vatNumber: '',
        paymentMethod: 'Espèces', paymentTerms: 'Sous 30 jours'
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
        console.log('✅ [CompanyContext] Company rafraîchi:', parsed);
        setCompany(parsed);
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