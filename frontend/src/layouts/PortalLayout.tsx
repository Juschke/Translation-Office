import React, { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Drawer } from 'antd';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LogOut, Menu, User } from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import PortalGuard from '../components/portal/PortalGuard';

const navItems = [
  { to: '/portal', label: 'Start', end: true },
  { to: '/portal/projects', label: 'Meine Projekte', end: false },
  { to: '/portal/invoices', label: 'Rechnungen', end: false },
  { to: '/portal/new-request', label: 'Neue Anfrage', end: false },
];

const NavItems: React.FC<{ onClose?: () => void }> = ({ onClose }) => (
  <>
    {navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={onClose}
        className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
            isActive
              ? 'bg-white text-[#0e5a67]'
              : 'text-white/80 hover:bg-white/10 hover:text-white'
          }`
        }
      >
        <span>{item.label}</span>
      </NavLink>
    ))}
  </>
);

const PortalLayout: React.FC = () => {
  const { customer, logout } = usePortal();
  const { i18n } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousHeight = document.body.style.height;

    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.height = previousHeight;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }

      if (languageRef.current && !languageRef.current.contains(target)) {
        setLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (locale: 'de' | 'en') => {
    localStorage.setItem('locale', locale);
    void i18n.changeLanguage(locale);
    setLanguageOpen(false);
  };

  const displayName = customer?.company_name || `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim() || 'Portal';
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <PortalGuard>
      <div className="min-h-screen bg-[#0e5a67] text-slate-900">
        <header className="border-b border-white/10 bg-[#0e5a67] text-white">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                className="p-1 text-white/80 hover:text-white md:hidden"
                onClick={() => setDrawerOpen(true)}
                aria-label="Menü öffnen"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/portal" className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center bg-white text-[#0e5a67] font-bold">TO</span>
                <span className="text-lg font-normal tracking-tight">Serviceportal</span>
              </Link>
            </div>

            <nav className="hidden h-16 items-stretch md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-w-[148px] items-center justify-center px-5 text-sm transition-colors ${
                      isActive
                        ? 'bg-white text-[#0e5a67]'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block" ref={languageRef}>
                <button
                  type="button"
                  onClick={() => {
                    setLanguageOpen((current) => !current);
                    setProfileOpen(false);
                  }}
                  className="flex h-10 min-w-[78px] items-center justify-center gap-2 px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white"
                >
                  <span>{i18n.language.startsWith('de') ? 'DE' : 'EN'}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {languageOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 min-w-[150px] bg-white text-slate-800 shadow-lg">
                    <button
                      type="button"
                      onClick={() => changeLanguage('de')}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
                    >
                      <img src="https://flagcdn.com/w40/de.png" alt="Deutsch" className="h-4 w-6 object-cover" />
                      <span>Deutsch</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => changeLanguage('en')}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
                    >
                      <img src="https://flagcdn.com/w40/gb.png" alt="English" className="h-4 w-6 object-cover" />
                      <span>English</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((current) => !current);
                    setLanguageOpen(false);
                  }}
                  className="flex h-10 min-w-[190px] items-center justify-between gap-2 px-3 py-1.5 text-white hover:bg-white/10"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center bg-white text-xs font-bold text-[#0e5a67]">
                    {initials || 'TO'}
                  </span>
                  <span className="max-w-[120px] flex-1 truncate text-left text-sm text-white/85">{displayName}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 min-w-[210px] bg-white text-slate-800 shadow-lg">
                    <Link
                      to="/portal/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-500" />
                      <span>Mein Profil</span>
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4 text-slate-500" />
                      <span>Ausloggen</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <Drawer
          title={<span className="font-medium text-[#0e5a67]">Serviceportal</span>}
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={280}
          styles={{ body: { padding: 12, background: '#0e5a67' } }}
        >
          <nav className="flex flex-col gap-1">
            <NavItems onClose={() => setDrawerOpen(false)} />
            <Link
              to="/portal/profile"
              onClick={() => setDrawerOpen(false)}
              className="mt-4 block px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              <span>Mein Profil</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="block px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              <span>Ausloggen</span>
            </button>
          </nav>
        </Drawer>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-none bg-[#0e5a67] py-5 text-center text-xs text-white/60">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4">
            <span>&copy; {new Date().getFullYear()} Serviceportal</span>
            <a href="/landing-page/impressum.html" className="hover:text-white/90">Impressum</a>
            <a href="/landing-page/datenschutz.html" className="hover:text-white/90">Datenschutz</a>
            <a href="/landing-page/agb.html" className="hover:text-white/90">AGB</a>
          </div>
        </footer>
      </div>
    </PortalGuard>
  );
};

export default PortalLayout;
