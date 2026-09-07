import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="animate-spin text-brand-600" />
        <span className="text-[14px] text-slate-500 dark:text-slate-400">Chargement des paiements...</span>
      </div>
    </div>
  );
}