import { FaArrowRight, FaCheck, FaCheckCircle, FaClock, FaBolt, FaFlag, FaAt, FaPhone, FaExternalLinkAlt, FaFileInvoiceDollar, FaCopy, FaStar, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive, FaEnvelope } from 'react-icons/fa';
import { Button } from '../ui/button';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

interface ProjectOverviewTabProps {
    projectData: any;
    sourceLang: { flagUrl: string; name: string };
    targetLang: { flagUrl: string; name: string };
    deadlineStatus: { label: string; color: string; icon: React.ReactNode };
    navigate: (path: string, opts?: any) => void;
    locationPathname: string;
    setIsCustomerSearchOpen: (open: boolean) => void;
    setIsPartnerModalOpen: (open: boolean) => void;
    updateProjectMutation: any;
    handlePreviewFile: (file: any) => Promise<void>;
    setPreviewInvoice: (invoice: any) => void;
    onSendEmail?: (recipientType: 'customer' | 'partner') => void;
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
    updateProjectMutation,
    handlePreviewFile,
    setPreviewInvoice,
    onSendEmail,
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
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Projekt-ID</span>
                                <span className="font-medium text-slate-800 tracking-tight">{projectData.id || <span className="text-slate-300 italic font-normal">Keine Angabe</span>}</span>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bezeichnung</span>
                                <span className="font-bold text-slate-800">{projectData.name || <span className="text-slate-300 italic font-normal">Keine Angabe</span>}</span>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm items-center">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sprachpaar</span>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-sm text-xs text-slate-700 font-semibold uppercase tracking-tight">
                                        <img src={sourceLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px] object-cover" />
                                        {sourceLang.name}
                                    </div>
                                    <FaArrowRight className="text-slate-300 text-[10px]" />
                                    <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-sm text-xs text-slate-700 font-semibold uppercase tracking-tight">
                                        <img src={targetLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px] object-cover" />
                                        {targetLang.name}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Termin</span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-slate-800 font-bold">
                                        {projectData.due ? (() => {
                                            const d = new Date(projectData.due);
                                            const days = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];
                                            return `${days[d.getDay()]}, ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} | ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
                                        })() : <span className="text-slate-300 italic font-normal">Keine Angabe</span>}
                                    </span>
                                    {projectData.due && (
                                        <div className={clsx("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight", deadlineStatus.color.split(' ')[1])}>
                                            {deadlineStatus.label}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Priorität</span>
                                <div>
                                    {projectData.priority === 'low' ? (
                                        <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5 uppercase tracking-tight">
                                            <FaClock className="text-[10px]" /> Standard
                                        </span>
                                    ) : projectData.priority === 'medium' ? (
                                        <span className="text-blue-600 text-xs font-bold flex items-center gap-1.5 uppercase tracking-tight">
                                            <FaFlag className="text-[10px]" /> Normal
                                        </span>
                                    ) : (
                                        <span className={clsx("text-xs font-bold flex items-center gap-1.5 uppercase tracking-tight",
                                            projectData.priority === 'express' || projectData.priority === 'high' ? "text-red-600" : "text-orange-600"
                                        )}>
                                            {projectData.priority === 'express' || projectData.priority === 'high' ? <FaBolt className="text-[10px]" /> : <FaFlag className="text-[10px]" />}
                                            {projectData.priority === 'express' || projectData.priority === 'high' ? 'Express' : 'Hoch'}
                                        </span>
                                    )}
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
                            <div className="flex gap-4">
                                {projectData.customer_id && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => navigate(`/customers/${projectData.customer_id}`, { state: { from: locationPathname } })}
                                        className="h-auto p-0 text-slate-400 font-medium hover:text-brand-primary flex items-center gap-1.5 transition-colors"
                                    >
                                        <FaExternalLinkAlt className="text-[10px]" /> Details
                                    </Button>
                                )}
                                <Button variant="link" size="sm" onClick={() => setIsCustomerSearchOpen(true)} className="h-auto p-0 text-brand-primary font-bold hover:underline">Ändern</Button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID</span>
                                <span className="font-medium text-slate-800 truncate">{projectData.customer.id || '-'}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Name</span>
                                <span className="font-bold text-slate-800">{projectData.customer.name || '-'}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Adresse</span>
                                <div className="text-slate-700 leading-tight text-xs space-y-0.5">
                                    {projectData.customer.address_street || projectData.customer.address_house_no ? (
                                        <>
                                            <div>{projectData.customer.address_street} {projectData.customer.address_house_no}</div>
                                            <div>{projectData.customer.address_zip} {projectData.customer.address_city}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {projectData.customer.address_country === 'DE' ? 'Deutschland' : projectData.customer.address_country}
                                            </div>
                                        </>
                                    ) : <span className="text-slate-300 italic">Keine Angabe</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline pt-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kontakt</span>
                                <div className="space-y-1.5">
                                    {projectData.customer.email && (
                                        <a href={`mailto:${projectData.customer.email}`} className="text-slate-700 font-medium hover:underline flex items-center gap-2 break-all text-xs">
                                            <FaAt className="text-[10px] text-slate-300 shrink-0" /> {projectData.customer.email}
                                        </a>
                                    )}
                                    {projectData.customer.phone && (
                                        <div className="text-slate-600 font-medium text-xs flex items-center gap-2">
                                            <FaPhone className="text-[10px] text-slate-300 shrink-0" /> {projectData.customer.phone}
                                        </div>
                                    )}
                                    {!projectData.customer.email && !projectData.customer.phone && <span className="text-slate-300">-</span>}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Partner Info */}
                    <section>
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Partner</h4>
                            <div className="flex gap-4">
                                {projectData.translator?.id && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => navigate(`/partners/${projectData.translator.id}`, { state: { from: locationPathname } })}
                                        className="h-auto p-0 text-slate-400 font-medium hover:text-brand-primary flex items-center gap-1.5 transition-colors"
                                    >
                                        <FaExternalLinkAlt className="text-[10px]" /> Details
                                    </Button>
                                )}
                                <Button variant="link" size="sm" onClick={() => setIsPartnerModalOpen(true)} className="h-auto p-0 text-brand-primary font-bold hover:underline">Ändern</Button>
                            </div>
                        </div>

                        {projectData.translator?.id ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID</span>
                                    <span className="font-medium text-slate-800 truncate">{projectData.translator.id || '-'}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Name</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-800">{projectData.translator.name}</span>
                                        <div className="flex items-center gap-0.5 text-amber-400">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <FaStar key={star} size={9} className={star <= (projectData.translator.rating || 0) ? "text-amber-400" : "text-slate-100"} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {projectData.translator.address_city && (
                                    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ort</span>
                                        <span className="text-slate-700 text-xs font-medium">{projectData.translator.address_zip} {projectData.translator.address_city}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kontakt</span>
                                    <div className="space-y-1.5">
                                        {projectData.translator.email ? (
                                            <div className="flex flex-col gap-1">
                                                <a href={`mailto:${projectData.translator.email}`} className="text-slate-700 font-medium hover:underline flex items-center gap-2 break-all text-xs">
                                                    <FaAt className="text-[10px] text-slate-300 shrink-0" /> {projectData.translator.email}
                                                </a>
                                                {onSendEmail && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onSendEmail('partner')}
                                                        className="h-7 px-2 font-bold text-[10px] flex items-center gap-1.5 mt-0.5 w-fit"
                                                    >
                                                        <FaEnvelope className="text-[9px]" /> E-Mail senden
                                                    </Button>
                                                )}
                                            </div>
                                        ) : <span className="text-slate-300">-</span>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rate</span>
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
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dokument</span>
                                <div className="text-xs font-semibold text-slate-800">
                                    {projectData.docType.length > 0 ? projectData.docType.join(', ') : <span className="text-slate-300 italic font-normal">Keine Angabe</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Optionen</span>
                                <div className="flex flex-wrap gap-4">
                                    {!projectData.isCertified && !projectData.hasApostille && !projectData.isExpress && projectData.classification !== 'ja' && projectData.copies <= 0 && (
                                        <span className="text-slate-300 italic">Standard</span>
                                    )}
                                    {projectData.isCertified && (
                                        <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
                                            <FaCheck className="text-[8px]" /> Beglaubigt
                                        </span>
                                    )}
                                    {projectData.hasApostille && (
                                        <span className="text-amber-600 text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
                                            <FaCheck className="text-[8px]" /> Apostille
                                        </span>
                                    )}
                                    {projectData.classification === 'ja' && (
                                        <span className="text-purple-600 text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
                                            <FaCheck className="text-[8px]" /> Klassifiziert
                                        </span>
                                    )}
                                    {projectData.copies > 0 && (
                                        <span className="text-slate-600 text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
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
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Projektstatus</span>
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
                                                    "px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border w-fit shadow-xs",
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
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Versandstatus</span>
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
                                    {!projectData.documentsSent ? (
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => {
                                                    const hasFiles = projectData.files && projectData.files.length > 0;
                                                    if (!hasFiles) {
                                                        toast.error('Bitte laden Sie zuerst die Zieldateien hoch, bevor Sie diese versenden.');
                                                        return;
                                                    }
                                                    updateProjectMutation.mutate({ documents_sent: true });
                                                }}
                                                className="h-8 px-4 font-bold text-[11px] bg-brand-primary border-none shadow-none"
                                            >
                                                VERSENDEN
                                            </Button>
                                            {onSendEmail && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onSendEmail('customer')}
                                                    className="h-8 px-3 font-bold text-[11px] flex items-center gap-2"
                                                >
                                                    <FaEnvelope className="text-[10px]" /> E-Mail senden
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => updateProjectMutation.mutate({ documents_sent: false })}
                                            className="h-auto p-0 text-slate-400 hover:text-slate-600 font-bold text-[10px]"
                                        >
                                            Rückgängig
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">Interne Notizen</h5>
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
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Quelldateien</span>
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
                                                                <span className="text-[10px] font-bold text-slate-700 truncate group-hover:text-emerald-700">{file.name}</span>
                                                                <span className="text-[9px] text-slate-400 font-medium">{formatFileSize(file.size)}</span>
                                                            </div>
                                                            <FaExternalLinkAlt className="text-[8px] text-slate-200 group-hover:text-emerald-400 transition-colors" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {targetFiles.length > 0 && (
                                            <div className="space-y-2">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Übersetzungen</span>
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
                                                                <span className="text-[10px] font-bold text-slate-700 truncate group-hover:text-blue-700">{file.name}</span>
                                                                <span className="text-[9px] text-slate-400 font-medium">{formatFileSize(file.size)}</span>
                                                            </div>
                                                            <FaCheckCircle className="text-[8px] text-slate-200 group-hover:text-blue-400 transition-colors" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activeInvoice && (
                                            <div className="space-y-2">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Abrechnung</span>
                                                <button
                                                    onClick={() => setPreviewInvoice(activeInvoice)}
                                                    className="flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-sm hover:border-purple-200 hover:bg-purple-50/20 transition-all group text-left w-full"
                                                >
                                                    <div className="shrink-0 text-xs text-purple-500">
                                                        <FaFileInvoiceDollar />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="text-[10px] font-bold text-slate-700 truncate group-hover:text-purple-700">{activeInvoice.invoice_number}</span>
                                                        <span className="text-[9px] text-slate-400 font-medium">Rechnung (PDF)</span>
                                                    </div>
                                                    <FaExternalLinkAlt className="text-[8px] text-slate-200 group-hover:text-purple-400 transition-colors" />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-8 text-center bg-slate-50/30 rounded-sm border border-dashed border-slate-200">
                                        <FaFileAlt className="text-slate-200 text-xl mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Keine Dokumente</p>
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
