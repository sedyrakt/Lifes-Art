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
  paiements = [], moisLabels = [], onViewHistorique, onEdit, onDelete, onAdd,
  selectedIds = new Set<number>(), onSelectAll, onSelectOne, onBulkDelete, onValidate, onBulletin,
}) => {
  const { isDark } = useTheme();

  // ⭐ COLORS STANDARD
  const tableBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const tableSecondaryBackground = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorderColor = isDark ? 'border-white/[0.15]' : 'border-slate-200';

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
    event.preventDefault(); event.stopPropagation();
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
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); setOpenMenuId(null); } };
    const handleScroll = () => setOpenMenuId(null);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => { document.removeEventListener('mousedown', handleMouseDown); document.removeEventListener('keydown', handleKeyDown); window.removeEventListener('scroll', handleScroll, true); };
  }, [openMenuId]);

  const handleMenuAction = useCallback((callback: () => void, event: React.MouseEvent) => {
    event.preventDefault(); event.stopPropagation();
    setOpenMenuId(null); callback();
  }, []);

  if (paiements.length === 0) {
    return (
      <div className={`flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-14 text-center shadow-sm ${tableBackground} ${borderColor}`}>
        <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-slate-400">
          <CreditCard size={30} strokeWidth={1.8} />
        </div>
        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Aucun paiement</h3>
        <p className="mt-2 max-w-[390px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">Ajoutez un paiement pour commencer à suivre les rémunérations.</p>
        <button type="button" onClick={onAdd} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600">
          <Plus size={17} />Ajouter un paiement
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm ${tableBackground} ${borderColor}`}>
      {selectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${isDark ? 'border-white/[0.08] bg-red-500/[0.06]' : 'border-red-100 bg-red-50'}`}>
          <span className="text-[14px] font-semibold text-red-600 dark:text-red-400">{selectedIds.size} paiement(s) sélectionné(s)</span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => onBulkDelete?.(Array.from(selectedIds))} className="inline-flex items-center rounded-lg bg-red-500 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-red-600">
              <Trash2 size={14} />Supprimer
            </button>
            <button type="button" onClick={() => onSelectAll?.(false)} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300">
              <X size={14} />Désélectionner
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className={`w-full min-w-full table-fixed border-collapse text-left ${borderColor}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            <tr className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              <th scope="col" className={`w-[42px] border-b px-4 py-4 align-middle ${headerBorderColor}`}>
                <input type="checkbox" checked={allSelected} ref={(element) => { if (element) element.indeterminate = someSelected; }} onChange={(event) => onSelectAll?.(event.target.checked)} aria-label="Sélectionner tous" className="h-4 w-4 cursor-pointer rounded accent-brand-500" />
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
                ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/25'
                : mode === 'Chèque' 
                  ? 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-300 dark:border-warning-500/25'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/[0.05] dark:text-slate-300 dark:border-white/[0.12]';

              const statutColor = statut === 'Brouillon'
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                : statut === 'Validé'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                  : statut === 'Payé'
                    ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
                    : statut === 'Partiel'
                      ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
                      : 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400';

              return (
                <tr key={paiement.id} onClick={() => { setOpenMenuId(null); if (onViewHistorique) onViewHistorique(paiement.employe_id); }} className={`group h-[64px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.085]' : 'bg-brand-50') : (isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50')}`}>
                  <td className={`border-b px-4 py-3 align-middle ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={(event) => onSelectOne?.(paiement.id, event.target.checked)} aria-label={`Sélectionner ${paiement.id}`} className="h-4 w-4 cursor-pointer rounded accent-brand-500" />
                  </td>

                  <td className={`border-b px-4 py-3 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0 leading-tight">
                      <div className="max-w-[180px] truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">{employeeName}</div>
                      <div className="mt-1 truncate text-[14px] text-slate-500 dark:text-slate-400">{paiement.employe_poste || 'Poste non spécifié'}</div>
                    </div>
                  </td>

                  <td className={`border-b px-4 py-3 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14px] font-semibold text-slate-700 dark:text-slate-200">{formatDate(paiement.date_paiement)}</span>
                  </td>

                  <td className={`border-b px-4 py-3 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[15px] font-bold text-success-700 dark:text-success-400">{`${Number(montant).toLocaleString('fr-FR')} Ar`}</span>
                  </td>

                  <td className={`border-b px-4 py-3 align-middle ${cellBorderColor}`}>
                    <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-1 text-[13px] font-semibold ${modeColor}`}>{mode}</span>
                  </td>

                  <td className={`border-b px-2 py-3 text-right align-middle ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {statut === 'Brouillon' && onValidate && (
                        <button type="button" title="Valider" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onValidate(paiement); }} className="rounded-lg p-1.5 text-slate-500 hover:bg-success-50 hover:text-success-700 dark:hover:bg-success-500/10">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {onBulletin && (
                        <button type="button" title="Bulletin" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onBulletin(paiement); }} className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10">
                          <FileText size={16} />
                        </button>
                      )}
                      <button type="button" title="Actions" onClick={(event) => toggleMenu(paiement.id, event)} className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 ${openMenuId === paiement.id ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'hover:border-slate-200 hover:bg-slate-50 hover:text-brand-600 dark:hover:border-white/[0.12] dark:hover:bg-slate-800'}`}>
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
        <div ref={menuRef} className={`fixed z-[99999] w-[220px] overflow-hidden rounded-xl border py-1.5 shadow-xl ${isDark ? 'border-white/[0.10] bg-[#0F172A]/98' : 'border-slate-200 bg-white/98'}`} style={{ ...menuPosition }} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
          <div className={`border-b px-4 py-3 ${isDark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
            <div className="min-w-0">
              <div className="max-w-[180px] truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">{getEmployeeName(currentPaiement)}</div>
              <div className="mt-1 font-mono text-[11px] text-slate-400">ID #{currentPaiement.id}</div>
            </div>
          </div>
          <div className="flex flex-col text-[14px]">
            {onViewHistorique && (
              <button type="button" onMouseDown={(event) => handleMenuAction(() => onViewHistorique(currentPaiement.employe_id), event)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400"><History size={15} /></span>
                <span>Voir l'historique</span>
              </button>
            )}
            <button type="button" onMouseDown={(event) => handleMenuAction(() => onEdit(currentPaiement), event)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><Edit size={15} /></span>
              <span>Modifier</span>
            </button>
            <div className={`mx-3 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-100'}`} />
            <button type="button" onMouseDown={(event) => handleMenuAction(() => onDelete(currentPaiement.id), event)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
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
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.total}</span> paiement(s)</span>
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{Number(stats.totalMontant).toLocaleString('fr-FR')} Ar</span> Total</span>
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.employesUniques}</span> employé(s)</span>
        </div>
        <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">Gestion des paiements</span>
      </div>
    </div>
  );
};

export default PaiementsTable;