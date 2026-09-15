// src/components/dashboard/PerformanceCommerciale.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ 4 colonnes — mameno 100% ny sakany

import React from 'react';
import { KpiCard } from './KpiCard';
import { SectionHeading } from './SectionHeading';

interface Kpi {
  label: string;
  value: number;
  variation: number | null;
  money: boolean;
  negative: boolean;
  showSign: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  sparklineColor: string;
  sparkline: number[];
  unit?: string;
}

interface PerformanceCommercialeProps {
  kpisVentes: Kpi[];
  variationLabel: string;
}

export const PerformanceCommerciale: React.FC<PerformanceCommercialeProps> = ({ kpisVentes, variationLabel }) => (
  <section className="relative z-0 mb-4 w-full">
    <SectionHeading
      title="Performance commerciale"
      accent="emerald"
      subtitle="Vue synthétique de l'activité"
    />
    {/* ⭐ 4 colonnes — mameno 100% ny sakany */}
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpisVentes.map((kpi, index) => (
        <KpiCard
          key={`ventes-${index}`}
          title={kpi.label}
          value={kpi.value}
          variation={kpi.variation}
          variationLabel={variationLabel}
          money={kpi.money}
          negative={kpi.negative}
          showSign={kpi.showSign}
          sparklineColor={kpi.sparklineColor}
          sparkline={kpi.sparkline}
          icon={kpi.icon}
          iconBg={kpi.iconBg}
          iconColor={kpi.iconColor}
          unit={kpi.unit}
        />
      ))}
    </div>
  </section>
);