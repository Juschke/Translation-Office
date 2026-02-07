import { FaTimes, FaExclamationTriangle, FaTrashAlt, FaCheckCircle } from 'react-icons/fa';
import clsx from 'clsx';

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
    confirmText = 'Bestätigen',
    cancelText = 'Abbrechen',
    type = 'danger',
    isLoading = false
}: ConfirmModalProps) => {
    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            icon: <FaTrashAlt className="text-2xl" />,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            buttonBg: 'bg-red-600 hover:bg-red-700',
            borderColor: 'border-red-200'
        },
        warning: {
            icon: <FaExclamationTriangle className="text-2xl" />,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            buttonBg: 'bg-orange-600 hover:bg-orange-700',
            borderColor: 'border-orange-200'
        },
        info: {
            icon: <FaCheckCircle className="text-2xl" />,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            buttonBg: 'bg-blue-600 hover:bg-blue-700',
            borderColor: 'border-blue-200'
        }
    };

    const style = typeStyles[type];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp">
                {/* Header */}
                <div className={clsx("px-6 py-4 border-b flex justify-between items-center", style.borderColor)}>
                    <div className="flex items-center gap-3">
                        <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center", style.iconBg, style.iconColor)}>
                            {style.icon}
                        </div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 disabled:opacity-50"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2 text-xs font-black uppercase text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-30"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={clsx(
                            "px-6 py-2 text-white rounded text-xs font-black uppercase tracking-widest transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2",
                            style.buttonBg
                        )}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Wird verarbeitet...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
