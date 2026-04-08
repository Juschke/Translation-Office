import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Table, type TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';
import { FaSearch, FaColumns, FaPlus, FaChevronLeft, FaChevronRight, FaChevronDown, FaTimes, FaFilter, FaUndo, FaDownload, FaFileExcel, FaFileCsv, FaFilePdf } from 'react-icons/fa';
import clsx from 'clsx';
import Switch from './Switch';
import type { BulkActionItem, BulkActionVariant } from './BulkActions';
import TableSkeleton from './TableSkeleton';
import { Button } from '../ui/button';
import { ICON_ACTION_BUTTON_CLASS, ICON_COLOR_BRAND, ICON_COLOR_DANGER, ICON_COLOR_SUCCESS, ICON_SIZE_MD, ICON_SIZE_SM, ICON_SIZE_XS } from '../ui/icon-styles';
import { useTranslation } from 'react-i18next';
import SearchableSelect from './SearchableSelect';

export interface FilterDef {
    id: string;
    label: string;
    type: 'select' | 'text' | 'date' | 'searchableSelect';
    options?: { value: string | number; label: string; icon?: string }[];
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
    onExport?: (format: 'xlsx' | 'csv' | 'pdf') => void;
    filterLayout?: 'top' | 'sidebar';
    onFilterToggle?: () => void;
    isFilterOpen_external?: boolean;
    preSearchControls?: React.ReactNode;
    searchLabel?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const ALL_SENTINEL = 9_999_999;

// ── Inline BulkAction button with Bootstrap Skeuomorphism ──
const variantStyles: Record<BulkActionVariant, string> = {
    default: 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-[#1B4D4F]',
    primary: 'bg-[#1B4D4F] text-white border-[#123a3c] hover:bg-[#235e62]',
    danger: 'bg-white text-red-600 border-slate-300 hover:border-red-300 hover:bg-red-50',
    dangerSolid: 'bg-red-600 text-white border-red-700 hover:bg-red-700',
    success: 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700',
    warning: 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600',
};

const BulkActionBtn = ({ label, icon, onClick, variant = 'default' }: BulkActionItem) => (
    <button
        onClick={onClick}
        className={clsx(
            'px-2.5 py-1 rounded-sm text-xs font-semibold transition-colors flex items-center gap-1.5 border [&_svg]:text-[11px]',
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
    onExport,
    filterLayout = 'top',
    onFilterToggle,
    isFilterOpen_external,
    preSearchControls,
    searchLabel,
}: DataTableProps<T>) => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascend' | 'descend' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [pageSize, setPageSize] = useState(pageSizeProp);
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
        new Set(columns.filter(c => c.defaultVisible !== false).map(c => c.id))
    );
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedRowKey, setSelectedRowKey] = useState<string | number | null>(null);

    const settingsBtnRef = useRef<HTMLButtonElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);
    const exportBtnRef = useRef<HTMLButtonElement>(null);
    const exportDropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const [exportDropdownPos, setExportDropdownPos] = useState({ top: 0, left: 0 });

    const [columnWidths] = useState<Record<string, number>>(() => {
        const widths: Record<string, number> = {};
        columns.forEach(col => {
            if (col.width) widths[col.id] = col.width;
        });
        return widths;
    });

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

    const openExport = () => {
        if (exportBtnRef.current) {
            const rect = exportBtnRef.current.getBoundingClientRect();
            setExportDropdownPos({
                top: rect.bottom + 5,
                left: rect.left
            });
        }
        setIsExportOpen(v => !v);
    };

    useEffect(() => {
        if (!isSettingsOpen && !isExportOpen) return;
        const handler = (e: MouseEvent) => {
            if (isSettingsOpen) {
                if (settingsBtnRef.current?.contains(e.target as Node) || settingsRef.current?.contains(e.target as Node)) return;
                setIsSettingsOpen(false);
            }
            if (isExportOpen) {
                if (exportBtnRef.current?.contains(e.target as Node) || exportDropdownRef.current?.contains(e.target as Node)) return;
                setIsExportOpen(false);
            }
        };
        // Close on scroll if using portal
        const scrollHandler = () => {
            if (isSettingsOpen) setIsSettingsOpen(false);
            if (isExportOpen) setIsExportOpen(false);
        };
        document.addEventListener('mousedown', handler);
        window.addEventListener('scroll', scrollHandler, true);
        return () => {
            document.removeEventListener('mousedown', handler);
            window.removeEventListener('scroll', scrollHandler, true);
        };
    }, [isSettingsOpen, isExportOpen]);

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
            title: col.header,
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

    const isEmpty = paginatedData.length === 0 && !isLoading;

    const emptyNode = (
        <div className="flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                <FaPlus className="text-xl text-slate-300" />
            </div>
            <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-slate-600">{t('data_table.empty_title')}</p>
                <p className="text-[11px] text-slate-400">{t('data_table.empty_description')}</p>
            </div>
            {onAddClick && (
                <Button
                    variant="default"
                    onClick={onAddClick}
                    className="mt-1 px-5 py-2 font-bold flex items-center gap-2 h-9"
                >
                    <FaPlus className="text-[10px]" /> {t('data_table.new_entry')}
                </Button>
            )}
        </div>
    );




    // ── Sidebar filter panel ──
    const sidebarFilterPanel = filterLayout === 'sidebar' && filters && filters.length > 0 && (
        <div
            className={clsx(
                "flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out border-r border-[#D1D9D8] bg-[#f6f8f8] flex flex-col",
                isFilterOpen ? "w-56" : "w-0"
            )}
        >
            <div className="w-56 flex flex-col gap-0 overflow-y-auto custom-scrollbar flex-1">
                <div className="px-3 pt-3 pb-2 border-b border-[#D1D9D8] bg-gradient-to-b from-white to-[#f0f0f0]">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t('common.filter')}</span>
                </div>
                <div className="p-3 flex flex-col gap-3 flex-1">
                    {filters.map(filter => (
                        <div key={filter.id} className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-600">{filter.label}</label>
                            {filter.type === 'searchableSelect' ? (
                                <SearchableSelect
                                    options={filter.options?.map(o => ({ value: String(o.value), label: o.label, icon: (o as any).icon })) || []}
                                    value={String(filter.value)}
                                    onChange={filter.onChange}
                                    placeholder={filter.placeholder}
                                    className="border-[#ccc] hover:border-[#adadad]"
                                />
                            ) : filter.type === 'select' ? (
                                <div className="relative">
                                    <select
                                        className="w-full h-8 text-xs border border-[#ccc] rounded-[3px] px-2.5 bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] focus:border-[#1B4D4F] outline-none appearance-none pr-7 cursor-pointer hover:border-[#adadad] transition"
                                        value={filter.value}
                                        onChange={e => filter.onChange(e.target.value)}
                                    >
                                        {filter.options?.map(opt => (
                                            <option key={String(opt.value)} value={String(opt.value)}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <FaChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 ${ICON_SIZE_XS}`} />
                                </div>
                            ) : (
                                <input
                                    type={filter.type}
                                    value={filter.value}
                                    onChange={e => filter.onChange(e.target.value)}
                                    placeholder={filter.placeholder}
                                    className="w-full h-8 text-xs border border-[#ccc] rounded-[3px] px-2.5 bg-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] focus:border-[#1B4D4F] outline-none transition"
                                />
                            )}
                        </div>
                    ))}
                </div>
                {onResetFilters && (
                    <div className="px-3 pb-3 pt-2 border-t border-[#D1D9D8]">
                        <button
                            onClick={() => onResetFilters()}
                            className="w-full px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-[#ccc] rounded-[3px] hover:bg-slate-50 transition shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center gap-1.5"
                        >
                            <FaUndo className={ICON_SIZE_XS} /> {t('data_table.reset')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="dt-skeuomorphic flex flex-col h-full bg-white border border-[#D1D9D8] rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)] fade-in overflow-hidden">

            {/* ── Filter Panel (top layout) ── */}
            {filterLayout === 'top' && filters && filters.length > 0 && (
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
                                    {filter.type === 'searchableSelect' ? (
                                        <SearchableSelect
                                            options={filter.options?.map(o => ({ value: String(o.value), label: o.label, icon: (o as any).icon })) || []}
                                            value={String(filter.value)}
                                            onChange={filter.onChange}
                                            placeholder={filter.placeholder}
                                            className="border-[#ccc] hover:border-[#adadad]"
                                        />
                                    ) : filter.type === 'select' ? (
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
                                            <FaChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 ${ICON_SIZE_XS}`} />
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
                                    <FaUndo className={ICON_SIZE_XS} /> {t('data_table.reset_filters')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Controls Bar ── */}
            <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[#D1D9D8] flex flex-col md:flex-row gap-3 items-center justify-between bg-gradient-to-b from-white to-[#f0f0f0] shadow-[0_1px_0_rgba(255,255,255,0.8)] relative z-10">
                {(onExport || actions) && (
                    <div className="flex gap-2 sm:gap-4 text-sm font-medium text-slate-600 w-full md:w-auto overflow-x-auto no-scrollbar shrink-0 scroll-smooth items-center">
                        <div className="flex items-center gap-2">
                            {onExport && (
                                <div className="relative">
                                    <button
                                        ref={exportBtnRef}
                                        onClick={openExport}
                                        className={clsx(
                                            "px-3 py-1.5 border border-[#ccc] text-slate-600 hover:bg-slate-50 text-xs font-semibold bg-gradient-to-b from-white to-[#ebebeb] rounded-[3px] flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition active:shadow-inner",
                                            isExportOpen && "border-[#adadad] bg-[#f0f0f0]"
                                        )}
                                    >
                                        <FaDownload className={ICON_SIZE_XS} /> {t('common.export')}
                                    </button>
                                </div>
                            )}
                            {actions}
                        </div>
                    </div>
                )}
                <div className="flex-1 flex items-end justify-between gap-2">
                    {preSearchControls}
                    <div className="relative flex-1 md:w-64 shrink-0 flex flex-col">
                        {searchLabel && (
                            <label className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider leading-none">
                                {searchLabel}
                            </label>
                        )}
                        <div className="relative">
                            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 ${ICON_SIZE_XS}`} />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-8 pr-4 py-1.5 border border-[#D1D9D8] rounded-[3px] text-sm focus:outline-none focus:border-[#1B4D4F] bg-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.07)] transition-colors"
                            />
                        </div>
                    </div>
                    {extraControls}
                    {(filters && filters.length > 0 || onFilterToggle) && (
                        <button
                            onClick={() => onFilterToggle ? onFilterToggle() : setIsFilterOpen(v => !v)}
                            className={clsx(
                                `${ICON_ACTION_BUTTON_CLASS} relative h-9 w-9 shadow-[0_1px_2px_rgba(0,0,0,0.08)]`,
                                (onFilterToggle ? isFilterOpen_external : isFilterOpen) || activeFilterCount
                                    ? "bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white border-[#123a3c] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                                    : "text-slate-500 hover:text-[#1B4D4F] bg-gradient-to-b from-white to-[#ebebeb] border-[#ccc]"
                            )}
                            title={t('common.filter')}
                        >
                            <FaFilter className={ICON_SIZE_MD} />
                            {activeFilterCount ? (
                                <span className={clsx(
                                    "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-xs font-bold flex items-center justify-center border",
                                    (onFilterToggle ? isFilterOpen_external : isFilterOpen)
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
                                `${ICON_ACTION_BUTTON_CLASS} h-9 w-9 shadow-[0_1px_2px_rgba(0,0,0,0.08)]`,
                                isSettingsOpen
                                    ? "bg-[#e8e8e8] border-[#aaa] text-slate-700"
                                    : "bg-gradient-to-b from-white to-[#ebebeb] border-[#ccc]"
                            )}
                            title={t('data_table.adjust_columns')}
                        >
                            <FaColumns className={ICON_SIZE_MD} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Tabs Bar ── */}
            {tabs && (
                <div className="px-3 sm:px-4 py-2 border-b border-[#D1D9D8] bg-gradient-to-b from-white to-[#f0f0f0] flex items-center overflow-x-auto no-scrollbar shadow-[0_1px_0_rgba(255,255,255,0.8)] relative z-10 w-full">
                    {tabs}
                </div>
            )}

            {/* ── BulkActions bar — connected to controls, same gradient ── */}
            {hasSelection && (
                <div className="border-b border-[#D1D9D8] px-4 py-2 bg-gradient-to-b from-[#eaeaea] to-[#e0e0e0] flex items-center justify-between gap-4 animate-fadeIn shadow-[inset_0_-1px_0_rgba(255,255,255,0.5)]">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold text-[#1B4D4F] bg-[#dff0ef] border border-[#b8cecd] px-2 py-0.5 rounded-[2px] whitespace-nowrap shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                            {t('data_table.selected_count', { count: selectedIds.length })}
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
                        title={t('data_table.clear_selection')}
                    >
                        <FaTimes className={ICON_SIZE_XS} />
                    </button>
                </div>
            )}

            {/* ── Body: sidebar + table ── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {sidebarFilterPanel}

                {/* ── Ant Design Table ── */}
                <div className={clsx("flex flex-col flex-1 min-h-0 relative overflow-auto custom-scrollbar bg-gray-200")}>
                    {isLoading ? (
                        <TableSkeleton rows={pageSize === ALL_SENTINEL ? 10 : pageSize} columns={activeColumns.length + (selectable ? 1 : 0)} />
                    ) : isEmpty ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                            {emptyNode}
                        </div>
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
                            sticky={{ offsetHeader: 0 }}
                            tableLayout="auto"
                            scroll={{ x: 'max-content' }}
                            onRow={record => ({
                                onClick: () => {
                                    setSelectedRowKey((record as any).id);
                                    onRowClick?.(record);
                                },
                                className: clsx(
                                    onRowClick && 'cursor-pointer',
                                    (record as any).id === selectedRowKey && 'dt-row-selected'
                                ),
                            })}
                            rowClassName={(_, index) => index % 2 !== 0 ? 'dt-row-odd' : 'dt-row-even'}
                            className="dt-antd-table"
                        />
                    )}
                </div>

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
                                {` ${t('data_table.of')} `}
                                <span className="font-semibold text-slate-800">{sortedData.length}</span>
                            </>
                        ) : t('data_table.zero_records')}
                    </span>

                    <div className="relative inline-flex items-center">
                        <select
                            value={pageSize}
                            onChange={e => setPageSize(Number(e.target.value))}
                            className="appearance-none pr-6 pl-2.5 py-1 border border-[#ccc] rounded-[3px] bg-gradient-to-b from-white to-[#ebebeb] text-xs font-semibold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.08)] focus:outline-none focus:border-[#1B4D4F] cursor-pointer transition-colors hover:border-[#adadad]"
                        >
                            {PAGE_SIZE_OPTIONS.map(n => (
                                <option key={n} value={n}>{t('data_table.per_page', { count: n })}</option>
                            ))}
                            <option value={ALL_SENTINEL}>{t('data_table.show_all')}</option>
                        </select>
                        <FaChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 ${ICON_SIZE_XS}`} />
                    </div>
                </div>

                {totalPages > 1 && pageSize !== ALL_SENTINEL && (
                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-1.5 border border-[#ccc] rounded-[3px] text-slate-500 bg-gradient-to-b from-white to-[#ebebeb] hover:to-[#e0e0e0] hover:text-[#1B4D4F] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_1px_1px_rgba(0,0,0,0.08)] transition"
                        >
                            <FaChevronLeft className={ICON_SIZE_SM} />
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
                            <FaChevronRight className={ICON_SIZE_SM} />
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
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{t('data_table.active_columns', { count: visibleColumns.size })}</span>
                        <button
                            onClick={() => setIsSettingsOpen(false)}
                            className="text-xs font-bold text-brand-primary uppercase tracking-widest hover:underline"
                        >
                            {t('actions.close')}
                        </button>
                    </div>
                </div>,
                document.body
            )}
            {/* ── Export dropdown as portal ── */}
            {isExportOpen && onExport && createPortal(
                <div
                    ref={exportDropdownRef}
                    style={{
                        top: exportDropdownPos.top,
                        left: exportDropdownPos.left
                    }}
                    className="fixed z-[1000] w-48 bg-white rounded-sm shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden animate-slideUp"
                >
                    <button
                        onClick={() => { onExport('xlsx'); setIsExportOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition"
                    >
                        <FaFileExcel className={`${ICON_SIZE_MD} ${ICON_COLOR_SUCCESS}`} /> Excel (.xlsx)
                    </button>
                    <button
                        onClick={() => { onExport('csv'); setIsExportOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition"
                    >
                        <FaFileCsv className={`${ICON_SIZE_MD} ${ICON_COLOR_BRAND}`} /> CSV (.csv)
                    </button>
                    <button
                        onClick={() => { onExport('pdf'); setIsExportOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-600 border-t border-slate-50 transition"
                    >
                        <FaFilePdf className={`${ICON_SIZE_MD} ${ICON_COLOR_DANGER}`} /> PDF Report
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DataTable;
