// src/components/commandes/CommandesTable.tsx
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Commande } from '../../types/commandes';

interface CommandesTableProps {
  commandes: Commande[];
  loading?: boolean;
  totalItems?: number;
  generating: boolean;
  onView: (commande: Commande) => void;
  onGenerateFacture: (commande: Commande) => void;
  onDelete: (commande: Commande) => void;
  onAdd: () => void;
  clientImageUrls?: Record<number, string | null>;
  clientImageErrors?: Record<number, boolean>;
  handleClientImageError?: (id: number) => void;
  produitImageUrls?: Record<number, string | null>;
  produitImageErrors?: Record<number, boolean>;
  handleProduitImageError?: (id: number) => void;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
  onUpdatePaiement?: (id: number, data: { montant_paye: number; statut_paiement: string }) => void;
}

interface MenuPosition { top?: number; bottom?: number; left?: number; right?: number; }
interface ParsedProduct { nom: string; quantite: number; code?: string; image?: string; id?: number; }

const MENU_WIDTH = 220;
const MENU_HEIGHT = 220;
const MENU_PADDING = 10;

const normalizePaiementStatus = (statut: string): string => {
  const normalized = String(statut || '').trim().toLowerCase();
  switch (normalized) {
    case 'payé': case 'paye': case 'paid': case 'payee': case 'payé complet': case 'paye complet': return 'Payé';
    case 'partiel': case 'partial': case 'partielle': case 'partiellement payé': case 'partiellement paye': return 'Partiel';
    case 'non payé': case 'non paye': case 'unpaid': case 'non_payé': case 'non_paye': case 'impayé': case 'impaye': return 'Non payé';
    default: return 'Non payé';
  }
};

const parseProducts = (produits?: string): ParsedProduct[] => {
  if (!produits?.trim()) return [];
  return produits.split(',').map(v => v.trim()).filter(Boolean).map(item => {
    const match = item.match(/^(.*?)\s*\(x(\d+)\)\s*$/);
    if (!match) return { nom: item, quantite: 1 };
    return { nom: match[1].trim(), quantite: Number(match[2]) || 1 };
  });
};

const SkeletonRow = memo(({ isDark }: { isDark: boolean }) => {
  const skeleton = isDark ? 'animate-pulse rounded-sm bg-white/[0.07]' : 'animate-pulse rounded-sm bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-100';
  return (
    <tr className="h-[60px]">
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-4 w-4`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-5 w-20`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className="space-y-1.5"><div className={`${skeleton} h-4 w-28`} /><div className={`${skeleton} h-3 w-20`} /></div></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-4 w-32`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-5 w-20`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-5 w-24`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-5 w-20`} /></td>
      <td className={`border-b px-2 py-2 ${border}`}><div className={`${skeleton} h-5 w-20`} /></td>
      <td className={`border-b px-2 py-2 text-right ${border}`}><div className={`${skeleton} h-6 w-6 ml-auto`} /></td>
    </tr>
  );
});
SkeletonRow.displayName = 'SkeletonRow';

const CommandRow = memo(({ commande, isDark, isSelected, products, hiddenProducts, statutPaiement, onSelectOne, onView, onGenerateFacture, toggleMenu, openMenuId, cellBorderColor, getStatutPaiementStyle, firstRowShadow }: any) => {
  return (
    <tr onClick={() => onView(commande)} className={`group h-[60px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.08]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}>
      <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={isSelected} onChange={e => onSelectOne?.(commande.id, e.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label={`Sélectionner ${commande.numero}`} />
      </td>
      <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
        <span className="inline-flex max-w-[120px] truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[12.5px] font-semibold leading-tight text-brand-600 dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">{commande.numero}</span>
      </td>
      <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
        <div className="min-w-0 leading-tight">
          <div className="max-w-[150px] truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">{commande.client_nom || 'Client inconnu'}</div>
          {/* ⭐ FIX: Aseho ny téléphone raha misy */}
          {commande.client_telephone ? (
            <div className="mt-0.5 max-w-[130px] truncate text-[12.5px] text-slate-500 dark:text-slate-400">{commande.client_telephone}</div>
          ) : (
            <span className="mt-0.5 block text-[12.5px] text-slate-400">Aucun téléphone</span>
          )}
        </div>
      </td>
      <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
        <div className="flex min-w-0 max-w-[210px] items-center">
          {products.length === 0 ? <span className="text-[14.5px] text-slate-400">Aucun produit</span> : (
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="max-w-[170px] truncate text-[14.5px] font-medium text-slate-700 dark:text-slate-300" title={products.map(p => `${p.nom} (x${p.quantite})`).join(', ')}>{products.slice(0, 2).map(p => p.nom).join(', ')}</span>
              {hiddenProducts > 0 && <span className="inline-flex shrink-0 items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[12.5px] font-bold leading-tight text-brand-600 dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">+{hiddenProducts}</span>}
            </div>
          )}
        </div>
      </td>
      <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}><span className="whitespace-nowrap text-[14.5px] font-bold text-slate-900 dark:text-slate-100">{Number(commande.total_ttc || 0).toLocaleString('fr-FR')} Ar</span></td>
      <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}><span className="whitespace-nowrap text-[14.5px] font-semibold text-emerald-600 dark:text-emerald-400">{Number(commande.montant_paye || 0).toLocaleString('fr-FR')} Ar</span></td>
      <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}><span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[12.5px] font-semibold leading-tight ${getStatutPaiementStyle(statutPaiement)}`}>{statutPaiement}</span></td>
      <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}><span className="whitespace-nowrap text-[14.5px] font-bold text-brand-600 dark:text-brand-400">{Number(commande.montant_restant || 0).toLocaleString('fr-FR')} Ar</span></td>
      <td className={`border-b px-1.5 py-2 align-middle text-right ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-end">
          <button type="button" onClick={e => toggleMenu(commande.id, e)} title="Actions" aria-label={`Actions pour ${commande.numero}`} aria-expanded={openMenuId === commande.id} className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition-all duration-150 ${openMenuId === commande.id ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'hover:border-slate-200 hover:bg-slate-50 hover:text-brand-600 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}>
            <span className="font-bold tracking-widest">...</span>
          </button>
        </div>
      </td>
    </tr>
  );
});
CommandRow.displayName = 'CommandRow';

const CommandesTable: React.FC<CommandesTableProps> = ({
  commandes, loading = false, totalItems, generating,
  onView, onGenerateFacture, onDelete, onAdd,
  clientImageUrls = {}, clientImageErrors = {}, handleClientImageError,
  produitImageUrls = {}, produitImageErrors = {}, handleProduitImageError,
  selectedIds = new Set<number>(), onSelectAll, onSelectOne, onBulkDelete,
  onUpdatePaiement,
}) => {
  const { isDark } = useTheme();
  const tableBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const tableSecondaryBackground = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorderColor = isDark ? 'border-white/[0.15]' : 'border-slate-200';

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({});

  const safeSelectedIds = selectedIds || new Set<number>();
  const allSelected = commandes.length > 0 && commandes.every(c => safeSelectedIds.has(c.id));
  const someSelected = safeSelectedIds.size > 0 && !allSelected;

  const currentCommande = useMemo(() => (openMenuId === null ? null : commandes.find(c => c.id === openMenuId) ?? null), [commandes, openMenuId]);

  const stats = useMemo(() => {
    const total = totalItems ?? commandes.length;
    const nonPayees = commandes.filter(c => normalizePaiementStatus(c.statut_paiement) === 'Non payé').length;
    const partiel = commandes.filter(c => normalizePaiementStatus(c.statut_paiement) === 'Partiel').length;
    const payees = commandes.filter(c => normalizePaiementStatus(c.statut_paiement) === 'Payé').length;
    const totalMontant = commandes.reduce((sum, c) => sum + Number(c.total_ttc || 0), 0);
    const totalReste = commandes.reduce((sum, c) => sum + Number(c.montant_restant || 0), 0);
    const totalPaye = commandes.reduce((sum, c) => sum + Number(c.montant_paye || 0), 0);
    return { total, nonPayees, partiel, payees, totalMontant, totalReste, totalPaye };
  }, [commandes, totalItems]);

  const toggleMenu = useCallback((id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const position: MenuPosition = {};
    const below = vh - rect.bottom;
    const above = rect.top;
    if (below < MENU_HEIGHT + MENU_PADDING && above > MENU_HEIGHT + MENU_PADDING) {
      position.bottom = vh - rect.top + 4;
    } else {
      position.top = rect.bottom + 4;
    }
    const right = vw - rect.right;
    if (right < MENU_WIDTH + MENU_PADDING && rect.left > MENU_WIDTH + MENU_PADDING) {
      position.right = right + 4;
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

  const getStatutPaiementStyle = useCallback((statut: string) => {
    const normalized = normalizePaiementStatus(statut);
    switch (normalized) {
      case 'Payé': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25';
      case 'Partiel': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25';
      default: return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25';
    }
  }, []);

  useEffect(() => {
    if (openMenuId === null) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenMenuId(null); };
    const close = () => setOpenMenuId(null);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [openMenuId]);

  if (!loading && commandes.length === 0) {
    return (
      <div className={`flex min-h-[270px] flex-col items-center justify-center overflow-hidden rounded-xl border-[0.5px] px-6 py-10 text-center shadow-sm ${tableBackground} ${borderColor} dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)]`}>
        <h3 className="text-[15.5px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">Aucune commande trouvée</h3>
        <p className="mt-2 max-w-[390px] text-[14.5px] leading-6 text-slate-500 dark:text-slate-400">Aucune commande ne correspond aux critères actuels.</p>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onAdd} className="rounded-lg bg-brand-500 px-5 py-2.5 text-[14.5px] font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.98]">Nouvelle commande</button>
        
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)] ${tableBackground} ${borderColor}`}>
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.065]' : 'border-slate-200 bg-brand-50/50'}`}>
          <span className="text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">{safeSelectedIds.size} commande{safeSelectedIds.size > 1 ? 's' : ''} sélectionnée{safeSelectedIds.size > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => onBulkDelete?.([...safeSelectedIds])} className="rounded-lg bg-red-500 px-2.5 py-1.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-red-600">Supprimer</button>
            <button type="button" onClick={() => onSelectAll?.(false)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13.5px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-700">Désélectionner</button>
          </div>
        </div>
      )}

      <div className="custom-scrollbar scrollbar-gutter-stable overflow-x-auto overflow-y-auto">
        <table className={`w-full min-w-[950px] table-fixed border-collapse text-left ${borderColor}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400">
              <th className={`w-[40px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>
                <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected; }} onChange={e => onSelectAll?.(e.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label="Sélectionner toutes les commandes" />
              </th>
              <th className={`w-[130px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>N° Commande</th>
              <th className={`w-[170px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Client</th>
              <th className={`w-[190px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Produits</th>
              <th className={`w-[130px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Total TTC</th>
              <th className={`w-[140px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Montant Payé</th>
              <th className={`w-[110px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Statut</th>
              <th className={`w-[130px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Reste</th>
              <th className={`w-[70px] border-b px-2 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {loading
              ? Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} isDark={isDark} />)
              : commandes.map((commande, index) => {
                  const products = parseProducts(commande.produits_noms);
                  const hiddenProducts = Math.max(0, products.length - 2);
                  const statutPaiement = normalizePaiementStatus(commande.statut_paiement);
                  const isFirstRow = index === 0;
                  const firstRowShadow = isFirstRow
                    ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]'
                    : '';
                  return (
                    <CommandRow key={commande.id} commande={commande} isDark={isDark} isSelected={safeSelectedIds.has(commande.id)} products={products} hiddenProducts={hiddenProducts} statutPaiement={statutPaiement} onSelectOne={onSelectOne} onView={onView} onGenerateFacture={onGenerateFacture} toggleMenu={toggleMenu} openMenuId={openMenuId} cellBorderColor={cellBorderColor} getStatutPaiementStyle={getStatutPaiementStyle} firstRowShadow={firstRowShadow} />
                  );
                })}
          </tbody>
        </table>
      </div>

      {openMenuId !== null && currentCommande && createPortal(
        <div className={`fixed z-[99999] w-[220px] overflow-hidden rounded-xl border-[0.5px] py-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-2xl ${isDark ? 'border-white/[0.10] bg-[#0F172A]/98' : 'border-slate-200 bg-white/98'}`} style={{ top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined, bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined, left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined, right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined }} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
          <div className={`border-b px-3 py-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
            <div className="min-w-0">
              <div className="max-w-[160px] truncate text-[14px] font-semibold text-slate-900 dark:text-slate-100">{currentCommande.numero}</div>
              <div className="mt-0.5 font-mono text-[11px] text-slate-400">ID #{currentCommande.id}</div>
            </div>
          </div>
          <div className="flex flex-col text-[14.5px]">
            {normalizePaiementStatus(currentCommande.statut_paiement) !== 'Payé' && (
              <button type="button" onMouseDown={e => handleMenuAction(() => onUpdatePaiement?.(currentCommande.id, { montant_paye: currentCommande.total_ttc, statut_paiement: 'Payé' }), e)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-500/10">Marquer comme payée</button>
            )}
            <button type="button" onMouseDown={e => handleMenuAction(() => onGenerateFacture(currentCommande), e)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-500/10">Générer le ticket</button>
            <button type="button" onMouseDown={e => handleMenuAction(() => onView(currentCommande), e)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-brand-500/10">Voir les détails</button>
            <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`} />
            <button type="button" onMouseDown={e => handleMenuAction(() => onDelete(currentCommande), e)} className="flex w-full items-center px-3 py-2 text-left font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">Supprimer</button>
          </div>
        </div>,
        document.body
      )}

      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3.5 py-2 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.total}</span> commande{stats.total > 1 ? 's' : ''}</span>
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.totalMontant.toLocaleString('fr-FR')} Ar</span> Total</span>
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.totalPaye.toLocaleString('fr-FR')} Ar</span> Payé</span>
          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />
          <div className="flex items-center gap-1.5">
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">Payé : {stats.payees}</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">Partiel : {stats.partiel}</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">Non payé : {stats.nonPayees}</span>
          </div>
        </div>
        <span className="text-[12.5px] font-medium text-slate-400 dark:text-slate-500">Gestion des commandes</span>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4F46E5; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338CA; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #4F46E5 transparent; }
        .scrollbar-gutter-stable { scrollbar-gutter: stable; }
        @keyframes rowIn { from { opacity: 0; } to { opacity: 1; } }
        .group { animation: rowIn 0.12s ease-out; }
      `}</style>
    </div>
  );
};

export default memo(CommandesTable);