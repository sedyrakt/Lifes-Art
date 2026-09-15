// src/components/parametres/ParametresPasswordModal.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur CommandesTable
// ⭐ fontSize : header 12px, cells 13.5px, footer 12.5px

import React, { useMemo, useState } from 'react';
import { Lock, X, Eye, EyeOff, CheckCircle2, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

interface PasswordData { currentPassword: string; newPassword: string; confirmPassword: string; }
interface ParametresPasswordModalProps { isOpen: boolean; onClose: () => void; onSubmit: (e: React.FormEvent) => void; passwordData: PasswordData; onPasswordDataChange: (data: PasswordData) => void; passwordLoading: boolean; isDark?: boolean; }

const ParametresPasswordModal: React.FC<ParametresPasswordModalProps> = ({ isOpen, onClose, onSubmit, passwordData, onPasswordDataChange, passwordLoading }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChecks = useMemo(() => {
    const password = passwordData.newPassword;
    return { length: password.length >= 8, uppercase: /[A-Z]/.test(password), number: /\d/.test(password), match: password.length > 0 && password === passwordData.confirmPassword };
  }, [passwordData.newPassword, passwordData.confirmPassword]);

  const passwordScore = [passwordChecks.length, passwordChecks.uppercase, passwordChecks.number].filter(Boolean).length;
  const passwordsMatch = passwordData.confirmPassword.length > 0 && passwordData.newPassword === passwordData.confirmPassword;

  if (!isOpen) return null;

  const handleChange = (key: keyof PasswordData, value: string) => { onPasswordDataChange({ ...passwordData, [key]: value }); };

  const inputClass = `w-full h-10 rounded-lg border bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/[0.12] px-3 pr-10 text-[13.5px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-150 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.35)] dark:border-white/[0.12] dark:bg-[#0F172A]">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><Lock size={19} strokeWidth={2.2} /></div>
            <div>
              <h2 id="password-modal-title" className="text-[13.5px] font-semibold text-slate-900 dark:text-slate-100">Modifier le mot de passe</h2>
              <p className="mt-0.5 text-[11.5px] leading-[1.3] text-slate-500 dark:text-slate-400">Sécurisez votre compte</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={passwordLoading} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Fermer"><X size={18} strokeWidth={2.2} /></button>
        </div>
        <form onSubmit={onSubmit} className="px-3 py-3">
          <div className="space-y-4">
            <div>
              <label htmlFor="current-password" className="mb-1.5 block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">Mot de passe actuel<span className="ml-1 text-brand-500">*</span></label>
              <div className="relative">
                <input id="current-password" type={showCurrentPassword ? 'text' : 'password'} value={passwordData.currentPassword} onChange={e => handleChange('currentPassword', e.target.value)} className={inputClass} placeholder="Votre mot de passe actuel" autoComplete="current-password" required />
                <button type="button" onClick={() => setShowCurrentPassword(v => !v)} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-300" aria-label={showCurrentPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showCurrentPassword ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}</button>
              </div>
            </div>
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">Nouveau mot de passe<span className="ml-1 text-brand-500">*</span></label>
              <div className="relative">
                <input id="new-password" type={showNewPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={e => handleChange('newPassword', e.target.value)} className={inputClass} placeholder="Minimum 8 caractères" autoComplete="new-password" minLength={8} required />
                <button type="button" onClick={() => setShowNewPassword(v => !v)} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-300" aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showNewPassword ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}</button>
              </div>
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="mb-1.5 flex gap-1">{ [1,2,3].map(level => <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${passwordScore >= level ? passwordScore === 3 ? 'bg-emerald-500' : passwordScore === 2 ? 'bg-amber-500' : 'bg-brand-500' : 'bg-slate-200 dark:bg-white/[0.08]'}`} />) }</div>
                  <div className="flex items-center justify-between"><span className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400">{passwordScore === 3 ? 'Mot de passe sécurisé' : passwordScore === 2 ? 'Mot de passe moyen' : 'Mot de passe faible'}</span><span className="text-[12.5px] text-slate-400 dark:text-slate-500">{passwordData.newPassword.length}/8+</span></div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <div className="mb-2 flex items-center gap-2"><ShieldCheck size={14} strokeWidth={2.2} className="text-brand-500" /><span className="text-[12.5px] font-semibold text-slate-600 dark:text-slate-300">Exigences de sécurité</span></div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                <PasswordRequirement valid={passwordChecks.length} label="8 caractères minimum" />
                <PasswordRequirement valid={passwordChecks.uppercase} label="Une majuscule" />
                <PasswordRequirement valid={passwordChecks.number} label="Un chiffre" />
                <PasswordRequirement valid={passwordChecks.match} label="Mots de passe identiques" />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">Confirmer le mot de passe<span className="ml-1 text-brand-500">*</span></label>
              <div className="relative">
                <input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} className={`${inputClass} ${passwordsMatch ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/10' : passwordData.confirmPassword && !passwordsMatch ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}`} placeholder="Confirmez votre nouveau mot de passe" autoComplete="new-password" required />
                <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-300" aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showConfirmPassword ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}</button>
              </div>
              {passwordData.confirmPassword && !passwordsMatch && <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-red-500 dark:text-red-400"><AlertCircle size={12} strokeWidth={2.2} />Les mots de passe ne correspondent pas.</div>}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 pt-3 dark:border-white/[0.08]">
            <button type="button" onClick={onClose} disabled={passwordLoading} className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/[0.12] dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50">Annuler</button>
            <button type="submit" disabled={passwordLoading || !passwordChecks.length || !passwordsMatch} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
              {passwordLoading ? <><Loader2 size={15} className="animate-spin" strokeWidth={2.2} />Modification...</> : <><CheckCircle2 size={15} strokeWidth={2.2} />Modifier</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PasswordRequirementProps { valid: boolean; label: string; }
const PasswordRequirement: React.FC<PasswordRequirementProps> = ({ valid, label }) => (
  <div className="flex min-w-0 items-center gap-1.5">
    <CheckCircle2 size={12} strokeWidth={2.2} className={valid ? 'shrink-0 text-emerald-500' : 'shrink-0 text-slate-300 dark:text-white/[0.15]'} />
    <span className={`truncate text-[12.5px] font-medium ${valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>{label}</span>
  </div>
);

export default ParametresPasswordModal;