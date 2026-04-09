import React from 'react';
import { Card, Tag, Spin, Alert, Table, Tooltip } from 'antd';
import { Download } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { portalInvoiceService } from '../../api/services/portal';
import { Button } from '../../components/ui/button';
import type { PortalInvoice } from '../../types/portal';

const formatCents = (cents: number) => `${(cents / 100).toFixed(2)} €`;

const statusLabel: Record<string, string> = {
  draft: 'Entwurf',
  issued: 'Ausgestellt',
  paid: 'Bezahlt',
  cancelled: 'Storniert',
  overdue: 'Überfällig',
};

const statusColor: Record<string, string> = {
  draft: 'default',
  issued: 'processing',
  paid: 'success',
  cancelled: 'error',
  overdue: 'warning',
};

const PortalInvoices: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['portal-invoices'],
    queryFn: portalInvoiceService.getAll,
  });

  const handleDownload = async (invoice: PortalInvoice) => {
    const toastId = toast.loading('PDF wird heruntergeladen...');
    try {
      const blob = await portalInvoiceService.download(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rechnung_${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('PDF heruntergeladen.', { id: toastId });
    } catch {
      toast.error('Download fehlgeschlagen. Bitte versuchen Sie es erneut.', { id: toastId });
    }
  };

  const columns: ColumnsType<PortalInvoice> = [
    {
      title: 'Rechnungsnummer',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (num: string) => <span className="font-medium text-slate-800">{num}</span>,
    },
    {
      title: 'Datum',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('de-DE'),
      responsive: ['sm'],
    },
    {
      title: 'Fällig am',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date?: string) => (date ? new Date(date).toLocaleDateString('de-DE') : '—'),
      responsive: ['md'],
    },
    {
      title: 'Projekt',
      key: 'project',
      render: (_, record) => record.project?.title ?? '—',
      responsive: ['lg'],
    },
    {
      title: 'Betrag',
      dataIndex: 'amount_gross',
      key: 'amount_gross',
      render: (amount: number) => <span className="font-semibold text-slate-700">{formatCents(amount)}</span>,
      align: 'right',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColor[status] ?? 'default'}>{statusLabel[status] ?? status}</Tag>,
      responsive: ['sm'],
    },
    {
      title: 'Aktionen',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="PDF herunterladen">
          <Button variant="secondary" size="sm" onClick={() => handleDownload(record)}>
            <Download className="h-4 w-4" />
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Rechnungen</h1>
        <p className="mt-1 text-sm text-slate-500">
          Alle Ihre Rechnungen auf einen Blick. PDFs können direkt heruntergeladen werden.
        </p>
      </div>

      <Card className="rounded-xl border border-slate-200 shadow-sm bg-white" styles={{ body: { padding: 0 } }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spin size="large" tip="Wird geladen..." />
          </div>
        ) : error ? (
          <div className="p-5">
            <Alert type="error" message="Rechnungen konnten nicht geladen werden." showIcon />
          </div>
        ) : (
          <Table
            dataSource={data ?? []}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
            locale={{ emptyText: 'Noch keine Rechnungen vorhanden.' }}
            className="portal-table"
          />
        )}
      </Card>
    </div>
  );
};

export default PortalInvoices;
