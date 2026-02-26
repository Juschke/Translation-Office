import { useState, useMemo } from 'react';
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
import { FaPlus, FaEdit, FaTrash, FaUser, FaBuilding, FaMapMarkerAlt, FaFilePdf, FaUserTie, FaCheckCircle, FaCalendarAlt, FaHandshake } from 'react-icons/fa';
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

const Interpreting = () => {
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
            toast.success('Einsatz erstellt');
        },
        onError: () => toast.error('Fehler beim Erstellen')
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => calendarService.updateAppointment(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments', 'interpreting'] });
            setIsModalOpen(false);
            setEditingAssignment(null);
            toast.success('Einsatz aktualisiert');
        },
        onError: () => toast.error('Fehler beim Aktualisieren')
    });

    const deleteMutation = useMutation({
        mutationFn: calendarService.deleteAppointment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments', 'interpreting'] });
            setIsConfirmOpen(false);
            setAssignmentToDelete(null);
            toast.success('Einsatz gelöscht');
        },
        onError: () => toast.error('Fehler beim Löschen')
    });

    const stats = useMemo(() => {
        const now = new Date();
        const startOfCurMonth = startOfMonth(now);

        const upcoming = assignments.filter(a => isAfter(new Date(a.start_date), now)).length;
        const completed = assignments.filter(a => isBefore(new Date(a.start_date), now)).length;
        const thisMonth = assignments.filter(a => isAfter(new Date(a.start_date), startOfCurMonth)).length;
        const uniquePartners = new Set(assignments.map(a => a.partner?.id).filter(Boolean)).size;

        return { upcoming, completed, thisMonth, uniquePartners };
    }, [assignments]);

    const columns: any[] = [
        {
            id: 'date',
            header: 'Datum & Zeit',
            accessor: (item: Appointment) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">
                        {format(new Date(item.start_date), 'dd.MM.yyyy', { locale: de })}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                        {format(new Date(item.start_date), 'HH:mm', { locale: de })}
                        {item.end_date && ` - ${format(new Date(item.end_date), 'HH:mm', { locale: de })}`}
                    </span>
                </div>
            )
        },
        {
            id: 'title',
            header: 'Einsatz / Titel',
            accessor: (item: Appointment) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{item.title}</span>
                    {item.project && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/${item.project.id}`);
                            }}
                            className="text-[10px] text-brand-primary font-bold uppercase truncate max-w-[200px] hover:underline text-left"
                        >
                            PROJEKT: {item.project.project_number || item.project.project_name}
                        </button>
                    )}
                </div>
            )
        },
        {
            id: 'customer',
            header: 'Kunde',
            accessor: (item: Appointment) => {
                const customer = item.customer || item.project?.customer;
                if (!customer) return <span className="text-slate-400">-</span>;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                            <FaBuilding />
                        </div>
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">
                            {customer.company_name || `${customer.first_name} ${customer.last_name}`}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'partner',
            header: 'Dolmetscher',
            accessor: (item: Appointment) => {
                const partner = item.partner;
                if (!partner) return <span className="text-slate-400">Nicht zugewiesen</span>;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-[10px] text-brand-primary shrink-0">
                            <FaUser />
                        </div>
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">
                            {partner.company_name || `${partner.first_name} ${partner.last_name}`}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'location',
            header: 'Ort',
            accessor: (item: Appointment) => item.location ? (
                <div className="flex items-center gap-1.5 text-slate-500">
                    <FaMapMarkerAlt className="text-[10px]" />
                    <span className="text-xs truncate max-w-[120px]">{item.location}</span>
                </div>
            ) : <span className="text-slate-400">-</span>
        },
        {
            header: 'Aktionen',
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
                            title="Dolmetscherbestätigung erzeugen"
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
                        title="Bearbeiten"
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
                        title="Löschen"
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
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight truncate">Dolmetschereinsätze</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">Zentrale Verwaltung aller Vor-Ort und Online Dolmetschtertermine.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button
                        onClick={() => setIsProjectSelectionOpen(true)}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-sm flex items-center justify-center gap-2 transition"
                    >
                        <FaPlus className="text-xs" /> <span className="hidden sm:inline">Neuer Einsatz</span><span className="inline sm:hidden">Neu</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KPICard label="Anstehend" value={stats.upcoming} icon={<FaCalendarAlt />} iconColor="text-blue-600" />
                <KPICard
                    label="Abgeschlossen"
                    value={stats.completed}
                    icon={<FaCheckCircle />}
                    iconColor="text-emerald-600"
                />
                <KPICard
                    label="Aktive Dolmetscher"
                    value={stats.uniquePartners}
                    icon={<FaUserTie />}
                    iconColor="text-brand-primary"
                    subValue="Eingesetzte Partner"
                />
                <KPICard
                    label="Diesen Monat"
                    value={stats.thisMonth}
                    icon={<FaHandshake />}
                    iconColor="text-amber-600"
                    subValue="Assignments"
                />
            </div>

            <DataTable<Appointment>
                data={assignments}
                columns={columns}
                isLoading={isLoading}
                pageSize={10}
                searchPlaceholder="Einsätze suchen..."
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
                title="Einsatz löschen"
                message="Sind Sie sicher, dass Sie diesen Dolmetschereinsatz löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden."
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
