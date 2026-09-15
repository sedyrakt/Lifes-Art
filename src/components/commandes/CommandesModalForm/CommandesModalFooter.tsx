// src/components/commandes/CommandesModalForm/CommandesModalFooter.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { COLORS } from './CommandesModalConstants';

interface CommandesModalFooterProps {
  onClose: () => void;
}

export const CommandesModalFooter: React.FC<CommandesModalFooterProps> = ({ onClose }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;

  return (
    <div className="flex justify-end gap-2 px-4 py-3 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
      <button
        type="button"
        onClick={onClose}
        className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        style={{ color: theme.muted }}
      >
        Annuler
      </button>
      <button
        type="submit"
        className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold text-white shadow-md transition-transform active:scale-[0.98] hover:shadow-lg"
        style={{ background: theme.primary }}
      >
        <CheckCircle size={14} className="inline mr-1" />
        Valider
      </button>
    </div>
  );
};