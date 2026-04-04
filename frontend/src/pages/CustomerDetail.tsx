
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, projectService } from '../api/services';
import {
    FaArrowLeft, FaEdit, FaTrash, FaEnvelope, FaBriefcase,
    FaFileContract, FaChartLine
} from 'react-icons/fa';
import TableSkeleton from '../components/common/TableSkeleton';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import ConfirmModal from '../components/common/ConfirmModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/ui/button';


const CustomerDetail = () => {
    const { t } = useTranslation();
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
        <div className="flex-1 flex flex-col overflow-hidden fade-in bg-slate-50/20">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-16 py-8">
                {/* Header */}
                <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 md:p-6 mb-8">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <button
                                onClick={() => location.state?.from ? navigate(location.state.from) : navigate('/customers')}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition shrink-0"
                            >
                                <FaArrowLeft />
                            </button>
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-sm bg-slate-100 text-slate-600 flex items-center justify-center text-lg md:text-xl font-medium border border-slate-200 shadow-sm shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-lg md:text-2xl font-medium text-slate-800 truncate">{name}</h1>
                                    <StatusBadge status={customer.status || 'active'} type="customer" />
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1 flex-wrap">
                                    <span className="flex items-center gap-1"><FaBriefcase className="text-slate-400" /> {customer.type === 'company' ? t('customers.type_company_label') : customer.type === 'authority' ? t('customers.type_authority_label') : t('customers.type_private_label')}</span>
                                    {customer.email && <span className="flex items-center gap-1 truncate"><FaEnvelope className="text-slate-400" /> {customer.email}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap ml-0 md:ml-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/inbox', { state: { compose: true, to: customer.email, subject: `Nachricht an: ${name}` } })}
                                className="px-3 py-2 text-xs font-medium flex items-center gap-2"
                            >
                                <FaEnvelope /> E-Mail
                            </Button>
                            <Button
                                variant="default"
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-3 py-2 text-xs font-medium flex items-center gap-2"
                            >
                                <FaEdit /> Bearbeiten
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => setIsConfirmOpen(true)}
                                className="px-3 py-2 text-xs font-medium flex items-center gap-2"
                            >
                                <FaTrash /> Löschen
                            </Button>
                        </div>

                        {/* Meta Info Bar */}
                        <div className="flex items-center gap-6 text-xs text-slate-400 flex-wrap border-t border-slate-100 pt-3 mt-1">
                            <div className="flex items-center gap-2">
                                <span>Kunden-ID: <span className="text-slate-600 font-medium">{customer.customer_id}</span></span>
                            </div>
                            <span className="text-slate-200">•</span>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                <span>Erstellt am <span className="text-slate-600 font-medium">{new Date(customer.created_at).toLocaleDateString('de-DE')}</span></span>
                            </div>
                            <span className="text-slate-200">•</span>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                <span>Zuletzt geändert: <span className="text-slate-600 font-medium">{new Date(customer.updated_at).toLocaleDateString('de-DE')}</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Stammdaten Card */}
                        <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <h3 className="font-medium text-slate-700 flex items-center gap-2">
                                    <FaFileContract className="text-slate-600" /> Stammdatenblatt
                                </h3>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">

                                {/* Section: Kontakt */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-medium text-slate-400 border-b border-slate-100 pb-2 mb-4">Kontaktinformationen</h4>

                                    <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-2 text-sm break-words">
                                        <span className="text-slate-500 font-medium">Anrede</span>
                                        <span className="text-slate-800">{customer.salutation || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                        <span className="text-slate-500 font-medium">Vorname</span>
                                        <span className="text-slate-800">{customer.first_name || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                        <span className="text-slate-500 font-medium">Nachname</span>
                                        <span className="text-slate-800 font-medium">{customer.last_name || <span className="text-slate-400 italic font-normal">Keine Angabe</span>}</span>

                                        <span className="text-slate-500 font-medium mt-2">Email</span>
                                        <span className="text-slate-700 mt-2 hover:underline cursor-pointer">{customer.email || <span className="text-slate-400 italic no-underline cursor-default">Keine Angabe</span>}</span>

                                        <span className="text-slate-500 font-medium">Telefon</span>
                                        <span className="text-slate-800">{customer.phone || <span className="text-slate-400 italic">Keine Angabe</span>}</span>
                                    </div>
                                </div>

                                {/* Section: Adresse */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-medium text-slate-400 border-b border-slate-100 pb-2 mb-4">Anschrift</h4>

                                    <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-2 text-sm break-words">
                                        <span className="text-slate-500 font-medium">Straße</span>
                                        <span className="text-slate-800">{customer.address_street || customer.street || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                        <span className="text-slate-500 font-medium">PLZ</span>
                                        <span className="text-slate-800">{customer.address_zip || customer.zip || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                        <span className="text-slate-500 font-medium">Stadt</span>
                                        <span className="text-slate-800">{customer.address_city || customer.city || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                        <span className="text-slate-500 font-medium">Land</span>
                                        <span className="text-slate-800">{customer.country || 'Deutschland'}</span>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-50">
                                        <h4 className="text-xs font-medium text-slate-400 mb-3">Zahlungsdaten</h4>
                                        <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-2 text-sm break-words">
                                            <span className="text-slate-500 font-medium">USt-IdNr.</span>
                                            <span className="text-slate-800">{customer.vat_id || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                            <span className="text-slate-500 font-medium mt-2">IBAN</span>
                                            <span className="text-slate-800 mt-2">{customer.iban || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                            <span className="text-slate-500 font-medium">Bank</span>
                                            <span className="text-slate-800">{customer.bank_name || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                            <span className="text-slate-500 font-medium">BLZ</span>
                                            <span className="text-slate-800">{customer.bank_code || <span className="text-slate-400 italic">Keine Angabe</span>}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Memo / Notes */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                                <h4 className="text-xs font-medium text-slate-400 mb-2">Interne Notizen</h4>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                    {customer.notes || <span className="italic text-slate-400">Keine Notizen hinterlegt.</span>}
                                </p>
                            </div>
                        </div>

                        {/* Recent Projects Card */}
                        <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <h3 className="font-medium text-slate-700 flex items-center gap-2">
                                    <FaBriefcase className="text-slate-600" /> Letzte Projekte
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
                        <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <h4 className="text-xs font-medium text-slate-500">Umsatzstatistik</h4>
                                <FaChartLine className="text-emerald-500" />
                            </div>
                            <div className="p-6 flex flex-col gap-6">
                                <div>
                                    <span className="text-xs text-slate-400 block mb-1 font-medium">Umsatz lfd. Jahr</span>
                                    <span className="text-2xl font-semibold text-slate-800">
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.sales_current_year || 0)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                    <div>
                                        <span className="text-xs text-slate-400 block mb-0.5 font-medium">Vorjahr</span>
                                        <span className="text-sm font-semibold text-slate-600">
                                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.sales_last_year || 0)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-400 block mb-0.5 font-medium">Total</span>
                                        <span className="text-sm font-semibold text-slate-600">
                                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.sales_total || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <NewCustomerModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSubmit={(data) => updateMutation.mutate(data)} initialData={customer} />
                <ConfirmModal
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => deleteMutation.mutate(parseInt(id!))}
                    title="Kunde löschen"
                    message={`Möchten Sie den Kunden "${name}" wirklich löschen?`}
                    isLoading={deleteMutation.isPending}
                />

                {/* Spacer for bottom padding */}
                <div className="h-32" />
            </div>
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
                <thead className="bg-transparent text-slate-500 text-xs font-medium tracking-wider">
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
                            <td className="px-6 py-3 font-medium text-slate-700 group-hover:underline">{p.title || `Projekt #${p.id}`}</td>
                            <td className="px-6 py-3">
                                <StatusBadge status={p.status} />
                            </td>
                            <td className="px-6 py-3 text-right font-medium text-slate-700">{p.price_total ? Number(p.price_total).toFixed(2) + ' €' : '-'}</td>
                            <td className="px-6 py-3 text-right text-slate-500">{new Date(p.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CustomerDetail;
