import { FaCalendarAlt, FaInfoCircle, FaPlus, FaTrash } from 'react-icons/fa';
import { Button } from '../ui/button';

interface ProjectPaymentsTableProps {
    payments: any[];
    onAddPayment: () => void;
    onEditPayment: (payment: any) => void;
    onDeletePayment: (id: string) => void;
}

const ProjectPaymentsTable = ({ payments, onAddPayment, onEditPayment, onDeletePayment }: ProjectPaymentsTableProps) => (
    <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-white border border-slate-200 text-emerald-700 flex items-center justify-center text-xs font-medium shadow-sm">06</div>
                <h4 className="text-xs font-medium text-slate-800">Teilzahlungen / Anzahlungen</h4>
            </div>
            <Button
                variant="success"
                size="sm"
                onClick={onAddPayment}
            >
                <FaPlus /> Zahlung erfassen
            </Button>
        </div>

        {payments.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-2 text-center border-2 border-dashed border-slate-50 rounded">
                Keine Zahlungen erfasst.
            </div>
        ) : (
            <div className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-slate-200">
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 w-44">Datum & Uhrzeit</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 w-32 text-right">Betrag (Brutto)</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 w-40">Zahlmittel</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 italic">Anmerkung</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 w-20 text-center">Aktion</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payments.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-4 py-2 text-sm font-medium text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-slate-400 text-xs" />
                                        {new Date(p.payment_date).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-emerald-600 text-right">
                                    {parseFloat(p.amount).toFixed(2)} €
                                </td>
                                <td className="px-4 py-2 text-xs font-medium text-slate-600">
                                    {p.payment_method}
                                </td>
                                <td className="px-4 py-2 text-xs italic text-slate-400">
                                    {p.note || '-'}
                                </td>
                                <td className="px-4 py-2 text-center flex justify-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEditPayment(p)}
                                        className="h-7 w-7 text-slate-400 hover:text-slate-700"
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
