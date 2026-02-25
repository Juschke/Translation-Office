import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { mailService, projectService, customerService, partnerService } from '../api/services';
import { useEmailCompose } from '../hooks/useEmailCompose';
import MailTabButton from '../components/inbox/MailTabButton';
import MailListPanel from '../components/inbox/MailListPanel';
import MailDetailPanel from '../components/inbox/MailDetailPanel';
import MailResourceTable from '../components/inbox/MailResourceTable';
import SearchableSelect from '../components/common/SearchableSelect';
import {
    FaPaperPlane, FaTimes, FaPaperclip, FaPlus,
    FaFileAlt, FaUserCircle, FaEye, FaTrashAlt,
    FaFolderOpen, FaCode, FaCloudUploadAlt,
    FaProjectDiagram, FaSearchPlus, FaCheckCircle
} from 'react-icons/fa';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import NewEmailAccountModal from '../components/modals/NewEmailAccountModal';
import NewEmailTemplateModal from '../components/modals/NewEmailTemplateModal';
import {
    TooltipProvider,
} from "../components/ui/tooltip";
import {
    Badge,
    ScrollArea,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
    Button
} from "../components/ui";
import ConfirmModal from '../components/common/ConfirmModal';
import { BulkActions } from '../components/common/BulkActions';
import Checkbox from '../components/common/Checkbox';

const ALL_VARIABLES: { key: string; label: string; desc: string; group: string }[] = [
    // Kunde
    { key: 'customer_name', label: 'Kundenname', desc: 'Firmen- oder Vollname des Kunden', group: 'Kunde' },
    { key: 'contact_person', label: 'Ansprechpartner', desc: 'Kontaktperson beim Kunden', group: 'Kunde' },
    { key: 'customer_email', label: 'Kunden-E-Mail', desc: 'E-Mail-Adresse des Kunden', group: 'Kunde' },
    { key: 'customer_phone', label: 'Telefon', desc: 'Telefonnummer des Kunden', group: 'Kunde' },
    { key: 'customer_address', label: 'Adresse', desc: 'Straße und Hausnummer', group: 'Kunde' },
    { key: 'customer_city', label: 'Stadt', desc: 'Stadt des Kunden', group: 'Kunde' },
    { key: 'customer_zip', label: 'PLZ', desc: 'Postleitzahl des Kunden', group: 'Kunde' },
    // Projekt
    { key: 'project_number', label: 'Projektnummer', desc: 'Eindeutige Projektnummer', group: 'Projekt' },
    { key: 'project_name', label: 'Projektname', desc: 'Bezeichnung des Projekts', group: 'Projekt' },
    { key: 'project_status', label: 'Status', desc: 'Aktueller Projektstatus', group: 'Projekt' },
    { key: 'source_language', label: 'Ausgangssprache', desc: 'Ausgangssprache des Dokuments', group: 'Projekt' },
    { key: 'target_language', label: 'Zielsprache', desc: 'Zielsprache des Dokuments', group: 'Projekt' },
    { key: 'project_languages', label: 'Sprachpaar', desc: 'Ausgangs- und Zielsprache kombiniert', group: 'Projekt' },
    { key: 'deadline', label: 'Deadline', desc: 'Abgabetermin des Projekts', group: 'Projekt' },
    { key: 'document_type', label: 'Dokumentenart', desc: 'Art des zu übersetzenden Dokuments', group: 'Projekt' },
    { key: 'priority', label: 'Priorität', desc: 'Projektpriorität (Standard / Express)', group: 'Projekt' },
    // Finanzen
    { key: 'price_net', label: 'Betrag (Netto)', desc: 'Netto-Projektbetrag', group: 'Finanzen' },
    { key: 'price_gross', label: 'Betrag (Brutto)', desc: 'Brutto-Betrag inkl. MwSt.', group: 'Finanzen' },
    { key: 'payment_terms', label: 'Zahlungsziel', desc: 'Zahlungsfrist in Tagen', group: 'Finanzen' },
    { key: 'invoice_number', label: 'Rechnungsnummer', desc: 'Nummer der Projektrechnung', group: 'Finanzen' },
    { key: 'invoice_date', label: 'Rechnungsdatum', desc: 'Datum der Rechnungstellung', group: 'Finanzen' },
    { key: 'due_date', label: 'Fälligkeitsdatum', desc: 'Fälligkeitsdatum der Rechnung', group: 'Finanzen' },
    // Partner
    { key: 'partner_name', label: 'Partnername', desc: 'Name des Übersetzers / Partners', group: 'Partner' },
    { key: 'partner_email', label: 'Partner-E-Mail', desc: 'E-Mail-Adresse des Partners', group: 'Partner' },
    // Unternehmen
    { key: 'company_name', label: 'Firmenname', desc: 'Name Ihres Unternehmens', group: 'Unternehmen' },
    { key: 'company_address', label: 'Firmenadresse', desc: 'Adresse Ihres Unternehmens', group: 'Unternehmen' },
    { key: 'company_phone', label: 'Telefon (Firma)', desc: 'Telefonnummer Ihres Unternehmens', group: 'Unternehmen' },
    { key: 'company_email', label: 'E-Mail (Firma)', desc: 'E-Mail-Adresse Ihres Unternehmens', group: 'Unternehmen' },
    { key: 'company_website', label: 'Website', desc: 'Website Ihres Unternehmens', group: 'Unternehmen' },
    { key: 'managing_director', label: 'Geschäftsleitung', desc: 'Name der Geschäftsführung', group: 'Unternehmen' },
    { key: 'vat_id', label: 'USt-IdNr.', desc: 'Umsatzsteuer-Identifikationsnummer', group: 'Unternehmen' },
    { key: 'tax_id', label: 'Steuernummer', desc: 'Steuernummer des Unternehmens', group: 'Unternehmen' },
    { key: 'bank_name', label: 'Bankname', desc: 'Name Ihrer Bank', group: 'Unternehmen' },
    { key: 'bank_iban', label: 'IBAN', desc: 'IBAN Ihres Bankkontos', group: 'Unternehmen' },
    { key: 'bank_bic', label: 'BIC', desc: 'BIC Ihrer Bank', group: 'Unternehmen' },
    { key: 'bank_holder', label: 'Kontoinhaber', desc: 'Name des Kontoinhabers', group: 'Unternehmen' },
    // Allgemein
    { key: 'date', label: 'Aktuelles Datum', desc: 'Heutiges Datum', group: 'Allgemein' },
    { key: 'sender_name', label: 'Absender', desc: 'Name des Sachbearbeiters', group: 'Allgemein' },
];

const VAR_GROUPS = ['Kunde', 'Projekt', 'Finanzen', 'Partner', 'Unternehmen', 'Allgemein'];

const CommunicationHub = () => {
    const queryClient = useQueryClient();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState('inbox');
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState<any>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<any>(null);
    const [viewingMail, setViewingMail] = useState<any>(null);

    // Selection state
    const [selectedMails, setSelectedMails] = useState<number[]>([]);

    // Deletion state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [mailToDelete, setMailToDelete] = useState<number | null>(null);
    const [deleteType, setDeleteType] = useState<'single' | 'bulk'>('single');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const varPickerRef = useRef<HTMLDivElement>(null);
    const [isVarPickerOpen, setIsVarPickerOpen] = useState(false);
    const [varSearch, setVarSearch] = useState('');

    const {
        isComposeOpen, setIsComposeOpen,
        composeTo, setComposeTo,
        composeSubject, setComposeSubject,
        composeBody, setComposeBody,
        composeAttachments, setComposeAttachments,
        isComposePreview, setIsComposePreview,
        selectedProjectId, setSelectedProjectId,
        selectedCustomerId,
        isDragOver, setIsDragOver,
        isProjectFilesModalOpen, setIsProjectFilesModalOpen,
        showToSuggestions, setShowToSuggestions,
        suggestionIndex, setSuggestionIndex,
        sendMutation,
        resetCompose,
        handleReply,
        handleForward,
        handleApplyTemplate,
        handleFileChange,
        removeAttachment,
    } = useEmailCompose();

    const { data: inboxMessages = [], isLoading: isLoadingInbox } = useQuery({
        queryKey: ['mails', 'inbox'],
        queryFn: () => mailService.getAll('inbox')
    });

    const { data: sentMessages = [], isLoading: isLoadingSent } = useQuery({
        queryKey: ['mails', 'sent'],
        queryFn: () => mailService.getAll('sent')
    });

    const { data: trashMessages = [], isLoading: _isLoadingTrash } = useQuery({
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

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll()
    });

    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getAll
    });

    const { data: partners = [] } = useQuery({
        queryKey: ['partners'],
        queryFn: partnerService.getAll
    });

    const { data: projectDetails } = useQuery({
        queryKey: ['projects', selectedProjectId],
        queryFn: () => selectedProjectId ? projectService.getById(selectedProjectId) : null,
        enabled: !!selectedProjectId
    });

    const { data: customerDetails } = useQuery({
        queryKey: ['customers', selectedCustomerId],
        queryFn: () => selectedCustomerId ? customerService.getById(parseInt(selectedCustomerId)) : null,
        enabled: !!selectedCustomerId && !selectedProjectId
    });

    const contactSuggestions = useMemo(() => {
        const list: any[] = [];
        customers.forEach((c: any) => {
            if (c.email) list.push({ label: `${c.company_name || (c.first_name + ' ' + c.last_name)}`, value: c.email, type: 'Kunde' });
            if (Array.isArray(c.additional_emails)) {
                c.additional_emails.forEach((e: string) => list.push({ label: `${c.company_name || (c.first_name + ' ' + c.last_name)}`, value: e, type: 'Kunde (Alt)' }));
            }
        });
        partners.forEach((p: any) => {
            if (p.email) list.push({ label: `${p.company || (p.first_name + ' ' + p.last_name)}`, value: p.email, type: 'Partner' });
        });
        // Remove duplicates
        const unique = Array.from(new Set(list.map(s => s.value))).map(email => list.find(s => s.value === email));
        return unique;
    }, [customers, partners]);

    const filteredToSuggestions = useMemo(() => {
        if (!composeTo || !showToSuggestions) return [];
        const search = composeTo.toLowerCase();
        return contactSuggestions.filter(s =>
            s.label.toLowerCase().includes(search) ||
            s.value.toLowerCase().includes(search)
        ).slice(0, 10);
    }, [contactSuggestions, composeTo, showToSuggestions]);

    useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts.find((a: any) => a.is_default) || accounts[0]);
        }
    }, [accounts]);

    // Close variable picker on outside click
    useEffect(() => {
        if (!isVarPickerOpen) return;
        const handler = (e: MouseEvent) => {
            if (varPickerRef.current && !varPickerRef.current.contains(e.target as Node)) {
                setIsVarPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isVarPickerOpen]);

    // Auto-open compose when navigated from ProjectDetail with openCompose state
    useEffect(() => {
        if (location.state?.openCompose) {
            setIsComposeOpen(true);
            if (location.state.projectId) {
                setSelectedProjectId(location.state.projectId);
            }
            // Clear the navigation state so re-renders don't re-trigger
            window.history.replaceState({}, '');
        }
    }, []);

    const handleAddProjectFiles = async (filesToAttach: any[]) => {
        const toastId = toast.loading('Projekt-Dateien werden vorbereitet...');
        try {
            const newAttachments: File[] = [];
            for (const file of filesToAttach) {
                const response = await projectService.downloadFile(selectedProjectId!, file.id);
                // The API returns a blob in response.data
                const blob = response.data;
                const fileName = file.fileName || file.file_name || file.name || 'projekt_datei';
                const f = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
                newAttachments.push(f);
            }
            setComposeAttachments(prev => [...prev, ...newAttachments]);
            toast.success(`${filesToAttach.length} Datei(en) erfolgreich angehängt`, { id: toastId });
            setIsProjectFilesModalOpen(false);
        } catch (error) {
            console.error('Project file attachment error:', error);
            toast.error('Fehler beim Abrufen der Projekt-Dateien', { id: toastId });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    const syncMutation = useMutation({
        mutationFn: mailService.sync,
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            toast.success(data.message || 'Postfach synchronisiert');
        },
        onError: (error: any) => {
            toast.error('Synchronisierung fehlgeschlagen: ' + (error.response?.data?.message || 'Unbekannter Fehler'));
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id: number) => mailService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
        }
    });

    // Wrapper: schließt die Mail-Detail-Ansicht bevor der Hook den Compose-State setzt
    const handleReplyWithClose = (mail: any) => {
        setViewingMail(null);
        handleReply(mail);
    };

    const handleForwardWithClose = (mail: any) => {
        setViewingMail(null);
        handleForward(mail);
    };

    const handleViewMail = (mail: any) => {
        setViewingMail(mail);
        if (!mail.read && activeTab === 'inbox') {
            markAsReadMutation.mutate(mail.id);
        }
    };

    const getPreviewHtml = (html: string) => {
        if (!html) return '';

        const data = projectDetails || (customerDetails ? {
            customer: {
                company_name: customerDetails.company_name || '',
                first_name: customerDetails.first_name || '',
                last_name: customerDetails.last_name || '',
                name: customerDetails.company_name || `${customerDetails.first_name || ''} ${customerDetails.last_name || ''}`.trim(),
                contact_person: customerDetails.contact_person || `${customerDetails.first_name || ''} ${customerDetails.last_name || ''}`.trim(),
                email: customerDetails.email || '',
                phone: customerDetails.phone || '',
                address_street: customerDetails.address_street || '',
                address_house_no: customerDetails.address_house_no || '',
                address_zip: customerDetails.address_zip || '',
                address_city: customerDetails.address_city || '',
                payment_terms_days: customerDetails.payment_terms_days || 14
            },
            project_number: 'N/A',
            project_name: 'Kein Projekt ausgewählt',
            status: 'N/A',
            source_language: { name: 'N/A' },
            target_language: { name: 'N/A' },
            deadline: null,
            document_type: { name: 'N/A' },
            priority: 'N/A',
            price_total: '0.00'
        } : {
            customer: {
                name: 'Musterfirma GmbH',
                contact_person: 'Max Mustermann',
                email: 'kunde@beispiel.de',
                phone: '+49 123 456789',
                address_street: 'Musterstraße',
                address_house_no: '1',
                address_zip: '12345',
                address_city: 'Musterstadt',
                payment_terms_days: 14
            },
            project_number: 'PRJ-XXXX-XXXX',
            project_name: 'Beispiel Projekt',
            status: 'draft',
            source_language: { name: 'Deutsch' },
            target_language: { name: 'Englisch' },
            deadline: 'DD.MM.YYYY',
            document_type: { name: 'Urkunde' },
            priority: 'medium',
            price_total: '0.00',
            partner: {
                company: 'Partner Übersetzungen',
                name: 'Paul Partner',
                email: 'partner@beispiel.de'
            }
        });

        const statusLabels: { [key: string]: string } = {
            'draft': 'Entwurf',
            'offer': 'Angebot',
            'pending': 'Angebot',
            'in_progress': 'Bearbeitung',
            'review': 'Bearbeitung',
            'ready_for_pickup': 'Abholbereit',
            'delivered': 'Geliefert',
            'invoiced': 'Rechnung',
            'completed': 'Abgeschlossen',
            'cancelled': 'Storniert'
        };

        const priorityLabels: { [key: string]: string } = {
            'low': 'Niedrig',
            'medium': 'Normal',
            'high': 'Hoch'
        };

        const custName = data.customer?.company_name || data.customer?.name || 'Musterfirma GmbH';
        const contact = data.customer?.contact_person || (data.customer?.first_name ? `${data.customer.first_name} ${data.customer.last_name}` : 'Max Mustermann');

        const netAmount = parseFloat(data.price_total || data.total_amount || '0');
        const grossAmount = netAmount * 1.19;

        return html
            // Kunde
            .replace(/{{customer_name}}|{customer_name}/g, custName)
            .replace(/{{contact_person}}|{contact_person}/g, contact)
            .replace(/{{customer_email}}|{customer_email}/g, data.customer?.email || '')
            .replace(/{{customer_phone}}|{customer_phone}/g, data.customer?.phone || '')
            .replace(/{{customer_address}}|{customer_address}/g, `${data.customer?.address_street || ''} ${data.customer?.address_house_no || ''}`.trim() || 'Musterstraße 1')
            .replace(/{{customer_zip}}|{customer_zip}/g, data.customer?.address_zip || '')
            .replace(/{{customer_city}}|{customer_city}/g, data.customer?.address_city || '')

            // Projekt
            .replace(/{{project_number}}|{project_number}/g, data.project_number || 'PRJ-XXXX-XXXX')
            .replace(/{{project_name}}|{project_name}/g, data.project_name || data.name || 'Beispiel Projekt')
            .replace(/{{project_status}}|{project_status}/g, statusLabels[data.status] || data.status || 'Entwurf')
            .replace(/{{source_language}}|{source_language}/g, data.source_language?.name || 'Deutsch')
            .replace(/{{target_language}}|{target_language}/g, data.target_language?.name || 'Englisch')
            .replace(/{{project_languages}}|{project_languages}/g, data.source_language?.name && data.target_language?.name ? `${data.source_language.name} → ${data.target_language.name}` : 'Deutsch → Englisch')
            .replace(/{{deadline}}|{deadline}/g, data.deadline ? new Date(data.deadline).toLocaleDateString('de-DE') : 'DD.MM.YYYY')
            .replace(/{{document_type}}|{document_type}/g, data.document_type?.name || data.doc_type || 'Übersetzung')
            .replace(/{{priority}}|{priority}/g, priorityLabels[data.priority] || data.priority || 'Normal')

            // Finanzen
            .replace(/{{price_net}}|{price_net}/g, `${netAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`)
            .replace(/{{price_gross}}|{price_gross}/g, `${grossAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`)
            .replace(/{{payment_terms}}|{payment_terms}/g, `${data.customer?.payment_terms_days || 14} Tage`)
            .replace(/{{invoice_number}}|{invoice_number}/g, data.invoices?.[0]?.invoice_number || 'RE-2024-001')
            .replace(/{{invoice_date}}|{invoice_date}/g, data.invoices?.[0]?.date ? new Date(data.invoices[0].date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE'))
            .replace(/{{due_date}}|{due_date}/g, data.invoices?.[0]?.due_date ? new Date(data.invoices[0].due_date).toLocaleDateString('de-DE') : new Date(Date.now() + 14 * 86400000).toLocaleDateString('de-DE'))

            // Partner
            .replace(/{{partner_name}}|{partner_name}/g, data.partner?.company || data.partner?.name || 'Partner GmbH')
            .replace(/{{partner_email}}|{partner_email}/g, data.partner?.email || '')

            // Unternehmen
            .replace(/{{company_name}}|{company_name}/g, 'Translation Office')
            .replace(/{{company_address}}|{company_address}/g, 'Musterstraße 123, 12345 Musterstadt')
            .replace(/{{company_phone}}|{company_phone}/g, '+49 123 456789-0')
            .replace(/{{company_email}}|{company_email}/g, 'info@translation-office.de')
            .replace(/{{company_website}}|{company_website}/g, 'www.translation-office.de')
            .replace(/{{managing_director}}|{managing_director}/g, 'Jane Doe')
            .replace(/{{vat_id}}|{vat_id}/g, 'DE 123 456 789')
            .replace(/{{tax_id}}|{tax_id}/g, '12/345/67890')
            .replace(/{{bank_name}}|{bank_name}/g, 'Musterbank AG')
            .replace(/{{bank_iban}}|{bank_iban}/g, 'DE12 3456 7890 1234 5678 90')
            .replace(/{{bank_bic}}|{bank_bic}/g, 'MUSBDEFFXXX')
            .replace(/{{bank_holder}}|{bank_holder}/g, 'Translation Office GmbH')

            // Allgemein
            .replace(/{{date}}|{date}/g, new Date().toLocaleDateString('de-DE'))
            .replace(/{{sender_name}}|{sender_name}/g, 'Ihre Administration');
    };

    const createAccountMutation = useMutation({
        mutationFn: mailService.createAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] });
            setIsAccountModalOpen(false);
            toast.success('Konto erstellt');
        },
        onError: () => toast.error('Fehler beim Erstellen des Kontos')
    });

    const updateAccountMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => mailService.updateAccount(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] });
            setIsAccountModalOpen(false);
            toast.success('Konto aktualisiert');
        },
        onError: () => toast.error('Fehler beim Aktualisieren des Kontos')
    });

    const deleteAccountMutation = useMutation({
        mutationFn: mailService.deleteAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] });
            toast.success('Konto gelöscht');
        },
        onError: () => toast.error('Fehler beim Löschen des Kontos')
    });

    const createTemplateMutation = useMutation({
        mutationFn: mailService.createTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] });
            setIsTemplateModalOpen(false);
            toast.success('Vorlage erstellt');
        },
        onError: () => toast.error('Fehler beim Erstellen der Vorlage')
    });

    const updateTemplateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => mailService.updateTemplate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] });
            setIsTemplateModalOpen(false);
            toast.success('Vorlage aktualisiert');
        },
        onError: () => toast.error('Fehler beim Aktualisieren der Vorlage')
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: mailService.deleteTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] });
            toast.success('Vorlage gelöscht');
        },
        onError: () => toast.error('Fehler beim Löschen der Vorlage')
    });

    if (isLoadingInbox || isLoadingSent) return <div className="p-10 text-center font-medium text-slate-400 flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <span>Lade E-Mails...</span>
    </div>;

    return (
        <div className="flex flex-col h-full gap-0 fade-in bg-white border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-200 gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold text-slate-800er truncate">Email Management</h1>
                    <p className="text-slate-400 text-xs font-medium hidden sm:block">Zentrale Verwaltung</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending}
                        className="px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-[3px] border border-[#ccc] bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_1px_rgba(0,0,0,0.08)] hover:border-[#adadad] hover:text-[#1B4D4F] active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.1)] transition disabled:opacity-50 flex items-center gap-2"
                    >
                        <span className="hidden xs:inline">{syncMutation.isPending ? 'Synchronisiert...' : 'E-Mails abrufen'}</span>
                        <span className="xs:hidden">{syncMutation.isPending ? 'Sync...' : 'Abrufen'}</span>
                    </button>
                    <button
                        onClick={() => setIsComposeOpen(true)}
                        className="px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-[3px] border border-[#123a3c] bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_1px_rgba(0,0,0,0.12)] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] hover:from-[#2a7073] hover:to-[#235e62] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] transition flex items-center gap-2"
                    >
                        <FaPlus className="text-[10px]" /> <span className="hidden xs:inline">E-Mail schreiben</span><span className="xs:hidden">E-Mail</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-16 md:w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
                    <nav className="flex-1 flex flex-col p-2 space-y-4">
                        <TooltipProvider delayDuration={0}>
                            <div className="space-y-1">
                                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 hidden md:block">
                                    E-Mails
                                </div>
                                <MailTabButton
                                    active={activeTab === 'inbox'}
                                    onClick={() => setActiveTab('inbox')}
                                    icon={<FaFolderOpen />}
                                    label="Posteingang"
                                />
                                <MailTabButton
                                    active={activeTab === 'sent'}
                                    onClick={() => setActiveTab('sent')}
                                    icon={<FaPaperPlane />}
                                    label="Gesendet"
                                />
                                <MailTabButton
                                    active={activeTab === 'trash'}
                                    onClick={() => setActiveTab('trash')}
                                    icon={<FaTrashAlt />}
                                    label="Papierkorb"
                                />
                            </div>

                            <div className="space-y-1 mt-auto!">
                                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 hidden md:block">
                                    Verwaltung
                                </div>
                                <MailTabButton
                                    active={activeTab === 'templates'}
                                    onClick={() => setActiveTab('templates')}
                                    icon={<FaFileAlt />}
                                    label="Vorlagen"
                                />
                                <MailTabButton
                                    active={activeTab === 'accounts'}
                                    onClick={() => setActiveTab('accounts')}
                                    icon={<FaUserCircle />}
                                    label="Konten"
                                />
                            </div>
                        </TooltipProvider>
                    </nav>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-white">
                    {['inbox', 'sent', 'trash'].includes(activeTab) && (
                        <div className="flex-1 flex min-h-0 overflow-hidden">
                            {/* Email List Sidebar */}
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
                                                    label: activeTab === 'trash' ? 'Endgültig löschen' : 'In den Papierkorb',
                                                    icon: <FaTrashAlt className="text-xs" />,
                                                    onClick: () => {
                                                        setDeleteType('bulk');
                                                        setIsConfirmOpen(true);
                                                    },
                                                    variant: 'danger',
                                                    show: true
                                                }
                                            ]}
                                        />
                                    </div>
                                )}
                                <MailListPanel
                                    mails={activeTab === 'inbox' ? inboxMessages : activeTab === 'sent' ? sentMessages : trashMessages}
                                    folder={activeTab}
                                    onView={handleViewMail}
                                    selectedId={viewingMail?.id}
                                    selectedMails={selectedMails}
                                    onSelectMail={(id) => {
                                        setSelectedMails(prev =>
                                            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
                                        );
                                    }}
                                    onSelectAll={() => {
                                        const currentMails = activeTab === 'inbox' ? inboxMessages : activeTab === 'sent' ? sentMessages : trashMessages;
                                        if (selectedMails.length === currentMails.length) {
                                            setSelectedMails([]);
                                        } else {
                                            setSelectedMails(currentMails.map((m: any) => m.id));
                                        }
                                    }}
                                    onDelete={(id: number) => {
                                        setMailToDelete(id);
                                        setDeleteType('single');
                                        setIsConfirmOpen(true);
                                    }}
                                />
                            </div>

                            {/* Email Content Detail View */}
                            {viewingMail && (
                                <div className="flex-1 flex flex-col min-w-0 bg-white">
                                    <MailDetailPanel
                                        mail={viewingMail}
                                        onClose={() => setViewingMail(null)}
                                        onReply={handleReplyWithClose}
                                        onForward={handleForwardWithClose}
                                        onDelete={(id: any) => {
                                            setMailToDelete(id);
                                            setDeleteType('single');
                                            setIsConfirmOpen(true);
                                        }}
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
                                addLabel="Vorlage erstellen"
                                onAdd={() => {
                                    setTemplateToEdit(null);
                                    setIsTemplateModalOpen(true);
                                }}
                                onEdit={(tpl: any) => {
                                    setTemplateToEdit(tpl);
                                    setIsTemplateModalOpen(true);
                                }}
                                onDelete={(tpl: any) => {
                                    if (window.confirm('Vorlage wirklich löschen?')) {
                                        deleteTemplateMutation.mutate(tpl.id);
                                    }
                                }}
                                renderRow={(tpl: any) => (
                                    <>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-800">{tpl.name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{tpl.subject}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-slate-100 text-xs font-semibold">{tpl.type || 'Allgemein'}</span>
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
                                addLabel="Konto hinzufügen"
                                onAdd={() => {
                                    setAccountToEdit(null);
                                    setIsAccountModalOpen(true);
                                }}
                                onEdit={(acc: any) => {
                                    setAccountToEdit(acc);
                                    setIsAccountModalOpen(true);
                                }}
                                onDelete={(acc: any) => {
                                    if (window.confirm('Konto wirklich löschen?')) {
                                        deleteAccountMutation.mutate(acc.id);
                                    }
                                }}
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


            <Dialog open={isComposeOpen} onOpenChange={(open) => !open && setIsComposeOpen(false)}>
                <DialogContent hideClose className="max-w-[1200px] w-[95vw] h-[90vh] p-0 flex flex-col gap-0 overflow-hidden border-none shadow-2xl rounded-sm">
                    {/* Minimal Header */}
                    <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-100">
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
                                <FaPaperPlane className="text-slate-400 text-xs" />
                                NEUE NACHRICHT
                            </h3>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none mt-1">
                                Gesendet via: <span className="font-bold text-slate-600">{selectedAccount?.email}</span>
                            </span>
                        </div>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                                <FaTimes />
                            </Button>
                        </DialogClose>
                    </div>

                    <div className="flex-1 flex overflow-hidden bg-white">
                        {/* Main Editor Area */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <ScrollArea className="flex-1">
                                <div className="p-8 pb-32 space-y-1">
                                    {/* Sender Field */}
                                    <div className="flex items-center gap-4 py-2 border-b border-slate-100 group focus-within:border-[#1B4D4F]/30 transition-colors">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 group-focus-within:text-[#1B4D4F] transition-colors">VON</span>
                                        <select
                                            value={selectedAccount?.id}
                                            onChange={(e) => setSelectedAccount(accounts.find((a: any) => a.id === parseInt(e.target.value)))}
                                            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer appearance-none py-1 focus:outline-none"
                                        >
                                            {accounts.map((acc: any) => (
                                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.email})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Recipient Field */}
                                    <div className="flex items-start gap-4 py-2 border-b border-slate-100 group focus-within:border-[#1B4D4F]/30 transition-colors z-50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 group-focus-within:text-[#1B4D4F] transition-colors pt-1.5 shrink-0">AN</span>
                                        <div className="flex-1 min-w-0">
                                            {/* Quick-fill chips when project is selected */}
                                            {projectDetails && (
                                                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                                                    {projectDetails.customer?.email && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setComposeTo(projectDetails.customer.email)}
                                                            className={clsx(
                                                                "px-2.5 py-1 rounded-[3px] text-[10px] font-semibold border transition-all flex items-center gap-1.5",
                                                                composeTo === projectDetails.customer.email
                                                                    ? "bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white border-[#123a3c] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                                                    : "bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 border-[#ccc] hover:border-[#1B4D4F] hover:text-[#1B4D4F] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                                                            )}
                                                        >
                                                            Kunde: {projectDetails.customer.company_name || projectDetails.customer.first_name + ' ' + projectDetails.customer.last_name}
                                                        </button>
                                                    )}
                                                    {(() => {
                                                        const p = projectDetails.partner || projectDetails.translator;
                                                        const partnerEmail = p?.email;
                                                        const partnerName = p?.name || p?.company || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || partnerEmail;
                                                        if (!partnerEmail) return null;
                                                        return (
                                                            <button
                                                                type="button"
                                                                onClick={() => setComposeTo(partnerEmail)}
                                                                className={clsx(
                                                                    "px-2.5 py-1 rounded-[3px] text-[10px] font-semibold border transition-all flex items-center gap-1.5",
                                                                    composeTo === partnerEmail
                                                                        ? "bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white border-[#123a3c] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                                                        : "bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 border-[#ccc] hover:border-[#1B4D4F] hover:text-[#1B4D4F] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                                                                )}
                                                            >
                                                                Partner: {partnerName}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                            <div className="relative">
                                                <input
                                                    value={composeTo}
                                                    onChange={(e) => {
                                                        setComposeTo(e.target.value);
                                                        setShowToSuggestions(true);
                                                        setSuggestionIndex(0);
                                                    }}
                                                    onFocus={() => setShowToSuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'ArrowDown' && filteredToSuggestions.length > 0) {
                                                            e.preventDefault();
                                                            setSuggestionIndex(prev => (prev + 1) % filteredToSuggestions.length);
                                                        } else if (e.key === 'ArrowUp' && filteredToSuggestions.length > 0) {
                                                            e.preventDefault();
                                                            setSuggestionIndex(prev => (prev - 1 + filteredToSuggestions.length) % filteredToSuggestions.length);
                                                        } else if (e.key === 'Enter' && filteredToSuggestions.length > 0 && showToSuggestions) {
                                                            e.preventDefault();
                                                            setComposeTo(filteredToSuggestions[suggestionIndex].value);
                                                            setShowToSuggestions(false);
                                                        } else if (e.key === 'Escape') {
                                                            setShowToSuggestions(false);
                                                        }
                                                    }}
                                                    className="w-full bg-transparent border-none outline-none text-sm placeholder:text-slate-300 font-medium text-slate-800 py-1"
                                                    placeholder="empfaenger@beispiel.de"
                                                    autoComplete="off"
                                                />
                                                {showToSuggestions && filteredToSuggestions.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 shadow-xl rounded-sm overflow-hidden z-[101] animate-in fade-in slide-in-from-top-1">
                                                        {filteredToSuggestions.map((s, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    setComposeTo(s.value);
                                                                    setShowToSuggestions(false);
                                                                }}
                                                                className={clsx(
                                                                    "w-full text-left px-4 py-3 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors",
                                                                    idx === suggestionIndex ? "bg-slate-50" : "hover:bg-slate-50/50"
                                                                )}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">{s.label}</span>
                                                                    <span className="text-[10px] font-medium text-slate-400 font-mono tracking-tight">{s.value}</span>
                                                                </div>
                                                                <Badge variant="outline" className="text-[8px] font-black px-1.5 py-0 border-slate-200 text-slate-400 bg-white">
                                                                    {s.type}
                                                                </Badge>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subject Field */}
                                    <div className="flex items-center gap-4 py-2 border-b border-slate-100 group focus-within:border-[#1B4D4F]/30 transition-colors">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 group-focus-within:text-[#1B4D4F] transition-colors">BETREFF</span>
                                        <input
                                            value={composeSubject}
                                            onChange={(e) => setComposeSubject(e.target.value)}
                                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-300 font-bold text-slate-800 py-1"
                                            placeholder="Betreff eingeben..."
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Link & variables Fields Section */}
                                    <div className="flex flex-col gap-4 py-6 border-b border-slate-50 bg-slate-50/10 px-6 -mx-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <FaProjectDiagram /> Projekt-Verknüpfung
                                                </label>
                                                {selectedProjectId && (
                                                    <button
                                                        onClick={() => setSelectedProjectId(null)}
                                                        className="text-[9px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-tight"
                                                    >
                                                        Verbindung lösen
                                                    </button>
                                                )}
                                            </div>
                                            <SearchableSelect
                                                options={projects
                                                    .filter((p: any) => p && p.id)
                                                    .map((p: any) => ({
                                                        value: p.id.toString(),
                                                        label: `${p.project_number || 'P-NEW'} — ${p.project_name || p.name || 'Unbenannt'} (${p.customer?.company_name || p.customer?.name || 'Unbekannt'})`
                                                    }))}
                                                value={selectedProjectId || ''}
                                                onChange={(val) => {
                                                    setSelectedProjectId(val || null);
                                                    if (val) {
                                                        const proj = projects.find((p: any) => p.id.toString() === val);
                                                        if (proj?.customer?.email) setComposeTo(proj.customer.email);
                                                        if (!composeSubject) {
                                                            setComposeSubject(`Projekt: ${proj?.project_number || 'ID ' + proj?.id} — ${proj?.project_name || proj?.name}`);
                                                        }
                                                    }
                                                }}
                                                placeholder="Suchen Sie nach Projektnummer oder Name..."
                                                className="bg-white border-slate-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Editor Switcher + Variables header row */}
                                    <div className="pt-6 flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nachricht Text</span>
                                        <div className="flex bg-slate-100 p-0.5 rounded-sm">
                                            <button
                                                onClick={() => setIsComposePreview(false)}
                                                className={clsx(
                                                    "px-3 py-1 text-[9px] font-bold rounded-sm transition-all",
                                                    !isComposePreview ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5"><FaCode size={10} /> EDITOR</div>
                                            </button>
                                            <button
                                                onClick={() => setIsComposePreview(true)}
                                                className={clsx(
                                                    "px-3 py-1 text-[9px] font-bold rounded-sm transition-all",
                                                    isComposePreview ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5"><FaEye size={10} /> VORSCHAU</div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Variable Picker — above editor */}
                                    <div className="mb-2" ref={varPickerRef}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Variablen einfügen</span>
                                            <button
                                                type="button"
                                                onClick={() => { setIsVarPickerOpen(v => !v); setVarSearch(''); }}
                                                className={clsx(
                                                    "px-2.5 py-1 rounded-[3px] text-[10px] font-semibold border transition-all flex items-center gap-1.5",
                                                    isVarPickerOpen
                                                        ? "bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white border-[#123a3c] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                                        : "bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 border-[#ccc] hover:border-[#1B4D4F] hover:text-[#1B4D4F] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                                                )}
                                            >
                                                <FaSearchPlus size={8} /> Variable wählen
                                            </button>
                                        </div>

                                        {isVarPickerOpen && (
                                            <div className="border border-slate-200 rounded-sm bg-white shadow-lg overflow-hidden">
                                                {/* Search */}
                                                <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-2 bg-[#f9f9f9]">
                                                    <FaSearchPlus size={10} className="text-slate-400 shrink-0" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={varSearch}
                                                        onChange={e => setVarSearch(e.target.value)}
                                                        placeholder="Variable suchen..."
                                                        className="flex-1 text-xs outline-none placeholder:text-slate-300 text-slate-700 font-medium bg-transparent"
                                                    />
                                                    {varSearch && (
                                                        <button type="button" onClick={() => setVarSearch('')} className="text-slate-300 hover:text-slate-600">
                                                            <FaTimes size={10} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Results */}
                                                <div className="max-h-64 overflow-y-auto">
                                                    {(() => {
                                                        const q = varSearch.toLowerCase();
                                                        const filtered = ALL_VARIABLES.filter(v =>
                                                            !q ||
                                                            v.label.toLowerCase().includes(q) ||
                                                            v.key.toLowerCase().includes(q) ||
                                                            v.desc.toLowerCase().includes(q)
                                                        );
                                                        if (filtered.length === 0) return (
                                                            <p className="px-4 py-6 text-[10px] text-slate-400 text-center font-medium">Keine Variable gefunden</p>
                                                        );
                                                        const groups = varSearch ? [''] : VAR_GROUPS;
                                                        return groups.map(group => {
                                                            const items = varSearch
                                                                ? filtered
                                                                : filtered.filter(v => v.group === group);
                                                            if (items.length === 0) return null;
                                                            return (
                                                                <div key={group}>
                                                                    {!varSearch && (
                                                                        <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
                                                                            {group}
                                                                        </div>
                                                                    )}
                                                                    {items.map(v => {
                                                                        const isSelected = composeBody.includes(`{{${v.key}}}`) || composeBody.includes(`{${v.key}}`);
                                                                        return (
                                                                            <button
                                                                                key={v.key}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    if (isSelected) {
                                                                                        // Toggle off - simple regex replacement
                                                                                        const regex = new RegExp(`\\s?{{${v.key}}}|\\s?{${v.key}}`, 'g');
                                                                                        setComposeBody(prev => prev.replace(regex, ''));
                                                                                    } else {
                                                                                        setComposeBody(prev => prev + ` {{${v.key}}}`);
                                                                                    }
                                                                                }}
                                                                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 border-b border-slate-50 last:border-0 group"
                                                                            >
                                                                                <div className="flex items-center gap-3 min-w-0">
                                                                                    <div className="shrink-0" onClick={e => e.stopPropagation()}>
                                                                                        <Checkbox
                                                                                            checked={isSelected}
                                                                                            onChange={() => { }} // Controlled via button click for larger hit area
                                                                                        />
                                                                                    </div>
                                                                                    <div className="min-w-0">
                                                                                        <div className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">{v.label}</div>
                                                                                        <div className="text-[10px] text-slate-400 font-medium truncate">{v.desc}</div>
                                                                                    </div>
                                                                                </div>
                                                                                <code className="text-[10px] font-mono text-slate-400 group-hover:text-slate-700 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">{`{{${v.key}}}`}</code>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Editor Content */}
                                    <div className="min-h-[400px] border border-slate-100 rounded-sm overflow-hidden">
                                        {isComposePreview ? (
                                            <div className="p-8 h-full bg-slate-50/30">
                                                <div
                                                    className="prose prose-slate max-w-none text-sm text-slate-800 font-medium leading-relaxed"
                                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getPreviewHtml(composeBody)) }}
                                                />
                                            </div>
                                        ) : (
                                            <ReactQuill
                                                theme="snow"
                                                value={composeBody}
                                                onChange={setComposeBody}
                                                modules={quillModules}
                                                className="quill-modern border-none h-full"
                                            />
                                        )}
                                    </div>

                                    {/* Dropzone / Attachment Zone */}
                                    <div
                                        className={clsx(
                                            "mt-8 p-10 border-2 border-dashed rounded-sm transition-all flex flex-col items-center justify-center gap-4",
                                            isDragOver ? "border-brand-500 bg-brand-50/50" : "border-slate-100 bg-slate-50/20 hover:border-slate-200"
                                        )}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                        onDragLeave={() => setIsDragOver(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragOver(false);
                                            if (e.dataTransfer.files) {
                                                setComposeAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                                            }
                                        }}
                                    >
                                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400">
                                            <FaCloudUploadAlt size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Dateien hierher ziehen oder <button onClick={() => fileInputRef.current?.click()} className="text-brand-600 hover:underline">durchsuchen</button></p>
                                            <p className="text-[9px] text-slate-400 font-medium mt-1">Maximale Dateigröße 25MB</p>
                                        </div>

                                        {selectedProjectId && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsProjectFilesModalOpen(true)}
                                                className="mt-2 h-9 text-[10px] font-bold uppercase tracking-widest border-slate-200 hover:bg-white text-slate-600 flex gap-2"
                                            >
                                                <FaSearchPlus size={10} /> Aus Projekt-Dateien wählen
                                            </Button>
                                        )}
                                    </div>

                                    {/* Attachments Section */}
                                    {composeAttachments.length > 0 && (
                                        <div className="pt-8 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ausgewählte Anhänge</span>
                                                <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0">{composeAttachments.length}</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                                {composeAttachments.map((f, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 group hover:border-slate-900 transition-all rounded-sm shadow-sm">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                                                <FaPaperclip className="text-slate-400 text-[10px]" />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <div className="text-[11px] font-bold text-slate-700 truncate">{f.name}</div>
                                                                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">{formatFileSize(f.size)}</div>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => removeAttachment(i)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                                                            <FaTimes size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Toolbar Footer */}
                            <div className="px-8 py-4 border-t border-[#ddd] bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-9 px-4 text-[10px] font-semibold rounded-[3px] border border-[#ccc] bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_1px_rgba(0,0,0,0.08)] hover:border-[#adadad] hover:text-[#1B4D4F] active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.1)] transition flex items-center gap-2 uppercase tracking-wide"
                                    >
                                        <FaPaperclip size={12} /> Anhängen
                                    </button>
                                    <button
                                        onClick={resetCompose}
                                        className="h-9 px-4 text-[10px] font-semibold rounded-[3px] border border-[#ccc] bg-gradient-to-b from-white to-[#ebebeb] text-red-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_1px_rgba(0,0,0,0.08)] hover:border-red-300 hover:text-red-600 active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.1)] transition uppercase tracking-wide"
                                    >
                                        Verwerfen
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => sendMutation.mutate(selectedAccount?.id)}
                                        disabled={sendMutation.isPending || !composeTo || !composeSubject}
                                        className="h-9 px-8 text-[10px] font-semibold rounded-[3px] border border-[#123a3c] bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(0,0,0,0.15)] [text-shadow:0_-1px_0_rgba(0,0,0,0.25)] hover:from-[#2a7073] hover:to-[#235e62] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition disabled:opacity-30 uppercase tracking-widest flex items-center gap-2"
                                    >
                                        {sendMutation.isPending ? 'Sende...' : 'Nachricht senden'} <FaPaperPlane size={10} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Lean Logic Sidebar */}
                        <div className="w-[300px] border-l border-slate-100 bg-slate-50/50 flex flex-col shrink-0 overflow-hidden">
                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-10">
                                    {/* Templates Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                <FaFileAlt className="text-slate-400" /> VORLAGEN
                                            </h4>
                                            <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 border-slate-200 text-slate-400">{templates.length}</Badge>
                                        </div>
                                        <div className="space-y-1.5">
                                            {templates.map((tpl: any) => (
                                                <button
                                                    key={tpl.id}
                                                    onClick={() => handleApplyTemplate(tpl)}
                                                    className="w-full text-left p-3 bg-white border border-slate-100 hover:border-slate-900 hover:shadow-sm transition-all group rounded-sm"
                                                >
                                                    <div className="font-bold text-slate-800 text-[11px] mb-0.5 group-hover:text-slate-900 uppercase tracking-tight">{tpl.name}</div>
                                                    <div className="text-slate-400 truncate text-[10px] font-medium tracking-tight uppercase opacity-60">{tpl.type || 'Allgemein'}</div>
                                                </button>
                                            ))}
                                            {templates.length === 0 && (
                                                <div className="text-[10px] text-slate-400 font-medium italic p-2">Keine Vorlagen gefunden.</div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Project Files Selector Modal */}
            <Dialog open={isProjectFilesModalOpen} onOpenChange={setIsProjectFilesModalOpen}>
                <DialogContent className="max-w-2xl bg-white p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-sm">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <DialogTitle className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2 uppercase">
                            <FaProjectDiagram className="text-slate-400" /> Dateiauswahl aus Projekt
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={() => setIsProjectFilesModalOpen(false)} className="h-8 w-8 text-slate-400">
                            <FaTimes />
                        </Button>
                    </div>

                    <div className="p-6">
                        <div className="mb-6">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Verknüpftes Projekt</h4>
                            <p className="text-sm font-bold text-slate-800">{projectDetails?.project_number} — {projectDetails?.project_name || projectDetails?.name}</p>
                        </div>

                        <ScrollArea className="h-[400px] -mr-2 pr-2">
                            <div className="space-y-1.5">
                                {projectDetails?.files?.length > 0 ? (
                                    projectDetails.files.map((file: any) => {
                                        const actualFileName = file.file_name || file.fileName || file.name;
                                        const isAlreadyAttached = composeAttachments.some(a => a.name === actualFileName);

                                        return (
                                            <div
                                                key={file.id}
                                                onClick={() => {
                                                    if (!isAlreadyAttached) {
                                                        handleAddProjectFiles([file]);
                                                    } else {
                                                        const idx = composeAttachments.findIndex(a => a.name === actualFileName);
                                                        if (idx !== -1) removeAttachment(idx);
                                                    }
                                                }}
                                                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-sm hover:border-slate-900 transition-all group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <div className="shrink-0" onClick={e => e.stopPropagation()}>
                                                        <Checkbox
                                                            checked={isAlreadyAttached}
                                                            onChange={() => { }} // Controlled via parent div click
                                                        />
                                                    </div>
                                                    <div className="w-10 h-10 rounded bg-white flex items-center justify-center border border-slate-200 shrink-0 shadow-sm group-hover:border-slate-900 transition-colors">
                                                        <FaFileAlt className="text-slate-400 text-sm group-hover:text-slate-900" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="text-[11px] font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">{actualFileName}</div>
                                                        <div className="text-[10px] text-slate-400 uppercase font-black tracking-tight opacity-60">
                                                            {formatFileSize(file.file_size || file.size)} • {file.type || 'ALLGEMEIN'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    {isAlreadyAttached ? (
                                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm flex items-center gap-1.5">
                                                            <FaCheckCircle size={10} /> ANGEHÄNGT
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-widest">
                                                            Hinzufügen
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-sm">
                                        <FaFolderOpen className="text-slate-200 text-4xl mb-3" />
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic text-center">Keine Dateien im Projekt vorhanden.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsProjectFilesModalOpen(false)}
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            Abbrechen
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <NewEmailAccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                initialData={accountToEdit}
                onSubmit={(data) => {
                    if (accountToEdit) {
                        updateAccountMutation.mutate({ id: accountToEdit.id, data });
                    } else {
                        createAccountMutation.mutate(data);
                    }
                }}
            />

            <NewEmailTemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                initialData={templateToEdit}
                onSubmit={(data) => {
                    if (templateToEdit) {
                        updateTemplateMutation.mutate({ id: templateToEdit.id, data });
                    } else {
                        createTemplateMutation.mutate(data);
                    }
                }}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setMailToDelete(null);
                }}
                onConfirm={async () => {
                    setIsConfirmOpen(false);
                    try {
                        if (deleteType === 'single' && mailToDelete) {
                            await mailService.delete(mailToDelete);
                            if (viewingMail?.id === mailToDelete) setViewingMail(null);
                            toast.success('E-Mail gelöscht');
                        } else if (deleteType === 'bulk' && selectedMails.length > 0) {
                            await Promise.all(selectedMails.map(id => mailService.delete(id)));
                            if (viewingMail && selectedMails.includes(viewingMail.id)) setViewingMail(null);
                            setSelectedMails([]);
                            toast.success(`${selectedMails.length} E-Mail(s) gelöscht`);
                        }
                        queryClient.invalidateQueries({ queryKey: ['mails'] });
                    } catch (error) {
                        toast.error('Geringfügiger Fehler beim Löschen aufgetreten');
                    }
                }}
                title={deleteType === 'single' ? "E-Mail löschen" : `${selectedMails.length} E-Mails löschen`}
                message={deleteType === 'single' ? "Möchten Sie diese E-Mail wirklich löschen?" : "Möchten Sie diese markierten E-Mails wirklich löschen?"}
            />
        </div>
    );
};

export default CommunicationHub;
