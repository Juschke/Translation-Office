import React, { useState, useEffect, useMemo } from 'react';
import UniversalForm from '../common/UniversalForm'; // Keep for typings if needed, otherwise remove if used in other places. Actually FormField type is used.
import { type FormField } from '../common/UniversalForm';
import {
    FaTimes, FaPlus, FaCalendarAlt, FaFlag,
    FaInfoCircle, FaTrash, FaClock, FaBolt, FaMagic
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, partnerService, settingsService } from '../../api/services';
import PaymentModal from './PaymentModal';
import NewDocTypeModal from './NewDocTypeModal';

registerLocale('de', de);

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    isLoading?: boolean;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
    const queryClient = useQueryClient();

    // Basic States
    const [name, setName] = useState('');
    const [customer, setCustomer] = useState('');
    const [deadline, setDeadline] = useState('');
    const [source, setSource] = useState('de');
    const [target, setTarget] = useState('en');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
    const [status, setStatus] = useState('draft');

    // Project Options & Extra Costs
    const [isCertified, setIsCertified] = useState(false);
    const [hasApostille, setHasApostille] = useState(false);
    const [isExpress, setIsExpress] = useState(false);
    const [classification, setClassification] = useState('nein');
    const [copies, setCopies] = useState(0);
    const [copyPrice, setCopyPrice] = useState('5');

    // Unified Position State
    const [positions, setPositions] = useState<any[]>([
        {
            id: Date.now().toString(),
            description: 'Übersetzung',
            amount: '1',
            unit: 'Normzeile',
            quantity: '1',
            partnerRate: '0.00',
            partnerMode: 'unit',
            partnerTotal: '0.00',
            customerRate: '0.00',
            customerTotal: '0.00',
            customerMode: 'unit',
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
    const [editingPayment, setEditingPayment] = useState<any>(null);

    // Detailed Customer Form States REMOVED - Using UniversalForm
    // Detailed Partner Form States REMOVED - Using UniversalForm

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

    const suggestedPartners = useMemo(() => {
        if (!source || !target) return [];
        return Array.isArray(partnersData) ? partnersData.filter((p: any) => {
            const langs = p.languages || [];
            return langs.includes(source) && langs.includes(target);
        }) : [];
    }, [partnersData, source, target]);

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
            } else {
                cTotal = parseFloat(pos.customerRate) || 0;
            }

            return {
                ...pos,
                partnerTotal: pTotal.toFixed(2),
                customerTotal: cTotal.toFixed(2),
                customerRate: pos.customerMode === 'unit' ? cRate.toFixed(4) : pos.customerRate
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

    const resetForm = () => {
        setName('');
        setCustomer('');
        setDeadline('');
        setSource('de');
        setTarget('en');
        setPriority('low');
        setStatus('draft');
        setIsCertified(false);
        setHasApostille(false);
        setIsExpress(false);
        setClassification('nein');
        setCopies(0);
        setCopyPrice('5');
        setDocType([]);
        setTranslator('');
        setPositions([{
            id: Date.now().toString(),
            description: 'Übersetzung',
            amount: '1',
            unit: 'Normzeile',
            quantity: '1',
            partnerRate: '0.00',
            partnerMode: 'unit',
            customerRate: '0.00',
            customerMode: 'unit',
            marginType: 'markup',
            marginPercent: '0'
        }]);
        setTotalPrice('');
        setPartnerPrice('');
        setPayments([]);
        setNotes('');
    };

    if (!isOpen) return null;

    const handleApplyCustomer = (data: any) => {
        // Map modal data to API format if needed, NewCustomerModal uses relatively flat structure, check API expectations
        createCustomerMutation.mutate({
            company_name: data.company_name,
            salutation: data.salutation,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            address: data.address_street, // Check if backend expects structured address or single string
            zip: data.address_zip,
            city: data.address_city,
            type: data.type
            // Add other fields as necessary
        });
    };

    const handleApplyPartner = (data: any) => {
        // NewPartnerModal usually returns data ready for API or close to it.
        // PartnerForm uses camelCase, API expects snake_case.
        // We probably need a mapper if NewPartnerModal doesn't do it.
        // Assuming PartnerForm returns roughly what we need, we might need to map keys.
        // HOWEVER, partnerService.create expects snake_case.
        const payload = {
            company_name: data.company || data.company_name,
            salutation: data.salutation, // Might be missing in PartnerForm? PartnerForm has simpler structure often.
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.emails?.[0] || data.email,
            // Map other fields from PartnerForm output (camelCase) to snake_case
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
        const newErrors = new Set<string>();
        if (!name) newErrors.add('name');
        if (!customer && !showCustomerModal) newErrors.add('customer');
        if (!source) newErrors.add('source');
        if (!target) newErrors.add('target');
        if (!deadline) newErrors.add('deadline');

        setValidationErrors(newErrors);
        if (newErrors.size > 0) return;

        const sourceLangId = languages.find((l: any) => l.iso_code.startsWith(source))?.id || 1;
        const targetLangId = languages.find((l: any) => l.iso_code.startsWith(target))?.id || 2;

        const payload = {
            project_name: name,
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
    const calcTax = calcNet * 0.19;
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
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
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
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 rounded-full transition-colors"><FaTimes /></button>
                    </div>
                </div>

                <div className="flex-1 lg:overflow-hidden overflow-y-auto flex flex-col lg:flex-row">
                    {/* Left Column */}
                    <div className="lg:flex-1 lg:overflow-y-auto p-3 sm:p-6 space-y-8 custom-scrollbar border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
                        {/* Stammdaten */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">01</div>
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Stammdaten</h4>
                            </div>

                            <Input label="Projektname *" placeholder="Name..." value={name} onChange={e => setName(e.target.value)} error={validationErrors.has('name')} />

                            <div className="">
                                <div className="flex items-end">
                                    <div className="flex-1">
                                        <SearchableSelect label="Kunde auswählen *" options={custOptions} value={customer} onChange={setCustomer} error={validationErrors.has('customer')} />
                                    </div>
                                    <button onClick={() => setShowCustomerModal(true)} className="h-[38px] px-4 bg-brand-700 text-white rounded-r rounded-l-none hover:bg-brand-800 transition flex items-center gap-2 shadow-sm"><FaPlus className="text-xs" /> <span className="text-xs font-bold">NEU</span></button>
                                </div>
                            </div>

                            <NewCustomerModal
                                isOpen={showCustomerModal}
                                onClose={() => setShowCustomerModal(false)}
                                onSubmit={handleApplyCustomer}
                            />



                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Input isSelect label="Status" value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="draft">Entwurf</option>
                                    <option value="pending">Angebot</option>
                                    <option value="in_progress">In Bearbeitung</option>
                                    <option value="review">QS / Lektorat</option>
                                    <option value="completed">Abgeschlossen</option>
                                </Input>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Lieferdatum *</label>
                                    <div className={clsx("relative h-10 border rounded transition-all", validationErrors.has('deadline') ? "border-red-500" : "border-slate-300")}>
                                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs z-10" />
                                        <DatePicker
                                            selected={deadline ? new Date(deadline) : null}
                                            onChange={(date: Date | null) => setDeadline(date ? date.toISOString() : '')}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="dd.MM.yyyy HH:mm"
                                            locale="de"
                                            className="w-full h-9 bg-transparent border-none pl-9 pr-3 py-2 text-sm font-bold text-slate-700 outline-none cursor-pointer"
                                            placeholderText="Datum/Zeit wählen"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <LanguageSelect label="Ausgangssprache *" value={source} onChange={setSource} error={validationErrors.has('source')} />
                                <LanguageSelect label="Zielsprache *" value={target} onChange={setTarget} error={validationErrors.has('target')} />
                            </div>

                            {/* Partner Selection */}
                            <div className="space-y-3">
                                {suggestedPartners.length > 0 && !translator && (
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg overflow-hidden mb-2">
                                        <div className="px-3 py-1.5 bg-emerald-100/50 text-emerald-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <FaMagic /> Empfohlene Übersetzer ({source.toUpperCase()} &rarr; {target.toUpperCase()})
                                        </div>
                                        <table className="w-full text-left">
                                            <tbody className="divide-y divide-emerald-100/50">
                                                {suggestedPartners.map((p: any) => (
                                                    <tr key={p.id} className="hover:bg-emerald-100/30 cursor-pointer group transition-colors" onClick={() => setTranslator(p.id.toString())}>
                                                        <td className="px-3 py-2">
                                                            <div className="text-[11px] font-bold text-slate-700">{p.first_name} {p.last_name}</div>
                                                            {p.company_name && <div className="text-[9px] text-slate-500">{p.company_name}</div>}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <div className="flex items-center justify-end gap-1 text-[9px] font-bold text-emerald-600">
                                                                <span>Übernehmen</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="flex items-end">
                                    <div className="flex-1">
                                        <SearchableSelect label="Übersetzer / Partner auswählen" options={partnerOptions} value={translator} onChange={setTranslator} />
                                    </div>
                                    <button onClick={() => setShowPartnerModal(true)} className="h-[38px] px-4 bg-brand-700 text-white rounded-r rounded-l-none hover:bg-brand-800 transition flex items-center gap-2 shadow-sm"><FaPlus className="text-xs" /> <span className="text-xs font-bold">NEU</span></button>
                                </div>
                            </div>

                            <NewPartnerModal
                                isOpen={showPartnerModal}
                                onClose={() => setShowPartnerModal(false)}
                                onSubmit={handleApplyPartner}
                                isLoading={createPartnerMutation.isPending}
                            />
                        </div>

                        {/* Leistungen */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">02</div>
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Leistungen & Optionen</h4>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <Input label="Beglaubigung" isSelect value={isCertified ? 'ja' : 'nein'} onChange={(e) => setIsCertified(e.target.value === 'ja')}><option value="nein">Nein</option><option value="ja">Ja</option></Input>
                                <Input label="Express" isSelect value={isExpress ? 'ja' : 'nein'} onChange={(e) => setIsExpress(e.target.value === 'ja')}><option value="nein">Nein</option><option value="ja">Ja</option></Input>
                                <Input label="Apostille" isSelect value={hasApostille ? 'ja' : 'nein'} onChange={(e) => setHasApostille(e.target.value === 'ja')}><option value="nein">Nein</option><option value="ja">Ja</option></Input>
                                <Input label="FS-Klass." isSelect value={classification} onChange={(e) => setClassification(e.target.value)}><option value="nein">Nein</option><option value="ja">Ja</option></Input>
                            </div>
                            <div className="grid grid-cols-1">
                                <div className="flex items-end">
                                    <div className="flex-1">
                                        <SearchableSelect
                                            label="Dokumentenart"
                                            value={docType[0] || ''}
                                            onChange={(val) => setDocType([val])}
                                            options={docTypes.map((dt: any) => ({ value: dt.id.toString(), label: dt.title || dt.name }))}
                                        />
                                    </div>
                                    <button onClick={() => setShowDocTypeModal(true)} className="h-[38px] px-4 bg-brand-700 text-white rounded-r rounded-l-none hover:bg-brand-800 transition flex items-center gap-2 shadow-sm"><FaPlus className="text-xs" /> <span className="text-xs font-bold">NEU</span></button>
                                </div>
                            </div>
                            <NewDocTypeModal
                                isOpen={showDocTypeModal}
                                onClose={() => setShowDocTypeModal(false)}
                                onSubmit={handleApplyDocType}
                                isLoading={createDocTypeMutation.isPending}
                            />
                        </div>

                        {/* Positions */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">03</div>
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Kalkulation Positionen</h4>
                            </div>

                            <div className="space-y-4">
                                {positions.map((pos, index) => (
                                    <div key={pos.id} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
                                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-400">{String(index + 1).padStart(2, '0')}.</span>
                                            <input type="text" placeholder="Bezeichnung..." className="flex-1 bg-transparent border-none text-sm font-bold text-slate-800 focus:ring-0" value={pos.description} onChange={e => { const n = [...positions]; n[index].description = e.target.value; setPositions(n); }} />
                                            {positions.length > 1 && <button onClick={() => setPositions(positions.filter(p => p.id !== pos.id))} className="text-slate-300 hover:text-red-500 transition p-1"><FaTrash /></button>}
                                        </div>
                                        <div className="p-3 grid grid-cols-12 gap-x-4 gap-y-4 items-start">
                                            <div className="col-span-12 md:col-span-6 lg:col-span-4 space-y-2">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menge & Einheit</label>
                                                <div className="flex border border-slate-300 rounded overflow-hidden h-9">
                                                    <input type="number" className="flex-1 px-3 text-sm font-bold text-slate-700 outline-none" value={pos.amount} onChange={e => { const n = [...positions]; n[index].amount = e.target.value; setPositions(n); }} />
                                                    <select className="w-24 bg-slate-50 text-[11px] font-bold text-slate-600 outline-none border-l border-slate-200" value={pos.unit} onChange={e => { const n = [...positions]; n[index].unit = e.target.value; setPositions(n); }}>
                                                        <option>Wörter</option><option>Normzeile</option><option>Seiten</option><option>Stunden</option><option>Pauschal</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-span-12 md:col-span-6 lg:col-span-4 space-y-2">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">EK (Partner)</label>
                                                <div className="flex border border-slate-300 rounded overflow-hidden h-9">
                                                    <input type="number" className="flex-1 px-3 text-sm font-bold text-slate-700 text-right outline-none" value={pos.partnerRate} onChange={e => { const n = [...positions]; n[index].partnerRate = e.target.value; setPositions(n); }} />
                                                    <select className="w-24 bg-slate-50 text-[11px] font-bold text-slate-600 outline-none border-l border-slate-200" value={pos.partnerMode} onChange={e => { const n = [...positions]; n[index].partnerMode = e.target.value; setPositions(n); }}>
                                                        <option value="unit">Rate</option><option value="flat">Pauschal</option>
                                                    </select>
                                                </div>
                                                <div className="text-[10px] text-right text-slate-400 italic">EK-Gesamt: {pos.partnerTotal} €</div>
                                            </div>
                                            <div className="col-span-12 lg:col-span-4 space-y-2 lg:pl-4 lg:border-l border-slate-100">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">VK (Kunde)</label>
                                                <div className="flex border border-slate-300 rounded overflow-hidden h-9">
                                                    {pos.customerMode === 'flat' ? (
                                                        <input type="number" className="flex-1 px-3 text-sm font-bold text-slate-700 text-right outline-none" value={pos.customerRate} onChange={e => { const n = [...positions]; n[index].customerRate = e.target.value; setPositions(n); }} />
                                                    ) : (
                                                        <input type="number" className="flex-1 px-3 text-sm font-bold text-slate-700 text-right outline-none" value={pos.marginPercent} onChange={e => { const n = [...positions]; n[index].marginPercent = e.target.value; setPositions(n); }} />
                                                    )}
                                                    <div className="bg-white px-2 flex items-center text-[10px] font-bold text-slate-400 border-l border-r border-slate-100">{pos.customerMode === 'flat' ? '€' : '%'}</div>
                                                    <select className="flex-1 w-24  bg-slate-50 text-[11px] font-bold text-slate-600 outline-none min-w-[90px]" value={pos.customerMode === 'flat' ? 'flat' : pos.marginType} onChange={e => {
                                                        const n = [...positions];
                                                        const v = e.target.value;
                                                        if (v === 'flat') { n[index].customerMode = 'flat'; n[index].marginType = 'markup'; }
                                                        else { n[index].customerMode = 'unit'; n[index].marginType = v; }
                                                        setPositions(n);
                                                    }}>
                                                        <option value="markup">Aufschlag</option><option value="discount">Rabatt</option><option value="flat">Pauschal</option>
                                                    </select>
                                                </div>
                                                <div className="text-[10px] text-right text-slate-800 font-bold">VK-Gesamt: {pos.customerTotal} €</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setPositions([...positions, { id: Date.now().toString(), description: 'Zusatzleistung', amount: '1', unit: 'Normzeile', quantity: '1', partnerRate: '0.00', partnerMode: 'unit', customerRate: '0.00', customerMode: 'unit', marginType: 'markup', marginPercent: '0' }])} className="mx-auto flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold uppercase hover:bg-slate-100 transition-all active:scale-95"><FaPlus /> Position hinzufügen</button>
                            </div>
                        </div>

                        {/* Multiple Payments */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-bold">04</div>
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
                                            {payments.map((p, i) => (
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
                                                        {/* Edit Button is implicitly handled by clicking row? No, explicit button better */}
                                                        <button
                                                            onClick={() => handleEditPayment(p)}
                                                            className="text-slate-300 hover:text-brand-600 transition p-1 hover:bg-brand-50 rounded"
                                                        >
                                                            <FaInfoCircle className="text-[10px]" /> {/* Using Info/Edit icon */}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePayment(p.id)}
                                                            className="text-slate-300 hover:text-red-500 transition p-1 hover:bg-red-50 rounded"
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
                                <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">05</div>
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Anmerkungen</h4>
                            </div>
                            <Input isTextArea label="Interne Anmerkungen" placeholder="Wichtige Hinweise zum Projekt..." value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </div>

                    {/* Sidebar / Preview */}
                    <div className="w-full lg:w-80 bg-slate-50 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 h-auto lg:h-full lg:overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
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
                                <div className="flex justify-between text-xs text-slate-500"><span>Zusatzleistungen</span><span>{extraCosts.toFixed(2)} €</span></div>
                                <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-800"><span>Gesamt Netto</span><span>{calcNet.toFixed(2)} €</span></div>
                                <div className="flex justify-between text-[10px] text-slate-400"><span>MwSt. 19%</span><span>{calcTax.toFixed(2)} €</span></div>
                                <div className="pt-2 border-t-2 border-brand-100 flex justify-between text-xl font-black text-slate-900 transition-all"><span>Gesamt</span><span>{calcGross.toFixed(2)} €</span></div>

                                {totalPaid > 0 && (
                                    <div className="pt-2 flex justify-between text-xs text-emerald-600 font-bold border-t border-slate-50">
                                        <span>Geleistete Zahlungen</span>
                                        <span>-{totalPaid.toFixed(2)} €</span>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-slate-100 mt-2 flex justify-between items-center bg-slate-50 -mx-4 -mb-4 p-4 rounded-b">
                                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Restbetrag</span>
                                    <span className={clsx("text-lg font-black", remainingBalance <= 0.01 ? "text-emerald-600" : "text-brand-700")}>
                                        {remainingBalance <= 0.01 ? 'BEZAHLT' : `${remainingBalance.toFixed(2)} €`}
                                    </span>
                                </div>
                            </div>

                            {/* Profit Margin */}
                            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 hover:bg-slate-200/50 transition-colors">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-tighter">Voraussichtl. Gewinn</span>
                                    <span className={clsx("text-xs font-black", profit >= 0 ? "text-slate-800" : "text-red-600")}>{profit.toFixed(2)} €</span>
                                </div>
                                <div className="w-full bg-slate-300 rounded-full h-2 overflow-hidden shadow-inner">
                                    <div className={clsx("h-full transition-all duration-500", profitMargin > 40 ? "bg-emerald-500" : profitMargin > 20 ? "bg-brand-500" : "bg-amber-500")} style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}></div>
                                </div>
                                <div className="text-right mt-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">{profitMargin.toFixed(1)}% Marge</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        {initialData && (
                            <button onClick={handleDelete} className="text-red-500 text-xs font-bold uppercase flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded transition-colors active:scale-95"><FaTrash /> Projekt Löschen</button>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-300 rounded text-xs font-bold uppercase hover:bg-slate-50 transition active:scale-95">Abbrechen</button>
                        <button onClick={handleSubmit} disabled={isLoading || createCustomerMutation.isPending} className="px-8 py-2 bg-brand-700 text-white rounded text-xs font-bold uppercase shadow-lg shadow-brand-500/20 hover:bg-brand-800 transition-all active:scale-95 transform">
                            {isLoading ? 'Speichere...' : initialData ? 'Projekt Aktualisieren' : 'Projekt Anlegen'}
                        </button>
                    </div>
                </div>
            </div>

            <PartnerSelectionModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} onSelect={handlePartnerSelect} />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleSavePayment} initialData={editingPayment} totalAmount={calcGross} />
            <ConfirmDialog isOpen={confirmConfig.isOpen} onCancel={() => setConfirmConfig(p => ({ ...p, isOpen: false }))} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} confirmLabel={confirmConfig.confirmLabel} />
        </div>
    );
};

export default NewProjectModal;
