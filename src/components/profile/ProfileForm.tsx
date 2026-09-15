// src/components/profile/ProfileForm.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProfileSidebar / ProfileHeader
// ⭐ FONT SIZE: h2 15px, subtitle 13px, labels 13px, inputs 14px

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
}

interface ProfileFormProps {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  errors: Record<string, string>;
  isEditing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ formData, onChange, onBlur, errors, isEditing, onSubmit }) => {
  const fields = [
    { name: 'firstName', label: 'Prénom', placeholder: 'Votre prénom', required: true, colSpan: 1, autoComplete: 'given-name', type: 'text' },
    { name: 'lastName', label: 'Nom', placeholder: 'Votre nom', required: true, colSpan: 1, autoComplete: 'family-name', type: 'text' },
    { name: 'email', label: 'Adresse email', placeholder: 'email@entreprise.com', required: true, colSpan: 2, autoComplete: 'email', type: 'email' },
    { name: 'phone', label: 'Téléphone', placeholder: '+261 32 123 4567', required: false, colSpan: 1, autoComplete: 'tel', type: 'tel' },
    { name: 'companyName', label: 'Entreprise', placeholder: "Nom de l'entreprise", required: true, colSpan: 1, autoComplete: 'organization', type: 'text' },
  ];

  return (
    <section className="overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white shadow-sm transition-colors dark:border-white/[0.12] dark:bg-[#0F172A]">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3.5 py-2.5 dark:border-white/[0.08] dark:bg-[#0F172A]">
        <div className="min-w-0 flex-1">
          {/* ⭐ h2 : 13.5px → 15px */}
          <h2 className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">Informations personnelles</h2>
          {/* ⭐ Subtitle : 11.5px → 13px */}
          <p className="mt-0.5 text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">Gérez vos informations de profil</p>
        </div>
        {isEditing && (
          /* ⭐ Badge Modification : 11.5px → 12.5px */
          <span className="shrink-0 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[12.5px] font-semibold leading-tight text-brand-600 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-400">
            Modification
          </span>
        )}
      </div>

      <form onSubmit={onSubmit} className="p-4">
        <div className="grid grid-cols-1 gap-x-3 gap-y-3 md:grid-cols-2">
          {fields.map(field => {
            const error = errors[field.name];
            const value = formData[field.name as keyof FormData] || '';
            const isDisabled = !isEditing;

            return (
              <div key={field.name} className={field.colSpan === 2 ? 'md:col-span-2' : ''}>
                {/* ⭐ Label : 12.5px → 13px */}
                <label htmlFor={`profile-${field.name}`} className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium leading-tight text-slate-600 dark:text-slate-300">
                  <span>{field.label}</span>
                  {field.required && <span className="text-brand-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    id={`profile-${field.name}`}
                    type={field.type}
                    name={field.name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={isDisabled}
                    autoComplete={field.autoComplete}
                    placeholder={field.placeholder}
                    required={field.required}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `profile-${field.name}-error` : undefined}
                    /* ⭐ Input : h-9 → h-10, text-[13.5px] → text-[14px] */
                    className={`
                      h-10 w-full rounded-lg border bg-white px-3 text-[14px] font-medium text-slate-900 outline-none
                      transition-all duration-150 placeholder:text-slate-400
                      border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10
                      disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:hover:border-slate-200
                      dark:bg-[#0F172A] dark:border-white/[0.12] dark:text-slate-100 dark:placeholder:text-slate-500
                      dark:hover:border-white/[0.18] dark:focus:border-brand-500 dark:focus:ring-brand-500/10
                      dark:disabled:bg-white/[0.03] dark:disabled:text-slate-400 dark:disabled:hover:border-white/[0.12]
                      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10 dark:border-red-500/60' : ''}
                    `}
                  />
                </div>
                {error && (
                  /* ⭐ Error : 11.5px → 12.5px, icon 11 → 12 */
                  <div id={`profile-${field.name}-error`} className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-medium leading-tight text-red-500 dark:text-red-400">
                    <AlertCircle size={12} strokeWidth={2.2} />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </form>
    </section>
  );
};

export default ProfileForm;