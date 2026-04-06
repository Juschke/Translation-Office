import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaPlus, FaChevronDown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { customerService } from '../../api/services';
import SearchableSelect from './SearchableSelect';
import Input from './Input';
import PhoneInput from './PhoneInput';
import CountrySelect from './CountrySelect';
import clsx from 'clsx';
import { Button } from '../ui/button';
import axios from 'axios';
import { fetchCityByZip } from '../../utils/autoFill';

interface CustomerSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  className?: string;
  placeholder?: string;
  roundedSide?: 'both' | 'left' | 'right' | 'none';
}

interface QuickAddData {
  first_name: string;
  last_name: string;
  company_name: string;
  contact_first_name: string;
  contact_last_name: string;
  address_street: string;
  address_house_no: string;
  address_zip: string;
  address_city: string;
  address_country: string;
  phone_mobile: string;
  phone_landline: string;
  email: string;
  type: 'private' | 'company';
  salutation: string;
}

const FormField = ({ label, children, required, colSpan = 1, error }: { label: string; children: React.ReactNode; required?: boolean; colSpan?: number; error?: boolean }) => (
  <div className={clsx('flex flex-col gap-1.5', colSpan === 2 && 'col-span-2')}>
    <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
      {label}
      {required && <span className="text-red-500 font-bold">*</span>}
    </label>
    <div className={clsx("w-full", error && "ring-2 ring-red-500/50 rounded-sm")}>{children}</div>
  </div>
);

const CustomerSelect: React.FC<CustomerSelectProps> = ({
  options,
  value,
  onChange,
  error,
  className,
  placeholder = 'Kunde auswählen...',
  roundedSide = 'both'
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [streetSuggestions, setStreetSuggestions] = useState<any[]>([]);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [quickAddData, setQuickAddData] = useState<QuickAddData>({
    first_name: '',
    last_name: '',
    company_name: '',
    contact_first_name: '',
    contact_last_name: '',
    address_street: '',
    address_house_no: '',
    address_zip: '',
    address_city: '',
    address_country: 'Deutschland',
    phone_mobile: '',
    phone_landline: '',
    email: '',
    type: 'private',
    salutation: 'Herr'
  });

  const queryClient = useQueryClient();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const formRef = React.useRef<HTMLDivElement>(null);

  // Auto-fill city when ZIP changes
  useEffect(() => {
    const fillCity = async () => {
      if (quickAddData.address_zip && quickAddData.address_zip.length === 5 && !quickAddData.address_city) {
        const autoCity = await fetchCityByZip(quickAddData.address_zip, quickAddData.address_country);
        if (autoCity) {
          setQuickAddData(prev => ({ ...prev, address_city: autoCity }));
        }
      }
    };
    fillCity();
  }, [quickAddData.address_zip, quickAddData.address_country, quickAddData.address_city]);

  // Street suggestions for Germany
  const handleStreetChange = async (value: string) => {
    setQuickAddData(prev => ({ ...prev, address_street: value }));

    if (quickAddData.address_country === 'Deutschland' && value.length > 3) {
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            street: value,
            city: quickAddData.address_city,
            postalcode: quickAddData.address_zip,
            country: 'Germany',
            format: 'json',
            limit: 5,
            addressdetails: 1
          },
          headers: {
            'Accept-Language': 'de'
          }
        });

        if (response.data && response.data.length > 0) {
          setStreetSuggestions(response.data);
          setShowStreetSuggestions(true);
        } else {
          setStreetSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching street suggestions:', error);
      }
    } else {
      setStreetSuggestions([]);
      setShowStreetSuggestions(false);
    }
  };

  const selectStreetSuggestion = (suggestion: any) => {
    const addr = suggestion.address;
    setQuickAddData(prev => ({
      ...prev,
      address_street: addr.road || prev.address_street,
      address_zip: addr.postcode || prev.address_zip,
      address_city: addr.city || addr.town || addr.village || prev.address_city
    }));
    setShowStreetSuggestions(false);
  };

  // Check if search term matches any existing customer
  const searchMatches = useMemo(() => {
    if (!searchInput.trim()) return true;
    return options.some(opt =>
      opt.label.toLowerCase().includes(searchInput.toLowerCase())
    );
  }, [searchInput, options]);

  // Show "add new customer" option in dropdown when search doesn't match
  const shouldShowAddNewOption = searchInput && !searchMatches;

  const handleAddNewClick = () => {
    const names = searchInput.trim().split(/\s+/);
    setQuickAddData(prev => ({
      ...prev,
      first_name: names[0] || '',
      last_name: names.slice(1).join(' ') || '',
      company_name: searchInput.trim()
    }));
    setShowForm(true);
    setIsExpanded(true);
  };

  const createCustomerMutation = useMutation({
    mutationFn: customerService.create,
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSearchInput('');
      setShowForm(false);
      setIsExpanded(false);
      onChange(newCustomer.id.toString());
      toast.success('Kunde hinzugefügt');
    },
    onError: () => {
      toast.error('Fehler beim Erstellen des Kunden');
    }
  });

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!quickAddData.email && !quickAddData.phone_mobile && !quickAddData.phone_landline) {
      errors.push('E-Mail oder Telefon erforderlich');
    }

    if (!quickAddData.address_street) {
      errors.push('Straße erforderlich');
    }

    if (!quickAddData.address_house_no) {
      errors.push('Hausnummer erforderlich');
    }

    if (!quickAddData.address_zip) {
      errors.push('PLZ erforderlich');
    }

    if (!quickAddData.address_city) {
      errors.push('Stadt erforderlich');
    }

    if (!quickAddData.address_country) {
      errors.push('Land erforderlich');
    }

    if (quickAddData.type === 'private') {
      if (!quickAddData.first_name) {
        errors.push('Vorname erforderlich');
      }
      if (!quickAddData.last_name) {
        errors.push('Nachname erforderlich');
      }
    } else {
      if (!quickAddData.company_name) {
        errors.push('Firmenname erforderlich');
      }
      if (!quickAddData.contact_first_name) {
        errors.push('Ansprechpartner Vorname erforderlich');
      }
      if (!quickAddData.contact_last_name) {
        errors.push('Ansprechpartner Nachname erforderlich');
      }
    }

    return errors;
  };

  const handleQuickAddSubmit = () => {
    const errors = validateForm();

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error(errors.length === 1 ? errors[0] : `${errors.length} Felder erforderlich: ${errors.join(', ')}`);
      return;
    }

    setValidationErrors([]);

    const submitData = {
      ...quickAddData,
      first_name: quickAddData.type === 'company' ? quickAddData.contact_first_name : (quickAddData.first_name || 'Unnamed'),
      last_name: quickAddData.type === 'company' ? quickAddData.contact_last_name : (quickAddData.last_name || quickAddData.company_name),
      phone: quickAddData.phone_mobile || quickAddData.phone_landline || ''
    };

    createCustomerMutation.mutate(submitData);
  };

  // Extended options with "Add New" option
  const extendedOptions = useMemo(() => {
    const baseOptions = options;
    if (shouldShowAddNewOption) {
      return [
        ...baseOptions,
        {
          value: `__new_${searchInput}__`,
          label: `+ ${searchInput} hinzufügen`
        }
      ];
    }
    return baseOptions;
  }, [options, shouldShowAddNewOption, searchInput]);

  const handleSelectChange = (val: string) => {
    if (val.startsWith('__new_')) {
      handleAddNewClick();
    } else {
      onChange(val);
      setSearchInput('');
      setShowForm(false);
    }
  };

  return (
    <div className={clsx('w-full', className)} ref={containerRef}>
      {/* Dropdown + Toggle Button */}
      <div className="flex items-end gap-0">
        <div className="flex-1 min-w-0">
          <SearchableSelect
            options={extendedOptions}
            value={value}
            onChange={handleSelectChange}
            placeholder={placeholder}
            error={error}
            roundedSide={roundedSide === 'both' || roundedSide === 'left' ? 'left' : 'none'}
            onSearch={setSearchInput}
          />
        </div>
        <Button
          variant="default"
          onClick={() => {
            const nextShow = !showForm;
            setShowForm(nextShow);
            setIsExpanded(nextShow);
          }}
          className={clsx(
            "h-9 px-3 border-l-0 shadow-sm shrink-0",
            (roundedSide === 'both' || roundedSide === 'right') && "rounded-r-sm"
          )}
          title={showForm ? "Schließen" : "Schnellanlage Kunde"}
        >
          {isExpanded ? (
            <FaChevronDown className="text-xs text-white rotate-180 transition-transform" />
          ) : (
            <FaPlus className="text-xs text-white" />
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

              {/* Kundentyp Selection */}
              <div>
                <div className="flex bg-slate-100 p-1 rounded-sm gap-1 w-fit">
                  {[
                    { id: 'private', label: 'Privatperson' },
                    { id: 'company', label: 'Firma / Agentur' }
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

              {/* Kontaktdaten Section */}
              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-4">Kontaktdaten</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Common Salutation for both types */}
                  <div className="col-span-2">

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
                              <div className="w-2 h-2 rounded-full bg-brand-primary shadow-sm" />
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

                  {quickAddData.type === 'private' ? (
                    <>
                      <FormField label="Vorname" required error={validationErrors.some(e => e.includes('Vorname'))}>
                        <Input
                          placeholder="Vorname"
                          value={quickAddData.first_name}
                          onChange={(e) => setQuickAddData(prev => ({ ...prev, first_name: e.target.value }))}
                        />
                      </FormField>
                      <FormField label="Nachname" required error={validationErrors.some(e => e.includes('Nachname'))}>
                        <Input
                          placeholder="Nachname"
                          value={quickAddData.last_name}
                          onChange={(e) => setQuickAddData(prev => ({ ...prev, last_name: e.target.value }))}
                        />
                      </FormField>
                    </>
                  ) : (
                    <>
                      <FormField label="Firmenname" required colSpan={2} error={validationErrors.some(e => e.includes('Firmenname'))}>
                        <Input
                          placeholder="Firmenname"
                          value={quickAddData.company_name}
                          onChange={(e) => setQuickAddData(prev => ({ ...prev, company_name: e.target.value }))}
                        />
                      </FormField>
                      <FormField label="Ansprechpartner Vorname" required error={validationErrors.some(e => e.includes('Ansprechpartner Vorname'))}>
                        <Input
                          placeholder="Vorname"
                          value={quickAddData.contact_first_name}
                          onChange={(e) => setQuickAddData(prev => ({ ...prev, contact_first_name: e.target.value }))}
                        />
                      </FormField>
                      <FormField label="Ansprechpartner Nachname" required error={validationErrors.some(e => e.includes('Ansprechpartner Nachname'))}>
                        <Input
                          placeholder="Nachname"
                          value={quickAddData.contact_last_name}
                          onChange={(e) => setQuickAddData(prev => ({ ...prev, contact_last_name: e.target.value }))}
                        />
                      </FormField>
                    </>
                  )}

                  <FormField label="E-Mail" colSpan={2} error={validationErrors.some(e => e.includes('E-Mail'))}>
                    <Input
                      placeholder="E-Mail"
                      type="email"
                      value={quickAddData.email}
                      onChange={(e) => setQuickAddData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Mobil" required error={validationErrors.some(e => e.includes('E-Mail oder Telefon'))}>
                    <PhoneInput
                      value={quickAddData.phone_mobile}
                      onChange={(val) => setQuickAddData(prev => ({ ...prev, phone_mobile: val }))}
                    />
                  </FormField>
                  <FormField label="Festnetz" error={validationErrors.some(e => e.includes('E-Mail oder Telefon'))}>
                    <PhoneInput
                      value={quickAddData.phone_landline}
                      onChange={(val) => setQuickAddData(prev => ({ ...prev, phone_landline: val }))}
                    />
                  </FormField>
                </div>
              </div>

              {/* Adresse Section */}
              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-4">Adresse</h4>
                <div className="grid grid-cols-12 gap-x-4 gap-y-4">
                  {/* Straße 3/4 */}
                  <div className="col-span-9 relative">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Straße <span className="text-red-500 font-bold">*</span></label>
                    <div className={clsx(validationErrors.some(e => e.includes('Straße')) && "ring-2 ring-red-500/50 rounded-sm")}>
                      <Input
                        placeholder="Straßenname"
                        value={quickAddData.address_street}
                        onChange={(e) => handleStreetChange(e.target.value)}
                        onFocus={() => streetSuggestions.length > 0 && setShowStreetSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowStreetSuggestions(false), 200)}
                        autoComplete="off"
                      />
                    </div>
                    {showStreetSuggestions && streetSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-sm shadow-lg overflow-hidden">
                        {streetSuggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectStreetSuggestion(s)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 truncate"
                          >
                            <span className="font-medium">{s.address.road}</span>
                            {s.address.postcode && <span className="text-slate-400 ml-2">{s.address.postcode} {s.address.city || s.address.town}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hausnummer 1/4 */}
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Hausnr. <span className="text-red-500 font-bold">*</span></label>
                    <div className={clsx(validationErrors.some(e => e.includes('Hausnummer')) && "ring-2 ring-red-500/50 rounded-sm")}>
                      <Input
                        placeholder="10"
                        value={quickAddData.address_house_no}
                        onChange={(e) => setQuickAddData(prev => ({ ...prev, address_house_no: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* PLZ 1/2 */}
                  <div className="col-span-6">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">PLZ <span className="text-red-500 font-bold">*</span></label>
                    <div className={clsx(validationErrors.some(e => e.includes('PLZ')) && "ring-2 ring-red-500/50 rounded-sm")}>
                      <Input
                        placeholder="12345"
                        value={quickAddData.address_zip}
                        onChange={(e) => setQuickAddData(prev => ({ ...prev, address_zip: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Stadt 1/2 */}
                  <div className="col-span-6">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Stadt <span className="text-red-500 font-bold">*</span></label>
                    <div className={clsx(validationErrors.some(e => e.includes('Stadt')) && "ring-2 ring-red-500/50 rounded-sm")}>
                      <Input
                        placeholder="Stadt"
                        value={quickAddData.address_city}
                        onChange={(e) => setQuickAddData(prev => ({ ...prev, address_city: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Land full width */}
                  <div className="col-span-12">
                    <div className={clsx(validationErrors.some(e => e.includes('Land')) && "ring-2 ring-red-500/50 rounded-sm")}>
                      <CountrySelect
                        value={quickAddData.address_country}
                        onChange={(val) => setQuickAddData(prev => ({ ...prev, address_country: val }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setIsExpanded(false);
                    setSearchInput('');
                  }}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  variant="default"
                  onClick={handleQuickAddSubmit}
                  disabled={createCustomerMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <FaPlus className="text-xs text-white" />
                  {createCustomerMutation.isPending ? 'Speichern...' : 'Speichern'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSelect;
