import clsx from 'clsx';
import { Button } from '../ui/button';
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
            <Button
                onClick={onClick}
                variant={active ? 'outline' : 'ghost'}
                size="sm"
                className={clsx(
                    'h-9 gap-2 rounded-md px-4 text-xs font-medium',
                    active
                        ? 'border-brand-primary/20 bg-[linear-gradient(180deg,#f0f7f7_0%,#e4efef_100%)] font-semibold text-brand-primary'
                        : 'text-slate-500 hover:text-slate-700',
                )}
            >
                <span className={clsx('text-sm', active ? 'text-brand-primary' : 'text-slate-400')}>{icon}</span>
                <span>{label}</span>
                {count !== undefined && (
                    <span className={clsx(
                        'px-1.5 py-0.5 rounded-sm text-xs font-semibold min-w-[20px] text-center',
                        active ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-600'
                    )}>
                        {count}
                    </span>
                )}
            </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
            {label}
        </TooltipContent>
    </Tooltip>
);

export default StatusTabButton;
