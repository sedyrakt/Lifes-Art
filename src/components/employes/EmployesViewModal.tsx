// src/components/employes/EmployesViewModal.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProduitsViewModal / ClientsViewModal / FournisseursViewModal / AchatsViewModal
// ⭐ FONT SIZE: h2 18px, subtitle 14px, labels 13px, values 15px, buttons 15px

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Edit, Trash2, CheckCircle, Calculator } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: {
    card: '#FFFFFF', border: '#E2E8F0', softBg: '#F8FAFC', text: '#0F172A',
    muted: '#64748B', primary: '#4F46E5', green: '#059669', red: '#DC2626', amber: '#D97706',
  },
  dark: {
    card: '#0F172A', border: 'rgba(255,255,255,0.12)', softBg: '#0F172A', text: '#F8FAFC',
    muted: '#94A3B8', primary: '#4F46E5', green: '#34D399', red: '#F87171', amber: '#FBBF24',
  },
};

interface Employe {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  departement: string;
  date_embauche: string;
  salaire: number;
  cnaps?: number;
  ostie?: number;
  irsa?: number;
  status: string;
  created_at: string;
}

interface EmployesViewModalProps {
  employe: Employe | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onPayer?: () => void;
  isDark?: boolean;
}

const formatMoney = (value: any) => `${Number(value || 0).toLocaleString('fr-FR')} Ar`;

const formatDate = (date?: string) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR');
};

const EmployesViewModal: React.FC<EmployesViewModalProps> = ({
  employe, onClose, onEdit, onDelete,
}) => {
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

  if (!employe) return null;

  const fullName = `${employe.prenom || ''} ${employe.nom || ''}`.trim();
  const salaire = Number(employe.salaire) || 0;

  const cnaps = Number(employe.cnaps) || 0;
  const ostie = Number(employe.ostie) || 0;
  const irsa = Number(employe.irsa) || 0;
  const netAPayer = Math.max(0, salaire - cnaps - ostie - irsa);

  const normalizeStatus = (status: string) => String(status || '').toLowerCase().trim();
  const isActive = normalizeStatus(employe.status) === 'actif';

  const statusStyle = isActive
    ? { background: 'rgba(16, 185, 129, 0.12)', color: theme.green, border: 'rgba(16, 185, 129, 0.3)' }
    : { background: 'rgba(239, 68, 68, 0.12)', color: theme.red, border: 'rgba(239, 68, 68, 0.3)' };

  // ⭐ InfoRow : 13.5px → 15px, py-2.5 → py-3
  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-3 border-b text-[15px]" style={{ borderColor: theme.border }}>
      <span style={{ color: theme.muted }}>{label}</span>
      <span className="font-semibold text-right truncate" style={{ color: theme.text }}>{value}</span>
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
      aria-labelledby="employe-view-title"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-xl border-[0.5px] shadow-[0_18px_55px_rgba(15,23,42,0.35)] transition-all duration-200 ${
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
              <h2 id="employe-view-title" className="truncate text-[18px] font-semibold leading-tight" style={{ color: theme.text }}>
                Détails de l'employé
              </h2>
              {/* ⭐ Subtitle : 11.5px → 14px */}
              <p className="text-[14px] leading-[1.3] mt-0.5" style={{ color: theme.muted }}>
                {fullName || `#${employe.id}`}
              </p>
            </div>
          </div>
          {/* ⭐ Close button : h-8 w-8 → h-10 w-10, icon 16 → 19 */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
            style={{ color: theme.muted }}
            aria-label="Fermer"
          >
            <X size={19} strokeWidth={2.2} />
          </button>
        </div>

        {/* BODY — ⭐ px-4 py-4 → px-5 py-4 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* STATUS & POSTE */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* ⭐ Label : 11.5px → 13px */}
                <p className="text-[13px] uppercase font-semibold tracking-[0.06em] leading-[1.3]" style={{ color: theme.muted }}>Employé</p>
                {/* ⭐ Value : 13.5px → 15px */}
                <p className="text-[15px] font-semibold leading-tight mt-1" style={{ color: theme.text }}>
                  {fullName || 'Employé inconnu'}
                </p>
                {/* ⭐ Poste : 11.5px → 13.5px */}
                <p className="text-[13.5px] leading-[1.3] mt-1" style={{ color: theme.muted }}>
                  {employe.poste || 'Employé'}
                </p>
              </div>
              {/* ⭐ Status badge : 11.5px → 13px, px-1.5 py-0.5 → px-2.5 py-1.5, icons 12 → 14 */}
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px] font-semibold leading-tight"
                style={{ background: statusStyle.background, color: statusStyle.color, borderColor: statusStyle.border }}
              >
                {isActive ? <CheckCircle size={14} strokeWidth={2.2} /> : <X size={14} strokeWidth={2.2} />}
                {isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>

          {/* INFORMATIONS */}
          <div className="mt-4 flex flex-col">
            <InfoRow label="Email" value={employe.email || '—'} />
            <InfoRow label="Téléphone" value={employe.telephone || '—'} />
            <InfoRow label="Département" value={employe.departement || '—'} />
            <InfoRow label="Embauché le" value={formatDate(employe.date_embauche)} />
          </div>

          {/* DÉTAIL SALAIRE */}
          <div
            className="mt-4 rounded-lg border p-4"
            style={{ borderColor: theme.border, background: theme.softBg }}
          >
            <div className="flex items-center gap-2 mb-3">
              {/* ⭐ Calculator icon : 14 → 16 */}
              <Calculator size={16} strokeWidth={2.2} style={{ color: theme.primary }} />
              {/* ⭐ Label : 11.5px → 13px */}
              <span className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: theme.muted }}>
                Détail salaire
              </span>
            </div>

            <div className="space-y-2">
              {/* Salaire brut — ⭐ 13.5px → 15px */}
              <div className="flex justify-between items-center py-1.5 text-[15px]">
                <span style={{ color: theme.muted }}>Salaire brut mensuel</span>
                <span className="font-semibold" style={{ color: theme.text }}>{formatMoney(salaire)}</span>
              </div>

              {/* CNaPS — ⭐ 13.5px → 15px, sub 11.5px → 13px */}
              <div className="flex justify-between items-center py-2 border-t text-[15px]" style={{ borderColor: theme.border }}>
                <span style={{ color: theme.muted }}>
                  CNaPS <span className="text-[13px] opacity-70">(1%)</span>
                </span>
                <span className="font-semibold" style={{ color: theme.amber }}>
                  {cnaps > 0 ? `− ${formatMoney(cnaps)}` : <span style={{ color: theme.muted }}>—</span>}
                </span>
              </div>

              {/* OSTIE */}
              <div className="flex justify-between items-center py-2 border-t text-[15px]" style={{ borderColor: theme.border }}>
                <span style={{ color: theme.muted }}>
                  OSTIE <span className="text-[13px] opacity-70">(5%)</span>
                </span>
                <span className="font-semibold" style={{ color: theme.amber }}>
                  {ostie > 0 ? `− ${formatMoney(ostie)}` : <span style={{ color: theme.muted }}>—</span>}
                </span>
              </div>

              {/* IRSA */}
              <div className="flex justify-between items-center py-2 border-t text-[15px]" style={{ borderColor: theme.border }}>
                <span style={{ color: theme.muted }}>IRSA</span>
                <span className="font-semibold" style={{ color: theme.amber }}>
                  {irsa > 0 ? `− ${formatMoney(irsa)}` : <span style={{ color: theme.muted }}>—</span>}
                </span>
              </div>

              {/* NET À PAYER — ⭐ label 13.5px → 15px, value 13.5px → 16px */}
              <div className="flex justify-between items-center pt-3 border-t-2" style={{ borderColor: theme.border }}>
                <span className="text-[15px] font-bold" style={{ color: theme.text }}>NET À PAYER</span>
                <span className="text-[16px] font-bold" style={{ color: theme.primary }}>{formatMoney(netAPayer)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER — ⭐ h-14 → h-[72px], px-4 → px-5 */}
        <div className="flex h-[72px] shrink-0 items-center justify-end gap-2 border-t px-5" style={{ borderColor: theme.border, background: theme.softBg }}>
          {/* ⭐ Fermer : 13px → 15px, h-9 → h-10, px-3.5 → px-4.5 */}
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg px-4.5 text-[15px] font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
            style={{ color: theme.muted }}
          >
            Fermer
          </button>

          {onDelete && (
            /* ⭐ Supprimer : 13px → 15px, h-9 → h-10, px-3.5 → px-5, icon 14 → 17 */
            <button
              type="button"
              onClick={onDelete}
              className="flex h-10 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold text-white transition-colors hover:opacity-90 active:scale-[0.98]"
              style={{ background: theme.red }}
            >
              <Trash2 size={17} strokeWidth={2.2} />
              Supprimer
            </button>
          )}

          {/* ⭐ Modifier : 13px → 15px, h-9 → h-10, px-3.5 → px-5, icon 14 → 17 */}
          <button
            type="button"
            onClick={onEdit}
            className="flex h-10 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold text-white transition-colors hover:opacity-90 active:scale-[0.98]"
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

export default EmployesViewModal;