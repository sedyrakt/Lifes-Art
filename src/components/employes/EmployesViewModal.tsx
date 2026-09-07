import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Edit, Trash2, CheckCircle } from 'lucide-react';
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
  employe, onClose, onEdit, onDelete, isDark: propIsDark
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark ?? contextIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!employe) { setIsVisible(false); return; }
    const timer = window.setTimeout(() => setIsVisible(true), 10);
    return () => window.clearTimeout(timer);
  }, [employe]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!employe) return null;

  const fullName = `${employe.prenom || ''} ${employe.nom || ''}`.trim();
  const salaire = Number(employe.salaire) || 0;

  const normalizeStatus = (status: string) => String(status || '').toLowerCase().trim();
  const isActive = normalizeStatus(employe.status) === 'actif';

  const statusStyle = isActive
    ? { background: isDark ? 'rgba(16, 185, 129, 0.12)' : '#D1FAE5', text: isDark ? '#34D399' : '#065F46', border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0' }
    : { background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2', text: isDark ? '#F87171' : '#991B1B', border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA' };

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
                Détails de l'employé
              </h2>
              <p className="text-[13px]" style={{ color: theme.muted }}>
                {fullName || `#${employe.id}`}
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
                <p className="text-[12px] uppercase font-semibold text-slate-500 dark:text-slate-400">Employé</p>
                <p className="text-[15px] font-bold" style={{ color: theme.text }}>{fullName || 'Employé inconnu'}</p>
                <p className="text-[13px]" style={{ color: theme.muted }}>{employe.poste || 'Employé'}</p>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold" style={{ background: statusStyle.background, color: statusStyle.text, borderColor: statusStyle.border }}>
                  {isActive ? <CheckCircle size={14} /> : <X size={14} />}
                  {isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col">
            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Email</span>
              <span className="font-semibold text-right" style={{ color: theme.text }}>{employe.email || '—'}</span>
            </div>

            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Téléphone</span>
              <span className="font-semibold" style={{ color: theme.text }}>{employe.telephone || '—'}</span>
            </div>

            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Département</span>
              <span className="font-semibold" style={{ color: theme.text }}>{employe.departement || '—'}</span>
            </div>

            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Embauché le</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatDate(employe.date_embauche)}</span>
            </div>
          </div>

   
          <div className="mt-4 flex flex-col">
            <div className="flex justify-between text-[16px] font-bold py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.text }}>Salaire brut mensuel</span>
              <span style={{ color: theme.primary }}>{formatMoney(salaire)}</span>
            </div>
          </div>
        </div>


        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>Fermer</button>
          
          {onDelete && (
            <button onClick={onDelete} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-white" style={{ background: theme.red }}>
              <Trash2 size={15} className="inline mr-1" />Supprimer
            </button>
          )}

          <button onClick={onEdit} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-white" style={{ background: theme.primary }}>
            <Edit size={15} className="inline mr-1" />Modifier
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployesViewModal;