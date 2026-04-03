import React, { useState, useEffect } from 'react';
import { FaTimes, FaFileInvoice, FaPaperPlane, FaStamp, FaBan, FaLock, FaArchive, FaTrash } from 'react-icons/fa';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../../api/services';
import api from '../../api/axios';
import InvoiceStatusBadge from '../invoices/InvoiceStatusBadge';
import toast from 'react-hot-toast';
import ConfirmModal from '../common/ConfirmModal';

interface InvoicePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: any;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ isOpen, onClose, invoice }) => {
    const queryClient = useQueryClient();
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState<() => void>(() => { });
    const [confirmVariant, setConfirmVariant] = useState<'danger' | 'warning' | 'info'>('info');
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        if (isOpen && invoice?.id) {
            const fetchPreview = async () => {
                setIsFetchingPreview(true);
                try {
                    const response = await api.get(`/invoices/${invoice.id}/preview`, {
                        responseType: 'blob'
                    });
                    const url = URL.createObjectURL(response.data);
                    setPreviewUrl(url);
                } catch (error) {
                    console.error('Failed to fetch invoice preview:', error);
                    toast.error('Vorschau konnte nicht geladen werden');
                } finally {
                    setIsFetchingPreview(false);
                }
            };
            fetchPreview();
        }

        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [isOpen, invoice?.id]);

    // Draft-only delete
    const deleteMutation = useMutation({
        mutationFn: () => invoiceService.delete(invoice?.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Entwurf gelöscht');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Nur Entwürfe können gelöscht werden.');
        }
    });

    // GoBD: Issue (draft → issued)
    const issueMutation = useMutation({
        mutationFn: () => invoiceService.issue(invoice?.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Rechnung ausgestellt und gesperrt (GoBD-konform)');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Fehler beim Ausstellen');
        }
    });

    // Cancel (Storno → creates credit note)
    const cancelMutation = useMutation({
        mutationFn: (reason?: string) => invoiceService.cancel(invoice?.id, reason),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success(data?.message || 'Rechnung storniert, Gutschrift erstellt');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Fehler beim Stornieren');
        }
    });

    // Archive (cancelled → archived)
    const archiveMutation = useMutation({
        mutationFn: () => invoiceService.bulkUpdate([invoice?.id], { status: 'archived' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Rechnung archiviert');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Fehler beim Archivieren');
        }
    });

    if (!isOpen || !invoice) return null;

    const invoiceNumber = invoice.invoice_number || '-';
    const customerName = invoice.snapshot_customer_name || invoice.customer?.company_name || '';
    const projectName = invoice.snapshot_project_name || invoice.project?.project_name || '';
    const isLocked = invoice.is_locked;
    const isDraft = invoice.status === 'draft';
    const isCreditNote = invoice.type === 'credit_note';
    const canCancel = ['issued', 'sent', 'paid', 'overdue'].includes(invoice.status) && !invoice.credit_note;

    // Consistency fixer: Ensure gross amout is calculated/displayed the same way as in the table
    const amountGrossEur = invoice.amount_gross_eur ?? (invoice.amount_gross / 100);
    const fmtEur = (val: number) => val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn p-4 md:p-10">
            <div className="bg-white shadow-2xl w-full max-w-6xl h-full flex flex-col overflow-hidden rounded-xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white gap-3 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-lg ${isCreditNote ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-900'}`}>
                            <FaFileInvoice />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-slate-800 tracking-tight truncate">
                                    {isCreditNote ? 'Gutschrift' : 'Rechnung'} {invoiceNumber}
                                </h2>
                                <InvoiceStatusBadge status={invoice.status} reminderLevel={invoice.reminder_level} type={invoice.type} />
                                {isLocked && <FaLock className="text-slate-300 text-2xs" title="GoBD-gesperrt" />}
                            </div>
                            <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
                                {customerName} • {projectName} • <span className={amountGrossEur < 0 ? 'text-red-500' : 'text-slate-500'}>{fmtEur(amountGrossEur)}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 group">
                        {/* Reminder button (for issued/sent/overdue) */}
                        {!isDraft && !isCreditNote && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <button
                                onClick={() => {
                                    setConfirmTitle('Mahnung erstellen');
                                    setConfirmMessage('Mahnung für diese Rechnung erstellen/hochstufen?');
                                    setConfirmVariant('warning');
                                    setConfirmAction(() => () => {
                                        const nextLevel = (invoice.reminder_level || 0) + 1;
                                        invoiceService.bulkUpdate([invoice.id], {
                                            reminder_level: nextLevel,
                                            last_reminder_date: new Date().toISOString().split('T')[0]
                                        }).then(() => {
                                            queryClient.invalidateQueries({ queryKey: ['invoices'] });
                                        });
                                    });
                                    setConfirmOpen(true);
                                }}
                                className="h-8 px-3 rounded flex items-center gap-2 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors text-2xs font-bold uppercase tracking-widest"
                            >
                                <FaPaperPlane className="text-2xs" />
                                Mahnung
                            </button>
                        )}

                        {/* Stornieren button */}
                        {canCancel && (
                            <button
                                onClick={() => {
                                    setConfirmTitle('Rechnung stornieren');
                                    setConfirmMessage('Möchten Sie diese Rechnung wirklich stornieren? Es wird eine automatische Gutschrift erstellt.');
                                    setConfirmVariant('warning');
                                    setCancelReason('');
                                    setConfirmAction(() => () => cancelMutation.mutate(cancelReason || undefined));
                                    setConfirmOpen(true);
                                }}
                                className="h-8 px-3 rounded flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors text-2xs font-bold uppercase tracking-widest"
                            >
                                <FaBan className="text-2xs" />
                                {isCreditNote ? 'Gutschrift stornieren' : 'Stornieren'}
                            </button>
                        )}

                        {/* Archivieren button */}
                        {invoice.status === 'cancelled' && (
                            <button
                                onClick={() => {
                                    setConfirmTitle('Rechnung archivieren');
                                    setConfirmMessage('Möchten Sie diese stornierte Rechnung archivieren? Sie wird aus der Hauptliste entfernt.');
                                    setConfirmVariant('info');
                                    setConfirmAction(() => () => archiveMutation.mutate());
                                    setConfirmOpen(true);
                                }}
                                className="h-8 px-3 rounded flex items-center gap-2 bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors text-2xs font-bold uppercase tracking-widest"
                            >
                                <FaArchive className="text-2xs" />
                                Archivieren
                            </button>
                        )}

                        {/* Ausstellen button */}
                        {isDraft && (
                            <button
                                onClick={() => {
                                    setConfirmTitle('Rechnung ausstellen');
                                    setConfirmMessage('Rechnung ausstellen und unwiderruflich sperren? (GoBD-konform)');
                                    setConfirmVariant('info');
                                    setConfirmAction(() => () => issueMutation.mutate());
                                    setConfirmOpen(true);
                                }}
                                className="h-8 px-4 rounded flex items-center gap-2 bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors text-2xs font-bold uppercase tracking-widest shadow-none"
                            >
                                <FaStamp className="text-2xs" />
                                Ausstellen
                            </button>
                        )}

                        {/* Löschen button */}
                        {isDraft && (
                            <button
                                onClick={() => {
                                    setConfirmTitle('Entwurf löschen');
                                    setConfirmMessage('Rechnungsentwurf endgültig löschen?');
                                    setConfirmVariant('danger');
                                    setConfirmAction(() => () => deleteMutation.mutate());
                                    setConfirmOpen(true);
                                }}
                                className="h-8 px-3 rounded flex items-center gap-2 bg-white text-red-500 border border-red-100 hover:bg-red-50 transition-colors text-2xs font-bold uppercase tracking-widest"
                            >
                                <FaTrash className="text-2xs" />
                                Löschen
                            </button>
                        )}

                        <div className="w-px h-6 bg-slate-200 mx-2" />

                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-white overflow-hidden flex flex-col">
                    {isFetchingPreview ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                            <span className="text-2xs font-bold uppercase tracking-widest">Generiere Vorschau...</span>
                        </div>
                    ) : (
                        <div className="w-full h-full">
                            {previewUrl ? (
                                <iframe
                                    title="Invoice Preview"
                                    src={previewUrl}
                                    className="w-full h-full border-none block"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 p-20 text-center">
                                    <FaFileInvoice size={40} className="mb-2 opacity-20" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Vorschau konnte nicht geladen werden</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <ConfirmModal
                    isOpen={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={() => {
                        confirmAction();
                        setConfirmOpen(false);
                    }}
                    title={confirmTitle}
                    message={confirmMessage}
                    variant={confirmVariant}
                    isLoading={deleteMutation.isPending || issueMutation.isPending || cancelMutation.isPending}
                >
                    {confirmTitle === 'Rechnung stornieren' && (
                        <div className="mt-4">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Storno-Grund (optional)</label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full border border-slate-200 rounded-sm p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="z.B. Korrektur, Fehlbuchung..."
                                rows={3}
                            />
                        </div>
                    )}
                </ConfirmModal>
            </div>
        </div>
    );
};

export default InvoicePreviewModal;
