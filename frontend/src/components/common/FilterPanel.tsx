import React, { useState } from 'react';
import { FaFilter, FaTimes } from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from './Button';

interface FilterPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    activeCount?: number;
    onReset?: () => void;
    className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
    isOpen,
    onToggle,
    children,
    activeCount = 0,
    onReset,
    className
}) => {
    return (
        <div className={clsx("w-full mb-4 flex flex-col gap-2", className)}>
            <div className="flex items-center gap-2">
                <Button
                    variant={isOpen ? "primary" : "secondary"}
                    onClick={onToggle}
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <FaFilter className="text-xs" />
                    <span>Filter</span>
                    {activeCount > 0 && (
                        <span className="bg-brand-primary text-white text-[10px] px-1.5 rounded-full ml-1 font-bold">{activeCount}</span>
                    )}
                </Button>
                {activeCount > 0 && onReset && (
                    <Button variant="ghost" size="sm" onClick={onReset} className="text-slate-500 hover:text-slate-800">
                        <FaTimes className="text-xs mr-1" /> Zurücksetzen
                    </Button>
                )}
            </div>

            <div className={clsx(
                "transition-all duration-300 ease-in-out overflow-hidden bg-white border border-slate-200 rounded-sm shadow-sm",
                isOpen ? "max-h-[1000px] opacity-100 p-4 border" : "max-h-0 opacity-0 border-0 p-0"
            )}>
                {children}
            </div>
        </div>
    );
};

export default FilterPanel;
