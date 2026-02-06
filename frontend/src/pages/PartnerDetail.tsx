
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnerService } from '../api/services';
import {
    FaArrowLeft, FaEdit, FaTrash, FaEnvelope, FaGlobe, FaStar,
    FaUserTie, FaMapMarkerAlt, FaPhone, FaBuilding, FaLanguage, FaBan, FaCheck,
    FaMoneyBillWave, FaFileContract
} from 'react-icons/fa';
import TableSkeleton from '../components/common/TableSkeleton';
import { getFlagUrl } from '../utils/flags';
import { useState } from 'react';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import ConfirmModal from '../components/common/ConfirmModal';

const PartnerDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
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
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/partners')}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
                        >
                            <FaArrowLeft />
                        </button>
                        <div className="w-16 h-16 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold border border-indigo-100 shadow-sm">
                            {initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-800">{name}</h1>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${partner.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    partner.status === 'busy' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-slate-50 text-slate-500 border-slate-200'
                                    }`}>
                                    {partner.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><FaUserTie className="text-slate-400" /> {partner.type}</span>
                                {partner.email && <span className="flex items-center gap-1"><FaEnvelope className="text-slate-400" /> {partner.email}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/inbox', { state: { compose: true, to: partner.email, subject: `Anfrage: ${name}` } })}
                            className="bg-white border border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-200 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm transition active:scale-95"
                        >
                            <FaEnvelope /> Email
                        </button>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-brand-600 border border-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm transition active:scale-95"
                        >
                            <FaEdit /> Bearbeiten
                        </button>
                        <div className="h-8 w-px bg-slate-200 mx-1"></div>
                        <button
                            onClick={() => setIsConfirmOpen(true)}
                            className="text-slate-400 hover:text-red-600 p-2 rounded transition hover:bg-red-50"
                            title="Löschen"
                        >
                            <FaTrash />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Main Stammdaten Card */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
                                <span className="text-slate-800 font-semibold">{partner.company || '-'}</span>

                                <span className="text-slate-500 font-medium">Vorname</span>
                                <span className="text-slate-800">{partner.first_name || '-'}</span>

                                <span className="text-slate-500 font-medium">Nachname</span>
                                <span className="text-slate-800">{partner.last_name || '-'}</span>

                                <span className="text-slate-500 font-medium mt-2">Email</span>
                                <span className="text-brand-600 mt-2 hover:underline cursor-pointer">{partner.email || '-'}</span>

                                <span className="text-slate-500 font-medium">Telefon</span>
                                <span className="text-slate-800">{partner.phone || '-'}</span>

                                <span className="text-slate-500 font-medium">Mobil</span>
                                <span className="text-slate-800">{partner.mobile || '-'}</span>

                                <span className="text-slate-500 font-medium mt-2">Webseite</span>
                                <span className="text-brand-600 mt-2 truncate hover:underline cursor-pointer">{partner.website || '-'}</span>
                            </div>
                        </div>

                        {/* Section: Adresse */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2 mb-4">Anschrift</h4>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-slate-100 p-2 rounded text-slate-400">
                                    <FaMapMarkerAlt />
                                </div>
                                <div className="text-sm text-slate-700 leading-relaxed">
                                    <span className="block font-semibold text-slate-800">{partner.steet}</span>
                                    <span className="block">{partner.zip} {partner.city}</span>
                                    <span className="block text-slate-500">{partner.country}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-50">
                                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3">Zahlungsdaten</h4>
                                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                                    <span className="text-slate-500 font-medium">IBAN</span>
                                    <span className="font-brand text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{partner.iban || '-'}</span>

                                    <span className="text-slate-500 font-medium">BIC</span>
                                    <span className="font-brand text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{partner.bic || '-'}</span>

                                    <span className="text-slate-500 font-medium">Bank</span>
                                    <span className="text-slate-800">{partner.bank_name || '-'}</span>

                                    <span className="text-slate-500 font-medium mt-2">Steuer-ID</span>
                                    <span className="text-slate-800 mt-2">{partner.tax_id || '-'}</span>

                                    <span className="text-slate-500 font-medium">USt-ID</span>
                                    <span className="text-slate-800">{partner.vat_id || '-'}</span>
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

                {/* Side Panel: Skills & Meta */}
                <div className="space-y-6">

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
                                                {lang}
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
                                    ) : <span className="text-xs text-slate-400 italic">-</span>}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Preise / Raten</label>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                        <span className="text-slate-500">Wortpreis</span>
                                        <span className="font-brand font-bold text-slate-700">{partner.unit_rates?.word ? parseFloat(partner.unit_rates.word).toFixed(2) + ' €' : '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                        <span className="text-slate-500">Zeilenpreis</span>
                                        <span className="font-brand font-bold text-slate-700">{partner.unit_rates?.line ? parseFloat(partner.unit_rates.line).toFixed(2) + ' €' : '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Stundensatz</span>
                                        <span className="font-brand font-bold text-slate-700">{partner.hourly_rate ? parseFloat(partner.hourly_rate).toFixed(2) + ' €' : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Metadaten</h4>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">ID</span>
                                <span className="font-brand text-slate-600">{partner.id}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Erstellt am</span>
                                <span className="text-slate-600">{new Date(partner.created_at).toLocaleDateString('de-DE')}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Letzte Änderung</span>
                                <span className="text-slate-600">{new Date(partner.updated_at).toLocaleDateString('de-DE')}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-50 mt-2">
                                <span className="text-slate-400">Bewertung</span>
                                <div className="flex items-center gap-1 text-amber-400 font-bold">
                                    <span className="text-slate-700">{partner.rating || '0.0'}</span>
                                    <FaStar />
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

export default PartnerDetail;
