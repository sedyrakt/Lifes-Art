// src/components/commandes/CommandesModalForm/CommandesModalHeader.tsx
// ⭐ FONT SIZE: h2 16px, subtitle 12.5px, icons +1

import React from 'react';
import { X, User } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { COLORS } from './CommandesModalConstants';

interface CommandesModalHeaderProps {
  onClose: () => void;
}

export const CommandesModalHeader: React.FC<CommandesModalHeaderProps> = ({ onClose }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;

  return (
    /* ⭐ Padding : px-4 py-2.5 → px-5 py-3.5 */
    <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ background: theme.headerBg, borderColor: theme.border }}>
      <div className="flex items-center gap-3">
        {/* ⭐ Icon container : p-2 → p-2.5, icon 17 → 19 */}
        <div className="p-2.5 rounded-lg" style={{ background: theme.primaryBg }}>
          <User size={19} style={{ color: theme.primary }} />
        </div>
        <div>
          {/* ⭐ h2 : 15.5px → 16px */}
          <h2 className="text-[16px] font-bold" style={{ color: theme.text }}>Nouvelle commande</h2>
          {/* ⭐ Subtitle : 12px → 12.5px */}
          <p className="text-[12.5px]" style={{ color: theme.muted }}>Créer une commande</p>
        </div>
      </div>
      {/* ⭐ Close button : icon 17 → 19, p-1 → p-1.5 */}
      <button
        onClick={onClose}
        className={`p-1.5 rounded-md ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
        style={{ color: theme.muted }}
      >
        <X size={19} />
      </button>
    </div>
  );
};