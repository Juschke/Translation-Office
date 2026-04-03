import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import { mailService } from '@/api/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectData?: any;
    recipientType?: 'customer' | 'partner';
}

const SendEmailModal = ({ isOpen, onClose, projectData, recipientType = 'customer' }: SendEmailModalProps) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        mail_account_id: '',
        to: '',
        cc: '',
        subject: '',
        body: '',
        project_id: projectData?.id || null,
    });

    // Fetch Email-Konten
    const { data: mailAccounts, isSuccess: mailAccountsLoaded } = useQuery({
        queryKey: ['mailAccounts'],
        queryFn: () => mailService.getAccounts(),
        enabled: isOpen,
    });

    // Fetch Email-Vorlagen
    const { data: emailTemplates, isSuccess: templatesLoaded } = useQuery({
        queryKey: ['emailTemplates'],
        queryFn: () => mailService.getTemplates(),
        enabled: isOpen,
    });

    const [hasInitialized, setHasInitialized] = useState(false);

    // Reset initial state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setHasInitialized(false);
            setFormData({
                mail_account_id: '',
                to: '',
                cc: '',
                subject: '',
                body: '',
                project_id: null,
            });
        }
    }, [isOpen]);

    // Auto-fill data when modal opens and queries are loaded
    useEffect(() => {
        // Wait until queries have actually finished resolving to avoid filling empty data
        if (isOpen && projectData && !hasInitialized && mailAccountsLoaded && templatesLoaded) {

            // Bestimme Empfänger basierend auf recipientType
            let recipient = '';
            if (recipientType === 'customer' && projectData.customer?.email) {
                recipient = projectData.customer.email;
            } else if (recipientType === 'partner' && projectData.translator?.email) {
                recipient = projectData.translator.email;
            }

            // Finde passende Vorlage
            let template = null;
            if (recipientType === 'partner') {
                template = emailTemplates?.find((t: any) =>
                    t.name?.toLowerCase().includes('anfrage') ||
                    t.type?.toLowerCase().includes('anfrage')
                );
            }

            // Wenn die Queries geladen wurden, wähle das erste Konto aus
            const defaultAccountId = mailAccounts?.length > 0 ? mailAccounts[0].id : '';

            setFormData({
                mail_account_id: defaultAccountId,
                to: recipient,
                cc: '',
                subject: template?.subject || `Projekt ${projectData.name || projectData.id}`,
                body: template?.body || '',
                project_id: projectData.id,
            });

            // Prevent further updates to formData in this session unless explicitly closed/reopened
            setHasInitialized(true);
        }
    }, [isOpen, projectData, recipientType, emailTemplates, mailAccounts, mailAccountsLoaded, templatesLoaded, hasInitialized]);

    const sendEmailMutation = useMutation({
        mutationFn: (data: any) => mailService.send(data),
        onSuccess: () => {
            toast.success('E-Mail wurde erfolgreich versendet!');
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Fehler beim Senden der E-Mail');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.mail_account_id) {
            toast.error('Bitte wählen Sie ein E-Mail-Konto aus.');
            return;
        }

        if (!formData.to) {
            toast.error('Bitte geben Sie einen Empfänger an.');
            return;
        }

        sendEmailMutation.mutate(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-sm bg-brand-primary/10 flex items-center justify-center">
                            <FaPaperPlane className="text-brand-primary text-sm" />
                        </div>
                        E-Mail senden
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* E-Mail-Konto */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Von (E-Mail-Konto)</label>
                        <select
                            value={formData.mail_account_id}
                            onChange={(e) => setFormData({ ...formData, mail_account_id: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            required
                        >
                            <option value="">Bitte wählen...</option>
                            {mailAccounts?.map((account: any) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} ({account.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Empfänger */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">An</label>
                        <input
                            type="email"
                            value={formData.to}
                            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            placeholder="empfaenger@example.com"
                            required
                        />
                    </div>

                    {/* CC */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">CC (optional)</label>
                        <input
                            type="text"
                            value={formData.cc}
                            onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            placeholder="cc1@example.com, cc2@example.com"
                        />
                    </div>

                    {/* Betreff */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Betreff</label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            placeholder="Betreff der E-Mail"
                            required
                        />
                    </div>

                    {/* Nachricht */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Nachricht</label>
                        <textarea
                            value={formData.body}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                            rows={12}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 font-mono"
                            placeholder="Ihre Nachricht..."
                            required
                        />
                        <p className="text-2xs text-slate-400 mt-1">
                            Verfügbare Platzhalter: {'{'}{'{'} project_name {'}'}{'}'}, {'{'}{'{'} source_language {'}'}{'}'}, {'{'}{'{'} target_language {'}'}{'}'}, {'{'}{'{'} deadline {'}'}{'}'}, {'{'}{'{'} price_net {'}'}{'}'}, {'{'}{'{'} company_name {'}'}{'}'}, {'{'}{'{'} sender_name {'}'}{'}'}
                        </p>
                    </div>

                    <DialogFooter className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={sendEmailMutation.isPending}
                        >
                            <FaTimes className="mr-2" /> Abbrechen
                        </Button>
                        <Button
                            type="submit"
                            variant="default"
                            disabled={sendEmailMutation.isPending}
                            className="bg-brand-primary"
                        >
                            <FaPaperPlane className="mr-2" />
                            {sendEmailMutation.isPending ? 'Wird gesendet...' : 'Senden'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default SendEmailModal;
