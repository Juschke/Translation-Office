import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { FaCalendarAlt, FaDownload, FaChartLine, FaEuroSign, FaPercentage, FaLayerGroup, FaUserTie, FaTasks } from 'react-icons/fa';
import KPICard from '../components/common/KPICard';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../api/services';
import ReportsSkeleton from '../components/common/ReportsSkeleton';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { de } from 'date-fns/locale';
import { useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';


registerLocale('de', de);

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

const Reports = () => {
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
        startOfMonth(subMonths(new Date(), 5)),
        endOfMonth(new Date())
    ]);
    const [startDate, endDate] = dateRange;

    const queryParams = {
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
    };

    const { data: summary, isLoading } = useQuery({
        queryKey: ['reports', 'summary', queryParams],
        queryFn: () => reportService.getSummary(queryParams)
    });

    const revenueDataPoints = summary?.revenue;
    const profitDataPoints = summary?.profit;
    const langDist = summary?.languages;
    const kpis = summary?.kpis;
    const customerStats = summary?.customers;
    const statusDist = summary?.status;

    if (isLoading) return <ReportsSkeleton />;

    const revenueData = {
        labels: revenueDataPoints?.labels || [],
        datasets: [
            {
                label: 'Umsatz (€)',
                data: revenueDataPoints?.data || [],
                borderColor: '#0d9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2,
            },
        ],
    };

    // Enhanced Language Data (Horizontal Bar for better readability of values)
    const langData = {
        labels: langDist?.labels || [],
        datasets: [
            {
                label: 'Umsatz (€)',
                data: langDist?.revenue || [], // Expecting backend to return revenue per language now, or count
                backgroundColor: '#0d9488',
                borderRadius: 4,
                barThickness: 20,
            },
        ],
    };

    const profitData = {
        labels: profitDataPoints?.labels || [],
        datasets: [
            {
                label: 'Marge %',
                data: profitDataPoints?.data || [],
                backgroundColor: '#cbd5e1',
                borderRadius: 4,
                hoverBackgroundColor: '#0d9488',
            }
        ]
    };

    const customerData = {
        labels: customerStats?.labels || [],
        datasets: [
            {
                label: 'Umsatz (€)',
                data: customerStats?.revenue || [],
                backgroundColor: '#3b82f6',
                borderRadius: 4,
                barThickness: 20,
            }
        ]
    };

    const statusData = {
        labels: statusDist?.labels || [],
        datasets: [
            {
                data: statusDist?.data || [],
                backgroundColor: ['#e2e8f0', '#fcd34d', '#3b82f6', '#10b981', '#ef4444'],
                borderWidth: 0,
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 12,
                titleFont: { size: 12, weight: 'bold' as const },
                bodyFont: { size: 12 },
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        const val = context.parsed.x !== undefined && context.datasetIndex === context.datasetIndex ? (context.chart.options.indexAxis === 'y' ? context.parsed.x : context.parsed.y) : context.parsed.y;
                        if (val !== null) {
                            label += new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                grid: { display: true, color: '#f1f5f9' },
                ticks: { font: { size: 10, weight: 'bold' as const }, color: '#64748b' }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 10, weight: 'bold' as const }, color: '#64748b' }
            }
        }
    };

    const horizontalOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: options.plugins.tooltip
        },
        scales: {
            x: { grid: { display: true, color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#64748b' } },
            y: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' as const }, color: '#334155' } }
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full fade-in pb-10">
            {/* Header with Date Picker */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Berichte & Analysen</h1>
                    <p className="text-slate-500 text-sm">Detaillierte Auswertung Ihrer Geschäftsdaten.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group z-20">
                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                        <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => setDateRange(update)}
                            isClearable={false}
                            locale="de"
                            dateFormat="dd.MM.yyyy"
                            className="pl-9 pr-3 py-2 border border-slate-300 rounded text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 w-[240px] cursor-pointer hover:border-brand-400 transition"
                            placeholderText="Zeitraum wählen"
                            maxDate={new Date()}
                        />
                    </div>
                    <button className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95">
                        <FaDownload className="text-xs" /> Export
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Gesamtumsatz" value={`${kpis?.revenue?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '0,00 €'}`} icon={<FaEuroSign />} iconColor="text-brand-700" iconBg="bg-brand-50" />
                <KPICard label="Netto-Marge Ø" value={`${kpis?.margin || 0} %`} icon={<FaPercentage />} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
                <KPICard label="Aufträge" value={`${kpis?.jobs || 0}`} icon={<FaLayerGroup />} iconColor="text-blue-600" iconBg="bg-blue-50" />
                <KPICard label="Wachstum" value={`${kpis?.growth > 0 ? '+' : ''}${kpis?.growth || 0}%`} icon={<FaChartLine />} iconColor="text-indigo-600" iconBg="bg-indigo-50" subValue="vs. Vorperiode" />
            </div>

            {/* Charts Section 1: Revenue & Profit */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <FaChartLine className="text-brand-500" /> Umsatzentwicklung
                        </h3>
                    </div>
                    <div className="h-[300px]">
                        <Line options={{ ...options, maintainAspectRatio: false }} data={revenueData} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <FaPercentage className="text-emerald-500" /> Marge
                        </h3>
                    </div>
                    <div className="h-[300px]">
                        <Bar options={{ ...options, maintainAspectRatio: false }} data={profitData} />
                    </div>
                </div>
            </div>

            {/* Charts Section 2: Top Lists & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Languages */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <FaTasks className="text-teal-500" /> Umsatz nach Sprache
                        </h3>
                    </div>
                    {langDist?.revenue?.length > 0 ? (
                        <div className="h-[300px]">
                            <Bar options={horizontalOptions} data={langData} />
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">Keine Daten verfügbar</div>
                    )}
                </div>

                {/* Top Customers */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <FaUserTie className="text-blue-500" /> Top Kunden (Umsatz)
                        </h3>
                    </div>
                    {customerStats?.revenue?.length > 0 ? (
                        <div className="h-[300px]">
                            <Bar options={horizontalOptions} data={customerData} />
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">Keine Daten verfügbar</div>
                    )}
                </div>

                {/* Status Distribution */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <FaLayerGroup className="text-indigo-500" /> Projekt Status
                        </h3>
                    </div>
                    <div className="h-[300px] flex items-center justify-center">
                        {statusDist?.data?.length > 0 ? (
                            <Doughnut data={statusData} options={{ maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', display: true, labels: { font: { size: 10 } } } } }} />
                        ) : (
                            <div className="text-slate-400 text-sm">Keine Daten verfügbar</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
