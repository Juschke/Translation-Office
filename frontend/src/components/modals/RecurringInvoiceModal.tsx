import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../api/services/customers';
import { invoiceService, recurringInvoiceService } from '../../api/services/invoices';
import CustomerSelect from '../common/CustomerSelect';
import SearchableSelect from '../common/SearchableSelect';
import { FaInfoCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface RecurringInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: any | null;
}

const RecurringInvoiceModal = ({ isOpen, onClose, invoice }: RecurringInvoiceModalProps) => {
    const queryClient = useQueryClient();
    const isEditMode = !!invoice;

    const [formData, setFormData] = useState<any>({
        name: '',
        customer_id: '',
        interval: 'monthly',
        next_run_at: dayjs().format('YYYY-MM-DD'),
        auto_issue: false,
        due_days: 14,
        notes: '',
        template_invoice_id: '',
        template_items: []
    });

    const { data: customersResponse } = useQuery({
        queryKey: ['customers'],
        queryFn: () => customerService.getAll()
    });

    const { data: invoicesResponse } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => invoiceService.getAll()
    });

    const customerOptions = useMemo(() => {
        const list = customersResponse?.data || [];
        return (list as any[]).map((c: any) => ({
            value: c.id.toString(),
            label: c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim()
        }));
    }, [customersResponse]);

    const invoiceOptions = useMemo(() => {
        const list = invoicesResponse?.data || [];
        return (list as any[]).map((inv: any) => ({
            value: inv.id.toString(),
            label: `${inv.invoice_number} - ${inv.customer_name} (${(inv.amount_gross_cents / 100).toFixed(2)} €)`
        }));
    }, [invoicesResponse]);

    useEffect(() => {
        if (isOpen) {
            if (invoice) {
                setFormData({
                    ...invoice,
                    customer_id: invoice.customer_id?.toString(),
                    template_invoice_id: invoice.template_invoice_id?.toString()
                });
            } else {
                setFormData({
                    name: '',
                    customer_id: '',
                    interval: 'monthly',
                    next_run_at: dayjs().format('YYYY-MM-DD'),
                    auto_issue: false,
                    due_days: 14,
                    notes: '',
                    template_invoice_id: '',
                    template_items: []
                });
            }
        }
    }, [isOpen, invoice]);

    const createMutation = useMutation({
        mutationFn: recurringInvoiceService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringInvoices'] });
            toast.success('Serienrechnung angelegt.');
            onClose();
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => recurringInvoiceService.update(invoice.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringInvoices'] });
            toast.success('Serienrechnung aktualisiert.');
            onClose();
        }
    });

    const handleSubmit = () => {
        if (!formData.name || !formData.customer_id) {
            toast.error('Name und Kunde sind erforderlich.');
            return;
        }
        if (isEditMode) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleTemplateChange = async (val: string) => {
        setFormData((prev: any) => ({ ...prev, template_invoice_id: val }));
        if (val) {
            try {
                const fullInv = await invoiceService.getById(Number(val));
                if (fullInv && fullInv.items) {
                    setFormData((prev: any) => ({
                        ...prev,
                        template_items: fullInv.items.map((it: any) => ({
                            description: it.description,
                            quantity: it.quantity,
                            unit: it.unit,
                            price: it.unit_price_cents ? it.unit_price_cents / 100 : it.price,
                            tax_rate: it.tax_rate
                        }))
                    }));
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto custom-scrollbar">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {isEditMode ? 'Abonnement bearbeiten' : 'Neues Abonnement'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Linke Seite: Basis-Daten */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Bezeichnung</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="z. B. Wartungspauschale 2025"
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Kunde</label>
                            <CustomerSelect
                                value={formData.customer_id}
                                options={customerOptions}
                                onChange={val => setFormData({ ...formData, customer_id: val })}
                                className="h-10"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Intervall</label>
                                <select
                                    className="w-full h-10 border border-slate-200 rounded-sm text-sm px-3 bg-white outline-none focus:ring-1 focus:ring-brand-primary/20"
                                    value={formData.interval}
                                    onChange={e => setFormData({ ...formData, interval: e.target.value })}
                                >
                                    <option value="monthly">Monatlich</option>
                                    <option value="quarterly">Vierteljährlich</option>
                                    <option value="yearly">Jährlich</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Zahlungsziel (Tage)</label>
                                <Input
                                    type="number"
                                    value={formData.due_days}
                                    onChange={e => setFormData({ ...formData, due_days: parseInt(e.target.value) })}
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Erster Lauf am</label>
                            <Input
                                type="date"
                                value={formData.next_run_at}
                                onChange={e => setFormData({ ...formData, next_run_at: e.target.value })}
                                className="h-10"
                            />
                        </div>
                    </div>

                    {/* Rechte Seite: Template & Automatisierung */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Vorlagen-Rechnung (Snapshot)</label>
                            <SearchableSelect
                                placeholder="Rechnung wählen..."
                                value={formData.template_invoice_id}
                                options={invoiceOptions}
                                onChange={handleTemplateChange}
                                className="h-10"
                            />
                            <p className="text-[10px] text-slate-400 italic flex items-center gap-1 mt-1">
                                <FaInfoCircle /> Positionen werden von dieser Rechnung kopiert.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 mt-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Automatisierung</span>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                    <input
                                        type="checkbox"
                                        name="auto_issue"
                                        id="auto_issue"
                                        checked={formData.auto_issue}
                                        onChange={e => setFormData({ ...formData, auto_issue: e.target.checked })}
                                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-2 border-slate-300 appearance-none cursor-pointer transition-all duration-300 checked:right-0 checked:border-emerald-500"
                                    />
                                    <label htmlFor="auto_issue" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-200 cursor-pointer transition-colors duration-300"></label>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                {formData.auto_issue
                                    ? "Rechnungen werden am Ausführungstag automatisch erstellt und ALS ENTWURF gespeichert. Du wirst benachrichtigt."
                                    : "Du erhältst am Ausführungstag eine Benachrichtigung und kannst die Rechnung manuell mit einem Klick erstellen."}
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Interne Notizen</label>
                            <Textarea
                                rows={3}
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Details zum Abonnement..."
                                className="resize-none text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* Zusammenfassung / Item Liste (Vorschau) */}
                {formData.template_items?.length > 0 && (
                    <div className="mt-4 border-t border-slate-200 pt-6">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3 ml-1">Kopierte Positionen</label>
                        <div className="space-y-2">
                            {formData.template_items.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded text-xs">
                                    <span className="font-semibold text-slate-700">{item.description}</span>
                                    <span className="text-slate-500">{item.quantity} {item.unit} à {(item.price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter className="flex gap-2 pt-6 border-t border-slate-100">
                    <Button variant="secondary" onClick={onClose} className="h-10 px-6 font-bold uppercase text-[11px] tracking-widest">
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="h-10 px-8 font-bold uppercase text-[11px] tracking-widest"
                    >
                        {isEditMode ? 'Speichern' : 'Abonnement anlegen'}
                    </Button>
                </DialogFooter>
            </DialogContent>

            <style>{`
                .toggle-checkbox:checked {
                    right: 0 !important;
                    border-color: #10b981 !important;
                }
                .toggle-checkbox:checked + .toggle-label {
                    background-color: #10b981 !important;
                }
            `}</style>
        </Dialog>
    );
};

export default RecurringInvoiceModal;
