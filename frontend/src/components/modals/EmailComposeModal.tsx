import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
    Button
} from "../ui";
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import EmailComposeContent from '../EmailComposeContent';

interface EmailComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    projectId?: string | null;
    to?: string;
    subject?: string;
    body?: string;
}

const EmailComposeModal = ({
    isOpen,
    onClose,
    onSuccess,
    projectId,
    to,
    subject,
    body,
}: EmailComposeModalProps) => {

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent hideClose className="max-w-[900px] w-[95vw] h-[95vh] p-0 flex flex-col gap-0 overflow-hidden border-none shadow-2xl rounded-sm">
                {/* Minimal Header */}
                <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-100">
                    <DialogTitle className="flex flex-col">
                        <div className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2 uppercase">
                            <FaPaperPlane className="text-slate-400 text-xs" />
                            Neue Nachricht
                        </div>
                    </DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                            <FaTimes />
                        </Button>
                    </DialogClose>
                </div>

                <EmailComposeContent
                    onClose={onClose}
                    onSuccess={onSuccess}
                    projectId={projectId}
                    to={to}
                    subject={subject}
                    body={body}
                />
            </DialogContent>
        </Dialog>
    );
};

export default EmailComposeModal;
