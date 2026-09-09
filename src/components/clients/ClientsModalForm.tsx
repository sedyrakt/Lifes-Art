// src/components/clients/ClientsModalForm.tsx
import React from 'react';
import { X, Plus, Pencil } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: {
    card: '#FFFFFF', border: '#E2E8F0', softBg: '#F8FAFC', text: '#0F172A',
    muted: '#64748B', primary: '#4F46E5', primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,0.08)', inputBg: '#FFFFFF'
  },
  dark: {
    card: '#0F172A', border: 'rgba(255,255,255,0.12)', softBg: '#0F172A', text: '#F8FAFC',
    muted: '#94A3B8', primary: '#4F46E5', primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,0.12)', inputBg: '#0F172A'
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
  type: 'Particulier' | 'Entreprise';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  editingClient: Client | null;
}

const FormField: React.FC<{ label: string; children: React.ReactNode; required?: boolean; fullWidth?: boolean; }> = ({ label, children, required = false, fullWidth = false }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;
  return (
    <div className={`min-w-0 ${fullWidth ? 'w-full' : ''}`}>
      <label className="mb-1.5 block text-[14px] font-semibold" style={{ color: theme.text }}>
        {label}{required && <span className="ml-1 text-brand-500">*</span>}
      </label>
      {children}
    </div>
  );
};

const ClientsModalForm: React.FC<Props> = ({ isOpen, onClose, onSubmit, editingClient }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;

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

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-modal-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* ⭐ STANDARD HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: theme.primaryBg }}>
              <Plus size={19} style={{ color: theme.primary }} />
            </div>
            <h2 id="client-modal-title" className="text-[17px] font-bold" style={{ color: theme.text }}>
              {editingClient ? 'Modifier le client' : 'Nouveau client'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>
            <X size={19} />
          </button>
        </div>

        {/* ⭐ FIX LEHIBE: NAMPIANA <form onSubmit={onSubmit}> IZAO! */}
        <form onSubmit={onSubmit}>
          {/* STANDARD BODY */}
          <div className="flex-1 overflow-y-auto p-6">
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

          {/* ⭐ STANDARD FOOTER (submis ao anaty form) */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[14px] font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              style={{ background: theme.primary }}
              onMouseEnter={(event) => { event.currentTarget.style.background = theme.primaryHover; }}
              onMouseLeave={(event) => { event.currentTarget.style.background = theme.primary; }}
            >
              {editingClient ? <Pencil size={15} /> : <Plus size={15} />}
              {editingClient ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientsModalForm;