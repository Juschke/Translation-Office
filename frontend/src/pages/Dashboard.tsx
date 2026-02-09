import { useNavigate } from 'react-router-dom';
import { FaLayerGroup, FaClock, FaEuroSign, FaEnvelope, FaPlus, FaTasks, FaCalendarAlt } from 'react-icons/fa';
import NewProjectModal from '../components/modals/NewProjectModal';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, projectService, invoiceService } from '../api/services';
import ActiveTasksTable from '../components/dashboard/ActiveTasksTable';
import OverdueInvoicesTable from '../components/dashboard/OverdueInvoicesTable';
import OpenQuotesTable from '../components/dashboard/OpenQuotesTable';
import ReadyToDeliverTable from '../components/dashboard/ReadyToDeliverTable';
import DashboardSkeleton from '../components/common/DashboardSkeleton';
import KPICard from '../components/common/KPICard';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { de } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth } from 'date-fns';

registerLocale('de', de);

const Dashboard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
        startOfMonth(new Date()),
        endOfMonth(new Date())
    ]);
    const [startDate, endDate] = dateRange;

    const queryParams = {
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
    };

    const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
        queryKey: ['dashboard', 'stats', queryParams],
        queryFn: () => dashboardService.getStats(queryParams)
    });

    const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll()
    });

    const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: invoiceService.getAll
    });

    const createMutation = useMutation({
        mutationFn: projectService.create,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            navigate(`/projects/${data.id}`);
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
        <div className="flex flex-col h-full gap-4 fade-in overflow-hidden p-4">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard Übersicht</h1>
                    <p className="text-slate-500 text-sm">Willkommen zurück!</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative z-20">
                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                        <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => setDateRange(update)}
                            isClearable={false}
                            locale="de"
                            dateFormat="dd.MM.yyyy"
                            className="pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 w-[210px] cursor-pointer bg-white"
                        />
                    </div>
                    <button
                        onClick={() => setIsNewProjectModalOpen(true)}
                        className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95"
                    >
                        <FaPlus className="text-xs" /> Neues Projekt
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 pb-4 min-h-[400px]">
                <ActiveTasksTable tasks={activeTasks} />
                <OpenQuotesTable quotes={openQuotes} />
                <ReadyToDeliverTable projects={readyToDeliver} />
                <OverdueInvoicesTable invoices={overdueInvoices} />
            </div>

            <NewProjectModal
                isOpen={isNewProjectModalOpen}
                onClose={() => setIsNewProjectModalOpen(false)}
                onSubmit={(data) => {
                    createMutation.mutate(data);
                }}
                isLoading={createMutation.isPending}
            />
        </div>
    );
};

export default Dashboard;
