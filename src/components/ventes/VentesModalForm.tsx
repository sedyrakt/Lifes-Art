// src/components/ventes/VentesModalForm.tsx
// ⭐ FIX: DEVIS tsy mampiseho Mode paiement / Modalité / Frais livraison

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, CheckCircle, ChevronDown, Search, User, Check, Calendar,
  CreditCard, Clock, Truck, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import VentesProductSelector from './VentesProductSelector';

const COLORS = {
  light: {
    card: '#FFFFFF', border: '#E2E8F0', headerBg: '#FFFFFF', inputBg: '#FFFFFF', softBg: '#F8FAFC',
    text: '#0F172A', muted: '#64748B', subMuted: '#94A3B8', primary: '#4F46E5', primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,0.06)', green: '#059669', red: '#DC2626', amber: '#D97706'
  },
  dark: {
    card: '#0F172A',
    border: 'rgba(255,255,255,0.12)',
    headerBg: '#0F172A',
    inputBg: '#0F172A',
    softBg: '#0F172A',
    text: '#F8FAFC', muted: '#94A3B8', subMuted: '#94A3B8',
    primary: '#4F46E5', primaryHover: '#4338CA', primaryBg: 'rgba(79,70,229,0.12)',
    green: '#34D399', red: '#F87171', amber: '#FBBF24'
  }
};

interface Client { id: number; nom: string; email: string; telephone: string; adresse: string; }
interface Produit { id: number; nom: string; code: string; prix_vente: number; quantite_stock: number; unite?: string; tva_rate?: number; }
interface SelectedProduct { id: number; quantite: number; prix_unitaire: number; total: number; tva_rate?: number; }

interface VentesModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  type: 'devis' | 'factures';
  clients: Client[];
  produits: Produit[];
  selectedClientId: number | null;
  onClientChange: (id: number | null) => void;
  selectedProduits: SelectedProduct[];
  onAddProduit: (id: number, quantite: number, prix_unitaire: number, tva_rate?: number) => void;
  onUpdateQuantite: (id: number, quantite: number) => void;
  onRemoveProduit: (id: number) => void;
  onClearPanier: () => void;
  formData: any;
  setFormData: (data: any) => void;
  montantPaye?: number;
  onMontantPayeChange?: (value: number) => void;
  isDark?: boolean;
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

const VentesModalForm: React.FC<VentesModalFormProps> = ({
  isOpen, onClose, onSubmit, type, clients, produits, selectedClientId, onClientChange,
  selectedProduits, onAddProduit, onUpdateQuantite, onRemoveProduit, onClearPanier,
  formData, setFormData, montantPaye = 0, onMontantPayeChange, isDark: propIsDark,
}) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;
  const formRef = useRef<HTMLFormElement>(null);

  // ⭐⭐⭐ FIX: Boolean mazava tsara — tsy miankina amin'ny string comparison
  const isFacture = String(type) === 'factures';
  const isDevis = !isFacture;

  // ⭐ DEBUG (azonao esorina rehefa vita)
  console.log('[VentesModalForm] type =', type, '| isFacture =', isFacture, '| isDevis =', isDevis);

  const [internalMontantPaye, setInternalMontantPaye] = useState(montantPaye);
  const [clientSearch, setClientSearch] = useState('');
  const [clientOpen, setClientOpen] = useState(false);
  const [validiteInput, setValiditeInput] = useState<string>('30');

  // ⭐ Mode/modalité/frais — valeur par défaut 0 foana
  const [modePaiement, setModePaiement] = useState('Espèces');
  const [modaliteValue, setModaliteValue] = useState<number>(0);
  const [modaliteUnit, setModaliteUnit] = useState('jours');
  const [fraisLivraison, setFraisLivraison] = useState<number>(0);

  const safeSelectedProduits = useMemo(() => Array.isArray(selectedProduits) ? selectedProduits : [], [selectedProduits]);

  // ⭐ Kajy
  const totalHTProduits = useMemo(() => safeSelectedProduits.reduce((sum, item) => {
    const product = produits.find((p) => p.id === item.id);
    return product ? sum + product.prix_vente * item.quantite : sum;
  }, 0), [produits, safeSelectedProduits]);

  const totalTVA = useMemo(() => {
    return safeSelectedProduits.reduce((sum, item) => {
      const product = produits.find((p) => p.id === item.id);
      const rate = (product?.tva_rate !== undefined && product?.tva_rate !== null && product?.tva_rate !== '')
        ? Number(product.tva_rate) : 0.2;
      const lineTotal = (Number(product?.prix_vente) || 0) * (Number(item.quantite) || 0);
      return sum + (lineTotal * rate);
    }, 0);
  }, [produits, safeSelectedProduits]);

  // ⭐ Frais livraison ihany raha FACTURE
  const fraisLivraisonApplied = isFacture ? Number(fraisLivraison || 0) : 0;
  const totalHT = totalHTProduits + fraisLivraisonApplied;
  const totalTTC = totalHT + totalTVA;

  const montantPayeSafe = Math.max(0, Math.min(Number(internalMontantPaye) || 0, totalTTC));
  const resteAPayer = Math.max(0, totalTTC - montantPayeSafe);
  const statutPaiement = montantPayeSafe <= 0 ? 'Non payé' : montantPayeSafe >= totalTTC ? 'Payé' : 'Partiel';

  const statutConfig = statutPaiement === 'Payé'
    ? { color: theme.green, bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' }
    : statutPaiement === 'Partiel'
      ? { color: theme.amber, bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' }
      : { color: theme.red, bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' };

  const tauxTVA = useMemo(() => {
    const tauxSet = new Set(safeSelectedProduits.map(item => {
      const produit = produits.find(p => p.id === item.id);
      const rate = (produit?.tva_rate !== undefined && produit?.tva_rate !== null && produit?.tva_rate !== '')
        ? Number(produit.tva_rate) : 0.2;
      return rate;
    }));
    return Array.from(tauxSet).map(t => `${(t * 100).toFixed(0)}%`).join(' / ');
  }, [produits, safeSelectedProduits]);

  const modalitePaiement = modaliteValue > 0 ? `${modaliteValue} ${modaliteUnit}` : 'Immediat';
  const modaliteMessage = modaliteValue > 0
    ? `Paiement dans ${modaliteValue} ${modaliteUnit}.`
    : 'Paiement Immédiat';

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 50);
    const q = clientSearch.toLowerCase();
    return clients.filter(c => c.nom?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.telephone?.toLowerCase().includes(q)).slice(0, 50);
  }, [clients, clientSearch]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const hasClient = selectedClientId !== null;
  const hasProduct = safeSelectedProduits.length > 0;
  const isDeliveryEnabled = isFacture && hasClient && hasProduct;

  // ⭐ Reset rehefa misokatra
  useEffect(() => {
    if (!isOpen) return;
    setInternalMontantPaye(montantPaye);
    setClientSearch('');
    setClientOpen(false);
    const v = Number(formData?.validite_jours);
    setValiditeInput(Number.isFinite(v) && v > 0 ? String(v) : '30');

    // ⭐ Reset mode/modalité/frais — valeur par défaut 0 foana, avadika amin'ny formData raha misy
    if (isFacture) {
      setModePaiement(formData?.mode_paiement || 'Espèces');
      const mv = Number(formData?.modalite_value);
      setModaliteValue(Number.isFinite(mv) && mv > 0 ? mv : 0);
      setModaliteUnit(formData?.modalite_unit || 'jours');
      setFraisLivraison(Number(formData?.frais_livraison) || 0);
    } else {
      // ⭐ DEVIS : reset foana
      setModePaiement('Espèces');
      setModaliteValue(0);
      setModaliteUnit('jours');
      setFraisLivraison(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isFacture, montantPaye, formData?.validite_jours]);

  // ⭐ Sync mode/modalité/frais → formData
  useEffect(() => {
    if (!isOpen) return;
    if (isFacture) {
      setFormData(prev => ({
        ...prev,
        mode_paiement: modePaiement,
        modalite_value: modaliteValue,
        modalite_unit: modaliteUnit,
        modalite_paiement: modalitePaiement,
        frais_livraison: fraisLivraison,
      }));
    } else {
      // ⭐ DEVIS : esorina daholo
      setFormData(prev => ({
        ...prev,
        mode_paiement: undefined,
        modalite_value: 0,
        modalite_unit: undefined,
        modalite_paiement: undefined,
        frais_livraison: 0,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modePaiement, modaliteValue, modaliteUnit, fraisLivraison, isOpen, isFacture]);

  // ⭐ Clamp montant payé
  useEffect(() => {
    if (!isOpen) return;
    if (internalMontantPaye > totalTTC) {
      const clamped = Math.max(0, totalTTC);
      setInternalMontantPaye(clamped);
      onMontantPayeChange?.(clamped);
    }
  }, [totalTTC, isOpen, internalMontantPaye, onMontantPayeChange]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); formRef.current?.requestSubmit(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const inputClass = `h-11 w-full rounded-lg border px-3.5 text-[15px] font-medium outline-none focus:ring-2`;
  const inputStyle = { background: theme.inputBg, borderColor: theme.border, color: theme.text };
  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = theme.primary;
    e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.primaryBg}`;
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = theme.border;
    e.currentTarget.style.boxShadow = 'none';
  };
  const formatMoney = (value: number) => `${Number(value || 0).toLocaleString('fr-FR')} Ar`;

  const deliveryInputStyle = !isDeliveryEnabled
    ? { ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }
    : { ...inputStyle, borderColor: theme.primary, boxShadow: `0 0 0 3px ${theme.primaryBg}` };

  const deliveryHelper = (() => {
    if (isDeliveryEnabled && fraisLivraison > 0) return { text: `Livraison activée — ${formatMoney(fraisLivraison)} ajouté au total`, color: theme.green, icon: 'check' as const };
    if (isDeliveryEnabled) return { text: 'Livraison non activée — saisissez des frais si applicable', color: theme.muted, icon: 'alert' as const };
    if (!hasClient && !hasProduct) return { text: 'Sélectionnez un client et ajoutez un produit pour activer', color: theme.muted, icon: 'alert' as const };
    if (!hasClient) return { text: 'Sélectionnez d\'abord un client', color: theme.amber, icon: 'alert' as const };
    return { text: 'Ajoutez au moins un produit au panier', color: theme.amber, icon: 'alert' as const };
  })();

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }} role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-4xl flex max-h-[90vh] flex-col overflow-hidden rounded-2xl border shadow-2xl" style={{ background: theme.card, borderColor: theme.border }} onMouseDown={(e) => e.stopPropagation()}>

        <div className="absolute left-0 right-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryHover})` }} />

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.border, background: theme.headerBg }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: theme.primaryBg }}>
              <User size={20} style={{ color: theme.primary }} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: theme.text }}>
                {isFacture ? 'Nouvelle facture' : 'Nouveau devis'}
              </h2>
              <p className="text-[13.5px]" style={{ color: theme.muted }}>Créer un document de vente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}><X size={20} /></button>
        </div>

        <form ref={formRef} onSubmit={onSubmit} className="flex min-h-0 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto p-6" style={{ background: theme.card }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

              {/* ═══ GAUCHE : Client + Validité + Produits ═══ */}
              <div className="space-y-4">
                <FormField label="Client" required>
                  <div className="relative">
                    <button type="button" onClick={() => setClientOpen(!clientOpen)} className={`${inputClass} flex items-center justify-between text-left cursor-pointer`} style={inputStyle}>
                      <span className="truncate flex items-center gap-2">
                        <User size={16} style={{ color: theme.muted }} />
                        {selectedClient ? selectedClient.nom : 'Sélectionner un client'}
                      </span>
                      <ChevronDown size={17} className={`ml-2 shrink-0 transition-transform ${clientOpen ? 'rotate-180' : ''}`} style={{ color: theme.muted }} />
                    </button>

                    {clientOpen && (
                      <div className="absolute left-0 right-0 z-[999] mt-1.5 max-h-56 overflow-y-auto rounded-lg border shadow-xl" style={{ borderColor: theme.border, background: theme.card }} onMouseDown={(e) => e.preventDefault()}>
                        <div className="p-2 border-b sticky top-0" style={{ borderColor: theme.border, background: theme.card }}>
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.muted }} />
                            <input autoFocus value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Rechercher..." className={`w-full h-11 rounded-md pl-10 pr-3.5 text-[15px] outline-none border`} style={inputStyle} />
                          </div>
                        </div>
                        <div className="py-1">
                          {filteredClients.length === 0 ? <div className="px-4 py-3 text-[15px]" style={{ color: theme.muted }}>Aucun client trouvé</div> : filteredClients.map(c => (
                            <button key={c.id} type="button" onClick={() => { onClientChange(c.id); setClientOpen(false); setClientSearch(''); }} className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5" style={{ color: theme.text }}>
                              <div className="min-w-0 flex-1">
                                <p className="text-[15px] font-semibold truncate">{c.nom}</p>
                                <p className="text-[13px] truncate" style={{ color: theme.muted }}>{c.telephone} · {c.email}</p>
                              </div>
                              {c.id === selectedClientId && <Check size={17} style={{ color: theme.primary }} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </FormField>

                {/* ⭐ Validité : DEVIS IHANY */}
                {isDevis && (
                  <FormField label="Validité (jours)">
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: theme.muted }} />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={validiteInput}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '');
                          setValiditeInput(raw);
                          if (raw !== '' && Number(raw) > 0) setFormData({ ...formData, validite_jours: Number(raw) });
                        }}
                        onBlur={() => {
                          let safe = Number(validiteInput);
                          if (!Number.isFinite(safe) || safe <= 0) safe = 30;
                          safe = Math.max(1, Math.min(365, safe));
                          setValiditeInput(String(safe));
                          setFormData({ ...formData, validite_jours: safe });
                        }}
                        onFocus={focusStyle}
                        placeholder="30"
                        className={`${inputClass} pl-10`}
                        style={inputStyle}
                      />
                    </div>
                    <p className="mt-1.5 text-[13px]" style={{ color: theme.muted }}>
                      Le devis sera valable <strong style={{ color: theme.primary }}>{Number(validiteInput) > 0 ? Number(validiteInput) : 30} jour{(Number(validiteInput) || 30) > 1 ? 's' : ''}</strong> à compter de sa date d'émission.
                    </p>
                  </FormField>
                )}

                <div className="overflow-hidden rounded-xl border h-[380px]" style={{ borderColor: theme.border, background: theme.card }}>
                  <VentesProductSelector produits={produits} selectedProduits={safeSelectedProduits} onAddProduit={onAddProduit} onUpdateQuantite={onUpdateQuantite} onRemoveProduit={onRemoveProduit} onClearPanier={onClearPanier} isDark={isDark} />
                </div>
              </div>

              {/* ═══ DROITE : Totaux + Paiement ═══ */}
              <div className="space-y-4">
                <div className="rounded-xl border p-5 space-y-3.5" style={{ borderColor: theme.border, background: theme.softBg }}>

                  {/* HT / TVA */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] uppercase tracking-wide font-medium" style={{ color: theme.muted }}>Total HT</span>
                      <span className="text-[18px] font-bold mt-1" style={{ color: theme.text }}>{formatMoney(totalHT)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] uppercase tracking-wide font-medium" style={{ color: theme.muted }}>TVA ({tauxTVA || '20%'})</span>
                      <span className="text-[18px] font-bold mt-1" style={{ color: theme.text }}>{formatMoney(totalTVA)}</span>
                    </div>
                  </div>

                  {/* ⭐ Sections : FACTURE IHANY */}
                  {isFacture && (
                    <>
                      <div className="h-px" style={{ background: theme.border }} />

                      {/* Mode de paiement */}
                      <div>
                        <label className="text-[14px] font-medium" style={{ color: theme.muted }}>Mode de paiement</label>
                        <div className="relative mt-1">
                          <CreditCard size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.primary }} />
                          <select
                            value={modePaiement}
                            onChange={(e) => setModePaiement(e.target.value)}
                            className={`${inputClass} appearance-none cursor-pointer pl-10 pr-9`}
                            style={inputStyle}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                          >
                            <option value="Espèces">Espèces</option>
                            <option value="Virement">Virement</option>
                            <option value="Chèque">Chèque</option>
                            <option value="Mobile Money">Mobile Money</option>
                            <option value="Carte">Carte</option>
                          </select>
                          <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>

                      {/* Modalité */}
                      <div>
                        <label className="text-[14px] font-medium" style={{ color: theme.muted }}>Modalité de paiement</label>
                        <div className="mt-1 flex w-full flex-row items-center gap-2">
                          <div className="relative flex-1 min-w-0">
                            <Clock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.primary }} />
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={modaliteValue}
                              onChange={(e) => setModaliteValue(Number(e.target.value) || 0)}
                              className="h-11 w-full rounded-lg border px-3 pl-10 text-[15px] font-medium outline-none transition-all focus:ring-2"
                              style={{ ...inputStyle, MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none' }}
                              onFocus={focusStyle}
                              onBlur={blurStyle}
                            />
                          </div>
                          <select
                            value={modaliteUnit}
                            onChange={(e) => setModaliteUnit(e.target.value)}
                            className="h-11 w-[80px] shrink-0 cursor-pointer appearance-none rounded-lg border px-2.5 pr-5 text-[14px] font-medium outline-none transition-all focus:ring-2"
                            style={inputStyle}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                          >
                            <option value="minutes">min</option>
                            <option value="heures">h</option>
                            <option value="jours">jours</option>
                            <option value="mois">mois</option>
                            <option value="annees">ans</option>
                          </select>
                        </div>
                        <p className="text-[13px] mt-1 font-medium" style={{ color: theme.green }}>{modaliteMessage}</p>
                      </div>

                      {/* Frais livraison */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="flex items-center gap-1.5 text-[14px] font-medium" style={{ color: isDeliveryEnabled ? theme.text : theme.muted }}>
                            Frais de livraison (Ar)
                            {!isDeliveryEnabled && (
                              <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                style={{ borderColor: 'rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.10)', color: theme.amber }}>
                                <AlertCircle size={11} /> Requis
                              </span>
                            )}
                            {isDeliveryEnabled && fraisLivraison > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                style={{ borderColor: 'rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.10)', color: theme.green }}>
                                <CheckCircle2 size={11} /> Livraison : Oui
                              </span>
                            )}
                            {isDeliveryEnabled && fraisLivraison <= 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                style={{ borderColor: 'rgba(100,116,139,0.35)', background: 'rgba(100,116,139,0.08)', color: theme.muted }}>
                                <AlertCircle size={11} /> Livraison : Non
                              </span>
                            )}
                          </label>
                        </div>

                        <div className="relative mt-1">
                          <Truck size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDeliveryEnabled ? theme.primary : theme.subMuted }} />
                          <input
                            type="number"
                            min="0"
                            step="100"
                            placeholder={isDeliveryEnabled ? 'Ex: 5000' : '—'}
                            value={isDeliveryEnabled ? fraisLivraison : ''}
                            onChange={(e) => setFraisLivraison(Number(e.target.value) || 0)}
                            className={`${inputClass} pl-10`}
                            style={deliveryInputStyle}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                            disabled={!isDeliveryEnabled}
                          />
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-[12px] font-medium" style={{ color: deliveryHelper.color }}>
                          {deliveryHelper.icon === 'check' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {deliveryHelper.text}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="h-px" style={{ background: theme.border }} />

                  {/* Montant payé */}
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-medium" style={{ color: theme.muted }}>Montant payé</span>
                    <input
                      type="number"
                      min="0"
                      max={totalTTC}
                      step="1"
                      value={internalMontantPaye}
                      onChange={(e) => {
                        const raw = Number(e.target.value) || 0;
                        const val = Math.max(0, Math.min(raw, totalTTC));
                        setInternalMontantPaye(val);
                        onMontantPayeChange?.(val);
                      }}
                      className="w-36 h-11 rounded-md border px-3 text-right text-[15.5px] font-semibold outline-none focus:ring-2"
                      style={{ background: theme.inputBg, borderColor: theme.border, color: theme.text }}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                  </div>

                  {/* Reste */}
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-medium" style={{ color: theme.muted }}>Reste à payer</span>
                    <span className="text-[15.5px] font-bold" style={{ color: theme.red }}>{formatMoney(resteAPayer)}</span>
                  </div>

                  {/* Statut */}
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-medium" style={{ color: theme.muted }}>Statut</span>
                    <span className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold" style={{ color: statutConfig.color, background: statutConfig.bg, borderColor: statutConfig.border }}>{statutPaiement}</span>
                  </div>
                </div>

                {/* Total TTC */}
                <div className="flex items-center justify-between rounded-xl border px-5 py-4 shadow-sm" style={{ background: theme.primaryBg, borderColor: theme.primary }}>
                  <span className="text-[17px] font-bold" style={{ color: theme.primary }}>Total TTC</span>
                  <span className="text-[23px] font-black tracking-tight" style={{ color: theme.primary }}>{formatMoney(totalTTC)}</span>
                </div>

                {/* Hidden inputs */}
                {isFacture && (
                  <>
                    <input type="hidden" name="mode_paiement" value={modePaiement} />
                    <input type="hidden" name="modalite_paiement" value={modalitePaiement} />
                    <input type="hidden" name="frais_livraison" value={isDeliveryEnabled ? fraisLivraison : 0} />
                  </>
                )}
                <input type="hidden" name="details_tva_rates" value={JSON.stringify(safeSelectedProduits.map(item => ({
                  id: item.id, quantite: item.quantite, tva_rate: produits.find(p => p.id === item.id)?.tva_rate ?? 0.2
                })))} />
                <input type="hidden" name="montant_paye" value={internalMontantPaye} />
                {isDevis && <input type="hidden" name="validite_jours" value={Number(validiteInput) > 0 ? Number(validiteInput) : 30} />}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 px-6 py-5 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
            <button onClick={onClose} className="px-5 py-3 rounded-lg text-[15px] font-medium hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" style={{ color: theme.muted }}>Annuler</button>
            <button type="submit" className="px-5 py-3 rounded-lg text-[15px] font-semibold text-white shadow-md transition-transform active:scale-[0.98] hover:shadow-lg" style={{ background: theme.primary }}>
              <CheckCircle size={17} className="inline mr-1.5" />{isFacture ? 'Valider la facture' : 'Valider le devis'}
            </button>
          </div>
        </form>
      </div>
    </div>, document.body
  );
};

export default VentesModalForm;