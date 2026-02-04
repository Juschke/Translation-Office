import { FaCreditCard, FaRegCheckCircle, FaRocket, FaFileInvoiceDollar, FaRegCalendarAlt, FaHistory } from 'react-icons/fa';
import clsx from 'clsx';

const Billing = () => {
    return (
        <div className="max-w-5xl mx-auto fade-in">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Abonnement & Abrechnung</h1>
                <p className="text-slate-500 text-sm">Verwalten Sie Ihren Plan, Zahlungsmethoden und laden Sie Belege herunter.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Plan */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative">
                        <div className="absolute top-4 right-4">
                            <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-widest rounded border border-brand-100">Aktueller Plan</span>
                        </div>
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded bg-brand-900 text-white flex items-center justify-center text-xl shadow-md">
                                    <FaRocket />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Enterprise Pro</h3>
                                    <p className="text-slate-500 text-xs">Für professionelle Übersetzungsbüros</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {[
                                    'Unbegrenzte Projekte',
                                    'Bis zu 50 Team-Mitglieder',
                                    'Advanced API Support',
                                    'Priority 24/7 Support',
                                    'Custom Branding',
                                    'Automatisierte Rechnungen'
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2.5 text-xs text-slate-600">
                                        <FaRegCheckCircle className="text-emerald-500 flex-none" />
                                        <span className="font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-slate-100">
                                <button className="w-full sm:w-auto px-6 py-2 bg-brand-700 text-white rounded text-sm font-medium hover:bg-brand-800 transition-all shadow-sm active:scale-95">
                                    Plan verwalten
                                </button>
                                <button className="w-full sm:w-auto px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-all">
                                    Paket upgraden
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-xs">
                                    <FaCreditCard />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Zahlungsmethode</h3>
                            </div>
                            <button className="text-[10px] font-bold text-brand-700 hover:underline uppercase tracking-wider">Hinzufügen</button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50/30 rounded border border-slate-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-white font-bold text-[8px] tracking-widest">
                                        VISA
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Visa •••• 4242</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Läuft ab: 12 / 2026</p>
                                    </div>
                                </div>
                                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold uppercase rounded">Standard</span>
                            </div>
                        </div>
                    </div>

                    {/* Billing History */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-xs">
                                <FaHistory />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Rechnungshistorie</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <th className="px-6 py-3 border-b border-slate-100">Datum</th>
                                        <th className="px-6 py-3 border-b border-slate-100">Beleg-Nr.</th>
                                        <th className="px-6 py-3 border-b border-slate-100 text-right">Betrag</th>
                                        <th className="px-6 py-3 border-b border-slate-100 text-center">Status</th>
                                        <th className="px-6 py-3 border-b border-slate-100"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[
                                        { date: '01. Feb 2024', id: 'INV-2024-002', amount: '129,00 €', status: 'Bezahlt' },
                                        { date: '01. Jan 2024', id: 'INV-2024-001', amount: '129,00 €', status: 'Bezahlt' },
                                    ].map((inv, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-xs text-slate-500 font-medium">{inv.date}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-800">{inv.id}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-800 text-right">{inv.amount}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded uppercase border border-emerald-200">{inv.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-400 hover:text-brand-700 transition-colors">
                                                    <FaFileInvoiceDollar className="text-sm" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-brand-900 rounded-lg p-6 text-white shadow-md relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-4">Nächste Abrechnung</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-lg">
                                    <FaRegCalendarAlt className="text-brand-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">01. März 2024</p>
                                    <p className="text-white/50 text-[10px] font-medium uppercase tracking-tight">Voraussichtlich 129,00 €</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded border border-white/10">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-white/70">
                                        <span>Team-Mitglieder</span>
                                        <span>12 / 50</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-500 w-[24%] transition-all duration-1000"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Subtle decorative element */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="bg-white rounded-lg p-6 border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Hilfe & Support</h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">Fragen zu Ihrer Rechnung oder Ihrem Abonnement? Unser Support hilft Ihnen gerne weiter.</p>
                        <button className="w-full py-2 bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-all">
                            Support kontaktieren
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Billing;
