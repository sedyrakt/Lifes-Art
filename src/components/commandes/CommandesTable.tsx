// src/components/commandes/CommandesTable.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: "Dans X j" tsy aseho avo roa (label + detail mitovy)

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Commande } from '../../types/commandes';
import { CheckCircle2, Receipt, Eye, Trash2, ShoppingBag, Plus } from 'lucide-react';

interface GlobalStats {
  total: number;
  totalCA: number;
  totalPaye: number;
  totalDette: number;
  nbCommandesNonPayees: number;
  nbCommandesPayees: number;
  nbCommandesPartielles: number;
  nbCommandesEnRetard: number;
  totalItems: number;
}

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
  globalStats?: GlobalStats;
  hasActiveFilter?: boolean;
}

interface MenuPosition { top?: number; bottom?: number; left?: number; right?: number; }
interface ParsedProduct { nom: string; quantite: number; code?: string; image?: string; id?: number; }

interface DeadlineInfo {
  overdue: boolean;
  label: string;
  detail: string;
  date: Date | null;
}

const MENU_WIDTH = 220;
const MENU_HEIGHT = 220;
const MENU_PADDING = 10;

const DEADLINE_REFRESH_CLOSE_MS = 1_000;
const DEADLINE_REFRESH_FAR_MS = 30_000;

const normalizePaiementStatus = (statut: string): string => {
  const normalized = String(statut || '').trim().toLowerCase();
  switch (normalized) {
    case 'payé': case 'paye': case 'paid': case 'payee': case 'payé complet': case 'paye complet': return 'Payé';
    case 'partiel': case 'partial': case 'partielle': case 'partiellement payé': case 'partiellement paye': return 'Partiel';
    case 'non payé': case 'non paye': case 'unpaid': case 'non_payé': case 'non_paye': case 'impayé': case 'impaye': return 'Non payé';
    default: return 'Non payé';
  }
};

const parseDeadline = (deadline?: string | null): Date | null => {
  if (!deadline) return null;
  const value = String(deadline).trim();
  if (!value) return null;

  const dateTimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (dateTimeMatch) {
    const [, y, m, d, hh, mm, ss = '0'] = dateTimeMatch;
    const result = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
    return Number.isNaN(result.getTime()) ? null : result;
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    const result = new Date(Number(y), Number(m) - 1, Number(d), 23, 59, 59, 999);
    return Number.isNaN(result.getTime()) ? null : result;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatLiveDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) {
    const remSeconds = totalSeconds % 60;
    if (totalMinutes < 5 && remSeconds > 0) return `${totalMinutes} min ${remSeconds} sec`;
    return `${totalMinutes} min`;
  }
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) {
    const remMinutes = totalMinutes % 60;
    if (totalHours < 2 && remMinutes > 0) return `${totalHours} h ${remMinutes} min`;
    return `${totalHours} h`;
  }
  const totalDays = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  if (totalDays < 2 && remHours > 0) return `${totalDays} j ${remHours} h`;
  return `${totalDays} j`;
};

const getDeadlineInfo = (dateLimite?: string | null, nowMs: number = Date.now()): DeadlineInfo => {
  const deadline = parseDeadline(dateLimite);
  if (!deadline) return { overdue: false, label: '—', detail: '', date: null };

  const diffMs = deadline.getTime() - nowMs;

  if (diffMs <= 0) {
    const lateMs = Math.abs(diffMs);
    return {
      overdue: true,
      label: 'Dépassé',
      detail: `${formatLiveDuration(lateMs)} de retard`,
      date: deadline,
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  let label = 'À venir';
  if (totalMinutes >= 60 * 24) {
    const totalDays = Math.floor(totalMinutes / (60 * 24));
    if (totalDays === 1) label = 'Demain';
    else label = `Dans ${totalDays} j`;
  }

  return {
    overdue: false,
    label,
    detail: `Dans ${formatLiveDuration(diffMs)}`,
    date: deadline,
  };
};

const isOverdue = (commande: any, nowMs: number = Date.now()): boolean => {
  if (!commande) return false;
  const statut = normalizePaiementStatus(commande.statut_paiement);
  if (statut === 'Payé') return false;
  const restant = Number(commande.montant_restant || 0);
  if (restant <= 0) return false;
  return getDeadlineInfo(commande.date_limite_paiement, nowMs).overdue;
};

const formatDate = (dateValue?: string | Date | null): string => {
  if (!dateValue) return '—';
  if (dateValue instanceof Date) {
    if (Number.isNaN(dateValue.getTime())) return '—';
    return dateValue.toLocaleDateString('fr-FR');
  }
  const value = String(dateValue).trim();
  if (!value) return '—';
  const deadline = parseDeadline(value);
  if (deadline) return deadline.toLocaleDateString('fr-FR');
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('fr-FR');
};

const parseProducts = (produits?: string | any[]): ParsedProduct[] => {
  if (!produits) return [];
  if (Array.isArray(produits)) {
    return produits.map(item => {
      if (typeof item === 'string') {
        const match = item.match(/^(.*?)\s*\(x(\d+)\)\s*$/);
        if (!match) return { nom: item, quantite: 1 };
        return { nom: match[1].trim(), quantite: Number(match[2]) || 1 };
      }
      return { nom: item.name || item.nom || 'Produit', quantite: Number(item.quantity || item.quantite || 1) };
    });
  }
  if (typeof produits === 'string' && produits.trim().startsWith('[')) {
    try {
      const arr = JSON.parse(produits);
      return parseProducts(arr);
    } catch (e) { /* tsy JSON */ }
  }
  const str = String(produits);
  if (!str.trim()) return [];
  return str.split(',').map(v => v.trim()).filter(Boolean).map(item => {
    const match = item.match(/^(.*?)\s*\(x(\d+)\)\s*$/);
    if (!match) return { nom: item, quantite: 1 };
    return { nom: match[1].trim(), quantite: Number(match[2]) || 1 };
  });
};

const SkeletonRow = memo(({ isDark }: { isDark: boolean }) => {
  const skeleton = isDark ? 'animate-pulse rounded-sm bg-white/[0.07]' : 'animate-pulse rounded-sm bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-100';
  return (
    <tr className="h-[58px]">
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-4 w-4`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-16`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className="space-y-1.5"><div className={`${skeleton} h-4 w-24`} /><div className={`${skeleton} h-3 w-16`} /></div></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-4 w-16`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-4 w-28`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-20`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-20`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-16`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-20`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-16`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-24`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-16`} /></td>
      <td className={`border-b px-1.5 py-2 ${border}`}><div className={`${skeleton} h-5 w-20`} /></td>
      <td className={`border-b px-1 py-2 text-right ${border}`}><div className={`${skeleton} h-7 w-7 ml-auto`} /></td>
    </tr>
  );
});
SkeletonRow.displayName = 'SkeletonRow';

interface CommandRowProps {
  commande: any;
  isDark: boolean;
  isSelected: boolean;
  products: ParsedProduct[];
  hiddenProducts: number;
  statutPaiement: string;
  nowMs: number;
  onSelectOne?: (id: number, checked: boolean) => void;
  onView: (commande: any) => void;
  onGenerateFacture: (commande: any) => void;
  toggleMenu: (id: number, event: React.MouseEvent<HTMLButtonElement>) => void;
  openMenuId: number | null;
  cellBorderColor: string;
  getStatutPaiementStyle: (statut: string) => string;
  firstRowShadow: string;
}

const CommandRow = memo(({
  commande, isDark, isSelected, products, hiddenProducts, statutPaiement,
  nowMs, onSelectOne, onView, onGenerateFacture, toggleMenu, openMenuId,
  cellBorderColor, getStatutPaiementStyle, firstRowShadow,
}: CommandRowProps) => {
  const isPaid = statutPaiement === 'Payé';
  const montantRestant = Number(commande.montant_restant || 0);

  const deadlineInfo = useMemo(() => {
    if (isPaid || montantRestant <= 0) {
      return { overdue: false, label: 'Payé', detail: '', date: null } as DeadlineInfo;
    }
    return getDeadlineInfo(commande.date_limite_paiement, nowMs);
  }, [isPaid, montantRestant, commande.date_limite_paiement, nowMs]);

  const overdue = !isPaid && montantRestant > 0 && deadlineInfo.overdue;

  const fraisLivraison = Number(commande.frais_livraison || 0);
  const livraisonOui = fraisLivraison > 0;

  const renderEcheanceBadge = () => {
    // ═══ CAS 1 : Payé ou reste = 0 ═══
    if (isPaid || montantRestant <= 0) {
      return (
        <div className="flex flex-col items-start gap-0.5">
          <span className="inline-flex w-fit items-center rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[13.5px] font-semibold leading-[1.35] text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
            Payé
          </span>
          {commande.date_limite_paiement && (
            <span className="text-[12.5px] leading-[1.3] text-slate-400 dark:text-slate-500">
              {formatDate(commande.date_limite_paiement)}
            </span>
          )}
        </div>
      );
    }

    // ═══ CAS 2 : Tsy misy date limite ═══
    if (!commande.date_limite_paiement) {
      return <span className="text-[14.5px] text-slate-400 dark:text-slate-500">—</span>;
    }

    // ═══ CAS 3 : Overdue ═══
    if (overdue) {
      return (
        <div className="flex flex-col items-start gap-0.5">
          <span className="inline-flex w-fit items-center rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[13.5px] font-semibold leading-[1.35] text-red-600 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400">
            Dépassé
          </span>
          <span className="text-[12.5px] font-semibold text-red-500 dark:text-red-400 leading-[1.3] tabular-nums">
            {deadlineInfo.detail}
          </span>
        </div>
      );
    }

    // ═══ CAS 4 : À venir (non-overdue) ═══
    const showDetail = Boolean(deadlineInfo.detail) && deadlineInfo.detail !== deadlineInfo.label;

    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="inline-flex w-fit items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[13.5px] font-semibold leading-[1.35] text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
          {deadlineInfo.label}
        </span>
        {showDetail && (
          <span className="text-[12.5px] font-medium text-amber-600 dark:text-amber-400 leading-[1.3] tabular-nums">
            {deadlineInfo.detail}
          </span>
        )}
      </div>
    );
  };

  return (
    <tr onClick={() => onView(commande)} className={`group h-[58px] cursor-pointer transition-colors duration-150 ${isSelected ? (isDark ? 'bg-brand-500/[0.08]' : 'bg-brand-50') : isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'} ${overdue ? (isDark ? 'bg-red-500/[0.045]' : 'bg-red-50/50') : ''} ${firstRowShadow}`}>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={isSelected} onChange={e => onSelectOne?.(commande.id, e.target.checked)} className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500" aria-label={`Sélectionner ${commande.numero}`} />
      </td>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span className="inline-flex max-w-[110px] truncate rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[13.5px] font-semibold leading-tight text-brand-600 dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">{commande.numero}</span>
      </td>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-1">
            <span className="max-w-[110px] truncate text-[14.5px] font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">{commande.client_nom || 'Client inconnu'}</span>
            {overdue && (
              <span className="inline-flex shrink-0 items-center rounded border border-red-300/60 bg-red-100 px-1 py-0.5 text-[11px] font-bold uppercase tracking-wide leading-tight text-red-600 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400">
                Retard
              </span>
            )}
          </div>
          {commande.client_telephone ? (
            <div className="mt-0.5 max-w-[110px] truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">{commande.client_telephone}</div>
          ) : (
            <span className="mt-0.5 block text-[13px] leading-[1.3] text-slate-400">—</span>
          )}
        </div>
      </td>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span className="whitespace-nowrap text-[13.5px] font-medium text-slate-700 dark:text-slate-200">{formatDate(commande.date_commande)}</span>
      </td>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <div className="flex min-w-0 max-w-[160px] items-center">
          {products.length === 0 ? <span className="text-[14.5px] text-slate-400">—</span> : (
            <div className="flex min-w-0 items-center gap-1">
              <span className="max-w-[130px] truncate text-[14.5px] font-semibold text-slate-900 dark:text-slate-100" title={products.map(p => `${p.nom} (x${p.quantite})`).join(', ')}>
                {products[0].nom}
              </span>
              {hiddenProducts > 0 && (
                <span className="inline-flex shrink-0 items-center rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[12.5px] font-bold leading-tight text-brand-600 dark:border-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400">
                  +{hiddenProducts}
                </span>
              )}
            </div>
          )}
        </div>
      </td>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span className="whitespace-nowrap text-[14.5px] font-bold text-slate-900 dark:text-slate-100">{Number(commande.total_ttc || 0).toLocaleString('fr-FR')} Ar</span>
      </td>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span className="whitespace-nowrap text-[14.5px] font-bold text-emerald-600 dark:text-emerald-400">{Number(commande.montant_paye || 0).toLocaleString('fr-FR')} Ar</span>
      </td>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span className={`inline-flex items-center whitespace-nowrap rounded border px-1.5 py-0.5 text-[13px] font-semibold leading-tight ${getStatutPaiementStyle(statutPaiement)}`}>{statutPaiement}</span>
      </td>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span className={`whitespace-nowrap text-[14.5px] font-bold ${overdue ? 'text-red-600 dark:text-red-400' : 'text-brand-600 dark:text-brand-400'}`}>{montantRestant.toLocaleString('fr-FR')} Ar</span>
      </td>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span className="whitespace-nowrap text-[14.5px] font-medium text-slate-700 dark:text-slate-300">{commande.mode_paiement || 'Espèces'}</span>
      </td>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span className="whitespace-nowrap text-[14.5px] font-medium leading-[1.3] text-slate-700 dark:text-slate-300">
          {commande.modalite_paiement || 'Immediat'}
        </span>
      </td>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`}>
        <span
          className={`inline-flex w-fit items-center gap-1 rounded border px-1.5 py-0.5 text-[12px] font-bold uppercase leading-[1.3] tracking-wide ${
            livraisonOui
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-slate-400'
          }`}
        >
          {livraisonOui ? 'Oui' : 'Non'}
        </span>
      </td>
      <td className={`border-b px-1.5 py-2 align-middle ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
        {renderEcheanceBadge()}
      </td>
      <td className={`border-b px-1 py-2 align-middle text-right ${cellBorderColor}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-end">
          <button type="button" onClick={e => toggleMenu(commande.id, e)} title="Actions" aria-label={`Actions pour ${commande.numero}`} aria-expanded={openMenuId === commande.id} className={`flex h-7 w-7 items-center justify-center rounded border transition-all duration-150 ${
            openMenuId === commande.id
              ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400'
              : 'border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-200 hover:text-brand-600 dark:border-transparent dark:bg-transparent dark:text-slate-400 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 dark:hover:text-slate-200'
          }`}>
            <span className="text-[14.5px] font-bold tracking-widest">...</span>
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
  globalStats,
  hasActiveFilter = false,
}) => {
  const { isDark } = useTheme();
  const tableBackground = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const tableSecondaryBackground = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cellBorderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const headerBorderColor = isDark ? 'border-white/[0.15]' : 'border-slate-200';

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({});

  const [nowMs, setNowMs] = useState(() => Date.now());

  const hasCloseDeadline = useMemo(() => {
    if (!commandes || commandes.length === 0) return false;
    const now = Date.now();
    return commandes.some((c: any) => {
      const statut = normalizePaiementStatus(c.statut_paiement);
      if (statut === 'Payé') return false;
      if (Number(c.montant_restant || 0) <= 0) return false;
      const d = parseDeadline(c.date_limite_paiement);
      if (!d) return false;
      const diff = d.getTime() - now;
      return diff > 0 && diff < 60 * 60 * 1000;
    });
  }, [commandes, nowMs]);

  useEffect(() => {
    const interval = hasCloseDeadline
      ? DEADLINE_REFRESH_CLOSE_MS
      : DEADLINE_REFRESH_FAR_MS;
    const t = window.setInterval(() => setNowMs(Date.now()), interval);
    return () => window.clearInterval(t);
  }, [hasCloseDeadline]);

  const safeSelectedIds = selectedIds || new Set<number>();
  const allSelected = commandes.length > 0 && commandes.every(c => safeSelectedIds.has(c.id));
  const someSelected = safeSelectedIds.size > 0 && !allSelected;

  const currentCommande = useMemo(() => (openMenuId === null ? null : commandes.find(c => c.id === openMenuId) ?? null), [commandes, openMenuId]);

  const stats = useMemo(() => {
    if (!hasActiveFilter && globalStats && globalStats.total > 0) {
      return {
        total: Number(globalStats.total || 0),
        totalMontant: Number(globalStats.totalCA || 0),
        totalPaye: Number(globalStats.totalPaye || 0),
        totalReste: Number(globalStats.totalDette || 0),
        nonPayees: Number(globalStats.nbCommandesNonPayees || 0),
        partiel: Number(globalStats.nbCommandesPartielles || 0),
        payees: Number(globalStats.nbCommandesPayees || 0),
        enRetard: Number(globalStats.nbCommandesEnRetard || 0),
      };
    }

    const total = totalItems ?? commandes.length;
    const nonPayees = commandes.filter(c => normalizePaiementStatus(c.statut_paiement) === 'Non payé').length;
    const partiel = commandes.filter(c => normalizePaiementStatus(c.statut_paiement) === 'Partiel').length;
    const payees = commandes.filter(c => normalizePaiementStatus(c.statut_paiement) === 'Payé').length;
    const enRetard = commandes.filter(c => isOverdue(c, nowMs)).length;
    const totalMontant = commandes.reduce((sum, c) => sum + Number(c.total_ttc || 0), 0);
    const totalReste = commandes.reduce((sum, c) => sum + Number(c.montant_restant || 0), 0);
    const totalPaye = commandes.reduce((sum, c) => sum + Number(c.montant_paye || 0), 0);
    return { total, nonPayees, partiel, payees, enRetard, totalMontant, totalReste, totalPaye };
  }, [commandes, totalItems, nowMs, globalStats, hasActiveFilter]);

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
      <div className={`flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-14 text-center shadow-sm ${tableBackground} ${borderColor}`}>
        <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-slate-400">
          <ShoppingBag size={30} strokeWidth={1.8} />
        </div>
        <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">Aucune commande trouvée</h3>
        <p className="mt-2 max-w-[390px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">
          Aucune commande ne correspond aux critères actuels.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          <Plus size={17} />
          Nouvelle commande
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-[0.5px] shadow-sm ${tableBackground} ${borderColor}`}>
      {safeSelectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 ${isDark ? 'border-white/[0.08] bg-brand-500/[0.06]' : 'border-brand-100 bg-brand-50'}`}>
          <span className="text-[14px] font-semibold text-brand-600 dark:text-brand-400">
            {safeSelectedIds.size} commande{safeSelectedIds.size > 1 ? 's' : ''} sélectionnée{safeSelectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onBulkDelete?.([...safeSelectedIds])}
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
        <table className={`w-full min-w-[1160px] table-fixed border-collapse text-left ${borderColor}`}>
          <thead className={`sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/97' : 'bg-slate-50/97'}`}>
            <tr className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400">
              <th className={`w-[36px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>
                <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected; }} onChange={e => onSelectAll?.(e.target.checked)} className="h-[14px] w-[14px] cursor-pointer rounded accent-brand-500" aria-label="Sélectionner toutes les commandes" />
              </th>
              <th className={`w-[100px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>N°</th>
              <th className={`w-[130px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Client</th>
              <th className={`w-[90px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Date</th>
              <th className={`w-[140px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Produits</th>
              <th className={`w-[110px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Total TTC</th>
              <th className={`w-[110px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Payé</th>
              <th className={`w-[80px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Statut</th>
              <th className={`w-[110px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Reste</th>
              <th className={`w-[100px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Mode</th>
              <th className={`w-[110px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Modalité</th>
              <th className={`w-[80px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Livraison</th>
              <th className={`w-[120px] border-b px-1.5 py-2.5 align-middle ${headerBorderColor}`}>Échéance</th>
              <th className={`w-[54px] border-b px-1.5 py-2.5 text-right align-middle ${headerBorderColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableBackground}>
            {loading
              ? Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} isDark={isDark} />)
              : commandes.map((commande, index) => {
                  const products = parseProducts(commande.produits_noms);
                  const hiddenProducts = Math.max(0, products.length - 1);
                  const statutPaiement = normalizePaiementStatus(commande.statut_paiement);
                  const isFirstRow = index === 0;
                  const firstRowShadow = isFirstRow
                    ? 'shadow-[inset_0_1px_0_0_rgba(107,114,128,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(107,114,128,0.3)]'
                    : '';
                  return (
                    <CommandRow
                      key={commande.id}
                      commande={commande}
                      isDark={isDark}
                      isSelected={safeSelectedIds.has(commande.id)}
                      products={products}
                      hiddenProducts={hiddenProducts}
                      statutPaiement={statutPaiement}
                      nowMs={nowMs}
                      onSelectOne={onSelectOne}
                      onView={onView}
                      onGenerateFacture={onGenerateFacture}
                      toggleMenu={toggleMenu}
                      openMenuId={openMenuId}
                      cellBorderColor={cellBorderColor}
                      getStatutPaiementStyle={getStatutPaiementStyle}
                      firstRowShadow={firstRowShadow}
                    />
                  );
                })}
          </tbody>
        </table>
      </div>

      {openMenuId !== null && currentCommande && createPortal(
        <div
          className={`fixed z-[99999] w-[230px] overflow-hidden rounded-xl border-[0.5px] py-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.35)] ${isDark ? 'border-white/[0.10] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}
          style={{
            top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
            bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
            left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined,
            right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined,
          }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <div className={`border-b px-3 py-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
            <div className="min-w-0">
              <div className="max-w-[160px] truncate text-[14.5px] font-semibold text-slate-900 dark:text-slate-100">{currentCommande.numero}</div>
              <div className="mt-0.5 font-mono text-[12.5px] text-slate-400">ID #{currentCommande.id}</div>
            </div>
          </div>

          <div className="flex flex-col text-[14.5px] py-0.5">
            {normalizePaiementStatus(currentCommande.statut_paiement) !== 'Payé' && (
              <button
                type="button"
                onMouseDown={e => handleMenuAction(() => onUpdatePaiement?.(currentCommande.id, { montant_paye: Number(currentCommande.total_ttc || 0), statut_paiement: 'Payé' }), e)}
                className="group flex w-full items-center gap-2.5 px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-500/10"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 size={15} strokeWidth={2.2} />
                </span>
                <span>Marquer comme payée</span>
              </button>
            )}

            <button
              type="button"
              onMouseDown={e => handleMenuAction(() => onGenerateFacture(currentCommande), e)}
              className="group flex w-full items-center gap-2.5 px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-brand-500/10"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 shrink-0">
                <Receipt size={15} strokeWidth={2.2} />
              </span>
              <span>Générer le ticket</span>
            </button>

            <button
              type="button"
              onMouseDown={e => handleMenuAction(() => onView(currentCommande), e)}
              className="group flex w-full items-center gap-2.5 px-3 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-sky-500/10"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400 shrink-0">
                <Eye size={15} strokeWidth={2.2} />
              </span>
              <span>Voir les détails</span>
            </button>

            <div className={`mx-2 my-1 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`} />

            <button
              type="button"
              onMouseDown={e => handleMenuAction(() => onDelete(currentCommande), e)}
              className="group flex w-full items-center gap-2.5 px-3 py-2 text-left font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400 shrink-0">
                <Trash2 size={15} strokeWidth={2.2} />
              </span>
              <span>Supprimer</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ⭐ Footer — badges colorés */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2.5 ${tableSecondaryBackground} ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.total}</span> commande{stats.total > 1 ? 's' : ''}
          </span>
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.totalMontant.toLocaleString('fr-FR')} Ar</span> Total
          </span>
          <span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.totalPaye.toLocaleString('fr-FR')} Ar</span> Payé
          </span>

          <span className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-white/[0.12]" />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Payé : {stats.payees}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              Partiel : {stats.partiel}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[13px] font-semibold leading-tight text-red-600 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400" />
              Non payé : {stats.nonPayees}
            </span>

            {stats.enRetard > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-red-300/60 bg-red-100 px-2 py-0.5 text-[13px] font-bold leading-tight text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-600 dark:bg-red-400" />
                En retard : {stats.enRetard}
              </span>
            )}
          </div>
        </div>

        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">Gestion des commandes</span>
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
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  );
};

export default memo(CommandesTable);