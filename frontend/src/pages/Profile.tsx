import { FaUser, FaEnvelope, FaCamera, FaKey, FaGlobe } from 'react-icons/fa';

const Profile = () => {
    return (
        <div className="max-w-4xl mx-auto fade-in">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Mein Profil</h1>
                <p className="text-slate-500 text-sm">Verwalten Sie Ihre persönlichen Informationen und Sicherheitseinstellungen.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Avatar & Quick Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="h-20 bg-brand-900"></div>
                        <div className="px-6 pb-6 text-center">
                            <div className="relative -mt-10 mb-4 inline-block">
                                <div className="w-20 h-20 rounded-lg bg-white p-1 shadow-md mx-auto">
                                    <div className="w-full h-full rounded bg-slate-100 flex items-center justify-center text-2xl font-bold text-brand-700 border border-slate-100 uppercase">
                                        JD
                                    </div>
                                </div>
                                <button className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-7 h-7 rounded-full bg-brand-700 text-white flex items-center justify-center shadow-lg hover:bg-brand-800 transition-colors border-2 border-white">
                                    <FaCamera className="text-[10px]" />
                                </button>
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">John Doe</h2>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">System Administrator</p>

                            <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-3">
                                <div className="flex items-center text-sm text-slate-600">
                                    <FaEnvelope className="w-4 mr-3 text-slate-400" />
                                    <span className="truncate">john@translater.office</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <FaGlobe className="w-4 mr-3 text-slate-400" />
                                    <span>Deutsch (DE)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Account Status</h3>
                        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded border border-emerald-100">
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-tight">Aktiv</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Forms */}
                <div className="md:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                            <div className="w-7 h-7 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-xs">
                                <FaUser />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Persönliche Daten</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vorname</label>
                                <input
                                    type="text"
                                    defaultValue="John"
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:border-brand-500 transition-colors outline-none h-10 shadow-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nachname</label>
                                <input
                                    type="text"
                                    defaultValue="Doe"
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:border-brand-500 transition-colors outline-none h-10 shadow-sm"
                                />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-Mail Adresse</label>
                                <input
                                    type="email"
                                    defaultValue="john@translater.office"
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:border-brand-500 transition-colors outline-none h-10 shadow-sm"
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                            <button className="px-5 py-2 bg-brand-700 text-white rounded text-sm font-medium hover:bg-brand-800 transition-all shadow-sm active:scale-95">
                                Änderungen speichern
                            </button>
                        </div>
                    </div>

                    {/* Password & Security */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                            <div className="w-7 h-7 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-xs">
                                <FaKey />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Sicherheit & Zugang</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50/30 rounded border border-slate-100">
                                <div className="min-w-0 pr-4">
                                    <p className="text-xs font-bold text-slate-800">Passwort ändern</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Zuletzt aktualisiert vor 3 Monaten</p>
                                </div>
                                <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-[10px] font-bold uppercase text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0">
                                    Bearbeiten
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50/30 rounded border border-slate-100">
                                <div className="min-w-0 pr-4">
                                    <p className="text-xs font-bold text-slate-800">Zwei-Faktor-Authentifizierung</p>
                                    <p className="text-[10px] text-red-500 font-bold uppercase mt-1 tracking-wider">Inaktiv</p>
                                </div>
                                <button className="px-3 py-1.5 bg-brand-700 text-white rounded text-[10px] font-bold uppercase transition-all shadow-sm shrink-0">
                                    Aktivieren
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
