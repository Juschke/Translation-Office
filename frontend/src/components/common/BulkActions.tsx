import type { ReactNode } from 'react';
import { FaTimes } from 'react-icons/fa';
import clsx from 'clsx';

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
 <button
 onClick={onClearSelection}
 className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-white/60 rounded-[3px]"
 title="Auswahl aufheben"
 >
 <FaTimes />
 </button>
 </div>
 );
};

const BulkActionButton = ({ label, icon, onClick, variant = 'default' }: BulkActionItem) => {
 const variants: Record<BulkActionVariant, string> = {
 default:     'bg-gradient-to-b from-white to-[#ebebeb] text-[#444] border-[#ccc] hover:border-[#adadad] hover:text-[#1B4D4F]',
 primary:     'bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white border-[#123a3c] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] hover:from-[#2a7073] hover:to-[#235e62]',
 danger:      'bg-gradient-to-b from-white to-[#ebebeb] text-red-600 border-[#ccc] hover:border-red-300',
 dangerSolid: 'bg-gradient-to-b from-[#e05050] to-[#c9302c] text-white border-[#9c2320] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] hover:from-[#e85555]',
 success:     'bg-gradient-to-b from-[#62bb62] to-[#449d44] text-white border-[#398439] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] hover:from-[#6ec86e]',
 warning:     'bg-gradient-to-b from-[#f5b85a] to-[#ec971f] text-white border-[#d58512] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] hover:from-[#f7c168]',
 };

 return (
 <button
 onClick={onClick}
 className={clsx(
  'px-2.5 py-1 rounded-[3px] text-xs font-semibold transition flex items-center gap-1.5 border',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_1px_rgba(0,0,0,0.09)]',
  'active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)]',
  variants[variant]
 )}
 >
 {icon} {label}
 </button>
 );
};
