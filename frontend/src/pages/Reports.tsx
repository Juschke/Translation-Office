import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { FaCalendarAlt, FaDownload, FaChartLine, FaEuroSign, FaPercentage, FaLayerGroup } from 'react-icons/fa';
import KPICard from '../components/common/KPICard';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../api/services';
import ReportsSkeleton from '../components/common/ReportsSkeleton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

const Reports = () => {
    const { data: revenueDataPoints, isLoading: isRevenueLoading } = useQuery({ queryKey: ['reports', 'revenue'], queryFn: () => reportService.getRevenue() });
    const { data: profitDataPoints, isLoading: isProfitLoading } = useQuery({ queryKey: ['reports', 'profit'], queryFn: () => reportService.getProfitMargin() });
    const { data: langDist, isLoading: isLangLoading } = useQuery({ queryKey: ['reports', 'languages'], queryFn: reportService.getLanguageDistribution });
    const { data: kpis, isLoading: isKpiLoading } = useQuery({ queryKey: ['reports', 'kpis'], queryFn: reportService.getKPIs });

    const isLoading = isRevenueLoading || isProfitLoading || isLangLoading || isKpiLoading;

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

    const langData = {
        labels: langDist?.labels || [],
        datasets: [
            {
                data: langDist?.data || [],
                backgroundColor: ['#0d9488', '#14b8a6', '#5eead4', '#99f6e4', '#ccfbf1'],
                hoverOffset: 10,
                borderWidth: 2,
                borderColor: '#ffffff'
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

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 12,
                titleFont: { size: 12, weight: 'bold' as const },
                bodyFont: { size: 12 },
                cornerRadius: 8,
                displayColors: false
            }
        },
        scales: {
            y: {
                grid: {
                    display: true,
                    color: '#f1f5f9'
                },
                ticks: {
                    font: { size: 10, weight: 'bold' as const },
                    color: '#64748b'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: { size: 10, weight: 'bold' as const },
                    color: '#64748b'
                }
            }
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Berichte & Analysen</h1>
                    <p className="text-slate-500 text-sm">Visuelle Auswertung Ihrer Geschäftsdaten und Performance.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-sm bg-white flex items-center gap-2 transition">
                        <FaCalendarAlt className="text-xs text-slate-400" /> Letzte 6 Monate
                    </button>
                    <button className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95">
                        <FaDownload className="text-xs" /> Report Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard label="Gesamtumsatz" value={`${kpis?.revenue?.toLocaleString('de-DE') || 0} €`} icon={<FaEuroSign />} iconColor="text-brand-700" iconBg="bg-brand-50" />
                <KPICard label="Netto-Marge Ø" value={`${kpis?.margin || 0} %`} icon={<FaPercentage />} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
                <KPICard label="Aufträge" value={`${kpis?.jobs || 0}`} icon={<FaLayerGroup />} iconColor="text-blue-600" iconBg="bg-blue-50" />
                <KPICard label="Wachstum" value={`${kpis?.growth > 0 ? '+' : ''}${kpis?.growth || 0}%`} icon={<FaChartLine />} iconColor="text-indigo-600" iconBg="bg-indigo-50" subValue="vs. Vorjahreszeitraum" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Umsatzentwicklung</h3>
                            <span className="text-xs text-slate-400 font-medium italic">Gesamtbetrag in €</span>
                        </div>
                        <div className="h-[300px]">
                            <Line options={{ ...options, maintainAspectRatio: false }} data={revenueData} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Durchschnittliche Marge</h3>
                            <span className="text-xs text-slate-400 font-medium italic">Berechnet nach Partnerkosten</span>
                        </div>
                        <div className="h-[200px]">
                            <Bar options={{ ...options, maintainAspectRatio: false }} data={profitData} />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-full">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-8">Umsatz nach Sprachen</h3>
                        <div className="flex flex-col items-center">
                            <div className="w-full max-w-[200px] aspect-square relative mb-8">
                                <Doughnut data={langData} options={{ cutout: '75%', plugins: { legend: { display: false } } }} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold text-slate-800">{kpis?.jobs || 0}</span>
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Jobs</span>
                                </div>
                            </div>
                            <div className="w-full space-y-3">
                                {langData.labels.map((label: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: langData.datasets[0].backgroundColor[i] }}></div>
                                            <span className="text-xs font-medium text-slate-600">{label}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-800">{langData.datasets[0].data[i]}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
