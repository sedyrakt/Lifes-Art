
import React from 'react';
import { Plus, Save } from 'lucide-react';

interface EmployesFormActionsProps {
  editingEmploye: any | null;
  onClose: () => void;
  isDark: boolean;
  onSave: () => void;
}

const EmployesFormActions: React.FC<EmployesFormActionsProps> = ({ editingEmploye, onClose, isDark, onSave }) => {
  return (
    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-800/60 px-5 py-3 sm:px-6">
      <span className="hidden text-[12px] text-slate-500 dark:text-slate-400 sm:block">
        Échap pour fermer · Ctrl + Entrée pour enregistrer
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-lg px-4 text-[14.5px] font-medium text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-800 active:scale-[0.98] dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-[14.5px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-600 hover:shadow-md active:scale-[0.98]"
        >
          {editingEmploye ? <Save className="h-3.5 w-3.5" strokeWidth={2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2} />}
          {editingEmploye ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </footer>
  );
};

export default EmployesFormActions;