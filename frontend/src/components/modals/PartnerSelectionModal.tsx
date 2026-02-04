import React, { useState, useMemo } from 'react';
import { FaTimes, FaSearch, FaStar, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import LanguageSelect from '../common/LanguageSelect';
import clsx from 'clsx';
import PartnerForm from '../forms/PartnerForm';
import { getFlagUrl } from '../../utils/flags';

interface PriceEntry {
    id: string;
    label: string;
    unit: string;
    price: number;
}

interface Partner {
    id: number;
    name: string;
    company: string;
    email: string;
    phone: string;
    street: string;
    zip: string;
    city: string;
    languages: string[];
    tags: string[];
    status: string;
    rating: number;
    capacity: number;
    initials: string;
    color: string;
    priceList: PriceEntry[];
    bankName?: string;
    iban?: string;
    bic?: string;
}

interface PartnerSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (partner: any) => void;
}

const PartnerSelectionModal: React.FC<PartnerSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLanguage, setFilterLanguage] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'name', direction: 'asc' });
    const [mode, setMode] = useState<'list' | 'edit' | 'create'>('list');
    const [editData, setEditData] = useState<any>(null);
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedPartnerId, setExpandedPartnerId] = useState<number | null>(null);
    const PAGE_SIZE = 8;

    // Partners State with initial Mock Data
    const [partners, setPartners] = useState<Partner[]>([
        {
            id: 1, name: 'Sabine Müller', company: 'Freelance Services',
            email: 's.mueller@partner.de', phone: '+49 123 456789', street: 'Musterstraße 1', zip: '12345', city: 'Berlin',
            languages: ['de', 'en', 'fr'], tags: ['Recht', 'Marketing'], status: 'verified', rating: 5, capacity: 85, initials: 'SM', color: 'bg-teal-50 text-teal-700',
            priceList: [
                { id: '1', label: 'DE > EN', unit: 'Wort', price: 0.12 },
                { id: '2', label: 'EN > DE', unit: 'Wort', price: 0.11 },
                { id: '3', label: 'Korrektorat', unit: 'Stunde', price: 45.00 }
            ],
            bankName: 'Deutsche Bank', iban: 'DE12 3456 7890 1234 5678 90', bic: 'DEUTDEBX'
        },
        {
            id: 2, name: 'Dr. Jean Luc Picard', company: 'Picard Translations',
            email: 'contact@picard-trans.com', phone: '+33 1 2345678', street: 'Rue de Vin', zip: '75000', city: 'Paris',
            languages: ['fr', 'en'], tags: ['Technik', 'Wissenschaft'], status: 'verified', rating: 4, capacity: 40, initials: 'JP', color: 'bg-slate-100 text-slate-700',
            priceList: [
                { id: '1', label: 'FR > EN', unit: 'Wort', price: 0.14 },
                { id: '2', label: 'Fachübersetzung', unit: 'Wort', price: 0.16 },
                { id: '3', label: 'Consulting', unit: 'Stunde', price: 60.00 }
            ]
        },
        {
            id: 4, name: 'Maria Garcia', company: 'Global Linguistics',
            email: 'm.garcia@global-lingua.es', phone: '+34 91 1234567', street: 'Calle del Sol', zip: '28001', city: 'Madrid',
            languages: ['es', 'de'], tags: ['Tourismus'], status: 'verified', rating: 5, capacity: 90, initials: 'MG', color: 'bg-teal-50 text-teal-700',
            priceList: [
                { id: '1', label: 'Standard', unit: 'Wort', price: 0.11 },
                { id: '2', label: 'Beglaubigung', unit: 'Seite', price: 35.00 }
            ]
        }
    ]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <FaSort className="text-slate-300 ml-1 opacity-50" size={10} />;
        return sortConfig.direction === 'asc' ? <FaSortUp className="text-teal-600 ml-1" size={10} /> : <FaSortDown className="text-teal-600 ml-1" size={10} />;
    };

    const processedPartners = useMemo(() => {
        let result = partners.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.company && p.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.tags && p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
            const matchesLang = filterLanguage ? p.languages.includes(filterLanguage) : true;
            return matchesSearch && matchesLang;
        });

        if (sortConfig.key && sortConfig.direction) {
            result.sort((a: any, b: any) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                if (typeof bValue === 'string') bValue = bValue.toLowerCase();
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [partners, searchTerm, filterLanguage, sortConfig]);

    const paginatedPartners = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return processedPartners.slice(start, start + PAGE_SIZE);
    }, [processedPartners, currentPage]);

    const totalPages = Math.ceil(processedPartners.length / PAGE_SIZE);

    const handleSave = () => {
        const errors = new Set<string>();
        if (!editData?.firstName) errors.add('firstName');
        if (!editData?.lastName) errors.add('lastName');
        if (editData?.type === 'agency' && !editData?.company) errors.add('company');
        if (!editData?.emails?.[0]) errors.add('email');

        setValidationErrors(errors);
        if (errors.size > 0) return;

        const fullName = `${editData.firstName} ${editData.lastName}`;
        const finalPartner: Partner = {
            ...editData,
            id: mode === 'create' ? Math.max(0, ...partners.map(p => p.id)) + 1 : editData.id,
            name: fullName,
            initials: (editData.firstName[0] || '') + (editData.lastName[0] || ''),
            color: 'bg-teal-50 text-teal-700',
            priceList: editData.priceList || [],
            languages: editData.languages || [],
            tags: editData.domains || []
        };

        if (mode === 'create') {
            setPartners([...partners, finalPartner]);
        } else {
            setPartners(partners.map(p => p.id === finalPartner.id ? finalPartner : p));
        }
        setMode('list');
    };

    if (!isOpen) return null;

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
                <FaStar key={i} className={i < rating ? "text-yellow-400" : "text-slate-200"} size={7} />
            ))}
        </div>
    );

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'verified': 'bg-emerald-50 text-emerald-600 border-emerald-200',
            'active': 'bg-emerald-50 text-emerald-600 border-emerald-200',
            'busy': 'bg-orange-50 text-orange-600 border-orange-200',
            'vacation': 'bg-blue-50 text-blue-600 border-blue-200',
            'inactive': 'bg-slate-50 text-slate-400 border-slate-200'
        };
        const labels: Record<string, string> = {
            'verified': 'Aktiv',
            'active': 'Aktiv',
            'busy': 'Ausgelastet',
            'vacation': 'Abwesend',
            'inactive': 'Deaktiviert'
        };
        return (
            <span className={clsx("px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-tighter", styles[status] || styles.inactive)}>
                {labels[status] || 'Unbekannt'}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[70] flex items-center justify-center backdrop-blur-sm p-6 overflow-hidden transition-all">
            <div className="bg-white rounded shadow-2xl w-full max-w-7xl flex flex-col h-full max-h-[90vh] border border-slate-200 animate-fadeIn font-sans">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">
                            {mode === 'list' ? 'Partner-Datenbank' : mode === 'create' ? 'Neuen Partner anlegen' : 'Partner bearbeiten'}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Externes Fachpersonal & Konditionen</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:bg-slate-200 transition">
                            <FaTimes className="text-lg" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {mode === 'list' ? (
                    <>
                        <div className="px-8 py-4 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center shrink-0">
                            <div className="flex-1 w-full relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                                    placeholder="Suche nach Name, Firma..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-80">
                                <LanguageSelect
                                    value={filterLanguage}
                                    onChange={setFilterLanguage}
                                    placeholder="Alle Sprachen"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full border-collapse text-left min-w-[1000px]">
                                <thead className="bg-slate-50 sticky top-0 z-20">
                                    <tr>
                                        <th className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider cursor-pointer hover:text-teal-700 transition" onClick={() => handleSort('name')}>
                                            <div className="flex items-center">Partner {getSortIcon('name')}</div>
                                        </th>
                                        <th className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-40">Sprachen</th>
                                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Wort</th>
                                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Zeile</th>
                                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Std.</th>
                                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Mind.</th>
                                        <th className="px-6 py-2.5"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {paginatedPartners.map(p => (
                                        <React.Fragment key={p.id}>
                                            <tr
                                                className={clsx(
                                                    "transition-all group cursor-pointer border-b border-transparent",
                                                    expandedPartnerId === p.id ? "bg-teal-50/30" : "hover:bg-slate-50/80"
                                                )}
                                                onClick={() => setExpandedPartnerId(expandedPartnerId === p.id ? null : p.id)}
                                            >
                                                <td className="px-6 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-black shadow-sm shrink-0 ${p.color}`}>{p.initials}</div>
                                                        <div className="flex flex-col">
                                                            <div className="font-bold text-slate-900 text-[12px] group-hover:text-teal-700 transition leading-tight">{p.name}</div>
                                                            {expandedPartnerId !== p.id && (
                                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    Details anzeigen <span className="w-1 h-1 bg-slate-200 rounded-full"></span> {p.company}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-2.5">
                                                    <div className="flex flex-wrap gap-1">
                                                        {p.languages.slice(0, 3).map(lang => (
                                                            <span key={lang} className="inline-flex items-center gap-1 px-1 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-100 text-[8px] font-bold">
                                                                <img src={getFlagUrl(lang)} className="w-2.5 h-1.5 object-cover rounded-sm" alt={lang} />
                                                                <span className="uppercase">{lang}</span>
                                                            </span>
                                                        ))}
                                                        {p.languages.length > 3 && <span className="text-[8px] text-slate-400 font-bold">+{p.languages.length - 3}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-center font-mono text-[10px] font-bold text-slate-600">
                                                    {p.priceList?.find(pr => pr.unit.toLowerCase() === 'wort')?.price.toFixed(3) || '-'}
                                                </td>
                                                <td className="px-4 py-2.5 text-center font-mono text-[10px] font-bold text-slate-600">
                                                    {p.priceList?.find(pr => pr.unit.toLowerCase() === 'zeile')?.price.toFixed(2) || '-'}
                                                </td>
                                                <td className="px-4 py-2.5 text-center font-mono text-[10px] font-bold text-slate-600">
                                                    {p.priceList?.find(pr => pr.unit.toLowerCase() === 'stunde')?.price.toFixed(2) || '-'}
                                                </td>
                                                <td className="px-4 py-2.5 text-center font-mono text-[10px] font-black text-teal-700">
                                                    {p.priceList?.find(pr => pr.label.toLowerCase().includes('mindest'))?.price.toFixed(2) || '-'}
                                                </td>
                                                <td className="px-6 py-2.5 text-right">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSelect(p); }}
                                                        className="bg-teal-700 text-white px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-teal-800 transition active:scale-95"
                                                    >
                                                        Übernehmen
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedPartnerId === p.id && (
                                                <tr className="bg-slate-50/80 animate-fadeIn border-b border-slate-200">
                                                    <td colSpan={7} className="p-0">
                                                        <div className="px-6 py-3 flex items-center gap-8 text-xs">
                                                            <div className="space-y-1 min-w-[200px]">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Unternehmen / Kontakt</span>
                                                                <div className="font-bold text-slate-800 leading-none">{p.company}</div>
                                                                <div className="text-[10px] text-slate-500 font-medium">{p.email}</div>
                                                            </div>

                                                            <div className="w-px h-8 bg-slate-200"></div>

                                                            <div className="space-y-1">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Status</span>
                                                                <div>{getStatusBadge(p.status)}</div>
                                                            </div>

                                                            <div className="w-px h-8 bg-slate-200"></div>

                                                            <div className="space-y-1">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Bewertung</span>
                                                                <div className="pt-0.5">{renderStars(p.rating)}</div>
                                                            </div>

                                                            <div className="w-px h-8 bg-slate-200"></div>

                                                            <div className="space-y-1">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Auslastung</span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                        <div className={clsx("h-full transition-all duration-700", p.capacity > 80 ? 'bg-rose-500' : p.capacity > 50 ? 'bg-amber-400' : 'bg-emerald-500')} style={{ width: `${p.capacity}%` }}></div>
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-slate-700 tabular-nums">{p.capacity}%</span>
                                                                </div>
                                                            </div>

                                                            <div className="ml-auto">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditData(p); setMode('edit'); }}
                                                                    className="px-4 py-1.5 border border-slate-300 rounded-sm text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-slate-400 transition shadow-sm bg-white"
                                                                >
                                                                    Profil
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {processedPartners.length > PAGE_SIZE && (
                            <div className="px-8 py-3 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {processedPartners.length} Partner gefunden
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8 px-3 rounded border border-slate-200 bg-white text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        Zurück
                                    </button>
                                    <div className="flex items-center gap-1 mx-2">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={clsx(
                                                    "w-8 h-8 rounded text-[10px] font-black transition-all",
                                                    currentPage === i + 1
                                                        ? "bg-teal-700 text-white shadow-md shadow-teal-700/20"
                                                        : "text-slate-400 hover:bg-slate-50"
                                                )}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-8 px-3 rounded border border-slate-200 bg-white text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        Weiter
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 overflow-y-auto bg-white p-8 custom-scrollbar">
                        <PartnerForm
                            initialData={editData}
                            onChange={setEditData}
                            validationErrors={validationErrors}
                        />
                    </div>
                )}

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <button onClick={() => mode === 'list' ? onClose() : setMode('list')} className="px-6 py-2.5 border border-slate-300 rounded text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-white transition">
                        {mode === 'list' ? 'Schließen' : 'Abbrechen'}
                    </button>
                    {mode !== 'list' && (
                        <button onClick={handleSave} className="px-10 py-2.5 bg-teal-700 text-white rounded text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-teal-800 transition active:scale-95">
                            Speichern
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PartnerSelectionModal;
