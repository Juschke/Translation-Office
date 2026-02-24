import React, { useState, useMemo } from 'react';
import { FaTimes, FaSearch, FaStar, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import LanguageSelect from '../common/LanguageSelect';
import clsx from 'clsx';
import PartnerForm from '../forms/PartnerForm';
import { getFlagUrl } from '../../utils/flags';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnerService } from '../../api/services';

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
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLanguage, setFilterLanguage] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'name', direction: 'asc' });
    const [mode, setMode] = useState<'list' | 'edit' | 'create'>('list');
    const [editData, setEditData] = useState<any>(null);
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedPartnerId, setExpandedPartnerId] = useState<number | null>(null);
    const PAGE_SIZE = 8;

    // Load partners from API
    const { data: apiPartners = [], isLoading } = useQuery({
        queryKey: ['partners'],
        queryFn: partnerService.getAll,
        enabled: isOpen
    });

    // Map API data to component format
    const partners: Partner[] = useMemo(() => {
        return apiPartners
            .filter((p: any) => p.status !== 'deleted' && p.status !== 'archived')
            .map((p: any) => ({
                id: p.id,
                name: p.company || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
                company: p.company || '',
                email: p.email || '',
                phone: p.phone || '',
                street: p.address_street || '',
                zip: p.address_zip || '',
                city: p.address_city || '',
                languages: Array.isArray(p.languages) ? p.languages : (p.languages ? [p.languages] : []),
                tags: Array.isArray(p.domains) ? p.domains : [],
                status: p.status === 'available' ? 'verified' : p.status || 'active',
                rating: p.rating || 0,
                capacity: Math.floor(Math.random() * 100), // capacity not stored in DB, placeholder
                initials: ((p.first_name?.[0] || '') + (p.last_name?.[0] || 'P')).toUpperCase(),
                color: 'bg-emerald-50 text-brand-primary',
                priceList: Array.isArray(p.unit_rates) ? p.unit_rates.map((r: any, i: number) => ({
                    id: String(i + 1),
                    label: r.label || 'Standard',
                    unit: r.unit || 'Wort',
                    price: parseFloat(r.price) || 0
                })) : [],
                bankName: p.bank_name,
                iban: p.bank_iban,
                bic: p.bank_bic
            }));
    }, [apiPartners]);

    const createMutation = useMutation({
        mutationFn: partnerService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            setMode('list');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => partnerService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            setMode('list');
        }
    });

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <FaSort className="text-slate-300 ml-1 opacity-50" size={10} />;
        return sortConfig.direction === 'asc' ? <FaSortUp className="text-brand-primary ml-1" size={10} /> : <FaSortDown className="text-brand-primary ml-1" size={10} />;
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
        if (!editData?.street) errors.add('street');
        if (!editData?.houseNo) errors.add('houseNo');
        if (!editData?.zip) errors.add('zip');
        if (!editData?.city) errors.add('city');
        if (!editData?.bankName) errors.add('bankName');
        if (!editData?.bic) errors.add('bic');
        if (!editData?.iban) errors.add('iban');
        if (!editData?.taxId) errors.add('taxId');

        setValidationErrors(errors);
        if (errors.size > 0) return;

        // Prepare data for API
        const apiData = {
            ...editData,
            first_name: editData.firstName,
            last_name: editData.lastName,
            address_street: editData.street,
            address_house_no: editData.houseNo,
            address_zip: editData.zip,
            address_city: editData.city,
            bank_name: editData.bankName,
            bank_bic: editData.bic,
            bank_iban: editData.iban,
            tax_id: editData.taxId,
            email: editData.emails?.[0],
            phone: editData.phones?.[0],
            unit_rates: editData.priceList || [],
            domains: editData.domains || []
        };

        if (mode === 'create') {
            createMutation.mutate(apiData);
        } else {
            updateMutation.mutate({ ...apiData, id: editData.id });
        }
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
            <span className={clsx("px-1.5 py-0.5 rounded border text-xs font-semibolder", styles[status] || styles.inactive)}>
                {labels[status] || 'Unbekannt'}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[70] flex items-center justify-center backdrop-blur-sm p-6 overflow-hidden transition-all">
            <div className="bg-white rounded shadow-sm w-full max-w-7xl flex flex-col h-full max-h-[90vh] border border-slate-200 animate-fadeIn font-sans">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-semibold text-lg text-slate-800">
                            {mode === 'list' ? 'Partner-Datenbank' : mode === 'create' ? 'Neuen Partner anlegen' : 'Partner bearbeiten'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Externes Fachpersonal & Konditionen</p>
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
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm bg-slate-50 focus:outline-none focus:border-brand-primary focus:bg-white transition"
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
                                        <th className="px-6 py-2.5 text-xs font-semibold text-slate-400 cursor-pointer hover:text-brand-primary transition" onClick={() => handleSort('name')}>
                                            <div className="flex items-center">Partner {getSortIcon('name')}</div>
                                        </th>
                                        <th className="px-6 py-2.5 text-xs font-semibold text-slate-400">Sprachen</th>
                                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Email</th>
                                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Telefon</th>
                                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Adresse</th>
                                        <th className="px-6 py-2.5"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-xs font-medium">Partner werden geladen...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginatedPartners.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center">
                                                <div className="text-slate-400 text-sm">Keine Partner gefunden.</div>
                                            </td>
                                        </tr>
                                    ) : paginatedPartners.map(p => (
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
                                                        <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-semibold shadow-sm shrink-0 ${p.color}`}>{p.initials}</div>
                                                        <div className="flex flex-col">
                                                            <div className="font-medium text-slate-900 text-sm group-hover:text-brand-primary transition leading-tight">{p.name}</div>
                                                            {expandedPartnerId !== p.id && (
                                                                <div className="text-xs text-slate-400 font-mediumer flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    Details anzeigen <span className="w-1 h-1 bg-slate-200 rounded-full"></span> {p.company}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-2.5">
                                                    <div className="flex flex-wrap gap-1">
                                                        {p.languages.slice(0, 3).map(lang => (
                                                            <span key={lang} className="inline-flex items-center gap-1 px-1 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-100 text-xs font-medium">
                                                                <img src={getFlagUrl(lang)} className="w-2.5 h-1.5 object-cover rounded-sm" alt={lang} />
                                                                <span className="uppercase">{lang}</span>
                                                            </span>
                                                        ))}
                                                        {p.languages.length > 3 && <span className="text-xs text-slate-400 font-medium">+{p.languages.length - 3}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-xs font-medium text-slate-500 truncate max-w-[150px]" title={p.email}>
                                                    {p.email || '-'}
                                                </td>
                                                <td className="px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap">
                                                    {p.phone || '-'}
                                                </td>
                                                <td className="px-4 py-2.5 text-xs font-medium text-slate-500 truncate max-w-[200px]" title={`${p.street}, ${p.zip} ${p.city}`}>
                                                    {p.street ? `${p.street}, ${p.zip} ${p.city}` : '-'}
                                                </td>
                                                <td className="px-6 py-2.5 text-right">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSelect(p); }}
                                                        className="bg-brand-primary text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm hover:bg-brand-primary/90 transition"
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
                                                                <span className="text-xs font-semibold text-slate-400 block">Unternehmen / Kontakt</span>
                                                                <div className="font-medium text-slate-800 leading-none">{p.company}</div>
                                                                <div className="text-xs text-slate-500 font-medium">{p.email}</div>
                                                            </div>

                                                            <div className="w-px h-8 bg-slate-200"></div>

                                                            <div className="space-y-1">
                                                                <span className="text-xs font-semibold text-slate-400 block">Status</span>
                                                                <div>{getStatusBadge(p.status)}</div>
                                                            </div>

                                                            <div className="w-px h-8 bg-slate-200"></div>

                                                            <div className="space-y-1">
                                                                <span className="text-xs font-semibold text-slate-400 block">Bewertung</span>
                                                                <div className="pt-0.5">{renderStars(p.rating)}</div>
                                                            </div>

                                                            <div className="w-px h-8 bg-slate-200"></div>

                                                            <div className="space-y-1">
                                                                <span className="text-xs font-semibold text-slate-400 block">Auslastung</span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                        <div className={clsx("h-full transition-all duration-700", p.capacity > 80 ? 'bg-rose-500' : p.capacity > 50 ? 'bg-amber-400' : 'bg-emerald-500')} style={{ width: `${p.capacity}%` }}></div>
                                                                    </div>
                                                                    <span className="text-xs font-semibold text-slate-700 tabular-nums">{p.capacity}%</span>
                                                                </div>
                                                            </div>

                                                            <div className="ml-auto">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditData(p); setMode('edit'); }}
                                                                    className="px-4 py-1.5 border border-slate-300 rounded-sm text-xs font-semibold text-slate-600 hover:bg-white hover:border-slate-400 transition shadow-sm bg-white"
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
                                <span className="text-xs font-medium text-slate-400">
                                    {processedPartners.length} Partner gefunden
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8 px-3 rounded border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        Zurück
                                    </button>
                                    <div className="flex items-center gap-1 mx-2">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={clsx(
                                                    "w-8 h-8 rounded text-xs font-semibold transition-all",
                                                    currentPage === i + 1
                                                        ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
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
                                        className="h-8 px-3 rounded border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
                    <button onClick={() => mode === 'list' ? onClose() : setMode('list')} className="px-6 py-2.5 border border-slate-300 rounded text-slate-600 text-sm font-medium hover:bg-white transition">
                        {mode === 'list' ? 'Schließen' : 'Abbrechen'}
                    </button>
                    {mode !== 'list' && (
                        <button onClick={handleSave} className="px-10 py-2.5 bg-brand-primary text-white rounded text-sm font-bold shadow-sm hover:bg-brand-primary/90 transition">
                            Speichern
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PartnerSelectionModal;
