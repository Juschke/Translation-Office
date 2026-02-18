import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaClock, FaExclamationCircle, FaFileInvoiceDollar, FaCheckCircle,
    FaFileContract
} from 'react-icons/fa';
import clsx from 'clsx';

interface Task {
    id: string;
    project_number?: string;
    name: string;
    status: string;
    deadline?: string;
    customer_name?: string;
    customerName?: string;
    translator?: {
        name?: string;
        firstName?: string;
        lastName?: string;
    };
}

interface Invoice {
    id: number;
    number: string;
    customer_name?: string;
    customerName?: string;
    amount: number;
    due_date?: string;
    status: string;
    reminder_level?: number;
}

interface DashboardCombinedTableProps {
    activeTasks: Task[];
    openQuotes: Task[];
    readyToDeliver: Task[];
    overdueInvoices: Invoice[];
}

const DashboardCombinedTable: React.FC<DashboardCombinedTableProps> = ({
    activeTasks,
    openQuotes,
    readyToDeliver,
    overdueInvoices
}) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'tasks' | 'quotes' | 'deliver' | 'overdue'>('tasks');

    const tabs = [
        { id: 'tasks', label: 'Aufträge', count: activeTasks.length },
        { id: 'quotes', label: 'Angebote', count: openQuotes.length },
        { id: 'deliver', label: 'Lieferbereit', count: readyToDeliver.length },
        { id: 'overdue', label: 'Überfällig', count: overdueInvoices.length },
    ];

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'in_progress':
            case 'review':
                return { label: 'Bearbeitung', icon: FaClock, color: 'text-blue-600', bg: 'bg-blue-50' };
            case 'ready_for_pickup':
                return { label: 'Abholbereit', icon: FaExclamationCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' };
            case 'quote_sent':
                return { label: 'Angebot gesendet', icon: FaFileContract, color: 'text-orange-600', bg: 'bg-orange-50' };
            case 'pending':
            case 'offer':
            case 'draft':
                return { label: 'Neu', icon: FaClock, color: 'text-slate-500', bg: 'bg-slate-50' };
            case 'invoiced':
                return { label: 'Rechnung', icon: FaFileInvoiceDollar, color: 'text-purple-600', bg: 'bg-purple-50' };
            case 'delivered':
                return { label: 'Geliefert', icon: FaCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' };
            default:
                return { label: status, icon: FaClock, color: 'text-slate-500', bg: 'bg-slate-50' };
        }
    };

    const renderTableContent = () => {
        if (activeTab === 'overdue') {
            return overdueInvoices.map((invoice) => {
                const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
                const today = new Date();
                const daysOverdue = dueDate ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)) : 0;
                const customerName = invoice.customer_name || invoice.customerName || 'Unbekannt';
                const reminderLevel = (invoice as any).reminder_level || 0;

                return (
                    <tr
                        key={invoice.id}
                        onClick={() => navigate(`/invoices`, { state: { filter: 'overdue' } })}
                        className="hover:bg-slate-50 transition cursor-pointer group"
                    >
                        <td className="px-5 py-3">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-800 group-hover:text-brand-700 transition tracking-tight">
                                    {invoice.number}
                                </span>
                                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                                    {daysOverdue} Tage überfällig
                                </span>
                            </div>
                        </td>
                        <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">{customerName}</span>
                                {reminderLevel > 0 && (
                                    <span className="bg-orange-100 text-orange-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-orange-200 uppercase tracking-tighter">
                                        M{reminderLevel}
                                    </span>
                                )}
                            </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-slate-800 tabular-nums">
                                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {dueDate ? dueDate.toLocaleDateString('de-DE') : '-'}
                                </span>
                            </div>
                        </td>
                    </tr>
                );
            });
        }

        const data = activeTab === 'tasks' ? activeTasks : (activeTab === 'quotes' ? openQuotes : readyToDeliver);

        return data.map((task) => {
            const statusInfo = getStatusInfo(task.status);
            const deadline = task.deadline ? new Date(task.deadline) : null;
            const today = new Date();
            const daysRemaining = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24)) : null;
            const isUrgent = daysRemaining !== null && daysRemaining <= 2;
            const customerName = task.customer_name || task.customerName || 'Kein Kunde';

            return (
                <tr
                    key={task.id}
                    onClick={() => navigate(`/projects/${task.id}`)}
                    className="hover:bg-slate-50 transition cursor-pointer group"
                >
                    <td className="px-5 py-3">
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-800 group-hover:text-brand-700 transition tracking-tight truncate max-w-[200px]">
                                {task.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                                {task.project_number || task.id.substring(0, 8)}
                            </span>
                        </div>
                    </td>
                    <td className="px-5 py-3">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-600">{customerName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{statusInfo.label}</span>
                            </div>
                        </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                        {deadline ? (
                            <div className="flex flex-col items-end">
                                <span className={clsx("text-xs font-black tabular-nums", isUrgent ? "text-red-500" : "text-slate-800")}>
                                    {deadline.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </span>
                                <span className={clsx("text-[10px] font-bold", isUrgent ? "text-red-400" : "text-slate-400")}>
                                    {daysRemaining === 0 ? 'Heute' : daysRemaining === 1 ? 'Morgen' : `${daysRemaining} Tage`}
                                </span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold text-slate-300">-</span>
                        )}
                    </td>
                </tr>
            );
        });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col h-[500px]">
            {/* Header / Tabs */}
            <div className="px-2 pt-2 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center justify-between pb-2 px-3 pt-2">
                    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        Arbeitsvorrat
                    </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={clsx(
                                    "flex items-center gap-2 py-4 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap border-b-2",
                                    isActive
                                        ? "text-slate-900 border-slate-900"
                                        : "text-slate-400 border-transparent hover:text-slate-600"
                                )}
                            >
                                <span>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={clsx(
                                        "px-1.5 py-0.5 rounded-sm text-[9px] font-black",
                                        isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                                    )}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="px-5 py-3 border-b border-slate-100">Element</th>
                            <th className="px-5 py-3 border-b border-slate-100">Details</th>
                            <th className="px-5 py-3 border-b border-slate-100 text-right">Fällig / Betrag</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {renderTableContent()}
                        {((activeTab === 'tasks' && activeTasks.length === 0) ||
                            (activeTab === 'quotes' && openQuotes.length === 0) ||
                            (activeTab === 'deliver' && readyToDeliver.length === 0) ||
                            (activeTab === 'overdue' && overdueInvoices.length === 0)) && (
                                <tr>
                                    <td colSpan={3} className="px-5 py-20 text-center text-slate-400 italic text-xs">
                                        <div className="flex flex-col items-center gap-3">
                                            <FaCheckCircle className="text-emerald-400 text-2xl opacity-20" />
                                            <span>Hier gibt es aktuell nichts zu tun.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
            <div className="px-4 py-3 bg-slate-50/30 border-t border-slate-100 text-center">
                <button
                    onClick={() => navigate(activeTab === 'overdue' ? '/invoices' : '/projects')}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-600 transition"
                >
                    Alle anzeigen
                </button>
            </div>
        </div>
    );
};

export default DashboardCombinedTable;
