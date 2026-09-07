

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCompanySettings } from './CompanySettingsModal/hooks/useCompanySettings';
import { CompanySettingsModalProps } from './CompanySettingsModal/types';

const COLORS = {
  light: {
    overlay: 'rgba(15,23,42,.55)',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSoft: '#F8FAFC',
    footer: '#F8FAFC',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#475569',
    subMuted: '#94A3B8',
    primary: '#4F46E5', 
    primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,.07)',
    primaryBorder: 'rgba(79,70,229,.15)',
  },
  dark: {
    overlay: 'rgba(0, 0, 0, 0.73)',
    card: '#0F172A',
    surface: '#0F172A',
    surfaceSoft: '#1E293B',
    footer: '#0F172A',
    border: 'rgba(255,255,255,0.12)',
    text: '#F8FAFC',
    muted: '#94A3B8',
    subMuted: '#94A3B8',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,.12)',
    primaryBorder: 'rgba(79,70,229,.20)',
  }
};

interface ExtendedCompanySettingsModalProps extends CompanySettingsModalProps {
  commandeForInvoice?: any;
  onPDFGenerated?: (success: boolean, filePath?: string) => void;
}

const CompanySettingsModal: React.FC<ExtendedCompanySettingsModalProps> = ({
  isOpen, onClose, onSave, onGenerate, initialData, isDark: propIsDark, mode = 'generate', commandeForInvoice, onPDFGenerated
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;
  const { formData, loading, errors, handleChange, handleGenerate } = useCompanySettings(initialData, onSave, onGenerate);
  const [isVisible, setIsVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) { setIsVisible(false); return; }
    const timer = window.setTimeout(() => setIsVisible(true), 10);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isGenerating, loading, onClose]);

  const handleGenerateWithClose = async () => {
    if (isGenerating || loading) return;
    setIsGenerating(true);
    try {
      const result = await handleGenerate();
      if (result?.canceled) { onPDFGenerated?.(false); return; }
      if (result?.success) { onPDFGenerated?.(true, result?.filePath); onClose(); return; }
      onPDFGenerated?.(false);
    } catch (error) {
      onPDFGenerated?.(false);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = `w-full h-10 px-3 rounded-lg border text-[14px] font-medium outline-none transition-all duration-150 focus:ring-2 ${
    isDark
      ? 'border-white/[0.12] bg-[#0F172A] text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:ring-brand-500/10'
      : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-brand-500/10'
  }`;

  const labelClass = `block mb-1.5 text-[13px] font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`;


  const SectionTitle = ({ title }: { title: string }) => (
    <div className="mb-4 pb-2 border-b" style={{ borderColor: theme.border }}>
      <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{title}</h3>
    </div>
  );

  const modal = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-3 sm:p-5 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: theme.overlay, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-settings-modal-title"
      onMouseDown={e => { if (e.target === e.currentTarget && !isGenerating && !loading) onClose(); }}
    >
      <div
        className={`relative flex w-full max-w-[58%] max-h-[90vh] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.25)] transition-all duration-200 ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[.985]'}`}
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 z-30 h-[3px]" style={{ background: theme.primary }} />

   
        <header className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4 sm:px-6" style={{ borderColor: theme.border, background: theme.surface }}>
          <div className="min-w-0">
            <h2 id="company-settings-modal-title" className="truncate text-[16px] font-semibold tracking-tight sm:text-[17px]" style={{ color: theme.text }}>Paramètres de l'entreprise</h2>
            <p className="mt-0.5 truncate text-[12px]" style={{ color: theme.muted }}>Gérez les informations de votre société</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" disabled={isGenerating || loading} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-brand-50 hover:text-brand-600 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/[.06] dark:hover:text-white">
            <X className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </header>


        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6 custom-company-scrollbar">
       
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    
            <div className="space-y-4">
              <SectionTitle title="Informations générales" />
              <div>
                <label className={labelClass}>Nom de l'entreprise</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className={inputClass} placeholder="Nom de l'entreprise" />
                {errors?.name && <p className="mt-1 text-[12px] text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className={labelClass}>SIRET</label>
                <input type="text" name="siret" value={formData.siret || ''} onChange={handleChange} className={inputClass} placeholder="123 456 789 00012" />
                {errors?.siret && <p className="mt-1 text-[12px] text-red-500">{errors.siret}</p>}
              </div>
            </div>

       
            <div className="space-y-4">
              <SectionTitle title="Coordonnées" />
              <div>
                <label className={labelClass}>Adresse</label>
                <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className={inputClass} placeholder="Lot II M 45 Antananarivo" />
                {errors?.address && <p className="mt-1 text-[12px] text-red-500">{errors.address}</p>}
              </div>
              <div>
                <label className={labelClass}>Téléphone</label>
                <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClass} placeholder="+261 34 12 345 67" />
                {errors?.phone && <p className="mt-1 text-[12px] text-red-500">{errors.phone}</p>}
              </div>
            </div>

  
            <div className="space-y-4">
              <SectionTitle title="Informations légales" />
              <div>
                <label className={labelClass}>Tax ID</label>
                <input type="text" name="taxId" value={formData.taxId || ''} onChange={handleChange} className={inputClass} placeholder="4001234567" />
                {errors?.taxId && <p className="mt-1 text-[12px] text-red-500">{errors.taxId}</p>}
              </div>
              <div>
                <label className={labelClass}>RCS</label>
                <input type="text" name="rcs" value={formData.rcs || ''} onChange={handleChange} className={inputClass} placeholder="RCS Antananarivo B 12345" />
                {errors?.rcs && <p className="mt-1 text-[12px] text-red-500">{errors.rcs}</p>}
              </div>
            </div>
          </div>

       
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} placeholder="contact@entreprise.mg" />
              {errors?.email && <p className="mt-1 text-[12px] text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className={labelClass}>Numéro TVA</label>
              <input type="text" name="vatNumber" value={formData.vatNumber || ''} onChange={handleChange} className={inputClass} placeholder="MG-123456789" />
              {errors?.vatNumber && <p className="mt-1 text-[12px] text-red-500">{errors.vatNumber}</p>}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t px-5 py-3 sm:px-6" style={{ background: theme.footer, borderColor: theme.border }}>
          <div className="hidden items-center gap-1.5 text-[11px] font-medium sm:flex" style={{ color: theme.subMuted }}>
            <span className="rounded border px-1.5 py-0.5" style={{ borderColor: theme.border }}>ESC</span>
            <span>fermer</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={onClose} disabled={isGenerating || loading} className="h-9 rounded-lg border px-4 text-[13px] font-medium transition-all hover:bg-brand-50 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/[.05]" style={{ borderColor: theme.border, color: theme.text, background: 'transparent' }}>Fermer</button>
            <button type="button" onClick={handleGenerateWithClose} disabled={loading || isGenerating} className="flex h-9 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50" style={{ background: theme.primary }} onMouseEnter={e => { if (!loading && !isGenerating) e.currentTarget.style.background = theme.primaryHover; }} onMouseLeave={e => { e.currentTarget.style.background = theme.primary; }}>
              {loading || isGenerating ? (<><span className="animate-spin">⚙️</span>Génération...</>) : ('Générer la facture')}
            </button>
          </div>
        </div>

        <style>{`
          .custom-company-scrollbar{scrollbar-width:thin;scrollbar-color:rgba(79,70,229,.28) transparent}
          .custom-company-scrollbar::-webkit-scrollbar{width:6px}
          .custom-company-scrollbar::-webkit-scrollbar-track{background:transparent}
          .custom-company-scrollbar::-webkit-scrollbar-thumb{background:rgba(79,70,229,.22);border-radius:999px}
          .custom-company-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(79,70,229,.38)}
        `}</style>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default CompanySettingsModal;