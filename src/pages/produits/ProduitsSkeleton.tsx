// src/pages/produits/ProduitsSkeleton.tsx
import React from 'react';

interface ProduitsSkeletonProps {
  isDark: boolean;
}

export const ProduitsSkeleton: React.FC<ProduitsSkeletonProps> = ({ isDark }) => {
  const base = isDark ? 'bg-white/[0.06]' : 'bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-200';

  return (
    <div className="min-h-[500px] w-full p-5" style={{ background: isDark ? '#0F172A' : '#FFFFFF' }}>
      <div className="space-y-4">
        <div className={`flex items-center gap-4 border-b pb-4 ${border}`}>
          {[...Array(7)].map((_, i) => (
            <div key={i} className={`h-4 w-${i === 0 ? 8 : i === 1 ? 24 : i === 2 ? 32 : i === 3 ? 20 : i === 4 ? 24 : i === 5 ? 20 : 28} rounded ${base} animate-pulse`} />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`flex items-center gap-4 py-3 ${border}`}>
            {[...Array(7)].map((_, j) => (
              <div key={j} className={`h-4 w-${j === 0 ? 8 : j === 1 ? 24 : j === 2 ? 32 : j === 3 ? 20 : j === 4 ? 24 : j === 5 ? 20 : 28} rounded ${base} animate-pulse`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};