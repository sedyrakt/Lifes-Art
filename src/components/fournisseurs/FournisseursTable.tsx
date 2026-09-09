

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface Fournisseur {
  id: number;
  nom: string;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  created_at: string;
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
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

const MENU_WIDTH = 220;
const MENU_HEIGHT = 200;
const MENU_PADDING = 10;

const FournisseursTable: React.FC<FournisseursTableProps> = ({
  fournisseurs, onView, onEdit, onDelete, onAdd, isDark: isDarkProp,
  selectedIds = new Set<number>(),
  onSelectAll, onSelectOne, onBulkDelete
}) => {
  const { isDark: themeIsDark } = useTheme();
  const navigate = useNavigate();
  const isDark = isDarkProp !== undefined ? isDarkProp : themeIsDark;

  // ⭐ FIX: Bg = #0F172A + Border 0.5px
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
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  const toggleMenu = (id: number, event: React.MouseEvent<HTMLButtonElement>) => {
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
  };

  const handleMenuAction = (callback: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(null);
    callback();
  };

  const stats = useMemo(() => ({
    totalFournisseurs: fournisseurs.length,
    totalAvecContact: fournisseurs.filter((f) => Boolean(f.contact?.trim())).length,
    totalAvecTelephone: fournisseurs.filter((f) => Boolean(f.telephone?.trim())).length,
    totalAvecEmail: fournisseurs.filter((f) => Boolean(f.email?.trim())).length,
    totalAvecAdresse: fournisseurs.filter((f) => Boolean(f.adresse?.trim())).length,
  }), [fournisseurs]);

  const allSelected = fournisseurs.length > 0 && fournisseurs.every((f) => safeSelectedIds.has(f.id));
  const someSelected = safeSelectedIds.size > 0 && !allSelected;

  if (fournisseurs.length === 0) {
    return (
      <div className={`flex min-h-[270px] flex-col items-center justify-center overflow-hidden rounded-xl border-[0.5px] px-6 py-10 text-center shadow-sm ${tableBackground} ${borderColor} dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)]`}>
        <h3 className="text-[15.5px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">Aucun fournisseur</h3>
        <p className="mt-2 max-w-[390px] text-[14.5px] leading-6 text-slate-500 dark:text-slate-400">Commencez par créer votre premier fournisseur.</p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 rounded-lg bg-brand-500 px-5 py-2.5 text-[14.5px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.98]"
        >
          Ajouter un fournisseur
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)] ${tableBackground} ${borderColor}`}>
      {/* BULK ACTION BAR */}
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.065]' : 'border-slate-200 bg-brand-50/50'}`}>
          <span className="text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">
            {safeSelectedIds.size} fournisseur{safeSelectedIds.size > 1 ? 's' : ''} sélectionné{safeSelectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onBulkDelete?.(Array.from(safeSelectedIds))}
              className="rounded-lg bg-danger-500 px-2.5 py-1.5 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-danger-600 active:scale-[0.98]"
            >
              Supprimer
            </button>
            <button
              type="button"
              onClick={() => onSelectAll?.(false)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13.5px] font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      <div className="custom-scrollbar overflow-x-auto overflow-y-auto scrollbar-gutter-stable">
        <table className={`w-full min-w-[850px] table-fixed border-collapse text-left ${borderColor}`}>
  
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            <tr className="text-[13px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400">
              <th scope="col" className={`w-[40px] border px-2 py-2.5 align-middle ${headerBorderColor}`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => { if (input) input.indeterminate = someSelected; }}
                  onChange={(event) => onSelectAll?.(event.target.checked)}
                  className="h-[15px] w-[15px] cursor-pointer accent-brand-500"
                  aria-label="Sélectionner tous les fournisseurs"
                />
              </th>
              <th scope="col" className={`w-[180px] border px-2 py-2.5 align-middle ${headerBorderColor}`}>Fournisseur</th>
              <th scope="col" className={`w-[160px] border px-2 py-2.5 align-middle ${headerBorderColor}`}>Contact</th>
              <th scope="col" className={`w-[140px] border px-2 py-2.5 align-middle ${headerBorderColor}`}>Téléphone</th>
              <th scope="col" className={`w-[180px] border px-2 py-2.5 align-middle ${headerBorderColor}`}>Email</th>
              <th scope="col" className={`w-[110px] border px-2 py-2.5 align-middle ${headerBorderColor}`}>Créé le</th>
              <th scope="col" className={`w-[60px] border px-2 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
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
          
                  className={`group h-[60px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.085]' : 'bg-brand-50/50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}
                >
                  <td className={`border px-2 py-2 align-middle ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) => onSelectOne?.(fournisseur.id, event.target.checked)}
                      className="h-[15px] w-[15px] cursor-pointer accent-brand-500"
                      aria-label={`Sélectionner ${fournisseur.nom}`}
                    />
                  </td>

                  <td className={`border px-2 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0">
                      <div title={fournisseur.nom || 'Fournisseur inconnu'} className="truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">{fournisseur.nom || 'Fournisseur inconnu'}</div>
                      <div className="mt-0.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">ID #{String(fournisseur.id).padStart(3, '0')}</div>
                    </div>
                  </td>

                  <td className={`border px-2 py-2 align-middle ${cellBorderColor}`}>
                    <span title={fournisseur.contact || 'Aucun contact'} className={`block max-w-[150px] truncate text-[14.5px] ${hasContact ? 'font-medium text-slate-700 dark:text-slate-300' : 'italic text-slate-400 dark:text-slate-500'}`}>{fournisseur.contact || 'Aucun contact'}</span>
                  </td>

                  <td className={`border px-2 py-2 align-middle ${cellBorderColor}`}>
                    <span title={fournisseur.telephone || ''} className="block max-w-[130px] truncate text-[14.5px] text-slate-600 dark:text-slate-300">{fournisseur.telephone || '—'}</span>
                  </td>

                  <td className={`border px-2 py-2 align-middle ${cellBorderColor}`}>
                    <span title={fournisseur.email || ''} className="block max-w-[170px] truncate text-[14.5px] text-slate-600 dark:text-slate-300">{fournisseur.email || '—'}</span>
                  </td>

                  <td className={`border px-2 py-2 align-middle ${cellBorderColor}`}>
                    <span className="block max-w-[100px] truncate text-[14.5px] font-medium text-slate-700 dark:text-slate-300">{fournisseur.created_at ? new Date(fournisseur.created_at).toLocaleDateString('fr-FR') : '—'}</span>
                  </td>

                  <td className={`border px-1.5 py-2 align-middle text-right ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      aria-expanded={openMenuId === fournisseur.id}
                      onClick={(event) => toggleMenu(fournisseur.id, event)}
                      className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition-all duration-150 ${openMenuId === fournisseur.id ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'hover:border-slate-200 hover:bg-slate-50 hover:text-brand-600 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}
                    >
                      <span className="font-bold tracking-widest">...</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CONTEXT MENU */}
      {openMenuId !== null && createPortal(
        <div
          className={`fixed z-[99999] w-[220px] overflow-hidden rounded-lg border-[0.5px] py-1 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-2xl ${isDark ? 'border-white/[0.10] bg-[#0F172A]/98' : 'border-slate-200 bg-white/98'}`}
          style={{
            top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
            bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
            left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined,
            right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined,
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {(() => {
            const currentFournisseur = fournisseurs.find((f) => f.id === openMenuId);
            if (!currentFournisseur) return null;
            return (
              <div className="flex flex-col text-[14.5px]">
                <button type="button" onMouseDown={(event) => handleMenuAction(() => onView(currentFournisseur), event)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
                  Voir les détails
                </button>
                <button type="button" onMouseDown={(event) => handleMenuAction(() => navigate(`/produits?fournisseur=${currentFournisseur.id}`), event)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
                  Voir les produits
                </button>
                <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`} />
                <button type="button" onMouseDown={(event) => handleMenuAction(() => onEdit(currentFournisseur), event)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
                  Modifier
                </button>
                <button type="button" onMouseDown={(event) => handleMenuAction(() => onDelete(currentFournisseur), event)} className="flex w-full items-center px-3 py-2 text-left font-semibold text-danger-600 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:text-danger-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-300">
                  Supprimer
                </button>
              </div>
            );
          })()}
        </div>,
        document.body
      )}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3.5 py-2 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.totalFournisseurs}</span> fournisseur{stats.totalFournisseurs > 1 ? 's' : ''}
          </span>
          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[13px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">
              Contact : <span className="text-slate-400 dark:text-slate-500">{stats.totalAvecContact}</span>
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[13px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">
              Tél : <span className="text-slate-400 dark:text-slate-500">{stats.totalAvecTelephone}</span>
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[13px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">
              Email : <span className="text-slate-400 dark:text-slate-500">{stats.totalAvecEmail}</span>
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[13px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">
              Adresse : <span className="text-slate-400 dark:text-slate-500">{stats.totalAvecAdresse}</span>
            </span>
          </div>
        </div>
        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">Gestion des fournisseurs</span>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4F46E5; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338CA; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #4F46E5 transparent; }
        .scrollbar-gutter-stable { scrollbar-gutter: stable; }
        @keyframes rowIn { from { opacity: 0; transform: translateY(1px); } to { opacity: 1; transform: translateY(0); } }
        .group { animation: rowIn 0.16s ease-out; }
      `}</style>
    </div>
  );
};

export default FournisseursTable;