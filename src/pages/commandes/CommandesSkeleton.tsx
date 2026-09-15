// src/pages/commandes/CommandesSkeleton.tsx
import React from 'react';

interface CommandesSkeletonProps {
  isDark: boolean;
}

export const CommandesSkeleton: React.FC<CommandesSkeletonProps> = ({ isDark }) => {
  const base = isDark ? 'bg-white/[0.06]' : 'bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-200';
  return (
    <div className="min-h-[500px] w-full p-5">
      <div className="space-y-4">
        <div className={`flex items-center gap-4 border-b pb-4 ${border}`}>
          {[...Array(7)].map((_, i) => (
            <div key={i} className={`h-4 w-${i === 0 ? 8 : i === 1 ? 24 : i === 2 ? 10 : i === 3 ? 32 : i === 4 ? 20 : i === 5 ? 28 : 20} rounded ${base} animate-pulse`} />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`flex items-center gap-4 py-3 ${border}`}>
            {[...Array(7)].map((_, j) => (
              <div key={j} className={`h-4 w-${j === 0 ? 8 : j === 1 ? 24 : j === 2 ? 10 : j === 3 ? 32 : j === 4 ? 20 : j === 5 ? 28 : 20} rounded ${base} animate-pulse`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};