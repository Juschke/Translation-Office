import clsx from 'clsx';
import { IMaskInput } from 'react-imask';
import Input from '../common/Input';
import type { PartnerFormData } from './partnerTypes';

interface PartnerBankingSectionProps {
    formData: PartnerFormData;
    updateFormData: (patch: Partial<PartnerFormData>) => void;
    markTouched: (field: string) => void;
    getError: (field: string) => string | undefined;
    handleIbanBlur: () => void;
    handleBicBlur: () => void;
    isValidatingIban: boolean;
}

const PartnerBankingSection = ({
    formData,
    updateFormData,
    markTouched,
    getError,
    handleIbanBlur,
    handleBicBlur,
    isValidatingIban,
}: PartnerBankingSectionProps) => (
    <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
            <div className="w-6 h-6 rounded bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-semibold">05</div>
            <h4 className="text-xs font-semibold text-slate-800">Finanzen & Steuer</h4>
        </div>

        <div className="grid grid-cols-12 gap-x-8 gap-y-6">
            <div className="col-span-12">
                <Input
                    label="Kontoinhaber"
                    value={formData.bankAccountHolder}
                    onChange={e => updateFormData({ bankAccountHolder: e.target.value })}
                    placeholder={formData.type === 'agency' ? formData.company || 'Agenturname' : `${formData.firstName || 'Vorname'} ${formData.lastName || 'Nachname'}`.trim()}
                    helperText="Automatisch vorausgefüllt basierend auf dem Namen."
                />
            </div>
            <div className="col-span-12">
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">IBAN</label>
                    <div className="relative">
                        <IMaskInput
                            mask="aa00 0000 0000 0000 0000 00"
                            definitions={{ 'a': /[a-zA-Z]/ }}
                            placeholder="DE00 0000 0000 0000 0000 00"
                            value={formData.iban || ''}
                            onAccept={(value) => {
                                updateFormData({ iban: (value as string).toUpperCase() });
                                markTouched('iban');
                            }}
                            onBlur={handleIbanBlur}
                            className={clsx(
                                'flex w-full rounded-sm bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all border outline-none min-h-[42px]',
                                'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900',
                                getError('iban') && 'border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-red-500/10',
                            )}
                        />
                        {isValidatingIban && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    {getError('iban') && <span className="text-xs text-red-500 font-medium block mt-1">{getError('iban')}</span>}
                </div>
            </div>
            <div className="col-span-12 sm:col-span-4">
                <Input label="Bankname" placeholder="Name der Bank" value={formData.bankName} onChange={e => updateFormData({ bankName: e.target.value })} helperText="Name der Bankgesellschaft" />
            </div>
            <div className="col-span-12 sm:col-span-4">
                <Input label="BLZ" placeholder="000 000 00" value={formData.bankCode} onChange={e => updateFormData({ bankCode: e.target.value })} />
            </div>
            <div className="col-span-12 sm:col-span-4">
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">BIC</label>
                    <IMaskInput
                        mask="aaaaaa aa [aaa]"
                        definitions={{ 'a': /[a-zA-Z0-9]/ }}
                        placeholder="ABCDEFGH"
                        value={formData.bic || ''}
                        onAccept={(value) => {
                            updateFormData({ bic: (value as string).toUpperCase() });
                            markTouched('bic');
                        }}
                        onBlur={handleBicBlur}
                        className={clsx(
                            'flex w-full rounded-sm bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all border outline-none min-h-[42px]',
                            'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900',
                        )}
                    />
                </div>
            </div>

            <div className="col-span-12 md:col-span-4">
                <Input
                    label="Zahlungsziel (Tage)"
                    type="number"
                    min={0}
                    value={formData.paymentTerms}
                    onChange={e => updateFormData({ paymentTerms: e.target.value })}
                    className="font-medium"
                    helperText="Frist in Tagen ab Rechnungserhalt"
                />
            </div>
            <div className="col-span-12 md:col-span-8">
                <Input
                    label="Steuernummer / USt-IdNr."
                    placeholder="DE123456789"
                    value={formData.taxId}
                    onChange={e => updateFormData({ taxId: e.target.value })}
                    className="font-medium"
                    helperText="Wichtig für die korrekte Abrechnung von Honoraren"
                />
            </div>
        </div>
    </div>
);

export default PartnerBankingSection;
