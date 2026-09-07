// src/components/commandes/CommandesPagination.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ PADDING NOHENA (TSY MISY MT-6)
// ⭐ MISY PAGES FOANA (NA TOTALPAGES = 1 AZA)

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface CommandesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const CommandesPagination: React.FC<CommandesPaginationProps> = ({
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-1 w-full">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Total : <span className="font-black text-slate-900 dark:text-slate-100">{totalItems}</span> commande{totalItems > 1 ? 's' : ''}
      </div>
      
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.12] text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-brand-500/10"
        >
          <ChevronLeft size={16} />
        </button>
        
        {pageNumbers.map(num => {
          const isActive = currentPage === num;
          return (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              className="w-9 h-9 rounded-xl transition-all duration-200 text-xs font-bold flex items-center justify-center shadow-sm"
              style={{
                background: isActive ? '#4F46E5' : (isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF'),
                color: isActive ? '#FFFFFF' : (isDark ? '#F8FAFC' : '#0F172A'),
                border: `1px solid ${isActive ? '#4F46E5' : (isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0')}`
              }}
            >
              {num}
            </button>
          );
        })}
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.12] text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-brand-500/10"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default CommandesPagination;