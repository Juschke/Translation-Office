import React from 'react';
import { getFlagUrl } from '@/utils/flags';

interface GuestProjectDetailsProps {
    project: any;
}

const formatCurrency = (amount: any, currency: string = 'EUR') => {
    const val = parseFloat(amount);
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency
    }).format(isNaN(val) ? 0 : val);
};

export const GuestProjectDetails: React.FC<GuestProjectDetailsProps> = ({ project }) => {
    return (
        <div className="rounded-sm border border-slate-200 shadow-sm bg-white overflow-hidden">
            {/* Sprachen Section */}
            <div className="px-4 sm:px-6 py-5 border-b border-slate-200">
                <h3 className="text-xs font-semibold text-slate-600 mb-4">Sprachrichtung</h3>
                <div className="flex items-center justify-center gap-4 p-4 rounded-sm">
                    <div className="flex items-center gap-2">
                        <img
                            src={getFlagUrl(project.source_lang?.iso_code || 'de')}
                            className="w-8 h-6 rounded-sm shadow-sm"
                            alt={project.source_lang?.name_native}
                        />
                        <span className="text-sm font-medium text-slate-700">
                            {project.source_lang?.name_native || project.source_lang?.name_internal || 'Deutsch'}
                        </span>
                    </div>
                    <span className="text-2xl text-slate-400">→</span>
                    <div className="flex items-center gap-2">
                        <img
                            src={getFlagUrl(project.target_lang?.iso_code || 'en')}
                            className="w-8 h-6 rounded-sm shadow-sm"
                            alt={project.target_lang?.name_native}
                        />
                        <span className="text-sm font-medium text-slate-700">
                            {project.target_lang?.name_native || project.target_lang?.name_internal || 'Englisch'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Beschreibung */}
            {project.description && (
                <div className="px-4 sm:px-6 py-5 border-b border-slate-200">
                    <h3 className="text-xs font-semibold text-slate-600 mb-3">Beschreibung</h3>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {project.description}
                    </p>
                </div>
            )}

            {/* Kostenaufstellung */}
            {project.role === 'customer' && project.price_total > 0 && (
                <div className="px-4 sm:px-6 py-5">
                    <h3 className="text-xs font-semibold text-slate-600 mb-4">Kostenaufstellung</h3>
                    <div className="space-y-2">
                        {project.positions && project.positions.length > 0 ? (
                            project.positions.map((pos: any, idx: number) => (
                                <div key={pos.id || idx} className="flex justify-between items-start text-sm pb-3 border-b border-slate-100 last:border-0">
                                    <div className="flex-1">
                                        <span className="text-slate-700 font-medium">{pos.description || pos.name || 'Dienstleistung'}</span>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            {parseFloat(pos.amount || pos.quantity || 0).toFixed(2)} × {parseFloat(pos.quantity || pos.amount || 1).toFixed(2)} {pos.unit || ''}
                                        </div>
                                    </div>
                                    <span className="font-medium text-slate-900 ml-4">{formatCurrency(pos.customer_total || pos.total_price, project.currency)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-between text-sm pb-2 border-b border-slate-100">
                                <span className="text-slate-700 italic">Pauschalpreis</span>
                                <span className="font-medium text-slate-900">{formatCurrency(project.price_total, project.currency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold pt-3 border-t-2 border-slate-200">
                            <span className="text-slate-900">Gesamtbetrag (Netto)</span>
                            <span className="text-[#1B4D4F] text-lg">{formatCurrency(project.price_total, project.currency)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
