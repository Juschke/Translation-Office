import { useState, useEffect, useMemo } from 'react';
import {
    FaTimes, FaFileInvoiceDollar, FaEuroSign, FaCheck,
    FaCalendarAlt, FaUser, FaProjectDiagram,
    FaInfoCircle, FaStickyNote
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

const NewInvoiceModal = ({ isOpen, onClose, onSubmit, project, isLoading }: NewInvoiceModalProps) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    useEffect(() => {
        if (isOpen && project?.id) {
            setSelectedProjectId(project.id.toString());
        }
    }, [isOpen, project]);

    const [formData, setFormData] = useState({
        invoice_number: '',
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount_net: '0.00',
        tax_rate: '19.00',
        amount_tax: '0.00',
        amount_gross: '0.00',
        currency: 'EUR',
        status: 'draft',
        notes: '',
        project_id: '',
        customer_id: '',
        service_period: '',
        tax_exemption: 'none',
    });

    // Fetch company stammdaten
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

    const projectOptions = useMemo(() => {
        return (Array.isArray(projects) ? projects : []).map((p: any) => ({
            value: p.id.toString(),
            label: `${p.project_number} - ${p.project_name} (${p.customer?.company_name || p.customer?.first_name || 'Unbekannt'})`
        }));
    }, [projects]);

    const activeProject = useMemo(() => {
        // Always prefer the fetched project list (has eager-loaded customer data)
        if (selectedProjectId) {
            const found = (Array.isArray(projects) ? projects : []).find(
                (p: any) => p.id.toString() === selectedProjectId
            );
            if (found) return found;
        }
        // Fallback to the project prop
        return project || null;
    }, [selectedProjectId, projects, project]);

    // Generate auto invoice number on modal open
    useEffect(() => {
        if (isOpen && !formData.invoice_number) {
            const year = new Date().getFullYear();
            const seq = String(Math.floor(1 + Math.random() * 9999)).padStart(5, '0');
            setFormData(prev => ({ ...prev, invoice_number: `RE-${year}-${seq}` }));
        }
    }, [isOpen]);

    useEffect(() => {
        if (activeProject) {
            const financials = activeProject.financials || activeProject;
            const net = parseFloat(financials.netTotal || financials.price_total || 0);
            const taxRate = parseFloat(formData.tax_rate) || 19.00;
            const tax = net * (taxRate / 100);
            const gross = net + tax;

            // Auto-fill Leistungszeitraum from project dates
            let servicePeriod = formData.service_period;
            if (!servicePeriod && activeProject.start_date) {
                const start = fmtDate(activeProject.start_date);
                const end = activeProject.delivery_date ? fmtDate(activeProject.delivery_date) : fmtDate(new Date().toISOString().split('T')[0]);
                servicePeriod = `${start} – ${end}`;
            }

            setFormData(prev => ({
                ...prev,
                amount_net: net.toFixed(2),
                amount_tax: tax.toFixed(2),
                amount_gross: gross.toFixed(2),
                project_id: activeProject.id,
                customer_id: activeProject.customer_id || activeProject.customer?.id,
                service_period: servicePeriod || prev.service_period
            }));
        }
    }, [activeProject]);

    const handleCalculate = () => {
        const net = parseFloat(formData.amount_net) || 0;
        const rate = formData.tax_exemption !== 'none' ? 0 : (parseFloat(formData.tax_rate) || 0);
        const tax = net * (rate / 100);
        const gross = net + tax;
        setFormData(prev => ({
            ...prev,
            amount_tax: tax.toFixed(2),
            amount_gross: gross.toFixed(2)
        }));
    };

    // Format helpers
    const fmtDate = (d: string) => {
        try { return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
        catch { return d; }
    };
    const fmtEur = (v: string | number) => parseFloat(v as string || '0').toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    // Company info from stammdaten
    const co = company || {};
    const companyName = co.company_name || co.name || '–';
    const companyStreet = co.address_street ? `${co.address_street} ${co.address_house_no || ''}`.trim() : '–';
    const companyCity = [co.address_zip, co.address_city].filter(Boolean).join(' ') || '–';
    const companyCountry = co.address_country || '';
    const companyIBAN = co.bank_iban || '–';
    const companyBIC = co.bank_bic || '–';
    const companyBank = co.bank_name || '–';
    const companyTaxNr = co.tax_number || '–';
    const companyVatId = co.vat_id || '–';
    const companyEmail = co.email || co.contact_email || '–';
    const companyPhone = co.phone || co.contact_phone || '–';

    // Customer info from project
    const cust = activeProject?.customer;
    const customerName = cust?.company_name || [cust?.first_name, cust?.last_name].filter(Boolean).join(' ') || '–';
    const customerStreet = cust?.address_street ? `${cust.address_street} ${cust.address_house_no || ''}`.trim() : '–';
    const customerCity = [cust?.address_zip, cust?.address_city].filter(Boolean).join(' ') || '–';
    const customerCountry = cust?.address_country || '';

    const taxLabel = formData.tax_exemption === '§19_ustg'
        ? 'Kein USt-Ausweis gem. § 19 UStG'
        : formData.tax_exemption === 'reverse_charge'
            ? 'Steuerschuldnerschaft des Leistungsempfängers'
            : null;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-[1100px] shadow-2xl animate-zoomIn overflow-hidden flex flex-col max-h-[92vh] md:h-[88vh]">
                {/* Header */}
                <div className="px-5 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                            <FaFileInvoiceDollar />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-800 tracking-tight">Neue Rechnung</h2>
                            <p className="text-[9px] text-slate-400 font-medium">
                                {activeProject ? `${activeProject.project_number || ''} • ${activeProject.project_name || ''}` : 'Projekt auswählen'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                        <FaTimes />
                    </button>
                </div>

                {/* Main Split Layout */}
                <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden min-h-0">
                    {/* LEFT on desktop / BOTTOM on mobile: Live Invoice Preview */}
                    <div className="flex-1 bg-slate-100/80 overflow-y-auto custom-scrollbar flex justify-center items-start py-5 px-4 min-h-[300px] md:min-h-0">
                        <div className="bg-white shadow-md border border-slate-200/50 w-full max-w-[480px]" style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px' }}>
                            {/* Absenderzeile */}
                            <div className="px-6 pt-6">
                                <div className="text-[7px] text-slate-400 border-b border-slate-200 pb-0.5 mb-2 tracking-[0.12em] uppercase">
                                    {companyName} • {companyStreet} • {companyCity}
                                </div>

                                {/* Empfänger */}
                                <div className="min-h-[48px] mb-5">
                                    <div className="text-[10px] font-semibold text-slate-800 leading-snug">{customerName}</div>
                                    <div className="text-[9px] text-slate-500 leading-snug">{customerStreet}</div>
                                    <div className="text-[9px] text-slate-500 leading-snug">{customerCity}</div>
                                    {customerCountry && <div className="text-[9px] text-slate-500 leading-snug">{customerCountry}</div>}
                                </div>

                                {/* Title + Meta */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-[14px] font-black text-slate-900 tracking-tight">RECHNUNG</h3>
                                        <div className="text-[8px] text-slate-400 font-semibold mt-0.5 tracking-wide">
                                            Nr. {formData.invoice_number || '–'}
                                        </div>
                                    </div>
                                    <div className="text-right text-[9px] text-slate-500 space-y-0.5 leading-snug">
                                        <div>Datum: <span className="font-semibold text-slate-700">{fmtDate(formData.date)}</span></div>
                                        <div>Fällig: <span className="font-semibold text-slate-700">{fmtDate(formData.due_date)}</span></div>
                                        {formData.service_period && (
                                            <div>Leistung: <span className="font-semibold text-slate-700">{formData.service_period}</span></div>
                                        )}
                                    </div>
                                </div>

                                <div className="h-[2px] bg-gradient-to-r from-slate-800 via-slate-300 to-transparent mb-3"></div>

                                {/* Positionen */}
                                <table className="w-full mb-3" style={{ fontSize: '9px' }}>
                                    <thead>
                                        <tr className="text-[7px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                            <th className="text-left py-1 font-bold w-8">Pos</th>
                                            <th className="text-left py-1 font-bold">Bezeichnung</th>
                                            <th className="text-right py-1 font-bold w-20">Betrag</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeProject?.positions && activeProject.positions.length > 0 ? (
                                            activeProject.positions.map((pos: any, idx: number) => (
                                                <tr key={idx} className="border-b border-slate-50">
                                                    <td className="py-1 text-slate-400">{idx + 1}</td>
                                                    <td className="py-1 text-slate-700 font-medium">{pos.description || pos.name || 'Position'}</td>
                                                    <td className="py-1 text-right text-slate-700 font-semibold">{fmtEur(pos.amount || pos.price || 0)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr className="border-b border-slate-50">
                                                <td className="py-1 text-slate-400">1</td>
                                                <td className="py-1 text-slate-700 font-medium">
                                                    {activeProject?.project_name || 'Übersetzungsleistung'}
                                                </td>
                                                <td className="py-1 text-right text-slate-700 font-semibold">{fmtEur(formData.amount_net)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Summen */}
                                <div className="flex flex-col items-end mb-4">
                                    <div className="w-40 space-y-0.5 text-[9px]">
                                        <div className="flex justify-between text-slate-500">
                                            <span>Netto</span>
                                            <span className="font-semibold">{fmtEur(formData.amount_net)}</span>
                                        </div>
                                        {formData.tax_exemption === 'none' ? (
                                            <div className="flex justify-between text-slate-500">
                                                <span>USt. {formData.tax_rate}%</span>
                                                <span className="font-semibold">{fmtEur(formData.amount_tax)}</span>
                                            </div>
                                        ) : (
                                            <div className="text-slate-400 italic text-[8px]">{taxLabel}</div>
                                        )}
                                        <div className="h-px bg-slate-800 my-0.5"></div>
                                        <div className="flex justify-between text-slate-900 font-black text-[11px]">
                                            <span>Gesamt</span>
                                            <span>{fmtEur(formData.tax_exemption === 'none' ? formData.amount_gross : formData.amount_net)}</span>
                                        </div>
                                    </div>
                                </div>

                                {taxLabel && (
                                    <div className="text-[7px] text-slate-400 italic border-t border-slate-100 pt-1.5 mb-3">{taxLabel}</div>
                                )}

                                {formData.notes && (
                                    <div className="bg-slate-50 border border-slate-100 rounded p-2 mb-3">
                                        <div className="text-[7px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Hinweis</div>
                                        <div className="text-[8px] text-slate-600 whitespace-pre-line">{formData.notes}</div>
                                    </div>
                                )}
                            </div>

                            {/* Footer — company stammdaten */}
                            <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100">
                                <div className="flex justify-between text-[7px] text-slate-400 leading-relaxed">
                                    <div>
                                        <div className="font-bold uppercase tracking-wider text-[6px] text-slate-500 mb-0.5">Bankverbindung</div>
                                        <div>{companyBank}</div>
                                        <div>IBAN: {companyIBAN}</div>
                                        <div>BIC: {companyBIC}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold uppercase tracking-wider text-[6px] text-slate-500 mb-0.5">Kontakt</div>
                                        <div>{companyEmail}</div>
                                        <div>{companyPhone}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold uppercase tracking-wider text-[6px] text-slate-500 mb-0.5">Steuer</div>
                                        <div>USt-IdNr: {companyVatId}</div>
                                        <div>St-Nr: {companyTaxNr}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Form Inputs */}
                    {/* RIGHT on desktop / TOP on mobile: Form */}
                    <div className="w-full md:w-[360px] border-b md:border-b-0 md:border-l border-slate-100 bg-white flex flex-col overflow-hidden shrink-0">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {/* Projekt */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <FaProjectDiagram className="text-brand-500 text-[10px]" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Projekt</span>
                                </div>
                                <SearchableSelect
                                    label=""
                                    options={projectOptions}
                                    value={selectedProjectId}
                                    onChange={setSelectedProjectId}
                                    placeholder="Projekt suchen..."
                                />
                            </div>

                            {/* Empfänger */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <FaUser className="text-brand-500 text-[10px]" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Empfänger</span>
                                </div>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-medium text-slate-600">
                                    {customerName}
                                    {(customerStreet !== '–' || customerCity !== '–') && (
                                        <div className="text-[10px] text-slate-400 mt-0.5">{customerStreet}, {customerCity}</div>
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            {/* Datum */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <FaCalendarAlt className="text-brand-500 text-[10px]" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Datum & Fristen</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input label="Rechnungsdatum" type="date" value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                                    <Input label="Fällig am" type="date" value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required />
                                </div>
                                <div className="mt-2">
                                    <Input label="Leistungszeitraum" value={formData.service_period}
                                        onChange={(e) => setFormData({ ...formData, service_period: e.target.value })}
                                        placeholder="z.B. 01.01. – 15.01.2026" required />
                                </div>
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            {/* Steuer */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <FaEuroSign className="text-brand-500 text-[10px]" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Steuer & Beträge</span>
                                </div>
                                <select
                                    className="w-full h-9 px-3 bg-white border border-slate-200 text-sm font-medium rounded focus:ring-1 focus:ring-brand-500 outline-none mb-2"
                                    value={formData.tax_exemption}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            tax_exemption: val,
                                            tax_rate: val !== 'none' ? '0.00' : '19.00'
                                        }));
                                        setTimeout(handleCalculate, 0);
                                    }}
                                >
                                    <option value="none">Regelbesteuerung (19%)</option>
                                    <option value="§19_ustg">Kleinunternehmer (§ 19 UStG)</option>
                                    <option value="reverse_charge">Reverse Charge</option>
                                </select>

                                {formData.tax_exemption === 'none' && (
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input label="Netto (€)" type="number" step="0.01" value={formData.amount_net}
                                            onChange={(e) => setFormData({ ...formData, amount_net: e.target.value })}
                                            onBlur={handleCalculate}
                                            startIcon={<FaEuroSign className="text-slate-400 text-[9px]" />} required />
                                        <Input label="MwSt (%)" type="number" step="0.5" value={formData.tax_rate}
                                            onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                                            onBlur={handleCalculate} required />
                                        <Input label="MwSt (€)" value={formData.amount_tax} readOnly className="bg-slate-50/50"
                                            startIcon={<FaEuroSign className="text-slate-400 text-[9px]" />} />
                                    </div>
                                )}

                                {formData.tax_exemption !== 'none' && (
                                    <Input label="Betrag (€)" type="number" step="0.01" value={formData.amount_net}
                                        onChange={(e) => setFormData({ ...formData, amount_net: e.target.value })}
                                        onBlur={handleCalculate}
                                        startIcon={<FaEuroSign className="text-slate-400 text-[9px]" />} required />
                                )}
                            </div>

                            {/* Brutto total */}
                            <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded flex justify-between items-center">
                                <span className="text-emerald-700 font-bold uppercase text-[9px] tracking-wider">Brutto</span>
                                <span className="text-lg font-black text-emerald-900">
                                    {fmtEur(formData.tax_exemption === 'none' ? formData.amount_gross : formData.amount_net)}
                                </span>
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            {/* Notizen */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <FaStickyNote className="text-brand-500 text-[10px]" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Notizen</span>
                                </div>
                                <Input label="" isTextArea value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Hinweise für den Kunden..." />
                            </div>

                            {/* Info */}
                            <div className="flex items-start gap-2 p-2 bg-blue-50/80 border border-blue-100 rounded text-[9px] text-blue-600">
                                <FaInfoCircle className="text-blue-400 mt-0.5 shrink-0 text-[10px]" />
                                <span>Rechnungsnummer wird beim Erstellen automatisch vergeben (GoBD, lückenlos).</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                            <button onClick={onClose} className="text-[9px] font-bold text-slate-500 hover:text-slate-700 transition uppercase tracking-widest">
                                Abbrechen
                            </button>
                            <Button
                                onClick={() => onSubmit(formData)}
                                isLoading={isLoading}
                                disabled={!activeProject}
                                className="shadow-lg shadow-emerald-200/50 py-1.5 text-[9px] uppercase font-black"
                                variant="primary"
                            >
                                <FaCheck className="mr-1.5" /> Entwurf erstellen
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewInvoiceModal;
