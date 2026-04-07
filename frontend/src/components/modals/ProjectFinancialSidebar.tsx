import clsx from 'clsx';
import { FaCheckCircle, FaFileInvoiceDollar } from 'react-icons/fa';
import { Button } from '../ui/button';

export interface ProjectFinancialSidebarProps {
    creationDate: string;
    projectManager: string;
    baseNet: number;
    calcNet: number;
    calcTax: number;
    calcGross: number;
    totalPaid: number;
    remainingBalance: number;
    profit: number;
    profitMargin: number;
    isCertified: boolean;
    hasApostille: boolean;
    isExpress: boolean;
    classification: string;
    copies: number;
    copyPrice: string;
    isLocked?: boolean;
    onCreateInvoice?: () => void;
}

const ProjectFinancialSidebar = ({
    creationDate,
    projectManager,
    baseNet,
    calcNet,
    calcTax,
    calcGross,
    totalPaid,
    remainingBalance,
    profit,
    profitMargin,
    isCertified,
    hasApostille,
    isExpress,
    classification,
    copies,
    copyPrice,
    isLocked,
    onCreateInvoice,
}: ProjectFinancialSidebarProps) => (
    <div className="w-full lg:w-72 bg-white border border-slate-200 rounded-lg shadow-sm font-sans divide-y divide-slate-100 flex flex-col">
        {/* Section: Calculation */}
        <div className="p-5 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Kalkulation</h4>

            <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                    <span>Leistungen</span>
                    <span className="font-semibold">{baseNet.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>

                {/* Extras - Minimalist */}
                {(isCertified || hasApostille || isExpress || classification === 'ja' || copies > 0) && (
                    <div className="space-y-1.5 pl-1.5 border-l border-slate-100">
                        {isCertified && <div className="flex justify-between text-[10px] text-slate-400"><span>Beglaubigung</span><span>5,00 €</span></div>}
                        {hasApostille && <div className="flex justify-between text-[10px] text-slate-400"><span>Apostille</span><span>15,00 €</span></div>}
                        {isExpress && <div className="flex justify-between text-[10px] text-slate-400"><span>Express</span><span>15,00 €</span></div>}
                        {classification === 'ja' && <div className="flex justify-between text-[10px] text-slate-400"><span>Klassifizierung</span><span>15,00 €</span></div>}
                        {copies > 0 && <div className="flex justify-between text-[10px] text-slate-400"><span>Kopien ({copies}x)</span><span>{(copies * Number(copyPrice)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span></div>}
                    </div>
                )}
            </div>

            <div className="pt-3 space-y-1.5 border-t border-slate-50">
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Zwischensumme</span>
                    <span>{calcNet.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                    <span>MwSt. (19%)</span>
                    <span>{calcTax.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>
                <div className="flex justify-between items-baseline pt-2">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-tighter">Gesamt</span>
                    <span className="text-lg font-bold text-slate-900 tracking-tight tabular-nums">
                        {calcGross.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                </div>
            </div>
        </div>

        {/* Section: Payment Status */}
        <div className="p-5 space-y-3 bg-slate-50/30">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zahlung</span>
                {remainingBalance <= 0.01 && <FaCheckCircle className="text-emerald-500" size={12} />}
            </div>

            <div className="space-y-2">
                {totalPaid > 0 && (
                    <div className="flex justify-between text-[10px] font-medium text-emerald-600">
                        <span>Bereits bezahlt</span>
                        <span>-{totalPaid.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                    </div>
                )}

                <div className={clsx(
                    "flex flex-col gap-0.5 p-3 rounded-md border",
                    remainingBalance <= 0.01
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                        : "bg-white border-slate-100 text-slate-700"
                )}>
                    <span className="text-[10px] font-bold uppercase tracking-tight opacity-50">
                        Restbetrag
                    </span>
                    <span className="text-base font-bold tracking-tight">
                        {remainingBalance <= 0.01 ? 'ERLEDIGT' : `${remainingBalance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                    </span>
                </div>
            </div>
        </div>

        {/* Section: Profit */}
        <div className="p-5 space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Projektmarge</span>
                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", profit >= 0 ? "bg-slate-100 text-slate-600" : "bg-red-50 text-red-600")}>
                    {profitMargin.toFixed(1)}%
                </span>
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-800">
                    {profit.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                <div
                    className={clsx(
                        'h-full transition-all duration-700',
                        profitMargin > 40 ? 'bg-emerald-500' : profitMargin > 20 ? 'bg-slate-500' : 'bg-amber-400',
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}
                />
            </div>
        </div>

        {/* Footer: Metadata */}
        <div className="px-5 py-3 bg-slate-50/50 space-y-4">
            {!isLocked && onCreateInvoice && (
                <Button
                    onClick={onCreateInvoice}
                    className="w-full py-5 flex items-center justify-center gap-2"
                >
                    <FaFileInvoiceDollar />
                    Rechnung erstellen
                </Button>
            )}

            <div className="flex justify-between text-[10px] text-slate-400 font-medium italic">
                <span>Erstellt: {creationDate}</span>
                <span>PM: {projectManager}</span>
            </div>
        </div>
    </div>
);

export default ProjectFinancialSidebar;
