import { useNavigate } from 'react-router-dom';
import {
    FaLayerGroup, FaClock, FaEuroSign, FaEnvelope
} from 'react-icons/fa';
import NewProjectModal from '../components/modals/NewProjectModal';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import NewInvoiceModal from '../components/modals/NewInvoiceModal';
import { Space, Typography, Table, Tag, Card } from 'antd';
import { PlusOutlined, UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import { Button } from '../components/ui/button';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, projectService, invoiceService, customerService, partnerService } from '../api/services';
import RecentProjects from '../components/dashboard/RecentProjects';
import DashboardSkeleton from '../components/common/DashboardSkeleton';
import KPICard from '../components/common/KPICard';

const { Title, Text } = Typography;

const Dashboard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Modal States
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
    const [isNewPartnerModalOpen, setIsNewPartnerModalOpen] = useState(false);
    const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);

    const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: () => dashboardService.getStats()
    });

    const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll()
    });

    // Mutations
    const createProjectMutation = useMutation({
        mutationFn: projectService.create,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            navigate(`/projects/${data.id}`);
            toast.success('Projekt wurde angelegt');
        },
        onError: () => {
            toast.error('Fehler beim Anlegen des Projekts');
        }
    });

    const createCustomerMutation = useMutation({
        mutationFn: (data: any) => customerService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsNewCustomerModalOpen(false);
            toast.success('Kunde wurde angelegt');
        },
        onError: () => {
            toast.error('Fehler beim Anlegen des Kunden');
        }
    });

    const createPartnerMutation = useMutation({
        mutationFn: (data: any) => partnerService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            setIsNewPartnerModalOpen(false);
            toast.success('Partner wurde angelegt');
        },
        onError: () => {
            toast.error('Fehler beim Anlegen des Partners');
        }
    });

    const createInvoiceMutation = useMutation({
        mutationFn: (data: any) => invoiceService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setIsNewInvoiceModalOpen(false);
            toast.success('Rechnung wurde erstellt');
        },
        onError: () => {
            toast.error('Fehler beim Erstellen der Rechnung');
        }
    });

    const stats = dashboardData?.stats || {
        open_projects: 0,
        deadlines_today: 0,
        monthly_revenue: 0,
        revenue_trend: 0,
        active_customers: 0,
        unread_emails: 0
    };

    const languageRevenue = (dashboardData?.language_revenue || []) as { label: string, value: number }[];
    const kpiSummary = [
        { label: 'Offene Projekte', value: stats.open_projects, trend: stats.open_projects_trend?.toString() || '0', color: 'text-slate-900' },
        { label: 'Fällige Tasks', value: stats.deadlines_today, trend: stats.deadlines_trend?.toString() || '0', color: stats.deadlines_today > 0 ? 'text-red-500' : 'text-slate-900' },
        { label: 'Aktive Kunden', value: stats.active_customers, trend: stats.customers_trend?.toString() || '0', color: 'text-slate-900' },
        { label: 'E-Mail Eingang', value: stats.unread_emails, trend: stats.unread_emails > 0 ? `+${stats.unread_emails}` : '0', color: stats.unread_emails > 0 ? 'text-slate-700' : 'text-slate-400' }
    ];

    if (isDashboardLoading || isProjectsLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="flex flex-col gap-6 fade-in pb-10">
            {/* Skeuomorphic Premium Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pb-6 border-b border-slate-200/60">
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>Dashboard</Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>Herzlich willkommen zurück! Hier ist Ihre heutige Übersicht.</Text>
                </div>

                <Space size="middle">
                    <Button
                        variant="primary"
                        onClick={() => setIsNewProjectModalOpen(true)}
                        className="h-11 px-6 font-bold shadow-lg"
                    >
                        <PlusOutlined className="mr-2" />
                        Neues Projekt
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setIsNewCustomerModalOpen(true)}
                        className="h-11 px-6 font-bold"
                    >
                        <UserAddOutlined className="mr-2" />
                        Kunde
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setIsNewPartnerModalOpen(true)}
                        className="h-11 px-6 font-bold"
                    >
                        <TeamOutlined className="mr-2" />
                        Partner
                    </Button>
                </Space>
            </div>

            {/* Dashboard Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Main Content (3/4 width) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-stretch">
                        {/* Primary KPI Cards (2/5 width) */}
                        <div className="xl:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
                            <KPICard
                                label="Offene Projekte"
                                value={stats.open_projects}
                                icon={<FaLayerGroup />}
                                onClick={() => navigate('/projects?filter=in_progress')}
                            />
                            <KPICard
                                label="Deadlines (Heute)"
                                value={stats.deadlines_today}
                                icon={<FaClock />}
                                subValue={stats.deadlines_today > 0 ? "Prüfung erforderlich" : "Alles im Plan"}
                                onClick={() => navigate('/projects')}
                                iconColor={stats.deadlines_today > 0 ? "text-red-500" : "text-slate-400"}
                            />
                            <KPICard
                                label="Umsatz"
                                value={stats.monthly_revenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                icon={<FaEuroSign />}
                                subValue={`${stats.revenue_trend >= 0 ? '+' : ''}${stats.revenue_trend}% vs. Vorperiode`}
                                onClick={() => navigate('/reports')}
                            />
                            <KPICard
                                label="Ungelesene Mails"
                                value={stats.unread_emails}
                                icon={<FaEnvelope />}
                                subValue={stats.unread_emails > 0 ? `${stats.unread_emails} neue Nachrichten` : "Keine neuen Mails"}
                                onClick={() => navigate('/inbox')}
                                iconColor={stats.unread_emails > 0 ? "text-teal-600" : "text-slate-400"}
                            />
                        </div>

                        {/* Business Analysis Table (3/5 width) */}
                        <Card
                            title={<span className="font-bold text-slate-800">Umsatz-Performance</span>}
                            extra={<Tag color="default" className="font-bold px-3 border-slate-200">lfd. Monat</Tag>}
                            className="xl:col-span-3 skeuo-card border-none overflow-hidden flex flex-col h-full shadow-sm"
                            styles={{ body: { padding: 0, flex: 1, overflow: 'auto' } }}
                        >
                            <Table
                                dataSource={languageRevenue}
                                pagination={false}
                                className="skeuo-table"
                                rowKey="label"
                                columns={[
                                    {
                                        title: 'Sprache',
                                        dataIndex: 'label',
                                        key: 'label',
                                        render: (text) => <span className="font-bold text-slate-700 text-xs">{text}</span>
                                    },
                                    {
                                        title: 'Umsatz (€)',
                                        dataIndex: 'value',
                                        key: 'value',
                                        align: 'right',
                                        render: (value: number) => <span className="tabular-nums font-semibold text-xs">{value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                    },
                                    {
                                        title: 'Share',
                                        key: 'share',
                                        align: 'right',
                                        render: (_, record) => {
                                            const share = stats.monthly_revenue > 0 ? (record.value / stats.monthly_revenue) * 100 : 0;
                                            return <span className="tabular-nums text-slate-500 text-[10px] font-medium">{share.toFixed(1)}%</span>;
                                        }
                                    },
                                    {
                                        title: '',
                                        key: 'trend',
                                        width: 100,
                                        render: (_, record) => {
                                            const share = stats.monthly_revenue > 0 ? (record.value / stats.monthly_revenue) * 100 : 0;
                                            return (
                                                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-brand-900 h-full transition-all duration-700"
                                                        style={{ width: `${Math.min(100, share * 2)}%` }}
                                                    ></div>
                                                </div>
                                            );
                                        }
                                    }
                                ]}
                            />
                        </Card>
                    </div>
                </div>

                {/* Sidebar: KPI Übersicht (1/4 width) */}
                <div className="lg:col-span-1">
                    <Card
                        title={<span className="font-bold text-slate-800">KPI Übersicht</span>}
                        className="skeuo-card border-none h-full"
                    >
                        <div className="divide-y divide-slate-100 -mx-6 -my-4">
                            {kpiSummary.map((item, idx) => (
                                <div key={idx} className="px-6 py-5 flex flex-col gap-1 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <Text type="secondary" className="font-bold uppercase text-[11px] tracking-wider">{item.label}</Text>
                                        {item.trend !== '0' && (
                                            <Tag color={item.trend.startsWith('-') ? 'error' : 'success'} className="rounded-full font-bold border-none m-0">
                                                {item.trend.startsWith('-') || item.trend.startsWith('+') ? item.trend : `+${item.trend}`}
                                            </Tag>
                                        )}
                                    </div>
                                    <Title level={3} style={{ margin: 0, marginTop: 4 }} className={`tabular-nums ${item.color}`}>
                                        {item.value}
                                    </Title>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Recent Projects */}
            <div className="mt-4">
                <RecentProjects projects={projectsData || []} />
            </div>

            {/* Modals */}
            <NewProjectModal
                isOpen={isNewProjectModalOpen}
                onClose={() => setIsNewProjectModalOpen(false)}
                onSubmit={(data) => createProjectMutation.mutate(data)}
                isLoading={createProjectMutation.isPending}
            />
            <NewCustomerModal
                isOpen={isNewCustomerModalOpen}
                onClose={() => setIsNewCustomerModalOpen(false)}
                onSubmit={(data: any) => createCustomerMutation.mutate(data)}
            />
            <NewPartnerModal
                isOpen={isNewPartnerModalOpen}
                onClose={() => setIsNewPartnerModalOpen(false)}
                onSubmit={(data: any) => createPartnerMutation.mutate(data)}
            />
            <NewInvoiceModal
                isOpen={isNewInvoiceModalOpen}
                onClose={() => setIsNewInvoiceModalOpen(false)}
                onSubmit={(data: any) => createInvoiceMutation.mutate(data)}
                isLoading={createInvoiceMutation.isPending}
            />
        </div>
    );
};

export default Dashboard;
