// src/components/clients/ClientsViewModal.tsx
import React, { useMemo } from 'react';
import { X, Pencil, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
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

interface Client {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  type: 'Particulier' | 'Entreprise';
  created_at: string;
  nb_commandes?: number;
  total_achats?: number;
}

interface ClientsViewModalProps {
  client: Client;
  onClose: () => void;
  onEdit: () => void;
  getTypeColor: (type: string) => string;
  isDark?: boolean;
}

const ClientsViewModal: React.FC<ClientsViewModalProps> = ({
  client,
  onClose,
  onEdit,
  getTypeColor,
}) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;

  const initials = useMemo(() => {
    return (client.nom || '?')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0])
      .join('')
      .toUpperCase() || '?';
  }, [client.nom]);

  const formatDate = (date?: string) => {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // ⭐ FIX: Natao mifanaraka amin'ny design rehefa
  const InfoRow = ({ icon: Icon, label, value }: { icon?: any; label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-2 border-b" style={{ borderColor: theme.border }}>
      <div className="flex items-center gap-2 text-[14px] font-medium" style={{ color: theme.muted }}>
        {Icon && <Icon size={14} className="text-brand-500" />}
        <span>{label}</span>
      </div>
      <div className="min-w-0 text-[14px] font-semibold text-right" style={{ color: theme.text }}>
        {value}
      </div>
    </div>
  );

  if (!client) return null;

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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(79,70,229,0.06)' }}>
              <User size={19} style={{ color: theme.primary }} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold" style={{ color: theme.text }}>Détails du client</h2>
              <p className="text-[13px]" style={{ color: theme.muted }}>
                CLI-{String(client.id).padStart(6, '0')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>
            <X size={19} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Profil Client */}
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-lg font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[19px] font-bold leading-tight" style={{ color: theme.text }}>
                  {client.nom}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  {/* ⭐ FIX: Mampiasa ny getTypeColor mba hanova loko ny badge */}
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[13px] font-semibold uppercase ${getTypeColor(client.type)}`}
                  >
                    {client.type}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div
              className="rounded-lg border px-3 py-1.5"
              style={{ background: theme.softBg, borderColor: theme.border }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>
                Total Achats
              </p>
              <p className="mt-1 text-[17px] font-bold" style={{ color: theme.primary }}>
                {Number(client.total_achats || 0).toLocaleString('fr-FR')} Ar
              </p>
            </div>
            <div
              className="rounded-lg border px-3 py-1.5"
              style={{ background: theme.softBg, borderColor: theme.border }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>
                Commandes
              </p>
              <p className="mt-1 text-[17px] font-bold" style={{ color: theme.text }}>
                {client.nb_commandes || 0}
              </p>
            </div>
          </div>

          {/* Informations */}
          <div className="flex flex-col">
            <InfoRow icon={Mail} label="Email" value={client.email || '—'} />
            <InfoRow icon={Phone} label="Téléphone" value={client.telephone || '—'} />
            <InfoRow icon={MapPin} label="Adresse" value={client.adresse || '—'} />
            <InfoRow icon={MapPin} label="Ville" value={client.ville || '—'} />
            <InfoRow label="Code postal" value={client.code_postal || '—'} />
            <InfoRow label="Pays" value={client.pays || '—'} />
            <InfoRow icon={Calendar} label="Client depuis" value={formatDate(client.created_at)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>
            Fermer
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg text-[14px] font-semibold text-white transition-all hover:shadow-md active:scale-[0.98]"
            style={{ background: theme.green, padding: '10px 16px' }}
          >
            <Pencil size={15} strokeWidth={2} />
            Modifier
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientsViewModal;