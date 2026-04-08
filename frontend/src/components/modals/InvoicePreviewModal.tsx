import React, { useState, useEffect } from 'react';
import { FaTimes, FaFileInvoice, FaPaperPlane, FaStamp, FaBan, FaLock, FaArchive, FaTrash } from 'react-icons/fa';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../../api/services';
import api from '../../api/axios';
import InvoiceStatusBadge from '../invoices/InvoiceStatusBadge';
import { Button } from '../ui/button';
import DataTable from '../common/DataTable';
import toast from 'react-hot-toast';
import ConfirmModal from '../common/ConfirmModal';

interface InvoicePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: any;
    onStatusChange?: () => void;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ isOpen, onClose, invoice, onStatusChange }) => {
    const queryClient = useQueryClient();
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);
    const [activeTab, setActiveTab] = useState<'preview' | 'audit'>('preview');
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

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

            if (activeTab === 'audit') {
                fetchAuditLogs();
            }
        }

        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [isOpen, invoice?.id, activeTab]);

    const fetchAuditLogs = async () => {
        if (!invoice?.id) return;
        setIsLoadingLogs(true);
        try {
            const logs = await invoiceService.getAuditLogs(invoice.id);
            setAuditLogs(logs);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            toast.error('Audit Trail konnte nicht geladen werden');
        } finally {
            setIsLoadingLogs(false);
        }
    };

    // Draft-only delete
    const deleteMutation = useMutation({
        mutationFn: () => invoiceService.delete(invoice?.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Entwurf gelöscht');
            if (onStatusChange) onStatusChange();
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
            if (onStatusChange) onStatusChange();
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
            if (onStatusChange) onStatusChange();
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

    const isLocked = invoice.is_locked;
    const isDraft = invoice.status === 'draft';
    const isCreditNote = invoice.type === 'credit_note';
    const canCancel = ['issued', 'sent', 'paid', 'overdue'].includes(invoice.status) && !invoice.credit_note;



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
                                {isLocked && <FaLock className="text-slate-300 text-[10px]" title="GoBD-gesperrt" />}
                            </div>

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
                                className="h-8 px-3 rounded flex items-center gap-2 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors text-[10px] font-bold uppercase tracking-widest"
                            >
                                <FaPaperPlane className="text-[10px]" />
                                Mahnung
                            </button>
                        )}

                        {/* Stornieren button */}
                        {canCancel && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 px-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                                onClick={() => {
                                    setConfirmTitle('Rechnung stornieren');
                                    setConfirmMessage('Möchten Sie diese Rechnung wirklich stornieren? Es wird eine automatische Gutschrift erstellt.');
                                    setConfirmVariant('warning');
                                    setCancelReason('');
                                    setConfirmAction(() => () => cancelMutation.mutate(cancelReason || undefined));
                                    setConfirmOpen(true);
                                }}
                            >
                                <FaBan className="text-[10px]" />
                                {isCreditNote ? 'Gutschrift stornieren' : 'Stornieren'}
                            </Button>
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
                                className="h-8 px-3 rounded flex items-center gap-2 bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors text-[10px] font-bold uppercase tracking-widest"
                            >
                                <FaArchive className="text-[10px]" />
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
                                className="h-8 px-4 rounded flex items-center gap-2 bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors text-[10px] font-bold uppercase tracking-widest shadow-none"
                            >
                                <FaStamp className="text-[10px]" />
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
                                className="h-8 px-3 rounded flex items-center gap-2 bg-white text-red-500 border border-red-100 hover:bg-red-50 transition-colors text-[10px] font-bold uppercase tracking-widest"
                            >
                                <FaTrash className="text-[10px]" />
                                Löschen
                            </button>
                        )}

                        <div className="w-px h-6 bg-slate-200 mx-2" />

                        <div className="flex bg-slate-100 p-0.5 rounded-lg mr-2">
                            <button
                                onClick={() => setActiveTab('preview')}
                                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Vorschau
                            </button>
                            <button
                                onClick={() => setActiveTab('audit')}
                                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'audit' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Verlauf
                            </button>
                        </div>

                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white overflow-hidden flex flex-col">
                    {activeTab === 'preview' ? (
                        isFetchingPreview ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Generiere Vorschau...</span>
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
                        )
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                            <div className="max-w-4xl mx-auto">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                                    GoBD-konformer Verlauf & Ereignisprotokoll
                                </h3>

                                <DataTable
                                    isLoading={isLoadingLogs}
                                    data={auditLogs}
                                    columns={[
                                        {
                                            id: 'action',
                                            header: 'Aktion',
                                            accessor: (log: any) => (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.action === 'issued' ? 'bg-brand-primary/10 text-brand-primary' :
                                                    log.action === 'cancelled' ? 'bg-red-50 text-red-600' :
                                                        log.action === 'paid' ? 'bg-green-50 text-green-600' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            )
                                        },
                                        {
                                            id: 'date',
                                            header: 'Zeitpunkt',
                                            accessor: (log: any) => <span className="text-[10px] font-bold text-slate-500">{new Date(log.created_at).toLocaleString('de-DE')}</span>
                                        },
                                        {
                                            id: 'user',
                                            header: 'Benutzer',
                                            accessor: (log: any) => <span className="text-[10px] font-bold text-slate-600">{log.user?.name || 'System'}</span>
                                        },
                                        {
                                            id: 'status',
                                            header: 'Statuswechsel',
                                            accessor: (log: any) => (
                                                <span className="text-[11px] text-slate-600 font-medium whitespace-nowrap">
                                                    {log.old_status || '-'} <span className="text-slate-300 mx-1">→</span> {log.new_status || '-'}
                                                </span>
                                            )
                                        },
                                        {
                                            id: 'ip',
                                            header: 'IP-Adresse',
                                            accessor: (log: any) => <span className="text-[9px] text-slate-400 font-mono">{log.ip_address || '-'}</span>
                                        }
                                    ]}
                                    pageSize={15}
                                />
                            </div>
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
