
import React, { useState, useEffect, useCallback } from 'react'; 
import { User, Shield, Building, Mail, Loader2, CheckCircle2 } from 'lucide-react'; 
import { useTheme } from '../../contexts/ThemeContext';

interface User { id?: number; firstName?: string; lastName?: string; name?: string; email?: string; role?: string; companyName?: string; image?: string; }
interface ParametresProfileProps { user: User | null; }

const THEME = {
  light: {
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#64748B',
    subMuted: '#94A3B8',
    primary: '#4F46E5',
    primaryLight: '#EEF2FF',
    primaryHover: '#4338CA',
    avatarBg: '#4F46E5',
    avatarBorder: '#E2E8F0'
  },
  dark: {
    surface: '#0F172A', 
    surfaceAlt: '#1E293B',
    border: 'rgba(255,255,255,0.12)',
    text: '#F8FAFC',
    muted: '#94A3B8',
    subMuted: '#94A3B8',
    primary: '#4F46E5',
    primaryLight: 'rgba(79,70,229,0.12)',
    primaryHover: '#4338CA',
    avatarBg: '#4F46E5',
    avatarBorder: 'rgba(255,255,255,0.12)'
  }
};

interface InfoCellProps { label: string; value: React.ReactNode; icon: React.ReactNode; isDark: boolean; borderRight?: boolean; borderBottom?: boolean; }

const InfoCell: React.FC<InfoCellProps> = ({ label, value, icon, isDark, borderRight = true, borderBottom = true }) => {
  const theme = isDark ? THEME.dark : THEME.light;
  return (
    <div className={`group relative flex min-w-0 flex-col px-5 py-4 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/[0.03] ${borderRight ? 'border-r' : ''} ${borderBottom ? 'border-b' : ''}`} style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
      <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">{icon}</span>
        <span className="truncate text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-400">{label}</span>
      </div>
      <div className="min-w-0 truncate pl-8 text-[14px] font-medium text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  );
};

const ParametresProfile: React.FC<ParametresProfileProps> = ({ user }) => {
  const { isDark } = useTheme();
  const theme = isDark ? THEME.dark : THEME.light;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  const loadUserImage = useCallback(async () => {
    if (!user?.id) { setProfileImage(null); setImageError(false); return; }
    setIsLoadingImage(true); setImageError(false);
    try {
      const result = await window.api.users.getById(user.id);
      if (result?.success && result.data) {
        const userData = result.data;
        if (userData?.image && typeof userData.image === 'string' && userData.image.trim() !== '') {
          const urlResult = await window.api.images.getUrl(userData.image);
          if (urlResult?.success && urlResult.data) { setProfileImage(urlResult.data); setImageError(false); }
          else { setProfileImage(null); setImageError(false); }
        } else { setProfileImage(null); setImageError(false); }
      } else { setProfileImage(null); setImageError(false); }
    } catch (err) { console.error('❌ Erreur chargement avatar:', err); setImageError(true); setProfileImage(null); }
    finally { setIsLoadingImage(false); }
  }, [user]);

  useEffect(() => { loadUserImage(); }, [loadUserImage]);

  const getInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || user.name || '';
    const lastName = user.lastName || '';
    if (firstName && lastName) { return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase(); }
    if (firstName) { return firstName.substring(0, 2).toUpperCase(); }
    if (user.name) { const parts = user.name.trim().split(/\s+/); if (parts.length >= 2) { return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase(); } return user.name.substring(0, 2).toUpperCase(); }
    return 'U';
  };

  const renderAvatar = () => {
    const avatarClass = `flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-[18px] font-semibold text-white`;
    if (isLoadingImage) { return (<div className={avatarClass} style={{ backgroundColor: theme.avatarBg, borderColor: theme.avatarBorder }}><Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} /></div>); }
    if (profileImage && !imageError) { return (<img src={profileImage} alt="Avatar" className="h-14 w-14 shrink-0 rounded-full border-2 object-cover" style={{ borderColor: theme.avatarBorder }} onError={() => { setImageError(true); setProfileImage(null); }} />); }
    return (<div className={avatarClass} style={{ backgroundColor: theme.avatarBg, borderColor: theme.avatarBorder }}>{getInitials()}</div>);
  };

  const fullName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.name || 'Utilisateur';
  const role = user?.role || 'Administrateur';

  return (
    <div className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:bg-[#0F172A] dark:shadow-none" style={{ borderColor: theme.border }}>
      <div className="relative flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
        <div className="absolute left-0 top-0 h-full w-[3px] bg-brand-500" />
        {renderAvatar()}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">Profil utilisateur</h2>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-success-50 px-1.5 py-0.5 text-[13px] font-semibold text-success-600 dark:bg-success-500/10 dark:text-success-400">
              <CheckCircle2 size={11} strokeWidth={2.5} />Connecté
            </span>
          </div>
          <p className="mt-1 truncate text-[13px] text-slate-500 dark:text-slate-400">Informations du compte connecté</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ backgroundColor: theme.surface }}>
        <InfoCell label="Nom complet" value={fullName} icon={<User size={13} />} isDark={isDark} borderRight={true} borderBottom={true} />
        <InfoCell label="Rôle" value={role} icon={<Shield size={13} />} isDark={isDark} borderRight={true} borderBottom={true} />
        <InfoCell label="Entreprise" value={user?.companyName || "TahiryPro"} icon={<Building size={13} />} isDark={isDark} borderRight={false} borderBottom={true} />
        <div className="sm:col-span-3">
          <InfoCell label="Adresse email" value={user?.email || 'utilisateur@email.com'} icon={<Mail size={13} />} isDark={isDark} borderRight={false} borderBottom={false} />
        </div>
      </div>
    </div>
  );
};

export default ParametresProfile;