import { FaEdit, FaFolderOpen, FaTrashAlt } from 'react-icons/fa';

interface MailResourceTableProps {
    title: string;
    items: any[];
    headers: string[];
    renderRow: (item: any) => React.ReactNode;
    onAdd: () => void;
    onEdit?: (item: any) => void;
    onDelete?: (item: any) => void;
}

const MailResourceTable = ({
    title,
    items,
    headers,
    renderRow,
    onAdd,
    onEdit,
    onDelete,
}: MailResourceTableProps) => (
    <div className="bg-white">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="text-xs font-semibold text-slate-800">{title}</h2>
            <button
                onClick={onAdd}
                className="text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 transition hover:bg-slate-900"
            >
                Neu+
            </button>
        </div>
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-slate-200 bg-slate-50/30">
                    {headers.map(h => (
                        <th key={h} className="px-6 py-4 text-xs font-semibold text-slate-400">
                            {h}
                        </th>
                    ))}
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 text-right">Aktionen</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                    <tr>
                        <td
                            colSpan={headers.length + 1}
                            className="px-6 py-10 text-center text-xs text-slate-400 font-medium"
                        >
                            Keine Daten vorhanden
                        </td>
                    </tr>
                ) : (
                    items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                            {renderRow(item)}
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onEdit?.(item)}
                                        className="p-2 text-slate-300 hover:text-slate-700 transition"
                                        title="Bearbeiten"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="p-2 text-slate-300 hover:text-slate-800 transition"
                                        title="Details"
                                    >
                                        <FaFolderOpen />
                                    </button>
                                    <button
                                        onClick={() => onDelete?.(item)}
                                        className="p-2 text-slate-300 hover:text-red-500 transition"
                                        title="Entfernen"
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

export default MailResourceTable;
