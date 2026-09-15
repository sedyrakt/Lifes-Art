// src/components/dashboard/EtatOperationnelStock.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur CommandesTable
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

interface EtatOperationnelStockProps {
  kpisStock: Kpi[];
  variationLabel: string;
}

export const EtatOperationnelStock: React.FC<EtatOperationnelStockProps> = ({ kpisStock, variationLabel }) => (
  <section className="relative z-0 mb-4 w-full">
    <SectionHeading
      title="État opérationnel du stock"
      accent="brand"
      subtitle="Surveillance des ressources"
    />
    {/* ⭐ 4 colonnes — mameno 100% ny sakany */}
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpisStock.map((kpi, index) => (
        <KpiCard
          key={`stock-${index}`}
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