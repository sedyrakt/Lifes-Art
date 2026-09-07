
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
  currentPage, totalItems, hasMore, onNext, onPrevious 
}) => {
  const { isDark } = useTheme();

  if (totalItems === 0) return null;

  const borderClass = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const bgClass = isDark ? 'bg-slate-900' : 'bg-white';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textStrong = isDark ? 'text-slate-100' : 'text-slate-900';
  const btnHover = isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50';
  const disabledClass = 'opacity-40 cursor-not-allowed';

  return (
    <div className={`mt-1 flex w-full items-center justify-between rounded-xl border px-4 py-3 shadow-sm transition-all duration-200 ${bgClass} ${borderClass}`}>
      <div className={`text-[13px] font-bold uppercase tracking-wider ${textMuted}`}>
        TOTAL : <span className={`font-black ${textStrong}`}>{totalItems}</span> mouvement{totalItems > 1 ? 's' : ''}
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={onPrevious} disabled={currentPage === 1} className={`flex h-9 w-9 items-center justify-center rounded-lg border ${borderClass} bg-transparent transition-colors ${textMuted} ${currentPage === 1 ? disabledClass : btnHover}`} aria-label="Page précédente">
          <ChevronLeft size={16} />
        </button>

        <div className="flex h-9 min-w-[36px] items-center justify-center rounded-lg px-3 text-[13px] font-bold text-white shadow-sm bg-brand-500">
          {currentPage}
        </div>

        <button onClick={onNext} disabled={!hasMore} className={`flex h-9 w-9 items-center justify-center rounded-lg border ${borderClass} bg-transparent transition-colors ${textMuted} ${!hasMore ? disabledClass : btnHover}`} aria-label="Page suivante">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default MouvementsPagination;