import { useNavigate } from 'react-router-dom';
import { FaLayerGroup, FaClock, FaEuroSign, FaEnvelope, FaPlus } from 'react-icons/fa';
import NewProjectModal from '../components/modals/NewProjectModal';
import RecentProjects from '../components/dashboard/RecentProjects';
import { useState } from 'react';

import KPICard from '../components/common/KPICard';

const Dashboard = () => {
    const navigate = useNavigate();
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

    return (
        <div className="flex flex-col h-full gap-6 fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard Übersicht</h1>
                <button
                    onClick={() => setIsNewProjectModalOpen(true)}
                    className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95"
                >
                    <FaPlus className="text-xs" /> Neues Projekt
                </button>
            </div>

            {/* Stats Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    label="Offene Projekte"
                    value="12"
                    icon={<FaLayerGroup />}
                    progress={65}
                    onClick={() => navigate('/projects')}
                />
                <KPICard
                    label="Deadlines (Heute)"
                    value="3"
                    icon={<FaClock />}
                    iconColor="text-red-600"
                    iconBg="bg-red-50"
                    subValue="2 überfällig"
                    onClick={() => navigate('/projects?filter=deadline')}
                />
                <KPICard
                    label="Umsatz (Monat)"
                    value="14.250 €"
                    icon={<FaEuroSign />}
                    iconColor="text-green-600"
                    iconBg="bg-green-50"
                    trend={{ value: '+12%', label: 'vs. Vormonat', isPositive: true }}
                    onClick={() => navigate('/reports')}
                />
                <KPICard
                    label="Neue E-Mails"
                    value="8"
                    icon={<FaEnvelope />}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-50"
                    subValue="Letzter Sync: vor 2 Min"
                    onClick={() => navigate('/inbox')}
                />
            </div>

            {/* Dashboard Project Widget */}
            <RecentProjects />

            <NewProjectModal
                isOpen={isNewProjectModalOpen}
                onClose={() => setIsNewProjectModalOpen(false)}
                onSubmit={(data) => console.log(data)}
            />
        </div>
    );
};

export default Dashboard;
