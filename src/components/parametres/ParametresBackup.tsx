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
        // Raha cancel, tsy misy erreur, mijanona fotsiny
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4" style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}>
          <div className="flex items-center gap-2 mb-2">
            <HardDrive size={16} className="text-brand-500" />
            <span className="text-[13px] font-medium" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Dernière sauvegarde</span>
          </div>
          <p className="text-[14px] font-semibold" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>{backupStatus.lastBackup || 'Aucune'}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}>
          <div className="flex items-center gap-2 mb-2">
            <Database size={16} className="text-success-500" />
            <span className="text-[13px] font-medium" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Nombre de sauvegardes</span>
          </div>
          <p className="text-[14px] font-semibold" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>{backupStatus.backupCount || 0}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-warning-500" />
            <span className="text-[13px] font-medium" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Statut</span>
          </div>
          <p className="text-[14px] font-semibold" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>{backupStatus.status || 'Opérationnel'}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleBackup}
          disabled={backupLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[14px] font-medium text-white transition-all duration-200 disabled:opacity-50 hover:brightness-110 active:scale-[0.98]"
          style={{ background: '#4F46E5' }}
        >
          {backupLoading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {backupLoading ? 'Sauvegarde en cours...' : 'Sauvegarder maintenant'}
        </button>
        <button
          onClick={handleRestoreClick}
          disabled={restoreLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-[14px] font-medium transition-all duration-200 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/[0.06] active:scale-[0.98]"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', color: isDark ? '#94A3B8' : '#64748B' }}
        >
          {restoreLoading ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
          {restoreLoading ? 'Restauration en cours...' : 'Restaurer une sauvegarde'}
        </button>
      </div>
      <div className="rounded-xl border p-4" style={{ background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.05)', borderColor: isDark ? 'rgba(239,68,68,0.30)' : 'rgba(239,68,68,0.20)' }}>
        <div className="flex items-start gap-3">
          <Shield size={18} className="text-danger-500 mt-0.5" />
          <div>
            <p className="text-[14px] font-medium" style={{ color: isDark ? '#F8FAFC' : '#DC2626' }}>⚠️ Attention</p>
            <p className="text-[13px] mt-1" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>La restauration effacera toutes les données actuelles et les remplacera par celles de la sauvegarde. Cette action est irréversible.</p>
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