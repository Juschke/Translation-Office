import clsx from 'clsx';
import { FaInfoCircle } from 'react-icons/fa';

interface ProjectFinancialSidebarProps {
    creationDate: string;
    projectManager: string;
    baseNet: number;
    extraCosts: number;
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
}

const ProjectFinancialSidebar = ({
    creationDate,
    projectManager,
    baseNet,
    extraCosts,
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
}: ProjectFinancialSidebarProps) => (
    <div className="w-full lg:w-80 bg-slate-50 shrink-0 h-auto lg:h-full lg:overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                <FaInfoCircle className="text-slate-400 text-xs" />
                <h4 className="text-xs font-medium text-slate-500">Meta Info</h4>
            </div>
            <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                    <span className="text-slate-500">Erstellt:</span>
                    <span className="font-medium text-slate-700">{creationDate}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Manager:</span>
                    <span className="font-medium text-slate-700">{projectManager}</span>
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-xs font-medium text-slate-400">Rechnungsvorschau</h4>
            <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex justify-between text-xs text-slate-500">
                    <span>Positionen Netto</span>
                    <span>{baseNet.toFixed(2)} €</span>
                </div>
                {isCertified && (
                    <div className="flex justify-between text-sm text-slate-400 pl-2">
                        <span>+ Beglaubigung</span>
                        <span>5,00 €</span>
                    </div>
                )}
                {hasApostille && (
                    <div className="flex justify-between text-sm text-slate-400 pl-2">
                        <span>+ Apostille</span>
                        <span>15,00 €</span>
                    </div>
                )}
                {isExpress && (
                    <div className="flex justify-between text-sm text-slate-400 pl-2">
                        <span>+ Express-Zuschlag</span>
                        <span>15,00 €</span>
                    </div>
                )}
                {classification === 'ja' && (
                    <div className="flex justify-between text-sm text-slate-400 pl-2">
                        <span>+ FS-Klassifizierung</span>
                        <span>15,00 €</span>
                    </div>
                )}
                {copies > 0 && (
                    <div className="flex justify-between text-sm text-slate-400 pl-2">
                        <span>+ Zusatzkopien ({copies}x)</span>
                        <span>{(copies * Number(copyPrice)).toFixed(2)} €</span>
                    </div>
                )}
                {extraCosts > 0 && <div className="border-t border-slate-50 my-1" />}
                <div className="pt-2 border-t border-slate-100 flex justify-between font-medium text-slate-800">
                    <span>Gesamt Netto</span>
                    <span>{calcNet.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                    <span>MwSt. 19%</span>
                    <span>{calcTax.toFixed(2)} €</span>
                </div>
                <div className="pt-2 border-t-2 border-slate-100 flex justify-between text-xl font-medium text-slate-900 transition-all">
                    <span>Gesamt</span>
                    <span>{calcGross.toFixed(2)} €</span>
                </div>
                {totalPaid > 0 && (
                    <div className="pt-2 flex justify-between text-xs text-emerald-600 font-medium border-t border-slate-50">
                        <span>Geleistete Zahlungen</span>
                        <span>-{totalPaid.toFixed(2)} €</span>
                    </div>
                )}
                <div className="pt-3 border-t border-slate-100 mt-2 flex justify-between items-center bg-slate-50 -mx-4 -mb-4 p-4 rounded-b">
                    <span className="text-sm font-medium text-slate-600 tracking-wider">Restbetrag</span>
                    <span className={clsx('text-lg font-medium', remainingBalance <= 0.01 ? 'text-emerald-600' : 'text-slate-900')}>
                        {remainingBalance <= 0.01 ? 'BEZAHLT' : `${remainingBalance.toFixed(2)} €`}
                    </span>
                </div>
            </div>

            <div className="bg-slate-100 p-4 rounded-sm border border-slate-200">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-slate-500 tracking-tight">Voraussichtl. Gewinn</span>
                    <span className={clsx('text-xs font-medium', profit >= 0 ? 'text-slate-800' : 'text-red-600')}>
                        {profit.toFixed(2)} €
                    </span>
                </div>
                <div className="w-full bg-slate-300 rounded-full h-2 overflow-hidden shadow-inner">
                    <div
                        className={clsx(
                            'h-full transition-all duration-500',
                            profitMargin > 40 ? 'bg-emerald-500' : profitMargin > 20 ? 'bg-slate-700' : 'bg-amber-500',
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}
                    />
                </div>
                <div className="text-right mt-1.5 text-xs font-medium text-slate-500">
                    {profitMargin.toFixed(1)}% Marge
                </div>
            </div>
        </div>
    </div>
);

export default ProjectFinancialSidebar;
