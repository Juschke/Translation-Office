import clsx from 'clsx';
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
                className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 text-xs transition-all',
                    active
                        ? 'bg-slate-100 text-slate-800 font-semibold border-r-4 border-slate-900'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 font-medium',
                )}
            >
                <span className={clsx('text-base', active ? 'text-slate-700' : '')}>{icon}</span>
                <span className="hidden md:inline">{label}</span>
            </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="md:hidden">
            {label}
        </TooltipContent>
    </Tooltip>
);

export default MailTabButton;
