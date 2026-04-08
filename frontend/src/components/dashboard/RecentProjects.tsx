import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaChevronLeft, FaChevronRight, FaEnvelope, FaBolt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import clsx from 'clsx';
import { getFlagUrl, getLanguageName } from '../../utils/flags';
import StatusBadge from '../common/StatusBadge';

import { format, formatDistanceToNow, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

interface RecentProjectsProps {
    projects: any[];
}

const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const RecentProjects: React.FC<RecentProjectsProps> = ({ projects: allProjects }) => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;

    // Filter Logic
    const activeProjects = allProjects.filter(p =>
        !['deleted', 'completed', 'archived'].includes(String(p.status || '').toLowerCase())
    );

    const filteredProjects = activeProjects.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'urgent') {
            if (!p.deadline) return false;
            const deadline = new Date(p.deadline);
            const today = new Date();
            const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
            return diffDays <= 3 && p.status !== 'completed';
        }
        if (filter === 'express') {
            return p.is_express === true || p.is_express === 1;
        }
        return p.status === filter;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    const paginatedProjects = filteredProjects.slice((page - 1) * itemsPerPage, page * itemsPerPage);


    return (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-transparent">
                <div className="flex items-center gap-4">
                    <h2 className="text-xs font-medium text-slate-800">
                        Aktuelle Projekte
                    </h2>
                    <div className="flex bg-slate-100 rounded-sm p-1 border border-slate-200">
                        <button
                            onClick={() => { setFilter('all'); setPage(1); }}
                            className={clsx(
                                "px-2.5 py-1 text-xs font-medium rounded-sm transition",
                                filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            )}
                        >
                            Alle
                        </button>
                        <button
                            onClick={() => { setFilter('urgent'); setPage(1); }}
                            className={clsx(
                                "px-2.5 py-1 text-xs font-medium rounded-sm transition flex items-center gap-1.5",
                                filter === 'urgent' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-red-600'
                            )}
                        >
                            Dringend <FaExclamationTriangle className="text-xs" />
                        </button>
                        <button
                            onClick={() => { setFilter('express'); setPage(1); }}
                            className={clsx(
                                "px-2.5 py-1 text-xs font-medium rounded-sm transition flex items-center gap-1",
                                filter === 'express' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-amber-600'
                            )}
                        >
                            Express <FaBolt className="text-xs" />
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

            <div className={clsx("flex-1 custom-scrollbar flex flex-col", paginatedProjects.length > 0 ? "overflow-x-auto" : "overflow-hidden")}>
                {paginatedProjects.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-4 py-3 border-b border-slate-100">Projekt</th>
                                <th className="px-4 py-3 border-b border-slate-100">Kunde</th>
                                <th className="px-4 py-3 border-b border-slate-100">Partner</th>
                                <th className="px-4 py-3 border-b border-slate-100 text-center">Sprachen</th>
                                <th className="px-4 py-3 border-b border-slate-100 text-right">Dateien</th>
                                <th className="px-4 py-3 border-b border-slate-100 text-right">Netto-Preis</th>
                                <th className="px-4 py-3 border-b border-slate-100 text-right">Deadline</th>
                                <th className="px-4 py-3 border-b border-slate-100 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedProjects.map((p) => {
                                const totalFiles = p.files?.length || 0;
                                const deadlineDate = p.deadline ? new Date(p.deadline) : null;
                                const isOverdue = deadlineDate ? isBefore(deadlineDate, startOfDay(new Date())) && p.status !== 'completed' && p.status !== 'delivered' && p.status !== 'paid' : false;

                                const customerName = p.customer?.company_name || (p.customer?.first_name ? `${p.customer.first_name} ${p.customer.last_name}` : 'Unbekannt');

                                return (
                                    <tr
                                        key={p.id}
                                        onClick={() => navigate(`/projects/${p.id}`)}
                                        className="hover:bg-slate-50 transition cursor-pointer group"
                                    >
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800 group-hover:text-brand-primary group-hover:underline transition truncate max-w-[150px]">
                                                    {p.project_name || p.name}
                                                </span>
                                                <span className="text-xs text-slate-400 font-mono tracking-tighter group-hover:text-brand-primary transition">
                                                    {p.display_id || p.project_number}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-xs">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-sm bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold border border-slate-200 shrink-0">
                                                    {getInitials(customerName)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span
                                                        onClick={(e) => { e.stopPropagation(); p.customer?.id && navigate(`/customers/${p.customer.id}`); }}
                                                        className={clsx(
                                                            "font-bold text-slate-700 whitespace-nowrap text-xs transition",
                                                            p.customer?.id ? "cursor-pointer hover:underline hover:text-slate-900" : ""
                                                        )}
                                                    >
                                                        {customerName}
                                                    </span>
                                                    {(p.customer?.address_street || p.customer?.address_city) && (
                                                        <div className="text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis mb-0.5">
                                                            {p.customer.address_street}{p.customer.address_street && (p.customer.address_zip || p.customer.address_city) ? ', ' : ''}
                                                            {p.customer.address_zip} {p.customer.address_city}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-xs">
                                            {p.partner ? (
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-sm bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold border border-slate-200 shrink-0">
                                                        {getInitials(p.partner.company || `${p.partner.first_name} ${p.partner.last_name}`)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span
                                                            onClick={(e) => { e.stopPropagation(); p.partner?.id && navigate(`/partners/${p.partner.id}`); }}
                                                            className={clsx(
                                                                "font-bold text-slate-700 whitespace-nowrap text-xs transition",
                                                                p.partner?.id ? "cursor-pointer hover:underline hover:text-slate-900" : ""
                                                            )}
                                                        >
                                                            {p.partner.company || `${p.partner.first_name} ${p.partner.last_name}`}
                                                        </span>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                                <FaEnvelope className="text-slate-300 shrink-0" />
                                                                <span className="truncate max-w-[130px]">{p.partner.email}</span>
                                                            </div>
                                                            {p.partner.phone && (
                                                                <span className="text-xs text-slate-400 font-medium">{p.partner.phone}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Nicht zugewiesen</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center justify-center gap-2.5">
                                                <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-sm border border-slate-100">
                                                    <img
                                                        src={getFlagUrl(p.source_language?.iso_code || p.sourceLanguage?.iso_code || 'de')}
                                                        className="w-3.5 h-2.5 object-cover"
                                                        alt="Src"
                                                    />
                                                    <span className="text-xs font-bold text-slate-600">
                                                        {(p.source_language?.name_internal || p.sourceLanguage?.name_internal || getLanguageName(p.source_language?.iso_code || p.sourceLanguage?.iso_code || 'de'))}
                                                    </span>
                                                </div>
                                                <FaArrowRight className="text-xs text-slate-300" />
                                                <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-sm border border-slate-100">
                                                    <img
                                                        src={getFlagUrl(p.target_language?.iso_code || p.targetLanguage?.iso_code || 'en')}
                                                        className="w-3.5 h-2.5 object-cover"
                                                        alt="Tgt"
                                                    />
                                                    <span className="text-xs font-bold text-slate-600">
                                                        {(p.target_language?.name_internal || p.targetLanguage?.name_internal || getLanguageName(p.target_language?.iso_code || p.targetLanguage?.iso_code || 'en'))}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end px-2 py-0.5 rounded-sm bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500 w-fit ml-auto">
                                                {totalFiles}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <span className="text-xs font-bold text-slate-900 tabular-nums">
                                                {p.price_total ? Number(p.price_total).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={clsx(
                                                    "text-[10.5px] font-bold tabular-nums whitespace-nowrap",
                                                    isOverdue ? "text-red-600" : "text-slate-700"
                                                )}>
                                                    {deadlineDate ? format(deadlineDate, 'EEEE, dd.MM.yyyy', { locale: de }) : '-'}
                                                </span>
                                                {deadlineDate && (
                                                    <span className={clsx(
                                                        "text-[9.5px] font-medium mt-0.5",
                                                        isOverdue ? "text-red-500" : "text-slate-400"
                                                    )}>
                                                        {isOverdue ? 'Überfällig' : `Noch ${formatDistanceToNow(deadlineDate, { locale: de })}`}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-1.5 text-right">
                                            <StatusBadge status={p.status} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
                        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm mb-3">
                            <FaCheckCircle className="text-xl text-slate-200" />
                        </div>
                        <span className="text-sm font-bold text-slate-600">Keine Projekte gefunden</span>
                        <p className="text-xs text-slate-400 mt-1 max-w-[250px]">Für den gewählten Filter existieren aktuell keine Einträge.</p>
                    </div>
                )}

            </div>

            {/* Pagination Controls */}
            {
                totalPages > 1 && (
                    <div className="px-3 py-2 border-t border-slate-100 flex justify-between items-center bg-transparent">
                        <span className="text-xs font-medium text-slate-400">Seite {page} von {totalPages}</span>
                        <div className="flex gap-1.5">
                            <button
                                disabled={page === 1}
                                onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }}
                                className="p-1.5 rounded-sm border border-slate-300 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition shadow-sm"
                            >
                                <FaChevronLeft className="text-xs" />
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(totalPages, p + 1)); }}
                                className="p-1.5 rounded-sm border border-slate-300 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition shadow-sm"
                            >
                                <FaChevronRight className="text-xs" />
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default RecentProjects;
