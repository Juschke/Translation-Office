import { FaArrowRight, FaCheck, FaCheckCircle, FaClock, FaBolt, FaFlag, FaAt, FaPhone, FaExternalLinkAlt, FaFileInvoiceDollar, FaUserPlus, FaCopy, FaPaperPlane, FaStar } from 'react-icons/fa';
import { Button } from '../ui/button';
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
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
            <div className="px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                        <FaFileInvoiceDollar className="text-slate-600 text-sm" />
                    </div>
                    Projekt-Übersicht
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 hidden sm:inline">Status:</span>
                    {getStatusBadge(projectData.status)}
                </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-y-12 gap-x-16">
                {/* Left Column: Core Info & Customer */}
                <div className="space-y-10">
                    {/* Section: Basisdaten */}
                    <div>
                        <h4 className="text-xs font-semibold text-slate-400 border-b border-slate-100 pb-3 mb-4 md:mb-6">Basisdaten</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-y-2 sm:gap-y-4 gap-x-6 text-sm">
                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Projekt-ID</span>
                            <span className="text-slate-800 font-medium tracking-tight break-all">{projectData.id || <span className="text-slate-300 italic">Keine Angabe</span>}</span>

                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Bezeichnung</span>
                            <span className="text-slate-800 font-bold break-words">{projectData.name || <span className="text-slate-300 italic">Keine Angabe</span>}</span>

                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Sprachpaar</span>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-700 shadow-sm font-bold uppercase tracking-tight">
                                    <img src={sourceLang.flagUrl} alt="" className="w-4 h-3 rounded-[2px] object-cover" />
                                    {sourceLang.name}
                                </div>
                                <FaArrowRight className="text-slate-300 text-[10px]" />
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-700 shadow-sm font-bold uppercase tracking-tight">
                                    <img src={targetLang.flagUrl} alt="" className="w-4 h-3 rounded-[2px] object-cover" />
                                    {targetLang.name}
                                </div>
                            </div>

                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Termin</span>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-slate-800 font-bold bg-slate-50 px-2.5 py-1 rounded-sm border border-slate-100 text-[11px]">
                                    {projectData.due ? (() => {
                                        const d = new Date(projectData.due);
                                        const days = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];
                                        return `${days[d.getDay()]}, ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} | ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
                                    })() : <span className="text-slate-300 italic font-normal">Keine Angabe</span>}
                                </span>
                                {projectData.due && (
                                    <div className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border shadow-sm", deadlineStatus.color)}>
                                        {deadlineStatus.label}
                                    </div>
                                )}
                            </div>

                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Priorität</span>
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
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 md:mb-6">
                            <h4 className="text-xs font-semibold text-slate-400">Kunde / Auftraggeber</h4>
                            <div className="flex gap-4">
                                {projectData.customer_id && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => navigate(`/customers/${projectData.customer_id}`, { state: { from: locationPathname } })}
                                        className="h-auto p-0 text-slate-400 font-medium hover:text-brand-primary flex items-center gap-1.5 transition-colors"
                                    >
                                        <FaExternalLinkAlt className="text-xs" /> Akte öffnen
                                    </Button>
                                )}
                                <Button variant="link" size="sm" onClick={() => setIsCustomerSearchOpen(true)} className="h-auto p-0 text-brand-primary font-bold hover:underline">Ändern</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-y-2 sm:gap-y-4 gap-x-6 text-sm">
                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Kunden-ID</span>
                            <span className="text-slate-800 font-medium break-all">{projectData.customer.id || <span className="text-slate-300 italic">Keine Angabe</span>}</span>

                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Name / Firma</span>
                            <span className="text-slate-800 font-bold text-base tracking-tight break-words">{projectData.customer.name || <span className="text-slate-300 italic">Keine Angabe</span>}</span>

                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Ansprechpartner</span>
                            <span className="text-slate-700 font-medium">{projectData.customer.contact || <span className="text-slate-300 italic text-[11px]">Keine Angabe</span>}</span>

                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Adresse</span>
                            <div className="text-slate-700 font-medium leading-relaxed">
                                {projectData.customer.address_street || projectData.customer.address_house_no ? (
                                    <>
                                        {projectData.customer.address_street} {projectData.customer.address_house_no}<br />
                                        {projectData.customer.address_zip} {projectData.customer.address_city}<br />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {projectData.customer.address_country === 'DE' ? 'Deutschland' :
                                                projectData.customer.address_country === 'AT' ? 'Österreich' :
                                                    projectData.customer.address_country === 'CH' ? 'Schweiz' :
                                                        projectData.customer.address_country}
                                        </span>
                                    </>
                                ) : <span className="text-slate-300 italic text-[11px]">Keine Angabe</span>}
                            </div>

                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Kontakt</span>
                            <div className="space-y-1 min-w-0">
                                {projectData.customer.email ? (
                                    <a href={`mailto:${projectData.customer.email}`} className="text-slate-700 font-medium hover:underline flex items-center gap-2 break-all">
                                        <FaAt className="text-xs opacity-50 shrink-0" /> <span className="break-all">{projectData.customer.email}</span>
                                    </a>
                                ) : <div className="text-slate-300 italic text-[11px]">Keine E-Mail</div>}
                                {projectData.customer.phone ? (
                                    <div className="text-slate-600 font-medium text-xs flex items-center gap-2">
                                        <FaPhone className="text-xs opacity-50" /> {projectData.customer.phone}
                                    </div>
                                ) : <div className="text-slate-300 italic text-[11px]">Keine Telefonnummer</div>}
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
                        <h4 className="text-xs font-semibold text-slate-400 border-b border-slate-100 pb-3 mb-4 md:mb-6">Auftragsdetails</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-y-2 sm:gap-y-4 gap-x-6 text-sm">
                            <span className="text-slate-400 font-medium text-sm">Dokumentenart</span>
                            <div className="flex flex-wrap gap-2">
                                {projectData.docType.length > 0 ? projectData.docType.map((d: string) => (
                                    <span key={d} className="px-2.5 py-1 bg-slate-50 text-slate-900 rounded-sm text-xs font-semibold border border-slate-100">
                                        {d}
                                    </span>
                                )) : <span className="text-slate-300 italic">Keine Angabe</span>}
                            </div>

                            <span className="text-slate-400 font-medium text-sm">Services</span>
                            <div className="space-y-2">
                                {!projectData.isCertified && !projectData.hasApostille && !projectData.isExpress && projectData.classification !== 'ja' && projectData.copies <= 0 && (
                                    <span className="text-slate-300 italic">Keine Besonderheiten</span>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {projectData.isCertified && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                                            <FaCheck /> Beglaubigt
                                        </span>
                                    )}
                                    {projectData.hasApostille && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 shadow-sm">
                                            <FaCheck /> Apostille
                                        </span>
                                    )}
                                    {projectData.classification === 'ja' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 shadow-sm">
                                            <FaCheck /> Klassifiziert
                                        </span>
                                    )}
                                    {projectData.copies > 0 && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 shadow-sm">
                                            <FaCopy /> {projectData.copies}x Kopie
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Partner */}
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 md:mb-6">
                            <h4 className="text-xs font-semibold text-slate-400">Ausführender Partner</h4>
                            <div className="flex gap-4">
                                {projectData.translator?.id && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => navigate(`/partners/${projectData.translator.id}`, { state: { from: locationPathname } })}
                                        className="h-auto p-0 text-slate-400 font-medium hover:text-brand-primary flex items-center gap-1.5 transition-colors"
                                    >
                                        <FaExternalLinkAlt className="text-xs" /> Akte öffnen
                                    </Button>
                                )}
                                <Button variant="link" size="sm" onClick={() => setIsPartnerModalOpen(true)} className="h-auto p-0 text-brand-primary font-bold hover:underline">Ändern</Button>
                            </div>
                        </div>

                        {projectData.translator?.id ? (
                            <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-y-2 sm:gap-y-4 gap-x-6 text-sm">
                                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Partner-ID</span>
                                <span className="text-slate-800 font-medium break-all">{projectData.translator.id || <span className="text-slate-300 italic">Keine Angabe</span>}</span>

                                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Name</span>
                                <span className="text-slate-800 font-bold text-base tracking-tight break-words">{projectData.translator.name || <span className="text-slate-300 italic">Keine Angabe</span>}</span>

                                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Bewertung</span>
                                <div className="flex items-center gap-1.5 text-amber-400">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <FaStar key={star} size={10} className={star <= (projectData.translator.rating || 0) ? "text-amber-400" : "text-slate-200"} />
                                    ))}
                                    <span className="text-[10px] font-bold text-slate-400 ml-1">({(projectData.translator.rating || 0).toFixed(1)})</span>
                                </div>

                                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Adresse</span>
                                <div className="text-slate-700 font-medium leading-relaxed">
                                    {projectData.translator.address_street || projectData.translator.address_house_no ? (
                                        <>
                                            {projectData.translator.address_street} {projectData.translator.address_house_no}<br />
                                            {projectData.translator.address_zip} {projectData.translator.address_city}<br />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {projectData.translator.address_country === 'DE' ? 'Deutschland' :
                                                    projectData.translator.address_country === 'AT' ? 'Österreich' :
                                                        projectData.translator.address_country === 'CH' ? 'Schweiz' :
                                                            (projectData.translator.address_country ? getCountryName(projectData.translator.address_country) : '') || projectData.translator.address_country}
                                            </span>
                                        </>
                                    ) : <span className="text-slate-300 italic text-[11px]">Keine Angabe</span>}
                                </div>

                                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Kontakt</span>
                                <div className="space-y-1 min-w-0">
                                    {projectData.translator.email ? (
                                        <a href={`mailto:${projectData.translator.email}`} className="text-slate-700 font-medium hover:underline flex items-center gap-2 break-all">
                                            <FaAt className="text-xs opacity-50 shrink-0" /> <span className="break-all">{projectData.translator.email}</span>
                                        </a>
                                    ) : <div className="text-slate-300 italic text-[11px]">Keine E-Mail</div>}
                                    {projectData.translator.phone ? (
                                        <div className="text-slate-600 font-medium text-xs flex items-center gap-2">
                                            <FaPhone className="text-xs opacity-50" /> {projectData.translator.phone}
                                        </div>
                                    ) : <div className="text-slate-300 italic text-[11px]">Keine Telefonnummer</div>}
                                </div>

                                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Konditionen</span>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const rates = Array.isArray(projectData.translator.unit_rates) ? projectData.translator.unit_rates : [];
                                        const wordRate = rates.find((r: any) => r.type?.toLowerCase() === 'word')?.price;
                                        const lineRate = rates.find((r: any) => r.type?.toLowerCase() === 'line')?.price;
                                        if (!wordRate && !lineRate) return <span className="text-slate-300 italic text-[11px]">Keine Konditionen</span>;
                                        return (
                                            <>
                                                {wordRate && <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-sm text-[10px] font-bold border border-slate-100 uppercase tracking-tight">Wort: {parseFloat(wordRate).toLocaleString('de-DE', { minimumFractionDigits: 4 })} €</span>}
                                                {lineRate && <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-sm text-[10px] font-bold border border-slate-100 uppercase tracking-tight">Zeile: {parseFloat(lineRate).toLocaleString('de-DE', { minimumFractionDigits: 4 })} €</span>}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 flex flex-col items-center justify-center bg-transparent rounded-sm border border-dashed border-slate-200">
                                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-slate-300 shadow-sm mb-4">
                                    <FaUserPlus className="text-2xl" />
                                </div>
                                <p className="text-slate-400 font-medium text-xs">Kein Partner zugewiesen</p>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsPartnerModalOpen(true)}
                                    className="mt-4 text-brand-text hover:text-brand-primary font-bold shadow-sm"
                                >
                                    Partner auswählen
                                </Button>
                            </div>
                        )}

                        <div className="mt-8 flex gap-3 justify-end">
                            {!projectData.documentsSent ? (
                                <Button
                                    className="px-5 py-2.5 bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 transition shadow-sm flex items-center gap-2"
                                    onClick={() => {
                                        const hasFiles = projectData.files && projectData.files.length > 0;
                                        if (!hasFiles) {
                                            toast.error('Bitte laden Sie zuerst die Zieldateien hoch, bevor Sie diese versenden.');
                                            return;
                                        }
                                        updateProjectMutation.mutate({ documents_sent: true });
                                    }}
                                >
                                    <FaPaperPlane className="text-xs" /> Dokumente senden
                                </Button>
                            ) : (
                                <div className="px-5 py-2.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-sm flex items-center gap-2 border border-emerald-100 shadow-sm">
                                    <FaCheckCircle /> Versand bestätigt
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Full Width: Notes */}
                <div className="lg:col-span-2 pt-6 md:pt-10 border-t border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4">Interne Notizen</h4>
                    <div className="bg-transparent p-4 md:p-6 rounded-sm border border-slate-100 min-h-[100px] text-sm text-slate-600 leading-relaxed whitespace-pre-wrap shadow-inner font-medium">
                        {projectData.notes || <span className="italic text-slate-300">Keine internen Notizen hinterlegt.</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectOverviewTab;
