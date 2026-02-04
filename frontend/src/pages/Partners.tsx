import { useState, useMemo } from 'react';
import {
    FaUserTie, FaPlus, FaEye, FaEdit, FaTrash, FaGlobe, FaStar, FaHandshake,
    FaCheck, FaBan, FaEnvelope, FaArchive, FaTimes, FaDownload, FaFileExcel, FaFileCsv, FaFilePdf, FaTrashRestore
} from 'react-icons/fa';
import Checkbox from '../components/common/Checkbox';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';

const Partners = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedPartners, setSelectedPartners] = useState<number[]>([]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<any>(null);

    // Mock Data
    const [partners, setPartners] = useState([
        { id: 1, name: 'Sonia Müller', email: 's.mueller@translation.de', languages: 'DE, EN, FR', rating: 4.8, status: 'Aktiv', initials: 'SM', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', category: 'Recht, Wirtschaft', type: 'Übersetzer' },
        { id: 2, name: 'Global Translators Ltd.', email: 'projects@global-translators.com', languages: 'EN, ES, ZH', rating: 4.5, status: 'Aktiv', initials: 'GT', color: 'bg-amber-50 text-amber-600 border-amber-100', category: 'Technik, IT', type: 'Agentur' },
        { id: 3, name: 'Jean Dupont', email: 'j.dupont@freelance.fr', languages: 'FR, DE', rating: 4.9, status: 'Ausgelastet', initials: 'JD', color: 'bg-rose-50 text-rose-600 border-rose-100', category: 'Medizin, Pharma', type: 'Dolmetscher' },
        { id: 4, name: 'Maria Garcia', email: 'm.garcia@languages.es', languages: 'ES, DE, EN', rating: 4.7, status: 'Aktiv', initials: 'MG', color: 'bg-purple-50 text-purple-600 border-purple-100', category: 'Allgemein', type: 'Beides' }
    ]);

    const filteredPartners = useMemo(() => {
        return partners.filter(p => {
            if (typeFilter === 'trash') return p.status === 'Gelöscht';
            if (p.status === 'Gelöscht') return false;
            if (typeFilter === 'all') return true;
            return p.type === typeFilter;
        });
    }, [partners, typeFilter]);

    const toggleSelection = (id: number) => {
        setSelectedPartners(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedPartners.length === filteredPartners.length) {
            setSelectedPartners([]);
        } else {
            setSelectedPartners(filteredPartners.map(p => p.id));
        }
    };

    const columns = [
        {
            header: (
                <Checkbox
                    checked={selectedPartners.length === filteredPartners.length && filteredPartners.length > 0}
                    onChange={toggleSelectAll}
                />
            ),
            accessor: (p: any) => (
                <Checkbox
                    checked={selectedPartners.includes(p.id)}
                    onChange={() => toggleSelection(p.id)}
                />
            ),
            className: 'w-10'
        },
        {
            header: 'Partner / Dienstleister',
            accessor: (p: any) => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded shrink-0 ${p.color} flex items-center justify-center text-[10px] font-bold border`}>{p.initials}</div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 truncate">{p.name}</span>
                        <div className="flex gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">{p.email}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-500 font-medium">{p.type}</span>
                        </div>
                    </div>
                </div>
            ),
            sortable: true,
            sortKey: 'name'
        },
        {
            header: 'Sprachpaare / Fokus',
            accessor: (p: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-700 text-xs">{p.languages}</span>
                    <span className="text-[10px] text-slate-400">{p.category}</span>
                </div>
            ),
        },
        {
            header: 'Bewertung',
            accessor: (p: any) => (
                <div className="flex items-center gap-1.5">
                    <FaStar className="text-amber-400 text-xs" />
                    <span className="font-semibold text-slate-800 text-xs">{p.rating}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'rating',
            align: 'center' as const
        },
        {
            header: 'Status',
            accessor: (p: any) => {
                const colors: { [key: string]: string } = {
                    'Aktiv': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    'Ausgelastet': 'bg-amber-50 text-amber-700 border-amber-200',
                    'Inaktiv': 'bg-slate-50 text-slate-400 border-slate-200',
                    'Gelöscht': 'bg-red-50 text-red-700 border-red-200'
                };
                return (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border tracking-tight ${colors[p.status] || 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        {p.status}
                    </span>
                );
            },
            sortable: true,
            sortKey: 'status',
            align: 'center' as const
        },
        {
            header: '',
            accessor: (p: any) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition" title="Profil"><FaEye /></button>
                    <button onClick={() => { setEditingPartner(p); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition" title="Bearbeiten"><FaEdit /></button>
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
                Alle Partner
            </button>
            <button
                onClick={() => setTypeFilter('Übersetzer')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'Übersetzer' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Übersetzer
            </button>
            <button
                onClick={() => setTypeFilter('Dolmetscher')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'Dolmetscher' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Dolmetscher
            </button>
            <button
                onClick={() => setTypeFilter('Beides')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'Beides' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Beides
            </button>
            <button
                onClick={() => setTypeFilter('Agentur')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'Agentur' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Agentur
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
                    <h1 className="text-2xl font-bold text-slate-800">Partner & Übersetzer</h1>
                    <p className="text-slate-500 text-sm">Verwaltung Ihres globalen Netzwerks an Fachübersetzern.</p>
                </div>
                <button
                    onClick={() => { setEditingPartner(null); setIsModalOpen(true); }}
                    className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95"
                >
                    <FaPlus className="text-xs" /> Neuer Partner
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard label="Gesamtpartner" value={partners.length} icon={<FaUserTie />} />
                <KPICard label="Sprachabdeckung" value="24" icon={<FaGlobe />} iconColor="text-blue-600" iconBg="bg-blue-50" subValue="Unikate Sprachpaare" />
                <KPICard label="Aktive Kooperationen" value="8" icon={<FaHandshake />} iconColor="text-green-600" iconBg="bg-green-50" subValue="Projekte diesen Monat" />
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative z-0">
                {selectedPartners.length > 0 && (
                    <div className="mb-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg flex justify-between items-center animate-fadeIn shadow-sm z-10 relative">
                        <div className="flex items-center gap-4">
                            <span className="text-slate-600 text-xs font-bold uppercase tracking-widest shrink-0">
                                {selectedPartners.length} ausgewählt
                            </span>
                            <div className="h-4 w-px bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaCheck className="text-xs" /> Genehmigen
                                </button>
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaEnvelope className="text-xs" /> Email senden
                                </button>
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaBan className="text-xs" /> Sperren
                                </button>
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaArchive className="text-xs" /> Archivieren
                                </button>
                                {typeFilter === 'trash' ? (
                                    <button
                                        onClick={() => {
                                            setPartners(prev => prev.map(p => selectedPartners.includes(p.id) ? { ...p, status: 'Aktiv' } : p));
                                            setSelectedPartners([]);
                                        }}
                                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2"
                                    >
                                        <FaTrashRestore className="text-xs" /> Wiederherstellen
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setPartners(prev => prev.map(p => selectedPartners.includes(p.id) ? { ...p, status: 'Gelöscht' } : p));
                                            setSelectedPartners([]);
                                        }}
                                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2"
                                    >
                                        <FaTrash className="text-xs" /> Löschen
                                    </button>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setSelectedPartners([])} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-200 rounded"><FaTimes /></button>
                    </div>
                )}

                <DataTable
                    data={filteredPartners}
                    columns={columns as any}
                    pageSize={10}
                    searchPlaceholder="Partner nach Name, Sprachen oder Fachbereich suchen..."
                    searchFields={['name', 'languages', 'category']}
                    actions={actions}
                    tabs={tabs}
                />
            </div>

            <NewPartnerModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingPartner(null); }}
                onSubmit={(data) => {
                    if (editingPartner) {
                        setPartners(prev => prev.map(p => p.id === data.id ? data : p));
                    } else {
                        setPartners(prev => [...prev, { ...data, id: prev.length + 1 } as any]);
                    }
                }}
                initialData={editingPartner}
            />
        </div>
    );
};

export default Partners;
