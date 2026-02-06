import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FaBuilding, FaDatabase, FaHistory, FaSave, FaPlus, FaTrash,
    FaGlobe, FaEdit, FaEnvelopeOpenText, FaLanguage, FaFileAlt,
    FaUserShield, FaLandmark, FaIdCard, FaCcPaypal, FaCcStripe, FaCcVisa, FaUniversity
} from 'react-icons/fa';
import clsx from 'clsx';
import { settingsService } from '../api/services';
import DataTable from '../components/common/DataTable';
import TableSkeleton from '../components/common/TableSkeleton';
import NewMasterDataModal from '../components/modals/NewMasterDataModal';
import Input from '../components/common/Input';
import CountrySelect from '../components/common/CountrySelect';
import { getFlagUrl } from '../utils/flags';

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
            alert('Einstellungen gespeichert!');
        }
    });

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
            setCompanyData(serverCompanyData);
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
            alert('Bitte füllen Sie alle Pflichtfelder aus.');
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
        if (!window.confirm(`Möchten Sie "${item.name || item.name_internal || item.subject}" wirklich löschen?`)) return;
        if (masterTab === 'languages') deleteLanguageMutation.mutate(item.id);
        else if (masterTab === 'doc_types') deleteDocTypeMutation.mutate(item.id);
        else if (masterTab === 'services') deleteServiceMutation.mutate(item.id);
        else if (masterTab === 'email_templates') deleteTemplateMutation.mutate(item.id);
    };

    const renderCompanySettings = () => (
        <div className="space-y-8">
            <div className="flex justify-end p-2 bg-white shadow-sm border border-slate-200 mb-4 sticky top-0 z-10 gap-3">
                <button
                    onClick={handleSaveCompany}
                    disabled={updateCompanyMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-brand-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition active:scale-95 shadow-lg disabled:opacity-50 rounded"
                >
                    <FaSave /> {updateCompanyMutation.isPending ? 'Speichert...' : 'Alles Speichern'}
                </button>
            </div>

            {/* Section 1: Stammdaten */}
            <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold border border-brand-100 rounded"><FaBuilding /></div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Stammdaten</h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Allgemeine Unternehmensinformationen</p>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Input
                        label="Offizieller Firmenname *"
                        placeholder="Beispiel GmbH & Co. KG"
                        value={companyData.company_name || ''}
                        onChange={(e) => handleInputMetaChange('company_name', e.target.value)}
                        error={!!errors.company_name}
                        containerClassName="lg:col-span-1"
                    />
                    <Input
                        label="Rechtsform"
                        placeholder="GmbH, e.K., Freelancer"
                        value={companyData.legal_form || ''}
                        onChange={(e) => handleInputMetaChange('legal_form', e.target.value)}
                    />
                    <Input
                        label="Markenname / Portal-Name"
                        placeholder="Translation Hub"
                        value={companyData.domain || ''}
                        onChange={(e) => handleInputMetaChange('domain', e.target.value)}
                    />
                    <Input
                        label="Webseite"
                        placeholder="https://www.beispiel.de"
                        value={companyData.website || ''}
                        onChange={(e) => handleInputMetaChange('website', e.target.value)}
                    />
                    <Input
                        isSelect
                        label="Währung (Standard)"
                        value={companyData.currency || 'EUR'}
                        onChange={(e) => handleInputMetaChange('currency', e.target.value)}
                    >
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="CHF">CHF (Fr.) - Schweizer Franken</option>
                    </Input>
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
                        label="Wirtschafts-ID (tax_id)"
                        placeholder="DE123456789"
                        value={companyData.tax_id || ''}
                        onChange={(e) => handleInputMetaChange('tax_id', e.target.value)}
                    />
                </div>
            </div>

            {/* Section: SMTP Einstellungen */}
            <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] rounded"><FaEnvelopeOpenText /></div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">SMTP-Einstellungen</h4>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mail Host</label>
                        <input type="text" placeholder="smtp.example.com" value={companyData.mail_host || ''} onChange={(e) => handleInputMetaChange('mail_host', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 text-sm focus:border-brand-500 outline-none h-10 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mail Port</label>
                        <input type="text" placeholder="587" value={companyData.mail_port || ''} onChange={(e) => handleInputMetaChange('mail_port', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 text-sm focus:border-brand-500 outline-none h-10 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Verschlüsselung</label>
                        <select value={companyData.mail_encryption || 'tls'} onChange={(e) => handleInputMetaChange('mail_encryption', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 text-sm outline-none h-10 shadow-sm cursor-pointer font-medium">
                            <option value="tls">TLS</option>
                            <option value="ssl">SSL</option>
                            <option value="none">Keine</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Benutzername</label>
                        <input type="text" placeholder="user@example.com" value={companyData.mail_username || ''} onChange={(e) => handleInputMetaChange('mail_username', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 text-sm focus:border-brand-500 outline-none h-10 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Passwort</label>
                        <input type="password" placeholder="********" value={companyData.mail_password || ''} onChange={(e) => handleInputMetaChange('mail_password', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 text-sm focus:border-brand-500 outline-none h-10 shadow-sm" />
                    </div>
                </div>
            </div>

            {/* Section: Nummernkreise & IDs */}
            <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] rounded"><FaIdCard /></div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Nummernkreise & IDs</h4>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kunden (z.B. K-)</label>
                        <input type="text" placeholder="K-" value={companyData.customer_id_prefix || ''} onChange={(e) => handleInputMetaChange('customer_id_prefix', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 text-sm outline-none h-10 shadow-sm focus:border-brand-500 font-bold text-slate-700" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Partner (z.B. D-)</label>
                        <input type="text" placeholder="D-" value={companyData.partner_id_prefix || ''} onChange={(e) => handleInputMetaChange('partner_id_prefix', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 text-sm outline-none h-10 shadow-sm focus:border-brand-500 font-bold text-slate-700" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Projekte (z.B. PO-)</label>
                        <input type="text" placeholder="PO-" value={companyData.project_id_prefix || ''} onChange={(e) => handleInputMetaChange('project_id_prefix', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 text-sm outline-none h-10 shadow-sm focus:border-brand-500 font-bold text-slate-700" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rechnungen (z.B. RE-)</label>
                        <input type="text" placeholder="RE-" value={companyData.invoice_id_prefix || ''} onChange={(e) => handleInputMetaChange('invoice_id_prefix', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 text-sm outline-none h-10 shadow-sm focus:border-brand-500 font-bold text-slate-700" />
                    </div>
                </div>
            </div>

            {/* Section 2: Address */}
            <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] rounded"><FaGlobe /></div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Adresse</h4>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-3">
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
                        <div>
                            <Input
                                label="Hausnummer"
                                placeholder="Nr."
                                value={companyData.address_house_no || ''}
                                onChange={(e) => handleInputMetaChange('address_house_no', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <Input
                                label="Postleitzahl *"
                                placeholder="PLZ"
                                value={companyData.address_zip || ''}
                                onChange={(e) => handleInputMetaChange('address_zip', e.target.value)}
                                onBlur={handleZipBlur}
                                error={!!errors.address_zip}
                                endIcon={isValidatingZip ? <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div> : null}
                            />
                        </div>
                        <div>
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
            </div>

            {/* Section 3: Payment */}
            <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] border border-brand-100 rounded"><FaLandmark /></div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Zahlungsinformationen</h4>
                            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tight">Standard-Zahlungsweg für Ausgangsrechnungen auswählen</p>
                        </div>
                    </div>
                    <div className="flex bg-slate-200/50 p-1 gap-1">
                        {(['bank', 'card', 'paypal', 'stripe'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => handleInputMetaChange('payment_method_type', type)}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all shadow-sm rounded",
                                    (companyData.payment_method_type || 'bank') === type
                                        ? "bg-white text-brand-900 scale-105"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                )}
                            >
                                {type === 'bank' && <FaUniversity className="text-xs" />}
                                {type === 'card' && <FaCcVisa className="text-xs" />}
                                {type === 'paypal' && <FaCcPaypal className="text-xs" />}
                                {type === 'stripe' && <FaCcStripe className="text-xs" />}
                                {type === 'bank' ? 'Überweisung' : type === 'card' ? 'Kreditkarte' : type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BIC</label>
                            <input
                                type="text"
                                placeholder="ABCDEFGH"
                                value={companyData.bank_bic || ''}
                                onChange={(e) => handleInputMetaChange('bank_bic', e.target.value)}
                                onBlur={handleBicBlur}
                                className="w-full px-3 py-2 bg-white border border-slate-300 text-sm outline-none h-10 shadow-sm focus:border-brand-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kreditinstitut</label>
                            <input
                                type="text"
                                placeholder="Musterbank AG"
                                value={companyData.bank_name || ''}
                                onChange={(e) => handleInputMetaChange('bank_name', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 text-sm outline-none h-10 shadow-sm focus:border-brand-500"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        {(!companyData.payment_method_type || companyData.payment_method_type === 'bank') && (
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IBAN</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="DE00 0000 0000 0000 0000 00"
                                        value={companyData.bank_iban || ''}
                                        onChange={(e) => handleInputMetaChange('bank_iban', e.target.value)}
                                        onBlur={handleIbanBlur}
                                        className={clsx("w-full px-3 py-2 bg-white border text-sm outline-none h-10 shadow-sm tracking-tight", errors.bank_iban ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-brand-500")}
                                    />
                                    {isValidatingIban && <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>}
                                </div>
                                {errors.bank_iban && <span className="text-[10px] text-red-500 font-bold">{errors.bank_iban}</span>}
                            </div>
                        )}

                        {companyData.payment_method_type === 'card' && (
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kreditkarten-Anbieter</label>
                                <select
                                    value={companyData.credit_card_provider || ''}
                                    onChange={(e) => handleInputMetaChange('credit_card_provider', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 text-sm outline-none h-10 shadow-sm cursor-pointer"
                                >
                                    <option value="">Wählen...</option>
                                    <option value="visa">Visa</option>
                                    <option value="mastercard">Mastercard</option>
                                    <option value="amex">American Express</option>
                                </select>
                            </div>
                        )}

                        {companyData.payment_method_type === 'paypal' && (
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PayPal Email</label>
                                <input
                                    type="email"
                                    placeholder="your-paypal@email.com"
                                    value={companyData.paypal_email || ''}
                                    onChange={(e) => handleInputMetaChange('paypal_email', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 text-sm outline-none h-10 shadow-sm focus:border-brand-500"
                                />
                            </div>
                        )}

                        {companyData.payment_method_type === 'stripe' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stripe Publishable Key</label>
                                    <input
                                        type="text"
                                        placeholder="pk_test_..."
                                        value={companyData.stripe_api_key || ''}
                                        onChange={(e) => handleInputMetaChange('stripe_api_key', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 text-sm outline-none h-10 shadow-sm focus:border-brand-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stripe Secret Key</label>
                                    <input
                                        type="password"
                                        placeholder="sk_test_..."
                                        value={companyData.stripe_secret || ''}
                                        onChange={(e) => handleInputMetaChange('stripe_secret', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 text-sm outline-none h-10 shadow-sm focus:border-brand-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
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
            <div className="bg-white shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-3">
                        {masterTab === 'languages' ? <FaLanguage /> : masterTab === 'doc_types' ? <FaFileAlt /> : masterTab === 'services' ? <FaGlobe /> : <FaEnvelopeOpenText />}
                        {masterTab === 'languages' ? 'Sprachkonfiguration' : masterTab === 'doc_types' ? 'Dokumenten-Kategorien' : masterTab === 'services' ? 'Leistungskatalog' : 'Email Textvorlagen'}
                    </h3>
                </div>
                <div className="flex-1 min-h-[400px]">
                    {masterTab === 'languages' && (isLanguagesLoading ? <TableSkeleton rows={5} columns={5} /> : <DataTable isLoading={isLanguagesLoading} data={languages} columns={[
                        { id: 'code', header: 'Code (ISO)', accessor: (l: any) => <span className=" text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 border border-slate-100 uppercase tracking-tight rounded">{l.iso_code}</span>, className: 'w-32' },
                        { id: 'name', header: 'Sprache / Flagge', accessor: (l: any) => <div className="flex items-center gap-3"><div className="w-8 h-6 overflow-hidden shadow-sm border border-slate-200 bg-slate-50 rounded-sm">{l.flag_icon && <img src={getFlagUrl(l.flag_icon)} className="w-full h-full object-cover" />}</div><span className="font-bold text-slate-800 text-sm">{l.name_internal}</span></div> },
                        { id: 'native', header: 'Native', accessor: 'name_native' },
                        { id: 'status', header: 'Status', accessor: (l: any) => <span className={clsx("px-2 py-0.5 text-[10px] font-bold uppercase border tracking-tight rounded-[4px]", l.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{l.status}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (l: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(l)} className="p-2 text-slate-400 hover:text-brand-600 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(l)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={10} />)}
                    {masterTab === 'doc_types' && (isDocTypesLoading ? <TableSkeleton rows={5} columns={3} /> : <DataTable isLoading={isDocTypesLoading} data={docTypes} columns={[
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
        </div>
    );
};

export default Settings;
