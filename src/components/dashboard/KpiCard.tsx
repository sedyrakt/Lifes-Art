// src/components/dashboard/KpiCard.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ LAYOUT: Icon ankavia | Label + Valeur + Variation inline | Sparkline ambany
// ⭐ FIX: line-height malalaka + variation ±999%
// ⭐ FIX: Bénéfice net loko marina (isGood logic)
// ⭐ FONT SIZE: nampitomboina kely (valeur 22px, label 12px, variation 13px)

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { safeNumber, safeVariation } from './utils/variation';
import { formatAriary, formatNumber } from './utils/formatters';

interface KpiCardProps {
  title: string;
  value: number;
  variation?: number | null;
  variationLabel?: string;
  sparkline: number[];
  sparklineColor: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  money?: boolean;
  negative?: boolean;
  showSign?: boolean;
  unit?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title, value, variation, variationLabel = 'vs mois dernier',
  sparkline, sparklineColor, icon, iconBg, iconColor,
  money = false, negative = false, showSign = false, unit,
}) => {
  const numericValue = safeNumber(value);
  const displayValue = money ? formatAriary(numericValue, showSign) : formatNumber(numericValue);
  const hasVariation = variation !== null && variation !== undefined && Number.isFinite(Number(variation));
  const variationNumber = safeVariation(variation);
  const variationPositive = safeNumber(variationNumber) >= 0;

  // ⭐ Logic loko:
  //  - negative = false (CA, Bénéfice, Commandes, Clients, Rotation) :
  //      positif → maitso, négatif → mena
  //  - negative = true (Ruptures, Alertes) :
  //      positif → mena, négatif → maitso
  const isGood = negative ? !variationPositive : variationPositive;
  const variationColor = isGood
    ? 'text-emerald-500 dark:text-emerald-400'
    : 'text-red-500 dark:text-red-400';

  // ⭐ Variation be loatra (>= 999%) → aseho "N/A"
  const variationAbs = Math.abs(variationNumber ?? 0);
  const isExtreme = variationAbs >= 999;

  return (
    <div className="group relative flex min-h-[140px] flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-colors duration-200 hover:border-brand-500/30 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-brand-500/30">
      {/* Top accent color amin'ny hover */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ backgroundColor: sparklineColor }}
      />

      {/* Header: icon ankavia | label + valeur + variation ankavanana */}
      <div className="flex min-w-0 items-start gap-3.5">
        {/* Icon - +1px (h-11 w-11) */}
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor} transition-transform duration-200 group-hover:scale-105`}>
          {icon}
        </div>

        {/* Label + Valeur + Variation */}
        <div className="min-w-0 flex-1">
          {/* Label : 11px → 12px */}
          <p className="truncate text-[12px] font-semibold uppercase leading-[1.5] tracking-[0.07em] text-slate-500 dark:text-slate-400">
            {title}
          </p>

          {/* Valeur : 18px → 22px */}
          <p
            className={`mt-1 whitespace-nowrap text-[22px] font-bold leading-[1.5] tracking-tight ${
              numericValue < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
            }`}
            title={displayValue}
          >
            {displayValue}
            {unit && (
              // Unit : 14px → 16px
              <span className="ml-1 text-[16px] font-medium leading-[1.5] text-slate-400 dark:text-slate-500">
                {unit}
              </span>
            )}
          </p>

          {/* Variation : 11.5px → 13px */}
          {hasVariation && variationNumber !== null && (
            <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[13px] leading-[1.5]">
              {isExtreme ? (
                // ⭐ Raha >= 999%, aseho "N/A"
                <span className="font-semibold text-slate-400 dark:text-slate-500">
                  N/A
                </span>
              ) : (
                <span className={`inline-flex items-center gap-0.5 font-semibold ${variationColor}`}>
                  {/* Icon +2px (11 → 13) */}
                  {variationPositive ? (
                    <TrendingUp size={13} strokeWidth={2.4} />
                  ) : (
                    <TrendingDown size={13} strokeWidth={2.4} />
                  )}
                  {variationPositive ? '+' : ''}
                  {variationNumber.toFixed(1)}%
                </span>
              )}
              <span className="truncate font-normal text-slate-400 dark:text-slate-500">
                {variationLabel}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Sparkline: mameno 100% ny sakany */}
      <div className="mt-auto pt-3">
        <div className="h-[28px] w-full opacity-90">
          <Sparkline data={sparkline} color={sparklineColor} height={28} />
        </div>
      </div>
    </div>
  );
};