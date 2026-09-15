// src/components/stock/MouvementsPagination.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHY alignée sur CommandesPagination
// ⭐ fontSize : total 15px bold, numéro 14px bold
// ⭐ Chevron bold + border-gray-400 en mode light
// ⭐ DESIGN aligned with pagination family (Produits/Categories/etc.)
// ⭐ FONT SIZE NAMPITOMBOANA

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface MouvementsPaginationProps {
  currentPage: number;
  totalItems: number;
  hasMore: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

const MouvementsPagination: React.FC<MouvementsPaginationProps> = ({
  currentPage,
  totalItems,
  hasMore,
  onNext,
  onPrevious,
}) => {
  const { isDark } = useTheme();

  if (totalItems === 0) return null;

  // ⭐ FIX: bordure gray-400 en light, border-white/[0.12] en dark
  const navButtonClass = `p-1.5 rounded-lg border transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
    isDark
      ? 'border-white/[0.12] text-slate-400 hover:bg-brand-500/10 hover:border-brand-300'
      : 'border-gray-400 text-slate-600 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-600'
  }`;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-0.5 w-full">
      {/* Total */}
      <div className="text-[15px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Total : <span className="font-black text-slate-900 dark:text-slate-100">{totalItems}</span> mouvement{totalItems > 1 ? 's' : ''}
      </div>

      {/* Pages */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          aria-label="Page précédente"
          className={navButtonClass}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        {/* Current page (active indigo) */}
        <div
          className="w-8 h-8 rounded-lg transition-all duration-200 text-[14px] font-bold flex items-center justify-center shadow-sm"
          style={{
            background: '#4F46E5',
            color: '#FFFFFF',
            border: '1px solid #4F46E5',
          }}
        >
          {currentPage}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={onNext}
          disabled={!hasMore}
          aria-label="Page suivante"
          className={navButtonClass}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default MouvementsPagination;