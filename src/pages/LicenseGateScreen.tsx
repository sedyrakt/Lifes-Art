import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Cloud,
  CreditCard,
  KeyRound,
  LifeBuoy,
  Loader2,
  Moon,
  ShieldCheck,
  Sun,
  XCircle,
  Zap,
  BarChart3,
  Users as UsersIcon,
  LayoutDashboard,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLicense } from '../contexts/LicenseContext';
import { useAuth } from '../contexts/AuthContext';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';

const LOGO_DARK = './images/logodark.png';
const LOGO_LIGHT = './images/logolight.png';
const MINIATURE_DARK_PATH = './images/miniaturedark.jpeg';
const MINIATURE_LIGHT_PATH = './images/miniaturelight.jpeg';


const FormInput: React.FC<{
  label: string;
  name?: string;
  value: string;
  placeholder?: string;
  type?: string;
  icon: React.ElementType;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rightElement?: React.ReactNode;
}> = ({ label, name, value, placeholder, type = 'text', icon: Icon, error, disabled, autoComplete, onChange, rightElement }) => {
  const { isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);
  const borderColor = hasError ? '#FCA5A5' : focused ? '#4F46E5' : isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? 'transparent' : '#FFFFFF';

  return (
    <div className="min-w-0">
      {label && (
        <label htmlFor={name} className="mb-1 block text-[13px] font-medium" style={{ color: mutedColor }}>
          {label}
        </label>
      )}
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-colors"
          style={{ color: focused ? '#4F46E5' : isDark ? '#64748B' : '#94A3B8' }}
        />
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="h-9 w-full rounded-md border pl-8 pr-3 text-[13px] font-medium outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: inputBg,
            color: textColor,
            borderColor,
            boxShadow: focused && !hasError ? '0 0 0 2px rgba(79,70,229,0.12)' : 'none',
          }}
        />
        {rightElement}
      </div>
      {error && <p className="mt-1 text-[12px] font-medium text-red-500">{error}</p>}
    </div>
  );
};

const SkeletonLicense = () => {
  const { isDark } = useTheme();
  const bgColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0';
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-lg ${className}`} style={{ background: bgColor }} />
  );

  return (
    <div className={`flex min-h-screen w-full items-center justify-center p-3 ${isDark ? 'bg-[#0F172A]' : 'bg-white'}`}>
      <div className="flex w-full max-w-[980px] overflow-hidden rounded-xl border" style={{ background: isDark ? '#0F172A' : '#FFFFFF', borderColor, boxShadow: isDark ? '0 25px 50px -12px rgba(0,0,0,0.6)' : '0 25px 50px -12px rgba(79,70,229,0.25)' }}>
        <div className="hidden w-1/2 flex-col justify-between border-r p-5 lg:flex" style={{ background: isDark ? '#1E293B' : '#EEF2FF', borderColor }}>
          <div>
            <div className="mb-6 flex items-center gap-2"><Skeleton className="h-7 w-7 rounded-lg" /><Skeleton className="h-3 w-16" /></div>
            <Skeleton className="mb-1 h-6 w-32" /><Skeleton className="h-3 w-48" />
          </div>
          <div className="space-y-2"><Skeleton className="h-7 w-full" /><Skeleton className="h-7 w-full" /><Skeleton className="h-3 w-28" /><Skeleton className="h-8 w-full" /></div>
        </div>
        <div className="flex w-full flex-col justify-center p-5 lg:w-1/2">
          <div className="space-y-4"><Skeleton className="h-6 w-32" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-full" /></div>
        </div>
      </div>
    </div>
  );
};

const LicenseGateScreen: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    status: licenseStatus,
    isValid: licenseIsValid,
    isActive: licenseIsActive,
    packageName,
    licenseKey: currentLicenseKey,
    daysRemaining,
    isTest,
    isLifetime,
    expirationDate,
    isLoading: licenseLoading,
    activateWithCode,
    reset,
  } = useLicense();

  const [activationCode, setActivationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const logoSrc = isDark ? LOGO_DARK : LOGO_LIGHT;
  const backgroundImage = "url('./images/abstract3.jpeg')";
  const bgOverlay = isDark
    ? 'linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.55) 100%)'
    : 'linear-gradient(to right, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.45) 100%)';

  const surface = isDark ? '#0F172A' : '#FFFFFF';
  const surfaceAlt = isDark ? '#1E293B' : '#EEF2FF';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';
  const shadow = isDark ? '0 25px 50px -12px rgba(0,0,0,0.6)' : '0 25px 50px -12px rgba(79,70,229,0.25)';
  const primaryBg = isDark ? 'rgba(79,70,229,0.12)' : 'rgba(79,70,229,0.06)';

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPageLoading || licenseLoading) return;
    if (!licenseIsValid || !licenseIsActive) return;
    navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true });
  }, [licenseIsValid, licenseIsActive, isAuthenticated, isPageLoading, licenseLoading, navigate]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!activationCode.trim()) {
      setError("Veuillez entrer votre code d'activation.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await activateWithCode(activationCode.trim());
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true });
        }, 2000);
      } else {
        setError(result.message || "Code d'activation invalide");
      }
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue lors de l'activation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetLicense = async () => {
    try {
      await reset();
      setActivationCode('');
      setError(null);
      setShowSuccess(false);
    } catch {
      setError('Impossible de réinitialiser la licence.');
    }
  };

  if (isPageLoading || (licenseLoading && !licenseIsValid)) {
    return <SkeletonLicense />;
  }

  // Si licence active → affiche la page "licence active" (style identique)
  if (licenseIsValid && licenseIsActive) {
    const expiryDate = expirationDate ? new Date(expirationDate) : null;
    const formattedExpiry = expiryDate
      ? expiryDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'Jamais';

    return (
      <div className="relative flex min-h-screen w-full items-center justify-center p-3 bg-cover bg-center" style={{ backgroundImage, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ background: bgOverlay }} />
        <button
          type="button"
          onClick={toggleTheme}
          className="fixed right-4 top-4 z-40 flex h-7 w-7 items-center justify-center rounded-full border transition-all hover:scale-105"
          style={{ background: surface, borderColor, color: '#4F46E5', boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.4)' : '0 4px 15px rgba(79,70,229,0.1)' }}
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        <div className="relative z-10 flex w-full max-w-[980px] overflow-hidden rounded-xl border" style={{ background: surface, borderColor, boxShadow: shadow }}>
          {/* LEFT PANEL */}
          <div className="hidden w-1/2 flex-col justify-between border-r p-5 lg:flex" style={{ background: surface, borderColor }}>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)', boxShadow: `0 2px 8px ${primaryBg}` }}>
                    <Cloud className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-[15px] font-bold" style={{ color: textColor }}>TahiryPro ERP</h1>
                    <p className="text-[12px] font-medium" style={{ color: mutedColor }}>Enterprise Solution</p>
                  </div>
                </div>
                <div>
                  <h2 className="text-[19px] font-bold leading-tight" style={{ color: textColor }}>Licence<br />Active</h2>
                  <p className="mt-1 text-[12px]" style={{ color: mutedColor }}>Votre licence est valide et prête à l'utilisation</p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg border mx-auto w-full max-w-[400px]" style={{ borderColor, background: surface, boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.4)' : '0 4px 15px rgba(79,70,229,0.1)' }}>
                <img src={isDark ? MINIATURE_DARK_PATH : MINIATURE_LIGHT_PATH} alt="Dashboard Preview" className="w-full h-auto object-contain max-h-[300px]" />
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-semibold" style={{ color: textColor }}>Pourquoi choisir TahiryPro ?</p>
                {[
                  "Gestion complète : Produits, Ventes, Achats, Stock & RH.",
                  "Tableaux de bord en temps réel pour vos décisions.",
                  "Sécurité des données et accès multi-utilisateurs."
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: '#4F46E5' }} />
                    <span className="text-[13px] leading-5" style={{ color: mutedColor }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 mt-6">
              {[{ icon: ShieldCheck, title: 'Sécurisé' }, { icon: BarChart3, title: 'Analytics' }, { icon: UsersIcon, title: 'Équipe' }, { icon: LayoutDashboard, title: 'Dashboard' }].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5" style={{ borderColor }}>
                  <item.icon size={12} className="text-brand-500" />
                  <span className="text-[12px] font-medium truncate" style={{ color: textColor }}>{item.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex w-full flex-col justify-between p-5 lg:w-1/2">
            <div className="mb-4 flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)' }}>
                <Cloud className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[14px] font-bold" style={{ color: textColor }}>TahiryPro</span>
            </div>

            <img src={logoSrc} alt="TahiryPro" className="mx-auto mb-4 h-20 w-20 object-contain" />

            <div className="mb-5 text-center">
              <h1 className="text-[22px] font-bold" style={{ color: textColor }}>Licence Active</h1>
              <p className="mt-1 text-[13px]" style={{ color: mutedColor }}>Votre licence est valide</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor, background: surfaceAlt }}>
                <div>
                  <p className="text-[12px] font-medium" style={{ color: mutedColor }}>Code d'activation</p>
                  <p className="font-mono text-[13px] font-semibold" style={{ color: textColor }}>{currentLicenseKey || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-3" style={{ borderColor }}>
                  <p className="text-[12px] font-medium" style={{ color: mutedColor }}>Plan</p>
                  <p className="text-[13px] font-semibold capitalize" style={{ color: '#4F46E5' }}>{packageName || 'Non spécifié'}</p>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor }}>
                  <p className="text-[12px] font-medium" style={{ color: mutedColor }}>Expire le</p>
                  <p className="text-[13px] font-semibold" style={{ color: textColor }}>{isLifetime ? 'Illimitée' : formattedExpiry}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border p-2 text-center" style={{ borderColor }}>
                  <p className="text-[12px] font-medium" style={{ color: mutedColor }}>Type</p>
                  <p className="text-[12px] font-semibold" style={{ color: textColor }}>{isTest ? 'Test' : isLifetime ? 'Lifetime' : 'Standard'}</p>
                </div>
                <div className="rounded-lg border p-2 text-center" style={{ borderColor }}>
                  <p className="text-[12px] font-medium" style={{ color: mutedColor }}>Jours restants</p>
                  <p className="text-[12px] font-semibold" style={{ color: textColor }}>{isLifetime ? '∞' : daysRemaining}</p>
                </div>
                <div className="rounded-lg border p-2 text-center" style={{ borderColor }}>
                  <p className="text-[12px] font-medium" style={{ color: mutedColor }}>Statut</p>
                  <p className="text-[12px] font-semibold" style={{ color: '#10B981' }}>Active</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true })}
                className="group flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[14px] font-semibold text-white transition-all hover:opacity-95 bg-brand-500 hover:bg-brand-600"
                style={{ boxShadow: `0 4px 12px ${primaryBg}` }}
              >
                {isAuthenticated ? 'Accéder au Dashboard' : 'Se connecter'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={handleResetLicense}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[14px] font-medium transition-all hover:opacity-80"
                style={{ background: 'transparent', color: '#EF4444', border: `1px solid rgba(239,68,68,0.3)` }}
              >
                <XCircle className="h-4 w-4" /> Réinitialiser la licence
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between border-t pt-3" style={{ borderColor }}>
              <span className="text-[12px]" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>© 2026 TahiryPro ERP</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sinon → page d'activation
  const isExpired = licenseStatus === 'EXPIRED';

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-3 bg-cover bg-center" style={{ backgroundImage, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0" style={{ background: bgOverlay }} />

      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm" style={{ background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)' }}>
          <div className="w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border p-6 text-center" style={{ background: surface, borderColor, boxShadow: shadow }}>
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: primaryBg }}>
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
            <div className="text-[14px] font-semibold" style={{ color: textColor }}>Activation en cours</div>
            <div className="mt-1 text-[13px]" style={{ color: mutedColor }}>Vérification de votre licence...</div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggleTheme}
        className="fixed right-4 top-4 z-40 flex h-7 w-7 items-center justify-center rounded-full border transition-all hover:scale-105"
        style={{ background: surface, borderColor, color: '#4F46E5', boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.4)' : '0 4px 15px rgba(79,70,229,0.1)' }}
      >
        {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </button>

      <div className="relative z-10 flex w-full max-w-[980px] overflow-hidden rounded-xl border" style={{ background: surface, borderColor, boxShadow: shadow }}>
        {/* LEFT PANEL */}
        <div className="hidden w-1/2 flex-col justify-between border-r p-5 lg:flex" style={{ background: surface, borderColor }}>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)', boxShadow: `0 2px 8px ${primaryBg}` }}>
                  <Cloud className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-[15px] font-bold" style={{ color: textColor }}>TahiryPro ERP</h1>
                  <p className="text-[12px] font-medium" style={{ color: mutedColor }}>Enterprise Solution</p>
                </div>
              </div>
              <div>
                <h2 className="text-[19px] font-bold leading-tight" style={{ color: textColor }}>
                  {isExpired ? 'Licence expirée' : 'Activez votre'}
                  <br />
                  {isExpired ? '— contactez l\'admin' : 'licence'}
                </h2>
                <p className="mt-1 text-[12px]" style={{ color: mutedColor }}>
                  {isExpired ? 'Votre licence a expiré. Veuillez contacter l\'administrateur.' : 'Débloquez toutes les fonctionnalités'}
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg border mx-auto w-full max-w-[400px]" style={{ borderColor, background: surface, boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.4)' : '0 4px 15px rgba(79,70,229,0.1)' }}>
              <img src={isDark ? MINIATURE_DARK_PATH : MINIATURE_LIGHT_PATH} alt="Dashboard Preview" className="w-full h-auto object-contain max-h-[300px]" />
            </div>

            <div className="space-y-2">
              <p className="text-[13px] font-semibold" style={{ color: textColor }}>Pourquoi choisir TahiryPro ?</p>
              {[
                "Gestion complète : Produits, Ventes, Achats, Stock & RH.",
                "Tableaux de bord en temps réel pour vos décisions.",
                "Sécurité des données et accès multi-utilisateurs."
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: '#4F46E5' }} />
                  <span className="text-[13px] leading-5" style={{ color: mutedColor }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 mt-6">
            {[{ icon: ShieldCheck, title: 'Sécurisé' }, { icon: BarChart3, title: 'Analytics' }, { icon: UsersIcon, title: 'Équipe' }, { icon: LayoutDashboard, title: 'Dashboard' }].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5" style={{ borderColor }}>
                <item.icon size={12} className="text-brand-500" />
                <span className="text-[12px] font-medium truncate" style={{ color: textColor }}>{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex w-full flex-col justify-between p-5 lg:w-1/2">
          <div className="mb-4 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)' }}>
              <Cloud className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[14px] font-bold" style={{ color: textColor }}>TahiryPro</span>
          </div>

          <img src={logoSrc} alt="TahiryPro" className="mx-auto mb-4 h-20 w-20 object-contain" />

          <div className="mb-5 text-center">
            <h1 className="text-[22px] font-bold" style={{ color: textColor }}>
              {isExpired ? 'Licence expirée' : 'Activation de licence'}
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: mutedColor }}>
              {isExpired
                ? "Votre licence a expiré. Veuillez contacter l'administrateur pour obtenir un nouveau code d'activation."
                : "Entrez votre code d'activation pour accéder à toutes les fonctionnalités."}
            </p>
          </div>

          {isExpired && expirationDate && (
            <div className="mb-4 flex items-center justify-between rounded-lg border p-3" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <div className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5" style={{ color: '#EF4444' }} />
                <span className="text-[12px] font-medium" style={{ color: mutedColor }}>Date d'expiration :</span>
              </div>
              <span className="text-[12px] font-semibold" style={{ color: '#EF4444' }}>
                {new Date(expirationDate).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}

          <form onSubmit={handleActivate} className="space-y-3">
            <FormInput
              label="Code d'activation"
              name="activationCode"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              placeholder="Entrez votre code d'activation"
              icon={KeyRound}
              error={error || undefined}
              disabled={isLoading || licenseLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isLoading || licenseLoading}
              className="group relative flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[14px] font-semibold text-white transition-all hover:opacity-95 disabled:opacity-50 bg-brand-500 hover:bg-brand-600"
              style={{ boxShadow: `0 4px 12px ${primaryBg}` }}
            >
              {isLoading || licenseLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Activer ma licence</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {[{ icon: Zap, text: 'Instantané' }, { icon: ShieldCheck, text: 'Sécurisé' }, { icon: Cloud, text: 'Offline' }].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-1 rounded-lg border p-2" style={{ borderColor }}>
                <item.icon size={12} style={{ color: '#4F46E5' }} />
                <span className="text-[12px] font-medium" style={{ color: mutedColor }}>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button type="button" onClick={() => navigate('/support')} className="group flex items-center gap-1 text-[12px] font-medium hover:underline" style={{ color: '#4F46E5' }}>
              <LifeBuoy className="h-3 w-3" /> Support
            </button>
            <button type="button" onClick={() => navigate('/buy-license')} className="group flex items-center gap-1 text-[12px] font-medium hover:underline" style={{ color: '#4F46E5' }}>
              <CreditCard className="h-3 w-3" /> Acheter
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between border-t pt-3" style={{ borderColor }}>
            <span className="text-[12px]" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>© 2026 TahiryPro ERP</span>
            <div className="flex gap-3">
              <Link to="/terms" className="text-[12px] hover:underline" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Conditions</Link>
              <Link to="/support" className="text-[12px] hover:underline" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Support</Link>
            </div>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Licence activée !"
        message="Votre licence a été activée avec succès. Redirection..."
        buttonText="Continuer"
        autoCloseDelay={2000}
      />
      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        title="Erreur d'activation"
        message={error || ''}
        buttonText="Réessayer"
        autoCloseDelay={4000}
      />
    </div>
  );
};

export default LicenseGateScreen;