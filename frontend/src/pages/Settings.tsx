import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FaBuilding, FaDatabase, FaHistory, FaSave, FaPlus, FaTrash,
    FaGlobe, FaEdit, FaEnvelopeOpenText, FaLanguage, FaFileAlt,
    FaUserShield, FaCcPaypal, FaCcStripe, FaCcVisa, FaUniversity
} from 'react-icons/fa';
import clsx from 'clsx';
import { settingsService } from '../api/services';
import DataTable from '../components/common/DataTable';
import TableSkeleton from '../components/common/TableSkeleton';
import NewMasterDataModal from '../components/modals/NewMasterDataModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import Input from '../components/common/Input';
import CountrySelect from '../components/common/CountrySelect';
import SearchableSelect from '../components/common/SearchableSelect';
import { getFlagUrl } from '../utils/flags';

const legalFormOptions = [
    { value: 'Einzelunternehmen', label: 'Einzelunternehmen' },
    { value: 'GbR', label: 'GbR (Gesellschaft bürgerlichen Rechts)' },
    { value: 'GmbH', label: 'GmbH (Gesellschaft mit beschränkter Haftung)' },
    { value: 'GmbH & Co. KG', label: 'GmbH & Co. KG' },
    { value: 'UG (haftungsbeschränkt)', label: 'UG (haftungsbeschränkt)' },
    { value: 'AG', label: 'AG (Aktiengesellschaft)' },
    { value: 'KG', label: 'KG (Kommanditgesellschaft)' },
    { value: 'OHG', label: 'OHG (Offene Handelsgesellschaft)' },
    { value: 'e.K.', label: 'e.K. (eingetragener Kaufmann / -frau)' },
    { value: 'PartG', label: 'PartG (Partnerschaftsgesellschaft)' },
    { value: 'eG', label: 'eG (eingetragene Genossenschaft)' },
    { value: 'e.V.', label: 'e.V. (eingetragener Verein)' },
    { value: 'Stiftung', label: 'Stiftung' },
    { value: 'Körperschaft d.ö.R.', label: 'Körperschaft d.ö.R.' }
];

const SettingRow = ({ label, description, children, className }: any) => (
    <div className={clsx("grid grid-cols-12 gap-6 py-6 border-b border-slate-100 last:border-0 items-start", className)}>
        <div className="col-span-12 md:col-span-4 space-y-1">
            <label className="block text-sm font-bold text-slate-700">{label}</label>
            {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
        </div>
        <div className="col-span-12 md:col-span-8">
            {children}
        </div>
    </div>
);

const Settings: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('company');
    const [masterTab, setMasterTab] = useState<'languages' | 'doc_types' | 'services' | 'email_templates'>('languages');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [companyData, setCompanyData] = useState<any>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isValidatingZip, setIsValidatingZip] = useState(false);
    const [isValidatingIban, setIsValidatingIban] = useState(false);
    const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: any | null }>({ isOpen: false, item: null });

    // API Data Fetching
    const { data: serverCompanyData } = useQuery({
        queryKey: ['companySettings'],
        queryFn: settingsService.getCompany
    });

    const { data: languages = [], isLoading: isLanguagesLoading } = useQuery<any[]>({
        queryKey: ['languages'],
        queryFn: settingsService.getLanguages
    });

    const { data: docTypes = [], isLoading: isDocTypesLoading } = useQuery<any[]>({
        queryKey: ['docTypes'],
        queryFn: settingsService.getDocTypes
    });

    const { data: services = [], isLoading: isServicesLoading } = useQuery<any[]>({
        queryKey: ['services'],
        queryFn: settingsService.getServices
    });

    const { data: emailTemplates = [], isLoading: isTemplatesLoading } = useQuery<any[]>({
        queryKey: ['emailTemplates'],
        queryFn: settingsService.getEmailTemplates
    });

    const { data: activities = [], isLoading: isActivitiesLoading } = useQuery<any[]>({
        queryKey: ['activities'],
        queryFn: settingsService.getActivities,
        enabled: activeTab === 'audit'
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

    const testMailMutation = useMutation({
        mutationFn: settingsService.testMailConnection,
        onSuccess: (data: any) => {
            if (data.smtp.success && data.imap.success) {
                toast.success('Alle Verbindungen erfolgreich!\nSMTP: ' + data.smtp.message + '\nIMAP: ' + data.imap.message);
            } else {
                if (!data.smtp.success) toast.error('SMTP Fehler: ' + data.smtp.message);
                if (!data.imap.success) toast.error('IMAP Fehler: ' + data.imap.message);
                if (data.smtp.success) toast.success('SMTP erfolgreich: ' + data.smtp.message);
                if (data.imap.success) toast.success('IMAP erfolgreich: ' + data.imap.message);
            }
        },
        onError: (error: any) => {
            toast.error('Verbindungstest fehlgeschlagen: ' + (error.response?.data?.message || error.message));
        }
    });

    const handleTestConnection = () => {
        if (!companyData.mail_host || !companyData.mail_username || !companyData.mail_password) {
            toast.error('Bitte füllen Sie Host, Benutzername und Passwort aus.');
            return;
        }
        const encryption = companyData.mail_encryption || 'ssl';
        const port = companyData.mail_port || (encryption === 'ssl' ? '465' : '587');
        testMailMutation.mutate({
            mail_host: companyData.mail_host,
            mail_port: port,
            mail_username: companyData.mail_username,
            mail_password: companyData.mail_password,
            mail_encryption: encryption
        });
    };

    // Master Data Mutations
    const createLanguageMutation = useMutation({ mutationFn: settingsService.createLanguage, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['languages'] }); setIsModalOpen(false); } });
    const updateLanguageMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateLanguage(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['languages'] }); setIsModalOpen(false); } });
    const deleteLanguageMutation = useMutation({ mutationFn: settingsService.deleteLanguage, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['languages'] }) });

    const createDocTypeMutation = useMutation({ mutationFn: settingsService.createDocType, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['docTypes'] }); setIsModalOpen(false); } });
    const updateDocTypeMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateDocType(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['docTypes'] }); setIsModalOpen(false); } });
    const deleteDocTypeMutation = useMutation({ mutationFn: settingsService.deleteDocType, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['docTypes'] }) });

    const createServiceMutation = useMutation({ mutationFn: settingsService.createService, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); setIsModalOpen(false); } });
    const updateServiceMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateService(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); setIsModalOpen(false); } });
    const deleteServiceMutation = useMutation({ mutationFn: settingsService.deleteService, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }) });

    const createTemplateMutation = useMutation({ mutationFn: settingsService.createEmailTemplate, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['emailTemplates'] }); setIsModalOpen(false); } });
    const updateTemplateMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateEmailTemplate(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['emailTemplates'] }); setIsModalOpen(false); } });
    const deleteTemplateMutation = useMutation({ mutationFn: settingsService.deleteEmailTemplate, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emailTemplates'] }) });

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

        // Auto street suggestions if ZIP is present
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

    const handleZipBlur = async () => {
        if (!companyData.address_zip || companyData.address_zip.length < 5) return;
        setIsValidatingZip(true);
        try {
            // Fetch city based on ZIP
            const response = await fetch(`https://openplzapi.org/de/Localities?postalCode=${companyData.address_zip}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    // If city is not filled or different, update it
                    if (!companyData.address_city || companyData.address_city !== data[0].name) {
                        setCompanyData((prev: any) => ({ ...prev, address_city: data[0].name }));
                        setErrors(prev => ({ ...prev, address_city: '' }));
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
        if (!companyData.bank_iban || companyData.bank_iban.length < 15) return;
        setIsValidatingIban(true);
        try {
            const response = await fetch(`https://openiban.com/validate/${companyData.bank_iban}?getBIC=true&validateBankCode=true`);
            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    setCompanyData((prev: any) => ({
                        ...prev,
                        bank_bic: data.bankData?.bic || prev.bank_bic,
                        bank_name: data.bankData?.name || prev.bank_name
                    }));
                    setErrors(prev => ({ ...prev, bank_iban: '' }));
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

        // Lokaler Katalog der häufigsten Banken (Fallback wenn keine API verfügbar)
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

    const handleSaveCompany = () => {
        if (validateCompanyData()) {
            updateCompanyMutation.mutate(companyData);
        } else {
            toast.error('Bitte füllen Sie alle Pflichtfelder aus.');
        }
    };

    const tabs = [
        { id: 'company', label: 'Unternehmen', icon: FaBuilding },
        { id: 'master_data', label: 'Stammdaten', icon: FaDatabase },
        { id: 'audit', label: 'Audit Logs', icon: FaHistory },
    ];



    const handleOpenModal = (item?: any) => {
        setEditingItem(item || null);
        setIsModalOpen(true);
    };

    const handleSaveMasterData = (data: any) => {
        if (masterTab === 'languages') {
            if (data.id) updateLanguageMutation.mutate({ id: data.id, data });
            else createLanguageMutation.mutate(data);
        } else if (masterTab === 'doc_types') {
            if (data.id) updateDocTypeMutation.mutate({ id: data.id, data });
            else createDocTypeMutation.mutate(data);
        } else if (masterTab === 'services') {
            if (data.id) updateServiceMutation.mutate({ id: data.id, data });
            else createServiceMutation.mutate(data);
        } else if (masterTab === 'email_templates') {
            if (data.id) updateTemplateMutation.mutate({ id: data.id, data });
            else createTemplateMutation.mutate(data);
        }
    };

    const handleDeleteMasterData = (item: any) => {
        setDeleteConfirm({ isOpen: true, item });
    };

    const confirmDelete = () => {
        if (deleteConfirm.item) {
            const id = deleteConfirm.item.id;
            if (masterTab === 'languages') deleteLanguageMutation.mutate(id);
            else if (masterTab === 'doc_types') deleteDocTypeMutation.mutate(id);
            else if (masterTab === 'services') deleteServiceMutation.mutate(id);
            else if (masterTab === 'email_templates') deleteTemplateMutation.mutate(id);
        }
    };

    const handleModalSubmit = (data: any) => {
        if (editingItem) {
            const id = editingItem.id;
            if (masterTab === 'languages') updateLanguageMutation.mutate({ id, data });
            else if (masterTab === 'doc_types') updateDocTypeMutation.mutate({ id, data });
            else if (masterTab === 'services') updateServiceMutation.mutate({ id, data });
            else if (masterTab === 'email_templates') updateTemplateMutation.mutate({ id, data });
        } else {
            if (masterTab === 'languages') createLanguageMutation.mutate(data);
            else if (masterTab === 'doc_types') createDocTypeMutation.mutate(data);
            else if (masterTab === 'services') createServiceMutation.mutate(data);
            else if (masterTab === 'email_templates') createTemplateMutation.mutate(data);
        }
    };



    const renderCompanySettings = () => (
        <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold border border-brand-100 rounded"><FaBuilding /></div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Unternehmensdaten</h3>
                    </div>
                </div>
                <button
                    onClick={handleSaveCompany}
                    disabled={updateCompanyMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-brand-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition active:scale-95 shadow-lg disabled:opacity-50 rounded"
                >
                    <FaSave /> {updateCompanyMutation.isPending ? 'Speichert...' : 'Speichern'}
                </button>
            </div>

            <div className="p-8">
                {/* Section: Basisdaten */}
                <div className="mb-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Basisinformationen</h4>
                    <SettingRow label="Firmenname" description="Der offizielle Name Ihres Unternehmens, wie er auf Rechnungen erscheint.">
                        <Input
                            placeholder="Beispiel GmbH & Co. KG"
                            value={companyData.company_name || ''}
                            onChange={(e) => handleInputMetaChange('company_name', e.target.value)}
                            error={!!errors.company_name}
                        />
                    </SettingRow>
                    <SettingRow label="Rechtsform & Marke" description="Rechtsform (z.B. GmbH) und öffentlicher Markenname falls abweichend.">
                        <div className="grid grid-cols-2 gap-4">
                            <SearchableSelect
                                placeholder="Rechtsform wählen..."
                                options={legalFormOptions}
                                value={companyData.legal_form || ''}
                                onChange={(val) => handleInputMetaChange('legal_form', val)}
                                className="h-10"
                            />
                            <Input
                                placeholder="Markenname"
                                value={companyData.domain || ''}
                                onChange={(e) => handleInputMetaChange('domain', e.target.value)}
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

                {/* Section: Steuer & Rechtliches */}
                <div className="mb-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Steuern & Identifikation</h4>
                    <SettingRow label="Steuernummern" description="Hinterlegen Sie hier Ihre steuerlichen Identifikationsnummern.">
                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                label="Steuernummer"
                                placeholder="12/345/67890"
                                value={companyData.tax_number || ''}
                                onChange={(e) => handleInputMetaChange('tax_number', e.target.value)}
                            />
                            <Input
                                label="USt-IdNr."
                                placeholder="DE123456789"
                                value={companyData.vat_id || ''}
                                onChange={(e) => handleInputMetaChange('vat_id', e.target.value)}
                            />
                            <Input
                                label="Wirtschafts-ID"
                                placeholder="DE123456789"
                                value={companyData.tax_id || ''}
                                onChange={(e) => handleInputMetaChange('tax_id', e.target.value)}
                            />
                        </div>
                    </SettingRow>

                </div>

                {/* Section: Adresse */}
                <div className="mb-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Standort & Adresse</h4>
                    <SettingRow label="Anschrift" description="Der Hauptsitz Ihres Unternehmens.">
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3">
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
                            <div className="grid grid-cols-3 gap-4">
                                <div className="relative">
                                    <Input
                                        label="PLZ *"
                                        placeholder="PLZ"
                                        value={companyData.address_zip || ''}
                                        onChange={(e) => handleInputMetaChange('address_zip', e.target.value)}
                                        onBlur={handleZipBlur}
                                        error={!!errors.address_zip}
                                        endIcon={isValidatingZip ? <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div> : null}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        label="Stadt *"
                                        placeholder="Stadt"
                                        value={companyData.address_city || ''}
                                        onChange={(e) => handleInputMetaChange('address_city', e.target.value)}
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
                </div>

                {/* Section: Bankverbindung */}
                <div className="mb-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Bankverbindung</h4>
                    <SettingRow label="Bankdaten" description="Ihre IBAN und BIC für Überweisungen (erscheint auf Rechnungen).">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Bankname"
                                    placeholder="Musterbank AG"
                                    value={companyData.bank_name || ''}
                                    onChange={(e) => handleInputMetaChange('bank_name', e.target.value)}
                                />
                                <Input
                                    label="BIC"
                                    placeholder="ABCDEFGH"
                                    value={companyData.bank_bic || ''}
                                    onChange={(e) => handleInputMetaChange('bank_bic', e.target.value)}
                                    onBlur={handleBicBlur}
                                />
                            </div>
                            <div className="relative">
                                <Input
                                    label="IBAN"
                                    placeholder="DE00 0000 0000 0000 0000 00"
                                    value={companyData.bank_iban || ''}
                                    onChange={(e) => handleInputMetaChange('bank_iban', e.target.value)}
                                    onBlur={handleIbanBlur}
                                    error={!!errors.bank_iban}
                                    className="font-mono tracking-wide"
                                    endIcon={isValidatingIban ? <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div> : null}
                                />
                                {errors.bank_iban && <span className="text-[10px] text-red-500 font-bold block mt-1">{errors.bank_iban}</span>}
                            </div>
                        </div>
                    </SettingRow>
                </div>

                {/* Section: Email / SMTP */}
                <div className="mb-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">E-Mail Server (SMTP / IMAP)</h4>
                    <SettingRow label="Verbindung" description="Host und SMTP-Port Ihres E-Mail-Providers. Der IMAP-Port wird automatisch ermittelt.">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <Input label="Mail Host" placeholder="mail.provider.de" value={companyData.mail_host || ''} onChange={(e) => handleInputMetaChange('mail_host', e.target.value)} helperText="z.B. mail.manitu.de, smtp.strato.de" />
                            </div>
                            <Input
                                label="SMTP Port"
                                placeholder={(companyData.mail_encryption || 'ssl') === 'ssl' ? '465' : '587'}
                                type="number"
                                min={1}
                                max={65535}
                                value={companyData.mail_port || ''}
                                onChange={(e) => handleInputMetaChange('mail_port', e.target.value)}
                                helperText={`SSL→465, TLS→587`}
                            />
                        </div>
                    </SettingRow>
                    <SettingRow label="Authentifizierung" description="Zugangsdaten für Ihren E-Mail-Account.">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Benutzername / E-Mail" placeholder="noreply@ihrbuero.de" value={companyData.mail_username || ''} onChange={(e) => handleInputMetaChange('mail_username', e.target.value)} helperText="Meistens Ihre E-Mail-Adresse" />
                            <Input type="password" label="Passwort" placeholder="••••••••" value={companyData.mail_password || ''} onChange={(e) => handleInputMetaChange('mail_password', e.target.value)} />
                        </div>
                    </SettingRow>
                    <SettingRow label="Verschlüsselung" description="SSL/TLS ist Standard bei den meisten Anbietern (Manitu, Strato, IONOS, etc.).">
                        <div className="flex gap-4">
                            <select
                                value={companyData.mail_encryption || 'ssl'}
                                onChange={(e) => {
                                    const enc = e.target.value;
                                    handleInputMetaChange('mail_encryption', enc);
                                    // Auto-update port based on encryption type
                                    const autoPort = enc === 'ssl' ? '465' : enc === 'tls' ? '587' : '25';
                                    handleInputMetaChange('mail_port', autoPort);
                                }}
                                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm cursor-pointer font-medium"
                            >
                                <option value="ssl">SSL/TLS – Port 465 (Empfohlen)</option>
                                <option value="tls">STARTTLS – Port 587</option>
                                <option value="none">Keine Verschlüsselung – Port 25</option>
                            </select>
                            <button
                                onClick={handleTestConnection}
                                disabled={testMailMutation.isPending}
                                className="px-6 py-2 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition active:scale-95 disabled:opacity-50 shrink-0 rounded"
                            >
                                {testMailMutation.isPending ? 'Testet...' : 'Verbindung testen'}
                            </button>
                        </div>
                    </SettingRow>
                </div>
            </div>
        </div>
    );

    const renderMasterData = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-6 border-b border-slate-200">
                {(['languages', 'doc_types', 'services', 'email_templates'] as const).map(t => (
                    <button key={t} onClick={() => setMasterTab(t)} className={clsx("py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative", masterTab === t ? "border-brand-600 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600")}>
                        {t === 'languages' ? 'Sprachen' : t === 'doc_types' ? 'Dokumentarten' : t === 'services' ? 'Dienstleistungen' : 'Email Vorlagen'}
                    </button>
                ))}
            </div>
            <div className="flex items-center justify-end py-2">
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-6 py-2 bg-brand-700 text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-800 transition active:scale-95 shadow-sm rounded">
                    <FaPlus className="text-[10px]" /> Neu hinzufügen
                </button>
            </div>
            <div className="bg-white shadow-xl border border-slate-200 rounded-lg overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-3">
                        {masterTab === 'languages' ? <FaLanguage /> : masterTab === 'doc_types' ? <FaFileAlt /> : masterTab === 'services' ? <FaGlobe /> : <FaEnvelopeOpenText />}
                        {masterTab === 'languages' ? 'Sprachkonfiguration' : masterTab === 'doc_types' ? 'Dokumenten-Kategorien' : masterTab === 'services' ? 'Leistungskatalog' : 'Email Textvorlagen'}
                    </h3>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                    {masterTab === 'languages' && (isLanguagesLoading ? <TableSkeleton rows={5} columns={5} /> : <DataTable isLoading={isLanguagesLoading} data={languages} columns={[
                        { id: 'code', header: 'Code (ISO)', accessor: (l: any) => <span className=" text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 border border-slate-100 uppercase tracking-tight rounded">{l.iso_code}</span>, className: 'w-32' },
                        { id: 'name', header: 'Sprache / Flagge', accessor: (l: any) => <div className="flex items-center gap-3"><div className="w-8 h-6 overflow-hidden shadow-sm border border-slate-200 bg-slate-50 rounded-sm">{l.flag_icon && <img src={getFlagUrl(l.flag_icon)} className="w-full h-full object-cover" />}</div><span className="font-bold text-slate-800 text-sm">{l.name_internal}</span></div> },
                        { id: 'native', header: 'Native', accessor: 'name_native' },
                        { id: 'status', header: 'Status', accessor: (l: any) => <span className={clsx("px-2 py-0.5 text-[10px] font-bold uppercase border tracking-tight rounded-[4px]", l.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{l.status}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (l: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(l)} className="p-2 text-slate-400 hover:text-brand-600 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(l)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={10} />)}
                    {masterTab === 'doc_types' && (isDocTypesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isDocTypesLoading} data={docTypes} columns={[
                        { id: 'category', header: 'Kategorie', accessor: (d: any) => <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.category || '-'}</span>, className: 'w-48' },
                        { id: 'name', header: 'Dokumentart', accessor: (d: any) => <span className="font-bold text-slate-800 text-sm">{d.name}</span> },
                        { id: 'status', header: 'Status', accessor: () => <span className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase border tracking-tight rounded-[4px]">Aktiv</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (d: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(d)} className="p-2 text-slate-400 hover:text-brand-600 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(d)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={10} />)}
                    {masterTab === 'services' && (isServicesLoading ? <TableSkeleton rows={5} columns={5} /> : <DataTable isLoading={isServicesLoading} data={services} columns={[
                        { id: 'name', header: 'Dienstleistung', accessor: (s: any) => <span className="font-bold text-slate-800 text-sm">{s.name}</span> },
                        { id: 'unit', header: 'Einheit', accessor: (s: any) => <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.unit}</span> },
                        { id: 'price', header: 'Basispreis', accessor: (s: any) => <span className="font-bold text-brand-700">{s.base_price} €</span> },
                        { id: 'status', header: 'Status', accessor: (s: any) => <span className={clsx("px-2 py-0.5 text-[10px] font-bold uppercase border tracking-tight rounded-[4px]", s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{s.status}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (s: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-brand-600 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(s)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={10} />)}
                    {masterTab === 'email_templates' && (isTemplatesLoading ? <TableSkeleton rows={5} columns={5} /> : <DataTable isLoading={isTemplatesLoading} data={emailTemplates} columns={[
                        { id: 'name', header: 'Name', accessor: (e: any) => <span className="font-bold text-slate-800 text-sm">{e.name}</span> },
                        { id: 'subject', header: 'Betreff', accessor: (e: any) => <span className="text-xs text-slate-500">{e.subject}</span> },
                        { id: 'type', header: 'Typ', accessor: 'type' },
                        { id: 'status', header: 'Status', accessor: (e: any) => <span className={clsx("px-2 py-0.5 text-[10px] font-bold uppercase border tracking-tight rounded-[4px]", e.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{e.status}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (e: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(e)} className="p-2 text-slate-400 hover:text-brand-600 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(e)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={10} />)}
                </div>
            </div>
            <NewMasterDataModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSaveMasterData} type={masterTab} initialData={editingItem} />
        </div>
    );

    const renderAuditLogs = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold border border-brand-100 rounded"><FaUserShield /></div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Audit Logs / Aktivitätsverlauf</h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Vollständige Historie aller Systemänderungen</p>
                    </div>
                </div>
                <div className="flex-1 min-h-[500px]">
                    {isActivitiesLoading ? <TableSkeleton rows={10} columns={5} /> : (
                        <DataTable
                            isLoading={isActivitiesLoading}
                            data={activities}
                            columns={[
                                { id: 'time', header: 'Zeitpunkt', accessor: (a: any) => <span className="text-slate-500 text-[10px] font-bold">{new Date(a.created_at).toLocaleString('de-DE')}</span>, className: 'w-40' },
                                { id: 'time', header: 'Zeitpunkt', accessor: (a: any) => <span className="text-slate-500 text-[10px] font-bold">{new Date(a.created_at).toLocaleString('de-DE')}</span>, className: 'w-40' },
                                { id: 'user', header: 'Benutzer', accessor: (a: any) => <span className="font-bold text-slate-800">{a.causer?.name || 'System'}</span> },
                                { id: 'action', header: 'Aktion', accessor: (a: any) => <span className={clsx("px-2 py-0.5 text-[10px] font-bold uppercase border tracking-tight rounded-[4px]", a.description === 'created' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : a.description === 'updated' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200')}>{a.description}</span>, align: 'center' },
                                { id: 'model', header: 'Modell', accessor: (a: any) => <span className="text-xs text-slate-400 italic">{a.subject_type.split('\\').pop()}</span> },
                                { id: 'details', header: 'Details', accessor: (a: any) => <div className="max-w-xs truncate text-[10px] text-slate-500 font-brand bg-slate-50 p-1">{JSON.stringify(a.properties)}</div> }
                            ]}
                            pageSize={15}
                        />
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto fade-in flex flex-col gap-6 p-4">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">System Einstellungen</h1>
                    <p className="text-slate-500 text-sm">Zentrale Konfiguration für Ihr Translation Office.</p>
                </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                <div className="lg:w-64 flex-none">
                    <div className="bg-white shadow-sm border border-slate-200 overflow-hidden p-2 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 block">Konfiguration</label>
                        {tabs.map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("w-full flex items-center gap-3 px-3 py-2.5 text-xs transition-all duration-200 group", activeTab === tab.id ? "bg-brand-900 text-white shadow-md font-bold" : "text-slate-500 hover:bg-slate-50 hover:text-brand-700 font-medium uppercase tracking-wide")}>
                                <tab.icon className={clsx("text-sm shrink-0", activeTab === tab.id ? "text-brand-300" : "text-slate-400")} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 min-w-0 pb-20">
                    {activeTab === 'company' && renderCompanySettings()}
                    {activeTab === 'master_data' && renderMasterData()}
                    {activeTab === 'audit' && renderAuditLogs()}
                </div>
            </div>

            <NewMasterDataModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                type={masterTab}
                initialData={editingItem}
            />

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
                onConfirm={confirmDelete}
                title="Datensatz löschen?"
                message={`Möchten Sie "${deleteConfirm.item?.name || deleteConfirm.item?.name_internal || deleteConfirm.item?.subject || 'Eintrag'}" wirklich löschen?`}
                confirmText="Löschen"
                cancelText="Abbrechen"
                type="danger"
                isLoading={deleteLanguageMutation.isPending || deleteDocTypeMutation.isPending || deleteServiceMutation.isPending || deleteTemplateMutation.isPending}
            />
        </div>
    );
};

export default Settings;
