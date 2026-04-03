import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    FaComments, FaCopy, FaPaperclip, FaPaperPlane, FaExchangeAlt,
    FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive,
    FaFile, FaDownload, FaEye
} from 'react-icons/fa';
import clsx from 'clsx';
import { useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../api/services';
import { Button } from '../ui/button';

interface MessagesTabProps {
    projectData: any;
    projectId: string;
    financials?: any;
}

const MessagesTab = ({ projectData, projectId }: MessagesTabProps) => {
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const [chatMode, setChatMode] = useState<'customer' | 'partner'>('customer');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    const getFileIcon = (extension: string = '') => {
        const ext = extension.toLowerCase();
        if (['pdf'].includes(ext)) return { icon: FaFilePdf, color: 'text-red-500' };
        if (['doc', 'docx'].includes(ext)) return { icon: FaFileWord, color: 'text-blue-500' };
        if (['xls', 'xlsx'].includes(ext)) return { icon: FaFileExcel, color: 'text-green-600' };
        if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return { icon: FaFileImage, color: 'text-purple-500' };
        if (['zip', 'rar', '7z'].includes(ext)) return { icon: FaFileArchive, color: 'text-orange-500' };
        return { icon: FaFile, color: 'text-slate-400' };
    };

    const formatBytes = (bytes: number, decimals = 1) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const handleFilePreview = async (file: any) => {
        try {
            const response = await projectService.downloadFile(projectId, file.id);
            const blob = new Blob([response.data], { type: file.mime_type });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            toast.error('Vorschau nicht möglich');
        }
    };

    const handleFileDownload = async (file: any) => {
        try {
            const response = await projectService.downloadFile(projectId, file.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.original_name || 'download');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            toast.error('Download fehlgeschlagen');
        }
    };

    // Filter messages based on chatMode
    const filteredMessages = [...(projectData.messages || [])]
        .filter((msg: any) => (msg.type === chatMode) || (!msg.type && chatMode === 'customer'))
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
            projectService.uploadFile(projectId, formData).then((response: any) => {
                toast.dismiss(toastId);
                toast.success('Datei gesendet');
                const content = `[Datei hochgeladen: ${e.target.files![0].name}]`;
                projectService.postMessage(projectId, content, chatMode, response.id).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
                });
            }).catch(() => {
                toast.dismiss(toastId);
                toast.error('Upload Fehler');
            });
        }
    };

    const handleSendGuestLink = async () => {
        let token = chatMode === 'customer' ? projectData.access_token : projectData.partner_access_token;
        if (!token) {
            setIsGeneratingToken(true);
            try {
                const response = await projectService.generateToken(projectId, chatMode);
                token = response.access_token;
                await queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
                toast.success('Link wurde generiert');
            } catch (err) {
                toast.error('Link konnte nicht generiert werden');
                return;
            } finally {
                setIsGeneratingToken(false);
            }
        } else {
            toast.success('Link bereits vorhanden');
        }
    };

    const activePerson = chatMode === 'customer' ? projectData.customer : projectData.translator;
    const tokenExists = chatMode === 'customer' ? !!projectData.access_token : !!projectData.partner_access_token;
    const personName = chatMode === 'customer' ? (activePerson?.company_name || activePerson?.name || 'Kunde') : (activePerson?.name || 'Partner');
    const personEmail = activePerson?.email || 'Keine E-Mail hinterlegt';
    const initials = (personName || 'K').substring(0, 1).toUpperCase();

    return (
        <div className="bg-white rounded-sm border border-slate-200 overflow-hidden animate-fadeIn flex flex-col h-[750px]">
            <div className="px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-slate-100 bg-slate-50/10 flex items-center justify-between flex-wrap gap-3 shrink-0">
                <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center">
                        <FaComments className="text-slate-600 text-sm" />
                    </div>
                    Kommunikation
                </h3>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Contact Info Header */}
                <div className="bg-white p-3 border-b border-slate-200 flex justify-between items-center shadow-sm z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg border border-slate-100">
                            {initials}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800">{personName}</span>
                                <span className={clsx(
                                    "text-sm px-3 py-0.5 rounded-full font-bold",
                                    chatMode === 'customer' ? "bg-brand-primary text-white" : "bg-blue-500 text-white"
                                )}>
                                    {chatMode === 'customer' ? 'Kunde' : 'Partner'}
                                </span>
                            </div>
                            <span className="text-sm text-slate-500 leading-tight">{personEmail}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden lg:flex items-center gap-2 mr-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 min-w-[300px]">
                            <span className="text-sm font-bold text-slate-400 shrink-0">Portal:</span>
                            <div className="flex-1">
                                <input
                                    readOnly
                                    value={
                                        (chatMode === 'customer' ? projectData.access_token : projectData.partner_access_token)
                                            ? `${window.location.protocol}//${window.location.host}/guest/project/${chatMode === 'customer' ? projectData.access_token : projectData.partner_access_token}`
                                            : 'Kein Link'
                                    }
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                    className="w-full bg-transparent border-none rounded-sm px-1 py-0.5 text-sm text-slate-400 font-medium outline-none cursor-default"
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => {
                                        const token = chatMode === 'customer' ? projectData.access_token : projectData.partner_access_token;
                                        if (token) {
                                            navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/guest/project/${token}`);
                                            toast.success('Link kopiert');
                                        }
                                    }}
                                    className="text-slate-300 hover:text-brand-primary transition-colors p-1"
                                >
                                    <FaCopy size={10} />
                                </button>
                                <Button
                                    size="sm"
                                    onClick={handleSendGuestLink}
                                    disabled={isGeneratingToken}
                                    className="h-6 px-2 text-sm font-bold flex items-center gap-1"
                                >
                                    {isGeneratingToken ? (
                                        <span className="animate-spin">○</span>
                                    ) : (
                                        <FaPaperPlane size={7} />
                                    )}
                                    {tokenExists ? 'Senden' : 'Generieren'}
                                </Button>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setChatMode(chatMode === 'customer' ? 'partner' : 'customer')}
                            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-primary hover:bg-slate-50 transition-all rounded-full h-8 px-4"
                        >
                            <FaExchangeAlt size={9} />
                            Wechseln
                        </Button>
                    </div>
                </div>

                {/* Chat Area */}
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
                            <p className="text-sm font-medium italic">Keine Nachrichten vorhanden.</p>
                        </div>
                    ) : (
                        filteredMessages.map((msg: any) => {
                            const isMe = !!msg.user_id;
                            return (
                                <div key={msg.id} className={clsx("flex flex-col w-full", isMe ? "items-end" : "items-start")}>
                                    <div
                                        className={clsx(
                                            "px-2.5 py-2 rounded-xl text-xs shadow-sm max-w-[85%] relative min-w-[80px]",
                                            isMe
                                                ? "bg-[#dcf8c6] text-slate-800 rounded-tr-none border border-[#c7eba7]"
                                                : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                                        )}
                                    >
                                        {msg.file ? (
                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                <div className="flex items-center gap-3 p-2 bg-black/5 rounded-sm border border-black/5">
                                                    <div className={clsx("text-2xl", getFileIcon(msg.file.extension).color)}>
                                                        {(() => {
                                                            const { icon: Icon } = getFileIcon(msg.file.extension);
                                                            return <Icon />;
                                                        })()}
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="font-bold truncate text-[11px] leading-tight">
                                                            {msg.file.original_name}
                                                        </span>
                                                        <span className="text-sm text-slate-500 font-medium">
                                                            {formatBytes(msg.file.file_size)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mb-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-sm bg-white/50 hover:bg-white flex items-center gap-1.5 font-bold text-slate-600 rounded-sm"
                                                        onClick={() => handleFilePreview(msg.file)}
                                                    >
                                                        <FaEye size={10} /> Vorschau
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-sm bg-white/50 hover:bg-white flex items-center gap-1.5 font-bold text-slate-600 rounded-sm"
                                                        onClick={() => handleFileDownload(msg.file)}
                                                    >
                                                        <FaDownload size={10} /> Download
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="whitespace-pre-wrap break-words pr-12 pb-3">{msg.content}</div>
                                        )}
                                        <div className="absolute bottom-1 right-1.5 flex items-center gap-1">
                                            <span className="text-sm text-slate-400 font-medium">
                                                {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && <span className="text-sky-400 text-sm font-bold">✓✓</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-slate-100 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex gap-2 items-center">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} id="chat-file-upload" />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 flex-shrink-0 rounded-full bg-slate-50 text-slate-400 hover:text-brand-primary"
                        >
                            <FaPaperclip />
                        </Button>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={`Nachricht an ${chatMode === 'customer' ? 'Kunde' : 'Partner'}...`}
                                className="w-full h-11 pl-5 pr-12 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-primary outline-none text-xs transition-all"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSendMessage();
                                }}
                            />
                            <Button
                                variant="default"
                                size="icon"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className="absolute right-1.5 top-1.5 w-8 h-8 rounded-full"
                            >
                                <FaPaperPlane className="text-xs" />
                            </Button>
                        </div>
                    </div>
                </div>

                <style>{`.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(0,0,0,.1);border-radius:10px}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.2)}`}</style>
            </div>
        </div>
    );
};

export default MessagesTab;
