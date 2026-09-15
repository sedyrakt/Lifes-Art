// ============================================================
// src/components/common/WarningModal.tsx
// LIFE'S ART ERP — Warning Modal
// ⭐ Compact : width 400px, height auto
// ============================================================

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: string;
  buttonText?: string;
  autoCloseDelay?: number;
  isDark?: boolean;
}

const WarningModal: React.FC<WarningModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  details,
  buttonText = 'OK',
  autoCloseDelay = 5000,
  isDark: propIsDark,
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;

  const [isMounted, setIsMounted] = useState(isOpen);
  useEffect(() => {
    if (isOpen) { setIsMounted(true); return; }
    const timer = window.setTimeout(() => setIsMounted(false), 180);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const [progress, setProgress] = useState(100);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; }
  }, []);

  const handleClose = useCallback(() => { clearTimers(); onClose(); }, [clearTimers, onClose]);

  useEffect(() => {
    if (!isOpen) { clearTimers(); setProgress(100); return; }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') { event.preventDefault(); handleClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (autoCloseDelay && autoCloseDelay > 0) {
      const startedAt = Date.now();
      setProgress(100);
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, 100 - (elapsed / autoCloseDelay) * 100);
        setProgress(remaining);
        if (remaining <= 0) { clearTimers(); onClose(); }
      }, 50);
      closeTimerRef.current = setTimeout(() => { clearTimers(); onClose(); }, autoCloseDelay);
    }

    return () => { window.removeEventListener('keydown', handleKeyDown); clearTimers(); };
  }, [isOpen, autoCloseDelay, clearTimers, handleClose, onClose]);

  if (!isMounted) return null;

  const colors = isDark
    ? {
        overlay: 'rgba(15, 23, 42, 0.90)',
        card: '#0F172A',
        border: 'rgba(255,255,255,0.12)',
        divider: 'rgba(255,255,255,0.08)',
        text: '#F8FAFC',
        muted: '#CBD5E1',
        subtle: '#94A3B8',
        iconBg: 'rgba(245, 158, 11, 0.14)',
        iconBorder: 'rgba(245, 158, 11, 0.25)',
        icon: '#F59E0B',
        detailsBg: 'rgba(30, 41, 59, 0.55)',
        detailsBorder: 'rgba(245, 158, 11, 0.20)',
        button: '#F59E0B',
        buttonHover: '#D97706',
        closeHover: 'rgba(255,255,255,0.07)',
        progressBg: 'rgba(255,255,255,0.08)',
        progress: '#F59E0B',
      }
    : {
        overlay: 'rgba(15, 23, 42, 0.55)',
        card: '#FFFFFF',
        border: '#E2E8F0',
        divider: '#F1F5F9',
        text: '#0F172A',
        muted: '#475569',
        subtle: '#64748B',
        iconBg: '#FEF3C7',
        iconBorder: '#FDE68A',
        icon: '#D97706',
        detailsBg: '#F8FAFC',
        detailsBorder: '#FDE68A',
        button: '#F59E0B',
        buttonHover: '#D97706',
        closeHover: '#F8FAFC',
        progressBg: '#F1F5F9',
        progress: '#F59E0B',
      };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      style={{ backgroundColor: colors.overlay, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) handleClose(); }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="warning-modal-title"
        className={`relative z-10 flex w-full max-w-[380px] flex-col overflow-hidden rounded-2xl border shadow-[0_25px_70px_rgba(0,0,0,0.30)] transition-all duration-200 ease-out ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.97]'}`}
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Barre accent top */}
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: colors.progress }} />

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150"
          style={{ color: colors.subtle }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = colors.closeHover;
            event.currentTarget.style.color = colors.text;
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = 'transparent';
            event.currentTarget.style.color = colors.subtle;
          }}
        >
          <X size={16} strokeWidth={2} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center justify-center px-6 py-6 text-center">

          {/* Icon */}
          <div
            className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border"
            style={{ backgroundColor: colors.iconBg, borderColor: colors.iconBorder }}
          >
            <AlertTriangle size={20} strokeWidth={2} style={{ color: colors.icon }} />
          </div>

          {/* Eyebrow */}
          <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]" style={{ color: colors.icon }}>
            Attention
          </div>

          {/* Title */}
          <h2
            id="warning-modal-title"
            className="mb-2 text-[16px] font-bold leading-6 tracking-[-0.01em]"
            style={{ color: colors.text }}
          >
            {title}
          </h2>

          {/* Message */}
          <div
            className="text-[13px] font-normal leading-5"
            style={{ color: colors.muted }}
          >
            {message}
          </div>

          {/* Details */}
          {details && (
            <div
              className="mt-3.5 w-full rounded-lg border px-3.5 py-3 text-left"
              style={{ backgroundColor: colors.detailsBg, borderColor: colors.detailsBorder }}
            >
              <div
                className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.10em]"
                style={{ color: colors.subtle }}
              >
                Détails
              </div>
              <p
                className="whitespace-pre-wrap break-words text-[11.5px] leading-5"
                style={{ color: colors.muted, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
              >
                {details}
              </p>
            </div>
          )}
        </div>

        {/* Footer — bouton */}
        <div className="flex items-center justify-center px-6 pb-5">
          <button
            type="button"
            onClick={handleClose}
            className="min-w-[100px] rounded-lg px-5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2"
            style={{ backgroundColor: colors.button, boxShadow: '0 4px 14px -4px rgba(245, 158, 11, 0.45)' }}
            onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = colors.buttonHover; }}
            onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = colors.button; }}
          >
            {buttonText}
          </button>
        </div>

        {/* Progress bar bottom */}
        {autoCloseDelay > 0 && (
          <div className="absolute bottom-0 left-0 h-[3px] w-full" style={{ backgroundColor: colors.progressBg }}>
            <div
              className="h-full"
              style={{
                width: `${progress}%`,
                backgroundColor: colors.progress,
                transition: 'width 50ms linear',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WarningModal;