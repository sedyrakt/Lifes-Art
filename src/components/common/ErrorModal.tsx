// src/components/common/ErrorModal.tsx
// ⭐ NEW: zIndex prop (default 9999, azo ovaina ho 9999999)
// ⭐ FIX: Manaiky zIndex ambony noho ny modals hafa
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { XCircle, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: string;
  buttonText?: string;
  autoCloseDelay?: number;
  isDark?: boolean;
  zIndex?: number;  // ⭐ VAOVAO
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  details,
  buttonText = 'OK',
  autoCloseDelay = 4000,
  isDark: propIsDark,
  zIndex = 9999,  // ⭐ DEFAULT
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (!isOpen) { setProgress(100); clearTimers(); return; }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') { event.preventDefault(); clearTimers(); onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (autoCloseDelay > 0) {
      const startTime = Date.now();
      setProgress(100);
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress(Math.max((1 - elapsed / autoCloseDelay) * 100, 0));
      }, 50);
      timerRef.current = setTimeout(() => { clearTimers(); onClose(); }, autoCloseDelay);
    }
    return () => { window.removeEventListener('keydown', handleKeyDown); clearTimers(); };
  }, [isOpen, autoCloseDelay, onClose, clearTimers]);

  const handleClose = useCallback(() => { clearTimers(); onClose(); }, [clearTimers, onClose]);

  if (!isMounted) return null;

  const colors = isDark
    ? {
        overlay: 'rgba(15, 23, 42, 0.90)',
        card: '#0F172A',
        border: 'rgba(255,255,255,0.12)',
        divider: 'rgba(255,255,255,0.08)',
        text: '#F8FAFC',
        muted: '#94A3B8',
        subtle: '#94A3B8',
        iconBg: 'rgba(239, 68, 68, 0.12)',
        icon: '#EF4444',
        detailsBg: 'rgba(30, 41, 59, 0.5)',
        detailsBorder: 'rgba(239, 68, 68, 0.2)',
        button: '#EF4444',
        buttonHover: '#DC2626',
        closeHover: 'rgba(255,255,255,0.07)',
        progressBg: 'rgba(255,255,255,0.08)',
        progress: '#EF4444',
      }
    : {
        overlay: 'rgba(15, 23, 42, 0.55)',
        card: '#FFFFFF',
        border: '#E2E8F0',
        divider: '#F1F5F9',
        text: '#0F172A',
        muted: '#475569',
        subtle: '#64748B',
        iconBg: '#FEF2F2',
        icon: '#EF4444',
        detailsBg: '#F8FAFC',
        detailsBorder: '#FECACA',
        button: '#EF4444',
        buttonHover: '#DC2626',
        closeHover: '#F8FAFC',
        progressBg: '#F1F5F9',
        progress: '#EF4444',
      };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 transition-opacity duration-180 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      style={{
        backgroundColor: colors.overlay,
        backdropFilter: 'blur(4px)',
        zIndex,  // ⭐ VAOVAO: Mampiasa ny zIndex prop
      }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) handleClose(); }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-description"
        className={`relative z-10 w-[380px] h-[320px] flex flex-col items-center justify-center overflow-hidden rounded-2xl border shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-all duration-180 ease-out ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-1 scale-[0.985] opacity-0'}`}
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-danger-500" />
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150"
          style={{ color: colors.subtle }}
          onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = colors.closeHover; event.currentTarget.style.color = colors.text; }}
          onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = 'transparent'; event.currentTarget.style.color = colors.subtle; }}
        >
          <X size={17} strokeWidth={2} />
        </button>
        <div className="flex flex-col items-center justify-center text-center px-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border" style={{ backgroundColor: colors.iconBg, borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#FECACA' }}>
            <XCircle size={22} strokeWidth={2} style={{ color: colors.icon }} />
          </div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-danger-600 dark:text-danger-400">Erreur</div>
          <h2 id="error-modal-title" className="text-[18px] font-semibold leading-6 tracking-[-0.01em] mb-2" style={{ color: colors.text }}>{title}</h2>
          <div id="error-modal-description" className="text-[14px] font-normal leading-5" style={{ color: colors.muted }}>{message}</div>
          {details && (
            <div className="mt-3 rounded-xl border px-4 py-2.5 w-full text-left" style={{ backgroundColor: colors.detailsBg, borderColor: colors.detailsBorder }}>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em]" style={{ color: colors.subtle }}>Détails</div>
              <p className="whitespace-pre-wrap break-words text-[12.5px] leading-5 font-mono" style={{ color: colors.muted }}>{details}</p>
            </div>
          )}
        </div>
        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="min-w-[88px] rounded-lg px-6 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-danger-500/30"
            style={{ backgroundColor: colors.button }}
            onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = colors.buttonHover; }}
            onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = colors.button; }}
          >
            {buttonText}
          </button>
        </div>
        {autoCloseDelay > 0 && (
          <div className="absolute bottom-0 left-0 h-[2px] w-full" style={{ backgroundColor: colors.progressBg }}>
            <div className="h-full" style={{ width: `${progress}%`, backgroundColor: colors.progress, transition: 'width 50ms linear' }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorModal;