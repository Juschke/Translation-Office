import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { mailService } from '../api/services';
import { useEmailCompose } from '../hooks/useEmailCompose';
import MailListPanel from '../components/inbox/MailListPanel';
import MailDetailPanel from '../components/inbox/MailDetailPanel';
import MailResourceTable from '../components/inbox/MailResourceTable';
import { FaTrashAlt, FaPlus, FaSyncAlt } from 'react-icons/fa';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NewEmailAccountModal from '../components/modals/NewEmailAccountModal';
import NewEmailTemplateModal from '../components/modals/NewEmailTemplateModal';
import EmailComposeModal from '../components/modals/EmailComposeModal';
import ConfirmModal from '../components/common/ConfirmModal';
import { BulkActions } from '../components/common/BulkActions';
import { Button } from '../components/ui/button';

// Sub-components
import InboxSidebar from './Inbox/components/InboxSidebar';

const CommunicationHub = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState('inbox');
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState<any>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<any>(null);
    const [viewingMail, setViewingMail] = useState<any>(null);

    // Selection & Deletion state
    const [selectedMails, setSelectedMails] = useState<number[]>([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [mailToDelete, setMailToDelete] = useState<number | null>(null);
    const [deleteType, setDeleteType] = useState<'single' | 'bulk'>('single');

    const {
        isComposeOpen, setIsComposeOpen,
        setSelectedProjectId,
        handleReply,
        handleForward,
        resetCompose,
    } = useEmailCompose();

    // Data Queries
    const { data: inboxMessages = [], isLoading: isLoadingInbox } = useQuery({
        queryKey: ['mails', 'inbox'],
        queryFn: () => mailService.getAll('inbox')
    });

    const { data: sentMessages = [], isLoading: isLoadingSent } = useQuery({
        queryKey: ['mails', 'sent'],
        queryFn: () => mailService.getAll('sent')
    });

    const { data: trashMessages = [] } = useQuery({
        queryKey: ['mails', 'trash'],
        queryFn: () => mailService.getAll('trash')
    });

    const { data: accounts = [] } = useQuery({
        queryKey: ['mail', 'accounts'],
        queryFn: mailService.getAccounts
    });

    const { data: templates = [] } = useQuery({
        queryKey: ['mail', 'templates'],
        queryFn: mailService.getTemplates
    });

    // Auto-open compose if state exists
    useEffect(() => {
        if (location.state?.openCompose) {
            setIsComposeOpen(true);
            if (location.state.projectId) setSelectedProjectId(location.state.projectId);
            window.history.replaceState({}, '');
        }
    }, [location.state, setIsComposeOpen, setSelectedProjectId]);

    // Mutations
    const syncMutation = useMutation({
        mutationFn: mailService.sync,
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            toast.success(data.message || 'Postfach synchronisiert');
        },
        onError: () => toast.error(t('toast.sync_error'))
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id: number) => mailService.markAsRead(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mails'] })
    });

    const deleteMailsMutation = useMutation({
        mutationFn: (ids: number[]) => mailService.deleteMails(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            setSelectedMails([]);
            setIsConfirmOpen(false);
            setMailToDelete(null);
            setViewingMail(null);
            toast.success('Mails gelöscht');
        }
    });

    // Handlers
    const handleViewMail = (mail: any) => {
        setViewingMail(mail);
        if (!mail.read && activeTab === 'inbox') markAsReadMutation.mutate(mail.id);
    };

    const confirmDelete = () => {
        const ids = deleteType === 'bulk' ? selectedMails : (mailToDelete ? [mailToDelete] : []);
        if (ids.length > 0) deleteMailsMutation.mutate(ids);
    };

    if (isLoadingInbox || isLoadingSent) return (
        <div className="p-10 text-center font-medium text-slate-400 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <span>Lade E-Mails...</span>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 fade-in pb-10">

            {/* ── Seitenkopf ── */}
            <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight truncate">E-Mail</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">Zentrale Postverwaltung aller ein- und ausgehenden Nachrichten</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="secondary"
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold"
                    >
                        <FaSyncAlt className={clsx("text-xs", syncMutation.isPending && "animate-spin")} />
                        <span className="hidden sm:inline">{syncMutation.isPending ? 'Synchronisiert...' : 'E-Mails abrufen'}</span>
                    </Button>
                    <Button
                        onClick={() => setIsComposeOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold"
                    >
                        <FaPlus className="text-xs" />
                        <span className="hidden sm:inline">E-Mail schreiben</span>
                        <span className="sm:hidden">Neu</span>
                    </Button>
                </div>
            </div>

            {/* ── Inbox-Container ── */}
            <div className="flex flex-col bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden" style={{ minHeight: '600px' }}>
            <div className="flex-1 flex overflow-hidden">
                <InboxSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="flex-1 overflow-hidden flex flex-col bg-white">
                    {['inbox', 'sent', 'trash'].includes(activeTab) && (
                        <div className="flex-1 flex min-h-0 overflow-hidden">
                            <div className={clsx(
                                "flex flex-col border-r border-slate-200 transition-all overflow-hidden shrink-0",
                                viewingMail ? "w-full md:w-[320px]" : "w-full"
                            )}>
                                {selectedMails.length > 0 && (
                                    <div className="bg-slate-50 border-b border-slate-200">
                                        <BulkActions
                                            selectedCount={selectedMails.length}
                                            onClearSelection={() => setSelectedMails([])}
                                            actions={[{
                                                label: activeTab === 'trash' ? 'Endgültig löschen' : 'In den Papierkorb',
                                                icon: <FaTrashAlt className="text-xs" />,
                                                onClick: () => { setDeleteType('bulk'); setIsConfirmOpen(true); },
                                                variant: 'danger',
                                                show: true
                                            }]}
                                        />
                                    </div>
                                )}
                                <MailListPanel
                                    mails={activeTab === 'inbox' ? inboxMessages : activeTab === 'sent' ? sentMessages : trashMessages}
                                    folder={activeTab}
                                    onView={handleViewMail}
                                    selectedId={viewingMail?.id}
                                    selectedMails={selectedMails}
                                    onSelectMail={(id) => setSelectedMails(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id])}
                                    onSelectAll={() => {
                                        const currentMails = activeTab === 'inbox' ? inboxMessages : activeTab === 'sent' ? sentMessages : trashMessages;
                                        setSelectedMails(selectedMails.length === currentMails.length ? [] : currentMails.map((m: any) => m.id));
                                    }}
                                    onDelete={(id: number) => { setMailToDelete(id); setDeleteType('single'); setIsConfirmOpen(true); }}
                                />
                            </div>

                            {viewingMail && (
                                <div className="flex-1 flex flex-col min-w-0 bg-white">
                                    <MailDetailPanel
                                        mail={viewingMail}
                                        onClose={() => setViewingMail(null)}
                                        onReply={(mail) => { setViewingMail(null); handleReply(mail); }}
                                        onForward={(mail) => { setViewingMail(null); handleForward(mail); }}
                                        onDelete={(id: any) => { setMailToDelete(id); setDeleteType('single'); setIsConfirmOpen(true); }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="flex-1 overflow-auto bg-white">
                            <MailResourceTable
                                title="E-Mail Vorlagen"
                                items={templates}
                                headers={['Name', 'Betreff', 'Kategorie']}
                                addLabel={t('forms.create_template')}
                                onAdd={() => { setTemplateToEdit(null); setIsTemplateModalOpen(true); }}
                                onEdit={(tpl: any) => { setTemplateToEdit(tpl); setIsTemplateModalOpen(true); }}
                                onDelete={(tpl: any) => { if (window.confirm('Vorlage wirklich löschen?')) mailService.deleteTemplate(tpl.id).then(() => queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] })); }}
                                renderRow={(tpl: any) => (
                                    <>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-800">{tpl.name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{tpl.subject}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-slate-100 text-xs font-semibold">{tpl.type || t('inbox.template_general')}</span>
                                        </td>
                                    </>
                                )}
                            />
                        </div>
                    )}

                    {activeTab === 'accounts' && (
                        <div className="flex-1 overflow-auto bg-white">
                            <MailResourceTable
                                title="E-Mail Konten"
                                items={accounts}
                                headers={['Bezeichnung', 'Email', 'Server', 'Status']}
                                addLabel={t('auth.add_account')}
                                onAdd={() => { setAccountToEdit(null); setIsAccountModalOpen(true); }}
                                onEdit={(acc: any) => { setAccountToEdit(acc); setIsAccountModalOpen(true); }}
                                onDelete={(acc: any) => { if (window.confirm('Konto wirklich löschen?')) mailService.deleteAccount(acc.id).then(() => queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] })); }}
                                renderRow={(acc: any) => (
                                    <>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-800">
                                            <div className="flex items-center gap-2">
                                                {acc.name}
                                                {acc.is_default && <span className="bg-slate-50 text-slate-900 text-xs px-1.5 py-0.5 font-semibold">Standard</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{acc.email}</td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                            <div>SMTP: {acc.smtp_host}</div>
                                            <div>IMAP: {acc.imap_host}</div>
                                        </td>
                                        <td className="px-6 py-4"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span></td>
                                    </>
                                )}
                            />
                        </div>
                    )}
                </div>
            </div>
            </div>

            {/* Modals */}
            <EmailComposeModal
                isOpen={isComposeOpen}
                onClose={() => { setIsComposeOpen(false); resetCompose(); }}
            />

            <NewEmailAccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSubmit={(data) => {
                    if (accountToEdit) {
                        mailService.updateAccount(accountToEdit.id, data).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] });
                            setIsAccountModalOpen(false);
                        });
                    } else {
                        mailService.createAccount(data).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] });
                            setIsAccountModalOpen(false);
                        });
                    }
                }}
                initialData={accountToEdit}
            />

            <NewEmailTemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onSubmit={(data) => {
                    if (templateToEdit) {
                        mailService.updateTemplate(templateToEdit.id, data).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] });
                            setIsTemplateModalOpen(false);
                        });
                    } else {
                        mailService.createTemplate(data).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] });
                            setIsTemplateModalOpen(false);
                        });
                    }
                }}
                initialData={templateToEdit}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title={deleteType === 'bulk' ? 'Mails löschen' : 'Mail löschen'}
                message={deleteType === 'bulk' ? `Wollen Sie wirklich ${selectedMails.length} Mails löschen?` : 'Wollen Sie diese Mail wirklich löschen?'}
                confirmText="Löschen"
                type="danger"
            />
        </div>
    );
};

export default CommunicationHub;
