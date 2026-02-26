import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaComments, FaCopy, FaPaperclip, FaPaperPlane, FaExchangeAlt } from 'react-icons/fa';
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
    const [chatMode, setChatMode] = useState<'customer' | 'partner'>('customer');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    // Filter messages based on chatMode
    const filteredMessages = [...(projectData.messages || [])]
        .filter((msg: any) => (msg.type === chatMode) || (!msg.type && chatMode === 'customer')) // Backward compatibility: old messages are 'customer'
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    useEffect(() => {
        scrollToBottom();
    }, [filteredMessages]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        projectService.postMessage(projectId, newMessage, chatMode).then(() => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('file', e.target.files[0]);
            formData.append('type', 'reference');
            const toastId = toast.loading('Lade Datei hoch...');
            projectService.uploadFile(projectId, formData).then(() => {
                toast.dismiss(toastId);
                toast.success('Datei gesendet');
                const content = `[Datei hochgeladen: ${e.target.files![0].name}]`;
                projectService.postMessage(projectId, content, chatMode).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
                });
            }).catch(() => {
                toast.dismiss(toastId);
                toast.error('Upload Fehler');
            });
        }
    };

    const activePerson = chatMode === 'customer'
        ? projectData.customer
        : projectData.translator;

    const personName = chatMode === 'customer'
        ? (activePerson?.company_name || activePerson?.name || 'Kunde')
        : (activePerson?.name || 'Partner');

    const personEmail = activePerson?.email || 'Keine E-Mail hinterlegt';
    const initials = (personName || 'K').substring(0, 1).toUpperCase();

    return (
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px] mb-10 animate-fadeIn">
            {/* Contact Info Header */}
            <div className="bg-[#f0f2f5] p-3 border-b border-slate-200 flex justify-between items-center shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        {initials}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{personName}</span>
                            <span className={clsx(
                                "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                chatMode === 'customer' ? "bg-brand-primary text-white" : "bg-blue-500 text-white"
                            )}>
                                {chatMode === 'customer' ? 'Kunde' : 'Partner'}
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight">{personEmail}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChatMode(chatMode === 'customer' ? 'partner' : 'customer')}
                        className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-primary hover:bg-white border border-transparent hover:border-slate-200 transition-all rounded-full h-9 px-4"
                    >
                        <FaExchangeAlt className="text-[10px]" />
                        Zu {chatMode === 'customer' ? 'Partner' : 'Kunde'} wechseln
                    </Button>

                    <div className="h-6 w-px bg-slate-200 mx-1"></div>

                    {projectData.access_token && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.host}/guest/project/${projectData.access_token}`);
                                toast.success('Link kopiert');
                            }}
                            className="w-9 h-9 rounded-full text-slate-400 hover:text-brand-primary hover:bg-white"
                            title="Gast-Link kopieren"
                        >
                            <FaCopy />
                        </Button>
                    )}
                </div>
            </div>

            {/* Chat Area - WhatsApp Background */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative"
                style={{
                    backgroundColor: '#e5ddd5',
                    backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`,
                    backgroundBlendMode: 'overlay'
                }}
            >
                {filteredMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mb-4">
                            <FaComments className="text-2xl text-white" />
                        </div>
                        <p className="text-sm font-medium">Keine Nachrichten mit diesem {chatMode === 'customer' ? 'Kunden' : 'Partner'} vorhanden.</p>
                    </div>
                ) : (
                    filteredMessages.map((msg: any) => {
                        const isMe = !!msg.user_id;
                        return (
                            <div key={msg.id} className={clsx("flex flex-col w-full", isMe ? "items-end" : "items-start")}>
                                <div
                                    className={clsx(
                                        "px-2.5 py-1.5 rounded-sm text-xs shadow-sm max-w-[85%] relative min-w-[60px]",
                                        isMe
                                            ? "bg-[#dcf8c6] text-slate-800 rounded-tr-none border border-[#c7eba7]"
                                            : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                                    )}
                                >
                                    <div className="whitespace-pre-wrap break-words pr-12">{msg.content}</div>
                                    <div className="absolute bottom-1 right-1.5 flex items-center gap-1">
                                        <span className="text-[9px] text-slate-400 font-bold">
                                            {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && <span className="text-sky-400 text-[10px] font-bold">✓✓</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-slate-100 bg-[#f0f2f5]">
                <div className="flex gap-2 items-center">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} id="chat-file-upload" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 flex-shrink-0 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-brand-primary shadow-sm"
                    >
                        <FaPaperclip />
                    </Button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Nachricht an ${chatMode === 'customer' ? 'Kunde' : 'Partner'}...`}
                            className="w-full h-11 pl-5 pr-12 rounded-full border border-slate-200 bg-white focus:border-brand-primary outline-none shadow-sm text-xs transition-all"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendMessage();
                            }}
                        />
                        <Button
                            variant="default"
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="absolute right-1.5 top-1.5 w-8 h-8 rounded-full bg-brand-primary hover:bg-brand-primary/90 shadow-sm transition-transform active:scale-95"
                        >
                            <FaPaperPlane className="text-xs" />
                        </Button>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    );
};

export default MessagesTab;
