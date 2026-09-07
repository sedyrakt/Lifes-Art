

import React, { useEffect, useState } from 'react';
import { X, Save, CalendarDays, Clock3 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employe: any;
  mois?: number;
  annee?: number;
  moisLabels?: string[];
  onSave?: (data: any) => Promise<any>;
  loadPresence?: (employeId: number, mois: number, annee: number) => Promise<any>;
  mode?: 'monthly' | 'daily';
  date?: string;
  onSaveDaily?: (data: any) => Promise<any>;
  loadPresenceJournaliere?: (employeId: number, date: string) => Promise<any>;
}

const EmployesPresenceModal: React.FC<Props> = ({
  isOpen, onClose, employe,
  mois, annee, moisLabels,
  onSave, loadPresence,
  mode = 'monthly',
  date,
  onSaveDaily,
  loadPresenceJournaliere,
}) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Monthly form state
  const [monthlyForm, setMonthlyForm] = useState({
    jours_absences: 0,
    jours_conges: 0,
    jours_maladie: 0,
    justificatif_maladie: '',
    observation: '',
  });

  // Daily form state
  const [dailyForm, setDailyForm] = useState({
    statut: 'present',
    heure_arrivee: '',
    heure_depart: '',
    observation: '',
  });

  useEffect(() => {
    if (!isOpen || !employe) return;

    if (mode === 'monthly') {
      if (!mois || !annee) return;
      setLoading(true);
      loadPresence?.(employe.id, mois, annee).then(data => {
        setMonthlyForm({
          jours_absences: Number(data?.jours_absences || 0),
          jours_conges: Number(data?.jours_conges || 0),
          jours_maladie: Number(data?.jours_maladie || 0),
          justificatif_maladie: String(data?.justificatif_maladie || ''),
          observation: String(data?.observation || ''),
        });
      }).finally(() => setLoading(false));
    } else if (mode === 'daily') {
      if (!date) return;
      setLoading(true);
      loadPresenceJournaliere?.(employe.id, date).then(data => {
        if (data) {
          setDailyForm({
            statut: data?.statut || 'present',
            heure_arrivee: data?.heure_arrivee || '',
            heure_depart: data?.heure_depart || '',
            observation: data?.observation || '',
          });
        } else {
          setDailyForm({ statut: 'present', heure_arrivee: '', heure_depart: '', observation: '' });
        }
      }).finally(() => setLoading(false));
    }
  }, [isOpen, employe, mode, mois, annee, date, loadPresence, loadPresenceJournaliere]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === 'monthly') {
        await onSave?.({ employe_id: employe.id, mois, annee, ...monthlyForm });
      } else {
        await onSaveDaily?.({ employe_id: employe.id, date, ...dailyForm });
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-slate-800 shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {mode === 'monthly' ? <CalendarDays size={20} className="text-brand-500 dark:text-brand-400" /> : <Clock3 size={20} className="text-brand-500 dark:text-brand-400" />}
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {mode === 'monthly' ? 'Gestion mensuelle' : 'Présence journalière'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-brand-500 dark:hover:text-brand-400"><X size={20} /></button>
        </div>

        <div className="space-y-4">
        
          <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-sm text-slate-700 dark:text-slate-200">
            <span className="font-semibold">Employé :</span> {employe?.prenom} {employe?.nom}
            <br />
            {mode === 'monthly' ? (
              <><span className="font-semibold">Période :</span> {moisLabels?.[mois - 1]} {annee}</>
            ) : (
              <><span className="font-semibold">Date :</span> {date}</>
            )}
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">Chargement...</div>
          ) : mode === 'monthly' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Jours d'absences</label>
                <input type="number" min="0" value={monthlyForm.jours_absences} onChange={(e) => setMonthlyForm({ ...monthlyForm, jours_absences: Number(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Jours de congés (payés)</label>
                <input type="number" min="0" value={monthlyForm.jours_conges} onChange={(e) => setMonthlyForm({ ...monthlyForm, jours_conges: Number(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Jours de maladie</label>
                <input type="number" min="0" value={monthlyForm.jours_maladie} onChange={(e) => setMonthlyForm({ ...monthlyForm, jours_maladie: Number(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Certificat médical</label>
                <input type="text" value={monthlyForm.justificatif_maladie} onChange={(e) => setMonthlyForm({ ...monthlyForm, justificatif_maladie: e.target.value })} placeholder="N° Certificat..." className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Observation</label>
                <textarea rows={2} value={monthlyForm.observation} onChange={(e) => setMonthlyForm({ ...monthlyForm, observation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Statut</label>
                <div className="flex gap-2">
                  {['present', 'absent', 'conge'].map((statut) => (
                    <button
                      key={statut}
                      type="button"
                      onClick={() => setDailyForm({ ...dailyForm, statut })}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                        dailyForm.statut === statut
                          ? statut === 'present'
                            ? 'bg-success-50 text-success-700 border border-success-200'
                            : statut === 'absent'
                            ? 'bg-danger-50 text-danger-700 border border-danger-200'
                            : 'bg-warning-50 text-warning-700 border border-warning-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {statut === 'present' ? 'Présent' : statut === 'absent' ? 'Absent' : 'Congé'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Heure d'arrivée</label>
                  <input type="time" value={dailyForm.heure_arrivee} onChange={(e) => setDailyForm({ ...dailyForm, heure_arrivee: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Heure de départ</label>
                  <input type="time" value={dailyForm.heure_depart} onChange={(e) => setDailyForm({ ...dailyForm, heure_depart: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Observation</label>
                <textarea rows={2} value={dailyForm.observation} onChange={(e) => setDailyForm({ ...dailyForm, observation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg">
            <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployesPresenceModal;