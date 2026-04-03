import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FaTimes, FaPlus, FaTrash, FaExclamationTriangle,
    FaExternalLinkAlt, FaInfoCircle, FaArrowLeft, FaSave
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { IMaskInput } from 'react-imask';

import { customerService, settingsService } from '../api/services';
import { useWorkspaceTabs } from '../context/WorkspaceTabsContext';
import { Button } from '../components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../components/ui/tooltip';
import Input from '../components/common/Input';
import SearchableSelect from '../components/common/SearchableSelect';
import AddressForm from '../components/common/AddressForm';
import PhoneInput from '../components/common/PhoneInput';

/* ─── Design Tokens (following NewProject approach) ─── */
const LABEL_CLASS = 'text-[13px] font-medium text-slate-500 flex items-center gap-1.5 min-w-[160px] shrink-0';
const INPUT_WRAP = 'flex-1 min-w-0';
const ROW_CLASS = 'flex items-start gap-4 py-3 border-b border-slate-50';
const SECTION_HEADER = 'flex items-center gap-3 pb-3 mb-1 border-b border-slate-200';
const SECTION_NUM = 'w-7 h-7 rounded-md bg-brand-primary text-white flex items-center justify-center text-xs font-bold shadow-sm';
const SECTION_TITLE = 'text-sm font-semibold text-slate-800 tracking-tight';

/* ─── Tooltip Helper ─── */
const FieldTip = ({ text }: { text: string }) => (
    <TooltipProvider delayDuration={200}>
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="text-slate-300 hover:text-slate-500 transition cursor-help">
                    <FaInfoCircle className="text-[11px]" />
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs z-[200]">
                {text}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

/* ─── Form Row ─── */
const FormRow = ({ label, required, tooltip, children, error, id }: {
    label: string; required?: boolean; tooltip?: string;
    children: React.ReactNode; error?: boolean; id?: string;
}) => (
    <div className={clsx(ROW_CLASS, error && 'bg-red-50/40')} id={id}>
        <div className={LABEL_CLASS}>
            <span>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</span>
            {tooltip && <FieldTip text={tooltip} />}
        </div>
        <div className={INPUT_WRAP}>{children}</div>
    </div>
);

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

interface CustomerFormData {
    id?: number;
    type: 'private' | 'company' | 'authority';
    salutation: string;
    first_name: string;
    last_name: string;
    company_name: string;
    legal_form: string;
    address_street: string;
    address_house_no: string;
    address_zip: string;
    address_city: string;
    address_country: string;
    email: string;
    phone: string;
    notes: string;
    additional_emails: string[];
    additional_phones: string[];
    payment_terms_days: number | '';
    iban: string;
    bic: string;
    bank_name: string;
    bank_code: string;
    bank_account_holder: string;
    tax_id: string;
    vat_id: string;
    leitweg_id: string;
    status: string;
}

const EMPTY_CUSTOMER: CustomerFormData = {
    type: 'private',
    salutation: 'Herr',
    first_name: '',
    last_name: '',
    company_name: '',
    legal_form: '',
    address_street: '',
    address_house_no: '',
    address_zip: '',
    address_city: '',
    address_country: 'Deutschland',
    email: '',
    phone: '',
    notes: '',
    additional_emails: [],
    additional_phones: [],
    payment_terms_days: 14,
    iban: '',
    bic: '',
    bank_name: '',
    bank_code: '',
    bank_account_holder: '',
    tax_id: '',
    vat_id: '',
    leitweg_id: '',
    status: 'Aktiv'
};

const NewCustomer = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;
    const queryClient = useQueryClient();
    const { updateTab, activeTabId, closeTab } = useWorkspaceTabs();

    const [formData, setFormData] = useState<CustomerFormData>({ ...EMPTY_CUSTOMER });
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
    const [duplicates, setDuplicates] = useState<any[]>([]);
    const [ignoreDuplicates, setIgnoreDuplicates] = useState(false);
    const [isValidatingIban, setIsValidatingIban] = useState(false);

    // ── API Data ──
    const { data: initialData, isLoading: isDetailLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: () => customerService.getById(parseInt(id!)),
        enabled: isEditing,
    });

    const { data: companyData } = useQuery({
        queryKey: ['companySettings'],
        queryFn: settingsService.getCompany
    });

    const displayNr = useMemo(() => {
        const prefix = companyData?.customer_id_prefix || 'K';
        if (isEditing && initialData?.id) {
            return `${prefix}${initialData.id.toString().padStart(4, '0')}`;
        }
        if (isEditing && initialData?.display_id) return initialData.display_id;
        return `${prefix}xxxx`;
    }, [isEditing, initialData, companyData]);

    // Update Tab Info
    useEffect(() => {
        const tabId = isEditing ? `customer_edit_${id}` : 'customer_new';
        const prefix = isEditing ? 'Bearbeiten: ' : 'Neu: ';
        const label = isEditing ? (initialData?.company_name || `${initialData?.first_name} ${initialData?.last_name}` || '...') : 'Neuer Kunde';
        updateTab(tabId, { label: `${prefix}${label}` });
    }, [isEditing, id, initialData, updateTab]);

    // Load initial data
    useEffect(() => {
        if (initialData) {
            setFormData({
                ...EMPTY_CUSTOMER,
                ...initialData,
                additional_emails: initialData.additional_emails || [],
                additional_phones: initialData.additional_phones || [],
                type: ((initialData.type as any) === 'Firma' || initialData.type === 'company') ? 'company' :
                    ((initialData.type as any) === 'Privat' || initialData.type === 'private') ? 'private' : 'authority',
            });
        }
    }, [initialData]);

    // Duplication Check
    useEffect(() => {
        const check = async () => {
            if (!formData.last_name && !formData.company_name) {
                setDuplicates([]);
                return;
            }
            if ((formData.last_name?.length || 0) < 3 && (formData.company_name?.length || 0) < 3 && !formData.email && !formData.phone) {
                setDuplicates([]);
                return;
            }

            try {
                const results = await customerService.checkDuplicates({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone,
                    company_name: formData.company_name
                });
                const filtered = (results || []).filter((d: any) => d.id.toString() !== id);
                setDuplicates(filtered);
            } catch (error) {
                console.error('Deduplication check failed', error);
            }
        };

        const timer = setTimeout(check, 600);
        return () => clearTimeout(timer);
    }, [formData.first_name, formData.last_name, formData.email, formData.phone, formData.company_name, id]);

    // ── Changes ──
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (validationErrors.has(name)) {
            const next = new Set(validationErrors);
            next.delete(name);
            setValidationErrors(next);
        }
    };

    const handleTypeChange = (newType: 'private' | 'company' | 'authority') => {
        setFormData(prev => ({
            ...prev,
            type: newType,
            company_name: newType === 'private' ? '' : prev.company_name,
            legal_form: newType === 'company' ? prev.legal_form : '',
            leitweg_id: newType === 'authority' ? prev.leitweg_id : ''
        }));
    };

    const handleIbanBlur = async () => {
        const cleanIban = (formData.iban || '').replace(/\s/g, '');
        if (!cleanIban || cleanIban.length < 15) return;
        setIsValidatingIban(true);
        try {
            const response = await fetch(`https://openiban.com/validate/${cleanIban}?getBIC=true&validateBankCode=true`);
            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    setFormData(prev => ({
                        ...prev,
                        bic: data.bankData?.bic || prev.bic,
                        bank_name: data.bankData?.name || prev.bank_name,
                        bank_code: data.bankData?.bankCode || prev.bank_code,
                    }));
                    toast.success(`Bank erkannt: ${data.bankData?.name || 'IBAN valide'}`);
                }
            }
        } catch (error) {
            console.warn('IBAN Validation API unavailable');
        } finally {
            setIsValidatingIban(false);
        }
    };

    // ── Mutations ──
    const createMutation = useMutation({
        mutationFn: customerService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('Kunde erfolgreich angelegt');
            navigate('/customers');
        },
        onError: () => toast.error('Fehler beim Anlegen')
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => customerService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('Kunde aktualisiert');
            navigate('/customers');
        },
        onError: () => toast.error('Fehler beim Aktualisieren')
    });

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const errList: string[] = [];
        const nextValidationErrors = new Set<string>();

        if (!formData.first_name) { errList.push('Vorname ist erforderlich'); nextValidationErrors.add('first_name'); }
        if (!formData.last_name) { errList.push('Nachname ist erforderlich'); nextValidationErrors.add('last_name'); }
        if (formData.type !== 'private' && !formData.company_name) { errList.push('Firmenname/Behörde ist erforderlich'); nextValidationErrors.add('company_name'); }
        if (!formData.address_street) { errList.push('Straße ist erforderlich'); nextValidationErrors.add('address_street'); }
        if (!formData.address_zip) { errList.push('PLZ ist erforderlich'); nextValidationErrors.add('address_zip'); }
        if (!formData.address_city) { errList.push('Stadt ist erforderlich'); nextValidationErrors.add('address_city'); }

        setValidationErrors(nextValidationErrors);

        if (errList.length > 0) {
            toast.error(
                <div className="flex flex-col gap-1">
                    <span className="font-medium">Bitte korrigieren Sie folgende Fehler:</span>
                    <ul className="list-disc list-inside text-xs">{errList.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
            );
            return;
        }

        if (duplicates.length > 0 && !ignoreDuplicates) {
            toast.error('Bitte prüfen Sie die Dubletten oder bestätigen Sie die Neuanlage explizit.');
            return;
        }

        if (isEditing) {
            updateMutation.mutate({ ...formData, id: parseInt(id!) });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleCancel = () => {
        if (activeTabId) closeTab(activeTabId);
        else navigate('/customers');
    };

    if (isEditing && isDetailLoading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-brand-primary rounded-full" />
        </div>
    );

    return (
        <div className="fade-in pb-12">
            {/* ── Sticky Header ── */}
            <div className="bg-white border-b border-slate-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 shadow-sm">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button onClick={handleCancel} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition">
                            <FaArrowLeft />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-800 tracking-tight flex items-center gap-3">
                                {isEditing ? 'Kunde bearbeiten' : 'Neuen Kunden anlegen'}
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                    {displayNr}
                                </span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={handleCancel} className="h-9 text-xs font-semibold">
                            <FaTimes className="mr-1.5" /> Abbrechen
                        </Button>
                        <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="h-9 text-xs font-bold">
                            <FaSave className="mr-1.5" /> {isEditing ? 'Speichern' : 'Anlegen'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                {/* Duplication Warning */}
                {duplicates.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm mb-6 flex gap-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                        <FaExclamationTriangle className="text-amber-500 shrink-0 mt-1" size={18} />
                        <div className="flex-1">
                            <p className="text-amber-800 text-xs font-medium italic">
                                Es wurden bereits Kunden mit ähnlichen Daten gefunden. Falls es sich um eine andere Person handelt, bestätigen Sie dies unten.
                            </p>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {duplicates.map((d: any) => (
                                    <div key={d.id} className="flex items-center justify-between bg-white p-2 rounded-sm border border-amber-100 shadow-sm transition-all hover:border-amber-300">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                                                {d.company_name || `${d.first_name} ${d.last_name}`}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                ID: {d.id} • {d.email || 'Keine E-Mail'}
                                            </span>
                                        </div>
                                        <Link to={`/customers/${d.id}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-600 rounded-sm text-[10px] font-bold hover:bg-amber-600 hover:text-white transition-all shadow-sm">
                                            <FaExternalLinkAlt size={10} /> ÖFFNEN
                                        </Link>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-amber-200 flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={ignoreDuplicates} onChange={(e) => setIgnoreDuplicates(e.target.checked)} />
                                    <div className="w-9 h-5 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                                    <span className="ms-3 text-[11px] font-bold text-amber-900 uppercase tracking-wide">Trotzdem als neuen Datensatz anlegen</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Section 1: Basis-Daten */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>01</div>
                            <h3 className={SECTION_TITLE}>Basis-Daten</h3>
                        </div>
                        <div className="px-6 pb-5 space-y-1">
                            <FormRow label="Kunden-Typ" tooltip="Wählen Sie die Rechtsform des Kunden für korrekte Rechnungsstellung">
                                <div className="flex bg-slate-50 p-1 rounded-md border border-slate-200 w-fit">
                                    {(['private', 'company', 'authority'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleTypeChange(type)}
                                            className={clsx(
                                                'px-4 py-1.5 rounded-sm text-xs font-medium transition-all',
                                                formData.type === type ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                                            )}
                                        >
                                            {type === 'private' ? 'Privat' : type === 'company' ? 'Firma' : 'Behörde'}
                                        </button>
                                    ))}
                                </div>
                            </FormRow>

                            {formData.type !== 'private' && (
                                <FormRow
                                    label={formData.type === 'authority' ? 'Behörde / Institution' : 'Firmenname'}
                                    required
                                    tooltip={formData.type === 'authority' ? 'Name der Behörde oder öffentlichen Institution' : 'Vollständiger Firmenname für Rechnungen'}
                                    error={validationErrors.has('company_name')}
                                >
                                    <Input
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        placeholder={formData.type === 'authority' ? 'z.B. Standesamt Kassel' : 'z.B. Muster GmbH'}
                                        error={validationErrors.has('company_name')}
                                    />
                                </FormRow>
                            )}

                            {formData.type === 'company' && (
                                <FormRow label="Rechtsform" tooltip="Erforderlich für korrekte Geschäftsunterlagen">
                                    <SearchableSelect
                                        options={legalFormOptions}
                                        value={formData.legal_form}
                                        onChange={(val) => setFormData(prev => ({ ...prev, legal_form: val }))}
                                        placeholder="Rechtsform wählen..."
                                    />
                                </FormRow>
                            )}

                            {formData.type === 'authority' && (
                                <FormRow label="Leitweg-ID" tooltip="Erforderlich für XRechnung / ZUGFeRD">
                                    <Input
                                        name="leitweg_id"
                                        value={formData.leitweg_id}
                                        onChange={handleChange}
                                        placeholder="z.B. 1234-5678-90"
                                    />
                                </FormRow>
                            )}

                            <FormRow label="Ansprechpartner" required tooltip="Förmliche Anrede und Name des Hauptansprechpartners">
                                <div className="grid grid-cols-12 gap-3">
                                    <div className="col-span-3">
                                        <Input
                                            isSelect
                                            name="salutation"
                                            value={formData.salutation}
                                            onChange={handleChange}
                                        >
                                            <option value="Herr">Herr</option>
                                            <option value="Frau">Frau</option>
                                            <option value="Divers">Divers</option>
                                        </Input>
                                    </div>
                                    <div className="col-span-4">
                                        <Input
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            placeholder="Vorname"
                                            error={validationErrors.has('first_name')}
                                        />
                                    </div>
                                    <div className="col-span-5">
                                        <Input
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            placeholder="Nachname"
                                            error={validationErrors.has('last_name')}
                                        />
                                    </div>
                                </div>
                            </FormRow>
                        </div>
                    </section>

                    {/* Section 2: Kontakt */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>02</div>
                            <h3 className={SECTION_TITLE}>Kontaktdaten</h3>
                        </div>
                        <div className="px-6 pb-5 space-y-1">
                            <FormRow label="E-Mail (Primär)" tooltip="Hauptadresse für Rechnungsversand and Kommunikation">
                                <Input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="max.mustermann@beispiel.de"
                                />
                            </FormRow>
                            <FormRow label="Telefon" tooltip="Hauptnummer inkl. Ländervorwahl">
                                <PhoneInput
                                    value={formData.phone}
                                    onChange={(val: string) => setFormData(prev => ({ ...prev, phone: val }))}
                                />
                            </FormRow>

                            {/* Additional fields */}
                            <FormRow label="Weitere Kontakte" tooltip="Zusätzliche E-Mail Adressen oder Telefonnummern">
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        {formData.additional_emails.map((email, i) => (
                                            <div key={i} className="flex gap-2 group">
                                                <Input
                                                    containerClassName="flex-1"
                                                    value={email}
                                                    onChange={(e) => {
                                                        const next = [...formData.additional_emails];
                                                        next[i] = e.target.value;
                                                        setFormData(prev => ({ ...prev, additional_emails: next }));
                                                    }}
                                                    type="email"
                                                    placeholder="Alternative E-Mail"
                                                />
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, additional_emails: prev.additional_emails.filter((_, idx) => idx !== i) }))}
                                                    className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-md transition"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.additional_emails.length < 3 && (
                                            <button
                                                onClick={() => setFormData(prev => ({ ...prev, additional_emails: [...prev.additional_emails, ''] }))}
                                                className="text-2xs font-bold text-brand-primary flex items-center gap-1.5 hover:opacity-80 transition ml-1"
                                            >
                                                <FaPlus size={10} /> E-MAIL HINZUFÜGEN
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {formData.additional_phones.map((phone, i) => (
                                            <div key={i} className="flex gap-2 group">
                                                <div className="flex-1">
                                                    <PhoneInput
                                                        value={phone}
                                                        onChange={(val) => {
                                                            const next = [...formData.additional_phones];
                                                            next[i] = val;
                                                            setFormData(prev => ({ ...prev, additional_phones: next }));
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, additional_phones: prev.additional_phones.filter((_, idx) => idx !== i) }))}
                                                    className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-md transition"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.additional_phones.length < 3 && (
                                            <button
                                                onClick={() => setFormData(prev => ({ ...prev, additional_phones: [...prev.additional_phones, ''] }))}
                                                className="text-2xs font-bold text-brand-primary flex items-center gap-1.5 hover:opacity-80 transition ml-1"
                                            >
                                                <FaPlus size={10} /> NUMMER HINZUFÜGEN
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </FormRow>
                        </div>
                    </section>

                    {/* Section 3: Adresse */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>03</div>
                            <h3 className={SECTION_TITLE}>Anschrift</h3>
                        </div>
                        <div className="px-6 pb-5">
                            <AddressForm
                                street={formData.address_street || ''}
                                houseNo={formData.address_house_no || ''}
                                zip={formData.address_zip || ''}
                                city={formData.address_city || ''}
                                country={formData.address_country || 'Deutschland'}
                                onChange={(field, value) => {
                                    const fieldMap: Record<string, keyof CustomerFormData> = {
                                        street: 'address_street',
                                        houseNo: 'address_house_no',
                                        zip: 'address_zip',
                                        city: 'address_city',
                                        country: 'address_country'
                                    };
                                    setFormData(prev => ({ ...prev, [fieldMap[field]]: value }));
                                }}
                                errors={{
                                    address_street: validationErrors.has('address_street') ? 'Required' : '',
                                    address_zip: validationErrors.has('address_zip') ? 'Required' : '',
                                    address_city: validationErrors.has('address_city') ? 'Required' : '',
                                }}
                            />
                        </div>
                    </section>

                    {/* Section 4: Buchhaltung */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>04</div>
                            <h3 className={SECTION_TITLE}>Buchhaltung & Steuern</h3>
                        </div>
                        <div className="px-6 pb-5 space-y-1">
                            <FormRow label="Zahlungsziel (Tage)" tooltip="Standardfrist nach Rechnungsdatum">
                                <Input
                                    name="payment_terms_days"
                                    type="number"
                                    value={formData.payment_terms_days}
                                    onChange={handleChange}
                                    placeholder="14"
                                />
                            </FormRow>
                            {formData.type !== 'private' && (
                                <>
                                    <FormRow label="USt-IdNr." tooltip="Beispiel: DE123456789">
                                        <Input
                                            name="vat_id"
                                            value={formData.vat_id}
                                            onChange={handleChange}
                                            placeholder="DE123456789"
                                        />
                                    </FormRow>
                                    <FormRow label="Steuernummer" tooltip="Interne Steuernummer des Kunden">
                                        <Input
                                            name="tax_id"
                                            value={formData.tax_id}
                                            onChange={handleChange}
                                            placeholder="026 333 44444"
                                        />
                                    </FormRow>
                                </>
                            )}
                            <FormRow label="Status" tooltip="Hauptstatus des Kundenaccounts">
                                <div className="flex bg-slate-50 p-1 rounded-md border border-slate-200 w-fit">
                                    {(['Aktiv', 'Inaktiv', 'Archiviert'] as const).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setFormData(prev => ({ ...prev, status }))}
                                            className={clsx(
                                                'px-4 py-1.5 rounded-sm text-xs font-medium transition-all',
                                                formData.status === status ?
                                                    (status === 'Aktiv' ? 'bg-emerald-500 text-white shadow-sm' :
                                                        status === 'Inaktiv' ? 'bg-red-500 text-white shadow-sm' :
                                                            'bg-slate-500 text-white shadow-sm') :
                                                    'text-slate-500 hover:text-slate-700'
                                            )}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </FormRow>
                        </div>
                    </section>

                    {/* Section 5: Bank */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>05</div>
                            <h3 className={SECTION_TITLE}>Bankverbindung</h3>
                        </div>
                        <div className="px-6 pb-5 space-y-1">
                            <FormRow label="Kontoinhaber" tooltip="Name des Kontoinhabers">
                                <Input
                                    name="bank_account_holder"
                                    value={formData.bank_account_holder}
                                    onChange={handleChange}
                                    placeholder="Name des Inhabers"
                                />
                            </FormRow>
                            <FormRow label="IBAN" tooltip="Wird automatisch auf Validität geprüft">
                                <div className="relative">
                                    <IMaskInput
                                        mask="aa00 0000 0000 0000 0000 00"
                                        definitions={{ 'a': /[a-zA-Z]/ }}
                                        placeholder="DE00 0000 0000 0000 0000 00"
                                        value={formData.iban || ''}
                                        onAccept={(value) => setFormData(prev => ({ ...prev, iban: value.toUpperCase() }))}
                                        onBlur={handleIbanBlur}
                                        className={clsx(
                                            'flex h-9 w-full rounded-sm bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-all border outline-none border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary'
                                        )}
                                    />
                                    {isValidatingIban && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-3 h-3 border-2 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </FormRow>
                            <div className="grid grid-cols-2 gap-4">
                                <FormRow label="BIC" tooltip="BIC/SWIFT Code">
                                    <Input
                                        name="bic"
                                        value={formData.bic}
                                        onChange={handleChange}
                                        placeholder="BIC Code"
                                    />
                                </FormRow>
                                <FormRow label="Bankname" tooltip="Name des Kreditinstituts">
                                    <Input
                                        name="bank_name"
                                        value={formData.bank_name}
                                        onChange={handleChange}
                                        placeholder="Name der Bank"
                                    />
                                </FormRow>
                            </div>
                        </div>
                    </section>

                    {/* Section 6: Notizen */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>06</div>
                            <h3 className={SECTION_TITLE}>Interne Notizen</h3>
                        </div>
                        <div className="px-6 pb-6 pt-2">
                            <textarea
                                name="notes"
                                value={formData.notes || ''}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-3 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary/10 transition-all resize-none"
                                placeholder="Wichtige Informationen zu diesem Kunden (z.B. Sonderkonditionen, Präferenzen)..."
                            />
                        </div>
                    </section>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-8 flex justify-center gap-3">
                <Button variant="secondary" onClick={handleCancel} className="h-10 px-8">
                    Abbrechen
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="h-10 px-12 font-bold shadow-md shadow-brand-primary/20">
                    {isEditing ? 'Kunde aktualisieren' : 'Kunde anlegen'}
                </Button>
            </div>
        </div>
    );
};

export default NewCustomer;
