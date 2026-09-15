// src/components/fournisseurs/FournisseursTable.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: Footer misy badges colorés (sky/emerald/amber/rose)

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Eye, Package, Pencil, Trash2, Plus } from 'lucide-react';

interface Fournisseur {
  id: number;
  nom: string;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  created_at: string;
}

// ⭐ VAOVAO: Stats global ho an'ny footer
interface GlobalStats {
  total: number;
  avecContact: number;
  avecTelephone: number;
  avecEmail: number;
  avecAdresse: number;
}

interface FournisseursTableProps {
  fournisseurs: Fournisseur[];
  onView: (fournisseur: Fournisseur) => void;
  onEdit: (fournisseur: Fournisseur) => void;
  onDelete: (fournisseur: Fournisseur) => void;
  onAdd: () => void;
  isDark?: boolean;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
  // ⭐ VAOVAO
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
const MENU_HEIGHT = 220;
const MENU_PADDING = 10;

const formatDate = (value?: string): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR');
};

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

const FournisseursTable: React.FC<FournisseursTableProps> = ({
  fournisseurs = [], onView, onEdit, onDelete, onAdd, isDark: isDarkProp,
  selectedIds = new Set<number>(),
  onSelectAll, onSelectOne, onBulkDelete,
  globalStats,
  hasActiveFilter = false,
}) => {
  const { isDark: themeIsDark } = useTheme();
  const navigate = useNavigate();
  const isDark = isDarkProp !== undefined ? isDarkProp : themeIsDark;

  const tableBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const tableSecondaryBackground = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorderColor = isDark ? 'border-white/[0.15]' : 'border-slate-200';

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({});
  const safeSelectedIds = selectedIds || new Set<number>();

  useEffect(() => {
    if (openMenuId === null) return;
    const handleClickOutside = () => setOpenMenuId(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuId(null);
    };
    const handleResize = () => setOpenMenuId(null);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    document.addEventListener('scroll', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('scroll', handleClickOutside, true);
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
      position.right = viewportWidth - rect.right + 4;
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

  // ⭐ Stats computed (fallback raha tsy misy globalStats)
  const localStats = useMemo(() => ({
    total: fournisseurs.length,
    avecContact: fournisseurs.filter((f) => Boolean(f.contact?.trim())).length,
    avecTelephone: fournisseurs.filter((f) => Boolean(f.telephone?.trim())).length,
    avecEmail: fournisseurs.filter((f) => Boolean(f.email?.trim())).length,
    avecAdresse: fournisseurs.filter((f) => Boolean(f.adresse?.trim())).length,
  }), [fournisseurs]);

  // ⭐ Stats effective : globalStats raha misy, raha tsy misy dia local
  const effectiveStats = useMemo(() => {
    if (!hasActiveFilter && globalStats && globalStats.total > 0) {
      return {
        total: Number(globalStats.total || 0),
        avecContact: Number(globalStats.avecContact || 0),
        avecTelephone: Number(globalStats.avecTelephone || 0),
        avecEmail: Number(globalStats.avecEmail || 0),
        avecAdresse: Number(globalStats.avecAdresse || 0),
      };
    }
    return localStats;
  }, [globalStats, hasActiveFilter, localStats]);

  const stats = effectiveStats;

  const allSelected = fournisseurs.length > 0 && fournisseurs.every((f) => safeSelectedIds.has(f.id));
  const someSelected = safeSelectedIds.size > 0 && !allSelected;

  const currentFournisseur = useMemo(
    () => (openMenuId === null ? null : fournisseurs.find((f) => f.id === openMenuId) ?? null),
    [fournisseurs, openMenuId]
  );

  // ⭐ Empty state
  if (fournisseurs.length === 0) {
    return (
      <div className={`flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-14 text-center shadow-sm ${tableBackground} ${borderColor}`}>
        <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-slate-400">
          <Package size={30} strokeWidth={1.8} />
        </div>
        <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">Aucun fournisseur</h3>
        <p className="mt-2 max-w-[390px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">
          Commencez par créer votre premier fournisseur.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          <Plus size={17} />
          Ajouter un fournisseur
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-sm ${tableBackground} ${borderColor}`}>
      {/* BULK ACTION BAR */}
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.06]' : 'border-brand-100 bg-brand-50'}`}>
          <span className="text-[14px] font-semibold text-brand-600 dark:text-brand-400">
            {safeSelectedIds.size} fournisseur{safeSelectedIds.size > 1 ? 's' : ''} sélectionné{safeSelectedIds.size > 1 ? 's' : ''}
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

      <div className="custom-scrollbar scrollbar-gutter-stable overflow-x-auto overflow-y-auto">
        <table className={`w-full min-w-[1000px] table-fixed border-collapse text-left ${borderColor}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400">
              <th scope="col" className={`w-[36px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => { if (input) input.indeterminate = someSelected; }}
                  onChange={(event) => onSelectAll?.(event.target.checked)}
                  className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500"
                  aria-label="Sélectionner tous les fournisseurs"
                />
              </th>
              <th scope="col" className={`w-[180px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Fournisseur</th>
              <th scope="col" className={`w-[160px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Contact</th>
              <th scope="col" className={`w-[140px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Téléphone</th>
              <th scope="col" className={`w-[180px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Email</th>
              <th scope="col" className={`w-[110px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Créé le</th>
              <th scope="col" className={`w-[54px] border-b px-1.5 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {fournisseurs.map((fournisseur, index) => {
              const isSelected = safeSelectedIds.has(fournisseur.id);
              const hasContact = Boolean(fournisseur.contact?.trim());
              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow
                ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]'
                : '';
              return (
                <tr
                  key={fournisseur.id}
                  onClick={() => { setOpenMenuId(null); onView(fournisseur); }}
                  className={`group h-[58px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.08]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}
                >
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) => onSelectOne?.(fournisseur.id, event.target.checked)}
                      className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500"
                      aria-label={`Sélectionner ${fournisseur.nom}`}
                    />
                  </td>

                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0 leading-tight">
                      <div title={fournisseur.nom || 'Fournisseur inconnu'} className="max-w-[160px] truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">
                        {fournisseur.nom || 'Fournisseur inconnu'}
                      </div>
                      <div className="mt-0.5 truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">
                        ID #{String(fournisseur.id).padStart(3, '0')}
                      </div>
                    </div>
                  </td>

                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span
                      title={fournisseur.contact || 'Aucun contact'}
                      className={`block max-w-[150px] truncate text-[14.5px] leading-[1.3] ${hasContact ? 'font-medium text-slate-700 dark:text-slate-300' : 'italic text-slate-400 dark:text-slate-500'}`}
                    >
                      {fournisseur.contact || 'Aucun contact'}
                    </span>
                  </td>

                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span title={fournisseur.telephone || ''} className="block max-w-[130px] truncate text-[14.5px] font-medium text-slate-700 dark:text-slate-300">
                      {fournisseur.telephone || '—'}
                    </span>
                  </td>

                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span title={fournisseur.email || ''} className="block max-w-[170px] truncate text-[14.5px] font-medium text-slate-700 dark:text-slate-300">
                      {fournisseur.email || '—'}
                    </span>
                  </td>

                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="block max-w-[100px] truncate whitespace-nowrap text-[13.5px] font-medium text-slate-700 dark:text-slate-200">
                      {formatDate(fournisseur.created_at)}
                    </span>
                  </td>

                  <td className={`border-b px-1 py-2 align-middle text-right ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      title="Actions"
                      aria-label={`Actions pour ${fournisseur.nom}`}
                      aria-expanded={openMenuId === fournisseur.id}
                      onClick={(event) => toggleMenu(fournisseur.id, event)}
                      className={`flex h-7 w-7 items-center justify-center rounded border transition-all duration-150 ${
                        openMenuId === fournisseur.id
                          ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400'
                          : 'border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-200 hover:text-brand-600 dark:border-transparent dark:bg-transparent dark:text-slate-400 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className="text-[14.5px] font-bold tracking-widest">...</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CONTEXT MENU */}
      {openMenuId !== null && currentFournisseur && createPortal(
        <div
          className={`fixed z-[99999] w-[230px] overflow-hidden rounded-xl border-[0.5px] py-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.35)] ${isDark ? 'border-white/[0.10] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}
          style={{
            top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
            bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
            left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined,
            right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined,
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className={`border-b px-3 py-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
            <div className="min-w-0">
              <div className="max-w-[160px] truncate text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">{currentFournisseur.nom}</div>
              <div className="mt-0.5 font-mono text-[12.5px] text-slate-400">ID #{currentFournisseur.id}</div>
            </div>
          </div>

          <div className="flex flex-col text-[14.5px] py-0.5">
            <MenuButton
              icon={<Eye size={15} strokeWidth={2.2} />}
              label="Voir les détails"
              tone="sky"
              onMouseDown={(event) => handleMenuAction(() => onView(currentFournisseur), event)}
            />

            <MenuButton
              icon={<Package size={15} strokeWidth={2.2} />}
              label="Voir les produits"
              onMouseDown={(event) => handleMenuAction(() => navigate(`/produits?fournisseur=${currentFournisseur.id}`), event)}
            />

            <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`} />

            <MenuButton
              icon={<Pencil size={15} strokeWidth={2.2} />}
              label="Modifier"
              tone="amber"
              onMouseDown={(event) => handleMenuAction(() => onEdit(currentFournisseur), event)}
            />

            <MenuButton
              icon={<Trash2 size={15} strokeWidth={2.2} />}
              label="Supprimer"
              tone="danger"
              onMouseDown={(event) => handleMenuAction(() => onDelete(currentFournisseur), event)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ⭐⭐⭐ FOOTER — BADGES COLORÉS ⭐⭐⭐ */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2.5 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">

          {/* ⭐ Nombre fournisseurs */}
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {stats.total}
            </span>{' '}
            fournisseur{stats.total > 1 ? 's' : ''}
            {hasActiveFilter && (
              <span className="ml-1 text-[12px] text-slate-400 dark:text-slate-500">(filtré)</span>
            )}
          </span>

          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />

          {/* ⭐ BADGES COLORÉS */}
          <div className="flex flex-wrap items-center gap-1.5">

            {/* ⭐ Contact — Emerald */}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Contact : {stats.avecContact}
            </span>

            {/* ⭐ Téléphone — Sky */}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
              Tél : {stats.avecTelephone}
            </span>

            {/* ⭐ Email — Indigo */}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
              Email : {stats.avecEmail}
            </span>

            {/* ⭐ Adresse — Amber */}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              Adresse : {stats.avecAdresse}
            </span>
          </div>
        </div>

        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
          Gestion des fournisseurs
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
      `}</style>
    </div>
  );
};

export default FournisseursTable;