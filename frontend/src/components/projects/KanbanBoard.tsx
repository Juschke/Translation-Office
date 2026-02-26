import React, { useState } from 'react';
import { FaUser, FaCalendar, FaGlobe, FaArrowRight, FaFileInvoice, FaTools, FaBoxOpen, FaFlagCheckered, FaEdit, FaChevronDown, FaChevronUp, FaArrowDown } from 'react-icons/fa';
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
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['completed']));

    const sections = [
        { id: 'offer', title: 'Neu / Angebot', icon: <FaFileInvoice />, color: 'emerald' },
        { id: 'in_progress', title: 'In Bearbeitung', icon: <FaTools />, color: 'blue' },
        { id: 'ready_for_pickup', title: 'Abholbereit', icon: <FaBoxOpen />, color: 'orange' },
        { id: 'delivered', title: 'Geliefert', icon: <FaFlagCheckered />, color: 'indigo' },
        { id: 'invoiced', title: 'Abgerechnet', icon: <FaFileInvoice />, color: 'purple' },
        { id: 'completed', title: 'Archiv / Abgeschlossen', icon: <FaFlagCheckered />, color: 'slate' },
    ];

    const toggleSection = (id: string) => {
        const next = new Set(collapsedSections);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setCollapsedSections(next);
    };

    const getSectionProjects = (id: string) => {
        return projects.filter(p => {
            const s = p.status?.toLowerCase();
            if (id === 'offer') return s === 'offer' || s === 'pending' || s === 'draft';
            if (id === 'in_progress') return s === 'in_progress' || s === 'review';
            if (id === 'ready_for_pickup') return s === 'ready_for_pickup';
            if (id === 'invoiced') return s === 'invoiced';
            if (id === 'delivered') return s === 'delivered';
            if (id === 'completed') return s === 'completed';
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

    const moveDown = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        const currentIndex = sections.findIndex(s => {
            const projStatus = project.status.toLowerCase();
            if (s.id === 'offer') return projStatus === 'offer' || projStatus === 'pending' || projStatus === 'draft';
            if (s.id === 'in_progress') return projStatus === 'in_progress' || projStatus === 'review';
            return s.id === projStatus;
        });
        if (currentIndex < sections.length - 1 && onStatusChange) {
            onStatusChange(project.id, sections[currentIndex + 1].id);
        }
    };

    const renderCard = (project: Project) => {
        const sourceCode = project.source_language?.iso_code || 'de';
        const targetCode = project.target_language?.iso_code || 'en';

        return (
            <div
                key={project.id}
                draggable
                onDragStart={(e) => handleDragStart(e, project.id)}
                onDragEnd={() => setDraggedProjectId(null)}
                onClick={() => onProjectClick(project)}
                className={clsx(
                    "flex bg-white border-l-4 border-slate-200 transition-all duration-200 cursor-grab active:cursor-grabbing select-none",
                    "hover:shadow-md hover:border-l-brand-primary group h-20 overflow-hidden mb-px",
                    draggedProjectId === project.id ? "opacity-30" : ""
                )}
            >
                <div className="flex-1 flex items-center px-4 gap-4">
                    <div className="flex flex-col gap-0.5 min-w-[80px]">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            {project.project_number || `P-${project.id}`}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                            {parseFloat(project.price_total as any || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 text-sm truncate">
                            {project.project_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 shrink-0">
                                <img src={getFlagUrl(sourceCode)} className="w-3 h-2 object-cover rounded-[1px]" alt="" />
                                <FaArrowRight className="text-[7px] text-slate-300" />
                                <img src={getFlagUrl(targetCode)} className="w-3 h-2 object-cover rounded-[1px]" alt="" />
                            </div>
                            <span className="text-[10px] text-slate-400 truncate flex-1">
                                {project.customer?.company_name || `${project.customer?.first_name} ${project.customer?.last_name}`}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 pr-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">
                            <FaCalendar size={10} className="opacity-50" />
                            <span>{project.deadline ? format(new Date(project.deadline), 'dd.MM', { locale: de }) : '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                                <button onClick={(e) => { e.stopPropagation(); onEdit(project); }} className="p-1.5 text-slate-300 hover:text-brand-primary">
                                    <FaEdit size={12} />
                                </button>
                            )}
                            <button onClick={(e) => moveDown(e, project)} className="p-1.5 text-slate-300 hover:text-brand-accent bg-slate-50 rounded" title="In nächste Phase">
                                <FaArrowDown size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#f1f4f4] overflow-hidden custom-scrollbar">
            <div className="flex flex-col min-h-full overflow-y-auto no-scrollbar scroll-smooth">
                {sections.map((section, idx) => {
                    const isCollapsed = collapsedSections.has(section.id);
                    const sectionProjects = getSectionProjects(section.id);
                    const isTarget = dropTargetStatus === section.id;

                    return (
                        <div
                            key={section.id}
                            onDragOver={(e) => handleDragOver(e, section.id)}
                            onDragLeave={() => setDropTargetStatus(null)}
                            onDrop={(e) => handleDrop(e, section.id)}
                            className={clsx(
                                "flex flex-col border-b border-[#D1D9D8] transition-all bg-white relative last:border-b-0",
                                isCollapsed ? "h-14 shrink-0" : "flex-none",
                                isTarget && "bg-brand-primary/[0.03]"
                            )}
                        >
                            {/* Process Step Header - Vertical Process Flow */}
                            <div
                                onClick={() => toggleSection(section.id)}
                                className={clsx(
                                    "px-4 py-3 flex items-center justify-between cursor-pointer select-none sticky top-0 z-20 transition-colors",
                                    isCollapsed ? "bg-slate-50/80" : "bg-gradient-to-r from-white to-slate-50/30"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-8 h-8 flex items-center justify-center rounded-[3px] text-xs shadow-inner border border-[#D1D9D8]",
                                        isCollapsed ? "bg-white text-slate-400" : "bg-brand-primary text-white"
                                    )}>
                                        {section.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-800 text-[12px] uppercase tracking-wider">{section.title}</h3>
                                            <span className={clsx(
                                                "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                                                isCollapsed ? "bg-slate-200 text-slate-500" : "bg-brand-primary/10 text-brand-primary"
                                            )}>
                                                {sectionProjects.length}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-none">
                                            Schritt {idx + 1} des Prozesses
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Arrow showing the flow to next step */}
                                    {idx < sections.length - 1 && !isCollapsed && (
                                        <div className="hidden md:flex flex-col items-center opacity-20">
                                            <FaArrowDown size={10} />
                                        </div>
                                    )}
                                    <div className="p-1.5 text-slate-300">
                                        {isCollapsed ? <FaChevronDown size={14} /> : <FaChevronUp size={14} />}
                                    </div>
                                </div>
                            </div>

                            {/* Cards Section - Horizontal row inside vertical step if open */}
                            {!isCollapsed && (
                                <div className="bg-[#fcfcfc] border-t border-[#f1f5f9] min-h-[80px]">
                                    {sectionProjects.length > 0 ? (
                                        <div className="flex flex-col divide-y divide-[#f1f5f9]">
                                            {sectionProjects.map(renderCard)}
                                        </div>
                                    ) : (
                                        <div className="h-20 flex items-center justify-center border-dashed border-2 border-slate-100 m-2 rounded-[2px] opacity-40">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Bereit für Aufträge</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default KanbanBoard;
