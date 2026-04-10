import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEnvelope } from 'react-icons/fa';
import type { PartnerFormData } from './partnerTypes';
import { partnerService } from '../../api/services';
import LanguageSelect from '../common/LanguageSelect';
import Input from '../common/Input';
import PhoneInput from '../common/PhoneInput';
import toast from 'react-hot-toast';
import MultiSelect from '../common/MultiSelect';
import clsx from 'clsx';
import AddressForm from '../common/AddressForm';
import PartnerDuplicateWarning from './PartnerDuplicateWarning';
import PartnerBankingSection from './PartnerBankingSection';
import PartnerRatesSection from './PartnerRatesSection';
import PartnerInternalSection from './PartnerInternalSection';


const DOMAIN_OPTIONS = [
  { value: 'agrarwirtschaft', label: 'Agrarwirtschaft' },
  { value: 'architektur', label: 'Architektur' },
  { value: 'automobil', label: 'Automobil' },
  { value: 'bankwesen', label: 'Bankwesen' },
  { value: 'bauwesen', label: 'Bauwesen' },
  { value: 'chemie', label: 'Chemie' },
  { value: 'elektrotechnik', label: 'Elektrotechnik' },
  { value: 'energie', label: 'Energie' },
  { value: 'finanzen', label: 'Finanzen' },
  { value: 'it', label: 'IT & Software' },
  { value: 'juristisch', label: 'Juristisch' },
  { value: 'kosmetik', label: 'Kosmetik' },
  { value: 'kunst', label: 'Kunst & Kultur' },
  { value: 'literatur', label: 'Literatur' },
  { value: 'marketing', label: 'Marketing & PR' },
  { value: 'maschinenbau', label: 'Maschinenbau' },
  { value: 'medizin', label: 'Medizin & Pharma' },
  { value: 'nahrungsmittel', label: 'Nahrungsmittel' },
  { value: 'oekologie', label: 'Ökologie & Umwelt' },
  { value: 'recht', label: 'Recht' },
  { value: 'technik', label: 'Technik' },
  { value: 'telekommunikation', label: 'Telekommunikation' },
  { value: 'tourismus', label: 'Tourismus' },
  { value: 'wirtschaft', label: 'Wirtschaft' }
];

export type { PartnerFormData } from './partnerTypes';

interface PartnerFormProps {
  initialData?: Partial<PartnerFormData> | any;
  onChange: (data: PartnerFormData) => void;
  onDuplicatesChange?: (hasDuplicates: boolean) => void;
  ignoreDuplicates?: boolean;
  onIgnoreDuplicatesChange?: (ignore: boolean) => void;
  validationErrors?: Set<string>;
  layout?: 'full' | 'compact';
}

const PartnerForm: React.FC<PartnerFormProps> = ({
  initialData,
  onChange,
  onDuplicatesChange,
  ignoreDuplicates,
  onIgnoreDuplicatesChange,
  validationErrors: externalValidationErrors = new Set(),
  layout = 'full'
}) => {
  const [formData, setFormData] = useState<PartnerFormData>({
    type: 'translator',
    salutation: 'Herr',
    firstName: '',
    lastName: '',
    company: '',
    street: '',
    houseNo: '',
    zip: '',
    city: '',
    country: 'Deutschland',
    emails: [''],
    phones: [''],
    mobile: '',
    languages: [] as string[],
    domains: [] as string[],
    bankAccountHolder: '',
    bankCode: '',
    software: '',
    priceMode: 'per_unit',
    unitRates: { word: '', line: '', hour: '' },
    flatRates: { minimum: '', cert: '' },
    paymentTerms: '30',
    taxId: '',
    bankName: '',
    iban: '',
    bic: '',
    notes: '',
    status: 'available',
    rating: 0,
    portal_access: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidatingIban, setIsValidatingIban] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [savedGroupData, setSavedGroupData] = useState<Partial<PartnerFormData>>({});
  const [activeTab, setActiveTab] = useState<'general' | 'skills' | 'banking' | 'rates' | 'internal'>('general');

  const handleTypeChange = (newType: string) => {
    if (newType === formData.type) return;

    if (formData.type === 'agency') {
      setSavedGroupData(prev => ({
        ...prev,
        company: formData.company
      }));
    }

    setFormData(prev => {
      const next = { ...prev, type: newType };

      if (newType !== 'agency') {
        next.company = '';
      } else {
        next.company = savedGroupData.company || prev.company || '';
      }

      onChange(next);
      return next;
    });
  };

  useEffect(() => {
    onDuplicatesChange?.(duplicates.length > 0);
  }, [duplicates.length, onDuplicatesChange]);

  useEffect(() => {
    if (externalValidationErrors.size > 0) {
      if (externalValidationErrors.has('lastName') || externalValidationErrors.has('firstName') || externalValidationErrors.has('company') || externalValidationErrors.has('email')) {
        setActiveTab('general');
      } else if (externalValidationErrors.has('bankName') || externalValidationErrors.has('bic') || externalValidationErrors.has('iban')) {
        setActiveTab('banking');
        toast.error('Bitte vervollständigen Sie die Bankdaten.');
      }
    }
  }, [externalValidationErrors]);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Map backend snake_case to frontend camelCase
        firstName: initialData.firstName || initialData.first_name || '',
        lastName: initialData.lastName || initialData.last_name || '',
        street: initialData.street || initialData.address_street || '',
        houseNo: initialData.houseNo || initialData.address_house_no || '',
        zip: initialData.zip || initialData.address_zip || '',
        city: initialData.city || initialData.address_city || '',
        taxId: initialData.taxId || initialData.tax_id || '',
        paymentTerms: initialData.paymentTerms?.toString() || initialData.payment_terms?.toString() || '30',
        priceMode: initialData.priceMode || initialData.price_mode || 'per_unit',
        bankName: initialData.bankName || initialData.bank_name || '',
        unitRates: { ...prev.unitRates, ...(initialData.unit_rates || initialData.unitRates || {}) },
        flatRates: { ...prev.flatRates, ...(initialData.flat_rates || initialData.flatRates || {}) },
        emails: initialData.emails || (initialData.email ? [initialData.email] : (initialData.additional_emails ? [initialData.email, ...initialData.additional_emails] : [''])),
        phones: initialData.phones || (initialData.phone ? [initialData.phone] : (initialData.additional_phones ? [initialData.phone, ...initialData.additional_phones] : [''])),
        mobile: initialData.mobile || '',
        languages: Array.isArray(initialData.languages) ? initialData.languages : (typeof initialData.languages === 'string' ? initialData.languages.split(',').map((l: string) => l.trim()) : []),
        domains: Array.isArray(initialData.domains) ? initialData.domains : (typeof initialData.domains === 'string' ? initialData.domains.split(',').map((d: string) => d.trim()) : []),
        portal_access: initialData.portal_access ?? false
      }));
    }
  }, [initialData]);

  const updateFormData = (Updates: Partial<PartnerFormData>) => {
    setFormData(prev => {
      const next = { ...prev, ...Updates };
      onChange(next);
      return next;
    });
  };

  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const validateEmail = (email: string) => {
    if (!email) return 'E-Mail ist erforderlich';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ungültige E-Mail-Adresse';
    return '';
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      const searchEmail = formData.emails[0];
      const searchLast = formData.lastName;
      const searchCompany = formData.company;

      if (searchEmail.length > 3 || (searchLast.length > 3) || (searchCompany.length > 3)) {
        try {
          const results = await partnerService.checkDuplicates({
            email: searchEmail,
            firstName: formData.firstName,
            lastName: searchLast,
            company: searchCompany
          });
          setDuplicates(results.filter((r: any) => r.id !== initialData?.id));
        } catch (e) {
          console.error("Duplicate check failed", e);
        }
      } else {
        setDuplicates([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.emails, formData.lastName, formData.company, initialData?.id]);

  const updateEmail = (index: number, val: string) => {
    const newEmails = [...formData.emails];
    newEmails[index] = val;
    updateFormData({ emails: newEmails });

    if (index === 0) {
      setErrors(prev => ({ ...prev, email: validateEmail(val) }));
    }
  };

  const addEmail = () => updateFormData({ emails: [...formData.emails, ''] });
  const removeEmail = (index: number) => updateFormData({ emails: formData.emails.filter((_, i) => i !== index) });

  const addPhone = () => updateFormData({ phones: [...formData.phones, ''] });
  const removePhone = (index: number) => updateFormData({ phones: formData.phones.filter((_, i) => i !== index) });

  const partnerTypes = [
    { value: 'translator', label: 'Übersetzer' },
    { value: 'trans_interp', label: 'Übersetzer & Dolmetscher' },
    { value: 'interpreter', label: 'Dolmetscher' },
    { value: 'agency', label: 'Agentur' }
  ];

  const isCompact = layout === 'compact';

  const handleIbanBlur = async () => {
    const cleanIban = (formData.iban || '').replace(/\s/g, '');
    if (!cleanIban || cleanIban.length < 15) return;
    setIsValidatingIban(true);
    try {
      const response = await fetch(`https://openiban.com/validate/${cleanIban}?getBIC=true&validateBankCode=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          updateFormData({
            bic: data.bankData?.bic || formData.bic,
            bankName: data.bankData?.name || formData.bankName,
            bankCode: data.bankData?.bankCode || formData.bankCode,
          });
          setErrors((prev: Record<string, string>) => ({ ...prev, iban: '' }));
          toast.success(`Bank erkannt: ${data.bankData?.name || 'IBAN valide'}`);
        } else {
          setErrors((prev: Record<string, string>) => ({ ...prev, iban: 'Ungültige IBAN' }));
        }
      }
    } catch (error: unknown) {
      console.warn('IBAN Validation API unavailable');
    } finally {
      setIsValidatingIban(false);
    }
  };

  const handleBicBlur = () => {
    const bicVal = (formData.bic || '').toUpperCase().trim();
    if (!bicVal || bicVal.length < 4) return;
    const commonBanks: Record<string, string> = {
      'DEUTDE': 'Deutsche Bank AG',
      'COMADE': 'Commerzbank AG',
      'DRESDE': 'Dresdner Bank',
      'PBNKDE': 'Postbank (DB)',
      'INGDDE': 'ING-DiBa AG',
      'N26ADE': 'N26 Bank AG',
      'SOLODE': 'Solarisbank AG',
      'DKBADE': 'DKB Deutsche Kreditbank',
      'GENODE': 'Volksbanken Raiffeisenbanken',
      'HASADE': 'Hamburger Sparkasse',
      'BELADE': 'Berliner Sparkasse',
      'MAZADE': 'Mainzer Volksbank',
      'KRHADE': 'Sparkasse Hannover',
      'WELADE': 'Landesbank Baden-Württemberg',
      'BYLADE': 'BayernLB',
      'HEFADE': 'Helaba',
      'NOLA DE': 'NordLB'
    };
    const prefix6 = bicVal.substring(0, 6);
    const prefix4 = bicVal.substring(0, 4);
    if (!formData.bankName) {
      const foundBank = commonBanks[prefix6] || commonBanks[prefix4];
      if (foundBank) {
        updateFormData({ bankName: foundBank });
      }
    }
  };

  const getError = (field: string) => (touched[field] || externalValidationErrors.has(field)) ? errors[field] : '';

  return (
    <div className={clsx(isCompact ? "space-y-4" : "flex flex-col h-full")}>
      <PartnerDuplicateWarning
        duplicates={duplicates}
        ignoreDuplicates={ignoreDuplicates}
        onIgnoreDuplicatesChange={onIgnoreDuplicatesChange}
      />

      {!isCompact && (
        <div className="flex space-x-1 border-b border-slate-200 mb-4 shrink-0 overflow-x-auto custom-scrollbar pb-1">
          <button type="button" onClick={() => setActiveTab('general')} className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'general' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Allgemein</button>
          <button type="button" onClick={() => setActiveTab('skills')} className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'skills' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Kompetenzen & IT</button>
          <button type="button" onClick={() => setActiveTab('banking')} className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'banking' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Bankdaten</button>
          <button type="button" onClick={() => setActiveTab('rates')} className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'rates' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Konditionen</button>
          <button type="button" onClick={() => setActiveTab('internal')} className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'internal' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Internes</button>
        </div>
      )}

      <div className={clsx("flex-1 overflow-y-auto space-y-6 pb-6", !isCompact && "pr-1 custom-scrollbar")}>
        <div className={clsx("space-y-6", !isCompact && activeTab !== 'general' && "hidden")}>
          <div className="space-y-4">
            {!isCompact && (
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-sm bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-semibold">01</div>
                <h4 className="text-xs font-semibold text-slate-800">Klassifizierung & Name</h4>
              </div>
            )}

            <div className="grid grid-cols-12 gap-x-8 gap-y-3">
              <div className="col-span-12">
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Partner-Typ</label>
                <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 w-fit">
                  {partnerTypes.map(pt => (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => handleTypeChange(pt.value)}
                      className={clsx(
                        "px-4 py-2 rounded-sm text-xs font-medium transition-all",
                        formData.type === pt.value ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.type === 'agency' && (
                <div className="col-span-12 animate-fadeIn" data-field="company">
                  <Input
                    required={formData.type === 'agency'}
                    label={formData.type === 'agency' ? 'Firma / Agenturname' : 'Firma / Agenturname'}
                    placeholder="z.B. Übersetzungsbüro Kassel"
                    value={formData.company}
                    error={!!getError('company') || duplicates.some(d => d.company === formData.company && formData.company !== '')}
                    onChange={e => updateFormData({ company: e.target.value })}
                    onBlur={() => markTouched('company')}
                    helperText={getError('company')}
                  />
                </div>
              )}

              <div className="col-span-12 pt-1 pb-1">
                <label className="block text-xs font-medium text-slate-400 mb-2 ml-1">Anrede</label>
                <div className="flex items-center gap-10 h-6 ml-1">
                  <label className="flex items-center gap-3 cursor-pointer group relative">
                    <input 
                      type="radio" 
                      name="salutation_partner"
                      checked={formData.salutation === 'Herr'}
                      onChange={() => updateFormData({ salutation: 'Herr' })}
                      className="sr-only"
                    />
                    <div className={clsx(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                      formData.salutation === 'Herr' ? "border-brand-primary bg-brand-primary/5 shadow-[0_0_0_4px_rgba(var(--brand-primary-rgb),0.1)]" : "border-slate-300 group-hover:border-slate-400 bg-white"
                    )}>
                      <div className={clsx(
                        "w-2.5 h-2.5 rounded-full bg-brand-primary transition-all duration-200 transform",
                        formData.salutation === 'Herr' ? "scale-100 opacity-100" : "scale-0 opacity-0"
                      )} />
                    </div>
                    <span className={clsx(
                      "text-sm font-semibold transition-colors",
                      formData.salutation === 'Herr' ? "text-brand-primary" : "text-slate-600 group-hover:text-slate-900"
                    )}>Herr</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group relative">
                    <input 
                      type="radio" 
                      name="salutation_partner"
                      checked={formData.salutation === 'Frau'}
                      onChange={() => updateFormData({ salutation: 'Frau' })}
                      className="sr-only"
                    />
                    <div className={clsx(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                      formData.salutation === 'Frau' ? "border-brand-primary bg-brand-primary/5 shadow-[0_0_0_4px_rgba(var(--brand-primary-rgb),0.1)]" : "border-slate-300 group-hover:border-slate-400 bg-white"
                    )}>
                      <div className={clsx(
                        "w-2.5 h-2.5 rounded-full bg-brand-primary transition-all duration-200 transform",
                        formData.salutation === 'Frau' ? "scale-100 opacity-100" : "scale-0 opacity-0"
                      )} />
                    </div>
                    <span className={clsx(
                      "text-sm font-semibold transition-colors",
                      formData.salutation === 'Frau' ? "text-brand-primary" : "text-slate-600 group-hover:text-slate-900"
                    )}>Frau</span>
                  </label>
                </div>
              </div>

              <div className="col-span-12 md:col-span-6" data-field="firstName">
                <Input
                  required
                  label="Vorname"
                  placeholder="z.B. Maria"
                  value={formData.firstName}
                  error={!!getError('firstName') || duplicates.some(d => d.first_name === formData.firstName && d.last_name === formData.lastName && formData.firstName !== '')}
                  onChange={e => updateFormData({ firstName: e.target.value })}
                  onBlur={() => markTouched('firstName')}
                  helperText={getError('firstName')}
                />
              </div>
              <div className="col-span-12 md:col-span-6" data-field="lastName">
                <Input
                  required
                  label="Nachname"
                  placeholder="z.B. Musterfrau"
                  value={formData.lastName}
                  error={!!getError('lastName') || duplicates.some(d => d.last_name === formData.lastName && formData.lastName !== '')}
                  onChange={e => updateFormData({ lastName: e.target.value })}
                  onBlur={() => markTouched('lastName')}
                  helperText={getError('lastName')}
                />
              </div>

              <div className="col-span-12 space-y-2 animate-fadeIn" data-field="languages">
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">
                  Sprachen <span className="text-red-500 ml-0.5">*</span>
                </label>
                <LanguageSelect
                  isMulti={true}
                  value={formData.languages}
                  onChange={v => updateFormData({ languages: v })}
                  placeholder="Sprachen auswählen..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {!isCompact && (
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-sm bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-semibold">02</div>
                <h4 className="text-xs font-semibold text-slate-800">Kontaktdaten</h4>
              </div>
            )}

            <div className="grid grid-cols-12 gap-x-8 gap-y-3">
              <div className="col-span-12 md:col-span-6 space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">
                    E-Mail (Primär) <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  {formData.emails.map((email, i) => (
                    <div key={i} className="flex gap-2 group animate-fadeIn items-start" data-field={i === 0 ? "email" : undefined}>
                      <Input
                        containerClassName="flex-1"
                        type="email"
                        startIcon={<FaEnvelope />}
                        placeholder={i === 0 ? "haupt.partner@beispiel.de" : "zusatz.partner@beispiel.de"}
                        value={email}
                        error={(i === 0 && !!getError('email')) || (i === 0 && duplicates.some(d => d.email === email && email !== ''))}
                        onChange={e => updateEmail(i, e.target.value)}
                        helperText={i === 0 ? getError('email') : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => removeEmail(i)}
                        className={clsx(
                          "h-9 px-3 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-sm transition flex-shrink-0",
                          i === 0 && formData.emails.length === 1 ? "hidden" : ""
                        )}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                  {formData.emails.length < 3 && (
                    <button type="button" onClick={addEmail} className="text-xs text-slate-400 font-medium flex items-center gap-1.5 hover:text-slate-700 transition-colors py-1 ml-1">
                      <FaPlus className="text-[10px]" /> Weitere E-Mail
                    </button>
                  )}
                </div>
              </div>

              <div className="col-span-12 md:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div data-field="phone">
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">
                    Festnetz (Primär) <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <PhoneInput
                    required
                    value={formData.phones[0] || ''}
                    error={duplicates.some(d => (d.phone === formData.phones[0] || d.phones?.[0] === formData.phones[0]) && formData.phones[0] !== '')}
                    onChange={val => {
                      const newPhones = [...formData.phones];
                      newPhones[0] = val;
                      updateFormData({ phones: newPhones });
                    }}
                  />
                </div>
                <div data-field="mobile">
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Mobil</label>
                  <PhoneInput
                    value={formData.mobile || ''}
                    error={duplicates.some(d => (d.mobile === formData.mobile) && formData.mobile !== '')}
                    onChange={val => updateFormData({ mobile: val })}
                  />
                </div>
                <div className="col-span-full space-y-1">
                  {formData.phones.slice(1).map((phone, i) => (
                    <div key={i + 1} className="flex gap-2 group animate-fadeIn items-start">
                      <div className="flex-1">
                        <PhoneInput
                          value={phone}
                          onChange={val => {
                            const newPhones = [...formData.phones];
                            newPhones[i + 1] = val;
                            updateFormData({ phones: newPhones });
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhone(i + 1)}
                        className="h-9 px-3 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-sm transition flex-shrink-0"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                  {formData.phones.length < 3 && (
                    <button type="button" onClick={addPhone} className="text-xs text-slate-400 font-medium flex items-center gap-1.5 hover:text-slate-700 transition-colors py-1 ml-1">
                      <FaPlus className="text-[10px]" /> Weitere Nummer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {!isCompact && (
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-sm bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-semibold">03</div>
                <h4 className="text-xs font-semibold text-slate-800">Standort & Adresse</h4>
              </div>
            )}

            <div className="grid grid-cols-12 gap-x-8 gap-y-3">
              {!isCompact && (
                <div className="col-span-12">
                  <AddressForm
                    street={formData.street}
                    houseNo={formData.houseNo}
                    zip={formData.zip}
                    city={formData.city}
                    country={formData.country}
                    onChange={(field, value) => {
                      const fieldMap: Record<string, string> = {
                        street: 'street',
                        houseNo: 'houseNo',
                        zip: 'zip',
                        city: 'city',
                        country: 'country'
                      };
                      updateFormData({ [fieldMap[field]]: value });
                    }}
                    errors={{
                      address_zip: getError('zip'),
                      address_street: (getError('street') || externalValidationErrors.has('street')) ? 'Erforderlich' : '',
                      address_city: (getError('city') || externalValidationErrors.has('city')) ? 'Erforderlich' : '',
                      address_house_no: (getError('houseNo') || externalValidationErrors.has('houseNo')) ? 'Erforderlich' : '',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {!isCompact && (
          <>
            <div className={clsx("space-y-4", activeTab !== 'skills' && "hidden")}>
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-sm bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-semibold">04</div>
                <h4 className="text-xs font-semibold text-slate-800">Kompetenzen & IT</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2" data-field="domains">
                  <MultiSelect
                    label="Fachgebiete / Spezialisierung"
                    options={DOMAIN_OPTIONS}
                    value={formData.domains}
                    onChange={v => updateFormData({ domains: v })}
                    placeholder="Fachgebiete auswählen..."
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Input
                    label="Software-Kenntnisse"
                    placeholder="z.B. SDL Trados, Memsource, memoQ..."
                    value={formData.software}
                    onChange={e => updateFormData({ software: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className={clsx(activeTab !== 'banking' && "hidden")}>
              <PartnerBankingSection
                formData={formData}
                updateFormData={updateFormData}
                markTouched={markTouched}
                getError={getError}
                handleIbanBlur={handleIbanBlur}
                handleBicBlur={handleBicBlur}
                isValidatingIban={isValidatingIban}
              />
            </div>

            <div className={clsx(activeTab !== 'rates' && "hidden")}>
              <PartnerRatesSection
                formData={formData}
                updateFormData={updateFormData}
              />
            </div>

            <div className={clsx(activeTab !== 'internal' && "hidden")}>
              <PartnerInternalSection
                formData={formData}
                updateFormData={updateFormData}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PartnerForm;
