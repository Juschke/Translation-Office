import { useState, useEffect, useMemo } from 'react';
import {
    FaTimes, FaFileInvoiceDollar, FaCheck, FaPlus, FaTrash, FaBoxOpen
} from 'react-icons/fa';
import Input from '../common/Input';
import { Button } from '../common/Button';
import SearchableSelect from '../common/SearchableSelect';
import { useQuery } from '@tanstack/react-query';
import { projectService, settingsService } from '../../api/services';

interface NewInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    project?: any;
    isLoading?: boolean;
}

const UNITS = ['Wörter', 'Zeilen', 'Stunden', 'Seiten', 'Pauschale', 'Stk', 'Minuten', 'Tag'];

const NewInvoiceModal = ({ isOpen, onClose, onSubmit, project, isLoading }: NewInvoiceModalProps) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    useEffect(() => {
        if (isOpen && project?.id) {
            setSelectedProjectId(project.id.toString());
        }
    }, [isOpen, project]);

    const [formData, setFormData] = useState({
        type: 'invoice' as 'invoice' | 'credit_note',
        invoice_number: '',
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        amount_net: '0.00',
        tax_rate: '19.00',
        amount_tax: '0.00',
        amount_gross: '0.00',
        shipping: '0.00',
        discount: '0.00',
        paid_amount: '0.00',
        amount_due: '0.00',
        currency: 'EUR',
        status: 'draft',
        notes: '',
        project_id: '',
        customer_id: '',
        service_period: '',
        tax_exemption: 'none',
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

    const projectOptions = useMemo(() => {
        return (Array.isArray(projects) ? projects : []).map((p: any) => ({
            value: p.id.toString(),
            label: `${p.project_number} - ${p.project_name} (${p.customer?.company_name || p.customer?.first_name || 'Unbekannt'})`
        }));
    }, [projects]);

    const serviceOptions = useMemo(() => {
        return (Array.isArray(services) ? services : []).map((s: any) => ({
            value: s.id.toString(),
            label: `${s.name} (${s.price} € / ${s.unit || 'Stk'})`
        }));
    }, [services]);

    const activeProject = useMemo(() => {
        if (selectedProjectId) {
            const found = (Array.isArray(projects) ? projects : []).find(
                (p: any) => p.id.toString() === selectedProjectId
            );
            if (found) return found;
        }
        return project || null;
    }, [selectedProjectId, projects, project]);

    useEffect(() => {
        if (isOpen) {
            const prefix = formData.type === 'credit_note' ? 'GS' : 'RE';
            const year = new Date().getFullYear();
            const seq = String(Math.floor(1 + Math.random() * 9999)).padStart(5, '0');
            setFormData(prev => ({ ...prev, invoice_number: `${prefix}-${year}-${seq}` }));
        }
    }, [isOpen, formData.type]);

    useEffect(() => {
        if (activeProject) {
            const financials = activeProject.financials || activeProject;
            if (activeProject.positions && activeProject.positions.length > 0) {
                setItems(activeProject.positions.map((p: any) => ({
                    id: p.id || Math.random().toString(36).substr(2, 9),
                    description: p.description || p.name || 'Position',
                    quantity: parseFloat(p.quantity || p.amount) || 1,
                    unit: p.unit || 'Wörter',
                    price: parseFloat(p.customerRate || p.customer_rate || p.price) || 0,
                    total: parseFloat(p.customerTotal || p.customer_total || p.total) || 0
                })));
            } else {
                const net = parseFloat(financials.netTotal || financials.price_total || 0);
                setItems([{
                    id: Math.random().toString(36).substr(2, 9),
                    description: activeProject.project_name || activeProject.name || 'Übersetzungsleistung',
                    quantity: 1,
                    unit: 'Pauschale',
                    price: net,
                    total: net
                }]);
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
                delivery_date: activeProject.delivery_date ? activeProject.delivery_date.split('T')[0] : prev.delivery_date
            }));
        }
    }, [activeProject]);

    const handleCalculate = () => {
        const netItems = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        const shipping = parseFloat(formData.shipping) || 0;
        const discount = parseFloat(formData.discount) || 0;
        const paid = parseFloat(formData.paid_amount) || 0;
        const netBase = netItems + shipping - discount;
        const rate = (parseFloat(formData.tax_rate) || 0);
        const tax = netBase * (rate / 100);
        const gross = netBase + tax;
        const due = gross - paid;
        setFormData(prev => ({
            ...prev,
            amount_net: netBase.toFixed(2),
            amount_tax: tax.toFixed(2),
            amount_gross: gross.toFixed(2),
            amount_due: due.toFixed(2)
        }));
    };

    useEffect(() => { handleCalculate(); }, [items, formData.tax_rate, formData.shipping, formData.discount, formData.paid_amount]);

    const addItem = () => {
        setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unit: 'Wörter', price: 0, total: 0 }]);
    };

    const removeItem = (id: string) => setItems(items.filter(item => item.id !== id));

    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const newItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'price') {
                    newItem.total = (parseFloat(newItem.quantity) || 0) * (parseFloat(newItem.price) || 0);
                }
                return newItem;
            }
            return item;
        }));
    };

    const addService = (serviceId: string) => {
        const service = services.find((s: any) => s.id.toString() === serviceId);
        if (service) {
            setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: service.name, quantity: 1, unit: service.unit || 'Wörter', price: service.price || 0, total: service.price || 0 }]);
        }
    };

    const fmtDate = (d: string) => { if (!d) return '–'; try { return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return d; } };
    const fmtEur = (v: string | number) => parseFloat(v as string || '0').toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    const co = company || {};
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
                    {/* PREVIEW: DIN 5008 MATCH */}
                    <div className="flex-1 bg-slate-100 overflow-auto custom-scrollbar flex justify-start md:justify-center py-5 md:py-10 px-4 md:px-6 min-w-0">
                        <div className="bg-white shadow-xl w-[210mm] min-w-[210mm] md:min-w-0 min-h-[297mm] h-fit relative text-black shrink-0 overflow-hidden" style={{ fontFamily: "'Arial', sans-serif", padding: '0' }}>
                            {/* Company Name / Logo */}
                            <div className="absolute top-[20mm] right-[20mm] text-right">
                                <h2 className="text-[14pt] font-bold text-slate-800 m-0">{companyName}</h2>
                            </div>

                            {/* Small Sender Line */}
                            <div className="absolute top-[45mm] left-[20mm] w-[85mm] text-[7pt] text-slate-500 underline whitespace-nowrap overflow-hidden">
                                {companyName} • {companyStreet} • {companyCity} • {companyCountry}
                            </div>

                            {/* Recipient Address */}
                            <div className="absolute top-[50mm] left-[20mm] w-[85mm] text-[11pt] leading-snug">
                                <strong>{customerName}</strong><br />
                                {customerStreet && <>{customerStreet}<br /></>}
                                {customerCity && <>{customerCity}<br /></>}
                                {customerCountry}
                            </div>

                            {/* Info Block */}
                            <div className="absolute top-[50mm] left-[125mm] w-[65mm] text-[9pt] space-y-1">
                                <div className="flex justify-between">
                                    <span className="font-bold text-slate-500">{formData.type === 'credit_note' ? 'Gutschrifts' : 'Rechnungs'}-Nr.</span>
                                    <span>{formData.invoice_number || 'ENTWURF'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold text-slate-500">Datum</span>
                                    <span>{fmtDate(formData.date)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold text-slate-500">Fällig am</span>
                                    <span>{fmtDate(formData.due_date)}</span>
                                </div>
                                {activeProject?.project_number && (
                                    <div className="flex justify-between">
                                        <span className="font-bold text-slate-500">Projekt-Nr.</span>
                                        <span>{activeProject.project_number}</span>
                                    </div>
                                )}
                            </div>

                            {/* Content Start */}
                            <div className="absolute top-[105mm] left-[20mm] right-[20mm] w-[170mm]">
                                <h1 className="text-[14pt] font-bold mb-4">{formData.type === 'credit_note' ? 'Gutschrift' : 'Rechnung'} Nr. {formData.invoice_number || 'ENTWURF'}</h1>
                                <p className="text-[10pt] mb-6 leading-relaxed">
                                    Sehr geehrte Damen und Herren,<br /><br />
                                    {formData.type === 'credit_note' ? 'wir erstellen Ihnen hiermit folgende Gutschrift:' : 'wir stellen Ihnen hiermit folgende Leistungen in Rechnung:'}
                                </p>

                                <table className="w-full text-left text-[10pt] mb-4 border-collapse">
                                    <thead className="border-b-[1pt] border-black">
                                        <tr className="text-[9pt] font-black uppercase text-slate-500">
                                            <th className="py-2">Leistung</th>
                                            <th className="py-2 text-right">Menge</th>
                                            <th className="py-2 text-right">Einzel</th>
                                            <th className="py-2 text-right">Gesamt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((item) => (
                                            <tr key={item.id} className="text-[10pt]">
                                                <td className="py-3 pr-2"><strong>{item.description || 'Leistung'}</strong></td>
                                                <td className="py-3 text-right">{item.quantity} {item.unit}</td>
                                                <td className="py-3 text-right">{fmtEur(item.price)}</td>
                                                <td className="py-3 text-right">{fmtEur(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="ml-auto w-[80mm] space-y-1 mt-4">
                                    <div className="flex justify-between text-[10pt]">
                                        <span>Nettosumme:</span>
                                        <span>{fmtEur(formData.amount_net)}</span>
                                    </div>
                                    {formData.tax_exemption === 'none' ? (
                                        <div className="flex justify-between text-[10pt]">
                                            <span>Umsatzsteuer {formData.tax_rate}%:</span>
                                            <span>{fmtEur(formData.amount_tax)}</span>
                                        </div>
                                    ) : (
                                        <div className="text-right text-[8pt] text-slate-400 italic font-medium">{taxLabel}</div>
                                    )}
                                    {parseFloat(formData.shipping) > 0 && (
                                        <div className="flex justify-between text-[10pt]">
                                            <span>Versandkosten:</span>
                                            <span>{fmtEur(formData.shipping)}</span>
                                        </div>
                                    )}
                                    {parseFloat(formData.discount) > 0 && (
                                        <div className="flex justify-between text-[10pt]">
                                            <span>Rabatt:</span>
                                            <span>- {fmtEur(formData.discount)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-black pt-1 flex justify-between text-[11pt] font-bold">
                                        <span>Gesamtbetrag:</span>
                                        <span>{fmtEur(formData.amount_gross)}</span>
                                    </div>
                                    {parseFloat(formData.paid_amount) > 0 && (
                                        <div className="flex justify-between text-red-600 font-bold border-t border-red-100 pt-1">
                                            <span>Noch zu zahlen:</span>
                                            <span>{fmtEur(formData.amount_due)}</span>
                                        </div>
                                    )}
                                </div>

                                {formData.notes && (
                                    <div className="mt-8 text-[9pt] text-slate-600 leading-snug whitespace-pre-line">
                                        {formData.notes}
                                    </div>
                                )}

                                {/* Payment Info Area */}
                                <div className="mt-10 pt-4 border-t border-slate-100 text-[9pt] text-slate-600">
                                    Bitte überweisen Sie den Betrag von <strong>{fmtEur(formData.amount_due)}</strong> bis zum <strong>{fmtDate(formData.due_date)}</strong>.<br />
                                    Verwendungszweck: <strong>{formData.invoice_number}</strong><br /><br />
                                    <strong>Bankverbindung:</strong> {companyBank} | IBAN: {companyIBAN} | BIC: {companyBIC}
                                </div>
                            </div>

                            {/* Footer Area */}
                            <div className="absolute bottom-[15mm] left-[20mm] right-[20mm] border-t border-slate-200 pt-2 grid grid-cols-3 gap-4 text-[7pt] text-slate-400 leading-tight">
                                <div>
                                    <strong className="text-slate-500 uppercase block mb-1">Anschrift</strong>
                                    {companyName}<br />{companyStreet}<br />{companyCity}<br />{companyCountry}
                                </div>
                                <div className="text-center">
                                    <strong className="text-slate-500 uppercase block mb-1">Kontakt</strong>
                                    Email: {companyEmail}<br />Telefon: {companyPhone}
                                </div>
                                <div className="text-right">
                                    <strong className="text-slate-500 uppercase block mb-1">Steuer & Bank</strong>
                                    St.-Nr: {companyTaxNr}<br />USt-ID: {companyVatId}<br />IBAN: {companyIBAN}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR: Configuration */}
                    <div className="w-full md:w-[420px] border-l border-slate-100 bg-white flex flex-col shrink-0 overflow-hidden min-h-0">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-10">
                            {/* Sektion 1: Auswahl */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Dokumenten-Konfiguration</h4>
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
                                            <select className="w-full h-10 border-slate-200 border text-sm font-bold focus:border-slate-800 outline-none"
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

                            {/* Sektion 2: Termine */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Datum & Fristen</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Belegdatum" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                    <Input label="Fälligkeit" type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                                    <Input label="Lieferdatum" type="date" value={formData.delivery_date} onChange={e => setFormData({ ...formData, delivery_date: e.target.value })} />
                                    <Input label="Leistungszeitraum" value={formData.service_period} onChange={e => setFormData({ ...formData, service_period: e.target.value })} placeholder="Jan 2026" />
                                </div>
                            </section>

                            {/* Sektion 3: Leistungen (Service Add) */}
                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Positionen</h4>
                                    <button onClick={addItem} className="h-8 w-8 flex items-center justify-center bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"><FaPlus /></button>
                                </div>

                                <div className="mb-6">
                                    <SearchableSelect
                                        label="Service auswählen (+)"
                                        options={serviceOptions}
                                        value=""
                                        onChange={(val) => { if (val) addService(val); }}
                                    />
                                </div>

                                <div className="space-y-4">
                                    {items.map((item, idx) => (
                                        <div key={item.id} className="p-4 border border-slate-100 bg-slate-50/30 space-y-4 group relative">
                                            <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash className="text-[10px]" /></button>
                                            <input className="w-full bg-transparent border-b border-slate-100 focus:border-slate-800 outline-none text-sm font-black text-slate-800 placeholder:text-slate-200 pb-1 pr-6"
                                                placeholder="Bezeichnung..." value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                                            <div className="grid grid-cols-4 gap-3">
                                                <div className="col-span-1">
                                                    <label className="text-[8px] font-bold text-slate-400 mb-1 block uppercase">Menge</label>
                                                    <input type="number" className="w-full h-8 border border-slate-200 text-xs px-2 focus:border-slate-800 outline-none" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="text-[8px] font-bold text-slate-400 mb-1 block uppercase">Einheit</label>
                                                    <select className="w-full h-8 border border-slate-200 text-[10px] px-1 focus:border-slate-800 outline-none" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}>
                                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="text-[8px] font-bold text-slate-400 mb-1 block uppercase">Preis</label>
                                                    <input type="number" className="w-full h-8 border border-slate-200 text-xs px-2 focus:border-slate-800 outline-none" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} />
                                                </div>
                                                <div className="col-span-1 text-right flex flex-col justify-end pb-1.5">
                                                    <span className="text-[11px] font-black text-slate-900">{fmtEur(item.total)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Sektion 4: Weitere Kosten & Summen */}
                            <section className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Finanzen & Anpassungen</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <Input label="Versand (€)" type="number" value={formData.shipping} onChange={e => setFormData({ ...formData, shipping: e.target.value })} />
                                    <Input label="Rabatt (€)" type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
                                    <div className="relative">
                                        <Input label="Anzahlung (€)" type="number" value={formData.paid_amount} onChange={e => setFormData({ ...formData, paid_amount: e.target.value })} />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paid_amount: formData.amount_gross })}
                                            className="text-[8px] font-bold text-brand-600 hover:text-brand-800 uppercase mt-1 transition-colors"
                                        >
                                            100% bezahlt
                                        </button>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 my-6"></div>

                                <div className="space-y-2 text-[11px]">
                                    <div className="flex justify-between font-bold text-slate-500 uppercase tracking-widest text-[9px]"><span>Netto</span> <span>{fmtEur(formData.amount_net)}</span></div>
                                    <div className="flex justify-between font-bold text-slate-500 uppercase tracking-widest text-[9px]"><span>Umsatzsteuer</span> <span>{fmtEur(formData.amount_tax)}</span></div>
                                    <div className="flex justify-between items-end border-t border-slate-900 pt-2">
                                        <span className="text-[10px] font-black uppercase text-slate-900">Total Brutto</span>
                                        <span className="text-xl font-black text-slate-900 tracking-tighter">{fmtEur(formData.amount_gross)}</span>
                                    </div>
                                    {parseFloat(formData.paid_amount) > 0 && (
                                        <div className="flex justify-between text-red-600 font-black border-t border-red-50 mt-1 pt-1 italic uppercase text-[9px]"><span>Zahlbetrag</span> <span>{fmtEur(formData.amount_due)}</span></div>
                                    )}
                                </div>
                            </section>

                            <Input label="Anmerkungen & Zahlungsziele" isTextArea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                        </div>

                        {/* Actions */}
                        <div className="p-6 md:p-8 border-t border-slate-50 flex justify-end gap-4 shrink-0 bg-white">
                            <button onClick={onClose} className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Abbrechen</button>
                            <Button variant="primary" onClick={() => onSubmit({ ...formData, items })} isLoading={isLoading} disabled={!selectedProjectId || items.length === 0}
                                className="h-12 px-6 md:px-10 rounded-none text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-100 italic">
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
