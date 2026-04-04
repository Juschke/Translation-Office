import { Link } from 'react-router-dom';
import { FaUser, FaUsers, FaCreditCard, FaCrown, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import type { UserRole } from '../../context/AuthContext';

interface ProfileMenuProps {
    user: any;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onLogout: () => void;
    hasMinRole: (role: UserRole) => boolean;
    dropdownRef: React.RefObject<HTMLDivElement | null>;
}

const ProfileMenu = ({
    user,
    isOpen,
    onToggle,
    onLogout,
    hasMinRole,
    dropdownRef
}: ProfileMenuProps) => {
    const { t } = useTranslation();

    const initials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
        : 'U';

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className="flex items-center gap-2 cursor-pointer focus:outline-none group"
                onClick={onToggle}
            >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] border border-white/10 text-white font-bold uppercase shadow-sm group-hover:bg-emerald-400 group-hover:text-emerald-950 transition-all">
                    {initials}
                </div>
                <FaChevronDown className={clsx("text-xs text-emerald-100/40 transition-transform", isOpen && "rotate-180")} />
            </div>

            {/* Profile Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-sm shadow-sm border border-slate-200 z-[9999999] text-slate-800 origin-top-right animate-slideUp">
                    <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-2xs text-white font-bold shrink-0 shadow-sm uppercase">
                            {initials}
                        </div>
                        <div className="overflow-hidden text-left">
                            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'Benutzer'}</p>
                            {user?.role && (
                                <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-700 text-2xs font-bold rounded-full mt-1 uppercase tracking-wider">
                                    {t(`settings.roles.${user.role}`) ?? user.role}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="py-1 font-normal text-left">
                        <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center">
                            <FaUser className="mr-3 text-slate-400 w-3.5 h-3.5" /> {t('nav.profile')}
                        </Link>
                        {hasMinRole('owner') && (
                            <Link to="/team" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center">
                                <FaUsers className="mr-3 text-slate-400 w-3.5 h-3.5" /> {t('nav.team')}
                            </Link>
                        )}
                        {hasMinRole('owner') && (
                            <Link to="/billing" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center">
                                <FaCreditCard className="mr-3 text-slate-400 w-3.5 h-3.5" /> {t('nav.subscription')}
                            </Link>
                        )}
                        {user?.is_admin && (
                            <a href="/admin" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm hover:bg-amber-50 text-amber-700 flex items-center border-t border-slate-50 mt-1">
                                <FaCrown className="mr-3 text-amber-500 w-3.5 h-3.5" /> Backend: Filament
                            </a>
                        )}
                    </div>
                    <div className="border-t border-slate-100 py-1 font-normal text-left">
                        <button
                            onClick={onLogout}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center cursor-pointer"
                        >
                            <FaSignOutAlt className="mr-3" /> {t('nav.logout')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileMenu;
