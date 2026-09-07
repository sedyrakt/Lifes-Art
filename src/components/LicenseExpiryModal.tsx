
import React, { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { useLicense } from '../contexts/LicenseContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';

const STORAGE_KEY = 'lifesart_license_warn_dismissed';

function getDismissedDate(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setDismissedToday() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(STORAGE_KEY, today);
  } catch {
    // ignore
  }
}

function wasDismissedToday(): boolean {
  const d = getDismissedDate();
  if (!d) return false;
  const today = new Date().toISOString().slice(0, 10);
  return d === today;
}

const LicenseExpiryModal: React.FC = () => {
  const {
    isValid,
    isActive,
    isLifetime,
    isTest,
    daysRemaining,
    minutesRemaining,
    status,
    packageName,
    expirationDate,
  } = useLicense();

  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  // Tsy aseho amin'ny public routes
  const isPublic =
    location.pathname.includes('license') ||
    location.pathname.includes('login') ||
    location.pathname.includes('register') ||
    location.hash.includes('/license') ||
    location.hash.includes('/login');

  const warning = useMemo(() => {
    if (!isValid || !isActive || isLifetime) return null;

    // Grace period (raha avy amin'ny API)
    if (status === 'grace' || (status as string) === 'GRACE') {
      return {
        level: 'critical' as const,
        title: 'Période de grâce',
        message: `Votre licence est en période de grâce. Il vous reste ${daysRemaining} jour(s) pour la renouveler.`,
      };
    }

    // Test licence
    if (isTest && minutesRemaining != null && minutesRemaining <= 5) {
      return {
        level: 'critical' as const,
        title: 'Licence test bientôt expirée',
        message: `Il reste environ ${minutesRemaining} minute(s) sur votre licence de test.`,
      };
    }

    // Standard: ≤ 7 jours
    if (!isTest && daysRemaining > 0 && daysRemaining <= 7) {
      return {
        level: daysRemaining <= 3 ? ('critical' as const) : ('warning' as const),
        title: 'Licence bientôt expirée',
        message: `Votre licence (${packageName || 'actuelle'}) expire dans ${daysRemaining} jour(s)${
          expirationDate
            ? ` (${new Date(expirationDate).toLocaleDateString('fr-FR')})`
            : ''
        }. Pensez à la renouveler.`,
      };
    }

    return null;
  }, [
    isValid,
    isActive,
    isLifetime,
    isTest,
    daysRemaining,
    minutesRemaining,
    status,
    packageName,
    expirationDate,
  ]);

  useEffect(() => {
    if (isPublic || !warning) {
      setOpen(false);
      return;
    }
    if (wasDismissedToday()) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [warning, isPublic]);

  if (!open || !warning) return null;

  const isCritical = warning.level === 'critical';

  const colors = isDark
    ? {
        overlay: 'rgba(2, 6, 23, 0.72)',
        card: '#0F172A',
        border: '#1E293B',
        text: '#F8FAFC',
        muted: '#94A3B8',
        accent: isCritical ? '#F87171' : '#FBBF24',
        accentBg: isCritical ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.12)',
        btn: '#6366F1',
        btnSecondary: '#1E293B',
      }
    : {
        overlay: 'rgba(15, 23, 42, 0.35)',
        card: '#FFFFFF',
        border: '#E2E8F0',
        text: '#0F172A',
        muted: '#64748B',
        accent: isCritical ? '#DC2626' : '#D97706',
        accentBg: isCritical ? '#FEF2F2' : '#FFFBEB',
        btn: '#4F46E5',
        btnSecondary: '#F1F5F9',
      };

  const handleLater = () => {
    setDismissedToday();
    setOpen(false);
  };

  const handleRenew = () => {
    setDismissedToday();
    setOpen(false);
    navigate('/license');
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center"
      style={{ backgroundColor: colors.overlay }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="license-expiry-title"
    >
      <div
        className="w-full max-w-[420px] overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: colors.border }}>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: colors.accentBg }}
          >
            {isCritical ? (
              <AlertTriangle size={20} style={{ color: colors.accent }} />
            ) : (
              <Clock size={20} style={{ color: colors.accent }} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: colors.accent }}
            >
              Licence
            </p>
            <h2
              id="license-expiry-title"
              className="text-[15px] font-semibold"
              style={{ color: colors.text }}
            >
              {warning.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleLater}
            className="rounded-lg p-1.5 transition hover:opacity-70"
            style={{ color: colors.muted }}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-[14px] leading-relaxed" style={{ color: colors.muted }}>
            {warning.message}
          </p>
        </div>

        {/* Actions */}
        <div
          className="flex items-center justify-end gap-2 border-t px-5 py-3"
          style={{ borderColor: colors.border }}
        >
          <button
            type="button"
            onClick={handleLater}
            className="rounded-lg px-4 py-2 text-[13px] font-medium transition hover:opacity-80"
            style={{
              backgroundColor: colors.btnSecondary,
              color: colors.text,
            }}
          >
            Plus tard
          </button>
          <button
            type="button"
            onClick={handleRenew}
            className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: colors.btn }}
          >
            Renouveler
          </button>
        </div>
      </div>
    </div>
  );
};

export default LicenseExpiryModal;