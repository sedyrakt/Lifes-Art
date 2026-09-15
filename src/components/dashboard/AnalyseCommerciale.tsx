// src/components/dashboard/AnalyseCommerciale.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: Center Doughnut text atao HTML overlay mba hifehezana tsara ny couleur
// ⭐ LIGHT MODE: montant = noir
// ⭐ DARK MODE: montant = blanc
// ⭐ PERF: React.memo mba tsy hamerina manao render raha tsy miova ny props
// ⭐ FONT SIZE: nampitomboina kely ny titres, total, légende, percent

import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { SectionCard } from './SectionCard';
import { SectionHeading } from './SectionHeading';
import { formatCompactAriary } from './utils/formatters';

interface AnalyseCommercialeProps {
  dateRangeLabel: string;
  chiffreAffaires: number;
  revenueTrend: { label: string; value: number }[];
  lineData: any;
  lineOptions: any;
  salesDist: {
    data: { label: string; value: number }[];
    total: number;
  };
  doughnutData: any;
  doughnutOptions: any;
  doughnutColors: string[];
}

// ⭐ PERF: Ampiasaina ivelan'ny component mba tsy mamorona fonction vaovao
const chartLineProps = (lineData: any, lineOptions: any) => ({
  data: lineData,
  options: lineOptions,
});

const AnalyseCommercialeBase: React.FC<AnalyseCommercialeProps> = ({
  dateRangeLabel,
  chiffreAffaires,
  revenueTrend,
  lineData,
  lineOptions,
  salesDist,
  doughnutData,
  doughnutOptions,
  doughnutColors,
}) => (
  <section className="relative z-0 mb-4">
    <SectionHeading
      title="Analyse commerciale"
      accent="brand"
      subtitle="Évolution et répartition des ventes"
    />

    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_1fr]">

      {/* ═══════════════════════════════════════════
          LINE CHART
      ═══════════════════════════════════════════ */}
      <SectionCard className="flex h-[370px] flex-col p-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* ⭐ FONT +1.5px */}
            <h2 className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
              Évolution du chiffre d'affaires
            </h2>

            {/* ⭐ FONT +1.5px */}
            <p className="mt-0.5 text-[13px] leading-[1.3] text-slate-400 dark:text-slate-500">
              {dateRangeLabel}
            </p>
          </div>

          <button
            type="button"
            className="flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[12px] font-medium text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400"
          >
            Mensuel
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="flex w-full flex-1">
          {revenueTrend.length > 0 ? (
            <Line data={lineData} options={lineOptions} />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-[13.5px] text-slate-400 dark:border-white/[0.12] dark:text-slate-500">
              Aucune donnée de vente pour cette période
            </div>
          )}
        </div>
      </SectionCard>

      {/* ═══════════════════════════════════════════
          DOUGHNUT
      ═══════════════════════════════════════════ */}
      <SectionCard className="flex h-[370px] flex-col p-3">
        <div className="mb-3">
          {/* ⭐ FONT +1.5px */}
          <h2 className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
            Répartition des ventes
          </h2>

          {/* ⭐ FONT +1.5px */}
          <p className="mt-0.5 text-[13px] leading-[1.3] text-slate-400 dark:text-slate-500">
            Par catégorie de produit
          </p>
        </div>

        {salesDist.data.length > 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-3">

              {/* DOUGHNUT */}
              <div className="relative h-[200px] w-[200px] shrink-0">
                <Doughnut data={doughnutData} options={doughnutOptions} />

                {/* CENTER VALUE (HTML Overlay) */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
                  {/* ⭐ TOTAL +3px */}
                  <span className="text-[23px] font-bold tracking-tight text-black dark:text-white">
                    {formatCompactAriary(salesDist.total)}
                  </span>

                  {/* ⭐ "Total" +2px */}
                  <span className="mt-2 text-[15px] font-medium text-slate-500 dark:text-slate-400">
                    Total
                  </span>
                </div>
              </div>

              {/* LÉGENDE */}
              <div className="w-full min-w-0 flex-1 space-y-2">
                {salesDist.data.map((item, index) => {
                  const percentage = salesDist.total > 0 ? (item.value / salesDist.total) * 100 : 0;

                  return (
                    <div key={`${item.label}-${index}`} className="flex min-w-0 items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {/* ⭐ Dot +0.5 */}
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: doughnutColors[index % doughnutColors.length] }}
                        />
                        {/* ⭐ Légende +1.5px */}
                        <span
                          className="truncate text-[14px] font-medium text-slate-700 dark:text-slate-300"
                          title={item.label}
                        >
                          {item.label}
                        </span>
                      </div>

                      {/* ⭐ Percent +1.5px */}
                      <span className="shrink-0 text-right text-[14px] font-semibold text-slate-700 dark:text-slate-200">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-[13.5px] text-slate-400 dark:text-slate-500">
              Aucune vente
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  </section>
);

// ⭐ PERF: React.memo manakana ny re-render raha mitovy ny props
export const AnalyseCommerciale = React.memo(AnalyseCommercialeBase);