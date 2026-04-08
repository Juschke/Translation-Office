import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaBuilding, FaSave, FaImage, FaTrash, FaUpload, FaClock, FaTimes, FaEnvelope } from 'react-icons/fa';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import clsx from 'clsx';
import { settingsService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import Input from '../common/Input';
import CountrySelect from '../common/CountrySelect';
import SearchableSelect from '../common/SearchableSelect';
import { IMaskInput } from 'react-imask';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { TimePicker } from 'antd';
import dayjs from 'dayjs';
// @ts-ignore
import finanzamt from 'finanzamt';
// @ts-ignore
import { normalizeSteuernummer } from 'normalize-steuernummer';
import taxOfficesData from '../../data/tax_offices.json';

const SettingRow = ({ label, description, children, className, required }: any) => (
    <div className={clsx('grid grid-cols-12 gap-6 py-6 border-b border-slate-100 last:border-0 items-start', className)}>
        <div className="col-span-12 md:col-span-4 space-y-1">
            <label className="block text-sm font-medium text-slate-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
        </div>
        <div className="col-span-12 md:col-span-8">
            {children}
        </div>
    </div>
);

const LogoUpload = ({ logoPath, onUploaded }: { logoPath?: string; onUploaded: () => void }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const uploadMutation = useMutation({
        mutationFn: settingsService.uploadLogo,
        onSuccess: () => {
            toast.success(t('settings.company.logo_upload_success'));
            onUploaded();
        },
        onError: () => toast.error(t('settings.company.logo_upload_error'))
    });

    const deleteMutation = useMutation({
        mutationFn: settingsService.deleteLogo,
        onSuccess: () => {
            toast.success(t('settings.company.logo_remove_success'));
            onUploaded();
        },
        onError: () => toast.error(t('settings.company.logo_remove_error'))
    });

    const handleFile = (file: File) => {
        if (file.size > 4 * 1024 * 1024) {
            toast.error(t('settings.company.logo_too_large'));
            return;
        }
        if (!file.type.startsWith('image/')) {
            toast.error(t('settings.company.logo_invalid_type'));
            return;
        }
        uploadMutation.mutate(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const logoUrl = logoPath ? `${window.location.origin.replace(':5173', ':8000')}/storage/${logoPath}` : null;

    return (
        <div className="space-y-3">
            {logoUrl ? (
                <div className="flex items-center gap-4">
                    <div className="w-48 h-28 border border-slate-200 rounded-sm bg-slate-50 flex items-center justify-center p-3 overflow-hidden">
                        <img src={logoUrl} alt={t('settings.company.logo_alt')} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-sm hover:bg-slate-50 transition"
                        >
                            <FaUpload className="text-slate-400" /> {t('settings.company.logo_replace')}
                        </button>
                        <button
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-sm hover:bg-red-50 transition disabled:opacity-50"
                        >
                            <FaTrash /> {t('settings.company.logo_remove')}
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={clsx(
                        'border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all',
                        isDragging ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'
                    )}
                >
                    <FaImage className="mx-auto text-2xl text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500 font-medium">{t('settings.company.logo_drop')} <span className="text-slate-900 underline">{t('settings.company.logo_select')}</span></p>
                    <p className="text-xs text-slate-400 mt-1">{t('settings.company.logo_hint')}</p>
                </div>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {uploadMutation.isPending && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    {t('settings.company.logo_uploading')}
                </div>
            )}
        </div>
    );
};

const CompanySettingsTab = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();

    const taxOfficeOptions = useMemo(() => taxOfficesData.map((fa: any) => ({
        value: `Finanzamt ${fa.name}`,
        label: `Finanzamt ${fa.name}`,
        group: fa.ort,
        bufa: fa.buFaNr
    })).sort((a, b) => a.label.localeCompare(b.label)), []);

    const legalFormOptions = useMemo(() => [
        { value: 'Einzelunternehmen', label: t('settings.legal_forms.sole_proprietorship') || 'Einzelunternehmen' },
        { value: 'GmbH', label: 'GmbH' },
        { value: 'UG (haftungsbeschränkt)', label: 'UG (haftungsbeschränkt)' },
        { value: 'GbR', label: 'GbR' },
        { value: 'AG', label: 'AG' },
        { value: 'OHG', label: 'OHG' },
        { value: 'KG', label: 'KG' },
        { value: 'GmbH & Co. KG', label: 'GmbH & Co. KG' },
        { value: 'PartG', label: 'PartG' },
        { value: 'e.K.', label: 'e.K.' },
        { value: 'Limited (Ltd.)', label: 'Limited (Ltd.)' },
        { value: 'Stiftung', label: t('settings.legal_forms.foundation') || 'Stiftung' },
        { value: 'Verein', label: t('settings.legal_forms.association') || 'Verein' },
        { value: 'Sonstiges', label: t('common.other') || 'Sonstiges' },
    ], [t]);

    const [companyData, setCompanyData] = useState<any>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isValidatingZip, setIsValidatingZip] = useState(false);
    const [isValidatingIban, setIsValidatingIban] = useState(false);
    const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
    const [isOpeningHoursModalOpen, setIsOpeningHoursModalOpen] = useState(false);
    const [openingHours, setOpeningHours] = useState<any>({
        monday: { enabled: true, start: '09:00', end: '18:00' },
        tuesday: { enabled: true, start: '09:00', end: '18:00' },
        wednesday: { enabled: true, start: '09:00', end: '18:00' },
        thursday: { enabled: true, start: '09:00', end: '18:00' },
        friday: { enabled: true, start: '09:00', end: '18:00' },
        saturday: { enabled: false, start: '10:00', end: '14:00' },
        sunday: { enabled: false, start: '10:00', end: '14:00' }
    });

    const { data: serverCompanyData } = useQuery({
        queryKey: ['companySettings'],
        queryFn: settingsService.getCompany
    });

    const { data: currenciesData = [] } = useQuery({
        queryKey: ['settings', 'currencies'],
        queryFn: settingsService.getCurrencies
    });

    const currencyOptions = useMemo(() => {
        return currenciesData.map((c: any) => ({
            value: c.code,
            label: `${c.code} (${c.symbol}) - ${c.name}`
        }));
    }, [currenciesData]);

    const updateCompanyMutation = useMutation({
        mutationFn: settingsService.updateCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companySettings'] });
            toast.success(t('settings.company.save_success'));
        },
        onError: () => {
            toast.error(t('settings.company.save_error'));
        }
    });

    useEffect(() => {
        if (serverCompanyData) {
            setCompanyData({
                ...serverCompanyData,
                address_country: serverCompanyData.address_country || t('countries.de_default')
            });

            if (serverCompanyData.opening_hours) {
                if (typeof serverCompanyData.opening_hours === 'object') {
                    setOpeningHours(serverCompanyData.opening_hours);
                } else {
                    try {
                        const parsed = JSON.parse(serverCompanyData.opening_hours);
                        setOpeningHours(parsed);
                    } catch (e) {
                        // fallback to string if it's just a text
                    }
                }
            }
        }
    }, [serverCompanyData, t]);

    const handleInputMetaChange = async (field: string, value: string) => {
        setCompanyData((prev: any) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
        if (field === 'address_street' && value.length > 2 && companyData.address_zip) {
            try {
                const response = await fetch(`https://openplzapi.org/de/Streets?postalCode=${companyData.address_zip}&name=${value}`);
                if (response.ok) {
                    const data = await response.json();
                    setStreetSuggestions(data.map((s: any) => s.name));
                }
            } catch (e) { /* ignore */ }
        }
    };

    const validateCompanyData = () => {
        const newErrors: Record<string, string> = {};
        if (!companyData.company_name) newErrors.company_name = t('settings.company.validation_company_name');
        if (!companyData.managing_director) newErrors.managing_director = t('settings.company.validation_managing_director');

        if (!companyData.address_street) newErrors.address_street = t('settings.company.validation_street');
        if (!companyData.address_house_no) newErrors.address_house_no = t('settings.company.validation_house_no');
        if (!companyData.address_zip) newErrors.address_zip = t('settings.company.validation_zip');
        if (!companyData.address_city) newErrors.address_city = t('settings.company.validation_city');
        if (!companyData.address_country) newErrors.address_country = t('settings.company.validation_country');

        if (!companyData.phone) newErrors.phone = t('settings.company.validation_phone');
        if (!companyData.mobile) newErrors.mobile = t('settings.company.validation_mobile');
        if (!companyData.email) newErrors.email = t('settings.company.validation_email');

        if (!companyData.legal_form) newErrors.legal_form = t('settings.company.validation_legal_form');
        if (!companyData.tax_office) newErrors.tax_office = t('settings.company.validation_tax_office');
        if (!companyData.vat_id) newErrors.vat_id = t('settings.company.validation_vat_id');

        if (!companyData.bank_account_holder) newErrors.bank_account_holder = t('settings.company.validation_account_holder');
        if (!companyData.bank_iban) newErrors.bank_iban = t('settings.company.validation_bank_iban');
        if (!companyData.bank_name) newErrors.bank_name = t('settings.company.validation_bank_name');
        if (!companyData.bank_code) newErrors.bank_code = t('settings.company.validation_bank_code');
        if (!companyData.bank_bic) newErrors.bank_bic = t('settings.company.validation_bank_bic');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveCompany = () => {
        if (validateCompanyData()) {
            const dataToSave = {
                ...companyData,
                opening_hours: openingHours
            };
            updateCompanyMutation.mutate(dataToSave);
        } else {
            toast.error(t('settings.company.validation_required_fields'));
        }
    };

    const handleTaxNumberBlur = () => {
        if (!companyData.tax_number) return;
        try {
            const normalized = normalizeSteuernummer(companyData.tax_number);
            if (normalized) {
                const fa = finanzamt(normalized);
                if (fa && fa.name) {
                    setCompanyData((prev: any) => ({
                        ...prev,
                        tax_office: `Finanzamt ${fa.name}`,
                        address_zip: prev.address_zip || fa.hausanschrift?.plz || '',
                        address_city: prev.address_city || fa.hausanschrift?.ort || '',
                        address_street: prev.address_street || fa.hausanschrift?.strasse || '',
                        address_house_no: prev.address_house_no || fa.hausanschrift?.hausNr || ''
                    }));
                    toast.success(t('settings.company.tax_office_detected', { name: fa.name }));
                }
            }
        } catch (error) {
            console.log('Could not derive tax office from number');
        }
    };

    const handleCityBlur = () => {
        const city = (companyData.address_city || '').trim();
        if (!city) return;
        const candidates = taxOfficesData.filter((fa: any) =>
            fa.ort.toLowerCase() === city.toLowerCase() ||
            fa.name.toLowerCase().includes(city.toLowerCase())
        );
        if (candidates.length > 0) {
            const exactNameMatch = candidates.find((fa: any) => fa.name.toLowerCase() === city.toLowerCase());
            if (exactNameMatch) {
                setCompanyData((prev: any) => ({ ...prev, tax_office: `Finanzamt ${exactNameMatch.name}` }));
                toast.success(t('settings.company.tax_office_auto_detected', { name: exactNameMatch.name }));
            } else {
                setCompanyData((prev: any) => ({ ...prev, tax_office: `Finanzamt ${candidates[0].name}` }));
                toast.success(t('settings.company.tax_office_auto_detected', { name: candidates[0].name }));
            }
        }
    };

    const handleZipBlur = async () => {
        if (!companyData.address_zip || companyData.address_zip.length < 5) return;
        setIsValidatingZip(true);
        try {
            const response = await fetch(`https://openplzapi.org/de/Localities?postalCode=${companyData.address_zip}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    const newCity = data[0].name;
                    if (!companyData.address_city || companyData.address_city !== newCity) {
                        setCompanyData((prev: any) => ({ ...prev, address_city: newCity }));
                        setErrors(prev => ({ ...prev, address_city: '' }));
                        const candidates = taxOfficesData.filter((fa: any) =>
                            fa.ort.toLowerCase() === newCity.toLowerCase() ||
                            fa.name.toLowerCase().includes(newCity.toLowerCase())
                        );
                        if (candidates.length > 0) {
                            setCompanyData((prev: any) => ({ ...prev, tax_office: `Finanzamt ${candidates[0].name}` }));
                            toast.success(t('settings.company.tax_office_auto_detected', { name: candidates[0].name }));
                        }
                    }
                }
            }
        } catch (error) {
            console.error('OpenPLZ API Error', error);
        } finally {
            setIsValidatingZip(false);
        }
    };

    const handleIbanBlur = async () => {
        const cleanIban = (companyData.bank_iban || '').replace(/\s/g, '');
        if (!cleanIban || cleanIban.length < 15) return;
        setIsValidatingIban(true);
        try {
            const response = await fetch(`https://openiban.com/validate/${cleanIban}?getBIC=true&validateBankCode=true`);
            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    setCompanyData((prev: any) => ({
                        ...prev,
                        bank_bic: data.bankData?.bic || prev.bank_bic,
                        bank_name: data.bankData?.name || prev.bank_name,
                        bank_code: data.bankData?.bankCode || prev.bank_code
                    }));
                    setErrors(prev => ({ ...prev, bank_iban: '' }));
                    toast.success(t('settings.company.bank_detected', { name: data.bankData?.name || 'IBAN' }));
                } else {
                    setErrors(prev => ({ ...prev, bank_iban: t('settings.company.iban_invalid') }));
                }
            }
        } catch (error) {
            console.warn('IBAN Validation API unavailable');
        } finally {
            setIsValidatingIban(false);
        }
    };

    const handleBicBlur = () => {
        const bic = (companyData.bank_bic || '').toUpperCase().trim();
        if (!bic || bic.length < 4) return;
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
        const prefix6 = bic.substring(0, 6);
        const prefix4 = bic.substring(0, 4);
        if (!companyData.bank_name) {
            const foundBank = commonBanks[prefix6] || commonBanks[prefix4];
            if (foundBank) {
                setCompanyData((prev: any) => ({ ...prev, bank_name: foundBank }));
            }
        }
    };

    // Scroll to section when sub-tab is clicked
    useEffect(() => {
        const section = searchParams.get('section');
        if (section) {
            // Small timeout to ensure DOM is ready
            setTimeout(() => {
                const element = document.getElementById(`section-${section}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [searchParams]);

    return (
        <div className="bg-white shadow-sm border border-slate-200 rounded-sm overflow-y-auto custom-scrollbar flex-1 min-h-0 animate-fadeIn">
            <style>{`
                .phone-input-group {
                    display: flex !important;
                    align-items: center;
                }
                .phone-input-group .PhoneInputCountry {
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                    padding: 0 12px;
                    margin-right: 0 !important;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-right: 0;
                    border-radius: 2px 0 0 2px;
                    height: 36px;
                    min-width: 60px;
                    transition: all 0.2s;
                }
                .phone-input-group:hover .PhoneInputCountry {
                    background-color: rgb(18, 58, 60);
                    border-color: rgb(18, 58, 60);
                }
                .phone-input-group .PhoneInputCountry:focus-within {
                    border-color: rgb(18, 58, 60);
                    z-index: 2;
                }
                .phone-input-group:hover .PhoneInputCountrySelectArrow {
                    color: white !important;
                    opacity: 1;
                }
                .phone-input-group .PhoneInputCountrySelect {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 100%;
                    z-index: 1;
                    border: 0;
                    opacity: 0;
                    cursor: pointer;
                }
                .phone-input-group .PhoneInputCountryIcon {
                    width: 20px;
                    height: 14px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                    border-radius: 1px;
                }
                .phone-input-group .PhoneInputCountrySelectArrow {
                    margin-left: 6px;
                    color: #94a3b8;
                    transition: color 0.2s;
                }
                .phone-input-group input {
                    text-align: left !important;
                    transition: all 0.2s !important;
                }
                .phone-input-group:hover input,
                .phone-input-group input:focus {
                    border-color: rgb(18, 58, 60) !important;
                    z-index: 2;
                }
                .phone-input-group input:focus {
                    box-shadow: 0 0 0 2px rgba(18, 58, 60, 0.1);
                }
            `}</style>
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <FaBuilding className="text-brand-primary" />
                    <h3 className="text-sm font-medium text-slate-800">{t('settings.company.header')}</h3>
                </div>
                <Button
                    variant="default"
                    onClick={handleSaveCompany}
                    disabled={updateCompanyMutation.isPending}
                    className="flex items-center gap-2"
                >
                    <FaSave /> {updateCompanyMutation.isPending ? t('settings.saving') : t('settings.save')}
                </Button>
            </div>

            <div className="p-8">
                {/* Basisinformationen */}
                <div id="section-basis" className="mb-8 scroll-mt-20">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 border-b border-slate-100 pb-2">{t('settings.company.section_basis')}</h4>
                    <SettingRow label={t('settings.company.company_name_label')} required={true} description={t('settings.company.company_name_desc')}>
                        <Input
                            placeholder={t('settings.company.company_name_placeholder')}
                            value={companyData.company_name || ''}
                            onChange={(e) => handleInputMetaChange('company_name', e.target.value)}
                            error={!!errors.company_name}
                            required={true}
                        />
                    </SettingRow>
                    <SettingRow label={t('settings.company.managing_director_label')} description={t('settings.company.managing_director_desc')}>
                        <Input
                            placeholder={t('settings.company.managing_director_placeholder')}
                            required={true}
                            value={companyData.managing_director || ''}
                            onChange={(e) => handleInputMetaChange('managing_director', e.target.value)}
                            error={!!errors.managing_director}
                        />
                    </SettingRow>
                </div>

                {/* Standort & Adresse */}
                <div id="section-location" className="mb-8 scroll-mt-20">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 border-b border-slate-100 pb-2">{t('settings.company.section_location')}</h4>
                    <SettingRow label={t('settings.company.address_label')} required={true} description={t('settings.company.address_desc')}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="sm:col-span-3">
                                    <Input
                                        label={t('settings.company.street_label')}
                                        required={true}
                                        placeholder={t('settings.company.street_label')}
                                        list="street-suggestions"
                                        value={companyData.address_street || ''}
                                        onChange={(e) => handleInputMetaChange('address_street', e.target.value)}
                                        error={!!errors.address_street}
                                    />
                                    <datalist id="street-suggestions">
                                        {streetSuggestions.map(s => <option key={s} value={s} />)}
                                    </datalist>
                                </div>
                                <Input
                                    label={t('settings.company.house_no_label')}
                                    required={true}
                                    placeholder={t('settings.company.house_no_label')}
                                    value={companyData.address_house_no || ''}
                                    onChange={(e) => handleInputMetaChange('address_house_no', e.target.value)}
                                    error={!!errors.address_house_no}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Input
                                        label={t('settings.company.zip_label')}
                                        required={true}
                                        placeholder={t('settings.company.zip_label')}
                                        value={companyData.address_zip || ''}
                                        onChange={(e) => handleInputMetaChange('address_zip', e.target.value)}
                                        onBlur={handleZipBlur}
                                        error={!!errors.address_zip}
                                        endIcon={isValidatingZip ? <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div> : null}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Input
                                        label={t('settings.company.city_label')}
                                        required={true}
                                        placeholder={t('settings.company.city_label')}
                                        value={companyData.address_city || ''}
                                        onChange={(e) => handleInputMetaChange('address_city', e.target.value)}
                                        onBlur={handleCityBlur}
                                        error={!!errors.address_city}
                                    />
                                </div>
                            </div>
                            <CountrySelect
                                value={companyData.address_country || t('countries.de_default')}
                                onChange={(val) => handleInputMetaChange('address_country', val)}
                                label={t('settings.company.country_label')}
                                required={true}
                                error={!!errors.address_country}
                            />
                        </div>
                    </SettingRow>
                    <SettingRow label={t('settings.company.contact_label')} required={true} description={t('settings.company.contact_desc')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1 ml-1">
                                    {t('settings.company.phone_label')}
                                    <span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <PhoneInput
                                    international
                                    defaultCountry="DE"
                                    placeholder={t('settings.company.phone_placeholder')}
                                    value={companyData.phone || ''}
                                    onChange={(val) => handleInputMetaChange('phone', val || '')}
                                    numberInputProps={{
                                        className: clsx(
                                            "flex h-9 w-full rounded-r-sm bg-white px-3 py-1 text-sm text-brand-text transition-all outline-none",
                                            "border border-brand-border border-l-0 hover:border-brand-primary",
                                            "focus:ring-2 focus:ring-slate-200 focus:border-slate-400",
                                            errors.phone && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                                        )
                                    }}
                                    className="phone-input-group"
                                />
                                {errors.phone && <p className="text-[10px] text-red-500 mt-1 ml-1 font-medium">{errors.phone}</p>}
                            </div>
                            <div className="flex flex-col">
                                <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1 ml-1">
                                    {t('settings.company.mobile_label')}
                                    <span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <PhoneInput
                                    international
                                    defaultCountry="DE"
                                    placeholder={t('settings.company.mobile_placeholder')}
                                    value={companyData.mobile || ''}
                                    onChange={(val) => handleInputMetaChange('mobile', val || '')}
                                    numberInputProps={{
                                        className: clsx(
                                            "flex h-9 w-full rounded-r-sm bg-white px-3 py-1 text-sm text-brand-text transition-all outline-none",
                                            "border border-brand-border border-l-0 hover:border-brand-primary",
                                            "focus:ring-2 focus:ring-slate-200 focus:border-slate-400",
                                            errors.mobile && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                                        )
                                    }}
                                    className="phone-input-group"
                                />
                                {errors.mobile && <p className="text-[10px] text-red-500 mt-1 ml-1 font-medium">{errors.mobile}</p>}
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <Input
                                    label="E-Mail"
                                    required={true}
                                    startIcon={<FaEnvelope />}
                                    placeholder={t('settings.company.email_placeholder')}
                                    value={companyData.email || ''}
                                    onChange={(e) => handleInputMetaChange('email', e.target.value)}
                                    error={!!errors.email}
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <div className="flex flex-col">
                                    <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1 ml-1">{t('settings.company.website_label')}</label>
                                    <div className="flex relative">
                                        <div className="flex items-center justify-center px-3 bg-slate-50 border border-brand-border border-r-0 rounded-l-sm text-slate-500 text-sm font-medium">
                                            https://
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={t('settings.company.website_placeholder')}
                                            value={(companyData.website || '').replace(/^https?:\/\//, '')}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                handleInputMetaChange('website', val ? `https://${val.replace(/^https?:\/\//, '')}` : '');
                                            }}
                                            className={clsx(
                                                "flex h-9 w-full rounded-r-sm bg-white px-3 py-1 text-sm text-brand-text transition-all",
                                                "border border-brand-border hover:border-brand-primary",
                                                "placeholder:text-brand-muted placeholder:font-normal placeholder:tracking-normal",
                                                "focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none focus:z-10"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('settings.company.opening_hours_label')}</label>
                                    <button
                                        onClick={() => setIsOpeningHoursModalOpen(true)}
                                        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-200 rounded-sm hover:border-slate-900 transition-all text-sm font-medium text-slate-700"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FaClock className="text-slate-400" />
                                            <span>{t('settings.company.opening_hours_btn')}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('settings.company.opening_hours_edit')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SettingRow>
                </div>

                {/* Bankverbindung */}
                <div id="section-bank" className="mb-8 scroll-mt-20">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 border-b border-slate-100 pb-2">{t('settings.company.section_bank')}</h4>
                    <SettingRow label={t('settings.company.bank_label')} required={true} description={t('settings.company.bank_desc')}>
                        <div className="space-y-4">
                            <Input
                                label={t('settings.company.account_holder_label')}
                                required={true}
                                placeholder={user?.name || 'Vorname Nachname'}
                                value={companyData.bank_account_holder || ''}
                                onChange={(e) => handleInputMetaChange('bank_account_holder', e.target.value)}
                                error={!!errors.bank_account_holder}
                            />
                            <div className="flex flex-col">
                                <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1 ml-1">
                                    IBAN
                                    <span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <div className="relative">
                                    <IMaskInput
                                        mask="aa00 0000 0000 0000 0000 00"
                                        definitions={{ 'a': /[a-zA-Z]/ }}
                                        lazy={false}
                                        placeholderChar="_"
                                        value={companyData.bank_iban || ''}
                                        unmask={false}
                                        onAccept={(value) => handleInputMetaChange('bank_iban', value.toUpperCase())}
                                        onBlur={handleIbanBlur}
                                        className={clsx(
                                            "flex h-9 w-full rounded-sm bg-white px-3 py-1 text-sm text-brand-text transition-all",
                                            "border border-brand-border hover:border-brand-primary",
                                            "placeholder:text-brand-muted placeholder:font-normal placeholder:tracking-normal",
                                            "focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none",
                                            errors.bank_iban && "border-red-500 focus:border-red-500 ring-red-500/10"
                                        )}
                                    />
                                    {isValidatingIban && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                {errors.bank_iban && <span className="text-xs text-red-500 font-medium block mt-1">{errors.bank_iban}</span>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Input
                                    label={t('settings.company.bank_name_label')}
                                    required={true}
                                    placeholder={t('settings.company.bank_name_placeholder')}
                                    value={companyData.bank_name || ''}
                                    onChange={(e) => handleInputMetaChange('bank_name', e.target.value)}
                                    error={!!errors.bank_name}
                                />
                                <div className="flex flex-col">
                                    <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1 ml-1">
                                        BLZ
                                        <span className="text-red-500 ml-0.5">*</span>
                                    </label>
                                    <IMaskInput
                                        mask="000 000 00"
                                        lazy={false}
                                        placeholderChar="_"
                                        value={companyData.bank_code || ''}
                                        onAccept={(value) => handleInputMetaChange('bank_code', value)}
                                        className={clsx(
                                            "flex h-9 w-full rounded-sm bg-white px-3 py-1 text-sm text-brand-text transition-all",
                                            "border border-brand-border hover:border-brand-primary",
                                            "placeholder:text-brand-muted placeholder:font-normal placeholder:tracking-normal",
                                            "focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none"
                                        )}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1 ml-1">
                                        BIC
                                        <span className="text-red-500 ml-0.5">*</span>
                                    </label>
                                    <IMaskInput
                                        mask="aaaaaa aa [aaa]"
                                        definitions={{ 'a': /[a-zA-Z0-9]/ }}
                                        lazy={false}
                                        placeholderChar="_"
                                        value={companyData.bank_bic || ''}
                                        onAccept={(value) => handleInputMetaChange('bank_bic', value.toUpperCase())}
                                        onBlur={handleBicBlur}
                                        className={clsx(
                                            "flex h-9 w-full rounded-sm bg-white px-3 py-1 text-sm text-brand-text transition-all",
                                            "border border-brand-border hover:border-brand-primary",
                                            "placeholder:text-brand-muted placeholder:font-normal placeholder:tracking-normal",
                                            "focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </SettingRow>
                </div>

                {/* Steuern & Identifikation */}
                <div id="section-tax" className="mb-8 scroll-mt-20">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 border-b border-slate-100 pb-2">{t('settings.company.section_tax')}</h4>
                    <SettingRow label={t('settings.company.legal_form_label')} required={true} description={t('settings.company.legal_form_desc')}>
                        <SearchableSelect
                            placeholder={t('settings.company.legal_form_placeholder')}
                            options={legalFormOptions}
                            value={companyData.legal_form || ''}
                            onChange={(val) => handleInputMetaChange('legal_form', val)}
                            error={!!errors.legal_form}
                        />
                    </SettingRow>
                    <SettingRow label={t('settings.company.tax_office_label')} required={true} description={t('settings.company.tax_office_desc')}>
                        <SearchableSelect
                            placeholder={t('settings.company.tax_office_placeholder')}
                            options={taxOfficeOptions.map(opt => ({ ...opt, label: `${opt.label} (${opt.bufa})` }))}
                            value={companyData.tax_office || ''}
                            onChange={(val) => handleInputMetaChange('tax_office', val)}
                            error={!!errors.tax_office}
                        />
                    </SettingRow>
                    <SettingRow label={t('settings.company.tax_number_label')} description={t('settings.company.tax_number_desc')}>
                        <IMaskInput
                            mask="00/000/00000"
                            lazy={false}
                            placeholderChar="_"
                            value={companyData.tax_number || ''}
                            unmask={false}
                            onAccept={(value) => handleInputMetaChange('tax_number', value)}
                            onBlur={handleTaxNumberBlur}
                            className={clsx(
                                "flex h-9 w-full rounded-sm bg-white px-3 py-1 text-sm text-brand-text transition-all",
                                "border border-brand-border hover:border-brand-primary",
                                "placeholder:text-brand-muted placeholder:font-normal placeholder:tracking-normal",
                                "focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none",
                                errors.tax_number && "border-red-500 focus:border-red-500 ring-red-500/10"
                            )}
                        />
                    </SettingRow>
                    <SettingRow label={t('settings.company.vat_id_label')} required={true} description={t('settings.company.vat_id_desc')}>
                        <IMaskInput
                            mask="aa000000000"
                            definitions={{ 'a': /[a-zA-Z]/ }}
                            lazy={false}
                            placeholderChar="_"
                            value={companyData.vat_id || ''}
                            onAccept={(value) => handleInputMetaChange('vat_id', value.toUpperCase())}
                            className={clsx(
                                "flex h-9 w-full rounded-sm bg-white px-3 py-1 text-sm text-brand-text transition-all",
                                "border border-brand-border hover:border-brand-primary",
                                "placeholder:text-brand-muted placeholder:font-normal placeholder:tracking-normal",
                                "focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none",
                                errors.vat_id && "border-red-500 focus:border-red-500 ring-red-500/10"
                            )}
                        />
                    </SettingRow>
                    <SettingRow label={t('settings.company.tax_id_label')} description={t('settings.company.tax_id_desc')}>
                        <IMaskInput
                            mask="aa00000000000000"
                            definitions={{ 'a': /[a-zA-Z]/ }}
                            lazy={false}
                            placeholderChar="_"
                            value={companyData.tax_id || ''}
                            onAccept={(value) => handleInputMetaChange('tax_id', value.toUpperCase())}
                            className={clsx(
                                "flex h-9 w-full rounded-sm bg-white px-3 py-1 text-sm text-brand-text transition-all",
                                "border border-brand-border hover:border-brand-primary",
                                "placeholder:text-brand-muted placeholder:font-normal placeholder:tracking-normal",
                                "focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none",
                                errors.tax_id && "border-red-500 focus:border-red-500 ring-red-500/10"
                            )}
                        />
                    </SettingRow>

                    <SettingRow label={t('settings.company.currency_label')} description={t('settings.company.currency_desc')}>
                        <SearchableSelect
                            placeholder={t('settings.company.currency_placeholder')}
                            options={currencyOptions}
                            value={companyData.currency || 'EUR'}
                            onChange={(val) => handleInputMetaChange('currency', val)}
                        />
                    </SettingRow>
                </div>

                {/* Firmenlogo */}
                <div id="section-logo" className="mb-0 scroll-mt-20">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 border-b border-slate-100 pb-2">{t('settings.company.section_logo')}</h4>
                    <SettingRow label={t('settings.company.logo_upload_label')} description={t('settings.company.logo_upload_desc')}>
                        <LogoUpload logoPath={companyData.company_logo} onUploaded={() => queryClient.invalidateQueries({ queryKey: ['companySettings'] })} />
                    </SettingRow>
                </div>
            </div>
            {/* Opening Hours Modal */}
            {isOpeningHoursModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-sm shadow-xl w-full max-w-2xl overflow-hidden relative animate-fadeInDown">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <FaClock className="text-brand-primary" />
                                {t('settings.company.opening_hours_modal_title')}
                            </h3>
                            <button
                                onClick={() => setIsOpeningHoursModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-6 space-y-3">
                            {Object.entries(openingHours).map(([day, hours]: [string, any]) => {
                                const dayLabels: Record<string, string> = {
                                    monday: t('settings.company.days.monday'),
                                    tuesday: t('settings.company.days.tuesday'),
                                    wednesday: t('settings.company.days.wednesday'),
                                    thursday: t('settings.company.days.thursday'),
                                    friday: t('settings.company.days.friday'),
                                    saturday: t('settings.company.days.saturday'),
                                    sunday: t('settings.company.days.sunday')
                                };
                                return (
                                    <div key={day} className="flex items-center gap-4 p-4 bg-slate-50 rounded-sm border border-slate-200 hover:border-slate-300 transition-colors">
                                        <div className="w-36 flex items-center gap-3">
                                            <Switch
                                                checked={hours.enabled}
                                                onCheckedChange={(checked) => setOpeningHours((prev: any) => ({
                                                    ...prev,
                                                    [day]: { ...prev[day], enabled: checked }
                                                }))}
                                            />
                                            <span className="text-sm font-semibold text-slate-700">{dayLabels[day]}</span>
                                        </div>
                                        {hours.enabled ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <TimePicker
                                                    format="HH:mm"
                                                    value={dayjs(hours.start, 'HH:mm')}
                                                    onChange={(time) => {
                                                        if (time) {
                                                            setOpeningHours((prev: any) => ({
                                                                ...prev,
                                                                [day]: { ...prev[day], start: time.format('HH:mm') }
                                                            }));
                                                        }
                                                    }}
                                                    className="flex-1"
                                                    placeholder="Beginn"
                                                />
                                                <span className="text-slate-400 font-bold">—</span>
                                                <TimePicker
                                                    format="HH:mm"
                                                    value={dayjs(hours.end, 'HH:mm')}
                                                    onChange={(time) => {
                                                        if (time) {
                                                            setOpeningHours((prev: any) => ({
                                                                ...prev,
                                                                [day]: { ...prev[day], end: time.format('HH:mm') }
                                                            }));
                                                        }
                                                    }}
                                                    className="flex-1"
                                                    placeholder="Ende"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic flex-1">{t('settings.company.closed')}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 z-10">
                            <button
                                onClick={() => setIsOpeningHoursModalOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                            >
                                {t('settings.company.close')}
                            </button>
                            <p className="text-[10px] text-slate-400 self-center">{t('settings.company.opening_hours_note')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanySettingsTab;
