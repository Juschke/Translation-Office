import { FaArrowRight, FaCheck, FaCheckCircle, FaExternalLinkAlt, FaFileInvoiceDollar, FaCopy, FaStar, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive, FaEnvelope, FaEdit } from 'react-icons/fa';
import { Button } from '../ui/button';
import clsx from 'clsx';

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
    onCreateInvoice?: () => void;
}

const ProjectOverviewTab = ({
    projectData,
    sourceLang,
    targetLang,
    deadlineStatus,
    navigate,
    locationPathname,
    setIsCustomerSearchOpen,
    setIsPartnerModalOpen,
    setIsCustomerEditModalOpen,
    setIsPartnerEditModalOpen,
    handlePreviewFile,
    setPreviewInvoice,
    onSendEmail,
    onCreateInvoice,
}: ProjectOverviewTabProps) => {
    const sourceFiles = (projectData.files || []).filter((f: any) => f.type === 'source');
    const targetFiles = (projectData.files || []).filter((f: any) => f.type === 'target');
    const activeInvoice = (projectData.invoices || []).find((inv: any) => !['cancelled'].includes(inv.status));

    const formatFileSize = (bytes: any) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <FaFilePdf className="text-red-500" />;
        if (['doc', 'docx'].includes(ext || '')) return <FaFileWord className="text-blue-500" />;
        if (['xls', 'xlsx'].includes(ext || '')) return <FaFileExcel className="text-emerald-500" />;
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <FaFileImage className="text-purple-500" />;
        if (['zip', 'rar', '7z'].includes(ext || '')) return <FaFileArchive className="text-orange-500" />;
        return <FaFileAlt className="text-slate-400" />;
    };

    return (
        <div className="bg-white rounded-sm border border-slate-200 overflow-hidden animate-fadeIn pb-10">
            <div className="px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-slate-100 bg-slate-50/10 flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center">
                        <FaFileInvoiceDollar className="text-slate-600 text-sm" />
                    </div>
                    Projekt-Übersicht
                </h3>
            </div>

            <div className="p-4 sm:p-6 md:p-8 space-y-12">
                {/* Core Data */}
                <section>
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Basisdaten</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Projekt</span>
                                <span className="font-medium text-slate-800 tracking-tight">{projectData.project_number || projectData.id || <span className="text-slate-300 italic font-normal">Keine Angabe</span>}</span>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Bezeichnung</span>
                                <span className="font-bold text-slate-800">{projectData.name || <span className="text-slate-300 italic font-normal">Keine Angabe</span>}</span>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm items-center">
                                <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Sprachpaar</span>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-sm text-xs text-slate-700 font-semibold uppercase tracking-tight">
                                        <img src={sourceLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px] object-cover" />
                                        {sourceLang.name}
                                    </div>
                                    <FaArrowRight className="text-slate-300 text-2xs" />
                                    <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-sm text-xs text-slate-700 font-semibold uppercase tracking-tight">
                                        <img src={targetLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px] object-cover" />
                                        {targetLang.name}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Termin</span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-slate-800 font-bold">
                                        {projectData.due ? (() => {
                                            const d = new Date(projectData.due);
                                            const days = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];
                                            return `${days[d.getDay()]}, ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} | ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
                                        })() : <span className="text-slate-300 italic font-normal">Keine Angabe</span>}
                                    </span>
                                    {projectData.due && (
                                        <div className={clsx("flex items-center gap-1.5 text-2xs font-bold uppercase tracking-tight", deadlineStatus.color.split(' ')[1])}>
                                            {deadlineStatus.label}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Priorität</span>
                                <div>
                                    {(() => {
                                        const p = projectData.priority;
                                        if (p === 'low') return (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-2xs font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                                                Standard
                                            </span>
                                        );
                                        if (p === 'medium') return (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-2xs font-bold uppercase tracking-wider bg-blue-50 text-blue-500 border border-blue-100">
                                                Normal
                                            </span>
                                        );
                                        if (p === 'high') return (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-2xs font-bold uppercase tracking-wider bg-orange-50 text-orange-500 border border-orange-100">
                                                Hoch
                                            </span>
                                        );
                                        if (p === 'express') return (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-2xs font-bold uppercase tracking-wider bg-red-50 text-red-500 border border-red-100">
                                                Express
                                            </span>
                                        );
                                        return <span className="text-slate-300 italic text-xs">Keine Angabe</span>;
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-12 gap-x-16">
                    {/* Customer Info */}
                    <section>
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kunde</h4>
                            <div className="flex items-center gap-3">
                                {projectData.customer?.email && onSendEmail && (
                                    <button
                                        onClick={() => onSendEmail('customer')}
                                        title="E-Mail an Kunden senden"
                                        className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 hover:text-brand-primary transition-colors px-2 py-1 rounded-sm hover:bg-slate-50 border border-transparent hover:border-slate-200"
                                    >
                                        <FaEnvelope className="text-2xs" /> E-Mail
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsCustomerEditModalOpen(true)}
                                    title="Kundendaten bearbeiten"
                                    className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 hover:text-brand-primary transition-colors px-2 py-1 rounded-sm hover:bg-slate-50 border border-transparent hover:border-slate-200"
                                >
                                    <FaEdit className="text-2xs" /> Bearbeiten
                                </button>
                                {projectData.customer_id && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => navigate(`/customers/${projectData.customer_id}`, { state: { from: locationPathname } })}
                                        className="h-auto p-0 text-slate-400 font-medium hover:text-brand-primary flex items-center gap-1.5 transition-colors"
                                    >
                                        <FaExternalLinkAlt className="text-2xs" /> Details
                                    </Button>
                                )}
                                <Button variant="link" size="sm" onClick={() => setIsCustomerSearchOpen(true)} className="h-auto p-0 text-brand-primary font-bold hover:underline">Ändern</Button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Kunden-ID</span>
                                <span className="font-medium text-slate-800 truncate">{projectData.customer.display_id || projectData.customer.id || '-'}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Name</span>
                                <span className="font-bold text-slate-800">{projectData.customer.name || '-'}</span>
                            </div>
                            {/* Address — individual rows */}
                            {projectData.customer.address_street && (
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Straße</span>
                                    <span className="text-slate-700 text-xs font-medium">
                                        {projectData.customer.address_street}{projectData.customer.address_house_no ? ` ${projectData.customer.address_house_no}` : ''}
                                    </span>
                                </div>
                            )}
                            {projectData.customer.address_zip && (
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">PLZ</span>
                                    <span className="text-slate-700 text-xs font-medium">{projectData.customer.address_zip}</span>
                                </div>
                            )}
                            {projectData.customer.address_city && (
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Stadt</span>
                                    <span className="text-slate-700 text-xs font-medium">{projectData.customer.address_city}</span>
                                </div>
                            )}
                            {projectData.customer.address_country && (
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Land</span>
                                    <span className="text-slate-700 text-xs font-medium">
                                        {projectData.customer.address_country === 'DE' ? 'Deutschland'
                                            : projectData.customer.address_country === 'AT' ? 'Österreich'
                                                : projectData.customer.address_country === 'CH' ? 'Schweiz'
                                                    : projectData.customer.address_country}
                                    </span>
                                </div>
                            )}
                            {!projectData.customer.address_street && !projectData.customer.address_city && (
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Adresse</span>
                                    <span className="text-slate-300 italic text-xs">Keine Angabe</span>
                                </div>
                            )}
                            {/* Contact details — individual rows */}
                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline pt-1">
                                <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">E-Mail</span>
                                <div className="space-y-1">
                                    {projectData.customer.email ? (
                                        <a href={`mailto:${projectData.customer.email}`} className="text-slate-700 font-medium hover:underline text-xs">
                                            {projectData.customer.email}
                                        </a>
                                    ) : <span className="text-slate-300 italic text-xs">Keine Angabe</span>}
                                    {(projectData.customer.additional_emails || []).map((mail: string, i: number) => (
                                        <a key={i} href={`mailto:${mail}`} className="text-slate-500 font-medium hover:underline text-xs">
                                            {mail}
                                        </a>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Telefon</span>
                                <div className="space-y-1">
                                    {projectData.customer.phone ? (
                                        <a href={`tel:${projectData.customer.phone}`} className="text-slate-700 font-medium hover:underline text-xs">
                                            {projectData.customer.phone}
                                        </a>
                                    ) : <span className="text-slate-300 italic text-xs">Keine Angabe</span>}
                                    {(projectData.customer.additional_phones || []).map((tel: string, i: number) => (
                                        <a key={i} href={`tel:${tel}`} className="text-slate-500 font-medium hover:underline text-xs">
                                            {tel}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Partner Info */}
                    <section>
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Partner</h4>
                            <div className="flex items-center gap-3">
                                {projectData.translator?.email && onSendEmail && (
                                    <button
                                        onClick={() => onSendEmail('partner')}
                                        title="E-Mail an Partner senden"
                                        className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 hover:text-brand-primary transition-colors px-2 py-1 rounded-sm hover:bg-slate-50 border border-transparent hover:border-slate-200"
                                    >
                                        <FaEnvelope className="text-2xs" /> E-Mail
                                    </button>
                                )}
                                {projectData.translator?.id && (
                                    <button
                                        onClick={() => setIsPartnerEditModalOpen(true)}
                                        title="Partnerdaten bearbeiten"
                                        className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 hover:text-brand-primary transition-colors px-2 py-1 rounded-sm hover:bg-slate-50 border border-transparent hover:border-slate-200"
                                    >
                                        <FaEdit className="text-2xs" /> Bearbeiten
                                    </button>
                                )}
                                {projectData.translator?.id && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => navigate(`/partners/${projectData.translator.id}`, { state: { from: locationPathname } })}
                                        className="h-auto p-0 text-slate-400 font-medium hover:text-brand-primary flex items-center gap-1.5 transition-colors"
                                    >
                                        <FaExternalLinkAlt className="text-2xs" /> Details
                                    </Button>
                                )}
                                <Button variant="link" size="sm" onClick={() => setIsPartnerModalOpen(true)} className="h-auto p-0 text-brand-primary font-bold hover:underline">Ändern</Button>
                            </div>
                        </div>

                        {projectData.translator?.id ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Partner-ID</span>
                                    <span className="font-medium text-slate-800 truncate">{projectData.translator.display_id || projectData.translator.id || '-'}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Name</span>
                                    <span className="font-bold text-slate-800">{projectData.translator.name}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-center">
                                    <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Bewertung</span>
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <FaStar key={star} size={10} className={star <= (projectData.translator.rating || 0) ? "text-amber-400" : "text-slate-200"} />
                                        ))}
                                        {(projectData.translator.rating || 0) === 0 && (
                                            <span className="text-slate-300 italic text-xs ml-1">Keine Bewertung</span>
                                        )}
                                    </div>
                                </div>
                                {/* Address — individual rows */}
                                {projectData.translator.address_street && (
                                    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                        <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Straße</span>
                                        <span className="text-slate-700 text-xs font-medium">
                                            {projectData.translator.address_street}{projectData.translator.address_house_no ? ` ${projectData.translator.address_house_no}` : ''}
                                        </span>
                                    </div>
                                )}
                                {projectData.translator.address_zip && (
                                    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                        <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">PLZ</span>
                                        <span className="text-slate-700 text-xs font-medium">{projectData.translator.address_zip}</span>
                                    </div>
                                )}
                                {projectData.translator.address_city && (
                                    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                        <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Stadt</span>
                                        <span className="text-slate-700 text-xs font-medium">{projectData.translator.address_city}</span>
                                    </div>
                                )}
                                {/* Contact — individual rows */}
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline pt-1">
                                    <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">E-Mail</span>
                                    <div className="space-y-1">
                                        {projectData.translator.email ? (
                                            <a href={`mailto:${projectData.translator.email}`} className="text-slate-700 font-medium hover:underline text-xs">
                                                {projectData.translator.email}
                                            </a>
                                        ) : <span className="text-slate-300 italic text-xs">Keine Angabe</span>}
                                        {(projectData.translator.additional_emails || []).map((mail: string, i: number) => (
                                            <a key={i} href={`mailto:${mail}`} className="text-slate-500 font-medium hover:underline text-xs">
                                                {mail}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Telefon</span>
                                    <div className="space-y-1">
                                        {projectData.translator.phone ? (
                                            <a href={`tel:${projectData.translator.phone}`} className="text-slate-700 font-medium hover:underline text-xs">
                                                {projectData.translator.phone}
                                            </a>
                                        ) : <span className="text-slate-300 italic text-xs">Keine Angabe</span>}
                                        {(projectData.translator.additional_phones || []).map((tel: string, i: number) => (
                                            <a key={i} href={`tel:${tel}`} className="text-slate-500 font-medium hover:underline text-xs">
                                                {tel}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Rate</span>
                                    <div className="flex flex-wrap gap-3">
                                        {(() => {
                                            const rates = Array.isArray(projectData.translator.unit_rates) ? projectData.translator.unit_rates : [];
                                            const wordRate = rates.find((r: any) => r.type?.toLowerCase() === 'word')?.price;
                                            const lineRate = rates.find((r: any) => r.type?.toLowerCase() === 'line')?.price;
                                            if (!wordRate && !lineRate) return <span className="text-slate-300 italic">Keine Konditionen</span>;
                                            return (
                                                <>
                                                    {wordRate && <span className="text-slate-600 text-[11px] font-bold bg-slate-50 px-1.5 py-0.5 rounded-sm border border-slate-100">W: {parseFloat(wordRate).toLocaleString('de-DE', { minimumFractionDigits: 3 })}€</span>}
                                                    {lineRate && <span className="text-slate-600 text-[11px] font-bold bg-slate-50 px-1.5 py-0.5 rounded-sm border border-slate-100">Z: {parseFloat(lineRate).toLocaleString('de-DE', { minimumFractionDigits: 3 })}€</span>}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 flex flex-col items-center justify-center bg-slate-50/20 rounded-sm border border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium text-[11px]">Kein Partner zugewiesen</p>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => setIsPartnerModalOpen(true)}
                                    className="mt-1 text-brand-primary text-[11px] font-bold"
                                >
                                    Partner auswählen
                                </Button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Additional Details & Services */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-12 gap-x-16 pt-4">
                    <section>
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Auftragsdetails</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Dokument</span>
                                <div className="text-xs font-semibold text-slate-800">
                                    {projectData.docType.length > 0 ? projectData.docType.join(', ') : <span className="text-slate-300 italic font-normal">Keine Angabe</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">Optionen</span>
                                <div className="flex flex-wrap gap-4">
                                    {!projectData.isCertified && !projectData.hasApostille && !projectData.isExpress && projectData.classification !== 'ja' && projectData.copies <= 0 && (
                                        <span className="text-slate-300 italic">Standard</span>
                                    )}
                                    {projectData.isCertified && (
                                        <span className="text-emerald-600 text-2xs font-bold uppercase tracking-tight flex items-center gap-1">
                                            <FaCheck className="text-[8px]" /> Beglaubigt
                                        </span>
                                    )}
                                    {projectData.hasApostille && (
                                        <span className="text-amber-600 text-2xs font-bold uppercase tracking-tight flex items-center gap-1">
                                            <FaCheck className="text-[8px]" /> Apostille
                                        </span>
                                    )}
                                    {projectData.classification === 'ja' && (
                                        <span className="text-purple-600 text-2xs font-bold uppercase tracking-tight flex items-center gap-1">
                                            <FaCheck className="text-[8px]" /> Klassifiziert
                                        </span>
                                    )}
                                    {projectData.copies > 0 && (
                                        <span className="text-slate-600 text-2xs font-bold uppercase tracking-tight flex items-center gap-1">
                                            <FaCopy className="text-[8px]" /> {projectData.copies}x Kopie
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="flex flex-col">
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Status & Lieferung</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8 xl:gap-12">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xs font-bold text-slate-400 uppercase">Projektstatus</span>
                                        {(() => {
                                            const status = projectData.status;
                                            const labels: { [key: string]: string } = {
                                                'draft': 'Entwurf', 'offer': 'Angebot', 'pending': 'Angebot', 'in_progress': 'Bearbeitung', 'review': 'Bearbeitung',
                                                'ready_for_pickup': 'Abholbereit', 'delivered': 'Geliefert', 'invoiced': 'Rechnung', 'completed': 'Abgeschlossen',
                                                'cancelled': 'Storniert', 'archived': 'Archiviert'
                                            };
                                            const colorClasses: { [key: string]: string } = {
                                                'draft': 'bg-slate-50 text-slate-600 border-slate-200',
                                                'offer': 'bg-orange-50 text-orange-600 border-orange-200',
                                                'pending': 'bg-orange-50 text-orange-600 border-orange-200',
                                                'in_progress': 'bg-blue-50 text-blue-600 border-blue-200',
                                                'review': 'bg-blue-50 text-blue-600 border-blue-200',
                                                'ready_for_pickup': 'bg-indigo-50 text-indigo-600 border-indigo-200',
                                                'delivered': 'bg-emerald-50 text-emerald-600 border-emerald-200',
                                                'invoiced': 'bg-purple-50 text-purple-600 border-purple-200',
                                                'completed': 'bg-emerald-600 text-white border-emerald-700',
                                                'cancelled': 'bg-slate-100 text-slate-500 border-slate-200',
                                                'archived': 'bg-slate-100 text-slate-500 border-slate-200'
                                            };
                                            return (
                                                <span className={clsx(
                                                    "px-2.5 py-1 rounded-sm text-2xs font-bold uppercase tracking-wider border w-fit shadow-xs",
                                                    colorClasses[status] || 'bg-slate-50 text-slate-600 border-slate-200'
                                                )}>
                                                    {labels[status] || status}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xs font-bold text-slate-400 uppercase">Versandstatus</span>
                                        {projectData.documentsSent ? (
                                            <div className="flex items-center gap-2 text-emerald-700 font-bold transition-all text-xs">
                                                <FaCheckCircle className="text-emerald-500" /> Dokumente versendet
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-500 font-bold italic text-xs">
                                                Ausstehend
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <h5 className="text-2xs font-bold text-slate-400 uppercase">Interne Notizen</h5>
                                    <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium bg-slate-50/30 p-3 rounded-sm border border-slate-100">
                                        {projectData.notes || <span className="italic text-slate-300">Keine Notizen.</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="md:border-l md:border-slate-100 md:pl-8 flex flex-col gap-6">
                                {(sourceFiles.length > 0 || targetFiles.length > 0 || activeInvoice) ? (
                                    <>
                                        {sourceFiles.length > 0 && (
                                            <div className="space-y-2">
                                                <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block">Quelldateien</span>
                                                <div className="flex flex-col gap-1.5">
                                                    {sourceFiles.map((file: any) => (
                                                        <button
                                                            key={file.id}
                                                            onClick={() => handlePreviewFile(file)}
                                                            className="flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-sm hover:border-emerald-200 hover:bg-emerald-50/20 transition-all group text-left w-full"
                                                        >
                                                            <div className="shrink-0 text-xs">
                                                                {getFileIcon(file.name)}
                                                            </div>
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="text-2xs font-bold text-slate-700 truncate group-hover:text-emerald-700">{file.name}</span>
                                                                <span className="text-2xs text-slate-400 font-medium">{formatFileSize(file.size)}</span>
                                                            </div>
                                                            <FaExternalLinkAlt className="text-[8px] text-slate-200 group-hover:text-emerald-400 transition-colors" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {targetFiles.length > 0 && (
                                            <div className="space-y-2">
                                                <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block">Übersetzungen</span>
                                                <div className="flex flex-col gap-1.5">
                                                    {targetFiles.map((file: any) => (
                                                        <button
                                                            key={file.id}
                                                            onClick={() => handlePreviewFile(file)}
                                                            className="flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-sm hover:border-blue-200 hover:bg-blue-50/20 transition-all group text-left w-full"
                                                        >
                                                            <div className="shrink-0 text-xs text-blue-500">
                                                                {getFileIcon(file.name)}
                                                            </div>
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="text-2xs font-bold text-slate-700 truncate group-hover:text-blue-700">{file.name}</span>
                                                                <span className="text-2xs text-slate-400 font-medium">{formatFileSize(file.size)}</span>
                                                            </div>
                                                            <FaCheckCircle className="text-[8px] text-slate-200 group-hover:text-blue-400 transition-colors" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activeInvoice && (
                                            <div className="space-y-2">
                                                <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block">Abrechnung</span>
                                                <button
                                                    onClick={() => setPreviewInvoice(activeInvoice)}
                                                    className="flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-sm hover:border-purple-200 hover:bg-purple-50/20 transition-all group text-left w-full"
                                                >
                                                    <div className="shrink-0 text-xs text-purple-500">
                                                        <FaFileInvoiceDollar />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="text-2xs font-bold text-slate-700 truncate group-hover:text-purple-700">{activeInvoice.invoice_number}</span>
                                                        <span className="text-2xs text-slate-400 font-medium">Rechnung (PDF)</span>
                                                    </div>
                                                    <FaExternalLinkAlt className="text-[8px] text-slate-200 group-hover:text-purple-400 transition-colors" />
                                                </button>
                                            </div>
                                        )}

                                        {!activeInvoice && ['delivered', 'invoiced'].includes(projectData?.status) && onCreateInvoice && (
                                            <div className="border border-teal-200 bg-teal-50 rounded-sm p-3 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FaFileInvoiceDollar className="text-teal-500 shrink-0 text-sm" />
                                                    <span className="text-[11px] font-bold text-teal-800 leading-tight">
                                                        Projekt abgeschlossen — Rechnung noch nicht erstellt
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={onCreateInvoice}
                                                    className="shrink-0 h-7 px-3 text-2xs uppercase font-bold tracking-tight"
                                                >
                                                    Rechnung erstellen
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-8 text-center bg-slate-50/30 rounded-sm border border-dashed border-slate-200">
                                        <FaFileAlt className="text-slate-200 text-xl mb-2" />
                                        <p className="text-2xs font-bold text-slate-400 uppercase tracking-tighter">Keine Dokumente</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <style>{`
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(2px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ProjectOverviewTab;
