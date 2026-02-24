import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { FaCalendarAlt, FaChartLine, FaEuroSign, FaPercentage, FaLayerGroup, FaUserTie, FaTasks, FaTable, FaCalculator, FaFileInvoiceDollar, FaFilter } from 'react-icons/fa';
import KPICard from '../components/common/KPICard';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { reportService } from '../api/services';
import ReportsSkeleton from '../components/common/ReportsSkeleton';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { de } from 'date-fns/locale';
import { useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

registerLocale('de', de);

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

const fmt = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

const STATUS_COLORS = [
    '#e2e8f0', '#fcd34d', '#3b82f6', '#10b981', '#ef4444',
    '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6366f1', '#14b8a6',
];

const Reports = () => {
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
        startOfMonth(subMonths(new Date(), 5)),
        endOfMonth(new Date())
    ]);

    const [appliedDateRange, setAppliedDateRange] = useState(dateRange);
    const [startDate, endDate] = appliedDateRange;

    const queryParams = {
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
    };

    const [activeTab, setActiveTab] = useState<'analytics' | 'finance'>('analytics');
    const [financeSubTab, setFinanceSubTab] = useState<'tax' | 'profitability'>('tax');

    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: ['reports', 'summary', queryParams],
        queryFn: () => reportService.getSummary(queryParams),
        enabled: activeTab === 'analytics',
        staleTime: 5 * 60 * 1000,
    });

    const { data: taxData, isLoading: isTaxLoading } = useQuery({
        queryKey: ['reports', 'tax', queryParams],
        queryFn: () => reportService.getTaxReport(queryParams),
        enabled: activeTab === 'finance' && financeSubTab === 'tax',
        staleTime: 5 * 60 * 1000,
    });

    const { data: profitabilityData, isLoading: isProfitabilityLoading } = useQuery({
        queryKey: ['reports', 'profitability', queryParams],
        queryFn: () => reportService.getProfitabilityReport(queryParams),
        enabled: activeTab === 'finance' && financeSubTab === 'profitability',
        staleTime: 5 * 60 * 1000,
    });

    const isLoading = activeTab === 'analytics'
        ? isSummaryLoading
        : (financeSubTab === 'tax' ? isTaxLoading : isProfitabilityLoading);

    const kpis = summary?.kpis;
    const revenueDataPoints = summary?.revenue;
    const profitDataPoints = summary?.profit;
    const langDist = summary?.languages;
    const customerStats = summary?.customers;
    const statusDist = summary?.status;

    if (isLoading) return <ReportsSkeleton />;

    // ── Chart Data ──────────────────────────────────────────────────────────────

    const revenueData = {
        labels: revenueDataPoints?.labels ?? [],
        datasets: [{
            label: 'Umsatz',
            data: revenueDataPoints?.data ?? [],
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13, 148, 136, 0.08)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#0d9488',
            pointBorderWidth: 2,
        }],
    };

    const profitData = {
        labels: profitDataPoints?.labels ?? [],
        datasets: [{
            label: 'Marge',
            data: profitDataPoints?.data ?? [],
            backgroundColor: profitDataPoints?.data?.map((v: number) =>
                v >= 40 ? 'rgba(16,185,129,0.7)' : v >= 20 ? 'rgba(59,130,246,0.7)' : 'rgba(245,158,11,0.7)'
            ) ?? [],
            borderRadius: 4,
            hoverBackgroundColor: '#0d9488',
        }]
    };

    const langData = {
        labels: langDist?.labels ?? [],
        datasets: [{
            label: 'Umsatz',
            data: langDist?.revenue ?? [],
            backgroundColor: '#0d9488',
            borderRadius: 4,
            barThickness: 18,
        }],
    };

    const customerData = {
        labels: customerStats?.labels ?? [],
        datasets: [{
            label: 'Umsatz',
            data: customerStats?.revenue ?? [],
            backgroundColor: '#3b82f6',
            borderRadius: 4,
            barThickness: 18,
        }]
    };

    const statusData = {
        labels: statusDist?.labels ?? [],
        datasets: [{
            data: statusDist?.data ?? [],
            backgroundColor: STATUS_COLORS.slice(0, (statusDist?.data?.length ?? 0)),
            borderWidth: 0,
        }]
    };

    // ── Chart Options ────────────────────────────────────────────────────────────

    const baseTip = {
        backgroundColor: '#1e293b',
        padding: 10,
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 12 },
        cornerRadius: 6,
        displayColors: false,
    };

    const currencyTip = {
        ...baseTip,
        callbacks: {
            label: (ctx: any) => `${ctx.dataset.label}: ${fmt(ctx.parsed.y ?? 0)}`,
        }
    };

    const percentTip = {
        ...baseTip,
        callbacks: {
            label: (ctx: any) => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(1)} %`,
        }
    };

    const hCurrencyTip = {
        ...baseTip,
        callbacks: {
            label: (ctx: any) => `${ctx.dataset.label}: ${fmt(ctx.parsed.x ?? 0)}`,
        }
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: currencyTip },
        scales: {
            y: {
                grid: { color: '#f1f5f9' },
                ticks: {
                    font: { size: 10 }, color: '#64748b',
                    callback: (v: any) => fmt(v),
                }
            },
            x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#64748b' } }
        }
    };

    const barPctOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: percentTip },
        scales: {
            y: {
                grid: { color: '#f1f5f9' },
                ticks: { font: { size: 10 }, color: '#64748b', callback: (v: any) => `${v} %` }
            },
            x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#64748b' } }
        }
    };

    const horizontalOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: hCurrencyTip },
        scales: {
            x: {
                grid: { color: '#f1f5f9' },
                ticks: { font: { size: 10 }, color: '#64748b', callback: (v: any) => fmt(v) }
            },
            y: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' as const }, color: '#334155' } }
        }
    };

    const doughnutOptions = {
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
            legend: { position: 'bottom' as const, display: true, labels: { font: { size: 10 }, padding: 12 } },
            tooltip: { ...baseTip, callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed}` } }
        }
    };

    return (
        <div className="max-w-screen-xl mx-auto flex flex-col gap-5 pb-10 fade-in">
            {/* Header */}
            <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                <div className="min-w-0">
                    <h1 className="text-xl font-medium text-slate-800 truncate">Berichte & Analysen</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">Detaillierte Auswertung Ihrer Geschäftsdaten.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="relative z-20 flex-1 sm:flex-none">
                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                        <DatePicker
                            selectsRange
                            startDate={dateRange[0]}
                            endDate={dateRange[1]}
                            onChange={(update) => setDateRange(update)}
                            isClearable={false}
                            locale="de"
                            dateFormat="dd.MM.yyyy"
                            className="pl-9 pr-3 py-2 border border-slate-300 rounded text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-[240px] cursor-pointer hover:border-brand-400 transition"
                            placeholderText="Zeitraum wählen"
                            maxDate={new Date()}
                        />
                    </div>
                    <button
                        onClick={() => setAppliedDateRange(dateRange)}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center justify-center gap-2 transition shrink-0"
                    >
                        <FaFilter className="text-xs" /> <span className="hidden xs:inline">Anzeigen</span><span className="xs:hidden">Anzeigen</span>
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 self-start">
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={clsx(
                        "px-5 py-2 text-sm font-medium transition-all rounded-[1px] flex items-center gap-2",
                        activeTab === 'analytics' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <FaChartLine /> Grafische Analyse
                </button>
                <button
                    onClick={() => setActiveTab('finance')}
                    className={clsx(
                        "px-5 py-2 text-sm font-medium transition-all rounded-[1px] flex items-center gap-2",
                        activeTab === 'finance' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <FaCalculator /> Finanz-Auswertung (UStVA)
                </button>
            </div>

            {activeTab === 'analytics' ? (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            label="Gesamtumsatz"
                            value={fmt(kpis?.revenue ?? 0)}
                            icon={<FaEuroSign />}
                            iconColor="text-slate-900"
                        />
                        <KPICard
                            label="Netto-Marge Ø"
                            value={`${kpis?.margin ?? 0} %`}
                            icon={<FaPercentage />}
                            iconColor="text-emerald-600"
                        />
                        <KPICard
                            label="Aufträge"
                            value={`${kpis?.jobs ?? 0}`}
                            icon={<FaLayerGroup />}
                            iconColor="text-blue-600"
                        />
                        <KPICard
                            label="Wachstum"
                            value={`${(kpis?.growth ?? 0) > 0 ? '+' : ''}${kpis?.growth ?? 0} %`}
                            icon={<FaChartLine />}
                            iconColor="text-indigo-600"
                            subValue="vs. Vorperiode"
                        />
                    </div>

                    {/* Row 1: Revenue (large) + Margin (small) */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        <div className="lg:col-span-3 bg-white p-5 rounded-sm shadow-sm border border-slate-200">
                            <h3 className="text-xs font-medium text-slate-600 flex items-center gap-2 mb-4">
                                <FaChartLine className="text-slate-600" /> Umsatzentwicklung
                            </h3>
                            <div className="h-[240px]">
                                <Line options={lineOptions} data={revenueData} />
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-white p-5 rounded-sm shadow-sm border border-slate-200">
                            <h3 className="text-xs font-medium text-slate-600 flex items-center gap-2 mb-4">
                                <FaPercentage className="text-emerald-500" /> Marge pro Monat
                            </h3>
                            <div className="h-[240px]">
                                <Bar options={barPctOptions} data={profitData} />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Language + Customer + Status */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="bg-white p-5 rounded-sm shadow-sm border border-slate-200">
                            <h3 className="text-xs font-medium text-slate-600 flex items-center gap-2 mb-4">
                                <FaTasks className="text-teal-500" /> Umsatz nach Sprache
                            </h3>
                            {(langDist?.revenue?.length ?? 0) > 0 ? (
                                <div className="h-[260px]">
                                    <Bar options={horizontalOptions} data={langData} />
                                </div>
                            ) : (
                                <EmptyChart />
                            )}
                        </div>

                        <div className="bg-white p-5 rounded-sm shadow-sm border border-slate-200">
                            <h3 className="text-xs font-medium text-slate-600 flex items-center gap-2 mb-4">
                                <FaUserTie className="text-blue-500" /> Top Kunden (Umsatz)
                            </h3>
                            {(customerStats?.revenue?.length ?? 0) > 0 ? (
                                <div className="h-[260px]">
                                    <Bar options={horizontalOptions} data={customerData} />
                                </div>
                            ) : (
                                <EmptyChart />
                            )}
                        </div>

                        <div className="bg-white p-5 rounded-sm shadow-sm border border-slate-200">
                            <h3 className="text-xs font-medium text-slate-600 flex items-center gap-2 mb-4">
                                <FaLayerGroup className="text-indigo-500" /> Projektstatus
                            </h3>
                            {(statusDist?.data?.length ?? 0) > 0 ? (
                                <div className="h-[260px]">
                                    <Doughnut data={statusData} options={doughnutOptions} />
                                </div>
                            ) : (
                                <EmptyChart />
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-5">
                    {/* Finance Table */}
                    <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-transparent">
                            <div>
                                <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                                    <FaFileInvoiceDollar className="text-slate-700" /> Finanz-Berichte
                                </h3>
                                <div className="flex gap-4 mt-2">
                                    <button
                                        onClick={() => setFinanceSubTab('tax')}
                                        className={clsx(
                                            "text-xs font-semibold pb-1 border-b-2 transition-all",
                                            financeSubTab === 'tax' ? "text-slate-700 border-slate-900" : "text-slate-400 border-transparent hover:text-slate-600"
                                        )}
                                    >
                                        USt.-Voranmeldung
                                    </button>
                                    <button
                                        onClick={() => setFinanceSubTab('profitability')}
                                        className={clsx(
                                            "text-xs font-semibold pb-1 border-b-2 transition-all",
                                            financeSubTab === 'profitability' ? "text-slate-700 border-slate-900" : "text-slate-400 border-transparent hover:text-slate-600"
                                        )}
                                    >
                                        Rentabilitäts-Analyse
                                    </button>
                                </div>
                            </div>
                            <button className="text-xs font-semibold text-slate-700 hover:underline flex items-center gap-2">
                                <FaTable /> DATEV XML Export
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            {financeSubTab === 'tax' ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-xs font-semibold text-slate-500 border-b border-slate-200">
                                            <th className="px-5 py-3">Monat</th>
                                            <th className="px-5 py-3 text-right">Umsatz 19% (Netto)</th>
                                            <th className="px-5 py-3 text-right">USt 19%</th>
                                            <th className="px-5 py-3 text-right">Umsatz 7% (Netto)</th>
                                            <th className="px-5 py-3 text-right">USt 7%</th>
                                            <th className="px-5 py-3 text-right">Reverse Charge / EU</th>
                                            <th className="px-5 py-3 text-right border-l border-slate-100 bg-emerald-50/30">Vorsteuer (Schätzung)</th>
                                            <th className="px-5 py-3 text-right bg-slate-100/50">Zahllast</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {taxData?.map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3 text-xs font-semibold text-slate-900">{row.label}</td>
                                                <td className="px-5 py-3 text-xs font-medium text-slate-700 text-right tabular-nums">{fmtNum(row.revenue_19_net)}</td>
                                                <td className="px-5 py-3 text-xs font-semibold text-slate-700 text-right tabular-nums">{fmtNum(row.revenue_19_tax)}</td>
                                                <td className="px-5 py-3 text-xs font-medium text-slate-700 text-right tabular-nums">{fmtNum(row.revenue_7_net)}</td>
                                                <td className="px-5 py-3 text-xs font-semibold text-slate-700 text-right tabular-nums">{fmtNum(row.revenue_7_tax)}</td>
                                                <td className="px-5 py-3 text-xs font-medium text-slate-500 text-right tabular-nums">{fmtNum(row.revenue_reverse_charge)}</td>
                                                <td className="px-5 py-3 text-xs font-semibold text-emerald-600 text-right tabular-nums border-l border-slate-100 bg-emerald-50/20">
                                                    -{fmtNum(row.input_tax_est)}
                                                </td>
                                                <td className={clsx(
                                                    "px-5 py-3 text-xs font-semibold text-right tabular-nums bg-transparent",
                                                    row.payable_tax >= 0 ? "text-slate-900" : "text-emerald-700"
                                                )}>
                                                    {fmtNum(row.payable_tax)}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!taxData || taxData.length === 0) && (
                                            <tr>
                                                <td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-sm">Keine Finanzdaten für diesen Zeitraum vorhanden.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {taxData && taxData.length > 0 && (
                                        <tfoot className="bg-slate-900 text-white font-semibold text-xs">
                                            <tr>
                                                <td className="px-5 py-3">Gesamt</td>
                                                <td className="px-5 py-3 text-right">{fmtNum(taxData.reduce((a: number, r: any) => a + r.revenue_19_net, 0))}</td>
                                                <td className="px-5 py-3 text-right">{fmtNum(taxData.reduce((a: number, r: any) => a + r.revenue_19_tax, 0))}</td>
                                                <td className="px-5 py-3 text-right">{fmtNum(taxData.reduce((a: number, r: any) => a + r.revenue_7_net, 0))}</td>
                                                <td className="px-5 py-3 text-right">{fmtNum(taxData.reduce((a: number, r: any) => a + r.revenue_7_tax, 0))}</td>
                                                <td className="px-5 py-3 text-right">{fmtNum(taxData.reduce((a: number, r: any) => a + r.revenue_reverse_charge, 0))}</td>
                                                <td className="px-5 py-3 text-right border-l border-slate-700">-{fmtNum(taxData.reduce((a: number, r: any) => a + r.input_tax_est, 0))}</td>
                                                <td className="px-5 py-3 text-right bg-slate-900">{fmtNum(taxData.reduce((a: number, r: any) => a + r.payable_tax, 0))}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-xs font-semibold text-slate-500 border-b border-slate-200">
                                            <th className="px-5 py-3">Projekt / Kunde</th>
                                            <th className="px-5 py-3">Datum</th>
                                            <th className="px-5 py-3 text-right">Umsatz (Netto)</th>
                                            <th className="px-5 py-3 text-right">Kosten (Netto)</th>
                                            <th className="px-5 py-3 text-right">Gewinn</th>
                                            <th className="px-5 py-3 text-right">Marge</th>
                                            <th className="px-5 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {profitabilityData?.map((row: any) => (
                                            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3">
                                                    <p className="text-xs font-semibold text-slate-900">{row.project_number}</p>
                                                    <p className="text-xs font-medium text-slate-400 mt-0.5">{row.customer}</p>
                                                </td>
                                                <td className="px-5 py-3 text-xs text-slate-500 tabular-nums">{row.date}</td>
                                                <td className="px-5 py-3 text-xs font-medium text-slate-700 text-right tabular-nums">{fmtNum(row.revenue ?? 0)}</td>
                                                <td className="px-5 py-3 text-xs font-medium text-red-500/70 text-right tabular-nums">-{fmtNum(row.cost ?? 0)}</td>
                                                <td className="px-5 py-3 text-xs font-semibold text-emerald-600 text-right tabular-nums">{fmtNum(row.profit ?? 0)}</td>
                                                <td className="px-5 py-3 text-right tabular-nums">
                                                    <span className={clsx(
                                                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                                                        (row.margin ?? 0) >= 30 ? "bg-emerald-100 text-emerald-700"
                                                            : (row.margin ?? 0) >= 15 ? "bg-blue-100 text-blue-700"
                                                                : "bg-amber-100 text-amber-700"
                                                    )}>
                                                        {row.margin ?? 0} %
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={clsx(
                                                        "text-xs font-semibold px-2 py-0.5 rounded-sm",
                                                        row.status === 'completed' || row.status === 'invoiced'
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : row.status === 'delivery'
                                                                ? "bg-blue-100 text-blue-700"
                                                                : "bg-slate-100 text-slate-500"
                                                    )}>
                                                        {row.status_label ?? row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!profitabilityData || profitabilityData.length === 0) && (
                                            <tr>
                                                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">Keine Projektdaten für diesen Zeitraum vorhanden.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {profitabilityData && profitabilityData.length > 0 && (() => {
                                        const totalRev = profitabilityData.reduce((a: number, r: any) => a + (r.revenue ?? 0), 0);
                                        const totalCost = profitabilityData.reduce((a: number, r: any) => a + (r.cost ?? 0), 0);
                                        const totalProfit = profitabilityData.reduce((a: number, r: any) => a + (r.profit ?? 0), 0);
                                        const avgMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 100) : 0;
                                        return (
                                            <tfoot className="bg-slate-900 text-white font-semibold text-xs">
                                                <tr>
                                                    <td colSpan={2} className="px-5 py-3">Gesamt ({profitabilityData.length} Projekte)</td>
                                                    <td className="px-5 py-3 text-right">{fmtNum(totalRev)}</td>
                                                    <td className="px-5 py-3 text-right">-{fmtNum(totalCost)}</td>
                                                    <td className="px-5 py-3 text-right bg-slate-900">{fmtNum(totalProfit)}</td>
                                                    <td className="px-5 py-3 text-right">{avgMargin} %</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        );
                                    })()}
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-white p-5 border border-slate-200 rounded-sm">
                            <h4 className="text-sm font-medium text-slate-900 mb-3">Hinweise zur UStVA</h4>
                            <ul className="space-y-2.5 text-xs text-slate-500">
                                <li className="flex gap-2">
                                    <span className="text-slate-700 font-semibold shrink-0">1.</span>
                                    Die Zahllast berechnet sich aus der Summe der vereinnahmten Umsatzsteuer abzüglich der gezahlten Vorsteuer.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-slate-700 font-semibold shrink-0">2.</span>
                                    Reverse Charge Umsätze (innergemeinschaftliche Leistungen) sind im Inland steuerfrei, müssen aber in der UStVA gemeldet werden.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-slate-700 font-semibold shrink-0">3.</span>
                                    Die Vorsteuer wird aktuell basierend auf den Projektkosten mit 19% geschätzt, solange keine expliziten Eingangsrechnungen erfasst sind.
                                </li>
                            </ul>
                        </div>
                        <div className="bg-sky-50 p-5 border border-sky-100 rounded-sm flex flex-col justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-sky-900 mb-2">Finanzamt Export</h4>
                                <p className="text-xs text-sky-700 leading-relaxed">
                                    Sie können diese Daten direkt für Ihre monatliche oder vierteljährliche Umsatzsteuer-Voranmeldung verwenden. Ein direkter Elster-Export ist in Vorbereitung.
                                </p>
                            </div>
                            <button className="mt-5 w-full bg-sky-600 text-white py-2 rounded-sm text-sm font-medium hover:bg-sky-700 transition">
                                PDF Finanzbericht erstellen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const EmptyChart = () => (
    <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">
        Keine Daten für diesen Zeitraum
    </div>
);

const fmtNum = (v: number) =>
    (v ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export default Reports;
