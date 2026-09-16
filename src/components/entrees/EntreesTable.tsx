// src/components/stock/EntreesTable.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur CommandesTable / ClientsTable / FournisseursTable / CategoriesTable / DepensesTable / AchatsTable / MouvementsTable / ProduitsTable / EmployesTable
// ⭐ FONT SIZE: header 12.5px, cells 14px, badges 13px, footer 13px
// ⭐ FIX: Couleur de fond amin'ny ellipsis button rehefa dark mode

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Entree } from './EntreesTypes';

interface EntreesTableProps {
  entrees: Entree[];
  selectedIds: Set<number>;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: number, checked: boolean) => void;
  onDelete: (id: number) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

interface MenuPosition { top?: number; bottom?: number; left?: number; right?: number; }

const EntreesTable: React.FC<EntreesTableProps> = ({
  entrees, selectedIds, onSelectAll, onSelectOne, onDelete, onBulkDelete, onClearSelection,
}) => {
  const { isDark } = useTheme();

  const tableBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const tableSecondaryBackground = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorderColor = isDark ? 'border-white/[0.15]' : 'border-slate-200';

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({});

  const safeEntrees = entrees || [];
  const safeSelectedIds = selectedIds || new Set<number>();
  const allSelected = safeEntrees.length > 0 && safeEntrees.every(item => safeSelectedIds.has(item.id));
  const someSelected = safeSelectedIds.size > 0 && !allSelected;

  const totalEntrees = safeEntrees.length;
  const totalQuantite = safeEntrees.reduce((sum, item) => sum + Number(item.quantite || 0), 0);
  const totalValeur = safeEntrees.reduce((sum, item) => sum + (Number(item.quantite || 0) * Number(item.prix_unitaire || 0)), 0);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenMenuId(null); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscape); };
  }, []);

  const toggleMenu = (id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    const MENU_WIDTH = 230, MENU_HEIGHT = 100, MENU_PADDING = 12;
    const vw = window.innerWidth, vh = window.innerHeight;
    const pos: MenuPosition = {};
    const spaceBelow = vh - rect.bottom, spaceAbove = rect.top;
    if (spaceBelow < MENU_HEIGHT + MENU_PADDING && spaceAbove > MENU_HEIGHT + MENU_PADDING) pos.bottom = vh - rect.top + 4;
    else pos.top = rect.bottom + 4;
    const spaceRight = vw - rect.right;
    if (spaceRight < MENU_WIDTH + MENU_PADDING && rect.left > MENU_WIDTH + MENU_PADDING) pos.right = vw - rect.right + 4;
    else pos.left = Math.max(MENU_PADDING, rect.right - MENU_WIDTH);
    setMenuPosition(pos); setOpenMenuId(id);
  };

  const handleMenuAction = (callback: () => void, event: React.MouseEvent) => {
    event.stopPropagation(); setOpenMenuId(null); callback();
  };

  const currentEntree = safeEntrees.find(item => item.id === openMenuId) || null;

  if (safeEntrees.length === 0) {
    return (
      <div className={`flex min-h-[270px] flex-col items-center justify-center overflow-hidden rounded-xl border-[0.5px] px-6 py-10 text-center shadow-sm ${tableBackground} ${borderColor} dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)]`}>
        {/* ⭐ Empty title : 16px */}
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">Aucune entrée</h3>
        {/* ⭐ Empty text : 14px */}
        <p className="mt-2 max-w-[390px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">Aucune entrée de stock n'a été enregistrée pour le moment.</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)] ${tableBackground} ${borderColor}`}>

      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.065]' : 'border-slate-200 bg-brand-50/50'}`}>
          {/* ⭐ Selection text : 14px → 14.5px */}
          <span className="text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">
            {safeSelectedIds.size} entrée{safeSelectedIds.size > 1 ? 's' : ''} sélectionnée{safeSelectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            {/* ⭐ Bulk delete : 14px → 14.5px */}
            <button type="button" onClick={onBulkDelete} className="rounded-lg bg-danger-500 px-2.5 py-1.5 text-[14.5px] font-semibold text-white shadow-sm transition hover:bg-danger-600 active:scale-[0.98]">
              Supprimer
            </button>
            {/* ⭐ Deselect : 14px → 14.5px */}
            <button type="button" onClick={onClearSelection} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[14.5px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-700">
              Désélectionner
            </button>
          </div>
        </div>
      )}

      <div className="custom-scrollbar overflow-x-auto overflow-y-auto scrollbar-gutter-stable">
        <table className={`w-full min-w-[850px] table-fixed border-collapse text-left ${borderColor}`}>

          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            {/* ⭐ Header : 12.5px, py-2.5 */}
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400">
              <th className={`w-[36px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>
                <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected; }} onChange={(e) => onSelectAll(e.target.checked)} className="h-[14px] w-[14px] cursor-pointer accent-brand-500" aria-label="Sélectionner toutes les entrées" />
              </th>
              <th className={`w-[120px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Référence</th>
              <th className={`w-[220px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Produit</th>
              <th className={`w-[90px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Quantité</th>
              <th className={`w-[150px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Prix unitaire (Ar)</th>
              <th className={`w-[54px] border-b px-1.5 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {safeEntrees.map((entree, index) => {
              const isSelected = safeSelectedIds.has(entree.id);
              const reference = entree.reference || `ENT-${String(entree.id).padStart(4, '0')}`;

              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow
                ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]'
                : '';

              return (
                /* ⭐ Row height : 58px, cell py-2 */
                <tr key={entree.id} className={`group h-[58px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.085]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={(e) => onSelectOne(entree.id, e.target.checked)} className="h-[14px] w-[14px] cursor-pointer accent-brand-500" aria-label={`Sélectionner ${reference}`} />
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    {/* ⭐ Reference badge : 13px → 13.5px */}
                    <span className="inline-flex max-w-[110px] truncate rounded border border-brand-100 bg-brand-50 px-1.5 py-0.5 font-mono text-[13.5px] font-semibold leading-tight text-brand-600 dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">{reference}</span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0 leading-tight">
                      {/* ⭐ Produit nom : 14px → 14.5px */}
                      <div className="max-w-[200px] truncate text-[14.5px] font-semibold text-slate-900 group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">{entree.produit_nom || 'Produit inconnu'}</div>
                      {/* ⭐ Produit code : 12.5px → 13px */}
                      {entree.produit_code && (
                        <div className="mt-0.5 font-mono text-[13px] text-slate-500 dark:text-slate-400">Code : {entree.produit_code}</div>
                      )}
                    </div>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    {/* ⭐ Quantity badge : 13.5px → 14px, min-w 44 */}
                    <span className="inline-flex min-w-[44px] items-center justify-center rounded border border-success-200 bg-success-50 px-1.5 py-0.5 text-[14px] font-semibold leading-tight text-success-700 dark:border-success-500/25 dark:bg-success-500/10 dark:text-success-400">
                      +{Number(entree.quantite).toLocaleString('fr-FR')}
                    </span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    {/* ⭐ Prix unitaire : 14px → 14.5px */}
                    <span className="whitespace-nowrap text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">{Number(entree.prix_unitaire || 0).toLocaleString('fr-FR')} Ar</span>
                  </td>
                  <td className={`border-b px-1 py-2 align-middle text-right ${cellBorderColor}`} onClick={(e) => e.stopPropagation()}>
                    {/* ⭐ Actions button : h-7 w-7, dark bg white/[0.06] */}
                    <button type="button" title="Actions" aria-label={`Actions pour ${reference}`} onClick={(e) => toggleMenu(entree.id, e)} className={`flex h-7 w-7 items-center justify-center rounded border transition-all duration-150 ${
                      openMenuId === entree.id
                        ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400'
                        : 'border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-200 hover:text-brand-600 dark:border-white/[0.10] dark:bg-white/[0.06] dark:text-slate-300 dark:hover:border-white/[0.18] dark:hover:bg-white/[0.10] dark:hover:text-slate-100'
                    }`}>
                      {/* ⭐ ... : 14px → 14.5px */}
                      <span className="text-[14.5px] font-bold tracking-widest">...</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openMenuId !== null && currentEntree && createPortal(
        <div
          /* ⭐ Portal width : 230px */
          className={`fixed z-[99999] w-[230px] overflow-hidden rounded-xl border-[0.5px] py-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.35)] ${isDark ? 'border-white/[0.10] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}
          style={{
            top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
            bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
            left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined,
            right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const current = safeEntrees.find(item => item.id === openMenuId);
            if (!current) return null;
            const reference = current.reference || `ENT-${String(current.id).padStart(4, '0')}`;
            return (
              /* ⭐ Menu text : 14px → 14.5px */
              <div className="flex flex-col text-[14.5px]">
                <div className={`border-b px-3 py-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                  <div className="min-w-0">
                    {/* ⭐ Menu title : 14px → 14.5px */}
                    <div className="max-w-[150px] truncate text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">{reference}</div>
                    {/* ⭐ Menu ID : 12px → 12.5px */}
                    <div className="mt-0.5 font-mono text-[12.5px] text-slate-400">ID #{current.id}</div>
                  </div>
                </div>

                <div className="py-0.5">
                  <button
                    type="button"
                    onMouseDown={(e) => handleMenuAction(() => onDelete(current.id), e)}
                    className="group flex w-full items-center gap-2.5 px-3 py-2 text-left font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    {/* ⭐ Icon container : h-7 w-7, icon 15 */}
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400 shrink-0">
                      <Trash2 size={15} strokeWidth={2.2} />
                    </span>
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>, document.body
      )}

      {/* ⭐ Footer : 13px → 13.5px */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{totalEntrees}</span> entrée{totalEntrees > 1 ? 's' : ''}</span>
          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{totalQuantite.toLocaleString('fr-FR')}</span> unités</span>
          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{totalValeur.toLocaleString('fr-FR')} Ar</span> Valeur totale</span>
        </div>
        {/* ⭐ Footer label : 12.5px → 13px */}
        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">Stock synchronisé</span>
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

export default EntreesTable;