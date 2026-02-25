import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService, projectService } from '../api/services';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import toast from 'react-hot-toast';
import NewAppointmentModal from '../components/modals/NewAppointmentModal';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const Calendar = () => {
    const calendarRef = useRef<FullCalendar>(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<any>(null);
    const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
    const [projectSearch, setProjectSearch] = useState('');
    const [draggingEvent, setDraggingEvent] = useState<any>(null);
    const [isSidebarOver, setIsSidebarOver] = useState(false);

    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['calendar', 'events', dateRange],
        queryFn: () => calendarService.getEvents(dateRange?.start, dateRange?.end),
        enabled: !!dateRange
    });

    const { data: allProjects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll()
    });

    const unassignedProjects = (allProjects || []).filter((p: any) => {
        const isNotFinished = !['completed', 'deleted', 'archived'].includes(p.status);
        // Only show projects without a deadline in the "Nicht zugeordnete" sidebar
        const hasNoDeadline = !p.deadline;
        const matchesSearch = (p.project_name || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
            (p.project_number || '').toLowerCase().includes(projectSearch.toLowerCase());
        return isNotFinished && hasNoDeadline && matchesSearch;
    });

    // Initialize Draggable for sidebar projects
    useEffect(() => {
        const draggableEl = document.getElementById('unassigned-projects-list');
        if (draggableEl && unassignedProjects.length > 0) {
            const draggable = new Draggable(draggableEl, {
                itemSelector: '.project-drag-item',
                eventData: (eventEl) => {
                    return {
                        title: '🏁 ' + (eventEl.getAttribute('data-title') || 'Projekt'),
                        id: 'project_' + eventEl.getAttribute('data-id'),
                        duration: '02:00', // Default duration for a project drop
                        create: false // Don't create an appointment, we'll handle project update instead
                    };
                }
            });
            return () => draggable.destroy();
        }
    }, [unassignedProjects]);

    const updateProjectMutation = useMutation({
        mutationFn: (data: { id: string; deadline: string }) => projectService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success('Deadline gesetzt');
        },
        onError: () => toast.error('Fehler beim Setzen der Deadline')
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
            setIsModalOpen(false);
            setEditingAppointment(null);
            toast.success('Termin aktualisiert');
        },
        onError: () => toast.error('Fehler beim Aktualisieren')
    });

    const handleDateSelect = (selectInfo: any) => {
        setSelectedDate(selectInfo.start);
        setEditingAppointment(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        const { type, project_id, appointment_id, id } = clickInfo.event.extendedProps;

        if (type === 'project' || project_id) {
            navigate(`/projects/${project_id || id.replace('project_', '')}`);
        } else if (type === 'invoice') {
            navigate('/invoices');
        } else if (type === 'appointment') {
            setEditingAppointment({
                id: appointment_id,
                title: clickInfo.event.title.replace(/📅 |🗣️ |👤 /, ''),
                ...clickInfo.event.extendedProps,
                start_date: clickInfo.event.start,
                end_date: clickInfo.event.end
            });
            setIsModalOpen(true);
        }
    };

    const renderEventContent = (eventInfo: any) => {
        const { extendedProps, title } = eventInfo.event;
        const customer = extendedProps.customer;
        const customerId = extendedProps.customer_id;
        const langPair = extendedProps.language_pair;
        const displayId = extendedProps.display_id;
        const time = extendedProps.deadline || (eventInfo.timeText);

        return (
            <div className="flex flex-col w-full h-full p-1 overflow-hidden transition-all group/event">
                <div className="flex items-start justify-between gap-1 mb-0.5">
                    <div className="flex flex-col min-w-0 flex-1">
                        {displayId && (
                            <span className="text-[8px] font-black text-white/70 uppercase tracking-widest leading-none mb-0.5">
                                {displayId}
                            </span>
                        )}
                        <span className="font-bold text-[10px] truncate leading-tight">
                            {title}
                        </span>
                    </div>
                    {time && (
                        <span className="text-[9px] font-medium opacity-80 whitespace-nowrap">
                            {time}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-0.5 mt-auto">
                    {customer && (
                        <div className="flex items-center gap-1 text-[9px] opacity-90 truncate font-semibold">
                            <span className="opacity-60 text-[8px] uppercase tracking-tighter shrink-0">
                                {customerId || 'KD'}:
                            </span>
                            <span className="truncate italic">{customer}</span>
                        </div>
                    )}
                    {langPair && (
                        <div className="flex items-center gap-1 text-[9px] opacity-90 truncate font-bold">
                            <span className="opacity-60 text-[8px] uppercase tracking-tighter shrink-0">LP:</span>
                            <div className="flex items-center gap-1 px-1 py-0 bg-white/20 rounded-[2px]">
                                {extendedProps.source_flag && (
                                    <img
                                        src={`/storage/flags/${extendedProps.source_flag}.svg`}
                                        className="w-3 h-2.5 object-cover rounded-[1px] shadow-sm"
                                        alt=""
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                )}
                                <span>{langPair}</span>
                                {extendedProps.target_flag && (
                                    <img
                                        src={`/storage/flags/${extendedProps.target_flag}.svg`}
                                        className="w-3 h-2.5 object-cover rounded-[1px] shadow-sm"
                                        alt=""
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                )}
                            </div>
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
                <div className="flex gap-2 shrink-0">
                    <div className="flex bg-slate-100 p-0.5 rounded-sm border border-slate-200">
                        <button
                            onClick={() => { setView('dayGridMonth'); calendarRef.current?.getApi().changeView('dayGridMonth'); }}
                            className={`px-3 py-1 text-xs font-medium rounded-sm transition ${view === 'dayGridMonth' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Monat
                        </button>
                        <button
                            onClick={() => { setView('timeGridWeek'); calendarRef.current?.getApi().changeView('timeGridWeek'); }}
                            className={`px-3 py-1 text-xs font-medium rounded-sm transition ${view === 'timeGridWeek' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Woche
                        </button>
                        <button
                            onClick={() => { setView('timeGridDay'); calendarRef.current?.getApi().changeView('timeGridDay'); }}
                            className={`px-3 py-1 text-xs font-medium rounded-sm transition ${view === 'timeGridDay' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tag
                        </button>
                    </div>
                    <Button
                        onClick={() => { setEditingAppointment(null); setSelectedDate(new Date()); setIsModalOpen(true); }}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-sm flex items-center justify-center gap-2 transition ml-2"
                    >
                        <FaPlus className="text-xs" /> <span className="hidden sm:inline">Neuer Termin</span>
                    </Button>
                </div>
            </div>

            {/* Main Content Area with Sidebar */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Calendar Side */}
                <div className="flex-1 bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col p-4 relative z-0">
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
                        events={events}
                        editable={true}
                        droppable={true}
                        drop={(info) => {
                            const projectId = info.draggedEl.getAttribute('data-id');
                            if (projectId) {
                                updateProjectMutation.mutate({
                                    id: projectId,
                                    deadline: info.dateStr
                                });
                            }
                        }}
                        eventDrop={(info) => {
                            const { type, project_id, appointment_id } = info.event.extendedProps;
                            const newStart = info.event.start?.toISOString();
                            const newEnd = info.event.end?.toISOString();

                            if (type === 'project' && project_id && newStart) {
                                updateProjectMutation.mutate({
                                    id: project_id.toString(),
                                    deadline: newStart
                                });
                            } else if (type === 'appointment' && appointment_id && newStart) {
                                updateMutation.mutate({
                                    id: appointment_id,
                                    start_date: newStart,
                                    end_date: newEnd
                                });
                            }
                        }}
                        eventResize={(info) => {
                            const { type, appointment_id } = info.event.extendedProps;
                            const newStart = info.event.start?.toISOString();
                            const newEnd = info.event.end?.toISOString();

                            if (type === 'appointment' && appointment_id && newStart) {
                                updateMutation.mutate({
                                    id: appointment_id,
                                    start_date: newStart,
                                    end_date: newEnd
                                });
                            }
                        }}
                        selectable={true}
                        select={handleDateSelect}
                        eventClick={handleEventClick}
                        eventContent={renderEventContent}
                        eventDragStart={(info) => {
                            setDraggingEvent(info.event);
                        }}
                        eventDragStop={() => {
                            // After drag stop, if it was dropped on sidebar (handled by onDrop on sidebar),
                            // we just clear the dragging state.
                            setDraggingEvent(null);
                        }}
                        datesSet={(arg) => {
                            if (dateRange?.start !== arg.startStr || dateRange?.end !== arg.endStr) {
                                setDateRange({
                                    start: arg.startStr,
                                    end: arg.endStr
                                });
                            }
                        }}
                        height="100%"
                        dayMaxEvents={4}
                        eventTimeFormat={{
                            hour: '2-digit',
                            minute: '2-digit',
                            meridiem: false,
                            hour12: false
                        }}
                        slotLabelFormat={{
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        }}
                    />
                </div>

                {/* Sidebar Side */}
                <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 h-full">
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
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
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-sm text-xs focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div
                            className={clsx(
                                "flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar transition-colors duration-200",
                                isSidebarOver ? "bg-brand-primary/10 ring-2 ring-inset ring-brand-primary/20" : "bg-slate-50/10"
                            )}
                            id="unassigned-projects-list"
                            onDragOver={(e) => {
                                // Only allow drop if dragging a project from calendar
                                if (draggingEvent?.extendedProps?.type === 'project') {
                                    e.preventDefault();
                                    setIsSidebarOver(true);
                                }
                            }}
                            onDragLeave={() => setIsSidebarOver(false)}
                            onDrop={(e) => {
                                if (draggingEvent?.extendedProps?.type === 'project') {
                                    e.preventDefault();
                                    setIsSidebarOver(false);
                                    const projectId = draggingEvent.extendedProps.project_id;
                                    if (projectId) {
                                        updateProjectMutation.mutate({
                                            id: projectId.toString(),
                                            deadline: null as any // Clearing deadline
                                        });
                                    }
                                }
                            }}
                        >
                            {unassignedProjects.length > 0 ? (
                                unassignedProjects.map((p: any) => (
                                    <div
                                        key={p.id}
                                        data-id={p.id}
                                        data-title={p.project_number || p.project_name}
                                        className="project-drag-item p-3 bg-white border border-slate-200 rounded-sm hover:border-brand-primary transition-all cursor-pointer group shadow-sm hover:shadow-md active:cursor-grabbing"
                                        onClick={() => {
                                            setEditingAppointment({
                                                title: p.project_name,
                                                project_id: p.id,
                                                customer_id: p.customer_id,
                                                partner_id: p.partner_id,
                                                type: 'meeting', // Default type
                                                description: `Termin für Projekt: ${p.project_number || p.id}`
                                            });
                                            setSelectedDate(p.deadline ? new Date(p.deadline) : new Date());
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {p.project_number || `ID ${p.id}`}
                                                </span>
                                                <span className={clsx(
                                                    "px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold uppercase border",
                                                    p.priority === 'high' ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                                )}>
                                                    {p.priority === 'high' ? 'Express' : 'Standard'}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-brand-primary transition-colors">
                                                {p.project_name}
                                            </h4>
                                            <div className="mt-2 flex items-center justify-between border-t border-slate-50 pt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-slate-400 font-medium">Kunde</span>
                                                    <span className="text-[10px] text-slate-600 font-semibold truncate max-w-[120px]">
                                                        {p.customer?.company_name || `${p.customer?.first_name} ${p.customer?.last_name}` || 'Unbekannt'}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] text-slate-400 font-medium">Deadline</span>
                                                    <div className="text-[10px] text-slate-700 font-bold whitespace-nowrap">
                                                        {p.deadline ? new Date(p.deadline).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 opacity-60">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                        <FaPlus className="text-lg opacity-40" />
                                    </div>
                                    <p className="text-xs font-medium">Keine passenden Projekte gefunden</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            <style>{`
                .fc {
                    --fc-border-color: #f1f5f9;
                    --fc-today-bg-color: #f8fafc;
                    --fc-button-bg-color: #ffffff;
                    --fc-button-border-color: #e2e8f0;
                    --fc-button-text-color: #64748b;
                    --fc-button-hover-bg-color: #f8fafc;
                    --fc-button-active-bg-color: #f1f5f9;
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
                .fc .fc-button-primary:not(:disabled).fc-button-active, 
                .fc .fc-button-primary:not(:disabled):active {
                    background-color: #f1f5f9;
                    border-color: #cbd5e1;
                    color: #0f172a;
                    box-shadow: none;
                }
                .fc .fc-col-header-cell-cushion {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 0.75rem 0;
                }
                .fc .fc-daygrid-day-number {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #64748b;
                    padding: 0.5rem;
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
                .fc .fc-v-event {
                    padding: 0;
                }
                .fc .fc-event-main {
                    padding: 0;
                    height: 100%;
                }
                .fc .fc-event:hover {
                    transform: scale(1.02);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    filter: brightness(1.05);
                    z-index: 50;
                }
                .fc-theme-standard td, .fc-theme-standard th {
                    border-color: #f1f5f9;
                }
                .fc-day-today {
                    background-color: #f8fafc !important;
                }
                
                /* Custom scrollbars for Day/Week view */
                .fc-scroller {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 transparent;
                }
                .fc-scroller::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .fc-scroller::-webkit-scrollbar-track {
                    background: transparent;
                }
                .fc-scroller::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                    border: 2px solid transparent;
                }
                .fc-scroller::-webkit-scrollbar-thumb:hover {
                    background-color: #94a3b8;
                }
                
                .fc-timegrid-slots td {
                    height: 3.5em !important;
                }
                .fc-timegrid-slot-label-cushion {
                    font-size: 0.7rem;
                    color: #94a3b8;
                }
            `}</style>

            <NewAppointmentModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingAppointment(null); }}
                onSubmit={(data: any) => {
                    if (editingAppointment) {
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
