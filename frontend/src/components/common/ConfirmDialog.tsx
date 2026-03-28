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
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'success' | 'danger';
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    type = 'info',
    confirmLabel = 'Bestätigen',
    cancelLabel = 'Abbrechen',
    onConfirm,
    onCancel
}) => {
    const actionStyles: Record<string, any> = {
        danger: 'destructive',
        warning: 'warning',
        success: 'success',
        info: 'default',
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button
                            variant="secondary"
                            onClick={onCancel}
                            className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition"
                        >
                            {cancelLabel}
                        </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); onConfirm(); }}
                            variant={actionStyles[type]}
                            className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition"
                        >
                            {confirmLabel}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmDialog;
