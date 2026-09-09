// src/components/ventes/VentesViewModal.tsx
import React, { useMemo } from 'react';
import { X, Download, FileText, CheckCircle2, Printer } from 'lucide-react';
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
  // ⭐ Ireo callback ireo dia mandray ny details
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

  const isPaye = statutPaiement === 'Payé';

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border shadow-2xl" style={{ background: theme.card, borderColor: theme.border }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(79,70,229,0.06)' }}>
              <FileText size={19} style={{ color: theme.primary }} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold" style={{ color: theme.text }}>
                {type === 'devis' ? 'Détails du devis' : 'Détails de la facture'}
              </h2>
              <p className="text-[13px]" style={{ color: theme.muted }}>
                {item.reference || `#${item.id}`} · {formatDate(item.date_devis || item.date_facture || item.created_at)}
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
                <p className="text-[12px] uppercase font-semibold text-slate-500 dark:text-slate-400">Client</p>
                <p className="text-[15px] font-bold" style={{ color: theme.text }}>{item.client_nom || 'Client inconnu'}</p>
                {item.client_telephone && <p className="text-[13px]" style={{ color: theme.muted }}>{item.client_telephone}</p>}
              </div>
              <span className="inline-flex items-center rounded-lg border px-3 py-1.5 text-[13px] font-semibold" style={{ background: statutStyle.background, color: statutStyle.color, borderColor: statutStyle.borderColor }}>
                {statutPaiement}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-[14px]" style={{ color: theme.muted }}>Chargement...</div>
          ) : (
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: theme.border }}>
              <table className="w-full text-left">
                <thead style={{ background: theme.softBg }}>
                  <tr className="text-[12px] uppercase text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-2.5">Produit</th>
                    <th className="px-4 py-2.5 text-center">Qté</th>
                    <th className="px-4 py-2.5 text-right">Prix</th>
                    <th className="px-4 py-2.5 text-right">TVA</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-4 text-center text-[14px]" style={{ color: theme.muted }}>Aucun produit</td></tr>
                  ) : (
                    displayedProducts.map((prod: any, index: number) => (
                      <tr key={index} className="border-t" style={{ borderColor: theme.border }}>
                        <td className="px-4 py-3">
                          <p className="text-[14px] font-semibold" style={{ color: theme.text }}>{prod.produit_nom || prod.name || prod.nom || 'Produit'}</p>
                          {prod.produit_code && <p className="text-[12px]" style={{ color: theme.muted }}>{prod.produit_code}</p>}
                        </td>
                        <td className="px-4 py-3 text-center text-[14px]" style={{ color: theme.muted }}>{prod.quantite || prod.quantity}</td>
                        <td className="px-4 py-3 text-right text-[14px]" style={{ color: theme.muted }}>{formatMoney(prod.prix_unitaire || prod.price)}</td>
                        <td className="px-4 py-3 text-right text-[14px]" style={{ color: theme.muted }}>{formatTva(prod.tva_rate)}</td>
                        <td className="px-4 py-3 text-right text-[14px] font-semibold" style={{ color: theme.text }}>{formatMoney((prod.quantite || prod.quantity) * (prod.prix_unitaire || prod.price))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex flex-col">
            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Total HT</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatMoney(totalHT)}</span>
            </div>
            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>TVA</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatMoney(totalTVA)}</span>
            </div>
            <div className="flex justify-between text-[16px] font-bold py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.text }}>Total TTC</span>
              <span style={{ color: theme.primary }}>{formatMoney(totalTTC)}</span>
            </div>
            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Montant payé</span>
              <span className="font-semibold text-success-600 dark:text-success-400">{formatMoney(montantPaye)}</span>
            </div>
            <div className="flex justify-between text-[14px] py-2">
              <span style={{ color: theme.muted }}>Reste à payer</span>
              <span className="font-semibold" style={{ color: theme.red }}>{formatMoney(montantRestant)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>Fermer</button>
          
          {type === 'devis' && onConvertDevisToFacture && (
            <button onClick={onConvertDevisToFacture} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-white" style={{ background: theme.green }}>
              <CheckCircle2 size={15} className="inline mr-1" />Convertir en facture
            </button>
          )}

          {type === 'factures' && onDownloadFacture && (
            <button onClick={() => { onClose(); onDownloadFacture(displayedProducts); }} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-white" style={{ background: theme.primary }}>
              <Printer size={15} className="inline mr-1" />Imprimer
            </button>
          )}

          {type === 'devis' && onDownloadDevisPDF && (
            <button onClick={() => { onClose(); onDownloadDevisPDF(displayedProducts); }} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-white" style={{ background: theme.primary }}>
              <Printer size={15} className="inline mr-1" />Imprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VentesViewModal;