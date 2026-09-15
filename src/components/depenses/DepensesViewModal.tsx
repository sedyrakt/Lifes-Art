// src/components/depenses/DepensesViewModal.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProduitsViewModal / ClientsViewModal / FournisseursViewModal / CommandesDetailsModal
// ⭐ FONT SIZE: h2 18px, subtitle 14px, labels 13px, values 15px, buttons 15px

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Edit, Tag } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: {
    card: '#FFFFFF', border: '#E2E8F0', softBg: '#F8FAFC', text: '#0F172A',
    muted: '#64748B', primary: '#4F46E5', green: '#059669', red: '#DC2626', amber: '#D97706'
  },
  dark: {
    card: '#0F172A', border: 'rgba(255,255,255,0.12)', softBg: '#0F172A', text: '#F8FAFC',
    muted: '#94A3B8', primary: '#4F46E5', green: '#34D399', red: '#F87171', amber: '#FBBF24'
  }
};

interface Depense {
  id: number;
  categorie: string;
  description: string;
  montant: number;
  date_depense: string;
  mode_paiement: string;
  reference: string;
  fournisseur_id: number;
  fournisseur_nom?: string;
  observation: string;
  created_at: string;
}

interface DepensesViewModalProps {
  depense: Depense;
  onClose: () => void;
  onEdit: () => void;
  categoryIcons: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>;
  categoryColors: (cat: string) => { light: string; dark: string; text: string; };
}

const formatMoney = (value: any) => `${Number(value || 0).toLocaleString('fr-FR')} Ar`;

const formatDate = (date?: string) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR');
};

const DepensesViewModal: React.FC<DepensesViewModalProps> = ({ depense, onClose, onEdit, categoryIcons, categoryColors }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;
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

  if (!depense) return null;

  const safeDescription = depense?.description || 'Aucune description';
  const montant = Number(depense?.montant || 0);

  const CategoryIcon = categoryIcons?.[depense?.categorie] || Tag;
  const category = categoryColors(depense?.categorie);
  const categoryBg = isDark ? category.dark : category.light;
  const categoryText = category.text;

  // ⭐ InfoRow : 13.5px → 15px, py-2.5 → py-3
  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-3 border-b" style={{ borderColor: theme.border }}>
      <span className="text-[15px]" style={{ color: theme.muted }}>{label}</span>
      <span className="text-[15px] font-semibold text-right" style={{ color: theme.text }}>{value}</span>
    </div>
  );

  const modal = (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="depense-view-title"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl border-[0.5px] shadow-[0_18px_55px_rgba(15,23,42,0.35)] transition-all duration-200 ${
          isVisible ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.98]'
        }`}
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

        {/* HEADER — ⭐ h-14 → h-16, px-4 → px-5 */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-5" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            {/* ⭐ Icon container : h-7 w-7 → h-9 w-9, icon 15 → 18 */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'rgba(79,70,229,0.06)' }}>
              <FileText size={18} strokeWidth={2.2} style={{ color: theme.primary }} />
            </div>
            <div className="min-w-0">
              {/* ⭐ h2 : 13.5px → 18px */}
              <h2 id="depense-view-title" className="truncate text-[18px] font-semibold leading-tight" style={{ color: theme.text }}>
                Détails de la dépense
              </h2>
              {/* ⭐ Subtitle : 11.5px → 14px */}
              <p className="text-[14px] leading-[1.3] mt-0.5 font-mono" style={{ color: theme.muted }}>
                {depense?.reference || `#${depense?.id}`} · {formatDate(depense?.date_depense)}
              </p>
            </div>
          </div>
          {/* ⭐ Close button : h-8 w-8 → h-10 w-10, icon 16 → 19 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
            style={{ color: theme.muted }}
          >
            <X size={19} strokeWidth={2.2} />
          </button>
        </div>

        {/* BODY — ⭐ px-4 py-4 → px-5 py-4 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          
          {/* CATEGORIE INFO */}
          <div className="mb-4">
            <div className="min-w-0">
              {/* ⭐ Label : 11.5px → 13px */}
              <p className="text-[13px] uppercase font-semibold tracking-[0.06em] leading-[1.3]" style={{ color: theme.muted }}>Catégorie</p>
              {/* ⭐ Value : 13.5px → 15px */}
              <p className="text-[15px] font-semibold flex items-center gap-2 mt-1" style={{ color: theme.text }}>
                {/* ⭐ Icon container : h-6 w-6 → h-7 w-7, icon 13 → 15 */}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: categoryBg, color: categoryText }}>
                  <CategoryIcon size={15} strokeWidth={2.2} />
                </span>
                {depense?.categorie || 'Non spécifiée'}
              </p>
              {/* ⭐ Fournisseur : 11.5px → 13.5px */}
              {depense?.fournisseur_nom && (
                <p className="text-[13.5px] leading-[1.3] mt-1" style={{ color: theme.muted }}>
                  Fournisseur : {depense.fournisseur_nom}
                </p>
              )}
            </div>
          </div>

          {/* DETAILS */}
          <div className="mt-4 flex flex-col">
            <InfoRow label="Description" value={safeDescription} />
            <InfoRow label="Montant total" value={<span className="font-semibold" style={{ color: theme.primary }}>{formatMoney(montant)}</span>} />
            <InfoRow label="Mode de paiement" value={depense?.mode_paiement || '—'} />
            <InfoRow label="Date" value={formatDate(depense?.date_depense)} />
            <InfoRow label="Référence" value={depense?.reference || '—'} />
          </div>

          {/* OBSERVATION */}
          {depense?.observation && (
            <div className="mt-4 border-t pt-4" style={{ borderColor: theme.border }}>
              {/* ⭐ Label : 11.5px → 13px */}
              <p className="text-[13px] uppercase font-semibold tracking-[0.06em] leading-[1.3] mb-2" style={{ color: theme.muted }}>Observation</p>
              {/* ⭐ Text : 13.5px → 15px, leading 1.5 → 1.6 */}
              <div className="text-[15px] leading-[1.6]" style={{ color: theme.text }}>{depense.observation}</div>
            </div>
          )}
        </div>

        {/* FOOTER — ⭐ h-14 → h-[72px], px-4 → px-5 */}
        <div className="flex h-[72px] shrink-0 items-center justify-end gap-2 border-t px-5" style={{ borderColor: theme.border, background: theme.softBg }}>
          {/* ⭐ Fermer button : 13px → 15px, h-9 → h-10, px-3.5 → px-4.5 */}
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg px-4.5 text-[15px] font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
            style={{ color: theme.muted }}
          >
            Fermer
          </button>
          {/* ⭐ Modifier button : 13px → 15px, h-9 → h-10, px-3.5 → px-5, icon 14 → 17 */}
          <button
            type="button"
            onClick={onEdit}
            className="flex h-10 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:opacity-90 active:scale-[0.98]"
            style={{ background: theme.primary }}
          >
            <Edit size={17} strokeWidth={2.2} />
            Modifier
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default DepensesViewModal;