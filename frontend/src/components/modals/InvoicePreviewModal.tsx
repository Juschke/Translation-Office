import React, { useState, useEffect } from 'react';
import { FaTimes, FaFileInvoice, FaPaperPlane, FaStamp, FaBan, FaLock } from 'react-icons/fa';
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

    // GoBD: Cancel (Storno → creates credit note)
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white shadow-2xl w-full h-full flex flex-col overflow-hidden fade-in">
                {/* Header */}
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 gap-3 shrink-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg md:text-xl ${isCreditNote ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-700'}`}>
                            <FaFileInvoice />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <h2 className="text-sm md:text-lg font-bold text-slate-800 tracking-tight truncate">
                                    {isCreditNote ? 'Gutschrift' : 'Rechnung'} {invoiceNumber}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <InvoiceStatusBadge status={invoice.status} reminderLevel={invoice.reminder_level} type={invoice.type} />
                                    {isLocked && <FaLock className="text-slate-400 text-[10px] md:text-xs" title="GoBD-gesperrt" />}
                                </div>
                            </div>
                            <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest font-bold truncate">
                                {customerName} • {projectName} • <span className={amountGrossEur < 0 ? 'text-red-500' : 'text-slate-700'}>{fmtEur(amountGrossEur)}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 self-end sm:self-auto">
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
                                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-orange-600 hover:bg-orange-50 border border-transparent hover:border-orange-200 rounded-md transition font-medium text-xs md:text-sm"
                                title="Mahnung"
                            >
                                <FaPaperPlane className="text-xs" />
                                <span className="hidden md:inline">Mahnung</span>
                            </button>
                        )}

                        {/* Cancel / Storno button (issued invoices only) */}
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
                                className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-md transition font-medium text-xs md:text-sm border border-transparent ${isCreditNote
                                    ? 'text-red-600 hover:bg-red-50 hover:border-red-200'
                                    : 'text-amber-600 hover:bg-amber-50 hover:border-amber-200'
                                    }`}
                                title={isCreditNote ? "Gutschrift stornieren" : "Rechnung stornieren"}
                            >
                                <FaBan className="text-xs" />
                                <span className="hidden md:inline">{isCreditNote ? 'Gutschrift stornieren' : 'Stornieren'}</span>
                            </button>
                        )}

                        {/* Issue button (draft only) */}
                        {isDraft && (
                            <button
                                onClick={() => {
                                    setConfirmTitle('Rechnung ausstellen');
                                    setConfirmMessage('Rechnung ausstellen und unwiderruflich sperren? (GoBD-konform)');
                                    setConfirmVariant('info');
                                    setConfirmAction(() => () => issueMutation.mutate());
                                    setConfirmOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 rounded-md transition font-medium text-xs md:text-sm"
                                title="Ausstellen"
                            >
                                <FaStamp className="text-xs" />
                                <span className="hidden md:inline">Ausstellen</span>
                            </button>
                        )}

                        {/* Delete button (draft only) */}
                        {isDraft && (
                            <button
                                onClick={() => {
                                    setConfirmTitle('Entwurf löschen');
                                    setConfirmMessage('Rechnungsentwurf endgültig löschen?');
                                    setConfirmVariant('danger');
                                    setConfirmAction(() => () => deleteMutation.mutate());
                                    setConfirmOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-md transition font-medium text-xs md:text-sm"
                                title="Löschen"
                            >
                                <span className="hidden md:inline">Löschen</span>
                            </button>
                        )}

                        {(canCancel || (!isDraft && !isCreditNote && invoice.status !== 'paid' && invoice.status !== 'cancelled') || isDraft) && (
                            <div className="w-px h-6 bg-slate-200 mx-1 md:mx-2" />
                        )}

                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-md transition">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-slate-100 overflow-hidden flex justify-center items-center">
                    {isFetchingPreview ? (
                        <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Generiere Vorschau...</span>
                        </div>
                    ) : (
                        <div className="w-full h-full relative">
                            <iframe
                                title="Invoice Preview"
                                src={previewUrl}
                                className="w-full h-full border-none block"
                            />
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
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Storno-Grund (optional)</label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
