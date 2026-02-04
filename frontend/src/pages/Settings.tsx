import { useState } from 'react';
import {
    FaBuilding, FaLanguage, FaFileAlt, FaDatabase, FaSave, FaPlus, FaTrash, FaGlobe, FaInfoCircle, FaEnvelope, FaPhone, FaLink, FaBalanceScale, FaUserAlt, FaEdit, FaEnvelopeOpenText
} from 'react-icons/fa';
import clsx from 'clsx';
import DataTable from '../components/common/DataTable';
import NewMasterDataModal from '../components/modals/NewMasterDataModal';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('company');
    const [masterTab, setMasterTab] = useState<'languages' | 'doc_types' | 'services' | 'email_templates'>('languages');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const tabs = [
        { id: 'company', label: 'Unternehmen', icon: FaBuilding },
        { id: 'master_data', label: 'Stammdaten', icon: FaDatabase },
    ];

    // Mock Data for Master Data (Moved to state to allow updates)
    const [languages, setLanguages] = useState([
        { id: 1, code: 'de-DE', name: 'Deutsch (Deutschland)', flagCode: 'de', status: 'Aktiv' },
        { id: 2, code: 'en-US', name: 'Englisch (USA)', flagCode: 'us', status: 'Aktiv' },
        { id: 3, code: 'en-GB', name: 'Englisch (UK)', flagCode: 'gb', status: 'Aktiv' },
        { id: 4, code: 'fr-FR', name: 'Französisch (Frankreich)', flagCode: 'fr', status: 'Aktiv' },
        { id: 5, code: 'es-ES', name: 'Spanisch (Spanien)', flagCode: 'es', status: 'Inaktiv' },
    ]);

    const [docTypes, setDocTypes] = useState([
        { id: 1, name: 'Urkunde / Zeugnis', status: 'Aktiv' },
        { id: 2, name: 'Vertrag / Recht', status: 'Aktiv' },
        { id: 3, name: 'Medizinischer Befund', status: 'Aktiv' },
        { id: 4, name: 'Website / Marketing', status: 'Aktiv' },
        { id: 5, name: 'Techn. Dokumentation', status: 'Aktiv' },
    ]);

    const [services, setServices] = useState([
        { id: 1, name: 'Übersetzung (Human)', unit: 'Wort', basePrice: '0,12 €', status: 'Aktiv' },
        { id: 2, name: 'MTPE (Machine Translation + Edit)', unit: 'Wort', basePrice: '0,06 €', status: 'Aktiv' },
        { id: 3, name: 'Lektorat', unit: 'Stunde', basePrice: '65,00 €', status: 'Aktiv' },
        { id: 4, name: 'Beglaubigung', unit: 'Pauschal', basePrice: '15,00 €', status: 'Aktiv' },
    ]);

    const [emailTemplates, setEmailTemplates] = useState([
        { id: 1, name: 'Angebot Standard', subject: 'Ihr Angebot {offer_number}', status: 'Aktiv' },
        { id: 2, name: 'Rechnung Standard', subject: 'Rechnung {invoice_number}', status: 'Aktiv' },
        { id: 3, name: 'Auftragsbestätigung', subject: 'Auftragsbestätigung {project_number}', status: 'Aktiv' },
    ]);

    const getFlagUrl = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

    const handleOpenModal = (item?: any) => {
        setEditingItem(item || null);
        setIsModalOpen(true);
    };

    const handleSaveMasterData = (data: any) => {
        const dataWithStatus = { ...data, status: data.status || 'Aktiv' };

        if (masterTab === 'languages') {
            if (editingItem) {
                setLanguages(prev => prev.map(l => l.id === editingItem.id ? { ...l, ...dataWithStatus } : l));
            } else {
                setLanguages(prev => [...prev, { ...dataWithStatus, id: prev.length + 1 }]);
            }
        } else if (masterTab === 'doc_types') {
            if (editingItem) {
                setDocTypes(prev => prev.map(d => d.id === editingItem.id ? { ...d, ...dataWithStatus } : d));
            } else {
                setDocTypes(prev => [...prev, { ...dataWithStatus, id: prev.length + 1 }]);
            }
        } else if (masterTab === 'services') {
            if (editingItem) {
                setServices(prev => prev.map(s => s.id === editingItem.id ? { ...s, ...dataWithStatus } : s));
            } else {
                setServices(prev => [...prev, { ...dataWithStatus, id: prev.length + 1 }]);
            }
        } else if (masterTab === 'email_templates') {
            if (editingItem) {
                setEmailTemplates(prev => prev.map(e => e.id === editingItem.id ? { ...e, ...dataWithStatus } : e));
            } else {
                setEmailTemplates(prev => [...prev, { ...dataWithStatus, id: prev.length + 1 }]);
            }
        }
        setIsModalOpen(false);
    };


    const renderCompanySettings = () => (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Action Bar for Company Settings */}
            <div className="flex items-center justify-end py-2">
                <button className="flex items-center gap-2 px-6 py-2 bg-brand-700 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-brand-800 transition-all shadow-sm active:scale-95">
                    <FaSave /> Alles Speichern
                </button>
            </div>

            {/* Unternehmenserfassung (Full Width) */}
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold border border-brand-100">
                        <FaBuilding />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Unternehmenserfassung</h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Zentrale Firmendaten für Belege und Systemeinstellungen</p>
                    </div>
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Offizieller Firmenname</label>
                            <input type="text" defaultValue="Translation Office GmbH" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:border-brand-500 transition-all outline-none h-10 shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Markenname / Portal-Name</label>
                            <input type="text" defaultValue="TMS Portal" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:border-brand-500 transition-all outline-none h-10 shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Steuernummer</label>
                            <input type="text" defaultValue="21/123/45678" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:border-brand-500 outline-none h-10 shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">USt-IdNr.</label>
                            <input type="text" defaultValue="DE 123 456 789" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:border-brand-500 outline-none h-10 shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Währung (Standard)</label>
                            <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm cursor-pointer">
                                <option>EUR (€) - Euro</option>
                                <option>USD ($) - US Dollar</option>
                                <option>CHF (Fr.) - Schweizer Franken</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10 pt-10 border-t border-slate-100">
                        {/* Anschrift */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-500 flex items-center justify-center text-[10px]">
                                    <FaGlobe />
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Sitz der Gesellschaft</h4>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3 space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Straße</label>
                                    <input type="text" defaultValue="Musterstraße" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nr.</label>
                                    <input type="text" defaultValue="123" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm text-center" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">PLZ</label>
                                    <input type="text" defaultValue="12345" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm" />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Stadt</label>
                                    <input type="text" defaultValue="Berlin" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Land</label>
                                    <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm font-medium text-slate-800">
                                        <option>Deutschland</option>
                                        <option>Österreich</option>
                                        <option>Schweiz</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Finanzen */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-500 flex items-center justify-center text-[10px]">
                                    <FaDatabase />
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Bankverbindung</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">IBAN</label>
                                    <input type="text" defaultValue="DE12 3456 7890 1234 5678 90" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm font-mono tracking-tight" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">BIC</label>
                                        <input type="text" defaultValue="ABCDEFGHXXX" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm font-mono" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kreditinstitut</label>
                                        <input type="text" defaultValue="Musterbank AG" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* In einem eigen column unter unternehmnerfasen (Row 2) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kommunikation */}
                <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold border border-brand-100">
                            <FaEnvelope />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Kommunikation</h3>
                    </div>
                    <div className="p-8 space-y-6 flex-1">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2 italic">
                                <FaEnvelope className="text-[8px]" /> Zentrale E-Mail
                            </label>
                            <input type="email" defaultValue="office@translation-office.de" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2 italic">
                                <FaPhone className="text-[8px]" /> Telefonnummer
                            </label>
                            <input type="text" defaultValue="+49 (0) 30 123456" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2 italic">
                                <FaLink className="text-[8px]" /> Webseite
                            </label>
                            <input type="text" defaultValue="www.translation-office.de" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm" />
                        </div>
                    </div>
                </div>

                {/* Registerbericht / Rechtliches */}
                <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold border border-brand-100">
                            <FaBalanceScale />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Registerbericht</h3>
                    </div>
                    <div className="p-8 space-y-6 flex-1">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2 italic">
                                <FaBuilding className="text-[8px]" /> Amtsgericht
                            </label>
                            <input type="text" defaultValue="Berlin-Charlottenburg" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2 italic">
                                <FaDatabase className="text-[8px]" /> HR-Nummer
                            </label>
                            <input type="text" defaultValue="HRB 123456 B" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm font-mono" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2 italic">
                                <FaUserAlt className="text-[8px]" /> Geschäftsleitung
                            </label>
                            <input type="text" defaultValue="Max Mustermann" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none h-10 shadow-sm" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMasterData = () => (
        <div className="space-y-6 animate-fadeIn">
            {/* Link Tabs in Header (Moved Outside for better UX) */}
            <div className="flex items-center gap-6 border-b border-slate-200">
                <button
                    onClick={() => setMasterTab('languages')}
                    className={clsx(
                        "py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative",
                        masterTab === 'languages' ? "border-brand-600 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                >
                    Sprachen
                </button>
                <button
                    onClick={() => setMasterTab('doc_types')}
                    className={clsx(
                        "py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative",
                        masterTab === 'doc_types' ? "border-brand-600 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                >
                    Dokumentarten
                </button>
                <button
                    onClick={() => setMasterTab('services')}
                    className={clsx(
                        "py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative",
                        masterTab === 'services' ? "border-brand-600 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                >
                    Dienstleistungen
                </button>
                <button
                    onClick={() => setMasterTab('email_templates')}
                    className={clsx(
                        "py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative",
                        masterTab === 'email_templates' ? "border-brand-600 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                >
                    Email Vorlagen
                </button>
            </div>

            {/* Action Bar (Below Tabs) */}
            <div className="flex items-center justify-end py-2">
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-2 bg-brand-700 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-brand-800 transition active:scale-95 shadow-sm"
                >
                    <FaPlus className="text-[10px]" /> Neu hinzufügen
                </button>
            </div>

            {/* Master Data Content */}
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-3">
                            {masterTab === 'languages' && <FaLanguage className="text-brand-600" />}
                            {masterTab === 'doc_types' && <FaFileAlt className="text-brand-600" />}
                            {masterTab === 'services' && <FaGlobe className="text-brand-600" />}
                            {masterTab === 'email_templates' && <FaEnvelopeOpenText className="text-brand-600" />}
                            {masterTab === 'languages' && 'Sprachkonfiguration'}
                            {masterTab === 'doc_types' && 'Dokumenten-Kategorien'}
                            {masterTab === 'services' && 'Leistungskatalog'}
                            {masterTab === 'email_templates' && 'Email Textvorlagen'}
                        </h3>
                    </div>

                </div>

                <div className="flex-1">
                    {masterTab === 'languages' && (
                        <DataTable
                            data={languages}
                            columns={[
                                { header: 'Code (ISO)', accessor: (l: any) => <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 uppercase tracking-tight">{l.code}</span>, className: 'w-32' },
                                {
                                    header: 'Sprache / Flagge',
                                    accessor: (l: any) => (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-6 overflow-hidden rounded shadow-sm border border-slate-200 bg-slate-50">
                                                <img src={getFlagUrl(l.flagCode || 'de')} alt={l.name} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="font-bold text-slate-800 text-sm">{l.name}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Status',
                                    accessor: (l: any) => (
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-tight",
                                            l.status === 'Aktiv' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                                        )}>
                                            {l.status}
                                        </span>
                                    ),
                                    align: 'center' as const
                                },
                                {
                                    header: '',
                                    accessor: (l: any) => (
                                        <div className="flex justify-end gap-1 pr-2">
                                            <button onClick={() => handleOpenModal(l)} className="p-2 hover:bg-slate-50 rounded text-slate-400 hover:text-brand-600 transition-all"><FaEdit /></button>
                                            <button className="p-2 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-all"><FaTrash /></button>
                                        </div>
                                    ),
                                    align: 'right' as const
                                }
                            ]}
                            pageSize={10}
                        />
                    )}

                    {masterTab === 'doc_types' && (
                        <DataTable
                            data={docTypes}
                            columns={[
                                { header: 'Dokumentart', accessor: (d: any) => <span className="font-bold text-slate-800 text-sm">{d.name}</span> },
                                {
                                    header: 'Status',
                                    accessor: (d: any) => (
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-tight",
                                            d.status === 'Aktiv' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                                        )}>
                                            {d.status}
                                        </span>
                                    ),
                                    align: 'center' as const
                                },
                                { header: '', accessor: (d: any) => <div className="flex justify-end gap-1 pr-2"><button onClick={() => handleOpenModal(d)} className="p-2 hover:bg-slate-50 rounded text-slate-400 hover:text-brand-600 transition-all"><FaEdit /></button><button className="p-2 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-all"><FaTrash /></button></div>, align: 'right' as const }
                            ]}
                            pageSize={10}
                        />
                    )}

                    {masterTab === 'services' && (
                        <DataTable
                            data={services}
                            columns={[
                                { header: 'Leistungsbeschreibung', accessor: (s: any) => <span className="font-bold text-slate-800 text-sm">{s.name}</span> },
                                { header: 'Abrechnungseinheit', accessor: (s: any) => <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.unit}</span> },
                                { header: 'Basispreis (Netto)', accessor: (s: any) => <span className="font-bold text-brand-700">{s.basePrice}</span> },
                                {
                                    header: 'Status',
                                    accessor: (s: any) => (
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-tight",
                                            s.status === 'Aktiv' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                                        )}>
                                            {s.status}
                                        </span>
                                    ),
                                    align: 'center' as const
                                },
                                { header: '', accessor: (s: any) => <div className="flex justify-end gap-1 pr-2"><button onClick={() => handleOpenModal(s)} className="p-2 hover:bg-slate-50 rounded text-slate-400 hover:text-brand-600 transition-all"><FaEdit /></button><button className="p-2 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-all"><FaTrash /></button></div>, align: 'right' as const }
                            ]}
                            pageSize={10}
                        />
                    )}

                    {masterTab === 'email_templates' && (
                        <DataTable
                            data={emailTemplates}
                            columns={[
                                { header: 'Vorlagen-Name', accessor: (e: any) => <span className="font-bold text-slate-800 text-sm">{e.name}</span> },
                                { header: 'Betreff', accessor: (e: any) => <span className="text-xs text-slate-500 font-medium">{e.subject}</span> },
                                {
                                    header: 'Status',
                                    accessor: (e: any) => (
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-tight",
                                            e.status === 'Aktiv' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                                        )}>
                                            {e.status}
                                        </span>
                                    ),
                                    align: 'center' as const
                                },
                                { header: '', accessor: (e: any) => <div className="flex justify-end gap-1 pr-2"><button onClick={() => handleOpenModal(e)} className="p-2 hover:bg-slate-50 rounded text-slate-400 hover:text-brand-600 transition-all"><FaEdit /></button><button className="p-2 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-all"><FaTrash /></button></div>, align: 'right' as const }
                            ]}
                            pageSize={10}
                        />
                    )}
                </div>
            </div>

            <NewMasterDataModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveMasterData}
                type={masterTab}
                initialData={editingItem}
            />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto fade-in h-full flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">System Einstellungen</h1>
                    <p className="text-slate-500 text-sm">Zentrale Konfiguration für Ihr Translation Office.</p>
                </div>
            </div>

            {/* Action Bar Removed from here */}

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 flex-none">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden p-2 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 block">Konfiguration</label>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs transition-all duration-200 group",
                                    activeTab === tab.id
                                        ? "bg-brand-900 text-white shadow-md font-bold"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-brand-700 font-medium uppercase tracking-wide"
                                )}
                            >
                                <tab.icon className={clsx(
                                    "text-sm shrink-0 transition-transform duration-200",
                                    activeTab === tab.id ? "text-brand-300" : "text-slate-400"
                                )} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-brand-50 rounded-lg border border-brand-100">
                        <h4 className="text-[10px] font-bold text-brand-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <FaInfoCircle /> System-Hinweis
                        </h4>
                        <p className="text-[10px] text-brand-700 leading-relaxed font-medium">
                            Änderungen an den Unternehmenseinstellungen wirken sich direkt auf alle generierten Belege aus. Stellen Sie sicher, dass alle Daten steuerrechtlich korrekt sind.
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 pb-20">
                    {activeTab === 'company' && renderCompanySettings()}
                    {activeTab === 'master_data' && renderMasterData()}
                </div>
            </div>
        </div >
    );
};

export default Settings;
