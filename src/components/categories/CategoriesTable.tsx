// src/components/categories/CategoriesTable.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: Footer misy badges colorés (emerald/amber/sky)
// ⭐ VAOVAO: `globalStats` prop + `hasActiveFilter`
// ⭐ FIX: Couleur de fond amin'ny ellipsis button rehefa dark mode

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Eye, Pencil, Trash2, Plus, FolderOpen } from 'lucide-react';

interface Categorie {
  id: number;
  nom: string;
  description?: string;
  created_at: string;
  produits_count?: number;
}

// ⭐ VAOVAO: Stats global ho an'ny footer
interface GlobalStats {
  total: number;
  avecDescription: number;
  sansDescription: number;
  totalProduits: number;
  categoriesVides: number;
  totalStock: number;
  valeurStock: number;
}

interface CategoriesTableProps {
  categories: Categorie[];
  onView: (categorie: Categorie) => void;
  onEdit: (categorie: Categorie) => void;
  onDelete: (categorie: Categorie) => void;
  onAdd: () => void;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
  // ⭐ VAOVAO
  globalStats?: GlobalStats;
  hasActiveFilter?: boolean;
}

interface MenuPosition { top?: number; bottom?: number; left?: number; right?: number; }

const MENU_WIDTH = 220;
const MENU_HEIGHT = 180;
const MENU_PADDING = 10;

const safeNumber = (value: unknown, fallback = 0): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const formatDate = (value?: string): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
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

const CategoriesTable: React.FC<CategoriesTableProps> = ({
  categories = [],
  onView,
  onEdit,
  onDelete,
  onAdd,
  selectedIds = new Set<number>(),
  onSelectAll,
  onSelectOne,
  onBulkDelete,
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

  const safeCategories = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  const safeSelectedIds = selectedIds || new Set<number>();

  // ⭐ Stats computed (fallback raha tsy misy globalStats)
  const localStats = useMemo(() => {
    const totalCategories = safeCategories.length;
    const categoriesAvecProduits = safeCategories.filter(c => safeNumber(c.produits_count) > 0).length;
    const categoriesVides = safeCategories.filter(c => safeNumber(c.produits_count) === 0).length;
    const totalProduits = safeCategories.reduce((total, c) => total + safeNumber(c.produits_count), 0);
    const maxProduits = Math.max(1, ...safeCategories.map(c => safeNumber(c.produits_count)));
    return {
      total: totalCategories,
      avecDescription: 0,
      sansDescription: 0,
      totalProduits,
      categoriesAvecProduits,
      categoriesVides,
      maxProduits,
      totalStock: 0,
      valeurStock: 0,
    };
  }, [safeCategories]);

  // ⭐ Stats effective : globalStats raha misy, raha tsy misy dia local
  const effectiveStats = useMemo(() => {
    if (!hasActiveFilter && globalStats && globalStats.total > 0) {
      return {
        total: Number(globalStats.total || 0),
        avecDescription: Number(globalStats.avecDescription || 0),
        sansDescription: Number(globalStats.sansDescription || 0),
        totalProduits: Number(globalStats.totalProduits || 0),
        categoriesVides: Number(globalStats.categoriesVides || 0),
        totalStock: Number(globalStats.totalStock || 0),
        valeurStock: Number(globalStats.valeurStock || 0),
        // Local-only (per-page)
        categoriesAvecProduits: localStats.categoriesAvecProduits,
        maxProduits: localStats.maxProduits,
      };
    }
    return localStats;
  }, [globalStats, hasActiveFilter, localStats]);

  // ⭐ Progress bar uses local maxProduits (per-page)
  const stats = effectiveStats;

  const allSelected = safeCategories.length > 0 && safeCategories.every(c => safeSelectedIds.has(c.id));
  const someSelected = safeSelectedIds.size > 0 && !allSelected;

  const currentCategorie = useMemo(
    () => (openMenuId === null ? null : safeCategories.find(c => c.id === openMenuId) ?? null),
    [safeCategories, openMenuId]
  );

  const calculateMenuPosition = useCallback((button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
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

    return position;
  }, []);

  const toggleMenu = useCallback((id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    setMenuPosition(calculateMenuPosition(event.currentTarget));
    setOpenMenuId(id);
  }, [calculateMenuPosition, openMenuId]);

  useEffect(() => {
    if (openMenuId === null) return;
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const menu = document.getElementById('categorie-menu-portal');
      if (menu && !menu.contains(target)) setOpenMenuId(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpenMenuId(null); }
    };
    const handleScroll = () => setOpenMenuId(null);
    const handleResize = () => setOpenMenuId(null);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [openMenuId]);

  const handleMenuAction = useCallback((callback: () => void, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenMenuId(null);
    callback();
  }, []);

  // ⭐ Empty state
  if (safeCategories.length === 0) {
    return (
      <div className={`flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-14 text-center shadow-sm ${tableBackground} ${borderColor}`}>
        <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-slate-400">
          <FolderOpen size={30} strokeWidth={1.8} />
        </div>
        <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">Aucune catégorie</h3>
        <p className="mt-2 max-w-[390px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">
          Créez votre première catégorie pour organiser facilement vos produits.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          <Plus size={17} />
          Ajouter une catégorie
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-sm ${tableBackground} ${borderColor}`}>
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.06]' : 'border-brand-100 bg-brand-50'}`}>
          <span className="text-[14px] font-semibold text-brand-600 dark:text-brand-400">
            {safeSelectedIds.size} catégorie{safeSelectedIds.size > 1 ? 's' : ''} sélectionnée{safeSelectedIds.size > 1 ? 's' : ''}
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
                  ref={(element) => { if (element) element.indeterminate = someSelected; }}
                  onChange={(event) => onSelectAll?.(event.target.checked)}
                  aria-label="Sélectionner toutes les catégories"
                  className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500"
                />
              </th>
              <th scope="col" className={`w-[230px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Catégorie</th>
              <th scope="col" className={`w-[280px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Description</th>
              <th scope="col" className={`w-[140px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Produits</th>
              <th scope="col" className={`w-[120px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Créée le</th>
              <th scope="col" className={`w-[100px] border-b px-1.5 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {safeCategories.map((categorie, index) => {
              const nbProduits = safeNumber(categorie.produits_count);
              const isSelected = safeSelectedIds.has(categorie.id);
              const hasProducts = nbProduits > 0;
              const progressPercentage = Math.min(100, Math.round((nbProduits / stats.maxProduits) * 100));
              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow
                ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]'
                : '';

              return (
                <tr
                  key={categorie.id}
                  onClick={() => { setOpenMenuId(null); onView(categorie); }}
                  className={`group h-[58px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.08]' : 'bg-brand-50') : (isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50')} ${firstRowShadow}`}
                >
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) => onSelectOne?.(categorie.id, event.target.checked)}
                      aria-label={`Sélectionner ${categorie.nom}`}
                      className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500"
                    />
                  </td>

                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0 leading-tight">
                      <div title={categorie.nom} className="max-w-[210px] truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">
                        {categorie.nom}
                      </div>
                      <div className="mt-0.5 truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">
                        ID #{String(categorie.id).padStart(3, '0')}
                      </div>
                    </div>
                  </td>

                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span
                      title={categorie.description || 'Aucune description'}
                      className={`block max-w-[260px] truncate text-[14.5px] leading-[1.3] ${categorie.description ? 'text-slate-600 dark:text-slate-300' : 'italic text-slate-400 dark:text-slate-500'}`}
                    >
                      {categorie.description || 'Aucune description'}
                    </span>
                  </td>

                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[14.5px] font-bold ${hasProducts ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {nbProduits}
                        </span>
                        <span className="text-[13px] font-bold text-brand-500 dark:text-brand-400">
                          {progressPercentage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.10]">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[13.5px] font-medium text-slate-700 dark:text-slate-200">
                      {formatDate(categorie.created_at)}
                    </span>
                  </td>

                  <td className={`border-b px-1 py-2 text-right align-middle ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        title="Actions"
                        aria-label={`Actions pour ${categorie.nom}`}
                        aria-expanded={openMenuId === categorie.id}
                        onClick={(event) => toggleMenu(categorie.id, event)}
                        className={`flex h-7 w-7 items-center justify-center rounded border transition-all duration-150 ${
                          openMenuId === categorie.id
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

      {openMenuId !== null && currentCategorie && createPortal(
        <div
          id="categorie-menu-portal"
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
              <div className="max-w-[160px] truncate text-[14px] font-semibold text-slate-900 dark:text-slate-100">
                {currentCategorie.nom}
              </div>
              <div className="mt-0.5 font-mono text-[12px] text-slate-400">
                ID #{currentCategorie.id}
              </div>
            </div>
          </div>

          <div className="flex flex-col text-[14px] py-0.5">
            <MenuButton
              icon={<Eye size={15} strokeWidth={2.2} />}
              label="Voir les détails"
              tone="sky"
              onMouseDown={(event) => handleMenuAction(() => onView(currentCategorie), event)}
            />

            <MenuButton
              icon={<Pencil size={15} strokeWidth={2.2} />}
              label="Modifier"
              tone="amber"
              onMouseDown={(event) => handleMenuAction(() => onEdit(currentCategorie), event)}
            />

            <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`} />

            <MenuButton
              icon={<Trash2 size={15} strokeWidth={2.2} />}
              label="Supprimer"
              tone="danger"
              onMouseDown={(event) => handleMenuAction(() => onDelete(currentCategorie), event)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ⭐⭐⭐ FOOTER — BADGES COLORÉS + GLOBAL STATS ⭐⭐⭐ */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2.5 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">

          {/* ⭐ Nombre catégories (GLOBAL) */}
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {effectiveStats.total}
            </span>{' '}
            catégorie{effectiveStats.total > 1 ? 's' : ''}
            {hasActiveFilter && (
              <span className="ml-1 text-[12px] text-slate-400 dark:text-slate-500">(filtré)</span>
            )}
          </span>

          {/* ⭐ Total produits (sky) */}
          <span>
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              {effectiveStats.totalProduits.toLocaleString('fr-FR')}
            </span>{' '}
            produit{effectiveStats.totalProduits > 1 ? 's' : ''}
          </span>

          {/* ⭐ Valeur stock (emerald — vola miditra) */}
          {effectiveStats.valeurStock > 0 && (
            <span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {effectiveStats.valeurStock.toLocaleString('fr-FR')} Ar
              </span>{' '}
              Valeur stock
            </span>
          )}

          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />

          {/* ⭐ BADGES COLORÉS */}
          <div className="flex flex-wrap items-center gap-1.5">

            {/* ⭐ Avec description — Emerald */}
            {effectiveStats.avecDescription > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Avec description : {effectiveStats.avecDescription}
              </span>
            )}

            {/* ⭐ Sans description — Amber (raha > 0) */}
            {effectiveStats.sansDescription > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                Sans description : {effectiveStats.sansDescription}
              </span>
            )}

            {/* ⭐ Avec produits — Sky (raha tsy misy globalStats dia miseho) */}
            {!globalStats && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                Avec produits : {stats.categoriesAvecProduits}
              </span>
            )}

            {/* ⭐ Vides — Rose (raha > 0) */}
            {effectiveStats.categoriesVides > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                Vides : {effectiveStats.categoriesVides}
              </span>
            )}
          </div>
        </div>

        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
          Organisation des produits
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

export default CategoriesTable;