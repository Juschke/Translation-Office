import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService } from '../api/services';
import DataTable from '../components/common/DataTable';
import { Button } from '../components/ui/button';
import NewAppointmentModal from '../components/modals/NewAppointmentModal';
import ConfirmModal from '../components/common/ConfirmModal';
import InterpreterConfirmationModal from '../components/modals/InterpreterConfirmationModal';
import KPICard from '../components/common/KPICard';
import toast from 'react-hot-toast';
import { format, isAfter, isBefore, startOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaFilePdf, FaUserTie, FaCheckCircle, FaCalendarAlt, FaHandshake, FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ProjectSelectionModal from '../components/modals/ProjectSelectionModal';

interface Appointment {
    id: number | string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    type: string;
    location?: string;
    project?: any;
    customer?: any;
    partner?: any;
}

const getInitials = (name: string): string => {
    if (!name) return '?';
    return name
        .split(' ')
        .filter(w => w && w.length > 0)
        .map(w => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
};

const safeFormat = (dateStr: string | undefined | null, formatStr: string, locale: any) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    try {
        return format(date, formatStr, { locale });
    } catch (e) {
        return '—';
    }
};

const Interpreting = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState<any>(null);
    const [isInterpreterModalOpen, setIsInterpreterModalOpen] = useState(false);
    const [selectedProjectForConfirmation, setSelectedProjectForConfirmation] = useState<any>(null);
    const [pendingProjectForConfirmation, setPendingProjectForConfirmation] = useState<any>(null);
    const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);

    const { data: assignments = [], isLoading } = useQuery<Appointment[]>({
        queryKey: ['appointments', 'interpreting'],
        queryFn: () => calendarService.getAll({ type: 'interpreting' })
    });

    const list = useMemo(() => Array.isArray(assignments) ? assignments : [], [assignments]);

    const createMutation = useMutation({
        mutationFn: calendarService.createAppointment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments', 'interpreting'] });
            setIsModalOpen(false);
            if (pendingProjectForConfirmation) {
                setSelectedProjectForConfirmation(pendingProjectForConfirmation);
                setIsInterpreterModalOpen(true);
                setPendingProjectForConfirmation(null);
            }
            toast.success(t('interpreting.messages.create_success'));
        },
        onError: () => toast.error(t('interpreting.messages.create_error'))
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => calendarService.updateAppointment(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments', 'interpreting'] });
            setIsModalOpen(false);
            setEditingAssignment(null);
            toast.success(t('interpreting.messages.update_success'));
        },
        onError: () => toast.error(t('interpreting.messages.update_error'))
    });

    const deleteMutation = useMutation({
        mutationFn: calendarService.deleteAppointment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments', 'interpreting'] });
            setIsConfirmOpen(false);
            setAssignmentToDelete(null);
            toast.success(t('interpreting.messages.delete_success'));
        },
        onError: () => toast.error(t('interpreting.messages.delete_error'))
    });

    const stats = useMemo(() => {
        const now = new Date();
        const startOfCurMonth = startOfMonth(now);

        const upcoming = list.filter(a => {
            const d = new Date(a.start_date);
            return !isNaN(d.getTime()) && isAfter(d, now);
        }).length;

        const completed = list.filter(a => {
            const d = new Date(a.start_date);
            return !isNaN(d.getTime()) && isBefore(d, now);
        }).length;

        const thisMonth = list.filter(a => {
            const d = new Date(a.start_date);
            return !isNaN(d.getTime()) && isAfter(d, startOfCurMonth);
        }).length;

        const uniquePartners = new Set(list.map(a => a.partner?.id).filter(Boolean)).size;

        return { upcoming, completed, thisMonth, uniquePartners };
    }, [list]);

    const columns: any[] = [
        {
            id: 'date',
            header: t('interpreting.columns.date'),
            accessor: (item: Appointment) => {
                const locale = i18n.language === 'de' ? de : undefined;
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800">
                            {safeFormat(item.start_date, 'eeee, dd.MM.yyyy', locale)}
                        </span>
                        <span className="text-2xs text-slate-500 font-medium uppercase tracking-wider">
                            {safeFormat(item.start_date, 'HH:mm', locale)}
                            {item.end_date && ` - ${safeFormat(item.end_date, 'HH:mm', locale)}`}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'title',
            header: t('interpreting.columns.title'),
            accessor: (item: Appointment) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{item.title}</span>
                    {item.project && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/${item.project.id}`);
                            }}
                            className="text-2xs text-brand-primary font-bold uppercase truncate max-w-[200px] hover:underline text-left"
                        >
                            PROJEKT: {item.project.project_number || item.project.project_name}
                        </button>
                    )}
                </div>
            )
        },
        {
            id: 'customer',
            header: t('interpreting.columns.customer'),
            accessor: (item: Appointment) => {
                const customer = item.customer || item.project?.customer;
                if (!customer) return <span className="text-slate-400">-</span>;
                const salutation = customer.salutation ? `${customer.salutation} ` : '';
                const name = customer.company_name || `${salutation}${customer.first_name} ${customer.last_name}` || t('interpreting.columns.unknown');
                return (
                    <div className="flex items-center gap-3 max-w-[240px]">
                        <div className="w-8 h-8 bg-slate-50 border border-slate-100 text-slate-900 flex items-center justify-center text-2xs font-semibold shrink-0 shadow-sm rounded-sm">
                            {getInitials(name)}
                        </div>
                        <div className="flex flex-col text-[11px] leading-tight overflow-hidden">
                            <span className="font-semibold text-slate-800 truncate mb-0.5" title={name}>{name}</span>
                            {customer.email && (
                                <span className="text-2xs text-slate-500 truncate flex items-center gap-1.5 grayscale opacity-70">
                                    <FaEnvelope size={8} /> {customer.email}
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            id: 'partner',
            header: t('interpreting.columns.interpreter'),
            accessor: (item: Appointment) => {
                const partner = item.partner;
                if (!partner) return <span className="text-slate-400 italic">{t('interpreting.columns.not_assigned')}</span>;
                const name = partner.company_name || `${partner.first_name} ${partner.last_name}` || t('interpreting.columns.interpreter');
                return (
                    <div className="flex items-center gap-3 max-w-[240px]">
                        <div className="w-8 h-8 bg-brand-primary/5 border border-brand-primary/10 text-brand-primary flex items-center justify-center text-2xs font-semibold shrink-0 shadow-sm rounded-sm">
                            {getInitials(name)}
                        </div>
                        <div className="flex flex-col text-[11px] leading-tight overflow-hidden">
                            <span className="font-semibold text-slate-800 truncate mb-0.5" title={name}>{name}</span>
                            {partner.email && (
                                <span className="text-2xs text-brand-primary/60 truncate flex items-center gap-1.5">
                                    <FaEnvelope size={8} /> {partner.email}
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            id: 'location',
            header: t('interpreting.columns.location'),
            accessor: (item: Appointment) => item.location ? (
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <FaMapMarkerAlt className="text-2xs text-slate-400" />
                    <span className="text-xs">{item.location}</span>
                </div>
            ) : <span className="text-slate-400">-</span>
        },
        {
            header: t('common.actions'),
            id: 'actions',
            accessor: (item: Appointment) => (
                <div className="flex items-center gap-2">
                    {item.project && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProjectForConfirmation(item.project);
                                setIsInterpreterModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-sm transition-all"
                            title={t('interpreting.actions.generate_confirmation')}
                        >
                            <FaFilePdf className="text-sm" />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingAssignment(item);
                            setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-sm transition-all"
                        title={t('common.edit')}
                    >
                        <FaEdit className="text-sm" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setAssignmentToDelete(item);
                            setIsConfirmOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-all"
                        title={t('common.delete')}
                    >
                        <FaTrash className="text-sm" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6 fade-in pb-10">
            <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight truncate">{t('interpreting.title')}</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">{t('interpreting.subtitle')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button
                        onClick={() => setIsProjectSelectionOpen(true)}
                    >
                        <FaPlus className="text-xs" /> <span className="hidden sm:inline">{t('interpreting.new_assignment')}</span><span className="inline sm:hidden">{t('interpreting.new_short')}</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <KPICard label={t('interpreting.kpi.upcoming')} value={stats.upcoming} icon={<FaCalendarAlt />} />
                <KPICard
                    label={t('interpreting.kpi.completed')}
                    value={stats.completed}
                    icon={<FaCheckCircle />}
                />
                <KPICard
                    label={t('interpreting.kpi.active_interpreters')}
                    value={stats.uniquePartners}
                    icon={<FaUserTie />}
                    subValue={t('interpreting.kpi.deployed_partners')}
                />
                <KPICard
                    label={t('interpreting.kpi.this_month')}
                    value={stats.thisMonth}
                    icon={<FaHandshake />}
                    subValue={t('interpreting.kpi.assignments')}
                />
            </div>

            <DataTable<Appointment>
                data={list}
                columns={columns}
                isLoading={isLoading}
                searchPlaceholder={t('interpreting.search_placeholder')}
                searchFields={['title', 'location', 'description']}
                onRowClick={(row) => {
                    setEditingAssignment(row);
                    setIsModalOpen(true);
                }}
            />


            <NewAppointmentModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingAssignment(null); }}
                onSubmit={(data) => {
                    if (editingAssignment?.id) {
                        updateMutation.mutate({ ...data, id: editingAssignment.id });
                    } else {
                        if (data.project) {
                            setPendingProjectForConfirmation(data.project);
                        }
                        createMutation.mutate({ ...data, type: 'interpreting' });
                    }
                }}
                initialData={editingAssignment}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => { setIsConfirmOpen(false); setAssignmentToDelete(null); }}
                onConfirm={() => {
                    if (assignmentToDelete) {
                        deleteMutation.mutate(assignmentToDelete.id);
                    }
                }}
                title={t('interpreting.confirm.delete_title')}
                message={t('interpreting.confirm.delete_message')}
                isLoading={deleteMutation.isPending}
            />

            {selectedProjectForConfirmation && (
                <InterpreterConfirmationModal
                    isOpen={isInterpreterModalOpen}
                    onClose={() => {
                        setIsInterpreterModalOpen(false);
                        setSelectedProjectForConfirmation(null);
                    }}
                    project={selectedProjectForConfirmation}
                />
            )}

            <ProjectSelectionModal
                isOpen={isProjectSelectionOpen}
                onClose={() => setIsProjectSelectionOpen(false)}
                onSelect={(project) => {
                    setIsProjectSelectionOpen(false);
                    setSelectedProjectForConfirmation(project);
                    setIsInterpreterModalOpen(true);
                }}
            />
        </div>
    );
};

export default Interpreting;
