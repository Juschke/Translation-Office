
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnerService, projectService } from '../api/services';
import {
    FaArrowLeft, FaEdit, FaTrash, FaEnvelope, FaStar,
    FaUserTie, FaFileContract, FaBriefcase, FaChartLine
} from 'react-icons/fa';
import TableSkeleton from '../components/common/TableSkeleton';
import { getFlagUrl, getLanguageName } from '../utils/flags';
import { useState, useMemo } from 'react';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import ConfirmModal from '../components/common/ConfirmModal';
import clsx from 'clsx';

const PartnerDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const { data: partner, isLoading } = useQuery({
        queryKey: ['partners', id],
        queryFn: () => partnerService.getById(parseInt(id!)),
        enabled: !!id
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => partnerService.update(parseInt(id!), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners', id] });
            setIsEditModalOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (partnerId: number) => partnerService.delete(partnerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            navigate('/partners');
        }
    });

    if (isLoading) return <TableSkeleton rows={5} columns={2} />;
    if (!partner) return <div className="p-10 text-center text-slate-500">Partner nicht gefunden</div>;

    const name = partner.company || `${partner.first_name} ${partner.last_name}`;
    const initials = (partner.first_name?.[0] || '') + (partner.last_name?.[0] || 'P');

    return (
        <div className="flex flex-col gap-6 h-full fade-in pb-10">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 md:p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            onClick={() => location.state?.from ? navigate(location.state.from) : navigate('/partners')}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition shrink-0"
                        >
                            <FaArrowLeft />
                        </button>
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg md:text-xl font-bold border border-indigo-100 shadow-sm shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg md:text-2xl font-bold text-slate-800 truncate">{name}</h1>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border shrink-0 ${partner.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    partner.status === 'busy' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-slate-50 text-slate-500 border-slate-200'
                                    }`}>
                                    {partner.status || 'Keine Angabe'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1 flex-wrap">
                                <span className="flex items-center gap-1"><FaUserTie className="text-slate-400" /> {partner.type || 'Keine Angabe'}</span>
                                {partner.email && <span className="flex items-center gap-1 truncate"><FaEnvelope className="text-slate-400" /> {partner.email}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap ml-0 md:ml-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                        <button
                            onClick={() => navigate('/inbox', { state: { compose: true, to: partner.email, subject: `Anfrage: ${name}` } })}
                            className="bg-white border border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-200 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm transition active:scale-95"
                        >
                            <FaEnvelope /> Email
                        </button>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-brand-600 border border-brand-600 text-white hover:bg-brand-700 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm transition active:scale-95"
                        >
                            <FaEdit /> Bearbeiten
                        </button>
                        <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>
                        <button
                            onClick={() => setIsConfirmOpen(true)}
                            className="text-slate-400 hover:text-red-600 p-2 rounded transition hover:bg-red-50"
                            title="Löschen"
                        >
                            <FaTrash />
                        </button>
                    </div>

                    {/* Metadata row */}
                    <div className="flex items-center gap-4 flex-wrap text-[11px] text-slate-400 border-t border-slate-100 pt-3 mt-1">
                        <span>ID: <span className="text-slate-600 font-medium">{partner.id}</span></span>
                        <span className="hidden sm:inline">·</span>
                        <span>Erstellt: <span className="text-slate-600">{new Date(partner.created_at).toLocaleDateString('de-DE')}</span></span>
                        <span className="hidden sm:inline">·</span>
                        <span>Geändert: <span className="text-slate-600">{new Date(partner.updated_at).toLocaleDateString('de-DE')}</span></span>
                        <span className="hidden sm:inline">·</span>
                        <span className="flex items-center gap-1">Bewertung: <span className="text-amber-500 font-bold flex items-center gap-0.5">{partner.rating || '0.0'} <FaStar className="text-[10px]" /></span></span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Stammdaten Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <FaFileContract className="text-brand-500" /> Stammdatenblatt
                            </h3>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">

                            {/* Section: Kontakt */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2 mb-4">Kontaktinformationen</h4>

                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                    <span className="text-slate-500 font-medium">Firma</span>
                                    <span className="text-slate-800 font-semibold">{partner.company || <span className="text-slate-400 italic font-normal">Keine Angabe</span>}</span>

                                    <span className="text-slate-500 font-medium">Vorname</span>
                                    <span className="text-slate-800">{partner.first_name || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                    <span className="text-slate-500 font-medium">Nachname</span>
                                    <span className="text-slate-800 font-bold">{partner.last_name || <span className="text-slate-400 italic font-normal">Keine Angabe</span>}</span>

                                    <span className="text-slate-500 font-medium mt-2">Email</span>
                                    <span className="text-brand-600 mt-2 hover:underline cursor-pointer">{partner.email || <span className="text-slate-400 italic no-underline cursor-default">Keine Angabe</span>}</span>

                                    <span className="text-slate-500 font-medium">Telefon</span>
                                    <span className="text-slate-800">{partner.phone || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                    {partner.additional_phones?.length > 0 && (
                                        <>
                                            <span className="text-slate-500 font-medium">Weitere Tel.</span>
                                            <span className="text-slate-800">{partner.additional_phones.join(', ')}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Section: Adresse */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2 mb-4">Anschrift</h4>

                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                    <span className="text-slate-500 font-medium">Straße</span>
                                    <span className="text-slate-800">{partner.street || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                    <span className="text-slate-500 font-medium">PLZ</span>
                                    <span className="text-slate-800">{partner.zip || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                    <span className="text-slate-500 font-medium">Stadt</span>
                                    <span className="text-slate-800">{partner.city || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                    <span className="text-slate-500 font-medium">Land</span>
                                    <span className="text-slate-800">
                                        {partner.country === 'DE' ? 'Deutschland' :
                                            partner.country === 'AT' ? 'Österreich' :
                                                partner.country === 'CH' ? 'Schweiz' :
                                                    partner.country || <span className="text-slate-400 italic">Keine Angabe</span>}
                                    </span>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-50">
                                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3">Zahlungsdaten</h4>
                                    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                        <span className="text-slate-500 font-medium">IBAN</span>
                                        <span className="text-slate-800">{partner.iban || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                        <span className="text-slate-500 font-medium">BIC</span>
                                        <span className="text-slate-800">{partner.bic || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                        <span className="text-slate-500 font-medium">Bank</span>
                                        <span className="text-slate-800">{partner.bank_name || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                        <span className="text-slate-500 font-medium mt-2">Steuer-Nr.</span>
                                        <span className="text-slate-800 mt-2">{partner.tax_id || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                        <span className="text-slate-500 font-medium">USt-IdNr.</span>
                                        <span className="text-slate-800">{partner.vat_id || <span className="text-slate-400 italic">Keine Angabe</span>}</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Memo / Notes */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2">Interne Notizen</h4>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                {partner.notes || <span className="italic text-slate-400">Keine Notizen hinterlegt.</span>}
                            </p>
                        </div>
                    </div>

                    {/* Recent Projects Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <FaBriefcase className="text-brand-500" /> Letzte Projekte
                            </h3>
                        </div>
                        <div>
                            <RecentPartnerProjects partnerId={id!} />
                        </div>
                    </div>
                </div>

                {/* Side Panel */}
                <div className="space-y-6">

                    {/* Statistics Card */}
                    <PartnerStats partnerId={id!} />

                    {/* Skills Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Qualifikationen</h4>
                        </div>
                        <div className="p-5 space-y-5">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Sprachpaare</label>
                                <div className="flex flex-wrap gap-2">
                                    {partner.languages && partner.languages.length > 0 ? (
                                        partner.languages.map((lang: string, i: number) => (
                                            <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-bold shadow-sm">
                                                <img src={getFlagUrl(lang)} className="w-4 h-3 object-cover rounded-sm" alt={lang} />
                                                {getLanguageName(lang)}
                                            </span>
                                        ))
                                    ) : <span className="text-xs text-slate-400 italic">Keine Sprachen angegeben</span>}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Fachgebiete</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {partner.domains && partner.domains.length > 0 ? (
                                        partner.domains.map((domain: string, i: number) => (
                                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium border border-slate-200">
                                                {domain}
                                            </span>
                                        ))
                                    ) : <span className="text-xs text-slate-400 italic">Keine Angabe</span>}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Preise / Raten</label>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                        <span className="text-slate-500">Wortpreis</span>
                                        <span className="font-brand font-bold text-slate-700">{partner.unit_rates?.word ? parseFloat(partner.unit_rates.word).toFixed(2) + ' €' : <span className="text-slate-400 italic font-normal">Keine Angabe</span>}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                        <span className="text-slate-500">Zeilenpreis</span>
                                        <span className="font-brand font-bold text-slate-700">{partner.unit_rates?.line ? parseFloat(partner.unit_rates.line).toFixed(2) + ' €' : <span className="text-slate-400 italic font-normal">Keine Angabe</span>}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Stundensatz</span>
                                        <span className="font-brand font-bold text-slate-700">{partner.hourly_rate ? parseFloat(partner.hourly_rate).toFixed(2) + ' €' : <span className="text-slate-400 italic font-normal">Keine Angabe</span>}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <NewPartnerModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={(data) => updateMutation.mutate(data)}
                initialData={partner}
                isLoading={updateMutation.isPending}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => deleteMutation.mutate(parseInt(id!))}
                title="Partner löschen"
                message={`Möchten Sie den Partner "${name}" wirklich löschen?`}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

// ── Recent Projects for this Partner ────────────────────────────────────
const RecentPartnerProjects = ({ partnerId }: { partnerId: string }) => {
    const navigate = useNavigate();
    const { data: allProjects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll()
    });

    const projects = useMemo(() => {
        const list = Array.isArray(allProjects) ? allProjects : (allProjects?.data || []);
        return list.filter((p: any) => p.partner_id?.toString() === partnerId).slice(0, 10);
    }, [allProjects, partnerId]);

    if (isLoading) return <div className="p-6 text-center text-slate-400 text-xs">Lade Projekte...</div>;
    if (!projects || projects.length === 0) return <div className="p-6 text-center text-slate-400 text-xs italic">Keine Projekte vorhanden.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                        <th className="px-6 py-3 border-b border-slate-100">Projekt</th>
                        <th className="px-6 py-3 border-b border-slate-100">Status</th>
                        <th className="px-6 py-3 border-b border-slate-100 text-right">Betrag</th>
                        <th className="px-6 py-3 border-b border-slate-100 text-right">Datum</th>
                    </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-50">
                    {projects.map((p: any) => (
                        <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                            <td className="px-6 py-3 font-medium text-brand-600 group-hover:underline">{p.project_name || p.title || `Projekt #${p.id}`}</td>
                            <td className="px-6 py-3">
                                <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                    p.status === 'completed' ? 'bg-emerald-600 text-white border-emerald-700' :
                                        ['in_progress', 'review'].includes(p.status) ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            p.status === 'ready_for_pickup' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                p.status === 'invoiced' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    p.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        ['offer', 'pending', 'draft'].includes(p.status) ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                            'bg-slate-100 text-slate-500 border-slate-200'
                                )}>
                                    {p.status === 'completed' ? 'Abgeschlossen' :
                                        ['in_progress', 'review'].includes(p.status) ? 'Bearbeitung' :
                                            p.status === 'ready_for_pickup' ? 'Abholbereit' :
                                                p.status === 'invoiced' ? 'Rechnung' :
                                                    p.status === 'delivered' ? 'Geliefert' :
                                                        ['offer', 'pending', 'draft'].includes(p.status) ? 'Neu' :
                                                            p.status}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-right font-medium text-slate-700">{p.partner_cost_net ? Number(p.partner_cost_net).toFixed(2) + ' €' : '-'}</td>
                            <td className="px-6 py-3 text-right text-slate-500">{new Date(p.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ── Statistics Card ─────────────────────────────────────────────────────
const PartnerStats = ({ partnerId }: { partnerId: string }) => {
    const { data: allProjects } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll()
    });

    const stats = useMemo(() => {
        const list = Array.isArray(allProjects) ? allProjects : (allProjects?.data || []);
        const partnerProjects = list.filter((p: any) => p.partner_id?.toString() === partnerId);

        const totalProjects = partnerProjects.length;
        const completedProjects = partnerProjects.filter((p: any) => p.status === 'completed').length;
        const totalCost = partnerProjects.reduce((sum: number, p: any) => sum + (parseFloat(p.partner_cost_net) || 0), 0);
        const avgCost = totalProjects > 0 ? totalCost / totalProjects : 0;
        const totalWords = partnerProjects.reduce((sum: number, p: any) => sum + (parseInt(p.word_count) || 0), 0);

        return { totalProjects, completedProjects, totalCost, avgCost, totalWords };
    }, [allProjects, partnerId]);

    const fmt = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Auswertung</h4>
                <FaChartLine className="text-emerald-500" />
            </div>
            <div className="p-5 space-y-4">
                <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Projekte gesamt</span>
                    <span className="text-2xl font-black text-slate-800">{stats.totalProjects}</span>
                    <span className="text-xs text-slate-400 ml-2">({stats.completedProjects} abgeschlossen)</span>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Gesamtkosten</span>
                    <span className="text-2xl font-black text-slate-800">{fmt(stats.totalCost)}</span>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Ø Kosten / Projekt</span>
                    <span className="text-lg font-bold text-slate-700">{fmt(stats.avgCost)}</span>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Wörter gesamt</span>
                    <span className="text-lg font-bold text-slate-700">{stats.totalWords.toLocaleString('de-DE')}</span>
                </div>
            </div>
        </div>
    );
};

export default PartnerDetail;
