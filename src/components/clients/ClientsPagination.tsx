// src/components/clients/ClientsPagination.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ PADDING NOHENA (TSY MISY MT-6)
// ⭐ MISY PAGES FOANA (NA TOTALPAGES = 1 AZA)
// ⭐ Chevron bold + border-gray-400 en mode light
// ⭐ FIX: border-gray-400 (#9CA3AF) amin'ny page numbers rehetra (light mode)
// ⭐ FONT SIZE NAMPITOMBOANA

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ClientsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const ClientsPagination: React.FC<ClientsPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}) => {
  const { isDark } = useTheme();

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [1];
    const numbers = [];
    const maxVisible = 7;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) numbers.push(i);
    return numbers;
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-0.5 w-full">
      {/* Total */}
      <div className="text-[15px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Total : <span className="font-black text-slate-900 dark:text-slate-100">{totalItems}</span> client{totalItems > 1 ? 's' : ''}
      </div>

      {/* Pages */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Page précédente"
          className="p-1.5 rounded-lg border border-gray-400 dark:border-white/[0.12] text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:border-brand-300"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        {/* Page numbers */}
        {pageNumbers.map(num => {
          const isActive = currentPage === num;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onPageChange(num)}
              className="w-8 h-8 rounded-lg transition-all duration-200 text-[14px] font-bold flex items-center justify-center shadow-sm"
              style={{
                background: isActive ? '#4F46E5' : (isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF'),
                color: isActive ? '#FFFFFF' : (isDark ? '#F8FAFC' : '#0F172A'),
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
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Page suivante"
          className="p-1.5 rounded-lg border border-gray-400 dark:border-white/[0.12] text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:border-brand-300"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default ClientsPagination;