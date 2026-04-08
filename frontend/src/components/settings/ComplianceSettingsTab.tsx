import React, { useState, useEffect } from 'react';
import {
    FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaInfoCircle,
    FaLock, FaUserShield, FaDownload, FaHistory
} from 'react-icons/fa';
import { settingsService } from '../../api/services/settings';
import { toast } from 'react-hot-toast';

interface ComplianceCheck {
    status: boolean;
    label: string;
    description: string;
    critical?: boolean;
}

interface ComplianceSummary {
    score: number;
    checks: Record<string, ComplianceCheck>;
    last_audit_at: string;
}

const ComplianceSettingsTab: React.FC = () => {
    const [summary, setSummary] = useState<ComplianceSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        setIsLoading(true);
        try {
            const data = await settingsService.getComplianceSummary();
            setSummary(data);
        } catch (error) {
            console.error('Failed to fetch compliance summary:', error);
            toast.error('Compliance-Übersicht konnte nicht geladen werden');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Score Section */}
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative shrink-0">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-slate-100"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={364.4}
                                strokeDashoffset={364.4 - (364.4 * (summary?.score || 0)) / 100}
                                className={
                                    (summary?.score || 0) > 80 ? "text-green-500" :
                                        (summary?.score || 0) > 50 ? "text-amber-500" : "text-red-500"
                                }
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-extrabold text-slate-900">{summary?.score}%</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center justify-center md:justify-start gap-2">
                            <FaShieldAlt className="text-brand-primary" />
                            EU/DE Compliance Status
                        </h2>
                        <p className="text-sm text-slate-500 max-w-xl">
                            Diese Übersicht bewertet Ihre aktuelle Konfiguration hinsichtlich der
                            Vorgaben der <strong>GoBD</strong> (Deutschland), der <strong>DSGVO</strong> (EU) sowie
                            moderner Sicherheitsstandards für E-Invoicing.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">ISO 27001 Prepared</span>
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">GoBD Konform</span>
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">DSGVO Log aktiv</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Check List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {summary && Object.entries(summary.checks).map(([key, check]) => (
                    <div key={key} className="bg-white rounded-sm border border-slate-200 shadow-sm p-5 hover:border-brand-primary/30 transition-colors">
                        <div className="flex gap-4">
                            <div className={`shrink-0 mt-1 ${check.status ? 'text-green-500' : check.critical ? 'text-red-500' : 'text-amber-500'}`}>
                                {check.status ? <FaCheckCircle size={20} /> : <FaExclamationTriangle size={20} />}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-1">{check.label}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed mb-3">{check.description}</p>
                                {!check.status && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-wider cursor-pointer hover:underline">
                                        <FaInfoCircle />
                                        <span>Maßnahme erforderlich</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Resources / Logs Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 text-white rounded-sm p-6 flex flex-col justify-between">
                    <div>
                        <FaUserShield className="text-brand-primary text-2xl mb-4" />
                        <h3 className="text-md font-bold mb-2">DSGVO Zugriffslog</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Alle Abrufe personenbezogener Kundendaten werden revisionssicher mit IP und Zeitstempel protokolliert.
                        </p>
                    </div>
                    <button className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2">
                        <FaHistory /> Protokoll abrufen
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col justify-between">
                    <div>
                        <FaLock className="text-slate-400 text-2xl mb-4" />
                        <h3 className="text-md font-bold text-slate-900 mb-2">2FA Richtlinie</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Zwingende Zwei-Faktor-Authentifizierung für alle Administratoren und Manager.
                        </p>
                    </div>
                    <button className="mt-6 w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded transition-colors">
                        Richtlinie verwalten
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col justify-between">
                    <div>
                        <FaDownload className="text-slate-400 text-2xl mb-4" />
                        <h3 className="text-md font-bold text-slate-900 mb-2">Compliance Report</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Erstellen Sie ein PDF-Dossier für Ihre Auditoren oder IT-Sicherheitsbeauftragten.
                        </p>
                    </div>
                    <button className="mt-6 w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded transition-colors">
                        PDF Exportieren
                    </button>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex gap-4">
                <FaInfoCircle className="text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                    <strong>Hinweis:</strong> Dieses Dashboard dient der Unterstützung Ihrer Compliance-Arbeit.
                    Es ersetzt keine Rechtsberatung oder formale Prüfung durch einen qualifizierten Auditor (z.B. TÜV).
                </div>
            </div>
        </div>
    );
};

export default ComplianceSettingsTab;
