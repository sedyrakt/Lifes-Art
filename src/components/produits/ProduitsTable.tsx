// src/components/produits/ProduitsTable.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: Footer misy badges colorés (emerald/amber/rose/sky)
// ⭐ VAOVAO: `globalStats` prop + `hasActiveFilter`

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Pencil,
  Truck,
  Trash2,
  Package,
  Plus,
} from 'lucide-react';

interface Produit {
  id: number;
  code: string;
  nom: string;
  description?: string;
  categorie_nom?: string;
  fournisseur_id?: number;
  fournisseur_nom?: string;
  prix_achat: number;
  prix_vente: number;
  tva_rate?: number;
  quantite_stock: number;
  quantite_minimale: number;
  unite: string;
  image?: string;
  status: string;
  nb_commandes?: number;
}

// ⭐ VAOVAO: GlobalStats ho an'ny footer
interface GlobalStats {
  total: number;
  actifs: number;
  rupture: number;
  alerte: number;
  valeurTotale: number;
  totalStock?: number;
}

interface ProduitsTableProps {
  produits: Produit[];
  onView: (id: number) => void;
  onEdit: (produit: Produit) => void;
  onDelete: (produit: Produit) => void;
  onAdd: () => void;
  onNewCommande: (produit: Produit) => void;
  getStockLevel?: (stock: number, min: number) => { level: string; color: string; bg: string };
  getStatusColor?: (status: string) => string;
  getStatusIcon?: (status: string) => React.ReactNode;
  totalStats?: { total: number; rupture: number; alerte: number; valeur_totale: number };
  totalItems?: number;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
  onBulkUpdateStatus?: (ids: number[], newStatus: string) => void;
  // ⭐ VAOVAO
  globalStats?: GlobalStats;
  hasActiveFilter?: boolean;
}

const formatTva = (rate: number | undefined | null) => {
  if (rate === undefined || rate === null) return '0%';
  if (rate > 1) return `${rate}%`;
  return `${Math.round(rate * 100)}%`;
};

const SkeletonRow = memo(({ isDark }: { isDark: boolean }) => {
  const c = isDark ? 'animate-pulse rounded-sm bg-white/[0.07]' : 'animate-pulse rounded-sm bg-slate-200';
  const b = isDark ? 'border-white/[0.08]' : 'border-slate-100';
  return (
    <tr className="h-[58px]">
      <td className={`border-b px-1.5 py-2 align-middle ${b}`}><div className={`${c} h-4 w-4`} /></td>
      <td className={`border-b px-1.5 py-2 align-middle ${b}`}><div className={`${c} h-5 w-20`} /></td>
      <td className={`border-b pl-3 pr-1.5 py-2 align-middle ${b}`}><div className={`${c} h-5 w-28`} /></td>
      <td className={`border-b px-1.5 py-2 align-middle ${b}`}><div className={`${c} h-5 w-24`} /></td>
      <td className={`border-b px-1.5 py-2 align-middle ${b}`}><div className={`${c} h-5 w-10`} /></td>
      <td className={`border-b px-1.5 py-2 align-middle ${b}`}><div className={`${c} h-5 w-16`} /></td>
      <td className={`border-b px-1.5 py-2 align-middle ${b}`}><div className={`${c} h-5 w-10`} /></td>
      <td className={`border-b px-1.5 py-2 align-middle ${b}`}><div className={`${c} h-5 w-20`} /></td>
      <td className={`border-b px-1.5 py-2 align-middle ${b}`}><div className={`${c} h-5 w-16`} /></td>
      <td className={`border-b px-1 py-2 align-middle text-right ${b}`}><div className={`${c} h-7 w-7 ml-auto`} /></td>
    </tr>
  );
});
SkeletonRow.displayName = 'SkeletonRow';

const ProductRow = memo(({ produit, isDark, isSelected, stock, stockMin, prixAchat, prixVente, onSelectOne, onView, onEdit, onDelete, onNewCommande, toggleMenu, openMenuId, cellBorderColor, firstRowShadow }: any) => {
  const stockReference = Math.max(stockMin * 5, 1);
  const stockPercentage = Math.min(100, Math.max(0, (stock / stockReference) * 100));
  const isRupture = stock <= 0;
  const isAlert = !isRupture && stock <= stockMin;

  return (
    <tr
      onClick={() => onView(produit.id)}
      className={`group h-[58px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.085]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}
    >
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(event) => onSelectOne?.(produit.id, event.target.checked)}
          className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500"
          aria-label={`Sélectionner ${produit.nom}`}
        />
      </td>

      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span title={produit.code || 'Référence inconnue'} className="inline-flex max-w-[100px] truncate rounded border border-brand-500/20 bg-brand-50 px-1.5 py-0.5 font-mono text-[13px] font-semibold leading-tight text-brand-600 dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">
          {produit.code || '—'}
        </span>
      </td>

      <td className={`border-b pl-3 pr-1.5 py-2 align-middle ${cellBorderColor}`}>
        <div className="min-w-0 leading-tight">
          <div title={produit.nom} className="max-w-[200px] truncate text-[14.5px] font-semibold text-slate-900 group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">
            {produit.nom}
          </div>
          {produit.fournisseur_nom && (
            <div className="mt-0.5 max-w-[200px] truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">
              {produit.fournisseur_nom}
            </div>
          )}
        </div>
      </td>

      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        {produit.categorie_nom ? (
          <span className="inline-flex max-w-[120px] truncate rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[13.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-slate-300" title={produit.categorie_nom}>
            {produit.categorie_nom}
          </span>
        ) : (
          <span className="text-[13.5px] font-medium text-slate-600 dark:text-slate-500">Sans catégorie</span>
        )}
      </td>

      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span className="inline-flex min-w-[34px] items-center justify-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[13px] font-semibold leading-tight text-slate-700 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-slate-300">
          {formatTva(produit.tva_rate)}
        </span>
      </td>

      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-0.5">
            <span className={`text-[14.5px] font-bold ${isRupture ? 'text-danger-500 dark:text-danger-400' : isAlert ? 'text-warning-600 dark:text-warning-400' : 'text-slate-900 dark:text-slate-100'}`}>{stock}</span>
            <span className="ml-0.5 text-[13px] font-bold text-slate-900 dark:text-white">{produit.unite || 'p.'}</span>
          </div>
          <div className={`h-1.5 min-w-[30px] flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.10]`}>
            <div className={`h-full rounded-full transition-all duration-500 ${isRupture ? 'bg-danger-500' : isAlert ? 'bg-warning-500' : 'bg-success-500'}`} style={{ width: `${isRupture ? 100 : stockPercentage}%` }} />
          </div>
          <span className={`shrink-0 text-[12px] font-bold ${isRupture ? 'text-danger-500' : isAlert ? 'text-warning-500' : 'text-success-500'}`}>
            {isRupture ? 'Rupture' : isAlert ? 'Faible' : 'OK'}
          </span>
        </div>
      </td>

      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span className="inline-flex min-w-[34px] items-center justify-center rounded border border-brand-500/20 bg-brand-50 px-1.5 py-0.5 text-[13.5px] font-bold leading-tight text-brand-600 dark:border-brand-500/10 dark:bg-brand-500/10 dark:text-brand-400">
          {produit.nb_commandes ?? 0}
        </span>
      </td>

      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <div className="flex flex-col">
          <span className="whitespace-nowrap text-[14.5px] font-bold text-slate-900 dark:text-slate-100">{prixVente.toLocaleString('fr-FR')} Ar</span>
          <span className="mt-0.5 whitespace-nowrap text-[13px] text-slate-400 dark:text-slate-500">Achat · {prixAchat.toLocaleString('fr-FR')} Ar</span>
        </div>
      </td>

      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span className={`inline-flex items-center whitespace-nowrap rounded border px-1.5 py-0.5 text-[13px] font-semibold leading-tight ${produit.status === 'actif' ? 'border-success-200 bg-success-50 text-success-700 dark:border-success-500/25 dark:bg-success-500/10 dark:text-success-400' : 'border-danger-200 bg-danger-50 text-danger-700 dark:border-danger-500/25 dark:bg-danger-500/10 dark:text-danger-400'}`}>
          {produit.status === 'actif' ? 'Actif' : 'Inactif'}
        </span>
      </td>

      <td className={`border-b px-1 py-2 align-middle text-right ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          title="Plus d'actions"
          aria-label={`Actions pour ${produit.nom}`}
          aria-expanded={openMenuId === produit.id}
          onClick={(event) => toggleMenu(produit.id, event)}
          className={`flex h-7 w-7 items-center justify-center rounded border transition-all duration-150 ${
            openMenuId === produit.id
              ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400'
              : 'border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-200 hover:text-brand-600 dark:border-transparent dark:bg-transparent dark:text-slate-400 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span className="text-[14.5px] font-bold tracking-widest">...</span>
        </button>
      </td>
    </tr>
  );
});
ProductRow.displayName = 'ProductRow';

const ProduitsTable: React.FC<ProduitsTableProps> = ({
  produits, onView, onEdit, onDelete, onAdd, onNewCommande,
  getStatusColor, totalStats, totalItems,
  selectedIds = new Set<number>(),
  onSelectAll, onSelectOne, onBulkDelete, onBulkUpdateStatus,
  // ⭐ VAOVAO
  globalStats,
  hasActiveFilter = false,
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; left?: number; right?: number }>({});

  const tableBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const tableSecondaryBackground = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorderColor = isDark ? 'border-white/[0.15]' : 'border-slate-200';
  const safeSelectedIds = selectedIds || new Set<number>();

  const toggleMenu = useCallback((id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    const MENU_WIDTH = 220, MENU_HEIGHT = 180, PADDING = 12;
    const viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;
    const position: any = {};
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < MENU_HEIGHT + PADDING && spaceAbove > MENU_HEIGHT + PADDING) {
      position.bottom = viewportHeight - rect.top + 4;
    } else {
      position.top = rect.bottom + 4;
    }
    const spaceRight = viewportWidth - rect.right;
    if (spaceRight < MENU_WIDTH + PADDING && rect.left > MENU_WIDTH + PADDING) {
      position.right = viewportWidth - rect.right + 4;
    } else {
      position.left = Math.max(PADDING, rect.right - MENU_WIDTH);
    }
    setMenuPosition(position);
    setOpenMenuId(id);
  }, [openMenuId]);

  const handleMenuAction = useCallback((callback: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(null);
    callback();
  }, []);

  // ⭐ Local stats (fallback)
  const localStats = useMemo(() => {
    const total = produits.length;
    const rupture = produits.filter(p => Number(p.quantite_stock || 0) <= 0).length;
    const alerte = produits.filter(p => Number(p.quantite_stock || 0) > 0 && Number(p.quantite_stock || 0) <= Number(p.quantite_minimale || 0)).length;
    const valeurTotale = produits.reduce((acc, p) => acc + Number(p.prix_vente || 0) * Number(p.quantite_stock || 0), 0);
    const actifs = produits.filter(p => p.status?.toLowerCase() === 'actif').length;
    return { total, rupture, alerte, valeurTotale, actifs };
  }, [produits]);

  // ⭐⭐⭐ Effective stats — globalStats raha misy
  const stats = useMemo(() => {
    if (!hasActiveFilter && globalStats && globalStats.total > 0) {
      return {
        total: Number(globalStats.total) || 0,
        actifs: Number(globalStats.actifs) || 0,
        rupture: Number(globalStats.rupture) || 0,
        alerte: Number(globalStats.alerte) || 0,
        valeurTotale: Number(globalStats.valeurTotale) || 0,
      };
    }
    // Fallback : ampiasaina ny totalItems raha misy
    if (totalItems !== undefined && totalItems > 0) {
      return { ...localStats, total: totalItems };
    }
    return localStats;
  }, [globalStats, hasActiveFilter, localStats, totalItems]);

  const allSelected = produits.length > 0 && produits.every((p) => safeSelectedIds.has(p.id));
  const someSelected = safeSelectedIds.size > 0 && !allSelected;

  useEffect(() => {
    if (openMenuId === null) return;
    const handleClickOutside = () => setOpenMenuId(null);
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenMenuId(null); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleKeyDown); };
  }, [openMenuId]);

  // ⭐ Empty state
  if (produits.length === 0) {
    return (
      <div className={`flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-14 text-center shadow-sm ${tableBackground} ${borderColor}`}>
        <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-slate-400">
          <Package size={30} strokeWidth={1.8} />
        </div>
        <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">Aucun produit</h3>
        <p className="mt-2 max-w-[390px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">
          Commencez par créer votre premier produit pour gérer votre stock.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          <Plus size={17} />
          Ajouter un produit
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-sm ${tableBackground} ${borderColor}`}>
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.06]' : 'border-brand-100 bg-brand-50'}`}>
          <span className="text-[14px] font-semibold text-brand-600 dark:text-brand-400">
            {safeSelectedIds.size} produit{safeSelectedIds.size > 1 ? 's' : ''} sélectionné{safeSelectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onBulkUpdateStatus?.(Array.from(safeSelectedIds), 'actif')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success-600 px-2.5 py-1.5 text-[14px] font-semibold text-white shadow-sm hover:bg-success-700"
            >
              Activer
            </button>
            <button
              type="button"
              onClick={() => onBulkUpdateStatus?.(Array.from(safeSelectedIds), 'inactif')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-danger-500 px-2.5 py-1.5 text-[14px] font-semibold text-white shadow-sm hover:bg-danger-600"
            >
              Désactiver
            </button>
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
                <input type="checkbox" checked={allSelected} ref={(input) => { if (input) input.indeterminate = someSelected; }} onChange={(event) => onSelectAll?.(event.target.checked)} className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500" aria-label="Sélectionner tous les produits" />
              </th>
              <th scope="col" className={`w-[100px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Ref.</th>
              <th scope="col" className={`w-[170px] border-b pl-3 pr-1.5 py-2.5 align-middle ${headerBorderColor}`}>Désignation</th>
              <th scope="col" className={`w-[120px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Catégorie</th>
              <th scope="col" className={`w-[80px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>TVA</th>
              <th scope="col" className={`w-[120px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Stock</th>
              <th scope="col" className={`w-[60px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>CMD</th>
              <th scope="col" className={`w-[130px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Prix</th>
              <th scope="col" className={`w-[90px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Statut</th>
              <th scope="col" className={`w-[54px] border-b px-1.5 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {produits.filter(Boolean).map((produit, index) => {
              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow
                ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]'
                : '';

              return (
                <ProductRow
                  key={produit.id}
                  produit={produit}
                  isDark={isDark}
                  isSelected={safeSelectedIds.has(produit.id)}
                  stock={Number(produit.quantite_stock || 0)}
                  stockMin={Number(produit.quantite_minimale || 0)}
                  prixAchat={Number(produit.prix_achat || 0)}
                  prixVente={Number(produit.prix_vente || 0)}
                  onSelectOne={onSelectOne}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onNewCommande={onNewCommande}
                  toggleMenu={toggleMenu}
                  openMenuId={openMenuId}
                  cellBorderColor={cellBorderColor}
                  firstRowShadow={firstRowShadow}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {openMenuId !== null && createPortal(
        <div
          className={`fixed z-[99999] w-[230px] overflow-hidden rounded-xl border-[0.5px] py-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.35)] ${isDark ? 'border-white/[0.10] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}
          style={{
            top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
            bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
            left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined,
            right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined,
            maxHeight: 'calc(100vh - 20px)',
            overflowY: 'auto',
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {(() => {
            const currentProduct = produits.find((product) => product.id === openMenuId);
            if (!currentProduct) return null;
            return (
              <div className="flex flex-col text-[14.5px] py-0.5">
                <div className={`border-b px-3 py-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                  <div className="min-w-0">
                    <div className="max-w-[170px] truncate text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">{currentProduct.nom}</div>
                    <div className="mt-0.5 font-mono text-[12.5px] text-slate-400 dark:text-slate-500">{currentProduct.code || 'Sans référence'}</div>
                  </div>
                </div>

                <div className="py-0.5">
                  <button
                    type="button"
                    onMouseDown={(event) => handleMenuAction(() => onEdit(currentProduct), event)}
                    className="group flex w-full items-center gap-2.5 px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-amber-50 dark:text-slate-200 dark:hover:bg-amber-500/10"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 shrink-0">
                      <Pencil size={15} strokeWidth={2.2} />
                    </span>
                    <span>Modifier</span>
                  </button>

                  {currentProduct.fournisseur_id && (
                    <button
                      type="button"
                      onMouseDown={(event) => handleMenuAction(() => navigate(`/fournisseurs/${currentProduct.fournisseur_id}`), event)}
                      className="group flex w-full items-center gap-2.5 px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-sky-500/10"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400 shrink-0">
                        <Truck size={15} strokeWidth={2.2} />
                      </span>
                      <span>Voir fournisseur</span>
                    </button>
                  )}

                  <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`} />

                  <button
                    type="button"
                    onMouseDown={(event) => handleMenuAction(() => onDelete(currentProduct), event)}
                    className="group flex w-full items-center gap-2.5 px-3 py-2 text-left font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400 shrink-0">
                      <Trash2 size={15} strokeWidth={2.2} />
                    </span>
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>,
        document.body
      )}

      {/* ⭐⭐⭐ FOOTER — BADGES COLORÉS + GLOBAL STATS ⭐⭐⭐ */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2.5 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">

          {/* ⭐ Nombre de produits (GLOBAL) */}
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {stats.total}
            </span>{' '}
            produit{stats.total > 1 ? 's' : ''}
            {hasActiveFilter && (
              <span className="ml-1 text-[12px] text-slate-400 dark:text-slate-500">(filtré)</span>
            )}
          </span>

          {/* ⭐ Valeur stock (emerald — actif) */}
          <span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {stats.valeurTotale.toLocaleString('fr-FR')} Ar
            </span>{' '}
            Valeur stock
          </span>

          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />

          {/* ⭐ BADGES COLORÉS */}
          <div className="flex flex-wrap items-center gap-1.5">

            {/* ⭐ Actifs — Emerald */}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Actifs : {stats.actifs}
            </span>

            {/* ⭐ Rupture — Rose (raha > 0) */}
            {stats.rupture > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500 dark:bg-rose-400" />
                Rupture : {stats.rupture}
              </span>
            )}

            {/* ⭐ Alerte — Amber (raha > 0) */}
            {stats.alerte > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                Alerte : {stats.alerte}
              </span>
            )}
          </div>
        </div>

        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
          Gestion des produits
        </span>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4F46E5; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338CA; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #4F46E5 transparent; }
        .scrollbar-gutter-stable { scrollbar-gutter: stable; }
        @keyframes productRowIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        .group { animation: productRowIn 0.16s ease-out; }
      `}</style>
    </div>
  );
};

export default memo(ProduitsTable);