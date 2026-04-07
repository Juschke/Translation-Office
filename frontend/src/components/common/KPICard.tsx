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
    iconColor = 'text-brand-primary',
    iconBg = 'bg-brand-primary/10',
    subValue,
    trend,
    progress,
    progressColor = 'bg-slate-900',
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
        >
            <div className="flex justify-between items-center gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
                    <div className="flex items-baseline gap-2 min-w-0 mt-0.5">
                        <h3 className="text-lg font-semibold text-slate-900 tracking-tight truncate">{value}</h3>
                        {trend && (
                            <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                                {trend.isPositive ? '↑' : '↓'} {trend.value}
                            </span>
                        )}
                    </div>
                    {subValue && <p className="text-[11px] text-slate-400 mt-0.5">{subValue}</p>}
                </div>
                <div className={`${iconColor} ${iconBg} text-sm shrink-0 w-8 h-8 rounded-full flex items-center justify-center`}>
                    {icon}
                </div>
            </div>

            {progress !== undefined && (
                <div className="mt-2 w-full bg-slate-100 h-1 overflow-hidden rounded-full">
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
