// src/components/produits/ProduitsPagination.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ DESIGN aligned with CommandesPagination
// ⭐ FIX: border-gray-400 (#9CA3AF) amin'ny page numbers rehetra (light mode)
// ⭐ Block pagination (7 isaky ny block)
// ⭐ FONT SIZE NAMPITOMBOANA (text-[15px] ho an'ny total, text-[14px] ho an'ny page numbers)

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProduitsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const ProduitsPagination: React.FC<ProduitsPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}) => {
  const { isDark } = useTheme();

  // ⭐ Block pagination (7 isaky ny block)
  const pageNumbers = useMemo<number[]>(() => {
    if (totalPages <= 1) return [1];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const blockSize = 7;
    const blockIndex = Math.floor((currentPage - 1) / blockSize);
    const startPage = blockIndex * blockSize + 1;
    const endPage = Math.min(startPage + blockSize - 1, totalPages);

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }, [currentPage, totalPages]);

  if (totalItems === 0 || totalPages === 0) return null;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  // ⭐ Nav button class (mitovy amin'ny CommandesPagination)
  const navButtonClass = `p-1.5 rounded-lg border transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
    isDark
      ? 'border-white/[0.12] text-slate-400 hover:bg-brand-500/10 hover:border-brand-300'
      : 'border-gray-400 text-slate-600 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-600'
  }`;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-0.5 w-full">
      {/* Total */}
      <div className="text-[15px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Total : <span className="font-black text-slate-900 dark:text-slate-100">{totalItems}</span> produit{totalItems > 1 ? 's' : ''}
      </div>

      {/* Pages */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Page précédente"
          className={navButtonClass}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((num) => {
          const isActive = currentPage === num;
          return (
            <button
              key={num}
              type="button"
              onClick={() => goToPage(num)}
              className="w-8 h-8 rounded-lg transition-all duration-200 text-[14px] font-bold flex items-center justify-center shadow-sm"
              style={{
                background: isActive ? '#4F46E5' : (isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF'),
                color: isActive ? '#FFFFFF' : (isDark ? '#F8FAFC' : '#0F172A'),
                // ⭐ FIX: border-gray-400 (#9CA3AF) en light mode
                border: `1px solid ${
                  isActive
                    ? '#4F46E5'
                    : (isDark ? 'rgba(255,255,255,0.12)' : '#9CA3AF')
                }`,
              }}
            >
              {num}
            </button>
          );
        })}

        {/* Next */}
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Page suivante"
          className={navButtonClass}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default ProduitsPagination;