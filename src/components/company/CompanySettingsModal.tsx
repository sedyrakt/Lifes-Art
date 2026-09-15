// src/components/company/CompanySettingsModal.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileDown, Loader2 } from 'lucide-react';
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
    lockedBg: 'rgba(79,70,229,0.08)',
    lockedBorder: 'rgba(79,70,229,0.30)',
    lockedText: '#312E81',
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
    lockedBg: 'rgba(79,70,229,0.18)',
    lockedBorder: 'rgba(79,70,229,0.45)',
    lockedText: '#C7D2FE',
  }
};

interface ExtendedCompanySettingsModalProps extends CompanySettingsModalProps {
  commandeForInvoice?: any;
  onPDFGenerated?: (success: boolean, filePath?: string) => void;
}

const CompanySettingsModal: React.FC<ExtendedCompanySettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onGenerate,
  initialData,
  isDark: propIsDark,
  mode = 'generate',
  commandeForInvoice,
  onPDFGenerated
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;

  const { formData, loading, errors, handleChange, handleGenerate } = useCompanySettings(
    initialData,
    onSave,
    onGenerate,
    commandeForInvoice
  );

  const [isVisible, setIsVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoError, setLogoError] = useState(false);

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

  // ⭐ Reset logoError quand le thème change ou le logo change
  useEffect(() => { setLogoError(false); }, [isDark, formData.logo]);

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

  // ⭐ Input font : 14px → 14.5px
  const inputClass = `w-full h-10 px-3 rounded-lg border text-[14.5px] font-medium outline-none transition-all duration-150 focus:ring-2 ${
    isDark
      ? 'border-white/[0.12] bg-[#0F172A] text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:ring-brand-500/10'
      : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-brand-500/10'
  }`;

  // ⭐ Locked input font : 14px → 14.5px
  const lockedInputClass = `w-full h-10 px-3 rounded-lg border text-[14.5px] font-semibold cursor-not-allowed select-none`;

  const lockedInputStyle: React.CSSProperties = {
    background: theme.lockedBg,
    borderColor: theme.lockedBorder,
    color: theme.lockedText,
  };

  // ⭐ Label font : 13px → 13.5px
  const labelClass = `block mb-1.5 text-[13.5px] font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`;

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="mb-4 border-b pb-2" style={{ borderColor: theme.border }}>
      {/* ⭐ Section title font : 14px → 14.5px */}
      <h3 className="text-[14.5px] font-bold" style={{ color: theme.text }}>{title}</h3>
    </div>
  );

  // ⭐ Logo entreprise — image selon le thème (public/images/)
  const companyLogo = (formData as any)?.logo || (formData as any)?.image || (isDark ? '/images/logolight.png' : '/images/logodark.png');
  const companyName = formData?.name || "LIFE'S ART";
  const companyInitials = String(companyName)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('') || 'LA';

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
        className={`relative flex w-full max-w-[55%] max-h-[92vh] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.25)] transition-all duration-200 ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[.985]'}`}
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 z-30 h-[3px]" style={{ background: theme.primary }} />

        {/* HEADER avec LOGO */}
        <header className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4 sm:px-6" style={{ borderColor: theme.border, background: theme.surface }}>
          <div className="flex min-w-0 items-center gap-3">
          

            {/* Titre + sous-titre */}
            <div className="min-w-0">
              {/* ⭐ Modal title : 16px → 16.5px, sm: 17px → 17.5px */}
              <h2 id="company-settings-modal-title" className="truncate text-[16.5px] font-semibold tracking-tight sm:text-[17.5px]" style={{ color: theme.text }}>
                Paramètres de l'entreprise &amp; Client
              </h2>
              {/* ⭐ Modal subtitle : 12px → 12.5px */}
              <p className="mt-0.5 truncate text-[12.5px]" style={{ color: theme.muted }}>
                Informations affichées sur la facture
              </p>
            </div>
          </div>

          {/* ⭐ Close button — nampiana bg-slate-100 / border-slate-200 ho an'ny light mode */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            disabled={isGenerating || loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-200 hover:text-brand-600 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:border-transparent dark:bg-transparent dark:text-slate-400 dark:hover:bg-white/[.06] dark:hover:text-white"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6 custom-company-scrollbar">

          {/* SECTION 1 : ENTREPRISE */}
          <div className="mb-6">
            <SectionTitle title="Informations de l'entreprise" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Nom de l'entreprise <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Nom de l'entreprise"
                />
                {/* ⭐ Error text : 12px → 12.5px */}
                {errors?.name && <p className="mt-1 text-[12.5px] text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className={labelClass}>NIF</label>
                <input
                  type="text"
                  name="nif"
                  value={(formData as any).nif || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="NIF"
                />
                {(errors as any)?.nif && <p className="mt-1 text-[12.5px] text-red-500">{(errors as any).nif}</p>}
              </div>

              <div>
                <label className={labelClass}>STAT</label>
                <input
                  type="text"
                  name="stat"
                  value={(formData as any).stat || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="STAT"
                />
                {(errors as any)?.stat && <p className="mt-1 text-[12.5px] text-red-500">{(errors as any).stat}</p>}
              </div>

              <div>
                <label className={labelClass}>RCS</label>
                <input
                  type="text"
                  name="rcs"
                  value={formData.rcs || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="RCS"
                />
                {errors?.rcs && <p className="mt-1 text-[12.5px] text-red-500">{errors.rcs}</p>}
              </div>

              <div>
                <label className={labelClass}>N° TVA</label>
                <input
                  type="text"
                  name="vatNumber"
                  value={formData.vatNumber || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="N° TVA"
                />
                {errors?.vatNumber && <p className="mt-1 text-[12.5px] text-red-500">{errors.vatNumber}</p>}
              </div>

              <div>
                <label className={labelClass}>Site internet</label>
                <input
                  type="text"
                  name="website"
                  value={formData.website || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Site internet"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className={labelClass}>Adresse <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Adresse"
                />
                {errors?.address && <p className="mt-1 text-[12.5px] text-red-500">{errors.address}</p>}
              </div>

              <div>
                <label className={labelClass}>Téléphone <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Téléphone"
                />
                {errors?.phone && <p className="mt-1 text-[12.5px] text-red-500">{errors.phone}</p>}
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Email"
                />
                {errors?.email && <p className="mt-1 text-[12.5px] text-red-500">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* SECTION 2 : CLIENT */}
          <div>
            <SectionTitle title="Informations du client" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2 lg:col-span-3">
                <label className={labelClass} style={{ color: theme.lockedText }}>
                  Nom du client
            
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName || ''}
                  readOnly
                  disabled
                  className={lockedInputClass}
                  style={lockedInputStyle}
                  placeholder="Nom du client"
                  title="Ce champ est en lecture seule — modifiable via la fiche client"
                />
              </div>

              <div>
                <label className={labelClass}>NIF client</label>
                <input
                  type="text"
                  name="clientNif"
                  value={formData.clientNif || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="NIF client"
                />
              </div>

              <div>
                <label className={labelClass}>STAT client</label>
                <input
                  type="text"
                  name="clientStat"
                  value={formData.clientStat || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="STAT client"
                />
              </div>

              <div>
                <label className={labelClass}>RCS client</label>
                <input
                  type="text"
                  name="clientRcs"
                  value={formData.clientRcs || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="RCS client"
                />
              </div>

              <div>
                <label className={labelClass}>CIF client</label>
                <input
                  type="text"
                  name="clientCif"
                  value={formData.clientCif || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="CIF client"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Adresse client</label>
                <input
                  type="text"
                  name="clientAddress"
                  value={formData.clientAddress || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Adresse client"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className={labelClass} style={{ color: theme.lockedText }}>
                  Contact client
               
                </label>
                <input
                  type="text"
                  name="clientContact"
                  value={formData.clientContact || ''}
                  readOnly
                  disabled
                  className={lockedInputClass}
                  style={lockedInputStyle}
                  placeholder="Contact client"
                  title="Ce champ est en lecture seule — modifiable via la fiche client"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t px-5 py-3 sm:px-6" style={{ background: theme.footer, borderColor: theme.border }}>
          {/* ⭐ ESC hint : 11px → 11.5px */}
          <div className="hidden items-center gap-1.5 text-[11.5px] font-medium sm:flex" style={{ color: theme.subMuted }}>
            <span className="rounded border px-1.5 py-0.5" style={{ borderColor: theme.border }}>ESC</span>
            <span>fermer</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* ⭐ Close button font : 13px → 13.5px */}
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating || loading}
              className="h-9 rounded-lg border px-4 text-[13.5px] font-medium transition-all hover:bg-brand-50 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/[.05]"
              style={{ borderColor: theme.border, color: theme.text, background: 'transparent' }}
            >
              Fermer
            </button>
            {/* ⭐ Generate button font : 13px → 13.5px */}
            <button
              type="button"
              onClick={handleGenerateWithClose}
              disabled={loading || isGenerating}
              className="flex h-9 items-center gap-2 rounded-lg px-4 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: theme.primary }}
              onMouseEnter={e => { if (!loading && !isGenerating) e.currentTarget.style.background = theme.primaryHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = theme.primary; }}
            >
              {loading || isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Génération...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  <span>Générer la facture</span>
                </>
              )}
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