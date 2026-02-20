import { useState, useEffect, useMemo } from 'react';
import {
    FaTimes, FaFileInvoiceDollar, FaPlus, FaTrash, FaCheckCircle, FaInfoCircle
} from 'react-icons/fa';
import Input from '../common/Input';
import { Button } from '../common/Button';
import SearchableSelect from '../common/SearchableSelect';
import { useQuery } from '@tanstack/react-query';
import { projectService, settingsService } from '../../api/services';
import clsx from 'clsx';

interface NewInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    project?: any;
    invoice?: any;
    isLoading?: boolean;
    defaultType?: 'invoice' | 'credit_note';
}

const UNITS = ['Wörter', 'Zeilen', 'Seiten', 'Stunden', 'Pauschal', 'Stk', 'Minuten', 'Tag'];

const NewInvoiceModal = ({ isOpen, onClose, onSubmit, project, invoice, isLoading, defaultType = 'invoice' }: NewInvoiceModalProps) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

    const [formData, setFormData] = useState({
        type: defaultType,
        invoice_number: '',
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        shipping: '0.00',
        discount: '0.00',
        paid_amount: '0.00',
        currency: 'EUR',
        status: 'draft',
        notes: '',
        project_id: '',
        customer_id: '',
        service_period: '',
        tax_exemption: 'none',
        tax_rate: '19.00',
    });

    const [items, setItems] = useState<any[]>([]);

    const { data: company } = useQuery({
        queryKey: ['settings', 'company'],
        queryFn: () => settingsService.getCompany(),
        enabled: isOpen,
        staleTime: 1000 * 60 * 10
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects', 'active'],
        queryFn: () => projectService.getAll(),
        enabled: isOpen
    });

    const { data: services = [] } = useQuery({
        queryKey: ['settings', 'services'],
        queryFn: () => settingsService.getServices(),
        enabled: isOpen
    });

    // ── Live-Berechnungen per useMemo (kein stale-closure-Problem) ─────────
    const computedFinancials = useMemo(() => {
        const netItems = items.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);
        const shipping = parseFloat(formData.shipping) || 0;
        const discount = parseFloat(formData.discount) || 0;
        const paid = parseFloat(formData.paid_amount) || 0;
        const netBase = netItems + shipping - discount;
        const rate = formData.tax_exemption === 'none' ? (parseFloat(formData.tax_rate) || 0) : 0;
        const tax = netBase * (rate / 100);
        const gross = netBase + tax;
        const isCN = formData.type === 'credit_note';
        const due = isCN ? (gross - paid) : Math.max(0, gross - paid);
        return { amount_net: netBase, amount_tax: tax, amount_gross: gross, amount_due: due };
    }, [items, formData.shipping, formData.discount, formData.paid_amount, formData.tax_rate, formData.tax_exemption, formData.type]);

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

    const serviceOptions = useMemo(() => {
        return (Array.isArray(services) ? services : []).map((s: any) => ({
            value: s.id.toString(),
            label: `${s.name} (${s.price} € / ${s.unit || 'Stk'})`
        }));
    }, [services]);

    const activeProject = useMemo(() => {
        if (project && project.id.toString() === selectedProjectId) return project;
        if (selectedProjectId) {
            const found = (Array.isArray(projects) ? projects : []).find((p: any) => p.id.toString() === selectedProjectId);
            if (found) return found;
        }
        return project || null;
    }, [selectedProjectId, projects, project]);

    useEffect(() => {
        if (isOpen) {
            if (invoice) {
                setSelectedProjectId(invoice.project_id?.toString() || '');
                setFormData({
                    type: invoice.type || 'invoice',
                    invoice_number: invoice.invoice_number,
                    date: invoice.date ? invoice.date.split('T')[0] : new Date().toISOString().split('T')[0],
                    due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
                    delivery_date: invoice.delivery_date ? invoice.delivery_date.split('T')[0] : '',
                    shipping: (invoice.shipping_cents ? invoice.shipping_cents / 100 : invoice.shipping || 0).toFixed(2),
                    discount: (invoice.discount_cents ? invoice.discount_cents / 100 : invoice.discount || 0).toFixed(2),
                    paid_amount: (invoice.paid_amount_cents ? invoice.paid_amount_cents / 100 : invoice.paid_amount || 0).toFixed(2),
                    currency: invoice.currency || 'EUR',
                    status: invoice.status,
                    notes: invoice.notes || '',
                    project_id: invoice.project_id?.toString() || '',
                    customer_id: invoice.customer_id?.toString() || '',
                    service_period: invoice.service_period || '',
                    tax_exemption: invoice.tax_exemption || 'none',
                    tax_rate: invoice.tax_rate?.toString() || '19.00',
                });
                if (invoice.items) {
                    setItems(invoice.items.map((i: any) => ({
                        id: i.id || Math.random().toString(36).substr(2, 9),
                        description: i.description,
                        quantity: i.quantity,
                        unit: i.unit,
                        price: i.unit_price_cents ? i.unit_price_cents / 100 : i.price,
                        total: i.total_cents ? i.total_cents / 100 : i.total,
                        price_mode: i.price_mode || 'unit',
                    })));
                }
            } else {
                setFormData(prev => ({
                    ...prev,
                    invoice_number: 'Wird automatisch generiert',
                    type: defaultType
                }));
                if (project?.id) setSelectedProjectId(project.id.toString());
            }
        }
    }, [isOpen, invoice, project, defaultType]);

    useEffect(() => {
        if (activeProject && !invoice) {
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
                    };
                });

                const extraItems: any[] = [];
                const addExtra = (desc: string, price: number) => {
                    const p = price * mult;
                    extraItems.push({ id: Math.random().toString(36).substr(2, 9), description: desc, quantity: 1, unit: 'Pauschal', price: p, total: p, price_mode: 'fixed' });
                };

                if (activeProject.isCertified || activeProject.is_certified) addExtra('Beglaubigung', 5.00);
                if (activeProject.hasApostille || activeProject.has_apostille) addExtra('Apostille', 15.00);
                if (activeProject.isExpress || activeProject.is_express) addExtra('Express-Zuschlag', 15.00);
                if (activeProject.classification === 'ja' || activeProject.classification === true) addExtra('Klassifizierung', 15.00);

                const copies = parseInt(activeProject.copies || activeProject.copies_count || '0');
                if (copies > 0) {
                    const cp = parseFloat(activeProject.copyPrice || activeProject.copy_price || '5');
                    const p = cp * mult;
                    extraItems.push({ id: Math.random().toString(36).substr(2, 9), description: 'Kopien', quantity: copies, unit: 'Stk', price: p, total: copies * p, price_mode: 'unit' });
                }
                setItems([...standardItems, ...extraItems]);
            } else {
                const net = (parseFloat(activeProject.financials?.netTotal || activeProject.price_total || 0)) * mult;
                setItems([{ id: Math.random().toString(36).substr(2, 9), description: activeProject.project_name || activeProject.name || 'Übersetzungsleistung', quantity: 1, unit: 'Pauschal', price: net, total: net, price_mode: 'fixed' }]);
            }

            let servicePeriod = formData.service_period;
            if (!servicePeriod && activeProject.start_date) {
                const start = fmtDate(activeProject.start_date);
                const end = activeProject.delivery_date ? fmtDate(activeProject.delivery_date) : fmtDate(new Date().toISOString().split('T')[0]);
                servicePeriod = `${start} – ${end}`;
            }
            setFormData(prev => ({
                ...prev,
                project_id: activeProject.id,
                customer_id: activeProject.customer_id || activeProject.customer?.id,
                service_period: servicePeriod || prev.service_period,
                delivery_date: activeProject.delivery_date ? activeProject.delivery_date.split('T')[0] : prev.delivery_date,
                paid_amount: (activeProject.payments || []).reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0).toFixed(2)
            }));
        }
    }, [activeProject]);

    // ── Item-Verwaltung ────────────────────────────────────────────────────
    const addItem = () => setItems(prev => [...prev, { id: Date.now().toString(), description: 'Neue Position', quantity: 1, unit: 'Wörter', price: 0, total: 0, price_mode: 'unit' }]);
    const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

    const updateItem = (id: string, field: string, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: value };
            if (['quantity', 'price', 'price_mode'].includes(field)) {
                const mode = updated.price_mode || 'unit';
                const qty = parseFloat(updated.quantity) || 0;
                const price = parseFloat(updated.price) || 0;
                updated.total = mode === 'fixed' ? price : qty * price;
            }
            return updated;
        }));
    };

    const addService = (serviceId: string) => {
        const service = (services as any[]).find((s: any) => s.id.toString() === serviceId);
        if (service) setItems(prev => [...prev, { id: Date.now().toString(), description: service.name, quantity: 1, unit: service.unit || 'Wörter', price: service.price || 0, total: service.price || 0, price_mode: 'unit' }]);
    };

    // ── Inline-Cell-Editing (identisch zu ProjectFinancesTab) ──────────────
    const renderItemCell = (id: string, field: string, value: string, type: 'text' | 'number' = 'text', className: string = '') => {
        const isEditing = editingCell?.id === id && editingCell?.field === field;
        if (isEditing) {
            return (
                <input
                    autoFocus
                    type={type}
                    defaultValue={value}
                    className={clsx('w-full bg-white border-2 border-brand-500 rounded px-2 py-1 outline-none text-xs font-bold shadow-sm', className)}
                    onBlur={(e) => { updateItem(id, field, e.target.value); setEditingCell(null); }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') { updateItem(id, field, (e.target as HTMLInputElement).value); setEditingCell(null); }
                        if (e.key === 'Escape') setEditingCell(null);
                    }}
                />
            );
        }
        return (
            <div
                onClick={() => setEditingCell({ id, field })}
                className={clsx('cursor-pointer hover:bg-brand-50 hover:text-brand-700 px-2 py-1 rounded transition', className)}
                title="Klicken zum Bearbeiten"
            >
                {value || '-'}
            </div>
        );
    };

    // ── Hilfsfunktionen ────────────────────────────────────────────────────
    const fmtDate = (d: string) => { if (!d) return '–'; try { return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return d; } };
    const fmtEur = (v: number | string) => (parseFloat(v as string) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    const co = company || {} as any;
    const companyName = co.company_name || co.name || '–';
    const companyStreet = co.address_street ? `${co.address_street} ${co.address_house_no || ''}`.trim() : '–';
    const companyCity = [co.address_zip, co.address_city].filter(Boolean).join(' ') || '–';
    const companyCountry = co.address_country || 'Deutschland';
    const companyIBAN = co.bank_iban || '–';
    const companyBIC = co.bank_bic || '–';
    const companyBank = co.bank_name || '–';
    const companyTaxNr = co.tax_number || '–';
    const companyVatId = co.vat_id || '–';
    const companyEmail = co.email || co.contact_email || '–';
    const companyPhone = co.phone || co.contact_phone || '–';

    const cust = activeProject?.customer;
    const customerName = cust ? (cust.company_name || `${cust.first_name} ${cust.last_name}`) : '–';
    const customerStreet = cust?.address_street ? `${cust.address_street} ${cust.address_house_no || ''}`.trim() : '';
    const customerCity = [cust?.address_zip, cust?.address_city].filter(Boolean).join(' ') || '';
    const customerCountry = cust?.address_country || '';
    const taxLabel = formData.tax_exemption === '§19_ustg' ? 'Kein USt-Ausweis gem. § 19 UStG' : formData.tax_exemption === 'reverse_charge' ? 'Steuerschuldnerschaft des Leistungsempfängers' : null;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-[1240px] shadow-2xl overflow-hidden flex flex-col h-full md:h-[94vh]">

                {/* ── Header ── */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center"><FaFileInvoiceDollar /></div>
                        <div>
                            <h2 className="text-[14px] font-black uppercase text-slate-800 tracking-wider">Beleg-Erstellung</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{activeProject ? `${activeProject.project_number} • ${activeProject.project_name}` : 'Abrechnung konfigurieren'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><FaTimes /></button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

                    {/* ── Left: DIN 5008 Preview ── */}
                    <div className="flex-1 bg-slate-100 overflow-auto custom-scrollbar flex justify-start md:justify-center py-5 md:py-10 px-4 md:px-6 min-w-0">
                        <div className="bg-white shadow-xl w-[210mm] min-w-[210mm] md:min-w-0 min-h-[297mm] h-fit relative text-black shrink-0 overflow-hidden flex flex-col" style={{ fontFamily: "'Arial', sans-serif", padding: '0' }}>
                            {/* Header */}
                            <div className="relative h-[105mm] w-full shrink-0">
                                <div className="absolute top-[20mm] right-[20mm] text-right">
                                    <h2 className="text-[14pt] font-bold text-slate-800 m-0">{companyName}</h2>
                                </div>
                                <div className="absolute top-[45mm] left-[20mm] w-[85mm] text-[7pt] text-slate-500 underline whitespace-nowrap overflow-hidden">
                                    {companyName} • {companyStreet} • {companyCity} • {companyCountry}
                                </div>
                                <div className="absolute top-[50mm] left-[20mm] w-[85mm] text-[11pt] leading-snug">
                                    <strong>{customerName}</strong><br />
                                    {customerStreet && <>{customerStreet}<br /></>}
                                    {customerCity && <>{customerCity}<br /></>}
                                    {customerCountry}
                                </div>
                                <div className="absolute top-[50mm] left-[125mm] w-[65mm] text-[9pt] space-y-1">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-slate-500">{formData.type === 'credit_note' ? 'Gutschrifts' : 'Rechnungs'}-Nr.</span>
                                        <span>{formData.invoice_number || 'ENTWURF'}</span>
                                    </div>
                                    <div className="flex justify-between"><span className="font-bold text-slate-500">Datum</span><span>{fmtDate(formData.date)}</span></div>
                                    <div className="flex justify-between"><span className="font-bold text-slate-500">Fällig am</span><span>{fmtDate(formData.due_date)}</span></div>
                                    {activeProject?.project_number && (
                                        <div className="flex justify-between"><span className="font-bold text-slate-500">Projekt-Nr.</span><span>{activeProject.project_number}</span></div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 px-[20mm]">
                                <h1 className="text-[14pt] font-bold mb-4">{formData.type === 'credit_note' ? 'Gutschrift' : 'Rechnung'} Nr. {formData.invoice_number || 'ENTWURF'}</h1>
                                <p className="text-[10pt] mb-6 leading-relaxed">
                                    Sehr geehrte Damen und Herren,<br /><br />
                                    {formData.type === 'credit_note' ? 'wir erstellen Ihnen hiermit folgende Gutschrift:' : 'wir stellen Ihnen hiermit folgende Leistungen in Rechnung:'}
                                </p>

                                <table className="w-full text-left text-[10pt] mb-4 border-collapse">
                                    <thead className="border-b-[1pt] border-black">
                                        <tr className="text-[9pt] font-black uppercase text-slate-500">
                                            <th className="py-2 w-10 text-center">Pos.</th>
                                            <th className="py-2">Leistung</th>
                                            <th className="py-2 text-right">Menge</th>
                                            <th className="py-2 text-right">Einheit</th>
                                            <th className="py-2 text-right">Einzel</th>
                                            <th className="py-2 text-right">Gesamt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((item, idx) => (
                                            <tr key={item.id} className="text-[10pt]">
                                                <td className="py-3 text-center text-slate-400">{idx + 1}</td>
                                                <td className="py-3 pr-2"><strong>{item.description || 'Leistung'}</strong></td>
                                                <td className="py-3 text-right">{item.quantity}</td>
                                                <td className="py-3 text-right">{item.unit}</td>
                                                <td className="py-3 text-right">{fmtEur(item.price)}</td>
                                                <td className="py-3 text-right">{fmtEur(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="ml-auto w-[80mm] space-y-1 mt-4">
                                    <div className="flex justify-between text-[10pt]">
                                        <span>Nettosumme:</span>
                                        <span>{fmtEur(computedFinancials.amount_net)}</span>
                                    </div>
                                    {formData.tax_exemption === 'none' ? (
                                        <div className="flex justify-between text-[10pt]">
                                            <span>Umsatzsteuer {formData.tax_rate}%:</span>
                                            <span>{fmtEur(computedFinancials.amount_tax)}</span>
                                        </div>
                                    ) : (
                                        <div className="text-right text-[8pt] text-slate-400 italic font-medium">{taxLabel}</div>
                                    )}
                                    {parseFloat(formData.shipping) > 0 && (
                                        <div className="flex justify-between text-[10pt]"><span>Versandkosten:</span><span>{fmtEur(formData.shipping)}</span></div>
                                    )}
                                    {parseFloat(formData.discount) > 0 && (
                                        <div className="flex justify-between text-[10pt]"><span>Rabatt:</span><span>- {fmtEur(formData.discount)}</span></div>
                                    )}
                                    <div className="border-t border-black pt-1 flex justify-between text-[11pt] font-bold">
                                        <span>Gesamtbetrag:</span>
                                        <span>{fmtEur(computedFinancials.amount_gross)}</span>
                                    </div>
                                    {parseFloat(formData.paid_amount) > 0 && (
                                        <div className="flex justify-between text-[10pt] text-slate-600">
                                            <span>Bereits bezahlt:</span>
                                            <span>- {fmtEur(formData.paid_amount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-[11pt] font-bold border-t border-slate-200 pt-1 mt-1">
                                        {computedFinancials.amount_due <= 0 ? (
                                            <><span className="text-emerald-600">Betrag beglichen</span><span className="text-emerald-600">0,00 €</span></>
                                        ) : (
                                            <><span className="text-red-600">Noch zu zahlen:</span><span className="text-red-600">{fmtEur(computedFinancials.amount_due)}</span></>
                                        )}
                                    </div>
                                </div>

                                {formData.notes && (
                                    <div className="mt-8 text-[9pt] text-slate-600 leading-snug whitespace-pre-line">{formData.notes}</div>
                                )}

                                <div className="mt-10 pt-4 border-t border-slate-100 text-[9pt] text-slate-600 mb-8">
                                    Bitte überweisen Sie den Betrag von <strong>{fmtEur(computedFinancials.amount_due)}</strong> bis zum <strong>{fmtDate(formData.due_date)}</strong>.<br />
                                    Verwendungszweck: <strong>{formData.invoice_number}</strong><br /><br />
                                    <strong>Bankverbindung:</strong> {companyBank} | IBAN: {companyIBAN} | BIC: {companyBIC}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-[20mm] pb-[15mm] shrink-0">
                                <div className="border-t border-slate-200 pt-2 grid grid-cols-3 gap-4 text-[7pt] text-slate-400 leading-tight">
                                    <div><strong className="text-slate-500 uppercase block mb-1">Anschrift</strong>{companyName}<br />{companyStreet}<br />{companyCity}<br />{companyCountry}</div>
                                    <div className="text-center"><strong className="text-slate-500 uppercase block mb-1">Kontakt</strong>Email: {companyEmail}<br />Telefon: {companyPhone}</div>
                                    <div className="text-right"><strong className="text-slate-500 uppercase block mb-1">Steuer & Bank</strong>St.-Nr: {companyTaxNr}<br />USt-ID: {companyVatId}<br />IBAN: {companyIBAN}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Configuration Sidebar ── */}
                    <div className="w-full md:w-[460px] border-l border-slate-100 bg-white flex flex-col shrink-0 overflow-hidden min-h-0">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                            {/* ── Sektion 1: Dokument ── */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Dokumenten-Konfiguration</h4>
                                <div className="space-y-4">
                                    <SearchableSelect label="Referenz-Projekt" options={projectOptions} value={selectedProjectId} onChange={setSelectedProjectId} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-tighter">Beleg-Typ</label>
                                            <select className="w-full h-10 border-slate-200 border text-sm font-bold focus:border-slate-800 outline-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                                                <option value="invoice">Rechnung</option>
                                                <option value="credit_note">Gutschrift</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-tighter">Umsatzsteuer</label>
                                            <select
                                                className="w-full h-10 border-slate-200 border text-sm font-bold focus:border-slate-800 outline-none"
                                                value={formData.tax_exemption === 'none' ? formData.tax_rate : formData.tax_exemption}
                                                onChange={e => {
                                                    const v = e.target.value;
                                                    if (v === '19.00' || v === '7.00') setFormData({ ...formData, tax_exemption: 'none', tax_rate: v });
                                                    else setFormData({ ...formData, tax_exemption: v, tax_rate: '0.00' });
                                                }}>
                                                <option value="19.00">19% MWSt</option>
                                                <option value="7.00">7% MWSt</option>
                                                <option value="§19_ustg">0% (§ 19 UStG)</option>
                                                <option value="reverse_charge">0% (Reverse Charge)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ── Sektion 2: Datum ── */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Datum & Fristen</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Belegdatum" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                    <Input label="Fälligkeit" type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                                    <Input label="Lieferdatum" type="date" value={formData.delivery_date} onChange={e => setFormData({ ...formData, delivery_date: e.target.value })} />
                                    <Input label="Leistungszeitraum" value={formData.service_period} onChange={e => setFormData({ ...formData, service_period: e.target.value })} placeholder="Jan 2026" />
                                </div>
                            </section>

                            {/* ── Sektion 3: Positionen (Kalkulations-Tabelle) ── */}
                            <section>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Positionen</h4>
                                    <button
                                        onClick={addItem}
                                        className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded text-[10px] font-bold uppercase hover:bg-slate-100 hover:text-slate-800 transition shadow-sm flex items-center gap-1.5"
                                    >
                                        <FaPlus className="mb-0.5" /> Neu
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <SearchableSelect
                                        label="Service aus Katalog hinzufügen"
                                        options={serviceOptions}
                                        value=""
                                        onChange={(val) => { if (val) addService(val); }}
                                    />
                                </div>

                                <div className="overflow-x-auto rounded-sm border border-slate-200">
                                    <table className="w-full text-left border-collapse min-w-[380px]">
                                        <thead className="bg-slate-50/80 text-slate-500 text-[9px] font-black uppercase tracking-wider border-b border-slate-200">
                                            <tr>
                                                <th className="px-3 py-2.5 w-8 text-center">#</th>
                                                <th className="px-3 py-2.5">Beschreibung</th>
                                                <th className="px-3 py-2.5 w-14 text-right">Menge</th>
                                                <th className="px-3 py-2.5 w-20 text-right">Einh.</th>
                                                <th className="px-3 py-2.5 w-20 text-right bg-emerald-50/30 text-emerald-600 border-l border-slate-100">VK (Stk)</th>
                                                <th className="px-3 py-2.5 w-20 text-right font-black text-slate-700 bg-emerald-50/30 border-l border-slate-100">Gesamt</th>
                                                <th className="px-2 py-2.5 w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                            {items.map((item, idx) => (
                                                <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="px-3 py-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                                                    <td className="px-3 py-2.5">
                                                        {renderItemCell(item.id, 'description', item.description, 'text', 'font-bold text-slate-700 w-full bg-transparent outline-none')}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right">
                                                        {renderItemCell(item.id, 'quantity', String(item.quantity), 'number', 'text-right font-mono text-slate-600 bg-transparent outline-none')}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right">
                                                        <select
                                                            value={item.unit}
                                                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                                                            className="text-right text-[10px] font-bold uppercase text-slate-400 bg-transparent outline-none cursor-pointer hover:text-brand-600 transition-colors w-full appearance-none"
                                                        >
                                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right text-emerald-600 font-medium border-l border-slate-100 bg-emerald-50/5 group-hover:bg-emerald-50/20 transition-colors">
                                                        <div className="flex flex-col gap-0.5 items-end">
                                                            {renderItemCell(item.id, 'price', String(item.price), 'number', 'text-right font-mono bg-transparent outline-none')}
                                                            <select
                                                                value={item.price_mode || 'unit'}
                                                                onChange={(e) => updateItem(item.id, 'price_mode', e.target.value)}
                                                                className="text-right text-[9px] font-bold uppercase text-emerald-400 bg-transparent outline-none cursor-pointer hover:text-emerald-600 transition-colors appearance-none"
                                                            >
                                                                <option value="unit">/ Einheit</option>
                                                                <option value="fixed">Pauschal</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-black text-slate-800 border-l border-slate-100 bg-emerald-50/10 group-hover:bg-emerald-50/30 transition-colors">
                                                        {(parseFloat(item.total) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                                    </td>
                                                    <td className="px-2 py-2.5 text-center">
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Position löschen"
                                                        >
                                                            <FaTrash className="text-[10px]" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {items.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic bg-slate-50/30">
                                                        Keine Positionen vorhanden. Klicken Sie auf "Neu".
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* ── Sektion 4: Finanzen & Summen ── */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Finanzen & Summen</h4>

                                {formData.type !== 'credit_note' && (
                                    <div className="grid grid-cols-3 gap-3 mb-5">
                                        <Input label="Versand (€)" type="number" value={formData.shipping} onChange={e => setFormData({ ...formData, shipping: e.target.value })} />
                                        <Input label="Rabatt (€)" type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
                                        <div>
                                            <Input label="Anzahlung (€)" type="number" value={formData.paid_amount} onChange={e => setFormData({ ...formData, paid_amount: e.target.value })} />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, paid_amount: computedFinancials.amount_gross.toFixed(2) })}
                                                className="text-[8px] font-bold text-brand-600 hover:text-brand-800 uppercase mt-1 transition-colors"
                                            >
                                                100% bezahlt
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Financial Summary — identischer Stil wie ProjectFinancesTab-Sidebar */}
                                <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <FaFileInvoiceDollar className="text-brand-500" /> Finanz-Übersicht
                                        </h3>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="text-center pb-4 border-b border-slate-100 border-dashed">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                {formData.type === 'credit_note' ? 'Gutschriftsbetrag' : 'Gesamtbetrag (Brutto)'}
                                            </p>
                                            <div className={clsx("text-3xl font-black tracking-tight", formData.type === 'credit_note' ? "text-red-600" : "text-slate-800")}>
                                                {computedFinancials.amount_gross.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg text-slate-400 font-bold">€</span>
                                            </div>
                                            <div className="mt-2">
                                                <span className={clsx(
                                                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border',
                                                    formData.type === 'credit_note' ? 'bg-red-50 text-red-700 border-red-100' :
                                                        (computedFinancials.amount_due <= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100')
                                                )}>
                                                    {formData.type === 'credit_note' ? 'Gutschrift' : (computedFinancials.amount_due <= 0 ? 'Beglichen' : 'Offen')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Aufschlüsselung */}
                                        <div className="space-y-2.5">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 font-medium">Netto Umsatz</span>
                                                <span className="font-bold text-slate-700">{fmtEur(computedFinancials.amount_net)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                                    {formData.tax_exemption === 'none' ? `MwSt. (${formData.tax_rate}%)` : 'MwSt. (Befreit)'}
                                                    <FaInfoCircle className="text-slate-300 text-[10px]" />
                                                </span>
                                                <span className="font-bold text-slate-700">{fmtEur(computedFinancials.amount_tax)}</span>
                                            </div>
                                            {parseFloat(formData.shipping) > 0 && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-medium">Versand</span>
                                                    <span className="font-bold text-slate-700">+ {fmtEur(formData.shipping)}</span>
                                                </div>
                                            )}
                                            {parseFloat(formData.discount) > 0 && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-medium">Rabatt</span>
                                                    <span className="font-bold text-red-400">- {fmtEur(formData.discount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-2">
                                                <span className="font-bold text-slate-800">Gesamtbetrag (Brutto)</span>
                                                <span className="font-bold text-slate-800">{fmtEur(computedFinancials.amount_gross)}</span>
                                            </div>

                                            {/* Anzahlung & Zahlbetrag */}
                                            {parseFloat(formData.paid_amount) > 0 && (
                                                <>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-500 font-medium">Anzahlung / bezahlt</span>
                                                        <span className="font-bold text-emerald-600">- {fmtEur(formData.paid_amount)}</span>
                                                    </div>
                                                    <div className={clsx(
                                                        'rounded-sm p-3 border mt-2',
                                                        formData.type === 'credit_note' ? 'bg-red-50 border-red-100' :
                                                            (computedFinancials.amount_due <= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100')
                                                    )}>
                                                        <div className="flex justify-between items-end">
                                                            <span className={clsx('text-[10px] font-bold uppercase tracking-wider',
                                                                formData.type === 'credit_note' ? 'text-red-700' :
                                                                    (computedFinancials.amount_due <= 0 ? 'text-emerald-700' : 'text-red-600')
                                                            )}>
                                                                {formData.type === 'credit_note' ? 'Auszuzahlen' : (computedFinancials.amount_due <= 0 ? 'Vollständig bezahlt' : 'Noch zu zahlen')}
                                                            </span>
                                                            <span className={clsx('text-lg font-black',
                                                                formData.type === 'credit_note' ? 'text-red-700' :
                                                                    (computedFinancials.amount_due <= 0 ? 'text-emerald-700' : 'text-red-600')
                                                            )}>
                                                                {fmtEur(Math.abs(computedFinancials.amount_due))}
                                                            </span>
                                                        </div>
                                                        {computedFinancials.amount_due <= 0 && formData.type !== 'credit_note' && (
                                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-bold">
                                                                <FaCheckCircle /> Rechnung ausgeglichen
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <Input label="Anmerkungen & Zahlungsziele" isTextArea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                        </div>

                        {/* ── Actions Footer ── */}
                        <div className="p-6 border-t border-slate-50 flex justify-end gap-4 shrink-0 bg-white">
                            <button onClick={onClose} className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Abbrechen</button>
                            <Button
                                variant="primary"
                                onClick={() => onSubmit({ ...formData, ...computedFinancials, items })}
                                isLoading={isLoading}
                                disabled={!selectedProjectId || items.length === 0 || invoice?.status === 'cancelled'}
                                className="h-12 px-6 md:px-10 rounded-none text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-100 italic"
                            >
                                Beleg Jetzt Finalisieren
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewInvoiceModal;
