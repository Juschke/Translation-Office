import React, { useRef } from 'react';
import { FaTimes, FaDownload, FaPrint, FaEnvelope } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoicePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: any;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ isOpen, onClose, invoice }) => {
    const invoiceRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !invoice) return null;

    const handleDownloadPdf = async () => {
        if (!invoiceRef.current) return;

        const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Rechnung_${invoice.nr}.pdf`);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[70] flex items-center justify-center backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                            📄
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">{invoice.nr}</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Vorschau</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadPdf}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition text-slate-600 shadow-sm"
                        >
                            <FaDownload /> PDF
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition text-slate-600 shadow-sm">
                            <FaPrint /> Drucken
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-brand-700 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-brand-800 transition shadow-sm">
                            <FaEnvelope /> Senden
                        </button>
                        <button onClick={onClose} className="ml-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
                    <div
                        ref={invoiceRef}
                        className="bg-white w-[210mm] min-h-[297mm] shadow-lg p-[20mm] text-slate-800 text-sm relative"
                    >
                        {/* Invoice Content Mockup */}
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h1 className="text-2xl font-bold text-brand-700 mb-2">Translation Office</h1>
                                <p className="text-xs text-slate-500">Musterstraße 123<br />10115 Berlin<br />Deutschland</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold text-slate-700 uppercase tracking-widest mb-1">Rechnung</h2>
                                <p className="text-sm font-bold text-slate-600">{invoice.nr}</p>
                                <p className="text-xs text-slate-400 mt-1">Datum: {new Date(invoice.date).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="mb-12">
                            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Empfänger</p>
                            <div className="font-bold text-lg">{invoice.client}</div>
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
                                    <td className="py-4 font-medium">Sprachdienstleistung (Projekt {invoice.project})</td>
                                    <td className="py-4 text-right text-slate-600">1.0</td>
                                    <td className="py-4 text-right text-slate-600">{invoice.amount.toLocaleString('de-DE')} €</td>
                                    <td className="py-4 text-right font-bold text-slate-800">{invoice.amount.toLocaleString('de-DE')} €</td>
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
                                    <td className="pt-6 text-right font-bold text-slate-600">{invoice.amount.toLocaleString('de-DE')} €</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="py-2 text-right font-bold text-slate-500 text-xs uppercase tracking-widest">Umsatzsteuer (19%)</td>
                                    <td className="py-2 text-right font-bold text-slate-600">{(invoice.amount * 0.19).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                                </tr>
                                <tr className="border-t-2 border-brand-100">
                                    <td colSpan={3} className="pt-4 text-right font-bold text-brand-700 text-sm uppercase tracking-widest">Gesamtbetrag</td>
                                    <td className="pt-4 text-right font-bold text-brand-700 text-xl">{(invoice.amount * 1.19).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
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
