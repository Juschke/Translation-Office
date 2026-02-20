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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <h3 className="font-black text-[12px] text-slate-800 uppercase tracking-widest flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                        <FaFileInvoiceDollar className="text-brand-500 text-sm" />
                    </div>
                    Projekt-Übersicht
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Status:</span>
                    {getStatusBadge(projectData.status)}
                </div>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-y-12 gap-x-16">
                {/* Left Column: Core Info & Customer */}
                <div className="space-y-10">
                    {/* Section: Basisdaten */}
                    <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 pb-3 mb-6">Basisdaten</h4>
                        <div className="grid grid-cols-[130px_1fr] gap-y-4 gap-x-6 text-sm">
                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Projekt-ID</span>
                            <span className="text-slate-800 font-black tracking-tight">{projectData.id}</span>

                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Bezeichnung</span>
                            <span className="text-slate-800 font-semibold">{projectData.name}</span>

                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Sprachpaar</span>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-sm text-[11px] text-slate-700 shadow-sm font-bold">
                                    <img src={sourceLang.flagUrl} alt="" className="w-4 h-3 rounded-[2px] object-cover" />
                                    {sourceLang.name}
                                </div>
                                <FaArrowRight className="text-slate-300 text-xs" />
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-sm text-[11px] text-slate-700 shadow-sm font-bold">
                                    <img src={targetLang.flagUrl} alt="" className="w-4 h-3 rounded-[2px] object-cover" />
                                    {targetLang.name}
                                </div>
                            </div>

                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Termin</span>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-slate-800 font-semibold bg-slate-50 px-2 py-1 rounded">
                                    {projectData.due ? (() => {
                                        const d = new Date(projectData.due);
                                        const days = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
                                        return `${days[d.getDay()]}, ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} | ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
                                    })() : <span className="text-slate-400 italic font-normal">Keine Angabe</span>}
                                </span>
                                {projectData.due && (
                                    <div className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm", deadlineStatus.color)}>
                                        {deadlineStatus.label}
                                    </div>
                                )}
                            </div>

                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Priorität</span>
                            <div>
                                {projectData.priority === 'low' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-slate-100 text-slate-500 border border-slate-200">
                                        <FaClock /> Standard
                                    </span>
                                ) : projectData.priority === 'medium' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-blue-50 text-blue-700 border border-blue-200">
                                        <FaFlag /> Normal
                                    </span>
                                ) : (
                                    <span className={clsx("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border",
                                        projectData.priority === 'express' || projectData.priority === 'high' ? "bg-red-50 text-red-700 border-red-200" : "bg-orange-50 text-orange-700 border-orange-200"
                                    )}>
                                        {projectData.priority === 'express' || projectData.priority === 'high' ? <FaBolt /> : <FaFlag />}
                                        {projectData.priority === 'express' || projectData.priority === 'high' ? 'Express-Service' : 'Hohe Priorität'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section: Kunde */}
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Kunde / Auftraggeber</h4>
                            <div className="flex gap-4">
                                {projectData.customer_id && (
                                    <button
                                        onClick={() => navigate(`/customers/${projectData.customer_id}`, { state: { from: locationPathname } })}
                                        className="text-[10px] text-slate-400 font-bold hover:text-brand-600 flex items-center gap-1.5 transition-colors uppercase tracking-widest"
                                    >
                                        <FaExternalLinkAlt className="text-[9px]" /> Akte öffnen
                                    </button>
                                )}
                                <button onClick={() => setIsCustomerSearchOpen(true)} className="text-[10px] text-brand-600 font-black uppercase tracking-widest hover:underline">Ändern</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-[130px_1fr] gap-y-4 gap-x-6 text-sm">
                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Kunden-ID</span>
                            <span className="text-slate-800 font-black">{projectData.customer.id}</span>

                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Name / Firma</span>
                            <span className="text-slate-800 font-black text-base tracking-tight">{projectData.customer.name}</span>

                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Ansprechpartner</span>
                            <span className="text-slate-700 font-medium">{projectData.customer.contact || <span className="text-slate-300 italic">Keine Angabe</span>}</span>

                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Adresse</span>
                            <div className="text-slate-700 leading-relaxed">
                                {projectData.customer.address_street} {projectData.customer.address_house_no}<br />
                                {projectData.customer.address_zip} {projectData.customer.address_city}<br />
                                <span className="text-[10px] font-bold uppercase text-slate-400">
                                    {projectData.customer.address_country === 'DE' ? 'Deutschland' :
                                        projectData.customer.address_country === 'AT' ? 'Österreich' :
                                            projectData.customer.address_country === 'CH' ? 'Schweiz' :
                                                projectData.customer.address_country}
                                </span>
                            </div>

                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Kontakt</span>
                            <div className="space-y-1">
                                {projectData.customer.email ? (
                                    <a href={`mailto:${projectData.customer.email}`} className="text-brand-600 font-bold hover:underline flex items-center gap-2">
                                        <FaAt className="text-xs opacity-50" /> {projectData.customer.email}
                                    </a>
                                ) : <span className="text-slate-300 text-xs">Keine E-Mail</span>}
                                {projectData.customer.phone && (
                                    <div className="text-slate-600 font-medium text-xs flex items-center gap-2">
                                        <FaPhone className="text-xs opacity-50" /> {projectData.customer.phone}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 justify-end flex-wrap">
                        </div>
                    </div>
                </div>

                {/* Right Column: Order Details & Partner */}
                <div className="space-y-10">
                    {/* Section: Auftragsdetails */}
                    <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 pb-3 mb-6">Auftragsdetails</h4>
                        <div className="grid grid-cols-[130px_1fr] gap-y-4 gap-x-6 text-sm">
                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Dokumentenart</span>
                            <div className="flex flex-wrap gap-2">
                                {projectData.docType.length > 0 ? projectData.docType.map((d: string) => (
                                    <span key={d} className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-sm text-[10px] font-black uppercase tracking-tight border border-brand-100">
                                        {d}
                                    </span>
                                )) : <span className="text-slate-300 italic">Keine Angabe</span>}
                            </div>

                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Services</span>
                            <div className="space-y-2">
                                {!projectData.isCertified && !projectData.hasApostille && !projectData.isExpress && projectData.classification !== 'ja' && projectData.copies <= 0 && (
                                    <span className="text-slate-300 italic">Keine Besonderheiten</span>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {projectData.isCertified && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                                            <FaCheck /> Beglaubigt
                                        </span>
                                    )}
                                    {projectData.hasApostille && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-100 shadow-sm">
                                            <FaCheck /> Apostille
                                        </span>
                                    )}
                                    {projectData.classification === 'ja' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-100 shadow-sm">
                                            <FaCheck /> Klassifiziert
                                        </span>
                                    )}
                                    {projectData.copies > 0 && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-50 text-slate-700 border border-slate-200 shadow-sm">
                                            <FaCopy /> {projectData.copies}x Kopie
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Partner */}
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Ausführender Partner</h4>
                            <div className="flex gap-4">
                                {projectData.translator?.id && (
                                    <button
                                        onClick={() => navigate(`/partners/${projectData.translator.id}`, { state: { from: locationPathname } })}
                                        className="text-[10px] text-slate-400 font-bold hover:text-brand-600 flex items-center gap-1.5 transition-colors uppercase tracking-widest"
                                    >
                                        <FaExternalLinkAlt className="text-[9px]" /> Akte öffnen
                                    </button>
                                )}
                                <button onClick={() => setIsPartnerModalOpen(true)} className="text-[10px] text-brand-600 font-black uppercase tracking-widest hover:underline">Ändern</button>
                            </div>
                        </div>

                        {projectData.translator?.id ? (
                            <div className="grid grid-cols-[130px_1fr] gap-y-4 gap-x-6 text-sm">
                                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Partner-ID</span>
                                <span className="text-slate-800 font-black">{projectData.translator.id}</span>

                                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Name</span>
                                <span className="text-slate-800 font-black text-base tracking-tight">{projectData.translator.name}</span>

                                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Bewertung</span>
                                <div className="flex items-center gap-1.5 text-amber-400">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <FaStar key={star} className={star <= (projectData.translator.rating || 0) ? "text-amber-400" : "text-slate-200"} />
                                    ))}
                                    <span className="text-[10px] font-black text-slate-400 ml-1">({(projectData.translator.rating || 0).toFixed(1)})</span>
                                </div>

                                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Adresse</span>
                                <div className="text-slate-700 leading-relaxed">
                                    {projectData.translator.address_street} {projectData.translator.address_house_no}<br />
                                    {projectData.translator.address_zip} {projectData.translator.address_city}<br />
                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                        {projectData.translator.address_country === 'DE' ? 'Deutschland' :
                                            projectData.translator.address_country === 'AT' ? 'Österreich' :
                                                projectData.translator.address_country === 'CH' ? 'Schweiz' :
                                                    (projectData.translator.address_country ? getCountryName(projectData.translator.address_country) : '') || projectData.translator.address_country}
                                    </span>
                                </div>

                                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Kontakt</span>
                                <div className="space-y-1">
                                    {projectData.translator.email ? (
                                        <a href={`mailto:${projectData.translator.email}`} className="text-brand-600 font-bold hover:underline flex items-center gap-2">
                                            <FaAt className="text-xs opacity-50" /> {projectData.translator.email}
                                        </a>
                                    ) : <span className="text-slate-300 text-xs">Keine E-Mail</span>}
                                    {projectData.translator.phone && (
                                        <div className="text-slate-600 font-medium text-xs flex items-center gap-2">
                                            <FaPhone className="text-xs opacity-50" /> {projectData.translator.phone}
                                        </div>
                                    )}
                                </div>

                                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Konditionen</span>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const rates = Array.isArray(projectData.translator.unit_rates) ? projectData.translator.unit_rates : [];
                                        const wordRate = rates.find((r: any) => r.type?.toLowerCase() === 'word')?.price;
                                        const lineRate = rates.find((r: any) => r.type?.toLowerCase() === 'line')?.price;
                                        return (
                                            <>
                                                {wordRate && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black border border-slate-200 uppercase">Wort: {parseFloat(wordRate).toLocaleString('de-DE', { minimumFractionDigits: 4 })} €</span>}
                                                {lineRate && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black border border-slate-200 uppercase">Zeile: {parseFloat(lineRate).toLocaleString('de-DE', { minimumFractionDigits: 4 })} €</span>}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-slate-300 shadow-sm mb-4">
                                    <FaUserPlus className="text-2xl" />
                                </div>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Kein Partner zugewiesen</p>
                                <button onClick={() => setIsPartnerModalOpen(true)} className="mt-4 px-4 py-2 bg-white text-brand-600 text-[10px] font-black uppercase tracking-widest rounded-sm border border-brand-200 hover:bg-brand-50 transition shadow-sm">
                                    Partner auswählen
                                </button>
                            </div>
                        )}

                        <div className="mt-8 flex gap-3 justify-end">
                            {!projectData.documentsSent ? (
                                <button
                                    className="px-5 py-2.5 bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-brand-700 transition shadow-lg shadow-brand-500/20 flex items-center gap-2"
                                    onClick={() => {
                                        const hasFiles = projectData.files && projectData.files.length > 0;
                                        if (!hasFiles) {
                                            toast.error('Bitte laden Sie zuerst die Zieldateien hoch, bevor Sie diese versenden.');
                                            return;
                                        }
                                        updateProjectMutation.mutate({ documents_sent: true });
                                    }}
                                >
                                    <FaPaperPlane className="text-[9px]" /> Dokumente senden
                                </button>
                            ) : (
                                <div className="px-5 py-2.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center gap-2 border border-emerald-100 shadow-sm">
                                    <FaCheckCircle /> Versand bestätigt
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Full Width: Notes */}
                <div className="lg:col-span-2 pt-10 border-t border-slate-100">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Interne Notizen</h4>
                    <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 min-h-[100px] text-sm text-slate-600 leading-relaxed whitespace-pre-wrap shadow-inner font-medium">
                        {projectData.notes || <span className="italic text-slate-300">Keine internen Notizen hinterlegt.</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectOverviewTab;
