import React from 'react';
import clsx from 'clsx';
import { Button } from '../ui/button';
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
            <Button
                onClick={onClick}
                variant="ghost"
                className={clsx(
                    'h-auto w-full justify-start gap-3 rounded-none px-4 py-2.5 text-xs transition-all border-l-2 outline-none ring-0 focus-visible:ring-0',
                    active
                        ? 'bg-brand-primary/5 text-brand-primary border-brand-primary font-bold shadow-none hover:bg-brand-primary/10 hover:text-brand-primary'
                        : 'text-slate-600 hover:bg-slate-50 border-transparent shadow-none',
                )}
            >
                <span className={clsx('text-base transition-colors', active ? 'text-brand-primary' : 'text-slate-400')}>{icon}</span>
                <span className="hidden md:inline">{label}</span>
            </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="md:hidden">
            {label}
        </TooltipContent>
    </Tooltip>
);

export default MailTabButton;
