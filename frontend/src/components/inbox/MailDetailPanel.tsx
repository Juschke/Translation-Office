import { useState } from 'react';
import DOMPurify from 'dompurify';
import { FaTimes, FaReply, FaForward, FaTrashAlt, FaFileAlt, FaEdit, FaEye, FaDownload, FaReplyAll } from 'react-icons/fa';
import { ScrollArea, Button } from '../ui';
import FilePreviewModal from '../modals/FilePreviewModal';
import api from '../../api/axios';

interface MailDetailPanelProps {
    mail: any;
    isDraft?: boolean;
    onClose: () => void;
    onDelete: (id: any) => void;
}

const MailDetailPanel = ({ mail, isDraft, onClose, onDelete }: MailDetailPanelProps) => {
    const [previewFile, setPreviewFile] = useState<any>(null);

    if (!mail) return null;

    const getAttachmentUrl = (index: number) => {
        return `${api.defaults.baseURL}/mails/${mail.id}/attachments/${index}`;
    };

    const handlePreview = (at: any, index: number) => {
        setPreviewFile({
            name: at.name,
            url: getAttachmentUrl(index),
            type: at.mime
        });
    };

    const handleDownload = (at: any, index: number) => {
        const url = getAttachmentUrl(index);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', at.name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAction = (type: 'reply' | 'forward' | 'edit') => {
        const sid = `compose_${Date.now()}`;
        const data: any = {
            subject: type === 'reply' ? `Re: ${mail.subject}` : (type === 'forward' ? `Fwd: ${mail.subject}` : mail.subject),
            to: type === 'reply' ? mail.from : (type === 'edit' ? (mail.target_email || mail.to_emails?.[0] || '') : ''),
            body: type === 'edit' ? mail.body : `\n\n--- Ursprüngliche Nachricht ---\nVon: ${mail.from}\nGesendet: ${mail.full_time}\nAn: ${mail.to_emails?.join(', ') || mail.target_email}\nBetreff: ${mail.subject}\n\n${mail.body}`,
            projectId: mail.project_id
        };

        if (type === 'edit') {
            data.draftId = mail.id;
        }

        // Attachments only for forward or edit
        if ((type === 'forward' || type === 'edit') && mail.attachments) {
            data.attachments = mail.attachments;
        }

        localStorage.setItem(sid, JSON.stringify(data));
        window.open(`/email/send?sid=${sid}`, `compose_${sid}`, 'width=1250,height=850,scrollbars=yes');
    };

    return (
            <div className="h-full flex flex-col bg-white overflow-hidden">
                {/* Header / Toolbar - Outlook Style */}
                <div className="px-6 py-2 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 h-[52px]">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-sm transition"
                        >
                            <FaTimes size={16} />
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {isDraft ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => handleAction('edit')}
                                    className="h-9 px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-100 rounded-sm flex items-center gap-2"
                                >
                                    <FaEdit size={14} className="text-slate-500" /> Weiter bearbeiten
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleAction('reply')}
                                        className="h-9 px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-100 rounded-sm flex items-center gap-2"
                                    >
                                        <FaReply size={14} className="text-slate-500" /> Antworten
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleAction('reply')} // Mocking Reply All
                                        className="h-9 px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-100 rounded-sm flex items-center gap-2"
                                    >
                                        <FaReplyAll size={14} className="text-slate-500" /> Allen antworten
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleAction('forward')}
                                        className="h-9 px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-100 rounded-sm flex items-center gap-2"
                                    >
                                        <FaForward size={14} className="text-slate-500" /> Weiterleiten
                                    </Button>
                                </>
                            )}
                            <div className="w-[1px] h-5 bg-slate-200 mx-1" />
                            <Button
                                variant="ghost"
                                onClick={() => onDelete(mail.id)}
                                className="h-9 px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-100 hover:text-red-600 rounded-sm flex items-center gap-2"
                            >
                                <FaTrashAlt size={14} /> Löschen
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="h-9 w-9 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition rounded-sm flex items-center justify-center"
                        >
                            <FaTimes size={16} />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="bg-white">
                        {/* Subject Area */}
                        <div className="px-8 pt-8 pb-4">
                            <h2 className="text-2xl font-semibold text-slate-900 leading-tight">
                                {mail.subject || '(Kein Betreff)'}
                            </h2>
                        </div>

                        {/* Sender Info - Outlook Style */}
                        <div className="px-8 py-4 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full border border-slate-100 bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden shadow-sm">
                                {mail.from?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="text-[15px] font-bold text-slate-900 truncate">
                                            {mail.from}
                                        </div>
                                        <div className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                            <span>An:</span>
                                            <span className="truncate">
                                                {mail.to_emails?.join(', ') || mail.target_email || 'Empfänger unbekannt'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-[12px] text-slate-400 font-medium whitespace-nowrap">
                                        {mail.full_time}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attachments Section - Outlook Style (Inline at the top) */}
                        {mail.attachments && mail.attachments.length > 0 && (
                            <div className="px-8 py-4 border-y border-slate-100 bg-slate-50/30 flex flex-wrap gap-3">
                                {mail.attachments.map((at: any, i: number) => (
                                    <div 
                                        key={i}
                                        className="inline-flex items-center gap-3 bg-white border border-slate-200 pr-2 pl-3 py-1.5 rounded-sm shadow-sm max-w-[280px] group"
                                    >
                                        <FaFileAlt className="text-slate-400 text-sm shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-slate-700 truncate mb-0">
                                                {at.name}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {(at.size / 1024).toFixed(0)} KB
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handlePreview(at, i)}
                                                className="p-1.5 hover:bg-slate-100 rounded-sm text-slate-500 hover:text-slate-900"
                                                title="Vorschau"
                                            >
                                                <FaEye size={12} />
                                            </button>
                                            <button 
                                                onClick={() => handleDownload(at, i)}
                                                className="p-1.5 hover:bg-slate-100 rounded-sm text-slate-500 hover:text-slate-900"
                                                title="Download"
                                            >
                                                <FaDownload size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Body - Clean Outlook Interior */}
                        <div className="px-8 py-10 max-w-5xl">
                            <div className="email-body-container">
                                <div
                                    className="email-body-content text-[#333] text-[15px] leading-relaxed prose prose-slate max-w-none font-normal selection:bg-slate-900 selection:text-white"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mail.body ?? '') }}
                                />
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <FilePreviewModal 
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    file={previewFile}
                    onDownload={() => {
                        if (!previewFile) return;
                        const index = mail.attachments.findIndex((a: any) => a.name === previewFile.name);
                        if (index !== -1) handleDownload(mail.attachments[index], index);
                    }}
                />
            </div>
    );
};

export default MailDetailPanel;
