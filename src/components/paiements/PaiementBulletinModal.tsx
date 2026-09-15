// src/components/paiements/PaiementBulletinModal.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur CommandesTable
// ⭐ fontSize : header 12px, cells 13.5px, footer 12.5px
// ⭐ PADDING augmenté pour un rendu plus aéré

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download } from 'lucide-react';
import { parseDateSafe } from './PaiementsUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  paiement: any;
  employe?: any;
  isDark: boolean;
  companyInfo?: {
    nom?: string;
    nif?: string;
    adresse?: string;
  };
}

const formatAriary = (v: any) => `${Math.round(Number(v || 0)).toLocaleString('fr-FR')} Ar`;

const PaiementBulletinModal: React.FC<Props> = ({ isOpen, onClose, paiement, employe, isDark, companyInfo }) => {
  const [defaultCompany, setDefaultCompany] = useState({
    nom: "TahiryPro",
    nif: "40000 11 222",
    adresse: "Antananarivo - Madagascar"
  });

  useEffect(() => {
    if (companyInfo) return;
    const fetchCompany = async () => {
      try {
        const api = window.api?.settings;
        if (!api?.getByKey) return;
        
        const nomRes = await api.getByKey('societe_nom');
        const nifRes = await api.getByKey('societe_nif');
        const adresseRes = await api.getByKey('societe_adresse');
        
        if (nomRes?.success && nomRes.data) setDefaultCompany(prev => ({ ...prev, nom: nomRes.data.value || nomRes.data }));
        if (nifRes?.success && nifRes.data) setDefaultCompany(prev => ({ ...prev, nif: nifRes.data.value || nifRes.data }));
        if (adresseRes?.success && adresseRes.data) setDefaultCompany(prev => ({ ...prev, adresse: adresseRes.data.value || adresseRes.data }));
      } catch (error) {
        console.error('[Bulletin] Error fetching company info:', error);
      }
    };
    fetchCompany();
  }, [companyInfo]);

  if (!isOpen || !paiement) return null;

  const company = companyInfo || defaultCompany;

  const nomEmploye = `${employe?.prenom || paiement.employe_prenom || ''} ${employe?.nom || paiement.employe_nom || ''}`.trim();
  const poste = employe?.poste || paiement.employe_poste || '—';
  const moisNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const periode = `${moisNames[Number(paiement.mois)-1]} ${paiement.annee}`;
  const datePaiement = paiement.date_paiement ? parseDateSafe(paiement.date_paiement).toLocaleDateString('fr-FR') : '—';

  const handlePrint = () => window.print();
  const handleDownload = () => { window.print(); };

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="bulletin-modal-title">
      <div className={`w-full max-w-3xl overflow-hidden rounded-xl border-[0.5px] shadow-[0_18px_55px_rgba(15,23,42,0.35)] ${isDark ? 'border-white/[0.12] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}>
        
        {/* HEADER */}
        <div className={`flex h-14 shrink-0 items-center justify-between border-b px-4 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
          <h2 id="bulletin-modal-title" className="truncate text-[13.5px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">Bulletin de Paie</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:scale-[0.98]">
              <Printer size={14} strokeWidth={2.2} /> Imprimer
            </button>
            <button onClick={handleDownload} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.06] ${isDark ? 'border-white/[0.12] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}>
              <Download size={14} strokeWidth={2.2} /> PDF
            </button>
            <button onClick={onClose} aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06]">
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="printable-area px-4 py-4">
          {/* En-tête entreprise */}
          <div className="mb-4 text-center">
            <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-slate-100">{company.nom || 'Entreprise'}</h3>
            <p className="mt-0.5 text-[11.5px] leading-[1.3] text-slate-500 dark:text-slate-400">NIF : {company.nif || '—'}</p>
            <p className="text-[11.5px] leading-[1.3] text-slate-500 dark:text-slate-400">{company.adresse || '—'}</p>
          </div>

          {/* Infos employé + période */}
          <div className={`border-y border-dashed py-3 mb-4 ${isDark ? 'border-white/[0.15]' : 'border-slate-300'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] leading-[1.3] text-slate-400 dark:text-slate-500">Employé</p>
                <p className="mt-1 truncate text-[13.5px] font-semibold text-slate-900 dark:text-slate-100">{nomEmploye}</p>
                <p className="mt-0.5 text-[11.5px] leading-[1.3] text-slate-500 dark:text-slate-400">{poste}</p>
              </div>
              <div className="text-right min-w-0">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] leading-[1.3] text-slate-400 dark:text-slate-500">Période</p>
                <p className="mt-1 truncate text-[13.5px] font-semibold text-slate-900 dark:text-slate-100">{periode}</p>
                <p className="mt-0.5 text-[11.5px] leading-[1.3] text-slate-500 dark:text-slate-400">Payé le {datePaiement}</p>
              </div>
            </div>
          </div>

          {/* Tableau */}
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className={`border-b text-[11.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                <th className="py-2">Libellé</th>
                <th className="py-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="text-[13.5px]">
              <tr className={isDark ? 'border-b border-white/[0.05]' : 'border-b border-slate-100'}>
                <td className="py-2.5 text-slate-700 dark:text-slate-300">Salaire Brut</td>
                <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">{formatAriary(paiement.salaire_brut)}</td>
              </tr>
              <tr className={`text-red-600 dark:text-red-400 ${isDark ? 'border-b border-white/[0.05]' : 'border-b border-slate-100'}`}>
                <td className="py-2.5">CNaPS (1%)</td>
                <td className="py-2.5 text-right">- {formatAriary(paiement.cnaps)}</td>
              </tr>
              <tr className={`text-red-600 dark:text-red-400 ${isDark ? 'border-b border-white/[0.05]' : 'border-b border-slate-100'}`}>
                <td className="py-2.5">OSTIE (5%)</td>
                <td className="py-2.5 text-right">- {formatAriary(paiement.ostie)}</td>
              </tr>
              <tr className={`text-red-600 dark:text-red-400 ${isDark ? 'border-b border-white/[0.05]' : 'border-b border-slate-100'}`}>
                <td className="py-2.5">IRSA</td>
                <td className="py-2.5 text-right">- {formatAriary(paiement.irsa)}</td>
              </tr>
              <tr className={`text-red-600 dark:text-red-400 ${isDark ? 'border-b border-white/[0.05]' : 'border-b border-slate-100'}`}>
                <td className="py-2.5">Déduction Absence</td>
                <td className="py-2.5 text-right">- {formatAriary(paiement.absences_deduction || 0)}</td>
              </tr>
              <tr className={`text-red-600 dark:text-red-400 ${isDark ? 'border-b border-white/[0.05]' : 'border-b border-slate-100'}`}>
                <td className="py-2.5">Avance</td>
                <td className="py-2.5 text-right">- {formatAriary(paiement.avance)}</td>
              </tr>
              <tr className={`font-semibold ${isDark ? 'border-t-2 border-white/[0.12]' : 'border-t-2 border-slate-200'}`}>
                <td className="py-3 text-[13.5px] text-slate-900 dark:text-slate-100">NET À PAYER</td>
                <td className="py-3 text-right text-[13.5px] text-brand-600 dark:text-brand-400">{formatAriary(paiement.montant)}</td>
              </tr>
            </tbody>
          </table>

          {/* Signatures */}
          <div className="mt-6 flex justify-between">
            <div className="text-center">
              <p className="mb-6 text-[11.5px] leading-[1.3] text-slate-400 dark:text-slate-500">Signature Employeur</p>
              <div className={`h-10 w-40 border-b ${isDark ? 'border-white/[0.20]' : 'border-slate-300'}`}></div>
            </div>
            <div className="text-center">
              <p className="mb-6 text-[11.5px] leading-[1.3] text-slate-400 dark:text-slate-500">Signature Employé</p>
              <div className={`h-10 w-40 border-b ${isDark ? 'border-white/[0.20]' : 'border-slate-300'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default PaiementBulletinModal;