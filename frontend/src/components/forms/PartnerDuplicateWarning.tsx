import { FaExclamationTriangle, FaExternalLinkAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface PartnerDuplicateWarningProps {
    duplicates: any[];
    ignoreDuplicates?: boolean;
    onIgnoreDuplicatesChange?: (ignore: boolean) => void;
}

const PartnerDuplicateWarning = ({ duplicates, ignoreDuplicates, onIgnoreDuplicatesChange }: PartnerDuplicateWarningProps) => {
    if (duplicates.length === 0) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm mb-6 flex gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <FaExclamationTriangle className="text-amber-500 shrink-0 mt-1" size={18} />
            <div className="flex-1">
                <p className="text-amber-800 text-[11px] font-medium italic">
                    Es wurden bereits Partner mit ähnlichen Daten gefunden. Falls es sich um eine andere Person handelt, bestätigen Sie dies unten.
                </p>
                <div className="mt-3 space-y-2">
                    {duplicates.map((d: any) => (
                        <div key={d.id} className="flex items-center justify-between bg-white p-2 rounded border border-amber-100 shadow-sm transition-all hover:border-amber-300">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                                    {d.company || `${d.first_name} ${d.last_name}`}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium tracking-wide italic">
                                    ID: {d.id} • {d.email || d.emails?.[0] || 'Keine E-Mail'} • {d.phone || d.phones?.[0] || 'Kein Telefon'}
                                </span>
                            </div>
                            <Link
                                to={`/partners?id=${d.id}`}
                                target="_blank"
                                className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-600 rounded text-[10px] font-bold hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                            >
                                <FaExternalLinkAlt size={10} />
                                PROFIL ÖFFNEN
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200 flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={ignoreDuplicates}
                            onChange={(e) => onIgnoreDuplicatesChange?.(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
                        <span className="ms-3 text-[11px] font-bold text-amber-900 uppercase tracking-wide">Trotzdem als neuen Datensatz anlegen</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default PartnerDuplicateWarning;
