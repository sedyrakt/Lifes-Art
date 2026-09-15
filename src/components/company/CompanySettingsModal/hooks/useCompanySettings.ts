// src/components/company/CompanySettingsModal/hooks/useCompanySettings.ts
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

/**
 * ⭐ Extrait le nom du client depuis n'importe quelle structure
 *     (commandeForInvoice.clientName | client_nom | vente.client_nom | ...)
 */
function resolveClientField(commandeForInvoice: any, keys: string[], fallback = ''): string {
  if (!commandeForInvoice) return fallback;
  // 1) Chercher à la racine
  for (const k of keys) {
    if (commandeForInvoice[k]) return commandeForInvoice[k];
  }
  // 2) Chercher dans vente
  if (commandeForInvoice.vente) {
    for (const k of keys) {
      if (commandeForInvoice.vente[k]) return commandeForInvoice.vente[k];
    }
  }
  return fallback;
}

export const useCompanySettings = (
  initialData?: CompanyData,
  onSave?: (data: CompanyData) => void,
  onGenerate?: (data: CompanyData) => Promise<{ canceled?: boolean; success?: boolean; error?: string; filePath?: string }>,
  commandeForInvoice?: any
) => {
  const { company, updateCompany } = useCompany();

  const [formData, setFormData] = useState<CompanyData>({
    // ═══ Entreprise ═══
    name: cleanText(initialData?.name || company?.name || "LIFE'S ART"),
    address: cleanText(initialData?.address || company?.address || ''),
    phone: cleanText(initialData?.phone || company?.phone || ''),
    email: cleanText(initialData?.email || company?.email || ''),

    // ⭐ RENAMED: siret → stat
    stat: cleanText(
      (initialData as any)?.stat ||
      (initialData as any)?.siret ||
      (company as any)?.stat ||
      (company as any)?.siret ||
      ''
    ),

    website: cleanText(initialData?.website || company?.website || ''),

    // ⭐ RENAMED: taxId → nif
    nif: cleanText(
      (initialData as any)?.nif ||
      (initialData as any)?.taxId ||
      (company as any)?.nif ||
      (company as any)?.taxId ||
      ''
    ),

    rcs: cleanText(initialData?.rcs || company?.rcs || ''),
    vatNumber: cleanText(initialData?.vatNumber || company?.vatNumber || ''),
    paymentMethod: cleanText(initialData?.paymentMethod || company?.paymentMethod || 'Espèces'),
    paymentTerms: cleanText(initialData?.paymentTerms || company?.paymentTerms || 'Sous 30 jours'),

    // ═══ Client ═══
    clientName: cleanText(
      initialData?.clientName ||
      resolveClientField(commandeForInvoice, ['clientName', 'client_name', 'client_nom'], '') ||
      ''
    ),
    clientNif: cleanText(initialData?.clientNif || resolveClientField(commandeForInvoice, ['clientNif', 'client_nif'], '')),
    clientStat: cleanText(initialData?.clientStat || resolveClientField(commandeForInvoice, ['clientStat', 'client_stat'], '')),
    clientRcs: cleanText(initialData?.clientRcs || resolveClientField(commandeForInvoice, ['clientRcs', 'client_rcs'], '')),
    clientCif: cleanText(initialData?.clientCif || resolveClientField(commandeForInvoice, ['clientCif', 'client_cif'], '')),
    clientAddress: cleanText(
      initialData?.clientAddress ||
      resolveClientField(commandeForInvoice, ['clientAddress', 'client_address', 'address'], '') ||
      ''
    ),
    clientContact: cleanText(
      initialData?.clientContact ||
      resolveClientField(commandeForInvoice, ['clientContact', 'clientPhone', 'client_phone', 'client_telephone', 'telephone'], '') ||
      ''
    ),
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

  // ⭐ Recharge le formulaire quand initialData, company ou commandeForInvoice change
  useEffect(() => {
    const load = async () => {
      await new Promise(r => setTimeout(r, 50));
      const dataSource: any = initialData || company;

      if (dataSource || commandeForInvoice) {
        setFormData({
          // ═══ Entreprise ═══
          name: cleanText(dataSource?.name || ''),
          address: cleanText(dataSource?.address || ''),
          phone: cleanText(dataSource?.phone || ''),
          email: cleanText(dataSource?.email || ''),
          stat: cleanText(dataSource?.stat || dataSource?.siret || ''),
          website: cleanText(dataSource?.website || ''),
          nif: cleanText(dataSource?.nif || dataSource?.taxId || ''),
          rcs: cleanText(dataSource?.rcs || ''),
          vatNumber: cleanText(dataSource?.vatNumber || ''),
          paymentMethod: cleanText(dataSource?.paymentMethod || 'Espèces'),
          paymentTerms: cleanText(dataSource?.paymentTerms || 'Sous 30 jours'),

          // ═══ Client — cherche dans TOUTES les clés possibles ═══
          clientName: cleanText(
            initialData?.clientName ||
            dataSource?.clientName ||
            resolveClientField(commandeForInvoice, ['clientName', 'client_name', 'client_nom'], '') ||
            ''
          ),
          clientNif: cleanText(
            initialData?.clientNif ||
            dataSource?.clientNif ||
            resolveClientField(commandeForInvoice, ['clientNif', 'client_nif'], '') ||
            ''
          ),
          clientStat: cleanText(
            initialData?.clientStat ||
            dataSource?.clientStat ||
            resolveClientField(commandeForInvoice, ['clientStat', 'client_stat'], '') ||
            ''
          ),
          clientRcs: cleanText(
            initialData?.clientRcs ||
            dataSource?.clientRcs ||
            resolveClientField(commandeForInvoice, ['clientRcs', 'client_rcs'], '') ||
            ''
          ),
          clientCif: cleanText(
            initialData?.clientCif ||
            dataSource?.clientCif ||
            resolveClientField(commandeForInvoice, ['clientCif', 'client_cif'], '') ||
            ''
          ),
          clientAddress: cleanText(
            initialData?.clientAddress ||
            dataSource?.clientAddress ||
            resolveClientField(commandeForInvoice, ['clientAddress', 'client_address', 'address'], '') ||
            ''
          ),
          clientContact: cleanText(
            initialData?.clientContact ||
            dataSource?.clientContact ||
            resolveClientField(commandeForInvoice, ['clientContact', 'clientPhone', 'client_phone', 'client_telephone', 'telephone'], '') ||
            ''
          ),
        });
      }
    };
    load();
  }, [initialData, company, commandeForInvoice]);

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
    if (!formData.name?.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.address?.trim()) newErrors.address = "L'adresse est requise";
    if (!formData.phone?.trim()) newErrors.phone = 'Le téléphone est requis';
    if (!formData.email?.trim()) {
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
      const dataToSave: CompanyData = { ...formData };
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
      const dataToSave: CompanyData = { ...formData };

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
    handleGenerate,
  };
};