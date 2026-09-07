import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Moon, Sun, User, Settings, Bell, ChevronDown } from 'lucide-react';

interface LayoutProps { children: React.ReactNode; }

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleLogout = () => { setIsDropdownOpen(false); logout(); navigate('/login'); };

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/': case '/dashboard': return 'Tableau de bord';
      case '/pos': return 'Caisse & Ventes';
      case '/stocks': return 'Gestion des stocks';
      case '/produits': return 'Produits';
      case '/categories': return 'Catégories';
      case '/fournisseurs': return 'Fournisseurs';
      case '/commandes': return 'Commandes';
      case '/clients': return 'Clients';
      case '/depenses': return 'Dépenses';
      case '/entrees': return 'Entrées de stock';
      case '/sorties': return 'Sorties de stock';
      case '/mouvements': return 'Mouvements de stock';
      case '/employes': return 'Gestion du personnel';
      case '/paiements': return 'Paiements';
      case '/rapports': return 'Rapports & analyses';
      case '/parametres': return 'Paramètres système';
      case '/profile': return 'Profil utilisateur';
      default: return "TahiryPro";
    }
  };

  const loadProfileImage = useCallback(async () => {
    if (!user?.id) { setIsLoadingImage(false); setProfileImage(null); setImageError(false); return; }
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
    } catch (error) { console.error('❌ Layout: Erreur chargement avatar:', error); setImageError(true); setProfileImage(null); }
    finally { setIsLoadingImage(false); }
  }, [user?.id]);
  useEffect(() => { loadProfileImage(); }, [loadProfileImage, user?.image]);

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || user.name || '';
    const lastName = user.lastName || '';
    if (firstName && lastName) return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    if (user.name) { const parts = user.name.split(' '); if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase(); return user.name.substring(0, 2).toUpperCase(); }
    return 'U';
  };

  const renderAvatarContent = (size: 'sm' | 'lg' = 'sm') => {
    const containerSize = size === 'lg' ? 'h-12 w-12' : 'h-9 w-9';
    const textSize = size === 'lg' ? 'text-lg' : 'text-[13px]';
    const initials = getUserInitials();
    if (isLoadingImage) return <div className={`${containerSize} flex shrink-0 items-center justify-center rounded-full border border-brand-500/20 bg-brand-500/10 dark:border-brand-500/20 dark:bg-brand-500/10`}><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500/30 border-t-transparent" /></div>;
    if (profileImage && !imageError) return <img key={profileImage} src={profileImage} alt="Avatar" className={`${containerSize} shrink-0 rounded-full object-cover border-2 border-brand-500/30 shadow-sm dark:border-brand-500/30`} onError={() => { setImageError(true); setProfileImage(null); }} />;
    return <div className={`${containerSize} flex shrink-0 items-center justify-center rounded-full border-2 border-brand-500/30 bg-brand-500 font-semibold ${textSize} text-white shadow-sm dark:border-brand-500/30 dark:bg-brand-500`}>{initials}</div>;
  };

  return (

    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#0F172A] dark:text-slate-100">
      <Sidebar user={user} onLogout={handleLogout} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className={`flex min-h-screen flex-col transition-all duration-300 ${isCollapsed ? 'ml-[72px] pl-3' : 'ml-[260px] pl-0'}`}>
        
        <header className="fixed top-0 right-0 z-40 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3 backdrop-blur-xl transition-colors dark:border-white/[0.08] dark:bg-[#0F172A]"
          style={{ left: isCollapsed ? '92px' : '260px' }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-1 rounded-full bg-brand-500 dark:bg-brand-500" />
              <h2 className="truncate text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">{getPageTitle(location.pathname)}</h2>
            </div>
            <p className="mt-0.5 hidden pl-3.5 text-[13px] font-medium text-slate-500 sm:block dark:text-slate-400">Plateforme de gestion intégrée</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={toggleTheme} title={isDark ? 'Mode clair' : 'Mode sombre'} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-brand-50 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button type="button" title="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-brand-50 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-500 ring-2 ring-white dark:ring-[#0F172A]" /></button>
            <div className="relative ml-1">
              <button type="button" onClick={() => setIsDropdownOpen(prev => !prev)} className="flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-1 transition-all hover:border-slate-200 hover:bg-brand-50 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.04]">
                {renderAvatarContent('sm')}
                <div className="hidden min-w-0 text-left sm:block">
                  <p className="max-w-[130px] truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">{user?.firstName || user?.name || 'Utilisateur'}</p>
                  <p className="max-w-[130px] truncate text-[13px] font-medium text-slate-500 dark:text-slate-400">{user?.role || 'Administrateur'}</p>
                </div>
                <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
            
                  <div className="absolute right-0 z-20 mt-2 w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)] animate-in fade-in zoom-in-95 duration-150 dark:border-white/[0.08] dark:bg-[#0F172A] dark:shadow-2xl">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/[0.06] dark:bg-white/[0.04]">
                      <div className="flex items-center gap-3">
                        {renderAvatarContent('lg')}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-slate-900 dark:text-white">{user?.firstName || user?.name || 'Utilisateur'} {user?.lastName || ''}</p>
                          <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-slate-400">{user?.email || 'contact@lifesart.mg'}</p>
                          <div className="mt-2 flex items-center gap-1.5"><span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-[13px] font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />{user?.role || 'Administrateur'}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <button type="button" onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"><User size={16} className="text-slate-400 dark:text-slate-500" /><span>Mon profil</span></button>
                      <button type="button" onClick={() => { setIsDropdownOpen(false); navigate('/parametres'); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"><Settings size={16} className="text-slate-400 dark:text-slate-500" /><span>Paramètres</span></button>
                      <div className="my-1.5 border-t border-slate-200 dark:border-white/[0.06]" />
                      <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-[13px] font-medium text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10"><LogOut size={16} /><span>Se déconnecter</span></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
     
        <main className="flex-1 overflow-y-auto bg-slate-50 transition-colors duration-300 pt-[85px] px-4 sm:px-4 lg:px-2 dark:bg-[#0F172A]" style={{ height: 'calc(100vh - 0px)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}