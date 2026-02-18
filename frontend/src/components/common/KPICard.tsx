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
    iconColor = 'text-brand-700',
    subValue,
    trend,
    progress,
    progressColor = 'bg-brand-500',
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white p-5 rounded-sm border border-slate-200 transition-colors ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
        >
            <div className="flex justify-between items-start mb-2">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <div className={`${iconColor} opacity-50 text-base`}>
                    {icon}
                </div>
            </div>

            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
                {trend && (
                    <span className={`text-[10px] font-black ${trend.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                        {trend.isPositive ? '↑' : '↓'} {trend.value}
                    </span>
                )}
            </div>

            {subValue && (
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">{subValue}</p>
            )}

            {progress !== undefined && (
                <div className="mt-4 w-full bg-slate-100 h-1 overflow-hidden">
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
