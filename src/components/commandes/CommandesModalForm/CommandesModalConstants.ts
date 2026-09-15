// src/components/commandes/CommandesModalForm/CommandesModalConstants.ts

export const COLORS = {
  light: {
    card: '#FFFFFF', border: '#E2E8F0', headerBg: '#FFFFFF', inputBg: '#FFFFFF',
    softBg: '#F8FAFC', text: '#0F172A', muted: '#64748B', subMuted: '#94A3B8',
    primary: '#4F46E5', primaryHover: '#4338CA', primaryBg: 'rgba(79,70,229,0.08)',
    green: '#059669', red: '#DC2626', amber: '#D97706',
  },
  dark: {
    card: '#0F172A', border: 'rgba(255,255,255,0.12)', headerBg: '#0F172A', inputBg: '#0F172A',
    softBg: '#0F172A', text: '#F8FAFC', muted: '#94A3B8', subMuted: '#94A3B8',
    primary: '#4F46E5', primaryHover: '#4338CA', primaryBg: 'rgba(79,70,229,0.12)',
    green: '#34D399', red: '#F87171', amber: '#FBBF24',
  },
};

export interface Client { id: number; nom: string; email: string; telephone: string; adresse: string; }
export interface Produit { id: number; nom: string; code: string; prix_vente: number; quantite_stock: number; unite?: string; tva_rate?: number; }
export interface SelectedProduct { id: number; quantite: number; tva_rate?: number; }

export const formatMoney = (value: number) => `${Number(value || 0).toLocaleString('fr-FR')} Ar`;