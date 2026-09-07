import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { History, Edit, Trash2, Plus, CreditCard, Users, MoreVertical, Wallet, X, AlertCircle, Clock, CheckCircle2, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Paiement {
  id: number;
  employe_id: number;
  employe_nom: string;
  employe_prenom: string;
  employe_poste: string;
  mois: number;
  annee: number;
  montant: number;
  mode_paiement: string;
  date_paiement: string;
  reference?: string;
  observation?: string;
  statut?: string;
}

interface PaiementsTableProps {
  paiements: Paiement[];
  moisLabels: string[];
  onViewHistorique?: (employeId: number) => void;
  onEdit: (paiement: Paiement) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
  onValidate?: (paiement: Paiement) => void;
  onBulletin?: (paiement: Paiement) => void;
}

const safeNumber = (value: unknown, fallback = 0): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const formatDate = (value?: string): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('fr-FR');
};

const getEmployeeName = (paiement: Paiement): string => {
  const firstName = paiement.employe_prenom?.trim() || '';
  const lastName = paiement.employe_nom?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Employé inconnu';
};

const PaiementsTable: React.FC<PaiementsTableProps> = ({
  paiements = [],
  moisLabels = [],
  onViewHistorique,
  onEdit,
  onDelete,
  onAdd,
  selectedIds = new Set<number>(),
  onSelectAll,
  onSelectOne,
  onBulkDelete,
  onValidate,
  onBulletin,
}) => {
  const { isDark } = useTheme();

  const tableBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const tableSecondaryBackground = isDark ? 'bg-[#0F172A]' : 'bg-indigo-50';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-indigo-200';
  const cellBorderColor = isDark ? 'border-white/[0.10]' : 'border-indigo-100';
  const headerBorderColor = isDark ? 'border-white/[0.15]' : 'border-indigo-200';

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; left?: number; right?: number; }>({});
  const menuRef = useRef<HTMLDivElement | null>(null);

  const stats = useMemo(() => {
    const total = paiements.length;
    const totalMontant = paiements.reduce((sum, paiement) => sum + safeNumber(paiement.montant), 0);
    const employesUniques = new Set(paiements.map((paiement) => paiement.employe_id).filter((id) => id !== null && id !== undefined && Number(id) > 0)).size;
    const modeStats: Record<string, number> = {};
    for (const paiement of paiements) {
      const mode = paiement.mode_paiement || 'Non spécifié';
      if (!modeStats[mode]) modeStats[mode] = 0;
      modeStats[mode]++;
    }
    const topModes = Object.entries(modeStats).sort(([, a], [, b]) => b - a).slice(0, 3);
    return { total, totalMontant, employesUniques, topModes };
  }, [paiements]);

  const allSelected = paiements.length > 0 && paiements.every((paiement) => selectedIds.has(paiement.id));
  const someSelected = paiements.some((paiement) => selectedIds.has(paiement.id)) && !allSelected;
  const currentPaiement = openMenuId !== null ? paiements.find((paiement) => paiement.id === openMenuId) : null;

  const calculateMenuPosition = useCallback((button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const MENU_WIDTH = 220, MENU_HEIGHT = 220, PADDING = 12, GAP = 4;
    const viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;
    const position: { top?: number; bottom?: number; left?: number; right?: number; } = {};
    const spaceBelow = viewportHeight - rect.bottom, spaceAbove = rect.top;
    if (spaceBelow < MENU_HEIGHT + PADDING && spaceAbove >= MENU_HEIGHT + PADDING) position.bottom = viewportHeight - rect.top + GAP;
    else position.top = rect.bottom + GAP;
    const idealLeft = rect.right - MENU_WIDTH;
    position.left = idealLeft >= PADDING ? idealLeft : PADDING;
    if (position.left !== undefined && position.left + MENU_WIDTH > viewportWidth - PADDING) position.left = viewportWidth - MENU_WIDTH - PADDING;
    return position;
  }, []);

  const toggleMenu = useCallback((id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    setMenuPosition(calculateMenuPosition(event.currentTarget));
    setOpenMenuId(id);
  }, [calculateMenuPosition, openMenuId]);

  useEffect(() => {
    if (openMenuId === null) return;
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setOpenMenuId(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpenMenuId(null); }
    };
    const handleScroll = () => setOpenMenuId(null);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openMenuId]);

  const handleMenuAction = useCallback((callback: () => void, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenMenuId(null);
    callback();
  }, []);

  if (paiements.length === 0) {
    return (
      <div className={`flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-14 text-center shadow-sm ${tableBackground} ${borderColor} dark:shadow-[0_14px_45px_rgba(0,0,0,0.20)]`}>
        <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm dark:border-indigo-500/15 dark:bg-indigo-500/10 dark:text-indigo-400">
          <CreditCard size={30} strokeWidth={1.8} />
        </div>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">Aucun paiement</h3>
        <p className="mt-2 max-w-[390px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">Ajoutez un paiement pour commencer à suivre les rémunérations.</p>
        <button type="button" onClick={onAdd} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(79,70,229,0.22)] transition-all duration-150 hover:bg-indigo-600 hover:shadow-[0_6px_18px_rgba(79,70,229,0.28)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 active:scale-[0.98]">
          <Plus size={17} />Ajouter un paiement
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-[0_2px_12px_rgba(15,23,42,0.04)] dark:shadow-[0_14px_45px_rgba(0,0,0,0.20)] ${tableBackground} ${borderColor}`}>
      {selectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${isDark ? 'border-white/[0.08] bg-red-500/[0.06]' : 'border-red-100 bg-red-50'}`}>
          <span className="text-[14px] font-semibold text-red-600 dark:text-red-400">
            {selectedIds.size} paiement{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => onBulkDelete?.(Array.from(selectedIds))} className="inline-flex items-center rounded-lg bg-red-500 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-red-600 hover:shadow-md active:scale-[0.98]">
              <Trash2 size={14} />Supprimer
            </button>
            <button type="button" onClick={() => onSelectAll?.(false)} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-[#333333] dark:hover:text-white">
              <X size={14} />Désélectionner
            </button>
          </div>
        </div>
      )}

      <div className="custom-paiements-scrollbar scrollbar-gutter-stable overflow-x-auto overflow-y-auto" style={{ maxHeight: '600px', minHeight: '400px' }}>
        <table className={`w-full min-w-full table-fixed border-collapse text-left ${borderColor}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-indigo-50/97'}`}>
            <tr className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              <th scope="col" className={`w-[42px] border-b px-4 py-4 align-middle ${headerBorderColor}`}>
                <input type="checkbox" checked={allSelected} ref={(element) => { if (element) element.indeterminate = someSelected; }} onChange={(event) => onSelectAll?.(event.target.checked)} aria-label="Sélectionner tous les paiements" className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-500 accent-indigo-600 focus:ring-indigo-500/30 dark:border-slate-600" />
              </th>
              <th scope="col" className={`w-[200px] border-b px-4 py-4 align-middle ${headerBorderColor}`}>Employé</th>
              <th scope="col" className={`w-[130px] border-b px-4 py-4 align-middle ${headerBorderColor}`}>Date paiement</th>
              <th scope="col" className={`w-[130px] border-b px-4 py-4 align-middle ${headerBorderColor}`}>Montant</th>
              <th scope="col" className={`w-[120px] border-b px-4 py-4 align-middle ${headerBorderColor}`}>Mode</th>
              <th scope="col" className={`w-[80px] border-b px-4 py-4 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {paiements.map((paiement) => {
              const isSelected = selectedIds.has(paiement.id);
              const montant = safeNumber(paiement.montant);
              const employeeName = getEmployeeName(paiement);
              const mode = paiement.mode_paiement || 'Non spécifié';
              const statut = paiement.statut || 'Payé';
              
              const modeColor = mode === 'Espèces' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25'
                : mode === 'Chèque' 
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25';

              const statutColor = statut === 'Brouillon'
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                : statut === 'Validé'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                  : statut === 'Payé'
                    ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                    : statut === 'Partiel'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400';

              return (
                <tr key={paiement.id} onClick={() => { setOpenMenuId(null); if (onViewHistorique) onViewHistorique(paiement.employe_id); }} className={`group h-[64px] cursor-pointer transition-all duration-150 ${isSelected ? (isDark ? 'bg-indigo-500/[0.085]' : 'bg-indigo-50') : (isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-indigo-50/50')}`}>
                  <td className={`border-b px-4 py-3 align-middle ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={(event) => onSelectOne?.(paiement.id, event.target.checked)} aria-label={`Sélectionner le paiement ${paiement.id}`} className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-500 accent-indigo-600 focus:ring-indigo-500/30 dark:border-slate-600" />
                  </td>

                  <td className={`border-b px-4 py-3 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0 leading-tight">
                      <div className="max-w-[180px] truncate text-[15px] font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">{employeeName}</div>
                      <div className="mt-1 truncate text-[14px] text-slate-500 dark:text-slate-400">{paiement.employe_poste || 'Poste non spécifié'}</div>
                    </div>
                  </td>

                  <td className={`border-b px-4 py-3 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14px] font-semibold text-slate-700 dark:text-slate-200">{formatDate(paiement.date_paiement)}</span>
                  </td>

                  <td className={`border-b px-4 py-3 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[15px] font-bold text-emerald-700 dark:text-emerald-400">{`${Number(montant).toLocaleString('fr-FR')} Ar`}</span>
                  </td>

                  <td className={`border-b px-4 py-3 align-middle ${cellBorderColor}`}>
                    <span className={`inline-flex items-center whitespace-nowrap rounded-lg border px-3 py-1.5 text-[13px] font-semibold leading-tight ${modeColor}`}>{mode}</span>
                  </td>

                  <td className={`border-b px-2 py-3 text-right align-middle ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {statut === 'Brouillon' && onValidate && (
                        <button type="button" title="Valider" aria-label="Valider" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onValidate(paiement); }} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-500/10 dark:hover:text-green-400">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {onBulletin && (
                        <button type="button" title="Bulletin de paie" aria-label="Bulletin de paie" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onBulletin(paiement); }} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400">
                          <FileText size={16} />
                        </button>
                      )}
                      {/* ⭐ FIX: BOUTON ACTIONS -> ELLIPSIS ("...") */}
                      <button type="button" title="Actions" aria-label={`Actions pour ${employeeName}`} aria-expanded={openMenuId === paiement.id} onClick={(event) => toggleMenu(paiement.id, event)} className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition-all duration-150 ${openMenuId === paiement.id ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'hover:border-slate-200 hover:bg-slate-50 hover:text-indigo-600 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}>
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

      {openMenuId !== null && currentPaiement && createPortal(
        <div ref={menuRef} className={`fixed z-[99999] w-[220px] overflow-hidden rounded-xl border py-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 ${isDark ? 'border-white/[0.10] bg-[#0F172A]/98' : 'border-indigo-100 bg-white/98'}`} style={{ ...menuPosition }} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
          <div className={`border-b px-4 py-3 ${isDark ? 'border-white/[0.08]' : 'border-indigo-100'}`}>
            <div className="min-w-0">
              <div className="max-w-[180px] truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">{getEmployeeName(currentPaiement)}</div>
              <div className="mt-1 font-mono text-[11px] text-slate-400">ID #{currentPaiement.id}</div>
            </div>
          </div>
          <div className="flex flex-col text-[14px]">
            {onViewHistorique && (
              <button type="button" onMouseDown={(event) => handleMenuAction(() => onViewHistorique(currentPaiement.employe_id), event)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-slate-700 transition-colors hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"><History size={15} /></span>
                <span>Voir l'historique</span>
              </button>
            )}
            <button type="button" onMouseDown={(event) => handleMenuAction(() => onEdit(currentPaiement), event)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-slate-700 transition-colors hover:bg-amber-50 dark:text-slate-200 dark:hover:bg-amber-500/10">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><Edit size={15} /></span>
              <span>Modifier</span>
            </button>
            <div className={`mx-3 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-indigo-100'}`} />
            <button type="button" onMouseDown={(event) => handleMenuAction(() => onDelete(currentPaiement.id), event)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <Trash2 size={15} />
              </span>
              <span>Supprimer</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.total}</span> paiement{stats.total > 1 ? 's' : ''}</span>
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{Number(stats.totalMontant).toLocaleString('fr-FR')} Ar</span> Total</span>
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.employesUniques}</span> employé{stats.employesUniques > 1 ? 's' : ''}</span>
          <span className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />
          <div className="flex flex-wrap items-center gap-1.5">
            {stats.topModes.map(([mode, count]) => (
              <span key={mode} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-white px-2.5 py-1 text-[13px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span className="max-w-[120px] truncate">{mode}</span>
                <span className="text-slate-400 dark:text-slate-500">{count}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[13px] font-medium text-slate-400 dark:text-slate-500">
          <AlertCircle size={14} />
          <span>Gestion des paiements</span>
        </div>
      </div>

      <style>{`
        .custom-paiements-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
        .custom-paiements-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-paiements-scrollbar::-webkit-scrollbar-thumb { background: rgba(79,70,229,0.25); border-radius: 999px; }
        .custom-paiements-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(79,70,229,0.45); }
        .custom-paiements-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(79,70,229,0.25) transparent; }
        .scrollbar-gutter-stable { scrollbar-gutter: stable; }
        @keyframes paiementRowIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        .group { animation: paiementRowIn .18s ease-out; }
      `}</style>
    </div>
  );
};

export default PaiementsTable;