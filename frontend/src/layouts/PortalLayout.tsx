import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Button, Drawer } from 'antd';
import {
  MenuOutlined,
  CloseOutlined,
  DashboardOutlined,
  ProjectOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { usePortal } from '../context/PortalContext';
import PortalGuard from '../components/portal/PortalGuard';

const navItems = [
  { to: '/portal', label: 'Dashboard', icon: <DashboardOutlined />, end: true },
  { to: '/portal/projects', label: 'Meine Projekte', icon: <ProjectOutlined />, end: false },
  { to: '/portal/invoices', label: 'Rechnungen', icon: <FileTextOutlined />, end: false },
  { to: '/portal/new-request', label: 'Neue Anfrage', icon: <PlusCircleOutlined />, end: false },
  { to: '/portal/profile', label: 'Mein Profil', icon: <UserOutlined />, end: false },
];

const NavItems: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-teal-700 text-white'
                : 'text-teal-100 hover:bg-teal-700 hover:text-white'
            }`
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </>
  );
};

const PortalLayout: React.FC = () => {
  const { customer, logout } = usePortal();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <PortalGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <header className="bg-teal-800 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden text-teal-100 hover:text-white p-1"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Menü öffnen"
                >
                  <MenuOutlined style={{ fontSize: 20 }} />
                </button>
                <span className="text-lg font-bold tracking-tight">Kundenportal</span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <NavItems />
              </nav>

              {/* User + Logout */}
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-sm text-teal-200 max-w-[160px] truncate">
                  {customer?.name}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-teal-100 hover:text-white text-sm px-2 py-1 rounded transition-colors"
                  title="Abmelden"
                >
                  <LogoutOutlined />
                  <span className="hidden sm:inline">Abmelden</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Drawer */}
        <Drawer
          title={
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-800">Kundenportal</span>
            </div>
          }
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={260}
          styles={{ body: { padding: '12px', background: '#0f5132' } }}
          headerStyle={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}
        >
          <nav className="flex flex-col gap-1">
            <NavItems onClose={() => setDrawerOpen(false)} />
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-teal-100 hover:bg-teal-700 hover:text-white transition-colors mt-4"
            >
              <LogoutOutlined />
              <span>Abmelden</span>
            </button>
          </nav>
        </Drawer>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Kundenportal &mdash; Translation Office
        </footer>
      </div>
    </PortalGuard>
  );
};

export default PortalLayout;
