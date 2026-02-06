import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaPercentage, FaEuroSign } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import Input from '../common/Input';
import clsx from 'clsx';
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
    const [amountType, setAmountType] = useState<'flat' | 'percent'>('flat');
    const [date, setDate] = useState<Date>(new Date());
    const [method, setMethod] = useState('Überweisung');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setAmount(initialData.amount);
                // If we had stored percentage logic we could restore it, but usually we just store amount.
                // We default to flat for editing unless we infer it.
                setAmountType('flat');
                setDate(initialData.payment_date ? new Date(initialData.payment_date) : new Date());
                setMethod(initialData.payment_method || 'Überweisung');
                setNote(initialData.note || '');
            } else {
                setAmount('');
                setAmountType('flat');
                setDate(new Date());
                setMethod('Überweisung');
                setNote('');
            }
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        const finalAmount = amountType === 'percent'
            ? (totalAmount * (parseFloat(amount) / 100)).toFixed(2)
            : parseFloat(amount).toFixed(2);

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
        if (amountType === 'flat') {
            setAmount(totalAmount.toFixed(2));
        } else {
            setAmount('100');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center backdrop-blur-sm transition-all p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-fadeInUp">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">
                        {initialData ? 'Zahlung Bearbeiten' : 'Zahlung Erfassen'}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 rounded-full transition-colors">
                        <FaTimes />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Amount Section */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Betrag ({amountType === 'flat' ? 'Brutto' : 'Prozent'})
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder={amountType === 'flat' ? "0.00" : "0"}
                                    endIcon={amountType === 'flat' ? <FaEuroSign /> : <FaPercentage />}
                                    className="font-bold text-right"
                                />
                            </div>
                            <div className="flex rounded border border-slate-300 overflow-hidden bg-slate-50 shrink-0">
                                <button
                                    onClick={() => setAmountType('flat')}
                                    className={clsx(
                                        "px-3 py-2 text-[10px] font-bold uppercase transition-colors",
                                        amountType === 'flat' ? "bg-white text-brand-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Pauschal
                                </button>
                                <div className="w-px bg-slate-200"></div>
                                <button
                                    onClick={() => setAmountType('percent')}
                                    className={clsx(
                                        "px-3 py-2 text-[10px] font-bold uppercase transition-colors",
                                        amountType === 'percent' ? "bg-white text-brand-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Prozent
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-slate-400 italic">
                                {amountType === 'percent' && amount && !isNaN(Number(amount))
                                    ? `= ${(totalAmount * (parseFloat(amount) / 100)).toFixed(2)} €`
                                    : 'Projekt-Gesamtbetrag: ' + totalAmount.toFixed(2) + ' €'
                                }
                            </span>
                            <button
                                onClick={handleSetFullAmount}
                                className="text-[10px] font-bold text-brand-600 hover:text-brand-700 underline decoration-dotted uppercase"
                            >
                                100% Bezahlt
                            </button>
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Zahlungsdatum</label>
                        <div className="relative h-11 border border-slate-200 rounded transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10 bg-white">
                            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs z-10" />
                            <DatePicker
                                selected={date}
                                onChange={(d: Date | null) => d && setDate(d)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd.MM.yyyy HH:mm"
                                locale="de"
                                className="w-full h-10 bg-transparent border-none pl-9 pr-3 py-2 text-sm font-bold text-slate-700 outline-none cursor-pointer"
                                placeholderText="Datum wählen"
                            />
                        </div>
                    </div>

                    {/* Method */}
                    <div className="space-y-2">
                        <Input isSelect label="Zahlmittel" value={method} onChange={e => setMethod(e.target.value)}>
                            <option value="Überweisung">Überweisung</option>
                            <option value="Bar">Bar</option>
                            <option value="PayPal">PayPal</option>
                            <option value="Kreditkarte">Kreditkarte</option>
                            <option value="Vorkasse">Vorkasse</option>
                            <option value="Lastschrift">Lastschrift</option>
                        </Input>
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

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 transition-colors">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold text-xs hover:text-slate-700 transition">Abbrechen</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-brand-700 text-white rounded text-xs font-bold uppercase shadow-lg shadow-brand-500/20 hover:bg-brand-800 transition active:scale-95">
                        Speichern
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
