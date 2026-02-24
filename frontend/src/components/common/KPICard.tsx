import React, { type ReactNode } from 'react';

interface KPICardProps {
    label: string;
    value: string | number;
    icon: ReactNode;
    iconColor?: string;
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
    subValue,
    trend,
    progress,
    progressColor = 'bg-brand-900',
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white border border-slate-200 rounded-sm shadow-sm p-4 sm:p-5 transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md' : ''} h-full flex flex-col justify-between`}
        >
            <div>
                <div className="flex justify-between items-start mb-4 sm:mb-5 gap-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                    <div className={`${iconColor} text-lg shrink-0 mt-0.5`}>
                        {icon}
                    </div>
                </div>

                <div className="flex items-baseline gap-2 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{value}</h3>
                    {trend && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${trend.isPositive ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-700 bg-red-50 border-red-100'}`}>
                            {trend.isPositive ? '↑' : '↓'} {trend.value}
                        </span>
                    )}
                </div>

                {subValue && (
                    <p className="text-[11px] text-slate-400 mt-1 font-medium leading-tight">{subValue}</p>
                )}
            </div>

            {progress !== undefined && (
                <div className="mt-4 w-full bg-slate-100 h-1.5 overflow-hidden rounded-full">
                    <div
                        className={`${progressColor} h-full transition-all duration-1000`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default KPICard;
