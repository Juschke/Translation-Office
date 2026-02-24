import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { openBlobInNewTab } from '../utils/download';
import { mapProjectResponse } from '../utils/projectDataMapper';
import { useProjectModals } from '../hooks/useProjectModals';
import PartnerSelectionModal from '../components/modals/PartnerSelectionModal';
import PaymentModal from '../components/modals/PaymentModal';
import CustomerSelectionModal from '../components/modals/CustomerSelectionModal';
import NewProjectModal from '../components/modals/NewProjectModal';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import FileUploadModal from '../components/modals/FileUploadModal';
import NewInvoiceModal from '../components/modals/NewInvoiceModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import InviteParticipantModal from '../components/modals/InviteParticipantModal';
import InterpreterConfirmationModal from '../components/modals/InterpreterConfirmationModal';
import InvoicePreviewModal from '../components/modals/InvoicePreviewModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, invoiceService, customerService, partnerService } from '../api/services';
import { getFlagUrl } from '../utils/flags';
import { getLanguageLabel } from '../utils/languages';
import { Typography, Button, Space, Tag, Dropdown, Tabs, type MenuProps } from 'antd';
import {
    ArrowLeftOutlined, EditOutlined, DeleteOutlined, MailOutlined,
    MoreOutlined, FilePdfOutlined, FileTextOutlined,
    ClockCircleOutlined, ExclamationCircleOutlined,
    ThunderboltOutlined, FlagOutlined, PlusOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

import TableSkeleton from '../components/common/TableSkeleton';
import FilePreviewModal from '../components/modals/FilePreviewModal';
import HistoryTab from '../components/projects/HistoryTab';
import MessagesTab from '../components/projects/MessagesTab';
import ProjectOverviewTab from '../components/projects/ProjectOverviewTab';
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
    documentsSent: boolean;
    pm: string;
    createdAt: string;
    updatedAt: string;
    creator?: { name: string };
    editor?: { name: string };
    positions: ProjectPosition[];
    access_token?: string | null;
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
}



const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [fileFilterTab, setFileFilterTab] = useState<'all' | 'source' | 'target'>('all');
    const [historySearch, setHistorySearch] = useState('');
    const [historySortKey, setHistorySortKey] = useState<'date' | 'user' | 'action'>('date');
    const [historySortDir, setHistorySortDir] = useState<'asc' | 'desc'>('asc');

    const {
        isPartnerModalOpen, setIsPartnerModalOpen,
        isEditModalOpen, setIsEditModalOpen,
        isUploadModalOpen, setIsUploadModalOpen,
        isInvoiceModalOpen, setIsInvoiceModalOpen,
        isPaymentModalOpen, setIsPaymentModalOpen,
        isCustomerSearchOpen, setIsCustomerSearchOpen,
        isCustomerEditModalOpen, setIsCustomerEditModalOpen,
        isPartnerEditModalOpen, setIsPartnerEditModalOpen,
        isProjectDeleteConfirmOpen, setIsProjectDeleteConfirmOpen,
        isInviteModalOpen, setIsInviteModalOpen,
        isInterpreterModalOpen, setIsInterpreterModalOpen,
        previewFile, setPreviewFile,
        deleteFileConfirm, setDeleteFileConfirm,
    } = useProjectModals();

    const [previewInvoice, setPreviewInvoice] = useState<any>(null);


    // Comprehensive Project State
    const [projectData, setProjectData] = useState<ProjectData | null>(null);

    const { data: projectResponse, isLoading, error } = useQuery({
        queryKey: ['projects', id],
        queryFn: () => projectService.getById(id!),
        enabled: !!id
    });



    useEffect(() => {
        if (projectResponse) {
            const mapped = mapProjectResponse(projectResponse) as ProjectData;
            setProjectData(mapped);
        }
    }, [projectResponse]);




    const getDeadlineStatus = () => {
        if (!projectData?.due) return { label: 'Kein Datum', color: 'bg-slate-50 text-slate-400 border-slate-100', icon: <ClockCircleOutlined /> };
        const today = new Date();
        const due = new Date(projectData.due);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { label: `${Math.abs(diffDays)} Tage überfällig`, color: 'bg-red-100 text-red-600 border-red-200', icon: <ExclamationCircleOutlined /> };
        } else if (diffDays === 0) {
            return { label: 'Heute fällig', color: 'bg-orange-100 text-orange-600 border-orange-200', icon: <ClockCircleOutlined /> };
        } else {
            return { label: `in ${diffDays} Tagen`, color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: <ClockCircleOutlined /> };
        }
    };

    // addWorkingDays kept for future use
    // const addWorkingDays = (days: number) => {
    // if (!projectData) return;
    // let date = new Date();
    // let added = 0;
    // while (added < days) {
    // date.setDate(date.getDate() + 1);
    // if (date.getDay() !== 0 && date.getDay() !== 6) added++;
    // }
    // updateProjectMutation.mutate({ deadline: date.toISOString().split('T')[0] });
    // };

    const getLanguageInfo = (code: string) => {
        if (!code) return { flagUrl: '', name: '-' };
        const cleanCode = code.split('-')[0].toLowerCase();

        return {
            flagUrl: getFlagUrl(code),
            name: getLanguageLabel(cleanCode)
        };
    };

    const updateProjectMutation = useMutation({
        mutationFn: (data: any) => projectService.update(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsEditModalOpen(false);
            toast.success('Projekt erfolgreich aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren des Projekts');
        }
    });

    const deleteProjectMutation = useMutation({
        mutationFn: (projectId: string) => projectService.delete(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success('Projekt erfolgreich gelöscht');
            navigate('/projects');
        },
        onError: () => {
            toast.error('Fehler beim Löschen des Projekts');
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

    // Mutation für Kunden-Update
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
            toast.success('Kundendaten erfolgreich aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren der Kundendaten');
        }
    });

    // Mutation für Partner-Update
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
            toast.success('Partnerdaten erfolgreich aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren der Partnerdaten');
        }
    });

    const handleEditSubmit = (updatedData: any) => {
        updateProjectMutation.mutate(updatedData);
    };


    const getStatusBadge = (status: string) => {
        const labels: { [key: string]: string } = {
            'draft': 'Entwurf',
            'offer': 'Angebot',
            'pending': 'Angebot',
            'in_progress': 'Bearbeitung',
            'review': 'Bearbeitung',
            'ready_for_pickup': 'Abholbereit',
            'delivered': 'Geliefert',
            'invoiced': 'Rechnung',
            'completed': 'Abgeschlossen',
            'cancelled': 'Storniert',
            'archived': 'Archiviert',
            'deleted': 'Gelöscht'
        };
        const colors: { [key: string]: string } = {
            'draft': 'default',
            'offer': 'warning',
            'pending': 'warning',
            'in_progress': 'processing',
            'review': 'processing',
            'ready_for_pickup': 'warning',
            'delivered': 'success',
            'invoiced': 'purple',
            'completed': 'success',
            'cancelled': 'default',
            'archived': 'default',
            'deleted': 'error'
        };

        return (
            <Tag color={colors[status] || 'default'} className="font-medium">
                {labels[status] || status}
            </Tag>
        );
    }



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
            toast.success('Dateien erfolgreich hochgeladen');
        },
        onError: () => {
            toast.error('Fehler beim Hochladen der Dateien');
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
            // Robust filename fallback, ensuring extension
            let fileName = file.name || file.fileName || file.original_name || 'download_file';
            const fileExt = file.extension || fileName.split('.').pop();

            if (!fileName.includes('.') && fileExt) {
                fileName = `${fileName}.${fileExt} `;
            }

            // Assuming downloadFile returns a response with blob data
            const response = await projectService.downloadFile(id!, file.id);

            // Basic mime checking if extension is still missing
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
            console.error('Download failed:', error);
            toast.error('Fehler beim Herunterladen der Datei.');
        }
    };

    const handlePreviewFile = async (file: any) => {
        try {
            const toastId = toast.loading('Lade Vorschau...');
            const response = await projectService.downloadFile(id!, file.id);

            // Guess mime type from header or fallback
            const mimeType = response.headers['content-type'];

            const blob = new Blob([response.data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);

            let fileName = file.name || file.fileName || 'file';

            // Ensure extension exists for modal detection logic
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
            setPreviewFile({
                name: fileName,
                url: url,
                type: file.type,
                id: file.id
            });
        } catch (error) {
            toast.dismiss();
            console.error('Preview error:', error);
            toast.error('Vorschau konnte nicht geladen werden.');
        }
    };

    const toggleFileType = async (file: any) => {
        try {
            const newType = file.type === 'source' ? 'target' : 'source';
            await projectService.updateFile(id!, file.id, { type: newType });

            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            toast.success(`Dateityp zu "${newType === 'source' ? 'Quelle' : 'Ziel'}" geändert`);
        } catch (error) {
            console.error('File update failed:', error);
            toast.error('Dateityp konnte nicht geändert werden');
        }
    };

    const deleteFileMutation = useMutation({
        mutationFn: async (fileId: string) => {
            await projectService.deleteFile(id!, fileId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            toast.success('Datei erfolgreich gelöscht');
        },
        onError: () => {
            toast.error('Fehler beim Löschen der Datei.');
        }
    });

    const handleFileUpload = async (newFiles: any[], onProgress: (id: string, p: number) => void) => {
        await uploadFileMutation.mutateAsync({ files: newFiles, onProgress });
    };

    const invoiceMutation = useMutation({
        mutationFn: invoiceService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            setIsInvoiceModalOpen(false);
            toast.success('Rechnung erstellt – Projektstatus auf „Abholbereit" gesetzt.');
            navigate('/invoices');
        },
        onError: () => {
            toast.error('Fehler beim Erstellen der Rechnung');
        }
    });


    const financials = useMemo(() => {
        if (!projectData) return {
            netTotal: 0,
            taxTotal: 0,
            grossTotal: 0,
            partnerTotal: 0,
            margin: 0,
            marginPercent: 0,
            paid: 0,
            open: 0,
            extraTotal: 0
        };

        const positions = projectData.positions || [];
        const payments = projectData.payments || [];

        // Extras Calculation
        const extraNet = (projectData.isCertified ? 5 : 0) +
            (projectData.hasApostille ? 15 : 0) +
            (projectData.isExpress ? 15 : 0) +
            (projectData.classification === 'ja' ? 15 : 0) +
            ((projectData.copies || 0) * (Number(projectData.copyPrice) || 5));

        // Positions Sum (Assuming Net from NewProjectModal logic)
        const positionsNet = positions.reduce((sum: number, pos: any) => sum + (parseFloat(pos.customerTotal) || 0), 0);

        const netTotal = positionsNet + extraNet;
        const taxTotal = netTotal * 0.19;
        const grossTotal = netTotal + taxTotal;

        // Calculate Partner Costs
        const partnerTotal = positions.reduce((sum: number, pos: any) => {
            const amount = parseFloat(pos.amount) || 0;
            const rate = parseFloat(pos.partnerRate) || 0;
            // If unit is Pauschal, amount is usually 1, so rate * amount works.
            return sum + (amount * rate);
        }, 0);

        const margin = netTotal - partnerTotal;
        const marginPercent = netTotal > 0 ? (margin / netTotal) * 100 : 0;

        const paid = payments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
        const open = grossTotal - paid;

        return {
            netTotal,
            taxTotal,
            grossTotal,
            partnerTotal,
            margin,
            marginPercent,
            paid,
            open,
            extraTotal: extraNet
        };
    }, [projectData]);

    if (isLoading) return <TableSkeleton rows={10} columns={5} />;
    if (error || !projectData) return <div className="p-10 text-center text-red-500">Fehler beim Laden des Projekts.</div>;

    const sourceLang = getLanguageInfo(projectData.source);
    const targetLang = getLanguageInfo(projectData.target);
    const deadlineStatus = getDeadlineStatus();

    const handleDownloadConfirmation = async (type: 'order_confirmation' | 'pickup_confirmation') => {
        try {
            const toastId = toast.loading('Dokument wird erstellt...');
            const response = await projectService.downloadConfirmation(id!, type);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            openBlobInNewTab(blob);
            toast.dismiss(toastId);
            toast.success('Dokument geöffnet');
        } catch (error) {
            console.error('Download error:', error);
            toast.dismiss();
            toast.error('Dokument konnte nicht geladen werden.');
        }
    };

    const moreActionsItems: MenuProps['items'] = [
        { key: 'pdf_header', type: 'group', label: 'PDF Dokumente' },
        { key: 'order_confirmation', label: 'Auftragsbestätigung', icon: <FilePdfOutlined className="text-red-500" />, onClick: () => handleDownloadConfirmation('order_confirmation') },
        { key: 'pickup_confirmation', label: 'Abholbestätigung', icon: <FilePdfOutlined className="text-red-500" />, onClick: () => handleDownloadConfirmation('pickup_confirmation') },
        { key: 'interpreter_confirmation', label: 'Dolmetscherbestätigung', icon: <FilePdfOutlined className="text-red-500" />, onClick: () => setIsInterpreterModalOpen(true) },
        { key: 'invoice_sep', type: 'divider' },
        { key: 'invoice_header', type: 'group', label: 'Abrechnung' },
        ...(projectData.invoices?.filter((inv: any) => !['cancelled'].includes(inv.status)).map((inv: any) => ({
            key: `inv_${inv.id}`,
            label: `${inv.invoice_number} öffnen`,
            icon: <FileTextOutlined className="text-emerald-500" />,
            onClick: () => setPreviewInvoice(inv)
        })) || []),
        {
            key: 'new_invoice',
            label: 'Rechnung erstellen',
            icon: <PlusOutlined className="text-slate-400" />,
            onClick: () => setIsInvoiceModalOpen(true)
        }
    ];

    return (
        <div className="flex flex-col fade-in min-h-screen">
            {/* Project Header Container */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-[1600px] mx-auto px-8 py-4">
                    <div className="flex justify-between items-start gap-6">
                        <div className="flex items-center gap-6 min-w-0">
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/projects')}
                                className="border-none shadow-none hover:bg-slate-100 h-10 w-10 flex items-center justify-center shrink-0"
                            />

                            <div className="min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Title level={4} style={{ margin: 0 }} className="truncate max-w-lg">{projectData.name}</Title>
                                    {projectData.priority !== 'low' && (
                                        <Tag
                                            color={projectData.priority === 'express' ? 'red' : 'orange'}
                                            icon={projectData.priority === 'express' ? <ThunderboltOutlined /> : <FlagOutlined />}
                                            className="font-bold border-none"
                                        >
                                            {projectData.priority === 'express' ? 'Express' : 'Dringend'}
                                        </Tag>
                                    )}
                                    {getStatusBadge(projectData.status)}
                                </div>
                                <div className="flex items-center gap-4 text-xs mt-1.5 font-medium">
                                    <Text type="secondary">ID: <Text strong className="text-slate-700">{projectData.id}</Text></Text>
                                    <Text type="secondary" className="hidden sm:inline">•</Text>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                        <Text type="secondary">Erstellt am {projectData.createdAt}</Text>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Space size="small">
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => setIsEditModalOpen(true)}
                                className="skeuo-button"
                            >
                                Bearbeiten
                            </Button>
                            <Button
                                icon={<DeleteOutlined />}
                                onClick={() => setIsProjectDeleteConfirmOpen(true)}
                                danger
                            >
                                Löschen
                            </Button>
                            <Button
                                type="primary"
                                icon={<MailOutlined />}
                                onClick={() => navigate('/inbox', { state: { openCompose: true, projectId: String(projectData.id) } })}
                                className="skeuo-button"
                            >
                                E-Mail
                            </Button>
                            <Dropdown menu={{ items: moreActionsItems }} placement="bottomRight">
                                <Button icon={<MoreOutlined />} />
                            </Dropdown>
                        </Space>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="max-w-[1600px] mx-auto px-8">
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        className="project-detail-tabs"
                        tabBarGutter={32}
                        items={[
                            { key: 'overview', label: 'Stammdaten' },
                            { key: 'files', label: `Dateien (${projectData.files?.length || 0})` },
                            { key: 'finances', label: 'Kalkulation & Marge' },
                            { key: 'messages', label: `Kommunikation (${projectData.messages?.length || 0})` },
                            { key: 'history', label: 'Historie' },
                        ]}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-8 transition-all duration-300">
                {activeTab === 'overview' && (
                    <ProjectOverviewTab
                        projectData={projectData}
                        sourceLang={sourceLang}
                        targetLang={targetLang}
                        deadlineStatus={deadlineStatus}
                        getStatusBadge={getStatusBadge}
                        navigate={navigate}
                        locationPathname={location.pathname}
                        setIsCustomerSearchOpen={setIsCustomerSearchOpen}
                        setIsPartnerModalOpen={setIsPartnerModalOpen}
                        updateProjectMutation={updateProjectMutation}
                    />
                )}

                {activeTab === 'files' && (
                    <ProjectFilesTab
                        projectData={projectData}
                        fileFilterTab={fileFilterTab}
                        setFileFilterTab={setFileFilterTab}
                        setIsUploadModalOpen={setIsUploadModalOpen}
                        handlePreviewFile={handlePreviewFile}
                        handleDownloadFile={handleDownloadFile}
                        setDeleteFileConfirm={setDeleteFileConfirm}
                        toggleFileType={toggleFileType}
                        formatFileSize={formatFileSize}
                    />
                )}

                {activeTab === 'finances' && (
                    <ProjectFinancesTab
                        projectData={projectData}
                        onSavePositions={(positions) => updateProjectMutation.mutate({ positions })}
                        onRecordPayment={() => setIsPaymentModalOpen(true)}
                        onCreateInvoice={() => setIsInvoiceModalOpen(true)}
                        onGoToInvoice={() => {
                            const activeInvoice = projectData.invoices?.find(inv => !['cancelled'].includes(inv.status));
                            if (activeInvoice) setPreviewInvoice(activeInvoice);
                        }}
                        isPendingSave={updateProjectMutation.isPending}
                    />
                )}

                {activeTab === 'messages' && (
                    <div className="mb-10 animate-fadeIn">
                        <MessagesTab projectData={projectData} projectId={id!} />
                    </div>
                )}

                {activeTab === 'history' && (
                    <HistoryTab
                        projectId={id!}
                        historySearch={historySearch}
                        setHistorySearch={setHistorySearch}
                        historySortKey={historySortKey}
                        setHistorySortKey={setHistorySortKey}
                        historySortDir={historySortDir}
                        setHistorySortDir={setHistorySortDir}
                    />
                )}
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
            <NewProjectModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSubmit={handleEditSubmit} initialData={projectData} />
            <FileUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleFileUpload} />
            <NewInvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} onSubmit={(data) => invoiceMutation.mutate(data)} project={{ ...projectData, financials }} isLoading={invoiceMutation.isPending} />
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSave={(payment) => {
                    const newPayments = [...(projectData?.payments || []), payment];
                    if (projectData) {
                        setProjectData({ ...projectData, payments: newPayments });
                        updateProjectMutation.mutate({ payments: newPayments });
                    }
                }}
                totalAmount={financials.grossTotal}
            />

            <NewCustomerModal
                isOpen={isCustomerEditModalOpen}
                onClose={() => setIsCustomerEditModalOpen(false)}
                onSubmit={(data) => updateCustomerMutation.mutate(data)}
                initialData={projectResponse?.customer}
            />

            <NewPartnerModal
                isOpen={isPartnerEditModalOpen}
                onClose={() => setIsPartnerEditModalOpen(false)}
                onSubmit={(data) => updatePartnerMutation.mutate(data)}
                initialData={projectResponse?.partner}
                isLoading={updatePartnerMutation.isPending}
            />
            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => {
                    if (previewFile?.url) window.URL.revokeObjectURL(previewFile.url);
                    setPreviewFile(null);
                }}
                file={previewFile}
                onDownload={() => previewFile?.id && handleDownloadFile({ name: previewFile.name, id: previewFile.id })}
            />
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
                confirmText="Löschen"
                cancelText="Abbrechen"
                isLoading={deleteFileMutation.isPending}
            />
            <ConfirmModal
                isOpen={isProjectDeleteConfirmOpen}
                onClose={() => setIsProjectDeleteConfirmOpen(false)}
                onConfirm={() => deleteProjectMutation.mutate(id!)}
                title="Projekt löschen"
                message={`Möchten Sie das Projekt "${projectData.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
                confirmText="Löschen"
                cancelText="Abbrechen"
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
            />
        </div>
    );
};

export default ProjectDetail;
