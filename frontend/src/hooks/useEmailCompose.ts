import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { mailService } from '../api/services';

/**
 * Kapselt den gesamten State und die Mutations für das E-Mail-Compose-Panel.
 * Enthält: Felder (to, subject, body, attachments), Vorschau-Mode,
 * Reply/Forward-Logik, Template-Anwendung und den Sende-Mutation.
 */
export function useEmailCompose() {
    const location = useLocation();
    const queryClient = useQueryClient();

    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeTo, setComposeTo] = useState('');
    const [composeCc, setComposeCc] = useState('');
    const [composeBcc, setComposeBcc] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [composeAttachments, setComposeAttachments] = useState<File[]>([]);
    const [isComposePreview, setIsComposePreview] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProjectFilesModalOpen, setIsProjectFilesModalOpen] = useState(false);
    const [showToSuggestions, setShowToSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(0);

    // Öffnet Compose automatisch wenn über Navigation mit State navigiert wird
    useEffect(() => {
        if (location.state?.compose) {
            setComposeTo(location.state.to || '');
            setComposeSubject(location.state.subject || '');
            setComposeBody(location.state.body || '');
            setIsComposeOpen(true);
        }
    }, [location.state]);

    const resetCompose = () => {
        setIsComposeOpen(false);
        setComposeTo('');
        setComposeCc('');
        setComposeBcc('');
        setComposeSubject('');
        setComposeBody('');
        setComposeAttachments([]);
        setIsComposePreview(false);
        setSelectedProjectId(null);
        setSelectedCustomerId(null);
        setShowToSuggestions(false);
    };

    const sendMutation = useMutation({
        mutationFn: (selectedAccountId: string | number) => {
            const formData = new FormData();
            formData.append('mail_account_id', selectedAccountId.toString());
            formData.append('to', composeTo);
            if (composeCc) formData.append('cc', composeCc);
            if (composeBcc) formData.append('bcc', composeBcc);
            formData.append('subject', composeSubject);
            formData.append('body', composeBody);
            if (selectedProjectId) {
                formData.append('project_id', selectedProjectId.toString());
            }
            composeAttachments.forEach((file, index) => {
                formData.append(`attachments[${index}]`, file);
            });
            return mailService.send(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            resetCompose();
            toast.success('E-Mail erfolgreich gesendet');
        },
        onError: () => {
            toast.error('Fehler beim Senden der E-Mail');
        },
    });

    const handleReply = (mail: any) => {
        setComposeTo(mail.from);
        setComposeSubject(`Re: ${mail.subject}`);
        setComposeBody(
            `<br/><br/>--- Am ${mail.full_time} schrieb ${mail.from}:<br/><blockquote>${mail.body}</blockquote>`,
        );
        setIsComposeOpen(true);
    };

    const handleForward = (mail: any) => {
        setComposeTo('');
        setComposeSubject(`Fwd: ${mail.subject}`);
        setComposeBody(
            `<br/><br/>--- Weitergeleitete Nachricht ---<br/>Von: ${mail.from}<br/>Datum: ${mail.full_time}<br/>Betreff: ${mail.subject}<br/><br/>${mail.body}`,
        );
        setIsComposeOpen(true);
    };

    const handleApplyTemplate = (template: any) => {
        setComposeSubject(template.subject);
        const body: string = template.body ?? '';
        // If the stored body already contains HTML tags (e.g. saved from Quill), use it directly.
        // Otherwise convert plain-text newlines to Quill-compatible <p> paragraphs.
        const isHtml = /<[a-z][\s\S]*>/i.test(body);
        if (isHtml) {
            setComposeBody(body);
        } else {
            const html = body
                .split('\n')
                .map((line: string) => `<p>${line.trim() !== '' ? line : '<br>'}</p>`)
                .join('');
            setComposeBody(html);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setComposeAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (index: number) => {
        setComposeAttachments(prev => prev.filter((_, i) => i !== index));
    };

    return {
        isComposeOpen, setIsComposeOpen,
        composeTo, setComposeTo,
        composeCc, setComposeCc,
        composeBcc, setComposeBcc,
        composeSubject, setComposeSubject,
        composeBody, setComposeBody,
        composeAttachments, setComposeAttachments,
        isComposePreview, setIsComposePreview,
        selectedProjectId, setSelectedProjectId,
        selectedCustomerId, setSelectedCustomerId,
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
    };
}
