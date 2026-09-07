import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Edit, Trash2, Plus, MoreVertical } from 'lucide-react';
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
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

const MENU_WIDTH = 205;
const MENU_HEIGHT = 155;
const MENU_PADDING = 10;

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

  const totalMontant = useMemo(() => safeDepenses.reduce((sum, d) => sum + Number(d.montant || 0), 0), [safeDepenses]);

  const categorieStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    for (const d of safeDepenses) {
      const cat = d.categorie || 'Autre';
      if (!stats[cat]) stats[cat] = { count: 0, total: 0 };
      stats[cat].count++;
      stats[cat].total += Number(d.montant || 0);
    }
    return Object.entries(stats).sort(([, a], [, b]) => b.total - a.total).slice(0, 3);
  }, [safeDepenses]);

  const currentDepense = useMemo(() => (openMenuId === null ? null : safeDepenses.find(i => i.id === openMenuId) || null), [safeDepenses, openMenuId]);

  const formatDate = useCallback((date?: string) => {
    if (!date) return 'N/A';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, []);

  useEffect(() => {
    if (openMenuId === null) return;
    const close = () => setOpenMenuId(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
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

  if (safeDepenses.length === 0) {
    return (
      <div className={`flex min-h-[270px] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-10 text-center shadow-sm ${tableBackground} ${borderColor} dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)]`}>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-50 text-brand-600 shadow-sm dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">
          <Plus size={25} strokeWidth={1.7} />
        </div>
        <h3 className="text-[15.5px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">Aucune dépense</h3>
        <p className="mt-1.5 max-w-[360px] text-[14.5px] leading-5 text-slate-500 dark:text-slate-400">Commencez par enregistrer votre première dépense pour suivre vos finances.</p>
        <button type="button" onClick={onAdd} className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-[14.5px] font-semibold text-white shadow-[0_4px_14px_rgba(79,70,229,0.20)] transition-all duration-150 hover:bg-brand-600 hover:shadow-[0_6px_18px_rgba(79,70,229,0.25)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.98]">
          <Plus size={15} strokeWidth={2} />Ajouter une dépense
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-[0_2px_12px_rgba(15,23,42,0.04)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)] ${tableBackground} ${borderColor}`}>
      {selectedCount > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2.5 border-b px-3.5 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.065]' : 'border-slate-200 bg-brand-50/50'}`}>
          <span className="text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">
            {selectedCount} dépense{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => onBulkDelete?.(Array.from(safeSelectedIds))} className="inline-flex items-center rounded-md bg-danger-500 px-2.5 py-1.5 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-danger-600 active:scale-[0.98]">
              Supprimer
            </button>
            <button type="button" onClick={() => onSelectAll?.(false)} className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[13.5px] font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white">
              Désélectionner
            </button>
          </div>
        </div>
      )}

      <div className="custom-scrollbar overflow-x-auto overflow-y-auto scrollbar-gutter-stable">
        <table className={`w-full min-w-[880px] table-fixed border-collapse border text-left ${borderColor}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400">
              <th scope="col" className={`w-[40px] border px-2 py-2.5 align-middle ${headerBorderColor}`}>
                <input type="checkbox" checked={allSelected} ref={input => { if (input) input.indeterminate = someSelected; }} onChange={e => onSelectAll?.(e.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label="Sélectionner toutes les dépenses" />
              </th>
              <th scope="col" className={`w-[145px] border px-2 py-2.5 ${headerBorderColor}`}>Catégorie</th>
              <th scope="col" className={`w-[205px] border px-2 py-2.5 ${headerBorderColor}`}>Description</th>
              <th scope="col" className={`w-[105px] border px-2 py-2.5 ${headerBorderColor}`}>Date</th>
              <th scope="col" className={`w-[115px] border px-2 py-2.5 ${headerBorderColor}`}>Montant</th>
              <th scope="col" className={`w-[105px] border px-2 py-2.5 ${headerBorderColor}`}>Paiement</th>
              <th scope="col" className={`w-[145px] border px-2 py-2.5 ${headerBorderColor}`}>Fournisseur</th>
              <th scope="col" className={`w-[60px] border px-2 py-2.5 text-right ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {safeDepenses.map(depense => {
              const isSelected = safeSelectedIds.has(depense.id);
              return (
                <tr key={depense.id} onClick={() => { setOpenMenuId(null); onView(depense); }} className={`group h-[44px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.085]' : 'bg-brand-50/50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'}`}>
                  <td className={`border px-2 py-1.5 align-middle ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={e => onSelectOne?.(depense.id, e.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label={`Sélectionner ${depense.description || depense.categorie}`} />
                  </td>
                  <td className={`border px-2 py-1.5 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">{depense.categorie || 'Autre'}</div>
                      <div className="mt-0.5 text-[12.5px] font-medium text-slate-400 dark:text-slate-500">Dépense</div>
                    </div>
                  </td>
                  <td className={`border px-2 py-1.5 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-medium text-slate-800 transition-colors group-hover:text-brand-600 dark:text-slate-200 dark:group-hover:text-brand-400" title={depense.description || undefined}>{depense.description || 'Sans description'}</div>
                      {depense.reference && <div className="mt-0.5 truncate text-[12.5px] text-slate-400 dark:text-slate-500" title={depense.reference}>{depense.reference}</div>}
                    </div>
                  </td>
                  <td className={`border px-2 py-1.5 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-medium text-slate-700 dark:text-slate-300">{formatDate(depense.date_depense)}</span>
                  </td>
                  <td className={`border px-2 py-1.5 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">{Number(depense.montant || 0).toLocaleString('fr-FR')} Ar</span>
                  </td>
                  <td className={`border px-2 py-1.5 align-middle ${cellBorderColor}`}>
                    <span className="truncate text-[14.5px] font-medium text-slate-600 dark:text-slate-300">{depense.mode_paiement || 'N/A'}</span>
                  </td>
                  <td className={`border px-2 py-1.5 align-middle ${cellBorderColor}`}>
                    <span className="block max-w-[125px] truncate text-[14.5px] font-medium text-slate-600 dark:text-slate-300" title={depense.fournisseur_nom || undefined}>{depense.fournisseur_nom || 'Aucun fournisseur'}</span>
                  </td>
                  <td className={`border px-1.5 py-1.5 align-middle text-right ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <button type="button" onClick={e => toggleMenu(depense.id, e)} title="Actions" aria-label={`Actions pour ${depense.description || depense.categorie}`} aria-expanded={openMenuId === depense.id} className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition-all duration-150 ${openMenuId === depense.id ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'hover:border-slate-200 hover:bg-slate-50 hover:text-brand-600 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}>
                        <MoreVertical size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openMenuId !== null && currentDepense && createPortal(
        <div className={`fixed z-[99999] w-[205px] overflow-hidden rounded-lg border py-1 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-2xl ${isDark ? 'border-white/[0.10] bg-[#0F172A]/98' : 'border-slate-200 bg-white/98'}`} style={{ top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined, bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined, left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined, right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined }} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
          <div className="flex flex-col text-[14.5px]">
            <button type="button" onMouseDown={e => handleMenuAction(() => onView(currentDepense), e)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-slate-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-400">
              <Eye size={14} strokeWidth={1.8} className="mr-2.5 shrink-0 text-brand-600 dark:text-brand-400" />
              <span>Voir les détails</span>
            </button>
            <button type="button" onMouseDown={e => handleMenuAction(() => onEdit(currentDepense), e)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
              <Edit size={14} strokeWidth={1.8} className="mr-2.5 shrink-0 text-slate-500 dark:text-slate-400" />
              <span>Modifier</span>
            </button>
            <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`} />
            <button type="button" onMouseDown={e => handleMenuAction(() => onDelete(currentDepense.id), e)} className="flex w-full items-center px-3 py-2 text-left font-semibold text-danger-500 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10">
              <Trash2 size={14} strokeWidth={1.8} className="mr-2.5 shrink-0 text-danger-500" />
              <span>Supprimer</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3.5 py-2 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{safeDepenses.length}</span> dépense{safeDepenses.length > 1 ? 's' : ''}</span>
          <span className={`hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]`} />
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" /><span><span className="font-semibold text-slate-900 dark:text-slate-100">{totalMontant.toLocaleString('fr-FR')} Ar</span> Total</span></span>
          {categorieStats.length > 0 && (
            <>
              <span className={`hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]`} />
              <div className="flex flex-wrap items-center gap-1.5">
                {categorieStats.map(([category, categoryStat]) => (
                  <span key={category} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    <span className="max-w-[100px] truncate">{category}</span>
                    <span className="text-slate-400 dark:text-slate-500">{categoryStat.count}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        <span className="text-[12.5px] font-medium text-slate-400 dark:text-slate-500">Suivi des dépenses</span>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4F46E5; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338CA; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #4F46E5 transparent; }
        .scrollbar-gutter-stable { scrollbar-gutter: stable; }
        @keyframes depenseRowIn { from { opacity: 0; transform: translateY(1px); } to { opacity: 1; transform: translateY(0); } }
        .group { animation: depenseRowIn 0.16s ease-out; }
      `}</style>
    </div>
  );
};

export default React.memo(DepensesTable);