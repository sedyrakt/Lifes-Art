import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckSquare, Eye, Edit, MoreVertical, Plus, TextSelection, Trash2 } from 'lucide-react';
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
}

interface MenuPosition { top?: number; bottom?: number; left?: number; right?: number; }

const MENU_WIDTH = 195;
const MENU_HEIGHT = 180;
const MENU_PADDING = 10;

const SkeletonRow = memo(({ isDark }: { isDark: boolean }) => {
  const skeletonColor = isDark ? 'animate-pulse rounded-md bg-white/[0.07]' : 'animate-pulse rounded-md bg-slate-200';
  const borderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  return (
    <tr className="h-[60px]">
      <td className={`border-b px-2 py-2 align-middle ${borderColor}`}><div className={`${skeletonColor} h-4 w-4`} /></td>
      <td className={`border-b px-2 py-2 ${borderColor}`}><div className={`${skeletonColor} h-6 w-20`} /></td>
      <td className={`border-b px-2 py-2 ${borderColor}`}><div className="space-y-2"><div className={`${skeletonColor} h-4 w-32`} /><div className={`${skeletonColor} h-3 w-20`} /></div></td>
      <td className={`border-b px-2 py-2 ${borderColor}`}><div className={`${skeletonColor} h-4 w-24`} /></td>
      <td className={`border-b px-2 py-2 ${borderColor}`}><div className={`${skeletonColor} h-4 w-28`} /></td>
      <td className={`border-b px-2 py-2 ${borderColor}`}><div className={`${skeletonColor} h-6 w-12`} /></td>
      <td className={`border-b px-2 py-2 ${borderColor}`}><div className={`${skeletonColor} ml-auto h-4 w-28`} /></td>
      <td className={`border-b px-2 py-2 ${borderColor}`}><div className={`${skeletonColor} h-6 w-20`} /></td>
      <td className={`border-b px-2 py-2 ${borderColor}`}><div className={`${skeletonColor} ml-auto h-4 w-28`} /></td>
      <td className={`border-b px-2 py-2 ${borderColor}`}><div className={`${skeletonColor} h-6 w-6 ml-auto`} /></td>
    </tr>
  );
});
SkeletonRow.displayName = 'SkeletonRow';

const AchatsTable: React.FC<AchatsTableProps> = ({
  achats, loading = false, totalItems, onView, onEdit, onDelete, onAdd,
  selectedIds = new Set<number>(), onSelectAll, onSelectOne, onBulkDelete, onUpdatePaiement,
}) => {
  const { isDark } = useTheme();
  const tableBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const tableSecondaryBackground = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorderColor = isDark ? 'border-white/[0.15]' : 'border-slate-200';
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({});

  const statusStats = useMemo(() => {
    let totalProduits = 0, payees = 0, partiel = 0, nonPayees = 0;
    for (const achat of achats) {
      totalProduits += Number(achat.nombre_produits) || 0;
      const totalTTC = Number(achat.total_ttc) || 0;
      const paye = Number(achat.montant_paye) || 0;
      const statut = paye <= 0 ? 'Non payé' : paye >= totalTTC ? 'Payé' : 'Partiel';
      if (statut === 'Payé') payees++;
      else if (statut === 'Partiel') partiel++;
      else nonPayees++;
    }
    const totalMontant = achats.reduce((sum, achat) => sum + Number(achat.total_ttc || 0), 0);
    const totalReste = achats.reduce((sum, achat) => sum + Math.max(0, Number(achat.total_ttc || 0) - Number(achat.montant_paye || 0)), 0);
    return { totalProduits, payees, partiel, nonPayees, totalMontant, totalReste };
  }, [achats]);

  const safeSelectedIds = selectedIds || new Set<number>();
  const allSelected = achats.length > 0 && achats.every(achat => safeSelectedIds.has(achat.id));
  const someSelected = safeSelectedIds.size > 0 && !allSelected;

  useEffect(() => {
    if (openMenuId === null) return;
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenMenuId(null); };
    const handleResize = () => setOpenMenuId(null);
    const handleMouseDown = () => setOpenMenuId(null);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleMouseDown);
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
    } else { position.top = rect.bottom + 4; }
    const spaceRight = viewportWidth - rect.right;
    if (spaceRight < MENU_WIDTH + MENU_PADDING && rect.left > MENU_WIDTH + MENU_PADDING) {
      position.right = viewportWidth - rect.right + 4;
    } else { position.left = Math.max(MENU_PADDING, rect.right - MENU_WIDTH); }
    setMenuPosition(position);
    setOpenMenuId(id);
  }, [openMenuId]);

  const handleMenuAction = useCallback((callback: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(null);
    callback();
  }, []);

  const currentAchat = useMemo(() => (openMenuId === null ? null : achats.find(achat => achat.id === openMenuId) ?? null), [achats, openMenuId]);

  if (!loading && achats.length === 0) {
    return (
      <div className={`flex min-h-[270px] flex-col items-center justify-center overflow-hidden rounded-xl border-[0.5px] px-6 py-10 text-center shadow-sm ${tableBackground} ${borderColor} dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)]`}>
        <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-600 shadow-sm dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400"><Plus size={30} strokeWidth={1.8} /></div>
        <h3 className="text-[15.5px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">Aucun achat trouvé</h3>
        <p className="mt-2 max-w-[390px] text-[14.5px] leading-6 text-slate-500 dark:text-slate-400">Aucun achat ne correspond aux critères actuels.</p>
        <button type="button" onClick={onAdd} className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-5 py-2.5 text-[14.5px] font-semibold text-white shadow-[0_4px_14px_rgba(79,70,229,0.20)] transition-all duration-150 hover:bg-brand-600 hover:shadow-[0_6px_18px_rgba(79,70,229,0.25)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.98]"><Plus size={16} />Nouvel achat</button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-[0_2px_10px_rgba(15,23,42,0.035)] dark:shadow-[0_12px_38px_rgba(0,0,0,0.18)] ${tableBackground} ${borderColor}`}>
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.065]' : 'border-brand-100 bg-brand-50/40'}`}>
          <span className="text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">{safeSelectedIds.size} achat{safeSelectedIds.size > 1 ? 's' : ''} sélectionné{safeSelectedIds.size > 1 ? 's' : ''}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => onBulkDelete?.(Array.from(safeSelectedIds))} className="inline-flex items-center gap-1.5 rounded-lg bg-danger-500 px-2.5 py-1.5 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-danger-600 active:scale-[0.98]"><Trash2 size={14} />Supprimer</button>
            <button type="button" onClick={() => onSelectAll?.(false)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13.5px] font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"><TextSelection size={14} />Désélectionner</button>
          </div>
        </div>
      )}

      {/* ⭐ FIX: ESORINA NY HEIGHT RAIKITRA, AMPIASANA MAX-HEIGHT + OVERFLOW-X-HIDDEN */}
      <div className="custom-scrollbar scrollbar-gutter-stable overflow-x-hidden overflow-y-auto" style={{ maxHeight: '600px' }}>
        <table className={`w-full min-w-full table-fixed border-collapse text-left ${borderColor}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400">
              <th scope="col" className={`w-[40px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}><input type="checkbox" checked={allSelected} ref={element => { if (element) element.indeterminate = someSelected; }} onChange={event => onSelectAll?.(event.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label="Sélectionner tous les achats" /></th>
              <th scope="col" className={`w-[130px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Référence</th>
              <th scope="col" className={`w-[170px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Fournisseur</th>
              <th scope="col" className={`w-[120px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Date</th>
              <th scope="col" className={`w-[150px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Désignation</th>
              <th scope="col" className={`w-[90px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Produits</th>
              <th scope="col" className={`w-[130px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Total TTC</th>
              <th scope="col" className={`w-[110px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Statut</th>
              <th scope="col" className={`w-[130px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Reste</th>
              <th scope="col" className={`w-[60px] border-b px-2 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {loading ? Array.from({ length: 7 }).map((_, index) => <SkeletonRow key={index} isDark={isDark} />) : achats.map((achat, index) => {
              const isSelected = safeSelectedIds.has(achat.id);
              const calculatedTTC = Number(achat.total_ttc) || 0;
              const calculatedPaye = Number(achat.montant_paye) || 0;
              const montantRestant = Math.max(0, calculatedTTC - calculatedPaye);
              const statutPaiement = calculatedPaye <= 0 ? 'Non payé' : calculatedPaye >= calculatedTTC ? 'Payé' : 'Partiel';
              const statutColor = statutPaiement === 'Payé' ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/25' : statutPaiement === 'Partiel' ? 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-300 dark:border-warning-500/25' : 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-500/10 dark:text-danger-400 dark:border-danger-500/25';
              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]' : '';
              return (
                <tr key={achat.id} onClick={() => { setOpenMenuId(null); onView(achat); }} className={`group h-[60px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.08]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`} onClick={event => event.stopPropagation()}><input type="checkbox" checked={isSelected} onChange={event => onSelectOne?.(achat.id, event.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label={`Sélectionner ${achat.reference || achat.id}`} /></td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}><span title={achat.reference || '—'} className="inline-flex max-w-[120px] truncate rounded-md border border-brand-100 bg-brand-50 px-2 py-1 font-mono text-[12.5px] font-semibold leading-tight text-brand-600 dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">{achat.reference || '—'}</span></td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}><div className="min-w-0 leading-tight"><div title={achat.fournisseur_nom || 'Fournisseur inconnu'} className="max-w-[150px] truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">{achat.fournisseur_nom || 'Fournisseur inconnu'}</div><div className="mt-0.5 text-[12.5px] text-slate-500 dark:text-slate-400">ID #{String(achat.id).padStart(3, '0')}</div></div></td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>{achat.date_achat ? <span className="whitespace-nowrap text-[14.5px] font-medium text-slate-700 dark:text-slate-300">{new Date(achat.date_achat).toLocaleDateString('fr-FR')}</span> : <span className="text-[14.5px] text-slate-400 dark:text-slate-500">—</span>}</td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}><div className="min-w-0"><div title={achat.designation || '—'} className="max-w-[140px] truncate text-[14.5px] font-medium text-slate-700 dark:text-slate-300">{achat.designation || '—'}</div></div></td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}><span className="inline-flex min-w-[30px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[13.5px] font-semibold text-slate-700 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-slate-300">{Number(achat.nombre_produits || 0)}</span></td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}><span className="whitespace-nowrap text-[14.5px] font-bold text-slate-900 dark:text-slate-100">{calculatedTTC.toLocaleString('fr-FR')} Ar</span></td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}><span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[12.5px] font-semibold leading-tight ${statutColor}`}>{statutPaiement}</span></td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}><span className="whitespace-nowrap text-[14.5px] font-bold text-brand-600 dark:text-brand-400">{montantRestant.toLocaleString('fr-FR')} Ar</span></td>
                  <td className={`border-b px-1.5 py-2 align-middle text-right ${cellBorderColor}`} onClick={event => event.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <button type="button" onClick={event => toggleMenu(achat.id, event)} title="Actions" aria-label={`Actions pour ${achat.reference || achat.id}`} aria-expanded={openMenuId === achat.id} className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition-all duration-150 ${openMenuId === achat.id ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'hover:border-slate-200 hover:bg-slate-50 hover:text-brand-600 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}>
                        <span className="font-bold tracking-widest">...</span>
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
        <div className={`fixed z-[99999] w-[210px] overflow-hidden rounded-lg border-[0.5px] py-1 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-2xl ${isDark ? 'border-white/[0.10] bg-[#0F172A]/98' : 'border-slate-200 bg-white/98'}`} style={{ top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined, bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined, left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined, right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined }} onMouseDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
          <div className={`border-b px-3 py-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}><div className="min-w-0"><div className="max-w-[170px] truncate text-[14px] font-semibold text-slate-900 dark:text-slate-100">{currentAchat.reference || '—'}</div><div className="mt-1 font-mono text-[11px] text-slate-400">ID #{currentAchat.id}</div></div></div>
          <div className="flex flex-col text-[14.5px]">
            {currentAchat.statut_paiement !== 'Payé' && (
              <button type="button" onMouseDown={event => handleMenuAction(() => onUpdatePaiement?.(currentAchat.id, { statut_paiement: 'Payé', montant_paye: Number(currentAchat.total_ttc) || 0, montant_restant: 0 }), event)} className="flex w-full items-center gap-3 px-3 py-2 text-left font-medium text-success-700 transition-colors hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"><CheckSquare size={14} /></span><span>Marquer comme payée</span>
              </button>
            )}
            <button type="button" onMouseDown={event => handleMenuAction(() => onView(currentAchat), event)} className="flex w-full items-center gap-3 px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-slate-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-400">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><Eye size={14} /></span><span>Voir les détails</span>
            </button>
            <button type="button" onMouseDown={event => handleMenuAction(() => onEdit(currentAchat), event)} className="flex w-full items-center gap-3 px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:text-slate-200 dark:hover:bg-amber-500/10 dark:hover:text-amber-400">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><Edit size={14} /></span><span>Modifier</span>
            </button>
            <div className={`mx-3 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`} />
            <button type="button" onMouseDown={event => handleMenuAction(() => onDelete(currentAchat), event)} className="flex w-full items-center gap-3 px-3 py-2 text-left font-semibold text-danger-500 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:text-danger-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-300">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-danger-50 text-danger-500 dark:bg-danger-500/10 dark:text-danger-400"><Trash2 size={14} /></span><span>Supprimer</span>
            </button>
          </div>
        </div>, document.body
      )}

      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3.5 py-2 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems ?? achats.length}</span> achat{(totalItems ?? achats.length) > 1 ? 's' : ''}</span>
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{statusStats.totalMontant.toLocaleString('fr-FR')} Ar</span> Total</span>
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{statusStats.totalProduits}</span> produit{statusStats.totalProduits > 1 ? 's' : ''}</span>
          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-success-500" /><span>Payé</span><span className="text-slate-400 dark:text-slate-500">{statusStats.payees}</span></span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-warning-500" /><span>Partiel</span><span className="text-slate-400 dark:text-slate-500">{statusStats.partiel}</span></span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-danger-500" /><span>Non payé</span><span className="text-slate-400 dark:text-slate-500">{statusStats.nonPayees}</span></span>
          </div>
        </div>
        <span className="text-[12.5px] font-medium text-slate-400 dark:text-slate-500">Gestion des achats</span>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4F46E5; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338CA; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #4F46E5 transparent; }
        .scrollbar-gutter-stable { scrollbar-gutter: stable; }
        @keyframes achatRowIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        .group { animation: achatRowIn 0.16s ease-out; }
      `}</style>
    </div>
  );
};

export default memo(AchatsTable);