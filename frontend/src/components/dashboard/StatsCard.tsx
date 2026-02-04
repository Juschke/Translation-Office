import React from 'react';

interface StatsCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
    subText?: React.ReactNode;
    onClick?: () => void;
    progress?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, colorClass, subText, onClick, progress }) => {
    return (
        <div
            className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-brand-300 transition ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-2 rounded ${colorClass}`}>
                    {icon}
                </div>
            </div>
            {progress !== undefined && (
                <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            )}
            {subText && (
                <div className="mt-3 text-xs">
                    {subText}
                </div>
            )}
        </div>
    );
};

export default StatsCard;
