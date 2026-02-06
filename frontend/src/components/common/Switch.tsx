import React from 'react';
import clsx from 'clsx';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    size?: 'sm' | 'md';
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, size = 'sm' }) => {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={clsx(
                "relative inline-flex flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
                checked ? "bg-brand-600" : "bg-slate-200",
                size === 'sm' ? "h-4 w-7" : "h-6 w-11"
            )}
        >
            <span
                className={clsx(
                    "pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    checked ? (size === 'sm' ? "translate-x-3" : "translate-x-5") : "translate-x-0",
                    size === 'sm' ? "h-3 w-3 mt-0.5 ml-0.5" : "h-5 w-5 mt-0.5 ml-0.5"
                )}
            />
        </button>
    );
};

export default Switch;
