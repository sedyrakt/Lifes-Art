import React from 'react';
import PaiementsTable from './PaiementsTable';
import PaiementsPagination from './PaiementsPagination';
import type { PaiementEmploye } from './PaiementsModalForm';

interface PaiementsListModeProps {
  paiements: PaiementEmploye[];
  onEdit: (p: PaiementEmploye) => void;
  onDelete: (p: PaiementEmploye) => void;
  deletingId: number | null;
  onValidate?: (p: PaiementEmploye) => void;
  onBulletin?: (p: PaiementEmploye) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onAdd: () => void; // ⭐ VAOVAO
  selectedIds?: Set<number>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: number, checked: boolean) => void;
  onBulkDelete?: (ids: number[]) => void;
}

export function PaiementsListMode({
  paiements,
  onEdit,
  onDelete,
  deletingId,
  onValidate,
  onBulletin,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onAdd,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onBulkDelete,
}: PaiementsListModeProps) {
  return (
    <>
      <PaiementsTable
        paiements={paiements}
        onEdit={onEdit}
        onDelete={onDelete}
        deletingId={deletingId}
        onValidate={onValidate}
        onBulletin={onBulletin}
        onAdd={onAdd}
        selectedIds={selectedIds}
        onSelectAll={onSelectAll}
        onSelectOne={onSelectOne}
        onBulkDelete={onBulkDelete}
      />
      {totalPages > 0 && (
        <PaiementsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}