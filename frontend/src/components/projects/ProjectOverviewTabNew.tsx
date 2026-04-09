import { FaArrowRight, FaStar, FaEnvelope, FaEdit, FaChevronDown, FaEllipsisV, FaFileInvoice, FaExclamationCircle, FaArrowUp, FaMinus } from 'react-icons/fa';
import { Button } from '../ui/button';
import { useState, useEffect } from 'react';

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

// ── Helpers ──────────────────────────────────────────────────────────────────

const InfoRow = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex gap-3 py-1.5 border-b border-slate-100 last:border-0">
        <span className="text-xs text-slate-400 w-24 shrink-0 pt-px">{label}</span>
        <span className="text-xs text-slate-800 font-medium flex-1 min-w-0">{children}</span>
    </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[11px] font-semibold text-slate-500 mb-2 mt-4 first:mt-0">{children}</div>
);

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    draft: { label: 'Entwurf', className: 'bg-slate-100 text-slate-600' },
    offer: { label: 'Angebot', className: 'bg-amber-50 text-amber-700' },
    pending: { label: 'Ausstehend', className: 'bg-amber-50 text-amber-700' },
    in_progress: { label: 'In Bearbeitung', className: 'bg-sky-50 text-sky-700' },
    review: { label: 'Überprüfung', className: 'bg-sky-50 text-sky-700' },
    ready_for_pickup: { label: 'Abholbereit', className: 'bg-indigo-50 text-indigo-700' },
    delivered: { label: 'Geliefert', className: 'bg-teal-50 text-teal-700' },
    invoiced: { label: 'Abgerechnet', className: 'bg-violet-50 text-violet-700' },
    completed: { label: 'Abgeschlossen', className: 'bg-teal-50 text-teal-700' },
    cancelled: { label: 'Storniert', className: 'bg-slate-100 text-slate-500' },
    archived: { label: 'Archiviert', className: 'bg-slate-100 text-slate-500' },
};

const StatusBadge = ({ status }: { status: string }) => {
    const s = STATUS_MAP[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
    return <span className={`inline-block px-2.5 py-0.5 rounded-sm text-xs font-medium ${s.className}`}>{s.label}</span>;
};

const COUNTRY_MAP: Record<string, string> = { DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz', FR: 'Frankreich', US: 'USA' };
const country = (code: string) => COUNTRY_MAP[code] || code;

// ─────────────────────────────────────────────────────────────────────────────

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
        partActions: false,
    });

    const activeInvoice = (projectData.invoices || []).find((inv: any) => !['cancelled'].includes(inv.status));
    const sourceFiles = (projectData.files || []).filter((f: any) => f.type === 'source');
    const targetFiles = (projectData.files || []).filter((f: any) => f.type === 'target');
    const estimatedTotal = (projectData.positions || []).reduce((sum: number, pos: any) =>
        sum + (parseFloat(pos.rate || 0) * parseFloat(pos.units || 0)), 0);

    const daysUntilDue = projectData.due
        ? Math.ceil((new Date(projectData.due).getTime() - Date.now()) / (1000 * 3600 * 24))
        : null;
    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

    const toggleDropdown = (section: string) =>
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    const toggleSection = (section: string) =>
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

    useEffect(() => {
        const close = () => setExpandedSections(prev => ({ ...prev, custActions: false, partActions: false }));
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, []);

    const options: string[] = [];
    if (projectData.isCertified) options.push('Beglaubigt');
    if (projectData.hasApostille) options.push('Apostille');
    if (projectData.isExpress) options.push('Express');

    const partnerRates = Array.isArray(projectData.translator?.unit_rates) ? projectData.translator.unit_rates : [];
    const wordRate = partnerRates.find((r: any) => r.type?.toLowerCase() === 'word')?.price;
    const lineRate = partnerRates.find((r: any) => r.type?.toLowerCase() === 'line')?.price;


    return (
        <div className="fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

                {/* LEFT */}
                <div className="space-y-5">

                    {/* STAMMDATEN */}
                    <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                        <button
                            onClick={() => toggleSection('masterdata')}
                            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition border-b border-slate-100"
                        >
                            <span className="text-sm font-semibold text-slate-700">Stammdaten</span>
                            <FaChevronDown className={`text-slate-400 text-xs transition-transform ${expandedSections['masterdata'] ? 'rotate-180' : ''}`} />
                        </button>

                        {expandedSections['masterdata'] && (
                            <div className="px-5 py-4">
                                <SectionLabel>Sprachpaar</SectionLabel>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm">
                                        <img src={sourceLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px]" />
                                        <span className="text-sm font-medium text-slate-700">{sourceLang.name}</span>
                                    </div>
                                    <FaArrowRight className="text-slate-300 text-xs shrink-0" />
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm">
                                        <img src={targetLang.flagUrl} alt="" className="w-4 h-3 rounded-[1px]" />
                                        <span className="text-sm font-medium text-slate-700">{targetLang.name}</span>
                                    </div>
                                </div>

                                <SectionLabel>Auftragsdetails</SectionLabel>
                                <div>
                                    {projectData.description && (
                                        <InfoRow label="Beschreibung">{projectData.description}</InfoRow>
                                    )}
                                    {projectData.notes && (
                                        <InfoRow label="Notizen">{projectData.notes}</InfoRow>
                                    )}
                                    <InfoRow label="Dokumenttyp">
                                        {projectData.docType?.length > 0 ? projectData.docType.join(', ') : '–'}
                                    </InfoRow>
                                </div>

                                <SectionLabel>Leistungen & Optionen</SectionLabel>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-slate-100 mb-4">
                                    {[
                                        { label: 'Beglaubigung', enabled: projectData.is_certified || projectData.isCertified, qty: projectData.certified_count, color: 'emerald' },
                                        { label: 'Express', enabled: projectData.is_express || projectData.isExpress, qty: projectData.express_count, color: 'rose' },
                                        { label: 'Apostille', enabled: projectData.has_apostille || projectData.hasApostille, qty: projectData.apostille_count, color: 'blue' },
                                        { label: 'Klassifizierung', enabled: projectData.classification === 'ja' || projectData.classification === true, qty: projectData.classification_count, color: 'amber' },
                                    ].map(opt => (
                                        <div key={opt.label} className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{opt.label}</span>
                                                <div className={`w-2 h-2 rounded-full ${opt.enabled ? `bg-${opt.color}-500 shadow-[0_0_8px_rgba(255,255,255,0.5)]` : 'bg-slate-300'}`} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold ${opt.enabled ? 'text-slate-900' : 'text-slate-300'}`}>
                                                    {opt.enabled ? 'AKTIV' : 'INAKTIV'}
                                                </span>
                                                {opt.enabled && opt.qty > 0 && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold bg-white border border-${opt.color}-100 text-${opt.color}-700`}>
                                                        {opt.qty}x
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <SectionLabel>Kopien & Mehraufwand</SectionLabel>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">Anzahl Kopien</div>
                                        <div className="text-sm font-bold text-slate-800">{projectData.copies || projectData.copies_count || 0} Stk.</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">Preis / Kopie</div>
                                        <div className="text-sm font-bold text-slate-800">{parseFloat(projectData.copyPrice || projectData.copy_price || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</div>
                                    </div>
                                    <div className="p-3 bg-brand-primary/5 border border-brand-primary/10 rounded-sm">
                                        <div className="text-[10px] font-bold text-brand-primary/60 uppercase tracking-tight mb-1">Summe Kopien</div>
                                        <div className="text-sm font-bold text-brand-primary">
                                            {((projectData.copies || projectData.copies_count || 0) * (parseFloat(projectData.copyPrice || projectData.copy_price || 0))).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <InfoRow label="Versand">
                                        {projectData.shipping_type === 'email' ? 'Per E-Mail'
                                            : projectData.shipping_type === 'pickup' ? 'Abholung'
                                                : '–'}
                                    </InfoRow>
                                    <InfoRow label="Status">
                                        <StatusBadge status={projectData.status} />
                                    </InfoRow>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* KUNDE & PARTNER */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* KUNDE */}
                        <div className="bg-white border border-slate-200 rounded-sm">
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                                <span className="text-sm font-semibold text-slate-700">Kunde</span>
                                <div className="flex items-center gap-0.5">
                                    {projectData.customer?.email && onSendEmail && (
                                        <button onClick={() => onSendEmail('customer')} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition" title="E-Mail senden">
                                            <FaEnvelope size={12} />
                                        </button>
                                    )}
                                    <button onClick={() => setIsCustomerEditModalOpen(true)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition" title="Bearbeiten">
                                        <FaEdit size={12} />
                                    </button>
                                    <div className="relative">
                                        <button onClick={(e) => { e.stopPropagation(); toggleDropdown('custActions'); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition">
                                            <FaEllipsisV size={11} />
                                        </button>
                                        {expandedSections['custActions'] && (
                                            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded shadow-lg z-50 py-1">
                                                <button onClick={() => { navigate(`/customers/${projectData.customer_id}`, { state: { from: locationPathname } }); toggleDropdown('custActions'); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700">
                                                    Zum Kundenprofil
                                                </button>
                                                <button onClick={() => { onSendEmail?.('customer'); toggleDropdown('custActions'); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700">
                                                    E-Mail senden
                                                </button>
                                                <button onClick={() => { setIsCustomerSearchOpen(true); toggleDropdown('custActions'); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700">
                                                    Kunde wechseln
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-3">
                                <InfoRow label="Name">
                                    <span className="font-semibold text-slate-800">
                                        {projectData.customer?.salutation ? `${projectData.customer.salutation} ` : ''}
                                        {projectData.customer?.name || '–'}
                                    </span>
                                </InfoRow>
                                {projectData.customer?.display_id && (
                                    <InfoRow label="Kundennr.">{projectData.customer.display_id}</InfoRow>
                                )}
                                <InfoRow label="Typ">
                                    {projectData.customer?.type === 'company'
                                        ? <>Firmenkunde{projectData.customer.legal_form ? ` · ${projectData.customer.legal_form}` : ''}</>
                                        : 'Privatkunde'}
                                </InfoRow>
                                {projectData.customer?.company_name && (
                                    <InfoRow label="Firma">{projectData.customer.company_name}</InfoRow>
                                )}
                                {projectData.customer?.contact_person && (
                                    <InfoRow label="Ansprechp.">{projectData.customer.contact_person}</InfoRow>
                                )}
                                <InfoRow label="E-Mail">
                                    {projectData.customer?.email
                                        ? <a href={`mailto:${projectData.customer.email}`} className="text-slate-700 hover:text-brand-primary hover:underline break-all">{projectData.customer.email}</a>
                                        : '–'}
                                </InfoRow>
                                <InfoRow label="Mobil">
                                    {projectData.customer?.mobile_phone
                                        ? <a href={`tel:${projectData.customer.mobile_phone}`} className="text-slate-700 hover:text-brand-primary hover:underline">{projectData.customer.mobile_phone}</a>
                                        : '–'}
                                </InfoRow>
                                <InfoRow label="Telefon">
                                    {projectData.customer?.phone
                                        ? <a href={`tel:${projectData.customer.phone}`} className="text-slate-700 hover:text-brand-primary hover:underline">{projectData.customer.phone}</a>
                                        : '–'}
                                </InfoRow>
                                {projectData.customer?.address_street && (
                                    <InfoRow label="Adresse">
                                        {projectData.customer.address_street}
                                        {projectData.customer.address_house_no ? ` ${projectData.customer.address_house_no}` : ''}
                                        {projectData.customer.address_zip ? `, ${projectData.customer.address_zip}` : ''}
                                        {projectData.customer.address_city ? ` ${projectData.customer.address_city}` : ''}
                                        {projectData.customer.address_country ? `, ${country(projectData.customer.address_country)}` : ''}
                                    </InfoRow>
                                )}
                                {projectData.customer?.vat_id && (
                                    <InfoRow label="USt-IdNr.">{projectData.customer.vat_id}</InfoRow>
                                )}
                                {projectData.customer?.tax_id && !projectData.customer?.vat_id && (
                                    <InfoRow label="Steuernr.">{projectData.customer.tax_id}</InfoRow>
                                )}
                                <InfoRow label="Zahlungsziel">
                                    {projectData.customer?.payment_terms_days
                                        ? `${projectData.customer.payment_terms_days} Tage`
                                        : '–'}
                                </InfoRow>
                                <InfoRow label="Kundenportal">
                                    <span className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${projectData.customer?.portal_access ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                        {projectData.customer?.portal_access
                                            ? projectData.customer.portal_last_login_at
                                                ? `Aktiv · zuletzt ${new Date(projectData.customer.portal_last_login_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}`
                                                : 'Aktiv · noch nie eingeloggt'
                                            : 'Nicht aktiv'}
                                    </span>
                                </InfoRow>
                            </div>

                        </div>

                        {/* PARTNER */}
                        <div className="bg-white border border-slate-200 rounded-sm">
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                                <span className="text-sm font-semibold text-slate-700">Partner</span>
                                <div className="flex items-center gap-0.5">
                                    {projectData.translator?.email && onSendEmail && (
                                        <button onClick={() => onSendEmail('partner')} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition" title="E-Mail senden">
                                            <FaEnvelope size={12} />
                                        </button>
                                    )}
                                    {projectData.translator?.id && (
                                        <button onClick={() => setIsPartnerEditModalOpen(true)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition" title="Bearbeiten">
                                            <FaEdit size={12} />
                                        </button>
                                    )}
                                    <div className="relative">
                                        <button onClick={(e) => { e.stopPropagation(); toggleDropdown('partActions'); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition">
                                            <FaEllipsisV size={11} />
                                        </button>
                                        {expandedSections['partActions'] && (
                                            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded shadow-lg z-50 py-1">
                                                {projectData.translator?.id && (
                                                    <button onClick={() => { navigate(`/partners/${projectData.translator.id}`, { state: { from: locationPathname } }); toggleDropdown('partActions'); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700">
                                                        Zum Partnerprofil
                                                    </button>
                                                )}
                                                {projectData.translator?.email && (
                                                    <button onClick={() => { onSendEmail?.('partner'); toggleDropdown('partActions'); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700">
                                                        E-Mail senden
                                                    </button>
                                                )}
                                                <button onClick={() => { setIsPartnerModalOpen(true); toggleDropdown('partActions'); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700">
                                                    Partner wechseln
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {projectData.translator?.id ? (
                                <>
                                    <div className="px-5 py-3">
                                        <InfoRow label="Name">
                                            <span className="font-semibold text-slate-800">{projectData.translator.name}</span>
                                        </InfoRow>
                                        {projectData.translator.display_id && (
                                            <InfoRow label="Partnernr.">{projectData.translator.display_id}</InfoRow>
                                        )}
                                        <InfoRow label="E-Mail">
                                            {projectData.translator.email
                                                ? <a href={`mailto:${projectData.translator.email}`} className="text-slate-700 hover:text-brand-primary hover:underline break-all">{projectData.translator.email}</a>
                                                : '–'}
                                        </InfoRow>
                                        <InfoRow label="Mobil">
                                            {projectData.translator?.mobile_phone
                                                ? <a href={`tel:${projectData.translator.mobile_phone}`} className="text-slate-700 hover:text-brand-primary hover:underline">{projectData.translator.mobile_phone}</a>
                                                : '–'}
                                        </InfoRow>
                                        <InfoRow label="Telefon">
                                            {projectData.translator?.phone
                                                ? <a href={`tel:${projectData.translator.phone}`} className="text-slate-700 hover:text-brand-primary hover:underline">{projectData.translator.phone}</a>
                                                : '–'}
                                        </InfoRow>
                                        {projectData.translator?.address_street && (
                                            <InfoRow label="Adresse">
                                                {projectData.translator.address_street}
                                                {projectData.translator.address_house_no ? ` ${projectData.translator.address_house_no}` : ''}
                                                {projectData.translator.address_zip ? `, ${projectData.translator.address_zip}` : ''}
                                                {projectData.translator.address_city ? ` ${projectData.translator.address_city}` : ''}
                                                {projectData.translator.address_country ? `, ${country(projectData.translator.address_country)}` : ''}
                                            </InfoRow>
                                        )}
                                        {projectData.translator?.languages?.length > 0 && (
                                            <InfoRow label="Sprachen">
                                                <span className="flex flex-wrap gap-1">
                                                    {projectData.translator.languages.map((l: any, i: number) => {
                                                        const code = typeof l === 'string' ? l : l.code;
                                                        const flagIcon = l.flag_icon || l.flagIcon;
                                                        return (
                                                            <span key={i} className="flex items-center gap-1 text-slate-700">
                                                                {flagIcon && <img src={`https://flagcdn.com/16x12/${flagIcon.toLowerCase()}.png`} alt={code} className="w-4 h-3 rounded-[1px] border border-slate-100" />}
                                                                {code}
                                                            </span>
                                                        );
                                                    })}
                                                </span>
                                            </InfoRow>
                                        )}
                                        <InfoRow label="Bewertung">
                                            <span className="flex items-center gap-1.5">
                                                <span className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <FaStar key={star} size={9} className={star <= (projectData.translator.rating || 0) ? 'text-amber-400' : 'text-slate-200'} />
                                                    ))}
                                                </span>
                                                <span className="text-slate-500">
                                                    {projectData.translator.rating
                                                        ? `${parseFloat(projectData.translator.rating.toFixed(1)).toString()}/5`
                                                        : '–'}
                                                </span>
                                            </span>
                                        </InfoRow>
                                        {(wordRate || lineRate) && (
                                            <InfoRow label="Honorar">
                                                {[wordRate && `Wort: ${parseFloat(wordRate).toFixed(3)} €`, lineRate && `Zeile: ${parseFloat(lineRate).toFixed(3)} €`].filter(Boolean).join(' · ')}
                                            </InfoRow>
                                        )}
                                    </div>

                                </>
                            ) : (
                                <div className="px-5 py-8 flex flex-col items-center justify-center">
                                    <p className="text-slate-400 text-xs mb-3">Noch kein Partner zugewiesen</p>
                                    <Button size="sm" onClick={() => setIsPartnerModalOpen(true)} className="text-xs h-7">
                                        Auswählen
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto custom-scrollbar">

                    {/* STATUS */}
                    <div className="bg-white border border-slate-200 rounded-sm p-4">
                        <div className="text-[11px] font-semibold text-slate-500 mb-2.5">Status</div>
                        <StatusBadge status={projectData.status} />
                    </div>

                    {/* FINANZEN */}
                    <div className="bg-white border border-slate-200 rounded-sm p-4">
                        <div className="text-[11px] font-semibold text-slate-500 mb-2.5">Finanzen</div>
                        <div className="space-y-0">
                            <InfoRow label="Geschätzt">
                                {estimatedTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                            </InfoRow>
                            <InfoRow label="Positionen">
                                {(projectData.positions || []).length}
                            </InfoRow>
                        </div>

                        {activeInvoice && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => setPreviewInvoice(activeInvoice)}
                                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-sm border border-slate-200 hover:border-brand-primary hover:bg-slate-50 transition group mb-2.5"
                                >
                                    <FaFileInvoice size={12} className="text-slate-400 group-hover:text-brand-primary shrink-0" />
                                    <span className="text-xs font-medium text-slate-700 group-hover:text-brand-primary flex-1 text-left">
                                        {activeInvoice.invoice_number || 'Rechnung'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 shrink-0">öffnen →</span>
                                </button>
                                <div className="space-y-0 pl-1">
                                    <InfoRow label="Netto">
                                        {(activeInvoice.amount_net_eur ?? (activeInvoice.amount_net / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                    </InfoRow>
                                    <InfoRow label={`MwSt. ${activeInvoice.tax_rate ?? ''}%`}>
                                        {(activeInvoice.amount_tax_eur ?? (activeInvoice.amount_tax / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                    </InfoRow>
                                    <InfoRow label="Gesamt">
                                        <span className="font-semibold text-slate-800">
                                            {(activeInvoice.amount_gross_eur ?? (activeInvoice.amount_gross / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                        </span>
                                    </InfoRow>
                                    {(activeInvoice.paid_amount_eur > 0 || activeInvoice.paid_amount_cents > 0) && (
                                        <InfoRow label="Anzahlung">
                                            {(activeInvoice.paid_amount_eur ?? (activeInvoice.paid_amount_cents / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                        </InfoRow>
                                    )}
                                    {(activeInvoice.amount_due_eur > 0 || activeInvoice.amount_due > 0) && (
                                        <InfoRow label="Offen">
                                            <span className="text-amber-600 font-medium">
                                                {(activeInvoice.amount_due_eur ?? (activeInvoice.amount_due / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                            </span>
                                        </InfoRow>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* TERMINE */}
                    <div className="bg-white border border-slate-200 rounded-sm p-4">
                        <div className="text-[11px] font-semibold text-slate-500 mb-2.5">Übersicht</div>
                        <div className="space-y-0">
                            <InfoRow label="Termin">
                                {projectData.due
                                    ? new Date(projectData.due).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : '–'}
                            </InfoRow>
                            {daysUntilDue !== null && (
                                <InfoRow label="Verbleibend">
                                    <span className={isOverdue ? 'text-red-600' : 'text-slate-800'}>
                                        {isOverdue ? `${Math.abs(daysUntilDue)} Tage überfällig` : `${daysUntilDue} Tage`}
                                    </span>
                                </InfoRow>
                            )}
                            <InfoRow label="Priorität">
                                <span className="flex items-center gap-1.5">
                                    {projectData.priority === 'high' || projectData.priority === 'urgent'
                                        ? <FaExclamationCircle size={9} className="text-red-400" />
                                        : projectData.priority === 'medium'
                                            ? <FaArrowUp size={9} className="text-amber-400" />
                                            : <FaMinus size={9} className="text-slate-300" />}
                                    {projectData.priority === 'high' ? 'Hoch'
                                        : projectData.priority === 'urgent' ? 'Dringend'
                                            : projectData.priority === 'medium' ? 'Mittel'
                                                : projectData.priority === 'low' ? 'Niedrig'
                                                    : '–'}
                                </span>
                            </InfoRow>
                            <InfoRow label="Dateien">
                                {sourceFiles.length} Quell · {targetFiles.length} Ziel
                            </InfoRow>
                            <InfoRow label="Nachrichten">
                                {(projectData.messages || []).length}
                            </InfoRow>
                        </div>
                    </div>

                    {/* VERWEISE */}
                    <div className="bg-white border border-slate-200 rounded-sm p-4">
                        <div className="text-[11px] font-semibold text-slate-500 mb-2">Verweise</div>
                        <div className="space-y-0.5">
                            {projectData.customer_id && (
                                <button
                                    onClick={() => navigate(`/customers/${projectData.customer_id}`)}
                                    className="w-full text-left px-2 py-1.5 text-xs text-slate-600 hover:text-brand-primary hover:bg-slate-50 rounded transition"
                                >
                                    Kundenprofil öffnen
                                </button>
                            )}
                            {projectData.translator?.id && (
                                <button
                                    onClick={() => navigate(`/partners/${projectData.translator.id}`)}
                                    className="w-full text-left px-2 py-1.5 text-xs text-slate-600 hover:text-brand-primary hover:bg-slate-50 rounded transition"
                                >
                                    Partnerprofil öffnen
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
