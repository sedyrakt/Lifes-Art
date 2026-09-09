import React from 'react';
import { Mail, Shield, AlertTriangle } from 'lucide-react';

interface ParametresAboutProps {
  isDark: boolean;
}

const ParametresAbout: React.FC<ParametresAboutProps> = ({ isDark }) => {
  const pageStyle = {
    background: isDark ? '#0F172A' : '#FFFFFF',
    minHeight: '100%',
  };
  const cardStyle = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
  };
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <div className="space-y-6 p-4 rounded-2xl" style={pageStyle}>
      {/* En-tête */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg overflow-hidden">
          <img
            src="./images/logos1.jpeg"
            alt="TahiryPro Logo"
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <h2 className="text-[18px] font-bold" style={{ color: textColor }}>À propos de TahiryPro</h2>
          <p className="text-[14px] font-medium" style={{ color: mutedColor }}>Gestion de stock professionnel</p>
        </div>
      </div>

      {/* Informations générales */}
      <div className="rounded-2xl border p-5" style={cardStyle}>
        <h3 className="text-[15px] font-semibold mb-4" style={{ color: textColor }}>Informations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[13px] font-medium" style={{ color: mutedColor }}>Nom de l'application</p>
            <p className="text-[15px] font-semibold" style={{ color: textColor }}>TahiryPro</p>
          </div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: mutedColor }}>Version</p>
            <p className="text-[15px] font-semibold" style={{ color: textColor }}>1.0.0</p>
          </div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: mutedColor }}>Auteur</p>
            <p className="text-[15px] font-semibold" style={{ color: textColor }}>TahiryPro ERP</p>
          </div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: mutedColor }}>Contact</p>
            <p className="text-[15px] font-semibold" style={{ color: textColor }}>
              <a href="mailto:sdrrakt@gmail.com" className="hover:underline" style={{ color: '#4F46E5' }}>
                sdrrakt@gmail.com
              </a>
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[13px] font-medium" style={{ color: mutedColor }}>Copyright</p>
            <p className="text-[15px] font-semibold" style={{ color: textColor }}>© 2026 TahiryPro. Tous droits réservés.</p>
          </div>
        </div>
      </div>

      {/* Avertissement */}
      <div className="rounded-2xl border p-5" style={{ background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.05)', borderColor: isDark ? 'rgba(239,68,68,0.30)' : 'rgba(239,68,68,0.20)' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-danger-500 mt-0.5" />
          <div>
            <p className="text-[14.5px] font-bold" style={{ color: isDark ? '#F8FAFC' : '#DC2626' }}>Avertissement</p>
            <p className="text-[13.5px] mt-1 leading-relaxed" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              Cette application est un logiciel propriétaire. Toute revente, distribution ou modification sans autorisation écrite préalable de l'auteur est strictement interdite. Pour toute demande de licence commerciale, veuillez contacter l'auteur à l'adresse e-mail indiquée ci-dessus.
            </p>
          </div>
        </div>
      </div>

      {/* Licence */}
      <div className="rounded-2xl border p-5" style={cardStyle}>
        <div className="flex items-center gap-3 mb-3">
          <Shield size={18} className="text-brand-500" />
          <h3 className="text-[15px] font-semibold" style={{ color: textColor }}>Licence</h3>
        </div>
        <p className="text-[13.5px] leading-relaxed" style={{ color: mutedColor }}>
          Ce logiciel est protégé par les lois sur la propriété intellectuelle. Il est concédé sous licence à l'utilisateur final pour un usage personnel ou professionnel, conformément aux conditions d'activation.
        </p>
      </div>
    </div>
  );
};

export default ParametresAbout;