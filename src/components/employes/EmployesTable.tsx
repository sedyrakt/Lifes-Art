// src/components/employes/EmployesTable.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: Afindra alohan'ny fiverenana mialoha ny hooks rehetra (useMemo, useEffect)
// ⭐ NEW: "Nouveau paiement" ao amin'ny dropdown (mampiasa onNouveauPaiement)
// ⭐ REMOVE: "Gérer Congés" nesorina tao amin'ny dropdown
// ⭐ FIX: Couleur de fond amin'ny ellipsis button rehefa dark mode

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, Edit, Trash2, History, Plus, TrendingUp, Banknote } from 'lucide-react';
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
  cnaps?: number;
  ostie?: number;
  irsa?: number;
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
  // ⭐ NOTE: onGererPresence voatahiry ho backward-compat fa tsy aseho intsony
  onGererPresence?: (employe: Employe) => void;
  onFisondrotana?: (employe: Employe) => void;
  onHistoriqueSalaire?: (employe: Employe) => void;
  onNouveauPaiement?: (employe: Employe) => void;
}

const MENU_WIDTH = 220;
const MENU_HEIGHT = 260;
const MENU_PADDING = 10;

// ════════════════════════════════════════════════════════════
// MENU BUTTON — aligné sur CommandesTable
// ════════════════════════════════════════════════════════════

interface MenuButtonProps {
  icon?: React.ReactNode;
  label: string;
  tone?: 'default' | 'emerald' | 'danger' | 'sky' | 'amber' | 'purple';
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, label, tone = 'default', onMouseDown }) => {
  const toneClass =
    tone === 'emerald' ? 'text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-500/10' :
    tone === 'sky' ? 'text-slate-700 hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-sky-500/10' :
    tone === 'amber' ? 'text-slate-700 hover:bg-amber-50 dark:text-slate-200 dark:hover:bg-amber-500/10' :
    tone === 'purple' ? 'text-slate-700 hover:bg-purple-50 dark:text-slate-200 dark:hover:bg-purple-500/10' :
    tone === 'danger' ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10' :
    'text-slate-700 hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-brand-500/10';

  const iconClass =
    tone === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' :
    tone === 'sky' ? 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400' :
    tone === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' :
    tone === 'purple' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' :
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
  onFisondrotana,
  onHistoriqueSalaire,
  onNouveauPaiement,
  derniersPaiements = {},
  // onGererPresence : tsy ampiasaina intsony
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

  const currentEmploye = useMemo(
    () => (openMenuId === null ? null : safeEmployes.find((item) => item.id === openMenuId) ?? null),
    [safeEmployes, openMenuId]
  );

  useEffect(() => {
    if (openMenuId === null) return;
    const close = () => setOpenMenuId(null);
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const handleResize = () => setOpenMenuId(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('scroll', close, true);
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
  }, [openMenuId]);

  const handleMenuAction = useCallback((callback: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(null);
    callback();
  }, []);

  // ──────────────────────────────────────────────────────────
  // ⚠️ FIVERENANA MIALOHA — Aorian'ny hooks rehetra
  // ──────────────────────────────────────────────────────────
  if (safeEmployes.length === 0) {
    return (
      <div className={`flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-14 text-center shadow-sm ${tableBackground} ${borderColor}`}>
        <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-slate-400">
          <Users size={30} strokeWidth={1.8} />
        </div>
        <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">Aucun employé</h3>
        <p className="mt-2 max-w-[390px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">
          Commencez par ajouter votre premier employé.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          <Plus size={17} />
          Ajouter un employé
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-sm ${tableBackground} ${borderColor}`}>
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.06]' : 'border-brand-100 bg-brand-50'}`}>
          <span className="text-[14.5px] font-semibold text-brand-600 dark:text-brand-400">
            {safeSelectedIds.size} employé{safeSelectedIds.size > 1 ? 's' : ''} sélectionné{safeSelectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onBulkDelete?.(Array.from(safeSelectedIds))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-2.5 py-1.5 text-[14.5px] font-semibold text-white shadow-sm hover:bg-red-600"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
            <button
              type="button"
              onClick={() => onSelectAll?.(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[14.5px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300"
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      <div className="custom-scrollbar overflow-x-auto overflow-y-auto scrollbar-gutter-stable">
        <table className={`w-full min-w-[1100px] table-fixed border-collapse border text-left ${borderColor}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400">
              <th scope="col" className={`w-[36px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>
                <input type="checkbox" checked={allSelected} ref={(input) => { if (input) input.indeterminate = someSelected; }} onChange={(event) => onSelectAll?.(event.target.checked)} className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500" aria-label="Sélectionner tous les employés" />
              </th>
              <th scope="col" className={`w-[160px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Employé</th>
              <th scope="col" className={`w-[110px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Poste</th>
              <th scope="col" className={`w-[150px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Contact</th>
              <th scope="col" className={`w-[100px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Salaire Brut</th>
              <th scope="col" className={`w-[100px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>
                CNaPS <span className="text-[12.5px] font-bold opacity-70">(1%)</span>
              </th>
              <th scope="col" className={`w-[100px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>
                OSTIE <span className="text-[12.5px] font-bold opacity-70">(5%)</span>
              </th>
              <th scope="col" className={`w-[90px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>IRSA</th>
              <th scope="col" className={`w-[110px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Net à payer</th>
              <th scope="col" className={`w-[90px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Statut</th>
              <th scope="col" className={`w-[54px] border-b px-1.5 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {safeEmployes.map((employe, index) => {
              const statusDisplay = getStatusDisplay(employe.status);
              const isSelected = safeSelectedIds.has(employe.id);
              const dernier = safeDerniersPaiements[employe.id] || null;
              const hasDernierPaiement = dernier && dernier.id != null;

              const brut = hasDernierPaiement && Number(dernier.salaire_brut) > 0
                ? Number(dernier.salaire_brut)
                : Number(employe.salaire) || 0;

              const cnaps = hasDernierPaiement
                ? (Number(dernier.cnaps) || 0)
                : (Number(employe.cnaps) || 0);
              const ostie = hasDernierPaiement
                ? (Number(dernier.ostie) || 0)
                : (Number(employe.ostie) || 0);
              const irsa = hasDernierPaiement
                ? (Number(dernier.irsa) || 0)
                : (Number(employe.irsa) || 0);

              const avance = hasDernierPaiement ? (Number(dernier.avance) || 0) : 0;

              const netAPayer = hasDernierPaiement && Number(dernier.montant) > 0
                ? Number(dernier.montant)
                : Math.max(0, brut - cnaps - ostie - irsa - avance);

              const isFirstRow = index === 0;
              const firstRowShadow = isFirstRow ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]' : '';

              return (
                <tr key={employe.id} onClick={() => { onView(employe.id); setOpenMenuId(null); }} className={`group h-[58px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.08]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${firstRowShadow}`}>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={(event) => onSelectOne?.(employe.id, event.target.checked)} className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500" aria-label={`Sélectionner ${employe.prenom} ${employe.nom}`} />
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0 leading-tight">
                      <div className="truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">{employe.prenom} {employe.nom}</div>
                      <div className="mt-0.5 text-[13px] font-medium leading-[1.3] text-slate-500 dark:text-slate-400">ID #{String(employe.id).padStart(3, '0')}</div>
                    </div>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <div className="min-w-0 leading-tight">
                      <div className="truncate text-[14.5px] font-medium text-slate-700 dark:text-slate-300">{employe.poste || 'N/A'}</div>
                      {employe.departement && (<div className="mt-0.5 truncate text-[13px] leading-[1.3] text-slate-400 dark:text-slate-500">{employe.departement}</div>)}
                    </div>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {employe.email && (<span className="block max-w-[140px] truncate text-[14.5px] leading-[1.3] text-slate-600 dark:text-slate-300" title={employe.email}>{employe.email}</span>)}
                      {employe.telephone && (<span className="block max-w-[130px] truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">{employe.telephone}</span>)}
                      {!employe.email && !employe.telephone && (<span className="text-[14.5px] italic leading-[1.3] text-slate-400 dark:text-slate-500">—</span>)}
                    </div>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">{brut.toLocaleString('fr-FR')} Ar</span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-medium text-amber-600 dark:text-amber-400">
                      {cnaps > 0 ? `${cnaps.toLocaleString('fr-FR')} Ar` : <span className="text-slate-400 dark:text-slate-500">—</span>}
                    </span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-medium text-amber-600 dark:text-amber-400">
                      {ostie > 0 ? `${ostie.toLocaleString('fr-FR')} Ar` : <span className="text-slate-400 dark:text-slate-500">—</span>}
                    </span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-medium text-amber-600 dark:text-amber-400">
                      {irsa > 0 ? `${irsa.toLocaleString('fr-FR')} Ar` : <span className="text-slate-400 dark:text-slate-500">—</span>}
                    </span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className="whitespace-nowrap text-[14.5px] font-bold text-brand-600 dark:text-brand-400">{netAPayer.toLocaleString('fr-FR')} Ar</span>
                  </td>
                  <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
                    <span className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[13px] font-semibold leading-tight ${employe.status === 'actif' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400' : getStatusColor(employe.status)}`}>
                      {getStatusIcon(employe.status)}
                      {statusDisplay}
                    </span>
                  </td>
                  <td className={`border-b px-1 py-2 align-middle text-right ${cellBorderColor}`} onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <button type="button" onClick={(event) => toggleMenu(employe.id, event)} title="Actions" aria-label={`Actions pour ${employe.prenom} ${employe.nom}`} aria-expanded={openMenuId === employe.id} className={`flex h-7 w-7 items-center justify-center rounded border transition-all duration-150 ${
                        openMenuId === employe.id
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

      {openMenuId !== null && currentEmploye && createPortal(
        <div
          className={`fixed z-[99999] w-[230px] overflow-hidden rounded-xl border-[0.5px] py-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.35)] ${isDark ? 'border-white/[0.10] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}
          style={{
            top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
            bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
            left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined,
            right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className={`border-b px-3 py-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
            <div className="min-w-0">
              <div className="max-w-[160px] truncate text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">{currentEmploye.prenom} {currentEmploye.nom}</div>
              <div className="mt-0.5 font-mono text-[12.5px] text-slate-400">ID #{String(currentEmploye.id).padStart(3, '0')}</div>
            </div>
          </div>

          {/* ⭐ Menu organizé: RH | Paie | Danger */}
          <div className="flex flex-col text-[14.5px] py-0.5">
            {/* ─── RH ─── */}
            <MenuButton
              icon={<Edit size={15} strokeWidth={2.2} />}
              label="Modifier"
              tone="sky"
              onMouseDown={(event) => handleMenuAction(() => onEdit(currentEmploye), event)}
            />

            {/* ⭐ "Gérer Congés" nesorina teto */}

            <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`} />

            {/* ─── PAIE ─── */}
            <MenuButton
              icon={<Banknote size={15} strokeWidth={2.2} />}
              label="Nouveau paiement"
              tone="emerald"
              onMouseDown={(event) => handleMenuAction(() => onNouveauPaiement?.(currentEmploye), event)}
            />

            <MenuButton
              icon={<History size={15} strokeWidth={2.2} />}
              label="Historique salaire"
              tone="purple"
              onMouseDown={(event) => handleMenuAction(() => onHistorique(currentEmploye), event)}
            />

            <MenuButton
              icon={<TrendingUp size={15} strokeWidth={2.2} />}
              label="Augmentation de salaire"
              tone="emerald"
              onMouseDown={(event) => handleMenuAction(() => onFisondrotana?.(currentEmploye), event)}
            />

            <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`} />

            {/* ─── DANGER ─── */}
            <MenuButton
              icon={<Trash2 size={15} strokeWidth={2.2} />}
              label="Supprimer"
              tone="danger"
              onMouseDown={(event) => handleMenuAction(() => onDelete(currentEmploye.id, currentEmploye.image), event)}
            />
          </div>
        </div>,
        document.body
      )}

      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
          <span><span className="font-semibold text-slate-900 dark:text-slate-100">{stats.total}</span> employé{stats.total > 1 ? 's' : ''}</span>
          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />
          <div className="flex flex-wrap items-center gap-1.5">
            {stats.actifs > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[13px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /><span>Actif</span><span className="text-slate-400 dark:text-slate-500">{stats.actifs}</span>
              </span>
            )}
            {stats.enConge > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[13px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /><span>En congé</span><span className="text-slate-400 dark:text-slate-500">{stats.enConge}</span>
              </span>
            )}
            {stats.inactifs > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[13px] font-medium leading-tight text-slate-600 dark:border-white/[0.10] dark:bg-[#0F172A] dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /><span>Inactif</span><span className="text-slate-400 dark:text-slate-500">{stats.inactifs}</span>
              </span>
            )}
          </div>
        </div>
        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">Gestion des employés</span>
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

export default memo(EmployesTable);