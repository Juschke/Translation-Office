import React from 'react';
import clsx from 'clsx';

export interface Column<T> {
  /**
   * Column key/identifier
   */
  key: keyof T;

  /**
   * Column header label
   */
  label: string;

  /**
   * Column width (optional)
   */
  width?: string;

  /**
   * Custom render function
   */
  render?: (value: any, row: T) => React.ReactNode;

  /**
   * Alignment
   */
  align?: 'left' | 'center' | 'right';
}

interface DashboardTableCardProps<T> {
  /**
   * Table title
   */
  title: string;

  /**
   * Table data
   */
  data: T[];

  /**
   * Column definitions
   */
  columns: Column<T>[];

  /**
   * Callback when row is clicked
   */
  onRowClick?: (item: T, index: number) => void;

  /**
   * Empty state message
   */
  emptyMessage?: string;

  /**
   * Custom empty state component
   */
  emptyState?: React.ReactNode;

  /**
   * Row className customizer
   */
  getRowClassName?: (item: T, index: number) => string;

  /**
   * Show hover effect
   */
  hoverable?: boolean;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Max height with scroll
   */
  maxHeight?: string;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Striped rows
   */
  striped?: boolean;

  /**
   * Border variant
   */
  borderVariant?: 'default' | 'minimal' | 'none';
}

/**
 * Standardisierte Dashboard Tabellen-Komponente
 * Ersetzt 4 separate Implementierungen:
 * - OverdueInvoicesTable
 * - OpenQuotesTable
 * - ActiveTasksTable
 * - ReadyToDeliverTable
 */
const DashboardTableCard = React.forwardRef<
  HTMLDivElement,
  DashboardTableCardProps<any>
>(
  (
    {
      title,
      data,
      columns,
      onRowClick,
      emptyMessage = 'Keine Daten verfügbar',
      emptyState,
      getRowClassName,
      hoverable = true,
      className,
      maxHeight,
      isLoading = false,
      striped = false,
      borderVariant = 'default',
    },
    ref
  ) => {
    const getBorderClasses = () => {
      switch (borderVariant) {
        case 'minimal':
          return 'border-b border-slate-50 last:border-0';
        case 'none':
          return '';
        default:
          return 'border-b border-slate-100 last:border-0';
      }
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden',
          className
        )}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>

        {/* Table */}
        <div style={{ maxHeight }} className="overflow-y-auto">
          {isLoading ? (
            <div className="px-5 py-8 text-center">
              <div className="inline-block w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-sm text-slate-500 mt-2">Lädt...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="px-5 py-8 text-center">
              {emptyState ? (
                emptyState
              ) : (
                <p className="text-sm text-slate-500">{emptyMessage}</p>
              )}
            </div>
          ) : (
            <table className="w-full text-left">
              {/* Table Head */}
              <thead className="bg-slate-50 text-slate-500 text-xs font-medium sticky top-0 z-10">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      className={clsx(
                        'px-5 py-3 border-b border-slate-100',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                      style={{ width: column.width }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-50">
                {data.map((row, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onRowClick?.(row, idx)}
                    className={clsx(
                      'transition-colors',
                      hoverable && onRowClick && 'hover:bg-slate-50 cursor-pointer group',
                      striped && idx % 2 === 0 && 'bg-slate-50/50',
                      getRowClassName?.(row, idx)
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={clsx(
                          'px-5 py-3 align-top text-sm text-slate-900',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer (optional) */}
        <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
          {data.length} {data.length === 1 ? 'Eintrag' : 'Einträge'}
        </div>
      </div>
    );
  }
);

DashboardTableCard.displayName = 'DashboardTableCard';

export default DashboardTableCard;
