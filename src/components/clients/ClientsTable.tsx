// src/components/clients/ClientsTable.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: Footer misy badges colorés (emerald/indigo/sky/amber)
// ⭐ VAOVAO: `globalStats` prop + `hasActiveFilter`
// ⭐ VAOVAO: Total achats global ao amin'ny footer
// ⭐ FIX: Couleur de fond amin'ny ellipsis button rehefa dark mode

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Eye, ShoppingCart, Pencil, Trash2, Users, Plus } from 'lucide-react';

interface Client {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  image: string;
  type: 'Particulier' | 'Entreprise';
  created_at: string;
  total_achats?: number;
  nombre_commandes?: number;
}

// ⭐ VAOVAO: Stats global ho an'ny footer
interface GlobalStats {
  total: number;
  particuliers: number;
  entreprises: number;
  avecContact: number;
  totalAchats: number;
  totalCommandes: number;
}

interface ClientsTableProps {
  clients: Client[];
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onAdd: () => void;
  getTypeColor: (type: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
  onBulkUpdateType?: (ids: number[], newType: string) => void;
  // ⭐ VAOVAO
  globalStats?: GlobalStats;
  hasActiveFilter?: boolean;
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

const MENU_WIDTH = 220;
const MENU_HEIGHT = 220;
const MENU_PADDING = 10;

const safeNumber = (value: unknown, fallback = 0): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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

const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  onView,
  onEdit,
  onDelete,
  onAdd,
  getTypeColor,
  getTypeIcon,
  selectedIds = new Set<number>(),
  onSelectAll,
  onSelectOne,
  onBulkDelete,
  onBulkUpdateType,
  globalStats,
  hasActiveFilter = false,
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({});

  void getTypeIcon;

  const tableBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const tableSecondaryBackground = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorderColor = isDark ? 'border-white/[0.15]' : 'border-slate-200';

  const safeClients = useMemo(() => clients?.filter(Boolean) ?? [], [clients]);
  const safeSelectedIds = selectedIds || new Set<number>();

  // ⭐ Stats computed (fallback raha tsy misy globalStats)
  const localStats = useMemo(() => {
    const total = safeClients.length;
    const particuliers = safeClients.filter(c => c.type === 'Particulier').length;
    const entreprises = safeClients.filter(c => c.type === 'Entreprise').length;
    const totalAchats = safeClients.reduce((sum, c) => sum + safeNumber(c.total_achats), 0);
    const totalCommandes = safeClients.reduce((sum, c) => sum + safeNumber(c.nombre_commandes), 0);
    const avecContact = safeClients.filter(c => Boolean(c.email?.trim() || c.telephone?.trim())).length;
    return { total, particuliers, entreprises, totalAchats, totalCommandes, avecContact };
  }, [safeClients]);

  // ⭐ Stats effective : globalStats raha misy, raha tsy misy dia local
  const effectiveStats = useMemo(() => {
    if (!hasActiveFilter && globalStats && globalStats.total > 0) {
      return {
        total: Number(globalStats.total || 0),
        particuliers: Number(globalStats.particuliers || 0),
        entreprises: Number(globalStats.entreprises || 0),
        avecContact: Number(globalStats.avecContact || 0),
        totalAchats: Number(globalStats.totalAchats || 0),
        totalCommandes: Number(globalStats.totalCommandes || 0),
      };
    }
    return localStats;
  }, [globalStats, hasActiveFilter, localStats]);

  const allSelected = safeClients.length > 0 && safeClients.every(c => safeSelectedIds.has(c.id));
  const someSelected = safeClients.some(c => safeSelectedIds.has(c.id)) && !allSelected;

  const currentClient = useMemo(
    () => (openMenuId === null ? null : safeClients.find(item => item.id === openMenuId) ?? null),
    [safeClients, openMenuId]
  );

  useEffect(() => {
    if (openMenuId === null) return;
    const closeMenu = () => setOpenMenuId(null);
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', closeMenu);
    document.addEventListener('scroll', closeMenu, true);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', closeMenu);
      document.removeEventListener('scroll', closeMenu, true);
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

  const menuAction = useCallback((callback: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(null);
    callback();
  }, []);

  // ⭐ Empty state
  if (safeClients.length === 0) {
    return (
      <div className={`flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-14 text-center shadow-sm ${tableBackground} ${borderColor}`}>
        <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-slate-400">
          <Users size={30} strokeWidth={1.8} />
        </div>
        <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">Aucun client</h3>
        <p className="mt-2 max-w-[390px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">
          Aucun client ne correspond actuellement aux critères affichés.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          <Plus size={17} />
          Nouveau client
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-sm ${tableBackground} ${borderColor}`}>
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.06]' : 'border-brand-100 bg-brand-50'}`}>
          <span className="text-[14px] font-semibold text-brand-600 dark:text-brand-400">
            {safeSelectedIds.size} client{safeSelectedIds.size > 1 ? 's' : ''} sélectionné{safeSelectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onBulkUpdateType?.(Array.from(safeSelectedIds), 'Entreprise')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success-600 px-2.5 py-1.5 text-[14px] font-semibold text-white shadow-sm hover:bg-success-700"
            >
              Entreprise
            </button>
            <button
              type="button"
              onClick={() => onBulkUpdateType?.(Array.from(safeSelectedIds), 'Particulier')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-2.5 py-1.5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600"
            >
              Particulier
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
                <input type="checkbox" checked={allSelected} ref={input => { if (input) input.indeterminate = someSelected; }} onChange={e => onSelectAll?.(e.target.checked)} className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500" aria-label="Sélectionner tous les clients" />
              </th>
              <th scope="col" className={`w-[180px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Client</th>
              <th scope="col" className={`w-[180px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Contact</th>
              <th scope="col" className={`w-[110px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Type</th>
              <th scope="col" className={`w-[130px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Localisation</th>
              <th scope="col" className={`w-[120px] border-b px-1.5 py-2.5 text-right align-middle ${headerBorderColor}`}>Total achats</th>
              <th scope="col" className={`w-[90px] border-b px-1.5 py-2.5 text-right align-middle ${headerBorderColor}`}>Commandes</th>
              <th scope="col" className={`w-[54px] border-b px-1.5 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {safeClients.map((client, index) => {
              const isSelected = safeSelectedIds.has(client.id);
              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow
                ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]'
                : '';

              return (
                <tr key={client.id} onClick={() => { setOpenMenuId(null); onView(client); }} className={`group h-[58px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.08]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={e => onSelectOne?.(client.id, e.target.checked)} className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500" aria-label={`Sélectionner ${client.nom}`} />
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle text-left ${cellBorderColor}`}>
                    <div className="min-w-0 leading-tight">
                      <div title={client.nom} className="max-w-[160px] truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">
                        {client.nom || 'Client inconnu'}
                      </div>
                      <div className="mt-0.5 truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">
                        ID #{String(client.id).padStart(3, '0')}
                      </div>
                    </div>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {client.email && <span title={client.email} className="block max-w-[170px] truncate text-[14.5px] leading-[1.3] text-slate-700 dark:text-slate-300">{client.email}</span>}
                      {client.telephone && <span title={client.telephone} className="block max-w-[140px] truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">{client.telephone}</span>}
                      {!client.email && !client.telephone && <span className="text-[14.5px] italic leading-[1.3] text-slate-400 dark:text-slate-500">Aucun contact</span>}
                    </div>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[13px] font-semibold leading-tight ${getTypeColor(client.type)}`}>{client.type}</span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0 leading-tight">
                      <span title={client.ville || 'N/A'} className="block max-w-[120px] truncate text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">{client.ville || 'N/A'}</span>
                      {client.pays && <span title={client.pays} className="mt-0.5 block max-w-[100px] truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">{client.pays}</span>}
                    </div>
                  </td>
                  <td className={`border-b px-1.5 py-2 text-right align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-bold text-brand-600 dark:text-brand-400">{safeNumber(client.total_achats).toLocaleString('fr-FR')} Ar</span>
                  </td>
                  <td className={`border-b px-1.5 py-2 text-right align-middle ${cellBorderColor}`}>
                    <span className="inline-flex min-w-[30px] items-center justify-center rounded border border-brand-500/20 bg-brand-50 px-1.5 py-0.5 text-[13.5px] font-bold leading-tight text-brand-600 dark:border-brand-500/10 dark:bg-brand-500/10 dark:text-brand-400">{safeNumber(client.nombre_commandes)}</span>
                  </td>
                  <td className={`border-b px-1 py-2 align-middle text-right ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <button type="button" onClick={e => toggleMenu(client.id, e)} title="Plus d'actions" aria-label={`Actions pour ${client.nom}`} aria-expanded={openMenuId === client.id} className={`flex h-7 w-7 items-center justify-center rounded border transition-all duration-150 ${
                        openMenuId === client.id
                          ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400'
                          : 'border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-200 hover:text-brand-600 dark:border-white/[0.10] dark:bg-white/[0.06] dark:text-slate-300 dark:hover:border-white/[0.18] dark:hover:bg-white/[0.10] dark:hover:text-slate-100'
                      }`}>
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

      {openMenuId !== null && currentClient && createPortal(
        <div
          className={`fixed z-[99999] w-[230px] overflow-hidden rounded-xl border-[0.5px] py-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.35)] ${isDark ? 'border-white/[0.10] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}
          style={{ top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined, bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined, left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined, right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <div className={`border-b px-3 py-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
            <div className="min-w-0">
              <div className="max-w-[160px] truncate text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">{currentClient.nom}</div>
              <div className="mt-0.5 font-mono text-[12.5px] text-slate-400">ID #{currentClient.id}</div>
            </div>
          </div>

          <div className="flex flex-col text-[14.5px] py-0.5">
            <MenuButton
              icon={<Eye size={15} strokeWidth={2.2} />}
              label="Voir les détails"
              tone="sky"
              onMouseDown={e => menuAction(() => onView(currentClient), e)}
            />

            <MenuButton
              icon={<ShoppingCart size={15} strokeWidth={2.2} />}
              label="Voir les commandes"
              onMouseDown={e => menuAction(() => navigate(`/commandes?client=${currentClient.id}`), e)}
            />

            <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`} />

            <MenuButton
              icon={<Pencil size={15} strokeWidth={2.2} />}
              label="Modifier"
              tone="amber"
              onMouseDown={e => menuAction(() => onEdit(currentClient), e)}
            />

            <MenuButton
              icon={<Trash2 size={15} strokeWidth={2.2} />}
              label="Supprimer"
              tone="danger"
              onMouseDown={e => menuAction(() => onDelete(currentClient), e)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ⭐⭐⭐ FOOTER — BADGES COLORÉS + TOTAL ACHATS ⭐⭐⭐ */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2.5 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">

          {/* ⭐ Nombre de clients */}
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {effectiveStats.total}
            </span>{' '}
            client{effectiveStats.total > 1 ? 's' : ''}
            {hasActiveFilter && (
              <span className="ml-1 text-[12px] text-slate-400 dark:text-slate-500">(filtré)</span>
            )}
          </span>

          {/* ⭐ Total commandes (sky) */}
          <span>
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              {effectiveStats.totalCommandes.toLocaleString('fr-FR')}
            </span>{' '}
            commande{effectiveStats.totalCommandes > 1 ? 's' : ''}
          </span>

          {/* ⭐ Total achats (emerald — vola miditra) */}
          <span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {effectiveStats.totalAchats.toLocaleString('fr-FR')} Ar
            </span>{' '}
            Total achats
          </span>

          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />

          {/* ⭐ BADGES COLORÉS */}
          <div className="flex flex-wrap items-center gap-1.5">

            {/* ⭐ Particuliers — Emerald */}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Particulier : {effectiveStats.particuliers}
            </span>

            {/* ⭐ Entreprises — Indigo */}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
              Entreprise : {effectiveStats.entreprises}
            </span>

            {/* ⭐ Avec contact — Sky */}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
              Avec contact : {effectiveStats.avecContact}
            </span>

            {/* ⭐ Sans contact — Amber (raha > 0 ihany) */}
            {effectiveStats.total - effectiveStats.avecContact > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                Sans contact : {effectiveStats.total - effectiveStats.avecContact}
              </span>
            )}
          </div>
        </div>

        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
          Gestion des clients
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

export default ClientsTable;