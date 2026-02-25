import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaComments, FaCopy, FaPaperclip, FaCamera, FaPaperPlane } from 'react-icons/fa';
import clsx from 'clsx';
import { useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../api/services';
import { Button } from '../ui/button';

interface MessagesTabProps {
 projectData: any;
 projectId: string;
}

const MessagesTab = ({ projectData, projectId }: MessagesTabProps) => {
 const queryClient = useQueryClient();
 const [newMessage, setNewMessage] = useState('');
 const fileInputRef = useRef<HTMLInputElement>(null);
 const messagesContainerRef = useRef<HTMLDivElement>(null);

 const scrollToBottom = () => {
 if (messagesContainerRef.current) {
 messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
 }
 };

 useEffect(() => {
 scrollToBottom();
 }, [projectData.messages]);

 const handleSendMessage = () => {
 if (!newMessage.trim()) return;
 projectService.postMessage(projectId, newMessage).then(() => {
 setNewMessage('');
 queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
 });
 };

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 const formData = new FormData();
 formData.append('file', e.target.files[0]);
 const toastId = toast.loading('Lade Datei hoch...');
 projectService.uploadFile(projectId, formData).then(() => {
 toast.dismiss(toastId);
 toast.success('Datei gesendet');
 const content = `[Datei hochgeladen: ${e.target.files![0].name}]`;
 projectService.postMessage(projectId, content).then(() => {
 queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
 });
 }).catch(() => {
 toast.dismiss(toastId);
 toast.error('Upload Fehler');
 });
 }
 };

 const messages = [...(projectData.messages || [])].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

 return (
 <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] mb-10 animate-fadeIn">
 {/* Header */}
 <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
 <div>
 <h3 className="text-xs font-semibold text-slate-500 flex items-center gap-2">
 <FaComments /> Kommunikation
 </h3>
 </div>
 <div className="flex items-center gap-3">
 {!projectData.access_token ? (
 <Button
 variant="default"
 size="sm"
 onClick={() => {
 projectService.generateToken(projectId).then(() => {
 queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
 toast.success('Gast-Link generiert');
 });
 }}
 className="h-auto px-3 py-1.5"
 >
 Gast-Zugang aktivieren
 </Button>
 ) : (
 <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-sm px-2 py-1">
 <span className="text-xs text-slate-500 font-mono select-all truncate max-w-[150px]">
 {window.location.origin}/guest/project/{projectData.access_token}
 </span>
 <div className="h-3 w-px bg-slate-200 mx-1"></div>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => {
 navigator.clipboard.writeText(`${window.location.origin}/guest/project/${projectData.access_token}`);
 toast.success('Link kopiert');
 }}
 className="h-auto w-auto p-1 text-slate-400 hover:text-slate-700"
 title="Link kopieren"
 >
 <FaCopy />
 </Button>
 </div>
 )}
 </div>
 </div>

 {/* Chat Area */}
 <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-transparent">
 {messages.length === 0 ? (
 <div className="h-full flex flex-col items-center justify-center text-slate-300">
 <p className="text-sm italic">Haben Sie Fragen? Schreiben Sie uns!</p>
 </div>
 ) : (
 messages.map((msg: any) => {
 const isMe = !!msg.user_id;
 return (
 <div key={msg.id} className={clsx("flex flex-col max-w-[85%]", isMe ? "self-end items-end" : "self-start items-start")}>
 <div className={clsx("px-3 py-2 rounded-sm text-xs shadow-sm", isMe ? "bg-slate-900 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-bl-none")}>
 {msg.content}
 </div>
 <div className="text-xs text-slate-300 mt-0.5 flex gap-2 font-medium px-1">
 <span>{msg.user ? msg.user.name : (msg.sender_name || 'Gast')}</span>
 <span>{new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
 </div>
 </div>
 );
 })
 )}
 </div>

 {/* Input Area */}
 <div className="p-3 border-t border-slate-100 bg-white">
 <div className="flex gap-2 items-center">
 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

 <Button
 variant="ghost"
 size="icon"
 onClick={() => fileInputRef.current?.click()}
 className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 shadow-sm"
 >
 <FaPaperclip />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 shadow-sm"
 onClick={() => toast.success('Kamera-Funktion (Demo)')}
 >
 <FaCamera />
 </Button>

 <div className="flex-1 relative">
 <input
 type="text"
 value={newMessage}
 onChange={(e) => setNewMessage(e.target.value)}
 placeholder="Nachricht..."
 className="w-full h-9 pl-4 pr-10 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-brand-500 outline-none shadow-sm text-xs transition-all"
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleSendMessage();
 }}
 />
 <Button
 variant="default"
 size="icon"
 onClick={handleSendMessage}
 disabled={!newMessage.trim()}
 className="absolute right-1 top-1 w-7 h-7 rounded-full shadow-sm"
 >
 <FaPaperPlane className="text-xs" />
 </Button>
 </div>
 </div>
 </div>
 </div>
 );
};

export default MessagesTab;
