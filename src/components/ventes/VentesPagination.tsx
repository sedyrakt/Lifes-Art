

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface VentesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const VentesPagination: React.FC<VentesPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}) => {
  const { isDark } = useTheme();

  const pages = useMemo<number[]>(() => {
    if (totalPages <= 1) return [];
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

  const textColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const textColorHighlight = isDark ? 'text-gray-100' : 'text-gray-900';
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-gray-200';
  const hoverBg = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50';

  return (
    <div className="flex w-full items-center justify-between px-1 py-3">
      
      <div className={`text-[12px] font-bold uppercase tracking-widest ${textColor}`}>
        Total : <span className={textColorHighlight}>{totalItems}</span> VENTE{totalItems > 1 ? 'S' : ''}
      </div>

      <div className="flex items-center gap-1.5">
        
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${borderColor} bg-transparent ${hoverBg}`}
          style={{ color: isDark ? '#B0B0B0' : '#64748B' }}
          aria-label="Page précédente"
        >
          <ChevronLeft size={15} />
        </button>

        {pages.map((page) => {
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`flex h-8 min-w-[32px] items-center justify-center rounded-xl px-2 text-[13.5px] font-bold transition-all ${
                isActive
                  ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                  : `border bg-transparent ${borderColor} ${hoverBg}`
              }`}
              style={{ color: isActive ? '#FFFFFF' : (isDark ? '#B0B0B0' : '#475569') }}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${borderColor} bg-transparent ${hoverBg}`}
          style={{ color: isDark ? '#B0B0B0' : '#64748B' }}
          aria-label="Page suivante"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default VentesPagination;