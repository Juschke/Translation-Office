// DEPRECATED: Use @/components/ui/alert-dialog instead
// This file exists for backward compatibility only
import React from 'react';
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
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    confirmText?: string;
    cancelLabel?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
    children?: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    confirmText,
    cancelLabel,
    cancelText,
    variant,
    type,
    isLoading = false,
    children
}) => {
    const activeConfirmLabel = confirmText || confirmLabel || 'Bestätigen';
    const activeCancelLabel = cancelText || cancelLabel || 'Abbrechen';
    const activeVariant = type || variant || 'info';

    const variantStyles = {
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white',
        info: 'bg-brand-primary hover:bg-brand-primary/90 text-white',
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                    {children}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose} disabled={isLoading}>
                        {activeCancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className={cn(variantStyles[activeVariant])}
                    >
                        {isLoading ? 'Verarbeitet...' : activeConfirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmModal;
