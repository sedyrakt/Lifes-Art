import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

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
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

const MENU_WIDTH = 195;
const MENU_HEIGHT = 185;
const MENU_PADDING = 10;

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

  const stats = useMemo(() => {
    const total = safeClients.length;
    const particuliers = safeClients.filter(c => c.type === 'Particulier').length;
    const entreprises = safeClients.filter(c => c.type === 'Entreprise').length;
    const totalAchats = safeClients.reduce((sum, c) => sum + Number(c.total_achats || 0), 0);
    const totalCommandes = safeClients.reduce((sum, c) => sum + Number(c.nombre_commandes || 0), 0);
    const avecContact = safeClients.filter(c => Boolean(c.email?.trim() || c.telephone?.trim())).length;
    const sansContact = total - avecContact;
    return { total, particuliers, entreprises, totalAchats, totalCommandes, avecContact, sansContact };
  }, [safeClients]);

  const allSelected = safeClients.length > 0 && safeClients.every(c => safeSelectedIds.has(c.id));
  const someSelected = safeClients.some(c => safeSelectedIds.has(c.id)) && !allSelected;

  useEffect(() => {
    if (openMenuId === null) return;
    const closeMenu = () => setOpenMenuId(null);
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  const toggleMenu = (id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const position: MenuPosition = {};
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < MENU_HEIGHT + MENU_PADDING && spaceAbove > MENU_HEIGHT) {
      position.bottom = vh - rect.top + 4;
    } else {
      position.top = rect.bottom + 4;
    }
    const spaceRight = vw - rect.right;
    if (spaceRight < MENU_WIDTH + MENU_PADDING && rect.left > MENU_WIDTH) {
      position.right = vw - rect.right + 4;
    } else {
      position.left = Math.max(MENU_PADDING, rect.right - MENU_WIDTH);
    }
    setMenuPosition(position);
    setOpenMenuId(id);
  };

  const menuAction = (callback: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(null);
    callback();
  };

  if (safeClients.length === 0) {
    return (
      <div className={`flex min-h-[270px] flex-col items-center justify-center overflow-hidden rounded-xl border-[0.5px] px-6 py-10 text-center shadow-sm ${tableBackground} ${borderColor} dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)]`}>
        <h3 className="text-[15.5px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">Aucun client</h3>
        <p className="mt-2 max-w-[390px] text-[14.5px] leading-6 text-slate-500 dark:text-slate-400">Aucun client ne correspond actuellement aux critères affichés.</p>
        <button type="button" onClick={onAdd} className="mt-6 rounded-lg bg-brand-500 px-5 py-2.5 text-[14.5px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.98]">Nouveau client</button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)] ${tableBackground} ${borderColor}`}>
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.065]' : 'border-slate-200 bg-brand-50/50'}`}>
          <span className="text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">
            {safeSelectedIds.size} client{safeSelectedIds.size > 1 ? 's' : ''} sélectionné{safeSelectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => onBulkUpdateType?.(Array.from(safeSelectedIds), 'Entreprise')} className="rounded-lg bg-success-600 px-2.5 py-1.5 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-success-700 active:scale-[0.98]">Entreprise</button>
            <button type="button" onClick={() => onBulkUpdateType?.(Array.from(safeSelectedIds), 'Particulier')} className="rounded-lg bg-brand-500 px-2.5 py-1.5 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 active:scale-[0.98]">Particulier</button>
            <button type="button" onClick={() => onBulkDelete?.(Array.from(safeSelectedIds))} className="rounded-lg bg-danger-500 px-2.5 py-1.5 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-danger-600 active:scale-[0.98]">Supprimer</button>
            <button type="button" onClick={() => onSelectAll?.(false)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13.5px] font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-700">Désélectionner</button>
          </div>
        </div>
      )}

      <div className="custom-scrollbar scrollbar-gutter-stable overflow-x-auto overflow-y-auto">
        <table className={`w-full min-w-[850px] table-fixed border-collapse text-left ${borderColor}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400">
              <th scope="col" className={`w-[40px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>
                <input type="checkbox" checked={allSelected} ref={input => { if (input) input.indeterminate = someSelected; }} onChange={e => onSelectAll?.(e.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label="Sélectionner tous les clients" />
              </th>
              <th scope="col" className={`w-[180px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Client</th>
              <th scope="col" className={`w-[170px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Contact</th>
              <th scope="col" className={`w-[110px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Type</th>
              <th scope="col" className={`w-[130px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>Localisation</th>
              <th scope="col" className={`w-[120px] border-b px-2 py-2.5 text-right align-middle ${headerBorderColor}`}>Total achats</th>
              <th scope="col" className={`w-[80px] border-b px-2 py-2.5 text-right align-middle ${headerBorderColor}`}>Commandes</th>
              <th scope="col" className={`w-[50px] border-b px-2 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
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
                <tr key={client.id} onClick={() => { setOpenMenuId(null); onView(client); }} className={`group h-[68px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.085]' : 'bg-brand-50/50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={e => onSelectOne?.(client.id, e.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label={`Sélectionner ${client.nom}`} />
                  </td>
                  <td className={`border-b px-2 py-2 align-middle text-left ${cellBorderColor}`}>
                    <div className="min-w-0">
                      <div title={client.nom} className="truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">{client.nom || 'Client inconnu'}</div>
                    </div>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {client.email && <span title={client.email} className="block max-w-[160px] truncate text-[14.5px] text-slate-700 dark:text-slate-300">{client.email}</span>}
                      {client.telephone && <span title={client.telephone} className="block max-w-[140px] truncate text-[14.5px] text-slate-700 dark:text-slate-300">{client.telephone}</span>}
                      {!client.email && !client.telephone && <span className="text-[14.5px] italic text-slate-400 dark:text-slate-500">Aucun contact</span>}
                    </div>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[12.5px] font-semibold ${getTypeColor(client.type)}`}>{client.type}</span>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0">
                      <span title={client.ville || 'N/A'} className="block max-w-[120px] truncate text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">{client.ville || 'N/A'}</span>
                      {client.pays && <span title={client.pays} className="mt-0.5 block max-w-[100px] truncate text-[12.5px] font-medium text-slate-500 dark:text-slate-400">{client.pays}</span>}
                    </div>
                  </td>
                  <td className={`border-b px-2 py-2 text-right align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">{Number(client.total_achats || 0).toLocaleString('fr-FR')} Ar</span>
                  </td>
                  <td className={`border-b px-2 py-2 text-right align-middle ${cellBorderColor}`}>
                    <span className="inline-flex min-w-[30px] items-center justify-center rounded-md border border-brand-500/20 bg-brand-50 px-1.5 py-0.5 text-[13.5px] font-semibold text-brand-600 dark:border-brand-500/10 dark:bg-brand-500/10 dark:text-brand-400">{Number(client.nombre_commandes || 0)}</span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle text-right ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <button type="button" onClick={e => toggleMenu(client.id, e)} title="Plus d'actions" aria-expanded={openMenuId === client.id} className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition-all duration-150 ${openMenuId === client.id ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'hover:border-slate-200 hover:bg-slate-50 hover:text-brand-600 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}>
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

      {openMenuId !== null && createPortal(
        <div className={`fixed z-[99999] w-[195px] overflow-hidden rounded-lg border py-1 shadow-[0_16px_45px_rgba(15,23,42,0.18)] backdrop-blur-2xl ${isDark ? 'border-white/[0.10] bg-[#0F172A]/98' : 'border-slate-200 bg-white/98'}`}
          style={{ top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined, bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined, left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined, right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined }}
          onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
          {(() => {
            const client = safeClients.find(item => item.id === openMenuId);
            if (!client) return null;
            return (
              <div className="flex flex-col text-[14.5px]">
                <div className={`border-b px-3 py-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                  <div className="min-w-0">
                    <div className="max-w-[155px] truncate text-[14px] font-semibold text-slate-900 dark:text-slate-100">{client.nom}</div>
                  </div>
                </div>
                <button type="button" onMouseDown={e => menuAction(() => onView(client), e)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">Voir les détails</button>
                <button type="button" onMouseDown={e => menuAction(() => navigate(`/commandes?client=${client.id}`), e)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">Voir les commandes</button>
                <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`} />
                <button type="button" onMouseDown={e => menuAction(() => onEdit(client), e)} className="flex w-full items-center px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">Modifier</button>
                <button type="button" onMouseDown={e => menuAction(() => onDelete(client), e)} className="flex w-full items-center px-3 py-2 text-left font-semibold text-danger-600 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:text-danger-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-300">Supprimer</button>
              </div>
            );
          })()}
        </div>,
        document.body
      )}

      <div className={`flex flex-wrap items-center justify-between gap-2 border-t px-3.5 py-2 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.total}</span> client{stats.total > 1 ? 's' : ''}</span>
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.totalCommandes}</span> commande{stats.totalCommandes > 1 ? 's' : ''}</span>
          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">Particulier : {stats.particuliers}</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">Entreprise : {stats.entreprises}</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">Avec contact : {stats.avecContact}</span>
          </div>
        </div>
        <span className="text-[12.5px] font-medium text-slate-400 dark:text-slate-500">Gestion des clients</span>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4F46E5; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338CA; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #4F46E5 transparent; }
        .scrollbar-gutter-stable { scrollbar-gutter: stable; }
        @keyframes clientRowIn { from { opacity: 0; transform: translateY(1px); } to { opacity: 1; transform: translateY(0); } }
        .group { animation: clientRowIn 0.16s ease-out; }
      `}</style>
    </div>
  );
};

export default ClientsTable;