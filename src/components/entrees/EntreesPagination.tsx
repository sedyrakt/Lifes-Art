import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface EntreesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const EntreesPagination: React.FC<EntreesPaginationProps> = ({ currentPage, totalPages, totalItems, onPageChange }) => {
  const { isDark } = useTheme();

  const getPaginationItems = () => {
    const items: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) items.push(i);
    return items;
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
      <span className="text-[13px] text-slate-500 dark:text-slate-400">Total: {totalItems} entrée{totalItems > 1 ? 's' : ''}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-brand-500/10">
          <ChevronLeft size={16} />
        </button>
        {getPaginationItems().map(page => (
          <button key={page} type="button" onClick={() => onPageChange(page)} className={`h-8 w-8 rounded-full text-[13px] font-semibold transition-all ${
            currentPage === page ? 'bg-brand-500 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-brand-600 dark:border-white/[0.12] dark:text-slate-300 dark:hover:bg-brand-500/10'
          }`}>{page}</button>
        ))}
        <button type="button" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.12] dark:text-slate-400 dark:hover:bg-brand-500/10">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default EntreesPagination;