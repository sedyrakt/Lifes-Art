
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownToLine, X, Plus, Package, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { ProduitOption } from './EntreesTypes';

interface EntreesModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  produits: ProduitOption[];
}

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

const EntreesModalForm: React.FC<EntreesModalFormProps> = ({ isOpen, onClose, onSubmit, produits }) => {
  const { isDark } = useTheme();
  const [selectedProduitId, setSelectedProduitId] = useState<number | null>(null);
  const [quantite, setQuantite] = useState(0);
  const [prixUnitaire, setPrixUnitaire] = useState(0); 
  const [reference, setReference] = useState('');
  const [observation, setObservation] = useState('');
  const [categorie, setCategorie] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedProduitId(null);
    setQuantite(0);
    setPrixUnitaire(0);
    setObservation('');
    setCategorie('');
    setIsDropdownOpen(false);
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    setReference(`ENT-${random}`);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); formRef.current?.requestSubmit(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectProduit = (produit: ProduitOption) => {
    setSelectedProduitId(produit.id);
    setIsDropdownOpen(false);
    setPrixUnitaire(produit.prix_achat || produit.prix_unitaire || 0);
    setCategorie(produit.categorie_nom || produit.categorie || '');
  };

  const selectedProduit = produits.find(p => p.id === selectedProduitId);


  const inputClass = `h-11 w-full rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] px-3 text-[15px] font-medium text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20`;
  const disabledInputClass = `${inputClass} cursor-not-allowed bg-slate-100 dark:bg-[#1E293B]`;

  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entree-modal-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="relative z-[100000] flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A] px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <ArrowDownToLine size={16} strokeWidth={2} />
            </div>
            <h2 id="entree-modal-title" className="truncate text-[16px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Nouvelle entrée
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]">
            <X size={17} strokeWidth={2} />
          </button>
        </header>

        <form ref={formRef} onSubmit={(e) => { 
          e.preventDefault(); 
          if (selectedProduitId) {
        
            onSubmit({ 
              produit_id: selectedProduitId, 
              quantite, 
              prix_unitaire: prixUnitaire, 
              reference, 
              observation, 
              categorie 
            }); 
          }
        }} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Produit" required fullWidth>
                <div className="relative">
                  <input
                    type="text"
                    value={selectedProduit?.nom || ''}
                    readOnly
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                    placeholder="Sélectionner un produit"
                    className={`${inputClass} cursor-pointer`}
                  />
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-lg">
                      {produits.length > 0 ? (
                        produits.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={() => handleSelectProduit(p)}
                            className={`flex w-full items-center gap-2 px-3 py-3 text-left text-[14px] transition-colors ${
                              selectedProduitId === p.id
                                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                                : 'hover:bg-slate-50 dark:hover:bg-white/[0.06]'
                            }`}
                          >
                            <Package size={15} className="shrink-0 text-brand-500" />
                            <span className="truncate">{p.nom}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-[14px] text-slate-400">Aucun produit</div>
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
                <input type="number" min="1" value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} placeholder="0" className={inputClass} />
              </FormField>

              <FormField label="Prix unitaire (Ar)" fullWidth>
                <input type="number" value={prixUnitaire} readOnly className={disabledInputClass} />
              </FormField>

              <FormField label="Observation" fullWidth>
                <textarea rows={3} value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Description de l'entrée..." className={`${inputClass} resize-none py-2.5 leading-5`} />
              </FormField>
            </div>
          </div>

          <footer className="flex h-[64px] shrink-0 items-center justify-end gap-2 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0F172A] px-6">
            <button type="button" onClick={onClose} className="h-10 rounded-lg px-5 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]">
              Annuler
            </button>
            <button type="submit" className="flex h-10 items-center gap-1.5 rounded-lg bg-brand-500 px-5 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md active:scale-[0.98]">
              <Plus size={15} strokeWidth={2} />
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