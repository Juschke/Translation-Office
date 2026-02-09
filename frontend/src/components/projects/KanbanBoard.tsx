import React, { useState } from 'react';
import { FaUser, FaCalendar, FaGlobe, FaArrowRight, FaFileInvoice, FaTools, FaBoxOpen, FaFlagCheckered, FaEdit } from 'react-icons/fa';
import clsx from 'clsx';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { getFlagUrl } from '../../utils/flags';
import { Link } from 'react-router-dom';

interface Project {
    id: number;
    project_number: string;
    project_name: string;
    status: string;
    customer?: {
        id: number;
        company_name?: string;
        first_name?: string;
        last_name?: string;
    };
    partner?: {
        id: number;
        company_name?: string;
        first_name?: string;
        last_name?: string;
    };
    source_language?: { iso_code: string; name: string };
    target_language?: { iso_code: string; name: string };
    deadline?: string;
    price_total?: string | number;
    priority?: string;
}

interface KanbanBoardProps {
    projects: Project[];
    onProjectClick: (project: Project) => void;
    onStatusChange?: (projectId: number, newStatus: string) => void;
    onEdit?: (project: Project) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projects, onProjectClick, onStatusChange, onEdit }) => {
    const [draggedProjectId, setDraggedProjectId] = useState<number | null>(null);
    const [dropTargetStatus, setDropTargetStatus] = useState<string | null>(null);

    const columns = [
        { id: 'offer', title: 'Angebot', icon: <FaFileInvoice className="text-slate-500" />, bg: 'bg-slate-50/50' },
        { id: 'in_progress', title: 'In Bearbeitung', icon: <FaTools className="text-slate-500" />, bg: 'bg-slate-50/50' },
        { id: 'ready_for_pickup', title: 'Dokument(e) Abholbereit', icon: <FaBoxOpen className="text-slate-500" />, bg: 'bg-slate-50/50' },
        { id: 'completed', title: 'Abgeschlossen', icon: <FaFlagCheckered className="text-slate-500" />, bg: 'bg-slate-50/50' },
    ];

    const getColumnProjects = (columnId: string) => {
        return projects.filter(p => {
            const s = p.status?.toLowerCase();
            if (columnId === 'offer') return s === 'offer' || s === 'pending' || s === 'draft';
            if (columnId === 'in_progress') return s === 'in_progress' || s === 'review';
            if (columnId === 'ready_for_pickup') return s === 'ready_for_pickup';
            if (columnId === 'completed') return s === 'completed' || s === 'delivered';
            return false;
        });
    };

    const handleDragStart = (e: React.DragEvent, projectId: number) => {
        setDraggedProjectId(projectId);
        e.dataTransfer.setData('projectId', projectId.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        setDropTargetStatus(status);
    };

    const handleDrop = (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const projectId = parseInt(e.dataTransfer.getData('projectId'));
        if (onStatusChange && projectId) {
            onStatusChange(projectId, newStatus);
        }
        setDraggedProjectId(null);
        setDropTargetStatus(null);
    };

    const renderCard = (project: Project) => {
        const sourceCode = project.source_language?.iso_code || 'de';
        const targetCode = project.target_language?.iso_code || 'en';
        const customerName = project.customer?.company_name || `${project.customer?.first_name} ${project.customer?.last_name}` || 'Kein Kunde';
        const partnerName = project.partner ? (project.partner.company_name || `${project.partner.first_name} ${project.partner.last_name}`) : null;

        return (
            <div
                key={project.id}
                draggable
                onDragStart={(e) => handleDragStart(e, project.id)}
                onDragEnd={() => setDraggedProjectId(null)}
                onClick={() => onProjectClick(project)}
                className={clsx(
                    "bg-white p-2 border shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing group select-none rounded-none",
                    draggedProjectId === project.id
                        ? "opacity-20 scale-95 border-brand-200 shadow-none"
                        : "border-slate-200 hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5"
                )}
            >
                {/* Header: Project Number & Price & Edit Icon */}
                <div className="flex justify-between items-start mb-1.5">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-1 py-0.5 rounded-none w-fit">
                            {project.project_number || `P-${project.id}`}
                        </span>
                        <span className="text-[9px] font-bold text-slate-700">
                            {parseFloat(project.price_total as any || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(project);
                            }}
                            className="p-1 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-none transition-colors"
                            title="Bearbeiten"
                        >
                            <FaEdit className="text-[10px]" />
                        </button>
                    )}
                </div>

                {/* Project Name */}
                <h4 className="font-bold text-slate-800 text-[11px] mb-2 group-hover:text-brand-700 transition line-clamp-2 leading-tight">
                    {project.project_name}
                </h4>

                {/* Languages */}
                <div className="flex items-center gap-1.5 mb-2 bg-slate-50 p-1 border border-slate-100 rounded-none">
                    <div className="flex items-center gap-1">
                        <img src={getFlagUrl(sourceCode)} className="w-3 h-2 object-cover border border-slate-200" alt="" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase">{sourceCode.split('-')[0]}</span>
                    </div>
                    <FaArrowRight className="text-[7px] text-slate-300" />
                    <div className="flex items-center gap-1">
                        <img src={getFlagUrl(targetCode)} className="w-3 h-2 object-cover border border-slate-200" alt="" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase">{targetCode.split('-')[0]}</span>
                    </div>
                </div>

                {/* Customer & Partner Links */}
                <div className="space-y-1 mb-2">
                    <Link
                        to={`/customers/${project.customer?.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-[9px] text-slate-600 font-medium hover:text-brand-600 transition truncate group/link"
                    >
                        <div className="w-3.5 h-3.5 bg-brand-50 flex items-center justify-center text-[7px] text-brand-500 group-hover/link:bg-brand-600 group-hover/link:text-white transition-colors">
                            <FaUser />
                        </div>
                        <span className="truncate flex-1">{customerName}</span>
                    </Link>

                    {partnerName && (
                        <Link
                            to={`/partners/${project.partner?.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-[9px] text-slate-600 font-medium hover:text-purple-600 transition truncate group/link"
                        >
                            <div className="w-3.5 h-3.5 bg-purple-50 flex items-center justify-center text-[7px] text-purple-500 group-hover/link:bg-purple-600 group-hover/link:text-white transition-colors">
                                <FaGlobe />
                            </div>
                            <span className="truncate flex-1">{partnerName}</span>
                        </Link>
                    )}
                </div>

                {/* Footer: Date */}
                <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                        <FaCalendar className="text-[7px] opacity-60" />
                        <span>{project.deadline ? format(new Date(project.deadline), 'dd.MM.yy', { locale: de }) : '-'}</span>
                    </div>
                    {project.priority === 'high' && (
                        <div className="w-1 h-1 bg-red-500 animate-pulse"></div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex gap-4 h-full overflow-x-auto pb-6 custom-scrollbar">
            {columns.map(col => (
                <div
                    key={col.id}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDragLeave={() => setDropTargetStatus(null)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={clsx(
                        "flex-1 min-w-[280px] flex flex-col border transition-all duration-300 overflow-hidden h-[calc(100vh-500px)] min-h-[350px] rounded-none",
                        dropTargetStatus === col.id
                            ? "bg-brand-50/50 border-brand-300 ring-2 ring-brand-100 scale-[1.005] shadow-lg"
                            : "bg-white border-slate-200 shadow-sm"
                    )}
                >
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 text-base">
                                {col.icon}
                            </div>
                            <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest">{col.title}</h3>
                        </div>
                        <div className="w-6 h-6 bg-slate-800 text-white flex items-center justify-center text-[9px] font-black">
                            {getColumnProjects(col.id).length}
                        </div>
                    </div>

                    <div className="p-2 flex flex-col gap-2 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/20">
                        {getColumnProjects(col.id).length > 0 ? (
                            getColumnProjects(col.id).map(renderCard)
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 opacity-30 py-10 bg-white">
                                <div className="text-[9px] font-black uppercase text-slate-400">Keine Aufträge</div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KanbanBoard;
