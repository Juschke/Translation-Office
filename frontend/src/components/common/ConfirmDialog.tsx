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
 const actionStyles = {
 danger: 'bg-red-600 hover:bg-red-700 text-white',
 warning: 'bg-amber-600 hover:bg-amber-700 text-white',
 success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
 info: 'bg-slate-900 hover:bg-slate-900 text-white',
 };

 return (
 <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>{title}</AlertDialogTitle>
 <AlertDialogDescription>{message}</AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel onClick={onCancel}>{cancelLabel}</AlertDialogCancel>
 <AlertDialogAction
 onClick={onConfirm}
 className={cn(actionStyles[type])}
 >
 {confirmLabel}
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 );
};

export default ConfirmDialog;
