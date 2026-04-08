import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import {
    FaLayerGroup, FaClock, FaEuroSign, FaEnvelope, FaPlus, FaUserPlus, FaHandshake,
} from 'react-icons/fa';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, projectService, customerService, partnerService } from '../api/services';
import RecentProjects from '../components/dashboard/RecentProjects';
import DashboardSkeleton from '../components/common/DashboardSkeleton';
import KPICard from '../components/common/KPICard';
import ActiveTasksTable from '../components/dashboard/ActiveTasksTable';
import OpenQuotesTable from '../components/dashboard/OpenQuotesTable';
import ReadyToDeliverTable from '../components/dashboard/ReadyToDeliverTable';
import OverdueInvoicesTable from '../components/dashboard/OverdueInvoicesTable';

const Dashboard = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Modal States
    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
    const [isNewPartnerModalOpen, setIsNewPartnerModalOpen] = useState(false);

    const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: () => dashboardService.getStats()
    });

    const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll()
    });


    const createCustomerMutation = useMutation({
        mutationFn: (data: any) => customerService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsNewCustomerModalOpen(false);
            toast.success(t('dashboard.messages.customer_created'));
        },
        onError: () => {
            toast.error(t('dashboard.messages.customer_create_error'));
        }
    });

    const createPartnerMutation = useMutation({
        mutationFn: (data: any) => partnerService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            setIsNewPartnerModalOpen(false);
            toast.success(t('dashboard.messages.partner_created'));
        },
        onError: () => {
            toast.error(t('dashboard.messages.partner_create_error'));
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

    const allProjects: any[] = Array.isArray(projectsData) ? projectsData : [];




    // Derive list data from projects
    const activeTasks = useMemo(() => allProjects
        .filter((p: any) => ['in_progress', 'review', 'ready_for_pickup'].includes(p.status))
        .map((p: any) => ({
            id: String(p.id),
            project_number: p.project_number,
            display_id: p.display_id || p.project_number,
            name: p.project_name || p.name || p.display_id || p.project_number,
            status: p.status,
            deadline: p.deadline,
        })), [allProjects]);

    const openQuotes = useMemo(() => allProjects
        .filter((p: any) => ['draft', 'pending', 'offer', 'quote_sent'].includes(p.status))
        .map((p: any) => ({
            id: String(p.id),
            project_number: p.project_number,
            display_id: p.display_id || p.project_number,
            name: p.project_name || p.name || p.display_id || p.project_number,
            customer: p.customer ? { name: p.customer.company_name || `${p.customer.first_name || ''} ${p.customer.last_name || ''}`.trim() } : undefined,
            created_at: p.created_at,
            total_price: p.price_total ? parseFloat(p.price_total) : undefined,
        })), [allProjects]);

    const readyToDeliver = useMemo(() => allProjects
        .filter((p: any) => p.status === 'delivered')
        .map((p: any) => ({
            id: String(p.id),
            project_number: p.project_number,
            display_id: p.display_id || p.project_number,
            name: p.project_name || p.name || p.display_id || p.project_number,
            customer: p.customer ? { name: p.customer.company_name || `${p.customer.first_name || ''} ${p.customer.last_name || ''}`.trim() } : undefined,
            deadline: p.deadline,
            updated_at: p.updated_at || p.created_at,
        })), [allProjects]);

    if (isDashboardLoading || isProjectsLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-16 py-6 md:py-8">
            <div className="flex flex-col gap-6 fade-in pb-10">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-2">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight">{t('dashboard.title')}</h1>
                        <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">{t('dashboard.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button onClick={() => navigate('/projects/new')} variant="default">
                            <FaPlus className="mr-2 h-4 w-4" />
                            {t('dashboard.actions.new_project')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/customers', { state: { openNewModal: true } })}
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition font-bold"
                        >
                            <FaUserPlus className="mr-2 h-4 w-4" />
                            {t('dashboard.actions.create_customer')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/partners', { state: { openNewModal: true } })}
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition font-bold"
                        >
                            <FaHandshake className="mr-2 h-4 w-4" />
                            {t('dashboard.actions.create_partner')}
                        </Button>
                    </div>
                </div>

                {/* Zeile 1: KPI-Cards in einer Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KPICard
                        label={t('dashboard.kpi.open_projects')}
                        value={stats.open_projects}
                        icon={<FaLayerGroup />}
                        onClick={() => navigate('/projects?filter=in_progress')}
                    />
                    <KPICard
                        label={t('dashboard.kpi.deadlines_today')}
                        value={stats.deadlines_today}
                        icon={<FaClock />}
                        subValue={stats.deadlines_today > 0 ? t('dashboard.kpi.needs_review') : t('dashboard.kpi.everything_on_track')}
                        onClick={() => navigate('/projects')}
                    />
                    <KPICard
                        label={t('dashboard.kpi.revenue')}
                        value={stats.monthly_revenue.toLocaleString(i18n.language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' })}
                        icon={<FaEuroSign />}
                        subValue={t('dashboard.kpi.revenue_vs_period', { trend: stats.revenue_trend >= 0 ? `+${stats.revenue_trend}` : stats.revenue_trend })}
                        onClick={() => navigate('/reports')}
                    />
                    <KPICard
                        label={t('dashboard.kpi.unread_mails')}
                        value={stats.unread_emails}
                        icon={<FaEnvelope />}
                        subValue={stats.unread_emails > 0 ? t('dashboard.kpi.new_messages', { count: stats.unread_emails }) : t('dashboard.kpi.no_new_mails')}
                        onClick={() => navigate('/inbox')}
                    />
                </div>

                {/* Zeile 2: 4 Listen-Widgets in 2×2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ minHeight: '280px' }}>
                    <ActiveTasksTable tasks={activeTasks} />
                    <OpenQuotesTable quotes={openQuotes} />
                    <ReadyToDeliverTable projects={readyToDeliver} />
                    <OverdueInvoicesTable invoices={[]} />
                </div>

                {/* Zeile 3: Aktuelle Projekte */}
                <div className="mb-4">
                    <RecentProjects projects={allProjects} />
                </div>

                {/* Modals */}
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
            </div>
        </div>
    );
};

export default Dashboard;









