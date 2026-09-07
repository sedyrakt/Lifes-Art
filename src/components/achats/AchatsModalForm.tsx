// src/components/achats/AchatsModalForm.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, ChevronDown, Search, Building2, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import AchatsProductSelector from './AchatsProductSelector';

const COLORS = {
  light: {
    card: '#FFFFFF', border: '#E2E8F0', headerBg: '#FFFFFF', inputBg: '#FFFFFF',
    softBg: '#F8FAFC', sectionBg: '#FFFFFF',
    text: '#0F172A', muted: '#64748B', subMuted: '#94A3B8',
    primary: '#4F46E5', primaryHover: '#4338CA', primaryBg: 'rgba(79,70,229,0.08)',
    green: '#059669', red: '#DC2626', amber: '#D97706'
  },
  dark: {
    card: '#0F172A', border: 'rgba(255,255,255,0.12)', headerBg: '#0F172A',
    inputBg: '#0F172A', softBg: '#0F172A', sectionBg: '#0F172A',
    text: '#F8FAFC', muted: '#94A3B8', subMuted: '#94A3B8',
    primary: '#4F46E5', primaryHover: '#4338CA', primaryBg: 'rgba(79,70,229,0.12)',
    green: '#34D399', red: '#F87171', amber: '#FBBF24'
  }
};

interface Fournisseur { id: number; nom: string; email: string; telephone: string; adresse: string; }
interface Produit { id: number; nom: string; code: string; prix_achat: number; quantite_stock: number; unite?: string; image?: string; tva_rate?: number; }
interface SelectedProduct { id: number; quantite: number; tva_rate?: number; }

interface AchatsModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  fournisseurs: Fournisseur[];
  produits: Produit[];
  selectedFournisseurId: number | null;
  onFournisseurChange: (id: number | null) => void;
  selectedProduits?: SelectedProduct[];
  onAddProduit?: (id: number, quantite: number, tva_rate?: number) => void;
  onUpdateQuantite?: (id: number, quantite: number) => void;
  onRemoveProduit?: (id: number) => void;
  onClearPanier?: () => void;
  editingAchat?: any;
  montantPaye?: number;
  onMontantPayeChange?: (value: number) => void;
  isDark?: boolean;
  tvaOverride?: number | null;
  onTvaRateChange?: (value: number | null) => void;
}

const FormField: React.FC<{ label: string; children: React.ReactNode; required?: boolean; }> = ({ label, children, required = false }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-[14px] font-semibold" style={{ color: theme.text }}>{label}{required && <span className="ml-0.5 text-red-500">*</span>}</label>
      {children}
    </div>
  );
};

const AchatsModalForm: React.FC<AchatsModalFormProps> = ({
  isOpen, onClose, onSubmit, fournisseurs, produits, selectedFournisseurId, onFournisseurChange,
  selectedProduits = [], onAddProduit, onUpdateQuantite, onRemoveProduit, onClearPanier,
  editingAchat = null, montantPaye = 0, onMontantPayeChange, isDark: propIsDark,
  tvaOverride = null, onTvaRateChange
}) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;
  const formRef = useRef<HTMLFormElement>(null);
  const [internalMontantPaye, setInternalMontantPaye] = useState(montantPaye);
  const [fournisseurSearch, setFournisseurSearch] = useState('');
  const [fournisseurOpen, setFournisseurOpen] = useState(false);
  const [internalTvaOverride, setInternalTvaOverride] = useState<number | null>(tvaOverride);

  const safeSelectedProduits = useMemo(() => Array.isArray(selectedProduits) ? selectedProduits : [], [selectedProduits]);
  const totalHT = useMemo(() => safeSelectedProduits.reduce((sum, item) => { const product = produits.find((p) => p.id === item.id); return product ? sum + (Number(product.prix_achat) || 0) * (Number(item.quantite) || 0) : sum; }, 0), [produits, safeSelectedProduits]);
  
  const totalTVA = useMemo(() => {
    if (internalTvaOverride !== null) {
      return totalHT * internalTvaOverride;
    }
    return safeSelectedProduits.reduce((sum, item) => {
      const product = produits.find((p) => p.id === item.id);
      const tvaRate = Number.isFinite(Number(product?.tva_rate)) ? Number(product?.tva_rate) : 0.2;
      const lineTotalHT = (Number(product?.prix_achat) || 0) * (Number(item.quantite) || 0);
      return sum + (lineTotalHT * tvaRate);
    }, 0);
  }, [produits, safeSelectedProduits, totalHT, internalTvaOverride]);

  const totalTTC = totalHT + totalTVA;
  const montantPayeSafe = Math.max(0, Math.min(Number(internalMontantPaye) || 0, totalTTC));
  const resteAPayer = Math.max(0, totalTTC - montantPayeSafe);
  const statutPaiement = montantPayeSafe <= 0 ? 'Non payé' : montantPayeSafe >= totalTTC ? 'Payé' : 'Partiel';
  const statutConfig = statutPaiement === 'Payé' ? { color: theme.green, bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' } : statutPaiement === 'Partiel' ? { color: theme.amber, bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' } : { color: theme.red, bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' };

  useEffect(() => { if (!isOpen) return; setInternalMontantPaye(montantPaye); setInternalTvaOverride(tvaOverride); setFournisseurSearch(''); setFournisseurOpen(false); }, [isOpen, montantPaye, tvaOverride]);
  useEffect(() => { if (!isOpen) return; const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); return; } if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); formRef.current?.requestSubmit(); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [isOpen, onClose]);

  const tauxTVAApplique = internalTvaOverride !== null ? `${(internalTvaOverride * 100).toFixed(0)}% (Fixe)` : 'Auto (Produits)';

  // ⭐ HEADER: fotsy (white) amin'ny light mode
  const headerBg = isDark ? theme.headerBg : '#FFFFFF'; // White
  const headerTextColor = isDark ? theme.text : theme.text; // Slate-900
  const headerSubTextColor = isDark ? theme.muted : theme.muted; // Slate-500
  const headerIconBg = isDark ? theme.primaryBg : 'rgba(79,70,229,0.08)';
  const headerIconColor = isDark ? theme.primary : theme.primary;
  const headerCloseColor = isDark ? theme.muted : theme.muted;
  const headerCloseHover = isDark ? 'dark:hover:bg-white/5' : 'hover:bg-slate-100';

  // ⭐ TOP BORDER: solid indigo en light, gradient en dark
  const topBorderBg = isDark ? `linear-gradient(90deg, ${theme.primary}, ${theme.primaryHover})` : '#4F46E5';

  if (!isOpen) return null;

  const filteredFournisseurs = fournisseurs.filter(f => !fournisseurSearch || f.nom?.toLowerCase().includes(fournisseurSearch.toLowerCase()));
  const selectedFour = fournisseurs.find(f => f.id === selectedFournisseurId);
  const inputClass = `h-11 w-full rounded-lg border px-3 text-[15px] font-medium outline-none transition-all focus:ring-2 dark:placeholder-gray-500`;
  const inputStyle = { background: theme.inputBg, borderColor: theme.border, color: theme.text };
  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.primaryBg}`; };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = 'none'; };
  const formatMoney = (value: number) => `${Number(value || 0).toLocaleString('fr-FR')} Ar`;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }} role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl" style={{ background: theme.card, borderColor: theme.border }} onMouseDown={(e) => e.stopPropagation()}>
        {/* ⭐ TOP BORDER: solid indigo en light mode */}
        <div className="absolute left-0 right-0 top-0 h-[3px]" style={{ background: topBorderBg }} />
        
        {/* ⭐ HEADER BLANC EN LIGHT */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ background: headerBg, borderColor: theme.border }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: headerIconBg }}>
              <Building2 size={19} style={{ color: headerIconColor }} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold" style={{ color: headerTextColor }}>{editingAchat ? 'Modifier achat' : 'Nouvel achat'}</h2>
              <p className="text-[13px]" style={{ color: headerSubTextColor }}>Créer un achat fournisseur</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1 rounded-md ${headerCloseHover}`} style={{ color: headerCloseColor }}>
            <X size={19} />
          </button>
        </div>

        <form ref={formRef} onSubmit={onSubmit} className="flex flex-col">
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField label="Fournisseur" required>
                  <div className="relative">
                    <button type="button" onClick={() => setFournisseurOpen(!fournisseurOpen)} className={`${inputClass} flex items-center justify-between text-left cursor-pointer`} style={inputStyle}>
                      <span className="truncate flex items-center gap-2"><Building2 size={15} style={{ color: theme.muted }} />{selectedFour ? selectedFour.nom : 'Sélectionner un fournisseur'}</span>
                      <ChevronDown size={16} className={`ml-2 shrink-0 transition-transform ${fournisseurOpen ? 'rotate-180' : ''}`} style={{ color: theme.muted }} />
                    </button>
                    {fournisseurOpen && (
                      <div className="absolute left-0 right-0 z-[999] mt-1.5 max-h-52 overflow-y-auto rounded-lg border shadow-xl" style={{ borderColor: theme.border, background: theme.card }} onMouseDown={(e) => e.preventDefault()}>
                        <div className="p-2 border-b sticky top-0" style={{ borderColor: theme.border, background: theme.card }}><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.muted }} /><input autoFocus value={fournisseurSearch} onChange={(e) => setFournisseurSearch(e.target.value)} placeholder="Rechercher..." className={`w-full h-10 rounded-md pl-9 pr-3 text-[14px] outline-none border`} style={inputStyle} /></div></div>
                        <div className="py-1">
                          {filteredFournisseurs.length === 0 ? <div className="px-4 py-3 text-[14px]" style={{ color: theme.muted }}>Aucun fournisseur trouvé</div> : filteredFournisseurs.map(f => (
                            <button key={f.id} type="button" onClick={() => { onFournisseurChange(f.id); setFournisseurOpen(false); setFournisseurSearch(''); }} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5" style={{ color: theme.text }}>
                              <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold truncate">{f.nom}</p><p className="text-[12px] truncate" style={{ color: theme.muted }}>{f.telephone} · {f.email}</p></div>
                              {f.id === selectedFournisseurId && <Check size={16} style={{ color: theme.primary }} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </FormField>
                <div className="overflow-hidden rounded-xl border h-full" style={{ borderColor: theme.border, background: theme.card }}>
                  <AchatsProductSelector produits={produits} selectedProduits={safeSelectedProduits} onAddProduit={onAddProduit} onUpdateQuantite={onUpdateQuantite} onRemoveProduit={onRemoveProduit} onClearPanier={onClearPanier} isDark={isDark} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border p-5" style={{ borderColor: theme.border, background: theme.sectionBg }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col"><span className="text-[12px] uppercase tracking-wide font-medium" style={{ color: theme.muted }}>Total HT</span><span className="text-[17px] font-bold mt-1" style={{ color: theme.text }}>{formatMoney(totalHT)}</span></div>
                    <div className="flex flex-col"><span className="text-[12px] uppercase tracking-wide font-medium" style={{ color: theme.muted }}>TVA ({tauxTVAApplique})</span><span className="text-[17px] font-bold mt-1" style={{ color: theme.text }}>{formatMoney(totalTVA)}</span></div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[14px] font-medium" style={{ color: theme.muted }}>TVA Rate</span>
                    <select 
                      value={internalTvaOverride === null ? 'auto' : internalTvaOverride.toString()} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'auto') setInternalTvaOverride(null);
                        else {
                          const num = Number(val);
                          setInternalTvaOverride(num);
                          onTvaRateChange?.(num);
                        }
                      }}
                      className="h-10 w-32 rounded-md border px-2 text-right text-[15px] font-semibold outline-none focus:ring-2"
                      style={{ background: theme.inputBg, borderColor: theme.border, color: theme.text }}
                    >
                      <option value="auto">Auto (Produits)</option>
                      <option value="0">0%</option>
                      <option value="0.1">10%</option>
                      <option value="0.2">20%</option>
                    </select>
                  </div>

                  <div className="my-4 h-px" style={{ background: theme.border }} />
                  <div className="flex items-center justify-between"><span className="text-[14px] font-medium" style={{ color: theme.muted }}>Montant payé</span><input type="number" min="0" max={totalTTC} step="1" value={internalMontantPaye} onChange={(e) => { const val = Number(e.target.value) || 0; setInternalMontantPaye(val); onMontantPayeChange?.(val); }} className="w-32 h-10 rounded-md border px-2 text-right text-[15px] font-semibold outline-none focus:ring-2" style={{ background: theme.inputBg, borderColor: theme.border, color: theme.text }} onFocus={focusStyle} onBlur={blurStyle} /></div>
                  <div className="flex items-center justify-between mt-3"><span className="text-[14px] font-medium" style={{ color: theme.muted }}>Reste à payer</span><span className="text-[15px] font-bold" style={{ color: theme.red }}>{formatMoney(resteAPayer)}</span></div>
                  <div className="flex items-center justify-between mt-4"><span className="text-[14px] font-medium" style={{ color: theme.muted }}>Statut</span><span className="inline-flex items-center rounded-full border px-3 py-1 text-[13px] font-semibold" style={{ color: statutConfig.color, background: statutConfig.bg, borderColor: statutConfig.border }}>{statutPaiement}</span></div>
                </div>
                <div className="flex items-center justify-between rounded-xl border px-5 py-4 shadow-sm" style={{ background: theme.primaryBg, borderColor: theme.primary }}><span className="text-[16px] font-bold" style={{ color: theme.primary }}>Total TTC</span><span className="text-[22px] font-black tracking-tight" style={{ color: theme.primary }}>{formatMoney(totalTTC)}</span></div>
                <input type="hidden" name="details_tva_rates" value={JSON.stringify(safeSelectedProduits.map(item => ({ id: item.id, quantite: item.quantite, tva_rate: internalTvaOverride !== null ? internalTvaOverride : (produits.find(p => p.id === item.id)?.tva_rate ?? 0.2) })))} />
                <input type="hidden" name="montant_paye" value={internalMontantPaye} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-[14px] font-medium hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" style={{ color: theme.muted }}>Annuler</button>
            <button type="submit" className="px-5 py-2.5 rounded-lg text-[14px] font-semibold text-white shadow-md transition-transform active:scale-[0.98] hover:shadow-lg" style={{ background: theme.primary }}><CheckCircle size={15} className="inline mr-1" />{editingAchat ? 'Enregistrer' : 'Valider'}</button>
          </div>
        </form>
      </div>
    </div>, document.body
  );
};

export default AchatsModalForm;