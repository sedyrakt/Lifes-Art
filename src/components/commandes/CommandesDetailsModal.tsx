// src/components/commandes/CommandesDetailsModal.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProduitsViewModal / ClientsViewModal / FournisseursViewModal
// ⭐ FONT SIZE: h2 18px, subtitle 14px, labels 13px, values 15px, buttons 15px

import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Printer, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: { card: '#FFFFFF', border: '#E2E8F0', softBg: '#F8FAFC', text: '#0F172A', muted: '#64748B', primary: '#4F46E5', green: '#059669', red: '#DC2626', amber: '#D97706' },
  dark: { card: '#0F172A', border: 'rgba(255,255,255,0.12)', softBg: '#0F172A', text: '#F8FAFC', muted: '#94A3B8', primary: '#4F46E5', green: '#34D399', red: '#F87171', amber: '#FBBF24' },
};

interface Commande {
  id: number;
  numero: string;
  client_nom: string;
  client_telephone: string;
  client_email: string;
  date_commande: string;
  total_ht: number;
  total_ttc: number;
  remise: number;
  observation: string;
  statut_paiement: string;
  montant_paye: number;
  montant_restant: number;
  mode_paiement?: string;
  modalite_paiement?: string;
  frais_livraison?: number;
  livraison?: string;
  date_limite_paiement?: string;
}

interface DetailCommande {
  id: number;
  produit_id: number;
  produit_nom: string;
  produit_code: string;
  quantite: number;
  prix_unitaire: number;
  total_ligne: number;
  tva_rate?: number;
}

interface CommandesDetailsModalProps {
  commande: Commande;
  details?: DetailCommande[];
  onClose: () => void;
  onGenerateFacture: () => void;
  onUpdatePaiement?: (id: number, data: { montant_paye: number; statut_paiement: string }) => void;
  clientImageUrl?: string | null;
  clientImageError?: boolean;
}

const formatMoney = (value: any) => `${Number(value || 0).toLocaleString('fr-FR')} Ar`;

const formatTva = (rate: number | undefined | null) => {
  if (rate === undefined || rate === null) return '0%';
  if (rate > 1) return `${rate}%`;
  return `${Math.round(rate * 100)}%`;
};

const formatDate = (date?: string) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR');
};

const formatDateTime = (date?: string) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const CommandesDetailsModal: React.FC<CommandesDetailsModalProps> = ({ commande, details = [], onClose, onGenerateFacture, onUpdatePaiement }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;
  const safeDetails = useMemo(() => (Array.isArray(details) ? details : []), [details]);

  // HT avant remise
  const rawTotalHT = useMemo(
    () => safeDetails.reduce((total, d) => total + Number(d.quantite || 0) * Number(d.prix_unitaire || 0), 0),
    [safeDetails]
  );

  const remise = Number(commande.remise) || 0;
  const baseHT = Math.max(rawTotalHT - remise, 0);

  // TVA sur tva_rate de chaque produit
  const calculatedTVA = useMemo(() => {
    if (baseHT <= 0) return 0;
    const ratio = rawTotalHT > 0 ? baseHT / rawTotalHT : 0;
    return safeDetails.reduce((total, d) => {
      const rate = (d.tva_rate !== undefined && d.tva_rate !== null && d.tva_rate !== '') ? Number(d.tva_rate) : 0;
      const safeRate = Number.isFinite(rate) ? rate : 0;
      const lineHT = (Number(d.quantite || 0) * Number(d.prix_unitaire || 0)) * ratio;
      return total + lineHT * safeRate;
    }, 0);
  }, [safeDetails, baseHT, rawTotalHT]);

  const fraisLivraison = Number(commande.frais_livraison || 0);
  const calculatedTotalTTC = baseHT + calculatedTVA + fraisLivraison;

  const montantPaye = Number(commande.montant_paye) || 0;
  const montantRestant = Math.max(0, calculatedTotalTTC - montantPaye);
  const statutPaiement = useMemo(() => {
    if (montantPaye <= 0) return 'Non payé';
    if (montantPaye >= calculatedTotalTTC) return 'Payé';
    return 'Partiel';
  }, [montantPaye, calculatedTotalTTC]);

  const statutStyle = statutPaiement === 'Payé'
    ? { background: 'rgba(16, 185, 129, 0.12)', color: theme.green, borderColor: 'rgba(16, 185, 129, 0.3)' }
    : statutPaiement === 'Partiel'
      ? { background: 'rgba(245, 158, 11, 0.12)', color: theme.amber, borderColor: 'rgba(245, 158, 11, 0.3)' }
      : { background: 'rgba(239, 68, 68, 0.12)', color: theme.red, borderColor: 'rgba(239, 68, 68, 0.3)' };

  const isPaye = statutPaiement === 'Payé';

  const livraisonDisplay = commande.livraison === 'Oui' || commande.livraison === 'Non'
    ? commande.livraison
    : (fraisLivraison > 0 ? 'Oui' : 'Non');

  if (!commande) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-xl border-[0.5px] shadow-[0_18px_55px_rgba(15,23,42,0.35)]"
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER — ⭐ h-14 → h-16, px-4 → px-5 */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-5" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            {/* ⭐ Icon container : h-7 w-7 → h-9 w-9, icon 15 → 18 */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'rgba(79,70,229,0.06)' }}>
              <FileText size={18} strokeWidth={2.2} style={{ color: theme.primary }} />
            </div>
            <div className="min-w-0">
              {/* ⭐ h2 : 13.5px → 18px */}
              <h2 className="text-[18px] font-semibold leading-tight" style={{ color: theme.text }}>
                Détails de la commande
              </h2>
              {/* ⭐ Subtitle : 11.5px → 14px */}
              <p className="text-[14px] leading-[1.3] mt-0.5 font-mono" style={{ color: theme.muted }}>
                {commande.numero}
              </p>
            </div>
          </div>
          {/* ⭐ Close button : h-8 w-8 → h-10 w-10, icon 16 → 19 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
            style={{ color: theme.muted }}
          >
            <X size={19} strokeWidth={2.2} />
          </button>
        </div>

        {/* BODY — ⭐ px-4 py-4 → px-5 py-4 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* CLIENT + STATUT */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* ⭐ Label : 11.5px → 13px */}
                <p className="text-[13px] uppercase font-semibold tracking-[0.06em] leading-[1.3]" style={{ color: theme.muted }}>Client</p>
                {/* ⭐ Value : 13.5px → 15px */}
                <p className="text-[15px] font-semibold leading-tight mt-1" style={{ color: theme.text }}>
                  {commande.client_nom || 'Client inconnu'}
                </p>
                {/* ⭐ Phone : 11.5px → 13.5px */}
                {commande.client_telephone && (
                  <p className="text-[13.5px] leading-[1.3] mt-1" style={{ color: theme.muted }}>
                    {commande.client_telephone}
                  </p>
                )}
              </div>
              {/* ⭐ Statut badge : 11.5px → 13px, px-1.5 py-0.5 → px-2.5 py-1.5 */}
              <span
                className="inline-flex shrink-0 items-center rounded-md border px-2.5 py-1.5 text-[13px] font-semibold leading-tight"
                style={{ background: statutStyle.background, color: statutStyle.color, borderColor: statutStyle.borderColor }}
              >
                {statutPaiement}
              </span>
            </div>
          </div>

          {/* INFO ROWS — ⭐ 13.5px → 15px, py-2.5 → py-3 */}
          <div className="mb-4">
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Date de commande</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatDateTime(commande.date_commande)}</span>
            </div>
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Modalité de paiement</span>
              <span className="font-semibold" style={{ color: theme.text }}>
                {commande.modalite_paiement || 'Immediat'}
                {commande.mode_paiement && (
                  /* ⭐ Mode : 11.5px → 13px */
                  <span className="ml-1 text-[13px] font-normal" style={{ color: theme.muted }}>
                    · {commande.mode_paiement}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Livraison</span>
              <span className="flex items-center gap-2">
                {/* ⭐ Livraison badge : 11.5px → 13px, px-1.5 py-0.5 → px-2.5 py-1 */}
                <span
                  className="inline-flex items-center rounded-md border px-2.5 py-1 text-[13px] font-semibold uppercase tracking-wide"
                  style={{
                    borderColor: livraisonDisplay === 'Oui' ? 'rgba(16,185,129,0.35)' : 'rgba(100,116,139,0.35)',
                    background: livraisonDisplay === 'Oui' ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.08)',
                    color: livraisonDisplay === 'Oui' ? theme.green : theme.muted,
                  }}
                >
                  {livraisonDisplay}
                </span>
                {/* ⭐ Frais : 13.5px → 15px */}
                {fraisLivraison > 0 && (
                  <span className="text-[15px] font-semibold" style={{ color: theme.text }}>
                    {formatMoney(fraisLivraison)}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* DETAILS PRODUITS */}
          <div className="overflow-hidden rounded-lg border" style={{ borderColor: theme.border }}>
            <table className="w-full text-left">
              <thead style={{ background: theme.softBg }}>
                {/* ⭐ Header : 11.5px → 12.5px, py-2 → py-2.5 */}
                <tr className="text-[12.5px] uppercase tracking-wide font-semibold" style={{ color: theme.muted }}>
                  <th className="px-3 py-2.5">Produit</th>
                  <th className="px-3 py-2.5 text-center">Qté</th>
                  <th className="px-3 py-2.5 text-right">Prix</th>
                  <th className="px-3 py-2.5 text-right">TVA</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {safeDetails.length === 0 ? (
                  <tr>
                    {/* ⭐ Empty : 13.5px → 14.5px, py-3 → py-4 */}
                    <td colSpan={5} className="px-3 py-4 text-center text-[14.5px]" style={{ color: theme.muted }}>
                      Aucun produit
                    </td>
                  </tr>
                ) : (
                  safeDetails.map((detail: any) => (
                    <tr key={detail.id} className="border-t" style={{ borderColor: theme.border }}>
                      <td className="px-3 py-3">
                        {/* ⭐ Product name : 13.5px → 15px */}
                        <p className="text-[15px] font-semibold leading-tight" style={{ color: theme.text }}>
                          {detail.produit_nom || '—'}
                        </p>
                        {/* ⭐ Code : 11.5px → 13px */}
                        {detail.produit_code && (
                          <p className="text-[13px] leading-[1.3] mt-0.5 font-mono" style={{ color: theme.muted }}>
                            {detail.produit_code}
                          </p>
                        )}
                      </td>
                      {/* ⭐ Cells : 13.5px → 15px, py-2.5 → py-3 */}
                      <td className="px-3 py-3 text-center text-[15px]" style={{ color: theme.muted }}>{detail.quantite}</td>
                      <td className="px-3 py-3 text-right text-[15px]" style={{ color: theme.muted }}>{formatMoney(detail.prix_unitaire)}</td>
                      <td className="px-3 py-3 text-right text-[15px]" style={{ color: theme.muted }}>{formatTva(detail.tva_rate)}</td>
                      <td className="px-3 py-3 text-right text-[15px] font-semibold" style={{ color: theme.text }}>
                        {formatMoney(detail.quantite * detail.prix_unitaire)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TOTAUX — ⭐ 13.5px → 15px, py-2.5 → py-3 */}
          <div className="mt-4 flex flex-col">
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Total HT</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatMoney(baseHT)}</span>
            </div>
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>TVA</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatMoney(calculatedTVA)}</span>
            </div>
            {fraisLivraison > 0 && (
              <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
                <span style={{ color: theme.muted }}>Frais de livraison</span>
                <span className="font-semibold" style={{ color: theme.text }}>{formatMoney(fraisLivraison)}</span>
              </div>
            )}
            {/* ⭐ Total TTC : 13.5px → 15px, py-3 → py-3.5 */}
            <div className="flex justify-between text-[15px] font-semibold py-3.5 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.text }}>Total TTC</span>
              <span style={{ color: theme.primary }}>{formatMoney(calculatedTotalTTC)}</span>
            </div>
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Montant payé</span>
              <span className="font-semibold" style={{ color: theme.green }}>{formatMoney(montantPaye)}</span>
            </div>
            <div className="flex justify-between text-[15px] py-3">
              <span style={{ color: theme.muted }}>Reste à payer</span>
              <span className="font-semibold" style={{ color: theme.red }}>{formatMoney(montantRestant)}</span>
            </div>
          </div>

          {/* OBSERVATION */}
          {commande.observation?.trim() && (
            <div className="mt-4 border-t pt-4" style={{ borderColor: theme.border }}>
              {/* ⭐ Label : 11.5px → 13px */}
              <p className="text-[13px] uppercase font-semibold tracking-[0.06em] leading-[1.3] mb-2" style={{ color: theme.muted }}>
                Observation
              </p>
              {/* ⭐ Description : 13.5px → 15px, leading 1.5 → 1.6 */}
              <div className="text-[15px] leading-[1.6]" style={{ color: theme.text }}>
                {commande.observation}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER — ⭐ h-14 → h-[72px], px-4 → px-5 */}
        <div
          className="flex h-[72px] shrink-0 items-center justify-end gap-2 border-t px-5"
          style={{ borderColor: theme.border, background: theme.softBg }}
        >
          {/* ⭐ Fermer button : 13px → 15px, h-9 → h-10, px-3.5 → px-4.5 */}
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg px-4.5 text-[15px] font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
            style={{ color: theme.muted }}
          >
            Fermer
          </button>
          {/* ⭐ Payée button : 13px → 15px, h-9 → h-10, px-3.5 → px-5, icon 14 → 17 */}
          {!isPaye && onUpdatePaiement && (
            <button
              type="button"
              onClick={() => onUpdatePaiement(commande.id, { montant_paye: calculatedTotalTTC, statut_paiement: 'Payé' })}
              className="flex h-10 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold text-white transition-colors hover:opacity-90 active:scale-[0.98]"
              style={{ background: theme.green }}
            >
              <CheckCircle2 size={17} strokeWidth={2.2} />
              Payée
            </button>
          )}
          {/* ⭐ Imprimer button : 13px → 15px, h-9 → h-10, px-3.5 → px-5, icon 14 → 17 */}
          <button
            type="button"
            onClick={() => { onClose(); onGenerateFacture(); }}
            className="flex h-10 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold text-white transition-colors hover:opacity-90 active:scale-[0.98]"
            style={{ background: theme.primary }}
          >
            <Printer size={17} strokeWidth={2.2} />
            Imprimer
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default CommandesDetailsModal;