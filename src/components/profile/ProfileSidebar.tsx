// src/components/profile/ProfileSidebar.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: DARK MODE BG = #0F172A (card, sections, buttons)

import React from 'react';
import { KeyRound, LogOut } from 'lucide-react';

interface ProfileSidebarProps { role: string; memberSince: string; companyName: string; twoFAEnabled: boolean; onPasswordChange: () => void; onLogout: () => void; }

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ role, memberSince, companyName, twoFAEnabled, onPasswordChange, onLogout }) => {
  const infoCards = [
    { label: 'Rôle professionnel', value: role || 'Utilisateur' },
    { label: 'Membre depuis', value: memberSince || '—' },
    { label: 'Entreprise rattachée', value: companyName || "TahiryPro" },
  ];

  return (
    <aside className="relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-[0_1px_3px_rgba(79,70,229,0.05)] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(79,70,229,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:hover:shadow-none">
      <div className="h-[2px] w-full bg-brand-500" />
      <div className="p-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/[0.08]">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">Informations & sécurité</h3>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">Gestion de votre compte</p>
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          {infoCards.map(item => { 
            return (
              <div key={item.label} className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 transition-all duration-150 hover:border-brand-500/30 hover:bg-brand-50/50 dark:border-white/[0.12] dark:bg-white/[0.03] dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-400">{item.label}</p>
                  <p className="mt-0.5 truncate text-[14px] font-semibold text-slate-800 dark:text-slate-200" title={item.value}>{item.value}</p>
                </div>
              </div>
            ); 
          })}
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/[0.08]">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">Authentification 2FA</p>
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">Sécurité supplémentaire</p>
            </div>
            <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-semibold ${twoFAEnabled ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400'}`}>
              {twoFAEnabled ? 'Activée' : 'Désactivée'}
            </div>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/[0.08]">
          <button type="button" onClick={onPasswordChange} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[14px] font-medium text-slate-700 transition-all hover:border-brand-500/30 hover:bg-brand-50 hover:text-brand-600 dark:border-white/[0.12] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10 dark:hover:text-brand-400">
            <KeyRound size={15} />Changer le mot de passe
          </button>
        </div>
        <div className="mt-3">
          <button type="button" onClick={onLogout} className="flex w-full items-center justify-center gap-2 rounded-lg bg-danger-500 px-3 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-danger-600 hover:shadow-md dark:bg-danger-500 dark:hover:bg-danger-600">
            <LogOut size={15} />Déconnexion sécurisée
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ProfileSidebar;