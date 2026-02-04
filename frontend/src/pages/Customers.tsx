import { useState, useMemo } from 'react';
import {
    FaUsers, FaPlus, FaEye, FaEdit, FaTrash, FaBriefcase, FaChartLine,
    FaCheck, FaBan, FaEnvelope, FaTimes, FaDownload, FaFileExcel, FaFileCsv, FaFilePdf, FaTrashRestore
} from 'react-icons/fa';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import Checkbox from '../components/common/Checkbox';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';

const Customers = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);

    // Mock Data
    const [customers, setCustomers] = useState([
        { id: 1, company: 'TechCorp GmbH', contact: 'Max Mustermann', email: 'm.mustermann@techcorp.com', sales: 12450.00, status: 'Aktiv', initials: 'TC', color: 'bg-blue-50 text-blue-600 border-blue-100', type: 'Firma' },
        { id: 2, company: 'Kanzlei Schmidt', contact: 'Dr. Julia Schmidt', email: 'info@kanzlei-recht.de', sales: 3120.50, status: 'Aktiv', initials: 'KS', color: 'bg-green-50 text-green-600 border-green-100', type: 'Firma' },
        { id: 3, company: 'Creative Agency', contact: 'Tom Weber', email: 'weber@creative.agency', sales: 8900.00, status: 'Inaktiv', initials: 'CA', color: 'bg-orange-50 text-orange-600 border-orange-100', type: 'Firma' },
        { id: 4, company: 'Max Mustermann', contact: 'Max Mustermann', email: 'max.mustermann@web.de', sales: 450.00, status: 'Aktiv', initials: 'MM', color: 'bg-purple-50 text-purple-600 border-purple-100', type: 'Privat' },
        { id: 5, company: 'Stadtverwaltung München', contact: 'Amt für Soziales', email: 'soziales@muenchen.de', sales: 15200.00, status: 'Aktiv', initials: 'SM', color: 'bg-slate-50 text-slate-600 border-slate-100', type: 'Behörde' }
    ]);

    const totalSalesNum = customers.reduce((acc, curr) => acc + curr.sales, 0);
    const totalSales = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalSalesNum);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            if (typeFilter === 'trash') return c.status === 'Gelöscht';
            if (c.status === 'Gelöscht') return false;
            if (typeFilter === 'all') return true;
            return c.type === typeFilter;
        });
    }, [customers, typeFilter]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
    };

    const toggleSelection = (id: number) => {
        setSelectedCustomers(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedCustomers.length === filteredCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(filteredCustomers.map(c => c.id));
        }
    };

    const columns = [
        {
            header: (
                <Checkbox
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={toggleSelectAll}
                />
            ),
            accessor: (c: any) => (
                <Checkbox
                    checked={selectedCustomers.includes(c.id)}
                    onChange={() => toggleSelection(c.id)}
                />
            ),
            className: 'w-10'
        },
        {
            header: 'Unternehmen',
            accessor: (c: any) => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded shrink-0 ${c.color} flex items-center justify-center text-[10px] font-bold border`}>{c.initials}</div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 truncate">{c.company}</span>
                        <div className="flex gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">ID: {c.id.toString().padStart(4, '0')}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-500 font-medium">{c.type}</span>
                        </div>
                    </div>
                </div>
            ),
            sortable: true,
            sortKey: 'company'
        },
        {
            header: 'Ansprechpartner',
            accessor: (c: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-700">{c.contact}</span>
                    <span className="text-xs text-slate-500">{c.email}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'contact'
        },
        {
            header: 'Umsatz (YTD)',
            accessor: (c: any) => <span className="font-semibold text-slate-800">{formatCurrency(c.sales)}</span>,
            sortable: true,
            sortKey: 'sales',
            align: 'right' as const
        },
        {
            header: 'Status',
            accessor: (c: any) => {
                const statusStyles: { [key: string]: string } = {
                    'Aktiv': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    'Inaktiv': 'bg-slate-50 text-slate-400 border-slate-200',
                    'Gelöscht': 'bg-red-50 text-red-700 border-red-200'
                };
                return (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border tracking-tight ${statusStyles[c.status] || 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        {c.status}
                    </span>
                );
            },
            sortable: true,
            sortKey: 'status',
            align: 'center' as const
        },
        {
            header: '',
            accessor: (c: any) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition" title="Details"><FaEye /></button>
                    <button onClick={() => { setEditingCustomer(c); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition" title="Bearbeiten"><FaEdit /></button>
                    <button className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition" title="Löschen"><FaTrash /></button>
                </div>
            ),
            align: 'right' as const
        }
    ];

    const tabs = (
        <div className="flex items-center gap-6">
            <button
                onClick={() => setTypeFilter('all')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'all' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Alle Kunden
            </button>
            <button
                onClick={() => setTypeFilter('Firma')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'Firma' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Firmen
            </button>
            <button
                onClick={() => setTypeFilter('Privat')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'Privat' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Privat
            </button>
            <button
                onClick={() => setTypeFilter('Behörde')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'Behörde' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Behörden
            </button>
            <button
                onClick={() => setTypeFilter('trash')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'trash' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
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
                        <FaFileCsv className="text-blue-600 text-sm" /> CSV (.csv)
                    </button>
                    <button className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 border-t border-slate-50 transition">
                        <FaFilePdf className="text-red-600 text-sm" /> PDF Report
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col gap-6 h-full fade-in" onClick={() => { setIsExportOpen(false); }}>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Kundenstamm</h1>
                    <p className="text-slate-500 text-sm">Zentralverwaltung aller Auftraggeber und Rechnungsadressen.</p>
                </div>
                <button
                    onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
                    className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95"
                >
                    <FaPlus className="text-xs" /> Neuer Kunde
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard label="Gesamtkunden" value={customers.length} icon={<FaUsers />} />
                <KPICard label="Top Auftraggeber" value="TechCorp" icon={<FaBriefcase />} iconColor="text-blue-600" iconBg="bg-blue-50" subValue="Höchster Umsatz YTD" />
                <KPICard label="Umsatz YTD" value={totalSales} icon={<FaChartLine />} iconColor="text-green-600" iconBg="bg-green-50" trend={{ value: '+18%', label: 'vs. Vorjahr', isPositive: true }} />
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative z-0">
                {selectedCustomers.length > 0 && (
                    <div className="mb-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg flex justify-between items-center animate-fadeIn shadow-sm z-10 relative">
                        <div className="flex items-center gap-4">
                            <span className="text-slate-600 text-xs font-bold uppercase tracking-widest shrink-0">
                                {selectedCustomers.length} ausgewählt
                            </span>
                            <div className="h-4 w-px bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaCheck className="text-xs" /> Aktivieren
                                </button>
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaEnvelope className="text-xs" /> E-Mail senden
                                </button>
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaBan className="text-xs" /> Deaktivieren
                                </button>
                                {typeFilter === 'trash' ? (
                                    <button
                                        onClick={() => {
                                            setCustomers(prev => prev.map(c => selectedCustomers.includes(c.id) ? { ...c, status: 'Aktiv' } : c));
                                            setSelectedCustomers([]);
                                        }}
                                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2"
                                    >
                                        <FaTrashRestore className="text-xs" /> Wiederherstellen
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setCustomers(prev => prev.map(c => selectedCustomers.includes(c.id) ? { ...c, status: 'Gelöscht' } : c));
                                            setSelectedCustomers([]);
                                        }}
                                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2"
                                    >
                                        <FaTrash className="text-xs" /> Löschen
                                    </button>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setSelectedCustomers([])} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-200 rounded"><FaTimes /></button>
                    </div>
                )}

                <DataTable
                    data={filteredCustomers}
                    columns={columns as any}
                    pageSize={10}
                    searchPlaceholder="Kunden nach Name, Kontakt oder E-Mail suchen..."
                    searchFields={['company', 'contact', 'email']}
                    actions={actions}
                    tabs={tabs}
                />
            </div>

            <NewCustomerModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }}
                onSubmit={(data) => {
                    if (editingCustomer) {
                        setCustomers(prev => prev.map(c => c.id === data.id ? data : c));
                    } else {
                        setCustomers(prev => [...prev, { ...data, id: prev.length + 1 } as any]);
                    }
                }}
                initialData={editingCustomer}
            />
        </div>
    );
};

export default Customers;
