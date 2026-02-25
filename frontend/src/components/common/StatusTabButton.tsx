import clsx from 'clsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface StatusTabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    count?: number;
}

const StatusTabButton = ({ active, onClick, icon, label, count }: StatusTabButtonProps) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                onClick={onClick}
                className={clsx(
                    'flex items-center gap-2 px-4 py-2 text-xs transition-all rounded-sm font-medium',
                    active
                        ? 'bg-gradient-to-b from-[#f0f7f7] to-[#e4efef] text-[#1B4D4F] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] border border-[#1B4D4F]/20'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent',
                )}
            >
                <span className={clsx('text-sm', active ? 'text-[#1B4D4F]' : 'text-slate-400')}>{icon}</span>
                <span>{label}</span>
                {count !== undefined && (
                    <span className={clsx(
                        'px-1.5 py-0.5 rounded text-[10px] font-semibold min-w-[20px] text-center',
                        active ? 'bg-[#1B4D4F] text-white' : 'bg-slate-200 text-slate-600'
                    )}>
                        {count}
                    </span>
                )}
            </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
            {label}
        </TooltipContent>
    </Tooltip>
);

export default StatusTabButton;
