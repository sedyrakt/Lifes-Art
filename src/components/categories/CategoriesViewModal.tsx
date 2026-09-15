// src/components/categories/CategoriesViewModal.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProduitsViewModal / ProfilePasswordModal
// ⭐ FONT SIZE: h2 18px, subtitle 14px, labels 13px, values 15px, buttons 15px

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Folder, Edit } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: {
    card: '#FFFFFF', border: '#E2E8F0', softBg: '#F8FAFC', text: '#0F172A', muted: '#64748B',
    primary: '#4F46E5', green: '#059669', red: '#DC2626', amber: '#D97706'
  },
  dark: {
    card: '#0F172A', border: 'rgba(255,255,255,0.12)', softBg: '#0F172A', text: '#F8FAFC',
    muted: '#94A3B8', primary: '#4F46E5', green: '#34D399', red: '#F87171', amber: '#FBBF24'
  }
};

interface Categorie {
  id: number;
  nom: string;
  description: string;
  created_at: string;
}

interface CategoriesViewModalProps {
  categorie: Categorie;
  onClose: () => void;
  onEdit: () => void;
  getCategoryColor: (id: number) => string;
  isDark?: boolean;
}

const formatDate = (date?: string) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR');
};

const CategoriesViewModal: React.FC<CategoriesViewModalProps> = ({
  categorie,
  onClose,
  onEdit,
  getCategoryColor,
  isDark: propIsDark,
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark ?? contextIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 10);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!categorie) return null;

  const statutStyle = {
    bg: isDark ? 'rgba(16, 185, 129, 0.12)' : '#D1FAE5',
    text: isDark ? '#34D399' : '#065F46',
    border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4" 
      style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }} 
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl border-[0.5px] shadow-[0_18px_55px_rgba(15,23,42,0.35)]" 
        style={{ background: theme.card, borderColor: theme.border }} 
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER — ⭐ py-3 → py-3.5, px-4 → px-5 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            {/* ⭐ Icon container : p-1.5 → p-2.5, icon 17 → 20 */}
            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(79,70,229,0.06)' }}>
              <Folder size={20} strokeWidth={2.2} style={{ color: theme.primary }} />
            </div>
            <div>
              {/* ⭐ h2 : 13.5px → 18px */}
              <h2 className="text-[18px] font-semibold leading-tight" style={{ color: theme.text }}>
                Détails de la catégorie
              </h2>
              {/* ⭐ Subtitle : 11.5px → 14px */}
              <p className="text-[14px] leading-[1.3] mt-0.5" style={{ color: theme.muted }}>
                {categorie.nom} · #{categorie.id}
              </p>
            </div>
          </div>
          {/* ⭐ Close button : h-8 w-8 → h-10 w-10, icon 17 → 19 */}
          <button 
            onClick={onClose} 
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/5" 
            style={{ color: theme.muted }}
          >
            <X size={19} strokeWidth={2.2} />
          </button>
        </div>

        {/* BODY — ⭐ px-4 py-4 → px-5 py-4 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                {/* ⭐ Label : 11.5px → 13px */}
                <p className="text-[13px] uppercase font-semibold tracking-[0.06em] leading-[1.3]" style={{ color: theme.muted }}>
                  Catégorie
                </p>
                {/* ⭐ Value : 13.5px → 15px */}
                <p className="text-[15px] font-semibold leading-tight mt-1" style={{ color: theme.text }}>
                  {categorie.nom}
                </p>
              </div>
              <div className="shrink-0">
                {/* ⭐ Badge : 11.5px → 13px, px-1.5 py-0.5 → px-2.5 py-1.5 */}
                <span 
                  className="inline-flex items-center rounded-md border px-2.5 py-1.5 text-[13px] font-semibold leading-tight" 
                  style={{ background: statutStyle.bg, color: statutStyle.text, borderColor: statutStyle.border }}
                >
                  Actif
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col">
            {/* ⭐ 13.5px → 15px, py-2.5 → py-3 */}
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>ID</span>
              <span className="font-semibold" style={{ color: theme.text }}>#{categorie.id}</span>
            </div>
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Créée le</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatDate(categorie.created_at)}</span>
            </div>

            <div className="mt-4 border-t pt-4" style={{ borderColor: theme.border }}>
              {/* ⭐ Label : 11.5px → 13px */}
              <p className="text-[13px] uppercase font-semibold tracking-[0.06em] leading-[1.3] mb-2" style={{ color: theme.muted }}>
                Description
              </p>
              {/* ⭐ Description text : 13.5px → 15px, leading 1.5 → 1.6 */}
              <div className="text-[15px] leading-[1.6]" style={{ color: theme.text }}>
                {categorie.description || 'Aucune description'}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER — ⭐ py-3 → py-4, px-4 → px-5 */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
          {/* ⭐ Fermer button : 13px → 15px, h-9 → h-10, px-3.5 → px-4.5 */}
          <button 
            onClick={onClose} 
            className="h-10 rounded-lg px-4.5 text-[15px] font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/5" 
            style={{ color: theme.muted }}
          >
            Fermer
          </button>
          {/* ⭐ Modifier button : 13px → 15px, h-9 → h-10, icon 14 → 17 */}
          <button 
            onClick={onEdit} 
            className="h-10 flex items-center gap-2 rounded-lg px-5 text-[15px] font-semibold text-white transition-colors" 
            style={{ background: theme.primary }}
          >
            <Edit size={17} strokeWidth={2.2} />
            Modifier
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CategoriesViewModal;