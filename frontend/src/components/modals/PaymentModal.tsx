import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaEuroSign } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import Input from '../common/Input';
import { Button } from '../ui/button';
import { registerLocale } from "react-datepicker";
import { de } from 'date-fns/locale/de';

registerLocale('de', de);

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payment: any) => void;
    initialData?: any;
    totalAmount: number; // Gesamt Brutto for context
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSave, initialData, totalAmount }) => {
    const [amount, setAmount] = useState('');
    // const [amountType, setAmountType] = useState<'flat' | 'percent'>('flat'); // Removed
    const [date, setDate] = useState<Date>(new Date());
    const [method, setMethod] = useState('Überweisung');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setAmount(initialData.amount);
                // setAmountType('flat'); 
                setDate(initialData.payment_date ? new Date(initialData.payment_date) : new Date());
                setMethod(initialData.payment_method || 'Überweisung');
                setNote(initialData.note || '');
            } else {
                setAmount('');
                // setAmountType('flat');
                setDate(new Date());
                setMethod('Überweisung');
                setNote('');
            }
        }
    }, [isOpen, initialData]);

    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        const val = parseFloat(amount);
        if (!amount || isNaN(val)) {
            setError("Betrag ist erforderlich");
            return;
        }

        if (val <= 0) {
            setError("Betrag muss größer als 0 € sein");
            return;
        }

        if (val > totalAmount) {
            setError(`Betrag darf den Gesamtbetrag (${totalAmount.toFixed(2)} €) nicht überschreiten`);
            return;
        }

        setError(null);
        const finalAmount = parseFloat(amount).toFixed(2);

        onSave({
            id: initialData?.id || Date.now().toString(),
            amount: finalAmount,
            payment_date: date.toISOString(),
            payment_method: method,
            note
        });
        onClose();
    };

    const handleSetFullAmount = () => {
        setAmount(totalAmount.toFixed(2));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center backdrop-blur-sm transition-all p-4">
            <div className="bg-white rounded-sm shadow-sm w-full max-w-lg overflow-hidden animate-fadeInUp">
                <div className="bg-white px-6 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <h3 className="font-semibold text-base text-slate-800">
                        {initialData ? 'Zahlung Bearbeiten' : 'Zahlung Erfassen'}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-all">
                        <FaTimes />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Amount Section */}
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-400">
                            Betrag (Brutto)
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        if (e.target.value) setError(null);
                                    }}
                                    placeholder="0.00"
                                    error={!!error}
                                    helperText={error || ""}
                                    endIcon={<FaEuroSign />}
                                    className="font-medium text-right"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs text-slate-400 italic">
                                Projekt-Gesamtbetrag: {totalAmount.toFixed(2)} €
                            </span>
                            <button
                                onClick={handleSetFullAmount}
                                className="text-xs font-medium text-slate-700 hover:text-slate-900 underline decoration-dotted"
                            >
                                Vollständig Bezahlt
                            </button>
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Zahlungsdatum</label>
                        <div className="relative h-9 border border-slate-200 rounded transition-all focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-brand-500/10 bg-white">
                            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs z-10" />
                            <DatePicker
                                selected={date}
                                onChange={(d: Date | null) => d && setDate(d)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd.MM.yyyy HH:mm"
                                locale="de"
                                className="w-full h-8 bg-transparent border-none pl-9 pr-3 py-1 text-sm font-medium text-slate-700 outline-none cursor-pointer"
                                placeholderText="Datum wählen"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Zahlungsmethode</label>
                        <select
                            className="w-full h-9 bg-white border border-slate-200 rounded px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-slate-900 transition-colors"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                        >
                            <option value="Bar">Bar</option>
                            <option value="Karte">Karte</option>
                            <option value="Sonstige">Sontige Zahlungsmethode</option>
                        </select>
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <Input
                            label="Anmerkung (Optional)"
                            placeholder="z.B. Referenznummer..."
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white px-6 py-3 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition"
                    >
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="px-3 py-2 md:px-6 md:py-2 text-xs md:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition"
                    >
                        Speichern
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
