import { useState, useEffect, useCallback, useRef } from 'react';
import { CompanyData } from '../types';
import { useCompany } from '../../../../contexts/CompanyContext';

const cleanText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[''']/g, "'")
    .replace(/[«»"]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[ôö]/g, 'o')
    .replace(/[ûü]/g, 'u')
    .replace(/[îï]/g, 'i')
    .replace(/[ç]/g, 'c')
    .normalize('NFKC')
    .trim();
};

export const useCompanySettings = (
  initialData?: CompanyData,
  onSave?: (data: CompanyData) => void,
  onGenerate?: (data: CompanyData) => Promise<{ canceled?: boolean; success?: boolean; error?: string; filePath?: string }>
) => {
  const { company, updateCompany } = useCompany();
  
  const [formData, setFormData] = useState<CompanyData>({
    name: cleanText(initialData?.name || company?.name || ''),
    address: cleanText(initialData?.address || company?.address || ''),
    phone: cleanText(initialData?.phone || company?.phone || ''),
    email: cleanText(initialData?.email || company?.email || ''),
    siret: cleanText(initialData?.siret || company?.siret || ''),
    website: cleanText(initialData?.website || company?.website || ''),
    taxId: cleanText(initialData?.taxId || company?.taxId || ''),
    rcs: cleanText(initialData?.rcs || company?.rcs || ''),
    vatNumber: cleanText(initialData?.vatNumber || company?.vatNumber || ''),
    paymentMethod: cleanText(initialData?.paymentMethod || company?.paymentMethod || 'Espèces'),
    paymentTerms: cleanText(initialData?.paymentTerms || company?.paymentTerms || 'Sous 30 jours')
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const clearMessages = useCallback(() => {
    setSuccessMessage('');
    setErrorMessage('');
  }, []);

  useEffect(() => {
    const load = async () => {
      await new Promise(r => setTimeout(r, 50));
      
      if (initialData) {
        setFormData({
          name: cleanText(initialData.name || ''),
          address: cleanText(initialData.address || ''),
          phone: cleanText(initialData.phone || ''),
          email: cleanText(initialData.email || ''),
          siret: cleanText(initialData.siret || ''),
          website: cleanText(initialData.website || ''),
          taxId: cleanText(initialData.taxId || ''),
          rcs: cleanText(initialData.rcs || ''),
          vatNumber: cleanText(initialData.vatNumber || ''),
          paymentMethod: cleanText(initialData.paymentMethod || 'Espèces'),
          paymentTerms: cleanText(initialData.paymentTerms || 'Sous 30 jours')
        });
      }
    };
    load();
  }, [initialData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const cleanedValue = cleanText(value);
    setFormData(prev => ({ ...prev, [name]: cleanedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (successMessage || errorMessage) clearMessages();
  }, [errors, successMessage, errorMessage, clearMessages]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.address.trim()) newErrors.address = "L'adresse est requise";
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSaveOnly = useCallback(async () => {
    if (!validate()) {
      setErrorMessage('Veuillez corriger les erreurs');
      return;
    }
    setLoading(true);
    try {
      const dataToSave: CompanyData = {
        ...formData
      };
      if (onSave) {
        onSave(dataToSave);
      } else {
        await updateCompany(dataToSave);
        setSuccessMessage("Informations de l'entreprise mises à jour");
      }
      return dataToSave;
    } catch (error: any) {
      setErrorMessage(`Erreur: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [formData, validate, onSave, updateCompany]);

  const handleGenerate = useCallback(async () => {
    if (!validate()) {
      return { error: 'Veuillez corriger les erreurs' };
    }
    setLoading(true);
    try {
      const dataToSave: CompanyData = {
        ...formData
      };
      
      if (onSave) onSave(dataToSave);
      else await updateCompany(dataToSave);
      
      let generateResult: any = null;
      if (onGenerate) {
        generateResult = await onGenerate(dataToSave);
      }

      if (generateResult && generateResult.canceled) return { canceled: true };
      
      if (!onGenerate) return { success: true };
      
      if (generateResult && generateResult.success) {
        return { success: true, filePath: generateResult.filePath };
      }
      
      if (generateResult === undefined) {
        return { success: true };
      }
      
      return { error: generateResult?.error || 'Erreur lors de la génération de la facture' };
    } catch (error: any) {
      return { error: error.message || 'Erreur lors de la génération de la facture' };
    } finally {
      setLoading(false);
    }
  }, [formData, validate, onSave, onGenerate, updateCompany]);

  return {
    formData,
    loading,
    errors,
    successMessage,
    errorMessage,
    clearMessages,
    handleChange,
    handleSaveOnly,
    handleGenerate
  };
};