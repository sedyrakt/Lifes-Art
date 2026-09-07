import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckSquare, Download, Eye, MoreVertical, Plus, TextSelection, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface VentesTableProps {
  data: any[];
  type: 'devis' | 'factures';
  loading?: boolean;
  totalItems?: number;
  onView: (item: any) => void;
  onDelete: (item: any) => void;
  onAdd: () => void;
  onConvertDevisToFacture?: (devis: any) => void;
  onDownloadFacture?: (facture: any) => void;
  onDownloadDevisPDF?: (devis: any) => void;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
  onUpdatePaiement?: (id: number, data: { type: 'devis' | 'factures'; montant_paye: number; statut_paiement: string }) => void;
}

interface MenuPosition { top?: number; bottom?: number; left?: number; right?: number; }

const MENU_WIDTH = 220;
const MENU_HEIGHT = 260;
const MENU_PADDING = 12;

const formatMoney = (value: any) => `${Number(value || 0).toLocaleString('fr-FR')} Ar`;

const formatDateOnly = (dateValue?: string) => {
  if (!dateValue) return '—';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return dateValue;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getPaiementBadge = (statutPaiement?: string) => {
  const normalized = String(statutPaiement || 'Non payé').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized === 'paye') return { bg: 'bg-success-50 dark:bg-success-500/10', text: 'text-success-700 dark:text-success-400', border: 'border-success-200 dark:border-success-500/20', label: 'Payé' };
  if (normalized === 'partiel') return { bg: 'bg-warning-50 dark:bg-warning-500/10', text: 'text-warning-700 dark:text-warning-400', border: 'border-warning-200 dark:border-warning-500/20', label: 'Partiel' };
  return { bg: 'bg-danger-50 dark:bg-danger-500/10', text: 'text-danger-700 dark:text-danger-400', border: 'border-danger-200 dark:border-danger-500/20', label: 'Non payé' };
};

const SkeletonRow = memo(({ isDark }: { isDark: boolean }) => {
  const skeleton = isDark ? 'animate-pulse rounded-md bg-white/[0.07]' : 'animate-pulse rounded-md bg-slate-200';
  const border = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  return (
    <tr className="h-[60px]">
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-4 w-4`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-6 w-24`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-4 w-32`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-4 w-24`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-4 w-24`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-4 w-24`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-6 w-20`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-4 w-24`} /></td>
      <td className={`border-b px-2 py-2 text-right ${border}`}><div className={`${skeleton} h-6 w-6 ml-auto`} /></td>
    </tr>
  );
});
SkeletonRow.displayName = 'SkeletonRow';

interface MenuButtonProps {
  icon?: React.ReactNode;
  label: string;
  tone?: 'default' | 'emerald' | 'danger';
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, label, tone = 'default', onMouseDown }) => {
  const toneClass = tone === 'emerald' ? 'text-slate-700 hover:bg-success-50 dark:text-slate-200 dark:hover:bg-success-500/10' :
    tone === 'danger' ? 'text-danger-500 hover:bg-danger-50 dark:text-danger-500 dark:hover:bg-danger-500/10' :
    'text-slate-700 hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-white/[.06]';
  const iconClass = tone === 'emerald' ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400' :
    tone === 'danger' ? 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500' :
    'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400';
  return (
    <button type="button" onMouseDown={onMouseDown} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-[14.5px] font-medium transition-colors ${toneClass}`}>
      {icon && <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${iconClass}`}>{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

const VentesTable: React.FC<VentesTableProps> = ({
  data = [], type, loading = false, totalItems, onView, onDelete, onAdd,
  onConvertDevisToFacture, onDownloadFacture, onDownloadDevisPDF,
  selectedIds = new Set<number>(), onSelectAll, onSelectOne, onBulkDelete,
  onUpdatePaiement
}) => {
  const { isDark } = useTheme();
  const bg = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const secondaryBg = isDark ? 'bg-[#0F172A]' : 'bg-brand-50/50';
  const border = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorder = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorder = isDark ? 'border-white/[0.15]' : 'border-slate-200';

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({});
  const safeSelectedIds = selectedIds || new Set<number>();

  const statusStats = useMemo(() => {
    let nonPayees = 0, payees = 0, partiel = 0, totalMontant = 0, totalReste = 0;
    for (const item of data) {
      const normalized = String(item?.statut_paiement || 'Non payé').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized === 'paye') payees++;
      else if (normalized === 'partiel') partiel++;
      else nonPayees++;
      totalMontant += Number(item?.total_ttc || 0);
      totalReste += Number(item?.montant_restant || 0);
    }
    return { nonPayees, payees, partiel, totalMontant, totalReste };
  }, [data]);

  const allSelected = data.length > 0 && data.every(item => safeSelectedIds.has(item.id));
  const someSelected = safeSelectedIds.size > 0 && !allSelected;

  useEffect(() => {
    if (openMenuId === null) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMenuId(null); };
    const resize = () => setOpenMenuId(null);
    const clickOutside = () => setOpenMenuId(null);
    document.addEventListener('keydown', esc);
    window.addEventListener('resize', resize);
    document.addEventListener('scroll', clickOutside, true);
    return () => {
      document.removeEventListener('keydown', esc);
      window.removeEventListener('resize', resize);
      document.removeEventListener('scroll', clickOutside, true);
    };
  }, [openMenuId]);

  const toggleMenu = useCallback((id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const position: MenuPosition = {};
    const below = vh - rect.bottom;
    const above = rect.top;
    if (below < MENU_HEIGHT + MENU_PADDING && above > MENU_HEIGHT + MENU_PADDING) position.bottom = vh - rect.top + 4;
    else position.top = rect.bottom + 4;
    const right = vw - rect.right;
    if (right < MENU_WIDTH + MENU_PADDING && rect.left > MENU_WIDTH + MENU_PADDING) position.right = vw - rect.right + 4;
    else position.left = Math.max(MENU_PADDING, rect.right - MENU_WIDTH);
    setMenuPosition(position);
    setOpenMenuId(id);
  }, [openMenuId]);

  const handleMenuAction = useCallback((callback: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(null);
    callback();
  }, []);

  const currentItem = useMemo(() => openMenuId === null ? null : data.find(item => item?.id === openMenuId) || null, [data, openMenuId]);

  if (!loading && !data.length) {
    return (
      <div className={`flex min-h-[270px] flex-col items-center justify-center overflow-hidden rounded-xl border-[0.5px] px-6 py-10 text-center shadow-sm ${bg} ${border} dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)]`}>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-600 shadow-sm dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">
          <Plus size={22} strokeWidth={1.8} />
        </div>
        <h3 className="text-[15.5px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">Aucun {type === 'devis' ? 'devis' : 'facture'} trouvé</h3>
        <p className="mt-2 max-w-[390px] text-[14.5px] leading-6 text-slate-500 dark:text-slate-400">
          Aucun {type === 'devis' ? 'devis' : 'facture'} ne correspond aux critères actuels.
        </p>
        <button type="button" onClick={onAdd} className="mt-6 rounded-lg bg-brand-500 px-5 py-2.5 text-[14.5px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.98]">
          Nouveau {type === 'devis' ? 'devis' : 'facture'}
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] dark:shadow-[0_14px_45px_rgba(0,0,0,0.20)] ${bg} ${border}`}>
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.06]' : 'border-slate-200 bg-brand-50'}`}>
          <span className="text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">
            {safeSelectedIds.size} {type === 'devis' ? 'devis' : 'facture'}{safeSelectedIds.size > 1 ? 's' : ''} sélectionné{safeSelectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => onBulkDelete?.(Array.from(safeSelectedIds))} className="rounded-lg bg-danger-500 px-2.5 py-1.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-danger-600 active:scale-[0.98]">
              Supprimer
            </button>
            <button type="button" onClick={() => onSelectAll?.(false)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13.5px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-800">
              Désélectionner
            </button>
          </div>
        </div>
      )}

      {/* ⭐ FIX: MITOVY AMIN'NY PRODUITS TABLE — overflow-hidden + min-w-full mba hanesorana ny scrollbar */}
      <div className="custom-scrollbar scrollbar-gutter-stable overflow-hidden" style={{ height: '600px', minHeight: '400px' }}>
        <table className={`w-full min-w-full table-fixed border-collapse text-left ${border}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400">
              <th className={`w-[40px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>
                <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected; }} onChange={e => onSelectAll?.(e.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label="Sélectionner tous les éléments" />
              </th>
              <th className={`w-[140px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Référence</th>
              <th className={`w-[180px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Client</th>
              <th className={`w-[120px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Date</th>
              <th className={`w-[110px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Total HT</th>
              <th className={`w-[120px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Total TTC</th>
              <th className={`w-[120px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Statut</th>
              <th className={`w-[120px] border-b px-2 py-2.5 align-middle ${headerBorder}`}>Reste</th>
              <th className={`w-[60px] border-b px-2 py-2.5 text-right align-middle ${headerBorder}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={bg}>
            {loading ? Array.from({ length: 7 }, (_, i) => <SkeletonRow key={i} isDark={isDark} />) : data.filter(Boolean).map((item, index) => {
              const selected = safeSelectedIds.has(item.id);
              const badge = getPaiementBadge(item.statut_paiement);
              const montantRestant = Number(item.montant_restant) || 0;
              const dateValue = item.date_devis || item.date_facture || item.created_at;
              
              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow
                ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]'
                : '';

              return (
                <tr key={item.id} onClick={() => { setOpenMenuId(null); onView(item); }} className={`group h-[60px] cursor-pointer transition-colors duration-150 ${selected ? (isDark ? 'bg-brand-500/[0.08]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected} onChange={e => onSelectOne?.(item.id, e.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label={`Sélectionner ${item.reference || item.id}`} />
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}>
                    <span className="inline-flex max-w-[110px] truncate rounded-md border border-brand-100 bg-brand-50 px-2 py-1 font-mono text-[12.5px] font-semibold leading-tight text-brand-600 dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">{item.reference || '—'}</span>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}>
                    <div className="min-w-0 leading-tight">
                      <div className="max-w-[160px] truncate text-[14.5px] font-semibold text-slate-900 group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400" title={item.client_nom || 'Client inconnu'}>{item.client_nom || 'Client inconnu'}</div>
                      <div className="mt-0.5 text-[12.5px] font-medium text-slate-500 dark:text-slate-400">ID #{String(item.id).padStart(3, '0')}</div>
                    </div>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}>
                    <span className="text-[14.5px] font-medium text-slate-700 dark:text-slate-300">{formatDateOnly(dateValue)}</span>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}><span className="whitespace-nowrap text-[14.5px] font-medium text-slate-700 dark:text-slate-300">{formatMoney(item.total_ht)}</span></td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}><span className="whitespace-nowrap text-[14.5px] font-bold text-slate-900 dark:text-slate-100">{formatMoney(item.total_ttc)}</span></td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}>
                    <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[12.5px] font-semibold leading-tight ${badge.bg} ${badge.text} ${badge.border}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorder}`}>
                    <span className={`whitespace-nowrap text-[14.5px] font-bold ${montantRestant > 0 ? 'text-brand-600 dark:text-brand-400' : 'text-success-600 dark:text-success-400'}`}>{formatMoney(montantRestant)}</span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle text-right ${cellBorder}`} onClick={e => e.stopPropagation()}>
                    <button type="button" title="Actions" aria-label={`Actions pour ${item.reference || item.id}`} aria-expanded={openMenuId === item.id} onClick={e => toggleMenu(item.id, e)} className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition-all duration-150 ${openMenuId === item.id ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'hover:border-slate-200 hover:bg-slate-50 hover:text-brand-600 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}>
                      <span className="font-bold tracking-widest">...</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openMenuId !== null && currentItem && createPortal(
        <div
          className={`fixed z-[99999] w-[220px] overflow-hidden rounded-lg border-[0.5px] py-1 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-2xl ${isDark ? 'border-white/[0.10] bg-[#0F172A]/98' : 'border-slate-200 bg-white/98'}`}
          style={{
            top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
            bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
            left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined,
            right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined
          }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <div className={`border-b px-3 py-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
            <div className="min-w-0">
              <div className="max-w-[165px] truncate text-[14px] font-semibold text-slate-900 dark:text-slate-100">{currentItem.reference || '—'}</div>
              <div className="mt-0.5 font-mono text-[11px] text-slate-400">ID #{currentItem.id}</div>
            </div>
          </div>
          <div className="flex flex-col text-[14.5px]">
            {String(currentItem.statut_paiement || '').toLowerCase() !== 'payé' && (
              <MenuButton icon={<CheckSquare size={14} />} label="Marquer comme payée" tone="emerald" onMouseDown={e => handleMenuAction(() => onUpdatePaiement?.(currentItem.id, { type, montant_paye: currentItem.total_ttc, statut_paiement: 'Payé' }), e)} />
            )}
            <MenuButton icon={<Eye size={14} />} label="Voir les détails" onMouseDown={e => handleMenuAction(() => onView(currentItem), e)} />
            {type === 'devis' && (
              <>
                <MenuButton icon={<Download size={14} />} label="Télécharger PDF" onMouseDown={e => handleMenuAction(() => onDownloadDevisPDF?.(currentItem), e)} />
                <MenuButton icon={<CheckSquare size={14} />} label="Convertir en facture" tone="emerald" onMouseDown={e => handleMenuAction(() => onConvertDevisToFacture?.(currentItem), e)} />
              </>
            )}
            {type === 'factures' && <MenuButton icon={<Download size={14} />} label="Télécharger PDF" onMouseDown={e => handleMenuAction(() => onDownloadFacture?.(currentItem), e)} />}
            <div className={`mx-3 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`} />
            <MenuButton icon={<Trash2 size={14} />} label="Supprimer" tone="danger" onMouseDown={e => handleMenuAction(() => onDelete(currentItem), e)} />
          </div>
        </div>,
        document.body
      )}

      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3.5 py-2 ${secondaryBg} ${border}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems ?? data.length}</span> {type === 'devis' ? 'devis' : 'facture'}{(totalItems ?? data.length) > 1 ? 's' : ''}</span>
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{formatMoney(statusStats.totalMontant)}</span> Total</span>
          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-success-500" /><span>Payé</span><span className="text-slate-400 dark:text-slate-500">{statusStats.payees}</span></span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-warning-500" /><span>Partiel</span><span className="text-slate-400 dark:text-slate-500">{statusStats.partiel}</span></span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-danger-500" /><span>Non payé</span><span className="text-slate-400 dark:text-slate-500">{statusStats.nonPayees}</span></span>
          </div>
        </div>
        <span className="text-[12.5px] font-medium text-slate-400 dark:text-slate-500">Gestion des {type === 'devis' ? 'devis' : 'factures'}</span>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar{width:6px;height:6px}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:#4F46E5;border-radius:999px}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#4338CA}
        .custom-scrollbar{scrollbar-width:thin;scrollbar-color:#4F46E5 transparent}
        .scrollbar-gutter-stable{scrollbar-gutter:stable}
        @keyframes rowIn{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:translateY(0)}}
        tbody tr{animation:rowIn .18s ease-out}
      `}</style>
    </div>
  );
};

export default memo(VentesTable);