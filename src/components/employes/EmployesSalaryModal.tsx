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
            <TrendingUp size={20} className="text-brand-500 dark:text-brand-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Augmentation de salaire</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-brand-500 dark:hover:text-brand-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 px-6 pb-6">
          <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-sm text-slate-700 dark:text-slate-200">
            <span className="font-semibold">Employé :</span> {employe?.prenom} {employe?.nom}
            <br />
            <span className="font-semibold">Salaire actuel :</span> {Number(employe?.salaire || 0).toLocaleString('fr-FR')} Ar
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nouveau salaire</label>
            <input
              type="number"
              min="0"
              value={newSalary}
              onChange={(e) => setNewSalary(Number(e.target.value))}
              placeholder="Ex: 1 200 000"
              className={`w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${error ? 'border-red-500' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Motif</label>
            <input
              type="text"
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              placeholder="Ex: Promotion, Performance..."
              className={`w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${error ? 'border-red-500' : ''}`}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployesSalaryModal;