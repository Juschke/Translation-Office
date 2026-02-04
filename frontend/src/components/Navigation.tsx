import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBell, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { useState } from 'react';
import clsx from 'clsx';

const Navigation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    // Mock notifications state
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'Neue Rechnung bezahlt', message: 'Rechnung #2024-005 wurde von Kunde XY beglichen.', date: 'Vor 5 Min', read: false },
        { id: 2, title: 'Übersetzung geliefert', message: 'Partner S. Müller hat Dateien für P-2024-1002 hochgeladen.', date: 'Vor 2 Std', read: false },
        { id: 3, title: 'Neues Projekt erstellt', message: 'Projekt P-2024-1005 wurde erfolgreich angelegt.', date: 'Gestern', read: true },
    ]);

    const pendingNotifications = notifications.filter(n => !n.read).length;

    const isActive = (path: string) => location.pathname === path;

    const navLinkClass = (path: string) => clsx(
        "px-3 py-4 text-sm font-medium border-b-2 transition h-full flex items-center",
        isActive(path)
            ? "border-brand-500 text-white bg-brand-800/50"
            : "border-transparent text-slate-200 hover:bg-brand-800 hover:text-white"
    );

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const handleLogout = () => {
        // Clear auth state (mock)
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    return (
        <nav className="bg-brand-900 text-white shadow-md z-30 flex-none relative">
            <div className="w-full px-6">
                <div className="flex items-center justify-between h-14">
                    {/* Left Side: Logo + Main Menu */}
                    <div className="flex items-center h-full gap-8">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
                            <div className="bg-brand-500 w-8 h-8 rounded flex items-center justify-center font-bold text-white">TO</div>
                            <span className="font-semibold text-lg tracking-tight">Translater Office</span>
                        </Link>

                        {/* Main Menu */}
                        <div className="hidden md:flex space-x-1 h-full">
                            <Link to="/" className={navLinkClass("/")}>Dashboard</Link>
                            <Link to="/projects" className={navLinkClass("/projects")}>Projekte</Link>
                            <Link to="/customers" className={navLinkClass("/customers")}>Kunden</Link>
                            <Link to="/partners" className={navLinkClass("/partners")}>Partner</Link>
                            <Link to="/invoices" className={navLinkClass("/invoices")}>Rechnungen</Link>
                            <Link to="/inbox" className={navLinkClass("/inbox")}>
                                E-Mail <span className="bg-red-500 text-[10px] px-1.5 py-0.5 rounded-full ml-1 font-bold">3</span>
                            </Link>
                            <Link to="/reports" className={navLinkClass("/reports")}>Auswertung</Link>
                        </div>
                    </div>

                    {/* User Profile & Notifications */}
                    <div className="flex items-center gap-4 relative">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                className="text-slate-300 hover:text-white focus:outline-none cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                            >
                                <FaBell className="w-5 h-5" />
                                {pendingNotifications > 0 && (
                                    <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50 text-slate-800 origin-top-right dropdown-enter dropdown-enter-active">
                                    <div className="p-3 border-b border-slate-100 font-semibold text-sm flex justify-between">
                                        <span>Benachrichtigungen</span>
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs text-brand-600 hover:underline disabled:text-slate-400 cursor-pointer"
                                            disabled={pendingNotifications === 0}
                                        >
                                            Alle als gelesen
                                        </button>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar font-normal">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-slate-500">Keine Benachrichtigungen</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} className={clsx("block p-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer", !n.read ? "bg-brand-50/50" : "")}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="text-xs text-slate-400">{n.date}</div>
                                                        {!n.read && <div className="w-2 h-2 rounded-full bg-brand-500"></div>}
                                                    </div>
                                                    <p className={clsx("text-sm", !n.read ? "font-semibold" : "font-medium")}>{n.title}</p>
                                                    <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-2 text-center border-t border-slate-100">
                                        <Link
                                            to="/notifications"
                                            className="text-xs font-medium text-brand-700 hover:underline block w-full"
                                            onClick={() => setIsNotifOpen(false)}
                                        >
                                            Alle anzeigen
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Menu */}
                        <div className="relative">
                            <div
                                className="flex items-center gap-2 cursor-pointer focus:outline-none"
                                onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                            >
                                <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs border border-brand-500 text-white font-bold">JD</div>
                                <span className="text-sm hidden lg:block text-slate-200">John Doe (Admin)</span>
                                <FaChevronDown className={clsx("text-xs text-slate-400 transition-transform", isProfileOpen && "rotate-180")} />
                            </div>

                            {/* Profile Dropdown */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 text-slate-800 origin-top-right dropdown-enter dropdown-enter-active">
                                    <div className="p-3 border-b border-slate-100 font-normal text-left">
                                        <p className="text-sm font-semibold">John Doe</p>
                                        <p className="text-xs text-slate-500">john@translater.office</p>
                                    </div>
                                    <div className="py-1 font-normal">
                                        <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                            Profil
                                        </Link>
                                        <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                            Einstellungen
                                        </Link>
                                        <Link to="/billing" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                            Abonnement
                                        </Link>
                                    </div>
                                    <div className="border-t border-slate-100 py-1 font-normal">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center cursor-pointer"
                                        >
                                            <FaSignOutAlt className="mr-3" /> Log out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
