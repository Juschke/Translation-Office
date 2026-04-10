import clsx from 'clsx';
import { FaStar } from 'react-icons/fa';
import Input from '../common/Input';
import type { PartnerFormData } from './partnerTypes';

interface PartnerInternalSectionProps {
    formData: PartnerFormData;
    updateFormData: (patch: Partial<PartnerFormData>) => void;
}

const PartnerInternalSection = ({ formData, updateFormData }: PartnerInternalSectionProps) => (
    <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
            <div className="w-6 h-6 rounded-sm bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-semibold">07</div>
            <h4 className="text-xs font-semibold text-slate-800">Interne Akte & Notizen</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Input
                    isSelect
                    label="Basis-Status"
                    className="font-medium"
                    value={formData.status}
                    onChange={e => updateFormData({ status: e.target.value })}
                >
                    <option value="available">Verfügbar / Aktiv</option>
                    <option value="busy">Derzeit ausgelastet</option>
                    <option value="vacation">Urlaub / Abwesend</option>
                    <option value="blacklisted">Gesperrt / Blacklist</option>
                </Input>
            </div>
            <div className="space-y-4">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Bewertung / Ranking</label>
                <div className="flex items-center gap-3 h-11 bg-white">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => updateFormData({ rating: star })}
                            className={clsx('transition-all hover:scale-125', formData.rating >= star ? 'text-amber-400' : 'text-slate-200')}
                        >
                            <FaStar size={24} />
                        </button>
                    ))}
                    <span className="ml-2 text-xs font-semibold text-slate-600">{formData.rating}.0</span>
                </div>
            </div>
            <div className="col-span-2">
                <Input
                    label="Interne Notizen"
                    isTextArea
                    placeholder="Interne Anmerkungen / Erfahrungen / Feedback (nur für Admins sichtbar)..."
                    value={formData.notes}
                    onChange={(e) => updateFormData({ notes: e.target.value })}
                />
            </div>
            <div className="col-span-2 flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-sm">
                <input
                    type="checkbox"
                    id="portal_access"
                    checked={formData.portal_access || false}
                    onChange={(e) => updateFormData({ portal_access: e.target.checked })}
                    className="w-4 h-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary"
                />
                <label htmlFor="portal_access" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Portalzugang für diesen Partner aktivieren
                </label>
            </div>
        </div>
    </div>
);

export default PartnerInternalSection;
