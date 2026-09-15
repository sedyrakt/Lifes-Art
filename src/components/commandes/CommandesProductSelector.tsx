// src/components/commandes/CommandesProductSelector.tsx
// ⭐ FONT SIZE: inputs 15px, buttons 15px, items 14px (nampitomboina)

import React, { useMemo, useState } from 'react';
import { Plus, XCircle, ShoppingCart, Minus, Trash2, Search, X, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: { border: '#E2E8F0', text: '#0F172A', muted: '#64748B', subMuted: '#94A3B8', primary: '#4F46E5', soft: '#F8FAFC', bg: '#FFFFFF', red: '#DC2626', primaryBg: 'rgba(79,70,229,0.06)', amber: '#D97706' },
  dark: { border: 'rgba(255,255,255,0.12)', text: '#F8FAFC', muted: '#94A3B8', subMuted: '#94A3B8', primary: '#4F46E5', soft: '#0F172A', bg: '#0F172A', red: '#F87171', primaryBg: 'rgba(79,70,229,0.12)', amber: '#FBBF24' },
};

interface Produit {
  id: number; nom: string; code: string; prix_vente: number; quantite_stock: number; unite?: string; tva_rate?: number;
}
interface SelectedProduct { id: number; quantite: number; tva_rate?: number; }
interface Props {
  produits: Produit[]; selectedProduits: SelectedProduct[];
  onAddProduit: (id: number, quantite: number, tva_rate?: number) => void;
  onUpdateQuantite: (id: number, quantite: number) => void;
  onRemoveProduit: (id: number) => void;
  onClearPanier: () => void;
  isDark: boolean;
}

const CommandesProductSelector: React.FC<Props> = ({ produits, selectedProduits, onAddProduit, onUpdateQuantite, onRemoveProduit, onClearPanier, isDark }) => {
  const { isDark: contextIsDark } = useTheme();
  const dark = isDark ?? contextIsDark;
  const theme = dark ? COLORS.dark : COLORS.light;
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityValue, setQuantityValue] = useState('1');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return produits.filter(p => p.nom.toLowerCase().includes(term) || p.code.toLowerCase().includes(term));
  }, [produits, searchTerm]);

  const selectedProduct = produits.find(p => p.id === Number(selectedProductId));

  const add = () => {
    const id = Number(selectedProductId);
    const product = produits.find(p => p.id === id);
    const qty = Number(quantityValue) || 1;
    if (!product) return;

    if (product.quantite_stock <= 0) {
      setErrorMessage(`Impossible d'ajouter ${product.nom}, stock épuisé.`);
      return;
    }

    const existing = selectedProduits.find(i => i.id === id);
    const currentQty = existing ? existing.quantite : 0;
    const remainingStock = product.quantite_stock - currentQty;

    if (remainingStock <= 0) { setErrorMessage(`Stock maximum atteint pour ${product.nom} (${product.quantite_stock} en stock).`); return; }
    if (qty > remainingStock) { setErrorMessage(`Stock insuffisant ! Il ne reste que ${remainingStock} unité(s) de ${product.nom}.`); return; }

    const tvaRate = (product.tva_rate !== undefined && product.tva_rate !== null && product.tva_rate !== '') ? Number(product.tva_rate) : 0.2;

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
    return p ? sum + p.prix_vente * item.quantite : sum;
  }, 0);

  const inputStyle = { background: theme.bg, borderColor: theme.border, color: theme.text };

  return (
    /* ⭐ Padding : p-3.5 → p-4 */
    <div className="p-4 space-y-3.5">
      <div className="relative">
        {/* ⭐ Search icon : 14 → 16 */}
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: theme.muted }} />
        {/* ⭐ Search input : h-10, text-[13px] → text-[15px], pl-9 → pl-11 */}
        <input
          value={isOpen ? searchTerm : ''}
          onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); setErrorMessage(''); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher un produit..."
          className="w-full h-11 rounded-lg border pl-11 pr-3.5 text-[15px] outline-none focus:ring-2"
          style={inputStyle}
        />
        {isOpen && (
          <div className="absolute left-0 right-0 z-20 mt-1.5 max-h-60 overflow-y-auto rounded-lg border shadow-lg" style={{ borderColor: theme.border, background: theme.bg }} onMouseDown={(e) => e.preventDefault()}>
            {filtered.length === 0 ? (
              /* ⭐ Empty : 13px → 14.5px */
              <div className="px-4 py-3 text-[14.5px] text-slate-500">Aucun produit</div>
            ) : filtered.map(p => {
              const isRupture = p.quantite_stock <= 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isRupture}
                  onMouseDown={() => {
                    if (!isRupture) {
                      setSelectedProductId(String(p.id)); setIsOpen(false); setSearchTerm(''); setErrorMessage(''); setQuantityValue('1');
                    }
                  }}
                  className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left ${isRupture ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  <div className="min-w-0 flex-1">
                    {/* ⭐ Product name : 13px → 14.5px */}
                    <p className="text-[14.5px] font-semibold truncate" style={{ color: isRupture ? theme.muted : theme.text }}>{p.nom}</p>
                    {isRupture ? (
                      /* ⭐ Rupture : 12px → 13.5px */
                      <p className="text-[13.5px] font-bold" style={{ color: theme.red }}>Rupture stock</p>
                    ) : (
                      /* ⭐ Code+TVA : 12.5px → 14px */
                      <p className="text-[14px] truncate" style={{ color: theme.muted }}>
                        {p.code} · TVA {((Number.isFinite(Number(p.tva_rate)) ? Number(p.tva_rate) : 0.2) * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  {/* ⭐ Price : 13px → 14.5px */}
                  <span className="text-[14.5px] font-semibold" style={{ color: isRupture ? theme.red : theme.primary }}>{p.prix_vente.toLocaleString('fr-FR')} Ar</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="border rounded-xl p-3 space-y-3" style={{ borderColor: theme.amber, background: dark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.05)' }}>
          {/* ⭐ HINT MAZAVA — 11px → 13px, icon 12 → 14 */}
          <div className="flex items-center gap-2 rounded-md border px-3 py-2" style={{ borderColor: 'rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.10)' }}>
            <AlertCircle size={14} style={{ color: theme.amber }} />
            <span className="text-[13px] font-semibold" style={{ color: theme.amber }}>
              Cliquez sur <strong>"+ Ajouter"</strong> pour confirmer ce produit
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {/* ⭐ Product name : 13px → 14.5px */}
              <p className="text-[14.5px] font-bold truncate" style={{ color: theme.text }}>{selectedProduct.nom}</p>
              {/* ⭐ Code+TVA : 12.5px → 14px */}
              <p className="text-[14px] truncate" style={{ color: theme.muted }}>{selectedProduct.code} · TVA {((Number.isFinite(Number(selectedProduct.tva_rate)) ? Number(selectedProduct.tva_rate) : 0.2) * 100).toFixed(0)}%</p>
            </div>
            <div className="text-right shrink-0">
              {/* ⭐ Price : 13px → 14.5px */}
              <p className="text-[14.5px] font-bold" style={{ color: theme.primary }}>{selectedProduct.prix_vente.toLocaleString('fr-FR')} Ar</p>
              {/* ⭐ Stock info : 10.5px → 12.5px */}
              <p className="text-[12.5px] text-slate-500">Stock: {selectedProduct.quantite_stock}</p>
            </div>
            {/* ⭐ Close button X : 14 → 16 */}
            <button type="button" onClick={() => setSelectedProductId('')} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}><X size={16} /></button>
          </div>

          <div className="flex gap-2">
            {/* ⭐ Quantity input : w-[70px] → w-[80px], h-10 → h-11, text-[13.5px] → text-[15px] */}
            <input
              type="number"
              min="1"
              max={selectedProduct.quantite_stock}
              value={quantityValue}
              onChange={(e) => { setQuantityValue(e.target.value); setErrorMessage(''); }}
              className="w-[80px] h-11 rounded-lg border text-center text-[15px] font-semibold outline-none focus:ring-2"
              style={inputStyle}
            />
            {/* ⭐ Add button : h-10 → h-11, text-[13px] → text-[15px], icon 14 → 16 */}
            <button
              type="button"
              onClick={add}
              className="flex-1 h-11 rounded-lg text-[15px] font-bold text-white transition hover:opacity-90 animate-pulse-ring"
              style={{
                background: theme.primary,
                boxShadow: `0 0 0 0 ${theme.primary}`,
              }}
            >
              <Plus size={16} className="inline mr-1.5" />
              Ajouter au panier
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        /* ⭐ Error : 12.5px → 14px, icon 13 → 15 */
        <div className="relative px-3.5 py-2.5 rounded-lg border text-[14px] font-medium" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: theme.red }}>
          <span className="block pr-6">⚠️ {errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600"><XCircle size={15} /></button>
        </div>
      )}

      {selectedProduits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          {/* ⭐ Cart icon : 24 → 28 */}
          <ShoppingCart size={28} style={{ color: theme.subMuted }} />
          {/* ⭐ Text : 12.5px → 14.5px */}
          <p className="mt-2.5 text-[14.5px]" style={{ color: theme.muted }}>Panier vide</p>
          {/* ⭐ Subtext : 11px → 13px */}
          <p className="mt-1 text-[13px]" style={{ color: theme.subMuted }}>Recherchez un produit et cliquez sur "Ajouter"</p>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedProduits.map(item => {
            const p = produits.find(x => x.id === item.id);
            if (!p) return null;
            const isMaxStock = item.quantite >= p.quantite_stock;
            const lineTotal = p.prix_vente * item.quantite;
            const tvaRate = (p?.tva_rate !== undefined && p?.tva_rate !== null && p?.tva_rate !== '') ? Number(p.tva_rate) : 0.2;
            return (
              /* ⭐ Cart item : py-2 → py-2.5, px-3 → px-3.5 */
              <div key={item.id} className="flex items-center justify-between gap-2.5 border rounded-lg px-3.5 py-2.5" style={{ borderColor: theme.border }}>
                <div className="min-w-0 flex-1">
                  {/* ⭐ Product name : 13px → 14.5px */}
                  <p className="text-[14.5px] font-semibold truncate" style={{ color: theme.text }}>{p.nom}</p>
                  {/* ⭐ Info : 12.5px → 13.5px */}
                  <p className="text-[13.5px]" style={{ color: theme.muted }}>{p.prix_vente.toLocaleString('fr-FR')} Ar · TVA {(tvaRate * 100).toFixed(0)}%</p>
                </div>
                <div className="flex items-center gap-1">
                  {/* ⭐ Minus button : w-7 h-7 → w-8 h-8, icon 12 → 14 */}
                  <button type="button" onClick={() => handleDecrement(item)} className="w-8 h-8 flex items-center justify-center rounded-md border hover:bg-slate-100 dark:hover:bg-white/5" style={{ borderColor: theme.border, color: theme.muted }}><Minus size={14} /></button>
                  {/* ⭐ Quantity : w-7 → w-8, text-[13.5px] → text-[15px] */}
                  <span className="w-8 text-center text-[15px] font-semibold" style={{ color: theme.text }}>{item.quantite}</span>
                  {/* ⭐ Plus button : w-7 h-7 → w-8 h-8, icon 12 → 14 */}
                  <button type="button" onClick={() => handleIncrement(p, item)} disabled={isMaxStock} className="w-8 h-8 flex items-center justify-center rounded-md border" style={{ borderColor: theme.border, color: isMaxStock ? theme.subMuted : theme.muted, cursor: isMaxStock ? 'not-allowed' : 'pointer', opacity: isMaxStock ? 0.5 : 1 }}><Plus size={14} /></button>
                </div>
                {/* ⭐ Line total : 13.5px → 15px */}
                <span className="text-[15px] font-bold" style={{ color: theme.primary }}>{lineTotal.toLocaleString('fr-FR')} Ar</span>
                {/* ⭐ Remove XCircle : 15 → 17 */}
                <button type="button" onClick={() => onRemoveProduit(item.id)} className="text-slate-400 hover:text-danger-500"><XCircle size={17} /></button>
              </div>
            );
          })}
          {/* ⭐ Footer total : 12px/13.5px → 13.5px/15px */}
          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: theme.border }}>
            <span className="text-[13.5px] font-semibold uppercase" style={{ color: theme.muted }}>Total</span>
            <span className="text-[15px] font-bold" style={{ color: theme.primary }}>{total.toLocaleString('fr-FR')} Ar</span>
          </div>
          {selectedProduits.length > 0 && (
            /* ⭐ Clear panier : 12.5px → 14px, icon 12 → 14 */
            <button type="button" onClick={onClearPanier} className="w-full text-[14px] text-slate-400 hover:text-danger-500 text-center py-1">
              <Trash2 size={14} className="inline mr-1.5" />Vider le panier
            </button>
          )}
        </div>
      )}

      {/* ⭐ Animation pulse ho an'ny bouton "Ajouter" */}
      <style>{`
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(79,70,229,0.55); }
          70% { box-shadow: 0 0 0 10px rgba(79,70,229,0); }
          100% { box-shadow: 0 0 0 0 rgba(79,70,229,0); }
        }
        .animate-pulse-ring {
          animation: pulseRing 1.8s cubic-bezier(0.66, 0, 0, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default CommandesProductSelector;