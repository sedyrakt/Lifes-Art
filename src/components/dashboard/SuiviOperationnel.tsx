// src/components/dashboard/SuiviOperationnel.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur AnalyseCommerciale
// ⭐ Titres 15px / Subtitle 13px / Cells 14px / Header 12.5px

import React from 'react';
import {
  Package, ArrowRight, XCircle, AlertTriangle, Clock, Wallet, UserPlus,
} from 'lucide-react';
import { SectionCard } from './SectionCard';
import { SectionHeading } from './SectionHeading';
import { formatAriary, formatNumber } from './utils/formatters';
import { AlertItem } from './types';

interface TopProduct {
  name: string;
  quantity: number;
  sales: number;
  evolution: number;
}

interface SuiviOperationnelProps {
  topProducts: TopProduct[];
  alerts: AlertItem[];
  searchTerm: string;
  topProductColors: { bg: string }[];
}

const getAlertIcon = (type: string): { icon: React.ReactNode; bg: string; color: string } => {
  switch (type) {
    case 'Rupture de stock': return { icon: <XCircle size={15} strokeWidth={2.2} />, bg: 'bg-red-500/10 dark:bg-red-500/15', color: 'text-red-600 dark:text-red-400' };
    case 'Stock faible': return { icon: <AlertTriangle size={15} strokeWidth={2.2} />, bg: 'bg-amber-500/10 dark:bg-amber-500/15', color: 'text-amber-600 dark:text-amber-400' };
    case 'Commande en attente': return { icon: <Clock size={15} strokeWidth={2.2} />, bg: 'bg-amber-500/10 dark:bg-amber-500/15', color: 'text-amber-600 dark:text-amber-400' };
    case 'Paiement reçu': return { icon: <Wallet size={15} strokeWidth={2.2} />, bg: 'bg-brand-500/10 dark:bg-brand-500/15', color: 'text-brand-600 dark:text-brand-400' };
    case 'ok': return { icon: <UserPlus size={15} strokeWidth={2.2} />, bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', color: 'text-emerald-600 dark:text-emerald-400' };
    default: return { icon: <UserPlus size={15} strokeWidth={2.2} />, bg: 'bg-brand-500/10', color: 'text-brand-600' };
  }
};

export const SuiviOperationnel: React.FC<SuiviOperationnelProps> = ({
  topProducts, alerts, searchTerm, topProductColors,
}) => (
  <section className="relative z-0 mb-4">
    <SectionHeading
      title="Suivi opérationnel"
      accent="brand"
      subtitle="Détails et actions à surveiller"
    />

    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {/* ═══════════════════════════════════════════
          TOP PRODUITS
      ═══════════════════════════════════════════ */}
      <SectionCard className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-white/[0.08]">
          <div className="min-w-0">
            {/* ⭐ Titre : 15px (mitovy amin'ny AnalyseCommerciale) */}
            <h2 className="truncate text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
              Produits les plus vendus
            </h2>
            {/* ⭐ Subtitle : 13px */}
            <p className="mt-0.5 text-[13px] leading-[1.3] text-slate-400 dark:text-slate-500">
              {searchTerm ? `Résultats pour "${searchTerm}"` : 'Top 5 de la période'}
            </p>
          </div>
          {/* ⭐ Badge : 12px (mitovy amin'ny bouton "Mensuel" ao AnalyseCommerciale) */}
          <div className="shrink-0 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[12px] font-semibold leading-tight text-brand-600 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-400">
            Top 5
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* ⭐ Header : 12.5px */}
            <div className="grid grid-cols-[minmax(180px,1.6fr)_85px_130px_85px] gap-2 border-b border-slate-200 px-3 py-2 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:border-white/[0.08] dark:text-slate-400">
              <span>Produit</span>
              <span className="text-right">Quantité</span>
              <span className="text-right">Ventes</span>
              <span className="text-right">Évolution</span>
            </div>

            {topProducts.length > 0 ? (
              <div>
                {topProducts.map((product, index) => {
                  const color = topProductColors[index % topProductColors.length];
                  return (
                    <div
                      key={`${product.name}-${index}`}
                      className="grid grid-cols-[minmax(180px,1.6fr)_85px_130px_85px] gap-2 border-b border-slate-200 px-3 py-2 last:border-b-0 transition-colors hover:bg-brand-500/5 dark:border-white/[0.08] dark:hover:bg-brand-500/5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md shadow-sm" style={{ backgroundColor: color.bg }}>
                          <Package size={14} className="text-white" strokeWidth={2.2} />
                        </div>
                        {/* ⭐ Cell : 14px (mitovy amin'ny légende ao AnalyseCommerciale) */}
                        <span className="truncate text-[14px] font-medium text-slate-800 dark:text-slate-200" title={product.name}>
                          {product.name}
                        </span>
                      </div>
                      {/* ⭐ Cell : 14px */}
                      <span className="self-center text-right text-[14px] text-slate-500 dark:text-slate-400">
                        {formatNumber(product.quantity)}
                      </span>
                      {/* ⭐ Cell : 14px */}
                      <span className="self-center text-right text-[14px] text-slate-500 dark:text-slate-400">
                        {formatAriary(product.sales)}
                      </span>
                      {/* ⭐ Cell : 14px */}
                      <span className={`self-center text-right text-[14px] font-semibold ${product.evolution >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {product.evolution >= 0 ? '+' : ''}
                        {product.evolution.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-8 text-center text-[13.5px] text-slate-400 dark:text-slate-500">
                {searchTerm ? 'Aucun produit ne correspond à la recherche.' : 'Aucun produit vendu pour cette période.'}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ═══════════════════════════════════════════
          ALERTES
      ═══════════════════════════════════════════ */}
      <SectionCard className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-white/[0.08]">
          <div className="min-w-0">
            {/* ⭐ Titre : 15px */}
            <h2 className="truncate text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
              Alertes & Notifications
            </h2>
            {/* ⭐ Subtitle : 13px */}
            <p className="mt-0.5 text-[13px] leading-[1.3] text-slate-400 dark:text-slate-500">
              État opérationnel
            </p>
          </div>
          {/* ⭐ Bouton "Voir tout" : 13px */}
          <button
            type="button"
            className="group/vt inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[13px] font-semibold text-brand-600 transition-colors hover:bg-brand-500/10 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Voir tout
            <ArrowRight size={13} strokeWidth={2.2} className="transition-transform group-hover/vt:translate-x-0.5" />
          </button>
        </div>

        <div>
          {alerts.map((alert, index) => {
            const { icon, bg, color } = getAlertIcon(alert.type);
            return (
              <div
                key={`${alert.title}-${index}`}
                className="flex items-center gap-2.5 border-b border-slate-200 px-3 py-2.5 last:border-b-0 transition-colors hover:bg-brand-500/5 dark:border-white/[0.08] dark:hover:bg-brand-500/5"
              >
                {/* ⭐ Icon container : h-8 w-8 (naveriko tamin'ny laoniny) */}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}>
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  {/* ⭐ Alert title : 14px */}
                  <p className="truncate text-[14px] font-semibold text-slate-800 dark:text-slate-200">
                    {alert.title}
                  </p>
                  {/* ⭐ Alert message : 13px */}
                  <p className="mt-0.5 truncate text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">
                    {alert.message}
                  </p>
                </div>
                {/* ⭐ Alert time : 13px */}
                <span className="shrink-0 text-[13px] font-medium leading-[1.3] text-slate-400 dark:text-slate-500">
                  {alert.time}
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  </section>
);