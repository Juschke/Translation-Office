import React from 'react';
import { FaCheck } from 'react-icons/fa';

interface CheckboxProps {
    checked: boolean;
    onChange: () => void;
    className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, className = '' }) => {
    return (
        <div
            onClick={(e) => { e.stopPropagation(); onChange(); }}
            className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all shadow-sm ${checked
                    ? 'bg-brand-700 border-brand-700 text-white'
                    : 'bg-white border-slate-300 hover:border-brand-500'
                } ${className}`}
        >
            {checked && <FaCheck size={10} />}
        </div>
    );
};

export default Checkbox;
