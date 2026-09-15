// ============================================================
// src/components/paiements/PaiementsContent.tsx
// ⭐ FIX: Nampiana prop onPayEmployee ho an'ny vue calendrier
// ============================================================

import React from 'react';
import { LoadingState } from './LoadingState';
import PaiementsCalendrier from './PaiementsCalendrier';
import PaiementsEcheances from './PaiementsEcheances';
import { PaiementsBulkMode } from './PaiementsBulkMode';
import { PaiementsListMode } from './PaiementsListMode';
import type { PaiementEmploye, EmployePaiement } from './PaiementsModalForm';

type ViewMode = 'liste' | 'calendrier' | 'echeances' | 'bulletin';

interface PaiementsContentProps {
  loading: boolean;
  refreshing: boolean;
  viewMode: ViewMode;
  filteredPaiements: PaiementEmploye[];
  allPaiements: PaiementEmploye[];
  employes: EmployePaiement[];
  paiements: PaiementEmploye[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEdit: (p: PaiementEmploye) => void;
  onDelete: (p: PaiementEmploye) => void;
  deletingId: number | null;
  onValidate?: (p: PaiementEmploye) => void;
  onOpenBulletin?: (p: PaiementEmploye) => void;
  onRefresh: () => void;
  onAdd: () => void;
  bulkSelectedIds: Set<number>;
  setBulkSelectedIds: (ids: Set<number>) => void;
  bulkMonth: number;
  setBulkMonth: (month: number) => void;
  bulkYear: number;
  setBulkYear: (year: number) => void;
  bulkFolderDate: string;
  setBulkFolderDate: (date: string) => void;
  filteredEmployes: EmployePaiement[];
  getPaymentForEmployee: (employeId: number, mois: number, annee: number) => PaiementEmploye | undefined;
  handleBulkPay: () => void;
  handleBulkGenerate: () => void;
  isGeneratingBulk: boolean;
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
  /** ⭐ NOUVEAU: Callback rehefa tsindriana "Payer" avy amin'ny calendrier */
  onPayEmployee?: (employeId: number, date?: string) => void;
}

export function PaiementsContent({
  loading,
  refreshing,
  viewMode,
  filteredPaiements,
  allPaiements,
  employes,
  paiements,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onEdit,
  onDelete,
  deletingId,
  onValidate,
  onOpenBulletin,
  onRefresh,
  onAdd,
  bulkSelectedIds,
  setBulkSelectedIds,
  bulkMonth,
  setBulkMonth,
  bulkYear,
  setBulkYear,
  bulkFolderDate,
  setBulkFolderDate,
  filteredEmployes,
  getPaymentForEmployee,
  handleBulkPay,
  handleBulkGenerate,
  isGeneratingBulk,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onBulkDelete,
  onPayEmployee,  // ⭐ NOUVEAU
}: PaiementsContentProps) {
  if (loading) return <LoadingState />;

  if (viewMode === 'calendrier') {
    return (
      <PaiementsCalendrier
        paiements={filteredPaiements}
        allPaiements={allPaiements}
        employes={employes}
        onPayEmployee={onPayEmployee}  // ⭐ NOUVEAU
      />
    );
  }

  if (viewMode === 'echeances') {
    return (
      <PaiementsEcheances
        paiements={filteredPaiements}
        employes={employes}
        onRefresh={onRefresh}
        onViewPaiement={onEdit}
      />
    );
  }

  if (viewMode === 'bulletin') {
    return (
      <PaiementsBulkMode
        bulkSelectedIds={bulkSelectedIds}
        setBulkSelectedIds={setBulkSelectedIds}
        bulkMonth={bulkMonth}
        setBulkMonth={setBulkMonth}
        bulkYear={bulkYear}
        setBulkYear={setBulkYear}
        bulkFolderDate={bulkFolderDate}
        setBulkFolderDate={setBulkFolderDate}
        filteredEmployes={filteredEmployes}
        getPaymentForEmployee={getPaymentForEmployee}
        handleBulkPay={handleBulkPay}
        handleBulkGenerate={handleBulkGenerate}
        isGeneratingBulk={isGeneratingBulk}
      />
    );
  }

  // default liste
  return (
    <PaiementsListMode
      paiements={paiements}
      onEdit={onEdit}
      onDelete={onDelete}
      deletingId={deletingId}
      onValidate={onValidate}
      onBulletin={onOpenBulletin}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      onPageChange={onPageChange}
      onAdd={onAdd}
      selectedIds={selectedIds}
      onSelectAll={onSelectAll}
      onSelectOne={onSelectOne}
      onBulkDelete={onBulkDelete}
    />
  );
}