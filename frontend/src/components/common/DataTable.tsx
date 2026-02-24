import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaSort, FaSortUp, FaSortDown, FaSearch, FaColumns, FaPlus } from 'react-icons/fa';
import clsx from 'clsx';
import Switch from './Switch';
import { Button } from './Button';

interface Column<T> {
    id: string; // Required for visibility toggle
    header: React.ReactNode;
    accessor: keyof T | ((item: T) => React.ReactNode);
    sortable?: boolean;
    sortKey?: string;
    className?: string;
    align?: 'left' | 'right' | 'center';
    defaultVisible?: boolean;
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
    showSettings?: boolean;
    extraControls?: React.ReactNode;
    onAddClick?: () => void;
    onViewChange?: (view: string) => void;
    views?: { label: string, value: string }[];
    currentView?: string;
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
    tabs,
    showSettings = true,
    extraControls,
    onAddClick,
    onViewChange,
    views = [],
    currentView
}: DataTableProps<T>) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [localPageSize, setLocalPageSize] = useState(pageSize);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(columns.filter(c => c.defaultVisible !== false).map(c => c.id)));
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);
    const settingsRef = useRef<HTMLDivElement>(null);



    // Filter by Visibility
    const activeColumns = useMemo(() => columns.filter(col => visibleColumns.has(col.id)), [columns, visibleColumns]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleColumn = (id: string) => {
        const next = new Set(visibleColumns);
        if (next.has(id)) {
            if (next.size > 1) next.delete(id);
        } else {
            next.add(id);
        }
        setVisibleColumns(next);
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
    const totalPages = Math.ceil(sortedData.length / localPageSize);
    const paginatedData = sortedData.slice((currentPage - 1) * localPageSize, currentPage * localPageSize);

    const renderSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort className="text-slate-300 ml-1.5 opacity-0 group-hover:opacity-100 transition" />;
        return sortConfig.direction === 'asc'
            ? <FaSortUp className="text-slate-700 ml-1.5" />
            : <FaSortDown className="text-slate-700 ml-1.5" />;
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if we have data and we aren't focused on an input
            if (sortedData.length === 0) return;
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) return;

            // Should strictly check if table is in view or focused, but globally for now per user request context often implies focus.
            // Check if arrow keys to avoid swallowing specific inputs.

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedRowIndex(prev => Math.min(prev + 1, paginatedData.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedRowIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                if (selectedRowIndex >= 0 && selectedRowIndex < paginatedData.length) {
                    onRowClick?.(paginatedData[selectedRowIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [paginatedData, selectedRowIndex, onRowClick, sortedData.length]);

    // Reset selection when page changes
    useEffect(() => {
        setSelectedRowIndex(-1);
    }, [currentPage, searchTerm, sortConfig]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa] border border-[#dee2e6] rounded-sm shadow-sm fade-in overflow-hidden">
            {/* Table Controls */}
            <div className="px-3 sm:px-4 py-2 border-b border-[#dee2e6] flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between bg-[linear-gradient(180deg,#ffffff_0%,#f1f3f5_100%)] relative z-30">
                <div className="flex gap-2 sm:gap-4 text-sm font-bold text-slate-700 w-full md:w-auto overflow-x-auto no-scrollbar shrink-0 items-center">
                    {views.length > 0 && (
                        <select
                            value={currentView}
                            onChange={(e) => onViewChange?.(e.target.value)}
                            className="h-8 px-2 border border-[#dee2e6] rounded-sm text-xs font-bold bg-white shadow-sm focus:outline-none focus:border-slate-400"
                        >
                            {views.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                        </select>
                    )}
                    {tabs || (
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder={searchPlaceholder}
                            className="w-full pl-8 pr-4 py-1.5 border border-[#ced4da] rounded-sm text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20 bg-white shadow-desktop-inset transition-all"
                        />
                    </div>

                    {extraControls}

                    {showSettings && (
                        <div className="relative" ref={settingsRef}>
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className={clsx(
                                    "p-2 border border-slate-200 text-slate-500 hover:bg-slate-50 transition shadow-sm",
                                    isSettingsOpen && "bg-slate-50 border-slate-200 text-slate-700"
                                )}
                                title="Spalten anpassen"
                            >
                                <FaColumns className="text-sm" />
                            </button>
                            {isSettingsOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white shadow-sm border border-slate-100 rounded-sm z-[100] p-4 fade-in max-h-[400px] overflow-y-auto custom-scrollbar">
                                    <h4 className="text-xs font-semibold text-slate-400 mb-3">Spalten anzeigen</h4>
                                    <div className="space-y-2">
                                        {columns.map((col) => (
                                            <div
                                                key={col.id}
                                                className="flex items-center justify-between p-1"
                                            >
                                                <span className={clsx("text-xs font-medium", visibleColumns.has(col.id) ? "text-slate-700" : "text-slate-400")}>
                                                    {typeof col.header === 'string' ? col.header : col.id}
                                                </span>
                                                <Switch
                                                    checked={visibleColumns.has(col.id)}
                                                    onChange={() => toggleColumn(col.id)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto flex-1 relative z-10 custom-scrollbar bg-white">
                <table className="w-full min-w-[1000px] text-left text-xs border-collapse">
                    <thead className="bg-[#f1f3f5] text-slate-700 font-bold text-[11px] uppercase tracking-tight sticky top-0 z-10 border-b border-[#dee2e6] shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                        <tr>
                            {activeColumns.map((col, idx) => {
                                const sortKey = col.sortKey || (typeof col.accessor === 'string' ? col.accessor : '');
                                return (
                                    <th
                                        key={idx}
                                        className={clsx(
                                            "px-2 sm:px-4 py-2.5 group transition-colors border-r border-[#dee2e6]/50 last:border-r-0",
                                            (col.sortable !== false && sortKey) && "cursor-pointer hover:bg-[#e9ecef]",
                                            col.className
                                        )}
                                        onClick={() => (col.sortable !== false && sortKey) ? handleSort(sortKey) : null}
                                    >
                                        <div className={clsx(
                                            "flex items-center gap-1",
                                            col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                                        )}>
                                            {col.header}
                                            {(col.sortable !== false && sortKey) && renderSortIcon(sortKey)}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {isLoading ? (
                            <tr>
                                <td colSpan={activeColumns.length} className="px-4 py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2 text-slate-700">
                                        <div className="w-6 h-6 border-2 border-slate-100 border-t-brand-600 rounded-full animate-spin"></div>
                                        <span className="text-xs font-semibold mt-2">Lade Daten...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((item, rowIdx) => (
                                <tr
                                    key={item.id || rowIdx}
                                    className={clsx(
                                        "hover:bg-slate-50 transition-all border-b border-[#f1f3f5] group outline-none",
                                        onRowClick && "cursor-pointer active:bg-slate-100",
                                        rowIdx === selectedRowIndex && "bg-slate-100 ring-1 ring-inset ring-slate-200 z-10",
                                        rowIdx % 2 !== 0 && rowIdx !== selectedRowIndex ? "bg-[#f8f9fa]" : (rowIdx !== selectedRowIndex ? "bg-white" : "")
                                    )}
                                    onClick={() => {
                                        setSelectedRowIndex(rowIdx);
                                        onRowClick && onRowClick(item);
                                    }}
                                >
                                    {activeColumns.map((col, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className={clsx(
                                                "px-2 sm:px-4 py-2 border-r border-[#f1f3f5]/50 last:border-r-0",
                                                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                                                col.className
                                            )}
                                        >
                                            <div className="text-slate-700">
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
                                <td colSpan={activeColumns.length} className="px-4 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 flex items-center justify-center text-slate-200">
                                            <FaSearch className="text-2xl" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-slate-600">Keine Datensätze gefunden</p>
                                            <p className="text-xs text-slate-400">Möchtest du einen neuen Datensatz hinzufügen?</p>
                                        </div>
                                        {onAddClick && (
                                            <Button onClick={onAddClick} size="sm">
                                                <FaPlus className="mr-2" /> Hinzufügen
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination UI */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-transparent">
                <div className="flex items-center gap-4 text-xs text-slate-500 font-bold">
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-4 mr-2">
                        <span className="shrink-0 uppercase text-[10px] text-slate-400">Zeige</span>
                        <select
                            value={localPageSize}
                            onChange={(e) => {
                                setLocalPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="h-6 px-1 border border-slate-200 rounded-sm text-[11px] bg-white focus:outline-none focus:border-slate-400"
                        >
                            {[5, 10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    {sortedData.length > 0 ? (
                        <>
                            <span className="text-slate-900">{(currentPage - 1) * localPageSize + 1}</span>
                            <span>bis</span>
                            <span className="text-slate-900">{Math.min(currentPage * localPageSize, sortedData.length)}</span>
                            <span>von</span>
                            <span className="text-slate-900">{sortedData.length}</span>
                        </>
                    ) : (
                        "0 Datensätze"
                    )}
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-1 border border-slate-300 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition bg-white shadow-sm"
                        >
                            <FaChevronLeft className="text-xs" />
                        </button>

                        <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-none no-scrollbar">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={clsx(
                                        "w-6 h-6 text-xs font-semibold transition flex items-center justify-center shrink-0",
                                        currentPage === i + 1
                                            ? "bg-slate-900 text-white shadow-sm"
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
                            className="p-1 border border-slate-300 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition bg-white shadow-sm"
                        >
                            <FaChevronRight className="text-xs" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataTable;
