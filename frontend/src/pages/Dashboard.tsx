import { useNavigate } from 'react-router-dom';
import {
    FaLayerGroup, FaClock, FaEuroSign, FaEnvelope,
    FaPlus, FaTasks, FaUserPlus
} from 'react-icons/fa';
import NewProjectModal from '../components/modals/NewProjectModal';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import NewInvoiceModal from '../components/modals/NewInvoiceModal';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, projectService, invoiceService, customerService, partnerService } from '../api/services';
import ActiveTasksTable from '../components/dashboard/ActiveTasksTable';
import OverdueInvoicesTable from '../components/dashboard/OverdueInvoicesTable';
import OpenQuotesTable from '../components/dashboard/OpenQuotesTable';
import ReadyToDeliverTable from '../components/dashboard/ReadyToDeliverTable';
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

    const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: invoiceService.getAll
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

    const activeTasks = projectsData?.data?.filter((p: any) => ['in_progress', 'pending'].includes(p.status)).slice(0, 10) || [];
    const openQuotes = projectsData?.data?.filter((p: any) => p.status === 'quote_sent').slice(0, 10) || [];
    const readyToDeliver = projectsData?.data?.filter((p: any) => p.status === 'review').slice(0, 10) || [];

    const overdueInvoices = invoicesData?.data?.filter((i: any) => {
        if (i.status === 'paid' || i.status === 'cancelled') return false;
        if (!i.due_date) return false;
        return new Date(i.due_date) < new Date();
    }).slice(0, 10) || [];

    if (isDashboardLoading || isProjectsLoading || isInvoicesLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="flex flex-col gap-4 fade-in pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 px-1">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">Willkommen zurück!</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1">
                    <button
                        onClick={() => navigate('/projects', { state: { openNewModal: true } })}
                        className="flex-1 sm:flex-none justify-center bg-brand-700 hover:bg-brand-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-sm font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition active:scale-95 whitespace-nowrap"
                        title="Neues Projekt erstellen"
                    >
                        <FaPlus className="text-[10px]" /> Projekt
                    </button>
                    <button
                        onClick={() => navigate('/customers', { state: { openNewModal: true } })}
                        className="flex-1 sm:flex-none justify-center bg-white hover:bg-slate-50 text-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-sm font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition active:scale-95 border border-slate-200 whitespace-nowrap"
                        title="Neuen Kunden anlegen"
                    >
                        <FaUserPlus className="text-[10px] text-indigo-500" /> Kunde
                    </button>
                    <button
                        onClick={() => navigate('/partners', { state: { openNewModal: true } })}
                        className="flex-1 sm:flex-none justify-center bg-white hover:bg-slate-50 text-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-sm font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition active:scale-95 border border-slate-200 whitespace-nowrap"
                        title="Neuen Partner anlegen"
                    >
                        <FaPlus className="text-[10px] text-emerald-500" /> Partner
                    </button>
                </div>
            </div>

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
                    iconBg="bg-red-50"
                    subValue={stats.deadlines_today > 0 ? "Prüfung erforderlich" : "Alles im Plan"}
                    onClick={() => navigate('/projects')}
                />
                <KPICard
                    label="Umsatz"
                    value={stats.monthly_revenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    icon={<FaEuroSign />}
                    iconColor="text-green-600"
                    iconBg="bg-green-50"
                    subValue={`${stats.revenue_trend >= 0 ? '+' : ''}${stats.revenue_trend}% vs. Vorperiode`}
                    onClick={() => navigate('/reports')}
                />
                <KPICard
                    label="Ungelesene Mails"
                    value={stats.unread_emails}
                    icon={<FaEnvelope />}
                    iconColor={stats.unread_emails > 0 ? "text-brand-600" : "text-slate-400"}
                    iconBg={stats.unread_emails > 0 ? "bg-brand-50" : "bg-slate-50"}
                    subValue={stats.unread_emails > 0 ? `${stats.unread_emails} neue Nachrichten` : "Keine neuen Mails"}
                    onClick={() => navigate('/inbox')}
                />
            </div>

            {/* Detailed Language Revenue Section */}
            {dashboardData?.language_revenue?.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FaTasks className="text-brand-500" /> Umsatz nach Sprache
                    </h3>
                    <div className="flex flex-wrap gap-6">
                        {dashboardData.language_revenue.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{item.label}</span>
                                <span className="text-sm font-bold text-slate-800">
                                    {item.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                </span>
                                <div className="w-full mt-1 bg-slate-100 rounded-full h-1">
                                    <div
                                        className="bg-brand-500 h-1 rounded-full"
                                        style={{ width: `${Math.min(100, (item.value / stats.monthly_revenue) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 pb-4">
                <div className="h-[350px] md:h-auto">
                    <ActiveTasksTable tasks={activeTasks} />
                </div>
                <div className="h-[350px] md:h-auto">
                    <OpenQuotesTable quotes={openQuotes} />
                </div>
                <div className="h-[350px] md:h-auto">
                    <ReadyToDeliverTable projects={readyToDeliver} />
                </div>
                <div className="h-[350px] md:h-auto">
                    <OverdueInvoicesTable invoices={overdueInvoices} />
                </div>
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
