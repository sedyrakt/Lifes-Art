// src/components/parametres/ParametresGeneral.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProfileForm
// ⭐ FONT SIZE: h2 15px, subtitle 13px, labels 12px, inputs 14px

import React from 'react';

interface AppSettings {
  appName: string;
  companyName: string;
  language: string;
  currency: string;
  dateFormat: string;
  timeZone: string;
}

interface ParametresGeneralProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

interface FormCellProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  borderRight?: boolean;
  borderBottom?: boolean;
}

const FormCell: React.FC<FormCellProps> = ({ label, icon, children, borderRight = true, borderBottom = true }) => {
  return (
    <div className={`group relative flex flex-col px-3.5 py-3 bg-white dark:bg-[#0F172A] transition-colors duration-200 ${borderRight ? 'border-r border-slate-200 dark:border-white/[0.08]' : ''} ${borderBottom ? 'border-b border-slate-200 dark:border-white/[0.08]' : ''} hover:bg-slate-50 dark:hover:bg-white/[0.03]`}>
      <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="mb-1.5 flex items-center gap-1.5">
        {/* ⭐ Label : 11.5px → 12px */}
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] leading-[1.3] text-slate-500 dark:text-slate-400">{label}</span>
        {icon && <span className="text-brand-500 dark:text-brand-400">{icon}</span>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};

const ParametresGeneral: React.FC<ParametresGeneralProps> = ({ settings, onSettingsChange }) => {
  const handleChange = (key: keyof AppSettings, value: string) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // ⭐ Field : h-9 → h-10, text-[13.5px] → text-[14px]
  const fieldClass = `w-full h-10 rounded-lg border px-3 text-[14px] font-medium outline-none transition-all duration-150 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:bg-[#0F172A] dark:border-white/[0.12] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/[0.18] dark:focus:border-brand-500 dark:focus:ring-brand-500/10`;

  return (
    <section className="overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white shadow-sm dark:border-white/[0.12] dark:bg-[#0F172A]">
      <div className="flex items-center justify-between border-b border-slate-200 px-3.5 py-2.5 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            {/* ⭐ h2 : 13.5px → 15px */}
            <h2 className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">Paramètres généraux</h2>
            {/* ⭐ Subtitle : 11.5px → 13px */}
            <p className="mt-0.5 text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">Configurez les informations principales de votre application</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        <FormCell label="Nom de l'application" borderRight borderBottom>
          <input type="text" value={settings.appName} onChange={e => handleChange('appName', e.target.value)} className={fieldClass} placeholder="Nom de votre application" />
        </FormCell>
        <FormCell label="Entreprise" borderRight borderBottom>
          <input type="text" value={settings.companyName} onChange={e => handleChange('companyName', e.target.value)} className={fieldClass} placeholder="Nom de l'entreprise" />
        </FormCell>
        <FormCell label="Langue" borderRight={false} borderBottom>
          <select value={settings.language} onChange={e => handleChange('language', e.target.value)} className={fieldClass}>
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="mg">Malagasy</option>
          </select>
        </FormCell>
        <FormCell label="Devise" borderRight borderBottom={false}>
          <select value={settings.currency} onChange={e => handleChange('currency', e.target.value)} className={fieldClass}>
            <option value="Ar">Ariary (Ar)</option>
            <option value="€">Euro (€)</option>
            <option value="$">Dollar ($)</option>
          </select>
        </FormCell>
        <FormCell label="Format de date" borderRight borderBottom={false}>
          <select value={settings.dateFormat} onChange={e => handleChange('dateFormat', e.target.value)} className={fieldClass}>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </FormCell>
        <FormCell label="Fuseau horaire" borderRight={false} borderBottom={false}>
          <select value={settings.timeZone} onChange={e => handleChange('timeZone', e.target.value)} className={fieldClass}>
            <option value="Indian/Antananarivo">Antananarivo (GMT+3)</option>
            <option value="Europe/Paris">Paris (GMT+1)</option>
            <option value="America/New_York">New York (GMT-5)</option>
            <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
          </select>
        </FormCell>
      </div>
    </section>
  );
};

export default ParametresGeneral;