import React, { type ReactNode } from 'react';

interface KPICardProps {
    label: string;
    value: string | number;
    icon: ReactNode;
    iconColor?: string;
    iconBg?: string;
    subValue?: string;
    trend?: {
        label: string;
        value: string;
        isPositive: boolean;
    };
    progress?: number;
    progressColor?: string;
    onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
    label,
    value,
    icon,
    iconColor = 'text-brand-700',
    iconBg = 'bg-brand-50',
    subValue,
    trend,
    progress,
    progressColor = 'bg-brand-500',
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-brand-300 transition group ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1 truncate">{value}</h3>
                </div>
                <div className={`p-2 ${iconBg} rounded ${iconColor} flex items-center justify-center text-lg shrink-0 ml-2 group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
            </div>

            {subValue && (
                <p className="text-xs text-slate-400 mt-3">{subValue}</p>
            )}

            {trend && !subValue && (
                <p className={`text-xs mt-3 flex items-center gap-1 font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.value} <span className="text-slate-400 font-normal">{trend.label}</span>
                </p>
            )}

            {progress !== undefined && (
                <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                        className={`${progressColor} h-1.5 rounded-full transition-all duration-1000`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default KPICard;
