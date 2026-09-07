

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Eye, CheckSquare, X, Trash2, TextSelection, Pencil, MoreVertical, CreditCard } from 'lucide-react';
import { safeString, normalizeText, ITEMS_PER_PAGE } from './PaiementsUtils';
import PaiementsPagination from './PaiementsPagination';

interface Props {
  isDark: boolean;
  employes: any[];
  paiementCounts: Record<number, number>;
  employeTotals: Record<number, number>;
  onViewHistorique: (id: number) => void;
  onViewPaiement?: (employeeId: number) => void;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
  onBulkUpdateStatus?: (ids: number[], status: string) => void;
  onBulkPay?: (ids: number[]) => void;

  onPaySingle?: (employeeId: number) => void;
  imageUrls?: Record<number, string | null>;
  loadImageForEmploye?: (employe: any) => void;
  derniersPaiements?: Record<number, any>;
  onEditPaiement?: (employeeId: number) => void;
}

const PaiementsEmployesTab: React.FC<Props> = ({
  isDark, employes = [], paiementCounts = {}, employeTotals = {}, onViewHistorique,
  onViewPaiement, selectedIds, onSelectAll, onSelectOne, onBulkDelete, onBulkUpdateStatus,
  onBulkPay,
  onPaySingle, 
  imageUrls = {}, loadImageForEmploye, derniersPaiements = {}, onEditPaiement,
}) => {
  const [searchEmploye, setSearchEmploye] = useState('');
  const [employePage, setEmployePage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; left?: number; right?: number }>({});

  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0';
  const cellBorderColor = isDark ? 'rgba(255,255,255,0.10)' : '#E2E8F0';
  const tableBackground = isDark ? '#2A2A2A' : '#FFFFFF';
  const textColor = isDark ? '#FDE2E4' : '#264653';
  const mutedText = isDark ? '#B0B0B0' : '#64748B';
  const inputBg = isDark ? '#2A2A2A' : '#FFFFFF';

  const getEmployeeId = (employee: any): number => Number(employee?.id ?? 0);
  const safeSelectedIds = selectedIds || new Set<number>();


  const getPaymentBreakdown = (employee: any) => {
    const id = getEmployeeId(employee);
    const dernier = derniersPaiements?.[id] || {};
    
    const brut = Number(dernier.salaire_brut) > 0 ? Number(dernier.salaire_brut) : Number(employee?.salaire || 0);
    const cnaps = Number(dernier.cnaps) || Math.round(brut * 0.01);
    const ostie = Number(dernier.ostie) || Math.round(brut * 0.05);
    

    let irsa = Number(dernier.irsa) || 0;
    if (!Number(dernier.irsa)) {
      const taxable = brut - cnaps - ostie;
      if (taxable > 350000 && taxable <= 700000) irsa = Math.round((taxable - 350000) * 0.05);
      else if (taxable > 700000 && taxable <= 1400000) irsa = Math.round((taxable - 700000) * 0.10 + 17500);
      else if (taxable > 1400000 && taxable <= 3000000) irsa = Math.round((taxable - 1400000) * 0.15 + 87500);
      else if (taxable > 3000000) irsa = Math.round((taxable - 3000000) * 0.20 + 327500);
    }

    const avance = Number(dernier.avance) || 0;

    const net = Number(dernier.montant) > 0 ? Number(dernier.montant) : Math.max(0, brut - cnaps - ostie - irsa - avance);

    return { brut, cnaps, ostie, irsa, net };
  };

  const filteredEmployes = useMemo(() => {
    const term = normalizeText(searchEmploye);
    let list = employes;
    if (term) {
      list = employes.filter((employee) => {
        const prenom = safeString(employee?.prenom);
        const nom = safeString(employee?.nom);
        const poste = safeString(employee?.poste);
        return normalizeText(`${prenom} ${nom}`).includes(term) || normalizeText(poste).includes(term);
      });
    }
    return [...list].sort((a, b) => Number(b?.id) - Number(a?.id));
  }, [employes, searchEmploye]);

  useEffect(() => { setEmployePage(1); }, [searchEmploye]);
  const totalPages = Math.max(1, Math.ceil(filteredEmployes.length / ITEMS_PER_PAGE));
  const displayedEmployes = useMemo(() => {
    const start = (employePage - 1) * ITEMS_PER_PAGE;
    return filteredEmployes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployes, employePage]);

  if (employes.length === 0) return <div className="p-10 text-center">Aucun employé</div>;

  const toggleMenu = (id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    const MENU_WIDTH = 180, MENU_HEIGHT = 120, PADDING = 12;
    const viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;
    const position: any = {};
    if (viewportHeight - rect.bottom < MENU_HEIGHT + PADDING) {
      position.bottom = viewportHeight - rect.top + 4;
    } else {
      position.top = rect.bottom + 4;
    }
    if (viewportWidth - rect.right < MENU_WIDTH + PADDING) {
      position.right = viewportWidth - rect.right + 4;
    } else {
      position.left = Math.max(PADDING, rect.right - MENU_WIDTH);
    }
    setMenuPosition(position);
    setOpenMenuId(id);
  };

  const handleMenuAction = (callback: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(null);
    callback();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b p-4" style={{ borderColor, background: tableBackground }}>
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: textColor }}>Détails des paiements par employé</h2>
          <p className="text-[13px]" style={{ color: mutedText }}>{filteredEmployes.length} employé(s)</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
          <input value={searchEmploye} onChange={(e) => setSearchEmploye(e.target.value)} placeholder="Rechercher..." className="h-10 w-full sm:w-96 rounded-lg border pl-9 pr-3 text-[13px]" style={{ background: inputBg, borderColor, color: mutedText }} />
        </div>
      </div>

      {safeSelectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3" style={{ borderColor, background: isDark ? 'rgba(13,128,210,0.065)' : 'rgba(13,128,210,0.10)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm"><CheckSquare size={15} /></div>
            <div className="flex flex-col">
              <span className="text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">{safeSelectedIds.size} sélectionné(s)</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onBulkPay && (
              <button type="button" onClick={() => onBulkPay(Array.from(safeSelectedIds))} className="inline-flex items-center gap-2 rounded-lg bg-[#059669] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#047857] active:scale-[0.98]">
                <CreditCard size={14} /> Payer
              </button>
            )}
            <button type="button" onClick={() => onBulkDelete?.(Array.from(safeSelectedIds))} className="inline-flex items-center gap-2 rounded-lg bg-danger-500 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-danger-600 active:scale-[0.98]">
              <Trash2 size={14} /> Supprimer
            </button>
            <button type="button" onClick={() => onSelectAll?.(false)} className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-semibold shadow-sm" style={{ borderColor, background: inputBg, color: mutedText }}>
              <TextSelection size={14} /> Désélectionner
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">

        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="text-[12px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400">
              <th className="w-[48px] border px-3 py-4" style={{ borderColor: cellBorderColor }}><input type="checkbox" checked={displayedEmployes.length > 0 && displayedEmployes.every(e => safeSelectedIds.has(getEmployeeId(e)))} onChange={e => onSelectAll?.(e.target.checked)} className="h-[17px] w-[17px] accent-brand-600" /></th>
              <th className="border px-3 py-4" style={{ borderColor: cellBorderColor }}>EMPLOYÉ</th>
              <th className="border px-3 py-4" style={{ borderColor: cellBorderColor }}>POSTE</th>
              <th className="border px-3 py-4" style={{ borderColor: cellBorderColor }}>SALAIRE BRUT</th>
              <th className="border px-3 py-4" style={{ borderColor: cellBorderColor }}>CNaPS (1%)</th>
              <th className="border px-3 py-4" style={{ borderColor: cellBorderColor }}>OSTIE (5%)</th>
              <th className="border px-3 py-4" style={{ borderColor: cellBorderColor }}>IRSA</th>
              <th className="border px-3 py-4" style={{ borderColor: cellBorderColor }}>NET À PAYER</th>
              <th className="border px-3 py-4 text-right" style={{ borderColor: cellBorderColor }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {displayedEmployes.map((employee) => {
              const id = getEmployeeId(employee);
              const prenom = safeString(employee?.prenom);
              const nom = safeString(employee?.nom);
              const poste = safeString(employee?.poste);
              const isSelected = safeSelectedIds.has(id);
              const { brut, cnaps, ostie, irsa, net } = getPaymentBreakdown(employee);
              
              return (
                <tr key={id} className="h-[64px] cursor-pointer transition-all" style={{ background: isSelected ? (isDark ? 'rgba(13,128,210,0.085)' : 'rgba(13,128,210,0.10)') : 'transparent' }} onClick={() => onViewHistorique(id)}>
                  <td className="border px-3 py-3" style={{ borderColor: cellBorderColor }} onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={isSelected} onChange={e => onSelectOne?.(id, e.target.checked)} className="h-[17px] w-[17px] accent-brand-600" /></td>
                  <td className="border px-3 py-3" style={{ borderColor: cellBorderColor }}>
                    <p className="text-[14.5px] font-semibold" style={{ color: textColor }}>{prenom} {nom}</p>
                    <p className="text-[12px]" style={{ color: mutedText }}>ID #{String(id).padStart(3, '0')}</p>
                  </td>
                  <td className="border px-3 py-3" style={{ borderColor: cellBorderColor }}><span className="text-[14.5px] font-medium" style={{ color: textColor }}>{poste || '—'}</span></td>
                  <td className="border px-3 py-3" style={{ borderColor: cellBorderColor }}><span className="text-[14.5px] font-semibold" style={{ color: textColor }}>{brut.toLocaleString('fr-FR')} Ar</span></td>
                  <td className="border px-3 py-3" style={{ borderColor: cellBorderColor }}><span className="text-[14.5px] font-medium text-danger-500 dark:text-danger-400">{cnaps.toLocaleString('fr-FR')} Ar</span></td>
                  <td className="border px-3 py-3" style={{ borderColor: cellBorderColor }}><span className="text-[14.5px] font-medium text-danger-500 dark:text-danger-400">{ostie.toLocaleString('fr-FR')} Ar</span></td>
                  <td className="border px-3 py-3" style={{ borderColor: cellBorderColor }}><span className="text-[14.5px] font-medium text-danger-500 dark:text-danger-400">{irsa.toLocaleString('fr-FR')} Ar</span></td>
                  <td className="border px-3 py-3" style={{ borderColor: cellBorderColor }}><span className="text-[14.5px] font-bold text-brand-600 dark:text-brand-400">{net.toLocaleString('fr-FR')} Ar</span></td>
         
                  <td className="border px-3 py-3 text-right" style={{ borderColor: cellBorderColor }} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
           
                      {onPaySingle && (
                        <button
                          type="button"
                          onClick={() => onPaySingle(id)}
                          title="Payer cet employé"
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-600"
                        >
                          <CreditCard size={12} /> Payer
                        </button>
                      )}
                 
                      <button type="button" onClick={(event) => toggleMenu(id, event)} title="Actions" className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600">
                        <MoreVertical size={18} />
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
        <div className={`fixed z-[99999] w-[180px] overflow-hidden rounded-xl border py-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 ${isDark ? 'border-white/[0.10] bg-[#2A2A2A]/98' : 'border-gray-200 bg-white/98'}`} style={{ top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined, bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined, left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined, right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined }} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col text-[14px]">
         
            {onPaySingle && (
              <button type="button" onMouseDown={(e) => handleMenuAction(() => onPaySingle(openMenuId), e)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-slate-700 transition-colors hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-400">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><CreditCard size={15} /></span>
                <span>Payer</span>
              </button>
            )}

            <button type="button" onMouseDown={(e) => handleMenuAction(() => onViewHistorique(openMenuId), e)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-slate-700 transition-colors hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-400">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><Eye size={15} /></span>
              <span>Historique</span>
            </button>

            {onEditPaiement && (
              <button type="button" onMouseDown={(e) => handleMenuAction(() => onEditPaiement(openMenuId), e)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-medium text-slate-700 transition-colors hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-400">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><Pencil size={15} /></span>
                <span>Modifier</span>
              </button>
            )}
          </div>
        </div>, document.body
      )}

      {totalPages > 1 && <div className="border-t p-4" style={{ borderColor }}><PaiementsPagination currentPage={employePage} totalPages={totalPages} totalItems={filteredEmployes.length} onPageChange={setEmployePage} /></div>}
    </div>
  );
};

export default PaiementsEmployesTab;