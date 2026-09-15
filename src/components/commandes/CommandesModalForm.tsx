// src/components/commandes/CommandesModalForm.tsx
// ⭐ REFACTOR: Nizara ho components ny CommandesModalForm
// ⭐ TSY MISY niova ny logique — fizarana fotsiny
// ⭐ FONT SIZE: inputs 15.5px, h-11, Total TTC 20.5px (+0.5px)
// ⭐ FIX: setInternalMontagePaye → setInternalMontantPaye

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import CommandesProductSelector from './CommandesProductSelector';
import {
  COLORS,
  formatMoney,
  type Client,
  type Produit,
  type SelectedProduct,
} from './CommandesModalForm/CommandesModalConstants';
import { FormField } from './CommandesModalForm/FormField';
import { ClientSelector } from './CommandesModalForm/ClientSelector';
import { CommandesModalHeader } from './CommandesModalForm/CommandesModalHeader';
import { CommandesModalFooter } from './CommandesModalForm/CommandesModalFooter';
import { CommandesTotalsCard } from './CommandesModalForm/CommandesTotalsCard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  clients?: Client[];
  produits?: Produit[];
  selectedClientId: number | null;
  onClientChange: (id: number | null) => void;
  selectedProduits?: SelectedProduct[];
  onAddProduit: (id: number, quantite: number, tva_rate?: number) => void;
  onUpdateQuantite: (id: number, quantite: number) => void;
  onRemoveProduit: (id: number) => void;
  onClearPanier: () => void;
  isDark?: boolean;
  montantPaye?: number;
  onMontantPayeChange?: (value: number) => void;
}

const CommandesModalForm: React.FC<Props> = ({
  isOpen, onClose, onSubmit, clients, produits, selectedClientId, onClientChange,
  selectedProduits, onAddProduit, onUpdateQuantite, onRemoveProduit, onClearPanier,
  isDark: propIsDark, montantPaye = 0, onMontantPayeChange,
}) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;
  const formRef = useRef<HTMLFormElement>(null);

  const [internalMontantPaye, setInternalMontantPaye] = useState(montantPaye);
  const [modePaiement, setModePaiement] = useState('Espèces');
  const [modaliteValue, setModaliteValue] = useState<number>(0);
  const [modaliteUnit, setModaliteUnit] = useState('jours');
  const [fraisLivraison, setFraisLivraison] = useState<number>(0);

  const modalitePaiement = modaliteValue > 0 ? `${modaliteValue} ${modaliteUnit}` : 'Immediat';
  const modaliteMessage = modaliteValue > 0
    ? `Paiement dans ${modaliteValue} ${modaliteUnit}.`
    : 'Paiement Immédiat';

  const safeClients = Array.isArray(clients) ? clients : [];
  const safeProduits = Array.isArray(produits) ? produits : [];
  const safeSelectedProduits = Array.isArray(selectedProduits) ? selectedProduits : [];

  const topBorderBg = isDark ? `linear-gradient(90deg, ${theme.primary}, #3b82f6)` : '#4F46E5';

  // ═══════════ Calculs ═══════════
  const totalHTProduits = useMemo(() => safeSelectedProduits.reduce((sum, item) => {
    const product = safeProduits.find((p) => p.id === item.id);
    return product ? sum + (Number(product.prix_vente) || 0) * (Number(item.quantite) || 0) : sum;
  }, 0), [safeProduits, safeSelectedProduits]);

  const totalTVA = useMemo(() => {
    return safeSelectedProduits.reduce((sum, item) => {
      const product = safeProduits.find((p) => p.id === item.id);
      const rate = (product?.tva_rate !== undefined && product?.tva_rate !== null && product?.tva_rate !== '')
        ? Number(product.tva_rate) : 0;
      const lineTotal = (Number(product?.prix_vente) || 0) * (Number(item.quantite) || 0);
      return sum + (lineTotal * rate);
    }, 0);
  }, [safeProduits, safeSelectedProduits]);

  const totalHT = totalHTProduits + Number(fraisLivraison || 0);
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
      const produit = safeProduits.find(p => p.id === item.id);
      const rate = (produit?.tva_rate !== undefined && produit?.tva_rate !== null && produit?.tva_rate !== '')
        ? Number(produit.tva_rate) : 0;
      return rate;
    }));
    return Array.from(tauxSet).map(t => `${(t * 100).toFixed(0)}%`).join(' / ');
  }, [safeProduits, safeSelectedProduits]);

  const hasClient = selectedClientId !== null;
  const hasProduct = safeSelectedProduits.length > 0;
  const isDeliveryEnabled = hasClient && hasProduct;

  // ═══════════ Refs ho fanaraha-maso ny state TALOHA ═══════════
  const wasOpenRef = useRef(false);
  const prevTotalTTCRef = useRef(totalTTC);

  // ⭐ Reset form rehefa MISOKATRA
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setInternalMontantPaye(montantPaye);
      setFraisLivraison(0);
      setModaliteValue(0);
      setModaliteUnit('jours');
      prevTotalTTCRef.current = 0;
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
    }
  }, [isOpen, montantPaye]);

  // ⭐ Clamp montantPaye rehefa miova totalTTC
  useEffect(() => {
    if (!isOpen) return;
    if (prevTotalTTCRef.current !== totalTTC) {
      prevTotalTTCRef.current = totalTTC;
      if (internalMontantPaye > totalTTC) {
        const clamped = Math.max(0, totalTTC);
        setInternalMontantPaye(clamped);
        onMontantPayeChange?.(clamped);
      }
    }
  }, [totalTTC, isOpen, internalMontantPaye, onMontantPayeChange]);

  // ⭐ Escape + Ctrl+Enter
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

  // ═══════════ Styles ═══════════
  // ⭐ Inputs : h-11, text-[15.5px] (+0.5px), px-3.5
  const inputClass = `h-11 w-full rounded-lg border px-3.5 text-[15.5px] font-medium outline-none transition-all focus:ring-2 dark:placeholder-gray-500`;
  const inputStyle = { background: theme.inputBg, borderColor: theme.border, color: theme.text };
  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = theme.primary;
    e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.primaryBg}`;
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = theme.border;
    e.currentTarget.style.boxShadow = 'none';
  };

  const deliveryInputStyle = !isDeliveryEnabled
    ? { ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }
    : { ...inputStyle, borderColor: theme.primary, boxShadow: `0 0 0 3px ${theme.primaryBg}`, transition: 'all 0.3s ease' };

  const deliveryHelper = (() => {
    if (isDeliveryEnabled && fraisLivraison > 0) {
      return { text: `Livraison activée — ${formatMoney(fraisLivraison)} ajouté au total`, color: theme.green, icon: 'check' as const };
    }
    if (isDeliveryEnabled) {
      return { text: 'Livraison non activée — saisissez des frais si applicable', color: theme.muted, icon: 'alert' as const };
    }
    if (!hasClient && !hasProduct) return { text: 'Sélectionnez un client et ajoutez un produit pour activer', color: theme.muted, icon: 'alert' as const };
    if (!hasClient) return { text: 'Sélectionnez d\'abord un client', color: theme.amber, icon: 'alert' as const };
    return { text: 'Ajoutez au moins un produit au panier', color: theme.amber, icon: 'alert' as const };
  })();

  // ═══════════ Modal ═══════════
  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-4xl flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[3px]" style={{ background: topBorderBg }} />

        {/* HEADER */}
        <CommandesModalHeader onClose={onClose} />

        {/* BODY */}
        <form ref={formRef} onSubmit={onSubmit} className="flex min-h-0 flex-col">
          {/* ⭐ Body padding : p-5 */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            {/* ⭐ Grid gap : gap-5 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

              {/* ═══ Colonne gauche : Client + Produits ═══ */}
              <div className="space-y-4">
                <FormField label="Client" required>
                  <ClientSelector
                    clients={safeClients}
                    selectedClientId={selectedClientId}
                    onClientChange={onClientChange}
                    inputClass={inputClass}
                    inputStyle={inputStyle}
                  />
                </FormField>

                {/* ⭐ Height : h-[320px] */}
                <div className="overflow-hidden rounded-xl border h-[320px]" style={{ borderColor: theme.border, background: theme.card }}>
                  <CommandesProductSelector
                    produits={safeProduits}
                    selectedProduits={safeSelectedProduits}
                    onAddProduit={onAddProduit}
                    onUpdateQuantite={onUpdateQuantite}
                    onRemoveProduit={onRemoveProduit}
                    onClearPanier={onClearPanier}
                    isDark={isDark}
                  />
                </div>
              </div>

              {/* ═══ Colonne droite : Totaux + Paiement ═══ */}
              <div className="space-y-4">
                <CommandesTotalsCard
                  totalHT={totalHT}
                  totalTVA={totalTVA}
                  totalTTC={totalTTC}
                  tauxTVA={tauxTVA}
                  modePaiement={modePaiement}
                  setModePaiement={setModePaiement}
                  modaliteValue={modaliteValue}
                  setModaliteValue={setModaliteValue}
                  modaliteUnit={modaliteUnit}
                  setModaliteUnit={setModaliteUnit}
                  modaliteMessage={modaliteMessage}
                  fraisLivraison={fraisLivraison}
                  setFraisLivraison={setFraisLivraison}
                  isDeliveryEnabled={isDeliveryEnabled}
                  hasClient={hasClient}
                  hasProduct={hasProduct}
                  deliveryInputStyle={deliveryInputStyle}
                  deliveryHelper={deliveryHelper}
                  internalMontantPaye={internalMontantPaye}
                  setInternalMontantPaye={setInternalMontantPaye}
                  onMontantPayeChange={onMontantPayeChange}
                  resteAPayer={resteAPayer}
                  statutPaiement={statutPaiement}
                  statutConfig={statutConfig}
                  inputClass={inputClass}
                  inputStyle={inputStyle}
                  focusStyle={focusStyle}
                  blurStyle={blurStyle}
                />

                {/* Total TTC — ⭐ fontSize +0.5px (15px → 15.5px, 20px → 20.5px) */}
                <div className="flex items-center justify-between rounded-xl border px-4 py-3 shadow-sm" style={{ background: theme.primaryBg, borderColor: theme.primary }}>
                  <span className="text-[15.5px] font-bold" style={{ color: theme.primary }}>Total TTC</span>
                  <span className="text-[20.5px] font-black tracking-tight" style={{ color: theme.primary }}>{formatMoney(totalTTC)}</span>
                </div>

                {/* Hidden inputs */}
                <input type="hidden" name="mode_paiement" value={modePaiement} />
                <input type="hidden" name="modalite_paiement" value={modalitePaiement} />
                <input type="hidden" name="frais_livraison" value={isDeliveryEnabled ? fraisLivraison : 0} />
                <input type="hidden" name="livraison" value={isDeliveryEnabled && fraisLivraison > 0 ? 'Oui' : 'Non'} />
                <input type="hidden" name="details_tva_rates" value={JSON.stringify(safeSelectedProduits.map(item => ({
                  id: item.id, quantite: item.quantite, tva_rate: safeProduits.find(p => p.id === item.id)?.tva_rate ?? 0
                })))} />
                <input type="hidden" name="montant_paye" value={internalMontantPaye} />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <CommandesModalFooter onClose={onClose} />
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default CommandesModalForm;