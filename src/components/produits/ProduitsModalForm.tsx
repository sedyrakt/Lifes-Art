// src/components/produits/ProduitsModalForm.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: CUSTOM DROPDOWN (MAX HEIGHT + SCROLL)
// ⭐ BALANCED: Nampitombo kely ny width, height, fontSize mba ho mora vakiana
// ⭐ FIX: FOND DARK = #0F172A ho an'ny modal, header, inputs
// ⭐ FIX: ESORINA NY ICON TAG AMIN'NY HEADER

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Plus, ChevronDown } from 'lucide-react'; // Tag removed
import { useTheme } from '../../contexts/ThemeContext';

interface Produit {
  id?: number;
  code?: string;
  nom?: string;
  description?: string;
  categorie_id?: number | null;
  fournisseur_id?: number | null;
  prix_achat?: number;
  prix_vente?: number;
  quantite_stock?: number;
  quantite_minimale?: number;
  unite?: string;
  tva_rate?: number;
  status?: string;
}

interface Category { id: number; nom?: string; name?: string; }
interface Fournisseur { id: number; nom?: string; name?: string; }

interface ProduitsModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  editingProduit?: Produit | null;
  categories?: Category[];
  fournisseurs?: Fournisseur[];
  generateCode: () => string;
  isDark?: boolean;
}

const UNITES = [
  { value: 'pièce', label: 'Pièce' },
  { value: 'L', label: 'Litre (L)' },
  { value: 'ml', label: 'Millilitre (ml)' },
  { value: 'KG', label: 'Kilogramme (KG)' },
  { value: 'g', label: 'Gramme (g)' },
  { value: 'pot', label: 'Pot' },
  { value: 'sachet', label: 'Sachet' },
  { value: 'carton', label: 'Carton' },
];

const TVA_RATES = [
  { value: 0.2, label: 'TVA 20% (Standard)' },
  { value: 0.1, label: 'TVA 10% (Réduit)' },
  { value: 0.0, label: 'TVA 0% (Exonéré)' },
];

const FormField: React.FC<{ label: string; children: React.ReactNode; required?: boolean; fullWidth?: boolean; }> = ({ label, children, required = false, fullWidth = false }) => {
  const { isDark } = useTheme();
  return (
    <div className={`min-w-0 ${fullWidth ? 'w-full' : ''}`}>
      <label className="mb-1.5 block text-[15px] font-medium text-slate-700 dark:text-slate-300">
        {label}{required && <span className="ml-1 text-brand-500">*</span>}
      </label>
      {children}
    </div>
  );
};

const ProduitsModalForm: React.FC<ProduitsModalFormProps> = ({
  isOpen, onClose, onSubmit, editingProduit, categories = [],
  fournisseurs = [], generateCode, isDark: propIsDark
}) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;
  const formRef = useRef<HTMLFormElement>(null);

  const generatedCode = useMemo(() => editingProduit?.code || generateCode(), [editingProduit?.code, generateCode]);

  const [selectedCategorie, setSelectedCategorie] = useState<string | number>(editingProduit?.categorie_id ?? '');
  const [selectedFournisseur, setSelectedFournisseur] = useState<string | number>(editingProduit?.fournisseur_id ?? '');
  const [selectedUnite, setSelectedUnite] = useState<string>(editingProduit?.unite || 'pièce');
  const [selectedTvaRate, setSelectedTvaRate] = useState<number>(editingProduit?.tva_rate ?? 0.2);

  const [categorieOpen, setCategorieOpen] = useState(false);
  const [fournisseurOpen, setFournisseurOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedCategorie(editingProduit?.categorie_id ?? '');
    setSelectedFournisseur(editingProduit?.fournisseur_id ?? '');
    setSelectedUnite(editingProduit?.unite || 'pièce');
    setSelectedTvaRate(editingProduit?.tva_rate ?? 0.2);
    setCategorieOpen(false);
    setFournisseurOpen(false);
  }, [isOpen, editingProduit]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.ctrlKey && event.key.toLowerCase() === 'enter') {
        event.preventDefault();
        const form = document.getElementById('produit-modal-form') as HTMLFormElement | null;
        form?.requestSubmit();
      }
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

  // ⭐ FANITSIANA: inputs sy selects dia #0F172A amin'ny dark
  const inputClass = `h-11 w-full rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] px-3 text-[15px] font-medium text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20`;

  const selectedCatName = categories.find(c => c.id === Number(selectedCategorie))?.nom || categories.find(c => c.id === Number(selectedCategorie))?.name || 'Sélectionner';
  const selectedFourName = fournisseurs.find(f => f.id === Number(selectedFournisseur))?.nom || fournisseurs.find(f => f.id === Number(selectedFournisseur))?.name || 'Sélectionner';

  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="produit-modal-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      {/* ⭐ FANITSIANA: modal container = #0F172A amin'ny dark */}
      <div
        className="relative z-[100000] flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

        {/* HEADER = #0F172A (Icon Tag esorina) */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A] px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* ⭐ ESORINA NY ICON TAG */}
            <h2 id="produit-modal-title" className="truncate text-[16px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {editingProduit ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]">
            <X size={17} strokeWidth={2} />
          </button>
        </header>

        <form id="produit-modal-form" onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              
              <FormField label="Code produit" required>
                <input type="text" name="code" defaultValue={generatedCode} placeholder="PRD-000001" required className={inputClass} />
              </FormField>

              <FormField label="Désignation" required>
                <input type="text" name="nom" defaultValue={editingProduit?.nom || ''} placeholder="Nom du produit" required autoFocus={!editingProduit} className={inputClass} />
              </FormField>

              <FormField label="Catégorie">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setCategorieOpen(!categorieOpen); setFournisseurOpen(false); }}
                    className={`${inputClass} flex items-center justify-between text-left cursor-pointer`}
                  >
                    <span className="truncate">{selectedCatName}</span>
                    <ChevronDown size={16} className={`ml-2 shrink-0 transition-transform ${categorieOpen ? 'rotate-180' : ''}`} style={{ color: 'rgb(148 163 184)' }} />
                  </button>
                  {categorieOpen && (
                    <div
                      className="absolute left-0 right-0 z-50 mt-1.5 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-lg"
                      style={{ maxHeight: '180px' }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategorie(cat.id);
                            setCategorieOpen(false);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                        >
                          <span className="truncate text-[14px] text-slate-700 dark:text-slate-200">{cat.nom || cat.name || `Catégorie #${cat.id}`}</span>
                          {Number(selectedCategorie) === cat.id && <Check size={15} className="text-brand-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                  <input type="hidden" name="categorie_id" value={selectedCategorie} readOnly />
                </div>
              </FormField>

              <FormField label="Fournisseur">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setFournisseurOpen(!fournisseurOpen); setCategorieOpen(false); }}
                    className={`${inputClass} flex items-center justify-between text-left cursor-pointer`}
                  >
                    <span className="truncate">{selectedFourName}</span>
                    <ChevronDown size={16} className={`ml-2 shrink-0 transition-transform ${fournisseurOpen ? 'rotate-180' : ''}`} style={{ color: 'rgb(148 163 184)' }} />
                  </button>
                  {fournisseurOpen && (
                    <div
                      className="absolute left-0 right-0 z-50 mt-1.5 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-lg"
                      style={{ maxHeight: '180px' }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {fournisseurs.map((fournisseur) => (
                        <button
                          key={fournisseur.id}
                          type="button"
                          onClick={() => {
                            setSelectedFournisseur(fournisseur.id);
                            setFournisseurOpen(false);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                        >
                          <span className="truncate text-[14px] text-slate-700 dark:text-slate-200">{fournisseur.nom || fournisseur.name || `Fournisseur #${fournisseur.id}`}</span>
                          {Number(selectedFournisseur) === fournisseur.id && <Check size={15} className="text-brand-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                  <input type="hidden" name="fournisseur_id" value={selectedFournisseur} readOnly />
                </div>
              </FormField>

              <FormField label="Prix d'achat (Ar)">
                <input type="number" name="prix_achat" defaultValue={editingProduit?.prix_achat ?? 0} min="0" step="1" placeholder="0" className={inputClass} />
              </FormField>

              <FormField label="Prix de vente (Ar)" required>
                <input type="number" name="prix_vente" defaultValue={editingProduit?.prix_vente ?? 0} min="0" step="1" placeholder="0" required className={inputClass} />
              </FormField>

              <FormField label="Stock initial">
                <input type="number" name="quantite_stock" defaultValue={editingProduit?.quantite_stock ?? 0} min="0" step="1" placeholder="0" className={inputClass} />
              </FormField>

              <FormField label="Stock minimum">
                <input type="number" name="quantite_minimale" defaultValue={editingProduit?.quantite_minimale ?? 5} min="0" step="1" placeholder="5" className={inputClass} />
              </FormField>

              <FormField label="Unité" required>
                <div className="relative">
                  <select value={selectedUnite} onChange={(e) => setSelectedUnite(e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-8`}>
                    {UNITES.map((unite) => (
                      <option key={unite.value} value={unite.value}>{unite.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input type="hidden" name="unite" value={selectedUnite} readOnly />
                </div>
              </FormField>

              <FormField label="Taux de TVA" required>
                <div className="relative">
                  <select value={selectedTvaRate} onChange={(e) => setSelectedTvaRate(Number(e.target.value))} className={`${inputClass} appearance-none cursor-pointer pr-8`}>
                    {TVA_RATES.map((rate) => (
                      <option key={rate.value} value={rate.value}>{rate.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input type="hidden" name="tva_rate" value={selectedTvaRate} readOnly />
                </div>
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Statut">
                  <div className={`flex h-11 overflow-hidden rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A]`}>
                    <label className="flex flex-1 cursor-pointer items-center justify-center">
                      <input type="radio" name="status" value="actif" defaultChecked={editingProduit?.status !== 'inactif'} className="peer sr-only" />
                      <span className="flex h-full w-[calc(100%-4px)] items-center justify-center gap-1.5 rounded-md text-[14px] font-semibold transition-all peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm dark:peer-checked:bg-white/[0.08] dark:peer-checked:text-emerald-400 text-slate-500 dark:text-slate-400">
                        <Check size={14} /> Actif
                      </span>
                    </label>
                    <label className="flex flex-1 cursor-pointer items-center justify-center">
                      <input type="radio" name="status" value="inactif" defaultChecked={editingProduit?.status === 'inactif'} className="peer sr-only" />
                      <span className="flex h-full w-[calc(100%-4px)] items-center justify-center rounded-md text-[14px] font-semibold transition-all peer-checked:bg-white peer-checked:text-red-600 peer-checked:shadow-sm dark:peer-checked:bg-white/[0.08] dark:peer-checked:text-red-400 text-slate-500 dark:text-slate-400">
                        Inactif
                      </span>
                    </label>
                  </div>
                </FormField>
              </div>

              <div className="md:col-span-3">
                <FormField label="Description">
                  <textarea name="description" defaultValue={editingProduit?.description || ''} placeholder="Description du produit..." rows={2} className={`${inputClass} resize-none py-2.5 leading-5`} />
                </FormField>
              </div>

            </div>
          </div>

          {/* FOOTER = #1E293B amin'ny dark */}
          <footer className="flex h-[64px] shrink-0 items-center justify-end gap-2 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1E293B] px-6">
            <button type="button" onClick={onClose} className="h-10 rounded-lg px-5 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05]">
              Annuler
            </button>
            <button
              type="submit"
              className="flex h-10 items-center gap-1.5 rounded-lg bg-brand-500 px-5 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md active:scale-[0.98]"
            >
              {editingProduit ? <Check size={15} /> : <Plus size={15} />}
              {editingProduit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ProduitsModalForm;