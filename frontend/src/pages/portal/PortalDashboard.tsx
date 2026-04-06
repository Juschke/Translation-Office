import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Tag, Spin, Alert } from 'antd';
import {
  ProjectOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  MessageOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { portalDashboardService } from '../../api/services/portal';
import { usePortal } from '../../context/PortalContext';
import type { PortalProject, PortalInvoice } from '../../types/portal';

const formatCents = (cents: number) => (cents / 100).toFixed(2) + ' €';

const statusLabel: Record<string, string> = {
  draft: 'Entwurf',
  pending: 'In Bearbeitung',
  offer: 'Angebot',
  quote_sent: 'Angebot versandt',
  in_progress: 'In Bearbeitung',
  review: 'In Prüfung',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
};

const statusColor: Record<string, string> = {
  draft: 'default',
  pending: 'processing',
  offer: 'gold',
  quote_sent: 'blue',
  in_progress: 'processing',
  review: 'purple',
  completed: 'success',
  cancelled: 'error',
};

const invoiceStatusLabel: Record<string, string> = {
  draft: 'Entwurf',
  issued: 'Ausgestellt',
  paid: 'Bezahlt',
  cancelled: 'Storniert',
  overdue: 'Überfällig',
};

const invoiceStatusColor: Record<string, string> = {
  draft: 'default',
  issued: 'processing',
  paid: 'success',
  cancelled: 'error',
  overdue: 'warning',
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  to: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, to }) => (
  <Link to={to}>
    <Card
      className="rounded-xl border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
      styles={{ body: { padding: '1.25rem' } }}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
          <div className="text-sm text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  </Link>
);

const PortalDashboard: React.FC = () => {
  const { customer } = usePortal();
  const { data, isLoading, error } = useQuery({
    queryKey: ['portal-dashboard'],
    queryFn: portalDashboardService.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin size="large" tip="Wird geladen..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert
        type="error"
        message="Dashboard konnte nicht geladen werden."
        showIcon
        className="max-w-lg"
      />
    );
  }

  const { stats, recent_projects, recent_invoices } = data;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Willkommen, {customer?.name?.split(' ')[0]}!
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Hier finden Sie eine Übersicht Ihrer aktuellen Projekte und Rechnungen.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ProjectOutlined />}
          label="Offene Projekte"
          value={stats.open_projects}
          color="bg-teal-50 text-teal-700"
          to="/portal/projects"
        />
        <StatCard
          icon={<CheckCircleOutlined />}
          label="Abgeschlossene Projekte"
          value={stats.completed_projects}
          color="bg-green-50 text-green-700"
          to="/portal/projects"
        />
        <StatCard
          icon={<FileTextOutlined />}
          label="Offene Rechnungen"
          value={stats.unpaid_invoices}
          color="bg-amber-50 text-amber-700"
          to="/portal/invoices"
        />
        <StatCard
          icon={<MessageOutlined />}
          label="Offene Nachrichten"
          value={stats.open_messages}
          color="bg-blue-50 text-blue-700"
          to="/portal/projects"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card
          className="rounded-xl border border-slate-200 shadow-sm bg-white"
          title={
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Aktuelle Projekte</span>
              <Link
                to="/portal/projects"
                className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1"
              >
                Alle anzeigen <ArrowRightOutlined />
              </Link>
            </div>
          }
          styles={{ body: { padding: 0 } }}
        >
          {recent_projects.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">
              Noch keine Projekte vorhanden.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent_projects.map((project: PortalProject) => (
                <li key={project.id}>
                  <Link
                    to={`/portal/projects/${project.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {project.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {project.source_language && project.target_language
                          ? `${project.source_language} → ${project.target_language}`
                          : ''}
                      </div>
                    </div>
                    <Tag color={statusColor[project.status] ?? 'default'} className="ml-3 shrink-0">
                      {statusLabel[project.status] ?? project.status}
                    </Tag>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent Invoices */}
        <Card
          className="rounded-xl border border-slate-200 shadow-sm bg-white"
          title={
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Aktuelle Rechnungen</span>
              <Link
                to="/portal/invoices"
                className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1"
              >
                Alle anzeigen <ArrowRightOutlined />
              </Link>
            </div>
          }
          styles={{ body: { padding: 0 } }}
        >
          {recent_invoices.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">
              Noch keine Rechnungen vorhanden.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent_invoices.map((invoice: PortalInvoice) => (
                <li key={invoice.id}>
                  <Link
                    to="/portal/invoices"
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">
                        {invoice.invoice_number}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(invoice.date).toLocaleDateString('de-DE')}
                        {invoice.project ? ` · ${invoice.project.title}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="text-sm font-semibold text-slate-700">
                        {formatCents(invoice.amount_gross)}
                      </span>
                      <Tag color={invoiceStatusColor[invoice.status] ?? 'default'}>
                        {invoiceStatusLabel[invoice.status] ?? invoice.status}
                      </Tag>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PortalDashboard;
