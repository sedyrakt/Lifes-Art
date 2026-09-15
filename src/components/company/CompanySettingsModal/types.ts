export interface CompanyData {
  // ═══ ENTREPRISE ═══
  name: string;
  address: string;
  phone: string;
  email: string;
  stat?: string;          // ⭐ RENAMED (taloha: siret)
  website?: string;
  nif?: string;           // ⭐ RENAMED (taloha: taxId)
  rcs?: string;
  vatNumber?: string;
  paymentMethod?: string;
  paymentTerms?: string;

  // ═══ CLIENT ═══
  clientName?: string;
  clientNif?: string;
  clientStat?: string;
  clientRcs?: string;
  clientCif?: string;
  clientAddress?: string;
  clientContact?: string;
}

export interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: CompanyData) => void;
  onGenerate?: (data: CompanyData) => Promise<{ canceled?: boolean; success?: boolean; error?: string; filePath?: string }>;
  initialData?: CompanyData;
  isDark?: boolean;
  mode?: 'save' | 'generate';
  commandeForInvoice?: any;
  onPDFGenerated?: (success: boolean, filePath?: string) => void;
}

export interface CompanySettingsHeaderProps {
  isGenerateMode: boolean;
  isDark: boolean;
  theme: any;
  onClose: () => void;
}

export interface CompanySettingsFormProps {
  formData: CompanyData;
  errors: Record<string, string>;
  isDark: boolean;
  theme: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export interface CompanySettingsActionsProps {
  isGenerateMode: boolean;
  loading: boolean;
  isDark: boolean;
  theme: any;
  onClose: () => void;
  onSave: () => void;
  onGenerate: () => void;
}