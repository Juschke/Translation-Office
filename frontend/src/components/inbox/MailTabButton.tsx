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
                    'w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-all',
                    active
                        ? 'bg-gradient-to-b from-[#f0f7f7] to-[#e4efef] text-[#1B4D4F] font-semibold border-r-[3px] border-[#1B4D4F] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]'
                        : 'text-slate-500 hover:bg-[#f5f5f5] hover:text-slate-700 font-medium',
                )}
            >
                <span className={clsx('text-sm', active ? 'text-[#1B4D4F]' : 'text-slate-400')}>{icon}</span>
                <span className="hidden md:inline">{label}</span>
            </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="md:hidden">
            {label}
        </TooltipContent>
    </Tooltip>
);

export default MailTabButton;
