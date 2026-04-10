import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODAL_CLASSES, MODAL_SIZES } from '@/constants/designTokens';

interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    loading?: boolean;
    disabled?: boolean;
  }>;
  size?: keyof typeof MODAL_SIZES;
  hideFooter?: boolean;
  isLoading?: boolean;
  className?: string;
  contentClassName?: string;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  title,
  onClose,
  children,
  actions,
  size = 'lg',
  hideFooter = false,
  isLoading = false,
  className,
  contentClassName,
}) => {
  const getButtonVariantClasses = (variant: string) => {
    const variants: Record<string, string> = {
      primary:
        'bg-[#1B4D4F] text-white hover:bg-[#0f2d2f] disabled:opacity-50 disabled:cursor-not-allowed',
      secondary:
        'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed',
      danger:
        'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed',
    };
    return variants[variant] || variants.secondary;
  };

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center bg-black/50', className)}>
      <div
        className={cn(
          MODAL_CLASSES.base,
          MODAL_SIZES[size],
          'max-h-[90vh] w-full flex flex-col overflow-hidden',
          contentClassName
        )}
      >
        {/* Header */}
        <div className={MODAL_CLASSES.header}>
          <h2 className={MODAL_CLASSES.title}>{title}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(MODAL_CLASSES.closeButton, isLoading && 'opacity-50 cursor-not-allowed')}
            aria-label="Schließen"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={MODAL_CLASSES.body}>{children}</div>

        {/* Footer */}
        {!hideFooter && (
          <div className={MODAL_CLASSES.footer}>
            {actions && actions.length > 0 ? (
              <div className="flex gap-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled || isLoading || action.loading}
                    className={cn(
                      'px-4 py-2 rounded-sm text-sm font-medium transition-colors',
                      getButtonVariantClasses(action.variant || 'secondary'),
                      (action.loading || isLoading) && 'opacity-70'
                    )}
                  >
                    {action.loading && (
                      <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {action.label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={onClose}
                disabled={isLoading}
                className={cn(
                  'px-4 py-2 rounded-sm text-sm font-medium transition-colors',
                  getButtonVariantClasses('secondary')
                )}
              >
                Schließen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalWrapper;
