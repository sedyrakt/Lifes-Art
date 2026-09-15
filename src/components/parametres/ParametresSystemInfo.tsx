// src/components/parametres/ParametresSystemInfo.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProfileSidebar / ParametresProfile
// ⭐ FONT SIZE: h2 15px, subtitle 13px, labels 12px, values 14px

import React from 'react';
import { HardDrive, Monitor, Cpu, MemoryStick, Box, Server, Globe, Layers } from 'lucide-react';

export interface SystemInfo { version: string; electron: string; node: string; chrome: string; platform: string; arch: string; memory: string; cpu: string; }
interface ParametresSystemInfoProps { systemInfo: SystemInfo; isDark?: boolean; }

const ParametresSystemInfo: React.FC<ParametresSystemInfoProps> = ({ systemInfo }) => {
  const safeString = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') { const obj = value as Record<string, unknown>; if (obj.name !== undefined) return String(obj.name); if (obj.label !== undefined) return String(obj.label); try { return JSON.stringify(value); } catch { return 'N/A'; } }
    return String(value);
  };
  const items = [
    { label: 'Electron', value: safeString(systemInfo.electron), icon: Monitor },
    { label: 'Node.js', value: safeString(systemInfo.node), icon: Server },
    { label: 'Chrome', value: safeString(systemInfo.chrome), icon: Globe },
    { label: 'Version', value: safeString(systemInfo.version), icon: Box },
    { label: 'Plateforme', value: safeString(systemInfo.platform), icon: Layers },
    { label: 'Architecture', value: safeString(systemInfo.arch), icon: Cpu },
    { label: 'CPU', value: safeString(systemInfo.cpu), icon: Cpu },
    { label: 'Mémoire', value: safeString(systemInfo.memory), icon: MemoryStick },
  ];
  return (
    <section className="group relative overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white shadow-sm transition-colors dark:border-white/[0.12] dark:bg-[#0F172A]">
      <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="flex items-center justify-between border-b border-slate-200 px-3.5 py-2.5 dark:border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          {/* ⭐ Icon container : h-8 w-8 → h-9 w-9, icon 16 → 17 */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><HardDrive size={17} strokeWidth={2.2} /></div>
          <div>
            {/* ⭐ h2 : 13.5px → 15px */}
            <h2 className="text-[15px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100">Informations système</h2>
            {/* ⭐ Subtitle : 11.5px → 13px */}
            <p className="mt-0.5 text-[13px] leading-[1.3] font-medium text-slate-400 dark:text-slate-400">Configuration et environnement</p>
          </div>
        </div>
        {/* ⭐ Badge "Système actif" : 11.5px → 12.5px */}
        <div className="hidden items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[12.5px] font-semibold text-emerald-700 sm:flex dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Système actif</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isLastColumn = (index + 1) % 4 === 0;
          const isLastRow = index >= items.length - 4;
          return (
            <div key={item.label} className={`group/item relative min-w-0 px-3.5 py-3 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/[0.03] ${!isLastColumn ? 'lg:border-r lg:border-slate-200 lg:dark:border-white/[0.08]' : ''} ${!isLastRow ? 'lg:border-b lg:border-slate-200 lg:dark:border-white/[0.08]' : ''} sm:border-b sm:border-slate-200 sm:dark:border-white/[0.08] last:border-b-0`}>
              <div className="mb-1.5 flex items-center gap-1.5">
                {/* ⭐ Icon container : h-6 w-6 → h-7 w-7, icon 13 → 14 */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-500 transition-colors group-hover/item:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:group-hover/item:bg-brand-500/20"><Icon size={14} strokeWidth={2.2} /></div>
                {/* ⭐ Label : 11.5px → 12px */}
                <span className="truncate text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-400">{item.label}</span>
              </div>
              {/* ⭐ Value : 13.5px → 14px */}
              <div className="truncate text-[14px] font-semibold leading-[1.3] text-slate-800 dark:text-slate-100" title={item.value}>{item.value}</div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.03]">
        {/* ⭐ Footer : 11.5px → 12.5px */}
        <span className="text-[12.5px] font-medium leading-[1.3] text-slate-400 dark:text-slate-400">Environnement d'exécution</span>
        <span className="text-[12.5px] font-semibold leading-[1.3] text-brand-500 dark:text-brand-400">Electron Desktop</span>
      </div>
    </section>
  );
};
export default ParametresSystemInfo;