import React, { useRef } from 'react';
import { FaTimes, FaDownload, FaPrint, FaEnvelope, FaCheck, FaTrash, FaHistory } from 'react-icons/fa';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../../api/services';

interface InvoicePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: any;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ isOpen, onClose, invoice }) => {
    const invoiceRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: (data: any) => invoiceService.update(invoice?.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }
    });

    const sendMutation = useMutation({
        mutationFn: () => invoiceService.sendEmail(invoice?.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            alert('Rechnung wurde erfolgreich versendet.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => invoiceService.bulkUpdate([invoice?.id], { status: 'deleted' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            onClose();
        }
    });

    const cancelMutation = useMutation({
        mutationFn: () => invoiceService.bulkUpdate([invoice?.id], { status: 'cancelled' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }
    });

    const restoreMutation = useMutation({
        mutationFn: () => invoiceService.bulkUpdate([invoice?.id], { status: 'pending' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }
    });

    if (!isOpen || !invoice) return null;

    const invoiceNumber = invoice.invoice_number || invoice.nr || '-';
    const amountNet = parseFloat(invoice.amount_net || invoice.amount || 0);
    const taxRate = parseFloat(invoice.tax_rate || 19) / 100;
    const amountTax = parseFloat(invoice.amount_tax || (amountNet * taxRate));
    const amountGross = parseFloat(invoice.amount_gross || (amountNet + amountTax));
    const customerName = invoice.customer ? (invoice.customer.company_name || `${invoice.customer.first_name} ${invoice.customer.last_name}`) : (invoice.client || '-');
    const projectName = invoice.project ? (invoice.project.project_name || invoice.project.project_number) : (invoice.project || '-');
    const invoiceDate = invoice.date ? new Date(invoice.date).toLocaleDateString('de-DE') : '-';

    const handleDownloadPdf = async () => {
        try {
            const response = await invoiceService.download(invoice.id);
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rechnung_${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            alert('Fehler beim Herunterladen der PDF.');
        }
    };

    const handlePrint = async () => {
        try {
            const response = await invoiceService.print(invoice.id);
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);

            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            iframe.src = url;

            document.body.appendChild(iframe);

            iframe.onload = () => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    const printWindow = window.open(url, '_blank');
                    if (printWindow) {
                        printWindow.onload = () => printWindow.print();
                    }
                }
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    window.URL.revokeObjectURL(url);
                }, 2000);
            };
        } catch (error) {
            console.error('Print error:', error);
            alert('Fehler beim Drucken.');
        }
    };

    const handleSendEmail = () => {
        if (invoice?.id) {
            sendMutation.mutate();
        }
    };

    const handleMarkAsPaid = () => {
        if (invoice?.id) {
            updateMutation.mutate({ status: 'paid' });
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[70] flex items-center justify-center backdrop-blur-sm p-4 animate-fadeIn print:bg-white print:p-0">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden print:h-auto print:shadow-none print:rounded-none">
                {/* Header - Hidden on Print */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0 print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                            📄
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">{invoiceNumber}</h3>
                                {invoice?.status === 'paid' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Bezahlt</span>}
                            </div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Rechnungsvorschau • Projekt ID: {invoice?.project_id || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {invoice?.status !== 'paid' && invoice?.status !== 'deleted' && (
                            <button
                                onClick={handleMarkAsPaid}
                                title="Als bezahlt markieren"
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-md transition shadow-sm border border-slate-200"
                            >
                                <FaCheck />
                            </button>
                        )}
                        {(invoice?.status === 'paid' || invoice?.status === 'cancelled') && (
                            <button
                                onClick={() => restoreMutation.mutate()}
                                title="Wiederherstellen (Offen setzen)"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition shadow-sm border border-slate-200"
                            >
                                <FaHistory />
                            </button>
                        )}
                        <button
                            onClick={handleSendEmail}
                            title="Rechnung versenden"
                            className="p-2 text-brand-600 hover:bg-brand-50 rounded-md transition shadow-sm border border-slate-200"
                        >
                            <FaEnvelope />
                        </button>
                        <button
                            onClick={handleDownloadPdf}
                            title="PDF Herunterladen"
                            className="p-2 text-slate-600 hover:bg-slate-50 rounded-md transition shadow-sm border border-slate-200"
                        >
                            <FaDownload />
                        </button>
                        <button
                            onClick={handlePrint}
                            title="Drucken"
                            className="p-2 text-slate-600 hover:bg-slate-50 rounded-md transition shadow-sm border border-slate-200"
                        >
                            <FaPrint />
                        </button>
                        {invoice?.status !== 'cancelled' && invoice?.status !== 'deleted' && (
                            <button
                                onClick={() => cancelMutation.mutate()}
                                title="Rechnung stornieren"
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-md transition shadow-sm border border-slate-200"
                            >
                                <FaHistory />
                            </button>
                        )}
                        {invoice?.status !== 'deleted' && (
                            <button
                                onClick={() => {
                                    if (confirm('Möchten Sie diese Rechnung wirklich löschen?')) {
                                        deleteMutation.mutate();
                                    }
                                }}
                                title="Rechnung löschen"
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition shadow-sm border border-slate-200"
                            >
                                <FaTrash className="text-sm" />
                            </button>
                        )}
                        <div className="w-px h-6 bg-slate-200 mx-2" />
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center print:bg-white print:p-0 print:overflow-visible">
                    <div
                        ref={invoiceRef}
                        id="invoice-content"
                        className="bg-white w-[210mm] min-h-[297mm] shadow-lg p-[20mm] text-slate-800 text-sm relative print:shadow-none print:w-full"
                    >
                        {/* Invoice Content Mockup */}
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h1 className="text-2xl font-bold text-brand-700 mb-2">Translation Office</h1>
                                <p className="text-xs text-slate-500">Musterstraße 123<br />10115 Berlin<br />Deutschland</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold text-slate-700 uppercase tracking-widest mb-1">Rechnung</h2>
                                <p className="text-sm font-bold text-slate-600">{invoiceNumber}</p>
                                <p className="text-xs text-slate-400 mt-1">Datum: {invoiceDate}</p>
                            </div>
                        </div>

                        <div className="mb-12">
                            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Empfänger</p>
                            <div className="font-bold text-lg">{customerName}</div>
                            <p className="text-slate-600">Am Business Park 1<br />12345 Business City</p>
                        </div>

                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-slate-100">
                                    <th className="text-left py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Beschreibung</th>
                                    <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-widest w-24">Menge</th>
                                    <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-widest w-32">Einzelpreis</th>
                                    <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-widest w-32">Gesamt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <tr>
                                    <td className="py-4 font-medium">Sprachdienstleistung (Projekt {projectName})</td>
                                    <td className="py-4 text-right text-slate-600">1.0</td>
                                    <td className="py-4 text-right text-slate-600">{amountNet.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                                    <td className="py-4 text-right font-bold text-slate-800">{amountNet.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                                </tr>
                                <tr>
                                    <td className="py-4 font-medium text-slate-500">Service-Pauschale</td>
                                    <td className="py-4 text-right text-slate-600">1.0</td>
                                    <td className="py-4 text-right text-slate-600">0,00 €</td>
                                    <td className="py-4 text-right font-bold text-slate-800">0,00 €</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} className="pt-6 text-right font-bold text-slate-500 text-xs uppercase tracking-widest">Zwischensumme</td>
                                    <td className="pt-6 text-right font-bold text-slate-600">{amountNet.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="py-2 text-right font-bold text-slate-500 text-xs uppercase tracking-widest">Umsatzsteuer {(taxRate * 100).toFixed(0)}%</td>
                                    <td className="py-2 text-right font-bold text-slate-600">{amountTax.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                                </tr>
                                <tr className="border-t-2 border-brand-100">
                                    <td colSpan={3} className="pt-4 text-right font-bold text-brand-700 text-sm uppercase tracking-widest">Gesamtbetrag</td>
                                    <td className="pt-4 text-right font-bold text-brand-700 text-xl">{amountGross.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-end">
                            <div className="text-xs text-slate-400">
                                <p>Zahlbar innerhalb von 14 Tagen ohne Abzug.</p>
                                <p>Bankverbindung: DE12 3456 7890 1234 5678 90</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-brand-700 font-cursive text-xl">Translation Office</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoicePreviewModal;
