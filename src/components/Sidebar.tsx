import React, { useCallback, useMemo, useState } from 'react';
import {
  LayoutDashboard, Package, Tags, Users2, Briefcase, DollarSign,
  ShoppingBag, Truck, FileText, Settings, LogOut, Sun, Moon, X,
  CreditCard, Activity, UserCircle,
  ChevronRight, ShoppingCart, Receipt, ArrowDownToLine
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const LOGO_DARK = './images/logodark.png';
const LOGO_LIGHT = './images/logolight.png';

interface SidebarProps {
  user: any;
  onLogout: () => void;
}

interface MenuItem {
  path: string;
  icon: React.ElementType;
  label: string;
  roles?: ('admin' | 'manager' | 'user')[];
  iconColor?: string;
  iconBg?: string;
  iconBgDark?: string;
  iconColorDark?: string;
}

interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    id: 'main',
    label: 'Principal',
    items: [{
      path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord',
      iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8'
    }]
  },
  {
    id: 'inventory',
    label: 'Inventaire',
    items: [
      { path: '/produits', icon: Package, label: 'Produits',
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' },
      { path: '/categories', icon: Tags, label: 'Catégories',
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' },
      { path: '/fournisseurs', icon: Truck, label: 'Fournisseurs',
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' }
    ]
  },
  {
    id: 'sales',
    label: 'Ventes & Achats',
    items: [
      { path: '/clients', icon: Users2, label: 'Clients',
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' },
      { path: '/commandes', icon: ShoppingBag, label: 'Commandes',
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' },
      { path: '/depenses', icon: DollarSign, label: 'Dépenses',
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' },
      { path: '/ventes', icon: Receipt, label: 'Ventes (Devis/Factures)',
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' },
      { path: '/achats', icon: ShoppingCart, label: 'Achats',
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' }
    ]
  },
  {
    id: 'stock',
    label: 'Stock',
    items: [
      { path: '/mouvements', icon: Activity, label: 'Mouvements',
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' },
      { path: '/entrees', icon: ArrowDownToLine, label: 'Entrées de stock',
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' }
    ]
  },
  {
    id: 'hr',
    label: 'RH',
    items: [
      { path: '/employes', icon: Briefcase, label: 'Employés',
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' },
      { path: '/paiements', icon: CreditCard, label: 'Paiements', roles: ['admin', 'manager'],
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' }
    ]
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { path: '/rapports', icon: FileText, label: 'Rapports', roles: ['admin', 'manager'],
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' },
      { path: '/profile', icon: UserCircle, label: 'Mon profil', roles: ['admin', 'manager', 'user'],
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' },
      { path: '/parametres', icon: Settings, label: 'Paramètres', roles: ['admin'],
        iconColor: '#FFFFFF', iconBg: 'rgba(255,255,255,0.15)', iconBgDark: 'rgba(79,70,229,0.12)', iconColorDark: '#818CF8' }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isLight = !isDark;
  const logoSrc = isDark ? LOGO_DARK : LOGO_LIGHT;

  const userRoleLevel = useMemo(() => {
    const role = user?.role?.toLowerCase() || 'user';
    if (role === 'admin' || role === 'administrateur') return 'admin';
    if (role === 'manager' || role === 'gestionnaire') return 'manager';
    return 'user';
  }, [user]);

  const hasAccess = useCallback((roles?: ('admin' | 'manager' | 'user')[]) => {
    if (!roles) return true;
    if (userRoleLevel === 'admin') return true;
    return roles.includes(userRoleLevel as 'admin' | 'manager' | 'user');
  }, [userRoleLevel]);

  const filteredMenuGroups = useMemo(
    () =>
      menuGroups
        .map((group) => ({ ...group, items: group.items.filter((item) => hasAccess(item.roles)) }))
        .filter((group) => group.items.length > 0),
    [hasAccess]
  );

  const isActive = useCallback(
    (path: string) =>
      location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(`${path}/`)),
    [location.pathname]
  );

  // ⭐ INDIGO LIGHT (#4F46E5) + SLATE DARK (#0F172A)
  const colors = {
    light: {
      bg: '#4F46E5',
      bgGradient: 'linear-gradient(180deg, #4F46E5 0%, #4338CA 100%)',
      border: 'border-white/[0.12]',
      headerBg: 'linear-gradient(90deg, #4F46E5 0%, #4338CA 100%)',
      headerBorder: 'border-white/[0.12]',
      text: '#FFFFFF',
      textMuted: '#EEF2FF',
      itemActive: 'bg-white/[0.15]',
      itemHover: 'hover:bg-white/[0.08]',
      itemText: '#EEF2FF',
      itemTextHover: '#FFFFFF',
      activeBar: 'text-white',
      groupLabel: '#E0E7FF',
      systemBg: 'bg-white/[0.08]',
      systemBorder: 'border-white/[0.12]',
      systemText: '#FFFFFF',
      systemSubtext: '#EEF2FF',
      modalBg: '#FFFFFF',
      modalText: '#0F172A',
      modalMuted: '#64748B',
      modalBorder: '#E2E8F0',
      modalButtonBorder: '#CBD5E1',
    },
    dark: {
      bg: '#0F172A',
      bgGradient: '#0F172A',
      border: 'border-white/[0.12]',
      headerBg: '#0F172A',
      headerBorder: 'border-white/[0.12]',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      itemActive: 'bg-white/[0.08]',
      itemHover: 'hover:bg-white/[0.06]',
      itemText: '#F8FAFC',
      itemTextHover: '#FFFFFF',
      activeBar: 'text-brand-500',
      groupLabel: '#94A3B8',
      systemBg: 'bg-white/[0.08]',
      systemBorder: 'border-white/[0.12]',
      systemText: '#F8FAFC',
      systemSubtext: '#94A3B8',
      modalBg: '#0F172A',
      modalText: '#F8FAFC',
      modalMuted: '#94A3B8',
      modalBorder: 'rgba(255,255,255,0.15)',
      modalButtonBorder: 'rgba(255,255,255,0.2)',
    }
  };

  const c = isLight ? colors.light : colors.dark;

  const getIconStyle = (item: MenuItem, active: boolean): React.CSSProperties => {
    if (active) {
      return { background: 'rgba(255,255,255,0.25)', color: '#FFFFFF' };
    }
    return {
      background: isDark ? (item.iconBgDark || 'rgba(79,70,229,0.1)') : (item.iconBg || 'rgba(255,255,255,0.15)'),
      color: isDark ? (item.iconColorDark || '#818CF8') : (item.iconColor || '#FFFFFF'),
    };
  };

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.path);
    return (
      <li key={item.path} className="relative">
        <Link
          to={item.path}
          className={`
            group relative flex items-center gap-3 rounded-xl transition-all duration-200 ease-out
            cursor-pointer select-none px-3.5 py-2.5
            ${active ? 'shadow-sm' : c.itemHover}
          `}
          style={{
            background: active
              ? isLight
                ? 'rgba(255,255,255,0.15)'
                : 'linear-gradient(90deg, #4F46E515 0%, #4F46E515 100%)'
              : 'transparent',
            color: active ? '#FFFFFF' : c.itemText,
            border: active
              ? `1px solid ${isLight ? 'rgba(255,255,255,0.2)' : '#4F46E520'}`
              : '1px solid transparent',
          }}
        >
          <span
            className={`flex items-center justify-center shrink-0 rounded-lg transition-all duration-200 w-[32px] h-[32px]`}
            style={getIconStyle(item, active)}
          >
            <item.icon
              className={`shrink-0 transition-all duration-200 w-[18px] h-[18px]`}
              strokeWidth={active ? 2.3 : 1.85}
            />
          </span>

          <span
            className={`flex-1 truncate text-[15px] leading-none tracking-tight transition-all ${
              active ? 'font-semibold' : 'font-medium'
            }`}
          >
            {item.label}
          </span>
          {active && (
            <ChevronRight
              className="w-4 h-4 shrink-0 opacity-80"
              strokeWidth={2.2}
              style={{ color: c.activeBar }}
            />
          )}
        </Link>
      </li>
    );
  };

  const renderGroup = (group: MenuGroup) => (
    <div key={group.id} className={group.id === 'main' ? 'mt-1' : 'mt-5'}>
      <div
        className="px-3.5 mb-2.5 text-[12px] font-bold uppercase tracking-[0.14em]"
        style={{ color: c.groupLabel }}
      >
        {group.label}
      </div>
      <ul className="space-y-1">{group.items.map((item) => renderMenuItem(item))}</ul>
    </div>
  );

  return (
    <>
      {/* ⭐ Sidebar: z-[9999] (ambany noho ny header izay z-[99999]) */}
      <aside
        className={`fixed left-0 top-0 h-screen flex flex-col z-[9999] transition-all duration-300 ease-in-out border-r ${c.border}`}
        style={{
          width: '268px',
          background: c.bgGradient,
          boxShadow: isLight
            ? '4px 0 24px -4px rgba(79,70,229,0.3)'
            : '4px 0 32px -4px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          className={`relative flex items-center shrink-0 border-b px-4 pt-4 pb-3.5 ${c.headerBorder}`}
          style={{ background: c.headerBg }}
        >
          <div className="relative z-10 flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border border-white/30 shrink-0 overflow-hidden shadow-sm"
              style={{
                background: isLight ? 'rgba(255,255,255,0.15)' : 'rgba(16, 16, 16, 0.08)',
              }}
            >
              <img src={logoSrc} alt="Life's Art" className="w-10 h-10 object-contain" />
            </div>
            <div className="min-w-0">
              <div
                className="text-[16.5px] font-bold tracking-tight leading-none"
                style={{ color: c.text }}
              >
                Life's Art
              </div>
              <div
                className="mt-1 text-[12.5px] font-medium tracking-wide"
                style={{ color: c.textMuted }}
              >
                Enterprise
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4 custom-scrollbar">
          <div className="grid grid-cols-1 gap-0.5">
            {filteredMenuGroups.map((group) => renderGroup(group))}
          </div>
        </nav>

        <div className={`flex-shrink-0 p-3 border-t ${isLight ? 'border-white/[0.12]' : 'border-white/[0.12]'}`}>
          <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${isLight ? 'bg-white/[0.08] border-white/[0.12]' : 'bg-white/[0.05] border-white/[0.12]'}`}>
            <span className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0">
              <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: isLight ? '#FFFFFF' : '#4F46E5' }} />
              <span className="relative w-2 h-2 rounded-full" style={{ background: isLight ? '#FFFFFF' : '#4F46E5' }} />
            </span>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold leading-none" style={{ color: c.systemText }}>
                Système opérationnel
              </div>
              <div className="mt-1 text-[12px] leading-none" style={{ color: c.systemSubtext }}>
                Tous les systèmes fonctionnent
              </div>
            </div>
          </div>

          <div className={`mt-2.5 pt-2.5 border-t ${isLight ? 'border-white/[0.12]' : 'border-white/[0.1]'}`}>
            <button
              type="button"
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition-all duration-200 cursor-pointer ${isLight ? 'hover:bg-white/[0.08] text-white' : 'hover:bg-white/[0.06]'}`}
              style={{ color: c.itemText }}
            >
              {isDark ? (
                <Sun className="w-[17px] h-[17px] shrink-0" style={{ color: '#FFFFFF' }} />
              ) : (
                <Moon className="w-[17px] h-[17px] shrink-0" style={{ color: '#FFFFFF' }} />
              )}
              <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition-all duration-200 cursor-pointer ${isLight ? 'hover:bg-white/[0.08] text-white' : 'hover:bg-white/[0.06]'}`}
              style={{ color: c.itemText }}
            >
              <LogOut className="w-[17px] h-[17px] shrink-0" style={{ color: isLight ? '#FFFFFF' : '#4F46E5' }} />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>

        <style>{`
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: ${isLight ? 'rgba(255,255,255,0.3)' : '#4F46E5'} transparent;
            scrollbar-gutter: stable;
            scroll-behavior: smooth;
          }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; margin: 8px 0; }
          .custom-scrollbar::-webkit-scrollbar-corner { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            min-height: 48px;
            border-radius: 999px;
            border: 2px solid transparent;
            background: ${isLight ? 'rgba(255,255,255,0.3)' : '#4F46E5'};
            background-clip: padding-box;
            transition: background 0.2s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${isLight ? 'rgba(255,255,255,0.5)' : '#4338CA'};
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:active {
            background: ${isLight ? 'rgba(255,255,255,0.6)' : '#3730A3'};
          }
        `}</style>
      </aside>

      {/* ⭐ Logout modal: z-[99999] - avo indrindra */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="relative max-w-sm w-full rounded-xl shadow-2xl overflow-hidden"
            style={{
              background: c.modalBg,
              borderColor: c.modalBorder,
              boxShadow: isDark
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
                : '0 25px 50px -12px rgba(79, 70, 229, 0.25)',
            }}
          >
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.06] cursor-pointer z-10"
              style={{ color: c.modalMuted }}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center pt-6 pb-2">
              <img src={logoSrc} alt="Life's Art" className="w-20 h-auto object-contain" />
            </div>

            <div
              className="px-5 py-4 flex items-center justify-center border-b"
              style={{ borderColor: c.modalBorder }}
            >
              <h2 className="text-[15.5px] font-bold" style={{ color: c.modalText }}>Déconnexion</h2>
            </div>

            <div className="p-5">
              <p className="text-[15.5px] font-medium leading-tight text-center" style={{ color: c.modalText }}>
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>
              <p className="text-[13.5px] mt-1.5 leading-relaxed text-center" style={{ color: c.modalMuted }}>
                Vous devrez entrer vos identifiants pour vous reconnecter.
              </p>
            </div>

            <div
              className="flex gap-2.5 px-5 py-3 border-t"
              style={{
                borderColor: c.modalBorder,
                background: isDark ? '#0F172A' : '#F8FAFC',
              }}
            >
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border text-[14.5px] font-medium transition-colors"
                style={{
                  borderColor: c.modalButtonBorder,
                  color: c.modalMuted,
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="flex-1 px-4 py-2 rounded-lg text-[14.5px] font-medium text-white bg-brand-500 hover:bg-brand-600 transition-colors"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;