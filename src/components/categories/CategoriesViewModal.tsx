import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Edit, Folder, Calendar } from 'lucide-react';
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

  return (
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
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(79,70,229,0.06)' }}>
              <Folder size={19} style={{ color: theme.primary }} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold" style={{ color: theme.text }}>
                Détails de la catégorie
              </h2>
              <p className="text-[13px]" style={{ color: theme.muted }}>
                {categorie.nom} · #{categorie.id}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] uppercase font-semibold text-slate-500 dark:text-slate-400">Catégorie</p>
                <p className="text-[15px] font-bold" style={{ color: theme.text }}>{categorie.nom}</p>
              </div>
              <div>
                <span className="inline-flex items-center rounded-lg border px-3 py-1.5 text-[13px] font-semibold" style={{ background: statutStyle.bg, color: statutStyle.text, borderColor: statutStyle.border }}>
                  Actif
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex justify-between text-[14px]">
              <span style={{ color: theme.muted }}>ID</span>
              <span className="font-semibold" style={{ color: theme.text }}>#{categorie.id}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span style={{ color: theme.muted }}>Créée le</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatDate(categorie.created_at)}</span>
            </div>
            <div className="mt-4 border-t pt-3" style={{ borderColor: theme.border }}>
              <p className="text-[12px] uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2">Description</p>
              <div className="text-[14px] leading-relaxed" style={{ color: theme.text }}>
                {categorie.description || 'Aucune description'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>Fermer</button>
          <button onClick={onEdit} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-white" style={{ background: theme.primary }}>
            <Edit size={15} className="inline mr-1" />Modifier
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoriesViewModal;