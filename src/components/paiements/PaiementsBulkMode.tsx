// ============================================================
// src/components/paiements/PaiementsBulkMode.tsx
// ⭐ FIX #3 : Filtre "Seulement avec paiement" (default: activé)
// ⭐ FIX #8 : Bouton plus explicite + compteur sélection
// ============================================================

import React, { useMemo, useState } from 'react';
import { Loader2, CreditCard, FolderOpen, Search, AlertCircle, Users } from 'lucide-react';
import { MONTHS, formatAriary } from '../../utils/paiementUtils';
import { StatusBadge } from './StatusBadge';
import { useTheme } from '../../contexts/ThemeContext';
import type { EmployePaiement } from './PaiementsModalForm';

interface PaiementsBulkModeProps {
  bulkSelectedIds: Set<number>;
  setBulkSelectedIds: (ids: Set<number>) => void;
  bulkMonth: number;
  setBulkMonth: (month: number) => void;
  bulkYear: number;
  setBulkYear: (year: number) => void;
  bulkFolderDate: string;
  setBulkFolderDate: (date: string) => void;
  filteredEmployes: EmployePaiement[];
  getPaymentForEmployee: (employeId: number, mois: number, annee: number) => any;
  handleBulkPay: () => void;
  handleBulkGenerate: () => void;
  isGeneratingBulk: boolean;
}

export function PaiementsBulkMode({
  bulkSelectedIds, setBulkSelectedIds, bulkMonth, setBulkMonth,
  bulkYear, setBulkYear, bulkFolderDate, setBulkFolderDate,
  filteredEmployes, getPaymentForEmployee, handleBulkPay, handleBulkGenerate, isGeneratingBulk,
}: PaiementsBulkModeProps) {
  const { isDark } = useTheme();

  // ⭐ FIX #3 : Filtre "Seulement avec paiement" (default: activé)
  const [showOnlyWithPayment, setShowOnlyWithPayment] = useState(true);
  const [search, setSearch] = useState('');

  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
  const mutedColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const headerBg = isDark ? 'bg-[#0F172A]' : 'bg-slate-50';

  // ⭐ FIX #3 : Filtrer les employés
  const displayedEmployes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return filteredEmployes.filter((emp) => {
      // Filtre par recherche
      if (q) {
        const name = `${emp.prenom ?? ''} ${emp.nom ?? ''}`.toLowerCase();
        const poste = String(emp.poste ?? '').toLowerCase();
        if (!name.includes(q) && !poste.includes(q)) return false;
      }
      // Filtre "Seulement avec paiement"
      if (showOnlyWithPayment) {
        const payment = getPaymentForEmployee(emp.id, bulkMonth, bulkYear);
        if (!payment) return false;
      }
      return true;
    });
  }, [filteredEmployes, search, showOnlyWithPayment, bulkMonth, bulkYear, getPaymentForEmployee]);

  const allSelected = displayedEmployes.length > 0 && displayedEmployes.every((e) => bulkSelectedIds.has(e.id));
  const totalSelected = bulkSelectedIds.size;

  return (
    <div className="p-4">

      {/* ═══ Header ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className={`text-lg font-bold ${textColor}`}>Génération en masse des bulletins</h3>
          <p className={`text-sm ${mutedColor}`}>Sélectionnez les employés et générez leurs bulletins de paie.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={bulkMonth}
            onChange={(e) => setBulkMonth(Number(e.target.value))}
            className={`h-10 px-3 rounded-lg border ${borderColor} ${inputBg} ${textColor}`}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={bulkYear}
            onChange={(e) => setBulkYear(Number(e.target.value))}
            className={`h-10 w-24 px-3 rounded-lg border ${borderColor} ${inputBg} ${textColor}`}
          />
        </div>
      </div>

      {/* ⭐ FIX #3 : Barre de recherche + filtre */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={15} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${mutedColor}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un employé..."
            className={`h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none focus:border-brand-500 ${borderColor} ${inputBg} ${textColor}`}
          />
        </div>

        <label className={`flex cursor-pointer items-center gap-2 text-[12.5px] font-medium ${mutedColor}`}>
          <input
            type="checkbox"
            checked={showOnlyWithPayment}
            onChange={(e) => setShowOnlyWithPayment(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-brand-500"
          />
          Seulement avec paiement
        </label>
      </div>

      {/* ═══ Sélection ═══ */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const next = new Set(bulkSelectedIds);
              displayedEmployes.forEach((e) => next.add(e.id));
              setBulkSelectedIds(next);
            }}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Tout sélectionner
          </button>
          <span className={`text-[12px] ${mutedColor}`}>
            ({displayedEmployes.length} affiché{displayedEmployes.length > 1 ? 's' : ''})
          </span>
        </div>
        {totalSelected > 0 && (
          <button
            onClick={() => setBulkSelectedIds(new Set())}
            className={`text-sm font-semibold ${mutedColor} hover:text-slate-700 dark:hover:text-slate-200`}
          >
            Désélectionner tout
          </button>
        )}
      </div>

      {/* ═══ Tableau ═══ */}
      {displayedEmployes.length === 0 ? (
        <div className={`rounded-xl border ${borderColor} py-12 text-center`}>
          <Users size={32} className={`mx-auto ${mutedColor}`} strokeWidth={1.5} />
          <p className={`mt-2 text-sm font-medium ${textColor}`}>Aucun employé à afficher</p>
          <p className={`mt-0.5 text-[12px] ${mutedColor}`}>
            {showOnlyWithPayment
              ? 'Aucun employé n\'a de paiement pour cette période. Décochez le filtre pour voir tous les employés.'
              : 'Essayez une autre recherche.'}
          </p>
        </div>
      ) : (
        <div className={`max-h-[500px] overflow-y-auto rounded-xl border ${borderColor}`}>
          <table className="w-full text-left text-sm">
            <thead className={`sticky top-0 z-10 ${headerBg}`}>
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      const next = new Set(bulkSelectedIds);
                      if (e.target.checked) {
                        displayedEmployes.forEach((emp) => next.add(emp.id));
                      } else {
                        displayedEmployes.forEach((emp) => next.delete(emp.id));
                      }
                      setBulkSelectedIds(next);
                    }}
                    className="h-4 w-4 rounded cursor-pointer accent-brand-500"
                  />
                </th>
                <th className={`px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider ${mutedColor}`}>Employé</th>
                <th className={`px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider ${mutedColor}`}>Poste</th>
                <th className={`px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider ${mutedColor}`}>Statut</th>
                <th className={`px-4 py-3 text-right text-[11.5px] font-bold uppercase tracking-wider ${mutedColor}`}>Net à payer</th>
              </tr>
            </thead>
            <tbody>
              {displayedEmployes.map((emp) => {
                const payment = getPaymentForEmployee(emp.id, bulkMonth, bulkYear);
                const isSelected = bulkSelectedIds.has(emp.id);
                return (
                  <tr
                    key={emp.id}
                    className={`border-b ${
                      isDark ? 'border-white/[0.05]' : 'border-slate-100'
                    } ${isSelected ? 'bg-brand-50/50 dark:bg-brand-500/10' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          setBulkSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(emp.id);
                            else next.delete(emp.id);
                            return next;
                          });
                        }}
                        className="h-4 w-4 rounded cursor-pointer accent-brand-500"
                      />
                    </td>
                    <td className={`px-4 py-3 font-medium ${textColor}`}>{emp.prenom} {emp.nom}</td>
                    <td className={`px-4 py-3 ${mutedColor}`}>{emp.poste || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={payment?.statut || 'Non payé'} />
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {payment ? (
                        <span className="text-emerald-600 dark:text-emerald-400">{formatAriary(payment.montant)}</span>
                      ) : (
                        <span className={mutedColor}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ Footer / Boutons ═══ */}
      <div className={`mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        {totalSelected === 0 ? (
          <div className={`flex items-center gap-2 text-[12.5px] ${mutedColor}`}>
            <AlertCircle size={14} />
            <span>Sélectionnez au moins un employé pour continuer.</span>
          </div>
        ) : (
          <p className={`text-[12.5px] font-semibold ${textColor}`}>
            {totalSelected} employé{totalSelected > 1 ? 's' : ''} sélectionné{totalSelected > 1 ? 's' : ''}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setBulkSelectedIds(new Set())}
            disabled={totalSelected === 0}
            className={`px-4 py-2 rounded-lg border ${borderColor} text-sm font-semibold ${mutedColor} hover:bg-slate-50 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Annuler
          </button>

          <button
            onClick={handleBulkPay}
            disabled={isGeneratingBulk || totalSelected === 0}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGeneratingBulk ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <CreditCard className="size-4" />
            )}
            {totalSelected === 0 ? 'Payer' : `Payer ${totalSelected} employé(s)`}
          </button>

          <button
            onClick={handleBulkGenerate}
            disabled={isGeneratingBulk || totalSelected === 0}
            className="px-4 py-2 rounded-lg bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGeneratingBulk ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <FolderOpen className="size-4" />
            )}
            {isGeneratingBulk ? 'Génération...' : (totalSelected === 0 ? 'Générer les bulletins' : `Générer ${totalSelected} bulletin(s)`)}
          </button>
        </div>
      </div>
    </div>
  );
}