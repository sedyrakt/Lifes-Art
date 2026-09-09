import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { X, CalendarDays, Loader2, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight, BarChart3, History, Search, Timer, Clock3 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  light: { card: '#FFFFFF', border: '#E2E8F0', softBg: '#F8FAFC', text: '#0F172A', muted: '#64748B', primary: '#4F46E5', green: '#059669', red: '#DC2626', amber: '#D97706' },
  dark: { card: '#0F172A', border: 'rgba(255,255,255,0.12)', softBg: '#0F172A', text: '#F8FAFC', muted: '#94A3B8', primary: '#4F46E5', green: '#34D399', red: '#F87171', amber: '#FBBF24' }
};

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const PAGE_SIZE = 10;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employes?: any[];
  employeId?: number;
  mois?: number;
  annee?: number;
  dateReference?: string | null;
}

const EmployesHistoriqueModal: React.FC<Props> = ({ isOpen, onClose, employes = [], employeId, mois, annee, dateReference }) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;
  const [activeTab, setActiveTab] = useState<'historique' | 'bilan'>('historique');
  const [type, setType] = useState<'jour' | 'mois' | 'annee'>('mois');
  const [date, setDate] = useState(dateReference || new Date().toISOString().split('T')[0]);
  const [moisState, setMoisState] = useState(mois || new Date().getMonth() + 1);
  const [anneeState, setAnneeState] = useState(annee || new Date().getFullYear());
  const [statut, setStatut] = useState('Tous');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(employeId || null);
  const [allEmployes, setAllEmployes] = useState<any[]>(employes);
  const [certificatMedical, setCertificatMedical] = useState('');
  const [observation, setObservation] = useState('');
  const [joursMaladie, setJoursMaladie] = useState('0');

  useEffect(() => {
    if (isOpen) {
      setMoisState(mois || new Date().getMonth() + 1);
      setAnneeState(annee || new Date().getFullYear());
    }
  }, [isOpen, mois, annee]);

  useEffect(() => {
    if (activeTab === 'historique') {
      setSelectedEmployeeId(null);
      setEmployeeSearch('');
    }
  }, [activeTab]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const requestType = activeTab === 'bilan' ? 'mois' : type;
      const employeIdForRequest = activeTab === 'bilan' ? (selectedEmployeeId || undefined) : undefined;
      const response = await window.api.employes.getPresenceHistorique({ 
        type: requestType, date, mois: moisState, annee: anneeState, statut, employe_id: employeIdForRequest
      });
      if (response?.success) setData(response.data || []);
    } catch (error) { console.error('Erreur historique:', error); }
    finally { setLoading(false); }
  }, [type, date, moisState, anneeState, statut, selectedEmployeeId, activeTab]);

  const fetchAllEmployes = useCallback(async () => {
    if (allEmployes.length > 0) return;
    try {
      const response = await window.api.employes.getAll({ limit: 10000 });
      if (response?.success) setAllEmployes(response.data || []);
    } catch (error) { console.error('Erreur chargement employés:', error); }
  }, [allEmployes.length]);

  useEffect(() => { 
    if (isOpen) { fetchData(); fetchAllEmployes(); }
  }, [isOpen, fetchData, fetchAllEmployes]);

  useEffect(() => { setCurrentPage(1); }, [type, date, moisState, anneeState, statut, selectedEmployeeId, activeTab]);

  const stats = useMemo(() => {
    return {
      total: data.length,
      presents: data.filter(d => d.statut === 'present').length,
      absents: data.filter(d => d.statut === 'absent').length,
      conges: data.filter(d => d.statut === 'conge').length,
      retards: data.reduce((sum, d) => sum + Number(d.minutes_retard || 0), 0),
      hs: data.reduce((sum, d) => sum + Number(d.heures_sup || 0), 0),
    };
  }, [data]);

  const bilanMonthData = useMemo(() => {
    if (activeTab !== 'bilan') return data;
    const daysInMonth = new Date(anneeState, moisState, 0).getDate();
    const result = [];
    const selectedEmp = allEmployes.find(e => e.id === selectedEmployeeId);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${anneeState}-${String(moisState).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const existing = data.find(d => d.date === dateStr);
      if (existing) result.push(existing);
      else result.push({ date: dateStr, prenom: selectedEmp?.prenom || '', nom: selectedEmp?.nom || '', statut: null, minutes_retard: 0, heures_sup: 0 });
    }
    return result;
  }, [data, activeTab, moisState, anneeState, selectedEmployeeId, allEmployes]);

  const paginatedData = useMemo(() => {
    if (activeTab === 'bilan') return bilanMonthData;
    const start = (currentPage - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  }, [bilanMonthData, data, currentPage, activeTab]);

  const totalPages = useMemo(() => {
    if (activeTab === 'bilan') return 1;
    return Math.ceil(data.length / PAGE_SIZE);
  }, [data.length, activeTab]);

  const filteredEmployees = useMemo(() => {
    const search = employeeSearch.toLowerCase();
    const list = allEmployes.length > 0 ? allEmployes : employes;
    return list.filter(emp => `${emp.prenom || ''} ${emp.nom || ''}`.toLowerCase().includes(search));
  }, [allEmployes, employes, employeeSearch]);

  const handleSaveBilan = useCallback(async () => {
    if (!selectedEmployeeId) { alert('Veuillez sélectionner un employé avant d\'enregistrer.'); return; }
    try {
      const payload = {
        employe_id: selectedEmployeeId, mois: moisState, annee: anneeState,
        jours_absences: stats.absents, jours_conges: stats.conges,
        jours_maladie: Number(joursMaladie) || 0, justificatif_maladie: certificatMedical,
        observation: observation
      };
      const result = await window.api.employes.updatePresence(payload);
      if (result?.success) alert('Bilan mensuel enregistré avec succès.');
      else alert('Erreur lors de l\'enregistrement : ' + (result?.error || 'inconnue'));
    } catch (error: any) { alert('Erreur : ' + error.message); }
  }, [selectedEmployeeId, moisState, anneeState, stats.absents, stats.conges, joursMaladie, certificatMedical, observation]);

  if (!isOpen) return null;
  const handlePageChange = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border shadow-2xl" style={{ background: theme.card, borderColor: theme.border }} onMouseDown={(e) => e.stopPropagation()}>
        
        <div className="shrink-0 border-b p-4 flex items-center justify-between" style={{ borderColor: theme.border, background: theme.card }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(79,70,229,0.06)' }}><CalendarDays size={19} style={{ color: theme.primary }} /></div>
            <h2 className="text-[17px] font-bold" style={{ color: theme.text }}>Gestion des présences</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-brand-500"><X size={20} /></button>
        </div>

        <div className="shrink-0 border-b px-4 pt-3 pb-0 flex gap-2" style={{ borderColor: theme.border, background: theme.card }}>
          <button onClick={() => setActiveTab('historique')} className={`px-4 py-2 rounded-t-lg text-[14px] font-semibold transition border-b-2 flex items-center gap-2 ${activeTab === 'historique' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><History size={15} /> Historique</button>
          <button onClick={() => setActiveTab('bilan')} className={`px-4 py-2 rounded-t-lg text-[14px] font-semibold transition border-b-2 flex items-center gap-2 ${activeTab === 'bilan' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><BarChart3 size={15} /> Bilan Mensuel</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: theme.card }}>
          {activeTab === 'historique' && (
            <>
              <div className="shrink-0 border-b p-4 space-y-4" style={{ borderColor: theme.border, background: theme.card }}>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-xl border p-1" style={{ borderColor: theme.border, background: theme.card }}>
                    {['jour', 'mois', 'annee'].map(t => (
                      <button key={t} onClick={() => setType(t as any)} className={`px-4 py-1.5 rounded-lg text-[14px] font-semibold transition ${type === t ? 'bg-brand-500 text-white shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-white/[0.06]'}`} style={{ color: type === t ? '#FFFFFF' : theme.muted }}>{t === 'jour' ? 'Par Jour' : t === 'mois' ? 'Par Mois' : 'Par Année'}</button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {type === 'jour' && <input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />}
                    {type === 'mois' && (<><select value={moisState} onChange={e => setMoisState(Number(e.target.value))} className="h-9 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select><input type="number" value={anneeState} onChange={e => setAnneeState(Number(e.target.value))} className="h-9 w-24 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} /></>)}
                    {type === 'annee' && <input type="number" value={anneeState} onChange={e => setAnneeState(Number(e.target.value))} className="h-9 w-32 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />}
                    <select value={statut} onChange={e => setStatut(e.target.value)} className="h-9 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }}><option value="Tous">Tous les statuts</option><option value="present">Présent</option><option value="absent">Absent</option><option value="conge">Congé</option></select>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded-xl border text-center" style={{ background: theme.card, borderColor: theme.border }}><p className="text-[12px]" style={{ color: theme.muted }}>Total</p><p className="text-[16px] font-bold" style={{ color: theme.text }}>{stats.total}</p></div>
                  <div className="p-2 rounded-xl border text-center" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}><p className="text-[12px] text-success-600 dark:text-success-400">Présents</p><p className="text-[16px] font-bold text-success-700 dark:text-success-400">{stats.presents}</p></div>
                  <div className="p-2 rounded-xl border text-center" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}><p className="text-[12px] text-danger-600 dark:text-danger-400">Absents</p><p className="text-[16px] font-bold text-danger-700 dark:text-danger-400">{stats.absents}</p></div>
                  <div className="p-2 rounded-xl border text-center" style={{ background: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.3)' }}><p className="text-[12px] text-yellow-600 dark:text-yellow-400">Congés</p><p className="text-[16px] font-bold text-yellow-700 dark:text-yellow-400">{stats.conges}</p></div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                {loading ? (<div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-brand-500" /></div>) : data.length === 0 ? (<div className="text-center py-10" style={{ color: theme.muted }}>Aucune donnée trouvée pour cette période.</div>) : (
                  <table className="w-full text-left">
                    <thead className="sticky top-0 z-20 shadow-sm">
                      <tr style={{ background: theme.softBg }}>
                        <th className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide border-b" style={{ color: theme.muted, borderColor: theme.border }}>Date</th>
                        <th className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide border-b" style={{ color: theme.muted, borderColor: theme.border }}>Employé</th>
                        <th className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide border-b" style={{ color: theme.muted, borderColor: theme.border }}>Statut</th>
                        <th className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide border-b" style={{ color: theme.muted, borderColor: theme.border }}>Retard</th>
                        <th className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide border-b" style={{ color: theme.muted, borderColor: theme.border }}>Heures Supp.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item, idx) => (
                        <tr key={idx} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]" style={{ background: theme.card }}>
                          <td className="px-4 py-3 text-[14px] border-b" style={{ color: theme.muted, borderColor: theme.border }}>{item.date.split('-').reverse().join('/')}</td>
                          <td className="px-4 py-3 text-[14px] font-semibold border-b" style={{ color: theme.text, borderColor: theme.border }}>{item.prenom} {item.nom}</td>
                          <td className="px-4 py-3 border-b" style={{ borderColor: theme.border }}>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-bold ${item.statut === 'present' ? 'bg-success-50 text-success-700' : item.statut === 'absent' ? 'bg-danger-50 text-danger-700' : 'bg-yellow-50 text-yellow-700'}`}>{item.statut === 'present' ? <CheckCircle2 size={12} /> : item.statut === 'absent' ? <XCircle size={12} /> : <AlertCircle size={12} />}{item.statut === 'present' ? 'Présent' : item.statut === 'absent' ? 'Absent' : 'Congé'}</span>
                          </td>
                          <td className="px-4 py-3 border-b" style={{ color: theme.amber, borderColor: theme.border }}>{item.minutes_retard || 0} min</td>
                          <td className="px-4 py-3 border-b" style={{ color: theme.primary, borderColor: theme.border }}>{item.heures_sup || 0}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeTab === 'bilan' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <select value={moisState} onChange={e => setMoisState(Number(e.target.value))} className="h-9 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
                <input type="number" value={anneeState} onChange={e => setAnneeState(Number(e.target.value))} className="h-9 w-24 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
              </div>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.muted }} />
                <input type="text" placeholder="Rechercher un employé..." value={employeeSearch} onChange={(e) => { setEmployeeSearch(e.target.value); setIsEmployeeDropdownOpen(true); if (e.target.value === '') setSelectedEmployeeId(null); }} onFocus={() => setIsEmployeeDropdownOpen(true)} className="w-full h-10 pl-9 pr-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} />
                {isEmployeeDropdownOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-1.5 max-h-60 overflow-y-auto rounded-lg border shadow-lg" style={{ borderColor: theme.border, background: theme.card }} onMouseDown={(e) => e.preventDefault()}>
                    {filteredEmployees.map(emp => (
                      <button key={emp.id} type="button" onClick={() => { setSelectedEmployeeId(emp.id); setIsEmployeeDropdownOpen(false); setEmployeeSearch(`${emp.prenom || ''} ${emp.nom || ''}`.trim()); }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.06]" style={{ color: theme.text }}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 text-[12px] font-bold" style={{ color: theme.muted }}>{(emp.prenom?.[0] || '') + (emp.nom?.[0] || '')}</div>
                        <div className="min-w-0"><p className="text-[14px] font-semibold truncate">{emp.prenom} {emp.nom}</p><p className="text-[12px] truncate" style={{ color: theme.muted }}>{emp.poste || 'Employé'}</p></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ⭐ RESUME AUTOMATIQUE */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded-xl border text-center" style={{ background: theme.card, borderColor: theme.border }}><p className="text-[12px]" style={{ color: theme.muted }}>Absences</p><p className="text-[16px] font-bold" style={{ color: theme.red }}>{stats.absents}</p></div>
                <div className="p-2 rounded-xl border text-center" style={{ background: theme.card, borderColor: theme.border }}><p className="text-[12px]" style={{ color: theme.muted }}>Congés</p><p className="text-[16px] font-bold" style={{ color: theme.amber }}>{stats.conges}</p></div>
                <div className="p-2 rounded-xl border text-center" style={{ background: theme.card, borderColor: theme.border }}><p className="text-[12px]" style={{ color: theme.muted }}>Retards (min)</p><p className="text-[16px] font-bold" style={{ color: theme.amber }}>{stats.retards}</p></div>
                <div className="p-2 rounded-xl border text-center" style={{ background: theme.card, borderColor: theme.border }}><p className="text-[12px]" style={{ color: theme.muted }}>Heures Supp.</p><p className="text-[16px] font-bold" style={{ color: theme.primary }}>{stats.hs}h</p></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: theme.border }}>
                <div><label className="block mb-1 text-[13px] font-medium" style={{ color: theme.muted }}>Certificat médical (Manuel)</label><input type="text" value={certificatMedical} onChange={e => setCertificatMedical(e.target.value)} placeholder="N° Certificat..." className="w-full h-10 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} /></div>
                <div><label className="block mb-1 text-[13px] font-medium" style={{ color: theme.muted }}>Jours de maladie (Manuel)</label><input type="number" value={joursMaladie} onChange={e => setJoursMaladie(e.target.value)} placeholder="0" className="w-full h-10 px-3 rounded-lg border outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} /></div>
                <div className="sm:col-span-2"><label className="block mb-1 text-[13px] font-medium" style={{ color: theme.muted }}>Observation</label><textarea value={observation} onChange={e => setObservation(e.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-brand-500" style={{ background: theme.card, borderColor: theme.border, color: theme.text }} /></div>
              </div>

              {loading ? (<div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-brand-500" /></div>) : bilanMonthData.length === 0 ? (<div className="text-center py-10" style={{ color: theme.muted }}>Aucune donnée trouvée pour ce mois.</div>) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-20 shadow-sm"><tr style={{ background: theme.softBg }}><th className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide border-b" style={{ color: theme.muted, borderColor: theme.border }}>Date</th><th className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide border-b" style={{ color: theme.muted, borderColor: theme.border }}>Employé</th><th className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide border-b" style={{ color: theme.muted, borderColor: theme.border }}>Statut</th><th className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide border-b" style={{ color: theme.muted, borderColor: theme.border }}>Retard</th><th className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide border-b" style={{ color: theme.muted, borderColor: theme.border }}>HS</th></tr></thead>
                  <tbody>
                    {paginatedData.map((item, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]" style={{ background: theme.card }}>
                        <td className="px-4 py-3 text-[14px] border-b" style={{ color: theme.muted, borderColor: theme.border }}>{item.date.split('-').reverse().join('/')}</td>
                        <td className="px-4 py-3 text-[14px] font-semibold border-b" style={{ color: theme.text, borderColor: theme.border }}>{item.prenom} {item.nom}</td>
                        <td className="px-4 py-3 border-b" style={{ borderColor: theme.border }}>
                          {item.statut === 'present' ? (<span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-bold bg-success-50 text-success-700"><CheckCircle2 size={12} /> Présent</span>) : item.statut === 'absent' ? (<span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-bold bg-danger-50 text-danger-700"><XCircle size={12} /> Absent</span>) : item.statut === 'conge' ? (<span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-bold bg-yellow-50 text-yellow-700"><AlertCircle size={12} /> Congé</span>) : (<span className="text-[12px] text-slate-400">—</span>)}
                        </td>
                        <td className="px-4 py-3 text-[14px] border-b" style={{ color: theme.amber, borderColor: theme.border }}>{item.minutes_retard || 0} min</td>
                        <td className="px-4 py-3 text-[14px] border-b" style={{ color: theme.primary, borderColor: theme.border }}>{item.heures_sup || 0}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t p-4 flex justify-end gap-2" style={{ borderColor: theme.border, background: theme.softBg }}>
          <button onClick={onClose} className="h-10 px-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-white/[0.06] text-[14px] font-medium" style={{ borderColor: theme.border, color: theme.muted }}>Fermer</button>
          {activeTab === 'bilan' ? (<button onClick={handleSaveBilan} disabled={!selectedEmployeeId} className="h-10 px-5 rounded-lg bg-brand-500 text-[14px] font-semibold text-white hover:bg-brand-600 disabled:opacity-50">Enregistrer</button>) : (<button className="h-10 px-5 rounded-lg bg-brand-500 text-[14px] font-semibold text-white hover:bg-brand-600">Enregistrer</button>)}
        </div>
      </div>
    </div>
  );
};
export default EmployesHistoriqueModal;