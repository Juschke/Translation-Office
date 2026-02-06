import { useNavigate } from 'react-router-dom';
import { FaLayerGroup, FaClock, FaEuroSign, FaEnvelope, FaPlus } from 'react-icons/fa';
import NewProjectModal from '../components/modals/NewProjectModal';
import RecentProjects from '../components/dashboard/RecentProjects';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, projectService } from '../api/services';
import KPICard from '../components/common/KPICard';
import DashboardSkeleton from '../components/common/DashboardSkeleton';

const Dashboard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: dashboardService.getStats
    });

    const createMutation = useMutation({
        mutationFn: projectService.create,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
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

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="flex flex-col h-full gap-6 fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard Übersicht</h1>
                <button
                    onClick={() => setIsNewProjectModalOpen(true)}
                    className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95"
                >
                    <FaPlus className="text-xs" /> Neues Projekt
                </button>
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
                    label="Umsatz (Gesamt)"
                    value={stats.monthly_revenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    icon={<FaEuroSign />}
                    iconColor="text-green-600"
                    iconBg="bg-green-50"
                    subValue={`${stats.revenue_trend >= 0 ? '+' : ''}${stats.revenue_trend}% vs. Vormonat`}
                    onClick={() => navigate('/reports')}
                />
                <KPICard
                    label="Aktive Kunden"
                    value={stats.active_customers}
                    icon={<FaEnvelope />}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-50"
                    onClick={() => navigate('/customers')}
                />
            </div>

            <RecentProjects projects={dashboardData?.recent_projects || []} />

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
