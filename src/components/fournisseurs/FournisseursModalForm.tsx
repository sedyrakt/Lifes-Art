// src/components/fournisseurs/FournisseursModalForm.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProduitsModalForm / CategoriesModalForm
// ⭐ FONT SIZE: h2 18px, labels 14px, inputs 15px, buttons 15px

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Fournisseur { id: number; nom: string; contact: string; telephone: string; email: string; adresse: string; created_at: string; }
interface FournisseursModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  editingFournisseur: Fournisseur | null;
  isDark?: boolean;
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

const FournisseursModalForm: React.FC<FournisseursModalFormProps> = ({ isOpen, onClose, onSubmit, editingFournisseur }) => {
  const { isDark } = useTheme();
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  // ⭐ Inputs — text-[15px], h-11, px-3.5
  const inputClass = `h-11 w-full rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] px-3.5 text-[15px] font-medium text-slate-900 dark:text-slate-100 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`;
  const textareaClass = `w-full resize-none rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] px-3.5 py-3 text-[15px] font-medium text-slate-900 dark:text-slate-100 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`;

  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-200 bg-black/80 dark:bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fournisseur-modal-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="relative z-[100000] flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-[0_18px_55px_rgba(15,23,42,0.35)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

        {/* HEADER — ⭐ h-14 → h-16, px-4 → px-5 */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A] px-5">
          {/* ⭐ h2 : 13.5px → 18px */}
          <h2 id="fournisseur-modal-title" className="truncate text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {editingFournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </h2>
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

        <form ref={formRef} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* ⭐ Content : px-4 py-4 → px-5 py-5 */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Nom du fournisseur" required fullWidth>
                <input type="text" name="nom" defaultValue={editingFournisseur?.nom || ''} required autoFocus={!editingFournisseur} autoComplete="off" placeholder="Nom du fournisseur" className={inputClass} />
              </FormField>
              <FormField label="Contact">
                <input type="text" name="contact" defaultValue={editingFournisseur?.contact || ''} placeholder="Nom du responsable" className={inputClass} />
              </FormField>
              <FormField label="Téléphone">
                <input type="tel" name="telephone" defaultValue={editingFournisseur?.telephone || ''} placeholder="+261 32 12 345 67" className={inputClass} />
              </FormField>
              <FormField label="Adresse e-mail" fullWidth>
                <input type="email" name="email" defaultValue={editingFournisseur?.email || ''} placeholder="adresse@email.com" className={inputClass} />
              </FormField>
              <FormField label="Adresse" fullWidth>
                {/* ⭐ Textarea : rows 3 → 4, leading 5 → 6 */}
                <textarea name="adresse" defaultValue={editingFournisseur?.adresse || ''} rows={4} placeholder="Adresse complète du fournisseur..." className={`${textareaClass} leading-6`} />
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
              {editingFournisseur ? <Check size={17} strokeWidth={2.2} /> : <Plus size={17} strokeWidth={2.2} />}
              {editingFournisseur ? 'Enregistrer' : 'Ajouter'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default FournisseursModalForm;