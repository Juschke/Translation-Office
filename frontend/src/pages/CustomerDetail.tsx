
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, settingsService, projectService } from '../api/services';
import {
    FaArrowLeft, FaEdit, FaTrash, FaEnvelope, FaBriefcase,
    FaMapMarkerAlt, FaFileContract, FaChartLine
} from 'react-icons/fa';
import TableSkeleton from '../components/common/TableSkeleton';
import { useState } from 'react';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import ConfirmModal from '../components/common/ConfirmModal';
import clsx from 'clsx';

const CustomerDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const { data: customer, isLoading } = useQuery({
        queryKey: ['customers', id],
        queryFn: () => customerService.getById(parseInt(id!)),
        enabled: !!id
    });



    const updateMutation = useMutation({
        mutationFn: (data: any) => customerService.update(parseInt(id!), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers', id] });
            setIsEditModalOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (customerId: number) => customerService.delete(customerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            navigate('/customers');
        }
    });

    if (isLoading) return <TableSkeleton rows={5} columns={2} />;
    if (!customer) return <div className="p-10 text-center text-slate-500">Kunde nicht gefunden</div>;

    const name = customer.company_name || `${customer.first_name} ${customer.last_name}`;
    const initials = (customer.company_name?.substring(0, 2) || (customer.first_name?.[0] || '') + (customer.last_name?.[0] || 'C')).toUpperCase();



    return (
        <div className="flex flex-col gap-6 h-full fade-in pb-10">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => location.state?.from ? navigate(location.state.from) : navigate('/customers')}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
                        >
                            <FaArrowLeft />
                        </button>
                        <div className="w-16 h-16 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xl font-bold border border-slate-200 shadow-sm">
                            {initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-800">{name}</h1>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${customer.status === 'Aktiv' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    customer.status === 'Inaktiv' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                                        'bg-slate-50 text-slate-500 border-slate-200'
                                    }`}>
                                    {customer.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><FaBriefcase className="text-slate-400" /> {customer.type === 'company' ? 'Firma' : customer.type === 'authority' ? 'Behörde' : 'Privat'}</span>
                                {customer.email && <span className="flex items-center gap-1"><FaEnvelope className="text-slate-400" /> {customer.email}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/inbox', { state: { compose: true, to: customer.email, subject: `Nachricht an: ${name}` } })}
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
                <div className="lg:col-span-2 space-y-6">
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
                                    {customer.type !== 'private' && (
                                        <>
                                            <span className="text-slate-500 font-medium">{customer.type === 'authority' ? 'Behörde' : 'Firma'}</span>
                                            <span className="text-slate-800 font-semibold">{customer.company_name || '-'}</span>
                                        </>
                                    )}

                                    <span className="text-slate-500 font-medium">Anrede</span>
                                    <span className="text-slate-800">{customer.salutation || '-'}</span>

                                    <span className="text-slate-500 font-medium">Vorname</span>
                                    <span className="text-slate-800">{customer.first_name || '-'}</span>

                                    <span className="text-slate-500 font-medium">Nachname</span>
                                    <span className="text-slate-800 font-bold">{customer.last_name || '-'}</span>

                                    <span className="text-slate-500 font-medium mt-2">Email</span>
                                    <span className="text-brand-600 mt-2 hover:underline cursor-pointer">{customer.email || '-'}</span>

                                    <span className="text-slate-500 font-medium">Telefon</span>
                                    <span className="text-slate-800">{customer.phone || '-'}</span>

                                    <span className="text-slate-500 font-medium">Mobil</span>
                                    <span className="text-slate-800">{customer.mobile || '-'}</span>

                                    {customer.type !== 'private' && (
                                        <>
                                            <span className="text-slate-500 font-medium mt-2">Webseite</span>
                                            <span className="text-brand-600 mt-2 truncate hover:underline cursor-pointer">{customer.website || '-'}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Section: Adresse */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2 mb-4">Rechnungsanschrift</h4>

                                <div className="flex items-start gap-3">
                                    <div className="mt-1 bg-slate-100 p-2 rounded text-slate-400">
                                        <FaMapMarkerAlt />
                                    </div>
                                    <div className="text-sm text-slate-700 leading-relaxed">
                                        <span className="block font-semibold text-slate-800">{customer.address_street} {customer.address_house_no}</span>
                                        <span className="block">{customer.address_zip} {customer.address_city}</span>
                                        <span className="block text-slate-500">{customer.address_country === 'DE' ? 'Deutschland' : customer.address_country === 'AT' ? 'Österreich' : customer.address_country === 'CH' ? 'Schweiz' : customer.address_country}</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-50">
                                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3">Finanzdaten</h4>
                                    <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                                        {customer.type !== 'private' && (
                                            <>
                                                <span className="text-slate-500 font-medium">USt-ID</span>
                                                <span className="text-slate-800">{customer.vat_id || '-'}</span>

                                                <span className="text-slate-500 font-medium">Steuer-ID</span>
                                                <span className="text-slate-800">{customer.tax_id || '-'}</span>
                                            </>
                                        )}

                                        <span className="text-slate-500 font-medium">Zahlungsziel</span>
                                        <span className="font-brand text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{customer.payment_terms || '14'} Tage</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Memo / Notes */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2">Interne Notizen</h4>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                {customer.notes || <span className="italic text-slate-400">Keine Notizen hinterlegt.</span>}
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
                            <RecentProjectsList customerId={id!} />
                        </div>
                    </div>
                </div>

                {/* Side Panel: KPI & Meta */}
                <div className="space-y-6">

                    {/* Financial KPI Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Umsatzstatistik</h4>
                            <FaChartLine className="text-emerald-500" />
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            <div>
                                <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Umsatz YTD</span>
                                <span className="text-2xl font-black text-slate-800">
                                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.sales || 0)}
                                </span>
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
                                <span className="text-slate-400">Kunden-ID</span>
                                <span className="font-brand text-slate-600">{customer.id}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Erstellt am</span>
                                <span className="text-slate-600">{new Date(customer.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Letzte Änderung</span>
                                <span className="text-slate-600">{new Date(customer.updated_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <NewCustomerModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={(data) => updateMutation.mutate(data)}
                initialData={customer}
            // isLoading={updateMutation.isPending} // Not supported by NewCustomerModal yet
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => deleteMutation.mutate(parseInt(id!))}
                title="Kunde löschen"
                message={`Möchten Sie den Kunden "${name}" wirklich löschen?`}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

const RecentProjectsList = ({ customerId }: { customerId: string }) => {
    const navigate = useNavigate();
    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects', { customer_id: customerId }],
        queryFn: () => projectService.getAll({ customer_id: customerId, limit: 5 })
    });

    if (isLoading) return <div className="p-6 text-center text-slate-400 text-xs">Lade Projekte...</div>;
    if (!projects || projects.length === 0) return <div className="p-6 text-center text-slate-400 text-xs italic">Keine Projekte vorhanden.</div>;

    // Use projects.data if paginated, or projects if array
    const list = Array.isArray(projects) ? projects : (projects.data || []);

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
                    {list.slice(0, 5).map((p: any) => (
                        <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                            <td className="px-6 py-3 font-medium text-brand-600 group-hover:underline">{p.title || `Projekt #${p.id}`}</td>
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
                                                        ['offer', 'pending', 'draft'].includes(p.status) ? 'Angebot' :
                                                            p.status}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-right font-medium text-slate-700">{p.total_amount ? Number(p.total_amount).toFixed(2) + ' €' : '-'}</td>
                            <td className="px-6 py-3 text-right text-slate-500">{new Date(p.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CustomerDetail;
