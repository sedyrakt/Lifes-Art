import React, { useEffect, useState } from 'react';
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl ${isDark ? 'bg-[#0F172A] border-white/[0.1]' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between border-b p-4 dark:border-white/[0.1]">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Bulletin de Paie</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600"><Printer size={14}/> Imprimer</button>
            <button onClick={handleDownload} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/[0.2] dark:text-slate-300"><Download size={14}/> PDF</button>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.1]"><X size={16}/></button>
          </div>
        </div>

        <div className="p-6 printable-area">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{company.nom || 'Entreprise'}</h3>
            <p className="text-sm text-slate-500">NIF : {company.nif || '—'}</p>
            <p className="text-sm text-slate-500">{company.adresse || '—'}</p>
          </div>

          <div className="border-t border-b border-dashed py-4 mb-4 dark:border-white/[0.2]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400">Employé</p>
                <p className="font-semibold text-slate-900 dark:text-white">{nomEmploye}</p>
                <p className="text-sm text-slate-500">{poste}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase font-bold text-slate-400">Période</p>
                <p className="font-semibold text-slate-900 dark:text-white">{periode}</p>
                <p className="text-sm text-slate-500">Payé le {datePaiement}</p>
              </div>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm text-slate-500 border-b">
                <th className="py-2">Libellé</th>
                <th className="py-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr><td className="py-2">Salaire Brut</td><td className="py-2 text-right font-medium">{formatAriary(paiement.salaire_brut)}</td></tr>
              <tr className="text-red-500"><td className="py-2">CNaPS (1%)</td><td className="py-2 text-right">- {formatAriary(paiement.cnaps)}</td></tr>
              <tr className="text-red-500"><td className="py-2">OSTIE (5%)</td><td className="py-2 text-right">- {formatAriary(paiement.ostie)}</td></tr>
              <tr className="text-red-500"><td className="py-2">IRSA</td><td className="py-2 text-right">- {formatAriary(paiement.irsa)}</td></tr>
              {/* ⭐ NOVAINA: Déduction Absence */}
              <tr className="text-red-500"><td className="py-2">Déduction Absence</td><td className="py-2 text-right">- {formatAriary(paiement.absences_deduction || 0)}</td></tr>
              <tr className="text-red-500"><td className="py-2">Avance</td><td className="py-2 text-right">- {formatAriary(paiement.avance)}</td></tr>
              <tr className="font-bold border-t-2 text-lg mt-2"><td className="py-3">NET À PAYER</td><td className="py-3 text-right text-brand-600">{formatAriary(paiement.montant)}</td></tr>
            </tbody>
          </table>

          <div className="mt-8 flex justify-between">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-8">Signature Employeur</p>
              <div className="h-10 w-40 border-b border-slate-300"></div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-8">Signature Employé</p>
              <div className="h-10 w-40 border-b border-slate-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaiementBulletinModal;