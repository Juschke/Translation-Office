import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService, projectService, userService } from '../api/services';
import { FaPlus, FaSearch, FaUmbrellaBeach, FaMicrophone } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import toast from 'react-hot-toast';
import NewAppointmentModal from '../components/modals/NewAppointmentModal';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import dayjs from 'dayjs';

const roleTranslations: Record<string, string> = {
    'owner': 'Inhaber',
    'admin': 'Administrator',
    'manager': 'Manager',
    'project_manager': 'Projektmanager',
    'translator': 'Übersetzer',
    'interpreter': 'Dolmetscher',
    'editor': 'Lektor',
    'proofreader': 'Korrektor',
    'sales': 'Vertrieb',
    'accounting': 'Buchhaltung',
    'support': 'Support',
    'employee': 'Mitarbeiter',
    'user': 'Mitarbeiter'
};

const Calendar = () => {
    const calendarRef = useRef<FullCalendar>(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<any>(null);
    const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
    const [calendarTab, setCalendarTab] = useState<'all' | 'staff'>('all');
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
    const [userSearch, setUserSearch] = useState('');
    const [projectSearch, setProjectSearch] = useState('');

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['calendar', 'events', dateRange],
        queryFn: () => calendarService.getEvents(dateRange?.start, dateRange?.end),
        enabled: !!dateRange
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => userService.getAll()
    });


    const filteredUsers = users.filter((u: any) =>
        (u.first_name + ' ' + u.last_name).toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
    );

    const { data: allProjects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll()
    });

    const unassignedProjects = (allProjects || []).filter((p: any) => {
        const isNotFinished = !['completed', 'deleted', 'archived', 'canceled'].includes(p.status);
        const hasNoDeadline = !p.deadline;
        const matchesSearch = (p.project_name || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
            (p.project_number || '').toLowerCase().includes(projectSearch.toLowerCase());
        return isNotFinished && hasNoDeadline && matchesSearch;
    });

    useEffect(() => {
        const draggableEl = document.getElementById('unassigned-projects-list');
        if (draggableEl && unassignedProjects.length > 0 && calendarTab === 'all') {
            const draggable = new Draggable(draggableEl, {
                itemSelector: '.project-drag-item',
                eventData: (eventEl) => {
                    return {
                        title: '🏁 ' + (eventEl.getAttribute('data-title') || 'Projekt'),
                        id: 'project_' + eventEl.getAttribute('data-id'),
                        duration: '02:00',
                        create: false
                    };
                }
            });
            return () => draggable.destroy();
        }
    }, [unassignedProjects, calendarTab]);

    useEffect(() => {
        const draggableEl = document.getElementById('staff-list');
        if (draggableEl && filteredUsers.length > 0 && calendarTab === 'staff') {
            const draggable = new Draggable(draggableEl, {
                itemSelector: '.staff-drag-item',
                eventData: (eventEl) => {
                    return {
                        title: '👤 ' + (eventEl.getAttribute('data-name') || 'Mitarbeiter'),
                        id: 'temp_staff_' + eventEl.getAttribute('data-id'),
                        duration: '02:00',
                        create: false,
                        backgroundColor: '#8b5cf6',
                        borderColor: '#7c3aed'
                    };
                }
            });
            return () => draggable.destroy();
        }
    }, [filteredUsers, calendarTab]);


    const updateProjectMutation = useMutation({
        mutationFn: (data: { id: string; deadline: string }) => projectService.update(data.id, data),
        onMutate: async (updatedProject) => {
            await queryClient.cancelQueries({ queryKey: ['calendar', 'events'] });
            const previousEvents = queryClient.getQueryData(['calendar', 'events']);

            queryClient.setQueryData(['calendar', 'events'], (old: any[] | undefined) => {
                if (!old) return [];
                return old.map(ev => {
                    if (ev.extendedProps?.type === 'project' && ev.extendedProps?.project_id?.toString() === updatedProject.id) {
                        return { ...ev, start: updatedProject.deadline, deadline: updatedProject.deadline };
                    }
                    return ev;
                });
            });
            return { previousEvents };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success('Deadline gesetzt');
        },
        onError: () => {
            toast.error('Fehler beim Setzen der Deadline');
        }
    });

    const createMutation = useMutation({
        mutationFn: calendarService.createAppointment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
            setIsModalOpen(false);
            toast.success('Termin erstellt');
        },
        onError: () => toast.error('Fehler beim Erstellen des Termins')
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => calendarService.updateAppointment(data.id, data),
        onMutate: async (updatedAppointment) => {
            await queryClient.cancelQueries({ queryKey: ['calendar', 'events'] });
            const previousEvents = queryClient.getQueryData(['calendar', 'events']);

            queryClient.setQueryData(['calendar', 'events'], (old: any[] | undefined) => {
                if (!old) return [];
                return old.map(ev => {
                    if (ev.extendedProps?.appointment_id === updatedAppointment.id) {
                        return {
                            ...ev,
                            start: updatedAppointment.start_date || ev.start,
                            end: updatedAppointment.end_date || ev.end
                        };
                    }
                    return ev;
                });
            });
            return { previousEvents };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
            setIsModalOpen(false);
            setEditingAppointment(null);
            toast.success('Termin aktualisiert');
        },
        onError: (_err, _variables, context: any) => {
            if (context?.previousEvents) {
                queryClient.setQueryData(['calendar', 'events'], context.previousEvents);
            }
            toast.error('Fehler beim Aktualisieren');
        }
    });


    const handleDateSelect = (selectInfo: any) => {
        setSelectedDate(selectInfo.start);
        // If we are in the staff tab, default new appointments to interpreting
        setEditingAppointment(calendarTab === 'staff' ? { type: 'interpreting' } : null);
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        const { project_id, appointment_id, id } = clickInfo.event.extendedProps;
        const type = clickInfo.event.extendedProps.type || 'appointment';

        // If it's a specific appointment type, open the modal even if there's a project_id
        if (['appointment', 'interpreting', 'staff', 'vacation'].includes(type)) {
            setEditingAppointment({
                id: appointment_id || id,
                title: clickInfo.event.title,
                ...clickInfo.event.extendedProps,
                start_date: clickInfo.event.start,
                end_date: clickInfo.event.end
            });
            setIsModalOpen(true);
        } else if (type === 'project' || project_id) {
            navigate(`/projects/${project_id || id.replace('project_', '')}`);
        } else if (type === 'invoice') {
            navigate('/invoices');
        }
    };


    const renderEventContent = (eventInfo: any) => {
        const { extendedProps, title } = eventInfo.event;
        const customer = extendedProps.customer;
        const langPair = extendedProps.language_pair;
        const time = extendedProps.deadline || (eventInfo.timeText);
        const type = extendedProps.type || 'appointment';

        return (
            <div className="flex flex-col w-full h-full p-1 overflow-hidden transition-all group/event">
                <div className="flex items-start justify-between gap-1 mb-0.5">
                    <span className="font-bold text-[10px] truncate leading-tight">
                        {title}
                    </span>
                    {time && (
                        <span className="text-[9px] font-medium opacity-80 whitespace-nowrap">
                            {time}
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-0.5 mt-auto">
                    {customer && (
                        <div className="text-[9px] opacity-90 truncate italic">
                            {customer}
                        </div>
                    )}
                    {langPair && (
                        <div className="flex items-center gap-1 text-[9px] opacity-90 font-bold bg-white/20 px-1 rounded-[2px] transition-all">
                            <span>{langPair}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 fade-in h-[calc(100vh-140px)]">
            <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight truncate">Kalender & Termine</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">Übersicht über alle Projekte, Rechnungen und Einsätze.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {calendarTab === 'staff' ? (
                        <>
                            <Button
                                onClick={() => { setEditingAppointment({ type: 'vacation' }); setSelectedDate(new Date()); setIsModalOpen(true); }}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-sm flex items-center justify-center gap-2 transition text-xs sm:text-sm"
                            >
                                <FaPlus className="text-xs" /> Urlaub
                            </Button>
                            <Button
                                onClick={() => { setEditingAppointment({ type: 'interpreting' }); setSelectedDate(new Date()); setIsModalOpen(true); }}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-sm flex items-center justify-center gap-2 transition text-xs sm:text-sm"
                            >
                                <FaPlus className="text-xs" /> Dolmetscher
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => { setEditingAppointment(null); setSelectedDate(new Date()); setIsModalOpen(true); }}
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-sm flex items-center justify-center gap-2 transition text-xs sm:text-sm"
                        >
                            <FaPlus className="text-xs" /> Termin
                        </Button>
                    )}
                </div>
            </div>

            {/* Calendar Tabs - Mobile: before calendar, Desktop: stays here */}
            <div className="hidden lg:flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2">
                    {[
                        { id: 'all', label: 'Allgemein' },
                        { id: 'staff', label: 'Personalplanung' }
                    ].map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => setCalendarTab(tab.id as any)}
                            className={clsx(
                                "px-4 py-2 text-xs font-bold transition-all rounded-sm flex items-center gap-2 whitespace-nowrap",
                                calendarTab === tab.id
                                    ? "bg-brand-primary text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setView('dayGridMonth'); calendarRef.current?.getApi().changeView('dayGridMonth'); }}
                        className={clsx(
                            "px-3 py-2 text-xs font-bold transition-all rounded-sm whitespace-nowrap",
                            view === 'dayGridMonth'
                                ? "bg-slate-300 text-slate-800 shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        Monat
                    </button>
                    <button
                        onClick={() => { setView('timeGridWeek'); calendarRef.current?.getApi().changeView('timeGridWeek'); }}
                        className={clsx(
                            "px-3 py-2 text-xs font-bold transition-all rounded-sm whitespace-nowrap",
                            view === 'timeGridWeek'
                                ? "bg-slate-300 text-slate-800 shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        Woche
                    </button>
                    <button
                        onClick={() => { setView('timeGridDay'); calendarRef.current?.getApi().changeView('timeGridDay'); }}
                        className={clsx(
                            "px-3 py-2 text-xs font-bold transition-all rounded-sm whitespace-nowrap",
                            view === 'timeGridDay'
                                ? "bg-slate-300 text-slate-800 shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        Tag
                    </button>
                </div>
            </div>

            {/* Main Content Area with Sidebar */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Mobile Tabs - Only visible on mobile */}
                <div className="lg:hidden flex flex-col gap-2">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { id: 'all', label: 'Allgemein' },
                            { id: 'staff', label: 'Personalplanung' }
                        ].map((tab: any) => (
                            <button
                                key={tab.id}
                                onClick={() => setCalendarTab(tab.id as any)}
                                className={clsx(
                                    "px-4 py-2 text-xs font-bold transition-all rounded-sm flex items-center gap-2 whitespace-nowrap",
                                    calendarTab === tab.id
                                        ? "bg-brand-primary text-white shadow-sm"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button
                            onClick={() => { setView('dayGridMonth'); calendarRef.current?.getApi().changeView('dayGridMonth'); }}
                            className={clsx(
                                "px-3 py-2 text-xs font-bold transition-all rounded-sm whitespace-nowrap",
                                view === 'dayGridMonth'
                                    ? "bg-slate-300 text-slate-800 shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            Monat
                        </button>
                        <button
                            onClick={() => { setView('timeGridWeek'); calendarRef.current?.getApi().changeView('timeGridWeek'); }}
                            className={clsx(
                                "px-3 py-2 text-xs font-bold transition-all rounded-sm whitespace-nowrap",
                                view === 'timeGridWeek'
                                    ? "bg-slate-300 text-slate-800 shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            Woche
                        </button>
                        <button
                            onClick={() => { setView('timeGridDay'); calendarRef.current?.getApi().changeView('timeGridDay'); }}
                            className={clsx(
                                "px-3 py-2 text-xs font-bold transition-all rounded-sm whitespace-nowrap",
                                view === 'timeGridDay'
                                    ? "bg-slate-300 text-slate-800 shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            Tag
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col p-4 relative z-0 min-h-[600px] lg:min-h-0">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                        </div>
                    )}

                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView={view}
                        locales={[deLocale]}
                        locale="de"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: ''
                        }}
                        events={events.map((ev: any) => ({
                            ...ev,
                            className: `event-type-${ev.extendedProps?.type || 'appointment'}`
                        })).filter((ev: any) => {
                            if (calendarTab === 'all') return true;
                            if (calendarTab === 'staff') return ['staff', 'vacation', 'interpreting'].includes(ev.extendedProps.type);
                            return true;
                        })}
                        editable={true}
                        droppable={true}
                        eventReceive={(info) => {
                            // Handle dropped staff or project
                            const eventId = info.event.id;
                            if (eventId.startsWith('temp_staff_')) {
                                const userId = eventId.replace('temp_staff_', '');
                                const user = users.find((u: any) => u.id === Number(userId));
                                if (user) {
                                    const start = info.event.start || new Date();
                                    const end = info.event.end || dayjs(start).add(2, 'hour').toDate();

                                    setEditingAppointment({
                                        type: 'staff',
                                        title: `Einsatz: ${user.first_name} ${user.last_name}`,
                                        user_id: Number(userId),
                                        start_date: start,
                                        end_date: end
                                    });
                                    setSelectedDate(start);
                                    setIsModalOpen(true);
                                }
                                info.event.remove();
                            }
                        }}
                        eventDrop={(info) => {
                            const { type, project_id, appointment_id } = info.event.extendedProps;
                            const newStart = info.event.start?.toISOString();
                            const newEnd = info.event.end?.toISOString();

                            if (type === 'project' && project_id && newStart) {
                                updateProjectMutation.mutate({ id: project_id.toString(), deadline: newStart });
                            } else if (type === 'appointment' && appointment_id && newStart) {
                                updateMutation.mutate({ id: appointment_id, start_date: newStart, end_date: newEnd });
                            }
                        }}
                        eventResize={(info) => {
                            const { type, appointment_id } = info.event.extendedProps;
                            const newStart = info.event.start?.toISOString();
                            const newEnd = info.event.end?.toISOString();
                            if (type === 'appointment' && appointment_id && newStart) {
                                updateMutation.mutate({ id: appointment_id, start_date: newStart, end_date: newEnd });
                            }
                        }}
                        selectable={true}
                        select={handleDateSelect}
                        eventClick={handleEventClick}
                        eventContent={renderEventContent}
                        datesSet={(arg) => {
                            if (dateRange?.start !== arg.startStr || dateRange?.end !== arg.endStr) {
                                setDateRange({ start: arg.startStr, end: arg.endStr });
                            }
                        }}
                        height="100%"
                        dayMaxEvents={4}
                        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                    />
                </div>

                {/* Sidebar Side */}
                <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 h-auto lg:h-full max-h-[500px] lg:max-h-full">
                    {calendarTab === 'all' ? (
                        <div className="bg-white rounded-sm border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                                        Nicht zugeordnete Projekte
                                    </h3>
                                    <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm">
                                        {unassignedProjects.length}
                                    </span>
                                </div>
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />
                                    <input
                                        type="text"
                                        placeholder="Projekt suchen..."
                                        value={projectSearch}
                                        onChange={(e) => setProjectSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-sm text-xs focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/10" id="unassigned-projects-list">
                                {unassignedProjects.map((p: any) => (
                                    <div
                                        key={p.id}
                                        data-id={p.id}
                                        data-title={p.project_number || p.project_name}
                                        className="project-drag-item p-3 bg-white border border-slate-200 rounded-sm hover:border-brand-primary transition-all cursor-move group shadow-sm hover:shadow-md active:cursor-grabbing active:opacity-50"
                                        onClick={() => {
                                            setEditingAppointment({
                                                title: p.project_name,
                                                project_id: p.id,
                                                customer_id: p.customer_id,
                                                partner_id: p.partner_id,
                                                type: 'meeting',
                                                description: `Termin für Projekt: ${p.project_number || p.id}`
                                            });
                                            setSelectedDate(p.deadline ? new Date(p.deadline) : new Date());
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {p.project_number || `ID ${p.id}`}
                                                </span>
                                                <span className={clsx(
                                                    "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0",
                                                    p.priority === 'high' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {p.priority === 'high' ? '⚡ Express' : 'Standard'}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-brand-primary transition-colors leading-tight">
                                                {p.project_name}
                                            </h4>
                                            <div className="mt-1 flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                                                    {(p.customer?.company_name || p.customer?.first_name || 'P').charAt(0)}
                                                </div>
                                                <span className="text-[10px] text-slate-600 font-medium truncate">
                                                    {p.customer?.company_name || `${p.customer?.first_name || ''} ${p.customer?.last_name || ''}`.trim() || 'Privatkunde'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {unassignedProjects.length === 0 && (
                                    <div className="p-8 flex flex-col items-center justify-center text-center text-slate-400">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                            <FaSearch className="text-2xl text-slate-300" />
                                        </div>
                                        <p className="text-xs font-medium">Keine Projekte ohne Deadline</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Alle Projekte sind bereits geplant</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-sm border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                                    <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                                    Personal & Mitarbeiter
                                </h3>
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />
                                    <input
                                        type="text"
                                        placeholder="Mitarbeiter suchen..."
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-sm text-xs focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/10" id="staff-list">
                                {filteredUsers.map((u: any) => {
                                    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                                    const initials = `${String(u.first_name || '').charAt(0)}${String(u.last_name || '').charAt(0)}`.toUpperCase();
                                    const roleDE = roleTranslations[u.role] || roleTranslations['user'];

                                    return (
                                        <div
                                            key={u.id}
                                            data-id={u.id}
                                            data-name={fullName}
                                            className="staff-drag-item p-3 bg-white border border-slate-200 rounded-sm flex items-center gap-3 hover:border-brand-primary hover:shadow-md transition-all group cursor-move active:cursor-grabbing active:opacity-50"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:ring-2 group-hover:ring-brand-primary/30 transition-all uppercase shrink-0">
                                                {initials}
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-xs font-bold text-slate-800 truncate group-hover:text-brand-primary transition-colors">
                                                    {fullName}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-500 truncate">
                                                    {roleDE}
                                                </span>
                                                {u.email && (
                                                    <span className="text-[9px] text-slate-400 truncate">
                                                        {u.email}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingAppointment({
                                                            type: 'vacation',
                                                            user_id: u.id,
                                                            title: `Urlaub: ${fullName}`
                                                        });
                                                        setSelectedDate(new Date());
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="w-7 h-7 flex items-center justify-center rounded-sm bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                    title="Urlaub"
                                                >
                                                    <FaUmbrellaBeach className="text-[10px]" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingAppointment({
                                                            type: 'interpreting',
                                                            user_id: u.id,
                                                            title: `Einsatz: ${fullName}`
                                                        });
                                                        setSelectedDate(new Date());
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="w-7 h-7 flex items-center justify-center rounded-sm bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                                    title="Dolmetscher"
                                                >
                                                    <FaMicrophone className="text-[10px]" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <div className="p-8 flex flex-col items-center justify-center text-center text-slate-400">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                            <FaSearch className="text-2xl text-slate-300" />
                                        </div>
                                        <p className="text-xs font-medium">Keine Mitarbeiter gefunden</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Versuchen Sie einen anderen Suchbegriff</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .fc {
                    --fc-border-color: #f1f5f9;
                    --fc-today-bg-color: #f8fafc;
                    --fc-button-bg-color: #ffffff;
                    --fc-button-border-color: #e2e8f0;
                    --fc-button-text-color: #64748b;
                }
                .fc .fc-toolbar-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #1e293b;
                }
                .fc .fc-button-primary {
                    background-color: var(--fc-button-bg-color);
                    border-color: var(--fc-button-border-color);
                    color: var(--fc-button-text-color);
                    font-size: 0.8rem;
                    font-weight: 500;
                    padding: 0.4rem 0.8rem;
                    text-transform: capitalize;
                }
                .fc .fc-button-primary:hover {
                    background-color: #f8fafc;
                    border-color: #cbd5e1;
                    color: #334155;
                }
                .fc .fc-event {
                    border-radius: 4px;
                    padding: 0;
                    font-size: 0.75rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    overflow: hidden;
                    min-height: 42px;
                }
                .fc-event-main {
                    padding: 4px 6px !important;
                }
                .fc-daygrid-event {
                    white-space: normal !important;
                }
                .fc-daygrid-event-dot {
                    display: none;
                }
                .fc-event-time {
                    font-weight: 700;
                    font-size: 10px;
                }
                .fc-event-title {
                    font-weight: 600;
                    line-height: 1.3;
                }
                .fc-daygrid-block-event .fc-event-time,
                .fc-daygrid-block-event .fc-event-title {
                    padding: 1px 0;
                }

                /* Custom Scrollbar - Grey and Thin */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                    height: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f8fafc;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                    transition: background 0.2s;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                .custom-scrollbar::-webkit-scrollbar-button {
                    display: none;
                }
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #f8fafc;
                }

                /* Type-based Event Coloring */
                .event-type-project {
                    background-color: #eff6ff !important;
                    border-left: 3px solid #3b82f6 !important;
                    color: #1e40af !important;
                }
                .event-type-appointment, .event-type-meeting {
                    background-color: #f0fdf4 !important;
                    border-left: 3px solid #22c55e !important;
                    color: #166534 !important;
                }
                .event-type-interpreting {
                    background-color: #f0f9ff !important;
                    border-left: 3px solid #0ea5e9 !important;
                    color: #075985 !important;
                }
                .event-type-staff {
                    background-color: #faf5ff !important;
                    border-left: 3px solid #a855f7 !important;
                    color: #6b21a8 !important;
                }
                .event-type-vacation {
                    background-color: #fff7ed !important;
                    border-left: 3px solid #f97316 !important;
                    color: #9a3412 !important;
                }
                .event-type-invoice {
                    background-color: #fef2f2 !important;
                    border-left: 3px solid #ef4444 !important;
                    color: #991b1b !important;
                }
                .fc-v-event {
                    border: none !important;
                }
                .fc-daygrid-event {
                    border: none !important;
                }
            `}</style>


            <NewAppointmentModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingAppointment(null); }}
                onSubmit={(data: any) => {
                    if (editingAppointment?.id) {
                        updateMutation.mutate({ ...data, id: editingAppointment.id });
                    } else {
                        createMutation.mutate(data);
                    }
                }}
                initialDate={selectedDate}
                initialData={editingAppointment}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
};

export default Calendar;
