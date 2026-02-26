import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt } from 'react-icons/fa';
import SearchableSelect from '../common/SearchableSelect';
import Input from '../common/Input';
import { Button } from '../ui/button';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

interface NewAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialDate?: Date | null;
    initialData?: any;
    isLoading?: boolean;
}

const typeOptions = [
    { value: 'meeting', label: 'Besprechung / Meeting' },
    { value: 'interpreting', label: 'Dolmetschereinsatz' },
    { value: 'staff', label: 'Personalplanung' },
    { value: 'vacation', label: 'Urlaub / Abwesenheit' },
    { value: 'personal', label: 'Privat / Persönlich' },
    { value: 'other', label: 'Sonstiges' }
];

interface Project {
    id: number;
    project_number: string;
    project_name: string;
    customer_id?: number;
    partner_id?: number;
    customer?: { company_name?: string; first_name?: string; last_name?: string };
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ isOpen, onClose, onSubmit, initialDate, initialData, isLoading }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [type, setType] = useState('meeting');
    const [location, setLocation] = useState('');
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [partnerId, setPartnerId] = useState<number | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [projectId, setProjectId] = useState<number | null>(null);

    const [projects, setProjects] = useState<Project[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [pData, cData, parData, uData] = await Promise.all([
                    import('../../api/services').then(m => m.projectService.getAll()),
                    import('../../api/services').then(m => m.customerService.getAll()),
                    import('../../api/services').then(m => m.partnerService.getAll()),
                    import('../../api/services').then(m => m.userService.getAll()),
                ]);
                setProjects(pData as Project[]);
                setCustomers(cData);
                setPartners(parData);
                setUsers(uData);
            } catch (e) { console.error(e); }
        };
        if (isOpen) loadData();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setDescription(initialData.description || '');
                setStartDate(initialData.start_date ? new Date(initialData.start_date) : null);
                setEndDate(initialData.end_date ? new Date(initialData.end_date) : null);
                setType(initialData.type || 'meeting');
                setLocation(initialData.location || '');
                setCustomerId(initialData.customer_id || null);
                setPartnerId(initialData.partner_id || null);
                setUserId(initialData.user_id || null);
                setProjectId(initialData.project_id || null);
            } else {
                setTitle('');
                setDescription('');
                const date = initialDate ? new Date(initialDate) : new Date();
                // We keep the hours/minutes from initialDate instead of resetting to 9:00
                setStartDate(date);
                const end = new Date(date);
                if (!initialDate) {
                    date.setHours(9, 0, 0, 0);
                    end.setHours(10, 0, 0, 0);
                } else {
                    // Default duration 1 hour if not specified
                    end.setHours(end.getHours() + 1);
                }
                setEndDate(end);
                setType('meeting');
                setLocation('');
                setCustomerId(null);
                setPartnerId(null);
                setUserId(null);
                setProjectId(null);
            }
        }
    }, [isOpen, initialData, initialDate]);

    const handleProjectChange = (id: string | string[]) => {
        const val = id ? Number(id) : null;
        setProjectId(val);
        if (val) {
            const p = projects.find(proj => proj.id === val);
            if (p) {
                if (!title) setTitle(p.project_name);
                if (p.customer_id) setCustomerId(p.customer_id);
                if (p.partner_id) setPartnerId(p.partner_id);
            }
        }
    };

    const handleSubmit = () => {
        if (!title || !startDate) return;
        const selectedProject = projectId ? projects.find(p => p.id === projectId) : null;
        onSubmit({
            title,
            description,
            start_date: startDate.toISOString(),
            end_date: endDate?.toISOString(),
            type,
            location,
            customer_id: customerId,
            partner_id: partnerId,
            user_id: userId,
            project_id: projectId,
            project: selectedProject
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-sm shadow-xl w-full max-w-lg overflow-hidden relative animate-fadeInUp">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-[110] flex items-center justify-center transition-all duration-300">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-slate-100 rounded-full"></div>
                                <div className="w-12 h-12 border-4 border border-slate-900 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-sm font-bold text-slate-800 tracking-tight">Lade Daten...</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Bitte warten</p>
                            </div>
                        </div>
                    </div>
                )}
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <FaCalendarAlt className="text-slate-900" />
                        {initialData ? 'Termin bearbeiten' : 'Neuer Termin'}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 sm:col-span-8">
                            <Input
                                label="Titel *"
                                placeholder="Z.B. Meeting mit Kunde"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="col-span-12 sm:col-span-4">
                            <SearchableSelect
                                label="Typ"
                                value={type}
                                onChange={(val) => setType(String(val))}
                                options={typeOptions}
                                preserveOrder
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 sm:col-span-6">
                            <SearchableSelect
                                label="Projekt (optional)"
                                value={projectId ? String(projectId) : ''}
                                onChange={handleProjectChange}
                                options={projects.map(p => ({
                                    value: String(p.id),
                                    label: `${p.project_number || p.id} - ${p.project_name}`
                                }))}
                            />
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                            <Input
                                label="Ort / Raum"
                                placeholder="Z.B. Büro 1 oder Teams"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Beginn *</label>
                            <DatePicker
                                showTime
                                format="DD.MM.YYYY HH:mm"
                                value={startDate ? dayjs(startDate) : null}
                                onChange={(date) => setStartDate(date ? date.toDate() : null)}
                                className="h-9 w-full shadow-sm"
                                placeholder="Beginn wählen"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ende</label>
                            <DatePicker
                                showTime
                                format="DD.MM.YYYY HH:mm"
                                value={endDate ? dayjs(endDate) : null}
                                onChange={(date) => setEndDate(date ? date.toDate() : null)}
                                className="h-9 w-full shadow-sm"
                                placeholder="Ende wählen"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SearchableSelect
                            label="Kunde"
                            value={customerId ? String(customerId) : ''}
                            onChange={(id) => setCustomerId(id ? Number(id) : null)}
                            options={customers.map(c => ({
                                value: String(c.id),
                                label: c.company_name || `${c.first_name} ${c.last_name}`
                            }))}
                        />
                        {['staff', 'vacation'].includes(type) ? (
                            <SearchableSelect
                                label="Mitarbeiter"
                                value={userId ? String(userId) : ''}
                                onChange={(id) => setUserId(id ? Number(id) : null)}
                                options={users.map(u => ({
                                    value: String(u.id),
                                    label: `${u.first_name} ${u.last_name}`
                                }))}
                            />
                        ) : (
                            <SearchableSelect
                                label="Partner / Dolmetscher"
                                value={partnerId ? String(partnerId) : ''}
                                onChange={(id) => setPartnerId(id ? Number(id) : null)}
                                options={partners.map(p => ({
                                    value: String(p.id),
                                    label: p.company_name || `${p.first_name} ${p.last_name}`
                                }))}
                            />
                        )}
                    </div>

                    <Input
                        isTextArea
                        label="Beschreibung"
                        placeholder="Zusätzliche Details..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        {...({ rows: 3 } as any)}
                    />
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition flex-1 sm:flex-none justify-center"
                    >
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !title || !startDate}
                        className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition flex-1 sm:flex-none justify-center"
                    >
                        {isLoading ? 'Speichere...' : initialData ? 'Aktualisieren' : 'Erstellen'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NewAppointmentModal;
