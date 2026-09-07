import React, { useEffect, useState } from 'react';
import {
  ArrowRight, Cloud, Eye, EyeOff, KeyRound, Loader2, Lock,
  Mail, Moon, ShieldCheck, Sun, LayoutDashboard, CheckCircle2,
  Users as UsersIcon, BarChart3
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLicense } from '../contexts/LicenseContext';
import { validateEmail, validateNotEmpty } from '../utils/validators';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';

const LOGO_PATH = './images/logo.png';
const LOGO_DARK = './images/logodark.png';
const LOGO_LIGHT = './images/logolight.png';
const MINIATURE_DARK_PATH = './images/miniaturedark.jpeg';
const MINIATURE_LIGHT_PATH = './images/miniaturelight.jpeg';

const FormInput: React.FC<{
  label: string; name: string; value: string; placeholder?: string; type?: string;
  icon: React.ElementType; error?: string; disabled?: boolean; autoComplete?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; rightElement?: React.ReactNode;
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
      {label && <label htmlFor={name} className="mb-1 block text-[13px] font-medium" style={{ color: mutedColor }}>{label}</label>}
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-colors" style={{ color: focused ? '#4F46E5' : isDark ? '#64748B' : '#94A3B8' }} />
        <input
          id={name} name={name} type={type} value={value} placeholder={placeholder} disabled={disabled}
          autoComplete={autoComplete} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="h-9 w-full rounded-md border pl-8 pr-3 text-[13px] font-medium outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: inputBg,
            color: textColor,
            borderColor,
            boxShadow: focused && !hasError ? '0 0 0 2px rgba(79,70,229,0.12)' : 'none'
          }}
        />
        {rightElement}
      </div>
    </div>
  );
};

const CustomCheckbox: React.FC<{ checked: boolean; onChange: (c: boolean) => void; label: string }> = ({ checked, onChange, label }) => {
  const { isDark } = useTheme();
  const borderColor = checked ? '#4F46E5' : isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1';
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-2">
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${checked ? 'bg-brand-500 border-brand-500' : ''}`} style={{ borderColor: checked ? '#4F46E5' : borderColor }}>
        {checked && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </span>
      <span className="text-[13px] font-medium" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>{label}</span>
    </button>
  );
};

const SkeletonLogin = () => {
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
        <div className="flex w-full flex-col justify-center p-5 lg:w-1/2"><div className="space-y-4"><Skeleton className="h-6 w-32" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-full" /></div></div>
      </div>
    </div>
  );
};

const Login: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, loading: authLoading, login, error: authError, clearError, setSession } = useAuth();
  const { isLicenseValid, isLoading: licenseLoading, refresh: refreshLicense } = useLicense();
  const navigate = useNavigate();

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

  // ⭐ NOUVEAU : fond indigo pour le panneau droite en mode light
  const rightBoxBg = isDark ? surface : '#EEF2FF'; // indigo clair

  useEffect(() => { refreshLicense(); }, [refreshLicense]);
  useEffect(() => {
    if (isAuthenticated && !licenseLoading && !authLoading) {
      navigate(!isLicenseValid() ? '/license' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, licenseLoading, authLoading, isLicenseValid, navigate]);

  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);

  useEffect(() => { const t = setTimeout(() => setIsPageLoading(false), 500); return () => clearTimeout(t); }, []);
  useEffect(() => { if (authError) { setErrorMsg(authError); setShowError(true); clearError(); } }, [authError, clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!validateNotEmpty(formData.email)) e.email = 'Adresse email requise';
    else if (!validateEmail(formData.email)) e.email = "Format d'email invalide";
    if (!validateNotEmpty(formData.password)) e.password = 'Mot de passe requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!validate()) {
      setErrorMsg("Veuillez remplir correctement les champs!");
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      const success = await login(formData.email.trim(), formData.password);
      if (success) {
        const msg = !isLicenseValid()
          ? 'Connexion réussie. Veuillez activer votre licence.'
          : 'Bienvenue sur votre espace.';
        setSuccessMsg(msg);
        setShowSuccess(true);
        setTimeout(() => navigate(!isLicenseValid() ? '/license' : '/dashboard', { replace: true }), 1500);
      } else {
        setErrorMsg('Identifiants incorrects ou accès refusé.');
        setShowError(true);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur de connexion.');
      setShowError(true);
    } finally { setLoading(false); }
  };

  const handleVerify2FA = async () => {
    if (twoFACode.length !== 6) { setErrorMsg('Code 2FA invalide (6 chiffres).'); setShowError(true); return; }
    if (!pendingUserId) { setErrorMsg('Identifiant de session manquant.'); setShowError(true); return; }
    setLoading(true);
    try {
      const result = await window.api.auth.verify2FALogin(pendingUserId, twoFACode);
      if (result?.success && result?.token && result?.user) {
        setSession(result.token, result.user);
        setShow2FA(false); setTwoFACode(''); setPendingUserId(null);
        const msg = !isLicenseValid()
          ? `Bienvenue ${result.user.firstName || 'Collaborateur'} ! Veuillez activer votre licence.`
          : `Bienvenue ${result.user.firstName || 'Collaborateur'} !`;
        setSuccessMsg(msg);
        setShowSuccess(true);
        setTimeout(() => navigate(!isLicenseValid() ? '/license' : '/dashboard', { replace: true }), 1500);
        return;
      }
      setErrorMsg('Code 2FA invalide.');
      setShowError(true);
      setTwoFACode('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur 2FA.');
      setShowError(true);
    } finally { setLoading(false); }
  };

  if (isAuthenticated && !authLoading && !licenseLoading) return null;
  if (isPageLoading) return <SkeletonLogin />;
  if (authLoading || licenseLoading) {
    return <div className={`flex min-h-screen items-center justify-center ${isDark ? 'bg-[#0F172A]' : 'bg-white'}`}><Loader2 className="h-7 w-7 animate-spin text-brand-500" /><span className="ml-2 text-[13px] text-slate-500 dark:text-slate-400">Chargement...</span></div>;
  }

  if (show2FA) {
    return (
      <div className={`flex min-h-screen w-full items-center justify-center p-3 ${isDark ? 'bg-[#0F172A]' : 'bg-white'}`}>
        <div className="w-full max-w-[360px] overflow-hidden rounded-xl border p-5" style={{ background: surface, borderColor, boxShadow: shadow }}>
          <div className="mb-4 flex justify-center"><div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: primaryBg }}><KeyRound className="h-4 w-4 text-brand-500" /></div></div>
          <div className="mb-4 text-center"><h2 className="text-[16px] font-semibold" style={{ color: textColor }}>Vérification en deux étapes</h2><p className="mt-1 text-[13px]" style={{ color: mutedColor }}>Code de sécurité à 6 chiffres</p></div>
          <div className="mb-4 flex justify-center gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <input key={i} type="text" inputMode="numeric" maxLength={1} value={twoFACode[i] || ''} disabled={loading} autoFocus={i === 0}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  if (v.length > 1) return;
                  const chars = twoFACode.split(''); chars[i] = v; setTwoFACode(chars.join(''));
                  if (v && i < 5) document.querySelectorAll('[data-2fa]')[i + 1]?.focus();
                }}
                onKeyDown={(e) => { if (e.key === 'Backspace' && !twoFACode[i] && i > 0) document.querySelectorAll('[data-2fa]')[i - 1]?.focus(); }}
                data-2fa
                className="h-8 w-8 rounded-md border text-center text-[14px] font-semibold outline-none transition-all"
                style={{
                  background: surfaceAlt,
                  borderColor: twoFACode[i] ? '#4F46E5' : borderColor,
                  color: textColor,
                  boxShadow: twoFACode[i] ? '0 0 0 2px rgba(79,70,229,0.12)' : 'none'
                }}
              />
            ))}
          </div>
          <button type="button" disabled={loading || twoFACode.length !== 6} onClick={handleVerify2FA}
            className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-[13px] font-semibold text-white transition-all disabled:opacity-50 bg-brand-500 hover:bg-brand-600"
            style={{ boxShadow: `0 4px 12px ${primaryBg}` }}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <>Vérifier<ArrowRight className="h-3 w-3" /></>}
          </button>
          <button type="button" disabled={loading} onClick={() => { setShow2FA(false); setTwoFACode(''); setPendingUserId(null); }}
            className="mt-3 w-full text-center text-[13px] hover:underline" style={{ color: mutedColor }}>Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-3 bg-cover bg-center"
      style={{
        backgroundImage: backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0" style={{ background: bgOverlay }}></div>

      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm" style={{ background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)' }}>
          <div className="w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border p-6 text-center" style={{ background: surface, borderColor, boxShadow: shadow }}>
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: primaryBg }}><Loader2 className="h-5 w-5 animate-spin text-brand-500" /></div>
            <div className="text-[14px] font-semibold" style={{ color: textColor }}>Connexion en cours</div>
            <div className="mt-1 text-[13px]" style={{ color: mutedColor }}>Sécurisation de votre session...</div>
          </div>
        </div>
      )}

      <button type="button" onClick={toggleTheme}
        className="fixed right-4 top-4 z-40 flex h-7 w-7 items-center justify-center rounded-full border transition-all hover:scale-105"
        style={{ background: surface, borderColor, color: '#4F46E5', boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.4)' : '0 4px 15px rgba(79,70,229,0.1)' }}>
        {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </button>

      <div className="relative z-10 flex w-full max-w-[980px] overflow-hidden rounded-xl border" style={{ background: surface, borderColor, boxShadow: shadow }}>
        {/* ⭐ PANNEAU GAUCHE : Tsisy ovana (surface) */}
        <div className="hidden w-1/2 shrink-0 flex-col border-r p-5 lg:flex" style={{ background: surface, borderColor }}>
          <div className="flex flex-1 flex-col justify-between">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)', boxShadow: `0 2px 8px ${primaryBg}` }}>
                    <Cloud className="h-4 w-4 text-white" />
                  </div>
                  <div><h1 className="text-[15px] font-bold" style={{ color: textColor }}>TahiryPro ERP</h1><p className="text-[11px] font-medium" style={{ color: mutedColor }}>Enterprise Solution</p></div>
                </div>
                <div><h2 className="text-[19px] font-bold leading-tight" style={{ color: textColor }}>Gérez tout,<br />partout.</h2><p className="mt-1 text-[12px]" style={{ color: mutedColor }}>Solution complète pour votre entreprise</p></div>
              </div>

              <div className="relative overflow-hidden rounded-lg border mx-auto w-full max-w-[400px]" style={{ borderColor, background: surface, boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.4)' : '0 4px 15px rgba(79,70,229,0.1)' }}>
                <img
                  src={isDark ? MINIATURE_DARK_PATH : MINIATURE_LIGHT_PATH}
                  alt="Dashboard Preview"
                  className="w-full h-auto object-contain max-h-[300px]"
                />
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-semibold" style={{ color: textColor }}>Pourquoi choisir TahiryPro ?</p>
                {[
                  "Gestion complète : Produits, Ventes, Achats, Stock & RH.",
                  "Tableaux de bord en temps réel pour vos décisions.",
                  "Sécurité des données et accès multi-utilisateurs."
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: '#4F46E5' }} />
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
        </div>

        {/* ⭐ PANNEAU DROITE : Fond indigo en mode light */}
        <div className="flex w-full flex-col justify-between p-5 lg:w-1/2" style={{ background: rightBoxBg }}>
          <div className="mb-4 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)' }}>
              <Cloud className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[14px] font-bold" style={{ color: textColor }}>TahiryPro</span>
          </div>

          <img src={logoSrc} alt="TahiryPro" className="mx-auto mb-4 h-20 w-20 object-contain" />

          <div className="mb-5 text-center">
            <h1 className="text-[22px] font-bold" style={{ color: textColor }}>Bienvenue</h1>
            <p className="mt-1 text-[13px]" style={{ color: mutedColor }}>Connectez-vous à votre espace de travail</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <FormInput label="Adresse email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="votre@email.com" icon={Mail} error={errors.email} disabled={loading} autoComplete="email" />
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[13px] font-medium" style={{ color: mutedColor }}>Mot de passe</label>
                <button type="button" onClick={() => { setErrorMsg('Contactez le support pour réinitialiser.'); setShowError(true); }} className="text-[12px] font-medium text-brand-500 hover:underline">Oublié ?</button>
              </div>
              <FormInput label="" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="••••••••" icon={Lock} error={errors.password} disabled={loading} autoComplete="current-password" rightElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors" style={{ color: isDark ? '#94A3B8' : '#94A3B8' }}>
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              } />
            </div>

            <CustomCheckbox checked={formData.rememberMe} onChange={(c) => setFormData(prev => ({ ...prev, rememberMe: c }))} label="Rester connecté" />

            <button type="submit" disabled={loading}
              className="group relative flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[14px] font-semibold text-white transition-all hover:opacity-95 disabled:opacity-50 bg-brand-500 hover:bg-brand-600"
              style={{ boxShadow: `0 4px 12px ${primaryBg}` }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Se connecter<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </form>

          <div className="mt-4 text-center"><p className="text-[13px]" style={{ color: mutedColor }}>Pas encore de compte ? <Link to="/register" className="font-medium text-brand-500 hover:underline">S'inscrire</Link></p></div>
          <div className="mt-5 flex items-center justify-between border-t pt-3" style={{ borderColor }}>
            <span className="text-[12px]" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>© 2026 TahiryPro ERP</span>
            <div className="flex gap-3"><Link to="/terms" className="text-[12px] hover:underline" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Conditions</Link><Link to="/support" className="text-[12px] hover:underline" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Support</Link></div>
          </div>
        </div>
      </div>

      <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Connexion réussie" message={successMsg} buttonText="Continuer" autoCloseDelay={2000} />
      <ErrorModal isOpen={showError} onClose={() => setShowError(false)} title="Erreur" message={errorMsg} buttonText="OK" autoCloseDelay={4000} />
    </div>
  );
};

export default Login;