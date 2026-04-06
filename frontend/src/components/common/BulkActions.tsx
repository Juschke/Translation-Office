import type { ReactNode } from 'react';
import { FaTimes } from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from '../ui/button';

export type BulkActionVariant = 'default' | 'primary' | 'danger' | 'dangerSolid' | 'success' | 'warning';

export interface BulkActionItem {
 label: string;
 icon: ReactNode;
 onClick: () => void;
 variant?: BulkActionVariant;
 show?: boolean; // Convenience to conditionally hide actions
}

interface BulkActionsProps {
 selectedCount: number;
 onClearSelection: () => void;
 actions: BulkActionItem[];
 className?: string; // Allow custom styling for the container if needed
}

export const BulkActions = ({ selectedCount, onClearSelection, actions, className }: BulkActionsProps) => {
 if (selectedCount === 0) return null;

 const visibleActions = actions.filter(a => a.show !== false);

 return (
 <div className={clsx(
 "px-4 py-2 bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] border border-[#d0d0d0] border-b-2 border-b-[#c0c0c0] flex justify-between items-center animate-fadeIn z-10 relative shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
 className
 )}>
 <div className="flex items-center gap-3">
 <span className="text-slate-600 text-xs font-semibold shrink-0">
 {selectedCount} ausgewählt
 </span>
 <div className="h-4 w-px bg-slate-300"></div>
 <div className="flex items-center gap-1.5 flex-wrap">
 {visibleActions.map((action, index) => (
 <BulkActionButton key={index} {...action} />
 ))}
 </div>
 </div>
 <Button
 onClick={onClearSelection}
 variant="ghost"
 size="icon"
 className="h-8 w-8 text-slate-400 hover:bg-white/60 hover:text-slate-600"
 title="Auswahl aufheben"
 >
 <FaTimes />
 </Button>
 </div>
 );
};

const BulkActionButton = ({ label, icon, onClick, variant = 'default' }: BulkActionItem) => {
 const variants: Record<BulkActionVariant, { variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning'; className?: string }> = {
 default: { variant: 'secondary' },
 primary: { variant: 'default' },
 danger: { variant: 'secondary', className: 'text-red-600 hover:text-red-700' },
 dangerSolid: { variant: 'destructive' },
 success: { variant: 'success' },
 warning: { variant: 'warning' },
 };
 const config = variants[variant];

 return (
 <Button
 onClick={onClick}
 variant={config.variant}
 size="sm"
 className={clsx('h-8 gap-1.5 px-2.5 text-xs font-semibold', config.className)}
 >
 {icon} {label}
 </Button>
 );
};
