import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import clsx from 'clsx';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Löschen',
    cancelLabel = 'Abbrechen',
    variant = 'danger',
    isLoading = false
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: 'bg-red-600 hover:bg-red-700 shadow-red-500/20',
        warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
        info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
    };

    const iconStyles = {
        danger: 'text-red-600 bg-red-50',
        warning: 'text-amber-500 bg-amber-50',
        info: 'text-blue-600 bg-blue-50'
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-[110] flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeInUp overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center shrink-0", iconStyles[variant])}>
                            <FaExclamationTriangle className="text-xl" />
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                            <FaTimes />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-slate-600 text-xs font-bold uppercase tracking-widest hover:text-slate-800 transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={clsx(
                            "px-6 py-2 rounded text-white text-xs font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg disabled:opacity-50",
                            variantStyles[variant]
                        )}
                    >
                        {isLoading ? 'Verarbeitet...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
