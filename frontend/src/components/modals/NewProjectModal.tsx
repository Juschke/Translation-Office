import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FaTimes, FaPlus, FaMinus, FaTrash,
    FaInfoCircle,
    FaCalendarAlt, FaFlag, FaClock, FaBolt,
    FaSearch, FaCheck
} from 'react-icons/fa';
import SearchableSelect from '../common/SearchableSelect';
import LanguageSelect from '../common/LanguageSelect';
import Input from '../common/Input';
import PartnerSelectionModal from './PartnerSelectionModal';
import NewCustomerModal from './NewCustomerModal';
import NewPartnerModal from './NewPartnerModal';
import ConfirmDialog from '../common/ConfirmDialog';
import DatePicker, { registerLocale } from "react-datepicker";
import { de } from 'date-fns/locale/de';
import clsx from 'clsx';
import { customerService, partnerService, settingsService, projectService } from '../../api/services';
import PaymentModal from './PaymentModal';
import NewDocTypeModal from './NewDocTypeModal';
import NewMasterDataModal from './NewMasterDataModal';

import "react-datepicker/dist/react-datepicker.css";

registerLocale('de', de);

interface ProjectPosition {
    id: string;
    description: string;
    amount: string;
    unit: string;
    quantity: string;
    partnerRate: string;
    partnerMode: string;
    partnerTotal: string;
    customerRate: string;
    customerTotal: string;
    customerMode: string;
    marginType: string;
    marginPercent: string;
}

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    isLoading?: boolean;
}

const statusOptions = [
    { value: 'offer', label: 'Neu' },
    { value: 'in_progress', label: 'Bearbeitung' },
    { value: 'delivered', label: 'Geliefert' },
    { value: 'invoiced', label: 'Rechnung' },
    { value: 'ready_for_pickup', label: 'Abholbereit' },
    { value: 'completed', label: 'Abgeschlossen' }
];

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
    const queryClient = useQueryClient();

    // Basic States
    const [name, setName] = useState('');
    const [customer, setCustomer] = useState('');
    const [deadline, setDeadline] = useState('');
    const [source, setSource] = useState('de-DE');
    const [target, setTarget] = useState('de-DE');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
    const [status, setStatus] = useState('offer');
    const [withTax, setWithTax] = useState(true);

    // Project Options & Extra Costs
    const [isCertified, setIsCertified] = useState(true);
    const [hasApostille, setHasApostille] = useState(false);
    const [isExpress, setIsExpress] = useState(false);
    const [classification, setClassification] = useState('nein');
    const [copies, setCopies] = useState(0);
    const [copyPrice, setCopyPrice] = useState('5.00');

    // Unified Position State
    const [positions, setPositions] = useState<ProjectPosition[]>([
        {
            id: Date.now().toString(),
            description: 'Übersetzung',
            amount: '1.00',
            unit: 'Normzeile',
            quantity: '1',
            partnerRate: '0.00',
            partnerMode: 'flat',
            partnerTotal: '0.00',
            customerRate: '0.00',
            customerTotal: '0.00',
            customerMode: 'flat',
            marginType: 'markup',
            marginPercent: '0'
        }
    ]);

    const [docType, setDocType] = useState<string[]>([]);
    const [translator, setTranslator] = useState<string>('');
    const [totalPrice, setTotalPrice] = useState('');
    const [partnerPrice, setPartnerPrice] = useState('');
    const [payments, setPayments] = useState<any[]>([]);
    const [notes, setNotes] = useState('');

    // UI States
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [showDocTypeModal, setShowDocTypeModal] = useState(false);
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
    const [langTrigger, setLangTrigger] = useState<'source' | 'target' | null>(null);
    const [editingPayment, setEditingPayment] = useState<any>(null);

    // API Data
    const { data: customersData = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getAll,
        enabled: isOpen
    });

    const { data: partnersData = [] } = useQuery({
        queryKey: ['partners'],
        queryFn: partnerService.getAll,
        enabled: isOpen
    });

    const { data: languages = [] } = useQuery({
        queryKey: ['settings', 'languages'],
        queryFn: settingsService.getLanguages,
        enabled: isOpen
    });

    const { data: docTypes = [] } = useQuery({
        queryKey: ['settings', 'docTypes'],
        queryFn: settingsService.getDocTypes,
        enabled: isOpen
    });

    const { data: projectsData = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getAll,
        enabled: isOpen && !initialData
    });

    const custOptions = useMemo(() => {
        return Array.isArray(customersData) ? customersData.map((c: any) => ({
            value: c.id.toString(),
            label: c.company_name || `${c.first_name} ${c.last_name}`
        })) : [];
    }, [customersData]);

    const partnerOptions = useMemo(() => {
        return Array.isArray(partnersData) ? partnersData.map((p: any) => ({
            value: p.id.toString(),
            label: p.company_name || `${p.first_name} ${p.last_name}`
        })) : [];
    }, [partnersData]);

    const [partnerSearch, setPartnerSearch] = useState('');
    const datePickerRef = useRef<any>(null);

    const { matchingPartners, otherPartners } = useMemo(() => {
        if (!Array.isArray(partnersData)) return { matchingPartners: [], otherPartners: [] };

        const src = source?.toLowerCase().split('-')[0];
        const trg = target?.toLowerCase().split('-')[0];

        const filtered = partnersData.filter((p: any) => {
            const searchStr = partnerSearch.toLowerCase();
            return (p.first_name || '').toLowerCase().includes(searchStr) ||
                (p.last_name || '').toLowerCase().includes(searchStr) ||
                (p.company_name || '').toLowerCase().includes(searchStr);
        });

        const matches: any[] = [];
        const others: any[] = [];

        filtered.forEach(p => {
            const rawLangs = p.languages || [];
            const langs = Array.isArray(rawLangs) ? rawLangs :
                (typeof rawLangs === 'string' ? rawLangs.split(',').map((l: string) => l.trim().toLowerCase()) : []);

            const matchSrc = src && langs.some((l: string) => l.toLowerCase().includes(src));
            const matchTrg = trg && langs.some((l: string) => l.toLowerCase().includes(trg));

            // It's a match if either language is supported
            const isMatch = matchSrc || matchTrg;
            const isPerfectMatch = matchSrc && matchTrg;

            if (isMatch) matches.push({ ...p, isMatch: true, isPerfectMatch, languages: Array.isArray(rawLangs) ? rawLangs : langs });
            else others.push({ ...p, isMatch: false, languages: Array.isArray(rawLangs) ? rawLangs : langs });
        });

        const sortFn = (a: any, b: any) => {
            // Within a group, perfect matches go first
            if (a.isPerfectMatch && !b.isPerfectMatch) return -1;
            if (!a.isPerfectMatch && b.isPerfectMatch) return 1;

            const nameA = (a.company_name || `${a.first_name} ${a.last_name}`).toLowerCase();
            const nameB = (b.company_name || `${b.first_name} ${b.last_name}`).toLowerCase();
            return nameA.localeCompare(nameB);
        };

        return {
            matchingPartners: matches.sort(sortFn),
            otherPartners: others.sort(sortFn)
        };
    }, [partnersData, source, target, partnerSearch]);

    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'info' | 'warning' | 'success' | 'danger';
        confirmLabel?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

    const resetForm = () => {
        setName('');
        setCustomer('');
        setDeadline('');
        setSource('');
        setTarget('de-DE');
        setPriority('low');
        setStatus('offer');
        setIsCertified(true);
        setHasApostille(false);
        setIsExpress(false);
        setClassification('nein');
        setCopies(0);
        setCopyPrice('5.00');
        setDocType([]);
        setTranslator('');
        setPositions([{
            id: Date.now().toString(),
            description: 'Übersetzung',
            amount: '1.00',
            unit: 'Normzeile',
            quantity: '1.00',
            partnerRate: '0.00',
            partnerMode: 'flat',
            partnerTotal: '0.00',
            customerRate: '0.00',
            customerMode: 'flat',
            customerTotal: '0.00',
            marginType: 'markup',
            marginPercent: '0.00'
        }]);
        setTotalPrice('');
        setPartnerPrice('');
        setPayments([]);
        setNotes('');
    };

    // Mutations
    const createCustomerMutation = useMutation({
        mutationFn: customerService.create,
        onSuccess: (newCust) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setCustomer(newCust.id.toString());
            setShowCustomerModal(false);
        }
    });

    const createPartnerMutation = useMutation({
        mutationFn: partnerService.create,
        onSuccess: (newPartner) => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            setTranslator(newPartner.id.toString());
            setShowPartnerModal(false);
        }
    });

    const createDocTypeMutation = useMutation({
        mutationFn: settingsService.createDocType,
        onSuccess: (newDocType) => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'docTypes'] });
            setDocType([newDocType.id.toString()]);
            setShowDocTypeModal(false);
        }
    });

    const createLanguageMutation = useMutation({
        mutationFn: settingsService.createLanguage,
        onSuccess: (newLang) => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'languages'] });
            const code = newLang.iso_code?.split('-')[0] || newLang.iso_code;
            if (langTrigger === 'source') setSource(code);
            else if (langTrigger === 'target') setTarget(code);
            setIsLanguageModalOpen(false);
            setLangTrigger(null);
        }
    });

    const creationDate = initialData?.createdAt || new Date().toLocaleDateString('de-DE');
    const projectManager = initialData?.pm || 'Admin';

    useEffect(() => {
        const updatedPositions = positions.map(pos => {
            const amount = parseFloat(pos.amount) || 0;
            const qty = parseFloat(pos.quantity) || 0;
            const totalUnits = amount * qty;

            let pRate = parseFloat(pos.partnerRate) || 0;
            let pTotal = pos.partnerMode === 'unit' ? totalUnits * pRate : pRate;

            let cTotal = 0;
            let cRate = 0;

            if (pos.customerMode === 'unit') {
                const margin = (parseFloat(pos.marginPercent) || 0) / 100;
                cTotal = pTotal * (pos.marginType === 'markup' ? (1 + margin) : (1 - margin));
                if (totalUnits > 0) cRate = cTotal / totalUnits;
            } else if (pos.customerMode === 'rate') {
                cRate = parseFloat(pos.customerRate) || 0;
                cTotal = totalUnits * cRate;
            } else if (pos.customerMode === 'flat') {
                cTotal = parseFloat(pos.customerRate) || 0;
            } else {
                cTotal = parseFloat(pos.customerRate) || 0;
            }

            return {
                ...pos,
                partnerTotal: pTotal.toFixed(2),
                customerTotal: cTotal.toFixed(2),
                customerRate: pos.customerMode === 'unit' ? cRate.toFixed(2) : pos.customerRate
            };
        });

        const isContentChanged = JSON.stringify(updatedPositions) !== JSON.stringify(positions);
        if (isContentChanged) {
            setPositions(updatedPositions);
        }

        const totalP = updatedPositions.reduce((sum, p) => sum + parseFloat(p.partnerTotal || '0'), 0);
        const totalC = updatedPositions.reduce((sum, p) => sum + parseFloat(p.customerTotal || '0'), 0);
        setPartnerPrice(totalP.toFixed(2));
        setTotalPrice(totalC.toFixed(2));
    }, [positions]);

    // Auto-generate project name when source/target language changes
    useEffect(() => {
        if (!initialData && source && target && Array.isArray(projectsData)) {
            // Clean codes (remove flags/dashes if any)
            const cleanSource = source.split('-')[0].toLowerCase();
            const cleanTarget = target.split('-')[0].toLowerCase();

            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2); // Last 2 digits of year
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const datePart = yy + mm + dd;

            // Format: source-target-YYMMDD
            const basePrefix = `${cleanSource}-${cleanTarget}-${datePart}`.toUpperCase();

            const list = Array.isArray(projectsData) ? projectsData : ((projectsData as any).data || []);
            const todayProjectsCount = list.filter((p: any) => {
                const pName = (p.project_name || p.name || '').toUpperCase();
                return pName.startsWith(basePrefix);
            }).length;

            const sequence = String(todayProjectsCount + 1).padStart(2, '0');
            const generatedName = `${basePrefix}-${sequence}`;

            setName(generatedName);
        }
    }, [source, target, projectsData, initialData]);

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || initialData.project_name || '');
            setCustomer(initialData.customer_id?.toString() || initialData.client_id?.toString() || '');
            setDeadline(initialData.due || initialData.deadline || '');
            setSource(initialData.source || initialData.source_language?.iso_code?.split('-')[0] || 'de');
            setTarget(initialData.target || initialData.target_language?.iso_code?.split('-')[0] || 'en');
            setPriority(initialData.priority || 'medium');
            setStatus(initialData.status || 'draft');
            setIsCertified(initialData.isCertified || !!initialData.is_certified);
            setHasApostille(initialData.hasApostille || !!initialData.has_apostille);
            setIsExpress(initialData.isExpress || !!initialData.is_express);
            setClassification(initialData.classification === 'ja' || initialData.classification === true ? 'ja' : 'nein');
            setCopies(initialData.copies || initialData.copies_count || 0);
            setCopyPrice(String(initialData.copyPrice || initialData.copy_price || '5'));

            const initialDocTypes: string[] = [];
            if (initialData.document_type_id) initialDocTypes.push(initialData.document_type_id.toString());
            if (initialData.additional_doc_types && Array.isArray(initialData.additional_doc_types)) {
                initialDocTypes.push(...initialData.additional_doc_types.map((id: any) => id.toString()));
            }
            setDocType([...new Set(initialDocTypes)]);

            setTranslator(initialData.partner?.id?.toString() || initialData.translator?.id?.toString() || '');

            if (initialData.positions && Array.isArray(initialData.positions)) {
                setPositions(initialData.positions.map((p: any) => ({
                    ...p,
                    id: p.id.toString(),
                    unit: p.unit || 'Normzeile',
                    partnerRate: p.partner_rate || p.partnerRate || '0',
                    customerRate: p.customer_rate || p.customerRate || '0',
                    partnerMode: p.partner_mode || 'unit',
                    customerMode: p.customer_mode || 'unit'
                })));
            }

            if (initialData.payments && Array.isArray(initialData.payments) && initialData.payments.length > 0) {
                setPayments(initialData.payments.map((pmnt: any) => ({
                    ...pmnt,
                    id: pmnt.id?.toString() || Date.now().toString() + Math.random()
                })));
            } else if (initialData.down_payment && parseFloat(initialData.down_payment) > 0) {
                setPayments([{
                    id: Date.now().toString(),
                    amount: initialData.down_payment.toString(),
                    payment_date: initialData.down_payment_date || new Date().toISOString(),
                    payment_method: initialData.down_payment_method || 'Überweisung',
                    note: initialData.down_payment_note || 'Anzahlung'
                }]);
            } else {
                setPayments([]);
            }

            setNotes(initialData.notes || '');
            setShowCustomerModal(false);
        } else if (isOpen) {
            resetForm();
        }
    }, [isOpen, initialData]);


    if (!isOpen) return null;

    const handleApplyCustomer = (data: any) => {
        createCustomerMutation.mutate({
            company_name: data.company_name,
            salutation: data.salutation,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            address: data.address_street,
            zip: data.address_zip,
            city: data.address_city,
            type: data.type
        });
    };

    const handleApplyPartner = (data: any) => {
        const payload = {
            company_name: data.company || data.company_name,
            salutation: data.salutation,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.emails?.[0] || data.email,
            street: data.street,
            zip: data.zip,
            city: data.city,
            phone: data.phones?.[0] || data.phone,
            languages: data.languages,
            price_list: data.priceList
        };
        createPartnerMutation.mutate(payload);
    };

    const handleApplyDocType = (data: any) => {
        createDocTypeMutation.mutate(data);
    };

    const handleSubmit = async () => {
        const errors: string[] = [];
        const newErrorSet = new Set<string>();

        if (!customer) {
            errors.push("Kunde ist ein Pflichtfeld");
            newErrorSet.add('customer');
        }
        if (!source) {
            errors.push("Quellsprache ist erforderlich");
            newErrorSet.add('source');
        }
        if (!target) {
            errors.push("Zielsprache ist erforderlich");
            newErrorSet.add('target');
        }
        if (!docType || docType.length === 0) {
            errors.push("Dokumentenart ist ein Pflichtfeld");
            newErrorSet.add('docType');
        }
        if (!translator) {
            errors.push("Übersetzer ist ein Pflichtfeld");
            newErrorSet.add('translator');
        }

        setValidationErrors(newErrorSet);

        if (errors.length > 0) {
            toast.error(
                <div className="flex flex-col gap-1">
                    <span className="font-bold">Bitte korrigieren Sie folgende Fehler:</span>
                    <ul className="list-disc list-inside text-xs">
                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>,
                { duration: 4000 }
            );

            const firstErrorField = Array.from(newErrorSet)[0];
            const element = document.getElementById(`field-container-${firstErrorField}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        let finalName = name;
        if (!finalName) {
            const customerName = customersData.find((c: any) => c.id.toString() === customer)?.company_name || 'Project';
            const now = new Date();
            const yyyy = String(now.getFullYear());
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            finalName = `${customerName}_${source.toUpperCase()}-${target.toUpperCase()}_${yyyy}${mm}${dd}`;
        }

        const sourceLangId = languages.find((l: any) => l.iso_code.startsWith(source))?.id || 1;
        const targetLangId = languages.find((l: any) => l.iso_code.startsWith(target))?.id || 2;

        const payload = {
            project_name: finalName,
            customer_id: parseInt(customer),
            partner_id: translator ? parseInt(translator) : null,
            source_lang_id: sourceLangId,
            target_lang_id: targetLangId,
            deadline,
            priority,
            status,
            is_certified: isCertified,
            has_apostille: hasApostille,
            is_express: isExpress,
            classification: classification === 'ja',
            copies_count: copies,
            copy_price: parseFloat(copyPrice) || 0,
            price_total: parseFloat(totalPrice) || 0,
            partner_cost_net: parseFloat(partnerPrice) || 0,
            document_type_id: docType.length > 0 ? parseInt(docType[0]) : null,
            additional_doc_types: docType.length > 1 ? docType.slice(1) : null,
            notes,
            positions: positions.map(p => ({
                description: p.description,
                unit: p.unit,
                amount: parseFloat(p.amount) || 0,
                quantity: parseFloat(p.quantity) || 0,
                partner_rate: parseFloat(p.partnerRate) || 0,
                partner_mode: p.partnerMode,
                partner_total: parseFloat(p.partnerTotal) || 0,
                customer_rate: parseFloat(p.customerRate) || 0,
                customer_mode: p.customerMode,
                customer_total: parseFloat(p.customerTotal) || 0,
                margin_type: p.marginType,
                margin_percent: parseFloat(p.marginPercent) || 0
            })),
            payments: payments.map(p => ({
                amount: parseFloat(p.amount) || 0,
                payment_date: p.payment_date,
                payment_method: p.payment_method,
                note: p.note
            }))
        };
        onSubmit(payload);
    };

    const handleDelete = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Projekt löschen?',
            message: `Möchten Sie das Projekt "${name}" wirklich unwiderruflich löschen?`,
            type: 'danger',
            confirmLabel: 'Löschen',
            onConfirm: () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                onClose();
            }
        });
    };

    const extraCosts = (isCertified ? 5 : 0) + (hasApostille ? 15 : 0) + (isExpress ? 15 : 0) + (classification === 'ja' ? 15 : 0) + (copies * Number(copyPrice) || 0);
    const baseNet = parseFloat(totalPrice) || 0;
    const calcNet = baseNet + extraCosts;
    const calcTax = withTax ? calcNet * 0.19 : 0;
    const calcGross = calcNet + calcTax;
    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const remainingBalance = calcGross - totalPaid;
    const profit = calcNet - (parseFloat(partnerPrice) || 0);
    const profitMargin = calcNet > 0 ? (profit / calcNet) * 100 : 0;

    const handlePartnerSelect = (partner: any) => {
        setTranslator(partner.id.toString());
        setIsPartnerModalOpen(false);
    };

    const handleSavePayment = (payment: any) => {
        if (editingPayment) {
            setPayments(payments.map(p => p.id === payment.id ? payment : p));
        } else {
            setPayments([...payments, payment]);
        }
        setIsPaymentModalOpen(false);
        setEditingPayment(null);
    };

    const handleEditPayment = (payment: any) => {
        setEditingPayment(payment);
        setIsPaymentModalOpen(true);
    };

    const handleDeletePayment = (id: string) => {
        setPayments(payments.filter(p => p.id !== id));
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm transition-all py-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl mx-4 overflow-hidden transform scale-100 flex flex-col h-[90vh] animate-fadeInUp">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">{initialData ? 'Projekt Editieren' : 'Neues Projekt Erfassen'}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-200/50 rounded-lg p-0.5 border border-slate-300/50 h-9">
                            {['low', 'medium', 'high'].map(p => (
                                <button key={p} onClick={() => setPriority(p as any)} className={clsx("px-3 h-full text-[10px] font-bold uppercase rounded-md transition-all flex items-center gap-2", priority === p ? "bg-white text-brand-700 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                                    {p === 'low' && <FaClock className="text-[8px]" />}
                                    {p === 'medium' && <FaFlag className="text-[8px]" />}
                                    {p === 'high' && <FaBolt className="text-[8px]" />}
                                    {p === 'low' ? 'Standard' : p === 'medium' ? 'Dringend' : 'Express'}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="w-8 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 rounded-full transition-colors"><FaTimes /></button>
                    </div>
                </div>

                <div className="flex-1 lg:overflow-hidden overflow-y-auto flex flex-col lg:flex-row">
                    {/* Left Column */}
                    <div className="lg:flex-1 p-3 sm:p-5 space-y-6 custom-scrollbar border-b lg:border-b-0 lg:border-r border-slate-200 bg-white lg:overflow-y-auto">
                        {/* 01: Basis-Daten */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">01</div>
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Basis-Daten</h4>
                            </div>

                            <div className="grid grid-cols-12 gap-x-4 gap-y-3">
                                <div className="col-span-12">
                                    <Input
                                        label="Projektname"
                                        placeholder="Projektname eingeben..."
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>

                                <div className="col-span-12" id="field-container-docType">
                                    <div className="flex items-end">
                                        <div className="flex-1">
                                            <SearchableSelect
                                                id="docType"
                                                label="Dokumentenart *"
                                                isMulti={true}
                                                value={docType}
                                                onChange={setDocType}
                                                error={validationErrors.has('docType')}
                                                options={docTypes
                                                    .sort((a: any, b: any) => {
                                                        const catA = a.category?.toLowerCase() || '';
                                                        const catB = b.category?.toLowerCase() || '';
                                                        const isTopA = catA.includes('personal') || catA.includes('identität');
                                                        const isTopB = catB.includes('personal') || catB.includes('identität');
                                                        if (isTopA && !isTopB) return -1;
                                                        if (!isTopA && isTopB) return 1;
                                                        return catA.localeCompare(catB);
                                                    })
                                                    .map((dt: any) => ({
                                                        value: dt.id.toString(),
                                                        label: dt.name,
                                                        group: dt.category
                                                    }))}
                                            />
                                        </div>
                                        <button onClick={() => setShowDocTypeModal(true)} className="h-10 px-4 bg-brand-700 text-white rounded-r border-l-0 hover:bg-brand-800 transition flex items-center gap-2 shadow-sm"><FaPlus className="text-[10px]" /> <span className="text-xs font-bold">NEU</span></button>
                                    </div>
                                </div>

                                <div className="col-span-12 md:col-span-6">
                                    <SearchableSelect
                                        label="Status"
                                        options={statusOptions}
                                        value={status}
                                        onChange={setStatus}
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-6" id="field-container-deadline">
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1 cursor-pointer" onClick={() => datePickerRef.current?.setFocus()}>Lieferdatum</label>
                                    <div
                                        className="relative h-10 bg-white border border-slate-300 rounded shadow-sm overflow-hidden flex items-center cursor-pointer hover:border-slate-400 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all"
                                        onClick={() => {
                                            datePickerRef.current?.setFocus();
                                            (datePickerRef.current as any)?.setOpen?.(true);
                                        }}
                                    >
                                        <div className="absolute left-3 text-slate-400 pointer-events-none group-focus-within:text-brand-500 transition-colors">
                                            <FaCalendarAlt className="text-xs" />
                                        </div>
                                        <DatePicker
                                            ref={datePickerRef}
                                            selected={deadline ? new Date(deadline) : null}
                                            onChange={(date: Date | null) => {
                                                if (date) {
                                                    const newDate = new Date(date);
                                                    if (newDate.getHours() === 0 && newDate.getMinutes() === 0) {
                                                        newDate.setHours(12, 0, 0, 0);
                                                    }
                                                    setDeadline(newDate.toISOString());
                                                } else {
                                                    setDeadline('');
                                                }
                                            }}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="dd.MM.yyyy HH:mm"
                                            locale="de"
                                            className="w-full h-full bg-transparent border-none pl-9 pr-3 py-1.5 text-sm font-bold text-slate-700 outline-none cursor-pointer rounded"
                                            placeholderText="Datum wählen"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 02: Sprachen & Kunde */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">02</div>
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Sprachen & Kunde</h4>
                            </div>

                            <div className="grid grid-cols-12 gap-x-4 gap-y-3">
                                <div className="col-span-12" id="field-container-customer">
                                    <div className="flex items-end">
                                        <div className="flex-1">
                                            <SearchableSelect label="Kunde *" options={custOptions} value={customer} onChange={setCustomer} error={validationErrors.has('customer')} />
                                        </div>
                                        <button onClick={() => setShowCustomerModal(true)} className="h-10 px-4 bg-brand-700 text-white rounded-r border-l-0 hover:bg-brand-800 transition flex items-center gap-2 shadow-sm"><FaPlus className="text-[10px]" /> <span className="text-xs font-bold">NEU</span></button>
                                    </div>
                                </div>

                                <div className="col-span-12 md:col-span-6" id="field-container-source">
                                    <LanguageSelect id="source" label="Von *" value={source} onChange={setSource} error={validationErrors.has('source')} onAddNew={() => { setLangTrigger('source'); setIsLanguageModalOpen(true); }} />
                                </div>
                                <div className="col-span-12 md:col-span-6" id="field-container-target">
                                    <LanguageSelect id="target" label="Nach *" value={target} onChange={setTarget} error={validationErrors.has('target')} onAddNew={() => { setLangTrigger('target'); setIsLanguageModalOpen(true); }} />
                                </div>
                            </div>
                        </div>

                        {/* 03: Partner Auswahl */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">03</div>
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Partner & Beteiligte</h4>
                            </div>

                            <div className="grid grid-cols-12 gap-x-4 gap-y-3">
                                <div className="col-span-12" id="field-container-translator">
                                    <div className="flex items-end">
                                        <div className="flex-1">
                                            <SearchableSelect label="Übersetzer *" options={partnerOptions} value={translator} onChange={setTranslator} error={validationErrors.has('translator')} />
                                        </div>
                                        <button onClick={() => setShowPartnerModal(true)} className="h-10 px-4 bg-brand-700 text-white rounded-r border-l-0 hover:bg-brand-800 transition flex items-center gap-2 shadow-sm"><FaPlus className="text-[10px]" /> <span className="text-xs font-bold">NEU</span></button>
                                    </div>
                                </div>
                            </div>

                            {/* Partner Selection Table */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Partner Auswahl</h4>
                                    <div className="relative w-40">
                                        <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 text-[9px]" />
                                        <input
                                            type="text"
                                            placeholder="Suchen..."
                                            value={partnerSearch}
                                            onChange={(e) => setPartnerSearch(e.target.value)}
                                            className="w-full pl-7 pr-2 py-1 bg-white border border-slate-200 rounded text-[10px] focus:outline-none focus:border-brand-300 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded bg-white overflow-hidden">
                                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse table-fixed">
                                            <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
                                                <tr>
                                                    <th className="w-2/5 px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Partner / Email</th>
                                                    <th className="w-2/5 px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sprachpaar</th>
                                                    <th className="w-1/5 px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Aktion</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {/* Matching Partners Header */}
                                                <tr className="bg-slate-50/30">
                                                    <td colSpan={3} className="px-2 py-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Passende Übersetzer</span>
                                                            <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded-full">{matchingPartners.length}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {matchingPartners.map((p: any) => (
                                                    <tr
                                                        key={p.id}
                                                        className={clsx(
                                                            "group transition-colors cursor-pointer hover:bg-emerald-50/30",
                                                            translator === p.id.toString() ? "bg-brand-50/30" : ""
                                                        )}
                                                        onClick={() => setTranslator(p.id.toString() === translator ? '' : p.id.toString())}
                                                    >
                                                        <td className="px-2 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-[9px] font-black shrink-0">
                                                                    {(p.first_name?.[0] || '')}{(p.last_name?.[0] || '')}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-[10px] font-bold text-slate-700 truncate">{p.company_name || `${p.first_name} ${p.last_name}`}</span>
                                                                    <span className="text-[9px] text-slate-400 truncate tracking-tight">{p.email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <div className="flex flex-wrap gap-1">
                                                                {(p.languages || []).slice(0, 3).map((l: string) => {
                                                                    const isSourceMatch = source && l.toLowerCase().includes(source.toLowerCase().split('-')[0]);
                                                                    const isTargetMatch = target && l.toLowerCase().includes(target.toLowerCase().split('-')[0]);
                                                                    return (
                                                                        <span key={l} className={clsx(
                                                                            "px-1 py-0 rounded text-[7px] font-black uppercase tracking-tighter border",
                                                                            isSourceMatch || isTargetMatch ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-slate-400 border-slate-100"
                                                                        )}>{l}</span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2 text-right">
                                                            <div className={clsx(
                                                                "inline-flex items-center justify-center w-5 h-5 rounded-full border transition-all",
                                                                translator === p.id.toString() ? "bg-brand-600 border-brand-600 text-white shadow-sm" : "bg-white border-slate-200 text-transparent group-hover:border-brand-400"
                                                            )}>
                                                                <FaCheck className="text-[10px]" />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* Other Partners Header */}
                                                <tr className="bg-slate-50/10">
                                                    <td colSpan={3} className="px-2 py-1.5">
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sonstige</span>
                                                            <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded-full">{otherPartners.length}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {otherPartners.map((p: any) => (
                                                    <tr
                                                        key={p.id}
                                                        className={clsx(
                                                            "group transition-colors cursor-pointer hover:bg-slate-50/50",
                                                            translator === p.id.toString() ? "bg-brand-50/30" : ""
                                                        )}
                                                        onClick={() => setTranslator(p.id.toString() === translator ? '' : p.id.toString())}
                                                    >
                                                        <td className="px-2 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center text-[9px] font-black shrink-0">
                                                                    {(p.first_name?.[0] || '')}{(p.last_name?.[0] || '')}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-[10px] font-bold text-slate-700 truncate">{p.company_name || `${p.first_name} ${p.last_name}`}</span>
                                                                    <span className="text-[9px] text-slate-400 truncate tracking-tight">{p.email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <div className="flex flex-wrap gap-1">
                                                                {(p.languages || []).slice(0, 3).map((l: string) => (
                                                                    <span key={l} className="px-1 py-0 rounded text-[7px] font-black uppercase tracking-tighter border bg-white text-slate-400 border-slate-100">{l}</span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2 text-right">
                                                            <div className={clsx(
                                                                "inline-flex items-center justify-center w-5 h-5 rounded-full border transition-all",
                                                                translator === p.id.toString() ? "bg-brand-600 border-brand-600 text-white shadow-sm" : "bg-white border-slate-200 text-transparent group-hover:border-brand-400"
                                                            )}>
                                                                <FaCheck className="text-[10px]" />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {matchingPartners.length === 0 && otherPartners.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic text-[10px]">
                                                            Keine Partner gefunden...
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <NewPartnerModal
                                isOpen={showPartnerModal}
                                onClose={() => setShowPartnerModal(false)}
                                onSubmit={handleApplyPartner}
                                isLoading={createPartnerMutation.isPending}
                            />
                            <NewCustomerModal
                                isOpen={showCustomerModal}
                                onClose={() => setShowCustomerModal(false)}
                                onSubmit={handleApplyCustomer}
                            />
                        </div>

                        {/* Leistungen */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">04</div>
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Leistungen & Optionen</h4>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                <Input label="Beglaubigung (5€)" isSelect value={isCertified ? 'ja' : 'nein'} onChange={(e) => setIsCertified(e.target.value === 'ja')} containerClassName="h-9"><option value="nein">Nein</option><option value="ja">Ja</option></Input>
                                <Input label="Express (15€)" isSelect value={isExpress ? 'ja' : 'nein'} onChange={(e) => setIsExpress(e.target.value === 'ja')} containerClassName="h-9"><option value="nein">Nein</option><option value="ja">Ja</option></Input>
                                <Input label="Apostille (15€)" isSelect value={hasApostille ? 'ja' : 'nein'} onChange={(e) => setHasApostille(e.target.value === 'ja')} containerClassName="h-9"><option value="nein">Nein</option><option value="ja">Ja</option></Input>
                                <Input label="FS-Klass. (15€)" isSelect value={classification} onChange={(e) => setClassification(e.target.value)} containerClassName="h-9"><option value="nein">Nein</option><option value="ja">Ja</option></Input>

                                <div className="flex flex-col gap-1 justify-center">
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">MwSt. (19%)</label>
                                    <div
                                        className="h-9 flex items-center gap-2 cursor-pointer transition-all"
                                        onClick={() => setWithTax(!withTax)}
                                    >
                                        <div className={clsx(
                                            "w-7 h-3.5 rounded-full relative transition-colors",
                                            withTax ? "bg-emerald-500" : "bg-slate-300"
                                        )}>
                                            <div className={clsx(
                                                "absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all shadow-sm",
                                                withTax ? "left-4" : "left-0.5"
                                            )} />
                                        </div>
                                        <span className={clsx("text-[10px] font-bold uppercase tracking-wider", withTax ? "text-slate-700" : "text-slate-400")}>
                                            {withTax ? "AKTIVIERT" : "DEAKTIVIERT"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 pt-2 border-t border-slate-50">
                                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Anzahl Kopien</label>
                                        <div className="flex items-center h-9 border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm transition-all focus-within:border-brand-500/50 focus-within:ring-2 focus-within:ring-brand-500/5">
                                            <button
                                                onClick={() => setCopies(Math.max(0, copies - 1))}
                                                className="h-full px-3 text-slate-400 hover:text-brand-600 hover:bg-slate-50 transition-colors border-r border-slate-100"
                                            >
                                                <FaMinus className="text-[10px]" />
                                            </button>
                                            <input
                                                type="number"
                                                value={copies}
                                                onChange={(e) => setCopies(Math.max(0, parseInt(e.target.value) || 0))}
                                                className="flex-1 h-full text-center text-sm font-bold text-slate-700 outline-none"
                                            />
                                            <button
                                                onClick={() => setCopies(copies + 1)}
                                                className="h-full px-3 text-slate-400 hover:text-brand-600 hover:bg-slate-50 transition-colors border-l border-slate-100"
                                            >
                                                <FaPlus className="text-[10px]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                                    <Input
                                        label="Preis pro Kopie (€)"
                                        type="number"
                                        step="0.01"
                                        value={copyPrice}
                                        onChange={(e) => setCopyPrice(e.target.value)}
                                        onBlur={() => setCopyPrice(parseFloat(copyPrice).toFixed(2))}
                                        containerClassName="h-9"
                                    />
                                </div>
                                <div className="col-span-12 lg:col-span-4 flex items-end pb-1.5 px-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 italic">
                                        <span>Summe Kopien:</span>
                                        <span className="text-slate-800">{(copies * parseFloat(copyPrice || '0')).toFixed(2)} €</span>
                                    </div>
                                </div>
                            </div>
                            <NewDocTypeModal
                                isOpen={showDocTypeModal}
                                onClose={() => setShowDocTypeModal(false)}
                                onSubmit={handleApplyDocType}
                                isLoading={createDocTypeMutation.isPending}
                            />
                        </div>

                        {/* Kalkulation */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">05</div>
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kalkulation Positionen</h4>
                            </div>

                            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm bg-white">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead className="bg-slate-50/80 text-slate-500 text-[9px] font-black uppercase tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 w-10 text-center">#</th>
                                            <th className="px-4 py-3">Beschreibung</th>
                                            <th className="px-4 py-3 w-32 text-right">Menge</th>
                                            <th className="px-4 py-3 w-24 text-right">Einh.</th>
                                            <th className="px-4 py-3 w-32 text-right bg-red-50/30 text-red-400 border-l border-slate-100">EK (Stk)</th>
                                            <th className="px-4 py-3 w-32 text-right bg-emerald-50/30 text-emerald-600 border-l border-slate-100">VK (Stk)</th>
                                            <th className="px-4 py-3 w-28 text-right font-black text-slate-700 bg-emerald-50/30 border-l border-slate-100">Gesamt</th>
                                            <th className="px-2 py-3 w-10 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                                        {positions.map((pos, index) => (
                                            <tr key={pos.id} className="group hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-center text-slate-400 font-medium">{index + 1}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Bezeichnung..."
                                                        className="w-full bg-transparent outline-none font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-1 -mx-1"
                                                        value={pos.description}
                                                        onChange={e => {
                                                            const n = [...positions];
                                                            n[index].description = e.target.value;
                                                            setPositions(n);
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="w-full text-right bg-transparent outline-none font-mono focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-1 -mx-1"
                                                        value={pos.amount}
                                                        onChange={e => {
                                                            const n = [...positions];
                                                            n[index].amount = e.target.value;
                                                            setPositions(n);
                                                        }}
                                                        onBlur={e => {
                                                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                                                            const n = [...positions];
                                                            n[index].amount = val.toFixed(2);
                                                            setPositions(n);
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <select
                                                        className="w-full bg-transparent text-right outline-none text-[10px] font-bold uppercase text-slate-500 cursor-pointer hover:text-brand-600"
                                                        value={pos.unit}
                                                        onChange={e => {
                                                            const n = [...positions];
                                                            n[index].unit = e.target.value;
                                                            setPositions(n);
                                                        }}
                                                    >
                                                        <option value="Wörter">Wörter</option>
                                                        <option value="Normzeile">Normzeile</option>
                                                        <option value="Seiten">Seiten</option>
                                                        <option value="Stunden">Stunden</option>
                                                        <option value="Pauschal">Pauschal</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-right border-l border-slate-100 bg-red-50/5 group-hover:bg-red-50/20 transition-colors">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            className="w-20 text-right bg-transparent outline-none font-mono text-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 rounded px-1"
                                                            value={pos.partnerRate}
                                                            onChange={e => {
                                                                const n = [...positions];
                                                                n[index].partnerRate = e.target.value;
                                                                setPositions(n);
                                                            }}
                                                            onBlur={e => {
                                                                const val = Math.max(0, parseFloat(e.target.value) || 0);
                                                                const n = [...positions];
                                                                n[index].partnerRate = val.toFixed(2);
                                                                setPositions(n);
                                                            }}
                                                        />
                                                        <select
                                                            className="w-4 bg-transparent text-[8px] text-slate-400 outline-none"
                                                            value={pos.partnerMode}
                                                            onChange={e => {
                                                                const n = [...positions];
                                                                n[index].partnerMode = e.target.value;
                                                                setPositions(n);
                                                            }}
                                                            title="Berechnung: Rate oder Pauschal"
                                                        >
                                                            <option value="unit">€/Eh.</option>
                                                            <option value="flat">Fix</option>
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right border-l border-slate-100 bg-emerald-50/5 group-hover:bg-emerald-50/20 transition-colors">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {pos.customerMode === 'flat' || pos.customerMode === 'rate' ? (
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                className="w-20 text-right bg-transparent outline-none font-mono text-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 rounded px-1"
                                                                value={pos.customerRate}
                                                                onChange={e => {
                                                                    const n = [...positions];
                                                                    n[index].customerRate = e.target.value;
                                                                    setPositions(n);
                                                                }}
                                                                onBlur={e => {
                                                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                                                    const n = [...positions];
                                                                    n[index].customerRate = val.toFixed(2);
                                                                    setPositions(n);
                                                                }}
                                                            />
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="w-20 text-right bg-transparent outline-none font-mono text-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 rounded px-1"
                                                                value={pos.marginPercent}
                                                                onChange={e => {
                                                                    const n = [...positions];
                                                                    n[index].marginPercent = e.target.value;
                                                                    setPositions(n);
                                                                }}
                                                                onBlur={e => {
                                                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                                                    const n = [...positions];
                                                                    n[index].marginPercent = val.toFixed(2);
                                                                    setPositions(n);
                                                                }}
                                                            />
                                                        )}
                                                        <select
                                                            className="w-4 bg-transparent text-[8px] text-slate-400 outline-none"
                                                            value={pos.customerMode === 'flat' ? 'flat' : (pos.customerMode === 'rate' ? 'rate' : pos.marginType)}
                                                            onChange={e => {
                                                                const n = [...positions];
                                                                const v = e.target.value;
                                                                if (v === 'flat') { n[index].customerMode = 'flat'; n[index].marginType = 'markup'; }
                                                                else if (v === 'rate') { n[index].customerMode = 'rate'; n[index].marginType = 'markup'; }
                                                                else { n[index].customerMode = 'unit'; n[index].marginType = v; }
                                                                setPositions(n);
                                                            }}
                                                            title="Berechnung: Rate, Aufschlag, etc."
                                                        >
                                                            <option value="rate">Rate</option>
                                                            <option value="markup">Aufschl. %</option>
                                                            <option value="flat">Fix</option>
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-black text-slate-800 border-l border-slate-100 bg-emerald-50/10 group-hover:bg-emerald-50/30 transition-colors">
                                                    {pos.customerTotal} €
                                                </td>
                                                <td className="px-2 py-3 text-center">
                                                    {positions.length > 1 && (
                                                        <button
                                                            onClick={() => setPositions(positions.filter(p => p.id !== pos.id))}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Löschen"
                                                        >
                                                            <FaTrash className="text-[10px]" />
                                                        </button>
                                                    )}
                                                    {positions.length === 1 && (
                                                        <button disabled className="p-1.5 text-slate-200 cursor-not-allowed">
                                                            <FaTrash className="text-[10px]" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="p-2 border-t border-slate-100 bg-slate-50 flex justify-center">
                                    <button
                                        onClick={() => setPositions([...positions, { id: Date.now().toString(), description: 'Zusatzleistung', amount: '1.00', unit: 'Normzeile', quantity: '1.00', partnerRate: '0.00', partnerMode: 'unit', partnerTotal: '0.00', customerRate: '0.00', customerMode: 'unit', customerTotal: '0.00', marginType: 'markup', marginPercent: '0.00' }])}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold uppercase hover:bg-slate-50 hover:text-brand-600 transition-all active:scale-95 shadow-sm"
                                    >
                                        <FaPlus /> Position hinzufügen
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Teilzahlungen */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-bold">06</div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Teilzahlungen / Anzahlungen</h4>
                                </div>
                                <button
                                    onClick={() => { setEditingPayment(null); setIsPaymentModalOpen(true); }}
                                    className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-emerald-100 transition-all active:scale-95 shadow-sm"
                                >
                                    <FaPlus /> Zahlung erfassen
                                </button>
                            </div>

                            {payments.length === 0 ? (
                                <div className="text-[10px] text-slate-400 italic py-2 text-center border-2 border-dashed border-slate-50 rounded">Keine Zahlungen erfasst.</div>
                            ) : (
                                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                                <th className="px-4 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest w-44">Datum & Uhrzeit</th>
                                                <th className="px-4 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest w-32 text-right">Betrag (Brutto)</th>
                                                <th className="px-4 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest w-40">Zahlmittel</th>
                                                <th className="px-4 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Anmerkung</th>
                                                <th className="px-4 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest w-20 text-center">Aktion</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {payments.map((p) => (
                                                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-4 py-2 text-[11px] font-bold text-slate-700">
                                                        <div className="flex items-center gap-2">
                                                            <FaCalendarAlt className="text-slate-400 text-[10px]" />
                                                            {new Date(p.payment_date).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-[11px] font-black text-emerald-600 text-right">
                                                        {parseFloat(p.amount).toFixed(2)} €
                                                    </td>
                                                    <td className="px-4 py-2 text-[10px] font-bold text-slate-600">
                                                        {p.payment_method}
                                                    </td>
                                                    <td className="px-4 py-2 text-[10px] italic text-slate-400">
                                                        {p.note || '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-center flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEditPayment(p)}
                                                            className="text-slate-300 hover:text-brand-600 transition p-1 hover:bg-brand-50 rounded"
                                                        >
                                                            <FaInfoCircle className="text-[10px]" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePayment(p.id)}
                                                            className="text-slate-300 hover:text-red-700 transition p-1 hover:bg-red-50 rounded"
                                                        >
                                                            <FaTrash className="text-[10px]" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">07</div>
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Anmerkungen</h4>
                            </div>
                            <Input isTextArea label="Interne Anmerkungen" placeholder="Wichtige Hinweise zum Projekt..." value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-80 bg-slate-50 shrink-0 h-auto lg:h-full lg:overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200"><FaInfoCircle className="text-slate-400 text-xs" /><h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Meta Info</h4></div>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between"><span className="text-slate-500">Erstellt:</span><span className="font-bold text-slate-700">{creationDate}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Manager:</span><span className="font-bold text-slate-700">{projectManager}</span></div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rechnungsvorschau</h4>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                                <div className="flex justify-between text-xs text-slate-500"><span>Positionen Netto</span><span>{baseNet.toFixed(2)} €</span></div>
                                {isCertified && (
                                    <div className="flex justify-between text-[11px] text-slate-400 pl-2"><span>+ Beglaubigung</span><span>5,00 €</span></div>
                                )}
                                {hasApostille && (
                                    <div className="flex justify-between text-[11px] text-slate-400 pl-2"><span>+ Apostille</span><span>15,00 €</span></div>
                                )}
                                {isExpress && (
                                    <div className="flex justify-between text-[11px] text-slate-400 pl-2"><span>+ Express-Zuschlag</span><span>15,00 €</span></div>
                                )}
                                {classification === 'ja' && (
                                    <div className="flex justify-between text-[11px] text-slate-400 pl-2"><span>+ FS-Klassifizierung</span><span>15,00 €</span></div>
                                )}
                                {copies > 0 && (
                                    <div className="flex justify-between text-[11px] text-slate-400 pl-2">
                                        <span>+ Zusatzkopien ({copies}x)</span>
                                        <span>{(copies * Number(copyPrice)).toFixed(2)} €</span>
                                    </div>
                                )}
                                {extraCosts > 0 && <div className="border-t border-slate-50 my-1"></div>}
                                <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-800"><span>Gesamt Netto</span><span>{calcNet.toFixed(2)} €</span></div>
                                <div className="flex justify-between text-[10px] text-slate-400"><span>MwSt. 19%</span><span>{calcTax.toFixed(2)} €</span></div>
                                <div className="pt-2 border-t-2 border-slate-100 flex justify-between text-xl font-bold text-slate-900 transition-all"><span>Gesamt</span><span>{calcGross.toFixed(2)} €</span></div>
                                {totalPaid > 0 && (
                                    <div className="pt-2 flex justify-between text-xs text-emerald-600 font-bold border-t border-slate-50">
                                        <span>Geleistete Zahlungen</span>
                                        <span>-{totalPaid.toFixed(2)} €</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-slate-100 mt-2 flex justify-between items-center bg-slate-50 -mx-4 -mb-4 p-4 rounded-b">
                                    <span className="text-[11px] font-bold uppercase text-slate-600 tracking-wider">Restbetrag</span>
                                    <span className={clsx("text-lg font-bold", remainingBalance <= 0.01 ? "text-emerald-600" : "text-brand-700")}>
                                        {remainingBalance <= 0.01 ? 'BEZAHLT' : `${remainingBalance.toFixed(2)} €`}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-tighter">Voraussichtl. Gewinn</span>
                                    <span className={clsx("text-xs font-bold", profit >= 0 ? "text-slate-800" : "text-red-600")}>{profit.toFixed(2)} €</span>
                                </div>
                                <div className="w-full bg-slate-300 rounded-full h-2 overflow-hidden shadow-inner">
                                    <div className={clsx("h-full transition-all duration-500", profitMargin > 40 ? "bg-emerald-500" : profitMargin > 20 ? "bg-brand-500" : "bg-amber-500")} style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}></div>
                                </div>
                                <div className="text-right mt-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">{profitMargin.toFixed(1)}% Marge</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        {initialData && (
                            <button onClick={handleDelete} className="text-red-500 text-xs font-bold uppercase flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded transition-colors active:scale-95"><FaTrash /> Projekt Löschen</button>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="px-5 py-2 bg-white border border-slate-300 rounded text-[10px] font-bold uppercase hover:bg-slate-50 transition active:scale-95">Abbrechen</button>
                        <button onClick={handleSubmit} disabled={isLoading || createCustomerMutation.isPending} className="px-6 py-2 bg-brand-700 text-white rounded text-[10px] font-bold uppercase shadow-lg shadow-brand-500/20 hover:bg-brand-800 transition-all active:scale-95 transform">
                            {isLoading ? 'Speichere...' : initialData ? 'Projekt Aktualisieren' : 'Projekt Anlegen'}
                        </button>
                    </div>
                </div>
            </div>

            <PartnerSelectionModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} onSelect={handlePartnerSelect} />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleSavePayment} initialData={editingPayment} totalAmount={calcGross} />
            <NewMasterDataModal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} onSubmit={(data) => createLanguageMutation.mutate(data)} type="languages" />
            <ConfirmDialog isOpen={confirmConfig.isOpen} onCancel={() => setConfirmConfig(p => ({ ...p, isOpen: false }))} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} confirmLabel={confirmConfig.confirmLabel} />
        </div>
    );
};

export default NewProjectModal;
