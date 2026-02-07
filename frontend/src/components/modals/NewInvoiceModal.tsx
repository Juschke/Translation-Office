import { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaFileInvoiceDollar, FaEuroSign, FaCheck, FaProjectDiagram } from 'react-icons/fa';
import Input from '../common/Input';
import { Button } from '../common/Button';
import SearchableSelect from '../common/SearchableSelect';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../../api/services';

interface NewInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    project?: any;
    isLoading?: boolean;
}

const NewInvoiceModal = ({ isOpen, onClose, onSubmit, project, isLoading }: NewInvoiceModalProps) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [formData, setFormData] = useState({
        invoice_number: '',
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount_net: '0.00',
        tax_rate: '19.00',
        amount_tax: '0.00',
        amount_gross: '0.00',
        currency: 'EUR',
        status: 'pending',
        notes: '',
        project_id: '',
        customer_id: ''
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects', 'active'],
        queryFn: () => projectService.getAll(),
        enabled: isOpen && !project
    });

    const projectOptions = useMemo(() => {
        return (Array.isArray(projects) ? projects : []).map((p: any) => ({
            value: p.id.toString(),
            label: `${p.project_number} - ${p.project_name} (${p.customer?.company_name || p.customer?.first_name || 'Unbekannt'})`
        }));
    }, [projects]);

    const activeProject = useMemo(() => {
        if (project) return project;
        return projects.find((p: any) => p.id.toString() === selectedProjectId);
    }, [project, selectedProjectId, projects]);

    useEffect(() => {
        if (activeProject) {
            const tempNumber = `RE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

            // Financials might be direct or nested
            const financials = activeProject.financials || activeProject;
            const net = parseFloat(financials.netTotal || financials.price_total || 0);
            const taxRate = 19.00;
            const tax = net * (taxRate / 100);
            const gross = net + tax;

            setFormData(prev => ({
                ...prev,
                invoice_number: prev.invoice_number || tempNumber,
                amount_net: net.toFixed(2),
                tax_rate: taxRate.toFixed(2),
                amount_tax: tax.toFixed(2),
                amount_gross: gross.toFixed(2),
                project_id: activeProject.id,
                customer_id: activeProject.customer_id || activeProject.customer?.id
            }));
        }
    }, [activeProject]);

    const handleCalculate = () => {
        const net = parseFloat(formData.amount_net) || 0;
        const rate = parseFloat(formData.tax_rate) || 0;
        const tax = net * (rate / 100);
        const gross = net + tax;

        setFormData({
            ...formData,
            amount_tax: tax.toFixed(2),
            amount_gross: gross.toFixed(2)
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-2xl shadow-2xl animate-zoomIn overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">
                            <FaFileInvoiceDollar />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Rechnung erstellen</h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {activeProject ? `Projekt: ${activeProject.project_name || activeProject.name}` : 'Projekt auswählen'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors leading-none">
                        <FaTimes className="text-lg" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-12 gap-6">
                        {!project && (
                            <div className="col-span-12">
                                <SearchableSelect
                                    label="Projekt auswählen"
                                    options={projectOptions}
                                    value={selectedProjectId}
                                    onChange={setSelectedProjectId}
                                    placeholder="Projekt suchen..."
                                    startIcon={<FaProjectDiagram className="text-slate-400" />}
                                />
                            </div>
                        )}

                        {/* Basic Info */}
                        <div className="col-span-12 md:col-span-6">
                            <Input
                                label="Rechnungsnummer"
                                value={formData.invoice_number}
                                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                                placeholder="z.B. RE-2024-001"
                                required
                            />
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <Input
                                label="Datum"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                            <Input
                                label="Fälligkeitsdatum"
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Kunde</label>
                            <div className="w-full h-11 px-3 flex items-center bg-slate-50 border border-slate-200 text-sm font-bold text-slate-500 rounded">
                                {activeProject?.customer?.company_name || activeProject?.customer?.first_name || 'Wähle ein Projekt...'}
                            </div>
                        </div>

                        <div className="col-span-12 h-px bg-slate-100 my-2"></div>

                        {/* Amounts */}
                        <div className="col-span-12 md:col-span-4">
                            <Input
                                label="Netto-Betrag (€)"
                                type="number"
                                step="0.01"
                                value={formData.amount_net}
                                onChange={(e) => setFormData({ ...formData, amount_net: e.target.value })}
                                onBlur={handleCalculate}
                                startIcon={<FaEuroSign className="text-slate-400 text-[10px]" />}
                                required
                            />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <Input
                                label="MwSt-Satz (%)"
                                type="number"
                                step="0.5"
                                value={formData.tax_rate}
                                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                                onBlur={handleCalculate}
                                required
                            />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <Input
                                label="MwSt-Betrag (€)"
                                value={formData.amount_tax}
                                readOnly
                                className="bg-slate-50/50"
                                startIcon={<FaEuroSign className="text-slate-400 text-[10px]" />}
                            />
                        </div>

                        <div className="col-span-12">
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg flex justify-between items-center">
                                <span className="text-emerald-700 font-bold uppercase text-xs tracking-wider">Gesamtbetrag (Brutto)</span>
                                <span className="text-2xl font-black text-emerald-900">{formData.amount_gross} €</span>
                            </div>
                        </div>

                        <div className="col-span-12">
                            <Input
                                label="Anmerkungen auf der Rechnung"
                                isTextArea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Zusätzliche Infos für den Kunden..."
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <button
                        onClick={onClose}
                        className="text-sm font-bold text-slate-500 hover:text-slate-700 transition uppercase tracking-widest"
                    >
                        Abbrechen
                    </button>
                    <Button
                        onClick={() => onSubmit(formData)}
                        isLoading={isLoading}
                        disabled={!activeProject || !formData.invoice_number}
                        className="shadow-lg shadow-emerald-200/50"
                        variant="primary"
                    >
                        <FaCheck className="mr-2" /> Rechnung finalisieren
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NewInvoiceModal;
