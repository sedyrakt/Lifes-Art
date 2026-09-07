import React, { memo, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, Edit, Trash2, History, Plus, MoreVertical, CalendarDays, TrendingUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
interface Employe {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  departement: string;
  date_embauche: string;
  salaire: number;
  image: string;
  status: string;
  created_at: string;
}
interface MenuPosition { top?: number; bottom?: number; left?: number; right?: number; }
interface EmployesTableProps {
  employes: Employe[];
  paiementCounts: Record<number, number>;
  derniersPaiements?: Record<number, any>;
  onView: (id: number) => void;
  onEdit: (employe: Employe) => void;
  onDelete: (id: number, image?: string) => void;
  onHistorique: (employe: Employe) => void;
  onAdd: () => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkUpdateStatus?: (ids: number[], newStatus: string) => void;
  onBulkDelete?: (ids: number[]) => void;
  onGererPresence?: (employe: Employe) => void;
  onFisondrotana?: (employe: Employe) => void;
  onHistoriqueSalaire?: (employe: Employe) => void;
}
const MENU_WIDTH = 220;
const MENU_HEIGHT = 220;
const MENU_PADDING = 10;
const EmployesTable: React.FC<EmployesTableProps> = ({
  employes,
  paiementCounts,
  onView,
  onEdit,
  onDelete,
  onHistorique,
  onAdd,
  getStatusColor,
  getStatusIcon,
  selectedIds = new Set<number>(),
  onSelectAll,
  onSelectOne,
  onBulkDelete,
  onGererPresence,
  onFisondrotana,
  onHistoriqueSalaire,
  derniersPaiements = {},
}) => {
  const { isDark } = useTheme();
  const tableBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const tableSecondaryBackground = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorderColor = isDark ? 'border-white/[0.15]' : 'border-slate-200';
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({});
  const safeEmployes = employes || [];
  const safePaiementCounts = paiementCounts || {};
  const safeSelectedIds = selectedIds || new Set<number>();
  const safeDerniersPaiements = derniersPaiements || {};
  void safePaiementCounts;
  const getStatusDisplay = (status: string): string => {
    const map: Record<string, string> = { actif: 'Actif', inactif: 'Inactif', en_conge: 'En congé' };
    return map[status] || status || 'Inconnu';
  };
  const stats = useMemo(() => {
    const total = safeEmployes.length;
    const actifs = safeEmployes.filter((e) => e.status === 'actif').length;
    const enConge = safeEmployes.filter((e) => e.status === 'en_conge').length;
    const inactifs = safeEmployes.filter((e) => e.status === 'inactif').length;
    return { total, actifs, enConge, inactifs };
  }, [safeEmployes]);
  const allSelected = safeEmployes.length > 0 && safeEmployes.every((e) => safeSelectedIds.has(e.id));
  const someSelected = safeSelectedIds.size > 0 && !allSelected;
  useEffect(() => {
    if (openMenuId === null) return;
    const close = () => setOpenMenuId(null);
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', handleKeyDown); };
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
  if (safeEmployes.length === 0) {
    return (
      <div className={['flex min-h-[270px] flex-col items-center justify-center overflow-hidden rounded-xl border-[0.5px] px-6 py-10 text-center shadow-sm dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)]', tableBackground, borderColor].join(' ')}>
        <div className={['mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-600 shadow-sm dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400'].join(' ')}>
          <Users size={30} strokeWidth={1.8} />
        </div>
        <h3 className="text-[15.5px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">Aucun employé</h3>
        <p className="mt-2 max-w-[390px] text-[14.5px] leading-6 text-slate-500 dark:text-slate-400">Commencez par ajouter votre premier employé.</p>
        <button type="button" onClick={onAdd} className={['mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-5 py-2.5 text-[14.5px] font-semibold text-white shadow-[0_4px_14px_rgba(79,70,229,0.20)] transition-all duration-150 hover:bg-brand-600 hover:shadow-[0_6px_18px_rgba(79,70,229,0.25)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.98]'].join(' ')}>
          <Plus size={16} strokeWidth={2} /> Ajouter un employé
        </button>
      </div>
    );
  }
  return (
    <div className={['relative overflow-hidden rounded-xl border-[0.5px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.20)]', tableBackground, borderColor].join(' ')}>
      {safeSelectedIds.size > 0 && (
        <div className={['flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2', isDark ? 'border-white/[0.08] bg-brand-500/[0.065]' : 'border-slate-100 bg-brand-50'].join(' ')}>
          <span className="text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">{safeSelectedIds.size} employé{safeSelectedIds.size > 1 ? 's' : ''} sélectionné{safeSelectedIds.size > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => onBulkDelete?.(Array.from(safeSelectedIds))} className="inline-flex items-center rounded-lg bg-danger-500 px-2.5 py-1.5 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-danger-600 active:scale-[0.98]">Supprimer</button>
            <button type="button" onClick={() => onSelectAll?.(false)} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13.5px] font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white">Désélectionner</button>
          </div>
        </div>
      )}
      <div className="custom-scrollbar overflow-x-auto overflow-y-auto scrollbar-gutter-stable">
        <table className={['w-full min-w-[850px] table-fixed border-collapse border text-left', borderColor].join(' ')}>
          <thead className={['sticky top-0 z-20 backdrop-blur-xl', isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'].join(' ')}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400">
              <th scope="col" className={`w-[40px] border-b px-2 py-2.5 align-middle ${headerBorderColor}`}>
                <input type="checkbox" checked={allSelected} ref={(input) => { if (input) input.indeterminate = someSelected; }} onChange={(event) => onSelectAll?.(event.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label="Sélectionner tous les employés" />
              </th>
              <th scope="col" className={`w-[180px] border-b px-2 py-2.5 ${headerBorderColor}`}>Employé</th>
              <th scope="col" className={`w-[130px] border-b px-2 py-2.5 ${headerBorderColor}`}>Poste</th>
              <th scope="col" className={`w-[170px] border-b px-2 py-2.5 ${headerBorderColor}`}>Contact</th>
              <th scope="col" className={`w-[110px] border-b px-2 py-2.5 ${headerBorderColor}`}>Salaire Brut</th>
              <th scope="col" className={`w-[110px] border-b px-2 py-2.5 ${headerBorderColor}`}>Net à payer</th>
              <th scope="col" className={`w-[100px] border-b px-2 py-2.5 ${headerBorderColor}`}>Statut</th>
              <th scope="col" className={`w-[60px] border-b px-2 py-2.5 text-right ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {safeEmployes.map((employe, index) => {
              const statusDisplay = getStatusDisplay(employe.status);
              const isSelected = safeSelectedIds.has(employe.id);
              const dernier = safeDerniersPaiements[employe.id] || {};
              const brut = Number(dernier.salaire_brut) > 0 ? Number(dernier.salaire_brut) : Number(employe.salaire) || 0;
              const cnaps = Number(dernier.cnaps) || 0;
              const ostie = Number(dernier.ostie) || 0;
              const irsa = Number(dernier.irsa) || 0;
              const avance = Number(dernier.avance) || 0;
              const netAPayer = Number(dernier.montant) > 0 ? Number(dernier.montant) : Math.max(0, brut - cnaps - ostie - irsa - avance);
              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]' : '';
              return (
                <tr key={employe.id} onClick={() => { onView(employe.id); setOpenMenuId(null); }} className={['group h-[60px] cursor-pointer transition-colors duration-150', isSelected ? isDark ? 'bg-brand-500/[0.085]' : 'bg-brand-50' : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50', firstRowShadow].join(' ')}>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={(event) => onSelectOne?.(employe.id, event.target.checked)} className="h-[15px] w-[15px] cursor-pointer accent-brand-500" aria-label={`Sélectionner ${employe.prenom} ${employe.nom}`} />
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0">
                      <div className={['truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400'].join(' ')}>{employe.prenom} {employe.nom}</div>
                      <div className="mt-0.5 text-[12.5px] font-medium text-slate-500 dark:text-slate-400">ID #{String(employe.id).padStart(3, '0')}</div>
                    </div>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-medium text-slate-700 dark:text-slate-300">{employe.poste || 'N/A'}</div>
                      {employe.departement && (<div className="mt-0.5 truncate text-[12.5px] text-slate-400 dark:text-slate-500">{employe.departement}</div>)}
                    </div>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {employe.email && (<span className="block max-w-[150px] truncate text-[14.5px] text-slate-600 dark:text-slate-300" title={employe.email}>{employe.email}</span>)}
                      {employe.telephone && (<span className="block max-w-[140px] truncate text-[13.5px] text-slate-600 dark:text-slate-300">{employe.telephone}</span>)}
                      {!employe.email && !employe.telephone && (<span className="text-[14.5px] italic text-slate-400 dark:text-slate-500">—</span>)}
                    </div>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">{brut.toLocaleString('fr-FR')} Ar</span>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-bold text-brand-600 dark:text-brand-400">{netAPayer.toLocaleString('fr-FR')} Ar</span>
                  </td>
                  <td className={`border-b px-2 py-2 align-middle ${cellBorderColor}`}>
                    <span className={['inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12.5px] font-semibold', employe.status === 'actif' ? 'border-success-200 bg-success-50 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400' : getStatusColor(employe.status)].join(' ')}>
                      {getStatusIcon(employe.status)}
                      {statusDisplay}
                    </span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle text-right ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <button type="button" onClick={(event) => toggleMenu(employe.id, event)} title="Actions" aria-label={`Actions pour ${employe.prenom} ${employe.nom}`} className={['flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition-all duration-150', openMenuId === employe.id ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'hover:border-slate-200 hover:bg-slate-50 hover:text-brand-600 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'].join(' ')}>
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
        <div className={['fixed z-[99999] w-[220px] overflow-hidden rounded-lg border-[0.5px] py-1 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-2xl', isDark ? 'border-white/[0.10] bg-[#0F172A]/98' : 'border-slate-200 bg-white/98'].join(' ')} style={{ top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined, bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined, left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined, right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined }} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
          {(() => {
            const employee = safeEmployes.find((item) => item.id === openMenuId);
            if (!employee) return null;
            return (
              <div className="flex flex-col text-[14.5px]">
                <button type="button" onMouseDown={(event) => handleMenuAction(() => onEdit(employee), event)} className="flex w-full items-center gap-3 px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><Edit size={14} /></span>
                  <span>Modifier</span>
                </button>
                <button type="button" onMouseDown={(event) => handleMenuAction(() => onHistorique(employee), event)} className="flex w-full items-center gap-3 px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><History size={14} /></span>
                  <span>Historique salaire</span>
                </button>
                <button type="button" onMouseDown={(event) => handleMenuAction(() => onGererPresence?.(employee), event)} className="flex w-full items-center gap-3 px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><CalendarDays size={14} /></span>
                  <span>Gérer Congés</span>
                </button>
                <button type="button" onMouseDown={(event) => handleMenuAction(() => onFisondrotana?.(employee), event)} className="flex w-full items-center gap-3 px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><TrendingUp size={14} /></span>
                  <span>Augmentation de salaire</span>
                </button>
                <div className={`mx-3 my-1 border-t ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`} />
                <button type="button" onMouseDown={(event) => handleMenuAction(() => onDelete(employee.id, employee.image), event)} className="flex w-full items-center gap-3 px-3 py-2 text-left font-semibold text-danger-500 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-danger-50 text-danger-500 dark:bg-danger-500/10 dark:text-danger-400"><Trash2 size={14} /></span>
                  <span>Supprimer</span>
                </button>
              </div>
            );
          })()}
        </div>,
        document.body
      )}
      <div className={['flex flex-wrap items-center justify-between gap-3 border-t px-3.5 py-2', tableSecondaryBackground, borderColor].join(' ')}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.total}</span> employé{stats.total > 1 ? 's' : ''}</span>
          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />
          <div className="flex flex-wrap items-center gap-1.5">
            {stats.actifs > 0 && (<span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-success-500" /><span>Actif</span><span className="text-slate-400 dark:text-slate-500">{stats.actifs}</span></span>)}
            {stats.enConge > 0 && (<span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-warning-500" /><span>En congé</span><span className="text-slate-400 dark:text-slate-500">{stats.enConge}</span></span>)}
            {stats.inactifs > 0 && (<span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-danger-500" /><span>Inactif</span><span className="text-slate-400 dark:text-slate-500">{stats.inactifs}</span></span>)}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-400 dark:text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-success-500" /><span>Données synchronisées</span></div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4F46E5; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338CA; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #4F46E5 transparent; }
        .scrollbar-gutter-stable { scrollbar-gutter: stable; }
        @keyframes employeRowIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        .group { animation: employeRowIn 0.16s ease-out; }
      `}</style>
    </div>
  );
};
export default memo(EmployesTable);