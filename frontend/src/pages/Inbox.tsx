import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
    FaPaperPlane, FaTrash, FaTimes, FaPaperclip, FaPlus, FaEdit,
    FaFileAlt, FaUserCircle, FaKey, FaChevronRight, FaEye, FaTrashAlt,
    FaFolderOpen, FaDownload
} from 'react-icons/fa';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mailService } from '../api/services';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const CommunicationHub = () => {
    const location = useLocation();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('sent');
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [composeTo, setComposeTo] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [composeAttachments, setComposeAttachments] = useState<File[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: sentMessages = [], isLoading: isLoadingSent } = useQuery({
        queryKey: ['mails', 'sent'],
        queryFn: () => mailService.getAll('sent')
    });

    const { data: accounts = [] } = useQuery({
        queryKey: ['mail', 'accounts'],
        queryFn: mailService.getAccounts
    });

    const { data: templates = [] } = useQuery({
        queryKey: ['mail', 'templates'],
        queryFn: mailService.getTemplates
    });

    useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts.find((a: any) => a.is_default) || accounts[0]);
        }
    }, [accounts]);

    useEffect(() => {
        if (location.state?.compose) {
            setComposeTo(location.state.to || '');
            setComposeSubject(location.state.subject || '');
            setComposeBody(location.state.body || '');
            setIsComposeOpen(true);
        }
    }, [location.state]);

    const sendMutation = useMutation({
        mutationFn: (data: any) => {
            const formData = new FormData();
            formData.append('mail_account_id', data.mail_account_id);
            formData.append('to', data.to);
            formData.append('subject', data.subject);
            formData.append('body', data.body);
            composeAttachments.forEach((file, index) => {
                formData.append(`attachments[${index}]`, file);
            });
            return mailService.send(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            setIsComposeOpen(false);
            resetCompose();
        }
    });

    const resetCompose = () => {
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setComposeAttachments([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setComposeAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (index: number) => {
        setComposeAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleApplyTemplate = (template: any) => {
        setComposeSubject(template.subject);
        setComposeBody(template.body);
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    if (isLoadingSent) return <div className="p-10 text-center font-bold text-slate-400">Lädt...</div>;

    return (
        <div className="flex flex-col h-full gap-0 fade-in bg-white border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
                <div>
                    <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Email Management</h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Zentrale Verwaltung</p>
                </div>
                <button
                    onClick={() => setIsComposeOpen(true)}
                    className="bg-brand-700 hover:bg-brand-800 text-white px-6 py-2.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition"
                >
                    <FaPlus /> Neue Email
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-16 md:w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
                    <nav className="flex-1 p-2 space-y-1">
                        <TabButton
                            active={activeTab === 'sent'}
                            onClick={() => setActiveTab('sent')}
                            icon={<FaPaperPlane />}
                            label="Gesendet"
                        />
                        <TabButton
                            active={activeTab === 'templates'}
                            onClick={() => setActiveTab('templates')}
                            icon={<FaFileAlt />}
                            label="Vorlagen"
                        />
                        <TabButton
                            active={activeTab === 'accounts'}
                            onClick={() => setActiveTab('accounts')}
                            icon={<FaUserCircle />}
                            label="Konten"
                        />
                    </nav>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                    {activeTab === 'sent' && (
                        <div className="flex-1 flex flex-col min-h-0 bg-white">
                            <EmailTable mails={sentMessages} />
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="flex-1 p-6 overflow-auto">
                            <ResourceTable
                                title="E-Mail Vorlagen"
                                items={templates}
                                type="template"
                                headers={['Name', 'Betreff', 'Kategorie']}
                                renderRow={(tpl: any) => (
                                    <>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-800">{tpl.name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{tpl.subject}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-black uppercase">{tpl.category || 'Allgemein'}</span>
                                        </td>
                                    </>
                                )}
                            />
                        </div>
                    )}

                    {activeTab === 'accounts' && (
                        <div className="flex-1 p-6 overflow-auto">
                            <ResourceTable
                                title="E-Mail Konten"
                                items={accounts}
                                type="account"
                                headers={['Bezeichnung', 'Email', 'Server', 'Status']}
                                renderRow={(acc: any) => (
                                    <>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-800">
                                            <div className="flex items-center gap-2">
                                                {acc.name}
                                                {acc.is_default && <span className="bg-brand-50 text-brand-700 text-[9px] px-1.5 py-0.5 font-black uppercase">Standard</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{acc.email}</td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-400">{acc.host}</td>
                                        <td className="px-6 py-4">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                        </td>
                                    </>
                                )}
                            />
                        </div>
                    )}
                </div>
            </div>

            {isComposeOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8 bg-slate-900/80 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-6xl h-full md:h-[90vh] flex flex-col shadow-2xl">
                        <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-tighter">Neue Nachricht</h3>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedAccount?.email}</span>
                            </div>
                            <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-red-500 transition">
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex-1 p-8 overflow-y-auto flex flex-col space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-24 shrink-0 pt-2">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Von</label>
                                    </div>
                                    <div className="flex-1 flex gap-2">
                                        <select
                                            value={selectedAccount?.id}
                                            onChange={(e) => setSelectedAccount(accounts.find((a: any) => a.id === parseInt(e.target.value)))}
                                            className="flex-1 bg-white border border-slate-300 px-4 py-2.5 text-xs font-bold outline-none focus:border-brand-500 transition-all"
                                        >
                                            {accounts.map((acc: any) => (
                                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.email})</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => {
                                                const name = prompt('Name des Kontos:');
                                                const email = prompt('E-Mail Adresse:');
                                                if (name && email) {
                                                    mailService.createAccount({
                                                        name, email, host: 'mail.test.de', port: 587,
                                                        encryption: 'tls', username: email, password: 'password'
                                                    }).then(() => queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] }));
                                                }
                                            }}
                                            className="w-10 h-10 flex items-center justify-center border border-slate-300 text-slate-500 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition"
                                        >
                                            <FaPlus />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-24 shrink-0 pt-2">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-wider">An</label>
                                    </div>
                                    <input
                                        value={composeTo}
                                        onChange={(e) => setComposeTo(e.target.value)}
                                        className="flex-1 bg-white border border-slate-300 px-4 py-2.5 text-xs font-bold outline-none focus:border-brand-500 transition-all"
                                        placeholder="empfaenger@beispiel.de"
                                    />
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-24 shrink-0 pt-2">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Betreff</label>
                                    </div>
                                    <input
                                        value={composeSubject}
                                        onChange={(e) => setComposeSubject(e.target.value)}
                                        className="flex-1 bg-white border border-slate-300 px-4 py-2.5 text-xs font-bold outline-none focus:border-brand-500 transition-all text-slate-800"
                                        placeholder="Betreff eingeben..."
                                    />
                                </div>

                                <div className="flex items-start gap-4 flex-1 min-h-0">
                                    <div className="w-24 shrink-0 pt-2">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Nachricht</label>
                                    </div>
                                    <div className="flex-1 flex flex-col min-h-[300px]">
                                        <ReactQuill
                                            theme="snow"
                                            value={composeBody}
                                            onChange={setComposeBody}
                                            modules={quillModules}
                                            className="flex-1 flex flex-col quill-modern no-rounded"
                                        />
                                    </div>
                                </div>

                                {composeAttachments.length > 0 && (
                                    <div className="flex items-start gap-4">
                                        <div className="w-24 shrink-0 pt-2">
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Anhänge</label>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {composeAttachments.map((f, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200">
                                                    <div className="flex items-center gap-3">
                                                        <FaPaperclip className="text-slate-400" />
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-700">{f.name}</div>
                                                            <div className="text-[10px] text-slate-400">{formatFileSize(f.size)}</div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500 p-2">
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="w-80 border-l border-slate-200 bg-slate-50 flex flex-col shrink-0 p-6 overflow-y-auto space-y-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center justify-between">
                                        <span><FaFileAlt className="inline mr-2" /> Vorlagen</span>
                                    </h4>
                                    <div className="space-y-2">
                                        {templates.map((tpl: any) => (
                                            <button
                                                key={tpl.id}
                                                onClick={() => handleApplyTemplate(tpl)}
                                                className="w-full text-left p-3 bg-white border border-slate-200 hover:border-brand-500 transition text-[11px]"
                                            >
                                                <div className="font-black text-slate-800 mb-0.5">{tpl.name}</div>
                                                <div className="text-slate-400 truncate uppercase text-[9px] font-bold tracking-tight">{tpl.category}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">
                                        <FaKey className="inline mr-2" /> Variablen
                                    </h4>
                                    <div className="grid grid-cols-1 gap-1">
                                        {['customer_name', 'project_id', 'delivery_date', 'total_amount'].map(key => (
                                            <button
                                                key={key}
                                                onClick={() => setComposeBody(prev => prev + ` {{${key}}}`)}
                                                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-mono text-slate-600 flex items-center justify-between"
                                            >
                                                <span>{`{{${key}}}`}</span>
                                                <FaChevronRight size={8} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition"
                                >
                                    <FaPaperclip /> Anhängen ({composeAttachments.length})
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={resetCompose}
                                    className="px-4 py-2 text-slate-400 hover:text-red-500 font-black text-[10px] uppercase tracking-widest"
                                >
                                    Verwerfen
                                </button>
                                <button
                                    onClick={() => sendMutation.mutate({
                                        mail_account_id: selectedAccount?.id,
                                        to: composeTo,
                                        subject: composeSubject,
                                        body: composeBody
                                    })}
                                    disabled={sendMutation.isPending}
                                    className="bg-brand-700 hover:bg-brand-800 text-white px-10 py-3 text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-3 transition disabled:opacity-50"
                                >
                                    {sendMutation.isPending ? 'Sende...' : 'Senden'} <FaPaperPlane />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={clsx(
            "w-full flex items-center gap-3 px-4 py-3 text-xs transition-all uppercase tracking-widest",
            active
                ? "bg-slate-100 text-slate-800 font-black border-r-4 border-brand-600"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600 font-bold"
        )}
    >
        <span className={clsx("text-base", active ? "text-brand-600" : "")}>{icon}</span>
        <span className="hidden md:inline">{label}</span>
    </button>
);

const EmailTable = ({ mails }: any) => (
    <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-200">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Empfänger</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Betreff</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Datum</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Anhänge</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Aktionen</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {mails.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-xs text-slate-400 font-bold uppercase">Keine gesendeten E-Mails</td>
                    </tr>
                ) : (
                    mails.map((mail: any) => (
                        <tr key={mail.id} className="hover:bg-slate-50 transition group">
                            <td className="px-6 py-4 text-xs font-bold text-slate-700">{mail.to_emails?.join(', ')}</td>
                            <td className="px-6 py-4 text-xs text-slate-500 font-black">{mail.subject}</td>
                            <td className="px-6 py-4 text-[10px] text-slate-400 font-mono">{mail.full_time}</td>
                            <td className="px-6 py-4">
                                {mail.attachments?.length > 0 && (
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                        <FaPaperclip /> {mail.attachments.length}
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button className="p-2 text-slate-300 hover:text-brand-600 transition" title="Ansehen"><FaEye /></button>
                                    <button className="p-2 text-slate-300 hover:text-red-500 transition" title="Löschen"><FaTrashAlt /></button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

const ResourceTable = ({ title, items, headers, renderRow, type }: any) => (
    <div className="bg-white border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white/50">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">{title}</h2>
            <button className="text-[10px] font-black bg-brand-600 text-white px-3 py-1.5 uppercase transition hover:bg-brand-700">
                Neu+
            </button>
        </div>
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                    {headers.map((h: string) => (
                        <th key={h} className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Aktionen</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {items.length === 0 ? (
                    <tr>
                        <td colSpan={headers.length + 1} className="px-6 py-10 text-center text-xs text-slate-400 font-bold uppercase">Keine Daten vorhanden</td>
                    </tr>
                ) : (
                    items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition border-b border-slate-50">
                            {renderRow(item)}
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button className="p-2 text-slate-300 hover:text-brand-600 transition" title="Bearbeiten"><FaEdit /></button>
                                    <button className="p-2 text-slate-300 hover:text-slate-800 transition" title="Details"><FaFolderOpen /></button>
                                    <button className="p-2 text-slate-300 hover:text-red-500 transition" title="Entfernen"><FaTrashAlt /></button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

export default CommunicationHub;
