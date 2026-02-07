import React, { useState, useMemo } from 'react';
import { FaTimes, FaSearch, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '../../api/services';
// Reuse PartnerForm logic or create CustomerForm if differing significantly. For this step, I will focus on the list selection logic which is the primary request.
// If CustomerForm is needed, we should create it. For now, I'll stick to the search/selection part as the 'Ändern' functionality primarily implies selecting an existing customer.
// If creation is needed, we can expand later or reuse components.

interface Customer {
    id: number;
    name: string;
    company: string;
    email: string;
    phone: string;
    initials: string;
    color: string;
    type: 'company' | 'private' | 'authority';
    status: string;
    contact: string;
}

interface CustomerSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: any) => void;
}

const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
    const PAGE_SIZE = 8;

    const { data: customersData = [], isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getAll
    });

    const customers: Customer[] = useMemo(() => {
        if (!Array.isArray(customersData)) return [];
        return customersData.map((c: any) => ({
            id: c.id,
            name: c.first_name ? `${c.first_name} ${c.last_name}` : c.company_name,
            company: c.company_name || '',
            email: c.email || '',
            phone: c.phone || '',
            initials: ((c.company_name?.substring(0, 2)) || ((c.first_name?.[0] || '') + (c.last_name?.[0] || 'K'))).toUpperCase(),
            color: 'bg-brand-50 text-brand-700', // Default color for now, could be dynamic
            type: c.type || 'private',
            status: c.status || 'Active',
            contact: c.type === 'company' ? `${c.first_name} ${c.last_name}` : '-'
        }));
    }, [customersData]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <FaSort className="text-slate-300 ml-1 opacity-50" size={10} />;
        return sortConfig.direction === 'asc' ? <FaSortUp className="text-brand-600 ml-1" size={10} /> : <FaSortDown className="text-brand-600 ml-1" size={10} />;
    };

    const processedCustomers = useMemo(() => {
        let result = customers.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesSearch;
        });

        if (sortConfig.key && sortConfig.direction) {
            result.sort((a: any, b: any) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                if (typeof bValue === 'string') bValue = bValue.toLowerCase();
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [customers, searchTerm, sortConfig]);

    const paginatedCustomers = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return processedCustomers.slice(start, start + PAGE_SIZE);
    }, [processedCustomers, currentPage]);

    const totalPages = Math.ceil(processedCustomers.length / PAGE_SIZE);

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-slate-900/40 z-[70] flex items-center justify-center backdrop-blur-sm p-6 overflow-hidden transition-all">
                <div className="bg-white rounded shadow-2xl p-8 flex flex-col items-center gap-3 animate-fadeIn">
                    <div className="w-8 h-8 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lade Kunden...</span>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'active': 'bg-emerald-50 text-emerald-600 border-emerald-200',
            'inactive': 'bg-slate-50 text-slate-400 border-slate-200',
            'blocked': 'bg-red-50 text-red-600 border-red-200'
        };
        const labels: Record<string, string> = {
            'active': 'Aktiv',
            'inactive': 'Inaktiv',
            'blocked': 'Gesperrt'
        };
        return (
            <span className={clsx("px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-tighter", styles[status] || styles.inactive)}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[70] flex items-center justify-center backdrop-blur-sm p-6 overflow-hidden transition-all">
            <div className="bg-white rounded shadow-2xl w-full max-w-4xl flex flex-col h-full max-h-[85vh] border border-slate-200 animate-fadeIn font-sans">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">
                            Kunden-Auswahl
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Auftraggeber zuordnen</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:bg-slate-200 transition">
                            <FaTimes className="text-lg" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-8 py-4 bg-white border-b border-slate-100 flex items-center shrink-0">
                    <div className="flex-1 w-full relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
                        <input
                            type="text"
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm bg-slate-50 focus:outline-none focus:border-brand-500 focus:bg-white transition"
                            placeholder="Kunde suchen (Name, Firma, Email)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full border-collapse text-left">
                        <thead className="bg-slate-50 sticky top-0 z-20">
                            <tr>
                                <th className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider cursor-pointer hover:text-brand-700 transition" onClick={() => handleSort('name')}>
                                    <div className="flex items-center">Name / Firma {getSortIcon('name')}</div>
                                </th>
                                <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-40">Typ</th>
                                <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-2.5"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {paginatedCustomers.map(c => (
                                <React.Fragment key={c.id}>
                                    <tr
                                        className={clsx(
                                            "transition-all group cursor-pointer border-b border-transparent",
                                            expandedCustomerId === c.id ? "bg-brand-50/30" : "hover:bg-slate-50/80"
                                        )}
                                        onClick={() => setExpandedCustomerId(expandedCustomerId === c.id ? null : c.id)}
                                    >
                                        <td className="px-6 py-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-black shadow-sm shrink-0 ${c.color}`}>{c.initials}</div>
                                                <div className="flex flex-col">
                                                    <div className="font-bold text-slate-900 text-[12px] group-hover:text-brand-700 transition leading-tight">{c.company || c.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-medium">{c.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                                            {c.type === 'company' ? 'Firma' : c.type === 'authority' ? 'Behörde' : 'Privat'}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            {getStatusBadge(c.status)}
                                        </td>
                                        <td className="px-6 py-2.5 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelect(c); }}
                                                className="bg-brand-600 text-white px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-brand-700 transition active:scale-95"
                                            >
                                                Auswählen
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedCustomerId === c.id && (
                                        <tr className="bg-slate-50/80 animate-fadeIn border-b border-slate-200">
                                            <td colSpan={4} className="p-0">
                                                <div className="px-6 py-3 flex items-center gap-8 text-xs">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Ansprechpartner</span>
                                                        <div className="font-bold text-slate-800">{c.contact}</div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Telefon</span>
                                                        <div className="font-medium text-slate-600">{c.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {processedCustomers.length > PAGE_SIZE && (
                    <div className="px-8 py-3 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {processedCustomers.length} Kunden gefunden
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 px-3 rounded border border-slate-200 bg-white text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                Zurück
                            </button>
                            <div className="flex items-center gap-1 mx-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={clsx(
                                            "w-8 h-8 rounded text-[10px] font-black transition-all",
                                            currentPage === i + 1
                                                ? "bg-brand-700 text-white shadow-md shadow-brand-700/20"
                                                : "text-slate-400 hover:bg-slate-50"
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 px-3 rounded border border-slate-200 bg-white text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                Weiter
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 border border-slate-300 rounded text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-white transition">
                        Abbrechen
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerSelectionModal;
