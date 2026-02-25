import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt } from 'react-icons/fa';
import SearchableSelect from '../common/SearchableSelect';
import Input from '../common/Input';
import { Button } from '../ui/button';
import DatePicker, { registerLocale } from "react-datepicker";
import { de } from 'date-fns/locale/de';
import "react-datepicker/dist/react-datepicker.css";

registerLocale('de', de);

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
    { value: 'personal', label: 'Privat / Persönlich' },
    { value: 'other', label: 'Sonstiges' }
];

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ isOpen, onClose, onSubmit, initialDate, initialData, isLoading }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [type, setType] = useState('meeting');
    const [location, setLocation] = useState('');
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [partnerId, setPartnerId] = useState<number | null>(null);
    const [projectId, setProjectId] = useState<number | null>(null);

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
                setProjectId(initialData.project_id || null);

            } else {
                setTitle('');
                setDescription('');
                const date = initialDate ? new Date(initialDate) : new Date();
                date.setHours(9, 0, 0, 0);
                setStartDate(date);
                const end = new Date(date);
                end.setHours(10, 0, 0, 0);
                setEndDate(end);
                setType('meeting');
                setLocation('');
                setCustomerId(null);
                setPartnerId(null);
                setProjectId(null);

            }
        }
    }, [isOpen, initialData, initialDate]);

    const handleSubmit = () => {
        if (!title || !startDate) return;
        onSubmit({
            title,
            description,
            start_date: startDate.toISOString(),
            end_date: endDate?.toISOString(),
            type,
            location,
            customer_id: customerId,
            partner_id: partnerId,
            project_id: projectId
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
                    <Input
                        label="Titel *"
                        placeholder="Z.B. Meeting mit Kunde"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        autoFocus
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Beginn *</label>
                            <DatePicker
                                selected={startDate}
                                onChange={(date: Date | null) => setStartDate(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd.MM.yyyy HH:mm"
                                locale="de"
                                className="h-9 w-full px-3 py-2 border border-slate-200 rounded-sm text-sm focus:ring-2 focus:ring-slate-900/5 outline-none bg-white transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ende</label>
                            <DatePicker
                                selected={endDate}
                                onChange={(date: Date | null) => setEndDate(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd.MM.yyyy HH:mm"
                                locale="de"
                                className="h-9 w-full px-3 py-2 border border-slate-200 rounded-sm text-sm focus:ring-2 focus:ring-slate-900/5 outline-none bg-white transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SearchableSelect
                            label="Typ"
                            value={type}
                            onChange={setType}
                            options={typeOptions}
                            preserveOrder
                        />
                        <Input
                            label="Ort / Raum"
                            placeholder="Z.B. Büro 1 oder Teams"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                        />
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
