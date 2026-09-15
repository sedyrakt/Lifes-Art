// src/components/profile/ProfileHeader.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur DashboardHeader, ProduitsHeader, CategoriesHeader,
//   EntreesHeader, EmployesHeader, PaiementsHeader, MouvementsHeader, RapportsHeader, VentesHeader
// ⭐ FONT SIZE: h1 20px, subtitle 13px, buttons 14px

import React from 'react';
import { Edit, Save, XCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProfileHeaderProps { role: string; isEditing: boolean; saving: boolean; onEdit: () => void; onCancel: () => void; onSave: () => void; }

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ role, isEditing, saving, onEdit, onCancel, onSave }) => {
  const { isDark } = useTheme();

  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';

  return (
    <header className="mb-4 w-full">
      <div className={`group relative flex flex-col gap-3 overflow-hidden rounded-xl border-[0.5px] shadow-sm ${isDark ? 'bg-[#0F172A]' : 'bg-white'} ${borderColor} transition-all duration-200 md:flex-row md:items-center md:justify-between px-3 py-2.5`}>

        <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500" />

        <div className="relative z-10 flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            {/* ⭐ h1 : 18px → 20px */}
            <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 dark:text-slate-100">Mon profil</h1>
            {/* ⭐ Badge role : 11.5px → 12.5px, min-w 24 → 26 */}
            <span className="inline-flex min-w-[26px] items-center justify-center rounded-md border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-[12.5px] font-bold leading-tight text-brand-600 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-400">{role}</span>
          </div>
          {/* ⭐ Subtitle : 12.5px → 13px */}
          <p className="mt-0.5 text-[13px] font-medium leading-tight text-slate-500 dark:text-slate-400">Gérez vos informations personnelles</p>
        </div>

        <div className="relative z-10 flex w-full shrink-0 items-center gap-2 md:w-auto">
          {!isEditing ?
            <button
              type="button"
              onClick={onEdit}
              /* ⭐ Button : 13px → 14px, icon 15 → 16 */
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[14px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.98]"
            >
              <Edit size={16} /><span>Modifier</span>
            </button>
          :
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                /* ⭐ Button : 13px → 14px, icon 15 → 16 */
                className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-[14px] font-medium text-slate-700 transition-all duration-150 hover:border-brand-500/30 hover:bg-brand-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 ${borderColor} ${isDark ? 'bg-[#0F172A]' : 'bg-white'}`}
              >
                <XCircle size={16} /><span>Annuler</span>
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                /* ⭐ Button : 13px → 14px, icon 15 → 16 */
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[14px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}<span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </>
          }
        </div>
      </div>

      {isEditing && (
        /* ⭐ Info banner : 12.5px → 13.5px */
        <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-[13.5px] font-medium text-brand-600 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-400">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Mode modification activé
        </div>
      )}
    </header>
  );
};

export default ProfileHeader;