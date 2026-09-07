import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit, User, Mail, Phone, MapPin, Building2, Calendar } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: {
    card: '#FFFFFF',
    border: '#E2E8F0',
    headerBg: '#FFFFFF',
    softBg: '#F8FAFC',
    text: '#0F172A',
    muted: '#64748B',
    subMuted: '#94A3B8',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,0.08)',
    green: '#059669',
  },
  dark: {
    card: '#0F172A',
    border: 'rgba(255,255,255,0.12)',
    headerBg: '#0F172A',
    softBg: '#1E293B',
    text: '#F8FAFC',
    muted: '#94A3B8',
    subMuted: '#94A3B8',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,0.12)',
    green: '#34D399',
  },
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
  isDark: propIsDark,
}) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 10);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!client) return null;

  const initials =
    (client.nom || '?')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0])
      .join('')
      .toUpperCase() || '?';

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

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon?: any;
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: theme.muted }}>
        {Icon && <Icon size={14} className="text-brand-500" />}
        <span>{label}</span>
      </div>
      <div className="min-w-0 text-[15px] font-semibold" style={{ color: theme.text }}>
        {value}
      </div>
    </div>
  );

  const modal = (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-view-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-xl transition-all duration-200 ${
          isVisible ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.98]'
        }`}
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[2px]" style={{ background: theme.primary }} />

        <header
          className="flex h-14 shrink-0 items-center justify-between border-b px-5"
          style={{ background: theme.headerBg, borderColor: theme.border }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: theme.primaryBg, color: theme.primary }}
            >
              <User size={16} strokeWidth={2} />
            </div>
            <h2
              id="client-view-title"
              className="truncate text-[16px] font-semibold tracking-tight"
              style={{ color: theme.text }}
            >
              Détails du client
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            style={{ color: theme.muted }}
          >
            <X size={17} strokeWidth={2} />
          </button>
        </header>

        <main className="p-5">
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
                <span className="font-mono text-[13px] font-medium" style={{ color: theme.muted }}>
                  CLI-{String(client.id).padStart(6, '0')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
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

          <div className="mt-4 border-t pt-3" style={{ borderColor: theme.border }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <div className="pb-2.5 mb-1.5 border-b" style={{ borderColor: theme.border }}>
                <InfoRow icon={Mail} label="Email" value={client.email || '—'} />
              </div>
              <div className="pb-2.5 mb-1.5 border-b" style={{ borderColor: theme.border }}>
                <InfoRow icon={Phone} label="Téléphone" value={client.telephone || '—'} />
              </div>
              <div className="pb-2.5 mb-1.5 border-b" style={{ borderColor: theme.border }}>
                <InfoRow icon={MapPin} label="Adresse" value={client.adresse || '—'} />
              </div>
              <div className="pb-2.5 mb-1.5 border-b" style={{ borderColor: theme.border }}>
                <InfoRow icon={MapPin} label="Ville" value={client.ville || '—'} />
              </div>
              <div className="pb-2.5 mb-1.5 border-b" style={{ borderColor: theme.border }}>
                <InfoRow label="Code postal" value={client.code_postal || '—'} />
              </div>
              <div className="pb-2.5 mb-1.5 border-b" style={{ borderColor: theme.border }}>
                <InfoRow label="Pays" value={client.pays || '—'} />
              </div>
              <div className="pb-2.5 mb-1.5 border-b" style={{ borderColor: theme.border }}>
                <InfoRow icon={Calendar} label="Client depuis" value={formatDate(client.created_at)} />
              </div>
            </div>
          </div>
        </main>

        <footer
          className="flex h-[58px] shrink-0 items-center justify-end gap-2 border-t px-5"
          style={{ background: theme.softBg, borderColor: theme.border }}
        >
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg px-4 text-[14px] font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            style={{ color: theme.muted }}
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex h-9 items-center gap-1.5 rounded-lg px-4 text-[14px] font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            style={{ background: theme.primary }}
          >
            <Edit size={15} strokeWidth={2} />
            Modifier
          </button>
        </footer>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ClientsViewModal;