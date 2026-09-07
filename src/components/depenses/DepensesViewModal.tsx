// src/components/depenses/DepensesViewModal.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ DESIGN MITOVY TANTERAKA AMIN'NY VENTES VIEW MODAL

import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Edit, Tag } from 'lucide-react';
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
  isDark?: boolean;
}

const formatMoney = (value: any) => `${Number(value || 0).toLocaleString('fr-FR')} Ar`;

const formatDate = (date?: string) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR');
};

const DepensesViewModal: React.FC<DepensesViewModalProps> = ({ depense, onClose, onEdit, categoryIcons, categoryColors, isDark: propIsDark }) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark ?? contextIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;

  const safeDescription = depense?.description || 'Aucune description';
  const montant = Number(depense?.montant || 0);

  const CategoryIcon = categoryIcons?.[depense?.categorie] || Tag;
  const category = categoryColors(depense?.categorie);
  const categoryBg = isDark ? category.dark : category.light;
  const categoryText = category.text;

  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
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
                Détails de la dépense
              </h2>
              <p className="text-[13px]" style={{ color: theme.muted }}>
                {depense?.reference || `#${depense?.id}`} · {formatDate(depense?.date_depense)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>
            <X size={19} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* CATEGORIE INFO (MITOVY AMIN'NY "CLIENT" AO AMIN'NY VENTES) */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] uppercase font-semibold text-slate-500 dark:text-slate-400">Catégorie</p>
                <p className="text-[15px] font-bold flex items-center gap-2" style={{ color: theme.text }}>
                  <span className="p-1 rounded-md" style={{ background: categoryBg, color: categoryText }}>
                    <CategoryIcon size={15} />
                  </span>
                  {depense?.categorie || 'Non spécifiée'}
                </p>
                {depense?.fournisseur_nom && <p className="text-[13px]" style={{ color: theme.muted }}>{depense.fournisseur_nom}</p>}
              </div>
            </div>
          </div>

          {/* TABLE DESCRIPTION (MITOVY AMIN'NY TABLE PRODUIT) */}
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: theme.border }}>
            <table className="w-full text-left">
              <thead style={{ background: theme.softBg }}>
                <tr className="text-[12px] uppercase text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5 text-center">Qté</th>
                  <th className="px-4 py-2.5 text-right">Prix</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t" style={{ borderColor: theme.border }}>
                  <td className="px-4 py-3">
                    <p className="text-[14px] font-semibold" style={{ color: theme.text }}>{safeDescription}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-[14px]" style={{ color: theme.muted }}>1</td>
                  <td className="px-4 py-3 text-right text-[14px]" style={{ color: theme.muted }}>{formatMoney(montant)}</td>
                  <td className="px-4 py-3 text-right text-[14px] font-semibold" style={{ color: theme.text }}>{formatMoney(montant)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TOTALS (MITOVY AMIN'NY VENTES) */}
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex justify-between text-[14px]">
              <span style={{ color: theme.muted }}>Montant total</span>
              <span className="font-bold" style={{ color: theme.primary }}>{formatMoney(montant)}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span style={{ color: theme.muted }}>Mode de paiement</span>
              <span className="font-semibold" style={{ color: theme.text }}>{depense?.mode_paiement || '—'}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span style={{ color: theme.muted }}>Date</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatDate(depense?.date_depense)}</span>
            </div>
            {depense?.observation && (
              <div className="mt-4 border-t pt-3" style={{ borderColor: theme.border }}>
                <p className="text-[12px] uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2">Observation</p>
                <div className="text-[14px] leading-relaxed" style={{ color: theme.text }}>{depense.observation}</div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER (MITOVY AMIN'NY VENTES) */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>Fermer</button>
          <button onClick={onEdit} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-white" style={{ background: theme.primary }}>
            <Edit size={15} className="inline mr-1" />Modifier
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default DepensesViewModal;