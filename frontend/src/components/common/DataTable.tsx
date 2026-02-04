import React, { useState, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight, FaSort, FaSortUp, FaSortDown, FaSearch } from 'react-icons/fa';
import clsx from 'clsx';

interface Column<T> {
    header: React.ReactNode;
    accessor: keyof T | ((item: T) => React.ReactNode);
    sortable?: boolean;
    sortKey?: string; // Optional key to use for sorting if accessor is a function
    className?: string;
    align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    pageSize?: number;
    isLoading?: boolean;
    searchPlaceholder?: string;
    searchFields?: (keyof T)[];
    actions?: React.ReactNode;
    tabs?: React.ReactNode;
}

const DataTable = <T extends { id: string | number }>({
    data,
    columns,
    onRowClick,
    pageSize = 10,
    isLoading = false,
    searchPlaceholder = "Suche nach Projekt...",
    searchFields = [],
    actions,
    tabs
}: DataTableProps<T>) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // 1. Filter by search term
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        const lowTerm = searchTerm.toLowerCase();
        return data.filter(item => {
            if (searchFields.length > 0) {
                return searchFields.some(field =>
                    String(item[field]).toLowerCase().includes(lowTerm)
                );
            }
            return Object.values(item).some(val =>
                String(val).toLowerCase().includes(lowTerm)
            );
        });
    }, [data, searchTerm, searchFields]);

    // 2. Sort data
    const sortedData = useMemo(() => {
        const sorted = [...filteredData];
        if (!sortConfig) return sorted;

        const { key, direction } = sortConfig;
        sorted.sort((a, b) => {
            const valA = (a as any)[key];
            const valB = (b as any)[key];

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredData, sortConfig]);

    // 3. Paginate data
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const renderSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort className="text-slate-300 ml-1.5 opacity-0 group-hover:opacity-100 transition" />;
        return sortConfig.direction === 'asc'
            ? <FaSortUp className="text-brand-600 ml-1.5" />
            : <FaSortDown className="text-brand-600 ml-1.5" />;
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg shadow-sm fade-in">
            {/* Table Controls */}
            <div className="px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white rounded-t-lg relative z-20">
                <div className="flex gap-4 text-sm font-medium text-slate-600 w-full md:w-auto overflow-x-auto custom-scrollbar">
                    {tabs || (
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>
                <div className="relative w-full md:w-64">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder={searchPlaceholder}
                        className="w-full pl-8 pr-4 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-brand-500 bg-white"
                    />
                </div>
            </div>

            <div className="overflow-x-auto flex-1 relative z-10">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold sticky top-0 z-10 shadow-sm">
                        <tr>
                            {columns.map((col, idx) => {
                                const sortKey = col.sortKey || (typeof col.accessor === 'string' ? col.accessor : '');
                                return (
                                    <th
                                        key={idx}
                                        className={clsx(
                                            "px-4 py-2.5 border-b border-slate-200 group transition-colors",
                                            col.sortable && sortKey && "cursor-pointer hover:bg-slate-100",
                                            col.className
                                        )}
                                        onClick={() => col.sortable && sortKey ? handleSort(sortKey) : null}
                                    >
                                        <div className={clsx(
                                            "flex items-center gap-1",
                                            col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                                        )}>
                                            {col.header}
                                            {col.sortable && sortKey && renderSortIcon(sortKey)}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest mt-2">Lade Daten...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((item, rowIdx) => (
                                <tr
                                    key={item.id || rowIdx}
                                    className={clsx(
                                        "hover:bg-slate-50 transition border-b border-slate-100 last:border-b-0 group",
                                        onRowClick && "cursor-pointer active:bg-slate-100"
                                    )}
                                    onClick={() => onRowClick && onRowClick(item)}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className={clsx(
                                                "px-4 py-2.5",
                                                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                                                col.className
                                            )}
                                        >
                                            <div className="text-slate-700 truncate">
                                                {typeof col.accessor === 'function'
                                                    ? col.accessor(item)
                                                    : (item as any)[col.accessor as string]}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400 text-xs italic">
                                    Keine Datensätze gefunden.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50 rounded-b-lg">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <span className="text-slate-800">{(currentPage - 1) * pageSize + 1}</span>-<span className="text-slate-800">{Math.min(currentPage * pageSize, sortedData.length)}</span> / <span className="text-slate-800">{sortedData.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-1 border border-slate-300 rounded text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition bg-white shadow-sm"
                        >
                            <FaChevronLeft className="text-[10px]" />
                        </button>

                        <div className="flex gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={clsx(
                                        "w-6 h-6 rounded text-[10px] font-bold transition flex items-center justify-center",
                                        currentPage === i + 1
                                            ? "bg-brand-700 text-white shadow-sm"
                                            : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-1 border border-slate-300 rounded text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition bg-white shadow-sm"
                        >
                            <FaChevronRight className="text-[10px]" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
