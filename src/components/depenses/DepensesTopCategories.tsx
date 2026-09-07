

import React from 'react';
import { Tag } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: {
    card: '#FFFFFF', border: '#E2E8F0', text: '#264653', muted: '#64748B',
    primary: '#0d80d2', red: '#0d80d2', primaryBg: 'rgba(13,128,210,0.08)',
  },
  dark: {
    card: '#2A2A2A', border: 'rgba(255,255,255,0.12)', text: '#FDE2E4', muted: '#B0B0B0',
    primary: '#0d80d2', red: '#0d80d2', primaryBg: 'rgba(13,128,210,0.15)',
  }
};

const hexToRgba = (hex: string, alpha: number): string => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface DepensesTopCategoriesProps {
  parCategorie: Record<string, number>;
  total: number;
  categoryIcons: Record<string, any>;
  categoryColors: (cat: string) => { light: string; dark: string; text: string };
  isDark: boolean;
}

const DepensesTopCategories: React.FC<DepensesTopCategoriesProps> = ({
  parCategorie, total, categoryIcons, categoryColors, isDark,
}) => {
  const { isDark: themeIsDark } = useTheme();
  const theme = themeIsDark ? COLORS.dark : COLORS.light;

  const curveImage = themeIsDark ? '/images/curvedark.png' : '/images/curvelight.png';

  const topCategories = Object.entries(parCategorie)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  if (topCategories.length === 0 || total === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative rounded-lg p-3 shadow-sm border animate-pulse overflow-hidden" style={{ background: theme.card, borderColor: theme.border }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg" style={{ background: theme.primaryBg }} />
                <div className="h-4 w-16 rounded" style={{ background: theme.border }} />
              </div>
              <div className="h-4 w-12 rounded" style={{ background: theme.border }} />
            </div>
            <div className="mt-1 w-full h-1 rounded-full" style={{ background: theme.border }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {topCategories.map(([categorie, montant]) => {
        const Icon = categoryIcons[categorie] || Tag;
        const colors = categoryColors(categorie);
        const pourcentage = total > 0 ? (montant / total) * 100 : 0;
        
        return (
          <div key={categorie} className="group relative rounded-lg p-3 shadow-sm border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden" style={{ background: theme.card, borderColor: theme.border, position: 'relative', overflow: 'hidden' }} aria-label={`Catégorie ${categorie}: ${Number(montant).toLocaleString('fr-FR')} Ar (${pourcentage.toFixed(1)}% du total)`}>
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url(${curveImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: themeIsDark ? 0.08 : 0.10, filter: 'blur(1px)' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: themeIsDark ? `radial-gradient(circle at 30% 20%, ${hexToRgba('#0d80d2', 0.05)}, transparent 70%)` : `radial-gradient(circle at 30% 20%, ${hexToRgba('#0d80d2', 0.03)}, transparent 70%)` }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${themeIsDark ? colors.dark : colors.light}`}>
                    <Icon className={`w-4 h-4 ${themeIsDark ? colors.text : colors.text}`} />
                  </div>
                  <span className="text-sm font-medium truncate" style={{ color: theme.text }}>{categorie}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: theme.primary }}>{`${Number(montant).toLocaleString('fr-FR')} Ar`}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: theme.border }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pourcentage, 100)}%`, background: theme.primary }} />
                </div>
                <span className="text-[10px] font-medium" style={{ color: theme.muted }}>{pourcentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DepensesTopCategories;