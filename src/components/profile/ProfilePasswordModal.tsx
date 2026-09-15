// src/components/profile/ProfilePasswordModal.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FONT SIZE: h2 16px, subtitle 13.5px, labels 13px, inputs 14px, buttons 14px

import React, { useEffect, useState } from 'react';
import { X, Eye, EyeOff, Lock, KeyRound, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';

interface PasswordData { currentPassword: string; newPassword: string; confirmPassword: string; }
interface ProfilePasswordModalProps { isOpen: boolean; onClose: () => void; onSubmit: (e: React.FormEvent) => void; passwordData: PasswordData; onPasswordDataChange: (data: PasswordData) => void; passwordLoading: boolean; isDark: boolean; }

const ProfilePasswordModal: React.FC<ProfilePasswordModalProps> = ({ isOpen, onClose, onSubmit, passwordData, onPasswordDataChange, passwordLoading }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) { setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmPassword(false); }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !passwordLoading) onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => { document.removeEventListener('keydown', handleEscape); };
  }, [isOpen, onClose, passwordLoading]);

  if (!isOpen) return null;

  const handleChange = (key: keyof PasswordData, value: string) => {
    onPasswordDataChange({ ...passwordData, [key]: value });
  };

  const passwordsMatch = passwordData.confirmPassword.length > 0 && passwordData.newPassword === passwordData.confirmPassword;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget && !passwordLoading) onClose(); }}>
      <div className="relative w-full max-w-[430px] overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-[0_20px_60px_rgba(79,70,229,0.15)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.45)]" onMouseDown={e => e.stopPropagation()}>


        <div className="h-[2px] w-full bg-brand-500" />

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-brand-50 text-brand-600 dark:border-white/[0.12] dark:bg-brand-500/10 dark:text-brand-400">
              {/* ⭐ Lock icon : h-4 w-4 → h-[17px] */}
              <Lock className="h-[17px] w-[17px]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              {/* ⭐ h2 : 14px → 16px */}
              <h2 className="text-[16px] font-semibold leading-tight text-slate-900 dark:text-slate-100">Changer le mot de passe</h2>
              {/* ⭐ Subtitle : 12px → 13.5px */}
              <p className="mt-0.5 text-[13.5px] leading-tight text-slate-500 dark:text-slate-400">Sécurisez votre compte</p>
            </div>
          </div>
          {/* ⭐ Close button : h-7 w-7 → h-8 w-8, icon 15 → 16 */}
          <button type="button" onClick={onClose} disabled={passwordLoading} aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-4 py-4">
          <div className="space-y-3.5">
            <PasswordField
              label="Mot de passe actuel"
              value={passwordData.currentPassword}
              onChange={v => handleChange('currentPassword', v)}
              visible={showCurrentPassword}
              onToggleVisibility={() => setShowCurrentPassword(p => !p)}
              icon={Lock}
              placeholder="••••••••"
              required
              disabled={passwordLoading}
            />
            <PasswordField
              label="Nouveau mot de passe"
              value={passwordData.newPassword}
              onChange={v => handleChange('newPassword', v)}
              visible={showNewPassword}
              onToggleVisibility={() => setShowNewPassword(p => !p)}
              icon={KeyRound}
              placeholder="8 caractères minimum"
              required
              minLength={8}
              disabled={passwordLoading}
            />
            {/* ⭐ Hint : 12px → 13px, icon 3.5 → 4 */}
            <div className="-mt-2 flex items-center gap-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-brand-500" />
              Minimum 8 caractères
            </div>
            <PasswordField
              label="Confirmer le nouveau mot de passe"
              value={passwordData.confirmPassword}
              onChange={v => handleChange('confirmPassword', v)}
              visible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword(p => !p)}
              icon={Lock}
              placeholder="••••••••"
              required
              disabled={passwordLoading}
            />
            {passwordData.confirmPassword.length > 0 &&
              /* ⭐ Match text : 12px → 13px */
              <div className={`-mt-2 flex items-center gap-1.5 text-[13px] font-medium ${passwordsMatch ? 'text-success-600 dark:text-success-400' : 'text-danger-500 dark:text-danger-400'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${passwordsMatch ? 'bg-success-500' : 'bg-danger-500'}`} />
                {passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
              </div>
            }
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-3.5 dark:border-white/[0.08]">
            {/* ⭐ Annuler button : 13px → 14px */}
            <button type="button" onClick={onClose} disabled={passwordLoading} className="h-9 rounded-lg border border-slate-200 bg-white px-3.5 text-[14px] font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.12] dark:bg-transparent dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200">
              Annuler
            </button>
            {/* ⭐ Modifier button : 13px → 14px, icon 4 → 4.5 */}
            <button type="submit" disabled={passwordLoading} className="flex h-9 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600">
              {passwordLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Modification...</> : <><CheckCircle className="h-4 w-4" />Modifier</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  icon: React.ElementType;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
}

const PasswordField: React.FC<PasswordFieldProps> = ({ label, value, onChange, visible, onToggleVisibility, icon: Icon, placeholder, required, minLength, disabled }) => {
  return (
    <div>
      {/* ⭐ Label : 12.5px → 13px */}
      <label className="mb-1 block text-[13px] font-medium leading-tight text-slate-600 dark:text-slate-300">
        {label} {required && <span className="text-brand-500">*</span>}
      </label>
      <div className="relative">
        {/* ⭐ Icon : h-15 w-15 → h-4 w-4, left-3 (aligned) */}
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" strokeWidth={1.8} />
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          disabled={disabled}
          /* ⭐ Input : h-9 → h-10, pl-9 → pl-10, text-[13px] → text-[14px] */
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-[14px] font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/[0.18] dark:focus:border-brand-500 dark:focus:ring-brand-500/10 dark:disabled:bg-white/[0.03]"
        />
        <button type="button" onClick={onToggleVisibility} disabled={disabled} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-slate-200">
          {/* ⭐ Eye icons : h-3.5 → h-4 */}
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default ProfilePasswordModal;