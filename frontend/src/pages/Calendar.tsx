import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService } from '../api/services';
import {
    FaPlus, FaChevronLeft, FaChevronRight, FaUserAlt, FaClipboardList
} from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import toast from 'react-hot-toast';
import NewAppointmentModal from '../components/modals/NewAppointmentModal';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { Calendar as AntdCalendar } from 'antd';
import 'dayjs/locale/de';

const Calendar = () => {
    const { t, i18n } = useTranslation();
    const calendarRef = useRef<FullCalendar>(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [editingAppointment, setEditingAppointment] = useState<any>(null);
    const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
    const [currentMonth, setCurrentMonth] = useState(dayjs());

    // Filters
    const [selectedCalendars, setSelectedCalendars] = useState(['calendar', 'team', 'projects', 'interpreting']);

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['calendar', 'events', dateRange],
        queryFn: () => calendarService.getEvents(dateRange?.start, dateRange?.end),
        enabled: !!dateRange
    });

    const createMutation = useMutation({
        mutationFn: calendarService.createAppointment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
            setIsModalOpen(false);
            toast.success(t('calendar.messages.create_success'));
        },
        onError: () => toast.error(t('calendar.messages.create_error'))
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => calendarService.updateAppointment(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
            setIsModalOpen(false);
            setEditingAppointment(null);
            toast.success(t('calendar.messages.update_success'));
        },
        onError: () => toast.error(t('calendar.messages.update_error'))
    });

    const handleDateSelect = (selectInfo: any) => {
        setSelectedDate(selectInfo.start);
        setEditingAppointment(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        const { project_id, appointment_id, id } = clickInfo.event.extendedProps;
        const type = clickInfo.event.extendedProps.type || 'appointment';

        if (['appointment', 'interpreting', 'staff', 'vacation', 'meeting'].includes(type)) {
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
        }
    };

    const handleViewChange = (newView: any) => {
        setView(newView);
        calendarRef.current?.getApi().changeView(newView);
    };

    const handleNav = (action: 'prev' | 'next' | 'today') => {
        const api = calendarRef.current?.getApi();
        if (!api) return;
        if (action === 'prev') api.prev();
        else if (action === 'next') api.next();
        else api.today();
    };

    const renderEventContent = (eventInfo: any) => {
        const { extendedProps, title } = eventInfo.event;
        const type = extendedProps.type || 'appointment';
        const isMonthView = view === 'dayGridMonth';
        const isListView = view === 'listWeek';
        const timeText = eventInfo.timeText;

        const typeColor: Record<string, string> = {
            project: 'bg-blue-500',
            interpreting: 'bg-emerald-500',
            meeting: 'bg-amber-500',
            vacation: 'bg-rose-500',
            staff: 'bg-indigo-500',
            default: 'bg-slate-400'
        };
        const colorClass = typeColor[type] || typeColor.default;

        if (isMonthView) {
            return (
                <div className="flex items-center gap-1 w-full px-1 py-0.5 overflow-hidden">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colorClass}`} />
                    <span className="text-[10px] font-bold truncate text-slate-700">{title}</span>
                </div>
            );
        }

        if (isListView) {
            return (
                <div className="flex items-center gap-3 w-full py-1.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${colorClass}`} />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{title}</span>
                        {extendedProps.project_number && <span className="text-[10px] text-slate-400 font-bold">{extendedProps.project_number}</span>}
                    </div>
                    {extendedProps.customer && (
                        <span className="text-xs font-bold text-slate-500 ml-auto flex items-center gap-1">
                            <FaUserAlt className="text-[9px] opacity-40" />
                            {extendedProps.customer}
                        </span>
                    )}
                </div>
            );
        }

        return (
            <div className="flex flex-col w-full h-full p-2 overflow-hidden group">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                        {type === 'meeting' ? 'Meeting' : type === 'project' ? 'Projekt' : type === 'interpreting' ? 'Dolmetschen' : 'Termin'}
                    </span>
                </div>
                <div className="text-[11px] font-bold leading-tight text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-2">
                    {title}
                </div>
                <div className="mt-1 flex flex-col gap-1">
                    {timeText && <div className="text-[10px] font-bold text-slate-400">{timeText}</div>}
                    {(extendedProps.customer || extendedProps.project_number) && (
                        <div className="pt-1 mt-1 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            {extendedProps.customer && (
                                <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                                    <FaUserAlt className="text-[8px]" /> {extendedProps.customer}
                                </div>
                            )}
                            {extendedProps.project_number && (
                                <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                                    <FaClipboardList className="text-[8px]" /> {extendedProps.project_number}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-white overflow-hidden shadow-sm border border-slate-200">
            {/* Top Toolbar - Action Bar */}
            <header className="h-14 flex items-center border-b border-slate-200 px-6 bg-white gap-6 z-10 shrink-0">
                <div className="flex items-center gap-2 mr-4">
                    <Button
                        onClick={() => { setEditingAppointment(null); setSelectedDate(new Date()); setIsModalOpen(true); }}
                        className="h-9 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold flex items-center gap-2 shadow-sm rounded-sm"
                    >
                        <FaPlus className="text-[10px]" />
                        <span className="text-[13px]">Termin</span>
                    </Button>
                    <Button
                        onClick={() => { setEditingAppointment({ type: 'interpreting' }); setSelectedDate(new Date()); setIsModalOpen(true); }}
                        className="h-9 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold flex items-center gap-2 shadow-sm rounded-sm"
                    >
                        <FaPlus className="text-[10px]" />
                        <span className="text-[13px]">Dolmetscher-Einsatz</span>
                    </Button>
                </div>

                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />

                <div className="flex-1 flex justify-center items-center">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        {calendarRef.current?.getApi().view.title}
                    </h2>
                </div>
            </header>

            {/* Main Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <aside className="w-[300px] border-r border-slate-200 flex flex-col bg-slate-50/20 overflow-y-auto shrink-0 p-6 gap-8 custom-scrollbar">
                    {/* Small Mini Calendar */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-sm font-bold text-slate-900">{currentMonth.format('MMMM YYYY')}</span>
                            <div className="flex gap-1">
                                <button className="p-1.5 hover:bg-slate-200 rounded-sm transition-colors" onClick={() => {
                                    const newMonth = currentMonth.subtract(1, 'month');
                                    setCurrentMonth(newMonth);
                                    calendarRef.current?.getApi().gotoDate(newMonth.toDate());
                                }}><FaChevronLeft className="text-[10px]" /></button>
                                <button className="p-1.5 hover:bg-slate-200 rounded-sm transition-colors" onClick={() => {
                                    const newMonth = currentMonth.add(1, 'month');
                                    setCurrentMonth(newMonth);
                                    calendarRef.current?.getApi().gotoDate(newMonth.toDate());
                                }}><FaChevronRight className="text-[10px]" /></button>
                            </div>
                        </div>
                        <div className="calendar-mini-container">
                            <AntdCalendar
                                fullscreen={false}
                                value={dayjs(selectedDate)}
                                onSelect={(date) => {
                                    const d = dayjs(date);
                                    setSelectedDate(d.toDate());
                                    setCurrentMonth(d);
                                    calendarRef.current?.getApi().gotoDate(d.toDate());
                                }}
                                headerRender={() => null}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-200 mx-1" />

                    {/* Filter Section */}
                    <div className="space-y-4 px-1">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter</h3>
                        <div className="flex flex-col gap-3">
                            {[
                                { id: 'calendar', label: 'Hauptkalender', color: 'bg-brand-primary' },
                                { id: 'team', label: 'Team & Personal', color: 'bg-purple-500' },
                                { id: 'projects', label: 'Projekt-Deadlines', color: 'bg-blue-500' },
                                { id: 'interpreting', label: 'Dolmetscher-Einsätze', color: 'bg-emerald-500' },
                            ].map(item => {
                                const isActive = selectedCalendars.includes(item.id);
                                return (
                                    <label key={item.id} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-200/40 p-2 -mx-2 rounded-sm transition-colors">
                                        <Checkbox
                                            checked={isActive}
                                            onCheckedChange={() => {
                                                setSelectedCalendars(prev =>
                                                    prev.includes(item.id) ? prev.filter(c => c !== item.id) : [...prev, item.id]
                                                );
                                            }}
                                        />
                                        <span className={clsx("text-sm font-bold flex-1 transition-colors", isActive ? "text-slate-900" : "text-slate-500")}>
                                            {item.label}
                                        </span>
                                        <span className={clsx("w-2 h-2 rounded-full", item.color)}></span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* Calendar Content */}
                <main className="flex-1 overflow-hidden relative group bg-white flex flex-col">
                    {/* Inner Toolbar (Left Aligned with Content) */}
                    <div className="h-12 border-b border-slate-100 px-3 flex items-center justify-between bg-white sticky top-0 z-10 transition-shadow">
                        {/* Navigation arrows switch */}
                        <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="sm" className="h-8 px-4 text-slate-700 font-bold hover:bg-slate-100 text-xs rounded-sm border border-slate-200" onClick={() => handleNav('today')}>Heute</Button>
                            <div className="flex items-center ml-2 border border-slate-200 rounded-sm divide-x divide-slate-200 overflow-hidden bg-slate-50">
                                <Button variant="ghost" size="icon" className="h-8 w-9 text-slate-600 hover:bg-white transition-colors" onClick={() => handleNav('prev')}><FaChevronLeft className="text-[10px]" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-9 text-slate-600 hover:bg-white transition-colors" onClick={() => handleNav('next')}><FaChevronRight className="text-[10px]" /></Button>
                            </div>
                        </div>

                        {/* View Switch / Tabs */}
                        <div className="flex items-center gap-px bg-slate-100 p-1 rounded-sm border border-slate-200">
                            {[
                                { id: 'timeGridDay', label: 'Tag' },
                                { id: 'timeGridWeek', label: 'Woche' },
                                { id: 'dayGridMonth', label: 'Monat' },
                                { id: 'listWeek', label: 'Liste' }
                            ].map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => handleViewChange(v.id)}
                                    className={clsx(
                                        "px-4 py-1.5 text-xs font-bold transition-all rounded-[3px] border",
                                        view === v.id
                                            ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-slate-200"
                                            : "text-slate-500 hover:text-slate-700 border-transparent hover:bg-slate-200/40"
                                    )}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center transition-all duration-300">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-brand-primary"></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lade Termine...</span>
                                </div>
                            </div>
                        )}
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                            initialView={view}
                            locales={[deLocale]}
                            locale={i18n.language}
                            headerToolbar={false} // Custom header used above
                            events={events.map((ev: any) => ({
                                ...ev,
                                className: `event-type-${ev.extendedProps?.type || 'appointment'}`
                            })).filter((ev: any) => selectedCalendars.includes(ev.extendedProps?.calendar_id || 'calendar') || selectedCalendars.includes(ev.extendedProps?.type))}
                            editable={true}
                            selectable={true}
                            select={handleDateSelect}
                            eventClick={handleEventClick}
                            eventContent={renderEventContent}
                            dateClick={(info) => {
                                setSelectedDate(info.date);
                                // setCurrentMonth(dayjs(info.date)) is handled by datesSet below
                            }}
                            datesSet={(arg) => {
                                if (dateRange?.start !== arg.startStr || dateRange?.end !== arg.endStr) {
                                    setDateRange({ start: arg.startStr, end: arg.endStr });
                                }
                                // Sync mini calendar month only
                                const newMonth = dayjs(arg.view.currentStart);
                                if (!newMonth.isSame(currentMonth, 'month')) {
                                    setCurrentMonth(newMonth);
                                }
                                // Removed setSelectedDate here to allow persistent selections
                            }}
                            height="100%"
                            dayMaxEvents={5}
                            nowIndicator={true}
                            slotMinTime="00:00:00"
                            slotMaxTime="24:00:00"
                            scrollTime="08:00:00"
                            allDaySlot={true}
                            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                        />
                    </div>
                </main>
            </div>

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

            <style>{`
                .fc {
                    --fc-border-color: #f1f5f9;
                    --fc-today-bg-color: #f8fafc;
                    --fc-page-bg-color: #ffffff;
                    --fc-neutral-bg-color: #f8fafc;
                    --fc-list-event-hover-bg-color: #f1f5f9;
                    font-family: inherit;
                }
                .fc-theme-standard td, .fc-theme-standard th {
                    border-color: #f1f5f9;
                }
                .fc-col-header-cell {
                    background-color: #ffffff;
                    padding: 12px 0 !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                }
                .fc-col-header-cell-cushion {
                    font-size: 11px;
                    font-weight: 800;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .fc-timegrid-slot {
                    height: 50px !important;
                    border-bottom-style: dotted !important;
                }
                .fc-timegrid-slot-label-cushion {
                    font-size: 11px;
                    font-weight: 700;
                    color: #94a3b8;
                }
                .fc-day-today {
                    background-color: #1B4D4F/5 !important;
                }
                .fc-timegrid-now-indicator-line {
                    border-color: #ef4444 !important;
                    border-width: 3px !important;
                    z-index: 100 !important;
                }
                .fc-timegrid-now-indicator-arrow {
                    border-color: #ef4444 !important;
                    border-width: 6px !important;
                    margin-left: -6px !important;
                }
                /* Make indicator more prominent */
                .fc-timegrid-now-indicator-line::before {
                    content: '';
                    position: absolute;
                    left: -10px;
                    right: -10px;
                    height: 1px;
                    background: #ef4444;
                    opacity: 0.3;
                    z-index: -1;
                }
                .fc-scrollgrid {
                   border: none !important;
                }
                .fc .fc-event {
                    border-radius: 4px;
                    border: none;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s;
                    background-color: white !important;
                }
                .fc .fc-event:hover {
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    transform: translateY(-1px);
                    z-index: 50 !important;
                }

                .event-type-project { border-left: 4px solid #3b82f6 !important; }
                .event-type-appointment { border-left: 4px solid #10b981 !important; }
                .event-type-meeting { border-left: 4px solid #f59e0b !important; }
                .event-type-interpreting { border-left: 4px solid #06b6d4 !important; }
                .event-type-staff { border-left: 4px solid #6366f1 !important; }
                .event-type-vacation { border-left: 4px solid #ef4444 !important; }

                /* Ant Design Calendar Tweaks */
                .calendar-mini-container .ant-picker-calendar {
                    background: transparent;
                }
                .calendar-mini-container .ant-picker-calendar-header {
                    display: none;
                }
                .calendar-mini-container .ant-picker-cell {
                    padding: 2px 0;
                }
                .calendar-mini-container .ant-picker-calendar-date {
                    border-top: none !important;
                    margin: 0 !important;
                    height: 34px !important;
                }
                .calendar-mini-container .ant-picker-calendar-date-content {
                    display: none;
                }
                .calendar-mini-container .ant-picker-cell-inner {
                    width: 32px !important;
                    height: 32px !important;
                    line-height: 32px !important;
                    font-size: 12px;
                    font-weight: 700;
                    border-radius: 4px !important;
                }
                .calendar-mini-container .ant-picker-cell-selected .ant-picker-cell-inner {
                    background: #1B4D4F !important;
                    color: white !important;
                }
                .calendar-mini-container .ant-picker-cell-today .ant-picker-cell-inner::before {
                    border-color: #1B4D4F !important;
                    border-radius: 4px !important;
                }

                /* List View Styling */
                .fc-list-day-cushion {
                    background-color: #f8fafc !important;
                }
                .fc-list-event {
                    cursor: pointer !important;
                }
                .fc-list-event:hover td {
                    background-color: #f1f5f9 !important;
                }

                /* Custom scrollbar */
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
};

export default Calendar;
