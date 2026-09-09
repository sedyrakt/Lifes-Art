import React, { useEffect, useState, useMemo } from 'react';
import { X, Save, CalendarDays, Clock3, Timer, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: { card: '#FFFFFF', border: '#E2E8F0', softBg: '#F8FAFC', text: '#0F172A', muted: '#64748B', primary: '#4F46E5', green: '#059669', red: '#DC2626', amber: '#D97706' },
  dark: { card: '#0F172A', border: 'rgba(255,255,255,0.12)', softBg: '#0F172A', text: '#F8FAFC', muted: '#94A3B8', primary: '#4F46E5', green: '#34D399', red: '#F87171', amber: '#FBBF24' }
};

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
  isOpen, onClose, employe, mois, annee, moisLabels,
  onSave, loadPresence, mode = 'monthly', date, onSaveDaily, loadPresenceJournaliere,
}) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [monthlyForm, setMonthlyForm] = useState({ jours_absences: 0, jours_conges: 0, jours_maladie: 0, justificatif_maladie: '', observation: '' });
  const [dailyForm, setDailyForm] = useState({ statut: 'present', heure_arrivee: '', heure_depart: '', heure_debut: '', heure_fin: '', observation: '' });

  // Calculated fields
  const [calcData, setCalcData] = useState({ retard: 0, heures_travaillees: '0h00', heures_sup: 0 });

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
            heure_debut: data?.heure_debut || '',
            heure_fin: data?.heure_fin || '',
            observation: data?.observation || '',
          });
        } else {
          setDailyForm({ statut: 'present', heure_arrivee: '', heure_depart: '', heure_debut: '', heure_fin: '', observation: '' });
        }
      }).finally(() => setLoading(false));
    }
  }, [isOpen, employe, mode, mois, annee, date, loadPresence, loadPresenceJournaliere]);

  // ⭐ KAJY AUTOMATIQUE (Retard, HS, Heures travaillées)
  useEffect(() => {
    const [hA, mA] = (dailyForm.heure_arrivee || '00:00').split(':').map(Number);
    const [hD, mD] = (dailyForm.heure_depart || '00:00').split(':').map(Number);
    const [hDeb, mDeb] = (dailyForm.heure_debut || '08:00').split(':').map(Number);
    const [hFin, mFin] = (dailyForm.heure_fin || '17:00').split(':').map(Number);
    
    // Retard
    let retardMin = 0;
    if (dailyForm.heure_arrivee && dailyForm.heure_debut) {
      const arriveeMin = hA * 60 + mA;
      const debutMin = hDeb * 60 + mDeb;
      retardMin = Math.max(0, arriveeMin - debutMin);
    }

    // Heures travaillées
    let totalMinutes = 0;
    if (dailyForm.heure_arrivee && dailyForm.heure_depart) {
      const arriveeMin = hA * 60 + mA;
      const departMin = hD * 60 + mD;
      if (departMin > arriveeMin) totalMinutes = departMin - arriveeMin;
    }
    
    // Heures sup (plus que 8h ou plus que le planning)
    let hsMin = 0;
    if (dailyForm.heure_arrivee && dailyForm.heure_depart && dailyForm.heure_fin) {
      const finMin = hFin * 60 + mFin;
      const departMin = hD * 60 + mD;
      if (departMin > finMin) hsMin = departMin - finMin;
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    setCalcData({ 
      retard: retardMin,
      heures_travaillees: `${hours}h${String(mins).padStart(2, '0')}`,
      heures_sup: Math.floor(hsMin / 60) + ((hsMin % 60) / 60)
    });
  }, [dailyForm.heure_arrivee, dailyForm.heure_depart, dailyForm.heure_debut, dailyForm.heure_fin]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === 'monthly') {
        await onSave?.({ employe_id: employe.id, mois, annee, ...monthlyForm });
      } else {
        await onSaveDaily?.({ employe_id: employe.id, date, ...dailyForm, retard: calcData.retard, heures_sup: calcData.heures_sup, heures_travaillees: calcData.heures_travaillees });
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
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border shadow-2xl" style={{ background: theme.card, borderColor: theme.border }} onMouseDown={(e) => e.stopPropagation()}>
        
        {/* Header standard */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(79,70,229,0.06)' }}>
              {mode === 'monthly' ? <CalendarDays size={19} style={{ color: theme.primary }} /> : <Clock3 size={19} style={{ color: theme.primary }} />}
            </div>
            <div>
              <h3 className="text-[17px] font-bold" style={{ color: theme.text }}>
                {mode === 'monthly' ? 'Gestion mensuelle' : 'Présence journalière'}
              </h3>
              <p className="text-[13px]" style={{ color: theme.muted }}>
                {employe?.prenom} {employe?.nom} 
                {mode === 'daily' && ` · ${date}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}><X size={19} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-[14px]" style={{ color: theme.muted }}>Chargement...</div>
          ) : mode === 'monthly' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-medium mb-1" style={{ color: theme.muted }}>Jours d'absences</label>
                <input type="number" min="0" value={monthlyForm.jours_absences} onChange={(e) => setMonthlyForm({ ...monthlyForm, jours_absences: Number(e.target.value) })} className="w-full h-10 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
              </div>
              <div>
                <label className="block text-[14px] font-medium mb-1" style={{ color: theme.muted }}>Jours de congés (payés)</label>
                <input type="number" min="0" value={monthlyForm.jours_conges} onChange={(e) => setMonthlyForm({ ...monthlyForm, jours_conges: Number(e.target.value) })} className="w-full h-10 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
              </div>
              <div>
                <label className="block text-[14px] font-medium mb-1" style={{ color: theme.muted }}>Jours de maladie</label>
                <input type="number" min="0" value={monthlyForm.jours_maladie} onChange={(e) => setMonthlyForm({ ...monthlyForm, jours_maladie: Number(e.target.value) })} className="w-full h-10 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
              </div>
              <div>
                <label className="block text-[14px] font-medium mb-1" style={{ color: theme.muted }}>Certificat médical</label>
                <input type="text" value={monthlyForm.justificatif_maladie} onChange={(e) => setMonthlyForm({ ...monthlyForm, justificatif_maladie: e.target.value })} placeholder="N° Certificat..." className="w-full h-10 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
              </div>
              <div className="col-span-2">
                <label className="block text-[14px] font-medium mb-1" style={{ color: theme.muted }}>Observation RH</label>
                <textarea rows={3} value={monthlyForm.observation} onChange={(e) => setMonthlyForm({ ...monthlyForm, observation: e.target.value })} className="w-full px-3 py-2 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Statut */}
              <div>
                <label className="block text-[14px] font-medium mb-2" style={{ color: theme.muted }}>Statut</label>
                <div className="flex gap-2">
                  {['present', 'absent', 'conge'].map((statut) => (
                    <button key={statut} type="button" onClick={() => setDailyForm({ ...dailyForm, statut })} className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${dailyForm.statut === statut ? (statut === 'present' ? 'bg-success-50 text-success-700 border border-success-200' : statut === 'absent' ? 'bg-danger-50 text-danger-700 border border-danger-200' : 'bg-warning-50 text-warning-700 border border-warning-200') : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`} style={{ borderColor: theme.border, color: theme.text }}>
                      {statut === 'present' ? 'Présent' : statut === 'absent' ? 'Absent' : 'Congé'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Heures */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-medium mb-1" style={{ color: theme.muted }}>Heure prévue (Début)</label>
                  <input type="time" value={dailyForm.heure_debut} onChange={(e) => setDailyForm({ ...dailyForm, heure_debut: e.target.value })} className="w-full h-10 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
                </div>
                <div>
                  <label className="block text-[14px] font-medium mb-1" style={{ color: theme.muted }}>Heure prévue (Fin)</label>
                  <input type="time" value={dailyForm.heure_fin} onChange={(e) => setDailyForm({ ...dailyForm, heure_fin: e.target.value })} className="w-full h-10 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
                </div>
                <div>
                  <label className="block text-[14px] font-medium mb-1" style={{ color: theme.muted }}>Heure d'arrivée</label>
                  <input type="time" value={dailyForm.heure_arrivee} onChange={(e) => setDailyForm({ ...dailyForm, heure_arrivee: e.target.value })} className="w-full h-10 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
                </div>
                <div>
                  <label className="block text-[14px] font-medium mb-1" style={{ color: theme.muted }}>Heure de départ</label>
                  <input type="time" value={dailyForm.heure_depart} onChange={(e) => setDailyForm({ ...dailyForm, heure_depart: e.target.value })} className="w-full h-10 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
                </div>
              </div>

              {/* ⭐ KAJY AUTOMATIQUE */}
              <div className="rounded-xl border p-4" style={{ borderColor: theme.border, background: theme.softBg }}>
                <div className="flex justify-between text-[14px] py-1">
                  <span style={{ color: theme.muted }}>Retard</span>
                  <span className="font-semibold" style={{ color: theme.amber }}>{calcData.retard} min</span>
                </div>
                <div className="flex justify-between text-[14px] py-1">
                  <span style={{ color: theme.muted }}>Heures travaillées</span>
                  <span className="font-semibold" style={{ color: theme.text }}>{calcData.heures_travaillees}</span>
                </div>
                <div className="flex justify-between text-[14px] py-1">
                  <span style={{ color: theme.muted }}>Heures supplémentaires</span>
                  <span className="font-semibold" style={{ color: theme.primary }}>{calcData.heures_sup}h</span>
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-medium mb-1" style={{ color: theme.muted }}>Observation</label>
                <textarea rows={2} value={dailyForm.observation} onChange={(e) => setDailyForm({ ...dailyForm, observation: e.target.value })} className="w-full px-3 py-2 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg">
            <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployesPresenceModal;