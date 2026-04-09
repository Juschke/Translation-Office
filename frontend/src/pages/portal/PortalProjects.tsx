import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Spin, Alert, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { portalProjectService } from '../../api/services/portal';
import type { PortalProject } from '../../types/portal';

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

const formatCents = (cents?: number) =>
  cents != null ? (cents / 100).toFixed(2) + ' €' : '—';

const PortalProjects: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['portal-projects'],
    queryFn: portalProjectService.getAll,
  });

  const columns: ColumnsType<PortalProject> = [
    {
      title: 'Projekt',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => (
        <span className="font-medium text-slate-800">{title}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColor[status] ?? 'default'}>
          {statusLabel[status] ?? status}
        </Tag>
      ),
      responsive: ['sm'],
    },
    {
      title: 'Sprachenpaar',
      key: 'languages',
      render: (_, record) =>
        record.source_language && record.target_language
          ? `${record.source_language} → ${record.target_language}`
          : '—',
      responsive: ['md'],
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline?: string) =>
        deadline ? new Date(deadline).toLocaleDateString('de-DE') : '—',
      responsive: ['md'],
    },
    {
      title: 'Betrag',
      dataIndex: 'price',
      key: 'price',
      render: (price?: number) => formatCents(price),
      align: 'right',
      responsive: ['sm'],
    },
    {
      title: 'Erstellt am',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('de-DE'),
      responsive: ['lg'],
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Meine Projekte</h1>
        <p className="text-white/70 text-sm mt-1">
          Übersicht aller Ihrer Übersetzungsprojekte.
        </p>
      </div>

      <Card className="rounded-xl border border-slate-200 shadow-sm bg-white" styles={{ body: { padding: 0 } }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spin size="large" tip="Wird geladen..." />
          </div>
        ) : error ? (
          <div className="p-5">
            <Alert type="error" message="Projekte konnten nicht geladen werden." showIcon />
          </div>
        ) : (
          <Table
            dataSource={data ?? []}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
            onRow={(record) => ({
              onClick: () => navigate(`/portal/projects/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            locale={{ emptyText: 'Noch keine Projekte vorhanden.' }}
            className="portal-table"
          />
        )}
      </Card>
    </div>
  );
};

export default PortalProjects;
