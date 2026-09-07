import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: {
    card: '#FFFFFF', border: '#E2E8F0', headerBg: '#FFFFFF', formBg: '#FFFFFF', inputBg: '#FFFFFF',
    softBg: '#F8FAFC', text: '#264653', muted: '#64748B', subMuted: '#94A3B8',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,0.08)',
    primaryBorder: 'rgba(79,70,229,0.20)'
  },
  dark: {
    card: '#0F172A',
    border: 'rgba(255,255,255,0.12)',
    headerBg: '#0F172A',
    formBg: '#0F172A',
    inputBg: '#0F172A',
    softBg: '#1E293B',
    text: '#F8FAFC',
    muted: '#94A3B8',
    subMuted: '#94A3B8',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,0.12)',
    primaryBorder: 'rgba(79,70,229,0.28)'
  }
};

interface Client {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  image?: string;
  type: 'Particulier' | 'Entreprise';
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  editingClient: Client | null;
  isDark?: boolean;
}

const FormField: React.FC<{ label: string; children: React.ReactNode; required?: boolean; fullWidth?: boolean; }> = ({ label, children, required = false, fullWidth = false }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;
  return (
    <div className={`min-w-0 ${fullWidth ? 'w-full' : ''}`}>
      <label className="mb-1.5 block text-[15px] font-medium" style={{ color: theme.text }}>
        {label}{required && <span className="ml-1 text-brand-500">*</span>}
      </label>
      {children}
    </div>
  );
};

const ClientsModalForm: React.FC<Props> = ({ isOpen, onClose, onSubmit, editingClient, isDark: propDark }) => {
  const { isDark: contextDark } = useTheme();
  const isDark = propDark !== undefined ? propDark : contextDark;
  const theme = isDark ? COLORS.dark : COLORS.light;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); formRef.current?.requestSubmit(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  if (!isOpen) return null;

  const inputClass = `h-11 w-full rounded-lg border px-3 text-[15px] font-medium outline-none transition-all placeholder:text-gray-400 focus:ring-2 dark:placeholder:text-gray-500`;
  const inputStyle = { background: theme.inputBg, borderColor: theme.border, color: theme.text };
  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = theme.primary;
    e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.primaryBg}`;
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = theme.border;
    e.currentTarget.style.boxShadow = 'none';
  };

  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-modal-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="relative z-[100000] flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[2px]" style={{ background: theme.primary }} />
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-6" style={{ background: theme.headerBg, borderColor: theme.border }}>
          <h2 id="client-modal-title" className="truncate text-[16px] font-semibold tracking-tight" style={{ color: theme.text }}>
            {editingClient ? 'Modifier le client' : 'Nouveau client'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]" style={{ color: theme.muted }}>
            <X size={17} strokeWidth={2} />
          </button>
        </header>

        <form ref={formRef} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Nom complet" required fullWidth>
                <input type="text" name="nom" defaultValue={editingClient?.nom || ''} required autoFocus={!editingClient} autoComplete="off" placeholder="Nom complet du client" className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>
              <FormField label="Email">
                <input type="email" name="email" defaultValue={editingClient?.email || ''} placeholder="adresse@email.com" className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>
              <FormField label="Téléphone">
                <input type="tel" name="telephone" defaultValue={editingClient?.telephone || ''} placeholder="+261 32 12 345 67" className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>
              <FormField label="Adresse">
                <input type="text" name="adresse" defaultValue={editingClient?.adresse || ''} placeholder="Adresse complète" className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>
              <FormField label="Ville">
                <input type="text" name="ville" defaultValue={editingClient?.ville || ''} placeholder="Antananarivo" className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>
              <FormField label="Code postal">
                <input type="text" name="code_postal" defaultValue={editingClient?.code_postal || ''} placeholder="101" className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>
              <FormField label="Pays">
                <input type="text" name="pays" defaultValue={editingClient?.pays || 'Madagascar'} placeholder="Madagascar" className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>
              <FormField label="Type de client" fullWidth>
                <select name="type" defaultValue={editingClient?.type || 'Particulier'} className={`${inputClass} appearance-none cursor-pointer pr-8`} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                  <option value="Particulier">Particulier</option>
                  <option value="Entreprise">Entreprise</option>
                </select>
              </FormField>
            </div>
          </div>

          <footer className="flex h-[64px] shrink-0 items-center justify-end gap-2 border-t px-6" style={{ background: theme.softBg, borderColor: theme.border }}>
            <button type="button" onClick={onClose} className="h-10 rounded-lg px-5 text-[14px] font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]" style={{ color: theme.muted }}>
              Annuler
            </button>
            <button type="submit" className="flex h-10 items-center gap-1.5 rounded-lg px-5 text-[14px] font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]" style={{ background: theme.primary }} onMouseEnter={(event) => { event.currentTarget.style.background = theme.primaryHover; }} onMouseLeave={(event) => { event.currentTarget.style.background = theme.primary; }}>
              <Plus size={15} strokeWidth={2} />
              {editingClient ? 'Enregistrer' : 'Ajouter'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ClientsModalForm;