import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3 } from 'lucide-react'; 
import { useTheme } from '../../contexts/ThemeContext';

interface Fournisseur {
  id: number;
  nom: string;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  created_at: string;
}

interface FournisseursViewModalProps {
  fournisseur: Fournisseur;
  onClose: () => void;
  onEdit: () => void;
  isDark?: boolean;
}

const FournisseursViewModal: React.FC<FournisseursViewModalProps> = ({ fournisseur, onClose, onEdit }) => {
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 10);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!fournisseur) return null;

  const getInitiales = (nom?: string) => {
    if (!nom?.trim()) return '?';
    return nom.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();
  };

  const formatDate = (date?: string) => {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-[14px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <div className="min-w-0 text-[15px] font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );

  const modal = (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } bg-black/80 dark:bg-black/80 backdrop-blur-sm`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fournisseur-view-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
    
      <div
        className={`relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-xl transition-all duration-200 ${
          isVisible ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.98]'
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

   
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A] px-6">
          <h2 id="fournisseur-view-title" className="truncate text-[16px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Détails du fournisseur
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            <X size={17} strokeWidth={2} />
          </button>
        </header>

        <main className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-lg font-bold text-white shadow-sm">
              {getInitiales(fournisseur.nom)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[19px] font-bold leading-tight text-slate-900 dark:text-slate-100">
                {fournisseur.nom}
              </h3>
      
              <div className="mt-1 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                Actif
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200 dark:border-white/[0.08] pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <div className="pb-4 mb-2 border-b border-slate-200 dark:border-white/[0.08]">
                <InfoRow label="Contact" value={fournisseur.contact || '—'} />
              </div>
              <div className="pb-4 mb-2 border-b border-slate-200 dark:border-white/[0.08]">
                <InfoRow label="Téléphone" value={fournisseur.telephone || '—'} />
              </div>
              <div className="pb-4 mb-2 border-b border-slate-200 dark:border-white/[0.08]">
                <InfoRow label="Email" value={fournisseur.email || '—'} />
              </div>
              <div className="pb-4 mb-2 border-b border-slate-200 dark:border-white/[0.08]">
                <InfoRow label="Adresse" value={fournisseur.adresse || '—'} />
              </div>
              <div className="pb-4 mb-2 border-b border-slate-200 dark:border-white/[0.08]">
                <InfoRow label="Créée le" value={formatDate(fournisseur.created_at)} />
              </div>
            </div>
          </div>
        </main>


        <footer className="flex h-[64px] shrink-0 items-center justify-end gap-2 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1E293B] px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg px-5 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-brand-500 px-5 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md active:scale-[0.98]"
          >
            <Edit3 size={15} strokeWidth={2} />
            Modifier
          </button>
        </footer>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default FournisseursViewModal;