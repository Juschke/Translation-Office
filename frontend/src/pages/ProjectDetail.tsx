import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { openBlobInNewTab } from '../utils/download';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { mapProjectResponse } from '../utils/projectDataMapper';
import { useProjectModals } from '../hooks/useProjectModals';
import { useProjectFinancials } from '../hooks/useProjectFinancials';
import toast from 'react-hot-toast';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaFlag, FaTrashAlt, FaClock, FaFileInvoiceDollar, FaFilePdf, FaChevronDown, FaBolt, FaInfoCircle, FaComments, FaFileAlt, FaExclamationTriangle, FaEnvelope } from 'react-icons/fa';
import PartnerSelectionModal from '../components/modals/PartnerSelectionModal';
import PaymentModal from '../components/modals/PaymentModal';
import CustomerSelectionModal from '../components/modals/CustomerSelectionModal';
import NewProjectModal from '../components/modals/NewProjectModal';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import FileUploadModal from '../components/modals/FileUploadModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import InviteParticipantModal from '../components/modals/InviteParticipantModal';
import InterpreterConfirmationModal from '../components/modals/InterpreterConfirmationModal';
import InvoicePreviewModal from '../components/modals/InvoicePreviewModal';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, customerService, partnerService } from '../api/services';
import { getFlagUrl, getLanguageName } from '../utils/flags';
import { Button } from '../components/ui/button';


import DetailSkeleton from '../components/common/DetailSkeleton';
import HistoryTab from '../components/projects/HistoryTab';
import MessagesTab from '../components/projects/MessagesTab';
import ProjectOverviewTabNew from '../components/projects/ProjectOverviewTabNew';
import ProjectFilesTab from '../components/projects/ProjectFilesTab';
import ProjectFinancesTab from '../components/projects/ProjectFinancesTab';


interface ProjectPosition {
    id: string;
    description: string;
    amount: string;
    unit: string;
    quantity: string;
    partnerRate: string;
    partnerMode: string;
    partnerTotal: string;
    customerRate: string;
    customerTotal: string;
    customerMode: string;
    marginType: string;
    marginPercent: string;
}

interface ProjectFile {
    id: string;
    name: string;
    file_name?: string;
    original_name?: string;
    ext: string;
    type: string;
    version: string;
    size: string;
    words: number;
    chars: number;
    createdAt: string;
    status: string;
}

interface ProjectData {
    id: string;
    name: string;
    client: string;
    customer_id?: number;
    customer: {
        id: string;
        name: string;
        contact: string;
        email: string;
        phone: string;
        initials: string;
        type: string;
        // Address fields
        address_street?: string;
        address_house_no?: string;
        address_zip?: string;
        address_city?: string;
        address_country?: string;
        // Extra for NewCustomerModal compatibility
        company_name?: string;
        first_name?: string;
        last_name?: string;
    };
    source: string;
    target: string;
    source_language?: any;
    target_language?: any;
    progress: number;
    status: string;
    priority: string;
    due: string;
    isCertified: boolean;
    hasApostille: boolean;
    isExpress: boolean;
    classification: string;
    copies: number;
    copyPrice: number;
    certifiedPrice: number;
    apostillePrice: number;
    expressPrice: number;
    classificationPrice: number;
    certifiedUnit: string;
    apostilleUnit: string;
    expressUnit: string;
    classificationUnit: string;
    copiesUnit: string;
    docType: string[];
    document_type_id?: number;
    additional_doc_types?: any[];
    translator: {
        id?: string;
        name: string;
        email: string;
        initials: string;
        phone: string;
        // Extended info
        address_street?: string;
        address_house_no?: string;
        address_zip?: string;
        address_city?: string;
        address_country?: string;
        rating?: number;
        languages?: string[];
        price_per_word?: number;
        price_per_line?: number;
        unit_rates?: any[];
        flat_rates?: any[];
    };
    partner?: any; // Added for modal compatibility
    documentsSent: boolean;
    pm: string;
    createdAt: string;
    createdAtRaw?: string;
    updatedAt: string;
    updatedAtRaw?: string;
    creator?: { name: string };
    editor?: { name: string };
    positions: ProjectPosition[];
    access_token?: string | null;
    partner_access_token?: string | null;
    messages?: Array<{
        id: string;
        content: string;
        created_at: string;
        sender_name?: string;
        user?: { name: string; id: string };
        user_id?: string;
        is_read: boolean;
    }>;
    payments: any[];
    notes: string;
    files: ProjectFile[];
    invoices?: Array<{
        id: number;
        invoice_number: string;
        status: string;
        type: string;
        amount_gross: number;
        date: string;
        due_date: string;
        is_locked: boolean;
    }>;
    appointment_location?: string;
    customer_reference?: string;
    customer_date?: string | null;
    project_number?: string;
    display_id?: string;
}


const ProjectDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useState(new URLSearchParams(location.search));
    const activeTab = searchParams.get('tab') || 'overview';
    const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);

    const setActiveTab = (tab: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', tab);
        setSearchParams(newParams);
        navigate({ search: newParams.toString() }, { replace: true });
    };

    const {
        isPartnerModalOpen, setIsPartnerModalOpen,
        isEditModalOpen, setIsEditModalOpen,
        isUploadModalOpen, setIsUploadModalOpen,
        isPaymentModalOpen, setIsPaymentModalOpen,
        isCustomerSearchOpen, setIsCustomerSearchOpen,
        isCustomerEditModalOpen, setIsCustomerEditModalOpen,
        isPartnerEditModalOpen, setIsPartnerEditModalOpen,
        isProjectDeleteConfirmOpen, setIsProjectDeleteConfirmOpen,
        isInviteModalOpen, setIsInviteModalOpen,
        isInterpreterModalOpen, setIsInterpreterModalOpen,
        deleteFileConfirm, setDeleteFileConfirm,
        paymentDeleteConfirm, setPaymentDeleteConfirm,
    } = useProjectModals();

    const [previewInvoice, setPreviewInvoice] = useState<any>(null);
    const [editingPayment, setEditingPayment] = useState<any>(null);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActionsOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
                setIsActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isActionsOpen]);

    // Comprehensive Project State
    const [projectData, setProjectData] = useState<ProjectData | null>(null);

    const { data: projectResponse, isLoading, error } = useQuery({
        queryKey: ['projects', id],
        queryFn: () => projectService.getById(id!),
        enabled: !!id
    });

    const displayProjectNumber = useMemo(() => {
        if (!projectData) return '';
        return projectData.display_id || projectData.project_number || String(projectData.id);
    }, [projectData]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.toString() !== searchParams.toString()) {
            setSearchParams(params);
        }
    }, [location.search]);

    useEffect(() => {
        if (projectResponse) {
            console.log('ProjectDetail: projectResponse updated, mapping data...');
            const mapped = mapProjectResponse(projectResponse) as ProjectData;
            setProjectData(mapped);
        }
    }, [projectResponse]);

    const getDeadlineStatus = () => {
        if (!projectData?.due) return { label: t('calendar.no_date'), color: 'bg-slate-50 text-slate-400 border-slate-100', icon: <FaClock /> };
        const today = new Date();
        const due = new Date(projectData.due);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { label: t('calendar.days_overdue', { count: Math.abs(diffDays) }), color: 'bg-red-100 text-red-600 border-red-200', icon: <FaExclamationTriangle /> };
        } else if (diffDays === 0) {
            return { label: t('calendar.due_today'), color: 'bg-orange-100 text-orange-600 border-orange-200', icon: <FaClock /> };
        } else {
            return { label: t('calendar.due_in_days', { count: diffDays }), color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: <FaClock /> };
        }
    };

    const getLanguageInfo = (code: string, langObj?: any) => {
        if (!code) return { flagUrl: '', name: '-' };
        const label = langObj?.name_internal || langObj?.name || getLanguageName(code);

        return {
            flagUrl: getFlagUrl(code),
            name: label
        };
    };

    const updateProjectMutation = useMutation({
        mutationFn: (data: any) => projectService.update(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsEditModalOpen(false);
            toast.success(t('toast.project_updated'));
        },
        onError: () => {
            toast.error(t('toast.project_update_error'));
        }
    });

    const deleteProjectMutation = useMutation({
        mutationFn: (projectId: string) => projectService.delete(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success(t('toast.project_deleted'));
            navigate('/projects');
        },
        onError: () => {
            toast.error(t('toast.project_delete_error'));
        },
        onSettled: () => {
            setIsProjectDeleteConfirmOpen(false);
        }
    });

    const handlePartnerSelect = (partner: any) => {
        if (!projectData) return;
        updateProjectMutation.mutate({ partner_id: partner.id });
        setIsPartnerModalOpen(false);
    };

    const updateCustomerMutation = useMutation({
        mutationFn: (data: any) => {
            const customerId = projectData?.customer_id;
            if (!customerId) return Promise.reject('Keine Kunden-ID gefunden');
            return customerService.update(customerId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsCustomerEditModalOpen(false);
            toast.success(t('toast.customer_updated'));
        },
        onError: () => {
            toast.error(t('toast.customer_update_error'));
        }
    });

    const updatePartnerMutation = useMutation({
        mutationFn: (data: any) => {
            const partnerId = projectData?.translator?.id;
            if (!partnerId) return Promise.reject('Keine Partner-ID gefunden');
            return partnerService.update(Number(partnerId), data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            setIsPartnerEditModalOpen(false);
            toast.success(t('toast.partner_updated'));
        },
        onError: () => {
            toast.error(t('toast.partner_update_error'));
        }
    });

    const handleEditSubmit = (updatedData: any) => {
        updateProjectMutation.mutate(updatedData);
    };


    const uploadFileMutation = useMutation({
        mutationFn: async ({ files, onProgress }: { files: any[], onProgress: (id: string, p: number) => void }) => {
            for (const f of files) {
                const formData = new FormData();
                formData.append('file', f.file);
                formData.append('type', f.type);
                await projectService.uploadFile(id!, formData, (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(f.id, percentCompleted);
                    }
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            toast.success(t('toast.files_uploaded'));
        },
        onError: () => {
            toast.error(t('toast.files_upload_error'));
        }
    });

    const formatFileSize = (bytes: any) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDownloadFile = async (file: any) => {
        try {
            let fileName = file.name || file.fileName || file.original_name || 'download_file';
            const fileExt = file.extension || fileName.split('.').pop();
            if (!fileName.includes('.') && fileExt) {
                fileName = `${fileName}.${fileExt}`;
            }
            const response = await projectService.downloadFile(id!, file.id);
            if (!fileName.includes('.')) {
                const mime = response.headers['content-type'];
                if (mime === 'application/pdf') fileName += '.pdf';
                else if (mime === 'image/jpeg') fileName += '.jpg';
                else if (mime === 'image/png') fileName += '.png';
                else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileName += '.docx';
            }
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(t('messages.download_file_error'));
        }
    };

    const handlePreviewFile = async (file: any) => {
        try {
            const toastId = toast.loading(t('messages.loading_preview'));
            const response = await projectService.downloadFile(id!, file.id);
            const mimeType = response.headers['content-type'];
            const blob = new Blob([response.data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            let fileName = file.name || file.fileName || 'file';

            if (!fileName.includes('.')) {
                if (mimeType === 'application/pdf') fileName += '.pdf';
                else if (mimeType?.startsWith('image/jpeg')) fileName += '.jpg';
                else if (mimeType?.startsWith('image/png')) fileName += '.png';
                else if (mimeType?.startsWith('image/gif')) fileName += '.gif';
                else if (mimeType?.startsWith('image/webp')) fileName += '.webp';
                else if (mimeType?.startsWith('image/svg')) fileName += '.svg';
                else if (mimeType === 'application/msword') fileName += '.doc';
                else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileName += '.docx';
            }

            toast.dismiss(toastId);

            // Store file data for the pop-out window
            const previewData = {
                name: fileName,
                url: url,
                type: file.type,
                id: file.id,
                projectId: id
            };
            localStorage.setItem('previewFileData', JSON.stringify(previewData));

            // Open window with specific dimensions
            const width = Math.min(window.screen.width * 0.8, 1200);
            const height = Math.min(window.screen.height * 0.9, 900);
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;

            window.open(
                '/file-preview',
                'FilePreview',
                `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
            );
        } catch (error) {
            toast.dismiss();
            toast.error(t('messages.preview_load_error'));
        }
    };



    const deleteFileMutation = useMutation({
        mutationFn: async (fileId: string) => {
            await projectService.deleteFile(id!, fileId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            toast.success(t('messages.file_deleted_success'));
        },
        onError: () => {
            toast.error(t('messages.file_delete_error'));
        }
    });

    const handleRenameFile = async (file: any, newName: string) => {
        try {
            await toast.promise(
                projectService.updateFile(id!, file.id, { file_name: newName }),
                {
                    loading: t('messages.renaming_file', 'Benenne Datei um...'),
                    success: t('messages.file_renamed_success', 'Datei erfolgreich umbenannt'),
                    error: t('messages.file_rename_error', 'Fehler beim Umbenennen der Datei')
                }
            );
            console.log('ProjectDetail: File renamed successfully. Invalidating queries...');
            await queryClient.invalidateQueries({ queryKey: ['projects', id] });
            await queryClient.refetchQueries({ queryKey: ['projects', id] });
            console.log('ProjectDetail: Query refetch triggered.');
        } catch (error) {
            console.error('Rename error:', error);
        }
    };

    const handleMoveFile = async (file: any, newType: string) => {
        try {
            await projectService.updateFile(id!, file.id, { type: newType });
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
        } catch (error) {
            throw error;
        }
    };

    const handleBulkFilesMove = async (ids: string[], newType: string) => {
        try {
            await projectService.bulkUpdateFiles(id!, ids, newType);
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            toast.success(t('messages.files_moved_success'));
        } catch (error) {
            toast.error(t('messages.files_move_error'));
        }
    };

    const handleBulkFilesDownloadZip = async (ids: string[]) => {
        try {
            const toastId = toast.loading(t('messages.creating_zip', 'Erstelle ZIP...'));
            const response = await projectService.downloadFilesZip(id!, ids);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `project_${id}_files.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.dismiss(toastId);
            toast.success(t('messages.zip_download_started', 'ZIP-Download gestartet'));
        } catch (error) {
            toast.dismiss();
            toast.error(t('messages.zip_creation_error', 'ZIP konnte nicht erstellt werden'));
        }
    };

    const handleBulkFilesDelete = async (ids: string[]) => {
        try {
            const toastId = toast.loading(t('messages.deleting_files', 'Lösche Dateien...'));
            await projectService.bulkDeleteFiles(id!, ids);
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            toast.dismiss(toastId);
            toast.success(t('messages.files_deleted_success', 'Dateien erfolgreich gelöscht'));
        } catch (error) {
            toast.dismiss();
            toast.error(t('messages.files_delete_error', 'Fehler beim Löschen der Dateien'));
        }
    };

    const handleBulkFilesRename = async (ids: string[], prefix: string, suffix: string) => {
        try {
            if (!projectData) return;
            const toastId = toast.loading(t('messages.renaming_files', 'Benenne Dateien um...'));
            const files = projectData.files.filter((f: any) => ids.includes(f.id));

            for (const file of files) {
                const currentName = file.file_name || file.original_name || 'file';
                const dotIndex = currentName.lastIndexOf('.');
                const nameWithoutExt = dotIndex > -1 ? currentName.substring(0, dotIndex) : currentName;
                const ext = dotIndex > -1 ? currentName.substring(dotIndex) : '';
                const newName = `${prefix}${nameWithoutExt}${suffix}${ext}`;
                await projectService.updateFile(id!, file.id, { file_name: newName });
            }

            console.log('ProjectDetail: Bulk rename complete. Invalidating queries...');
            await queryClient.invalidateQueries({ queryKey: ['projects', id] });
            await queryClient.refetchQueries({ queryKey: ['projects', id] });
            toast.dismiss(toastId);
            toast.success(t('messages.files_renamed_success', 'Dateien erfolgreich umbenannt'));
            console.log('ProjectDetail: Bulk rename queries invalidated/refetched.');
        } catch (error) {
            toast.dismiss();
            toast.error(t('messages.files_rename_error', 'Fehler beim Umbenennen der Dateien'));
        }
    };

    const handleBulkFilesEmail = (ids: string[]) => {
        const sid = 'email_prefill_' + Date.now();
        localStorage.setItem(sid, JSON.stringify({
            projectId: id,
            attachments: ids
        }));
        const w = 1250;
        const h = 850;
        const left = (window.screen.width - w) / 2;
        const top = (window.screen.height - h) / 2;
        window.open(`/email/send?sid=${sid}`, 'EmailSend', `width=${w},height=${h},top=${top},left=${left},scrollbars=yes`);
    };

    const handleFileUpload = async (newFiles: any[], onProgress: (id: string, p: number) => void) => {
        await uploadFileMutation.mutateAsync({ files: newFiles, onProgress });
    };



    const financials = useProjectFinancials(projectData);

    if (isLoading) return <DetailSkeleton />;
    if (error || !projectData) return <div className="p-10 text-center text-red-500">Fehler beim Laden des Projekts.</div>;

    const sourceLang = getLanguageInfo(projectData.source, projectData.source_language);
    const targetLang = getLanguageInfo(projectData.target, projectData.target_language);
    const deadlineStatus = getDeadlineStatus();

    const handleDownloadConfirmation = async (type: 'order_confirmation' | 'pickup_confirmation') => {
        try {
            const toastId = toast.loading(t('messages.creating_document'));
            const response = await projectService.downloadConfirmation(id!, type);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            openBlobInNewTab(blob);
            toast.dismiss(toastId);
            toast.success(t('messages.document_opened'));
        } catch (error) {
            toast.dismiss();
            toast.error(t('messages.document_load_error'));
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden fade-in bg-slate-50/30">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Project Header Container */}
                <div className="bg-white border-b border-slate-200 shadow-sm">
                    <div className="max-w-[1800px] mx-auto px-3 sm:px-4 py-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate('/projects')}
                                    className="rounded-full text-slate-400 hover:text-slate-600 transition shrink-0"
                                >
                                    <FaArrowLeft />
                                </Button>

                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-sm bg-white text-slate-700 flex items-center justify-center text-xl font-semibold border border-slate-200 shadow-sm shrink-0">
                                        {projectData.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex flex-wrap items-baseline gap-2 mb-1">
                                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                                                    {displayProjectNumber}
                                                </h1>
                                            </div>

                                            {projectData.priority !== 'low' && (
                                                <div className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0",
                                                    projectData.priority === 'express' ? "bg-red-50 text-red-600 border-red-100" : "bg-orange-50 text-orange-600 border-orange-100"
                                                )}>
                                                    {projectData.priority === 'express' ? <FaBolt /> : <FaFlag />}
                                                    <span>{projectData.priority === 'express' ? 'Express' : 'Dringend'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:justify-end mt-4 md:mt-0">
                                <Button
                                    onClick={() => navigate(`/projects/${id}/edit`)}
                                    className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-none justify-center"
                                >
                                    <FaEdit /> Bearbeiten
                                </Button>

                                <Button
                                    variant="destructive"
                                    onClick={() => setIsProjectDeleteConfirmOpen(true)}
                                    className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition flex-1 sm:flex-none justify-center"
                                >
                                    <FaTrashAlt /> Löschen
                                </Button>

                                <Button
                                    variant="default"
                                    onClick={() => {
                                        const sid = 'email_prefill_' + Date.now();
                                        localStorage.setItem(sid, JSON.stringify({
                                            to: projectData.translator?.email || projectData.customer?.email || '',
                                            subject: projectData.name ? `Projekt: ${displayProjectNumber} — ${projectData.name}` : `Projekt: ${displayProjectNumber}`,
                                            projectId: id
                                        }));
                                        const w = 1250;
                                        const h = 850;
                                        const left = (window.screen.width - w) / 2;
                                        const top = (window.screen.height - h) / 2;
                                        window.open(`/email/send?sid=${sid}`, 'EmailSend', `width=${w},height=${h},top=${top},left=${left},scrollbars=yes`);
                                    }}
                                    className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition flex-1 sm:flex-none justify-center"
                                >
                                    <FaEnvelope /> E-Mail senden
                                </Button>

                                <div className="relative flex-1 sm:flex-none" ref={actionsRef}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsActionsOpen(v => !v)}
                                        className="w-full px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition justify-center"
                                    >
                                        Mehr Aktionen <FaChevronDown className={clsx('text-[10px] transition-transform', isActionsOpen && 'rotate-180')} />
                                    </Button>

                                    {isActionsOpen && (
                                        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-sm shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1">
                                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">PDF Dokumente</div>
                                            <button
                                                onClick={() => { handleDownloadConfirmation('order_confirmation'); setIsActionsOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-gradient-to-b hover:from-slate-50 hover:to-slate-100 flex items-center gap-3 transition rounded-sm"
                                            >
                                                <FaFilePdf className="text-red-400 shrink-0" /> Auftragsbestätigung
                                            </button>
                                            <button
                                                onClick={() => { handleDownloadConfirmation('pickup_confirmation'); setIsActionsOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-gradient-to-b hover:from-slate-50 hover:to-slate-100 flex items-center gap-3 transition rounded-sm"
                                            >
                                                <FaFilePdf className="text-red-400 shrink-0" /> Abholbestätigung
                                            </button>
                                            <button
                                                onClick={() => { setIsInterpreterModalOpen(true); setIsActionsOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-gradient-to-b hover:from-slate-50 hover:to-slate-100 flex items-center gap-3 transition rounded-sm"
                                            >
                                                <FaFilePdf className="text-red-400 shrink-0" /> Dolmetscherbestätigung
                                            </button>

                                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-b border-slate-100 mt-1">Rechnung</div>
                                            {(() => {
                                                const activeInvoice = projectData.invoices?.find((inv: any) => !['cancelled'].includes(inv.status));
                                                return activeInvoice ? (
                                                    <button
                                                        onClick={() => { setPreviewInvoice(activeInvoice); setIsActionsOpen(false); }}
                                                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-emerald-700 hover:bg-gradient-to-b hover:from-emerald-50 hover:to-emerald-100 flex items-center gap-3 transition rounded-sm"
                                                    >
                                                        <FaFileInvoiceDollar className="text-emerald-500 shrink-0" /> {activeInvoice.invoice_number} öffnen
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => { navigate(`/invoices/new?project_id=${id}`); setIsActionsOpen(false); }}
                                                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-gradient-to-b hover:from-slate-50 hover:to-slate-100 flex items-center gap-3 transition rounded-sm"
                                                    >
                                                        <FaFileInvoiceDollar className="text-slate-400 shrink-0" /> Rechnung erstellen
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meta Info Bar - Inlaid Gray Stripe */}
                <div className="border-t border-slate-100 bg-white">
                    <div className="max-w-[1800px] mx-auto px-3 sm:px-4 py-3">
                        <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-slate-400 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                                <span className="flex items-center gap-1 flex-wrap">
                                    Erstellt am <span className="text-slate-600 font-medium">
                                        {projectData.createdAtRaw ? (
                                            `${format(new Date(projectData.createdAtRaw), 'dd.MM.yyyy, HH:mm', { locale: de })} Uhr`
                                        ) : projectData.createdAt}
                                    </span>
                                    {projectData.createdAtRaw && <span className="text-slate-400 font-normal">({formatDistanceToNow(new Date(projectData.createdAtRaw), { addSuffix: true, locale: de })})</span>}
                                    {projectData.creator && <span>von <span className="text-slate-600 font-medium">{projectData.creator.name}</span></span>}
                                </span>
                            </div>
                            <span className="text-slate-200 hidden sm:block">•</span>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                                <span className="flex items-center gap-1 flex-wrap">
                                    Zuletzt geändert: <span className="text-slate-600 font-medium">
                                        {projectData.updatedAtRaw ? (
                                            `${format(new Date(projectData.updatedAtRaw), 'dd.MM.yyyy, HH:mm', { locale: de })} Uhr`
                                        ) : projectData.updatedAt}
                                    </span>
                                    {projectData.updatedAtRaw && <span className="text-slate-400 font-normal">({formatDistanceToNow(new Date(projectData.updatedAtRaw), { addSuffix: true, locale: de })})</span>}
                                    {projectData.editor && <span>von <span className="text-slate-600 font-medium">{projectData.editor.name}</span></span>}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="border-t border-b border-slate-200 bg-white sticky top-0 z-20">
                    <div className="max-w-[1800px] mx-auto px-3 sm:px-4 flex items-center justify-between md:justify-start">
                        <div className="md:hidden flex-1 py-3">
                            <button
                                onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
                                className="flex items-center gap-3 text-slate-600 font-semibold text-sm hover:text-slate-700 transition-colors w-full"
                            >
                                <div className="w-4 h-3 flex flex-col justify-between">
                                    <span className={clsx("h-0.5 bg-current transition-all", isTabMenuOpen ? "rotate-45 translate-y-1" : "")}></span>
                                    <span className={clsx("h-0.5 bg-current transition-all", isTabMenuOpen ? "opacity-0" : "")}></span>
                                    <span className={clsx("h-0.5 bg-current transition-all", isTabMenuOpen ? "-rotate-45 -translate-y-1.5" : "")}></span>
                                </div>
                                <span>Menü: {
                                    activeTab === 'overview' ? 'Stammdaten' :
                                        activeTab === 'files' ? 'Dateien' :
                                            activeTab === 'finances' ? 'Kalkulation & Marge' :
                                                activeTab === 'history' ? 'Historie' : 'Kommunikation'
                                }</span>
                                <FaChevronDown className={clsx("ml-auto transition-transform", isTabMenuOpen && "rotate-180")} />
                            </button>
                        </div>

                        <div className="hidden md:flex gap-8">
                            {['overview', 'files', 'finances', 'messages', 'history'].map((tab) => {
                                let badgeCount = 0;
                                if (tab === 'files') badgeCount = projectData?.files?.length || 0;
                                if (tab === 'finances') badgeCount = (projectData?.positions?.length || 0) + (projectData?.payments?.length || 0);
                                if (tab === 'messages') badgeCount = projectData?.messages?.length || 0;
                                const isActive = activeTab === tab;

                                return (
                                    <button
                                        key={tab}
                                        onClick={() => {
                                            setActiveTab(tab);
                                            setIsTabMenuOpen(false);
                                        }}
                                        className={clsx(
                                            "pt-5 pb-3 px-1 text-sm font-medium transition-all relative flex items-center gap-2.5 border-b-2 -mb-[1px]",
                                            isActive
                                                ? 'border-brand-primary text-brand-primary font-bold'
                                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
                                        )}
                                    >
                                        {tab === 'overview' && <FaInfoCircle className={clsx("text-sm", isActive ? "text-brand-primary" : "text-slate-300")} />}
                                        {tab === 'files' && <FaFileAlt className={clsx("text-sm", isActive ? "text-brand-primary" : "text-slate-300")} />}
                                        {tab === 'finances' && <FaFileInvoiceDollar className={clsx("text-sm", isActive ? "text-brand-primary" : "text-slate-300")} />}
                                        {tab === 'messages' && <FaComments className={clsx("text-sm", isActive ? "text-brand-primary" : "text-slate-300")} />}
                                        {tab === 'history' && <FaClock className={clsx("text-sm", isActive ? "text-brand-primary" : "text-slate-300")} />}

                                        {tab === 'overview' ? 'Stammdaten' :
                                            tab === 'files' ? 'Dokumente' :
                                                tab === 'finances' ? 'Positionen' :
                                                    tab === 'history' ? 'Historie' : 'Kommunikation'}

                                        {tab !== 'overview' && tab !== 'history' && (
                                            <span className={clsx(
                                                "px-1.5 py-0.5 rounded-sm text-[10px] font-bold transition-colors",
                                                isActive ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {badgeCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile Tab Menu Overlay */}
                    {isTabMenuOpen && (
                        <div className="md:hidden border-t border-slate-100 bg-white animate-fadeIn">
                            <div className="flex flex-col">
                                {['overview', 'files', 'finances', 'messages', 'history'].map((tab) => {
                                    let badgeCount = 0;
                                    if (tab === 'files') badgeCount = projectData?.files?.length || 0;
                                    if (tab === 'finances') badgeCount = (projectData?.positions?.length || 0) + (projectData?.payments?.length || 0);
                                    if (tab === 'messages') badgeCount = projectData?.messages?.length || 0;
                                    const isActive = activeTab === tab;

                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => {
                                                setActiveTab(tab);
                                                setIsTabMenuOpen(false);
                                            }}
                                            className={clsx(
                                                "px-6 py-4 text-sm font-medium flex items-center gap-4 transition-all rounded-sm mx-2 my-1",
                                                isActive
                                                    ? 'bg-slate-50 text-brand-primary font-bold  border-brand-primary'
                                                    : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-700'
                                            )}
                                        >
                                            {tab === 'overview' && <FaInfoCircle className="text-base" />}
                                            {tab === 'files' && <FaFileAlt className="text-base" />}
                                            {tab === 'finances' && <FaFileInvoiceDollar className="text-base" />}
                                            {tab === 'messages' && <FaComments className="text-base" />}
                                            {tab === 'history' && <FaClock className="text-base" />}

                                            <span className="flex-1 text-left">
                                                {tab === 'overview' ? 'Stammdaten' :
                                                    tab === 'files' ? 'Dateien' :
                                                        tab === 'finances' ? 'Kalkulation & Marge' :
                                                            tab === 'history' ? 'Historie' : 'Kommunikation'}
                                            </span>

                                            {tab !== 'overview' && tab !== 'history' && (
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                                    isActive ? "bg-slate-200 text-slate-900" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {badgeCount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 max-w-[1800px] mx-auto w-full px-3 sm:px-4 pt-6 transition-all duration-300 pb-10">
                    {activeTab === "overview" && (
                        <ProjectOverviewTabNew
                            projectData={projectData}
                            sourceLang={sourceLang}
                            targetLang={targetLang}
                            deadlineStatus={deadlineStatus}
                            navigate={navigate}
                            locationPathname={location.pathname}
                            setIsCustomerSearchOpen={setIsCustomerSearchOpen}
                            setIsPartnerModalOpen={setIsPartnerModalOpen}
                            setIsCustomerEditModalOpen={setIsCustomerEditModalOpen}
                            setIsPartnerEditModalOpen={setIsPartnerEditModalOpen}
                            handlePreviewFile={handlePreviewFile}
                            setPreviewInvoice={setPreviewInvoice}
                            onSendEmail={(recipientType) => {
                                const to = recipientType === 'partner'
                                    ? (projectData.translator?.email || '')
                                    : (projectData.customer?.email || '');

                                const sid = 'email_prefill_' + Date.now();
                                localStorage.setItem(sid, JSON.stringify({
                                    to,
                                    subject: projectData.name ? `Projekt: ${displayProjectNumber} — ${projectData.name}` : `Projekt: ${displayProjectNumber}`,
                                    projectId: id
                                }));
                                const w = 1250;
                                const h = 850;
                                const left = (window.screen.width - w) / 2;
                                const top = (window.screen.height - h) / 2;
                                window.open(`/email/send?sid=${sid}`, 'EmailSend', `width=${w},height=${h},top=${top},left=${left},scrollbars=yes`);
                            }}
                        />
                    )}

                    {
                        activeTab === 'files' && (
                            <ProjectFilesTab
                                projectData={projectData}
                                handlePreviewFile={handlePreviewFile}
                                handleDownloadFile={handleDownloadFile}
                                onRenameFile={handleRenameFile}
                                onMoveFile={handleMoveFile}
                                onBulkMove={handleBulkFilesMove}
                                onBulkDownloadZip={handleBulkFilesDownloadZip}
                                onBulkDelete={handleBulkFilesDelete}
                                onBulkRename={handleBulkFilesRename}
                                onBulkEmail={handleBulkFilesEmail}
                                formatFileSize={formatFileSize}
                                onUpload={handleFileUpload}
                            />
                        )
                    }

                    {
                        activeTab === 'finances' && projectData && (
                            <ProjectFinancesTab
                                projectData={projectData}
                                onSavePositions={(positions, extras) => updateProjectMutation.mutate({ positions, ...(extras ?? {}) })}
                                onRecordPayment={() => {
                                    setEditingPayment(null);
                                    setIsPaymentModalOpen(true);
                                }}
                                onEditPayment={(payment) => {
                                    setEditingPayment(payment);
                                    setIsPaymentModalOpen(true);
                                }}
                                onDeletePayment={(paymentId) => {
                                    const payment = (projectData.payments || []).find((p: any) => p.id === paymentId);
                                    setPaymentDeleteConfirm({ isOpen: true, paymentId, amount: payment?.amount || '0' });
                                }}
                                isPendingSave={updateProjectMutation.isPending}
                                onCreateInvoice={() => navigate(`/invoices/new?project_id=${id}`)}
                                onPreviewInvoice={setPreviewInvoice}
                            />
                        )
                    }

                    {
                        activeTab === 'messages' && (
                            <div className="mb-10 animate-fadeIn">
                                <MessagesTab projectData={projectData} projectId={id!} />
                            </div>
                        )
                    }

                    {
                        activeTab === 'history' && (
                            <HistoryTab projectId={id!} />
                        )
                    }
                </div>

                <CustomerSelectionModal
                    isOpen={isCustomerSearchOpen}
                    onClose={() => setIsCustomerSearchOpen(false)}
                    onSelect={(customer) => {
                        updateProjectMutation.mutate({ customer_id: customer.id });
                        if (projectData) {
                            setProjectData({
                                ...projectData,
                                customer_id: customer.id,
                                customer: {
                                    ...projectData.customer,
                                    id: customer.id.toString(),
                                    name: customer.company || customer.name,
                                    contact: customer.contact || '-',
                                    email: customer.email || '',
                                    phone: customer.phone || '',
                                    initials: customer.initials,
                                    type: customer.type
                                },
                                client: customer.company || customer.name
                            });
                        }
                        setIsCustomerSearchOpen(false);
                    }}
                />

                <PartnerSelectionModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} onSelect={handlePartnerSelect} />
                <NewProjectModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={handleEditSubmit}
                    initialData={projectData}
                    isLoading={updateProjectMutation.isPending}
                />
                <FileUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleFileUpload} />
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    initialData={editingPayment}
                    onClose={() => {
                        setIsPaymentModalOpen(false);
                        setEditingPayment(null);
                    }}
                    onSave={(payment) => {
                        let newPayments;
                        if (editingPayment) {
                            newPayments = (projectData?.payments || []).map((p: any) =>
                                p.id === editingPayment.id ? { ...p, ...payment } : p
                            );
                        } else {
                            newPayments = [...(projectData?.payments || []), { ...payment, id: Date.now().toString() }];
                        }

                        const totalPaid = newPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
                        const isFullyPaid = financials.grossTotal > 0 && (financials.grossTotal - totalPaid) <= 0.01;

                        if (projectData) {
                            const updateData: any = { payments: newPayments };
                            if (isFullyPaid && projectData.status !== 'completed' && projectData.status !== 'archived') {
                                updateData.status = 'completed';
                                updateData.progress = 100;
                                toast.success(t('messages.payment_complete_success'));
                            }
                            updateProjectMutation.mutate(updateData);
                        }
                        setEditingPayment(null);
                    }}
                    totalAmount={financials.grossTotal}
                    alreadyPaid={editingPayment ? financials.paid - parseFloat(editingPayment.amount) : financials.paid}
                />

                <NewCustomerModal
                    isOpen={isCustomerEditModalOpen}
                    onClose={() => setIsCustomerEditModalOpen(false)}
                    onSubmit={(data) => updateCustomerMutation.mutate(data)}
                    initialData={projectResponse?.customer}
                    isLoading={updateCustomerMutation.isPending}
                />

                <NewPartnerModal
                    isOpen={isPartnerEditModalOpen}
                    onClose={() => setIsPartnerEditModalOpen(false)}
                    onSubmit={(data) => updatePartnerMutation.mutate(data)}
                    initialData={projectResponse?.partner}
                    isLoading={updatePartnerMutation.isPending}
                />
                {/* FilePreviewModal is now replaced by pop-out window */}
                <ConfirmModal
                    isOpen={deleteFileConfirm.isOpen}
                    onClose={() => setDeleteFileConfirm({ isOpen: false, fileId: null, fileName: '' })}
                    onConfirm={() => {
                        if (deleteFileConfirm.fileId) {
                            deleteFileMutation.mutate(deleteFileConfirm.fileId);
                            setDeleteFileConfirm({ isOpen: false, fileId: null, fileName: '' });
                        }
                    }}
                    title="Datei löschen"
                    message={`Möchten Sie die Datei "${deleteFileConfirm.fileName}" wirklich unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
                    confirmText={t('actions.delete')}
                    cancelText={t('actions.cancel')}
                    isLoading={deleteFileMutation.isPending}
                />
                <ConfirmModal
                    isOpen={paymentDeleteConfirm.isOpen}
                    onClose={() => setPaymentDeleteConfirm({ isOpen: false, paymentId: null, amount: '' })}
                    onConfirm={() => {
                        if (paymentDeleteConfirm.paymentId) {
                            const newPayments = (projectData.payments || []).filter((p: any) => p.id !== paymentDeleteConfirm.paymentId);
                            updateProjectMutation.mutate({ payments: newPayments });
                            setPaymentDeleteConfirm({ isOpen: false, paymentId: null, amount: '' });
                        }
                    }}
                    title="Zahlung löschen"
                    message={`Möchten Sie die Zahlung in Höhe von ${paymentDeleteConfirm.amount} € wirklich löschen?`}
                    confirmText={t('actions.delete')}
                    type="danger"
                />
                <ConfirmModal
                    isOpen={isProjectDeleteConfirmOpen}
                    onClose={() => setIsProjectDeleteConfirmOpen(false)}
                    onConfirm={() => deleteProjectMutation.mutate(id!)}
                    title="Projekt löschen"
                    message={`Möchten Sie das Projekt "${projectData?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
                    confirmText={t('actions.delete')}
                    cancelText={t('actions.cancel')}
                    type="danger"
                    isLoading={deleteProjectMutation.isPending}
                />
                <InviteParticipantModal
                    isOpen={isInviteModalOpen}
                    onClose={() => setIsInviteModalOpen(false)}
                    projectId={id!}
                />

                <InterpreterConfirmationModal
                    isOpen={isInterpreterModalOpen}
                    onClose={() => setIsInterpreterModalOpen(false)}
                    project={projectData}
                />

                <InvoicePreviewModal
                    isOpen={!!previewInvoice}
                    onClose={() => setPreviewInvoice(null)}
                    invoice={previewInvoice}
                    onStatusChange={() => {
                        queryClient.invalidateQueries({ queryKey: ['projects', id] });
                        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
                    }}
                />

            </div>
        </div>
    );
};
export default ProjectDetail;
