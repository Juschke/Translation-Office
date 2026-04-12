import Input from '../common/Input';
import type { PartnerFormData } from './partnerTypes';

interface PartnerRatesSectionProps {
    formData: PartnerFormData;
    updateFormData: (patch: Partial<PartnerFormData>) => void;
}

const PartnerRatesSection = ({ formData, updateFormData }: PartnerRatesSectionProps) => (
    <div className="space-y-6">
        <div className="grid grid-cols-12 gap-x-8 gap-y-6">
            <div className="col-span-12 md:col-span-4">
                <Input
                    label="Wortpreis (Netto)"
                    type="number"
                    step="0.001"
                    min={0}
                    placeholder="0.080"
                    value={formData.unitRates.word}
                    onChange={e => updateFormData({ unitRates: { ...formData.unitRates, word: e.target.value } })}
                    endIcon={<span className="text-xs font-medium text-slate-300">€</span>}
                    helperText="Netto-Preis pro Wort"
                />
            </div>
            <div className="col-span-12 md:col-span-4">
                <Input
                    label="Zeilenpreis (Netto)"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="1.20"
                    value={formData.unitRates.line}
                    onChange={e => updateFormData({ unitRates: { ...formData.unitRates, line: e.target.value } })}
                    endIcon={<span className="text-xs font-medium text-slate-300">€</span>}
                    helperText="Preis pro Normzeile (55 Anschläge)"
                />
            </div>
            <div className="col-span-12 md:col-span-4">
                <Input
                    label="Stundensatz (Netto)"
                    type="number"
                    step="1"
                    min={0}
                    placeholder="55.00"
                    value={formData.unitRates.hour}
                    onChange={e => updateFormData({ unitRates: { ...formData.unitRates, hour: e.target.value } })}
                    endIcon={<span className="text-xs font-medium text-slate-300">€</span>}
                    helperText="Für Dolmetschen oder Lektorat"
                />
            </div>
            <div className="col-span-12 md:col-span-6">
                <Input
                    label="Mindestpauschale"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="45.00"
                    value={formData.flatRates.minimum}
                    onChange={e => updateFormData({ flatRates: { ...formData.flatRates, minimum: e.target.value } })}
                    endIcon={<span className="text-xs font-medium text-slate-300">€</span>}
                    helperText="Min. Vergütung pro Auftrag"
                />
            </div>
            <div className="col-span-12 md:col-span-6">
                <Input
                    label="Beglaubigungsgebühr"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="5.00"
                    value={formData.flatRates.cert}
                    onChange={e => updateFormData({ flatRates: { ...formData.flatRates, cert: e.target.value } })}
                    endIcon={<span className="text-xs font-medium text-slate-300">€</span>}
                    helperText="Pauschale pro Beglaubigungssatz"
                />
            </div>
        </div>
    </div>
);

export default PartnerRatesSection;
