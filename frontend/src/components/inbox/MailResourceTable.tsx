import React from 'react';
import { FaPlus, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Button } from '../ui/button';

interface MailResourceTableProps {
    title: string;
    items: any[];
    headers: string[];
    addLabel: string;
    onAdd: () => void;
    onEdit: (item: any) => void;
    onDelete: (item: any) => void;
    renderRow: (item: any) => React.ReactNode;
    renderSubRow?: (item: any) => React.ReactNode;
}

const MailResourceTable: React.FC<MailResourceTableProps> = ({
    title,
    items,
    headers,
    addLabel,
    onAdd,
    onEdit,
    onDelete,
    renderRow,
    renderSubRow
}) => {
    // Simplify title (remove "E-Mail " prefix if present)
    const displayTitle = title.replace(/^E-Mail\s+/, '');

    return (
        <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-20 shrink-0">
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-[0.15em]">{displayTitle}</h3>
                <Button
                    onClick={onAdd}
                    className="h-8 px-4 text-[10px] font-bold rounded-[3px] border border-[#123a3c] bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white shadow-md hover:from-[#2a7073] hover:to-[#235e62] transition flex items-center gap-2 uppercase tracking-wider"
                >
                    <FaPlus size={9} /> {addLabel}
                </Button>
            </div>

            {/* Table Area - No side spacing/padding on container */}
            <div className="flex-1 overflow-auto custom-scrollbar-minimal">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200">
                            {headers.map((header, idx) => (
                                <th
                                    key={idx}
                                    className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                >
                                    {header}
                                </th>
                            ))}
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">
                                Aktionen
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={headers.length + 1} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-40">
                                        <div className="text-3xl">📭</div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Keine Einträge vorhanden</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            items.map((item, idx) => (
                                <React.Fragment key={item.id || idx}>
                                    <tr className="hover:bg-slate-50/50 transition-colors group">
                                        {renderRow(item)}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onEdit(item)}
                                                    className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all shadow-sm"
                                                    title="Bearbeiten"
                                                >
                                                    <FaEdit size={12} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(item)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all shadow-sm"
                                                    title="Löschen"
                                                >
                                                    <FaTrashAlt size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {renderSubRow && (
                                        <tr className="bg-slate-50/20">
                                            <td colSpan={headers.length + 1} className="px-6 pb-4 pt-0">
                                                {renderSubRow(item)}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MailResourceTable;
