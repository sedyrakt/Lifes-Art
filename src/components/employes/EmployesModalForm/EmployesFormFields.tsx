
import React from 'react';

interface EmployesFormFieldsProps {
  editingEmploye: any | null;
  isDark: boolean;
}

interface FormCellProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  fullWidth?: boolean;
  isDark?: boolean;
}

const FormCell: React.FC<FormCellProps> = ({ label, children, required = false, fullWidth = false, isDark = false }) => {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${fullWidth ? 'sm:col-span-2' : ''}`}>
      <label className="flex items-center gap-1.5">
        <span className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
          {label}
          {required && <span className="ml-1 text-danger-500">*</span>}
        </span>
      </label>
      {children}
    </div>
  );
};

const EmployesFormFields: React.FC<EmployesFormFieldsProps> = ({ editingEmploye, isDark }) => {
  const inputClass = 'w-full h-10 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-slate-800 px-3 text-[14.5px] font-medium text-slate-900 dark:text-slate-100 outline-none transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
      <FormCell label="Prénom" required isDark={isDark}>
        <input
          type="text"
          name="prenom"
          defaultValue={editingEmploye?.prenom || ''}
          required
          autoComplete="given-name"
          placeholder="Prénom"
          className={inputClass}
        />
      </FormCell>
      <FormCell label="Nom" required isDark={isDark}>
        <input
          type="text"
          name="nom"
          defaultValue={editingEmploye?.nom || ''}
          required
          autoComplete="family-name"
          placeholder="Nom"
          className={inputClass}
        />
      </FormCell>
      <FormCell label="Email" required isDark={isDark}>
        <input
          type="email"
          name="email"
          defaultValue={editingEmploye?.email || ''}
          required
          autoComplete="email"
          placeholder="email@entreprise.com"
          className={inputClass}
        />
      </FormCell>
      <FormCell label="Téléphone" isDark={isDark}>
        <input
          type="tel"
          name="telephone"
          defaultValue={editingEmploye?.telephone || ''}
          autoComplete="tel"
          placeholder="+261 32 123 4567"
          className={inputClass}
        />
      </FormCell>
      <FormCell label="Poste" required isDark={isDark}>
        <input
          type="text"
          name="poste"
          defaultValue={editingEmploye?.poste || ''}
          required
          placeholder="Ex : Responsable commercial"
          className={inputClass}
        />
      </FormCell>
      <FormCell label="Département" isDark={isDark}>
        <input
          type="text"
          name="departement"
          defaultValue={editingEmploye?.departement || ''}
          placeholder="vente"
          className={inputClass}
        />
      </FormCell>
      <FormCell label="Date d'embauche" isDark={isDark}>
        <input
          type="date"
          name="date_embauche"
          defaultValue={editingEmploye?.date_embauche || new Date().toISOString().split('T')[0]}
          className={inputClass}
        />
      </FormCell>
      <FormCell label="Salaire" required isDark={isDark}>
        <div className="relative">
          <input
            type="number"
            name="salaire"
            defaultValue={editingEmploye?.salaire || 0}
            required
            min="0"
            step="any"
            placeholder="700000"
            className={`${inputClass} pr-12 font-semibold`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-slate-400 dark:text-slate-500">
            Ar
          </span>
        </div>
      </FormCell>
      <FormCell label="Statut" fullWidth isDark={isDark}>
        <div className="relative">
          <select
            name="status"
            defaultValue={editingEmploye?.status || 'Actif'}
            className={`${inputClass} cursor-pointer appearance-none pr-9`}
          >
            <option value="Actif">Actif</option>
            <option value="En congé">En congé</option>
            <option value="Inactif">Inactif</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 dark:text-slate-500">
            ▾
          </span>
        </div>
      </FormCell>
    </div>
  );
};

export default EmployesFormFields;