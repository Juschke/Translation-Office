import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import clsx from 'clsx';
import { getFlagUrl } from '../../utils/flags';
import { getLanguageLabel } from '../../utils/languages';

interface RecentProjectsProps {
 projects: any[];
}

const RecentProjects: React.FC<RecentProjectsProps> = ({ projects: allProjects }) => {
 const navigate = useNavigate();
 const [filter, setFilter] = useState('all');
 const [page, setPage] = useState(1);
 const itemsPerPage = 5;



 // Filter Logic
 const filteredProjects = allProjects.filter(p => {
 if (filter === 'all') return true;
 if (filter === 'urgent') {
 if (!p.deadline) return false;
 const deadline = new Date(p.deadline);
 const today = new Date();
 const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
 return diffDays <= 3 && p.status !== 'completed';
 }
 return p.status === filter;
 });

 // Pagination Logic
 const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
 const paginatedProjects = filteredProjects.slice((page - 1) * itemsPerPage, page * itemsPerPage);

 const getStatusBadge = (status: string) => {
 const styles: { [key: string]: string } = {
 'draft': 'bg-slate-50 text-slate-600 border-slate-200',
 'offer': 'bg-orange-50 text-orange-700 border-orange-200',
 'pending': 'bg-orange-50 text-orange-700 border-orange-200',
 'in_progress': 'bg-blue-50 text-blue-700 border-blue-200',
 'review': 'bg-blue-50 text-blue-700 border-blue-200',
 'ready_for_pickup': 'bg-indigo-50 text-indigo-700 border-indigo-200',
 'delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
 'invoiced': 'bg-purple-50 text-purple-700 border-purple-200',
 'completed': 'bg-emerald-600 text-white border-emerald-700'
 };
 const labels: { [key: string]: string } = {
 'draft': 'Neu',
 'offer': 'Neu',
 'pending': 'Neu',
 'in_progress': 'Bearbeitung',
 'review': 'Bearbeitung',
 'ready_for_pickup': 'Abholbereit',
 'delivered': 'Geliefert',
 'invoiced': 'Rechnung',
 'completed': 'Abgeschlossen'
 };
 return <span className={clsx("px-2 py-0.5 rounded text-xs font-medium border tracking-tight shrink-0", styles[status] || styles['draft'])}>
 {labels[status] || status}
 </span>;
 }

 return (
 <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
 <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-transparent">
 <div className="flex items-center gap-4">
 <h2 className="text-sm font-medium text-slate-800">
 Aktuelle Projekte
 </h2>
 <div className="flex bg-slate-100 rounded-sm p-1 border border-slate-200">
 <button
 onClick={() => { setFilter('all'); setPage(1); }}
 className={clsx(
 "px-3 py-1.5 text-xs font-medium rounded-sm transition",
 filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
 )}
 >
 Alle
 </button>
 <button
 onClick={() => { setFilter('urgent'); setPage(1); }}
 className={clsx(
 "px-3 py-1.5 text-xs font-medium rounded-sm transition",
 filter === 'urgent' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-red-600'
 )}
 >
 Dringend
 </button>
 </div>
 </div>
 <button
 onClick={() => navigate('/projects')}
 className="text-xs font-medium text-slate-900 hover:text-slate-800 flex items-center gap-1.5 group transition"
 >
 Alle ansehen <FaChevronRight className="text-xs group-hover:translate-x-0.5 transition" />
 </button>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-slate-50 text-slate-500 text-xs font-medium">
 <tr>
 <th className="px-6 py-3 border-b border-slate-100">Projekt</th>
 <th className="px-6 py-3 border-b border-slate-100">Kunde</th>
 <th className="px-6 py-3 border-b border-slate-100">Sprachen</th>
 <th className="px-6 py-3 border-b border-slate-100 text-right">Deadline</th>
 <th className="px-6 py-3 border-b border-slate-100 text-right">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {paginatedProjects.map((p) => (
 <tr
 key={p.id}
 onClick={() => navigate(`/projects/${p.id}`)}
 className="hover:bg-slate-50 transition cursor-pointer group"
 >
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-xs font-medium text-slate-800 group-hover:text-slate-900 transition">{p.project_name || p.name}</span>
 <span className="text-xs text-slate-400 font-semibold">{p.project_number || p.id}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className="text-xs font-medium text-slate-700">
 {p.customer?.company_name ||
 p.customer?.name ||
 (p.customer?.first_name ? `${p.customer.first_name} ${p.customer.last_name}` : null) ||
 'Unbekannt'}
 </span>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1">
 <img
 src={getFlagUrl(p.source_language?.iso_code || p.source_language?.code || p.sourceLanguage?.code || 'de')}
 className="w-4 h-3 object-cover shadow-sm border border-slate-200 rounded-[1px]"
 alt="Source"
 />
 <span className="text-xs font-semibold text-slate-400er">
 {getLanguageLabel(p.source_language?.iso_code || p.source_language?.code || p.sourceLanguage?.code)}
 </span>
 </div>
 <FaArrowRight className="text-xs text-slate-200" />
 <div className="flex items-center gap-1">
 <img
 src={getFlagUrl(p.target_language?.iso_code || p.target_language?.code || p.targetLanguage?.code || 'en')}
 className="w-4 h-3 object-cover shadow-sm border border-slate-200 rounded-[1px]"
 alt="Target"
 />
 <span className="text-xs font-semibold text-slate-400er">
 {getLanguageLabel(p.target_language?.iso_code || p.target_language?.code || p.targetLanguage?.code)}
 </span>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <span className="text-xs font-semibold text-slate-800 tabular-nums">
 {p.deadline ? new Date(p.deadline).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 {getStatusBadge(p.status)}
 </td>
 </tr>
 ))}
 {paginatedProjects.length === 0 && (
 <tr>
 <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-xs">Keine Projekte in diesem Filter gefunden.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination Controls */}
 {totalPages > 1 && (
 <div className="px-6 py-3 border-t border-slate-100 flex justify-between items-center bg-transparent">
 <span className="text-xs font-medium text-slate-400">Seite {page} von {totalPages}</span>
 <div className="flex gap-1.5">
 <button
 disabled={page === 1}
 onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }}
 className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition shadow-sm"
 >
 <FaChevronLeft className="text-xs" />
 </button>
 <button
 disabled={page === totalPages}
 onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(totalPages, p + 1)); }}
 className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition shadow-sm"
 >
 <FaChevronRight className="text-xs" />
 </button>
 </div>
 </div>
 )}
 </div>
 );
};

export default RecentProjects;
