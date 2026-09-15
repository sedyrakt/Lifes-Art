// src/components/produits/ProduitsViewModal.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProduitsModalForm / ProfilePasswordModal
// ⭐ FONT SIZE: h2 18px, subtitle 14px, labels 13px, values 15px, buttons 15px

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Edit, ShoppingBag } from 'lucide-react';
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

interface Produit {
  id: number;
  code: string;
  nom: string;
  description?: string;
  categorie_nom?: string;
  fournisseur_nom?: string;
  prix_achat: number;
  prix_vente: number;
  quantite_stock: number;
  quantite_minimale: number;
  unite: string;
  status: string;
  nb_commandes?: number;
  tva_rate?: number | null;
  created_at?: string;
}

interface ProduitsViewModalProps {
  produit: Produit;
  onClose: () => void;
  onEdit: () => void;
  onNewCommande: () => void;
  isDark?: boolean;
}

const formatTva = (rate?: number | null) => {
  if (rate === undefined || rate === null || rate === '') return '0%';
  const val = Number(rate);
  if (!Number.isFinite(val)) return '0%';
  return `${(val * 100).toFixed(0)}%`;
};

// ⭐ Helper: formatage date DD/MM/YYYY
const formatDateFr = (dateStr?: string) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const ProduitsViewModal: React.FC<ProduitsViewModalProps> = ({ produit, onClose, onEdit, onNewCommande, isDark: propIsDark }) => {
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

  if (!produit) return null;

  const stock = Number(produit.quantite_stock || 0);
  const stockMin = Number(produit.quantite_minimale || 0);
  const isRupture = stock <= 0;
  const isAlert = !isRupture && stock <= stockMin;
  const isActive = produit.status === 'actif';

  const stockColor = isRupture ? theme.red : isAlert ? theme.amber : theme.green;
  const stockLabel = isRupture ? 'Rupture de stock' : isAlert ? 'Stock faible' : 'Stock suffisant';

  const statusStyle = isActive
    ? { bg: isDark ? 'rgba(16, 185, 129, 0.12)' : '#D1FAE5', text: isDark ? '#34D399' : '#065F46', border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0' }
    : { bg: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2', text: isDark ? '#F87171' : '#991B1B', border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA' };

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
        {/* HEADER — ⭐ py-3 → py-3.5 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            {/* ⭐ Icon container : p-2 → p-2.5, icon 18 → 20 */}
            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(79,70,229,0.06)' }}>
              <FileText size={20} strokeWidth={2.2} style={{ color: theme.primary }} />
            </div>
            <div>
              {/* ⭐ h2 : 16px → 18px */}
              <h2 className="text-[18px] font-semibold leading-tight" style={{ color: theme.text }}>
                Détails du produit
              </h2>
              {/* ⭐ Subtitle : 13.5px → 14px */}
              <p className="text-[14px] leading-[1.3] mt-0.5" style={{ color: theme.muted }}>
                {produit.code || `#${produit.id}`}
              </p>
            </div>
          </div>
          {/* ⭐ Close button : h-9 w-9 → h-10 w-10, icon 18 → 19 */}
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

          {/* PRODUIT INFO */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* ⭐ Label : 12px → 13px */}
                <p className="text-[13px] uppercase font-semibold tracking-[0.06em] leading-[1.3]" style={{ color: theme.muted }}>
                  Produit
                </p>
                {/* ⭐ Value : 14px → 15px */}
                <p className="text-[15px] font-semibold leading-tight mt-1" style={{ color: theme.text }}>
                  {produit.nom}
                </p>
                {/* ⭐ Fournisseur : 12.5px → 13.5px */}
                {produit.fournisseur_nom && (
                  <p className="text-[13.5px] leading-[1.3] mt-1" style={{ color: theme.muted }}>
                    {produit.fournisseur_nom}
                  </p>
                )}
              </div>
              {/* ⭐ Status badge : 12.5px → 13px, px-2 → px-2.5 py-1 → py-1.5 */}
              <span
                className="inline-flex shrink-0 items-center rounded-md border px-2.5 py-1.5 text-[13px] font-semibold leading-tight"
                style={{ background: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
              >
                {isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>

          {/* DETAILS */}
          <div className="mt-4 flex flex-col">
            {/* Code — ⭐ 14px → 15px, py-2.5 → py-3 */}
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Code</span>
              <span className="font-semibold font-mono" style={{ color: theme.text }}>{produit.code || '—'}</span>
            </div>

            {/* Créé le */}
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Créé le</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatDateFr(produit.created_at)}</span>
            </div>

            {/* Catégorie */}
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Catégorie</span>
              <span className="font-semibold" style={{ color: theme.text }}>{produit.categorie_nom || '—'}</span>
            </div>

            {/* Fournisseur */}
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Fournisseur</span>
              <span className="font-semibold" style={{ color: theme.text }}>{produit.fournisseur_nom || '—'}</span>
            </div>

            {/* Prix d'achat */}
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Prix d'achat</span>
              <span className="font-semibold" style={{ color: theme.text }}>{Number(produit.prix_achat || 0).toLocaleString('fr-FR')} Ar</span>
            </div>

            {/* Prix de vente — ⭐ font-semibold + 15px */}
            <div className="flex justify-between text-[15px] font-semibold py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.text }}>Prix de vente</span>
              <span style={{ color: theme.primary }}>{Number(produit.prix_vente || 0).toLocaleString('fr-FR')} Ar</span>
            </div>

            {/* Taux de TVA */}
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Taux de TVA</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatTva(produit.tva_rate)}</span>
            </div>

            {/* Stock */}
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Stock</span>
              <span className="font-semibold" style={{ color: stockColor }}>
                {stock} {produit.unite || 'p.'} <span className="font-normal">({stockLabel})</span>
              </span>
            </div>

            {/* Stock minimum */}
            <div className="flex justify-between text-[15px] py-3">
              <span style={{ color: theme.muted }}>Stock minimum</span>
              <span className="font-semibold" style={{ color: theme.text }}>{stockMin} {produit.unite || 'p.'}</span>
            </div>
          </div>

          {/* DESCRIPTION */}
          {produit.description && (
            <div className="mt-4 border-t pt-4" style={{ borderColor: theme.border }}>
              {/* ⭐ Label : 12px → 13px */}
              <p className="text-[13px] uppercase font-semibold tracking-[0.06em] leading-[1.3] mb-2" style={{ color: theme.muted }}>
                Description
              </p>
              {/* ⭐ Description text : 14px → 15px, leading 1.5 → 1.6 */}
              <div className="text-[15px] leading-[1.6]" style={{ color: theme.text }}>
                {produit.description}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER — ⭐ py-3 → py-4 */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
          {/* ⭐ Fermer button : 14px → 15px, h-9 → h-10, px-3.5 → px-4.5 */}
          <button
            onClick={onClose}
            className="h-10 rounded-lg px-4.5 text-[15px] font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
            style={{ color: theme.muted }}
          >
            Fermer
          </button>
          {/* ⭐ Commande button : 14px → 15px, h-9 → h-10, icon 15 → 17 */}
          <button
            onClick={onNewCommande}
            className="h-10 flex items-center gap-2 rounded-lg px-4.5 text-[15px] font-semibold border transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
            style={{ color: theme.text, borderColor: theme.border }}
          >
            <ShoppingBag size={17} strokeWidth={2.2} />
            Commande
          </button>
          {/* ⭐ Modifier button : 14px → 15px, h-9 → h-10, icon 15 → 17 */}
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

export default ProduitsViewModal;