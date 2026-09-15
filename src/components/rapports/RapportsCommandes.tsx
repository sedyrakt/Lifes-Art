// src/components/rapports/RapportsCommandes.tsx
// ⭐ FIX: Grid columns aligné (N° | Client | Total | Statut)
// ⭐ FIX: Statut badge tsy ho tapaka intsony
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur les autres Tables
// ⭐ FONT SIZE: h2 15px, header 12.5px, cells 14px, footer 13px

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface Commande {
  id: number;
  commande_numero?: string;
  numero?: string;
  client_nom: string;
  date_commande: string;
  total_ttc: number;
  statut: string;
  nb_produits?: number;
}

interface RapportsCommandesProps {
  commandes?: Commande[];
}

const RapportsCommandes: React.FC<RapportsCommandesProps> = ({ commandes = [] }) => {
  const { isDark } = useTheme();

  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cardBg = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const shadow = isDark ? 'shadow-[0_12px_40px_rgba(0,0,0,0.18)]' : 'shadow-[0_1px_2px_rgba(79,70,229,0.04)]';

  const getStatusBadge = (statut: string) => {
    const normalized = statut?.toLowerCase().trim();
    switch (normalized) {
      case 'payé': case 'paye':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30';
      case 'partiel':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30';
      case 'non payé': case 'non paye':
        return 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30';
      case 'livrée': case 'livree':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30';
      case 'confirmée': case 'confirmee':
        return 'bg-brand-500/10 text-brand-600 border-brand-500/20 dark:bg-brand-500/15 dark:text-brand-400 dark:border-brand-500/30';
      case 'en attente':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30';
      case 'annulée': case 'annulee':
        return 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30';
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (!commandes || commandes.length === 0) {
    return (
      <div className={`relative h-full overflow-hidden rounded-xl border-[0.5px] ${borderColor} ${cardBg} ${shadow}`}>
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
          {/* ⭐ Empty title : 13.5px → 15px */}
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Aucune commande récente</h3>
          {/* ⭐ Empty text : 12.5px → 13.5px */}
          <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">Les commandes apparaîtront ici une fois qu'elles auront été enregistrées.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full overflow-hidden rounded-xl border-[0.5px] ${borderColor} ${cardBg} ${shadow}`}>
      <div className="relative">
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${borderColor} px-4 py-3`}>
          {/* ⭐ h2 : 14px → 15px */}
          <h2 className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">Commandes récentes</h2>
          {/* ⭐ Badge : 11.5px → 12.5px */}
          <span className="text-[12.5px] text-slate-400 dark:text-slate-500">Dernières {commandes.length}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[560px]">
            {/* Header row — ⭐ 11.5px → 12.5px */}
            <div className={`grid grid-cols-[minmax(130px,1.2fr)_minmax(120px,1fr)_130px_90px] gap-2 border-b ${borderColor} px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-500`}>
              <span>N° Commande</span>
              <span>Client</span>
              <span className="text-right">Total</span>
              <span className="text-right">Statut</span>
            </div>

            {/* Data rows */}
            <div>
              {commandes.map((cmd) => {
                const statusBadge = getStatusBadge(cmd.statut);
                const numeroAffichage = cmd.commande_numero || cmd.numero || `#${String(cmd.id).padStart(4, '0')}`;

                return (
                  <div
                    key={cmd.id}
                    className={`grid grid-cols-[minmax(130px,1.2fr)_minmax(120px,1fr)_130px_90px] gap-2 border-b ${borderColor} px-4 py-2.5 last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.025]`}
                  >
                    {/* ⭐ N° : 13px → 14px */}
                    <span className="self-center truncate text-[14px] font-medium leading-[1.3] text-slate-900 dark:text-slate-100">
                      {numeroAffichage}
                    </span>
                    {/* ⭐ Client : 12.5px → 13.5px */}
                    <span className="self-center truncate text-[13.5px] leading-[1.3] text-slate-700 dark:text-slate-400">
                      {cmd.client_nom || 'Client inconnu'}
                    </span>
                    {/* ⭐ Total : 12.5px → 13.5px */}
                    <span className="self-center text-right text-[13.5px] font-semibold leading-[1.3] text-slate-700 dark:text-slate-200">
                      {`${Number(cmd.total_ttc || 0).toLocaleString('fr-FR')} Ar`}
                    </span>
                    {/* ⭐ Statut badge : 11px → 12px, px-1.5 → px-2 py-1 */}
                    <span className={`self-center justify-self-end rounded border px-2 py-1 text-[12px] font-semibold leading-[1.3] ${statusBadge}`}>
                      {cmd.statut || '—'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer — ⭐ 12px → 13px */}
            <div className={`flex items-center justify-between border-t ${borderColor} bg-slate-50/30 dark:bg-white/[0.02] px-4 py-2.5`}>
              <span className="text-[13px] font-medium leading-[1.3] text-slate-500 dark:text-slate-400">
                {commandes.length} commande{commandes.length > 1 ? 's' : ''} affichée{commandes.length > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 text-[13px] font-medium leading-[1.3] text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                À jour
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(79,70,229,0.25); border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(79,70,229,0.45); }
      `}</style>
    </div>
  );
};

export default RapportsCommandes;