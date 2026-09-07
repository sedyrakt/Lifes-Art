// src/components/profile/ProfileHeader.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIX: MITOVY 100% AMIN'NY MOUVEMENTS HEADER

import React from 'react';
import { Edit, Save, XCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProfileHeaderProps { role: string; isEditing: boolean; saving: boolean; onEdit: () => void; onCancel: () => void; onSave: () => void; }

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ role, isEditing, saving, onEdit, onCancel, onSave }) => {
  const { isDark } = useTheme();

  return (
    <header className="mb-4 w-full">
      <div className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 md:flex-row md:items-center md:justify-between dark:bg-slate-800" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}>
        
        <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500" />

        <div className="relative z-10 flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 dark:text-slate-100">Mon profil</h1>
            <span className="inline-flex min-w-[26px] items-center justify-center rounded-md bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-brand-500 dark:text-white">{role}</span>
          </div>
          <p className="mt-0.5 text-[13px] font-medium leading-tight text-slate-500 dark:text-slate-400">Gérez vos informations personnelles</p>
        </div>

        <div className="relative z-10 flex w-full shrink-0 items-center gap-2 md:w-auto">
          {!isEditing ? 
            <button type="button" onClick={onEdit} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 active:scale-[0.98] dark:bg-brand-500 dark:hover:bg-brand-600 dark:focus:ring-offset-slate-800">
              <Edit size={16} /><span>Modifier</span>
            </button>
          : 
            <>
              <button type="button" onClick={onCancel} disabled={saving} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-medium text-slate-700 transition-all duration-150 hover:border-brand-500/30 hover:bg-brand-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', background: isDark ? 'slate-800' : '#FFFFFF' }}>
                <XCircle size={16} /><span>Annuler</span>
              </button>
              <button type="button" onClick={onSave} disabled={saving} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600 dark:focus:ring-offset-slate-800">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}<span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </>
          }
        </div>
      </div>

      {isEditing && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-brand-500/20 bg-brand-50 px-3 py-2 text-[14px] font-medium text-brand-600 dark:border-brand-500/10 dark:bg-brand-500/10 dark:text-brand-400">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Mode modification activé
        </div>
      )}
    </header>
  );
};

export default ProfileHeader;