import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Printer, FileText } from 'lucide-react';
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

interface Commande {
  id: number; numero: string; client_nom: string; client_telephone: string; client_email: string;
  date_commande: string; total_ht: number; total_ttc: number; remise: number;
  observation: string; statut_paiement: string; montant_paye: number; montant_restant: number;
}

interface DetailCommande {
  id: number; produit_id: number; produit_nom: string; produit_code: string;
  quantite: number; prix_unitaire: number; total_ligne: number; tva_rate?: number;
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

const formatDate = (date?: string) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR');
};

const CommandesDetailsModal: React.FC<CommandesDetailsModalProps> = ({ commande, details = [], onClose, onGenerateFacture, onUpdatePaiement }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;

  const safeDetails = useMemo(() => (Array.isArray(details) ? details : []), [details]);

  const calculatedTotalHT = useMemo(() => safeDetails.reduce((total, d) => total + Number(d.quantite || 0) * Number(d.prix_unitaire || 0), 0), [safeDetails]);
  const remise = Number(commande.remise) || 0;
  const baseHT = Math.max(calculatedTotalHT - remise, 0);
  
  const calculatedTVA = useMemo(() => {
    return safeDetails.reduce((total, d) => {
      const rate = Number(d.tva_rate);
      const safeRate = Number.isFinite(rate) ? rate : 0;
      return total + (Number(d.quantite || 0) * Number(d.prix_unitaire || 0) * safeRate);
    }, 0);
  }, [safeDetails]);

  const calculatedTotalTTC = baseHT + calculatedTVA;

  const totalTVARate = useMemo(() => {
    if (baseHT <= 0) return 0;
    return Math.round((calculatedTVA / baseHT) * 100 * 100) / 100;
  }, [baseHT, calculatedTVA]);

  const montantPaye = Number(commande.montant_paye) || 0;
  const montantRestant = Math.max(0, calculatedTotalTTC - montantPaye);
  
  const statutPaiement = useMemo(() => {
    if (montantPaye <= 0) return 'Non payé';
    if (montantPaye >= calculatedTotalTTC) return 'Payé';
    return 'Partiel';
  }, [montantPaye, calculatedTotalTTC]);

  const statutStyle =
    statutPaiement === 'Payé'
      ? { background: theme.green === '#059669' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(52, 211, 153, 0.12)', color: theme.green, borderColor: 'rgba(16, 185, 129, 0.3)' }
      : statutPaiement === 'Partiel'
        ? { background: theme.amber === '#D97706' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(251, 191, 36, 0.12)', color: theme.amber, borderColor: 'rgba(245, 158, 11, 0.3)' }
        : { background: theme.red === '#DC2626' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(248, 113, 113, 0.12)', color: theme.red, borderColor: 'rgba(239, 68, 68, 0.3)' };

  const isPaye = statutPaiement === 'Payé';

  if (!commande) return null;

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
              <FileText size={19} style={{ color: theme.primary }} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold" style={{ color: theme.text }}>
                Détails de la commande
              </h2>
              <p className="text-[13px]" style={{ color: theme.muted }}>
                {commande.numero} · {formatDate(commande.date_commande)}
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
                <p className="text-[15px] font-bold" style={{ color: theme.text }}>{commande.client_nom || 'Client inconnu'}</p>
                {commande.client_telephone && <p className="text-[13px]" style={{ color: theme.muted }}>{commande.client_telephone}</p>}
              </div>
              <div>
                <span className="inline-flex items-center rounded-lg border px-3 py-1.5 text-[13px] font-semibold" style={{ background: statutStyle.background, color: statutStyle.color, borderColor: statutStyle.borderColor }}>
                  {statutPaiement}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border" style={{ borderColor: theme.border }}>
            <table className="w-full text-left">
              <thead style={{ background: theme.softBg }}>
                <tr className="text-[12px] uppercase text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-2.5">Produit</th>
                  <th className="px-4 py-2.5 text-center">Qté</th>
                  <th className="px-4 py-2.5 text-right">Prix</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {safeDetails.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-[14px]" style={{ color: theme.muted }}>Aucun produit</td></tr>
                ) : (
                  safeDetails.map((detail: any) => (
                    <tr key={detail.id} className="border-t" style={{ borderColor: theme.border }}>
                      <td className="px-4 py-3">
                        <p className="text-[14px] font-semibold" style={{ color: theme.text }}>{detail.produit_nom || '—'}</p>
                        {detail.produit_code && <p className="text-[12px]" style={{ color: theme.muted }}>{detail.produit_code}</p>}
                      </td>
                      <td className="px-4 py-3 text-center text-[14px]" style={{ color: theme.muted }}>{detail.quantite}</td>
                      <td className="px-4 py-3 text-right text-[14px]" style={{ color: theme.muted }}>{formatMoney(detail.prix_unitaire)}</td>
                      <td className="px-4 py-3 text-right text-[14px] font-semibold" style={{ color: theme.text }}>{formatMoney(detail.quantite * detail.prix_unitaire)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col">
            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>Total HT</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatMoney(baseHT)}</span>
            </div>
            <div className="flex justify-between text-[14px] py-2 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.muted }}>TVA ({totalTVARate}%)</span>
              <span className="font-semibold" style={{ color: theme.text }}>{formatMoney(calculatedTVA)}</span>
            </div>
            <div className="flex justify-between text-[16px] font-bold py-3 border-b" style={{ borderColor: theme.border }}>
              <span style={{ color: theme.text }}>Total TTC</span>
              <span style={{ color: theme.primary }}>{formatMoney(calculatedTotalTTC)}</span>
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

          {commande.observation?.trim() && (
            <div className="mt-4 border-t pt-3" style={{ borderColor: theme.border }}>
              <p className="text-[12px] uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2">Observation</p>
              <div className="text-[14px] leading-relaxed" style={{ color: theme.text }}>{commande.observation}</div>
            </div>
          )}

        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>Fermer</button>
          
          {!isPaye && onUpdatePaiement && (
            <button onClick={() => onUpdatePaiement(commande.id, { montant_paye: calculatedTotalTTC, statut_paiement: 'Payé' })} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-white" style={{ background: theme.green }}>
              <CheckCircle2 size={15} className="inline mr-1" />Payée
            </button>
          )}

          <button onClick={onGenerateFacture} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-white" style={{ background: theme.primary }}>
            <Printer size={15} className="inline mr-1" />Imprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandesDetailsModal;