import { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    FaPlus, FaTrash, FaSave, FaArrowLeft, FaBook, FaSearch, FaTimes, FaChevronDown
} from 'react-icons/fa';
import Input from '../components/common/Input';
import { Button } from '../components/ui/button';
import SearchableSelect from '../components/common/SearchableSelect';
import CountrySelect from '../components/common/CountrySelect';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { projectService, settingsService, invoiceService, customerService } from '../api/services';
import CustomerSelect from '../components/common/CustomerSelect';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import { useWorkspaceTabs } from '../context/WorkspaceTabsContext';
import ConfirmModal from '../components/common/ConfirmModal';

const UNITS = ['Wörter', 'Normzeile', 'Seiten', 'Stunden', 'Pauschal', 'Stück', 'Minuten', 'Tage'];

/* ─── UI Styling Tokens (Matching Project Style) ─── */
const SECTION_HEADER = 'flex items-center gap-3 pb-3 mb-1 border-b border-slate-200';

const inlineInput = (invalid = false, align: 'left' | 'right' = 'left', mono = false) =>
    clsx(
        'w-full bg-transparent outline-none border-b-2 pb-px transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        mono ? 'font-mono text-xs' : 'font-medium text-xs',
        align === 'right' ? 'text-right' : 'text-left',
        invalid
            ? 'border-red-300 text-red-500 placeholder:text-red-300'
            : 'border-transparent text-slate-700 placeholder:text-slate-300 hover:border-slate-200 focus:border-brand-primary',
    );

const filterDecimalInput = (raw: string): string => {
    let v = raw.replace(/[^0-9,]/g, '');
    const ci = v.indexOf(',');
    if (ci !== -1) v = v.slice(0, ci + 1) + v.slice(ci + 1).replace(/,/g, '');
    return v;
};
const toEnglish = (v: string) => v.replace(',', '.');
const toGerman = (v: string) => v.replace('.', ',');

/* ─── MiniDropdown for the inline table cells (re-implemented as the shared file is missing) ─── */
const MiniDropdown = ({ value, options, onChange, align = 'right', width }: { value: string, options: any[], onChange: (v: string) => void, align?: 'left' | 'right', width?: string }) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleDown);
        return () => document.removeEventListener('mousedown', handleDown);
    }, [open]);

    return (
        <div ref={containerRef} className="relative inline-block text-right">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-2 py-1 text-2xs font-bold text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 rounded-sm transition-all uppercase tracking-wider h-7"
            >
                {options.find(o => o.value === value)?.label || value}
                <FaChevronDown className={clsx("text-[8px] transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div
                    className={clsx(
                        "absolute z-[100] mt-1 bg-white border border-slate-200 rounded-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95",
                        align === 'right' ? 'right-0' : 'left-0'
                    )}
                    style={width ? { width } : { width: '8rem' }}
                >
                    <div className="flex flex-col py-1">
                        {options.map((o) => (
                            <button
                                key={o.value}
                                type="button"
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                className={clsx(
                                    "w-full text-left px-3 py-2 text-2xs font-bold transition-colors border-b border-slate-50 last:border-0",
                                    value === o.value ? "bg-slate-100 text-brand-primary" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const NewInvoice = () => {
    const navigate = useNavigate();
    const { updateTab, activeTabId, tabs, closeTab } = useWorkspaceTabs();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const isEditMode = !!id;
    const defaultType = (searchParams.get('type') as 'invoice' | 'credit_note') || 'invoice';
    const preselectedProjectId = searchParams.get('project_id') || '';

    const [selectedProjectId, setSelectedProjectId] = useState<string>(preselectedProjectId);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [catalogOpen, setCatalogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const catalogButtonRef = useRef<HTMLButtonElement>(null);
    const catalogDropdownRef = useRef<HTMLDivElement>(null);
    const catalogSearchRef = useRef<HTMLInputElement>(null);
    const lastAutoPaymentText = useRef('');
    const lastAutoIntroText = useRef('');
    const [confirmConfig, setConfirmConfig] = useState<any>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const [formData, setFormData] = useState({
        type: defaultType,
        invoice_number: '',
        date: dayjs().format('YYYY-MM-DD'),
        due_date: dayjs().add(14, 'day').format('YYYY-MM-DD'),
        delivery_date: dayjs().format('YYYY-MM-DD'),
        shipping: '0.00',
        discount: '0.00',
        discount_mode: 'fixed' as 'fixed' | 'percent',
        paid_amount: '0.00',
        currency: 'EUR',
        status: 'draft',
        notes: '',
        intro_text: '',
        footer_text: '',
        project_id: '',
        customer_id: '',
        service_period: `Leistungsmonat ${dayjs().format('MM/YYYY')}`,
        tax_exemption: 'none',
        tax_rate: '19.00',
        leitweg_id: '',
        customer_reference: '',
        salutation: '',
        payment_text: '',
    });

    const [items, setItems] = useState<any[]>([]);

    // ── Dirty State Logic ──
    const currentValuesStr = JSON.stringify({ formData, items, selectedProjectId });
    const initialValuesStr = useRef(currentValuesStr);

    useEffect(() => {
        const hasChanged = currentValuesStr !== initialValuesStr.current;
        if (activeTabId) updateTab(activeTabId, { isDirty: hasChanged });
    }, [currentValuesStr, activeTabId, updateTab]);

    const resetDirtyState = useCallback((newData?: any) => {
        initialValuesStr.current = JSON.stringify(newData || { formData, items, selectedProjectId });
        if (activeTabId) updateTab(activeTabId, { isDirty: false });
    }, [formData, items, selectedProjectId, activeTabId, updateTab]);

    // ── Queries ──────────────────────────────────────────────────────────────
    const { data: existingInvoice, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['invoices', id],
        queryFn: () => invoiceService.getById(Number(id)),
        enabled: isEditMode,
    });


    const { data: projects = [] } = useQuery({
        queryKey: ['projects', 'active'],
        queryFn: () => projectService.getAll(),
    });

    const { data: customersResponse = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: () => customerService.getAll(),
    });

    const { data: services = [] } = useQuery({
        queryKey: ['settings', 'services'],
        queryFn: () => settingsService.getServices(),
    });

    const { data: companyData } = useQuery({
        queryKey: ['companySettings'],
        queryFn: settingsService.getCompany
    });

    // ── Mutations ─────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: invoiceService.create,
        onSuccess: () => {
            resetDirtyState();
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Rechnung erfolgreich erstellt');
            navigate('/invoices');
        },
        onError: () => toast.error('Fehler beim Erstellen der Rechnung'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => invoiceService.update(Number(id), data),
        onSuccess: () => {
            resetDirtyState();
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Rechnung erfolgreich aktualisiert');
            navigate('/invoices');
        },
        onError: () => toast.error('Fehler beim Aktualisieren der Rechnung'),
    });


    const isLoading = createMutation.isPending || updateMutation.isPending;

    // ── Live-Berechnungen ─────────────────────────────────────────────────────
    const computedFinancials = useMemo(() => {
        let totalNet = 0;
        let totalTax = 0;
        const taxBreakdown: Record<string, number> = {};

        items.forEach(item => {
            const net = parseFloat(item.total) || 0;
            const rate = parseFloat(item.tax_rate) || 0;
            const tax = net * (rate / 100);
            totalNet += net;
            totalTax += tax;

            if (rate > 0) {
                const key = rate.toString();
                taxBreakdown[key] = (taxBreakdown[key] || 0) + tax;
            }
        });

        const shipping = parseFloat(formData.shipping) || 0;
        const discountVal = parseFloat(formData.discount) || 0;
        const discountTotal = formData.discount_mode === 'percent'
            ? (totalNet * (discountVal / 100))
            : discountVal;

        const paid = parseFloat(formData.paid_amount) || 0;

        const amount_net = totalNet;
        const amount_tax = totalTax;
        const amount_gross = amount_net + amount_tax + shipping - discountTotal;
        const isCN = formData.type === 'credit_note';
        const due = isCN ? (amount_gross - paid) : Math.max(0, amount_gross - paid);

        return { amount_net, amount_tax, amount_gross, amount_due: due, taxBreakdown, discount_amount: discountTotal };
    }, [items, formData.shipping, formData.discount, formData.discount_mode, formData.paid_amount, formData.type]);
    const projectOptions = useMemo(() => {
        return (Array.isArray(projects) ? projects : []).map((p: any) => {
            const pNumber = p.project_number || 'Entwurf';
            let cName = 'Unbekannt';
            if (p.customer) {
                cName = p.customer.company_name || `${p.customer.first_name || ''} ${p.customer.last_name || ''}`.trim();
            }
            return { value: p.id.toString(), label: `${pNumber} - ${p.project_name} (${cName})` };
        });
    }, [projects]);

    const customerOptions = useMemo(() => {
        const list = customersResponse?.data || customersResponse || [];
        return (list as any[]).map((c: any) => ({
            value: c.id.toString(),
            label: c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || `ID: ${c.id}`
        }));
    }, [customersResponse]);

    const handleEditCustomer = (custId: string) => {
        const list = customersResponse?.data || customersResponse || [];
        const cust = (list as any[]).find(c => c.id.toString() === custId);
        if (cust) {
            setEditingCustomer(cust);
            setShowCustomerModal(true);
        }
    };

    const activeServices = useMemo(() => {
        return (Array.isArray(services) ? services : []).filter(
            (s: any) => s.status === 'active' &&
                (search === '' || s.name.toLowerCase().includes(search.toLowerCase())),
        );
    }, [services, search]);

    const activeProject = useMemo(() => {
        if (selectedProjectId) {
            const found = (Array.isArray(projects) ? projects : []).find((p: any) => p.id.toString() === selectedProjectId);
            if (found) return found;
        }
        return null;
    }, [selectedProjectId, projects]);

    const activeCustomer = useMemo(() => {
        const list = customersResponse?.data || customersResponse || [];
        if (formData.customer_id) {
            return (list as any[]).find((c: any) => c.id.toString() === formData.customer_id);
        }
        if (activeProject?.customer) return activeProject.customer;
        return null;
    }, [activeProject, formData.customer_id, customersResponse]);

    const customerDisplayNo = useMemo(() => {
        if (!activeCustomer) return '–';
        if (activeCustomer.customer_number) return activeCustomer.customer_number;
        if ((activeCustomer as any).display_id) return (activeCustomer as any).display_id;

        const prefix = companyData?.customer_id_prefix || 'K';
        return `${prefix}${activeCustomer.id.toString().padStart(4, '0')}`;
    }, [activeCustomer, companyData]);

    // ── Init from existing invoice (edit mode) ────────────────────────────────
    useEffect(() => {
        if (isEditMode && existingInvoice) {
            const inv = existingInvoice;
            setSelectedProjectId(inv.project_id?.toString() || '');
            setFormData({
                type: inv.type || 'invoice',
                invoice_number: inv.invoice_number,
                date: inv.date ? inv.date.split('T')[0] : dayjs().format('YYYY-MM-DD'),
                due_date: inv.due_date ? inv.due_date.split('T')[0] : '',
                delivery_date: inv.delivery_date ? inv.delivery_date.split('T')[0] : '',
                shipping: (inv.shipping_cents ? inv.shipping_cents / 100 : parseFloat(inv.shipping) || 0).toFixed(2),
                discount: (inv.discount_cents ? inv.discount_cents / 100 : parseFloat(inv.discount) || 0).toFixed(2),
                discount_mode: (inv.discount_mode || 'fixed') as 'fixed' | 'percent',
                paid_amount: (inv.paid_amount_cents ? inv.paid_amount_cents / 100 : parseFloat(inv.paid_amount) || 0).toFixed(2),
                currency: inv.currency || 'EUR',
                status: inv.status,
                notes: inv.notes || '',
                project_id: inv.project_id?.toString() || '',
                customer_id: inv.customer_id?.toString() || '',
                service_period: inv.service_period || '',
                tax_exemption: inv.tax_exemption || 'none',
                tax_rate: inv.tax_rate?.toString() || '19.00',
                leitweg_id: inv.snapshot_customer_leitweg_id || inv.leitweg_id || '',
                customer_reference: (inv as any).customer_reference || '',
                intro_text: inv.intro_text || '',
                footer_text: inv.footer_text || '',
                salutation: (inv as any).salutation || '',
                payment_text: (inv as any).payment_text || '',
            });
            const loadedItems = inv.items ? inv.items.map((i: any) => ({
                id: i.id || Math.random().toString(36).substr(2, 9),
                description: i.description,
                quantity: (parseFloat(i.quantity) || 0).toFixed(2),
                unit: i.unit,
                price: (i.unit_price_cents ? i.unit_price_cents / 100 : parseFloat(i.price) || 0).toFixed(2),
                total: (i.total_cents ? i.total_cents / 100 : parseFloat(i.total) || 0).toFixed(2),
                price_mode: i.price_mode || 'unit',
                discount_percent: (parseFloat(i.discount_percent) || 0).toFixed(2),
                tax_rate: i.tax_rate !== undefined ? i.tax_rate : inv.tax_rate || '19.00',
            })) : [];
            if (inv.items) setItems(loadedItems);

            // Set initial state for dirty check after loading
            resetDirtyState({
                formData: { ...formData, ...inv, date: inv.date?.split('T')[0] },
                items: loadedItems,
                selectedProjectId: inv.project_id?.toString() || ''
            });
        }
    }, [isEditMode, existingInvoice, resetDirtyState]);

    // ── Init für neuen Beleg ──────────────────────────────────────────────────
    useEffect(() => {
        if (!isEditMode) {
            const year = new Date().getFullYear().toString();
            invoiceService.getNextNumber(year).then((data: any) => {
                setFormData(prev => ({ ...prev, invoice_number: data.next_number }));
            });
        }
    }, [isEditMode]);

    // Rechnungsnummer aktualisieren wenn Datum sich ändert (nur neu)
    useEffect(() => {
        if (!isEditMode && formData.date) {
            const year = new Date(formData.date).getFullYear().toString();
            invoiceService.getNextNumber(year).then((data: any) => {
                setFormData(prev => ({ ...prev, invoice_number: data.next_number }));
            });
        }
    }, [formData.date, isEditMode]);

    // ── Positionen aus Projekt übernehmen (nur neu) ───────────────────────────
    useEffect(() => {
        if (activeProject && !isEditMode) {
            const isCN = formData.type === 'credit_note';
            const mult = isCN ? -1 : 1;

            if (activeProject.positions && activeProject.positions.length > 0) {
                const standardItems = activeProject.positions.map((p: any) => {
                    const mode = p.customerMode || p.customer_mode || 'unit';
                    const qty = parseFloat(p.amount) || parseFloat(p.quantity) || 1;
                    const price = (parseFloat(p.customerRate || p.customer_rate || p.price) || 0) * mult;
                    const total = (mode === 'fixed' ? price : qty * price);
                    return {
                        id: p.id || Math.random().toString(36).substr(2, 9),
                        description: p.description || p.name || 'Position',
                        quantity: qty.toFixed(2),
                        unit: p.unit || 'Wörter',
                        price: price.toFixed(2),
                        total: total.toFixed(2),
                        price_mode: mode,
                        discount_percent: '0.00',
                        tax_rate: formData.tax_rate || '19.00',
                    };
                });

                const extraItems: any[] = [];
                const addExtra = (desc: string, price: number) => {
                    const p = price * mult;
                    extraItems.push({ id: Math.random().toString(36).substr(2, 9), description: desc, quantity: 1, unit: 'Pauschal', price: p, total: p, price_mode: 'fixed', discount_percent: 0 });
                };

                if (activeProject.isCertified || activeProject.is_certified) addExtra('Beglaubigung', 5.00);
                if (activeProject.hasApostille || activeProject.has_apostille) addExtra('Apostille', 15.00);
                if (activeProject.isExpress || activeProject.is_express) addExtra('Express-Zuschlag', 15.00);
                if (activeProject.classification === 'ja' || activeProject.classification === true) addExtra('Klassifizierung', 15.00);

                const copies = parseInt(activeProject.copies || activeProject.copies_count || '0');
                if (copies > 0) {
                    const cp = parseFloat(activeProject.copyPrice || activeProject.copy_price || '5');
                    const p = cp * mult;
                    extraItems.push({ id: Math.random().toString(36).substr(2, 9), description: 'Kopien', quantity: copies, unit: 'Stk', price: p, total: copies * p, price_mode: 'unit', discount_percent: 0 });
                }
                setItems([...standardItems, ...extraItems]);
            } else {
                const net = (parseFloat(activeProject.financials?.netTotal || activeProject.price_total || 0)) * mult;
                setItems([{ id: Math.random().toString(36).substr(2, 9), description: activeProject.project_name || activeProject.name || 'Übersetzungsleistung', quantity: 1, unit: 'Pauschal', price: net, total: net, price_mode: 'fixed', discount_percent: 0, tax_rate: formData.tax_rate || '19.00' }]);
            }

            let servicePeriod = formData.service_period;
            if (!servicePeriod && activeProject.start_date) {
                const start = fmtDate(activeProject.start_date);
                const end = activeProject.delivery_date ? fmtDate(activeProject.delivery_date) : fmtDate(new Date().toISOString().split('T')[0]);
                servicePeriod = `${start} – ${end}`;
            }
            setFormData(prev => ({
                ...prev,
                project_id: activeProject.id?.toString() || '',
                customer_id: (activeProject.customer_id || activeProject.customer?.id)?.toString() || '',
                service_period: servicePeriod || prev.service_period,
                delivery_date: activeProject.delivery_date ? activeProject.delivery_date.split('T')[0] : prev.delivery_date,
                paid_amount: (activeProject.payments || []).reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0).toFixed(2),
                leitweg_id: activeProject.customer?.leitweg_id || activeProject.customer_leitweg_id || '',
            }));
        }
    }, [activeProject]);

    // ── project_id mit selectedProjectId synchron halten ─────────────────────
    useEffect(() => {
        if (selectedProjectId) {
            setFormData(prev => ({ ...prev, project_id: selectedProjectId }));
        }
    }, [selectedProjectId]);

    const updateCatalogCoords = useCallback(() => {
        if (catalogButtonRef.current) {
            const rect = catalogButtonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 4,
                left: Math.max(rect.right - 320, 10),
                width: 320
            });
        }
    }, []);

    useLayoutEffect(() => {
        if (catalogOpen) {
            updateCatalogCoords();
            const closeOnScroll = (e: Event) => {
                if (catalogDropdownRef.current && catalogDropdownRef.current.contains(e.target as Node)) return;
                setCatalogOpen(false);
            };
            window.addEventListener('scroll', closeOnScroll, true);
            window.addEventListener('resize', updateCatalogCoords);
            return () => {
                window.removeEventListener('scroll', closeOnScroll, true);
                window.removeEventListener('resize', updateCatalogCoords);
            };
        }
    }, [catalogOpen, updateCatalogCoords]);

    useEffect(() => {
        if (catalogOpen) setTimeout(() => catalogSearchRef.current?.focus(), 50);
    }, [catalogOpen]);

    // ── Texte & Steuern basierend auf Kunde/Wahl aktualisieren ─────────────
    useEffect(() => {
        if (!isEditMode && activeCustomer) {
            const salutation = activeCustomer.salutation || 'Sehr geehrte Damen und Herren';
            let greeting = salutation;
            if (salutation.toLowerCase().includes('geehrte')) {
                greeting = `${salutation} ${activeCustomer.contact_person || (activeCustomer.last_name ? activeCustomer.last_name : '')}`;
            }

            const newIntro = `${greeting},\n\nwir bedanken uns für den Auftrag und erlauben uns, die folgenden Leistungen in Rechnung zu stellen:`;

            setFormData(prev => {
                const shouldUpdate = !prev.intro_text || prev.intro_text === lastAutoIntroText.current;
                if (shouldUpdate) {
                    lastAutoIntroText.current = newIntro;
                    return { ...prev, intro_text: newIntro, customer_id: activeCustomer.id?.toString() || prev.customer_id };
                }
                return { ...prev, customer_id: activeCustomer.id?.toString() || prev.customer_id };
            });
        }
    }, [activeCustomer, isEditMode]);

    // Zahlungsbedingungen basierend auf Kunde & Datum
    useEffect(() => {
        if (!isEditMode && activeCustomer) {
            const days = activeCustomer.payment_terms_days !== undefined ? parseInt(activeCustomer.payment_terms_days) : 14;
            const newDueDate = dayjs(formData.date).add(days, 'day').format('YYYY-MM-DD');
            const newPaymentText = days === 0
                ? `Zahlbar sofort nach Erhalt der Rechnung ohne Abzug.`
                : `Zahlbar innerhalb von ${days} Tagen bis zum ${fmtDate(newDueDate)} ohne Abzug.`;

            setFormData(prev => {
                const shouldUpdate = !prev.payment_text || prev.payment_text === lastAutoPaymentText.current;
                if (shouldUpdate) {
                    lastAutoPaymentText.current = newPaymentText;
                    return { ...prev, payment_text: newPaymentText, due_date: newDueDate };
                }
                return prev;
            });
        }
    }, [activeCustomer, formData.date, isEditMode]);

    useEffect(() => {
        if (formData.tax_exemption === '§19_ustg') {
            setFormData(prev => ({
                ...prev,
                tax_rate: '0.00',
                footer_text: 'Umsatzsteuerbefreit gemäß Kleinunternehmerregelung (§ 19 UStG).'
            }));
        } else if (formData.tax_exemption === 'reverse_charge') {
            setFormData(prev => ({
                ...prev,
                tax_rate: '0.00',
                footer_text: 'Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge gem. § 13b UStG).'
            }));
        } else if (formData.tax_exemption === 'none' && parseFloat(formData.tax_rate) === 0) {
            setFormData(prev => ({ ...prev, tax_rate: '19.00' }));
        }
    }, [formData.tax_exemption]);

    // ── customer_id aus geladenem Projekt befüllen (falls noch leer) ──────────
    useEffect(() => {
        if (activeProject?.customer_id && !formData.customer_id) {
            setFormData(prev => ({ ...prev, customer_id: activeProject.customer_id.toString() }));
        }
    }, [activeProject]);

    // ── Item-Verwaltung ────────────────────────────────────────────────────────
    const addItem = () => setItems(prev => [...prev, { id: Date.now().toString(), description: '', quantity: '1.00', unit: 'Wörter', price: '0.00', total: 0, price_mode: 'unit', discount_percent: '0.00', tax_rate: formData.tax_rate || '19.00' }]);
    const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
    const parseDecimal = (v: any) => parseFloat(String(v).replace(',', '.')) || 0;

    const updateItem = (id: string, field: string, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: value };
            if (['quantity', 'price', 'price_mode', 'discount_percent', 'discount_mode'].includes(field)) {
                const mode = updated.price_mode || 'unit';
                const qty = parseDecimal(updated.quantity);
                const price = parseDecimal(updated.price);
                const discountVal = parseDecimal(updated.discount_percent);
                const baseTotal = mode === 'fixed' ? price : qty * price;

                if (updated.discount_mode === 'fixed') {
                    updated.total = baseTotal - discountVal;
                } else {
                    updated.total = baseTotal * (1 - (discountVal / 100));
                }
            }
            return updated;
        }));
    };

    const addService = (service: any) => {
        setItems(prev => [...prev, {
            id: Date.now().toString(),
            description: service.name,
            quantity: '1.00',
            unit: service.unit || 'Wörter',
            price: (parseFloat(service.base_price) || 0).toFixed(2),
            total: (parseFloat(service.base_price) || 0).toFixed(2),
            price_mode: 'unit',
            discount_percent: '0.00',
            tax_rate: formData.tax_rate || '19.00'
        }]);
        setCatalogOpen(false);
        setSearch('');
    };

    // ── Hilfsfunktionen ────────────────────────────────────────────────────────
    const fmtDate = (d: string) => {
        if (!d) return '–';
        try { return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return d; }
    };
    const fmtEur = (v: number | string) => (parseFloat(v as string) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';


    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = (targetStatus?: string) => {
        const { invoice_number, ...submitData } = formData;
        const payload = (isEditMode ? { ...formData, ...computedFinancials, items } : { ...submitData, ...computedFinancials, items }) as any;
        if (targetStatus) {
            payload.status = targetStatus;
        }

        if (isEditMode) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleCancel = () => {
        if (activeTabId) {
            const currentTab = tabs.find(t => t.id === activeTabId);
            if (currentTab?.isDirty) {
                setConfirmConfig({
                    isOpen: true,
                    title: 'Änderungen verwerfen?',
                    message: 'Sie haben ungespeicherte Änderungen. Möchten Sie diese wirklich verwerfen und den Tab schließen?',
                    type: 'danger',
                    confirmLabel: 'Schließen & Verwerfen',
                    onConfirm: () => {
                        closeTab(activeTabId);
                    }
                });
            } else {
                closeTab(activeTabId);
            }
        } else {
            navigate('/invoices');
        }
    };

    if (isEditMode && isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                Rechnung wird geladen...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F0F2F5] pb-12">
            {/* ── Top Navigation Bar ── */}
            <div className="relative  bg-white border-b border-slate-200 px-6 py-6 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCancel}
                        className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">
                            {isEditMode ? 'Rechnung bearbeiten' : 'Rechnung erstellen'}
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">
                            {formData.invoice_number ? `Beleg-Nr: ${formData.invoice_number}` : 'Neuer Beleg-Entwurf'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="px-6 h-10 text-xs font-bold bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    >
                        Abbrechen
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleSubmit('draft')}
                        disabled={!formData.customer_id || isLoading}
                        className="px-4 h-10 text-[11px] font-bold border-brand-primary/20 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10"
                    >
                        Entwurf speichern
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => { }}
                        className="px-4 h-9 text-xs font-semibold border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    >
                        Vorschau
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => { }}
                        className="px-4 h-9 text-xs font-semibold border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    >
                        PDF
                    </Button>
                    <Button
                        onClick={() => handleSubmit('issued')}
                        disabled={!formData.customer_id || items.length === 0 || isLoading}
                        className="px-5 h-9 text-xs font-bold bg-brand-primary hover:bg-brand-primary/90 text-white shadow-sm flex items-center gap-2"
                    >
                        <FaSave className="text-2xs" />
                        {isLoading ? 'Speichern...' : (isEditMode ? 'Änderungen speichern' : 'Beleg jetzt buchen')}
                    </Button>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* ── Main Content Area (Left) ── */}
                    <div className="flex-1 space-y-6 w-full">

                        {/* Section: Projekt Verknüpfung */}
                        <section className="bg-transparent space-y-2 mb-8">
                            <h3 className="text-sm font-bold text-slate-800 ml-1">Projekt-Zuordnung</h3>
                            <div className="bg-white p-6 rounded-sm border border-slate-200/60 shadow-sm">
                                <div className="max-w-xl space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Projekt verknüpfen (empfohlen)</label>
                                    <SearchableSelect
                                        placeholder="Suchen Sie nach einem Projekt (Name oder Nummer)..."
                                        options={projectOptions}
                                        value={selectedProjectId}
                                        onChange={(val) => {
                                            setSelectedProjectId(val);
                                            const proj = (projects as any[]).find(p => p.id.toString() === val);
                                            if (proj) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    customer_id: proj.customer_id?.toString() || proj.customer?.id?.toString() || '',
                                                    project_id: val
                                                }));
                                            }
                                        }}
                                    />
                                    <p className="text-2xs text-slate-400 italic">Durch die Auswahl eines Projekts werden Leistungen und Kundendaten automatisch übernommen.</p>
                                </div>
                            </div>
                        </section>



                        {/* Section: Kundenangaben (Single Card with 2-Column Grid) */}
                        <section className="bg-transparent space-y-2 mb-8">
                            <h3 className="text-sm font-bold text-slate-800 ml-1">Kundenangaben</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6 bg-white p-6 rounded-sm border border-slate-200/60 shadow-sm">
                                {/* Left Column: Address */}
                                <div className="space-y-4">

                                    <div className="space-y-3">
                                        <CustomerSelect
                                            options={customerOptions}
                                            value={formData.customer_id}
                                            onChange={(val) => setFormData(prev => ({ ...prev, customer_id: val }))}
                                            placeholder="Kunden suchen oder neu anlegen..."
                                        />
                                    </div>
                                    <Input
                                        placeholder="Anrede / Name / Firma"
                                        value={activeCustomer ? `${activeCustomer.salutation || ''} ${activeCustomer.company_name || `${activeCustomer.first_name || ''} ${activeCustomer.last_name || ''}`.trim()}`.trim() : ''}
                                        readOnly
                                        className="h-11 bg-white border-slate-200"
                                    />
                                    <Input
                                        placeholder="Adresszusatz"
                                        value={activeCustomer?.address_zusatz || ''}
                                        readOnly
                                        className="h-11 bg-white border-slate-200"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            placeholder="Straße"
                                            value={activeCustomer?.address_street || ''}
                                            readOnly
                                            className="h-11 bg-white border-slate-200 col-span-3"
                                        />
                                        <Input
                                            placeholder="Nr."
                                            value={activeCustomer?.address_house_no || ''}
                                            readOnly
                                            className="h-11 bg-white border-slate-200 col-span-1"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            placeholder="PLZ"
                                            value={activeCustomer?.address_zip || ''}
                                            readOnly
                                            className="h-11 bg-white border-slate-200 col-span-1"
                                        />
                                        <Input
                                            placeholder="Ort"
                                            value={activeCustomer?.address_city || ''}
                                            readOnly
                                            className="h-11 bg-white border-slate-200 col-span-3"
                                        />
                                    </div>
                                    <CountrySelect
                                        value={activeCustomer?.address_country || 'Deutschland'}
                                        onChange={() => { }}
                                        className="w-full"
                                    />
                                    {activeCustomer && (
                                        <div className="flex justify-end mt-2 animate-fadeIn">
                                            <button
                                                type="button"
                                                onClick={() => handleEditCustomer(activeCustomer.id.toString())}
                                                className="text-[12px] font-bold text-brand-primary hover:underline transition-colors flex items-center gap-1 px-3 py-1.5 "
                                            >
                                                Kunde bearbeiten
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Metadata */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <label className="text-sm font-medium text-slate-600">Rechnungsnummer</label>
                                        <Input
                                            value={formData.invoice_number || ''}
                                            placeholder="automatisch"
                                            readOnly
                                            className="h-11 bg-white border-slate-200 text-slate-500 italic"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <label className="text-sm font-medium text-slate-600">Kundennummer</label>
                                        <Input
                                            value={customerDisplayNo}
                                            readOnly
                                            className="h-11 bg-slate-50 border-slate-200 font-mono text-slate-500"
                                            placeholder="–"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <label className="text-sm font-medium text-slate-600">Datum</label>
                                        <DatePicker
                                            format="DD.MM.YYYY"
                                            value={formData.date ? dayjs(formData.date) : null}
                                            onChange={(val) => setFormData({ ...formData, date: val ? val.format('YYYY-MM-DD') : '' })}
                                            className="h-11 w-full rounded-md border-slate-200 bg-white"
                                            placeholder="15.07.2025"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <label className="text-sm font-medium text-slate-600">Zahlungsziel</label>
                                        <DatePicker
                                            format="DD.MM.YYYY"
                                            value={formData.due_date ? dayjs(formData.due_date) : null}
                                            onChange={(val) => setFormData({ ...formData, due_date: val ? val.format('YYYY-MM-DD') : '' })}
                                            className="h-11 w-full rounded-md border-slate-200 bg-white"
                                            placeholder="Zahlbar bis..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <label className="text-sm font-medium text-slate-600">Leistungszeitraum</label>
                                        <Input
                                            value={formData.service_period}
                                            onChange={e => setFormData({ ...formData, service_period: e.target.value })}
                                            className="h-11 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Kopfbereich (Belegtitel) */}
                        <section className="bg-transparent space-y-2 mb-8">
                            <h3 className="text-sm font-bold text-slate-800 ml-1">Kopfbereich</h3>
                            <div className="bg-white p-6 rounded-sm border border-slate-200/60 shadow-sm space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-2xs font-bold text-slate-400 uppercase tracking-widest pl-1">Belegtitel</label>
                                    <select
                                        className="w-full h-11 border-slate-200 border text-base font-medium focus:border-brand-primary outline-none rounded-md px-4 bg-white"
                                        value={formData.type}
                                        disabled
                                    >
                                        <option value="invoice">Rechnung</option>
                                        <option value="credit_note">Gutschrift</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-2xs font-bold text-slate-400 uppercase tracking-widest pl-1">Steuersatz</label>
                                        <select
                                            className="w-full h-11 border-slate-200 border text-sm font-medium focus:border-slate-800 outline-none rounded-md px-4 bg-white"
                                            value={formData.tax_exemption === 'none' ? formData.tax_rate : formData.tax_exemption}
                                            onChange={e => {
                                                const v = e.target.value;
                                                if (v === '19.00' || v === '7.00') setFormData({ ...formData, tax_exemption: 'none', tax_rate: v });
                                                else setFormData({ ...formData, tax_exemption: v, tax_rate: '0.00' });
                                            }}>
                                            <option value="19.00">19% MWSt (Standard)</option>
                                            <option value="7.00">7% MWSt</option>
                                            <option value="§19_ustg">Steuerbefreit (§ 19 UStG)</option>
                                            <option value="reverse_charge">Steuerbefreit (Reverse Charge)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-2xs font-bold text-slate-400 uppercase tracking-widest pl-1">Leitweg-ID</label>
                                        <Input
                                            value={formData.leitweg_id}
                                            onChange={e => setFormData({ ...formData, leitweg_id: e.target.value })}
                                            className="h-11 bg-white"
                                            placeholder="z.B. 0101-12345-67"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-2xs font-bold text-slate-400 uppercase tracking-widest pl-1">Kundenreferenz</label>
                                        <Input
                                            value={formData.customer_reference}
                                            onChange={e => setFormData({ ...formData, customer_reference: e.target.value })}
                                            className="h-11 bg-white"
                                            placeholder="z.B. Bestellnummer / Projektname"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-2xs font-bold text-slate-400 uppercase tracking-widest pl-1">Einleitungstext</label>
                                    <textarea
                                        className="w-full min-h-[100px] border border-slate-200 rounded-md p-4 text-sm focus:border-brand-primary outline-none transition-colors bg-white shadow-sm"
                                        placeholder="Vielen Dank für Ihren Auftrag..."
                                        value={formData.intro_text}
                                        onChange={e => setFormData({ ...formData, intro_text: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section: Belegpositionen */}
                        <section className="bg-transparent space-y-2 mb-8">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-sm font-bold text-slate-800 ml-1">Leistungsübersicht</h3>
                                <div className="flex items-center gap-2">
                                    <Button
                                        ref={catalogButtonRef}
                                        variant="default"
                                        size="sm"
                                        className={clsx("h-8 text-[11px] font-bold", catalogOpen && "ring-2 ring-brand-primary ring-offset-1")}
                                        onClick={() => { setCatalogOpen(!catalogOpen); setSearch(''); }}
                                    >
                                        <FaBook className="mr-1.5" /> LEISTUNGSKATALOG
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                                <div className={clsx(SECTION_HEADER, 'px-6 pt-5 hidden')}></div>

                                {catalogOpen && createPortal(
                                    <div
                                        ref={catalogDropdownRef}
                                        className="fixed z-[9999] w-80 border border-slate-200 rounded-sm bg-white shadow-2xl overflow-hidden animate-fadeIn"
                                        style={{
                                            top: coords.top,
                                            left: coords.left,
                                            pointerEvents: 'auto'
                                        }}
                                    >
                                        <div className="border-b border-slate-100 bg-white relative shrink-0">
                                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                            <input
                                                ref={catalogSearchRef}
                                                type="text"
                                                placeholder="Leistung suchen…"
                                                autoFocus
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                                className="w-full pl-9 pr-8 py-2.5 border-none text-xs focus:outline-none text-slate-700 placeholder:text-slate-400"
                                            />
                                            {search && (
                                                <FaTimes
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 cursor-pointer text-xs"
                                                    onClick={() => setSearch('')}
                                                />
                                            )}
                                        </div>
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                            {activeServices.length > 0 ? (
                                                activeServices.map((s: any) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => addService(s)}
                                                        className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 border-b border-slate-50 last:border-0 group transition-colors flex justify-between items-center"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-700 group-hover:text-brand-primary">{s.name}</span>
                                                            <span className="text-2xs text-slate-400 uppercase tracking-widest">{s.unit || 'Stk.'}</span>
                                                        </div>
                                                        <div className="text-right flex flex-col font-mono text-2xs text-slate-500">
                                                            <span>{(parseFloat(s.base_price) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-xs text-slate-400 italic">Keine Leistungen gefunden</div>
                                            )}
                                        </div>
                                    </div>,
                                    document.body
                                )}

                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[1000px]">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100/50">
                                                <th className="px-3 py-2 w-10 text-center text-2xs font-bold text-slate-400 uppercase tracking-widest">#</th>
                                                <th className="px-3 py-2 text-2xs font-bold text-slate-400 uppercase tracking-widest">Beschreibung</th>
                                                <th className="px-3 py-2 w-20 text-right text-2xs font-bold text-slate-400 uppercase tracking-widest">Menge</th>
                                                <th className="px-3 py-2 w-32 text-right text-2xs font-bold text-slate-400 uppercase tracking-widest">Einheit</th>
                                                <th className="px-3 py-2 w-36 text-right text-2xs font-bold text-slate-400 uppercase tracking-widest">Einzelpreis (€)</th>
                                                <th className="px-3 py-2 w-24 text-right text-2xs font-bold text-slate-400 uppercase tracking-widest">MwSt.</th>
                                                <th className="px-3 py-2 w-36 text-right text-2xs font-bold text-slate-400 uppercase tracking-widest">Rabatt</th>
                                                <th className="px-3 py-2 w-32 text-right text-2xs font-bold text-slate-500 uppercase tracking-widest italic">Gesamt (€)</th>
                                                <th className="px-3 py-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {items.map((item, idx) => (
                                                <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-3 py-3 text-center text-2xs font-bold text-slate-300">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <input
                                                            type="text"
                                                            value={item.description}
                                                            placeholder="Leistungsbeschreibung..."
                                                            className={inlineInput(item.description.trim() === '')}
                                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={toGerman(String(item.quantity || ''))}
                                                            className={inlineInput((parseFloat(item.quantity) || 0) <= 0, 'right', true)}
                                                            onChange={(e) => {
                                                                const filtered = filterDecimalInput(e.target.value);
                                                                updateItem(item.id, 'quantity', toEnglish(filtered));
                                                            }}
                                                            onBlur={(e) => updateItem(item.id, 'quantity', (parseFloat(toEnglish(e.target.value)) || 0).toFixed(2))}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex justify-end">
                                                            <MiniDropdown
                                                                value={UNITS.includes(item.unit) ? item.unit : (item.unit || 'Wörter')}
                                                                options={UNITS.map(u => ({ value: u, label: u }))}
                                                                onChange={(val: string) => updateItem(item.id, 'unit', val)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={toGerman(String(item.price || ''))}
                                                            className={inlineInput(false, 'right', true)}
                                                            onChange={(e) => {
                                                                const filtered = filterDecimalInput(e.target.value);
                                                                updateItem(item.id, 'price', toEnglish(filtered));
                                                            }}
                                                            onBlur={(e) => updateItem(item.id, 'price', (parseFloat(toEnglish(e.target.value)) || 0).toFixed(2))}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex justify-end">
                                                            <MiniDropdown
                                                                value={item.tax_rate?.toString() || '19.00'}
                                                                options={[
                                                                    { value: '19.00', label: '19%' },
                                                                    { value: '7.00', label: '7%' },
                                                                    { value: '0.00', label: '0%' }
                                                                ]}
                                                                onChange={(val) => updateItem(item.id, 'tax_rate', val)}
                                                                width="80px"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={toGerman(String(item.discount_percent || '0'))}
                                                                className={clsx(inlineInput(false, 'right', true), 'w-14')}
                                                                onChange={(e) => {
                                                                    const filtered = filterDecimalInput(e.target.value);
                                                                    updateItem(item.id, 'discount_percent', toEnglish(filtered));
                                                                }}
                                                            />
                                                            <MiniDropdown
                                                                value={item.discount_mode || 'percent'}
                                                                options={[
                                                                    { value: 'percent', label: '%' },
                                                                    { value: 'fixed', label: '€' }
                                                                ]}
                                                                onChange={(val) => updateItem(item.id, 'discount_mode', val)}
                                                                width="60px"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-right">
                                                        <span className="font-bold text-[11px] text-slate-800 tabular-nums">
                                                            {fmtEur(item.total)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-sm transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <FaTrash size={10} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Table Footer: Center Add Button */}
                                    <div className="border-t border-dashed border-slate-200 flex justify-center py-4 bg-slate-50/20">
                                        <button
                                            onClick={addItem}
                                            className="flex items-center gap-1.5 px-6 py-2 text-[11px] font-bold text-slate-500 border border-dashed border-slate-300 rounded-md hover:border-brand-primary hover:text-brand-primary hover:bg-white transition-all shadow-sm"
                                        >
                                            <FaPlus className="text-2xs" /> POSITION HINZUFÜGEN
                                        </button>
                                    </div>

                                    {/* Summary Block (Integrated into table area) */}
                                    {items.length > 0 && (
                                        <div className="border-t-2 border-slate-100 bg-slate-50/30 p-6 space-y-2">
                                            <div className="flex justify-between items-center text-xs text-slate-500 font-medium max-w-md ml-auto">
                                                <span className="uppercase tracking-widest text-2xs font-bold text-slate-400">Summe Netto</span>
                                                <span className="text-slate-700 tabular-nums">{fmtEur(computedFinancials.amount_net)}</span>
                                            </div>
                                            {Object.entries(computedFinancials.taxBreakdown).map(([rate, amount]) => (
                                                <div key={rate} className="flex justify-between items-center text-xs text-slate-500 font-medium max-w-md ml-auto">
                                                    <span className="uppercase tracking-widest text-2xs font-bold text-slate-400">MwSt. {parseFloat(rate)}%</span>
                                                    <span className="text-slate-600 tabular-nums">{fmtEur(amount as number)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-200 max-w-md ml-auto">
                                                <span className="uppercase tracking-widest text-xs font-black text-slate-900">Gesamtbetrag</span>
                                                <span className="text-lg font-black text-brand-primary tabular-nums italic">
                                                    {fmtEur(computedFinancials.amount_gross)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Section: Zahlungsbedingungen & Footer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section className="bg-transparent space-y-2 h-full">
                                <h4 className="text-sm font-bold text-slate-800 ml-1">Zahlungsbedingungen</h4>
                                <div className="bg-white rounded-sm border border-slate-200/60 shadow-sm p-5">
                                    <textarea
                                        className="w-full h-32 border border-slate-200 rounded-sm p-3 text-sm focus:border-brand-primary outline-none transition-colors"
                                        placeholder="Z.B. Zahlbar innerhalb von 14 Tagen..."
                                        value={formData.payment_text}
                                        onChange={e => setFormData({ ...formData, payment_text: e.target.value })}
                                    />
                                </div>
                            </section>
                            <section className="bg-transparent space-y-2 h-full">
                                <h4 className="text-sm font-bold text-slate-800 ml-1">Freitext (Fußzeile)</h4>
                                <div className="bg-white rounded-sm border border-slate-200/60 shadow-sm p-5">
                                    <textarea
                                        className="w-full h-32 border border-slate-200 rounded-sm p-3 text-sm focus:border-brand-primary outline-none transition-colors"
                                        placeholder="Optionaler abschließender Text (z.B. Vielen Dank für Ihren Auftrag!)"
                                        value={formData.footer_text}
                                        onChange={e => setFormData({ ...formData, footer_text: e.target.value })}
                                    />
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* ── Sidebar (Right) ── */}
                    <div className="w-full lg:w-96 space-y-6 sticky top-24">

                        {/* Beleg-Historie & Meta (Zusätzliche Infos) */}
                        <section className="bg-transparent space-y-2">
                            <h4 className="text-sm font-bold text-slate-800 ml-1">Zusätzliche Infos</h4>
                            <div className="bg-white rounded-sm border border-slate-200/60 shadow-sm p-6 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Status</span>
                                        <span className="font-bold text-brand-primary uppercase text-2xs tracking-wider">{formData.status === 'draft' ? 'Entwurf' : formData.status}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Währung</span>
                                        <span className="font-bold">{formData.currency}</span>
                                    </div>
                                    <div className="flex justify-between text-xs pt-3 border-t border-slate-50">
                                        <span className="text-slate-400">Erstellt am</span>
                                        <span className="font-medium text-slate-600">{fmtDate(formData.date)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Summary Card */}
                        <section className="bg-transparent space-y-2">
                            <h3 className="text-sm font-bold text-slate-800 ml-1">Zusammenfassung</h3>
                            <div className="bg-white p-6 rounded-sm border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="space-y-4">
                                    {/* 1. Netto Summe (Basis) */}
                                    <div className="flex justify-between items-center h-2 text-sm text-slate-500">
                                        <span>Netto</span>
                                        <span className="font-mono text-slate-900">{fmtEur(computedFinancials.amount_net)}</span>
                                    </div>

                                    {/* 2. Editable Adjustments */}
                                    <div className="pt-2 border-t border-slate-100 space-y-1">
                                        <div className="flex justify-between items-center h-8 text-sm text-slate-500 group">
                                            <span className="group-hover:text-slate-700 transition-colors">Versandkosten</span>
                                            <div className="flex items-center gap-0 font-mono text-slate-900 border-b border-transparent hover:border-slate-200 transition-all">
                                                <input
                                                    type="number"
                                                    value={formData.shipping}
                                                    onChange={e => setFormData({ ...formData, shipping: e.target.value })}
                                                    className="w-20 bg-transparent border-none p-0 text-right focus:outline-none focus:ring-0 font-mono text-slate-900"
                                                />
                                                <span className="font-mono text-slate-900">€</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center h-8 text-sm text-slate-500 group">
                                            <span className="group-hover:text-slate-700 transition-colors">Rabatt</span>
                                            <div className="flex items-center gap-0 font-mono text-slate-900 border-b border-transparent hover:border-slate-200 transition-all">
                                                <input
                                                    type="number"
                                                    value={formData.discount}
                                                    onChange={e => setFormData({ ...formData, discount: e.target.value })}
                                                    className="w-16 bg-transparent border-none p-0 text-right focus:outline-none focus:ring-0 font-mono text-slate-900"
                                                />
                                                <span className="font-mono text-slate-900">€</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Tax Breakdown */}
                                    <div className="pt-2 border-t border-slate-100 space-y-1">
                                        <div className="flex justify-between items-center h-8 text-sm text-slate-600">
                                            <span>Umsatzsteuer {parseFloat(formData.tax_rate)}%</span>
                                            <span className="font-mono text-slate-900">{fmtEur(computedFinancials.amount_tax)}</span>
                                        </div>
                                        {Object.entries(computedFinancials.taxBreakdown).map(([rate, amount]) => (
                                            parseFloat(rate) !== parseFloat(formData.tax_rate) && (
                                                <div key={rate} className="flex justify-between items-center h-5 text-[11px] text-slate-400 italic">
                                                    <span>davon {parseFloat(rate)}% MwSt</span>
                                                    <span className="font-mono">{fmtEur(amount as number)}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>

                                    {/* 4. Final Totals */}
                                    <div className="pt-4 mt-2 border-t-2 border-slate-100 space-y-3">
                                        <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                                            <span>Gesamtbetrag</span>
                                            <span className="text-lg tabular-nums">
                                                {fmtEur(computedFinancials.amount_gross)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                                            <span className="uppercase tracking-tight text-2xs">Restforderung</span>
                                            <span className="text-lg tabular-nums">
                                                {fmtEur(computedFinancials.amount_due)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div >
            </div >

            {/* ── Action Footer Bar (Simplified & Relative) ── */}
            < div className="mt-12 flex justify-end items-center gap-3 pt-8 border-t border-slate-200" >
                <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="px-5 h-9 text-xs font-semibold border-slate-200 text-slate-500 hover:bg-slate-50 uppercase tracking-wider"
                >
                    Abbrechen
                </Button>
                <Button
                    onClick={() => handleSubmit('draft')}
                    disabled={!formData.customer_id || isLoading}
                    className="px-5 h-9 text-xs font-bold border-brand-primary/20 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 uppercase tracking-wider"
                >
                    Als Entwurf speichern
                </Button>
                <Button
                    onClick={() => handleSubmit('issued')}
                    disabled={!formData.customer_id || items.length === 0 || isLoading}
                    className="px-8 h-9 text-xs font-bold bg-brand-primary hover:bg-brand-primary/90 text-white shadow-sm uppercase tracking-wider flex items-center gap-2"
                >
                    <FaSave className="text-2xs" />
                    {isLoading ? 'Speichern...' : (isEditMode ? 'Änderungen übernehmen' : 'Beleg jetzt buchen')}
                </Button>
            </div >
            <NewCustomerModal
                isOpen={showCustomerModal}
                onClose={() => {
                    setShowCustomerModal(false);
                    setEditingCustomer(null);
                }}
                initialData={editingCustomer}
                onSubmit={(d) => {
                    if (editingCustomer) {
                        customerService.update(editingCustomer.id, d).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['customers'] });
                            setShowCustomerModal(false);
                            setEditingCustomer(null);
                            toast.success('Kunde aktualisiert');
                        });
                    } else {
                        // This logic is already handled by CustomerSelect's quick add, 
                        // but if we trigger it from here for a "New" mode:
                        customerService.create(d).then((res) => {
                            queryClient.invalidateQueries({ queryKey: ['customers'] });
                            setFormData(prev => ({ ...prev, customer_id: res.id.toString() }));
                            setShowCustomerModal(false);
                            toast.success('Kunde angelegt');
                        });
                    }
                }}
            />
            <ConfirmModal isOpen={confirmConfig.isOpen} onCancel={() => setConfirmConfig((p: any) => ({ ...p, isOpen: false }))} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} confirmLabel={confirmConfig.confirmLabel} />
        </div >
    );
}

export default NewInvoice;
