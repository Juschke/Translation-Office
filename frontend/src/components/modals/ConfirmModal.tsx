// DEPRECATED: Use @/components/ui/alert-dialog instead
// This file exists for backward compatibility only
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

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    type = 'danger',
    isLoading = false
}: ConfirmModalProps) => {
    const { t } = useTranslation();
    const displayConfirmText = confirmText || t('actions.confirm');
    const displayCancelText = cancelText || t('actions.cancel');
    const variantStyles: Record<string, any> = {
        danger: 'destructive',
        warning: 'warning',
        info: 'default',
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition"
                        >
                            {displayCancelText}
                        </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); onConfirm(); }}
                            disabled={isLoading}
                            variant={variantStyles[type]}
                            className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Wird verarbeitet...
                                </>
                            ) : (
                                displayConfirmText
                            )}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmModal;
