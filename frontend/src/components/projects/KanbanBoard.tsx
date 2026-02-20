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
 { id: 'offer', title: 'Neu', icon: <FaFileInvoice className="text-slate-500" />, bg: 'bg-transparent' },
 { id: 'in_progress', title: 'Bearbeitung', icon: <FaTools className="text-slate-500" />, bg: 'bg-transparent' },
 { id: 'delivered', title: 'Geliefert', icon: <FaFlagCheckered className="text-slate-500" />, bg: 'bg-transparent' },
 { id: 'invoiced', title: 'Rechnung', icon: <FaFileInvoice className="text-slate-500" />, bg: 'bg-transparent' },
 { id: 'ready_for_pickup', title: 'Abholbereit', icon: <FaBoxOpen className="text-slate-500" />, bg: 'bg-transparent' },
 { id: 'completed', title: 'Abgeschlossen', icon: <FaFlagCheckered className="text-slate-500" />, bg: 'bg-transparent' },
 ];

 const getColumnProjects = (columnId: string) => {
 return projects.filter(p => {
 const s = p.status?.toLowerCase();
 if (columnId === 'offer') return s === 'offer' || s === 'pending' || s === 'draft';
 if (columnId === 'in_progress') return s === 'in_progress' || s === 'review';
 if (columnId === 'ready_for_pickup') return s === 'ready_for_pickup';
 if (columnId === 'invoiced') return s === 'invoiced';
 if (columnId === 'delivered') return s === 'delivered';
 if (columnId === 'completed') return s === 'completed';
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
 "bg-white p-2.5 border shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing group select-none rounded-sm",
 draggedProjectId === project.id
 ? "opacity-20 scale-95 border-emerald-200 shadow-none"
 : "border-slate-200 hover:border-emerald-300 hover:shadow-sm hover:-translate-y-0.5"
 )}
 >
 {/* Header: Project Number & Price & Edit Icon */}
 <div className="flex justify-between items-start mb-1.5">
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm w-fit border border-emerald-100/50">
 {project.project_number || `P-${project.id}`}
 </span>
 <span className="text-xs font-medium text-slate-700 mt-0.5">
 {parseFloat(project.price_total as any || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
 </span>
 </div>
 {onEdit && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 onEdit(project);
 }}
 className="p-1 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-sm transition-colors"
 title="Bearbeiten"
 >
 <FaEdit className="text-xs" />
 </button>
 )}
 </div>

 {/* Project Name */}
 <h4 className="font-medium text-slate-800 text-sm mb-2 group-hover:text-emerald-700 transition line-clamp-2 leading-tight">
 {project.project_name}
 </h4>

 {/* Languages */}
 <div className="flex items-center gap-1.5 mb-2 bg-slate-50 p-1 border border-slate-100 rounded-sm">
 <div className="flex items-center gap-1">
 <img src={getFlagUrl(sourceCode)} className="w-3 h-2 object-cover border border-slate-200" alt="" />
 <span className="text-xs font-medium text-slate-500">{sourceCode.split('-')[0]}</span>
 </div>
 <FaArrowRight className="text-[7px] text-slate-300" />
 <div className="flex items-center gap-1">
 <img src={getFlagUrl(targetCode)} className="w-3 h-2 object-cover border border-slate-200" alt="" />
 <span className="text-xs font-medium text-slate-500">{targetCode.split('-')[0]}</span>
 </div>
 </div>

 {/* Customer & Partner Links */}
 <div className="space-y-1 mb-2">
 <Link
 to={`/customers/${project.customer?.id}`}
 onClick={(e) => e.stopPropagation()}
 className="flex items-center gap-1.5 text-xs text-slate-600 font-medium hover:text-emerald-600 transition truncate group/link"
 >
 <div className="w-3.5 h-3.5 bg-emerald-50 rounded flex items-center justify-center text-[7px] text-emerald-500 group-hover/link:bg-emerald-600 group-hover/link:text-white transition-colors">
 <FaUser />
 </div>
 <span className="truncate flex-1">{customerName}</span>
 </Link>

 {partnerName && (
 <Link
 to={`/partners/${project.partner?.id}`}
 onClick={(e) => e.stopPropagation()}
 className="flex items-center gap-1.5 text-xs text-slate-600 font-medium hover:text-emerald-600 transition truncate group/link"
 >
 <div className="w-3.5 h-3.5 bg-slate-50 rounded flex items-center justify-center text-[7px] text-slate-400 group-hover/link:bg-emerald-600 group-hover/link:text-white transition-colors">
 <FaGlobe />
 </div>
 <span className="truncate flex-1">{partnerName}</span>
 </Link>
 )}
 </div>

 {/* Footer: Date */}
 <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between">
 <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
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
  <div className="grid grid-cols-3 gap-3 lg:flex lg:gap-4 lg:overflow-x-auto pb-6 custom-scrollbar h-full">
  {columns.map(col => (
  <div
  key={col.id}
  onDragOver={(e) => handleDragOver(e, col.id)}
  onDragLeave={() => setDropTargetStatus(null)}
  onDrop={(e) => handleDrop(e, col.id)}
  className={clsx(
  "flex flex-col border transition-all duration-300 overflow-hidden min-h-[220px] lg:min-h-[400px] lg:min-w-[280px] lg:flex-1 lg:h-[calc(100vh-450px)] rounded-sm",
  dropTargetStatus === col.id
  ? "bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-100 scale-[1.005] shadow-sm"
  : "bg-white border-slate-200 shadow-sm"
  )}
  >
  <div className="px-2 py-2 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
  <div className="flex items-center gap-1.5">
  <div className="w-6 h-6 bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 text-xs rounded-sm">
  {col.icon}
  </div>
  <h3 className="font-medium text-slate-800 text-xs truncate">{col.title}</h3>
  </div>
  <div className="min-w-[18px] px-1 h-5 bg-slate-900 text-white flex items-center justify-center text-xs font-semibold rounded-sm shrink-0">
  {getColumnProjects(col.id).length}
  </div>
  </div>

  <div className="p-1.5 flex flex-col gap-1.5 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/20">
  {getColumnProjects(col.id).length > 0 ? (
  getColumnProjects(col.id).map(renderCard)
  ) : (
  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 opacity-30 py-6 bg-white">
  <div className="text-xs font-semibold text-slate-400">Leer</div>
  </div>
  )}
  </div>
  </div>
  ))}
  </div>
 );
};

export default KanbanBoard;
