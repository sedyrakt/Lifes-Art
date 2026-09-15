// src/components/parametres/ParametresBackup.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProfileSidebar
// ⭐ FONT SIZE: labels 12px, values 14px, buttons 14px

import React, { useEffect, useCallback, useState } from 'react';
import { HardDrive, Save, RefreshCw, Clock, Database, Shield, Upload } from 'lucide-react';
import SuccessModal from '../common/SuccessModal';
import ErrorModal from '../common/ErrorModal';

interface ParametresBackupProps { isDark: boolean; }

const ParametresBackup: React.FC<ParametresBackupProps> = ({ isDark }) => {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState<{ lastBackup?: string; backupCount?: number; status?: string; }>({});
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });

  const showSuccess = (title: string, message: string) => setSuccessModal({ isOpen: true, title, message });
  const showError = (title: string, message: string) => setErrorModal({ isOpen: true, title, message });

  const loadBackupStatus = useCallback(async () => {
    try {
      const result = await window.api.backup.status();
      if (result?.success) setBackupStatus({ lastBackup: result.data.lastBackup || 'Aucun', backupCount: result.data.backupCount || 0, status: result.data.status || 'Opérationnel' });
    } catch (error) { console.error('Erreur chargement statut backup:', error); }
  }, []);

  useEffect(() => { loadBackupStatus(); }, [loadBackupStatus]);

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const result = await window.api.backup.database();
      if (result?.success) {
        const filename = result.path ? result.path.split(/[\/\\]/).pop() : 'inconnu';
        showSuccess('Sauvegarde réussie', `La base de données a été sauvegardée avec succès.\nFichier: ${filename}`);
        await loadBackupStatus();
      } else if (result?.canceled) {
        console.log('Sauvegarde annulée par l\'utilisateur');
      } else {
        throw new Error(result?.error || 'Échec de la sauvegarde');
      }
    } catch (error: any) {
      showError('❌ Erreur de sauvegarde', error.message || 'Impossible d\'effectuer la sauvegarde.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreClick = async () => {
    const result = await window.api.dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Fichiers de sauvegarde', extensions: ['db', 'gz', 'backup'] }] });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) return;
    const restorePath = result.filePaths[0];
    setRestoreLoading(true);
    try {
      const restoreResult = await window.api.backup.restore(restorePath);
      if (restoreResult?.success) { showSuccess('Restauration réussie', 'La base de données a été restaurée avec succès.'); await loadBackupStatus(); }
      else throw new Error(restoreResult?.error || 'Échec de la restauration');
    } catch (error: any) { showError('❌ Erreur de restauration', error.message || 'Impossible de restaurer la base de données.'); }
    finally { setRestoreLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border-[0.5px] p-3.5" style={{ background: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            {/* ⭐ Icon : 14 → 15 */}
            <HardDrive size={15} strokeWidth={2.2} className="text-brand-500" />
            {/* ⭐ Label : 11.5px → 12px */}
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] leading-[1.3]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Dernière sauvegarde</span>
          </div>
          {/* ⭐ Value : 13.5px → 14px */}
          <p className="text-[14px] font-semibold leading-tight" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>{backupStatus.lastBackup || 'Aucune'}</p>
        </div>
        <div className="rounded-xl border-[0.5px] p-3.5" style={{ background: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Database size={15} strokeWidth={2.2} className="text-emerald-500" />
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] leading-[1.3]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Nombre de sauvegardes</span>
          </div>
          <p className="text-[14px] font-semibold leading-tight" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>{backupStatus.backupCount || 0}</p>
        </div>
        <div className="rounded-xl border-[0.5px] p-3.5" style={{ background: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock size={15} strokeWidth={2.2} className="text-amber-500" />
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] leading-[1.3]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Statut</span>
          </div>
          <p className="text-[14px] font-semibold leading-tight" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>{backupStatus.status || 'Opérationnel'}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* ⭐ Backup button : 13px → 14px, py-2 → py-2.5 */}
        <button
          onClick={handleBackup}
          disabled={backupLoading}
          className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-[14px] font-semibold text-white transition-colors duration-200 disabled:opacity-50"
          style={{ background: '#4F46E5' }}
        >
          {/* ⭐ Icons : 16 → 17 */}
          {backupLoading ? <RefreshCw size={17} className="animate-spin" /> : <Save size={17} strokeWidth={2.2} />}
          {backupLoading ? 'Sauvegarde en cours...' : 'Sauvegarder maintenant'}
        </button>
        <button
          onClick={handleRestoreClick}
          disabled={restoreLoading}
          className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border text-[14px] font-semibold transition-colors duration-200 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/[0.06]"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', color: isDark ? '#94A3B8' : '#64748B' }}
        >
          {restoreLoading ? <RefreshCw size={17} className="animate-spin" /> : <Upload size={17} strokeWidth={2.2} />}
          {restoreLoading ? 'Restauration en cours...' : 'Restaurer une sauvegarde'}
        </button>
      </div>
      <div className="rounded-xl border-[0.5px] p-3.5" style={{ background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.05)', borderColor: isDark ? 'rgba(239,68,68,0.30)' : 'rgba(239,68,68,0.20)' }}>
        <div className="flex items-start gap-2.5">
          {/* ⭐ Shield icon : 16 → 17 */}
          <Shield size={17} strokeWidth={2.2} className="text-red-500 mt-0.5" />
          <div>
            {/* ⭐ Title : 13.5px → 14px */}
            <p className="text-[14px] font-semibold leading-tight" style={{ color: isDark ? '#F8FAFC' : '#DC2626' }}>⚠️ Attention</p>
            {/* ⭐ Text : 11.5px → 13px */}
            <p className="text-[13px] mt-1 leading-[1.4]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>La restauration effacera toutes les données actuelles et les remplacera par celles de la sauvegarde. Cette action est irréversible.</p>
          </div>
        </div>
      </div>
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
        title={successModal.title}
        message={successModal.message}
        buttonText="OK"
        autoCloseDelay={4000}
        isDark={isDark}
      />
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
        title={errorModal.title}
        message={errorModal.message}
        buttonText="OK"
        autoCloseDelay={5000}
        isDark={isDark}
      />
    </div>
  );
};

export default ParametresBackup;