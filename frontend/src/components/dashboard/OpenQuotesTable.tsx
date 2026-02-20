import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Quote {
 id: string;
 project_number?: string;
 name: string;
 customer?: {
 name: string;
 };
 created_at: string;
 total_price?: number;
}

interface OpenQuotesTableProps {
 quotes: Quote[];
}

const OpenQuotesTable: React.FC<OpenQuotesTableProps> = ({ quotes }) => {
 const navigate = useNavigate();

 return (
 <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
 <h2 className="text-sm font-medium text-slate-700">
 Neu
 </h2>
 <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
 {quotes.length}
 </span>
 </div>
 <div className="overflow-auto flex-1 custom-scrollbar">
 <table className="w-full text-left">
 <thead className="bg-slate-50 text-slate-500 text-xs font-medium sticky top-0">
 <tr>
 <th className="px-5 py-3 border-b border-slate-100">Neu</th>
 <th className="px-5 py-3 border-b border-slate-100 text-right">Datum</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {quotes.map((quote) => (
 <tr
 key={quote.id}
 onClick={() => navigate(`/projects/${quote.id}`)}
 className="hover:bg-slate-50 transition cursor-pointer group"
 >
 <td className="px-5 py-3">
 <div className="flex flex-col">
 <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition truncate max-w-[180px]">
 {quote.name}
 </span>
 <span className="text-xs text-slate-400 font-medium truncate">
 {quote.customer?.name || 'Unbekannt'}
 </span>
 </div>
 </td>
 <td className="px-5 py-3 text-right">
 <div className="flex flex-col items-end">
 <span className="text-xs font-medium text-slate-600">
 {new Date(quote.created_at).toLocaleDateString('de-DE')}
 </span>
 <span className="text-xs text-slate-400">
 {quote.total_price ? `${quote.total_price.toFixed(2)} €` : '-'}
 </span>
 </div>
 </td>
 </tr>
 ))}
 {quotes.length === 0 && (
 <tr>
 <td colSpan={2} className="px-5 py-8 text-center text-slate-400 italic text-xs">
 Keine neuen Projekte.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
};

export default OpenQuotesTable;
