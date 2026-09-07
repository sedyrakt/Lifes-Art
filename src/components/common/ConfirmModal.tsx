import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, CheckCircle, ShieldAlert } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'red' | 'green' | 'amber' | 'primary';
  icon?: React.ReactNode;
  isDark?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, onClose, onConfirm, title, message,
  confirmText = 'Confirmer', cancelText = 'Annuler',
  confirmColor = 'red', icon, isDark: propIsDark,
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;

  const [isMounted, setIsMounted] = useState(isOpen);
  useEffect(() => {
    if (isOpen) { setIsMounted(true); return; }
    const timer = window.setTimeout(() => setIsMounted(false), 180);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key === 'Enter') { event.preventDefault(); onConfirm(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isMounted) return null;

  const overlayColor = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.55)';
  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const mutedColor = isDark ? '#94A3B8' : '#475569';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9';
  const footerBg = isDark ? 'rgba(15, 23, 42, 0.5)' : '#F8FAFC';

  const colorConfig = {
    red: {
      icon: 'text-danger-600 dark:text-danger-400',
      iconBg: 'bg-danger-50 border-danger-100 dark:bg-danger-500/10 dark:border-danger-500/20',
      accent: 'bg-danger-500',
      button: 'bg-danger-600 hover:bg-danger-700 dark:bg-danger-500 dark:hover:bg-danger-600',
      eyebrow: 'text-danger-600 dark:text-danger-400',
    },
    green: {
      icon: 'text-success-600 dark:text-success-400',
      iconBg: 'bg-success-50 border-success-100 dark:bg-success-500/10 dark:border-success-500/20',
      accent: 'bg-success-500',
      button: 'bg-success-600 hover:bg-success-700 dark:bg-success-500 dark:hover:bg-success-600',
      eyebrow: 'text-success-600 dark:text-success-400',
    },
    amber: {
      icon: 'text-warning-600 dark:text-warning-400',
      iconBg: 'bg-warning-50 border-warning-100 dark:bg-warning-500/10 dark:border-warning-500/20',
      accent: 'bg-warning-500',
      button: 'bg-warning-600 hover:bg-warning-700 dark:bg-warning-500 dark:hover:bg-warning-600',
      eyebrow: 'text-warning-600 dark:text-warning-400',
    },
    primary: {
      icon: 'text-brand-600 dark:text-brand-400',
      iconBg: 'bg-brand-50 border-brand-100 dark:bg-brand-500/10 dark:border-brand-500/20',
      accent: 'bg-brand-500',
      button: 'bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600',
      eyebrow: 'text-brand-600 dark:text-brand-400',
    },
  };

  const safeColor = colorConfig[confirmColor] ? confirmColor : 'red';
  const colors = colorConfig[safeColor];

  const getDefaultIcon = () => {
    const commonClass = `h-[22px] w-[22px] ${colors.icon}`;
    switch (safeColor) {
      case 'green': return <CheckCircle className={commonClass} strokeWidth={2} />;
      case 'amber': return <AlertTriangle className={commonClass} strokeWidth={2} />;
      case 'primary': return <ShieldAlert className={commonClass} strokeWidth={2} />;
      default: return <AlertTriangle className={commonClass} strokeWidth={2} />;
    }
  };

  const iconToShow = icon || getDefaultIcon();

  const formatMessage = (msg: string) => {
    const parts = msg.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold" style={{ color: textColor }}>{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-200 ease-out ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 backdrop-blur-[4px]" style={{ backgroundColor: overlayColor }} aria-hidden="true" />
      
      <div
        className={`relative z-10 w-[380px] h-[320px] flex flex-col items-center justify-center overflow-hidden rounded-2xl border shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-all duration-200 ease-out ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.97]'}`}
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`absolute inset-x-0 top-0 h-[3px] ${colors.accent}`} />
        
        <button 
          type="button" 
          onClick={onClose} 
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 active:scale-95"
          style={{ color: mutedColor }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC'; 
            e.currentTarget.style.color = textColor; 
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.backgroundColor = 'transparent'; 
            e.currentTarget.style.color = mutedColor; 
          }}
          aria-label="Fermer"
        >
          <X size={17} strokeWidth={2} />
        </button>

        <div className="flex flex-col items-center justify-center text-center px-8">
          <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full border ${colors.iconBg}`}>
            {iconToShow}
          </div>
          <div className={`mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${colors.eyebrow}`}>Confirmation</div>
          <h2 id="confirm-modal-title" className="text-[18px] font-semibold leading-6 tracking-[-0.01em] mb-2" style={{ color: textColor }}>
            {title}
          </h2>
          <div id="confirm-modal-message" className="text-[14px] font-normal leading-5" style={{ color: mutedColor }}>
            {formatMessage(message)}
          </div>
        </div>

        <div 
          className="mt-6 flex items-center justify-center gap-2 px-6 py-3"
        >
          {cancelText && (
            <button 
              type="button" 
              onClick={onClose} 
              className="h-10 rounded-lg border px-5 text-[13px] font-medium transition-all duration-150 active:scale-[0.98]"
              style={{ 
                borderColor: cardBorder, 
                backgroundColor: cardBg, 
                color: mutedColor 
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.backgroundColor = isDark ? '#1E293B' : '#F8FAFC'; 
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.20)' : '#CBD5E1'; 
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.backgroundColor = cardBg; 
                e.currentTarget.style.borderColor = cardBorder; 
              }}
            >
              {cancelText}
            </button>
          )}
          <button 
            type="button" 
            onClick={onConfirm} 
            className={`h-10 rounded-lg px-6 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98] ${colors.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;