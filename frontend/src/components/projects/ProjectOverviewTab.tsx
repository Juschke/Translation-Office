import { FaArrowRight, FaCheck, FaCheckCircle, FaClock, FaBolt, FaFlag, FaAt, FaPhone, FaExternalLinkAlt, FaFileInvoiceDollar, FaUserPlus, FaCopy, FaPaperPlane, FaStar } from 'react-icons/fa';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import { getCountryName } from '../../utils/countries';

interface ProjectOverviewTabProps {
    projectData: any;
    sourceLang: { flagUrl: string; name: string };
    targetLang: { flagUrl: string; name: string };
    deadlineStatus: { label: string; color: string; icon: React.ReactNode };
    getStatusBadge: (status: string) => React.ReactNode;
    navigate: (path: string, opts?: any) => void;
    locationPathname: string;
    setIsCustomerSearchOpen: (open: boolean) => void;
    setIsPartnerModalOpen: (open: boolean) => void;
    updateProjectMutation: any;
}

const ProjectOverviewTab = ({
    projectData,
    sourceLang,
    targetLang,
    deadlineStatus,
    getStatusBadge,
    navigate,
    locationPathname,
    setIsCustomerSearchOpen,
    setIsPartnerModalOpen,
    updateProjectMutation,
}: ProjectOverviewTabProps) => {
    return (
        <div className="animate-fadeIn space-y-8 pb-10">
            {/* Top Stats Bar / Overview Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-sm border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(projectData.status)}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-sm border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Liefertermin</span>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 text-sm">
                            {projectData.due ? new Date(projectData.due).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                        </span>
                        <div className={clsx("px-2 py-0.5 rounded text-[10px] font-bold border capitalize", deadlineStatus.color)}>
                            {deadlineStatus.label}
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-sm border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sprachpaar</span>
                    <div className="flex items-center gap-2">
                        <img src={sourceLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px] object-cover shadow-sm" />
                        <span className="text-xs font-bold text-slate-600">{sourceLang.name}</span>
                        <FaArrowRight className="text-slate-300 text-[10px]" />
                        <img src={targetLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px] object-cover shadow-sm" />
                        <span className="text-xs font-bold text-slate-600">{targetLang.name}</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-sm border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Typ</span>
                    <div className="flex flex-wrap gap-1">
                        {projectData.docType.slice(0, 2).map((d: string) => (
                            <span key={d} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[10px] font-bold border border-slate-100 uppercase tracking-tight">
                                {d}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Project Details & Notes */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white p-8 rounded-sm border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Projekt-Informationen</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Projektname</label>
                                    <p className="text-base font-bold text-slate-900 leading-snug">{projectData.name}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Dokumententyp</label>
                                    <div className="flex flex-wrap gap-2">
                                        {projectData.docType.length > 0 ? projectData.docType.map((d: string) => (
                                            <span key={d} className="px-2.5 py-1 bg-slate-50 text-slate-900 rounded-sm text-xs font-semibold border border-slate-100">
                                                {d}
                                            </span>
                                        )) : <span className="text-slate-300 italic">Keine Angabe</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Inkludierte Leistungen</label>
                                    <div className="flex flex-wrap gap-2">
                                        {projectData.isCertified && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-sm border border-emerald-100 shadow-sm">
                                                <FaCheckCircle className="text-emerald-400" /> Beglaubigung
                                            </span>
                                        )}
                                        {projectData.hasApostille && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-sm border border-amber-100 shadow-sm">
                                                <FaCheckCircle className="text-amber-400" /> Apostille
                                            </span>
                                        )}
                                        {projectData.isExpress && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-[10px] font-bold uppercase rounded-sm border border-red-100 shadow-sm animate-pulse">
                                                <FaBolt className="text-red-400" /> Express
                                            </span>
                                        )}
                                        {projectData.copies > 0 && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-700 text-[10px] font-bold uppercase rounded-sm border border-slate-200 shadow-sm">
                                                <FaCopy /> {projectData.copies}x Kopie
                                            </span>
                                        )}
                                        {!projectData.isCertified && !projectData.hasApostille && !projectData.isExpress && projectData.copies <= 0 && (
                                            <span className="text-slate-300 italic text-sm">Keine Zusatzleistungen</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Lieferdatum</label>
                                        <p className="text-sm font-bold text-slate-800">
                                            {projectData.due ? new Date(projectData.due).toLocaleDateString('de-DE') : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">PM</label>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                                {projectData.pm?.[0] || 'A'}
                                            </div>
                                            <p className="text-sm font-bold text-slate-800">{projectData.pm || 'Auto'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Interne Notizen</label>
                            <div className="bg-slate-50/50 p-6 rounded-sm border border-slate-100 min-h-[120px] text-sm text-slate-600 leading-relaxed whitespace-pre-wrap transition-all hover:bg-white hover:shadow-soft">
                                {projectData.notes || <span className="italic text-slate-300">Keine internen Notizen hinterlegt.</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Customer & Partner Cards */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Customer Card */}
                    <div className="bg-white rounded-sm border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                        <div className="p-5 flex items-center justify-between bg-slate-50/30 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auftraggeber</span>
                            <div className="flex gap-3">
                                <button onClick={() => setIsCustomerSearchOpen(true)} className="text-[10px] uppercase font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Wechseln</button>
                                {projectData.customer_id && (
                                    <button onClick={() => navigate(`/customers/${projectData.customer_id}`)} className="text-slate-400 hover:text-slate-700"><FaExternalLinkAlt size={10} /></button>
                                )}
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold shadow-sm group-hover:scale-110 transition-transform">
                                    {projectData.customer.initials || projectData.customer.name?.[0] || 'C'}
                                </div>
                                <div className="min-w-0">
                                    <h5 className="font-bold text-slate-900 truncate" title={projectData.customer.name}>{projectData.customer.name}</h5>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Kunden-ID: {projectData.customer.id}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <FaAt className="text-slate-300 mt-1 shrink-0" size={14} />
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-400 block -mb-0.5">E-Mail</p>
                                        <a href={`mailto:${projectData.customer.email}`} className="text-sm font-semibold text-slate-700 hover:text-indigo-600 truncate block">{projectData.customer.email || '-'}</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <FaPhone className="text-slate-300 mt-1 shrink-0" size={14} />
                                    <div>
                                        <p className="text-xs text-slate-400 block -mb-0.5">Telefon</p>
                                        <p className="text-sm font-semibold text-slate-700">{projectData.customer.phone || '-'}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ansprechpartner</p>
                                    <p className="text-sm font-semibold text-slate-800">{projectData.customer.contact || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Partner Card */}
                    <div className="bg-white rounded-sm border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                        <div className="p-5 flex items-center justify-between bg-slate-50/30 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dienstleister</span>
                            <div className="flex gap-3">
                                <button onClick={() => setIsPartnerModalOpen(true)} className="text-[10px] uppercase font-bold text-emerald-600 hover:text-emerald-800 transition-colors">Zuweisen</button>
                                {projectData.translator?.id && (
                                    <button onClick={() => navigate(`/partners/${projectData.translator.id}`)} className="text-slate-400 hover:text-slate-700"><FaExternalLinkAlt size={10} /></button>
                                )}
                            </div>
                        </div>
                        <div className="p-6">
                            {projectData.translator?.id ? (
                                <>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold shadow-sm group-hover:scale-110 transition-transform">
                                            {projectData.translator.initials || projectData.translator.name?.[0] || 'P'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h5 className="font-bold text-slate-900 truncate" title={projectData.translator.name}>{projectData.translator.name}</h5>
                                                {projectData.translator.rating > 0 && (
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded text-amber-500 text-[10px] font-bold">
                                                        <FaStar size={8} /> {projectData.translator.rating.toFixed(1)}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Partner-ID: {projectData.translator.id}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <FaAt className="text-slate-300 mt-1 shrink-0" size={14} />
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-400 block -mb-0.5">E-Mail</p>
                                                <a href={`mailto:${projectData.translator.email}`} className="text-sm font-semibold text-slate-700 hover:text-emerald-600 truncate block">{projectData.translator.email || '-'}</a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <FaPhone className="text-slate-300 mt-1 shrink-0" size={14} />
                                            <div>
                                                <p className="text-xs text-slate-400 block -mb-0.5">Telefon</p>
                                                <p className="text-sm font-semibold text-slate-700">{projectData.translator.phone || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                        {!projectData.documentsSent ? (
                                            <button
                                                className="w-full py-2.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.1em] rounded-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                                onClick={() => {
                                                    const hasFiles = projectData.files && projectData.files.length > 0;
                                                    if (!hasFiles) {
                                                        toast.error('Bitte laden Sie zuerst die Zieldateien hoch, bevor Sie diese versenden.');
                                                        return;
                                                    }
                                                    updateProjectMutation.mutate({ documents_sent: true });
                                                }}
                                            >
                                                <FaPaperPlane size={10} /> DOKUMENTE SENDEN
                                            </button>
                                        ) : (
                                            <div className="w-full py-2.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-[0.1em] rounded-sm flex items-center justify-center gap-2 border border-emerald-100 shadow-sm">
                                                <FaCheckCircle /> VERSAND BESTÄTIGT
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
                                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100 border-dashed">
                                        <FaUserPlus size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Kein Partner zugewiesen</p>
                                    <button onClick={() => setIsPartnerModalOpen(true)} className="px-5 py-2 bg-white text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-slate-200 hover:bg-slate-50 transition shadow-sm">
                                        Partner wählen
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectOverviewTab;
