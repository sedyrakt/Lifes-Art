
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLicense } from '../contexts/LicenseContext';
import { useNavigate } from 'react-router-dom';
import { Settings2, User, Info, LogOut, Database, Crown, X } from 'lucide-react';

import ParametresGeneral from '../components/parametres/ParametresGeneral';
import ParametresProfile from '../components/parametres/ParametresProfile';
import ParametresSystemInfo from '../components/parametres/ParametresSystemInfo';
import ParametresBackup from '../components/parametres/ParametresBackup';
import ParametresLicense, { type LicenseInfo } from '../components/parametres/ParametresLicense';

import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';

interface AppSettings {
  appName: string;
  companyName: string;
  language: string;
  currency: string;
  dateFormat: string;
  timeZone: string;
}


const ParametresSkeleton = ({ isDark }: { isDark: boolean }) => {
  const base = isDark ? 'bg-white/[0.06]' : 'bg-slate-200';
  const border = isDark ? 'border-white/[0.08]' : 'border-slate-200';
  return (
    <div className="min-h-[500px] w-full p-5" style={{ background: isDark ? '#0F172A' : '#FFFFFF' }}>
      <div className="space-y-4">
        <div className={`rounded-xl border p-4 ${border}`}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className={`h-5 w-40 rounded ${base} animate-pulse`} />
              <div className={`h-3 w-24 rounded ${base} animate-pulse`} />
            </div>
            <div className={`h-9 w-24 rounded-lg ${base} animate-pulse`} />
          </div>
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <div className={`w-full md:w-56 rounded-2xl border p-2 ${border}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`mt-2 h-9 w-full rounded-lg ${base} animate-pulse`} />
            ))}
          </div>
          <div className={`flex-1 min-h-[400px] rounded-2xl border p-6 ${border}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`h-10 rounded-lg ${base} animate-pulse`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Parametres: React.FC = () => {
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
    status: licenseStatus, isValid, isActive, packageType, packageName,
    licenseKey, daysRemaining, minutesRemaining, isTest, isLifetime, expirationDate,
    activatedAt,
  } = useLicense();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'system' | 'backup' | 'license'>('general');

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [settings, setSettings] = useState<AppSettings>({
    appName: "TahiryPro",
    companyName: '',
    language: 'fr',
    currency: 'Ar',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'Indian/Antananarivo',
  });

  const [systemInfo, setSystemInfo] = useState<any>({
    version: '1.0.0',
    electron: 'N/A',
    node: 'N/A',
    chrome: 'N/A',
    platform: navigator.platform,
    arch: 'N/A',
    memory: 'N/A',
    cpu: 'N/A',
  });

  const [successModal, setSuccessModal] = useState({
    isOpen: false, title: '', message: '', details: '', autoClose: 4000,
  });
  const [errorModal, setErrorModal] = useState({
    isOpen: false, title: '', message: '', details: '', autoClose: 5000,
  });

  const licenseInfo: LicenseInfo = useMemo(
    () => ({
      packageType: packageType,
      packageName: packageName || 'Aucune licence',
      daysRemaining: daysRemaining || 0,
      minutesRemaining: minutesRemaining ?? null,
      expirationDate: expirationDate,
      activatedAt: activatedAt,
      isActive: Boolean(isValid && isActive),
      isUnlimited: Boolean(isLifetime),
      isTest: Boolean(isTest),
      customerName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || '',
      companyName: (user as any)?.companyName || '',
      licenseKey: licenseKey || '',
    }),
    [packageType, packageName, daysRemaining, minutesRemaining, expirationDate, isValid, isActive, isLifetime, isTest, licenseKey, activatedAt, user]
  );

  const showSuccess = (title: string, message: string, details?: string) => {
    setSuccessModal({ isOpen: true, title, message, details: details || '', autoClose: 4000 });
  };
  const showError = (title: string, message: string, details?: string) => {
    setErrorModal({ isOpen: true, title, message, details: details || '', autoClose: 5000 });
  };

  const loadSettings = useCallback(async () => {
    try {
      const result = await window.api.settings.getAll();
      if (result?.success && result.data) {
        let settingsObj: any = {};
        if (Array.isArray(result.data)) {
          result.data.forEach((item: any) => { settingsObj[item.key] = item.value; });
        } else {
          settingsObj = result.data;
        }
        setSettings((prev) => ({ ...prev, appName: settingsObj.appName || prev.appName, companyName: settingsObj.companyName || prev.companyName, language: settingsObj.language || prev.language, currency: settingsObj.currency || prev.currency, dateFormat: settingsObj.dateFormat || prev.dateFormat, timeZone: settingsObj.timeZone || prev.timeZone }));
      }
    } catch (error) { console.error('Erreur chargement settings:', error); }
  }, []);

  const loadSystemInfo = useCallback(async () => {
    try {
      const platformInfo = window.api.platform || {};
      const platform = navigator.platform;
      const memory = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'N/A';
      const version = platformInfo.version || '1.0.0';
      const arch = platformInfo.arch || (navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : 'N/A');
      setSystemInfo({ version, electron: platformInfo.electron || 'N/A', node: platformInfo.node || 'N/A', chrome: 'N/A', platform, arch, memory, cpu: 'N/A' });
    } catch (error) { console.error('Erreur chargement system info:', error); }
  }, []);

  useEffect(() => {
    const init = async () => { setLoading(true); await loadSettings(); await loadSystemInfo(); setLoading(false); };
    init();
  }, [loadSettings, loadSystemInfo]);

  const handleSettingsChange = (newSettings: AppSettings) => { setSettings(newSettings); };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await Promise.all(Object.entries(settings).map(([key, value]) => window.api.settings.set(key, value)));
      showSuccess('Paramètres sauvegardés', 'Tous vos paramètres ont été enregistrés avec succès.');
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      showError('Erreur de sauvegarde', 'Une erreur est survenue.', error.message || 'Erreur inconnue');
    } finally { setSaving(false); }
  }, [settings]);

  const handleLogout = useCallback(() => { setShowLogoutModal(true); }, []);
  const handleConfirmLogout = useCallback(() => { setShowLogoutModal(false); logout(); navigate('/login'); }, [logout, navigate]);

  const tabItems = [
    { id: 'general' as const, label: 'Général', icon: Settings2 },
    { id: 'profile' as const, label: 'Profil', icon: User },
    { id: 'system' as const, label: 'Système', icon: Info },
    { id: 'backup' as const, label: 'Sauvegarde', icon: Database },
    { id: 'license' as const, label: 'Licence', icon: Crown },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return <ParametresGeneral settings={settings} onSettingsChange={handleSettingsChange} isDark={isDark} />;
      case 'profile': return <ParametresProfile user={user || {}} />;
      case 'system': return <ParametresSystemInfo systemInfo={systemInfo} isDark={isDark} />;
      case 'backup': return <ParametresBackup isDark={isDark} />;
      case 'license': return <ParametresLicense status={licenseStatus} licenseInfo={licenseInfo} />;
      default: return null;
    }
  };


  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const cardColor = isDark ? '#0F172A' : '#FFFFFF';  
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <div className="min-h-full w-full transition-colors duration-300" style={{ background: bgColor }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-5 px-2 py-5 sm:px-3 lg:px-5">
        
        {loading ? (
          <ParametresSkeleton isDark={isDark} />
        ) : (
          <>
            <header className="relative mb-4 w-full overflow-hidden rounded-xl border bg-white px-4 py-3.5 shadow-sm transition-all duration-200 dark:bg-[#0F172A]" style={{ borderColor: borderColor }}>
              <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500" />
              <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm dark:bg-brand-500"><Settings2 size={18} strokeWidth={2} /></div>
                  <div className="min-w-0">
                    <h1 className="truncate text-[16px] font-semibold leading-tight tracking-tight" style={{ color: textColor }}>Paramètres</h1>
                    <p className="mt-0.5 truncate text-[13.5px] font-medium leading-tight" style={{ color: mutedColor }}>Gérez les paramètres de votre application.</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {activeTab === 'general' && (
                    <button type="button" onClick={handleSave} disabled={saving} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[14.5px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  )}
                </div>
              </div>
            </header>

            <div className="mt-4 flex w-full flex-col gap-4 pb-8 md:flex-row">
              <nav className="flex h-fit w-full flex-shrink-0 flex-row gap-1 rounded-2xl border p-2 shadow-sm md:w-56 md:flex-col" style={{ background: cardColor, borderColor, boxShadow: isDark ? '0 4px 24px -4px rgba(0,0,0,0.35)' : '0 4px 20px -4px rgba(79,70,229,0.08)' }}>
                {tabItems.map((item) => {
                  const Icon = item.icon;
                  const isTabActive = activeTab === item.id;
                  return (
                    <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-[14.5px] font-medium transition-all duration-200 ${isTabActive ? 'border border-brand-500/20 bg-brand-50 text-brand-600 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400'}`}>
                      <Icon className={`h-4 w-4 ${isTabActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                <button type="button" onClick={handleLogout} className="mt-auto flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-[14.5px] font-medium text-danger-500 transition-all duration-200 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10">
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </button>
              </nav>

              <div className="min-h-[400px] flex-1 rounded-2xl border p-6 shadow-sm" style={{ background: cardColor, borderColor, boxShadow: isDark ? '0 4px 24px -4px rgba(0,0,0,0.35)' : '0 4px 20px -4px rgba(79,70,229,0.08)' }}>
                {renderContent()}
              </div>
            </div>

            <SuccessModal isOpen={successModal.isOpen} onClose={() => setSuccessModal({ ...successModal, isOpen: false })} title={successModal.title} message={successModal.message} details={successModal.details} autoCloseDelay={successModal.autoClose} isDark={isDark} />
            <ErrorModal isOpen={errorModal.isOpen} onClose={() => setErrorModal({ ...errorModal, isOpen: false })} title={errorModal.title} message={errorModal.message} details={errorModal.details} autoCloseDelay={errorModal.autoClose} isDark={isDark} />
          </>
        )}
      </div>


      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-sm w-full rounded-xl shadow-2xl border overflow-hidden" style={{ background: cardColor, borderColor: borderColor }}>
            <button onClick={() => setShowLogoutModal(false)} className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer z-10" style={{ color: mutedColor }}>
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center pt-6 pb-2"><img src="./images/logodark.png" alt="Logo" className="w-20 h-20 object-contain" /></div>
            <div className="px-5 py-4 flex items-center justify-center border-b" style={{ borderColor: borderColor }}>
              <h2 className="text-[15.5px] font-bold" style={{ color: textColor }}>Déconnexion</h2>
            </div>
            <div className="p-5">
              <p className="text-[15.5px] font-medium leading-tight text-center" style={{ color: textColor }}>Êtes-vous sûr de vouloir vous déconnecter ?</p>
              <p className="text-[13.5px] mt-1.5 leading-relaxed text-center" style={{ color: mutedColor }}>Vous devrez entrer vos identifiants pour vous reconnecter.</p>
            </div>
            <div className="flex gap-2.5 px-5 py-3 border-t" style={{ borderColor: borderColor, background: isDark ? '#0F172A' : '#F8FAFC' }}>
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-2 rounded-lg border text-[14.5px] font-medium transition-colors" style={{ borderColor, color: mutedColor }}>Annuler</button>
              <button onClick={handleConfirmLogout} className="flex-1 px-4 py-2 rounded-lg text-[14.5px] font-medium text-white bg-brand-500 hover:bg-brand-600 transition-colors">Se déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parametres;