// src/components/employes/EmployesSalaryModal.tsx
// ⭐ FONT SIZE: h3 18px, labels 14px, inputs 15px, buttons 15px

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Save } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const LOGO_DARK = './images/logolight.png';
const LOGO_LIGHT = './images/logolight.png';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employe: any;
  onSave: (employeId: number, newSalary: number, raison: string) => Promise<any>;
}

const EmployesSalaryModal: React.FC<Props> = ({ isOpen, onClose, employe, onSave }) => {
  const { isDark } = useTheme();
  const [newSalary, setNewSalary] = useState(Number(employe?.salaire) || 0);
  const [raison, setRaison] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const logoSrc = isDark ? LOGO_DARK : LOGO_LIGHT;

  useEffect(() => {
    if (isOpen) {
      setNewSalary(Number(employe?.salaire) || 0);
      setRaison('');
      setSaving(false);
      setError('');
    }
  }, [isOpen, employe]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (newSalary <= 0) {
      setError('Le salaire doit être supérieur à 0.');
      return;
    }
    if (!raison.trim()) {
      setError('Veuillez indiquer un motif.');
      return;
    }
    try {
      setSaving(true);
      await onSave(employe.id, newSalary, raison.trim());
      onClose(); 
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
   
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] shadow-xl">
        <div className="flex items-center justify-center pt-6 pb-2">
          <img src={logoSrc} alt="TahiryPro" className="w-20 h-auto object-contain" />
        </div>

        <div className="flex items-center justify-between mb-4 px-6">
          <div className="flex items-center gap-2 text-center m-auto">
            {/* ⭐ Icon : 20 → 22 */}
            <TrendingUp size={22} className="text-brand-500 dark:text-brand-400" />
            {/* ⭐ h3 : text-lg (18px) → text-[20px] */}
            <h3 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">Augmentation de salaire</h3>
          </div>
          {/* ⭐ Close icon : 20 → 22 */}
          <button onClick={onClose} className="text-slate-400 hover:text-brand-500 dark:hover:text-brand-400">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4 px-6 pb-6">
          {/* ⭐ Info card : text-sm (14px) → text-[15px], p-3 → p-4 */}
          <div className="p-4 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-[15px] leading-[1.6] text-slate-700 dark:text-slate-200">
            <span className="font-semibold">Employé :</span> {employe?.prenom} {employe?.nom}
            <br />
            <span className="font-semibold">Salaire actuel :</span> {Number(employe?.salaire || 0).toLocaleString('fr-FR')} Ar
          </div>

          <div>
            {/* ⭐ Label : text-sm (14px) → text-[14px], mb-1 → mb-1.5 */}
            <label className="block text-[14px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nouveau salaire</label>
            {/* ⭐ Input : h-10 → h-11, px-3 → px-3.5, text-sm → text-[15px] */}
            <input
              type="number"
              min="0"
              value={newSalary}
              onChange={(e) => setNewSalary(Number(e.target.value))}
              placeholder="Ex: 1 200 000"
              className={`w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] text-[15px] font-medium text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${error ? 'border-red-500' : ''}`}
            />
          </div>
          <div>
            {/* ⭐ Label : text-sm (14px) → text-[14px], mb-1 → mb-1.5 */}
            <label className="block text-[14px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Motif</label>
            {/* ⭐ Input : h-10 → h-11, px-3 → px-3.5, text-sm → text-[15px] */}
            <input
              type="text"
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              placeholder="Ex: Promotion, Performance..."
              className={`w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] text-[15px] font-medium text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${error ? 'border-red-500' : ''}`}
            />
          </div>

          {/* ⭐ Error : text-sm (14px) → text-[15px] */}
          {error && <p className="text-[15px] text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-6 pb-6">
          {/* ⭐ Annuler : px-4 py-2 text-sm → px-4.5 py-3 text-[15px] */}
          <button
            onClick={onClose}
            className="px-4.5 py-3 text-[15px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg"
          >
            Annuler
          </button>
          {/* ⭐ Enregistrer : px-4 py-2 text-sm → px-5 py-3 text-[15px], icon 16 → 17 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-3 text-[15px] font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg disabled:opacity-50"
          >
            <Save size={17} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployesSalaryModal;