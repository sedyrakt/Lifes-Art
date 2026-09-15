// src/components/ventes/VentesViewModal.tsx
// ⭐ FONT SIZE: h2 18px, subtitle 14px, labels 13px, values 15px, buttons 15px

import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Printer } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: { card: '#FFFFFF', border: '#E2E8F0', softBg: '#F8FAFC', text: '#0F172A', muted: '#64748B', primary: '#4F46E5', green: '#059669', red: '#DC2626', amber: '#D97706' },
  dark: { card: '#0F172A', border: 'rgba(255,255,255,0.12)', softBg: '#0F172A', text: '#F8FAFC', muted: '#94A3B8', primary: '#4F46E5', green: '#34D399', red: '#F87171', amber: '#FBBF24' }
};

interface VentesViewModalProps {
  item: any;
  type: 'devis' | 'factures';
  details: any[];
  loading: boolean;
  onClose: () => void;
  onConvertDevisToFacture?: () => void;
  onDownloadFacture?: (details: any[]) => void;
  onDownloadDevisPDF?: (details: any[]) => void;
  isDark?: boolean;
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

const VentesViewModal: React.FC<VentesViewModalProps> = ({ item, type, details, loading, onClose, onConvertDevisToFacture, onDownloadFacture, onDownloadDevisPDF, isDark: propIsDark }) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark ?? contextIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;

  const [isVisible, setIsVisible] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 10);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => { setLogoError(false); }, [isDark]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const safeDetails = useMemo(() => Array.isArray(details) ? details : [], [details]);
  const safeProducts = useMemo(() => {
    if (Array.isArray(item?.products) && item.products.length > 0) return item.products;
    if (Array.isArray(item?.produits_details) && item.produits_details.length > 0) return item.produits_details;
    return safeDetails;
  }, [item, safeDetails]);
  const displayedProducts = useMemo(() => Array.isArray(safeProducts) ? safeProducts.slice(0, 100) : [], [safeProducts]);

  const { totalHT, totalTVA, totalTTC } = useMemo(() => {
    let ht = 0; let tva = 0;
    for (const prod of displayedProducts) {
      const qty = Number(prod.quantite || prod.quantity || 0);
      const price = Number(prod.prix_unitaire || prod.price || 0);
      const lineTotal = qty * price;
      const tvaRate = Number(prod.tva_rate) || 0;
      ht += lineTotal; tva += lineTotal * tvaRate;
    }
    if (displayedProducts.length === 0) { ht = Number(item?.total_ht || 0); tva = Number(item?.total_tva || 0); }
    return { totalHT: ht, totalTVA: tva, totalTTC: ht + tva };
  }, [displayedProducts, item]);

  const montantPaye = Math.min(totalTTC, Number(item?.montant_paye || 0));
  const montantRestant = Math.max(0, totalTTC - montantPaye);
  const statutPaiement = montantPaye <= 0 ? 'Non payé' : montantPaye >= totalTTC ? 'Payé' : 'Partiel';

  const statutStyle = statutPaiement === 'Payé'
    ? { background: 'rgba(16, 185, 129, 0.12)', color: theme.green, borderColor: 'rgba(16, 185, 129, 0.3)' }
    : statutPaiement === 'Partiel'
      ? { background: 'rgba(245, 158, 11, 0.12)', color: theme.amber, borderColor: 'rgba(245, 158, 11, 0.3)' }
      : { background: 'rgba(239, 68, 68, 0.12)', color: theme.red, borderColor: 'rgba(239, 68, 68, 0.3)' };

  if (!item) return null;

  const modal = (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl border-[0.5px] shadow-[0_18px_55px_rgba(15,23,42,0.35)] transition-all duration-200 ${
          isVisible ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.98]'
        }`}
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

        {/* HEADER — ⭐ h-14 → h-16, px-4 → px-5 */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-5" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="min-w-0">
            {/* ⭐ h2 : 13.5px → 18px */}
            <h2 className="truncate text-[18px] font-semibold leading-tight" style={{ color: theme.text }}>
              {type === 'devis' ? 'Détails du devis' : 'Détails de la facture'}
            </h2>
            {/* ⭐ Subtitle : 11.5px → 14px */}
            <p className="text-[14px] leading-[1.3] mt-0.5 font-mono" style={{ color: theme.muted }}>
              {item.reference || `#${item.id}`} · {formatDate(item.date_devis || item.date_facture || item.created_at)}
            </p>
          </div>
          {/* ⭐ Close : h-8 w-8 → h-10 w-10, icon 16 → 19 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
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
                <p className="text-[15px] font-semibold leading-tight mt-1" style={{ color: theme.text }}>{item.client_nom || 'Client inconnu'}</p>
                {/* ⭐ Phone : 11.5px → 13.5px */}
                {item.client_telephone && (
                  <p className="text-[13.5px] leading-[1.3] mt-1" style={{ color: theme.muted }}>{item.client_telephone}</p>
                )}
              </div>
              {/* ⭐ Badge : 11.5px → 13px, px-1.5 py-0.5 → px-2.5 py-1.5 */}
              <span
                className="inline-flex shrink-0 items-center rounded-md border px-2.5 py-1.5 text-[13px] font-semibold leading-tight"
                style={{ background: statutStyle.background, color: statutStyle.color, borderColor: statutStyle.borderColor }}
              >
                {statutPaiement}
              </span>
            </div>
          </div>

          {/* TABLE PRODUITS */}
          {loading ? (
            /* ⭐ Loading : 13.5px → 15px */
            <div className="text-center py-8 text-[15px]" style={{ color: theme.muted }}>Chargement...</div>
          ) : (
            <div className="overflow-hidden rounded-lg border" style={{ borderColor: theme.border }}>
              <table className="w-full text-left">
                <thead style={{ background: theme.softBg }}>
                  {/* ⭐ Header : 11.5px → 12.5px, py-2 → py-2.5 */}
                  <tr className="text-[12.5px] uppercase tracking-[0.06em] font-semibold" style={{ color: theme.muted }}>
                    <th className="px-3 py-2.5">Produit</th>
                    <th className="px-3 py-2.5 text-center">Qté</th>
                    <th className="px-3 py-2.5 text-center">Unité</th>
                    <th className="px-3 py-2.5 text-right">Prix</th>
                    <th className="px-3 py-2.5 text-right">TVA</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.length === 0 ? (
                    <tr>
                      {/* ⭐ Empty : 13.5px → 14.5px, py-4 → py-4 */}
                      <td colSpan={6} className="px-3 py-4 text-center text-[14.5px]" style={{ color: theme.muted }}>Aucun produit</td>
                    </tr>
                  ) : (
                    displayedProducts.map((prod: any, index: number) => (
                      <tr key={index} className="border-t" style={{ borderColor: theme.border }}>
                        <td className="px-3 py-3">
                          {/* ⭐ Name : 13.5px → 15px */}
                          <p className="text-[15px] font-semibold leading-tight" style={{ color: theme.text }}>{prod.produit_nom || prod.name || prod.nom || 'Produit'}</p>
                          {/* ⭐ Code : 11.5px → 13px */}
                          {prod.produit_code && <p className="text-[13px] leading-[1.3] mt-0.5 font-mono" style={{ color: theme.muted }}>{prod.produit_code}</p>}
                        </td>
                        {/* ⭐ Cells : 13.5px → 15px, py-2.5 → py-3 */}
                        <td className="px-3 py-3 text-center text-[15px]" style={{ color: theme.muted }}>{prod.quantite || prod.quantity}</td>
                        <td className="px-3 py-3 text-center text-[15px]" style={{ color: theme.muted }}>
                          {prod.produit_unite || prod.unite || 'pièce'}
                        </td>
                        <td className="px-3 py-3 text-right text-[15px]" style={{ color: theme.muted }}>{formatMoney(prod.prix_unitaire || prod.price)}</td>
                        <td className="px-3 py-3 text-right text-[15px]" style={{ color: theme.muted }}>{formatTva(prod.tva_rate)}</td>
                        <td className="px-3 py-3 text-right text-[15px] font-semibold" style={{ color: theme.text }}>{formatMoney((prod.quantite || prod.quantity) * (prod.prix_unitaire || prod.price))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TOTAUX — ⭐ 13.5px → 15px, py-2.5 → py-3 */}
          <div className="mt-4 flex flex-col">
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Total HT</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatMoney(totalHT)}</span>
            </div>
            <div className="flex justify-between text-[15px] py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>TVA</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatMoney(totalTVA)}</span>
            </div>
            {/* ⭐ Total TTC : py-3 → py-3.5 */}
            <div className="flex justify-between text-[15px] font-semibold py-3.5 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.text }}>Total TTC</span>
              <span style={{ color: theme.primary }}>{formatMoney(totalTTC)}</span>
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

          {type === 'devis' && onConvertDevisToFacture && (
            /* ⭐ Convert : 13px → 15px, h-9 → h-10, px-3.5 → px-5, icon 14 → 17 */
            <button
              type="button"
              onClick={onConvertDevisToFacture}
              className="flex h-10 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold text-white transition-colors hover:opacity-90 active:scale-[0.98]"
              style={{ background: theme.green }}
            >
              <CheckCircle2 size={17} strokeWidth={2.2} />
              Convertir en facture
            </button>
          )}

          {type === 'factures' && onDownloadFacture && (
            <button
              type="button"
              onClick={() => { onClose(); onDownloadFacture(displayedProducts); }}
              className="flex h-10 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold text-white transition-colors hover:opacity-90 active:scale-[0.98]"
              style={{ background: theme.primary }}
            >
              <Printer size={17} strokeWidth={2.2} />
              Imprimer
            </button>
          )}

          {type === 'devis' && onDownloadDevisPDF && (
            <button
              type="button"
              onClick={() => { onClose(); onDownloadDevisPDF(displayedProducts); }}
              className="flex h-10 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold text-white transition-colors hover:opacity-90 active:scale-[0.98]"
              style={{ background: theme.primary }}
            >
              <Printer size={17} strokeWidth={2.2} />
              Imprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default VentesViewModal;