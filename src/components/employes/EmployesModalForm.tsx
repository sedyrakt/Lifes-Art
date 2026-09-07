import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Plus, Check, Wallet, FileText, Calculator } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  light: {
    card: '#FFFFFF',
    border: '#E2E8F0',
    headerBg: '#FFFFFF',
    inputBg: '#FFFFFF',
    softBg: '#F8FAFC',
    text: '#0F172A',
    muted: '#64748B',
    subMuted: '#94A3B8',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,0.08)',
    primaryBorder: 'rgba(79,70,229,0.20)',
    danger: '#DC2626',
    success: '#059669',
    warning: '#F59E0B',
  },
  dark: {
    card: '#0F172A',
    border: 'rgba(255,255,255,0.12)',
    headerBg: '#0F172A',
    inputBg: '#0F172A',
    softBg: '#1E293B',
    text: '#F8FAFC',
    muted: '#94A3B8',
    subMuted: '#94A3B8',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryBg: 'rgba(79,70,229,0.12)',
    primaryBorder: 'rgba(79,70,229,0.28)',
    danger: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
  },
};

interface Employe {
  id?: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  poste?: string;
  departement?: string;
  date_embauche?: string;
  salaire?: number;
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

const FormField: React.FC<{ label: string; children: React.ReactNode; required?: boolean; fullWidth?: boolean; }> = ({ label, children, required = false, fullWidth = false }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;
  return (
    <div className={`min-w-0 ${fullWidth ? 'w-full' : ''}`}>
      <label className="mb-1.5 block text-[15px] font-medium" style={{ color: theme.muted }}>
        {label}{required && <span className="ml-1 text-brand-500">*</span>}
      </label>
      {children}
    </div>
  );
};

const EmployesModalForm: React.FC<EmployesModalFormProps> = ({ isOpen, onClose, onSubmit, editingEmploye, isDark: propIsDark }) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;
  const theme = isDark ? COLORS.dark : COLORS.light;
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedDepartement, setSelectedDepartement] = useState<string>('');
  const [selectedStatut, setSelectedStatut] = useState<string>('actif');

  const [salaireBrut, setSalaireBrut] = useState<number>(0);
  const [cnaps, setCnaps] = useState<number>(0);
  const [ostie, setOstie] = useState<number>(0);
  const [irsa, setIrsa] = useState<number>(0);
  const [netAPayer, setNetAPayer] = useState<number>(0);

  const calculatePayroll = (brut: number) => {
    const calcCnaps = Math.round(brut * 0.01);
    const calcOstie = Math.round(brut * 0.05);
    let calcIrsa = 0;
    const taxable = brut - calcCnaps - calcOstie;
    if (taxable > 350000 && taxable <= 700000) calcIrsa = Math.round((taxable - 350000) * 0.05);
    else if (taxable > 700000 && taxable <= 1400000) calcIrsa = Math.round((taxable - 700000) * 0.10 + 17500);
    else if (taxable > 1400000 && taxable <= 3000000) calcIrsa = Math.round((taxable - 1400000) * 0.15 + 87500);
    else if (taxable > 3000000) calcIrsa = Math.round((taxable - 3000000) * 0.20 + 327500);

    setCnaps(calcCnaps);
    setOstie(calcOstie);
    setIrsa(calcIrsa);
    setNetAPayer(Math.max(0, brut - calcCnaps - calcOstie - calcIrsa));
  };

  const getStatutColor = () => {
    if (selectedStatut === 'actif') return theme.success;
    if (selectedStatut === 'inactif') return theme.danger;
    if (selectedStatut === 'en_conge') return theme.warning;
    return theme.muted;
  };

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDepartement(editingEmploye?.departement || '');
    setSelectedStatut(editingEmploye?.status || 'actif');
    const brut = Number(editingEmploye?.salaire) || 0;
    setSalaireBrut(brut);
    calculatePayroll(brut);
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

  if (!isOpen) return null;

  const inputClass = `h-11 w-full rounded-lg border px-3 text-[15px] font-medium outline-none transition-all placeholder:text-gray-400 focus:ring-2 dark:placeholder:text-gray-500`;
  const inputStyle = { background: theme.inputBg, borderColor: theme.border, color: theme.text };
  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = theme.primary;
    e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.primaryBg}`;
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = theme.border;
    e.currentTarget.style.boxShadow = 'none';
  };

  const generateFichePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const companyName = "Life's Art";
    const employeeFullName = `${formRef.current?.querySelector<HTMLInputElement>('input[name="prenom"]')?.value || ''} ${formRef.current?.querySelector<HTMLInputElement>('input[name="nom"]')?.value || ''}`.trim();
    const poste = formRef.current?.querySelector<HTMLInputElement>('input[name="poste"]')?.value || 'Non spécifié';

    doc.setFillColor(79, 70, 229); // ⭐ INDIGO
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 14, 8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Fiche Employé', doc.internal.pageSize.getWidth() - 14, 8, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Employé : ${employeeFullName}`, 14, 20);
    doc.text(`Poste : ${poste}`, 14, 26);
    doc.text(`Statut : ${selectedStatut === 'actif' ? 'Actif' : selectedStatut === 'inactif' ? 'Inactif' : 'En congé'}`, 14, 32);

    autoTable(doc, {
      startY: 40,
      head: [['Rubrique', 'Montant (Ar)']],
      body: [
        ['Salaire Brut', `${salaireBrut.toLocaleString('fr-FR')}`],
        ['CNaPS (1%)', `${cnaps.toLocaleString('fr-FR')}`],
        ['OSTIE (5%)', `${ostie.toLocaleString('fr-FR')}`],
        ['IRSA', `${irsa.toLocaleString('fr-FR')}`],
        ['NET À PAYER', `${netAPayer.toLocaleString('fr-FR')}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });

    doc.setFontSize(8);
    doc.setTextColor(150);
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
        className="relative z-[100000] flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-xl"
        style={{ background: theme.card, borderColor: theme.border }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-500" />

        <header className="flex h-14 shrink-0 items-center justify-between border-b px-6" style={{ background: theme.headerBg, borderColor: theme.border }}>
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: theme.primaryBg, color: theme.primary }}>
              <User size={16} strokeWidth={2} />
            </div>
            <h2 id="employe-modal-title" className="truncate text-[16px] font-semibold tracking-tight" style={{ color: theme.text }}>
              {editingEmploye ? 'Modifier l\'employé' : 'Nouvel employé'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]" style={{ color: theme.muted }}>
            <X size={17} strokeWidth={2} />
          </button>
        </header>

        <form ref={formRef} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField label="Prénom" required>
                <input type="text" name="prenom" defaultValue={editingEmploye?.prenom || ''} required autoFocus={!editingEmploye} placeholder="Prenom" className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>

              <FormField label="Nom" required>
                <input type="text" name="nom" defaultValue={editingEmploye?.nom || ''} required placeholder="Nom" className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>

              <FormField label="Poste" required>
                <input type="text" name="poste" defaultValue={editingEmploye?.poste || ''} required placeholder="Poste" className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>

              <FormField label="Email" required>
                <input type="email" name="email" defaultValue={editingEmploye?.email || ''} required placeholder="Addresse Email" className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>

              <FormField label="Téléphone">
                <input type="tel" name="telephone" defaultValue={editingEmploye?.telephone || ''} placeholder="Telephone" className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>

              <FormField label="Département">
                <div className="relative">
                  <select name="departement" value={selectedDepartement} onChange={(e) => setSelectedDepartement(e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-8`} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                    {DEPARTEMENTS.map((dep) => <option key={dep.value} value={dep.value}>{dep.label}</option>)}
                  </select>
                </div>
              </FormField>

              <FormField label="Date d'embauche" required>
                <input type="date" name="date_embauche" defaultValue={editingEmploye?.date_embauche || new Date().toISOString().split('T')[0]} required className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </FormField>

              <FormField label="Salaire (Ar)" required>
                <input
                  type="number"
                  name="salaire"
                  value={salaireBrut}
                  onChange={(e) => { setSalaireBrut(Number(e.target.value)); calculatePayroll(Number(e.target.value)); }}
                  min="0" step="1" required
                  className={inputClass} style={inputStyle}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </FormField>

              <FormField label="Statut">
                <div className="relative">
                  <select name="status" value={selectedStatut} onChange={(e) => setSelectedStatut(e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-8`} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                    {STATUT_OPTIONS.map((statut) => <option key={statut.value} value={statut.value}>{statut.label}</option>)}
                  </select>
                </div>
              </FormField>
            </div>

            <div
              className="mt-5 flex items-center justify-between rounded-lg border p-4"
              style={{ background: theme.primaryBg, borderColor: theme.border }}
            >
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>
                  Net à payer
                </p>
                <p className="text-[18px] font-bold" style={{ color: theme.primary }}>
                  {netAPayer.toLocaleString('fr-FR')} Ar
                </p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>
                  Statut
                </p>
                <p className="text-[15px] font-bold" style={{ color: getStatutColor() }}>
                  {selectedStatut === 'actif' ? 'Actif' : selectedStatut === 'inactif' ? 'Inactif' : 'En congé'}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border p-3" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2 mb-2">
                <Calculator size={16} style={{ color: theme.primary }} />
                <span className="text-sm font-semibold" style={{ color: theme.muted }}>Détail salaire :</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-sm" style={{ color: theme.muted }}>
                  Salaire brut : <span className="text-sm font-semibold" style={{ color: theme.text }}>{salaireBrut.toLocaleString('fr-FR')} Ar</span>
                </div>
                <div className="text-sm" style={{ color: theme.muted }}>
                  CNaPS (1%) : <span className="text-sm font-semibold" style={{ color: theme.danger }}>{cnaps.toLocaleString('fr-FR')} Ar</span>
                </div>
                <div className="text-sm" style={{ color: theme.muted }}>
                  OSTIE (5%) : <span className="text-sm font-semibold" style={{ color: theme.danger }}>{ostie.toLocaleString('fr-FR')} Ar</span>
                </div>
                <div className="text-sm" style={{ color: theme.muted }}>
                  IRSA : <span className="text-sm font-semibold" style={{ color: theme.danger }}>{irsa.toLocaleString('fr-FR')} Ar</span>
                </div>
              </div>
            </div>
          </div>

          <footer className="flex h-[64px] shrink-0 items-center justify-between gap-2 border-t px-6" style={{ background: theme.softBg, borderColor: theme.border }}>
            <button
              type="button"
              onClick={generateFichePDF}
              className="flex h-10 items-center gap-1.5 rounded-lg border px-4 text-[14px] font-medium hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              style={{ borderColor: theme.border, color: theme.primary }}
            >
              <FileText size={15} /> Fiche PDF
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="h-10 rounded-lg px-5 text-[14px] font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]" style={{ color: theme.muted }}>
                Annuler
              </button>
              <button type="submit" className="flex h-10 items-center gap-1.5 rounded-lg px-5 text-[14px] font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]" style={{ background: theme.primary }} onMouseEnter={(event) => { event.currentTarget.style.background = theme.primaryHover; }} onMouseLeave={(event) => { event.currentTarget.style.background = theme.primary; }}>
                {editingEmploye ? <Check size={15} /> : <Plus size={15} />}
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