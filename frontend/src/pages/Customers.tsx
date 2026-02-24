import { useState, useMemo, useEffect } from 'react';
import { triggerBlobDownload } from '../utils/download';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaUsers, FaBriefcase, FaChartLine,
    FaCheck, FaBan, FaEnvelope, FaDownload, FaTrashRestore, FaUserPlus, FaTrash
} from 'react-icons/fa';


import NewCustomerModal from '../components/modals/NewCustomerModal';
import Checkbox from '../components/common/Checkbox';
import Switch from '../components/common/Switch';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';
import ConfirmModal from '../components/common/ConfirmModal';
import { BulkActions } from '../components/common/BulkActions';
import type { MenuProps } from 'antd';
import { Space, Dropdown, Typography, Card } from 'antd';
import { Button } from '../components/ui/button';
import { DownOutlined, FilterOutlined, PlusOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;


const Customers = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState('Privat');
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [showTrash, setShowTrash] = useState(false);
    const [showArchive, setShowArchive] = useState(false);

    useEffect(() => {
        if (location.state?.openNewModal) {
            setIsModalOpen(true);
            setEditingCustomer(null);
            // Clear location state to prevent modal from reopening on refresh or navigation
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);
    // deleted/archived states removed in favor of typeFilter

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<number | number[] | null>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');

    const queryClient = useQueryClient();

    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getAll
    });

    const { data: stats } = useQuery({
        queryKey: ['customerStats'],
        queryFn: customerService.getStats
    });

    const createMutation = useMutation({
        mutationFn: customerService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsModalOpen(false);
            toast.success('Kunde erfolgreich angelegt');
        },
        onError: () => {
            toast.error('Fehler beim Anlegen des Kunden');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => customerService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsModalOpen(false);
            setEditingCustomer(null);
            toast.success('Kunde erfolgreich aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren des Kunden');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: customerService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedCustomers([]);
            toast.success('Kunde erfolgreich gelöscht');
        },
        onError: () => {
            toast.error('Fehler beim Löschen des Kunden');
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: number[], data: any }) => customerService.bulkUpdate(args.ids, args.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedCustomers([]);
            toast.success(`${variables.ids.length} Kunden aktualisiert`);
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren der Kunden');
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: customerService.bulkDelete,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedCustomers([]);
            toast.success(`${variables.length} Kunden endgültig gelöscht`);
        },
        onError: () => {
            toast.error('Fehler beim endgültigen Löschen');
        }
    });

    const activeCustomersData = useMemo(() => {
        return customers.filter((c: any) => {
            const s = c.status?.toLowerCase();
            return s !== 'archived' && s !== 'archiviert' && s !== 'deleted' && s !== 'gelöscht';
        });
    }, [customers]);

    const activeCustomersCount = activeCustomersData.length;

    const newCustomersCount = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return activeCustomersData.filter((c: any) => new Date(c.created_at) >= thirtyDaysAgo).length;
    }, [activeCustomersData]);


    const filteredCustomers = useMemo(() => {
        if (!Array.isArray(customers)) return [];
        return customers.filter((c: any) => {
            const status = c.status?.toLowerCase();

            if (typeFilter === 'trash') return status === 'deleted' || status === 'gelöscht';
            if (typeFilter === 'archive') return status === 'archived' || status === 'archiviert';

            // For all other tabs, exclude deleted and archived
            if (status === 'deleted' || status === 'gelöscht' || status === 'archived' || status === 'archiviert') return false;

            if (typeFilter === 'all') return true;

            const mappedType = c.type === 'company' ? 'Firma' : c.type === 'private' ? 'Privat' : c.type === 'authority' ? 'Behörde' : c.type;
            return mappedType === typeFilter;
        });
    }, [customers, typeFilter]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
    };

    const toggleSelection = (id: number) => {
        setSelectedCustomers(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedCustomers.length === filteredCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(filteredCustomers.map(c => c.id));
        }
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (filteredCustomers.length === 0) return;

        const headers = ['ID', 'Unternehmen/Name', 'Ansprechpartner', 'E-Mail', 'Umsatz', 'Status'];
        const rows = filteredCustomers.map((c: any) => [
            c.id,
            c.company_name || `${c.first_name} ${c.last_name}`,
            c.contact_person || '',
            c.email || '',
            c.sales || '0',
            c.status || ''
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerBlobDownload(blob, `Kunden_Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
    };


    const columns = [
        {
            id: 'selection',
            header: (
                <Checkbox
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={toggleSelectAll}
                />
            ),
            accessor: (c: any) => (
                <Checkbox
                    checked={selectedCustomers.includes(c.id)}
                    onChange={() => toggleSelection(c.id)}
                />
            ),
            className: 'w-10'
        },
        {
            id: 'company',
            header: 'Unternehmen',
            accessor: (c: any) => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 shrink-0 bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold border-slate-100 border rounded-sm`}>
                        {c.company_name?.substring(0, 2).toUpperCase() || c.last_name?.substring(0, 2).toUpperCase() || 'CU'}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-800 truncate">{c.company_name || `${c.first_name} ${c.last_name}`}</span>
                        <div className="flex gap-2">
                            <span className="text-xs text-slate-400 font-medium">ID: {c.id.toString().padStart(4, '0')}</span>
                            <span className="text-xs text-slate-300">•</span>
                            <span className="text-xs text-slate-500 font-medium">{c.type}</span>
                        </div>
                    </div>
                </div>
            ),
            sortable: true,
            sortKey: 'company_name'
        },
        {
            id: 'contact',
            header: 'Ansprechpartner',
            accessor: (c: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-700">{c.contact_person || `${c.first_name} ${c.last_name}`}</span>
                    <span className="text-xs text-slate-500">{c.email}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'contact_person'
        },
        {
            id: 'address',
            header: 'Adresse',
            accessor: (c: any) => (
                <div className="flex flex-col max-w-[150px]">
                    <span className="text-slate-700 truncate">{c.address_street} {c.address_house_no}</span>
                    <span className="text-xs text-slate-400 truncate">{c.address_zip} {c.address_city}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'address_city'
        },
        {
            id: 'phone',
            header: 'Telefon',
            accessor: (c: any) => <span className="text-slate-600">{c.phone || '-'}</span>,
            sortable: true,
            sortKey: 'phone'
        },
        {
            id: 'projects_count',
            header: 'Projekte',
            accessor: (c: any) => (
                <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-sm bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                        {c.projects_count || 0}
                    </div>
                </div>
            ),
            sortable: true,
            sortKey: 'projects_count',
            align: 'center' as const
        },
        {
            id: 'sales',
            header: 'Umsatz (YTD)',
            accessor: (c: any) => <span className="font-semibold text-slate-800">{formatCurrency(c.sales || 0)}</span>,
            sortable: true,
            sortKey: 'sales',
            align: 'right' as const
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (c: any) => {
                const statusStyles: { [key: string]: string } = {
                    'active': 'bg-emerald-50 text-emerald-700 border-emerald-100', // Lighter border
                    'inactive': 'bg-slate-50 text-slate-400 border-slate-200',
                    'deleted': 'bg-red-50 text-red-700 border-red-200',
                    'archived': 'bg-slate-800 text-white border-slate-700'
                };
                const labels: { [key: string]: string } = {
                    'active': 'Aktiv',
                    'inactive': 'Inaktiv',
                    'deleted': 'Gelöscht',
                    'archived': 'Archiviert'
                };
                const displayStatus = c.status === 'Aktiv' ? 'active' : c.status === 'Inaktiv' ? 'inactive' : c.status?.toLowerCase();
                return (
                    <span className={`px-2 py-0.5 rounded-sm text-xs font-semibold border tracking-tight ${statusStyles[displayStatus] || 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        {labels[displayStatus] || c.status}
                    </span>
                );
            },
            sortable: true,
            sortKey: 'status',
            align: 'center' as const
        },
        {
            id: 'actions',
            header: '',
            accessor: (c: any) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="h-8 w-8"
                    >
                        <EyeOutlined className="text-slate-400" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditingCustomer(c); setIsModalOpen(true); }}
                        className="h-8 w-8"
                    >
                        <EditOutlined className="text-slate-400" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            setCustomerToDelete(c.id);
                            setConfirmTitle('Kunde löschen');
                            setConfirmMessage('Sind Sie sicher, dass Sie diesen Kunden in den Papierkorb verschieben möchten?');
                            setIsConfirmOpen(true);
                        }}
                        className="h-8 w-8"
                    >
                        <DeleteOutlined className="text-red-400" />
                    </Button>
                </div>
            ),
            align: 'right' as const
        }
    ];

    const exportItems: MenuProps['items'] = [
        { key: 'xlsx', label: 'Excel (.xlsx)', icon: <FileExcelOutlined className="text-emerald-600" />, onClick: () => handleExport('xlsx') },
        { key: 'csv', label: 'CSV (.csv)', icon: <FileTextOutlined className="text-blue-600" />, onClick: () => handleExport('csv') },
        { key: 'pdf', label: 'PDF Report', icon: <FilePdfOutlined className="text-red-600" />, onClick: () => handleExport('pdf') },
    ];

    const actions_export = (
        <Dropdown menu={{ items: exportItems }} placement="bottomRight">
            <Button className="h-9 px-4">
                <FaDownload className="mr-2" />
                Export <DownOutlined style={{ fontSize: '10px' }} />
            </Button>
        </Dropdown>
    );

    const views = [
        { label: 'Alle Kunden', value: 'all' },
        { label: 'Privatkunden', value: 'Privat' },
        { label: 'Firmenkunden', value: 'Firma' },
        { label: 'Behörden', value: 'Behörde' },
        ...(showTrash || typeFilter === 'trash' ? [{ label: 'Papierkorb', value: 'trash' }] : []),
        ...(showArchive || typeFilter === 'archive' ? [{ label: 'Archiv', value: 'archive' }] : [])
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

    if (isLoading) return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex flex-col gap-6 fade-in pb-10">
            <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                    <Title level={4} style={{ margin: 0 }}>Kundenstamm</Title>
                    <Text type="secondary">Zentralverwaltung aller Auftraggeber und Rechnungsadressen.</Text>
                </div>
                <Space>
                    <Button
                        variant="primary"
                        onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
                        className="h-9 px-6 font-bold"
                    >
                        <PlusOutlined className="mr-2" />
                        Neuer Kunde
                    </Button>
                </Space>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KPICard label="Gesamtkunden" value={stats?.total_active || activeCustomersCount} icon={<FaUsers />} />
                <KPICard label="Neuzugänge" value={newCustomersCount} icon={<FaUserPlus />} subValue="Letzte 30 Tage" />
                <KPICard label="Top Auftraggeber" value={stats?.top_customer || '-'} icon={<FaBriefcase />} subValue="Höchster Umsatz YTD" />
                <KPICard
                    label="Umsatz YTD"
                    value={formatCurrency(stats?.total_revenue_ytd || 0)}
                    icon={<FaChartLine />}
                    trend={stats?.revenue_trend !== undefined ? {
                        value: `${stats.revenue_trend > 0 ? '+' : ''}${stats.revenue_trend}%`,
                        label: 'vs. Vorjahr',
                        isPositive: stats.revenue_trend >= 0
                    } : undefined}
                />
            </div>

            <div className="flex-1 flex flex-col min-h-[500px] sm:min-h-0 relative z-0">
                <BulkActions
                    selectedCount={selectedCustomers.length}
                    onClearSelection={() => setSelectedCustomers([])}
                    actions={[
                        {
                            label: 'Aktivieren',
                            icon: <FaCheck className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Aktiv' } }),
                            variant: 'success',
                            show: typeFilter !== 'trash'
                        },
                        {
                            label: 'E-Mail senden',
                            icon: <FaEnvelope className="text-xs" />,
                            onClick: () => {
                                // Get emails from selected customers
                                const selectedEmails = customers
                                    .filter((c: any) => selectedCustomers.includes(c.id))
                                    .map((c: any) => c.email)
                                    .filter(Boolean)
                                    .join(', ');

                                if (selectedEmails) {
                                    navigate('/inbox', {
                                        state: {
                                            compose: true,
                                            to: selectedEmails,
                                            subject: 'Nachricht an Kunden'
                                        }
                                    });
                                }
                            },
                            variant: 'primary',
                            show: typeFilter !== 'trash'
                        },
                        {
                            label: 'Deaktivieren',
                            icon: <FaBan className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Inaktiv' } }),
                            variant: 'danger',
                            show: typeFilter !== 'trash'
                        },
                        {
                            label: 'Wiederherstellen',
                            icon: <FaTrashRestore className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Aktiv' } }),
                            variant: 'success',
                            show: typeFilter === 'trash'
                        },
                        {
                            label: 'Löschen',
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Gelöscht' } }),
                            variant: 'danger',
                            show: typeFilter !== 'trash'
                        },
                        {
                            label: 'Endgültig löschen',
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => {
                                setCustomerToDelete(selectedCustomers);
                                setConfirmTitle('Kunden endgültig löschen');
                                setConfirmMessage(`Sind Sie sicher, dass Sie ${selectedCustomers.length} Kunden endgültig löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.`);
                                setIsConfirmOpen(true);
                            },
                            variant: 'dangerSolid',
                            show: typeFilter === 'trash'
                        }
                    ]}
                />


                <DataTable
                    data={filteredCustomers}
                    columns={columns as any}
                    onRowClick={(c) => navigate(`/customers/${c.id}`)}
                    pageSize={10}
                    searchPlaceholder="Kunden nach Name, Kontakt oder E-Mail suchen..."
                    searchFields={['company_name', 'contact_person', 'email']}
                    actions={actions_export}
                    onViewChange={(v) => setTypeFilter(v)}
                    views={views}
                    currentView={typeFilter}
                    extraControls={extraControls}
                />
            </div>

            <NewCustomerModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }}
                onSubmit={(data) => {
                    if (editingCustomer) {
                        updateMutation.mutate({ ...data, id: editingCustomer.id });
                    } else {
                        createMutation.mutate(data);
                    }
                }}
                initialData={editingCustomer || (
                    typeFilter === 'Firma' ? { type: 'company' } as any :
                        typeFilter === 'Privat' ? { type: 'private' } as any :
                            typeFilter === 'Behörde' ? { type: 'authority' } as any :
                                undefined
                )}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setCustomerToDelete(null);
                }}
                onConfirm={() => {
                    if (customerToDelete) {
                        if (Array.isArray(customerToDelete)) {
                            bulkDeleteMutation.mutate(customerToDelete, {
                                onSuccess: () => {
                                    setIsConfirmOpen(false);
                                    setCustomerToDelete(null);
                                }
                            });
                        } else {
                            deleteMutation.mutate(customerToDelete as number, {
                                onSuccess: () => {
                                    setIsConfirmOpen(false);
                                    setCustomerToDelete(null);
                                }
                            });
                        }
                    }
                }}
                title={confirmTitle}
                message={confirmMessage}
                isLoading={deleteMutation.isPending || bulkDeleteMutation.isPending}
            />
        </div>
    );
};

export default Customers;
