import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export type ConfirmModalVariant = 'danger' | 'warning' | 'default';

export interface ConfirmModalProps {
    /** Whether the dialog is visible */
    open?: boolean;
    /** Alias for open — legacy callers use isOpen */
    isOpen?: boolean;
    /** Called when the dialog should close (Cancel button, Escape, outside click) */
    onClose?: () => void;
    /** Alias for onClose — ConfirmDialog callers use onCancel */
    onCancel?: () => void;
    onConfirm: () => void;
    title: string;
    /** The body text of the dialog */
    description?: string;
    /** Alias for description — legacy callers use message */
    message?: string;
    /** Label for the confirm button */
    confirmText?: string;
    /** Alias for confirmText — some callers use confirmLabel */
    confirmLabel?: string;
    /** Label for the cancel button */
    cancelText?: string;
    /** Alias for cancelText — some callers use cancelLabel */
    cancelLabel?: string;
    /**
     * Visual variant controlling confirm-button color.
     * Also accepts legacy "type" values: 'info' maps to 'default', 'success' maps to 'default'.
     */
    variant?: ConfirmModalVariant | 'info' | 'success';
    /** Alias for variant — modals/ConfirmModal callers use type */
    type?: 'danger' | 'warning' | 'info' | 'success';
    /** Shows a spinner on the confirm button and disables both buttons */
    isLoading?: boolean;
    /**
     * Set to true to hide the cancel button entirely (useful for alert-style dialogs
     * that only need an "OK" confirm button).
     */
    hideCancelButton?: boolean;
    /** Optional content rendered between description and footer */
    children?: React.ReactNode;
}

const buttonVariantMap: Record<string, 'destructive' | 'warning' | 'default'> = {
    danger: 'destructive',
    warning: 'warning',
    default: 'default',
    info: 'default',
    success: 'default',
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    isOpen,
    onClose,
    onCancel,
    onConfirm,
    title,
    description,
    message,
    confirmText,
    confirmLabel,
    cancelText,
    cancelLabel,
    variant,
    type,
    isLoading = false,
    hideCancelButton = false,
    children,
}) => {
    const { t } = useTranslation();

    // Resolve aliased props — canonical name wins, legacy alias is fallback
    const isVisible = open ?? isOpen ?? false;
    const handleClose = onClose ?? onCancel ?? (() => {});
    const bodyText = description ?? message ?? '';
    const resolvedConfirmText = confirmText ?? confirmLabel ?? t('actions.confirm', 'Bestätigen');
    const resolvedCancelText = cancelText ?? cancelLabel ?? t('actions.cancel', 'Abbrechen');

    // Resolve variant: canonical variant > legacy type > default
    const rawVariant = variant ?? type ?? 'default';
    const buttonVar = buttonVariantMap[rawVariant] ?? 'default';

    return (
        <AlertDialog open={isVisible} onOpenChange={(open) => !open && handleClose()}>
            <AlertDialogContent
                // Allow pointer-down outside to close (do NOT block it)
                // Allow Escape to close (do NOT call e.preventDefault() here)
            >
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {bodyText && (
                        <AlertDialogDescription>{bodyText}</AlertDialogDescription>
                    )}
                </AlertDialogHeader>

                {children && (
                    <div className="px-6 pb-2">
                        {children}
                    </div>
                )}

                <AlertDialogFooter>
                    {/* Cancel button — receives initial focus (safer for destructive dialogs) */}
                    {!hideCancelButton && <AlertDialogCancel asChild>
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition"
                        >
                            {resolvedCancelText}
                        </Button>
                    </AlertDialogCancel>}

                    <AlertDialogAction asChild>
                        <Button
                            variant={buttonVar}
                            onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                onConfirm();
                            }}
                            disabled={isLoading}
                            className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Wird verarbeitet...
                                </>
                            ) : (
                                resolvedConfirmText
                            )}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmModal;
