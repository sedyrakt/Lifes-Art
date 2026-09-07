// src/components/rapports/RapportsCommandes.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: DARK MODE BG = #0F172A
// ⭐ FIX: Statut miaraka amin'ny fond couleur (Payé = Vert, Partiel = Amber, Non payé = Mena)
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

interface RapportsCommandesProps { commandes?: Commande[]; }

const RapportsCommandes: React.FC<RapportsCommandesProps> = ({ commandes = [] }) => {
  const { isDark } = useTheme();

  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const cardBg = isDark ? 'bg-[#0F172A]' : 'bg-white'; // ⭐ FIX: dark bg #0F172A
  const shadow = isDark ? 'shadow-[0_12px_40px_rgba(0,0,0,0.18)]' : 'shadow-[0_1px_2px_rgba(79,70,229,0.04)]';

  const getStatusBadge = (statut: string) => {
    const normalized = statut?.toLowerCase().trim();
    switch (normalized) {
      case 'payé': case 'paye':
        return 'bg-success-500/10 text-success-600 border-success-500/20 dark:bg-success-500/15 dark:text-success-400 dark:border-success-500/30';
      case 'partiel':
        return 'bg-warning-500/10 text-warning-600 border-warning-500/20 dark:bg-warning-500/15 dark:text-warning-400 dark:border-warning-500/30';
      case 'non payé': case 'non paye':
        return 'bg-danger-500/10 text-danger-600 border-danger-500/20 dark:bg-danger-500/15 dark:text-danger-400 dark:border-danger-500/30';
      case 'livrée': case 'livree':
        return 'bg-success-500/10 text-success-600 border-success-500/20 dark:bg-success-500/15 dark:text-success-400 dark:border-success-500/30';
      case 'confirmée': case 'confirmee':
        return 'bg-brand-500/10 text-brand-600 border-brand-500/20 dark:bg-brand-500/15 dark:text-brand-400 dark:border-brand-500/30';
      case 'en attente':
        return 'bg-warning-500/10 text-warning-600 border-warning-500/20 dark:bg-warning-500/15 dark:text-warning-400 dark:border-warning-500/30';
      case 'annulée': case 'annulee':
        return 'bg-danger-500/10 text-danger-600 border-danger-500/20 dark:bg-danger-500/15 dark:text-danger-400 dark:border-danger-500/30';
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
      <div className={`relative h-full overflow-hidden rounded-xl border ${borderColor} ${cardBg} ${shadow}`}>
        <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
          <h3 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">Aucune commande récente</h3>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">Les commandes apparaîtront ici une fois qu'elles auront été enregistrées.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full overflow-hidden rounded-xl border ${borderColor} ${cardBg} ${shadow}`}>
      <div className="relative">
        <div className={`flex items-center justify-between border-b ${borderColor} px-4 py-3.5`}>
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">Commandes récentes</h2>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Dernières {commandes.length}</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[600px]">
            <div className={`grid grid-cols-[minmax(180px,1.4fr)_100px_125px_100px] gap-2 border-b ${borderColor} px-4 py-2.5 text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500`}>
              <span>N° Commande</span>
              <span className="text-right">Client</span>
              <span className="text-right">Total</span>
              <span className="text-right">Statut</span>
            </div>

            <div>
              {commandes.map((cmd, index) => {
                const statusBadge = getStatusBadge(cmd.statut);
                const numeroAffichage = cmd.commande_numero || cmd.numero || `#${String(cmd.id).padStart(4, '0')}`;

                return (
                  <div key={cmd.id} className={`grid grid-cols-[minmax(180px,1.4fr)_100px_125px_100px] gap-2 border-b ${borderColor} px-4 py-3 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/30`}>
                    <span className="truncate text-[14px] font-medium text-slate-900 dark:text-slate-100">{numeroAffichage}</span>
                    <span className="self-center text-right text-[13px] text-slate-700 dark:text-slate-400">{cmd.client_nom || 'Client inconnu'}</span>
                    <span className="self-center text-right text-[13px] text-slate-600 dark:text-slate-300">{`${Number(cmd.total_ttc || 0).toLocaleString('fr-FR')} Ar`}</span>
                    
                    <span className={`self-center justify-self-end rounded-md border px-2.5 py-1 text-[11px] font-semibold ${statusBadge}`}>
                      {cmd.statut || '—'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className={`flex items-center justify-between border-t ${borderColor} bg-slate-50/30 dark:bg-slate-700/20 px-4 py-3`}>
              <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{commandes.length} commande{commandes.length > 1 ? 's' : ''} affichée{commandes.length > 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-success-600 dark:text-success-400"><span className="h-2 w-2 rounded-full bg-success-500" />À jour</span>
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