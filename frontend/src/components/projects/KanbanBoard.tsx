import React from 'react';
import { FaClock, FaCheckCircle, FaExclamationCircle, FaUser, FaCalendar } from 'react-icons/fa';
import clsx from 'clsx';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Project {
    id: number;
    project_number: string;
    project_name: string;
    status: string;
    customer?: {
        company_name?: string;
        first_name?: string;
        last_name?: string;
    };
    delivery_date: string;
}

interface KanbanBoardProps {
    projects: Project[];
    onProjectClick: (project: Project) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projects, onProjectClick }) => {
    const columns = [
        { id: 'new', title: 'Neu', icon: <FaExclamationCircle className="text-blue-500" />, bg: 'bg-blue-50/50' },
        { id: 'in_progress', title: 'In Bearbeitung', icon: <FaClock className="text-amber-500" />, bg: 'bg-amber-50/50' },
        { id: 'completed', title: 'Abgeschlossen', icon: <FaCheckCircle className="text-emerald-500" />, bg: 'bg-emerald-50/50' },
    ];

    const getColumnProjects = (status: string) => {
        return projects.filter(p => {
            const s = p.status?.toLowerCase();
            if (status === 'new') return s === 'pending' || s === 'draft';
            if (status === 'in_progress') return s === 'in_progress' || s === 'review';
            if (status === 'completed') return s === 'completed';
            return false;
        });
    };

    return (
        <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar">
            {columns.map(col => (
                <div key={col.id} className={clsx("flex-1 min-w-[320px] rounded-xl flex flex-col border border-slate-200 shadow-sm", col.bg)}>
                    <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-xl">
                        <div className="flex items-center gap-3">
                            {col.icon}
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{col.title}</h3>
                        </div>
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest">
                            {getColumnProjects(col.id).length}
                        </span>
                    </div>

                    <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1 custom-scrollbar">
                        {getColumnProjects(col.id).map(project => (
                            <div
                                key={project.id}
                                onClick={() => onProjectClick(project)}
                                className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-2 py-0.5 rounded">
                                        {project.project_number}
                                    </span>
                                    <div className="text-slate-300 group-hover:text-brand-500 transition">
                                        <FaCalendar className="text-xs" />
                                    </div>
                                </div>

                                <h4 className="font-bold text-slate-800 text-sm mb-2 group-hover:text-brand-700 transition line-clamp-2">
                                    {project.project_name}
                                </h4>

                                <div className="space-y-2 mt-4 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                        <FaUser className="text-slate-300" />
                                        <span className="truncate">
                                            {project.customer?.company_name || `${project.customer?.first_name} ${project.customer?.last_name}` || 'Kein Kunde'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                        <FaClock className="text-slate-300" />
                                        <span>
                                            {project.delivery_date ? format(new Date(project.delivery_date), 'dd. MMM yyyy', { locale: de }) : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KanbanBoard;
