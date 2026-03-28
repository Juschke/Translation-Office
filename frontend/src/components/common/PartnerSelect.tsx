import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaPlus, FaChevronDown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { partnerService } from '../../api/services';
import SearchableSelect from './SearchableSelect';
import Input from './Input';
import PhoneInput from './PhoneInput';
import LanguageSelect from './LanguageSelect';
import CountrySelect from './CountrySelect';
import clsx from 'clsx';
import { Button } from '../ui/button';

interface PartnerSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  className?: string;
  placeholder?: string;
  roundedSide?: 'both' | 'left' | 'right' | 'none';
}

interface QuickAddData {
  firstName: string;
  lastName: string;
  contactFirstName: string;
  contactLastName: string;
  company: string;
  email: string;
  phone: string;
  phoneLandline: string;
  languages: string[];
  country: string;
  type: 'translator' | 'translator_interpreter' | 'interpreter' | 'agency';
  salutation: string;
  street: string;
  houseNo: string;
  zip: string;
  city: string;
}

const PartnerSelect: React.FC<PartnerSelectProps> = ({
  options,
  value,
  onChange,
  error,
  className,
  placeholder = 'Übersetzer auswählen...',
  roundedSide = 'both'
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [quickAddData, setQuickAddData] = useState<QuickAddData>({
    firstName: '',
    lastName: '',
    contactFirstName: '',
    contactLastName: '',
    company: '',
    email: '',
    phone: '',
    phoneLandline: '',
    languages: [],
    country: 'Deutschland',
    type: 'translator',
    salutation: 'Herr',
    street: '',
    houseNo: '',
    zip: '',
    city: ''
  });

  const queryClient = useQueryClient();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const formRef = React.useRef<HTMLDivElement>(null);

  const createPartnerMutation = useMutation({
    mutationFn: partnerService.create,
    onSuccess: (newPartner) => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setShowForm(false);
      setIsExpanded(false);
      onChange(newPartner.id.toString());
      setQuickAddData({
        firstName: '',
        lastName: '',
        contactFirstName: '',
        contactLastName: '',
        company: '',
        email: '',
        phone: '',
        phoneLandline: '',
        languages: [],
        country: 'Deutschland',
        type: 'translator',
        salutation: 'Herr',
        street: '',
        houseNo: '',
        zip: '',
        city: ''
      });
      setValidationErrors([]);
      toast.success('Übersetzer hinzugefügt');
    },
    onError: () => {
      toast.error('Fehler beim Erstellen des Übersetzers');
    }
  });

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (quickAddData.type !== 'agency') {
      if (!quickAddData.firstName.trim()) errors.push('Vorname erforderlich');
      if (!quickAddData.lastName.trim()) errors.push('Nachname erforderlich');
    } else {
      if (!quickAddData.company.trim()) errors.push('Firmenname erforderlich');
      if (!quickAddData.contactFirstName.trim()) errors.push('Kontakt Vorname erforderlich');
      if (!quickAddData.contactLastName.trim()) errors.push('Kontakt Nachname erforderlich');
    }

    if (!quickAddData.email.trim()) {
      errors.push('E-Mail erforderlich');
    }

    if (!quickAddData.phone.trim()) {
      errors.push('Telefon erforderlich');
    }

    if (!quickAddData.languages || quickAddData.languages.length === 0) {
      errors.push('Mindestens eine Sprache erforderlich');
    }

    return errors;
  };

  const handleQuickAddSubmit = () => {
    const errors = validateForm();

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error(errors.length === 1 ? errors[0] : `${errors.length} Felder erforderlich: ${errors.join(', ')}`);
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return;
    }

    setValidationErrors([]);

    const submitData = {
      type: quickAddData.type,
      salutation: quickAddData.salutation,
      firstName: quickAddData.type === 'agency' ? quickAddData.contactFirstName : quickAddData.firstName,
      lastName: quickAddData.type === 'agency' ? quickAddData.contactLastName : quickAddData.lastName,
      company: quickAddData.company || '',
      emails: [quickAddData.email],
      phones: [quickAddData.phone],
      phone_landline: quickAddData.phoneLandline,
      languages: quickAddData.languages,
      country: quickAddData.country,
      street: quickAddData.street,
      houseNo: quickAddData.houseNo,
      zip: quickAddData.zip,
      city: quickAddData.city,
      domains: [],
      status: 'available',
      priceMode: 'per_unit'
    };

    createPartnerMutation.mutate(submitData);
  };

  return (
    <div className={clsx('w-full', className)} ref={containerRef}>
      {/* Dropdown + Toggle Button */}
      <div className="flex items-end gap-0">
        <div className="flex-1 min-w-0">
          <SearchableSelect
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            error={error}
            roundedSide={roundedSide === 'both' || roundedSide === 'left' ? 'left' : 'none'}
          />
        </div>
        <Button
          onClick={() => {
            const nextShow = !showForm;
            setShowForm(nextShow);
            setIsExpanded(nextShow);
            if (nextShow) {
              setTimeout(() => {
                if (containerRef.current) {
                  containerRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }
              }, 150);
            }
          }}
          className={clsx(
            "h-9 px-3 bg-white text-slate-400 border border-slate-300 border-l-0 hover:bg-slate-50 hover:text-brand-primary transition flex items-center shadow-sm shrink-0",
            (roundedSide === 'both' || roundedSide === 'right') && "rounded-r-sm"
          )}
          title={showForm ? "Schließen" : "Schnellanlage Partner"}
        >
          {showForm ? (
            <FaChevronDown className="text-xs transition-transform duration-200 rotate-180" />
          ) : (
            <FaPlus className="text-xs transition-transform duration-200" />
          )}
        </Button>
      </div>

      {/* Collapsible Form Section */}
      {showForm && (
        <div className="border border-t-0 border-slate-200 overflow-hidden">
          {/* Content */}
          {isExpanded && (
            <div className="p-6 bg-white space-y-6" ref={formRef}>
              {/* Error Message Box */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border-2 border-red-500 rounded-sm">
                  <div className="flex items-start gap-3">
                    <div className="text-red-500 mt-0.5">⚠</div>
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2">Folgende Felder sind erforderlich:</p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {validationErrors.map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Partnertyp Selection */}
              <div>
                <div className="flex bg-slate-100 p-1 rounded-sm gap-1 w-fit">
                  {[
                    { id: 'translator', label: 'Übersetzer' },
                    { id: 'translator_interpreter', label: 'Übersetzer & Dolmetscher' },
                    { id: 'interpreter', label: 'Dolmetscher' },
                    { id: 'agency', label: 'Agentur' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setQuickAddData(prev => ({ ...prev, type: t.id as any }))}
                      className={clsx(
                        "px-4 py-1.5 text-[11px] font-semibold rounded-sm transition-all whitespace-nowrap",
                        quickAddData.type === t.id
                          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stammdaten Section */}
              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-4 uppercase tracking-wider">Kontaktdaten</h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Salutation - Alone in row */}
                  <div className="col-span-2">
                    <div className="flex flex-col gap-2 w-full">

                      <div className="flex gap-6">
                        {['Herr', 'Frau'].map((sal) => (
                          <label
                            key={sal}
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setQuickAddData(prev => ({ ...prev, salutation: sal }))}
                          >
                            <div className={clsx(
                              "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                              quickAddData.salutation === sal
                                ? "border-brand-primary bg-white shadow-sm ring-1 ring-brand-primary/20"
                                : "bg-white border-slate-300 group-hover:border-slate-400"
                            )}>
                              {quickAddData.salutation === sal && (
                                <div className="w-2 h-2 rounded-full bg-brand-primary" />
                              )}
                            </div>
                            <span className={clsx(
                              "text-xs font-medium transition-colors",
                              quickAddData.salutation === sal ? "text-slate-900" : "text-slate-500"
                            )}>
                              {sal}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {quickAddData.type === 'agency' ? (
                    <>
                      <div className="col-span-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-slate-500">Firma / Agentur <span className="text-red-500 font-bold">*</span></label>
                          <div className={clsx(validationErrors.some(e => e.includes('Firm')) && "ring-2 ring-red-500/50 rounded-sm")}>
                            <Input
                              placeholder="Firmennamen"
                              value={quickAddData.company}
                              onChange={(e) => setQuickAddData(prev => ({ ...prev, company: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-500">Vorname <span className="text-red-500 font-bold">*</span></label>
                        <div className={clsx(validationErrors.some(e => e.includes('Kontakt Vorname')) && "ring-2 ring-red-500/50 rounded-sm")}>
                          <Input
                            placeholder="Vorname des AP"
                            value={quickAddData.contactFirstName}
                            onChange={(e) => setQuickAddData(prev => ({ ...prev, contactFirstName: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-500">Nachname <span className="text-red-500 font-bold">*</span></label>
                        <div className={clsx(validationErrors.some(e => e.includes('Kontakt Nachname')) && "ring-2 ring-red-500/50 rounded-sm")}>
                          <Input
                            placeholder="Nachname des AP"
                            value={quickAddData.contactLastName}
                            onChange={(e) => setQuickAddData(prev => ({ ...prev, contactLastName: e.target.value }))}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-500">Vorname <span className="text-red-500 font-bold">*</span></label>
                        <div className={clsx(validationErrors.some(e => e.includes('Vorname')) && "ring-2 ring-red-500/50 rounded-sm")}>
                          <Input
                            placeholder="Vorname"
                            value={quickAddData.firstName}
                            onChange={(e) => setQuickAddData(prev => ({ ...prev, firstName: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-500">Nachname <span className="text-red-500 font-bold">*</span></label>
                        <div className={clsx(validationErrors.some(e => e.includes('Nachname')) && "ring-2 ring-red-500/50 rounded-sm")}>
                          <Input
                            placeholder="Nachname"
                            value={quickAddData.lastName}
                            onChange={(e) => setQuickAddData(prev => ({ ...prev, lastName: e.target.value }))}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="col-span-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-500">E-Mail <span className="text-red-500 font-bold">*</span></label>
                      <div className={clsx(validationErrors.some(e => e.includes('E-Mail')) && "ring-2 ring-red-500/50 rounded-sm")}>
                        <Input
                          placeholder="E-Mail-Adresse"
                          type="email"
                          value={quickAddData.email}
                          onChange={(e) => setQuickAddData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-500">Mobiltelefon <span className="text-red-500 font-bold">*</span></label>
                      <div className={clsx(validationErrors.some(e => e.includes('Telefon')) && "ring-2 ring-red-500/50 rounded-sm")}>
                        <PhoneInput
                          value={quickAddData.phone}
                          onChange={(val) => setQuickAddData(prev => ({ ...prev, phone: val }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-500">Festnetznummer</label>
                      <PhoneInput
                        value={quickAddData.phoneLandline}
                        onChange={(val) => setQuickAddData(prev => ({ ...prev, phoneLandline: val }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sprachen Section */}
              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-4 uppercase tracking-wider">Sprachen</h4>
                <div className={clsx(validationErrors.some(e => e.includes('Sprache')) && "ring-2 ring-red-500/50 rounded-sm")}>
                  <LanguageSelect
                    value={quickAddData.languages}
                    onChange={(val) => setQuickAddData(prev => ({ ...prev, languages: Array.isArray(val) ? val : [val] }))}
                    isMulti={true}
                    error={validationErrors.some(e => e.includes('Sprache'))}
                  />
                </div>
              </div>

              {/* Adresse Section */}
              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-4 uppercase tracking-wider">Anschrift (optional)</h4>
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-4 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Straße</label>
                    <Input
                      placeholder="Straße"
                      value={quickAddData.street}
                      onChange={(e) => setQuickAddData(prev => ({ ...prev, street: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Hausnr.</label>
                    <Input
                      placeholder="Nr."
                      value={quickAddData.houseNo}
                      onChange={(e) => setQuickAddData(prev => ({ ...prev, houseNo: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-500">PLZ</label>
                    <Input
                      placeholder="PLZ"
                      value={quickAddData.zip}
                      onChange={(e) => setQuickAddData(prev => ({ ...prev, zip: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-4 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Stadt</label>
                    <Input
                      placeholder="Stadt"
                      value={quickAddData.city}
                      onChange={(e) => setQuickAddData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  {/* Land Section */}
                  <div className="col-span-6 mt-1.5">
                    <CountrySelect
                      value={quickAddData.country}
                      onChange={(val) => setQuickAddData(prev => ({ ...prev, country: val }))}
                      label="Land"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setIsExpanded(false);
                    setQuickAddData({
                      firstName: '',
                      lastName: '',
                      contactFirstName: '',
                      contactLastName: '',
                      company: '',
                      email: '',
                      phone: '',
                      phoneLandline: '',
                      languages: [],
                      country: 'Deutschland',
                      type: 'translator',
                      salutation: 'Herr',
                      street: '',
                      houseNo: '',
                      zip: '',
                      city: ''
                    });
                    setValidationErrors([]);
                  }}
                  className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleQuickAddSubmit}
                  disabled={createPartnerMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 shadow-brand-primary/20 shadow-lg transition-all active:scale-[0.98]"
                >
                  <FaPlus className="text-xs" />
                  {createPartnerMutation.isPending ? 'Speichern...' : 'Hinzufügen'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PartnerSelect;
