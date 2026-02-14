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

export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationVariant;
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Bestätigen',
    cancelText = 'Abbrechen',
    variant = 'danger',
    isLoading = false
}) => {
    const variantStyles: Record<string, string> = {
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        warning: 'bg-amber-600 hover:bg-amber-700 text-white',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        info: 'bg-blue-600 hover:bg-blue-700 text-white',
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {cancelText && (
                        <AlertDialogCancel onClick={onClose} disabled={isLoading}>
                            {cancelText}
                        </AlertDialogCancel>
                    )}
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(variantStyles[variant])}
                    >
                        {isLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmationModal;
