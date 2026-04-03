import { FaCheck, FaCheckCircle, FaExternalLinkAlt, FaFileInvoiceDollar, FaCopy, FaStar, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive, FaEnvelope, FaEdit, FaInfoCircle } from 'react-icons/fa';
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
        return <FaFileAlt className="text-slate-800" />;
    };

    return (
        <div className="bg-white rounded-sm border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-slate-100 bg-slate-50/10 flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center">
                        <FaInfoCircle className="text-slate-600 text-sm" />
                    </div>
                    Stammdaten
                </h3>
                <div className="flex items-center gap-2">
                    {onCreateInvoice && !activeInvoice && ['delivered', 'invoiced'].includes(projectData?.status) && (
                        <Button variant="default" size="sm" onClick={onCreateInvoice} className="h-8 text-[11px] font-bold">Rechnung erstellen</Button>
                    )}
                </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content Column */}
                    <div className="flex-1 space-y-8">
                        {/* Basisdaten */}
                        <section className="border border-slate-200 rounded-sm p-6 bg-white">
                            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-2">
                                <h4 className="text-xs font-bold text-slate-800">Basisdaten</h4>
                            </div>
                            <div className="space-y-0 text-sm">
                                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                    <span className="text-sm font-medium text-slate-600">Projekt-ID</span>
                                    <span className="font-black text-slate-900">{projectData.project_number || `#${projectData.id}`}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                    <span className="text-sm font-medium text-slate-600">Bezeichnung</span>
                                    <span className="font-bold text-slate-800 truncate max-w-[300px]" title={projectData.name || projectData.project_name}>
                                        {projectData.name || projectData.project_name || <span className="text-slate-300 italic font-normal">Keine Angabe</span>}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                    <span className="text-sm font-medium text-slate-600">Eingangssprache</span>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] text-slate-700 font-bold">
                                        <img src={sourceLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px] object-cover" />
                                        {sourceLang.name}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                    <span className="text-sm font-medium text-slate-600">Zielsprache</span>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-brand-primary/[0.03] border border-brand-primary/10 rounded-full text-[11px] text-brand-primary font-bold">
                                        <img src={targetLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px] object-cover" />
                                        {targetLang.name}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                    <span className="text-sm font-medium text-slate-600">Dokumententyp</span>
                                    <div className="font-semibold text-slate-800">
                                        {projectData.docType && projectData.docType.length > 0 ? projectData.docType.join(', ') : <span className="text-slate-300 italic font-normal">Keine Angabe</span>}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm font-medium text-slate-600">Optionen</span>
                                    <div className="flex flex-wrap justify-end gap-2">
                                        {!projectData.isCertified && !projectData.hasApostille && !projectData.isExpress && projectData.classification !== 'ja' && projectData.copies <= 0 && (
                                            <span className="text-slate-400 italic text-xs">Standard</span>
                                        )}
                                        {projectData.isCertified && (
                                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                                <FaCheck className="text-[8px]" /> Beglaubigt
                                            </span>
                                        )}
                                        {projectData.hasApostille && (
                                            <span className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                                <FaCheck className="text-[8px]" /> Apostille
                                            </span>
                                        )}
                                        {projectData.classification === 'ja' && (
                                            <span className="bg-purple-50 text-purple-700 border border-purple-100 px-3 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                                <FaCheck className="text-[8px]" /> Klassifiziert
                                            </span>
                                        )}
                                        {projectData.isExpress && (
                                            <span className="bg-red-50 text-red-700 border border-red-100 px-3 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                                <FaCheck className="text-[8px]" /> Express
                                            </span>
                                        )}
                                        {projectData.copies > 0 && (
                                            <span className="bg-slate-50 text-slate-700 border border-slate-200 px-3 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                                <FaCopy className="text-[8px]" /> {projectData.copies}x Kopie
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Customer & Partner Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Customer Info */}
                            <section className="border border-slate-200 rounded-sm p-6 bg-white">
                                <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h4 className="text-xs font-bold text-slate-800">Kunde</h4>
                                    <div className="flex items-center gap-2">
                                        <Button variant="link" size="sm" onClick={() => setIsCustomerSearchOpen(true)} className="h-auto p-0 text-brand-primary text-[11px] font-bold">Ändern</Button>
                                        <div className="w-px h-3 bg-slate-300" />
                                        {projectData.customer_id && (
                                            <button
                                                onClick={() => navigate(`/customers/${projectData.customer_id}`, { state: { from: locationPathname } })}
                                                className="text-slate-400 hover:text-brand-primary transition-colors"
                                            >
                                                <FaExternalLinkAlt size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-sm bg-slate-50 border border-slate-200 flex items-center justify-center text-lg font-bold text-slate-400 shrink-0">
                                            {(projectData.customer.name || '?').charAt(0)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-slate-900 text-base leading-tight truncate">{projectData.customer.name || '-'}</span>
                                            <span className="text-[11px] font-bold text-slate-400">ID: {projectData.customer.display_id || projectData.customer.id || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400">Adresse</span>
                                            <div className="text-sm text-slate-700 leading-snug">
                                                {projectData.customer.address_street}{projectData.customer.address_house_no ? ` ${projectData.customer.address_house_no}` : ''}<br />
                                                {projectData.customer.address_zip} {projectData.customer.address_city}<br />
                                                {projectData.customer.address_country === 'DE' ? 'Deutschland'
                                                    : projectData.customer.address_country === 'AT' ? 'Österreich'
                                                        : projectData.customer.address_country === 'CH' ? 'Schweiz'
                                                            : projectData.customer.address_country}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-slate-400">Kontakt</span>
                                            <div className="space-y-1.5">
                                                {projectData.customer.email && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                                        <FaEnvelope className="text-slate-300 shrink-0" />
                                                        <a href={`mailto:${projectData.customer.email}`} className="hover:underline font-medium break-all">{projectData.customer.email}</a>
                                                    </div>
                                                )}
                                                {projectData.customer.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                                        <div className="w-3.5 flex items-center justify-center shrink-0">
                                                            <span className="text-[10px] font-bold text-slate-300">TEL</span>
                                                        </div>
                                                        <a href={`tel:${projectData.customer.phone}`} className="hover:underline font-medium">{projectData.customer.phone}</a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsCustomerEditModalOpen(true)}
                                        className="w-full py-2.5 bg-brand-primary border border-brand-primary rounded-sm text-xs font-bold text-white hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 mt-4 shadow-sm"
                                    >
                                        <FaEdit /> Daten bearbeiten
                                    </button>
                                </div>
                            </section>

                            {/* Partner Info */}
                            <section className="border border-slate-200 rounded-sm p-6 bg-white">
                                <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h4 className="text-xs font-bold text-slate-800">Partner / Übersetzer</h4>
                                    <div className="flex items-center gap-2">
                                        <Button variant="link" size="sm" onClick={() => setIsPartnerModalOpen(true)} className="h-auto p-0 text-brand-primary text-[11px] font-bold">Ändern</Button>
                                        {projectData.translator?.id && (
                                            <>
                                                <div className="w-px h-3 bg-slate-300" />
                                                <button
                                                    onClick={() => navigate(`/partners/${projectData.translator.id}`, { state: { from: locationPathname } })}
                                                    className="text-slate-400 hover:text-brand-primary transition-colors"
                                                >
                                                    <FaExternalLinkAlt size={12} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {projectData.translator?.id ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-sm bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600 shrink-0">
                                                {(projectData.translator.name || '?').charAt(0)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-slate-900 text-base leading-tight truncate">{projectData.translator.name}</span>

                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-400">Konditionen</span>

                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {(() => {
                                                        const rates = Array.isArray(projectData.translator.unit_rates) ? projectData.translator.unit_rates : [];
                                                        const wordRate = rates.find((r: any) => r.type?.toLowerCase() === 'word')?.price;
                                                        const lineRate = rates.find((r: any) => r.type?.toLowerCase() === 'line')?.price;
                                                        if (!wordRate && !lineRate) return <span className="text-slate-300 italic text-xs">Keine Konditionen</span>;
                                                        return (
                                                            <>
                                                                {wordRate && <span className="text-slate-600 text-[10px] font-bold bg-slate-50 px-2 py-1 rounded-sm border border-slate-200">Wort: {parseFloat(wordRate).toLocaleString('de-DE', { minimumFractionDigits: 3 })}€</span>}
                                                                {lineRate && <span className="text-slate-600 text-[10px] font-bold bg-slate-50 px-2 py-1 rounded-sm border border-slate-200">Zeile: {parseFloat(lineRate).toLocaleString('de-DE', { minimumFractionDigits: 3 })}€</span>}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 ml-1">Rating</span>
                                                <div className="flex items-center gap-2 pt-1 mt-0.5">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <FaStar key={star} size={10} className={star <= (projectData.translator.rating || 0) ? "text-amber-400" : "text-slate-200"} />
                                                    ))}

                                                </div>

                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-bold text-slate-400">Kontakt</span>
                                                <div className="space-y-1.5">
                                                    {projectData.translator.email && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                                            <FaEnvelope className="text-slate-300 shrink-0" />
                                                            <a href={`mailto:${projectData.translator.email}`} className="hover:underline font-medium break-all">{projectData.translator.email}</a>
                                                        </div>
                                                    )}
                                                    {projectData.translator.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                                            <div className="w-3.5 flex items-center justify-center shrink-0">
                                                                <span className="text-[10px] font-bold text-slate-300">TEL</span>
                                                            </div>
                                                            <a href={`tel:${projectData.translator.phone}`} className="hover:underline font-medium">{projectData.translator.phone}</a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsPartnerEditModalOpen(true)}
                                            className="w-full py-2.5 bg-brand-primary border border-brand-primary rounded-sm text-xs font-bold text-white hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 mt-4 shadow-sm"
                                        >
                                            <FaEdit /> Daten bearbeiten
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-sm border border-dashed border-slate-200 h-full min-h-[200px]">
                                        <p className="text-slate-400 font-bold text-[10px]">Kein Partner zugewiesen</p>
                                        <Button variant="default" size="sm" onClick={() => setIsPartnerModalOpen(true)} className="mt-3 bg-brand-primary h-8 px-6 text-[11px] font-bold">Partner zuweisen</Button>
                                    </div>
                                )}
                            </section>
                        </div>

                    </div>

                    {/* Sidebar Meta Column */}
                    <aside className="w-full lg:w-80 space-y-8">
                        {/* Status Section */}
                        <section className="border border-slate-200 rounded-sm p-6 bg-white shadow-sm">
                            <h4 className="text-[10px] font-bold text-slate-400 mb-4 border-b border-slate-100 pb-2">Projektstatus</h4>
                            <div className="space-y-6">
                                <div>
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
                                            <div className={clsx(
                                                "w-full py-3 rounded-sm text-sm font-black text-center border shadow-sm",
                                                colorClasses[status] || 'bg-slate-50 text-slate-600 border-slate-200'
                                            )}>
                                                {labels[status] || status}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400">Fälligkeit</span>
                                        <div className="text-sm font-bold text-slate-800">
                                            {projectData.due ? (() => {
                                                const d = new Date(projectData.due);
                                                const days = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];
                                                return `${days[d.getDay()]}, ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} | ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
                                            })() : <span className="text-slate-300 italic font-normal">Keine Angabe</span>}
                                        </div>
                                        {projectData.due && (
                                            <div className={clsx("text-[10px] font-bold mt-0.5", deadlineStatus.color.split(' ')[1])}>
                                                {deadlineStatus.label}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400">Versand</span>
                                        <div className={clsx(
                                            "text-xs font-bold",
                                            projectData.documentsSent ? "text-emerald-600" : "text-slate-400 italic"
                                        )}>
                                            {projectData.documentsSent ? 'Erfolgt' : 'Ausstehend'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Files Section */}
                        <section className="border border-slate-200 rounded-sm p-6 bg-white shadow-sm">
                            <h4 className="text-[10px] font-bold text-slate-400 mb-4 border-b border-slate-100 pb-2">Dateien</h4>
                            <div className="space-y-6">
                                {sourceFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-bold text-slate-400 block">Quelle ({sourceFiles.length})</span>
                                        <div className="space-y-1.5">
                                            {sourceFiles.map((file: any) => (
                                                <button
                                                    key={file.id} onClick={() => handlePreviewFile(file)}
                                                    className="w-full flex items-center justify-between p-2 bg-slate-50/50 border border-slate-100 rounded-sm hover:border-slate-300 transition-all group"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <div className="shrink-0 scale-75">{getFileIcon(file.name)}</div>
                                                        <span className="text-[10px] font-bold text-slate-700 truncate">{file.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">{formatFileSize(file.size)}</span>
                                                        <FaExternalLinkAlt className="text-[8px] text-slate-300 group-hover:text-slate-500" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {targetFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-bold text-slate-400 block">Übersetzung ({targetFiles.length})</span>
                                        <div className="space-y-1.5">
                                            {targetFiles.map((file: any) => (
                                                <button
                                                    key={file.id} onClick={() => handlePreviewFile(file)}
                                                    className="w-full flex items-center justify-between p-2 bg-blue-50/20 border border-blue-100 rounded-sm hover:border-blue-300 transition-all group"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <div className="shrink-0 scale-75 text-blue-500">{getFileIcon(file.name)}</div>
                                                        <span className="text-[10px] font-bold text-slate-700 truncate">{file.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] text-blue-400/60 font-medium whitespace-nowrap">{formatFileSize(file.size)}</span>
                                                        <FaCheckCircle className="text-[8px] text-blue-300 group-hover:text-blue-500" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {activeInvoice && (
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-bold text-slate-400 block">Rechnung</span>
                                        <button
                                            onClick={() => setPreviewInvoice(activeInvoice)}
                                            className="w-full flex items-center justify-between p-2 bg-purple-50/30 border border-purple-100 rounded-sm hover:border-purple-300 transition-all group"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FaFileInvoiceDollar className="text-purple-500" size={10} />
                                                <span className="text-[10px] font-bold text-purple-900 truncate">{activeInvoice.invoice_number}</span>
                                            </div>
                                            <FaExternalLinkAlt className="text-[8px] text-purple-300 group-hover:text-purple-500" />
                                        </button>
                                    </div>
                                )}
                                {(sourceFiles.length === 0 && targetFiles.length === 0 && !activeInvoice) && (
                                    <div className="py-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-sm">
                                        <p className="text-[10px] font-bold text-slate-300">Keine Dateien</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Internal Notes */}
                        <section className="border border-slate-200 rounded-sm p-6 bg-white shadow-sm">
                            <h4 className="text-[10px] font-bold text-slate-400 mb-4 border-b border-slate-100 pb-2">Interne Notizen</h4>
                            <div className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap font-medium bg-slate-50/30 p-4 rounded-sm border border-slate-100 min-h-[120px]">
                                {projectData.notes || <span className="italic text-slate-300 font-normal text-[10px]">Keine Notizen erfasst.</span>}
                            </div>
                        </section>
                    </aside>
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
