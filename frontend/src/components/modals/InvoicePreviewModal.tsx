import React, { useState, useEffect } from 'react';
import { FaTimes, FaDownload, FaPrint, FaFileInvoice, FaCheckCircle, FaHistory } from 'react-icons/fa';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../../api/services';
import api from '../../api/axios';

interface InvoicePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: any;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ isOpen, onClose, invoice }) => {
    const queryClient = useQueryClient();
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);

    useEffect(() => {
        if (isOpen && invoice?.id) {
            const fetchPreview = async () => {
                setIsFetchingPreview(true);
                try {
                    const response = await api.get(`/invoices/${invoice.id}/preview`);
                    setPreviewHtml(response.data);
                } catch (error) {
                    console.error('Failed to fetch invoice preview:', error);
                } finally {
                    setIsFetchingPreview(false);
                }
            };
            fetchPreview();
        } else {
            setPreviewHtml('');
        }
    }, [isOpen, invoice?.id]);

    const deleteMutation = useMutation({
        mutationFn: () => invoiceService.delete(invoice?.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            onClose();
        }
    });

    const cancelMutation = useMutation({
        mutationFn: () => invoiceService.bulkUpdate([invoice?.id], { status: 'cancelled' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] })
    });

    const restoreMutation = useMutation({
        mutationFn: () => invoiceService.bulkUpdate([invoice?.id], { status: 'pending' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] })
    });

    if (!isOpen || !invoice) return null;

    const invoiceNumber = invoice.invoice_number || invoice.nr || '-';

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
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-lg flex items-center justify-center">
                            <FaFileInvoice className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Rechnung {invoiceNumber}</h2>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Vorschau • Entspricht dem PDF-Export</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="p-2 text-slate-600 hover:bg-white hover:text-brand-600 rounded-md transition border border-transparent hover:border-slate-200"
                            title="Drucken"
                        >
                            <FaPrint />
                        </button>
                        <button
                            onClick={handleDownloadPdf}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition font-medium text-sm shadow-sm"
                        >
                            <FaDownload className="text-xs" /> PDF Download
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-2" />
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-md transition"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-slate-200 p-8 overflow-auto flex justify-center custom-scrollbar">
                    {isFetchingPreview ? (
                        <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Generiere Vorschau...</span>
                        </div>
                    ) : (
                        <div className="bg-white shadow-2xl w-[210mm] min-h-[297mm] relative">
                            <iframe
                                title="Invoice Preview"
                                srcDoc={previewHtml}
                                className="w-full h-full min-h-[297mm] border-none block"
                                sandbox="allow-same-origin"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-white border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <FaCheckCircle className="text-emerald-500" /> DIN 5008 Konform
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <FaCheckCircle className="text-emerald-500" /> Finales Design
                        </div>
                        {(invoice.status === 'cancelled' || invoice.status === 'deleted') && (
                            <button
                                onClick={() => restoreMutation.mutate()}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-brand-600 uppercase tracking-wider hover:bg-brand-50 px-2 py-1 rounded transition"
                            >
                                <FaHistory /> Reaktivieren
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 text-slate-500">
                        {invoice.status !== 'cancelled' && (
                            <button
                                onClick={() => { if (confirm("Rechnung stornieren?")) cancelMutation.mutate(); }}
                                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:bg-amber-50 rounded transition"
                            >
                                Stornieren
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (confirm("Rechnung endgültig löschen?")) deleteMutation.mutate();
                            }}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 rounded transition"
                        >
                            Löschen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoicePreviewModal;
