import React from 'react';
import { Save, FileDown, Loader2 } from 'lucide-react';

interface CompanySettingsActionsProps {
  isGenerateMode: boolean;
  loading: boolean;
  isDark: boolean;
  theme: any;
  onClose: () => void;
  onSave: () => void;
  onGenerate: () => void;
}

const CompanySettingsActions: React.FC<CompanySettingsActionsProps> = ({ isGenerateMode, loading, isDark, theme, onClose, onSave, onGenerate }) => {
  const busy = loading;

  return (
    <div className="flex shrink-0 items-center justify-end gap-2.5 border-t px-5 py-3.5" style={{ background: theme.footer, borderColor: theme.border }}>
      <button type="button" onClick={onClose} disabled={busy} className="inline-flex h-9 items-center justify-center rounded-lg border px-3.5 text-[14px] font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: theme.border, color: theme.muted, background: 'transparent' }}>
        Annuler
      </button>
      {isGenerateMode ? (
        <button type="button" onClick={onGenerate} disabled={busy} className="inline-flex h-9 min-w-[105px] items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Génération...</span></> : <><FileDown className="h-4 w-4" /><span>Générer</span></>}
        </button>
      ) : (
        <button type="button" onClick={onSave} disabled={busy} className="inline-flex h-9 min-w-[115px] items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Enregistrement...</span></> : <><Save className="h-4 w-4" /><span>Enregistrer</span></>}
        </button>
      )}
    </div>
  );
};

export default CompanySettingsActions;