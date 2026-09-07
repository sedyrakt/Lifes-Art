import React from 'react';
import { Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface EntreesSearchBarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
}

const EntreesSearchBar: React.FC<EntreesSearchBarProps> = ({ searchInput, onSearchChange }) => {
  const { isDark } = useTheme();

  return (
    <div className="relative min-w-0 flex-1">
      <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500 dark:text-brand-400" />
      <input
        type="text"
        placeholder="Rechercher une entrée (référence, produit...)..."
        value={searchInput}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-10 w-full rounded-xl border bg-white pl-10 pr-4 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}
      />
    </div>
  );
};

export default EntreesSearchBar;