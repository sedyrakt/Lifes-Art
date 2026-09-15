// src/components/employes/EmployesModalForm.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ FONT SIZE: h2 18px, labels 14px, inputs 15px, buttons 15px
// ⭐ PADDING augmenté pour un rendu plus aéré

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Plus, Check, ChevronDown, FileText, Calculator, RotateCcw, Info } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Employe {
  id?: number; nom?: string; prenom?: string; email?: string; telephone?: string;
  poste?: string; departement?: string; date_embauche?: string; salaire?: number;
  cnaps?: number; ostie?: number; irsa?: number;
  status?: string;
}

interface EmployesModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  editingEmploye?: Employe | null;
  isDark?: boolean;
}

const STATUT_OPTIONS = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'en_conge', label: 'En congé' },
];

const DEPARTEMENTS = [
  { value: '', label: 'Sélectionner...' },
  { value: 'Production', label: 'Production' },
  { value: 'Ventes', label: 'Ventes' },
  { value: 'Achats', label: 'Achats' },
  { value: 'RH', label: 'Ressources Humaines' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Informatique', label: 'Informatique' },
  { value: 'Logistique', label: 'Logistique' },
  { value: 'Autre', label: 'Autre' },
];

const FormField: React.FC<{ label: string; children: React.ReactNode; required?: boolean; fullWidth?: boolean }> = ({ label, children, required = false, fullWidth = false }) => (
  <div className={`min-w-0 ${fullWidth ? 'w-full md:col-span-2 lg:col-span-3' : ''}`}>
    {/* ⭐ Label : 12.5px → 14px */}
    <label className="mb-1.5 block text-[14px] font-semibold text-slate-700 dark:text-slate-300">
      {label}{required && <span className="ml-1 text-brand-500">*</span>}
    </label>
    {children}
  </div>
);

// ⭐ Custom Dropdown Component
const CustomSelect: React.FC<{
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  isDark: boolean;
  inputClass: string;
}> = ({ value, options, onChange, isDark, inputClass }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${inputClass} flex items-center justify-between text-left cursor-pointer`}
        aria-expanded={isOpen}
      >
        <span className="truncate">{selected?.label || 'Sélectionner...'}</span>
        {/* ⭐ Chevron : 15 → 17 */}
        <ChevronDown size={17} strokeWidth={2.2} className={`ml-2 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} text-slate-400 dark:text-slate-500`} />
      </button>
      {isOpen && (
        <ul
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-lg"
        >
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                /* ⭐ Item : text-[13.5px] → text-[15px], py-2 → py-2.5 */
                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[15px] transition-colors ${
                  value === opt.value
                    ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/20 dark:text-brand-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {/* ⭐ Check : 14 → 16 */}
                {value === opt.value && <Check size={16} strokeWidth={2.2} className="shrink-0 text-brand-500" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const calculatePayrollValues = (brut: number) => {
  const safeBrut = Math.max(0, Number(brut) || 0);
  const calcCnaps = Math.round(safeBrut * 0.01);
  const calcOstie = Math.round(safeBrut * 0.05);
  const taxable = safeBrut - calcCnaps - calcOstie;
  let calcIrsa = 0;
  if (taxable > 350000 && taxable <= 700000) calcIrsa = Math.round((taxable - 350000) * 0.05);
  else if (taxable > 700000 && taxable <= 1400000) calcIrsa = Math.round((taxable - 700000) * 0.10 + 17500);
  else if (taxable > 1400000 && taxable <= 3000000) calcIrsa = Math.round((taxable - 1400000) * 0.15 + 87500);
  else if (taxable > 3000000) calcIrsa = Math.round((taxable - 3000000) * 0.20 + 327500);
  return { cnaps: calcCnaps, ostie: calcOstie, irsa: calcIrsa };
};

const EmployesModalForm: React.FC<EmployesModalFormProps> = ({ isOpen, onClose, onSubmit, editingEmploye, isDark: propIsDark }) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedDepartement, setSelectedDepartement] = useState<string>('');
  const [selectedStatut, setSelectedStatut] = useState<string>('actif');

  const [salaireBrut, setSalaireBrut] = useState<number>(0);
  const [cnapsInput, setCnapsInput] = useState<string>('');
  const [ostieInput, setOstieInput] = useState<string>('');
  const [irsaInput, setIrsaInput] = useState<string>('');

  const userOverrideCnaps = useRef(false);
  const userOverrideOstie = useRef(false);
  const userOverrideIrsa = useRef(false);

  const cnapsValue = Math.max(0, Number(cnapsInput) || 0);
  const ostieValue = Math.max(0, Number(ostieInput) || 0);
  const irsaValue = Math.max(0, Number(irsaInput) || 0);
  const netAPayer = Math.max(0, salaireBrut - cnapsValue - ostieValue - irsaValue);

  const applyAutoCalc = (brut: number, forceAll = false) => {
    const { cnaps, ostie, irsa } = calculatePayrollValues(brut);
    if (forceAll || !userOverrideCnaps.current) setCnapsInput(cnaps === 0 ? '' : String(cnaps));
    if (forceAll || !userOverrideOstie.current) setOstieInput(ostie === 0 ? '' : String(ostie));
    if (forceAll || !userOverrideIrsa.current) setIrsaInput(irsa === 0 ? '' : String(irsa));
  };

  const handleSalaireChange = (value: number) => {
    setSalaireBrut(value);
    applyAutoCalc(value);
  };

  const handleResetCnaps = () => { userOverrideCnaps.current = false; const { cnaps } = calculatePayrollValues(salaireBrut); setCnapsInput(cnaps === 0 ? '' : String(cnaps)); };
  const handleResetOstie = () => { userOverrideOstie.current = false; const { ostie } = calculatePayrollValues(salaireBrut); setOstieInput(ostie === 0 ? '' : String(ostie)); };
  const handleResetIrsa = () => { userOverrideIrsa.current = false; const { irsa } = calculatePayrollValues(salaireBrut); setIrsaInput(irsa === 0 ? '' : String(irsa)); };

  const getStatutColor = () => {
    if (selectedStatut === 'actif') return 'text-emerald-600 dark:text-emerald-400';
    if (selectedStatut === 'inactif') return 'text-red-600 dark:text-red-400';
    if (selectedStatut === 'en_conge') return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-500 dark:text-slate-400';
  };

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDepartement(editingEmploye?.departement || '');
    setSelectedStatut(editingEmploye?.status || 'actif');
    const brut = Number(editingEmploye?.salaire) || 0;
    setSalaireBrut(brut);

    if (editingEmploye) {
      const savedCnaps = Number(editingEmploye?.cnaps);
      const savedOstie = Number(editingEmploye?.ostie);
      const savedIrsa = Number(editingEmploye?.irsa);

      if (Number.isFinite(savedCnaps)) {
        setCnapsInput(savedCnaps === 0 ? '' : String(savedCnaps));
        userOverrideCnaps.current = savedCnaps !== calculatePayrollValues(brut).cnaps;
      } else {
        const { cnaps } = calculatePayrollValues(brut);
        setCnapsInput(cnaps === 0 ? '' : String(cnaps));
        userOverrideCnaps.current = false;
      }
      if (Number.isFinite(savedOstie)) {
        setOstieInput(savedOstie === 0 ? '' : String(savedOstie));
        userOverrideOstie.current = savedOstie !== calculatePayrollValues(brut).ostie;
      } else {
        const { ostie } = calculatePayrollValues(brut);
        setOstieInput(ostie === 0 ? '' : String(ostie));
        userOverrideOstie.current = false;
      }
      if (Number.isFinite(savedIrsa)) {
        setIrsaInput(savedIrsa === 0 ? '' : String(savedIrsa));
        userOverrideIrsa.current = savedIrsa !== calculatePayrollValues(brut).irsa;
      } else {
        const { irsa } = calculatePayrollValues(brut);
        setIrsaInput(irsa === 0 ? '' : String(irsa));
        userOverrideIrsa.current = false;
      }
    } else {
      userOverrideCnaps.current = false;
      userOverrideOstie.current = false;
      userOverrideIrsa.current = false;
      applyAutoCalc(brut, true);
    }
  }, [isOpen, editingEmploye]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); formRef.current?.requestSubmit(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  if (!isOpen) return null;

  // ⭐ Inputs : h-10 → h-11, text-[13.5px] → text-[15px], px-3.5
  const inputClass = `h-11 w-full rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] px-3.5 text-[15px] font-medium text-slate-900 dark:text-slate-100 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10`;

  const generateFichePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const companyName = "Life's Art";
    const employeeFullName = `${formRef.current?.querySelector<HTMLInputElement>('input[name="prenom"]')?.value || ''} ${formRef.current?.querySelector<HTMLInputElement>('input[name="nom"]')?.value || ''}`.trim();
    const poste = formRef.current?.querySelector<HTMLInputElement>('input[name="poste"]')?.value || 'Non spécifié';

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text(companyName, 14, 8);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text('Fiche Employé', doc.internal.pageSize.getWidth() - 14, 8, { align: 'right' });

    doc.setTextColor(0, 0, 0); doc.setFontSize(11);
    doc.text(`Employé : ${employeeFullName}`, 14, 20);
    doc.text(`Poste : ${poste}`, 14, 26);
    doc.text(`Statut : ${selectedStatut === 'actif' ? 'Actif' : selectedStatut === 'inactif' ? 'Inactif' : 'En congé'}`, 14, 32);

    autoTable(doc, {
      startY: 40,
      head: [['Rubrique', 'Montant (Ar)']],
      body: [
        ['Salaire Brut', `${salaireBrut.toLocaleString('fr-FR')}`],
        ['CNaPS', `${cnapsValue.toLocaleString('fr-FR')}`],
        ['OSTIE', `${ostieValue.toLocaleString('fr-FR')}`],
        ['IRSA', `${irsaValue.toLocaleString('fr-FR')}`],
        ['NET À PAYER', `${netAPayer.toLocaleString('fr-FR')}`],
      ],
      theme: 'grid', headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      bodyStyles: { fontSize: 10 }, columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });

    doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} - ${companyName}`, 14, doc.internal.pageSize.getHeight() - 10);
    doc.save(`fiche_employe_${employeeFullName.replace(/\s+/g, '_')}.pdf`);
  };

  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-opacity duration-200 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employe-modal-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="relative z-[100000] flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border-[0.5px] border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-[0_18px_55px_rgba(15,23,42,0.35)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

        {/* HEADER — ⭐ h-14 → h-16, px-4 → px-5 */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A] px-5">
          <div className="flex min-w-0 items-center gap-3">
            {/* ⭐ Icon container : h-7 w-7 → h-9 w-9, icon 15 → 18 */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <User size={18} strokeWidth={2.2} />
            </div>
            {/* ⭐ h2 : 13.5px → 18px */}
            <h2 id="employe-modal-title" className="truncate text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {editingEmploye ? 'Modifier l\'employé' : 'Nouvel employé'}
            </h2>
          </div>
          {/* ⭐ Close : h-8 w-8 → h-10 w-10, icon 16 → 19 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-slate-400"
          >
            <X size={19} strokeWidth={2.2} />
          </button>
        </header>

        <form ref={formRef} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* ⭐ Body : px-4 py-4 → px-5 py-5 */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

              <FormField label="Prénom" required>
                <input type="text" name="prenom" defaultValue={editingEmploye?.prenom || ''} required autoFocus={!editingEmploye} placeholder="Prenom" className={inputClass} />
              </FormField>
              <FormField label="Nom" required>
                <input type="text" name="nom" defaultValue={editingEmploye?.nom || ''} required placeholder="Nom" className={inputClass} />
              </FormField>
              <FormField label="Poste" required>
                <input type="text" name="poste" defaultValue={editingEmploye?.poste || ''} required placeholder="Poste" className={inputClass} />
              </FormField>
              <FormField label="Email" required>
                <input type="email" name="email" defaultValue={editingEmploye?.email || ''} required placeholder="Adresse Email" className={inputClass} />
              </FormField>
              <FormField label="Téléphone">
                <input type="tel" name="telephone" defaultValue={editingEmploye?.telephone || ''} placeholder="Telephone" className={inputClass} />
              </FormField>

              <FormField label="Département">
                <CustomSelect
                  value={selectedDepartement}
                  options={DEPARTEMENTS}
                  onChange={setSelectedDepartement}
                  isDark={isDark}
                  inputClass={inputClass}
                />
                <input type="hidden" name="departement" value={selectedDepartement} readOnly />
              </FormField>

              <FormField label="Date d'embauche" required>
                <input type="date" name="date_embauche" defaultValue={editingEmploye?.date_embauche || new Date().toISOString().split('T')[0]} required className={inputClass} />
              </FormField>
              <FormField label="Salaire (Ar)" required>
                <input type="number" name="salaire" value={salaireBrut} onChange={(e) => handleSalaireChange(Number(e.target.value))} min="0" step="1" required className={inputClass} />
              </FormField>

              <FormField label="Statut">
                <CustomSelect
                  value={selectedStatut}
                  options={STATUT_OPTIONS}
                  onChange={setSelectedStatut}
                  isDark={isDark}
                  inputClass={inputClass}
                />
                <input type="hidden" name="status" value={selectedStatut} readOnly />
              </FormField>
            </div>

            {/* Détail salaire */}
            <div className="mt-4 rounded-lg border border-slate-200 dark:border-white/[0.12] p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {/* ⭐ Calculator : 14 → 16 */}
                  <Calculator size={16} strokeWidth={2.2} className="text-brand-500" />
                  {/* ⭐ Label : 11.5px → 13px */}
                  <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Détail salaire</span>
                </div>
                {/* ⭐ Badge : 11.5px → 13px, icon 11 → 12 */}
                <span className="text-[13px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <Info size={12} strokeWidth={2.2} /> Champs optionnels
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  {/* ⭐ Label : 12.5px → 13.5px */}
                  <label className="mb-1.5 block text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">Salaire brut</label>
                  <div className="relative">
                    <input type="number" value={salaireBrut} disabled className={`${inputClass} pr-12 cursor-not-allowed bg-slate-100 dark:bg-white/[0.03]`} />
                    {/* ⭐ "Ar" : 11.5px → 13.5px */}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13.5px] font-semibold text-slate-400 dark:text-slate-500">Ar</span>
                  </div>
                </div>

                {/* CNaPS */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">
                      CNaPS <span className="text-slate-400 dark:text-slate-500">(1%)</span>
                    </label>
                    {userOverrideCnaps.current && (
                      /* ⭐ Auto button : 11.5px → 13px, icon 10 → 11 */
                      <button type="button" onClick={handleResetCnaps} title="Recalculer automatiquement" className="text-[13px] font-semibold flex items-center gap-0.5 text-brand-600 dark:text-brand-400 hover:underline">
                        <RotateCcw size={11} strokeWidth={2.2} /> Auto
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number" name="cnaps" min="0" step="1" value={cnapsInput}
                      onChange={(e) => { setCnapsInput(e.target.value); userOverrideCnaps.current = true; }}
                      placeholder="Optionnel"
                      className={`${inputClass} pr-12 ${userOverrideCnaps.current ? 'border-amber-400 dark:border-amber-500/50' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13.5px] font-semibold text-slate-400 dark:text-slate-500">Ar</span>
                  </div>
                </div>

                {/* OSTIE */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">
                      OSTIE <span className="text-slate-400 dark:text-slate-500">(5%)</span>
                    </label>
                    {userOverrideOstie.current && (
                      <button type="button" onClick={handleResetOstie} title="Recalculer automatiquement" className="text-[13px] font-semibold flex items-center gap-0.5 text-brand-600 dark:text-brand-400 hover:underline">
                        <RotateCcw size={11} strokeWidth={2.2} /> Auto
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number" name="ostie" min="0" step="1" value={ostieInput}
                      onChange={(e) => { setOstieInput(e.target.value); userOverrideOstie.current = true; }}
                      placeholder="Optionnel"
                      className={`${inputClass} pr-12 ${userOverrideOstie.current ? 'border-amber-400 dark:border-amber-500/50' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13.5px] font-semibold text-slate-400 dark:text-slate-500">Ar</span>
                  </div>
                </div>

                {/* IRSA */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">IRSA</label>
                    {userOverrideIrsa.current && (
                      <button type="button" onClick={handleResetIrsa} title="Recalculer automatiquement" className="text-[13px] font-semibold flex items-center gap-0.5 text-brand-600 dark:text-brand-400 hover:underline">
                        <RotateCcw size={11} strokeWidth={2.2} /> Auto
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number" name="irsa" min="0" step="1" value={irsaInput}
                      onChange={(e) => { setIrsaInput(e.target.value); userOverrideIrsa.current = true; }}
                      placeholder="Optionnel"
                      className={`${inputClass} pr-12 ${userOverrideIrsa.current ? 'border-amber-400 dark:border-amber-500/50' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13.5px] font-semibold text-slate-400 dark:text-slate-500">Ar</span>
                  </div>
                </div>
              </div>

              {(userOverrideCnaps.current || userOverrideOstie.current || userOverrideIrsa.current) && (
                /* ⭐ Warning : 11.5px → 13px */
                <p className="mt-3 text-[13px] leading-[1.3] flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  ⚠️ Certains champs ont une valeur personnalisée. Cliquez sur « Auto » pour rétablir le calcul automatique.
                </p>
              )}
            </div>

            {/* Net à payer — ⭐ labels 11.5px → 13px, values 13.5px → 15px */}
            <div className="mt-4 flex items-center justify-between rounded-lg border p-4 bg-brand-50 dark:bg-brand-500/10 border-slate-200 dark:border-white/[0.12]">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Net à payer</p>
                <p className="text-[15px] font-semibold text-brand-600 dark:text-brand-400 mt-1">{netAPayer.toLocaleString('fr-FR')} Ar</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Statut</p>
                <p className={`text-[15px] font-semibold mt-1 ${getStatutColor()}`}>
                  {selectedStatut === 'actif' ? 'Actif' : selectedStatut === 'inactif' ? 'Inactif' : 'En congé'}
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER — ⭐ h-14 → h-[72px], px-4 → px-5 */}
          <footer className="flex h-[72px] shrink-0 items-center justify-between gap-2 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0F172A] px-5">
            {/* ⭐ Fiche PDF : 13px → 15px, h-9 → h-10, px-3.5 → px-4.5, icon 14 → 17 */}
            <button
              type="button"
              onClick={generateFichePDF}
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 dark:border-white/[0.12] px-4.5 text-[15px] font-medium text-brand-600 dark:text-brand-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <FileText size={17} strokeWidth={2.2} /> Fiche PDF
            </button>
            <div className="flex items-center gap-2">
              {/* ⭐ Annuler : 13px → 15px, h-9 → h-10, px-3.5 → px-4.5 */}
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-lg px-4.5 text-[15px] font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              >
                Annuler
              </button>
              {/* ⭐ Submit : 13px → 15px, h-9 → h-10, px-3.5 → px-5, icons 14 → 17 */}
              <button
                type="submit"
                className="flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:scale-[0.98]"
              >
                {editingEmploye ? <Check size={17} strokeWidth={2.2} /> : <Plus size={17} strokeWidth={2.2} />}
                {editingEmploye ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default EmployesModalForm;