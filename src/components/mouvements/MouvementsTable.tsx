
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface Mouvement {
  id: number;
  produit_id: number;
  produit_nom: string;
  produit_code: string;
  type_mouvement: string;
  quantite: number;
  ancien_stock: number;
  nouveau_stock: number;
  reference: string;
  observation: string;
  prix_unitaire: number;
  prix_achat?: number;
  prix_vente?: number;
  created_by: number;
  date_mouvement: string;
  created_at: string;
}

interface MouvementsTableProps {
  mouvements: Mouvement[];
  getTypeColor: (type: string) => string;
  getTypeIcon?: (type: string) => React.ReactNode; // non utilisé
  getTypeLabel: (type: string) => string;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
  onView?: (mouvement: Mouvement) => void;
  onEdit?: (mouvement: Mouvement) => void;
  onExport?: (mouvement: Mouvement) => void;
}

interface MenuPosition { top?: number; bottom?: number; left?: number; right?: number; }

const normalizeType = (type?: string) => (type || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
const formatNumber = (value: number) => Number(value || 0).toLocaleString('fr-FR');

const getEffectivePrice = (m: Mouvement): number => {
  const p = Number(m.prix_unitaire || 0);
  if (p > 0) return p;
  const achat = Number(m.prix_achat || 0);
  if (achat > 0) return achat;
  const vente = Number(m.prix_vente || 0);
  if (vente > 0) return vente;
  return 0;
};

const getEffectiveReference = (m: Mouvement): string => {
  if (m.reference && m.reference.trim() !== '') {
    const ref = m.reference.trim();
    if (ref.length > 12) {
      const type = normalizeType(m.type_mouvement);
      const prefix = type === 'ENTREE' ? 'ENT' : type === 'SORTIE' ? 'SOR' : 'MVT';
      const tail = ref.slice(-4);
      return `${prefix}-${tail}`;
    }
    return ref;
  }
  const type = normalizeType(m.type_mouvement);
  if (type === 'ENTREE') return 'ENT-AUTO';
  if (type === 'SORTIE') return 'SOR-AUTO';
  return 'MVT-AUTO';
};

const MouvementsTable: React.FC<MouvementsTableProps> = ({
  mouvements,
  getTypeColor,
  getTypeLabel,
  selectedIds = new Set<number>(),
  onSelectAll,
  onSelectOne,
  onBulkDelete,
  onView,
  onEdit,
  onExport,
}) => {
  const { isDark } = useTheme();


  const bg = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const secondaryBg = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';
  const border = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorder = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorder = isDark ? 'border-white/[0.15]' : 'border-slate-200';

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({});

  const safeMouvements = mouvements || [];
  const safeSelectedIds = selectedIds || new Set<number>();

  // Stats
  const stats = useMemo(() => {
    let entrees = 0, sorties = 0, ajustements = 0;
    safeMouvements.forEach((m) => {
      const type = normalizeType(m.type_mouvement);
      if (type === 'ENTREE') entrees++;
      else if (type === 'SORTIE') sorties++;
      else ajustements++;
    });
    return { total: safeMouvements.length, entrees, sorties, ajustements };
  }, [safeMouvements]);

  const allSelected = safeMouvements.length > 0 && safeMouvements.every((m) => safeSelectedIds.has(m.id));
  const someSelected = safeMouvements.length > 0 && safeMouvements.some((m) => safeSelectedIds.has(m.id)) && !allSelected;

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  useEffect(() => {
    if (openMenuId === null) return;
    const outside = () => closeMenu();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', key);
    };
  }, [openMenuId, closeMenu]);

  const toggleMenu = useCallback((id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (openMenuId === id) { closeMenu(); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const W = 205, H = 180, P = 12;
    const vw = window.innerWidth, vh = window.innerHeight;
    const pos: MenuPosition = {};
    const below = vh - r.bottom, above = r.top;
    if (below < H + P && above > H) pos.bottom = vh - r.top + 4;
    else pos.top = r.bottom + 4;
    const right = vw - r.right;
    if (right < W + P && r.left > W) pos.right = vw - r.right + 4;
    else pos.left = Math.max(P, r.right - W);
    setMenuPosition(pos);
    setOpenMenuId(id);
  }, [openMenuId, closeMenu]);

  const menuAction = useCallback((callback: () => void, e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    callback();
  }, [closeMenu]);

  if (safeMouvements.length === 0) {
    return (
      <div className={`flex min-h-[270px] flex-col items-center justify-center overflow-hidden rounded-xl border-[0.5px] px-6 py-10 text-center shadow-sm ${bg} ${border} dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)]`}>
        <h3 className="text-[15.5px] font-semibold text-slate-900 dark:text-slate-100">Aucun mouvement</h3>
        <p className="mt-2 max-w-[390px] text-[14.5px] leading-6 text-slate-500 dark:text-slate-400">Aucun mouvement de stock n'a été enregistré pour le moment.</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)] ${bg} ${border}`}>

      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.065]' : 'border-slate-200 bg-brand-50'}`}>
          <span className="text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">
            {safeSelectedIds.size} mouvement{safeSelectedIds.size > 1 ? 's' : ''} sélectionné{safeSelectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onBulkDelete?.(Array.from(safeSelectedIds))}
              className="rounded-lg bg-danger-500 px-2.5 py-1.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-danger-600 active:scale-[0.98]"
            >
              Supprimer
            </button>
            <button
              type="button"
              onClick={() => onSelectAll?.(false)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13.5px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      <div className="custom-scrollbar overflow-x-auto overflow-y-auto scrollbar-gutter-stable">
        <table className={`w-full min-w-[900px] table-fixed border-collapse text-left ${border}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50'}`}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400">
              <th className={`w-[40px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>
                <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected; }} onChange={e => onSelectAll?.(e.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label="Sélectionner tous les mouvements" />
              </th>
              <th className={`w-[180px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Produit</th>
              <th className={`w-[110px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Type</th>
              <th className={`w-[90px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Quantité</th>
              <th className={`w-[120px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Prix unitaire</th>
              <th className={`w-[140px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Stock</th>
              <th className={`w-[130px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Référence</th>
              <th className={`w-[60px] border-b px-2 py-2.5 text-right align-middle ${headerBorder}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={bg}>
            {safeMouvements.map((m, index) => {
              const type = normalizeType(m.type_mouvement);
              const isEntree = type === 'ENTREE';
              const isSortie = type === 'SORTIE';
              const selected = safeSelectedIds.has(m.id);
              const price = getEffectivePrice(m);
              const ancien = Number(m.ancien_stock) || 0;
              const nouveau = Number(m.nouveau_stock) || 0;
              const effectiveRef = getEffectiveReference(m);

              const quantityClass = isEntree
                ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/25'
                : isSortie
                  ? 'bg-danger-50 text-danger-600 border-danger-200 dark:bg-danger-500/10 dark:text-danger-400 dark:border-danger-500/25'
                  : 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/25';

              const prefix = isEntree ? '+' : isSortie ? '-' : '±';

       
              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow
                ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]'
                : '';

              return (
                <tr
                  key={m.id}
                  onClick={() => onView?.(m)}
                  className={`group h-[60px] cursor-pointer transition-colors duration-150 ${selected ? (isDark ? 'bg-brand-500/[0.08]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}
                >
                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected} onChange={e => onSelectOne?.(m.id, e.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label={`Sélectionner ${m.produit_nom || 'ce mouvement'}`} />
                  </td>

                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}>
                    <div className="min-w-0 leading-tight">
                      <div title={m.produit_nom || 'Produit inconnu'} className="max-w-[150px] truncate text-[14.5px] font-semibold text-slate-900 group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">
                        {m.produit_nom || 'Produit inconnu'}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[12.5px] text-slate-500 dark:text-slate-400">
                        {m.produit_code || 'Sans code'}
                      </div>
                    </div>
                  </td>

                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}>
                    <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[12.5px] font-semibold leading-tight ${getTypeColor(m.type_mouvement)}`}>
                      {getTypeLabel(m.type_mouvement)}
                    </span>
                  </td>

                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}>
                    <span className={`inline-flex min-w-[40px] items-center justify-center rounded-md border px-1.5 py-0.5 text-[13.5px] font-semibold ${quantityClass}`}>
                      {prefix}{formatNumber(Number(m.quantite) || 0)}
                    </span>
                  </td>

                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">
                      {price > 0 ? `${Number(price).toLocaleString('fr-FR')} Ar` : '—'}
                    </span>
                  </td>

                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[12.5px] font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                        {formatNumber(ancien)}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">→</span>
                      <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[12.5px] font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                        {formatNumber(nouveau)}
                      </span>
                    </div>
                  </td>

                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}>
                    <span className="block max-w-[110px] truncate font-mono text-[12.5px] text-slate-500 dark:text-slate-400" title={effectiveRef}>
                      {effectiveRef}
                    </span>
                  </td>

                  <td className={`border-b px-1.5 py-2 align-middle text-right ${cellBorder}`} onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      title="Actions"
                      aria-label={`Actions pour ${m.produit_nom || 'ce mouvement'}`}
                      aria-expanded={openMenuId === m.id}
                      onClick={(e) => toggleMenu(m.id, e)}
                      className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition-all duration-150 ${openMenuId === m.id ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'hover:border-slate-200 hover:bg-slate-50 hover:text-brand-600 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}
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


      {openMenuId !== null && createPortal(
        <div
          className={`fixed z-[99999] w-[205px] overflow-hidden rounded-lg border-[0.5px] py-1 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-2xl ${isDark ? 'border-white/[0.10] bg-[#0F172A]/98' : 'border-slate-200 bg-white/98'}`}
          style={{
            top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
            bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
            left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined,
            right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined,
          }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          {(() => {
            const current = safeMouvements.find((m) => m.id === openMenuId);
            if (!current) return null;
            return (
              <div className="flex flex-col text-[14.5px]">
                <button type="button" onMouseDown={(e) => menuAction(() => onView?.(current), e)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
                  Voir les détails
                </button>
                <button type="button" onMouseDown={(e) => menuAction(() => onEdit?.(current), e)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
                  Modifier
                </button>
                <button type="button" onMouseDown={(e) => menuAction(() => onExport?.(current), e)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
                  Exporter
                </button>
                <div className={`mx-3 my-1 border-t ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`} />
                <button type="button" onMouseDown={(e) => menuAction(() => onBulkDelete?.([current.id]), e)} className="flex w-full items-center px-3 py-2 text-left font-semibold text-danger-500 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10">
                  Supprimer
                </button>
              </div>
            );
          })()}
        </div>,
        document.body
      )}

      {/* Footer */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3.5 py-2 ${secondaryBg} ${border}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.total}</span> mouvement{stats.total > 1 ? 's' : ''}</span>
          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-success-500" /><span>Entrée</span><span className="text-slate-400 dark:text-slate-500">{stats.entrees}</span></span>
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-danger-500" /><span>Sortie</span><span className="text-slate-400 dark:text-slate-500">{stats.sorties}</span></span>
          {stats.ajustements > 0 && (
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-warning-500" /><span>Ajustement</span><span className="text-slate-400 dark:text-slate-500">{stats.ajustements}</span></span>
          )}
        </div>
        <span className="text-[12.5px] font-medium text-slate-400 dark:text-slate-500">Gestion des mouvements</span>
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

export default MouvementsTable;