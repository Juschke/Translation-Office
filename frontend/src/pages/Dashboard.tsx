import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import {
    FaLayerGroup, FaClock, FaEuroSign, FaEnvelope
} from 'react-icons/fa';
import NewProjectModal from '../components/modals/NewProjectModal';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import NewInvoiceModal from '../components/modals/NewInvoiceModal';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, projectService, invoiceService, customerService, partnerService } from '../api/services';
import RecentProjects from '../components/dashboard/RecentProjects';
import DashboardSkeleton from '../components/common/DashboardSkeleton';
import KPICard from '../components/common/KPICard';

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



    const languageRevenue = dashboardData?.language_revenue || [];
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
            {/* Minimalist Professional Header */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">Übersicht & Operative Steuerung</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        onClick={() => navigate('/projects', { state: { openNewModal: true } })}
                        className="bg-brand-primary text-white hover:bg-brand-primary/90 transition font-bold"
                    >
                        Neues Projekt
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/customers', { state: { openNewModal: true } })}
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition font-bold"
                    >
                        Kunde anlegen
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/partners', { state: { openNewModal: true } })}
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition font-bold"
                    >
                        Partner anlegen
                    </Button>
                </div>
            </div>

            {/* Dashboard Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Main Content (3/4 width) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Primary KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                            iconColor="text-red-600"
                            subValue={stats.deadlines_today > 0 ? "Prüfung erforderlich" : "Alles im Plan"}
                            onClick={() => navigate('/projects')}
                        />
                        <KPICard
                            label="Umsatz"
                            value={stats.monthly_revenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            icon={<FaEuroSign />}
                            iconColor="text-green-600"
                            subValue={`${stats.revenue_trend >= 0 ? '+' : ''}${stats.revenue_trend}% vs. Vorperiode`}
                            onClick={() => navigate('/reports')}
                        />
                        <KPICard
                            label="Ungelesene Mails"
                            value={stats.unread_emails}
                            icon={<FaEnvelope />}
                            iconColor={stats.unread_emails > 0 ? "text-slate-700" : "text-slate-400"}
                            subValue={stats.unread_emails > 0 ? `${stats.unread_emails} neue Nachrichten` : "Keine neuen Mails"}
                            onClick={() => navigate('/inbox')}
                        />
                    </div>

                    {/* Business Analysis Table */}
                    <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-sm font-medium text-slate-900">
                                Umsatz-Performance nach Sprache
                            </h3>
                            <span className="text-xs text-slate-500 tabular-nums">Zeitraum: lfd. Monat</span>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left min-w-[500px]">
                                <thead className="text-sm font-medium text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3 border-b border-slate-200">Sprache</th>
                                        <th className="px-5 py-3 border-b border-slate-200 text-right">Umsatz (€)</th>
                                        <th className="px-5 py-3 border-b border-slate-200 text-right">Anteil (%)</th>
                                        <th className="px-5 py-3 border-b border-slate-200 w-48">Tendenz</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {languageRevenue.map((item: any, i: number) => {
                                        const share = stats.monthly_revenue > 0 ? (item.value / stats.monthly_revenue) * 100 : 0;
                                        return (
                                            <tr key={i} className="hover:bg-transparent transition-colors">
                                                <td className="px-5 py-3 text-sm font-medium text-slate-900">{item.label}</td>
                                                <td className="px-5 py-3 text-sm text-slate-900 text-right tabular-nums">
                                                    {item.value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                                </td>
                                                <td className="px-5 py-3 text-sm text-slate-500 text-right tabular-nums">
                                                    {share.toFixed(1)}%
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-brand-primary h-full transition-all duration-700"
                                                            style={{ width: `${Math.min(100, share)}%` }}
                                                        ></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {languageRevenue.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-8 text-center text-slate-500 text-sm">Keine Daten für diesen Zeitraum</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar: KPI Übersicht (1/4 width) */}
                <div className="bg-white border border-slate-200 rounded-sm flex flex-col h-fit">
                    <div className="px-5 py-4 border-b border-slate-200">
                        <h3 className="text-sm font-medium text-slate-900">KPI Übersicht</h3>
                    </div>
                    <div className="flex-1 divide-y divide-slate-100">
                        {kpiSummary.map((item, idx) => (
                            <div key={idx} className="px-5 py-4 flex flex-col gap-1">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm text-slate-500">{item.label}</span>
                                    {item.trend !== '0' && (
                                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-sm ${item.trend.startsWith('-') ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {item.trend.startsWith('-') || item.trend.startsWith('+') ? item.trend : `+${item.trend}`}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-2xl font-semibold tabular-nums ${item.color}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>



            {/* Bottom Section: Recent Projects (Symmetrical full width or 2-col) */}
            <div className="mb-4">
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
