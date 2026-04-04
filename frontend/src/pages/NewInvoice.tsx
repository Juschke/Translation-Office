import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    FaPlus, FaTrash, FaSave, FaArrowLeft, FaGripVertical
} from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import Input from '../components/common/Input';
import { Button } from '../components/ui/button';
import SearchableSelect from '../components/common/SearchableSelect';
import { MiniDropdown } from '../components/modals/ProjectPositionsTable';
import CountrySelect from '../components/common/CountrySelect';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { projectService, settingsService, invoiceService, customerService } from '../api/services';
import CustomerSelect from '../components/common/CustomerSelect';

const UNITS = ['Wörter', 'Normzeile', 'Seiten', 'Stunden', 'Pauschal', 'Stück', 'Minuten', 'Tage'];

const NewInvoice = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const isEditMode = !!id;
    const defaultType = (searchParams.get('type') as 'invoice' | 'credit_note') || 'invoice';
    const preselectedProjectId = searchParams.get('project_id') || '';

    const [selectedProjectId, setSelectedProjectId] = useState<string>(preselectedProjectId);
    const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

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
        intro_text: 'Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihren Auftrag und das damit verbundene Vertrauen. Anbei erhalten Sie die Rechnung über die von uns erbrachten Leistungen.',
        footer_text: '',
        project_id: '',
        customer_id: '',
        service_period: `Leistungsmonat ${dayjs().format('MM/YYYY')}`,
        tax_exemption: 'none',
        tax_rate: '19.00',
        leitweg_id: '',
        customer_reference: '',
        salutation: '',
    });

    const [items, setItems] = useState<any[]>([]);

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
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Rechnung erfolgreich erstellt');
            navigate('/invoices');
        },
        onError: () => toast.error('Fehler beim Erstellen der Rechnung'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => invoiceService.update(Number(id), data),
        onSuccess: () => {
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

    const serviceOptions = useMemo(() => {
        return (Array.isArray(services) ? services : []).map((s: any) => ({
            value: s.id.toString(),
            label: `${s.name} (${(parseFloat(s.base_price) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € / ${s.unit || 'Stk'})`,
        }));
    }, [services]);

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
                shipping: (inv.shipping_cents ? inv.shipping_cents / 100 : inv.shipping || 0).toFixed(2),
                discount: (inv.discount_cents ? inv.discount_cents / 100 : inv.discount || 0).toFixed(2),
                discount_mode: (inv.discount_mode || 'fixed') as 'fixed' | 'percent',
                paid_amount: (inv.paid_amount_cents ? inv.paid_amount_cents / 100 : inv.paid_amount || 0).toFixed(2),
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
            });
            if (inv.items) {
                setItems(inv.items.map((i: any) => ({
                    id: i.id || Math.random().toString(36).substr(2, 9),
                    description: i.description,
                    quantity: i.quantity,
                    unit: i.unit,
                    price: i.unit_price_cents ? i.unit_price_cents / 100 : i.price,
                    total: i.total_cents ? i.total_cents / 100 : i.total,
                    price_mode: i.price_mode || 'unit',
                    discount_percent: i.discount_percent || 0,
                    tax_rate: i.tax_rate !== undefined ? i.tax_rate : inv.tax_rate || '19.00',
                })));
            }
        }
    }, [isEditMode, existingInvoice]);

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
                        quantity: qty,
                        unit: p.unit || 'Wörter',
                        price,
                        total,
                        price_mode: mode,
                        discount_percent: 0,
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

    // ── Item-Verwaltung ────────────────────────────────────────────────────────
    const addItem = () => setItems(prev => [...prev, { id: Date.now().toString(), description: '', quantity: 1, unit: 'Wörter', price: 0, total: 0, price_mode: 'unit', discount_percent: 0, tax_rate: formData.tax_rate || '19.00' }]);
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

    const addService = (serviceId: string) => {
        const service = (services as any[]).find((s: any) => s.id.toString() === serviceId);
        if (service) setItems(prev => [...prev, {
            id: Date.now().toString(),
            description: service.name,
            quantity: 1,
            unit: service.unit || 'Wörter',
            price: parseFloat(service.base_price) || 0,
            total: parseFloat(service.base_price) || 0,
            price_mode: 'unit',
            discount_percent: 0,
            tax_rate: formData.tax_rate || '19.00'
        }]);
    };

    // ── Inline-Cell-Editing ────────────────────────────────────────────────────
    const filterDecimalInvoice = (raw: string): string => {
        let v = raw.replace(/[^0-9,]/g, '');
        const ci = v.indexOf(',');
        if (ci !== -1) v = v.slice(0, ci + 1) + v.slice(ci + 1).replace(/,/g, '');
        return v;
    };

    const renderItemCell = (id: string, field: string, value: string, type: 'text' | 'number' = 'text', className: string = '') => {
        const isEditing = editingCell?.id === id && editingCell?.field === field;
        const isNumeric = type === 'number';

        if (isEditing) {
            return (
                <input
                    autoFocus
                    type="text"
                    inputMode={isNumeric ? 'decimal' : 'text'}
                    defaultValue={isNumeric ? String(value).replace('.', ',') : value}
                    className={clsx('w-full bg-white border-2 border-slate-900 rounded-sm px-2 py-1 outline-none text-xs font-medium shadow-sm', className)}
                    onChange={isNumeric ? (e) => { e.target.value = filterDecimalInvoice(e.target.value); } : undefined}
                    onBlur={(e) => {
                        const raw = e.target.value;
                        updateItem(id, field, isNumeric ? String(parseDecimal(raw)) : raw);
                        setEditingCell(null);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const raw = (e.target as HTMLInputElement).value;
                            updateItem(id, field, isNumeric ? String(parseDecimal(raw)) : raw);
                            setEditingCell(null);
                        }
                        if (e.key === 'Escape') setEditingCell(null);
                    }}
                />
            );
        }

        const displayValue = isNumeric
            ? (parseDecimal(value)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : value;

        return (
            <div
                onClick={() => setEditingCell({ id, field })}
                className={clsx('cursor-pointer hover:bg-slate-50 hover:text-slate-900 px-2 py-1 rounded-sm transition', className)}
                title="Klicken zum Bearbeiten"
            >
                {displayValue || '-'}
            </div>
        );
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

    const onDragEnd = (result: DropResult) => {
        if (!result.destination || isLoading) return;
        const reordered = Array.from(items);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);
        setItems(reordered);
    };

    if (isEditMode && isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                Rechnung wird geladen...
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden max-h-screen">
            {/* ── Top Navigation Bar ── */}
            <div className="relative bg-white border-b border-slate-200 px-6 py-6 flex justify-between items-center shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/invoices')}
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
                        onClick={() => navigate('/invoices')}
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
                        onClick={() => { }} // Placeholder
                        className="px-4 h-9 text-xs font-semibold border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    >
                        Vorschau
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => { }} // Placeholder
                        className="px-4 h-9 text-xs font-semibold border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    >
                        PDF
                    </Button>
                    <Button
                        onClick={() => handleSubmit('issued')}
                        disabled={!formData.customer_id || items.length === 0 || isLoading}
                        className="px-5 h-9 text-xs font-bold bg-brand-primary hover:bg-brand-primary/90 text-white shadow-sm flex items-center gap-2"
                    >
                        <FaSave className="text-[10px]" />
                        {isLoading ? 'Speichern...' : (isEditMode ? 'Änderungen speichern' : 'Beleg jetzt buchen')}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F0F2F5] py-8">
                <div className="max-w-[1400px] mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">

                        {/* ── Main Content Area (Left) ── */}
                        <div className="flex-1 space-y-6 w-full">

                            {/* Section: Projekt Verknüpfung */}
                            <section className="bg-transparent space-y-2 mb-8">
                                <h3 className="text-sm font-bold text-slate-800 ml-1">Projekt-Zuordnung</h3>
                                <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm">
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
                                        <p className="text-[10px] text-slate-400 italic">Durch die Auswahl eines Projekts werden Leistungen und Kundendaten automatisch übernommen.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Kundenangaben */}
                            <section className="bg-transparent space-y-2 mb-8">
                                <h3 className="text-sm font-bold text-slate-800 ml-1">Kundenangaben</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6 bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm">
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
                                        <div className="grid grid-cols-4 gap-3">
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
                                        <div className="grid grid-cols-4 gap-3">
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
                                    </div>

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

                            {/* Section: Kopfbereich */}
                            <section className="bg-transparent space-y-2 mb-8">
                                <h3 className="text-sm font-bold text-slate-800 ml-1">Kopfbereich</h3>
                                <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Belegtitel</label>
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
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Steuersatz</label>
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
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Leitweg-ID</label>
                                            <Input
                                                value={formData.leitweg_id}
                                                onChange={e => setFormData({ ...formData, leitweg_id: e.target.value })}
                                                className="h-11 bg-white"
                                                placeholder="z.B. 0101-12345-67"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Kundenreferenz</label>
                                            <Input
                                                value={formData.customer_reference}
                                                onChange={e => setFormData({ ...formData, customer_reference: e.target.value })}
                                                className="h-11 bg-white"
                                                placeholder="z.B. Bestellnummer / Projektname"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Einleitungstext</label>
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
                                <div className="flex justify-between items-center ml-1">
                                    <h3 className="text-sm font-bold text-slate-800">Leistungsübersicht</h3>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={addItem}
                                        className="h-8 text-[11px] font-bold bg-brand-primary hover:bg-brand-primary/90 text-white shadow-sm"
                                    >
                                        <FaPlus className="mr-1.5 text-[10px]" /> Position hinzufügen
                                    </Button>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                                    <div className="p-6 pb-0 space-y-4">
                                        <div className="w-full lg:w-1/2">
                                            <SearchableSelect
                                                label="Aus Dienstleistungskatalog hinzufügen"
                                                placeholder="Suchen Sie nach vordefinierten Leistungen..."
                                                options={serviceOptions}
                                                value=""
                                                onChange={(val) => { if (val) addService(val); }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-0 overflow-x-auto">
                                        <DragDropContext onDragEnd={onDragEnd}>
                                            <table className="w-full text-left border-collapse min-w-[900px]">
                                                <thead>
                                                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        <th className="px-4 py-2 w-12 text-center">#</th>
                                                        <th className="px-4 py-2">Beschreibung</th>
                                                        <th className="px-4 py-2 w-20 text-right">Menge</th>
                                                        <th className="px-4 py-2 w-24 text-right">Einheit</th>
                                                        <th className="px-4 py-2 w-24 text-right">Preis (€)</th>
                                                        <th className="px-4 py-2 w-20 text-right">Steuer</th>
                                                        <th className="px-4 py-2 w-20 text-right">Rabatt</th>
                                                        <th className="px-4 py-2 w-32 text-right">Gesamtpreis</th>
                                                        <th className="px-4 py-2 w-10"></th>
                                                    </tr>
                                                </thead>
                                                <Droppable droppableId="invoice-items">
                                                    {(provided) => (
                                                        <tbody
                                                            {...provided.droppableProps}
                                                            ref={provided.innerRef}
                                                            className="divide-y divide-slate-50"
                                                        >
                                                            {items.map((item, idx) => (
                                                                <Draggable key={item.id} draggableId={item.id} index={idx}>
                                                                    {(draggableProvided, snapshot) => (
                                                                        <tr
                                                                            ref={draggableProvided.innerRef}
                                                                            {...draggableProvided.draggableProps}
                                                                            className={clsx(
                                                                                "group transition-colors",
                                                                                snapshot.isDragging ? "bg-slate-100 shadow-md ring-1 ring-slate-200 z-50" : "hover:bg-slate-50/50"
                                                                            )}
                                                                        >
                                                                            <td className="px-4 py-2 text-center text-[10px] font-mono text-slate-300">
                                                                                <div className="flex items-center gap-1">
                                                                                    <div {...draggableProvided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-slate-200 hover:text-slate-400 transition-colors">
                                                                                        <FaGripVertical size={10} />
                                                                                    </div>
                                                                                    {idx + 1}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-2">
                                                                                {renderItemCell(item.id, 'description', item.description, 'text', 'text-xs font-medium text-slate-700 w-full bg-transparent border-none')}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right">
                                                                                {renderItemCell(item.id, 'quantity', String(item.quantity), 'number', 'text-right font-mono text-[11px] text-slate-600 border-none')}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right">
                                                                                <div className="flex justify-end">
                                                                                    <MiniDropdown
                                                                                        value={UNITS.includes(item.unit) ? item.unit : (item.unit || 'Wörter')}
                                                                                        options={UNITS.map(u => ({ value: u, label: u }))}
                                                                                        onChange={(val: string) => updateItem(item.id, 'unit', val)}
                                                                                        width="25px"
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right">
                                                                                <div className="flex items-center justify-end gap-1">
                                                                                    {renderItemCell(
                                                                                        item.id,
                                                                                        'price',
                                                                                        String(item.price),
                                                                                        'number',
                                                                                        clsx(
                                                                                            'text-right font-mono text-[11px] font-semibold border-none',
                                                                                            (parseFloat(item.price) || 0) === 0 ? 'text-slate-400' : 'text-slate-900'
                                                                                        )
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right">
                                                                                <div className="flex justify-end items-center">
                                                                                    <MiniDropdown
                                                                                        value={item.tax_rate?.toString() || '19.00'}
                                                                                        options={[
                                                                                            { value: '19.00', label: '19%' },
                                                                                            { value: '7.00', label: '7%' },
                                                                                            { value: '0.00', label: '0%' }
                                                                                        ]}
                                                                                        onChange={(val: string) => updateItem(item.id, 'tax_rate', val)}
                                                                                        width="25px"
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right">
                                                                                <div className="flex justify-end items-center gap-1">
                                                                                    <div className="flex-1 min-w-[30px]">
                                                                                        {renderItemCell(item.id, 'discount_percent', String(item.discount_percent || '0'), 'number', 'text-right font-mono text-[11px] text-slate-400 border-none')}
                                                                                    </div>
                                                                                    <MiniDropdown
                                                                                        value={item.discount_mode || 'percent'}
                                                                                        options={[
                                                                                            { value: 'percent', label: '%' },
                                                                                            { value: 'fixed', label: '€' }
                                                                                        ]}
                                                                                        onChange={(val: string) => updateItem(item.id, 'discount_mode', val)}
                                                                                        width="25px"
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right font-bold text-slate-900 tabular-nums text-[11px]">
                                                                                {fmtEur(item.total)}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-center">
                                                                                <button
                                                                                    onClick={() => removeItem(item.id)}
                                                                                    className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                                                                >
                                                                                    <FaTrash size={10} />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                            {items.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400 italic text-sm">
                                                                        Fügen Sie Leistungen über den Katalog oder eine manuelle Zeile hinzu.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    )}
                                                </Droppable>
                                            </table>
                                        </DragDropContext>

                                        {items.length > 0 && (
                                            <div className="bg-slate-50/50 border-t-2 border-slate-100 italic">
                                                <div className="flex justify-end items-center px-4 py-1.5 border-b border-slate-100">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-4">Summe Netto</span>
                                                    <span className="text-right font-black text-slate-800 tabular-nums text-xs min-w-[120px]">
                                                        {fmtEur(computedFinancials.amount_net)}
                                                    </span>
                                                </div>
                                                {Object.entries(computedFinancials.taxBreakdown).map(([rate, amount]) => (
                                                    <div key={rate} className="flex justify-end items-center px-4 py-1 border-b border-slate-50">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-4">zzgl. Umsatzsteuer {parseFloat(rate)}%</span>
                                                        <span className="text-right font-mono text-slate-600 tabular-nums text-[11px] min-w-[120px]">
                                                            {fmtEur(amount as number)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={addItem}
                                            className="h-9 text-xs font-bold border-brand-primary/30 text-brand-primary hover:text-white hover:bg-brand-primary bg-brand-primary/5 shadow-sm px-8"
                                        >
                                            <FaPlus className="mr-2 text-[10px]" /> Position hinzufügen
                                        </Button>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Zahlungsbedingungen & Footer */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <section className="bg-transparent space-y-2 h-full">
                                    <h4 className="text-sm font-bold text-slate-800 ml-1">Zahlungsbedingungen</h4>
                                    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
                                        <textarea
                                            className="w-full h-32 border border-slate-200 rounded-sm p-3 text-sm focus:border-brand-primary outline-none transition-colors"
                                            placeholder="Z.B. Zahlbar innerhalb von 14 Tagen..."
                                            defaultValue={`Zahlbar innerhalb von 14 Tagen bis zum ${fmtDate(formData.due_date)} ohne Abzug.`}
                                        />
                                    </div>
                                </section>
                                <section className="bg-transparent space-y-2 h-full">
                                    <h4 className="text-sm font-bold text-slate-800 ml-1">Freitext (Fußzeile)</h4>
                                    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
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
                                <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Status</span>
                                            <span className="font-bold text-brand-primary uppercase text-[10px] tracking-wider">{formData.status === 'draft' ? 'Entwurf' : formData.status}</span>
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
                                <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                                    <div className="space-y-4">
                                        {/* 1. Netto Summe (Basis) */}
                                        <div className="flex justify-between items-center h-8 text-sm text-slate-500">
                                            <span>Netto-Summe</span>
                                            <span className="font-mono text-slate-900">{fmtEur(computedFinancials.amount_net)}</span>
                                        </div>

                                        {/* 2. Editable Adjustments */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center h-8 text-sm text-slate-500 group">
                                                <span className="group-hover:text-slate-700 transition-colors">Versandkosten</span>
                                                <div className="flex items-center gap-0 font-mono text-slate-900 border-b border-transparent hover:border-slate-200 transition-all">
                                                    <input
                                                        type="number"
                                                        value={formData.shipping}
                                                        onChange={e => setFormData({ ...formData, shipping: e.target.value })}
                                                        className="w-20 bg-transparent border-none p-0 text-right focus:outline-none focus:ring-0 font-mono text-slate-900"
                                                    />
                                                    <span className="ml-1 italic text-slate-400">€</span>
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
                                                    <div className="ml-1 min-w-[25px]">
                                                        <MiniDropdown
                                                            value={formData.discount_mode}
                                                            options={[
                                                                { value: 'fixed', label: '€' },
                                                                { value: 'percent', label: '%' }
                                                            ]}
                                                            onChange={(v: string) => setFormData({ ...formData, discount_mode: v as any })}
                                                            width="25px"
                                                        />
                                                    </div>
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
                                                <span className="tracking-tight text-[10px]">Restforderung</span>
                                                <span className="text-lg tabular-nums">
                                                    {fmtEur(computedFinancials.amount_due)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* ── Action Footer Bar ── */}
                <div className="max-w-[1400px] mx-auto px-4 py-8">
                    <div className="flex justify-end items-center gap-3 border-t border-slate-200 pt-8">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/invoices')}
                            className="px-5 h-9 text-xs font-semibold border-slate-200 text-slate-500 hover:bg-slate-50"
                        >
                            Abbrechen
                        </Button>
                        <Button
                            onClick={() => handleSubmit('draft')}
                            disabled={!formData.customer_id || isLoading}
                            className="px-5 h-9 text-xs font-bold border-brand-primary/20 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10"
                        >
                            Als Entwurf speichern
                        </Button>
                        <Button
                            onClick={() => handleSubmit('issued')}
                            disabled={!formData.customer_id || items.length === 0 || isLoading}
                            className="px-8 h-9 text-xs font-bold bg-brand-primary hover:bg-brand-primary/90 text-white shadow-sm flex items-center gap-2"
                        >
                            <FaSave className="text-[10px]" />
                            {isLoading ? 'Speichern...' : (isEditMode ? 'Änderungen übernehmen' : 'Beleg jetzt buchen')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewInvoice;
