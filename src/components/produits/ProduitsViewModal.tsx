// src/components/produits/ProduitsViewModal.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ DESIGN MITOVY TANTERAKA AMIN'NY VENTES VIEW MODAL
// ⭐ FIX: NAMPIANA DIVIDERS (border-t) HO AN'NY ANDALANA REHETRA

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

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER (MITOVY AMIN'NY VENTES) */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(79,70,229,0.06)' }}>
              <FileText size={19} style={{ color: theme.primary }} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold" style={{ color: theme.text }}>
                Détails du produit
              </h2>
              <p className="text-[13px]" style={{ color: theme.muted }}>
                {produit.code || `#${produit.id}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>
            <X size={19} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* PRODUIT INFO (MITOVY AMIN'NY CLIENT INFO) */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] uppercase font-semibold text-slate-500 dark:text-slate-400">Produit</p>
                <p className="text-[15px] font-bold" style={{ color: theme.text }}>{produit.nom}</p>
                {produit.fournisseur_nom && <p className="text-[13px]" style={{ color: theme.muted }}>{produit.fournisseur_nom}</p>}
              </div>
              <div>
                <span className="inline-flex items-center rounded-lg border px-3 py-1.5 text-[13px] font-semibold" style={{ background: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}>
                  {isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>

          {/* DETAILS (MITOVY AMIN'NY TOTALS SECTION - MISY DIVIDERS) */}
          <div className="mt-6 flex flex-col">
            {/* Code */}
            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Code</span>
              <span className="font-semibold" style={{ color: theme.text }}>{produit.code || '—'}</span>
            </div>

            {/* Catégorie */}
            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Catégorie</span>
              <span className="font-semibold" style={{ color: theme.text }}>{produit.categorie_nom || '—'}</span>
            </div>

            {/* Fournisseur */}
            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Fournisseur</span>
              <span className="font-semibold" style={{ color: theme.text }}>{produit.fournisseur_nom || '—'}</span>
            </div>

            {/* Prix d'achat */}
            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Prix d'achat</span>
              <span className="font-semibold" style={{ color: theme.text }}>{Number(produit.prix_achat || 0).toLocaleString('fr-FR')} Ar</span>
            </div>

            {/* Prix de vente (GROS & INDIGO) */}
            <div className="flex justify-between text-[16px] font-bold py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.text }}>Prix de vente</span>
              <span style={{ color: theme.primary }}>{Number(produit.prix_vente || 0).toLocaleString('fr-FR')} Ar</span>
            </div>

            {/* Taux de TVA */}
            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Taux de TVA</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatTva(produit.tva_rate)}</span>
            </div>

            {/* Stock */}
            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Stock</span>
              <span className="font-semibold" style={{ color: stockColor }}>{stock} {produit.unite || 'p.'} ({stockLabel})</span>
            </div>

            {/* Stock minimum */}
            <div className="flex justify-between text-[14px] py-2">
              <span style={{ color: theme.muted }}>Stock minimum</span>
              <span className="font-semibold" style={{ color: theme.text }}>{stockMin} {produit.unite || 'p.'}</span>
            </div>
          </div>

          {/* DESCRIPTION (Misy divider eo ambony) */}
          {produit.description && (
            <div className="mt-4 border-t pt-3" style={{ borderColor: theme.border }}>
              <p className="text-[12px] uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2">Description</p>
              <div className="text-[14px] leading-relaxed" style={{ color: theme.text }}>{produit.description}</div>
            </div>
          )}
        </div>

        {/* FOOTER (MITOVY AMIN'NY VENTES) */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>Fermer</button>
          <button onClick={onNewCommande} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.12] hover:bg-slate-100 dark:hover:bg-white/5">
            <ShoppingBag size={15} className="inline mr-1" />Commande
          </button>
          <button onClick={onEdit} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-white" style={{ background: theme.primary }}>
            <Edit size={15} className="inline mr-1" />Modifier
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProduitsViewModal;