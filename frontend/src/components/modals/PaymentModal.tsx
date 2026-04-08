import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaEuroSign, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payment: any) => void;
    initialData?: any;
    totalAmount: number;
    alreadyPaid?: number;
}

const METHODS = [
    { value: 'Bar', label: 'Bar', icon: FaMoneyBillWave },
    { value: 'Karte', label: 'Karte', icon: FaCreditCard },
];

const toEnglish = (v: any) => String(v || '').replace(',', '.');
const toGerman = (v: any) => String(v || '').replace('.', ',');

const filterDecimalInput = (raw: string): string => {
    if (!raw) return '';
    let v = raw.replace(/[^0-9,]/g, '');
    const ci = v.indexOf(',');
    if (ci !== -1) v = v.slice(0, ci + 1) + v.slice(ci + 1).replace(/,/g, '');
    return v;
};

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen, onClose, onSave, initialData, totalAmount, alreadyPaid = 0
}) => {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState<Date>(new Date());
    const [method, setMethod] = useState('Bar');
    const [reference, setReference] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);
    const amountRef = useRef<HTMLInputElement>(null);

    const remainingAmount = Math.max(0, totalAmount - alreadyPaid);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setAmount(initialData.amount);
                setDate(initialData.payment_date ? new Date(initialData.payment_date) : new Date());
                setMethod(initialData.payment_method || 'Bar');
                setNote(initialData.note || '');
            } else {
                setAmount(remainingAmount > 0 ? toGerman(remainingAmount.toFixed(2)) : '');
                setDate(new Date());
                setMethod('Bar');
                setNote('');
                setReference('');
            }
            setError(null);
            setTimeout(() => {
                amountRef.current?.focus();
                amountRef.current?.select();
            }, 100);
        }
    }, [isOpen, initialData, remainingAmount]);

    const handleSave = () => {
        const val = parseFloat(toEnglish(amount));
        if (!amount || isNaN(val)) { setError('Betrag ist erforderlich'); return; }
        if (val <= 0) { setError('Betrag muss größer als 0 € sein'); return; }

        const roundedVal = Math.round(val * 100);
        const roundedMax = Math.round(remainingAmount * 100);
        if (roundedVal > roundedMax) {
            setError(`Max. Restbetrag: ${remainingAmount.toFixed(2)} € (Gesamt: ${totalAmount.toFixed(2)} €)`);
            return;
        }

        setError(null);
        onSave({
            id: initialData?.id || Date.now().toString(),
            amount: parseFloat(amount).toFixed(2),
            payment_date: date.toISOString(),
            payment_method: method,
            reference: method === 'Karte' ? reference : null,
            note,
            created_by: initialData?.created_by || user?.name || 'Unbekannt',
        });
        onClose();
    };

    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-sm shadow-sm w-full max-w-md overflow-hidden animate-fadeInUp">

                {/* Header */}
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-base">
                        {initialData ? 'Zahlung bearbeiten' : 'Zahlung erfassen'}
                    </span>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"
                    >
                        <FaTimes size={13} />
                    </button>
                </div>

                <div className="p-5 space-y-4">

                    {/* Row 1: Betrag (links, groß) + Datum (rechts, kompakt) */}
                    <div className="grid grid-cols-2 gap-3 items-start">

                        {/* Betrag — Hero */}
                        <div className="col-span-1 flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Betrag (Brutto)
                            </label>
                            <div className="relative">
                                <input
                                    ref={amountRef}
                                    type="text"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={e => {
                                        const filtered = filterDecimalInput(e.target.value);
                                        const val = parseFloat(toEnglish(filtered)) || 0;
                                        if (val > remainingAmount) {
                                            setAmount(toGerman(remainingAmount.toFixed(2)));
                                        } else if (val < 0) {
                                            setAmount('0,00');
                                        } else {
                                            setAmount(filtered);
                                        }
                                        if (e.target.value) setError(null);
                                    }}
                                    onBlur={() => {
                                        const val = parseFloat(toEnglish(amount)) || 0;
                                        setAmount(toGerman(val.toFixed(2)));
                                    }}
                                    placeholder="0,00"
                                    className={`w-full h-12 pr-8 pl-3 text-2xl font-bold text-slate-800 bg-white border-2 rounded-sm outline-none transition-colors text-right
                                        ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-teal-600'}`}
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                                    <FaEuroSign size={14} />
                                </span>
                            </div>
                            {error && (
                                <p className="text-[11px] text-red-500 leading-tight">{error}</p>
                            )}
                            <div className="bg-slate-50/50 p-2 rounded-sm mt-1 flex flex-col gap-2">
                                <div className="flex justify-center items-center gap-3">
                                    <button
                                        onClick={() => { setAmount(toGerman((remainingAmount / 2).toFixed(2))); setError(null); }}
                                        className="text-[10px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted transition-colors"
                                    >
                                        1/2 bezahlt
                                    </button>
                                    <span className="text-slate-200 text-[10px]">|</span>
                                    <button
                                        onClick={() => { setAmount(toGerman(remainingAmount.toFixed(2))); setError(null); }}
                                        className="text-[10px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted transition-colors"
                                    >
                                        Vollständig bezahlt
                                    </button>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Restbetrag</span>
                                    <span className={`text-xs font-bold tabular-nums ${parseFloat(toEnglish(amount)) >= remainingAmount ? 'text-teal-600' : 'text-slate-700'}`}>
                                        {(remainingAmount - (parseFloat(toEnglish(amount)) || 0)).toFixed(2)} €
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Datum — rechts */}
                        <div className="col-span-1 flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Zahlungsdatum
                            </label>
                            <DatePicker
                                format="DD.MM.YYYY"
                                value={date ? dayjs(date) : null}
                                onChange={d => d && setDate(d.toDate())}
                                className="w-full h-12"
                                placeholder="Datum"
                                style={{ fontSize: 14 }}
                            />
                        </div>
                    </div>

                    {/* Zahlungsmittel — Icon-Buttons */}
                    <div className="flex flex-col gap-1.5 mt-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Zahlungsmittel
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {METHODS.map(({ value, label, icon: Icon }) => {
                                const active = method === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setMethod(value)}
                                        className={`flex flex-col items-center justify-center gap-1.5 py-4 px-1 rounded-sm border-2 transition-all text-center
                                            ${active
                                                ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span className="text-xs font-bold leading-tight">{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Referenz — nur bei Karte */}
                    {method === 'Karte' && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Überweisung Referenz
                            </label>
                            <input
                                type="text"
                                value={reference}
                                onChange={e => setReference(e.target.value)}
                                placeholder="z.B. Terminal-ID oder Transaktions-Nr."
                                className="w-full h-10 px-3 text-sm border-2 border-slate-200 rounded-sm outline-none focus:border-teal-600 transition-colors bg-white shadow-inner"
                            />
                        </div>
                    )}

                    {/* Anmerkung — Textarea */}
                    <div className="flex flex-col gap-1 mt-2">
                        <label htmlFor="payment-note" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Anmerkung (Optional)
                        </label>
                        <textarea
                            id="payment-note"
                            rows={2}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="w-full resize-none bg-slate-50 border-2 border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-600 transition-colors"
                            placeholder="Optionale Anmerkung..."
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-slate-200 flex justify-end gap-2.5">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold shadow-sm"
                    >
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="px-6 py-2 text-sm font-bold shadow-sm"
                    >
                        Speichern
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
