// src/components/depenses/DepensesModalForm.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ DESIGN COMPACT PREMIUM — mifanaraka amin'ny DepensesTable
// ⭐ FIX: FOND DARK = #0F172A ho an'ny modal, header, footer
// ⭐ FONT SIZE: h2 18px, subtitle 13.5px, labels 14px, inputs 15px, buttons 15px
// ⭐ FIX: Custom dropdown (Type + Mode paiement + Fournisseur)

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TrendingDown, X, Plus, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';

const COLORS = {
  light: {
    overlay: 'rgba(15,23,42,0.55)', card: '#FFFFFF', header: '#FFFFFF', footer: '#F8FAFC',
    border: '#E2E8F0', borderStrong: '#CBD5E1', text: '#0F172A', muted: '#64748B', subMuted: '#94A3B8',
    primary: '#4F46E5', primaryHover: '#4338CA', primarySoft: 'rgba(79,70,229,0.06)',
  },
  dark: {
    overlay: 'rgba(0,0,0,0.80)', card: '#0F172A', header: '#0F172A', footer: '#1E293B',
    border: 'rgba(255,255,255,0.12)', borderStrong: 'rgba(255,255,255,0.20)', text: '#F8FAFC', muted: '#94A3B8', subMuted: '#94A3B8',
    primary: '#4F46E5', primaryHover: '#4338CA', primarySoft: 'rgba(79,70,229,0.12)',
  },
};

interface Depense { id: number; categorie: string; description: string; montant: number; date_depense: string; mode_paiement: string; reference: string; fournisseur_id: number; observation: string; created_at: string; }
interface Fournisseur { id: number; nom: string; }
interface DepensesModalFormProps { isOpen: boolean; onClose: () => void; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; editingDepense: Depense | null; fournisseurs: Fournisseur[]; categories: string[]; modesPaiement: string[]; isDark: boolean; }

interface FormFieldProps { label: string; children: React.ReactNode; required?: boolean; className?: string; }

const FormField: React.FC<FormFieldProps> = ({ label, children, required = false, className = '' }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {/* ⭐ Label : 13.5px → 14px */}
    <label className="text-[14px] font-medium text-slate-700 dark:text-slate-300">
      {label}{required && <span className="ml-1 text-brand-500">*</span>}
    </label>
    {children}
  </div>
);

const SummaryRow: React.FC<{ label: string; value: string; theme: typeof COLORS.light | typeof COLORS.dark }> = ({ label, value, theme }) => (
  <div className="flex items-center justify-between gap-3">
    {/* ⭐ Label : 12.5px → 13px */}
    <span className="text-[13px] font-medium" style={{ color: theme.muted }}>{label}</span>
    {/* ⭐ Value : 13px → 14px */}
    <span className="max-w-[120px] truncate text-right text-[14px] font-semibold" style={{ color: theme.text }} title={value}>{value}</span>
  </div>
);

const isDateValid = (date: any): date is Date => date instanceof Date && !isNaN(date.getTime());

interface CustomSelectProps {
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: any) => void;
  placeholder?: string;
  isDark: boolean;
  theme: any;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, onChange, placeholder, isDark, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* ⭐ Button : h-10 → h-11, text-[13.5px] → text-[15px], px-3 → px-3.5 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-11 w-full rounded-lg border px-3.5 text-[15px] font-medium outline-none flex items-center justify-between transition-all duration-150 ${
          isDark
            ? 'border-white/[0.12] bg-[#0F172A] text-slate-100 hover:border-white/20 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15'
            : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10'
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        {/* ⭐ Chevron : 15 → 16 */}
        <ChevronDown size={16} className={`ml-2 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} opacity-50`} />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border shadow-xl ${
            isDark ? 'border-white/[0.12] bg-[#0F172A]' : 'border-slate-200 bg-white'
          }`}
          style={{ maxHeight: '250px', overflowY: 'auto' }}
        >
          {options.map((opt) => (
            /* ⭐ Item : text-[13.5px] → text-[15px], px-3 py-2 → px-3.5 py-2.5 */
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`block w-full px-3.5 py-2.5 text-left text-[15px] transition-colors ${
                isDark
                  ? value === opt.value ? 'bg-brand-500/20 text-brand-300 font-semibold' : 'text-slate-100 hover:bg-white/[0.06]'
                  : value === opt.value ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-slate-900 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DepensesModalForm: React.FC<DepensesModalFormProps> = ({ isOpen, onClose, onSubmit, editingDepense, fournisseurs, categories, modesPaiement, isDark: propIsDark }) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;
  const formRef = useRef<HTMLFormElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const borderClass = isDark ? 'border-white/[0.12]' : 'border-slate-200';

  const [categorie, setCategorie] = useState<string>(editingDepense?.categorie || '');
  const [modePaiement, setModePaiement] = useState<string>(editingDepense?.mode_paiement || 'Espèces');
  const [fournisseurId, setFournisseurId] = useState<number | ''>(editingDepense?.fournisseur_id || '');

  useEffect(() => {
    if (!isOpen) { setIsVisible(false); return; }
    const timer = window.setTimeout(() => setIsVisible(true), 10);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') { e.preventDefault(); formRef.current?.requestSubmit(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingDepense?.date_depense) {
      const [year, month, day] = editingDepense.date_depense.split('-').map(Number);
      if (year && month && day) {
        const newDate = new Date(year, month - 1, day);
        if (isDateValid(newDate)) { setSelectedDate(newDate); }
        else setSelectedDate(new Date());
      } else setSelectedDate(new Date());
    } else setSelectedDate(new Date());

    setCategorie(editingDepense?.categorie || '');
    setModePaiement(editingDepense?.mode_paiement || 'Espèces');
    setFournisseurId(editingDepense?.fournisseur_id || '');
  }, [isOpen, editingDepense]);

  if (!isOpen) return null;

  const formatAmount = (amount: number) => `${Number(amount || 0).toLocaleString('fr-FR')} Ar`;
  const formattedDate = selectedDate && isDateValid(selectedDate) ? selectedDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "Aujourd'hui";

  // ⭐ inputClass : h-10 → h-11, text-[13.5px] → text-[15px], px-3 → px-3.5
  const inputClass = `h-11 w-full rounded-lg border px-3.5 text-[15px] font-medium outline-none transition-all duration-150 focus:ring-2 ${
    isDark
      ? 'border-white/[0.12] bg-[#0F172A] text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:ring-brand-500/15'
      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500/10'
  }`;
  // ⭐ textareaClass : text-[13.5px] → text-[15px], px-3 py-2.5 → px-3.5 py-3
  const textareaClass = `w-full resize-none rounded-lg border px-3.5 py-3 text-[15px] font-medium outline-none transition-all focus:ring-2 ${
    isDark
      ? 'border-white/[0.12] bg-[#0F172A] text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:ring-brand-500/15'
      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500/10'
  }`;

  return createPortal(
    <div
      className={`fixed inset-0 z-[999999] flex items-center justify-center overflow-y-auto p-3 transition-opacity duration-200 sm:p-5 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: theme.overlay, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="depense-modal-title"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative flex max-h-[86vh] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_70px_rgba(0,0,0,0.25)] transition-all duration-200 ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[.985]'} ${borderClass}`}
        style={{ background: theme.card }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 z-30 h-[2px]" style={{ background: theme.primary }} />

        {/* HEADER — ⭐ h-12 → h-16, px-5 */}
        <header className={`flex h-16 shrink-0 items-center justify-between gap-4 border-b px-5 ${borderClass}`} style={{ background: theme.header }}>
          <div className="flex min-w-0 items-center gap-3">
            {/* ⭐ Icon container : h-7 w-7 → h-9 w-9, icon h-4 → h-[18px] */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: theme.primarySoft, color: theme.primary }}>
              <TrendingDown className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              {/* ⭐ h2 : 14.5px → 18px */}
              <h2 id="depense-modal-title" className="truncate text-[18px] font-semibold tracking-tight" style={{ color: theme.text }}>
                {editingDepense ? 'Modifier la dépense' : 'Nouvelle dépense'}
              </h2>
              {/* ⭐ Subtitle : 12px → 13.5px */}
              <p className="mt-0.5 truncate text-[13.5px]" style={{ color: theme.subMuted }}>
                {editingDepense ? 'Modifiez les informations de cette dépense.' : 'Ajoutez une nouvelle dépense à votre registre.'}
              </p>
            </div>
          </div>
          {/* ⭐ Close button : h-8 w-8 → h-10 w-10, icon h-4 → h-[19px] */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
            style={{ color: theme.muted }}
          >
            <X className="h-[19px] w-[19px]" strokeWidth={2} />
          </button>
        </header>

        <form ref={formRef} onSubmit={onSubmit} className="custom-depense-scrollbar min-h-0 flex-1 overflow-y-auto">
          {/* ⭐ Body padding : p-5 sm:p-6 */}
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">

              {/* ASIDE — RÉSUMÉ */}
              <aside className="min-w-0">
                <div className={`overflow-hidden rounded-xl border ${borderClass}`} style={{ background: isDark ? '#0F172A' : '#F8FAFC' }}>
                  <div className={`border-b px-4 py-2.5 ${borderClass}`}>
                    {/* ⭐ Label "Résumé" : 12.5px → 13.5px */}
                    <span className="text-[13.5px] font-semibold uppercase tracking-[.04em]" style={{ color: theme.text }}>Résumé</span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2.5">
                      <SummaryRow label="Référence" value={editingDepense?.reference || 'Nouvelle'} theme={theme} />
                      <SummaryRow label="Date" value={formattedDate} theme={theme} />
                      <SummaryRow label="Catégorie" value={categorie || '—'} theme={theme} />
                      <SummaryRow label="Paiement" value={modePaiement || '—'} theme={theme} />
                    </div>
                    <div className="my-3.5 h-px" style={{ background: theme.border }} />
                    <div>
                      {/* ⭐ Label "Montant" : 12.5px → 13.5px */}
                      <div className="mb-1 text-[13.5px] font-medium" style={{ color: theme.muted }}>Montant</div>
                      {/* ⭐ Value : 18px → 20px */}
                      <div className="truncate text-[20px] font-bold tracking-tight" style={{ color: theme.primary }}>
                        {editingDepense ? formatAmount(editingDepense.montant) : '0 Ar'}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: isDark ? 'rgba(79,70,229,0.10)' : 'rgba(79,70,229,0.06)' }}>
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {/* ⭐ Badge : 11.5px → 13px */}
                      <span className="text-[13px] font-semibold" style={{ color: isDark ? '#F8FAFC' : '#4F46E5' }}>
                        {editingDepense ? 'Mode modification' : 'Nouvelle dépense'}
                      </span>
                    </div>
                  </div>
                </div>
              </aside>

              {/* FORM */}
              <div className="min-w-0">
                <div className={`overflow-hidden rounded-xl border ${borderClass}`}>
                  <div className="p-5">
                    <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">

                      <FormField label="Catégorie" required>
                        <CustomSelect
                          value={categorie}
                          options={categories.map(cat => ({ value: cat, label: cat }))}
                          onChange={setCategorie}
                          placeholder="Sélectionner une catégorie"
                          isDark={isDark}
                          theme={theme}
                        />
                        <input type="hidden" name="categorie" value={categorie} />
                      </FormField>

                      <FormField label="Date">
                        <DatePicker
                          selected={selectedDate}
                          onChange={(date: Date | null) => setSelectedDate(date)}
                          dateFormat="dd/MM/yyyy"
                          className={`${inputClass} w-full`}
                          wrapperClassName="w-full"
                          popperClassName={isDark ? 'dark-datepicker-popper' : 'light-datepicker-popper'}
                          calendarClassName={isDark ? 'dark-datepicker' : 'light-datepicker'}
                          placeholderText="dd/MM/yyyy"
                          locale={fr}
                        />
                        <input type="hidden" name="date_depense" value={selectedDate && isDateValid(selectedDate) ? selectedDate.toISOString().split('T')[0] : ''} />
                      </FormField>

                      <FormField label="Mode de paiement">
                        <CustomSelect
                          value={modePaiement}
                          options={modesPaiement.map(mode => ({ value: mode, label: mode }))}
                          onChange={setModePaiement}
                          placeholder="Espèces"
                          isDark={isDark}
                          theme={theme}
                        />
                        <input type="hidden" name="mode_paiement" value={modePaiement} />
                      </FormField>

                      <FormField label="Fournisseur">
                        <CustomSelect
                          value={fournisseurId}
                          options={[
                            { value: '', label: 'Aucun fournisseur' },
                            ...fournisseurs.map(fournisseur => ({ value: fournisseur.id, label: fournisseur.nom })),
                          ]}
                          onChange={setFournisseurId}
                          placeholder="Aucun fournisseur"
                          isDark={isDark}
                          theme={theme}
                        />
                        <input type="hidden" name="fournisseur_id" value={fournisseurId} />
                      </FormField>

                      <div className="md:col-span-2">
                        <FormField label="Description" required>
                          <input type="text" name="description" defaultValue={editingDepense?.description || ''} required className={inputClass} placeholder="Description de la dépense" />
                        </FormField>
                      </div>

                      <FormField label="Montant" required>
                        <div className="relative">
                          <input type="number" name="montant" defaultValue={editingDepense?.montant || 0} required min="0" step="any" className={`${inputClass} pr-12 font-bold`} placeholder="0" />
                          {/* ⭐ "Ar" : 12px → 13.5px, right-2.5 → right-3 */}
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13.5px] font-semibold" style={{ color: theme.subMuted }}>Ar</span>
                        </div>
                      </FormField>

                      <FormField label="Référence">
                        <input type="text" name="reference" defaultValue={editingDepense?.reference || `DEP-${Date.now().toString().slice(-4)}`} className={inputClass} placeholder="Référence" />
                      </FormField>

                      <div className="md:col-span-2">
                        <FormField label="Observation">
                          <textarea name="observation" defaultValue={editingDepense?.observation || ''} rows={3} className={textareaClass} placeholder="Ajoutez une observation si nécessaire..." />
                        </FormField>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* FOOTER — ⭐ h-14 → h-[72px], px-5 */}
        <footer className={`flex h-[72px] shrink-0 items-center justify-between gap-3 border-t px-5 ${borderClass}`} style={{ background: theme.footer }}>
          {/* ⭐ Hint : 11.5px → 13px */}
          <span className="hidden text-[13px] font-medium sm:block" style={{ color: theme.subMuted }}>
            Échap pour fermer · Ctrl + Entrée pour enregistrer
          </span>
          <div className="ml-auto flex items-center gap-2">
            {/* ⭐ Annuler button : 13.5px → 15px, h-9 → h-10, px-4 → px-4.5 */}
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg px-4.5 text-[15px] font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              style={{ color: theme.muted }}
            >
              Annuler
            </button>
            {/* ⭐ Submit button : 13.5px → 15px, h-9 → h-10, px-4 → px-5, icon 3.5 → 4.5 */}
            <button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              className="flex h-10 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[.98]"
              style={{ background: theme.primary }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.primaryHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = theme.primary; }}
            >
              <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
              {editingDepense ? 'Enregistrer' : 'Ajouter la dépense'}
            </button>
          </div>
        </footer>

        <style>{`
          .custom-depense-scrollbar::-webkit-scrollbar{width:6px;height:6px}
          .custom-depense-scrollbar::-webkit-scrollbar-track{background:transparent}
          .custom-depense-scrollbar::-webkit-scrollbar-thumb{background:#4F46E5;border-radius:999px}
          .custom-depense-scrollbar::-webkit-scrollbar-thumb:hover{background:#4338CA}

          .react-datepicker-wrapper { width: 100%; }
          .react-datepicker-popper { z-index: 100000 !important; }
          .react-datepicker { border-radius: 12px !important; overflow: hidden; font-family: inherit !important; box-shadow: 0 20px 50px rgba(0,0,0,0.18) !important; width: 280px !important; }
          .react-datepicker__header { padding-top: 12px !important; }
          .react-datepicker__current-month { font-size: 14px !important; font-weight: 600 !important; }
          .react-datepicker__day-name { font-size: 12px !important; font-weight: 600 !important; }
          .react-datepicker__day { border-radius: 8px !important; margin: 2px !important; padding: 6px 0 !important; transition: all 120ms ease; font-weight: 500 !important; }

          .dark-datepicker-popper .react-datepicker, .dark-datepicker { background-color: #0F172A !important; border-color: rgba(255,255,255,0.12) !important; color: #F8FAFC !important; }
          .dark-datepicker-popper .react-datepicker__header { background-color: #0F172A !important; border-color: rgba(255,255,255,0.12) !important; }
          .dark-datepicker-popper .react-datepicker__current-month, .dark-datepicker-popper .react-datepicker__day-name { color: #F8FAFC !important; }
          .dark-datepicker-popper .react-datepicker__day { color: #94A3B8 !important; }
          .dark-datepicker-popper .react-datepicker__day:hover { background: rgba(79,70,229,0.2) !important; color: #FFFFFF !important; }
          .dark-datepicker-popper .react-datepicker__day--selected, .dark-datepicker-popper .react-datepicker__day--keyboard-selected { background: #4F46E5 !important; color: #FFFFFF !important; font-weight: 600 !important; }
          .dark-datepicker-popper .react-datepicker__navigation-icon::before { border-color: #94A3B8 !important; }

          .light-datepicker-popper .react-datepicker, .light-datepicker { background-color: #FFFFFF !important; border-color: #E2E8F0 !important; }
          .light-datepicker-popper .react-datepicker__header { background-color: #F8FAFC !important; border-color: #E2E8F0 !important; }
          .light-datepicker-popper .react-datepicker__current-month, .light-datepicker-popper .react-datepicker__day-name { color: #0F172A !important; }
          .light-datepicker-popper .react-datepicker__day { color: #0F172A !important; }
          .light-datepicker-popper .react-datepicker__day:hover { background: rgba(79,70,229,0.1) !important; color: #FFFFFF !important; }
          .light-datepicker-popper .react-datepicker__day--selected, .light-datepicker-popper .react-datepicker__day--keyboard-selected { background: #4F46E5 !important; color: #FFFFFF !important; font-weight: 600 !important; }
          .light-datepicker-popper .react-datepicker__navigation-icon::before { border-color: #0F172A !important; }
        `}</style>
      </div>
    </div>,
    document.body
  );
};

export default DepensesModalForm;