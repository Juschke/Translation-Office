import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaBuilding, FaSave, FaImage, FaTrash, FaUpload } from 'react-icons/fa';
import clsx from 'clsx';
import { settingsService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import Input from '../common/Input';
import CountrySelect from '../common/CountrySelect';
import SearchableSelect from '../common/SearchableSelect';
import { IMaskInput } from 'react-imask';
// @ts-ignore
import finanzamt from 'finanzamt';
// @ts-ignore
import { normalizeSteuernummer } from 'normalize-steuernummer';
import taxOfficesData from '../../data/tax_offices.json';

const taxOfficeOptions = taxOfficesData.map((fa: any) => ({
    value: `Finanzamt ${fa.name}`,
    label: `Finanzamt ${fa.name}`,
    group: fa.ort,
    bufa: fa.buFaNr
})).sort((a, b) => a.label.localeCompare(b.label));

const legalFormOptions = [
    { value: 'Einzelunternehmen', label: 'Einzelunternehmen' },
    { value: 'GbR', label: 'GbR' },
    { value: 'GmbH', label: 'GmbH' },
    { value: 'GmbH & Co. KG', label: 'GmbH & Co. KG' },
    { value: 'UG (haftungsbeschränkt)', label: 'UG (haftungsbeschränkt)' },
    { value: 'AG', label: 'AG' },
    { value: 'KG', label: 'KG' },
    { value: 'OHG', label: 'OHG' },
    { value: 'e.K.', label: 'e.K.' },
    { value: 'PartG', label: 'PartG' },
    { value: 'eG', label: 'eG' },
    { value: 'e.V.', label: 'e.V.' },
    { value: 'Stiftung', label: 'Stiftung' },
    { value: 'Körperschaft d.ö.R.', label: 'Körperschaft d.ö.R.' }
];

const SettingRow = ({ label, description, children, className }: any) => (
    <div className={clsx('grid grid-cols-12 gap-6 py-6 border-b border-slate-100 last:border-0 items-start', className)}>
        <div className="col-span-12 md:col-span-4 space-y-1">
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
        </div>
        <div className="col-span-12 md:col-span-8">
            {children}
        </div>
    </div>
);

const LogoUpload = ({ logoPath, onUploaded }: { logoPath?: string; onUploaded: () => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const uploadMutation = useMutation({
        mutationFn: settingsService.uploadLogo,
        onSuccess: () => {
            toast.success('Logo erfolgreich hochgeladen');
            onUploaded();
        },
        onError: () => toast.error('Fehler beim Hochladen')
    });

    const deleteMutation = useMutation({
        mutationFn: settingsService.deleteLogo,
        onSuccess: () => {
            toast.success('Logo entfernt');
            onUploaded();
        },
        onError: () => toast.error('Fehler beim Entfernen')
    });

    const handleFile = (file: File) => {
        if (file.size > 4 * 1024 * 1024) {
            toast.error('Datei zu groß (max. 4 MB)');
            return;
        }
        if (!file.type.startsWith('image/')) {
            toast.error('Nur Bilddateien erlaubt');
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
                        <img src={logoUrl} alt="Firmenlogo" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-sm hover:bg-slate-50 transition"
                        >
                            <FaUpload className="text-slate-400" /> Ersetzen
                        </button>
                        <button
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-sm hover:bg-red-50 transition disabled:opacity-50"
                        >
                            <FaTrash /> Entfernen
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
                    <p className="text-sm text-slate-500 font-medium">Logo hierher ziehen oder <span className="text-slate-900 underline">Datei auswählen</span></p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG oder SVG · max. 4 MB</p>
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
                    Logo wird hochgeladen…
                </div>
            )}
        </div>
    );
};

const CompanySettingsTab = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [companyData, setCompanyData] = useState<any>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isValidatingZip, setIsValidatingZip] = useState(false);
    const [isValidatingIban, setIsValidatingIban] = useState(false);
    const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);

    const { data: serverCompanyData } = useQuery({
        queryKey: ['companySettings'],
        queryFn: settingsService.getCompany
    });

    const updateCompanyMutation = useMutation({
        mutationFn: settingsService.updateCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companySettings'] });
            toast.success('Einstellungen erfolgreich gespeichert!');
        },
        onError: () => {
            toast.error('Fehler beim Speichern der Einstellungen.');
        }
    });

    useEffect(() => {
        if (serverCompanyData) {
            setCompanyData({
                ...serverCompanyData,
                address_country: serverCompanyData.address_country || 'Deutschland'
            });
        }
    }, [serverCompanyData]);

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
        if (!companyData.company_name) newErrors.company_name = 'Firmenname ist erforderlich';
        if (!companyData.address_street) newErrors.address_street = 'Straße ist erforderlich';
        if (!companyData.address_zip) newErrors.address_zip = 'PLZ ist erforderlich';
        if (!companyData.address_city) newErrors.address_city = 'Stadt ist erforderlich';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveCompany = () => {
        if (validateCompanyData()) {
            updateCompanyMutation.mutate(companyData);
        } else {
            toast.error('Bitte füllen Sie alle Pflichtfelder aus.');
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
                    toast.success(`Finanzamt für ${fa.name} erkannt`);
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
        if (candidates.length === 1) {
            setCompanyData((prev: any) => ({ ...prev, tax_office: `Finanzamt ${candidates[0].name}` }));
            toast.success(`Finanzamt für ${candidates[0].name} erkannt`);
        } else if (candidates.length > 1) {
            const exactNameMatch = candidates.find((fa: any) => fa.name.toLowerCase() === city.toLowerCase());
            if (exactNameMatch) {
                setCompanyData((prev: any) => ({ ...prev, tax_office: `Finanzamt ${exactNameMatch.name}` }));
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
                        if (candidates.length === 1) {
                            setCompanyData((prev: any) => ({ ...prev, tax_office: `Finanzamt ${candidates[0].name}` }));
                            toast.success(`Finanzamt für ${candidates[0].name} erkannt`);
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
                    toast.success(`Bank erkannt: ${data.bankData?.name || 'IBAN valide'}`);
                } else {
                    setErrors(prev => ({ ...prev, bank_iban: 'Ungültige IBAN' }));
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

    return (
        <div className="bg-white shadow-sm border border-slate-200 rounded-sm overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-medium border border-slate-100 rounded"><FaBuilding /></div>
                    <h3 className="text-sm font-medium text-slate-800">Unternehmensdaten</h3>
                </div>
                <button
                    onClick={handleSaveCompany}
                    disabled={updateCompanyMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white text-xs font-medium hover:bg-black transition shadow-sm disabled:opacity-50 rounded"
                >
                    <FaSave /> {updateCompanyMutation.isPending ? 'Speichert...' : 'Speichern'}
                </button>
            </div>

            <div className="p-8">
                {/* Basisinformationen */}
                <div className="mb-8">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 border-b border-slate-100 pb-2">Basisinformationen</h4>
                    <SettingRow label="Firmenname" description="Der offizielle Name Ihres Unternehmens, wie er auf Rechnungen erscheint.">
                        <Input
                            placeholder="Beispiel GmbH & Co. KG"
                            value={companyData.company_name || ''}
                            onChange={(e) => handleInputMetaChange('company_name', e.target.value)}
                            error={!!errors.company_name}
                        />
                    </SettingRow>
                    <SettingRow label="Rechtsform & Geschäftsführer" description="Rechtsform (z.B. GmbH) und Name des Geschäftsführers.">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <SearchableSelect
                                placeholder="Rechtsform wählen..."
                                options={legalFormOptions}
                                value={companyData.legal_form || ''}
                                onChange={(val) => handleInputMetaChange('legal_form', val)}
                                className="h-10"
                            />
                            <Input
                                placeholder="Geschäftsführer"
                                value={companyData.managing_director || ''}
                                onChange={(e) => handleInputMetaChange('managing_director', e.target.value)}
                            />
                        </div>
                    </SettingRow>
                    <SettingRow label="Webseite" description="Ihre offizielle Webseite.">
                        <Input
                            placeholder="https://www.beispiel.de"
                            value={companyData.website || ''}
                            onChange={(e) => handleInputMetaChange('website', e.target.value)}
                        />
                    </SettingRow>
                    <SettingRow label="Währung" description="Die Standardwährung für Ihr System.">
                        <Input
                            isSelect
                            value={companyData.currency || 'EUR'}
                            onChange={(e) => handleInputMetaChange('currency', e.target.value)}
                        >
                            <option value="EUR">EUR (€) - Euro</option>
                            <option value="USD">USD ($) - US Dollar</option>
                            <option value="CHF">CHF (Fr.) - Schweizer Franken</option>
                        </Input>
                    </SettingRow>
                </div>

                {/* Steuern & Identifikation */}
                <div className="mb-8">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 border-b border-slate-100 pb-2">Steuern & Identifikation</h4>
                    <SettingRow label="Steuernummern" description="Hinterlegen Sie hier Ihre steuerlichen Identifikationsnummern.">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">Steuernummer</label>
                                <IMaskInput
                                    mask="00/000/00000"
                                    placeholder="12/345/67890"
                                    value={companyData.tax_number || ''}
                                    unmask={false}
                                    onAccept={(value) => handleInputMetaChange('tax_number', value)}
                                    onBlur={handleTaxNumberBlur}
                                    className={clsx(
                                        'flex h-9 w-full rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition-all border outline-none',
                                        'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900',
                                        errors.tax_number && 'border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-red-500/10'
                                    )}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">USt-IdNr.</label>
                                <IMaskInput
                                    mask="aa000000000"
                                    definitions={{ 'a': /[a-zA-Z]/ }}
                                    placeholder="DE123456789"
                                    value={companyData.vat_id || ''}
                                    onAccept={(value) => handleInputMetaChange('vat_id', value.toUpperCase())}
                                    className={clsx(
                                        'flex h-9 w-full rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition-all border outline-none',
                                        'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900',
                                        errors.vat_id && 'border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-red-500/10'
                                    )}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">Wirtschafts-ID</label>
                                <IMaskInput
                                    mask="aa00000000000000"
                                    definitions={{ 'a': /[a-zA-Z]/ }}
                                    placeholder="DE12345678900001"
                                    value={companyData.tax_id || ''}
                                    onAccept={(value) => handleInputMetaChange('tax_id', value.toUpperCase())}
                                    className={clsx(
                                        'flex h-9 w-full rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition-all border outline-none',
                                        'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900',
                                        errors.tax_id && 'border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-red-500/10'
                                    )}
                                />
                            </div>
                        </div>
                    </SettingRow>
                    <SettingRow label="Finanzbehörde" description="Zugeordnetes Finanzamt für Ihre Steuererklärung.">
                        <SearchableSelect
                            placeholder="Finanzamt suchen oder auswählen..."
                            options={taxOfficeOptions.map(opt => ({ ...opt, label: `${opt.label} (${opt.bufa})` }))}
                            value={companyData.tax_office || ''}
                            onChange={(val) => handleInputMetaChange('tax_office', val)}
                        />
                    </SettingRow>
                </div>

                {/* Standort & Adresse */}
                <div className="mb-8">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 border-b border-slate-100 pb-2">Standort & Adresse</h4>
                    <SettingRow label="Anschrift" description="Der Hauptsitz Ihres Unternehmens.">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="sm:col-span-3">
                                    <Input
                                        label="Straße *"
                                        placeholder="Straße"
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
                                    label="Nr."
                                    placeholder="Nr."
                                    value={companyData.address_house_no || ''}
                                    onChange={(e) => handleInputMetaChange('address_house_no', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Input
                                        label="PLZ *"
                                        placeholder="PLZ"
                                        value={companyData.address_zip || ''}
                                        onChange={(e) => handleInputMetaChange('address_zip', e.target.value)}
                                        onBlur={handleZipBlur}
                                        error={!!errors.address_zip}
                                        endIcon={isValidatingZip ? <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div> : null}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Stadt *"
                                        placeholder="Stadt"
                                        value={companyData.address_city || ''}
                                        onChange={(e) => handleInputMetaChange('address_city', e.target.value)}
                                        onBlur={handleCityBlur}
                                        error={!!errors.address_city}
                                    />
                                </div>
                            </div>
                            <CountrySelect
                                value={companyData.address_country || 'Deutschland'}
                                onChange={(val) => handleInputMetaChange('address_country', val)}
                                label="Land"
                            />
                        </div>
                    </SettingRow>
                    <SettingRow label="Kontaktdaten" description="Öffentliche Kontaktdaten für Ihre Kunden.">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Telefon"
                                placeholder="+49 123 456789"
                                value={companyData.phone || ''}
                                onChange={(e) => handleInputMetaChange('phone', e.target.value)}
                            />
                            <Input
                                label="E-Mail"
                                placeholder="info@ihrefirma.de"
                                value={companyData.email || ''}
                                onChange={(e) => handleInputMetaChange('email', e.target.value)}
                            />
                            <div className="col-span-1 md:col-span-2">
                                <Input
                                    label="Öffnungszeiten"
                                    placeholder="Mo-Fr 08:00 - 17:00 Uhr"
                                    value={companyData.opening_hours || ''}
                                    onChange={(e) => handleInputMetaChange('opening_hours', e.target.value)}
                                />
                            </div>
                        </div>
                    </SettingRow>
                </div>

                {/* Firmenlogo */}
                <div className="mb-8">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 border-b border-slate-100 pb-2">Firmenlogo</h4>
                    <SettingRow label="Logo hochladen" description="Ihr Logo erscheint auf Rechnungen und Dokumenten. Max. 4 MB (PNG, JPG, SVG).">
                        <LogoUpload logoPath={companyData.company_logo} onUploaded={() => queryClient.invalidateQueries({ queryKey: ['companySettings'] })} />
                    </SettingRow>
                </div>

                {/* Bankverbindung */}
                <div className="mb-8">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 border-b border-slate-100 pb-2">Bankverbindung</h4>
                    <SettingRow label="Bankdaten" description="Ihre IBAN und BIC für Überweisungen (erscheint auf Rechnungen).">
                        <div className="space-y-4">
                            <Input
                                label="Kontoinhaber"
                                placeholder={user?.name || 'Vorname Nachname'}
                                value={companyData.bank_account_holder || ''}
                                onChange={(e) => handleInputMetaChange('bank_account_holder', e.target.value)}
                            />
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">IBAN</label>
                                <div className="relative">
                                    <IMaskInput
                                        mask="aa00 0000 0000 0000 0000 00"
                                        definitions={{ 'a': /[a-zA-Z]/ }}
                                        placeholder="DE00 0000 0000 0000 0000 00"
                                        value={companyData.bank_iban || ''}
                                        onAccept={(value) => handleInputMetaChange('bank_iban', value.toUpperCase())}
                                        onBlur={handleIbanBlur}
                                        className={clsx(
                                            'flex h-9 w-full rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition-all border outline-none',
                                            'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900',
                                            errors.bank_iban && 'border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-red-500/10'
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
                                    label="Bankname"
                                    placeholder="Musterbank AG"
                                    value={companyData.bank_name || ''}
                                    onChange={(e) => handleInputMetaChange('bank_name', e.target.value)}
                                />
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">BLZ</label>
                                    <Input
                                        placeholder="000 000 00"
                                        value={companyData.bank_code || ''}
                                        onChange={(e) => handleInputMetaChange('bank_code', e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">BIC</label>
                                    <IMaskInput
                                        mask="aaaaaa aa [aaa]"
                                        definitions={{ 'a': /[a-zA-Z0-9]/ }}
                                        placeholder="ABCDEFGH"
                                        value={companyData.bank_bic || ''}
                                        onAccept={(value) => handleInputMetaChange('bank_bic', value.toUpperCase())}
                                        onBlur={handleBicBlur}
                                        className={clsx(
                                            'flex h-9 w-full rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition-all border outline-none',
                                            'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900'
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </SettingRow>
                </div>
            </div>
        </div>
    );
};

export default CompanySettingsTab;
