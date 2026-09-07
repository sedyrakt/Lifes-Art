
import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const THEME = {
  light: {
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    surfaceSoft: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#64748B',
    subMuted: '#94A3B8',
    primary: '#4F46E5',
    green: '#10B981',
    greenBg: 'rgba(16,185,129,0.08)',
    red: '#EF4444',
    redBg: 'rgba(239,68,68,0.08)',
  },
  dark: {
    surface: '#0F172A',
    surfaceAlt: '#1E293B', 
    surfaceSoft: '#0F172A',
    border: 'rgba(255,255,255,0.12)',
    text: '#F8FAFC',
    muted: '#94A3B8',
    subMuted: '#94A3B8',
    primary: '#4F46E5',
    green: '#10B981',
    greenBg: 'rgba(16,185,129,0.15)',
    red: '#EF4444',
    redBg: 'rgba(239,68,68,0.15)',
  },
};

const PACKAGES: Record<string, { id: string; name: string; prefix: string; color: string }> = {
  test: { id: 'test', name: 'Test (30 min)', prefix: 'TS', color: '#4F46E5' },
  testpro: { id: 'testpro', name: 'Test Pro (24h)', prefix: 'TP', color: '#4F46E5' },
  basic: { id: 'basic', name: 'Basic', prefix: 'BS', color: '#4F46E5' },
  standard: { id: 'standard', name: 'Standard', prefix: 'ST', color: '#4F46E5' },
  premium: { id: 'premium', name: 'Premium', prefix: 'PR', color: '#D4A84F' },
  national: { id: 'national', name: 'National', prefix: 'NA', color: '#10B981' },
  centralized: { id: 'centralized', name: 'Centralized', prefix: 'CE', color: '#EF4444' },
};

export interface LicenseInfo {
  packageType: string | null;
  packageName: string;
  daysRemaining: number;
  minutesRemaining?: number | null;
  expirationDate: string | null;
  activatedAt: string | null;
  isActive: boolean;
  isUnlimited: boolean;
  isTest: boolean;
  customerName: string;
  companyName: string;
  licenseKey: string;
}

interface ParametresLicenseProps { status?: string | null; licenseInfo: LicenseInfo; }

const ParametresLicense: React.FC<ParametresLicenseProps> = ({ status, licenseInfo }) => {
  const { isDark } = useTheme();
  const theme = isDark ? THEME.dark : THEME.light;
  const { user } = useAuth();

  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const effectiveExpirationDate = useMemo(() => {
    if (licenseInfo?.isUnlimited) return null;
    if (!licenseInfo?.expirationDate) return null;
    const d = new Date(licenseInfo.expirationDate);
    return isNaN(d.getTime()) ? null : d;
  }, [licenseInfo?.expirationDate, licenseInfo?.isUnlimited]);

  const pkgInfo = useMemo(() => {
    if (!licenseInfo?.packageType) return null;
    const raw = licenseInfo.packageType.toLowerCase().trim();
    const pkg = PACKAGES[raw];
    if (!pkg) return null;
    return { ...pkg, name: licenseInfo.packageName || pkg.name };
  }, [licenseInfo]);

  useEffect(() => {
    if (!effectiveExpirationDate || licenseInfo?.isUnlimited) {
      setTimeRemaining({ days: -1, hours: -1, minutes: -1, seconds: -1 });
      return;
    }
    const updateTimer = () => {
      const diff = effectiveExpirationDate.getTime() - Date.now();
      if (diff > 0) {
        setTimeRemaining({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) });
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [effectiveExpirationDate, licenseInfo?.isUnlimited]);

  const isActive = status === 'VALID' || status === 'ACTIVE' || status === 'active' || licenseInfo?.isActive === true;
  const statusColor = isActive ? theme.green : theme.red;

  const renderTimer = () => {
    if (licenseInfo?.isUnlimited) return (<div className="flex items-center justify-center gap-1.5 py-0.5" style={{ color: theme.green }}><span className="text-[13px] font-bold uppercase">Illimité</span></div>);
    if (!effectiveExpirationDate) return (<div className="flex items-center justify-center gap-1.5 py-0.5" style={{ color: theme.muted }}><span className="text-[13px] font-semibold">Aucune date</span></div>);
    if (timeRemaining.days === 0 && timeRemaining.hours === 0 && timeRemaining.minutes === 0 && timeRemaining.seconds === 0) return (<div className="flex items-center justify-center gap-1.5 py-0.5" style={{ color: theme.red }}><span className="text-[13px] font-bold uppercase">Expirée</span></div>);

    const isNear = timeRemaining.days <= 7;
    return (
      <div className="flex items-center justify-center gap-1.5">
        {[{ label: 'J', value: timeRemaining.days }, { label: 'H', value: timeRemaining.hours }, { label: 'M', value: timeRemaining.minutes }, { label: 'S', value: timeRemaining.seconds }].map((item, idx) => (
          <div key={idx} className="rounded border px-2 py-1 text-center" style={{ background: theme.surfaceAlt, borderColor: isNear ? `${theme.red}40` : theme.border }}>
            <span className="text-[13px] font-bold tabular-nums" style={{ color: isNear ? theme.red : theme.text }}>{String(Math.max(0, item.value)).padStart(2, '0')}</span>
            <span className="ml-0.5 text-[10px] font-bold uppercase" style={{ color: theme.subMuted }}>{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: theme.border, background: theme.surface }}>
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: theme.border }}>
        <div><h3 className="text-[15px] font-bold" style={{ color: theme.text }}>Licence</h3><p className="text-[12px]" style={{ color: theme.muted }}>TahiryPro ERP</p></div>
        <div className="rounded-md border px-2.5 py-1 text-[12px] font-bold uppercase" style={{ background: isActive ? theme.greenBg : theme.redBg, color: statusColor, borderColor: `${statusColor}40` }}>{isActive ? 'Active' : 'Inactive'}</div>
      </div>
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: theme.border }}>
        <div>
          <div className="mb-1 flex items-center gap-2">
            {pkgInfo && (<span className="inline-flex items-center rounded border px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider" style={{ background: theme.surface, borderColor: `${pkgInfo.color}30`, color: pkgInfo.color }}>{pkgInfo.prefix}</span>)}
            {licenseInfo?.isUnlimited && (<span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-bold text-amber-500">LIFETIME</span>)}
            {licenseInfo?.isTest && (<span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[11px] font-bold text-white">TEST</span>)}
          </div>
          <h4 className="text-[14px] font-bold" style={{ color: theme.text }}>{pkgInfo?.name || licenseInfo?.packageName || 'Aucune licence'}</h4>
        </div>
        {licenseInfo?.licenseKey && (<div className="rounded border px-2.5 py-1" style={{ background: theme.surfaceAlt, borderColor: theme.border }}><code className="text-[12px] font-bold tracking-wide" style={{ color: theme.text }}>{licenseInfo.licenseKey}</code></div>)}
      </div>
      <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: theme.border }}>
        <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Expiration</span>
        {renderTimer()}
      </div>
      <div className="grid grid-cols-2 border-b" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-2.5 border-r px-4 py-2.5" style={{ borderColor: theme.border }}>
          <div><p className="text-[11px] font-bold uppercase" style={{ color: theme.subMuted }}>Activée le</p><p className="text-[13px] font-semibold" style={{ color: theme.text }}>{licenseInfo?.activatedAt ? new Date(licenseInfo.activatedAt).toLocaleDateString('fr-FR') : '—'}</p></div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5">
          <div><p className="text-[11px] font-bold uppercase" style={{ color: theme.subMuted }}>Expire le</p><p className="text-[13px] font-semibold" style={{ color: theme.text }}>{licenseInfo?.isUnlimited ? 'Illimité' : effectiveExpirationDate ? effectiveExpirationDate.toLocaleDateString('fr-FR') : '—'}</p></div>
        </div>
      </div>
      <div className="grid grid-cols-2" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-2.5 border-r px-4 py-2.5" style={{ borderColor: theme.border }}>
          <div className="overflow-hidden"><p className="text-[11px] font-bold uppercase" style={{ color: theme.subMuted }}>Titulaire</p><p className="truncate text-[13px] font-semibold" style={{ color: theme.text }}>{licenseInfo?.customerName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'N/A')}</p></div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5">
          <div className="overflow-hidden"><p className="text-[11px] font-bold uppercase" style={{ color: theme.subMuted }}>Entreprise</p><p className="truncate text-[13px] font-semibold" style={{ color: theme.text }}>{licenseInfo?.companyName || (user as any)?.companyName || 'N/A'}</p></div>
        </div>
      </div>
    </div>
  );
};

export default ParametresLicense;