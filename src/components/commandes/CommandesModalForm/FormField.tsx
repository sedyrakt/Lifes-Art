// src/components/commandes/CommandesModalForm/FormField.tsx
// ⭐ FONT SIZE: label 13px → 13.5px

import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { COLORS } from './CommandesModalConstants';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({ label, children, required = false }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;

  return (
    <div className="min-w-0">
      {/* ⭐ Label : 13px → 13.5px, mb-1 → mb-1.5 */}
      <label className="mb-1.5 block text-[13.5px] font-semibold" style={{ color: theme.text }}>
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
};