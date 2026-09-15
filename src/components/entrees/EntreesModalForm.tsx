// src/components/entrees/EntreesModalForm.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProduitsModalForm / CategoriesModalForm / AchatsModalForm
// ⭐ FONT SIZE: h2 18px, labels 14px, inputs 15px, buttons 15px
// ⭐ FOND DARK = #0F172A pour TOUS les inputs (même disabled)

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Package, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { ProduitOption } from './EntreesTypes';

interface EntreesModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  produits: ProduitOption[];
  companyName?: string;
  companyLogo?: string;
}

const FormField: React.FC<{ label: string; children: React.ReactNode; required?: boolean; fullWidth?: boolean }> = ({ label, children, required = false, fullWidth = false }) => (
  <div className={`min-w-0 ${fullWidth ? 'w-full md:col-span-2' : ''}`}>
    {/* ⭐ Label : 12.5px → 14px */}
    <label className="mb-1.5 block text-[14px] font-semibold text-slate-700 dark:text-slate-300">
      {label}{required && <span className="ml-1 text-brand-500">*</span>}
    </label>
    {children}
  </div>
);

const generateEntreeReference = () => {
  const timestampPart = Date.now().toString(36).toUpperCase().slice(-2);
  const randomPart = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `ENT-${timestampPart}${randomPart}`;
};

const EntreesModalForm: React.FC<EntreesModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  produits,
  companyName = "LIFE'S ART",
  companyLogo,
}) => {
  const { isDark } = useTheme();
  const [selectedProduitId, setSelectedProduitId] = useState<number | null>(null);
  const [quantite, setQuantite] = useState(0);
  const [prixUnitaire, setPrixUnitaire] = useState(0);
  const [reference, setReference] = useState('');
  const [observation, setObservation] = useState('');
  const [categorie, setCategorie] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedProduitId(null);
    setQuantite(0);
    setPrixUnitaire(0);
    setObservation('');
    setCategorie('');
    setIsDropdownOpen(false);
    setLogoError(false);
    setReference(generateEntreeReference());
  }, [isOpen]);

  useEffect(() => { setLogoError(false); }, [isDark]);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); formRef.current?.requestSubmit(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectProduit = (produit: ProduitOption) => {
    setSelectedProduitId(produit.id);
    setIsDropdownOpen(false);
    setPrixUnitaire(produit.prix_achat || produit.prix_unitaire || 0);
    setCategorie(produit.categorie_nom || produit.categorie || '');
  };

  const selectedProduit = produits.find(p => p.id === selectedProduitId);

  // ⭐ inputClass : h-10 → h-11, text-[13.5px] → text-[15px], px-3.5
  const inputClass = `h-11 w-full rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] px-3.5 text-[15px] font-medium text-slate-900 dark:text-slate-100 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`;
  const disabledInputClass = `${inputClass} cursor-not-allowed text-slate-500 dark:text-slate-400`;

  const brandInitials = String(companyName)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('') || 'LA';
  const brandText = String(companyName || "LIFE'S ART").toUpperCase();

  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entree-modal-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="relative z-[100000] flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-[0_18px_55px_rgba(15,23,42,0.35)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

        {/* HEADER — ⭐ px-4 py-3 → px-5 py-3.5 */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A] px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex flex-col leading-tight">
              {/* ⭐ Brand : 10px → 11px */}
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
                {brandText}
              </span>
              {/* ⭐ h2 : 13.5px → 18px */}
              <h2 id="entree-modal-title" className="truncate text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
                Nouvelle entrée
              </h2>
            </div>
          </div>
          {/* ⭐ Close button : h-8 w-8 → h-10 w-10, icon 16 → 19 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            <X size={19} strokeWidth={2.2} />
          </button>
        </header>

        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedProduitId) {
              onSubmit({
                produit_id: selectedProduitId,
                quantite,
                prix_unitaire: prixUnitaire,
                reference,
                observation,
                categorie,
              });
            }
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* ⭐ Body : px-4 py-4 → px-5 py-5 */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* PRODUIT — Custom Dropdown */}
              <FormField label="Produit" required fullWidth>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-label="Sélectionner un produit"
                    aria-expanded={isDropdownOpen}
                    className={`${inputClass} flex items-center justify-between text-left cursor-pointer`}
                  >
                    <span className={`truncate ${selectedProduit ? '' : 'text-slate-400 dark:text-slate-500'}`}>
                      {selectedProduit?.nom || 'Sélectionner un produit'}
                    </span>
                    {/* ⭐ Chevron : 15 → 17 */}
                    <ChevronDown size={17} strokeWidth={2.2} className={`ml-2 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} text-slate-400 dark:text-slate-500`} />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-lg">
                      {produits.length > 0 ? (
                        produits.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectProduit(p)}
                            /* ⭐ Item : text-[13.5px] → text-[15px], py-2 → py-2.5 */
                            className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[15px] transition-colors ${
                              selectedProduitId === p.id
                                ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/20 dark:text-brand-400'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              {/* ⭐ Package icon : 14 → 16 */}
                              <Package size={16} strokeWidth={2.2} className="shrink-0 text-brand-500" />
                              <span className="truncate">{p.nom}</span>
                            </span>
                            {/* ⭐ Check icon : 14 → 16 */}
                            {selectedProduitId === p.id && <Check size={16} strokeWidth={2.2} className="shrink-0 text-brand-500" />}
                          </button>
                        ))
                      ) : (
                        /* ⭐ Empty : text-[13.5px] → text-[15px] */
                        <div className="px-3.5 py-3 text-[15px] text-slate-400">Aucun produit</div>
                      )}
                    </div>
                  )}
                </div>
              </FormField>

              <FormField label="Référence">
                <input type="text" value={reference} readOnly className={disabledInputClass} />
              </FormField>

              <FormField label="Catégorie">
                <input type="text" value={categorie} readOnly className={disabledInputClass} />
              </FormField>

              <FormField label="Quantité" required>
                <input
                  type="number"
                  min="1"
                  value={quantite}
                  onChange={(e) => setQuantite(Number(e.target.value))}
                  placeholder="0"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Prix unitaire (Ar)" fullWidth>
                <div className="relative">
                  <input type="number" value={prixUnitaire} readOnly className={`${disabledInputClass} pr-12`} />
                  {/* ⭐ "Ar" : 11.5px → 13.5px, right-3 (aligned) */}
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">Ar</span>
                </div>
              </FormField>

              <FormField label="Observation" fullWidth>
                <textarea
                  rows={3}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Description de l'entrée..."
                  className={`${inputClass} resize-none py-3 leading-[1.5]`}
                />
              </FormField>
            </div>
          </div>

          {/* FOOTER — ⭐ h-14 → h-[72px], px-4 → px-5 */}
          <footer className="flex h-[72px] shrink-0 items-center justify-end gap-2 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0F172A] px-5">
            {/* ⭐ Annuler : 13px → 15px, h-9 → h-10, px-3.5 → px-4.5 */}
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg px-4.5 text-[15px] font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
            >
              Annuler
            </button>
            {/* ⭐ Enregistrer : 13px → 15px, h-9 → h-10, px-3.5 → px-5, icon 14 → 17 */}
            <button
              type="submit"
              className="flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:scale-[0.98]"
            >
              <Plus size={17} strokeWidth={2.2} />
              Enregistrer
            </button>
          </footer>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default EntreesModalForm;