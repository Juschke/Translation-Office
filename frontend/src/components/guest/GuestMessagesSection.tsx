import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaPaperPlane, FaPaperclip, FaCamera } from 'react-icons/fa';
import { Button } from '../ui/button';
import { guestService } from '@/api/services';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface GuestMessagesSectionProps {
    messages: any[];
    token: string;
    tenantName?: string;
}

export const GuestMessagesSection: React.FC<GuestMessagesSectionProps> = ({
    messages,
    token,
    tenantName = 'Übersetzungsbüro',
}) => {
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const [senderName] = useState('Gast');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const sendMessageMutation = useMutation({
        mutationFn: (data: { content: string; sender: string }) =>
            guestService.postMessage(token, data.content, data.sender),
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['guestProject', token] });
            toast.success('Nachricht gesendet');
        },
        onError: () => {
            toast.error('Fehler beim Senden');
        },
    });

    const uploadFileMutation = useMutation({
        mutationFn: (file: File) => guestService.uploadFile(token, file),
        onSuccess: () => {
            toast.success('Datei gesendet');
            queryClient.invalidateQueries({ queryKey: ['guestProject', token] });
        },
        onError: () => {
            toast.error('Fehler beim Hochladen');
        },
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
            uploadFileMutation.mutate(e.target.files[0]);
        }
    };

    return (
        <div className="rounded-sm border border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col h-[400px]">
            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-900">Kommunikation</h2>
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    {messages?.length || 0}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white flex flex-col-reverse">
                {(!messages || messages.length === 0) && (
                    <div className="text-center text-slate-400 italic py-10 self-center text-sm">
                        Haben Sie Fragen? Schreiben Sie uns!
                    </div>
                )}
                {messages &&
                    [...messages]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((msg: any) => (
                            <div
                                key={msg.id}
                                className={clsx(
                                    'flex flex-col max-w-[85%]',
                                    !msg.user_id ? 'self-end items-end' : 'self-start items-start'
                                )}
                            >
                                <div
                                    className={clsx(
                                        'px-4 py-2.5 rounded text-sm shadow-sm',
                                        !msg.user_id
                                            ? 'bg-[#1B4D4F] text-white rounded-br-none'
                                            : 'bg-slate-100 text-slate-800 rounded-bl-none'
                                    )}
                                >
                                    {msg.content}
                                </div>
                                <div className="text-xs text-slate-400 mt-1 flex gap-2 px-1">
                                    <span>{msg.user_id ? tenantName : 'Du'}</span>
                                    <span>
                                        {new Date(msg.created_at).toLocaleTimeString('de-DE', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}
            </div>

            <div className="p-3 border-t border-slate-200 bg-white">
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                    <input
                        type="file"
                        ref={cameraInputRef}
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCameraSelect}
                    />

                    <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 transition shadow-sm flex-shrink-0"
                    >
                        <FaCamera />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition shadow-sm flex-shrink-0"
                    >
                        <FaPaperclip />
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Nachricht..."
                            className="w-full h-9 pl-3 pr-10 rounded-full border border-slate-200 focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F] outline-none shadow-sm text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            disabled={sendMessageMutation.isPending}
                        />
                        <Button
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sendMessageMutation.isPending}
                            className="absolute right-1 top-1 h-7 w-7 bg-[#1B4D4F] text-white rounded-full flex items-center justify-center hover:bg-[#2a6b6e] transition shadow-sm"
                        >
                            <FaPaperPlane className="text-xs" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
