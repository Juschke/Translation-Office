import { useState, useEffect } from 'react';
import { FaTimes, FaEnvelope, FaPaperPlane } from 'react-icons/fa';
import Input from '../common/Input';
import { useMutation } from '@tanstack/react-query';
import { projectService } from '../../api/services';

interface InviteParticipantModalProps {
 isOpen: boolean;
 onClose: () => void;
 projectId: string;
}

const InviteParticipantModal = ({ isOpen, onClose, projectId }: InviteParticipantModalProps) => {
 const [email, setEmail] = useState('');
 const [role, setRole] = useState('translator');
 const [message, setMessage] = useState('');
 const [success, setSuccess] = useState(false);

 const inviteMutation = useMutation({
 mutationFn: (data: any) => projectService.invite(projectId, data),
 onSuccess: () => {
 setSuccess(true);
 setTimeout(() => {
 setSuccess(false);
 onClose();
 setEmail('');
 setMessage('');
 }, 1500);
 }
 });

 useEffect(() => {
 if (isOpen) {
 setEmail('');
 setMessage('');
 setRole('translator');
 setSuccess(false);
 }
 }, [isOpen]);

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
 <div className="bg-white rounded-sm shadow-sm w-full max-w-md overflow-hidden animate-slideUp">
 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-transparent">
 <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
 <FaEnvelope className="text-slate-700" />
 Teilnehmer einladen
 </h2>
 <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
 <FaTimes />
 </button>
 </div>

 <div className="p-6 space-y-4">
 {success ? (
 <div className="flex flex-col items-center justify-center py-8 text-center animate-fadeIn">
 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4">
 <FaPaperPlane />
 </div>
 <h3 className="text-lg font-medium text-slate-800">Einladung versendet!</h3>
 <p className="text-sm text-slate-500 mt-2">Der Teilnehmer wurde erfolgreich per E-Mail eingeladen.</p>
 </div>
 ) : (
 <>
 <Input
 label="E-Mail Adresse"
 type="email"
 value={email}
 onChange={(e: any) => setEmail(e.target.value)}
 placeholder="name@beispiel.de"
 required
 />

 <div>
 <label className="block text-xs font-medium text-slate-700 mb-1.5">Rolle</label>
 <select
 value={role}
 onChange={(e) => setRole(e.target.value)}
 className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900 transition-all appearance-none"
 >
 <option value="translator">Übersetzer</option>
 <option value="reviewer">Lektor</option>
 <option value="client">Kunde (Beobachter)</option>
 <option value="observer">Projektmanager (Gast)</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-medium text-slate-700 mb-1.5">Nachricht (Optional)</label>
 <textarea
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 rows={4}
 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900 transition-all resize-none"
 placeholder="Hallo, ich möchte dich zu diesem Projekt einladen..."
 />
 </div>

 {inviteMutation.isError && (
 <div className="p-3 bg-red-50 text-red-600 text-xs rounded-sm border border-red-100">
 Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
 </div>
 )}

 <div className="pt-4 flex justify-end gap-3">
 <button
 onClick={onClose}
 className="px-4 py-2 text-slate-500 font-medium text-xs hover:bg-slate-50 rounded-sm transition-colors"
 >
 Abbrechen
 </button>
 <button
 onClick={() => inviteMutation.mutate({ email, role, message })}
 disabled={!email || inviteMutation.isPending}
 className="px-6 py-2 bg-slate-900 text-white font-medium text-xs rounded-sm shadow-sm shadow-brand-600/20 hover:bg-slate-900 hover:shadow-brand-600/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {inviteMutation.isPending ? 'Sende...' : (
 <>
 <FaPaperPlane /> Einladen
 </>
 )}
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 );
};

export default InviteParticipantModal;
