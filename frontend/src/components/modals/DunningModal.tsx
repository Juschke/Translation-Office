import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface DunningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (notes: string) => void;
    confirmLoading?: boolean;
    invoice: any;
}

const DunningModal = ({ isOpen, onClose, onConfirm, confirmLoading, invoice }: DunningModalProps) => {
    const [notes, setNotes] = React.useState('');

    React.useEffect(() => {
        if (isOpen) setNotes('');
    }, [isOpen]);

    const nextLevel = (invoice?.reminder_level ?? 0) + 1;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {`Mahnstufe ${nextLevel} — ${invoice?.invoice_number}`}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4 px-1">
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Kunde</span>
                            <span className="font-semibold text-slate-700">{invoice?.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Offener Betrag</span>
                            <span className="font-semibold text-red-600">
                                {invoice?.amount_due_eur?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Überfällig seit</span>
                            <span className="font-semibold text-slate-700">{invoice?.days_overdue} Tagen</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                            Interne Notiz (optional)
                        </label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="z. B. Telefonat mit Kunde am..."
                            className="resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter className="flex gap-2 pt-2">
                    <Button variant="secondary" onClick={onClose} disabled={confirmLoading} className="h-10 px-6 font-bold uppercase text-[11px] tracking-widest">
                        Abbrechen
                    </Button>
                    <Button
                        onClick={() => onConfirm(notes)}
                        disabled={confirmLoading}
                        className="h-10 px-6 font-bold uppercase text-[11px] tracking-widest"
                    >
                        {confirmLoading ? 'Verarbeiten...' : `Mahnstufe ${nextLevel} erfassen`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DunningModal;
