import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaPlus, FaArrowRight, FaTimes, FaFileCsv,
    FaFilePdf, FaFileExcel, FaLayerGroup, FaChartLine, FaGlobe,
    FaEdit, FaTrash, FaEye, FaDownload,
    FaCheck, FaUserPlus, FaArchive, FaTrashRestore
} from 'react-icons/fa';
import NewProjectModal from '../components/modals/NewProjectModal';
import Checkbox from '../components/common/Checkbox';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';

const Projects = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);

    // Mock Data
    const [projects, setProjects] = useState([
        { id: 'P-2024-1001', name: 'Bedienungsanleitung TX-700', client: 'TechCorp GmbH', source: 'de', target: 'en', progress: 75, due: '2024-03-15', cost: 450.00, partnerCost: 280.00, status: 'in_progress', vol: '4.500 Wörter' },
        { id: 'P-2024-1002', name: 'Ehevertrag Müller/Smith', client: 'Kanzlei Recht', source: 'en', target: 'de', progress: 100, due: '2024-03-10', cost: 120.50, partnerCost: 0, status: 'review', vol: '1.200 Wörter' },
        { id: 'P-2024-1003', name: 'Marketing Broschüre Q1', client: 'Creative Agency', source: 'de', target: 'fr', progress: 10, due: '2024-03-20', cost: 890.00, partnerCost: 550.00, status: 'draft', vol: '8.900 Wörter' },
        { id: 'P-2024-1004', name: 'Webseiten Lokalisation', client: 'Startup XY', source: 'de', target: 'es', progress: 0, due: '2024-04-01', cost: 2100.00, partnerCost: 1400.00, status: 'pending', vol: '15.000 Wörter' },
        { id: 'P-2024-1005', name: 'Medizinischer Befund', client: 'Klinikum Nord', source: 'fr', target: 'de', progress: 100, due: '2024-03-12', cost: 150.00, partnerCost: 90.00, status: 'completed', vol: '1.500 Wörter' },
        { id: 'P-2024-1006', name: 'Jahresbericht 2023', client: 'Bank AG', source: 'de', target: 'en', progress: 50, due: '2024-03-30', cost: 1200.00, partnerCost: 720.00, status: 'in_progress', vol: '12.000 Wörter' }
    ]);

    const flags: { [key: string]: string } = { 'de': '🇩🇪', 'en': '🇺🇸', 'fr': '🇫🇷', 'es': '🇪🇸' };

    // Derived Stats
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => ['in_progress', 'review'].includes(p.status)).length;
    const totalVolume = projects.reduce((acc, curr) => acc + parseInt(curr.vol.replace('.', '').split(' ')[0]), 0).toLocaleString('de-DE');
    const totalRevenue = projects.reduce((acc, curr) => acc + curr.cost, 0);
    const totalPartnerCosts = projects.reduce((acc, curr) => acc + (curr.partnerCost || 0), 0);
    const avgProfitability = totalRevenue > 0 ? ((totalRevenue - totalPartnerCosts) / totalRevenue) * 100 : 0;

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            if (filter === 'trash') return p.status === 'deleted';
            if (p.status === 'deleted') return false; // Hide deleted from other tabs
            if (filter === 'all') return true;
            if (filter === 'in_progress') return ['in_progress', 'review'].includes(p.status);
            if (filter === 'completed') return p.status === 'completed';
            return true;
        });
    }, [projects, filter]);

    const getStatusBadge = (status: string) => {
        const labels: { [key: string]: string } = {
            'in_progress': 'In Bearbeitung', 'review': 'Lektorat', 'draft': 'Entwurf',
            'pending': 'Angebot', 'completed': 'Abgeschlossen', 'deleted': 'Gelöscht'
        };
        const styles: { [key: string]: string } = {
            'in_progress': 'bg-blue-50 text-blue-700 border-blue-200',
            'review': 'bg-purple-50 text-purple-700 border-purple-200',
            'draft': 'bg-slate-50 text-slate-600 border-slate-200',
            'pending': 'bg-orange-50 text-orange-700 border-orange-200',
            'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'deleted': 'bg-red-50 text-red-700 border-red-200'
        };
        return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border tracking-tight ${styles[status]}`}>{labels[status]}</span>;
    }

    const toggleSelection = (id: string) => {
        setSelectedProjects(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedProjects.length === filteredProjects.length) {
            setSelectedProjects([]);
        } else {
            setSelectedProjects(filteredProjects.map(p => p.id));
        }
    };

    const columns = [
        {
            header: (
                <Checkbox
                    checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                    onChange={toggleSelectAll}
                />
            ),
            accessor: (p: any) => (
                <Checkbox
                    checked={selectedProjects.includes(p.id)}
                    onChange={() => toggleSelection(p.id)}
                />
            ),
            className: 'w-10'
        },
        {
            header: 'Projekt / ID',
            accessor: (p: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{p.name}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.id}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'name'
        },
        {
            header: 'Kunde',
            accessor: 'client' as any,
            sortable: true
        },
        {
            header: 'Sprachpaar',
            accessor: (p: any) => (
                <div className="flex gap-2 items-center">
                    <span title={p.source} className="text-sm">{flags[p.source]}</span>
                    <FaArrowRight className="text-[10px] text-slate-300" />
                    <span title={p.target} className="text-sm">{flags[p.target]}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'source'
        },
        {
            header: 'Fortschritt',
            accessor: (p: any) => (
                <div className="w-24">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5 overflow-hidden">
                        <div className="bg-brand-500 h-1.5 rounded-full transition-all duration-700" style={{ width: `${p.progress}%` }}></div>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 text-right uppercase">{p.progress}%</div>
                </div>
            ),
            sortable: true,
            sortKey: 'progress'
        },
        {
            header: 'Deadline',
            accessor: (p: any) => (
                <span className="text-slate-600 font-medium">
                    {new Date(p.due).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
            ),
            sortable: true,
            sortKey: 'due'
        },
        {
            header: 'Status',
            accessor: (p: any) => getStatusBadge(p.status),
            sortable: true,
            sortKey: 'status'
        },
        {
            header: '',
            accessor: (p: any) => (
                <div className="flex justify-end gap-1 relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/projects/${p.id}`)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition" title="Details"><FaEye /></button>
                    <button onClick={() => { setEditingProject(p); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition" title="Bearbeiten"><FaEdit /></button>
                    <button className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition" title="Löschen"><FaTrash /></button>
                </div>
            ),
            align: 'right' as const
        }
    ];

    const tabs = (
        <div className="flex items-center gap-6">
            <button
                onClick={() => setFilter('all')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'all' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Alle Projekte
            </button>
            <button
                onClick={() => setFilter('in_progress')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'in_progress' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Aktiv
            </button>
            <button
                onClick={() => setFilter('completed')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'completed' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Beendet
            </button>
            <button
                onClick={() => setFilter('trash')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'trash' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
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
                    <h1 className="text-2xl font-bold text-slate-800">Projektübersicht</h1>
                    <p className="text-slate-500 text-sm">Verwalten und überwachen Sie alle Übersetzungsaufträge.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                        className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95"
                    >
                        <FaPlus className="text-xs" /> Neues Projekt
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard label="Gesamtprojekte" value={totalProjects} icon={<FaLayerGroup />} />
                <KPICard label="Aktive Projekte" value={activeProjects} icon={<FaChartLine />} iconColor="text-blue-600" iconBg="bg-blue-50" />
                <KPICard label="Gesamtvolumen" value={totalVolume} subValue="Wörter" icon={<FaGlobe />} />
                <KPICard label="Marge Ø" value={`${avgProfitability.toFixed(1)} %`} icon={<FaChartLine />} iconColor="text-green-600" iconBg="bg-green-50" />
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative z-0">
                {selectedProjects.length > 0 && (
                    <div className="mb-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg flex justify-between items-center animate-fadeIn shadow-sm z-10 relative">
                        <div className="flex items-center gap-4">
                            <span className="text-slate-600 text-xs font-bold uppercase tracking-widest shrink-0">
                                {selectedProjects.length} ausgewählt
                            </span>
                            <div className="h-4 w-px bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaCheck className="text-xs" /> Erledigen
                                </button>
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaUserPlus className="text-xs" /> Zuweisen
                                </button>
                                {filter === 'trash' ? (
                                    <button
                                        onClick={() => {
                                            setProjects(prev => prev.map(p => selectedProjects.includes(p.id) ? { ...p, status: 'in_progress' } : p));
                                            setSelectedProjects([]);
                                        }}
                                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2"
                                    >
                                        <FaTrashRestore className="text-xs" /> Wiederherstellen
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setProjects(prev => prev.map(p => selectedProjects.includes(p.id) ? { ...p, status: 'deleted' } : p));
                                            setSelectedProjects([]);
                                        }}
                                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2"
                                    >
                                        <FaTrash className="text-xs" /> Löschen
                                    </button>
                                )}
                                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                    <FaArchive className="text-xs" /> Archivieren
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setSelectedProjects([])} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-200 rounded"><FaTimes /></button>
                    </div>
                )}

                <DataTable
                    data={filteredProjects}
                    columns={columns as any}
                    onRowClick={(p: any) => navigate(`/projects/${p.id}`)}
                    pageSize={10}
                    searchPlaceholder="Projekte nach ID, Name oder Kunde suchen..."
                    searchFields={['id', 'name', 'client']}
                    actions={actions}
                    tabs={tabs}
                />
            </div>

            <NewProjectModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingProject(null); }}
                onSubmit={(data) => {
                    if (editingProject) {
                        setProjects(prev => prev.map(p => p.id === data.id ? data : p));
                    } else {
                        setProjects(prev => [data as any, ...prev]);
                    }
                }}
                initialData={editingProject}
            />
        </div>
    );
};

export default Projects;
