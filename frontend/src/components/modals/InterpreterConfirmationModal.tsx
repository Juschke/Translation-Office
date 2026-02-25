import React, { useState, useEffect, useMemo } from 'react';
import { openBlobInNewTab } from '../../utils/download';
import { FaFilePdf, FaCalendarAlt, FaMapMarkerAlt, FaUserEdit, FaInfoCircle, FaTimes } from 'react-icons/fa';
import SearchableSelect from '../common/SearchableSelect';
import DatePicker, { registerLocale } from "react-datepicker";
import { de } from 'date-fns/locale/de';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnerService, projectService, settingsService } from '../../api/services';
import toast from 'react-hot-toast';
import "react-datepicker/dist/react-datepicker.css";
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import AddressForm from '../common/AddressForm';
import { Button } from '../ui/button';

registerLocale('de', de);

interface InterpreterConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
}

const InterpreterConfirmationModal: React.FC<InterpreterConfirmationModalProps> = ({ isOpen, onClose, project }) => {
    const queryClient = useQueryClient();
    const [interpreterId, setInterpreterId] = useState<string>('');
    const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
    const [location, setLocation] = useState<string>('');
    const [customerReference, setCustomerReference] = useState<string>('');
    const [customerDate, setCustomerDate] = useState<Date | null>(null);
    const [projectNumber, setProjectNumber] = useState<string>('');
    const [addressStreet, setAddressStreet] = useState<string>('');
    const [addressHouseNo, setAddressHouseNo] = useState<string>('');
    const [addressZip, setAddressZip] = useState<string>('');
    const [addressCity, setAddressCity] = useState<string>('');
    const [addressCountry, setAddressCountry] = useState<string>('');

    const { data: partnersData = [] } = useQuery({
        queryKey: ['partners'],
        queryFn: partnerService.getAll,
        enabled: isOpen
    });

    const { data: company } = useQuery({
        queryKey: ['companySettings'],
        queryFn: settingsService.getCompany,
        enabled: isOpen
    });

    useEffect(() => {
        if (isOpen && project) {
            setInterpreterId(project.translator?.id || project.partner_id?.toString() || '');
            setAppointmentDate(project.due ? new Date(project.due) : null);
            setLocation(project.appointment_location || '');
            setCustomerReference(project.customer_reference || '');
            setCustomerDate(project.customer_date ? new Date(project.customer_date) : null);

            let pNum = String(project.project_number || project.id || '');
            if (pNum && !pNum.startsWith('P-')) {
                pNum = `P-${pNum}`;
            }
            setProjectNumber(pNum);

            setAddressStreet(project.address_street || '');
            setAddressHouseNo(project.address_house_no || '');
            setAddressZip(project.address_zip || '');
            setAddressCity(project.address_city || '');
            setAddressCountry(project.address_country || 'Deutschland');
        }
    }, [isOpen, project]);

    const updateProjectMutation = useMutation({
        mutationFn: (data: any) => projectService.update(project.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', project.id] });
        }
    });

    const handleDownload = async () => {
        try {
            await updateProjectMutation.mutateAsync({
                partner_id: interpreterId ? parseInt(interpreterId) : null,
                deadline: appointmentDate ? appointmentDate.toISOString() : null,
                appointment_location: location,
                customer_reference: customerReference,
                customer_date: customerDate ? customerDate.toISOString().split('T')[0] : null,
                project_number: projectNumber,
                address_street: addressStreet,
                address_house_no: addressHouseNo,
                address_zip: addressZip,
                address_city: addressCity,
                address_country: addressCountry
            });

            const toastId = toast.loading('Dokument wird erstellt...');
            const response = await projectService.downloadConfirmation(project.id, 'interpreter_confirmation');
            const blob = new Blob([response.data], { type: 'application/pdf' });
            openBlobInNewTab(blob);
            toast.dismiss(toastId);
            toast.success('Dolmetscherbestätigung wurde erstellt');
            onClose();
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Fehler beim Erstellen des Dokuments');
        }
    };

    const partnerOptions = (Array.isArray(partnersData) ? partnersData : []).map((p: any) => ({
        value: p.id.toString(),
        label: p.company_name || `${p.first_name} ${p.last_name}`
    }));

    // Find selected partner for preview
    const selectedPartner = useMemo(() => {
        if (!interpreterId || !partnersData) return null;
        return (Array.isArray(partnersData) ? partnersData : []).find((p: any) => p.id.toString() === interpreterId);
    }, [interpreterId, partnersData]);

    // Company data for preview
    const co = company || {} as any;
    const companyName = co.company_name || co.name || 'Firma';
    const companyStreet = co.address_street ? `${co.address_street} ${co.address_house_no || ''}`.trim() : '';
    const companyZip = co.address_zip || '';
    const companyCity = co.address_city || '';
    const companyEmail = co.email || co.company_email || '';
    const companyPhone = co.phone || '';

    // Customer data for preview
    const cust = project?.customer;
    const customerName = cust ? (cust.company_name || `${cust.first_name || ''} ${cust.last_name || ''}`.trim()) : '–';
    const custStreet = cust?.address_street ? `${cust.address_street} ${cust.address_house_no || ''}`.trim() : '';
    const custCity = [cust?.address_zip, cust?.address_city].filter(Boolean).join(' ') || '';

    // Interpreter salutation for preview
    const interpreterName = selectedPartner ? `${selectedPartner.first_name || ''} ${selectedPartner.last_name || ''}`.trim() : '__________';
    const partnerSalutation = useMemo(() => {
        if (!selectedPartner) return 'Unser/e Dolmetscher/in';
        const sal = selectedPartner.salutation;
        if (sal === 'Herr' || sal === 'herr' || sal === 'mr') return 'Unser Dolmetscher, Herr';
        if (sal === 'Frau' || sal === 'frau' || sal === 'mrs' || sal === 'ms') return 'Unsere Dolmetscherin, Frau';
        return 'Unser/e Dolmetscher/in';
    }, [selectedPartner]);

    // Language for preview
    const lang = project?.source_language?.name_internal || project?.source_language?.name ||
        project?.target_language?.name_internal || project?.target_language?.name || '__________';

    // Format helpers
    const fmtDate = (d: Date | null) => {
        if (!d) return '__________';
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    const fmtTime = (d: Date | null) => {
        if (!d) return '__________';
        return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
    };
    const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative z-10 w-full h-full md:h-[92vh] md:max-w-[1400px] bg-white md:rounded-sm shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center"><FaFilePdf /></div>
                        <div>
                            <h2 className="text-[14px] font-semibold text-slate-800 tracking-wider">Dolmetscherbestätigung</h2>
                            <p className="text-xs text-slate-400 font-medium">{project?.project_number} • {project?.project_name || project?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><FaTimes /></button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

                    {/* ── Left: PDF Preview ── */}
                    <div className="flex-1 bg-slate-100 overflow-auto custom-scrollbar flex justify-start md:justify-center py-5 md:py-10 px-4 md:px-6 min-w-0">
                        <div className="bg-white shadow-sm w-[210mm] min-w-[210mm] md:min-w-0 min-h-[297mm] h-fit relative text-black shrink-0 overflow-hidden flex flex-col" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '10pt', padding: 0 }}>

                            {/* Header */}
                            <div className="text-center pt-[5mm] pb-[1mm]">
                                <div className="text-[28pt] font-bold tracking-[10pt]" style={{ letterSpacing: '10pt' }}>
                                    {companyName.replace(/[^A-Z]/gi, '').substring(0, 5).toUpperCase() || 'ITC'}
                                </div>
                                <div className="text-[16pt] uppercase tracking-wide">{companyName}</div>
                                <div className="text-[12pt] uppercase">DOLMETSCHER- & ÜBERSETZUNGSBÜRO</div>
                                <div className="text-[10pt] uppercase">FÜR ALLE WELTSPRACHEN</div>
                            </div>

                            {/* Languages bar */}
                            <div className="mx-[15mm] text-[5.5pt] text-slate-500 text-justify leading-tight my-[2mm]" style={{ wordSpacing: '0.5pt' }}>
                                afrikaans albanisch amharisch arabisch aramäisch aserbaidschanisch bengali birmanisch bulgarisch chinesisch dänisch dari englisch estnisch finnisch französisch griechisch hebräisch hindi indonesisch italienisch japanisch koreanisch kurdisch litauisch norwegisch persisch polnisch portugiesisch rumänisch russisch schwedisch serbokroatisch slowakisch spanisch suaheli thai tschechisch türkisch ukrainisch ungarisch urdu vietnamesisch
                            </div>

                            {/* Two columns: recipient + contact */}
                            <div className="px-[15mm] mt-[5mm]" style={{ display: 'flex' }}>
                                <div style={{ width: '55%' }}>
                                    <div className="text-[7.5pt] underline mb-[3mm]">
                                        {companyName} • {companyStreet} • D-{companyZip} {companyCity}
                                    </div>
                                    <div className="text-[11pt] leading-snug">
                                        <strong>{customerName}</strong><br />
                                        {cust?.department && <>{cust.department}<br /></>}
                                        {custStreet && <>{custStreet}<br /></>}
                                        {custCity}
                                    </div>
                                </div>
                                <div style={{ width: '45%' }} className="text-[9.5pt] leading-snug pl-[5mm]">
                                    <span className="text-[14pt] italic block mb-[1mm]" style={{ fontFamily: 'cursive' }}>{project?.creator?.name || ''}</span>
                                    <span className="italic text-[10pt] block mb-[2mm]">Kundenservice</span>
                                    {companyStreet}<br />
                                    D-{companyZip} {companyCity}<br />
                                    {companyPhone && <>☏ {companyPhone}<br /></>}
                                    {companyEmail && <>{companyEmail}<br /></>}
                                </div>
                            </div>

                            {/* Reference line */}
                            <div className="px-[15mm] mt-[8mm]">
                                <table className="w-full text-[8.5pt]" style={{ borderCollapse: 'collapse' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ width: '20%' }}>Ihr Zeichen</td>
                                            <td style={{ width: '25%' }}>Ihr Schreiben vom</td>
                                            <td style={{ width: '20%' }}>Unser Zeichen</td>
                                            <td className="text-right">{companyCity}, den {today}</td>
                                        </tr>
                                        <tr className="text-[10pt] font-bold italic">
                                            <td>{customerReference || '---'}</td>
                                            <td>{customerDate ? fmtDate(customerDate) : '---'}</td>
                                            <td>{projectNumber}</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Salutation */}
                            <div className="px-[15mm] mt-[8mm] text-[11pt]">
                                Sehr geehrte Damen und Herren,
                            </div>

                            {/* Confirmation box */}
                            <div className="mx-[15mm] mt-[5mm] border border-black p-[5mm] text-[11pt] leading-relaxed">
                                hiermit bestätigen wir den Dolmetschereinsatz für die Sprache <strong className="font-900">{lang} </strong>
                                am <strong>{fmtDate(appointmentDate)}</strong> um <strong>{fmtTime(appointmentDate)}</strong>
                                {location ? (
                                    <> im <strong>{location}</strong>
                                        {(addressStreet || addressZip) && <>, {addressStreet} {addressHouseNo}, {addressZip} {addressCity}{addressCountry && addressCountry !== 'Deutschland' ? `, ${addressCountry}` : ''}</>}
                                        .
                                    </>
                                ) : (
                                    <> am vereinbarten Einsatzort.</>
                                )}
                                <br />
                                {partnerSalutation} <strong>{interpreterName.toUpperCase()}</strong>, wird den Termin
                                wahrnehmen und zum vereinbarten Zeitpunkt am Einsatzort erscheinen.
                            </div>

                            {/* Disclaimer */}
                            <div className="px-[15mm] mt-[6mm] text-[10.5pt] leading-snug">
                                Die Verantwortung für die Richtigkeit des Dolmetschens trägt das vereidigte<br />
                                Dolmetscher- & Übersetzungsbüro {companyName}.
                            </div>

                            {/* Footer signature area */}
                            <div className="px-[15mm] mt-[6mm]" style={{ display: 'flex', gap: '4mm' }}>
                                <div style={{ width: '25%' }}>
                                    <span className="text-[10pt]">Hochachtungsvoll</span><br /><br />
                                    <span className="text-[11pt] font-bold" style={{ letterSpacing: '2pt' }}>
                                        {companyName.replace(/[^A-Z]/gi, '').toUpperCase() || ''}
                                    </span>
                                </div>
                                <div style={{ width: '40%' }}>
                                    <div className="border border-blue-400 text-blue-400 text-[8pt] italic text-center p-[2mm] leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>
                                        <div className="font-bold text-[9pt] mb-[1mm]">{companyName.replace(/[^A-Z]/gi, '').substring(0, 5).toUpperCase()}</div>
                                        {companyName}<br />
                                        Dolmetscher- & Übersetzungsbüro<br />
                                        {companyStreet}<br />
                                        D-{companyZip} {companyCity}<br />
                                        {companyPhone && <>Tel. {companyPhone}<br /></>}
                                        {companyEmail && <>E-Mail: {companyEmail}</>}
                                    </div>
                                </div>
                                <div style={{ width: '35%' }} className="text-right">
                                    <div className="border border-black p-[2mm] text-[7.5pt] leading-tight inline-block text-left" style={{ width: '44mm' }}>
                                        <strong className="block border-b border-black pb-[0.5mm] mb-[1.5mm]">MITTEILUNG AN<br />UNSERE MITARBEITER!:</strong>
                                        Legen Sie bei Ihren Einsätzen bitte immer unsere Einsatzbestätigung sowie Ihren Personalausweis oder Reisepass vor!
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Configuration Sidebar ── */}
                    <div className="w-full md:w-[420px] border-l border-slate-100 bg-white flex flex-col shrink-0 overflow-hidden min-h-0">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-4">
                                <div className="col-span-2 space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dolmetscher / Partner</Label>
                                    <SearchableSelect
                                        value={interpreterId}
                                        onChange={setInterpreterId}
                                        options={partnerOptions}
                                        placeholder="Dolmetscher wählen..."
                                        className="bg-white border-slate-200"
                                    />
                                </div>

                                <div className="col-span-1 space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Termin - Datum & Uhrzeit</Label>
                                    <div className="relative">
                                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                                        <DatePicker
                                            selected={appointmentDate}
                                            onChange={setAppointmentDate}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="dd.MM.yyyy HH:mm"
                                            locale="de"
                                            calendarStartDay={1}
                                            minDate={new Date()}
                                            dayClassName={(date) => [0, 6].includes(date.getDay()) ? 'datepicker-weekend' : ''}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-sm text-sm focus:ring-2 focus:ring-slate-950/10 outline-none h-10 bg-white"
                                            placeholderText="Datum & Zeit wählen"
                                            portalId="root-portal"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-1"></div>

                                <div className="col-span-2 space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Einsatzort (Name der Einrichtung / Firma)</Label>
                                    <Input
                                        startIcon={<FaMapMarkerAlt className="text-slate-400" />}
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        placeholder="z.B. Klinikum Bremerhaven oder Firma XYZ"
                                        className="h-10 border-slate-200"
                                    />
                                </div>

                                <AddressForm
                                    street={addressStreet}
                                    houseNo={addressHouseNo}
                                    zip={addressZip}
                                    city={addressCity}
                                    country={addressCountry}
                                    onChange={(field: string, value: string) => {
                                        if (field === 'street') setAddressStreet(value);
                                        if (field === 'houseNo') setAddressHouseNo(value);
                                        if (field === 'zip') setAddressZip(value);
                                        if (field === 'city') setAddressCity(value);
                                        if (field === 'country') setAddressCountry(value);
                                    }}
                                />

                                <div className="col-span-1 space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ihr Zeichen (Referenz)</Label>
                                    <Input
                                        startIcon={<FaUserEdit className="text-slate-400" />}
                                        value={customerReference}
                                        onChange={e => setCustomerReference(e.target.value)}
                                        placeholder="Aktenzeichen / Ref-Nr"
                                        className="h-10 border-slate-200"
                                    />
                                </div>
                                <div className="col-span-1 space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ihr Schreiben vom</Label>
                                    <div className="relative">
                                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                                        <DatePicker
                                            selected={customerDate}
                                            onChange={setCustomerDate}
                                            dateFormat="dd.MM.yyyy"
                                            locale="de"
                                            calendarStartDay={1}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-sm text-sm focus:ring-2 focus:ring-slate-950/10 outline-none h-10 bg-white"
                                            placeholderText="Datum des Schreibens"
                                            portalId="root-portal"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-1.5 pt-2 border-t border-slate-100 mt-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unser Zeichen (Projekt-Nr)</Label>
                                    <Input
                                        startIcon={<FaInfoCircle className="text-slate-400" />}
                                        value={projectNumber}
                                        onChange={e => setProjectNumber(e.target.value)}
                                        placeholder="Wird automatisch gefüllt"
                                        className="h-10 border-slate-200 bg-slate-50"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-sm border border-slate-100 flex gap-4 transition-all hover:bg-slate-100/50">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shrink-0">
                                    <FaInfoCircle className="text-slate-900 text-xs" />
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                    Die hier eingegebenen Daten werden direkt im Projekt gespeichert und in das offizielle
                                    Dolmetscher-Layout übernommen. Das Dokument wird nach DIN-Vorgaben formatiert.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 bg-white shrink-0">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition flex-1 sm:flex-none justify-center"
                            >
                                Abbrechen
                            </Button>
                            <Button
                                onClick={handleDownload}
                                className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition flex-1 sm:flex-none justify-center"
                            >
                                <FaFilePdf size={14} /> Dokument erstellen & speichern
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterpreterConfirmationModal;
