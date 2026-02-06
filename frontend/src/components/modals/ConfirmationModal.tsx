import React from 'react';
import clsx from 'clsx';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';

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
    if (!isOpen) return null;

    const getIcon = () => {
        switch (variant) {
            case 'danger': return <FaExclamationTriangle className="text-red-500 text-xl" />;
            case 'warning': return <FaExclamationTriangle className="text-amber-500 text-xl" />;
            case 'success': return <FaCheckCircle className="text-emerald-500 text-xl" />;
            case 'info':
            default: return <FaInfoCircle className="text-blue-500 text-xl" />;
        }
    };

    const getButtonColor = () => {
        switch (variant) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'warning': return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
            case 'success': return 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500';
            case 'info':
            default: return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-scaleIn">
                <div className="p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        title="Schließen"
                    >
                        <FaTimes />
                    </button>
                    <div className="flex items-start gap-4">
                        <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            variant === 'danger' ? "bg-red-100" :
                                variant === 'warning' ? "bg-amber-100" :
                                    variant === 'success' ? "bg-emerald-100" : "bg-blue-100"
                        )}>
                            {getIcon()}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                    {cancelText && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white text-slate-700 font-medium text-sm rounded border border-slate-300 hover:bg-slate-50 transition shadow-sm"
                            disabled={isLoading}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={clsx(
                            "px-4 py-2 text-white font-bold text-sm rounded shadow-sm transition flex items-center gap-2",
                            getButtonColor(),
                            isLoading && "opacity-70 cursor-not-allowed"
                        )}
                        disabled={isLoading}
                    >
                        {isLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
