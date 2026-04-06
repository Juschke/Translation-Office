import { FaInfoCircle, FaTrash, FaEuroSign, FaPlus } from 'react-icons/fa';
import { Button } from '../ui/button';
import clsx from 'clsx';

interface ProjectPaymentsTableProps {
    payments: any[];
    onAddPayment?: () => void;
    onEditPayment: (payment: any) => void;
    onDeletePayment: (id: string) => void;
    hideHeader?: boolean;
    disabledAdd?: boolean;
}

const ProjectPaymentsTable = ({ payments, onAddPayment, onEditPayment, onDeletePayment, hideHeader = false, disabledAdd = false }: ProjectPaymentsTableProps) => (
    <div className="space-y-4">
        {!hideHeader && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <FaEuroSign className="text-brand-primary text-sm" />
                    <h4 className="text-sm font-medium text-slate-800">Anzahlungen / Teilzahlungen</h4>
                    <span className="bg-brand-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        {payments.length}
                    </span>
                </div>
                {onAddPayment && (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onAddPayment}
                        disabled={disabledAdd}
                        className={clsx(
                            "h-7 px-3 text-[10px] uppercase font-bold tracking-tight shadow-none flex items-center gap-1.5",
                            disabledAdd && "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        )}
                    >
                        <FaPlus className="text-[10px]" /> {disabledAdd ? 'Vollständig bezahlt' : 'Zahlung erfassen'}
                    </Button>
                )}
            </div>
        )}

        {payments.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-2 text-center border-2 border-dashed border-slate-50 rounded-sm">
                Keine Zahlungen erfasst.
            </div>
        ) : (
            <div className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-slate-200">
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 w-12 text-center">#</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Datum & Uhrzeit</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 w-32 text-right">Betrag (Brutto)</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 w-40">Zahlmittel</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 w-48">Mitarbeiter</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 w-20 text-center">Aktion</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payments.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-4 py-2 text-[10px] font-bold text-slate-400 text-center">
                                    {p.payment_number || (idx + 1).toString().padStart(3, '0')}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-slate-700 whitespace-nowrap">
                                    {new Date(p.payment_date).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-emerald-600 text-right tabular-nums">
                                    {parseFloat(p.amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                </td>
                                <td className="px-4 py-2 text-xs font-medium text-slate-600">
                                    {p.payment_method}
                                </td>
                                <td className="px-4 py-2 text-xs font-medium text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 shrink-0">
                                            {(p.created_by || '??').substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="truncate">{p.created_by || 'System'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <div className="flex justify-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEditPayment(p)}
                                            className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                        >
                                            <FaInfoCircle className="text-xs" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDeletePayment(p.id)}
                                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <FaTrash className="text-xs" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

export default ProjectPaymentsTable;
