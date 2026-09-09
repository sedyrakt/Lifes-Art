// src/components/achats/AchatsProductSelector.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FIXED: TVA 0% + CARTE PRODUIT
// ⭐ FIX VAOVAO: Ny TVA ao anaty cart dia nalaina avy amin'ny liste produits (10% mifanaraka)
// ⭐ DESIGN: BALANCED - SAKY ANTONONY (Mifanaraka amin'ny Ventes)
// ⭐ FIX: DARK MODE BG = #0F172A (dropdown, inputs, cart)

import React, { useMemo, useState } from 'react';
import { Package, Plus, XCircle, ShoppingCart, Minus, Trash2, Search, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: {
    border: '#E2E8F0', text: '#0F172A', muted: '#64748B', subMuted: '#94A3B8',
    primary: '#4F46E5', soft: '#F8FAFC', bg: '#FFFFFF', red: '#DC2626',
    primaryBg: 'rgba(79,70,229,0.06)'
  },
  dark: {
    border: 'rgba(255,255,255,0.12)', text: '#F8FAFC', muted: '#94A3B8', subMuted: '#94A3B8',
    primary: '#4F46E5', soft: '#1E293B', bg: '#0F172A',   // ⭐ FIX: bg = #0F172A
    red: '#F87171', primaryBg: 'rgba(79,70,229,0.12)'
  }
};

interface Produit { id: number; nom: string; code: string; prix_achat: number; quantite_stock: number; unite?: string; tva_rate?: number; }
interface SelectedProduct { id: number; quantite: number; tva_rate?: number; }
interface Props {
  produits: Produit[];
  selectedProduits: SelectedProduct[];
  onAddProduit: (id: number, quantite: number, tva_rate?: number) => void;
  onUpdateQuantite: (id: number, quantite: number) => void;
  onRemoveProduit: (id: number) => void;
  onClearPanier: () => void;
  isDark: boolean;
}

const AchatsProductSelector: React.FC<Props> = ({ produits, selectedProduits, onAddProduit, onUpdateQuantite, onRemoveProduit, onClearPanier, isDark }) => {
  const { isDark: contextIsDark } = useTheme();
  const dark = isDark ?? contextIsDark;
  const theme = dark ? COLORS.dark : COLORS.light;
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityValue, setQuantityValue] = useState('1');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const disponibles = useMemo(() => produits.filter(p => p.quantite_stock > 0), [produits]);
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return disponibles.filter(p => p.nom.toLowerCase().includes(term) || p.code.toLowerCase().includes(term));
  }, [disponibles, searchTerm]);

  const selectedProduct = produits.find(p => p.id === Number(selectedProductId));

  const add = () => {
    const id = Number(selectedProductId);
    const product = produits.find(p => p.id === id);
    const qty = Number(quantityValue) || 1;
    if (!product) return;

    const existing = selectedProduits.find(i => i.id === id);
    const currentQty = existing ? existing.quantite : 0;
    const remainingStock = product.quantite_stock - currentQty;

    if (remainingStock <= 0) { setErrorMessage(`Stock maximum atteint pour ${product.nom} (${product.quantite_stock} en stock).`); return; }
    if (qty > remainingStock) { setErrorMessage(`Stock insuffisant ! Il ne reste que ${remainingStock} unité(s) de ${product.nom}.`); return; }

    const tvaRate = Number.isFinite(Number(product.tva_rate)) ? Number(product.tva_rate) : 0.2;
    
    if (existing) onUpdateQuantite(id, existing.quantite + qty);
    else onAddProduit(id, qty, tvaRate);
    
    setSelectedProductId(''); setQuantityValue('1'); setSearchTerm(''); setIsOpen(false); setErrorMessage('');
  };

  const handleIncrement = (product: Produit, item: SelectedProduct) => {
    if (item.quantite + 1 > product.quantite_stock) { setErrorMessage(`Stock maximum atteint pour ${product.nom} (${product.quantite_stock} en stock).`); return; }
    setErrorMessage('');
    onUpdateQuantite(item.id, item.quantite + 1);
  };

  const handleDecrement = (item: SelectedProduct) => { setErrorMessage(''); onUpdateQuantite(item.id, Math.max(1, item.quantite - 1)); };
  const total = selectedProduits.reduce((sum, item) => {
    const p = produits.find(x => x.id === item.id);
    return p ? sum + p.prix_achat * item.quantite : sum;
  }, 0);

  const inputStyle = { background: theme.bg, borderColor: theme.border, color: theme.text };

  return (
    <div className="p-4 space-y-3.5">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.muted }} />
        <input value={isOpen ? searchTerm : ''} onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); setErrorMessage(''); }} onFocus={() => setIsOpen(true)} placeholder="Rechercher un produit..." className="w-full h-11 rounded-lg border pl-9 pr-3 text-[14px] outline-none focus:ring-2" style={inputStyle} />
        {isOpen && (
          <div className="absolute left-0 right-0 z-20 mt-1.5 max-h-60 overflow-y-auto rounded-lg border shadow-lg" style={{ borderColor: theme.border, background: theme.bg }} onMouseDown={(e) => e.preventDefault()}>
            {filtered.length === 0 ? <div className="px-4 py-3 text-[14px] text-slate-500">Aucun produit</div> : filtered.map(p => (
              <button key={p.id} type="button" onMouseDown={() => { setSelectedProductId(String(p.id)); setIsOpen(false); setSearchTerm(''); setErrorMessage(''); setQuantityValue('1'); }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/5">
                <Package size={15} style={{ color: theme.primary }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold truncate" style={{ color: theme.text }}>{p.nom}</p>
                  <p className="text-[14px] truncate" style={{ color: theme.muted }}>{p.code} · TVA {((Number.isFinite(Number(p.tva_rate)) ? Number(p.tva_rate) : 0.2) * 100).toFixed(0)}%</p>
                </div>
                <span className="text-[14px] font-semibold" style={{ color: theme.primary }}>{p.prix_achat.toLocaleString('fr-FR')} Ar</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="border rounded-xl p-3 space-y-2.5" style={{ borderColor: theme.primary, background: theme.soft }}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 flex items-center gap-2.5">
              <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md" style={{ background: theme.primaryBg, color: theme.primary }}><Package size={15} /></div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold truncate" style={{ color: theme.text }}>{selectedProduct.nom}</p>
                <p className="text-[14px] truncate" style={{ color: theme.muted }}>{selectedProduct.code} · TVA {((Number.isFinite(Number(selectedProduct.tva_rate)) ? Number(selectedProduct.tva_rate) : 0.2) * 100).toFixed(0)}%</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[14px] font-bold" style={{ color: theme.primary }}>{selectedProduct.prix_achat.toLocaleString('fr-FR')} Ar</p>
              <p className="text-[11px] text-slate-500">Stock: {selectedProduct.quantite_stock}</p>
            </div>
            <button type="button" onClick={() => setSelectedProductId('')} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}><X size={15} /></button>
          </div>
          <div className="flex gap-2">
            <input type="number" min="1" max={selectedProduct.quantite_stock} value={quantityValue} onChange={(e) => { setQuantityValue(e.target.value); setErrorMessage(''); }} className="w-20 h-11 rounded-lg border text-center text-[15px] font-semibold outline-none focus:ring-2" style={inputStyle} />
            <button type="button" onClick={add} className="flex-1 h-11 rounded-lg text-[14px] font-bold text-white transition hover:opacity-90" style={{ background: theme.primary }}><Plus size={15} className="inline mr-1" />Ajouter</button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="relative px-3 py-2 rounded-lg border text-[13px] font-medium" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: theme.red }}>
          <span className="block pr-6">⚠️ {errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600"><XCircle size={14} /></button>
        </div>
      )}

      {selectedProduits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-5 text-center"><ShoppingCart size={26} style={{ color: theme.subMuted }} /><p className="mt-2 text-[13px]" style={{ color: theme.muted }}>Panier vide</p></div>
      ) : (
        <div className="space-y-2.5">
          {selectedProduits.map(item => {
            const p = produits.find(x => x.id === item.id);
            if (!p) return null;
            const isMaxStock = item.quantite >= p.quantite_stock;
            const lineTotal = p.prix_achat * item.quantite;
            const tvaRate = Number.isFinite(Number(p.tva_rate)) ? Number(p.tva_rate) : 0.2;
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 border rounded-lg px-3.5 py-2.5" style={{ borderColor: theme.border }}>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold truncate" style={{ color: theme.text }}>{p.nom}</p>
                  <p className="text-[14px]" style={{ color: theme.muted }}>{p.prix_achat.toLocaleString('fr-FR')} Ar · TVA {(tvaRate * 100).toFixed(0)}%</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => handleDecrement(item)} className="w-8 h-8 flex items-center justify-center rounded-md border hover:bg-slate-100 dark:hover:bg-white/5" style={{ borderColor: theme.border, color: theme.muted }}><Minus size={13} /></button>
                  <span className="w-8 text-center text-[15px] font-semibold" style={{ color: theme.text }}>{item.quantite}</span>
                  <button type="button" onClick={() => handleIncrement(p, item)} disabled={isMaxStock} className="w-8 h-8 flex items-center justify-center rounded-md border" style={{ borderColor: theme.border, color: isMaxStock ? theme.subMuted : theme.muted, cursor: isMaxStock ? 'not-allowed' : 'pointer', opacity: isMaxStock ? 0.5 : 1 }}><Plus size={13} /></button>
                </div>
                <span className="text-[15px] font-bold" style={{ color: theme.primary }}>{lineTotal.toLocaleString('fr-FR')} Ar</span>
                <button type="button" onClick={() => onRemoveProduit(item.id)} className="text-slate-400 hover:text-danger-500"><XCircle size={16} /></button>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: theme.border }}>
            <span className="text-[13px] font-semibold uppercase" style={{ color: theme.muted }}>Total</span>
            <span className="text-[15px] font-bold" style={{ color: theme.primary }}>{total.toLocaleString('fr-FR')} Ar</span>
          </div>
          {selectedProduits.length > 0 && <button type="button" onClick={onClearPanier} className="w-full text-[14px] text-slate-400 hover:text-danger-500 text-center"><Trash2 size={13} className="inline mr-1" />Vider le panier</button>}
        </div>
      )}
    </div>
  );
};

export default AchatsProductSelector;