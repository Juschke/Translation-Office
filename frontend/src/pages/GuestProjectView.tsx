import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestService } from '../api/services';
import clsx from 'clsx';
import { FaPaperPlane, FaPaperclip, FaFile, FaFilePdf, FaFileWord, FaFileExcel, FaDownload, FaTimes, FaCheck, FaUniversity, FaFileContract, FaCamera, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getFlagUrl } from '../utils/flags';

const formatDate = (dateStr: string) => {
 const d = new Date(dateStr);
 if (isNaN(d.getTime())) return '-';
 // Samstag, 2 Februar 2026
 const day = d.getDate();
 const weekday = d.toLocaleDateString('de-DE', { weekday: 'long' });
 const month = d.toLocaleDateString('de-DE', { month: 'long' });
 const year = d.getFullYear();
 return `${weekday}, ${day} ${month} ${year}`;
};

const getFileIcon = (filename: string) => {
 const ext = filename.split('.').pop()?.toLowerCase();
 if (ext === 'pdf') return <FaFilePdf className="text-red-500" />;
 if (['doc', 'docx'].includes(ext || '')) return <FaFileWord className="text-blue-500" />;
 if (['xls', 'xlsx'].includes(ext || '')) return <FaFileExcel className="text-green-500" />;
 return <FaFile className="text-slate-400" />;
};

const STEPS = [
 { label: 'Eingegangen', match: ['draft', 'offer', 'pending'] },
 { label: 'In Bearbeitung', match: ['processing', 'translating', 'review'] },
 { label: 'Fertiggestellt', match: ['delivered'] },
 { label: 'Abgeschlossen', match: ['completed', 'invoiced', 'paid', 'archived'] }
];

const GuestProjectView = () => {
 const { token } = useParams<{ token: string }>();
 const queryClient = useQueryClient();
 const [newMessage, setNewMessage] = useState('');
 const [senderName, setSenderName] = useState('');

 // Customer Edit State
 const [isEditingCustomer, setIsEditingCustomer] = useState(false);
 const [customerForm, setCustomerForm] = useState({
 company_name: '',
 first_name: '',
 last_name: '',
 address_street: '',
 address_house_no: '',
 address_zip: '',
 address_city: '',
 email: '',
 phone: ''
 });

 const [activeModal, setActiveModal] = useState<'imprint' | 'privacy' | 'terms' | 'avv' | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const cameraInputRef = useRef<HTMLInputElement>(null);

 const { data: project, isLoading, error } = useQuery({
 queryKey: ['guest_project', token],
 queryFn: () => guestService.getProject(token!),
 enabled: !!token
 });

 useEffect(() => {
 if (project) {
 let name = 'Gast';
 if (project.customer) {
 name = project.customer.company_name || `${project.customer.first_name || ''} ${project.customer.last_name || ''}`.trim();

 // Initialize form data
 setCustomerForm({
 company_name: project.customer.company_name || '',
 first_name: project.customer.first_name || '',
 last_name: project.customer.last_name || '',
 address_street: project.customer.address_street || '',
 address_house_no: project.customer.address_house_no || '',
 address_zip: project.customer.address_zip || '',
 address_city: project.customer.address_city || '',
 email: project.customer.email || '',
 phone: project.customer.phone || ''
 });
 }
 if (name === 'Gast') {
 const stored = localStorage.getItem(`guest_name_${token}`);
 if (stored) name = stored;
 }
 setSenderName(name);
 }
 }, [project, token]);

 const sendMessageMutation = useMutation({
 mutationFn: (data: { content: string, sender: string }) => guestService.postMessage(token!, data.content, data.sender),
 onSuccess: () => {
 setNewMessage('');
 queryClient.invalidateQueries({ queryKey: ['guest_project', token] });
 }
 });

 const uploadFileMutation = useMutation({
 mutationFn: (file: File) => guestService.uploadFile(token!, file),
 onSuccess: (data) => {
 toast.success('Datei gesendet');
 const content = `[Datei hochgeladen: ${data.file_name || 'Anhang'}]`;
 sendMessageMutation.mutate({ content, sender: senderName });
 queryClient.invalidateQueries({ queryKey: ['guest_project', token] });
 },
 onError: () => {
 toast.error('Fehler beim Hochladen');
 }
 });

 const updateCustomerMutation = useMutation({
 mutationFn: (data: any) => guestService.updateProject(token!, { customer: data }),
 onSuccess: () => {
 toast.success('Daten gespeichert');
 setIsEditingCustomer(false);
 queryClient.invalidateQueries({ queryKey: ['guest_project', token] });
 },
 onError: () => {
 toast.error('Fehler beim Speichern');
 }
 });

 const handleSendMessage = () => {
 if (!newMessage.trim()) return;
 sendMessageMutation.mutate({ content: newMessage, sender: senderName });
 };

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 uploadFileMutation.mutate(e.target.files[0]);
 }
 };

 const handleCameraSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 toast.loading('Lade Foto hoch...');
 guestService.uploadFile(token!, e.target.files[0])
 .then((data) => {
 toast.dismiss();
 toast.success('Foto hochgeladen');
 const content = `[Foto aufgenommen: ${data.file_name}]`;
 sendMessageMutation.mutate({ content, sender: senderName });
 })
 .catch(() => {
 toast.dismiss();
 toast.error('Upload fehlgeschlagen');
 });
 }
 }

 if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Lade Daten...</div>;
 if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500">Projektzugriff nicht möglich.</div>;
 if (!project) return null;

 const currentStepIndex = STEPS.findIndex(s => s.match.includes(project.status)) !== -1
 ? STEPS.findIndex(s => s.match.includes(project.status))
 : 0;

 const targetFiles = (project.files || []).filter((f: any) =>
 f.type && ['translation', 'target', 'final', 'proofread'].includes(f.type)
 );

 const formatCurrency = (amount: any) => {
 const val = parseFloat(amount);
 return new Intl.NumberFormat('de-DE', { style: 'currency', currency: project.currency || 'EUR' }).format(isNaN(val) ? 0 : val);
 };

 // Helper for Tenant Data fallback
 const tInfos = {
 name: project.tenant?.company_name || 'Translation Office',
 street: project.tenant?.address_street || 'Musterstraße',
 houseNo: project.tenant?.address_house_no || '1',
 zip: project.tenant?.address_zip || '12345',
 city: project.tenant?.address_city || 'Musterstadt',
 email: project.tenant?.email || 'info@translation-office.de',
 phone: project.tenant?.phone || '+49 123 456789',
 vatId: project.tenant?.vat_id || 'DE123456789',
 taxNum: project.tenant?.tax_number || '123/456/7890',
 owner: 'Geschäftsleitung' // Assuming generic owner if not provided
 };

 return (
 <div className="h-screen flex flex-col bg-transparent font-sans text-slate-600 overflow-hidden">
 {/* Fixed Header */}
 <div className="bg-white border-b border-slate-200 flex-none z-20 shadow-sm">
 <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-semibold text-xs">P</div>
 <div>
 <h1 className="text-sm font-semibold text-slate-800">{project.project_name}</h1>
 <p className="text-xs text-slate-400 font-medium">Ref: {project.project_number}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Scrollable Main Section */}
 <div className="flex-1 overflow-y-auto custom-scrollbar">
 <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-10">

 {/* 1. Status Timeline */}
 <div className="bg-white p-4 rounded-sm border border-slate-100 shadow-sm">
 <h2 className="text-xs font-semibold text-slate-400 mb-4 border-b border-slate-50 pb-2">Projektstatus</h2>
 <div className="relative flex justify-between items-center px-2">
 <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10 mx-4"></div>
 <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10 mx-4 transition-all duration-1000" style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}></div>

 {STEPS.map((step, idx) => {
 const isActive = idx <= currentStepIndex;
 const isCurrent = idx === currentStepIndex;
 return (
 <div key={idx} className="flex flex-col items-center gap-1 bg-white px-2">
 <div className={clsx(
 "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ring-4 ring-white transition-all duration-500",
 isActive ? "bg-slate-900 text-white shadow-sm shadow-brand-500/30" : "bg-slate-100 text-slate-400"
 )}>
 {isActive ? <FaCheck /> : idx + 1}
 </div>
 <span className={clsx(
 "text-xs font-medium transition-colors",
 isCurrent ? "text-slate-900" : isActive ? "text-slate-700/70" : "text-slate-300"
 )}>{step.label}</span>
 </div>
 );
 })}
 </div>
 </div>

 {/* 2. Customer & Project Compact */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Customer */}
 {project.customer && (
 <div className="bg-white p-4 rounded-sm border border-slate-100 shadow-sm h-full">
 <div className="flex justify-between items-center mb-3 border-b border-slate-50 pb-2">
 <h2 className="text-xs font-semibold text-slate-400">Ihre Daten</h2>
 {!isEditingCustomer ? (
 <button onClick={() => setIsEditingCustomer(true)} className="text-slate-300 hover:text-slate-700 transition"><FaEdit /></button>
 ) : (
 <div className="flex gap-2">
 <button onClick={() => setIsEditingCustomer(false)} className="text-slate-300 hover:text-red-500"><FaTimes /></button>
 <button onClick={() => updateCustomerMutation.mutate(customerForm)} className="text-emerald-500 hover:text-emerald-600"><FaCheck /></button>
 </div>
 )}
 </div>
 <div className="space-y-2 text-sm">
 {!isEditingCustomer ? (
 <>
 <div>
 <span className="block text-xs text-slate-400 font-medium">Name / Firma</span>
 <span className="font-medium text-slate-800">{project.customer.company_name || `${project.customer.first_name} ${project.customer.last_name}`}</span>
 </div>
 <div>
 <span className="block text-xs text-slate-400 font-medium">Anschrift</span>
 <span className="text-slate-600 text-xs">
 {project.customer.address_street} {project.customer.address_house_no}, {project.customer.address_zip} {project.customer.address_city}
 </span>
 </div>
 <div className="flex gap-4">
 {project.customer.email && (
 <div>
 <span className="block text-xs text-slate-400 font-medium">E-Mail</span>
 <a href={`mailto:${project.customer.email}`} className="text-slate-700 hover:underline">{project.customer.email}</a>
 </div>
 )}
 {project.customer.phone && (
 <div>
 <span className="block text-xs text-slate-400 font-medium">Telefon</span>
 <span className="text-slate-600">{project.customer.phone}</span>
 </div>
 )}
 </div>
 </>
 ) : (
 <div className="space-y-2">
 <input type="text" placeholder="Firma / Name" className="w-full text-xs p-2 border rounded" value={customerForm.company_name || `${customerForm.first_name} ${customerForm.last_name}`} onChange={e => setCustomerForm({ ...customerForm, company_name: e.target.value })} />
 <div className="grid grid-cols-2 gap-2">
 <input type="text" placeholder="Straße" className="w-full text-xs p-2 border rounded" value={customerForm.address_street} onChange={e => setCustomerForm({ ...customerForm, address_street: e.target.value })} />
 <input type="text" placeholder="Nr" className="w-full text-xs p-2 border rounded" value={customerForm.address_house_no} onChange={e => setCustomerForm({ ...customerForm, address_house_no: e.target.value })} />
 </div>
 <div className="grid grid-cols-2 gap-2">
 <input type="text" placeholder="PLZ" className="w-full text-xs p-2 border rounded" value={customerForm.address_zip} onChange={e => setCustomerForm({ ...customerForm, address_zip: e.target.value })} />
 <input type="text" placeholder="Stadt" className="w-full text-xs p-2 border rounded" value={customerForm.address_city} onChange={e => setCustomerForm({ ...customerForm, address_city: e.target.value })} />
 </div>
 <input type="text" placeholder="Telefon" className="w-full text-xs p-2 border rounded" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} />
 <input type="text" placeholder="E-Mail" className="w-full text-xs p-2 border rounded" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} />
 </div>
 )}
 </div>
 </div>
 )}

 {/* Project/Language */}
 <div className="bg-white p-4 rounded-sm border border-slate-100 shadow-sm h-full flex flex-col">
 <h2 className="text-xs font-semibold text-slate-400 mb-3 border-b border-slate-50 pb-2">Projektdetails</h2>
 <div className="flex-1 flex flex-col justify-center gap-4">
 <div className="flex items-center justify-between bg-slate-50 p-3 rounded-sm">
 <div className="flex items-center gap-2">
 <img src={getFlagUrl(project.source_lang?.iso_code || 'de')} className="w-6 h-4 rounded shadow-sm" />
 <span className="text-xs font-medium text-slate-700">{project.source_lang?.name_native || project.source_lang?.name_internal || 'Deutsch'}</span>
 </div>
 <span className="text-slate-300">→</span>
 <div className="flex items-center gap-2">
 <img src={getFlagUrl(project.target_lang?.iso_code || 'en')} className="w-6 h-4 rounded shadow-sm" />
 <span className="text-xs font-medium text-slate-700">{project.target_lang?.name_native || project.target_lang?.name_internal || 'Englisch'}</span>
 </div>
 </div>
 <div className="flex justify-between items-center px-2">
 <span className="text-xs font-medium text-slate-400">Liefertermin</span>
 <span className="text-sm font-semibold text-slate-800">{project.deadline ? formatDate(project.deadline) : '-'}</span>
 </div>
 </div>
 </div>
 </div>

 {/* 3. Description (Compact) */}
 <div className="bg-white p-4 rounded-sm border border-slate-100 shadow-sm">
 <div className="flex justify-between items-center mb-2">
 <h2 className="text-xs font-semibold text-slate-400">Beschreibung</h2>
 </div>
 <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
 {project.description || <span className="italic text-slate-300">Keine Anmerkungen.</span>}
 </p>
 </div>

 {/* 4. Calculation & Payment (Compact) */}
 <div className="bg-white p-4 rounded-sm border border-slate-100 shadow-sm">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <h2 className="text-xs font-semibold text-slate-400 mb-3 border-b border-slate-50 pb-2">Kostenaufstellung</h2>
 <table className="w-full text-sm">
 <tbody className="text-slate-600">
 {project.positions && project.positions.map((pos: any, idx: number) => (
 <tr key={pos.id || idx} className="border-b border-slate-50 last:border-0">
 <td className="py-1.5">{pos.name || 'Dienstleistung'}</td>
 <td className="py-1.5 text-right font-medium">{formatCurrency(pos.total_price)}</td>
 </tr>
 ))}
 {!project.positions?.length && (
 <tr>
 <td className="py-1.5 italic text-slate-400">Pauschalpreis</td>
 <td className="py-1.5 text-right">{formatCurrency(project.price_total)}</td>
 </tr>
 )}
 </tbody>
 <tfoot className="border-t border-slate-100 font-medium text-slate-800">
 <tr>
 <td className="pt-2">Gesamtbetrag (Netto)</td>
 <td className="pt-2 text-right">{formatCurrency(project.price_total)}</td>
 </tr>
 </tfoot>
 </table>
 </div>
 <div className="bg-slate-50 p-3 rounded-sm self-start">
 <div className="flex items-center gap-2 mb-2">
 <FaUniversity className="text-slate-400" />
 <h3 className="text-xs font-semibold text-slate-700">Bankverbindung</h3>
 </div>
 {project.tenant ? (
 <div className="space-y-1 text-xs text-slate-600">
 <div className="flex justify-between border-b border-slate-200 pb-1">
 <span className="text-slate-400">Empfänger</span>
 <span className="font-medium">{project.tenant.company_name}</span>
 </div>
 <div className="flex justify-between border-b border-slate-200 pb-1">
 <span className="text-slate-400">Bank</span>
 <span className="font-medium">{project.tenant.bank_name || '-'}</span>
 </div>
 <div className="flex justify-between border-b border-slate-200 pb-1">
 <span className="text-slate-400">IBAN</span>
 <span className="font-mono font-medium select-all">{project.tenant.bank_iban || '-'}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-400">BIC</span>
 <span className="font-mono font-medium select-all">{project.tenant.bank_bic || '-'}</span>
 </div>
 </div>
 ) : (
 <div className="text-xs text-slate-400 italic">Bitte kontaktieren Sie uns für Bankdaten.</div>
 )}
 </div>
 </div>
 </div>

 {/* 5. Results (Compact) */}
 {targetFiles.length > 0 && (
 <div className="bg-gradient-to-br from-white to-brand-50/30 p-4 rounded-sm border border-slate-100 shadow-sm">
 <h2 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-2">
 <FaDownload /> Ergebnisse
 </h2>
 <div className="space-y-2">
 {targetFiles.map((file: any) => (
 <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded-sm border border-brand-50 shadow-sm hover:shadow-sm transition cursor-pointer">
 <div className="flex items-center gap-3">
 {getFileIcon(file.file_name)}
 <div>
 <div className="font-medium text-sm text-slate-700">{file.file_name}</div>
 <div className="text-xs text-slate-400">{(file.file_size / 1024).toFixed(1)} KB</div>
 </div>
 </div>
 <button className="text-slate-700 hover:text-slate-800"><FaDownload /></button>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* 6. Communication (Compact) */}
 <div className="bg-white rounded-sm border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
 <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
 <h2 className="text-xs font-semibold text-slate-500">Kommunikation</h2>
 <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">{project.messages?.length || 0}</span>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-white flex flex-col-reverse">
 {(!project.messages || project.messages.length === 0) && (
 <div className="text-center text-slate-300 italic py-10 self-center">Haben Sie Fragen? Schreiben Sie uns!</div>
 )}
 {[...(project.messages || [])].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((msg: any) => (
 <div key={msg.id} className={clsx("flex flex-col max-w-[85%]", !msg.user_id ? "self-end items-end" : "self-start items-start")}>
 <div className={clsx("px-3 py-2 rounded-sm text-xs shadow-sm", !msg.user_id ? "bg-slate-900 text-white rounded-br-none" : "bg-slate-100 text-slate-700 rounded-bl-none")}>
 {msg.content}
 </div>
 <div className="text-xs text-slate-300 mt-0.5 flex gap-2 font-medium px-1">
 <span>{msg.user_id ? (tInfos.name || 'Übersetzungsbüro') : 'Du'}</span>
 <span>{new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
 </div>
 </div>
 ))}
 </div>
 <div className="p-3 border-t border-slate-100 bg-transparent">
 <div className="flex gap-2">
 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
 <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleCameraSelect} />

 <button onClick={() => cameraInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 transition shadow-sm">
 <FaCamera />
 </button>
 <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition shadow-sm">
 <FaPaperclip />
 </button>

 <div className="flex-1 relative">
 <input
 type="text"
 value={newMessage}
 onChange={(e) => setNewMessage(e.target.value)}
 placeholder="Nachricht..."
 className="w-full h-8 pl-3 pr-10 rounded-full border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-brand-500 outline-none shadow-sm text-xs"
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleSendMessage();
 }}
 />
 <button onClick={handleSendMessage} className="absolute right-1 top-1 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-900 transition">
 <FaPaperPlane className="text-xs" />
 </button>
 </div>
 </div>
 </div>
 </div>

 </div>
 </div>

 {/* Fixed Footer */}
 <div className="bg-white border-t border-slate-200 py-3 flex-none z-20">
 <div className="max-w-3xl mx-auto px-4 text-center text-xs text-slate-400">
 <div className="flex flex-wrap justify-center gap-4 mb-1 font-medium">
 <button onClick={() => setActiveModal('imprint')} className="hover:text-slate-700 transition">Impressum</button>
 <button onClick={() => setActiveModal('privacy')} className="hover:text-slate-700 transition">Datenschutz</button>
 <button onClick={() => setActiveModal('terms')} className="hover:text-slate-700 transition">AGB</button>
 <button onClick={() => setActiveModal('avv')} className="hover:text-slate-700 transition flex items-center gap-1"><FaFileContract /> Auftragsverarbeitung</button>
 </div>
 <p>&copy; {new Date().getFullYear()} {tInfos.name}</p>
 </div>
 </div>

 {/* Modals */}
 {activeModal && (
 <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
 <div className="bg-white rounded-sm shadow-sm w-full max-w-3xl max-h-[85vh] overflow-y-auto relative p-8">
 <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center">
 <FaTimes />
 </button>

 {activeModal === 'imprint' && (
 <div className="prose prose-sm max-w-none text-slate-700">
 <h2 className="text-xl font-semibold mb-4 border-b border-slate-100 pb-2">Impressum</h2>
 <p className="mb-4 text-xs italic">Angaben gemäß § 5 TMG</p>

 <div className="mb-6">
 <h3 className="font-medium text-slate-800 mb-1">{tInfos.name}</h3>
 <p>{tInfos.street} {tInfos.houseNo}</p>
 <p>{tInfos.zip} {tInfos.city}</p>
 </div>

 <div className="mb-6">
 <h3 className="font-medium text-slate-800 mb-1">Vertreten durch:</h3>
 <p>{tInfos.owner}</p>
 </div>

 <div className="mb-6">
 <h3 className="font-medium text-slate-800 mb-1">Kontakt:</h3>
 <p>Telefon: {tInfos.phone}</p>
 <p>E-Mail: {tInfos.email}</p>
 </div>

 <div className="mb-6">
 <h3 className="font-medium text-slate-800 mb-1">Umsatzsteuer-Identifikationsnummer:</h3>
 <p>gemäß § 27 a Umsatzsteuergesetz: <br />{tInfos.vatId}</p>
 </div>

 <div className="mb-6">
 <h3 className="font-medium text-slate-800 mb-1">Steuernummer:</h3>
 <p>{tInfos.taxNum}</p>
 </div>

 <div className="mb-6">
 <h3 className="font-medium text-slate-800 mb-1">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</h3>
 <p>{tInfos.owner}</p>
 <p>{tInfos.street} {tInfos.houseNo}</p>
 <p>{tInfos.zip} {tInfos.city}</p>
 </div>

 <div className="mb-6">
 <h3 className="font-medium text-slate-800 mb-1">Streitschlichtung</h3>
 <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr.<br /> Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
 <p className="mt-2">Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
 </div>

 <div className="mb-6">
 <h3 className="font-medium text-slate-800 mb-1">Haftung für Inhalte</h3>
 <p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
 </div>
 </div>
 )}

 {activeModal === 'privacy' && (
 <div className="prose prose-sm max-w-none text-slate-700">
 <h2 className="text-xl font-semibold mb-4 border-b border-slate-100 pb-2">Datenschutzerklärung</h2>

 <h3 className="font-medium text-slate-800 mt-4 mb-2">1. Datenschutz auf einen Blick</h3>
 <p className="font-medium">Allgemeine Hinweise</p>
 <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</p>

 <h3 className="font-medium text-slate-800 mt-6 mb-2">2. Allgemeine Hinweise und Pflichtinformationen</h3>
 <p className="font-medium">Datenschutz</p>
 <p>Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>

 <p className="font-medium mt-2">Hinweis zur verantwortlichen Stelle</p>
 <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
 <p className="mt-1">
 {tInfos.name}<br />
 {tInfos.street} {tInfos.houseNo}<br />
 {tInfos.zip} {tInfos.city}
 </p>
 <p className="mt-1">
 Telefon: {tInfos.phone}<br />
 E-Mail: {tInfos.email}
 </p>

 <h3 className="font-medium text-slate-800 mt-6 mb-2">3. Datenerfassung durch unser Kundenportal</h3>
 <p>Wir erheben, verarbeiten und nutzen personen­bezogene Daten nur, soweit sie für die Begründung, inhaltliche Ausgestaltung oder Änderung des Rechtsverhältnisses erforderlich sind (Bestandsdaten). Dies erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, der die Verarbeitung von Daten zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen gestattet.</p>

 <h3 className="font-medium text-slate-800 mt-6 mb-2">4. Ihre Rechte</h3>
 <p>Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden.</p>

 <h3 className="font-medium text-slate-800 mt-6 mb-2">5. Datensicherheit</h3>
 <p>Wir verwenden innerhalb des Website-Besuchs das verbreitete SSL-Verfahren (Secure Socket Layer) in Verbindung mit der jeweils höchsten Verschlüsselungsstufe, die von Ihrem Browser unterstützt wird. Ob eine einzelne Seite unseres Internetauftrittes verschlüsselt übertragen wird, erkennen Sie an der geschlossenen Darstellung des Schüssel- beziehungsweise Schloss-Symbols in der Statusleiste Ihres Browsers.</p>
 </div>
 )}

 {activeModal === 'terms' && (
 <div className="prose prose-sm max-w-none text-slate-700">
 <h2 className="text-xl font-semibold mb-4 border-b border-slate-100 pb-2">Allgemeine Geschäftsbedingungen</h2>
 <p className="italic text-xs mb-4">Stand: 01.01.2026</p>

 <h3 className="font-medium text-slate-800 mt-4 mb-2">§ 1 Geltungsbereich</h3>
 <p>(1) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über Sprachdienstleistungen (Übersetzungen, Dolmetschen, Lektorat etc.) zwischen {tInfos.name} (Auftragnehmer) und seinen Kunden (Auftraggeber).</p>
 <p>(2) Entgegenstehende oder von diesen AGB abweichende Bedingungen des Auftraggebers werden nicht anerkannt, es sei denn, der Auftragnehmer hat ihrer Geltung ausdrücklich schriftlich zugestimmt.</p>

 <h3 className="font-medium text-slate-800 mt-6 mb-2">§ 2 Vertragsschluss</h3>
 <p>(1) Der Vertrag kommt durch Annahme des Angebots des Auftragnehmers durch den Auftraggeber zustande. Die Annahme kann schriftlich oder per E-Mail erfolgen.</p>
 <p>(2) Änderungen und Ergänzungen des Vertrages bedürfen der Textform.</p>

 <h3 className="font-medium text-slate-800 mt-6 mb-2">§ 3 Mitwirkungspflicht des Auftraggebers</h3>
 <p>Der Auftraggeber hat dem Auftragnehmer alle für die Übersetzung notwendigen Informationen und Unterlagen (Glossare, Stilrichtlinien, Referenztexte) rechtzeitig zur Verfügung zu stellen. Fehler, die sich aus der Nichteinhaltung dieser Obliegenheiten ergeben, gehen nicht zu Lasten des Auftragnehmers.</p>

 <h3 className="font-medium text-slate-800 mt-6 mb-2">§ 4 Ausführung und Mängelbeseitigung</h3>
 <p>(1) Die Übersetzung wird nach den Grundsätzen ordnungsgemäßer Berufsausübung sorgfältig ausgeführt.</p>
 <p>(2) Rügt der Auftraggeber einen in der Übersetzung enthaltenen objektiven Mangel, so hat der Auftragnehmer zunächst Anspruch auf Nachbesserung innerhalb einer angemessenen Frist. Schlägt die Nachbesserung fehl, kann der Auftraggeber Minderung oder Wandlung verlangen.</p>

 <h3 className="font-medium text-slate-800 mt-6 mb-2">§ 5 Haftung</h3>
 <p>Der Auftragnehmer haftet bei grober Fahrlässigkeit und Vorsatz. Bei leichter Fahrlässigkeit haftet der Auftragnehmer nur bei Verletzung vertragswesentlicher Pflichten. Die Haftung ist in jedem Fall auf die Höhe des Auftragswertes oder der entsprechenden Versicherungssumme begrenzt.</p>

 <h3 className="font-medium text-slate-800 mt-6 mb-2">§ 6 Zahlungsbedingungen</h3>
 <p>(1) Die Vergütung ist, sofern nichts anderes vereinbart ist, sofort nach Rechnungserstellung ohne Abzug fällig.</p>
 <p>(2) Alle Preise verstehen sich netto zzgl. der gesetzlichen Umsatzsteuer.</p>

 <h3 className="font-medium text-slate-800 mt-6 mb-2">§ 7 Eigentumsvorbehalt und Urheberrecht</h3>
 <p>(1) Die gelieferte Übersetzung bleibt bis zur vollständigen Bezahlung Eigentum des Auftragnehmers.</p>
 <p>(2) Der Auftragnehmer behält sich sein Urheberrecht vor.</p>

 <h3 className="font-medium text-slate-800 mt-6 mb-2">§ 8 Schlussbestimmungen</h3>
 <p>(1) Es gilt das Recht der Bundesrepublik Deutschland.</p>
 <p>(2) Gerichtsstand ist der Sitz des Auftragnehmers.</p>
 </div>
 )}

 {activeModal === 'avv' && (
 <div className="prose prose-sm max-w-none text-slate-700">
 <h2 className="text-xl font-semibold mb-4 border-b border-slate-100 pb-2">Auftragsverarbeitung (AVV)</h2>
 <p>Hier können Sie den Vertrag zur Auftragsverarbeitung gemäß Art. 28 DSGVO herunterladen.</p>
 <div className="bg-slate-50 p-6 rounded-sm border border-slate-100 flex items-center justify-between mt-4">
 <div className="flex items-center gap-3">
 <FaFileContract className="text-3xl text-slate-700" />
 <div>
 <div className="font-medium text-slate-800">AV-Vertrag Standard</div>
 <div className="text-xs text-slate-500">PDF-Dokument (Muster)</div>
 </div>
 </div>
 <button className="px-4 py-2 bg-slate-900 text-white rounded-sm text-xs font-medium hover:bg-slate-900 transition" onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/guest/project/${token}/avv`, '_blank')}>Download</button>
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 </div>
 );
};

export default GuestProjectView;
