import { FaArrowRight, FaStar, FaEnvelope, FaEdit, FaChevronDown, FaEllipsisV } from 'react-icons/fa';
import { Button } from '../ui/button';
import { useState } from 'react';

interface ProjectOverviewTabProps {
    projectData: any;
    sourceLang: { flagUrl: string; name: string };
    targetLang: { flagUrl: string; name: string };
    deadlineStatus: { label: string; color: string; icon: React.ReactNode };
    navigate: (path: string, opts?: any) => void;
    locationPathname: string;
    setIsCustomerSearchOpen: (open: boolean) => void;
    setIsPartnerModalOpen: (open: boolean) => void;
    setIsCustomerEditModalOpen: (open: boolean) => void;
    setIsPartnerEditModalOpen: (open: boolean) => void;
    handlePreviewFile: (file: any) => Promise<void>;
    setPreviewInvoice: (invoice: any) => void;
    onSendEmail?: (recipientType: 'customer' | 'partner') => void;
}

const ProjectOverviewTabNew = ({
    projectData,
    sourceLang,
    targetLang,
    navigate,
    locationPathname,
    setIsCustomerSearchOpen,
    setIsPartnerModalOpen,
    setIsCustomerEditModalOpen,
    setIsPartnerEditModalOpen,
    setPreviewInvoice,
    onSendEmail,
}: ProjectOverviewTabProps) => {
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        masterdata: true,
        custActions: false,
        partActions: false
    });

    const activeInvoice = (projectData.invoices || []).find((inv: any) => !['cancelled'].includes(inv.status));
    const sourceFiles = (projectData.files || []).filter((f: any) => f.type === 'source');
    const targetFiles = (projectData.files || []).filter((f: any) => f.type === 'target');

    const estimatedTotal = (projectData.positions || []).reduce((sum: number, pos: any) => {
        const rate = parseFloat(pos.rate || 0);
        const units = parseFloat(pos.units || 0);
        return sum + (rate * units);
    }, 0);

    const toggleDropdown = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            'draft': 'bg-slate-100 text-slate-700',
            'offer': 'bg-orange-100 text-orange-700',
            'pending': 'bg-orange-100 text-orange-700',
            'in_progress': 'bg-blue-100 text-blue-700',
            'review': 'bg-blue-100 text-blue-700',
            'ready_for_pickup': 'bg-indigo-100 text-indigo-700',
            'delivered': 'bg-emerald-100 text-emerald-700',
            'invoiced': 'bg-purple-100 text-purple-700',
            'completed': 'bg-emerald-100 text-emerald-700',
            'cancelled': 'bg-slate-100 text-slate-500',
            'archived': 'bg-slate-100 text-slate-500'
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            'draft': 'Entwurf',
            'offer': 'Angebot',
            'pending': 'Angebot',
            'in_progress': 'In Bearbeitung',
            'review': 'Überprüfung',
            'ready_for_pickup': 'Abholbereit',
            'delivered': 'Geliefert',
            'invoiced': 'Rechnung',
            'completed': 'Abgeschlossen',
            'cancelled': 'Storniert',
            'archived': 'Archiviert'
        };
        return labels[status] || status;
    };

    const daysUntilDue = projectData.due ? Math.ceil((new Date(projectData.due).getTime() - Date.now()) / (1000 * 3600 * 24)) : null;
    const isOverdue = daysUntilDue && daysUntilDue < 0;

    return (
        <div className="fade-in">
            {/* MAIN GRID: Left Content (70%) + Right Sidebar (30%) */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                {/* LEFT SECTION */}
                <div className="space-y-6">
                    {/* STAMMDATEN SECTION - Collapsed/Expandable */}
                    <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                        <button
                            onClick={() => toggleSection('masterdata')}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition border-b border-slate-100"
                        >
                            <h3 className="text-sm font-bold text-slate-900">Stammdaten</h3>
                            <FaChevronDown className={`text-slate-400 text-xs transition-transform ${expandedSections['masterdata'] ? 'rotate-180' : ''}`} />
                        </button>

                        {expandedSections['masterdata'] && (
                            <div className="px-5 py-4 space-y-4 bg-slate-50/30">
                                {/* Sprachpaar */}
                                <div>
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Sprachpaar</div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2.5 px-3 py-2 bg-white border border-slate-200 rounded-sm">
                                            <img src={sourceLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px]" />
                                            <span className="font-semibold text-slate-700 text-xs">{sourceLang.name}</span>
                                        </div>
                                        <FaArrowRight className="text-slate-300 text-xs" />
                                        <div className="flex items-center gap-2.5 px-3 py-2 bg-white border border-slate-200 rounded-sm">
                                            <img src={targetLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px]" />
                                            <span className="font-semibold text-slate-700 text-xs">{targetLang.name}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-4">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Auftragsdetails</div>
                                    <div className="space-y-2">
                                        {projectData.description && (
                                            <div className="grid grid-cols-[80px_1fr] gap-3 text-sm">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Beschr.</span>
                                                <p className="text-slate-700 text-xs">{projectData.description}</p>
                                            </div>
                                        )}

                                        {projectData.notes && (
                                            <div className="grid grid-cols-[80px_1fr] gap-3 text-sm">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Notizen</span>
                                                <p className="text-slate-700 text-xs">{projectData.notes}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-[80px_1fr] gap-3 text-sm">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Doktyp</span>
                                            <span className="text-slate-700 text-xs">{projectData.docType?.length > 0 ? projectData.docType.join(', ') : '-'}</span>
                                        </div>

                                        <div className="grid grid-cols-[80px_1fr] gap-3 text-sm">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Optionen</span>
                                            <div className="flex flex-wrap gap-1">
                                                {projectData.isCertified && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-semibold">Beglaubigt</span>}
                                                {projectData.hasApostille && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-semibold">Apostille</span>}
                                                {projectData.isExpress && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-semibold">Express</span>}
                                                {!projectData.isCertified && !projectData.hasApostille && !projectData.isExpress && (
                                                    <span className="text-slate-400 italic text-[9px]">Standard</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-4">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Status & Lieferung</div>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-[80px_1fr] gap-3 text-sm">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Projekt</span>
                                            <span className={`inline-block px-2 py-1 rounded-sm text-xs font-bold ${getStatusColor(projectData.status)}`}>
                                                {getStatusLabel(projectData.status)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-[80px_1fr] gap-3 text-sm">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Versand</span>
                                            <span className="text-slate-700 text-xs font-medium">
                                                {projectData.shipping_type === 'email' ? 'Per E-Mail' : projectData.shipping_type === 'pickup' ? 'Abholung' : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* KUNDE & PARTNER - 2 SPALTIG */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* CUSTOMER CARD */}
                        <div className="bg-white border border-slate-200 rounded-sm p-5">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                                <h3 className="text-sm font-bold text-slate-900">Kunde</h3>
                                <div className="flex items-center gap-1">
                                    {projectData.customer?.email && onSendEmail && (
                                        <button
                                            onClick={() => onSendEmail('customer')}
                                            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 transition"
                                            title="E-Mail"
                                        >
                                            <FaEnvelope size={13} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsCustomerEditModalOpen(true)}
                                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 transition"
                                        title="Bearbeiten"
                                    >
                                        <FaEdit size={13} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2.5 text-xs">
                                {/* ID */}
                                <div className="grid grid-cols-[65px_1fr] gap-2">
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">ID</span>
                                    <span className="text-slate-800 font-medium">{projectData.customer?.display_id || projectData.customer?.id || '-'}</span>
                                </div>

                                {/* Name */}
                                <div className="grid grid-cols-[65px_1fr] gap-2">
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Name</span>
                                    <span className="text-slate-800 font-bold">{projectData.customer?.name || '-'}</span>
                                </div>

                                {/* Kontakt - Border Top */}
                                <div className="border-t border-slate-100 pt-2">
                                    {/* Email */}
                                    <div className="grid grid-cols-[65px_1fr] gap-2 mb-2">
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">E-Mail</span>
                                        <div className="space-y-0.5">
                                            {projectData.customer?.email ? (
                                                <a href={`mailto:${projectData.customer.email}`} className="text-blue-600 hover:underline text-xs font-medium block break-all">
                                                    {projectData.customer.email}
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 italic">-</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile */}
                                    {projectData.customer?.mobile_phone && (
                                        <div className="grid grid-cols-[65px_1fr] gap-2 mb-2">
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Mobil</span>
                                            <a href={`tel:${projectData.customer.mobile_phone}`} className="text-blue-600 hover:underline text-xs font-medium">
                                                {projectData.customer.mobile_phone}
                                            </a>
                                        </div>
                                    )}

                                    {/* Festnetz */}
                                    {projectData.customer?.phone && (
                                        <div className="grid grid-cols-[65px_1fr] gap-2 mb-2">
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Tel</span>
                                            <a href={`tel:${projectData.customer.phone}`} className="text-blue-600 hover:underline text-xs font-medium">
                                                {projectData.customer.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Adresse - Border Top */}
                                {(projectData.customer?.address_street || projectData.customer?.address_city || projectData.customer?.address_zip || projectData.customer?.address_country) && (
                                    <div className="border-t border-slate-100 pt-2">
                                        {/* Straße & Hausnummer */}
                                        {projectData.customer?.address_street && (
                                            <div className="grid grid-cols-[65px_1fr] gap-2 mb-2">
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Str./Haus</span>
                                                <span className="text-slate-700">
                                                    {projectData.customer.address_street}
                                                    {projectData.customer.address_house_no ? ` ${projectData.customer.address_house_no}` : ''}
                                                </span>
                                            </div>
                                        )}

                                        {/* PLZ */}
                                        {projectData.customer?.address_zip && (
                                            <div className="grid grid-cols-[65px_1fr] gap-2 mb-2">
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">PLZ</span>
                                                <span className="text-slate-700">{projectData.customer.address_zip}</span>
                                            </div>
                                        )}

                                        {/* Stadt */}
                                        {projectData.customer?.address_city && (
                                            <div className="grid grid-cols-[65px_1fr] gap-2 mb-2">
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Stadt</span>
                                                <span className="text-slate-700">{projectData.customer.address_city}</span>
                                            </div>
                                        )}

                                        {/* Land */}
                                        {projectData.customer?.address_country && (
                                            <div className="grid grid-cols-[65px_1fr] gap-2">
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Land</span>
                                                <span className="text-slate-700">
                                                    {projectData.customer.address_country === 'DE' ? 'Deutschland'
                                                        : projectData.customer.address_country === 'AT' ? 'Österreich'
                                                            : projectData.customer.address_country === 'CH' ? 'Schweiz'
                                                                : projectData.customer.address_country}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => setIsCustomerSearchOpen(true)}
                                        className="text-xs h-7 flex-1"
                                    >
                                        Wechseln
                                    </Button>

                                    {/* Dropdown Actions */}
                                    <div className="relative">
                                        <button
                                            onClick={() => toggleDropdown('custActions')}
                                            className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 transition"
                                        >
                                            <FaEllipsisV size={12} />
                                        </button>
                                        {expandedSections['custActions'] && (
                                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded shadow-lg z-50 py-1">
                                                <button
                                                    onClick={() => {
                                                        navigate(`/customers/${projectData.customer_id}`, { state: { from: locationPathname } });
                                                        toggleDropdown('custActions');
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700 font-medium"
                                                >
                                                    Alle Details
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        onSendEmail?.('customer');
                                                        toggleDropdown('custActions');
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700 font-medium"
                                                >
                                                    E-Mail senden
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PARTNER CARD */}
                        <div className="bg-white border border-slate-200 rounded-sm p-5">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                                <h3 className="text-sm font-bold text-slate-900">Partner</h3>
                                <div className="flex items-center gap-1">
                                    {projectData.translator?.email && onSendEmail && (
                                        <button
                                            onClick={() => onSendEmail('partner')}
                                            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 transition"
                                            title="E-Mail"
                                        >
                                            <FaEnvelope size={13} />
                                        </button>
                                    )}
                                    {projectData.translator?.id && (
                                        <button
                                            onClick={() => setIsPartnerEditModalOpen(true)}
                                            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 transition"
                                            title="Bearbeiten"
                                        >
                                            <FaEdit size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {projectData.translator?.id ? (
                                <div className="space-y-2.5 text-xs">
                                    {/* ID */}
                                    <div className="grid grid-cols-[65px_1fr] gap-2">
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">ID</span>
                                        <span className="text-slate-800 font-medium">{projectData.translator.display_id || projectData.translator.id || '-'}</span>
                                    </div>

                                    {/* Name */}
                                    <div className="grid grid-cols-[65px_1fr] gap-2">
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Name</span>
                                        <span className="text-slate-800 font-bold">{projectData.translator.name}</span>
                                    </div>

                                    {/* Rating */}
                                    <div className="grid grid-cols-[65px_1fr] gap-2">
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Bew.</span>
                                        <div className="flex items-center gap-1">
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <FaStar key={star} size={9} className={star <= (projectData.translator.rating || 0) ? "text-amber-400" : "text-slate-300"} />
                                                ))}
                                            </div>
                                            <span className="text-slate-700">
                                                {projectData.translator.rating ? `${projectData.translator.rating.toFixed(1)}/5` : 'Keine'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Sprachen */}
                                    {projectData.translator?.languages && projectData.translator.languages.length > 0 && (
                                        <div className="grid grid-cols-[65px_1fr] gap-2">
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Sprach</span>
                                            <div className="flex flex-wrap gap-1">
                                                {projectData.translator.languages.map((lang: any, i: number) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-semibold">
                                                        {typeof lang === 'string' ? lang : lang.code}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Kontakt - Border Top */}
                                    <div className="border-t border-slate-100 pt-2">
                                        {/* Email */}
                                        <div className="grid grid-cols-[65px_1fr] gap-2 mb-2">
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">E-Mail</span>
                                            <div className="space-y-0.5">
                                                {projectData.translator.email ? (
                                                    <a href={`mailto:${projectData.translator.email}`} className="text-blue-600 hover:underline text-xs font-medium block break-all">
                                                        {projectData.translator.email}
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 italic">-</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mobile */}
                                        {projectData.translator?.mobile_phone && (
                                            <div className="grid grid-cols-[65px_1fr] gap-2 mb-2">
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Mobil</span>
                                                <a href={`tel:${projectData.translator.mobile_phone}`} className="text-blue-600 hover:underline text-xs font-medium">
                                                    {projectData.translator.mobile_phone}
                                                </a>
                                            </div>
                                        )}

                                        {/* Festnetz */}
                                        {projectData.translator?.phone && (
                                            <div className="grid grid-cols-[65px_1fr] gap-2 mb-2">
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Tel</span>
                                                <a href={`tel:${projectData.translator.phone}`} className="text-blue-600 hover:underline text-xs font-medium">
                                                    {projectData.translator.phone}
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Adresse - Border Top */}
                                    {(projectData.translator?.address_street || projectData.translator?.address_city || projectData.translator?.address_zip || projectData.translator?.address_country) && (
                                        <div className="border-t border-slate-100 pt-2">
                                            {/* Straße & Hausnummer */}
                                            {projectData.translator?.address_street && (
                                                <div className="grid grid-cols-[65px_1fr] gap-2 mb-2">
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Str./Haus</span>
                                                    <span className="text-slate-700">
                                                        {projectData.translator.address_street}
                                                        {projectData.translator.address_house_no ? ` ${projectData.translator.address_house_no}` : ''}
                                                    </span>
                                                </div>
                                            )}

                                            {/* PLZ */}
                                            {projectData.translator?.address_zip && (
                                                <div className="grid grid-cols-[65px_1fr] gap-2 mb-2">
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">PLZ</span>
                                                    <span className="text-slate-700">{projectData.translator.address_zip}</span>
                                                </div>
                                            )}

                                            {/* Stadt */}
                                            {projectData.translator?.address_city && (
                                                <div className="grid grid-cols-[65px_1fr] gap-2 mb-2">
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Stadt</span>
                                                    <span className="text-slate-700">{projectData.translator.address_city}</span>
                                                </div>
                                            )}

                                            {/* Land */}
                                            {projectData.translator?.address_country && (
                                                <div className="grid grid-cols-[65px_1fr] gap-2">
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Land</span>
                                                    <span className="text-slate-700">
                                                        {projectData.translator.address_country === 'DE' ? 'Deutschland'
                                                            : projectData.translator.address_country === 'AT' ? 'Österreich'
                                                                : projectData.translator.address_country === 'CH' ? 'Schweiz'
                                                                    : projectData.translator.address_country}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Sätze */}
                                    {(() => {
                                        const rates = Array.isArray(projectData.translator.unit_rates) ? projectData.translator.unit_rates : [];
                                        const wordRate = rates.find((r: any) => r.type?.toLowerCase() === 'word')?.price;
                                        const lineRate = rates.find((r: any) => r.type?.toLowerCase() === 'line')?.price;
                                        return (wordRate || lineRate) && (
                                            <div className="border-t border-slate-100 pt-2">
                                                <div className="grid grid-cols-[65px_1fr] gap-2">
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Sätze</span>
                                                    <div className="space-y-0.5 text-xs text-slate-700">
                                                        {wordRate && <div><strong>Wort:</strong> {parseFloat(wordRate).toLocaleString('de-DE', { minimumFractionDigits: 3 })}€</div>}
                                                        {lineRate && <div><strong>Zeile:</strong> {parseFloat(lineRate).toLocaleString('de-DE', { minimumFractionDigits: 3 })}€</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => setIsPartnerModalOpen(true)}
                                            className="text-xs h-7 flex-1"
                                        >
                                            Wechseln
                                        </Button>

                                        {/* Dropdown Actions */}
                                        <div className="relative">
                                            <button
                                                onClick={() => toggleDropdown('partActions')}
                                                className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 transition"
                                            >
                                                <FaEllipsisV size={12} />
                                            </button>
                                            {expandedSections['partActions'] && (
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded shadow-lg z-50 py-1">
                                                    <button
                                                        onClick={() => {
                                                            navigate(`/partners/${projectData.translator.id}`, { state: { from: locationPathname } });
                                                            toggleDropdown('partActions');
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700 font-medium"
                                                    >
                                                        Alle Details
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            onSendEmail?.('partner');
                                                            toggleDropdown('partActions');
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700 font-medium"
                                                    >
                                                        E-Mail senden
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 flex flex-col items-center justify-center bg-slate-50/50 rounded border border-dashed border-slate-300">
                                    <p className="text-slate-500 font-medium text-xs mb-3">Noch kein Partner zugewiesen</p>
                                    <Button size="sm" onClick={() => setIsPartnerModalOpen(true)} className="text-xs h-7">
                                        Auswählen
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR (30%) */}
                <div className="space-y-4 h-fit">
                    {/* STATUS BOX */}
                    <div className="bg-white border border-slate-200 rounded-sm p-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Status</h3>
                        <div className={`inline-block px-3 py-1.5 rounded-sm text-xs font-bold ${getStatusColor(projectData.status)}`}>
                            {getStatusLabel(projectData.status)}
                        </div>
                    </div>

                    {/* PROGRESS BOX */}
                    <div className="bg-white border border-slate-200 rounded-sm p-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Fortschritt</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-700 font-medium">Dateien</span>
                                <span className="text-xs font-bold text-slate-800">{sourceFiles.length} / {targetFiles.length}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-brand-primary h-full rounded-full transition-all"
                                    style={{ width: sourceFiles.length > 0 ? `${(targetFiles.length / sourceFiles.length) * 100}%` : '0%' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* FINANZEN BOX */}
                    <div className="bg-white border border-slate-200 rounded-sm p-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Finanzen</h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Geschätzt:</span>
                                <span className="font-bold text-slate-800">{estimatedTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}€</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Rechnung:</span>
                                <span className="font-bold text-slate-800">{activeInvoice ? '✓' : '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Positionen:</span>
                                <span className="font-bold text-slate-800">{(projectData.positions || []).length}</span>
                            </div>
                        </div>
                    </div>

                    {/* METADATA BOX */}
                    <div className="bg-white border border-slate-200 rounded-sm p-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Weitere Info</h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Termin:</span>
                                <span className="font-bold text-slate-800">
                                    {projectData.due
                                        ? `${new Date(projectData.due).toLocaleDateString('de-DE', { month: 'short', day: '2-digit' })}`
                                        : '—'}
                                </span>
                            </div>
                            {daysUntilDue !== null && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Tage:</span>
                                    <span className={`font-bold ${isOverdue ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {isOverdue ? `-${Math.abs(daysUntilDue)}` : `+${daysUntilDue}`}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-600">Priorität:</span>
                                <span className="font-bold text-slate-800 capitalize">{projectData.priority || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Nachrichten:</span>
                                <span className="font-bold text-slate-800">{(projectData.messages || []).length}</span>
                            </div>
                        </div>
                    </div>

                    {/* LINKS BOX */}
                    <div className="bg-white border border-slate-200 rounded-sm p-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Stammdaten</h3>
                        <div className="space-y-1.5">
                            <button
                                onClick={() => { }}
                                className="w-full text-left px-2 py-1.5 text-xs text-brand-primary font-semibold hover:bg-blue-50 rounded transition"
                            >
                                → Projekt bearbeiten
                            </button>
                            {projectData.customer_id && (
                                <button
                                    onClick={() => navigate(`/customers/${projectData.customer_id}`)}
                                    className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:text-brand-primary hover:bg-slate-50 rounded transition font-medium"
                                >
                                    → Alle Kunden
                                </button>
                            )}
                            {projectData.translator?.id && (
                                <button
                                    onClick={() => navigate(`/partners/${projectData.translator.id}`)}
                                    className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:text-brand-primary hover:bg-slate-50 rounded transition font-medium"
                                >
                                    → Alle Partner
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectOverviewTabNew;
