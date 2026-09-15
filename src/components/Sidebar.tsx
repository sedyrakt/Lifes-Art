// src/components/Sidebar.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur CommandesTable
// ⭐ NEW: Scroll par drag à la souris (pointer drag)
// ⭐ FIX: "Rapports" → "Analyses avancées"
// ⭐ FONT SIZE: nampitomboina (logo 18px, menu 15px, group 13px, system 15/13px)
// ⭐ VAOVAO: Logo image (logodark.png / logolight.png) aseho ao amin'ny header

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard, Package, Tags, Users2, Briefcase, DollarSign,
  ShoppingBag, Truck, Settings, LogOut, Sun, Moon, X,
  CreditCard, Activity, UserCircle,
  ChevronRight, ShoppingCart, Receipt, ArrowDownToLine,
  BarChart3
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

// ⭐ LOGO — Hita ao amin'ny public/images/
const LOGO_DARK = '/images/logodark.png';
const LOGO_LIGHT = '/images/logolight.png';

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
      { path: '/rapports', icon: BarChart3, label: 'Analyses avancées', roles: ['admin', 'manager'],
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
  const [logoError, setLogoError] = useState(false);   // ⭐ VAOVAO: Raha tsy hita ny logo
  const isLight = !isDark;
  const logoSrc = isDark ? LOGO_DARK : LOGO_LIGHT;

  // ⭐ Refs pour le drag scroll
  const navRef = useRef<HTMLElement | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const scrollTopRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const hasMovedRef = useRef(false);

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

  // ═══════════════════════════════════════════════════════════
  // ⭐ DRAG SCROLL HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, select, textarea')) return;

    const nav = navRef.current;
    if (!nav) return;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startYRef.current = e.clientY;
    scrollTopRef.current = nav.scrollTop;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current) return;
    const nav = navRef.current;
    if (!nav) return;

    const deltaY = e.clientY - startYRef.current;
    if (Math.abs(deltaY) > 5) hasMovedRef.current = true;

    nav.scrollTop = scrollTopRef.current - deltaY;
    e.preventDefault();
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    window.setTimeout(() => { hasMovedRef.current = false; }, 50);
  }, []);

  const handleClickCapture = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

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
            group relative flex items-center gap-2.5 rounded-lg transition-all duration-200 ease-out
            cursor-pointer select-none px-3 py-2
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
          draggable={false}
        >
          <span
            className={`flex items-center justify-center shrink-0 rounded-md transition-all duration-200 w-[32px] h-[32px]`}
            style={getIconStyle(item, active)}
          >
            <item.icon
              className={`shrink-0 transition-all duration-200 w-[17px] h-[17px]`}
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
              className="w-3.5 h-3.5 shrink-0 opacity-80"
              strokeWidth={2.2}
              style={{ color: c.activeBar }}
            />
          )}
        </Link>
      </li>
    );
  };

  const renderGroup = (group: MenuGroup) => (
    <div key={group.id} className={group.id === 'main' ? 'mt-0.5' : 'mt-4'}>
      <div
        className="px-3 mb-2 text-[13px] font-bold uppercase tracking-[0.12em]"
        style={{ color: c.groupLabel }}
      >
        {group.label}
      </div>
      <ul className="space-y-0.5">{group.items.map((item) => renderMenuItem(item))}</ul>
    </div>
  );

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen flex flex-col z-[9999] transition-all duration-300 ease-in-out border-r ${c.border}`}
        style={{
          width: '250px',
          background: c.bgGradient,
          boxShadow: isLight
            ? '4px 0 24px -4px rgba(79,70,229,0.3)'
            : '4px 0 32px -4px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* ⭐⭐⭐ HEADER — misy LOGO IMAGE ⭐⭐⭐ */}
        <div
          className={`relative flex items-center shrink-0 border-b px-3.5 py-3 ${c.headerBorder}`}
          style={{ background: c.headerBg }}
        >
          <div className="relative z-10 flex items-center gap-2.5 min-w-0">
            {/* ⭐ VAOVAO: Logo image */}
            {!logoError && (
              <img
                src={logoSrc}
                alt="Life's Art"
                className="shrink-0 w-[42px] h-[42px] object-contain rounded-lg"
                style={{
                  filter: isLight ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' : 'none',
                }}
                onError={() => setLogoError(true)}
                draggable={false}
              />
            )}

            <div className="min-w-0">
              <div
                className="text-[18px] font-bold tracking-tight leading-none"
                style={{ color: c.text }}
              >
                Life's Art
              </div>
              <div
                className="mt-1 text-[14px] font-medium tracking-wide"
                style={{ color: c.textMuted }}
              >
                Enterprise
              </div>
            </div>
          </div>
        </div>

        {/* ⭐ NAV avec drag scroll */}
        <nav
          ref={navRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClickCapture={handleClickCapture}
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 py-3 custom-scrollbar select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            touchAction: 'pan-y',
            userSelect: 'none',
          }}
        >
          <div className="grid grid-cols-1 gap-0.5">
            {filteredMenuGroups.map((group) => renderGroup(group))}
          </div>
        </nav>

        <div className={`flex-shrink-0 p-2.5 border-t ${isLight ? 'border-white/[0.12]' : 'border-white/[0.12]'}`}>
          <div className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 border ${isLight ? 'bg-white/[0.08] border-white/[0.12]' : 'bg-white/[0.05] border-white/[0.12]'}`}>
            <span className="relative flex items-center justify-center w-2 h-2 shrink-0">
              <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: isLight ? '#FFFFFF' : '#4F46E5' }} />
              <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: isLight ? '#FFFFFF' : '#4F46E5' }} />
            </span>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold leading-none" style={{ color: c.systemText }}>
                Système opérationnel
              </div>
              <div className="mt-1 text-[13px] leading-none" style={{ color: c.systemSubtext }}>
                Tous les systèmes fonctionnent
              </div>
            </div>
          </div>

          <div className={`mt-2 pt-2 border-t ${isLight ? 'border-white/[0.12]' : 'border-white/[0.1]'}`}>
            <button
              type="button"
              onClick={toggleTheme}
              className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[15px] font-medium transition-all duration-200 cursor-pointer ${isLight ? 'hover:bg-white/[0.08] text-white' : 'hover:bg-white/[0.06]'}`}
              style={{ color: c.itemText }}
            >
              {isDark ? (
                <Sun className="w-[16px] h-[16px] shrink-0" style={{ color: '#FFFFFF' }} />
              ) : (
                <Moon className="w-[16px] h-[16px] shrink-0" style={{ color: '#FFFFFF' }} />
              )}
              <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[15px] font-medium transition-all duration-200 cursor-pointer ${isLight ? 'hover:bg-white/[0.08] text-white' : 'hover:bg-white/[0.06]'}`}
              style={{ color: c.itemText }}
            >
              <LogOut className="w-[16px] h-[16px] shrink-0" style={{ color: isLight ? '#FFFFFF' : '#4F46E5' }} />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>

        <style>{`
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: ${isLight ? 'rgba(255,255,255,0.3)' : '#4F46E5'} transparent;
            scrollbar-gutter: stable;
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

      {showLogoutModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="relative w-full max-w-[370px] rounded-xl shadow-2xl overflow-hidden"
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
              className="absolute top-3.5 right-3.5 p-1 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.06] cursor-pointer z-10"
              style={{ color: c.modalMuted }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* ⭐ VAOVAO: Logo image ao amin'ny modal */}
            <div className="flex items-center justify-center pt-6 pb-3">
              {!logoError ? (
                <img
                  src={logoSrc}
                  alt="Life's Art"
                  className="w-16 h-16 object-contain"
                  onError={() => setLogoError(true)}
                  draggable={false}
                />
              ) : (
                <div
                  className="w-16 h-16 flex items-center justify-center rounded-full text-[20px] font-bold"
                  style={{ background: 'rgba(79,70,229,0.1)', color: '#4F46E5' }}
                >
                  LA
                </div>
              )}
            </div>

            <div
              className="px-6 py-3 flex items-center justify-center border-b"
              style={{ borderColor: c.modalBorder }}
            >
              <h2 className="text-[16px] font-bold" style={{ color: c.modalText }}>Déconnexion</h2>
            </div>

            <div className="px-6 py-6">
              <p className="text-[16px] font-medium leading-tight text-center" style={{ color: c.modalText }}>
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>
              <p className="text-[14.5px] mt-2 leading-[1.4] text-center" style={{ color: c.modalMuted }}>
                Vous devrez entrer vos identifiants pour vous reconnecter.
              </p>
            </div>

            <div
              className="flex gap-2.5 px-6 py-4 border-t"
              style={{
                borderColor: c.modalBorder,
                background: isDark ? '#0F172A' : '#F8FAFC',
              }}
            >
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border text-[15px] font-medium transition-colors"
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
                className="flex-1 px-4 py-2.5 rounded-lg text-[15px] font-medium text-white bg-brand-500 hover:bg-brand-600 transition-colors"
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