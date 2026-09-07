import React from 'react';
import { X } from 'lucide-react';

interface PaiementsErrorBannerProps {
  errorMessage: string;
  onClose: () => void;
}

export function PaiementsErrorBanner({ errorMessage, onClose }: PaiementsErrorBannerProps) {
  if (!errorMessage) return null;
  return (
    <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
      <span>{errorMessage}</span>
      <button onClick={onClose} className="rounded-md p-1 hover:bg-red-100 dark:hover:bg-red-900/30">
        <X size={14} />
      </button>
    </div>
  );
}