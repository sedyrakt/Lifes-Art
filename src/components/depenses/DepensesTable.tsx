// src/components/depenses/DepensesTable.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: Montant POSITIF (fa tsy négatif) — couleur rose mba hanondro dépense
// ⭐ FIX: Footer misy TOTAL GLOBAL + badges colorés
// ⭐ FIX: Couleur de fond amin'ny ellipsis button rehefa dark mode

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Depense {
  id: number;
  categorie: string;
  description: string;
  montant: number;
  date_depense: string;
  mode_paiement: string;
  reference: string;
  fournisseur_id: number;
  fournisseur_nom?: string;
  observation: string;
  created_at: string;
}

interface GlobalStats {
  total: number;
  totalMontant: number;
  topCategories?: Array<{ categorie: string; count: number; total: number }>;
}

interface DepensesTableProps {
  depenses?: Depense[];
  onView: (depense: Depense) => void;
  onEdit: (depense: Depense) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  categoryIcons: Record<string, any>;
  categoryColors: (cat: string) => { light: string; dark: string; text: string };
  isDark?: boolean;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
  globalStats?: GlobalStats;
  hasActiveFilter?: boolean;
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

const MENU_WIDTH = 220;
const MENU_HEIGHT = 200;
const MENU_PADDING = 12;

// ⭐ Palette de couleurs ho an'ny badges catégories
const CATEGORY_COLORS = [
  { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/25', dot: 'bg-emerald-500 dark:bg-emerald-400' },
  { bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-500/25', dot: 'bg-sky-500 dark:bg-sky-400' },
  { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-500/25', dot: 'bg-amber-500 dark:bg-amber-400' },
  { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-500/25', dot: 'bg-violet-500 dark:bg-violet-400' },
  { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/25', dot: 'bg-rose-500 dark:bg-rose-400' },
  { bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-500/25', dot: 'bg-cyan-500 dark:bg-cyan-400' },
];

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
// SKELETON ROW
// ════════════════════════════════════════════════════════════

const SkeletonRow = React.memo(({ isDark }: { isDark: boolean }) => {
  const skeleton = isDark ? 'animate-pulse rounded-sm bg-white/[0.07]' : 'animate-pulse rounded-sm bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-100';
  return (
    <tr className="h-[58px]">
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-4 w-4`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-16`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className="space-y-1.5"><div className={`${skeleton} h-4 w-32`} /><div className={`${skeleton} h-3 w-20`} /></div></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-4 w-16`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-20`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-16`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-4 w-24`} /></td>
      <td className={`border-b px-1 py-2 text-right ${border}`}><div className={`${skeleton} h-7 w-7 ml-auto`} /></td>
    </tr>
  );
});
SkeletonRow.displayName = 'SkeletonRow';

// ════════════════════════════════════════════════════════════
// COMPOSANT
// ════════════════════════════════════════════════════════════

const DepensesTable: React.FC<DepensesTableProps> = ({
  depenses = [],
  onView,
  onEdit,
  onDelete,
  onAdd,
  categoryIcons,
  categoryColors,
  isDark: isDarkProp,
  selectedIds = new Set<number>(),
  onSelectAll,
  onSelectOne,
  onBulkDelete,
  globalStats,
  hasActiveFilter = false,
}) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = isDarkProp !== undefined ? isDarkProp : themeIsDark;

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({});

  void categoryIcons;
  void categoryColors;

  const tableBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const tableSecondaryBackground = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorderColor = isDark ? 'border-white/[0.15]' : 'border-slate-200';

  const safeDepenses = depenses || [];
  const safeSelectedIds = selectedIds || new Set<number>();

  const selectedCount = safeSelectedIds.size;
  const allSelected = safeDepenses.length > 0 && safeDepenses.every(item => safeSelectedIds.has(item.id));
  const someSelected = selectedCount > 0 && !allSelected;

  // ⭐ Stats computed (fallback raha tsy misy globalStats)
  const localStats = useMemo(() => {
    const totalMontant = safeDepenses.reduce((sum, d) => sum + Number(d.montant || 0), 0);
    const cats: Record<string, { count: number; total: number }> = {};
    for (const d of safeDepenses) {
      const cat = d.categorie || 'Autre';
      if (!cats[cat]) cats[cat] = { count: 0, total: 0 };
      cats[cat].count++;
      cats[cat].total += Number(d.montant || 0);
    }
    const topCategories = Object.entries(cats)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 3)
      .map(([categorie, s]) => ({ categorie, count: s.count, total: s.total }));
    return { total: safeDepenses.length, totalMontant, topCategories };
  }, [safeDepenses]);

  // ⭐ Stats effective : globalStats raha misy, raha tsy misy dia local
  const effectiveStats = useMemo(() => {
    if (!hasActiveFilter && globalStats && globalStats.total > 0) {
      return {
        total: Number(globalStats.total || 0),
        totalMontant: Number(globalStats.totalMontant || 0),
        topCategories: globalStats.topCategories || [],
      };
    }
    return localStats;
  }, [globalStats, hasActiveFilter, localStats]);

  const currentDepense = useMemo(
    () => (openMenuId === null ? null : safeDepenses.find(i => i.id === openMenuId) || null),
    [safeDepenses, openMenuId]
  );

  const formatDate = useCallback((date?: string) => {
    if (!date) return 'N/A';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }, []);

  useEffect(() => {
    if (openMenuId === null) return;
    const close = () => setOpenMenuId(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [openMenuId]);

  const toggleMenu = useCallback((id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const position: MenuPosition = {};
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < MENU_HEIGHT + MENU_PADDING && spaceAbove > MENU_HEIGHT + MENU_PADDING) {
      position.bottom = vh - rect.top + 4;
    } else {
      position.top = rect.bottom + 4;
    }
    const spaceRight = vw - rect.right;
    if (spaceRight < MENU_WIDTH + MENU_PADDING && rect.left > MENU_WIDTH + MENU_PADDING) {
      position.right = vw - rect.right + 4;
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

  // ⭐ Empty state
  if (safeDepenses.length === 0) {
    return (
      <div className={`flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-14 text-center shadow-sm ${tableBackground} ${borderColor}`}>
        <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-slate-400">
          <Plus size={30} strokeWidth={1.8} />
        </div>
        <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">Aucune dépense trouvée</h3>
        <p className="mt-2 max-w-[390px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">
          Commencez par enregistrer votre première dépense pour suivre vos finances.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          <Plus size={17} />
          Nouvelle dépense
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-sm ${tableBackground} ${borderColor}`}>

      {/* Bandeau sélection */}
      {selectedCount > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.06]' : 'border-brand-100 bg-brand-50'}`}>
          <span className="text-[14px] font-semibold text-brand-600 dark:text-brand-400">
            {selectedCount} dépense{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
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

      {/* Table */}
      <div className="custom-scrollbar scrollbar-gutter-stable overflow-x-auto overflow-y-auto" style={{ maxHeight: '600px' }}>
        <table className={`w-full min-w-[880px] table-fixed border-collapse text-left ${borderColor}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400">
              <th scope="col" className={`w-[36px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => { if (input) input.indeterminate = someSelected; }}
                  onChange={e => onSelectAll?.(e.target.checked)}
                  className="h-[14px] w-[14px] cursor-pointer accent-brand-500"
                  aria-label="Sélectionner toutes les dépenses"
                />
              </th>
              <th scope="col" className={`w-[130px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Catégorie</th>
              <th scope="col" className={`w-[190px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Description</th>
              <th scope="col" className={`w-[90px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Date</th>
              <th scope="col" className={`w-[110px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Montant</th>
              <th scope="col" className={`w-[100px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Paiement</th>
              <th scope="col" className={`w-[130px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Fournisseur</th>
              <th scope="col" className={`w-[54px] border-b px-1.5 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {safeDepenses.map((depense, index) => {
              const isSelected = safeSelectedIds.has(depense.id);
              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow
                ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]'
                : '';

              return (
                <tr
                  key={depense.id}
                  onClick={() => { setOpenMenuId(null); onView(depense); }}
                  className={`group h-[58px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.08]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}
                >
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => onSelectOne?.(depense.id, e.target.checked)}
                      className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500"
                      aria-label={`Sélectionner ${depense.description || depense.categorie}`}
                    />
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="inline-flex max-w-[100px] truncate rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[13.5px] font-semibold leading-tight text-brand-600 dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">
                      {depense.categorie || 'Autre'}
                    </span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0 leading-tight">
                      <div className="max-w-[170px] truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400" title={depense.description || undefined}>
                        {depense.description || 'Sans description'}
                      </div>
                      {depense.reference && (
                        <div className="mt-0.5 max-w-[170px] truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400" title={depense.reference}>
                          {depense.reference}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[13.5px] font-medium text-slate-700 dark:text-slate-200">
                      {formatDate(depense.date_depense)}
                    </span>
                  </td>

                  {/* ⭐⭐⭐ MONTANT — POSITIF (couleur rose ho an'ny dépense) ⭐⭐⭐ */}
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-bold text-rose-600 dark:text-rose-400">
                      {Number(depense.montant || 0).toLocaleString('fr-FR')} Ar
                    </span>
                  </td>

                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-medium text-slate-700 dark:text-slate-300">
                      {depense.mode_paiement || 'N/A'}
                    </span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="block max-w-[115px] truncate text-[14.5px] font-medium text-slate-700 dark:text-slate-300" title={depense.fournisseur_nom || undefined}>
                      {depense.fournisseur_nom || '—'}
                    </span>
                  </td>
                  <td className={`border-b px-1 py-2 align-middle text-right ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        title="Actions"
                        aria-label={`Actions pour ${depense.description || depense.categorie}`}
                        aria-expanded={openMenuId === depense.id}
                        onClick={e => toggleMenu(depense.id, e)}
                        className={`flex h-7 w-7 items-center justify-center rounded border transition-all duration-150 ${
                          openMenuId === depense.id
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

      {/* Menu actions */}
      {openMenuId !== null && currentDepense && createPortal(
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
                {currentDepense.description || currentDepense.categorie || '—'}
              </div>
              <div className="mt-0.5 font-mono text-[12.5px] text-slate-400">ID #{currentDepense.id}</div>
            </div>
          </div>

          <div className="flex flex-col text-[14.5px] py-0.5">
            <MenuButton
              icon={<Eye size={15} strokeWidth={2.2} />}
              label="Voir les détails"
              tone="sky"
              onMouseDown={e => handleMenuAction(() => onView(currentDepense), e)}
            />
            <MenuButton
              icon={<Edit size={15} strokeWidth={2.2} />}
              label="Modifier"
              tone="amber"
              onMouseDown={e => handleMenuAction(() => onEdit(currentDepense), e)}
            />
            <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`} />
            <MenuButton
              icon={<Trash2 size={15} strokeWidth={2.2} />}
              label="Supprimer"
              tone="danger"
              onMouseDown={e => handleMenuAction(() => onDelete(currentDepense.id), e)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ⭐⭐⭐ FOOTER — TOTAL GLOBAL + badges colorés ⭐⭐⭐ */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2.5 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">

          {/* ⭐ Nombre de dépenses (GLOBAL) */}
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {effectiveStats.total}
            </span>{' '}
            dépense{effectiveStats.total > 1 ? 's' : ''}
            {hasActiveFilter && (
              <span className="ml-1 text-[12px] text-slate-400 dark:text-slate-500">(filtré)</span>
            )}
          </span>

          {/* ⭐ Total Montant GLOBAL — POSITIF + rose */}
          <span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {effectiveStats.totalMontant.toLocaleString('fr-FR')} Ar
            </span>{' '}
            Total
          </span>

          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />

          {/* ⭐ Top catégories — badges colorés */}
          <div className="flex flex-wrap items-center gap-1.5">
            {effectiveStats.topCategories.length > 0 ? (
              effectiveStats.topCategories.map((cat, idx) => {
                const palette = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                return (
                  <span
                    key={cat.categorie}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[13px] font-semibold leading-tight ${palette.bg} ${palette.text} ${palette.border}`}
                    title={`${cat.categorie} : ${cat.count} dépense(s) · ${cat.total.toLocaleString('fr-FR')} Ar`}
                  >
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${palette.dot}`} />
                    <span className="max-w-[100px] truncate">{cat.categorie}</span>
                    <span className="opacity-70">: {cat.count}</span>
                  </span>
                );
              })
            ) : (
              <span className="text-[13px] text-slate-400 dark:text-slate-500">
                Aucune catégorie
              </span>
            )}
          </div>
        </div>

        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
          Suivi des dépenses
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

export default React.memo(DepensesTable);