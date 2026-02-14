import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import type { ConfirmationVariant } from '../components/modals/ConfirmationModal';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationVariant;
    onConfirm: () => Promise<void> | void;
    onCancel?: () => void;
}

interface AlertOptions {
    title?: string;
    message: string;
    confirmText?: string;
    variant?: ConfirmationVariant;
    onClose?: () => void;
}

interface ConfirmationContextType {
    confirm: (options: ConfirmOptions) => void;
    alert: (options: AlertOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useState<ConfirmOptions | null>(null);

    // Differentiate between generic confirmation (which has cancel) and alert (which might not)
    const [_isAlert, setIsAlert] = useState(false);

    const confirm = useCallback((options: ConfirmOptions) => {
        setConfig(options);
        setIsAlert(false);
        setIsOpen(true);
    }, []);

    const alert = useCallback((options: AlertOptions) => {
        setConfig({
            title: options.title,
            message: options.message,
            confirmText: options.confirmText || 'OK',
            cancelText: undefined, // No cancel button for alerts
            variant: options.variant || 'info',
            onConfirm: async () => {
                if (options.onClose) options.onClose();
            },
            onCancel: () => {
                if (options.onClose) options.onClose();
            }
        });
        setIsAlert(true);
        setIsOpen(true);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        if (config?.onCancel) config.onCancel();
        // Reset after animation
        setTimeout(() => {
            setConfig(null);
            setIsLoading(false);
        }, 300);
    };

    const handleConfirm = async () => {
        if (!config) return;

        try {
            setIsLoading(true);
            await config.onConfirm();
            setIsOpen(false);
        } catch (error) {
            console.error("Confirmation action failed", error);
        } finally {
            setIsLoading(false);
            // Reset after animation
            setTimeout(() => {
                setConfig(null);
            }, 300);
        }
    };

    // Defaults
    const defaultConfig = {
        title: 'Bestätigung erforderlich',
        message: 'Sind Sie sicher?',
        confirmText: 'Bestätigen',
        cancelText: 'Abbrechen',
        variant: 'danger' as ConfirmationVariant
    };

    const activeConfig = config || defaultConfig;

    return (
        <ConfirmationContext.Provider value={{ confirm, alert }}>
            {children}
            {config && (
                <ConfirmationModal
                    isOpen={isOpen}
                    onClose={handleClose}
                    onConfirm={handleConfirm}
                    title={activeConfig.title || defaultConfig.title}
                    message={activeConfig.message}
                    confirmText={activeConfig.confirmText || defaultConfig.confirmText}
                    cancelText={activeConfig.cancelText} // If undefined, modal won't show it
                    variant={activeConfig.variant || defaultConfig.variant}
                    isLoading={isLoading}
                />
            )}
        </ConfirmationContext.Provider>
    );
};

export const useConfirmation = () => {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirmation must be used within a ConfirmationProvider');
    }
    return context;
};
