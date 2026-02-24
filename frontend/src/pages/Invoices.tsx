import { useState, useMemo, useEffect } from 'react';
import { triggerBlobDownload } from '../utils/download';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaCheck, FaCheckCircle, FaHistory,
    FaDownload,
    FaFileInvoiceDollar, FaTrashRestore, FaPaperPlane,
} from 'react-icons/fa';
import { buildInvoiceColumns } from './invoiceColumns';

import Switch from '../components/common/Switch';
import DataTable from '../components/common/DataTable';
import KPICard from '../components/common/KPICard';
import InvoicePreviewModal from '../components/modals/InvoicePreviewModal';
import NewInvoiceModal from '../components/modals/NewInvoiceModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';
import ConfirmModal from '../components/common/ConfirmModal';
import { BulkActions } from '../components/common/BulkActions';
import type { MenuProps } from 'antd';
import { Space, Dropdown, Typography, Card } from 'antd';
import { Button } from '../components/ui/button';
import { DownOutlined, FilterOutlined, PlusOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;



const Invoices = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [statusFilter, setStatusFilter] = useState(location.state?.filter || 'pending');
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [previewInvoice, setPreviewInvoice] = useState<any>(null);
    const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
    const [downloadDropdownOpen, setDownloadDropdownOpen] = useState<number | null>(null);
    useEffect(() => {
        setSelectedInvoices([]);
    }, [statusFilter]);
    const [showTrash, setShowTrash] = useState(false);
    const [showArchive, setShowArchive] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.invoice-download-dropdown')) {
                setDownloadDropdownOpen(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (location.state?.openNewModal) {
            setIsNewInvoiceOpen(true);
            // Clear location state to prevent modal from reopening on refresh or navigation
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [invoiceToEdit, setInvoiceToEdit] = useState<any>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');

    const queryClient = useQueryClient();

    const { data: invoices = [], isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: invoiceService.getAll
    });

    const createMutation = useMutation({
        mutationFn: invoiceService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setIsNewInvoiceOpen(false);
            setInvoiceToEdit(null);
            toast.success('Rechnung erfolgreich erstellt');
        },
        onError: () => {
            toast.error('Fehler beim Erstellen der Rechnung');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (args: { id: number, data: any }) => invoiceService.update(args.id, args.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setIsNewInvoiceOpen(false);
            setInvoiceToEdit(null);
            toast.success('Rechnung erfolgreich aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren der Rechnung');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: invoiceService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedInvoices([]);
            toast.success('Rechnungsentwurf gelöscht');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Nur Entwürfe können gelöscht werden.');
        }
    });

    const [confirmAction, setConfirmAction] = useState<() => void>(() => { });
    const [confirmVariant, setConfirmVariant] = useState<'danger' | 'warning' | 'info'>('danger');
    const [confirmLabel, setConfirmLabel] = useState('Bestätigen');
    const [cancelReason, setCancelReason] = useState('');

    const issueMutation = useMutation({
        mutationFn: (id: number) => invoiceService.issue(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success('Rechnung ausgestellt und gesperrt (GoBD-konform)');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Fehler beim Ausstellen');
        }
    });

    const cancelMutation = useMutation({
        mutationFn: (args: { id: number; reason?: string }) => invoiceService.cancel(args.id, args.reason),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success(data?.message || 'Rechnung storniert, Gutschrift erstellt');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Fehler beim Stornieren');
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: number[], data: any }) => invoiceService.bulkUpdate(args.ids, args.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedInvoices([]);
            toast.success(`${variables.ids.length} Rechnungen aktualisiert`);
        },
        onError: () => {
            toast.error('Rechnungen konnten nicht aktualisiert werden');
        }
    });

    const markAsPaidMutation = useMutation({
        mutationFn: (id: number) => invoiceService.bulkUpdate([id], { status: 'paid' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success('Rechnung als bezahlt markiert');
        },
        onError: () => toast.error('Fehler beim Aktualisieren'),
    });

    const filteredInvoices = useMemo(() => {
        if (!Array.isArray(invoices)) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return invoices.filter((inv: any) => {
            const status = inv.status?.toLowerCase() || 'pending';
            const dueDate = new Date(inv.due_date);
            const isOverdue = dueDate < today && status !== 'paid' && status !== 'cancelled' && status !== 'deleted' && status !== 'archived' && status !== 'draft';

            // Trash and Archive are explicit states
            if (statusFilter === 'trash') return status === 'deleted' || status === 'gelöscht';
            if (statusFilter === 'archive') return status === 'archived' || status === 'archiviert';

            // Exclude Trash/Archive from main tabs
            if (status === 'deleted' || status === 'gelöscht' || status === 'archived' || status === 'archiviert') return false;

            if (statusFilter === 'credit_notes') return inv.type === 'credit_note';

            // Main tabs (exclude credit notes by default to avoid confusion)
            if (statusFilter !== 'all' && inv.type === 'credit_note') return false;

            if (statusFilter === 'paid') return status === 'paid' || status === 'bezahlt';
            if (statusFilter === 'cancelled') return status === 'cancelled' || status === 'storniert';
            if (statusFilter === 'overdue') return isOverdue;
            if (statusFilter === 'reminders') return (inv.reminder_level > 0 || isOverdue) && status !== 'paid' && status !== 'cancelled';
            if (statusFilter === 'pending') {
                return (status === 'pending' || status === 'draft' || status === 'issued') && !isOverdue;
            }
            if (statusFilter === 'all') return true;

            return status === statusFilter;
        });
    }, [invoices, statusFilter]);

    const toggleSelection = (id: number) => {
        setSelectedInvoices(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedInvoices.length === filteredInvoices.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(filteredInvoices.map((p: any) => p.id));
        }
    };

    const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
        const ids = selectedInvoices.length > 0
            ? selectedInvoices
            : filteredInvoices.map((inv: any) => inv.id);

        if (ids.length === 0) return;

        if (format === 'csv') {
            try {
                const response = await invoiceService.datevExport(ids);
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `DATEV_Export_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success('DATEV Export erfolgreich erstellt.');
            } catch (error) {
                console.error('DATEV Export failure:', error);
                toast.error('Fehler beim DATEV Export.');
            }
            return;
        }

        // Keep other formats as is or placeholder
        const headers = ['Nr', 'Datum', 'Kunde', 'Projekt', 'Fällig', 'Betrag', 'Status'];
        const rows = filteredInvoices.filter((inv: any) => ids.includes(inv.id)).map((inv: any) => [
            inv.invoice_number,
            new Date(inv.date).toLocaleDateString('de-DE'),
            inv.snapshot_customer_name || inv.customer?.company_name || '',
            inv.snapshot_project_name || inv.project?.project_name || '',
            new Date(inv.due_date).toLocaleDateString('de-DE'),
            (inv.amount_gross_eur ?? (inv.amount_gross / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            inv.status || ''
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerBlobDownload(blob, `Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
    };

    const exportItems: MenuProps['items'] = [
        { key: 'xlsx', label: 'Excel (.xlsx)', icon: <FileExcelOutlined className="text-emerald-600" />, onClick: () => handleExport('xlsx') },
        { key: 'csv', label: 'CSV DATEV', icon: <FileTextOutlined className="text-blue-600" />, onClick: () => handleExport('csv') },
        { key: 'pdf', label: 'PDF Sammel-Report', icon: <FilePdfOutlined className="text-red-600" />, onClick: () => handleExport('pdf') },
    ];

    const actions_export = (
        <Dropdown menu={{ items: exportItems }} placement="bottomRight">
            <Button className="h-9 px-4">
                <FaDownload className="mr-2" />
                Export <DownOutlined style={{ fontSize: '10px' }} />
            </Button>
        </Dropdown>
    );

    const handlePrint = async (inv: any) => {
        try {
            // Show a small toast or indicator if possible, but the print dialog is the goal
            const response = await invoiceService.print(inv.id);

            // Create blob URL
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);

            // Create an iframe for direct printing without opening a new window
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
                    // Fallback to new window if iframe print fails
                    const printWindow = window.open(url, '_blank');
                    if (printWindow) {
                        printWindow.onload = () => printWindow.print();
                    }
                }

                // Cleanup after print dialog is closed or started
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    window.URL.revokeObjectURL(url);
                }, 2000);
            };
        } catch (error) {
            console.error('Print error:', error);
            toast.error('Fehler beim Öffnen der PDF-Datei zum Drucken.');
        }
    };

    const handleDownload = async (inv: any) => {
        try {
            // Use the authenticated download endpoint
            const response = await invoiceService.download(inv.id);

            // Create blob and trigger download
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${inv.invoice_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Fehler beim Herunterladen der PDF-Datei.');
        }
    };

    const handleDownloadXml = async (inv: any) => {
        try {
            const response = await invoiceService.downloadXml(inv.id);
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${inv.invoice_number}.xml`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('XML Download error:', error);
            toast.error('Fehler beim Herunterladen der XML-Datei.');
        }
    };

    const columns = buildInvoiceColumns({
        selectedInvoices,
        filteredInvoices,
        toggleSelection,
        toggleSelectAll,
        downloadDropdownOpen,
        setDownloadDropdownOpen,
        setPreviewInvoice,
        setInvoiceToEdit,
        setIsNewInvoiceOpen,
        issueMutation,
        cancelMutation,
        markAsPaidMutation,
        archiveMutation: bulkUpdateMutation,
        deleteMutation,
        handlePrint,
        handleDownload,
        handleDownloadXml,
        cancelReason,
        setCancelReason,
        setConfirmTitle,
        setConfirmMessage,
        setConfirmLabel,
        setConfirmVariant,
        setConfirmAction,
        setIsConfirmOpen,
    });

    const views = [
        { label: 'Alle Rechnungen', value: 'all' },
        { label: 'Offene Rechnungen', value: 'pending' },
        { label: 'Bezahlte Rechnungen', value: 'paid' },
        { label: 'Überfällig', value: 'overdue' },
        { label: 'Mahnungen', value: 'reminders' },
        { label: 'Storniert', value: 'cancelled' },
        { label: 'Gutschriften', value: 'credit_notes' },
        ...(showTrash || statusFilter === 'trash' ? [{ label: 'Papierkorb', value: 'trash' }] : []),
        ...(showArchive || statusFilter === 'archive' ? [{ label: 'Archiv', value: 'archive' }] : [])
    ];


    const extraControls = (
        <Dropdown
            dropdownRender={() => (
                <Card size="small" className="w-64">
                    <Text strong type="secondary" className="block mb-2 uppercase tracking-wider text-[10px]">Ansicht anpassen</Text>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Text>Papierkorb anzeigen</Text>
                            <Switch checked={showTrash} onChange={() => setShowTrash(!showTrash)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Text>Archiv anzeigen</Text>
                            <Switch checked={showArchive} onChange={() => setShowArchive(!showArchive)} />
                        </div>
                    </div>
                </Card>
            )}
            trigger={['click']}
        >
            <Button size="icon">
                <FilterOutlined />
            </Button>
        </Dropdown>
    );



    const activeInvoices = useMemo(() => {
        return invoices.filter((inv: any) => {
            const s = inv.status?.toLowerCase();
            return s !== 'archived' && s !== 'archiviert' && s !== 'deleted' && s !== 'gelöscht';
        });
    }, [invoices]);

    const totalOpenAmount = activeInvoices
        .filter((i: any) => i.status !== 'paid' && i.status !== 'cancelled' && i.type !== 'credit_note')
        .reduce((acc: number, curr: any) => acc + (curr.amount_gross_eur ?? (curr.amount_gross / 100)), 0);

    const totalPaidMonth = activeInvoices
        .filter((i: any) => i.status === 'paid')
        .reduce((acc: number, curr: any) => acc + (curr.amount_gross_eur ?? (curr.amount_gross / 100)), 0);

    const overdueCount = activeInvoices.filter((inv: any) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(inv.due_date);
        return dueDate < today && inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'draft';
    }).length;

    const reminderCount = activeInvoices.filter((inv: any) => {
        return (inv.reminder_level > 0 || (new Date(inv.due_date) < new Date() && inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'draft'));
    }).length;

    const paidCount = activeInvoices.filter((i: any) => i.status === 'paid').length;

    if (isLoading) return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex flex-col gap-6 fade-in pb-10">
            <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                    <Title level={4} style={{ margin: 0 }}>Rechnungen</Title>
                    <Text type="secondary">Zentralverwaltung aller Rechnungsbelege und DATEV-Exporte.</Text>
                </div>
                <Space>
                    <Button
                        variant={statusFilter === 'credit_notes' ? "danger" : "primary"}
                        onClick={() => setIsNewInvoiceOpen(true)}
                        className="h-9 px-6 font-bold"
                    >
                        <PlusOutlined className="mr-2" />
                        {statusFilter === 'credit_notes' ? 'Neue Gutschrift' : 'Neue Rechnung'}
                    </Button>
                </Space>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KPICard label="Offener Betrag" value={totalOpenAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaFileInvoiceDollar />} subValue={`${overdueCount} überfällig`} />
                <KPICard label="Bezahlt (Gesamt)" value={totalPaidMonth.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaCheckCircle />} subValue={`${paidCount} Transaktionen`} />
                <KPICard label="Mahnungen" value={`${reminderCount}`} icon={<FaPaperPlane />} subValue="Fällig / Aktiv" />
                <KPICard label="Fremdkosten" value="0,00 €" icon={<FaHistory />} subValue="Diesen Monat" />
            </div>

            <div className="flex-1 flex flex-col min-h-[500px] sm:min-h-0 relative z-0">
                <BulkActions
                    selectedCount={selectedInvoices.length}
                    onClearSelection={() => setSelectedInvoices([])}
                    actions={[
                        {
                            label: 'Bezahlt',
                            icon: <FaCheck className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'paid' } }),
                            variant: 'success',
                            show: statusFilter !== 'trash' && statusFilter !== 'cancelled' && statusFilter !== 'paid'
                        },
                        {
                            label: 'Mahnung senden',
                            icon: <FaPaperPlane className="text-xs text-amber-500" />,
                            onClick: () => {
                                setConfirmTitle('Mahnungen versenden');
                                setConfirmMessage(`${selectedInvoices.length} Mahnungen senden/hochstufen?`);
                                setConfirmLabel('Mahnungen senden');
                                setConfirmVariant('warning');
                                setConfirmAction(() => () => {
                                    toast.loading('Mahnungen werden verarbeitet...');
                                    selectedInvoices.forEach(id => {
                                        const inv = invoices.find((i: any) => i.id === id);
                                        const nextLevel = (inv?.reminder_level || 0) + 1;
                                        bulkUpdateMutation.mutate({
                                            ids: [id],
                                            data: {
                                                reminder_level: nextLevel,
                                                last_reminder_date: new Date().toISOString().split('T')[0]
                                            }
                                        });
                                    });
                                });
                                setIsConfirmOpen(true);
                            },
                            variant: 'primary',
                            show: statusFilter === 'reminders' || statusFilter === 'overdue'
                        },

                        {
                            label: 'Wiederherstellen',
                            icon: <FaTrashRestore className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'draft' } }),
                            variant: 'success',
                            show: statusFilter === 'trash'
                        },
                        {
                            label: 'Archivieren',
                            icon: <FaHistory className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'archived' } }),
                            variant: 'primary',
                            show: statusFilter === 'paid'
                        }
                    ]}
                />

                <DataTable
                    data={filteredInvoices}
                    columns={columns as any}
                    pageSize={10}
                    searchPlaceholder="Suchen nach Nr., Kunde oder Projekt..."
                    searchFields={['invoice_number', 'customer.company_name', 'project.project_name']}
                    actions={actions_export}
                    onViewChange={(v) => setStatusFilter(v)}
                    views={views}
                    currentView={statusFilter}
                    extraControls={extraControls}
                    onRowClick={(inv: any) => setPreviewInvoice(inv)}
                />
            </div>

            <InvoicePreviewModal isOpen={!!previewInvoice} onClose={() => setPreviewInvoice(null)} invoice={previewInvoice} />

            <NewInvoiceModal
                isOpen={isNewInvoiceOpen}
                onClose={() => {
                    setIsNewInvoiceOpen(false);
                    setInvoiceToEdit(null);
                }}
                onSubmit={(data: any) => {
                    if (invoiceToEdit) {
                        updateMutation.mutate({ id: invoiceToEdit.id, data });
                    } else {
                        createMutation.mutate(data);
                    }
                }}
                isLoading={createMutation.isPending || updateMutation.isPending}
                invoice={invoiceToEdit}
                defaultType={statusFilter === 'credit_notes' ? 'credit_note' : 'invoice'}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false);
                }}
                onConfirm={() => {
                    confirmAction();
                    setIsConfirmOpen(false);
                }}
                title={confirmTitle}
                message={confirmMessage}
                confirmLabel={confirmLabel}
                variant={confirmVariant}
                isLoading={deleteMutation.isPending || issueMutation.isPending || cancelMutation.isPending || bulkUpdateMutation.isPending}
            >
                {confirmTitle === 'Rechnung stornieren' && (
                    <div className="mt-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Storno-Grund (optional)</label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="z.B. Fehlerhafte Angaben, Kundenwunsch..."
                            rows={3}
                        />
                    </div>
                )}
            </ConfirmModal>
        </div>
    );
};

export default Invoices;
