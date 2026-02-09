import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheckCircle } from 'react-icons/fa';

interface Invoice {
    id: number;
    number: string;
    customer_name?: string;
    customerName?: string;
    amount: number;
    due_date?: string;
    status: string;
}

interface OverdueInvoicesTableProps {
    invoices: Invoice[];
}

const OverdueInvoicesTable: React.FC<OverdueInvoicesTableProps> = ({ invoices }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FaBell className="text-slate-400 text-xs" />
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                        Überfällige Rechnungen
                    </h2>
                </div>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {invoices.length}
                </span>
            </div>
            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider sticky top-0">
                        <tr>
                            <th className="px-5 py-3 border-b border-slate-100">Rechnung</th>
                            <th className="px-5 py-3 border-b border-slate-100">Kunde</th>
                            <th className="px-5 py-3 border-b border-slate-100 text-right">Betrag / Fällig</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {invoices.map((invoice) => {
                            const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
                            const today = new Date();
                            const daysOverdue = dueDate ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)) : 0;
                            const customerName = invoice.customer_name || invoice.customerName || 'Unbekannt';

                            return (
                                <tr
                                    key={invoice.id}
                                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                                    className="hover:bg-slate-50 transition cursor-pointer group"
                                >
                                    <td className="px-5 py-3 align-top">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition">
                                                {invoice.number}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                {daysOverdue} Tage überfällig
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 align-top">
                                        <span className="text-[11px] font-medium text-slate-600 truncate max-w-[150px] block" title={customerName}>
                                            {customerName}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right align-top">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-black text-slate-800">
                                                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                                            </span>
                                            <span className="text-[10px] font-medium text-slate-400">
                                                {dueDate ? dueDate.toLocaleDateString('de-DE') : '-'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-5 py-12 text-center text-slate-400 italic text-xs">
                                    Keine überfälligen Rechnungen.
                                    <div className="flex justify-center mt-2">
                                        <FaCheckCircle className="text-green-500 text-lg" />
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OverdueInvoicesTable;
