

import React from 'react';
import { FolderOpen, FileText, Award, Package } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Categorie { id: number; nom: string; description: string; created_at: string; produits_count?: number; }
interface CategoriesStatsProps { 
  total: number; 
  avecDescription: number; 
  tauxCompletion: number; 
  totalProduits: number; 
  categories?: Categorie[]; 
  evolutionTotal?: number; 
  evolutionAvecDescription?: number; 
  evolutionTauxCompletion?: number; 
}

const CategoriesStats: React.FC<CategoriesStatsProps> = ({ 
  total, 
  avecDescription, 
  tauxCompletion, 
  totalProduits, 
  categories = [] 
}) => {
  const { isDark } = useTheme();
  
  const stats = [
    { 
      label: 'Total catégories', 
      value: total, 
      icon: <FolderOpen size={16} />,
      colorClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
    },
    { 
      label: 'Avec description', 
      value: avecDescription, 
      icon: <FileText size={16} />,
      colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    },
    { 
      label: 'Taux de complétion', 
      value: `${tauxCompletion}%`, 
      icon: <Award size={16} />,
      colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
    },
    { 
      label: 'Total Produits', 
      value: totalProduits, 
      icon: <Package size={16} />,
      colorClass: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400'
    },
  ];

  return (
    <div className="mb-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div 
          key={stat.label} 
          className={`group relative min-h-[80px] rounded-lg border px-4 py-3.5 shadow-[0_1px_2px_rgba(79,70,229,0.03)] transition-all duration-200 ring-1 ring-transparent flex items-center gap-3 ${
            isDark 
              ? 'border-white/[0.12] bg-[#0F172A] hover:border-white/[0.18] hover:bg-slate-800 hover:shadow-none hover:ring-brand-500/20' 
              : 'border-slate-200 bg-white hover:border-brand-500/40 hover:bg-brand-50/50 hover:shadow-[0_2px_6px_rgba(79,70,229,0.05)] hover:ring-brand-500/20'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.colorClass}`}>
            {stat.icon}
          </div>
          
          <div className="flex min-w-0 flex-col">
            <span className="text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {stat.value}
            </span>
            <span className="mt-0.5 truncate text-[14px] font-medium text-slate-500 dark:text-slate-400">
              {stat.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoriesStats;