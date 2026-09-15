// src/components/dashboard/DashboardSkeleton.tsx
import React from 'react';
import { SectionCard } from './SectionCard';

const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="min-h-full w-full bg-brand-50 px-3 py-4 dark:bg-[#0B1120] sm:px-4 xl:px-5">
    <div className="mx-auto w-full max-w-[1500px]">
      <SectionCard className="mb-3 p-3.5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-44" />
            <SkeletonBlock className="h-3.5 w-64" />
          </div>
          <SkeletonBlock className="h-9 w-36" />
        </div>
      </SectionCard>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SectionCard key={index} className="h-[112px] p-3">
            <div className="flex items-start gap-3">
              <SkeletonBlock className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-6 w-28" />
              </div>
            </div>
            <SkeletonBlock className="mt-2 h-6 w-full" />
          </SectionCard>
        ))}
      </div>
    </div>
  </div>
);