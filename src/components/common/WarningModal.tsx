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

const WarningModal: React.FC<WarningModalProps> = ({ isOpen, onClose, title, message, details, buttonText = 'OK', autoCloseDelay = 5000, isDark: propIsDark }) => {
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
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' || event.key === 'Enter') { event.preventDefault(); handleClose(); } };
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

  const colors = isDark ? {
    overlay: 'rgba(15, 23, 42, 0.90)', card: '#0F172A', border: 'rgba(255,255,255,0.12)', divider: 'rgba(255,255,255,0.08)',
    text: '#F8FAFC', muted: '#94A3B8', subtle: '#94A3B8', iconBg: 'rgba(245, 158, 11, 0.12)', icon: '#F59E0B',
    detailsBg: 'rgba(30, 41, 59, 0.6)', detailsBorder: 'rgba(245, 158, 11, 0.2)', button: '#F59E0B', buttonHover: '#D97706', closeHover: 'rgba(255,255,255,0.07)', progressBg: 'rgba(255,255,255,0.08)', progress: '#F59E0B'
  } : {
    overlay: 'rgba(15, 23, 42, 0.55)', card: '#FFFFFF', border: '#E2E8F0', divider: '#F1F5F9', text: '#0F172A', muted: '#475569', subtle: '#64748B',
    iconBg: '#FEF3C7', icon: '#D97706', detailsBg: '#F8FAFC', detailsBorder: '#FDE68A', button: '#F59E0B', buttonHover: '#D97706', closeHover: '#F8FAFC', progressBg: '#F1F5F9', progress: '#F59E0B'
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} style={{ backgroundColor: colors.overlay, backdropFilter: 'blur(4px)' }} onMouseDown={(event) => { if (event.target === event.currentTarget) handleClose(); }} role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="warning-modal-title" className={`relative z-10 w-[380px] h-[320px] flex flex-col items-center justify-center overflow-hidden rounded-2xl border shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-all duration-200 ease-out ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.97]'}`} style={{ backgroundColor: colors.card, borderColor: colors.border }} onMouseDown={(event) => event.stopPropagation()}>
        <div className="absolute inset-x-0 top-0 h-[3px] bg-amber-500" />
        <button type="button" onClick={handleClose} aria-label="Fermer" className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150" style={{ color: colors.subtle }} onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = colors.closeHover; event.currentTarget.style.color = colors.text; }} onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = 'transparent'; event.currentTarget.style.color = colors.subtle; }}>
          <X size={17} strokeWidth={2} />
        </button>
        <div className="flex flex-col items-center justify-center text-center px-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border" style={{ backgroundColor: colors.iconBg, borderColor: isDark ? 'rgba(245, 158, 11, 0.20)' : '#FDE68A' }}>
            <AlertTriangle size={22} strokeWidth={2} style={{ color: colors.icon }} />
          </div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-600 dark:text-amber-400">Attention</div>
          <h2 id="warning-modal-title" className="text-[18px] font-semibold leading-6 tracking-[-0.01em] mb-2" style={{ color: colors.text }}>{title}</h2>
          <div className="text-[14px] font-normal leading-5" style={{ color: colors.muted }}>{message}</div>
          {details && (
            <div className="mt-3 rounded-xl border px-4 py-2.5 w-full text-left" style={{ backgroundColor: colors.detailsBg, borderColor: colors.detailsBorder }}>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em]" style={{ color: colors.subtle }}>Détails</div>
              <p className="whitespace-pre-wrap break-words text-[12.5px] leading-5 font-mono" style={{ color: colors.muted }}>{details}</p>
            </div>
          )}
        </div>
        <div className="mt-6 flex items-center justify-center">
          <button type="button" onClick={handleClose} className="min-w-[88px] rounded-lg px-6 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-500/30" style={{ backgroundColor: colors.button }} onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = colors.buttonHover; }} onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = colors.button; }}>{buttonText}</button>
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

export default WarningModal;