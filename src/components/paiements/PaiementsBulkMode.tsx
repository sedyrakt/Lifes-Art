import React from 'react';
import { Loader2, CreditCard, FolderOpen } from 'lucide-react';
import { MONTHS, formatAriary } from '../../utils/paiementUtils';
import { StatusBadge } from './StatusBadge';
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
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Génération en masse des bulletins</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Sélectionnez les employés et générez leurs bulletins de paie.</p>
        </div>
        <div className="flex gap-2">
          <select value={bulkMonth} onChange={(e) => setBulkMonth(Number(e.target.value))} className="h-10 px-3 rounded-lg border border-slate-200 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-200">
            {MONTHS.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
          </select>
          <input type="number" value={bulkYear} onChange={(e) => setBulkYear(Number(e.target.value))} className="h-10 w-24 px-3 rounded-lg border border-slate-200 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-200" />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setBulkSelectedIds(new Set(filteredEmployes.map((e) => e.id)))} className="text-sm font-semibold text-brand-600 hover:text-brand-700">Tout sélectionner</button>
        <button onClick={() => setBulkSelectedIds(new Set())} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Désélectionner tout</button>
      </div>

      <div className="max-h-[500px] overflow-y-auto rounded-xl border border-slate-200 dark:border-white/[0.12]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0F172A]">
            <tr>
              <th className="px-4 py-3 w-10"><input type="checkbox" checked={bulkSelectedIds.size === filteredEmployes.length && filteredEmployes.length > 0} onChange={(e) => { if (e.target.checked) setBulkSelectedIds(new Set(filteredEmployes.map((e) => e.id))); else setBulkSelectedIds(new Set()); }} className="h-4 w-4 rounded cursor-pointer accent-brand-500" /></th>
              <th className="px-4 py-3">Employé</th>
              <th className="px-4 py-3">Poste</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Net à payer</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployes.map((emp) => {
              const payment = getPaymentForEmployee(emp.id, bulkMonth, bulkYear);
              const isSelected = bulkSelectedIds.has(emp.id);
              return (
                <tr key={emp.id} className={`border-b border-slate-100 dark:border-white/[0.05] ${isSelected ? 'bg-brand-50/50 dark:bg-brand-500/10' : ''}`}>
                  <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={(e) => { setBulkSelectedIds((prev) => { const next = new Set(prev); if (e.target.checked) next.add(emp.id); else next.delete(emp.id); return next; }); }} className="h-4 w-4 rounded cursor-pointer accent-brand-500" /></td>
                  <td className="px-4 py-3 font-medium">{emp.prenom} {emp.nom}</td>
                  <td className="px-4 py-3 text-slate-500">{emp.poste || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={payment?.statut || 'Non payé'} /></td>
                  <td className="px-4 py-3 font-bold">{payment ? formatAriary(payment.montant) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={() => setBulkSelectedIds(new Set())} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/[0.12] text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.06]">Annuler</button>
        <button onClick={handleBulkPay} disabled={isGeneratingBulk || bulkSelectedIds.size === 0} className="px-4 py-2 rounded-lg bg-success-500 text-sm font-semibold text-white hover:bg-success-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {isGeneratingBulk ? <Loader2 className="animate-spin inline mr-2 size-4" /> : <CreditCard className="inline mr-2 size-4" />} Payer {bulkSelectedIds.size} employé(s)
        </button>
        <button onClick={handleBulkGenerate} disabled={isGeneratingBulk || bulkSelectedIds.size === 0} className="px-4 py-2 rounded-lg bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {isGeneratingBulk ? <Loader2 className="animate-spin inline mr-2 size-4" /> : <FolderOpen className="inline mr-2 size-4" />} {isGeneratingBulk ? 'Génération...' : `Générer ${bulkSelectedIds.size} bulletin(s)`}
        </button>
      </div>
    </div>
  );
}