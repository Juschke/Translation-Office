import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { mailService } from '../api/services';
import { useEmailCompose } from '../hooks/useEmailCompose';
import MailListPanel from '../components/inbox/MailListPanel';
import MailDetailPanel from '../components/inbox/MailDetailPanel';
import MailResourceTable from '../components/inbox/MailResourceTable';
import { FaTrashAlt, FaPlus, FaSyncAlt, FaArchive } from 'react-icons/fa';
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

import InboxSkeleton from '../components/common/InboxSkeleton';

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
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [deleteType, setDeleteType] = useState<'single' | 'bulk' | 'template' | 'account'>('single');

    const {
        isComposeOpen, setIsComposeOpen,
        setSelectedProjectId,
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

    const { data: archiveMessages = [] } = useQuery({
        queryKey: ['mails', 'archive'],
        queryFn: () => mailService.getAll('archive')
    });

    const { data: draftsMessages = [] } = useQuery({
        queryKey: ['mails', 'drafts'],
        queryFn: () => mailService.getAll('drafts')
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

    // Reset selection when tab changes
    useEffect(() => {
        setSelectedMails([]);
        setViewingMail(null);
    }, [activeTab]);

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

    const restoreMailsMutation = useMutation({
        mutationFn: (ids: number[]) => mailService.restoreMails(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            setSelectedMails([]);
            setViewingMail(null);
            toast.success('Mails wiederhergestellt');
        }
    });

    const archiveMailsMutation = useMutation({
        mutationFn: (ids: number[]) => mailService.archiveMails(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            setSelectedMails([]);
            setViewingMail(null);
            toast.success('Mails archiviert');
        }
    });

    const unarchiveMailsMutation = useMutation({
        mutationFn: (ids: number[]) => mailService.unarchiveMails(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            setSelectedMails([]);
            setViewingMail(null);
            toast.success('Mails aus dem Archiv wiederhergestellt');
        }
    });

    // Handlers
    const handleViewMail = (mail: any) => {
        setViewingMail(mail);
        if (!mail.read && activeTab === 'inbox') markAsReadMutation.mutate(mail.id);
    };

    const confirmDelete = () => {
        if (deleteType === 'bulk') {
            if (selectedMails.length > 0) deleteMailsMutation.mutate(selectedMails);
        } else if (deleteType === 'single') {
            if (mailToDelete) deleteMailsMutation.mutate([mailToDelete]);
        } else if (deleteType === 'template') {
            if (itemToDelete) {
                mailService.deleteTemplate(itemToDelete.id).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] });
                    setIsConfirmOpen(false);
                    setItemToDelete(null);
                }).catch(() => toast.error('Fehler beim Löschen der Vorlage'));
            }
        } else if (deleteType === 'account') {
            if (itemToDelete) {
                mailService.deleteAccount(itemToDelete.id).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] });
                    setIsConfirmOpen(false);
                    setItemToDelete(null);
                }).catch(() => toast.error('Fehler beim Löschen des Kontos'));
            }
        }
    };

    if (isLoadingInbox || isLoadingSent) return (
        <div className="flex-1 overflow-hidden px-4 sm:px-6 lg:px-16 py-6 md:py-8">
            <InboxSkeleton />
        </div>
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-16 py-4 md:py-6">
            <div className="flex flex-col fade-in h-full overflow-hidden">

                <div className="mb-4 flex items-center justify-between gap-4 shrink-0 px-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">E-Mail</h1>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            onClick={() => {
                                const w = 1250;
                                const h = 850;
                                const left = (window.screen.width - w) / 2;
                                const top = (window.screen.height - h) / 2;
                                window.open('/email/send', 'email_composer', `width=${w},height=${h},top=${top},left=${left},scrollbars=yes`);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm"
                        >
                            <FaPlus className="text-[10px]" />
                            <span className="hidden sm:inline">E-Mail schreiben</span>
                            <span className="sm:hidden">Neu</span>
                        </Button>
                    </div>
                </div>

                {/* ── Inbox-Container ── */}
                <div className="flex-1 flex flex-col bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
                    <div className="flex-1 flex overflow-hidden">
                        <InboxSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

                        <div className="flex-1 overflow-hidden flex flex-col bg-white">
                            {['inbox', 'sent', 'trash', 'archive', 'drafts'].includes(activeTab) && (
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
                                                    actions={[
                                                        {
                                                            label: 'Wiederherstellen',
                                                            icon: <FaSyncAlt className="text-xs" />,
                                                            onClick: () => {
                                                                if (activeTab === 'trash') restoreMailsMutation.mutate(selectedMails);
                                                                else if (activeTab === 'archive') unarchiveMailsMutation.mutate(selectedMails);
                                                            },
                                                            variant: 'default',
                                                            show: ['trash', 'archive'].includes(activeTab)
                                                        },
                                                        {
                                                            label: 'Archivieren',
                                                            icon: <FaArchive className="text-xs" />,
                                                            onClick: () => archiveMailsMutation.mutate(selectedMails),
                                                            variant: 'default',
                                                            show: activeTab !== 'archive' && activeTab !== 'trash'
                                                        },
                                                        {
                                                            label: activeTab === 'trash' ? 'Endgültig löschen' : 'In den Papierkorb',
                                                            icon: <FaTrashAlt className="text-xs" />,
                                                            onClick: () => { setDeleteType('bulk'); setIsConfirmOpen(true); },
                                                            variant: 'danger',
                                                            show: true
                                                        }
                                                    ]}
                                                />
                                            </div>
                                        )}
                                        <MailListPanel
                                            mails={
                                                activeTab === 'inbox' ? inboxMessages :
                                                    activeTab === 'sent' ? sentMessages :
                                                        activeTab === 'trash' ? trashMessages :
                                                            activeTab === 'archive' ? archiveMessages :
                                                                draftsMessages
                                            }
                                            folder={activeTab}
                                            onView={handleViewMail}
                                            selectedId={viewingMail?.id}
                                            selectedMails={selectedMails}
                                            onSelectMail={(id) => setSelectedMails(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id])}
                                            onSelectAll={() => {
                                                const currentMails =
                                                    activeTab === 'inbox' ? inboxMessages :
                                                        activeTab === 'sent' ? sentMessages :
                                                            activeTab === 'trash' ? trashMessages :
                                                                activeTab === 'archive' ? archiveMessages :
                                                                    draftsMessages;
                                                setSelectedMails(selectedMails.length === currentMails.length ? [] : currentMails.map((m: any) => m.id));
                                            }}
                                            onDelete={(id: number) => { setMailToDelete(id); setDeleteType('single'); setIsConfirmOpen(true); }}
                                            onSync={() => syncMutation.mutate()}
                                            isSyncing={syncMutation.isPending}
                                        />
                                    </div>

                                    {viewingMail && (
                                        <div className="flex-1 flex flex-col min-w-0 bg-white">
                                            <MailDetailPanel
                                                mail={viewingMail}
                                                onClose={() => setViewingMail(null)}
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
                                        onDelete={(tpl: any) => { setItemToDelete(tpl); setDeleteType('template'); setIsConfirmOpen(true); }}
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
                                        onDelete={(acc: any) => { setItemToDelete(acc); setDeleteType('account'); setIsConfirmOpen(true); }}
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
                    onClose={() => { setIsConfirmOpen(false); setMailToDelete(null); setItemToDelete(null); }}
                    onConfirm={confirmDelete}
                    title={
                        deleteType === 'bulk' ? 'Mails löschen' :
                            deleteType === 'single' ? 'Mail löschen' :
                                deleteType === 'template' ? 'Vorlage löschen' : 'Konto löschen'
                    }
                    message={
                        deleteType === 'bulk' ? `Wollen Sie wirklich ${selectedMails.length} Mails löschen?` :
                            deleteType === 'single' ? 'Wollen Sie diese Mail wirklich löschen?' :
                                deleteType === 'template' ? `Wollen Sie die Vorlage "${itemToDelete?.name}" wirklich löschen?` :
                                    `Wollen Sie das E-Mail-Konto "${itemToDelete?.name}" wirklich löschen?`
                    }
                    confirmLabel="Löschen"
                    variant="danger"
                />
            </div>
        </div>
    );
};

export default CommunicationHub;
