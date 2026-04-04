import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, notificationService, customerService, partnerService, projectService, calendarService } from '../api/services';
import toast from 'react-hot-toast';
import NewCustomerModal from './modals/NewCustomerModal';
import NewPartnerModal from './modals/NewPartnerModal';
import NewProjectModal from './modals/NewProjectModal';
import NewAppointmentModal from './modals/NewAppointmentModal';

// Sub-components
import NotificationDropdown from './navigation/NotificationDropdown';
import LanguageSwitcher from './navigation/LanguageSwitcher';
import ProfileMenu from './navigation/ProfileMenu';
import DesktopLinks from './navigation/DesktopLinks';
import MobileMenu from './navigation/MobileMenu';

const Navigation = () => {
    const { user, logout, hasMinRole } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Menu States
    const [isProjectsOpen, setIsProjectsOpen] = useState(false);
    const [isCustomersOpen, setIsCustomersOpen] = useState(false);
    const [isPartnersOpen, setIsPartnersOpen] = useState(false);
    const [isInvoicesOpen, setIsInvoicesOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Modal States
    const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
    const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
    const [isNewPartnerOpen, setIsNewPartnerOpen] = useState(false);
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);

    // Refs for Click-Outside
    const projectsRef = useRef<HTMLDivElement>(null);
    const customersRef = useRef<HTMLDivElement>(null);
    const partnersRef = useRef<HTMLDivElement>(null);
    const invoicesRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);

    const closeAllDropdowns = () => {
        setIsProjectsOpen(false);
        setIsCustomersOpen(false);
        setIsPartnersOpen(false);
        setIsInvoicesOpen(false);
        setIsCalendarOpen(false);
        setIsSettingsOpen(false);
        setIsProfileOpen(false);
        setIsNotifOpen(false);
        setIsLangOpen(false);
    };

    // Close all menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (projectsRef.current && !projectsRef.current.contains(target)) setIsProjectsOpen(false);
            if (customersRef.current && !customersRef.current.contains(target)) setIsCustomersOpen(false);
            if (partnersRef.current && !partnersRef.current.contains(target)) setIsPartnersOpen(false);
            if (invoicesRef.current && !invoicesRef.current.contains(target)) setIsInvoicesOpen(false);
            if (calendarRef.current && !calendarRef.current.contains(target)) setIsCalendarOpen(false);
            if (settingsRef.current && !settingsRef.current.contains(target)) setIsSettingsOpen(false);
            if (profileRef.current && !profileRef.current.contains(target)) setIsProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(target)) setIsNotifOpen(false);
            if (langRef.current && !langRef.current.contains(target)) setIsLangOpen(false);
            if (isMobileMenuOpen && navRef.current && !navRef.current.contains(target)) setIsMobileMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen]);

    // Close all menus on navigation
    useEffect(() => {
        setIsMobileMenuOpen(false);
        closeAllDropdowns();
    }, [location]);

    // Data Queries
    const { data: dashboardData } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: dashboardService.getStats,
        refetchInterval: 10000,
    });

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationService.getAll,
        refetchInterval: 10000,
    });

    // Create Mutations
    const createCustomerMutation = useMutation({
        mutationFn: (data: any) => customerService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsNewCustomerOpen(false);
            toast.success('Kunde erfolgreich erstellt');
        },
        onError: () => toast.error('Fehler beim Erstellen des Kunden'),
    });

    const createPartnerMutation = useMutation({
        mutationFn: (data: any) => partnerService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            setIsNewPartnerOpen(false);
            toast.success('Partner erfolgreich erstellt');
        },
        onError: () => toast.error('Fehler beim Erstellen des Partners'),
    });

    const createProjectMutation = useMutation({
        mutationFn: (data: any) => projectService.create(data),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setIsNewProjectOpen(false);
            toast.success('Projekt erfolgreich erstellt');
            if (res?.data?.id) navigate(`/projects/${res.data.id}`);
        },
        onError: () => toast.error('Fehler beim Erstellen des Projekts'),
    });

    const createAppointmentMutation = useMutation({
        mutationFn: (data: any) => calendarService.createAppointment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            setIsNewAppointmentOpen(false);
            toast.success('Termin erfolgreich erstellt');
        },
        onError: () => toast.error('Fehler beim Erstellen des Termins'),
    });

    // Mutations
    const markAllAsReadMutation = useMutation({
        mutationFn: notificationService.markAllAsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationService.markAsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    });

    // Handlers
    const handleNotificationClick = (notification: any) => {
        if (!notification.read_at) markAsReadMutation.mutate(notification.id);
        if (notification.data?.project_id) {
            navigate(`/projects/${notification.data.project_id}`);
            setIsNotifOpen(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;
    const unreadEmails = dashboardData?.stats?.unread_emails || 0;
    const pendingNotifications = notifications.filter((n: any) => !n.read_at).length;

    return (
        <nav ref={navRef} className="bg-brand-primary text-white border-b border-white/10 flex-none sticky top-0 z-50 transition-all shadow-md">
            <div className="w-full px-4 sm:px-6">
                <div className="flex items-center justify-between h-12">
                    {/* Left Side: Logo + Main Menu */}
                    <div className="flex items-center h-full gap-4 lg:gap-6">
                        <Link to="/" className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
                            <div className="bg-white w-8 h-8 rounded-sm flex items-center justify-center font-bold text-brand-primary shadow-sm">TO</div>
                            <span className="font-bold text-base tracking-tight hidden lg:inline text-white">Translator Office</span>
                        </Link>

                        <DesktopLinks
                            location={location}
                            dashboardData={dashboardData}
                            unreadEmails={unreadEmails}
                            hasMinRole={hasMinRole}
                            isProjectsOpen={isProjectsOpen}
                            setIsProjectsOpen={setIsProjectsOpen}
                            isCustomersOpen={isCustomersOpen}
                            setIsCustomersOpen={setIsCustomersOpen}
                            isPartnersOpen={isPartnersOpen}
                            setIsPartnersOpen={setIsPartnersOpen}
                            isInvoicesOpen={isInvoicesOpen}
                            setIsInvoicesOpen={setIsInvoicesOpen}
                            isCalendarOpen={isCalendarOpen}
                            setIsCalendarOpen={setIsCalendarOpen}
                            isSettingsOpen={isSettingsOpen}
                            setIsSettingsOpen={setIsSettingsOpen}
                            projectsRef={projectsRef}
                            customersRef={customersRef}
                            partnersRef={partnersRef}
                            invoicesRef={invoicesRef}
                            calendarRef={calendarRef}
                            settingsRef={settingsRef}
                            navigate={navigate}
                            closeAllDropdowns={closeAllDropdowns}
                            onNewProject={() => { closeAllDropdowns(); setIsNewProjectOpen(true); }}
                            onNewCustomer={() => { closeAllDropdowns(); setIsNewCustomerOpen(true); }}
                            onNewPartner={() => { closeAllDropdowns(); setIsNewPartnerOpen(true); }}
                            onNewAppointment={() => { closeAllDropdowns(); setIsNewAppointmentOpen(true); }}
                        />
                    </div>

                    {/* Right Side: Lang, Notif, Profile, Mobile Toggle */}
                    <div className="flex items-center gap-3 relative">
                        <NotificationDropdown
                            isOpen={isNotifOpen}
                            onToggle={(e) => { e.stopPropagation(); setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                            notifications={notifications}
                            pendingNotifications={pendingNotifications}
                            onMarkAllRead={() => markAllAsReadMutation.mutate()}
                            onNotificationClick={handleNotificationClick}
                            dropdownRef={notifRef}
                        />

                        <LanguageSwitcher
                            isOpen={isLangOpen}
                            onToggle={() => { setIsLangOpen(!isLangOpen); setIsNotifOpen(false); setIsProfileOpen(false); }}
                            dropdownRef={langRef}
                        />

                        <ProfileMenu
                            user={user}
                            isOpen={isProfileOpen}
                            onToggle={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                            onLogout={handleLogout}
                            hasMinRole={hasMinRole}
                            dropdownRef={profileRef}
                        />

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-white hover:text-emerald-400 xl:hidden"
                            aria-label="Menü öffnen"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <div className="w-5 h-4 flex flex-col justify-between">
                                <span className={clsx("h-0.5 bg-current transition-all", isMobileMenuOpen ? "rotate-45 translate-y-1.5" : "")}></span>
                                <span className={clsx("h-0.5 bg-current transition-all", isMobileMenuOpen ? "opacity-0" : "")}></span>
                                <span className={clsx("h-0.5 bg-current transition-all", isMobileMenuOpen ? "-rotate-45 -translate-y-2" : "")}></span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                isActive={isActive}
                hasMinRole={hasMinRole}
                dashboardData={dashboardData}
                unreadEmails={unreadEmails}
            />

            <NewProjectModal
                isOpen={isNewProjectOpen}
                onClose={() => setIsNewProjectOpen(false)}
                onSubmit={(data: any) => createProjectMutation.mutate(data)}
                isLoading={createProjectMutation.isPending}
            />
            <NewCustomerModal
                isOpen={isNewCustomerOpen}
                onClose={() => setIsNewCustomerOpen(false)}
                onSubmit={(data: any) => createCustomerMutation.mutate(data)}
                isLoading={createCustomerMutation.isPending}
            />
            <NewPartnerModal
                isOpen={isNewPartnerOpen}
                onClose={() => setIsNewPartnerOpen(false)}
                onSubmit={(data: any) => createPartnerMutation.mutate(data)}
                isLoading={createPartnerMutation.isPending}
            />
            <NewAppointmentModal
                isOpen={isNewAppointmentOpen}
                onClose={() => setIsNewAppointmentOpen(false)}
                onSubmit={(data: any) => createAppointmentMutation.mutate(data)}
                isLoading={createAppointmentMutation.isPending}
            />
        </nav>
    );
};

export default Navigation;
