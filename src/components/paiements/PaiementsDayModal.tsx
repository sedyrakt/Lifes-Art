import React, { useState } from 'react';
import { X, CalendarDays, User, Wallet, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseDateSafe } from './PaiementsUtils';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  onViewPaiement: (paiement: any) => void;
  isDark?: boolean;
}

const ITEMS_PER_PAGE = 8;

const COLORS = {
  light: { card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', primary: '#4F46E5', bg: '#F8FAFC', danger: '#DC2626', success: '#059669', warning: '#D97706' },
  dark: { card: '#0F172A', border: 'rgba(255,255,255,0.12)', text: '#F8FAFC', muted: '#94A3B8', primary: '#4F46E5', bg: '#0F172A', danger: '#F87171', success: '#34D399', warning: '#FBBF24' }
};

const PaiementsDayModal: React.FC<Props> = ({ isOpen, onClose, payments, onViewPaiement, isDark: propIsDark }) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark ?? contextIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;

  const [currentPage, setCurrentPage] = useState(1);

  if (!isOpen) return null;

  if (payments.length === 0) {
    return (
      <div className="text-center py-10 text-[15px]" style={{ color: theme.muted }}>
        Aucun paiement pour cette date
      </div>
    );
  }

  const formattedDate = payments[0]?.date_paiement
    ? parseDateSafe(payments[0].date_paiement).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date inconnue';

  const totalPages = Math.max(1, Math.ceil(payments.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedPayments = payments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.min(Math.max(1, newPage), totalPages));
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* HEADER STANDARD */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(79,70,229,0.08)' }}>
              <CalendarDays size={19} style={{ color: theme.primary }} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold" style={{ color: theme.text }}>Paiements du {formattedDate}</h2>
              <p className="text-[13px]" style={{ color: theme.muted }}>{payments.length} paiement(s) enregistré(s)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>
            <X size={19} />
          </button>
        </div>

        {/* TABLEAU STANDARD */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10" style={{ background: theme.bg }}>
              <tr className="text-[12px] font-semibold uppercase tracking-[0.05em]" style={{ color: theme.muted }}>
                <th className="px-4 py-3 border-b" style={{ borderColor: theme.border }}>EMPLOYÉ</th>
                <th className="px-3 py-3 border-b" style={{ borderColor: theme.border }}>SALAIRE BRUT</th>
                <th className="px-3 py-3 border-b" style={{ borderColor: theme.border }}>CNaPS</th>
                <th className="px-3 py-3 border-b" style={{ borderColor: theme.border }}>OSTIE</th>
                <th className="px-3 py-3 border-b" style={{ borderColor: theme.border }}>IRSA</th>
                <th className="px-3 py-3 border-b" style={{ borderColor: theme.border }}>NET À PAYER</th>
                <th className="px-3 py-3 border-b text-right" style={{ borderColor: theme.border }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {displayedPayments.map((p, idx) => {
                const nom = p.employe_nom ? `${p.employe_prenom || ''} ${p.employe_nom}`.trim() : (p.client_nom || 'Client');
                const poste = p.employe_poste || '';
                const salaireBrut = Number(p.salaire_brut || 0);
                const cnaps = Number(p.cnaps || 0);
                const ostie = Number(p.ostie || 0);
                const irsa = Number(p.irsa || 0);
                const netAPayer = Number(p.montant || 0);
                const statut = p.statut_paiement || p.statut || 'Payé';

                return (
                  <tr key={idx} className="border-b" style={{ borderColor: theme.border }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(79,70,229,0.08)', color: theme.primary }}>
                          {p.employe_id ? <User size={16} /> : <Wallet size={16} />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[14px] font-semibold truncate" style={{ color: theme.text }}>{nom}</div>
                          {poste && <div className="text-[12px] truncate" style={{ color: theme.muted }}>{poste}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[14px]" style={{ color: theme.text }}>{salaireBrut.toLocaleString('fr-FR')} Ar</td>
                    <td className="px-3 py-3 text-[14px]" style={{ color: theme.danger }}>{cnaps.toLocaleString('fr-FR')} Ar</td>
                    <td className="px-3 py-3 text-[14px]" style={{ color: theme.danger }}>{ostie.toLocaleString('fr-FR')} Ar</td>
                    <td className="px-3 py-3 text-[14px]" style={{ color: theme.danger }}>{irsa.toLocaleString('fr-FR')} Ar</td>
                    <td className="px-3 py-3 text-[14px] font-bold" style={{ color: theme.primary }}>{netAPayer.toLocaleString('fr-FR')} Ar</td>
                    <td className="px-3 py-3 text-right">
                      <button type="button" onClick={() => onViewPaiement(p)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white" style={{ background: theme.primary }}>
                        <Eye size={14} /> Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION STANDARD */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t" style={{ borderColor: theme.border, background: theme.bg }}>
            <span className="text-[13px]" style={{ color: theme.muted }}>Page {currentPage} / {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-40" style={{ borderColor: theme.border, color: theme.muted }}>
                <ChevronLeft size={15} />
              </button>
              <button type="button" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-40" style={{ borderColor: theme.border, color: theme.muted }}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaiementsDayModal;