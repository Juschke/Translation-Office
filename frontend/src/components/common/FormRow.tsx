import React from 'react';
import clsx from 'clsx';

interface FormRowProps {
  /**
   * Field label
   */
  label?: string;

  /**
   * Field description/helper text
   */
  description?: string;

  /**
   * Field content/input
   */
  children: React.ReactNode;

  /**
   * Gap between label and content
   */
  gap?: 'xs' | 'sm' | 'md' | 'lg';

  /**
   * Label column width
   */
  labelWidth?: 'sm' | 'md' | 'lg';

  /**
   * Whether field is required
   */
  required?: boolean;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Layout variant
   */
  variant?: 'horizontal' | 'vertical' | 'compact';

  /**
   * Align items vertically
   */
  alignCenter?: boolean;

  /**
   * Show error state
   */
  error?: boolean;

  /**
   * Error message
   */
  errorMessage?: string;
}

/**
 * Standardisierte Formular-Zeile für konsistente Layouts
 * Unterstützt verschiedene Varianten: horizontal (2-spaltig), vertikal (1-spaltig), compact
 */
const FormRow: React.FC<FormRowProps> = ({
  label,
  description,
  children,
  gap = 'md',
  labelWidth = 'md',
  required = false,
  className,
  variant = 'horizontal',
  alignCenter = false,
  error = false,
  errorMessage,
}) => {
  const gapMap: Record<string, string> = {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const labelWidthMap: Record<string, string> = {
    sm: 'col-span-12 md:col-span-2',
    md: 'col-span-12 md:col-span-3',
    lg: 'col-span-12 md:col-span-4',
  };

  const contentWidthMap: Record<string, string> = {
    sm: 'col-span-12 md:col-span-10',
    md: 'col-span-12 md:col-span-9',
    lg: 'col-span-12 md:col-span-8',
  };

  // Vertical layout
  if (variant === 'vertical') {
    return (
      <div className={clsx('flex flex-col', gapMap[gap], className)}>
        {label && (
          <div className="flex items-start gap-1">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            {required && <span className="text-red-500">*</span>}
          </div>
        )}
        {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
        <div className={error ? 'border border-red-400 rounded-sm p-2 bg-red-50' : undefined}>{children}</div>
        {error && errorMessage && <p className="text-xs text-red-500 mt-1">{errorMessage}</p>}
      </div>
    );
  }

  // Compact layout (single row, minimal spacing)
  if (variant === 'compact') {
    return (
      <div
        className={clsx(
          'grid grid-cols-12 gap-3 py-3 items-start',
          alignCenter && 'items-center',
          className
        )}
      >
        {label && (
          <div className="col-span-12 md:col-span-3">
            <label className="text-xs font-medium text-slate-600">
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {description && <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{description}</p>}
          </div>
        )}
        <div className={clsx(label ? 'col-span-12 md:col-span-9' : 'col-span-12')}>
          <div className={error ? 'border border-red-400 rounded-sm p-1' : undefined}>{children}</div>
          {error && errorMessage && <p className="text-[11px] text-red-500 mt-1">{errorMessage}</p>}
        </div>
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div
      className={clsx(
        'grid grid-cols-12',
        gapMap[gap],
        'py-4 items-start',
        alignCenter && 'items-center',
        className
      )}
    >
      {label && (
        <div className={clsx(labelWidthMap[labelWidth], 'space-y-1')}>
          <label className="text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
        </div>
      )}
      <div className={clsx(label ? contentWidthMap[labelWidth] : 'col-span-12')}>
        <div className={error ? 'border border-red-400 rounded-sm p-2 bg-red-50' : undefined}>{children}</div>
        {error && errorMessage && <p className="text-xs text-red-500 mt-1">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default FormRow;
