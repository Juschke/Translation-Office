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
    iconColor = 'text-slate-400',
    iconBg = 'bg-transparent',
    subValue,
    trend,
    progress,
    progressColor = 'bg-slate-900',
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white p-4 sm:p-5 rounded-sm border border-slate-200 transition-colors ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
        >
            <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
                <p className="text-xs sm:text-sm font-medium text-slate-500 line-clamp-2">{label}</p>
                <div className={`${iconColor} ${iconBg} text-sm sm:text-base shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center`}>
                    {icon}
                </div>
            </div>

            <div className="flex items-baseline gap-2 min-w-0">
                <h3 className="text-lg sm:text-2xl font-semibold text-slate-900 tracking-tight truncate">{value}</h3>
                {trend && (
                    <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                        {trend.isPositive ? '↑' : '↓'} {trend.value}
                    </span>
                )}
            </div>

            {subValue && (
                <p className="text-xs text-slate-500 mt-1">{subValue}</p>
            )}

            {progress !== undefined && (
                <div className="mt-4 w-full bg-slate-100 h-1 overflow-hidden rounded-full">
                    <div
                        className={`${progressColor} h-full transition-all duration-1000 rounded-full`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default KPICard;
