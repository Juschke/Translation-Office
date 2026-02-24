import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface MailTabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const MailTabButton = ({ active, onClick, icon, label }: MailTabButtonProps) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                onClick={onClick}
                className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-xs transition-all border-r-2',
                    active
                        ? 'bg-brand-50 text-brand-900 font-bold border-brand-600'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium border-transparent',
                )}
            >
                <span className={cn('text-base shrink-0', active ? 'text-brand-700' : 'text-slate-400')}>{icon}</span>
                <span className="hidden md:inline">{label}</span>
            </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="md:hidden">
            {label}
        </TooltipContent>
    </Tooltip>
);

export default MailTabButton;
