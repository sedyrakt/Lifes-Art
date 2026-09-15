// src/components/parametres/ParametresAbout.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProfileSidebar / ProfileForm
// ⭐ FONT SIZE: h2 15px, h3 14px, subtitle 13px, labels 12px, values 14px

import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

interface ParametresAboutProps {
  isDark: boolean;
}

const ParametresAbout: React.FC<ParametresAboutProps> = ({ isDark }) => {
  const pageStyle = {
    background: isDark ? '#0F172A' : '#FFFFFF',
    minHeight: '100%',
  };
  const cardStyle = {
    background: isDark ? '#0F172A' : '#FFFFFF',
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
  };
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <div className="space-y-4 p-4 rounded-xl" style={pageStyle}>
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div>
          {/* ⭐ h2 : 13.5px → 15px */}
          <h2 className="text-[15px] font-semibold leading-tight" style={{ color: textColor }}>À propos de Life's Art</h2>
          {/* ⭐ Subtitle : 11.5px → 13px */}
          <p className="text-[13px] font-medium leading-[1.3] mt-0.5" style={{ color: mutedColor }}>Gestion de stock professionnel</p>
        </div>
      </div>

      {/* Informations générales */}
      <div className="rounded-xl border-[0.5px] p-3.5" style={cardStyle}>
        {/* ⭐ h3 : 13.5px → 14px */}
        <h3 className="text-[14px] font-semibold leading-tight mb-3" style={{ color: textColor }}>Informations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            {/* ⭐ Label : 11.5px → 12px */}
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] leading-[1.3]" style={{ color: mutedColor }}>Nom de l'application</p>
            {/* ⭐ Value : 13.5px → 14px */}
            <p className="text-[14px] font-semibold leading-tight mt-0.5" style={{ color: textColor }}>Life's Art</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] leading-[1.3]" style={{ color: mutedColor }}>Version</p>
            <p className="text-[14px] font-semibold leading-tight mt-0.5" style={{ color: textColor }}>1.0.0</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] leading-[1.3]" style={{ color: mutedColor }}>Auteur</p>
            <p className="text-[14px] font-semibold leading-tight mt-0.5" style={{ color: textColor }}>Life's Art ERP</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] leading-[1.3]" style={{ color: mutedColor }}>Contact</p>
            <p className="text-[14px] font-semibold leading-tight mt-0.5" style={{ color: textColor }}>
              <a href="mailto:Ianjamiarisoa@gmail.com" className="hover:underline" style={{ color: '#4F46E5' }}>
                Ianjamiarisoa@gmail.com
              </a>
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] leading-[1.3]" style={{ color: mutedColor }}>Copyright</p>
            <p className="text-[14px] font-semibold leading-tight mt-0.5" style={{ color: textColor }}>© 2026 Life's Art. Tous droits réservés.</p>
          </div>
        </div>
      </div>

      {/* Avertissement */}
      <div className="rounded-xl border-[0.5px] p-3.5" style={{ background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.05)', borderColor: isDark ? 'rgba(239,68,68,0.30)' : 'rgba(239,68,68,0.20)' }}>
        <div className="flex items-start gap-2.5">
          {/* ⭐ Icon : 18 → 19 */}
          <AlertTriangle size={19} strokeWidth={2.2} className="text-red-500 mt-0.5" />
          <div>
            {/* ⭐ Title : 13.5px → 14px */}
            <p className="text-[14px] font-semibold leading-tight" style={{ color: isDark ? '#F8FAFC' : '#DC2626' }}>Avertissement</p>
            {/* ⭐ Text : 11.5px → 13px */}
            <p className="text-[13px] mt-1 leading-[1.4]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              Cette application est un logiciel propriétaire. Toute revente, distribution ou modification sans autorisation écrite préalable de l'auteur est strictement interdite. Pour toute demande de licence commerciale, veuillez contacter l'auteur à l'adresse e-mail indiquée ci-dessus.
            </p>
          </div>
        </div>
      </div>

      {/* Licence */}
      <div className="rounded-xl border-[0.5px] p-3.5" style={cardStyle}>
        <div className="flex items-center gap-2.5 mb-2">
          {/* ⭐ Shield icon : 16 → 17 */}
          <Shield size={17} strokeWidth={2.2} className="text-brand-500" />
          {/* ⭐ h3 : 13.5px → 14px */}
          <h3 className="text-[14px] font-semibold leading-tight" style={{ color: textColor }}>Licence</h3>
        </div>
        {/* ⭐ Text : 11.5px → 13px */}
        <p className="text-[13px] leading-[1.4]" style={{ color: mutedColor }}>
          Ce logiciel est protégé par les lois sur la propriété intellectuelle. Il est concédé sous licence à l'utilisateur final pour un usage personnel ou professionnel, conformément aux conditions d'activation.
        </p>
      </div>
    </div>
  );
};

export default ParametresAbout;