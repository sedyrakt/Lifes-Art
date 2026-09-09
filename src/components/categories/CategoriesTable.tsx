import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface Categorie {
  id: number;
  nom: string;
  description?: string;
  created_at: string;
  produits_count?: number;
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
}

interface MenuPosition { top?: number; bottom?: number; left?: number; right?: number; }

const MENU_WIDTH = 220;
const MENU_HEIGHT = 180;
const MENU_PADDING = 10;

const CategoriesTable: React.FC<CategoriesTableProps> = ({
  categories, onView, onEdit, onDelete, onAdd,
  selectedIds = new Set<number>(),
  onSelectAll, onSelectOne, onBulkDelete,
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

  const stats = useMemo(() => {
    const totalCategories = safeCategories.length;
    const categoriesAvecProduits = safeCategories.filter(c => Number(c.produits_count || 0) > 0).length;
    const categoriesVides = safeCategories.filter(c => Number(c.produits_count || 0) === 0).length;
    const totalProduits = safeCategories.reduce((total, c) => total + Number(c.produits_count || 0), 0);
    const maxProduits = Math.max(1, ...safeCategories.map(c => Number(c.produits_count || 0)));
    return { totalCategories, categoriesAvecProduits, categoriesVides, totalProduits, maxProduits };
  }, [safeCategories]);

  const allSelected = safeCategories.length > 0 && safeCategories.every(c => safeSelectedIds.has(c.id));
  const someSelected = safeSelectedIds.size > 0 && !allSelected;

  useEffect(() => {
    if (openMenuId === null) return;
    const handleClickOutside = () => setOpenMenuId(null);
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenMenuId(null); };
    const handleResize = () => setOpenMenuId(null);
    const handleScroll = () => setOpenMenuId(null);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
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
    } else { position.top = rect.bottom + 4; }
    const spaceRight = viewportWidth - rect.right;
    if (spaceRight < MENU_WIDTH + MENU_PADDING && rect.left > MENU_WIDTH + MENU_PADDING) {
      position.right = spaceRight + 4;
    } else { position.left = Math.max(MENU_PADDING, rect.right - MENU_WIDTH); }
    setMenuPosition(position);
    setOpenMenuId(id);
  }, [openMenuId]);

  const handleMenuAction = useCallback((callback: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(null);
    callback();
  }, []);

  if (safeCategories.length === 0) {
    return (
      <div className={`flex min-h-[270px] flex-col items-center justify-center overflow-hidden rounded-xl border-[0.5px] px-6 py-10 text-center shadow-sm dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)] ${tableBackground} ${borderColor}`}>
        <h3 className="text-[15.5px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">Aucune catégorie</h3>
        <p className="mt-2 max-w-[390px] text-[14.5px] leading-6 text-slate-500 dark:text-slate-400">Créez votre première catégorie pour organiser facilement vos produits.</p>
        <button type="button" onClick={onAdd} className="mt-6 rounded-lg bg-brand-500 px-5 py-2.5 text-[14.5px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.98]">Ajouter une catégorie</button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)] ${tableBackground} ${borderColor}`}>
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.06]' : 'border-slate-200 bg-brand-50'}`}>
          <span className="text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">{safeSelectedIds.size} catégorie{safeSelectedIds.size > 1 ? 's' : ''} sélectionnée{safeSelectedIds.size > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => onBulkDelete?.(Array.from(safeSelectedIds))} className="rounded-lg bg-danger-500 px-2.5 py-1.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-danger-600 active:scale-[0.98]">Supprimer</button>
            <button type="button" onClick={() => onSelectAll?.(false)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13.5px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-800">Désélectionner</button>
          </div>
        </div>
      )}

      <div className="custom-scrollbar scrollbar-gutter-stable overflow-x-auto overflow-y-auto">
        <table className={`w-full min-w-[900px] table-fixed border-collapse text-left ${borderColor}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50'}`}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400">
              <th scope="col" className={`w-[40px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>
                <input type="checkbox" checked={allSelected} ref={(input) => { if (input) input.indeterminate = someSelected; }} onChange={(event) => onSelectAll?.(event.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label="Sélectionner toutes les catégories" />
              </th>
              <th scope="col" className={`w-[230px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Catégorie</th>
              <th scope="col" className={`w-[280px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Description</th>
              <th scope="col" className={`w-[140px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Produits</th>
              <th scope="col" className={`w-[130px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Créée le</th>
              <th scope="col" className={`w-[60px] border-b px-2 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {safeCategories.map((categorie, index) => {
              const nbProduits = Number(categorie.produits_count || 0);
              const isSelected = safeSelectedIds.has(categorie.id);
              const hasProducts = nbProduits > 0;
              const progressPercentage = Math.min(100, Math.round((nbProduits / stats.maxProduits) * 100));
              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]' : '';
              return (
                <tr key={categorie.id} onClick={() => { setOpenMenuId(null); onView(categorie); }} className={`group h-[60px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.085]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={(event) => onSelectOne?.(categorie.id, event.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label={`Sélectionner ${categorie.nom}`} />
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0 leading-tight">
                      <div title={categorie.nom} className="truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">{categorie.nom}</div>
                      <div className="mt-0.5 text-[12.5px] font-medium text-slate-500 dark:text-slate-400">ID #{String(categorie.id).padStart(3, '0')}</div>
                    </div>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <span title={categorie.description || 'Aucune description'} className={`block max-w-[260px] truncate text-[14.5px] leading-5 ${categorie.description ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>{categorie.description || 'Aucune description'}</span>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[14.5px] font-semibold ${hasProducts ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}`}>{nbProduits}</span>
                        <span className="text-[12.5px] font-bold text-brand-500 dark:text-brand-400">{progressPercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.10]">
                        <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[13.5px] font-medium text-slate-700 dark:text-slate-300">{new Date(categorie.created_at).toLocaleDateString('fr-FR')}</span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle text-right ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <button type="button" title="Plus d'actions" aria-label={`Actions pour ${categorie.nom}`} aria-expanded={openMenuId === categorie.id} onClick={(event) => toggleMenu(categorie.id, event)} className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition-all duration-150 ${openMenuId === categorie.id ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'hover:border-slate-200 hover:bg-slate-50 hover:text-brand-600 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}>
                      <span className="font-bold tracking-widest">...</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openMenuId !== null && createPortal(
        <div className={`fixed z-[99999] w-[220px] overflow-hidden rounded-lg border-[0.5px] py-1 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-2xl ${isDark ? 'border-white/[0.10] bg-[#0F172A]/98' : 'border-slate-200 bg-white/98'}`} style={{ top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined, bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined, left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined, right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined }} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
          {(() => {
            const currentCategorie = safeCategories.find(c => c.id === openMenuId);
            if (!currentCategorie) return null;
            return (
              <div className="flex flex-col text-[14.5px]">
                <div className={`border-b px-3 py-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                  <div className="min-w-0">
                    <div className="max-w-[165px] truncate text-[14px] font-semibold text-slate-900 dark:text-slate-100">{currentCategorie.nom}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">ID #{currentCategorie.id}</div>
                  </div>
                </div>
                <button type="button" onMouseDown={(event) => handleMenuAction(() => onEdit(currentCategorie), event)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">Modifier</button>
                <div className={`mx-3 my-1 border-t ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`} />
                <button type="button" onMouseDown={(event) => handleMenuAction(() => onDelete(currentCategorie), event)} className="flex w-full items-center px-3 py-2 text-left font-semibold text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-300">Supprimer</button>
              </div>
            );
          })()}
        </div>,
        document.body
      )}

      <div className={`flex flex-wrap items-center justify-between gap-2 border-t px-3.5 py-2 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.totalCategories}</span> catégorie{stats.totalCategories > 1 ? 's' : ''}</span>
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.totalProduits}</span> produit{stats.totalProduits > 1 ? 's' : ''}</span>
          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />
          <div className="flex items-center gap-1.5">
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">Avec produits : {stats.categoriesAvecProduits}</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">Vides : {stats.categoriesVides}</span>
          </div>
        </div>
        <span className="text-[12.5px] font-medium text-slate-400 dark:text-slate-500">Organisation des produits</span>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4F46E5; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338CA; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #4F46E5 transparent; }
        .scrollbar-gutter-stable { scrollbar-gutter: stable; }
        @keyframes categoryRowIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        .group { animation: categoryRowIn 0.16s ease-out; }
      `}</style>
    </div>
  );
};

export default CategoriesTable;