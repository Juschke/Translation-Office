import React from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';

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
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'warning': return <FaExclamationTriangle className="text-slate-400" size={24} />;
            case 'danger': return <FaExclamationTriangle className="text-slate-400" size={24} />;
            case 'success': return <FaCheckCircle className="text-slate-400" size={24} />;
            default: return <FaInfoCircle className="text-slate-400" size={24} />;
        }
    };

    const getButtonStyles = () => {
        switch (type) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 shadow-red-100';
            case 'warning': return 'bg-amber-600 hover:bg-amber-700 shadow-amber-100';
            default: return 'bg-teal-600 hover:bg-teal-700 shadow-teal-100';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeInShort">
            <div className="bg-white rounded shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0 pt-1">
                            {getIcon()}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">{title}</h3>
                            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-slate-500 text-xs font-black uppercase tracking-widest hover:text-slate-800"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2 text-white text-xs font-black uppercase tracking-widest rounded shadow-lg ${getButtonStyles()}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
