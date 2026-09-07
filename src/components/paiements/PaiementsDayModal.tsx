
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarDays, User, Wallet, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseDateSafe } from './PaiementsUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  onViewPaiement: (paiement: any) => void;
  isDark: boolean;
}

const ITEMS_PER_PAGE = 8;

const PaiementsDayModal: React.FC<Props> = ({ isOpen, onClose, payments, onViewPaiement, isDark }) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (!isOpen) return null;

  const theme = {
    card: isDark ? '#2A2A2A' : '#FFFFFF',
    border: isDark ? '#4B5563' : '#D1D5DB',
    text: isDark ? '#FDE2E4' : '#264653',
    muted: isDark ? '#B0B0B0' : '#64748B',
    primary: '#0d80d2',
    softBg: isDark ? '#333333' : '#F8FAFC',
    danger: isDark ? '#F87171' : '#DC2626',
    success: isDark ? '#34D399' : '#059669',
    warning: isDark ? '#FBBF24' : '#F59E0B',
  };

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

  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="relative z-[100000] flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-xl"
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-6" style={{ background: theme.softBg, borderColor: theme.border }}>
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(13,128,210,0.1)', color: theme.primary }}>
              <CalendarDays size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[16px] font-semibold" style={{ color: theme.text }}>
                Paiements du {formattedDate}
              </h2>
              <p className="text-[12px]" style={{ color: theme.muted }}>
                {payments.length} paiement(s) enregistré(s)
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10" style={{ color: theme.muted }}>
            <X size={17} />
          </button>
        </header>

 
        <div className="max-h-[65vh] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10" style={{ background: theme.softBg }}>
              <tr className="text-[12px] font-semibold uppercase tracking-[0.05em]" style={{ color: theme.muted }}>
                <th className="px-4 py-3 border" style={{ borderColor: theme.border }}>EMPLOYÉ</th>
                <th className="px-3 py-3 border" style={{ borderColor: theme.border }}>SALAIRE BRUT</th>
                <th className="px-3 py-3 border" style={{ borderColor: theme.border }}>CNaPS</th>
                <th className="px-3 py-3 border" style={{ borderColor: theme.border }}>OSTIE</th>
                <th className="px-3 py-3 border" style={{ borderColor: theme.border }}>IRSA</th>
                <th className="px-3 py-3 border" style={{ borderColor: theme.border }}>NET À PAYER</th>
                <th className="px-3 py-3 border" style={{ borderColor: theme.border }}>MODE</th>
                <th className="px-3 py-3 border" style={{ borderColor: theme.border }}>STATUT</th>
                <th className="px-3 py-3 border text-right" style={{ borderColor: theme.border }}>ACTION</th>
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
                const mode = p.mode_paiement || 'Espèces';
                const statut = p.statut_paiement || p.statut || 'Payé';

                return (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 border" style={{ borderColor: theme.border }}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(13,128,210,0.1)', color: theme.primary }}>
                          {p.employe_id ? <User size={16} /> : <Wallet size={16} />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[14px] font-semibold truncate" style={{ color: theme.text }}>{nom}</div>
                          {poste && <div className="text-[11px] truncate" style={{ color: theme.muted }}>{poste}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 border text-[14px]" style={{ borderColor: theme.border, color: theme.text }}>{salaireBrut.toLocaleString('fr-FR')} Ar</td>
                    <td className="px-3 py-3 border text-[14px]" style={{ borderColor: theme.border, color: theme.danger }}>{cnaps.toLocaleString('fr-FR')} Ar</td>
                    <td className="px-3 py-3 border text-[14px]" style={{ borderColor: theme.border, color: theme.danger }}>{ostie.toLocaleString('fr-FR')} Ar</td>
                    <td className="px-3 py-3 border text-[14px]" style={{ borderColor: theme.border, color: theme.danger }}>{irsa.toLocaleString('fr-FR')} Ar</td>
                    <td className="px-3 py-3 border text-[14px] font-bold" style={{ borderColor: theme.border, color: theme.primary }}>{netAPayer.toLocaleString('fr-FR')} Ar</td>
                    <td className="px-3 py-3 border text-[12px]" style={{ borderColor: theme.border, color: theme.muted }}>{mode}</td>
                    <td className="px-3 py-3 border">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ 
                        background: statut === 'Payé' ? 'rgba(16,185,129,0.1)' : statut === 'Partiel' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                        color: statut === 'Payé' ? theme.success : statut === 'Partiel' ? theme.warning : theme.danger
                      }}>
                        {statut}
                      </span>
                    </td>
                    <td className="px-3 py-3 border text-right" style={{ borderColor: theme.border }}>
                      <button
                        type="button"
                        onClick={() => onViewPaiement(p)}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
                        style={{ background: theme.primary }}
                      >
                        <Eye size={14} /> Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>


        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t rounded-b-2xl" style={{ borderColor: theme.border, background: theme.softBg }}>
            <span className="text-[13px]" style={{ color: theme.muted }}>Page {currentPage} / {totalPages}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-40"
                style={{ borderColor: theme.border, color: theme.muted }}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-40"
                style={{ borderColor: theme.border, color: theme.muted }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default PaiementsDayModal;