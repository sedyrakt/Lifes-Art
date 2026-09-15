// src/components/common/TimePicker.tsx
// ⭐ FIX: Manaiky 1-2 digits ho an'ny ora ("8:05" sy "08:05")
// ⭐ FIX: Live update rehefa feno ny minute (2 digits)
// ⭐ FIX: Auto-insert ":" rehefa manoratra 4 digits ("0805" → "08:05")

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock3 } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  isDark?: boolean;
  disabled?: boolean;
  showSeconds?: boolean;
  placeholder?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  isDark = false,
  disabled = false,
  showSeconds = false,
  placeholder,
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⭐ Sync rehefa miova avy any ivelany ny value (fa tsy rehefa manoratra)
  useEffect(() => {
    if (!isFocused) setLocalValue(value || '');
  }, [value, isFocused]);

  // ⭐ Clamp ho 0-23 (heure), 0-59 (min/sec) + padding 2 digits
  const validatePart = useCallback((part: string, max: number): string => {
    if (!part) return '';
    const num = parseInt(part, 10);
    if (isNaN(num)) return '';
    return String(Math.min(Math.max(0, num), max)).padStart(2, '0');
  }, []);

  // ⭐ FIX: Live update rehefa manoratra
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // ⭐ Esory ny rehetra afa-tsy ny tarehimarika sy ":"
    let cleaned = raw.replace(/[^\d:]/g, '');

    // ⭐ Ferana ny isan'ny ":" (1 ho an'ny HH:MM, 2 ho an'ny HH:MM:SS)
    const maxColons = showSeconds ? 2 : 1;
    const parts = cleaned.split(':');
    if (parts.length > maxColons + 1) {
      cleaned = parts.slice(0, maxColons + 1).join(':');
    }

    // ⭐ Auto-insert ":" rehefa manoratra 2 digits tsy misy ":"
    if (!cleaned.includes(':') && cleaned.length === 2) {
      cleaned = cleaned + ':';
    }
    // ⭐ "0805" → "08:05"
    else if (!cleaned.includes(':') && cleaned.length === 4 && !showSeconds) {
      cleaned = cleaned.slice(0, 2) + ':' + cleaned.slice(2, 4);
    }
    // ⭐ "080530" → "08:05:30"
    else if (!cleaned.includes(':') && cleaned.length === 6 && showSeconds) {
      cleaned = cleaned.slice(0, 2) + ':' + cleaned.slice(2, 4) + ':' + cleaned.slice(4, 6);
    }

    setLocalValue(cleaned);

    // ⭐ FIX: Live update rehefa feno (minutes 2 digits)
    const colonCount = (cleaned.match(/:/g) || []).length;

    if (!showSeconds && colonCount === 1) {
      const [h, m] = cleaned.split(':');
      // ⭐ Manaiky 1-2 digits ho an'ny ora, 2 digits foana ny minute
      if (h && h.length >= 1 && m && m.length === 2) {
        const hh = validatePart(h, 23);
        const mm = validatePart(m, 59);
        onChange(`${hh}:${mm}`);
      }
    } else if (showSeconds && colonCount === 2) {
      const [h, m, s] = cleaned.split(':');
      if (h && h.length >= 1 && m && m.length === 2 && s && s.length === 2) {
        const hh = validatePart(h, 23);
        const mm = validatePart(m, 59);
        const ss = validatePart(s, 59);
        onChange(`${hh}:${mm}:${ss}`);
      }
    }
  };

  // ⭐ Rehefa miala amin'ny champ (blur) dia amboarina ny format ho 2 digits
  const handleBlur = () => {
    setIsFocused(false);
    const parts = localValue.split(':');
    const h = validatePart(parts[0] || '', 23);
    const m = validatePart(parts[1] || '', 59);
    const s = validatePart(parts[2] || '', 59);

    let finalValue = '';
    if (showSeconds) {
      if (h || m || s) {
        finalValue = `${h || '00'}:${m || '00'}:${s || '00'}`;
      }
    } else {
      if (h || m) {
        finalValue = `${h || '00'}:${m || '00'}`;
      }
    }

    setLocalValue(finalValue);
    onChange(finalValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // ⭐ Auto-select ny rehetra mba mora soloina
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value || '');
      inputRef.current?.blur();
    }
  };

  const bg = isDark ? '#0F172A' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0';
  const text = isDark ? '#F8FAFC' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';

  const defaultPlaceholder = showSeconds ? 'HH:MM:SS' : 'HH:MM';
  const effectivePlaceholder = placeholder || defaultPlaceholder;

  return (
    <div className="relative w-full">
      <div
        className="flex h-11 w-full items-center rounded-lg border transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10"
        style={{
          backgroundColor: bg,
          borderColor: isFocused ? '#4F46E5' : border,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {/* ⭐ Icon Clock3 */}
        <div className="flex h-full w-10 shrink-0 items-center justify-center">
          <Clock3 size={15} style={{ color: muted }} />
        </div>

        {/* ⭐ Input text */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={effectivePlaceholder}
          /* ⭐ FIX: nampitomboina ny maxLength mba hamela "0805" na "080530" alohan'ny auto-format */
          maxLength={showSeconds ? 9 : 6}
          className="h-full flex-1 bg-transparent pr-3 font-mono text-[15px] font-semibold tabular-nums outline-none disabled:cursor-not-allowed"
          style={{
            color: localValue ? text : muted,
          }}
        />

        {/* ⭐ Hint kely eo ankavanana rehefa focus */}
        {!disabled && isFocused && (
          <span
            className="pointer-events-none mr-3 shrink-0 text-[11px] font-medium"
            style={{ color: muted }}
          >
            ⏎
          </span>
        )}
      </div>
    </div>
  );
};

export default TimePicker;