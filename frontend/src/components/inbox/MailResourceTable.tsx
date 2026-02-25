import { FaEdit, FaFolderOpen, FaTrashAlt } from 'react-icons/fa';

interface MailResourceTableProps {
    title: string;
    items: any[];
    headers: string[];
    renderRow: (item: any) => React.ReactNode;
    onAdd: () => void;
    addLabel?: string;
    onEdit?: (item: any) => void;
    onDelete?: (item: any) => void;
}

const MailResourceTable = ({
    title,
    items,
    headers,
    renderRow,
    onAdd,
    addLabel = 'Neu+',
    onEdit,
    onDelete,
}: MailResourceTableProps) => (
    <div className="bg-white">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] sticky top-0 z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(0,0,0,0.06)]">
            <h2 className="text-xs font-semibold text-slate-700 [text-shadow:0_1px_0_rgba(255,255,255,0.8)]">{title}</h2>
            <button
                onClick={onAdd}
                className="text-xs font-semibold bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white px-3 py-1.5 rounded-[3px] border border-[#123a3c] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_1px_rgba(0,0,0,0.12)] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] hover:from-[#2a7073] hover:to-[#235e62] transition active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]"
            >
                {addLabel}
            </button>
        </div>
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b-2 border-[#c8c8c8] bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8]">
                    {headers.map(h => (
                        <th key={h} className="px-6 py-3 text-xs font-semibold text-slate-500 [text-shadow:0_1px_0_rgba(255,255,255,0.8)] border-r border-[#e0e0e0] last:border-r-0">
                            {h}
                        </th>
                    ))}
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 [text-shadow:0_1px_0_rgba(255,255,255,0.8)] text-right">Aktionen</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeeee]">
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
                        <tr key={item.id} className="hover:bg-[#f0f0f0] transition-colors">
                            {renderRow(item)}
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => onEdit?.(item)}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-[#ccc] rounded-[3px] transition shadow-none hover:shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                                        title="Bearbeiten"
                                    >
                                        <FaEdit size={12} />
                                    </button>
                                    <button
                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-[#ccc] rounded-[3px] transition shadow-none hover:shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                                        title="Details"
                                    >
                                        <FaFolderOpen size={12} />
                                    </button>
                                    <button
                                        onClick={() => onDelete?.(item)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-[3px] transition shadow-none hover:shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                                        title="Entfernen"
                                    >
                                        <FaTrashAlt size={12} />
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
