// src/components/achats/AchatsTable.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: Footer misy badges colorés (emerald/amber/red) + globalStats
// ⭐ VAOVAO: `globalStats` prop + `hasActiveFilter`
// ⭐ FIX: Couleur de fond amin'ny ellipsis button rehefa dark mode

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckSquare, Eye, Edit, Plus, Trash2, Download } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Achat {
  id: number;
  reference: string | null;
  fournisseur_id: number;
  fournisseur_nom?: string;
  date_achat: string;
  total_ht: number;
  total_ttc: number;
  statut_paiement?: string;
  montant_paye?: number;
  montant_restant?: number;
  designation?: string;
  nombre_produits?: number;
  observation?: string;
  created_at: string;
  updated_at?: string;
}

// ⭐ VAOVAO: Stats global ho an'ny footer
interface GlobalStats {
  total: number;
  totalMontant: number;
  totalPaye: number;
  totalReste: number;
  totalProduits: number;
  payees: number;
  partiel: number;
  nonPayees: number;
}

interface AchatsTableProps {
  achats: Achat[];
  loading?: boolean;
  totalItems?: number;
  onView: (achat: Achat) => void;
  onEdit: (achat: Achat) => void;
  onDelete: (achat: Achat) => void;
  onAdd: () => void;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
  onUpdatePaiement?: (id: number, data: { statut_paiement: string; montant_paye: number; montant_restant: number }) => void;
  onDownloadPDF?: (achat: Achat) => void;
  // ⭐ VAOVAO
  globalStats?: GlobalStats;
  hasActiveFilter?: boolean;
}

interface MenuPosition { top?: number; bottom?: number; left?: number; right?: number; }
const MENU_WIDTH = 220;
const MENU_HEIGHT = 220;
const MENU_PADDING = 10;

// ════════════════════════════════════════════════════════════
// SKELETON
// ════════════════════════════════════════════════════════════

const SkeletonRow = memo(({ isDark }: { isDark: boolean }) => {
  const skeleton = isDark ? 'animate-pulse rounded-sm bg-white/[0.07]' : 'animate-pulse rounded-sm bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-100';
  return (
    <tr className="h-[58px]">
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-4 w-4`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-16`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className="space-y-1.5"><div className={`${skeleton} h-4 w-24`} /><div className={`${skeleton} h-3 w-16`} /></div></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-4 w-16`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-4 w-24`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-12`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-20`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-16`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-20`} /></td>
      <td className={`border-b px-1 py-2 text-right ${border}`}><div className={`${skeleton} h-7 w-7 ml-auto`} /></td>
    </tr>
  );
});
SkeletonRow.displayName = 'SkeletonRow';

// ════════════════════════════════════════════════════════════
// MENU BUTTON
// ════════════════════════════════════════════════════════════

interface MenuButtonProps {
  icon?: React.ReactNode;
  label: string;
  tone?: 'default' | 'emerald' | 'danger' | 'sky' | 'amber';
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, label, tone = 'default', onMouseDown }) => {
  const toneClass =
    tone === 'emerald' ? 'text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-500/10' :
    tone === 'sky' ? 'text-slate-700 hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-sky-500/10' :
    tone === 'amber' ? 'text-slate-700 hover:bg-amber-50 dark:text-slate-200 dark:hover:bg-amber-500/10' :
    tone === 'danger' ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10' :
    'text-slate-700 hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-brand-500/10';

  const iconClass =
    tone === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' :
    tone === 'sky' ? 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400' :
    tone === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' :
    tone === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' :
    'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400';

  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      className={`group flex w-full items-center gap-2.5 px-3 py-2 text-left font-medium transition-colors ${toneClass}`}
    >
      {icon && <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${iconClass}`}>{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

// ════════════════════════════════════════════════════════════
// COMPOSANT
// ════════════════════════════════════════════════════════════

const AchatsTable: React.FC<AchatsTableProps> = ({
  achats, loading = false, totalItems, onView, onEdit, onDelete, onAdd,
  selectedIds = new Set<number>(), onSelectAll, onSelectOne, onBulkDelete, onUpdatePaiement,
  onDownloadPDF,
  globalStats,
  hasActiveFilter = false,
}) => {
  const { isDark } = useTheme();
  const tableBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const tableSecondaryBackground = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorderColor = isDark ? 'border-white/[0.15]' : 'border-slate-200';

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({});

  // ⭐ Local stats (fallback raha tsy misy globalStats)
  const localStats = useMemo(() => {
    let totalProduits = 0, payees = 0, partiel = 0, nonPayees = 0;
    let totalMontant = 0, totalPaye = 0, totalReste = 0;

    for (const achat of achats) {
      totalProduits += Number(achat.nombre_produits) || 0;
      const totalTTC = Number(achat.total_ttc) || 0;
      const paye = Number(achat.montant_paye) || 0;
      const restant = Math.max(0, totalTTC - paye);
      const statut = paye <= 0 ? 'Non payé' : paye >= totalTTC ? 'Payé' : 'Partiel';

      totalMontant += totalTTC;
      totalPaye += paye;
      totalReste += restant;

      if (statut === 'Payé') payees++;
      else if (statut === 'Partiel') partiel++;
      else nonPayees++;
    }

    return {
      total: achats.length,
      totalProduits,
      payees,
      partiel,
      nonPayees,
      totalMontant,
      totalPaye,
      totalReste,
    };
  }, [achats]);

  // ⭐ Stats effective : globalStats raha misy, raha tsy misy dia local
  const effectiveStats = useMemo(() => {
    if (!hasActiveFilter && globalStats && globalStats.total > 0) {
      return {
        total: Number(globalStats.total || 0),
        totalProduits: Number(globalStats.totalProduits || 0),
        payees: Number(globalStats.payees || 0),
        partiel: Number(globalStats.partiel || 0),
        nonPayees: Number(globalStats.nonPayees || 0),
        totalMontant: Number(globalStats.totalMontant || 0),
        totalPaye: Number(globalStats.totalPaye || 0),
        totalReste: Number(globalStats.totalReste || 0),
      };
    }
    return localStats;
  }, [globalStats, hasActiveFilter, localStats]);

  const safeSelectedIds = selectedIds || new Set<number>();
  const allSelected = achats.length > 0 && achats.every(achat => safeSelectedIds.has(achat.id));
  const someSelected = safeSelectedIds.size > 0 && !allSelected;

  useEffect(() => {
    if (openMenuId === null) return;
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenMenuId(null); };
    const handleResize = () => setOpenMenuId(null);
    const clickOutside = () => setOpenMenuId(null);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('scroll', clickOutside, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('scroll', clickOutside, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [openMenuId]);

  const toggleMenu = useCallback((id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const position: MenuPosition = {};
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < MENU_HEIGHT + MENU_PADDING && spaceAbove > MENU_HEIGHT + MENU_PADDING) {
      position.bottom = viewportHeight - rect.top + 4;
    } else {
      position.top = rect.bottom + 4;
    }
    const spaceRight = viewportWidth - rect.right;
    if (spaceRight < MENU_WIDTH + MENU_PADDING && rect.left > MENU_WIDTH + MENU_PADDING) {
      position.right = spaceRight + 4;
    } else {
      position.left = Math.max(MENU_PADDING, rect.right - MENU_WIDTH);
    }
    setMenuPosition(position);
    setOpenMenuId(id);
  }, [openMenuId]);

  const handleMenuAction = useCallback((callback: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(null);
    callback();
  }, []);

  const currentAchat = useMemo(
    () => (openMenuId === null ? null : achats.find(achat => achat.id === openMenuId) ?? null),
    [achats, openMenuId]
  );

  // ⭐ Empty state
  if (!loading && achats.length === 0) {
    return (
      <div className={`flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-14 text-center shadow-sm ${tableBackground} ${borderColor}`}>
        <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-slate-400">
          <Plus size={30} strokeWidth={1.8} />
        </div>
        <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">Aucun achat trouvé</h3>
        <p className="mt-2 max-w-[390px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">
          Aucun achat ne correspond aux critères actuels.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          <Plus size={17} />
          Nouvel achat
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-sm ${tableBackground} ${borderColor}`}>
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.06]' : 'border-brand-100 bg-brand-50'}`}>
          <span className="text-[14px] font-semibold text-brand-600 dark:text-brand-400">
            {safeSelectedIds.size} achat{safeSelectedIds.size > 1 ? 's' : ''} sélectionné{safeSelectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onBulkDelete?.(Array.from(safeSelectedIds))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-2.5 py-1.5 text-[14px] font-semibold text-white shadow-sm hover:bg-red-600"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
            <button
              type="button"
              onClick={() => onSelectAll?.(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[14px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300"
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      <div className="custom-scrollbar scrollbar-gutter-stable overflow-x-auto overflow-y-auto" style={{ maxHeight: '600px' }}>
        <table className={`w-full min-w-[1080px] table-fixed border-collapse text-left ${borderColor}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400">
              <th scope="col" className={`w-[36px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected; }}
                  onChange={e => onSelectAll?.(e.target.checked)}
                  className="h-[14px] w-[14px] cursor-pointer accent-brand-500"
                  aria-label="Sélectionner tous les achats"
                />
              </th>
              <th scope="col" className={`w-[100px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>N°</th>
              <th scope="col" className={`w-[140px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Fournisseur</th>
              <th scope="col" className={`w-[90px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Date</th>
              <th scope="col" className={`w-[130px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Désignation</th>
              <th scope="col" className={`w-[70px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Produits</th>
              <th scope="col" className={`w-[110px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Total TTC</th>
              <th scope="col" className={`w-[80px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Statut</th>
              <th scope="col" className={`w-[110px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Reste</th>
              <th scope="col" className={`w-[54px] border-b px-1.5 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {loading ? Array.from({ length: 7 }).map((_, index) => <SkeletonRow key={index} isDark={isDark} />) : achats.map((achat, index) => {
              const isSelected = safeSelectedIds.has(achat.id);
              const calculatedTTC = Number(achat.total_ttc) || 0;
              const calculatedPaye = Number(achat.montant_paye) || 0;
              const montantRestant = Math.max(0, calculatedTTC - calculatedPaye);
              const statutPaiement = calculatedPaye <= 0 ? 'Non payé' : calculatedPaye >= calculatedTTC ? 'Payé' : 'Partiel';
              const statutColor = statutPaiement === 'Payé'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25'
                : statutPaiement === 'Partiel'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25'
                  : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25';
              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow
                ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]'
                : '';

              return (
                <tr
                  key={achat.id}
                  onClick={() => { setOpenMenuId(null); onView(achat); }}
                  className={`group h-[58px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.08]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}
                >
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => onSelectOne?.(achat.id, e.target.checked)}
                      className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500"
                      aria-label={`Sélectionner ${achat.reference || achat.id}`}
                    />
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span title={achat.reference || '—'} className="inline-flex max-w-[100px] truncate rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[13.5px] font-semibold leading-tight text-brand-600 dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">
                      {achat.reference || '—'}
                    </span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0 leading-tight">
                      <div title={achat.fournisseur_nom || 'Fournisseur inconnu'} className="max-w-[110px] truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">
                        {achat.fournisseur_nom || 'Fournisseur inconnu'}
                      </div>
                      <div className="mt-0.5 text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">ID #{String(achat.id).padStart(3, '0')}</div>
                    </div>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    {achat.date_achat ? (
                      <span className="whitespace-nowrap text-[13.5px] font-medium text-slate-700 dark:text-slate-200">
                        {new Date(achat.date_achat).toLocaleDateString('fr-FR')}
                      </span>
                    ) : (
                      <span className="text-[14.5px] text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0">
                      <div title={achat.designation || '—'} className="max-w-[120px] truncate text-[14.5px] font-medium text-slate-700 dark:text-slate-300">
                        {achat.designation || '—'}
                      </div>
                    </div>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="inline-flex min-w-[30px] items-center justify-center rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[13.5px] font-bold leading-tight text-brand-600 dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">
                      {Number(achat.nombre_produits || 0)}
                    </span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-bold text-slate-900 dark:text-slate-100">
                      {calculatedTTC.toLocaleString('fr-FR')} Ar
                    </span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className={`inline-flex items-center whitespace-nowrap rounded border px-1.5 py-0.5 text-[13px] font-semibold leading-tight ${statutColor}`}>
                      {statutPaiement}
                    </span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className={`whitespace-nowrap text-[14.5px] font-bold ${montantRestant > 0 ? 'text-brand-600 dark:text-brand-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {montantRestant.toLocaleString('fr-FR')} Ar
                    </span>
                  </td>
                  <td className={`border-b px-1 py-2 align-middle text-right ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={e => toggleMenu(achat.id, e)}
                        title="Actions"
                        aria-label={`Actions pour ${achat.reference || achat.id}`}
                        aria-expanded={openMenuId === achat.id}
                        className={`flex h-7 w-7 items-center justify-center rounded border transition-all duration-150 ${
                          openMenuId === achat.id
                            ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400'
                            : 'border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-200 hover:text-brand-600 dark:border-white/[0.10] dark:bg-white/[0.06] dark:text-slate-300 dark:hover:border-white/[0.18] dark:hover:bg-white/[0.10] dark:hover:text-slate-100'
                        }`}
                      >
                        <span className="text-[14.5px] font-bold tracking-widest">...</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openMenuId !== null && currentAchat && createPortal(
        <div
          className={`fixed z-[99999] w-[230px] overflow-hidden rounded-xl border-[0.5px] py-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.35)] ${isDark ? 'border-white/[0.10] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}
          style={{
            top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
            bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
            left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined,
            right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined,
          }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <div className={`border-b px-3 py-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
            <div className="min-w-0">
              <div className="max-w-[160px] truncate text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">
                {currentAchat.reference || '—'}
              </div>
              <div className="mt-0.5 font-mono text-[12.5px] text-slate-400">ID #{currentAchat.id}</div>
            </div>
          </div>

          <div className="flex flex-col text-[14.5px] py-0.5">
            {currentAchat.statut_paiement !== 'Payé' && (
              <MenuButton
                icon={<CheckSquare size={15} strokeWidth={2.2} />}
                label="Marquer comme payée"
                tone="emerald"
                onMouseDown={e => handleMenuAction(
                  () => onUpdatePaiement?.(currentAchat.id, {
                    statut_paiement: 'Payé',
                    montant_paye: Number(currentAchat.total_ttc) || 0,
                    montant_restant: 0,
                  }),
                  e
                )}
              />
            )}

            <MenuButton
              icon={<Eye size={15} strokeWidth={2.2} />}
              label="Voir les détails"
              tone="sky"
              onMouseDown={e => handleMenuAction(() => onView(currentAchat), e)}
            />

            {onDownloadPDF && (
              <MenuButton
                icon={<Download size={15} strokeWidth={2.2} />}
                label="Télécharger PDF"
                onMouseDown={e => handleMenuAction(() => onDownloadPDF(currentAchat), e)}
              />
            )}

            <MenuButton
              icon={<Edit size={15} strokeWidth={2.2} />}
              label="Modifier"
              tone="amber"
              onMouseDown={e => handleMenuAction(() => onEdit(currentAchat), e)}
            />

            <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`} />

            <MenuButton
              icon={<Trash2 size={15} strokeWidth={2.2} />}
              label="Supprimer"
              tone="danger"
              onMouseDown={e => handleMenuAction(() => onDelete(currentAchat), e)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ⭐⭐⭐ FOOTER — BADGES COLORÉS + GLOBAL STATS ⭐⭐⭐ */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2.5 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">

          {/* ⭐ Nombre d'achats (GLOBAL) */}
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {effectiveStats.total}
            </span>{' '}
            achat{effectiveStats.total > 1 ? 's' : ''}
            {hasActiveFilter && (
              <span className="ml-1 text-[12px] text-slate-400 dark:text-slate-500">(filtré)</span>
            )}
          </span>

          {/* ⭐ Total montant (neutre) */}
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {effectiveStats.totalMontant.toLocaleString('fr-FR')} Ar
            </span>{' '}
            Total
          </span>

          {/* ⭐ Total payé (emerald) */}
          <span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {effectiveStats.totalPaye.toLocaleString('fr-FR')} Ar
            </span>{' '}
            Payé
          </span>

          {/* ⭐ Total produits (sky) */}
          <span>
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              {effectiveStats.totalProduits.toLocaleString('fr-FR')}
            </span>{' '}
            produit{effectiveStats.totalProduits > 1 ? 's' : ''}
          </span>

          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />

          {/* ⭐ BADGES COLORÉS */}
          <div className="flex flex-wrap items-center gap-1.5">

            {/* ⭐ Payé — Emerald */}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Payé : {effectiveStats.payees}
            </span>

            {/* ⭐ Partiel — Amber */}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              Partiel : {effectiveStats.partiel}
            </span>

            {/* ⭐ Non payé — Red */}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-red-600 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400" />
              Non payé : {effectiveStats.nonPayees}
            </span>
          </div>
        </div>

        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
          Gestion des achats
        </span>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4F46E5; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338CA; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #4F46E5 transparent; }
        .scrollbar-gutter-stable { scrollbar-gutter: stable; }
        @keyframes rowIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        .group { animation: rowIn 0.16s ease-out; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  );
};

export default memo(AchatsTable);