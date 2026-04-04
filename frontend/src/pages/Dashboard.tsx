import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import {
    FaLayerGroup, FaClock, FaEuroSign, FaEnvelope, FaPlus, FaUserPlus, FaHandshake
} from 'react-icons/fa';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import { useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, projectService, customerService, partnerService } from '../api/services';
import RecentProjects from '../components/dashboard/RecentProjects';
import DashboardSkeleton from '../components/common/DashboardSkeleton';
import KPICard from '../components/common/KPICard';
import { getLanguageName } from '../utils/flags';

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

    const sourceLanguageRevenue = dashboardData?.source_language_revenue || [];
    const targetLanguageRevenue = dashboardData?.target_language_revenue || [];
    const kpiSummary = [
        { label: t('dashboard.kpi.open_projects'), value: stats.open_projects, trend: stats.open_projects_trend?.toString() || '0', color: 'text-slate-900' },
        { label: t('dashboard.kpi.failing_tasks'), value: stats.deadlines_today, trend: stats.deadlines_trend?.toString() || '0', color: stats.deadlines_today > 0 ? 'text-red-500' : 'text-slate-900' },
        { label: t('dashboard.kpi.active_customers'), value: stats.active_customers, trend: stats.customers_trend?.toString() || '0', color: 'text-slate-900' },
        { label: t('dashboard.kpi.email_inbox'), value: stats.unread_emails, trend: stats.unread_emails > 0 ? `+${stats.unread_emails}` : '0', color: stats.unread_emails > 0 ? 'text-slate-700' : 'text-slate-400' }
    ];

    if (isDashboardLoading || isProjectsLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-16 py-6 md:py-8">
            <div className="flex flex-col gap-6 fade-in pb-10">
                {/* Minimalist Professional Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight">{t('dashboard.title')}</h1>
                        <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">{t('dashboard.subtitle')}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            onClick={() => navigate('/projects/new')}
                            variant="default"
                        >
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

                {/* Dashboard Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Main Content (3/4 width) */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Primary KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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

                        {/* Business Analysis Tables */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Source Language Table */}
                            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="text-xs font-medium text-slate-900">
                                        {t('dashboard.performance.source_language')}
                                    </h3>
                                    <span className="text-xs text-slate-500 tabular-nums">
                                        {dashboardData?.period?.label || t('dashboard.performance.current_month')}
                                    </span>
                                </div>
                                <div className={clsx("p-0 min-h-0", sourceLanguageRevenue.length > 0 ? "overflow-x-auto" : "overflow-hidden")}>
                                    <table className="w-full text-left min-w-[300px]">
                                        <thead className="text-xs font-medium text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2 border-b border-slate-200">{t('dashboard.performance.language')}</th>
                                                <th className="px-3 py-2 border-b border-slate-200 text-right">{t('dashboard.kpi.revenue')} (€)</th>
                                                <th className="px-3 py-2 border-b border-slate-200 text-right">{t('dashboard.performance.share')} (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {sourceLanguageRevenue.map((item: any, i: number) => {
                                                const share = stats.monthly_revenue > 0 ? (item.value / stats.monthly_revenue) * 100 : 0;
                                                return (
                                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-3 py-2 text-xs font-medium text-slate-900">{getLanguageName(item.label)}</td>
                                                        <td className="px-3 py-2 text-xs text-slate-900 text-right tabular-nums">
                                                            {item.value.toLocaleString(i18n.language === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                                        </td>
                                                        <td className="px-3 py-2 text-xs text-slate-500 text-right tabular-nums">
                                                            {share.toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {sourceLanguageRevenue.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-3 py-6 text-center text-slate-500 text-xs">{t('empty.noData')}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Target Language Table */}
                            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="text-xs font-medium text-slate-900">
                                        {t('dashboard.performance.target_language')}
                                    </h3>
                                    <span className="text-xs text-slate-500 tabular-nums">
                                        {dashboardData?.period?.label || t('dashboard.performance.current_month')}
                                    </span>
                                </div>
                                <div className={clsx("p-0 min-h-0", targetLanguageRevenue.length > 0 ? "overflow-x-auto" : "overflow-hidden")}>
                                    <table className="w-full text-left min-w-[300px]">
                                        <thead className="text-xs font-medium text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2 border-b border-slate-200">{t('dashboard.performance.language')}</th>
                                                <th className="px-3 py-2 border-b border-slate-200 text-right">{t('dashboard.kpi.revenue')} (€)</th>
                                                <th className="px-3 py-2 border-b border-slate-200 text-right">{t('dashboard.performance.share')} (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {targetLanguageRevenue.map((item: any, i: number) => {
                                                const share = stats.monthly_revenue > 0 ? (item.value / stats.monthly_revenue) * 100 : 0;
                                                return (
                                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-3 py-2 text-xs font-medium text-slate-900">{getLanguageName(item.label)}</td>
                                                        <td className="px-3 py-2 text-xs text-slate-900 text-right tabular-nums">
                                                            {item.value.toLocaleString(i18n.language === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                                        </td>
                                                        <td className="px-3 py-2 text-xs text-slate-500 text-right tabular-nums">
                                                            {share.toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {targetLanguageRevenue.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-3 py-6 text-center text-slate-500 text-xs">{t('empty.noData')}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Recent Projects (1/4 width) */}
                    <div className="bg-white border border-slate-200 rounded-sm flex flex-col h-fit">
                        <div className="px-5 py-4 border-b border-slate-200">
                            <h3 className="text-sm font-medium text-slate-900">{t('dashboard.recent_projects')}</h3>
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
