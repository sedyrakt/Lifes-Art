// src/components/dashboard/DateInput.tsx
import React, { useRef } from 'react';
import { CalendarDays } from 'lucide-react';
import { formatDateInput } from './utils/formatters';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
}

export const DateInput: React.FC<DateInputProps> = ({ value, onChange, min, max, placeholder = 'jj/mm/aaaa' }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      if (typeof (el as any).showPicker === 'function') (el as any).showPicker();
      else { el.focus(); el.click(); }
    } catch (_) { el.focus(); }
  };

  return (
    <div
      onClick={handleClick}
      className="relative mt-1 flex h-8 w-full cursor-pointer items-center rounded-md border border-slate-200 bg-white px-2 text-[12px] text-slate-700 transition hover:border-brand-500/40 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-300"
    >
      <span className={`pointer-events-none flex-1 truncate ${value ? '' : 'text-slate-400 dark:text-slate-500'}`}>
        {value ? formatDateInput(value) : placeholder}
      </span>
      <CalendarDays size={12} className="pointer-events-none ml-1 shrink-0 text-slate-400" />
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        tabIndex={-1}
      />
    </div>
  );
};