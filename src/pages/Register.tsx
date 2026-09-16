// src/pages/Register.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Building, Check, Cloud, Eye, EyeOff, CheckCircle2,
  BarChart3, LayoutDashboard, Loader2, Lock, Mail,
  Moon, ShieldCheck, Sun, User, Users as UsersIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { validateEmail, validateNotEmpty, validatePassword } from '../utils/validators';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';

const LOGO_PATH = './images/logo.png';
const LOGO_DARK = './images/logodark.png';
const LOGO_LIGHT = './images/logolight.png';
const MINIATURE_DARK_PATH = './images/miniaturedark.jpeg';
const MINIATURE_LIGHT_PATH = './images/miniaturelight.jpeg';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  role: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  companyName?: string;
  terms?: string;
}

interface PasswordStrengthResult {
  score: number;
  label: string;
  color: string;
}

const THEME = {
  dark: {
    bg: '#0F172A',
    bgGradient: '#0F172A',
    surface: '#0F172A',
    surfaceAlt: '#1E293B',
    surfaceSoft: '#1E293B',
    border: 'rgba(255,255,255,0.12)',
    borderStrong: 'rgba(255,255,255,0.20)',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textSubMuted: '#64748B',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,0.12)',
    primaryBorder: 'rgba(79,70,229,0.2)',
    secondary: '#4338CA',
    secondaryBg: 'rgba(79,70,229,0.12)',
    success: '#10B981',
    error: '#f35a5a',
    inputBg: 'transparent',
    inputPlaceholder: '#64748B',
    shadow: '0 20px 50px -12px rgba(0,0,0,0.6)',
    shadowSmall: '0 4px 15px rgba(0,0,0,0.4)',
    glassBg: 'rgba(15,23,42,0.8)',
    glassBorder: 'rgba(79,70,229,0.2)'
  },
  light: {
    bg: '#FFFFFF',
    bgGradient: 'linear-gradient(160deg, #FFFFFF 0%, #EEF2FF 50%, #E0E7FF 100%)',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF2FF',
    surfaceSoft: '#F8FAFC',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    text: '#0F172A',
    textMuted: '#64748B',
    textSubMuted: '#94A3B8',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,0.06)',
    primaryBorder: 'rgba(79,70,229,0.2)',
    secondary: '#4338CA',
    secondaryBg: 'rgba(79,70,229,0.06)',
    success: '#10B981',
    error: '#FCA5A5', 
    inputBg: '#FFFFFF',
    inputPlaceholder: '#94A3B8',
    shadow: '0 20px 50px -12px rgba(79,70,229,0.25)',
    shadowSmall: '0 4px 15px rgba(79,70,229,0.1)',
    glassBg: 'rgba(255,255,255,0.8)',
    glassBorder: 'rgba(79,70,229,0.15)'
  }
} as const;

const getPasswordStrength = (password: string): PasswordStrengthResult => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels: Record<number, string> = { 0: '', 1: 'Très faible', 2: 'Faible', 3: 'Moyen', 4: 'Fort', 5: 'Excellent' };
  const colors: Record<number, string> = { 0: '', 1: '#FCA5A5', 2: '#F97316', 3: '#F59E0B', 4: '#10B981', 5: '#059669' };
  return { score, label: labels[score] || '', color: colors[score] || '' };
};

const PasswordStrengthBars: React.FC<{ password: string }> = ({ password }) => {
  const { isDark } = useTheme();
  const colors = isDark ? THEME.dark : THEME.light;
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  if (!password) return null;
  return (
    <div className="mt-0.5 flex items-center gap-2">
      <div className="flex min-w-0 flex-1 gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const active = index < strength.score;
          return <div key={index} className="h-0.5 flex-1 rounded-full transition-all duration-300" style={{ background: active ? strength.color : colors.border }} />;
        })}
      </div>
      {strength.label && <span className="shrink-0 text-[11px] font-semibold" style={{ color: strength.color }}>{strength.label}</span>}
    </div>
  );
};

const CustomCheckbox: React.FC<{
  checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean;
  label: string; hasError?: boolean;
}> = ({ checked, onChange, disabled = false, label, hasError = false }) => {
  const { isDark } = useTheme();
  const colors = isDark ? THEME.dark : THEME.light;
  return (
    <button type="button" disabled={disabled} role="checkbox" aria-checked={checked} onClick={() => { if (!disabled) onChange(!checked); }} className={`group flex w-full items-start gap-2.5 text-left outline-none ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-all duration-150" style={{ borderColor: hasError ? colors.error : checked ? colors.primary : colors.borderStrong, background: checked ? colors.primary : 'transparent' }}>
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
      <span className="text-[14px] font-medium leading-snug" style={{ color: colors.textMuted }}>{label}</span>
    </button>
  );
};

const FormInput: React.FC<{
  label: string; name: string; value: string; placeholder?: string; type?: string;
  icon: React.ElementType; error?: string; disabled?: boolean; autoComplete?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; rightElement?: React.ReactNode;
}> = ({ label, name, value, placeholder, type = 'text', icon: Icon, error, disabled, autoComplete, onChange, rightElement }) => {
  const { isDark } = useTheme();
  const colors = isDark ? THEME.dark : THEME.light;
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);
  const borderColor = hasError ? colors.error : focused ? colors.primary : colors.border;
  return (
    <div className="min-w-0">
      {label && <label htmlFor={name} className="mb-1 block text-[14px] font-medium" style={{ color: colors.textMuted }}>{label}</label>}
      <div className="relative">
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors" style={{ color: focused ? colors.primary : colors.textSubMuted }} />
        <input id={name} name={name} type={type} value={value} placeholder={placeholder} disabled={disabled} autoComplete={autoComplete} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} className="h-10 w-full rounded-md border pl-9 pr-3 text-[14px] font-medium outline-none transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60" style={{ background: isDark ? 'transparent' : colors.inputBg, color: colors.text, borderColor, boxShadow: focused && !hasError ? `0 0 0 2px ${colors.primaryBg}` : 'none' }} />
        {rightElement}
      </div>
    </div>
  );
};

export const Register: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const colors = isDark ? THEME.dark : THEME.light;
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);

  const logoSrc = isDark ? LOGO_DARK : LOGO_LIGHT;
  const backgroundImage = "url('./images/abstract3.jpeg')";

  const bgOverlay = isDark
    ? 'linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.55) 100%)'
    : 'linear-gradient(to right, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.35) 100%)';

  const rightBoxBg = isDark ? colors.surface : '#FFFFFF';

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', companyName: '', role: 'user'
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!validateNotEmpty(formData.firstName)) newErrors.firstName = 'Prénom requis';
    if (!validateNotEmpty(formData.lastName)) newErrors.lastName = 'Nom requis';
    if (!validateNotEmpty(formData.email)) newErrors.email = 'Email requis';
    else if (!validateEmail(formData.email)) newErrors.email = "Format d'email invalide";
    if (!validateNotEmpty(formData.companyName)) newErrors.companyName = 'Entreprise requise';
    const pwdCheck = validatePassword(formData.password);
    if (!pwdCheck.valid) newErrors.password = pwdCheck.message;
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (!termsAccepted) newErrors.terms = 'Veuillez accepter les conditions';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setErrorMsg("Veuillez remplir correctement les champs!");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const { success: existingSuccess, data: existingUser } = await window.api.users.getByEmail(cleanEmail);
      if (existingSuccess && existingUser) {
        setErrors({ email: 'Cet email est déjà utilisé.' });
        setErrorMsg("Cet email est déjà utilisé.");
        setLoading(false);
        return;
      }
      const result = await window.api.users.create({
        email: cleanEmail,
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim(),
        role: 'admin'
      });
      if (!result?.success) {
        setErrorMsg(result?.error || "Une erreur est survenue lors de l'inscription.");
        return;
      }
      localStorage.setItem('register_email', cleanEmail);
      localStorage.setItem('register_firstName', formData.firstName.trim());
      localStorage.setItem('register_companyName', formData.companyName.trim());
      setShowSuccess(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error?.message || 'Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => { setShowSuccess(false); navigate('/login', { replace: true }); };
  const handleErrorClose = () => { setErrorMsg(null); };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-3 bg-cover bg-center"
      style={{ backgroundImage, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0" style={{ background: bgOverlay }}></div>

      <button type="button" onClick={toggleTheme} className="fixed right-4 top-4 z-40 flex h-7 w-7 items-center justify-center rounded-full border transition-all" style={{ background: colors.surface, borderColor: colors.border, color: colors.primary, boxShadow: colors.shadowSmall }}>
        {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </button>

      {/* COMPACT PREMIUM */}
      <div className="relative z-10 flex w-full max-w-[1000px] overflow-hidden rounded-xl border" style={{ background: colors.surface, borderColor: colors.border, boxShadow: colors.shadow }}>
        
        {/* PANNEAU GAUCHE */}
        <div className="hidden w-1/2 shrink-0 flex-col border-r p-6 lg:flex" style={{ background: colors.surface, borderColor: colors.border }}>
          <div className="flex flex-1 flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, boxShadow: `0 2px 8px ${colors.primaryBg}` }}>
                    <Cloud className="h-4 w-4 text-white" />
                  </div>
                  <div><h1 className="text-[16px] font-bold" style={{ color: colors.text }}>Life's Art ERP</h1><p className="text-[12px] font-medium" style={{ color: colors.textMuted }}>Enterprise Solution</p></div>
                </div>
                <div><h2 className="text-[20px] font-bold leading-tight" style={{ color: colors.text }}>Gérez tout,<br />partout.</h2><p className="mt-0.5 text-[13px]" style={{ color: colors.textMuted }}>Solution complète pour votre entreprise</p></div>
              </div>
              
              <div className="relative overflow-hidden rounded-lg border mx-auto w-full max-w-[380px]" style={{ borderColor: colors.border, background: colors.surface, boxShadow: colors.shadowSmall }}>
                <img
                  src={isDark ? MINIATURE_DARK_PATH : MINIATURE_LIGHT_PATH}
                  alt="Dashboard Preview"
                  className="w-full h-auto object-contain max-h-[200px]"
                />
              </div>

              <div className="space-y-1.5">
                {[
                  "Gestion complète : Produits, Ventes, Achats & Stock.",
                  "Tableaux de bord en temps réel.",
                  "Sécurité & accès multi-utilisateurs.",
                  "Facturation multiple jusqu'à +10 000.",
                  "Sauvegarde & restauration des données."
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                    <span className="text-[14px] leading-snug" style={{ color: colors.textMuted }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-4">
              {[{ icon: ShieldCheck, title: 'Sécurisé' }, { icon: BarChart3, title: 'Analytics' }, { icon: UsersIcon, title: 'Équipe' }, { icon: LayoutDashboard, title: 'Dashboard' }].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5" style={{ borderColor: colors.border }}>
                  <item.icon size={12} style={{ color: colors.primary }} />
                  <span className="text-[13px] font-medium truncate" style={{ color: colors.text }}>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANNEAU DROITE : Fotsy (White) amin'ny mode light, #0F172A amin'ny dark */}
        <div className="flex w-full flex-col justify-between p-6 lg:w-1/2" style={{ background: rightBoxBg }}>
          <div className="mb-3 flex items-center gap-2 lg:hidden"><div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: colors.primary }}><Cloud className="h-3.5 w-3.5 text-white" /></div><span className="text-[15px] font-bold" style={{ color: colors.text }}>Life's Art</span></div>

          {/* ⭐ LOGO + TITRE — groupés (mitovy amin'ny Kajio reference) */}
          <div className="flex flex-col items-center gap-1.5 mt-5">
            {!logoError && (
              <img
                src={logoSrc}
                alt="Life's Art"
                className="h-[52px] w-auto object-contain"
                onError={() => setLogoError(true)}
                draggable={false}
              />
            )}

            <div className="text-center">
              <h1 className="text-[24px] font-bold" style={{ color: colors.text }}>Créer un compte</h1>
              <p className="mt-1 text-[14px]" style={{ color: colors.textMuted }}>Commencez votre essai gratuit</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <FormInput label="Prénom" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Prénom" icon={User} error={errors.firstName} />
              <FormInput label="Nom" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Nom" icon={User} error={errors.lastName} />
            </div>
            <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="votre@email.com" icon={Mail} error={errors.email} autoComplete="email" />
            <FormInput label="Entreprise" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="Nom de votre société" icon={Building} error={errors.companyName} />

            <div className="grid grid-cols-2 gap-2">
              <div className="min-w-0">
                <FormInput label="Mot de passe" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleInputChange} placeholder="Mot de passe" icon={Lock} error={errors.password} autoComplete="new-password" rightElement={<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1" style={{ color: colors.textSubMuted }}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
                <PasswordStrengthBars password={formData.password} />
              </div>
              <FormInput label="Confirmation" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleInputChange} placeholder="Répéter" icon={Lock} error={errors.confirmPassword} autoComplete="new-password" rightElement={<button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1" style={{ color: colors.textSubMuted }}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
            </div>

            <CustomCheckbox checked={termsAccepted} onChange={setTermsAccepted} label="J'accepte les conditions d'utilisation et la politique de confidentialité." hasError={Boolean(errors.terms)} />

            <button type="submit" disabled={loading} className="group relative flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[15px] font-semibold text-white transition-all hover:opacity-95 disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryHover})`, boxShadow: `0 4px 12px ${colors.primaryBg}` }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Créer mon compte<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </form>

          <div className="mt-3 text-center"><p className="text-[14px]" style={{ color: colors.textMuted }}>Déjà inscrit ? <Link to="/login" className="font-medium hover:underline" style={{ color: colors.primary }}>Se connecter</Link></p></div>
          <div className="mt-4 flex items-center justify-between border-t pt-2" style={{ borderColor: colors.border }}>
            <span className="text-[13px]" style={{ color: colors.textSubMuted }}>© 2026 Life's Art ERP</span>
            <div className="flex gap-3"><Link to="/terms" className="text-[13px] hover:underline" style={{ color: colors.textSubMuted }}>Conditions</Link><Link to="/support" className="text-[13px] hover:underline" style={{ color: colors.textSubMuted }}>Support</Link></div>
          </div>
        </div>
      </div>

      <SuccessModal isOpen={showSuccess} onClose={handleSuccessClose} title="Compte créé avec succès !" message="Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter." buttonText="Aller à la connexion" autoCloseDelay={2000} />
      <ErrorModal isOpen={!!errorMsg} onClose={handleErrorClose} title="Erreur" message={errorMsg || ''} buttonText="OK" autoCloseDelay={4000} />
    </div>
  );
};

export default Register;