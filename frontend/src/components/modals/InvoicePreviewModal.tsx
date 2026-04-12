import React, { useState, useEffect } from 'react';
import { FaTimes, FaFileInvoice, FaPaperPlane, FaStamp, FaBan, FaLock, FaArchive, FaTrash, FaDownload, FaPrint, FaEnvelope, FaEllipsisV } from 'react-icons/fa';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../../api/services';
import api from '../../api/axios';
import InvoiceStatusBadge from '../invoices/InvoiceStatusBadge';
import { Button } from '../ui/button';
import DataTable from '../common/DataTable';
import toast from 'react-hot-toast';
import ConfirmModal from '../common/ConfirmModal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
        }

        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [isOpen, invoice?.id]);

    const handleDownload = async () => {
        try {
            const response = await invoiceService.download(invoice.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${invoice.type === 'credit_note' ? 'Gutschrift' : 'Rechnung'}_${invoice.invoice_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Download fehlgeschlagen');
        }
    };

    const handlePrint = async () => {
        try {
            const response = await invoiceService.download(invoice.id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const printWindow = window.open(url);
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        } catch (error) {
            toast.error('Drucken fehlgeschlagen');
        }
    };

    const handleSendEmail = async () => {
        try {
            await toast.promise(
                invoiceService.sendEmail(invoice.id),
                {
                    loading: 'E-Mail wird vorbereitet...',
                    success: 'E-Mail erfolgreich versendet',
                    error: 'E-Mail konnte nicht versendet werden'
                }
            );
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        } catch (error) { }
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn p-2 md:p-10">
            <div className="bg-white shadow-2xl w-full max-w-6xl h-full flex flex-col overflow-hidden rounded-xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-white gap-3 shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-lg ${isCreditNote ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-900'}`}>
                            <FaFileInvoice />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-slate-800 tracking-tight truncate">
                                    {isCreditNote ? 'Gutschrift' : 'Rechnung'} {invoiceNumber}
                                </h2>
                                <div className="hidden sm:block">
                                    <InvoiceStatusBadge status={invoice.status} reminderLevel={invoice.reminder_level} type={invoice.type} />
                                </div>
                                {isLocked && <FaLock className="text-slate-300 text-[10px]" title="GoBD-gesperrt" />}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 group">
                        
                        {/* DESKTOP ACTIONS */}
                        <div className="hidden xl:flex items-center gap-2">
                            {/* Download button */}
                            {!isDraft && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 border-slate-200"
                                    onClick={handleDownload}
                                >
                                    <FaDownload className="text-[10px]" />
                                    Download
                                </Button>
                            )}

                            {/* Print button */}
                            {!isDraft && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 border-slate-200"
                                    onClick={handlePrint}
                                >
                                    <FaPrint className="text-[10px]" />
                                    Drucken
                                </Button>
                            )}

                            {/* Email button */}
                            {!isDraft && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 border-slate-200"
                                    onClick={handleSendEmail}
                                >
                                    <FaEnvelope className="text-[10px]" />
                                    E-Mail
                                </Button>
                            )}

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
                        </div>

                        <div className="hidden xl:block w-px h-4 bg-slate-200 mx-1" />

                        {/* Stornieren button - Always Visible on both desktop & mobile (per request) */}
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
                                <span className="hidden xs:inline">{isCreditNote ? 'Gutschrift stornieren' : 'Stornieren'}</span>
                            </Button>
                        )}

                        {/* MOBILE ACTIONS DROPDOWN */}
                        <div className="flex xl:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                                        <FaEllipsisV size={14} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {!isDraft && (
                                        <>
                                            <DropdownMenuItem onClick={handleDownload} className="text-xs font-bold gap-2">
                                                <FaDownload size={12} /> Download
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handlePrint} className="text-xs font-bold gap-2">
                                                <FaPrint size={12} /> Drucken
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleSendEmail} className="text-xs font-bold gap-2">
                                                <FaEnvelope size={12} /> E-Mail senden
                                            </DropdownMenuItem>
                                        </>
                                    )}

                                    {!isDraft && !isCreditNote && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                        <DropdownMenuItem 
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
                                            className="text-xs font-bold gap-2 text-amber-600"
                                        >
                                            <FaPaperPlane size={12} /> Mahnung
                                        </DropdownMenuItem>
                                    )}

                                    {invoice.status === 'cancelled' && (
                                        <DropdownMenuItem 
                                            onClick={() => {
                                                setConfirmTitle('Rechnung archivieren');
                                                setConfirmMessage('Möchten Sie diese stornierte Rechnung archivieren?');
                                                setConfirmVariant('info');
                                                setConfirmAction(() => () => archiveMutation.mutate());
                                                setConfirmOpen(true);
                                            }}
                                            className="text-xs font-bold gap-2"
                                        >
                                            <FaArchive size={12} /> Archivieren
                                        </DropdownMenuItem>
                                    )}

                                    {isDraft && (
                                        <>
                                            <DropdownMenuItem 
                                                onClick={() => {
                                                    setConfirmTitle('Rechnung ausstellen');
                                                    setConfirmMessage('Rechnung ausstellen und unwiderruflich sperren?');
                                                    setConfirmVariant('info');
                                                    setConfirmAction(() => () => issueMutation.mutate());
                                                    setConfirmOpen(true);
                                                }}
                                                className="text-xs font-bold gap-2 text-brand-primary"
                                            >
                                                <FaStamp size={12} /> Ausstellen
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => {
                                                    setConfirmTitle('Entwurf löschen');
                                                    setConfirmMessage('Rechnungsentwurf endgültig löschen?');
                                                    setConfirmVariant('danger');
                                                    setConfirmAction(() => () => deleteMutation.mutate());
                                                    setConfirmOpen(true);
                                                }}
                                                className="text-xs font-bold gap-2 text-red-600"
                                            >
                                                <FaTrash size={12} /> Löschen
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="w-px h-6 bg-slate-200 mx-1" />

                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white overflow-hidden flex flex-col">
                    {isFetchingPreview ? (
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
