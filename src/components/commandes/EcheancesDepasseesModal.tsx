// src/components/commandes/EcheancesDepasseesModal.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Eye, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ConfirmModal from '../common/ConfirmModal';

interface OverdueCommande {
  id: number;
  numero?: string;
  client_nom?: string;
  client_telephone?: string;
  total_ttc?: number;
  montant_paye?: number;
  montant_restant?: number;
  date_commande?: string;
  date_limite_paiement?: string;
  modalite_paiement?: string;
  mode_paiement?: string;
  statut_paiement?: string;
  late_seconds?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  commandes: OverdueCommande[];
  totalDette: number;
  onView: (commande: OverdueCommande) => void;
  onMarkAsPaid: (id: number, data: { montant_paye: number; statut_paiement: string }) => void;
}

const ITEMS_PER_PAGE = 5;

const formatDateFR = (v?: string): string => {
  if (!v) return '—';
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('fr-FR');
};

const formatDateTimeFR = (v?: string): string => {
  if (!v) return '—';
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (m) {
    const [, y, mo, d, hh, mm] = m;
    return hh ? `${d}/${mo}/${y} · ${hh}:${mm}` : `${d}/${mo}/${y}`;
  }
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return s;
  return dt.toLocaleString('fr-FR');
};

const formatMoney = (v: number | undefined): string =>
  `${Number(v || 0).toLocaleString('fr-FR')} Ar`;

const formatLate = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'À l\'instant';
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min de retard`;
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) return `${totalHours} h de retard`;
  const days = Math.floor(totalHours / 24);
  const remH = totalHours % 24;
  if (remH > 0) return `${days} j ${remH} h de retard`;
  return `${days} j de retard`;
};

const EcheancesDepasseesModal: React.FC<Props> = ({
  isOpen, onClose, commandes, totalDette, onView, onMarkAsPaid,
}) => {
  // ⭐ Hooks rehetra eto ambony
  const { isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);

  // ⭐ Confirm modal state
  const [confirmTarget, setConfirmTarget] = useState<OverdueCommande | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const totalItems = commandes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedCommandes = useMemo(
    () => commandes.slice(startIndex, endIndex),
    [commandes, startIndex, endIndex]
  );

  const pageNumbers = useMemo(() => {
    const pages: (number | 'dots')[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('dots');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('dots');
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (isOpen) setCurrentPage(1);
  }, [isOpen, commandes.length]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  if (!isOpen) return null;

  const goToPage = (p: number) => {
    const safe = Math.max(1, Math.min(p, totalPages));
    setCurrentPage(safe);
  };

  // ⭐ Ouvrir la confirmation
  const handleAskMarkAsPaid = (cmd: OverdueCommande) => {
    setConfirmTarget(cmd);
    setShowConfirm(true);
  };

  // ⭐ Confirmer "Marquer payée"
  const handleConfirmMarkAsPaid = () => {
    if (!confirmTarget) return;
    const totalTTC = Number(confirmTarget.total_ttc || 0);
    onMarkAsPaid(confirmTarget.id, { montant_paye: totalTTC, statut_paiement: 'Payé' });
    setShowConfirm(false);
    setConfirmTarget(null);
  };

  // ⭐ Styles
  const tableBorder = isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #E2E8F0';
  const headerBg = isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC';
  const rowBgEven = isDark ? 'rgba(255,255,255,0.01)' : '#FFFFFF';
  const rowBgOdd = isDark ? 'rgba(239,68,68,0.04)' : '#FEF8F8';
  const cellPadding = '6px 8px';

  const thStyle: React.CSSProperties = {
    border: tableBorder,
    padding: cellPadding,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: isDark ? '#94A3B8' : '#64748B',
    whiteSpace: 'nowrap',
  };

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{
        background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.60)',
        backdropFilter: 'blur(6px)',
      }}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex w-full max-w-[75%] max-h-[90vh] flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          background: isDark ? '#0F172A' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#E2E8F0',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ══════════ HEADER ══════════ */}
        <div
          className="flex items-center justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#DC2626' }}
            >
              <AlertTriangle size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[18px] font-bold" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                Échéances dépassées
              </h3>
              <p className="mt-0.5 truncate text-[12.5px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                {totalItems} commande{totalItems > 1 ? 's' : ''} à régler · Reste à payer{' '}
                <strong style={{ color: '#DC2626' }}>{formatMoney(totalDette)}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 transition hover:bg-slate-100 dark:hover:bg-white/5"
            style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ══════════ BODY ══════════ */}
        <div className="flex-1 overflow-auto px-5 py-4">
          {totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: 'rgba(16,185,129,0.10)', color: '#10B981' }}
              >
                <CheckCircle2 size={30} />
              </div>
              <p className="mt-3 text-[15px] font-semibold" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                Aucune commande en retard
              </p>
              <p className="mt-1 text-[13px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                Toutes les échéances sont respectées.
              </p>
            </div>
          ) : (
            <div
              className="echeances-scroll rounded-lg"
              style={{ border: tableBorder, overflowX: 'auto' }}
            >
              <table
                className="w-full min-w-[850px] border-collapse text-left"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                <thead>
                  <tr style={{ background: headerBg }}>
                    <th style={{ ...thStyle, textAlign: 'left' }}>N° Commande</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Client</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Commande</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Échéance</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Retard</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Mode / Modalité</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Total TTC</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Payé</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Reste</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCommandes.map((cmd, index) => {
                    const totalTTC = Number(cmd.total_ttc || 0);
                    const paye = Number(cmd.montant_paye || 0);
                    const restant = Number(cmd.montant_restant || (totalTTC - paye));
                    const lateSeconds = Number(cmd.late_seconds || 0);
                    const lateText = formatLate(lateSeconds);
                    const rowBg = index % 2 === 0 ? rowBgEven : rowBgOdd;

                    return (
                      <tr key={cmd.id} style={{ background: rowBg }}>
                        {/* N° Commande */}
                        <td style={{ border: tableBorder, padding: cellPadding, verticalAlign: 'middle' }}>
                          <span
                            className="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[12px] font-bold"
                            style={{
                              background: isDark ? 'rgba(79,70,229,0.15)' : 'rgba(79,70,229,0.08)',
                              color: isDark ? '#A5B4FC' : '#4F46E5',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {cmd.numero || `CMD-${String(cmd.id).padStart(6, '0')}`}
                          </span>
                        </td>

                        {/* Client */}
                        <td style={{ border: tableBorder, padding: cellPadding, verticalAlign: 'middle' }}>
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="text-[13px] font-semibold"
                              style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}
                            >
                              {cmd.client_nom || 'Client inconnu'}
                            </span>
                            {cmd.client_telephone && (
                              <span
                                className="text-[11.5px]"
                                style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                              >
                                {cmd.client_telephone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Commande (date) */}
                        <td style={{ border: tableBorder, padding: cellPadding, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span
                            className="text-[12.5px] font-semibold"
                            style={{ color: isDark ? '#E2E8F0' : '#334155' }}
                          >
                            {formatDateFR(cmd.date_commande)}
                          </span>
                        </td>

                        {/* Échéance */}
                        <td style={{ border: tableBorder, padding: cellPadding, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span
                            className="text-[12.5px] font-bold"
                            style={{ color: '#DC2626' }}
                          >
                            {formatDateTimeFR(cmd.date_limite_paiement)}
                          </span>
                        </td>

                        {/* Retard */}
                        <td style={{ border: tableBorder, padding: cellPadding, verticalAlign: 'middle' }}>
                          <span
                            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide"
                            style={{
                              background: 'rgba(239,68,68,0.12)',
                              color: '#DC2626',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {lateText}
                          </span>
                        </td>

                        {/* Mode / Modalité */}
                        <td style={{ border: tableBorder, padding: cellPadding, verticalAlign: 'middle' }}>
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="text-[12px] font-semibold"
                              style={{ color: isDark ? '#E2E8F0' : '#334155' }}
                            >
                              {cmd.mode_paiement || 'Espèces'}
                            </span>
                            <span
                              className="text-[11px]"
                              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                            >
                              {cmd.modalite_paiement || 'Immediat'}
                            </span>
                          </div>
                        </td>

                        {/* Total TTC */}
                        <td style={{ border: tableBorder, padding: cellPadding, verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span
                            className="text-[12.5px] font-bold"
                            style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}
                          >
                            {formatMoney(totalTTC)}
                          </span>
                        </td>

                        {/* Payé */}
                        <td style={{ border: tableBorder, padding: cellPadding, verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span className="text-[12.5px] font-bold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(paye)}
                          </span>
                        </td>

                        {/* Reste */}
                        <td style={{ border: tableBorder, padding: cellPadding, verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span
                            className="text-[12.5px] font-bold"
                            style={{ color: '#DC2626' }}
                          >
                            {formatMoney(restant)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ border: tableBorder, padding: cellPadding, verticalAlign: 'middle', textAlign: 'center' }}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onView(cmd)}
                              title="Voir détails"
                              aria-label="Voir détails"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border transition hover:bg-slate-50 dark:hover:bg-white/5"
                              style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                                color: isDark ? '#CBD5E1' : '#334155',
                              }}
                            >
                              <Eye size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAskMarkAsPaid(cmd)}
                              title="Marquer payée"
                              aria-label="Marquer payée"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border transition hover:bg-emerald-500/20"
                              style={{
                                borderColor: 'rgba(16,185,129,0.40)',
                                background: 'rgba(16,185,129,0.10)',
                                color: '#10B981',
                              }}
                            >
                              <CheckCircle2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ══════════ PAGINATION ══════════ */}
        {totalItems > ITEMS_PER_PAGE && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}
          >
            <p className="text-[12.5px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              <span className="font-semibold" style={{ color: isDark ? '#CBD5E1' : '#334155' }}>
                {startIndex + 1}–{Math.min(endIndex, totalItems)}
              </span>{' '}
              sur <span className="font-semibold" style={{ color: isDark ? '#CBD5E1' : '#334155' }}>{totalItems}</span>{' '}
              commande{totalItems > 1 ? 's' : ''}
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                  color: isDark ? '#CBD5E1' : '#334155',
                }}
                aria-label="Page précédente"
              >
                <ChevronLeft size={14} />
              </button>

              {pageNumbers.map((p, i) =>
                p === 'dots' ? (
                  <span
                    key={`dots-${i}`}
                    className="px-1 text-[12.5px]"
                    style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p)}
                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[12.5px] font-semibold transition ${
                      p === currentPage ? '' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                    style={{
                      borderColor:
                        p === currentPage
                          ? '#4F46E5'
                          : isDark
                          ? 'rgba(255,255,255,0.12)'
                          : '#E2E8F0',
                      background: p === currentPage ? '#4F46E5' : 'transparent',
                      color:
                        p === currentPage
                          ? '#FFFFFF'
                          : isDark
                          ? '#CBD5E1'
                          : '#334155',
                    }}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                  color: isDark ? '#CBD5E1' : '#334155',
                }}
                aria-label="Page suivante"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ══════════ FOOTER ══════════ */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3"
          style={{
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            background: isDark ? '#0F172A' : '#F8FAFC',
          }}
        >
          <div className="text-[12.5px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
            Total dû : <strong style={{ color: '#DC2626' }}>{formatMoney(totalDette)}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[13.5px] font-semibold transition"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
              color: isDark ? '#CBD5E1' : '#334155',
            }}
          >
            Fermer
          </button>
        </div>
      </div>

      {/* ⭐ Confirm Modal ho an'ny "Marquer payée" */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setConfirmTarget(null); }}
        onConfirm={handleConfirmMarkAsPaid}
        title="Marquer comme payée ?"
        message={`Confirmez-vous avoir reçu le paiement de **${formatMoney(Number(confirmTarget?.total_ttc || 0))}** pour la commande **${confirmTarget?.numero || ''}** (${confirmTarget?.client_nom || ''}) ?`}
        confirmText="Marquer payée"
        cancelText="Annuler"
        confirmColor="green"
        isDark={isDark}
      />

      {/* ⭐ Scrollbar nofontosana */}
      <style>{`
        .echeances-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .echeances-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .echeances-scroll::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(79,70,229,0.35)' : 'rgba(79,70,229,0.25)'};
          border-radius: 999px;
        }
        .echeances-scroll::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(79,70,229,0.55)' : 'rgba(79,70,229,0.45)'};
        }
        .echeances-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${isDark ? 'rgba(79,70,229,0.35)' : 'rgba(79,70,229,0.25)'} transparent;
        }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
};

export default EcheancesDepasseesModal;