// src/components/commandes/CommandesModalForm/CommandesTotalsCard.tsx
// ⭐ FONT SIZE: +0.5px (labels 13px, values 15.5px, helpers 11-11.5px, badges 10px)

import React from 'react';
import {
  CreditCard, Clock, Truck, AlertCircle, CheckCircle2, ChevronDown,
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { COLORS, formatMoney } from './CommandesModalConstants';

interface CommandesTotalsCardProps {
  // Totaux
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  tauxTVA: string;

  // Paiement
  modePaiement: string;
  setModePaiement: (v: string) => void;
  modaliteValue: number;
  setModaliteValue: (v: number) => void;
  modaliteUnit: string;
  setModaliteUnit: (v: string) => void;
  modaliteMessage: string;

  // Livraison
  fraisLivraison: number;
  setFraisLivraison: (v: number) => void;
  isDeliveryEnabled: boolean;
  hasClient: boolean;
  hasProduct: boolean;
  deliveryInputStyle: React.CSSProperties;
  deliveryHelper: { text: string; color: string; icon: 'check' | 'alert' };

  // Montant payé
  internalMontantPaye: number;
  setInternalMontantPaye: (v: number) => void;
  onMontantPayeChange?: (v: number) => void;
  resteAPayer: number;
  statutPaiement: string;
  statutConfig: { color: string; bg: string; border: string };

  // Styles
  inputClass: string;
  inputStyle: React.CSSProperties;
  focusStyle: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  blurStyle: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const CommandesTotalsCard: React.FC<CommandesTotalsCardProps> = ({
  totalHT, totalTVA, totalTTC, tauxTVA,
  modePaiement, setModePaiement,
  modaliteValue, setModaliteValue,
  modaliteUnit, setModaliteUnit,
  modaliteMessage,
  fraisLivraison, setFraisLivraison,
  isDeliveryEnabled, hasClient, hasProduct,
  deliveryInputStyle, deliveryHelper,
  internalMontantPaye, setInternalMontantPaye, onMontantPayeChange,
  resteAPayer, statutPaiement, statutConfig,
  inputClass, inputStyle, focusStyle, blurStyle,
}) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;

  return (
    /* ⭐ Padding : p-3.5 → p-4 */
    <div className="rounded-xl border p-4" style={{ borderColor: theme.border, background: theme.softBg }}>
      {/* HT / TVA */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          {/* ⭐ Label : 11.5px → 12px */}
          <span className="text-[12px] uppercase tracking-wide font-medium" style={{ color: theme.muted }}>Total HT</span>
          {/* ⭐ Value : 15px → 15.5px */}
          <span className="text-[15.5px] font-bold mt-0.5" style={{ color: theme.text }}>{formatMoney(totalHT)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[12px] uppercase tracking-wide font-medium" style={{ color: theme.muted }}>TVA ({tauxTVA || '0%'})</span>
          <span className="text-[15.5px] font-bold mt-0.5" style={{ color: theme.text }}>{formatMoney(totalTVA)}</span>
        </div>
      </div>

      <div className="my-3 h-px" style={{ background: theme.border }} />

      {/* Mode de paiement */}
      <div className="mb-3">
        {/* ⭐ Label : 12.5px → 13px */}
        <label className="text-[13px] font-medium" style={{ color: theme.muted }}>Mode de paiement</label>
        <div className="relative mt-1">
          {/* ⭐ Icon : 13 → 14 */}
          <CreditCard size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
          <select
            value={modePaiement}
            onChange={(e) => setModePaiement(e.target.value)}
            className={`${inputClass} appearance-none cursor-pointer pl-9 pr-8`}
            style={inputStyle}
          >
            <option value="Espèces">Espèces</option>
            <option value="Virement">Virement</option>
            <option value="Chèque">Chèque</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Carte">Carte</option>
          </select>
          {/* ⭐ Chevron : 13 → 14 */}
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Modalité de paiement */}
      <div className="mb-3">
        <label className="text-[13px] font-medium" style={{ color: theme.muted }}>Modalité de paiement</label>
        <div className="mt-1 flex w-full flex-row items-center gap-2">
          <div className="relative flex-1 min-w-0">
            {/* ⭐ Icon : 13 → 14 */}
            <Clock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
            {/* ⭐ Input : h-9 → h-10, text-[13px] → text-[13.5px] */}
            <input
              type="number"
              min="0"
              placeholder="0"
              value={modaliteValue}
              onChange={(e) => setModaliteValue(Number(e.target.value) || 0)}
              className="h-10 w-full rounded-lg border px-3 pl-9 text-[13.5px] font-medium outline-none transition-all focus:ring-2 dark:placeholder-gray-500"
              style={{ ...inputStyle, MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none' }}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
          {/* ⭐ Unit select : h-9 → h-10, text-[13px] → text-[13.5px] */}
          <select
            value={modaliteUnit}
            onChange={(e) => setModaliteUnit(e.target.value)}
            className="h-10 w-[72px] shrink-0 cursor-pointer appearance-none rounded-lg border px-2.5 pr-5 text-[13.5px] font-medium outline-none transition-all focus:ring-2 dark:placeholder-gray-500"
            style={inputStyle}
          >
            <option value="minutes">min</option>
            <option value="heures">h</option>
            <option value="jours">jours</option>
            <option value="mois">mois</option>
            <option value="annees">ans</option>
          </select>
        </div>
        {/* ⭐ Message : 11px → 11.5px */}
        <p className="text-[11.5px] mt-1 font-medium" style={{ color: theme.green }}>
          {modaliteMessage}
        </p>
      </div>

      {/* Frais de livraison */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          {/* ⭐ Label : 12.5px → 13px */}
          <label className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: isDeliveryEnabled ? theme.text : theme.muted }}>
            Frais de livraison (Ar)
            {!isDeliveryEnabled && (
              /* ⭐ Badge Requis : 9px → 9.5px, icon 9 → 10 */
              <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide"
                style={{ borderColor: 'rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.10)', color: theme.amber }}>
                <AlertCircle size={10} /> Requis
              </span>
            )}
            {isDeliveryEnabled && fraisLivraison > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide"
                style={{ borderColor: 'rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.10)', color: theme.green }}>
                <CheckCircle2 size={10} /> Livraison : Oui
              </span>
            )}
            {isDeliveryEnabled && fraisLivraison <= 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide"
                style={{ borderColor: 'rgba(100,116,139,0.35)', background: 'rgba(100,116,139,0.08)', color: theme.muted }}>
                <AlertCircle size={10} /> Livraison : Non
              </span>
            )}
          </label>
        </div>

        <div className="relative mt-1">
          {/* ⭐ Icon : 13 → 14 */}
          <Truck size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: isDeliveryEnabled ? theme.primary : theme.subMuted }} />
          <input
            type="number"
            min="0"
            step="100"
            placeholder={isDeliveryEnabled ? 'Ex: 5000' : '—'}
            value={isDeliveryEnabled ? fraisLivraison : ''}
            onChange={(e) => setFraisLivraison(Number(e.target.value) || 0)}
            className={`${inputClass} pl-9`}
            style={deliveryInputStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
            disabled={!isDeliveryEnabled}
          />
        </div>

        {/* ⭐ Helper : 10.5px → 11px, icon 10 → 11 */}
        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium" style={{ color: deliveryHelper.color }}>
          {deliveryHelper.icon === 'check' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
          {deliveryHelper.text}
        </p>
      </div>

      {/* Montant payé */}
      <div className="flex items-center justify-between">
        {/* ⭐ Label : 12.5px → 13px */}
        <span className="text-[13px] font-medium" style={{ color: theme.muted }}>Montant payé</span>
        {/* ⭐ Input : h-8 → h-9, w-24 → w-28, text-[13px] → text-[13.5px] */}
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
          className="w-28 h-9 rounded-md border px-2.5 text-right text-[13.5px] font-semibold outline-none focus:ring-2"
          style={{ background: theme.inputBg, borderColor: theme.border, color: theme.text }}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
      </div>

      {/* Reste à payer */}
      <div className="flex items-center justify-between mt-3">
        {/* ⭐ Label : 12.5px → 13px */}
        <span className="text-[13px] font-medium" style={{ color: theme.muted }}>Reste à payer</span>
        {/* ⭐ Value : 13px → 13.5px */}
        <span className="text-[13.5px] font-bold" style={{ color: theme.red }}>{formatMoney(resteAPayer)}</span>
      </div>

      {/* Statut */}
      <div className="flex items-center justify-between mt-3">
        {/* ⭐ Label : 12.5px → 13px */}
        <span className="text-[13px] font-medium" style={{ color: theme.muted }}>Statut</span>
        {/* ⭐ Badge : 11.5px → 12px, px-2.5 py-0.5 → px-3 py-1 */}
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold"
          style={{ color: statutConfig.color, background: statutConfig.bg, borderColor: statutConfig.border }}>
          {statutPaiement}
        </span>
      </div>
    </div>
  );
};