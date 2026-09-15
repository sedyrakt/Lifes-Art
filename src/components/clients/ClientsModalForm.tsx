// src/components/clients/ClientsModalForm.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProduitsModalForm / CategoriesModalForm / FournisseursModalForm
// ⭐ FONT SIZE: h2 18px, labels 14px, inputs 15px, buttons 15px

import React from 'react';
import { X, Plus, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

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
  return (
    <div className={`min-w-0 ${fullWidth ? 'w-full md:col-span-2' : ''}`}>
      {/* ⭐ Label : 12.5px → 14px */}
      <label className="mb-1.5 block text-[14px] font-semibold text-slate-700 dark:text-slate-300">
        {label}{required && <span className="ml-1 text-brand-500">*</span>}
      </label>
      {children}
    </div>
  );
};

const ClientsModalForm: React.FC<Props> = ({ isOpen, onClose, onSubmit, editingClient }) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  // ⭐ Inputs — text-[15px], h-11, px-3.5
  const inputClass = `h-11 w-full rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] px-3.5 text-[15px] font-medium text-slate-900 dark:text-slate-100 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-modal-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-[0_18px_55px_rgba(15,23,42,0.35)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* HEADER — ⭐ h-14 → h-16, px-4 → px-5 */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A] px-5">
          <div className="flex items-center gap-3">
            {/* ⭐ Icon container : p-1.5 → p-2.5, icon 16 → 20 */}
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-500/10">
              {editingClient ? (
                <Check size={20} strokeWidth={2.2} className="text-brand-500 dark:text-brand-400" />
              ) : (
                <Plus size={20} strokeWidth={2.2} className="text-brand-500 dark:text-brand-400" />
              )}
            </div>
            {/* ⭐ h2 : 13.5px → 18px */}
            <h2 id="client-modal-title" className="truncate text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {editingClient ? 'Modifier le client' : 'Nouveau client'}
            </h2>
          </div>
          {/* ⭐ Close button : h-8 w-8 → h-10 w-10, icon 16 → 18 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* BODY — ⭐ px-4 py-4 → px-5 py-5 */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Nom complet" required fullWidth>
                <input type="text" name="nom" defaultValue={editingClient?.nom || ''} required autoFocus={!editingClient} autoComplete="off" placeholder="Nom complet du client" className={inputClass} />
              </FormField>
              <FormField label="Email">
                <input type="email" name="email" defaultValue={editingClient?.email || ''} placeholder="adresse@email.com" className={inputClass} />
              </FormField>
              <FormField label="Téléphone">
                <input type="tel" name="telephone" defaultValue={editingClient?.telephone || ''} placeholder="+261 32 12 345 67" className={inputClass} />
              </FormField>
              <FormField label="Adresse">
                <input type="text" name="adresse" defaultValue={editingClient?.adresse || ''} placeholder="Adresse complète" className={inputClass} />
              </FormField>
              <FormField label="Ville">
                <input type="text" name="ville" defaultValue={editingClient?.ville || ''} placeholder="Antananarivo" className={inputClass} />
              </FormField>
              <FormField label="Code postal">
                <input type="text" name="code_postal" defaultValue={editingClient?.code_postal || ''} placeholder="101" className={inputClass} />
              </FormField>
              <FormField label="Pays">
                <input type="text" name="pays" defaultValue={editingClient?.pays || 'Madagascar'} placeholder="Madagascar" className={inputClass} />
              </FormField>
              <FormField label="Type de client" fullWidth>
                <select name="type" defaultValue={editingClient?.type || 'Particulier'} className={`${inputClass} cursor-pointer`}>
                  <option value="Particulier">Particulier</option>
                  <option value="Entreprise">Entreprise</option>
                </select>
              </FormField>
            </div>
          </div>

          {/* FOOTER — ⭐ h-14 → h-[72px], px-4 → px-5 */}
          <footer className="flex h-[72px] shrink-0 items-center justify-end gap-2 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0F172A] px-5">
            {/* ⭐ Annuler button : 13px → 15px, h-9 → h-10, px-3.5 → px-4.5 */}
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg px-4.5 text-[15px] font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
            >
              Annuler
            </button>
            {/* ⭐ Submit button : 13px → 15px, h-9 → h-10, px-3.5 → px-5, icons 14 → 17 */}
            <button
              type="submit"
              className="flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:scale-[0.98]"
            >
              {editingClient ? <Check size={17} strokeWidth={2.2} /> : <Plus size={17} strokeWidth={2.2} />}
              {editingClient ? 'Enregistrer' : 'Ajouter'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ClientsModalForm;