import clsx from 'clsx';
import { FaFileInvoiceDollar } from 'react-icons/fa';
import { Button } from '../ui/button';

export interface ProjectFinancialSidebarProps {
    baseNet: number;
    calcNet: number;
    calcTax: number;
    calcGross: number;
    totalPaid: number;
    remainingBalance: number;
    isCertified: boolean;
    certifiedQty?: number;
    hasApostille: boolean;
    apostilleQty?: number;
    isExpress: boolean;
    expressQty?: number;
    classification: string;
    classificationQty?: number;
    copies: number;
    copyPrice: string;
    isLocked?: boolean;
    onCreateInvoice?: () => void;
    onPreviewInvoice?: () => void;
}

const ProjectFinancialSidebar = ({
    baseNet,
    calcNet,
    calcTax,
    calcGross,
    totalPaid,
    remainingBalance,
    isCertified,
    certifiedQty = 1,
    hasApostille,
    apostilleQty = 1,
    isExpress,
    expressQty = 1,
    classification,
    classificationQty = 1,
    copies,
    copyPrice,
    isLocked,
    onCreateInvoice,
    onPreviewInvoice,
}: ProjectFinancialSidebarProps) => (
    <div className="w-full lg:w-80 shrink-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        {/* Main Financial Card with Integrated Action */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 pb-2 border-b border-slate-100">Kalkulation</h4>
            
            <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                    <span>Positionen Netto</span>
                    <span>{baseNet.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>

                {(isCertified || hasApostille || isExpress || classification === 'ja' || copies > 0) && (
                    <div className="space-y-1.5 pl-2 border-l border-slate-100">
                        {isCertified && (
                            <div className="flex justify-between text-slate-400 italic">
                                <span>+ Beglaubigung {certifiedQty > 1 ? `(${certifiedQty}×)` : ''}</span>
                                <span>{(certifiedQty * 5).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                            </div>
                        )}
                        {hasApostille && (
                            <div className="flex justify-between text-slate-400 italic">
                                <span>+ Apostille {apostilleQty > 1 ? `(${apostilleQty}×)` : ''}</span>
                                <span>{(apostilleQty * 25).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                            </div>
                        )}
                        {isExpress && (
                            <div className="flex justify-between text-slate-400 italic">
                                <span>+ Express {expressQty > 1 ? `(${expressQty}×)` : ''}</span>
                                <span>{(expressQty * 15).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                            </div>
                        )}
                        {classification === 'ja' && (
                            <div className="flex justify-between text-slate-400 italic">
                                <span>+ Klassifizierung {classificationQty > 1 ? `(${classificationQty}×)` : ''}</span>
                                <span>{(classificationQty * 15).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                            </div>
                        )}
                        {copies > 0 && (
                            <div className="flex justify-between text-slate-400 italic">
                                <span>+ Kopien ({copies}×)</span>
                                <span>{(copies * Number(copyPrice)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex justify-between font-medium text-slate-800">
                    <span>Gesamt Netto</span>
                    <span>{calcNet.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>

                <div className="flex justify-between text-slate-400">
                    <span>MwSt. (19%)</span>
                    <span>{calcTax.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>

                <div className="pt-2 border-t-2 border-slate-100 flex justify-between text-lg font-bold text-slate-900 tracking-tight">
                    <span>Gesamt</span>
                    <span>{calcGross.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>

                {totalPaid > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold italic pt-1">
                        <span>Bezahlt</span>
                        <span>-{totalPaid.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                    </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center mb-4">
                    <span className="text-sm font-semibold text-slate-600 uppercase tracking-tighter">Restbetrag</span>
                    <span className={clsx(
                        "text-base font-black",
                        remainingBalance <= 0.01 ? "text-emerald-600" : "text-slate-900"
                    )}>
                        {remainingBalance <= 0.01 ? 'ERLEDIGT' : `${remainingBalance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                    </span>
                </div>

                {/* Primary Action Button Integrated Here */}
                <div className="pt-4 border-t border-slate-100">
                    {!isLocked ? (
                        onCreateInvoice && (
                            <Button
                                onClick={onCreateInvoice}
                                className="w-full px-4 py-2.5 text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] bg-brand-primary text-white"
                            >
                                <FaFileInvoiceDollar className="text-base" />
                                Rechnung erstellen
                            </Button>
                        )
                    ) : (
                        onPreviewInvoice && (
                            <Button
                                onClick={onPreviewInvoice}
                                className="w-full px-4 py-2.5 text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] bg-brand-primary text-white"
                            >
                                <FaFileInvoiceDollar className="text-base" />
                                Rechnung öffnen
                            </Button>
                        )
                    )}
                </div>
            </div>
        </div>

        {/* Profit Card - Disabled as requested
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Gewinn</span>
                <span className={clsx("text-xs font-bold", profit >= 0 ? "text-slate-800" : "text-red-600")}>
                    {profit.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                    className={clsx(
                        'h-full transition-all duration-700',
                        profitMargin > 40 ? 'bg-emerald-500' : profitMargin > 20 ? 'bg-slate-700' : 'bg-amber-400',
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}
                />
            </div>
            <div className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profitMargin.toFixed(1)}% Marge</div>
        </div>
        */}
    </div>
);

export default ProjectFinancialSidebar;
