import React from 'react';
import { Building2, MapPin, Phone, Mail, FileText, Hash, Building, Shield, CreditCard, Clock, ChevronDown, Check } from 'lucide-react';

const inputBase = 'w-full h-10 px-3 rounded-lg border text-[14px] font-medium outline-none transition-all duration-150 focus:ring-2';

interface CompanySettingsFormProps {
  formData: any;
  errors: Record<string, string>;
  isDark: boolean;
  theme: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const FormField: React.FC<{ label: string; children: React.ReactNode; icon?: React.ReactNode; required?: boolean; className?: string; isDark: boolean; theme: any; style?: React.CSSProperties; }> = ({ label, children, icon, required, className = '', isDark, theme, style }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`} style={style}>
      <label className="flex items-center gap-1.5 text-[14px] font-medium" style={{ color: theme.muted }}>
        {icon && <span style={{ color: theme.primary }}>{icon}</span>}
        <span>{label}{required && <span className="ml-1" style={{ color: theme.danger }}>*</span>}</span>
      </label>
      {children}
    </div>
  );
};

const CompanySettingsForm: React.FC<CompanySettingsFormProps> = ({ formData, errors, isDark, theme, onChange }) => {
  const [isPaymentMethodOpen, setIsPaymentMethodOpen] = React.useState(false);

  const paymentMethods = [
    { value: 'Espèces', icon: CreditCard, label: 'Espèces' },
    { value: 'Virement', icon: Building, label: 'Virement bancaire' },
    { value: 'Chèque', icon: FileText, label: 'Chèque' },
    { value: 'Mobile Money', icon: Smartphone, label: 'Mobile Money' },
    { value: 'Carte', icon: CreditCard, label: 'Carte bancaire' },
  ];

  const selectedPayment = paymentMethods.find(m => m.value === formData.paymentMethod);
  const SelectedPaymentIcon = selectedPayment?.icon;

  const selectPaymentMethod = (value: string) => {
    onChange({ target: { name: 'paymentMethod', value } } as React.ChangeEvent<HTMLInputElement>);
    setIsPaymentMethodOpen(false);
  };

  const inputClass = (field?: string) => `${inputBase} ${isDark ? 'border-white/[0.15] bg-[#1E293B] text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:ring-brand-500/15' : 'border-gray-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500/15'} ${errors[field || ''] ? 'border-red-500 focus:border-red-500' : ''}`;
  const inputStyle = { background: theme.input, color: theme.text };

  return (
    <div className="flex flex-col">
      <section className="min-w-0 flex-1 overflow-hidden rounded-xl border" style={{ background: theme.card, borderColor: theme.border }}>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <FormField label="Nom" required icon={<Building2 size={14} />} isDark={isDark} theme={theme} className="border-r border-b px-4 py-3.5" style={{ borderColor: theme.border }}>
            <input type="text" name="name" value={formData.name || ''} onChange={onChange} placeholder="Nom de l'entreprise" className={inputClass('name')} style={inputStyle} />
          </FormField>
          <FormField label="Adresse" icon={<MapPin size={14} />} isDark={isDark} theme={theme} className="border-b px-4 py-3.5" style={{ borderColor: theme.border }}>
            <input type="text" name="address" value={formData.address || ''} onChange={onChange} placeholder="Adresse" className={inputClass('address')} style={inputStyle} />
          </FormField>
          <FormField label="Téléphone" icon={<Phone size={14} />} isDark={isDark} theme={theme} className="border-r border-b px-4 py-3.5" style={{ borderColor: theme.border }}>
            <input type="text" name="phone" value={formData.phone || ''} onChange={onChange} placeholder="+261 34 00 000 00" className={inputClass('phone')} style={inputStyle} />
          </FormField>
          <FormField label="Email" icon={<Mail size={14} />} isDark={isDark} theme={theme} className="border-b px-4 py-3.5" style={{ borderColor: theme.border }}>
            <input type="email" name="email" value={formData.email || ''} onChange={onChange} placeholder="contact@entreprise.com" className={inputClass('email')} style={inputStyle} />
          </FormField>
          <FormField label="SIRET" icon={<FileText size={14} />} isDark={isDark} theme={theme} className="border-r border-b px-4 py-3.5" style={{ borderColor: theme.border }}>
            <input type="text" name="siret" value={formData.siret || ''} onChange={onChange} placeholder="SIRET" className={inputClass('siret')} style={inputStyle} />
          </FormField>
          <FormField label="NIF / STAT" icon={<Hash size={14} />} isDark={isDark} theme={theme} className="border-b px-4 py-3.5" style={{ borderColor: theme.border }}>
            <input type="text" name="taxId" value={formData.taxId || ''} onChange={onChange} placeholder="NIF / STAT" className={inputClass('taxId')} style={inputStyle} />
          </FormField>
          <FormField label="RCS" icon={<Building size={14} />} isDark={isDark} theme={theme} className="border-r border-b px-4 py-3.5" style={{ borderColor: theme.border }}>
            <input type="text" name="rcs" value={formData.rcs || ''} onChange={onChange} placeholder="RCS" className={inputClass('rcs')} style={inputStyle} />
          </FormField>
          <FormField label="N° TVA" icon={<Shield size={14} />} isDark={isDark} theme={theme} className="border-b px-4 py-3.5" style={{ borderColor: theme.border }}>
            <input type="text" name="vatNumber" value={formData.vatNumber || ''} onChange={onChange} placeholder="N° TVA" className={inputClass('vatNumber')} style={inputStyle} />
          </FormField>
          <FormField label="Mode de paiement" icon={<CreditCard size={14} />} isDark={isDark} theme={theme} className="border-r border-b px-4 py-3.5" style={{ borderColor: theme.border }}>
            <div className="relative">
              <button type="button" onClick={() => setIsPaymentMethodOpen(v => !v)} className="flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-[14px] font-medium outline-none transition-all" style={{ background: theme.input, color: theme.text, borderColor: isPaymentMethodOpen ? theme.primary : theme.border }}>
                <span className="flex min-w-0 items-center gap-2">
                  {SelectedPaymentIcon ? (<><SelectedPaymentIcon size={16} style={{ color: theme.primary }} /><span className="truncate">{selectedPayment?.label || 'Espèces'}</span></>) : (<span className="truncate">Espèces</span>)}
                </span>
                <ChevronDown size={15} className={`shrink-0 transition-transform ${isPaymentMethodOpen ? 'rotate-180' : ''}`} style={{ color: theme.subMuted }} />
              </button>
              {isPaymentMethodOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border p-1 shadow-xl" style={{ background: isDark ? '#1E293B' : '#FFFFFF', borderColor: theme.border }}>
                  {paymentMethods.map(method => {
                    const Icon = method.icon;
                    const selected = formData.paymentMethod === method.value;
                    return (
                      <button key={method.value} type="button" onClick={() => selectPaymentMethod(method.value)} className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[14px] transition-colors hover:bg-brand-50 dark:hover:bg-white/[0.06]" style={{ color: selected ? theme.primary : theme.text, background: selected ? theme.primaryBg : 'transparent' }}>
                        <Icon size={15} style={{ color: selected ? theme.primary : theme.subMuted }} />
                        <span className="flex-1">{method.label}</span>
                        {selected && <Check size={14} strokeWidth={2.5} style={{ color: theme.primary }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </FormField>
          <FormField label="Conditions de paiement" icon={<Clock size={14} />} isDark={isDark} theme={theme} className="border-b px-4 py-3.5" style={{ borderColor: theme.border }}>
            <div className="relative">
              <select name="paymentTerms" value={formData.paymentTerms || 'Sous 30 jours'} onChange={onChange} className="h-10 w-full appearance-none rounded-lg border px-3 pr-9 text-[14px] font-medium outline-none" style={{ background: theme.input, color: theme.text, borderColor: theme.border }}>
                <option value="Sous 30 jours">Sous 30 jours</option>
                <option value="Sous 45 jours">Sous 45 jours</option>
                <option value="Sous 60 jours">Sous 60 jours</option>
                <option value="À réception">À réception</option>
                <option value="Comptant">Comptant</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: theme.subMuted }} />
            </div>
          </FormField>
        </div>
      </section>
    </div>
  );
};

export default CompanySettingsForm;