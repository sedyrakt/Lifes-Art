import React from 'react';
import { X, FilePlus2 } from 'lucide-react';

interface CompanySettingsHeaderProps {
  isGenerateMode: boolean;
  isDark: boolean;
  theme: any;
  onClose: () => void;
}

const CompanySettingsHeader: React.FC<CompanySettingsHeaderProps> = ({ isGenerateMode, isDark, theme, onClose }) => {
  const title = isGenerateMode ? 'Générer la facture' : "Informations de l'entreprise";
  const description = isGenerateMode ? 'Renseignez les informations nécessaires pour la facture' : 'Configurez les informations utilisées sur vos factures';

  return (
    <header className="relative flex shrink-0 items-center justify-between border-b px-5 py-3.5 sm:px-6" style={{ background: theme.card, borderColor: theme.border }}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: theme.primaryBg, color: theme.primary }}>
          {isGenerateMode ? <FilePlus2 size={16} /> : null}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-[16px] font-semibold tracking-tight" style={{ color: theme.text }}>{title}</h2>
          <p className="mt-0.5 truncate text-[13px]" style={{ color: theme.muted }}>{description}</p>
        </div>
      </div>
      <button type="button" onClick={onClose} aria-label="Fermer" className="ml-4 flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-brand-50 dark:hover:bg-white/[0.06]" style={{ color: theme.muted }}>
        <X size={18} />
      </button>
    </header>
  );
};

export default CompanySettingsHeader;