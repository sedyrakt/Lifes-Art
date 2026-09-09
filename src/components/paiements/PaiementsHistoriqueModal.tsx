import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Wallet, ChevronLeft, ChevronRight, CheckCircle2, Mail, Phone, Building2, Briefcase } from 'lucide-react'; 
import { useTheme } from '../../contexts/ThemeContext';
import { format, addDays, startOfMonth, startOfWeek, isSameMonth, isToday } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';

interface Paiement {
  id: number;
  employe_id: number;
  nom: string;
  prenom: string;
  poste: string;
  mois: number;
  annee: number;
  montant: number;
  mode_paiement: string;
  date_paiement: string;
  reference: string;
  observation: string;
}

interface PaiementsHistoriqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPaiement: () => void;
  historiqueData: Paiement[];
  moisLabels: string[];
  employe?: any;
}

const COLORS = {
  light: {
    card: '#FFFFFF', border: '#E2E8F0', headerBg: '#FFFFFF', softBg: '#F8FAFC',
    text: '#0F172A', muted: '#64748B', subMuted: '#94A3B8', primary: '#4F46E5',
    primaryHover: '#4338CA', primaryBg: 'rgba(79,70,229,0.08)', green: '#059669',
    greenBg: 'rgba(16,185,129,0.08)', greenBorder: 'rgba(16,185,129,0.20)',
    red: '#DC2626', redBg: 'rgba(239,68,68,0.08)', redBorder: 'rgba(239,68,68,0.20)',
    amber: '#D97706', amberBg: 'rgba(245,158,11,0.08)', amberBorder: 'rgba(245,158,11,0.20)'
  },
  dark: {
    card: '#0F172A', border: 'rgba(255,255,255,0.12)', headerBg: '#0F172A', softBg: '#0F172A',
    text: '#F8FAFC', muted: '#94A3B8', subMuted: '#94A3B8', primary: '#4F46E5',
    primaryHover: '#4338CA', primaryBg: 'rgba(79,70,229,0.12)', green: '#34D399',
    greenBg: 'rgba(16,185,129,0.11)', greenBorder: 'rgba(52,211,153,0.22)',
    red: '#F87171', redBg: 'rgba(239,68,68,0.10)', redBorder: 'rgba(248,113,113,0.20)',
    amber: '#FBBF24', amberBg: 'rgba(245,158,11,0.11)', amberBorder: 'rgba(251,191,36,0.22)'
  }
};

const PaiementsHistoriqueModal: React.FC<PaiementsHistoriqueModalProps> = ({
  isOpen, onClose, onAddPaiement, historiqueData, moisLabels, employe,
}) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;

  const [moisView, setMoisView] = useState(new Date().getMonth());
  const [anneeView, setAnneeView] = useState(new Date().getFullYear());
  const [selectedJour, setSelectedJour] = useState<Date>(new Date());

  const first = historiqueData[0] || { prenom: '', nom: '', poste: '' };
  const currentEmploye = employe || first; 

  const fullName = `${currentEmploye?.prenom || ''} ${currentEmploye?.nom || ''}`.trim() || 'Employé';
  const initials = `${currentEmploye?.prenom?.[0] || ''}${currentEmploye?.nom?.[0] || ''}`.toUpperCase() || '?';
  const poste = currentEmploye?.poste || 'Non spécifié';
  const email = currentEmploye?.email || '—';
  const telephone = currentEmploye?.telephone || '—';
  const departement = currentEmploye?.departement || '—';

  useEffect(() => {
    if (historiqueData.length > 0) {
      setMoisView(historiqueData[0].mois - 1);
      setAnneeView(historiqueData[0].annee);
    }
  }, [historiqueData]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatMontant = (value: number) => `${Number(value).toLocaleString('fr-FR')} Ar`;
  const totalPaye = historiqueData.reduce((sum, p) => sum + Number(p.montant || 0), 0);

  const daysOfWeek = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
  const calendarStart = startOfWeek(startOfMonth(new Date(anneeView, moisView, 1)), { weekStartsOn: 1 });
  const calendarDays = Array.from({ length: 42 }, (_, i) => addDays(calendarStart, i));
  const monthTitle = format(new Date(anneeView, moisView, 1), 'MMMM yyyy', { locale: frLocale });

  const prevMonth = () => setMoisView(m => m === 0 ? (setAnneeView(a => a - 1), 11) : m - 1);
  const nextMonth = () => setMoisView(m => m === 11 ? (setAnneeView(a => a + 1), 0) : m + 1);

  const isPaid = (day: Date) => historiqueData.some(p => p.mois === day.getMonth() + 1 && p.annee === day.getFullYear());

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-[14px] font-medium" style={{ color: theme.muted }}>{label}</span>
      <span className="min-w-0 text-[15px] font-semibold" style={{ color: theme.text }}>{value}</span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[99990] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm"
      style={{ background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(15,23,42,0.55)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-white/[0.12]' : 'border-slate-200'}`}
        style={{ background: theme.card }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: theme.primaryBg }}>
              <Wallet size={19} style={{ color: theme.primary }} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold" style={{ color: theme.text }}>Historique des salaires</h2>
              <p className="text-[13px]" style={{ color: theme.muted }}>{fullName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>
            <X size={19} />
          </button>
        </header>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          {historiqueData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: theme.primaryBg }}>
                <Wallet size={30} style={{ color: theme.primary }} />
              </div>
              <h3 className="text-[16px] font-semibold" style={{ color: theme.text }}>Aucun paiement</h3>
              <p className="mt-1 max-w-sm text-[14px]" style={{ color: theme.muted }}>Aucun paiement trouvé pour cet employé.</p>
              <button type="button" onClick={onAddPaiement} className="mt-6 flex h-10 items-center gap-2 rounded-lg px-5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600" style={{ background: theme.primary }}>
                <Plus size={15} /> Ajouter un paiement
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-lg">{initials}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[19px] font-bold truncate" style={{ color: theme.text }}>{fullName}</h3>
                    <p className="text-[13px] font-medium" style={{ color: theme.primary }}>{poste}</p>
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-semibold mt-1" style={{ background: theme.greenBg, borderColor: theme.greenBorder, color: theme.green }}>
                      <CheckCircle2 size={12} /> Actif
                    </span>
                  </div>
                </div>

                <div className="mt-5 border-t pt-4" style={{ borderColor: theme.border }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <div className="pb-3 mb-1.5 border-b" style={{ borderColor: theme.border }}><InfoRow label="Email" value={email} /></div>
                    <div className="pb-3 mb-1.5 border-b" style={{ borderColor: theme.border }}><InfoRow label="Téléphone" value={telephone} /></div>
                    <div className="pb-3 mb-1.5 border-b" style={{ borderColor: theme.border }}><InfoRow label="Département" value={departement} /></div>
                    <div className="pb-3 mb-1.5 border-b" style={{ borderColor: theme.border }}><InfoRow label="Poste" value={poste} /></div>
                  </div>
                </div>

                <div className="mt-5 border-t pt-4" style={{ borderColor: theme.border }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <div className="pb-3 mb-1.5 border-b" style={{ borderColor: theme.border }}><InfoRow label="Total versé" value={formatMontant(totalPaye)} /></div>
                    <div className="pb-3 mb-1.5 border-b" style={{ borderColor: theme.border }}><InfoRow label="Paiements" value={`${historiqueData.length} mois`} /></div>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Calendrier paiements</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}><ChevronLeft size={14} /></button>
                    <span className="text-[13px] font-semibold capitalize" style={{ color: theme.text }}>{monthTitle}</span>
                    <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}><ChevronRight size={14} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {daysOfWeek.map((d) => (
                    <div key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1">{d}</div>
                  ))}
                  {calendarDays.map((day, idx) => {
                    const inMonth = isSameMonth(day, new Date(anneeView, moisView, 1));
                    const isSelected = day.toDateString() === selectedJour.toDateString();
                    const isTodayDate = isToday(day);
                    const paid = isPaid(day);
                    
                    let bg = 'transparent', color = inMonth ? theme.text : theme.subMuted;
                    if (isSelected) { bg = theme.primary; color = '#fff'; }
                    else if (isTodayDate) { bg = theme.primaryBg; color = theme.primary; }
                    else if (paid) { bg = theme.greenBg; color = theme.green; }
                    
                    return (
                      <button key={idx} onClick={() => setSelectedJour(day)} className="h-8 w-full flex items-center justify-center rounded-md text-[12px] transition hover:bg-brand-500/10"
                        style={{ background: bg, color }}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-3 mt-2 text-[10px] uppercase font-semibold" style={{ color: theme.muted }}>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: theme.green }}></span>Payé</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: theme.subMuted }}></span>Aujourd'hui</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: theme.primary }}></span>Sélectionné</span>
                </div>

                <button
                  type="button"
                  onClick={onAddPaiement}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg h-10 text-[14px] font-semibold text-white transition hover:opacity-90"
                  style={{ background: theme.primary }}
                >
                  <Plus size={15} /> Payer ce mois
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: theme.border, background: theme.softBg }}>
          <button type="button" onClick={onAddPaiement} className="flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600" style={{ background: theme.primary }}>
            <Plus size={15} /> PAYER
          </button>
          <button type="button" onClick={onClose} className="h-10 rounded-lg px-5 text-[14px] font-medium hover:bg-slate-100 dark:hover:bg-white/5" style={{ color: theme.muted }}>FERMER</button>
        </div>
      </div>
    </div>
  );
};

export default PaiementsHistoriqueModal;