import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Table, type TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';
import { FaSearch, FaColumns, FaPlus, FaChevronLeft, FaChevronRight, FaChevronDown, FaTimes, FaFilter, FaUndo } from 'react-icons/fa';
import clsx from 'clsx';
import Switch from './Switch';
import type { BulkActionItem, BulkActionVariant } from './BulkActions';
import TableSkeleton from './TableSkeleton';

export interface FilterDef {
    id: string;
    label: string;
    type: 'select' | 'text' | 'date';
    options?: { value: string | number; label: string }[];
    value: any;
    onChange: (val: any) => void;
    placeholder?: string;
}

interface Column<T> {
    id: string;
    header: React.ReactNode;
    accessor: keyof T | ((item: T) => React.ReactNode);
    sortable?: boolean;
    sortKey?: string;
    className?: string;
    align?: 'left' | 'right' | 'center';
    defaultVisible?: boolean;
    width?: number;
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
    // ── Selection & BulkActions ──
    selectable?: boolean;
    selectedIds?: (string | number)[];
    onSelectionChange?: (ids: (string | number)[]) => void;
    bulkActions?: BulkActionItem[];
    // ── Filters ──
    filters?: FilterDef[];
    activeFilterCount?: number;
    onResetFilters?: () => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const ALL_SENTINEL = 9_999_999;

// ── Inline BulkAction button with Bootstrap Skeuomorphism ──
const variantStyles: Record<BulkActionVariant, string> = {
    default: 'bg-gradient-to-b from-white to-[#ebebeb] text-[#444] border-[#ccc] hover:border-[#adadad] hover:text-[#1B4D4F]',
    primary: 'bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white border-[#123a3c] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] hover:from-[#2a7073] hover:to-[#235e62]',
    danger: 'bg-gradient-to-b from-white to-[#ebebeb] text-red-600 border-[#ccc] hover:border-red-300 hover:bg-red-50',
    dangerSolid: 'bg-gradient-to-b from-[#e05050] to-[#c9302c] text-white border-[#9c2320] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] hover:from-[#e85555]',
    success: 'bg-gradient-to-b from-[#62bb62] to-[#449d44] text-white border-[#398439] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] hover:from-[#6ec86e]',
    warning: 'bg-gradient-to-b from-[#f5b85a] to-[#ec971f] text-white border-[#d58512] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] hover:from-[#f7c168]',
};

const BulkActionBtn = ({ label, icon, onClick, variant = 'default' }: BulkActionItem) => (
    <button
        onClick={onClick}
        className={clsx(
            'px-2.5 py-1 rounded-[3px] text-xs font-semibold transition flex items-center gap-1.5 border',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_1px_rgba(0,0,0,0.09)]',
            'active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)]',
            variantStyles[variant] ?? variantStyles.default
        )}
    >
        {icon} {label}
    </button>
);

// ── Main component ──
const DataTable = <T extends { id: string | number }>({
    data,
    columns,
    onRowClick,
    pageSize: pageSizeProp = 9_999_999,
    isLoading = false,
    searchPlaceholder = "Suche...",
    searchFields = [],
    actions,
    tabs,
    showSettings = true,
    extraControls,
    onAddClick,
    selectable = false,
    selectedIds = [],
    onSelectionChange,
    bulkActions,
    filters,
    activeFilterCount,
    onResetFilters,
}: DataTableProps<T>) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascend' | 'descend' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [pageSize, setPageSize] = useState(pageSizeProp);
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
        new Set(columns.filter(c => c.defaultVisible !== false).map(c => c.id))
    );
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedRowKey, setSelectedRowKey] = useState<string | number | null>(null);

    const settingsBtnRef = useRef<HTMLButtonElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

    // ── Resizing Logic ──
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
        const widths: Record<string, number> = {};
        columns.forEach(col => {
            if (col.width) widths[col.id] = col.width;
        });
        return widths;
    });

    const resizingCol = useRef<{ id: string; startX: number; startWidth: number } | null>(null);

    const handleResize = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const startX = e.pageX;
        const startWidth = columnWidths[id] || 150; // Default width if not set

        resizingCol.current = { id, startX, startWidth };
        document.body.classList.add('dt-column-resizing');

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!resizingCol.current) return;
            const diff = moveEvent.pageX - resizingCol.current.startX;
            const newWidth = Math.max(50, resizingCol.current.startWidth + diff);
            setColumnWidths(prev => ({ ...prev, [resizingCol.current!.id]: newWidth }));
        };

        const onMouseUp = () => {
            resizingCol.current = null;
            document.body.classList.remove('dt-column-resizing');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const activeColumns = useMemo(
        () => columns.filter(col => visibleColumns.has(col.id)),
        [columns, visibleColumns]
    );

    const toggleColumn = (id: string) => {
        const next = new Set(visibleColumns);
        if (next.has(id)) {
            if (next.size > 1) next.delete(id);
        } else {
            next.add(id);
        }
        setVisibleColumns(next);
    };

    const openSettings = () => {
        if (settingsBtnRef.current) {
            const rect = settingsBtnRef.current.getBoundingClientRect();
            // Using viewport coordinates for fixed positioning
            setDropdownPos({
                top: rect.bottom + 5,
                right: window.innerWidth - rect.right
            });
        }
        setIsSettingsOpen(v => !v);
    };

    useEffect(() => {
        if (!isSettingsOpen) return;
        const handler = (e: MouseEvent) => {
            if (settingsBtnRef.current?.contains(e.target as Node) || settingsRef.current?.contains(e.target as Node)) return;
            setIsSettingsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isSettingsOpen]);

    // 1. Filter
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const low = searchTerm.toLowerCase();
        return data.filter(item => {
            if (searchFields.length > 0)
                return searchFields.some(f => String(item[f]).toLowerCase().includes(low));
            return Object.values(item).some(v => String(v).toLowerCase().includes(low));
        });
    }, [data, searchTerm, searchFields]);

    // 2. Sort
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;
        const sorted = [...filteredData];
        const { key, direction } = sortConfig;
        sorted.sort((a, b) => {
            const va = (a as Record<string, string | number>)[key];
            const vb = (b as Record<string, string | number>)[key];
            if (va == null && vb == null) return 0;
            if (va == null) return -1;
            if (vb == null) return 1;
            const cmp = va < vb ? -1 : va > vb ? 1 : 0;
            return direction === 'ascend' ? cmp : -cmp;
        });
        return sorted;
    }, [filteredData, sortConfig]);

    // 3. Paginate
    const effectivePageSize = pageSize === ALL_SENTINEL ? (sortedData.length || 1) : pageSize;
    const totalPages = Math.ceil(sortedData.length / effectivePageSize);
    const paginatedData = sortedData.slice(
        (currentPage - 1) * effectivePageSize,
        currentPage * effectivePageSize
    );

    useEffect(() => { setCurrentPage(1); setSelectedRowKey(null); }, [searchTerm, sortConfig, pageSize]);

    // ── Build antd columns — skip sort on first + last data column ──
    const antdColumns: ColumnsType<T> = activeColumns.map((col, index) => {
        const isFirst = index === 0;
        const isLast = index === activeColumns.length - 1;
        const sortKey = col.sortKey || (typeof col.accessor === 'string' ? String(col.accessor) : col.id);

        return {
            key: col.id,
            dataIndex: typeof col.accessor === 'string' ? (col.accessor as string) : undefined,
            render:
                typeof col.accessor === 'function'
                    ? (_: unknown, record: T) => (col.accessor as (item: T) => React.ReactNode)(record)
                    : undefined,
            // No sort on first or last column
            sorter: (!isFirst && !isLast) ? (a: T, b: T) => {
                const va = (a as Record<string, string | number>)[sortKey];
                const vb = (b as Record<string, string | number>)[sortKey];
                if (va == null && vb == null) return 0;
                if (va == null) return -1;
                if (vb == null) return 1;
                if (va < vb) return -1;
                if (va > vb) return 1;
                return 0;
            } : undefined,
            align: col.align ?? 'left',
            className: col.className,
            showSorterTooltip: false,
            width: columnWidths[col.id],
            title: (
                <div className="relative w-full group/header">
                    <div className="w-full">{col.header}</div>
                    <div
                        className="dt-column-resizer"
                        onMouseDown={(e) => handleResize(col.id, e)}
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            ),
        };
    });

    const handleTableChange: TableProps<T>['onChange'] = (_p, _f, sorter) => {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        if (s?.columnKey && s.order) {
            setSortConfig({ key: String(s.columnKey), direction: s.order as 'ascend' | 'descend' });
        } else {
            setSortConfig(null);
        }
    };

    // ── Row selection (antd rowSelection) ──
    const rowSelection = selectable ? {
        type: 'checkbox' as const,
        selectedRowKeys: selectedIds as React.Key[],
        onChange: (keys: React.Key[]) => onSelectionChange?.(keys as (string | number)[]),
        onSelectAll: (selected: boolean) => {
            if (selected) {
                onSelectionChange?.(sortedData.map(item => item.id));
            } else {
                onSelectionChange?.([]);
            }
        },
        columnWidth: 40,
        getCheckboxProps: () => ({ onClick: (e: React.MouseEvent) => e.stopPropagation() }),
    } : undefined;

    const visibleBulkActions = bulkActions?.filter(a => a.show !== false) ?? [];
    const hasSelection = selectable && selectedIds.length > 0;

    const emptyNode = (
        <div className="flex flex-col items-center justify-center gap-4 py-20 min-h-[400px]">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                <FaPlus className="text-2xl text-slate-300" />
            </div>
            <div className="space-y-1 text-center">
                <p className="text-base font-bold text-slate-600">Noch kein Eintrag</p>
                <p className="text-xs text-slate-400">Klicken Sie auf den Button unten, um den ersten Eintrag zu erstellen.</p>
            </div>
            {onAddClick && (
                <button
                    onClick={onAddClick}
                    className="mt-2 px-6 py-2.5 bg-brand-primary text-white rounded-[3px] font-bold shadow-sm hover:bg-brand-primary/90 transition flex items-center gap-2"
                >
                    <FaPlus className="text-xs" /> Neuer Eintrag
                </button>
            )}
        </div>
    );

    return (
        <div className="dt-skeuomorphic flex flex-col h-full bg-white border border-[#D1D9D8] rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)] fade-in overflow-hidden max-h-[calc(100vh-250px)] sm:max-h-none">

            {/* ── Filter Panel ── */}
            {filters && filters.length > 0 && (
                <div
                    className={clsx(
                        "overflow-hidden transition-all duration-300 ease-in-out bg-[#f6f8f8]",
                        isFilterOpen ? "max-h-[800px] border-b border-[#D1D9D8]" : "max-h-0"
                    )}
                >
                    <div className="p-4 flex flex-col gap-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {filters.map(filter => (
                                <div key={filter.id} className="space-y-1.5 flex flex-col">
                                    <label className="text-xs font-semibold text-slate-700">{filter.label}</label>
                                    {filter.type === 'select' ? (
                                        <div className="relative">
                                            <select
                                                className="w-full h-9 text-xs border border-[#ccc] rounded-[3px] px-2.5 bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] focus:border-[#1B4D4F] outline-none appearance-none pr-8 cursor-pointer hover:border-[#adadad] transition"
                                                value={filter.value}
                                                onChange={e => filter.onChange(e.target.value)}
                                            >
                                                {filter.options?.map(opt => (
                                                    <option key={String(opt.value)} value={String(opt.value)}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none" />
                                        </div>
                                    ) : (
                                        <input
                                            type={filter.type}
                                            value={filter.value}
                                            onChange={e => filter.onChange(e.target.value)}
                                            placeholder={filter.placeholder}
                                            className="w-full h-9 text-xs border border-[#ccc] rounded-[3px] px-2.5 bg-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] focus:border-[#1B4D4F] outline-none transition"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        {onResetFilters && (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => { onResetFilters(); setIsFilterOpen(false); }}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-[#ccc] rounded-[3px] hover:bg-slate-50 transition shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center gap-1.5"
                                >
                                    <FaUndo className="text-[10px]" /> Filter zurücksetzen
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Controls Bar ── */}
            <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[#D1D9D8] flex flex-col md:flex-row gap-3 items-center justify-between bg-gradient-to-b from-white to-[#f0f0f0] shadow-[0_1px_0_rgba(255,255,255,0.8)] relative z-10">
                <div className="flex gap-2 sm:gap-4 text-sm font-medium text-slate-600 w-full md:w-auto overflow-x-auto no-scrollbar shrink-0 scroll-smooth">
                    {tabs ?? (actions && <div className="flex items-center gap-2">{actions}</div>)}
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64 shrink-0">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-8 pr-4 py-1.5 border border-[#D1D9D8] rounded-[3px] text-sm focus:outline-none focus:border-[#1B4D4F] bg-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.07)] transition-colors"
                        />
                    </div>
                    {extraControls}
                    {filters && filters.length > 0 && (
                        <button
                            onClick={() => setIsFilterOpen(v => !v)}
                            className={clsx(
                                "p-2 border transition rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.08)] flex items-center justify-center relative",
                                isFilterOpen || activeFilterCount
                                    ? "bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white border-[#123a3c] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                                    : "text-slate-500 hover:text-[#1B4D4F] bg-gradient-to-b from-white to-[#ebebeb] border-[#ccc]"
                            )}
                            title="Filter"
                        >
                            <FaFilter className="text-sm" />
                            {activeFilterCount ? (
                                <span className={clsx(
                                    "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center border",
                                    isFilterOpen
                                        ? "bg-white text-[#1B4D4F] border-transparent"
                                        : "bg-rose-500 text-white border-rose-600 shadow-sm"
                                )}>
                                    {activeFilterCount}
                                </span>
                            ) : null}
                        </button>
                    )}
                    {showSettings && (
                        <button
                            ref={settingsBtnRef}
                            onClick={openSettings}
                            className={clsx(
                                "p-2 border text-slate-500 hover:text-[#1B4D4F] transition rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
                                isSettingsOpen
                                    ? "bg-[#e8e8e8] border-[#aaa] text-slate-700"
                                    : "bg-gradient-to-b from-white to-[#ebebeb] border-[#ccc]"
                            )}
                            title="Spalten anpassen"
                        >
                            <FaColumns className="text-sm" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── BulkActions bar — connected to controls, same gradient ── */}
            {hasSelection && (
                <div className="border-b border-[#D1D9D8] px-4 py-2 bg-gradient-to-b from-[#eaeaea] to-[#e0e0e0] flex items-center justify-between gap-4 animate-fadeIn shadow-[inset_0_-1px_0_rgba(255,255,255,0.5)]">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold text-[#1B4D4F] bg-[#dff0ef] border border-[#b8cecd] px-2 py-0.5 rounded-[2px] whitespace-nowrap shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                            {selectedIds.length} ausgewählt
                        </span>
                        {visibleBulkActions.length > 0 && (
                            <div className="h-3.5 w-px bg-[#bbb]" />
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {visibleBulkActions.map((action, i) => (
                                <BulkActionBtn key={i} {...action} />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => onSelectionChange?.([])}
                        className="shrink-0 p-1 text-slate-400 hover:text-slate-700 hover:bg-[#d0d0d0] rounded-[2px] transition"
                        title="Auswahl aufheben"
                    >
                        <FaTimes className="text-xs" />
                    </button>
                </div>
            )}

            {/* ── Ant Design Table ── */}
            <div className="flex-1 overflow-x-auto min-h-0 relative">
                {isLoading ? (
                    <TableSkeleton rows={pageSize} columns={activeColumns.length + (selectable ? 1 : 0)} />
                ) : (
                    <Table<T>
                        columns={antdColumns}
                        dataSource={paginatedData}
                        rowKey="id"
                        pagination={false}
                        loading={false}
                        size="small"
                        showSorterTooltip={false}
                        onChange={handleTableChange}
                        rowSelection={rowSelection}
                        sticky
                        tableLayout="fixed"
                        scroll={{
                            x: '100%',
                            y: window.innerWidth < 768 ? 400 : 'calc(100vh - 420px)'
                        }}
                        onRow={record => ({
                            onClick: () => {
                                setSelectedRowKey(record.id);
                                onRowClick?.(record);
                            },
                            className: clsx(
                                onRowClick && 'cursor-pointer',
                                record.id === selectedRowKey && 'dt-row-selected'
                            ),
                        })}
                        rowClassName={(_, index) => index % 2 !== 0 ? 'dt-row-odd' : 'dt-row-even'}
                        locale={{ emptyText: emptyNode }}
                        className="dt-antd-table"
                    />
                )}
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#D1D9D8] bg-gradient-to-b from-[#f5f5f5] to-white gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                        {sortedData.length > 0 ? (
                            <>
                                <span className="font-semibold text-slate-800">
                                    {pageSize === ALL_SENTINEL ? 1 : (currentPage - 1) * effectivePageSize + 1}
                                </span>
                                {' – '}
                                <span className="font-semibold text-slate-800">
                                    {Math.min(currentPage * effectivePageSize, sortedData.length)}
                                </span>
                                {' von '}
                                <span className="font-semibold text-slate-800">{sortedData.length}</span>
                            </>
                        ) : '0 Datensätze'}
                    </span>

                    <div className="relative inline-flex items-center">
                        <select
                            value={pageSize}
                            onChange={e => setPageSize(Number(e.target.value))}
                            className="appearance-none pr-6 pl-2.5 py-1 border border-[#ccc] rounded-[3px] bg-gradient-to-b from-white to-[#ebebeb] text-xs font-semibold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.08)] focus:outline-none focus:border-[#1B4D4F] cursor-pointer transition-colors hover:border-[#adadad]"
                        >
                            {PAGE_SIZE_OPTIONS.map(n => (
                                <option key={n} value={n}>{n} pro Seite</option>
                            ))}
                            <option value={ALL_SENTINEL}>Alle anzeigen</option>
                        </select>
                        <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {totalPages > 1 && pageSize !== ALL_SENTINEL && (
                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-1.5 border border-[#ccc] rounded-[3px] text-slate-500 bg-gradient-to-b from-white to-[#ebebeb] hover:to-[#e0e0e0] hover:text-[#1B4D4F] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_1px_1px_rgba(0,0,0,0.08)] transition"
                        >
                            <FaChevronLeft className="text-xs" />
                        </button>
                        <div className="flex gap-1 overflow-x-auto max-w-[220px] md:max-w-none no-scrollbar">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={clsx(
                                        "w-7 h-7 text-xs font-semibold rounded-[3px] border transition flex items-center justify-center shrink-0",
                                        currentPage === i + 1
                                            ? "bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white border-[#133d3f] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"
                                            : "bg-gradient-to-b from-white to-[#ebebeb] border-[#ccc] text-slate-600 hover:text-[#1B4D4F] hover:border-[#999] shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-1.5 border border-[#ccc] rounded-[3px] text-slate-500 bg-gradient-to-b from-white to-[#ebebeb] hover:to-[#e0e0e0] hover:text-[#1B4D4F] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_1px_1px_rgba(0,0,0,0.08)] transition"
                        >
                            <FaChevronRight className="text-xs" />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Column-visibility panel as portal ── */}
            {isSettingsOpen && createPortal(
                <div
                    ref={settingsRef}
                    style={{
                        top: dropdownPos.top,
                        right: dropdownPos.right
                    }}
                    className="fixed z-[1000] w-64 bg-white border border-slate-200 rounded-sm shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-hidden animate-slideUp"
                >

                    <div className="p-1 max-h-[350px] overflow-y-auto custom-scrollbar">
                        {columns.map((col, index) => (
                            <div
                                key={col.id}
                                onClick={() => toggleColumn(col.id)}
                                className={clsx(
                                    "flex items-center justify-between py-2.5 px-3 transition-colors hover:bg-slate-50 cursor-pointer select-none",
                                    index !== columns.length - 1 && "border-b border-slate-100"
                                )}
                            >
                                <span className={clsx(
                                    "text-xs font-bold transition-all",
                                    visibleColumns.has(col.id) ? "text-slate-700" : "text-slate-400"
                                )}>
                                    {typeof col.header === 'string' ? col.header : col.id}
                                </span>
                                <div className="scale-90 pointer-events-none">
                                    <Switch checked={visibleColumns.has(col.id)} onChange={() => { }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-slate-50 px-3 py-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{visibleColumns.size} Aktiv</span>
                        <button
                            onClick={() => setIsSettingsOpen(false)}
                            className="text-[9px] font-bold text-brand-primary uppercase tracking-widest hover:underline"
                        >
                            Schließen
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DataTable;
