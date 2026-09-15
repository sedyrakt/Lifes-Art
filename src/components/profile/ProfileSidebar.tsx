// src/components/profile/ProfileSidebar.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FONT SIZE: h3 15px, subtitle 13px, labels 12px, values 14px, buttons 14px
// ⭐ FIX: Card spacing nampitomboina (space-y + padding)

import React from 'react';
import { KeyRound, LogOut } from 'lucide-react';

interface ProfileSidebarProps {
  role: string;
  memberSince: string;
  companyName: string;
  twoFAEnabled: boolean;
  onPasswordChange: () => void;
  onLogout: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  role, memberSince, companyName, twoFAEnabled, onPasswordChange, onLogout,
}) => {
  const infoCards = [
    { label: 'Rôle professionnel', value: role || 'Utilisateur' },
    { label: 'Membre depuis', value: memberSince || '—' },
    { label: 'Entreprise rattachée', value: companyName || "TahiryPro" },
  ];

  return (
    <aside className="relative w-full overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white shadow-sm transition-colors dark:border-white/[0.12] dark:bg-[#0F172A]">
      <div className="h-[2px] w-full bg-brand-500" />

      <div className="p-4">
        {/* ═══ HEADER ═══ */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3 dark:border-white/[0.08]">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
              Informations & sécurité
            </h3>
            <p className="mt-1 text-[13px] leading-tight text-slate-500 dark:text-slate-400">
              Gestion de votre compte
            </p>
          </div>
        </div>

        {/* ⭐⭐⭐ INFO CARDS — space-y-3.5 + mb-4 ny card tsirairay ⭐⭐⭐ */}
        <div className="mt-4 space-y-3.5">
          {infoCards.map((item, index) => {
            return (
              <div
                key={item.label}
                className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3 transition-colors hover:border-brand-500/30 hover:bg-brand-50/50 dark:border-white/[0.12] dark:bg-white/[0.03] dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
                style={{ marginBottom: index < infoCards.length - 1 ? '14px' : '0' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide leading-tight text-slate-400 dark:text-slate-400">
                    {item.label}
                  </p>
                  <p
                    className="truncate text-[14px] font-semibold leading-tight text-slate-800 dark:text-slate-200"
                    title={item.value}
                  >
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ 2FA SECTION ═══ */}
        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/[0.08]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold leading-tight text-slate-800 dark:text-slate-200">
                Authentification 2FA
              </p>
              <p className="mt-1 text-[13px] leading-tight text-slate-500 dark:text-slate-400">
                Sécurité supplémentaire
              </p>
            </div>
            <div
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12.5px] font-semibold leading-tight ${
                twoFAEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-slate-400'
              }`}
            >
              {twoFAEnabled ? 'Activée' : 'Désactivée'}
            </div>
          </div>
        </div>

        {/* ═══ CHANGER MOT DE PASSE ═══ */}
        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onPasswordChange}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:border-brand-500/30 hover:bg-brand-50 hover:text-brand-600 dark:border-white/[0.12] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
          >
            <KeyRound size={15} strokeWidth={2.2} />
            Changer le mot de passe
          </button>
        </div>

        {/* ═══ DÉCONNEXION ═══ */}
        <div className="mt-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600"
          >
            <LogOut size={15} strokeWidth={2.2} />
            Déconnexion sécurisée
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ProfileSidebar;