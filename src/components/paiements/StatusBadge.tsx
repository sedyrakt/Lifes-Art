import React from 'react';

export function StatusBadge({ status }: { status?: string }) {
  const n = status || 'Non payé';
  let c = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  if (n === 'Brouillon') c = 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  else if (n === 'Payé') c = 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400';
  else if (n === 'Partiel') c = 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400';
  else if (n === 'Non payé') c = 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[13px] font-bold ${c}`}>
      {n}
    </span>
  );
}