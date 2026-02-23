import { FaCalendarAlt, FaInfoCircle, FaPlus, FaTrash } from 'react-icons/fa';

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
                <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-medium">06</div>
                <h4 className="text-xs font-medium text-slate-800">Teilzahlungen / Anzahlungen</h4>
            </div>
            <button
                onClick={onAddPayment}
                className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 transition-all shadow-sm"
            >
                <FaPlus /> Zahlung erfassen
            </button>
        </div>

        {payments.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-2 text-center border-2 border-dashed border-slate-50 rounded">
                Keine Zahlungen erfasst.
            </div>
        ) : (
            <div className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
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
                                    <button
                                        onClick={() => onEditPayment(p)}
                                        className="text-slate-300 hover:text-slate-700 transition p-1 hover:bg-slate-50 rounded"
                                    >
                                        <FaInfoCircle className="text-xs" />
                                    </button>
                                    <button
                                        onClick={() => onDeletePayment(p.id)}
                                        className="text-slate-300 hover:text-red-700 transition p-1 hover:bg-red-50 rounded"
                                    >
                                        <FaTrash className="text-xs" />
                                    </button>
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
