
import React, { useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface FournisseursPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const FournisseursPagination: React.FC<FournisseursPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}) => {
  const { isDark } = useTheme();

  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeTotalItems = Math.max(0, Number(totalItems) || 0);
  const safeCurrentPage = Math.max(1, Math.min(Number(currentPage) || 1, safeTotalPages));

  const pageNumbers = useMemo(() => {
    if (safeTotalPages <= 1) return [];
    const maxVisible = 7;
    let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(safeTotalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    const numbers: number[] = [];
    for (let page = start; page <= end; page++) numbers.push(page);
    return numbers;
  }, [safeCurrentPage, safeTotalPages]);

  const handlePrevious = useCallback(() => {
    const page = Math.max(1, safeCurrentPage - 1);
    if (page !== safeCurrentPage) onPageChange(page);
  }, [safeCurrentPage, onPageChange]);

  const handleNext = useCallback(() => {
    const page = Math.min(safeTotalPages, safeCurrentPage + 1);
    if (page !== safeCurrentPage) onPageChange(page);
  }, [safeCurrentPage, safeTotalPages, onPageChange]);

  const handlePageClick = useCallback((page: number) => {
    if (page === safeCurrentPage) return;
    onPageChange(Math.max(1, Math.min(page, safeTotalPages)));
  }, [safeCurrentPage, safeTotalPages, onPageChange]);

  if (safeTotalPages <= 1) return null;

  return (
    <div className="mt-1 flex w-full flex-col items-center justify-between gap-4 px-2 sm:flex-row">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Total : <span className="font-black text-slate-900 dark:text-slate-100">{safeTotalItems}</span> fournisseurs
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={safeCurrentPage === 1}
          aria-label="Page précédente"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.12] text-slate-500 transition-all hover:border-brand-500/30 hover:bg-brand-500/10 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400"
        >
          <ChevronLeft size={16} />
        </button>

        {pageNumbers.map((page) => {
          const isActive = safeCurrentPage === page;
          return (
            <button
              key={page}
              type="button"
              onClick={() => handlePageClick(page)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 ${
                isActive
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-brand-500/30 hover:bg-brand-500/10'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleNext}
          disabled={safeCurrentPage === safeTotalPages}
          aria-label="Page suivante"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.12] text-slate-500 transition-all hover:border-brand-500/30 hover:bg-brand-500/10 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default FournisseursPagination;