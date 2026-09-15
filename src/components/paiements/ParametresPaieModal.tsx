// src/components/paiements/ParametresPaieModal.tsx
// ⭐ VERSION MADAGASCAR + MODE COMPLET/SIMPLIFIÉ
// ⭐ FONT SIZE: h2 18px, h3 15px, labels 14px, inputs 15px, buttons 15px

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Save } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

type PayrollMode = 'complet' | 'simplifie';

interface Bracket { min: number; max: number | null; taux: number; }

interface ParametresPaie {
  mode_paie: PayrollMode;
  heures_normales_mois: number;
  jours_ouvrables_mois: number;
  taux_heure_sup: number;
  cnaps_actif: number; cnaps_taux: number; cnaps_base: string; cnaps_plafond: number;
  ostie_actif: number; ostie_taux: number; ostie_base: string; ostie_plafond: number;
  irsa_actif: number; irsa_bareme: Bracket[]; irsa_base: string; irsa_exoneration: number;
  absences_actif: number; absences_mode: string;
  avance_actif: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newMode: PayrollMode) => void;
}

// ════════════════════════════════════════════════════════════
// DEFAULT (MADAGASCAR)
// ════════════════════════════════════════════════════════════

const DEFAULT_PARAMS: ParametresPaie = {
  mode_paie: 'complet',
  heures_normales_mois: 173.33,
  jours_ouvrables_mois: 26,
  taux_heure_sup: 1.25,
  cnaps_actif: 1,
  cnaps_taux: 1.0,
  cnaps_base: 'brut',
  cnaps_plafond: 1600000,
  ostie_actif: 1,
  ostie_taux: 1.0,
  ostie_base: 'brut',
  ostie_plafond: 1600000,
  irsa_actif: 1,
  irsa_bareme: [
    { min: 0,      max: 350000, taux: 0 },
    { min: 350000, max: 400000, taux: 5 },
    { min: 400000, max: 500000, taux: 10 },
    { min: 500000, max: 600000, taux: 15 },
    { min: 600000, max: 700000, taux: 20 },
    { min: 700000, max: null,   taux: 25 },
  ],
  irsa_base: 'net_imposable',
  irsa_exoneration: 0,
  absences_actif: 1,
  absences_mode: 'jour',
  avance_actif: 1,
};

// ════════════════════════════════════════════════════════════
// COMPOSANT
// ════════════════════════════════════════════════════════════

const ParametresPaieModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  const { isDark } = useTheme();
  const [params, setParams] = useState<ParametresPaie>(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const res = await (window as any).api?.parametresPaie?.get?.();
        if (res?.success && res.data) {
          setParams({
            ...DEFAULT_PARAMS,
            ...res.data,
            mode_paie: res.data.mode_paie === 'simplifie' ? 'simplifie' : 'complet',
            irsa_bareme: Array.isArray(res.data.irsa_bareme) && res.data.irsa_bareme.length > 0
              ? res.data.irsa_bareme
              : DEFAULT_PARAMS.irsa_bareme,
          });
        }
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...params,
        mode_paie: params.mode_paie === 'simplifie' ? 'simplifie' : 'complet',
      };
      const res = await (window as any).api?.parametresPaie?.update?.(payload);
      if (!res?.success) throw new Error(res?.error || 'Erreur d\'enregistrement.');
      onSaved?.(params.mode_paie);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Réinitialiser aux valeurs par défaut ?')) return;
    setSaving(true);
    try {
      const res = await (window as any).api?.parametresPaie?.reset?.();
      if (res?.success) {
        setParams({
          ...DEFAULT_PARAMS,
          ...res.data,
          mode_paie: res.data?.mode_paie === 'simplifie' ? 'simplifie' : 'complet',
        });
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  const updateBracket = (idx: number, patch: Partial<Bracket>) => {
    setParams((p) => ({
      ...p,
      irsa_bareme: p.irsa_bareme.map((b, i) => i === idx ? { ...b, ...patch } : b),
    }));
  };

  const addBracket = () => {
    setParams((p) => ({
      ...p,
      irsa_bareme: [...p.irsa_bareme, { min: 0, max: null, taux: 0 }],
    }));
  };

  const removeBracket = (idx: number) => {
    setParams((p) => ({
      ...p,
      irsa_bareme: p.irsa_bareme.filter((_, i) => i !== idx),
    }));
  };

  if (!isOpen) return null;

  const bg = isDark ? '#0F172A' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0';
  const inputBg = isDark ? '#0A1222' : '#FFFFFF';
  const text = isDark ? '#F8FAFC' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';

  const inputStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    borderColor: border,
    color: text,
  };

  const isSimplifie = params.mode_paie === 'simplifie';

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{ backgroundColor: bg, borderColor: border }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ══════════ HEADER — ⭐ h2 17px → 18px, subtitle 13px → 13.5px */}
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-4" style={{ borderColor: border }}>
          <div>
            <h2 className="text-[18px] font-bold" style={{ color: text }}>Paramètres de paie</h2>
            <p className="text-[13.5px] mt-0.5" style={{ color: muted }}>Configuration des règles de calcul</p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-3.5 py-2 text-[15px] font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            Fermer
          </button>
        </div>

        {/* ══════════ BODY — ⭐ p-5 */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            /* ⭐ Loading : text-[15px] */
            <div className="py-12 text-center text-[15px]" style={{ color: muted }}>Chargement...</div>
          ) : (
            <div className="space-y-5">
              {/* ⭐ Error : 13px → 15px */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[15px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* ═══ MODE DE CALCUL ═══ */}
              <section className="rounded-xl border p-4" style={{ borderColor: border }}>
                {/* ⭐ h3 : 14px → 15px */}
                <h3 className="mb-3 text-[15px] font-bold" style={{ color: text }}>
                  Mode de calcul
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setParams({ ...params, mode_paie: 'complet' })}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      params.mode_paie === 'complet' ? 'ring-2 ring-indigo-500 ring-offset-0' : ''
                    }`}
                    style={{
                      borderColor: params.mode_paie === 'complet' ? '#4F46E5' : border,
                      backgroundColor: params.mode_paie === 'complet'
                        ? (isDark ? 'rgba(79,70,229,0.12)' : 'rgba(79,70,229,0.05)')
                        : 'transparent',
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {/* ⭐ h4 : 13px → 15px */}
                          <h4 className="text-[15px] font-semibold" style={{ color: text }}>
                            Mode Complet
                          </h4>
                          {/* ⭐ Badge "Actif" : 9px → 11px, px-1.5 py-0.5 → px-2 py-0.5 */}
                          {params.mode_paie === 'complet' && (
                            <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                              Actif
                            </span>
                          )}
                        </div>
                        {/* ⭐ Description : 11px → 13px, leading 1.4 → 1.5 */}
                        <p className="mt-1 text-[13px] leading-[1.5]" style={{ color: muted }}>
                          Légal : CNaPS, OSTIE, IRSA, primes, heures sup.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setParams({ ...params, mode_paie: 'simplifie' })}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      params.mode_paie === 'simplifie' ? 'ring-2 ring-emerald-500 ring-offset-0' : ''
                    }`}
                    style={{
                      borderColor: params.mode_paie === 'simplifie' ? '#10B981' : border,
                      backgroundColor: params.mode_paie === 'simplifie'
                        ? (isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.05)')
                        : 'transparent',
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[15px] font-semibold" style={{ color: text }}>
                            Mode Simplifié
                          </h4>
                          {params.mode_paie === 'simplifie' && (
                            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                              Actif
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[13px] leading-[1.5]" style={{ color: muted }}>
                          Net = Salaire brut − Avance − Absences.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {isSimplifie && (
                  /* ⭐ Warning : 11px → 13px, leading 1.4 → 1.5 */
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 dark:border-amber-500/25 dark:bg-amber-500/[0.08]">
                    <p className="text-[13px] leading-[1.5] text-amber-700 dark:text-amber-300">
                      Le <strong>Mode Simplifié</strong> peut être non conforme à la législation si des employés sont déclarés à la CNaPS/OSTIE.
                    </p>
                  </div>
                )}
              </section>

              {/* ═══ TEMPS & HEURES ═══ */}
              <section className="rounded-xl border p-4" style={{ borderColor: border }}>
                <h3 className="mb-3 text-[15px] font-bold" style={{ color: text }}>Temps & Heures</h3>
                <div className="grid grid-cols-3 gap-3">
                  <NumField
                    label="Heures normales/mois"
                    value={params.heures_normales_mois}
                    onChange={(v: number) => setParams({ ...params, heures_normales_mois: v })}
                    inputStyle={inputStyle}
                    muted={muted}
                  />
                  <NumField
                    label="Jours ouvrables/mois"
                    value={params.jours_ouvrables_mois}
                    onChange={(v: number) => setParams({ ...params, jours_ouvrables_mois: v })}
                    inputStyle={inputStyle}
                    muted={muted}
                  />
                  <NumField
                    label="Taux heure sup (×)"
                    value={params.taux_heure_sup}
                    onChange={(v: number) => setParams({ ...params, taux_heure_sup: v })}
                    step={0.01}
                    inputStyle={inputStyle}
                    muted={muted}
                  />
                </div>
              </section>

              {/* ═══ SI COMPLET → sections retenues ═══ */}
              {isSimplifie ? (
                <section
                  className="rounded-xl border p-6 text-center"
                  style={{
                    borderColor: border,
                    backgroundColor: isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.03)',
                  }}
                >
                  <h3 className="text-[15px] font-bold" style={{ color: text }}>
                    Mode Simplifié activé
                  </h3>
                  {/* ⭐ 12px → 14px, leading 1.5 → 1.6 */}
                  <p className="mx-auto mt-1 max-w-md text-[14px] leading-[1.6]" style={{ color: muted }}>
                    Aucun CNaPS, OSTIE, IRSA, ni primes dans ce mode.
                    Le <strong>Net = Salaire brut − Avance − Absences</strong>.
                  </p>
                  {/* ⭐ Button : 12px → 14px, px-3 py-1.5 → px-4 py-2 */}
                  <button
                    type="button"
                    onClick={() => setParams({ ...params, mode_paie: 'complet' })}
                    className="mt-3 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-[14px] font-semibold text-white hover:bg-indigo-700"
                  >
                    Passer en Mode Complet
                  </button>
                </section>
              ) : (
                <>
                  {/* ═══ CNaPS ═══ */}
                  <section className="rounded-xl border p-4" style={{ borderColor: border }}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-[15px] font-bold" style={{ color: text }}>CNaPS</h3>
                      <Toggle
                        value={params.cnaps_actif === 1}
                        onChange={(v: boolean) => setParams({ ...params, cnaps_actif: v ? 1 : 0 })}
                        label="Actif"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <NumField
                        label="Taux (%)"
                        value={params.cnaps_taux}
                        onChange={(v: number) => setParams({ ...params, cnaps_taux: v })}
                        step={0.01}
                        inputStyle={inputStyle}
                        muted={muted}
                      />
                      <NumField
                        label="Plafond (Ar)"
                        value={params.cnaps_plafond}
                        onChange={(v: number) => setParams({ ...params, cnaps_plafond: v })}
                        step={1000}
                        inputStyle={inputStyle}
                        muted={muted}
                      />
                      <SelectField
                        label="Base"
                        value={params.cnaps_base}
                        onChange={(v: string) => setParams({ ...params, cnaps_base: v })}
                        options={[['brut', 'Brut'], ['brut_hs', 'Brut + HS']]}
                        inputStyle={inputStyle}
                        muted={muted}
                      />
                    </div>
                  </section>

                  {/* ═══ OSTIE ═══ */}
                  <section className="rounded-xl border p-4" style={{ borderColor: border }}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-[15px] font-bold" style={{ color: text }}>OSTIE</h3>
                      <Toggle
                        value={params.ostie_actif === 1}
                        onChange={(v: boolean) => setParams({ ...params, ostie_actif: v ? 1 : 0 })}
                        label="Actif"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <NumField
                        label="Taux (%)"
                        value={params.ostie_taux}
                        onChange={(v: number) => setParams({ ...params, ostie_taux: v })}
                        step={0.01}
                        inputStyle={inputStyle}
                        muted={muted}
                      />
                      <NumField
                        label="Plafond (Ar)"
                        value={params.ostie_plafond}
                        onChange={(v: number) => setParams({ ...params, ostie_plafond: v })}
                        step={1000}
                        inputStyle={inputStyle}
                        muted={muted}
                      />
                      <SelectField
                        label="Base"
                        value={params.ostie_base}
                        onChange={(v: string) => setParams({ ...params, ostie_base: v })}
                        options={[['brut', 'Brut'], ['brut_hs', 'Brut + HS']]}
                        inputStyle={inputStyle}
                        muted={muted}
                      />
                    </div>
                  </section>

                  {/* ═══ IRSA ═══ */}
                  <section className="rounded-xl border p-4" style={{ borderColor: border }}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-[15px] font-bold" style={{ color: text }}>IRSA</h3>
                      <Toggle
                        value={params.irsa_actif === 1}
                        onChange={(v: boolean) => setParams({ ...params, irsa_actif: v ? 1 : 0 })}
                        label="Actif"
                      />
                    </div>

                    <div className="mb-3 grid grid-cols-2 gap-3">
                      <SelectField
                        label="Base"
                        value={params.irsa_base}
                        onChange={(v: string) => setParams({ ...params, irsa_base: v })}
                        options={[
                          ['net_imposable', 'Net imposable (Brut − CNaPS − OSTIE)'],
                          ['brut', 'Brut'],
                        ]}
                        inputStyle={inputStyle}
                        muted={muted}
                      />
                      <NumField
                        label="Exonération (Ar)"
                        value={params.irsa_exoneration}
                        onChange={(v: number) => setParams({ ...params, irsa_exoneration: v })}
                        step={1000}
                        inputStyle={inputStyle}
                        muted={muted}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        {/* ⭐ Label : 12px → 14px */}
                        <label className="text-[14px] font-semibold" style={{ color: muted }}>
                          Barème progressif ({params.irsa_bareme.length} tranches)
                        </label>
                        {/* ⭐ Ajouter button : 11px → 13.5px, px-2.5 py-1 → px-3 py-1.5 */}
                        <button
                          onClick={addBracket}
                          className="rounded-md bg-indigo-50 px-3 py-1.5 text-[13.5px] font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                        >
                          Ajouter
                        </button>
                      </div>

                      {/* ⭐ Header columns : 10.5px → 12.5px */}
                      <div className="grid grid-cols-12 gap-2 px-1 text-[12.5px] font-bold uppercase tracking-wider" style={{ color: muted }}>
                        <div className="col-span-4">Min (Ar)</div>
                        <div className="col-span-4">Max (Ar)</div>
                        <div className="col-span-3">Taux %</div>
                        <div className="col-span-1"></div>
                      </div>

                      {params.irsa_bareme.map((b, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2">
                          <div className="col-span-4">
                            <NumField
                              value={b.min}
                              onChange={(v: number) => updateBracket(i, { min: v })}
                              inputStyle={inputStyle}
                              muted={muted}
                              placeholder="Min"
                            />
                          </div>
                          <div className="col-span-4">
                            <NumField
                              value={b.max ?? ''}
                              onChange={(v: number) => updateBracket(i, { max: v === 0 ? null : v })}
                              inputStyle={inputStyle}
                              muted={muted}
                              placeholder="Max (vide=∞)"
                            />
                          </div>
                          <div className="col-span-3">
                            <NumField
                              value={b.taux}
                              onChange={(v: number) => updateBracket(i, { taux: v })}
                              step={0.01}
                              inputStyle={inputStyle}
                              muted={muted}
                              placeholder="Taux %"
                            />
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            {/* ⭐ Croix × : 20px → 24px, h-9 w-9 → h-10 w-10 */}
                            <button
                              onClick={() => removeBracket(i)}
                              className="flex h-10 w-10 items-center justify-center rounded-md text-[24px] font-bold leading-none text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                              type="button"
                              title="Supprimer cette tranche"
                              aria-label="Supprimer cette tranche"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* ═══ ABSENCES ═══ */}
                  <section className="rounded-xl border p-4" style={{ borderColor: border }}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-[15px] font-bold" style={{ color: text }}>Absences</h3>
                      <Toggle
                        value={params.absences_actif === 1}
                        onChange={(v: boolean) => setParams({ ...params, absences_actif: v ? 1 : 0 })}
                        label="Actif"
                      />
                    </div>
                    <SelectField
                      label="Mode de calcul"
                      value={params.absences_mode}
                      onChange={(v: string) => setParams({ ...params, absences_mode: v })}
                      options={[['jour', 'Déduction journalière (brut / jours ouvrables)']]}
                      inputStyle={inputStyle}
                      muted={muted}
                    />
                  </section>

                  {/* ═══ AVANCE ═══ */}
                  <section className="rounded-xl border p-4" style={{ borderColor: border }}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-bold" style={{ color: text }}>Avance</h3>
                      <Toggle
                        value={params.avance_actif === 1}
                        onChange={(v: boolean) => setParams({ ...params, avance_actif: v ? 1 : 0 })}
                        label="Actif"
                      />
                    </div>
                  </section>
                </>
              )}
            </div>
          )}
        </div>

        {/* ══════════ FOOTER — ⭐ py-4 → py-5, buttons 14px → 15px */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t px-5 py-5" style={{ borderColor: border }}>
          {/* ⭐ Réinitialiser : 13px → 14px, px-3 py-2 → px-4 py-3 */}
          <button
            onClick={handleReset}
            disabled={saving}
            className="rounded-lg border px-4 py-3 text-[14px] font-semibold disabled:opacity-50"
            style={{ borderColor: border, color: muted }}
          >
            Réinitialiser
          </button>
          <div className="flex items-center gap-2">
            {/* ⭐ Annuler : 14px → 15px, px-4 py-2 → px-5 py-3 */}
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-5 py-3 text-[15px] font-semibold disabled:opacity-50"
              style={{ color: muted }}
            >
              Annuler
            </button>
            {/* ⭐ Enregistrer : 14px → 15px, px-4 py-2 → px-5 py-3, icon 14 → 17 */}
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save size={17} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

// ════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ⭐ FONT SIZE: labels 14px, inputs 15px
// ════════════════════════════════════════════════════════════

function NumField({ label, value, onChange, step = 1, inputStyle, muted, placeholder }: any) {
  return (
    <div>
      {label && (
        /* ⭐ Label : 12px → 14px */
        <label className="mb-1 block text-[14px] font-semibold" style={{ color: muted }}>
          {label}
        </label>
      )}
      {/* ⭐ Input : h-9 → h-11, text-[14px] → text-[15px], px-2.5 → px-3.5 */}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border px-3.5 text-[15px] outline-none focus:border-indigo-500"
        style={inputStyle}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, inputStyle, muted }: any) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-[14px] font-semibold" style={{ color: muted }}>
          {label}
        </label>
      )}
      {/* ⭐ Select : h-9 → h-11, text-[14px] → text-[15px], px-2.5 → px-3.5 */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border px-3.5 text-[15px] outline-none focus:border-indigo-500"
        style={inputStyle}
      >
        {options.map(([v, l]: any) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ value, onChange, label }: any) {
  return (
    /* ⭐ Label : 12px → 14px, checkbox h-4 → h-4.5 */
    <label className="flex cursor-pointer items-center gap-2 text-[14px] font-semibold">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4.5 w-4.5 cursor-pointer accent-indigo-600"
      />
      {label}
    </label>
  );
}

export default ParametresPaieModal;