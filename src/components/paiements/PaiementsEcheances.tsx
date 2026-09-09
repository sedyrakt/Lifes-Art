import React, { useMemo, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Eye, Trash2, Layers, CheckSquare } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { PaiementEmploye, EmployePaiement } from './PaiementsModalForm';
import PaiementsViewModal from './PaiementsViewModal'; 

interface Props {
  paiements: PaiementEmploye[];
  employes?: EmployePaiement[];
  onRefresh?: () => void;
  onViewPaiement?: (p: PaiementEmploye) => void;
}

const ITEMS_PER_PAGE = 10;

function toNumber(v: unknown, fallback = 0): number { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function formatAriary(v: unknown): string { return `${Math.round(toNumber(v)).toLocaleString('fr-FR')} Ar`; }

function parseDateSafe(value?: string | null): Date {
  if (!value) return new Date();
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return new Date();
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatDateFr(value?: string | null): string {
  const d = parseDateSafe(value);
  return d.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function getEmployeeName(p: PaiementEmploye): string {
  return `${p.employe_prenom ?? ''} ${p.employe_nom ?? ''}`.trim() || 'Employé';
}

function getPeriodLabel(p: PaiementEmploye): string {
  const m = Number(p.mois), y = Number(p.annee);
  if (m < 1 || m > 12 || !y) return '';
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${months[m-1]} ${y}`;
}

export default function PaiementsEcheances({ paiements = [], onRefresh, onViewPaiement }: Props) {
  const { isDark } = useTheme();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedPaiement, setSelectedPaiement] = useState<PaiementEmploye | null>(null);

  const echeances = useMemo(() => {
    return paiements.filter(p => {
      const statut = (p.statut || '').toLowerCase();
      if (statut === 'payé' || statut === 'paye' || statut === 'paid') return false;
      const date = parseDateSafe(p.date_paiement);
      return date <= today;
    });
  }, [paiements, today]);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const totalPages = Math.max(1, Math.ceil(echeances.length / ITEMS_PER_PAGE));
  const displayed = echeances.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalEnRetard = echeances.reduce((sum, p) => sum + toNumber(p.montant), 0);

  const allSelected = displayed.length > 0 && displayed.every(p => p.id && selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(displayed.map(p => p.id).filter(id => id != null) as number[]));
    else setSelectedIds(new Set());
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleBulkDelete = (ids: number[]) => {
    if (onRefresh) onRefresh();
    setSelectedIds(new Set());
  };

  const handleBulkDeleteSelected = () => handleBulkDelete(Array.from(selectedIds));
  const handleBulkDeletePage = () => {
    const ids = displayed.map(p => p.id).filter(id => id != null) as number[];
    handleBulkDelete(ids);
  };
  const handleBulkDeleteAll = () => {
    const ids = echeances.map(p => p.id).filter(id => id != null) as number[];
    handleBulkDelete(ids);
  };

  // ⭐ Colors Standard
  const bgColor = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <AlertCircle size={18} className="text-warning-500" />
        <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">Échéances à encaisser</h2>
        <span className="ml-auto text-[13px] font-medium text-slate-500 dark:text-slate-400">
          Total : <b className="text-[15px] text-slate-800 dark:text-slate-100">{formatAriary(totalEnRetard)}</b>
        </span>
      </div>

      {selectedIds.size > 0 && (
        <div className={`mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50'}`}>
          <span className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">{selectedIds.size} sélectionné(s)</span>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleBulkDeleteSelected} className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-[14px] font-semibold text-white hover:bg-red-600">
              <Trash2 size={15} className="mr-1" /> Supprimer sélection
            </button>
            <button onClick={handleBulkDeletePage} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/[0.12] dark:text-slate-300">
              <Layers size={15} className="mr-1" /> Supprimer page
            </button>
            <button onClick={handleBulkDeleteAll} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/[0.12] dark:text-slate-300">
              <Trash2 size={15} className="mr-1" /> Supprimer tout
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/[0.12] dark:text-slate-300">
              <CheckSquare size={15} className="mr-1" /> Désélectionner
            </button>
          </div>
        </div>
      )}

      {echeances.length === 0 ? (
        <div className="py-10 text-center text-[15px] text-slate-500 dark:text-slate-400">Aucune échéance en retard</div>
      ) : (
        <>
          <div className={`mb-2 flex items-center justify-between rounded-t-lg border px-3 py-2 ${bgColor} ${borderColor}`}>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected; }} onChange={e => handleSelectAll(e.target.checked)} className="h-4 w-4 cursor-pointer rounded accent-brand-500" />
              <span className="text-[13px] font-semibold uppercase text-slate-500 dark:text-slate-400">Tout sélectionner (cette page)</span>
            </div>
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{echeances.length} échéance(s)</span>
          </div>

          <div className="space-y-2">
            {displayed.map(p => {
              const id = p.id ?? 0;
              const checked = selectedIds.has(id);
              return (
                <div key={id || `${p.employe_id}-${p.mois}-${p.annee}`} className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${checked ? 'bg-brand-50/50 dark:bg-brand-500/10' : bgColor} hover:bg-slate-50 dark:hover:bg-white/[0.02]`} style={{ borderColor }}>
                  <div className="flex items-center gap-3">
                    {id > 0 && <input type="checkbox" checked={checked} onChange={e => handleSelectOne(id, e.target.checked)} className="h-4 w-4 cursor-pointer rounded accent-brand-500" />}
                    <Clock size={16} className="text-warning-500" />
                    <div>
                      <div className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{getEmployeeName(p)}</div>
                      <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400">
                        <span>{p.reference || 'Sans réf'}</span>
                        <span>·</span>
                        <span>{formatDateFr(p.date_paiement)}</span>
                        {getPeriodLabel(p) && (
                          <><span>·</span><span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium dark:bg-white/[0.05]">Période: {getPeriodLabel(p)}</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{formatAriary(p.montant)}</span>
                    <button onClick={() => setSelectedPaiement(p)} className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm hover:bg-brand-600">
                      <Eye size={14} className="mr-1" /> Voir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={`mt-4 flex items-center justify-between rounded-lg border px-3 py-2 ${bgColor} ${borderColor}`}>
              <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Page {currentPage} / {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 dark:border-white/[0.12] dark:text-slate-400"><ChevronLeft size={15} /></button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 dark:border-white/[0.12] dark:text-slate-400"><ChevronRight size={15} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedPaiement && (
        <PaiementsViewModal isOpen={!!selectedPaiement} paiement={selectedPaiement} onClose={() => setSelectedPaiement(null)} isDark={isDark} />
      )}
    </div>
  );
}