// src/components/clients/ClientsViewModal.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProduitsViewModal / FournisseursViewModal
// ⭐ FONT SIZE: h2 18px, labels 13px, values 15px, buttons 15px

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Pencil, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

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

  // ⭐ InfoRow — 13.5px → 15px, icon 13 → 14, py-2.5 → py-3
  const InfoRow = ({ icon: Icon, label, value }: { icon?: any; label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 text-[15px] py-3 border-b border-slate-200 dark:border-white/[0.08]">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {Icon && <Icon size={14} strokeWidth={2.2} className="text-brand-500 shrink-0" />}
        <span>{label}</span>
      </div>
      <span className="min-w-0 truncate text-right font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );

  if (!client) return null;

  const modal = (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } bg-black/80 dark:bg-black/80 backdrop-blur-sm`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-view-title"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-[0_18px_55px_rgba(15,23,42,0.35)] transition-all duration-200 ${
          isVisible ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.98]'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

        {/* HEADER — ⭐ h-14 → h-16, px-4 → px-5 */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A] px-5">
          <div className="flex min-w-0 items-center gap-3">
            {/* ⭐ Icon container : h-7 w-7 → h-9 w-9, icon 15 → 18 */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <User size={18} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              {/* ⭐ h2 : 13.5px → 18px */}
              <h2 id="client-view-title" className="truncate text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Détails du client
              </h2>
              {/* ⭐ Subtitle : 11.5px → 14px */}
              <p className="text-[14px] leading-[1.3] mt-0.5 text-slate-500 dark:text-slate-400">
                CLI-{String(client.id).padStart(6, '0')}
              </p>
            </div>
          </div>
          {/* ⭐ Close button : h-8 w-8 → h-10 w-10, icon 16 → 19 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            <X size={19} strokeWidth={2.2} />
          </button>
        </header>

        {/* BODY — ⭐ px-4 py-4 → px-5 py-4 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Profil Client */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              {/* ⭐ Avatar : h-12 w-12 → h-14 w-14, text 16px → 18px */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-[18px] font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                {/* ⭐ h3 : 13.5px → 15px */}
                <h3 className="truncate text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  {client.nom}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  {/* ⭐ Type badge : 11.5px → 13px, px-1.5 py-0.5 → px-2.5 py-1.5 */}
                  <span
                    className={`inline-flex items-center rounded-md border px-2.5 py-1.5 text-[13px] font-semibold leading-tight ${getTypeColor(client.type)}`}
                  >
                    {client.type}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats — ⭐ padding + text nampitomboina */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0F172A] px-3.5 py-3">
              {/* ⭐ Label : 11.5px → 13px */}
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                Total Achats
              </p>
              {/* ⭐ Value : 13.5px → 15px */}
              <p className="mt-1 text-[15px] font-semibold text-brand-600 dark:text-brand-400">
                {Number(client.total_achats || 0).toLocaleString('fr-FR')} Ar
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0F172A] px-3.5 py-3">
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                Commandes
              </p>
              <p className="mt-1 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                {client.nb_commandes || 0}
              </p>
            </div>
          </div>

          {/* Informations */}
          <div className="flex flex-col">
            <InfoRow icon={Mail}     label="Email"         value={client.email || '—'} />
            <InfoRow icon={Phone}    label="Téléphone"     value={client.telephone || '—'} />
            <InfoRow icon={MapPin}   label="Adresse"       value={client.adresse || '—'} />
            <InfoRow icon={MapPin}   label="Ville"         value={client.ville || '—'} />
            <InfoRow                 label="Code postal"   value={client.code_postal || '—'} />
            <InfoRow                 label="Pays"          value={client.pays || '—'} />
            <InfoRow icon={Calendar} label="Client depuis" value={formatDate(client.created_at)} />
          </div>
        </div>

        {/* FOOTER — ⭐ h-14 → h-[72px], px-4 → px-5 */}
        <footer className="flex h-[72px] shrink-0 items-center justify-end gap-2 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0F172A] px-5">
          {/* ⭐ Fermer button : 13px → 15px, h-9 → h-10, px-3.5 → px-4.5 */}
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg px-4.5 text-[15px] font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            Fermer
          </button>
          {/* ⭐ Modifier button : 13px → 15px, h-9 → h-10, px-3.5 → px-5, icon 14 → 17 */}
          <button
            type="button"
            onClick={onEdit}
            className="flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:scale-[0.98]"
          >
            <Pencil size={17} strokeWidth={2.2} />
            Modifier
          </button>
        </footer>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ClientsViewModal;