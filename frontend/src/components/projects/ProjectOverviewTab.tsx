import { FaArrowRight, FaCheck, FaCheckCircle, FaClock, FaBolt, FaFlag, FaAt, FaPhone, FaExternalLinkAlt, FaFileInvoiceDollar, FaUserPlus, FaCopy, FaPaperPlane, FaStar } from 'react-icons/fa';
import { Button } from '../ui/button';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../ui/table';
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
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden animate-fadeIn pb-10">
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

            <div className="p-4 sm:p-6 md:p-8 space-y-12">
                {/* Core Data Table */}
                <section>
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Basisdaten</h4>
                    </div>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="w-[200px] font-bold text-[10px] uppercase tracking-widest text-slate-400">Projekt-ID</TableCell>
                                <TableCell className="font-medium text-slate-800 tracking-tight">{projectData.id || <span className="text-slate-300 italic">Keine Angabe</span>}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Bezeichnung</TableCell>
                                <TableCell className="font-bold text-slate-800">{projectData.name || <span className="text-slate-300 italic">Keine Angabe</span>}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Sprachpaar</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-700 font-bold uppercase tracking-tight">
                                            <img src={sourceLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px] object-cover" />
                                            {sourceLang.name}
                                        </div>
                                        <FaArrowRight className="text-slate-300 text-[10px]" />
                                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-700 font-bold uppercase tracking-tight">
                                            <img src={targetLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px] object-cover" />
                                            {targetLang.name}
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Termin</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-800 font-bold">
                                            {projectData.due ? (() => {
                                                const d = new Date(projectData.due);
                                                const days = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];
                                                return `${days[d.getDay()]}, ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} | ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
                                            })() : <span className="text-slate-300 italic font-normal">Keine Angabe</span>}
                                        </span>
                                        {projectData.due && (
                                            <div className={clsx("flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight border shadow-sm", deadlineStatus.color)}>
                                                {deadlineStatus.label}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Priorität</TableCell>
                                <TableCell>
                                    {projectData.priority === 'low' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight bg-slate-100 text-slate-500 border border-slate-200">
                                            <FaClock /> Standard
                                        </span>
                                    ) : projectData.priority === 'medium' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight bg-blue-50 text-blue-700 border border-blue-200">
                                            <FaFlag /> Normal
                                        </span>
                                    ) : (
                                        <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight border",
                                            projectData.priority === 'express' || projectData.priority === 'high' ? "bg-red-50 text-red-700 border-red-200" : "bg-orange-50 text-orange-700 border-orange-200"
                                        )}>
                                            {projectData.priority === 'express' || projectData.priority === 'high' ? <FaBolt /> : <FaFlag />}
                                            {projectData.priority === 'express' || projectData.priority === 'high' ? 'Express-Service' : 'Hohe Priorität'}
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Customer Table */}
                    <section>
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kunde / Auftraggeber</h4>
                            <div className="flex gap-4">
                                {projectData.customer_id && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => navigate(`/customers/${projectData.customer_id}`, { state: { from: locationPathname } })}
                                        className="h-auto p-0 text-slate-400 font-medium hover:text-brand-primary flex items-center gap-1.5 transition-colors"
                                    >
                                        <FaExternalLinkAlt className="text-xs" /> Akte
                                    </Button>
                                )}
                                <Button variant="link" size="sm" onClick={() => setIsCustomerSearchOpen(true)} className="h-auto p-0 text-brand-primary font-bold hover:underline">Ändern</Button>
                            </div>
                        </div>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-[130px] font-bold text-[10px] uppercase tracking-widest text-slate-400">Kunden-ID</TableCell>
                                    <TableCell className="font-medium text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">{projectData.customer.id || '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Name / Firma</TableCell>
                                    <TableCell className="font-bold text-slate-800">{projectData.customer.name || '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Adresse</TableCell>
                                    <TableCell className="text-slate-700 leading-tight">
                                        {projectData.customer.address_street || projectData.customer.address_house_no ? (
                                            <>
                                                {projectData.customer.address_street} {projectData.customer.address_house_no}<br />
                                                {projectData.customer.address_zip} {projectData.customer.address_city}<br />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                    {projectData.customer.address_country === 'DE' ? 'Deutschland' :
                                                        projectData.customer.address_country === 'AT' ? 'Österreich' :
                                                            projectData.customer.address_country === 'CH' ? 'Schweiz' :
                                                                projectData.customer.address_country}
                                                </span>
                                            </>
                                        ) : <span className="text-slate-300 italic">Keine Angabe</span>}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">E-Mail</TableCell>
                                    <TableCell>
                                        {projectData.customer.email ? (
                                            <a href={`mailto:${projectData.customer.email}`} className="text-slate-700 font-medium hover:underline flex items-center gap-2 break-all">
                                                <FaAt className="text-xs text-slate-300 shrink-0" /> {projectData.customer.email}
                                            </a>
                                        ) : '-'}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Telefon</TableCell>
                                    <TableCell>
                                        {projectData.customer.phone ? (
                                            <div className="text-slate-600 font-medium text-xs flex items-center gap-2">
                                                <FaPhone className="text-xs text-slate-300 shrink-0" /> {projectData.customer.phone}
                                            </div>
                                        ) : '-'}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </section>

                    {/* Partner Table */}
                    <section>
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ausführender Partner</h4>
                            <div className="flex gap-4">
                                {projectData.translator?.id && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => navigate(`/partners/${projectData.translator.id}`, { state: { from: locationPathname } })}
                                        className="h-auto p-0 text-slate-400 font-medium hover:text-brand-primary flex items-center gap-1.5 transition-colors"
                                    >
                                        <FaExternalLinkAlt className="text-xs" /> Akte
                                    </Button>
                                )}
                                <Button variant="link" size="sm" onClick={() => setIsPartnerModalOpen(true)} className="h-auto p-0 text-brand-primary font-bold hover:underline">Ändern</Button>
                            </div>
                        </div>

                        {projectData.translator?.id ? (
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="w-[130px] font-bold text-[10px] uppercase tracking-widest text-slate-400">Partner-ID</TableCell>
                                        <TableCell className="font-medium text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">{projectData.translator.id || '-'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Name</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-800">{projectData.translator.name}</span>
                                                <div className="flex items-center gap-0.5 text-amber-400">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <FaStar key={star} size={9} className={star <= (projectData.translator.rating || 0) ? "text-amber-400" : "text-slate-200"} />
                                                    ))}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Adresse</TableCell>
                                        <TableCell className="text-slate-700 leading-tight">
                                            {projectData.translator.address_street || projectData.translator.address_house_no ? (
                                                <>
                                                    {projectData.translator.address_street} {projectData.translator.address_house_no}<br />
                                                    {projectData.translator.address_zip} {projectData.translator.address_city}<br />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                        {projectData.translator.address_country === 'DE' ? 'Deutschland' :
                                                            (projectData.translator.address_country ? getCountryName(projectData.translator.address_country) : '') || projectData.translator.address_country}
                                                    </span>
                                                </>
                                            ) : <span className="text-slate-300 italic">Keine Angabe</span>}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">E-Mail</TableCell>
                                        <TableCell>
                                            {projectData.translator.email ? (
                                                <a href={`mailto:${projectData.translator.email}`} className="text-slate-700 font-medium hover:underline flex items-center gap-2 break-all">
                                                    <FaAt className="text-xs text-slate-300 shrink-0" /> {projectData.translator.email}
                                                </a>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Konditionen</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    const rates = Array.isArray(projectData.translator.unit_rates) ? projectData.translator.unit_rates : [];
                                                    const wordRate = rates.find((r: any) => r.type?.toLowerCase() === 'word')?.price;
                                                    const lineRate = rates.find((r: any) => r.type?.toLowerCase() === 'line')?.price;
                                                    if (!wordRate && !lineRate) return <span className="text-slate-300 italic">Keine Konditionen</span>;
                                                    return (
                                                        <>
                                                            {wordRate && <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded-sm text-[10px] font-bold border border-slate-200">Wort: {parseFloat(wordRate).toLocaleString('de-DE', { minimumFractionDigits: 4 })} €</span>}
                                                            {lineRate && <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded-sm text-[10px] font-bold border border-slate-200">Zeile: {parseFloat(lineRate).toLocaleString('de-DE', { minimumFractionDigits: 4 })} €</span>}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-8 flex flex-col items-center justify-center bg-slate-50/50 rounded-sm border border-dashed border-slate-200">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-300 shadow-sm mb-3">
                                    <FaUserPlus className="text-xl" />
                                </div>
                                <p className="text-slate-400 font-medium text-[11px]">Kein Partner zugewiesen</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsPartnerModalOpen(true)}
                                    className="mt-3 text-[11px] h-8 font-bold shadow-sm"
                                >
                                    Partner auswählen
                                </Button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Additional Details & Services */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <section>
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Auftragsdetails</h4>
                        </div>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-[130px] font-bold text-[10px] uppercase tracking-widest text-slate-400">Dokumentenart</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-2">
                                            {projectData.docType.length > 0 ? projectData.docType.map((d: string) => (
                                                <span key={d} className="px-2 py-0.5 bg-slate-50 text-slate-900 rounded-sm text-xs font-bold border border-slate-200">
                                                    {d}
                                                </span>
                                            )) : <span className="text-slate-300 italic">Keine Angabe</span>}
                                        </div>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Services</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-2">
                                            {!projectData.isCertified && !projectData.hasApostille && !projectData.isExpress && projectData.classification !== 'ja' && projectData.copies <= 0 && (
                                                <span className="text-slate-300 italic">Standard</span>
                                            )}
                                            {projectData.isCertified && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <FaCheck /> Beglaubigt
                                                </span>
                                            )}
                                            {projectData.hasApostille && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                                    <FaCheck /> Apostille
                                                </span>
                                            )}
                                            {projectData.classification === 'ja' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                                                    <FaCheck /> Klassifiziert
                                                </span>
                                            )}
                                            {projectData.copies > 0 && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                                    <FaCopy /> {projectData.copies}x Kopie
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </section>

                    <section className="flex flex-col">
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Status & Aktionen</h4>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-sm">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Lieferstatus</span>
                                    {projectData.documentsSent ? (
                                        <div className="flex items-center gap-2 text-emerald-700 font-bold transition-all animate-in fade-in zoom-in-95">
                                            <FaCheckCircle className="text-emerald-500" /> Dokumente versendet
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-500 font-bold italic">
                                            Noch nicht versendet
                                        </div>
                                    )}
                                </div>
                                {!projectData.documentsSent ? (
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
                                        className="h-9 px-4 font-bold shadow-md shadow-brand-primary/10"
                                    >
                                        <FaPaperPlane className="text-[10px]" /> VERSENDEN
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateProjectMutation.mutate({ documents_sent: false })}
                                        className="h-8 text-xs text-slate-400 border-slate-200 hover:text-slate-600 font-bold"
                                    >
                                        Rückgängig
                                    </Button>
                                )}
                            </div>

                            <div className="bg-slate-50/50 border border-slate-100 rounded-sm p-4 h-full min-h-[100px]">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Interne Notizen</h5>
                                <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                                    {projectData.notes || <span className="italic text-slate-300">Keine internen Notizen hinterlegt.</span>}
                                </div>
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
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ProjectOverviewTab;
