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
 "mb-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-sm flex justify-between items-center animate-fadeIn shadow-sm z-10 relative",
 className
 )}>
 <div className="flex items-center gap-4">
 <span className="text-slate-600 text-xs font-semibold shrink-0">
 {selectedCount} ausgewählt
 </span>
 <div className="h-4 w-px bg-slate-300"></div>
 <div className="flex items-center gap-2 flex-wrap">
 {visibleActions.map((action, index) => (
 <BulkActionButton key={index} {...action} />
 ))}
 </div>
 </div>
 <button
 onClick={onClearSelection}
 className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-200 rounded"
 title="Auswahl aufheben"
 >
 <FaTimes />
 </button>
 </div>
 );
};

const BulkActionButton = ({ label, icon, onClick, variant = 'default' }: BulkActionItem) => {
 const baseStyles = "px-3 py-1.5 rounded-sm text-xs font-semibold transition flex items-center gap-2 shadow-sm border";

 // Define variant styles
 // Note: We use border-transparent for solid buttons to maintain size consistency if others have borders
 const variants: Record<BulkActionVariant, string> = {
 default: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800",
 primary: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-200",
 danger: "bg-white border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200",
 dangerSolid: "bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 shadow-sm",
 success: "bg-white border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200",
 warning: "bg-white border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
 };

 return (
 <button
 onClick={onClick}
 className={clsx(baseStyles, variants[variant])}
 >
 {icon} {label}
 </button>
 );
};
