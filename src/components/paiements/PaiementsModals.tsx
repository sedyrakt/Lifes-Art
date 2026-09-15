// ============================================================
// src/components/paiements/PaiementsModals.tsx
// LIFE'S ART ERP — MODALS WRAPPER
// ⭐ FIX: Nampiana prop defaultDate ho an'ny PaiementsModalForm
// ⭐ FIX: Nampiana initialMois sy initialAnnee (avy amin'ny calendar)
// ============================================================

import React from 'react';
import PaiementsModalForm, { PaiementEmploye, EmployePaiement, PayrollMode } from './PaiementsModalForm';
import CompanySettingsModal from '../company/CompanySettingsModal';
import ConfirmModal from '../common/ConfirmModal';
import SuccessModal from '../common/SuccessModal';
import ErrorModal from '../common/ErrorModal';
import WarningModal from '../common/WarningModal';

interface PaiementsModalsProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  editingPaiement: PaiementEmploye | null;
  setEditingPaiement: (p: PaiementEmploye | null) => void;
  modalEmployeId: number | null;
  setModalEmployeId: (id: number | null) => void;
  employes: EmployePaiement[];
  allPaiements?: PaiementEmploye[];
  onModalSuccess: (p: PaiementEmploye) => void;
  showCompanyModal: boolean;
  setShowCompanyModal: (value: boolean) => void;
  onCompanySave: (data: any) => void;
  onCompanyGenerate: (data?: any) => void;
  isDark: boolean;
  company: any;
  buttonLabel: string;
  bulletinTargetPaiement: PaiementEmploye | null;
  setBulletinTargetPaiement: (p: PaiementEmploye | null) => void;
  confirmModal: any;
  setConfirmModal: (value: any) => void;
  successModal: any;
  setSuccessModal: (value: any) => void;
  errorModal: any;
  setErrorModal: (value: any) => void;
  warningModal: any;
  setWarningModal: (value: any) => void;
  presenceData?: { jours_absences?: number; jours_conges?: number; heures_sup?: number; retards?: number; } | null;
  setPresenceData?: (value: any) => void;
  /** ⭐ Mode de paie global : 'complet' | 'simplifie' */
  payrollMode?: PayrollMode;
  /** ⭐ Date par défaut rehefa avy amin'ny calendrier */
  defaultDate?: string | null;
  /** ⭐ NOUVEAU: Mois par défaut rehefa avy amin'ny calendrier */
  initialMois?: number;
  /** ⭐ NOUVEAU: Année par défaut rehefa avy amin'ny calendrier */
  initialAnnee?: number;
}

export function PaiementsModals({
  isModalOpen, setIsModalOpen, editingPaiement, setEditingPaiement, modalEmployeId, setModalEmployeId,
  employes, allPaiements, onModalSuccess, showCompanyModal, setShowCompanyModal, onCompanySave, onCompanyGenerate,
  isDark, company, buttonLabel, bulletinTargetPaiement, setBulletinTargetPaiement,
  confirmModal, setConfirmModal, successModal, setSuccessModal, errorModal, setErrorModal,
  warningModal, setWarningModal, presenceData, setPresenceData,
  payrollMode = 'complet',
  defaultDate = null,
  initialMois,      // ⭐ NOUVEAU
  initialAnnee,     // ⭐ NOUVEAU
}: PaiementsModalsProps) {
  return (
    <>
      <PaiementsModalForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPaiement(null);
          setModalEmployeId(null);
          setPresenceData?.(null);
        }}
        employes={employes}
        allPaiements={allPaiements}
        paiement={editingPaiement}
        employeId={modalEmployeId}
        onSuccess={onModalSuccess}
        presenceData={presenceData}
        payrollMode={payrollMode}
        defaultDate={defaultDate}
        initialMois={initialMois}      // ⭐ NOUVEAU
        initialAnnee={initialAnnee}    // ⭐ NOUVEAU
      />

      <CompanySettingsModal
        isOpen={showCompanyModal}
        onClose={() => { setShowCompanyModal(false); setBulletinTargetPaiement(null); }}
        onSave={onCompanySave}
        onGenerate={onCompanyGenerate}
        mode="generate"
        isDark={isDark}
        initialData={company}
        buttonLabel={buttonLabel}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText="Annuler"
        confirmColor="red"
        isDark={isDark}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
        title={successModal.title}
        message={successModal.message}
        buttonText="OK"
        autoCloseDelay={3000}
        isDark={isDark}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
        title={errorModal.title}
        message={errorModal.message}
        buttonText="OK"
        autoCloseDelay={4000}
        isDark={isDark}
      />

      <WarningModal
        isOpen={warningModal.isOpen}
        onClose={() => setWarningModal({ isOpen: false, title: '', message: '' })}
        title={warningModal.title}
        message={warningModal.message}
        buttonText="OK"
        autoCloseDelay={4000}
        isDark={isDark}
      />
    </>
  );
}