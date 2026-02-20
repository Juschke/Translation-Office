import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaExclamationCircle } from 'react-icons/fa';
import clsx from 'clsx';

interface Task {
 id: string;
 project_number?: string;
 name: string;
 status: string;
 deadline?: string;
 translator?: {
 name?: string;
 firstName?: string;
 lastName?: string;
 };
}

interface ActiveTasksTableProps {
 tasks: Task[];
}

const ActiveTasksTable: React.FC<ActiveTasksTableProps> = ({ tasks }) => {
 const navigate = useNavigate();

 const getStatusInfo = (status: string) => {
 switch (status) {
 case 'in_progress':
 case 'review':
 return { label: 'Bearbeitung', icon: FaClock, color: 'text-blue-600', bg: 'bg-blue-50' };
 case 'ready_for_pickup':
 return { label: 'Abholbereit', icon: FaExclamationCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' };
 case 'pending':
 case 'offer':
 case 'draft':
 return { label: 'Neu', icon: FaClock, color: 'text-slate-500', bg: 'bg-slate-50' };
 case 'invoiced':
 return { label: 'Rechnung', icon: FaClock, color: 'text-purple-600', bg: 'bg-purple-50' };
 case 'delivered':
 return { label: 'Geliefert', icon: FaClock, color: 'text-emerald-600', bg: 'bg-emerald-50' };
 case 'completed':
 return { label: 'Abgeschlossen', icon: FaClock, color: 'text-emerald-700', bg: 'bg-emerald-100' };
 default:
 return { label: status, icon: FaClock, color: 'text-slate-500', bg: 'bg-slate-50' };
 }
 };

 return (
 <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
 <h2 className="text-sm font-medium text-slate-700">
 Laufende Aufträge
 </h2>
 <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
 {tasks.length}
 </span>
 </div>
 <div className="overflow-auto flex-1 custom-scrollbar">
 <table className="w-full text-left">
 <thead className="bg-slate-50 text-slate-500 text-xs font-medium sticky top-0">
 <tr>
 <th className="px-5 py-3 border-b border-slate-100">Projekt</th>
 <th className="px-5 py-3 border-b border-slate-100">Status</th>
 <th className="px-5 py-3 border-b border-slate-100 text-right">Deadline</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {tasks.map((task) => {
 const statusInfo = getStatusInfo(task.status);
 const Icon = statusInfo.icon;

 // Calculate days remaining
 const deadline = task.deadline ? new Date(task.deadline) : null;
 const today = new Date();
 const daysRemaining = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24)) : null;
 const isUrgent = daysRemaining !== null && daysRemaining <= 2;

 return (
 <tr
 key={task.id}
 onClick={() => navigate(`/projects/${task.id}`)}
 className="hover:bg-slate-50 transition cursor-pointer group"
 >
 <td className="px-5 py-3">
 <div className="flex flex-col">
 <span className="text-xs font-medium text-slate-800 group-hover:text-slate-900 transition truncate max-w-[180px]">
 {task.name}
 </span>
 <span className="text-xs text-slate-400 font-medium">
 {task.project_number || task.id}
 </span>
 </div>
 </td>
 <td className="px-5 py-3">
 <div className="flex items-center gap-2">
 <div className={clsx("w-6 h-6 rounded flex items-center justify-center shrink-0", statusInfo.bg, statusInfo.color)}>
 <Icon className="text-xs" />
 </div>
 <div className="flex flex-col">
 <span className="text-xs font-medium text-slate-700 leading-tight">{statusInfo.label}</span>
 <span className="text-xs text-slate-400">
 {task.translator ? (task.translator.firstName || task.translator.name) : 'Kein Übersetzer'}
 </span>
 </div>
 </div>
 </td>
 <td className="px-5 py-3 text-right">
 {deadline ? (
 <div className="flex flex-col items-end">
 <span className={clsx("text-xs font-medium", isUrgent ? "text-slate-800" : "text-slate-700")}>
 {deadline.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
 </span>
 <span className={clsx("text-xs font-medium", isUrgent ? "text-slate-500" : "text-slate-400")}>
 {daysRemaining} Tage
 </span>
 </div>
 ) : (
 <span className="text-xs text-slate-400">-</span>
 )}
 </td>
 </tr>
 );
 })}
 {tasks.length === 0 && (
 <tr>
 <td colSpan={3} className="px-5 py-8 text-center text-slate-400 italic text-xs">
 Keine aktiven Aufträge.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
};

export default ActiveTasksTable;
