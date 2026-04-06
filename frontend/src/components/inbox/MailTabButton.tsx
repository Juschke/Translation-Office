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
                variant={active ? 'outline' : 'ghost'}
                className={clsx(
                    'h-auto w-full justify-start gap-3 rounded-none px-4 py-2 text-xs',
                    active
                        ? 'border-r-[3px] border-brand-primary bg-[linear-gradient(180deg,#f0f7f7_0%,#e4efef_100%)] text-brand-primary font-semibold shadow-none'
                        : 'font-medium text-slate-500 hover:bg-[#f5f5f5] hover:text-slate-700 shadow-none',
                )}
            >
                <span className={clsx('text-sm', active ? 'text-brand-primary' : 'text-slate-400')}>{icon}</span>
                <span className="hidden md:inline">{label}</span>
            </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="md:hidden">
            {label}
        </TooltipContent>
    </Tooltip>
);

export default MailTabButton;
