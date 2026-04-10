import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

interface ConfirmDialogProps {
  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog description/message
   */
  description?: string;

  /**
   * Dialog variant/type
   */
  variant?: 'info' | 'warning' | 'danger' | 'success';

  /**
   * Callback when user confirms
   */
  onConfirm: () => void;

  /**
   * Callback when user cancels
   */
  onCancel: () => void;

  /**
   * Custom confirm button label
   */
  confirmLabel?: string;

  /**
   * Custom cancel button label
   */
  cancelLabel?: string;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Show cancel button
   */
  showCancel?: boolean;

  /**
   * Make confirm button danger variant
   */
  isDangerous?: boolean;

  /**
   * Additional className
   */
  className?: string;
}

/**
 * Standardisierte Confirm/Alert Dialog Komponente
 * Ersetzt 4 Duplikate: ConfirmDialog, ConfirmModal, ConfirmationModal, ConfirmModal (modals)
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  description,
  variant = 'info',
  onConfirm,
  onCancel,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  isLoading = false,
  showCancel = true,
  isDangerous = false,
  className,
}) => {
  const getIcon = () => {
    const iconProps = { size: 24, className: 'mx-auto mb-3' };
    switch (variant) {
      case 'danger':
        return <AlertCircle {...iconProps} className="text-red-500 mx-auto mb-3" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="text-amber-500 mx-auto mb-3" />;
      case 'success':
        return <CheckCircle {...iconProps} className="text-green-500 mx-auto mb-3" />;
      default:
        return <Info {...iconProps} className="text-blue-500 mx-auto mb-3" />;
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getButtonVariant = () => {
    if (isDangerous) return 'danger';
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  const getConfirmButtonClasses = () => {
    const baseClasses =
      'px-4 py-2 rounded-sm text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    const variantMap: Record<string, string> = {
      primary: 'bg-[#1B4D4F] text-white hover:bg-[#0f2d2f]',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      warning: 'bg-amber-600 text-white hover:bg-amber-700',
      success: 'bg-green-600 text-white hover:bg-green-700',
    };

    return clsx(baseClasses, variantMap[getButtonVariant()]);
  };

  return (
    <div className={clsx('fixed inset-0 z-50 flex items-center justify-center bg-black/50', className)}>
      <div className={clsx('bg-white rounded-sm border shadow-2xl max-w-sm w-full mx-4 overflow-hidden')}>
        {/* Header with colored background */}
        <div className={clsx('px-6 py-4 border-b', getVariantClasses())}>
          <div className="flex flex-col items-center text-center">
            {getIcon()}
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 bg-white">
          {description && <p className="text-sm text-slate-600 leading-relaxed text-center">{description}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          {showCancel && (
            <button
              onClick={onCancel}
              disabled={isLoading}
              className={clsx(
                'px-4 py-2 rounded-sm text-sm font-medium transition-colors',
                'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(getConfirmButtonClasses(), 'flex items-center gap-2')}
          >
            {isLoading && (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isLoading ? 'Verarbeitet...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export { ConfirmDialog };
