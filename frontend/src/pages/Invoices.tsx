import { useState, useMemo } from 'react';
import {
    FaPlus, FaCheckCircle, FaHistory,
    FaFileExcel, FaFileCsv, FaTrash,
    FaCheck, FaPaperPlane, FaPrint, FaTimes, FaDownload, FaFilePdf, FaFileInvoiceDollar, FaEye, FaTrashRestore
} from 'react-icons/fa';
import Checkbox from '../components/common/Checkbox';
import DataTable from '../components/common/DataTable';
import KPICard from '../components/common/KPICard';
import InvoicePreviewModal from '../components/modals/InvoicePreviewModal';

const Invoices = () => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [previewInvoice, setPreviewInvoice] = useState<any>(null);

    // Mock Data
    const [invoices, setInvoices] = useState([
        { id: 1, nr: 'RE-2024-001', date: '2024-03-01', client: 'TechCorp GmbH', project: 'P-2024-1001', amount: 535.50, due: '2024-03-15', status: 'paid' },
        { id: 2, nr: 'RE-2024-002', date: '2024-03-05', client: 'Kanzlei Recht', project: 'P-2024-1002', amount: 143.40, due: '2024-03-19', status: 'overdue' },
        { id: 3, nr: 'RE-2024-003', date: '2024-03-10', client: 'Creative Agency', project: 'P-2024-1003', amount: 890.00, due: '2024-03-24', status: 'pending' },
        { id: 4, nr: 'RE-2024-004', date: '2024-02-28', client: 'Startup XY', project: 'P-2024-1004', amount: 1250.00, due: '2024-03-14', status: 'paid' },
    ]);

    const handleDeleteInvoice = (id: number) => {
        if (confirm('Möchten Sie diese Rechnung wirklich löschen?')) {
            setInvoices(prev => prev.filter(inv => inv.id !== id));
        }
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            if (statusFilter === 'trash') return inv.status === 'deleted';
            if (inv.status === 'deleted') return false;
            if (statusFilter === 'all') return true;
            return inv.status === statusFilter;
        });
    }, [invoices, statusFilter]);

    const toggleSelection = (id: number) => {
        setSelectedInvoices(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedInvoices.length === filteredInvoices.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(filteredInvoices.map(p => p.id));
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            'paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'overdue': 'bg-red-50 text-red-700 border-red-200',
            'pending': 'bg-amber-50 text-amber-700 border-amber-200',
            'deleted': 'bg-slate-50 text-slate-500 border-slate-200'
        };
        const labels: { [key: string]: string } = {
            'paid': 'Bezahlt', 'overdue': 'Überfällig', 'pending': 'Offen', 'deleted': 'Gelöscht'
        };
        return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border tracking-tight ${styles[status]}`}>{labels[status]}</span>;
    }

    const columns = [
        {
            header: (
                <Checkbox
                    checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={toggleSelectAll}
                />
            ),
            accessor: (p: any) => (
                <Checkbox
                    checked={selectedInvoices.includes(p.id)}
                    onChange={() => toggleSelection(p.id)}
                />
            ),
            className: 'w-10'
        },
        {
            header: 'Rechnung #',
            accessor: (inv: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{inv.nr}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(inv.date).toLocaleDateString('de-DE')}
                    </span>
                </div>
            ),
            sortable: true,
            sortKey: 'nr'
        },
        {
            header: 'Empfänger',
            accessor: 'client' as any,
            sortable: true
        },
        {
            header: 'Projekt',
            accessor: (inv: any) => (
                <span className="text-xs font-medium text-slate-500">{inv.project}</span>
            ),
            sortable: true,
            sortKey: 'project'
        },
        {
            header: 'Fälligkeit',
            accessor: (inv: any) => (
                <div className="flex flex-col">
                    <span className="text-slate-600 font-medium">{new Date(inv.due).toLocaleDateString('de-DE')}</span>
                    {inv.status === 'overdue' && (
                        <span className="text-[9px] font-black text-red-500 uppercase">Seit {(Math.ceil((new Date().getTime() - new Date(inv.due).getTime()) / (1000 * 3600 * 24)))} Tagen</span>
                    )}
                </div>
            ),
            sortable: true,
            sortKey: 'due'
        },
        {
            header: 'Betrag (Brutto)',
            accessor: (inv: any) => (
                <span className="font-bold text-slate-800">{inv.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
            ),
            sortable: true,
            sortKey: 'amount',
            align: 'right' as const
        },
        {
            header: 'Status',
            accessor: (inv: any) => getStatusBadge(inv.status),
            sortable: true,
            sortKey: 'status',
            align: 'center' as const
        },
        {
            header: '',
            accessor: (inv: any) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setPreviewInvoice(inv)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition" title="Details"><FaEye /></button>
                    <button onClick={() => setPreviewInvoice(inv)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition" title="PDF Laden"><FaDownload /></button>
                    <button onClick={() => handleDeleteInvoice(inv.id)} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition" title="Löschen"><FaTrash /></button>
                </div>
            ),
            align: 'right' as const
        }
    ];

    const tabs = (
        <div className="flex items-center gap-6">
            <button
                onClick={() => setStatusFilter('all')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${statusFilter === 'all' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Alle Rechnungen
            </button>
            <button
                onClick={() => setStatusFilter('pending')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${statusFilter === 'pending' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Offen
            </button>
            <button
                onClick={() => setStatusFilter('overdue')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${statusFilter === 'overdue' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Überfällig
            </button>
            <button
                onClick={() => setStatusFilter('trash')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${statusFilter === 'trash' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Papierkorb
            </button>
        </div>
    );

    const actions = (
        <div className="relative group z-50">
            <button
                onClick={(e) => { e.stopPropagation(); setIsExportOpen(!isExportOpen); }}
                className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest bg-white flex items-center gap-2 shadow-sm transition"
            >
                <FaDownload /> Export
            </button>
            {isExportOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-[100] overflow-hidden animate-fadeIn">
                    <button className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition">
                        <FaFileExcel className="text-emerald-600 text-sm" /> Excel (.xlsx)
                    </button>
                    <button className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition">
                        <FaFileCsv className="text-blue-600 text-sm" /> CSV DATEV
                    </button>
                    <button className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 border-t border-slate-50 transition">
                        <FaFilePdf className="text-red-600 text-sm" /> PDF Sammel-Report
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full gap-6 fade-in" onClick={() => setIsExportOpen(false)}>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Rechnungs- & Finanzverwaltung</h1>
                    <p className="text-slate-500 text-sm">Zentralverwaltung aller Rechnungsbelege und DATEV-Exporte.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95">
                        <FaPlus className="text-xs" /> Neue Rechnung
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    label="Offener Betrag"
                    value="12.450,00 €"
                    icon={<FaFileInvoiceDollar />}
                    subValue="3 Rechnungen überfällig"
                />
                <KPICard
                    label="Bezahlt (Dieser Monat)"
                    value="8.200,50 €"
                    icon={<FaCheckCircle />}
                    iconColor="text-green-600"
                    iconBg="bg-green-50"
                    subValue="15 Transaktionen abgeschlossen"
                />
                <KPICard
                    label="Fremdkosten (Partner)"
                    value="4.100,00 €"
                    icon={<FaHistory />}
                    subValue="In Erwartung von Gutschriften"
                />
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative z-0">
                {selectedInvoices.length > 0 && (
                    <div className="mb-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg flex justify-between items-center animate-fadeIn shadow-sm z-10 relative">
                        <div className="flex items-center gap-4">
                            <span className="text-slate-600 text-xs font-bold uppercase tracking-widest shrink-0">
                                {selectedInvoices.length} ausgewählt
                            </span>
                            <div className="h-4 w-px bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaCheck className="text-xs" /> Als Bezahlt markieren
                                </button>
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaPaperPlane className="text-xs" /> Rechnung senden
                                </button>
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaPrint className="text-xs" /> Drucken
                                </button>
                                {statusFilter === 'trash' ? (
                                    <button
                                        onClick={() => {
                                            setInvoices(prev => prev.map(inv => selectedInvoices.includes(inv.id) ? { ...inv, status: 'pending' } : inv));
                                            setSelectedInvoices([]);
                                        }}
                                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2"
                                    >
                                        <FaTrashRestore className="text-xs" /> Wiederherstellen
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setInvoices(prev => prev.map(inv => selectedInvoices.includes(inv.id) ? { ...inv, status: 'deleted' } : inv));
                                            setSelectedInvoices([]);
                                        }}
                                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2"
                                    >
                                        <FaTrash className="text-xs" /> Löschen
                                    </button>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setSelectedInvoices([])} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-200 rounded"><FaTimes /></button>
                    </div>
                )}
                <DataTable
                    data={filteredInvoices}
                    columns={columns as any}
                    pageSize={10}
                    searchPlaceholder="Suchen nach Nr., Kunde oder Projekt..."
                    searchFields={['nr', 'client', 'project']}
                    actions={actions}
                    tabs={tabs}
                />
            </div>

            <InvoicePreviewModal
                isOpen={!!previewInvoice}
                onClose={() => setPreviewInvoice(null)}
                invoice={previewInvoice}
            />
        </div>
    );
};

export default Invoices;
