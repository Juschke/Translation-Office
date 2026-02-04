import React, { useState, useEffect } from 'react';
import {
    FaTimes, FaPlus, FaCalendarAlt, FaFlag,
    FaInfoCircle, FaTrash, FaSearch, FaEye, FaExternalLinkAlt
} from 'react-icons/fa';
import MultiSelect from '../common/MultiSelect';
import SearchableSelect from '../common/SearchableSelect';
import LanguageSelect from '../common/LanguageSelect';
import Input from '../common/Input';
import PartnerSelectionModal from './PartnerSelectionModal';
import PartnerForm from '../forms/PartnerForm';
import ConfirmDialog from '../common/ConfirmDialog';
import DatePicker, { registerLocale } from "react-datepicker";
import { de } from 'date-fns/locale/de';
import clsx from 'clsx';

registerLocale('de', de);

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    // Basic States
    const [name, setName] = useState('');
    const [customer, setCustomer] = useState('');
    const [deadline, setDeadline] = useState('');
    const [source, setSource] = useState('de');
    const [target, setTarget] = useState('en');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');

    // Project Options & Extra Costs
    const [isCertified, setIsCertified] = useState(true);
    const [hasApostille, setHasApostille] = useState(false);
    const [isExpress, setIsExpress] = useState(false);
    const [classification, setClassification] = useState('nein');
    const [copies, setCopies] = useState(0);
    const [copyPrice, setCopyPrice] = useState('5');

    // Unified Position State
    const [positions, setPositions] = useState<any[]>([
        {
            id: Date.now().toString(),
            description: '',
            amount: '1',
            unit: 'Normzeile',
            quantity: '1',
            partnerRate: '0.05',
            partnerMode: 'unit',
            partnerTotal: '0.00',
            customerRate: '0.15',
            customerTotal: '0.00',
            customerMode: 'unit',
            marginType: 'markup',
            marginPercent: '30'
        }
    ]);

    const [docType, setDocType] = useState<string[]>([]);
    const [translator, setTranslator] = useState<any>(null);
    const [totalPrice, setTotalPrice] = useState('');
    const [partnerPrice, setPartnerPrice] = useState('');
    const [downPayment, setDownPayment] = useState('');
    const [notes, setNotes] = useState('');

    // UI States
    const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);

    // Detailed Customer Form States
    const [custType, setCustType] = useState<'private' | 'company' | 'authority'>('private');
    const [custCompany, setCustCompany] = useState('');
    const [custSalutation, setCustSalutation] = useState('Herr');
    const [custFirstName, setCustFirstName] = useState('');
    const [custLastName, setCustLastName] = useState('');
    const [custStreet, setCustStreet] = useState('');
    const [custHouseNo, setCustHouseNo] = useState('');
    const [custZip, setCustZip] = useState('');
    const [custCity, setCustCity] = useState('');
    const [custEmail, setCustEmail] = useState('');

    const [custOptions, setCustOptions] = useState([
        { value: 'TechCorp GmbH', label: 'TechCorp GmbH' },
        { value: 'Kanzlei Schmidt', label: 'Kanzlei Schmidt' },
        { value: 'Creative Agency', label: 'Creative Agency' },
    ]);

    const [partnersList, setPartnersList] = useState([
        { id: 1, name: 'Sabine Müller', email: 's.mueller@partner.de', phone: '+49 123 456789', languages: ['de', 'en', 'fr'], rating: 4.8 },
        { id: 2, name: 'Dr. Jean Luc Picard', email: 'contact@picard-trans.com', phone: '+33 1 2345', languages: ['fr', 'en'], rating: 4.5 },
        { id: 4, name: 'Maria Garcia', email: 'm.garcia@global.lingua.es', phone: '+34 91 123', languages: ['es', 'de'], rating: 5.0 }
    ]);

    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [isNewPartnerMode, setIsNewPartnerMode] = useState(false);

    // New Partner Form State
    const [newPartnerData, setNewPartnerData] = useState<any>(null);

    // Confirmation Dialog State
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

    // Derived Metadata for Sidebar
    const creationDate = initialData?.createdAt || new Date().toLocaleDateString('de-DE');
    const projectManager = initialData?.pm || 'Admin';

    // Synchronize calculations for all positions
    useEffect(() => {
        const updatedPositions = positions.map(pos => {
            const amount = parseFloat(pos.amount) || 0;
            const qty = parseFloat(pos.quantity) || 0;
            const totalUnits = amount * qty;

            // Partner Calculation
            let pRate = parseFloat(pos.partnerRate) || 0;
            let pTotal = 0;

            if (pos.partnerMode === 'unit') {
                pTotal = totalUnits * pRate;
            } else {
                pTotal = pRate;
            }

            // Customer Calculation
            let cTotal = 0;
            let cRate = 0;

            if (pos.customerMode === 'unit') {
                // Calculate based on Margin logic
                const margin = (parseFloat(pos.marginPercent) || 0) / 100;

                // Basis is Partner Total
                // Make sure margin doesn't break math (e.g. infinite)
                if (pos.marginType === 'markup') {
                    cTotal = pTotal * (1 + margin);
                } else if (pos.marginType === 'discount') {
                    // Discount on Partner Cost (Selling for less than cost? Unusual but following user logic)
                    // Or implies Discount on intended price? 
                    // Assuming: Price = Cost * (1 - Discount)
                    cTotal = pTotal * (1 - margin);
                } else {
                    // 'flat' in marginType (shouldnt happen as mode switches)
                    cTotal = pTotal;
                }

                if (totalUnits > 0) {
                    cRate = cTotal / totalUnits;
                }
            } else {
                // Flat Mode: User enters the Total Price directly
                cTotal = parseFloat(pos.customerRate) || 0;
            }

            const newPos = {
                ...pos,
                partnerTotal: pTotal.toFixed(2),
                customerTotal: cTotal.toFixed(2),
            };

            // Only update customerRate calculation if in Unit mode (calculated field)
            // If in Flat mode, we preserve the user's input exactly to allow typing decimals
            if (pos.customerMode === 'unit') {
                newPos.customerRate = cRate.toFixed(4);
            }

            return newPos;
        });

        // Deep comparison to prevent infinite loop
        const isContentChanged = JSON.stringify(updatedPositions) !== JSON.stringify(positions);
        if (isContentChanged) {
            setPositions(updatedPositions);
        }

        // Update Project Totals
        const totalP = updatedPositions.reduce((sum, p) => sum + parseFloat(p.partnerTotal || '0'), 0);
        const totalC = updatedPositions.reduce((sum, p) => sum + parseFloat(p.customerTotal || '0'), 0);

        setPartnerPrice(totalP.toFixed(2));
        setTotalPrice(totalC.toFixed(2));

    }, [positions]);

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || '');
            setCustomer(initialData.client || '');
            setDeadline(initialData.due || '');
            setSource(initialData.source || 'de');
            setTarget(initialData.target || 'en');
            setPriority(initialData.priority || 'medium');
            setIsCertified(initialData.isCertified || false);
            setHasApostille(initialData.hasApostille || false);
            setIsExpress(initialData.isExpress || false);
            setClassification(initialData.classification || 'nein');
            setCopies(initialData.copies || 0);
            setCopyPrice(String(initialData.copyPrice || '5'));

            setDocType(initialData.docType ? (Array.isArray(initialData.docType) ? initialData.docType : [initialData.docType]) : []);
            setTranslator(initialData.translator ? {
                name: initialData.translator,
                email: 'partner@example.com',
                phone: '+49 123 456789',
                rating: 4.8,
                projects: 12
            } : null);
            // Map legacy data to positions if no positions exist
            if (initialData.positions && Array.isArray(initialData.positions)) {
                setPositions(initialData.positions);
            } else {
                setPositions([{
                    id: Date.now().toString(),
                    description: 'Hauptleistung',
                    amount: initialData.vol ? String(initialData.vol).replace(/\D/g, '') || '1' : '1',
                    unit: initialData.vol ? String(initialData.vol).replace(/[0-9\s]/g, '') || 'Wörter' : 'Wörter',
                    quantity: '1',
                    partnerRate: String(initialData.partnerUnitPrice || '0.05'),
                    partnerMode: initialData.partnerPriceMode || 'unit',
                    customerRate: String(initialData.unitPrice || '0.15'),
                    customerMode: initialData.priceMode || 'unit',
                    marginType: 'markup',
                    marginPercent: '30'
                }]);
            }

            setTotalPrice(String(initialData.cost || ''));
            setPartnerPrice(String(initialData.partnerCost || ''));
            setDownPayment(String(initialData.downPayment || ''));

            setIsNewCustomerMode(false);
            resetCustomerForm();
        } else if (isOpen && !initialData) {
            resetForm();
        }
    }, [isOpen, initialData]);

    const resetCustomerForm = () => {
        setCustType('private');
        setCustCompany('');
        setCustSalutation('Herr');
        setCustFirstName('');
        setCustLastName('');
        setCustStreet('');
        setCustHouseNo('');
        setCustZip('');
        setCustCity('');
        setCustEmail('');
    };

    const resetPartnerForm = () => {
        // Obsolete
    };

    const resetForm = () => {
        setName('');
        setCustomer('');
        setDeadline('');
        setSource('de');
        setTarget('en');
        setPriority('low');
        setIsCertified(true);
        setHasApostille(false);
        setIsExpress(false);
        setClassification('nein');
        setCopies(0);
        setCopyPrice('5');
        setIsNewCustomerMode(false);
        resetCustomerForm();
        setDocType([]);
        setTranslator(null);
        setPositions([{
            id: Date.now().toString(),
            description: '',
            amount: '1',
            unit: 'Normzeile',
            quantity: '1',
            partnerRate: '0.05',
            partnerMode: 'unit',
            customerRate: '0.15',
            customerMode: 'unit',
            marginType: 'markup',
            marginPercent: '30'
        }]);
        setTotalPrice('');
        setPartnerPrice('');
        setDownPayment('');
        setNotes('');
        resetPartnerForm();
    };

    if (!isOpen) return null;

    const handleApplyCustomer = () => {
        // Validation logic for customer could be here
        if (custType !== 'private' && !custCompany) return;
        if (!custLastName) return;

        const label = custType === 'private' ? `${custFirstName} ${custLastName}` : `${custCompany} (${custLastName})`;

        // Add to options if not exists
        if (!custOptions.find(o => o.value === label)) {
            setCustOptions(prev => [...prev, { value: label, label }]);
        }

        setCustomer(label);
        setIsNewCustomerMode(false);
    };

    const handleEditCustomer = () => {
        if (!customer) return;

        // Simple mock parsing for demo purposes
        // Real app would fetch customer data by ID
        if (customer.includes('GmbH') || customer.includes('Agency') || customer.includes('Kanzlei')) {
            setCustType('company');
            setCustCompany(customer.split(' (')[0] || customer);
            setCustLastName(customer.includes('(') ? customer.split('(')[1].replace(')', '') : '');
        } else {
            setCustType('private');
            const parts = customer.split(' ');
            setCustFirstName(parts[0] || '');
            setCustLastName(parts.slice(1).join(' ') || '');
        }
        setIsNewCustomerMode(true);
    };

    const handleSubmit = () => {
        // Validation logic
        const newErrors = new Set<string>();
        if (!name) newErrors.add('name');
        if (!customer && !isNewCustomerMode) newErrors.add('customer');
        if (!source) newErrors.add('source');
        if (!target) newErrors.add('target');
        if (!deadline) newErrors.add('deadline');

        setValidationErrors(newErrors);
        if (newErrors.size > 0) return;

        onSubmit({
            ...initialData,
            id: initialData?.id || `P-2024-${Math.floor(Math.random() * 1000) + 1000}`,
            name,
            client: customer,
            source,
            target,
            due: deadline,
            priority,
            isCertified,
            hasApostille,
            isExpress,
            classification,
            copies,
            copyPrice: Number(copyPrice),
            docType,
            translator: translator ? translator.name : '',
            positions,
            cost: Number(totalPrice) || 0,
            partnerCost: Number(partnerPrice) || 0,
            downPayment: Number(downPayment) || 0,
            notes,
        });
        onClose();
        if (!initialData) resetForm();
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

    // Calculations
    const extraCosts = (isCertified ? 5 : 0) + (hasApostille ? 15 : 0) + (isExpress ? 15 : 0) + (classification === 'ja' ? 15 : 0) + (copies * Number(copyPrice) || 0);
    const baseNet = Number(totalPrice) || 0;
    const calcNet = baseNet + extraCosts;
    const calcTax = calcNet * 0.19;
    const calcGross = calcNet + calcTax;
    const remainingBalance = calcGross - (Number(downPayment) || 0);
    const profit = calcNet - (Number(partnerPrice) || 0);
    const profitMargin = calcNet > 0 ? (profit / calcNet) * 100 : 0;

    const handlePartnerSelect = (partner: any) => {
        setTranslator(partner);
        setIsPartnerModalOpen(false);
    };

    const addPosition = () => {
        setPositions([
            ...positions,
            {
                id: Date.now().toString(),
                description: '',
                amount: '1',
                unit: 'Normzeile',
                quantity: '1',
                partnerRate: '0.05',
                partnerMode: 'unit',
                partnerTotal: '0.00',
                customerRate: '0.15',
                customerTotal: '0.00',
                customerMode: 'unit',
                marginType: 'markup',
                marginPercent: '30'
            }
        ]);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm transition-all py-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl mx-4 overflow-hidden transform scale-100 flex flex-col h-[90vh] animate-fadeInUp">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">
                            {initialData ? 'Projekt Editieren' : 'Neues Projekt Erfassen'}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">
                            ID: {initialData?.id || 'Entwurf'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-200/50 rounded-lg p-0.5 border border-slate-300/50 h-9">
                            {['low', 'medium', 'high'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p as any)}
                                    className={clsx(
                                        "px-3 h-full text-[10px] font-bold uppercase rounded-md transition-all flex items-center gap-2",
                                        priority === p ? (
                                            p === 'low' ? "bg-white text-emerald-700 shadow-sm" :
                                                p === 'medium' ? "bg-white text-orange-700 shadow-sm" :
                                                    "bg-white text-red-700 shadow-sm"
                                        ) : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <FaFlag className={clsx("text-[8px]", priority === p ? (p === 'low' ? 'text-emerald-500' : p === 'medium' ? 'text-orange-500' : 'text-red-500') : 'text-slate-400')} />
                                    {p === 'low' ? 'Standard' : p === 'medium' ? 'Dringend' : 'Express'}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Left Column: Form */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar border-r border-slate-200 bg-white">
                        {/* Section: Basisdaten */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">01</div>
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Projekt-Stammdaten</h4>
                            </div>

                            <div className="space-y-6">
                                <Input
                                    label="Projektbezeichnung *"
                                    placeholder="Name des Auftrags..."
                                    value={name}
                                    error={validationErrors.has('name')}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (validationErrors.has('name')) {
                                            const next = new Set(validationErrors);
                                            next.delete('name');
                                            setValidationErrors(next);
                                        }
                                    }}
                                />

                                {/* Customer Section - Full Width */}
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kunde *</label>
                                        {isNewCustomerMode && (
                                            <button onClick={() => setIsNewCustomerMode(false)} className="text-[10px] text-brand-600 font-bold hover:underline flex items-center gap-1">
                                                <FaTimes className="text-xs" /> Abbrechen
                                            </button>
                                        )}
                                    </div>

                                    {!isNewCustomerMode ? (
                                        <div className="space-y-2">
                                            <div className="flex">
                                                <div className="flex-1 min-w-0">
                                                    <div className="bg-white rounded-l border border-r-0 border-slate-300 h-10 flex items-center">
                                                        <SearchableSelect
                                                            options={custOptions}
                                                            value={customer}
                                                            onChange={setCustomer}
                                                            placeholder="Kunden suchen oder auswählen..."
                                                            className="border-0 shadow-none focus:ring-0 rounded-l h-full"
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        resetCustomerForm();
                                                        setIsNewCustomerMode(true);
                                                    }}
                                                    className="h-10 px-4 bg-brand-700 text-white rounded-r hover:bg-brand-800 transition active:scale-95 flex items-center gap-2 shadow-sm border border-brand-700"
                                                    title="Neuen Kunden anlegen"
                                                >
                                                    <FaPlus className="text-xs" />
                                                    <span className="text-xs font-bold uppercase">Neu</span>
                                                </button>
                                            </div>

                                            {customer && (
                                                <div className="flex items-center gap-4 px-1 animate-fadeIn">
                                                    <button onClick={handleEditCustomer} className="text-[10px] font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1.5 group transition">
                                                        <FaEye className="text-[10px] group-hover:scale-110 transition" /> Details ansehen
                                                    </button>
                                                    <span className="text-slate-300">|</span>
                                                    <a href={`/customers/${encodeURIComponent(customer)}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1.5 group">
                                                        <FaExternalLinkAlt className="text-[8px] group-hover:scale-110 transition" /> Kunden-Akte öffnen
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-fadeIn pt-2">
                                            {/* Customer Type Toggle */}
                                            <div className="flex justify-start">
                                                <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm">
                                                    {['private', 'company', 'authority'].map(t => (
                                                        <button
                                                            key={t}
                                                            onClick={() => setCustType(t as any)}
                                                            className={clsx(
                                                                "px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition",
                                                                custType === t ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                            )}
                                                        >
                                                            {t === 'private' ? 'Privatperson' : t === 'company' ? 'Firma' : 'Behörde'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Form Fields in Columns */}
                                            <div className="grid grid-cols-2 gap-4">
                                                {custType !== 'private' && (
                                                    <div className="col-span-2">
                                                        <Input
                                                            placeholder={custType === 'company' ? 'Firmenname' : 'Behördenbezeichnung'}
                                                            value={custCompany}
                                                            onChange={e => setCustCompany(e.target.value)}
                                                        />
                                                    </div>
                                                )}

                                                <div className="col-span-2 grid grid-cols-12 gap-3">
                                                    <div className="col-span-3">
                                                        <Input
                                                            isSelect
                                                            value={custSalutation}
                                                            onChange={e => setCustSalutation(e.target.value)}
                                                        >
                                                            <option>Herr</option><option>Frau</option><option>Dr.</option><option>Prof.</option>
                                                        </Input>
                                                    </div>
                                                    <div className="col-span-4">
                                                        <Input
                                                            placeholder="Vorname"
                                                            value={custFirstName}
                                                            onChange={e => setCustFirstName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-span-5">
                                                        <Input
                                                            placeholder="Nachname"
                                                            value={custLastName}
                                                            onChange={e => setCustLastName(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-span-2 grid grid-cols-4 gap-3">
                                                    <div className="col-span-3">
                                                        <Input
                                                            placeholder="Straße"
                                                            value={custStreet}
                                                            onChange={e => setCustStreet(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <Input
                                                            placeholder="Nr."
                                                            value={custHouseNo}
                                                            onChange={e => setCustHouseNo(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-span-1">
                                                    <Input
                                                        placeholder="PLZ"
                                                        value={custZip}
                                                        onChange={e => setCustZip(e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Input
                                                        placeholder="Stadt"
                                                        value={custCity}
                                                        onChange={e => setCustCity(e.target.value)}
                                                    />
                                                </div>

                                                <div className="col-span-2">
                                                    <Input
                                                        type="email"
                                                        placeholder="E-Mail Adresse"
                                                        value={custEmail}
                                                        onChange={e => setCustEmail(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                <button onClick={handleApplyCustomer} className="px-6 py-2.5 bg-brand-700 text-white rounded text-xs font-bold uppercase hover:bg-brand-800 shadow-md transition active:scale-95 flex items-center gap-2">
                                                    <FaPlus /> Speichern & Übernehmen
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Row: Deadline & Languages */}
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lieferdatum *</label>
                                        <div className="relative h-10">
                                            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs z-10" />
                                            <DatePicker
                                                selected={deadline ? new Date(deadline) : null}
                                                onChange={(date: Date | null) => setDeadline(date ? date.toISOString().split('T')[0] : '')}
                                                dateFormat="dd.MM.yyyy"
                                                locale="de"
                                                className="w-full h-10 border border-slate-300 rounded pl-9 pr-3 py-2 text-sm focus:border-brand-500 outline-none shadow-sm cursor-pointer"
                                                placeholderText="Datum wählen"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <LanguageSelect
                                            label="Ausgangssprache *"
                                            value={source}
                                            onChange={setSource}
                                        />
                                    </div>
                                    <div>
                                        <LanguageSelect
                                            label="Zielsprache *"
                                            value={target}
                                            onChange={setTarget}
                                        />
                                    </div>
                                </div>



                                <div>
                                    <MultiSelect
                                        label="Dokumentenart"
                                        options={[
                                            { value: 'urkunde', label: 'Urkunde / Zeugnis' },
                                            { value: 'vertrag', label: 'Vertrag / Recht' },
                                            { value: 'medizin', label: 'Medizinischer Befund' },
                                            { value: 'web', label: 'Website / Marketing' },
                                            { value: 'technik', label: 'Techn. Dokumentation' }
                                        ]}
                                        value={docType}
                                        onChange={setDocType}
                                        placeholder="Art der Dokumente wählen..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Services & Options */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">02</div>
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Leistungen & Zusatzoptionen</h4>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1">
                                    <Input
                                        label="Beglaubigung (5€)"
                                        isSelect
                                        value={isCertified ? 'ja' : 'nein'}
                                        onChange={(e) => setIsCertified(e.target.value === 'ja')}
                                    >
                                        <option value="nein">Nein</option>
                                        <option value="ja">Ja</option>
                                    </Input>
                                </div>
                                <div className="col-span-1">
                                    <Input
                                        label="Express (+15€)"
                                        isSelect
                                        value={isExpress ? 'ja' : 'nein'}
                                        onChange={(e) => setIsExpress(e.target.value === 'ja')}
                                    >
                                        <option value="nein">Nein</option>
                                        <option value="ja">Ja</option>
                                    </Input>
                                </div>
                                <div className="col-span-1">
                                    <Input
                                        label="Apostille (15€)"
                                        isSelect
                                        value={hasApostille ? 'ja' : 'nein'}
                                        onChange={(e) => setHasApostille(e.target.value === 'ja')}
                                    >
                                        <option value="nein">Nein</option>
                                        <option value="ja">Ja</option>
                                    </Input>
                                </div>
                                <div className="col-span-1">
                                    <Input
                                        label="Führers.- Klassif. (15€)"
                                        isSelect
                                        value={classification}
                                        onChange={(e) => setClassification(e.target.value)}
                                    >
                                        <option value="nein">Nein</option>
                                        <option value="ja">Ja</option>
                                    </Input>
                                </div>
                            </div>

                            <div className="flex items-center gap-10 py-2 mb-2">
                                <div className="flex items-center gap-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kopien</label>
                                    <div className="flex items-center bg-white border border-slate-200 rounded-none overflow-hidden shadow-sm h-10">
                                        <button onClick={() => setCopies(Math.max(0, copies - 1))} className="px-3 h-full hover:bg-slate-50 text-slate-400 font-bold transition">-</button>
                                        <input type="number" readOnly value={copies} className="w-10 text-center text-sm font-bold bg-transparent outline-none" />
                                        <button onClick={() => setCopies(copies + 1)} className="px-3 h-full hover:bg-slate-50 text-slate-400 font-bold transition">+</button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-40">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Stk. Preis</label>
                                    <Input
                                        type="number"
                                        step="0.0001"
                                        value={copyPrice}
                                        onChange={(e) => setCopyPrice(e.target.value)}
                                        endIcon="€"
                                        className="h-10 text-right font-bold"
                                        containerClassName="flex-1"
                                    />
                                </div>
                                <div className="ml-auto flex flex-col items-end">
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-0.5">Kopien Summe</span>
                                    <span className="text-sm font-black text-slate-600">{(copies * Number(copyPrice)).toFixed(2)} €</span>
                                </div>
                            </div>
                        </div>

                        {/* Unified Section: Positions & Calculation */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">03</div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Leistungen & Kalkulation</h4>
                                </div>
                            </div>

                            {/* Partner Selection above positions */}
                            <div className="border-t border-dotted border-slate-300 pt-6 pb-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Partner-Zuweisung (Global)</label>
                                <div className="space-y-4">
                                    {!isNewPartnerMode ? (
                                        <div className="flex px-1">
                                            <div className="flex-1 min-w-0">
                                                <div className="bg-white rounded-l border border-r-0 border-slate-300 h-10 flex items-center shadow-sm">
                                                    <SearchableSelect
                                                        options={partnersList.map(p => ({
                                                            value: p.name,
                                                            label: `${p.name} (${p.languages.join(', ').toUpperCase()})`
                                                        }))}
                                                        value={translator?.name || ''}
                                                        onChange={(val) => {
                                                            const p = partnersList.find(opt => opt.name === val);
                                                            if (p) setTranslator(p);
                                                            else setTranslator({ name: val });
                                                        }}
                                                        placeholder="Übersetzer suchen oder auswählen..."
                                                        className="border-0 shadow-none focus:ring-0 rounded-l h-full"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    resetPartnerForm();
                                                    setIsNewPartnerMode(true);
                                                }}
                                                className="h-10 px-4 bg-brand-700 text-white rounded-r hover:bg-brand-800 transition active:scale-95 flex items-center gap-2 shadow-sm border border-brand-700"
                                                title="Neuen Partner anlegen"
                                            >
                                                <FaPlus className="text-xs" />
                                                <span className="text-xs font-bold uppercase">Neu</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="animate-fadeIn space-y-5 mx-1 relative pt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neuen Partner erfassen</h5>
                                                <button
                                                    onClick={() => setIsNewPartnerMode(false)}
                                                    className="text-[10px] text-red-500 font-bold hover:text-red-700 transition flex items-center gap-1"
                                                >
                                                    <FaTimes className="text-xs" /> Abbrechen
                                                </button>
                                            </div>
                                            <PartnerForm layout="compact" onChange={setNewPartnerData} validationErrors={validationErrors} />
                                            <div className="flex justify-end pt-2">
                                                <button onClick={() => {
                                                    if (!newPartnerData?.firstName || !newPartnerData?.lastName) return;
                                                    const fullNewName = `${newPartnerData.firstName} ${newPartnerData.lastName}`;
                                                    const newPartner = {
                                                        ...newPartnerData,
                                                        id: Date.now(),
                                                        name: fullNewName,
                                                        languages: newPartnerData.languages || []
                                                    };
                                                    setPartnersList(prev => [...prev, newPartner]);
                                                    setTranslator(newPartner);
                                                    setIsNewPartnerMode(false);
                                                }} className="px-6 py-2.5 bg-brand-700 text-white rounded text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-brand-800 transition active:scale-95">Partner übernehmen</button>
                                            </div>
                                        </div>
                                    )}

                                    {!isNewPartnerMode && (
                                        <div className="flex justify-start px-1 mt-2">
                                            <button
                                                onClick={() => setIsPartnerModalOpen(true)}
                                                className="text-[10px] text-blue-600 font-bold hover:underline transition flex items-center gap-1.5 px-1"
                                            >
                                                <FaSearch className="text-[9px]" /> Suche nach weiteren Partnern
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* LEISTUNGEN START */}
                            <div className="space-y-4">
                                {positions.map((pos, index) => (
                                    <div key={pos.id} className="border border-slate-200 rounded-lg mb-4 overflow-hidden shadow-sm bg-white">
                                        {/* Header: Number & Description */}
                                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-400 font-mono">
                                                {String(index + 1).padStart(2, '0')}.
                                            </span>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Positionsbeschreibung (z.B. Übersetzung Dokument...)"
                                                    className="w-full bg-transparent border-none text-sm font-bold text-slate-800 focus:ring-0 placeholder:text-slate-400 p-0"
                                                    value={pos.description}
                                                    onChange={(e) => {
                                                        const newPos = [...positions];
                                                        newPos[index].description = e.target.value;
                                                        setPositions(newPos);
                                                    }}
                                                />
                                            </div>
                                            {positions.length > 1 && (
                                                <button
                                                    onClick={() => setPositions(positions.filter(p => p.id !== pos.id))}
                                                    className="text-slate-300 hover:text-red-500 transition p-1 hover:bg-slate-100 rounded"
                                                    title="Position löschen"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="p-4 grid grid-cols-12 gap-6 items-end">
                                            {/* Column 1: Quantity & Unit */}
                                            <div className="col-span-12 md:col-span-4 space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Menge & Einheit</label>
                                                    <div className="flex gap-2">
                                                        {/* Quantity */}
                                                        <div className="w-16 flex-shrink-0">
                                                            <div className="flex border border-slate-300 rounded overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all bg-white h-9">
                                                                <input
                                                                    type="number"
                                                                    className="w-full h-full px-1 text-center text-sm font-bold text-slate-700 outline-none border-none bg-transparent"
                                                                    value={pos.quantity}
                                                                    onChange={(e) => {
                                                                        const n = [...positions]; n[index].quantity = e.target.value; setPositions(n);
                                                                    }}
                                                                    placeholder="1"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 flex gap-2">
                                                            <div className="flex-1 flex border border-slate-300 rounded overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all bg-white h-9">
                                                                <input
                                                                    type="number"
                                                                    className="w-full h-full px-3 text-sm font-bold text-slate-700 outline-none border-none bg-transparent min-w-0"
                                                                    value={pos.amount}
                                                                    onChange={(e) => {
                                                                        const n = [...positions]; n[index].amount = e.target.value; setPositions(n);
                                                                    }}
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="w-[100px] flex-shrink-0 border border-slate-300 rounded overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all bg-slate-50 h-9">
                                                                <select
                                                                    className="w-full h-full px-2 text-[11px] font-bold text-slate-600 bg-transparent outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                                                                    value={pos.unit}
                                                                    onChange={(e) => {
                                                                        const n = [...positions]; n[index].unit = e.target.value; setPositions(n);
                                                                    }}
                                                                >
                                                                    <option>Wörter</option>
                                                                    <option>Normzeile</option>
                                                                    <option>Seiten</option>
                                                                    <option>Stunden</option>
                                                                    <option>Stück</option>
                                                                    <option>Pauschal</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 2: Purchase (Partner) */}
                                            <div className="col-span-12 md:col-span-4 pl-0 md:pl-6 border-l-0 md:border-l border-slate-100">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Einkauf (Partner)</label>
                                                    <div className="flex border border-slate-300 rounded overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all bg-white h-9">
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            className="flex-1 h-full px-3 text-sm font-bold text-slate-700 outline-none border-none bg-transparent min-w-0"
                                                            value={pos.partnerRate}
                                                            onChange={(e) => {
                                                                const n = [...positions]; n[index].partnerRate = e.target.value; setPositions(n);
                                                            }}
                                                            placeholder="0.00"
                                                        />
                                                        <div className="w-[1px] bg-slate-200"></div>
                                                        <select
                                                            className="w-[110px] flex-shrink-0 h-full px-2 text-[11px] font-bold text-slate-600 bg-slate-50 outline-none cursor-pointer hover:bg-slate-100 transition-colors border-l-0"
                                                            value={pos.partnerMode}
                                                            onChange={(e) => {
                                                                const n = [...positions]; n[index].partnerMode = e.target.value; setPositions(n);
                                                            }}
                                                        >
                                                            <option value="unit">Einheitspreis</option>
                                                            <option value="flat">Pauschal</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 3: Sales (Customer) */}
                                            <div className="col-span-12 md:col-span-4 pl-0 md:pl-6 border-l-0 md:border-l border-slate-100">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Verkauf (Kunde)</label>
                                                    <div className="flex border border-slate-300 rounded overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all bg-white h-9">
                                                        {pos.customerMode === 'unit' ? (
                                                            <>
                                                                <input
                                                                    type="number"
                                                                    className="flex-1 h-full px-3 text-sm font-bold text-slate-700 outline-none border-none bg-transparent min-w-0"
                                                                    value={pos.marginPercent}
                                                                    onChange={(e) => {
                                                                        const n = [...positions];
                                                                        let val = e.target.value;
                                                                        // Validate Max 100% for Discount
                                                                        if (pos.marginType === 'discount' && parseFloat(val) > 100) {
                                                                            val = '100';
                                                                        }
                                                                        n[index].marginPercent = val;
                                                                        n[index].customerMode = 'unit';
                                                                        setPositions(n);
                                                                    }}
                                                                    placeholder="0"
                                                                />
                                                                <div className="w-[1px] bg-slate-200"></div>
                                                                <select
                                                                    className="w-[110px] flex-shrink-0 h-full px-2 text-[11px] font-bold text-slate-600 bg-slate-50 outline-none cursor-pointer hover:bg-slate-100 transition-colors border-l-0"
                                                                    value={`${pos.marginType}`}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        const n = [...positions];
                                                                        if (val === 'flat') {
                                                                            n[index].customerMode = 'flat';
                                                                        } else {
                                                                            n[index].customerMode = 'unit';
                                                                            n[index].marginType = val;
                                                                        }
                                                                        setPositions(n);
                                                                    }}
                                                                >
                                                                    <option value="markup">% Aufschlag</option>
                                                                    <option value="discount">% Rabatt</option>
                                                                    <option value="flat">Pauschal</option>
                                                                </select>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <input
                                                                    type="number"
                                                                    step="0.001"
                                                                    className="flex-1 h-full px-3 text-sm font-bold text-slate-700 outline-none border-none bg-transparent min-w-0"
                                                                    value={pos.customerRate}
                                                                    onChange={(e) => {
                                                                        const n = [...positions]; n[index].customerRate = e.target.value; setPositions(n);
                                                                    }}
                                                                    placeholder="0.00"
                                                                />
                                                                <div className="w-[1px] bg-slate-200"></div>
                                                                <select
                                                                    className="w-[110px] flex-shrink-0 h-full px-2 text-[11px] font-bold text-slate-600 bg-slate-50 outline-none cursor-pointer hover:bg-slate-100 transition-colors border-l-0"
                                                                    value="flat"
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        const n = [...positions];
                                                                        if (val === 'flat') {
                                                                            n[index].customerMode = 'flat';
                                                                        } else {
                                                                            n[index].customerMode = 'unit';
                                                                            n[index].marginType = val;
                                                                        }
                                                                        setPositions(n);
                                                                    }}
                                                                >
                                                                    <option value="markup">% Aufschlag</option>
                                                                    <option value="discount">% Rabatt</option>
                                                                    <option value="flat">Pauschal</option>
                                                                </select>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Position Button - Below List */}
                            {/* Add Position Button - Below List */}
                            <div className="mb-6 flex justify-center">
                                <button
                                    onClick={() => setPositions([...positions, {
                                        id: Date.now().toString(),
                                        description: `Sprachübersetzung ${source.toUpperCase()} - ${target.toUpperCase()}`,
                                        amount: '1',
                                        unit: 'Normzeile',
                                        quantity: '1',
                                        partnerRate: '0.05',
                                        partnerMode: 'unit',
                                        customerRate: '0.15',
                                        customerMode: 'unit',
                                        marginType: 'markup',
                                        marginPercent: '30'
                                    }])}
                                    className="px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-200 rounded text-[9px] font-black uppercase hover:bg-brand-100 transition flex items-center gap-2"
                                >
                                    <FaPlus /> Position hinzufügen
                                </button>
                            </div>


                            {/* Calculation Summary Footer */}
                            <div className="flex justify-end gap-8 pt-6 border-t border-slate-100 items-center">
                                <div className="text-right">
                                    <Input
                                        label="Anzahlung (Brutto)"
                                        type="number"
                                        containerClassName="w-32"
                                        className="text-right font-bold h-9"
                                        value={downPayment}
                                        onChange={(e) => setDownPayment(e.target.value)}
                                        placeholder="0.00"
                                        endIcon="€"
                                    />
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase">Summe Einkauf (Netto)</div>
                                    <div className="text-lg font-black text-slate-700">{partnerPrice} €</div>
                                </div>
                                <div className="text-right px-6 py-2">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase">Summe Kunde (Netto)</div>
                                    <div className="text-xl font-black text-slate-800">{totalPrice} €</div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Input
                                isTextArea
                                label="Interne Anmerkungen"
                                placeholder="Notizen für Projektmanager..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Right Column: Information & Actions */}
                    <div className="w-80 bg-slate-50 flex flex-col shrink-0 border-l border-slate-200 h-full">
                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                            {/* Meta Information Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                                    <FaInfoCircle className="text-slate-400 text-xs" />
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Meta Information</h4>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Erstellt:</span>
                                        <span className="font-bold text-slate-700">{creationDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Manager:</span>
                                        <span className="font-bold text-slate-700">{projectManager}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Status:</span>
                                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 font-bold uppercase text-[9px] rounded-sm">
                                            {initialData?.status || 'Neu'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rechnungsvorschau</h4>

                                <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Basis Netto</span>
                                        <span className="font-medium text-slate-700">{baseNet.toFixed(2)} €</span>
                                    </div>

                                    {/* Extra Costs Breakdown */}
                                    {(isCertified || hasApostille || isExpress || classification === 'ja' || copies > 0) && (
                                        <div className="pt-2 border-t border-slate-100">
                                            <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Zusatzleistungen</div>
                                            {isCertified && (
                                                <div className="flex justify-between items-center text-[10px] text-slate-600 mb-1">
                                                    <span>• Beglaubigung</span>
                                                    <span className="font-medium">5.00 €</span>
                                                </div>
                                            )}
                                            {hasApostille && (
                                                <div className="flex justify-between items-center text-[10px] text-slate-600 mb-1">
                                                    <span>• Apostille</span>
                                                    <span className="font-medium">15.00 €</span>
                                                </div>
                                            )}
                                            {isExpress && (
                                                <div className="flex justify-between items-center text-[10px] text-slate-600 mb-1">
                                                    <span>• Express</span>
                                                    <span className="font-medium">15.00 €</span>
                                                </div>
                                            )}
                                            {classification === 'ja' && (
                                                <div className="flex justify-between items-center text-[10px] text-slate-600 mb-1">
                                                    <span>• Führerschein-Klassifizierung</span>
                                                    <span className="font-medium">15.00 €</span>
                                                </div>
                                            )}
                                            {copies > 0 && (
                                                <div className="flex justify-between items-center text-[10px] text-slate-600 mb-1">
                                                    <span>• Kopien ({copies} × {Number(copyPrice).toFixed(2)} €)</span>
                                                    <span className="font-medium">{(copies * Number(copyPrice)).toFixed(2)} €</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mt-2 pt-2 border-t border-slate-100">
                                                <span>Extras Gesamt</span>
                                                <span>{extraCosts.toFixed(2)} €</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Netto</span>
                                        <span className="text-sm font-bold text-slate-800">{calcNet.toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-400 uppercase">MwSt. 19%</span>
                                        <span className="font-medium text-slate-600">{calcTax.toFixed(2)} €</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Gesamt</span>
                                        <span className="text-base font-black text-slate-800">{calcGross.toFixed(2)} €</span>
                                    </div>
                                    {Number(downPayment) > 0 && (
                                        <div className="flex justify-between items-center text-xs text-emerald-600 pt-1">
                                            <span className="font-bold">- Anzahlung</span>
                                            <span className="font-bold">-{Number(downPayment).toFixed(2)} €</span>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center bg-slate-50 -mx-4 -mb-4 p-4 rounded-b">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Offener Betrag</span>
                                        <span className="text-lg font-black text-brand-700">{remainingBalance.toFixed(2)} €</span>
                                    </div>
                                </div>

                                {/* Compact Profit */}
                                <div className="bg-slate-100 p-3 rounded border border-slate-200">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-bold uppercase text-slate-500">Rohertrag</span>
                                        <span className={clsx("text-xs font-black", profit >= 0 ? "text-slate-700" : "text-red-600")}>{profit.toFixed(2)} €</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                        <div className={clsx("h-full", profitMargin > 20 ? "bg-emerald-500" : profitMargin > 10 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}></div>
                                    </div>
                                    <div className="text-right mt-1">
                                        <span className="text-[9px] font-bold text-slate-400">{profitMargin.toFixed(1)}% Marge</span>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center">
                        {initialData && (
                            <button onClick={handleDelete} className="text-red-500 hover:text-red-700 transition text-xs font-bold uppercase tracking-wider flex items-center gap-2 px-3 py-2 rounded hover:bg-red-50 border border-transparent hover:border-red-100">
                                <FaTrash className="text-[10px]" /> Projekt Löschen
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-600 font-bold rounded text-xs uppercase tracking-widest hover:bg-slate-50 transition shadow-sm">
                            Abbrechen
                        </button>
                        <button onClick={handleSubmit} className="px-8 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded text-xs uppercase tracking-widest shadow-md transition active:scale-95">
                            {initialData ? 'Speichern' : 'Erstellen'}
                        </button>
                    </div>
                </div>
            </div>

            <PartnerSelectionModal
                isOpen={isPartnerModalOpen}
                onClose={() => setIsPartnerModalOpen(false)}
                onSelect={handlePartnerSelect}
            />

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                confirmLabel={confirmConfig.confirmLabel}
            />
        </div >
    );
};

export default NewProjectModal;
